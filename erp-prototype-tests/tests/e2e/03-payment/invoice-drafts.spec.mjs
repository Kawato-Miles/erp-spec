import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, cjkName } from '../_helpers.mjs';
import {
  button,
  dialog,
  drawer,
  entryButton,
  expectEntries,
  installmentRow,
  invoiceTable,
  netInvoicedValue,
  openOrderInApp,
  orderHeader,
  pickDate,
  pickOption,
  toastText,
  waitModalsClosed,
} from './_local.mjs';

// 情境目錄第三章 3.14～3.23：發票草稿（change order-review-gate-invoice-draft-transfer-receipt）。
// 起點資料：鏈外 ORD-2026-0812（第 1 期草稿 INV-0812-1、第 2 期開立失敗草稿 INV-0812-2、
// 第 3 期金額不一致草稿 INV-0812-3、第 4 期尚無發票）、ORD-2026-0813（已回簽、一期設計費）、
// ORD-2026-0814（草稿訂單、尚無收款項目）。數字驗算在 tests/unit/payment/invoice-*.test.mjs。
//
// 本檔先於功能撰寫（測試先行），畫面約定如下，由 tasks 5.2～5.4 實作時對齊：
//
// | 位置 | 約定 |
// | --- | --- |
// | 收款項目列 | 入口為圖示按鈕，可及名稱「建立草稿」「直接開立發票」「送出開立」 |
// | 開立視窗（建立草稿開啟） | 草稿模式，主按鈕「儲存草稿」，不檢核 |
// | 開立視窗（直接開立發票或送出開立開啟） | 送出模式，主按鈕「確認」送出開立；自草稿開啟時另有「儲存草稿」；含單選「沒有回應」模擬平台沒有回傳結果 |
// | 發票區草稿列 | 狀態「草稿」、顯示最近一次開立失敗原因；沒有刪除操作、沒有開立折讓單；平台沒有回應後提供「人工補登」 |
// | 人工補登視窗 | 欄位「發票號碼」「開立時間」，按鈕「確認補登」 |

const ORDER_0812 = '/orders/detail?id=ORD-2026-0812&tab=paymentPlan';

/** 發票區狀態為草稿的列 */
const draftRows = (page) => invoiceTable(page).locator('tbody tr.ant-table-row').filter({ hasText: '草稿' });

/** 自收款項目列開啟送出模式的開立視窗 */
async function openSubmit(page, description) {
  await entryButton(installmentRow(page, description), '送出開立').click({ timeout: 10_000 });
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  return modal;
}

/** 開立視窗內按送出（確認）；按鈕因檢核停用時不按，交由後續斷言判讀 */
async function pressSubmit(modal) {
  const confirm = modal.getByRole('button', { name: cjkName('確認') });
  if (await confirm.isEnabled()) await confirm.click();
}

