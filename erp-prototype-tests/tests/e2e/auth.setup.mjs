import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUTH_STATE_PATH, HAS_LOGIN_CREDENTIALS } from '../../config.mjs';

// 登入前置步驟：本機 dev 的免登入白名單只放行部分舊路由（main 版本），工單、印件、現場回報等
// prototype 路由會被導向登入頁。有帳密環境變數時先登入一次、把登入狀態存檔給其餘測試沿用；
// 沒有帳密時寫一份空狀態，其餘測試照舊直接開頁（白名單併回 main 後即可不設帳密）。
setup('登入並保存狀態', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  if (!HAS_LOGIN_CREDENTIALS) {
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }
  await page.goto('/login');
  await page.locator('input[name="username"]').fill(process.env.ERP_TEST_USERNAME);
  await page.locator('input[name="password"]').fill(process.env.ERP_TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
