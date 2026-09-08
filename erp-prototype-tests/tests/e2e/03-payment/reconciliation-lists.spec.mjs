import { test, expect } from '@playwright/test';
import { openAs, gotoInApp } from '../_helpers.mjs';

// 情境目錄 3.11：三方對帳與跨訂單四張清單。
// 起點資料：鏈一 ORD-2026-0601（已收訖）、鏈二 ORD-2026-0710（尾款未開立未收）、
// 款項管理的四張清單頁（應收款項／待開發票／待退款／帳務異常）。

test('3.11 三方對帳與跨訂單四張清單', async ({ page }) => {
  await openAs(page, '會計', '/orders/detail?id=ORD-2026-0601&tab=paymentPlan');

  // 差額為零時標對帳通過
  await expect(page.getByText('對帳通過（差額 = 0）')).toBeVisible();

  // 換看 ORD-2026-0710：從訂單列表點進去（detail 頁不在側欄選單上，gotoInApp 只認選單項），
  // 再切到「金額與發票」頁籤：收款差額與發票差額皆為 47,425
  await gotoInApp(page, '/orders');
  await page.getByText('ORD-2026-0710', { exact: true }).click();
  await expect(page).toHaveURL(/detail/);
  await page.locator('.ant-tabs-tab', { hasText: '金額與發票' }).click();
  await expect(page.getByText('待對帳')).toBeVisible();
  const receivedCard = page.locator('div', { has: page.getByText('收款淨額（含稅）', { exact: true }) }).last();
  await expect(receivedCard.getByText('NT$ 47,425')).toBeVisible();
  const invoicedCard = page.locator('div', { has: page.getByText('發票淨額（含稅）', { exact: true }) }).last();
  await expect(invoicedCard.getByText('NT$ 47,425')).toBeVisible();

  // 依序打開應收款項、待開發票、待退款、帳務異常四張清單
  await gotoInApp(page, '/payment/receivable');
  for (const orderNo of ['ORD-2026-0710', 'ORD-2026-0815', 'ORD-2026-0820', 'ORD-2026-0901', 'ORD-2026-0903', 'ORD-2026-0904']) {
    await expect(page.getByRole('cell', { name: orderNo, exact: true })).toBeVisible();
  }
  // 已收訖的 ORD-2026-0601 不在應收款項清單（沒有未收餘額）
  await expect(page.getByRole('cell', { name: 'ORD-2026-0601', exact: true })).toHaveCount(0);

  await gotoInApp(page, '/payment/pending-invoice');
  const pendingRow = page.locator('tr', { hasText: 'ORD-2026-0710' });
  await expect(pendingRow).toContainText('NT$ 47,425');
  await expect(pendingRow).toContainText('未開立');

  // 待退款清單與帳務異常清單皆無資料，因為現行資料沒有退款款項、沒有超收也沒有超額發票
  await gotoInApp(page, '/payment/refund-payout');
  await expect(page.locator('.ant-empty-description')).toBeVisible();

  await gotoInApp(page, '/payment/billing-anomaly');
  await expect(page.locator('.ant-empty-description')).toBeVisible();
});
