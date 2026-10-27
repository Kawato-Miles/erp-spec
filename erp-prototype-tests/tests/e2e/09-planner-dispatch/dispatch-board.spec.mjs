import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole, clickIntoDetail } from '../_helpers.mjs';
// 表頭定位取欄的工具放在第八章（工單詳情的生產任務列表是群組表頭），9.2 的最後一步回工單詳情看交付狀態
import { expectCell, openWorkOrderFromList } from '../08-process-review-deliver/_page-helpers.mjs';

// 情境目錄第九章：生管在「所有生產任務」（/production-floor/dispatch）接收、打包派工；取消工作包在所有工作包的列上。
// 起點資料：鏈三 WO-2026-0815 的四筆待派任務（皆待處理、已交付、待接收、無工作包）：
// 牛皮紙 150g 備料、五色印刷、軋盒成型、糊盒成型。任務編號（PT-0815-*）不在畫面上顯示，
// 一律以任務名稱、工單編號等使用者看得到的文字選取列。

// 任務列一律以任務格的名稱全文定位（exact）：任務名稱是可點的連結樣式，點它開生產任務側板。

// AntD Select 下拉為虛擬捲動、選項可能落在可視區外，改用鍵盤移動再 Enter（同 _helpers.switchRole 的做法）。
// GenericFilter 篩選欄位沒有 <label for>：用「標籤文字所在的 Col」找同一格內的 Select。
const selectFilterOption = async (page, labelText, optionIndex) => {
  await page.locator('.ant-col', { hasText: labelText }).locator('.ant-select').click();
  for (let i = 0; i < optionIndex; i += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
};

test('9.1 生管在所有生產任務看範圍內已交付的自有工廠與加工廠任務，其他角色的可見範圍（原編號 13）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  await expect(page.getByText('所有生產任務').first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();

  // 未打包的列排在前面，可勾選
  const pendingRow = page.locator('tr.ant-table-row', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) }).first();
  await expect(pendingRow.locator('input[type="checkbox"]')).toHaveCount(1);

  // 全部任務含已打包與終態：以搜尋框找鏈二。已打包的列顯示工作包編號與師傅、不出勾選框，也沒有取消工作包（取消工作包在所有工作包的列上）
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  const packedRow = page.locator('tr.ant-table-row', { hasText: 'WP-2026-0710-01' }).first();
  await expect(packedRow).toContainText('師傅 劉阿海');
  await expect(packedRow.locator('input[type="checkbox"]')).toHaveCount(0);
  await expect(packedRow.getByRole('button', { name: '取消工作包' })).toHaveCount(0);
  await page.getByRole('button', { name: /清空/ }).click();

  // 篩選：派工狀態＝未派工，再加任務類別＝工序 → 材料型任務（牛皮紙 150g 備料）被篩掉，工序任務（五色印刷）留下
  await selectFilterOption(page, '派工狀態', 0);
  await expect(page.locator('tr.ant-table-row', { hasText: 'WP-2026-0710-01' })).toHaveCount(0);
  await selectFilterOption(page, '任務類別', 1);
  await expect(page.getByText('牛皮紙 150g 備料', { exact: true })).toHaveCount(0);
  await expect(page.getByText('五色印刷', { exact: true })).toBeVisible();

  // 表格不再顯示「前置」與「下游生產任務」兩欄
  await expect(page.getByRole('columnheader', { name: '前置', exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '下游生產任務' })).toHaveCount(0);

  // 加工廠任務（鏈外 WO-2026-0812 證書局部上光，已交付、已接收、未打包）同樣列在所有生產任務
  await page.getByRole('button', { name: /清空/ }).click();
  await search.fill('證書局部上光');
  await search.press('Enter');
  const plantRow = page.locator('tr.ant-table-row', { hasText: '證書局部上光' }).first();
  await expect(plantRow).toBeVisible();
  await expect(plantRow).toContainText('WO-2026-0812');
  await page.getByRole('button', { name: /清空/ }).click();

  // 印務主管六條產線加品檢線全選，也看得到本單元、沒有權限提示
  await switchRole(page, '印務主管');
  await expect(page.getByText(/打包派工限持有/)).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();
});

