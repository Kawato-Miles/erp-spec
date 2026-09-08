import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { button, dialog, openByNo, openScenario, openTab, orderHeader } from './_local.mjs';

test('2.3 已回簽後追加上傳回簽檔（原編號：商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(90_000);
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0803');
  await openTab(page, '訂單附件');

  // 起點：既有一份回簽檔「青硯文具_報價單回簽.pdf」，2026-08-10 由洪嘉駿上傳
  await expect(page.locator('body')).toContainText('青硯文具_報價單回簽.pdf');
  await expect(page.locator('body')).toContainText('2026-08-10');
  expect(await orderHeader(page).innerText()).toContain('製作等待中');

  await button(page, '上傳回簽檔案').click();
  await dialog(page).getByLabel('檔名').fill('青硯文具_報價單回簽_v2.pdf');
  await dialog(page).getByRole('button', { name: /上\s*傳/ }).click();

  // 訂單本已在回簽之後的階段（製作等待中），再上傳不會觸發「是否同時確認回簽」詢問視窗
  await expect(page.getByText('已上傳回簽檔案').last()).toBeVisible();

  // 新檔案以追加方式併存，舊檔仍在
  await expect(page.locator('body')).toContainText('青硯文具_報價單回簽.pdf');
  await expect(page.locator('body')).toContainText('青硯文具_報價單回簽_v2.pdf');

  // 訂單狀態不重複推進
  await expect(orderHeader(page)).toContainText('製作等待中');
});
