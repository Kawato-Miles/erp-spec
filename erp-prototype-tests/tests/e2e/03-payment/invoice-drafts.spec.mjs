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
  issueButton,
  netInvoicedValue,
  openOrderInApp,
  orderHeader,
  pickDate,
  pickOption,
  saveDraftButton,
  toastText,
  waitModalsClosed,
} from './_local.mjs';

// 情境目錄第三章 3.14～3.23：發票草稿與開立失敗（change order-review-gate-invoice-draft-transfer-receipt，
// 2026-10-06 第三輪裁決：單一入口、儲存草稿、開立失敗、刪人工補登與處理中）。
// 起點資料：鏈外 ORD-2026-0812（第 1 期草稿 INV-0812-1、第 2 期開立失敗 INV-0812-2「統編格式錯誤」、
// 第 3 期金額不一致草稿 INV-0812-3、第 4 期尚無發票）、ORD-2026-0813（已回簽、一期設計費）、
// ORD-2026-0814（草稿訂單、尚無收款項目）。數字驗算在 tests/unit/payment/invoice-*.test.mjs。
//
// 畫面約定：
//
// | 位置 | 約定 |
// | --- | --- |
// | 收款項目列 | 只有一個入口，圖示按鈕可及名稱「開立發票」；該期有草稿時按下帶入草稿；已開立或開立失敗時不渲染 |
// | 開立視窗 | 兩顆動作鈕「儲存草稿」（不檢核）與「開立」（送出時檢核）；被系統擋下時視窗不關並列出缺項；含單選「藍新回應（模擬）」：開立成功／回傳失敗／逾時沒有回應，選回傳失敗時另有失敗原因欄 |
// | 發票區 | 草稿不列；開立失敗列出，狀態「開立失敗」、開立失敗原因欄顯示原因，操作欄沒有任何按鈕；沒有人工補登、沒有補登人 |

const ORDER_0812 = '/orders/detail?id=ORD-2026-0812&tab=paymentPlan';

/** 發票區的所有列 */
const invoiceRows = (page) => invoiceTable(page).locator('tbody tr.ant-table-row');
/** 發票區狀態為開立失敗的列 */
const failedRows = (page) => invoiceRows(page).filter({ hasText: '開立失敗' });

/** 自收款項目列按「開立發票」開啟開立視窗 */
async function openIssue(page, description) {
  await entryButton(installmentRow(page, description), '開立發票').click({ timeout: 10_000 });
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  return modal;
}

/** 開立視窗內按「開立」；按鈕因品項差額停用時不按，交由後續斷言判讀 */
async function pressIssue(modal) {
  const issue = issueButton(modal);
  if (await issue.isEnabled()) await issue.click();
}

/** 選藍新回應的模擬結果 */
async function simulatePlatform(modal, label) {
  await modal.getByRole('radio', { name: label }).check();
}

