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
} from './_ch10.mjs';

// 情境目錄第十章：轉交單管理頁（/production-floor/transfers）與工作包報工紀錄的人工註記。

test('10.3 轉交單列表、五個狀態與明細（原編號 23）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');
  // 主層一列一張轉交單，帶指派廠務欄；展開子層一列一條明細
  await expect(page.getByRole('columnheader', { name: '指派廠務' }).first()).toBeVisible();
  const mainRow = page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' }).first();
  await expect(mainRow).toContainText('簡俊男');
  await mainRow.locator('.ant-table-row-expand-icon').click();
  const subTable = page.locator('tr.ant-table-expanded-row').first();
  for (const header of ['來源任務', '設定量', '點收累計', '簽收照片']) {
    await expect(subTable.getByRole('columnheader', { name: header })).toBeVisible();
  }
  const subRow = subTable.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first();
  await expect(subRow).toContainText('1,190');
  await expect(subRow).toContainText('簽收照-TT005.jpg');
  // 已送達、尚未點收的單，子層沒有再次點收與修改
  await expect(subTable.getByRole('columnheader', { name: '操作' })).toHaveCount(0);

  // 篩選列：狀態、目的地、建單時間區間、實際轉交日區間；轉交單只有一種，沒有單別篩選
  const filters = page.locator('.ant-col');
  await expect(filters.filter({ hasText: '狀態' }).first()).toContainText('全部狀態');
  await expect(filters.filter({ hasText: '目的地' }).first()).toContainText('全部目的地');
  await expect(page.getByText('全部單別')).toHaveCount(0);
  await expect(page.getByText('TT-20260830-002')).toBeVisible();

  await page.getByText('TT-20260830-002').click();
  const drawer = page.locator('.ant-drawer-body');
  // 單頭六格：來源站點、目的地、預計轉交日、備註、指派廠務、廠內執行者（不設單別、原轉交單與「貨已在現場」）
  await expect(drawer.getByText('單別')).toHaveCount(0);
  await expect(drawer.getByText('原轉交單')).toHaveCount(0);
  await expect(drawer.getByText('貨已在現場')).toHaveCount(0);
  await expect(drawer.getByText('來源站點')).toBeVisible();
  await expect(drawer.getByText('目的地', { exact: true })).toBeVisible();
  await expect(drawer.getByText('預計轉交日')).toBeVisible();
  await expect(drawer.getByText('備註', { exact: true })).toBeVisible();
  await expect(drawer.getByText('指派廠務', { exact: true })).toBeVisible();
  await expect(drawer.getByText('廠內執行者', { exact: true })).toBeVisible();
  await expect(drawer.locator('.ant-descriptions-item-label')).toHaveCount(6);
  // 明細逐條列出生產任務、設定量、點收累計與簽收照片檔名；人與時間不在單頭，一律看歷程
  await expect(drawer.getByText(/^明細/)).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '設定量' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '點收累計' })).toBeVisible();
  await expect(drawer.getByRole('columnheader', { name: '簽收照片' })).toBeVisible();
  await expect(detailRowOf(page.locator('.ant-drawer-content:visible').last(), '海報四色印刷')).toContainText(
    '簽收照-TT005.jpg',
  );
  await expect(drawer.getByText(/^歷程/)).toBeVisible();
  await closeDrawer(page);

  // 鏈外 TT-20260827-001：那一條設定量 500、點收累計 480
  let sample = await openTicketDrawer(page, 'TT-20260827-001');
  const certDetail = detailRowOf(sample, '證書四色印刷');
  await expect(certDetail).toContainText('500');
  await expect(certDetail).toContainText('480');
  await closeDrawer(page);

  // 鏈外 TT-20260827-002：兩條各列一張簽收照片、點收累計 0
  sample = await openTicketDrawer(page, 'TT-20260827-002');
  await expect(detailRowOf(sample, '內卡四色印刷')).toContainText('簽收照-TT016-內卡.jpg');
  await expect(detailRowOf(sample, '信封四色印刷')).toContainText('簽收照-TT016-信封.jpg');
  await expect(detailRowOf(sample, '內卡四色印刷').locator('td').filter({ hasText: /^0$/ })).toHaveCount(1);
  await expect(detailRowOf(sample, '信封四色印刷').locator('td').filter({ hasText: /^0$/ })).toHaveCount(1);
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

  // 廠務對同一張按「開始搬運」：剩下的動作只有抵達站點（廠務）與作廢（生管、印務、印務主管）
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers');
  await ticketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
  await expect(ticketRow.getByRole('button', { name: '抵達站點' })).toBeVisible();

  await switchRole(page, '生管');
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
  await expect(ticketRow.getByRole('button', { name: '作廢' })).toBeVisible();

  // 廠務附照回報抵達站點後轉已送達：作廢也不再出現
  await switchRole(page, '廠務');
  await ticketRow.getByRole('button', { name: '抵達站點' }).click();
  const deliverDialog = dialogOf(page, '回報抵達站點');
  await deliverDialog.locator('input[type="file"]').first().setInputFiles(FAKE_PHOTO('裁切成型到站照.jpg'));
  await confirmDialog(deliverDialog);
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();
  await expect(ticketRow).toContainText('已送達');

  await switchRole(page, '生管');
  await expect(ticketRow.getByRole('button', { name: '作廢' })).toHaveCount(0);
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
});

