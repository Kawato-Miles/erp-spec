import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

test.setTimeout(60_000);

test('14.13 帳務異常清單只列兩種型別（原編號 186）', async ({ page }) => {
  // 起點資料：帳務異常清單頁；七條鏈的訂單皆無超收與超額發票
  await openAs(page, '會計', '/payment/billing-anomaly');

  // 情境：業務或會計檢視型別欄與清單內容，再對照鏈一至鏈三的訂單
  // 系統之後怎麼變：型別只剩「發票待折讓或作廢」與「超收」兩種，不再有「發票待開」「款項待收」
  await expect(page.locator('body')).not.toContainText('發票待開');
  await expect(page.locator('body')).not.toContainText('款項待收');

  // 三條主鏈都是正常在途或已收訖，清單顯示無此資料，這不是缺陷（全庫其餘訂單也都無異常）
  await expect(page.locator('.ant-table-tbody')).toContainText('無此資料');
  await expect(page.locator('.ant-table-tbody .ant-table-row')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('ORD-2026-0601');
  await expect(page.locator('body')).not.toContainText('ORD-2026-0710');
  await expect(page.locator('body')).not.toContainText('ORD-2026-0815');
});
