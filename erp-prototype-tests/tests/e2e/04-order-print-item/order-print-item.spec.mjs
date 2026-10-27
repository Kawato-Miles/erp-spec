import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, cjkName, clickIntoDetail } from '../_helpers.mjs';

// 情境目錄第四章：訂單成立與印件（印製狀態值、訂單類型、購買數量鎖定、討論串、急件）。
// 起點資料：七條主鏈訂單，鏈二 ORD-2026-0710（製作中）／PI-2026-0710、
// 鏈六 ORD-2026-0903（製作等待中，訂單管理人黃聖雯）、鏈四 ORD-2026-0820（急件、is_urgent 注記）。

test('4.1 訂單詳情的印件印製狀態只出現九個值（原編號 65）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const panel = page.getByRole('tabpanel');
  const row = panel.locator('tr', { hasText: 'PI-2026-0710' });
  // 這件印件只有一張工單、已開工，印製狀態為「製作中」，是九值之一
  await expect(row.getByText('製作中', { exact: true })).toBeVisible();
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
  // 跨三個角色、多次開頁，整章連跑時常超過預設 30 秒
  test.setTimeout(90_000);
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
  // 訂單項目分頁剛切過來時整張表會再重繪一次，先等這一列穩定再點，免得點在被換掉的節點上
  await expect(row2.getByRole('button', { name: '檢視印件' })).toBeVisible();
  await page.waitForTimeout(500);
  // 第一次點擊可能落在尚未接上事件的節點：還停在訂單頁才重點，判定用印件詳情頁標題（網址可能晚一步更新）
  const detailHeading = page.getByRole('heading', { name: /PI-2026-0601/ });
  await expect(async () => {
    // 只在還停在訂單頁時才點：印件詳情頁的基本資訊表也有含印件編號的 tr，以列數判斷會誤點而卡 30 秒
    if (!/print-items\/detail/.test(page.url())) {
      await row2.getByRole('button', { name: '檢視印件' }).click();
    }
    await expect(detailHeading).toBeVisible({ timeout: 8000 });
  }).toPass({ intervals: [1000, 2000, 4000], timeout: 40000 });
  // 唯讀顯示：購買數量表頭後緊接值的儲存格，純文字、無任何輸入框（依表頭角色與名稱定位，不依 CSS class）
  const qtyRow = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: '購買數量', exact: true }) });
  await expect(qtyRow.getByRole('cell').first()).toHaveText('5,000');
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

// 填 AntD DatePicker：填入 YYYY-MM-DD 文字後按 Enter 確認（不開日曆面板點格子）
async function pickDate(input, value) {
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

test('4.5 業務填印件預計交期，系統往前減 1 個工作天推出印件內部完成日；急件不改日期（原編號 165）', async ({ page }) => {
  // 起點資料：鏈二 PI-2026-0710（一般件，印件預計交期 2026-09-15、印件內部完成日 2026-09-14）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  const drawer = page.locator('.ant-drawer-content').last();
  // 印件內部完成日為唯讀推導、非表單欄位，以所在 Form.Item 容器定位其內的 input
  const dueDatePreview = drawer.locator('.ant-form-item', { hasText: '印件內部完成日' }).locator('input');
  await expect(dueDatePreview).toHaveValue('2026-09-14');

  // 手動改選三天急件：對話框提醒確認印件預計交期，兩個日期不變
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await expect(drawer.getByText('此印件為急件，請確認印件預計交期')).toBeVisible();
  await expect(dueDatePreview).toHaveValue('2026-09-14');
  await expect(drawer.locator('#expected_delivery_date')).toHaveValue('2026-09-15');

  // 改選延後型：不提醒
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/延後/).first().click();
  await expect(drawer.getByText('此印件為急件，請確認印件預計交期')).toHaveCount(0);

  // 改回三天急件後把印件預計交期改為 2026-09-21（一）：預覽跨週末推到 2026-09-18（五）
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await pickDate(drawer.locator('#expected_delivery_date'), '2026-09-21');
  await expect(dueDatePreview).toHaveValue('2026-09-18');

  // 提醒不擋存檔
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/印件內部完成日重算為「2026-09-18」/)).toBeVisible();

  // 清單：急件選項欄顯示紅標（凍結名稱與天數），兩個日期欄同步顯示新值
  await expect(row.getByText('三天急件（凍結天數 3）')).toBeVisible();
  await expect(row).toContainText('2026-09-18');
  await expect(row).toContainText('2026-09-21');
});

