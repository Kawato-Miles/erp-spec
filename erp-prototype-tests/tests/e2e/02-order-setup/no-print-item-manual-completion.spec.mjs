import { test, expect } from '@playwright/test';
import { openAs } from '../_helpers.mjs';
import { activityItem, button, dialog, openTab, orderHeader, waitModalsClosed } from './_local.mjs';

// 情境 2.19：沒有任何印件的訂單回簽後不自動推進、不提示取消，業務逐格手動推到訂單完成。
// 起點資料：鏈外 ORD-2026-0813（已回簽，沒有任何印件，一期設計費 3,150）。
// 對照組「兩件印件皆已棄用時提示改走取消」以純函式驗（tests/unit/orders/order-completion-no-print-items.test.mjs）。
// 期望值取自 order-management 規格差異檔 § 訂單完成判定。依據 wiki [[訂單成立確認]]、[[訂單狀態]]。
const ORDER_NO = 'ORD-2026-0813';
const STEPS = [
  '稿件未上傳',
  '等待審稿',
  '製作等待中',
  '工單已交付',
  '製作中',
  '製作完成',
  '出貨中',
  '訂單完成',
];

test('2.19 沒有任何印件的訂單回簽後不自動推進、不提示取消，業務逐格手動推到訂單完成；全數棄用仍提示改走取消', async ({
  page,
}) => {
  test.setTimeout(240_000);
  await openAs(page, '業務', `/orders/detail?id=${ORDER_NO}`);

  // 起點停在已回簽：系統不自動推進，也不提示改走取消
  await expect(orderHeader(page)).toContainText('已回簽');
  await expect(page.getByText(/全部印件皆已棄用/)).toHaveCount(0);
  await expect(page.getByText(/改走取消/)).toHaveCount(0);

  // 手動推進一次只推一格，每一格推進前出確認對話
  let from = '已回簽';
  for (const to of STEPS) {
    await button(page, '推進狀態').click();
    const modal = dialog(page);
    await expect(modal).toContainText(`推進至「${to}」`);
    await expect(modal).toContainText(`目前狀態「${from}」`);
    if (to === '訂單完成') {
      // 推到訂單完成那一格的確認文案另寫明金額明細自此鎖定
      await expect(modal).toContainText(/金額明細.*自此鎖定/);
    }
    await modal.getByRole('button', { name: /推進一格|推進並鎖定明細/ }).click();
    await waitModalsClosed(page);
    await expect(orderHeader(page)).toContainText(to);
    from = to;
  }

  // 到訂單完成後不再提供推進
  await expect(button(page, '推進狀態')).toHaveCount(0);

  // 每一格在活動紀錄留一筆推進人、時間與推進前後狀態
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '手動推進訂單狀態')).toHaveCount(STEPS.length);
  await expect(activityItem(page, '「出貨中」→「訂單完成」')).toHaveCount(1);
  await expect(activityItem(page, '「已回簽」→「稿件未上傳」')).toHaveCount(1);
  await expect(page.locator('.ant-timeline-item').filter({ hasText: '「出貨中」→「訂單完成」' })).toContainText(
    '洪嘉駿',
  );
});
