import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄第十章：轉交單管理頁（/production-floor/transfers）與工作包報工紀錄的人工註記。

test('10.3 轉交單列表、五個狀態與明細（原編號 23）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');
  // 狀態篩選：待搬運、搬運中、已送達、已點收、已作廢
  await page.locator('.ant-col', { hasText: '單別' }).locator('..').getByText('全部狀態');
  await expect(page.getByText('TT-20260830-002')).toBeVisible();

  await page.getByText('TT-20260830-002').click();
  const drawer = page.locator('.ant-drawer-body');
  // 單頭固定八格：單別、原轉交單、來源站點、目的地、預計轉交日、貨已在現場、簽收照、備註
  await expect(drawer.getByText('單別')).toBeVisible();
  await expect(drawer.getByText('原轉交單')).toBeVisible();
  await expect(drawer.getByText('來源站點')).toBeVisible();
  await expect(drawer.getByText('目的地', { exact: true })).toBeVisible();
  await expect(drawer.getByText('預計轉交日')).toBeVisible();
  await expect(drawer.getByText('貨已在現場')).toBeVisible();
  await expect(drawer.getByText('簽收照', { exact: true })).toBeVisible();
  await expect(drawer.getByText('備註', { exact: true })).toBeVisible();
  // 人與時間不在單頭，一律看歷程
  await expect(drawer.getByText(/^明細/)).toBeVisible();
  await expect(drawer.getByText(/^歷程/)).toBeVisible();
});

test('10.6 待搬運的轉交單可改，開始搬運後鎖定（原編號 91）', async ({ page }) => {
  // 前置：生管代點收 TT-20260830-002、代報「裁切成型」的工（良品累計 1,180，可搬量 1,180）
  await openAs(page, '生管', '/production-floor/receiving');
  await page.locator('tr', { hasText: 'TT-20260830-002' }).getByRole('button', { name: '點收' }).click();
  await page.getByRole('button', { name: '確認點收' }).click();
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
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(/已建立.*交由廠務搬運/);
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
  await expect(page.getByText('已更新明細、數量與目的地，來源任務的可搬量即時重算')).toBeVisible();

  // 廠務對同一張按「開始搬運」後，回生管視角看修改按鈕消失，只剩作廢（生管、印務、印務主管、主管可作廢）
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers');
  await ticketRow.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();

  await switchRole(page, '生管');
  await expect(ticketRow.getByRole('button', { name: '編輯' })).toHaveCount(0);
  await expect(ticketRow.getByRole('button', { name: '作廢' })).toBeVisible();
});

test('10.7 廠務回報開始搬運與抵達站點（原編號 92）', async ({ page }) => {
  // 前置：生管在待搬視圖對 PT-0820-9 精裝裝訂建一張待搬運的轉交單
  await openAs(page, '生管', '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(/已建立.*交由廠務搬運/);
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

  // 抵達站點：不附照被擋，附照後成功
  await newTicketRow.getByRole('button', { name: '抵達站點' }).click();
  await page.getByRole('button', { name: '抵達站點' }).last().click();
  await expect(page.getByText('請先上傳卸貨現場照再抵達站點')).toBeVisible();
});

test('10.10 歷程只追加，改不動的數字用人工註記說明（原編號 99）', async ({ page }) => {
  await openAs(page, '印務', '/production-floor/transfers');
  await page.getByText('TT-20260828-001').click();
  await page.getByRole('button', { name: '加人工註記' }).click();
  await page.getByLabel('註記內容').fill('本單目的地與現場實際堆放位置不同，經口頭確認為同一批貨。');
  await page.getByRole('button', { name: '寫入註記' }).click();
  await expect(page.getByText('已寫入註記（記註記人與時間，數字不變動）')).toBeVisible();
  await page.getByRole('button', { name: '關閉' }).click(); // 收起轉交單側板，避免擋住接下來的角色切換與站內導頁

  // 對已完成任務（陳金水 WP-2026-0601-01）的報工，作廢先被擋下，改加人工註記
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/work-packages');
  await page.getByText('WP-2026-0601-01').click();
  const reportRow = page.locator('.ant-drawer-body tr.ant-table-row').first();
  await reportRow.getByRole('button', { name: '作廢' }).click();
  await page.locator('.ant-form-item', { hasText: '作廢原因' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '作廢這筆報工' }).click();
  await expect(page.getByText(/報工不可作廢；更正走人工程序/)).toBeVisible();
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
  await page.getByRole('button', { name: '清空篩選' }).click();
  const actualInputs = page.locator('.ant-col', { hasText: '實際轉交日區間' }).locator('input');
  await actualInputs.nth(0).fill('2020-01-01');
  await actualInputs.nth(1).fill('2020-01-02');
  await page.keyboard.press('Enter');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0); // 已送達、實際轉交日不在區間
  await expect(page.getByText('TT-20260828-001')).toHaveCount(0); // 已點收、實際轉交日不在區間
  await expect(page.getByText('TT-20260830-003')).toBeVisible(); // 搬運中，無實際轉交日不受篩選影響
});
