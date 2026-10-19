import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  clickRowAction,
  createShipment,
  fakePhoto,
  gotoInAppSafe,
  openShipmentPanel,
  setupShippableState,
  shipmentRow,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 單據權責修正第五批（OpenSpec change document-access-scope-alignment）：出貨單與售後服務單的範圍跟著所屬訂單。
// 出貨單：業務、諮詢看自己負責與被分享訂單底下的單，業務主管與協助角色全公司；業務端操作看訂單編輯權，不看建單人；
// 現場動作維持揀貨與出貨人員。售後服務單：範圍跟著訂單、不看開立者，會計只能看。
// 起點資料：鏈一 SH-2026-0601、SH-2026-0602（ORD-2026-0601，接單業務洪嘉駿，陳映蓉為編輯層級分享成員，另有售後服務單 AS-20261015-01，
// 由陳映蓉代開）；鏈四 SH-2026-0820（草稿，ORD-2026-0820，接單業務洪嘉駿，建單人賴柏宇，陳映蓉為檢視層級分享成員）。
// 情境依據：出貨與售後檢視活動清單、出貨活動清單、售後受理與結案與處理活動清單、受控清單 § 訂單關聯單據的編輯權。

test.describe.configure({ timeout: 180_000 });

const SHIPMENTS = '/qc-shipping/shipments';
const ALL_THREE = ['SH-2026-0601', 'SH-2026-0602', 'SH-2026-0820'];
const HELPER_ROLES = ['業務主管', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor'];

const rowCount = (page) => page.locator('tr.ant-table-row');
const expectListed = async (page, numbers) => {
  for (const no of numbers) await expect(shipmentRow(page, no)).toBeVisible();
};
const expectNotListed = async (page, numbers) => {
  for (const no of numbers) await expect(page.locator('tr.ant-table-row').filter({ hasText: no })).toHaveCount(0);
};
const rowButton = (page, keyword, name) => shipmentRow(page, keyword).getByRole('button', { name, exact: true });

test('12.27 出貨單列表依角色過濾：業務與諮詢只列自己負責與被分享訂單的單，業務主管與協助角色、揀貨與出貨人員看全公司', async ({ page }) => {
  // 接單業務洪嘉駿：三張單都在自己負責的訂單底下
  await openAs(page, '業務', SHIPMENTS);
  await expectListed(page, ALL_THREE);

  // 業務乙陳映蓉：ORD-2026-0601 編輯層級、ORD-2026-0820 檢視層級被分享，兩張訂單的單都列
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expectListed(page, ALL_THREE);

  // 諮詢乙蘇怡君：只被分享 ORD-2026-0815，三張單都不列，不因為有入口就看到全公司
  await switchRoleSafe(page, '諮詢（蘇怡君）');
  await expectNotListed(page, ALL_THREE);
  await expect(rowCount(page)).toHaveCount(0);

  // 六個全公司協助角色：看全公司三張單
  for (const role of HELPER_ROLES) {
    await switchRoleSafe(page, role);
    await expectListed(page, ALL_THREE);
  }

  // 揀貨人員與出貨人員看全公司，草稿不列（草稿不是出貨指令）
  for (const role of ['揀貨人員', '出貨人員']) {
    await switchRoleSafe(page, role);
    await expectListed(page, ['SH-2026-0601', 'SH-2026-0602']);
    await expectNotListed(page, ['SH-2026-0820']);
  }
});

test('12.27 沒有出貨單檢視活動的角色看不到出貨管理：側欄沒有入口，停在出貨管理頁切過去被導回', async ({ page }) => {
  for (const role of ['生管', '品檢人員', '會計', '師傅', '廠務', '審稿人員']) {
    await openAs(page, role, SHIPMENTS);
    await expect(page).not.toHaveURL(/\/qc-shipping\/shipments/, { timeout: 15_000 });
    await expect(page.getByPlaceholder('請輸入出貨單編號、訂單編號，或客戶名稱')).toHaveCount(0);
    await expect(page.locator('.ant-menu-item[data-menu-id$="-/qc-shipping/shipments"]')).toHaveCount(0);
  }
  // 品檢人員有品檢站、沒有出貨管理：展開「品檢與出貨」群組只剩品檢站
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await page.locator('.ant-menu-submenu-title', { hasText: '品檢與出貨' }).click();
  await expect(page.locator('.ant-menu-item[data-menu-id$="-/qc-shipping/inspection"]')).toHaveCount(1);
  await expect(page.locator('.ant-menu-item[data-menu-id$="-/qc-shipping/shipments"]')).toHaveCount(0);
});

test('12.28 出貨單草稿的編輯與刪除看訂單編輯權，不看建單人：現任接單業務與協助角色有，原建單人、檢視分享成員沒有', async ({ page }) => {
  // SH-2026-0820 建單人賴柏宇，訂單現任接單業務洪嘉駿：洪嘉駿處置得了
  await openAs(page, '業務', SHIPMENTS);
  await expect(rowButton(page, 'SH-2026-0820', '編輯')).toHaveCount(1);
  await expect(rowButton(page, 'SH-2026-0820', '刪除')).toHaveCount(1);

  // 陳映蓉只有檢視層級：看得到、沒有編輯與刪除
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(rowButton(page, 'SH-2026-0820', '檢視')).toHaveCount(1);
  await expect(rowButton(page, 'SH-2026-0820', '編輯')).toHaveCount(0);
  await expect(rowButton(page, 'SH-2026-0820', '刪除')).toHaveCount(0);

  // 協助角色全公司：業務主管有編輯與刪除
  for (const role of HELPER_ROLES) {
    await switchRoleSafe(page, role);
    await expect(rowButton(page, 'SH-2026-0820', '編輯'), role).toHaveCount(1);
    await expect(rowButton(page, 'SH-2026-0820', '刪除'), role).toHaveCount(1);
  }
});

test('12.28 未離廠的出貨單：協助角色與接單業務有作廢；檢視分享成員、揀貨與出貨人員沒有；現場動作不隨編輯權開放', async ({ page }) => {
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, SHIPMENTS);
  const shipmentNo = await createShipment(page, { qty: 100, method: '專車配送' });
  await expect(shipmentRow(page, shipmentNo)).toContainText('未處理');

  // 接單業務：有編輯與作廢，沒有現場動作（開始揀貨）
  await expect(rowButton(page, shipmentNo, '作廢')).toHaveCount(1);
  await expect(rowButton(page, shipmentNo, '編輯')).toHaveCount(1);
  await expect(rowButton(page, shipmentNo, '開始揀貨')).toHaveCount(0);

  // 六個全公司協助角色：有作廢與編輯，同樣沒有開始揀貨
  for (const role of HELPER_ROLES) {
    await switchRoleSafe(page, role);
    await gotoInAppSafe(page, SHIPMENTS);
    await expect(rowButton(page, shipmentNo, '作廢'), role).toHaveCount(1);
    await expect(rowButton(page, shipmentNo, '編輯'), role).toHaveCount(1);
    await expect(rowButton(page, shipmentNo, '開始揀貨'), role).toHaveCount(0);
  }

  // 檢視層級分享成員陳映蓉（ORD-2026-0820）：看得到這張單，沒有作廢與編輯
  await switchRoleSafe(page, '業務（陳映蓉）');
  await gotoInAppSafe(page, SHIPMENTS);
  await expect(rowButton(page, shipmentNo, '檢視')).toHaveCount(1);
  await expect(rowButton(page, shipmentNo, '作廢')).toHaveCount(0);
  await expect(rowButton(page, shipmentNo, '編輯')).toHaveCount(0);

  // 揀貨人員只有開始揀貨，沒有作廢與編輯；出貨人員沒有作廢與編輯
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, SHIPMENTS);
  await expect(rowButton(page, shipmentNo, '開始揀貨')).toHaveCount(1);
  await expect(rowButton(page, shipmentNo, '作廢')).toHaveCount(0);
  await expect(rowButton(page, shipmentNo, '編輯')).toHaveCount(0);
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, SHIPMENTS);
  await expect(rowButton(page, shipmentNo, '作廢')).toHaveCount(0);
  await expect(rowButton(page, shipmentNo, '編輯')).toHaveCount(0);
});

