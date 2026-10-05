// 第三章（款項與發票）專用工具。撰寫規約第 5 條：AntD 結構類名只在本檔使用。
// 本檔刻意不 import 其他章的工具檔，複製 00-main-flow/_flow-helpers.mjs 內需要的函式
// （跨章共用工具在 tests/e2e/_helpers.mjs，本檔只放本章專用的 AntD 操作細節）。
import { expect } from '@playwright/test';

// AntD 會在按鈕文字每個中文字中間插空白（「核可」顯示為「核 可」，長字串同理），
// 帶圖示的按鈕又會把圖示名稱塞進可及名稱最前面，故只錨定結尾。
export const spaced = (label) => new RegExp(`${label.split('').join('\\s*')}$`);

/** 依按鈕文字取按鈕（容忍 AntD 的中文字間空白與圖示前綴） */
export const button = (scope, label) => scope.getByRole('button', { name: spaced(label) });

/** 目前開著的對話框（Modal 或 PanelDialog） */
export const dialog = (page) => page.locator('.ant-modal-content:visible').last();

/** 表格中含指定文字的那一列 */
export const rowOf = (scope, text) =>
  scope.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();

/** 點一顆會開對話框的按鈕：剛渲染的節點事件可能還沒接上，重試到目標出現為止 */
export async function clickOpen(clickTarget, appearTarget) {
  await expect(async () => {
    await clickTarget.click();
    await expect(appearTarget).toBeVisible({ timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
}

const openDropdown = (page) =>
  page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();

const selectBox = (target) =>
  target.locator(
    "xpath=ancestor-or-self::div[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]",
  );

/** 在單選下拉挑一個選項（虛擬捲動，開下拉後把選項捲進來再點；沒點到就整段重試） */
export async function pickOption(page, select, label) {
  await expect(async () => {
    const box = selectBox(select).first();
    if (!(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').count())) await box.click();
    const option = openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.scrollIntoViewIfNeeded({ timeout: 2000 });
    await option.click({ timeout: 3000 });
    await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0, { timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30000 });
}

/** 填 AntD DatePicker：填入 YYYY-MM-DD 文字後按 Enter 確認（不開日曆面板點格子） */
export async function pickDate(input, value) {
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

/** 讀最新一則成功提示的文字 */
export async function toastText(page, pattern) {
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toContainText(pattern ?? /./, { timeout: 15_000 });
  return notice.innerText();
}

/** 等對話框與遮罩完全關閉 */
export async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
}

/** 切詳情頁的某個頁籤 */
export async function openTab(page, label) {
  await page.locator('.ant-tabs-tab', { hasText: label }).first().click();
}

// ── 發票草稿（3.13～3.23）共用定位 ──
// 收款項目表以「款項」欄頭錨定、發票主表以「發票號碼」欄頭錨定，兩張表的期次描述與單號文字會互相重複。
export const installmentTable = (page) =>
  page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
export const invoiceTable = (page) =>
  page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '發票號碼' }) });
export const installmentRow = (page, description) =>
  installmentTable(page).locator('tbody tr.ant-table-row').filter({ hasText: description }).first();

// 收款項目列上的發票入口（圖示按鈕，可及名稱即入口文字）
export const INVOICE_ENTRIES = ['建立草稿', '直接開立發票', '送出開立'];
export const entryButton = (row, label) => row.getByRole('button', { name: label, exact: true });

/** 斷言這一期列上「只」出現指定的發票入口，其餘入口不渲染 */
export async function expectEntries(row, labels) {
  for (const label of INVOICE_ENTRIES) {
    await expect(entryButton(row, label)).toHaveCount(labels.includes(label) ? 1 : 0);
  }
}

/** 三方對帳區「發票淨額（含稅）」主數字 */
export const netInvoicedValue = (page) =>
  page.getByText('發票淨額（含稅）', { exact: true }).first().locator('xpath=following-sibling::div[1]');

/** 抽屜（側板） */
export const drawer = (page) => page.locator('.ant-drawer-content:visible').last();

/** 詳情頁 PanelBlock 標題列（含編輯鈕） */
export const panelSection = (page, heading) =>
  page.getByRole('heading', { name: heading, level: 5 }).locator('xpath=ancestor::div[.//button][1]');

/** 訂單詳情標頭（含狀態標籤） */
export const orderHeader = (page) =>
  page.getByRole('main').getByRole('heading', { level: 4 }).first().locator('xpath=..');

/** 站內從訂單列表搜尋單號進詳情，再切到「金額與發票」（記憶體資料保留） */
export async function openOrderInApp(page, orderNo, gotoInApp) {
  await gotoInApp(page, '/orders');
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await search.fill(orderNo);
  await search.press('Enter');
  await expect(async () => {
    await page.getByText(orderNo, { exact: true }).first().click();
    await expect(page).toHaveURL(/orders\/detail/, { timeout: 5000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
  await openTab(page, '金額與發票');
}
