import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';

// 情境目錄 10.2：待搬視圖只有生管進得去，欄位含可搬量（原編號 21）。
// 起點資料：鏈四 PT-0820-9 精裝裝訂（可搬量 500）。
// 業務的選單沒有生產管理群組，待搬視圖不在其選單內，故第一步直接以業務身分整頁載入該路徑。

test('10.2 待搬視圖只有生管進得去，欄位含可搬量（原編號 21）', async ({ page }) => {
  await openAs(page, '業務', '/production-floor/pending-moves');
  await expect(page.getByText('轉交單建立限生管、印務、印務主管與主管操作')).toBeVisible();
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0); // 非生管不出示可勾選列

  await switchRole(page, '生管');
  await expect(page.getByText(/勾選要送的量後建單/)).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '累計良品' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '已開轉交單' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '可搬量' })).toBeVisible();

  const row = page.locator('tr', { hasText: '精裝裝訂' });
  await expect(row).toContainText('500'); // 累計良品／可搬量皆為 500（尚未開單）
});
