import { test, expect } from '@playwright/test';
import { clickIntoDetail, gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import {
  CHAIN4,
  createShipmentDialog,
  createShipment,
  fakePhoto,
  pickAndPack,
  setupShippableState,
  shipmentRow,
  switchRoleSafe,
  gotoInAppSafe,
} from '../11-qc/_setup.mjs';

// 多數情境要先推鏈四整段前置（生管建轉交單→廠務搬運→品檢點收驗收→業務建單…），鏈長故放寬逾時
test.describe.configure({ timeout: 120_000 });

// 出貨單詳情側板（唯讀），出貨模組列表頁點單號打開
const detailDrawer = (page) => page.locator('.ant-drawer-content').last();

test('12.1 出貨單列表與篩選（原編號 29）', async ({ page }) => {
  await openAs(page, '業務', '/qc-shipping/shipments');
  // 狀態篩選：只留已送達（篩選區的 select 排除右上角模擬角色的 select）
  const content = page.locator('.ant-layout-content');
  await content.locator('.ant-select').nth(0).click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: '已送達' }).click();
  const row = page.getByRole('row', { name: /SH-2026-0601/ });
  await expect(row).toBeVisible();
  await row.getByText('SH-2026-0601').click();
  const drawer = detailDrawer(page);
  await expect(drawer).toBeVisible();
  await expect(drawer).toContainText('出貨明細');
  await expect(drawer).toContainText('收件與裝箱指示');
  await expect(drawer).toContainText('裝箱回報');
  await expect(drawer).toContainText('出貨確認');
  await expect(drawer).toContainText('送達確認');
});

test('12.2 業務建出貨單，額度即時檢核並整張擋下（原編號 127，併入原編號 30）', async ({ page }) => {
  // 前置：品檢驗收讓 PI-2026-0820 取得可出貨額度 500
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  await page.getByRole('button', { name: '建立出貨單' }).click();
  const dialog = createShipmentDialog(page);
  await dialog.getByRole('combobox').first().click();
  await page.locator('.ant-select-item-option').filter({ hasText: CHAIN4.orderNo }).first().click();
  await expect(dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })).toContainText('500');

  // 先填超過額度的數字，看擋下
  await dialog
    .getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })
    .getByRole('spinbutton')
    .fill('600');
  await dialog.getByLabel('收件資訊（收件人／地址／電話）').fill('晨光文創 收貨組｜台北市中正區羅斯福路一段 8 號｜02-2396-1234');
  // 出貨方式預設即為第三方物流，不需另外點選
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  // 第三方物流未選物流商，也應被擋（先觸發必填擋下）
  await expect(page.getByText('第三方物流必選物流商')).toBeVisible();
  await dialog.locator('#logistics').click({ force: true });
  await page.locator('.ant-select-item-option').filter({ hasText: '新竹物流' }).first().click();
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  const blockedModal = page.locator('.ant-modal-confirm').last();
  await expect(blockedModal).toContainText('可出貨額度不足，整張出貨單未成立');
  await expect(blockedModal).toContainText(/本次填 600.*當下可出貨額度 500/);
  await blockedModal.getByRole('button', { name: '知道了' }).click();

  // 改填額度內的數字再建立
  await dialog
    .getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })
    .getByRole('spinbutton')
    .fill('500');
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(page.getByText(/出貨單已建立（未處理）/)).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) })).toBeVisible();

  // 建立後再改明細數量試一次超額（改明細數量），應排除本單自身佔用重新檢核
  const listRow = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  await listRow.getByRole('button', { name: '改明細數量' }).click();
  const editDialog = page.locator('.ant-modal-content').filter({ hasText: '修改出貨明細數量' }).first();
  await editDialog.getByRole('spinbutton').fill('600');
  await editDialog.getByRole('button', { name: '儲存明細數量' }).click();
  await expect(page.locator('.ant-modal-confirm').last()).toContainText('可出貨額度不足，明細數量未更新');
});

test('12.3 揀貨人員開始揀貨並回報裝箱（原編號 31）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await createShipment(page, { qty: 500 });
  const orderRow = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  await expect(orderRow).toContainText('未處理');
  const shipmentNo = (await orderRow.locator('a, .ant-typography').first().innerText()).trim();

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
  await page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option').first().click();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成，出貨單轉「待出貨」/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('待出貨');
});

