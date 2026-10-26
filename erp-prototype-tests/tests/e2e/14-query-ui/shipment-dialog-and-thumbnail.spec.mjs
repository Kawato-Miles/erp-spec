import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  CHAIN4,
  addBoxes,
  batchDispatch,
  clickRowAction,
  confirmShippable,
  fillPackingLines,
  submitButton,
  closeBatchResult,
  createShipment,
  expandShipmentRow,
  gotoInAppSafe,
  openCreateShipmentFromOrder,
  openLogisticsAction,
  openShipmentPanel,
  pickAndPack,
  setupShippableState,
  shipmentRow,
  startPicking,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 情境目錄 14.37、14.38（2026-10-13 新增，2026-10-22 改寫：裝箱明細加長寬高、兩處列表改子母表並刪裝箱照片欄；
// 2026-10-23 改寫：單頭刪實際出貨日、建立時標題「建立出貨單」、說明文字依 G21 三表、物流單子表刪離廠時間欄與
// 補附送達憑證、出貨管理每列有勾選框）。
// 起點資料：鏈一 SH-2026-0601（順豐、已送達；明細 PI-2026-0601 × 3,000、揀貨數量 3,000、五箱「1 號箱」45×30×15、
// 一筆物流單，裝箱照片只有檔名，歷程照第三方新路徑：可出貨 → 等待出貨 → 運送中 → 已送達）、SH-2026-0602（自取），
// 鏈四 SH-2026-0820（草稿，沒有物流單）。
// G21 三表：openspec/changes/shipment-print-download-center/g21-ui-text.md（A 刪除、B 保留縮短、C 新增）。

const LOGISTICS_SUB_HEADS = ['物流單編號', '物流單號', '箱數', '狀態', '送達時間', '例外理由', '操作'];

// G21 A 表：出貨單對話框單頭的欄位標籤只留欄位名稱，必填用星號
const REMOVED_LABEL_TEXTS = [
  '（建立出貨單時必填）',
  '寄件資訊（依訂單的帳務公司帶出）',
  '裝箱指示（選填',
  '備註（選填）',
];

