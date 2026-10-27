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

// 情境目錄 12.51～12.53、12.59：批次列印與下載中心。
// 依據：change shipment-print-download-center grill G4～G17、G21 C 表與同場預設；出貨模組對齊後端第一版決定表第 14 題
//（下載檔案狀態只剩處理中、成功、部分成功、失敗；只能列印拋單成功的物流單，批次中任一筆不能印就整批不受理；
// 檔案保存 7 天；有入口的人看得到全部人的紀錄，也可只篩自己的）。
// Prototype 只用模擬資料呈現下載中心，不實作產檔與下載：按列印即在下載中心新增處理中的資料列，
// 產檔結果以純函式驗（tests/unit/qc-shipping/download-files.test.mjs），畫面只驗模擬資料列的狀態與異常內容。
// 起點資料：下載檔案模擬資料四筆（處理中、失敗、成功兩筆），建立時間以開頁當下往前推 0、1、2、2 天，
// 建立人兩位出貨人員曾志偉與江俊賢，四筆都涵蓋鏈一順豐物流單（物流單號 SF1400020601）。

test.describe.configure({ timeout: 180_000 });

const SHIPMENTS = '/qc-shipping/shipments';
const HEADS = ['建立時間', '檔案類型', '狀態', '物流單筆數', '建立人', '異常內容', '操作'];
const STATUSES = ['處理中', '成功', '部分成功', '失敗'];
const FILE_TYPES = ['物流單列印', '順豐托運總表', '新竹托運總表'];
const SHIPPER = '曾志偉';
const OTHER_SHIPPER = '江俊賢';
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

// 下載中心篩選區的下拉（以未選值時的提示字認）
const filterSelect = (page, placeholder) =>
  page.locator('.ant-layout-content .ant-select').filter({ hasText: placeholder }).first();

const pickFilter = async (page, placeholder, option) => {
  await filterSelect(page, placeholder).click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option').filter({ hasText: option }).first().click();
};

// 列上的下載鈕
const downloadButton = (row) => row.getByRole('button', { name: /^\s*下\s*載\s*$/ });

// 'YYYY-MM-DD HH:mm' → Date（本地時間）
const parseStamp = (stamp) => {
  const [d, t = '00:00'] = stamp.split(' ');
  const [y, m, day] = d.split('-').map(Number);
  const [hh, mm] = t.split(':').map(Number);
  return new Date(y, m - 1, day, hh, mm);
};

