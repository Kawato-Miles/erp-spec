import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, cjkName } from '../_helpers.mjs';

// 情境目錄 4.18～4.20：訂單成立前刪除印件。
// 起點資料：鏈外 ORD-2026-0814（草稿；名片 651、DM 9,900、貼紙 1,750，運費 200，
// 未稅總額 12,501、稅額 625、應收總額 13,126）；對照組鏈二 ORD-2026-0710（製作中，已成立）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 order-management
// 規格差異檔 § 訂單成立前刪除印件。依據 wiki [[訂單印件規格維護]]、[[明細時點分界]]。
// 畫面約定（tasks 4.2 實作依此）：印件列操作欄有一顆「刪除印件」圖示鈕，按下出確認對話框。
// 線上單等待付款與諮詢的可刪判定以純函式驗（tests/unit/orders/review-gate-and-print-item-delete.test.mjs）。

const ORDER_NO = 'ORD-2026-0814';

const dialog = (page) => page.locator('.ant-modal-content:visible').last();
const drawer = (page) => page.locator('.ant-drawer-content:visible').last();
const itemRow = (page, text) => page.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();
const openTab = (page, label) => page.locator('.ant-tabs-tab', { hasText: label }).first().click();
const activePane = (page) => page.locator('.ant-tabs-tabpane-active');
const toast = (page, text) => page.locator('.ant-message-notice-content').filter({ hasText: text }).last();

async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
  await expect(page.locator('.ant-drawer-mask:visible')).toHaveCount(0);
}

async function deleteItem(page, name) {
  await openTab(page, '訂單項目');
  const row = itemRow(page, name);
  await expect(async () => {
    await row.getByRole('button', { name: '刪除印件' }).click();
    await expect(dialog(page)).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20_000 });
  await dialog(page).getByRole('button', { name: /刪\s*除|確\s*認/ }).last().click();
  await waitModalsClosed(page);
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: name })).toHaveCount(0);
}

async function pickDate(input, value) {
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

async function addInstallment(page, description, amount) {
  await openTab(page, '金額與發票');
  await page.getByRole('button', { name: cjkName('新增收款項目') }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await modal.getByLabel('描述').fill(description);
  await modal.getByLabel('預計金額（含稅）').fill(String(amount));
  await modal.getByLabel('預計收款方式').click();
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: '銀行轉帳' })
    .first()
    .click();
  await pickDate(modal.getByLabel('預計收款日'), '2026-10-30');
  await modal.getByRole('button', { name: cjkName('建立期次') }).click();
  await expect(toast(page, `已新增收款項目「${description}」`)).toBeVisible();
  await waitModalsClosed(page);
}

test('4.18 訂單成立前刪除印件，金額當下重算、活動紀錄留一筆', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', `/orders/detail?id=${ORDER_NO}&tab=printItems`);
  await expect(itemRow(page, '貼紙')).toBeVisible();

  await deleteItem(page, '貼紙');

  // 印件清單只剩名片與 DM
  await expect(itemRow(page, '名片')).toBeVisible();
  await expect(itemRow(page, 'DM')).toBeVisible();

  // 金額當下重算：12,501 − 1,750 ＝ 10,751；稅額 538；應收總額 11,289
  await openTab(page, '金額與發票');
  const pane = activePane(page);
  await expect(pane).toContainText('NT$ 10,751');
  await expect(pane).toContainText('NT$ 538');
  await expect(pane).toContainText('NT$ 11,289');

  // 活動紀錄新增一筆「刪除印件 貼紙」，記操作的業務
  await openTab(page, '活動紀錄');
  const record = page.locator('.ant-timeline-item').filter({ hasText: '刪除印件 貼紙' });
  await expect(record).toHaveCount(1);
  await expect(record).toContainText('洪嘉駿');
});