test('12.4 裝箱回報要填每箱幾個，差異看得見（原編號 128）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await createShipment(page, { qty: 500 });
  const orderRow = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  const shipmentNo = (await orderRow.locator('a, .ant-typography').first().innerText()).trim();

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '裝箱回報' }).click();
  const dialog = page.locator('.ant-modal-content').filter({ hasText: '裝箱回報：' }).first();

  // 每箱幾個未填即送出應被擋下（必填）
  await dialog.getByLabel('實際裝箱數量').fill('480');
  await dialog.getByLabel('箱數', { exact: true }).fill('10');
  await dialog.locator('#box_spec').click({ force: true });
  await page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option').first().click();
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(dialog).toBeVisible();

  await dialog.getByLabel(/每箱幾個/).fill('48');
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/實際裝箱數量 480.*出貨明細數量 500/)).toBeVisible();

  // 明細數量與實際裝箱數量並排呈現，差異看得見
  const row = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  await expect(row).toContainText('500');
  await expect(row).toContainText('480');
});

test('12.5 實裝與明細不符時揀貨人員不自行改數量（原編號 54）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await createShipment(page, { qty: 500 });
  const orderRow = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  const shipmentNo = (await orderRow.locator('a, .ant-typography').first().innerText()).trim();

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { actualQty: 470, boxes: 10, perBoxQty: 47 });

  // 出貨單仍轉待出貨，警示訊息列出差異數並說明已通知業務
  await expect(page.getByText(/與明細數量不符|請口頭或以通訊軟體請業務看這張單/)).toBeVisible();
  await expect(shipmentRow(page, shipmentNo)).toContainText('待出貨');
});

test('12.6 出貨確認的三種方式各走各的分流（原編號 32）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  // 自取單（100）與第三方物流單（100）各建一張（同印件仍有 400 額度可分別出）
  await createShipment(page, { qty: 100, method: '自取', logistics: null });
  await createShipment(page, { qty: 100, method: '第三方物流', logistics: '新竹物流' });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const rows = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    const shipmentNo = (await rows.nth(i).locator('a, .ant-typography').first().innerText()).trim();
    await pickAndPack(page, shipmentNo, { actualQty: 100, boxes: 2, perBoxQty: 50 });
  }

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const pickupRow = page.getByRole('row', { name: /自取/ }).filter({ hasText: CHAIN4.orderNo });
  await pickupRow.getByRole('button', { name: '交付確認' }).click();
  const pickupDialog = page.locator('.ant-modal-content').filter({ hasText: '交付確認（自取）' }).first();
  await pickupDialog.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await pickupDialog.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/一次完成出貨與送達確認/).first()).toBeVisible();

  const thirdPartyRow = page.getByRole('row', { name: /第三方物流/ }).filter({ hasText: CHAIN4.orderNo });
  await thirdPartyRow.getByRole('button', { name: '出貨確認' }).click();
  const shipDialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await shipDialog.getByLabel('托運單號（追蹤碼）').fill('HCT-903201126');
  await shipDialog.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/已交寄拋單（運送中）；托運單號已記錄/)).toBeVisible();
  await expect(thirdPartyRow).toContainText('HCT-903201126');

  await thirdPartyRow.getByRole('button', { name: '送達確認' }).click();
  const deliveryDialog = page.locator('.ant-modal-content').filter({ hasText: '送達確認：' }).first();
  // 直接打字輸入日期時間再按 Enter 確認，避免時間選擇器面板互動不穩定
  const deliveredTimeInput = deliveryDialog.getByLabel('物流商配達時間（回填）');
  await deliveredTimeInput.click();
  await deliveredTimeInput.fill('2026-09-08 10:00');
  await deliveredTimeInput.press('Enter');
  await deliveryDialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/)).toBeVisible();
});

