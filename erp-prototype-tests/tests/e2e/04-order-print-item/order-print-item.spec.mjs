import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, cjkName, clickIntoDetail } from '../_helpers.mjs';

// 情境目錄第四章：訂單成立與印件（印製狀態值、訂單類型、購買數量鎖定、討論串、急件）。
// 起點資料：七條主鏈訂單，鏈二 ORD-2026-0710（製作中）／PI-2026-0710、
// 鏈六 ORD-2026-0903（製作等待中，訂單管理人黃聖雯）、鏈四 ORD-2026-0820（急件、is_urgent 注記）。

test('4.1 訂單詳情的印件印製狀態只出現九個值（原編號 65）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const panel = page.getByRole('tabpanel');
  const row = panel.locator('tr', { hasText: 'PI-2026-0710' });
  // 這件印件目前印製狀態為「部分工單製作中」，是九值之一
  await expect(row.getByText('部分工單製作中', { exact: true })).toBeVisible();
  // 舊名詞不應出現在訂單項目分頁內容中
  await expect(panel.getByText('待生產', { exact: true })).toHaveCount(0);
  await expect(panel.getByText('生產中', { exact: true })).toHaveCount(0);
});

test('4.2 訂單類型只出現三個值（原編號 76）', async ({ page }) => {
  await openAs(page, '業務', '/orders');
  await page.getByText('訂單類型').locator('..').locator('.ant-select').click();
  // rc-select 為虛擬捲動清單，開啟的下拉為 DOM 中最後一個 .ant-select-dropdown
  const dropdown = page.locator('.ant-select-dropdown').last();
  await expect(dropdown).toContainText('線下單');
  await expect(dropdown).toContainText('線上單');
  await expect(dropdown).toContainText('諮詢訂單');
  await expect(dropdown).not.toContainText('客製單');
  await expect(dropdown).not.toContainText('線上單EC');
  await page.keyboard.press('Escape');
});

// 說明：規則正本 wiki [[明細時點分界]]（permissions.js canEditPrintItemOrderedQty 註解同步）
// 明寫「分界只有一條線：訂單是否已進入訂單完成或已取消……製作段也一樣」——購買數量與單價在
// 訂單完成／取消前全程可直接改，製作段不鎖，加量改走加開印件只是另一條路徑而非唯一路徑。
test('4.3 購買數量到訂單完成或已取消才鎖定，製作段仍可改（原編號 146）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  // 製作段（ORD-2026-0710 為「製作中」）購買數量與成交單價都可直接改，沒有鎖定提示
  const drawer = page.locator('.ant-drawer-content-wrapper');
  await expect(drawer.getByLabel('購買數量')).toBeEnabled();
  await expect(drawer.locator('#unit_price_untaxed')).toBeEnabled();
  await expect(page.getByText(/已進入製作段.*鎖定/)).toHaveCount(0);
  await drawer.getByRole('button', { name: '取消', exact: true }).click();

  // 加開是另一條路徑而非唯一路徑：按下後訂單多一件新印件，帶入原規格；購買數量必填、預計出貨日選填留空
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const copyModal = page.locator('.ant-modal-content');
  await expect(copyModal.getByText('複製原印件規格加開')).toBeVisible();
  await copyModal.getByLabel('購買數量').fill('500');
  await copyModal.getByRole('button', { name: '加開印件' }).click();
  await expect(
    page.getByText(/已加開印件「品牌形象海報 A2（加開）」（複製 PI-2026-0710 的規格）；請補上數量後上稿走審稿，原印件數量不變/),
  ).toBeVisible();
  await expect(page.locator('tr', { hasText: '品牌形象海報 A2（加開）' })).toBeVisible();
  // 原印件 PI-2026-0710 的購買數量原樣不變
  await expect(row.getByText('3,000')).toBeVisible();

  // 對照組：ORD-2026-0601 已「訂單完成」進終態，明細鎖定——編輯印件入口整個收起、只留檢視
  // 訂單列表依建立日期新到舊排序，ORD-2026-0601 建立最早、不在第一頁，用關鍵字搜尋定位
  // （共用篩選元件的搜尋框要按 Enter 才送出）
  await gotoInApp(page, '/orders');
  await page.getByRole('textbox', { name: /請輸入訂單編號/ }).fill('ORD-2026-0601');
  await page.keyboard.press('Enter');
  await page.locator('a', { hasText: 'ORD-2026-0601' }).first().click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const row2 = page.locator('tr', { hasText: 'PI-2026-0601' });
  await expect(row2.getByRole('button', { name: '編輯印件' })).toHaveCount(0);
  // 清單剛重繪時第一次點擊可能落在尚未接上事件的節點，重試到印件詳情頁的內容出現為止。
  // 判定用頁面內容不用網址：詳情頁以 router.push 開啟，網址可能晚一步才更新（見 README 執行注意事項）
  const qtyValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^購買數量$/ })
    .locator('xpath=following-sibling::td[1]');
  // 訂單項目分頁剛切過來時整張表會再重繪一次，先等這一列穩定再點，免得點在被換掉的節點上
  await expect(row2.getByRole('button', { name: '檢視印件' })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(async () => {
    await row2.getByRole('button', { name: '檢視印件' }).click();
    await expect(qtyValue).toBeVisible({ timeout: 5000 });
  }).toPass({ intervals: [1000, 2000, 4000], timeout: 40000 });
  // 唯讀顯示：Descriptions 表格版式，標籤 <th> 後緊接值 <td>，兩者純文字、無任何輸入框
  await expect(qtyValue).toHaveText('5,000');
});

