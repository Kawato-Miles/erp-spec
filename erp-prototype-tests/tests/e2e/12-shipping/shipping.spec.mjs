import { test, expect } from '@playwright/test';
import { clickIntoDetail, openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  createDraftShipment,
  createShipment,
  createShipmentDialog,
  draftShipmentDialog,
  fakePhoto,
  fillItemQty,
  fillPlannedShipDate,
  gotoInAppSafe,
  newestShipmentNo,
  pickAndPack,
  pickOrder,
  pickShippingMethod,
  setupShippableState,
  shipmentRow,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 多數情境要先驗收取得額度、再建單走到出貨，鏈長故放寬逾時
test.describe.configure({ timeout: 180_000 });

// 出貨單詳情側板（唯讀），出貨模組列表頁點單號打開
const detailDrawer = (page) => page.locator('.ant-drawer-content').last();

const closeDrawer = async (page) => {
  await page.keyboard.press('Escape');
  await expect(detailDrawer(page)).toBeHidden();
};

const listHeader = (page) => page.locator('.ant-table-thead').first();

test('12.1 出貨單列表、預計出貨日欄與檢視側板（原編號 29）', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 母表含預計出貨日欄；草稿的明細數量標「（預計）」
  await expect(listHeader(page)).toContainText('預計出貨日');
  const draftRow = shipmentRow(page, CHAIN4.draftShipmentNo);
  await expect(draftRow).toContainText('草稿');
  await expect(draftRow).toContainText('2026-09-10');
  await expect(draftRow).toContainText('（預計）');

  // 草稿的側板：第 1 段為預計出貨印件，其餘四段為單頭資訊、裝箱回報、出貨確認、送達確認
  await draftRow.getByText(CHAIN4.draftShipmentNo).click();
  const drawer = detailDrawer(page);
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('預計出貨印件');
  await expect(drawer).toContainText('預計數量');
  await expect(drawer).toContainText('單頭資訊');
  await expect(drawer).toContainText('裝箱回報');
  await expect(drawer).toContainText('出貨確認');
  await expect(drawer).toContainText('送達確認');
  await closeDrawer(page);

  // 已送達那一張：第 1 段為出貨明細
  const deliveredRow = shipmentRow(page, 'SH-2026-0601');
  await deliveredRow.getByText('SH-2026-0601').click();
  await expect(detailDrawer(page)).toContainText('出貨明細');
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
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 一顆對話框：兩個頁籤、底部三顆按鈕
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await expect(dialog.getByRole('tab', { name: /基本資料/ })).toBeVisible();
  await expect(dialog.getByRole('tab', { name: /出貨印件/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /取\s*消/ })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '儲存草稿' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '建立出貨單' })).toBeVisible();

  // 出貨印件頁籤預設帶入訂單全部印件，數量預設為剩餘應出量（購買數量 500）
  await pickOrder(page, dialog);
  await dialog.getByRole('tab', { name: /出貨印件/ }).click();
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

  // 儲存草稿只驗預計出貨日
  await dialog.getByRole('tab', { name: /基本資料/ }).click();
  await fillPlannedShipDate(dialog);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  const firstDraftNo = await newestShipmentNo(page);
  await expect(shipmentRow(page, firstDraftNo)).toContainText('草稿');

  // 再存一張草稿，同樣填 500：兩張草稿都不佔額度，可出貨額度仍是 500
  await createDraftShipment(page, { qty: 500 });
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const checkDialog = createShipmentDialog(page);
  await pickOrder(page, checkDialog);
  await checkDialog.getByRole('tab', { name: /出貨印件/ }).click();
  await expect(
    checkDialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }),
  ).toContainText('500');
  await checkDialog.getByRole('button', { name: /取\s*消/ }).click();

  // 回第一張草稿按「建立出貨單」：必填未齊時頁籤標「缺 N」並停在基本資料頁
  await shipmentRow(page, firstDraftNo).getByRole('button', { name: '編輯草稿' }).click();
  const draftDialog = draftShipmentDialog(page);
  await draftDialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(draftDialog.getByRole('tab', { name: /基本資料/ })).toContainText('缺 1');
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

  // 建單人與建立日期照草稿路徑寫；預計出貨印件已轉為正式明細
  await shipmentRow(page, shipmentNo).getByText(shipmentNo).click();
  const drawer = detailDrawer(page);
  await expect(drawer).toContainText('建單人');
  await expect(drawer).toContainText('洪嘉駿');
  await expect(drawer).toContainText('出貨明細');
  await expect(drawer).not.toContainText('預計出貨印件');
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
  await shipmentRow(page, CHAIN4.draftShipmentNo)
    .getByRole('button', { name: '編輯草稿' })
    .click();
  const dialog = draftShipmentDialog(page);
  await dialog.getByRole('tab', { name: /出貨印件/ }).click();
  await expect(dialog).toContainText('本單有 1 條印件已棄用');
  await expect(dialog).toContainText(CHAIN4.printItemNo);
  await expect(dialog).toContainText('這張草稿請直接刪除');
  await expect(dialog).toContainText('本張出貨單沒有印件');

  // 一條都不剩，按「建立出貨單」整張擋下
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(page.getByText('請至少留一條出貨印件').first()).toBeVisible();
  await expect(page.getByText(/出貨單已成立/)).toHaveCount(0);
});

