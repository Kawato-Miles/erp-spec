import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  correctDialog,
  createTransferToQc,
  expandedRecords,
  gotoInAppSafe,
  inspectAtQc,
  inspectDialog,
  moveTransferToQc,
  pendingRow,
  pickFailReason,
  receiveAtQc,
  switchRoleSafe,
} from './_setup.mjs';

// 11.8 要跨四個角色與四個頁面推完一段轉交鏈，單條情境的時間拉得比預設長
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

// 品檢站清單的表頭
const qcHeader = (page) => page.locator('.ant-table-thead').first();

test('11.1 待驗清單依印件做出來的良品列出，不依轉交（原編號 27）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');

  // 欄位：印件、所屬訂單編號、客戶名稱、品檢需求、齊套完成數、已驗（通過／不通過）、待驗量、操作
  await expect(qcHeader(page)).toContainText('印件');
  await expect(qcHeader(page)).toContainText('所屬訂單編號');
  await expect(qcHeader(page)).toContainText('客戶名稱');
  await expect(qcHeader(page)).toContainText('品檢需求');
  await expect(qcHeader(page)).toContainText('齊套完成數');
  await expect(qcHeader(page)).toContainText('已驗（通過／不通過）');
  await expect(qcHeader(page)).toContainText('待驗量');
  await expect(qcHeader(page)).toContainText('操作');
  // 待驗量只看做出來的良品，貨在哪裡到轉交單管理查
  await expect(page.getByText('待驗量＝做出來的良品 − 已驗量，只看做出來多少')).toBeVisible();

  // 鏈一 PI-2026-0601：良品 5,000、已驗 5,000、待驗量 0，列留著、驗收鈕停用
  const done = pendingRow(page, 'PI-2026-0601');
  await expect(done).toContainText('會員卡（客製燙金）');
  await expect(done).toContainText('ORD-2026-0601');
  await expect(done).toContainText('誠品書店股份有限公司');
  await expect(done).toContainText('5,000');
  await expect(done).toContainText('5,000 ／ 0');
  await expect(done).toContainText('0（已驗完）');
  await expect(done.getByRole('button', { name: '驗收' })).toBeDisabled();

  // 鏈四 PI-2026-0820：精裝裝訂已報工良品 500、尚無轉交單，照樣列出待驗量 500
  const pending = pendingRow(page);
  await expect(pending).toContainText(CHAIN4.printItemName);
  await expect(pending).toContainText(CHAIN4.orderNo);
  await expect(pending).toContainText(CHAIN4.clientName);
  await expect(pending).toContainText('500');
  await expect(pending).toContainText('0 ／ 0');
  await expect(pending.getByRole('button', { name: '驗收' })).toBeEnabled();

  // 沒有良品也沒有品檢紀錄的印件不列（鏈二裁切未完成、鏈三尚未派工）
  await expect(page.locator('tr.ant-table-row')).toHaveCount(2);

  // 只有品檢人員看得到操作欄：換成業務時整頁沒有驗收鈕，並提示要切換角色
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(page.getByRole('button', { name: '驗收' })).toHaveCount(0);
  await expect(page.getByText('驗收與更正由品檢人員執行')).toBeVisible();
});

test('11.2 品檢人員分次驗收，通過數即時計入完工良品數（原編號 28）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await expect(pendingRow(page)).toContainText('500');

  // 不通過大於 0 而未選原因會被擋下
  await pendingRow(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill('300');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('20');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(dialog.getByText('不通過數量大於 0 時必填原因')).toBeVisible();

  // 補上原因後第一批成立：待驗量由 500 降為 180
  await pickFailReason(page, dialog);
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(pendingRow(page)).toContainText('180');

  // 第二批驗完：待驗量歸零，該列留在清單上、驗收鈕停用而不消失
  await inspectAtQc(page, { passed: 180, failed: 0 });
  await expect(pendingRow(page)).toContainText('0（已驗完）');
  await expect(pendingRow(page).getByRole('button', { name: '驗收' })).toBeDisabled();

  // 印件列表的完工良品數與可出貨額度同步長出來（通過 300＋180）
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  const row = page.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) });
  await expect(row).toContainText('480');
  await expect(row).toContainText('品檢缺口 20');
});

