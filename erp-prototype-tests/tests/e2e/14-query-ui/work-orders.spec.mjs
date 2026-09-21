import { test, expect } from '@playwright/test';
import { clickIntoDetail, openAs, switchRole } from '../_helpers.mjs';
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

test('14.2 工單詳情的頁籤：成本區只留成本對照（原編號 2）', async ({ page }) => {
  // 起點資料：鏈二 WO-2026-0710
  // 期望值取自 openspec work-order § 工單成本對照：成本區只有「成本對照」一個頁籤，
  // 各生產任務的預估值仍於對照的預估欄逐列可讀
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0710');
  await expect(page.locator('body')).toContainText('WO-2026-0710');

  // 不出現「預估成本」頁籤
  await expect(page.getByRole('tab', { name: '預估成本' })).toHaveCount(0);

  // 成本對照用同一組列，每列都有預估、實際與升降；預估欄逐列讀得到各任務的預估值
  await page.getByRole('tab', { name: '成本對照' }).click();
  await expect(page).toHaveURL(/tab=cost/);
  const activePane = page.locator('.ant-tabs-tabpane-active');
  await expect(activePane).toContainText('預估（凍結）');
  await expect(activePane).toContainText('實際（累積）');
  await expect(activePane).toContainText('升降');
  const compareBody = activePane.locator('.ant-table-tbody tr');
  await expect(compareBody.filter({ hasText: '顏色費用：CMYK' })).toHaveCount(1);
  await expect(compareBody.filter({ hasText: '顏色費用：金屬色（合印）' })).toHaveCount(1);
  await expect(compareBody.filter({ hasText: '海報四色印刷' })).toHaveCount(1);
  await expect(compareBody.filter({ hasText: '海報四色印刷' })).toContainText('NT$ 5,981');

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

test('14.19 工單摘要卡的兩格利潤率取所屬印件口徑', async ({ page }) => {
  // 起點資料：鏈二 WO-2026-0710（所屬印件 PI-2026-0710，旗下只有這一張工單）
  // 期望值取自 openspec work-order § 工單詳情摘要卡利潤率的四個 Scenario
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0710');
  await expect(page.locator('body')).toContainText('預估利潤率');
  await expect(page.locator('body')).toContainText('實際利潤率');

  // 摘要卡不再有任務進度格與顏色費用合計格
  await expect(page.locator('body')).not.toContainText('任務進度');
  await expect(page.locator('body')).not.toContainText('顏色費用合計');

  // 現場角色整格不出現，也不以空值或「權限不足」字樣呈現
  for (const role of ['生管', '師傅', '品檢人員']) {
    await switchRole(page, role);
    await expect(page.locator('body')).not.toContainText('預估利潤率');
    await expect(page.locator('body')).not.toContainText('實際利潤率');
    await expect(page.locator('body')).not.toContainText('權限不足');
  }

  // 業務與業務主管看得到兩格（利潤是他們判斷要不要再接這一款的依據）
  for (const role of ['業務', '業務主管']) {
    await switchRole(page, role);
    await expect(page.locator('body')).toContainText('預估利潤率');
    await expect(page.locator('body')).toContainText('實際利潤率');
  }

  // 兩格的利潤率下方各帶一行金額副行（公司對照表 B5）：金額取印件層既有取數，不重算，
  // 故與印件詳情頁「報價與利潤」頁籤的同名欄位必然同值
  await switchRole(page, '印務');
  const estCaption = page.getByText(/^預估利潤 NT\$ [\d,]+$/);
  const actualCaption = page.getByText(/^實際利潤 NT\$ [\d,]+$/);
  await expect(estCaption).toBeVisible();
  await expect(actualCaption).toBeVisible();
  const estAmount = (await estCaption.textContent()).replace('預估利潤 ', '');
  const actualAmount = (await actualCaption.textContent()).replace('實際利潤 ', '');

  // 由工單頁的印件編號連結進印件詳情（站內導頁、記憶體狀態保留）
  await page.getByText('查看印件資訊').first().click();
  await clickIntoDetail(page, 'PI-2026-0710', /print-items\/detail/);
  await page.getByRole('tab', { name: '報價與利潤' }).click();
  await expect(
    page.locator('th.ant-descriptions-item-label:has-text("預估利潤（未稅）") + td').first(),
  ).toHaveText(estAmount);
  await expect(
    page.locator('th.ant-descriptions-item-label:has-text("實際利潤（未稅）") + td').first(),
  ).toHaveText(actualAmount);
});

test('14.20 工單詳情顯示接單業務、訂單類型、客戶編號與工單聯絡', async ({ page }) => {
  // 起點資料：鏈四 WO-2026-0820（所屬訂單 ORD-2026-0820，客戶晨光文創、客戶編號 MBC000006，
  // 接單業務洪嘉駿、訂單類型線下單；負責印務周建宏的聯絡電話已填）
  // 期望值取自 openspec work-order § 工單詳情的印件與聯絡資訊顯示
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0820');
  await expect(page.locator('body')).toContainText('WO-2026-0820');

  // 標題列的案名：訂單案名、印件名稱與客戶名稱
  await expect(page.locator('body')).toContainText('《山城記事》精裝書');
  await expect(page.locator('body')).toContainText('晨光文創股份有限公司');

  // 印件基本資訊區的三項唯讀衍生（面板預設收合，先展開）
  await page.getByText('查看印件資訊').first().click();
  const basic = page.locator('.ant-descriptions');
  await expect(basic.filter({ hasText: '客戶編號' }).first()).toContainText('MBC000006');
  await expect(basic.filter({ hasText: '接單業務' }).first()).toContainText('洪嘉駿');
  await expect(basic.filter({ hasText: '訂單類型' }).first()).toContainText('線下單');

  // 工單聯絡取負責印務在人員資料的聯絡電話（工單資訊卡預設收合，先展開）
  await page.getByText('查看工單資訊').first().click();
  await expect(
    page.locator('th.ant-descriptions-item-label:has-text("工單聯絡") + td').first(),
  ).toContainText('02-2721-5588 #211');
});

test('14.21 負責印務未填聯絡電話時工單聯絡印破折號', async ({ page }) => {
  // 起點資料：WO-2026-0910（負責印務蔡明修未填聯絡電話）
  // 期望值取自 openspec work-order § 負責印務未填電話時顯示「－」
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0910');
  await page.getByText('查看工單資訊').first().click();
  await expect(
    page.locator('th.ant-descriptions-item-label:has-text("工單聯絡") + td').first(),
  ).toHaveText('—');
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

// 工單頁的印件基本資訊欄位清單與欄序（公司對照表 E 區）：工單頁另給一份欄位清單，
// 印件詳情頁維持原有清單。兩頁的審稿討論串都排在印件配方左邊。
const WORK_ORDER_PRINT_ITEM_LABELS = [
  '印件編號',
  '接單業務',
  '訂單編號',
  '客戶編號',
  '案名',
  '客戶名稱',
  '印件屬性',
  '訂單類型',
  '負責審稿人員',
  '出貨方式',
  '預計出貨日',
  '內部完成日',
  '審稿討論串',
  '印件配方',
  '製作討論串',
  '預計產線',
  '製程說明',
  '品檢需求',
  '規格備註',
  '稿件備註',
  '包裝備註',
];

// 工單頁不列的六欄（業務與審稿階段在看的欄位）
const PRINT_ITEM_ONLY_LABELS = ['印件分類', '難易度', '免審稿', '訂單來源'];

// 印件基本資訊那一張 Descriptions：同頁另有工單資訊與印件檔案兩張，只有這一張含印件編號
const basicPanelOf = (page) =>
  page.locator('.ant-descriptions').filter({ hasText: '印件編號' }).first();

const labelsOf = (descriptions) => descriptions.locator('.ant-descriptions-item-label');

test('14.22 工單頁的印件基本資訊只列工單要用的欄位，欄序照公司對照表', async ({ page }) => {
  // 起點資料：鏈四 WO-2026-0820（所屬印件 PI-2026-0820，大貨印件）
  // 期望值取自公司對照表 2026-09-18 版 E 區（E7～E10 刪除、E13 左右調換、E 欄序）
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0820');
  await page.getByText('查看印件資訊').first().click();

  const basic = basicPanelOf(page);
  await expect(labelsOf(basic)).toHaveText(WORK_ORDER_PRINT_ITEM_LABELS);

  // 六欄在工單頁整列不出現
  for (const label of PRINT_ITEM_ONLY_LABELS) {
    await expect(basic.locator('.ant-descriptions-item-label', { hasText: label })).toHaveCount(0);
  }

  // 印件詳情頁維持原有欄位清單：四欄照樣看得到，且審稿討論串仍排在印件配方左邊
  await clickIntoDetail(page, 'PI-2026-0820', /print-items\/detail/);
  const itemBasic = basicPanelOf(page);
  for (const label of PRINT_ITEM_ONLY_LABELS) {
    await expect(itemBasic.locator('.ant-descriptions-item-label', { hasText: label })).toHaveCount(
      1,
    );
  }
  const itemLabels = await labelsOf(itemBasic).allTextContents();
  expect(itemLabels.indexOf('審稿討論串')).toBeLessThan(itemLabels.indexOf('印件配方'));
  // 兩頁的欄名一致：不再出現「所屬訂單」，客戶那一欄叫「客戶名稱」
  expect(itemLabels).toContain('訂單編號');
  expect(itemLabels).toContain('客戶名稱');
  expect(itemLabels).not.toContain('所屬訂單');
});

test('14.23 工單資訊的欄序照公司對照表', async ({ page }) => {
  // 起點資料：鏈四 WO-2026-0820（非配方展開產生，故無展開來源那一列）
  // 期望值取自公司對照表 2026-09-18 版 C 區欄序
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0820');
  await page.getByText('查看工單資訊').first().click();

  const info = page.locator('.ant-descriptions').filter({ hasText: '每份印件生產數量' }).first();
  await expect(labelsOf(info)).toHaveText([
    '負責印務',
    '工單審核主管',
    '工單聯絡',
    '每份印件生產數量',
    '目標數量',
    '生產數量（報工累計）',
    '預計完工日',
    '實際完工日',
    '確樣需求',
  ]);
});

test('14.24 完稿縮圖以縮圖預覽塊與檔名並排呈現', async ({ page }) => {
  // 起點資料：鏈四 PI-2026-0820（當前合格輪次 RR-2026-0820-1 已掛完稿縮圖一張）
  // 期望值取自公司對照表 2026-09-18 版 F1
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0820');
  await page.getByText('查看印件檔案').first().click();

  const thumbCell = page
    .locator('th.ant-descriptions-item-label:has-text("完稿縮圖") + td')
    .first();
  // 檔名與縮圖並排：同一格裡既有檔名文字、也有一張看得到的圖
  await expect(thumbCell).toContainText('山城記事精裝書-完稿縮圖-v2.png');
  await expect(thumbCell.locator('img')).toHaveCount(1);
  // 點檔名開得了預覽（另開分頁，故只驗連結指向該檔）
  await expect(thumbCell.getByRole('link', { name: /完稿縮圖/ })).toHaveAttribute(
    'href',
    /mock-artwork/,
  );
});
