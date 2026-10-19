import { test, expect } from '@playwright/test';
import { openAs, cjkName } from '../_helpers.mjs';
import { gotoInAppSafe, switchRoleSafe } from '../11-qc/_setup.mjs';
import { dialog, pickOption, toastText } from './_local.mjs';

// 單據權責修正第六批（OpenSpec change document-access-scope-alignment）：帳務清單與輸出。
// 訂單詳情內的收款項目、發票與折讓、款項紀錄、訂單異動依訂單編輯權（自己負責、被分享（編輯）、六個全公司協助角色）；
// 核可、退回與取消已認列的訂單異動限該訂單的審核業務主管本人；四張跨訂單清單依檢視活動清單過濾；
// 匯出對帳明細給看得到應收款項清單的人，匯出待退款報表限業務主管、會計、Supervisor。
// 起點資料：ORD-2026-0820（鏈四，接單業務洪嘉駿，陳映蓉檢視層級分享）、ORD-2026-0815（鏈三，洪嘉駿，蘇怡君編輯層級分享，
// 訂金 10,584 已收已開票、尾款 24,696 未開立；審核業務主管林雅婷）、ORD-2026-0601（鏈一，陳映蓉編輯層級分享）。
// 依據：收款項目規劃、收款項目開立發票、收款核銷、訂單異動、訂單與帳務檢視、輸出活動清單；受控清單 § 訂單關聯單據的編輯權。

test.describe.configure({ timeout: 180_000 });

