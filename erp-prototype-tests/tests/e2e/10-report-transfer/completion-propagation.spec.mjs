import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄第十章：報工向上反映鏈（工單 → 印件 → 訂單）與完成判定。
// 起點資料：鏈三 WO-2026-0815（工單已交付、四筆任務待派工，客戶好日子烘焙坊，訂單 ORD-2026-0815）。

// 前置：生管把 WO-2026-0815 四筆任務全部派入同一個工作包（指派師傅劉阿海），回到共同起點。
const dispatchAllTasks = async (page) => {
  await openAs(page, '生管', '/production-floor/dispatch');
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

test('10.12 首次報工把上游三層一起推進，已收尾的不被拉回（原編號 107）', async ({ page }) => {
  await dispatchAllTasks(page);

  await switchRole(page, '師傅');
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();

  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: '牛皮紙 150g 備料' });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('500'); // 生產數量
  await inputs.nth(1).fill('500'); // 良品
  await page.getByRole('button', { name: '送出報工' }).click();

  await expect(page.getByText('已送出 1 筆報工')).toBeVisible();
  await expect(
    page.getByText(/首次報工向上反映：印件「牛皮紙手提袋」印製狀態轉「製作中」；訂單 ORD-2026-0815 轉「製作中」/),
  ).toBeVisible();

  // 工單本身由「工單已交付」轉「製作中」
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await page.getByText('WO-2026-0815', { exact: true }).click();
  await expect(page.getByText('製作中').first()).toBeVisible();
});

test('10.15 完成判定一律取生產數量（投入）累計（原編號 159）', async ({ page }) => {
  await dispatchAllTasks(page);
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();

  // 第一筆報 500（未達標 2,060）
  await pkgRow.getByRole('button', { name: '報工' }).click();
  let dialog = page.locator('.ant-modal-body');
  let taskRow = dialog.locator('tr', { hasText: '牛皮紙 150g 備料' });
  let inputs = taskRow.locator('input');
  await inputs.nth(0).fill('500');
  await inputs.nth(1).fill('500');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工')).toBeVisible();

  await pkgRow.getByLabel('展開行').click();
  const subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  const taskSubRow = subRow.locator('tr', { hasText: '牛皮紙 150g 備料' });
  await expect(taskSubRow.getByText('待處理')).toHaveCount(0); // 已有報工，脫離待處理
  await expect(taskSubRow).toContainText('500 / 2,060');

  // 第二筆報 1,560，累計 2,060 達標 → 已完成
  await pkgRow.getByRole('button', { name: '報工' }).click();
  dialog = page.locator('.ant-modal-body');
  taskRow = dialog.locator('tr', { hasText: '牛皮紙 150g 備料' });
  inputs = taskRow.locator('input');
  await inputs.nth(0).fill('1560');
  await inputs.nth(1).fill('1560');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();
  await expect(taskSubRow).toContainText('2,060 / 2,060');
  await expect(taskSubRow.getByText('已完成')).toBeVisible();
});

test('10.16 生管手動把做不滿的任務標為完成（原編號 160，正流程半）', async ({ page }) => {
  await dispatchAllTasks(page);
  await gotoInApp(page, '/production-floor/work-packages');
  let pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: '牛皮紙 150g 備料' });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('1500');
  await inputs.nth(1).fill('1500');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工')).toBeVisible();

  // 說明：catalog 原描述「印務身分看不到手動完成欄」，與 permissions.js canManuallyCompleteTask
  // 明文（FLOOR_MANAGER_ROLES＝生管、印務、印務主管、主管皆可）及全庫一致的註解不符，
  // 判斷是 catalog 撰寫時的筆誤；本測試改驗證與程式碼一致、且各處反覆確認過的口徑——
  // 手動完成限生管、印務、印務主管、主管，師傅不可用。
  await switchRole(page, '師傅');
  pkgRow = page.locator('.ant-table-row', { hasText: '劉阿海' }).first();
  await pkgRow.getByLabel('展開行').click(); // 展開一次即可，切角色不重載頁面、展開狀態會保留
  const subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow.getByRole('button', { name: '手動完成' })).toHaveCount(0);

  // 生管對製作中的任務點「手動完成」（沿用同一列展開狀態，不再點一次展開圖示以免收合回去）
  await switchRole(page, '生管');
  const taskSubRow = subRow.locator('tr', { hasText: '牛皮紙 150g 備料' });
  await taskSubRow.getByRole('button', { name: '手動完成' }).click();
  await expect(page.getByText(/已手動完成（目標數量與放損率不變、已報工數不動，歷程已留痕）/)).toBeVisible();
  await expect(taskSubRow.getByText('已完成')).toBeVisible();
  await expect(taskSubRow).toContainText('1,500 / 2,060'); // 已報工數不動、目標數量不變
});