test('11.3 驗收數量不得超過待驗量（原編號 52）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await pendingRow(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await expect(dialog).toContainText('本站待驗量 500（可驗良品 500 − 已驗 0）');
  await expect(dialog).toContainText('本批驗出多種不良時分批各記一筆');

  // 填 600 送出：整筆擋下並顯示當下待驗量 500，且輸入框不自動把數字砍到上限內
  const passedInput = dialog.getByLabel('通過數量', { exact: true });
  await passedInput.fill('600');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(dialog.getByText('通過＋不通過不可超過本站待驗量 500').first()).toBeVisible();
  await expect(page.getByText(/已記錄驗收/)).toHaveCount(0);
  await expect(passedInput).toHaveValue('600');

  // 改成合計不超過待驗量即成立（通過 400、不通過 100）
  await passedInput.fill('400');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('100');
  await pickFailReason(page, dialog);
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(pendingRow(page)).toContainText('400 ／ 100');
  await expect(pendingRow(page)).toContainText('0（已驗完）');
});

test('11.4 製作帳與品質帳並排，互不覆蓋（原編號 103）', async ({ page }) => {
  // 起點：鏈四齊套完成數 500、尚未驗收
  await openAs(page, '印務主管', '/print-items');
  await openPrintItemDetail(page, CHAIN4.printItemName);

  // 兩個數字並排且互不覆蓋；驗收前品質帳為 0、缺口等於待驗量
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
  // 起點：驗收前印件列表的完工良品數與可出貨額度皆為 0
  await openAs(page, '印務主管', '/print-items');
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
  const dialog = page
    .locator('.ant-modal-content')
    .filter({ hasText: '建立出貨單（同訂單可合箱' })
    .first();
  const orderBox = dialog.getByRole('combobox').first();
  await orderBox.click();
  await orderBox.fill(CHAIN4.orderNo);
  await page
    .locator('.ant-select-dropdown:visible')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: CHAIN4.orderNo })
    .first()
    .click();
  await dialog.getByRole('tab', { name: /出貨印件/ }).click();
  await expect(
    dialog.getByRole('row', { name: new RegExp(CHAIN4.printItemNo) }),
  ).toContainText('480');
});

test('11.6 訂單詳情的完工良品數與印件兩處同源（原編號 115）', async ({ page }) => {
  // 起點：尚未驗收，印件列表與訂單詳情的完工良品數皆為 0
  await openAs(page, '業務', '/print-items');
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
  ).toHaveText('－');
});

