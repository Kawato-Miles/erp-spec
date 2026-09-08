import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  gotoInAppSafe,
  inspectAtQc,
  inspectDialog,
  pendingCard,
  pendingPanel,
  recordedCard,
  setupArrivedAtQc,
  setupQcReadyState,
  switchRoleSafe,
} from './_setup.mjs';

// 前置鏈（建轉交單 → 搬運 → 抵達 → 點收）要跨四個角色與四個頁面，單條情境的時間拉得比預設長
test.describe.configure({ timeout: 180_000 });

// 詳情頁「標題：值」的值（AntD Descriptions 以 th／td 成對呈現）
const descValue = (page, label) =>
  page.locator(`xpath=//th[normalize-space(.)="${label}"]/following-sibling::td[1]`).first();

// 印件列表點印件名稱開詳情（名稱為可點文字，非帶網址的連結）
const openPrintItemDetail = async (page, name) => {
  await page.getByText(name, { exact: true }).first().click();
  await expect(page.getByText('印件基本資訊')).toBeVisible();
};

// 訂單列表點訂單編號開詳情，並切到訂單項目頁籤
const openOrderItemsTab = async (page, orderNo) => {
  await page.getByText(orderNo, { exact: true }).first().click();
  await page.getByRole('tab', { name: /訂單項目/ }).click();
};

test('11.1 品檢待驗清單只認已點收的轉交單（原編號 27）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');

  // 鏈一的貨已點收且已驗完：列留在清單上，四個欄位齊備
  const card = pendingCard(page, 'PI-2026-0601');
  await expect(card).toContainText('會員卡（客製燙金）');
  await expect(card).toContainText('來源站點');
  await expect(card).toContainText('裁切成型｜POLAR 137 裁切機');
  await expect(card).toContainText('待驗量（在站量）');
  await expect(card).toContainText('0（已驗完）');
  await expect(card).toContainText('點收時間');
  await expect(card).toContainText('2026-06-18 11:00');
  await expect(card.getByRole('button', { name: '驗收' })).toBeDisabled();

  // 只有品檢人員看得到驗收鈕：換成業務時整頁沒有驗收鈕，並提示要切換角色
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(page.getByRole('button', { name: '驗收' })).toHaveCount(0);
  await expect(page.getByText('驗收與更正由品檢人員執行')).toBeVisible();
});

test('11.2 品檢人員分次驗收，通過數即時計入完工良品數（原編號 28）', async ({ page }) => {
  // 前置：生管建轉交單到品檢站 → 廠務搬運並抵達 → 品檢人員點收（待驗量 500）
  await setupQcReadyState(page);
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(pendingCard(page)).toContainText('500');

  // 不通過大於 0 而未選原因會被擋下
  await pendingCard(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill('300');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('20');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(dialog.getByText('不通過數量大於 0 時必填原因')).toBeVisible();

  // 補上原因後第一批成立：待驗量由 500 降為 180
  await dialog.getByLabel('不通過原因').click();
  await page.getByTitle('色差／偏色').click();
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(pendingCard(page)).toContainText('180');

  // 第二批驗完：待驗量歸零，該列留在清單上、驗收鈕停用而不消失
  await inspectAtQc(page, { passed: 180, failed: 0 });
  await expect(pendingCard(page)).toContainText('0（已驗完）');
  await expect(pendingCard(page).getByRole('button', { name: '驗收' })).toBeDisabled();

  // 印件列表的完工良品數與可出貨額度同步長出來（通過 300＋180）
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  const row = page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) });
  await expect(row).toContainText('480');
  await expect(row).toContainText('品檢缺口 20');
});

