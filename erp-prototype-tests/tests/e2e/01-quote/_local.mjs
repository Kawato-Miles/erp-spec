// 第一章（需求單）專用工具。撰寫規約第 5 條：AntD 結構類名只在本檔使用，跨章不 import。
// 基礎操作工具複製自 00-main-flow/_flow-helpers.mjs（該檔的頭註解也說明了同一考量：
// 各章可獨立退役，跨章相依會讓刪一章就壞一片）。
import { expect } from '@playwright/test';
import { switchRole } from '../_helpers.mjs';

// ─── 基礎操作工具（複製自 00-main-flow/_flow-helpers.mjs） ───

export const spaced = (label) => new RegExp(`${label.split('').join('\\s*')}$`);
export const button = (scope, label) => scope.getByRole('button', { name: spaced(label) });
export const dialog = (page) => page.locator('.ant-modal-content:visible').last();
export const drawer = (page) => page.locator('.ant-drawer-content').last();

export async function clickOpen(clickTarget, appearTarget) {
  await expect(async () => {
    await clickTarget.click();
    await expect(appearTarget).toBeVisible({ timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
}

export const rowOf = (scope, text) =>
  scope.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();

// 需求單詳情頁的頁籤（印件報價／報價紀錄／權限管理／活動紀錄）共用同一個 Tabs，
// AntD 預設不會把非目前頁籤的內容從 DOM 移除（只是 CSS 隱藏），故裸的
// 'tbody tr.ant-table-row' 會連同其他頁籤裡的表格一起算進去。查某頁籤的列數
// 一律先 openTab 切過去，再用本函式限定在目前顯示的那個頁籤內找。
export const activeTabRows = (page) =>
  page.locator('.ant-tabs-tabpane-active tbody tr.ant-table-row');

const openDropdown = (page) =>
  page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();

const selectBox = (target) =>
  target.locator(
    "xpath=ancestor-or-self::div[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]",
  );

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

export async function pickMulti(page, select, label) {
  await selectBox(select).first().click();
  await openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
}

export async function openTab(page, label) {
  await page.locator('.ant-tabs-tab', { hasText: label }).first().click();
}

export async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
  await expect(page.locator('.ant-drawer-mask:visible')).toHaveCount(0);
}

export const detailTitle = (page) =>
  page.getByRole('main').getByRole('heading', { level: 4 }).first();

export const quoteCurrentStep = (page) =>
  page.locator('.ant-steps-item-process .ant-steps-item-title');

// 上傳用的假檔（Upload 的 beforeUpload 一律回 false，只暫存不上傳）
export const fakeFile = (name, mimeType = 'application/pdf') => ({
  name,
  mimeType,
  buffer: Buffer.from(`fake ${name}`),
});

// ─── 需求單章專用高階流程（build helper） ───

/** 填 AntD DatePicker：填入 YYYY-MM-DD 文字後按 Enter 確認（不開日曆面板點格子） */
export async function pickDate(input, value) {
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

/**
 * 業務在需求單列表建一張新單頭並進入詳情頁。回傳新單號，操作結束時已在詳情頁。
 * 單頭已無任何交期欄——交期的唯一事實在印件層的「預計出貨日」，逐列手填、無預設值。
 */
export async function createQuoteHeader(
  page,
  {
    title,
    customer = '誠品書店股份有限公司',
    inquirySource = 'Line',
    sales = '洪嘉駿',
    estimators = ['吳國豪'],
    billing = '感官SSP',
  },
) {
  const panel = drawer(page);
  await clickOpen(button(page, '新增'), panel.getByLabel('需求案名'));
  await panel.getByLabel('需求案名').fill(title);
  await pickOption(page, panel.getByLabel('客戶'), customer);
  await pickOption(page, panel.getByLabel('詢價來源'), inquirySource);
  await pickOption(page, panel.getByLabel('接單業務'), sales);
  for (const estimator of estimators) {
    await pickMulti(page, panel.getByLabel('評估印務主管'), estimator);
  }
  await pickOption(page, panel.getByLabel('帳務公司'), billing);
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  const listRow = rowOf(page, title);
  const quoteNo = (await listRow.innerText()).match(/Q-\d{8}-\d{2}/)[0];
  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  return quoteNo;
}

/**
 * 在詳情頁新增一筆印件項目。difficulty／unitPrice／costEstimate 為 null 時該欄留空
 * （用於測試「缺漏即擋下轉換」）。
 * orderDueDate 選填：不傳＝維持空白（欄位本來就沒有預設值，覆蓋「這件還沒談定交期」的情境）；
 * 傳字串＝填成該日期。
 */
export async function addItem(
  page,
  { name, productionType = '大貨', quantity = '100', difficulty = 3, unitPrice, costEstimate, orderDueDate },
) {
  const panel = drawer(page);
  await clickOpen(button(page, '新增印件'), panel.getByLabel('項目名稱'));
  await panel.getByLabel('項目名稱').fill(name);
  await pickOption(page, panel.getByLabel('印件類型'), productionType);
  await panel.getByLabel('數量').fill(quantity);
  if (difficulty != null) await pickOption(page, panel.getByLabel('難易度'), String(difficulty));
  if (unitPrice != null) await panel.getByLabel('單價（未稅）').fill(String(unitPrice));
  if (costEstimate != null) {
    await panel.getByLabel('成本估算（未稅）').fill(String(costEstimate));
  }
  if (orderDueDate) await pickDate(panel.getByLabel('預計出貨日'), orderDueDate);
  await button(panel, '確認').click();
  await waitModalsClosed(page);
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
}

/** 印務主管把指定印件的成本估算填妥並按「評估完成」（不切角色，呼叫前先自行 switchRole）。 */
export async function fillCostAndCompleteEstimate(page, itemNames, cost = 20) {
  for (const name of itemNames) {
    const panel = drawer(page);
    await clickOpen(rowOf(page, name).getByRole('button').first(), panel.getByLabel('成本估算（未稅）'));
    await panel.getByLabel('成本估算（未稅）').fill(String(cost));
    await button(panel, '確認').click();
    await waitModalsClosed(page);
  }
  await button(page, '評估完成').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
}
