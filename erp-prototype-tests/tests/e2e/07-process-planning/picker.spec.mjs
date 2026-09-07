import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import {
  bomPicker,
  formField,
  openWorkOrder,
  pickBomRow,
  pickerRows,
  readOnlyPair,
  switchFormTab,
  taskForm,
} from './_ch07.mjs';

// 起點資料：鏈五 WO-2026-0901 的製程規劃，按「新增生產任務」直接開 BOM 選擇器。

test('7.2 備料規格選擇器的牌價欄顯示價格範圍（原編號 69）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  const picker = bomPicker(page);
  await expect(picker).toBeVisible();

  // 材料頁籤的牌價欄：珠光合成紙的每平方公尺價格寫成範圍
  const searchBox = picker.getByPlaceholder('搜尋材料名稱');
  await searchBox.fill('珠光合成紙');
  await searchBox.press('Enter');
  await expect(pickerRows(page)).toHaveCount(3);
  await expect(pickerRows(page).first()).toContainText(/\d+ ~ \d+ 元／平方公尺/);
  // 沒有滑鼠停留才出現的級距表
  await pickerRows(page).first().locator('td').last().hover();
  await expect(page.locator('.ant-tooltip')).toHaveCount(0);

  // 按重量計價的材料一筆備料一列，列上有備料、備料尺寸、開料數、供應商原料，牌價為噸價
  await searchBox.fill('一級卡');
  await searchBox.press('Enter');
  await expect(pickerRows(page)).toHaveCount(2);
  await expect(pickerRows(page).nth(1)).toContainText('名片八開');
  await expect(pickerRows(page).nth(1)).toContainText('四六全 787×1091');
  await expect(pickerRows(page).nth(1)).toContainText('27,000 元／噸');
  for (const header of ['備料', '備料尺寸', '開料數', '供應商原料', '牌價']) {
    await expect(picker.locator('.ant-table-thead th').filter({ hasText: header })).not.toHaveCount(
      0,
    );
  }

  // 裝訂頁籤的騎馬釘：一頁數一列，牌價同樣寫成範圍
  await picker.locator('.ant-tabs-tab', { hasText: '裝訂' }).click();
  const stitchRows = pickerRows(page).filter({ hasText: '騎馬釘裝訂' });
  await expect(stitchRows).toHaveCount(4);
  await expect(stitchRows.first()).toContainText(/元／本/);

  // 工單詳情的預估成本分項照常呈現四分項金額
  await picker.getByRole('button', { name: '取消' }).click();
  await expect(taskForm(page)).toHaveCount(0);
  await page.locator('.ant-tabs-tab').filter({ hasText: '預估成本分項' }).first().click();
  const summary = page.locator('.ant-table-summary');
  await expect(summary).toContainText('NT$');
  await expect(
    page.locator('.ant-table-tbody tr').filter({ hasText: '雪銅紙 150g 菊全' }).first(),
  ).toContainText('NT$ 4,424');
});

test('7.11 新增生產任務一開就選主檔，新任務排在最後（原編號 163）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 清單右上只有一顆新增按鈕
  await expect(page.getByRole('button', { name: /^新增/ })).toHaveCount(1);
  const before = await page.locator('.ant-table-tbody tr.ant-table-row').count();

  // 一點開就是選擇器：三個頁籤、預選材料，沒有先選類型那一步
  await page.getByRole('button', { name: '新增生產任務' }).click();
  const picker = bomPicker(page);
  await expect(picker.locator('.ant-tabs-tab')).toHaveCount(3);
  await expect(picker.locator('.ant-tabs-tab-active')).toHaveText('材料');

  // 切裝訂頁籤勾一列帶入後，表單標題跟著改
  await picker.locator('.ant-tabs-tab', { hasText: '裝訂' }).click();
  await pickerRows(page).filter({ hasText: '騎馬釘裝訂' }).first().click();
  await picker.getByRole('button', { name: '帶入' }).click();
  await expect(page.locator('.ant-modal-title').last()).toHaveText('新增裝訂任務');

  // 填完必填欄位後送出
  await formField(page, '印件部位').locator('input').fill('內頁');
  await formField(page, '目的站點').locator('.ant-select').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await switchFormTab(page, '數量與放損');
  await formField(page, '預計生產').locator('input').fill('3000');
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toHaveCount(0);

  // 新任務排在清單最後一列，既有順序不變
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  await expect(rows).toHaveCount(before + 1);
  await expect(rows.first()).toContainText('雪銅紙 150g 菊全');
  await expect(rows.last()).toContainText('騎馬釘裝訂');

  // 選擇器按取消且沒勾任何列時，整張表單一起關掉
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await expect(bomPicker(page)).toBeVisible();
  await bomPicker(page).getByRole('button', { name: '取消' }).click();
  await expect(taskForm(page)).toHaveCount(0);
  await expect(page.locator('.ant-modal-title')).toHaveCount(0);
});

