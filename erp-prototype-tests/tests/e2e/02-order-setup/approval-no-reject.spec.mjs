import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { button, goInApp, openTab, orderHeader, rowOf, submit0814ForReview } from './_local.mjs';

// 情境 2.2：承 2.1 停在待業務主管審核的訂單（鏈外 ORD-2026-0814 補齊送審條件後送審）。
// 依據 wiki [[訂單成立確認]]。
const ORDER_NO = 'ORD-2026-0814';

test('2.2 業務主管不核可時系統內沒有退回鈕（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(180_000);
  await openAs(page, '業務', `/orders/detail?id=${ORDER_NO}`);
  // 前置：補齊送審條件後送主管審核
  await submit0814ForReview(page);

  await switchRole(page, '業務主管');

  // 訂單詳情：只有核可，沒有退回草稿的按鈕，也沒有退回原因欄
  await expect(button(page, '核准訂單')).toBeVisible();
  await expect(page.getByRole('button', { name: /退回|退件/ })).toHaveCount(0);
  await openTab(page, '資訊');
  await expect(page.locator('body')).not.toContainText('退回原因');

  // 審核工作台同樣沒有退回動作，只有進入詳情的入口
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  const row = rowOf(page, ORDER_NO);
  await expect(row).toBeVisible();
  await expect(row.locator('button')).toHaveCount(1);

  // 訂單停在待業務主管審核，直到主管核可
  await expect(row.getByText('待業務主管審核', { exact: true })).toBeVisible();
});
