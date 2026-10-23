import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { clickIntoDetail, openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  createDraftShipment,
  createShipment,
  fakePhoto,
  fillItemQty,
  fillPlannedShipDate,
  gotoInAppSafe,
  gotoShipmentList,
  newestShipmentNo,
  openCreateShipmentFromOrder,
  addBoxes,
  boxRows,
  closeShipmentPanel,
  dispatchEach,
  dispatchRow,
  logisticsRows,
  openLogisticsAction,
  pickAndPack,
  pickBoxSpec,
  fillPackingLines,
  resyncLogistics,
  openShipmentPanel,
  openShipmentEdit,
  clickRowAction,
  actionDialog,
  confirmBox,
  pickShippingMethod,
  setupShippableState,
  shipmentRow,
  switchRoleSafe,
  rowActionButtons,
  expandShipmentRow,
  boxDimensionInputs,
  batchDispatch,
  batchResultRows,
  closeBatchResult,
} from '../11-qc/_setup.mjs';

// 多數情境要先驗收取得額度、再建單走到出貨，鏈長故放寬逾時
test.describe.configure({ timeout: 180_000 });

// 第三方物流單送達：出貨人員在出貨單對話框的物流單表格按「送達確認」手動回填物流商配達時間
//（也可按「重新同步」模擬物流商回傳；這支走人工備援）
const deliverThirdParty = async (page, shipmentNo, { time = '2026-09-17 10:00', nth = 0 } = {}) => {
  const dialog = await openLogisticsAction(page, shipmentNo, '送達確認', nth);
  const deliveredTime = dialog.getByLabel('物流商配達時間');
  await deliveredTime.click();
  await deliveredTime.fill(time);
  await deliveredTime.press('Enter');
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/).first()).toBeVisible();
};

// 出貨單對話框（上方固定單頭、下方兩個頁籤：出貨明細、歷程），出貨管理列表點單號或檢視鈕打開；
// 狀態推進在列上動作鈕開的另一種對話框，歷程頁籤純唯讀
const detailDrawer = (page) => page.locator('.ant-modal-content:visible').last();

// 關閉出貨單對話框：按底部的「關閉」（檢視）或「取消」（編輯）。開啟後焦點尚未移進對話框時 Esc 會落空，
// 所以不靠鍵盤
const closeDrawer = async (page) => {
  await detailDrawer(page)
    .getByRole('button', { name: /^(關\s*閉|取\s*消)$/ })
    .click();
  await expect(page.locator('.ant-modal-content:visible')).toHaveCount(0);
};

const listHeader = (page) => page.locator('.ant-table-thead').first();

test('12.1 出貨單列表、預計出貨日欄與檢視對話框（原編號 29）', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 出貨管理列表只列、只檢視：不提供新增入口（建單一律從訂單詳情的出貨單頁籤進）
  await expect(page.getByRole('button', { name: '建立出貨單草稿' })).toHaveCount(0);

  // 母表含預計出貨日欄；草稿的明細數量標「（預計）」
  await expect(listHeader(page)).toContainText('預計出貨日');
  const draftRow = shipmentRow(page, CHAIN4.draftShipmentNo);
  await expect(draftRow).toContainText('草稿');
  await expect(draftRow).toContainText('2026-09-10');
  await expect(draftRow).toContainText('（預計）');

  // 草稿的對話框：上方固定單頭、下方兩個頁籤（出貨明細、歷程），不再有基本資訊與進度頁籤
  await draftRow.getByText(CHAIN4.draftShipmentNo).click();
  const drawer = detailDrawer(page);
  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '出貨明細' })).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '歷程' })).toBeVisible();
  await expect(drawer.getByRole('tab', { name: '基本資訊' })).toHaveCount(0);
  await expect(drawer.getByRole('tab', { name: '進度' })).toHaveCount(0);
  await expect(drawer).toContainText('預計出貨日');
  await expect(drawer).toContainText('實際出貨日');
  await expect(drawer).toContainText('預計數量');
  await closeDrawer(page);

  // 已送達那一張：出貨明細頁籤列的是正式明細（數量欄不再標預計）
  const deliveredRow = shipmentRow(page, 'SH-2026-0601');
  await deliveredRow.getByText('SH-2026-0601').click();
  await detailDrawer(page).getByRole('tab', { name: '出貨明細' }).click();
  await expect(detailDrawer(page)).toContainText('會員卡（客製燙金）');
  await expect(detailDrawer(page)).not.toContainText('預計數量');
  await closeDrawer(page);

  // 狀態篩選：只留已送達（篩選區的 select 排除右上角模擬角色的 select）
  const content = page.locator('.ant-layout-content');
  await content.locator('.ant-select').nth(0).click();
  await page
    .locator('.ant-select-dropdown:visible .ant-select-item-option')
    .filter({ hasText: '已送達' })
    .click();
  await expect(shipmentRow(page, 'SH-2026-0601')).toBeVisible();
  await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);

  // 揀貨人員與出貨人員的列表不列草稿，狀態篩選也沒有草稿這個選項
  for (const role of ['揀貨人員', '出貨人員']) {
    await switchRoleSafe(page, role);
    await gotoInAppSafe(page, '/qc-shipping/shipments');
    await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);
    await page.locator('.ant-layout-content').locator('.ant-select').nth(0).click();
    const options = page.locator('.ant-select-dropdown:visible').last();
    await expect(options).toContainText('未處理');
    await expect(options.locator('.ant-select-item-option', { hasText: '草稿' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  }
});

test('12.2 業務建草稿再建立出貨單，額度在成立那一刻檢核並整張擋下（原編號 127，併入原編號 30）', async ({
  page,
}) => {
  // 前置：品檢驗收讓 PI-2026-0820 取得可出貨額度 500
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');

  // 一顆對話框（從訂單詳情的出貨單頁籤開）：新建時只有出貨明細頁籤（沒有歷程）、底部三顆按鈕
  const dialog = await openCreateShipmentFromOrder(page);
  await expect(dialog.getByRole('tab', { name: '出貨明細' })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: '歷程' })).toHaveCount(0);
  await expect(dialog.getByRole('tab', { name: '基本資訊' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /取\s*消/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '儲存草稿' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '建立出貨單' })).toBeVisible();

  // 出貨明細頁籤預設帶入訂單全部印件，數量預設為剩餘應出量（購買數量 500）
  await dialog.getByRole('tab', { name: '出貨明細' }).click();
  const itemRow = dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) });
  await expect(itemRow).toContainText('500');
  await expect(itemRow.getByRole('spinbutton')).toHaveValue('500');
  // 可逐列移除、也可由上方下拉加回
  await itemRow.getByRole('button', { name: '自本張出貨單移除' }).click();
  await expect(dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })).toHaveCount(0);
  await dialog.locator('.ant-select').filter({ hasText: '新增印件' }).first().click();
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: CHAIN4.printItemNo })
    .first()
    .click();
  await expect(dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })).toHaveCount(1);

  // 儲存草稿只驗預計出貨日（單頭固定在上方，不必切頁籤）
  await fillPlannedShipDate(dialog);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await gotoShipmentList(page);
  const firstDraftNo = await newestShipmentNo(page);
  await expect(shipmentRow(page, firstDraftNo)).toContainText('草稿');

  // 再存一張草稿，同樣填 500：兩張草稿都不佔額度，可出貨額度仍是 500
  await createDraftShipment(page, { qty: 500 });
  const checkDialog = await openCreateShipmentFromOrder(page);
  await checkDialog.getByRole('tab', { name: '出貨明細' }).click();
  await expect(
    checkDialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }),
  ).toContainText('500');
  await checkDialog.getByRole('button', { name: /取\s*消/ }).click();
  await gotoShipmentList(page);

  // 回第一張草稿按「建立出貨單」：必填未齊時頂端列出缺的欄位與所在位置
  const draftDialog = await openShipmentEdit(page, firstDraftNo);
  await draftDialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(draftDialog).toContainText('尚缺 1 項');
  await expect(draftDialog).toContainText('出貨方式（單頭）');
  await expect(page.getByText(/出貨單已成立/)).toHaveCount(0);

  // 必填齊了才比額度：填 600 時整張擋下，訊息只有一句、不逐筆列數字
  await pickShippingMethod(page, draftDialog, '新竹物流');
  await fillItemQty(draftDialog, 600);
  await draftDialog.getByRole('button', { name: '建立出貨單' }).click();
  const blocked = page.locator('.ant-modal-confirm').last();
  await expect(blocked).toContainText('可出貨額度不足，出貨單未成立');
  await expect(blocked).not.toContainText('600');
  await blocked.getByRole('button', { name: '知道了' }).click();

  // 改回 500 即成立：單轉未處理，印件與訂單同時轉出貨中
  await fillItemQty(draftDialog, 500);
  await draftDialog.getByRole('button', { name: '建立出貨單' }).click();
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toBeVisible();
  const noticeText = await notice.innerText();
  expect(noticeText).toContain('出貨單已成立（未處理）');
  expect(noticeText).toContain('印製狀態轉「出貨中」');
  expect(noticeText).toContain(`訂單 ${CHAIN4.orderNo} 狀態轉「出貨中」`);
  await expect(shipmentRow(page, firstDraftNo)).toContainText('未處理');
});

test('12.2（新建入口）一步按建立出貨單，系統先落一張草稿再推成未處理', async ({ page }) => {
  // 前置：品檢驗收讓 PI-2026-0820 取得可出貨額度 500
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 只數出貨單列（關掉的對話框仍留在 DOM，它裡面的印件列也是 ant-table-row）；
  // 先等列表把既有的單畫出來再數，否則數到的是還沒載完的空表
  const shipmentRows = page.locator('tr.ant-table-row').filter({ hasText: /SH-\d{4}-\d{4}/ });
  await expect(shipmentRow(page, CHAIN4.draftShipmentNo)).toBeVisible();
  const before = await shipmentRows.count();
  const draftsBefore = await shipmentRows.filter({ hasText: '草稿' }).count();

  // 在新建的對話框一次填齊直接按「建立出貨單」
  const shipmentNo = await createShipment(page, { qty: 500 });

  // 列表只多一張未處理的單，不留半張草稿
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');
  await expect(shipmentRows).toHaveCount(before + 1);
  await expect(shipmentRows.filter({ hasText: '草稿' })).toHaveCount(draftsBefore);

  // 建單人與建立日期照草稿路徑寫；預計出貨印件已轉為正式明細；歷程第一筆是建立出貨單
  await shipmentRow(page, shipmentNo).getByText(shipmentNo).click();
  const drawer = detailDrawer(page);
  await expect(drawer).toContainText('建單人');
  await expect(drawer).toContainText('洪嘉駿');
  await drawer.getByRole('tab', { name: '歷程' }).click();
  await expect(drawer).toContainText('建立出貨單');
  await drawer.getByRole('tab', { name: '出貨明細' }).click();
  await drawer.getByRole('tab', { name: '出貨明細' }).click();
  // 成立後列的是正式明細：欄名為「數量」而不是草稿的「預計數量」
  await expect(drawer).not.toContainText('預計數量');
});

test('12.2（草稿等待期間印件被棄用）編輯草稿時當場提示，整張擋下', async ({ page }) => {
  // 起點：鏈四 SH-2026-0820 草稿的預計出貨印件為 PI-2026-0820 × 500
  await openAs(page, '業務', '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /訂單項目/ }).click();

  // 業務對那件印件按「取消製作」
  await page
    .getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })
    .first()
    .getByRole('button', { name: '取消製作' })
    .click();
  const confirm = page.locator('.ant-modal-confirm').last();
  await expect(confirm).toContainText(`確定取消製作「${CHAIN4.printItemName}」？`);
  await confirm.getByRole('button', { name: '取消製作' }).click();
  await expect(page.getByText(/已棄用印件/).first()).toBeVisible();

  // 回出貨管理編輯那張草稿：當場列出是哪幾條已棄用，並指出這張草稿請直接刪除
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const dialog = await openShipmentEdit(page, CHAIN4.draftShipmentNo);
  await dialog.getByRole('tab', { name: '出貨明細' }).click();
  await expect(dialog).toContainText('本單有 1 條印件已棄用');
  await expect(dialog).toContainText(CHAIN4.printItemNo);
  await expect(dialog).toContainText('這張草稿請直接刪除');
  await expect(dialog).toContainText('這張草稿還沒填預計出貨印件');

  // 一條都不剩，按「建立出貨單」整張擋下
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(dialog).toContainText('至少一條數量大於 0 的出貨印件（出貨明細頁籤）');
  await expect(page.getByText(/出貨單已成立/)).toHaveCount(0);
});