test('12.3 揀貨人員開始揀貨並回報裝箱（原編號 31）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500 });
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await expect(shipmentRow(page, shipmentNo)).toContainText('打包中');

  await shipmentRow(page, shipmentNo).getByRole('button', { name: '裝箱回報' }).click();
  const dialog = page.locator('.ant-modal-content').filter({ hasText: '裝箱回報：' }).first();
  await dialog.getByLabel('實際裝箱數量').fill('500');
  await dialog.getByLabel('箱數', { exact: true }).fill('10');
  await dialog.getByLabel(/每箱幾個/).fill('50');
  await dialog.locator('#box_spec').click({ force: true });
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .first()
    .click();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成，出貨單轉「待出貨」/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('待出貨');
});

test('12.4 裝箱回報要填每箱幾個，差異看得見（原編號 128）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500 });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '裝箱回報' }).click();
  const dialog = page.locator('.ant-modal-content').filter({ hasText: '裝箱回報：' }).first();

  // 每箱幾個未填即送出應被擋下（必填）
  await dialog.getByLabel('實際裝箱數量').fill('480');
  await dialog.getByLabel('箱數', { exact: true }).fill('10');
  await dialog.locator('#box_spec').click({ force: true });
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .first()
    .click();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(/每箱幾個/).fill('48');
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/實際裝箱數量 480.*出貨明細數量 500/)).toBeVisible();

  // 明細數量與實際裝箱數量並排呈現，差異一眼看得出來
  await expect(shipmentRow(page, shipmentNo)).toContainText('500');
  await expect(shipmentRow(page, shipmentNo)).toContainText('480');
});

