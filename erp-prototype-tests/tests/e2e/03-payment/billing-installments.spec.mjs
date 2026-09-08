import { test, expect } from '@playwright/test';
import { openAs, cjkName } from '../_helpers.mjs';
import { dialog, pickOption, pickDate, toastText, waitModalsClosed } from './_local.mjs';

// 情境目錄第三章 3.1-3.3：收款項目規劃（新增／編輯／取消）與超上限拆多期。
// 起點資料：鏈二 ORD-2026-0710（應收總額 67,725，已有兩期：訂金 30% 20,300、尾款 70% 47,425）。
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
