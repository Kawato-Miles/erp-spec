import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp, taskRows } from '../_helpers.mjs';
import { openWorkOrder, taskForm, formField } from '../07-process-planning/_ch07.mjs';
import {
  FAKE_PHOTO,
  closeDrawer,
  confirmDialog,
  detailRowOf,
  dialogOf,
  editReport,
  noticeOf,
  openPackageReports,
  openTicketDrawer,
  receiveInQueue,
  reportRowOf,
  assignMover, CREATED_TOAST,
  subCell,
} from './_ch10.mjs';

// 情境目錄第十章：轉交單單元（所有轉交單 /production-floor/transfers、我的轉交單 /transfers/mine）與工作包報工紀錄的人工註記。

test('10.3 轉交單子母表、五個狀態與明細（原編號 23）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');
  // 母層欄位依序：轉交單號、狀態、目的站、負責廠務、預計轉交日、實際轉交日、建單、操作；沒有廠內執行者欄
  const mainHeaders = page.locator('.ant-table-thead').first().locator('th');
  await expect(mainHeaders.filter({ hasText: /\S/ })).toHaveText([
    '轉交單號',
    '狀態',
    '目的站',
    '負責廠務',
    '預計轉交日',
    '實際轉交日',
    '建單',
    '操作',
  ]);
  await expect(page.getByRole('columnheader', { name: '廠內執行者' })).toHaveCount(0);
  // 依建單時間新到舊：第一列是建單最晚的 TT-20260831-008（2026-08-31 16:30）
  const firstRow = page.locator('tbody > tr.ant-table-row').first();
  await expect(firstRow).toContainText('TT-20260831-008');

  const mainRow = page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' }).first();
  await expect(mainRow).toContainText('簡俊男');
  await mainRow.locator('.ant-table-row-expand-icon').click();
  const subTable = page.locator('tr.ant-table-expanded-row').first();
  const subHeaders = subTable.locator('thead th');
  await expect(subHeaders).toHaveText([
    '完稿縮圖',
    '訂單',
    '印件',
    '工單',
    '生產任務',
    '搬運數量',
    '點收數量',
    '最近點收',
    '簽收照片',
  ]);
  const subRow = subTable.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first();
  await expect(subCell(subRow, '訂單')).toHaveText('ORD-2026-0710');
  await expect(subCell(subRow, '印件')).toContainText('印件內部完成日');
  await expect(subCell(subRow, '生產任務')).toContainText('任務預計完成日');
  await expect(subCell(subRow, '搬運數量')).toHaveText('1,190');
  await expect(subCell(subRow, '點收數量')).toHaveText('－');
  await expect(subCell(subRow, '最近點收')).toHaveText('－');
  await expect(subCell(subRow, '簽收照片')).toContainText('簽收照-TT005.jpg');
  // 已送達、尚未點收的單，子層沒有操作欄
  await expect(subTable.getByRole('columnheader', { name: '操作' })).toHaveCount(0);

  // 篩選列：狀態、目的站、負責廠務、建單時間區間；沒有單別與實際轉交日區間
  const filters = page.locator('.ant-col');
  await expect(filters.filter({ hasText: '狀態' }).first()).toContainText('全部狀態');
  await expect(filters.filter({ hasText: '目的站' }).first()).toContainText('全部目的站');
  await expect(filters.filter({ hasText: '負責廠務' }).first()).toContainText('全部負責廠務');
  await expect(page.getByText('實際轉交日區間')).toHaveCount(0);
  await expect(page.getByText('全部單別')).toHaveCount(0);

  await page.getByText('TT-20260830-002', { exact: true }).first().click();
  const drawer = page.locator('.ant-drawer-body');
  // 單頭五格：來源站點、目的站、預計轉交日、負責廠務、備註（不設廠內執行者、單別、原轉交單與「貨已在現場」）
  await expect(drawer.locator('.ant-descriptions-item-label')).toHaveText([
    '來源站點',
    '目的站',
    '預計轉交日',
    '負責廠務',
    '備註',
  ]);
  await expect(drawer.getByText('廠內執行者')).toHaveCount(0);
  await expect(drawer.getByText('貨已在現場')).toHaveCount(0);
  // 明細逐條列出生產任務、搬運數量、點收數量與簽收照片檔名；人與時間不在單頭，一律看歷程
  await expect(drawer.getByText(/^明細/)).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '搬運數量' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '點收數量' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '簽收照片' })).toBeVisible();
  await expect(detailRowOf(page.locator('.ant-drawer-content:visible').last(), '海報四色印刷')).toContainText(
    '簽收照-TT005.jpg',
  );
  await expect(drawer.getByText(/^歷程/)).toBeVisible();
  await closeDrawer(page);

  // 鏈外 TT-20260827-001：那一條搬運數量 500、點收數量 480
  let sample = await openTicketDrawer(page, 'TT-20260827-001');
  const certDetail = detailRowOf(sample, '證書四色印刷');
  await expect(certDetail).toContainText('500');
  await expect(certDetail).toContainText('480');
  await closeDrawer(page);

  // 鏈外 TT-20260827-002：兩條各列一張簽收照片、尚未點收（點收數量「－」）
  sample = await openTicketDrawer(page, 'TT-20260827-002');
  await expect(detailRowOf(sample, '內卡四色印刷')).toContainText('簽收照-TT016-內卡.jpg');
  await expect(detailRowOf(sample, '信封四色印刷')).toContainText('簽收照-TT016-信封.jpg');
  await expect(detailRowOf(sample, '內卡四色印刷').locator('td').filter({ hasText: /^－$/ })).toHaveCount(1);
  await expect(detailRowOf(sample, '信封四色印刷').locator('td').filter({ hasText: /^－$/ })).toHaveCount(1);
});

