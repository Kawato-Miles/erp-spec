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

test('8.2 印務主管核可製程，工單轉製程審核完成（場內加工；原編號 4）', async ({ page }) => {
  // Miles 2026-09-22 裁決：外包派單暫不納入 prototype 情境，核可情境以全為自有工廠任務的
  // WO-2026-0907 為樣本。WO-2026-0906 專供排程硬擋情境（7.30／7.31：核可被擋、對話框列兩個日期）。
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0907');

  // 點「核可製程」先跳確認框（文字與元件同待審核工單列表的「審核通過」），確認後才核可
  await page.getByRole('button', { name: '核可製程' }).click();
  const confirmDialog = page.locator('.ant-modal-content').filter({ hasText: '核可後工單轉「製程審核完成」' });
  await expect(confirmDialog).toBeVisible();
  await expect(page.getByText('製程審核完成', { exact: true })).toHaveCount(0);
  // 取消不核可：工單留在製程確認中
  await confirmDialog.getByRole('button', { name: cjkName('取消') }).click();
  await expect(confirmDialog).toHaveCount(0);
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: '核可製程' }).click();
  await page.locator('.ant-modal-content').filter({ hasText: '核可後工單轉「製程審核完成」' })
    .getByRole('button', { name: cjkName('核可') }).click();
  await expect(page.getByText('製程已核可', { exact: true })).toBeVisible();
  await expect(page.getByText(/自動產生派單/)).toHaveCount(0);
  await expect(page.getByText('製程審核完成', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '核可製程' })).toHaveCount(0);
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

  // 母表十二欄（含印件內部完成日、工單預排完成日、確樣需求、顏色費用合計與預估成本合計）
  const headers = page.locator('thead.ant-table-thead th');
  await expect(headers).toHaveCount(13); // 展開鍵一欄 ＋ 十二欄
  for (const title of [
    '工單編號',
    '印件',
    '訂單',
    '送審印務',
    '印件內部完成日',
    '工單預排完成日',
    '確樣需求',
    '送審時間',
    '目標數量',
    '顏色費用合計',
    '預估成本合計',
    '操作',
  ]) {
    await expect(page.locator('thead.ant-table-thead th', { hasText: title }).first()).toBeVisible();
  }

  // WO-2026-0907 的顏色費用合計為 CMYK 四色的 1,520；預估成本合計為兩筆任務小計
  // 2,949 ＋ 5,054 ＝ 8,003 加上顏色費用 1,520 ＝ 9,523
  const anchorRow = rows.filter({ hasText: 'WO-2026-0907' }).first();
  await expect(anchorRow).toContainText('NT$ 1,520');
  await expect(anchorRow).toContainText('NT$ 9,523');

  // 子表預設收合，展開兩張工單才看得到生產任務
  await expect(page.getByText('雪銅紙 150g 菊全')).toHaveCount(0);
  await rows.nth(0).locator('.ant-table-row-expand-icon').click();
  await rows.nth(1).locator('.ant-table-row-expand-icon').click();
  await expect(page.getByText('雪銅紙 150g 菊全').first()).toBeVisible();
  await expect(page.getByText('局部上光').first()).toBeVisible();

  // 核可 WO-2026-0907（全為自有工廠任務、排程正常）：確認框不出現派單那一句
  // Miles 2026-09-22 裁決：外包派單暫不納入；WO-2026-0906 為排程硬擋樣本，其核可被擋的對話框見 7.31
  await page
    .locator('tr', { hasText: 'WO-2026-0907' })
    .first()
    .getByRole('button', { name: '審核通過' })
    .click();
  await expect(page.getByText(/自動產生派單/)).toHaveCount(0);
  await page.getByRole('button', { name: cjkName('核可') }).click();
  await expect(page.getByText(/製程已核可/)).toBeVisible();
  await expect(page.getByText('WO-2026-0907')).toHaveCount(0);

  // 退回 WO-2026-0906：未填原因被擋下，填了才成立
  await page
    .locator('tr', { hasText: 'WO-2026-0906' })
    .first()
    .getByRole('button', { name: cjkName('退回') })
    .click();
  await page.getByRole('button', { name: cjkName('退回') }).last().click();
  await expect(page.getByText('請填寫退回原因')).toBeVisible();
  await page.getByPlaceholder('請填寫退回原因（必填）').fill('局部上光排程晚於印件內部完成日，請重排');
  await page.getByRole('button', { name: cjkName('退回') }).last().click();
  await expect(page.getByText('已退回，工單轉「重新確認製程」')).toBeVisible();
  await expect(page.getByText('目前沒有待審核的製程')).toBeVisible();

  // 訂單欄呈現訂單編號（兩張測試工單的訂單已登記進訂單模組，故帶連結指向訂單詳情）
  // 非印務主管見無權檢視
  await switchRoleReliable(page, '印務');
  await expect(page.getByText('無權檢視待審核工單')).toBeVisible();
});

