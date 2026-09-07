import { expect } from '@playwright/test';

// 第五章共用前置：在鏈六 ORD-2026-0903（訂單管理人黃聖雯）的訂單項目分頁按「新增印件」
// 造一件測試用印件。呼叫端須已完成 openAs 並站在 /orders/detail?id=ORD-2026-0903&tab=printItems，
// 本函式不含 openAs／page.goto（同一情境內只允許第一步整頁載入）。
//
// 新增印件 Dialog 欄位（依 orders/_components/detail/ItemsTab.js「新增印件 Dialog」）：
// 印件名稱（必填）、類型（打樣印件／大貨印件）、免審稿（Switch，預設關）、
// 急件選項（必填，預設不選）、備註（選填）。
export async function addPendingReviewItem(
  page,
  { name, type = '大貨印件', skipReview = false, urgentOption = '一般件' } = {},
) {
  await page.getByRole('button', { name: '新增印件' }).click();
  const modal = page.locator('.ant-modal-content');
  await expect(modal.getByText('印件名稱')).toBeVisible();

  await page.getByLabel('印件名稱').fill(name);
  await modal.getByText(type, { exact: true }).click();
  if (skipReview) {
    await modal.locator('.ant-switch').click();
  }
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(urgentOption, { exact: true }).click();

  await modal.getByRole('button', { name: '新增印件', exact: true }).click();
  // Modal 的確認鈕文字與頁首觸發鈕同為「新增印件」：等對話框關閉再回傳，避免連續呼叫兩次時
  // 舊 Modal 尚未關閉、新舊兩顆「新增印件」同時存在造成後續定位歧義
  await expect(page.locator('.ant-modal-content')).toHaveCount(0);
}
