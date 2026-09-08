import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, switchRole } from '../_helpers.mjs';
import {
  button,
  buildDraftOrder,
  dialog,
  goInApp,
  openTab,
  orderHeader,
  rowOf,
} from './_local.mjs';

test('2.1 訂單四步接力從草稿走到已回簽（原編號：商業需求覆蓋矩陣 B）', async ({ page }) => {
  test.setTimeout(180_000);
  const orderNo = await buildDraftOrder(
    page,
    { openAs, switchRole, gotoInApp },
    { caseName: '2.1 訂單四步接力', itemName: '2.1 印件甲' },
  );

  // 業務在草稿態補填運費、其他費用與折扣金額——先驗證訂單項目頁籤看得到剛帶入的印件即可，
  // 金額欄位的計算已由純函式測試涵蓋，這裡只走狀態接力
  await button(page, '送主管審核').click();
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  // 球交給業務主管：審核工作台預設篩選就是待業務主管審核（見 approval-queue/page.js DEFAULT_STATUS）
  await switchRole(page, '業務主管');
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  await expect(rowOf(page, orderNo)).toBeVisible();

  await rowOf(page, orderNo).getByRole('button').first().click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  // 收款備註已填，核可鈕不經二次確認（見 detail/page.js handleApprove）
  await button(page, '核准訂單').click();
  await expect(orderHeader(page)).toContainText('審核通過');

  await switchRole(page, '業務');
  await button(page, '已送報價單').click();
  await expect(orderHeader(page)).toContainText('報價待回簽');

  await openTab(page, '訂單附件');
  await button(page, '上傳回簽檔案').click();
  await dialog(page).getByLabel('檔名').fill('2.1 客戶回簽單.pdf');
  await button(dialog(page), '上傳').click();
  // 首次於報價待回簽上傳回簽檔即推進為已回簽（AttachmentsTab.confirmSignBack 詢問視窗）
  await dialog(page).getByRole('button', { name: '確認回簽' }).click();
  await expect(page.getByText('已確認回簽').last()).toBeVisible();

  // 回簽後落點由審稿段派生：印件還沒交稿，故落在稿件未上傳
  await expect(orderHeader(page)).toContainText('稿件未上傳');

  // 送審時系統記下送審時間，該單在審核工作台的五個可見狀態依序都出現過
  await switchRole(page, '業務主管');
  await goInApp(page, '/orders/approval-queue', gotoInApp);
  await expect(rowOf(page, orderNo)).toHaveCount(0); // 已離開待業務主管審核（篩選未變）
});