test('10.6 待搬運的轉交單可改，開始搬運後鎖定（原編號 91）', async ({ page }) => {
  // 前置：生管代點收 TT-20260830-002、代報「裁切成型」的工（良品累計 1,180，可搬量 1,180）
  await openAs(page, '生管', '/production-floor/receiving');
  await receiveInQueue(page, 'TT-20260830-002', { 海報四色印刷: 1190 });
  await expect(page.getByText(/已點收 TT-20260830-002/)).toBeVisible();

  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const reportDialog = page.locator('.ant-modal-body');
  const reportTaskRow = reportDialog.locator('tr', { hasText: '裁切成型' });
  const reportInputs = reportTaskRow.locator('input');
  await reportInputs.nth(0).fill('1190');
  await reportInputs.nth(1).fill('1180');
  await reportInputs.nth(2).fill('10');
  await reportTaskRow.locator('.ant-select').last().click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 生管在待搬視圖勾「裁切成型」建一張到品檢站的轉交單
  await gotoInApp(page, '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: '裁切成型' });
  await expect(moveRow).toContainText('1,180'); // 可搬量 1,180
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await assignMover(page);
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(CREATED_TOAST);
  await expect(toast).toBeVisible();
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  // 到轉交單頁按修改：改成超過可搬量（1,300）被擋，改成合理數字（900）成功
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr', { hasText: ticketNo });
  await ticketRow.getByRole('button', { name: '編輯' }).click();
  const editDialog = page.locator('.ant-modal-body');
  await editDialog.locator('.ant-input-number-input').fill('1300');
  await page.getByRole('button', { name: '儲存修改' }).click();
  await expect(page.getByText(/超過可搬量.*當下可搬 1,180/)).toBeVisible();

  await editDialog.locator('.ant-input-number-input').fill('900');
  await page.getByRole('button', { name: '儲存修改' }).click();
  await expect(page.getByText('已更新明細與數量，來源任務的可搬量即時重算')).toBeVisible();

  // 負責廠務簡俊男在我的轉交單對同一張按「開始搬運」：剩下的動作只有抵達站點（我的轉交單）與作廢（所有轉交單）
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers/mine');
  await ticketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
  await expect(ticketRow.getByRole('button', { name: '抵達站點' })).toBeVisible();

  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
  await expect(ticketRow.getByRole('button', { name: '作廢' })).toBeVisible();

  // 負責廠務附照回報抵達站點後轉已送達：作廢也不再出現
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers/mine');
  await ticketRow.getByRole('button', { name: '抵達站點' }).click();
  const deliverDialog = dialogOf(page, '回報抵達站點');
  await deliverDialog.locator('input[type="file"]').first().setInputFiles(FAKE_PHOTO('裁切成型到站照.jpg'));
  await confirmDialog(deliverDialog);
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();
  await expect(ticketRow).toContainText('已送達');

  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  await expect(ticketRow.getByRole('button', { name: '作廢' })).toHaveCount(0);
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
});

test('10.7 負責廠務回報開始搬運與抵達站點（原編號 92）', async ({ page }) => {
  // 前置：生管在待搬視圖對 PT-0820-9 精裝裝訂建一張待搬運的轉交單（驗開始搬運）
  await openAs(page, '生管', '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await assignMover(page);
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(CREATED_TOAST);
  await expect(toast).toBeVisible();
  // 轉交單列表不顯示來源任務名稱，改用剛建立的單號定位這一列
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  // 廠務簡俊男是這兩張單的負責廠務，在我的轉交單回報
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers/mine');
  // 頁面頂部提示：實際通道為 Slack 表單，本頁兩顆按鈕是補登入口
  await expect(page.getByText(/實際通道為 Slack 表單/)).toBeVisible();

  const newTicketRow = page.locator('tr', { hasText: ticketNo });
  await newTicketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運，明細與數量鎖定/)).toBeVisible();
  await expect(newTicketRow).toContainText('搬運中');

  // 對搬運中的 TT-20260830-003（一條明細：海報四色印刷 800）按抵達站點：逐條明細各有一個照片上傳格
  const movingRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await movingRow.getByRole('button', { name: '抵達站點' }).click();
  const deliverDialog = dialogOf(page, '回報抵達站點');
  const posterSlot = deliverDialog.locator('tr, .ant-form-item, .ant-list-item', { hasText: '海報四色印刷' }).first();
  await expect(posterSlot.locator('input[type="file"]')).toHaveCount(1);

  // 未附照送出：擋下並列出缺照的明細「海報四色印刷 800」
  await confirmDialog(deliverDialog);
  await expect(noticeOf(page, /海報四色印刷 800/)).toBeVisible();

  // 在海報四色印刷那一條一次附兩張後送出
  await posterSlot.locator('input[type="file"]').setInputFiles([
    FAKE_PHOTO('簽收照片-1.jpg'),
    FAKE_PHOTO('簽收照片-2.jpg'),
  ]);
  await expect(deliverDialog.getByText('簽收照片-2.jpg')).toBeVisible();
  await confirmDialog(deliverDialog);
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();
  await expect(movingRow).toContainText('已送達');

  // 側板明細的簽收照片列出兩張，歷程寫明每條附了幾張
  const drawer = await openTicketDrawer(page, 'TT-20260830-003');
  await expect(detailRowOf(drawer, '海報四色印刷')).toContainText('簽收照片-1.jpg');
  await expect(detailRowOf(drawer, '海報四色印刷')).toContainText('簽收照片-2.jpg');
  await expect(drawer.getByText('回報抵達站點，附簽收照片：海報四色印刷 2 張')).toBeVisible();
  // 側板單頭沒有廠內執行者，回報者即負責廠務
  await expect(drawer.getByText('廠內執行者')).toHaveCount(0);
});

