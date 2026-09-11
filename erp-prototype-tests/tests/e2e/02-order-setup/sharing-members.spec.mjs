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
// 已由 06 章覆蓋的部分（不重寫）：改派負責業務時「離職交接清空分享成員 vs 長假代理保留」的
// 完整處置，見 tests/e2e/06-work-order-draft/order-reassign-reason.spec.mjs（6.5）——
// 該測試已驗過分享頁籤標題帶成員數（分享（0）／分享（1））與訂單負責業務不因改派而變動的呈現方式。
// 本測試只補 6.5 沒涵蓋的兩件事：新增／移除分享成員本身、以及被分享者代為操作時活動紀錄歸實際操作者。
test('2.10 分享成員代為操作，活動紀錄歸實際操作者（商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(90_000);
  // 起點：鏈二 ORD-2026-0710，預置分享成員張惠雯一位
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0710');
  await expect(page.locator('body')).toContainText('分享（1）');
  await openTab(page, '分享');
  await expect(page.locator('body')).toContainText('張惠雯');

  // 新增一位分享成員（候選排除負責業務洪嘉駿與既有成員張惠雯）
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

  // 訂單負責業務全程不變
  await openTab(page, '資訊');
  await expect(page.locator('body')).toContainText('洪嘉駿');

  // 以被分享者（張惠雯，模擬角色「諮詢」）身分對這張訂單做一次編輯：改交貨備註
  await switchRole(page, '諮詢');
  await button(panelSection(page, '訂單備註'), '編輯').click();
  const notePanel = drawer(page);
  await notePanel.locator('textarea').nth(1).fill('2.10 分享成員代操作：改交貨備註');
  await button(notePanel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();

  // 活動紀錄的操作者歸實際操作者（張惠雯），不是訂單負責業務洪嘉駿
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '編輯訂單備註')).toHaveCount(1);
  await expect(page.locator('.ant-timeline-item-content').first()).toContainText('張惠雯');
});
