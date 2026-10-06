import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';

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
  // 主表不設狀態欄，欄位含工作包編號、指派師傅、預計完成日、備註、確樣備註、現場進度、操作
  await expect(page.getByRole('columnheader', { name: '工作包編號' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '指派師傅' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '預計完成日' })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '確樣備註' })).toBeVisible();
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

test('9.5 師傅在我的工作包只看得到自己被指派的工作包（原編號 17）', async ({ page }) => {
  await openAs(page, '師傅', '/production-floor/work-packages');
  await expect(page.getByText('我的工作包').first()).toBeVisible();
  await expect(page.getByText('WP-2026-0710-01')).toBeVisible();
  await expect(page.getByText('WP-2026-0710-02')).toHaveCount(0); // 李榮發的包
  await expect(page.getByText('WP-2026-0601-01')).toHaveCount(0); // 陳金水的包

  // 我的生產任務：只列這些工作包裡的任務，唯讀（沒有勾選欄、打包與取消工作包）
  await gotoInApp(page, '/production-floor/dispatch/mine');
  await expect(page.locator('tr.ant-table-row', { hasText: 'WP-2026-0710-01' }).first()).toBeVisible();
  await expect(page.locator('tr.ant-table-row', { hasText: 'WP-2026-0710-02' })).toHaveCount(0);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '取消工作包' })).toHaveCount(0);
});

test('9.11 現場三頁的印件內部完成日印合併格式', async ({ page }) => {
  // 起點資料：鏈四 WO-2026-0820（三天急件，印件內部完成日 2026-09-04、未扣急件 2026-09-09）
  // 與鏈三 WO-2026-0815（一般件，兩個日期同為 2026-10-02）
  // 期望值取自 Miles 2026-09-21 拍板的合併格式與工作天算式，不由實作反推。
  // 三頁的順序先開工廠總覽：它在側欄另一個群組，站內導頁進得去、出得來（見 9.7）
  await openAs(page, '生管', '/production-floor/schedule');
  const scheduleRow = page
    .locator('.ant-table')
    .last()
    .locator('tr', { hasText: 'WO-2026-0815' })
    .first();
  await expect(scheduleRow).toContainText('2026-10-02');
  await expect(scheduleRow.getByText('未扣急件')).toHaveCount(0);

  // 生產任務管理：待派清單只有鏈三四筆（一般件），只印一組日期、不加括號
  await gotoInApp(page, '/production-floor/dispatch');
  const dispatchRow = page.locator('tr', { hasText: '牛皮紙 150g 備料' }).first();
  await expect(dispatchRow).toContainText('2026-10-02');
  await expect(dispatchRow.getByText('未扣急件')).toHaveCount(0);

  // 工作包管理：展開鏈四任一包，旗下任務的印件內部完成日帶括號印出未扣值
  await gotoInApp(page, '/production-floor/work-packages');
  const urgentPkg = page.locator('tr', { hasText: 'WP-2026-0820-01' });
  await urgentPkg.getByLabel('展開行').click();
  const urgentTasks = urgentPkg.locator('xpath=following-sibling::tr[1]');
  await expect(urgentTasks).toContainText('2026-09-04（未扣急件 2026-09-09）');
});

test('9.13 工作包的師傅不可改，換人走取消工作包後重新打包；取消即刪除，報工不帶工作包連結', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點資料：鏈二 WP-2026-0710-02（指派師傅李榮發，旗下裁切成型）
  await openAs(page, '生管', '/production-floor/work-packages');
  const row = page.locator('tr', { hasText: 'WP-2026-0710-02' });
  await expect(row).toContainText('李榮發');
  await expect(row.getByRole('button', { name: '調整師傅' })).toHaveCount(0);
  await row.getByRole('button', { name: '編輯工作包' }).click();

  const dialog = page.locator('.ant-modal-content').filter({ hasText: '編輯工作包：WP-2026-0710-02' });
  await expect(dialog).toBeVisible();
  // 指派師傅唯讀
  await expect(dialog.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select')).toHaveClass(
    /ant-select-disabled/,
  );
  await dialog.getByRole('button', { name: /儲\s*存/ }).click();
  await expect(page.getByText('WP-2026-0710-02 已更新')).toBeVisible();
  await expect(dialog).toBeHidden();

  // 到所有生產任務取消工作包：工作包消失、裁切成型回待派，可勾選
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  const taskRow = page.locator('tr.ant-table-row', { hasText: '裁切成型' }).first();
  await expect(taskRow).toContainText('WP-2026-0710-02');
  await taskRow.getByRole('button', { name: '取消工作包' }).click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: '取消工作包' }).click();
  await expect(page.getByText(/已取消工作包 WP-2026-0710-02/)).toBeVisible();
  await expect(taskRow).not.toContainText('WP-2026-0710-02');

  // 取消即刪除（2026-10-06 拍板 D2）：所有工作包不再列出 WP-2026-0710-02（模擬角色切換器沒有李榮發，
  // 我的工作包那一半以純函式驗）；裁切成型的狀態不變（仍為待處理），指派師傅變空
  await expect(taskRow).toContainText('待處理');
  await gotoInApp(page, '/production-floor/work-packages');
  await expect(page.locator('tr.ant-table-row', { hasText: 'WP-2026-0710-02' })).toHaveCount(0);
  await gotoInApp(page, '/production-floor/dispatch');
  await search.fill('WO-2026-0710');
  await search.press('Enter');

  // 重新打包給陳金水
  // 等確認框收起再勾，避免點到正在淡出的遮罩
  await expect(page.locator('.ant-modal-confirm:visible')).toHaveCount(0);
  await expect(async () => {
    await taskRow.locator('.ant-checkbox').first().click();
    await expect(taskRow.locator('input[type="checkbox"]')).toBeChecked({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
  await page.getByRole('button', { name: /派工（1）/ }).click();
  const packDialog = page.locator('.ant-modal-content').filter({ hasText: '派工內容' });
  await packDialog.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: '陳金水' }).click();
  await page.getByRole('button', { name: '確認派工' }).click();
  await expect(page.getByText(/已建立工作包 WP-.*指派 陳金水/)).toBeVisible();
  await expect(taskRow).toContainText('師傅 陳金水');
});
