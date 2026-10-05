import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';
import { confirmDialog, dialogOf, receiveInQueue } from './_ch10.mjs';
import {
  createTransferToQc,
  gotoInAppSafe,
  moveTransferToQc,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 情境目錄 10.8、10.9：點收佇列（/production-floor/receiving）以轉交單為列，不分所有與我的，
// 只列目的站在目前人員所屬產線的已送達與已點收的單（點收後列留著），看得到就能點收與修改。
// 點收對話框每條明細一列，點收數量預設帶搬運數量；點收即到料放行，到料量取點收數量。
// 起點資料：鏈二 TT-20260830-002（目的站點手工產線、已送達、一條明細 1,190）、
// 鏈外 TT-20260827-002（目的站點手工產線、已送達、兩條明細 200 與 300）；其餘十三張已點收。

test('10.8 點收佇列以轉交單為列，依所屬產線過濾（原編號 93）', async ({ page }) => {
  test.setTimeout(180_000);
  // 前置：生管對鏈四 PT-0820-9 建一張到品檢站的轉交單，負責廠務開始搬運並抵達站點
  await openAs(page, '生管', '/production-floor/pending-moves');
  await createTransferToQc(page);
  await moveTransferToQc(page);

  // 師傅劉阿海：所屬產線為數位產線與裝訂產線，手工產線的兩張與品檢站那一張都不在
  await switchRoleSafe(page, '師傅');
  await gotoInAppSafe(page, '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
  await expect(page.getByText('TT-20260827-002')).toHaveCount(0);
  await expect(page.getByText('品檢站', { exact: true })).toHaveCount(0);
  // 沒有勾選欄與批次點收
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);

  // 品檢人員郭淑芬：只看得到品檢站那一張，有點收
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
  await expect(page.getByText('TT-20260827-002')).toHaveCount(0);
  const rows = page.locator('tbody > tr.ant-table-row');
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) await expect(rows.nth(i)).toContainText('品檢站');
  // 剛送達的那一張（已送達）有點收；鏈四既有送品檢站的單已點收，操作為修改
  await expect(rows.filter({ hasText: '已送達' })).toHaveCount(1);
  await expect(rows.filter({ hasText: '已送達' }).getByRole('button', { name: '點收' })).toBeVisible();

  // 生管許文傑：所屬產線含手工產線、不含品檢站；兩張已送達的手工產線單有點收，已點收的單有修改
  await switchRoleSafe(page, '生管');
  await gotoInAppSafe(page, '/production-floor/receiving');
  await expect(page.locator('tr.ant-table-row').filter({ hasText: '品檢站' })).toHaveCount(0);
  for (const no of ['TT-20260830-002', 'TT-20260827-002']) {
    await expect(page.locator('tr.ant-table-row', { hasText: no }).getByRole('button', { name: '點收' })).toBeVisible();
  }
  await expect(
    page.locator('tr.ant-table-row', { hasText: 'TT-20260831-008' }).getByRole('button', { name: '修改' }),
  ).toBeVisible();

  // 點收狀態篩選：只看未點收剩兩張已送達的單；只看已點收不含 TT-20260830-002
  const statusSelect = page.locator('.ant-col', { hasText: '點收狀態' }).locator('.ant-select');
  await statusSelect.click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().locator('.ant-select-item-option', { hasText: '只看未點收' }).click();
  await expect(rows).toHaveCount(2);
  await statusSelect.click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().locator('.ant-select-item-option', { hasText: '只看已點收' }).click();
  await expect(page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' })).toHaveCount(0);
  await page.getByRole('button', { name: /清空/ }).click();

  // 點收對話框每條明細一列，點收數量預設帶搬運數量、可改
  const row = page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' });
  await row.getByRole('button', { name: '點收' }).click();
  let dialog = dialogOf(page, '點收');
  for (const header of ['印件', '生產任務', '搬運數量', '點收數量', '簽收照片']) {
    await expect(dialog.getByRole('columnheader', { name: header })).toBeVisible();
  }
  const posterInput = dialog.locator('tr', { hasText: '海報四色印刷' }).locator('.ant-input-number-input');
  await expect(posterInput).toHaveValue(/^1,?190$/);
  await expect(posterInput).toBeEditable();
  await confirmDialog(dialog);
  await expect(page.getByText(/已點收 TT-20260830-002/)).toBeVisible();
  // 點收後列留著：狀態改已點收、操作改為修改
  await expect(row).toContainText('已點收');
  await expect(row.getByRole('button', { name: '修改' })).toBeVisible();

  // TT-20260827-002 的點收對話框列出內卡 200 與信封 300 兩條
  await page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' }).getByRole('button', { name: '點收' }).click();
  dialog = dialogOf(page, '點收');
  await expect(dialog.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input')).toHaveValue(/^200$/);
  await expect(dialog.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input')).toHaveValue(/^300$/);
});

// 業務的選單沒有點收佇列，無路可達，以整頁載入驗：業務沒有所屬產線，佇列是空的
test('10.8（業務空佇列）業務沒有所屬產線，點收佇列是空的並提示依所屬產線過濾（原編號 93）', async ({ page }) => {
  await openAs(page, '業務', '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
  await expect(page.getByText(/目前沒有送到你所屬產線的貨/)).toBeVisible();
  await expect(page.getByRole('button', { name: '點收' })).toHaveCount(0);
});

test('10.9 點收就是到料放行，下游可以開工（原編號 94）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  let pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  let subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow).toContainText('0／3,000'); // 點收前可做量 0／3,000

  // 生管代點收，點收量照實填 1,190（到料量取點收量）
  await receiveInQueue(page, 'TT-20260830-002', { 海報四色印刷: 1190 });
  await expect(
    page.getByText(/已點收 TT-20260830-002；手工產線的到料量加 1,190，下游可開工/),
  ).toBeVisible();

  await gotoInApp(page, '/production-floor/work-packages');
  pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow).toContainText('1,190／3,000'); // 點收 1,190 後可做量 1,190／3,000

  // 代該任務報工：投入 1,190、良品 1,180、不良品 10
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
});
