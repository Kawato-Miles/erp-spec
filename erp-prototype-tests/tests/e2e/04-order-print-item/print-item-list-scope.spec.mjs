import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';

// 情境目錄 4.21：業務的印件列表只列自己負責與被分享訂單的印件。
// 單據權責修正（change document-access-scope-alignment 第二批）：印件列表的範圍跟著所屬訂單的檢視活動
// （訂單與帳務檢視活動清單 ACT-VORD-010 至 ACT-VORD-018），不再讓業務看到全公司有工單的印件。
// 起點資料：鏈二 PI-2026-0710 與鏈四 PI-2026-0820 都已有工單；訂單 ORD-2026-0710、ORD-2026-0820 的接單業務是洪嘉駿，
// 業務乙陳映蓉只被以檢視層級分享 ORD-2026-0820（見 MOCK-DATA-CHAIN § 單據的分享成員）。

const searchBox = (page) => page.getByPlaceholder('請輸入印件名稱／編號、訂單編號，或客戶名稱');

async function search(page, keyword) {
  const box = searchBox(page);
  await box.fill(keyword);
  await box.press('Enter');
  await page.waitForTimeout(300);
}

test('4.21 業務的印件列表只列自己負責與被分享訂單的印件，協助角色與印務看全公司', async ({ page }) => {
  test.setTimeout(180_000);
  // 業務乙：只看到被分享的 PI-2026-0820，看不到洪嘉駿負責的 PI-2026-0710
  await openAs(page, '業務（陳映蓉）', '/print-items');
  await search(page, 'PI-2026-0820');
  await expect(page.getByText('PI-2026-0820', { exact: true }).first()).toBeVisible();
  await search(page, 'PI-2026-0710');
  await expect(page.getByText('PI-2026-0710', { exact: true })).toHaveCount(0);

  // 接單業務洪嘉駿：兩件都看得到
  await switchRole(page, '業務');
  await search(page, 'PI-2026-0710');
  await expect(page.getByText('PI-2026-0710', { exact: true }).first()).toBeVisible();
  await search(page, 'PI-2026-0820');
  await expect(page.getByText('PI-2026-0820', { exact: true }).first()).toBeVisible();

  // 印務主管（全公司協助角色）：同樣看得到非自己負責的 PI-2026-0710
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/print-items');
  await search(page, 'PI-2026-0710');
  await expect(page.getByText('PI-2026-0710', { exact: true }).first()).toBeVisible();

  // 印務（ACT-VPRD-005 全公司）：PI-2026-0803 旗下唯一工單的負責印務是蔡明修，周建宏照樣列得到
  await switchRole(page, '印務');
  await gotoInApp(page, '/print-items');
  await search(page, 'PI-2026-0803');
  await expect(page.getByText('PI-2026-0803', { exact: true }).first()).toBeVisible();
});
