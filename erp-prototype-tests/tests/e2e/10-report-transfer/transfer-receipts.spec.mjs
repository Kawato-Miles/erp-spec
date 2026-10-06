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
  editMoveQty,
  voidReceipt,
  voidTicket,
} from './_ch10.mjs';

// 情境目錄 10.27～10.30、10.33～10.36、10.38、10.39、10.59：點收單一動作、再點收一筆、點收修改與點收紀錄作廢、
// 點收前可作廢、搬運數量修改、報工修改與作廢共用擋下條件、作廢重開重走搬運。
// 2026-10-06 改版：不分首次與再次點收、不設代點收；修改原因自由填寫、不驗固定字樣。
// 純函式段（10.26、10.31、10.32、10.37 與各節的合成資料）在 tests/unit/production-floor/。
// 起點資料：鏈外 WO-2026-0812（TT-20260827-001 已點收 480／搬運數量 500；TT-20260827-002 已送達，
// 內卡 200、信封 300）、鏈二 WO-2026-0710（TT-20260830-002 已送達 1,190、TT-20260830-003 搬運中 800）。

// 印務打開 WO-2026-0812 工單詳情，回傳某筆生產任務的任務列
const certWorkOrderTaskRow = async (page, taskName) => {
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0812');
  return taskRows(page).filter({ hasText: taskName }).first();
};

test('10.27 點收單一動作：逐條填實際量，第一筆轉已點收；點收量大於 0、不擋超過搬運數量；可填備註', async ({ page }) => {
  test.setTimeout(120_000);
  // 點收前：兩筆任務的轉交進度點收量為 0，不另設送達待收的標記
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0812');
  await expect(taskRows(page).filter({ hasText: '信封四色印刷' }).first()).toContainText('轉交量 300／點收量 0／良品 300');
  await expect(taskRows(page).filter({ hasText: '內卡四色印刷' }).first()).toContainText('轉交量 200／點收量 0／良品 200');

  // 生管在點收佇列點收：對話框每條明細一列（帶目的站點），點收數量可改、可填備註
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/receiving');
  await page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' }).getByRole('button', { name: '點收' }).click();
  const dialog = dialogOf(page, '點收');
  await expect(dialog).toContainText('裁切站');
  const cardLine = dialog.locator('tr', { hasText: '內卡四色印刷' });
  const envelopeLine = dialog.locator('tr', { hasText: '信封四色印刷' });
  const cardInput = cardLine.locator('.ant-input-number-input');
  const envelopeInput = envelopeLine.locator('.ant-input-number-input');

  // 內卡清空（輸入框最小只收 1，填 0 會被框成 1；填 0 的擋下由資料層把關，見 10.59 純函式）：擋下，提示請填點收量
  await cardInput.fill('');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /請填點收量/)).toBeVisible();

  // 內卡 200、信封改填 280 並備註「少一落，待查」後送出成立
  await cardInput.fill('200');
  await envelopeInput.fill('280');
  await envelopeLine.locator('textarea, input:not(.ant-input-number-input)').first().fill('少一落，待查');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /已點收 TT-20260827-002/)).toBeVisible();

  // 側板明細的點收數量分別為 200 與 280；點收人記實際操作的許文傑、沒有代點收字樣；備註看得到
  const drawer = await openTicketDrawer(page, 'TT-20260827-002');
  await expect(drawer).toContainText('已點收');
  await expect(detailRowOf(drawer, '內卡四色印刷')).toContainText('200');
  await expect(detailRowOf(drawer, '信封四色印刷')).toContainText('280');
  await expect(drawer).toContainText('少一落，待查');
  await expect(drawer).toContainText('許文傑');
  await expect(drawer.getByText(/代點收/)).toHaveCount(0);
  await closeDrawer(page);

  // 工單任務列表：轉交進度照實顯示轉交量、點收量與良品數
  await switchRole(page, '印務');
  const envelopeRow = await certWorkOrderTaskRow(page, '信封四色印刷');
  await expect(envelopeRow).toContainText('轉交量 300／點收量 280／良品 300');
  await expect(envelopeRow).not.toContainText('有貨待點收');
  const cardRow = taskRows(page).filter({ hasText: '內卡四色印刷' }).first();
  await expect(cardRow).toContainText('轉交量 200／點收量 200／良品 200');
});