test('4.4 討論串的通知對象取訂單管理人欄位（原編號 154）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0903&tab=printItems');

  // 建立審稿討論串
  const modal = page.locator('.ant-modal-content');
  await page.getByRole('button', { name: '建立審稿討論串' }).click();
  const reviewCheckbox = page.getByRole('checkbox', { name: /PI-2026-0903/ });
  await expect(reviewCheckbox).toBeVisible();
  await expect(page.getByText('本訂單尚未指定訂單管理人')).toHaveCount(0);
  // 對話框開啟動畫中勾選可能不生效，重試到勾起為止
  await expect(async () => {
    if (!(await reviewCheckbox.isChecked())) await reviewCheckbox.click();
    await expect(reviewCheckbox).toBeChecked({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
  await modal.getByRole('button', { name: /建\s*立/, exact: false }).click();
  await expect(page.getByText(/已建立審稿討論串（涵蓋 1 件印件），並 mention 訂單管理人 黃聖雯/)).toBeVisible();

  // 建立製作討論串（同一件印件）
  await page.getByRole('button', { name: '建立製作討論串' }).click();
  const productionCheckbox = page.getByRole('checkbox', { name: /PI-2026-0903/ });
  await expect(productionCheckbox).toBeVisible();
  await expect(async () => {
    if (!(await productionCheckbox.isChecked())) await productionCheckbox.click();
    await expect(productionCheckbox).toBeChecked({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
  await modal.getByRole('button', { name: /建\s*立/, exact: false }).click();
  await expect(
    page.getByText(/已建立製作討論串（涵蓋 1 件印件），已通知訂單管理人 黃聖雯 與 #印務部 頻道/),
  ).toBeVisible();

  // 再開一次審稿討論串 Dialog：同一件印件已有討論串，反灰不可重複建立
  await page.getByRole('button', { name: '建立審稿討論串' }).click();
  await expect(page.getByText('已有討論串，不可重複建立')).toBeVisible();
  await modal.getByRole('button', { name: /取\s*消/ }).click();
  await expect(page.locator('.ant-modal-content')).toHaveCount(0);

  // 討論串連結只在印件詳情頁呈現（站內導頁：訂單項目列的「檢視印件」icon）
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0903' });
  await itemRow.getByRole('button', { name: '檢視印件' }).click();
  await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0903/);
  await expect(page.getByText('審稿討論串', { exact: true })).toBeVisible();
  await expect(page.getByText('製作討論串', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '檢視討論串' })).toHaveCount(2);
});

test('4.5 業務在印件上選急件選項，系統推出印件層內部完成日（原編號 165）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();

  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  // 側板內即時預覽：印件內部完成日＝未扣急件內部完成日 2026-09-14（一）往前數三個工作天
  //（9/11、9/10、9/9）＝ 2026-09-09；印件預計交期為其下一個工作天 2026-09-10。
  // 兩欄皆為唯讀推導、非表單欄位，以所在 Form.Item 容器定位其內的 input
  const dueDatePreview = page
    .locator('.ant-form-item', { hasText: '印件內部完成日' })
    .locator('input');
  await expect(dueDatePreview).toHaveValue('2026-09-09');

  await page.getByRole('button', { name: '確認' }).click();
  await expect(
    page.getByText(/印件內部完成日重算為「2026-09-09」、印件預計交期已依新的印件內部完成日重算為「2026-09-10」/),
  ).toBeVisible();

  // 清單的急件選項欄顯示紅標、印件內部完成日欄同步顯示新值（標籤帶凍結的天數，單位為工作天）
  await expect(row.getByText('三天急件（提前 3 個工作天）')).toBeVisible();
  await expect(row.getByText('2026-09-09')).toBeVisible();
});

test('4.6 改急件選項或未扣急件內部完成日只留痕與同步，不通知（原編號 166）', async ({ page }) => {
  // 前置：與 4.5 同一動作，改 PI-2026-0710 為三天急件（本測試獨立於 4.5 重跑一次）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await page.getByRole('button', { name: '確認' }).click();
  // 只留痕與同步，系統 SHALL NOT 通知任何角色（Miles 2026-09-08 裁決，取代舊有的急件選項變更通知）
  await expect(page.getByText(/已通知/)).toHaveCount(0);
  await expect(page.locator('.ant-drawer-content-wrapper')).toHaveCount(0);

  // 活動紀錄留一筆：改前改後選項與天數、重推導出的內部完成日、同步了哪些工單、未發出任何通知（同頁切 Tab，不算離頁）
  await page.getByRole('tab', { name: /活動紀錄/ }).click();
  const timeline = page.locator('.ant-timeline');
  await expect(timeline.getByText(/印件交期欄變更：PI-2026-0710/).first()).toBeVisible();
  await expect(
    timeline.getByText(/急件選項由「一般件」（0 個工作天）改為「三天急件（提前 3 個工作天）」（3 個工作天）/),
  ).toBeVisible();
  await expect(
    timeline.getByText(/印件內部完成日重算為「2026-09-09」、印件預計交期為「2026-09-10」/),
  ).toBeVisible();
  await expect(
    timeline.getByText(/已同步 WO-2026-0710 的印件內部完成日與印件預計交期/),
  ).toBeVisible();
  await expect(timeline.getByText(/本次變更未發出任何通知/)).toBeVisible();

  // 印務的通知鈴沒有新增這一筆通知
  await switchRole(page, '印務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.getByText(/急件選項改為/)).toHaveCount(0);
  await page.keyboard.press('Escape');

  // 工單列表：非終態工單 WO-2026-0710 的印件內部完成日同步為 2026-09-09、所屬印件旁出現紅色急件標籤。
  // 合併格式：有扣減時括號帶未扣值 2026-09-14
  await gotoInApp(page, '/work-orders');
  const woRow = page.locator('tr', { hasText: 'WO-2026-0710' });
  await expect(woRow.getByText('急件', { exact: true })).toBeVisible();
  await expect(woRow).toContainText('2026-09-09（未扣急件 2026-09-14）');

  // 工單詳情頁首同樣有急件標示（點工單編號連結進站內導頁）
  await woRow.locator('a', { hasText: 'WO-2026-0710' }).click();
  await expect(
    page
      .locator('h4', { hasText: 'WO-2026-0710' })
      .locator('..')
      .getByText(/急件・三天急件提前 3 個工作天/),
  ).toBeVisible();
});

test('4.7 新增印件收齊七項必填、未扣急件內部完成日選填且無預設值', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '新增印件' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('印件名稱')).toBeVisible();

  // 未扣急件內部完成日無預設值：訂單層已無交期可帶，開啟當下就是空白
  await expect(page.locator('#undeducted_internal_due_date')).toHaveValue('');

  // 七項必填任一為空擋下存檔：先只留難易度空白
  await page.getByLabel('印件名稱').fill('海報加印版');
  await modal.getByText('大貨印件', { exact: true }).click();
  await page.getByLabel('購買數量').fill('200');
  // 可見選項用 .ant-select-item-option class 篩選：role=option 那份是畫面外隱藏複本（README 執行注意事項）
  await page.locator('.ant-select:has(#unit)').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '張' })
    .click();
  await page.locator('#unit_price_untaxed').fill('15');
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '一般件' })
    .click();
  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  await expect(page.getByText('請輸入印件難易度（1-10）')).toBeVisible();
  await expect(modal).toBeVisible();

  // 補上難易度後可存檔
  await page.locator('#difficulty_level').fill('4');
  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  await expect(page.getByText(/已新增印件/)).toBeVisible();
  const newRow = page.locator('tr', { hasText: '海報加印版' });
  await expect(newRow).toBeVisible();
  // 未扣急件內部完成日留空時，推得的印件內部完成日與印件預計交期同為空：整列不出現任何日期
  await expect(newRow).not.toContainText(/\d{4}-\d{2}-\d{2}/);
});

