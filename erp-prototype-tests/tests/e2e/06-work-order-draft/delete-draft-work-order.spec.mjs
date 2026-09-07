import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  pickOption,
  dialog,
  button,
  rowOf,
  goInApp,
  openScenario,
  openByNo,
  tooltipTextOf,
} from './_local-helpers.mjs';

// 展開列（母子表）中的工單子列
const subRow = (page, no) =>
  page.locator('.ant-table-expanded-row tbody tr.ant-table-row').filter({ hasText: no }).first();

test('6.9 沒人要的空草稿工單可以刪掉（原編號 62）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items/pending-assign', { openAs, switchRole });
  await rowOf(page, 'PI-2026-0904').locator('.ant-table-row-expand-icon').click();
  await expect(page.locator('.ant-table-expanded-row tbody tr.ant-table-row')).toHaveCount(2);

  // 對草稿工單按操作欄的刪除圖示並確認
  await subRow(page, 'WO-2026-0905').getByLabel('刪除').click();
  const confirm = dialog(page);
  await expect(confirm).toContainText('刪除空草稿工單');
  await expect(confirm).toContainText('印件印製狀態不會回退');
  await button(confirm, '確認').click();

  // 該印件旗下已無未指派工單，故自待分派印件頁移除（工單也跟著消失）
  await expect(rowOf(page, 'PI-2026-0904')).toHaveCount(0);

  // 印件列表仍列出這件印件，旗下只剩一張工單
  await goInApp(page, '/print-items', gotoInApp);
  await rowOf(page, 'PI-2026-0904').locator('.ant-table-row-expand-icon').click();
  await expect(page.locator('.ant-table-expanded-row tbody tr.ant-table-row')).toHaveCount(1);
  await expect(page.locator('.ant-table-expanded-row')).not.toContainText('WO-2026-0905');

  // 分派視窗內沒有刪除入口，刪除只在展開列
  await rowOf(page, 'PI-2026-0904').getByLabel('工單分派').click();
  const assignDialog = dialog(page);
  await expect(assignDialog).toContainText('工單清單（1）');
  await expect(assignDialog.getByLabel('刪除')).toHaveCount(0);
  await button(assignDialog, '取消').click();

  // 印件詳情頁的印製狀態仍為製程已確認
  await openByNo(page, '促銷立牌 A1', /\/print-items\/detail/);
  await expect(page.locator('body')).toContainText('製程已確認');
});

test('6.10 已有製程或已送審的工單不可刪（原編號 63）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items', { openAs, switchRole });
  await rowOf(page, 'PI-2026-0710').locator('.ant-table-row-expand-icon').click();

  // 非草稿工單的刪除鈕停用，提示講明只有草稿且尚未送審的工單可刪
  const deleteButton = subRow(page, 'WO-2026-0710').getByLabel('刪除');
  await expect(deleteButton).toBeDisabled();
  const tip = await tooltipTextOf(page, deleteButton.locator('..'));
  expect(tip).toMatch(/僅草稿且尚未送審的工單可刪除|此工單已有生產任務/);
});

test('6.11 工單的事實只有一份，兩頁看到的一定一樣（原編號 74）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items', { openAs, switchRole });
  await rowOf(page, 'PI-2026-0904').locator('.ant-table-row-expand-icon').click();
  await expect(page.locator('.ant-table-expanded-row tbody tr.ant-table-row')).toHaveCount(2);
  await expect(rowOf(page, 'PI-2026-0904')).toContainText('2');

  // 加開一張工單並指派給蔡明修
  await rowOf(page, 'PI-2026-0904').getByLabel('工單分派').click();
  const assignDialog = dialog(page);
  await button(assignDialog, '加開一張工單').click();
  await pickOption(page, rowOf(assignDialog, '送出後建立').locator('.ant-select').nth(0), '蔡明修');
  await button(assignDialog, '送出').click();

  // 展開列即時多一張草稿工單（資料讀自工單模組）
  await expect(page.locator('.ant-table-expanded-row tbody tr.ant-table-row')).toHaveCount(3);
  const created = page
    .locator('.ant-table-expanded-row tbody tr.ant-table-row')
    .filter({ hasText: '蔡明修' });
  await expect(created).toContainText('草稿');

  // 以負責印務篩選時，命中依據同樣是工單模組的即時狀態
  const ownerFilter = page.locator('.ant-col').filter({ hasText: '負責印務' }).locator('.ant-select');
  await pickOption(page, ownerFilter, '蔡明修');
  await expect(rowOf(page, 'PI-2026-0904')).toBeVisible();
  await page.getByText('清空篩選').click();

  // 刪除新工單：展開列即時少一張、工單數欄同步重算（清空篩選後展開狀態仍在，不重複點展開）
  if (!(await page.locator('.ant-table-expanded-row').first().isVisible().catch(() => false))) {
    await rowOf(page, 'PI-2026-0904').locator('.ant-table-row-expand-icon').click();
  }
  await created.getByLabel('刪除').click();
  await button(dialog(page), '確認').click();
  await expect(page.locator('.ant-table-expanded-row tbody tr.ant-table-row')).toHaveCount(2);
  // 工單數欄（展開鈕、印件名稱、印件編號、印件類型、印製狀態、審稿狀態之後的那一格）
  await expect(rowOf(page, 'PI-2026-0904').locator('td').nth(6)).toHaveText('2');

  // 刪除後同一個篩選條件不再命中這件印件
  await pickOption(page, ownerFilter, '蔡明修');
  await expect(rowOf(page, 'PI-2026-0904')).toHaveCount(0);
});
