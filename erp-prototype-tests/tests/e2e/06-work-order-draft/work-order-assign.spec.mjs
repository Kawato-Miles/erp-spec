import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import { pickOption, openByNo, dialog, openTab, button, openScenario } from './_local-helpers.mjs';

test('6.2 印務主管把草稿工單指派給負責印務與審核主管（原編號 46）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/work-orders', { openAs, switchRole });
  await openByNo(page, 'WO-2026-0905');

  // 未分派時頁首出現提示，基本資料顯示尚未分派與尚未指定
  await expect(page.locator('body')).toContainText('本工單尚未分派主責印務');
  await expect(page.locator('body')).toContainText('尚未分派');
  await page.getByText('查看工單資訊').click();
  await expect(page.locator('.ant-collapse-content-active')).toContainText('尚未指定');

  await button(page, '分派').click();
  const modal = dialog(page);
  await expect(modal).toContainText('分派工單');
  await pickOption(page, modal.locator('.ant-select').nth(0), '周建宏');
  await pickOption(page, modal.locator('.ant-select').nth(1), '吳國豪');
  await button(modal, '分派').click();

  // 分派後提示帶出兩人名，按鈕改為「改派」，頁首提示消失
  await expect(page.locator('body')).toContainText('已分派給 周建宏，審核主管 吳國豪');
  await expect(button(page, '改派')).toBeVisible();
  await expect(button(page, '分派')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('本工單尚未分派主責印務');

  // 其他角色看不到分派按鈕
  await switchRole(page, '印務');
  await expect(button(page, '改派')).toHaveCount(0);
  await expect(button(page, '分派')).toHaveCount(0);
});

// fixme：異動紀錄那一筆只寫得出新負責人與操作人，寫不出原負責人。
// 預期（情境 6.3）＝異動紀錄含原負責人、新負責人與操作人；
// 實際＝異動內容為「改派負責人為 蔡明修（工作負荷平衡）」、發起人吳國豪，全列不含原負責人周建宏。
test.fixme('6.3 改派留痕，製作中的工單照樣改得動（原編號 47）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/work-orders', { openAs, switchRole });
  await openByNo(page, 'WO-2026-0904');
  await expect(page.locator('body')).toContainText('周建宏');

  await button(page, '改派').click();
  const modal = dialog(page);
  await expect(modal).toContainText('改派工單');
  await pickOption(page, modal.locator('.ant-select').nth(0), '蔡明修');
  await pickOption(page, modal.locator('.ant-select').nth(2), '工作負荷平衡');
  await button(modal, '改派').click();
  await expect(page.locator('body')).toContainText('已改派給 蔡明修（工作負荷平衡），異動紀錄已留痕');

  // 異動紀錄新增一筆「主責印務改派」，含原負責人、新負責人與操作人
  await openTab(page, '異動紀錄');
  const row = page.locator('tbody tr.ant-table-row').filter({ hasText: '主責印務改派' }).first();
  await expect(row).toContainText('改派');
  await expect(row).toContainText('蔡明修');
  await expect(row).toContainText('吳國豪');
  await expect(row).toContainText('周建宏');
});
