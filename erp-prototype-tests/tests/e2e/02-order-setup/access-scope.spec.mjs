import { test, expect } from '@playwright/test';
import { gotoInApp, openAs, switchRole } from '../_helpers.mjs';
import {
  button,
  dialog,
  openByNo,
  openTab,
  orderHeader,
  panelSection,
  pickOption,
  submit0814ForReview,
} from './_local.mjs';

// 單據權責修正（wiki 活動清單卡為判準，OpenSpec change document-access-scope-alignment 第一批）：
// 側欄入口、列表範圍、詳情頁直連與分享候選，都依檢視活動清單的同一份活動列判定。
// 情境依據：單據存取流程群組（訂單與帳務檢視活動清單）、分享與職務代理活動清單、受控清單 § 未列即不可做。

// 讀開著的下拉裡全部候選：AntD 下拉是虛擬捲動，只渲染可見的一段，分上、中、下三段讀再合併
async function dropdownTitles(page) {
  const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();
  await expect(dropdown).toBeVisible();
  const holder = dropdown.locator('.rc-virtual-list-holder');
  const seen = new Set();
  for (const ratio of [0, 0.5, 1]) {
    // 候選少時下拉不虛擬捲動、沒有捲動容器，直接讀
    if (await holder.count()) {
      await holder.evaluate((el, r) => {
        el.scrollTop = (el.scrollHeight - el.clientHeight) * r;
      }, ratio);
      await page.waitForTimeout(250);
    }
    const titles = await dropdown
      .locator('.ant-select-item-option')
      .evaluateAll((els) => els.map((e) => e.getAttribute('title')));
    titles.filter(Boolean).forEach((t) => seen.add(t));
  }
  return [...seen];
}

test('2.20 會計不在訂單模組：直連訂單詳情被導回，側欄沒有訂單管理，款項清單的訂單編號不是連結', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈二 ORD-2026-0710；會計沒有任何訂單的檢視活動，只有四張跨訂單清單
  // 情境一：直接開訂單詳情網址（整頁載入後以會計身分停在該頁，等同直連）
  await openAs(page, '會計', '/orders/detail?id=ORD-2026-0710');
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
  // 導回會計的預設頁面（會計側欄的第一張清單），畫面不出現訂單詳情內容
  await expect(page).toHaveURL(/\/payment\/pending-invoice/);
  await expect(page.getByRole('tab', { name: /印件與其他費用|分享/ })).toHaveCount(0);

  // 情境二：側欄沒有訂單管理群組；款項管理群組有四張清單
  await expect(page.locator('.ant-menu-submenu-title', { hasText: '訂單管理' })).toHaveCount(0);
  const paymentGroup = page.locator('.ant-menu-submenu-title', { hasText: '款項管理' });
  await expect(paymentGroup).toHaveCount(1);
  await expect(page.locator('.ant-menu-item', { hasText: '待開發票' })).toBeVisible();
  for (const label of ['應收款項', '待退款', '帳務異常']) {
    await expect(page.locator('.ant-menu-item', { hasText: label })).toHaveCount(1);
  }

  // 情境三：應收款項清單列上的訂單編號只是文字，不是通往訂單詳情的連結
  await gotoInApp(page, '/payment/receivable');
  await expect(page.getByRole('cell', { name: 'ORD-2026-0710', exact: true })).toBeVisible();
  await expect(page.locator('tbody a', { hasText: 'ORD-2026-0710' })).toHaveCount(0);
});

