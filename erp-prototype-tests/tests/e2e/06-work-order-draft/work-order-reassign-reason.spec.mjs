import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { pickOption, openByNo, dialog, openTab, button, rowOf, reloadAs, goInApp, openScenario } from './_local-helpers.mjs';

test('6.4 工單改派要選理由分類，離職交接連同分享成員一起清空（原編號 189）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/work-orders', { openAs, switchRole });
  await openByNo(page, 'WO-2026-0901');
  await expect(page.locator('body')).toContainText('分享（1）');

  // 一、負責印務改為蔡明修、理由分類選離職交接、補述留空
  await button(page, '改派').click();
  let modal = dialog(page);
  await expect(modal).toContainText('改派理由分類（必選）');
  await pickOption(page, modal.locator('.ant-select').nth(0), '蔡明修');
  await pickOption(page, modal.locator('.ant-select').nth(2), '離職交接');
  await button(modal, '改派').click();
  await expect(page.locator('body')).toContainText(
    '已改派給 蔡明修（離職交接），異動紀錄已留痕；已清空分享成員 1 位',
  );

  // 異動內容同樣寫明清空幾位；這筆異動不需確認（留痕），不進生管的待確認佇列
  await openTab(page, '異動紀錄');
  let adjustment = rowOf(page, '主責印務改派');
  await expect(adjustment).toContainText('改派負責人為 蔡明修（離職交接），已清空分享成員 1 位');
  await expect(adjustment).toContainText('不需確認（留痕）');
  await expect(adjustment).not.toContainText('待生管確認');
  // 分享頁籤的成員數歸零
  await expect(page.locator('body')).toContainText('分享（0）');

  // 二、重整頁面（情境要求：模擬資料回到起點）後改選長假代理並填補述
  await reloadAs(page, '印務主管', switchRole);
  await expect(page.locator('body')).toContainText('分享（1）');
  await button(page, '改派').click();
  modal = dialog(page);
  await pickOption(page, modal.locator('.ant-select').nth(0), '蔡明修');
  await pickOption(page, modal.locator('.ant-select').nth(2), '長假代理');
  await modal.locator('textarea').fill('周先生 9/10 至 9/20 休長假');
  await button(modal, '改派').click();
  await expect(page.locator('body')).toContainText('已改派給 蔡明修（長假代理），異動紀錄已留痕');
  await expect(page.locator('body')).not.toContainText('已清空分享成員');

  await openTab(page, '異動紀錄');
  adjustment = rowOf(page, '改派負責人為 蔡明修（長假代理）');
  await expect(adjustment).toContainText('周先生 9/10 至 9/20 休長假');
  await expect(adjustment).toContainText('不需確認（留痕）');
  // 長假代理時分享成員保留
  await expect(page.locator('body')).toContainText('分享（1）');

  // 三、待分派印件頁的工單分派視窗：逐列的改派理由分類與補述
  await goInApp(page, '/print-items/pending-assign', gotoInApp);
  await rowOf(page, 'PI-2026-0904').getByLabel('工單分派').click();
  const assignDialog = dialog(page);
  await expect(assignDialog).toContainText('工單分派');
  await expect(assignDialog).toContainText('改派理由分類');
  await expect(assignDialog).toContainText('補述');
  // 首次分派的列（WO-2026-0905 尚未指派）在這兩欄顯示「—」
  const firstAssignRow = rowOf(assignDialog, 'WO-2026-0905');
  await expect(firstAssignRow).toContainText('—');

  const reassignRow = rowOf(assignDialog, 'WO-2026-0904');
  await pickOption(page, reassignRow.locator('.ant-select').nth(0), '蔡明修');
  // 還沒選理由時送出鈕停用並提示還有幾張未選
  await expect(assignDialog).toContainText('有 1 張改派的工單尚未選改派理由分類');
  await expect(button(assignDialog, '送出')).toBeDisabled();
  // 底部摘要句加註本次改派幾張
  await expect(assignDialog).toContainText('其中改派 1 張');

  await pickOption(page, reassignRow.locator('.ant-select').nth(1), '離職交接');
  await expect(button(assignDialog, '送出')).toBeEnabled();
});