test('3.14 收款項目上只有「開立發票」一個入口，對話框內可儲存草稿或開立', async ({ page }) => {
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

  // 尚無發票：只有「開立發票」，發票淨額 0
  const firstRow = () => installmentRow(page, '訂金');
  await expectEntries(firstRow(), ['開立發票']);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 儲存草稿：買受人統編清空，統編空白不擋
  const draftModal = await openIssue(page, '訂金');
  await expect(saveDraftButton(draftModal)).toBeVisible();
  await expect(issueButton(draftModal)).toBeVisible();
  await draftModal.getByLabel('買受人統一編號').fill('');
  await saveDraftButton(draftModal).click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);

  // 草稿不列在發票區；該期仍是「開立發票」、開發票狀態未開立、發票淨額 0
  await expectEntries(firstRow(), ['開立發票']);
  await expect(firstRow()).toContainText('未開立');
  await expect(invoiceRows(page)).toHaveCount(0);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 再按「開立發票」：帶入草稿（統編仍空白），補上統編後開立，銷售額 3,750、稅額 188
  const issueModal = await openIssue(page, '訂金');
  await expect(issueModal.getByLabel('買受人統一編號')).toHaveValue('');
  await issueModal.getByLabel('買受人統一編號').fill('27638451');
  await expect(issueModal.getByText('銷售額（未稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 3,750');
  await expect(issueModal.getByText('稅額', { exact: true }).locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 188');
  await pressIssue(issueModal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  await expect(firstRow()).toContainText('已開立');
  await expectEntries(firstRow(), []);
  await expect(invoiceRows(page)).toHaveCount(1);
  await expect(invoiceRows(page).first()).toContainText('開立');
  await expect(netInvoicedValue(page)).toHaveText('NT$ 3,938');
});

test('3.15 草稿不檢核、開立時才檢核：被系統擋下時維持草稿並顯示缺項，以草稿內容送出', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 第 1 期按「開立發票」帶入草稿，改地址、品項改兩列合計 3,998 後儲存草稿：不檢核、照樣存下
  const modal = await openIssue(page, '訂金 20%');
  await modal.getByLabel('買受人地址').fill('高雄市前金區中正四路 200 號');
  await modal.getByRole('button', { name: cjkName('新增品項') }).click();
  const prices = modal.getByLabel('單價（未稅）');
  await prices.nth(0).fill('2000');
  await modal.getByLabel('數量').nth(1).fill('1');
  await prices.nth(1).fill('1998');
  await saveDraftButton(modal).click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('未開立');

  // 開立：擋下並列出未稅目標值 4,000、品項加總 3,998、差額 2，發票維持草稿、不列在發票區
  const issueModal = await openIssue(page, '訂金 20%');
  await expect(issueModal.getByLabel('買受人地址')).toHaveValue('高雄市前金區中正四路 200 號');
  await pressIssue(issueModal);
  await expect(issueModal.getByText(/未稅目標值[^0-9]*4,000/).first()).toBeVisible();
  await expect(issueModal.getByText(/品項加總[^0-9]*3,998/).first()).toBeVisible();
  await expect(issueModal.getByText(/差額[^0-9]*2(?![0-9,])/).first()).toBeVisible();
  await expect(failedRows(page)).toHaveCount(1); // 只有起點第 2 期那張，第 1 期沒有被送出

  // 調平到 4,000 後開立成立
  await issueModal.getByLabel('單價（未稅）').nth(1).fill('2000');
  await pressIssue(issueModal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '訂金 20%')).toContainText('已開立');

  // 開出的發票帶草稿上的新地址，系統不自訂單重新帶入
  await installmentRow(page, '訂金 20%').getByRole('button', { name: /^SSP-/ }).click();
  await expect(drawer(page)).toContainText('高雄市前金區中正四路 200 號');
});

test('3.16 藍新回傳失敗或逾時轉開立失敗，列在發票區並顯示原因；未存草稿被系統擋下時不建立發票', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', ORDER_0812);

  // 起點：第 2 期開立失敗列在發票區、顯示原因，沒有任何操作；該期不顯示「開立發票」
  await expect(failedRows(page)).toHaveCount(1);
  await expect(failedRows(page).first()).toContainText('統編格式錯誤');
  await expect(failedRows(page).first().getByRole('button')).toHaveCount(0);
  await expect(installmentRow(page, '期中款 20%')).toContainText('未開立');
  await expectEntries(installmentRow(page, '期中款 20%'), []);

  // 第 4 期統編 7 碼按開立：被系統擋下、視窗不關並列出缺項，不建立任何發票
  const direct = await openIssue(page, '尾款 20%');
  await direct.getByLabel('買受人統一編號').fill('8421057');
  await pressIssue(direct);
  await expect(direct.getByText('買受人統編須為 8 碼').first()).toBeVisible();
  await expect(failedRows(page)).toHaveCount(1);

  // 改回 8 碼，模擬藍新回傳失敗、原因「統編格式錯誤」：轉開立失敗、列在發票區
  await direct.getByLabel('買受人統一編號').fill('84210573');
  await simulatePlatform(direct, '回傳失敗');
  await direct.getByLabel('藍新回傳的失敗原因（模擬）').fill('統編格式錯誤');
  await pressIssue(direct);
  await toastText(page, /開立失敗/);
  await waitModalsClosed(page);
  await expect(failedRows(page)).toHaveCount(2);
  await expect(installmentRow(page, '尾款 20%')).toContainText('未開立');
  await expectEntries(installmentRow(page, '尾款 20%'), []);

  // 第 1 期帶入草稿，模擬藍新逾時沒有回應：轉開立失敗、原因「逾時沒有回應」
  const timeout = await openIssue(page, '訂金 20%');
  await simulatePlatform(timeout, '逾時沒有回應');
  await pressIssue(timeout);
  await toastText(page, /開立失敗/);
  await waitModalsClosed(page);
  await expect(failedRows(page)).toHaveCount(3);
  await expect(failedRows(page).filter({ hasText: '逾時沒有回應' })).toHaveCount(1);
  await expect(installmentRow(page, '訂金 20%')).toContainText('未開立');
  await expectEntries(installmentRow(page, '訂金 20%'), []);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');
});

