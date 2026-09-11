import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';

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

  // 加開是另一條路徑而非唯一路徑：按下後訂單多一件新印件，帶入原規格；購買數量必填、訂單交期選填留空
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
  // 清單剛重繪時第一次點擊可能落在尚未接上事件的節點，重試到網址換掉為止
  await expect(async () => {
    await row2.getByRole('button', { name: '檢視印件' }).click();
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0601/, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  // 唯讀顯示：Descriptions 表格版式，標籤 <th> 後緊接值 <td>，兩者純文字、無任何輸入框
  const qtyValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^購買數量$/ })
    .locator('xpath=following-sibling::td[1]');
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

test('4.5 業務在印件上選急件選項，系統推出印件層預計交期（原編號 165）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();

  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  // 側板內即時預覽：預計交期＝本印件訂單交期 2026-09-15 − 1 天 − 3 天（急件凍結天數）＝ 2026-09-11
  // 該欄無 name（唯讀推導，非表單欄位），以所在 Form.Item 容器定位其內的 input
  const dueDatePreview = page.locator('.ant-form-item', { hasText: '預計交期' }).locator('input');
  await expect(dueDatePreview).toHaveValue('2026-09-11');

  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已更新印件，預計交期已重推導為「2026-09-11」/)).toBeVisible();

  // 清單的急件選項欄顯示紅標、預計交期欄同步顯示新值
  await expect(row.getByText('三天急件（提前 3 天）')).toBeVisible();
  await expect(row.getByText('2026-09-11')).toBeVisible();
});

test('4.6 改急件選項或印件訂單交期只留痕與同步，不通知（原編號 166）', async ({ page }) => {
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

  // 活動紀錄留一筆：改前改後選項與天數、重推導出的預計交期、同步了哪些工單、未發出任何通知（同頁切 Tab，不算離頁）
  await page.getByRole('tab', { name: /活動紀錄/ }).click();
  const timeline = page.locator('.ant-timeline');
  await expect(timeline.getByText(/印件預計交期重推導：PI-2026-0710/).first()).toBeVisible();
  await expect(timeline.getByText(/急件選項由「一般件」（0 天）改為「三天急件（提前 3 天）」/)).toBeVisible();
  await expect(timeline.getByText(/預計交期重推導為「2026-09-11」/)).toBeVisible();
  await expect(timeline.getByText(/已同步 WO-2026-0710 的預計交期/)).toBeVisible();
  await expect(timeline.getByText(/本次變更未發出任何通知/)).toBeVisible();

  // 印務的通知鈴沒有新增這一筆通知
  await switchRole(page, '印務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.getByText(/急件選項改為/)).toHaveCount(0);
  await page.keyboard.press('Escape');

  // 工單列表：非終態工單 WO-2026-0710 的交期同步為 2026-09-11、所屬印件旁出現紅色急件標籤
  await gotoInApp(page, '/work-orders');
  const woRow = page.locator('tr', { hasText: 'WO-2026-0710' });
  await expect(woRow.getByText('急件', { exact: true })).toBeVisible();
  await expect(woRow.getByText('2026-09-11')).toBeVisible();

  // 工單詳情頁首同樣有急件標示（點工單編號連結進站內導頁）
  await woRow.locator('a', { hasText: 'WO-2026-0710' }).click();
  await expect(
    page.locator('h4', { hasText: 'WO-2026-0710' }).locator('..').getByText(/急件・三天急件提前 3 天/),
  ).toBeVisible();
});

test('4.7 印件訂單交期各自獨立，訂單訂單交期編輯不觸發印件同步（原編號 167）', async ({ page }) => {
  // 起點：錨例訂單 ORD-2026-0803（製作等待中，訂單交期與旗下印件訂單交期皆為 2026-09-10）。
  // 直接開在「資訊」頁籤（訂單 id 即 order_no，見 orders/mock-data.js），
  // 避免先進「訂單項目」頁籤再切回「資訊」頁籤這個來回路徑（該頁籤切換走 router.replace 換網址，
  // 來回切換在本機開發伺服器上曾觀察到目標頁籤內容遲遲不掛載，一律單向前進頁籤更穩定）。
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0803&tab=info');

  // 業務把訂單單頭的訂單交期改為 2026-09-20。PanelBlock 標題列的編輯鈕未加 aria-label，
  // 其可及名稱是圖示文字＋label 的組合（如「edit 編輯」），與其他頁籤內帶 aria-label 的
  // 「編輯印件」等鈕用名稱互不相同但都含「編輯」子字串；改以「訂單資訊」標題所在的標題列
  // （最近一個含 button 子孫的祖先容器）定位，避開可及名稱組合方式的差異
  const infoHeading = page.getByRole('heading', { name: '訂單資訊', level: 5 });
  await infoHeading.locator('xpath=ancestor::div[.//button][1]').getByRole('button').first().click();
  const infoDrawer = page.locator('.ant-drawer-content').last();
  await infoDrawer.getByLabel('訂單交期').fill('2026-09-20');
  await infoDrawer.getByLabel('訂單交期').press('Enter');
  await infoDrawer.getByRole('button', { name: /確\s*認/ }).click();
  await expect(page.getByText('已更新訂單資訊')).toBeVisible();
  await expect(page.getByText('2026-09-20', { exact: true })).toBeVisible();

  // 訂單項目分頁（單向前進切換）：印件層 PI-2026-0801 的訂單交期與預計交期原樣不變，不隨訂單單頭同步
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0801' });
  await expect(itemRow.getByText('2026-09-10').first()).toBeVisible();
  await expect(itemRow.getByText('2026-09-20')).toHaveCount(0);
});

test('4.8 新增印件收齊七項必填、訂單交期選填並預設帶入訂單訂單交期', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '新增印件' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('印件名稱')).toBeVisible();

  // 訂單交期預設帶入所屬訂單的訂單交期（ORD-2026-0710 為 2026-09-15）
  await expect(page.locator('#order_due_date')).toHaveValue('2026-09-15');

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
  // 訂單交期沿用預設帶入的訂單訂單交期
  await expect(newRow.getByText('2026-09-15')).toBeVisible();
});

