// 第二章（訂單成立與維護）專用工具。撰寫規約第 5 條：AntD 結構類名只在本檔使用。
// 本檔刻意不 import 其他章的工具檔——各章可獨立退役，跨章相依會讓刪一章就壞一片。
import { expect } from '@playwright/test';

export const spaced = (label) => new RegExp(`${label.split('').join('\\s*')}$`);
export const button = (scope, label) => scope.getByRole('button', { name: spaced(label) });

// 訂單資訊分區編輯（delivery-date-chain-alignment 新增「訂單資訊」編輯鈕）後，「訂單資訊」與
// 「訂單備註」兩個 PanelBlock 標題列的編輯鈕都未設 aria-label，可及名稱皆為圖示文字＋label 組合
// （如「edit 編輯」），單靠按鈕名互相混淆。改以各自 PanelBlock 標題（level 5 heading）所在的
// 標題列（最近一個含 button 子孫的祖先容器）定位，避開可及名稱組合方式的差異。
export const panelSection = (page, heading) =>
  page.getByRole('heading', { name: heading, level: 5 }).locator('xpath=ancestor::div[.//button][1]');
export const dialog = (page) => page.locator('.ant-modal-content:visible').last();
export const drawer = (page) => page.locator('.ant-drawer-content').last();

export async function clickOpen(clickTarget, appearTarget) {
  await expect(async () => {
    await clickTarget.click();
    await expect(appearTarget).toBeVisible({ timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30_000 });
}

export const rowOf = (scope, text) =>
  scope.locator('tbody tr.ant-table-row').filter({ hasText: text }).first();

const openDropdown = (page) =>
  page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').last();

const selectBox = (target) =>
  target.locator(
    "xpath=ancestor-or-self::div[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]",
  );

export async function pickOption(page, select, label) {
  await expect(async () => {
    const box = selectBox(select).first();
    if (!(await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').count())) await box.click();
    const option = openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first();
    await option.waitFor({ state: 'visible', timeout: 3000 });
    await option.scrollIntoViewIfNeeded({ timeout: 2000 });
    await option.click({ timeout: 3000 });
    await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0, { timeout: 3000 });
  }).toPass({ intervals: [500, 1000, 2000], timeout: 30000 });
}

export async function pickMulti(page, select, label) {
  await selectBox(select).first().click();
  await openDropdown(page).locator(`.ant-select-item-option[title="${label}"]`).first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toHaveCount(0);
}

export async function openTab(page, label) {
  await page.locator('.ant-tabs-tab', { hasText: label }).first().click();
}

export async function openByNo(page, no, urlPattern = /detail/) {
  // 列表依建立日期由新到舊分頁，較早的單可能在第二頁：先用搜尋框篩到該單再點（共用篩選元件按 Enter 才送出）
  const search = page.getByPlaceholder(/請輸入訂單編號|請輸入需求單號|請輸入/).first();
  if (await search.count()) {
    await search.fill(no);
    await search.press('Enter');
    await page.waitForTimeout(300);
  }
  const link = page.getByText(no, { exact: true }).first();
  for (let i = 0; i < 3; i += 1) {
    await link.click();
    try {
      await page.waitForURL(urlPattern, { timeout: 20_000 });
      return;
    } catch {
      // 沒換頁就再點一次
    }
  }
  throw new Error(`點了 ${no} 三次仍未進入詳情頁`);
}

export async function retry(fn, page, times = 3) {
  for (let i = 0; i < times; i += 1) {
    try {
      await fn();
      return;
    } catch (e) {
      if (i === times - 1) throw e;
      await page.waitForTimeout(800);
    }
  }
}

export async function goInApp(page, path, gotoInApp) {
  const esc = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${esc}/?(\\?|$)`);
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Escape').catch(() => {});
    await waitModalsClosed(page).catch(() => {});
    try {
      await gotoInApp(page, path);
      return;
    } catch (e) {
      try {
        await page.waitForURL(pattern, { timeout: 20_000 });
        return;
      } catch {
        if (i === 3) throw e;
      }
    }
  }
}

export async function toastText(page, pattern) {
  const notice = page.locator('.ant-message-notice-content').last();
  await expect(notice).toContainText(pattern ?? /./, { timeout: 15_000 });
  return notice.innerText();
}

export async function waitModalsClosed(page) {
  await expect(page.locator('.ant-modal-mask:visible')).toHaveCount(0);
  await expect(page.locator('.ant-drawer-mask:visible')).toHaveCount(0);
}

export const detailTitle = (page) =>
  page.getByRole('main').getByRole('heading', { level: 4 }).first();

export const orderHeader = (page) => detailTitle(page).locator('xpath=..');

export const quoteCurrentStep = (page) =>
  page.locator('.ant-steps-item-process .ant-steps-item-title');

export const activityItem = (page, text) =>
  page.locator('.ant-timeline-item-content').filter({ hasText: text });

export async function openScenario(page, roleLabel, path, { openAs, switchRole }) {
  try {
    await openAs(page, roleLabel, path);
  } catch {
    await retry(() => switchRole(page, roleLabel), page);
  }
}

// 上傳用的假檔（Upload 的 beforeUpload 一律回 false，只暫存不上傳）
export const fakeFile = (name, mimeType = 'application/pdf') => ({
  name,
  mimeType,
  buffer: Buffer.from(`fake ${name}`),
});

/**
 * 從需求單建一張新的草稿訂單（沿用主流程第 1、5 站的做法，濃縮成一件印件、單一角色接力）。
 * 回傳時已切回「業務」角色，頁面停在訂單詳情。
 */
export async function buildDraftOrder(page, { openAs, switchRole, gotoInApp }, { caseName, itemName, qty = '100', unitPrice = '50' }) {
  await openAs(page, '業務', '/quote-prototype');
  const panel = drawer(page);
  await clickOpen(button(page, '新增'), panel.getByLabel('需求案名'));
  await panel.getByLabel('需求案名').fill(caseName);
  await pickOption(page, panel.getByLabel('客戶'), '誠品書店股份有限公司');
  await pickOption(page, panel.getByLabel('詢價來源'), 'Line');
  await pickOption(page, panel.getByLabel('接單業務'), '洪嘉駿');
  await pickMulti(page, panel.getByLabel('評估印務主管'), '吳國豪');
  await pickOption(page, panel.getByLabel('帳務公司'), '感官SSP');
  await panel.getByLabel('收款條件備註').fill('訂金 30%，驗收後 30 天內付清');
  await button(panel, '確認').click();
  await waitModalsClosed(page);

  const listRow = rowOf(page, caseName);
  await expect(listRow.getByText('需求確認中', { exact: true })).toBeVisible();
  const quoteNo = (await listRow.innerText()).match(/Q-\d{8}-\d{2}/)[0];

  await page.getByRole('link', { name: quoteNo }).click();
  await expect(page).toHaveURL(/quote-prototype\/detail/, { timeout: 40_000 });
  const itemPanel = drawer(page);
  await clickOpen(button(page, '新增印件'), itemPanel.getByLabel('項目名稱'));
  await itemPanel.getByLabel('項目名稱').fill(itemName);
  await pickOption(page, itemPanel.getByLabel('印件類型'), '大貨');
  await itemPanel.getByLabel('數量').fill(qty);
  await pickOption(page, itemPanel.getByLabel('難易度'), '3');
  await itemPanel.getByLabel('單價（未稅）').fill(unitPrice);
  await button(itemPanel, '確認').click();
  await waitModalsClosed(page);
  await expect(page.getByText(itemName, { exact: true }).first()).toBeVisible();

  await button(page, '送印務評估').click();
  await switchRole(page, '印務主管');
  const editPanel = drawer(page);
  await clickOpen(rowOf(page, itemName).getByRole('button').first(), editPanel.getByLabel('成本估算（未稅）'));
  await editPanel.getByLabel('成本估算（未稅）').fill('20');
  await button(editPanel, '確認').click();
  await waitModalsClosed(page);
  await button(page, '評估完成').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);

  await switchRole(page, '業務');
  await button(page, '報價').click();
  await button(page, '成交').click();
  await expect(button(page, '建立訂單')).toBeVisible();

  await clickOpen(button(page, '建立訂單'), dialog(page).getByRole('button', { name: /確\s*認/ }));
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await expect(page).toHaveURL(/orders\/detail/, { timeout: 40_000 });
  const heading = await detailTitle(page).innerText();
  const orderNo = heading.match(/ORD-\d{4}-\d{4}/)[0];
  await expect(orderHeader(page)).toContainText('草稿');
  return orderNo;
}
