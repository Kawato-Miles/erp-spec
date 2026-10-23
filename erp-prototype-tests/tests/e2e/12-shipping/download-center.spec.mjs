import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  DOWNLOAD_CENTER,
  createShipment,
  dispatchRow,
  downloadCell,
  downloadHeads,
  downloadRows,
  expandShipmentRow,
  gotoInAppSafe,
  logisticsCheckbox,
  pickAndPack,
  printButton,
  setupShippableState,
  shipmentCheckbox,
  shipmentRow,
  switchRoleSafe,
} from '../11-qc/_setup.mjs';

// 情境目錄 12.51～12.53（2026-10-23 新增）：批次列印與下載中心。
// 依據：change shipment-print-download-center grill G4～G17、G21 C 表與同場預設；wiki 下載檔案、下載檔案狀態、
// 出貨與送達 主流程第 7 步、副流程第 7 步分支。
// Prototype 只用模擬資料呈現下載中心，不實作產檔與下載（grill § 七）：按列印即在下載中心新增一列（等待中），
// 下載檔案狀態推進以純函式驗（tests/unit/qc-shipping/download-files.test.mjs），畫面只驗模擬資料列的五種狀態與異常內容。
// 起點資料：下載檔案模擬資料五種狀態（等待中、處理中、成功、部分成功、失敗）各一筆以上，建立人兩位出貨人員，
// 最早兩筆 2026-06-18 建立、狀態成功；物流單編號取自鏈一與鏈九。
// 第二位出貨人員的姓名由 MOCK-DATA-CHAIN 決定，本檔不寫死，只驗「建立人不是當前登入者」。

test.describe.configure({ timeout: 180_000 });

const SHIPMENTS = '/qc-shipping/shipments';
const HEADS = ['建立時間', '檔案類型', '狀態', '物流單筆數', '建立人', '異常內容', '操作'];
const STATUSES = ['等待中', '處理中', '成功', '部分成功', '失敗'];
const FILE_TYPES = ['物流單列印', '順豐托運總表', '新竹托運總表'];
const SHIPPER = '曾志偉';

// 下載中心篩選區的下拉（以未選值時的提示字認）
const filterSelect = (page, placeholder) =>
  page.locator('.ant-layout-content .ant-select').filter({ hasText: placeholder }).first();

const pickFilter = async (page, placeholder, option) => {
  await filterSelect(page, placeholder).click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: option }).first().click();
};

// 列上的下載鈕
const downloadButton = (row) => row.getByRole('button', { name: /^\s*下\s*載\s*$/ });