test('11.7 品檢站在桌機是表格，窄視窗靠側欄收合與橫向捲動（原編號 120）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');

  // 桌機：表格版型，每一列帶所屬訂單編號與客戶名稱，也可展開看該印件的歷次品檢紀錄
  await expect(page.locator('.ant-table').first()).toBeVisible();
  await expect(page.getByText('待驗量＝做出來的良品 − 已驗量，只看做出來多少')).toBeVisible();
  await expect(pendingRow(page)).toContainText(CHAIN4.orderNo);
  await expect(pendingRow(page)).toContainText(CHAIN4.clientName);
  const doneRow = pendingRow(page, 'PI-2026-0601');
  await doneRow.getByLabel('展開行').click();
  const records = expandedRecords(page, 'PI-2026-0601');
  await expect(records).toContainText('品檢時間');
  await expect(records).toContainText('通過／不通過');
  await expect(records).toContainText('不通過原因');
  await expect(records).toContainText('品檢人員');
  await expect(records).toContainText('+5,000');
  await expect(records).toContainText('郭淑芬');

  // 視窗縮到 700 像素：側欄收合為圖示列，表格改為橫向捲動、整頁不被推出視窗
  await page.setViewportSize({ width: 700, height: 900 });
  await expect(page.locator('.ant-layout-sider-collapsed')).toHaveCount(1);
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const box = document.querySelector('.ant-table-content');
          return box ? box.scrollWidth > box.clientWidth : false;
        }),
      { timeout: 8000 },
    )
    .toBe(true);
  await expect
    .poll(
      () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      { timeout: 8000 },
    )
    .toBe(true);

  // 生管與印務主管：側欄有「品檢與出貨」，進頁看得到同一張清單但沒有操作欄
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const role of ['生管', '印務主管']) {
    await switchRoleSafe(page, role);
    await gotoInAppSafe(page, '/qc-shipping/inspection');
    await expect(pendingRow(page)).toContainText(CHAIN4.printItemName);
    await expect(page.locator('.ant-table-thead').first()).not.toContainText('操作');
    await expect(page.getByRole('button', { name: '驗收' })).toHaveCount(0);
    await expect(page.getByText('驗收與更正由品檢人員執行')).toBeVisible();
  }
});

test('11.8 待驗量由做出來的良品推導，轉交與點收都不改變它（原編號 121）', async ({ page }) => {
  // 起點：尚無轉交單，待驗量已是 500
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await expect(pendingRow(page)).toContainText('500');
  // 品檢站頁不呈現來源站點與點收時間（貨在哪裡由轉交單管理回答）
  await expect(qcHeader(page)).not.toContainText('來源站點');
  await expect(qcHeader(page)).not.toContainText('點收時間');

  // 生管建一張到品檢站的轉交單、廠務搬運並抵達、品檢人員點收
  await switchRoleSafe(page, '生管');
  await createTransferToQc(page);
  await moveTransferToQc(page);
  await receiveAtQc(page);

  // 點收前後待驗量都是 500：轉交事實不參與待驗量的算式
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(pendingRow(page)).toContainText('500');
  await expect(pendingRow(page)).toContainText('0 ／ 0');

  // 貨在哪裡到轉交單管理查：該張單的目的站點與明細數量都在那裡
  await switchRoleSafe(page, '生管');
  await gotoInAppSafe(page, '/production-floor/transfers');
  const ticketRow = page.getByRole('row', { name: /已點收/ }).first();
  await expect(ticketRow).toContainText('品檢站');
  await expect(ticketRow).toContainText('500');
});

test('11.9 分次驗收與待驗量歸零後的防呆（原編號 122）', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');

  // 第一批：不通過大於 0 必選原因，原因為固定分組選項、沒有「其他」
  await pendingRow(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill('300');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('20');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(dialog.getByText('不通過數量大於 0 時必填原因')).toBeVisible();
  // 原因為分組選項；六組值域與「沒有其他」的完整驗算在純函式測試
  // tests/unit/qc-shipping/qc-fail-reasons.test.mjs
  await pickFailReason(page, dialog);
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(pendingRow(page)).toContainText('180');

  // 第二批把待驗量驗完：列留著顯示已驗完，驗收鈕停用並提示已驗完
  await inspectAtQc(page, { passed: 180, failed: 0 });
  await expect(pendingRow(page)).toContainText('0（已驗完）');
  const inspectButton = pendingRow(page).getByRole('button', { name: '驗收' });
  await expect(inspectButton).toBeDisabled();
  await inspectButton.locator('xpath=..').hover();
  await expect(page.locator('.ant-tooltip').filter({ hasText: '已驗完' }).first()).toBeVisible();
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

test('11.11 品檢驗收介面看得到印件的品檢需求', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');

  // 清單上的品檢需求欄（唯讀，取該印件）
  await expect(pendingRow(page, 'PI-2026-0601')).toContainText(
    '色差全檢，卡角裁切允差 0.3mm。',
  );
  await expect(pendingRow(page)).toContainText(
    '書背厚度與封面裁切對版允差 0.5mm，精裝黏合牢固度抽檢 5%。',
  );

  // 驗收對話框頂端顯示同一段文字，品檢人員不必退出對話框回頭查
  await pendingRow(page).getByRole('button', { name: '驗收' }).click();
  const dialog = inspectDialog(page);
  await expect(dialog).toContainText(
    '品檢需求：書背厚度與封面裁切對版允差 0.5mm，精裝黏合牢固度抽檢 5%。',
  );

  // 唯讀：對話框裡這一段不是可填的欄位，也沒有任何編輯入口（要改回印件詳情或工單詳情）
  await expect(dialog.getByLabel('品檢需求')).toHaveCount(0);
  await expect(dialog.getByRole('textbox', { name: /品檢需求/ })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /編輯/ })).toHaveCount(0);

  // 製程說明是給主管審核與工廠做活看的，不出現在驗收介面
  await expect(dialog).not.toContainText('製程說明');
  await expect(page.locator('.ant-table-thead').first()).not.toContainText('製程說明');
});

