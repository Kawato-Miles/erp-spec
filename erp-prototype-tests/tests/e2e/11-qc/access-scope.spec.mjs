import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { expandedRecords, pendingRow, switchRoleSafe } from './_setup.mjs';

// 單據權責修正第五批（OpenSpec change document-access-scope-alignment）：品檢待驗清單與品檢紀錄的可見範圍依活動清單。
// 待驗清單：品檢人員、印務主管、Supervisor 全公司；印務看自己負責工單；被分享工單的人看該單。
// 品檢紀錄：另含揀貨與出貨人員全公司、業務與諮詢看自己負責或被分享訂單（只列已有品檢紀錄的印件，不給待驗量與驗收）。
// 起點資料：鏈一 PI-2026-0601（已驗完、有品檢紀錄，ORD-2026-0601 接單業務洪嘉駿、陳映蓉編輯層級分享，WO-2026-0601 負責印務周建宏）；
// 鏈四 PI-2026-0820（待驗量 500、尚無品檢紀錄，ORD-2026-0820 接單業務洪嘉駿、陳映蓉檢視層級分享，WO-2026-0820 負責印務周建宏）。
// 情境依據：生產單據檢視活動清單（ACT-VPRD-010 至 026、076、077）。

test.describe.configure({ timeout: 180_000 });

const INSPECTION = '/qc-shipping/inspection';
const DONE = 'PI-2026-0601';
const PENDING = 'PI-2026-0820';
const header = (page) => page.locator('.ant-table-thead').first();

test('11.31 待驗清單全公司：品檢人員、印務主管、Supervisor 看得到兩件並有待驗量；印務看自己負責工單的兩件', async ({ page }) => {
  await openAs(page, '品檢人員', INSPECTION);
  await expect(pendingRow(page, DONE)).toBeVisible();
  await expect(pendingRow(page, PENDING)).toBeVisible();
  await expect(header(page)).toContainText('待驗量');
  await expect(pendingRow(page, PENDING).getByRole('button', { name: '驗收' })).toBeVisible();

  for (const role of ['印務主管', 'Supervisor', '印務']) {
    await switchRoleSafe(page, role);
    await expect(pendingRow(page, DONE), role).toBeVisible();
    await expect(pendingRow(page, PENDING), role).toBeVisible();
    await expect(header(page), role).toContainText('待驗量');
    // 驗收與修正只限品檢人員
    await expect(page.getByRole('button', { name: '驗收' }), role).toHaveCount(0);
  }
});

test('11.31 業務只看自己負責與被分享訂單的品檢紀錄：沒有待驗量與驗收，只列已有品檢紀錄的印件', async ({ page }) => {
  await openAs(page, '業務', INSPECTION);
  // 洪嘉駿：鏈一有品檢紀錄、列出並可展開；鏈四尚無紀錄、不列；沒有待驗清單的欄位與驗收鈕
  await expect(pendingRow(page, DONE)).toBeVisible();
  await expect(pendingRow(page, PENDING)).toHaveCount(0);
  await expect(header(page)).not.toContainText('待驗量');
  await expect(header(page)).not.toContainText('完成數');
  await expect(header(page)).not.toContainText('操作');
  await expect(page.getByRole('button', { name: '驗收' })).toHaveCount(0);
  await pendingRow(page, DONE).getByLabel('展開行').click();
  await expect(expandedRecords(page, DONE)).toContainText('5,000 ／ 0');
  await expect(expandedRecords(page, DONE).getByRole('button', { name: '修正' })).toHaveCount(0);

  // 業務乙陳映蓉（鏈一編輯層級分享）：同樣看得到鏈一的品檢紀錄
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(pendingRow(page, DONE)).toBeVisible();
  await expect(header(page)).not.toContainText('待驗量');

  // 與兩張訂單都無關的諮詢：有入口，一件都不列
  await switchRoleSafe(page, '諮詢');
  await expect(pendingRow(page, DONE)).toHaveCount(0);
  await expect(pendingRow(page, PENDING)).toHaveCount(0);
});

test('11.31 揀貨人員與出貨人員看全公司品檢紀錄，沒有待驗清單與驗收', async ({ page }) => {
  await openAs(page, '揀貨人員', INSPECTION);
  await expect(pendingRow(page, DONE)).toBeVisible();
  await expect(header(page)).not.toContainText('待驗量');
  await expect(page.getByRole('button', { name: '驗收' })).toHaveCount(0);
  await pendingRow(page, DONE).getByLabel('展開行').click();
  await expect(expandedRecords(page, DONE)).toContainText('郭淑芬');

  await switchRoleSafe(page, '出貨人員');
  await expect(pendingRow(page, DONE)).toBeVisible();
  await expect(header(page)).not.toContainText('待驗量');
});

test('11.31 生管、會計與無品檢活動的角色看不到品檢站：側欄沒有入口，停在品檢站切過去被導回', async ({ page }) => {
  for (const role of ['生管', '會計', '師傅', '廠務', '審稿人員', '訂單管理人']) {
    await openAs(page, role, INSPECTION);
    await expect(page).not.toHaveURL(/\/qc-shipping\/inspection/, { timeout: 15_000 });
    await expect(page.locator('.ant-menu-item[data-menu-id$="-/qc-shipping/inspection"]')).toHaveCount(0);
  }
});
