import { test, expect } from '@playwright/test';
import { gotoInApp, openAs } from '../_helpers.mjs';

// 情境目錄 9.12：主管在生產管理五個產線單元唯讀看全貌（wiki 印件生產流程 § 生產管理單元的權限範圍、
// wiki Supervisor）。五頁都列全部產線的單據、頁首提示唯讀、沒有任何操作入口；檢視歷程照樣看得到。
// 2026-10-06 改版：操作清單拿掉再次點收與人工註記，補點收修改、點收紀錄作廢、搬運數量修改。

const READ_ONLY_NOTICE = '主管在生產管理只有唯讀檢視';

// 生產管理各頁的操作鈕（名稱以正規式比對，AntD 會在兩字按鈕中間插空白）
const OPERATIONS = [
  /打\s*包/,
  /接收工作/,
  /取消工作包/,
  /^報\s*工$/,
  /整包報工/,
  /^修\s*改$/,
  /^作\s*廢$/,
  /手動完成/,
  /建立.*張單/,
  /^編\s*輯$/,
  /編輯工作包/,
  /開始搬運/,
  /抵達站點/,
  /^點\s*收$/,
  /點收修改/,
  /作廢點收紀錄/,
  /搬運數量修改/,
];

async function expectNoOperations(page) {
  for (const name of OPERATIONS) {
    await expect(page.getByRole('button', { name })).toHaveCount(0);
  }
  await expect(page.locator('main .ant-table .ant-checkbox-input')).toHaveCount(0);
}

test('9.12 主管在生產管理五個產線單元唯讀看全貌', async ({ page }) => {
  test.setTimeout(150_000);
  await openAs(page, '主管', '/production-floor/schedule');

  // 選單：生產管理群組列五個產線單元，沒有「我的」單元；工廠總覽照樣在
  const groupTitles = page.locator('.ant-menu-submenu-title');
  await expect(groupTitles.filter({ hasText: '工廠總覽' })).toHaveCount(1);
  await expect(groupTitles.filter({ hasText: '生產管理' })).toHaveCount(1);
  await groupTitles.filter({ hasText: '生產管理' }).click();
  for (const label of ['所有生產任務', '所有工作包', '待轉交任務', '所有轉交單', '點收佇列']) {
    await expect(page.locator('.ant-menu-item', { hasText: label })).toHaveCount(1);
  }
  for (const label of ['我的生產任務', '我的工作包', '我的轉交單']) {
    await expect(page.locator('.ant-menu-item', { hasText: label })).toHaveCount(0);
  }

  // 所有生產任務：全部產線的任務都列（鏈四精裝裝訂在裝訂產線、鏈外證書裁切在手工產線），沒有操作；歷程看得到
  await gotoInApp(page, '/production-floor/dispatch');
  await expect(page.getByText(READ_ONLY_NOTICE).first()).toBeVisible();
  const search = page.getByPlaceholder(/工單編號/).first();
  await search.fill('WO-2026-0812');
  await search.press('Enter');
  await expect(page.locator('tr.ant-table-row', { hasText: '證書裁切' }).first()).toBeVisible();
  await expectNoOperations(page);
  await page
    .locator('tr.ant-table-row', { hasText: '證書四色印刷' })
    .first()
    .getByRole('button', { name: /檢視歷程/ })
    .click();
  await expect(page.locator('.ant-drawer-content:visible').last()).toContainText('歷程（');
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 所有工作包：展開後子層也沒有報工、手動完成；工作包側板的報工紀錄沒有修改與作廢
  await gotoInApp(page, '/production-floor/work-packages');
  await expect(page.getByText(READ_ONLY_NOTICE).first()).toBeVisible();
  const pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-01' }).first();
  await pkgRow.getByLabel('展開行').click();
  await expect(pkgRow.locator('xpath=following-sibling::tr[1]')).toContainText('海報四色印刷');
  await expectNoOperations(page);
  await page.getByText('WP-2026-0710-01', { exact: true }).first().click();
  const pkgDrawer = page.locator('.ant-drawer-content:visible').last();
  await expect(pkgDrawer).toContainText('報工紀錄');
  await expectNoOperations(page);
  await page.getByRole('button', { name: '關閉' }).last().click();

  // 待轉交任務、所有轉交單、點收佇列：列得出單據，沒有操作
  await gotoInApp(page, '/production-floor/pending-moves');
  await expect(page.getByText(READ_ONLY_NOTICE).first()).toBeVisible();
  await expect(page.locator('tr.ant-table-row', { hasText: '精裝裝訂' }).first()).toBeVisible();
  await expectNoOperations(page);

  await gotoInApp(page, '/production-floor/transfers');
  await expect(page.getByText(READ_ONLY_NOTICE).first()).toBeVisible();
  await expect(page.locator('tr.ant-table-row', { hasText: /TT-\d{8}-\d{3}/ }).first()).toBeVisible();
  await expectNoOperations(page);

  await gotoInApp(page, '/production-floor/receiving');
  await expect(page.getByText(READ_ONLY_NOTICE).first()).toBeVisible();
  await expect(page.locator('tr.ant-table-row', { hasText: 'TT-20260830-002' }).first()).toBeVisible();
  await expectNoOperations(page);

  // 工廠總覽照樣看得到
  await gotoInApp(page, '/production-floor/schedule');
  await expect(page).toHaveURL(/production-floor\/schedule/);
});
