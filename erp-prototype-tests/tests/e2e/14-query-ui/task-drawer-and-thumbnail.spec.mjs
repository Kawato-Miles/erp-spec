import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 情境目錄 14.29：生產任務側板分基本資料、數量、轉交進度、歷程四區（Miles 2026-10-06 拍板）。
// 情境目錄 14.30：轉交單子層每條明細最前面放印件完稿縮圖（所有轉交單與點收佇列共用子母表）。

const SECTIONS = ['基本資料', '數量', '轉交進度', '歷程（'];

async function expectFourSections(drawer) {
  const titles = await drawer.locator('.ant-drawer-body').innerText();
  let from = 0;
  for (const title of SECTIONS) {
    const at = titles.indexOf(title, from);
    expect(at, `側板應依序有「${title}」區`).toBeGreaterThanOrEqual(0);
    from = at + title.length;
  }
}

test('14.29 生產任務側板分基本資料、數量、轉交進度、歷程四區', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0812');
  await search.press('Enter');
  await page
    .locator('tr.ant-table-row', { hasText: '證書四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expectFourSections(drawer);
  for (const label of ['工單編號', '印件', '工作包', '指派師傅', '生產任務狀態', '交付狀態', '轉交狀態', '接收工作']) {
    await expect(drawer.getByText(label, { exact: true }).first()).toBeVisible();
  }
  // 數量三數無分母：完成 515、良品 500、不良品 15
  const qty = drawer.locator('.ant-descriptions').nth(1);
  await expect(qty).toContainText('完成');
  await expect(qty).toContainText('515');
  await expect(qty).toContainText('500');
  await expect(qty).toContainText('15');
  // 轉交進度三數：轉交量 500、點收量 480、良品 500
  const transfer = drawer.locator('.ant-descriptions').nth(2);
  await expect(transfer).toContainText('轉交量');
  await expect(transfer).toContainText('點收量');
  await expect(transfer).toContainText('480');
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 所有工作包的檢視歷程開出同一個側板
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  await pkgRow.getByLabel('展開行').click();
  await pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '證書四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  await expectFourSections(page.locator('.ant-drawer-content:visible').last());
});

test('14.30 轉交單子層每條明細最前面放印件完稿縮圖', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/transfers');
  const search = page.getByPlaceholder(/轉交單編號/).first();
  await search.fill('TT-20260827-001');
  await search.press('Enter');
  const main = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-001' }).first();
  await main.locator('.ant-table-row-expand-icon').click();
  const sub = page.locator('tr.ant-table-expanded-row').first();
  await expect(sub.locator('thead th').first()).toHaveText('完稿縮圖');
  const row = sub.locator('tbody tr.ant-table-row', { hasText: '證書四色印刷' }).first();
  await expect(row.locator('td').first().getByRole('img')).toHaveCount(1);

  // 點收佇列共用同一張子母表：子層第一欄同樣是完稿縮圖
  await gotoInApp(page, '/production-floor/receiving');
  const queueMain = page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' }).first();
  await queueMain.locator('.ant-table-row-expand-icon').click();
  const queueSub = page.locator('tr.ant-table-expanded-row').first();
  await expect(queueSub.locator('thead th').first()).toHaveText('完稿縮圖');
  await expect(queueSub.locator('tbody tr.ant-table-row').first().locator('td').first().getByRole('img')).toHaveCount(1);
});