test('12.3 揀貨人員開始揀貨並逐條回報裝箱，裝箱明細逐箱填箱規、長寬高與照片（原編號 31）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500, method: '順豐' });
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 列上：檢視之外長出「開始揀貨」；按下去先彈確認框，確認後轉打包中
  const row = shipmentRow(page, shipmentNo);
  await expect(row.getByRole('button', { name: '檢視' })).toBeVisible();
  await row.getByRole('button', { name: '開始揀貨' }).click();
  const confirm = confirmBox(page);
  await expect(confirm).toContainText(`開始揀貨：${shipmentNo}`);
  await confirm.getByRole('button', { name: '開始揀貨' }).click();
  await expect(page.getByText(/已開始揀貨/).first()).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');

  // 打包中：列上換成「裝箱回報」，對話框上方唯讀顯示裝箱指示，明細逐條有揀貨數量一個空欄（不預填，沒有每箱幾個欄）；
  // 下方是裝箱明細：沒有單一的箱數與箱規欄，只能逐箱新增（沒有一次新增多箱）
  const dialog = await clickRowAction(page, shipmentNo, '裝箱回報');
  await expect(dialog).toContainText(`裝箱回報：${shipmentNo}`);
  await expect(dialog).toContainText('裝箱指示');
  await expect(dialog).toContainText(CHAIN4.printItemNo);
  await expect(dialog).toContainText('裝箱明細');
  await expect(dialog).not.toContainText('一次新增多箱');
  await expect(dialog.getByLabel('一次新增箱數')).toHaveCount(0);
  await expect(dialog.getByLabel(`每箱幾個 ${CHAIN4.printItemNo}`, { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel('箱數', { exact: true })).toHaveCount(0);
  await expect(dialog.getByLabel(`揀貨數量 ${CHAIN4.printItemNo}`, { exact: true })).toHaveValue('');
  await fillPackingLines(dialog, [{ pickedQty: 500 }]);
  await addBoxes(page, dialog, { boxes: 3 });
  await expect(dialog.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: '新增' })).toHaveCount(3);
  // 裝箱明細每箱有長、寬、高三欄（選有尺寸的箱規時帶入，見 12.44）
  const editorHead = (await dialog.locator('.ant-table').filter({ hasText: '箱規' }).first().locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(editorHead).toEqual(expect.arrayContaining(['箱序', '箱規', '長', '寬', '高']));
  await expect(dialog.getByLabel('長（公分）')).toHaveCount(3);
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成，出貨單轉「已裝箱」/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('已裝箱');

  // 回頭看對話框：出貨明細列顯示揀貨數量；裝箱明細三箱（箱序三位數）；順豐支援子母單，三箱合成一筆物流單
  const after = await openShipmentPanel(page, shipmentNo);
  const itemRow = after.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }).first();
  await expect(itemRow).toContainText('500');
  await expect(after).toContainText('裝箱明細');
  await expect(after).toContainText('物流單');
  await expect(boxRows(after)).toHaveCount(3);
  await expect(boxRows(after).first()).toContainText('001');
  // 裝箱明細欄位：箱序、箱規、長、寬、高、照片、備註、所屬物流單、子單號
  const boxHead = (await after.locator('.ant-table').filter({ hasText: '所屬物流單' }).first().locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(boxHead).toEqual(['箱序', '箱規', '長', '寬', '高', '裝箱照片', '備註', '所屬物流單', '子單號']);
  await expect(logisticsRows(after)).toHaveCount(1);
  await expect(logisticsRows(after).first()).toContainText(`${shipmentNo}-001`);
  await expect(logisticsRows(after).first()).toContainText('已裝箱');
  await after.getByRole('tab', { name: '歷程' }).click();
  await expect(after).toContainText('開始揀貨');
  await expect(after).toContainText('裝箱回報');
  // 歷程的附件是縮圖，檔名在替代文字上
  await expect(after.getByRole('img', { name: /裝箱照\.jpg/ })).not.toHaveCount(0);
});

test('12.4 裝箱回報逐條填揀貨數量、至少一箱、每箱要有箱規與照片，缺一不放行（原編號 128）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500, method: '順豐' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');
  const dialog = await clickRowAction(page, shipmentNo, '裝箱回報');

  // 揀貨數量未填即送出應被擋下（逐條必填），對話框不關、單不推進
  await addBoxes(page, dialog, { boxes: 2 });
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(dialog).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');

  // 補上揀貨數量、但把兩箱都移除（沒有任何裝箱明細）：擋下，提示至少一箱
  await fillPackingLines(dialog, [{ pickedQty: 500 }]);
  const removeButtons = dialog.getByRole('button', { name: '移除這一箱' });
  await removeButtons.first().click();
  await removeButtons.first().click();
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/至少要有一箱/).first()).toBeVisible();
  await expect(dialog).toBeVisible();

  // 新增一箱、選了箱規但沒附照片：擋下，提示每箱至少一張照片
  await dialog.getByRole('button', { name: '新增一箱' }).click();
  await pickBoxSpec(page, dialog, 0);
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/至少要附一張裝箱照片/).first()).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');

  // 補上這一箱的照片才送得出
  await dialog
    .locator('.ant-table-tbody tr.ant-table-row')
    .filter({ hasText: '新增' })
    .first()
    .locator('input[type="file"]')
    .setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成，出貨單轉「已裝箱」/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('已裝箱');
});

test('12.5 揀貨數量與明細不符時揀貨人員照實填、不自行改明細（原編號 54）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500 });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { pickedQty: 470, boxes: 2});

  // 出貨單仍轉已裝箱；警示訊息列出不符並說明不符未解除前不能執行出貨動作；列表在狀態旁標「揀貨不符」
  await expect(shipmentRow(page, shipmentNo)).toContainText('已裝箱');
  await expect(shipmentRow(page, shipmentNo)).toContainText('揀貨不符');
  await expect(shipmentRow(page, shipmentNo)).toContainText('470／500');
  const panel = await openShipmentPanel(page, shipmentNo);
  await expect(panel.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })).toContainText('500');
  await expect(panel).toContainText('揀貨數量與出貨明細不符');
});

test('12.6 標記可自取與拋單，出貨方式各走各的分流，只有拋單方式的出貨單有批次拋單（原編號 32）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 自取單（100）與第三方物流單（100）各建一張（同印件仍有 300 額度可分別出）
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });
  const carrierNo = await createShipment(page, { qty: 100, method: '新竹物流' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, pickupNo, { pickedQty: 100, boxes: 2});
  await pickAndPack(page, carrierNo, { pickedQty: 100, boxes: 2});

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // G39：自取出貨單上沒有任何出貨動作；新竹物流出貨單上只有批次拋單一顆出貨動作（出貨確認與標記可自取沒有出貨單層入口）
  const pickupListRow = shipmentRow(page, pickupNo);
  for (const name of ['標記可自取', '出貨確認', '拋單', '批次拋單']) {
    await expect(pickupListRow.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  const carrierListRow = shipmentRow(page, carrierNo);
  await expect(carrierListRow.getByRole('button', { name: '批次拋單', exact: true })).toHaveCount(1);
  for (const name of ['標記可自取', '出貨確認', '拋單']) {
    await expect(carrierListRow.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  // 新竹物流兩筆物流單列各只有「拋單」
  const carrierBefore = await openShipmentPanel(page, carrierNo);
  await expect(logisticsRows(carrierBefore)).toHaveCount(2);
  for (const i of [0, 1]) {
    const lr = logisticsRows(carrierBefore).nth(i);
    await expect(lr.getByRole('button', { name: '拋單', exact: true })).toHaveCount(1);
    await expect(lr.getByRole('button', { name: '出貨確認', exact: true })).toHaveCount(0);
    await expect(lr.getByRole('button', { name: '標記可自取', exact: true })).toHaveCount(0);
  }
  await closeShipmentPanel(page);
  // 自取：物流單列上的出貨動作鈕名是「標記可自取」（不是出貨確認或拋單）；標記後物流單轉可自取，客戶到廠後才做交付確認
  const pickupBefore = await openShipmentPanel(page, pickupNo);
  const pickupLogistics = logisticsRows(pickupBefore).first();
  await expect(pickupLogistics.getByRole('button', { name: '出貨確認', exact: true })).toHaveCount(0);
  await expect(pickupLogistics.getByRole('button', { name: '拋單', exact: true })).toHaveCount(0);
  await expect(pickupLogistics.getByRole('button', { name: '標記可自取', exact: true })).toBeVisible();
  await closeShipmentPanel(page);
  await dispatchRow(page, pickupNo, '標記可自取', '確認標記可自取');
  await expect(page.getByText(/已標記可自取/).first()).toBeVisible();
  await expect(shipmentRow(page, pickupNo)).toContainText('已出貨');
  const pickupPanel = await openShipmentPanel(page, pickupNo);
  await expect(logisticsRows(pickupPanel)).toHaveCount(1);
  await expect(logisticsRows(pickupPanel).first()).toContainText('可自取');
  await closeShipmentPanel(page);
  const handover = await openLogisticsAction(page, pickupNo, '交付確認');
  await handover.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await handover.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/交付確認完成/).first()).toBeVisible();
  await expect(shipmentRow(page, pickupNo)).toContainText('已送達');

  // 第三方：列上鈕名是「拋單」，對話框沒有物流單號輸入欄、沒有重量欄；新竹物流不支援子母單，兩箱兩筆物流單、各自一個物流單號
  const shipDialog = await openLogisticsAction(page, carrierNo, '拋單', 0);
  await expect(shipDialog.getByLabel(/物流單號|托運單號/)).toHaveCount(0);
  await expect(shipDialog.getByLabel(/重量/)).toHaveCount(0);
  await shipDialog.getByRole('button', { name: '確認拋單' }).click();
  await expect(page.getByText(/已拋單；物流單號 HCT-\d+/)).toBeVisible();
  // 第一筆拋單後出貨單仍取最落後（第二筆還在已裝箱），第二筆拋單後才轉等待出貨
  await expect(shipmentRow(page, carrierNo)).toContainText('已裝箱');
  await dispatchRow(page, carrierNo, '拋單', '確認拋單', 1);
  await expect(shipmentRow(page, carrierNo)).toContainText('等待出貨');
  await expect(shipmentRow(page, carrierNo)).toContainText(/HCT-\d+/);

  // 對話框：兩筆物流單各有物流單號，狀態等待出貨；沒有重量
  const carrierPanel = await openShipmentPanel(page, carrierNo);
  await expect(logisticsRows(carrierPanel)).toHaveCount(2);
  await expect(logisticsRows(carrierPanel).first()).toContainText(/HCT-\d+/);
  await expect(logisticsRows(carrierPanel).first()).toContainText('等待出貨');
  await expect(carrierPanel).not.toContainText('重量');
  await closeShipmentPanel(page);

  // 第三方單：Prototype 不真的串接物流商，由物流單上的「重新同步」模擬回傳；列上沒有模擬鈕，也沒有補填重量；
  // 送達確認與標記例外都在物流單表格內，不在列上
  const carrierRow = shipmentRow(page, carrierNo);
  await expect(carrierRow.getByRole('button', { name: '模擬物流商回報配達' })).toHaveCount(0);
  await expect(carrierRow.getByRole('button', { name: '補填重量' })).toHaveCount(0);
  await expect(carrierRow.getByRole('button', { name: '送達確認' })).toHaveCount(0);
});

test('12.7 三種出貨方式的憑證形式各自不同（原編號 129）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const carrierNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const vanNo = await createShipment(page, { qty: 100, method: '專車配送' });
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  for (const no of [carrierNo, vanNo, pickupNo]) {
    await pickAndPack(page, no, { pickedQty: 100, boxes: 1});
  }

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 第三方物流：拋單不填物流單號（由物流商回傳，原型由系統生成），直接確認即推得動
  await dispatchRow(page, carrierNo, '拋單', '確認拋單');
  await expect(page.getByText(/已拋單；物流單號/).first()).toBeVisible();

  // 專車配送：出貨確認不附件即可轉已出貨
  await dispatchRow(page, vanNo, '出貨確認', '確認出貨');
  await expect(page.getByText(/已出貨確認（專車已發車）/)).toBeVisible();

  // 自取：標記可自取不附件；客戶到廠後交付確認須附現場點交照
  await dispatchRow(page, pickupNo, '標記可自取', '確認標記可自取');
  await expect(page.getByText(/已標記可自取/).first()).toBeVisible();
  let dialog = await openLogisticsAction(page, pickupNo, '交付確認');
  await dialog.getByRole('button', { name: '確認交付' }).click();
  await expect(dialog.getByText('請附現場點交照')).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await dialog.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/交付確認完成（現場點交照已留存）/)).toBeVisible();

  // 專車只有送達確認一條路；送達確認要附司機交付照
  dialog = await openLogisticsAction(page, vanNo, '送達確認');
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(dialog.getByText('請附司機交付照')).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('司機交付照.jpg'));
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/)).toBeVisible();

  // 第三方的送達：物流商回傳到運送中之後，手動回填物流商配達時間（備援）
  await resyncLogistics(page, carrierNo, { times: 2 });
  await deliverThirdParty(page, carrierNo);

  // 送達確認一成立，這張單離開在途；列上只剩檢視與下載全部物流單
  const settledRow = shipmentRow(page, carrierNo);
  await expect(settledRow).toContainText('已送達');
  await expect(settledRow.getByRole('button', { name: '送達確認' })).toHaveCount(0);
  await expect(rowActionButtons(settledRow)).toHaveCount(2);
  await expect(settledRow.getByRole('button', { name: '下載全部物流單' })).toHaveCount(1);
  // 已送達的第三方物流單仍可補附送達憑證（12.25），在出貨單對話框的物流單表格內
  const settledPanel = await openShipmentPanel(page, carrierNo);
  await expect(logisticsRows(settledPanel).first().getByRole('button', { name: '補附送達憑證' })).toHaveCount(1);
  await expect(logisticsRows(settledPanel).first().getByRole('button', { name: '下載物流單' })).toHaveCount(1);
});

