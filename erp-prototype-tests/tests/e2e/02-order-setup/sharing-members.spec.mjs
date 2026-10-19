import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import {
  activityItem,
  button,
  dialog,
  drawer,
  openByNo,
  openScenario,
  openTab,
  panelSection,
  pickOption,
} from './_local.mjs';

// 情境目錄 2.10：分享成員代為操作，活動紀錄歸實際操作者。
// 已由 06 章覆蓋的部分（不重寫）：改派接單業務時「離職交接清空分享成員 vs 長假代理保留」的
// 完整處置，見 tests/e2e/06-work-order-draft/order-reassign-reason.spec.mjs（6.5）——
// 該測試已驗過分享頁籤標題帶成員數（分享（0）／分享（1））與訂單接單業務不因改派而變動的呈現方式。
// 本測試只補 6.5 沒涵蓋的兩件事：新增／移除分享成員本身、以及編輯（代理）層級的被分享者代為操作時活動紀錄歸實際操作者。
// 檢視層級的被分享者沒有任何修改入口，見本檔 14.43。
test('2.10 分享成員代為操作，活動紀錄歸實際操作者（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈二 ORD-2026-0710，預置分享成員張惠雯一位
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0710');
  await expect(page.locator('body')).toContainText('分享（1）');
  await openTab(page, '分享');
  await expect(page.locator('body')).toContainText('張惠雯');

  // 新增一位分享成員（候選排除接單業務洪嘉駿與既有成員張惠雯）
  await button(page, '新增分享成員').click();
  const addPanel = dialog(page);
  await pickOption(page, addPanel.locator('.ant-select').nth(0), '李志豪');
  await button(addPanel, '新增').click();
  await expect(page.getByText('已新增分享成員').last()).toBeVisible();
  await expect(page.locator('body')).toContainText('分享（2）');

  // 移除剛新增的那一位：先定位含「李志豪」文字節點最近的一顆「移除」按鈕
  const newMemberRow = page.getByText('李志豪', { exact: true }).locator('xpath=ancestor::div[contains(@class,"ant-flex")][1]');
  await button(newMemberRow, '移除').click();
  // Popconfirm 的確定鈕（okText 同為「移除」）浮出於觸發按鈕旁，取最新出現的那顆
  await button(page, '移除').last().click();
  await expect(page.getByText('已移除分享成員').last()).toBeVisible();
  await expect(page.locator('body')).toContainText('分享（1）');

  // 訂單接單業務全程不變
  await openTab(page, '資訊');
  await expect(page.locator('body')).toContainText('洪嘉駿');

  // 授予編輯（代理）層級：接單業務把這張訂單以編輯層級分享給諮詢乙蘇怡君（單據權責修正：代為操作要看層級）
  await openTab(page, '分享');
  await button(page, '新增分享成員').click();
  const editPanel = dialog(page);
  await pickOption(page, editPanel.locator('.ant-select').nth(0), '蘇怡君');
  await pickOption(page, editPanel.locator('.ant-select').nth(1), '編輯（代理）');
  await button(editPanel, '新增').click();
  await expect(page.getByText('已新增分享成員').last()).toBeVisible();
  await openTab(page, '資訊');

  // 以編輯層級的被分享者（蘇怡君，模擬角色「諮詢乙」）身分對這張訂單做一次編輯：改交貨備註
  await switchRole(page, '諮詢（蘇怡君）');
  await button(panelSection(page, '訂單備註'), '編輯').click();
  const notePanel = drawer(page);
  await notePanel.locator('textarea').nth(1).fill('2.10 分享成員代操作：改交貨備註');
  await button(notePanel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();

  // 活動紀錄的操作者歸實際操作者（蘇怡君），不是訂單接單業務洪嘉駿
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '編輯訂單備註')).toHaveCount(1);
  await expect(page.locator('.ant-timeline-item-content').first()).toContainText('蘇怡君');
});

test('14.43 訂單的檢視層級分享成員看得到訂單內容，沒有任何修改入口', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈二 ORD-2026-0710（製作中），分享成員張惠雯為檢視層級
  await openScenario(page, '諮詢', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0710');
  await expect(page.locator('body')).toContainText('ORD-2026-0710');

  // 資訊頁籤：訂單資訊、訂單備註、發票與收款三塊的編輯鈕都沒有；頁首沒有取消訂單、推進狀態
  await openTab(page, '資訊');
  await expect(page.locator('body')).toContainText('洪嘉駿');
  for (const section of ['訂單資訊', '訂單備註', '發票與收款']) {
    await expect(button(panelSection(page, section), '編輯'), `${section} 編輯鈕`).toHaveCount(0);
  }
  await expect(button(page, '取消訂單')).toHaveCount(0);
  await expect(button(page, '推進狀態')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '改派' })).toHaveCount(0);

  // 訂單項目頁籤：沒有新增印件、新增項目、討論串，印件列沒有取消製作
  await openTab(page, '訂單項目');
  await expect(button(page, '新增印件')).toHaveCount(0);
  await expect(button(page, '新增項目')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '取消製作' })).toHaveCount(0);

  // 出貨單頁籤沒有建立出貨單草稿；分享頁籤沒有新增分享成員
  await openTab(page, '出貨單');
  await expect(page.getByRole('button', { name: '建立出貨單草稿' })).toHaveCount(0);
  await openTab(page, '分享');
  await expect(button(page, '新增分享成員')).toHaveCount(0);
});