const ORDER_0820 = '/orders/detail?id=ORD-2026-0820&tab=paymentPlan';
const ORDER_0815 = '/orders/detail?id=ORD-2026-0815&tab=paymentPlan';
const HELPER_ROLES = ['業務主管', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor'];

const btn = (page, name) => page.getByRole('button', { name });
const iconBtn = (page, label) => page.getByRole('button', { name: label, exact: true });

// 帳務頁籤的七個入口：新增收款項目、新增款項、開立發票（收款項目列）、開立折讓單與作廢發票（發票列）、款項紀錄操作
async function expectBillingEntries(page, visible) {
  const count = visible ? 1 : 0;
  await expect(btn(page, cjkName('新增收款項目'))).toHaveCount(count);
  await expect(btn(page, cjkName('新增款項'))).toHaveCount(count);
  // 收款項目列的「開立發票」圖示鈕（尾款期未開立，列上有；訂金期已開立）
  if (visible) await expect(iconBtn(page, '開立發票').first()).toBeVisible();
  else await expect(iconBtn(page, '開立發票')).toHaveCount(0);
}

async function openAdjustmentsTab(page) {
  await page.locator('.ant-tabs-tab', { hasText: '訂單異動' }).click();
  await expect(page.getByText('尚無訂單異動').or(page.locator('tr.ant-table-row').first())).toBeVisible();
}
async function openBillingTab(page) {
  await page.locator('.ant-tabs-tab', { hasText: '金額與發票' }).click();
  await expect(page.getByText('收款項目', { exact: true }).first()).toBeVisible();
}

// 建立一筆退款類訂單異動（退印）：建立後為草稿
async function createRefundAdjustment(page, amount) {
  await btn(page, cjkName('建立訂單異動')).click();
  const form = dialog(page);
  await expect(form).toBeVisible();
  await pickOption(page, form.getByLabel('異動類型'), '退印（只能退款）');
  await form.getByLabel(/異動金額/).fill(String(amount));
  await form.getByLabel('異動原因').fill('客戶減印，退還部分款項');
  await form.getByRole('button', { name: cjkName('建立') }).click();
  // 建立前二次確認
  const confirm = page.locator('.ant-modal-confirm').last();
  await expect(page.getByText('確認建立訂單異動？').last()).toBeVisible();
  await confirm.getByRole('button', { name: cjkName('建立') }).click();
  await toastText(page, /訂單異動已建立（草稿）/);
}

const adjustmentRow = (page) => page.locator('tr.ant-table-row').first();

/**
 * 前置：ORD-2026-0815 上留下一筆已認列（確認可執行）的退款訂單異動，應收總額 35,280 降為 7,280，發票淨額 10,584 大於應收。
 * 流程跨角色：編輯層級的諮詢乙建立並送審 → 審核業務主管林雅婷核可 → 諮詢乙確認生效。整頁載入只在第一步。
 */
async function buildRecognizedRefund(page) {
  await openAs(page, '諮詢（蘇怡君）', `${ORDER_0815.replace('paymentPlan', 'adjustments')}`);
  await expect(page.getByText('尚無訂單異動')).toBeVisible();
  await createRefundAdjustment(page, -28000);
  await expect(adjustmentRow(page)).toContainText('草稿');
  await iconBtn(page, '送審').click();
  await expect(adjustmentRow(page)).toContainText('待主管審核');
  await switchRoleSafe(page, '業務主管');
  await iconBtn(page, '核可').click();
  await expect(adjustmentRow(page)).toContainText('已核可');
  await switchRoleSafe(page, '諮詢（蘇怡君）');
  await iconBtn(page, '確認生效').click();
  await expect(adjustmentRow(page)).toContainText('確認可執行');
}

test('3.24 檢視層級的分享成員看得到帳務、沒有任何帳務入口；接單業務與業務主管有', async ({ page }) => {
  // 業務乙陳映蓉是 ORD-2026-0820 的檢視層級分享成員：看得到對帳面板與收款項目，沒有新增、開立、作廢入口
  await openAs(page, '業務（陳映蓉）', ORDER_0820);
  await expect(page.getByText('收款項目', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('款項紀錄', { exact: true }).first()).toBeVisible();
  await expectBillingEntries(page, false);
  await expect(iconBtn(page, '開立折讓單')).toHaveCount(0);
  await expect(iconBtn(page, '作廢發票')).toHaveCount(0);
  await expect(iconBtn(page, '取消收款項目')).toHaveCount(0);

  // 業務主管全公司協助：登錄款項、新增收款項目、開立發票
  await switchRoleSafe(page, '業務主管');
  await expectBillingEntries(page, true);

  // 接單業務洪嘉駿自己負責：同樣有
  await switchRoleSafe(page, '業務');
  await expectBillingEntries(page, true);

  // 六個協助角色都有
  for (const role of HELPER_ROLES) {
    await switchRoleSafe(page, role);
    await expectBillingEntries(page, true);
  }

  // 會計不在訂單模組：停在訂單詳情切成會計被導回，不留帳務內容
  await switchRoleSafe(page, '會計');
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
});

test('3.24 編輯層級的分享成員（諮詢乙）可登錄款項與開立發票；非負責又未被分享的業務直連被導回', async ({ page }) => {
  // 諮詢乙蘇怡君不是 ORD-2026-0815 的接單業務，但是編輯層級分享成員：帳務入口與接單業務一樣
  await openAs(page, '諮詢（蘇怡君）', ORDER_0815);
  await expectBillingEntries(page, true);

  // 登錄一筆處理中的款項：款項紀錄多一列（驗證入口不只是顯示、真的做得下去）
  await btn(page, cjkName('新增款項')).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await pickOption(page, modal.getByLabel('付款方式'), '銀行轉帳');
  await modal.getByLabel(/收款金額（含稅）/).fill('1000');
  await modal.getByRole('button', { name: cjkName('新增') }).click();
  await toastText(page, /已新增款項紀錄/);

  // 業務乙陳映蓉不是 ORD-2026-0815 的接單業務、也沒被分享：看不到這張訂單，直連被導回
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
});

test('3.25 被分享訂單的待開發票期次列在清單；業務在應收款項看全公司、待開發票只看自己負責與被分享', async ({ page }) => {
  // 諮詢乙蘇怡君只被分享 ORD-2026-0815（編輯層級）：待開發票清單只有這張
  await openAs(page, '諮詢（蘇怡君）', '/payment/pending-invoice');
  await expect(page.getByRole('cell', { name: 'ORD-2026-0815', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ORD-2026-0710', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'ORD-2026-0820', exact: true })).toHaveCount(0);

  // 同一位諮詢乙在應收款項看全公司
  await gotoInAppSafe(page, '/payment/receivable');
  for (const no of ['ORD-2026-0710', 'ORD-2026-0815', 'ORD-2026-0820']) {
    await expect(page.getByRole('cell', { name: no, exact: true })).toBeVisible();
  }

  // 業務乙陳映蓉只被分享 ORD-2026-0820（檢視層級）與 ORD-2026-0601（編輯層級）：待開發票只有 0820
  await switchRoleSafe(page, '業務（陳映蓉）');
  await gotoInAppSafe(page, '/payment/pending-invoice');
  await expect(page.getByRole('cell', { name: 'ORD-2026-0820', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'ORD-2026-0815', exact: true })).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'ORD-2026-0710', exact: true })).toHaveCount(0);

  // 業務主管看全公司待開發票
  await switchRoleSafe(page, '業務主管');
  for (const no of ['ORD-2026-0710', 'ORD-2026-0815', 'ORD-2026-0820']) {
    await expect(page.getByRole('cell', { name: no, exact: true }).first()).toBeVisible();
  }
});

test('3.25 沒有清單檢視列的角色側欄沒有款項管理，直連四張清單被導回預設頁', async ({ page }) => {
  for (const role of ['印務', '訂單管理人', '生管', '審稿人員']) {
    for (const path of ['/payment/receivable', '/payment/pending-invoice', '/payment/refund-payout', '/payment/billing-anomaly']) {
      await openAs(page, role, path);
      await expect(page).not.toHaveURL(/\/payment\//, { timeout: 15_000 });
    }
    await expect(page.locator('.ant-menu-item[data-menu-id$="-/payment/receivable"]')).toHaveCount(0);
  }
});

test('3.26 會計從帳務異常清單對帳：列出差額、訂單編號不是連結；有訂單檢視的角色才有連結', async ({ page }) => {
  // 前置：ORD-2026-0815 留下已認列的退款異動，發票淨額 10,584 大於應收總額 7,280，進帳務異常清單
  await buildRecognizedRefund(page);

  await switchRoleSafe(page, '會計');
  await gotoInAppSafe(page, '/payment/billing-anomaly');
  const row = page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0815' });
  await expect(row).toBeVisible();
  await expect(row).toContainText('發票待折讓或作廢');
  // 會計沒有訂單檢視：訂單編號只是文字
  await expect(row.locator('a')).toHaveCount(0);

  // 業務主管有訂單檢視：同一列的訂單編號是連結
  await switchRoleSafe(page, '業務主管');
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0815' }).locator('a')).toHaveCount(1);

  // 業務乙陳映蓉不是 ORD-2026-0815 的接單業務也沒被分享：異動後的異常清單看不到這張
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0815' })).toHaveCount(0);

  // 被分享（編輯）的諮詢乙看得到、也點得進去
  await switchRoleSafe(page, '諮詢（蘇怡君）');
  await expect(page.locator('tr.ant-table-row', { hasText: 'ORD-2026-0815' }).locator('a')).toHaveCount(1);
});

test('3.27 業務可匯出對帳明細；待退款報表只給業務主管、會計、Supervisor', async ({ page }) => {
  // 應收款項清單的「匯出逐張發票明細」即匯出對帳明細：看得到清單的角色都有
  await openAs(page, '業務', '/payment/receivable');
  for (const role of ['業務', '諮詢', '業務主管', '會計', 'Supervisor']) {
    if (role !== '業務') await switchRoleSafe(page, role);
    await expect(page.getByRole('cell', { name: 'ORD-2026-0710', exact: true })).toBeVisible();
    await expect(btn(page, '匯出逐張發票明細')).toHaveCount(1);
  }
  await btn(page, '匯出逐張發票明細').click();
  await toastText(page, /匯出逐張發票明細/);

  // 待退款清單：業務、諮詢看得到清單、沒有匯出；業務主管、會計、Supervisor 有匯出
  await gotoInAppSafe(page, '/payment/refund-payout');
  for (const role of ['Supervisor', '會計', '業務主管', '諮詢', '業務']) {
    if (role !== 'Supervisor') await switchRoleSafe(page, role);
    await expect(page.getByText('待出金筆數')).toBeVisible();
    await expect(btn(page, '匯出出金報表')).toHaveCount(['Supervisor', '會計', '業務主管'].includes(role) ? 1 : 0);
  }
  await switchRoleSafe(page, '會計');
  await btn(page, '匯出出金報表').click();
  await toastText(page, /匯出對齊會計既有 Excel 表版面/);
});

test('3.28 訂單異動：檢視層級不能建立；協助角色可建立並送審；非負責業務看不到這張訂單', async ({ page }) => {
  // 業務乙陳映蓉是 ORD-2026-0820 的檢視層級分享成員：看得到訂單異動頁籤，沒有建立入口
  await openAs(page, '業務（陳映蓉）', ORDER_0820.replace('paymentPlan', 'adjustments'));
  await expect(page.getByText('尚無訂單異動')).toBeVisible();
  await expect(btn(page, cjkName('建立訂單異動'))).toHaveCount(0);

  // 接單業務洪嘉駿與業務主管有建立入口
  for (const role of ['業務', '業務主管']) {
    await switchRoleSafe(page, role);
    await expect(btn(page, cjkName('建立訂單異動'))).toHaveCount(1);
  }

  // 訂單管理人（協助角色）建立並送審
  await switchRoleSafe(page, '訂單管理人');
  await createRefundAdjustment(page, -1000);
  await expect(adjustmentRow(page)).toContainText('草稿');
  await iconBtn(page, '送審').click();
  await expect(adjustmentRow(page)).toContainText('待主管審核');

  // 檢視層級的陳映蓉看得到這筆，沒有任何操作鈕
  await switchRoleSafe(page, '業務（陳映蓉）');
  await expect(adjustmentRow(page)).toContainText('待主管審核');
  for (const name of ['送審', '核可', '退回', '取消', '編輯', '確認生效']) {
    await expect(iconBtn(page, name)).toHaveCount(0);
  }

  // 未認列的取消：協助角色（印務主管）與接單業務可取消；核可與退回仍不給他們
  await switchRoleSafe(page, '印務主管');
  await expect(iconBtn(page, '取消')).toHaveCount(1);
  await expect(iconBtn(page, '核可')).toHaveCount(0);
  await expect(iconBtn(page, '退回')).toHaveCount(0);
  await switchRoleSafe(page, '業務');
  await expect(iconBtn(page, '取消')).toHaveCount(1);

  // 會計不在訂單模組：切過去被導回
  await switchRoleSafe(page, '會計');
  await expect(page).not.toHaveURL(/\/orders\/detail/, { timeout: 15_000 });
});

test('3.28 審核類不隨編輯權開放：核可、退回與取消已認列的訂單異動只有審核業務主管本人有', async ({ page }) => {
  // 前置：ORD-2026-0815 一筆待主管審核的退款訂單異動（諮詢乙建立並送審）
  await openAs(page, '諮詢（蘇怡君）', ORDER_0815.replace('paymentPlan', 'adjustments'));
  await createRefundAdjustment(page, -28000);
  await iconBtn(page, '送審').click();
  await expect(adjustmentRow(page)).toContainText('待主管審核');

  // 編輯分享成員與六個協助角色（業務主管除外）沒有核可與退回
  for (const role of ['諮詢（蘇怡君）', '業務', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor']) {
    await switchRoleSafe(page, role);
    await expect(iconBtn(page, '核可')).toHaveCount(0);
    await expect(iconBtn(page, '退回')).toHaveCount(0);
  }

  // 審核業務主管林雅婷有核可與退回
  await switchRoleSafe(page, '業務主管');
  await expect(iconBtn(page, '核可')).toHaveCount(1);
  await expect(iconBtn(page, '退回')).toHaveCount(1);
  await iconBtn(page, '核可').click();
  await expect(adjustmentRow(page)).toContainText('已核可');

  // 諮詢乙確認生效：金額認列進應收總額
  await switchRoleSafe(page, '諮詢（蘇怡君）');
  await iconBtn(page, '確認生效').click();
  await expect(adjustmentRow(page)).toContainText('確認可執行');

  // 已認列的取消：編輯分享成員與其餘協助角色沒有取消；審核業務主管本人有，取消原因必填
  for (const role of ['諮詢（蘇怡君）', '業務', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor']) {
    await switchRoleSafe(page, role);
    await expect(iconBtn(page, '取消')).toHaveCount(0);
  }
  await switchRoleSafe(page, '業務主管');
  await expect(iconBtn(page, '取消')).toHaveCount(1);
  await iconBtn(page, '取消').click();
  const cancelDialog = dialog(page);
  await expect(cancelDialog.getByText('取消已生效的訂單異動？')).toBeVisible();
  await cancelDialog.getByRole('button', { name: cjkName('確認取消') }).click();
  await toastText(page, /取消訂單異動必須填寫原因/);
  await cancelDialog.getByPlaceholder('請填寫取消原因（必填）').fill('客戶改回原金額');
  await cancelDialog.getByRole('button', { name: cjkName('確認取消') }).click();
  await toastText(page, /訂單異動已取消/);
  await expect(adjustmentRow(page)).toContainText('已取消');
});
