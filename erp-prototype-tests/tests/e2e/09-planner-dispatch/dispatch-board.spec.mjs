import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';

// 情境目錄第九章：生管在「生產任務管理」頁（/production-floor/dispatch）接收與派工。
// 起點資料：鏈三 WO-2026-0815 的四筆待派任務（皆待處理、已交付、待接收、無工作包）：
// 牛皮紙 150g 備料、五色印刷、軋盒成型、糊盒成型。任務編號（PT-0815-*）不在畫面上顯示，
// 一律以任務名稱、工單編號等使用者看得到的文字選取列。

// AntD Select 下拉為虛擬捲動、選項可能落在可視區外，改用鍵盤移動再 Enter（同 _helpers.switchRole 的做法）。
// GenericFilter 篩選欄位沒有 <label for>：用「標籤文字所在的 Col」找同一格內的 Select。
const selectFilterOption = async (page, labelText, optionIndex) => {
  await page.locator('.ant-col', { hasText: labelText }).locator('.ant-select').click();
  for (let i = 0; i < optionIndex; i += 1) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
};

test('9.1 生管看待派任務清單，其他角色的可見範圍（原編號 13）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  await expect(page.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();

  // 篩選：任務類別＝工序（TASK_TYPE_META 順序：材料、工序、裝訂，工序是第 2 個選項）
  // → 材料型任務（牛皮紙 150g 備料）被篩掉，工序任務（五色印刷）留下
  await selectFilterOption(page, '任務類別', 1);
  await expect(page.getByText('牛皮紙 150g 備料')).toHaveCount(0);
  await expect(page.getByText('五色印刷', { exact: true })).toBeVisible();

  // 表格不再顯示「前置」與「下游生產任務」兩欄
  await expect(page.getByRole('columnheader', { name: '前置', exact: true })).toHaveCount(0);
  await expect(page.getByRole('columnheader', { name: '下游生產任務' })).toHaveCount(0);

  // 印務主管也看得到本頁、沒有角色限制提示
  await switchRole(page, '印務主管');
  await expect(page.getByText('派工限生管、印務、印務主管與主管操作')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();
});

test('9.2 生管對已交付產線的任務按「接收工作」（原編號 14）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row = page.locator('tr', { hasText: '牛皮紙 150g 備料' });
  await expect(row.getByText('待接收')).toBeVisible();
  await row.getByRole('button', { name: '接收工作' }).click();
  await expect(page.getByText('已接收工作 1 筆生產任務（接收工作欄已留痕）')).toBeVisible();
  await expect(row.getByText('已接收')).toBeVisible();
  await expect(row.getByText('許文傑')).toBeVisible();

  // 批次接收：勾選其餘任務後按批次接收工作（.ant-table-measure-row 是 AntD 量寬度用的隱藏列，排除掉）
  const rows = page.locator('.ant-table-tbody tr.ant-table-row');
  const count = await rows.count();
  for (let i = 0; i < count; i += 1) {
    await rows.nth(i).locator('input[type="checkbox"]').check({ force: true });
  }
  await page.getByRole('button', { name: /接收工作（\d+）/ }).click();
  await expect(page.getByText('已接收工作 3 筆生產任務（接收工作欄已留痕）')).toBeVisible();
});

test('9.6 生管在派工時系統補寫接收留痕（原編號 80）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row = page.locator('tr', { hasText: '牛皮紙 150g 備料' });
  await expect(row.getByText('待接收')).toBeVisible();
  await row.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /派工（1）/ }).click();
  // MASTER_OPTIONS 順序：劉阿海、李榮發、陳金水，劉阿海是預設高亮的第 1 個選項
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '確認派工' }).click();
  await expect(page.getByText(/已建立工作包.*已一併補寫接收留痕/)).toBeVisible();
});

test('9.7 工廠總覽待排區顯示印件預計交期（原編號 81）', async ({ page }) => {
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
  await expect(table.getByRole('columnheader', { name: '印件預計交期' })).toBeVisible();
  await expect(table.getByRole('columnheader', { name: '估工時' })).toBeVisible();
  await expect(table.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();

  await switchRole(page, '印務');
  await gotoInApp(page, '/production-floor/schedule');
  await expect(page.getByText('待排區（已交付產線、未入工作包）')).toBeVisible();
});

test('9.8 派工視窗上方列出這次要派的任務內容（原編號 82）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/dispatch');
  const row1 = page.locator('tr', { hasText: '牛皮紙 150g 備料' });
  const row2 = page.locator('tr', { hasText: '五色印刷' });
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
  await expect(dialog.getByRole('columnheader', { name: '投產目標' })).toBeVisible();
  await expect(dialog.locator('.ant-table-tbody tr')).toHaveCount(2);
  await page.getByRole('button', { name: '取消' }).click();

  // 改只勾另一筆任務再開一次，內容表換成新選取的任務
  await row1.locator('input[type="checkbox"]').uncheck();
  await page.getByRole('button', { name: /派工（1）/ }).click();
  await expect(page.getByText('派工內容（1）')).toBeVisible();
  await expect(page.locator('.ant-modal-body .ant-table-tbody tr')).toHaveCount(1);
  await expect(page.locator('.ant-modal-body')).toContainText('五色印刷');
});

// 說明：catalog 原描述「工單詳情頁首的報工按鈕」，Miles 2026-09-04 已拍板把頁首單一報工按鈕
// 收進「製程」Tab，改成表格逐列圖示（work-orders/_components/detail/ProcessTab.js）；
// 停用態＋提示原因的行為本身不變，本測試改驗逐列圖示。
test('9.10 沒派工就報不了工，畫面要說原因（原編號 116）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0815');
  // exact:true 避免連到「批次報工（0）」（Playwright 預設子字串比對會連到它）
  const reportButtons = page.getByRole('button', { name: '報工', exact: true });
  await expect(reportButtons.first()).toBeDisabled();
  // 停用按鈕外包一層 <span> 承接 hover（AntD Tooltip 對 disabled 元素的慣用寫法）
  await reportButtons.first().locator('xpath=..').hover();
  await expect(page.getByRole('tooltip')).toContainText('尚未派工，請先由生管派工');
});

// 9.10 後半（師傅沒有可報工作包時的提示）依 Miles 2026-09-08 裁決不列自動化驗收，見情境目錄 9.10 範圍限制。