test('3.14 收款項目上的建立草稿與直接開立發票兩個入口', async ({ page }) => {
  test.setTimeout(120_000);
  // 前置：同 3.13 在 ORD-2026-0814 建好訂金 3,938 與尾款 9,188 兩期
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0814&tab=paymentPlan');
  const installmentPanel = page.locator('div', { has: page.getByText('收款項目', { exact: true }) }).first();
  for (const [description, amount] of [['訂金', '3938'], ['尾款', '9188']]) {
    await installmentPanel.getByRole('button', { name: cjkName('新增收款項目') }).click();
    const modal = dialog(page);
    await expect(modal).toBeVisible();
    await modal.getByLabel('描述').fill(description);
    await modal.getByLabel('預計金額（含稅）').fill(amount);
    await pickOption(page, modal.getByLabel('預計收款方式'), '銀行轉帳');
    await pickDate(modal.getByLabel('預計收款日'), '2026-10-20');
    await pickDate(modal.getByLabel('預計開立發票日'), '2026-10-15');
    await modal.getByRole('button', { name: cjkName('建立期次') }).click();
    await toastText(page, new RegExp(`已新增收款項目「${description}」`));
    await waitModalsClosed(page);
  }

  // 尚無發票：兩個入口並列，發票淨額 0
  const firstRow = () => installmentRow(page, '訂金');
  await expectEntries(firstRow(), ['建立草稿', '直接開立發票']);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 存成草稿：買受人統編清空，統編空白不擋
  await entryButton(firstRow(), '建立草稿').click();
  const draftModal = dialog(page);
  await expect(draftModal).toBeVisible();
  await draftModal.getByLabel('買受人統一編號').fill('');
  await button(draftModal, '儲存草稿').click();
  await toastText(page, /已建立發票草稿/);
  await waitModalsClosed(page);

  await expectEntries(firstRow(), ['送出開立']);
  await expect(firstRow()).toContainText('未開立');
  await expect(draftRows(page)).toHaveCount(1);
  await expect(draftRows(page).first()).toContainText('NT$ 3,938');
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 補上統編後送出開立成功：銷售額 3,750、稅額 188
  const submitModal = await openSubmit(page, '訂金');
  await submitModal.getByLabel('買受人統一編號').fill('27638451');
  await expect(submitModal.getByText('銷售額（未稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 3,750');
  await expect(submitModal.getByText('稅額', { exact: true }).locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 188');
  await pressSubmit(submitModal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  await expect(firstRow()).toContainText('已開立');
  await expectEntries(firstRow(), []);
  await expect(draftRows(page)).toHaveCount(0);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 3,938');
});

test('3.15 草稿不檢核、送出開立時才檢核，以草稿內容送出', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 打開第 1 期草稿，改地址、品項改兩列合計 3,998 後儲存草稿：不檢核、照樣存下
  const modal = await openSubmit(page, '訂金 20%');
  await modal.getByLabel('買受人地址').fill('高雄市前金區中正四路 200 號');
  await modal.getByRole('button', { name: cjkName('新增品項') }).click();
  const prices = modal.getByLabel('單價（未稅）');
  await prices.nth(0).fill('2000');
  await modal.getByLabel('數量').nth(1).fill('1');
  await prices.nth(1).fill('1998');
  await button(modal, '儲存草稿').click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('未開立');

  // 送出：擋下並列出未稅目標值 4,000、品項加總 3,998、差額 2，發票留在草稿
  const submitModal = await openSubmit(page, '訂金 20%');
  await expect(submitModal.getByLabel('買受人地址')).toHaveValue('高雄市前金區中正四路 200 號');
  await pressSubmit(submitModal);
  await expect(page.getByText(/未稅目標值[^0-9]*4,000/).first()).toBeVisible();
  await expect(page.getByText(/品項加總[^0-9]*3,998/).first()).toBeVisible();
  await expect(page.getByText(/差額[^0-9]*2(?![0-9,])/).first()).toBeVisible();

  // 調平到 4,000 後送出成立
  await submitModal.getByLabel('單價（未稅）').nth(1).fill('2000');
  await pressSubmit(submitModal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('已開立');

  // 開出的發票帶草稿上的新地址，系統不自訂單重新帶入
  await installmentRow(page, '訂金 20%').getByRole('button', { name: /^SSP-/ }).click();
  await expect(drawer(page)).toContainText('高雄市前金區中正四路 200 號');
});

test('3.16 開立失敗留在草稿並顯示原因，直接開立失敗也落在草稿', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 草稿列顯示失敗原因
  await expect(draftRows(page).filter({ hasText: '買受人統編須為 8 碼' })).toHaveCount(1);

  // 不改統編再送一次：仍失敗、留在草稿，該期維持未開立
  const retry = await openSubmit(page, '期中款 20%');
  await expect(retry.getByLabel('買受人統一編號')).toHaveValue('8421057');
  await pressSubmit(retry);
  await expect(page.getByText('買受人統編須為 8 碼').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await waitModalsClosed(page);
  await expect(installmentRow(page, '期中款 20%')).toContainText('未開立');
  await expectEntries(installmentRow(page, '期中款 20%'), ['送出開立']);

  // 統編改成 84210573 後送出成立
  const fixed = await openSubmit(page, '期中款 20%');
  await fixed.getByLabel('買受人統一編號').fill('84210573');
  await pressSubmit(fixed);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '期中款 20%')).toContainText('已開立');
  await expect(draftRows(page).filter({ hasText: '買受人統編須為 8 碼' })).toHaveCount(0);

  // 第 4 期直接開立，統編改成 7 碼：系統建一張草稿並顯示失敗原因，該期只剩送出開立
  await entryButton(installmentRow(page, '尾款 20%'), '直接開立發票').click();
  const direct = dialog(page);
  await expect(direct).toBeVisible();
  await direct.getByLabel('買受人統一編號').fill('8421057');
  await pressSubmit(direct);
  await page.keyboard.press('Escape');
  await waitModalsClosed(page);
  await expect(draftRows(page).filter({ hasText: '買受人統編須為 8 碼' })).toHaveCount(1);
  await expect(installmentRow(page, '尾款 20%')).toContainText('未開立');
  await expectEntries(installmentRow(page, '尾款 20%'), ['送出開立']);
});

test('3.17 同一期只容一張未作廢發票：建立草稿後該期只剩送出開立', async ({ page }) => {
  // 兩人同時送出時後到者被拒的寫入檢查以純函式驗證（invoice-drafts.test.mjs 3.17）；畫面段只驗入口收斂
  await openAs(page, '業務', ORDER_0812);
  await expectEntries(installmentRow(page, '尾款 20%'), ['建立草稿', '直接開立發票']);

  await entryButton(installmentRow(page, '尾款 20%'), '建立草稿').click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await button(modal, '儲存草稿').click();
  await toastText(page, /已建立發票草稿/);
  await waitModalsClosed(page);

  await expectEntries(installmentRow(page, '尾款 20%'), ['送出開立']);
  await expect(draftRows(page)).toHaveCount(4);
});

test('3.18 不要的草稿以取消收款項目處理，只有草稿的期次取消不必作廢', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 草稿沒有刪除操作
  await expect(draftRows(page)).toHaveCount(3);
  await expect(invoiceTable(page).getByRole('button', { name: /刪除/ })).toHaveCount(0);

  // 對第 1 期按取消並填原因：不要求先作廢
  const row = installmentRow(page, '訂金 20%');
  await expect(row.getByRole('button', { name: '取消收款項目' })).toBeEnabled();
  await row.getByRole('button', { name: '取消收款項目' }).click();
  const cancelModal = dialog(page);
  await expect(cancelModal).toBeVisible();
  await cancelModal.getByLabel(/原因/).fill('客戶改為整筆尾款再開');
  await cancelModal.getByRole('button', { name: cjkName('確認取消') }).click();
  await toastText(page, /已取消收款項目/);
  await waitModalsClosed(page);

  // 草稿從發票區消失；PAY-0812-1 對第 1 期的核銷分配一併解除
  await expect(installmentRow(page, '訂金 20%')).toContainText('已取消');
  await expect(draftRows(page)).toHaveCount(2);
  const paymentRow = page.locator('tbody tr.ant-table-row').filter({ hasText: 'TXN-0814-5521' }).first();
  await expect(paymentRow).toBeVisible();
  await expect(paymentRow).not.toContainText('訂金 20%：');
});

