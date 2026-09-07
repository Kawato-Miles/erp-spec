import { test, expect } from '@playwright/test';

// 骨架驗證用：開發伺服器起得來、工單列表頁渲染
test('工單列表頁可開', async ({ page }) => {
  await page.goto('/work-orders');
  await expect(page.locator('body')).toContainText('工單');
});
