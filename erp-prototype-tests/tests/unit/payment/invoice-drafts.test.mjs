// 情境目錄第三章 3.14～3.20：發票草稿（建立草稿與直接開立兩個入口、草稿不檢核、送出時才檢核、
// 開立失敗留在草稿、一期一張、取消收款項目時草稿一併消失、草稿不計入發票淨額、
// 草稿期間開發票狀態維持原值）。期望值取自 change order-review-gate-invoice-draft-transfer-receipt
// 的 order-billing 規格差異檔 Scenario THEN，不由實作重算。
// 規則正本：wiki 發票狀態、收款項目開發票狀態、收款項目收款狀態、付款發票邏輯 § 五G、帳務 § 發票。
// 起點資料：鏈外 ORD-2026-0812（三張草稿、第 4 期尚無發票）、ORD-2026-0813（已回簽、一期設計費）、
// ORD-2026-0814（草稿訂單、尚無收款項目）。
//
// 本檔先於功能撰寫（測試先行），下列介面由 tasks 5.2、5.3 實作時對齊；尚未匯出時以「尚未實作」報紅。
//
// | 位置 | 名稱 | 約定 |
// | --- | --- | --- |
// | orders/_lib/billing-rules.js | installmentInvoiceEntries(installment, invoices) | 回傳該期的發票入口文字陣列：沒有未作廢發票時 ['建立草稿', '直接開立發票']；有草稿時 ['送出開立']；有開立的發票或該期已取消時 [] |
// | 同上 | invoiceWriteBlocker(installmentId, invoices) | 該期已有未作廢發票（含草稿）時回傳含「重新整理」的提示，否則 null |
// | 同上 | invoiceIssueBlockers(invoice) | 送出開立當下的檢核原因陣列；空陣列代表可送出。未稅目標值由發票金額（含稅）反推 |
// | 同上 | installmentCancelBlocker(installment, invoices) | 該期有開立的發票時回傳「已開立發票，請先作廢該張發票」，否則 null |
// | 同上 | allowanceSelectableInvoices(invoices) | 折讓單可選的發票，只含狀態「開立」 |
// | orders/_lib/store.js | createInvoiceDraft(orderId, installmentId, overrides?) | 建立草稿，不檢核；回傳 { ok, invoice_id } 或 { ok: false, reason } |
// | 同上 | updateInvoiceDraft(orderId, invoiceId, patch) | 儲存草稿，不檢核 |
// | 同上 | submitInvoiceDraft(orderId, invoiceId, { platform }) | 自草稿送出開立；platform 預設「成功」，可為「拒絕」「無回應」；回傳 { ok, status, reason } |
// | 同上 | issueInvoice(orderId, fields) | 既有「直接開立發票」；改為寫入當下檢查一期一張、檢核未過時落成草稿並記失敗原因 |
// | 同上 | cancelBillingInstallment(orderId, id, reason) | 既有；改為該期有開立的發票時擋下並回傳 { ok: false, reason }，只有草稿時草稿一併消失 |
//
// 草稿與收款項目的對應沿用 mock 的 installment_ids；開立的發票另以收款項目的 invoice_info 對號碼。
// store 為 zustand 單例；每條測試前把訂單資料還原成載入時的種子，情境之間互不污染。

