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
  await pickOption(page, panel.getByLabel('帳務公司'), '感官');
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
  await pickOption(page, itemPanel.getByLabel('印件屬性'), '大貨');
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

  // 印務主管填成本、業務按評估完成（評估完成由業務部門執行）
  await switchRole(page, '業務');
  await button(page, '評估完成').click();
  await dialog(page).getByRole('button', { name: /確\s*認/ }).click();
  await waitModalsClosed(page);
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

// ─── 送審條件相關（情境 2.1、2.2、2.14～2.17；change order-review-gate-invoice-draft-transfer-receipt）───

/** 填 AntD DatePicker：填入 YYYY-MM-DD 文字後按 Enter 確認（不開日曆面板點格子） */
export async function pickDate(input, value) {
  await input.click();
  await input.fill(value);
  await input.press('Enter');
}

export const submitButton = (page) => button(page, '送主管審核');

/**
 * 送審缺項文字。畫面約定（tasks 4.1 實作依此）：條件不齊時「送主管審核」停用，
 * 操作列旁出現一段含「尚缺」的文字，缺項依序以頓號分隔
 * （訂單須知、交貨備註、付款備註、收款條件備註、至少一期收款項目）。
 */
export const reviewMissing = (page) => page.getByText(/尚缺/).first();

/** 業務在資訊頁籤的「訂單備註」側板填指定欄位（訂單須知 order_note、交貨備註 delivery_note、付款備註 payment_note） */
export async function editOrderNotes(page, values) {
  await openTab(page, '資訊');
  const panel = drawer(page);
  await clickOpen(button(panelSection(page, '訂單備註'), '編輯'), panel.locator('#delivery_note'));
  for (const [key, value] of Object.entries(values)) {
    await panel.locator(`#${key}`).fill(value);
  }
  await button(panel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();
  await waitModalsClosed(page);
}

/** 業務在資訊頁籤的「發票與收款」側板填收款條件備註 */
export async function editPaymentTermsNote(page, text) {
  await openTab(page, '資訊');
  const panel = drawer(page);
  await clickOpen(button(panelSection(page, '發票與收款'), '編輯'), panel.locator('#payment_terms_note'));
  await panel.locator('#payment_terms_note').fill(text);
  await button(panel, '確認').click();
  await expect(page.getByText('已更新發票與收款').last()).toBeVisible();
  await waitModalsClosed(page);
}

/** 業務在金額與發票頁籤新增一期收款項目 */
export async function addInstallment(
  page,
  { description, amount, paidDate = '2026-10-30', issueDate = '2026-10-20' },
) {
  await openTab(page, '金額與發票');
  const modal = dialog(page);
  await clickOpen(button(page, '新增收款項目'), modal.getByLabel('描述'));
  await modal.getByLabel('描述').fill(description);
  await modal.getByLabel('預計金額（含稅）').fill(String(amount));
  await pickOption(page, modal.getByLabel('預計收款方式'), '銀行轉帳');
  await pickDate(modal.getByLabel('預計收款日'), paidDate);
  await pickDate(modal.getByLabel('預計開立發票日'), issueDate);
  await modal.getByRole('button', { name: spaced('建立期次') }).click();
  await expect(page.getByText(`已新增收款項目「${description}」`).last()).toBeVisible();
  await waitModalsClosed(page);
}

/** 業務在金額與發票頁籤取消一期收款項目並填原因 */
export async function cancelInstallment(page, description, reason) {
  await openTab(page, '金額與發票');
  const row = page.locator('tr', { hasText: description }).first();
  const modal = dialog(page);
  await clickOpen(row.getByRole('button', { name: '取消收款項目' }), modal.getByLabel(/原因/));
  await modal.getByLabel(/原因/).fill(reason);
  await modal.getByRole('button', { name: spaced('確認取消') }).click();
  await expect(page.getByText('已取消收款項目').last()).toBeVisible();
  await waitModalsClosed(page);
}

/**
 * 前置：ORD-2026-0814 補齊送審條件（同情境 2.1 起點資料的前置）——
 * 補填交貨備註與收款條件備註，新增兩期收款項目（訂金 3,938、尾款 9,188）。
 * 呼叫前頁面須已停在 ORD-2026-0814 詳情、身分為業務。
 */
export const ORDER_0814_INSTALLMENTS = [
  { description: '訂金', amount: 3938, paidDate: '2026-10-20', issueDate: '2026-10-15' },
  { description: '尾款', amount: 9188, paidDate: '2026-11-20', issueDate: '2026-11-15' },
];
export const ORDER_0814_DELIVERY_NOTE = '宅配至青硯文具倉庫，收貨前電話聯絡許小姐';
export const ORDER_0814_TERMS_NOTE = '訂金 30% 回簽後匯款、尾款出貨前結清';

export async function completeReviewConditions0814(page) {
  await editOrderNotes(page, { delivery_note: ORDER_0814_DELIVERY_NOTE });
  await editPaymentTermsNote(page, ORDER_0814_TERMS_NOTE);
  for (const item of ORDER_0814_INSTALLMENTS) await addInstallment(page, item);
}

/** 前置：補齊送審條件後送主管審核，停在待業務主管審核（審核業務主管林雅婷） */
export async function submit0814ForReview(page) {
  await completeReviewConditions0814(page);
  await submitButton(page).click();
  await expect(orderHeader(page)).toContainText('待業務主管審核');
}

/**
 * 前置：需求單轉來的草稿單補齊送審條件（四格備註各填一段、新增一期收款項目），
 * 讓沿用 buildDraftOrder 的情境在送審條件上線後照樣送得出審核。
 */
export async function fillReviewConditions(page, { amount }) {
  await editOrderNotes(page, {
    order_note: '印刷色差以打樣為準',
    delivery_note: '自取',
    payment_note: '匯款後請提供後五碼',
  });
  await editPaymentTermsNote(page, '訂金 30%，驗收後 30 天內付清');
  await addInstallment(page, { description: '全額', amount });
}

/**
 * 業務在訂單項目頁籤刪除一件印件。畫面約定（tasks 4.2 實作依此）：印件列操作欄有一顆
 * 「刪除印件」圖示鈕，按下出確認對話框，確認後印件列消失。
 */
export async function deletePrintItemRow(page, name) {
  await openTab(page, '訂單項目');
  const row = page.locator('tbody tr.ant-table-row').filter({ hasText: name }).first();
  const modal = dialog(page);
  await clickOpen(row.getByRole('button', { name: '刪除印件' }), modal);
  await modal.getByRole('button', { name: /刪\s*除|確\s*認/ }).last().click();
  await waitModalsClosed(page);
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: name })).toHaveCount(0);
}

/**
 * 業務在訂單項目頁籤刪除一筆其他費用列（情境 2.15 應收總額 0 段）。畫面約定：費用列操作欄
 * 有一顆「刪除項目」圖示鈕，按下出確認對話框。規則正本 wiki [[明細時點分界]] § 階段一
 * （其他費用含新增與刪除，終態前皆可）。
 */
export async function deleteFeeRow(page, description) {
  await openTab(page, '訂單項目');
  const row = page.locator('tbody tr.ant-table-row').filter({ hasText: description }).first();
  const modal = dialog(page);
  await clickOpen(row.getByRole('button', { name: '刪除項目' }), modal);
  await modal.getByRole('button', { name: /刪\s*除|確\s*認/ }).last().click();
  await waitModalsClosed(page);
  await expect(page.locator('tbody tr.ant-table-row').filter({ hasText: description })).toHaveCount(0);
}
