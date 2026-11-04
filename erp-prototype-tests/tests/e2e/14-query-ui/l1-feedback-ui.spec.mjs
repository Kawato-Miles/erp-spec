import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 2026/09 需求單到審稿試用回饋（優先 L1）的介面項目：待評估成本頁、訂單項目已棄用列灰色、審稿批次下載檔案。

test('14.48 待評估成本頁只列待評估成本的需求單，版型同需求單列表', async ({ page }) => {
  await openAs(page, '業務主管', '/quote-prototype');
  // 需求單列表含各狀態：鏈八 Q-20260905-01（待評估成本）與 Q-20260906-01（已評估成本）都在
  await expect(page.getByText('Q-20260905-01')).toBeVisible();
  await expect(page.getByText('Q-20260906-01')).toBeVisible();

  await gotoInApp(page, '/quote-prototype/pending-cost-evaluation');
  await expect(page.getByText('Q-20260905-01')).toBeVisible();
  await expect(page.getByText('Q-20260906-01')).toHaveCount(0);
  // 只列一種狀態，不提供新增需求單
  await expect(page.getByRole('button', { name: /新\s*增/ })).toHaveCount(0);
});

test('14.49 訂單項目表的已棄用印件列整列灰底', async ({ page }) => {
  // 起點：ORD-2026-0817 旗下「門市立牌打樣」為已棄用
  await openAs(page, '業務主管', '/orders');
  await page.getByPlaceholder(/請輸入訂單編號/).fill('ORD-2026-0817');
  await page.getByPlaceholder(/請輸入訂單編號/).press('Enter');
  await page.locator('a', { hasText: 'ORD-2026-0817' }).first().click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const abandoned = page.locator('tr.order-item-abandoned-row', { hasText: '門市立牌打樣' });
  await expect(abandoned).toHaveCount(1);
});

test('14.50 審稿待審列表勾選印件後批次下載稿件檔', async ({ page }) => {
  // 起點：鏈八 ORD-2026-0920 旗下 PI-2026-0921「量販促銷吊卡」（等待審稿）
  await openAs(page, '訂單管理人', '/prepress-review');
  const downloadBtn = page.getByRole('button', { name: /批次下載檔案/ });
  await expect(downloadBtn).toBeDisabled();
  await page
    .getByText('量販促銷吊卡', { exact: true })
    .locator('xpath=ancestor::tr[1]')
    .locator('input[type="checkbox"]')
    .check();
  await expect(downloadBtn).toBeEnabled();
  const downloadPromise = page.waitForEvent('download');
  await downloadBtn.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('促銷吊卡');
  await expect(page.getByText(/已下載 1 件印件的稿件檔/)).toBeVisible();
});
