// 情境目錄第三章 3.21～3.23：開立的三種邊界——開立失敗是業務端終態（不補登、不再送，後端人員系統外處置）、
// 送出期間收款項目被取消（依寫入先後決定結果）、草稿金額與該期當下預計金額不一致（只提示不擋）。
// 期望值取自 change order-review-gate-invoice-draft-transfer-receipt 的 order-billing 規格差異檔
// Scenario THEN，不由實作重算。規則正本：wiki 發票狀態、付款發票邏輯 § 五G、帳務 § 發票。
// 起點資料：鏈外 ORD-2026-0812 第 1 期草稿 INV-0812-1、第 2 期開立失敗 INV-0812-2、
// 第 3 期草稿 INV-0812-3（金額 12,600，該期現為 8,400）。
//
// 與 invoice-drafts.test.mjs 共用的介面（createInvoiceDraft、submitInvoiceDraft、invoiceIssueBlockers、
// installmentCancelBlocker、installmentInvoiceEntries、invoiceWriteBlocker）約定見該檔開頭表格。
//
// | 位置 | 名稱 | 約定 |
// | --- | --- | --- |
// | orders/_lib/store.js | backfillInvoice | 不存在：業務端不提供補登（2026-10-06 拍板） |
// | 同上 | applyPlatformIssueResult(orderId, invoiceId, { result, invoice_no, issued_at }) | 藍新事後回傳結果；該張草稿已隨收款項目取消而消失時不寫入任何發票，回傳 { ok: false } |
// | orders/_lib/billing-rules.js | draftAmountMismatch(invoice, installment) | 草稿發票金額與該期當下預計金額不一致時回傳 { invoice_amount, planned_amount }，一致時 null |
//
// 後端人員在系統外刪除開立失敗紀錄，以直接移除訂單資料上的那一筆模擬（不經任何 store 動作）。
// store 為 zustand 單例；每條測試前把訂單資料還原成載入時的種子，各段情境從同一個起點開始。

