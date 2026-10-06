import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import { openWorkOrderFromList } from '../08-process-review-deliver/_page-helpers.mjs';
import {
  closeDrawer,
  confirmDialog,
  dialogOf,
  FAKE_PHOTO,
  formItemOf,
  noticeOf,
  openPackageReports,
  reportRowOf,
} from './_ch10.mjs';

// 情境目錄 10.41～10.43：報工備註、良品與不良品同時為 0 擋下、生產任務歷程統合（Miles 2026-10-06 拍板）。

/** 在工作包單元展開某個工作包，回傳子層某一筆任務列 */
async function packageTaskRow(page, packageNo, taskName) {
  const pkgRow = page.locator('.ant-table-row', { hasText: packageNo }).first();
  const expand = pkgRow.getByLabel('展開行');
  if (await expand.count()) await expand.click();
  return pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: taskName })
    .first();
}

/** 在所有生產任務對某筆任務按「檢視歷程」，回傳生產任務側板 */
async function openTaskDrawer(page, taskName, workOrderNo) {
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill(workOrderNo);
  await search.press('Enter');
  await page
    .locator('tr.ant-table-row', { hasText: taskName })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  await expect(drawer).toContainText(taskName);
  return drawer;
}

test('10.41 報工時可填備註，修改報工時可改；報工紀錄與歷程顯示備註', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '師傅', '/production-floor/work-packages');
  const row = await packageTaskRow(page, 'WP-2026-0710-01', '海報四色印刷');
  await row.getByRole('button', { name: '報工' }).click();

  const dialog = page.locator('.ant-modal-content:visible').last();
  await expect(dialog.locator('thead')).toContainText('備註');
  const line = dialog.locator('tbody tr.ant-table-row').first();
  const inputs = line.locator('input.ant-input-number-input');
  await inputs.nth(0).fill('500');
  await inputs.nth(1).fill('490');
  await inputs.nth(2).fill('10');
  await line.locator('.ant-select').click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option[title="色差"]').click();
  await line.locator('textarea').fill('換版後第二批，色偏已調回');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 生管看工作包報工紀錄：多一欄備註
  await switchRole(page, '生管');
  const reports = await openPackageReports(page, 'WP-2026-0710-01');
  await expect(reports.locator('thead')).toContainText('備註');
  const newRow = reports.locator('tr.ant-table-row', { hasText: '換版後第二批，色偏已調回' }).first();
  await expect(newRow).toBeVisible();

  // 修改：備註帶出原值、可改；儲存後修改紀錄記備註的改前改後
  await newRow.getByRole('button', { name: '修改' }).click();
  const edit = dialogOf(page, '修改報工');
  const remark = formItemOf(edit, '備註').locator('textarea');
  await expect(remark).toHaveValue('換版後第二批，色偏已調回');
  await remark.fill('換版後第二批，色偏已調回；首件已比對');
  await formItemOf(edit, '修改原因').locator('textarea').fill('補記首件');
  await confirmDialog(edit);
  const edited = reports
    .locator('tr.ant-table-row', { hasText: '換版後第二批，色偏已調回；首件已比對' })
    .first();
  await expect(edited).toContainText('備註');
  await closeDrawer(page);

  // 歷程：最上一筆是報工修改（備註前後值），下一筆是報工（備註與生產數量前後值）
  const drawer = await openTaskDrawer(page, '海報四色印刷', 'WO-2026-0710');
  const items = drawer.locator('.ant-timeline-item');
  await expect(items.first()).toContainText('報工修改（補記首件）');
  await expect(items.first()).toContainText('備註：換版後第二批，色偏已調回 → 換版後第二批，色偏已調回；首件已比對');
  await expect(items.nth(1)).toContainText('備註：換版後第二批，色偏已調回');
  await expect(items.nth(1)).toContainText('生產數量：2,000 → 2,500');
});

test('10.42 生產數量大於 0 時，良品數與不良品數不可同時為 0', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '師傅', '/production-floor/work-packages');
  const row = await packageTaskRow(page, 'WP-2026-0710-01', '海報四色印刷');
  await expect(row).toContainText('2,000 / 3,090');
  await row.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-content:visible').last();
  const line = dialog.locator('tbody tr.ant-table-row').first();
  await line.locator('input.ant-input-number-input').nth(0).fill('300');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(line).toContainText('生產數量大於 0 時，良品數與不良品數不可同時為 0');
  await expect(noticeOf(page, '整批未送出')).toBeVisible();
  await page.keyboard.press('Escape');
  // 沒有寫入任何報工：已報數量維持 2,000
  await expect(await packageTaskRow(page, 'WP-2026-0710-01', '海報四色印刷')).toContainText(
    '2,000 / 3,090',
  );

  // 修改既有報工把良品與不良品都改為 0：擋下、數字不變
  await switchRole(page, '印務');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const wr = reportRowOf(reports, '2026-08-25 16:30');
  await wr.getByRole('button', { name: '修改' }).click();
  const edit = dialogOf(page, '修改報工');
  await formItemOf(edit, '良品數').locator('input').fill('0');
  await formItemOf(edit, '不良品數').locator('input').fill('0');
  await formItemOf(edit, '修改原因').locator('textarea').fill('誤報');
  await confirmDialog(edit);
  await expect(noticeOf(page, '生產數量大於 0 時，良品數與不良品數不可同時為 0')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(wr).toContainText('500');
  await expect(wr).toContainText('15（套印不準）');
});

