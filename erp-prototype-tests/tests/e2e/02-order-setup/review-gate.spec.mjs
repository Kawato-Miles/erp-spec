import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import {
  activityItem,
  addInstallment,
  button,
  cancelInstallment,
  completeReviewConditions0814,
  deleteFeeRow,
  deletePrintItemRow,
  dialog,
  editOrderNotes,
  editPaymentTermsNote,
  ORDER_0814_DELIVERY_NOTE,
  ORDER_0814_TERMS_NOTE,
  openTab,
  orderHeader,
  pickDate,
  reviewMissing,
  spaced,
  submit0814ForReview,
  submitButton,
} from './_local.mjs';

// 情境目錄 2.14～2.17：線下單送審條件、核准當下重檢、草稿與待審兩態直接儲存。
// 起點資料一律為鏈外 ORD-2026-0814（草稿；訂單須知與付款備註有值，交貨備註與收款條件備註為空，
// 尚無收款項目；三件印件名片 651、DM 9,900、貼紙 1,750，運費 200，應收總額 13,126）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 order-management
// 規格差異檔 Scenario THEN。依據 wiki [[訂單成立確認]]、[[收款項目規劃]]、[[訂單印件規格維護]]。
// 缺項文字與刪除鈕的畫面約定見 ./_local.mjs 的 reviewMissing、deletePrintItemRow、deleteFeeRow。
const ORDER_NO = 'ORD-2026-0814';
const DETAIL = `/orders/detail?id=${ORDER_NO}`;

test('2.14 線下單送審條件不齊時按鈕停用並列出缺項，已取消的收款項目不算數', async ({ page }) => {
  test.setTimeout(180_000);
  await openAs(page, '業務', DETAIL);

  // 起點：按鈕停用，缺項列三項
  await expect(submitButton(page)).toBeDisabled();
  const missing = reviewMissing(page);
  await expect(missing).toContainText('交貨備註');
  await expect(missing).toContainText('收款條件備註');
  await expect(missing).toContainText('至少一期收款項目');
  await expect(missing).not.toContainText('訂單須知');
  await expect(missing).not.toContainText('付款備註');

  // 每補一項，缺項就少一項
  await editOrderNotes(page, { delivery_note: ORDER_0814_DELIVERY_NOTE });
  await expect(reviewMissing(page)).not.toContainText('交貨備註');
  await expect(submitButton(page)).toBeDisabled();
  await editPaymentTermsNote(page, ORDER_0814_TERMS_NOTE);
  await expect(reviewMissing(page)).not.toContainText('收款條件備註');
  await expect(submitButton(page)).toBeDisabled();

  // 三項補齊後按鈕可按，缺項文字消失
  await addInstallment(page, { description: '全額', amount: 13126 });
  await expect(submitButton(page)).toBeEnabled();
  await expect(page.getByText(/尚缺/)).toHaveCount(0);

  // 唯一一期被取消後回到停用，缺項只列「至少一期收款項目」
  await cancelInstallment(page, '全額', '客戶改分期');
  await expect(submitButton(page)).toBeDisabled();
  await expect(reviewMissing(page)).toContainText('至少一期收款項目');
  await expect(reviewMissing(page)).not.toContainText('交貨備註');
  await expect(reviewMissing(page)).not.toContainText('收款條件備註');

  // 再新增一期後恢復可按；過程中訂單一直維持草稿
  await addInstallment(page, { description: '訂金', amount: 3938 });
  await expect(submitButton(page)).toBeEnabled();
  await expect(orderHeader(page)).toContainText('草稿');
});

test.describe('2.15 收款項目合計不一致、沒有印件、應收總額 0 元時照樣送得出審核', () => {
  test('2.15 收款項目合計不一致、沒有印件、應收總額 0 元時照樣送得出審核：合計不一致', async ({ page }) => {
    test.setTimeout(150_000);
    await openAs(page, '業務', DETAIL);
    // 前置：補填交貨備註與收款條件備註
    await editOrderNotes(page, { delivery_note: ORDER_0814_DELIVERY_NOTE });
    await editPaymentTermsNote(page, ORDER_0814_TERMS_NOTE);

    await addInstallment(page, { description: '訂金', amount: 3938 });
    const alert = page.getByRole('alert').filter({ hasText: '收款項目合計與應收總額不一致' });
    await expect(alert).toContainText('NT$ 3,938');
    await expect(alert).toContainText('NT$ 13,126');

    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    await expect(orderHeader(page)).toContainText('待業務主管審核');
  });

  test('2.15 收款項目合計不一致、沒有印件、應收總額 0 元時照樣送得出審核：沒有印件', async ({ page }) => {
    test.setTimeout(150_000);
    await openAs(page, '業務', DETAIL);
    // 前置：補填交貨備註與收款條件備註
    await editOrderNotes(page, { delivery_note: ORDER_0814_DELIVERY_NOTE });
    await editPaymentTermsNote(page, ORDER_0814_TERMS_NOTE);

    for (const name of ['名片', 'DM', '貼紙']) await deletePrintItemRow(page, name);
    // 刪光印件後只剩運費 200，稅額 10，應收總額 210
    await openTab(page, '金額與發票');
    const pane = page.locator('.ant-tabs-tabpane-active');
    await expect(pane).toContainText('= 應收總額（含稅）');
    await expect(pane).toContainText('NT$ 210');

    await addInstallment(page, { description: '全額', amount: 210 });
    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    await expect(orderHeader(page)).toContainText('待業務主管審核');
  });

  test('2.15 收款項目合計不一致、沒有印件、應收總額 0 元時照樣送得出審核：應收總額 0', async ({ page }) => {
    test.setTimeout(150_000);
    await openAs(page, '業務', DETAIL);
    // 前置：補填交貨備註與收款條件備註
    await editOrderNotes(page, { delivery_note: ORDER_0814_DELIVERY_NOTE });
    await editPaymentTermsNote(page, ORDER_0814_TERMS_NOTE);

    for (const name of ['名片', 'DM', '貼紙']) await deletePrintItemRow(page, name);
    await deleteFeeRow(page, '宅配運費');

    // 預計金額欄接受 0
    await addInstallment(page, { description: '零元期', amount: 0 });
    await expect(page.locator('tr', { hasText: '零元期' })).toContainText('NT$ 0');
    await expect(submitButton(page)).toBeEnabled();
    await submitButton(page).click();
    await expect(orderHeader(page)).toContainText('待業務主管審核');
  });
});

