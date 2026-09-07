import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 情境目錄 10.1：前置還沒到料，報工被擋下（原編號 18）。
// 起點資料：鏈二 WP-2026-0710-02 的「裁切成型」任務（可做量 0，前置轉交單皆未點收）。
// 數字：可做量 0，目標 3,000。

test('10.1 前置還沒到料，報工被擋下（原編號 18）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  const pkgRow = page.locator('tr', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  const subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  // 可做量＝各前置到料量的最小值（已換算產出單位），與目標數量並排：0／3,000
  await expect(subRow.getByText('0／3,000')).toBeVisible();

  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  await expect(dialog).toContainText('裁切成型');

  const taskRow = dialog.locator('tr', { hasText: '裁切成型' });
  await taskRow.locator('input').first().fill('3000'); // 生產數量
  await page.getByRole('button', { name: '送出報工' }).click();

  await expect(page.getByText(/前置尚未到料，等：WO-2026-0710／海報四色印刷/)).toBeVisible();
});
