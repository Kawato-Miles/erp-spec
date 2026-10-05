import { test, expect } from '@playwright/test';
import { openAs, gotoInApp, cjkName } from '../_helpers.mjs';
import {
  button,
  dialog,
  drawer,
  installmentRow,
  invoiceTable,
  openOrderInApp,
  openTab,
  orderHeader,
  panelSection,
  pickOption,
  pickDate,
  toastText,
  waitModalsClosed,
} from './_local.mjs';

// 情境目錄第三章 3.1-3.3：收款項目規劃（新增／編輯／取消）與超上限拆多期；3.13 線下單草稿態即可規劃收款項目。
// 起點資料：鏈二 ORD-2026-0710（應收總額 67,725，已有兩期：訂金 30% 20,300、尾款 70% 47,425）；
// 只有發票草稿的期次用鏈外 ORD-2026-0812 第 3 期（掛草稿 INV-0812-3）；3.13 用鏈外 ORD-2026-0814（草稿、尚無收款項目）。
// 帳務頁籤走 /orders/detail?id=<單號>&tab=paymentPlan 直接開啟（「金額與發票」頁籤）。

test('3.1 業務規劃收款項目分期', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  const installmentPanel = page.locator('div', { has: page.getByText('收款項目', { exact: true }) }).first();

  // 新增收款項目：填描述、預計金額（含稅）、預計收款方式、預計收款日、預計開立發票日、備註
  await installmentPanel.getByRole('button', { name: cjkName('新增收款項目') }).click();
  const addModal = dialog(page);
  await expect(addModal).toBeVisible();
  await addModal.getByLabel('描述').fill('加印款');
  await addModal.getByLabel('預計金額（含稅）').fill('3000');
  await pickOption(page, addModal.getByLabel('預計收款方式'), '銀行轉帳');
  await pickDate(addModal.getByLabel('預計收款日'), '2026-09-20');
  await pickDate(addModal.getByLabel('預計開立發票日'), '2026-09-20');
  await addModal.getByLabel('備註').fill('客戶加印 500 份');
  await addModal.getByRole('button', { name: cjkName('建立期次') }).click();
  await toastText(page, /已新增收款項目「加印款」/);
  await waitModalsClosed(page);
  await expect(page.getByRole('cell', { name: '加印款', exact: true })).toBeVisible();

  // 對既有一期按編輯改金額
  const editRow = page.locator('tr', { hasText: '加印款' });
  await editRow.getByRole('button', { name: '編輯' }).click();
  const editModal = dialog(page);
  await expect(editModal).toBeVisible();
  await editModal.getByLabel('預計金額（含稅）').fill('3500');
  await editModal.getByRole('button', { name: cjkName('儲存變更') }).click();
  await toastText(page, /已更新收款項目「加印款」/);
  await waitModalsClosed(page);
  await expect(page.locator('tr', { hasText: '加印款' })).toContainText('NT$ 3,500');

  // 對這期按取消並填原因
  const cancelRow = page.locator('tr', { hasText: '加印款' });
  await cancelRow.getByRole('button', { name: '取消收款項目' }).click();
  const cancelModal = dialog(page);
  await expect(cancelModal).toBeVisible();
  await cancelModal.getByLabel(/原因/).fill('客戶取消加印');
  await cancelModal.getByRole('button', { name: cjkName('確認取消') }).click();
  await toastText(page, /已取消收款項目/);
  await waitModalsClosed(page);
  // 取消是標記不是刪除：期次仍留在列表上，標「已取消」
  await expect(page.locator('tr', { hasText: '加印款' })).toContainText('已取消');

  // 已開立發票的期次（訂金 30%）取消鈕停用，並提示先作廢該張發票
  const paidRow = page.locator('tr', { hasText: '訂金 30%' });
  await expect(paidRow.getByRole('button', { name: '取消收款項目' })).toBeDisabled();

  // 只有發票草稿的期次照樣取消得了、不必先作廢；草稿隨之消失（草稿本來就不列在發票區）
  await openOrderInApp(page, 'ORD-2026-0812', gotoInApp);
  // 前置：第 1、3 期各掛一張草稿、第 2 期掛開立失敗；發票區只列開立失敗那一張
  const invoiceRows = () => invoiceTable(page).locator('tbody tr.ant-table-row');
  await expect(invoiceRows()).toHaveCount(1);
  const draftOnlyRow = installmentRow(page, '尾款 40%');
  await expect(draftOnlyRow.getByRole('button', { name: '取消收款項目' })).toBeEnabled();
  await draftOnlyRow.getByRole('button', { name: '取消收款項目' }).click();
  const draftCancelModal = dialog(page);
  await expect(draftCancelModal).toBeVisible();
  await draftCancelModal.getByLabel(/原因/).fill('客戶改為一次付清');
  await draftCancelModal.getByRole('button', { name: cjkName('確認取消') }).click();
  await toastText(page, /已取消收款項目/);
  await waitModalsClosed(page);
  await expect(installmentRow(page, '尾款 40%')).toContainText('已取消');
  await expect(installmentRow(page, '尾款 40%').getByRole('button', { name: '開立發票', exact: true })).toHaveCount(0);
  await expect(invoiceRows()).toHaveCount(1);
});