test('9.2 生管對已交付產線的任務按「接收工作」（原編號 14）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row = page.locator('tr', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) });
  await expect(row.getByText('待接收')).toBeVisible();
  await row.getByRole('button', { name: '接收工作' }).click();
  await expect(page.getByText('已接收工作 1 筆生產任務（接收工作欄已留痕）')).toBeVisible();
  await expect(row.getByText('已接收')).toBeVisible();
  await expect(row.getByText('許文傑')).toBeVisible();

  // 批次接收：以搜尋框篩出 WO-2026-0815 的四筆，勾選其餘任務後按批次接收工作
  //（.ant-table-measure-row 是 AntD 量寬度用的隱藏列，排除掉）
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0815');
  await search.press('Enter');
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  await expect(rows).toHaveCount(4);
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    await rows.nth(i).locator('input[type="checkbox"]').check({ force: true });
  }
  await page.getByRole('button', { name: /接收工作（\d+）/ }).click();
  await expect(page.getByText('已接收工作 3 筆生產任務（接收工作欄已留痕）')).toBeVisible();

  // 回 WO-2026-0815 工單詳情看任務列表：接收過的任務交付狀態由已交付轉已接收，生產任務狀態仍為待處理
  //（工單端的任務名稱是「牛皮紙 150g 菊全」，現場頁顯示的是「牛皮紙 150g 備料」）
  await switchRole(page, '印務');
  await openWorkOrderFromList(page, 'WO-2026-0815');
  for (const name of ['牛皮紙 150g 菊全', '五色印刷', '軋盒成型', '糊盒成型']) {
    await expectCell(page, name, '交付狀態', '已接收');
    await expectCell(page, name, '生產任務狀態', '待處理');
  }
});

test('9.6 生管在派工時系統補寫接收留痕（原編號 80）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row = page.locator('tr', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) });
  await expect(row.getByText('待接收')).toBeVisible();
  await row.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /派工（1）/ }).click();
  // MASTER_OPTIONS 順序：劉阿海、李榮發、陳金水，劉阿海是預設高亮的第 1 個選項
  // 派工表單的日期欄存的是工作包的預計完成日，欄名叫「預計完成日」（不是任務預計完成日）
  const dispatchForm = page.locator('.ant-modal-content').filter({ hasText: '確認派工' });
  await expect(dispatchForm.locator('.ant-form-item-label', { hasText: /^預計完成日$/ })).toBeVisible();
  await expect(dispatchForm.locator('.ant-form-item-label', { hasText: '任務預計完成日' })).toHaveCount(0);
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '確認派工' }).click();
  await expect(page.getByText(/已建立工作包.*已一併補寫接收留痕/)).toBeVisible();
});

test('9.7 工廠總覽待排區顯示印件內部完成日（原編號 81）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/schedule');
  await expect(page.getByText('待排區（已交付產線、未入工作包）')).toBeVisible();
  // 待排區固定排在頁面最後一塊，取最後一張表格即為它（避免與各視角內的其他表格混淆）
  const table = page.locator('.ant-table').last();
  await expect(table.getByRole('columnheader', { name: '工單編號' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '印件', exact: true })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '任務名稱' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '類別' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '計畫設備' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '預計完成日' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '印件內部完成日' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '估工時' })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();

  await switchRole(page, '印務');
  await gotoInApp(page, '/production-floor/schedule');
  await expect(page.getByText('待排區（已交付產線、未入工作包）')).toBeVisible();
});

// 本欄顯示印件的「印件內部完成日」＝印件預計交期往前減 1 個工作天（急件不參與）。待排區只列
// 鏈三 WO-2026-0815 的四筆待接收任務（package_id 為空，見 MOCK-DATA-CHAIN.md），無法換其他鏈驗證。
// PI-2026-0815 印件預計交期 2026-10-05（一），印件內部完成日 2026-10-02（五），只印一組日期；
// production-floor/_lib/mock-data.js 的 print_item_delivery_date 與 print-items、work-orders
// 兩模組的 delivery_date 一致。
test('9.7（補）待排區印件內部完成日欄位取值正確', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/schedule');
  const table = page.locator('.ant-table').last();
  const row = table.locator('tr', { hasText: 'WO-2026-0815' }).first();
  await expect(row.getByText('2026-10-02', { exact: true })).toBeVisible();
  // 只印一組日期、不帶任何括號附註
  await expect(row.getByText('未扣急件')).toHaveCount(0);
});

test('9.8 派工視窗上方列出這次要派的任務內容（原編號 82）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row1 = page.locator('tr', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) });
  const row2 = page.locator('tr', { has: page.getByText('五色印刷', { exact: true }) });
  await row1.locator('input[type="checkbox"]').check();
  await row2.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /派工（2）/ }).click();
  await expect(page.getByText('派工內容（2）')).toBeVisible();
  const dialog = page.locator('.ant-modal-body');
  await expect(dialog.getByRole('columnheader', { name: '工單編號' })).toBeVisible();
  await expect(dialog.getByRole('columnheader', { name: '印件', exact: true })).toBeVisible();
  await expect(dialog.getByRole('columnheader', { name: '印件部位' })).toBeVisible();
  await expect(dialog.getByRole('columnheader', { name: '任務', exact: true })).toBeVisible();
  await expect(dialog.getByRole('columnheader', { name: '預計完成' })).toBeVisible();
  await expect(dialog.getByRole('columnheader', { name: '目標數量' })).toBeVisible();
  await expect(dialog.locator('.ant-table-tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 改只勾另一筆任務再開一次，內容表換成新選取的任務
  await row1.locator('input[type="checkbox"]').uncheck();
  await page.getByRole('button', { name: /派工（1）/ }).click();
  await expect(page.getByText('派工內容（1）')).toBeVisible();
  await expect(page.locator('.ant-modal-body .ant-table-tbody tr')).toHaveCount(1);
  await expect(page.locator('.ant-modal-body')).toContainText('五色印刷');
});

