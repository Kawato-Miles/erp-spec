import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  activityItem,
  button,
  completeReviewConditions0814,
  dialog,
  goInApp,
  openTab,
  orderHeader,
  rowOf,
  submitButton,
} from './_local.mjs';

// 情境 2.1：起點改為鏈外 ORD-2026-0814（草稿，交貨備註與收款條件備註為空、尚無收款項目），
// 業務先補齊送審條件才送審；核准當下系統再檢一次。依據 wiki [[訂單成立確認]]、[[收款項目規劃]]、[[訂單狀態]]。
const ORDER_NO = 'ORD-2026-0814';

test('2.1 訂單四步接力從草稿走到已回簽（原編號：商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(240_000);
  await openAs(page, '業務', `/orders/detail?id=${ORDER_NO}`);
  await expect(orderHeader(page)).toContainText('草稿');

  // 前置：補填交貨備註與收款條件備註，在收款項目區新增兩期（訂金 3,938、尾款 9,188）
  await completeReviewConditions0814(page);

  // 送審條件齊了才推進：四格備註皆有值、至少一期未取消的收款項目
  await expect(submitButton(page)).toBeEnabled();
  await submitButton(page).click();
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  // 球交給業務主管林雅婷：審核工作台預設篩選就是待業務主管審核
  await switchRole(page, '業務主管');
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  await expect(rowOf(page, ORDER_NO)).toBeVisible();
  await rowOf(page, ORDER_NO).getByRole('button').first().click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  await button(page, '核准訂單').click();
  await expect(orderHeader(page)).toContainText('審核通過');

  await switchRole(page, '業務');
  await button(page, '已送報價單').click();
  await expect(orderHeader(page)).toContainText('報價待回簽');

  await openTab(page, '訂單附件');
  await button(page, '上傳回簽檔案').click();
  await dialog(page).getByLabel('檔名').fill('2.1 青硯文具報價單回簽.pdf');
  await button(dialog(page), '上傳').click();
  // 首次於報價待回簽上傳回簽檔即推進為已回簽
  await dialog(page).getByRole('button', { name: '確認回簽' }).click();
  await expect(page.getByText('已確認回簽').last()).toBeVisible();

  // 回簽後落點由審稿段派生：三件印件都還沒交稿，落在稿件未上傳
  await expect(orderHeader(page)).toContainText('稿件未上傳');

  // 送審與核准各留一筆活動紀錄
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '送主管審核')).toHaveCount(1);
  await expect(activityItem(page, '核准訂單（成交條件審核）')).toHaveCount(1);

  // 該單已離開待業務主管審核（工作台篩選未變，列表不再列出）
  await switchRole(page, '業務主管');
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  await expect(rowOf(page, ORDER_NO)).toHaveCount(0);
});