test('3.2 收款項目合計與應收總額不符時顯示差額提示', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  // 把尾款期預計金額改成 40,000
  const targetRow = page.locator('tr', { hasText: '尾款 70%' });
  await targetRow.getByRole('button', { name: '編輯' }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await modal.getByLabel('預計金額（含稅）').fill('40000');
  await modal.getByRole('button', { name: cjkName('儲存變更') }).click();
  await toastText(page, /已更新收款項目/);
  await waitModalsClosed(page);

  // 頂端出現差額提示，列出收款項目合計與應收總額兩個數字；不擋開票與收款
  await expect(page.getByText('收款項目合計與應收總額不一致')).toBeVisible();
  await expect(page.getByText(/收款項目合計 NT\$ 60,300.*應收總額 NT\$ 67,725/)).toBeVisible();
  await expect(page.locator('tr', { hasText: '尾款 70%' }).getByRole('button', { name: '開立發票' })).toBeEnabled();

  // 金額改回原值後警示消失
  const targetRowAgain = page.locator('tr', { hasText: '尾款 70%' });
  await targetRowAgain.getByRole('button', { name: '編輯' }).click();
  const modal2 = dialog(page);
  await expect(modal2).toBeVisible();
  await modal2.getByLabel('預計金額（含稅）').fill('47425');
  await modal2.getByRole('button', { name: cjkName('儲存變更') }).click();
  await toastText(page, /已更新收款項目/);
  await waitModalsClosed(page);
  await expect(page.getByText('收款項目合計與應收總額不一致')).toHaveCount(0);
});

test('3.3 預開發票單張超上限時規劃階段拆多期', async ({ page }) => {
  // 起點資料：任一張訂單，用鏈三 ORD-2026-0815
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0815&tab=paymentPlan');

  const installmentPanel = page.locator('div', { has: page.getByText('收款項目', { exact: true }) }).first();

  // 業務把要預開的總額拆成數期建立：不限期數與拆法，示範拆三期、各期都在假設的單張上限內
  for (const [description, amount] of [
    ['內部核銷第一期', 12000],
    ['內部核銷第二期', 10000],
    ['內部核銷第三期', 8000],
  ]) {
    await installmentPanel.getByRole('button', { name: cjkName('新增收款項目') }).click();
    const modal = dialog(page);
    await expect(modal).toBeVisible();
    await modal.getByLabel('描述').fill(description);
    await modal.getByLabel('預計金額（含稅）').fill(String(amount));
    await pickOption(page, modal.getByLabel('預計收款方式'), '銀行轉帳');
    await pickDate(modal.getByLabel('預計收款日'), '2026-10-01');
    await modal.getByRole('button', { name: cjkName('建立期次') }).click();
    await toastText(page, new RegExp(`已新增收款項目「${description}」`));
    await waitModalsClosed(page);
  }

  // 各期各對一張發票（各自獨立、系統不限制期數與拆法），三期都看得到
  for (const description of ['內部核銷第一期', '內部核銷第二期', '內部核銷第三期']) {
    await expect(page.getByRole('cell', { name: description, exact: true })).toBeVisible();
  }
});

