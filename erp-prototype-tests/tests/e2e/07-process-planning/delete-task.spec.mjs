import { test, expect } from '@playwright/test';
import { cjkName, openAs, switchRole, taskRows } from '../_helpers.mjs';
import { openWorkOrder } from './_ch07.mjs';

// 第七章 7.44（2026-10-14 新增）：印務刪掉規劃中不要的生產任務，被其他任務設為前置的任務擋下。
// 起點：鏈五 WO-2026-0901（草稿，負責印務周建宏）。任務前置鏈：雪銅紙 ← DM 四色雙面印刷 ← 裁切成型 ← 三摺加工。
// 跨工單前置的擋下只在純函式測試驗（tests/unit/work-orders/rules-delete-task.test.mjs）：
// 同印件兩張工單互為前置沒有現成 mock 資料，畫面上要先造資料才演得出來。
test.describe.configure({ timeout: 180_000 });

const deleteButtonOf = (page, taskName) =>
  taskRows(page).filter({ hasText: taskName }).getByRole('button', { name: '刪除' });

test('7.44 印務刪掉規劃中不要的生產任務，被其他任務設為前置的任務擋下', async ({ page }) => {
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await expect(taskRows(page)).toHaveCount(4);

  // DM 四色雙面印刷是裁切成型的前置：刪除被擋下並指出對方，任務列表不變
  await deleteButtonOf(page, 'DM 四色雙面印刷').click();
  await expect(page.getByText(/無法刪除：「裁切成型」 以本任務為前置相依/)).toBeVisible();
  await expect(taskRows(page)).toHaveCount(4);

  // 三摺加工沒有任務以它為前置：確認後自列表消失
  await deleteButtonOf(page, '三摺加工').click();
  const confirm = page.locator('.ant-modal-confirm:visible').last();
  await expect(confirm).toContainText('三摺加工');
  await confirm.getByRole('button', { name: cjkName('確認') }).click();
  await expect(page.getByText('已刪除生產任務')).toBeVisible();
  await expect(taskRows(page)).toHaveCount(3);
  await expect(taskRows(page).filter({ hasText: '三摺加工' })).toHaveCount(0);
  // 刪除不留已作廢的任務
  await expect(taskRows(page).filter({ hasText: '已作廢' })).toHaveCount(0);

  // 印務主管在草稿工單的每一列也有刪除鈕（協助刪除，全公司範圍）
  await switchRole(page, '印務主管');
  await expect(page.getByRole('heading', { name: 'WO-2026-0901' })).toBeVisible({ timeout: 20_000 });
  await expect(taskRows(page)).toHaveCount(3);
  await expect(taskRows(page).getByRole('button', { name: '刪除' })).toHaveCount(3);

  // 業務看不到刪除鈕
  await switchRole(page, '業務');
  await expect(page.getByRole('heading', { name: 'WO-2026-0901' })).toBeVisible({ timeout: 20_000 });
  await expect(taskRows(page)).toHaveCount(3);
  await expect(page.getByRole('button', { name: '刪除' })).toHaveCount(0);
});