test('4.8 複製加開印件購買數量與未扣急件內部完成日留空、規格側欄位帶入', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('複製原印件規格加開')).toBeVisible();

  // 規格側欄位自來源印件 PI-2026-0710 預填：名稱帶「（加開）」、難易度、單價
  await expect(page.locator('#name')).toHaveValue('品牌形象海報 A2（加開）');
  await expect(page.locator('#difficulty_level')).toHaveValue('3');
  // 購買數量與未扣急件內部完成日留空（購買數量必填、未扣急件內部完成日選填）
  await expect(page.locator('#ordered_qty')).toHaveValue('');
  await expect(page.locator('#undeducted_internal_due_date')).toHaveValue('');

  await page.getByLabel('購買數量').fill('800');
  await modal.getByRole('button', { name: '加開印件' }).click();
  await expect(
    page.getByText(/已加開印件「品牌形象海報 A2（加開）」（複製 PI-2026-0710 的規格）/),
  ).toBeVisible();

  const newRow = page.locator('tr', { hasText: '品牌形象海報 A2（加開）' });
  // 三個交期欄皆留空，顯示無值符號「－」
  await expect(newRow.locator('td', { hasText: '－' }).first()).toBeVisible();

  // 包裝備註（規格側欄位）自來源印件帶入，於印件詳情頁確認
  await newRow.getByRole('button', { name: '檢視印件' }).click();
  const packagingValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^包裝備註$/ })
    .locator('xpath=following-sibling::td[1]');
  await expect(packagingValue).toHaveText('每 100 張一疊');
});