test('4.19 可刪到零件、差額提示不擋刪除、出貨單草稿自動移除該列', async ({ page }) => {
  test.setTimeout(240_000);
  await openAs(page, '業務', `/orders/detail?id=${ORDER_NO}`);

  // 前置：新增兩期收款項目 3,938 與 9,188（合計 13,126）
  await addInstallment(page, '訂金', 3938);
  await addInstallment(page, '尾款', 9188);
  await expect(page.getByRole('alert').filter({ hasText: '收款項目合計與應收總額不一致' })).toHaveCount(0);

  // 前置：在出貨單頁籤存一張出貨單草稿，預計出貨印件含名片與貼紙（移除預設帶入的 DM）
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await page.getByRole('button', { name: '建立出貨單草稿' }).click();
  const panel = drawer(page);
  await expect(panel).toBeVisible();
  await panel.getByRole('tab', { name: /出貨明細/ }).click();
  await panel.getByRole('row', { name: /PI-2026-0842/ }).getByRole('button', { name: '自本張出貨單移除' }).click();
  await expect(panel.getByRole('row', { name: /PI-2026-0842/ })).toHaveCount(0);
  await panel.getByRole('tab', { name: '基本資訊' }).click();
  await pickDate(panel.locator('#planned_ship_date'), '2026-10-30');
  await panel.getByRole('button', { name: '儲存草稿' }).click();
  await expect(page.getByText(/出貨單草稿已建立/).first()).toBeVisible();
  await waitModalsClosed(page);
  const draftRow = activePane(page).locator('tbody tr.ant-table-row').filter({ hasText: '草稿' }).first();
  await expect(draftRow).toContainText('名片');
  await expect(draftRow).toContainText('貼紙');

  // 刪貼紙：應收總額 11,289，收款項目區出現差額提示，刪除照樣成立
  await deleteItem(page, '貼紙');
  await openTab(page, '金額與發票');
  await expect(activePane(page)).toContainText('NT$ 11,289');
  await expect(page.getByRole('alert').filter({ hasText: '收款項目合計與應收總額不一致' })).toBeVisible();

  // 出貨單草稿的預計出貨印件只剩名片，草稿維持草稿
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  const draftAfter = activePane(page).locator('tbody tr.ant-table-row').filter({ hasText: '名片' }).first();
  await expect(draftAfter).toContainText('草稿');
  await expect(draftAfter).not.toContainText('貼紙');

  // 名片與 DM 也刪得掉，印件清單為空，系統不以「至少一件印件」擋下
  await deleteItem(page, '名片');
  await deleteItem(page, 'DM');
  await openTab(page, '訂單項目');
  for (const name of ['名片', 'DM', '貼紙']) {
    await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: name })).toHaveCount(0);
  }
});

test('4.20 成立後、線上單等待付款、印務主管都看不到刪除操作', async ({ page }) => {
  test.setTimeout(150_000);
  // 印務主管打開草稿單 ORD-2026-0814 的訂單項目：看不到刪除
  await openAs(page, '印務主管', `/orders/detail?id=${ORDER_NO}&tab=printItems`);
  await expect(itemRow(page, '名片')).toBeVisible();
  await expect(page.getByRole('button', { name: '刪除印件' })).toHaveCount(0);

  // 對照：同一張草稿單由接單業務打開時看得到刪除
  await switchRole(page, '業務');
  await expect(itemRow(page, '名片').getByRole('button', { name: '刪除印件' })).toHaveCount(1);

  // 已成立的 ORD-2026-0710（製作中）：印件列沒有刪除，「取消製作」（轉已棄用）照樣可用
  await gotoInApp(page, '/orders');
  const search = page.getByPlaceholder(/請輸入訂單編號/).first();
  await search.fill('ORD-2026-0710');
  await search.press('Enter');
  await expect(async () => {
    await page.getByText('ORD-2026-0710', { exact: true }).first().click();
    await expect(page.locator('.ant-tabs-tab', { hasText: '訂單項目' }).first()).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 30_000 });
  await openTab(page, '訂單項目');
  const row = itemRow(page, 'PI-2026-0710');
  await expect(row).toBeVisible();
  await expect(row.getByRole('button', { name: '刪除印件' })).toHaveCount(0);
  await expect(row.getByRole('button', { name: '取消製作' })).toHaveCount(1);
});