import { beforeEach, describe, expect, it } from 'vitest';
import * as billingRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/billing-rules.js';
import {
  calcInstallmentPaymentStatus,
  calcReconciliation,
  useOrdersStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { pendingInvoiceRows, netInvoiced } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/derive.js';
import { toListOrders } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/mock-data.js';

const SEED_ORDERS = useOrdersStore.getState().orders;
beforeEach(() => {
  useOrdersStore.setState({ orders: SEED_ORDERS });
});

const store = () => useOrdersStore.getState();
const orderOf = (id) => store().getOrder(id);
const installmentOf = (orderId, biId) => orderOf(orderId).billing_installments.find((bi) => bi.id === biId);
const invoiceOf = (orderId, invId) => orderOf(orderId).invoices.find((iv) => iv.id === invId);

/** 取出尚未實作的介面；沒有匯出時直接報「尚未實作」，紅燈訊息指向缺的那一個 */
const need = (mod, name, where) => {
  const fn = mod?.[name];
  if (typeof fn !== 'function') throw new Error(`尚未實作：${where} 匯出 ${name}`);
  return fn;
};
const rule = (name) => need(billingRules, name, 'orders/_lib/billing-rules.js');
const action = (name) => need(store(), name, 'orders/_lib/store.js 的 store 動作');

/** 這張發票是否掛在這一期：草稿看 installment_ids，開立的發票也可由該期的 invoice_info 對號碼 */
const belongsTo = (order, inv, biId) => {
  if ((inv.installment_ids ?? []).includes(biId)) return true;
  if (inv.source_installment_id === biId) return true;
  const bi = order.billing_installments.find((b) => b.id === biId);
  return Boolean(inv.invoice_no) && bi?.invoice_info === inv.invoice_no;
};
/** 該期的未作廢發票（含草稿） */
const activeInvoicesOf = (orderId, biId) => {
  const order = orderOf(orderId);
  return order.invoices.filter((inv) => inv.status !== '作廢' && belongsTo(order, inv, biId));
};
const entriesOf = (orderId, biId) =>
  rule('installmentInvoiceEntries')(installmentOf(orderId, biId), orderOf(orderId).invoices);

/** ORD-2026-0814 前置：比照 3.13 建好訂金 3,938 與尾款 9,188 兩期，回傳兩期編號 */
const seedTwoInstallments0814 = () => {
  store().addBillingInstallment('ORD-2026-0814', {
    description: '訂金',
    amount_taxed: 3938,
    planned_method: '匯款',
    planned_paid_date: '2026-10-20',
    planned_issue_date: '2026-10-15',
  });
  store().addBillingInstallment('ORD-2026-0814', {
    description: '尾款',
    amount_taxed: 9188,
    planned_method: '匯款',
    planned_paid_date: '2026-11-20',
    planned_issue_date: '2026-11-15',
  });
  const list = orderOf('ORD-2026-0814').billing_installments;
  return {
    first: list.find((bi) => bi.description === '訂金').id,
    second: list.find((bi) => bi.description === '尾款').id,
  };
};

describe('3.14 收款項目上的建立草稿與直接開立發票兩個入口', () => {
  it('尚無發票時兩個入口並列', () => {
    const { first } = seedTwoInstallments0814();
    expect(entriesOf('ORD-2026-0814', first)).toEqual(['建立草稿', '直接開立發票']);
  });

  it('存成草稿：發票金額帶入 3,938、統編空白不擋；該期只剩送出開立，開發票狀態與發票淨額不變', () => {
    const { first } = seedTwoInstallments0814();
    const result = action('createInvoiceDraft')('ORD-2026-0814', first, { tax_id: '' });
    expect(result?.ok).toBe(true);

    const drafts = activeInvoicesOf('ORD-2026-0814', first);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ status: '草稿', amount_taxed: 3938, tax_id: '' });
    expect(drafts[0].invoice_no || null).toBeNull();
    expect(drafts[0].issued_at ?? null).toBeNull();

    expect(installmentOf('ORD-2026-0814', first).invoice_status).toBe('未開立');
    expect(calcReconciliation(orderOf('ORD-2026-0814')).net_invoiced).toBe(0);
    expect(entriesOf('ORD-2026-0814', first)).toEqual(['送出開立']);
  });

  it('補上統編後送出開立成功：取得號碼與開立時間，銷售額 3,750、稅額 188；該期轉已開立、兩個入口都不顯示', () => {
    const { first } = seedTwoInstallments0814();
    const created = action('createInvoiceDraft')('ORD-2026-0814', first, { tax_id: '' });
    action('updateInvoiceDraft')('ORD-2026-0814', created.invoice_id, { tax_id: '27638451' });
    const result = action('submitInvoiceDraft')('ORD-2026-0814', created.invoice_id);
    expect(result?.ok).toBe(true);

    const issued = invoiceOf('ORD-2026-0814', created.invoice_id);
    expect(issued.status).toBe('開立');
    expect(issued.invoice_no).toBeTruthy();
    expect(issued.issued_at).toBeTruthy();
    expect(issued.sales_amount).toBe(3750);
    expect(issued.tax_amount).toBe(188);
    expect(installmentOf('ORD-2026-0814', first).invoice_status).toBe('已開立');
    expect(calcReconciliation(orderOf('ORD-2026-0814')).net_invoiced).toBe(3938);
    expect(entriesOf('ORD-2026-0814', first)).toEqual([]);
  });
});