test('11.3 驗收數量不得超過在站量（原編號 52）', async ({ page }) => {
  // 前置：貨已點收，品檢站待驗量 500
  await setupQcReadyState(page);
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await pendingCard(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await expect(dialog).toContainText('本站在站量 500（已點收）');
  await expect(dialog).toContainText('本批驗出多種不良時分批各記一筆');

  // 通過＋不通過合計超過待驗量：整筆擋下並提示上限，兩個欄位都不進帳
  await dialog.getByLabel('通過數量', { exact: true }).fill('400');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('200');
  await dialog.getByLabel('不通過原因').click();
  await page.getByTitle('色差／偏色').click();
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(dialog.getByText('通過＋不通過不可超過本站在站量 500').first()).toBeVisible();
  await expect(page.getByText(/已記錄驗收/)).toHaveCount(0);

  // 改成合計不超過待驗量即成立
  await dialog.getByLabel('不通過數量', { exact: true }).fill('100');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(recordedCard(page)).toContainText('400');
});

test('11.4 製作帳與品質帳並排，互不覆蓋（原編號 103）', async ({ page }) => {
  // 前置：貨已送到品檢站並點收，尚未驗收
  await setupQcReadyState(page);
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  await openPrintItemDetail(page, CHAIN4.printItemName);

  // 兩個數字並排且互不覆蓋；驗收前品質帳為 0、缺口等於在品檢站待驗的量
  await expect(descValue(page, '製作進度（齊套完成數／購買數量）')).toHaveText('500 / 500');
  await expect(descValue(page, '品質帳（完工良品數／缺口）')).toContainText('0');
  await expect(descValue(page, '品質帳（完工良品數／缺口）')).toContainText('500');

  // 區塊內另列目標數量、報廢數、不通過累計、未處置缺口、累計已出貨數量、累計送達數、可出貨額度
  await expect(descValue(page, '目標數量')).toHaveText('500');
  await expect(descValue(page, '報廢數')).toHaveText('0');
  await expect(descValue(page, '不通過累計')).toHaveText('0');
  await expect(descValue(page, '未處置品檢缺口')).toHaveText('0');
  await expect(page.getByText('累計已出貨數量')).toBeVisible();
  await expect(descValue(page, '累計送達數')).toHaveText('0');
  await expect(descValue(page, '可出貨額度')).toHaveText('0');
  // 不出現舊欄名
  await expect(page.getByText('入庫數量')).toHaveCount(0);

  // 驗收後：品質帳等於通過數、缺口等於不通過數（通過 480、不通過 20）
  await switchRoleSafe(page, '品檢人員');
  await inspectAtQc(page, { passed: 480, failed: 20 });
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  await openPrintItemDetail(page, CHAIN4.printItemName);
  await expect(descValue(page, '製作進度（齊套完成數／購買數量）')).toHaveText('500 / 500');
  await expect(descValue(page, '品質帳（完工良品數／缺口）')).toContainText('480');
  await expect(descValue(page, '品質帳（完工良品數／缺口）')).toContainText('20');

  // 訂單詳情印件列的進度數字＝齊套完成數，與印件詳情頁一致（訂單列表限業務端側欄可達）
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await openOrderItemsTab(page, CHAIN4.orderNo);
  await expect(
    page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }).first(),
  ).toContainText('500');
});

test('11.5 品質帳只有一份，驗完三處同時變（原編號 104）', async ({ page }) => {
  // 前置：貨已點收；驗收前印件列表的完工良品數與可出貨額度皆為 0
  await setupQcReadyState(page);
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  const row = () => page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) });
  await expect(row()).toContainText('500');

  // 品檢人員驗收：通過 480、不通過 20
  await switchRoleSafe(page, '品檢人員');
  await inspectAtQc(page, { passed: 480, failed: 20 });

  // 印件列表該列同步
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  await expect(row()).toContainText('480');
  await expect(row()).toContainText('品檢缺口 20');

  // 印件詳情頁的品質帳、不通過累計、未處置缺口、可出貨額度一致
  await openPrintItemDetail(page, CHAIN4.printItemName);
  await expect(descValue(page, '品質帳（完工良品數／缺口）')).toContainText('480');
  await expect(descValue(page, '不通過累計')).toHaveText('20');
  await expect(descValue(page, '未處置品檢缺口')).toHaveText('20');
  await expect(descValue(page, '可出貨額度')).toHaveText('480');

  // 品檢紀錄頁籤立即多一列（時間、通過、不通過、原因、檢驗人）
  await page.getByRole('tab', { name: /品檢紀錄/ }).click();
  const qcRow = page.getByRole('row', { name: /色差／偏色/ }).first();
  await expect(qcRow).toContainText('480');
  await expect(qcRow).toContainText('20');
  await expect(qcRow).toContainText('郭淑芬');

  // 出貨建單的可出貨額度同步
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await page.getByRole('button', { name: '建立出貨單' }).first().click();
  const dialog = page.locator('.ant-modal-content').filter({ hasText: '建立出貨單（同訂單可合箱' }).first();
  await dialog.getByRole('combobox').first().click();
  await page.locator('.ant-select-item-option').filter({ hasText: CHAIN4.orderNo }).first().click();
  await expect(
    dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }),
  ).toContainText('480');
});

test('11.6 訂單詳情的完工良品數與印件兩處同源（原編號 115）', async ({ page }) => {
  // 前置：貨已點收但尚未驗收，印件列表與訂單詳情的完工良品數皆為 0
  await setupQcReadyState(page);
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/print-items');
  const listRow = () => page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) });
  await expect(listRow().locator('td').nth(10)).toHaveText('0');

  await gotoInAppSafe(page, '/orders');
  await openOrderItemsTab(page, CHAIN4.orderNo);
  const orderItemRow = () =>
    page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }).first();
  await expect(orderItemRow()).not.toContainText('480');

  // 品檢人員驗收 480
  await switchRoleSafe(page, '品檢人員');
  await inspectAtQc(page, { passed: 480, failed: 20 });

  // 回訂單詳情：完工良品數即時改寫，不停在舊值
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/orders');
  await openOrderItemsTab(page, CHAIN4.orderNo);
  await expect(orderItemRow()).toContainText('480');

  // 印件模組沒有對應紀錄的印件顯示破折號，不用舊欄位補位（鏈三 PI-2026-0815 尚未派工）
  await gotoInAppSafe(page, '/print-items');
  await expect(
    page.getByRole('row', { name: /PI-2026-0815/ }).locator('td').nth(11),
  ).toHaveText('—');
});