test('12.7 三種出貨方式的憑證形式各自不同（原編號 129）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await createShipment(page, { qty: 100, method: '第三方物流', logistics: '新竹物流' });
  await createShipment(page, { qty: 100, method: '專車配送', logistics: null });
  await createShipment(page, { qty: 100, method: '自取', logistics: null });

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const rows = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    const shipmentNo = (await rows.nth(i).locator('a, .ant-typography').first().innerText()).trim();
    await pickAndPack(page, shipmentNo, { actualQty: 100, boxes: 2, perBoxQty: 50 });
  }

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');

  // 第三方物流：出貨確認須填托運單號、送達確認須回填配達時間
  const thirdPartyRow = page.getByRole('row', { name: /第三方物流/ }).filter({ hasText: CHAIN4.orderNo });
  await thirdPartyRow.getByRole('button', { name: '出貨確認' }).click();
  let d = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await d.getByRole('button', { name: '確認出貨' }).click();
  await expect(d.getByText('交寄拋單須填托運單號')).toBeVisible();
  await d.getByLabel('托運單號（追蹤碼）').fill('HCT-1');
  await d.getByRole('button', { name: '確認出貨' }).click();

  // 專車配送：出貨確認不附件即可發車，送達確認要附司機交付照
  const vanRow = page.getByRole('row', { name: /專車配送/ }).filter({ hasText: CHAIN4.orderNo });
  await vanRow.getByRole('button', { name: '出貨確認' }).click();
  d = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await d.getByRole('button', { name: '確認出貨' }).click();
  await expect(page.getByText(/專車已發車（運送中）/)).toBeVisible();

  // 自取：交付確認附現場點交照、一次完成出貨與送達
  const pickupRow = page.getByRole('row', { name: /自取/ }).filter({ hasText: CHAIN4.orderNo });
  await pickupRow.getByRole('button', { name: '交付確認' }).click();
  d = page.locator('.ant-modal-content').filter({ hasText: '交付確認（自取）' }).first();
  await d.getByRole('button', { name: '確認交付' }).click();
  await expect(d.getByText('請附現場點交照')).toBeVisible();
  await d.locator('input[type="file"]').setInputFiles(fakePhoto('點交照.jpg'));
  await d.getByRole('button', { name: '確認交付' }).click();
  await expect(page.getByText(/一次完成出貨與送達確認（現場點交照已留存）/)).toBeVisible();

  await vanRow.getByRole('button', { name: '送達確認' }).click();
  d = page.locator('.ant-modal-content').filter({ hasText: '送達確認：' }).first();
  await d.getByRole('button', { name: '確認送達' }).click();
  await expect(d.getByText('請附司機交付照')).toBeVisible();
  await d.locator('input[type="file"]').setInputFiles(fakePhoto('司機交付照.jpg'));
  await d.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/送達確認完成/)).toBeVisible();
});

test('12.8 累計送達達到購買數量，印件與訂單一起收尾（原編號 130）', async ({ page }) => {
  // 差異：情境預期送達後訂單一併轉「訂單完成」，但鏈四的 mock 起點資料裡訂單 ORD-2026-0820
  // 的 status 是「製作中」，而其唯一印件 PI-2026-0820 的 print_item_status 已是「製作完成」
  // （orders/mock-data.js 直接寫死這兩個欄位，未經 store 的 advanceOnWorkOrdersCompleted 算過）。
  // 訂單狀態要推進到「出貨中」／「訂單完成」，orders/_lib/store.js 的
  // advanceOnFirstShipment／settleOnDelivery 都要求 order.status 在推進當下已是「製作完成」
  // （見 advanceOnFirstShipment 的 `orderAdvanced = order.status === '製作完成'`），
  // 但鏈四訂單卡在「製作中」，這個前提永遠不成立，送達後印件會轉「已送達」，訂單狀態不會動。
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await createShipment(page, { qty: 500, method: '專車配送', logistics: null });
  const orderRow = page.getByRole('row', { name: new RegExp(CHAIN4.orderNo) });
  const shipmentNo = (await orderRow.locator('a, .ant-typography').first().innerText()).trim();

  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, shipmentNo, { actualQty: 500, boxes: 10, perBoxQty: 50 });

  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '出貨確認' }).click();
  const shipDialog = page.locator('.ant-modal-content').filter({ hasText: '出貨確認：' }).first();
  await shipDialog.getByRole('button', { name: '確認出貨' }).click();

  await shipmentRow(page, shipmentNo).getByRole('button', { name: '送達確認' }).click();
  const deliveryDialog = page.locator('.ant-modal-content').filter({ hasText: '送達確認：' }).first();
  await deliveryDialog.locator('input[type="file"]').setInputFiles(fakePhoto('司機交付照.jpg'));
  await deliveryDialog.getByRole('button', { name: '確認送達' }).click();
  await expect(page.getByText(/印件.*印製狀態轉「已送達」/)).toBeVisible();
  await expect(page.getByText(new RegExp(`訂單 ${CHAIN4.orderNo} 狀態轉「訂單完成」`))).toBeVisible();

  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, CHAIN4.orderNo, /orders\/detail/);
  await expect(page.getByText('訂單完成').first()).toBeVisible();
});
