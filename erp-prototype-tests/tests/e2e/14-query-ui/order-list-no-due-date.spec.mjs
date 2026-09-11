import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 14.16 訂單列表不顯示也不篩選交期
// 交期的唯一事實在印件層（印件各自的預計出貨日與推導出的內部完成日），訂單層兩個交期欄
//（訂單交期、內部製作截止日）已刪除，列表因此不顯示也不篩選交期（wiki [[訂單資訊分區編輯]]）。
test('14.16 訂單列表不顯示也不篩選交期', async ({ page }) => {
  await openAs(page, '業務', '/orders');
  await expect(page.getByText('ORD-2026-0710', { exact: true }).first()).toBeVisible();

  // 母表沒有交期欄
  await expect(page.getByRole('columnheader', { name: '訂單交期' })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '內部製作截止日' })).toHaveCount(0);

  // 篩選區沒有交期區間
  await expect(page.getByText('訂單交期區間')).toHaveCount(0);
  await expect(page.locator('.ant-picker-range')).toHaveCount(0);

  // 清除篩選後列表行為正常：先用關鍵字篩到只剩一張，再清除，筆數回到原本
  // （母表的列在最外層那張表的 tbody 底下，子表另有自己的 tbody，故限定第一張表）
  const rows = page.locator('.ant-table').first().locator('> .ant-table-container tbody.ant-table-tbody > tr.ant-table-row');
  const before = await rows.count();
  expect(before).toBeGreaterThan(1);
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: /清空篩選/ }).click();
  await expect(rows).toHaveCount(before);

  // 印件子列仍有內部完成日欄，值為該印件自己的推導值（PI-2026-0710：預計出貨日 2026-09-15 減一天）
  const orderRow = page.locator('tr', { hasText: 'ORD-2026-0710' }).first();
  await orderRow.locator('.ant-table-row-expand-icon').click();
  const expanded = page.locator('tr.ant-table-expanded-row');
  await expect(expanded.getByRole('columnheader', { name: '內部完成日' })).toBeVisible();
  await expect(expanded).toContainText('2026-09-14');
});
