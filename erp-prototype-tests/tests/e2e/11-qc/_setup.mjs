// 第十一章（品檢）與第十二章（出貨與送達）共用的前置鏈與版面工具。
//
// 待驗清單只看製作事實：待驗量＝做出來的良品 − 已驗量（各筆修正後的通過與不通過加總），不看轉交、不看點收。
// 鏈四 PI-2026-0820 的精裝裝訂已報工良品 500、不良品 0，因此起點即有待驗量 500——品檢的前置不再
// 需要建轉交單、搬運與點收。轉交那一段只有第十章與 11.8（驗「轉交不改變待驗量」）才推。
//
// 記憶體狀態鐵則：只有 openAs 會整頁載入，之後一律 gotoInApp 與 switchRole。
import { expect } from '@playwright/test';
import { clickIntoDetail, openAs, switchRole } from '../_helpers.mjs';
import { assignMover } from '../10-report-transfer/_ch10.mjs';

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
  // data-menu-id 格式為「rc-menu-uuid-<流水>-<路徑>」：帶上路徑前的連字號，/print-items 才不會誤中 /recipes/print-items
  // 生產管理的產線單元與負責單元（路徑加 /mine）擇一：角色只拿到負責單元時（例如廠務的我的轉交單）改點那一項
  const floorAlt = path.startsWith('/production-floor/') && !path.endsWith('/mine') ? `${path}/mine` : null;
  const item = page
    .locator(
      floorAlt
        ? `.ant-menu-item[data-menu-id$="-${path}"], .ant-menu-item[data-menu-id$="-${floorAlt}"]`
        : `.ant-menu-item[data-menu-id$="-${path}"]`,
    )
    .first();
  const closedGroups = page.locator(
    '.ant-menu-submenu:not(.ant-menu-submenu-open) > .ant-menu-submenu-title',
  );
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const urlPattern = new RegExp(`${esc}(/mine)?/?(\\?|$)`);

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

// 假圖檔（報工照片欄位一律必附，附件內容不影響驗收）
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

// 修正品檢紀錄對話框
export const correctDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '修正品檢紀錄：' }).first();

// 修正品檢缺口處置對話框（印件詳情品檢頁籤，印務與印務主管）
export const dispositionCorrectDialog = (page) =>
  page.locator('.ant-modal-content').filter({ hasText: '修正處置：' }).first();

/**
 * 品檢站：展開某件印件、對最新一筆品檢紀錄按修正，回修正對話框。呼叫前角色須為品檢人員且已在品檢站。
 */
export async function openCorrectDialog(page, printItemNo = CHAIN4.printItemNo) {
  const row = pendingRow(page, printItemNo);
  const expander = row.getByLabel('展開行');
  if ((await expander.getAttribute('aria-expanded')) !== 'true') await expander.click();
  await expandedRecords(page, printItemNo)
    .getByRole('button', { name: '修正', exact: true })
    .first()
    .click();
  const dialog = correctDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

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
  // 品檢照片至少一張才送得出（通過與不通過都要拍）
  await dialog.locator('input[type="file"]').setInputFiles(fakePhoto('品檢照.jpg'));
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
}

/**
 * 印件 PI-2026-0820 已取得可出貨額度的狀態（第十二章多數情境的起點）。
 * 品檢不必先轉交、不必點收：待驗量由做出來的良品推導，起點就是 500。
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
  await assignMover(page);
  await page.getByRole('button', { name: '建立 1 張單' }).click();
  await expect(page.getByText(/已建立 TT-/)).toBeVisible();
}

// 廠務回報開始搬運與抵達站點（抵達須附簽收照片至少一張）
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
  await page.getByRole('button', { name: '點收', exact: true }).first().click();
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

// 出貨單對話框（建單、單頭與明細編輯、檢視共用同一顆，比照工單新增生產任務對話框；
// 上方固定單頭、下方分出貨明細與歷程兩個頁籤）。狀態推進在列上動作鈕開的另一種對話框裡，
// 兩種對話框不會同時開著，所以共用同一個定位器
export const shipmentPanel = (page) => page.locator('.ant-modal-content:visible').last();

// 列上動作鈕開出來的對話框（共用 PanelDialog，最後一顆可見的 Modal）
export const actionDialog = (page) => page.locator('.ant-modal-content:visible').last();

// 列上動作鈕開出來的確認框（antd modal.confirm）
export const confirmBox = (page) => page.locator('.ant-modal-confirm:visible').last();

// 建單對話框與既有單的對話框是同一顆，兩個別名保留給讀得出意圖的呼叫端
export const createShipmentDialog = shipmentPanel;
export const draftShipmentDialog = shipmentPanel;

/** 列上的「檢視」圖示鈕：開這張單的唯讀對話框 */
export async function openShipmentPanel(page, keyword) {
  await shipmentRow(page, keyword).getByRole('button', { name: '檢視' }).click();
  await expect(shipmentPanel(page)).toBeVisible();
  return shipmentPanel(page);
}