test('2.16 業務主管核准畫面帶出四格備註與各期收款項目，核准當下條件已不齊即擋下', async ({ page }) => {
  test.setTimeout(240_000);
  await openAs(page, '業務', DETAIL);
  // 前置：補齊兩格備註與兩期收款項目（3,938、9,188）後送審，停在待業務主管審核
  await submit0814ForReview(page);

  // 業務看不到核准鈕，畫面顯示等待哪位業務主管審核、等了幾天
  await expect(button(page, '核准訂單')).toHaveCount(0);
  await expect(page.getByText(/等待\s*林雅婷\s*審核中（已等待\s*\d+\s*天）/)).toBeVisible();

  // 林雅婷打開該單：資訊頁籤的審核畫面帶出四格備註、兩期收款項目（預計金額、預計收款日、
  // 預計開發票日）、應收總額與客戶資料，不必另切金額與發票頁籤（tasks 4.1「審核畫面帶出審核對象」）
  await switchRole(page, '業務主管');
  await openTab(page, '資訊');
  const main = page.locator('.ant-tabs-tabpane-active');
  for (const text of [
    '印刷色差以打樣為準',
    ORDER_0814_DELIVERY_NOTE,
    '匯款後請提供後五碼',
    ORDER_0814_TERMS_NOTE,
    'NT$ 3,938',
    'NT$ 9,188',
    '2026-10-20',
    '2026-10-15',
    '2026-11-20',
    '2026-11-15',
    '13,126',
    '青硯文具',
  ]) {
    await expect(main).toContainText(text);
  }

  // 業務把付款備註清空並存檔
  await switchRole(page, '業務');
  await editOrderNotes(page, { payment_note: '' });

  // 林雅婷按核准：被擋下並列出缺項「付款備註」，訂單維持待業務主管審核
  await switchRole(page, '業務主管');
  await button(page, '核准訂單').click();
  await expect(
    page.locator('.ant-message-notice-content, .ant-modal-content:visible').filter({ hasText: '付款備註' }).last(),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(orderHeader(page)).toContainText('待業務主管審核');
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '核准訂單')).toHaveCount(0);

  // 業務補填付款備註後，林雅婷再按一次即推進至審核通過
  await switchRole(page, '業務');
  await editOrderNotes(page, { payment_note: '匯款後請提供後五碼' });
  await switchRole(page, '業務主管');
  await button(page, '核准訂單').click();
  await expect(orderHeader(page)).toContainText('審核通過');
});

test('2.17 草稿與待審兩態修改直接儲存不回審，只有可編輯角色看得到送審鈕', async ({ page }) => {
  test.setTimeout(240_000);
  // 草稿態：送審鈕只有接單業務看得到（停用也照樣顯示）
  await openAs(page, '業務', DETAIL);
  await expect(submitButton(page)).toHaveCount(1);
  for (const role of ['業務主管', '印務主管', '會計']) {
    await switchRole(page, role);
    await expect(submitButton(page)).toHaveCount(0);
  }

  // 前置：業務補齊送審條件後送審，停在待業務主管審核
  await switchRole(page, '業務');
  await submit0814ForReview(page);

  // 待審期間改名片的成交單價
  await openTab(page, '訂單項目');
  const priceInput = page.locator('input[aria-label="名片 單價（未稅）"]');
  await priceInput.fill('5.5');
  await priceInput.blur();
  await button(page, '儲存變更（1）').click();

  // 改收款條件備註（待審期間仍有輸入框）
  await editPaymentTermsNote(page, '訂金 40% 回簽後匯款、尾款出貨前結清');
  await expect(page.locator('body')).toContainText('訂金 40% 回簽後匯款、尾款出貨前結清');

  // 改第二期的預計收款日
  await openTab(page, '金額與發票');
  // 只找作用中頁籤的列：資訊頁籤（已隱藏）的收款條件備註文字同樣含「尾款」
  const row = page.locator('.ant-tabs-tabpane-active tr', { hasText: '尾款' }).first();
  await row.getByRole('button', { name: '編輯' }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await pickDate(modal.getByLabel('預計收款日'), '2026-11-30');
  await modal.getByRole('button', { name: spaced('儲存變更') }).click();
  await expect(page.getByText('已更新收款項目「尾款」').last()).toBeVisible();

  // 三項修改直接儲存，訂單維持待業務主管審核
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  // 活動紀錄記下這次修改
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '修改印件單價')).toHaveCount(1);
  await expect(activityItem(page, '編輯發票與收款')).toHaveCount(2);
  await expect(activityItem(page, '更新收款項目')).toHaveCount(1);
});
