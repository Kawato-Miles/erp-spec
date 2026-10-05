import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole, warmUp } from '../_helpers.mjs';

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
  expect(['報工', '編輯工作包']).toContain(tooltipText.trim());
});

test('14.5 欄位說明圖示（原編號 20）', async ({ page }) => {
  // 起點資料：工作包管理頁
  await openAs(page, '生管', '/production-floor/work-packages');

  // 情境：任一角色停留在「確樣備註」「現場進度」「可做量」欄名旁的說明圖示上
  // （本頁包列沒有「可做量」欄——那欄在生產任務子表；包列改停留同樣有說明圖示的「預計完成日」）
  const checks = [
    { label: '確樣備註', textFragment: '現場確樣提醒' },
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

test('14.10 生產管理各單元的角色預設權限（原編號 180）', async ({ page }) => {
  // 起點資料：生產管理群組的單元（產線範圍與負責範圍各綁一個權限）
  await openAs(page, '生管', '/work-orders');
  const readGroupItems = async () => {
    const submenu = page.locator('.ant-menu-submenu', { hasText: '生產管理' }).first();
    if (!(await submenu.count())) return [];
    const title = submenu.locator('.ant-menu-submenu-title').first();
    if (!(await submenu.locator('.ant-menu-submenu-open').count())) {
      await title.click();
    }
    return submenu.locator('.ant-menu-item').allTextContents();
  };
  const LINE_UNITS = ['所有生產任務', '所有工作包', '待轉交任務', '所有轉交單', '點收佇列'];

  // 生管與印務主管：五個產線單元
  await expect(async () => expect(await readGroupItems()).toEqual(LINE_UNITS)).toPass({ timeout: 10_000 });
  await switchRole(page, '印務主管');
  await expect(async () => expect(await readGroupItems()).toEqual(LINE_UNITS)).toPass({ timeout: 10_000 });

  // 師傅：我的生產任務、我的工作包、點收佇列
  await switchRole(page, '師傅');
  await expect(async () =>
    expect(await readGroupItems()).toEqual(['我的生產任務', '我的工作包', '點收佇列']),
  ).toPass({ timeout: 10_000 });

  // 廠務：我的轉交單；品檢人員：點收佇列
  await switchRole(page, '廠務');
  await expect(async () => expect(await readGroupItems()).toEqual(['我的轉交單'])).toPass({ timeout: 10_000 });
  await switchRole(page, '品檢人員');
  await expect(async () => expect(await readGroupItems()).toEqual(['點收佇列'])).toPass({ timeout: 10_000 });

  // 主管：五個產線單元（唯讀檢視，見 9.12）
  await switchRole(page, '主管');
  await expect(async () => expect(await readGroupItems()).toEqual(LINE_UNITS)).toPass({ timeout: 10_000 });
});

test('14.12 手機寬度下生產管理各單元可完整操作（原編號 182）', async ({ page }) => {
  // 起點資料：生產管理五頁，把寬度調到 375 像素
  await openAs(page, '生管', '/production-floor/dispatch');
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(300);
  // 系統之後怎麼變：側邊欄自動收合為圖示列
  await expect(page.locator('.ant-layout-sider-collapsed')).toHaveCount(1);

  const pageLabels = ['所有生產任務', '所有工作包', '待轉交任務', '所有轉交單', '點收佇列'];
  const groupIcon = page.locator('.ant-menu-submenu', { hasText: '生產管理' }).first();

  // 情境：生管依序打開五頁。側邊欄收合為圖示列時，AntD 選單改用滑鼠停留浮出的子選單彈層導頁
  // （不能再用一般的站內選單項點擊，共用工具 gotoInApp 找不到收合時才出現的浮層項目）
  for (const label of pageLabels) {
    await groupIcon.hover();
    const popupItem = page.locator('.ant-menu-submenu-popup .ant-menu-item', { hasText: label }).first();
    await expect(popupItem).toBeVisible();
    await popupItem.click();
    await page.waitForTimeout(300);
    // 頁面內容不被推出視窗、沒有水平捲軸。圖示字型（Material Symbols）載入前，
    // 頁首的通知鈴與角色切換器會先以字面文字渲染而暫時撐寬頁面，故先等字型就緒再量，
    // 並給版面幾秒收斂。
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(
        () =>
          page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        { timeout: 5000, message: `${label}：頁面寬度超過視窗` },
      )
      .toBeLessThanOrEqual(1);
  }

  // 側欄仍可手動展開
  const toggle = page.locator('.ant-layout-sider-trigger, [aria-label="展開選單"], [aria-label="收合選單"]').first();
  if (await toggle.count()) {
    await toggle.click();
    await expect(page.locator('.ant-layout-sider-collapsed')).toHaveCount(0);
  }
});

test('14.28 生產管理權限分產線與負責兩種範圍，看得到就能做', async ({ page }) => {
  test.setTimeout(180_000);
  // 暖機：先整頁載入會用到的路由，避免開發伺服器首次編譯時退回整頁導航、記憶體狀態歸零
  await warmUp(page, [
    '/production-floor/pending-moves',
    '/production-floor/receiving',
    '/production-floor/transfers/mine',
  ]);
  // 模擬角色下拉每位現場人員帶出所屬產線
  await openAs(page, '生管', '/production-floor/dispatch');
  const header = page.locator('header, .ant-layout-header').first();
  await header.locator('.ant-select').first().click();
  const dropdown = page.locator('.ant-select-dropdown:visible').last();
  await expect(dropdown.locator('.ant-select-item-option', { hasText: '生管（許文傑）' })).toContainText(
    '數位產線、裝訂產線、手工產線',
  );
  await page.keyboard.press('Escape');

  // 生管許文傑的所有生產任務看得到鏈三（數位產線）
  await expect(page.locator('tr.ant-table-row', { hasText: '牛皮紙 150g 備料' })).toHaveCount(1);

  // 生管鄭宇翔（手工、壓克力）：只剩手工產線的任務，三筆裁切可勾選打包
  await switchRole(page, '生管（鄭宇翔）');
  await expect(page.locator('tr.ant-table-row', { hasText: '牛皮紙 150g 備料' })).toHaveCount(0);
  const cutRow = page.locator('tr.ant-table-row', { hasText: '證書裁切' }).first();
  await expect(cutRow.locator('input[type="checkbox"]')).toHaveCount(1);
  // 待轉交任務不列精裝裝訂（裝訂產線）
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '精裝裝訂' })).toHaveCount(0);
  // 點收佇列列出兩張目的站為手工產線的已送達單並可點收
  await gotoInApp(page, '/production-floor/receiving');
  for (const no of ['TT-20260830-002', 'TT-20260827-002']) {
    await expect(page.locator('tr.ant-table-row', { hasText: no }).getByRole('button', { name: '點收' })).toBeVisible();
  }

  // 廠務簡俊男的我的轉交單列出既有轉交單；邱志明的一張都沒有
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers/mine');
  await expect(page.locator('tr.ant-table-row', { hasText: 'TT-20260830-003' })).toHaveCount(1);
  await switchRole(page, '廠務（邱志明）');
  await expect(page.locator('tr.ant-table-row', { hasText: /TT-/ })).toHaveCount(0);
});