describe('3.15 草稿不檢核、送出開立時才檢核，以草稿內容送出', () => {
  const twoRows = [
    { name: '完賽證書組 訂金 品項一', count: 1, unit: '式', unit_price: 2000, item_amount: 2000 },
    { name: '完賽證書組 訂金 品項二', count: 1, unit: '式', unit_price: 1998, item_amount: 1998 },
  ];

  it('改地址與品項（合計 3,998）後儲存草稿：照樣存下，不檢核', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', {
      buyer_address: '高雄市前金區中正四路 200 號',
      items: twoRows,
    });
    const draft = invoiceOf('ORD-2026-0812', 'INV-0812-1');
    expect(draft.status).toBe('草稿');
    expect(draft.items).toHaveLength(2);
    expect(draft.buyer_address).toBe('高雄市前金區中正四路 200 號');
    expect(draft.issue_failure_reason ?? null).toBeNull();
  });

  it('送出時擋下並列出未稅目標值 4,000、品項加總 3,998、差額 2，發票留在草稿', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', { items: twoRows });
    const reasons = rule('invoiceIssueBlockers')(invoiceOf('ORD-2026-0812', 'INV-0812-1'));
    expect(reasons.join('；')).toMatch(/未稅目標值[^0-9]*4,000/);
    expect(reasons.join('；')).toMatch(/品項加總[^0-9]*3,998/);
    expect(reasons.join('；')).toMatch(/差額[^0-9]*2(?![0-9,])/);

    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    expect(result?.ok).toBe(false);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-1').status).toBe('草稿');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-1').invoice_status).toBe('未開立');
  });

  it('調平到 4,000 後送出成立，開出的發票帶草稿上的新地址，不自訂單重新帶入', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', {
      buyer_address: '高雄市前金區中正四路 200 號',
      items: [
        { ...twoRows[0] },
        { ...twoRows[1], unit_price: 2000, item_amount: 2000 },
      ],
    });
    expect(rule('invoiceIssueBlockers')(invoiceOf('ORD-2026-0812', 'INV-0812-1'))).toEqual([]);
    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    expect(result?.ok).toBe(true);

    const issued = invoiceOf('ORD-2026-0812', 'INV-0812-1');
    expect(issued.status).toBe('開立');
    expect(issued.buyer_address).toBe('高雄市前金區中正四路 200 號');
    expect(orderOf('ORD-2026-0812').customer.address).toBe('高雄市三民區博愛一路 88 號');
  });
});

describe('3.16 開立失敗留在草稿並顯示原因，直接開立失敗也落在草稿', () => {
  it('起點：第 2 期草稿留著最近一次失敗原因「買受人統編須為 8 碼」', () => {
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2')).toMatchObject({
      status: '草稿',
      tax_id: '8421057',
      issue_failure_reason: '買受人統編須為 8 碼',
    });
    expect(rule('invoiceIssueBlockers')(invoiceOf('ORD-2026-0812', 'INV-0812-2'))).toContain('買受人統編須為 8 碼');
  });

  it('不改統編再送一次仍失敗、留在草稿，該期開發票狀態維持未開立', () => {
    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-2');
    expect(result?.ok).toBe(false);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2')).toMatchObject({
      status: '草稿',
      issue_failure_reason: '買受人統編須為 8 碼',
    });
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').invoice_status).toBe('未開立');
  });

  it('統編改成 84210573 後送出成立，發票轉開立、該期轉已開立', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-2', { tax_id: '84210573' });
    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-2');
    expect(result?.ok).toBe(true);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2').status).toBe('開立');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').invoice_status).toBe('已開立');
  });

  it('平台當下回應拒絕時同樣留在草稿，失敗原因更新為平台回傳的那一次', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-2', { tax_id: '84210573' });
    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-2', {
      platform: '拒絕',
      platform_reason: '字軌號碼已用罄',
    });
    expect(result?.ok).toBe(false);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2')).toMatchObject({
      status: '草稿',
      issue_failure_reason: '字軌號碼已用罄',
    });
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').invoice_status).toBe('未開立');
  });

  it('第 4 期直接開立時統編 7 碼被擋：系統建一張草稿並記失敗原因，該期只剩送出開立', () => {
    store().issueInvoice('ORD-2026-0812', {
      category: 'B2B',
      buyer: '樂活運動用品社',
      tax_id: '8421057',
      items: [{ name: '秋季路跑完賽證書組 尾款 20%', count: 1, unit: '式', unit_price: 4000, item_amount: 4000 }],
      sales_amount: 4000,
      tax_amount: 200,
      amount_taxed: 4200,
      source_installment_id: 'BI-0812-4',
    });
    const landed = activeInvoicesOf('ORD-2026-0812', 'BI-0812-4');
    expect(landed).toHaveLength(1);
    expect(landed[0]).toMatchObject({ status: '草稿', issue_failure_reason: '買受人統編須為 8 碼' });
    expect(installmentOf('ORD-2026-0812', 'BI-0812-4').invoice_status).toBe('未開立');
    expect(entriesOf('ORD-2026-0812', 'BI-0812-4')).toEqual(['送出開立']);
  });
});