test('12.8 累計送達達到購買數量，印件與訂單一起收尾（原編號 130）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500, method: '順豐' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { pickedQty: 500, boxes: 10});

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, shipmentNo, '拋單', '確認拋單');
  await expect(page.getByText(/已拋單；物流單號/).first()).toBeVisible();

  // 物流商回傳到已送達（重新同步三次）：出貨單轉已送達並寫入送達數量，觸發收尾——印件轉已送達、訂單轉訂單完成
  const panel = await openShipmentPanel(page, shipmentNo);
  const syncButton = logisticsRows(panel).first().getByRole('button', { name: '重新同步', exact: true });
  await syncButton.click();
  await expect(page.getByText(/目前為「已出貨」/).last()).toBeVisible();
  await syncButton.click();
  await expect(page.getByText(/目前為「運送中」/).last()).toBeVisible();
  await syncButton.click();
  const notice = page.locator('.ant-message-notice-content').filter({ hasText: '目前為「已送達」' }).last();
  await expect(notice).toBeVisible();
  const noticeText = await notice.innerText();
  expect(noticeText).toContain('印製狀態轉「已送達」');
  expect(noticeText).toContain(`訂單 ${CHAIN4.orderNo} 狀態轉「訂單完成」`);
  await closeShipmentPanel(page);

  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await expect(page.getByText('訂單完成').first()).toBeVisible();
});

test('12.9 業務刪除不再需要的草稿', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  // 刪除在列上：草稿列長出「刪除」鈕，對話框裡沒有危險區
  const draftRow = shipmentRow(page, CHAIN4.draftShipmentNo);
  const panel = await openShipmentPanel(page, CHAIN4.draftShipmentNo);
  await expect(panel).not.toContainText('危險區');
  await expect(panel.getByRole('button', { name: '刪除草稿' })).toHaveCount(0);
  await closeDrawer(page);
  await draftRow.getByRole('button', { name: '刪除' }).click();

  // 二次確認：草稿未佔額度、未推進狀態，不填理由（沒有理由輸入欄）
  const confirm = confirmBox(page);
  await expect(confirm).toContainText(`刪除出貨單草稿：${CHAIN4.draftShipmentNo}`);
  await expect(confirm.locator('textarea, input[type="text"]')).toHaveCount(0);
  await confirm.getByRole('button', { name: '刪除草稿' }).click();

  // 刪後自列表消失，不落已作廢
  await expect(page.getByText(/草稿已刪除/).first()).toBeVisible();
  await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);
});

test('12.10 訂單取消時草稿被刪除、尚未出貨動作的單自動作廢', async ({ page }) => {
  // 前置：品檢驗收後另建一張未處理的出貨單，連同既有草稿一起看連鎖
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500 });
  await expect(shipmentRow(page, CHAIN4.draftShipmentNo)).toContainText('草稿');

  // 業務在訂單詳情取消訂單
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('button', { name: '取消訂單' }).click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: /確\s*定/ })
    .click();

  // 連鎖摘要分兩句：草稿刪除、尚未出貨動作的出貨單自動作廢
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toBeVisible();
  const noticeText = await notice.innerText();
  expect(noticeText).toMatch(/出貨單草稿 1 張已刪除/);
  expect(noticeText).toMatch(/尚未出貨動作的出貨單 1 張自動作廢/);

  // 草稿自列表消失，未處理那一張轉已作廢
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);
  await expect(shipmentRow(page, shipmentNo)).toContainText('已作廢');
});

test('12.11 寄件資訊依訂單的帳務公司帶出', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 建單對話框：寄件資訊寫品牌名稱，唯讀、無編輯入口
  const dialog = await openCreateShipmentFromOrder(page);
  await expect(dialog).toContainText('寄件資訊（依訂單的帳務公司帶出）');
  await expect(dialog).toContainText('感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓');
  await expect(dialog.getByRole('textbox', { name: /寄件/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: /取\s*消/ }).click();
  await gotoShipmentList(page);

  // 已成立的單（鏈一 SH-2026-0601，保密代寄＝否）的對話框顯示同一份寄件資訊
  await shipmentRow(page, 'SH-2026-0601').getByText('SH-2026-0601').click();
  await expect(detailDrawer(page)).toContainText(
    '感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓',
  );
  await expect(detailDrawer(page)).not.toContainText('保密代寄');
});

test('12.12 收件三欄預設帶訂單聯絡人、可改', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  const dialog = await openCreateShipmentFromOrder(page);

  // 三欄預設帶訂單客戶的聯絡人資料
  await expect(dialog.locator('#receiver_name')).toHaveValue(CHAIN4.contactPerson);
  await expect(dialog.locator('#receiver_phone')).toHaveValue(CHAIN4.contactPhone);
  await expect(dialog.locator('#receiver_address')).toHaveValue(CHAIN4.contactAddress);

  // 改得動，存下去的是改過的值
  await dialog.locator('#receiver_name').fill('倉儲收貨組');
  await fillPlannedShipDate(dialog);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await gotoShipmentList(page);
  const draftNo = await newestShipmentNo(page);
  const drawer = await openShipmentEdit(page, draftNo);
  await expect(drawer.locator('#receiver_name')).toHaveValue('倉儲收貨組');
  await expect(drawer.locator('#receiver_phone')).toHaveValue(CHAIN4.contactPhone);
  await expect(drawer.locator('#receiver_address')).toHaveValue(CHAIN4.contactAddress);
  await closeDrawer(page);

  // 草稿存下去之後三欄就跟著這張單走：訂單事後換窗口聯絡人，草稿上的收件資料不被改掉
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /資訊/ }).first().click();
  await page.getByRole('button', { name: '切換窗口聯絡人' }).click();
  const contactPanel = page.locator('.ant-drawer-content').last();
  await contactPanel.locator('.ant-select').first().click();
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: '備用聯絡人（示範資料）' })
    .first()
    .click();
  await contactPanel.getByRole('button', { name: /確\s*認/ }).click();
  await expect(page.getByText('已切換窗口聯絡人').last()).toBeVisible();

  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const drawerAfter = await openShipmentEdit(page, draftNo);
  await expect(drawerAfter.locator('#receiver_name')).toHaveValue('倉儲收貨組');
  await expect(drawerAfter.locator('#receiver_phone')).toHaveValue(CHAIN4.contactPhone);
  await expect(drawerAfter).not.toContainText('備用聯絡人（示範資料）');
});

test('12.15 列上動作鈕只長出合法的下一步，依角色、狀態與出貨方式過濾', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const carrierNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });

  // 業務在未出貨動作期間：檢視、編輯、作廢三顆；沒有揀貨鈕。檢視對話框預設停在出貨明細、沒有狀態下拉
  const salesRow = shipmentRow(page, carrierNo);
  await expect(salesRow.getByRole('button', { name: '檢視' })).toBeVisible();
  await expect(salesRow.getByRole('button', { name: '編輯' })).toBeVisible();
  await expect(salesRow.getByRole('button', { name: '作廢' })).toBeVisible();
  await expect(salesRow.getByRole('button', { name: '開始揀貨' })).toHaveCount(0);
  await expect(rowActionButtons(salesRow)).toHaveCount(3);
  const salesPanel = await openShipmentPanel(page, carrierNo);
  await expect(salesPanel.locator('.ant-tabs-tab-active')).toContainText('出貨明細');
  await expect(salesPanel.getByLabel(/推進到/)).toHaveCount(0);
  await expect(salesPanel.getByRole('button', { name: '送出進度' })).toHaveCount(0);
  await expect(salesPanel).toContainText('未處理');
  await closeDrawer(page);

  // 揀貨人員未處理列上只有檢視與開始揀貨
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const pickerRow = shipmentRow(page, carrierNo);
  await expect(pickerRow.getByRole('button', { name: '開始揀貨' })).toBeVisible();
  await expect(pickerRow.getByRole('button', { name: '裝箱回報' })).toHaveCount(0);
  await expect(rowActionButtons(pickerRow)).toHaveCount(2);
  await pickerRow.getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, carrierNo)).toContainText('打包中');

  // 打包中只有裝箱回報，對話框要填的欄位都在：逐條揀貨數量、裝箱明細（逐箱新增、箱規與照片）
  await expect(shipmentRow(page, carrierNo).getByRole('button', { name: '開始揀貨' })).toHaveCount(0);
  const packDialog = await clickRowAction(page, carrierNo, '裝箱回報');
  await expect(packDialog.getByLabel(`揀貨數量 ${CHAIN4.printItemNo}`, { exact: true })).toBeVisible();
  await expect(packDialog.getByLabel(`每箱幾個 ${CHAIN4.printItemNo}`, { exact: true })).toHaveCount(0);
  await expect(packDialog.getByLabel('一次新增箱數')).toHaveCount(0);
  await expect(packDialog.getByRole('button', { name: '新增一箱' })).toBeVisible();
  await fillPackingLines(packDialog, [{ pickedQty: 100 }]);
  await addBoxes(page, packDialog, { boxes: 2 });
  await packDialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(shipmentRow(page, carrierNo)).toContainText('已裝箱');
  await pickAndPack(page, pickupNo, { pickedQty: 100, boxes: 2});

  // 出貨人員：新竹物流單列上有檢視與批次拋單（拋單方式的已裝箱單，G39、G56）；逐筆出貨動作與其他物流單層動作都不在列上；
  // 出貨動作依出貨方式分流，在對話框物流單表格每一列：第三方是拋單、自取是標記可自取
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const carrierRow = shipmentRow(page, carrierNo);
  for (const name of ['拋單', '出貨確認', '標記可自取', '交付確認', '送達確認', '異常']) {
    await expect(carrierRow.getByRole('button', { name, exact: true })).toHaveCount(0);
  }
  await expect(carrierRow.getByRole('button', { name: '批次拋單', exact: true })).toBeEnabled();
  await expect(rowActionButtons(carrierRow)).toHaveCount(2);
  const carrierPanelView = await openShipmentPanel(page, carrierNo);
  await expect(logisticsRows(carrierPanelView)).toHaveCount(2);
  for (const row of [logisticsRows(carrierPanelView).nth(0), logisticsRows(carrierPanelView).nth(1)]) {
    await expect(row.getByRole('button', { name: '拋單', exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: '出貨確認', exact: true })).toHaveCount(0);
    await expect(row.getByRole('button', { name: '標記可自取', exact: true })).toHaveCount(0);
  }
  await closeShipmentPanel(page);
  const pickupRow = shipmentRow(page, pickupNo);
  await expect(rowActionButtons(pickupRow)).toHaveCount(1);
  const pickupPanelView = await openShipmentPanel(page, pickupNo);
  await expect(logisticsRows(pickupPanelView).first().getByRole('button', { name: '標記可自取', exact: true })).toBeVisible();
  await expect(logisticsRows(pickupPanelView).first().getByRole('button', { name: '出貨確認', exact: true })).toHaveCount(0);
  await closeShipmentPanel(page);

  // 印務主管看同一張單：全公司協助角色有檢視、編輯、作廢三顆（C18，依訂單編輯權），沒有任何現場動作鈕；
  // 對話框歷程頁籤純唯讀
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const managerRow = shipmentRow(page, carrierNo);
  await expect(managerRow.getByRole('button', { name: '檢視' })).toBeVisible();
  await expect(managerRow.getByRole('button', { name: '編輯' })).toBeVisible();
  await expect(managerRow.getByRole('button', { name: '作廢' })).toBeVisible();
  await expect(managerRow.getByRole('button', { name: '拋單' })).toHaveCount(0);
  await expect(managerRow.getByRole('button', { name: '批次拋單' })).toHaveCount(0);
  await expect(rowActionButtons(managerRow)).toHaveCount(3);
  const readOnlyPanel = await openShipmentPanel(page, carrierNo);
  await readOnlyPanel.getByRole('tab', { name: '歷程' }).click();
  await expect(readOnlyPanel).toContainText('裝箱回報');
  await expect(readOnlyPanel.getByRole('button', { name: '送出進度' })).toHaveCount(0);
});

test('12.16 列上動作鈕直接開該動作的填寫畫面，訂單出貨頁籤與出貨管理共用同一組鈕與同一顆對話框', async ({
  page,
}) => {
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 出貨管理：草稿列長出檢視、編輯、刪除三顆
  const draftRow = shipmentRow(page, CHAIN4.draftShipmentNo);
  await expect(draftRow.getByRole('button', { name: '檢視' })).toHaveCount(1);
  await expect(draftRow.getByRole('button', { name: '編輯' })).toHaveCount(1);
  await expect(draftRow.getByRole('button', { name: '刪除' })).toHaveCount(1);
  await expect(rowActionButtons(draftRow)).toHaveCount(3);

  // 檢視是唯讀：沒有儲存草稿鈕、沒有危險區
  const viewPanel = await openShipmentPanel(page, CHAIN4.draftShipmentNo);
  await expect(viewPanel.getByRole('button', { name: '儲存草稿' })).toHaveCount(0);
  await expect(viewPanel).not.toContainText('危險區');
  await closeDrawer(page);

  // 編輯開編輯模式的對話框：改草稿的收件人後儲存
  const panel = await openShipmentEdit(page, CHAIN4.draftShipmentNo);
  await panel.locator('#receiver_name').fill('倉儲收貨組');
  await panel.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/草稿已更新/).first()).toBeVisible();

  // 訂單詳情的出貨頁籤：同一組鈕、同一顆對話框，建單入口鎖定本訂單
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.getByRole('button', { name: '建立出貨單草稿' })).toBeVisible();
  const tabRow = page.locator('tr.ant-table-row').filter({ hasText: CHAIN4.draftShipmentNo });
  await expect(tabRow.getByRole('button', { name: '檢視' })).toHaveCount(1);
  await expect(tabRow.getByRole('button', { name: '編輯' })).toHaveCount(1);
  await expect(tabRow.getByRole('button', { name: '刪除' })).toHaveCount(1);
  await tabRow.getByRole('button', { name: '編輯' }).click();
  const tabPanel = page.locator('.ant-modal-content:visible').first();
  await expect(tabPanel).toBeVisible();
  // 兩個入口看到的是同一張單：剛才改的收件人在這裡也看得到
  await expect(tabPanel.locator('#receiver_name')).toHaveValue('倉儲收貨組');
  await expect(tabPanel.getByRole('tab', { name: '歷程' })).toBeVisible();
  // 鎖定本訂單：對話框不提供選訂單的下拉
  await expect(tabPanel.getByText('選擇訂單')).toHaveCount(0);
});

