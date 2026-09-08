import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { button, buildDraftOrder, goInApp, openTab, orderHeader, rowOf } from './_local.mjs';

test('2.2 業務主管不核可時系統內沒有退回鈕（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(180_000);
  const orderNo = await buildDraftOrder(
    page,
    { openAs, switchRole, gotoInApp },
    { caseName: '2.2 無退回鈕', itemName: '2.2 印件甲' },
  );
  await button(page, '送主管審核').click();
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  await switchRole(page, '業務主管');

  // 訂單詳情：只有核可，沒有退回草稿的按鈕，也沒有退回原因欄
  await expect(button(page, '核准訂單')).toBeVisible();
  await expect(page.getByRole('button', { name: /退回|退件/ })).toHaveCount(0);
  await openTab(page, '資訊');
  await expect(page.locator('body')).not.toContainText('退回原因');

  // 審核工作台同樣沒有退回動作，只有進入詳情的入口
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  const row = rowOf(page, orderNo);
  await expect(row).toBeVisible();
  const buttons = row.locator('button');
  await expect(buttons).toHaveCount(1);

  // 訂單停在待業務主管審核，直到主管核可
  await expect(row.getByText('待業務主管審核', { exact: true })).toBeVisible();
});