test('10.7 廠務回報開始搬運與抵達站點（原編號 92）', async ({ page }) => {
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

  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers');
  // 頁面頂部提示：實際通道為 Slack 表單，本頁兩顆按鈕是補登與代位入口
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

  // 清空條件後改試實際轉交日區間：只有已送達之後才有實際轉交日，
  // 該區間不會把待搬運與搬運中的卡點單（TT-20260830-003）藏起來
  await page.getByRole('button', { name: /清空/ }).click();
  const actualInputs = page.locator('.ant-col', { hasText: '實際轉交日區間' }).locator('input');
  await actualInputs.nth(0).fill('2020-01-01');
  await actualInputs.nth(1).fill('2020-01-02');
  await page.keyboard.press('Enter');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0); // 已送達、實際轉交日不在區間
  await expect(page.getByText('TT-20260828-001')).toHaveCount(0); // 已點收、實際轉交日不在區間
  await expect(page.getByText('TT-20260830-003')).toBeVisible(); // 搬運中，無實際轉交日不受篩選影響
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
  await expect(page.getByText(`${firstNo} 已作廢`, { exact: false })).toBeVisible();

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

  // 已點收的 TT-20260828-001：列上沒有作廢，也沒有建回運單的入口
  const receivedRow = page.locator('tr', { hasText: 'TT-20260828-001' });
  await expect(receivedRow).toContainText('已點收');
  await expect(receivedRow.getByRole('button', { name: '作廢' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /回運/ })).toHaveCount(0);

  // 搬運中的 TT-20260830-003 仍可作廢（已送達的單來源任務有效時不給作廢，見 10.28）；
  // 作廢對話框寫明已點收不可作廢、送錯站由現場溝通後直接搬
  const movingRow = page.locator('tr', { hasText: 'TT-20260830-003' });
  await movingRow.getByRole('button', { name: '作廢' }).click();
  const voidDialog = page.locator('.ant-modal-content').filter({ hasText: '作廢轉交單' });
  await expect(voidDialog).toContainText(
    '已點收為終態不可作廢（貨若送錯站，現場溝通後由廠務直接搬到正確的站）',
  );
});

test('10.40 建轉交單指定廠務，系統只通知被指派者；待搬運可改指派，實際搬運者另記廠內執行者', async ({
  page,
}) => {
  test.setTimeout(150_000);
  // 起點：鏈四 PT-0820-9 精裝裝訂（目的站點品檢站，可搬量 500）。頁名為「待轉交任務」
  await openAs(page, '生管', '/production-floor/pending-moves');
  await expect(page.getByText('待轉交任務').first()).toBeVisible();
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();

  // 不選指派廠務就建單：擋下並提示
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  await expect(noticeOf(page, '請指派一位廠務')).toBeVisible();

  // 候選只有具轉交搬運回報權限的人員（兩位廠務），不含師傅、品檢人員與生管
  const dialog = dialogOf(page, '建立轉交單');
  await dialog.locator('.ant-form-item').filter({ hasText: '指派廠務' }).locator('.ant-select').click();
  const options = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last().locator('.ant-select-item-option');
  await expect(options).toHaveCount(2);
  await expect(options.nth(0)).toHaveAttribute('title', '簡俊男');
  await expect(options.nth(1)).toHaveAttribute('title', '邱志明');
  await page.keyboard.press('Escape');

  await assignMover(page, '邱志明');
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(/已建立.*已通知廠務 邱志明/);
  await expect(toast).toBeVisible();
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];

  // 列表與側板都看得到指派廠務；歷程記建單時的指派
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr.ant-table-row', { hasText: ticketNo }).first();
  await expect(ticketRow).toContainText('邱志明');
  let drawer = await openTicketDrawer(page, ticketNo);
  await expect(drawer).toContainText('指派廠務 邱志明');
  await closeDrawer(page);

  // 廠務簡俊男（模擬角色）不是被指派者：通知鈴沒有這張單
  await switchRole(page, '廠務');
  const bell = page.locator('header, .ant-layout-header').first().getByText('notifications', { exact: true });
  await bell.click();
  await expect(page.locator('.ant-popover:visible')).not.toContainText(ticketNo);
  await page.keyboard.press('Escape');

  // 生管在待搬運時改指派為簡俊男：系統通知新的被指派者，歷程記原指派與新指派
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/transfers');
  await ticketRow.getByRole('button', { name: '編輯' }).click();
  const editDialog = dialogOf(page, '修改轉交單');
  await editDialog.locator('.ant-form-item').filter({ hasText: '指派廠務' }).locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option[title="簡俊男"]')
    .click();
  await page.getByRole('button', { name: '儲存修改' }).click();
  await expect(page.getByText(/改指派廠務 簡俊男（已通知）/)).toBeVisible();
  await expect(ticketRow).toContainText('簡俊男');

  await switchRole(page, '廠務');
  await bell.click();
  await expect(page.locator('.ant-popover:visible')).toContainText(`轉交單 ${ticketNo} 指派你搬運`);
  await page.keyboard.press('Escape');

  // 廠務回報開始搬運：廠內執行者記實際回報的人；搬運中的單不再有編輯（改指派）入口
  await ticketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
  drawer = await openTicketDrawer(page, ticketNo);
  await expect(drawer).toContainText('改指派廠務：邱志明 → 簡俊男');
  const executorCell = drawer.locator('.ant-descriptions-item-label', { hasText: '廠內執行者' });
  await expect(executorCell.locator('xpath=following-sibling::*[1]')).toHaveText('簡俊男');
  await closeDrawer(page);
  await switchRole(page, '生管');
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
});