test('4.6 改印件預計交期重算並同步非終態工單、改急件選項只留痕，皆不通知（原編號 166）', async ({ page }) => {
  // 一、只改急件選項：PI-2026-0710 由一般件改三天急件，日期不重算、工單不同步
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已通知/)).toHaveCount(0);
  await expect(page.locator('.ant-drawer-content-wrapper')).toHaveCount(0);
  await expect(row).toContainText('2026-09-14');

  // 二、改印件預計交期為 2026-09-21（一）：內部完成日重算為 2026-09-18（五），同步非終態工單
  await row.getByRole('button', { name: '編輯印件' }).click();
  const drawer = page.locator('.ant-drawer-content').last();
  await pickDate(drawer.locator('#expected_delivery_date'), '2026-09-21');
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.locator('.ant-drawer-content-wrapper')).toHaveCount(0);

  // 活動紀錄：急件選項一筆（只留痕、不改日期），預計交期一筆（舊值、新值、重算、同步的工單），皆未發出通知
  await page.getByRole('tab', { name: /活動紀錄/ }).click();
  const timeline = page.locator('.ant-timeline');
  await expect(
    timeline.getByText(/急件選項由「一般件」改為「三天急件」（不改任何日期）/),
  ).toBeVisible();
  await expect(
    timeline.getByText(/印件預計交期由「2026-09-15」改為「2026-09-21」；印件內部完成日重算為「2026-09-18」/),
  ).toBeVisible();
  await expect(
    timeline.getByText(/已同步 WO-2026-0710 的印件內部完成日與印件預計交期/),
  ).toBeVisible();
  await expect(timeline.getByText(/本次變更未發出任何通知/).first()).toBeVisible();

  // 印務的通知鈴沒有新增這一筆通知
  await switchRole(page, '印務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.getByText(/急件選項改為/)).toHaveCount(0);
  await page.keyboard.press('Escape');

  // 工單列表：非終態工單 WO-2026-0710 的印件內部完成日同步為 2026-09-18、所屬印件旁出現紅色急件標籤
  await gotoInApp(page, '/work-orders');
  const woRow = page.locator('tr', { hasText: 'WO-2026-0710' });
  await expect(woRow.getByText('急件', { exact: true })).toBeVisible();
  await expect(woRow).toContainText('2026-09-18');
  await expect(woRow).not.toContainText('未扣急件');

  // 工單詳情頁首同樣有急件標示（只寫凍結名稱，不寫提前天數）
  await woRow.locator('a', { hasText: 'WO-2026-0710' }).click();
  await expect(
    page.locator('h4', { hasText: 'WO-2026-0710' }).locator('..').getByText('急件・三天急件', { exact: true }),
  ).toBeVisible({ timeout: 20_000 }); // 工單詳情路由首次編譯可能超過預設 5 秒
});

test('4.7 新增印件收齊七項必填、印件預計交期選填且無預設值', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '新增印件' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('印件名稱')).toBeVisible();

  // 印件預計交期無預設值：訂單層已無交期可帶，開啟當下就是空白
  await expect(modal.locator('#expected_delivery_date')).toHaveValue('');

  // 七項必填任一為空擋下存檔：先只留難易度空白
  await page.getByLabel('印件名稱').fill('海報加印版');
  await modal.getByText('大貨印件', { exact: true }).click();
  await page.getByLabel('購買數量').fill('200');
  // 可見選項用 .ant-select-item-option class 篩選：role=option 那份是畫面外隱藏複本（README 執行注意事項）
  await page.locator('.ant-select:has(#unit)').click();
  const unitDropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  // 單位選項 16 個、「張」排最後（4.16），下拉是虛擬捲動，先捲到底才渲染得出來
  await unitDropdown.locator('.rc-virtual-list-holder').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await unitDropdown.locator('.ant-select-item-option', { hasText: '張' }).click();
  await page.locator('#unit_price_untaxed').fill('15');
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '一般件' })
    .click();
  // 選一般件不提醒
  await expect(modal.getByText('此印件為急件，請確認印件預計交期')).toHaveCount(0);
  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  await expect(page.getByText('請輸入印件難易度（1-10）')).toBeVisible();
  await expect(modal).toBeVisible();

  // 補上難易度後可存檔
  await page.locator('#difficulty_level').fill('4');
  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  await expect(page.getByText(/已新增印件/)).toBeVisible();
  const newRow = page.locator('tr', { hasText: '海報加印版' });
  await expect(newRow).toBeVisible();
  // 印件預計交期留空時，推得的印件內部完成日同為空：整列不出現任何日期
  await expect(newRow).not.toContainText(/\d{4}-\d{2}-\d{2}/);
});

