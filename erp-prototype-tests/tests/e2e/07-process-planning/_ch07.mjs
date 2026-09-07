// 第七章「印務登打製程與備料規格選擇」專用的取用工具。
// 全域共用工具在 tests/e2e/_helpers.mjs（不可修改），這裡只放本章重複出現的三段取用動作。
import { expect } from '@playwright/test';

/**
 * 點清單上的單號／編號連結進詳情頁。清單剛掛載時的第一次點擊偶爾落在尚未接上事件的節點上，
 * 故重試到網址真的換掉為止（Typography.Link 走前端路由，記憶體狀態保留）。
 */
export async function clickIntoDetail(page, text, urlPattern) {
  const link = page.getByText(text, { exact: true }).first();
  await expect(link).toBeVisible();
  await expect(async () => {
    await link.click();
    await expect(page).toHaveURL(urlPattern, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
}

/**
 * 從工單列表點單號進工單詳情（Typography.Link 走前端路由，記憶體狀態保留）。
 * 列表剛掛載時的第一次點擊偶爾落在尚未接上事件的節點上，故重試到網址真的換掉為止。
 */
export async function openWorkOrder(page, workOrderNo) {
  const link = page.getByText(workOrderNo, { exact: true }).first();
  await expect(link).toBeVisible();
  await expect(async () => {
    await link.click();
    await expect(page).toHaveURL(/work-orders\/detail/, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  await expect(page.getByRole('heading', { name: workOrderNo })).toBeVisible();
}

/** 生產任務表單（新增／編輯）的對話框 */
export const taskForm = (page) =>
  page.locator('.ant-modal').filter({ hasText: '任務內容與排程' }).last();

/** BOM 選擇器對話框 */
export const bomPicker = (page) =>
  page.locator('.ant-modal').filter({ has: page.getByText('選擇 BOM') }).last();

/** BOM 選擇器的資料列（排除量測用的隱藏列） */
export const pickerRows = (page) => bomPicker(page).locator('.ant-table-tbody tr.ant-table-row');

/**
 * 在已開啟的 BOM 選擇器裡切頁籤、用名稱搜尋、勾第 index 列後按「帶入」。
 * @param {string} tab 材料／工序／裝訂
 * @param {string} keyword 名稱搜尋關鍵字
 * @param {number} index 第幾列（預設第一列）
 */
export async function pickBomRow(page, { tab, keyword, index = 0 }) {
  const picker = bomPicker(page);
  await expect(picker).toBeVisible();
  if (tab) await picker.locator('.ant-tabs-tab', { hasText: tab }).click();
  if (keyword) {
    // 分類側欄自己也有一個搜尋框，故以表格上方篩選列的提示文字定位
    const box = picker.getByPlaceholder(`搜尋${tab ?? '材料'}名稱`);
    await box.fill(keyword);
    await box.press('Enter'); // 共用篩選元件按 Enter 才送出搜尋
    await expect(pickerRows(page).first()).toContainText(keyword);
  }
  await pickerRows(page).nth(index).click();
  await picker.getByRole('button', { name: '帶入' }).click();
  await expect(picker).toBeHidden();
}

/** 生產任務表單裡某個頁籤下的欄位輸入框（AntD Form.Item 以標題文字定位） */
export function formField(page, label) {
  return taskForm(page)
    .locator('.ant-form-item')
    .filter({ has: page.getByText(label, { exact: true }) })
    .first();
}

/** 生產任務表單頂端「主檔帶入」區的某一格（標題與值上下排在同一個容器裡） */
export function readOnlyPair(page, label) {
  return taskForm(page).locator('.ant-space-vertical').filter({ hasText: label }).first();
}

/** 切生產任務表單的頁籤 */
export async function switchFormTab(page, label) {
  await taskForm(page).locator('.ant-tabs-tab').filter({ hasText: label }).click();
}
