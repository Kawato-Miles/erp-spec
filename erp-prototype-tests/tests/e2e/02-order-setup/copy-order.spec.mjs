import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import { button, dialog, openByNo, openTab, orderHeader, rowOf } from './_local.mjs';

// 2.28（單據權責修正第七批，OpenSpec change document-access-scope-alignment）：複製訂單的操作者依活動清單，
// 新訂單的接單業務記執行複製的人。起點資料：鏈一 ORD-2026-0601（訂單完成，接單業務洪嘉駿，陳映蓉為編輯層級分享成員）、
// 鏈四 ORD-2026-0820（陳映蓉為檢視層級分享成員）。情境依據：訂單複製建單；訂單審核活動清單（ACT-APV-017 至 019）。
test.describe.configure({ timeout: 240_000 });

const searchOrder = async (page, no) => {
  const search = page.getByPlaceholder(/請輸入訂單編號/);
  await search.fill(no);
  await search.press('Enter');
  await expect(rowOf(page, no)).toBeVisible();
};

// 確認複製：對話框寫明帶入與不帶入的範圍，按「確認複製」後導向新訂單詳情
const confirmCopy = async (page) => {
  const box = dialog(page);
  await expect(box).toContainText('複製訂單');
  await expect(box).toContainText('收款項目');
  await button(box, '確認複製').click();
  await expect(page).toHaveURL(/\/orders\/detail\/?\?id=ORD-\d{4}-\d{4}/, { timeout: 20_000 });
};

const salesPersonValue = (page) =>
  page
    .locator('.ant-descriptions-item-label')
    .filter({ hasText: '接單業務' })
    .first()
    .locator('xpath=following-sibling::*[1]');

test('2.28 業務乙被分享（編輯）後在訂單列表複製訂單完成的訂單：新單為草稿，接單業務是業務乙，來源訂單留衍生紀錄', async ({ page }) => {
  await openAs(page, '業務（陳映蓉）', '/orders');
  await searchOrder(page, 'ORD-2026-0601');
  await rowOf(page, 'ORD-2026-0601').getByRole('button', { name: '複製訂單' }).click();
  await confirmCopy(page);

  // 新訂單：草稿；資訊頁籤的接單業務是陳映蓉；收款項目不帶入由純函式測試驗；活動紀錄寫複製來源
  await expect(orderHeader(page)).toContainText('草稿');
  await expect(orderHeader(page)).not.toContainText('ORD-2026-0601');
  await openTab(page, '資訊');
  await expect(salesPersonValue(page)).toContainText('陳映蓉');
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-timeline-item-content').filter({ hasText: '複製自 ORD-2026-0601' })).toHaveCount(1);

  // 來源訂單的活動紀錄多一筆衍生
  await gotoInApp(page, '/orders');
  await openByNo(page, 'ORD-2026-0601');
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-timeline-item-content').filter({ hasText: '衍生出新訂單' })).toHaveCount(1);
});

test('2.28 訂單管理人在訂單詳情複製：新訂單的接單業務是訂單管理人；接單業務的洪嘉駿與協助角色都看得到複製入口', async ({ page }) => {
  await openAs(page, '訂單管理人', '/orders/detail?id=ORD-2026-0601');
  await expect(orderHeader(page)).toContainText('訂單完成');
  await expect(button(page, '複製訂單')).toBeVisible();
  // 接單業務與其餘五個全公司協助角色同樣有入口
  for (const role of ['業務', '業務主管', '印務主管', '印務', '審稿主管', 'Supervisor']) {
    await switchRole(page, role);
    await expect(orderHeader(page)).toContainText('訂單完成', { timeout: 20_000 });
    await expect(button(page, '複製訂單'), role).toBeVisible();
  }
  await switchRole(page, '訂單管理人');
  await expect(orderHeader(page)).toContainText('訂單完成', { timeout: 20_000 });
  await button(page, '複製訂單').click();
  await confirmCopy(page);
  await expect(orderHeader(page)).toContainText('草稿');
  await openTab(page, '資訊');
  await expect(salesPersonValue(page)).toContainText('黃聖雯');
});

test('2.28 檢視層級分享成員看不到複製訂單：列表列上與詳情頁都沒有；業務乙在被分享（編輯）的訂單有', async ({ page }) => {
  // 業務乙陳映蓉對 ORD-2026-0820 是檢視層級
  await openAs(page, '業務（陳映蓉）', '/orders');
  await searchOrder(page, 'ORD-2026-0820');
  await expect(rowOf(page, 'ORD-2026-0820').getByRole('button', { name: '複製訂單' })).toHaveCount(0);
  await openByNo(page, 'ORD-2026-0820');
  await expect(orderHeader(page)).toContainText('ORD-2026-0820');
  await expect(button(page, '複製訂單')).toHaveCount(0);

  // 對 ORD-2026-0601 是編輯層級：詳情頁有複製訂單
  await gotoInApp(page, '/orders');
  await openByNo(page, 'ORD-2026-0601');
  await expect(orderHeader(page)).toContainText('ORD-2026-0601');
  await expect(button(page, '複製訂單')).toBeVisible();
});