test('3.17 同一期只容一張未作廢發票：儲存草稿後該期仍是開立發票、發票區不列', async ({ page }) => {
  // 兩人同時送出時後到者被拒、開立失敗佔用額度的寫入檢查以純函式驗證（invoice-drafts.test.mjs 3.17）；畫面段只驗入口
  await openAs(page, '業務', ORDER_0812);
  await expectEntries(installmentRow(page, '尾款 20%'), ['開立發票']);

  const modal = await openIssue(page, '尾款 20%');
  await saveDraftButton(modal).click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);

  await expectEntries(installmentRow(page, '尾款 20%'), ['開立發票']);
  await expect(invoiceRows(page)).toHaveCount(1);
});

test('3.18 不要的草稿以取消收款項目處理；掛開立失敗發票的期次取消被擋下', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 發票區沒有刪除操作
  await expect(invoiceTable(page).getByRole('button', { name: /刪除/ })).toHaveCount(0);

  // 第 2 期掛開立失敗：取消圖示停用並提示須先由後端人員刪除該筆紀錄
  const failedCancel = installmentRow(page, '期中款 20%').getByRole('button', { name: '取消收款項目' });
  await expect(failedCancel).toBeDisabled();
  await failedCancel.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('這一期的發票開立失敗，須先由後端人員刪除該筆紀錄');

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

  // 第 1 期已取消、不再有開立發票；PAY-0812-1 對第 1 期的核銷分配一併解除
  await expect(installmentRow(page, '訂金 20%')).toContainText('已取消');
  await expectEntries(installmentRow(page, '訂金 20%'), []);
  const paymentRow = page.locator('tbody tr.ant-table-row').filter({ hasText: 'TXN-0814-5521' }).first();
  await expect(paymentRow).toBeVisible();
  await expect(paymentRow).not.toContainText('訂金 20%：');
});

test('3.19 草稿、開立失敗與作廢不計入發票淨額、不出現在折讓單可選發票，已取消訂單仍可儲存草稿', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', ORDER_0812);

  // 起點（兩張草稿、一張開立失敗）：發票淨額 0
  await expect(netInvoicedValue(page)).toHaveText('NT$ 0');

  // 第 1 期開立後發票淨額 4,200
  const modal = await openIssue(page, '訂金 20%');
  await pressIssue(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(netInvoicedValue(page)).toHaveText('NT$ 4,200');

  // 折讓只開放給開立的那一張，開立失敗那一列沒有折讓入口
  await expect(invoiceTable(page).getByRole('button', { name: '開立折讓單' })).toHaveCount(1);
  await expect(failedRows(page)).toHaveCount(1);
  await expect(failedRows(page).first().getByRole('button', { name: '開立折讓單' })).toHaveCount(0);

  // 已取消的 ORD-2026-0813 照樣存得出草稿，系統不以訂單狀態擋下；草稿不列在發票區
  await openOrderInApp(page, 'ORD-2026-0813', gotoInApp);
  await button(page, '取消訂單').click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
  await expect(page.getByText('已取消訂單').last()).toBeVisible();
  await expect(orderHeader(page)).toContainText('已取消');

  const designRow = () => installmentRow(page, '設計費');
  await expectEntries(designRow(), ['開立發票']);
  const draftModal = await openIssue(page, '設計費');
  await saveDraftButton(draftModal).click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);
  await expect(invoiceRows(page)).toHaveCount(0);
  await expectEntries(designRow(), ['開立發票']);

  // 再開一次：帶入的是剛存的草稿，發票金額 3,150
  const again = await openIssue(page, '設計費');
  await expect(again.getByText('發票金額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 3,150');
});