test('12.51、12.59 批次列印：勾母列等於勾底下全部未作廢物流單、子列可單選；只收拋單成功的物流單，任一筆不能印就整批不受理並顯示錯誤；受理後下載中心多出處理中的資料列', async ({
  page,
}) => {
  // 前置：鏈四 PI-2026-0820 驗收 500；業務建一張新竹物流單 300，揀貨人員裝三箱並確認可出貨
  //（新竹物流一箱一筆物流單，三筆物流單拋單狀態未拋單）
  await setupShippableState(page, { passed: 500 });
  await switchRoleSafe(page, '業務');
  await gotoInAppSafe(page, SHIPMENTS);
  const hctNo = await createShipment(page, { qty: 300, method: '新竹物流' });
  // 業務沒有列印鈕（只開放出貨人員）
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
  await expect(shipmentCheckbox(page, 'SH-2026-06-18001')).toBeVisible();

  // 勾母列＝勾底下全部未作廢物流單（物流單以我方自編單號認：出貨單編號-01～-03）
  const own = (n) => `${hctNo}-${n}`;
  await shipmentCheckbox(page, hctNo).check();
  const expanded = await expandShipmentRow(page, hctNo);
  for (const n of ['01', '02', '03']) {
    await expect(logisticsCheckbox(expanded, own(n))).toBeChecked();
  }
  await expect(printButton(page)).toBeEnabled();
  // 取消母列再只勾子列 -02：只有這一筆被勾
  await shipmentCheckbox(page, hctNo).uncheck();
  await logisticsCheckbox(expanded, own('02')).check();
  await expect(logisticsCheckbox(expanded, own('01'))).not.toBeChecked();
  await expect(logisticsCheckbox(expanded, own('03'))).not.toBeChecked();

  // 下載中心列印前的筆數
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  const before = await downloadRows(page).count();
  await gotoInAppSafe(page, SHIPMENTS);

  // 只勾一筆還沒拋單的物流單按列印：整批不受理，錯誤訊息列出不能印的物流單（還沒有物流單號，以我方自編單號列）；
  // 下載中心不多任何資料列
  const expandedAgain = await expandShipmentRow(page, hctNo);
  await logisticsCheckbox(expandedAgain, own('02')).check();
  await printButton(page).click();
  await expect(
    page.getByText(`只能列印拋單成功的物流單，整批不受理：${own('02')}`).first(),
  ).toBeVisible();
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before);

  // 拋單 -01、-02 後勾母列（三筆，-03 還沒拋單）按列印：任一筆不能印就整批不受理，錯誤只列 -03
  await gotoInAppSafe(page, SHIPMENTS);
  await dispatchRow(page, hctNo, '拋單', { nth: 0 });
  await dispatchRow(page, hctNo, '拋單', { nth: 1 });
  await shipmentCheckbox(page, hctNo).check();
  await printButton(page).click();
  await expect(
    page.getByText(`只能列印拋單成功的物流單，整批不受理：${own('03')}`).first(),
  ).toBeVisible();
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before);

  // 只勾拋單成功的 -01、-02 按列印：受理，成功訊息「已加入下載中心」；產兩份——物流單列印 2 筆、新竹托運總表 2 筆，
  // 建立即為處理中、建立人為按列印的出貨人員、沒有下載鈕；列印不改物流單（-03 仍未拋單，出貨單停在已確認）
  await gotoInAppSafe(page, SHIPMENTS);
  const expandedThird = await expandShipmentRow(page, hctNo);
  await logisticsCheckbox(expandedThird, own('01')).check();
  await logisticsCheckbox(expandedThird, own('02')).check();
  await printButton(page).click();
  await expect(page.getByText('已加入下載中心').first()).toBeVisible();
  await expect(shipmentRow(page, hctNo)).toContainText('已確認');
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before + 2);
  // 新建的兩列以物流單筆數 2 認（模擬資料每列 1 筆）；不依列序認，模擬資料「開頁當日 09:30」在早上 9:30 前會排在新列之上
  const newRowIndexes = async () => {
    const total = await downloadRows(page).count();
    const hits = [];
    for (let i = 0; i < total; i += 1) {
      if ((await downloadCell(page, i, '物流單筆數')) === '2') hits.push(i);
    }
    return hits;
  };
  const created = await newRowIndexes();
  expect(created).toHaveLength(2);
  const pair = [];
  for (const i of created) {
    pair.push({
      type: await downloadCell(page, i, '檔案類型'),
      count: await downloadCell(page, i, '物流單筆數'),
      status: await downloadCell(page, i, '狀態'),
      creator: await downloadCell(page, i, '建立人'),
    });
    await expect(downloadButton(downloadRows(page).nth(i))).toHaveCount(0);
  }
  expect(pair.map((r) => r.type).sort()).toEqual(['新竹托運總表', '物流單列印'].sort());
  for (const r of pair) {
    expect(r.count).toBe('2');
    expect(r.status).toBe('處理中');
    expect(r.creator).toBe(SHIPPER);
  }

  // 按列印之後才拋 -03：已建立的新竹托運總表維持 2 筆，不補進
  await gotoInAppSafe(page, SHIPMENTS);
  await dispatchRow(page, hctNo, '拋單', { nth: 2 });
  await gotoInAppSafe(page, DOWNLOAD_CENTER);
  await expect(downloadRows(page)).toHaveCount(before + 2);
  for (const i of await newRowIndexes()) {
    if ((await downloadCell(page, i, '檔案類型')) === '新竹托運總表') {
      expect(await downloadCell(page, i, '物流單筆數')).toBe('2');
    }
  }
});

test('12.52 下載檔案狀態：只有處理中、成功、部分成功、失敗四種；模擬資料四筆；部分成功與失敗的異常內容每筆物流單一行，以物流單號開頭', async ({
  page,
}) => {
  await openAs(page, '出貨人員', DOWNLOAD_CENTER);
  const rows = downloadRows(page);
  await expect(rows.first()).toBeVisible();
  await expect(rows).toHaveCount(4);
  const count = await rows.count();
  const statuses = [];
  for (let i = 0; i < count; i += 1) statuses.push(await downloadCell(page, i, '狀態'));
  for (const s of statuses) expect(STATUSES, `下載中心出現不在四種之內的狀態 ${s}`).toContain(s);
  for (const s of ['處理中', '成功', '失敗']) expect(statuses, `模擬資料缺少狀態 ${s} 的資料列`).toContain(s);

  // 狀態篩選只有四個選項（沒有等待中）
  await filterSelect(page, '全部狀態').click();
  await expect(page.locator('.ant-select-dropdown:visible .ant-select-item-option')).toHaveText(STATUSES);
  await page.keyboard.press('Escape');

  // 異常內容：部分成功與失敗的列有內容，每行「物流單號：原因」（物流單號＝物流商回傳的單號，不是我方自編單號）；
  // 成功、處理中沒有異常內容
  for (let i = 0; i < count; i += 1) {
    const status = statuses[i];
    const text = await downloadCell(page, i, '異常內容');
    if (status === '部分成功' || status === '失敗') {
      const lines = text.split('\n').map((t) => t.trim()).filter(Boolean);
      expect(lines.length, `${status} 列應有異常內容`).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line).toMatch(/^[A-Z]*\d+：.+/);
        expect(line).not.toMatch(/^SH-/);
      }
    } else {
      expect(['', '－', '-']).toContain(text);
    }
  }
  const failedIndex = statuses.indexOf('失敗');
  expect(await downloadCell(page, failedIndex, '異常內容')).toBe(
    'SF1400020601：產檔服務回應逾時，請重新列印',
  );

  // 物流單筆數皆大於 0；失敗不重試、沒有重試鈕，也沒有刪除鈕
  for (let i = 0; i < count; i += 1) {
    expect(Number((await downloadCell(page, i, '物流單筆數')).replace(/,/g, ''))).toBeGreaterThan(0);
  }
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /重試|重新產生/ })).toHaveCount(0);
  await expect(page.locator('.ant-layout-content').getByRole('button', { name: /刪\s*除/ })).toHaveCount(0);
});

