import { test, expect } from '@playwright/test';
import { openAs, cjkName } from '../_helpers.mjs';
import { dialog, pickOption, pickDate, toastText, waitModalsClosed } from './_local.mjs';

// 情境目錄第三章 3.8-3.10、3.12：登錄款項、核銷分配、溢收掛預收、出貨後盯收。

test('3.8 登錄款項並核銷分配到指定期次', async ({ page }) => {
  // 起點資料：鏈二 ORD-2026-0710（尾款期 47,425 未收）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  const paymentPanel = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '核銷分配' }) }).locator('xpath=ancestor::div[contains(@class,"ant-flex")][1]');
  await page.getByRole('button', { name: cjkName('新增款項') }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();

  // 款項類型收款（預設）、付款方式、收款金額（含稅）47,425、款項實際完成日、第三方付款序號
  await pickOption(page, modal.getByLabel('付款方式'), '銀行轉帳');
  await modal.getByLabel(/收款金額（含稅）/).fill('47425');

  // 核銷分配表：勾尾款期並填分配金額
  const allocationTable = modal.locator('.ant-table-wrapper');
  const allocationRow = allocationTable.locator('tr', { hasText: '尾款 70%' });
  await allocationRow.locator('input[type="checkbox"]').check();
  await allocationRow.getByRole('spinbutton').fill('47425');

  await pickDate(modal.getByLabel('款項實際完成日'), '2026-09-15');
  await modal.getByLabel('第三方付款序號').fill('TXN-0915-0710');

  // 款項狀態選已完成後送出
  await modal.getByLabel('已完成', { exact: true }).check();
  await modal.getByRole('button', { name: cjkName('新增') }).click();
  await toastText(page, /已新增款項紀錄/);
  await waitModalsClosed(page);

  // 已完成後計入收款淨額，被分配到的期次收款狀態依累計入帳自動推導
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  await expect(installmentTable.locator('tr', { hasText: '尾款 70%' })).toContainText('已付款');

  // 三方對帳區的收款淨額同步變動：訂金 20,300 + 尾款 47,425 = 67,725，與應收總額差額歸零（標「對齊」）
  await expect(page.getByText('收款淨額（含稅）').locator('xpath=following-sibling::div[1]')).toHaveText('NT$ 67,725');
  const receivedCard = page.locator('div', { has: page.getByText('收款淨額（含稅）', { exact: true }) }).last();
  await expect(receivedCard.getByText('對齊')).toBeVisible();
});

test('3.9 一筆匯款跨多期分配', async ({ page }) => {
  // 起點資料：鏈三 ORD-2026-0815 的兩期（訂金 30% 10,584 已收；尾款 70% 24,696 未收）
  // 前置：新增一期已知金額的期次，湊出「兩期皆未收」的跨期分配情境（起點兩期已有一期先收過訂金，
  // 故改用尾款期＋新增一期示範一筆錢同時分配到兩個未收期次）
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0815&tab=paymentPlan');

  const installmentPanel = page.locator('div', { has: page.getByText('收款項目', { exact: true }) }).first();
  await installmentPanel.getByRole('button', { name: cjkName('新增收款項目') }).click();
  const addModal = dialog(page);
  await expect(addModal).toBeVisible();
  await addModal.getByLabel('描述').fill('加開驗收款');
  await addModal.getByLabel('預計金額（含稅）').fill('5000');
  await pickOption(page, addModal.getByLabel('預計收款方式'), '銀行轉帳');
  await pickDate(addModal.getByLabel('預計收款日'), '2026-10-10');
  await addModal.getByRole('button', { name: cjkName('建立期次') }).click();
  await toastText(page, /已新增收款項目「加開驗收款」/);
  await waitModalsClosed(page);

  // 登錄一筆款項，核銷分配表同時勾兩期並各填分配金額
  await page.getByRole('button', { name: cjkName('新增款項') }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await pickOption(page, modal.getByLabel('付款方式'), '銀行轉帳');
  await modal.getByLabel(/收款金額（含稅）/).fill('20000');

  const allocationTable = modal.locator('.ant-table-wrapper');
  const tailRow = allocationTable.locator('tr', { hasText: '尾款 70%' });
  await tailRow.locator('input[type="checkbox"]').check();
  await tailRow.getByRole('spinbutton').fill('15000');
  const newRow = allocationTable.locator('tr', { hasText: '加開驗收款' });
  await newRow.locator('input[type="checkbox"]').check();
  await newRow.getByRole('spinbutton').fill('5000');

  await pickDate(modal.getByLabel('款項實際完成日'), '2026-09-20');
  await modal.getByLabel('已完成', { exact: true }).check();
  await modal.getByRole('button', { name: cjkName('新增') }).click();
  await toastText(page, /已新增款項紀錄/);
  await waitModalsClosed(page);

  // 兩期的收款狀態依各自累計入帳分別推導、互不干擾：尾款 15,000/24,696 部分付款；加開驗收款 5,000/5,000 已付款
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  await expect(installmentTable.locator('tr', { hasText: '尾款 70%' })).toContainText('部分付款');
  await expect(installmentTable.locator('tr', { hasText: '加開驗收款' })).toContainText('已付款');
});

test('3.10 溢收餘額掛預收（未分配）', async ({ page }) => {
  // 承 3.1 的款項登錄視窗；用一張未收餘額有限的訂單示範溢收：鏈三 ORD-2026-0815 尾款期未收 24,696
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0815&tab=paymentPlan');

  await page.getByRole('button', { name: cjkName('新增款項') }).click();
  const modal = dialog(page);
  await expect(modal).toBeVisible();
  await pickOption(page, modal.getByLabel('付款方式'), '銀行轉帳');

  // 業務把款項金額填得比所有未收餘額合計還多
  await modal.getByLabel(/收款金額（含稅）/).fill('30000');

  // 各期都填到滿之後送出：尾款期未收餘額 24,696 全數分配
  const allocationTable = modal.locator('.ant-table-wrapper');
  const tailRow = allocationTable.locator('tr', { hasText: '尾款 70%' });
  await tailRow.locator('input[type="checkbox"]').check();
  await tailRow.getByRole('spinbutton').fill('24696');

  // 核銷分配表下方顯示本次入帳合計與款項金額的對照，說明未分配差額由系統記入預收
  await expect(modal.getByText(/本次入帳合計 24,696 \/ 款項金額 30,000 元/)).toBeVisible();

  await pickDate(modal.getByLabel('款項實際完成日'), '2026-09-21');
  await modal.getByLabel('已完成', { exact: true }).check();
  // 分配未超過款項金額（24,696 ≤ 30,000），送出鈕不因超額而停用
  await expect(modal.getByRole('button', { name: cjkName('新增') })).toBeEnabled();
  await modal.getByRole('button', { name: cjkName('新增') }).click();
  await toastText(page, /已新增款項紀錄/);
  await waitModalsClosed(page);

  // 這筆錢沒有任何一塊錢懸空：期次全額收訖，系統不另設預收專用入口與預收清單
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  await expect(installmentTable.locator('tr', { hasText: '尾款 70%' })).toContainText('已付款');
  await expect(page.getByText('預收', { exact: false })).toHaveCount(0);
});

test('3.12 出貨後指定期限付款的盯收', async ({ page }) => {
  // 起點資料：鏈二 ORD-2026-0710 的尾款期，預計收款日已填
  await openAs(page, '業務', '/orders/detail?id=ORD-2026-0710&tab=paymentPlan');

  // 預計收款日在收款項目上看得到，是日後盯客戶匯款的依據
  const installmentTable = page.locator('.ant-table-wrapper', { has: page.getByRole('columnheader', { name: '款項', exact: true }) });
  const tailRow = installmentTable.locator('tr', { hasText: '尾款 70%' });
  await expect(tailRow).toContainText('2026-09-15');

  // 未實作：接近付款日的盯收清單與提示沒有做——業務端沒有額外提醒入口或清單頁可切換過去
  await expect(page.getByText(/盯收提醒|即將到期|逾期未收/)).toHaveCount(0);
});