test('3.20 草稿與開立失敗期間開發票狀態維持原值，發票作廢只動開發票狀態', async ({ page }) => {
  test.setTimeout(150_000);
  await openAs(page, '業務', ORDER_0812);
  const row = () => installmentRow(page, '訂金 20%');
  const pendingHas = async (expected) => {
    await gotoInApp(page, '/payment/pending-invoice');
    const pending = page.locator('tbody tr.ant-table-row').filter({ hasText: 'ORD-2026-0812' }).filter({ hasText: '訂金 20%' });
    await expect(pending).toHaveCount(expected ? 1 : 0);
    await openOrderInApp(page, 'ORD-2026-0812', gotoInApp);
  };

  // 第 2 期掛開立失敗：開發票狀態維持未開立
  await expect(installmentRow(page, '期中款 20%')).toContainText('未開立');

  // 起點（掛草稿）：未開立、已收訖、列在待開發票清單
  await expect(row()).toContainText('未開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(true);

  // 開立成功：已開立、已收訖、移出清單
  let modal = await openIssue(page, '訂金 20%');
  await pressIssue(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(false);

  // 發票作廢：已作廢、已收訖、再列出
  const issuedRow = invoiceRows(page).filter({ hasText: 'NT$ 4,200' }).filter({ hasNotText: '開立失敗' }).first();
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

  // 重存草稿：開發票狀態維持已作廢、仍列出
  modal = await openIssue(page, '訂金 20%');
  await saveDraftButton(modal).click();
  await toastText(page, /已儲存草稿/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已作廢');
  await expect(row()).toContainText('已收訖');
  await pendingHas(true);

  // 草稿開立成功：已開立、移出
  modal = await openIssue(page, '訂金 20%');
  await pressIssue(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);
  await expect(row()).toContainText('已開立');
  await expect(row()).toContainText('已收訖');
  await pendingHas(false);
});

test('3.21 開立失敗是業務端終態：沒有補登、再送或作廢，也沒有處理中', async ({ page }) => {
  // 後端人員刪除紀錄後可重開的那一段以純函式驗證（invoice-submit-edge-cases.test.mjs 3.21）
  await openAs(page, '業務', ORDER_0812);

  const failed = failedRows(page).first();
  await expect(failed).toContainText('開立失敗');
  await expect(failed).toContainText('統編格式錯誤');
  // 開立失敗那一列沒有任何操作
  await expect(failed.getByRole('button')).toHaveCount(0);
  await expect(invoiceTable(page).getByRole('button', { name: '人工補登' })).toHaveCount(0);
  // 該期不顯示「開立發票」，業務不能另開一張
  await expectEntries(installmentRow(page, '期中款 20%'), []);
  // 發票區沒有處理中、沒有補登人
  await expect(invoiceTable(page)).not.toContainText('處理中');
  await expect(invoiceTable(page)).not.toContainText('補登人');
});

test('3.22 送出開立期間收款項目被取消：開立先寫入時擋下取消', async ({ page }) => {
  // 取消先寫入、平台後回應成功時系統內不落發票的那一種先後，以純函式驗證（invoice-submit-edge-cases.test.mjs 3.22）
  await openAs(page, '業務', ORDER_0812);

  const modal = await openIssue(page, '訂金 20%');
  await pressIssue(modal);
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 第 1 期開立後，取消鈕停用並提示先作廢該張發票
  const cancelButton = installmentRow(page, '訂金 20%').getByRole('button', { name: '取消收款項目' });
  await expect(cancelButton).toBeDisabled();
  await cancelButton.locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('已開立發票，請先作廢該張發票');
});

test('3.23 草稿發票金額與該期當下預計金額不一致時，開立只提示、不擋下，以草稿金額開立', async ({ page }) => {
  await openAs(page, '業務', ORDER_0812);

  // 第 3 期預計金額 8,400，草稿 12,600：含稅目標值取草稿上的 12,600，並提示兩數不一致
  const modal = await openIssue(page, '尾款 40%');
  await expect(modal.getByText('發票金額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 12,600');
  await expect(modal.getByText(/12,600/).filter({ hasText: /8,400/ }).first()).toBeVisible();
  await expect(issueButton(modal)).toBeEnabled();

  await pressIssue(modal);
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