// 下拉選一個選項（限定在當前可見的那個下拉；伺服器忙碌時第一次點擊偶爾落空，整段重試）
const pickFromSelect = async (page, select, label) => {
  await expect(async () => {
    await select.click({ force: true });
    await page
      .locator('.ant-select-dropdown:visible')
      .last()
      .locator('.ant-select-item-option')
      .filter({ hasText: label })
      .first()
      .click({ timeout: 3000 });
  }).toPass({ timeout: 15000 });
};

test('12.17 諮詢從訂單詳情的出貨單頁籤替自己負責的訂單建出貨單', async ({ page }) => {
  // 起點：業務把鏈四 ORD-2026-0820 以「編輯（代理）」分享給諮詢張惠雯
  await openAs(page, '業務', '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.locator('.ant-tabs-tab', { hasText: '分享' }).first().click();
  await page.getByRole('button', { name: /新增分享成員/ }).click();
  const addModal = page.locator('.ant-modal-content:visible').last();
  await pickFromSelect(page, addModal.locator('.ant-select').nth(0), '張惠雯');
  await pickFromSelect(page, addModal.locator('.ant-select').nth(1), '編輯（代理）');
  await addModal.getByRole('button', { name: /新\s*增/ }).click();
  await expect(page.getByText('已新增分享成員').last()).toBeVisible();

  // 諮詢對自己負責的訂單有出貨單與品檢紀錄的檢視活動（出貨與售後檢視 ACT-VDLV-001、生產單據檢視 ACT-VPRD-021），
  // 側欄有品檢與出貨；建草稿仍從訂單詳情的出貨單頁籤進
  await switchRoleSafe(page, '諮詢');
  await expect(page.locator('.ant-menu-submenu-title', { hasText: '品檢與出貨' })).toHaveCount(1);
  const dialog = await openCreateShipmentFromOrder(page);
  await fillPlannedShipDate(dialog);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await expect(dialog).toBeHidden();

  // 新草稿列在這張訂單的出貨單頁籤，建單人是諮詢本人
  const draftRow = page
    .locator('tr.ant-table-row')
    .filter({ hasText: /SH-\d{4}-\d{4}/ })
    .filter({ hasText: '草稿' })
    .filter({ hasNotText: CHAIN4.draftShipmentNo })
    .first();
  await expect(draftRow.getByRole('button', { name: '檢視' })).toHaveCount(1);
  await draftRow.getByRole('button', { name: '編輯' }).click();
  const panel = page.locator('.ant-modal-content:visible').first();
  await expect(panel).toContainText('張惠雯');
  // 建單人在草稿上動得了：列上有編輯鈕，編輯對話框有儲存草稿與建立出貨單兩顆鈕
  await expect(panel.getByRole('button', { name: '儲存草稿' })).toBeVisible();
  await expect(panel.getByRole('button', { name: '建立出貨單' })).toBeVisible();
  await closeDrawer(page);

  // 只有檢視層級的訂單（鏈二 ORD-2026-0710 的張惠雯是檢視）：沒有建單入口
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, 'ORD-2026-0710', /orders\/detail/);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.getByRole('button', { name: '建立出貨單草稿' })).toHaveCount(0);
});

test('12.18 建出貨單時出貨方式不帶預設，收件資料照舊帶入', async ({ page }) => {
  // 鏈一 ORD-2026-0601 的訂單出貨方式是專車配送（客戶的出貨偏好），建單時仍不預選
  // 鏈一建立最早、不在訂單列表第一頁，直接開詳情頁
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await page.getByRole('button', { name: '建立出貨單草稿' }).click();
  const dialog = page.locator('.ant-modal-content:visible').first();
  await expect(dialog).toBeVisible();
  const methodItem = dialog.locator('.ant-form-item').filter({ hasText: '出貨方式' }).first();
  await expect(methodItem.locator('.ant-select-selection-item')).toHaveCount(0);
  await expect(methodItem).toContainText('選擇出貨方式');
  // 收件三欄與寄件資訊照舊帶入
  await expect(dialog.locator('#receiver_name')).not.toHaveValue('');
  await expect(dialog.locator('#receiver_address')).not.toHaveValue('');
  await expect(dialog).toContainText('感官文化印刷｜');
  // 鎖定本訂單：對話框不提供選訂單的下拉
  await expect(dialog.getByText('選擇訂單')).toHaveCount(0);
});

test('12.19 揀貨數量與明細不符時擋下出貨動作，業務改明細或揀貨人員修正後放行（2026-10-13 新增）', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 兩張新竹物流單，各出 100；第一張靠業務改明細解除、第二張靠揀貨人員修正解除
  const firstNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const secondNo = await createShipment(page, { qty: 100, method: '新竹物流' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, firstNo, { pickedQty: 80, boxes: 2});
  await pickAndPack(page, secondNo, { pickedQty: 80, boxes: 2});

  // 不符：列表標「揀貨不符」，物流單列內沒有出貨動作鈕（不渲染，不是停用）；出貨單列上的批次拋單停用（見 12.42）
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  for (const no of [firstNo, secondNo]) {
    await expect(shipmentRow(page, no)).toContainText('揀貨不符');
    await expect(rowActionButtons(shipmentRow(page, no))).toHaveCount(2);
    await expect(shipmentRow(page, no).getByRole('button', { name: '批次拋單', exact: true })).toBeDisabled();
    const mismatchPanel = await openShipmentPanel(page, no);
    await expect(logisticsRows(mismatchPanel)).toHaveCount(2);
    await expect(mismatchPanel.getByRole('button', { name: '拋單', exact: true })).toHaveCount(0);
    await closeShipmentPanel(page);
  }

  // 解除一：業務把第一張的出貨明細數量改為 80，兩數相符即放行
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const panel = await openShipmentEdit(page, firstNo);
  await panel
    .getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })
    .getByRole('spinbutton')
    .fill('80');
  await panel.getByRole('button', { name: '儲存明細數量' }).click();
  await expect(page.getByText(/出貨明細數量已更新/).first()).toBeVisible();
  await expect(shipmentRow(page, firstNo)).not.toContainText('揀貨不符');

  // 解除二：揀貨人員把第二張的揀貨數量修正為 100
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const fix = await clickRowAction(page, secondNo, '修正');
  await fillPackingLines(fix, [{ pickedQty: 100 }]);
  await fix.getByLabel('修正原因').fill('清點後找到 20 張');
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(page.getByText(/已修正裝箱回報/).first()).toBeVisible();
  await expect(shipmentRow(page, secondNo)).not.toContainText('揀貨不符');

  // 兩張都放行：出貨人員在物流單表格的每一列長出拋單
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  for (const no of [firstNo, secondNo]) {
    const releasedPanel = await openShipmentPanel(page, no);
    await expect(releasedPanel.getByRole('button', { name: '拋單', exact: true })).toHaveCount(2);
    await closeShipmentPanel(page);
  }
});

test('12.20 揀貨人員在已裝箱修正揀貨數量與裝箱明細，留修正紀錄並寫入歷程；有物流單離廠後只開放部分項目（G49、G55）', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500, method: '新竹物流' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 打包中還沒有裝箱回報，列上沒有修正鈕
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');
  await expect(shipmentRow(page, shipmentNo).getByRole('button', { name: '修正' })).toHaveCount(0);

  const report = await clickRowAction(page, shipmentNo, '裝箱回報');
  await fillPackingLines(report, [{ pickedQty: 480 }]);
  await addBoxes(page, report, { boxes: 2 });
  await report.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(shipmentRow(page, shipmentNo)).toContainText('已裝箱');

  // 已裝箱、物流單都沒有離廠時間且已有裝箱回報：列上長出「修正」；修正原因必填，沒填對話框不關
  const fix = await clickRowAction(page, shipmentNo, '修正');
  await fillPackingLines(fix, [{ pickedQty: 500 }]);
  await fix.getByRole('button', { name: '新增一箱' }).click();
  await pickBoxSpec(page, fix, 2);
  await fix
    .locator('.ant-table-tbody tr.ant-table-row')
    .filter({ hasText: '新增' })
    .first()
    .locator('input[type="file"]')
    .setInputFiles(fakePhoto('第三箱.jpg'));
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(fix).toBeVisible();
  await expect(page.getByText(/已修正裝箱回報/)).toHaveCount(0);
  await fix.getByLabel('修正原因').fill('清點後找到 20 張，多裝一箱');
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(page.getByText(/已修正裝箱回報/).first()).toBeVisible();

  // 對話框：標題標已修正；明細的揀貨數量更新；裝箱明細多一箱；新竹物流一箱一筆，新增箱產生第三筆物流單；
  // 歷程多一筆裝箱回報修正帶前後值與原因
  const panel = await openShipmentPanel(page, shipmentNo);
  await expect(panel).toContainText('已修正');
  await expect(panel.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }).first()).toContainText('500');
  await expect(boxRows(panel)).toHaveCount(3);
  await expect(logisticsRows(panel)).toHaveCount(3);
  await expect(logisticsRows(panel).nth(2)).toContainText(`${shipmentNo}-003`);
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel).toContainText('裝箱回報修正');
  await expect(panel).toContainText('480 → 500');
  await expect(panel).toContainText('新增第 003 箱');
  await expect(panel).toContainText('清點後找到 20 張，多裝一箱');
  await closeShipmentPanel(page);

  // 出貨人員對第一筆物流單拋單之後（部分離廠），揀貨人員列上仍有修正，但只開放部分項目（G49、G55）：
  // 揀貨數量不可改、沒有移除箱的鈕，第一筆物流單底下的箱鎖住，第二、三筆底下的箱可改，新增一箱仍在
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, shipmentNo, '拋單', '確認拋單', 0);
  await expect(page.getByText(/已拋單；物流單號/).first()).toBeVisible();
  const afterDispatch = await openShipmentPanel(page, shipmentNo);
  await expect(logisticsRows(afterDispatch).first()).toContainText('等待出貨');
  await closeShipmentPanel(page);
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, shipmentNo).getByRole('button', { name: '修正' })).toHaveCount(1);
  const partialFix = await clickRowAction(page, shipmentNo, '修正');
  await expect(partialFix.getByLabel(`揀貨數量 ${CHAIN4.printItemNo}`, { exact: true })).toBeDisabled();
  await expect(partialFix.getByRole('button', { name: '移除這一箱' })).toHaveCount(0);
  const specSelects = partialFix.locator('.ant-table-tbody .ant-select');
  await expect(specSelects.nth(0)).toHaveClass(/ant-select-disabled/);
  await expect(specSelects.nth(1)).not.toHaveClass(/ant-select-disabled/);
  await expect(specSelects.nth(2)).not.toHaveClass(/ant-select-disabled/);
  await expect(partialFix.getByRole('button', { name: '新增一箱' })).toBeVisible();
});