test('7.14 按面積計價的工序改選面積規格，備料任務只在自有機台工單（原編號 173）', async ({
  page,
}) => {
  test.setTimeout(90_000); // 切角色整段可重試，預設 30 秒不夠
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  const picker = bomPicker(page);
  await picker.locator('.ant-tabs-tab', { hasText: '工序' }).click();
  // 側欄點表面處理分類
  await picker.getByText('表面處理', { exact: true }).click();
  const polishRows = pickerRows(page).filter({ hasText: '局部上光' }).filter({ hasNotText: '網印' });
  // 局部上光展成四列，一列一個尺寸，單價欄顯示該尺寸落到的區間價
  await expect(polishRows).toHaveCount(4);
  await expect(polishRows.first()).toContainText('20×20 公分');
  await expect(polishRows.first()).toContainText(/元／平方公尺/);
  await polishRows.first().click();
  await picker.getByRole('button', { name: '帶入' }).click();

  // 帶入後表單頂端只留面積數值欄（必填、單位平方公尺）
  const areaField = formField(page, '面積');
  await expect(areaField).toBeVisible();
  await expect(areaField).toContainText('平方公尺');
  // 沒填會被擋下並提示請填面積
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page).getByRole('button', { name: '面積' })).toBeVisible();
  await expect(taskForm(page)).toContainText('請填面積');

  // 改帶入非面積計價的工序後面積欄消失
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });
  await expect(formField(page, '面積')).toHaveCount(0);
  await taskForm(page).getByRole('button', { name: '取消' }).click();

  // 自有機台工單 WO-2026-0910 的第一筆為材料備料任務，材料費算在它自己的目標數量上
  await page.getByRole('button', { name: 'arrow_back' }).first().click();
  // WO-2026-0910 的負責印務是蔡明修，工單列表以負責印務過濾，故改以印務主管檢視。
  // 角色下拉靠鍵盤逐項移動，機器忙碌時偶爾少吃一次按鍵，故整段重試
  await expect(async () => {
    await switchRole(page, '印務主管');
  }).toPass({ timeout: 30000 });
  await openWorkOrder(page, 'WO-2026-0910');
  const firstRow = page.locator('.ant-table-tbody tr.ant-table-row').first();
  await expect(firstRow).toContainText('珠光合成紙');
  await page.locator('.ant-tabs-tab').filter({ hasText: '預估成本分項' }).first().click();
  const costRow = page.locator('.ant-table-tbody tr').filter({ hasText: '珠光合成紙' }).first();
  await expect(costRow).not.toContainText('材料費 NT$ 0');
  await expect(costRow).toContainText('NT$');
});

