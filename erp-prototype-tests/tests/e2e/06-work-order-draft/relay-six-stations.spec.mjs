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

// 在生產任務表單內新增一筆任務：先在 BOM 選擇器挑一列帶入，再補印件部位、目的站點與數量
async function addProductionTask(page, { bomTab, keyword, part, destination, plannedQty, countIn }) {
  await button(page, '新增生產任務').click();
  const picker = dialog(page);
  await expect(picker).toContainText('選擇 BOM');
  if (bomTab !== '材料') await picker.locator('.ant-tabs-tab', { hasText: bomTab }).click();
  await picker.getByPlaceholder(`搜尋${bomTab}名稱`).fill(keyword);
  await picker.getByPlaceholder(`搜尋${bomTab}名稱`).press('Enter');
  await picker.locator('tbody tr.ant-table-row').first().click();
  await button(picker, '帶入').click();

  const form = dialog(page);
  await form.getByPlaceholder('例：書冊內頁').fill(part);
  await pickOption(page, form.locator('.ant-select').filter({ hasText: '選目的站點' }), destination);
  await form.locator('.ant-tabs-tab', { hasText: '數量與放損' }).click();
  const pane = form.locator('.ant-tabs-tabpane-active');
  // 計入完成度打開後，這一頁的第一個數字欄變成「每份工單需生產數量」，預計生產排在它後面
  if (countIn) await pane.locator('button[role="switch"]').first().click();
  await pane
    .locator('.ant-input-number-input')
    .nth(countIn ? 1 : 0)
    .fill(String(plannedQty));
  await button(form, '新增任務').click();
}

test('6.1 一件印件從放行到上產線的六站接力（原編號 72）', async ({ page }) => {
  test.setTimeout(300_000);

  // 第一站：訂單管理人在待確認製作細節佇列確認該印件
  await openScenario(page, '訂單管理人', '/orders/production-detail-queue', {
    openAs,
    switchRole,
  });
  await rowOf(page, 'PI-2026-0903').getByLabel('確認製作細節').click();
  const confirmModal = dialog(page);
  await expect(confirmModal).toContainText('確認後系統將建立一張空工單草稿');
  await button(confirmModal, '確認製作細節').click();
  const toast = await page.locator('.ant-message-notice-content').last().innerText();
  expect(toast).toContain('轉為「製程已確認」');
  const workOrderNo = toast.match(/WO-\d{4}-\d{4}/)[0];
  // 該印件離開佇列
  await expect(rowOf(page, 'PI-2026-0903')).toHaveCount(0);

  // 第二站：印務主管在印件列表展開該印件、點工單編號進詳情按分派
  await switchRole(page, '印務主管');
  await goInApp(page, '/print-items', gotoInApp);
  // 印件登記進印件總覽、印製狀態轉製程已確認
  await expect(rowOf(page, 'PI-2026-0903')).toContainText('製程已確認');
  await rowOf(page, 'PI-2026-0903').locator('.ant-table-row-expand-icon').click();
  await expect(page.locator('.ant-table-expanded-row')).toContainText(workOrderNo);
  await openByNo(page, workOrderNo);
  await button(page, '分派').click();
  const assignModal = dialog(page);
  await pickOption(page, assignModal.locator('.ant-select').nth(0), '周建宏');
  await pickOption(page, assignModal.locator('.ant-select').nth(1), '吳國豪');
  await button(assignModal, '分派').click();
  await expect(page.locator('body')).toContainText('已分派給 周建宏');

  // 第三站：印務在製程規劃新增材料任務與工序任務後提交審核
  await switchRole(page, '印務');
  await openTab(page, '製程規劃');
  await addProductionTask(page, {
    bomTab: '材料',
    keyword: '雪銅紙',
    part: '全張',
    destination: '海報印刷｜海德堡 SM102 四色機',
    plannedQty: 2000,
  });
  await addProductionTask(page, {
    bomTab: '工序',
    keyword: '裁切',
    part: '全張',
    destination: '品檢站',
    plannedQty: 2000,
    countIn: true,
  });
  await button(page, '提交審核').click();
  await expect(page.locator('body')).toContainText('已提交印務主管審核');

  // 第四站：印務主管在待審核工單列表核可製程
  await switchRole(page, '印務主管');
  await goInApp(page, '/work-orders/review-queue', gotoInApp);
  await rowOf(page, workOrderNo).getByLabel('審核通過').click();
  const approveModal = dialog(page);
  await expect(approveModal).toContainText('核可後工單轉「製程審核完成」');
  await button(approveModal, '核可').click();
  await expect(page.locator('body')).toContainText('製程已核可');

  // 第五站：印務全選任務交付產線
  await switchRole(page, '印務');
  await goInApp(page, '/work-orders', gotoInApp);
  await openByNo(page, workOrderNo);
  await openTab(page, '製程規劃');
  await page.locator('thead input[type="checkbox"]').first().check();
  await button(page, '交付產線（2）').click();
  const deliverModal = dialog(page);
  await button(deliverModal, '交付產線').click();
  // 兩則提示：任務進生管待派清單、印件印製狀態轉工單已交付
  await expect(page.locator('body')).toContainText('2 筆進生管待派清單');
  await expect(page.locator('body')).toContainText('印製狀態轉「工單已交付」');

  // 第六站：生管接收工作後指派師傅
  await switchRole(page, '生管');
  await goInApp(page, '/production-floor/dispatch', gotoInApp);
  const floorRow = rowOf(page, workOrderNo);
  // 待派清單該筆帶印件編號與印件預計交期
  await expect(floorRow).toContainText('PI-2026-0903');
  await expect(floorRow).toContainText('2026-09-30');
  await floorRow.getByLabel('接收工作').click();
  await expect(page.locator('body')).toContainText('已接收工作 1 筆生產任務');
  await expect(rowOf(page, workOrderNo)).toContainText('已接收');

  // 指派師傅：勾選該筆任務後派工
  await floorRow.locator('input[type="checkbox"]').first().check();
  await button(page, '派工（1）').click();
  const dispatchDialog = dialog(page);
  await pickOption(page, dispatchDialog.locator('.ant-select').first(), '劉阿海');
  await button(dispatchDialog, '確認派工').click();
  await expect(page.locator('body')).toContainText('指派 劉阿海');
});

