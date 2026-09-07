import { expect, test } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { cjkName, openWorkOrderFromList, switchRoleReliable, taskRow } from './_page-helpers.mjs';

// 開發伺服器首次編譯各路由要數秒，測試逾時放寬
test.describe.configure({ timeout: 120_000 });

// 第八章 製程審核與交付產線：送審、核可、退回（8.1／8.2／8.4／8.9）

// 開生產任務編輯對話框並切換「計入完成度」（數量與放損頁籤）
async function toggleCountInCompletion(page, taskName, on) {
  await taskRow(page, taskName).getByRole('button', { name: cjkName('編輯') }).click();
  await page.getByRole('tab', { name: /數量與放損/ }).click();
  const dialog = page.locator('.ant-modal').filter({ hasText: '計入完成度' }).last();
  const toggle = dialog
    .locator('.ant-form-item')
    .filter({ hasText: '計入完成度' })
    .first()
    .getByRole('switch');
  if ((await toggle.getAttribute('aria-checked')) !== String(on)) await toggle.click();
  await dialog.getByRole('button', { name: cjkName('儲存') }).click();
  await expect(page.getByText('已更新生產任務').first()).toBeVisible();
}

test('8.1 印務把工單製程送印務主管審核（原編號 3）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0901');
  // 前置：確認整張工單至少有一筆任務計入完成度（mock 現況為「三摺加工」已計入），否則會被 8.9 的防呆擋下
  await expect(page.getByRole('heading', { level: 4, name: 'WO-2026-0901' })).toBeVisible();

  await page.getByRole('button', { name: '提交審核' }).click();

  await expect(page.getByText('已提交印務主管審核')).toBeVisible();
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '提交審核' })).toHaveCount(0);
});

test('8.9 送審防呆：至少要有一筆任務計入完成度（原編號 172）', async ({ page }) => {
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0901');
  // 前置：mock 現況「三摺加工」已計入完成度，先取消勾選，還原情境目錄的起點（沒有任何任務計入完成度）
  await toggleCountInCompletion(page, '三摺加工', false);

  await page.getByRole('button', { name: '提交審核' }).click();
  await expect(page.getByText('至少一筆任務須計入完成度')).toBeVisible();
  await expect(page.getByText('草稿', { exact: true }).first()).toBeVisible();

  await toggleCountInCompletion(page, '三摺加工', true);
  await page.getByRole('button', { name: '提交審核' }).click();

  await expect(page.getByText('已提交印務主管審核')).toBeVisible();
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();
});

test('8.2 印務主管核可製程，外包任務同時自動產生派單（原編號 4）', async ({ page }) => {
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0906');

  await page.getByRole('button', { name: '核可製程' }).click();

  await expect(page.getByText(/外包任務已自動產生派單（初始未送）/)).toBeVisible();
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '核可製程' })).toHaveCount(0);

  // 全為自有工廠任務的 WO-2026-0907 核可時不出現派單那一句
  await openWorkOrderFromList(page, 'WO-2026-0907');
  await page.getByRole('button', { name: '核可製程' }).click();
  await expect(page.getByText('製程已核可', { exact: true })).toBeVisible();
  await expect(page.getByText(/自動產生派單/)).toHaveCount(0);
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();
});

test('8.4 印務主管在待審核工單列表逐列核可或退回（原編號 64）', async ({ page }) => {
  await openAs(page, '印務主管', '/work-orders/review-queue');

  // 只列製程確認中的工單，送審時間早者在前
  const rows = page.locator('tbody.ant-table-tbody > tr.ant-table-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('WO-2026-0906');
  await expect(rows.nth(0)).toContainText('2026-09-04 09:30');
  await expect(rows.nth(1)).toContainText('WO-2026-0907');
  await expect(rows.nth(1)).toContainText('2026-09-04 10:15');

  // 母表八欄
  const headers = page.locator('thead.ant-table-thead th');
  await expect(headers).toHaveCount(9); // 展開鍵一欄 ＋ 八欄
  for (const title of [
    '工單編號',
    '印件',
    '訂單',
    '送審印務',
    '送審時間',
    '目標數量',
    '預估成本',
    '操作',
  ]) {
    await expect(page.locator('thead.ant-table-thead th', { hasText: title }).first()).toBeVisible();
  }

  // 子表預設收合，展開兩張工單才看得到生產任務
  await expect(page.getByText('雪銅紙 150g 菊全')).toHaveCount(0);
  await rows.nth(0).locator('.ant-table-row-expand-icon').click();
  await rows.nth(1).locator('.ant-table-row-expand-icon').click();
  await expect(page.getByText('雪銅紙 150g 菊全').first()).toBeVisible();
  await expect(page.getByText('局部上光').first()).toBeVisible();

  // 核可 WO-2026-0906：確認框載明將自動產生的派單張數
  await page
    .locator('tr', { hasText: 'WO-2026-0906' })
    .first()
    .getByRole('button', { name: '審核通過' })
    .click();
  await expect(page.getByText(/外發任務將自動產生派單 1 張/)).toBeVisible();
  await page.getByRole('button', { name: cjkName('核可') }).click();
  await expect(page.getByText(/製程已核可/)).toBeVisible();
  await expect(page.getByText('WO-2026-0906')).toHaveCount(0);

  // 退回 WO-2026-0907：未填原因被擋下，填了才成立
  await page
    .locator('tr', { hasText: 'WO-2026-0907' })
    .first()
    .getByRole('button', { name: cjkName('退回') })
    .click();
  await page.getByRole('button', { name: cjkName('退回') }).last().click();
  await expect(page.getByText('請填寫退回原因')).toBeVisible();
  await page.getByPlaceholder('請填寫退回原因（必填）').fill('版面尺寸與客戶稿件不符，請重新確認');
  await page.getByRole('button', { name: cjkName('退回') }).last().click();
  await expect(page.getByText('已退回，工單轉「重新確認製程」')).toBeVisible();
  await expect(page.getByText('目前沒有待審核的製程')).toBeVisible();

  // 訂單欄呈現訂單編號（本頁兩張測試工單的訂單為輕量存根，未登記進訂單模組故不帶連結）
  // 非印務主管見無權檢視
  await switchRoleReliable(page, '印務');
  await expect(page.getByText('無權檢視待審核工單')).toBeVisible();
});