test('12.51 批次列印：勾母列等於勾底下全部未作廢物流單、子列可單選；按列印後下載中心多出等待中的資料列，托運總表只收已拋單者', async ({
  page,
}) => {
  // 前置：鏈四 PI-2026-0820 驗收 500；業務建一張新竹物流單 300，揀貨人員裝三箱並確認可出貨（三筆物流單在可出貨）
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, SHIPMENTS);
  const hctNo = await createShipment(page, { qty: 300, method: '新竹物流' });
  // 業務沒有列印鈕（G15 只開放出貨人員）
  await expect(printButton(page)).toHaveCount(0);
  await switchRoleSafe(page, '揀貨人員');
  await gotoInAppSafe(page, SHIPMENTS);
  await pickAndPack(page, hctNo, { pickedQty: 300, boxes: 3 });
  await expect(printButton(page)).toHaveCount(0);

  // 出貨人員：列印鈕在出貨管理列表上方，沒有勾選時停用；每一列有勾選框
  await switchRoleSafe(page, '出貨人員');
  await gotoInAppSafe(page, SHIPMENTS);
  await expect(printButton(page)).toBeVisible();
  await expect(printButton(page)).toBeDisabled();
  await expect(shipmentCheckbox(page, hctNo)).toBeVisible();
  await expect(shipmentCheckbox(page, 'SH-2026-0601')).toBeVisible();

  // 勾母列＝勾底下全部未作廢物流單
  await shipmentCheckbox(page, hctNo).check();
  const expanded = await expandShipmentRow(page, hctNo);
  for (const n of ['001', '002', '003']) {
    await expect(logisticsCheckbox(expanded, `${hctNo}-${n}`)).toBeChecked();
  }
  await expect(printButton(page)).toBeEnabled();
  // 取消母列再只勾子列 -002：只有這一筆被勾
  await shipmentCheckbox(page, hctNo).uncheck();
  await logisticsCheckbox(expanded, `${hctNo}-002`).check();
  await expect(logisticsCheckbox(expanded, `${hctNo}-001`)).not.toBeChecked();
  await expect(logisticsCheckbox(expanded, `${hctNo}-003`)).not.toBeChecked();

  // 下載中心列印前的筆數
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  const before = await downloadRows(page).count();
  await gotoInAppSafe(page, SHIPMENTS);

  // 只勾一筆還沒拋單的物流單按列印：成功訊息「已加入下載中心」（G21 C 表）；下載中心最上面多一筆物流單列印、等待中、
  // 物流單筆數 1、建立人為按列印的出貨人員；沒拋單不產托運總表；物流單狀態不因列印改變
  // 離開再回到出貨管理，列表重新掛載、展開列已收合
  const expandedAgain = await expandShipmentRow(page, hctNo);
  await logisticsCheckbox(expandedAgain, `${hctNo}-002`).check();
  await printButton(page).click();
  await expect(page.getByText('已加入下載中心').first()).toBeVisible();
  await expect(shipmentRow(page, hctNo)).toContainText('可出貨');
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before + 1);
  expect(await downloadCell(page, 0, '檔案類型')).toBe('物流單列印');
  expect(await downloadCell(page, 0, '狀態')).toBe('等待中');
  expect(await downloadCell(page, 0, '物流單筆數')).toBe('1');
  expect(await downloadCell(page, 0, '建立人')).toBe(SHIPPER);
  await expect(downloadButton(downloadRows(page).first())).toHaveCount(0);

  // 拋單 -001、-002 後勾母列（三筆）按列印：產兩份——物流單列印 3 筆、新竹托運總表 2 筆（-003 沒拋單不收）
  await gotoInAppSafe(page, SHIPMENTS);
  await dispatchRow(page, hctNo, '拋單', { nth: 0 });
  await dispatchRow(page, hctNo, '拋單', { nth: 1 });
  await shipmentCheckbox(page, hctNo).check();
  await printButton(page).click();
  await expect(page.getByText('已加入下載中心').first()).toBeVisible();
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before + 3);
  const newest = [0, 1].map(async (i) => ({
    type: await downloadCell(page, i, '檔案類型'),
    count: await downloadCell(page, i, '物流單筆數'),
    status: await downloadCell(page, i, '狀態'),
  }));
  const pair = await Promise.all(newest);
  expect(pair.map((r) => r.type).sort()).toEqual(['新竹托運總表', '物流單列印'].sort());
  expect(pair.find((r) => r.type === '物流單列印').count).toBe('3');
  expect(pair.find((r) => r.type === '新竹托運總表').count).toBe('2');
  for (const r of pair) expect(r.status).toBe('等待中');

  // 按列印之後才拋 -003：已建立的新竹托運總表維持 2 筆，不補進
  await gotoInAppSafe(page, SHIPMENTS);
  await dispatchRow(page, hctNo, '拋單', { nth: 2 });
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before + 3);
  for (const i of [0, 1]) {
    if ((await downloadCell(page, i, '檔案類型')) === '新竹托運總表') {
      expect(await downloadCell(page, i, '物流單筆數')).toBe('2');
    }
  }
});

test('12.52 下載檔案狀態：模擬資料五種狀態都在；部分成功與失敗的異常內容每筆物流單一行，寫「物流單編號：錯誤訊息原文」', async ({
  page,
}) => {
  await openAs(page, '出貨人員', DOWNLOAD_CENTER);
  const rows = downloadRows(page);
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  const statuses = [];
  for (let i = 0; i < count; i += 1) statuses.push(await downloadCell(page, i, '狀態'));
  for (const s of STATUSES) expect(statuses, `下載中心缺少狀態 ${s} 的資料列`).toContain(s);

  // 異常內容：部分成功與失敗的列有內容，每行「物流單編號：原因」；成功、等待中、處理中沒有異常內容
  for (let i = 0; i < count; i += 1) {
    const status = statuses[i];
    const text = await downloadCell(page, i, '異常內容');
    if (status === '部分成功' || status === '失敗') {
      const lines = text.split('\n').map((t) => t.trim()).filter(Boolean);
      expect(lines.length, `${status} 列應有異常內容`).toBeGreaterThan(0);
      for (const line of lines) expect(line).toMatch(/^SH-\d{4}-\d{4}-\d{3}：.+/);
    } else {
      expect(['', '－', '-']).toContain(text);
    }
  }
  // 異常內容「物流單編號：物流單已作廢／已刪除」的格式由純函式測試驗，模擬資料不另造已作廢的物流單

  // 物流單筆數皆大於 0；失敗不重試、沒有重試鈕，也沒有刪除鈕
  for (let i = 0; i < count; i += 1) {
    expect(Number((await downloadCell(page, i, '物流單筆數')).replace(/,/g, ''))).toBeGreaterThan(0);
  }
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /重試|重新產生/ })).toHaveCount(0);
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /刪\s*除/ })).toHaveCount(0);
});

