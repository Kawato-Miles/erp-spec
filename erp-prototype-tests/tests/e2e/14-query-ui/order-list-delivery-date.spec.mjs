import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 14.16 訂單列表顯示訂單預計交貨日期並可排序與區間篩選（2026-09-21 翻案改寫）
// 訂單預計交貨日期＝尚未出貨的有效印件，其印件預計交期取最早一筆（衍生值、訂單不存欄）。
// 訂單內部完成時間與全部交完日不上列表，只在訂單詳情呈現。
// 期望值取自 openspec order-management § 訂單層衍生交期日期，不由實作反推。
test('14.16 訂單列表顯示訂單預計交貨日期並可排序與區間篩選', async ({ page }) => {
  await openAs(page, '業務', '/orders');
  // 列表每頁十筆、依日期新到舊，不綁定特定編號在第一頁：只確認列表已載出訂單
  await expect(page.getByText(/ORD-\d{4}-\d{4}/).first()).toBeVisible();

  // 母表有訂單預計交貨日期欄，沒有已刪除的兩個訂單層交期欄，也沒有詳情才呈現的另兩個衍生日期
  await expect(page.getByRole('columnheader', { name: '訂單預計交貨日期' })).toBeVisible();
  for (const gone of ['訂單交期', '內部製作截止日', '訂單內部完成時間', '全部交完日']) {
    await expect(page.getByRole('columnheader', { name: gone, exact: true })).toHaveCount(0);
  }

  // 篩選區提供該欄的日期區間（一組日期區間選擇器）
  await expect(page.getByText('訂單預計交貨日期').last()).toBeVisible();
  await expect(page.locator('.ant-picker-range')).toHaveCount(1);

  // 該欄可排序：點欄頭排一次，列表照樣列得出訂單
  const rows = page
    .locator('.ant-table')
    .first()
    .locator('> .ant-table-container tbody.ant-table-tbody > tr.ant-table-row');
  const before = await rows.count();
  expect(before).toBeGreaterThan(1);
  await page.getByRole('columnheader', { name: '訂單預計交貨日期' }).click();
  await expect(rows.first()).toBeVisible();

  // 清除篩選後列表行為正常：先用關鍵字篩到只剩一張，再清除，筆數回到原本
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: /清空/ }).click();
  await expect(rows).toHaveCount(before);

  // 印件子列有印件內部完成日與印件預計交期兩欄，值為該印件自己的推導值
  //（PI-2026-0710：未扣急件內部完成日 2026-09-14、一般件不扣天數，預計交期為下一個工作天 2026-09-15）
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  const orderRow = page.locator('tr', { hasText: 'ORD-2026-0710' }).first();
  await orderRow.locator('.ant-table-row-expand-icon').click();
  const expanded = page.locator('tr.ant-table-expanded-row');
  await expect(expanded.getByRole('columnheader', { name: '印件內部完成日' })).toBeVisible();
  await expect(expanded.getByRole('columnheader', { name: '印件預計交期' })).toBeVisible();
  await expect(expanded).toContainText('2026-09-14');
  await expect(expanded).toContainText('2026-09-15');
});
