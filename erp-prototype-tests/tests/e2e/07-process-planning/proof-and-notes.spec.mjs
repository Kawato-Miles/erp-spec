import { expect, test } from '@playwright/test';
import { cjkName, clickIntoDetail, openAs, switchRole } from '../_helpers.mjs';
import { openWorkOrder } from './_ch07.mjs';

// 本機同時有多個測試在跑，dev server 首次編譯路由會拖長
test.describe.configure({ timeout: 120_000 });

// 第七章新增兩條：7.26 印務於製程規劃填工單確樣需求、7.27 印件備註側板依角色鎖欄。

test('7.26 印務於製程規劃填工單確樣需求（十值多選、非終態可改、終態唯讀）', async ({ page }) => {
  // 起點資料：鏈五 WO-2026-0901（草稿、負責印務周建宏，確樣需求預置「改版」「數位樣」）
  // 期望值取自 openspec work-order § 工單確樣需求與 § 製程規劃
  await openAs(page, '印務', '/work-orders');
  await openWorkOrder(page, 'WO-2026-0901');

  // 工單資訊卡預設收合，展開後看得到確樣需求欄
  await page.getByText('查看工單資訊').first().click();
  const proofValue = page
    .locator('th.ant-descriptions-item-label:has-text("確樣需求") + td')
    .first();
  await expect(proofValue).toContainText('改版');
  await expect(proofValue).toContainText('數位樣');

  // 負責印務可改：開編輯工單資訊抽屜，確樣需求為十值多選、不提供自由輸入
  await page.getByRole('button', { name: '編輯' }).first().click();
  const drawer = page.locator('.ant-drawer').filter({ hasText: '編輯工單資訊' }).last();
  await expect(drawer).toBeVisible();
  const proofSelect = drawer.locator('.ant-select').last();
  await proofSelect.click();
  const options = page.locator('.ant-select-dropdown:visible .ant-select-item-option');
  await expect(options).toHaveCount(10);
  for (const value of [
    '新版',
    '舊版',
    '留版',
    '暫保版',
    '改版',
    '底片',
    '數位樣',
    '機上樣',
    '雷射樣',
    '看印',
  ]) {
    await expect(options.filter({ hasText: value })).toHaveCount(1);
  }

  // 勾上「看印」後存檔，工單資訊隨之顯示三個值
  await options.filter({ hasText: '看印' }).first().click();
  await page.keyboard.press('Escape');
  await drawer.getByRole('button', { name: '儲存' }).click();
  await expect(drawer).toBeHidden();
  await expect(proofValue).toContainText('看印');

  // 其他角色唯讀：生管看不到編輯入口可用（按鈕停用）
  await switchRole(page, '生管');
  await expect(page.getByRole('button', { name: '編輯' }).first()).toBeDisabled();

  // 終態工單唯讀：按頁首返回鍵回工單列表（站內導頁、記憶體狀態保留），再進已完成的鏈一 WO-2026-0601
  await switchRole(page, '印務');
  await page.locator('.material-symbols-outlined', { hasText: 'arrow_back' }).first().click();
  await expect(page).toHaveURL(/\/work-orders\/?$/, { timeout: 20_000 });
  await openWorkOrder(page, 'WO-2026-0601');
  await page.getByText('查看工單資訊').first().click();
  await expect(page.getByRole('button', { name: cjkName('編輯') }).first()).toBeDisabled();
});

test('7.27 印件備註側板依角色鎖欄：印務改得動兩欄、稿件備註唯讀', async ({ page }) => {
  // 起點資料：鏈七 PI-2026-0904（旗下 WO-2026-0904 與 WO-2026-0905 兩張工單，
  // 所屬訂單 ORD-2026-0904 非終態，負責印務周建宏）
  // 期望值取自 openspec order-management § 訂單階段印件規格編輯時機的三個 Scenario
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0904');
  await page.getByText('查看印件資訊').first().click();

  // 印件基本資訊卡的編輯入口開啟印件備註側板（AntD 會在兩字按鈕中間插空白，用 cjkName 容錯；
  // 工單資訊卡的「編輯」排在前面，印件備註那一顆是第二顆）
  await page
    .getByRole('button', { name: cjkName('編輯') })
    .filter({ hasNotText: '製程' })
    .nth(1)
    .click();
  const drawer = page.locator('.ant-drawer').filter({ hasText: '編輯印件備註' }).last();
  await expect(drawer).toBeVisible();

  // 規格備註、包裝備註與預計產線可改；稿件備註唯讀、不提供編輯入口
  await expect(drawer.getByLabel('規格備註')).toBeEnabled();
  await expect(drawer.getByLabel('包裝備註')).toBeEnabled();
  await expect(drawer.getByLabel('稿件備註')).toBeDisabled();

  const SPEC_NOTE = '7.27 規格備註改寫：立牌插槽公差 0.5mm';
  const PACK_NOTE = '7.27 包裝備註改寫：每 10 片一箱、加防撞泡棉';
  await drawer.getByLabel('規格備註').fill(SPEC_NOTE);
  await drawer.getByLabel('包裝備註').fill(PACK_NOTE);
  await drawer.getByRole('button', { name: '儲存' }).click();
  await expect(drawer).toBeHidden();

  // 印件詳情頁同值（自工單詳情的印件編號連結進去，站內導頁、記憶體狀態保留）
  await clickIntoDetail(page, 'PI-2026-0904', /print-items\/detail/);
  await expect(page.locator('body')).toContainText(SPEC_NOTE);
  await expect(page.locator('body')).toContainText(PACK_NOTE);

  // 同一件印件的另一張工單（WO-2026-0905）讀到同一段文字——工單不保留獨立副本
  await page.getByRole('tab', { name: /工單與生產任務/ }).click();
  await clickIntoDetail(page, 'WO-2026-0905', /work-orders\/detail/);
  await page.getByText('查看印件資訊').first().click();
  await expect(page.locator('body')).toContainText(SPEC_NOTE);
  await expect(page.locator('body')).toContainText(PACK_NOTE);
});
