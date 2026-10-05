import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp, taskRows } from '../_helpers.mjs';
import { openWorkOrder, taskForm, formField } from '../07-process-planning/_ch07.mjs';
import {
  closeDrawer,
  confirmDialog,
  detailRowOf,
  dialogOf,
  editReport,
  formItemOf,
  noticeOf,
  openPackageReports,
  openTicketDrawer,
  receiveInQueue,
  reportRowOf,
  subCell,
  ticketDetailSubRow,
} from './_ch10.mjs';

// 情境目錄 10.27～10.30、10.33～10.36、10.38、10.39：逐條點收、再次點收、點收修改、
// 已送達不可作廢、報工修改與作廢共用擋下條件、作廢重開重走搬運。
// 純函式段（10.26、10.31、10.32、10.37 與各節的合成資料）在 tests/unit/production-floor/。
// 起點資料：鏈外 WO-2026-0812（TT-20260827-001 已點收 480／搬運數量 500；TT-20260827-002 已送達，
// 內卡 200、信封 300）、鏈二 WO-2026-0710（TT-20260830-002 已送達 1,190、TT-20260830-003 搬運中 800）。

// 印務打開 WO-2026-0812 工單詳情，回傳某筆生產任務的任務列
const certWorkOrderTaskRow = async (page, taskName) => {
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0812');
  return taskRows(page).filter({ hasText: taskName }).first();
};

test('10.27 首次點收逐條填實際量，點收數量不擋超過搬運數量', async ({ page }) => {
  test.setTimeout(120_000);
  // 點收前：兩筆任務的轉交進度點收量為 0，不另設送達待收的標記
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0812');
  await expect(taskRows(page).filter({ hasText: '信封四色印刷' }).first()).toContainText('轉交量 300／點收量 0／良品 300');
  await expect(taskRows(page).filter({ hasText: '內卡四色印刷' }).first()).toContainText('轉交量 200／點收量 0／良品 200');

  // 生管在點收佇列代手工產線點收：對話框每條明細一列，點收數量預設帶搬運數量
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/receiving');
  await page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' }).getByRole('button', { name: '點收' }).click();
  const dialog = dialogOf(page, '點收');
  const cardInput = dialog.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input');
  const envelopeInput = dialog.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input');
  await expect(cardInput).toHaveValue(/^200$/);
  await expect(envelopeInput).toHaveValue(/^300$/);

  // 內卡 200、信封改填 280 後送出成立（填超過搬運數量照收，以純函式驗）
  await envelopeInput.fill('280');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /已點收 TT-20260827-002/)).toBeVisible();

  // 側板明細的點收數量分別為 200 與 280
  const drawer = await openTicketDrawer(page, 'TT-20260827-002');
  await expect(drawer).toContainText('已點收');
  await expect(detailRowOf(drawer, '內卡四色印刷')).toContainText('200');
  await expect(detailRowOf(drawer, '信封四色印刷')).toContainText('280');
  await closeDrawer(page);

  // 工單任務列表：轉交進度照實顯示轉交量、點收量與良品數
  await switchRole(page, '印務');
  const envelopeRow = await certWorkOrderTaskRow(page, '信封四色印刷');
  await expect(envelopeRow).toContainText('轉交量 300／點收量 280／良品 300');
  await expect(envelopeRow).not.toContainText('有貨待點收');
  const cardRow = taskRows(page).filter({ hasText: '內卡四色印刷' }).first();
  await expect(cardRow).toContainText('轉交量 200／點收量 200／良品 200');
});

