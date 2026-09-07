import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄第十章：三個報工入口（工作包管理／工單詳情頁／印件詳情頁）共用同一顆報工對話框。
// 起點資料：鏈二 WP-2026-0710-01 的「海報四色印刷」任務、WO-2026-0710、PI-2026-0710（負責人周建宏）。
// 工單／印件詳情頁沒有側欄選單項，一律先進列表頁（gotoInApp）再點列上連結（router.push，非整頁重載）。

const REPORT_COLUMNS = [
  '工單／印件',
  '任務',
  '目標數量',
  '已報數量',
  '生產數量',
  '良品',
  '不良品',
  '不良原因',
  '照片',
];

const expectNineColumns = async (dialog) => {
  for (const label of REPORT_COLUMNS) {
    await expect(dialog.getByRole('columnheader', { name: label, exact: true })).toBeVisible();
  }
  // 不出現停機時數、停機原因、耗料明細、運轉設備；表格不可水平捲動（PanelDialog 寬 1320、未設 scroll.x）
  await expect(dialog.getByRole('columnheader', { name: '停機時數' })).toHaveCount(0);
  await expect(dialog.getByRole('columnheader', { name: '停機原因' })).toHaveCount(0);
  await expect(dialog.getByRole('columnheader', { name: '耗料明細' })).toHaveCount(0);
  await expect(dialog.getByRole('columnheader', { name: '運轉設備' })).toHaveCount(0);
};

test('10.4 三個報工入口用同一組欄位（原編號 87）', async ({ page }) => {
  // 入口一：師傅在工作包頁開報工
  await openAs(page, '師傅', '/production-floor/work-packages');
  await page
    .locator('tr', { hasText: 'WP-2026-0710-01' })
    .getByRole('button', { name: '報工' })
    .click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消' }).click();

  // 入口二：印務在工單詳情頁點報工（製程 Tab 逐列圖示，2026-09-04 拍板收進 Tab、非頁首按鈕）
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await page.getByText('WO-2026-0710', { exact: true }).click();
  await page.getByRole('button', { name: '報工', exact: true }).first().click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消' }).click();

  // 入口三：印務在印件詳情頁點報工（列表點的是印件名稱連結，印件編號欄只是純文字）
  await gotoInApp(page, '/print-items');
  await page.getByText('品牌形象海報 A2', { exact: true }).click();
  await page.getByRole('button', { name: '報工', exact: true }).click();
  await expectNineColumns(page.locator('.ant-modal-body'));
});

test('10.5 報工權限綁在工作歸屬上（原編號 89）', async ({ page }) => {
  // 師傅只看得到自己被指派的工作包（報工管道限自己被指派的那幾包）
  await openAs(page, '師傅', '/production-floor/work-packages');
  await expect(page.getByText('WP-2026-0710-02')).toHaveCount(0); // 李榮發的包看不到

  // 生管、印務、印務主管與主管可在本頁代報全廠
  await switchRole(page, '生管');
  await expect(
    page.locator('tr', { hasText: 'WP-2026-0710-02' }).getByRole('button', { name: '報工' }),
  ).toBeVisible();

  // 印務只在自己主責的工單看得到報工入口：WO-2026-0710 負責人為周建宏（印務本人）
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await page.getByText('WO-2026-0710', { exact: true }).click();
  await expect(page.getByRole('button', { name: '報工', exact: true }).first()).toBeVisible();
});

// 業務的選單完全沒有「生產管理」與「工單管理」群組，本來就無路可達這兩頁，
// 故獨立成一條測試、以業務身分整頁載入驗證看不到報工入口。
test('10.5（業務無報工入口）業務在工作包頁與工單詳情頁都看不到報工入口（原編號 89）', async ({
  page,
}) => {
  await openAs(page, '業務', '/production-floor/work-packages');
  await expect(page.getByRole('button', { name: '報工', exact: true })).toHaveCount(0);
});
