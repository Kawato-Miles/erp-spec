import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { activityItem, button, drawer, openByNo, openScenario, openTab } from './_local.mjs';

test('2.7 三類備註各自獨立編輯，訂單完成後仍可改（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(90_000);
  // 鏈一 ORD-2026-0601（訂單完成）：交貨備註原有內容，訂單須知與付款備註原為空
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0601');
  await openTab(page, '資訊');
  await expect(page.locator('body')).toContainText('專車配送至誠品信義店收貨處');

  await button(page, '編輯').click();
  const panel = drawer(page);
  await expect(panel).toContainText('訂單須知');
  await expect(panel).toContainText('交貨備註');
  await expect(panel).toContainText('付款備註');

  // 只改交貨備註一欄
  const deliveryField = panel.locator('textarea').nth(1);
  await deliveryField.fill('2.7 交貨備註改版：專車配送並事先電話確認');
  await button(panel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();

  // 動其中一欄不影響其餘兩欄：訂單須知與付款備註仍為空
  await expect(page.locator('body')).toContainText('2.7 交貨備註改版：專車配送並事先電話確認');
  await button(page, '編輯').click();
  const panel2 = drawer(page);
  await expect(panel2.locator('textarea').nth(0)).toHaveValue('');
  await expect(panel2.locator('textarea').nth(2)).toHaveValue('');
  await button(panel2, '取消').click();

  // 訂單完成後三欄仍可編輯（只有已取消才鎖）
  await expect(button(page, '編輯')).toBeVisible();

  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '編輯訂單備註')).toHaveCount(1);
});
