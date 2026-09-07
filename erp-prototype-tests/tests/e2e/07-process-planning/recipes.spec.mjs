import { test, expect } from '@playwright/test';
import { openAs, gotoInApp } from '../_helpers.mjs';
import { clickIntoDetail } from './_ch07.mjs';

test('7.20 部件配方改版，改一處所有引用它的印件配方下次展開都生效（原編號 40）', async ({
  page,
}) => {
  await openAs(page, '印務', '/recipes/components');
  const row = page.locator('tr.ant-table-row').filter({ hasText: 'BR-2026-0601' });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('生效');
  await clickIntoDetail(page, 'BR-2026-0601', /recipes\/components\/detail/);

  // 被引用的印件配方看得到
  await expect(page.getByText('被引用印件配方')).toBeVisible();
  await expect(page.getByText('PS-2026-0601')).toBeVisible();
  // 只被一個印件配方引用時不出共用警示（兩個以上才顯示）
  await expect(page.getByText(/被 \d+ 個印件配方共用/)).toHaveCount(0);

  // 對生效版點「改版」：新版轉生效、舊版轉停用，已展開的工單不回溯
  await page.getByRole('button', { name: '改版' }).click();
  const confirm = page.locator('.ant-modal-confirm');
  await expect(confirm).toContainText('舊版轉停用');
  await expect(confirm).toContainText('已展開的工單不回溯');
  await confirm.getByRole('button', { name: '產生新版' }).click();
  await expect(page.locator('.ant-message')).toContainText('已產生第 2 版並轉為生效');
  await expect(page.getByText('第 2 版').first()).toBeVisible();

  // 版本歷程：回清單看得到同一個配方編號的兩個版本，新版生效、舊版停用
  await gotoInApp(page, '/recipes/components');
  const versions = page.locator('tr.ant-table-row').filter({ hasText: 'BR-2026-0601' });
  await expect(versions).toHaveCount(2);
  await expect(versions.filter({ hasText: '生效' })).toHaveCount(1);
  await expect(versions.filter({ hasText: '停用' })).toHaveCount(1);
});

test.fixme(
  '7.21 配方管理的角色門控（原編號 44）',
  async ({ page }) => {
    // 預期：印務主管可看、維護動作不可用；生管與其他角色見無權檢視。
    // 實際：可檢視角色（recipes/_lib/permissions.js 的 VIEWER_ROLES）含生管與主管，
    //       生管進到配方頁看得到清單、不是無權檢視；且生管的側欄沒有配方管理入口，
    //       站內導頁到不了這一頁。印務主管「可看不可維護」那一半與情境相符。
    await openAs(page, '印務主管', '/recipes/print-items');
    await expect(page.locator('tr.ant-table-row').filter({ hasText: 'PS-2026-0601' })).toHaveCount(
      1,
    );
    await expect(page.getByRole('button', { name: '新增印件配方' })).toHaveCount(0);
    await gotoInApp(page, '/recipes/components');
    await expect(page.getByRole('button', { name: '新增部件配方' })).toHaveCount(0);
    // 生管見無權檢視
    await expect(page.getByText('無權檢視配方管理')).toBeVisible();
  },
);

test(
  '7.22 類似品估算參考（原編號 26）',
  async ({ page }) => {
    // 2026-09-08 歷史清單配方編號已對齊主檔（BR-2026-0601／PS-2026-0601），解除 fixme。
    // 預期：以配方名稱與配方編號兩種搜法都命中歷史工單 WO-2026-0601（配方以編號認人）。
    // 實際：工廠指標頁的歷史清單（production-floor/_lib/mock-data.js 的 MOCK_ESTIMATE_HISTORY）
    //       只有一筆，配方編號記成 BR-2026-0004／PS-2026-0002，與配方主檔的
    //       BR-2026-0601／PS-2026-0601 對不上，故以編號搜尋一筆都命不中；
    //       以名稱（會員卡本體）搜尋則命中。名稱與編號同列顯示、升降百分比與耗損訊號兩欄皆已具備。
    await openAs(page, '印務', '/production-floor/metrics');
    const search = page.getByPlaceholder(/搜尋配方名稱/);
    const rows = page.locator('tr.ant-table-row').filter({ hasText: 'WO-2026-0601' });

    await search.fill('會員卡本體');
    await search.press('Enter');
    await expect(rows).toHaveCount(1);
    await expect(rows).toContainText('BR-2026-0601');
    await expect(rows).toContainText('%');

    await search.fill('BR-2026-0601');
    await search.press('Enter');
    await expect(rows).toHaveCount(1);
  },
);