test('12.53、12.59 下載中心的檢視、下載與入口：欄位、篩選、新到舊、只列 7 天內；成功與部分成功才有下載鈕；有入口的人看全部人的紀錄、可篩只看自己的；只開放出貨人員', async ({
  page,
}) => {
  // 側邊選單「品檢與出貨」群組有下載中心
  await openAs(page, '出貨人員', SHIPMENTS);
  await page.locator('.ant-menu-submenu-title', { hasText: '品檢與出貨' }).first().click().catch(() => {});
  const menuItem = page.locator(`.ant-menu-item[data-menu-id$="-${DOWNLOAD_CENTER}"]`);
  await expect(menuItem).toHaveCount(1);
  await expect(menuItem).toContainText('下載中心');
  const group = page.locator('.ant-menu-submenu').filter({ has: menuItem }).first();
  await expect(group.locator('.ant-menu-submenu-title').first()).toContainText('品檢與出貨');
  await gotoInAppSafe(page, DOWNLOAD_CENTER);

  // 欄位：建立時間、檔案類型、狀態、物流單筆數、建立人、異常內容、操作；不設展開明細
  expect(await downloadHeads(page)).toEqual(HEADS);
  await expect(page.locator('.ant-layout-content .ant-table-row-expand-icon')).toHaveCount(0);

  // 新到舊排序
  const rows = downloadRows(page);
  const count = await rows.count();
  const times = [];
  for (let i = 0; i < count; i += 1) times.push(await downloadCell(page, i, '建立時間'));
  const sorted = [...times].sort().reverse();
  expect(times).toEqual(sorted);

  // 檔案保存 7 天：列出的每一筆都在 7 天內建立（超過 7 天不列、不能下載，由純函式驗）
  const now = Date.now();
  for (const t of times) {
    expect(now - parseStamp(t).getTime(), `${t} 超過 7 天仍列出`).toBeLessThanOrEqual(RETENTION_MS);
  }

  // 有入口的人看得到全部人的紀錄：曾志偉登入也看得到江俊賢建立的資料列
  const creators = [];
  for (let i = 0; i < count; i += 1) creators.push(await downloadCell(page, i, '建立人'));
  expect(creators).toContain(SHIPPER);
  expect(creators).toContain(OTHER_SHIPPER);

  // 下載鈕只在成功與部分成功渲染；點擊不改狀態、可再按一次
  const statuses = [];
  for (let i = 0; i < count; i += 1) {
    const status = await downloadCell(page, i, '狀態');
    statuses.push(status);
    const expected = status === '成功' || status === '部分成功' ? 1 : 0;
    await expect(downloadButton(rows.nth(i)), `${status} 列的下載鈕`).toHaveCount(expected);
  }
  const successIndex = statuses.indexOf('成功');
  await downloadButton(rows.nth(successIndex)).click();
  await downloadButton(rows.nth(successIndex)).click();
  expect(await downloadCell(page, successIndex, '狀態')).toBe('成功');

  // 篩選：檔案類型、狀態、建立人
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

  // 建立人篩選選自己：只剩自己建立的紀錄，別人的不列
  await pickFilter(page, '全部建立人', SHIPPER);
  const mine = await rows.count();
  expect(mine).toBe(creators.filter((c) => c === SHIPPER).length);
  for (let i = 0; i < mine; i += 1) expect(await downloadCell(page, i, '建立人')).toBe(SHIPPER);

  // 活動清單沒有列出的角色進不了下載中心：業務、揀貨人員、業務主管側欄沒有入口，直連被導回
  for (const role of ['業務', '揀貨人員', '業務主管']) {
    await openAs(page, role, DOWNLOAD_CENTER);
    await expect(page).not.toHaveURL(/\/qc-shipping\/download-center/, { timeout: 60_000 });
    await expect(page.locator(`.ant-menu-item[data-menu-id$="-${DOWNLOAD_CENTER}"]`)).toHaveCount(0);
  }
});