describe('3.17 同一期只容一張未作廢發票，兩人同時送出時後到者被拒', () => {
  it('寫入那一刻的檢查：已有草稿的期次擋下並提示重新整理，尚無發票的期次放行', () => {
    const invoices = orderOf('ORD-2026-0812').invoices;
    expect(rule('invoiceWriteBlocker')('BI-0812-1', invoices)).toMatch(/重新整理/);
    expect(rule('invoiceWriteBlocker')('BI-0812-4', invoices)).toBeNull();
  });

  it('業務甲先建草稿、業務乙隨後直接開立：甲成立、乙被拒，該期只有一張未作廢發票', () => {
    const first = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-4');
    expect(first?.ok).toBe(true);

    // 業務乙的視窗在業務甲寫入前就開著（看到的是尚無發票），送出時才撞上
    const second = store().issueInvoice('ORD-2026-0812', {
      category: 'B2B',
      buyer: '樂活運動用品社',
      tax_id: '84210573',
      items: [{ name: '秋季路跑完賽證書組 尾款 20%', count: 1, unit: '式', unit_price: 4000, item_amount: 4000 }],
      sales_amount: 4000,
      tax_amount: 200,
      amount_taxed: 4200,
      source_installment_id: 'BI-0812-4',
    });
    expect(second?.ok).toBe(false);
    expect(second?.reason).toMatch(/重新整理/);

    const active = activeInvoicesOf('ORD-2026-0812', 'BI-0812-4');
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(first.invoice_id);
    expect(active[0].status).toBe('草稿');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-4').invoice_status).toBe('未開立');
  });

  it('同一期第二次建立草稿同樣被拒', () => {
    const again = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-1');
    expect(again?.ok).toBe(false);
    expect(again?.reason).toMatch(/重新整理/);
    expect(activeInvoicesOf('ORD-2026-0812', 'BI-0812-1')).toHaveLength(1);
  });
});

describe('3.18 不要的草稿以取消收款項目處理，只有草稿的期次取消不必作廢', () => {
  it('草稿沒有單獨刪除的動作', () => {
    expect(store().deleteInvoiceDraft).toBeUndefined();
    expect(store().deleteInvoice).toBeUndefined();
  });

  it('只有草稿的期次不擋取消；有開立發票的期次擋下並提示先作廢', () => {
    const order = orderOf('ORD-2026-0812');
    const cancelBlocker = rule('installmentCancelBlocker');
    expect(cancelBlocker(installmentOf('ORD-2026-0812', 'BI-0812-1'), order.invoices)).toBeNull();

    const issuedOrder = orderOf('ORD-2026-0710'); // 鏈二訂金期已開立 INV-0710-1
    const bi = issuedOrder.billing_installments.find((b) => b.id === 'BI-0710-1');
    expect(cancelBlocker(bi, issuedOrder.invoices)).toBe('已開立發票，請先作廢該張發票');
  });

  it('取消第 1 期：草稿從發票區消失，PAY-0812-1 對第 1 期的核銷分配一併解除，已收到錢不擋', () => {
    store().cancelBillingInstallment('ORD-2026-0812', 'BI-0812-1', '客戶改為整筆尾款再開');
    const order = orderOf('ORD-2026-0812');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-1').cancelled).toBe(true);
    expect(order.invoices.find((iv) => iv.id === 'INV-0812-1')).toBeUndefined();
    expect(order.invoices.map((iv) => iv.id)).toEqual(['INV-0812-2', 'INV-0812-3']);
    const payment = order.payments.find((p) => p.id === 'PAY-0812-1');
    expect(payment.allocations.filter((a) => a.installment_id === 'BI-0812-1')).toEqual([]);
  });
});

