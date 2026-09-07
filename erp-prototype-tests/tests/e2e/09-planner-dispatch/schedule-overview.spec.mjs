import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 情境目錄 9.9：工廠總覽的三個視角各自取數（原編號 24）。
// 起點資料：鏈二 WP-2026-0710-01（師傅劉阿海）、海德堡 SM102 四色機、印刷產線。

test('9.9 工廠總覽的三個視角各自取數（原編號 24）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/schedule');

  // 師傅視角（預設）：展開劉阿海旗下 WP-2026-0710-01，看得到包內生產任務子表
  const masterBlock = page.locator('div', { has: page.getByText('師傅：劉阿海') }).first();
  await expect(masterBlock).toBeVisible();
  await expect(masterBlock.getByText('WP-2026-0710-01').first()).toBeVisible();
  await expect(masterBlock).toContainText(/\d+ \/ \d+ 小時/); // 負荷條格式：N / 8 小時

  // 設備視角：海德堡 SM102 四色機的佇列與「製作中」段
  await page.getByText('設備視角', { exact: true }).click();
  const eqBlock = page.locator('div', { has: page.getByText('海德堡 SM102 四色機（印刷產線）') }).first();
  await expect(eqBlock).toBeVisible();
  await expect(eqBlock).toContainText('製作中：');
  await expect(eqBlock).toContainText(/\d+ \/ 8 小時/); // shift_hours 皆為 8

  // 產線視角：印刷產線彙總旗下設備的任務數與目標數量
  await page.getByText('產線視角', { exact: true }).click();
  const lineBlock = page.locator('div', { has: page.getByText('印刷產線', { exact: true }) }).first();
  await expect(lineBlock).toBeVisible();
  await expect(lineBlock).toContainText(/任務數 \d+/);
  await expect(lineBlock).toContainText(/目標數量 [\d,]+/);
  await expect(lineBlock).toContainText(/運轉中設備 \d+ \/ \d+ 台/);
});
