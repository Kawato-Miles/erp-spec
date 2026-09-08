import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 借用專案既有檔案當簽收照上傳素材，Upload 的 beforeUpload 一律回 false（只暫存不上傳）
const FAKE_PHOTO = path.resolve(HERE, '../../../package.json');

// 情境目錄第十章：跨頁面的完整鏈路（報工 → 轉交 → 點收 → 再報工），驗到工單、印件、訂單三層狀態。

// 前置：主管把 WO-2026-0815 四筆任務全部派入同一個工作包（指派師傅劉阿海）
const dispatchAllTasks = async (page) => {
  await openAs(page, '主管', '/production-floor/dispatch');
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    await rows.nth(i).locator('input[type="checkbox"]').check({ force: true });
  }
  await page.getByRole('button', { name: /派工（4）/ }).click();
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter'); // MASTER_OPTIONS[0] = 劉阿海
  await page.getByRole('button', { name: '確認派工' }).click();
  await expect(page.getByText(/已建立工作包/)).toBeVisible();
};

// 主管在工作包頁對指定任務報一筆工（投入＝良品＝qty、不良 0）
const reportTask = async (page, taskName, qty) => {
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: taskName });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill(String(qty));
  await inputs.nth(1).fill(String(qty));
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();
};

// 主管在待搬視圖對指定任務建轉交單（帶當下可搬全量）→ 廠務開始搬運並附照抵達站點 → 主管代點收
const transferAndReceive = async (page, taskName) => {
  await gotoInApp(page, '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: taskName });
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(/已建立.*交由廠務搬運/);
  await expect(toast).toBeVisible();
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr', { hasText: ticketNo });
  await ticketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
  await ticketRow.getByRole('button', { name: '抵達站點' }).click();
  await page.locator('input[type="file"]').setInputFiles(FAKE_PHOTO);
  await page.getByRole('button', { name: '抵達站點' }).last().click();
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();

  await switchRole(page, '主管');
  await gotoInApp(page, '/production-floor/receiving');
  const queueRow = page.locator('tr', { hasText: ticketNo });
  await queueRow.getByRole('button', { name: '點收' }).click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收/).last()).toBeVisible();
};

test('10.14 最後一筆報工把工單、印件、訂單一路推到製作完成（原編號 138）', async ({ page }) => {
  test.setTimeout(90_000);
  await dispatchAllTasks(page);

  // 材料備料先報完（2,060）→ 該任務完成，但工單旗下還有任務未完成，不向上反映
  await reportTask(page, '牛皮紙 150g 備料', 2060);
  await gotoInApp(page, '/work-orders');
  await page.getByText('WO-2026-0815', { exact: true }).click();
  await expect(page.getByText('工單已交付')).toHaveCount(0); // 已因首次報工轉製作中
  await expect(page.getByText('製作中').first()).toBeVisible();

  await transferAndReceive(page, '牛皮紙 150g 備料');
  await reportTask(page, '五色印刷', 2060);
  await transferAndReceive(page, '五色印刷');
  await reportTask(page, '軋盒成型', 2000);

  // 最後一筆：糊盒成型（前置軋盒成型不需轉交，到料量取它報出的累計良品 2,000，不必再走轉交點收）
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: '糊盒成型' });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('2000');
  await inputs.nth(1).fill('2000');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(
    page.getByText(/工單全部完成向上反映：印件「牛皮紙手提袋」印製狀態轉「製作完成」；訂單 ORD-2026-0815 轉「製作完成」/),
  ).toBeVisible();

  // 訂單詳情：印件列、訂單狀態與活動紀錄
  await gotoInApp(page, '/orders');
  await page.getByText('ORD-2026-0815', { exact: true }).click();
  await expect(page.getByText('製作完成').first()).toBeVisible();
  await page.getByRole('tab', { name: '活動紀錄' }).click();
  await expect(page.getByText(/工單全部完成/)).toBeVisible(); // 活動紀錄留一筆
});

test('10.11 一批貨從報工走到可出貨的全鏈（原編號 105）', async ({ page }) => {
  test.setTimeout(60_000);
  // 起點：鏈二 TT-20260830-002（裁切站待點收，來源 pt-0710-2 海報四色印刷）
  await openAs(page, '主管', '/production-floor/receiving');
  await page.locator('tr', { hasText: 'TT-20260830-002' }).getByRole('button', { name: '點收' }).click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收/).last()).toBeVisible();

  // 裁切站到料量由 0 變成點收量，裁切成型任務可以報工了
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '李榮發' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: '裁切成型' });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('1190');
  await inputs.nth(1).fill('1180');
  await inputs.nth(2).fill('10');
  await taskRow.locator('.ant-select').last().click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 該印件首次出現在品檢待驗清單，建轉交單到品檢站、廠務搬運、點收（主管代點收，FLOOR_MANAGER_ROLES 可代）
  await transferAndReceive(page, '裁切成型');

  await switchRole(page, '品檢人員');
  await gotoInApp(page, '/qc-shipping/inspection');
  await page.getByRole('button', { name: '驗收' }).last().click();
  await page.getByRole('spinbutton', { name: '* 通過數量' }).fill('1180');
  await page.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收：通過 1,180/)).toBeVisible();

  // 印件詳情與工廠總覽指標同步變動
  await switchRole(page, '印務');
  await gotoInApp(page, '/print-items');
  await page.getByText('品牌形象海報 A2', { exact: true }).click();
  await expect(page.getByText('1,180').first()).toBeVisible(); // 完工良品數
});