describe('3.19 草稿與作廢不計入發票淨額、不出現在折讓單可選發票，已取消訂單仍可建草稿', () => {
  it('合成資料：開立 3,938、作廢 9,188、草稿 9,188，發票淨額只算開立的 3,938', () => {
    const order = {
      ...orderOf('ORD-2026-0803'),
      invoices: [
        { id: 'INV-T-1', status: '開立', amount_taxed: 3938, allowances: [] },
        { id: 'INV-T-2', status: '作廢', amount_taxed: 9188, allowances: [] },
        { id: 'INV-T-3', status: '草稿', amount_taxed: 9188, allowances: [] },
      ],
    };
    expect(calcReconciliation(order).net_invoiced).toBe(3938);
    expect(netInvoiced(order)).toBe(3938);
  });

  it('ORD-2026-0812 三張都是草稿時發票淨額為 0；第 1 期送出開立後為 4,200', () => {
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_invoiced).toBe(0);
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_received).toBe(4200);
    action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_invoiced).toBe(4200);
  });

  it('折讓單可選清單只列開立的那一張，兩張草稿不在其中', () => {
    action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    const selectable = rule('allowanceSelectableInvoices')(orderOf('ORD-2026-0812').invoices);
    expect(selectable.map((iv) => iv.id)).toEqual(['INV-0812-1']);
  });

  it('已取消的 ORD-2026-0813 照樣建得出設計費那一期的草稿，不以訂單狀態擋下', () => {
    store().cancelOrder('ORD-2026-0813');
    expect(orderOf('ORD-2026-0813').status).toBe('已取消');
    expect(entriesOf('ORD-2026-0813', 'BI-0813-1')).toEqual(['建立草稿', '直接開立發票']);
    const result = action('createInvoiceDraft')('ORD-2026-0813', 'BI-0813-1');
    expect(result?.ok).toBe(true);
    const drafts = activeInvoicesOf('ORD-2026-0813', 'BI-0813-1');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ status: '草稿', amount_taxed: 3150 });
  });
});

describe('3.20 草稿期間開發票狀態維持原值，發票作廢只動開發票狀態', () => {
  const statusOf = () => {
    const order = orderOf('ORD-2026-0812');
    const bi = installmentOf('ORD-2026-0812', 'BI-0812-1');
    const pending = pendingInvoiceRows(toListOrders(store().orders)).some((r) => r.key === 'BI-0812-1');
    return { invoice: bi.invoice_status, payment: calcInstallmentPaymentStatus(order, bi), pending };
  };

  it('五個時點的兩條狀態與待開發票清單', () => {
    // 起點（掛草稿）
    expect(statusOf()).toEqual({ invoice: '未開立', payment: '已收訖', pending: true });

    // 送出開立成功
    expect(action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1')?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已開立', payment: '已收訖', pending: false });

    // 發票作廢：只動開發票狀態
    store().voidInvoice('ORD-2026-0812', 'INV-0812-1', '統編打錯');
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-1').status).toBe('作廢');
    expect(statusOf()).toEqual({ invoice: '已作廢', payment: '已收訖', pending: true });

    // 重建草稿：開發票狀態維持已作廢
    const redraft = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-1');
    expect(redraft?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已作廢', payment: '已收訖', pending: true });

    // 草稿送出成功
    expect(action('submitInvoiceDraft')('ORD-2026-0812', redraft.invoice_id)?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已開立', payment: '已收訖', pending: false });
  });
});