test('7.30 工單送出審核時被排程硬擋，Dialog 列出兩個日期與相差工作天數', async ({ page }) => {
  // 起點資料：鏈外 WO-2026-0906（製程確認中；印件內部完成日 2026-09-18、局部上光任務預計完成日 2026-09-24）
  // 製程確認中沒有送審入口，先由負責印務收回成草稿再送審；期望值取自 openspec work-order § 工單排程硬擋
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0906');
  await page.getByRole('button', { name: cjkName('收回') }).first().click();
  await page.getByPlaceholder('請填寫收回原因（必填）').fill('外包廠檔期要重排');
  await page.getByRole('button', { name: cjkName('收回') }).last().click();
  await expect(page.getByText('草稿', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: '提交審核' }).click();
  const dialog = page.locator('.ant-modal').filter({ hasText: '排程超過印件內部完成日，無法送出審核' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('工單預排完成日：2026-09-24');
  await expect(dialog).toContainText('印件內部完成日：2026-09-18');
  await expect(dialog).toContainText('相差：4 個工作天');
  await dialog.getByRole('button', { name: '知道了' }).click();
  // 擋下後工單維持草稿
  await expect(page.getByText('製程確認中', { exact: true })).toHaveCount(0);
});

test('7.31 核可時再判一次硬擋，擋下不產生派單、工單留在待審核列表', async ({ page }) => {
  // 起點資料：同 7.30 的 WO-2026-0906；期望值取自 openspec work-order § 工單排程硬擋、§ 印務主管待審核工單列表
  // 工單詳情頁的核可
  await openAs(page, '印務主管', '/work-orders/detail?id=wo-2026-0906');
  await page.getByRole('button', { name: '核可製程' }).click();
  const detailDialog = page.locator('.ant-modal').filter({ hasText: '排程超過印件內部完成日，無法核可' });
  await expect(detailDialog).toBeVisible();
  await expect(detailDialog).toContainText('工單預排完成日：2026-09-24');
  await expect(detailDialog).toContainText('印件內部完成日：2026-09-18');
  await expect(detailDialog).toContainText('相差：4 個工作天');
  await detailDialog.getByRole('button', { name: '知道了' }).click();
  await expect(page.getByText('製程確認中', { exact: true }).first()).toBeVisible();

  // 待審核工單列表的核可：確認框後同樣被擋，工單留在列表、不產生派單
  await openAs(page, '印務主管', '/work-orders/review-queue');
  await page
    .locator('tr', { hasText: 'WO-2026-0906' })
    .first()
    .getByRole('button', { name: '審核通過' })
    .click();
  await page.getByRole('button', { name: cjkName('核可') }).click();
  const listDialog = page.locator('.ant-modal').filter({ hasText: '排程超過印件內部完成日，無法核可' });
  await expect(listDialog).toBeVisible();
  await expect(listDialog).toContainText('相差：4 個工作天');
  await listDialog.getByRole('button', { name: '知道了' }).click();
  await expect(page.locator('tr', { hasText: 'WO-2026-0906' }).first()).toBeVisible();
  await openAs(page, '印務', '/dispatch-orders');
  await expect(page.getByText('WO-2026-0906')).toHaveCount(0);
});