test('12.21 出貨人員對第三方出貨單按拋單，系統生成物流單號與子單號、物流單轉等待出貨，可下載物流單（2026-10-13 新增）', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const carrierNo = await createShipment(page, { qty: 100, method: '順豐' });
  const vanNo = await createShipment(page, { qty: 100, method: '專車配送' });
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, carrierNo, { pickedQty: 100, boxes: 3});
  await pickAndPack(page, vanNo, { pickedQty: 100, boxes: 2});
  await pickAndPack(page, pickupNo, { pickedQty: 100, boxes: 2});

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 還沒拋單：沒有下載物流單
  await expect(shipmentRow(page, carrierNo).getByRole('button', { name: '下載全部物流單' })).toHaveCount(0);

  // 拋單：物流單列上的鈕；對話框沒有物流單號輸入欄、沒有重量欄
  const dialog = await openLogisticsAction(page, carrierNo, '拋單');
  await expect(dialog).toContainText(`拋單：${carrierNo}`);
  await expect(dialog.getByLabel(/重量/)).toHaveCount(0);
  await expect(dialog.getByLabel(/物流單號|托運單號/)).toHaveCount(0);
  await dialog.getByRole('button', { name: '確認拋單' }).click();
  // 送出後顯示處理中：處理中期間對話框鎖住，取消鈕停用（G59）
  await expect(dialog).toContainText('拋單處理中');
  await expect(dialog.getByRole('button', { name: /取\s*消/ })).toBeDisabled();
  await expect(page.getByText(/已拋單；物流單號/).first()).toBeVisible();

  const carrierRow = shipmentRow(page, carrierNo);
  await expect(carrierRow).toContainText('等待出貨');
  const trackingNo = (await carrierRow.innerText()).match(/SF\d+/)?.[0];
  expect(trackingNo).toBeTruthy();

  // 對話框：物流單表格列出主單號與三個子單號、離廠時間；單頭實際出貨日寫入（今天）；歷程多一筆拋單；
  // 底部有與列上同一組鈕（含下載全部物流單）
  const view = await openShipmentPanel(page, carrierNo);
  await expect(logisticsRows(view)).toHaveCount(1);
  await expect(logisticsRows(view).first()).toContainText(trackingNo);
  await expect(logisticsRows(view).first()).toContainText(`子單號：${trackingNo}001、${trackingNo}002、${trackingNo}003`);
  await expect(logisticsRows(view).first()).toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  await expect(boxRows(view).first()).toContainText(`${trackingNo}001`);
  await expect(view).toContainText(/實際出貨日\s*\d{4}-\d{2}-\d{2}/);
  await expect(view.getByRole('button', { name: /下載全部物流單/ })).toHaveCount(1);
  await view.getByRole('tab', { name: '歷程' }).click();
  await expect(view).toContainText('拋單成功');
  await expect(view).toContainText(`物流單號：－ → ${trackingNo}`);
  await expect(view).toContainText('已裝箱 → 等待出貨');
  await closeShipmentPanel(page);

  // 下載全部物流單：示意文字檔含出貨單編號、物流單編號與物流單號
  const downloadPromise = page.waitForEvent('download');
  await carrierRow.getByRole('button', { name: '下載全部物流單' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(`${carrierNo}-001`);
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(await download.path(), 'utf-8');
  expect(text).toContain(carrierNo);
  expect(text).toContain(trackingNo);

  // 專車單與自取單沒有外部物流單號：拋單之前沒有下載；出貨動作之後也沒有物流單檔案可下載
  await expect(shipmentRow(page, vanNo).getByRole('button', { name: '下載全部物流單' })).toHaveCount(0);
  await expect(shipmentRow(page, pickupNo).getByRole('button', { name: '下載全部物流單' })).toHaveCount(0);

  // 專車出貨確認、自取標記可自取之後仍沒有物流單號與下載，也沒有補填重量
  await dispatchRow(page, vanNo, '出貨確認', '確認出貨');
  await dispatchRow(page, pickupNo, '標記可自取', '確認標記可自取');
  await expect(shipmentRow(page, vanNo)).toContainText('已出貨');
  await expect(shipmentRow(page, pickupNo)).toContainText('已出貨');
  for (const no of [vanNo, pickupNo]) {
    await expect(shipmentRow(page, no).getByRole('button', { name: '下載全部物流單' })).toHaveCount(0);
    await expect(shipmentRow(page, no).getByRole('button', { name: '補填重量' })).toHaveCount(0);
  }
  // 第三方送達（物流商回傳到運送中後，手動補登配達時間）後同樣沒有補填重量
  await resyncLogistics(page, carrierNo, { times: 2 });
  await deliverThirdParty(page, carrierNo);
  await expect(shipmentRow(page, carrierNo)).toContainText('已送達');
  await expect(shipmentRow(page, carrierNo).getByRole('button', { name: '補填重量' })).toHaveCount(0);
});

// ── 12.22～12.25（2026-10-14）：異常、作廢、補附送達憑證 ──

// 印件列表某件印件列的某一欄文字（以表頭文字找欄序，已出貨與可出貨額度兩欄共用）
const printItemCell = async (page, printItemNo, header) => {
  const headers = await page.locator('.ant-table-thead').first().locator('th').allInnerTexts();
  const index = headers.findIndex((h) => h.includes(header));
  expect(index, `印件列表找不到欄位 ${header}`).toBeGreaterThanOrEqual(0);
  const row = page.locator('tr.ant-table-row').filter({ hasText: printItemNo }).first();
  return (await row.locator('td').nth(index).innerText()).trim();
};

// 詳情頁「標題：值」的值（AntD Descriptions 以 th／td 成對呈現）
const descValue = (page, label) =>
  page.locator(`xpath=//th[normalize-space(.)="${label}"]/following-sibling::td[1]`).first();

// 業務建一張專車單，揀貨裝箱後由出貨人員出貨確認，回傳單號（結束時為出貨人員、在出貨管理列表）
const shipVanOut = async (page, qty = 100) => {
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const vanNo = await createShipment(page, { qty, method: '專車配送' });
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, vanNo, { pickedQty: qty, boxes: 2});
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, vanNo, '出貨確認', '確認出貨');
  await expect(page.getByText(/已出貨確認（專車已發車）/)).toBeVisible();
  return vanNo;
};

test('12.22 出貨人員對物流單標記例外，出貨單轉異常；異常不回補額度，業務作廢物流單才回補，印件列表與印件詳情同時變', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  const vanNo = await shipVanOut(page, 100);

  // 業務在已出貨的單列上沒有「作廢」，標記例外只歸出貨人員
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, vanNo)).toContainText('已出貨');
  await expect(shipmentRow(page, vanNo).getByRole('button', { name: '作廢' })).toHaveCount(0);
  const salesPanel = await openShipmentPanel(page, vanNo);
  await expect(logisticsRows(salesPanel).first().getByRole('button', { name: '標記例外' })).toHaveCount(0);
  await closeShipmentPanel(page);

  // 標記例外前：印件列表已出貨 100、可出貨額度 400
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  expect(await printItemCell(page, CHAIN4.printItemNo, '已出貨')).toBe('100');
  expect(await printItemCell(page, CHAIN4.printItemNo, '可出貨額度')).toBe('400');

  // 出貨人員在物流單列上按「標記例外」：沒選種類、沒填理由時對話框不關、單不變；填妥後出貨單轉異常
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const dialog = await openLogisticsAction(page, vanNo, '標記例外');
  await dialog.getByRole('button', { name: '標記例外' }).click();
  await expect(dialog).toBeVisible();
  await pickFromSelect(page, dialog.locator('.ant-select').first(), '例外事故');
  await dialog.getByLabel('例外理由').fill('客戶拒收');
  await dialog.getByRole('button', { name: '標記例外' }).click();
  await expect(page.getByText(/已標記例外；出貨單狀態依物流單轉「異常」/)).toBeVisible();
  await expect(shipmentRow(page, vanNo)).toContainText('異常');

  // 物流單記例外理由與來源（人工標記），歷程多一筆標記例外；出貨單歷程記狀態依物流單重算
  const panel = await openShipmentPanel(page, vanNo);
  await expect(logisticsRows(panel).first()).toContainText('例外事故');
  await expect(logisticsRows(panel).first()).toContainText('客戶拒收（人工標記）');
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel).toContainText('標記例外：例外事故');
  await expect(panel).toContainText('已出貨 → 例外事故');
  await expect(panel).toContainText('已出貨 → 異常');
  await closeShipmentPanel(page);

  // 異常不回補：已出貨仍 100、可出貨額度仍 400
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  expect(await printItemCell(page, CHAIN4.printItemNo, '已出貨')).toBe('100');
  expect(await printItemCell(page, CHAIN4.printItemNo, '可出貨額度')).toBe('400');

  // 業務作廢這筆物流單（最後一筆，未送達數量由系統預填 100）：出貨單轉已作廢，額度加回
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const voidDialog = await openLogisticsAction(page, vanNo, '作廢物流單');
  await expect(voidDialog).toContainText('這是最後一筆未作廢的物流單');
  await voidDialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(voidDialog).toBeVisible();
  await expect(shipmentRow(page, vanNo)).toContainText('異常');
  await voidDialog.getByLabel('作廢理由').fill('貨已退回');
  await voidDialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(page.getByText(/已作廢最後一筆物流單；出貨單轉「已作廢」/)).toBeVisible();
  await expect(shipmentRow(page, vanNo)).toContainText('已作廢');

  // 印件列表與印件詳情同時變：已出貨歸 0、可出貨額度加回 100
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  expect(await printItemCell(page, CHAIN4.printItemNo, '已出貨')).toBe('0');
  expect(await printItemCell(page, CHAIN4.printItemNo, '可出貨額度')).toBe('500');
  await page.getByText(CHAIN4.printItemName, { exact: true }).first().click();
  // 印件詳情頁在開發環境首次載入要即時編譯，常超過預設 5 秒，這一步放寬到 20 秒
  await expect(page.getByText('印件基本資訊')).toBeVisible({ timeout: 20000 });
  await expect(descValue(page, '可出貨額度')).toHaveText('500');
});

test('12.23 業務對未出貨動作的出貨單作廢，理由必填並記轉入時間，底下物流單一併作廢，額度即時回補', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 100, method: '專車配送' });
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');

  // 出貨人員看同一張單：沒有作廢
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, shipmentNo).getByRole('button', { name: '作廢' })).toHaveCount(0);

  // 業務作廢：理由沒填對話框不關；填「客戶改期」後單轉已作廢
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const dialog = await clickRowAction(page, shipmentNo, '作廢');
  await dialog.getByRole('button', { name: '作廢', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');
  await dialog.getByLabel('作廢理由').fill('客戶改期');
  await dialog.getByRole('button', { name: '作廢', exact: true }).click();
  await expect(page.getByText(/已作廢（終態）；底下物流單一併作廢，明細數量已逐印件回補可出貨額度/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('已作廢');
  // 終態：列上不再有作廢鈕
  await expect(shipmentRow(page, shipmentNo).getByRole('button', { name: '作廢' })).toHaveCount(0);

  // 單上記作廢理由與時間，歷程多一筆作廢出貨單
  const panel = await openShipmentPanel(page, shipmentNo);
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel).toContainText('作廢出貨單');
  await expect(panel).toContainText('未處理 → 已作廢');
  await expect(panel).toContainText('作廢原因：客戶改期');
  await closeShipmentPanel(page);

  // 額度加回：印件列表可出貨額度回到 500
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  expect(await printItemCell(page, CHAIN4.printItemNo, '可出貨額度')).toBe('500');
});

test('12.23（已裝箱）已裝箱且從未出貨動作的單可作廢，物流單一併作廢；出貨動作之後列上沒有作廢鈕', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const packedNo = await createShipment(page, { qty: 100, method: '順豐' });
  const sentNo = await createShipment(page, { qty: 100, method: '專車配送' });
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, packedNo, { pickedQty: 100, boxes: 2});
  await pickAndPack(page, sentNo, { pickedQty: 100, boxes: 2});
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, sentNo, '出貨確認', '確認出貨');

  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 出貨動作之後：整張單沒有作廢鈕，也不能改明細（物流單逐筆作廢）
  await expect(shipmentRow(page, sentNo).getByRole('button', { name: '作廢' })).toHaveCount(0);
  await expect(shipmentRow(page, sentNo).getByRole('button', { name: '編輯' })).toHaveCount(0);
  // 已裝箱未出貨動作：可作廢，作廢後物流單一併作廢
  const dialog = await clickRowAction(page, packedNo, '作廢');
  await dialog.getByLabel('作廢理由').fill('客戶改地址');
  await dialog.getByRole('button', { name: '作廢', exact: true }).click();
  await expect(shipmentRow(page, packedNo)).toContainText('已作廢');
  const panel = await openShipmentPanel(page, packedNo);
  await expect(logisticsRows(panel).first()).toContainText('已作廢');
  await closeShipmentPanel(page);
});

test('12.25 出貨人員對已送達的物流單補附送達憑證，各出貨方式都可，其他狀態沒有這顆鈕', async ({
  page,
}) => {
  // 鏈一 SH-2026-0601（順豐，已送達）；SH-2026-0602（自取，已自取）
  await openAs(page, '出貨人員', '/qc-shipping/shipments');
  const row = shipmentRow(page, 'SH-2026-0601');
  await expect(row).toContainText('已送達');

  // 第三方物流的已送達單：憑證名稱為送達照片；沒選檔送出對話框不關
  const dialog = await openLogisticsAction(page, 'SH-2026-0601', '補附送達憑證');
  await expect(dialog).toContainText('送達照片');
  await dialog.getByRole('button', { name: '送出憑證' }).click();
  await expect(dialog.getByText('請附送達照片')).toBeVisible();
  // 選一張照片送出：單仍為已送達，歷程多一筆補附送達憑證
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('送達照片-補.jpg'));
  await dialog.getByRole('button', { name: '送出憑證' }).click();
  await expect(page.getByText(/已補附送達憑證/).first()).toBeVisible();
  await expect(row).toContainText('已送達');
  const panel = await openShipmentPanel(page, 'SH-2026-0601');
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel).toContainText('補附送達憑證');
  await closeShipmentPanel(page);

  // 自取已自取的 SH-2026-0602 也可補附，憑證名稱為現場點交照
  const selfRow = shipmentRow(page, 'SH-2026-0602');
  await expect(selfRow).toContainText('已送達');
  const selfDialog = await openLogisticsAction(page, 'SH-2026-0602', '補附送達憑證');
  await expect(selfDialog).toContainText('現場點交照');
  await selfDialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照-補.jpg'));
  await selfDialog.getByRole('button', { name: '送出憑證' }).click();
  await expect(page.getByText(/已補附送達憑證/).first()).toBeVisible();

  // 業務看同一張已送達的單：物流單表格沒有這顆鈕
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  for (const no of ['SH-2026-0601', 'SH-2026-0602']) {
    const salesPanel = await openShipmentPanel(page, no);
    await expect(logisticsRows(salesPanel).first()).toBeVisible();
    await expect(salesPanel.getByRole('button', { name: '補附送達憑證' })).toHaveCount(0);
    await closeShipmentPanel(page);
  }
});