test('10.28 已送達的單可作廢重建，或照實點收', async ({ page }) => {
  test.setTimeout(120_000);
  // 已送達的 TT-20260830-002：生管看得到作廢操作（點收前的單都可作廢），作廢原因為文字輸入
  await openAs(page, '生管', '/production-floor/transfers');
  const arrivedRow = page.locator('tr', { hasText: 'TT-20260830-002' });
  await expect(arrivedRow).toContainText('已送達');
  await expect(arrivedRow.getByRole('button', { name: '作廢' })).toHaveCount(1);
  await arrivedRow.getByRole('button', { name: '作廢' }).click();
  const voidDialog = dialogOf(page, '作廢轉交單');
  await expect(formItemOf(voidDialog, '作廢原因').locator('textarea, input').first()).toBeEditable();
  await expect(formItemOf(voidDialog, '作廢原因').locator('.ant-select')).toHaveCount(0);
  // 不作廢、關掉對話框：焦點還沒進對話框時按 Escape 關不掉，改按「取消」
  await voidDialog.getByRole('button', { name: '取消' }).click();

  // 照實點收：現場只點到 1,150，生管點收、點收量填 1,150
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

test('10.29 貨補到後對同一明細再點收一筆，點收數量可超過搬運數量', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '生管', '/production-floor/transfers');
  // 點收在所有轉交單母層展開後的子層明細列上，與第一次點收同一個動作
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await expect(subRow.getByRole('button', { name: '再次點收' })).toHaveCount(0);
  // 子層同一列另有「作廢點收紀錄」，按鈕名稱以全字比對才不會同時比到兩顆
  await subRow.getByRole('button', { name: '點收', exact: true }).click();
  const dialog = dialogOf(page, '點收');
  await dialog.locator('.ant-input-number-input').first().fill('20');
  await confirmDialog(dialog);
  await expect(subCell(subRow, '點收數量')).toHaveText('500');
  // 最近點收改為這一筆（點收人許文傑）
  await expect(subCell(subRow, '最近點收')).toContainText('許文傑');
  const drawer = await openTicketDrawer(page, 'TT-20260827-001');
  await expect(detailRowOf(drawer, '證書四色印刷')).toContainText('500');
  // 單頭維持已點收；歷程新增一筆點收（點收量 20、點收人），不出現「再次點收」字樣
  await expect(drawer).toContainText('已點收');
  await expect(drawer).toContainText(/點收.*20/);
  await expect(drawer.getByText(/再次點收/)).toHaveCount(0);
  await expect(drawer).toContainText('許文傑');
  await closeDrawer(page);

  await switchRole(page, '印務');
  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
});

test('10.30 收貨人點錯數修改點收數量與備註並填原因；點收紀錄可作廢', async ({ page }) => {
  test.setTimeout(120_000);
  // 點收佇列的「修改」：每條明細帶目前的點收數量與備註，另多一格必填的修改原因
  await openAs(page, '生管', '/production-floor/receiving');
  const row = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-001' });
  await row.getByRole('button', { name: '修改' }).click();
  const dialog = dialogOf(page, '修改');
  const certLine = dialog.locator('tr', { hasText: '證書四色印刷' });
  const certInput = certLine.locator('.ant-input-number-input');
  await expect(certInput).toHaveValue(/^480$/); // 帶目前的點收數量
  await expect(dialog).toContainText('少一落，待查'); // 帶目前的備註

  // 改成 490、不填原因：擋下送出
  await certInput.fill('490');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /修改原因/)).toBeVisible();

  // 改備註、填原因「重點數量」後送出成立：點收數量 490，列留在佇列上
  await certLine.locator('textarea, input:not(.ant-input-number-input)').first().fill('第二落在門邊');
  await formItemOf(dialog, '修改原因').locator('textarea').first().fill('重點數量');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /已修改 TT-20260827-001/)).toBeVisible();
  await expect(row).toContainText('已點收');

  // 歷程記點收量與備註的修改前後值與原因；證書裁切的到料量隨之改為 490（見 10.31）
  const drawer = await openTicketDrawer(page, 'TT-20260827-001');
  await expect(detailRowOf(drawer, '證書四色印刷')).toContainText('490');
  await expect(drawer).toContainText('已點收');
  await expect(drawer).toContainText(/480.*490/);
  await expect(drawer).toContainText('第二落在門邊');
  await expect(drawer).toContainText('重點數量');
  await closeDrawer(page);

  // 子層明細列另有「作廢點收紀錄」：沒填原因擋下（作廢成立的走法以純函式驗，見 10.52）
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await voidReceipt(page, subRow, null);
  await expect(noticeOf(page, /作廢原因/)).toBeVisible();
});

