// 第十一章（品檢）與第十二章（出貨與送達）共用的前置鏈。
// 情境目錄多數條目的起點資料都是「鏈四 PT-0820-9（可搬量 500）」加上一段前置操作：
// 生管建一張到品檢站的轉交單 → 廠務開始搬運並抵達站點 → 品檢人員點收 →（視情境）品檢人員驗收。
// 這一段只是把資料推到情境的起點，不是被驗的行為本身，故收在這裡供兩章共用。
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
      await closedGroups.nth(i % count).click();
      await page.waitForTimeout(250);
    }
    await item.click();
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
};

// 假圖檔（現場照片欄位一律必附，附件內容不影響驗收）
export const fakePhoto = (name) => ({
  name,
  mimeType: 'image/jpeg',
  buffer: Buffer.from('fake-photo'),
});

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

// 品檢人員點收（點收後這批量才進品檢站的待驗清單）
export async function receiveAtQc(page) {
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/production-floor/receiving');
  await page.getByRole('button', { name: '點收' }).first().click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收 TT-/)).toBeVisible();
}

/**
 * 貨已送到品檢站但尚未點收（用於驗「已送達未點收不進待驗清單」）。
 * 呼叫端須自行先 openAs 生管。
 */
export async function setupArrivedAtQc(page) {
  await createTransferToQc(page);
  await moveTransferToQc(page);
}

/**
 * 品檢站已有待驗量 500 的狀態（情境 11.2 的「前置操作」整段）。
 * @param {import('@playwright/test').Page} page
 * @param {{ open?: boolean }} options open=true 時由本函式做整頁載入（第一步 openAs 生管）
 */
export async function setupQcReadyState(page, { open = true } = {}) {
  if (open) await openAs(page, '生管', '/production-floor/pending-moves');
  await setupArrivedAtQc(page);
  await receiveAtQc(page);
}

// 品檢站「待驗」區塊
export const pendingPanel = (page) =>
  page
    .locator('[class*="BorderBlock"]')
    .filter({ has: page.getByRole('heading', { name: /^待驗（/ }) })
    .first();

// 品檢站「已記錄的驗收」區塊
export const recordedPanel = (page) =>
  page
    .locator('[class*="BorderBlock"]')
    .filter({ has: page.getByRole('heading', { name: /^已記錄的驗收（/ }) })
    .first();

// 驗收對話框
export const inspectDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '驗收：' }).first();

// 待驗區塊中某件印件的那張卡
export const pendingCard = (page, printItemNo = CHAIN4.printItemNo) =>
  pendingPanel(page).locator('[class*="BorderBlock"]').filter({ hasText: printItemNo }).last();

// 已記錄的驗收區塊中某件印件的那一戶
export const recordedCard = (page, printItemNo = CHAIN4.printItemNo) =>
  recordedPanel(page).locator('[class*="BorderBlock"]').filter({ hasText: printItemNo }).first();

/**
 * 品檢站驗收一筆（預設全數通過 500），使 PI-2026-0820 取得可出貨額度。
 * 呼叫前狀態須為 setupQcReadyState 之後，且當下角色為品檢人員。
 */
export async function inspectAtQc(page, { passed = 500, failed = 0, reason = '色差／偏色' } = {}) {
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await pendingCard(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill(String(passed));
  await dialog.getByLabel('不通過數量', { exact: true }).fill(String(failed));
  if (failed > 0) {
    await dialog.getByLabel('不通過原因').click();
    await page.getByTitle(reason).click();
  }
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
}

/**
 * 印件 PI-2026-0820 已取得可出貨額度的狀態（第十二章多數情境的起點）。
 */
export async function setupShippableState(page, { passed = 500, failed = 0 } = {}) {
  await setupQcReadyState(page);
  await inspectAtQc(page, { passed, failed });
}

// ── 第十二章共用：出貨單 ──

// 出貨方式按鈕的顯示字（自取在畫面上排版為「自 取」）
export const methodButtonName = (method) => (method === '自取' ? /^自\s*取$/ : method);

// 建立出貨單對話框
export const createShipmentDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '建立出貨單（同訂單可合箱' }).first();

/**
 * 業務建一張出貨單（呼叫前須已切為業務並在出貨管理頁）。
 * @param {{ qty: number, method?: string, logistics?: string|null, receiver?: string }} options
 */
export async function createShipment(
  page,
  {
    qty,
    method = '第三方物流',
    logistics = '新竹物流',
    receiver = '晨光文創 收貨組｜台北市中正區羅斯福路一段 8 號｜02-2396-1234',
  },
) {
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = createShipmentDialog(page);
  await dialog.getByRole('combobox').first().click();
  await page.locator('.ant-select-item-option').filter({ hasText: CHAIN4.orderNo }).first().click();
  await dialog
    .getByRole('row', { name: new RegExp(CHAIN4.printItemNo) })
    .getByRole('spinbutton')
    .fill(String(qty));
  await dialog.getByLabel('收件資訊（收件人／地址／電話）').fill(receiver);
  // 出貨方式的按鈕群組再點一次會取消選取，故只在與預設值（第三方物流）不同時才點
  if (method !== '第三方物流') {
    await dialog.getByRole('button', { name: methodButtonName(method) }).click();
  }
  if (method === '第三方物流' && logistics) {
    await dialog.locator('#logistics').click({ force: true });
    await page.locator('.ant-select-item-option').filter({ hasText: logistics }).first().click();
  }
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
}

// 出貨單列表中某一列（以出貨單編號或客戶名稱認列）
export const shipmentRow = (page, keyword) =>
  page.getByRole('row', { name: new RegExp(keyword) });

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
    await page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option').first().click({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('裝箱照.jpg'));
  await dialog.getByRole('button', { name: '完成裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成/).first()).toBeVisible();
}
