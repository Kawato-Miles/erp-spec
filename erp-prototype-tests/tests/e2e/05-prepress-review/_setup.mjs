import { expect } from '@playwright/test';
import { switchRole, gotoInApp, clickIntoDetail, cjkName } from '../_helpers.mjs';

// 第五章共用前置：在鏈六 ORD-2026-0903（訂單管理人黃聖雯）的訂單項目分頁按「新增印件」
// 造一件測試用印件。呼叫端須已完成 openAs 並站在 /orders/detail?id=ORD-2026-0903&tab=printItems，
// 本函式不含 openAs／page.goto（同一情境內只允許第一步整頁載入）。
//
// 新增印件 Dialog 欄位（依 orders/_components/detail/ItemsTab.js「新增印件 Dialog」，
// order-management spec § 新增印件欄位與必填檢核）：七項必填——印件名稱、生產類型
// （打樣印件／大貨印件）、購買數量、單位、單價、急件選項、難易度；免審稿（Switch，預設關）
// 與訂單交期等八項選填。本函式對七項必填一律帶預設值，呼叫端只需關心該情境要驗的那個欄位。
export async function addPendingReviewItem(
  page,
  {
    name,
    type = '大貨印件',
    skipReview = false,
    urgentOption = '一般件',
    orderedQty = 100,
    unit = '張',
    unitPrice = 10,
    difficulty = 3,
  } = {},
) {
  await page.getByRole('button', { name: '新增印件' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('印件名稱')).toBeVisible();

  await page.getByLabel('印件名稱').fill(name);
  await modal.getByText(type, { exact: true }).click();
  await page.getByLabel('購買數量').fill(String(orderedQty));
  // 可見選項用 .ant-select-item-option class 篩選：role=option 那份是畫面外隱藏複本（README 執行注意事項）
  await page.locator('.ant-select:has(#unit)').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: unit })
    .click();
  await page.locator('#unit_price_untaxed').fill(String(unitPrice));
  if (skipReview) {
    await modal.locator('.ant-switch').click();
  }
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: urgentOption })
    .click();
  await page.locator('#difficulty_level').fill(String(difficulty));

  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  // Modal 的確認鈕文字與頁首觸發鈕同為「新增印件」：等對話框關閉再回傳，避免連續呼叫兩次時
  // 舊 Modal 尚未關閉、新舊兩顆「新增印件」同時存在造成後續定位歧義
  await expect(page.locator('.ant-modal-content')).toHaveCount(0);
}

// 目前開著的對話框（Modal 或 PanelDialog，取最後一個避免命中已關閉但尚未卸載的殘影）
const dlg = (page) => page.locator('.ant-modal-content, [role="dialog"]').last();

// 在已開啟的 AntD Select 下拉挑一個可見選項：role=option 那份是畫面外隱藏複本，可見選項要用
// .ant-select-item-option（README 執行注意事項）；同一個文字兩處都在時 getByText 會撞成 strict
// mode violation，故一律鎖定這個 class。
const pickVisibleOption = async (page, label) => {
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option', { hasText: label })
    .click();
};