test('12.28 協助角色在訂單詳情的出貨單頁籤有建立出貨單草稿；揀貨人員與出貨人員沒有訂單入口', async ({ page }) => {
  await openAs(page, '業務主管', '/orders/detail?id=' + CHAIN4.orderNo);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.getByRole('button', { name: '建立出貨單草稿' })).toHaveCount(1);
});

// ── 售後服務單 ──

const AFTER_SALES = '/after-sales';
const TICKET_NO = 'AS-20261015-01';
const ticketRow = (page) => page.locator('tr.ant-table-row').filter({ hasText: TICKET_NO }).first();
const ticketButton = (page, name) => ticketRow(page).getByRole('button', { name, exact: true });

test('12.29 售後服務單列表跟著訂單：接單業務看得到同事代開的單，非負責業務與諮詢看不到，會計與 Supervisor 有入口看全公司', async ({ page }) => {
  // AS-20261015-01 是陳映蓉（ORD-2026-0601 的編輯分享成員）代開；接單業務洪嘉駿的我的售後服務列得出來，不看開立者
  await openAs(page, '業務', AFTER_SALES);
  await expect(ticketRow(page)).toBeVisible();
  await expect(ticketRow(page)).toContainText('ORD-2026-0601');

  // 開立者陳映蓉自己是分享成員，同樣看得到
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(ticketRow(page)).toBeVisible();

  // 與這張訂單無關的諮詢：有入口、列表沒有這張單
  await switchRoleSafe(page, '諮詢（蘇怡君）');
  await expect(ticketRow(page)).toHaveCount(0);
  await switchRoleSafe(page, '諮詢');
  await expect(ticketRow(page)).toHaveCount(0);

  // 會計、Supervisor 與六個協助角色看全公司
  for (const role of ['會計', 'Supervisor', '業務主管', '訂單管理人', '印務主管', '印務', '審稿主管']) {
    await switchRoleSafe(page, role);
    await expect(ticketRow(page), role).toBeVisible();
  }
});