// 9.10（2026-10-06 改寫）：報工前提只看交付時間與前置到料；不看接收與打包。印件詳情沒有報工入口。
test('9.10 沒接收、沒打包也能報工；未交付與前置未到料才擋下，印件詳情沒有報工入口（原編號 116）', async ({ page }) => {
  test.setTimeout(120_000);
  // 所有生產任務：鏈三牛皮紙 150g 備料（已交付、未接收、未打包、沒有前置）有報工入口
  await openAs(page, '生管', '/production-floor/dispatch');
  const prepRow = page.locator('tr.ant-table-row', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) }).first();
  await expect(prepRow.getByRole('button', { name: '報工' })).toBeVisible();
  // 五色印刷前置未到料：沒有報工入口，狀態欄顯示「前置未到料」標籤；在等誰的說明在生產任務側板數量區
  const printRow = page.locator('tr.ant-table-row', { hasText: '五色印刷' }).first();
  await expect(printRow.getByRole('button', { name: '報工' })).toHaveCount(0);
  await expect(printRow.getByText('前置未到料', { exact: true })).toBeVisible();
  await printRow.getByText('五色印刷', { exact: true }).click();
  await expect(page.locator('.ant-drawer-content:visible').last()).toContainText(
    '前置未到料：等 WO-2026-0815／牛皮紙 150g 備料 的貨',
  );
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 工單詳情：同一張工單的備料有報工入口、不再提示「尚未派工」
  await switchRole(page, '印務');
  // 工單詳情沒有側欄選單項：先進列表再點工單編號（站內導頁，記憶體狀態保留）；工單端的備料名稱為「牛皮紙 150g 菊全」
  await openWorkOrderFromList(page, 'WO-2026-0815');
  const woPrepRow = page.locator('tr', { hasText: '牛皮紙 150g 菊全' }).first();
  await expect(woPrepRow.getByRole('button', { name: '報工', exact: true })).toBeEnabled();
  await expect(page.getByText('尚未派工，請先由生管派工')).toHaveCount(0);

  // 交付時間無值的任務（錨例 WO-2026-0908，製程審核完成）沒有報工入口，說明任務尚未交付
  await openWorkOrderFromList(page, 'WO-2026-0908');
  await expect(page.getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
  await expect(page.getByText('任務尚未交付').first()).toBeVisible();

  // 印件詳情：頁首與工單與生產任務區塊都沒有報工（單筆與批次皆無）
  await gotoInApp(page, '/print-items');
  await page.getByText('牛皮紙手提袋', { exact: true }).first().click();
  await expect(page.getByText('PI-2026-0815').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /報工/ })).toHaveCount(0);
});

// 9.23 生產任務列表與派工畫面帶急件標注，改急件選項後即時更新（OpenSpec change rush-order-definition，
// production-execution spec § 生產任務與轉交單明細的急件標注）：依所屬工單的所屬印件推算，凍結天數大於 0 才標；
// 只做標示，不改任務日期、不擋合併打包。
// 起點：鏈三 PI-2026-0815（一般件）旗下四筆待派任務；業務把它改成三天急件後，生管重新開啟。
test('9.23 生產任務列表與派工畫面帶急件標注，改急件選項後即時更新', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row1 = page.locator('tr', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) });
  await expect(row1).toBeVisible();
  await expect(row1.getByText('急件', { exact: true })).toHaveCount(0);

  // 業務改急件選項：一般件 → 三天急件（只改標注，不改任何日期）
  await switchRole(page, '業務');
  await gotoInApp(page, '/orders');
  await page.getByPlaceholder(/請輸入訂單編號/).fill('ORD-2026-0815');
  await page.keyboard.press('Enter');
  await clickIntoDetail(page, 'ORD-2026-0815', /orders\/detail/);
  await page.getByRole('tab', { name: /訂單項目/ }).click();
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0815' }).first();
  await itemRow.getByRole('button', { name: '編輯印件' }).click();
  await page.locator('.ant-select:has(#urgent_option_id)').click();
  await page.locator('.ant-select-dropdown').last().getByText(/三天急件/).click();
  await page.getByRole('button', { name: '確認' }).click();
  await expect(page.locator('.ant-drawer-content-wrapper')).toHaveCount(0);

  // 生管重新開啟所有生產任務：該筆任務列帶急件標注，印件內部完成日維持 2026-10-02
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/dispatch');
  await expect(row1.getByText('急件', { exact: true })).toBeVisible();
  await expect(row1).toContainText('2026-10-02');

  // 派工畫面：勾選後開啟，任務列同樣帶急件標注
  await row1.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /派工（1）/ }).click();
  await expect(page.getByText('派工內容（1）')).toBeVisible();
  await expect(page.locator('.ant-modal-body').getByText('急件', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '取消', exact: true }).click();
});
