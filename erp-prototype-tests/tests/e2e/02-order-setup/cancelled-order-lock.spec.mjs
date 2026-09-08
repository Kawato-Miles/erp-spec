import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { button, buildDraftOrder, openTab, orderHeader } from './_local.mjs';

test('2.8 已取消訂單的三類備註與其他附件鎖定（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(120_000);
  const orderNo = await buildDraftOrder(
    page,
    { openAs, switchRole, gotoInApp },
    { caseName: '2.8 取消後鎖定', itemName: '2.8 印件甲' },
  );

  // 起點：非終態訂單先取消（現行八張訂單皆非已取消，情境目錄 2.8 起點資料段）
  await button(page, '取消訂單').click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
  await expect(page.getByText('已取消訂單').last()).toBeVisible();
  await expect(orderHeader(page)).toContainText('已取消');

  await openTab(page, '資訊');
  // 三類備註鎖為唯讀：編輯入口消失
  await expect(page.getByRole('button', { name: '編輯' })).toHaveCount(0);

  // 其他附件：上傳入口一併鎖定（readOnly 來自 isOrderTerminal，已取消為終態）——
  // 比情境目錄「未實作」段記錄的現況更進一步：現行版本已不再顯示上傳入口
  await openTab(page, '訂單附件');
  await expect(page.getByRole('button', { name: '上傳附件' })).toHaveCount(0);
});