test('11.7 品檢頁在手機寬度下的版型（原編號 120）', async ({ page }) => {
  await setupQcReadyState(page);
  await gotoInAppSafe(page, '/qc-shipping/inspection');

  // 窄版：單欄卡片，每張卡含印件名與類型標籤、印件編號、來源站點、待驗量、點收時間、累計
  await page.setViewportSize({ width: 375, height: 812 });
  const card = pendingCard(page);
  await expect(card).toContainText(CHAIN4.printItemName);
  await expect(card).toContainText('大貨印件');
  await expect(card).toContainText(CHAIN4.printItemNo);
  await expect(card).toContainText('來源站點');
  await expect(card).toContainText('待驗量（在站量）');
  await expect(card).toContainText('點收時間');
  await expect(card).toContainText('累計（通過／不通過）');
  // 不是橫向捲動的表格：清單區塊裡沒有表格，整頁也不橫向捲動
  await expect(pendingPanel(page).locator('table')).toHaveCount(0);
  const noOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth + 1,
  );
  expect(noOverflow).toBe(true);

  // 驗收表單為全寬單欄、按鈕單手按得到
  await card.getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await expect(dialog.getByLabel('通過數量', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: '記錄驗收' })).toBeVisible();
  await dialog.getByRole('button', { name: '取消' }).click();

  // 桌機寬度下版型不破、資訊順序相同
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(pendingCard(page)).toContainText('待驗量（在站量）');
  await expect(pendingCard(page)).toContainText('點收時間');
});

test('11.8 待驗量由轉交事實推導（原編號 121）', async ({ page }) => {
  // 前置：建轉交單、搬運、抵達站點（尚未點收）
  await openAs(page, '生管', '/production-floor/pending-moves');
  await setupArrivedAtQc(page);

  // 已送達但未點收的不算：品檢站待驗清單還看不到這件印件
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(pendingPanel(page)).not.toContainText(CHAIN4.printItemNo);

  // 點收後才進待驗量，且對得回轉交單明細的 500、來源站點顯示該工序與設備
  await gotoInAppSafe(page, '/production-floor/receiving');
  await page.getByRole('button', { name: '點收' }).first().click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收 TT-/)).toBeVisible();
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(pendingCard(page)).toContainText('500');
  await expect(pendingCard(page)).toContainText('精裝裝訂｜精裝線');

  // 轉交單那一張的明細數量即 500
  await switchRoleSafe(page, '生管');
  await gotoInAppSafe(page, '/production-floor/transfers');
  const ticketRow = page.getByRole('row', { name: /已點收/ }).first();
  await expect(ticketRow).toContainText('品檢站');
  await expect(ticketRow).toContainText('500');
});

test.fixme('11.9 分次驗收與單筆在站量檢核（原編號 122）', async ({ page }) => {
  // Miles 2026-09-08：品檢 prototype 尚未完善、待調整，待驗量為 0 之後的防呆形式暫不驗收
  await setupQcReadyState(page);
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await inspectAtQc(page, { passed: 300, failed: 20 });
  await expect(pendingCard(page)).toContainText('180');
  await inspectAtQc(page, { passed: 180, failed: 0 });
  await expect(pendingCard(page)).toContainText('0（已驗完）');
  await expect(pendingCard(page).getByRole('button', { name: '驗收' })).toBeDisabled();
});

test('11.10 印件詳情頁看得到歷次分次驗收（原編號 11）', async ({ page }) => {
  await openAs(page, '印務主管', '/print-items');
  await openPrintItemDetail(page, '會員卡（客製燙金）');

  // 固定區塊：印件基本資訊、印件檔案、數量與進度
  await expect(page.getByText('印件基本資訊')).toBeVisible();
  await expect(page.getByText('印件檔案')).toBeVisible();
  await expect(page.getByText('製作進度（齊套完成數／購買數量）')).toBeVisible();

  // 旗下工單在「工單與生產任務」頁籤
  await expect(page.getByRole('tab', { name: /工單與生產任務/ })).toBeVisible();

  // 歷次品檢紀錄與缺口處置留痕在品檢頁籤（通過 5,000 一筆）
  await page.getByRole('tab', { name: /品檢紀錄/ }).click();
  await expect(page.getByText(/歷次品檢紀錄（\d+）/)).toBeVisible();
  await expect(page.getByText('品檢缺口處置留痕')).toBeVisible();
  await expect(page.getByRole('row', { name: /5,000/ }).first()).toBeVisible();
});