test('11.12 印件的品檢需求沒填時顯示破折號，驗收照樣記得下去', async ({ page }) => {
  // 前置：印務主管把鏈四 PI-2026-0820 的品檢需求清成空白（兩欄選填，清空存得了）。
  // 無值符號＝全形連字號「－」（Miles 2026-09-21 拍板，全站同一個字元），本測試照畫面實際字元斷言。
  await openAs(page, '印務主管', `/print-items/detail?id=${CHAIN4.printItemNo}`);
  await page.getByRole('button', { name: /編輯製程與品檢/ }).click();
  const editDrawer = page.locator('.ant-drawer-body');
  await editDrawer.getByLabel(/品檢需求/).fill('');
  await page.locator('.ant-drawer').getByRole('button', { name: /儲\s*存/ }).click();
  await expect(page.getByText('已更新製程說明與品檢需求').first()).toBeVisible();
  await expect(descValue(page, '品檢需求')).toHaveText('－');

  // 清單與驗收對話框的品檢需求都印破折號
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  // 欄位順序：展開、印件、所屬訂單編號、客戶名稱、品檢需求…，品檢需求為第 5 格
  await expect(pendingRow(page).locator('td').nth(4)).toHaveText('－');
  await pendingRow(page).getByRole('button', { name: '驗收' }).click();
  await expect(inspectDialog(page)).toContainText('品檢需求：－');

  // 沒寫檢驗要點不擋下驗收：這一筆照樣記得成立
  const dialog = inspectDialog(page);
  await dialog.getByLabel('通過數量', { exact: true }).fill('500');
  await dialog.getByLabel('不通過數量', { exact: true }).fill('0');
  await dialog.getByRole('button', { name: '記錄驗收' }).click();
  await expect(page.getByText(/已記錄驗收/).first()).toBeVisible();
  await expect(pendingRow(page)).toContainText('500 ／ 0');
});

