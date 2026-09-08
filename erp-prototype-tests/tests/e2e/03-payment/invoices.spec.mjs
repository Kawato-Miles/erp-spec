import { test, expect } from '@playwright/test';
import { openAs, cjkName } from '../_helpers.mjs';
import { dialog, toastText, waitModalsClosed } from './_local.mjs';

// 情境目錄第三章 3.4-3.7：開立發票、品項調平、作廢重開、折讓減額。
// 起點資料：鏈二 ORD-2026-0710 的尾款期 BI-0710-2（預計金額含稅 47,425、開發票狀態未開立）。

test('3.4 以收款項目一鍵開立發票', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  const targetRow = page.locator('tr', { hasText: '尾款 70%' });
  await targetRow.getByRole('button', { name: '開立發票' }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();

  // 來源收款期次唯讀顯示；金額三欄由品項推算、唯讀不可手填
  await expect(modal.getByText(/來源收款期次：尾款 70%.*含稅 NT\$ 47,425/)).toBeVisible();

  // 核對買受人四欄（B2B 預設帶入客戶主檔）
  await expect(modal.getByLabel('買受人名稱')).toHaveValue('台北數位行銷有限公司');
  await expect(modal.getByLabel('買受人統一編號')).toHaveValue('53192647');

  // 品項預設帶一列：數量 1、單位「式」、商品名稱取期次說明；B2B 單價為未稅
  await expect(modal.getByLabel('商品名稱')).toHaveValue('尾款 70%');
  await expect(modal.getByLabel('數量')).toHaveValue('1');
  await expect(modal.getByLabel('單價（未稅）')).toHaveValue('45167');

  // 未稅一律由含稅反推、取整零頭落在稅額：47,425 ÷ 1.05 四捨五入 = 45,167，稅額 2,258
  await expect(modal.getByText('銷售額（未稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 45,167');
  await expect(modal.getByText('稅額', { exact: true }).locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 2,258');
  await expect(modal.getByText('發票金額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 47,425');

  await modal.getByRole('button', { name: cjkName('確認') }).click();
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 送出後發票轉開立、該期開發票狀態轉已開立，這一期不再有開立入口
  await expect(page.locator('tr', { hasText: '尾款 70%' })).toContainText('已開立');
  await expect(page.locator('tr', { hasText: '尾款 70%' }).getByRole('button', { name: '開立發票' })).toHaveCount(0);
});

test('3.5 客戶指定品名或要求攤開明細時改品項', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  const targetRow = page.locator('tr', { hasText: '尾款 70%' });
  await targetRow.getByRole('button', { name: '開立發票' }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();

  // 改商品名稱、加列，逐列填數量與單價，先讓合計對不上目標值
  await modal.getByLabel('商品名稱').fill('品牌形象海報活動 尾款');
  await modal.getByRole('button', { name: cjkName('新增品項') }).click();

  const nameInputs = modal.getByLabel('商品名稱');
  const countInputs = modal.getByLabel('數量');
  const priceInputs = modal.getByLabel('單價（未稅）');
  await nameInputs.nth(0).fill('海報印製');
  await countInputs.nth(0).fill('3000');
  await priceInputs.nth(0).fill('10');
  await nameInputs.nth(1).fill('包裝與物流');
  await countInputs.nth(1).fill('1');
  await priceInputs.nth(1).fill('5000');

  // 合計 30,000+5,000=35,000 對不上目標值 45,167，差額提示擋下送出
  await expect(modal.getByText(/品項明細與期次金額差/)).toBeVisible();
  await expect(modal.getByRole('button', { name: cjkName('確認') })).toBeDisabled();

  // 調平：把第二列單價改成把差額補齊（45,167-30,000=15,167）
  await priceInputs.nth(1).fill('15167');
  await expect(modal.getByText(/品項明細與期次金額差/)).toHaveCount(0);

  await modal.getByRole('button', { name: cjkName('確認') }).click();
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 發票金額（含稅）與改列前一致：來源期次含稅金額仍是 47,425
  await expect(page.locator('tr', { hasText: '尾款 70%' })).toContainText('已開立');
});

test('3.6 已開立的發票作廢重開', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  // 發票主表以「發票號碼」欄頭錨定，避免與收款項目區「發票資料」欄同一單號文字混淆
  const invoiceTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '發票號碼' }) });
  const invoiceRow = invoiceTable.locator('tr', { hasText: 'SSP-26081201' });
  await invoiceRow.getByRole('button', { name: '作廢發票' }).click();
  const voidModal = dialog(page);
  await expect(voidModal).toBeVisible();
  await voidModal.getByLabel(/作廢原因/).fill('統編打錯');
  await voidModal.getByRole('button', { name: cjkName('確認作廢') }).click();
  await toastText(page, /已作廢發票/);
  await waitModalsClosed(page);

  // 原發票轉作廢並留作廢原因、退出對帳；該期開發票狀態先回已作廢
  await expect(invoiceRow).toContainText('已作廢');
  // 收款項目表以「款項」欄頭錨定，避免與款項紀錄區核銷分配欄同一期次描述文字混淆
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  const installmentRow = installmentTable.locator('tr', { hasText: '訂金 30%' });
  await expect(installmentRow).toContainText('已作廢');

  // 回收款項目區對同一期重新開立一張
  await installmentRow.getByRole('button', { name: '開立發票' }).click();
  const issueModal = dialog(page);
  await expect(issueModal).toBeVisible();
  await issueModal.getByRole('button', { name: cjkName('確認') }).click();
  await toastText(page, /已開立發票/);
  await waitModalsClosed(page);

  // 重開後期次轉已開立；作廢張金額不受牽動（仍在發票列表上顯示 NT$ 20,300、已作廢）
  await expect(installmentRow).toContainText('已開立');
  const voidedInvoiceRow = invoiceTable.locator('tr', { hasText: 'SSP-26081201' });
  await expect(voidedInvoiceRow).toContainText('NT$ 20,300');
  await expect(voidedInvoiceRow).toContainText('已作廢');
});

