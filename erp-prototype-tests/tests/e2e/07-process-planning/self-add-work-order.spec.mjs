import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import { formField, openWorkOrder, pickBomRow, pickProductionLine, switchFormTab, taskForm } from './_ch07.mjs';

// 7.48（2026-10-19 新增，單據權責修正第七批）：印務在印件自行加開工單，負責人固定為加開者、不經分派；
// 工單審核主管由印務送製程審核時指定。印務主管加開工單維持既有分派流程。純函式判定另見 tests/unit/work-orders/self-add-work-order.test.mjs。
// 起點資料：錨例 PI-2026-0803 貼紙（製程已確認，旗下 WO-2026-0910 負責印務蔡明修）；周建宏不是該印件任何工單的負責人，
// 印務看全公司的印件（ACT-VPRD-005），所以列表照樣列這件；PI-2026-0901 旗下 WO-2026-0901 的負責印務是周建宏。
// 依據：工單產生與分派活動清單（ACT-WOA-009）、製程規劃活動清單（ACT-PLAN-018）、工單（建立來源、負責人、工單審核主管）。
test.describe.configure({ timeout: 300_000 });

const button = (scope, name) => scope.getByRole('button', { name });
const modalOf = (page) => page.locator('.ant-modal-content:visible').last();

async function chooseOption(page, select, label) {
  await expect(async () => {
    if (!(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').count())) await select.click();
    const option = page
      .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
      .last()
      .locator(`.ant-select-item-option[title="${label}"]`)
      .first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.click({ timeout: 3000 });
    await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0, { timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
}

const itemRow = async (page, printItemNo) => {
  const search = page.getByPlaceholder(/請輸入印件名稱／編號/);
  await search.fill(printItemNo);
  await search.press('Enter');
  const row = page.locator('tbody tr.ant-table-row').filter({ hasText: printItemNo }).first();
  await expect(row).toBeVisible();
  return row;
};

test('7.48 印務在印件列表自行加開工單：負責人是印務本人、沒有分派入口，送審時才選審核主管，印務主管的待審核佇列收得到', async ({ page }) => {
  // 起點：印務周建宏開印件列表搜 PI-2026-0803：列上有加開工單，沒有工單分派（分派是印務主管的動作）
  await openAs(page, '印務', '/print-items');
  const row = await itemRow(page, 'PI-2026-0803');
  await expect(button(row, '工單分派')).toHaveCount(0);
  await button(row, '加開工單').click();

  // 確認框寫明負責人固定為加開者；確認後出現新工單編號，旗下工單變兩張
  const confirm = modalOf(page);
  await expect(confirm).toContainText('負責印務為你');
  await button(confirm, '確認加開').click();
  const notice = page.locator('.ant-message-notice-content').filter({ hasText: /已加開工單/ }).last();
  await expect(notice).toBeVisible({ timeout: 15_000 });
  const newNo = (await notice.innerText()).match(/WO-\d{4}-\d{4}/)?.[0];
  expect(newNo, '提示帶出新工單編號').toBeTruthy();
  // 進印件詳情：工單頁籤旗下工單變兩張
  await button(row, '檢視詳情').click();
  await expect(page.getByRole('tab', { name: /工單與生產任務（2）/ })).toBeVisible({ timeout: 20_000 });

  // 工單列表（印務只列自己負責的）出現新工單：負責人是周建宏、沒有分派與改派入口
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, newNo);
  await expect(page.locator('body')).toContainText('周建宏');
  await expect(button(page, '分派')).toHaveCount(0);
  await expect(button(page, '改派')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('本工單尚未分派主責印務');

  // 規劃一筆計入完成度的任務，才過得了送審前的內容防呆
  await button(page, '新增生產任務').click();
  await pickBomRow(page, { tab: '工序', keyword: '平版印刷' });
  await formField(page, '印件部位').locator('input').fill('全張');
  await formField(page, '目的站點').locator('.ant-select').click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await switchFormTab(page, '數量與放損');
  const pane = taskForm(page).locator('.ant-tabs-tabpane-active');
  await pane.locator('button[role="switch"]').first().click(); // 計入完成度
  await pane.locator('.ant-input-number-input').nth(1).fill('500');
  await switchFormTab(page, '任務內容與排程');
  await pickProductionLine(page, '數位產線');
  await taskForm(page).getByRole('button', { name: '新增任務' }).click();
  await expect(taskForm(page)).toHaveCount(0);

  // 送審：要求選定工單審核主管；沒選就按送出，對話框不關、工單維持草稿
  await button(page, '提交審核').click();
  const pick = modalOf(page);
  await expect(pick).toContainText('工單審核主管');
  await button(pick, '送出審核').click();
  await expect(modalOf(page)).toContainText('工單審核主管');
  await expect(button(page, '提交審核')).toBeVisible();
  // 選吳國豪後送出：工單轉製程確認中
  await chooseOption(page, pick.locator('.ant-select').first(), '吳國豪');
  await button(pick, '送出審核').click();
  await expect(page.locator('body')).toContainText('已提交印務主管審核');
  await expect(button(page, '提交審核')).toHaveCount(0);

  // 球交給印務主管：待審核工單列表出現這張，印務主管不能再當它的加開者
  await switchRole(page, '印務主管');
  await gotoInApp(page, '/work-orders/review-queue');
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: newNo })).toBeVisible();
});

test('7.48 印件列表的列上：印務有加開工單（印件已送達則不出現）、沒有工單分派；印務主管有工單分派、沒有加開工單；業務沒有加開入口', async ({ page }) => {
  await openAs(page, '印務', '/print-items');
  let row = await itemRow(page, 'PI-2026-0901');
  await expect(button(row, '加開工單')).toHaveCount(1);
  await expect(button(row, '工單分派')).toHaveCount(0);
  // 印件已送達（PI-2026-0601）：加開工單整顆不出現，不是停用
  const delivered = await itemRow(page, 'PI-2026-0601');
  await expect(button(delivered, '加開工單')).toHaveCount(0);

  await switchRole(page, '印務主管');
  row = await itemRow(page, 'PI-2026-0901');
  await expect(button(row, '工單分派')).toHaveCount(1);
  await expect(button(row, '加開工單')).toHaveCount(0);

  await switchRole(page, '業務');
  row = await itemRow(page, 'PI-2026-0901');
  await expect(button(row, '加開工單')).toHaveCount(0);
  await expect(button(row, '工單分派')).toHaveCount(0);
});
