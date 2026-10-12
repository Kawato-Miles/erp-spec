import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { expandedRecords, gotoInAppSafe, pendingRow, switchRoleSafe } from '../11-qc/_setup.mjs';

// 情境目錄 14.36：品檢站品檢紀錄表最左兩欄為完稿縮圖與品檢照片，印件詳情品檢頁籤最左為品檢照片縮圖。
// 起點資料：鏈一 PI-2026-0601 的品檢紀錄 QC-2026-0601-01（品檢照片只有檔名，畫面顯示佔位圖）。

test('14.36 品檢站品檢紀錄表最左兩欄為完稿縮圖與品檢照片，印件詳情品檢頁籤最左為品檢照片縮圖', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await pendingRow(page, 'PI-2026-0601').getByLabel('展開行').click();
  const records = expandedRecords(page, 'PI-2026-0601');
  const heads = (await records.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim());
  expect(heads.slice(0, 2)).toEqual(['完稿縮圖', '品檢照片']);
  // 原本顯示檔名的「照片」欄拿掉
  expect(heads).not.toContain('照片');
  const first = records.locator('tbody tr.ant-table-row').first();
  await expect(first.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  await expect(first.locator('td').nth(1).getByRole('img')).toHaveCount(1);
  // 兩欄固定在左側，縮圖欄不顯示檔名
  await expect(records.locator('thead th').nth(0)).toHaveClass(/ant-table-cell-fix-left/);
  await expect(records.locator('thead th').nth(1)).toHaveClass(/ant-table-cell-fix-left/);
  await expect(first.locator('td').nth(1)).not.toContainText('.jpg');

  // 印件詳情的品檢紀錄頁籤：歷次品檢紀錄表最左只有品檢照片（同一件印件，不加完稿縮圖）
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  await page.getByText('會員卡（客製燙金）', { exact: true }).first().click();
  await expect(page.getByText('印件基本資訊')).toBeVisible();
  await page.getByRole('tab', { name: /品檢紀錄/ }).click();
  const table = page.locator('.ant-table-wrapper').filter({ hasText: '品檢時間' }).first();
  const detailHeads = (await table.locator('.ant-table-thead th').allInnerTexts()).map((t) =>
    t.trim(),
  );
  expect(detailHeads[0]).toBe('品檢照片');
  expect(detailHeads).not.toContain('完稿縮圖');
  expect(detailHeads).not.toContain('照片');
  const row = table.locator('tbody tr.ant-table-row').first();
  await expect(row.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  await expect(row.locator('td').nth(0)).not.toContainText('.jpg');
});