test('12.26 出貨完畢樣本：鏈一順豐五箱與自取兩箱，補附送達憑證鈕與物流單下載鈕出現在對的地方', async ({
  page,
}) => {
  // 出貨單：SH-2026-0601 順豐、五箱、一筆物流單、已送達；主單號有值
  await openAs(page, '出貨人員', '/qc-shipping/shipments');
  const row = shipmentRow(page, 'SH-2026-0601');
  await expect(row).toContainText('已送達');
  await expect(row).toContainText('順豐');
  await expect(row).toContainText('SF1400020601');
  await expect(row.getByRole('button', { name: '下載全部物流單' })).toBeVisible();
  const panel = await openShipmentPanel(page, 'SH-2026-0601');
  await expect(boxRows(panel)).toHaveCount(5);
  await expect(logisticsRows(panel)).toHaveCount(1);
  await expect(logisticsRows(panel).first()).toContainText('SF1400020601001、SF1400020601002');
  await expect(logisticsRows(panel).first().getByRole('button', { name: '補附送達憑證' })).toBeVisible();
  await expect(logisticsRows(panel).first().getByRole('button', { name: '下載物流單' })).toBeVisible();
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel).toContainText('物流商配達時間：2026-06-19 09:00');
  await closeShipmentPanel(page);

  // 同訂單另一張 SH-2026-0602 是自取、兩箱、已自取：沒有外部物流單號，沒有下載鈕
  const selfRow = shipmentRow(page, 'SH-2026-0602');
  await expect(selfRow).toContainText('自取');
  await expect(selfRow).toContainText('已送達');
  await expect(selfRow.getByRole('button', { name: '下載全部物流單' })).toHaveCount(0);
  const selfPanel = await openShipmentPanel(page, 'SH-2026-0602');
  await expect(boxRows(selfPanel)).toHaveCount(2);
  await expect(logisticsRows(selfPanel).first()).toContainText('已自取');
});

test('12.26 出貨完畢樣本：訂單訂單完成、出貨單頁籤列出已送達的單，印件印製維度已送達', async ({
  page,
}) => {
  // 訂單：訂單完成
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await expect(page.locator('body')).toContainText('訂單完成');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.locator('body')).toContainText('SH-2026-0601');
  await expect(page.locator('body')).toContainText('SH-2026-0602');

  // 印件：由訂單項目頁籤的「檢視印件」進入，印製維度已送達
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0601' });
  await expect(async () => {
    await itemRow.getByRole('button', { name: '檢視印件' }).click();
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0601/, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  await expect(page.locator('body')).toContainText('已送達');
});

test('12.25 補附送達憑證只在已送達或已自取：已出貨與可自取的物流單沒有，自取交付後憑證名稱為現場點交照', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const vanNo = await createShipment(page, { qty: 100, method: '專車配送' });
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, vanNo, { pickedQty: 100, boxes: 2});
  await pickAndPack(page, pickupNo, { pickedQty: 100, boxes: 2});

  // 已裝箱、已出貨：物流單沒有補附鈕
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, vanNo, '出貨確認', '確認出貨');
  await dispatchRow(page, pickupNo, '標記可自取', '確認標記可自取');
  for (const no of [vanNo, pickupNo]) {
    const p = await openShipmentPanel(page, no);
    await expect(logisticsRows(p).first().getByRole('button', { name: '補附送達憑證' })).toHaveCount(0);
    await closeShipmentPanel(page);
  }

  // 自取交付確認後已自取：補附鈕出現，憑證名稱為現場點交照
  const handover = await openLogisticsAction(page, pickupNo, '交付確認');
  await handover.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await handover.getByRole('button', { name: '確認交付' }).click();
  await expect(shipmentRow(page, pickupNo)).toContainText('已送達');
  const attach = await openLogisticsAction(page, pickupNo, '補附送達憑證');
  await expect(attach).toContainText('現場點交照');
  await attach.locator('input[type="file"]').setInputFiles(fakePhoto('點交照-補.jpg'));
  await attach.getByRole('button', { name: '送出憑證' }).click();
  await expect(page.getByText(/已補附送達憑證/).first()).toBeVisible();
});

// ── 12.32～12.38（2026-10-20）：出貨單裝箱資料與物流單拆分 ──
// 依據：設計 shipment-logistics-split-20261020 § 三（出貨方式與拆單規則）、§ 四（箱規）、§ 六之一（出貨單狀態由物流單計算）、
// § 六之二（物流單狀態與作廢）、§ 七（操作與開放時點）、§ 八之一（額度與未送達數量）。

// 三張樣本在同一條鏈：鏈四 PI-2026-0820 品檢通過 500，各出貨單用 100，額度 500 − 已佔用
const setupPacked = async (page, specs) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const numbers = [];
  for (const { method, qty = 100 } of specs) {
    numbers.push(await createShipment(page, { qty, method }));
  }
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  for (const [i, spec] of specs.entries()) {
    await pickAndPack(page, numbers[i], {
      pickedQty: spec.pickedQty ?? spec.qty ?? 100,
      boxes: spec.boxes ?? 3,
      spec: spec.spec,
      notes: spec.notes,
    });
  }
  return numbers;
};

test('12.32 拆單規則：順豐三箱合成一筆物流單，7-11 交貨便三箱各一筆；箱規不分出貨方式，十筆加自訂', async ({
  page,
}) => {
  const [sfNo, sevenNo] = await setupPacked(page, [{ method: '順豐' }, { method: '7-11 交貨便' }]);

  const sf = await openShipmentPanel(page, sfNo);
  await expect(boxRows(sf)).toHaveCount(3);
  await expect(logisticsRows(sf)).toHaveCount(1);
  for (let i = 0; i < 3; i += 1) {
    await expect(boxRows(sf).nth(i)).toContainText(`${sfNo}-001`);
    await expect(boxRows(sf).nth(i)).toContainText('F12 箱');
  }
  await closeShipmentPanel(page);

  const seven = await openShipmentPanel(page, sevenNo);
  await expect(boxRows(seven)).toHaveCount(3);
  await expect(logisticsRows(seven)).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) {
    await expect(boxRows(seven).nth(i)).toContainText(`${sevenNo}-00${i + 1}`);
    await expect(logisticsRows(seven).nth(i)).toContainText(`${sevenNo}-00${i + 1}`);
    await expect(boxRows(seven).nth(i)).toContainText('F12 箱');
  }
  await closeShipmentPanel(page);

  // 箱規不分出貨方式（G42）：再開一張 7-11 單與一張順豐單的裝箱回報對話框，兩張的下拉相同（不送出）
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const extraSeven = await createShipment(page, { qty: 100, method: '7-11 交貨便' });
  const extraSf = await createShipment(page, { qty: 100, method: '順豐' });
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const expected = [
    'F12 箱',
    'N3 箱（3 號箱）',
    'F13 箱',
    'K1 箱',
    'MIX 箱（新 Mix 散件）',
    '300 拼圖箱',
    '1 號箱',
    '感官箱',
    '馬克杯箱',
    '1000 拼圖箱（地墊箱）',
    '自訂',
  ];
  for (const no of [extraSeven, extraSf]) {
    await shipmentRow(page, no).getByRole('button', { name: '開始揀貨' }).click();
    await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
    await expect(page.getByText(/已開始揀貨/).first()).toBeVisible();
    const dialog = await clickRowAction(page, no, '裝箱回報');
    await dialog.getByRole('button', { name: '新增一箱' }).click();
    await dialog.locator('.ant-table-tbody .ant-select').first().click({ force: true });
    const options = page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option');
    await expect(options).toHaveText(expected);
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: /取\s*消/ }).click();
    await expect(page.locator('.ant-modal-content:visible')).toHaveCount(0);
  }
});

test('12.33 出貨單狀態由物流單計算：取最落後；任一物流單例外即異常，重新同步後恢復', async ({
  page,
}) => {
  const [sevenNo] = await setupPacked(page, [{ method: '7-11 交貨便' }]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 物流單逐筆拋單（G31）：只拋一筆時出貨單仍取最落後的已裝箱，三筆都拋完才轉等待出貨
  await dispatchRow(page, sevenNo, '拋單', '確認拋單', 0);
  await expect(page.getByText(/已拋單；物流單號/).first()).toBeVisible();
  await expect(shipmentRow(page, sevenNo)).toContainText('已裝箱');
  await dispatchRow(page, sevenNo, '拋單', '確認拋單', 1);
  await expect(shipmentRow(page, sevenNo)).toContainText('已裝箱');
  await dispatchRow(page, sevenNo, '拋單', '確認拋單', 2);
  await expect(shipmentRow(page, sevenNo)).toContainText('等待出貨');

  // 只有一筆往前走：出貨單仍取最落後的等待出貨
  await resyncLogistics(page, sevenNo, { times: 1, nth: 0 });
  await expect(shipmentRow(page, sevenNo)).toContainText('等待出貨');
  // 其餘兩筆也到已出貨：出貨單轉已出貨
  await resyncLogistics(page, sevenNo, { times: 1, nth: 1 });
  await resyncLogistics(page, sevenNo, { times: 1, nth: 2 });
  await expect(shipmentRow(page, sevenNo)).toContainText('已出貨');
  // 全部到運送中：出貨單轉運送中
  for (const nth of [0, 1, 2]) await resyncLogistics(page, sevenNo, { times: 1, nth });
  await expect(shipmentRow(page, sevenNo)).toContainText('運送中');

  // 一筆標記例外：出貨單轉異常（優先於其他計算結果）
  const dialog = await openLogisticsAction(page, sevenNo, '標記例外', 2);
  await pickFromSelect(page, dialog.locator('.ant-select').first(), '無追蹤中包裹');
  await dialog.getByLabel('例外理由').fill('查無追蹤');
  await dialog.getByRole('button', { name: '標記例外' }).click();
  await expect(shipmentRow(page, sevenNo)).toContainText('異常');

  // 重新同步取物流商當下的狀態：例外物流單回到已出貨，出貨單恢復依物流單計算（最落後＝已出貨）
  await resyncLogistics(page, sevenNo, { times: 1, nth: 2 });
  await expect(shipmentRow(page, sevenNo)).toContainText('已出貨');
  await expect(shipmentRow(page, sevenNo)).not.toContainText('異常');
});

test('12.34 作廢物流單：逐印件填未送達數量回補額度，最後一筆系統預填、不可改，出貨單轉已作廢，額度共回補不重複', async ({
  page,
}) => {
  test.setTimeout(360_000); // 拋三筆、作廢三筆、切角色查額度四次，是本章最長的一條鏈，180 秒不夠
  const [sevenNo] = await setupPacked(page, [{ method: '7-11 交貨便' }]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchEach(page, sevenNo, '拋單', '確認拋單', 3);
  await expect(shipmentRow(page, sevenNo)).toContainText('等待出貨');

  const quotaOf = async () => {
    await switchRoleSafe(page, '印務主管');
    await gotoInAppSafe(page, '/print-items');
    return printItemCell(page, CHAIN4.printItemNo, '可出貨額度');
  };
  expect(await quotaOf()).toBe('400');

  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const undeliveredField = (dialog) => dialog.getByLabel(`未送達數量 ${CHAIN4.printItemNo}`, { exact: true });

  // 作廢第一筆，未送達 30：理由必填
  let dialog = await openLogisticsAction(page, sevenNo, '作廢物流單', 0);
  await undeliveredField(dialog).fill('30');
  await dialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('作廢理由').fill('一箱遺失');
  await dialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(page.getByText(/已作廢物流單；未送達數量已回補可出貨額度/)).toBeVisible();
  expect(await quotaOf()).toBe('430');

  // 作廢第二筆，未送達 40
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  dialog = await openLogisticsAction(page, sevenNo, '作廢物流單', 1);
  await undeliveredField(dialog).fill('40');
  await dialog.getByLabel('作廢理由').fill('一箱遺失');
  await dialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(page.getByText(/已作廢物流單；未送達數量已回補可出貨額度/)).toBeVisible();
  expect(await quotaOf()).toBe('470');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, sevenNo)).toContainText('等待出貨');

  // 作廢最後一筆：系統預填 100 − 70 ＝ 30，欄位不可改；出貨單轉已作廢，額度共回補 100
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  dialog = await openLogisticsAction(page, sevenNo, '作廢物流單', 2);
  await expect(dialog).toContainText('這是最後一筆未作廢的物流單');
  await expect(undeliveredField(dialog)).toHaveValue('30');
  await expect(undeliveredField(dialog)).toBeDisabled();
  await dialog.getByLabel('作廢理由').fill('一箱遺失');
  await dialog.getByRole('button', { name: '作廢物流單' }).click();
  await expect(page.getByText(/已作廢最後一筆物流單；出貨單轉「已作廢」/)).toBeVisible();
  await expect(shipmentRow(page, sevenNo)).toContainText('已作廢');
  expect(await quotaOf()).toBe('500');
});

test('12.35 自取客戶只載走一部分：交付確認時填未送達數量，系統回補額度', async ({ page }) => {
  const [pickupNo] = await setupPacked(page, [{ method: '自取', boxes: 2 }]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, pickupNo, '標記可自取', '確認標記可自取');

  const dialog = await openLogisticsAction(page, pickupNo, '交付確認');
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await dialog.getByLabel(`未送達數量 ${CHAIN4.printItemNo}`, { exact: true }).fill('30');
  await dialog.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/交付確認完成/).first()).toBeVisible();
  await expect(shipmentRow(page, pickupNo)).toContainText('已送達');

  // 單張佔用量 70，額度 500 − 70 ＝ 430
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  expect(await printItemCell(page, CHAIN4.printItemNo, '可出貨額度')).toBe('430');
  expect(await printItemCell(page, CHAIN4.printItemNo, '已出貨')).toBe('70');
});

