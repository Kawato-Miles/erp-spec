import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 情境目錄 14.29：生產任務側板分基本資料、狀態、數量、報工紀錄、歷程五區，標題帶序號；側板由點任務名稱開啟（2026-10-13 改寫）。
// 情境目錄 14.30：轉交單子層最前面固定放完稿縮圖與簽收照片（所有轉交單與點收佇列共用子母表）。

const SECTIONS = ['基本資料', '狀態', '數量', '報工紀錄（', '歷程（'];

async function expectFiveSections(drawer) {
  const titles = await drawer.locator('.ant-drawer-body').innerText();
  let from = 0;
  for (const title of SECTIONS) {
    const at = titles.indexOf(title, from);
    expect(at, `側板應依序有「${title}」區`).toBeGreaterThanOrEqual(0);
    from = at + title.length;
  }
  // 區塊標題帶序號圓標 1 到 5（印件項目同款）
  const badges = (await drawer.locator('.ant-avatar').allInnerTexts()).map((t) => t.trim());
  expect(badges).toEqual(['1', '2', '3', '4', '5']);
}

test('14.29 生產任務側板分基本資料、狀態、數量、報工紀錄、歷程五區', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0812');
  await search.press('Enter');
  await page
    .locator('tr.ant-table-row', { hasText: '證書四色印刷' })
    .first()
    .getByText('證書四色印刷', { exact: true })
    .click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expectFiveSections(drawer);
  for (const label of ['工單編號', '印件', '工作包', '指派師傅', '生產任務狀態', '交付狀態', '轉交狀態']) {
    await expect(drawer.getByText(label, { exact: true }).first()).toBeVisible();
  }
  // 接收工作與可做量不再出現
  await expect(drawer.getByText('接收工作', { exact: true })).toHaveCount(0);
  await expect(drawer.getByText(/可做量/)).toHaveCount(0);
  // 數量區依序：目標數量、生產數量 515、良品 500、不良品 15、搬運量／點收量「500／480」
  const qty = drawer.locator('.ant-descriptions').nth(2);
  const labels = (await qty.locator('.ant-descriptions-item-label').allInnerTexts()).map((t) => t.trim());
  expect(labels).toEqual(['目標數量', '生產數量', '良品', '不良品', '搬運量／點收量']);
  await expect(qty).toContainText('515');
  await expect(qty).toContainText('500／480');
  // 報工紀錄表不出現橫向捲動
  const scrolls = await drawer
    .locator('.ant-table-content')
    .first()
    .evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
  expect(scrolls).toBe(true);
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 所有工作包展開後，點子列的任務名稱開出同一個側板
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  await pkgRow.getByLabel('展開行').click();
  await pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '證書四色印刷' })
    .first()
    .getByText('證書四色印刷', { exact: true })
    .click();
  await expectFiveSections(page.locator('.ant-drawer-content:visible').last());
});

test('14.30 轉交單子層每條明細最前面固定放完稿縮圖與簽收照片', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/transfers');
  const search = page.getByPlaceholder(/轉交單編號/).first();
  await search.fill('TT-20260827-001');
  await search.press('Enter');
  const main = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-001' }).first();
  await main.locator('.ant-table-row-expand-icon').click();
  const sub = page.locator('tr.ant-table-expanded-row').first();
  const subHeads = (await sub.locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(subHeads.slice(0, 2)).toEqual(['完稿縮圖', '簽收照片']);
  expect(subHeads).toContain('點收量');
  expect(subHeads).not.toContain('點收數量');
  const row = sub.locator('tbody tr.ant-table-row', { hasText: '證書四色印刷' }).first();
  await expect(row.locator('td').first().getByRole('img')).toHaveCount(1);
  // 簽收照片欄一律縮圖（只有檔名、沒有預覽網址時顯示佔位圖，不顯示檔名）
  await expect(row.locator('td').nth(1).getByRole('img')).toHaveCount(1);
  await expect(row.locator('td').nth(1)).not.toContainText('.jpg');

  // 點收佇列共用同一張子母表：子層第一欄同樣是完稿縮圖
  await gotoInApp(page, '/production-floor/receiving');
  const queueMain = page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' }).first();
  await queueMain.locator('.ant-table-row-expand-icon').click();
  const queueSub = page.locator('tr.ant-table-expanded-row').first();
  const queueHeads = (await queueSub.locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(queueHeads.slice(0, 2)).toEqual(['完稿縮圖', '簽收照片']);
  await expect(queueSub.locator('tbody tr.ant-table-row').first().locator('td').first().getByRole('img')).toHaveCount(1);
});
