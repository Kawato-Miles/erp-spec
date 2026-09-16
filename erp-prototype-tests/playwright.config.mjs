import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, DEV_PORT, ERP_APP_DIR, AUTH_STATE_PATH } from './config.mjs';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'zh-TW',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  // setup 專案先跑登入（見 tests/e2e/auth.setup.mjs），其餘測試沿用其登入狀態；
  // 沒設帳密時狀態檔為空，行為與從前相同。
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.mjs/ },
    {
      name: 'chromium',
      testIgnore: /auth\.setup\.mjs/,
      dependencies: ['setup'],
      use: { storageState: AUTH_STATE_PATH },
    },
  ],
  webServer: {
    // 不經 pnpm（fnm shim 的 pnpm 與 Node 20 不相容），直接呼叫 erp 內的 next
    command: `node_modules/.bin/next dev --port ${DEV_PORT}`,
    cwd: ERP_APP_DIR,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