test('14.37 出貨單對話框：單頭固定，出貨明細與歷程兩個頁籤；明細有完稿縮圖、揀貨數量；單頭沒有實際出貨日', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');
  const dialog = await openShipmentPanel(page, 'SH-2026-0601');

  // 檢視時標題為「出貨單編號＋狀態」（G18）
  await expect(dialog.locator('.ant-modal-header')).toContainText('SH-2026-0601');
  await expect(dialog.locator('.ant-modal-header')).toContainText('已送達');

  // 上方固定單頭，不分頁：十一項資訊都在頁籤之外（頁籤列之前的區塊）；實際出貨日已刪（H7）
  const head = dialog.locator('.ant-modal-body > div').first();
  for (const label of [
    '出貨單編號',
    '所屬訂單與客戶',
    '出貨方式',
    '箱數',
    '出貨單預計出貨日',
    '收件人與電話',
    '收件地址',
    '寄件資訊',
    '裝箱指示',
    '備註',
    '建單人',
  ]) {
    await expect(head).toContainText(label);
  }
  await expect(head).not.toContainText('實際出貨日');
  await expect(head).toContainText('ORD-2026-0601');
  await expect(head).toContainText('誠品書店股份有限公司');
  await expect(head).toContainText('王思穎');
  await expect(head).toContainText('洪嘉駿');
  // 保密代寄＝否：寄件資訊沿用帳務公司，不標保密代寄
  await expect(head).toContainText('感官文化印刷');
  await expect(head).not.toContainText('保密代寄');
  for (const text of REMOVED_LABEL_TEXTS) await expect(dialog).not.toContainText(text);

  // 兩個頁籤：出貨明細、歷程
  await expect(dialog.getByRole('tab')).toHaveText(['出貨明細', '歷程']);

  // 出貨明細：欄位依序為完稿縮圖（固定左）、印件、出貨數量、揀貨數量
  const table = dialog.locator('.ant-table-wrapper').first();
  const heads = (await table.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim());
  expect(heads).toEqual(['完稿縮圖', '印件', '出貨數量', '揀貨數量']);
  await expect(table.locator('thead th').nth(0)).toHaveClass(/ant-table-cell-fix-left/);
  const row = table.locator('tbody tr.ant-table-row').first();
  await expect(row.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  await expect(row).toContainText('會員卡（客製燙金）');
  await expect(row.locator('td').nth(2)).toContainText('3,000');
  await expect(row.locator('td').nth(3)).toContainText('3,000');
  await expect(row.locator('td')).toHaveCount(4);

  // 表下方：裝箱明細（箱序、箱規、長、寬、高、裝箱照片縮圖）與物流單表格；沒有重量、離廠時間、送達憑證；
  // 物流單表格上方沒有「寄件人：」說明（G21 A 表）
  await expect(dialog).toContainText('裝箱明細');
  const boxTable = dialog.locator('.ant-table').filter({ hasText: '所屬物流單' }).first();
  const boxHeads = (await boxTable.locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(boxHeads.slice(0, 5)).toEqual(['箱序', '箱規', '長', '寬', '高']);
  const firstBox = (await boxTable.locator('tbody tr.ant-table-row').first().locator('td').allInnerTexts()).map((t) =>
    t.trim(),
  );
  expect(firstBox.slice(0, 5)).toEqual(['001', '1 號箱', '45', '30', '15']);
  await expect(dialog).toContainText('SF1400020601001');
  await expect(dialog).toContainText('物流單編號');
  await expect(dialog).toContainText('SH-2026-0601-001');
  for (const gone of ['重量', '離廠時間', '送達憑證', '寄件人：']) await expect(dialog).not.toContainText(gone);
  await expect(dialog).toContainText('裝箱照片');
  await expect(dialog.getByRole('img', { name: /裝箱照片/ })).toHaveCount(5);
  await expect(dialog).not.toContainText('.jpg');

  // 歷程：新到舊，時間、操作人、前後值與附件縮圖；第三方新路徑，送達記物流商回傳
  await dialog.getByRole('tab', { name: '歷程' }).click();
  const timeline = dialog.locator('.ant-timeline');
  const items = await timeline.locator('.ant-timeline-item').allInnerTexts();
  expect(items.length).toBeGreaterThan(5);
  expect(items[0]).toContain('物流單 SH-2026-0601-001');
  expect(items[0]).toContain('物流商回傳');
  expect(items.some((t) => t.includes('運送中 → 已送達'))).toBe(true);
  expect(items.some((t) => t.includes('確認可出貨'))).toBe(true);
  expect(items.some((t) => t.includes('已出貨'))).toBe(false);
  const packIndex = items.findIndex((t) => t.includes('裝箱回報') && !t.includes('修正'));
  expect(items[packIndex]).toContain('范姜宏');
  await expect(timeline.locator('.ant-timeline-item').nth(packIndex).getByRole('img')).toHaveCount(5);
  expect(items[items.length - 1]).toContain('建立出貨單');
});

test('14.37 建立時標題為「建立出貨單」，欄位標籤只留名稱、必填用星號；草稿的物流單表格顯示沒有資料（G18、G21 A 表）', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');
  const dialog = await openCreateShipmentFromOrder(page);
  await expect(dialog.locator('.ant-modal-title')).toHaveText('建立出貨單');
  for (const text of REMOVED_LABEL_TEXTS) await expect(dialog).not.toContainText(text);
  // 必填用星號：出貨方式、收件人、收件地址三欄的標籤帶必填標記
  for (const id of ['method', 'receiver_name', 'receiver_address']) {
    await expect(dialog.locator(`label[for="${id}"]`)).toHaveClass(/ant-form-item-required/);
  }
  await expect(dialog).not.toContainText('實際出貨日');
  await dialog.getByRole('button', { name: /取\s*消/ }).click();

  // 草稿沒有物流單：物流單表格用元件預設的「沒有資料」，不寫「尚未裝箱回報，還沒有物流單」
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const draft = await openShipmentPanel(page, CHAIN4.draftShipmentNo);
  await expect(draft).not.toContainText('尚未裝箱回報，還沒有物流單');
  await expect(draft).not.toContainText('寄件人：');
});

