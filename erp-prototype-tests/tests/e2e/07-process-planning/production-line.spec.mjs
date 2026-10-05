import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, taskRows } from '../_helpers.mjs';
// 表頭定位取欄的工具放在第八章（工單詳情的生產任務列表是群組表頭）
import { expectCell } from '../08-process-review-deliver/_page-helpers.mjs';
import {
  formField,
  openWorkOrder,
  pickBomRow,
  pickProductionLine,
  switchFormTab,
  taskForm,
} from './_ch07.mjs';

// 情境目錄 7.38、7.39：生產任務的產線欄（自部件配方工序段帶入、必填、不隨計畫設備變動）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的
// work-order 規格差異檔 § 生產任務結構與帶入規則。
// 起點資料：鏈五 WO-2026-0901（草稿，配方 PS-2026-0901）；鏈外 WO-2026-0906（局部上光為外包廠任務）。
// 異動加開與品檢缺口補做的帶入以純函式驗（tests/unit/work-orders/rules-production-line.test.mjs）。

test.describe.configure({ timeout: 150_000 });

// 展開中的產線下拉選項文字
async function productionLineOptions(page) {
  await formField(page, '產線').locator('.ant-select').click({ timeout: 20_000 });
  const options = page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option');
  await expect(options.first()).toBeVisible();
  const titles = await options.evaluateAll((els) => els.map((el) => el.getAttribute('title')));
  await page.keyboard.press('Escape');
  return titles;
}

// 底部缺漏清單（按「新增任務／儲存」後才出現）
const missingLink = (page, label) => taskForm(page).getByRole('button', { name: label, exact: true });

test('7.38 生產任務產線自部件配方工序段帶入、必填、不隨計畫設備變動', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 任務列表帶出產線
  await expectCell(page, 'DM 四色雙面印刷', '產線', '數位產線');

  // 打開 DM 四色雙面印刷的編輯表單：產線預設數位產線，是單選、選項取產線標籤
  await taskRows(page).filter({ hasText: 'DM 四色雙面印刷' }).getByRole('button', { name: '編輯' }).click();
  await expect(formField(page, '產線')).toContainText('數位產線');
  const options = await productionLineOptions(page);
  expect(options).toEqual(['壓克力產線', '馬克杯產線', '杯墊產線', '數位產線', '裝訂產線', '手工產線']);
  await expect(formField(page, '產線').locator('.ant-select-multiple')).toHaveCount(0);

  // 改計畫設備成另一台印刷機後產線不跟著變
  await formField(page, '計畫設備').locator('.ant-select').click();
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .last()
    .locator('.ant-select-item-option')
    .filter({ hasText: 'RYOBI 755 五色機' })
    .click();
  await expect(formField(page, '產線')).toContainText('數位產線');
  await taskForm(page).getByRole('button', { name: '儲存' }).click();
  await expect(taskForm(page)).toHaveCount(0);
  await expectCell(page, 'DM 四色雙面印刷', '產線', '數位產線');

  // 新增一筆不從配方帶入的工序任務（軋型不在配方 PS-2026-0901 的工序段內）：產線留空
  const before = await taskRows(page).count();
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '軋型' });
  await expect(formField(page, '產線').locator('.ant-select-selection-item')).toHaveCount(0);
  await formField(page, '印件部位').locator('input').fill('全張');
  await formField(page, '目的站點').locator('.ant-select').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await switchFormTab(page, '數量與放損');
  await formField(page, '預計生產').locator('input').fill('3000');

  // 未選產線就按新增被擋下，缺漏清單列出產線
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toBeVisible();
  await expect(taskForm(page).getByText(/尚缺 \d+ 項/)).toBeVisible();
  await expect(missingLink(page, '產線')).toBeVisible();

  // 選定產線後存得進去
  await switchFormTab(page, '任務內容與排程');
  await pickProductionLine(page, '裝訂產線');
  await expect(missingLink(page, '產線')).toHaveCount(0);
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toHaveCount(0);
  await expect(taskRows(page)).toHaveCount(before + 1);
  // 列以「任務名＋印件部位」定位：裁切成型、三摺加工兩列的工序分類標籤「裁摺軋型」也含「軋型」二字
  await expectCell(page, '軋型全張', '產線', '裝訂產線');
});

test('7.39 外發任務同樣必填產線；異動加開與品檢缺口補做的任務產線同樣自工序段帶入', async ({
  page,
}) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 新增一筆外包廠承作的燙金任務：計畫設備留空、不選產線就按新增
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '燙金' });
  await expect(formField(page, '產線').locator('.ant-select-selection-item')).toHaveCount(0);
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toBeVisible();
  await expect(missingLink(page, '產線')).toBeVisible();

  // 外發加工線已移除：外發任務沒有專屬產線，下拉只有六條產線標籤
  await switchFormTab(page, '任務內容與排程');
  const options = await productionLineOptions(page);
  expect(options).not.toContain('外發加工線');
  await taskForm(page).getByRole('button', { name: '取消' }).click();

  // WO-2026-0906 的局部上光（外包廠任務）產線填手工產線
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0906');
  await expectCell(page, '局部上光', '產線', '手工產線');
});
