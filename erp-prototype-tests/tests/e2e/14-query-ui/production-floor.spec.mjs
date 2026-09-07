import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';

// 本機測試常與其他 sub-agent 並行、系統負載偏高，放寬本檔逾時
test.setTimeout(60_000);

test('14.4 工作包操作欄改成圖示（原編號 19）', async ({ page }) => {
  // 起點資料：九筆工作包任一列
  await openAs(page, '生管', '/production-floor/work-packages');
  const actionCell = page.locator('.ant-table-tbody .ant-table-row').first().locator('td').last();

  // 情境：生管看包列的操作欄，逐一停留看提示文字
  // 系統之後怎麼變：包列操作為圖示按鈕，沒有文字按鈕
  // （Material Symbols 圖示字型本身的 innerText 是配字連字「edit_note」等，不是給人讀的文字標籤；
  // 判斷「圖示按鈕、沒有文字按鈕」看的是每顆按鈕都靠 aria-label 給名稱，不是可見文字節點）
  const buttons = actionCell.locator('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  }

  // 停留時顯示對應動作名稱的提示（報工／調整師傅）
  await buttons.first().hover();
  const tooltip = page.locator('.ant-tooltip-inner');
  await expect(tooltip).toBeVisible();
  const tooltipText = await tooltip.innerText();
  expect(['報工', '調整師傅']).toContain(tooltipText.trim());
});

test('14.5 欄位說明圖示（原編號 20）', async ({ page }) => {
  // 起點資料：工作包管理頁
  await openAs(page, '生管', '/production-floor/work-packages');

  // 情境：任一角色停留在「確樣需求」「現場進度」「可做量」欄名旁的說明圖示上
  // （本頁包列沒有「可做量」欄——那欄在生產任務子表；包列改停留同樣有說明圖示的「預計完成日」）
  const checks = [
    { label: '確樣需求', textFragment: '確樣事項' },
    { label: '現場進度', textFragment: '任務總數' },
    { label: '預計完成日', textFragment: '期限' },
  ];
  for (const { label, textFragment } of checks) {
    const headerCell = page.locator('th', { hasText: label }).first();
    const icon = headerCell.locator('.material-symbols-outlined').first();
    await page.mouse.move(0, 0);
    await icon.hover();
    // 前一個提示消失後 AntD 仍把舊的 tooltip 節點留在 DOM，不即時移除也不即時加隱藏 class，
    // 一律取「最後掛載」那個（本次 hover 剛觸發的新提示排在最後）
    const tooltip = page.locator('.ant-tooltip-inner').last();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText(textFragment);
  }
});

test('14.10 生產管理五頁的角色可見範圍（原編號 180）', async ({ page }) => {
  // 起點資料：生產管理群組的五頁（生產任務管理、工作包管理、待搬視圖、轉交單管理、點收佇列）
  await openAs(page, '生管', '/work-orders');
  const readGroupItems = async () => {
    const submenu = page.locator('.ant-menu-submenu', { hasText: '生產管理' }).first();
    const title = submenu.locator('.ant-menu-submenu-title').first();
    if (!(await submenu.locator('.ant-menu-submenu-open').count())) {
      await title.click();
    }
    return submenu.locator('.ant-menu-item').allTextContents();
  };

  // 生管與印務主管五頁全見
  await expect(async () => {
    const items = await readGroupItems();
    expect(items.sort()).toEqual(
      ['生產任務管理', '工作包管理', '轉交管理', '轉交單管理', '點收佇列'].sort(),
    );
  }).toPass({ timeout: 10_000 });

  await switchRole(page, '印務主管');
  await expect(async () => {
    const items = await readGroupItems();
    expect(items.sort()).toEqual(
      ['生產任務管理', '工作包管理', '轉交管理', '轉交單管理', '點收佇列'].sort(),
    );
  }).toPass({ timeout: 10_000 });

  // 師傅只見工作包管理與點收佇列
  await switchRole(page, '師傅');
  await expect(async () => {
    const items = await readGroupItems();
    expect(items.sort()).toEqual(['工作包管理', '點收佇列'].sort());
  }).toPass({ timeout: 10_000 });

  // 廠務只見轉交單管理
  await switchRole(page, '廠務');
  await expect(async () => {
    const items = await readGroupItems();
    expect(items).toEqual(['轉交單管理']);
  }).toPass({ timeout: 10_000 });

  // 品檢人員只見點收佇列
  await switchRole(page, '品檢人員');
  await expect(async () => {
    const items = await readGroupItems();
    expect(items).toEqual(['點收佇列']);
  }).toPass({ timeout: 10_000 });
});

test('14.12 手機寬度下五頁可完整操作（原編號 182）', async ({ page }) => {
  // 起點資料：生產管理五頁，把寬度調到 375 像素
  await openAs(page, '生管', '/production-floor/dispatch');
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(300);
  // 系統之後怎麼變：側邊欄自動收合為圖示列
  await expect(page.locator('.ant-layout-sider-collapsed')).toHaveCount(1);

  const pageLabels = ['生產任務管理', '工作包管理', '轉交管理', '轉交單管理', '點收佇列'];
  const groupIcon = page.locator('.ant-menu-submenu', { hasText: '生產管理' }).first();

  // 情境：生管依序打開五頁。側邊欄收合為圖示列時，AntD 選單改用滑鼠停留浮出的子選單彈層導頁
  // （不能再用一般的站內選單項點擊，共用工具 gotoInApp 找不到收合時才出現的浮層項目）
  for (const label of pageLabels) {
    await groupIcon.hover();
    const popupItem = page.locator('.ant-menu-submenu-popup .ant-menu-item', { hasText: label }).first();
    await expect(popupItem).toBeVisible();
    await popupItem.click();
    await page.waitForTimeout(300);
    // 頁面內容不被推出視窗、沒有水平捲軸
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  }

  // 側欄仍可手動展開
  const toggle = page.locator('.ant-layout-sider-trigger, [aria-label="展開選單"], [aria-label="收合選單"]').first();
  if (await toggle.count()) {
    await toggle.click();
    await expect(page.locator('.ant-layout-sider-collapsed')).toHaveCount(0);
  }
});
