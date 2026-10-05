import { expect } from '@playwright/test';
import { gotoInApp } from '../_helpers.mjs';

// 第十章共用工具：轉交單側板、點收對話框、工作包報工紀錄、提示訊息。
// 對話框一律以標題文字定位，確認鈕取頁尾最後一顆（PanelDialog 頁尾為「取消」「確認」兩顆），
// 不綁確認鈕的字樣——字樣屬介面細節，情境目錄沒有寫死。

export const FAKE_PHOTO = (name) => ({ name, mimeType: 'image/jpeg', buffer: Buffer.from(name) });

/** 標題含指定文字、目前顯示中的對話框 */
export const dialogOf = (page, title) =>
  page.locator('.ant-modal-content:visible').filter({ hasText: title }).last();

/** 按對話框頁尾的確認鈕 */
export const confirmDialog = async (dialog) => {
  await dialog.locator('.ant-modal-footer button').last().click();
};

/** 對話框內某個表單欄位（以標籤全文定位：「良品數」不會誤中「不良品數」） */
export const formItemOf = (scope, label) =>
  scope.locator(`.ant-form-item:has(.ant-form-item-label :text-is("${label}"))`).first();

/** 系統提示（訊息、警示框、欄位錯誤三種呈現都算） */
export const noticeOf = (page, text) =>
  page
    .locator('.ant-message-notice, .ant-alert, .ant-form-item-explain-error, .ant-notification-notice')
    .filter({ hasText: text })
    .first();

/** 在轉交單（所有轉交單或我的轉交單，依角色）打開某張單的側板 */
export async function openTicketDrawer(page, ticketNo) {
  await gotoInApp(page, '/production-floor/transfers');
  // 列表一頁十筆，較早的單（如 TT-20260827-001）落在第二頁；先用搜尋框以單號篩出再點
  const search = page.getByPlaceholder(/轉交單編號/).first();
  await search.fill(ticketNo);
  await search.press('Enter');
  await page.getByText(ticketNo, { exact: true }).first().click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer).toContainText(ticketNo);
  return drawer;
}

/** 建單成立的提示：寫明已通知哪位負責廠務 */
export const CREATED_TOAST = /已建立.*已通知負責廠務/;

/**
 * 建轉交單對話框的「負責廠務」（必選，候選為具轉交搬運回報權限的人員）。
 * 在按「建立 N 張單」之前呼叫。
 */
export async function assignMover(page, name = '簡俊男') {
  const dialog = dialogOf(page, '建立轉交單');
  await dialog.locator('.ant-form-item').filter({ hasText: '負責廠務' }).locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator(`.ant-select-item-option[title="${name}"]`)
    .click();
}

/**
 * 在轉交單把某張單的母層列展開，回傳子層中某一條明細列（以生產任務名稱定位）。
 * 再次點收與點收修改的操作在子層列上。
 */
export async function ticketDetailSubRow(page, ticketNo, taskName) {
  await gotoInApp(page, '/production-floor/transfers');
  const search = page.getByPlaceholder(/轉交單編號/).first();
  await search.fill(ticketNo);
  await search.press('Enter');
  const main = page.locator('tr.ant-table-row', { hasText: ticketNo }).first();
  const expand = main.locator('.ant-table-row-expand-icon');
  if ((await expand.getAttribute('class'))?.includes('collapsed')) await expand.click();
  return page
    .locator('tr.ant-table-expanded-row')
    .locator('tr.ant-table-row', { hasText: taskName })
    .first();
}

/** 側板明細表中某一條明細（以來源生產任務名稱定位） */
export const detailRowOf = (drawer, taskName) =>
  drawer.locator('.ant-drawer-body tr.ant-table-row', { hasText: taskName }).first();

/** 關閉目前的側板 */
export async function closeDrawer(page) {
  await page.getByRole('button', { name: '關閉' }).last().click();
}

/**
 * 在點收佇列對某張單按點收，逐條填點收量後送出。
 * @param {Object} quantities { 任務名稱: 點收數量 }；沒列的明細沿用預設的搬運數量
 * @returns 點收對話框（送出前的那一個）
 */
export async function receiveInQueue(page, ticketNo, quantities = {}) {
  await gotoInApp(page, '/production-floor/receiving');
  await page.locator('tr', { hasText: ticketNo }).getByRole('button', { name: '點收' }).click();
  const dialog = dialogOf(page, '點收');
  for (const [taskName, qty] of Object.entries(quantities)) {
    await dialog.locator('tr', { hasText: taskName }).locator('.ant-input-number-input').fill(String(qty));
  }
  await confirmDialog(dialog);
  return dialog;
}

/** 在生產任務單元打開某個工作包的報工紀錄側板 */
export async function openPackageReports(page, packageNo) {
  await gotoInApp(page, '/production-floor/work-packages');
  await page.getByText(packageNo, { exact: true }).first().click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer).toContainText('報工紀錄');
  return drawer;
}

/** 報工紀錄側板中的一筆報工（以報工時間定位，紀錄表不帶任務名稱） */
export const reportRowOf = (drawer, reportedAt) =>
  drawer.locator('tr.ant-table-row', { hasText: reportedAt }).first();

/** 對一筆報工按「修改」，填改後的值與原因後送出 */
export async function editReport(page, row, { input, good, defect, reason }) {
  await row.getByRole('button', { name: '修改' }).click();
  const dialog = dialogOf(page, '修改');
  if (input != null) await formItemOf(dialog, '生產數量').locator('input').fill(String(input));
  if (good != null) await formItemOf(dialog, '良品數').locator('input').fill(String(good));
  if (defect != null) await formItemOf(dialog, '不良品數').locator('input').fill(String(defect));
  if (reason != null) {
    await formItemOf(dialog, '修改原因').locator('input, textarea').first().fill(reason);
  }
  await confirmDialog(dialog);
  return dialog;
}

/**
 * 轉交單子層明細列的欄序（2026-10-06 拍板）：完稿縮圖、訂單、印件、工單、生產任務、搬運數量、點收數量、
 * 最近點收、簽收照片、操作。回傳某一欄的儲存格。
 */
const SUB_COLUMNS = ['完稿縮圖', '訂單', '印件', '工單', '生產任務', '搬運數量', '點收數量', '最近點收', '簽收照片', '操作'];
export const subCell = (subRow, column) => subRow.locator('td').nth(SUB_COLUMNS.indexOf(column));