test('10.33 短少確定找不到：先改搬運數量、再改報工，轉交狀態走出待點收', async ({ page }) => {
  test.setTimeout(180_000);
  // 起點：證書四色印刷良品 500、TT-20260827-001 點收 480，轉交狀態待點收
  await openAs(page, '生管', '/production-floor/transfers');
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');

  // 搬運數量修改：改為 470 擋下（不得低於點收數量 480）、改為 0 擋下；改為 480 並填原因成立
  await editMoveQty(page, subRow, { qty: 470, reason: '現場清點只有 480' });
  await expect(noticeOf(page, /480/)).toBeVisible();
  await page.keyboard.press('Escape');
  // 輸入框最小只收 1（填 0 會被框成 1），改為清空：擋下並提示請填搬運數量；填 0 的擋下由資料層把關（見 10.55 純函式）
  await editMoveQty(page, subRow, { qty: '', reason: '現場清點只有 480' });
  await expect(noticeOf(page, /請填搬運數量/)).toBeVisible();
  await page.keyboard.press('Escape');
  await editMoveQty(page, subRow, { qty: 480, reason: '現場清點只有 480' });
  await expect(subCell(subRow, '搬運數量')).toHaveText('480');

  // 印務把證書四色印刷那筆報工的良品 500 改 480、不良品 15 改 35（生產數量 515 不變）
  await switchRole(page, '印務');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), {
    good: 480,
    defect: 35,
    reason: '現場清點只有 480',
  });
  await expect(reportRowOf(reports, '2026-08-25 16:30')).toContainText('480');
  await closeDrawer(page);

  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
  await expect(certRow).toContainText('轉交量 480／點收量 480／良品 480');

  // 轉交可申請上限 0：生管的待轉交任務不出現證書四色印刷
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '證書四色印刷' })).toHaveCount(0);
});

test('10.34 報工修改三欄可改、原因必填、留修改紀錄、調升不擋', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '印務', '/production-floor/work-packages');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const row = reportRowOf(reports, '2026-08-25 16:30');

  // 修改對話框開放生產數量、良品數、不良品數三欄與備註
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

  // 填原因（自由填寫）後送出成立
  await formItemOf(dialog, '修改原因').locator('input, textarea').first().fill('現場清點後更正');
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

test('10.35 報工修改與作廢共用擋下條件：在途與已點收量、下游已動工、已驗量；擋下時指出卡在哪一筆', async ({ page }) => {
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
  // 不再帶人工程序與人工註記（改走逐層更正，見 10.56）
  await expect(blocked).not.toContainText('人工註記');
  await expect(blocked).not.toContainText('工單異動加開');
  await page.keyboard.press('Escape');
  await closeDrawer(page);

  // 報工人員作廢信封四色印刷那筆報工：作廢後良品 0 低於已送達的 300，擋下並列出 TT-20260827-002
  await switchRole(page, '師傅');
  // 切角色後頁面還停在所有工作包（師傅沒有這個單元的操作）：先進我的工作包再開報工紀錄
  await gotoInApp(page, '/production-floor/work-packages/mine');
  const envelopeReports = await openPackageReports(page, 'WP-2026-0812-01');
  await reportRowOf(envelopeReports, '2026-08-26 15:40').getByRole('button', { name: '作廢' }).click();
  // 作廢原因為文字欄、自由填寫（wiki 報工紀錄 § 作廢原因）
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('textarea, input').first().fill('誤報');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  const voidBlocked = noticeOf(page, 'TT-20260827-002');
  await expect(voidBlocked).toBeVisible();
  await expect(voidBlocked).toContainText('先照實點收');
});

test('10.36 已完成任務可修改與作廢報工；修改或作廢跌破目標退回製作中；已完成任務擋下新增報工', async ({ page }) => {
  test.setTimeout(120_000);
  // 證書四色印刷（已完成）那筆報工：修改與作廢都在
  await openAs(page, '印務', '/production-floor/work-packages');
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const row = reportRowOf(reports, '2026-08-25 16:30');
  await expect(row.getByRole('button', { name: '作廢' })).toHaveCount(1);
  await expect(row.getByRole('button', { name: '修改' })).toBeEnabled();

  // 作廢不因任務已完成擋下，而是被 TT-20260827-001 已點收的 480 擋下
  await row.getByRole('button', { name: '作廢' }).click();
  // 作廢原因為文字欄、自由填寫（wiki 報工紀錄 § 作廢原因）
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('textarea, input').first().fill('整筆不該存在');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  const blocked = noticeOf(page, 'TT-20260827-001');
  await expect(blocked).toBeVisible();
  await expect(blocked).not.toContainText('該生產任務已完成');
  await page.keyboard.press('Escape');
  await closeDrawer(page);

  // 已完成任務沒有報工入口（工單詳情）
  const certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已完成');
  await expect(certRow.getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
});

test('10.38 搬運中作廢重開沿用原單目的地、重走搬運，沒有「貨已在現場」', async ({ page }) => {
  test.setTimeout(180_000);
  // 印務先把海報四色印刷的目的站點改為裝訂產線的後加工站
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
    .locator('.ant-select-item-option', { hasText: '後加工站' })
    .click();
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(page.getByText(/已更新目的站點/)).toBeVisible();

  // 生管作廢搬運中的 TT-20260830-003（作廢原因為文字）
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  const movingRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await voidTicket(page, movingRow, '數量填錯');
  await expect(page.locator('.ant-message').getByText(/TT-20260830-003 已作廢/)).toBeVisible();

  // 作廢成立當下明細退出轉交量：海報四色印刷的可搬量由 0 回到 800
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '海報四色印刷' })).toContainText('800');

  // 重開新單：畫面沒有「貨已在現場」勾選；新單沿用原單目的產線手工產線、目的站點裁切站，停在待搬運
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
  const newSub = await ticketDetailSubRow(page, newNo, '海報四色印刷');
  await expect(subCell(newSub, '目的站點')).toHaveText('裁切站');
});