test('2.21 業務只看自己負責與被分享的訂單：直連別人的訂單被導回，被分享（檢視）的訂單可進', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：業務乙陳映蓉不是任何 mock 訂單的接單業務；ORD-2026-0820 以檢視層級分享給她，ORD-2026-0815 沒有
  await openAs(page, '業務（陳映蓉）', '/orders/detail?id=ORD-2026-0815');
  // 直連別人的訂單：被導回業務的預設頁面，畫面不出現該訂單
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
  await expect(page).toHaveURL(/\/quote-prototype/);
  await expect(page.locator('body')).not.toContainText('ORD-2026-0815');

  // 訂單列表只列被分享的 ORD-2026-0820，不列 ORD-2026-0815
  await gotoInApp(page, '/orders');
  const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
  await search.fill('ORD-2026-0815');
  await search.press('Enter');
  await expect(page.getByText('ORD-2026-0815', { exact: true })).toHaveCount(0);
  await search.fill('ORD-2026-0820');
  await search.press('Enter');
  await expect(page.getByText('ORD-2026-0820', { exact: true }).first()).toBeVisible();

  // 被分享（檢視）的訂單進得了詳情頁
  await openByNo(page, 'ORD-2026-0820');
  await expect(page).toHaveURL(/\/orders\/detail/);
  await expect(page.getByRole('tab', { name: /分享/ })).toBeVisible();
});

test('2.26 印務主管、印務、審稿主管的側欄有訂單管理，訂單列表看全公司', async ({ page }) => {
  test.setTimeout(180_000);
  // 起點：全部 mock 訂單的接單業務都是洪嘉駿；三個角色不是分享成員
  await openAs(page, '印務主管', '/quote-prototype');
  for (const role of ['印務主管', '印務', '審稿主管']) {
    await switchRole(page, role);
    await expect(page.locator('.ant-menu-submenu-title', { hasText: '訂單管理' })).toHaveCount(1);
    await gotoInApp(page, '/orders');
    const search = page.getByRole('textbox', { name: /請輸入訂單編號/ });
    for (const orderNo of ['ORD-2026-0601', 'ORD-2026-0710']) {
      await search.fill(orderNo);
      await search.press('Enter');
      await expect(page.getByText(orderNo, { exact: true }).first()).toBeVisible();
    }
    await search.fill('');
    await search.press('Enter');
  }
});

test('2.27 訂單的分享候選：業務、諮詢與全公司協助角色，不含會計與生管', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點：鏈二 ORD-2026-0710（接單業務洪嘉駿，分享成員張惠雯）
  await openAs(page, '業務', '/orders');
  await openByNo(page, 'ORD-2026-0710');
  await openTab(page, '分享');
  await button(page, '新增分享成員').click();
  const addPanel = dialog(page);
  await addPanel.locator('.ant-select').nth(0).click();
  const titles = await dropdownTitles(page);

  // 審稿主管、印務主管、訂單管理人、Supervisor、業務、諮詢都在候選裡
  for (const name of ['魏彣軒', '吳國豪', '黃聖雯', '王大明', '陳映蓉', '蘇怡君', '林雅婷']) {
    expect(titles, `候選應含 ${name}`).toContain(name);
  }
  // 會計與生管不在候選裡；接單業務本人與既有成員也不在
  for (const name of ['陳美玲', '許文傑', '鄭宇翔', '洪嘉駿', '張惠雯']) {
    expect(titles, `候選不應含 ${name}`).not.toContain(name);
  }
});