test('10.10 歷程只追加，改不動的數字用人工註記說明（原編號 99）', async ({ page }) => {
  await openAs(page, '印務', '/production-floor/transfers');
  const drawer = await openTicketDrawer(page, 'TT-20260828-001');
  // 歷程逐筆含時間、操作人、事件：建單、開始搬運、抵達站點、點收各一筆，沒有「貨已在現場」
  await expect(drawer).toContainText('建單');
  await expect(drawer).toContainText('開始搬運');
  await expect(drawer).toContainText('抵達站點');
  await expect(drawer).toContainText('點收');
  await expect(drawer.getByText(/貨已在現場/)).toHaveCount(0);

  await page.getByRole('button', { name: '加人工註記' }).click();
  await page.getByLabel('註記內容').fill('本單目的地與現場實際堆放位置不同，經口頭確認為同一批貨。');
  await page.getByRole('button', { name: '寫入註記' }).click();
  await expect(page.getByText('已寫入註記（記註記人與時間，數字不變動）')).toBeVisible();
  await closeDrawer(page); // 收起轉交單側板，避免擋住接下來的角色切換與站內導頁

  // WP-2026-0601-01 會員卡印刷那一筆報工（2026-06-15 17:20）：任務已完成、良品已全數被下游點收
  await switchRole(page, '生管');
  const reports = await openPackageReports(page, 'WP-2026-0601-01');
  const reportRow = reportRowOf(reports, '2026-06-15 17:20');

  // 先試作廢：因任務已完成被擋下
  await reportRow.getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  await expect(page.getByText(/報工不可作廢；更正走人工程序/)).toBeVisible();
  await page.keyboard.press('Escape');

  // 再試把良品調降：因量已被下游點收被擋下，提示帶出人工程序
  await editReport(page, reportRow, { good: 5000, reason: '誤報' });
  const blocked = noticeOf(page, /點收/);
  await expect(blocked).toBeVisible();
  await expect(blocked).toContainText('人工註記');
  await page.keyboard.press('Escape');

  // 兩者都被擋下後由印務加人工註記（人工註記歸印務，見 wiki 報工紀錄 § 修改、作廢與註記），數字不變
  await closeDrawer(page);
  await switchRole(page, '印務');
  const officerReports = await openPackageReports(page, 'WP-2026-0601-01');
  const officerRow = reportRowOf(officerReports, '2026-06-15 17:20');
  await officerRow.getByRole('button', { name: '加註記' }).click();
  await page.getByLabel('註記內容').fill('良品多報 80，量已被下游點收帶走；已實物盤點，缺口由工單異動加開任務補做。');
  await page.getByRole('button', { name: '寫入註記' }).click();
  await expect(page.getByText(/已寫入註記/).last()).toBeVisible();
  await expect(officerRow).toContainText('5,080');
});

