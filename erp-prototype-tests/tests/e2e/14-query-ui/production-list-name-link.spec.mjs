import { expect, test } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 情境目錄 14.39：生產任務列表狀態欄顯示前置未到料標籤，操作欄沒有說明文字，點任務名稱開側板。
// 情境目錄 14.40：業務在印件詳情看得到品檢頁籤與品檢照片，沒有修正鈕。

const WAITING_HINT = '前置未到料：等 WO-2026-0815／牛皮紙 150g 備料 的貨';
const drawerOf = (page) => page.locator('.ant-drawer-content:visible').last();

test('14.39 生產任務列表狀態欄顯示前置未到料標籤，操作欄沒有說明文字；點任務名稱開側板', async ({
  page,
}) => {
  test.setTimeout(120_000);
  // 所有生產任務：鏈三五色印刷前置未到料
  await openAs(page, '生管', '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0815');
  await search.press('Enter');
  const printRow = page.locator('tr.ant-table-row', { hasText: '五色印刷' }).first();
  await expect(printRow.getByText('前置未到料', { exact: true })).toBeVisible();
  // 操作欄沒有說明文字，也沒有檢視歷程鈕
  await expect(printRow).not.toContainText('的貨');
  await expect(printRow.getByRole('button', { name: /檢視歷程/ })).toHaveCount(0);
  // 點任務名稱開生產任務側板，數量區下方有在等誰的說明
  await printRow.getByText('五色印刷', { exact: true }).click();
  await expect(drawerOf(page)).toContainText('報工紀錄（');
  await expect(drawerOf(page)).toContainText(WAITING_HINT);
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 沒被前置卡住的任務（備料）沒有標籤
  const prepRow = page.locator('tr.ant-table-row', {
    has: page.getByText('牛皮紙 150g 備料', { exact: true }),
  }).first();
  await expect(prepRow.getByText('前置未到料', { exact: true })).toHaveCount(0);

  // 所有工作包展開 WP-2026-0710-02：子列表同樣有標籤，任務名稱可點開側板
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' }).first();
  await pkgRow.getByLabel('展開行').click();
  const subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow.getByText('前置未到料', { exact: true })).toBeVisible();
  await expect(subRow).not.toContainText('的貨');
  await subRow.getByText('裁切成型', { exact: true }).click();
  await expect(drawerOf(page)).toContainText('報工紀錄（');
  await expect(drawerOf(page)).toContainText('前置未到料：等 WO-2026-0710／海報四色印刷 的貨');
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 師傅劉阿海在我的生產任務點自己任務的名稱同樣開側板
  await openAs(page, '師傅', '/production-floor/dispatch/mine');
  const mine = page.locator('tr.ant-table-row', { hasText: '信封四色印刷' }).first();
  await mine.getByText('信封四色印刷', { exact: true }).click();
  await expect(drawerOf(page)).toContainText('報工紀錄（');
});

test('14.40 業務在印件詳情看得到品檢頁籤與品檢照片，沒有修正鈕', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/print-items');
  await page.getByText('會員卡（客製燙金）', { exact: true }).first().click();
  await expect(page.getByText('印件基本資訊')).toBeVisible();

  // 頁籤範圍與印務相同：工單與生產任務、品檢紀錄與品檢缺口處置都看得到
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toBeVisible();
  await page.getByRole('tab', { name: '品檢紀錄與品檢缺口處置' }).click();
  const table = page.locator('.ant-table-wrapper').filter({ hasText: '品檢時間' }).first();
  const heads = (await table.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim());
  expect(heads[0]).toBe('品檢照片');
  const row = table.locator('tbody tr.ant-table-row').first();
  await expect(row.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  // 只開放檢視：沒有品檢修正、處置修正等操作
  const panel = page.locator('.ant-tabs-tabpane-active');
  await expect(panel.getByRole('button', { name: /^修\s*正$/ })).toHaveCount(0);
  await expect(panel.getByRole('button', { name: /處置/ })).toHaveCount(0);
});