test('10.39 轉交狀態兩條邊界：轉交點收量多於良品時點收不擋、落在轉交中', async ({ page }) => {
  test.setTimeout(180_000);
  // 前置：印務把證書四色印刷的報工良品改為 480、不良品改為 35（點收數量 480）
  await openAs(page, '印務', '/production-floor/work-packages');
  let reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), { good: 480, defect: 35, reason: '現場清點只有 480' });
  await expect(reportRowOf(reports, '2026-08-25 16:30')).toContainText('480');
  await closeDrawer(page);

  // 貨找回了：生管對 TT-20260827-001 那條明細再點收一筆 20，系統不以良品數擋下
  await switchRole(page, '生管');
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  // 子層同一列另有「作廢點收紀錄」，按鈕名稱以全字比對才不會同時比到兩顆
  await subRow.getByRole('button', { name: '點收', exact: true }).click();
  const again = dialogOf(page, '點收');
  await again.locator('.ant-input-number-input').first().fill('20');
  await confirmDialog(again);
  await expect(subCell(subRow, '點收數量')).toHaveText('500');

  await switchRole(page, '印務');
  let certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('轉交中');
  await expect(certRow).toContainText('轉交量 500／點收量 500／良品 480');

  // 印務再把報工良品改回 500、不良品改回 15 → 已轉交
  reports = await openPackageReports(page, 'WP-2026-0812-01');
  await editReport(page, reportRowOf(reports, '2026-08-25 16:30'), { good: 500, defect: 15, reason: '貨已找回' });
  await closeDrawer(page);
  certRow = await certWorkOrderTaskRow(page, '證書四色印刷');
  await expect(certRow).toContainText('已轉交');
  await expect(certRow).toContainText('轉交量 500／點收量 500／良品 500');
});

test('10.59 點收時每條明細都要填且大於 0，任一條未填擋下整次點收；已點收後可只對單條明細再點收', async ({ page }) => {
  test.setTimeout(120_000);
  // 生管在點收佇列對 TT-20260827-002 按點收：信封清空、只留內卡 200 送出 → 整次擋下
  await openAs(page, '生管', '/production-floor/receiving');
  await page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' }).getByRole('button', { name: '點收' }).click();
  const dialog = dialogOf(page, '點收');
  const cardInput = dialog.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input');
  const envelopeInput = dialog.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input');
  await cardInput.fill('200');
  await envelopeInput.fill('');
  await confirmDialog(dialog);
  await expect(noticeOf(page, /請填點收量/)).toBeVisible();

  // 沒有任何點收紀錄寫入：單維持已送達，兩條明細的點收數量都沒有出現（內卡那一條也沒收）
  await dialog.getByRole('button', { name: '取消' }).click();
  await expect(page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' })).toContainText('已送達');

  // 已送達的單在子層明細列上沒有任何作廢操作（不提供單條明細作廢）
  const arrivedSub = await ticketDetailSubRow(page, 'TT-20260827-002', '信封四色印刷');
  await expect(arrivedSub.getByRole('button', { name: /作廢/ })).toHaveCount(0);

  // 兩條都填後成立：單轉已點收
  await gotoInApp(page, '/production-floor/receiving');
  await page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' }).getByRole('button', { name: '點收' }).click();
  const again = dialogOf(page, '點收');
  await again.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input').fill('200');
  await again.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input').fill('280');
  await confirmDialog(again);
  await expect(noticeOf(page, /已點收 TT-20260827-002/)).toBeVisible();

  // 已點收後只對信封那一條再點收 20：成立，點收數量 300
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-002', '信封四色印刷');
  await subRow.getByRole('button', { name: '點收', exact: true }).click();
  const extra = dialogOf(page, '點收');
  await extra.locator('.ant-input-number-input').first().fill('20');
  await confirmDialog(extra);
  await expect(subCell(subRow, '點收數量')).toHaveText('300');
});
