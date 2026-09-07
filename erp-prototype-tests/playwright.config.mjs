import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, DEV_PORT, ERP_APP_DIR } from './config.mjs';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'zh-TW',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // 不經 pnpm（fnm shim 的 pnpm 與 Node 20 不相容），直接呼叫 erp 內的 next
    command: `node_modules/.bin/next dev --port ${DEV_PORT}`,
    cwd: ERP_APP_DIR,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
