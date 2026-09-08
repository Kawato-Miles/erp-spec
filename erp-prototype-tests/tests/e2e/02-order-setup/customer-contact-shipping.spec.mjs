import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { activityItem, button, dialog, drawer, openByNo, openScenario, openTab, pickOption } from './_local.mjs';

test('2.5 訂單客戶與窗口聯絡人維護（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(60_000);
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0710');
  await openTab(page, '資訊');

  // 起點：客戶台北數位行銷有限公司，現任窗口聯絡人
  await expect(page.locator('body')).toContainText('台北數位行銷有限公司');

  await button(page, '切換窗口聯絡人').click();
  // 切換窗口聯絡人是側板（PanelDrawer），不是對話框
  const contactPanel = drawer(page);
  // 未實作：候選清單只有現任窗口與一筆示範資料（情境目錄 2.5「未實作」段），
  // 切換窗口只換這一欄，其餘聯絡欄位（職稱、電話、信箱、地址）不隨之整組換掉
  await pickOption(page, contactPanel.locator('.ant-select'), '備用聯絡人（示範資料）');
  await button(contactPanel, '確認').click();
  await expect(page.getByText('已切換窗口聯絡人').last()).toBeVisible();
  await expect(page.locator('body')).toContainText('備用聯絡人（示範資料）');

  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '切換窗口聯絡人')).toHaveCount(1);

  // 入口只在線下單出現：ORD-2026-0710 為線下單，見上方已成功操作；此處只補一句斷言避免退化
  await openTab(page, '資訊');
  await expect(button(page, '切換窗口聯絡人')).toBeVisible();
});

// fixme：情境 2.5 要求「填審稿前預計出貨日與審稿後預計出貨日」，但出貨資訊卡目前沒有這兩個
// 欄位的編輯入口——headerActions 只有「變更出貨方式」一顆按鈕（開的側板只有出貨方式一個下拉），
// 審稿前／審稿後預計出貨日在 Descriptions 內一律唯讀顯示（orders/_components/detail/InfoTab.js
// SHIPPING_FIELDS 沒有對應的可編輯欄，也沒有第二顆「編輯」鈕）。與 prototype 不符，不改測試迎合、
// 不改 prototype，回報待裁決。
test.fixme(
  '2.5（未實作段）出貨資訊卡的審稿前／審稿後預計出貨日可各自獨立填寫',
  async ({ page }) => {
    await openScenario(page, '業務', '/orders', { openAs, switchRole });
    await openByNo(page, 'ORD-2026-0710');
    await openTab(page, '資訊');
    await expect(page.getByLabel('審稿前預計出貨日')).toBeVisible();
    await page.getByLabel('審稿前預計出貨日').fill('2026-09-18');
    await expect(page.getByLabel('審稿後預計出貨日')).toBeVisible();
  },
);