test('10.13 用建單時間查卡在搬運那一段的轉交單（原編號 118）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');

  // 建單時間區間選一段現行日期（TT-20260828-001 建單於 2026-08-25）：篩掉不在區間內的單
  const createdInputs = page.locator('.ant-col', { hasText: '建單時間區間' }).locator('input');
  await createdInputs.nth(0).fill('2026-08-24');
  await createdInputs.nth(1).fill('2026-08-26');
  await page.keyboard.press('Enter');
  await expect(page.getByText('TT-20260828-001')).toBeVisible(); // 建單時間在區間內
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0); // 建單時間晚於區間，篩掉
  await expect(page.getByText('TT-20260830-003')).toHaveCount(0);

  // 清空條件後把狀態選搬運中：只剩 TT-20260830-003；篩選列沒有實際轉交日區間
  await page.getByRole('button', { name: /清空/ }).click();
  await expect(page.getByText('實際轉交日區間')).toHaveCount(0);
  await page.locator('.ant-col', { hasText: '狀態' }).first().locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '搬運中' })
    .click();
  await expect(page.locator('tbody > tr.ant-table-row')).toHaveCount(1);
  await expect(page.getByText('TT-20260830-003')).toBeVisible();
});

test('10.22 改目的站點後已建的轉交單不動，之後新建的單取新站', async ({ page }) => {
  // 起點：鏈四 PT-0820-9 精裝裝訂（已完成，目的站點品檢站，可搬量 500）。
  // 生管先在待搬視圖建一張單：目的地帶出任務當下的目的站點（品檢站）
  await openAs(page, '生管', '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await expect(moveRow).toContainText('品檢站');
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await assignMover(page);
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(CREATED_TOAST);
  await expect(toast).toBeVisible();
  const firstNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  // 負責印務在工單詳情頁改目的站點：任務已完成、製程已定案，表單只開放備註、目的站點與產線（產線見 8.17）
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0820');
  await taskRows(page)
    .filter({ hasText: '精裝裝訂' })
    .getByRole('button', { name: '編輯備註與目的站點' })
    .click();
  await expect(page.locator('.ant-modal-title').last()).toContainText('僅備註與目的站點、產線可改');
  await expect(formField(page, '任務名稱').locator('input')).toBeDisabled();
  const destination = formField(page, '目的站點').locator('.ant-select');
  await expect(destination).not.toHaveClass(/ant-select-disabled/);
  await destination.click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '裝訂產線' })
    .click();
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(page.getByText(/已更新目的站點；已建的轉交單不跟著改/)).toBeVisible();

  // 已建的那張單目的地不動，仍是品檢站
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  const firstRow = page.locator('tr', { hasText: firstNo });
  await expect(firstRow).toContainText('品檢站');
  await expect(firstRow).not.toContainText('裝訂產線');

  // 要改去處：作廢那張單，再從待搬視圖重新建單；新單取任務新的目的站點
  await firstRow.getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option', { hasText: '目的地填錯' })
    .click();
  await page.getByRole('button', { name: '作廢這張單' }).click();
  await expect(page.locator('.ant-message').getByText(`${firstNo} 已作廢`, { exact: false })).toBeVisible();

  await gotoInApp(page, '/production-floor/pending-moves');
  const movedRow = page.locator('tr', { hasText: '精裝裝訂' });
  await expect(movedRow).toContainText('裝訂產線');
  await movedRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await assignMover(page);
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast2 = page.getByText(CREATED_TOAST).last();
  await expect(toast2).toBeVisible();
  const secondNo = (await toast2.innerText()).match(/TT-\d{8}-\d{3}/)[0];
  expect(secondNo).not.toBe(firstNo);

  await gotoInApp(page, '/production-floor/transfers');
  await expect(page.locator('tr', { hasText: secondNo })).toContainText('裝訂產線');
  await expect(page.locator('tr', { hasText: firstNo })).toContainText('品檢站');
});

