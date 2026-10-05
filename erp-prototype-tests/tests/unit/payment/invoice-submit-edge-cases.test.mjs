// 情境目錄第三章 3.21～3.23：送出開立的三種邊界——平台沒有回應（人工補登或再送一次）、
// 送出期間收款項目被取消（依寫入先後決定結果）、草稿金額與該期當下預計金額不一致（只提示不擋）。
// 期望值取自 change order-review-gate-invoice-draft-transfer-receipt 的 order-billing 規格差異檔
// Scenario THEN，不由實作重算。規則正本：wiki 發票狀態、付款發票邏輯 § 五G、帳務 § 發票（補登人）。
// 起點資料：鏈外 ORD-2026-0812 第 1 期草稿 INV-0812-1、第 3 期草稿 INV-0812-3（金額 12,600，該期現為 8,400）。
//
// 本檔先於功能撰寫（測試先行），下列介面由 task 5.4 實作時對齊；尚未匯出時以「尚未實作」報紅。
// 與 invoice-drafts.test.mjs 共用的介面（createInvoiceDraft、submitInvoiceDraft、invoiceIssueBlockers、
// installmentCancelBlocker）約定見該檔開頭表格。
//
// | 位置 | 名稱 | 約定 |
// | --- | --- | --- |
// | orders/_lib/store.js | submitInvoiceDraft(orderId, invoiceId, { platform: '無回應' }) | 平台沒有回傳結果：發票留在草稿、不記失敗原因、該期開發票狀態不動 |
// | 同上 | backfillInvoice(orderId, invoiceId, { invoice_no, issued_at }) | 人工補登：草稿轉開立、不送平台，寫入補登人（當下模擬角色）與補登時間 |
// | 同上 | applyPlatformIssueResult(orderId, invoiceId, { result, invoice_no, issued_at }) | 平台事後回傳結果；該張草稿已隨收款項目取消而消失時不寫入任何發票，回傳 { ok: false } |
// | orders/_lib/billing-rules.js | draftAmountMismatch(invoice, installment) | 草稿發票金額與該期當下預計金額不一致時回傳 { invoice_amount, planned_amount }，一致時 null |
//
// store 為 zustand 單例；每條測試前把訂單資料還原成載入時的種子，兩段情境各自從同一個起點開始。

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

/** 該期的未作廢發票（含草稿）：草稿看 installment_ids，開立的發票另以 invoice_info 對號碼 */
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

describe('3.21 送出開立後平台沒有回應時留在草稿', () => {
  it('平台沒有回應：發票維持草稿、不算開立失敗，該期開發票狀態維持未開立，發票淨額不變', () => {
    const result = action('submitInvoiceDraft')(ORDER, 'INV-0812-1', { platform: '無回應' });
    expect(result?.ok).toBe(false);
    const draft = invoiceOf('INV-0812-1');
    expect(draft.status).toBe('草稿');
    expect(draft.invoice_no || null).toBeNull();
    expect(draft.issue_failure_reason ?? null).toBeNull();
    expect(installmentOf('BI-0812-1').invoice_status).toBe('未開立');
    expect(calcReconciliation(orderOf()).net_invoiced).toBe(0);
  });

  it('查到已開出：業務在草稿上補登號碼與開立時間，發票轉開立、該期轉已開立，記下補登人洪嘉駿與補登時間', () => {
    action('submitInvoiceDraft')(ORDER, 'INV-0812-1', { platform: '無回應' });
    const result = action('backfillInvoice')(ORDER, 'INV-0812-1', {
      invoice_no: 'SSP-26100501',
      issued_at: '2026-10-05 10:30',
    });
    expect(result?.ok).toBe(true);

    const issued = invoiceOf('INV-0812-1');
    expect(issued).toMatchObject({
      status: '開立',
      invoice_no: 'SSP-26100501',
      issued_at: '2026-10-05 10:30',
      backfilled_by: '洪嘉駿',
    });
    expect(issued.backfilled_at).toBeTruthy();
    expect(installmentOf('BI-0812-1')).toMatchObject({ invoice_status: '已開立', invoice_info: 'SSP-26100501' });
    expect(calcReconciliation(orderOf()).net_invoiced).toBe(4200);
  });

  it('查到沒開出：自草稿再送一次成功，號碼與開立時間取平台回傳、補登人為空，該期只有一張未作廢發票', () => {
    action('submitInvoiceDraft')(ORDER, 'INV-0812-1', { platform: '無回應' });
    const result = action('submitInvoiceDraft')(ORDER, 'INV-0812-1');
    expect(result?.ok).toBe(true);

    const issued = invoiceOf('INV-0812-1');
    expect(issued.status).toBe('開立');
    expect(issued.invoice_no).toBeTruthy();
    expect(issued.issued_at).toBeTruthy();
    expect(issued.backfilled_by ?? null).toBeNull();
    expect(activeInvoicesOf('BI-0812-1')).toHaveLength(1);
    expect(installmentOf('BI-0812-1').invoice_status).toBe('已開立');
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

  it('取消先寫入：第 3 期與其草稿一併消失；平台之後回應成功，系統不建立也不寫入任何發票，第 3 期維持已取消', () => {
    action('submitInvoiceDraft')(ORDER, 'INV-0812-3', { platform: '無回應' });
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

  it('送出期間不另設任何狀態：全程發票狀態只出現草稿、開立、作廢', () => {
    action('submitInvoiceDraft')(ORDER, 'INV-0812-1', { platform: '無回應' });
    action('submitInvoiceDraft')(ORDER, 'INV-0812-3', { platform: '無回應' });
    const seen = new Set(orderOf().invoices.map((iv) => iv.status));
    for (const status of seen) expect(['草稿', '開立', '作廢']).toContain(status);
  });
});

describe('3.23 草稿發票金額與該期當下預計金額不一致時，送出開立只提示、不擋下', () => {
  it('第 3 期草稿 12,600 對上該期 8,400：回傳兩數；第 1 期 4,200 對 4,200 一致不提示', () => {
    expect(rule('draftAmountMismatch')(invoiceOf('INV-0812-3'), installmentOf('BI-0812-3'))).toEqual({
      invoice_amount: 12600,
      planned_amount: 8400,
    });
    expect(rule('draftAmountMismatch')(invoiceOf('INV-0812-1'), installmentOf('BI-0812-1'))).toBeNull();
  });

  it('不一致不構成檢核原因，送出開立以草稿金額 12,600 為含稅目標值，開出未稅 12,000、稅額 600', () => {
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