/** 列上的「編輯」圖示鈕：開這張單的編輯模式對話框（只有建單人看得到這顆鈕） */
export async function openShipmentEdit(page, keyword) {
  await shipmentRow(page, keyword).getByRole('button', { name: '編輯' }).click();
  await expect(shipmentPanel(page)).toBeVisible();
  return shipmentPanel(page);
}

/**
 * 按列上某顆動作鈕（開始揀貨、裝箱回報、出貨確認、交付確認、送達確認、異常、作廢、刪除），
 * 回它開出來的對話框。確認框（開始揀貨、刪除）用 confirmBox 另取。
 */
export async function clickRowAction(page, keyword, name) {
  await shipmentRow(page, keyword).getByRole('button', { name, exact: true }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

// 出貨單列表中某一列（以出貨單編號或客戶名稱認列）
export const shipmentRow = (page, keyword) =>
  page.locator('tr.ant-table-row').filter({ hasText: keyword }).first();

// 列表最上面那一列＝最新建立的單（store 把新單放在陣列最前）。
// 列表是子母表，第一格是展開鈕，所以從整列文字取出貨單編號
export const newestShipmentNo = async (page) =>
  (await page.locator('tr.ant-table-row').first().innerText()).match(/SH-\d{4}-\d{4}/)[0];

/** 列上操作欄的動作鈕（子母表第一格是展開鈕，不算動作鈕；操作欄固定在最後一格） */
export const rowActionButtons = (row) => row.locator('td').last().getByRole('button');

/** 展開出貨單列表（或訂單出貨單頁籤）某一列，回展開後的物流單子表那一列（tr） */
export async function expandShipmentRow(page, keyword) {
  const row = shipmentRow(page, keyword);
  await row.locator('.ant-table-row-expand-icon').click();
  const expanded = row.locator('xpath=following-sibling::tr[1]');
  await expect(expanded).toHaveClass(/ant-table-expanded-row/);
  return expanded;
}

/** 回出貨管理列表，等列表本身畫出來（避免讀到前一頁殘留的表格列） */
export async function gotoShipmentList(page) {
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await expect(page.getByPlaceholder('請輸入出貨單編號、訂單編號，或客戶名稱')).toBeVisible();
}

/**
 * 從訂單詳情的「出貨單」頁籤打開建單對話框（出貨單只能從這裡建，出貨管理列表沒有新增入口）。
 * 對話框鎖定這張訂單，不提供選訂單的下拉。呼叫前須已切為該訂單的建單人（接單業務或編輯（代理）成員）。
 * @returns {Promise<import('@playwright/test').Locator>} 建單對話框
 */
export async function openCreateShipmentFromOrder(page, orderNo = CHAIN4.orderNo) {
  await gotoInAppSafe(page, '/orders');
  await clickIntoDetail(page, orderNo, /orders\/detail/);
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await page.getByRole('button', { name: '建立出貨單草稿' }).click();
  const dialog = shipmentPanel(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

/** 建單對話框：填預計出貨日（直接打字再按 Enter，避免日期面板互動不穩定） */
export async function fillPlannedShipDate(dialog, date = '2026-09-10') {
  const input = dialog.locator('#planned_ship_date');
  await input.click();
  await input.fill(date);
  await input.press('Enter');
}

/** 建單對話框：選出貨方式（七值一欄）。對話框剛開時點擊可能沒打開下拉，每次重試先確認下拉已開 */
export async function pickShippingMethod(page, dialog, method) {
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(async () => {
    if (!(await dropdown.isVisible())) {
      await dialog.locator('#method').click({ force: true });
    }
    await dropdown
      .locator('.ant-select-item-option')
      .filter({ hasText: method })
      .first()
      .click({ timeout: 3000 });
  }).toPass({ timeout: 15000 });
}

/** 建單對話框：到出貨明細頁籤把某件印件的數量填成指定值 */
export async function fillItemQty(dialog, qty, printItemNo = CHAIN4.printItemNo) {
  await dialog.getByRole('tab', { name: /出貨明細/ }).click();
  await dialog
    .getByRole('row', { name: new RegExp(printItemNo) })
    .getByRole('spinbutton')
    .fill(String(qty));
}

/**
 * 業務建一張已成立的出貨單（呼叫前須已切為業務）。
 * 從訂單詳情的出貨單頁籤開對話框 → 填單頭 → 填出貨印件數量 → 按「建立出貨單」，
 * 完成後回到出貨管理頁（呼叫端接著在列表上操作）。
 * 這一顆按鈕在新建入口沒有直達未處理的路——系統先落一張草稿、同一個動作立刻把它推成未處理，
 * 所以列表只會多一張單（見情境 12.2）。
 * @returns {Promise<string>} 新單的出貨單編號
 */
export async function createShipment(
  page,
  { qty, method = '新竹物流', date = '2026-09-10', orderNo = CHAIN4.orderNo } = {},
) {
  const dialog = await openCreateShipmentFromOrder(page, orderNo);
  await fillPlannedShipDate(dialog, date);
  await pickShippingMethod(page, dialog, method);
  await fillItemQty(dialog, qty);
  await dialog.getByRole('button', { name: '建立出貨單' }).click();
  await expect(page.getByText(/出貨單已成立（未處理）/).first()).toBeVisible();
  // 側板關閉後仍留在 DOM（只是隱藏），故等它隱藏而不是等它消失
  await expect(dialog).toBeHidden();
  await gotoShipmentList(page);
  return newestShipmentNo(page);
}

/**
 * 業務建一張草稿（呼叫前須已切為業務）；完成後回到出貨管理頁。
 * @returns {Promise<string>} 新草稿的出貨單編號
 */
export async function createDraftShipment(
  page,
  { qty, date = '2026-09-10', orderNo = CHAIN4.orderNo } = {},
) {
  const dialog = await openCreateShipmentFromOrder(page, orderNo);
  await fillPlannedShipDate(dialog, date);
  if (qty !== undefined) await fillItemQty(dialog, qty);
  await dialog.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await expect(dialog).toBeHidden();
  await gotoShipmentList(page);
  return newestShipmentNo(page);
}

/**
 * 在下拉裡選一個選項（舊的下拉即使關閉仍留在 DOM，選項清單須限定在當前可見的那個；點開後沒出現就再點一次）。
 * @param {string} selector 下拉本體的選擇器（例：#receiver_name 之類的下拉選擇器）
 * @param {string|RegExp} [text] 要選的選項文字；沒給就選第一個
 */
export async function pickFromSelect(page, dialog, selector, text) {
  await expect(async () => {
    await dialog.locator(selector).click({ force: true });
    const options = page
      .locator('.ant-select-dropdown:visible')
      .last()
      .locator('.ant-select-item-option');
    await (text ? options.filter({ hasText: text }).first() : options.first()).click({
      timeout: 3000,
    });
  }).toPass({ timeout: 20000 });
}

/**
 * 裝箱明細：按 boxes 次「新增一箱」，每列選箱規（預設取選單第一個）並上傳一張照片。
 * 從沒有任何裝箱明細列的對話框起算（裝箱回報）；已有列時用 startIndex 指到新列的起點。
 * notes 為逐箱的裝箱備註（陣列，從新增的第一箱起算；沒給的箱不填）。
 * Prototype 以裝箱備註的「示意：物流商拒收」「示意：物流商逾時」模擬物流商回應（見情境目錄第十二章章首）。
 */
export async function addBoxes(
  page,
  dialog,
  { boxes = 2, spec, photo = '裝箱照.jpg', startIndex = 0, notes = [] } = {},
) {
  for (let i = 0; i < boxes; i += 1) {
    await dialog.getByRole('button', { name: '新增一箱' }).click();
    await pickBoxSpec(page, dialog, startIndex + i, spec);
    await dialog
      .locator('.ant-table-tbody input[type="file"]')
      .nth(startIndex + i)
      .setInputFiles(fakePhoto(photo));
    if (notes[i]) {
      await dialog.getByLabel('裝箱備註').nth(startIndex + i).fill(notes[i]);
    }
  }
}

/** 裝箱明細表某一列（從 0 起）的長、寬、高輸入欄 */
export const boxDimensionInputs = (dialog, rowIndex) => ({
  length: dialog.getByLabel('長（公分）').nth(rowIndex),
  width: dialog.getByLabel('寬（公分）').nth(rowIndex),
  height: dialog.getByLabel('高（公分）').nth(rowIndex),
});

/** 裝箱明細表某一列（從 0 起）的箱規下拉選一個選項；沒給 spec 就選第一個 */
export async function pickBoxSpec(page, dialog, rowIndex = 0, spec) {
  // 下拉已開時再點會把它關掉，所以每次重試只在下拉沒開時才點
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(async () => {
    if (!(await dropdown.isVisible())) {
      await dialog.locator('.ant-table-tbody .ant-select').nth(rowIndex).click({ force: true });
    }
    const options = dropdown.locator('.ant-select-item-option');
    await (spec ? options.filter({ hasText: spec }).first() : options.first()).click({
      timeout: 3000,
    });
  }).toPass({ timeout: 20000 });
}

/**
 * 裝箱回報（或修正）對話框：逐條明細填揀貨數量。欄位用 aria-label「揀貨數量 <印件編號>」認。
 * @param {Array<{ printItemNo?: string, pickedQty?: number }>} lines
 */
export async function fillPackingLines(dialog, lines) {
  for (const line of lines) {
    const no = line.printItemNo ?? CHAIN4.printItemNo;
    if (line.pickedQty !== undefined) {
      await dialog.getByLabel(`揀貨數量 ${no}`, { exact: true }).fill(String(line.pickedQty));
    }
  }
}

/**
 * 揀貨人員把一張未處理的出貨單走到已裝箱（開始揀貨 → 裝箱回報）。
 * 預設單一明細（PI-2026-0820）；多條明細時用 lines 逐條給。裝箱明細逐箱新增 boxes 箱
 * （同箱規、每箱一張照片；箱規預設取該出貨方式的第一個）。
 * @param {{ pickedQty?: number, boxes?: number, spec?: string|RegExp, lines?: Array }} options
 */
export async function pickAndPack(
  page,
  shipmentNo,
  { pickedQty, boxes = 2, spec, lines, notes } = {},
) {
  // 兩步都在列上：「開始揀貨」彈確認框 → 「裝箱回報」開對話框填該步要填的欄位
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '開始揀貨' }).click();
  await confirmBox(page).getByRole('button', { name: '開始揀貨' }).click();
  await expect(page.getByText(/已開始揀貨/).first()).toBeVisible();
  const dialog = await clickRowAction(page, shipmentNo, '裝箱回報');
  await fillPackingLines(dialog, lines ?? [{ pickedQty }]);
  await addBoxes(page, dialog, { boxes, spec, notes });
  await dialog.getByRole('button', { name: '送出裝箱回報' }).click();
  await expect(page.getByText(/裝箱回報完成/).first()).toBeVisible();
}

// ── 第十二章共用：出貨單對話框裡的物流單 ──

/** 關閉出貨單對話框（檢視用「關閉」、編輯用「取消」）；開啟後焦點尚未移進對話框時 Esc 會落空，所以不靠鍵盤 */
export async function closeShipmentPanel(page) {
  await shipmentPanel(page)
    .getByRole('button', { name: /^(關\s*閉|取\s*消)$/ })
    .click();
  await expect(page.locator('.ant-modal-content:visible')).toHaveCount(0);
}

/** 出貨單對話框裡的「物流單」表格（表頭有「物流單編號」；裝箱明細表的欄名是「所屬物流單」，不會誤中） */
export const logisticsTable = (dialog) =>
  dialog.locator('.ant-table').filter({ hasText: '物流單編號' }).first();

/** 物流單表格的資料列（從 0 起數） */
export const logisticsRows = (dialog) => logisticsTable(dialog).locator('tbody tr.ant-table-row');

/** 出貨單對話框裡的「裝箱明細」表格資料列 */
export const boxRows = (dialog) =>
  dialog.locator('.ant-table').filter({ hasText: '所屬物流單' }).first().locator('tbody tr.ant-table-row');

/**
 * 開出貨單對話框，按物流單表格第 nth 列（從 0 起）的某顆動作鈕，回它開出來的動作對話框
 * （物流單層動作鈕會先關掉出貨單對話框再開動作對話框；重新同步與下載沒有對話框，不走這支）。
 */
export async function openLogisticsAction(page, shipmentNo, name, nth = 0) {
  const panel = await openShipmentPanel(page, shipmentNo);
  await logisticsRows(panel).nth(nth).getByRole('button', { name, exact: true }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

/** 開出貨單對話框，對物流單表格第 nth 列按「重新同步」times 次（每次模擬物流商回傳往前一格），最後關閉對話框 */
export async function resyncLogistics(page, shipmentNo, { times = 1, nth = 0 } = {}) {
  const panel = await openShipmentPanel(page, shipmentNo);
  for (let i = 0; i < times; i += 1) {
    await logisticsRows(panel).nth(nth).getByRole('button', { name: '重新同步', exact: true }).click();
    await expect(page.getByText(/已重新同步/).last()).toBeVisible();
  }
  await closeShipmentPanel(page);
}

/**
 * 出貨人員對物流單表格第 nth 列按出貨動作（拋單、出貨確認、標記可自取）並確認。拋單送出後先顯示處理中，
 * 處理中結束才出結果；拋單失敗時對話框不關，呼叫端自行斷言錯誤訊息。批次拋單見 batchDispatch。
 * 函式名沿用 dispatchRow：舊測試以「列」為單位呼叫，第四參數 confirmName 照舊。
 */
export async function dispatchRow(page, shipmentNo, name, confirmName, nth = 0) {
  const dialog = await openLogisticsAction(page, shipmentNo, name, nth);
  await dialog.getByRole('button', { name: confirmName }).click();
}

/** 對出貨單每一筆仍在已裝箱的物流單逐筆做出貨動作（count 為物流單筆數；一筆做完對話框關閉後再開下一筆） */
export async function dispatchEach(page, shipmentNo, name, confirmName, count) {
  for (let i = 0; i < count; i += 1) {
    await dispatchRow(page, shipmentNo, name, confirmName, i);
    await expect(actionDialog(page)).toHaveCount(0);
  }
}

/**
 * 出貨人員在出貨單列上按「批次拋單」並確認，等處理中結束、結果列出來，回批次拋單對話框（結果還開著，呼叫端自行關閉）。
 * @returns {Promise<import('@playwright/test').Locator>}
 */
export async function batchDispatch(page, shipmentNo) {
  await shipmentRow(page, shipmentNo).getByRole('button', { name: '批次拋單', exact: true }).click();
  const dialog = actionDialog(page);
  await expect(dialog).toContainText(`批次拋單：${shipmentNo}`);
  await dialog.getByRole('button', { name: '確認批次拋單' }).click();
  await expect(dialog).toContainText(/拋單處理完成：成功 \d+ 筆、失敗 \d+ 筆/, { timeout: 15000 });
  return dialog;
}

/** 批次拋單結果表的資料列（從 0 起；表頭含「結果」） */
export const batchResultRows = (dialog) =>
  dialog.locator('.ant-table').filter({ hasText: '結果' }).first().locator('tbody tr.ant-table-row');

/** 關閉批次拋單的結果對話框 */
export async function closeBatchResult(page) {
  await actionDialog(page).getByRole('button', { name: /^關\s*閉$/ }).click();
  await expect(page.locator('.ant-modal-content:visible')).toHaveCount(0);
}
