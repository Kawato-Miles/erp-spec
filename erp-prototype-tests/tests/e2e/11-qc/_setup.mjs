// 第十一章（品檢）與第十二章（出貨與送達）共用的前置鏈與版面工具。
//
// 待驗清單只看製作事實：印件的齊套完成數大於已驗量就出現在品檢站，待驗量＝齊套完成數 − 已驗量。
// 鏈四 PI-2026-0820 的精裝裝訂已報工良品 500，因此起點即有待驗量 500——品檢的前置不再需要
// 建轉交單、搬運與點收。轉交那一段只有第十章與 11.8（驗「轉交不改變待驗量」）才推。
//
// 記憶體狀態鐵則：只有 openAs 會整頁載入，之後一律 gotoInApp 與 switchRole。
import { expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';

/**
 * 切模擬角色（含重試）。共用工具的下拉是以鍵盤位移選項，下拉展開的時間差偶爾會少吃一次按鍵，
 * 停在中途的角色上；停在哪一個角色都可以從那裡再位移過去，故重試即可收斂。
 * 建議把這層重試併回 _helpers.mjs 的 switchRole。
 */
export async function switchRoleSafe(page, roleLabel, attempts = 3) {
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await switchRole(page, roleLabel);
      return;
    } catch (error) {
      if (i === attempts) throw error;
    }
  }
}

/**
 * 站內導頁：先把側欄收合的群組逐一展開（一次點一個、等展開動畫結束再點下一個），
 * 再點目標選單項。共用工具 gotoInApp 的展開迴圈在動畫未結束時會重複點到同一個群組、
 * 把剛展開的又收回去，切完角色重組選單時尤其明顯。建議把這段併回 _helpers.mjs。
 */
export async function gotoInAppSafe(page, path) {
  const item = page.locator(`.ant-menu-item[data-menu-id$="${path}"]`).first();
  const closedGroups = page.locator(
    '.ant-menu-submenu:not(.ant-menu-submenu-open) > .ant-menu-submenu-title',
  );
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlPattern = new RegExp(`${esc}/?(\\?|$)`);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    for (let i = 0; i < 12; i += 1) {
      if (await item.isVisible().catch(() => false)) break;
      const count = await closedGroups.count();
      if (count === 0) {
        await page.waitForTimeout(200);
        continue;
      }
      const title = closedGroups.nth(i % count);
      await title.click();
      // 等這個群組的 class 真的變成已展開再進下一輪：只等固定時間的話，下一輪的
      // 「收合中的群組」清單還含剛點過的那一個，會再點一次把它收回去，目標項因此永遠不出現
      await expect(title.locator('xpath=..')).toHaveClass(/ant-menu-submenu-open/, {
        timeout: 3000,
      }).catch(() => {});
      await page.waitForTimeout(250);
    }
    // 點擊前先確認目標項真的看得到：群組收合動畫未結束就點下去，點擊會一直等不到穩定狀態。
    // 切完角色的第一拍，側欄會依當前路徑重算展開群組、把剛手動展開的收回去；
    // 所以看到之後再等一小段，確認還在才點，點不到就回到外層重新展開一次
    await expect(item).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(300);
    if (!(await item.isVisible().catch(() => false))) continue;
    try {
      await item.click({ timeout: 5000 });
    } catch {
      continue;
    }
    // 部分頁面切換角色後導頁當下會先拋一次可回復的 client 錯誤（如 setStationById 的既有問題），
    // Next.js 仍會完成路由，只是比一般站內導頁慢，偶爾第一次點擊還沒吃到就要重點一次
    try {
      await expect(page).toHaveURL(urlPattern, { timeout: 8000 });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
    }
  }
}

// 鏈四（ORD-2026-0820《山城記事》精裝書）的固定編號
export const CHAIN4 = {
  orderNo: 'ORD-2026-0820',
  printItemNo: 'PI-2026-0820',
  printItemName: '《山城記事》精裝書（128 頁）',
  workOrderNo: 'WO-2026-0820',
  taskName: '精裝裝訂',
  movableQty: 500,
  orderedQty: 500,
  clientName: '晨光文創股份有限公司',
  draftShipmentNo: 'SH-2026-0820',
  contactPerson: '周雅文',
  contactPhone: '02-2790-6611',
  contactAddress: '台北市內湖區文德路 168 號 3 樓',
};

// 假圖檔（現場照片欄位一律必附，附件內容不影響驗收）
export const fakePhoto = (name) => ({
  name,
  mimeType: 'image/jpeg',
  buffer: Buffer.from('fake-photo'),
});

// ── 第十一章：品檢站（桌機表格） ──