test('12.5 實裝與明細不符時揀貨人員不自行改數量（原編號 54）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500 });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { actualQty: 470, boxes: 10, perBoxQty: 47 });

  // 出貨單仍轉待出貨，警示訊息列出差異數並說明已通知業務
  await expect(page.getByText(/與明細數量不符|請口頭或以通訊軟體請業務看這張單/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('待出貨');
});

test('12.6 出貨確認填托運單號與重量，三種方式各走各的分流（原編號 32）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 自取單（100）與第三方物流單（100）各建一張（同印件仍有 300 額度可分別出）
  const pickupNo = await createShipment(page, { qty: 100, method: '自取' });
  const carrierNo = await createShipment(page, { qty: 100, method: '新竹物流' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, pickupNo, { actualQty: 100, boxes: 2, perBoxQty: 50 });
  await pickAndPack(page, carrierNo, { actualQty: 100, boxes: 2, perBoxQty: 50 });

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 自取：交付當下一次完成出貨與送達
  await shipmentRow(page, pickupNo).getByRole('button', { name: '交付確認' }).click();
  const pickupDialog = page
    .locator('.ant-modal-content')
    .filter({ hasText: '交付確認（自取）' })
    .first();
  await pickupDialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await pickupDialog.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/一次完成出貨與送達確認/).first()).toBeVisible();

  // 第三方：出貨確認填托運單號與重量，轉運送中
  await shipmentRow(page, carrierNo).getByRole('button', { name: '出貨確認' }).click();
  const shipDialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await shipDialog.getByLabel('托運單號（追蹤碼）').fill('SF-2026091700123');
  await shipDialog.getByLabel('重量（公斤，選填）').fill('8.2');
  await shipDialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/已交寄拋單（運送中）；托運單號已記錄/)).toBeVisible();
  await expect(shipmentRow(page, carrierNo)).toContainText('SF-2026091700123');

  // 側板的出貨確認段看得到重量
  await shipmentRow(page, carrierNo).getByText(carrierNo).click();
  await expect(detailDrawer(page)).toContainText('8.2');
  await page.keyboard.press('Escape');
  await expect(detailDrawer(page)).toBeHidden();

  // 運送中的第三方單有兩顆：模擬物流商回報配達（主）與送達確認（備援）
  await expect(
    shipmentRow(page, carrierNo).getByRole('button', { name: '模擬物流商回報配達' }),
  ).toBeVisible();
  await expect(
    shipmentRow(page, carrierNo).getByRole('button', { name: '送達確認' }),
  ).toBeVisible();

  // 走主路徑：確認人員記為物流商同步（模擬）
  await shipmentRow(page, carrierNo).getByRole('button', { name: '模擬物流商回報配達' }).click();
  const syncDialog = page
    .locator('.ant-modal-content')
    .filter({ hasText: '模擬物流商回報配達：' })
    .first();
  // 配達的定義寫在視窗上：到店與配送中都不算
  await expect(syncDialog).toContainText('配達指物流商的簽收或取件完成，到店與配送中都不算');
  await syncDialog.getByRole('button', { name: '模擬回報配達' }).click();
  await expect(page.getByText(/已接收物流商配達回報（模擬）/).first()).toBeVisible();
  await shipmentRow(page, carrierNo).getByText(carrierNo).click();
  await expect(detailDrawer(page)).toContainText('物流商同步（模擬）');
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
    await pickAndPack(page, no, { actualQty: 100, boxes: 2, perBoxQty: 50 });
  }

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 第三方物流：出貨確認須填托運單號才推得動
  await shipmentRow(page, carrierNo).getByRole('button', { name: '出貨確認' }).click();
  let dialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await dialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(dialog.getByText('交寄拋單須填托運單號')).toBeVisible();
  await dialog.getByLabel('托運單號（追蹤碼）').fill('HCT-1');
  await dialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/已交寄拋單（運送中）/).first()).toBeVisible();

  // 專車配送：出貨確認不附件即可發車
  await shipmentRow(page, vanNo).getByRole('button', { name: '出貨確認' }).click();
  dialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await dialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/專車已發車（運送中）/)).toBeVisible();

  // 自取：交付確認須附現場點交照，一次完成出貨與送達
  await shipmentRow(page, pickupNo).getByRole('button', { name: '交付確認' }).click();
  dialog = page.locator('.ant-modal-content').filter({ hasText: '交付確認（自取）' }).first();
  await dialog.getByRole('button', { name: '確認交付' }).click();
  await expect(dialog.getByText('請附現場點交照')).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await dialog.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/一次完成出貨與送達確認（現場點交照已留存）/)).toBeVisible();

  // 專車只有送達確認一條路，沒有模擬配達那顆鈕；送達確認要附司機交付照
  await expect(
    shipmentRow(page, vanNo).getByRole('button', { name: '模擬物流商回報配達' }),
  ).toHaveCount(0);
  await shipmentRow(page, vanNo).getByRole('button', { name: '送達確認' }).click();
  dialog = page.locator('.ant-modal-content').filter({ hasText: '送達確認：' }).first();
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(dialog.getByText('請附司機交付照')).toBeVisible();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('司機交付照.jpg'));
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/)).toBeVisible();

  // 第三方的送達備援：手動回填物流商配達時間，視窗寫明要回填的是簽收或取件完成的時間
  await shipmentRow(page, carrierNo).getByRole('button', { name: '送達確認' }).click();
  dialog = page.locator('.ant-modal-content').filter({ hasText: '送達確認：' }).first();
  await expect(dialog).toContainText('簽收或取件完成');
  await expect(dialog).toContainText('到店與配送中都不算配達');
  const deliveredTime = dialog.getByLabel('物流商配達時間（手動補登）');
  await deliveredTime.click();
  await deliveredTime.fill('2026-09-17 10:00');
  await deliveredTime.press('Enter');
  await dialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/).first()).toBeVisible();

  // 兩條路先寫入者成立：人工補登一成立，這張單離開運送中，兩顆送達按鈕一併退場，
  // 後到的配達回報沒有入口（守衛本身與「此單已收尾，請重新整理」以純函式驗，
  // 見 tests/unit/qc-shipping/shipment-draft.test.mjs）
  await expect(shipmentRow(page, carrierNo)).toContainText('已送達');
  await expect(
    shipmentRow(page, carrierNo).getByRole('button', { name: '模擬物流商回報配達' }),
  ).toHaveCount(0);
  await expect(shipmentRow(page, carrierNo).getByRole('button', { name: '送達確認' })).toHaveCount(
    0,
  );
});

