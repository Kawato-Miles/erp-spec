import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import {
  cjkName,
  gotoInAppStable,
  switchRoleReliable,
  waitModalsClosed,
} from './_page-helpers.mjs';

// 開發伺服器首次編譯各路由要數秒，測試逾時放寬
test.describe.configure({ timeout: 120_000 });

// 第八章 8.5：交付產線 → 生管派工 → 師傅報工 → 成本對照與製作進度一路帶到底
test('8.5 交付產線後的欄位一路帶到現場報工（原編號 112）', async ({ page }) => {
  // 一、印務全選任務交付產線
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0908');
  await page.locator('thead').first().getByRole('checkbox').check();
  await page.getByRole('button', { name: /交付產線（3）/ }).click();
  await page
    .locator('.ant-modal')
    .filter({ hasText: '交付產線（3）' })
    .last()
    .getByRole('button', { name: /交付產線/ })
    .click();
  await expect(page.getByText('已交付產線 3 個生產任務').first()).toBeVisible();
  await waitModalsClosed(page);

  // 二、生管在生產任務管理頁把任務指派給師傅
  await switchRoleReliable(page, '生管');
  await gotoInAppStable(page, '/production-floor/dispatch');
  const pendingRows = page.locator('tbody.ant-table-tbody > tr.ant-table-row', {
    hasText: 'WO-2026-0908',
  });
  await expect(pendingRows).toHaveCount(3);
  for (let i = 0; i < 3; i += 1) await pendingRows.nth(i).getByRole('checkbox').check();
  await page.getByRole('button', { name: /派工（3）/ }).click();
  const dispatchDialog = page.locator('.ant-modal').filter({ hasText: '派工內容（3）' }).last();
  await dispatchDialog.locator('.ant-select').first().click();
  await page.getByTitle('劉阿海', { exact: true }).click();
  await dispatchDialog.getByRole('button', { name: cjkName('確認派工') }).click();
  await expect(page.getByText(/已建立工作包 .*，指派 劉阿海/)).toBeVisible();
  await waitModalsClosed(page);

  // 三、師傅報工：印刷任務的前置（備料）尚未轉交到料，整批被擋下；備料任務照實收
  await switchRoleReliable(page, '師傅');
  await gotoInAppStable(page, '/production-floor/work-packages');
  await page.getByRole('button', { name: '報工' }).first().click();
  const reportDialog = page.locator('.ant-modal').filter({ hasText: '生產數量' }).last();

  // 報工表格只顯示目標數量與已報數量（沒有其他累計欄）
  const reportHeaders = reportDialog.locator('thead th');
  await expect(reportHeaders.filter({ hasText: '目標數量' })).toHaveCount(1);
  await expect(reportHeaders.filter({ hasText: '已報數量' })).toHaveCount(1);

  const printRow = reportDialog.locator('tbody tr').filter({ hasText: '名片雙面四色印刷' }).first();
  await printRow.locator('.ant-input-number-input').nth(0).fill('100');
  await printRow.locator('.ant-input-number-input').nth(1).fill('100');
  await reportDialog.getByRole('button', { name: cjkName('送出報工') }).click();
  await expect(page.getByText(/有 1 筆檢核未通過，整批未送出/)).toBeVisible();
  await expect(printRow).toContainText('前置尚未到料');
  await printRow.locator('.ant-input-number-input').nth(0).fill('0');
  await printRow.locator('.ant-input-number-input').nth(1).fill('0');

  // 備料任務（目標數量 628）報 700：累計超過目標照實收、不阻擋也不提示
  const materialRow = reportDialog
    .locator('tbody tr')
    .filter({ hasText: '一級卡 300g 名片八開' })
    .first();
  await expect(materialRow).toContainText('628');
  await materialRow.locator('.ant-input-number-input').nth(0).fill('700');
  await materialRow.locator('.ant-input-number-input').nth(1).fill('700');
  await reportDialog.getByRole('button', { name: cjkName('送出報工') }).click();
  await expect(page.getByText('已送出 1 筆報工')).toBeVisible();
  await waitModalsClosed(page);

  // 已報數量累計 700（超過目標數量 628）照實收：任務因達標收於已完成，工作包進度隨即反映
  await expect(page.getByText('1 / 3')).toBeVisible();

  // 四、工單詳情的成本對照：實際成本由報工投入累計代入計價算式，不是四個 0
  await switchRoleReliable(page, '印務');
  await gotoInAppStable(page, '/work-orders');
  await page.getByText('WO-2026-0908', { exact: true }).first().click();
  await page.getByRole('tab', { name: '成本對照' }).click();
  const costRow = page.locator('tbody tr').filter({ hasText: '材料費' }).first();
  await expect(costRow).toBeVisible();
  const actual = await costRow.locator('td').nth(3).innerText();
  expect(actual).not.toBe('NT$ 0');
  expect(Number(actual.replace(/[^0-9]/g, ''))).toBeGreaterThan(0);

  // 五、工作包側板看得到這筆報工紀錄
  await switchRoleReliable(page, '生管');
  await gotoInAppStable(page, '/production-floor/work-packages');
  await page.getByText(/^WP-/).first().click();
  const drawer = page.locator('.ant-drawer').last();
  await expect(drawer.getByText(/報工紀錄（1）/)).toBeVisible();
  await expect(drawer.getByText('劉阿海').first()).toBeVisible();
  // 這筆報工照實記 700（目標數量 628），沒有被夾回目標值
  await expect(
    drawer.locator('.ant-table-tbody > tr.ant-table-row').first(),
  ).toContainText('700');
  await drawer.getByRole('button', { name: /Close|關閉/ }).first().click();

  // 六、印件詳情的製作進度：齊套完成數取各計入完成度工序的最慢者
  //（本鏈只報得動備料，計入完成度的「名片裁切分盒」尚未有產出，故齊套完成數仍為 0）
  await switchRoleReliable(page, '印務');
  await gotoInAppStable(page, '/print-items');
  // 印件總覽點的是印件名稱（印件編號欄為純文字），故取該列的第一個連結
  await page
    .locator('tbody.ant-table-tbody > tr.ant-table-row', { hasText: 'PI-2026-0801' })
    .first()
    .locator('a.ant-typography')
    .first()
    .click();
  await expect(page.getByText('製作進度（齊套完成數／購買數量）')).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('0 / 123')).toBeVisible();
});
