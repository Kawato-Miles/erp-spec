import { test, expect } from '@playwright/test';
import { attachReportPhotos, gotoInApp, openAs, switchRole, taskRows } from '../_helpers.mjs';
import { openWorkOrder, taskForm, formField } from '../07-process-planning/_ch07.mjs';
import {
  CREATED_TOAST,
  assignMover,
  closeDrawer,
  confirmDialog,
  detailRowOf,
  dialogOf,
  editMoveQty,
  noticeOf,
  openPackageReports,
  openTicketDrawer,
  subCell,
  ticketDetailSubRow,
  voidTicket,
  FAKE_PHOTO,
} from './_ch10.mjs';

// 情境目錄 10.46、10.48、10.49、10.51～10.53、10.55、10.58（2026-10-06 新增）的畫面段。
// 10.47、10.50、10.54、10.56、10.57 只以純函式驗（tests/unit/production-floor/），見情境目錄各節。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence production-execution delta 的 THEN；
// 依據為 wiki 師傅報工與修改、場內轉交與更正、生產數量錯誤的逐層更正、生產管理單元可見範圍。
// 修改原因與作廢原因一律自由填寫，測試不驗固定字樣。

// 報工對話框的一列：填數量並附照片後送出
async function submitReport(page, taskName, { input, good, defect = 0, photo = true }) {
  const box = page.locator('.ant-modal-body').last();
  const line = box.locator('tbody tr').filter({ hasText: taskName }).first();
  const numbers = line.locator('input.ant-input-number-input');
  await numbers.nth(0).fill(String(input));
  await numbers.nth(1).fill(String(good));
  await numbers.nth(2).fill(String(defect));
  if (photo) await attachReportPhotos(page);
  await page.getByRole('button', { name: /送出報工/ }).click();
}

test('10.46 五個報工入口與三值提交管道；印件詳情沒有報工入口', async ({ page }) => {
  test.setTimeout(180_000);
  // 起點：鏈二 WP-2026-0710-01 的海報四色印刷（製作中、已到料，指派師傅劉阿海；負責印務周建宏）
  // 劉阿海：我的工作包、我的生產任務各報一筆
  await openAs(page, '師傅', '/production-floor/work-packages');
  await page.locator('tr', { hasText: 'WP-2026-0710-01' }).getByRole('button', { name: '報工' }).click();
  await submitReport(page, '海報四色印刷', { input: 10, good: 10 });
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
  await gotoInApp(page, '/production-floor/dispatch/mine');
  await page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  await submitReport(page, '海報四色印刷', { input: 11, good: 11 });
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 許文傑：所有工作包、所有生產任務各報一筆
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/work-packages');
  await page.locator('tr', { hasText: 'WP-2026-0710-01' }).getByRole('button', { name: '報工' }).click();
  await submitReport(page, '海報四色印刷', { input: 12, good: 12 });
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  await page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  await submitReport(page, '海報四色印刷', { input: 13, good: 13 });
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 周建宏：工單詳情報一筆；報工對話框沒有提交管道的選擇
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0710');
  await taskRows(page).filter({ hasText: '海報四色印刷' }).first().getByRole('button', { name: '報工', exact: true }).click();
  await expect(page.locator('.ant-modal-body').last().getByText('提交管道')).toHaveCount(0);
  await submitReport(page, '海報四色印刷', { input: 14, good: 14 });
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 報工紀錄的提交管道：師傅自助兩筆、生產管理頁面代報兩筆、印務於工單詳情頁一筆
  const reports = await openPackageReports(page, 'WP-2026-0710-01');
  // 以「生產數量」那一格的全文定位（欄序：報工時間、報工人員、提交管道、狀態、生產數量）：
  // 整列的文字各格相連（如「1111０」），用數字前後非數字的正規式會比對到報工時間裡的月份
  const channelOf = (qty) =>
    reports
      .locator('tr.ant-table-row')
      .filter({ has: page.locator('td:nth-child(5)', { hasText: new RegExp(`^${qty}$`) }) })
      .first();
  await expect(channelOf(10)).toContainText('師傅自助');
  await expect(channelOf(11)).toContainText('師傅自助');
  await expect(channelOf(12)).toContainText('生產管理頁面代報');
  await expect(channelOf(13)).toContainText('生產管理頁面代報');
  await expect(channelOf(14)).toContainText('印務於工單詳情頁');
  await closeDrawer(page);

  // 印件詳情沒有報工入口
  await gotoInApp(page, '/print-items');
  await page.getByText('品牌形象海報 A2', { exact: true }).click();
  await expect(page.getByText('PI-2026-0710').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /報\s*工/ })).toHaveCount(0);
});

