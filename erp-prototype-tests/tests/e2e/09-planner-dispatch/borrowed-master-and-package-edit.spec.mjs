import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';

// 情境目錄 9.15、9.16（純函式另見 tests/unit/production-floor/dispatch-scope-and-packing.test.mjs）。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 production-execution delta
// Scenario THEN 與 wiki 業務情境卡「生產管理單元可見範圍」「生產任務接收與派工」。

test('9.15 師傅被借調到別線時照樣看得到並報得了工，點收範圍不變', async ({ page }) => {
  test.setTimeout(150_000);
  // 生管許文傑把手工產線的證書裁切打包給所屬產線為數位、裝訂的劉阿海
  await openAs(page, '生管', '/production-floor/dispatch');
  const row = page.locator('tr.ant-table-row', { hasText: '證書裁切' }).first();
  await row.locator('input[type="checkbox"]').check({ force: true });
  await page.getByRole('button', { name: /派工（1）/ }).click();
  // MASTER_OPTIONS 順序：劉阿海、李榮發、陳金水，劉阿海是預設高亮的第 1 個選項
  await page.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select').click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '確認派工' }).click();
  const toast = page.getByText(/已建立工作包 WP-\d{8}-\d+，指派 劉阿海/).last();
  await expect(toast).toBeVisible();
  const pkgNo = (await toast.innerText()).match(/WP-\d{8}-\d+/)[0];

  // 劉阿海：我的生產任務列出證書裁切
  await switchRole(page, '師傅');
  await gotoInApp(page, '/production-floor/dispatch/mine');
  const myTaskRow = page.locator('tr.ant-table-row', { hasText: '證書裁切' }).first();
  await expect(myTaskRow).toBeVisible();
  // 我的生產任務開放報工（2026-10-06 拍板 R6）
  await expect(myTaskRow.getByRole('button', { name: '報工' })).toHaveCount(1);

  // 我的工作包列出這個工作包，證書裁切有報工入口
  await gotoInApp(page, '/production-floor/work-packages/mine');
  const pkgRow = page.locator('tr.ant-table-row', { hasText: pkgNo }).first();
  await expect(pkgRow).toBeVisible();
  await pkgRow.getByLabel('展開行').click();
  const subRow = pkgRow
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '證書裁切' })
    .first();
  await expect(subRow.getByRole('button', { name: '報工' })).toHaveCount(1);

  // 點收佇列不列目的產線為手工產線的 TT-20260830-002（點收範圍仍依所屬產線）
  await gotoInApp(page, '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
});

test('9.16 指派師傅在我的工作包編輯自己的工作包，指派師傅唯讀，編輯寫入任務歷程', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await openAs(page, '師傅', '/production-floor/work-packages');
  const pkgRow = page.locator('tr.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  await pkgRow.getByRole('button', { name: '編輯工作包' }).click();
  const dialog = page.locator('.ant-modal-content:visible').filter({ hasText: '編輯工作包' }).last();
  // 指派師傅唯讀
  await expect(
    dialog.locator('.ant-form-item', { hasText: '指派師傅' }).locator('.ant-select-disabled'),
  ).toHaveCount(1);
  await dialog
    .locator('.ant-form-item', { hasText: /^備註/ })
    .locator('textarea')
    .fill('先印證書再印信封');
  await dialog.locator('.ant-modal-footer button').last().click();
  await expect(page.getByText('WP-2026-0812-01 已更新').last()).toBeVisible();

  // 生管在所有工作包看到改後的值
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/work-packages');
  const planned = page.locator('tr.ant-table-row', { hasText: 'WP-2026-0812-01' }).first();
  await expect(planned).toContainText('先印證書再印信封');

  // 旗下任務的歷程記一筆編輯工作包（備註原值與新值、操作人劉阿海）
  await planned.getByLabel('展開行').click();
  await planned
    .locator('xpath=following-sibling::tr[1]')
    .locator('tr', { hasText: '證書四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  const drawer = page.locator('.ant-drawer-content:visible').last();
  const first = drawer.locator('.ant-timeline-item').first();
  await expect(first).toContainText('編輯工作包 WP-2026-0812-01');
  await expect(first).toContainText('先印證書再印信封');
  await expect(first).toContainText('劉阿海');
});
