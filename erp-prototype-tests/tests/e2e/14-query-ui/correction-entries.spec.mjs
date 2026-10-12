import { test, expect } from '@playwright/test';
import { attachReportPhotos, gotoInApp, openAs, switchRole, taskRows } from '../_helpers.mjs';
import { cellText } from '../08-process-review-deliver/_page-helpers.mjs';
import { confirmDialog, dialogOf, noticeOf } from '../10-report-transfer/_ch10.mjs';

// 情境目錄 14.31～14.35（2026-10-12）：生產與出貨介面修正第一包——工單詳情轉交進度、
// 工單詳情檢視鈕與報工修正範圍、報工紀錄縮圖兩欄、點收類操作都在母層、我的生產任務只改自己的報工。
// 純函式（轉交進度文字、修正範圍判定）另見 tests/unit/production-floor。

test.setTimeout(180_000);

const drawerOf = (page) => page.locator('.ant-drawer-content:visible').last();

async function openCertificateTaskDrawerOnAllTasks(page) {
  await openAs(page, '生管', '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0812');
  await search.press('Enter');
  await page
    .locator('tr.ant-table-row', { hasText: '證書四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  const drawer = drawerOf(page);
  await expect(drawer).toContainText('報工紀錄');
  return drawer;
}

test('14.31 工單詳情轉交進度欄只顯示搬運量與點收量兩個數字，生產數量排在轉交進度前面', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  const headers = (
    await page.locator('.ant-table-thead tr').last().locator('th').allInnerTexts()
  ).map((t) => t.trim());
  const at = (label) => headers.findIndex((t) => t.startsWith(label));
  expect(at('生產數量')).toBeGreaterThanOrEqual(0);
  expect(at('轉交狀態')).toBeLessThan(at('生產數量'));
  expect(at('生產數量')).toBeLessThan(at('轉交進度'));
  await expect(
    page.locator('.ant-table-thead th').filter({ hasText: '轉交進度' }).first(),
  ).toContainText('轉交進度（搬運量／點收量）');
  await expect
    .poll(() => cellText(page, '證書四色印刷', '轉交進度（搬運量／點收量）'))
    .toBe('500／480');
  await expect
    .poll(() => cellText(page, '證書裁切', '轉交進度（搬運量／點收量）'))
    .toBe('0／0');
  await expect(taskRows(page).filter({ hasText: '證書四色印刷' })).not.toContainText('良品 500／點收');
});

test('14.32 工單詳情的生產任務列按檢視開生產任務側板；負責印務可修正報工，其他人唯讀', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  const certRow = () => taskRows(page).filter({ hasText: '證書四色印刷' }).first();
  await certRow().getByRole('button', { name: '檢視', exact: true }).click();
  let drawer = drawerOf(page);
  await expect(drawer).toContainText('基本資料');
  await expect(drawer).toContainText('報工紀錄');
  const firstReport = drawer.locator('tr.ant-table-row').first();
  await expect(firstReport.getByRole('button', { name: '修正', exact: true })).toHaveCount(1);
  await expect(firstReport.getByRole('button', { name: '作廢', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 切成不是這張工單負責人、也不是編輯分享成員的印務主管：同一個側板，報工唯讀
  await switchRole(page, '印務主管');
  await certRow().getByRole('button', { name: '檢視', exact: true }).click();
  drawer = drawerOf(page);
  await expect(drawer).toContainText('報工紀錄');
  await expect(drawer.locator('tr.ant-table-row').first()).toBeVisible();
  await expect(drawer.getByRole('button', { name: '修正', exact: true })).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: '作廢', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 任務展開列仍顯示歷程
  await certRow().locator('.ant-table-row-expand-icon').click();
  await expect(page.getByText(/^歷程（\d+）$/).first()).toBeVisible();
});

test('14.33 報工紀錄表最左兩欄固定放完稿縮圖與報工照片', async ({ page }) => {
  const drawer = await openCertificateTaskDrawerOnAllTasks(page);
  const heads = (await drawer.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim());
  expect(heads.slice(0, 2)).toEqual(['完稿縮圖', '報工照片']);
  expect(heads).not.toContain('照片');
  const first = drawer.locator('tbody tr.ant-table-row').first();
  await expect(first.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  await expect(first.locator('td').nth(1).getByRole('img')).toHaveCount(1);
  // 兩欄固定在左側
  await expect(drawer.locator('thead th').nth(0)).toHaveClass(/ant-table-cell-fix-left/);
  await expect(drawer.locator('thead th').nth(1)).toHaveClass(/ant-table-cell-fix-left/);
  // 縮圖欄不顯示檔名
  await expect(first.locator('td').nth(1)).not.toContainText('.jpg');
});

test('14.34 所有轉交單的作廢點收紀錄在母層，子層不再有；點收對話框明細表最左有完稿縮圖', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');
  const search = page.getByPlaceholder(/轉交單編號/).first();
  await search.fill('TT-20260827-001');
  await search.press('Enter');
  const main = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-001' }).first();
  await expect(main.getByRole('button', { name: '點收', exact: true })).toHaveCount(1);
  await expect(main.getByRole('button', { name: '修正點收紀錄' })).toHaveCount(1);
  await expect(main.getByRole('button', { name: '作廢點收紀錄' })).toHaveCount(1);

  await main.locator('.ant-table-row-expand-icon').click();
  const sub = page.locator('tr.ant-table-expanded-row').first();
  await expect(sub.getByRole('button', { name: '作廢點收紀錄' })).toHaveCount(0);

  // 母層作廢點收紀錄：對話框列出有效點收紀錄供勾選；不勾選或不填原因都擋下
  await main.getByRole('button', { name: '作廢點收紀錄' }).click();
  const voidDialog = dialogOf(page, '作廢點收紀錄');
  await expect(voidDialog).toContainText('證書四色印刷');
  await expect(voidDialog).toContainText('480');
  await expect(voidDialog.locator('.ant-radio-input, .ant-checkbox-input').first()).toBeVisible();
  // 不勾選：擋下；勾選但不填原因：擋下
  await confirmDialog(voidDialog);
  await expect(noticeOf(page, /請勾選要作廢的點收紀錄/)).toBeVisible();
  await voidDialog.locator('tbody tr.ant-table-row').first().locator('input').first().check({ force: true });
  await confirmDialog(voidDialog);
  await expect(noticeOf(page, /請填作廢原因/)).toBeVisible();
  await voidDialog.getByRole('button', { name: '取消' }).click();

  // 點收對話框：明細表第一欄為完稿縮圖
  await main.getByRole('button', { name: '點收', exact: true }).click();
  const receiveDialog = dialogOf(page, '點收');
  await expect(receiveDialog.locator('thead th').first()).toHaveText('完稿縮圖');
  await expect(receiveDialog.locator('tbody tr.ant-table-row').first().locator('td').first().getByRole('img')).toHaveCount(1);
});

test('14.35 我的生產任務的側板只能修正與作廢自己提交的報工', async ({ page }) => {
  // 前置：生管許文傑在所有工作包展開 WP-2026-0812-01，對信封四色印刷代報一筆
  await openAs(page, '生管', '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  await pkgRow.getByLabel('展開行').click();
  await pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '信封四色印刷' })
    .first()
    .getByRole('button', { name: '報工', exact: true })
    .click();
  const line = page.locator('.ant-modal-body tbody tr.ant-table-row').first();
  await line.locator('input').nth(0).fill('100');
  await line.locator('input').nth(1).fill('100');
  await attachReportPhotos(page);
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 師傅劉阿海在我的生產任務開同一筆任務的側板
  await switchRole(page, '師傅');
  await gotoInApp(page, '/production-floor/dispatch/mine');
  await page
    .locator('tr.ant-table-row', { hasText: '信封四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  const drawer = drawerOf(page);
  await expect(drawer).toContainText('報工紀錄');
  const proxyRow = drawer.locator('tr.ant-table-row', { hasText: '許文傑' }).first();
  await expect(proxyRow).toBeVisible();
  await expect(proxyRow.getByRole('button', { name: '修正', exact: true })).toHaveCount(0);
  await expect(proxyRow.getByRole('button', { name: '作廢', exact: true })).toHaveCount(0);
  const ownRow = drawer.locator('tr.ant-table-row', { hasText: '劉阿海' }).first();
  await expect(ownRow.getByRole('button', { name: '修正', exact: true })).toHaveCount(1);
  await expect(ownRow.getByRole('button', { name: '作廢', exact: true })).toHaveCount(1);
});