// 待驗清單上某件印件的那一列
export const pendingRow = (page, printItemNo = CHAIN4.printItemNo) =>
  page.locator('tr.ant-table-row').filter({ hasText: printItemNo }).first();

// 該列的展開子表（歷次品檢紀錄）：AntD 把展開內容放在該列的下一個 tr
export const expandedRecords = (page, printItemNo = CHAIN4.printItemNo) =>
  pendingRow(page, printItemNo).locator('xpath=following-sibling::tr[1]');

// 驗收對話框
export const inspectDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '驗收：' }).first();

// 補更正紀錄對話框
export const correctDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '補更正紀錄：' }).first();

/**
 * 選不通過原因。選項清單為虛擬捲動的分組清單，對話框變高時下拉會開在視窗外緣、
 * 直接點選項會一直等不到可點狀態；改用鍵盤選：下拉一開啟，反白的就是第一個選項。
 * 本專案各條情境用的都是第一個選項「色差／偏色」，其餘選項的值域驗算在純函式測試。
 */
export async function pickFailReason(page, dialog, reason = '色差／偏色') {
  await dialog.getByLabel('不通過原因').click();
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Enter');
  await expect(dialog.locator('.ant-select-selection-item')).toContainText(reason);
}

/**
 * 品檢站驗收一筆（預設全數通過 500）。呼叫前角色須為品檢人員。
 */
export async function inspectAtQc(
  page,
  { passed = 500, failed = 0, reason = '色差／偏色', printItemNo = CHAIN4.printItemNo } = {},
) {
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await pendingRow(page, printItemNo).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill(String(passed));
  await dialog.getByLabel('不通過數量', { exact: true }).fill(String(failed));
  if (failed > 0) await pickFailReason(page, dialog, reason);
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
}

/**
 * 印件 PI-2026-0820 已取得可出貨額度的狀態（第十二章多數情境的起點）。
 * 品檢不必先轉交、不必點收：待驗量由齊套完成數推導，起點就是 500。
 * @param {{ passed?: number, failed?: number, open?: boolean }} options open=true 時由本函式整頁載入
 */
export async function setupShippableState(page, { passed = 500, failed = 0, open = true } = {}) {
  if (open) await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await inspectAtQc(page, { passed, failed });
}

// ── 第十一章與第十章共用：場內轉交到品檢站 ──

// 生管建一張到品檢站的轉交單（來源＝PT-0820-9 精裝裝訂，數量帶可搬全量 500）
export async function createTransferToQc(page) {
  await gotoInAppSafe(page, '/production-floor/pending-moves');
  const row = page.getByRole('row', { name: new RegExp(CHAIN4.taskName) });
  await expect(row).toHaveCount(1);
  await row.getByRole('checkbox').check();
  await page.getByRole('button', { name: /建立轉交單/ }).click();
  await page.getByRole('button', { name: '建立 1 張單' }).click();
  await expect(page.getByText(/已建立 TT-/)).toBeVisible();
}

// 廠務回報開始搬運與抵達站點（抵達須附卸貨現場照）
export async function moveTransferToQc(page) {
  await switchRoleSafe(page, '廠務');
  await gotoInAppSafe(page, '/production-floor/transfers');
  const row = page.getByRole('row', { name: /待搬運/ }).first();
  await row.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/)).toBeVisible();
  const moving = page.getByRole('row', { name: /搬運中/ }).first();
  await moving.getByRole('button', { name: '抵達站點' }).click();
  await page.locator('input[type="file"]').setInputFiles(fakePhoto('卸貨現場照.jpg'));
  await page.getByRole('button', { name: '抵達站點' }).last().click();
  await expect(page.getByText(/已回報抵達站點/)).toBeVisible();
}

// 品檢人員點收（點收只回答貨到了哪裡，與待驗量無關）
export async function receiveAtQc(page) {
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/production-floor/receiving');
  await page.getByRole('button', { name: '點收' }).first().click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收 TT-/)).toBeVisible();
}

/**
 * 貨已送到品檢站但尚未點收。呼叫端須自行先切為生管。
 */
export async function setupArrivedAtQc(page) {
  await createTransferToQc(page);
  await moveTransferToQc(page);
}

// ── 第十二章共用：出貨單 ──

// 建單／編輯草稿／改明細三種模式的對話框
export const createShipmentDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '建立出貨單（同訂單可合箱' }).first();

export const draftShipmentDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '編輯出貨單草稿：' }).first();

// 出貨單列表中某一列（以出貨單編號或客戶名稱認列）
export const shipmentRow = (page, keyword) =>
  page.locator('tr.ant-table-row').filter({ hasText: keyword }).first();

