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
  openTab,
} from './_local-helpers.mjs';

// 6.13 交期一路留空時五個畫面照實留白、不當機
// 起點：鏈六 ORD-2026-0903 旗下 PI-2026-0903（預計出貨日留空、內部完成日同為空、尚無工單）。
// 印件的預計出貨日是選填，留空是常態不是特例（MOCK-DATA-CHAIN.md § 交期欄位）：
// 內部完成日與工單承接值一路同為空，沿途每一個要顯示交期的畫面都要照實留白、不得拋例外。
test('6.13 交期一路留空時五個畫面照實留白、不當機', async ({ page }) => {
  test.setTimeout(300_000);

  // 一、待確認製作細節佇列：該列的內部完成日欄照實留白
  await openScenario(page, '訂單管理人', '/orders/production-detail-queue', {
    openAs,
    switchRole,
  });
  const queueRow = rowOf(page, 'PI-2026-0903');
  await expect(queueRow).toBeVisible();
  await expect(queueRow).toContainText('-');
  // 頁面沒有因為空值當掉：佇列標題與該列都在
  await expect(page.getByText('秋季菜單摺頁 A4 對摺', { exact: true })).toBeVisible();

  await queueRow.getByLabel('確認製作細節').click();
  const confirmModal = dialog(page);
  await button(confirmModal, '確認製作細節').click();
  const toast = await page.locator('.ant-message-notice-content').last().innerText();
  const workOrderNo = toast.match(/WO-\d{4}-\d{4}/)[0];

  // 二、印務主管指派負責印務（工單要有負責人，印務才進得了製程規劃）
  await switchRole(page, '印務主管');
  await goInApp(page, '/print-items', gotoInApp);
  await rowOf(page, 'PI-2026-0903').locator('.ant-table-row-expand-icon').click();
  await openByNo(page, workOrderNo);
  await button(page, '分派').click();
  const assignModal = dialog(page);
  await pickOption(page, assignModal.locator('.ant-select').nth(0), '周建宏');
  await pickOption(page, assignModal.locator('.ant-select').nth(1), '吳國豪');
  await button(assignModal, '分派').click();
  await expect(page.locator('body')).toContainText('已分派給 周建宏');

  // 三、工單詳情摘要：內部完成日那一格照實留白
  const summaryCell = page
    .getByText('內部完成日', { exact: true })
    .first()
    .locator('xpath=ancestor::div[3]');
  await expect(summaryCell).toContainText('—');

  // 四、製程規劃：新增一筆生產任務後，清單上方寫明這張工單沒有交期基準，且不判任何超期
  await switchRole(page, '印務');
  await openTab(page, '製程規劃');
  await button(page, '新增生產任務').click();
  const picker = dialog(page);
  await expect(picker).toContainText('選擇 BOM');
  await picker.getByPlaceholder('搜尋材料名稱').fill('雪銅紙');
  await picker.getByPlaceholder('搜尋材料名稱').press('Enter');
  await picker.locator('tbody tr.ant-table-row').first().click();
  await button(picker, '帶入').click();
  const form = dialog(page);
  await form.getByPlaceholder('例：書冊內頁').fill('全張');
  await pickOption(
    page,
    form.locator('.ant-select').filter({ hasText: '選目的站點' }),
    '海報印刷｜海德堡 SM102 四色機',
  );
  // 預計完成日刻意填一個很晚的日期：沒有基準就不做比對，標籤與提示都不該出現
  const endDate = form.locator('.ant-form-item').filter({ hasText: '預計完成日' }).first().locator('input');
  await endDate.fill('2026-12-31');
  await page.keyboard.press('Enter');
  await form.locator('.ant-tabs-tab', { hasText: '數量與放損' }).click();
  await form.locator('.ant-tabs-tabpane-active').locator('.ant-input-number-input').first().fill('2000');
  await button(form, '新增任務').click();
  await expect(page.getByText('這張工單沒有交期基準')).toBeVisible();
  await expect(page.getByText('超出內部完成日')).toHaveCount(0);

  // 五、紙本工單表頭的交期欄照實留白，不擋列印（草稿工單走負責印務的送審前預覽，同一張列印單據頁）
  await button(page, '預覽工單').click();
  await expect(page).toHaveURL(/work-orders\/print/, { timeout: 40_000 });
  const dueRow = page.locator('table').first().locator('tr').filter({ hasText: '交期' }).first();
  await expect(dueRow).toContainText('—');

  // 六、工單列表該列的內部完成日欄照實留白
  await goInApp(page, '/work-orders', gotoInApp);
  const search = page.getByPlaceholder('請輸入工單編號、印件名稱／編號，或客戶名稱');
  await search.fill(workOrderNo);
  await search.press('Enter');
  await expect(rowOf(page, workOrderNo)).toContainText('—');
});
