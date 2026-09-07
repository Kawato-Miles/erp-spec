import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  pickOption,
  dialog,
  button,
  rowOf,
  goInApp,
  openScenario,
  activityItem,
  openByNo,
  tooltipTextOf,
} from './_local-helpers.mjs';

// fixme：待分派印件頁與印件列表都沒有「分派狀態」欄。
// 預期（情境 6.6）＝待分派印件頁標「缺 1 張未指派（共 2 張）」、送出後印件列表標「已分派齊」；
// 實際＝兩頁的欄位為印件名稱／編號／類型／印製狀態／審稿狀態／工單數／客戶／訂單編號／購買數量／交期／操作，
// 分派缺口只用來決定印件列不列進待分派頁（derivePrintItemAssignment），畫面上沒有這一欄。
test.fixme('6.6 待分派印件頁只列還缺人的印件，派齊就消失（原編號 48）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items/pending-assign', { openAs, switchRole });

  // 只列旗下有工單未指派的印件；已派齊的鏈一印件不在列上
  await expect(rowOf(page, 'PI-2026-0904')).toBeVisible();
  await expect(page.locator('tbody')).not.toContainText('PI-2026-0601');
  // 分派狀態欄標「缺 N 張未指派（共 M 張）」
  await expect(rowOf(page, 'PI-2026-0904')).toContainText('缺 1 張未指派（共 2 張）');
  // 品質帳四欄與分派狀態篩選在本頁不出現
  await expect(page.locator('thead')).not.toContainText('完工良品數');
  await expect(page.locator('thead')).not.toContainText('不通過累計');
  await expect(page.locator('thead')).not.toContainText('已出貨');
  await expect(page.locator('thead')).not.toContainText('可出貨額度');
  await expect(page.locator('body')).not.toContainText('分派狀態');

  // 把 WO-2026-0905 指派給印務後送出
  await rowOf(page, 'PI-2026-0904').getByLabel('工單分派').click();
  const assignDialog = dialog(page);
  await pickOption(page, rowOf(assignDialog, 'WO-2026-0905').locator('.ant-select').nth(0), '蔡明修');
  await button(assignDialog, '送出').click();

  // 該印件從待分派印件頁消失，且不彈成功提示
  await expect(rowOf(page, 'PI-2026-0904')).toHaveCount(0);
  await expect(page.locator('.ant-message-success')).toHaveCount(0);

  // 印件列表仍列出它並標已分派齊
  await goInApp(page, '/print-items', gotoInApp);
  await expect(rowOf(page, 'PI-2026-0904')).toContainText('已分派齊');
  // 兩頁的訂單編號都可點開訂單詳情
  await openByNo(page, 'ORD-2026-0904');
  await expect(page).toHaveURL(/\/orders\/detail/);

  // 側欄的「待分派印件」只有印務主管看得到
  await switchRole(page, '印務');
  await expect(page.locator('.ant-menu-item', { hasText: '待分派印件' })).toHaveCount(0);
});

test('6.7 印務主管以印件為單位一次派完，缺工單就當場加開（原編號 60）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items/pending-assign', { openAs, switchRole });
  await rowOf(page, 'PI-2026-0904').getByLabel('工單分派').click();
  const assignDialog = dialog(page);

  // 審核主管預帶自己（吳國豪）、WO-2026-0904 預填周建宏、WO-2026-0905 尚未指派
  await expect(assignDialog).toContainText('吳國豪');
  await expect(assignDialog).toContainText('工單清單（2）');
  await expect(rowOf(assignDialog, 'WO-2026-0904')).toContainText('周建宏');
  await expect(rowOf(assignDialog, 'WO-2026-0905')).toContainText('尚未指派');

  // 加開一張工單：出現預備列（送出後才建立）
  await button(assignDialog, '加開一張工單').click();
  await expect(assignDialog).toContainText('工單清單（3）');
  const draftRow = rowOf(assignDialog, '送出後建立');
  await expect(draftRow).toContainText('草稿（待建立）');
  await pickOption(page, draftRow.locator('.ant-select').nth(0), '蔡明修');
  // 移除該列：工單數回到兩張
  await draftRow.getByLabel('移除').click();
  await expect(assignDialog).toContainText('工單清單（2）');

  // 再加開一列並選印務、替 WO-2026-0905 選印務
  await button(assignDialog, '加開一張工單').click();
  await pickOption(
    page,
    rowOf(assignDialog, '送出後建立').locator('.ant-select').nth(0),
    '蔡明修',
  );
  await pickOption(
    page,
    rowOf(assignDialog, 'WO-2026-0905').locator('.ant-select').nth(0),
    '周建宏',
  );
  // 摘要句只算本次會改變負責印務的列，未改動的 WO-2026-0904 不計
  await expect(assignDialog).toContainText('本次將分派 2 張、加開 1 張');
  await expect(assignDialog).not.toContainText('仍有');
  await button(assignDialog, '送出').click();

  // 送出後不彈成功提示
  await expect(page.locator('.ant-message-success')).toHaveCount(0);

  // 新工單建立為草稿並帶負責印務與審核主管；預備列移除的那一張沒有被建立（共三張）
  await goInApp(page, '/print-items', gotoInApp);
  await rowOf(page, 'PI-2026-0904').locator('.ant-table-row-expand-icon').click();
  const subRows = page.locator('.ant-table-expanded-row tbody tr.ant-table-row');
  await expect(subRows).toHaveCount(3);
  const created = subRows.filter({ hasText: '蔡明修' });
  await expect(created).toHaveCount(1);
  await expect(created).toContainText('草稿');

  // 訂單活動紀錄留一筆加開工單，且移除的預備列不留紀錄
  await openByNo(page, 'ORD-2026-0904');
  await page.locator('.ant-tabs-tab', { hasText: '活動紀錄' }).first().click();
  await expect(activityItem(page, '加開工單')).toHaveCount(1);
});

test('6.8 印件已收尾就擋下加開工單（原編號 61）', async ({ page }) => {
  test.setTimeout(180_000);
  await openScenario(page, '印務主管', '/print-items', { openAs, switchRole });
  await rowOf(page, 'PI-2026-0601').getByLabel('工單分派').click();
  const assignDialog = dialog(page);

  // 加開按鈕停用，提示寫明不可再加開的原因與救濟路徑
  const addButton = button(assignDialog, '加開一張工單');
  await expect(addButton).toBeDisabled();
  const tip = await tooltipTextOf(page, addButton.locator('..'));
  expect(tip).toContain('印件印製狀態已為「已送達」，不可再加開工單');
  expect(tip).toContain('售後服務單決議補做');
});