// 5.10／5.11 共用前置：現行 mock 沒有打樣印件，本函式在鏈六訂單（ORD-2026-0903）自建一件、
// 免審稿直接合格，一路推進到印製狀態「已送達」（樣品已送達客戶，SampleResultAction 的前提）。
// 短出結案是系統既有動作、不是本函式要驗的行為，這裡只是借它把印件快速推到「已送達」這個前提。
// 呼叫端須已完成 openAs 業務並站在 /orders/detail?id=ORD-2026-0903&tab=printItems。
export async function buildDeliveredSampleItem(page, name) {
  await addPendingReviewItem(page, { name, type: '打樣印件', skipReview: true });
  const orderRow = page.locator('tr', { hasText: name });
  await orderRow.getByRole('button', { name: '確認可製作' }).click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: /確\s*定|確\s*認/ })
    .click();
  await expect(orderRow.getByText('已確認可製作', { exact: true })).toBeVisible();

  // 訂單管理人確認製作細節，系統建立草稿工單
  await switchRole(page, '訂單管理人');
  await gotoInApp(page, '/orders/production-detail-queue');
  await page
    .locator('tbody tr.ant-table-row')
    .filter({ hasText: name })
    .getByLabel('確認製作細節')
    .click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: cjkName('確認製作細節') })
    .click();
  const createToast = page.locator('.ant-message-notice-content').last();
  await expect(createToast).toContainText(/WO-\d{4}-\d{4}/, { timeout: 15000 });
  const woNo = (await createToast.innerText()).match(/WO-\d{4}-\d{4}/)[0];

  // 印務主管把草稿工單分派給印務（審核主管預帶當前登入的印務主管，不必另選）
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/print-items/pending-assign');
  await page
    .locator('tbody tr.ant-table-row')
    .filter({ hasText: name })
    .getByLabel('工單分派')
    .click();
  const assignDialog = dlg(page);
  await assignDialog.locator('.ant-select').nth(1).click();
  await pickVisibleOption(page, '周建宏');
  await assignDialog.getByRole('button', { name: cjkName('送出') }).click();
  await expect(page.locator('.ant-modal-content:visible, [role="dialog"]:visible')).toHaveCount(0);

  // 印務製程規劃：新增一筆材料任務（不需轉交，省去後續轉交點收步驟），送審
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await clickIntoDetail(page, woNo, /work-orders\/detail/);
  await page.locator('.ant-tabs-tab', { hasText: '製程規劃' }).click();
  await page.getByRole('button', { name: cjkName('新增生產任務') }).click();
  const picker = dlg(page);
  await expect(picker).toContainText('選擇 BOM');
  await picker.getByPlaceholder('搜尋材料名稱').fill('雪銅紙');
  await picker.getByPlaceholder('搜尋材料名稱').press('Enter');
  await picker.locator('tbody tr.ant-table-row').first().click();
  await picker.getByRole('button', { name: cjkName('帶入') }).click();

  const form = dlg(page);
  await form.getByPlaceholder('例：書冊內頁').fill('打樣備料');
  await form.locator('button[role="switch"]').first().click(); // 需轉交關閉：做完即放行、不建轉交單
  await form.locator('.ant-tabs-tab', { hasText: '數量與放損' }).click();
  const qtyPane = form.locator('.ant-tabs-tabpane-active');
  // 提交審核要求至少一筆任務計入完成度：只有一筆任務時這筆就得是那一筆，打開「計入完成度」
  // 後多出「每份工單需生產數量」為第一個數字欄，預計生產退到第二個
  await qtyPane.locator('button[role="switch"]').first().click();
  await qtyPane.locator('.ant-input-number-input').nth(0).fill('1');
  await qtyPane.locator('.ant-input-number-input').nth(1).fill('10');
  await form.getByRole('button', { name: cjkName('新增任務') }).click();
  await expect(page.locator('.ant-modal-content:visible, [role="dialog"]:visible')).toHaveCount(0);

  await page.getByRole('button', { name: cjkName('提交審核') }).click();
  await expect(page.locator('body')).toContainText('已提交印務主管審核');

  // 印務主管核可製程
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders/review-queue');
  await page
    .locator('tbody tr.ant-table-row')
    .filter({ hasText: woNo })
    .getByLabel('審核通過')
    .click();
  await dlg(page).getByRole('button', { name: cjkName('核可') }).click();
  await expect(page.locator('body')).toContainText('製程已核可');

  // 印務把這筆任務交付產線
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await clickIntoDetail(page, woNo, /work-orders\/detail/);
  await page.locator('.ant-tabs-tab', { hasText: '製程規劃' }).click();
  await page.locator('thead input[type="checkbox"]').first().check();
  await page.getByRole('button', { name: /交付產線（1）/ }).click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: cjkName('交付產線') })
    .click();
  await expect(page.locator('body')).toContainText('進生管待派清單');

  // 生管接收工作並派工給師傅劉阿海
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/dispatch');
  await page
    .locator('tbody tr.ant-table-row')
    .filter({ hasText: woNo })
    .locator('input[type="checkbox"]')
    .check({ force: true });
  await page.getByRole('button', { name: /接收工作（1）/ }).click();
  await expect(page.getByText(/已接收工作 1 筆生產任務/)).toBeVisible();
  await page.getByRole('button', { name: /派工（1）/ }).click();
  const dispatchDialog = dlg(page);
  await dispatchDialog
    .locator('.ant-form-item', { hasText: '指派師傅' })
    .locator('.ant-select')
    .click();
  await pickVisibleOption(page, '劉阿海');
  await dispatchDialog.getByRole('button', { name: cjkName('確認派工') }).click();
  const wpToast = page.locator('.ant-message-notice-content').last();
  await expect(wpToast).toContainText(/已建立工作包/, { timeout: 15000 });
  const packageNo = (await wpToast.innerText()).match(/WP-[\w-]+/)[0];

  // 師傅報工：首次報工把印件印製狀態自動推到「製作中」（單一工單，全數進入製作中）
  await switchRole(page, '師傅');
  await gotoInApp(page, '/production-floor/work-packages');
  await page.locator('.ant-table-row', { hasText: packageNo }).getByRole('button', { name: '報工' }).click();
  const reportBox = page.locator('.ant-modal-body').last();
  const taskRow = reportBox.locator('tbody tr').filter({ hasText: woNo }).first();
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('10');
  await inputs.nth(1).fill('10');
  await page.getByRole('button', { name: cjkName('送出報工') }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 印務短出結案：把印製狀態一次收到「已送達」（短出結案本身非本節要驗的行為，純粹用來把
  // 印件推到「樣品已送達客戶」這個前提，且此舉不影響待驗的打樣結果欄位）
  await switchRole(page, '印務');
  await gotoInApp(page, '/print-items');
  await clickIntoDetail(page, name, /print-items\/detail/);
  await page.getByRole('button', { name: '短出結案' }).click();
  await dlg(page).getByRole('button', { name: cjkName('確認結案') }).click();
  await expect(page.getByText(/印製狀態轉「已送達」/).last()).toBeVisible();
}
