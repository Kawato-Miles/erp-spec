import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';
import { openWorkOrderFromList } from '../08-process-review-deliver/_page-helpers.mjs';

// 情境目錄 9.14：生產任務的指派師傅取自所屬工作包，唯讀（Miles 2026-10-06 拍板）。

/** 展開工單詳情生產任務表的某一筆任務，回傳展開列 */
async function expandTask(page, taskName) {
  const row = page
    .locator('.ant-table-tbody tr.ant-table-row:not(.ant-table-expanded-row)', { hasText: taskName })
    .first();
  const expand = row.locator('.ant-table-row-expand-icon');
  if ((await expand.getAttribute('class'))?.includes('collapsed')) await expand.click();
  return page.locator('tr.ant-table-expanded-row', { hasText: '指派師傅' }).filter({ hasText: '歷程（' }).last();
}

const valueOf = (scope, label) =>
  scope
    .locator(`xpath=.//span[normalize-space(.)="${label}"]/ancestor::th[1]/following-sibling::td[1]`)
    .first();

test('9.14 生產任務的指派師傅取自所屬工作包，唯讀', async ({ page }) => {
  test.setTimeout(120_000);
  await openAs(page, '印務主管', '/work-orders');

  // 已打包：海報四色印刷屬 WP-2026-0710-01，指派師傅劉阿海
  await openWorkOrderFromList(page, 'WO-2026-0710');
  const poster = await expandTask(page, '海報四色印刷');
  await expect(valueOf(poster, '指派師傅')).toHaveText('劉阿海');

  // 未打包：證書裁切尚未派工，指派師傅為「－」
  await openWorkOrderFromList(page, 'WO-2026-0812');
  const cut = await expandTask(page, '證書裁切');
  await expect(valueOf(cut, '指派師傅')).toHaveText('－');

  // 生產管理沒有調整師傅的入口
  await gotoInApp(page, '/production-floor/dispatch');
  await expect(page.getByRole('button', { name: /調整師傅/ })).toHaveCount(0);
  await expect(page.getByText('調整師傅')).toHaveCount(0);
});