test('4.9 複製加開印件購買數量與訂單交期留空、規格側欄位帶入', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('複製原印件規格加開')).toBeVisible();

  // 規格側欄位自來源印件 PI-2026-0710 預填：名稱帶「（加開）」、難易度、單價
  await expect(page.locator('#name')).toHaveValue('品牌形象海報 A2（加開）');
  await expect(page.locator('#difficulty_level')).toHaveValue('3');
  // 購買數量與訂單交期留空（購買數量必填、訂單交期選填）
  await expect(page.locator('#ordered_qty')).toHaveValue('');
  await expect(page.locator('#order_due_date')).toHaveValue('');

  await page.getByLabel('購買數量').fill('800');
  await modal.getByRole('button', { name: '加開印件' }).click();
  await expect(
    page.getByText(/已加開印件「品牌形象海報 A2（加開）」（複製 PI-2026-0710 的規格）/),
  ).toBeVisible();

  const newRow = page.locator('tr', { hasText: '品牌形象海報 A2（加開）' });
  // 訂單交期留空顯示「—」
  await expect(newRow.locator('td', { hasText: '—' }).first()).toBeVisible();

  // 包裝備註（規格側欄位）自來源印件帶入，於印件詳情頁確認
  await newRow.getByRole('button', { name: '檢視印件' }).click();
  const packagingValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^包裝備註$/ })
    .locator('xpath=following-sibling::td[1]');
  await expect(packagingValue).toHaveText('每 100 張一疊');
});

test('4.10 印件已棄用後訂單交期唯讀；訂單完成後印件訂單交期唯讀', async ({ page }) => {
  // 一、印件已棄用後訂單交期唯讀（訂單仍非終態）：鏈五 ORD-2026-0901／PI-2026-0901
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0901&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0901' });
  await row.getByRole('button', { name: '取消製作' }).click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: '取消製作' }).click();
  await expect(page.getByText(/已棄用印件「.*」/)).toBeVisible();

  await row.getByRole('button', { name: '編輯印件' }).click();
  const drawer = page.locator('.ant-drawer-content').last();
  await expect(drawer.locator('#order_due_date')).toBeDisabled();
  await drawer.getByRole('button', { name: '取消', exact: true }).click();

  // 二、訂單完成後印件訂單交期唯讀：鏈一 ORD-2026-0601（訂單完成）／PI-2026-0601
  await gotoInApp(page, '/orders');
  await page.getByRole('textbox', { name: /請輸入訂單編號/ }).fill('ORD-2026-0601');
  await page.keyboard.press('Enter');
  await page.locator('a', { hasText: 'ORD-2026-0601' }).first().click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const row2 = page.locator('tr', { hasText: 'PI-2026-0601' });
  // 終態訂單沒有「編輯印件」入口，訂單交期無從改起
  await expect(row2.getByRole('button', { name: '編輯印件' })).toHaveCount(0);
  await expect(async () => {
    await row2.getByRole('button', { name: '檢視印件' }).click();
    await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0601/, { timeout: 3000 });
  }).toPass({ timeout: 20000 });
  const dueDateValue = page
    .locator('th.ant-descriptions-item-label')
    .filter({ hasText: /^訂單交期$/ })
    .locator('xpath=following-sibling::td[1]');
  await expect(dueDateValue).toHaveText('2026-06-20');
});

test('4.11 內部製作截止日與印件預計交期不設比對關係', async ({ page }) => {
  // 起點：鏈二 ORD-2026-0710（內部製作截止日 2026-09-10）／PI-2026-0710（訂單交期 2026-09-15、一般件、預計交期 2026-09-14）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await expect(row.getByText('2026-09-14')).toBeVisible();

  // 業務把該印件的訂單交期改遠到 2026-10-20（遠晚於訂單的內部製作截止日）
  await row.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('#order_due_date').fill('2026-10-20');
  await page.locator('#order_due_date').press('Enter');
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已更新印件，預計交期已重推導為「2026-10-19」/)).toBeVisible();
  await expect(row.getByText('2026-10-19')).toBeVisible();

  // 訂單資訊 Tab 的內部製作截止日原樣不變，系統不檢查、不阻擋、不提示兩者的落差
  await page.getByRole('tab', { name: /^資訊$/ }).click();
  await expect(page.getByText('2026-09-10', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/逾期|警示|衝突|不一致|超過內部製作截止日/)).toHaveCount(0);
});
