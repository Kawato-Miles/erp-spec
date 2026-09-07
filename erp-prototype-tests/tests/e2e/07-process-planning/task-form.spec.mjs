import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  bomPicker,
  formField,
  openWorkOrder,
  pickBomRow,
  readOnlyPair,
  switchFormTab,
  taskForm,
} from './_ch07.mjs';

// 起點資料：鏈五 WO-2026-0901（草稿、印務周建宏登打中），除 7.19 另開錨例 WO-2026-0908。

test('7.6 投入計畫拆成預計生產與放損兩欄，目標數量唯讀加總（原編號 156）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 頂端的放損率是主檔帶入的唯讀參考，不是輸入欄
  const rateBlock = readOnlyPair(page, '放損率');
  await expect(rateBlock).toContainText('3%');
  await expect(rateBlock.locator('input')).toHaveCount(0);

  await switchFormTab(page, '數量與放損');
  await expect(formField(page, '預計生產')).toBeVisible();
  await expect(formField(page, '放損')).toBeVisible();
  await expect(formField(page, '目標數量')).toBeVisible();

  // 情境的數字：預計生產 20,000、放損改 800 後目標數量為 20,800
  await formField(page, '預計生產').locator('input').fill('20000');
  await formField(page, '放損').locator('input').fill('800');
  await expect(formField(page, '目標數量')).toContainText('20,800');
  // 目標數量欄無法輸入（唯讀衍生值，要改量改前面兩欄）
  await expect(formField(page, '目標數量').locator('input')).toHaveCount(0);

  // 按重選改帶入一筆材料列：材料型任務照樣顯示放損率欄
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '材料', keyword: '雪銅紙' });
  await expect(taskForm(page).getByText('放損率', { exact: true })).toBeVisible();
});

test('7.7 色數依印刷類工序旗標顯示，五個色別各自計數（原編號 157）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 未選計畫設備時色數段已經出現，五個色別各一個數字欄
  const colorTab = taskForm(page).locator('.ant-tabs-tab').filter({ hasText: '色數登記' });
  await expect(colorTab).toBeVisible();
  await switchFormTab(page, '色數登記');
  // 情境寫「單黑、四色、特別色、金屬色合印、獨立印」，畫面用主檔的色別名稱
  for (const label of ['單黑', 'CMYK', 'Pantone', '金屬色（合印）', '獨立印']) {
    await expect(formField(page, label).locator('input')).toHaveCount(1);
  }
  await expect(taskForm(page)).toContainText('色數為純記錄、不參與計價，設備費照實顯示 0');

  // 選一台自有印刷機後，說明列出三顆倍率
  await formField(page, '計畫設備').locator('.ant-select').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '海德堡 SM102 四色機' }).click();
  await switchFormTab(page, '色數登記');
  await expect(taskForm(page)).toContainText('Pantone ×1.3');
  await expect(taskForm(page)).toContainText('金屬色（合印） ×1.8');
  await expect(taskForm(page)).toContainText('獨立印 ×2.2');
  await formField(page, 'Pantone').locator('input').fill('1');
  await formField(page, '獨立印').locator('input').fill('1');

  // 改選一道非印刷類工序後色數段消失
  await taskForm(page).getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '局部磨砂上光' });
  await expect(taskForm(page).locator('.ant-tabs-tab').filter({ hasText: '色數登記' })).toHaveCount(
    0,
  );
});

test('7.8 印刷任務成本等於工序費加設備費（原編號 158）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 計價方式為主檔帶入的唯讀欄（工序自身的計價法：上機印數）
  const method = readOnlyPair(page, '計價子類');
  await expect(method).toContainText('上機印數');
  await expect(method.locator('input')).toHaveCount(0);

  // 選定自有平版機台後，數量段下方說明兩欄一律填上機張數
  await formField(page, '計畫設備').locator('.ant-select').click();
  await page.locator('.ant-select-item-option').filter({ hasText: '海德堡 SM102 四色機' }).click();
  await switchFormTab(page, '數量與放損');
  await expect(taskForm(page)).toContainText('兩欄一律填上機張數');
  // 任務表單沒有計價輸入段
  await expect(taskForm(page).getByText('計價數量', { exact: true })).toHaveCount(0);

  // 工單彙總為旗下任務四分項相加
  await taskForm(page).getByRole('button', { name: '取消' }).click();
  await expect(taskForm(page)).toBeHidden();
  await page.locator('.ant-tabs-tab').filter({ hasText: '預估成本分項' }).first().click();
  const headers = page.locator('.ant-table-thead th');
  await expect(headers.filter({ hasText: '材料費' })).toHaveCount(1);
  await expect(headers.filter({ hasText: '工序費' })).toHaveCount(1);
  await expect(headers.filter({ hasText: '裝訂費' })).toHaveCount(1);
  await expect(headers.filter({ hasText: '設備費' })).toHaveCount(1);
  await expect(page.locator('.ant-table-summary')).toContainText('工單彙總');
});

test('7.13 計入完成度預設關閉，勾了才填每份工單需生產數量（原編號 171）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 任務內容與排程頁籤沒有計入完成度
  await expect(taskForm(page).locator('.ant-tabs-tabpane-active')).not.toContainText('計入完成度');

  await switchFormTab(page, '數量與放損');
  const toggle = formField(page, '計入完成度').locator('button[role="switch"]');
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(formField(page, '每份工單需生產數量')).toHaveCount(0);

  await toggle.click();
  await expect(formField(page, '每份工單需生產數量').locator('input')).toHaveValue(/^1(\.0)?$/);

  await toggle.click();
  await expect(formField(page, '每份工單需生產數量')).toHaveCount(0);
});

