import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// 借用專案既有檔案當簽收照上傳素材，Upload 的 beforeUpload 一律回 false（只暫存不上傳）
const FAKE_PHOTO = path.resolve(HERE, '../../../package.json');

// 情境目錄 10.19：同站下一台機台的任務要等上一道報出良品才有報工入口。
// 起點資料：鏈三 WO-2026-0815 的「軋盒成型」（不需轉交，與下游糊盒機同屬手工線後加工產線）
// 與「糊盒成型」。前置：把四筆任務派入同一個工作包，並把備料、五色印刷兩道跑完（各報工、轉交、
// 點收），讓軋盒成型拿到料——這一段沿用第十章全鏈測試的同一組動作。

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

const reportTask = async (page, taskName, qty) => {
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const inputs = dialog.locator('tr', { hasText: taskName }).locator('input');
  await inputs.nth(0).fill(String(qty));
  await inputs.nth(1).fill(String(qty));
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();
};

// 展開母列：AntD 的展開狀態在頁內導覽後仍留著，已展開時再點一次會收合回去
const expandPackageRow = async (pkgRow) => {
  const toggle = pkgRow.getByLabel('展開行');
  if ((await toggle.count()) > 0) await toggle.click();
};

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
  await page.locator('tr', { hasText: ticketNo }).getByRole('button', { name: '點收' }).click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收/).last()).toBeVisible();
};

test('10.19 同站下一台機台的任務要等上一道報出良品才有報工入口', async ({ page }) => {
  test.setTimeout(90_000);
  await dispatchAllTasks(page);

  // 前半段（需轉交的兩道）：報工 → 建轉交單 → 搬運 → 點收，讓軋盒成型的料到位
  await reportTask(page, '牛皮紙 150g 備料', 2060);
  await transferAndReceive(page, '牛皮紙 150g 備料');
  await reportTask(page, '五色印刷', 2060);
  await transferAndReceive(page, '五色印刷');

  await gotoInApp(page, '/production-floor/work-packages');
  let pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await expandPackageRow(pkgRow);
  let subRow = pkgRow.locator('xpath=following-sibling::tr[1]');

  // 軋盒成型料已到（點收 2,060），該列有報工；糊盒成型的前置不需轉交，
  // 到料量取軋盒成型的累計良品——一筆都還沒報，可做量 0／2,000、沒有報工入口
  const millRow = subRow.locator('tr', { hasText: '軋盒成型' }).first();
  await expect(millRow.getByRole('button', { name: '報工' })).toHaveCount(1);
  const glueRow = subRow.locator('tr', { hasText: '糊盒成型' }).first();
  await expect(glueRow.getByText('0／2,000')).toBeVisible();
  await expect(glueRow.getByRole('button', { name: '報工' })).toHaveCount(0);
  await expect(glueRow.getByRole('button', { name: /檢視歷程/ })).toHaveCount(1);

  // 軋盒成型報出 1,200 良品（沒有搬運這一段）→ 糊盒成型的可做量變成 1,200，報工入口出現
  await reportTask(page, '軋盒成型', 1200);
  await gotoInApp(page, '/production-floor/work-packages');
  pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await expandPackageRow(pkgRow);
  subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  const glueRowAfter = subRow.locator('tr', { hasText: '糊盒成型' }).first();
  await expect(glueRowAfter.getByText('1,200／2,000')).toBeVisible();
  await expect(glueRowAfter.getByRole('button', { name: '報工' })).toHaveCount(1);

  // 點下去的對話框只帶這一筆任務
  await glueRowAfter.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  await expect(dialog).toContainText('糊盒成型');
  await expect(dialog.locator('tbody tr.ant-table-row')).toHaveCount(1);
});
