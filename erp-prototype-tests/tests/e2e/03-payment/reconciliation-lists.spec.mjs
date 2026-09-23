import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, cjkName } from '../_helpers.mjs';
import { dialog, pickOption, pickDate, toastText, waitModalsClosed } from './_local.mjs';

// 情境目錄 3.11：三方對帳與跨訂單四張清單。
// 起點資料：鏈一 ORD-2026-0601（已收訖）、鏈二 ORD-2026-0710（尾款未開立未收）、
// 款項管理的四張清單頁（應收款項／待開發票／待退款／帳務異常）。

test('3.11 三方對帳與跨訂單四張清單', async ({ page }) => {
  await openAs(page, '會計', '/orders/detail?id=ORD-2026-0601&tab=paymentPlan');

  // 差額為零時標對帳通過；帳務公司顯示公司抬頭，不顯示代碼
  await expect(page.getByText('對帳通過（差額 = 0）')).toBeVisible();
  await expect(page.getByText('訂單編號 ORD-2026-0601 · 帳務公司 感官')).toBeVisible();

  // 換看 ORD-2026-0710：從訂單列表點進去（detail 頁不在側欄選單上，gotoInApp 只認選單項），
  // 再切到「金額與發票」頁籤：收款差額與發票差額皆為 47,425
  await gotoInApp(page, '/orders');
  // 訂單列表每頁十筆、依日期新到舊，樣本增多後 0710 不一定在第一頁：先用編號搜尋再點
  const orderSearch = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await orderSearch.fill('ORD-2026-0710');
  await orderSearch.press('Enter');
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

test('3.11b 應收款項與待開發票清單隨訂單操作即時更新', async ({ page }) => {
  // 起點資料：鏈二 ORD-2026-0710 尾款期 47,425 未開立、未收
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  // 開立尾款期發票
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  await installmentTable.locator('tr', { hasText: '尾款 70%' }).getByRole('button', { name: '開立發票' }).click();
  let modal = dialog(page);
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: cjkName('確認') }).click();
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 登記尾款收款並切已完成
  await page.getByRole('button', { name: cjkName('新增款項') }).click();
  modal = dialog(page);
  await expect(modal).toBeVisible();
  await pickOption(page, modal.getByLabel('付款方式'), '銀行轉帳');
  await modal.getByLabel(/收款金額（含稅）/).fill('47425');
  const tailRow = modal.locator('.ant-table-wrapper tr', { hasText: '尾款 70%' });
  await tailRow.locator('input[type="checkbox"]').check();
  await tailRow.getByRole('spinbutton').fill('47425');
  await pickDate(modal.getByLabel('款項實際完成日'), '2026-09-24');
  await modal.locator('input[type="file"]').setInputFiles({ name: '入帳憑證-0924.pdf', mimeType: 'application/pdf', buffer: Buffer.from('fake') });
  await modal.getByLabel('已完成', { exact: true }).check();
  await modal.getByRole('button', { name: cjkName('新增') }).click();
  await toastText(page, /已新增款項紀錄/);
  await waitModalsClosed(page);

  // 站內導頁到兩張清單：ORD-2026-0710 已不在清單上（清單讀即時資料，不讀固定種子）
  await gotoInApp(page, '/payment/pending-invoice');
  await expect(page.locator('tr', { hasText: 'ORD-2026-0815' }).first()).toBeVisible();
  await expect(page.locator('tr', { hasText: 'ORD-2026-0710' })).toHaveCount(0);

  await gotoInApp(page, '/payment/receivable');
  await expect(page.getByRole('cell', { name: 'ORD-2026-0815', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ORD-2026-0710', exact: true })).toHaveCount(0);
});
