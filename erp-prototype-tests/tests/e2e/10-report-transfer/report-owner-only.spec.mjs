import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { openPackageReports } from './_ch10.mjs';

// 情境目錄 10.44：師傅不能修改或作廢別人提交的報工（純函式另見
// tests/unit/production-floor/report-owner-and-multi-precedence.test.mjs）。
// 起點資料：鏈二 WP-2026-0710-01（指派師傅劉阿海）的海報四色印刷（製作中，已有劉阿海提交的報工）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 production-execution delta Scenario THEN。

test('10.44 師傅不能修改或作廢別人提交的報工', async ({ page }) => {
  test.setTimeout(150_000);
  // 生管許文傑在所有工作包代報一筆
  await openAs(page, '生管', '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-01' }).first();
  await pkgRow.getByLabel('展開行').click();
  await pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '海報四色印刷' })
    .first()
    .getByRole('button', { name: '報工' })
    .click();
  const line = page.locator('.ant-modal-body tbody tr.ant-table-row').first();
  const inputs = line.locator('input');
  await inputs.nth(0).fill('100');
  await inputs.nth(1).fill('100');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 生管看得到自己代報那筆的修改與作廢
  let drawer = await openPackageReports(page, 'WP-2026-0710-01');
  let proxyRow = drawer.locator('tr.ant-table-row', { hasText: '許文傑' }).first();
  await expect(proxyRow.getByRole('button', { name: '修改' })).toHaveCount(1);
  await expect(proxyRow.getByRole('button', { name: '作廢' })).toHaveCount(1);
  await page.keyboard.press('Escape');

  // 劉阿海在我的工作包：生管代報那筆沒有修改與作廢；自己提交的照樣有
  await switchRole(page, '師傅');
  drawer = await openPackageReports(page, 'WP-2026-0710-01');
  proxyRow = drawer.locator('tr.ant-table-row', { hasText: '許文傑' }).first();
  await expect(proxyRow).toBeVisible();
  await expect(proxyRow.getByRole('button', { name: '修改' })).toHaveCount(0);
  await expect(proxyRow.getByRole('button', { name: '作廢' })).toHaveCount(0);
  const ownRow = drawer.locator('tr.ant-table-row', { hasText: '劉阿海' }).first();
  await expect(ownRow.getByRole('button', { name: '修改' })).toHaveCount(1);
});
