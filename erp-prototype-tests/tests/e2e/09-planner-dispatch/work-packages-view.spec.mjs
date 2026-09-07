import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';

// 情境目錄第九章：生管在「工作包管理」頁（/production-floor/work-packages）看工作包主表與子表。
// 起點資料：九筆工作包（WP-2026-0601-01/02、WP-2026-0710-01/02、WP-2026-0820-01～05）。

test('9.3 一包一設備：派工由生管在工作包頁執行（原編號 15）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  const pkg01Row = page.locator('tr', { hasText: 'WP-2026-0710-01' });
  const pkg02Row = page.locator('tr', { hasText: 'WP-2026-0710-02' });
  // 展開 WP-2026-0710-01：旗下任務全落在海德堡 SM102 四色機
  await pkg01Row.getByLabel('展開行').click();
  const subTable01 = pkg01Row.locator('xpath=following-sibling::tr[1]');
  await expect(subTable01).toContainText('海德堡 SM102 四色機');
  await expect(subTable01).not.toContainText('POLAR 137 裁切機');

  // 展開 WP-2026-0710-02：旗下任務落在 POLAR 137 裁切機（另一台設備、另一包）
  await pkg02Row.getByLabel('展開行').click();
  const subTable02 = pkg02Row.locator('xpath=following-sibling::tr[1]');
  await expect(subTable02).toContainText('POLAR 137 裁切機');
  await expect(subTable02).not.toContainText('海德堡 SM102 四色機');
});

test('9.4 工作包主表四欄與現場進度（原編號 16）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  // 主表不設狀態欄，欄位含工作包編號、指派師傅、預計完成日、備註、確樣需求、現場進度、操作
  await expect(page.getByRole('columnheader', { name: '工作包編號' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '指派師傅' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '預計完成日' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '確樣需求' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '現場進度' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '狀態' })).toHaveCount(0);

  // 篩選：指派師傅＝劉阿海
  await page.locator('.ant-col', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter'); // MASTER_OPTIONS[0] = 劉阿海
  await expect(page.getByText('WP-2026-0710-01')).toBeVisible();
  await expect(page.getByText('WP-2026-0710-02')).toHaveCount(0);

  // 展開 WP-2026-0710-01：鏈二劉阿海這包 1/2 已完成（材料已完成、印刷還在製作中）
  const row = page.locator('tr', { hasText: 'WP-2026-0710-01' });
  await expect(row.getByText('1 / 2')).toBeVisible();
  await row.getByLabel('展開行').click();
  const subTable = row.locator('xpath=following-sibling::tr[1]');
  await expect(subTable).toContainText('報工進度');
  await expect(subTable).toContainText('可做量');
});

test('9.5 師傅只看得到自己被指派的工作包（原編號 17）', async ({ page }) => {
  await openAs(page, '師傅', '/production-floor/work-packages');
  await expect(page.getByText('WP-2026-0710-01')).toBeVisible();
  await expect(page.getByText('WP-2026-0710-02')).toHaveCount(0); // 李榮發的包
  await expect(page.getByText('WP-2026-0601-01')).toHaveCount(0); // 陳金水的包

  // 反向確認：陳金水的包在生管視角看得到（同一份資料，非資料缺漏）
  await switchRole(page, '生管');
  await expect(page.getByText('WP-2026-0601-01')).toBeVisible();
  await expect(page.getByText('WP-2026-0710-02')).toBeVisible();
});
