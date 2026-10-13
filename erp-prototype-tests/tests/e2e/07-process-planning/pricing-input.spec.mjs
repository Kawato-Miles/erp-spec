import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { formField, openWorkOrder, pickBomRow, readOnlyPair, taskForm } from './_ch07.mjs';

// 起點資料：鏈五 WO-2026-0901 的製程規劃，按「新增生產任務」開 BOM 選擇器。
// 以價格矩陣查價的項目，表單依計價方式出現手填欄（每件時間、台數、頁數），查格算式在純函式測試。

test('7.41 時間計價工序填每件時間查格（手工貼標、手工包裝）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '手工貼標' });

  // 勾手工貼標後表單出現每件時間欄，單位後綴為分鐘
  const timeField = formField(page, '每件時間');
  await expect(timeField).toBeVisible();
  await expect(timeField).toContainText('分鐘');
  // 非面積計價，不出現面積欄
  await expect(formField(page, '面積')).toHaveCount(0);
  // 牌價顯示整張價格矩陣的最低到最高
  await expect(readOnlyPair(page, '牌價')).toContainText('1.25 ~ 4 元／張');

  // 沒填擋下並提示
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page).getByRole('button', { name: '每件時間' })).toBeVisible();
  await expect(taskForm(page)).toContainText('請填每件時間');

  // 填了之後缺漏清單不再列每件時間，牌價不隨手填值變動
  await timeField.locator('input').fill('0.8');
  await expect(taskForm(page).getByRole('button', { name: '每件時間' })).toHaveCount(0);
  await expect(readOnlyPair(page, '牌價')).toContainText('1.25 ~ 4 元／張');

  // 改帶入手工包裝：單位後綴換成秒，手填值清空
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '手工包裝' });
  await expect(formField(page, '每件時間')).toContainText('秒');
  await expect(formField(page, '每件時間').locator('input')).toHaveValue('');
});

test('7.42 裝訂依計價方式填台數、頁數或選頁數項目', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();

  // 本數計價（騎馬釘）：頁數是下拉，只列主檔建立的頁數項目
  await pickBomRow(page, { tab: '裝訂', keyword: '騎馬釘裝訂' });
  const pagesField = formField(page, '頁數');
  await expect(pagesField.locator('.ant-select')).toHaveCount(1);
  await pagesField.locator('.ant-select').click();
  const options = page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option');
  await expect(options).toHaveCount(4);
  await expect(options).toHaveText(['8 頁', '16 頁', '24 頁', '32 頁']);
  await page.keyboard.press('Escape');
  await expect(formField(page, '台數')).toHaveCount(0);
  // 沒選擋下並提示
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toContainText('請選頁數');

  // 頁數計價（膠裝）：頁數是數字欄，單位後綴頁；換列後原選的頁數清空
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '裝訂', keyword: '膠裝' });
  await expect(formField(page, '頁數').locator('.ant-select')).toHaveCount(0);
  await expect(formField(page, '頁數').locator('input')).toHaveValue('');
  await expect(formField(page, '頁數')).toContainText('頁');

  // 台數計價（裸背線裝）：台數是數字欄，單位後綴台，沒有頁數欄
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '裝訂', keyword: '裸背線裝' });
  const signaturesField = formField(page, '台數');
  await expect(signaturesField.locator('input')).toHaveCount(1);
  await expect(signaturesField).toContainText('台');
  await expect(formField(page, '頁數')).toHaveCount(0);
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toContainText('請填台數');
  await signaturesField.locator('input').fill('6');
  await expect(taskForm(page).getByRole('button', { name: '台數' })).toHaveCount(0);
});
