import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄第十章：10.17 來源生產任務報廢或作廢時擋下在途轉交單的點收。
//
// store 層雖有 voidTask／scrapTask 兩支動作（work-orders/_lib/store.js），但整個 prototype
// 沒有任何畫面把它們掛上按鈕——唯一能在畫面上把一筆有實際投入的場內生產任務推進「報廢」的
// 路徑是訂單取消的五層連鎖（orders/_lib/cancel-actions.js）：非終態工單轉「已取消」、
// 旗下生產任務依有無實際投入分流（有投入者報廢、無投入者已作廢）。取消連鎖只動印件、工單、
// 生產任務、派單提示與未離廠出貨單，不觸碰在途轉交單本身，故取消後 TT-20260830-002 仍停在
// 「已送達」（待點收），恰好符合本情境「來源任務已報廢、轉交單還在途」的前提。
//
// 實測發現：點收佇列（production-floor/receiving/page.js）在來源任務無效時直接把「點收」
// 圖示按鈕整顆換成唯讀文字「已擋下」，操作者連點都點不到——比情境目錄描述的「按下去才跳錯誤
// 訊息」更早一步防呆。連鎖點收會被系統擋下的訊息文字（describeTicketWarnings 那一句）掛在
// 點收確認 Dialog 內，但這個 Dialog 只在「點收」按鈕的 onClick 觸發，按鈕消失後這段文字沒有
// 路徑進得去畫面，屬於摸不到的死碼。本測試改驗證畫面上實際會發生的事（狀態格顯示「來源任務
// 已無效」、操作格顯示「已擋下」、單子留在佇列不消失），不驗那段死碼裡的訊息文字。

test('10.17 來源生產任務報廢或作廢時擋下在途轉交單的點收', async ({ page }) => {
  test.setTimeout(60_000);
  // 前置：業務取消鏈二訂單 ORD-2026-0710，來源生產任務「海報四色印刷」（PT-0710-2，
  // 已有報工投入）依連鎖規則轉「報廢」；TT-20260830-002（來源即此任務）維持「已送達」不動
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710');
  await page.getByRole('button', { name: '取消訂單' }).click();
  await page
    .locator('.ant-modal-confirm-btns')
    .getByRole('button', { name: /確\s*定/ })
    .click();
  await expect(page.getByText(/已取消訂單/)).toBeVisible();
  await expect(page.getByText(/生產任務 \d+ 筆報廢/)).toBeVisible();

  // 生管在點收佇列查看 TT-20260830-002：來源任務無效時系統不給點收入口
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/receiving');
  const ticketRow = page.locator('tr', { hasText: 'TT-20260830-002' });
  await expect(ticketRow).toBeVisible();

  // 狀態格維持「已送達」，另掛「來源任務已無效」標記；操作格顯示唯讀文字「已擋下」，
  // 沒有「點收」按鈕可按——目的站點到料量不動、下游不放行
  await expect(ticketRow.getByText('已送達', { exact: true })).toBeVisible();
  await expect(ticketRow.getByText('來源任務已無效', { exact: true })).toBeVisible();
  await expect(ticketRow.getByText('已擋下', { exact: true })).toBeVisible();
  await expect(ticketRow.getByRole('button', { name: '點收' })).toHaveCount(0);

  // 系統不自動作廢那張轉交單：切到印務再切回生管重看佇列，單子仍原樣留著、不會憑空消失
  await switchRole(page, '印務');
  await switchRole(page, '生管');
  await expect(page.locator('tr', { hasText: 'TT-20260830-002' })).toBeVisible();
});