test('14.37 現場動作對話框的說明文字依 G21 三表：裝箱回報、批次拋單、送達確認、作廢物流單與成功訊息', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const hctNo = await createShipment(page, { qty: 100, method: '新竹物流' });

  // 裝箱回報對話框：裝箱照片欄名不帶「（至少一張）」、改用必填星號；備註欄名不帶「（選填）」；
  // 空表格用元件預設的「沒有資料」（A 表）
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await startPicking(page, hctNo);
  const report = await clickRowAction(page, hctNo, '裝箱回報');
  await expect(report).toContainText('沒有資料');
  await expect(report).not.toContainText('還沒有裝箱明細');
  await addBoxes(page, report, { boxes: 2 });
  await expect(report).not.toContainText('裝箱照片（至少一張）');
  await expect(report).not.toContainText('備註（選填）');
  const photoHead = report.locator('.ant-table-thead th').filter({ hasText: '裝箱照片' }).first();
  await expect(photoHead).toBeVisible();
  await expect(photoHead).not.toContainText('（');
  await fillPackingLines(report, [{ pickedQty: 100 }]);
  await submitButton(report, '裝箱回報').click();
  // 成功訊息統一「已＋動作名稱」（A 表）
  await expect(page.locator('.ant-message-notice-content').last()).toHaveText('已裝箱回報');
  await confirmShippable(page, hctNo);
  await expect(page.locator('.ant-message-notice-content').last()).toHaveText('已確認可出貨');

  // 揀貨不符警示框（B 表）：「揀貨數量與出貨明細不符：印件名稱」
  const mismatchNo = await (async () => {
    await switchRoleSafe(page, '業務');
    await gotoInAppSafe(page, '/qc-shipping/shipments');
    return createShipment(page, { qty: 50, method: '新竹物流' });
  })();
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  await pickAndPack(page, mismatchNo, { pickedQty: 40, boxes: 1, confirm: false });
  const mismatchPanel = await openShipmentPanel(page, mismatchNo);
  await expect(mismatchPanel).toContainText(`揀貨數量與出貨明細不符：${CHAIN4.printItemName}`);
  await mismatchPanel.getByRole('button', { name: /^(關\s*閉|取\s*消)$/ }).click();

  // 修正對話框：不能改的列直接唯讀，不另寫「已離廠或已作廢物流單底下的箱不能修改……」（A 表）
  const fix = await clickRowAction(page, hctNo, '修正');
  await expect(fix).not.toContainText('已離廠或已作廢物流單底下的箱不能修改');
  await expect(fix).not.toContainText('請由業務作廢物流單');
  await fix.getByRole('button', { name: /取\s*消/ }).click();

  // 批次拋單對話框：不寫「失敗的物流單停在已裝箱，錯誤訊息不另保存……」（A 表）
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const batch = await batchDispatch(page, hctNo);
  await expect(batch).not.toContainText('失敗的物流單停在');
  await expect(batch).not.toContainText('錯誤訊息不另保存');
  await closeBatchResult(page);

  // 送達確認：未送達數量改成區塊標題「未送達數量」，不帶括號說明（A 表）；成功訊息「已送達確認」
  const deliver = await openLogisticsAction(page, hctNo, '送達確認', 0);
  await expect(deliver).toContainText('未送達數量');
  await expect(deliver).not.toContainText('逐印件未送達數量（');
  await deliver.getByRole('button', { name: /取\s*消/ }).click();

  // 作廢物流單（業務）：區塊標題「未送達數量」；不是最後一筆時沒有「作廢後出貨單一併作廢」
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, '/qc-shipping/shipments');
  const voidDialog = await openLogisticsAction(page, hctNo, '作廢物流單', 0);
  await expect(voidDialog).toContainText('未送達數量');
  await expect(voidDialog).not.toContainText('逐印件未送達數量（');
  await expect(voidDialog).not.toContainText('作廢後出貨單一併作廢');
  await voidDialog.getByLabel('作廢理由').fill('一箱遺失');
  await voidDialog.getByRole('button', { name: /^\s*作\s*廢\s*物\s*流\s*單\s*$/ }).click();
  // 成功訊息統一「已＋動作名稱」，不帶後續說明（A 表）
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toHaveText('已作廢物流單');
});

