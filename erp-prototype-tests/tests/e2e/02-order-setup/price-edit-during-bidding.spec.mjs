import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { button, buildDraftOrder, goInApp, openTab, orderHeader, rowOf } from './_local.mjs';

test('2.4 比價期間直接改印件單價、重出報價單（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(180_000);
  const itemName = '2.4 印件甲';
  const orderNo = await buildDraftOrder(
    page,
    { openAs, switchRole, gotoInApp },
    { caseName: '2.4 比價改單價', itemName, qty: '100', unitPrice: '50' },
  );
  await button(page, '送主管審核').click();
  await switchRole(page, '業務主管');
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  await rowOf(page, orderNo).getByRole('button').first().click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  await button(page, '核准訂單').click();
  await switchRole(page, '業務');
  await button(page, '已送報價單').click();
  await expect(orderHeader(page)).toContainText('報價待回簽');

  await openTab(page, '訂單項目');
  // 起點：購買數量 100、單價 50，小計未稅 5,000（含稅 5,250）
  await expect(page.locator('body')).toContainText('5,250');

  const priceInput = page.locator(`input[aria-label="${itemName} 單價（未稅）"]`);
  await priceInput.fill('60');
  await priceInput.blur();
  await button(page, `儲存變更（1）`).click();

  // 應收總額當場依新單價重算：100 × 60 ＝ 6,000（未稅），稅額 300，含稅 6,300
  await expect(page.locator('body')).toContainText('6,300');
  await expect(orderHeader(page)).toContainText('報價待回簽');

  // 同一個案子始終只有這一張訂單：列表上這個案名只出現一次
  await goInApp(page, '/orders', gotoInApp);
  await expect(page.getByText(orderNo, { exact: true })).toHaveCount(1);

  // 再改一次金額，訂單狀態仍停在報價待回簽、不重複推進
  await page.getByText(orderNo, { exact: true }).click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  await openTab(page, '訂單項目');
  const priceInput2 = page.locator(`input[aria-label="${itemName} 單價（未稅）"]`);
  await priceInput2.fill('65');
  await priceInput2.blur();
  await button(page, '儲存變更（1）').click();
  await expect(page.locator('body')).toContainText('6,825');
  await expect(orderHeader(page)).toContainText('報價待回簽');
});
