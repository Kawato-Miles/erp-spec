import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { expandShipmentRow, openShipmentPanel, shipmentRow } from '../11-qc/_setup.mjs';

// 情境目錄 14.37、14.38（2026-10-13 新增，2026-10-22 改寫：裝箱明細加長寬高、兩處列表改子母表並刪裝箱照片欄）。
// 起點資料：鏈一 SH-2026-0601（順豐、已送達；明細 PI-2026-0601 × 3,000、揀貨數量 3,000、五箱「1 號箱」45×30×15、
// 一筆物流單，裝箱照片只有檔名「裝箱照-SH0601-1.jpg」等，出貨單歷程五筆加物流單歷程四筆）、SH-2026-0602（自取），
// 鏈四 SH-2026-0820（草稿，沒有物流單）。

const LOGISTICS_SUB_HEADS = ['物流單編號', '物流單號', '箱數', '狀態', '離廠時間', '送達時間', '例外理由', '操作'];

test('14.37 出貨單對話框：單頭固定，出貨明細與歷程兩個頁籤；明細有完稿縮圖、揀貨數量', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');
  const dialog = await openShipmentPanel(page, 'SH-2026-0601');

  // 標題列：出貨單編號與狀態標籤
  await expect(dialog.locator('.ant-modal-header')).toContainText('SH-2026-0601');
  await expect(dialog.locator('.ant-modal-header')).toContainText('已送達');

  // 上方固定單頭，不分頁：十二項資訊都在頁籤之外（頁籤列之前的區塊）
  const head = dialog.locator('.ant-modal-body > div').first();
  for (const label of [
    '出貨單編號',
    '所屬訂單與客戶',
    '出貨方式',
    '箱數',
    '出貨單預計出貨日',
    '實際出貨日',
    '收件人與電話',
    '收件地址',
    '寄件資訊',
    '裝箱指示',
    '備註',
    '建單人',
  ]) {
    await expect(head).toContainText(label);
  }
  await expect(head).toContainText('ORD-2026-0601');
  await expect(head).toContainText('誠品書店股份有限公司');
  await expect(head).toContainText('王思穎');
  await expect(head).toContainText('洪嘉駿');
  // 保密代寄＝否：寄件資訊沿用帳務公司，不標保密代寄
  await expect(head).toContainText('感官文化印刷');
  await expect(head).not.toContainText('保密代寄');

  // 兩個頁籤：出貨明細、歷程；原側板的基本資訊與進度頁籤已不存在
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

  // 表下方：裝箱明細（逐箱箱序、箱規、長、寬、高、裝箱照片縮圖，只有檔名，顯示佔位圖，不顯示檔名、所屬物流單、子單號）
  // 與物流單表格；沒有重量
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
  await expect(dialog).not.toContainText('重量');
  await expect(dialog).toContainText('裝箱照片');
  await expect(dialog.getByRole('img', { name: /裝箱照片/ })).toHaveCount(5);
  await expect(dialog).not.toContainText('.jpg');

  // 歷程：新到舊，出貨單五筆加物流單四筆共九筆；每筆帶時間、操作人、前後值與附件縮圖
  await dialog.getByRole('tab', { name: '歷程' }).click();
  const timeline = dialog.locator('.ant-timeline');
  await expect(timeline.locator('.ant-timeline-item')).toHaveCount(9);
  const items = await timeline.locator('.ant-timeline-item').allInnerTexts();
  expect(items[0]).toContain('2026-06-19 09:00');
  expect(items[0]).toContain('物流單 SH-2026-0601-001');
  expect(items[1]).toContain('物流單全數送達，出貨單轉已送達');
  expect(items[1]).toContain('運送中 → 已送達');
  expect(items[6]).toContain('裝箱回報');
  expect(items[6]).toContain('范姜宏');
  expect(items[8]).toContain('建立出貨單');
  await expect(timeline.locator('.ant-timeline-item').nth(6).getByRole('img')).toHaveCount(5);
});

test('14.38 出貨單列表為子母表：主層出貨單、展開為物流單子表；沒有裝箱照片欄（列表）', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '出貨人員', '/qc-shipping/shipments');

  // 列表：沒有「裝箱照片」欄；有「揀貨數量」「物流單號」欄；沒有「實際裝箱數量」「托運單號」欄
  const headRow = page.locator('.ant-table-thead').first();
  const heads = (await headRow.locator('th').allInnerTexts()).map((t) => t.trim());
  expect(heads.some((h) => h.startsWith('裝箱照片'))).toBe(false);
  expect(heads.some((h) => h.startsWith('揀貨數量'))).toBe(true);
  expect(heads).toContain('物流單號');
  expect(heads).not.toContain('實際裝箱數量');
  expect(heads).not.toContain('托運單號');
  const pickedCol = heads.findIndex((h) => h.startsWith('揀貨數量'));
  await expect(shipmentRow(page, 'SH-2026-0601').locator('td').nth(pickedCol)).toContainText('3,000／3,000');

  // 預設收合；每列都可展開
  await expect(page.locator('tr.ant-table-expanded-row:visible')).toHaveCount(0);
  const expanded = await expandShipmentRow(page, 'SH-2026-0601');
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(subHeads).toEqual(LOGISTICS_SUB_HEADS);
  const subRow = expanded.locator('tbody tr.ant-table-row').first();
  await expect(subRow).toContainText('SH-2026-0601-001');
  await expect(subRow).toContainText('SF1400020601');
  await expect(subRow).toContainText('已送達');
  // 操作沿用物流單表格的動作鈕：出貨人員在已送達的物流單有補附送達憑證
  await expect(subRow.getByRole('button', { name: '補附送達憑證' })).toHaveCount(1);
});

test('14.38 草稿沒有物流單，展開後顯示沒有資料（列表）', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');
  const expanded = await expandShipmentRow(page, 'SH-2026-0820');
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim());
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
  await tabRow.locator('.ant-table-row-expand-icon').click();
  const expanded = tabRow.locator('xpath=following-sibling::tr[1]');
  await expect(expanded).toHaveClass(/ant-table-expanded-row/);
  const subHeads = (await expanded.locator('thead th').allInnerTexts()).map((t) => t.trim());
  expect(subHeads).toEqual(LOGISTICS_SUB_HEADS);
  await expect(expanded.locator('tbody tr.ant-table-row').first()).toContainText('SH-2026-0601-001');
});
