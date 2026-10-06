import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄第十章：五個報工入口（我的工作包、我的生產任務、所有工作包、所有生產任務、工單詳情）共用同一顆報工對話框；
// 印件詳情沒有報工入口（2026-10-06 拍板 R3）。
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

const PHOTO = { name: '現場照.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('現場照') };

test('10.4 五個報工入口用同一組欄位，提交管道三值；印件詳情沒有報工入口；照片必填（原編號 87）', async ({ page }) => {
  test.setTimeout(150_000);
  // 入口一：師傅在我的工作包開報工
  await openAs(page, '師傅', '/production-floor/work-packages');
  await page
    .locator('tr', { hasText: 'WP-2026-0710-01' })
    .getByRole('button', { name: '報工' })
    .click();
  const dialog = page.locator('.ant-modal-body');
  await expectNineColumns(dialog);
  // 照片必填：不附照片送出被擋下
  const line = dialog.locator('tbody tr').filter({ hasText: '海報四色印刷' }).first();
  await line.locator('input.ant-input-number-input').nth(0).fill('100');
  await line.locator('input.ant-input-number-input').nth(1).fill('100');
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText(/現場照片/).first()).toBeVisible();
  await line.locator('input[type="file"]').first().setInputFiles(PHOTO);
  await page.getByRole('button', { name: /送出報工/ }).click();
  await expect(page.getByText(/已送出 1 筆報工/).last()).toBeVisible();

  // 入口二：師傅在我的生產任務開報工
  await gotoInApp(page, '/production-floor/dispatch/mine');
  await page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 入口三、四：生管在所有工作包與所有生產任務代報
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/work-packages');
  await page.locator('tr', { hasText: 'WP-2026-0710-01' }).getByRole('button', { name: '報工' }).click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消', exact: true }).click();
  await gotoInApp(page, '/production-floor/dispatch');
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0710');
  await search.press('Enter');
  await page.locator('tr.ant-table-row', { hasText: '海報四色印刷' }).first().getByRole('button', { name: '報工' }).click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 入口五：印務在工單詳情頁點報工（製程 Tab 逐列圖示）
  await switchRole(page, '印務');
  await gotoInApp(page, '/work-orders');
  await page.getByText('WO-2026-0710', { exact: true }).click();
  await page.getByRole('button', { name: '報工', exact: true }).first().click();
  await expectNineColumns(page.locator('.ant-modal-body'));
  await page.getByRole('button', { name: '取消', exact: true }).click();

  // 印件詳情頁沒有報工入口（頁首與工單與生產任務區塊皆無）
  await gotoInApp(page, '/print-items');
  await page.getByText('品牌形象海報 A2', { exact: true }).click();
  await expect(page.getByText('PI-2026-0710').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /報\s*工/ })).toHaveCount(0);
});

test('10.5 報工權限綁在工作歸屬上：工單詳情看負責或編輯分享、所有〇〇看所屬產線、我的〇〇看指派（原編號 89）', async ({ page }) => {
  // 我的〇〇看指派：師傅只看得到自己被指派的工作包
  await openAs(page, '師傅', '/production-floor/work-packages');
  await expect(page.getByText('WP-2026-0710-02')).toHaveCount(0); // 李榮發的包看不到

  // 所有〇〇看所屬產線：生管許文傑（數位、裝訂、手工）在別人的包（WP-2026-0710-01，指派師傅劉阿海）上看得到報工入口
  await switchRole(page, '生管');
  await gotoInApp(page, '/production-floor/work-packages');
  await expect(
    page.locator('tr', { hasText: 'WP-2026-0710-01' }).getByRole('button', { name: '報工' }),
  ).toBeVisible();

  // 生管鄭宇翔（手工、壓克力）的所有生產任務沒有數位產線的五色印刷，有手工產線的證書裁切
  await switchRole(page, '生管（鄭宇翔）');
  await gotoInApp(page, '/production-floor/dispatch');
  await expect(page.locator('tr.ant-table-row', { hasText: '五色印刷' })).toHaveCount(0);
  await expect(
    page.locator('tr.ant-table-row', { hasText: '證書裁切' }).first().getByRole('button', { name: '報工' }),
  ).toHaveCount(1);

  // 工單詳情看負責或編輯分享：WO-2026-0710 負責人為周建宏（印務本人）
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