test('10.48 未交付擋下；已完成任務擋下新增報工，既有報工仍可修改與作廢', async ({ page }) => {
  test.setTimeout(120_000);
  // 錨例 WO-2026-0908（製程審核完成，三筆任務交付時間無值）：沒有報工入口，提示任務尚未交付
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0908');
  await expect(page.getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
  await expect(page.getByText('任務尚未交付').first()).toBeVisible();

  // 已完成的證書四色印刷（WO-2026-0812）：工單詳情沒有報工入口；所有生產任務同樣沒有
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0812');
  const certRow = taskRows(page).filter({ hasText: '證書四色印刷' }).first();
  await expect(certRow).toContainText('已完成');
  await expect(certRow.getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0812');
  await search.press('Enter');
  await expect(
    page.locator('tr.ant-table-row', { hasText: '證書四色印刷' }).first().getByRole('button', { name: '報工' }),
  ).toHaveCount(0);

  // 既有報工的修改與作廢仍可用
  const reports = await openPackageReports(page, 'WP-2026-0812-01');
  const row = reports.locator('tr.ant-table-row', { hasText: '2026-08-25 16:30' }).first();
  await expect(row.getByRole('button', { name: '修改' })).toBeVisible();
  await expect(row.getByRole('button', { name: '作廢' })).toBeVisible();
});

test('10.49 照片必填；良品＋不良品不大於生產數量，直接比數值、不換算', async ({ page }) => {
  test.setTimeout(120_000);
  // 劉阿海在我的生產任務對信封四色印刷報工
  await openAs(page, '師傅', '/production-floor/dispatch/mine');
  await page.locator('tr.ant-table-row', { hasText: '信封四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  const box = page.locator('.ant-modal-body').last();
  const line = box.locator('tbody tr').filter({ hasText: '信封四色印刷' }).first();
  const numbers = line.locator('input.ant-input-number-input');

  // 良品＋不良品大於生產數量：擋下（直接比數值）
  await numbers.nth(0).fill('100');
  await numbers.nth(1).fill('98');
  await numbers.nth(2).fill('4');
  await line.locator('.ant-select').last().click();
  await page.keyboard.press('Enter');
  await attachReportPhotos(page);
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(noticeOf(page, /不可超過生產數量/)).toBeVisible();

  // 數量改對、不附照片：擋下並提示現場照片必填（重開對話框，避免沿用剛附的照片）
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await page.locator('tr.ant-table-row', { hasText: '信封四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  const line2 = page.locator('.ant-modal-body').last().locator('tbody tr').filter({ hasText: '信封四色印刷' }).first();
  const numbers2 = line2.locator('input.ant-input-number-input');
  await numbers2.nth(0).fill('205');
  await numbers2.nth(1).fill('200');
  await numbers2.nth(2).fill('5');
  await line2.locator('.ant-select').last().click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(noticeOf(page, /現場照片/)).toBeVisible();

  // 附兩張照片後送出成立
  await line2.locator('input[type="file"]').first().setInputFiles([FAKE_PHOTO('信封-一.jpg'), FAKE_PHOTO('信封-二.jpg')]);
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
});

test('10.51 點收單一動作：每次新增一筆，第一筆轉已點收，之後只新增紀錄、狀態不變', async ({ page }) => {
  test.setTimeout(120_000);
  // 鏈外 TT-20260827-002（已送達；內卡 200、信封 300）：生管第一次點收內卡 200、信封 280
  await openAs(page, '生管', '/production-floor/receiving');
  const row = page.locator('tr.ant-table-row', { hasText: 'TT-20260827-002' });
  await row.getByRole('button', { name: '點收' }).click();
  let dialog = dialogOf(page, '點收');
  await dialog.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input').fill('200');
  await dialog.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input').fill('280');
  await confirmDialog(dialog);
  await expect(row).toContainText('已點收');

  // 第二次點收：同一個動作，只填信封 20（內卡留空不新增）
  await row.getByRole('button', { name: '點收' }).click();
  dialog = dialogOf(page, '點收');
  await dialog.locator('tr', { hasText: '內卡四色印刷' }).locator('.ant-input-number-input').fill('');
  await dialog.locator('tr', { hasText: '信封四色印刷' }).locator('.ant-input-number-input').fill('20');
  await confirmDialog(dialog);
  await expect(row).toContainText('已點收');

  const envelope = await ticketDetailSubRow(page, 'TT-20260827-002', '信封四色印刷');
  await expect(subCell(envelope, '點收數量')).toHaveText('300');
  const card = await ticketDetailSubRow(page, 'TT-20260827-002', '內卡四色印刷');
  await expect(subCell(card, '點收數量')).toHaveText('200');
});

test('10.52 點收紀錄作廢：作廢的那一筆仍看得到、不計入點收數量', async ({ page }) => {
  // 鏈一 TT-20260615-001：一筆有效點收 5,100、一筆已作廢的點收 100（作廢原因「點錯單，這一落是別張單的貨」）
  await openAs(page, '生管', '/production-floor/transfers');
  const drawer = await openTicketDrawer(page, 'TT-20260615-001');
  await expect(drawer).toContainText('已點收');
  await expect(detailRowOf(drawer, '銅西卡 250g 備料')).toContainText('5,100');
  await expect(drawer).toContainText('已作廢');
  await expect(drawer).toContainText('點錯單，這一落是別張單的貨');
  await expect(drawer).toContainText('陳金水');
  await closeDrawer(page);
  const subRow = await ticketDetailSubRow(page, 'TT-20260615-001', '銅西卡 250g 備料');
  await expect(subCell(subRow, '點收數量')).toHaveText('5,100');
});

test('10.53 點收前（待搬運、搬運中、已送達）可作廢、原因為文字；已點收不可作廢', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/transfers');
  const search = page.getByPlaceholder(/轉交單編號/).first();
  const rowOf = async (no) => {
    await search.fill(no);
    await search.press('Enter');
    return page.locator('tr.ant-table-row', { hasText: no }).first();
  };
  // 已點收的 TT-20260828-001 沒有作廢
  await expect((await rowOf('TT-20260828-001')).getByRole('button', { name: '作廢' })).toHaveCount(0);
  // 搬運中的 TT-20260830-003 有作廢
  await expect((await rowOf('TT-20260830-003')).getByRole('button', { name: '作廢' })).toHaveCount(1);
  // 已送達的 TT-20260830-002 有作廢：沒填原因擋下；以文字填原因後作廢成立
  const arrived = await rowOf('TT-20260830-002');
  await voidTicket(page, arrived, null);
  await expect(noticeOf(page, /作廢原因/)).toBeVisible();
  await page.keyboard.press('Escape');
  await voidTicket(page, arrived, '點收前發現數量不對，依實況重建');
  await expect(page.locator('.ant-message').getByText(/TT-20260830-002 已作廢/)).toBeVisible();
  await expect(arrived).toContainText('已作廢');

  // 搬運數量 1,190 退回海報四色印刷：待轉交任務看得到 1,190 的可搬量
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.locator('tr', { hasText: '海報四色印刷' })).toContainText('1,190');
});

test('10.55 搬運數量修改更正：大於 0 且不得低於點收數量、原因必填、留紀錄', async ({ page }) => {
  test.setTimeout(120_000);
  // 鏈外 TT-20260827-001（已點收；搬運數量 500、點收 480）
  await openAs(page, '生管', '/production-floor/transfers');
  const subRow = await ticketDetailSubRow(page, 'TT-20260827-001', '證書四色印刷');
  await editMoveQty(page, subRow, { qty: 470, reason: '實際只搬了這些' });
  await expect(noticeOf(page, /480/)).toBeVisible();
  await page.keyboard.press('Escape');
  // 輸入框最小只收 1（填 0 會被框成 1），改為清空：擋下並提示請填搬運數量；填 0 的擋下由資料層把關（純函式 10.55）
  await editMoveQty(page, subRow, { qty: '', reason: '實際只搬了這些' });
  await expect(noticeOf(page, /請填搬運數量/)).toBeVisible();
  await page.keyboard.press('Escape');
  await editMoveQty(page, subRow, { qty: 480 });
  await expect(noticeOf(page, /修改原因/)).toBeVisible();
  await page.keyboard.press('Escape');
  await editMoveQty(page, subRow, { qty: 480, reason: '實際只搬了這些' });
  await expect(subCell(subRow, '搬運數量')).toHaveText('480');
  const drawer = await openTicketDrawer(page, 'TT-20260827-001');
  await expect(drawer).toContainText('已點收');
  const entry = drawer.locator('.ant-timeline-item', { hasText: '實際只搬了這些' }).first();
  await expect(entry).toContainText('500');
  await expect(entry).toContainText('480');
});

test('10.58 轉交以站點為目的地：單頭記目的產線、明細記目的站點，回報一次抵達', async ({ page }) => {
  test.setTimeout(180_000);
  // 前置：印務把鏈四精裝裝訂的目的站點改為壓克力產線的雷切站（站點選單依產線分組，假資料）
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0820');
  await taskRows(page)
    .filter({ hasText: '精裝裝訂' })
    .getByRole('button', { name: '編輯備註與目的站點' })
    .click();
  await formField(page, '目的站點').locator('.ant-select').click();
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await expect(dropdown).toContainText('壓克力產線');
  await dropdown.locator('.ant-select-item-option', { hasText: '雷切站' }).click();
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(page.getByText(/已更新目的站點/)).toBeVisible();

  // 生管建單：預計轉交日必填（帶今天、可改）、選負責廠務；單頭目的產線壓克力產線，明細目的站點雷切站
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/pending-moves');
  const moveRow = page.locator('tr', { hasText: '精裝裝訂' });
  await expect(moveRow).toContainText('雷切站');
  await moveRow.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /建立轉交單（1）/ }).click();
  await expect(dialogOf(page, '建立轉交單')).toContainText('壓克力產線');
  await assignMover(page);
  await page.getByRole('button', { name: /建立 1 張單/ }).click();
  const toast = page.getByText(CREATED_TOAST);
  await expect(toast).toBeVisible();
  const ticketNo = (await toast.innerText()).match(/TT-\d{8}-\d{3}/)[0];
  await gotoInApp(page, '/production-floor/transfers');
  await expect(page.locator('tr.ant-table-row', { hasText: ticketNo }).first()).toContainText('壓克力產線');
  const sub = await ticketDetailSubRow(page, ticketNo, '精裝裝訂');
  await expect(subCell(sub, '目的站點')).toHaveText('雷切站');

  // 負責廠務開始搬運、一次回報抵達並附簽收照片：轉已送達
  await switchRole(page, '廠務');
  await gotoInApp(page, '/production-floor/transfers/mine');
  const mine = page.locator('tr.ant-table-row', { hasText: ticketNo }).first();
  await mine.getByRole('button', { name: '開始搬運' }).click();
  await expect(page.getByText(/已回報開始搬運/).last()).toBeVisible();
  await mine.getByRole('button', { name: '抵達站點' }).click();
  const deliverDialog = dialogOf(page, '回報抵達站點');
  await deliverDialog.locator('input[type="file"]').first().setInputFiles(FAKE_PHOTO('雷切站照.jpg'));
  await confirmDialog(deliverDialog);
  await expect(page.getByText(/已回報抵達站點/).last()).toBeVisible();
  await expect(mine).toContainText('已送達');
});