test('12.36 拋單失敗：處理中結束時以訊息提示顯示物流商回傳的錯誤，物流單狀態不推進、沒有單筆重試；仍可修正裝箱資料，改箱規後再拋成功（G32、G59）', async ({
  page,
}) => {
  // Prototype 以裝箱備註的示意字樣模擬物流商拒收（不是箱規、不依尺寸）
  const REJECT = '示意：物流商拒收';
  const [sfNo] = await setupPacked(page, [{ method: '順豐', boxes: 2, notes: [REJECT, REJECT] }]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 拋單失敗：處理中結束時訊息提示顯示物流商回傳的錯誤；對話框不關，再按一次確認仍失敗
  const failDialog = await openLogisticsAction(page, sfNo, '拋單');
  await failDialog.getByRole('button', { name: '確認拋單' }).click();
  await expect(failDialog).toContainText('拋單處理中');
  await expect(page.getByText(/物流商回應：這筆托運無法受理/).first()).toBeVisible();
  await expect(failDialog).toBeVisible();
  await failDialog.getByRole('button', { name: '確認拋單' }).click();
  await expect(page.getByText(/物流商回應：這筆托運無法受理/).last()).toBeVisible();
  await expect(failDialog.getByRole('button', { name: '確認拋單' })).toBeEnabled();
  await failDialog.getByRole('button', { name: /取\s*消/ }).click();

  // 物流單狀態不推進、沒有離廠時間、不存失敗原因；沒有單筆重試鈕，仍有拋單鈕
  await expect(shipmentRow(page, sfNo)).toContainText('已裝箱');
  const panel = await openShipmentPanel(page, sfNo);
  await expect(logisticsRows(panel).first()).toContainText('已裝箱');
  await expect(logisticsRows(panel).first()).not.toContainText('無法受理');
  await expect(logisticsRows(panel).first().getByRole('button', { name: '單筆重試' })).toHaveCount(0);
  await expect(logisticsRows(panel).first().getByRole('button', { name: '拋單', exact: true })).toBeVisible();
  await closeShipmentPanel(page);

  // 拋單失敗不算離廠：未出貨動作期間，揀貨人員仍有修正，業務仍可作廢整張與編輯；沒有物流單作廢（尚未部分離廠）
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, sfNo).getByRole('button', { name: '作廢', exact: true })).toHaveCount(1);
  await expect(shipmentRow(page, sfNo).getByRole('button', { name: '編輯' })).toHaveCount(1);
  const salesPanel = await openShipmentPanel(page, sfNo);
  await expect(logisticsRows(salesPanel).first().getByRole('button', { name: '作廢物流單' })).toHaveCount(0);
  await closeShipmentPanel(page);

  // 揀貨人員把兩箱的箱規都改成 1 號箱（修正原因必填）
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const fix = await clickRowAction(page, sfNo, '修正');
  await pickBoxSpec(page, fix, 0, '1 號箱');
  await pickBoxSpec(page, fix, 1, '1 號箱');
  await fix.getByLabel('修正原因').fill('物流商拒收，改用 1 號箱');
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(page.getByText(/已修正裝箱回報/).first()).toBeVisible();

  // 改箱規後再拋單成功：物流單轉等待出貨、寫入物流單號，出貨單轉等待出貨
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, sfNo, '拋單', '確認拋單');
  await expect(page.getByText(/已拋單；物流單號 SF\d+/)).toBeVisible();
  await expect(shipmentRow(page, sfNo)).toContainText('等待出貨');
  await expect(shipmentRow(page, sfNo)).toContainText(/SF\d+/);

  // 順豐只有一筆物流單，它離廠之後沒有可修正的項目：揀貨人員列上沒有修正
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, sfNo).getByRole('button', { name: '修正' })).toHaveCount(0);
});

test('12.37 裝箱明細：逐箱新增、每箱各自一張照片與長寬高、可逐箱移除，沒有一次新增多箱', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 100, method: '全家' });
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  const dialog = await clickRowAction(page, shipmentNo, '裝箱回報');

  // 逐箱新增四箱：四列各自一張照片（每列的上傳清單各有一張）；沒有一次新增多箱的入口
  await expect(dialog.getByLabel('一次新增箱數')).toHaveCount(0);
  await addBoxes(page, dialog, { boxes: 4 });
  const added = dialog.locator('.ant-table-tbody tr.ant-table-row').filter({ hasText: '新增' });
  await expect(added).toHaveCount(4);
  for (let i = 0; i < 4; i += 1) {
    await expect(added.nth(i).locator('.ant-upload-list-item')).toHaveCount(1);
    // 每列各有自己的長、寬、高
    await expect(added.nth(i).getByLabel('長（公分）')).toHaveCount(1);
    await expect(added.nth(i).getByLabel('寬（公分）')).toHaveCount(1);
    await expect(added.nth(i).getByLabel('高（公分）')).toHaveCount(1);
  }
  // 移除一箱剩三箱
  await dialog.getByRole('button', { name: '移除這一箱' }).first().click();
  await expect(added).toHaveCount(3);
  await fillPackingLines(dialog, [{ pickedQty: 100 }]);
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成/).first()).toBeVisible();

  // 全家不支援子母單：三箱三筆物流單，箱序 001 至 003
  const panel = await openShipmentPanel(page, shipmentNo);
  await expect(boxRows(panel)).toHaveCount(3);
  await expect(logisticsRows(panel)).toHaveCount(3);
});

test('12.38 出貨方式下拉七個值，沒有超商；7-11 交貨便與全家各自獨立', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  const dialog = await openCreateShipmentFromOrder(page);
  await dialog.locator('#method').click({ force: true });
  const options = page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option');
  await expect(options).toHaveText([
    '自取',
    '專車配送',
    '順豐',
    '新竹物流',
    '7-11 交貨便',
    '全家',
    '其他',
  ]);
});

// ── 12.39（2026-10-20）：保密代寄 ──
// 依據：G30（設計 shipment-logistics-split-20261020 § 五）。

test('12.39 保密代寄：預設否帶帳務公司唯讀；勾選後三欄預填可改且必填；取消勾選回復；建立後唯讀；物流單與檔案顯示代寄名義', async ({
  page,
}) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 預設不勾：寄件資訊唯讀顯示帳務公司，沒有三個輸入框
  const dialog = await openCreateShipmentFromOrder(page);
  const checkbox = dialog.getByRole('checkbox', { name: /保密代寄/ });
  await expect(checkbox).not.toBeChecked();
  await expect(dialog).toContainText('感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓');
  await expect(dialog.locator('#sender_brand_name')).toHaveCount(0);

  // 勾選：三欄變輸入框，預填帳務公司現值
  await checkbox.check();
  await expect(dialog.locator('#sender_brand_name')).toHaveValue('感官文化印刷');
  await expect(dialog.locator('#sender_phone')).toHaveValue('02 2736 6566');
  await expect(dialog.locator('#sender_address')).toHaveValue('新北市中和區建康路 168 號 3 樓');

  // 改過再取消勾選：回到帳務公司唯讀顯示；再勾選時不保留改過的值
  await dialog.locator('#sender_brand_name').fill('晴禾選物');
  await checkbox.uncheck();
  await expect(dialog.locator('#sender_brand_name')).toHaveCount(0);
  await expect(dialog).toContainText('感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓');
  await checkbox.check();
  await expect(dialog.locator('#sender_brand_name')).toHaveValue('感官文化印刷');

  // 三欄必填：品牌名稱清空，建立出貨單被擋下並列出缺項
  await dialog.locator('#sender_brand_name').fill('');
  await fillPlannedShipDate(dialog, '2026-09-10');
  await pickShippingMethod(page, dialog, '順豐');
  await fillItemQty(dialog, 100);
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('寄件品牌名稱（單頭）');

  // 補齊後建立
  await dialog.locator('#sender_brand_name').fill('晴禾選物');
  await dialog.locator('#sender_phone').fill('02-2755-0123');
  await dialog.locator('#sender_address').fill('台北市大安區復興南路一段 200 號 5 樓');
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(page.getByText(/出貨單已成立（未處理）/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await gotoShipmentList(page);
  const shipmentNo = await newestShipmentNo(page);
  const SENDER = '晴禾選物｜02-2755-0123｜台北市大安區復興南路一段 200 號 5 樓';

  // 建立後唯讀：檢視顯示代寄名義，沒有勾選框與輸入框
  const view = await openShipmentPanel(page, shipmentNo);
  await expect(view).toContainText(`${SENDER}（保密代寄）`);
  await expect(view.getByRole('checkbox', { name: /保密代寄/ })).toHaveCount(0);
  await expect(view.locator('#sender_brand_name')).toHaveCount(0);
  await closeShipmentPanel(page);

  // 走到拋單：物流單表格上方與物流單檔案都用代寄名義
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { pickedQty: 100, boxes: 2 });
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, shipmentNo, '拋單', '確認拋單');
  await expect(page.getByText(/已拋單/).first()).toBeVisible();
  const logistics = await openShipmentPanel(page, shipmentNo);
  await expect(logistics).toContainText(`寄件人：${SENDER}`);
  await closeShipmentPanel(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    shipmentRow(page, shipmentNo).getByRole('button', { name: '下載全部物流單' }).click(),
  ]);
  const text = fs.readFileSync(await download.path(), 'utf8');
  expect(text).toContain(`寄件人：${SENDER}`);
  expect(text).not.toContain('感官文化印刷');
});

test('12.39（樣本）鏈四草稿 SH-2026-0820 為保密代寄，草稿編輯時勾選框已勾、三欄帶草稿的值', async ({
  page,
}) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  const view = await openShipmentPanel(page, CHAIN4.draftShipmentNo);
  await expect(view).toContainText(
    '晴禾選物｜02-2755-0123｜台北市大安區復興南路一段 200 號 5 樓（保密代寄）',
  );
  await closeShipmentPanel(page);

  // 草稿在建立出貨單前可改
  const edit = await openShipmentEdit(page, CHAIN4.draftShipmentNo);
  await expect(edit.getByRole('checkbox', { name: /保密代寄/ })).toBeChecked();
  await expect(edit.locator('#sender_brand_name')).toHaveValue('晴禾選物');
  await expect(edit.locator('#sender_phone')).toHaveValue('02-2755-0123');
});

// ── 12.41～12.45（2026-10-22）：批次拋單、拋單處理中與逾時、箱規共用與長寬高、部分離廠後的修正 ──
// 依據：設計 shipment-batch-dispatch-box-size-20261022；grill G37～G59。
// Prototype 以裝箱備註的示意字樣模擬物流商拒收與逾時（不是箱規、不依尺寸）。
const REJECT_NOTE = '示意：物流商拒收';
const TIMEOUT_NOTE = '示意：物流商逾時';