test('2.20 六個全公司協助角色在訂單詳情有編輯入口：業務主管、訂單管理人、印務主管、印務、審稿主管、Supervisor', async ({ page }) => {
  test.setTimeout(240_000);
  // 起點：鏈二 ORD-2026-0710（製作中，接單業務洪嘉駿），六個角色都不是接單業務、也不是分享成員
  await openAs(page, '業務主管', '/orders');
  await openByNo(page, 'ORD-2026-0710');
  for (const role of ['業務主管', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor']) {
    await switchRole(page, role);
    await openTab(page, '資訊');
    // 訂單備註、發票與收款兩塊的編輯鈕都在（協助角色做得到接單業務能做的操作）
    await expect(button(panelSection(page, '訂單備註'), '編輯'), `${role} 訂單備註編輯`).toBeVisible();
    await expect(button(panelSection(page, '發票與收款'), '編輯'), `${role} 發票與收款編輯`).toBeVisible();
  }
  // 反向：會計直連被導回（見上一則），審稿人員沒有訂單檢視活動，停在詳情頁被導回
  await switchRole(page, '審稿人員');
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
});

// 在分享頁籤新增一位分享成員並指定層級
async function shareOrderTo(page, name, levelLabel) {
  await openTab(page, '分享');
  await button(page, '新增分享成員').click();
  const addPanel = dialog(page);
  await pickOption(page, addPanel.locator('.ant-select').nth(0), name);
  await pickOption(page, addPanel.locator('.ant-select').nth(1), levelLabel);
  await button(addPanel, '新增').click();
  await expect(page.getByText('已新增分享成員').last()).toBeVisible();
}

test('2.23 諮詢乙被分享（編輯）他人的草稿訂單後可送主管審核；業務乙被分享後直連可進', async ({ page }) => {
  test.setTimeout(240_000);
  // 起點：鏈八 ORD-2026-0814（草稿，接單業務洪嘉駿）。前置：接單業務把訂單以編輯（代理）分享給諮詢乙蘇怡君與業務乙陳映蓉
  await openAs(page, '業務', '/orders');
  await openByNo(page, 'ORD-2026-0814');
  await shareOrderTo(page, '蘇怡君', '編輯（代理）');
  await shareOrderTo(page, '陳映蓉', '編輯（代理）');

  // 業務乙停在這張訂單的詳情頁：被分享後可進，畫面不導回，送主管審核鈕顯示（條件不齊時停用）
  await switchRole(page, '業務（陳映蓉）');
  await expect(page).toHaveURL(/\/orders\/detail/);
  await expect(orderHeader(page)).toContainText('ORD-2026-0814');
  await expect(button(page, '送主管審核')).toHaveCount(1);

  // 諮詢乙補齊送審條件並送主管審核，訂單推進至待業務主管審核，活動紀錄記實際操作者
  await switchRole(page, '諮詢（蘇怡君）');
  await submit0814ForReview(page);
  await openTab(page, '活動紀錄');
  await expect(page.locator('.ant-timeline-item-content').filter({ hasText: '送主管審核' }).first()).toContainText('蘇怡君');
});

test('2.25 訂單改派：Supervisor 與業務主管有入口、訂單完成可改派、已取消沒有入口、其他角色看不到', async ({ page }) => {
  test.setTimeout(300_000);
  const reassign = () => page.getByRole('button', { name: '改派' });
  // 起點：鏈二 ORD-2026-0710（製作中）
  await openAs(page, '業務主管', '/orders');
  await openByNo(page, 'ORD-2026-0710');
  await expect(reassign()).toHaveCount(1);
  await switchRole(page, 'Supervisor');
  await expect(reassign()).toHaveCount(1);
  // 業務、印務主管、訂單管理人、審稿主管雖看得到訂單、也能編輯，都沒有改派入口（管理類動作不隨編輯權開放）
  for (const role of ['業務', '印務主管', '訂單管理人', '審稿主管']) {
    await switchRole(page, role);
    await expect(reassign(), role).toHaveCount(0);
  }

  // 訂單完成：鏈一 ORD-2026-0601 仍可改派
  await switchRole(page, '業務主管');
  await gotoInApp(page, '/orders');
  await openByNo(page, 'ORD-2026-0601');
  await expect(orderHeader(page)).toContainText('訂單完成');
  await expect(reassign()).toHaveCount(1);
  await expect(reassign()).toBeEnabled();

  // 已取消：鏈八 ORD-2026-0814 取消後，業務主管與 Supervisor 都沒有改派入口
  await gotoInApp(page, '/orders');
  await openByNo(page, 'ORD-2026-0814');
  await expect(reassign().first()).toBeVisible();
  await button(page, '取消訂單').click();
  await page.locator('.ant-modal-confirm-btns').getByRole('button', { name: /確\s*定/ }).click();
  await expect(orderHeader(page)).toContainText('已取消');
  await expect(reassign()).toHaveCount(0);
  await switchRole(page, 'Supervisor');
  await expect(reassign()).toHaveCount(0);
});
