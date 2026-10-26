import { test, expect } from '@playwright/test';
import { openAs, clickIntoDetail } from '../_helpers.mjs';
import {
  CHAIN4,
  DOWNLOAD_CENTER,
  actionDialog,
  addBoxes,
  clickRowAction,
  closeShipmentPanel,
  confirmBox,
  createShipment,
  fillPackingLines,
  gotoInAppSafe,
  openCreateShipmentFromOrder,
  openLogisticsAction,
  openShipmentPanel,
  setupShippableState,
  shipmentRow,
  startPicking,
  submitButton,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 情境目錄 14.45（2026-10-23 新增）：介面字樣檢查。
// 依據：Sens memory/shared/ui-wording.md 第一節（G19、G20），grill G1、G3、G16、G18、G23、H6、H7。
// 檢查範圍：出貨管理、出貨單對話框、訂單出貨單頁籤、下載中心。
// 規則：對話框標題（建立時「建立＋單據名」、檢視時「單據編號＋狀態」）；送出鈕文字＝動作名稱（不寫「確定」「送出」）；
// 批次動作寫「批次＋動作」；已刪除的欄位與操作字樣不得出現在畫面上。

test.describe.configure({ timeout: 240_000 });

// 已刪除的欄位與操作（H6、H7、G1、G3、G16）
const REMOVED_WORDS = ['實際出貨日', '離廠時間', '送達憑證', '重新同步', '下載全部物流單'];
// 送出鈕不得是泛用字（ui-wording.md：送出鈕文字＝動作名稱）
const GENERIC_SUBMIT = /^\s*(確\s*定|送\s*出|確\s*認|OK)\s*$/;

const expectNoRemovedWords = async (scope, where) => {
  for (const word of REMOVED_WORDS) await expect(scope, `${where} 不得出現「${word}」`).not.toContainText(word);
};

/** 對話框的送出鈕：有一顆文字等於動作名稱，且沒有泛用字的送出鈕 */
const expectSubmitIsAction = async (dialog, action) => {
  await expect(submitButton(dialog, action), `送出鈕應為「${action}」`).toHaveCount(1);
  await expect(dialog.getByRole('button', { name: GENERIC_SUBMIT })).toHaveCount(0);
};

test('14.45 介面字樣：出貨管理、出貨單對話框、訂單出貨單頁籤、下載中心的對話框標題、送出鈕與批次動作照通則，已刪除的字樣不出現', async ({
  page,
}) => {
  // 前置：鏈四 PI-2026-0820 驗收 500；業務從訂單出貨單頁籤建一張新竹物流單
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');

  // 訂單出貨單頁籤：建立鈕；建立時對話框標題「建立出貨單」，送出鈕「建立出貨單」「儲存草稿」
  const createDialog = await openCreateShipmentFromOrder(page);
  await expect(createDialog.locator('.ant-modal-title')).toHaveText('建立出貨單');
  await expect(submitButton(createDialog, '建立出貨單')).toHaveCount(1);
  await expect(submitButton(createDialog, '儲存草稿')).toHaveCount(1);
  await expect(createDialog.getByRole('button', { name: GENERIC_SUBMIT })).toHaveCount(0);
  await expectNoRemovedWords(createDialog, '建立出貨單對話框');
  await createDialog.getByRole('button', { name: /取\s*消/ }).click();
  await expectNoRemovedWords(page.locator('.ant-tabs-tabpane-active'), '訂單出貨單頁籤');
  const hctNo = await createShipment(page, { qty: 100, method: '新竹物流' });

  // 出貨管理列表：已刪除字樣不出現；檢視時標題為「出貨單編號＋狀態」
  await expectNoRemovedWords(page.locator('.ant-layout-content'), '出貨管理');
  const view = await openShipmentPanel(page, 'SH-2026-0601');
  await expect(view.locator('.ant-modal-title')).toContainText('SH-2026-0601');
  await expect(view.locator('.ant-modal-title')).toContainText('已送達');
  await expectNoRemovedWords(view, '出貨單對話框（檢視）');
  await view.getByRole('tab', { name: '歷程' }).click();
  await expectNoRemovedWords(view, '出貨單對話框歷程');
  await closeShipmentPanel(page);

  // 揀貨人員：開始揀貨確認框、裝箱回報對話框的送出鈕＝動作名稱；箱規選項沒有「自訂」，改名「自訂箱規」（G23）
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, hctNo).getByRole('button', { name: '開始揀貨', exact: true }).click();
  await expectSubmitIsAction(confirmBox(page), '開始揀貨');
  await confirmBox(page).getByRole('button', { name: /取\s*消/ }).click();
  await startPicking(page, hctNo);
  const report = await clickRowAction(page, hctNo, '裝箱回報');
  await expectSubmitIsAction(report, '裝箱回報');
  await report.getByRole('button', { name: '新增一箱' }).click();
  await report.locator('.ant-table-tbody .ant-select').first().click({ force: true });
  // 前一個下拉收合動畫可能還留在頁面上，輪詢到箱規下拉的選項出現再比對
  const options = page.locator('.ant-select-dropdown:visible .ant-select-item-option');
  await expect
    .poll(async () => (await options.allInnerTexts()).map((t) => t.trim()), { timeout: 10_000 })
    .toContain('自訂箱規');
  const optionTexts = (await options.allInnerTexts()).map((t) => t.trim());
  expect(optionTexts).not.toContain('自訂');
  await page.keyboard.press('Escape');
  await report.getByRole('button', { name: '移除這一箱' }).first().click();
  await fillPackingLines(report, [{ pickedQty: 100 }]);
  await addBoxes(page, report, { boxes: 2 });
  await submitButton(report, '裝箱回報').click();
  await expect(page.getByText('已裝箱回報').first()).toBeVisible();

  // 修正對話框：送出鈕＝「修正」；確認可出貨確認框：送出鈕＝「確認可出貨」
  const fix = await clickRowAction(page, hctNo, '修正');
  await expectSubmitIsAction(fix, '修正');
  await fix.getByRole('button', { name: /取\s*消/ }).click();
  await shipmentRow(page, hctNo).getByRole('button', { name: '確認可出貨', exact: true }).click();
  await expectSubmitIsAction(confirmBox(page), '確認可出貨');
  await submitButton(confirmBox(page), '確認可出貨').click();
  await expect(page.getByText('已確認可出貨').first()).toBeVisible();
  // 撤回確認可出貨確認框：送出鈕＝「撤回確認可出貨」（不送出）
  await shipmentRow(page, hctNo).getByRole('button', { name: '撤回確認可出貨', exact: true }).click();
  await expectSubmitIsAction(confirmBox(page), '撤回確認可出貨');
  await confirmBox(page).getByRole('button', { name: /取\s*消/ }).click();

  // 出貨人員：批次動作叫「批次拋單」（批次＋動作），送出鈕同名；列印鈕叫「列印」（通用動詞）；拋單對話框送出鈕＝「拋單」
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expectNoRemovedWords(page.locator('.ant-layout-content'), '出貨管理（出貨人員）');
  const batchButtons = shipmentRow(page, hctNo).locator('td').last().getByRole('button');
  const names = await batchButtons.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? e.innerText));
  for (const name of names.filter((n) => n && n.includes('批次'))) expect(name).toMatch(/^批次.+/);
  await shipmentRow(page, hctNo).getByRole('button', { name: '批次拋單', exact: true }).click();
  await expectSubmitIsAction(actionDialog(page), '批次拋單');
  await actionDialog(page).getByRole('button', { name: /取\s*消/ }).click();
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /^\s*列\s*印\s*$/ })).toHaveCount(1);
  const dispatch = await openLogisticsAction(page, hctNo, '拋單', 0);
  await expectSubmitIsAction(dispatch, '拋單');
  await dispatch.getByRole('button', { name: /取\s*消/ }).click();

  // 下載中心：已刪除字樣不出現；列上的動作用通用動詞「下載」
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expectNoRemovedWords(page.locator('.ant-layout-content'), '下載中心');
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /^\s*下\s*載\s*$/ }).first()).toBeVisible();

  // 訂單出貨單頁籤（業務）：已刪除字樣不出現
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText(hctNo);
  await expectNoRemovedWords(page.locator('.ant-tabs-tabpane-active'), '訂單出貨單頁籤');
});

test('14.45 介面字樣：鏈一已送達樣本的物流單動作（出貨人員）沒有已刪除的操作，訂單出貨單頁籤同', async ({ page }) => {
  await openAs(page, '出貨人員', '/qc-shipping/shipments');
  const panel = await openShipmentPanel(page, 'SH-2026-0601');
  for (const name of ['重新同步', '補附送達憑證', '下載全部物流單']) {
    await expect(panel.getByRole('button', { name })).toHaveCount(0);
  }
  await expectNoRemovedWords(panel, '鏈一出貨單對話框');
  await closeShipmentPanel(page);
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expectNoRemovedWords(page.locator('.ant-tabs-tabpane-active'), '鏈一訂單出貨單頁籤');
});
