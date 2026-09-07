import { test, expect } from '@playwright/test';
import { openAs, switchRole, gotoInApp } from '../_helpers.mjs';

// 情境目錄 10.8、10.9：點收佇列（/production-floor/receiving）依目的地與角色過濾；
// 點收即到料放行，下游可開工。起點資料：鏈二 TT-20260830-002（目的地裁切站、已送達待點收）。

test('10.8 點收佇列依目的地與角色過濾（原編號 93）', async ({ page }) => {
  // 師傅（劉阿海）不屬於裁切站所在產線，看到空佇列與提示
  await openAs(page, '師傅', '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
  await expect(page.getByText(/目的地為產線由該產線的師傅點收/)).toBeVisible();

  // 品檢人員：目的地不是品檢站，同樣看不到
  await switchRole(page, '品檢人員');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);

  // 生管看得到全部，點收視窗為純確認、無可改數量欄位
  await switchRole(page, '生管');
  await expect(page.getByText(/你正以生管.*身分點收/)).toBeVisible();
  const row = page.locator('tr', { hasText: 'TT-20260830-002' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: '點收' }).click();
  const dialog = page.locator('.ant-modal-body');
  await expect(dialog.locator('input[type="number"], .ant-input-number')).toHaveCount(0);
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(page.getByText(/已點收 TT-20260830-002/)).toBeVisible();
  // 單上留下代點收標記（歷程可查，這裡先驗點收動作本身成立）
  await expect(row).toHaveCount(0); // 點收後脫離「已送達待點收」佇列
});

// 業務的選單沒有「點收佇列」（品檢與出貨群組只含品檢站／出貨管理），無路可達，獨立成一條測試。
test('10.8（業務空佇列）業務看到空佇列與提示（原編號 93）', async ({ page }) => {
  await openAs(page, '業務', '/production-floor/receiving');
  await expect(page.getByText('TT-20260830-002')).toHaveCount(0);
  await expect(page.getByText(/目前沒有輪到你點收的貨/)).toBeVisible();
});

test('10.9 點收就是到料放行，下游可以開工（原編號 94）', async ({ page }) => {
  await openAs(page, '生管', '/production-floor/work-packages');
  let pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  let subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow).toContainText('0／3,000'); // 點收前可做量 0／3,000

  await gotoInApp(page, '/production-floor/receiving');
  await page.locator('tr', { hasText: 'TT-20260830-002' }).getByRole('button', { name: '點收' }).click();
  await page.getByRole('button', { name: '確認點收' }).click();
  await expect(
    page.getByText(/已點收 TT-20260830-002；裁切｜POLAR 137 裁切機的到料量加 1,190，下游可開工/),
  ).toBeVisible();

  await gotoInApp(page, '/production-floor/work-packages');
  pkgRow = page.locator('.ant-table-row', { hasText: 'WP-2026-0710-02' });
  await pkgRow.getByLabel('展開行').click();
  subRow = pkgRow.locator('xpath=following-sibling::tr[1]');
  await expect(subRow).toContainText('1,190／3,000'); // 點收 1,190 後可做量 1,190／3,000

  // 代該任務報工：投入 1,190、良品 1,180、不良品 10
  await pkgRow.getByRole('button', { name: '報工' }).click();
  const dialog = page.locator('.ant-modal-body');
  const taskRow = dialog.locator('tr', { hasText: '裁切成型' });
  const inputs = taskRow.locator('input');
  await inputs.nth(0).fill('1190');
  await inputs.nth(1).fill('1180');
  await inputs.nth(2).fill('10');
  await taskRow.locator('.ant-select').last().click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '送出報工' }).click();
  await expect(page.getByText('已送出 1 筆報工').last()).toBeVisible();
});
