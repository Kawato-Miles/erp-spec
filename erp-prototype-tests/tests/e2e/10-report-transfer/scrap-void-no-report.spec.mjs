import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';
import { openWorkOrderFromList } from '../08-process-review-deliver/_page-helpers.mjs';

// 情境目錄 10.60：已作廢或報廢的任務不能新增報工，五個報工入口都沒有報工動作。
// 起點資料：鏈二 WO-2026-0710 的海報四色印刷（PT-0710-2，製作中、指派師傅劉阿海、報工累計生產 2,000、
// 良品 1,990、不良 10）；另有裁切成型（待處理、尚無投入）。mock 沒有初始就報廢的任務，前置把它推到報廢。
// 前置操作與 10.17 相同：畫面沒有異動移除的入口，唯一能讓場內任務走到報廢與已作廢的路徑是業務取消訂單
// ORD-2026-0710，連鎖把有實際投入的海報四色印刷轉報廢、無投入的裁切成型轉已作廢。
// 資料層直接呼叫寫入被擋下，以純函式驗（tests/unit/production-floor/report-precondition-and-entries.test.mjs，10.60）。

const REPORT = { name: '報工', exact: true };

// 展開母列並回傳子層列；列已展開時（頁面狀態跨角色保留）不重複點
async function expandedSubRow(pkgRow) {
  const expand = pkgRow.getByLabel('展開行');
  if (await expand.count()) await expand.click();
  return pkgRow.locator('xpath=following-sibling::tr[1]');
}

test('10.60 已作廢或報廢的任務不能新增報工：五個報工入口都沒有報工動作', async ({ page }) => {
  test.setTimeout(150_000);
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710');
  await page.getByRole('button', { name: '取消訂單' }).click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
  await expect(page.getByText(/生產任務 1 筆報廢（有實際投入、成本留帳）、1 筆已作廢（無投入）/)).toBeVisible();

  // 所有生產任務：報廢與已作廢那兩列狀態可見、沒有報工；同頁別張工單的備料仍有報工入口（對照組）
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  const scrapRow = page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first();
  const voidRow = page.locator('tr.ant-table-row', { hasText: '裁切成型' }).first();
  await expect(scrapRow).toContainText('報廢');
  await expect(voidRow).toContainText('已作廢');
  await expect(scrapRow.getByRole('button', REPORT)).toHaveCount(0);
  await expect(voidRow.getByRole('button', REPORT)).toHaveCount(0);
  await search.fill('WO-2026-0815');
  await search.press('Enter');
  const controlRow = page.locator('tr.ant-table-row', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) }).first();
  await expect(controlRow.getByRole('button', REPORT)).toBeVisible();

  // 所有工作包：兩個工作包的母列沒有批次報工，展開後子列也沒有報工
  await gotoInApp(page, '/production-floor/work-packages');
  for (const pkgNo of ['WP-2026-0710-01', 'WP-2026-0710-02']) {
    const pkgRow = page.locator('.ant-table-row', { hasText: pkgNo }).first();
    await expect(pkgRow.getByRole('button', REPORT)).toHaveCount(0);
    await expect((await expandedSubRow(pkgRow)).getByRole('button', REPORT)).toHaveCount(0);
  }

  // 師傅劉阿海的我的工作包與我的生產任務：同樣沒有報工動作
  await switchRole(page, '師傅');
  await gotoInApp(page, '/production-floor/work-packages');
  const minePkg = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-01' }).first();
  await expect(minePkg).toBeVisible();
  await expect(minePkg.getByRole('button', REPORT)).toHaveCount(0);
  await expect((await expandedSubRow(minePkg)).getByRole('button', REPORT)).toHaveCount(0);
  await gotoInApp(page, '/production-floor/dispatch');
  const mineTask = page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first();
  await expect(mineTask).toContainText('報廢');
  await expect(mineTask.getByRole('button', REPORT)).toHaveCount(0);

  // 工單詳情（印務周建宏）：整張工單沒有報工入口
  await switchRole(page, '印務');
  await openWorkOrderFromList(page, 'WO-2026-0710');
  await expect(page.getByRole('button', REPORT)).toHaveCount(0);
});
