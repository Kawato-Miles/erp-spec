import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { pickOption, openByNo, drawer, openTab, button, reloadAs, openScenario, activityItem } from './_local-helpers.mjs';

test('6.5 訂單改派負責業務要選理由分類，離職交接連同分享成員一起清空（原編號 190）', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await openScenario(page, '業務主管', '/orders', { openAs, switchRole });
  await openByNo(page, 'ORD-2026-0710');
  await expect(page.locator('body')).toContainText('分享（1）');
  await expect(page.locator('body')).toContainText('製作中');

  // 一、只選新負責人、不選理由分類：確認鈕停用
  await page.getByRole('button', { name: '改派' }).first().click();
  let panel = drawer(page);
  await expect(panel).toContainText('改派業務負責人');
  await expect(panel).toContainText('改派理由分類（必選）');
  await expect(panel).toContainText('補述');
  await pickOption(page, panel.locator('.ant-select').nth(0), '李志豪');
  await expect(button(panel, '確認')).toBeDisabled();

  // 二、理由分類選離職交接、補述留空
  await pickOption(page, panel.locator('.ant-select').nth(1), '離職交接');
  await expect(button(panel, '確認')).toBeEnabled();
  await button(panel, '確認').click();
  await expect(page.locator('body')).toContainText(
    '已改派給 李志豪（離職交接），活動紀錄已留痕；已清空分享成員 1 位',
  );

  // 活動紀錄新增兩筆——改派負責業務與清空分享成員各一筆
  await openTab(page, '活動紀錄');
  await expect(activityItem(page, '改派負責業務為 李志豪（離職交接）')).toHaveCount(1);
  await expect(activityItem(page, '已清空分享成員 1 位')).toHaveCount(1);
  // 分享頁籤的成員數歸零；訂單狀態維持製作中
  await expect(page.locator('body')).toContainText('分享（0）');
  await expect(page.locator('body')).toContainText('製作中');

  // 三、重整頁面（情境要求：模擬資料回到起點）後改選長假代理並填補述
  await reloadAs(page, '業務主管', switchRole);
  await expect(page.locator('body')).toContainText('分享（1）');
  // 重整後停在重整前的頁籤，改派入口在「資訊」頁籤的業務負責人欄
  await openTab(page, '資訊');
  await page.getByRole('button', { name: '改派' }).first().click();
  panel = drawer(page);
  await pickOption(page, panel.locator('.ant-select').nth(0), '李志豪');
  await pickOption(page, panel.locator('.ant-select').nth(1), '長假代理');
  await panel.locator('textarea').fill('王小姐 9/10 至 9/20 休假');
  await button(panel, '確認').click();
  await expect(page.locator('body')).toContainText('已改派給 李志豪（長假代理），活動紀錄已留痕');
  await expect(page.locator('body')).not.toContainText('已清空分享成員');

  await openTab(page, '活動紀錄');
  await expect(
    activityItem(page, '改派負責業務為 李志豪（長假代理）：王小姐 9/10 至 9/20 休假'),
  ).toHaveCount(1);
  await expect(activityItem(page, '已清空分享成員')).toHaveCount(0);
  // 張惠雯保留、頁籤仍為「分享（1）」；訂單狀態仍為製作中
  await expect(page.locator('body')).toContainText('分享（1）');
  await expect(page.locator('body')).toContainText('製作中');
});
