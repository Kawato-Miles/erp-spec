import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { gotoInAppPatiently as gotoInApp } from './_retry.mjs';

// 本機同時有多個 sub-agent 在跑測試，系統負載偏高時 dev server 首次編譯路由會拖長；
// 放寬本檔逾時，避免把環境壅塞誤判成測試邏輯錯誤
test.setTimeout(60_000);

// AntD Select 下拉的可見選項是 class="ant-select-item-option" 的 div（不帶 role="option"——
// 帶 role="option" 的是給螢幕報讀器用、寬高皆 0 的隱藏複本），故一律用 class 選取可見選項，
// 不用 getByRole('option', ...)（會命中那份隱藏複本，點擊逾時）。
const selectVisibleOption = (page, label) =>
  page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', {
      hasText: label,
    })
    .first();

test('14.1 工單列表查詢與篩選（原編號 1）', async ({ page }) => {
  // 起點資料：工單列表的十二張工單
  await openAs(page, '生管', '/work-orders');
  const table = page.locator('.ant-table-tbody').first();

  // 情境：任一角色輸入關鍵字搜尋（改用現行案名，原文的搜尋關鍵字已失效）
  const searchInput = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await searchInput.fill('海報');
  await searchInput.press('Enter');
  await expect(table).toContainText('WO-2026-0710');
  await expect(table).not.toContainText('WO-2026-0601');

  // 清空後以狀態為製作中篩選：現行 12 張工單裡狀態為製作中的唯一一張是 WO-2026-0710
  await searchInput.fill('');
  await searchInput.press('Enter');
  await page.locator('.ant-select', { hasText: '全部狀態' }).click();
  await selectVisibleOption(page, '製作中').click();
  const rows = page.locator('.ant-table-tbody .ant-table-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('WO-2026-0710');

  // 再加上負責印務與交期區間：多個條件為交集，WO-2026-0710（製作中、負責印務周建宏、
  // 交期 2026-09-15）在交集內應仍看得到
  await page.locator('.ant-select', { hasText: '全部印務' }).click();
  await selectVisibleOption(page, '周建宏').click();
  await expect(table).toContainText('WO-2026-0710');

  const deadlineInputs = page.locator('.ant-picker-range input');
  await deadlineInputs.first().fill('2026-09-01');
  await deadlineInputs.first().press('Enter');
  await deadlineInputs.nth(1).fill('2026-09-30');
  await deadlineInputs.nth(1).press('Enter');
  await page.keyboard.press('Escape');
  await expect(table).toContainText('WO-2026-0710');
});

test('14.2 工單詳情四個頁籤（原編號 2）', async ({ page }) => {
  // 起點資料：鏈二 WO-2026-0710
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0710');
  await expect(page.locator('body')).toContainText('WO-2026-0710');

  // 任一角色逐一切換製程規劃、預估成本、成本對照、異動紀錄四個頁籤，網址隨切換變化。
  // 製程規劃是預設頁籤（網址一開始未帶 tab 參數，切換到別的頁籤再切回來才看得出網址真的隨動）。
  await page.getByRole('tab', { name: '預估成本' }).click();
  await expect(page).toHaveURL(/tab=estimate/);

  // 預估成本的列為各生產任務一列、顏色的五列、合計列；欄只有成本項目與小計。
  // AntD 會把已看過的頁籤留在 DOM 裡（只是隱藏），故一律縮到作用中頁籤的面板內取列，
  // 否則製程規劃那張任務表的同名列也會被數進來。
  const activePane = page.locator('.ant-tabs-tabpane-active');
  const estHeaders = activePane.locator('.ant-table-thead th');
  await expect(estHeaders.filter({ hasText: '成本項目' })).toHaveCount(1);
  await expect(estHeaders.filter({ hasText: '小計' })).toHaveCount(1);
  const estBody = activePane.locator('.ant-table-tbody tr');
  await expect(estBody.filter({ hasText: '海報四色印刷' })).toHaveCount(1);
  await expect(estBody.filter({ hasText: '顏色費用：CMYK' })).toHaveCount(1);
  await expect(estBody.filter({ hasText: '顏色費用：金屬色（合印）' })).toHaveCount(1);
  await expect(estBody.filter({ hasText: '海報四色印刷' })).toContainText('NT$ 5,981');
  await expect(estBody.filter({ hasText: '顏色費用：CMYK' })).toContainText('NT$ 4,800');
  await expect(activePane.locator('.ant-table-summary')).toContainText('NT$ 16,855');

  // 成本對照用同一組列，每列都有預估、實際與升降
  await page.getByRole('tab', { name: '成本對照' }).click();
  await expect(page).toHaveURL(/tab=cost/);
  await expect(page.locator('body')).toContainText('預估（凍結）');
  await expect(page.locator('body')).toContainText('實際（累積）');
  await expect(page.locator('body')).toContainText('升降');
  const compareBody = page.locator('.ant-tabs-tabpane-active .ant-table-tbody tr');
  await expect(compareBody.filter({ hasText: '顏色費用：CMYK' })).toHaveCount(1);
  await expect(compareBody.filter({ hasText: '海報四色印刷' })).toHaveCount(1);

  // 異動紀錄頁籤目前沒有資料，因為現行資料沒有異動事實
  await page.getByRole('tab', { name: /異動紀錄/ }).click();
  await expect(page).toHaveURL(/tab=adjustments/);
  await expect(page.getByRole('tab', { name: /異動紀錄/ })).toContainText('（0）');

  // 切回製程規劃：四欄群的母子表格（見 7.9）
  await page.getByRole('tab', { name: '製程規劃' }).click();
  await expect(page).toHaveURL(/tab=process/);
  const headers = page.locator('.ant-table-thead th');
  await expect(headers.filter({ hasText: '印務規劃' })).not.toHaveCount(0);
  await expect(headers.filter({ hasText: '現場執行' })).not.toHaveCount(0);
});

test('14.11 清單上的編號可以直接點開詳情（原編號 181）', async ({ page }) => {
  // 起點資料：生產任務管理頁的任一列（該頁只列待接收任務，現行資料為 WO-2026-0815 四筆）
  await openAs(page, '生管', '/production-floor/dispatch');
  // 情境：生管點該列的工單編號。編號不是純文字，可點擊
  await page.getByText('WO-2026-0815', { exact: true }).first().click();
  // 系統之後怎麼變：導到該工單詳情頁（本機測試並行、dev server 首次編譯路由較慢，放寬逾時）
  await expect(page).toHaveURL(/\/work-orders\/detail\/?\?id=/, { timeout: 20_000 });
  await expect(page.locator('body')).toContainText('WO-2026-0815');
});

test('14.14 工單列表只帶自己負責與被分享的（原編號 187）', async ({ page }) => {
  // 起點資料：工單列表的十二張工單，WO-2026-0905 尚未指派印務、WO-2026-0907 與 WO-2026-0910
  // 的負責印務為蔡明修；本條的印務為周建宏、印務主管為吳國豪。
  // 先直連他人工單 WO-2026-0907 的網址（情境第一步就是直連，故當本測試唯一一次 openAs）：
  // 頁面看得完整，但負責人動作一律停用，停用理由不寫出負責人姓名。
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0907');
  await expect(page.locator('body')).toContainText('WO-2026-0907');
  const editButton = page.getByRole('button', { name: '編輯' }).first();
  await expect(editButton).toBeDisabled();
  await editButton.hover({ force: true });
  const tooltip = page.locator('.ant-tooltip-inner');
  await expect(tooltip).toBeVisible();
  const tooltipText = await tooltip.innerText();
  expect(tooltipText).not.toContain('蔡明修');

  // 印務的工單列表只列負責人是周建宏、或分享成員含周建宏的工單
  await gotoInApp(page, '/work-orders');
  const table = page.locator('.ant-table-tbody').first();
  await expect(table).toContainText('WO-2026-0710');
  await expect(table).not.toContainText('WO-2026-0905');
  await expect(table).not.toContainText('WO-2026-0907');
  await expect(table).not.toContainText('WO-2026-0910');

  // 印件列表只列旗下至少有一張工單對自己可見的印件：PI-2026-0803（旗下唯一工單 WO-2026-0910
  // 的負責人為蔡明修）不在列，PI-2026-0710（負責人周建宏）仍在列
  await gotoInApp(page, '/print-items');
  const printItemTable = page.locator('.ant-table-tbody').first();
  await expect(printItemTable).toContainText('PI-2026-0710');
  await expect(printItemTable).not.toContainText('PI-2026-0803');

  // 切成印務主管重看同樣兩頁：兩頁都列全部，含尚未指派的
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders');
  const fullTable = page.locator('.ant-table-tbody').first();
  await expect(fullTable).toContainText('WO-2026-0905');
  await expect(fullTable).toContainText('WO-2026-0907');
  await expect(fullTable).toContainText('WO-2026-0910');
  await gotoInApp(page, '/print-items');
  await expect(page.locator('.ant-table-tbody').first()).toContainText('PI-2026-0803');
});

test('14.15 工單分享頁籤的兩種層級與代理範圍（原編號 188）', async ({ page }) => {
  // 起點資料：鏈五 WO-2026-0901（負責印務周建宏，預置分享成員蔡明修一位且層級為檢視）
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0901');

  // 情境：印務打開 WO-2026-0901，切到異動紀錄右邊的「分享（1）」頁籤
  const sharingTab = page.getByRole('tab', { name: /分享（1）/ });
  await expect(sharingTab).toBeVisible();
  await sharingTab.click();
  await expect(page.locator('body')).toContainText('蔡明修', { timeout: 15_000 });
  await expect(page.locator('body')).toContainText('授予者 周建宏');

  // 把蔡明修的層級由檢視改成編輯（代理）：層級只有檢視與編輯（代理）兩個值，改完即時生效
  await page.locator('.ant-select', { hasText: '檢視' }).first().click();
  await selectVisibleOption(page, '編輯（代理）').click();
  await expect(page.locator('.ant-select', { hasText: '編輯（代理）' }).first()).toBeVisible();
  // 再改回檢視
  await page.locator('.ant-select', { hasText: '編輯（代理）' }).first().click();
  await selectVisibleOption(page, '檢視').click();
  await expect(page.locator('.ant-select', { hasText: '檢視' }).first()).toBeVisible();

  // 按「新增分享成員」看候選人選與層級預設值：層級預設為檢視，候選人選排除負責人本人與既有成員
  await page.getByRole('button', { name: '新增分享成員' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal).toContainText('層級');
  const modalLevelSelect = modal.locator('.ant-select').last();
  await expect(modalLevelSelect).toContainText('檢視');
  await modal.locator('.ant-select').first().click();
  const optionList = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  await expect(optionList.filter({ hasText: '周建宏' })).toHaveCount(0);
  await expect(optionList.filter({ hasText: '蔡明修' })).toHaveCount(0);
  // 收起下拉不用 Escape：AntD Modal 也監聽 Escape，會連對話框一起關掉，改用 force 直接點取消
  // （AntD Modal 預設取消鈕的可存取名稱字間帶空格「取 消」，match 用正規式不對空格敏感）
  await page.getByRole('button', { name: /取\s*消/ }).click({ force: true });

  // 最後切成印務主管重看同一個頁籤（同一張工單詳情頁不換頁，只換模擬角色）：
  // 看得到同一份名單，但沒有新增鈕與移除鈕、層級下拉停用
  await switchRole(page, '印務主管');
  await page.getByRole('tab', { name: /分享（1）/ }).click();
  await expect(page.locator('body')).toContainText('蔡明修');
  await expect(page.getByRole('button', { name: '新增分享成員' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '移除' })).toHaveCount(0);
  await expect(page.locator('.ant-select', { hasText: '檢視' }).first().locator('input')).toBeDisabled();
});

test('14.17 成本對照的顏色列同時呈現預估、實際與升降', async ({ page }) => {
  // 起點資料：鏈二 WO-2026-0710（已有報工事實，登記 CMYK 四色、沒有特殊色）
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0710&tab=cost');
  await expect(page.locator('body')).toContainText('WO-2026-0710');

  // 顏色的五列固定呈現，未登記者也在（同上，縮到作用中頁籤的面板內取列）
  const body = page.locator('.ant-tabs-tabpane-active .ant-table-tbody tr');
  for (const label of [
    '顏色費用：單黑',
    '顏色費用：CMYK',
    '顏色費用：Pantone',
    '顏色費用：金屬色（合印）',
    '顏色費用：獨立印',
  ]) {
    await expect(body.filter({ hasText: label })).toHaveCount(1);
  }

  // 有登記的顏色列：預估、實際、升降三格都有內容（欄序為成本項目、預估、實際、升降）
  const cmykRow = body.filter({ hasText: '顏色費用：CMYK' }).first();
  await expect(cmykRow.locator('td').nth(1)).toContainText('NT$ 4,800');
  const cmykActual = await cmykRow.locator('td').nth(2).innerText();
  expect(Number(cmykActual.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);
  await expect(cmykRow.locator('td').nth(3)).not.toHaveText('');

  // 預估與實際皆為 0 的顏色列：升降留空
  const pantoneRow = body.filter({ hasText: '顏色費用：Pantone' }).first();
  await expect(pantoneRow.locator('td').nth(1)).toHaveText('NT$ 0');
  await expect(pantoneRow.locator('td').nth(2)).toHaveText('NT$ 0');
  await expect(pantoneRow.locator('td').nth(3)).toHaveText('');
});
