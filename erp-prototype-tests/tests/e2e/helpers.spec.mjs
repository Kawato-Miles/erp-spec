import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from './_helpers.mjs';

test('切角色與站內導頁保留記憶體狀態', async ({ page }) => {
  await openAs(page, '生管', '/work-orders');
  await gotoInApp(page, '/production-floor/work-packages');
  await expect(page.locator('body')).toContainText('工作包');
  // 站內導頁後角色仍是生管（未被整頁重載重置）
  await expect(page.locator('header .ant-select, .ant-layout-header .ant-select').first()).toContainText('生管');
  await switchRole(page, '師傅');
  await expect(page.locator('body')).toContainText('WP-2026-0710-01');
});
