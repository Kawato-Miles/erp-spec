import { test, expect } from '@playwright/test';
import { openAs, gotoInApp } from '../_helpers.mjs';

// 情境目錄 10.1：前置未到料的任務沒有報工入口；到料點收後入口出現（原編號 18）。
// 起點資料：鏈二 WP-2026-0710-02 的「裁切成型」任務（可做量 0，前置轉交單皆未點收）、
// TT-20260830-002（待點收）。數字：點收前可做量 0／3,000；點收 1,190 後 1,190／3,000。
// 送出時的前置擋下留在系統裡當最後防線（併發），介面這一層改以隱藏入口表達。

test('10.1 前置未到料的任務沒有報工入口；到料點收後入口出現（原編號 18）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  let pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  let subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  // 可做量＝各前置到料量的最小值（已換算產出單位），與目標數量並排：0／3,000
  await expect(subRow.getByText('0／3,000')).toBeVisible();

  // 報不了的工不給入口：該任務列的操作欄只有檢視歷程
  await expect(subRow.getByRole('button', { name: '報工' })).toHaveCount(0);
  await expect(subRow.getByRole('button', { name: /檢視歷程/ })).toHaveCount(1);
  // 這一包裡沒有別的可報工任務，母列的批次報工也一起隱藏（開起來只會是一張空表）
  await expect(pkgRow.getByRole('button', { name: '報工' })).toHaveCount(0);

  // 點收才算到料（已送達是搬運方的單方宣稱）
  await gotoInApp(page, '/production-floor/receiving');
  await page
    .locator('tr', { hasText: 'TT-20260830-002' })
    .getByRole('button', { name: '點收' })
    .click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收 TT-20260830-002/)).toBeVisible();

  await gotoInApp(page, '/production-floor/work-packages');
  pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow).toContainText('1,190／3,000');

  // 入口出現：子列的單筆報工與母列的批次報工都回來
  await expect(pkgRow.getByRole('button', { name: '報工' })).toHaveCount(1);
  await subRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  await expect(dialog).toContainText('裁切成型');
  await expect(dialog.locator('tbody tr.ant-table-row')).toHaveCount(1);
});
