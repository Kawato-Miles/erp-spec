import { test, expect } from '@playwright/test';
import { openAs, switchRole } from '../_helpers.mjs';
import { gotoInAppPatiently as gotoInApp } from './_retry.mjs';

// 單據權責修正（OpenSpec change document-access-scope-alignment 第一批）：工單分享候選、介面用詞。
// 情境依據：分享與職務代理活動清單、受控清單 § 範圍用詞、角色卡 Supervisor。

test.setTimeout(90_000);

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

test('14.41 工單的分享候選：印務、印務主管、生管、訂單管理人、Supervisor、業務與諮詢', async ({ page }) => {
  // 起點資料：鏈五 WO-2026-0901（負責印務周建宏，既有分享成員蔡明修）
  await openAs(page, '印務', '/work-orders/detail?id=wo-2026-0901');
  // 詳情頁剛載入時第一次點頁籤可能落在尚未接上事件的節點：點到成員列出現為止
  await expect(async () => {
    await page.getByRole('tab', { name: /分享（1）/ }).click();
    await expect(page.locator('body')).toContainText('授予者 周建宏', { timeout: 4000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
  await page.getByRole('button', { name: '新增分享成員' }).click();
  const modal = page.locator('.ant-modal-content');
  await modal.locator('.ant-select').first().click();
  const titles = await dropdownTitles(page);

  // 業務與生管、諮詢、印務主管、訂單管理人、Supervisor 都在候選裡
  for (const name of ['陳映蓉', '許文傑', '鄭宇翔', '蘇怡君', '吳國豪', '黃聖雯', '王大明']) {
    expect(titles, `候選應含 ${name}`).toContain(name);
  }
  // 會計不在候選；負責人本人與既有成員也不在
  for (const name of ['陳美玲', '周建宏', '蔡明修']) {
    expect(titles, `候選不應含 ${name}`).not.toContain(name);
  }
  await page.getByRole('button', { name: /取\s*消/ }).click({ force: true });
});

test('14.42 介面用詞：角色名 Supervisor，介面不顯示權限名稱', async ({ page }) => {
  // 起點資料：Supervisor 王大明；所有生產任務頁
  await openAs(page, 'Supervisor', '/production-floor/dispatch');

  // 模擬角色下拉顯示「Supervisor（王大明）」，不再叫「主管」
  const header = page.locator('header, .ant-layout-header').first();
  await expect(header.locator('.ant-select-selection-item').first()).toContainText('Supervisor（王大明）');

  // 唯讀提示用 Supervisor，且不出現權限名稱
  await expect(page.getByText('Supervisor 在生產管理只有唯讀檢視').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('管理生產任務');

  // 其他角色在生產管理各頁的提示也不出現權限名稱
  await switchRole(page, '生管');
  for (const path of ['/production-floor/dispatch', '/production-floor/work-packages', '/production-floor/transfers']) {
    await gotoInApp(page, path);
    await expect(page.locator('body')).not.toContainText(/管理(生產任務|工作包|轉交單|待轉交任務|點收佇列)（/);
  }
});
