import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';

// 情境目錄 9.19～9.21（2026-10-06 新增）：報工前提不含接收與打包；加工廠任務不打包也能報工；
// 跨產線工作包只對自己產線範圍的任務開放報工、修改與作廢。
// 依據：wiki 生產任務接收與派工 副流程第 3 步之前分支、第 3 步分支（任務屬加工廠）；
// 生產管理單元可見範圍 主流程第 4 步分支（工作包旗下任務跨產線）。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence production-execution delta
// § 報工前提、§ 待派任務接收、§ 生產管理單元的權限與可見範圍 的 THEN。
// 純函式另見 tests/unit/production-floor/report-precondition-and-entries.test.mjs、floor-units-scope.test.mjs。

const PHOTO = { name: '現場照.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('現場照') };

// 報工對話框的一列：填生產數量、良品數、不良品數並上傳現場照片
async function fillReportLine(page, taskName, { input, good, defect = 0 }) {
  const box = page.locator('.ant-modal-body').last();
  const line = box.locator('tbody tr').filter({ hasText: taskName }).first();
  const numbers = line.locator('input.ant-input-number-input');
  await numbers.nth(0).fill(String(input));
  await numbers.nth(1).fill(String(good));
  await numbers.nth(2).fill(String(defect));
  await line.locator('input[type="file"]').first().setInputFiles(PHOTO);
}

test('9.19 生管還沒接收或打包，從所有生產任務代報即可報工', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈三 WO-2026-0815 的牛皮紙 150g 備料（已交付、尚未接收、未打包、沒有前置）
  await openAs(page, '生管', '/production-floor/dispatch');
  // 先以工單編號篩出鏈三：派工後已打包的列排到未打包之後，不篩的話會翻到第二頁
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0815');
  await search.press('Enter');
  const row = page
    .locator('tr.ant-table-row', { has: page.getByText('牛皮紙 150g 備料', { exact: true }) })
    .first();
  await expect(row).toContainText('待處理');
  await row.getByRole('button', { name: '報工' }).click();
  await fillReportLine(page, '牛皮紙 150g 備料', { input: 520, good: 520 });
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 任務轉製作中，仍未接收、未打包；之後照樣能接收與打包
  await expect(row).toContainText('製作中');
  await row.getByRole('button', { name: '接收工作' }).click();
  await expect(page.getByText(/已接收工作 1 筆生產任務/).last()).toBeVisible();
  await row.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /派工（1）/ }).click();
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '確認派工' }).click();
  await expect(page.getByText(/已建立工作包 WP-/).last()).toBeVisible();
  await expect(row).toContainText('師傅 劉阿海');
});

test('9.20 加工廠任務接收後不打包，印務從工單詳情或所有生產任務報工', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈外 WO-2026-0812 的證書局部上光（加工廠、手工產線、已交付、已接收、未打包、沒有前置）
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  const taskRow = page.locator('tr', { hasText: '證書局部上光' }).first();
  await expect(taskRow).toContainText('已接收');
  await taskRow.getByRole('button', { name: '報工', exact: true }).click();
  await fillReportLine(page, '證書局部上光', { input: 200, good: 198, defect: 2 });
  const box = page.locator('.ant-modal-body').last();
  await box.locator('tbody tr').filter({ hasText: '證書局部上光' }).locator('.ant-select').first().click();
  await page.locator('.ant-select-dropdown:visible .ant-select-item-option', { hasText: '刮傷' }).click();
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();
  // 任務轉製作中，交付狀態維持已接收，仍不屬任何工作包
  await expect(taskRow).toContainText('製作中');
  await expect(taskRow).toContainText('已接收');

  // 生管鄭宇翔（手工、壓克力產線）的所有生產任務列出同一筆，有報工入口
  await switchRole(page, '生管（鄭宇翔）');
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('證書局部上光');
  await search.press('Enter');
  const floorRow = page.locator('tr.ant-table-row', { hasText: '證書局部上光' }).first();
  await expect(floorRow).toBeVisible();
  await expect(floorRow.getByRole('button', { name: '報工' })).toHaveCount(1);
});

test('9.21 跨產線工作包只能對自己產線範圍的任務報工、修改與作廢', async ({ page }) => {
  test.setTimeout(150_000);
  // 前置：生管許文傑把證書裁切（手工產線）與五色印刷（數位產線）打成一包給劉阿海
  await openAs(page, '生管', '/production-floor/dispatch');
  for (const name of ['證書裁切', '五色印刷']) {
    const row = page.locator('tr.ant-table-row', { hasText: name }).first();
    await row.locator('input[type="checkbox"]').check({ force: true });
  }
  await page.getByRole('button', { name: /派工（2）/ }).click();
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '確認派工' }).click();
  const toast = page.getByText(/已建立工作包 WP-\d{8}-\d+，指派 劉阿海/).last();
  await expect(toast).toBeVisible();
  const pkgNo = (await toast.innerText()).match(/WP-\d{8}-\d+/)[0];

  // 鄭宇翔（手工、壓克力）：所有工作包列出這一包；證書裁切有報工，五色印刷只能看
  await switchRole(page, '生管（鄭宇翔）');
  await gotoInApp(page, '/production-floor/work-packages');
  const pkgRow = page.locator('tr.ant-table-row', { hasText: pkgNo }).first();
  await expect(pkgRow).toBeVisible();
  await pkgRow.getByLabel('展開行').click();
  const sub = pkgRow.locator('xpath=following-sibling::tr[1]');
  const cutRow = sub.locator('tr', { hasText: '證書裁切' }).first();
  const printRow = sub.locator('tr', { hasText: '五色印刷' }).first();
  await expect(cutRow.getByRole('button', { name: '報工' })).toHaveCount(1);
  await expect(printRow).toBeVisible();
  await expect(printRow.getByRole('button', { name: '報工' })).toHaveCount(0);
  await expect(printRow.getByRole('button', { name: /修\s*改|作\s*廢/ })).toHaveCount(0);
});