test('14.37 訂單出貨單頁籤沒有訂單終態時的兩則長說明（G21 A 表）', async ({ page }) => {
  test.setTimeout(120_000);
  // 鏈一 ORD-2026-0601 已訂單完成：建立鈕依條件顯示或隱藏，不另寫說明
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  await expect(page.locator('.ant-tabs-tabpane-active')).toContainText('SH-2026-0601');
  await expect(page.locator('.ant-tabs-tabpane-active')).not.toContainText('這張訂單已達終態');
});

test('14.38 出貨單列表為子母表：主層出貨單、每列有勾選框、展開為物流單子表；沒有裝箱照片欄（列表）', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '出貨人員', '/qc-shipping/shipments');

  // 列表：沒有「裝箱照片」「實際出貨日」欄；有「揀貨數量」「物流單號」欄；沒有「實際裝箱數量」「托運單號」欄
  const headRow = page.locator('.ant-table-thead').first();
  const heads = (await headRow.locator('th').allInnerTexts()).map((t) => t.trim());
  expect(heads.some((h) => h.startsWith('裝箱照片'))).toBe(false);
  expect(heads.some((h) => h.startsWith('揀貨數量'))).toBe(true);
  expect(heads).toContain('物流單號');
  expect(heads).not.toContain('實際出貨日');
  expect(heads).not.toContain('實際裝箱數量');
  expect(heads).not.toContain('托運單號');
  const pickedCol = heads.findIndex((h) => h.startsWith('揀貨數量'));
  await expect(shipmentRow(page, 'SH-2026-0601').locator('td').nth(pickedCol)).toContainText('3,000／3,000');

  // 每一列有勾選框（批次列印用，G5）；表頭有全選勾選框
  for (const no of ['SH-2026-0601', 'SH-2026-0602']) {
    await expect(shipmentRow(page, no).getByRole('checkbox')).toHaveCount(1);
  }

  // 預設收合；每列都可展開；物流單子表沒有離廠時間欄
  await expect(page.locator('tr.ant-table-expanded-row:visible')).toHaveCount(0);
  const expanded = await expandShipmentRow(page, 'SH-2026-0601');
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  expect(subHeads).toEqual(LOGISTICS_SUB_HEADS);
  const subRow = expanded.locator('tbody tr.ant-table-row').first();
  await expect(subRow).toContainText('SH-2026-0601-001');
  await expect(subRow).toContainText('SF1400020601');
  await expect(subRow).toContainText('已送達');
  // 操作沿用物流單表格的動作鈕：已送達的物流單只有下載物流單，沒有補附送達憑證（G1）
  await expect(subRow.getByRole('button', { name: '補附送達憑證' })).toHaveCount(0);
  await expect(subRow.getByRole('button', { name: '下載物流單' })).toHaveCount(1);
});

test('14.38 草稿沒有物流單，展開後顯示沒有資料（列表）', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');
  const expanded = await expandShipmentRow(page, 'SH-2026-0820');
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  expect(subHeads).toEqual(LOGISTICS_SUB_HEADS);
  await expect(expanded).toContainText('沒有資料');
});

test('14.38 訂單詳情出貨單頁籤為子母表，沒有裝箱照片欄（訂單詳情頁籤）', async ({ page }) => {
  test.setTimeout(120_000);
  // 鏈一建立最早、不在訂單列表第一頁，直接開詳情頁
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  const tabRow = page
    .locator('.ant-tabs-tabpane-active tr.ant-table-row')
    .filter({ hasText: 'SH-2026-0601' })
    .first();
  await expect(tabRow).toBeVisible();
  const tabHeads = (
    await page.locator('.ant-tabs-tabpane-active .ant-table-thead').first().locator('th').allInnerTexts()
  ).map((t) => t.trim());
  expect(tabHeads.some((h) => h.startsWith('裝箱照片'))).toBe(false);
  expect(tabHeads.some((h) => h.startsWith('揀貨數量'))).toBe(true);
  expect(tabHeads).not.toContain('實際裝箱數量');
  expect(tabHeads).not.toContain('實際出貨日');
  await tabRow.locator('.ant-table-row-expand-icon').click();
  const expanded = tabRow.locator('xpath=following-sibling::tr[1]');
  await expect(expanded).toHaveClass(/ant-table-expanded-row/);
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  expect(subHeads).toEqual(LOGISTICS_SUB_HEADS);
  await expect(expanded.locator('tbody tr.ant-table-row').first()).toContainText('SH-2026-0601-001');
});