test('4.8 複製加開印件購買數量與印件預計交期留空、規格側欄位帶入', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('複製原印件規格加開')).toBeVisible();

  // 規格側欄位自來源印件 PI-2026-0710 預填：名稱帶「（加開）」、難易度、單價
  await expect(page.locator('#name')).toHaveValue('品牌形象海報 A2（加開）');
  await expect(page.locator('#difficulty_level')).toHaveValue('3');
  // 購買數量與印件預計交期留空（購買數量必填、印件預計交期選填）；急件選項系統帶入、不提醒
  await expect(page.locator('#ordered_qty')).toHaveValue('');
  await expect(modal.locator('#expected_delivery_date')).toHaveValue('');
  await expect(modal.getByText('此印件為急件，請確認印件預計交期')).toHaveCount(0);

  await page.getByLabel('購買數量').fill('800');
  await modal.getByRole('button', { name: '加開印件' }).click();
  await expect(
    page.getByText(/已加開印件「品牌形象海報 A2（加開）」（複製 PI-2026-0710 的規格）/),
  ).toBeVisible();

  const newRow = page.locator('tr', { hasText: '品牌形象海報 A2（加開）' });
  // 交期欄皆留空，顯示無值符號「－」
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
  await expect(drawer.locator('#expected_delivery_date')).toBeDisabled();
  await expect(drawer.locator('#urgent_option_id')).toBeDisabled();
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
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0601/i, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  const dueDateValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^印件預計交期$/ })
    .locator('xpath=following-sibling::td[1]');
  await expect(dueDateValue).toHaveText('2026-06-22');
});

test('4.10 三條複製路徑仍帶入原值，與新增、加開的留空各走各的', async ({ page }) => {
  // 需求單複製建單：印件項目的印件預計交期原值帶入，不清空。
  // 起點取鏈一 Q-20260601-01（印件「會員卡（客製燙金）」印件預計交期 2026-06-22）。
  await openAs(page, '業務', '/quote-prototype');
  await page.getByRole('link', { name: 'Q-20260601-01' }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  const sourceRow = page.locator('tr', { hasText: '會員卡（客製燙金）' });
  await expect(sourceRow).toContainText('2026-06-22');

  await page.getByRole('button', { name: '複製需求單' }).click();
  await page.locator('.ant-modal-content').getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });

  // 新單的印件項目印件預計交期與來源相同，複製路徑不套用「新增、加開一律留空」那條規則
  const copiedRow = page.locator('tr', { hasText: '會員卡（客製燙金）' });
  await expect(copiedRow).toContainText('2026-06-22');

  // 對照：同一張新單上按「新增印件」，印件預計交期是空白的
  await page.getByRole('button', { name: '新增印件' }).click();
  const itemDrawer = page.locator('.ant-drawer-content').last();
  await expect(itemDrawer.locator('#expected_delivery_date')).toHaveValue('');
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

  // 改填客戶指定收件日 2026-10-05：早於本印件的印件預計交期 2026-10-08，存檔當下出黃色提醒、仍接受存檔。
  // 提醒只請業務確認或調整印件預計交期，不再建議改急件（急件不改任何日期）
  await pickDate(drawer.locator('#customer_requested_delivery_date'), '2026-10-05');
  await drawer.getByRole('button', { name: cjkName('確認') }).first().click();
  await expect(
    page.getByText('客戶指定收件日早於印件預計交期，請與客戶確認或調整印件預計交期'),
  ).toBeVisible();
  await expect(page.getByText(/或改急件/)).toHaveCount(0);
  await expect(page.locator('.ant-drawer-content')).toHaveCount(0);
});