test('10.43 生產任務歷程統合報工、轉交、點收、交付與接收，側板與工單詳情看同一份', async ({
  page,
}) => {
  test.setTimeout(180_000);
  // 生管看證書四色印刷的側板歷程：新到舊，抵達附簽收照片、轉交單連結；報工附現場照片
  await openAs(page, '生管', '/production-floor/dispatch');
  const drawer = await openTaskDrawer(page, '證書四色印刷', 'WO-2026-0812');
  const history = drawer.locator('.ant-timeline');
  const items = history.locator('.ant-timeline-item');
  // 點收類推進來源任務歷程：最上一筆為李榮發點收 480，下一筆為抵達（附簽收照片）
  await expect(items).toHaveCount(9);
  await expect(items.first()).toContainText('轉交 480（搬運數量 500）已由 手工產線 點收');
  await expect(items.first()).toContainText('2026-08-27 10:30｜李榮發');
  await expect(items.first().getByText('TT-20260827-001')).toBeVisible();
  const arrived = items.nth(1);
  await expect(arrived).toContainText('抵達 手工產線（搬運數量 500），附簽收照片 1 張');
  await expect(arrived).toContainText('2026-08-27 09:50｜簡俊男');
  await expect(arrived.getByRole('img')).toHaveCount(1);
  await expect(arrived.getByText('TT-20260827-001')).toBeVisible();
  const report = items.filter({ hasText: '報工：投入 515' }).first();
  await expect(report.getByRole('img')).toHaveCount(1);
  await expect(history).toContainText('開始搬運 500（目的地 手工產線）');
  const sideEvents = await items.allInnerTexts();
  await closeDrawer(page);

  // 印務主管在工單詳情：展開列的歷程與側板同一份；頁籤名「歷程」，跨任務標明任務
  await switchRole(page, '印務主管');
  await openWorkOrderFromList(page, 'WO-2026-0812');
  await expect(page.getByRole('tab', { name: /^報工紀錄/ })).toHaveCount(0);
  const taskRow = page
    .locator('.ant-table-tbody tr.ant-table-row:not(.ant-table-expanded-row)', {
      hasText: '證書四色印刷',
    })
    .first();
  const expand = taskRow.locator('.ant-table-row-expand-icon');
  if ((await expand.getAttribute('class'))?.includes('collapsed')) await expand.click();
  const expanded = page.locator('tr.ant-table-expanded-row', { hasText: '歷程（' }).first();
  const expandedEvents = await expanded.locator('.ant-timeline-item').allInnerTexts();
  expect(expandedEvents).toEqual(sideEvents);

  await page.getByRole('tab', { name: /^歷程（\d+）/ }).click();
  const tabPanel = page.locator('.ant-tabs-tabpane-active');
  await expect(tabPanel.locator('.ant-timeline-item').first()).toContainText(/#\d+ /);
  await expect(tabPanel).toContainText('證書四色印刷');
  await expect(tabPanel).toContainText('信封四色印刷');

  // 廠務抵達站點附簽收照片：海報四色印刷的歷程最上一筆是抵達，附剛上傳的照片
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await ticketRow.getByRole('button', { name: '抵達站點' }).click();
  await page.locator('input[type="file"]').setInputFiles(FAKE_PHOTO('簽收-海報.jpg'));
  await page.getByRole('button', { name: '抵達站點' }).last().click();
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();

  await switchRole(page, '生管');
  const posterDrawer = await openTaskDrawer(page, '海報四色印刷', 'WO-2026-0710');
  const top = posterDrawer.locator('.ant-timeline-item').first();
  await expect(top).toContainText('抵達 手工產線（搬運數量 800），附簽收照片 1 張');
  await expect(top).toContainText('簡俊男');
  await expect(top.getByRole('img')).toHaveCount(1);
  // 點關聯的轉交單號：開所有轉交單並打開該單側板
  await top.getByText('TT-20260830-003').click();
  await expect(page).toHaveURL(/production-floor\/transfers/);
  await expect(page.locator('.ant-drawer-content:visible').last()).toContainText('TT-20260830-003');
});
