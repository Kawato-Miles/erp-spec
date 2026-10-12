import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { openShipmentPanel, shipmentRow } from '../11-qc/_setup.mjs';

// 情境目錄 14.37、14.38（2026-10-13 新增）。
// 起點資料：鏈一 SH-2026-0601（已送達；明細 PI-2026-0601 × 3,000、揀貨數量 3,000、每箱 500、箱數 6，
// 裝箱照片只有檔名「裝箱照-SH0601.jpg」，歷程五筆）、SH-2026-0602，鏈四 SH-2026-0820（草稿，無裝箱照片）。

test('14.37 出貨單對話框：單頭固定，出貨明細與歷程兩個頁籤；明細有完稿縮圖、揀貨數量、每箱幾個', async ({
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
    '物流單號',
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

  // 兩個頁籤：出貨明細、歷程；原側板的基本資訊與進度頁籤已不存在
  await expect(dialog.getByRole('tab')).toHaveText(['出貨明細', '歷程']);

  // 出貨明細：欄位依序為完稿縮圖（固定左）、印件、出貨數量、揀貨數量、每箱幾個
  const table = dialog.locator('.ant-table-wrapper').first();
  const heads = (await table.locator('.ant-table-thead th').allInnerTexts()).map((t) => t.trim());
  expect(heads).toEqual(['完稿縮圖', '印件', '出貨數量', '揀貨數量', '每箱幾個']);
  await expect(table.locator('thead th').nth(0)).toHaveClass(/ant-table-cell-fix-left/);
  const row = table.locator('tbody tr.ant-table-row').first();
  await expect(row.locator('td').nth(0).getByRole('img')).toHaveCount(1);
  await expect(row).toContainText('會員卡（客製燙金）');
  await expect(row.locator('td').nth(2)).toContainText('3,000');
  await expect(row.locator('td').nth(3)).toContainText('3,000');
  await expect(row.locator('td').nth(4)).toContainText('500');

  // 表下方包裝區：箱數、箱規、重量、裝箱照片縮圖（只有檔名，顯示佔位圖，不顯示檔名）
  await expect(dialog).toContainText('箱數');
  await expect(dialog).toContainText('B 箱（45×35×30）');
  await expect(dialog).toContainText('7.5');
  await expect(dialog).toContainText('裝箱照片');
  await expect(dialog.getByRole('img', { name: /裝箱照片/ })).toHaveCount(1);
  await expect(dialog).not.toContainText('.jpg');

  // 歷程：新到舊，五筆；每筆帶時間、操作人、前後值與附件縮圖
  await dialog.getByRole('tab', { name: '歷程' }).click();
  const timeline = dialog.locator('.ant-timeline');
  await expect(timeline.locator('.ant-timeline-item')).toHaveCount(5);
  const items = await timeline.locator('.ant-timeline-item').allInnerTexts();
  expect(items[0]).toContain('送達確認');
  expect(items[4]).toContain('建立出貨單');
  expect(items[0]).toContain('2026-06-19 09:00');
  expect(items[0]).toContain('曾志偉');
  expect(items[0]).toContain('運送中 → 已送達');
  expect(items[2]).toContain('裝箱回報');
  expect(items[2]).toContain('范姜宏');
  await expect(timeline.locator('.ant-timeline-item').nth(0).getByRole('img')).toHaveCount(1);
  await expect(timeline.locator('.ant-timeline-item').nth(2).getByRole('img')).toHaveCount(1);
});

test('14.38 出貨單列表與訂單詳情出貨單頁籤有裝箱照片縮圖欄（列表）', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '業務', '/qc-shipping/shipments');

  // 列表：有「裝箱照片」「揀貨數量」「物流單號」欄；沒有「實際裝箱數量」「托運單號」欄
  const headRow = page.locator('.ant-table-thead').first();
  const heads = (await headRow.locator('th').allInnerTexts()).map((t) => t.trim());
  expect(heads.some((h) => h.startsWith('裝箱照片'))).toBe(true);
  expect(heads.some((h) => h.startsWith('揀貨數量'))).toBe(true);
  expect(heads).toContain('物流單號');
  expect(heads).not.toContain('實際裝箱數量');
  expect(heads).not.toContain('托運單號');

  // 已送達那張：縮圖（沒有預覽網址顯示佔位圖，不顯示檔名）；揀貨數量逐條「揀貨／出貨」
  const photoCol = heads.findIndex((h) => h.startsWith('裝箱照片'));
  const pickedCol = heads.findIndex((h) => h.startsWith('揀貨數量'));
  const row = shipmentRow(page, 'SH-2026-0601');
  await expect(row.locator('td').nth(photoCol).getByRole('img')).toHaveCount(1);
  await expect(row.locator('td').nth(photoCol)).not.toContainText('.jpg');
  await expect(row.locator('td').nth(pickedCol)).toContainText('3,000／3,000');
  // 草稿沒有裝箱照片：無值符號、沒有縮圖
  const draft = shipmentRow(page, 'SH-2026-0820');
  await expect(draft.locator('td').nth(photoCol).getByRole('img')).toHaveCount(0);
  await expect(draft.locator('td').nth(photoCol)).toContainText('－');

});

test('14.38 出貨單列表與訂單詳情出貨單頁籤有裝箱照片縮圖欄（訂單詳情頁籤）', async ({ page }) => {
  test.setTimeout(120_000);
  // 鏈一建立最早、不在訂單列表第一頁，直接開詳情頁
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0601');
  await page.getByRole('tab', { name: /出貨/ }).first().click();
  const tabRow = page
    .locator('.ant-tabs-tabpane-active tr.ant-table-row')
    .filter({ hasText: 'SH-2026-0601' });
  await expect(tabRow).toBeVisible();
  const tabHeads = (
    await page.locator('.ant-tabs-tabpane-active .ant-table-thead th').allInnerTexts()
  ).map((t) => t.trim());
  expect(tabHeads.some((h) => h.startsWith('裝箱照片'))).toBe(true);
  expect(tabHeads.some((h) => h.startsWith('揀貨數量'))).toBe(true);
  expect(tabHeads).not.toContain('實際裝箱數量');
  const tabPhotoCol = tabHeads.findIndex((h) => h.startsWith('裝箱照片'));
  await expect(tabRow.locator('td').nth(tabPhotoCol).getByRole('img')).toHaveCount(1);
  await expect(tabRow.locator('td').nth(tabPhotoCol)).not.toContainText('.jpg');
});