test('10.28 短少照實點收，已送達的單不可作廢', async ({ page }) => {
  test.setTimeout(120_000);
  // 已送達的 TT-20260830-002：生管看不到作廢操作
  await openAs(page, '生管', '/production-floor/transfers');
  const arrivedRow = page.locator('tr', { hasText: 'TT-20260830-002' });
  await expect(arrivedRow).toContainText('已送達');
  await expect(arrivedRow.getByRole('button', { name: '作廢' })).toHaveCount(0);

  // 現場只點到 1,150：生管代點收、點收量填 1,150
  await receiveInQueue(page, 'TT-20260830-002', { 海報四色印刷: 1150 });
  await expect(noticeOf(page, /已點收 TT-20260830-002/)).toBeVisible();
  const drawer = await openTicketDrawer(page, 'TT-20260830-002');
  await expect(drawer).toContainText('已點收');
  await expect(detailRowOf(drawer, '海報四色印刷')).toContainText('1,150');
  await closeDrawer(page);

  // 裁切成型的到料量為 1,150
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  await expect(pkgRow.locator('xpath=following-sibling::tr[1]')).toContainText('1,150／3,000');

  // 結果樣本 TT-20260827-001：搬運數量 500、點收數量 480，差額留在明細；證書四色印刷停在待點收
  const sample = await openTicketDrawer(page, 'TT-20260827-001');
  const certDetail = detailRowOf(sample, '證書四色印刷');
  await expect(certDetail).toContainText('500');
  await expect(certDetail).toContainText('480');
  await closeDrawer(page);

  await switchRole(page, '印務');
  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('待點收');
});

test('10.29 貨補到後對同一明細再次點收，點收數量可超過搬運數量', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/transfers');
  // 再次點收在所有轉交單母層展開後的子層明細列上
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await subRow.getByRole('button', { name: '再次點收' }).click();
  const dialog = dialogOf(page, '再次點收');
  const qtyInput = dialog.locator('.ant-input-number-input').first();
  // 預設帶 20（搬運數量 500 減點收數量 480）
  await expect(qtyInput).toHaveValue(/^20$/);

  await confirmDialog(dialog);
  await expect(subCell(subRow, '點收數量')).toHaveText('500');
  // 最近點收改為這一筆（點收人許文傑）
  await expect(subCell(subRow, '最近點收')).toContainText('許文傑');
  const drawer = await openTicketDrawer(page, 'TT-20260827-001');
  await expect(detailRowOf(drawer, '證書四色印刷')).toContainText('500');
  // 單頭維持已點收；歷程新增一筆再次點收（點收量 20、點收人）
  await expect(drawer).toContainText('已點收');
  await expect(drawer).toContainText(/再次點收.*20/);
  await expect(drawer).toContainText('許文傑');
  await closeDrawer(page);

  await switchRole(page, '印務');
  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
});

test('10.30 收貨人點錯數修改點收數量並填原因，低於下游已報工量時擋下', async ({ page }) => {
  test.setTimeout(120_000);
  // 點收佇列的「修改」與點收共用同一個對話框，修改模式多一格必填的修改原因
  await openAs(page, '生管', '/production-floor/receiving');
  const row = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-001' });
  await row.getByRole('button', { name: '修改' }).click();
  const dialog = dialogOf(page, '修改點收數量');
  const certInput = dialog.locator('tr', { hasText: '證書四色印刷' }).locator('.ant-input-number-input');
  await expect(certInput).toHaveValue(/^480$/); // 帶目前的點收數量

  // 改成 490、不填原因：擋下送出
  await certInput.fill('490');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /修改原因/)).toBeVisible();

  // 填原因「重點數量」後送出成立：點收數量 490，列留在佇列上
  await formItemOf(dialog, '修改原因').locator('textarea').first().fill('重點數量');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /已修改 TT-20260827-001 的點收數量/)).toBeVisible();
  await expect(row).toContainText('已點收');

  // 歷程記修改前後值與原因；證書裁切的到料量隨之改為 490（見 10.31）
  const drawer = await openTicketDrawer(page, 'TT-20260827-001');
  await expect(detailRowOf(drawer, '證書四色印刷')).toContainText('490');
  await expect(drawer).toContainText('已點收');
  await expect(drawer).toContainText(/480.*490/);
  await expect(drawer).toContainText('重點數量');
});

