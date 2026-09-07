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

  // 加開是另一條路徑而非唯一路徑：按下後訂單多一件新印件，帶入原規格，數量與交期要重填
  await page.getByRole('button', { name: '複製原印件規格加開' }).click();
  const copyModal = page.locator('.ant-modal-content');
  await expect(copyModal.getByText('複製原印件規格加開')).toBeVisible();
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

test('4.5 業務在印件上選急件選項，系統推出扣除急件後的交期（原編號 165）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();

  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  // 側板內即時預覽：訂單交期（扣除急件）＝客戶交期 2026-09-15 − 3 天 = 2026-09-12
  // 該欄無 name（唯讀推導，非表單欄位），以所在 Form.Item 容器定位其內的 input
  const dueDatePreview = page
    .locator('.ant-form-item', { hasText: '訂單交期（扣除急件）' })
    .locator('input');
  await expect(dueDatePreview).toHaveValue('2026-09-12');

  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已更新印件，急件選項已改為「三天急件（提前 3 天）」/)).toBeVisible();

  // 清單的急件選項欄顯示紅標
  await expect(row.getByText('三天急件（提前 3 天）')).toBeVisible();
});

test('4.6 改急件要通知排單的印務，工單交期跟著改（原編號 166）', async ({ page }) => {
  // 前置：與 4.5 同一動作，改 PI-2026-0710 為三天急件（本測試獨立於 4.5 重跑一次）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=printItems');
  const row = page.locator('tr', { hasText: 'PI-2026-0710' });
  await row.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.getByText(/已通知 周建宏/)).toBeVisible();
  await expect(page.locator('.ant-drawer-content-wrapper')).toHaveCount(0);

  // 活動紀錄留一筆：改前改後選項與天數、推導出的交期、通知對象（同頁切 Tab，不算離頁）
  await page.getByRole('tab', { name: /活動紀錄/ }).click();
  const timeline = page.locator('.ant-timeline');
  await expect(timeline.getByText(/印件急件選項變更通知：PI-2026-0710/).first()).toBeVisible();
  await expect(timeline.getByText(/由「一般件」（0 天）改為「三天急件（提前 3 天）」（3 天）/)).toBeVisible();
  await expect(timeline.getByText(/訂單交期（扣除急件）2026-09-12/)).toBeVisible();
  await expect(timeline.getByText(/已通知 周建宏/)).toBeVisible();

  // 印務的通知鈴出現該筆通知
  await switchRole(page, '印務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.getByText(/急件選項改為「三天急件（提前 3 天）」/)).toBeVisible();
  await page.keyboard.press('Escape');

  // 工單列表：交期改為 2026-09-12、所屬印件旁出現紅色急件標籤
  await gotoInApp(page, '/work-orders');
  const woRow = page.locator('tr', { hasText: 'WO-2026-0710' });
  await expect(woRow.getByText('急件', { exact: true })).toBeVisible();
  await expect(woRow.getByText('2026-09-12')).toBeVisible();

  // 工單詳情頁首同樣有急件標示（點工單編號連結進站內導頁）
  await woRow.locator('a', { hasText: 'WO-2026-0710' }).click();
  await expect(
    page.locator('h4', { hasText: 'WO-2026-0710' }).locator('..').getByText(/急件・三天急件提前 3 天/),
  ).toBeVisible();
});

test('4.7 訂單的「是否急件」只是注記，不參與交期計算（原編號 167）', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0820&tab=info');
  await page.getByText('是否急件').first().hover();
  await expect(page.getByRole('tooltip')).toContainText('不參與交期計算');

  // 訂單列表：ORD-2026-0820 這一列沒有急件標籤（站內導頁）
  await gotoInApp(page, '/orders');
  const orderRow = page.locator('tr', { hasText: 'ORD-2026-0820' });
  await expect(orderRow.getByText('急件', { exact: true })).toHaveCount(0);

  // 訂單項目分頁：印件層 PI-2026-0820 帶紅色急件標籤（點訂單編號連結回到同一張訂單、切訂單項目 Tab）
  await orderRow.locator('a', { hasText: 'ORD-2026-0820' }).click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0820' });
  await expect(itemRow.getByText(/三天急件/)).toBeVisible();
});