test('7.17 任務表單改成頂端固定區加三個頁籤（原編號 177）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  // 頂端固定區第一段：主檔帶入的純顯示資料（情境寫「單價」，畫面欄名為「牌價」）
  const form = taskForm(page);
  for (const label of ['廠商類別', '承作廠商', '計價大類', '計價子類', '放損率', '牌價']) {
    await expect(form.getByText(label, { exact: true })).toBeVisible();
  }
  // 第二段：要填的欄位
  await expect(formField(page, '任務名稱').locator('input')).toHaveValue('平版印刷');
  await expect(formField(page, '計畫設備')).toBeVisible();
  // 非按面積計價的工序不出現面積欄
  await expect(formField(page, '面積')).toHaveCount(0);

  await expect(form.locator('.ant-tabs-nav .ant-tabs-tab')).toHaveCount(3);
  await expect(form.locator('.ant-tabs-nav .ant-tabs-tab').nth(0)).toContainText('任務內容與排程');
  await expect(form.locator('.ant-tabs-nav .ant-tabs-tab').nth(1)).toContainText('數量與放損');
  await expect(form.locator('.ant-tabs-nav .ant-tabs-tab').nth(2)).toContainText('色數登記');

  // 改帶入非印刷類工序後色數頁籤消失、剩兩個
  await form.getByRole('button', { name: '重選' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '局部磨砂上光' });
  await expect(taskForm(page).locator('.ant-tabs-nav .ant-tabs-tab')).toHaveCount(2);
});

test('7.18 缺漏檢查按確定後才亮，清單可點跳（原編號 178）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await page.getByRole('button', { name: '新增生產任務' }).click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });

  const form = taskForm(page);
  // 按之前頁籤沒有徽章、底部沒有缺漏清單
  await expect(form.locator('.ant-tabs-tab').filter({ hasText: '缺' })).toHaveCount(0);
  await expect(form.getByText(/尚缺 \d+ 項/)).toHaveCount(0);

  await form.getByRole('button', { name: '新增任務' }).click();
  // 按之後頁籤標籤帶紅色缺漏數、底部一行列出尚缺哪幾項
  await expect(form.locator('.ant-tabs-tab').filter({ hasText: '缺' }).first()).toBeVisible();
  await expect(form.getByText(/尚缺 \d+ 項/)).toBeVisible();
  await expect(form.getByRole('button', { name: '印件部位' })).toBeVisible();
  await expect(form.getByRole('button', { name: '預計生產' })).toBeVisible();
  // 缺的欄位框變紅
  await expect(formField(page, '印件部位').locator('input')).toHaveClass(/ant-input-status-error/);

  // 點清單上的項目跳到對應頁籤
  await form.getByRole('button', { name: '預計生產' }).click();
  await expect(form.locator('.ant-tabs-tab-active')).toContainText('數量與放損');

  // 補填一個欄位後該項即時從清單與徽章消失
  await switchFormTab(page, '任務內容與排程');
  await formField(page, '印件部位').locator('input').fill('全張');
  await expect(form.getByRole('button', { name: '印件部位' })).toHaveCount(0);
});

test('7.19 編輯既有任務看得到當初選的那一列，製程定案後不可換主檔（原編號 179）', async ({
  page,
}) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  // 第一筆材料任務「雪銅紙 150g 菊全」
  const materialRow = page.locator('tr.ant-table-row').filter({ hasText: '雪銅紙 150g 菊全' });
  await materialRow.getByRole('button', { name: '編輯' }).click();

  const form = taskForm(page);
  await expect(page.locator('.ant-modal-title').last()).toHaveText('編輯材料任務');
  // 頂端逐欄顯示當初選定的主檔內容（按重量材料以備料與供應商原料兩欄取代面積區間欄）
  for (const label of [
    '生產任務種類',
    '分類',
    '材料名稱',
    '品牌',
    '規格',
    '備料',
    '供應商原料',
    '廠商類別',
    '承作廠商',
    '計價大類',
    '計價子類',
    '牌價',
  ]) {
    await expect(form.getByText(label, { exact: true })).toBeVisible();
  }
  // 任務名稱帶原值可改
  await expect(formField(page, '任務名稱').locator('input')).toHaveValue('雪銅紙 150g 菊全');
  await expect(formField(page, '任務名稱').locator('input')).toBeEnabled();
  await form.getByRole('button', { name: '取消' }).click();
  await expect(form).toBeHidden();

  // 對照組：製程審核完成的錨例工單 WO-2026-0908
  await page.getByRole('button', { name: 'arrow_back' }).first().click();
  await expect(page).toHaveURL(/work-orders\/?($|\?)/);
  await openWorkOrder(page, 'WO-2026-0908');
  await page.locator('tr.ant-table-row').first().getByRole('button', { name: '編輯備註' }).click();
  const locked = taskForm(page);
  await expect(page.locator('.ant-modal-title').last()).toContainText('製程已定案，僅備註可改');
  await expect(locked.getByRole('button', { name: '重選' })).toHaveCount(0);
  await expect(formField(page, '任務名稱').locator('input')).toBeDisabled();
  await expect(formField(page, '備註').locator('textarea')).toBeEnabled();
});