test('10.33 短少改報工與補做再報工的轉交狀態走法', async ({ page }) => {
  test.setTimeout(180_000);
  // 確定 20 張找不到：印務把證書四色印刷那筆報工的良品由 500 改為 480，原因「搬運遺失」
  await openAs(page, '印務', '/production-floor/work-packages');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), { good: 480, reason: '搬運遺失' });
  await expect(reportRowOf(reports, '2026-08-25 16:30')).toContainText('480');
  await closeDrawer(page);

  let certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
  await expect(certRow).toContainText('轉交量 500／點收量 480／良品 480');

  // 轉交可申請上限 −20：生管的待搬視圖不出現證書四色印刷
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '證書四色印刷' })).toHaveCount(0);

  // 客戶仍要 500 套：印務對原任務再報工良品 20，任務維持已完成、轉交狀態回到待點收
  await switchRole(page, '印務');
  certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await certRow.getByRole('button', { name: '報工', exact: true }).click();
  const reportDialog = page.locator('.ant-modal-body');
  const inputs = reportDialog.locator('tr', { hasText: '證書四色印刷' }).locator('input');
  await inputs.nth(0).fill('20');
  await inputs.nth(1).fill('20');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
  certRow = taskRows(page).filter({ hasText: '證書四色印刷' }).first();
  await expect(certRow).toContainText('已完成');
  await expect(certRow).toContainText('待點收');

  // 收貨人對原明細再次點收 20 → 已轉交
  await switchRole(page, '生管');
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await subRow.getByRole('button', { name: '再次點收' }).click();
  await confirmDialog(dialogOf(page, '再次點收'));
  await expect(subCell(subRow, '點收數量')).toHaveText('500');

  await switchRole(page, '印務');
  certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
});

test('10.34 報工修改三欄可改、原因必填、留修改紀錄、調升不擋', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '印務', '/production-floor/work-packages');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const row = reportRowOf(reports, '2026-08-25 16:30');

  // 修改對話框只開放生產數量、良品數、不良品數三欄
  await row.getByRole('button', { name: '修改' }).click();
  const dialog = dialogOf(page, '修改');
  await expect(dialog.locator('.ant-input-number')).toHaveCount(3);
  await expect(formItemOf(dialog, '生產數量')).toBeVisible();
  await expect(formItemOf(dialog, '良品數')).toBeVisible();
  await expect(formItemOf(dialog, '不良品數')).toBeVisible();

  // 只把良品改為 480、不填原因：擋下送出
  await formItemOf(dialog, '良品數').locator('input').fill('480');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /修改原因/)).toBeVisible();

  // 填原因「搬運遺失」後送出成立
  await formItemOf(dialog, '修改原因').locator('input, textarea').first().fill('搬運遺失');
  await confirmDialog(dialog);
  await expect(row).toContainText('480');

  // 改回 500 屬調升、不被擋
  await editReport(page, row, { good: 500, reason: '貨已找回' });
  await expect(row).toContainText('500');
  await closeDrawer(page);

  // 任務歷程新增一筆報工修改，前後值列良品數 500 → 480
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0812-01' });
  await pkgRow.getByLabel('展開行').click();
  await pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '證書四色印刷' })
    .getByRole('button', { name: '檢視歷程' })
    .click();
  const history = page.locator('.ant-drawer-content:visible').last();
  await expect(history).toContainText('良品數：500 → 480');
});

test('10.35 報工修改與作廢共用擋下條件：在途與已點收量、下游已動工、已驗量', async ({ page }) => {
  test.setTimeout(120_000);
  // 海報四色印刷第二筆報工（投入 1,000、良品 1,000）的良品改為 900：改後 1,890 低於 1,990，擋下並列出兩張單
  await openAs(page, '印務', '/production-floor/work-packages');
  const posterReports = await openPackageReports(page, 'WP-2026-0710-01');
  await editReport(page, reportRowOf(posterReports, '2026-08-29 16:45'), { good: 900, reason: '誤報' });
  const blocked = noticeOf(page, 'TT-20260830-003');
  await expect(blocked).toBeVisible();
  await expect(blocked).toContainText('先作廢尚未送達的單');
  await expect(blocked).toContainText('TT-20260830-002');
  await expect(blocked).toContainText('先照實點收');
  await page.keyboard.press('Escape');
  await closeDrawer(page);

  // 報工人員作廢信封四色印刷那筆報工：作廢後良品 0 低於已送達的 300，擋下並列出 TT-20260827-002
  await switchRole(page, '師傅');
  const envelopeReports = await openPackageReports(page, 'WP-2026-0812-01');
  await reportRowOf(envelopeReports, '2026-08-26 15:40').getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  const voidBlocked = noticeOf(page, 'TT-20260827-002');
  await expect(voidBlocked).toBeVisible();
  await expect(voidBlocked).toContainText('先照實點收');
});

