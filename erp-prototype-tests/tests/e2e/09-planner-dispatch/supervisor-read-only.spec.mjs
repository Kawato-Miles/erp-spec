import { test, expect } from '@playwright/test';
import { openAs, gotoInApp } from '../_helpers.mjs';

// 情境目錄 9.12：主管在生產管理各頁唯讀。主管看全公司、不動單據（wiki Supervisor 角色卡）；
// 生產管理五模組的同權角色只有生管、印務、印務主管。
// 起點資料：鏈三 WO-2026-0815 的待派任務、鏈二 WP-2026-0710-01、TT-20260830-002（已送達待點收）。

test('9.12 主管在生產管理各頁看得到資料，但沒有任何操作入口', async ({ page }) => {
  // 生產任務管理：看得到待派任務，沒有接收工作與派工
  await openAs(page, '主管', '/production-floor/dispatch');
  await expect(page.getByRole('cell', { name: 'WO-2026-0815' }).first()).toBeVisible();
  await expect(page.getByText('派工限生管、印務與印務主管操作')).toBeVisible();
  await expect(page.getByRole('button', { name: '接收工作' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /派工（/ })).toHaveCount(0);

  // 工作包管理：看得到全部工作包，沒有報工、調整師傅
  await gotoInApp(page, '/production-floor/work-packages');
  await expect(page.getByText('WP-2026-0710-01')).toBeVisible();
  await expect(page.getByRole('button', { name: '報工' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '調整師傅' })).toHaveCount(0);

  // 待搬視圖：不能建轉交單
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.getByText('轉交單建立限生管、印務與印務主管操作')).toBeVisible();
  await expect(page.getByRole('button', { name: /建立轉交單/ })).toHaveCount(0);

  // 轉交單管理：看得到單，沒有編輯、作廢、重開、開始搬運、抵達站點
  await gotoInApp(page, '/production-floor/transfers');
  const ticketRow = page.locator('tr', { hasText: 'TT-20260830-002' });
  await expect(ticketRow).toBeVisible();
  for (const name of ['編輯', '作廢', '重開', '開始搬運', '抵達站點']) {
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
  }

  // 點收佇列：主管不代點收，已送達的單不在主管的佇列
  await gotoInApp(page, '/production-floor/receiving');
  await expect(page.getByText(/目前沒有輪到你點收的貨/)).toBeVisible();
  await expect(page.getByRole('button', { name: '點收' })).toHaveCount(0);
});
