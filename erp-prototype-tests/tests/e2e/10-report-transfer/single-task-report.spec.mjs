import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';

// 情境目錄 10.18：師傅對單一任務報工。
// 起點資料：鏈二 WP-2026-0710-01（指派師傅劉阿海）的「海報四色印刷」（製作中、目標 3,090、
// 已報 2,000、無未到料前置）與「雪銅紙 150g 備料」（已完成）。
// 單筆與整批共用同一顆對話框：共用資訊區照樣帶工作包編號、指派師傅與預計完成日，
// 表格只有被點的那一筆任務。

test('10.18 師傅對單一任務報工', async ({ page }) => {
  await openAs(page, '師傅', '/production-floor/work-packages');
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-01' });
  await pkgRow.getByLabel('展開行').click();
  const subTable = pkgRow.locator('xpath=following-sibling::tr[1]');

  // 已完成的任務沒有報工入口（補報一律走印務入口）
  const prepRow = subTable.locator('tr', { hasText: '雪銅紙 150g 備料' }).first();
  await expect(prepRow.getByRole('button', { name: '報工' })).toHaveCount(0);

  // 製作中且前置已到料的任務，該列自己有一顆報工
  const printRow = subTable.locator('tr', { hasText: '海報四色印刷' }).first();
  await expect(printRow).toContainText('2,000 / 3,090');
  await printRow.getByRole('button', { name: '報工' }).click();

  const dialog = page.locator('.ant-modal-body');
  // 共用資訊區（工作包編號／指派師傅／預計完成日）與整批報工完全一樣
  await expect(dialog).toContainText('WP-2026-0710-01');
  await expect(dialog).toContainText('劉阿海');
  // 表格只帶這一筆任務
  const rows = dialog.locator('tbody tr.ant-table-row');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('海報四色印刷');
  await expect(rows.first()).toContainText('3,090'); // 目標數量
  await expect(rows.first()).toContainText('2,000'); // 已報數量

  const inputs = rows.first().locator('input');
  await inputs.nth(0).fill('500'); // 生產數量（投入）
  await inputs.nth(1).fill('500'); // 良品
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();

  // 該任務的報工進度即時更新（產出 2,500／目標 3,090）
  await expect(
    pkgRow
      .locator('xpath=following-sibling::tr[1]')
      .locator('tr', { hasText: '海報四色印刷' })
      .first(),
  ).toContainText('2,500 / 3,090');
});