test('10.23 已作廢或報廢的任務不可改目的站點（畫面：表單目的站點唯讀）', async ({ page }) => {
  // 前置：業務取消鏈二訂單 ORD-2026-0710，旗下生產任務依有無實際投入分流——
  // 已有報工的「海報四色印刷」轉報廢（同 10.17 的前置）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710');
  await page.getByRole('button', { name: '取消訂單' }).click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: /確\s*定/ })
    .click();
  await expect(page.getByText(/生產任務 \d+ 筆報廢/)).toBeVisible();

  // 負責印務周建宏打開 WO-2026-0710：報廢任務的編輯入口只剩「編輯備註」，不再帶目的站點
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0710');
  const scrappedRow = taskRows(page).filter({ hasText: '海報四色印刷' });
  await expect(scrappedRow).toContainText('報廢');
  await expect(scrappedRow.getByRole('button', { name: '編輯備註與目的站點' })).toHaveCount(0);
  await scrappedRow.getByRole('button', { name: '編輯備註', exact: true }).click();

  // 表單標題只開放備註；目的站點下拉唯讀
  await expect(page.locator('.ant-modal-title').last()).toContainText('僅備註可改');
  await expect(page.locator('.ant-modal-title').last()).not.toContainText('目的站點可改');
  await expect(formField(page, '目的站點').locator('.ant-select')).toHaveClass(
    /ant-select-disabled/,
  );
});

test('10.25 已點收的轉交單不可作廢，送錯站由現場溝通後直接搬', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');

  // 轉交單依建單時間新到舊、每頁 10 張：舊單在後頁，先以單號搜尋縮到這一張
  const ticketSearch = page.getByPlaceholder('請輸入轉交單編號、印件名稱／編號、來源任務，或負責廠務');
  await ticketSearch.fill('TT-20260828-001');
  await ticketSearch.press('Enter');
  // 已點收的 TT-20260828-001：列上沒有作廢，也沒有建回運單的入口
  const receivedRow = page.locator('tr', { hasText: 'TT-20260828-001' });
  await expect(receivedRow).toContainText('已點收');
  await expect(receivedRow.getByRole('button', { name: '作廢' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /回運/ })).toHaveCount(0);

  // 搬運中的 TT-20260830-003 仍可作廢（已送達的單來源任務有效時不給作廢，見 10.28）；
  // 作廢對話框寫明已點收不可作廢、送錯站由現場溝通後直接搬
  await ticketSearch.fill('TT-20260830-003');
  await ticketSearch.press('Enter');
  const movingRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await movingRow.getByRole('button', { name: '作廢' }).click();
  const voidDialog = page.locator('.ant-modal-content').filter({ hasText: '作廢轉交單' });
  await expect(voidDialog).toContainText(
    '已點收為終態不可作廢（貨若送錯站，現場溝通後由廠務直接搬到正確的站）',
  );
});