import { beforeEach, describe, expect, it } from 'vitest';
import * as billingRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/billing-rules.js';
import {
  calcReconciliation,
  useOrdersStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

const SEED_ORDERS = useOrdersStore.getState().orders;
beforeEach(() => {
  useOrdersStore.setState({ orders: SEED_ORDERS });
});

const store = () => useOrdersStore.getState();
const ORDER = 'ORD-2026-0812';
const orderOf = () => store().getOrder(ORDER);
const installmentOf = (biId) => orderOf().billing_installments.find((bi) => bi.id === biId);
const invoiceOf = (invId) => orderOf().invoices.find((iv) => iv.id === invId);

const need = (mod, name, where) => {
  const fn = mod?.[name];
  if (typeof fn !== 'function') throw new Error(`尚未實作：${where} 匯出 ${name}`);
  return fn;
};
const rule = (name) => need(billingRules, name, 'orders/_lib/billing-rules.js');
const action = (name) => need(store(), name, 'orders/_lib/store.js 的 store 動作');

/** 該期的未作廢發票（含草稿與開立失敗）：草稿看 installment_ids，開立的發票另以 invoice_info 對號碼 */
const activeInvoicesOf = (biId) => {
  const order = orderOf();
  const bi = order.billing_installments.find((b) => b.id === biId);
  return order.invoices.filter(
    (inv) =>
      inv.status !== '作廢' &&
      ((inv.installment_ids ?? []).includes(biId) ||
        inv.source_installment_id === biId ||
        (Boolean(inv.invoice_no) && bi?.invoice_info === inv.invoice_no)),
  );
};

describe('3.21 開立失敗是業務端終態：業務不能補登、再送或作廢，由後端人員在系統外處置', () => {
  it('業務端沒有補登動作；開立失敗的發票不能再存草稿或再送，該期沒有開立發票入口', () => {
    expect(store().backfillInvoice).toBeUndefined();
    expect(action('updateInvoiceDraft')(ORDER, 'INV-0812-2', { tax_id: '84210573' })?.ok).toBe(false);
    expect(action('submitInvoiceDraft')(ORDER, 'INV-0812-2')?.ok).toBe(false);
    expect(invoiceOf('INV-0812-2')).toMatchObject({ status: '開立失敗', issue_failure_reason: '統編格式錯誤' });
    expect(rule('installmentInvoiceEntries')(installmentOf('BI-0812-2'), orderOf().invoices)).toEqual([]);
  });

  it('發票不帶補登人欄位', () => {
    for (const invoice of orderOf().invoices) {
      expect(invoice).not.toHaveProperty('backfilled_by');
      expect(invoice).not.toHaveProperty('backfilled_at');
    }
  });

  it('後端人員刪除開立失敗紀錄後：第 2 期沒有未作廢發票，入口回到開立發票、寫入檢查放行', () => {
    // 模擬後端人員在系統外刪除該筆紀錄
    store()._patchOrder(ORDER, (o) => ({ ...o, invoices: o.invoices.filter((iv) => iv.id !== 'INV-0812-2') }));
    expect(activeInvoicesOf('BI-0812-2')).toHaveLength(0);
    expect(rule('installmentInvoiceEntries')(installmentOf('BI-0812-2'), orderOf().invoices)).toEqual(['開立發票']);
    expect(rule('invoiceWriteBlocker')('BI-0812-2', orderOf().invoices)).toBeNull();
    expect(rule('installmentCancelBlocker')(installmentOf('BI-0812-2'), orderOf().invoices)).toBeNull();
  });

  it('送出期間不設處理中：開立的各種結果只落在草稿、開立、開立失敗、作廢四值', () => {
    action('submitInvoiceDraft')(ORDER, 'INV-0812-1', { platform: '逾時' });
    action('submitInvoiceDraft')(ORDER, 'INV-0812-3');
    const seen = new Set(orderOf().invoices.map((iv) => iv.status));
    for (const status of seen) expect(['草稿', '開立', '開立失敗', '作廢']).toContain(status);
    expect(seen.has('處理中')).toBe(false);
  });
});

describe('3.22 送出開立期間收款項目被取消，依寫入先後決定結果', () => {
  it('開立先寫入：業務乙取消第 1 期被擋下並提示先作廢該張發票，發票維持開立', () => {
    expect(action('submitInvoiceDraft')(ORDER, 'INV-0812-1')?.ok).toBe(true);
    expect(rule('installmentCancelBlocker')(installmentOf('BI-0812-1'), orderOf().invoices)).toBe(
      '已開立發票，請先作廢該張發票',
    );

    const result = store().cancelBillingInstallment(ORDER, 'BI-0812-1', '客戶改分期');
    expect(result?.ok).toBe(false);
    expect(result?.reason).toMatch(/請先作廢/);
    expect(installmentOf('BI-0812-1').cancelled).toBe(false);
    expect(invoiceOf('INV-0812-1').status).toBe('開立');
  });

  it('取消先寫入：第 3 期與其草稿一併消失；藍新之後回應成功，系統不建立也不寫入任何發票，第 3 期維持已取消', () => {
    // 業務甲已自第 3 期草稿按開立、藍新尚未回應；業務乙此時取消第 3 期
    store().cancelBillingInstallment(ORDER, 'BI-0812-3', '客戶要求尾款改期另開');
    expect(installmentOf('BI-0812-3').cancelled).toBe(true);
    expect(invoiceOf('INV-0812-3')).toBeUndefined();
    const invoiceCount = orderOf().invoices.length;

    const late = action('applyPlatformIssueResult')(ORDER, 'INV-0812-3', {
      result: '成功',
      invoice_no: 'SSP-26100502',
      issued_at: '2026-10-05 11:00',
    });
    expect(late?.ok).toBe(false);
    expect(orderOf().invoices).toHaveLength(invoiceCount);
    expect(orderOf().invoices.some((iv) => iv.invoice_no === 'SSP-26100502')).toBe(false);
    expect(installmentOf('BI-0812-3')).toMatchObject({ cancelled: true, invoice_info: '' });
    expect(calcReconciliation(orderOf()).net_invoiced).toBe(0);
  });
});

describe('3.23 草稿發票金額與該期當下預計金額不一致時，開立只提示、不擋下', () => {
  it('第 3 期草稿 12,600 對上該期 8,400：回傳兩數；第 1 期 4,200 對 4,200 一致不提示', () => {
    expect(rule('draftAmountMismatch')(invoiceOf('INV-0812-3'), installmentOf('BI-0812-3'))).toEqual({
      invoice_amount: 12600,
      planned_amount: 8400,
    });
    expect(rule('draftAmountMismatch')(invoiceOf('INV-0812-1'), installmentOf('BI-0812-1'))).toBeNull();
  });

  it('不一致不構成檢核原因，開立以草稿金額 12,600 為含稅目標值，開出未稅 12,000、稅額 600', () => {
    expect(rule('invoiceIssueBlockers')(invoiceOf('INV-0812-3'))).toEqual([]);
    const result = action('submitInvoiceDraft')(ORDER, 'INV-0812-3');
    expect(result?.ok).toBe(true);

    expect(invoiceOf('INV-0812-3')).toMatchObject({
      status: '開立',
      amount_taxed: 12600,
      sales_amount: 12000,
      tax_amount: 600,
    });
    // 不替業務重帶：該期預計金額仍是 8,400，草稿金額也沒有被改成 8,400
    expect(installmentOf('BI-0812-3')).toMatchObject({ amount_taxed: 8400, invoice_status: '已開立' });
    expect(calcReconciliation(orderOf()).net_invoiced).toBe(12600);
  });
});