test('12.8 累計送達達到購買數量，印件與訂單一起收尾（原編號 130）', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const shipmentNo = await createShipment(page, { qty: 500, method: '順豐' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { actualQty: 500, boxes: 10, perBoxQty: 50 });

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '出貨確認' }).click();
  const shipDialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await shipDialog.getByLabel('托運單號（追蹤碼）').fill('SF-2026091700999');
  await shipDialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/已交寄拋單（運送中）/).first()).toBeVisible();

  // 經模擬物流商回報配達同樣觸發收尾：印件轉已送達、訂單轉訂單完成
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '模擬物流商回報配達' }).click();
  const syncDialog = page
    .locator('.ant-modal-content')
    .filter({ hasText: '模擬物流商回報配達：' })
    .first();
  await syncDialog.getByRole('button', { name: '模擬回報配達' }).click();
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toBeVisible();
  const noticeText = await notice.innerText();
  expect(noticeText).toContain('印製狀態轉「已送達」');
  expect(noticeText).toContain(`訂單 ${CHAIN4.orderNo} 狀態轉「訂單完成」`);

  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await expect(page.getByText('訂單完成').first()).toBeVisible();
});

test('12.9 業務刪除不再需要的草稿', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  await shipmentRow(page, CHAIN4.draftShipmentNo)
    .getByRole('button', { name: '刪除草稿' })
    .click();

  // 二次確認：說明草稿未佔額度、未推進狀態，因此不填理由（沒有理由輸入欄）
  const confirm = page.locator('.ant-modal-confirm').last();
  await expect(confirm).toContainText(`刪除出貨單草稿：${CHAIN4.draftShipmentNo}`);
  await expect(confirm).toContainText('不需填理由');
  await expect(confirm.locator('textarea, input[type="text"]')).toHaveCount(0);
  await confirm.getByRole('button', { name: '刪除草稿' }).click();

  // 刪後自列表消失，不落已作廢
  await expect(page.getByText(/草稿已刪除/).first()).toBeVisible();
  await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);
});

test('12.10 訂單取消時草稿被刪除、未離廠的單自動作廢', async ({ page }) => {
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

  // 連鎖摘要分兩句：草稿刪除、未離廠出貨單自動作廢
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toBeVisible();
  const noticeText = await notice.innerText();
  expect(noticeText).toMatch(/出貨單草稿 1 張已刪除/);
  expect(noticeText).toMatch(/未離廠出貨單 1 張自動作廢/);

  // 草稿自列表消失，未處理那一張轉已作廢
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(page.getByText(CHAIN4.draftShipmentNo)).toHaveCount(0);
  await expect(shipmentRow(page, shipmentNo)).toContainText('已作廢');
});

test('12.11 寄件資訊依訂單的帳務公司帶出', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 建單對話框：唯讀、無編輯入口
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await pickOrder(page, dialog);
  await expect(dialog).toContainText('寄件資訊（依訂單的帳務公司帶出）');
  await expect(dialog).toContainText('感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓');
  await expect(dialog.getByRole('textbox', { name: /寄件/ })).toHaveCount(0);
  await dialog.getByRole('button', { name: /取\s*消/ }).click();

  // 既有那張單的側板顯示同一份寄件資訊
  await shipmentRow(page, CHAIN4.draftShipmentNo).getByText(CHAIN4.draftShipmentNo).click();
  await expect(detailDrawer(page)).toContainText(
    '感官文化印刷｜02 2736 6566｜新北市中和區建康路 168 號 3 樓',
  );
});

test('12.12 收件三欄預設帶訂單聯絡人、可改', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await pickOrder(page, dialog);

  // 三欄預設帶訂單客戶的聯絡人資料
  await expect(dialog.locator('#receiver_name')).toHaveValue(CHAIN4.contactPerson);
  await expect(dialog.locator('#receiver_phone')).toHaveValue(CHAIN4.contactPhone);
  await expect(dialog.locator('#receiver_address')).toHaveValue(CHAIN4.contactAddress);

  // 改得動，存下去的是改過的值
  await dialog.locator('#receiver_name').fill('倉儲收貨組');
  await fillPlannedShipDate(dialog);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  const draftNo = await newestShipmentNo(page);
  await shipmentRow(page, draftNo).getByText(draftNo).click();
  const drawer = detailDrawer(page);
  await expect(drawer).toContainText('倉儲收貨組');
  await expect(drawer).toContainText(CHAIN4.contactPhone);
  await expect(drawer).toContainText(CHAIN4.contactAddress);
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
  await shipmentRow(page, draftNo).getByText(draftNo).click();
  const drawerAfter = detailDrawer(page);
  await expect(drawerAfter).toContainText('倉儲收貨組');
  await expect(drawerAfter).toContainText(CHAIN4.contactPhone);
  await expect(drawerAfter).not.toContainText('備用聯絡人（示範資料）');
});