// 6.12 起點：鏈六 ORD-2026-0903 旗下 PI-2026-0903（待確認製作細節、沒有工單），
// 與 6.1 同一件印件、獨立的一條測試（各條測試整頁載入即重置記憶體狀態，互不干擾）。
// 差別在入口：本條由印件詳情頁的頁首鈕確認，6.1 由待確認製作細節佇列頁確認，
// 驗證兩個入口共用同一套流程（見 orders/_lib/production-detail-actions.js）。
test('6.12 訂單管理人從印件詳情頁確認製作細節', async ({ page }) => {
  test.setTimeout(120_000);

  // 訂單管理人自訂單詳情訂單項目按「檢視印件」進印件詳情頁
  await openScenario(page, '訂單管理人', '/orders/detail?id=ORD-2026-0903&tab=printItems', {
    openAs,
    switchRole,
  });
  const itemRow = page.locator('tr', { hasText: 'PI-2026-0903' });
  await itemRow.getByRole('button', { name: '檢視印件' }).click();
  await expect(page).toHaveURL(/\/print-items\/detail\/?\?id=pi-2026-0903/i, { timeout: 20000 });

  // 標頭按「確認製作細節」並確認
  await button(page, '確認製作細節').click();
  const confirmModal = dialog(page);
  await expect(confirmModal).toContainText('確認後系統將建立一張空工單草稿');
  await button(confirmModal, '確認製作細節').click();
  const toast = await page.locator('.ant-message-notice-content').last().innerText();
  expect(toast).toContain('轉為「製程已確認」');
  const workOrderNo = toast.match(/WO-\d{4}-\d{4}/)[0];

  // 印製狀態格即時轉「製程已確認」
  await expect(page.locator('body')).toContainText('製程已確認');
  // 旗下工單頁籤即時多一張草稿
  await openTab(page, '工單與生產任務');
  await expect(page.locator('body')).toContainText(workOrderNo);

  // 該印件自待確認製作細節佇列消失（仍為訂單管理人身分）
  await goInApp(page, '/orders/production-detail-queue', gotoInApp);
  await expect(rowOf(page, 'PI-2026-0903')).toHaveCount(0);

  // 印務主管在待分派印件頁看得到它
  await switchRole(page, '印務主管');
  await goInApp(page, '/print-items/pending-assign', gotoInApp);
  await expect(rowOf(page, 'PI-2026-0903')).toBeVisible();
});
