import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { checkTasks, cjkName, taskRow } from './_page-helpers.mjs';

// 開發伺服器首次編譯各路由要數秒，測試逾時放寬
test.describe.configure({ timeout: 120_000 });

// 第八章 製程審核與交付產線：逐筆交付產線（8.3）與存成部件配方（8.10）

test('8.3 印務逐筆把生產任務交付產線（原編號 7）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0908');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible({
    timeout: 20_000,
  });

  // 先交付其中一筆：工單狀態不變、該筆標為已交付
  await checkTasks(page, ['一級卡 300g 名片八開']);
  await page.getByRole('button', { name: /交付產線（1）/ }).click();
  const firstConfirm = page.locator('.ant-modal').filter({ hasText: '交付產線（1）' }).last();
  await expect(firstConfirm).toContainText('自有工廠 1 筆：交付產線後進生管的待派任務清單。');
  await expect(firstConfirm).not.toContainText('工單轉「工單已交付」');
  await firstConfirm.getByRole('button', { name: /交付產線/ }).click();

  await expect(page.getByText('已交付產線 1 個生產任務').first()).toBeVisible();
  await expect(taskRow(page, '一級卡 300g 名片八開')).toContainText('已交付');
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();

  // 再把其餘全部交付：工單自動轉「工單已交付」，並提示印件與訂單的推進結果
  await checkTasks(page, ['名片雙面四色印刷', '名片裁切分盒']);
  await page.getByRole('button', { name: /交付產線（2）/ }).click();
  const secondConfirm = page.locator('.ant-modal').filter({ hasText: '交付產線（2）' }).last();
  await expect(secondConfirm).toContainText(
    '本工單全部生產任務將完成交付產線，工單轉「工單已交付」。',
  );
  await secondConfirm.getByRole('button', { name: /交付產線/ }).click();

  await expect(page.getByText('已交付產線 2 個生產任務').first()).toBeVisible();
  await expect(
    page.getByText(
      /印件「名片」印製狀態轉「工單已交付」；訂單仍有其他印件未到齊，狀態取最落後者不推進/,
    ),
  ).toBeVisible();
  await expect(page.getByText('工單已交付', { exact: true }).first()).toBeVisible();
});

test('8.10 印務把做過的工單沉澱成部件配方（原編號 45）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0908');

  await page.getByRole('button', { name: '存成部件配方' }).click({ timeout: 20_000 });
  const dialog = page.locator('.ant-modal').filter({ hasText: '存成部件配方' }).last();

  // 列出將寫入的工序段，以及不會寫入的欄位
  await expect(dialog.getByText(/將寫入配方的工序段（\d+ 段）/)).toBeVisible();
  await expect(dialog).toContainText(
    '不會寫入配方的欄位：目標數量、預計完成日、計畫設備、色數與特殊色、預估成本分項',
  );

  // 指定印件配方（改建立新印件配方）與部件名稱後確認
  await dialog.getByText('選現有印件配方').click();
  await page.getByTitle('建立新印件配方').click();
  await dialog.getByPlaceholder('例：吊牌鑰匙圈禮盒組').fill('青硯名片組');
  await dialog.getByPlaceholder('例：壓克力吊牌 50×80').fill('名片 90×54');
  await dialog.getByRole('button', { name: cjkName('確認建立') }).click();

  await expect(page.getByText(/已建立部件配方第 1 版/)).toBeVisible();

  // 同一部件已有生效配方時，提示將改版
  await page.getByRole('button', { name: '存成部件配方' }).click();
  const again = page.locator('.ant-modal').filter({ hasText: '存成部件配方' }).last();
  await again.getByPlaceholder('例：壓克力吊牌 50×80').fill('名片 90×54');
  await expect(again.getByText(/已有生效配方（第 1 版）.*將改版為第 2 版、舊版轉停用/)).toBeVisible();
  await expect(again.getByRole('button', { name: cjkName('確認並改版') })).toBeVisible();
});