// 列表最上面那一列＝最新建立的單（store 把新單放在陣列最前）
export const newestShipmentNo = async (page) =>
  (
    await page.locator('tr.ant-table-row').first().locator('td').first().innerText()
  ).trim();

/** 建單對話框：選所屬訂單（下拉支援輸入搜尋，訂單樣本多時要先過濾） */
export async function pickOrder(page, dialog, orderNo = CHAIN4.orderNo) {
  const orderBox = dialog.getByRole('combobox').first();
  await orderBox.click();
  await orderBox.fill(orderNo);
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: orderNo })
    .first()
    .click();
}

/** 建單對話框：填預計出貨日（直接打字再按 Enter，避免日期面板互動不穩定） */
export async function fillPlannedShipDate(dialog, date = '2026-09-10') {
  const input = dialog.locator('#planned_ship_date');
  await input.click();
  await input.fill(date);
  await input.press('Enter');
}

/** 建單對話框：選出貨方式（六值一欄） */
export async function pickShippingMethod(page, dialog, method) {
  await dialog.locator('#method').click({ force: true });
  await expect(async () => {
    await page
      .locator('.ant-select-dropdown:visible')
      .last()
      .locator('.ant-select-item-option')
      .filter({ hasText: method })
      .first()
      .click({ timeout: 3000 });
  }).toPass({ timeout: 15000 });
}

/** 建單對話框：到出貨印件頁籤把某件印件的本次出貨數量填成指定值 */
export async function fillItemQty(dialog, qty, printItemNo = CHAIN4.printItemNo) {
  await dialog.getByRole('tab', { name: /出貨印件/ }).click();
  await dialog
    .getByRole('row', { name: new RegExp(printItemNo) })
    .getByRole('spinbutton')
    .fill(String(qty));
}

/**
 * 業務建一張已成立的出貨單（呼叫前須已切為業務並在出貨管理頁）。
 * 一顆對話框走完：選訂單 → 填單頭 → 填出貨印件數量 → 按「建立出貨單」。
 * @returns {Promise<string>} 新單的出貨單編號
 */
export async function createShipment(
  page,
  { qty, method = '新竹物流', date = '2026-09-10', orderNo = CHAIN4.orderNo } = {},
) {
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await pickOrder(page, dialog, orderNo);
  await fillPlannedShipDate(dialog, date);
  await pickShippingMethod(page, dialog, method);
  await fillItemQty(dialog, qty);
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(page.getByText(/出貨單已成立（未處理）/).first()).toBeVisible();
  // PanelDialog 關閉後仍留在 DOM（只是隱藏），故等它隱藏而不是等它消失
  await expect(dialog).toBeHidden();
  return newestShipmentNo(page);
}

/**
 * 業務建一張草稿（呼叫前須已切為業務並在出貨管理頁）。
 * @returns {Promise<string>} 新草稿的出貨單編號
 */
export async function createDraftShipment(
  page,
  { qty, date = '2026-09-10', orderNo = CHAIN4.orderNo } = {},
) {
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await pickOrder(page, dialog, orderNo);
  await fillPlannedShipDate(dialog, date);
  if (qty !== undefined) await fillItemQty(dialog, qty);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  return newestShipmentNo(page);
}

/**
 * 揀貨人員把一張未處理的出貨單走到待出貨（開始揀貨 → 裝箱回報）。
 * @param {{ actualQty: number, boxes?: number, perBoxQty?: number }} options
 */
export async function pickAndPack(page, shipmentNo, { actualQty, boxes = 10, perBoxQty = 50 }) {
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '裝箱回報' }).click();
  const dialog = page.locator('.ant-modal-content').filter({ hasText: '裝箱回報：' }).first();
  await dialog.getByLabel('實際裝箱數量').fill(String(actualQty));
  // 「箱數」非 exact 比對時會命中「實際裝箱數量」（子字串含「箱數」），須精確比對
  await dialog.getByLabel('箱數', { exact: true }).fill(String(boxes));
  await dialog.getByLabel(/每箱幾個/).fill(String(perBoxQty));
  // AntD 舊的下拉選單即使關閉仍留在 DOM（只是隱藏），選項清單須限定在當前可見的那個下拉；
  // 點開後選項沒出現就再點一次（伺服器忙碌時第一次點擊偶爾落空）
  await expect(async () => {
    await dialog.locator('#box_spec').click({ force: true });
    await page
      .locator('.ant-select-dropdown:visible')
      .last()
      .locator('.ant-select-item-option')
      .first()
      .click({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成/).first()).toBeVisible();
}