test('12.41 批次拋單：對出貨單每一筆已裝箱的物流單各拋一次，逐筆獨立、結束時逐筆列出結果', async ({ page }) => {
  const [hctNo, sfNo] = await setupPacked(page, [
    { method: '新竹物流', boxes: 3, notes: [null, null, REJECT_NOTE] },
    { method: '順豐', boxes: 5 },
  ]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 確認框列出本單狀態為已裝箱的三筆物流單；送出後顯示處理中，期間取消鈕停用
  await shipmentRow(page, hctNo).getByRole('button', { name: '批次拋單', exact: true }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toContainText(`批次拋單：${hctNo}`);
  for (const n of ['001', '002', '003']) await expect(dialog).toContainText(`${hctNo}-${n}`);
  await dialog.getByRole('button', { name: '確認批次拋單' }).click();
  await expect(dialog).toContainText('拋單處理中');
  await expect(dialog.getByRole('button', { name: /取\s*消/ })).toBeDisabled();

  // 結束時逐筆列出：第 1、2 筆成功帶物流單號，第 3 筆失敗附物流商回傳的錯誤訊息
  await expect(dialog).toContainText('拋單處理完成：成功 2 筆、失敗 1 筆', { timeout: 15000 });
  const results = batchResultRows(dialog);
  await expect(results).toHaveCount(3);
  await expect(results.nth(0)).toContainText('成功');
  await expect(results.nth(0)).toContainText(/HCT-\d+/);
  await expect(results.nth(1)).toContainText('成功');
  await expect(results.nth(2)).toContainText(`${hctNo}-003`);
  await expect(results.nth(2)).toContainText('失敗');
  await expect(results.nth(2)).toContainText('物流商回應：這筆托運無法受理');
  await closeBatchResult(page);

  // 第 1、2 筆轉等待出貨，第 3 筆停在已裝箱、不存失敗原因；出貨單仍為已裝箱（部分離廠），批次拋單仍在
  await expect(shipmentRow(page, hctNo)).toContainText('已裝箱');
  await expect(shipmentRow(page, hctNo).getByRole('button', { name: '批次拋單', exact: true })).toBeEnabled();
  const panel = await openShipmentPanel(page, hctNo);
  await expect(logisticsRows(panel).nth(0)).toContainText('等待出貨');
  await expect(logisticsRows(panel).nth(1)).toContainText('等待出貨');
  await expect(logisticsRows(panel).nth(2)).toContainText('已裝箱');
  await expect(logisticsRows(panel).nth(2)).not.toContainText('無法受理');
  // 每筆物流單各記一筆拋單成功，出貨單歷程不另記批次事件
  await panel.getByRole('tab', { name: '歷程' }).click();
  await expect(panel.locator('.ant-timeline-item').filter({ hasText: '拋單成功' })).toHaveCount(2);
  await expect(panel.locator('.ant-timeline')).not.toContainText('批次');
  await closeShipmentPanel(page);

  // 再按一次批次拋單：只送出第 3 筆
  const again = await batchDispatch(page, hctNo);
  await expect(batchResultRows(again)).toHaveCount(1);
  await expect(batchResultRows(again).first()).toContainText(`${hctNo}-003`);
  await closeBatchResult(page);

  // 順豐（支援子母單）只有一筆物流單：批次拋單只送這一筆，主單號與五個子單號寫入，之後列上不再有批次拋單
  const sf = await batchDispatch(page, sfNo);
  await expect(sf).toContainText('拋單處理完成：成功 1 筆、失敗 0 筆');
  await expect(batchResultRows(sf)).toHaveCount(1);
  await closeBatchResult(page);
  await expect(shipmentRow(page, sfNo)).toContainText('等待出貨');
  await expect(shipmentRow(page, sfNo).getByRole('button', { name: '批次拋單', exact: true })).toHaveCount(0);
  const sfPanel = await openShipmentPanel(page, sfNo);
  await expect(logisticsRows(sfPanel).first()).toContainText(/子單號：SF\d+001、.*SF\d+005/);
});

test('12.42 批次拋單的顯示與停用：依出貨單狀態與出貨方式，揀貨不符時停用並顯示理由', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const packingNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const packedNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const departedNo = await createShipment(page, { qty: 100, method: '新竹物流' });
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });
  const familyNo = await createShipment(page, { qty: 100, method: '全家' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, packingNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, packingNo)).toContainText('打包中');
  await pickAndPack(page, packedNo, { pickedQty: 100, boxes: 2 });
  await pickAndPack(page, departedNo, { pickedQty: 100, boxes: 1 });
  await pickAndPack(page, pickupNo, { pickedQty: 100, boxes: 1 });
  await pickAndPack(page, familyNo, { pickedQty: 80, boxes: 3 });
  // 揀貨人員看不到批次拋單
  for (const no of [packedNo, familyNo]) {
    await expect(shipmentRow(page, no).getByRole('button', { name: '批次拋單' })).toHaveCount(0);
  }

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await dispatchRow(page, departedNo, '拋單', '確認拋單');
  await expect(shipmentRow(page, departedNo)).toContainText('等待出貨');

  // 只有已裝箱的新竹物流單有批次拋單；打包中、等待出貨的新竹物流單與自取單不渲染
  await expect(shipmentRow(page, packedNo).getByRole('button', { name: '批次拋單', exact: true })).toBeEnabled();
  for (const no of [packingNo, departedNo, pickupNo]) {
    await expect(shipmentRow(page, no).getByRole('button', { name: '批次拋單' })).toHaveCount(0);
  }

  // 揀貨不符的全家單：批次拋單顯示但停用，滑鼠移上顯示理由；出貨單對話框物流單表格旁的同樣停用
  const familyBatch = shipmentRow(page, familyNo).getByRole('button', { name: '批次拋單', exact: true });
  await expect(familyBatch).toBeDisabled();
  await familyBatch.locator('xpath=..').hover();
  await expect(page.locator('.ant-tooltip:visible')).toContainText('揀貨數量與出貨明細不符');
  const familyPanel = await openShipmentPanel(page, familyNo);
  await expect(familyPanel.getByRole('button', { name: '批次拋單' })).toBeDisabled();
  await closeShipmentPanel(page);

  // 業務看不到批次拋單；業務把全家單的明細數量改為 80
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, packedNo).getByRole('button', { name: '批次拋單' })).toHaveCount(0);
  const edit = await openShipmentEdit(page, familyNo);
  await edit.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }).getByRole('spinbutton').fill('80');
  await edit.getByRole('button', { name: '儲存明細數量' }).click();
  await expect(page.getByText(/出貨明細數量已更新/).first()).toBeVisible();
  // 訂單詳情的出貨單頁籤：業務同樣沒有批次拋單
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  const tabRow = page.locator('tr.ant-table-row').filter({ hasText: packedNo }).first();
  await expect(tabRow).toBeVisible();
  await expect(tabRow.getByRole('button', { name: '批次拋單' })).toHaveCount(0);

  // 放行後出貨人員兩處的批次拋單恢復可按
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, familyNo).getByRole('button', { name: '批次拋單', exact: true })).toBeEnabled();
  const released = await openShipmentPanel(page, familyNo);
  await expect(released.getByRole('button', { name: '批次拋單' })).toBeEnabled();
});

test('12.43 拋單處理中與逾時：處理中不能做其他操作，逾時視為失敗、物流單停在已裝箱', async ({ page }) => {
  const [hctNo] = await setupPacked(page, [{ method: '新竹物流', boxes: 1, notes: [TIMEOUT_NOTE] }]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  const dialog = await openLogisticsAction(page, hctNo, '拋單');
  await dialog.getByRole('button', { name: '確認拋單' }).click();
  // 處理中：對話框顯示處理中，取消鈕停用、右上角沒有關閉鈕
  await expect(dialog).toContainText('拋單處理中');
  await expect(dialog.getByRole('button', { name: /取\s*消/ })).toBeDisabled();
  await expect(dialog.locator('.ant-modal-close')).toHaveCount(0);
  // 處理中於逾時結束，告知這一筆逾時失敗
  await expect(page.getByText(/拋單逾時，視為失敗/).first()).toBeVisible({ timeout: 15000 });
  await dialog.getByRole('button', { name: /取\s*消/ }).click();

  // 物流單維持已裝箱，沒有物流單號與離廠時間；出貨單維持已裝箱；物流單列仍有拋單
  await expect(shipmentRow(page, hctNo)).toContainText('已裝箱');
  const panel = await openShipmentPanel(page, hctNo);
  const row = logisticsRows(panel).first();
  await expect(row).toContainText('已裝箱');
  await expect(row).not.toContainText(/HCT-\d+/);
  await expect(row).not.toContainText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/);
  await expect(row.getByRole('button', { name: '拋單', exact: true })).toBeVisible();
});

test('12.44 箱規共用十筆加自訂，選一筆箱規時長寬高照主檔帶入並鎖住、只有自訂可選填', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const familyNo = await createShipment(page, { qty: 100, method: '全家' });
  const sevenNo = await createShipment(page, { qty: 100, method: '7-11 交貨便' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, familyNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, familyNo)).toContainText('打包中');
  const report = await clickRowAction(page, familyNo, '裝箱回報');
  await fillPackingLines(report, [{ pickedQty: 100 }]);
  await addBoxes(page, report, { boxes: 1, spec: '1 號箱' });
  await addBoxes(page, report, { boxes: 1, spec: 'K1 箱', startIndex: 1 });
  await addBoxes(page, report, { boxes: 2, spec: '自訂', startIndex: 2 });

  // 1 號箱：帶入 45、30、15 且不可改
  const first = boxDimensionInputs(report, 0);
  await expect(first.length).toHaveValue('45');
  await expect(first.width).toHaveValue('30');
  await expect(first.height).toHaveValue('15');
  await expect(first.length).toBeDisabled();
  // K1 箱：主檔沒記尺寸，長寬高照實空白且不開放填寫
  const k1 = boxDimensionInputs(report, 1);
  for (const input of [k1.length, k1.width, k1.height]) {
    await expect(input).toHaveValue('');
    await expect(input).toBeDisabled();
  }
  // 自訂：空白、可手填；第一箱填 60、40、30，第二箱留空
  const custom = boxDimensionInputs(report, 2);
  await expect(custom.length).toHaveValue('');
  await expect(custom.length).toBeEnabled();
  await custom.length.fill('60');
  await custom.width.fill('40');
  await custom.height.fill('30');
  await expect(boxDimensionInputs(report, 3).length).toBeEnabled();
  await report.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成/).first()).toBeVisible();

  // 裝箱明細：1 號箱 45、30、15；K1 箱無值；自訂第一箱 60×40×30、第二箱無值
  const panel = await openShipmentPanel(page, familyNo);
  const cells = async (i) =>
    (await boxRows(panel).nth(i).locator('td').allInnerTexts()).map((t) => t.trim()).slice(1, 5);
  expect(await cells(0)).toEqual(['1 號箱', '45', '30', '15']);
  expect(await cells(1)).toEqual(['K1 箱', '－', '－', '－']);
  expect(await cells(2)).toEqual(['自訂', '60', '40', '30']);
  expect(await cells(3)).toEqual(['自訂', '－', '－', '－']);
  await closeShipmentPanel(page);

  // 裝箱回報修正改箱規：三箱皆 1 號箱的 7-11 單，第一箱改 F13 箱帶入並鎖住、第二箱改 K1 箱帶入空白並鎖住、第三箱改自訂保留原值可修改
  await pickAndPack(page, sevenNo, { pickedQty: 100, boxes: 3, spec: '1 號箱' });
  const fix = await clickRowAction(page, sevenNo, '修正');
  await pickBoxSpec(page, fix, 0, 'F13 箱');
  await pickBoxSpec(page, fix, 1, 'K1 箱');
  await pickBoxSpec(page, fix, 2, '自訂');
  const d0 = boxDimensionInputs(fix, 0);
  await expect(d0.length).toHaveValue('29');
  await expect(d0.width).toHaveValue('21');
  await expect(d0.height).toHaveValue('6');
  await expect(d0.length).toBeDisabled();
  const d1 = boxDimensionInputs(fix, 1);
  for (const input of [d1.length, d1.width, d1.height]) {
    await expect(input).toHaveValue('');
    await expect(input).toBeDisabled();
  }
  const d2 = boxDimensionInputs(fix, 2);
  await expect(d2.length).toHaveValue('45');
  await expect(d2.width).toHaveValue('30');
  await expect(d2.height).toHaveValue('15');
  await expect(d2.length).toBeEnabled();
  await fix.getByLabel('修正原因').fill('改用較小的箱子');
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(page.getByText(/已修正裝箱回報/).first()).toBeVisible();

  // 歷程：第一箱與第二箱的箱規、長、寬、高各一筆，第三箱只有箱規
  const after = await openShipmentPanel(page, sevenNo);
  await after.getByRole('tab', { name: '歷程' }).click();
  const fixItem = after.locator('.ant-timeline-item').filter({ hasText: '裝箱回報修正' }).first();
  for (const field of ['第 001 箱 箱規', '第 001 箱 長', '第 001 箱 寬', '第 001 箱 高', '第 002 箱 長', '第 003 箱 箱規']) {
    await expect(fixItem).toContainText(field);
  }
  await expect(fixItem).not.toContainText('第 003 箱 長');
});

test('12.45 部分離廠後的裝箱回報修正：改被拒收那一箱、拆成兩箱新增物流單，批次只送這兩筆；全數離廠後沒有修正', async ({
  page,
}) => {
  const [sevenNo] = await setupPacked(page, [
    { method: '7-11 交貨便', boxes: 4, spec: '1 號箱', notes: [null, null, REJECT_NOTE, null] },
  ]);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const first = await batchDispatch(page, sevenNo);
  await expect(first).toContainText('拋單處理完成：成功 3 筆、失敗 1 筆');
  await closeBatchResult(page);
  await expect(shipmentRow(page, sevenNo)).toContainText('已裝箱');

  // 揀貨人員：揀貨數量不可改、沒有移除箱的鈕；第 1、2、4 箱鎖住，只有第 3 箱可改；新增一箱仍在
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const fix = await clickRowAction(page, sevenNo, '修正');
  await expect(fix.getByLabel(`揀貨數量 ${CHAIN4.printItemNo}`, { exact: true })).toBeDisabled();
  await expect(fix.getByRole('button', { name: '移除這一箱' })).toHaveCount(0);
  const selects = fix.locator('.ant-table-tbody .ant-select');
  for (const i of [0, 1, 3]) await expect(selects.nth(i)).toHaveClass(/ant-select-disabled/);
  await expect(selects.nth(2)).not.toHaveClass(/ant-select-disabled/);
  // 第 3 箱改 F13 箱，新增第 5 箱
  await pickBoxSpec(page, fix, 2, 'F13 箱');
  await expect(boxDimensionInputs(fix, 2).length).toHaveValue('29');
  await addBoxes(page, fix, { boxes: 1, spec: 'F13 箱', startIndex: 4 });
  await fix.getByLabel('修正原因').fill('第 3 箱被物流商拒收，拆成兩個小箱');
  await fix.getByRole('button', { name: '送出修正' }).click();
  await expect(page.getByText(/已修正裝箱回報/).first()).toBeVisible();

  // 系統產生第 5 筆物流單（-005）在已裝箱；出貨單維持已裝箱、箱數 5
  await expect(shipmentRow(page, sevenNo)).toContainText('已裝箱');
  const panel = await openShipmentPanel(page, sevenNo);
  await expect(boxRows(panel)).toHaveCount(5);
  await expect(logisticsRows(panel)).toHaveCount(5);
  await expect(logisticsRows(panel).nth(4)).toContainText(`${sevenNo}-005`);
  await expect(logisticsRows(panel).nth(4)).toContainText('已裝箱');
  await expect(boxRows(panel).nth(2)).toContainText('F13 箱');
  await panel.getByRole('tab', { name: '歷程' }).click();
  for (const field of ['第 003 箱 箱規', '第 003 箱 長', '第 003 箱 寬', '第 003 箱 高', '新增第 005 箱']) {
    await expect(panel).toContainText(field);
  }
  await closeShipmentPanel(page);

  // 批次拋單只送第 3、5 筆，兩筆成功後出貨單轉等待出貨
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const second = await batchDispatch(page, sevenNo);
  await expect(batchResultRows(second)).toHaveCount(2);
  await expect(batchResultRows(second).nth(0)).toContainText(`${sevenNo}-003`);
  await expect(batchResultRows(second).nth(1)).toContainText(`${sevenNo}-005`);
  await expect(second).toContainText('拋單處理完成：成功 2 筆、失敗 0 筆');
  await closeBatchResult(page);
  await expect(shipmentRow(page, sevenNo)).toContainText('等待出貨');

  // 全數離廠後揀貨人員列上沒有修正
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(shipmentRow(page, sevenNo).getByRole('button', { name: '修正' })).toHaveCount(0);
});