test('10.40 建轉交單選負責廠務，系統只通知負責廠務；開始搬運與抵達由負責廠務回報', async ({
  page,
}) => {
  test.setTimeout(180_000);
  // 起點：鏈四 PT-0820-9 精裝裝訂（目的站點品檢站，可搬量 500）。頁名為「待轉交任務」
  await openAs(page, '生管', '/production-floor/pending-moves');
  await expect(page.getByText('待轉交任務').first()).toBeVisible();
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();

  // 不選負責廠務就建單：擋下並提示
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  await expect(noticeOf(page, '請選一位負責廠務')).toBeVisible();

  // 候選只有具轉交搬運回報權限的人員（兩位廠務），不含師傅、品檢人員與生管
  const dialog = dialogOf(page, '建立轉交單');
  await dialog.locator('.ant-form-item').filter({ hasText: '負責廠務' }).locator('.ant-select').click();
  const options = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().locator('.ant-select-item-option');
  await expect(options).toHaveCount(2);
  await expect(options.nth(0)).toHaveAttribute('title', '簡俊男');
  await expect(options.nth(1)).toHaveAttribute('title', '邱志明');
  await page.keyboard.press('Escape');

  await assignMover(page, '邱志明');
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(/已建立.*已通知負責廠務 邱志明/);
  await expect(toast).toBeVisible();
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  // 所有轉交單的列表與側板都看得到負責廠務；歷程記建單時的負責廠務
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr.ant-table-row', { hasText: ticketNo }).first();
  await expect(ticketRow).toContainText('邱志明');
  let drawer = await openTicketDrawer(page, ticketNo);
  await expect(drawer).toContainText('負責廠務 邱志明');
  await expect(drawer.getByText('廠內執行者')).toHaveCount(0);
  await closeDrawer(page);

  // 廠務簡俊男不是負責廠務：通知鈴沒有這張單，我的轉交單也不列這張
  await switchRole(page, '廠務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.locator('.ant-popover:visible')).not.toContainText(ticketNo);
  await page.keyboard.press('Escape');
  await gotoInApp(page, '/production-floor/transfers/mine');
  await expect(page.locator('tr.ant-table-row', { hasText: ticketNo })).toHaveCount(0);

  // 生管在待搬運時改負責廠務為簡俊男：系統通知新的負責廠務，歷程記改前與改後
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  await ticketRow.getByRole('button', { name: '編輯' }).click();
  const editDialog = dialogOf(page, '修改轉交單');
  await editDialog.locator('.ant-form-item').filter({ hasText: '負責廠務' }).locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option[title="簡俊男"]')
    .click();
  await page.getByRole('button', { name: '儲存修改' }).click();
  await expect(page.getByText(/改負責廠務為 簡俊男（已通知）/)).toBeVisible();
  await expect(ticketRow).toContainText('簡俊男');

  // 簡俊男的通知鈴出現這張單，我的轉交單列出這張並有開始搬運
  await switchRole(page, '廠務');
  await bell.click();
  await expect(page.locator('.ant-popover:visible')).toContainText(`轉交單 ${ticketNo} 由你負責搬運`);
  await page.keyboard.press('Escape');
  await gotoInApp(page, '/production-floor/transfers/mine');
  const mineRow = page.locator('tr.ant-table-row', { hasText: ticketNo }).first();
  await mineRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();

  // 歷程的操作人為負責廠務簡俊男，側板沒有廠內執行者欄
  drawer = await openTicketDrawer(page, ticketNo);
  await expect(drawer).toContainText('改負責廠務：邱志明 → 簡俊男');
  const startEntry = drawer.locator('.ant-timeline-item', { hasText: '回報開始搬運' }).first();
  await expect(startEntry).toContainText('簡俊男');
  await expect(drawer.getByText('廠內執行者')).toHaveCount(0);
  await closeDrawer(page);

  // 廠務邱志明的我的轉交單不列這張
  await switchRole(page, '廠務（邱志明）');
  await expect(page.locator('tr.ant-table-row', { hasText: ticketNo })).toHaveCount(0);

  // 搬運中的單不再有編輯入口，負責廠務不能再改
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  await expect(page.locator('tr.ant-table-row', { hasText: ticketNo }).first().getByRole('button', { name: '編輯' })).toHaveCount(0);
});