test('11.13 印務改過品檢需求後，驗收介面顯示新的一份，舊紀錄不留快照', async ({ page }) => {
  const ORIGINAL = '書背厚度與封面裁切對版允差 0.5mm，精裝黏合牢固度抽檢 5%。';
  const UPDATED = '書背厚度改抽檢 10%，封面燙金位置偏移不得超過 1mm。';

  // 前置：已驗完一筆（通過 500），此時印件的品檢需求為 mock 的那一段
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await inspectAtQc(page, { passed: 500, failed: 0 });
  await expect(pendingRow(page)).toContainText('500 ／ 0');

  // 印務主管把品檢需求改成新的一段
  await switchRoleSafe(page, '印務主管');
  await gotoInAppSafe(page, '/print-items');
  await openPrintItemDetail(page, CHAIN4.printItemName);
  await expect(descValue(page, '品檢需求')).toHaveText(ORIGINAL);
  await page.getByRole('button', { name: /編輯製程與品檢/ }).click();
  const editDrawer = page.locator('.ant-drawer-body');
  await editDrawer.getByLabel(/品檢需求/).fill(UPDATED);
  await page.locator('.ant-drawer').getByRole('button', { name: /儲\s*存/ }).click();
  await expect(page.getByText('已更新製程說明與品檢需求').first()).toBeVisible();

  // 品檢人員回品檢站：清單顯示新的那一段，不是驗收當時的舊值
  await switchRoleSafe(page, '品檢人員');
  await gotoInAppSafe(page, '/qc-shipping/inspection');
  await expect(pendingRow(page)).toContainText(UPDATED);
  await expect(pendingRow(page)).not.toContainText(ORIGINAL);

  // 展開的那一筆品檢紀錄沒有品檢需求這個欄位，也沒有留下舊值的快照
  await pendingRow(page).getByLabel('展開行').click();
  const records = expandedRecords(page);
  await expect(records).toContainText('+500');
  await expect(records).not.toContainText('品檢需求');
  await expect(records).not.toContainText(ORIGINAL);
});

test('11.16 更正紀錄沖銷後待驗量回升', async ({ page }) => {
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await inspectAtQc(page, { passed: 500, failed: 0 });
  await expect(pendingRow(page)).toContainText('0（已驗完）');

  // 展開該列對那一筆補一筆更正紀錄（通過 −500）
  await pendingRow(page).getByLabel('展開行').click();
  await expandedRecords(page).getByRole('button', { name: '補更正紀錄' }).first().click();
  const dialog = correctDialog(page);
  await dialog.getByLabel('通過數量更正（可填負數）', { exact: true }).fill('-500');
  await dialog.getByRole('button', { name: '送出更正紀錄' }).click();
  await expect(page.getByText(/已補一筆更正紀錄/).first()).toBeVisible();

  // 已驗量以代數和回到 0，待驗量回升為 500，驗收鈕重新可按
  await expect(pendingRow(page)).toContainText('0 ／ 0');
  await expect(pendingRow(page)).toContainText('500');
  await expect(pendingRow(page).getByRole('button', { name: '驗收' })).toBeEnabled();
});

test('11.18 更正紀錄沖不到負數', async ({ page }) => {
  // 前置：驗一筆通過 500，已驗量 500、待驗量 0
  await openAs(page, '品檢人員', '/qc-shipping/inspection');
  await inspectAtQc(page, { passed: 500, failed: 0 });
  await expect(pendingRow(page)).toContainText('0（已驗完）');

  // 展開該列對那一筆補更正紀錄，通過數量更正填 −600
  await pendingRow(page).getByLabel('展開行').click();
  await expandedRecords(page).getByRole('button', { name: '補更正紀錄' }).first().click();
  const dialog = correctDialog(page);
  const passedDelta = dialog.getByLabel('通過數量更正（可填負數）', { exact: true });
  await passedDelta.fill('-600');
  await dialog.getByRole('button', { name: '送出更正紀錄' }).click();

  // 整筆擋下，訊息只有一句；紀錄不新增、已驗量不動
  await expect(page.getByText('更正後的累計不得低於 0').first()).toBeVisible();
  await expect(page.getByText(/已補一筆更正紀錄/)).toHaveCount(0);

  // 改成 −500 剛好沖到 0：這一筆成立，待驗量回升為 500
  await passedDelta.fill('-500');
  await dialog.getByRole('button', { name: '送出更正紀錄' }).click();
  await expect(page.getByText(/已補一筆更正紀錄/).first()).toBeVisible();
  await expect(pendingRow(page)).toContainText('0 ／ 0');
  await expect(pendingRow(page).getByRole('button', { name: '驗收' })).toBeEnabled();
});
