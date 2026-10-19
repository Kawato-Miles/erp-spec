import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import { openWorkOrder } from './_ch07.mjs';

// 第七章 7.45、7.46、7.47（2026-10-19 新增，單據權責修正第四批）：工單動作的操作者依活動表，
// 負責印務、被分享（編輯）成員（不限角色）、印務主管（全公司）可做負責印務能做的動作；
// 審核類不隨編輯權開放；不在名單內的印務沒有入口。判定另見 tests/unit/work-orders/access-by-activity.test.mjs。
// 起點資料（MOCK-DATA-CHAIN § 單據的分享成員）：WO-2026-0906 製程確認中，負責印務周建宏，編輯（代理）成員為生管許文傑與業務陳映蓉。
test.describe.configure({ timeout: 180_000 });

const heading = (page, no) => page.getByRole('heading', { name: no });
const button = (page, name) => page.getByRole('button', { name });

test('7.45 印務主管不是負責人也不在分享成員，照樣建立生產任務、送審、預覽、交付', async ({ page }) => {
  // 起點：鏈五 WO-2026-0901（草稿，負責印務周建宏）；對照負責印務有送審與預覽
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');
  await expect(button(page, '提交審核')).toBeVisible();

  await switchRole(page, '印務主管');
  await expect(heading(page, 'WO-2026-0901')).toBeVisible({ timeout: 20_000 });
  await expect(button(page, '新增生產任務')).toBeVisible();
  await expect(button(page, '提交審核')).toBeVisible();
  await expect(button(page, '預覽工單')).toBeVisible();

  // 錨例 WO-2026-0908（製程審核完成，負責印務周建宏）：印務主管有交付入口與列印
  await gotoInApp(page, '/work-orders');
  await openWorkOrder(page, 'WO-2026-0908');
  await expect(page.getByRole('button', { name: /交付產線（0）/ })).toBeVisible();
  await expect(button(page, '列印紙本工單')).toBeVisible();
  // 核可與退回製程維持印務主管專屬，製程已核可時兩顆都不出現
  await expect(button(page, '核可製程')).toHaveCount(0);
});

test('7.46 業務與生管被分享（編輯）後做負責印務的動作；審核類與沒被分享者沒有', async ({ page }) => {
  // 起點：WO-2026-0906（製程確認中）。先以印務主管進列表，再切成被分享的人，頁面不換
  await openAs(page, '印務主管', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0906');
  await expect(button(page, '核可製程')).toBeVisible();

  for (const who of ['業務（陳映蓉）', '生管（許文傑）']) {
    await switchRole(page, who);
    await expect(heading(page, 'WO-2026-0906')).toBeVisible({ timeout: 20_000 });
    // 製程確認中：編輯分享成員有收回與預覽，沒有核可製程與退回（審核類不隨編輯權開放）
    await expect(button(page, '收回'), who).toBeVisible();
    await expect(button(page, '預覽工單'), who).toBeVisible();
    await expect(button(page, '核可製程'), who).toHaveCount(0);
    await expect(button(page, '退回'), who).toHaveCount(0);
    // 分享頁籤有新增分享成員
    await page.getByRole('tab', { name: /分享（\d+）/ }).click();
    await expect(button(page, '新增分享成員'), who).toBeVisible();
    await page.getByRole('tab', { name: /製程規劃/ }).click();
  }

  // 同樣是生管，鄭宇翔不在分享成員內：看得到工單，沒有收回與預覽
  await switchRole(page, '生管（鄭宇翔）');
  await expect(heading(page, 'WO-2026-0906')).toBeVisible({ timeout: 20_000 });
  await expect(button(page, '收回')).toHaveCount(0);
  await expect(button(page, '預覽工單')).toHaveCount(0);
});

test('7.47 印務不能動別人的工單：沒有建立任務、送審、預覽、收回', async ({ page }) => {
  // WO-2026-0905（草稿、尚未指派負責印務）與 WO-2026-0907（製程確認中，負責印務蔡明修），周建宏都不是負責人
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0905');
  await expect(heading(page, 'WO-2026-0905')).toBeVisible({ timeout: 20_000 });
  await expect(button(page, '新增生產任務')).toHaveCount(0);
  await expect(button(page, '提交審核')).toHaveCount(0);
  await expect(button(page, '預覽工單')).toHaveCount(0);

  await gotoInApp(page, '/work-orders');
  await expect(page.locator('.ant-table-tbody').first()).not.toContainText('WO-2026-0907');
  // 印務主管看得到並可收回；改回印務重進同一張（直連網址只在整頁載入時換頁，這裡用列表確認範圍）
  await switchRole(page, '印務主管');
  await openWorkOrder(page, 'WO-2026-0907');
  await expect(button(page, '收回')).toBeVisible();
  await switchRole(page, '印務');
  await expect(heading(page, 'WO-2026-0907')).toBeVisible({ timeout: 20_000 });
  await expect(button(page, '收回')).toHaveCount(0);
  await expect(button(page, '預覽工單')).toHaveCount(0);
});