test('3.19 草稿與作廢不計入發票淨額、不出現在折讓單可選發票，已取消訂單仍可建草稿', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', ORDER_0812);

  // 三張都是草稿：發票淨額 0
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 第 1 期送出開立後發票淨額 4,200
  const modal = await openSubmit(page, '訂金 20%');
  await pressSubmit(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 4,200');

  // 折讓只開放給開立的那一張，兩張草稿沒有折讓入口
  await expect(invoiceTable(page).getByRole('button', { name: '開立折讓單' })).toHaveCount(1);
  await expect(draftRows(page)).toHaveCount(2);
  for (const draft of await draftRows(page).all()) {
    await expect(draft.getByRole('button', { name: '開立折讓單' })).toHaveCount(0);
  }

  // 已取消的 ORD-2026-0813 照樣建得出草稿，系統不以訂單狀態擋下
  await openOrderInApp(page, 'ORD-2026-0813', gotoInApp);
  await button(page, '取消訂單').click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
  await expect(page.getByText('已取消訂單').last()).toBeVisible();
  await expect(orderHeader(page)).toContainText('已取消');

  const designRow = installmentRow(page, '設計費');
  await expectEntries(designRow, ['建立草稿', '直接開立發票']);
  await entryButton(designRow, '建立草稿').click();
  const draftModal = dialog(page);
  await expect(draftModal).toBeVisible();
  await button(draftModal, '儲存草稿').click();
  await toastText(page, /已建立發票草稿/);
  await waitModalsClosed(page);
  await expect(draftRows(page)).toHaveCount(1);
  await expect(draftRows(page).first()).toContainText('NT$ 3,150');
});