test('3.13 線下單草稿態即可規劃收款項目，待審期間可改且變更次數累加', async ({ page }) => {
  test.setTimeout(120_000);
  // 起點資料：鏈外 ORD-2026-0814（草稿，應收總額 13,126，尚無收款項目；缺交貨備註與收款條件備註）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0814&tab=paymentPlan');
  await expect(orderHeader(page)).toContainText('草稿');

  const installmentPanel = page.locator('div', { has: page.getByText('收款項目', { exact: true }) }).first();
  for (const [description, amount, paidDate, issueDate] of [
    ['訂金', '3938', '2026-10-20', '2026-10-15'],
    ['尾款', '9188', '2026-11-20', '2026-11-15'],
  ]) {
    await installmentPanel.getByRole('button', { name: cjkName('新增收款項目') }).click();
    const modal = dialog(page);
    await expect(modal).toBeVisible();
    await modal.getByLabel('描述').fill(description);
    await modal.getByLabel('預計金額（含稅）').fill(amount);
    await pickOption(page, modal.getByLabel('預計收款方式'), '銀行轉帳');
    await pickDate(modal.getByLabel('預計收款日'), paidDate);
    await pickDate(modal.getByLabel('預計開立發票日'), issueDate);
    await modal.getByRole('button', { name: cjkName('建立期次') }).click();
    await toastText(page, new RegExp(`已新增收款項目「${description}」`));
    await waitModalsClosed(page);
  }

  // 兩期皆未開立、未收；合計 13,126 等於應收總額，不出現差額提示
  for (const description of ['訂金', '尾款']) {
    const row = installmentRow(page, description);
    await expect(row).toContainText('未開立');
    await expect(row).toContainText('未收');
  }
  await expect(page.getByText('收款項目合計與應收總額不一致')).toHaveCount(0);

  // 補齊交貨備註與收款條件備註後送主管審核
  await openTab(page, '資訊');
  await button(panelSection(page, '訂單備註'), '編輯').click();
  const notePanel = drawer(page);
  await notePanel.locator('textarea').nth(1).fill('3.13 分兩批自取，名片先交');
  await button(notePanel, '確認').click();
  await expect(page.getByText('已更新訂單備註').last()).toBeVisible();
  await button(panelSection(page, '發票與收款'), '編輯').click();
  const billingPanel = drawer(page);
  await billingPanel.locator('#payment_terms_note').fill('3.13 訂金三成回簽後匯款、尾款交貨後 30 天');
  await button(billingPanel, '確認').click();
  await expect(page.getByText('已更新發票與收款').last()).toBeVisible();

  await button(page, '送主管審核').click();
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  // 待審期間改第二期的預計收款日：直接儲存、訂單維持待業務主管審核
  await openTab(page, '金額與發票');
  await installmentRow(page, '尾款').getByRole('button', { name: '編輯' }).click();
  const editModal = dialog(page);
  await expect(editModal).toBeVisible();
  await pickDate(editModal.getByLabel('預計收款日'), '2026-11-30');
  await editModal.getByRole('button', { name: cjkName('儲存變更') }).click();
  await toastText(page, /已更新收款項目「尾款」/);
  await waitModalsClosed(page);
  await expect(orderHeader(page)).toContainText('待業務主管審核');

  // 原始預計收款日維持首次儲存的值，變更次數加 1
  const tailRow = installmentRow(page, '尾款');
  await expect(tailRow).toContainText('2026-11-30');
  await expect(tailRow).toContainText('2026-11-20');
  await expect(tailRow.locator('td').filter({ hasText: /^1$/ })).toHaveCount(1);
});