test('4.14 唯讀呈現處的印件內部完成日只印一組日期，急件不改日期', async ({ page }) => {
  // 起點資料：鏈四 PI-2026-0820（三天急件，印件預計交期 2026-09-07、印件內部完成日 2026-09-04）
  // 與鏈二 PI-2026-0710（一般件，印件預計交期 2026-09-15、印件內部完成日 2026-09-14）。
  // 期望值取自 order-management spec § 印件內部完成日推導（急件新定義 2026-10-27）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0820&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0820' }).first();
  await expect(row).toContainText('2026-09-04');
  await expect(row).not.toContainText('未扣急件');

  // 清單沒有「未扣急件內部完成日」欄
  await expect(
    page.getByRole('tabpanel').locator('th', { hasText: '未扣急件內部完成日' }),
  ).toHaveCount(0);

  // 工單列表同一條規則：急件與一般件都只印一組日期。
  // 以印務主管身分看列表才帶得出全部工單（負責印務身分只看得到自己負責的那幾張）
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders');
  const headers = page.locator('.ant-table-thead th');
  await expect(headers.filter({ hasText: '未扣急件內部完成日' })).toHaveCount(0);
  const search = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await search.fill('WO-2026-0820');
  await search.press('Enter');
  const urgentRow = page.locator('tr', { hasText: 'WO-2026-0820' }).first();
  await expect(urgentRow).toContainText('2026-09-04');
  await expect(urgentRow).not.toContainText('未扣急件');
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  const normalRow = page.locator('.ant-table-tbody tr', { hasText: 'WO-2026-0710' }).first();
  await expect(normalRow).toContainText('2026-09-14');
  await expect(normalRow).not.toContainText('未扣急件');
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
      '急件只做標注、不改任何日期',
      { timeout: 1500 },
    );
  }).toPass({ intervals: [300, 600, 1000], timeout: 10000 });
  await addModal.getByRole('button', { name: /取\s*消/ }).click();
  await expect(addModal).toBeHidden();

  // 複製原印件規格加開：說明文字不再提預計出貨日
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const copyModal = page.locator('.ant-modal-content:visible').last();
  await expect(copyModal).toContainText('印件預計交期選填');
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

// 15.17 印件準時完工率的判定（2026-10-23 新增，change shipment-print-download-center H9、H10）：
// 印件新增唯讀欄位「完工日」＝旗下工單首次全部完成（齊套）那一天，系統寫入、之後不變；判定與指標算式在純函式測試
//（tests/unit/delivery-chain/print-item-completion-date.test.mjs），畫面只驗印件詳情有完工日欄。
// 起點資料：鏈一 PI-2026-0601 已齊套、有完工日（MOCK-DATA-CHAIN 補值）；鏈二 PI-2026-0710 部分工單製作中、尚未齊套。
test('15.17 印件準時完工率的判定：印件詳情顯示完工日，已齊套的印件有日期、未齊套的顯示破折號', async ({ page }) => {
  test.setTimeout(90_000);
  const completionValue = (p) =>
    p.locator('xpath=//th[normalize-space(.)="完工日"]/following-sibling::td[1]').first();

  await openAs(page, '業務', '/print-items/detail?id=PI-2026-0601');
  await expect(page.getByText('印件基本資訊')).toBeVisible({ timeout: 20000 });
  await expect(page.getByText('完工日', { exact: true }).first()).toBeVisible();
  await expect(completionValue(page)).toHaveText(/^\d{4}-\d{2}-\d{2}$/);

  await openAs(page, '業務', '/print-items/detail?id=PI-2026-0710');
  await expect(page.getByText('印件基本資訊')).toBeVisible({ timeout: 20000 });
  await expect(completionValue(page)).toHaveText('－');
});

// 4.24 訂單詳情的訂單急件標注與印件列標注（OpenSpec change rush-order-definition，order-management spec
// § 訂單急件標注、§ 訂單詳情印件列的急件標注）：凍結天數大於 0 才標；延後型與一般件不標；
// 訂單標注取旗下任一有效印件，急件印件棄用後訂單不再標注。
test('4.24 訂單詳情帶訂單急件標注；延後型不標；急件印件棄用後標注消失', async ({ page }) => {
  // 鏈四 ORD-2026-0820（PI-2026-0820 三天急件）：訂單與印件列都標
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0820&tab=printItems');
  const header = page.locator('h4', { hasText: 'ORD-2026-0820' }).locator('..');
  await expect(header.getByText('急件', { exact: true })).toBeVisible();
  const row = page.locator('tr', { hasText: 'PI-2026-0820' }).first();
  await expect(row.getByText('三天急件（凍結天數 3）')).toBeVisible();

  // 延後型 ORD-2026-0913（PI-2026-0913 延後三天）：訂單不標
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0913&tab=printItems');
  const delayHeader = page.locator('h4', { hasText: 'ORD-2026-0913' }).locator('..');
  await expect(delayHeader).toBeVisible();
  await expect(delayHeader.getByText('急件', { exact: true })).toHaveCount(0);

  // 鏈四的急件印件取消製作（印製維度轉已棄用）後，訂單不再標注
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0820&tab=printItems');
  await page
    .locator('tr', { hasText: 'PI-2026-0820' })
    .first()
    .getByRole('button', { name: '取消製作' })
    .click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: '取消製作' }).click();
  await expect(page.getByText(/已棄用印件「.*」/)).toBeVisible();
  await expect(
    page.locator('h4', { hasText: 'ORD-2026-0820' }).locator('..').getByText('急件', { exact: true }),
  ).toHaveCount(0);
});