test('3.20 草稿期間開發票狀態維持原值，發票作廢只動開發票狀態', async ({ page }) => {
  test.setTimeout(150_000);
  await openAs(page, '業務', ORDER_0812);
  const row = () => installmentRow(page, '訂金 20%');
  const pendingHas = async (expected) => {
    await gotoInApp(page, '/payment/pending-invoice');
    const pending = page.locator('tbody tr.ant-table-row').filter({ hasText: 'ORD-2026-0812' }).filter({ hasText: '訂金 20%' });
    await expect(pending).toHaveCount(expected ? 1 : 0);
    await openOrderInApp(page, 'ORD-2026-0812', gotoInApp);
  };

  // 起點（掛草稿）：未開立、已收訖、列在待開發票清單
  await expect(row()).toContainText('未開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(true);

  // 送出開立成功：已開立、已收訖、移出清單
  let modal = await openSubmit(page, '訂金 20%');
  await pressSubmit(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(false);

  // 發票作廢：已作廢、已收訖、再列出
  const issuedRow = invoiceTable(page).locator('tbody tr.ant-table-row').filter({ hasText: 'NT$ 4,200' }).filter({ hasNotText: '草稿' }).first();
  await issuedRow.getByRole('button', { name: '作廢發票' }).click();
  const voidModal = dialog(page);
  await expect(voidModal).toBeVisible();
  await voidModal.getByLabel(/作廢原因/).fill('統編打錯');
  await voidModal.getByRole('button', { name: cjkName('確認作廢') }).click();
  await toastText(page, /已作廢發票/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已作廢');
  await expect(row()).toContainText('已收訖');
  await pendingHas(true);

  // 重建草稿：開發票狀態維持已作廢、仍列出
  await entryButton(row(), '建立草稿').click();
  modal = dialog(page);
  await expect(modal).toBeVisible();
  await button(modal, '儲存草稿').click();
  await toastText(page, /已建立發票草稿/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已作廢');
  await expect(row()).toContainText('已收訖');
  await pendingHas(true);

  // 草稿送出成功：已開立、移出
  modal = await openSubmit(page, '訂金 20%');
  await pressSubmit(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(false);
});

test('3.21 送出開立後平台沒有回應時留在草稿；查到已開出時人工補登並記補登人', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 送出開立並模擬平台沒有回應：發票維持草稿、該期維持未開立、發票淨額不變
  const modal = await openSubmit(page, '訂金 20%');
  await modal.getByRole('radio', { name: '沒有回應' }).check();
  await pressSubmit(modal);
  await page.keyboard.press('Escape');
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('未開立');
  await expect(draftRows(page)).toHaveCount(3);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 查到已開出：在草稿上補登發票號碼與開立時間
  const draft = draftRows(page).filter({ hasText: 'NT$ 4,200' }).filter({ hasNotText: '買受人統編須為 8 碼' }).first();
  await draft.getByRole('button', { name: '人工補登' }).click();
  const backfill = dialog(page);
  await expect(backfill).toBeVisible();
  await backfill.getByLabel('發票號碼').fill('SSP-26100501');
  await pickDate(backfill.getByLabel('開立時間'), '2026-10-05 10:30');
  await button(backfill, '確認補登').click();
  await waitModalsClosed(page);

  // 補登後發票轉開立、該期轉已開立，系統記下補登人
  await expect(installmentRow(page, '訂金 20%')).toContainText('已開立');
  await expect(installmentRow(page, '訂金 20%')).toContainText('SSP-26100501');
  await expect(netInvoicedValue(page)).toHaveText('NT$ 4,200');
  await installmentRow(page, '訂金 20%').getByRole('button', { name: 'SSP-26100501' }).click();
  await expect(drawer(page)).toContainText('補登人');
  await expect(drawer(page)).toContainText('洪嘉駿');
});

test('3.21b 平台沒有回應且查到沒開出時，自草稿再送一次', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  const first = await openSubmit(page, '訂金 20%');
  await first.getByRole('radio', { name: '沒有回應' }).check();
  await pressSubmit(first);
  await page.keyboard.press('Escape');
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('未開立');

  // 再送一次成功：號碼取平台回傳，該期只有一張未作廢發票
  const second = await openSubmit(page, '訂金 20%');
  await pressSubmit(second);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('已開立');
  await expect(installmentRow(page, '訂金 20%').getByRole('button', { name: /^SSP-/ })).toHaveCount(1);
  await expect(draftRows(page)).toHaveCount(2);
});

test('3.22 送出開立期間收款項目被取消：開立先寫入時擋下取消', async ({ page }) => {
  // 取消先寫入、平台後回應成功時系統內不落發票的那一種先後，以純函式驗證（invoice-submit-edge-cases.test.mjs 3.22）
  await openAs(page, '業務', ORDER_0812);

  const modal = await openSubmit(page, '訂金 20%');
  await pressSubmit(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 第 1 期開立後，取消鈕停用並提示先作廢該張發票
  const cancelButton = installmentRow(page, '訂金 20%').getByRole('button', { name: '取消收款項目' });
  await expect(cancelButton).toBeDisabled();
  await cancelButton.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('已開立發票，請先作廢該張發票');
});

test('3.23 草稿發票金額與該期當下預計金額不一致時，送出開立只提示、不擋下，以草稿金額開立', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 第 3 期預計金額 8,400，草稿 12,600：含稅目標值取草稿上的 12,600，並提示兩數不一致
  const modal = await openSubmit(page, '尾款 40%');
  await expect(modal.getByText('發票金額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 12,600');
  await expect(modal.getByText(/12,600/).filter({ hasText: /8,400/ }).first()).toBeVisible();
  await expect(modal.getByRole('button', { name: cjkName('確認') })).toBeEnabled();

  await pressSubmit(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 開出的發票未稅 12,000、稅額 600；該期預計金額仍是 8,400
  const row = installmentRow(page, '尾款 40%');
  await expect(row).toContainText('已開立');
  await expect(row).toContainText('NT$ 8,400');
  await expect(netInvoicedValue(page)).toHaveText('NT$ 12,600');
  await row.getByRole('button', { name: /^SSP-/ }).click();
  await expect(drawer(page)).toContainText('NT$ 12,000');
  await expect(drawer(page)).toContainText('NT$ 600');
});