test('12.29 沒有售後服務單檢視活動的角色看不到售後服務：側欄沒有入口，直連被導回', async ({ page }) => {
  for (const role of ['生管', '品檢人員', '揀貨人員', '出貨人員', '師傅', '廠務', '審稿人員']) {
    await openAs(page, role, AFTER_SALES);
    await expect(page).not.toHaveURL(/\/after-sales/, { timeout: 15_000 });
    await expect(page.locator('.ant-menu-submenu-title', { hasText: /售後服務/ })).toHaveCount(0);
  }
});

test('12.30 售後服務單操作看訂單編輯權：接單業務、編輯分享成員與協助角色有編輯與送出決議；會計只能檢視', async ({ page }) => {
  // 接單業務與編輯分享成員（開立者）
  await openAs(page, '業務', AFTER_SALES);
  await expect(ticketButton(page, '編輯')).toHaveCount(1);
  await expect(ticketButton(page, '送出決議')).toHaveCount(1);
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(ticketButton(page, '編輯')).toHaveCount(1);
  await expect(ticketButton(page, '送出決議')).toHaveCount(1);

  // 業務主管等全公司協助角色：列表是全公司視角，同樣有編輯與送出決議
  for (const role of ['業務主管', 'Supervisor', '訂單管理人', '印務主管', '印務', '審稿主管']) {
    await switchRoleSafe(page, role);
    await expect(ticketButton(page, '檢視'), role).toHaveCount(1);
    await expect(ticketButton(page, '編輯'), role).toHaveCount(1);
    await expect(ticketButton(page, '送出決議'), role).toHaveCount(1);
  }

  // 會計：看得到、只有檢視；檢視側板沒有編輯與補述
  await switchRoleSafe(page, '會計');
  await expect(ticketButton(page, '檢視')).toHaveCount(1);
  await expect(ticketButton(page, '編輯')).toHaveCount(0);
  await expect(ticketButton(page, '送出決議')).toHaveCount(0);
  await expect(ticketButton(page, '結案')).toHaveCount(0);
  await ticketButton(page, '檢視').click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer).toContainText(TICKET_NO);
  await expect(drawer.getByRole('button', { name: '編輯', exact: true })).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: '補述客戶反映', exact: true })).toHaveCount(0);
});