test('10.36 已完成任務作廢擋下改走修改；修改跌破目標退回製作中；已完成後再報工維持已完成', async ({ page }) => {
  test.setTimeout(120_000);
  // 印務對證書四色印刷（已完成）那筆報工按作廢：被擋下，「修改」仍可用
  await openAs(page, '印務', '/production-floor/work-packages');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const row = reportRowOf(reports, '2026-08-25 16:30');
  await row.getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  await expect(noticeOf(page, /已完成.*報工不可作廢/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(row.getByRole('button', { name: '修改' })).toBeEnabled();
  await closeDrawer(page);

  // 從印務入口對這筆已完成任務再報工生產數量 20、良品 20：照收，累計 535，任務維持已完成
  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await certRow.getByRole('button', { name: '報工', exact: true }).click();
  const inputs = page.locator('.ant-modal-body').locator('tr', { hasText: '證書四色印刷' }).locator('input');
  await inputs.nth(0).fill('20');
  await inputs.nth(1).fill('20');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
  const after = taskRows(page).filter({ hasText: '證書四色印刷' }).first();
  await expect(after).toContainText('535');
  await expect(after).toContainText('已完成');
});

test('10.38 搬運中作廢重開沿用原單目的地、重走搬運，沒有「貨已在現場」', async ({ page }) => {
  test.setTimeout(180_000);
  // 印務先把海報四色印刷的目的站點改為「裝訂產線」
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0710');
  await taskRows(page)
    .filter({ hasText: '海報四色印刷' })
    .getByRole('button', { name: '編輯備註與目的站點' })
    .click();
  await formField(page, '目的站點').locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '裝訂產線' })
    .click();
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(page.getByText(/已更新目的站點/)).toBeVisible();

  // 生管作廢搬運中的 TT-20260830-003（原因「數量填錯」）
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  const movingRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await movingRow.getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '數量填錯' })
    .click();
  await page.getByRole('button', { name: '作廢這張單' }).click();
  await expect(page.locator('.ant-message').getByText(/TT-20260830-003 已作廢/)).toBeVisible();

  // 作廢成立當下明細退出轉交量：海報四色印刷的可搬量由 0 回到 800
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '海報四色印刷' })).toContainText('800');

  // 重開新單：畫面沒有「貨已在現場」勾選；新單目的地沿用原單手工產線，停在待搬運
  await gotoInApp(page, '/production-floor/transfers');
  await page.locator('tr', { hasText: 'TT-20260830-003' }).getByRole('button', { name: '重開' }).click();
  const reopen = dialogOf(page, '重開');
  await expect(reopen).toBeVisible();
  await expect(reopen.getByText('貨已在現場')).toHaveCount(0);
  await confirmDialog(reopen);
  const toast = page.getByText(/已重開 TT-\d{8}-\d{3}/).last();
  await expect(toast).toBeVisible();
  const newNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];
  const newRow = page.locator('tr', { hasText: newNo });
  await expect(newRow).toContainText('手工產線');
  await expect(newRow).toContainText('待搬運');
  await expect(newRow).not.toContainText('裝訂產線');
});

test('10.39 轉交狀態兩條邊界：轉交點收量多於良品時點收不擋、落在轉交中', async ({ page }) => {
  test.setTimeout(180_000);
  // 前置同 10.33 前兩步：印務把證書四色印刷的報工良品改為 480（點收數量 480、已轉交）
  await openAs(page, '印務', '/production-floor/work-packages');
  let reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), { good: 480, reason: '搬運遺失' });
  await expect(reportRowOf(reports, '2026-08-25 16:30')).toContainText('480');
  await closeDrawer(page);

  // 貨找回了：生管代手工產線對 TT-20260827-001 那條明細再次點收 20，系統不以良品數擋下
  await switchRole(page, '生管');
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await subRow.getByRole('button', { name: '再次點收' }).click();
  const again = dialogOf(page, '再次點收');
  await again.locator('.ant-input-number-input').first().fill('20');
  await confirmDialog(again);
  await expect(subCell(subRow, '點收數量')).toHaveText('500');

  await switchRole(page, '印務');
  let certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('轉交中');
  await expect(certRow).toContainText('轉交量 500／點收量 500／良品 480');

  // 印務再把報工良品改回 500 → 已轉交
  reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), { good: 500, reason: '貨已找回' });
  await closeDrawer(page);
  certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
  await expect(certRow).toContainText('轉交量 500／點收量 500／良品 500');
});
