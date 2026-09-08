import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import { goInApp, openByNo, openScenario, openTab } from './_local.mjs';

test('2.6 訂單進終態後客戶欄與印件欄唯讀（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(90_000);
  // 終態對照組：鏈一 ORD-2026-0601（訂單完成）
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0601');
  await openTab(page, '資訊');
  // 終態訂單的客戶資訊全列唯讀：切換窗口聯絡人入口關閉
  await expect(page.getByRole('button', { name: '切換窗口聯絡人' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '變更出貨方式' })).toHaveCount(0);

  await openTab(page, '訂單項目');
  // 新增印件與複製原印件規格加開的入口關閉
  await expect(page.getByRole('button', { name: '新增印件' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '複製原印件規格加開' })).toHaveCount(0);
  // 明細列的編輯印件、確認可製作等操作欄圖示不出現，單價欄唯讀顯示（非行內輸入框）
  await expect(page.locator('input[aria-label*="單價（未稅）"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '編輯印件' })).toHaveCount(0);

  // 非終態對照組：鏈二 ORD-2026-0710（製作中）兩處皆可編輯
  await goInApp(page, '/orders', gotoInApp);
  await openByNo(page, 'ORD-2026-0710');
  await openTab(page, '資訊');
  await expect(page.getByRole('button', { name: '切換窗口聯絡人' })).toBeVisible();
  await expect(page.getByRole('button', { name: '變更出貨方式' })).toBeVisible();

  await openTab(page, '訂單項目');
  await expect(page.getByRole('button', { name: '新增印件' })).toBeVisible();
  await expect(page.locator('input[aria-label*="單價（未稅）"]').first()).toBeVisible();
});