test('7.15 選擇器一列等於一個計價層級的選項（原編號 175）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  const picker = bomPicker(page);

  // 同一種紙的兩個磅數各一列
  const searchBox = picker.getByPlaceholder('搜尋材料名稱');
  await searchBox.fill('雪銅紙');
  await searchBox.press('Enter');
  await expect(pickerRows(page)).toHaveCount(2);
  await expect(pickerRows(page).nth(0)).toContainText('150g');
  await expect(pickerRows(page).nth(1)).toContainText('200g');

  // 側欄點輸出材：同一種輸出材的三個面積區間各一列
  await searchBox.fill('');
  await searchBox.press('Enter');
  await picker.getByText('輸出材', { exact: true }).click();
  await expect(pickerRows(page).filter({ hasText: '珠光合成紙' })).toHaveCount(3);

  // 表格欄含計價大類與計價子類兩欄
  for (const header of ['計價大類', '計價子類']) {
    await expect(picker.locator('.ant-table-thead th').filter({ hasText: header })).not.toHaveCount(
      0,
    );
  }

  // 工序頁籤：平版印刷一列
  await picker.locator('.ant-tabs-tab', { hasText: '工序' }).click();
  const procSearch = picker.getByPlaceholder('搜尋工序名稱');
  await procSearch.fill('平版印刷');
  await procSearch.press('Enter');
  await expect(pickerRows(page)).toHaveCount(1);

  // 裝訂頁籤：騎馬釘四列、膠裝三列，且沒有左側分類側欄
  await picker.locator('.ant-tabs-tab', { hasText: '裝訂' }).click();
  await expect(pickerRows(page).filter({ hasText: '騎馬釘裝訂' })).toHaveCount(4);
  await expect(pickerRows(page).filter({ hasText: '膠裝' })).toHaveCount(3);
  await expect(picker.getByPlaceholder('輸入分類名稱搜尋')).toHaveCount(0);

  // 帶入材料列後，表單上沒有群組、名稱、規格、備料、面積區間、頁數、台數任何下拉
  await picker.locator('.ant-tabs-tab', { hasText: '材料' }).click();
  await pickBomRow(page, { tab: '材料', keyword: '一級卡', index: 1 });
  const form = taskForm(page);
  await expect(form.locator('.ant-select')).toHaveCount(3); // 計畫設備、目的站點、前置相依
  // 材料型任務名稱等於材料名加規格名加備料名稱
  await expect(formField(page, '任務名稱').locator('input')).toHaveValue('一級卡 300g 名片八開');
  await expect(readOnlyPair(page, '備料')).toContainText('名片八開');
});

test('7.16 選擇器的篩選：分類側欄、名稱、品牌與廠商（原編號 176）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  const picker = bomPicker(page);

  // 點群組只剩該群組的列
  await picker.getByText('輸出材', { exact: true }).click();
  const rows = pickerRows(page);
  await expect(rows).toHaveCount(6);
  // 點材料名稱只剩該材料的列，再點一次取消
  await picker.getByText('珠光合成紙', { exact: true }).first().click();
  await expect(rows).toHaveCount(3);
  await picker.getByText('珠光合成紙', { exact: true }).first().click();
  await expect(rows).toHaveCount(6);

  // 清掉側欄改用品牌篩選
  await picker.getByRole('button', { name: 'autorenew' }).click();
  await picker.locator('.ant-select').first().click();
  await page.locator('.ant-select-item-option').filter({ hasText: '南亞' }).click();
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('珠光合成紙');

  // 名稱關鍵字同時比對名稱、規格、備料、供應商原料與品牌
  await picker.getByRole('button', { name: 'autorenew' }).click();
  const searchBox = picker.getByPlaceholder('搜尋材料名稱');
  for (const keyword of ['一級卡', '300g', '名片八開', '四六全 787×1091', '榮成']) {
    await searchBox.fill(keyword);
    await searchBox.press('Enter');
    await expect(rows.filter({ hasText: '一級卡' })).not.toHaveCount(0);
  }

  // 工序頁籤的篩選是工序廠商
  await picker.locator('.ant-tabs-tab', { hasText: '工序' }).click();
  await expect(picker.getByText('工序廠商', { exact: true })).toBeVisible();
  await picker.locator('.ant-select').first().click();
  await page.locator('.ant-select-item-option').filter({ hasText: '協力一廠' }).click();
  await expect(rows.first()).toContainText('協力一廠');

  // 裝訂頁籤有裝訂廠商篩選與名稱搜尋、沒有分類側欄
  await picker.locator('.ant-tabs-tab', { hasText: '裝訂' }).click();
  await expect(picker.getByText('裝訂廠商', { exact: true })).toBeVisible();
  await expect(picker.getByPlaceholder('搜尋裝訂名稱')).toBeVisible();
  await expect(picker.getByPlaceholder('輸入分類名稱搜尋')).toHaveCount(0);
});