test('3.7 開出後折讓減額', async ({ page }) => {
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  // 發票主表以「發票號碼」欄頭錨定，避免與收款項目區「發票資料」欄同一單號文字混淆
  const invoiceTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '發票號碼' }) });
  const invoiceRow = invoiceTable.locator('tr', { hasText: 'SSP-26081201' });
  await invoiceRow.getByRole('button', { name: '開立折讓單' }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await expect(modal.getByText('剩餘可折讓（含稅）')).toBeVisible();
  await modal.getByLabel('折讓金額（含稅）').fill('5000');
  await modal.getByLabel('折讓原因').fill('色差客訴部分退款');
  await modal.getByRole('button', { name: cjkName('開立折讓') }).click();
  await toastText(page, /已開立折讓單/);
  await waitModalsClosed(page);

  // 折讓確認後訂單的發票淨額扣掉折讓金額，發票本身維持開立
  await expect(invoiceRow).toContainText('已開立');
  await expect(page.getByText('發票淨額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 15,300');

  // 折讓單可另掛檔案（展開折讓子表看到回簽檔操作）；此處只驗證折讓明細列存在
  await invoiceRow.locator('.ant-table-row-expand-icon').click();
  const allowanceRow = page.locator('tr.ant-table-row', { hasText: '色差客訴部分退款' });
  await expect(allowanceRow).toBeVisible();

  // 作廢折讓後發票淨額回補
  await allowanceRow.getByRole('button', { name: '作廢折讓' }).click();
  const voidAllowanceModal = dialog(page);
  await expect(voidAllowanceModal).toBeVisible();
  await voidAllowanceModal.getByLabel(/作廢原因/).fill('客戶撤回客訴');
  await voidAllowanceModal.getByRole('button', { name: cjkName('確認作廢') }).click();
  await toastText(page, /已作廢折讓/);
  await waitModalsClosed(page);

  await expect(page.getByText('發票淨額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 20,300');
});
