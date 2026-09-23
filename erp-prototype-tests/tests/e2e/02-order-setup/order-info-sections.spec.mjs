import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { activityItem, button, drawer, openByNo, openScenario, openTab, panelSection } from './_local.mjs';

// 情境目錄 2.11～2.13：訂單資訊分區編輯的補齊（審核業務主管改派、發票與收款區塊、
// 內部備註與製作備註、成品公開授權三值）。依據 wiki [[訂單資訊分區編輯]]、[[訂單]]、
// [[業務主管]]、[[Supervisor]]。

// 訂單資訊卡上某一欄的值格（Descriptions bordered：th 為欄名、緊鄰的 td 為值）
const infoCell = (page, label) =>
  page.locator(`xpath=//th[normalize-space(.)="${label}"]/following-sibling::td[1]`).first();

// 側板裡的下拉：點開後選指定選項（下拉關閉仍留在 DOM，限定在可見的那一個）
const pickIn = async (page, select, label) => {
  await expect(async () => {
    await select.click({ force: true });
    await page
      .locator('.ant-select-dropdown:visible')
      .last()
      .locator('.ant-select-item-option')
      .filter({ hasText: label })
      .first()
      .click({ timeout: 3000 });
  }).toPass({ timeout: 15000 });
};

test('2.11 審核通過前，業務主管與主管可改派審核業務主管；通過後入口隱藏', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈八 ORD-2026-0911（草稿，審核業務主管林雅婷）
  await openScenario(page, '業務主管', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0911');
  await openTab(page, '資訊');
  const cell = infoCell(page, '審核業務主管');
  await expect(cell).toContainText('林雅婷');

  // 比照改派接單業務：理由分類必選、補述選填
  await cell.getByRole('button', { name: '改派' }).click();
  const panel = drawer(page);
  await expect(panel).toContainText('改派審核業務主管');
  await expect(panel).toContainText('改派理由分類（必選）');
  await expect(panel).toContainText('補述（選填）');
  await pickIn(page, panel.locator('.ant-select').nth(0), '蔡佩珊');
  await expect(button(panel, '確認')).toBeDisabled();
  await pickIn(page, panel.locator('.ant-select').nth(1), '長假代理');
  await panel.locator('textarea').fill('林經理 9/25 至 9/30 休假');
  await button(panel, '確認').click();
  await expect(page.locator('body')).toContainText('已改派審核業務主管給 蔡佩珊（長假代理）');
  await expect(infoCell(page, '審核業務主管')).toContainText('蔡佩珊');

  // 活動紀錄留一筆，帶理由與補述
  await openTab(page, '活動紀錄');
  await expect(
    activityItem(page, '改派審核業務主管為 蔡佩珊（長假代理）：林經理 9/25 至 9/30 休假'),
  ).toHaveCount(1);

  // 主管同樣看得到入口；業務看不到
  await switchRole(page, '主管');
  await openTab(page, '資訊');
  await expect(infoCell(page, '審核業務主管').getByRole('button', { name: '改派' })).toHaveCount(1);
  await switchRole(page, '業務');
  await expect(infoCell(page, '審核業務主管').getByRole('button', { name: '改派' })).toHaveCount(0);

  // 審核通過後入口隱藏：鏈八 ORD-2026-0913（審核通過）
  await page.goto('/orders/detail?id=ORD-2026-0913');
  await switchRole(page, '業務主管');
  await openTab(page, '資訊');
  await expect(infoCell(page, '審核業務主管')).toBeVisible();
  await expect(infoCell(page, '審核業務主管').getByRole('button', { name: '改派' })).toHaveCount(0);
});

test('2.12 發票與收款區塊：帳務公司未取消前可改，收款條件備註審核通過後唯讀；內部備註與製作備註可編輯', async ({
  page,
}) => {
  test.setTimeout(120_000);
  // 起點：鏈一 ORD-2026-0601（訂單完成、線下單）
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0601');
  await openTab(page, '資訊');
  const billing = panelSection(page, '發票與收款');
  await expect(infoCell(page, '帳務公司')).toContainText('感官');

  // 訂單完成後仍可改帳務公司；收款條件備註已鎖、無輸入框
  await button(billing, '編輯').click();
  const billingPanel = drawer(page);
  await expect(billingPanel).toContainText('編輯發票與收款');
  await expect(billingPanel).toContainText('訂單已審核通過，收款條件備註鎖定');
  await expect(billingPanel.locator('textarea')).toHaveCount(0);
  await pickIn(page, billingPanel.locator('.ant-select').first(), '柏樂');
  await button(billingPanel, '確認').click();
  await expect(page.getByText('已更新發票與收款').last()).toBeVisible();
  await expect(infoCell(page, '帳務公司')).toContainText('柏樂');

  // 訂單備註一塊補上內部備註、製作備註（線下單）的編輯
  await button(panelSection(page, '訂單備註'), '編輯').click();
  const notePanel = drawer(page);
  await expect(notePanel).toContainText('內部備註');
  await expect(notePanel).toContainText('製作備註');
  await notePanel.locator('#staff_notes').fill('2.12 內部備註：客戶要求週五前電話確認');
  await notePanel.locator('#production_note').fill('2.12 製作備註：燙金版沿用上一批');
  await button(notePanel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();
  await expect(page.locator('body')).toContainText('2.12 內部備註：客戶要求週五前電話確認');
  await expect(page.locator('body')).toContainText('2.12 製作備註：燙金版沿用上一批');

  // 審核通過前（鏈八 ORD-2026-0911 草稿）收款條件備註可改
  await page.goto('/orders/detail?id=ORD-2026-0911');
  await switchRole(page, '業務');
  await openTab(page, '資訊');
  await button(panelSection(page, '發票與收款'), '編輯').click();
  const draftPanel = drawer(page);
  await draftPanel.locator('#payment_terms_note').fill('2.12 訂金三成、交貨後月結 30 天');
  await button(draftPanel, '確認').click();
  await expect(page.getByText('已更新發票與收款').last()).toBeVisible();
  await expect(infoCell(page, '收款條件備註')).toContainText('2.12 訂金三成、交貨後月結 30 天');
});

test('2.13 授權分享三值、預設否；訂單完成後仍可改授權分享與授權備註', async ({ page }) => {
  test.setTimeout(90_000);
  // 起點：鏈一 ORD-2026-0601（訂單完成）；現行 mock 全部訂單授權分享為「否」
  await openScenario(page, '業務', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0601');
  await openTab(page, '資訊');
  await expect(infoCell(page, '授權分享')).toHaveText('否');

  await button(panelSection(page, '訂單資訊'), '編輯').click();
  const panel = drawer(page);
  await expect(panel).toContainText('授權分享');
  await expect(panel).toContainText('授權備註');
  // 下拉只有三值
  await panel.locator('.ant-select').first().click();
  const options = page.locator('.ant-select-dropdown:visible').last().locator('.ant-select-item-option');
  await expect(options).toHaveCount(3);
  await expect(options).toHaveText(['否', '是', '待定']);
  await options.filter({ hasText: '待定' }).click();
  await panel.locator('#auth_notes').fill('2.13 公開時標註 @eslitebooks');
  await button(panel, '確認').click();
  await expect(page.getByText('已更新訂單資訊').last()).toBeVisible();
  await expect(infoCell(page, '授權分享')).toHaveText('待定');
  await expect(infoCell(page, '授權備註')).toContainText('2.13 公開時標註 @eslitebooks');

  // 分享頁籤只管單據存取，不再出現授權分享這兩欄
  await openTab(page, '分享');
  await expect(page.getByRole('tabpanel').getByText('授權分享')).toHaveCount(0);
});