test('4.9 印件已棄用後交期欄唯讀；訂單完成後印件交期欄唯讀', async ({ page }) => {
  // 一、印件已棄用後交期欄唯讀（訂單仍非終態）：鏈五 ORD-2026-0901／PI-2026-0901
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0901&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0901' });
  await row.getByRole('button', { name: '取消製作' }).click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: '取消製作' }).click();
  await expect(page.getByText(/已棄用印件「.*」/)).toBeVisible();

  await row.getByRole('button', { name: '編輯印件' }).click();
  const drawer = page.locator('.ant-drawer-content').last();
  await expect(drawer.locator('#undeducted_internal_due_date')).toBeDisabled();
  await expect(drawer.locator('#expected_delivery_date')).toBeDisabled();
  await drawer.getByRole('button', { name: '取消', exact: true }).click();

  // 二、訂單完成後印件交期欄唯讀：鏈一 ORD-2026-0601（訂單完成）／PI-2026-0601
  await gotoInApp(page, '/orders');
  await page.getByRole('textbox', { name: /請輸入訂單編號/ }).fill('ORD-2026-0601');
  await page.keyboard.press('Enter');
  await page.locator('a', { hasText: 'ORD-2026-0601' }).first().click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const row2 = page.locator('tr', { hasText: 'PI-2026-0601' });
  // 終態訂單沒有「編輯印件」入口，交期欄無從改起
  await expect(row2.getByRole('button', { name: '編輯印件' })).toHaveCount(0);
  await expect(async () => {
    await row2.getByRole('button', { name: '檢視印件' }).click();
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0601/, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  const dueDateValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^印件預計交期$/ })
    .locator('xpath=following-sibling::td[1]');
  await expect(dueDateValue).toHaveText('2026-06-22');
});