test('12.30 業務主管開檢視側板：有編輯與補述客戶反映；訂單詳情的售後頁籤與總覽頁的鈕一致', async ({ page }) => {
  await openAs(page, '業務主管', AFTER_SALES);
  await ticketButton(page, '檢視').click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer.getByRole('button', { name: '編輯', exact: true })).toHaveCount(1);
  await expect(drawer.getByRole('button', { name: '補述客戶反映', exact: true })).toHaveCount(1);
  // 訂單詳情售後頁籤：同一組操作鈕（整頁重新載入以業務主管身分直接開訂單詳情）
  await openAs(page, '業務主管', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /售後/ }).first().click();
  const row = page.locator('tr.ant-table-row').filter({ hasText: TICKET_NO }).first();
  // 頁籤列上沒有編輯鈕（編輯從檢視側板進），其餘鈕與總覽頁同一組、同一個判斷
  await expect(row.getByRole('button', { name: '檢視', exact: true })).toHaveCount(1);
  await expect(row.getByRole('button', { name: '送出決議', exact: true })).toHaveCount(1);
  await row.getByRole('button', { name: '檢視', exact: true }).click();
  const tabDrawer = page.locator('.ant-drawer-content:visible').last();
  await expect(tabDrawer.getByRole('button', { name: '編輯', exact: true })).toHaveCount(1);

  // 會計沒有訂單檢視，不經訂單頁籤；檢視層級以外的唯讀由 12.30 純函式驗
});

test('12.31 已送達的出貨單補附送達憑證只給出貨人員：接單業務、編輯分享成員、六個協助角色與揀貨人員都沒有入口；補附後狀態不變、歷程記補附人', async ({ page }) => {
  // 起點：鏈一 SH-2026-0601（專車，已送達，ORD-2026-0601，接單業務洪嘉駿，陳映蓉為編輯層級分享成員）
  const PROOF = '補附送達憑證';
  await openAs(page, '業務', SHIPMENTS);
  await expect(shipmentRow(page, 'SH-2026-0601')).toContainText('已送達');
  const roles = ['業務', '業務（陳映蓉）', ...HELPER_ROLES, '揀貨人員'];
  for (const role of roles) {
    await switchRoleSafe(page, role);
    await gotoInAppSafe(page, SHIPMENTS);
    await expect(shipmentRow(page, 'SH-2026-0601'), role).toContainText('已送達');
    await expect(rowButton(page, 'SH-2026-0601', PROOF), role).toHaveCount(0);
  }

  // 出貨人員補附：單仍是已送達，歷程多一筆補附送達憑證並帶補附人曾志偉
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, SHIPMENTS);
  const dialog = await clickRowAction(page, 'SH-2026-0601', PROOF);
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('簽收照片-補.jpg'));
  await dialog.getByRole('button', { name: '送出憑證' }).click();
  await expect(page.getByText(/已補附送達憑證/).first()).toBeVisible();
  await expect(shipmentRow(page, 'SH-2026-0601')).toContainText('已送達');
  const panel = await openShipmentPanel(page, 'SH-2026-0601');
  await panel.getByRole('tab', { name: '歷程' }).click();
  const proofEvent = panel.locator('tr, li, .ant-timeline-item, .ant-list-item').filter({ hasText: PROOF }).first();
  await expect(proofEvent).toContainText('曾志偉');
});

test('12.32 售後服務列表的接單業務篩選與欄位看所屬訂單的接單業務，不看開立者；檢視側板同口徑', async ({ page }) => {
  // AS-20261015-01 屬於洪嘉駿負責的 ORD-2026-0601，由陳映蓉代開
  await openAs(page, '業務主管', AFTER_SALES);
  // 固定表頭會多渲染一份表頭，只驗看得到
  await expect(page.locator('th', { hasText: '接單業務' }).first()).toBeVisible();
  await expect(page.locator('th', { hasText: '業務 / 諮詢' })).toHaveCount(0);
  await expect(ticketRow(page)).toContainText('洪嘉駿');
  await expect(ticketRow(page)).not.toContainText('陳映蓉');

  // 檢視側板的負責人同口徑
  await ticketButton(page, '檢視').click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer).toContainText(TICKET_NO);
  await expect(drawer.locator('tr').filter({ hasText: '接單業務' })).toContainText('洪嘉駿');
  await expect(drawer).not.toContainText('目前負責人');
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-drawer-content:visible')).toHaveCount(0);

  // 接單業務篩選比對所屬訂單的接單業務
  const ownerSelect = page.locator('.ant-select').filter({ hasText: '全部業務' }).first();
  await ownerSelect.click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: '洪嘉駿' }).click();
  await expect(ticketRow(page)).toBeVisible();
  await page.locator('.ant-select').filter({ hasText: '洪嘉駿' }).first().click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: '張惠雯' }).click();
  await expect(ticketRow(page)).toHaveCount(0);
});