test('12.53 下載中心的檢視、下載與入口：欄位、篩選、新到舊、不過期；成功與部分成功才有下載鈕；只開放出貨人員', async ({
  page,
}) => {
  // 側邊選單「品檢與出貨」群組有下載中心（G14）
  await openAs(page, '出貨人員', SHIPMENTS);
  await page.locator('.ant-menu-submenu-title', { hasText: '品檢與出貨' }).first().click().catch(() => {});
  const menuItem = page.locator(`.ant-menu-item[data-menu-id$="-${DOWNLOAD_CENTER}"]`);
  await expect(menuItem).toHaveCount(1);
  await expect(menuItem).toContainText('下載中心');
  const group = page.locator('.ant-menu-submenu').filter({ has: menuItem }).first();
  await expect(group.locator('.ant-menu-submenu-title').first()).toContainText('品檢與出貨');
  await gotoInAppSafe(page, DOWNLOAD_CENTER);

  // 欄位（G13）：建立時間、檔案類型、狀態、物流單筆數、建立人、異常內容、操作；不設展開明細（G9）
  expect(await downloadHeads(page)).toEqual(HEADS);
  await expect(page.locator('.ant-layout-content .ant-table-row-expand-icon')).toHaveCount(0);

  // 新到舊排序（G12）
  const rows = downloadRows(page);
  const count = await rows.count();
  const times = [];
  for (let i = 0; i < count; i += 1) times.push(await downloadCell(page, i, '建立時間'));
  const sorted = [...times].sort().reverse();
  expect(times).toEqual(sorted);

  // 不設保存期限：最早一筆（2026-06-18 建立、狀態成功）仍在，且可下載
  const oldIndex = times.length - 1;
  expect(times[oldIndex].startsWith('2026-06-18'), '最早一筆應為 2026-06-18 建立').toBe(true);
  expect(await downloadCell(page, oldIndex, '狀態')).toBe('成功');
  await expect(downloadButton(rows.nth(oldIndex))).toHaveCount(1);

  // 看得到別人建立的下載檔案（G11）：有建立人不是當前登入者的資料列
  const creators = [];
  for (let i = 0; i < count; i += 1) creators.push(await downloadCell(page, i, '建立人'));
  expect(creators).toContain(SHIPPER);
  expect(creators.some((c) => c && c !== SHIPPER)).toBe(true);

  // 下載鈕只在成功與部分成功渲染；點擊不改狀態、可再按一次
  for (let i = 0; i < count; i += 1) {
    const status = await downloadCell(page, i, '狀態');
    const expected = status === '成功' || status === '部分成功' ? 1 : 0;
    await expect(downloadButton(rows.nth(i)), `${status} 列的下載鈕`).toHaveCount(expected);
  }
  const successIndex = (await Promise.all(times.map((_, i) => downloadCell(page, i, '狀態')))).indexOf('成功');
  await downloadButton(rows.nth(successIndex)).click();
  await downloadButton(rows.nth(successIndex)).click();
  expect(await downloadCell(page, successIndex, '狀態')).toBe('成功');

  // 篩選（G13）：檔案類型、狀態、建立人
  await expect(filterSelect(page, '全部檔案類型')).toBeVisible();
  await expect(filterSelect(page, '全部狀態')).toBeVisible();
  await expect(filterSelect(page, '全部建立人')).toBeVisible();
  await filterSelect(page, '全部檔案類型').click();
  await expect(page.locator('.ant-select-dropdown:visible .ant-select-item-option')).toHaveText(FILE_TYPES);
  await page.keyboard.press('Escape');
  await pickFilter(page, '全部狀態', '失敗');
  const failed = await rows.count();
  expect(failed).toBeGreaterThan(0);
  for (let i = 0; i < failed; i += 1) expect(await downloadCell(page, i, '狀態')).toBe('失敗');
  await page.getByRole('button', { name: /清空/ }).click().catch(() => {});
  await pickFilter(page, '全部建立人', SHIPPER);
  const mine = await rows.count();
  for (let i = 0; i < mine; i += 1) expect(await downloadCell(page, i, '建立人')).toBe(SHIPPER);

  // 活動清單沒有列出的角色進不了下載中心：業務、揀貨人員、業務主管側欄沒有入口，直連被導回
  for (const role of ['業務', '揀貨人員', '業務主管']) {
    await openAs(page, role, DOWNLOAD_CENTER);
    await expect(page).not.toHaveURL(/\/qc-shipping\/download-center/, { timeout: 60_000 });
    await expect(page.locator(`.ant-menu-item[data-menu-id$="-${DOWNLOAD_CENTER}"]`)).toHaveCount(0);
  }
});

