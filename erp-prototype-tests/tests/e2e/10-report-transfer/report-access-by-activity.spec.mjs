import { test, expect } from '@playwright/test';
import { openAs, switchRole, taskRows } from '../_helpers.mjs';

// 情境目錄 10.62（2026-10-19 新增，單據權責修正第四批）：工單詳情的報工入口依工單編輯權——
// 負責印務、被分享（編輯）成員、印務主管（全公司）；沒有編輯權的人沒有報工入口。
// 修正與作廢的畫面驗證在 tests/e2e/14-query-ui/correction-entries.spec.mjs（14.32）；判定另見
// tests/unit/production-floor/report-access-by-activity.test.mjs（含編輯分享的業務、生管，檢視層級與印務不得報別人的工單）。
// 起點資料：鏈外 WO-2026-0812（製作中，負責印務周建宏，無分享成員）的信封四色印刷製作中、可報工。
test.setTimeout(180_000);

const rowOf = (page) => taskRows(page).filter({ hasText: '信封四色印刷' }).first();

test('10.62 工單詳情報工：負責印務與印務主管有報工入口，沒有編輯權的生管沒有', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0812');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('button', { name: /批次報工/ })).toBeVisible();
  await expect(rowOf(page).getByRole('button', { name: '報工', exact: true })).toHaveCount(1);

  // 印務主管不是負責人也不在分享成員：全公司，照樣有報工入口
  await switchRole(page, '印務主管');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('button', { name: /批次報工/ })).toBeVisible();
  await expect(rowOf(page).getByRole('button', { name: '報工', exact: true })).toHaveCount(1);

  // 生管許文傑看得到工單、不在分享成員內：沒有工單詳情的報工入口（現場報工走生產管理頁）
  await switchRole(page, '生管');
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0812' })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole('button', { name: /批次報工/ })).toHaveCount(0);
  await expect(rowOf(page).getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
});