test('4.10 三條複製路徑仍帶入原值，與新增、加開的留空各走各的', async ({ page }) => {
  // 需求單複製建單：印件項目的未扣急件內部完成日原值帶入，不清空。
  // 起點取鏈一 Q-20260601-01（印件「會員卡（客製燙金）」未扣急件內部完成日 2026-06-18）。
  await openAs(page, '業務', '/quote-prototype');
  await page.getByRole('link', { name: 'Q-20260601-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  const sourceRow = page.locator('tr', { hasText: '會員卡（客製燙金）' });
  await expect(sourceRow).toContainText('2026-06-18');

  await page.getByRole('button', { name: '複製需求單' }).click();
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  // 新單的印件項目未扣急件內部完成日與來源相同，複製路徑不套用「新增、加開一律留空」那條規則
  const copiedRow = page.locator('tr', { hasText: '會員卡（客製燙金）' });
  await expect(copiedRow).toContainText('2026-06-18');

  // 對照：同一張新單上按「新增印件」，未扣急件內部完成日是空白的
  await page.getByRole('button', { name: '新增印件' }).click();
  const itemDrawer = page.locator('.ant-drawer-content').last();
  await expect(itemDrawer.locator('#undeducted_internal_due_date')).toHaveValue('');
  await itemDrawer.getByRole('button', { name: '取消', exact: true }).click();
});

test('4.11 客戶指定收件日改記在印件層，訂單資訊不再有這一欄', async ({ page }) => {
  // 起點資料：鏈八 ORD-2026-0920 旗下印件 PI-2026-0920（印件預計交期 2026-10-08、
  // 客戶指定收件日 2026-10-06）。期望值取自 openspec order-management § 客戶指定收件日
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0920');

  // 訂單資訊區與其編輯側板都不再有這一欄
  const infoPanel = page.locator('.ant-descriptions').filter({ hasText: '訂單編號' }).first();
  await expect(infoPanel.locator('.ant-descriptions-item-label', { hasText: '客戶指定收件日' })).toHaveCount(0);
  // AntD 會在兩個中文字的按鈕文字中間插空白，比對按鈕名用 cjkName
  await page.getByRole('button', { name: cjkName('編輯') }).first().click();
  const infoDrawer = page.locator('.ant-drawer-content').last();
  await expect(infoDrawer).toBeVisible();
  await expect(infoDrawer).not.toContainText('客戶指定收件日');
  await infoDrawer.getByRole('button', { name: cjkName('取消') }).first().click();

  // 三個衍生日期照舊唯讀呈現
  await expect(infoPanel).toContainText('訂單內部完成時間');
  await expect(infoPanel).toContainText('訂單預計交貨日期');
  await expect(infoPanel).toContainText('全部交完日');

  // 印件編輯側板有這一欄，帶現值 2026-10-06
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const row = page.locator('tr', { hasText: 'PI-2026-0920' }).first();
  await row.getByRole('button', { name: cjkName('編輯印件') }).first().click();
  const drawer = page.locator('.ant-drawer-content').last();
  await expect(drawer.locator('#customer_requested_delivery_date')).toHaveValue('2026-10-06');

  // 存檔：所填日期早於本印件的印件預計交期 2026-10-08，出黃色提醒、仍接受存檔
  await drawer.getByRole('button', { name: cjkName('確認') }).first().click();
  await expect(
    page.getByText('客戶指定收件日早於印件預計交期，請與客戶確認或改急件'),
  ).toBeVisible();
  await expect(page.locator('.ant-drawer-content')).toHaveCount(0);
});

test('4.14 唯讀呈現處的印件內部完成日合併未扣急件那一天', async ({ page }) => {
  // 起點資料：鏈四 PI-2026-0820（三天急件，未扣急件內部完成日 2026-09-09、印件內部完成日
  // 2026-09-04）與鏈二 PI-2026-0710（一般件，兩者同為 2026-09-14）。
  // 期望值取自公司 2026-09-18 對照表與 Miles 2026-09-21 拍板
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0820&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0820' }).first();
  await expect(row).toContainText('2026-09-04（未扣急件 2026-09-09）');

  // 清單不再另列一欄「未扣急件內部完成日」
  await expect(
    page.getByRole('tabpanel').locator('th', { hasText: '未扣急件內部完成日' }),
  ).toHaveCount(0);

  // 同一條規則套在工單列表：急件那張帶括號，一般件那張只有一組日期（同頁比對，不必看兩次）。
  // 以印務主管身分看列表才帶得出全部工單（負責印務身分只看得到自己負責的那幾張）
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers.filter({ hasText: '未扣急件內部完成日' })).toHaveCount(0);
  await expect(page.locator('tr', { hasText: 'WO-2026-0820' }).first()).toContainText(
    '2026-09-04（未扣急件 2026-09-09）',
  );
  // 一般件不帶括號：這一頁只有急件那一張工單出現「未扣急件」，其餘各列只印一組日期
  await expect(page.locator('.ant-table-tbody tr', { hasText: '未扣急件' })).toHaveCount(1);
});

test('4.15 訂單項目的欄名統一為印件屬性與稿件備註，急件提示用印件內部完成日的定義', async ({
  page,
}) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const panel = page.getByRole('tabpanel');

  // 訂單項目表：打樣／大貨那一欄叫「印件屬性」
  await expect(panel.locator('.ant-table-thead').first()).toContainText('印件屬性');
  await expect(panel.getByRole('columnheader', { name: '類型', exact: true })).toHaveCount(0);

  // 新增印件對話框：同一欄叫「印件屬性」；急件選項的提示是新定義
  await page.getByRole('button', { name: '新增印件' }).click();
  const addModal = page.locator('.ant-modal-content:visible').last();
  await expect(addModal.getByText('印件屬性', { exact: true })).toBeVisible();
  await expect(addModal.getByText('生產類型')).toHaveCount(0);
  // 對話框開啟時有縮放動畫，動畫中提示圖示只有幾個像素大，滑鼠停在那一點、動畫結束後就不在圖示上，
  // 提示不會出現。滑過與檢查一起重試，直到對話框就定位
  await expect(async () => {
    await addModal
      .locator('.ant-form-item-label', { hasText: '急件選項' })
      .locator('.anticon-info-circle')
      .first()
      .hover();
    await expect(page.locator('.ant-tooltip-inner:visible').last()).toContainText(
      '印件內部完成日＝未扣急件內部完成日減這個天數，以工作天計',
      { timeout: 1500 },
    );
  }).toPass({ intervals: [300, 600, 1000], timeout: 10000 });
  await addModal.getByRole('button', { name: /取\s*消/ }).click();
  await expect(addModal).toBeHidden();

  // 複製原印件規格加開：說明文字不再提預計出貨日
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const copyModal = page.locator('.ant-modal-content:visible').last();
  await expect(copyModal).toContainText('未扣急件內部完成日選填');
  await expect(copyModal).not.toContainText('預計出貨日');
  await copyModal.getByRole('button', { name: /取\s*消/ }).click();
  await expect(copyModal).toBeHidden();

  // 編輯印件側板：寫給審稿人員的那一欄叫「稿件備註」
  const row = panel.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  const drawer = page.locator('.ant-drawer-content-wrapper');
  await expect(drawer.getByLabel('稿件備註')).toBeVisible();
  await expect(drawer.getByText('印件檔案備註')).toHaveCount(0);
});
