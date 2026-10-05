// 情境目錄第三章 3.14～3.20：發票草稿與開立失敗（單一「開立發票」入口、儲存草稿不檢核、開立時才檢核、
// 藍新回傳失敗或逾時轉開立失敗、一期一張含開立失敗、取消收款項目時草稿一併消失、
// 草稿與開立失敗不計入發票淨額、兩者期間開發票狀態維持原值）。期望值取自 change
// order-review-gate-invoice-draft-transfer-receipt 的 order-billing 規格差異檔 Scenario THEN，不由實作重算。
// 規則正本：wiki 發票狀態、收款項目開發票狀態、收款項目收款狀態、付款發票邏輯 § 五G、帳務 § 發票。
// 起點資料：鏈外 ORD-2026-0812（第 1、3 期草稿、第 2 期開立失敗「統編格式錯誤」、第 4 期尚無發票）、
// ORD-2026-0813（已回簽、一期設計費）、ORD-2026-0814（草稿訂單、尚無收款項目）。
//
// | 位置 | 名稱 | 約定 |
// | --- | --- | --- |
// | orders/_lib/billing-rules.js | installmentInvoiceEntries(installment, invoices) | 該期沒有未作廢發票或只有草稿時 ['開立發票']；有開立或開立失敗的發票、或該期已取消時 [] |
// | 同上 | draftInvoiceOf(installment, invoices) | 該期的草稿（按「開立發票」時帶入）；沒有回 null |
// | 同上 | invoiceWriteBlocker(installmentId, invoices) | 該期已有未作廢發票（含草稿與開立失敗）時回傳含「重新整理」的提示，否則 null |
// | 同上 | invoiceIssueBlockers(invoice) | 開立當下的系統檢核原因陣列；空陣列代表可送出。未稅目標值由發票金額（含稅）反推 |
// | 同上 | installmentCancelBlocker(installment, invoices) | 有開立的發票回「已開立發票，請先作廢該張發票」；有開立失敗的發票回「這一期的發票開立失敗，須先由後端人員刪除該筆紀錄」；否則 null |
// | 同上 | allowanceSelectableInvoices(invoices) | 折讓單可選的發票，只含狀態「開立」 |
// | orders/_lib/store.js | createInvoiceDraft(orderId, installmentId, overrides?) | 第一次儲存草稿，不檢核；回傳 { ok, invoice_id } 或 { ok: false, reason } |
// | 同上 | updateInvoiceDraft(orderId, invoiceId, patch) | 再次儲存草稿，不檢核 |
// | 同上 | submitInvoiceDraft(orderId, invoiceId, { platform, platform_reason }) | 自草稿開立；platform 預設「成功」，可為「失敗」「逾時」；系統檢核未過回 { ok: false, blocked: true, reasons } 且維持草稿；失敗或逾時回 { ok: false, status: '開立失敗' } |
// | 同上 | issueInvoice(orderId, fields) | 該期沒有草稿時開立；系統檢核未過回 blocked 且不建立發票；失敗或逾時建一張開立失敗的發票 |
// | 同上 | cancelBillingInstallment(orderId, id, reason) | 有開立或開立失敗的發票時擋下並回傳 { ok: false, reason }，只有草稿時草稿一併消失 |
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
/** 該期的未作廢發票（含草稿與開立失敗） */
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

const ISSUE_FIELDS_0812_4 = {
  category: 'B2B',
  buyer: '樂活運動用品社',
  items: [{ name: '秋季路跑完賽證書組 尾款 20%', count: 1, unit: '式', unit_price: 4000, item_amount: 4000 }],
  sales_amount: 4000,
  tax_amount: 200,
  amount_taxed: 4200,
  source_installment_id: 'BI-0812-4',
};

describe('3.14 收款項目上只有「開立發票」一個入口，對話框內可儲存草稿或開立', () => {
  it('尚無發票時只有「開立發票」', () => {
    const { first } = seedTwoInstallments0814();
    expect(entriesOf('ORD-2026-0814', first)).toEqual(['開立發票']);
  });

  it('儲存草稿：發票金額帶入 3,938、統編空白不擋；入口仍是開立發票並帶入這張草稿，開發票狀態與發票淨額不變', () => {
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
    expect(entriesOf('ORD-2026-0814', first)).toEqual(['開立發票']);
    expect(rule('draftInvoiceOf')(installmentOf('ORD-2026-0814', first), orderOf('ORD-2026-0814').invoices)?.id).toBe(
      result.invoice_id,
    );
  });

  it('補上統編後開立成功：取得號碼與開立時間，銷售額 3,750、稅額 188；該期轉已開立、不再出現開立發票', () => {
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

  it('舊的三個入口都已移除', () => {
    const { first } = seedTwoInstallments0814();
    const entries = entriesOf('ORD-2026-0814', first);
    for (const removed of ['建立草稿', '直接開立發票', '送出開立']) expect(entries).not.toContain(removed);
  });
});

describe('3.15 草稿不檢核、開立時才檢核：被系統擋下時維持草稿並顯示缺項，以草稿內容送出', () => {
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

  it('開立時擋下並列出未稅目標值 4,000、品項加總 3,998、差額 2；發票維持草稿、不送平台', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', { items: twoRows });
    const reasons = rule('invoiceIssueBlockers')(invoiceOf('ORD-2026-0812', 'INV-0812-1'));
    expect(reasons.join('；')).toMatch(/未稅目標值[^0-9]*4,000/);
    expect(reasons.join('；')).toMatch(/品項加總[^0-9]*3,998/);
    expect(reasons.join('；')).toMatch(/差額[^0-9]*2(?![0-9,])/);

    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    expect(result).toMatchObject({ ok: false, blocked: true, status: '草稿' });
    expect(result.reasons.join('；')).toMatch(/差額/);
    const draft = invoiceOf('ORD-2026-0812', 'INV-0812-1');
    expect(draft.status).toBe('草稿');
    expect(draft.issue_failure_reason ?? null).toBeNull();
    expect(installmentOf('ORD-2026-0812', 'BI-0812-1').invoice_status).toBe('未開立');
  });

  it('調平到 4,000 後開立成立，開出的發票帶草稿上的新地址，不自訂單重新帶入', () => {
    action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', {
      buyer_address: '高雄市前金區中正四路 200 號',
      items: [{ ...twoRows[0] }, { ...twoRows[1], unit_price: 2000, item_amount: 2000 }],
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

describe('3.16 藍新回傳失敗或逾時轉開立失敗；未存草稿被系統擋下時不建立發票', () => {
  it('起點：第 2 期發票為開立失敗、原因「統編格式錯誤」、沒有號碼；該期開發票狀態未開立、沒有入口', () => {
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2')).toMatchObject({
      status: '開立失敗',
      invoice_no: '',
      issue_failure_reason: '統編格式錯誤',
    });
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').invoice_status).toBe('未開立');
    expect(entriesOf('ORD-2026-0812', 'BI-0812-2')).toEqual([]);
  });

  it('第 4 期統編 7 碼開立：被系統擋下、列出「買受人統編須為 8 碼」，不建立任何發票，入口仍是開立發票', () => {
    const count = orderOf('ORD-2026-0812').invoices.length;
    const result = store().issueInvoice('ORD-2026-0812', { ...ISSUE_FIELDS_0812_4, tax_id: '8421057' });
    expect(result).toMatchObject({ ok: false, blocked: true });
    expect(result.reasons).toContain('買受人統編須為 8 碼');
    expect(orderOf('ORD-2026-0812').invoices).toHaveLength(count);
    expect(activeInvoicesOf('ORD-2026-0812', 'BI-0812-4')).toHaveLength(0);
    expect(entriesOf('ORD-2026-0812', 'BI-0812-4')).toEqual(['開立發票']);
  });

  it('第 4 期藍新回傳失敗：建一張開立失敗的發票並記原因，該期維持未開立、不再提供開立發票', () => {
    const result = store().issueInvoice('ORD-2026-0812', {
      ...ISSUE_FIELDS_0812_4,
      tax_id: '84210573',
      platform: '失敗',
      platform_reason: '統編格式錯誤',
    });
    expect(result).toMatchObject({ ok: false, status: '開立失敗' });
    const landed = activeInvoicesOf('ORD-2026-0812', 'BI-0812-4');
    expect(landed).toHaveLength(1);
    expect(landed[0]).toMatchObject({ status: '開立失敗', issue_failure_reason: '統編格式錯誤' });
    expect(landed[0].invoice_no || null).toBeNull();
    expect(installmentOf('ORD-2026-0812', 'BI-0812-4').invoice_status).toBe('未開立');
    expect(entriesOf('ORD-2026-0812', 'BI-0812-4')).toEqual([]);
  });

  it('第 1 期草稿開立時藍新逾時：草稿轉開立失敗、原因記逾時，不視為開立成功，發票淨額不變', () => {
    const result = action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1', { platform: '逾時' });
    expect(result).toMatchObject({ ok: false, status: '開立失敗' });
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-1')).toMatchObject({
      status: '開立失敗',
      issue_failure_reason: '逾時沒有回應',
    });
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-1').invoice_no || null).toBeNull();
    expect(installmentOf('ORD-2026-0812', 'BI-0812-1').invoice_status).toBe('未開立');
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_invoiced).toBe(0);
  });

  it('開立失敗的發票不能再當草稿儲存或再送', () => {
    expect(action('updateInvoiceDraft')('ORD-2026-0812', 'INV-0812-2', { tax_id: '84210573' })?.ok).toBe(false);
    expect(action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-2')?.ok).toBe(false);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2').status).toBe('開立失敗');
  });
});

describe('3.17 同一期只容一張未作廢發票（含草稿與開立失敗），兩人同時送出時後到者被拒', () => {
  it('寫入那一刻的檢查：已有草稿或開立失敗的期次擋下並提示重新整理，尚無發票的期次放行', () => {
    const invoices = orderOf('ORD-2026-0812').invoices;
    expect(rule('invoiceWriteBlocker')('BI-0812-1', invoices)).toMatch(/重新整理/);
    expect(rule('invoiceWriteBlocker')('BI-0812-2', invoices)).toMatch(/重新整理/);
    expect(rule('invoiceWriteBlocker')('BI-0812-4', invoices)).toBeNull();
  });

  it('業務甲先儲存草稿、業務乙隨後開立：甲成立、乙被拒，該期只有一張未作廢發票', () => {
    const first = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-4');
    expect(first?.ok).toBe(true);

    // 業務乙的視窗在業務甲寫入前就開著（看到的是尚無發票），按開立時才撞上
    const second = store().issueInvoice('ORD-2026-0812', { ...ISSUE_FIELDS_0812_4, tax_id: '84210573' });
    expect(second?.ok).toBe(false);
    expect(second?.reason).toMatch(/重新整理/);

    const active = activeInvoicesOf('ORD-2026-0812', 'BI-0812-4');
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(first.invoice_id);
    expect(active[0].status).toBe('草稿');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-4').invoice_status).toBe('未開立');
  });

  it('掛開立失敗的第 2 期：儲存草稿與開立都被拒，該期只有那一張', () => {
    const draft = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-2');
    expect(draft?.ok).toBe(false);
    expect(draft?.reason).toMatch(/重新整理/);
    const issue = store().issueInvoice('ORD-2026-0812', {
      ...ISSUE_FIELDS_0812_4,
      tax_id: '84210573',
      source_installment_id: 'BI-0812-2',
    });
    expect(issue?.ok).toBe(false);
    expect(issue?.reason).toMatch(/重新整理/);
    expect(activeInvoicesOf('ORD-2026-0812', 'BI-0812-2').map((iv) => iv.id)).toEqual(['INV-0812-2']);
  });

  it('同一期第二次儲存草稿（另建一張）同樣被拒', () => {
    const again = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-1');
    expect(again?.ok).toBe(false);
    expect(again?.reason).toMatch(/重新整理/);
    expect(activeInvoicesOf('ORD-2026-0812', 'BI-0812-1')).toHaveLength(1);
  });
});

describe('3.18 不要的草稿以取消收款項目處理；掛開立失敗發票的期次取消被擋下', () => {
  it('草稿沒有單獨刪除的動作', () => {
    expect(store().deleteInvoiceDraft).toBeUndefined();
    expect(store().deleteInvoice).toBeUndefined();
  });

  it('只有草稿的期次不擋取消；有開立發票的期次提示先作廢；有開立失敗的期次提示須先由後端人員刪除', () => {
    const order = orderOf('ORD-2026-0812');
    const cancelBlocker = rule('installmentCancelBlocker');
    expect(cancelBlocker(installmentOf('ORD-2026-0812', 'BI-0812-1'), order.invoices)).toBeNull();
    expect(cancelBlocker(installmentOf('ORD-2026-0812', 'BI-0812-2'), order.invoices)).toBe(
      '這一期的發票開立失敗，須先由後端人員刪除該筆紀錄',
    );

    const issuedOrder = orderOf('ORD-2026-0710'); // 鏈二訂金期已開立 INV-0710-1
    const bi = issuedOrder.billing_installments.find((b) => b.id === 'BI-0710-1');
    expect(cancelBlocker(bi, issuedOrder.invoices)).toBe('已開立發票，請先作廢該張發票');
  });

  it('取消第 2 期被擋下：該期維持未取消、開立失敗的發票仍在', () => {
    const result = store().cancelBillingInstallment('ORD-2026-0812', 'BI-0812-2', '客戶改分期');
    expect(result?.ok).toBe(false);
    expect(result?.reason).toMatch(/後端人員/);
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').cancelled).toBe(false);
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-2').status).toBe('開立失敗');
  });

  it('取消第 1 期：草稿一併消失，PAY-0812-1 對第 1 期的核銷分配一併解除，已收到錢不擋', () => {
    store().cancelBillingInstallment('ORD-2026-0812', 'BI-0812-1', '客戶改為整筆尾款再開');
    const order = orderOf('ORD-2026-0812');
    expect(installmentOf('ORD-2026-0812', 'BI-0812-1').cancelled).toBe(true);
    expect(order.invoices.find((iv) => iv.id === 'INV-0812-1')).toBeUndefined();
    expect(order.invoices.map((iv) => iv.id)).toEqual(['INV-0812-2', 'INV-0812-3']);
    const payment = order.payments.find((p) => p.id === 'PAY-0812-1');
    expect(payment.allocations.filter((a) => a.installment_id === 'BI-0812-1')).toEqual([]);
  });
});

describe('3.19 草稿、開立失敗與作廢不計入發票淨額、不出現在折讓單可選發票，已取消訂單仍可儲存草稿', () => {
  it('合成資料：開立 3,938、作廢 9,188、草稿 9,188、開立失敗 4,200，發票淨額只算開立的 3,938', () => {
    const order = {
      ...orderOf('ORD-2026-0803'),
      invoices: [
        { id: 'INV-T-1', status: '開立', amount_taxed: 3938, allowances: [] },
        { id: 'INV-T-2', status: '作廢', amount_taxed: 9188, allowances: [] },
        { id: 'INV-T-3', status: '草稿', amount_taxed: 9188, allowances: [] },
        { id: 'INV-T-4', status: '開立失敗', amount_taxed: 4200, allowances: [] },
      ],
    };
    expect(calcReconciliation(order).net_invoiced).toBe(3938);
    expect(netInvoiced(order)).toBe(3938);
  });

  it('ORD-2026-0812 起點發票淨額為 0；第 1 期開立後為 4,200', () => {
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_invoiced).toBe(0);
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_received).toBe(4200);
    action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    expect(calcReconciliation(orderOf('ORD-2026-0812')).net_invoiced).toBe(4200);
  });

  it('折讓單可選清單只列開立的那一張，草稿與開立失敗不在其中', () => {
    action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1');
    const selectable = rule('allowanceSelectableInvoices')(orderOf('ORD-2026-0812').invoices);
    expect(selectable.map((iv) => iv.id)).toEqual(['INV-0812-1']);
  });

  it('已取消的 ORD-2026-0813 照樣存得出設計費那一期的草稿，不以訂單狀態擋下', () => {
    store().cancelOrder('ORD-2026-0813');
    expect(orderOf('ORD-2026-0813').status).toBe('已取消');
    expect(entriesOf('ORD-2026-0813', 'BI-0813-1')).toEqual(['開立發票']);
    const result = action('createInvoiceDraft')('ORD-2026-0813', 'BI-0813-1');
    expect(result?.ok).toBe(true);
    const drafts = activeInvoicesOf('ORD-2026-0813', 'BI-0813-1');
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({ status: '草稿', amount_taxed: 3150 });
  });
});

describe('3.20 草稿與開立失敗期間開發票狀態維持原值，發票作廢只動開發票狀態', () => {
  const statusOf = () => {
    const order = orderOf('ORD-2026-0812');
    const bi = installmentOf('ORD-2026-0812', 'BI-0812-1');
    const pending = pendingInvoiceRows(toListOrders(store().orders)).some((r) => r.key === 'BI-0812-1');
    return { invoice: bi.invoice_status, payment: calcInstallmentPaymentStatus(order, bi), pending };
  };

  it('五個時點的兩條狀態與待開發票清單', () => {
    // 起點（掛草稿）
    expect(statusOf()).toEqual({ invoice: '未開立', payment: '已收訖', pending: true });

    // 開立成功
    expect(action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-1')?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已開立', payment: '已收訖', pending: false });

    // 發票作廢：只動開發票狀態
    store().voidInvoice('ORD-2026-0812', 'INV-0812-1', '統編打錯');
    expect(invoiceOf('ORD-2026-0812', 'INV-0812-1').status).toBe('作廢');
    expect(statusOf()).toEqual({ invoice: '已作廢', payment: '已收訖', pending: true });

    // 重存草稿：開發票狀態維持已作廢
    const redraft = action('createInvoiceDraft')('ORD-2026-0812', 'BI-0812-1');
    expect(redraft?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已作廢', payment: '已收訖', pending: true });

    // 草稿開立成功
    expect(action('submitInvoiceDraft')('ORD-2026-0812', redraft.invoice_id)?.ok).toBe(true);
    expect(statusOf()).toEqual({ invoice: '已開立', payment: '已收訖', pending: false });
  });

  it('開立失敗期間開發票狀態維持未開立，收款項目開發票狀態只有三值', () => {
    expect(installmentOf('ORD-2026-0812', 'BI-0812-2').invoice_status).toBe('未開立');
    action('submitInvoiceDraft')('ORD-2026-0812', 'INV-0812-3', { platform: '失敗', platform_reason: '統編格式錯誤' });
    expect(installmentOf('ORD-2026-0812', 'BI-0812-3').invoice_status).toBe('未開立');
    const values = new Set(orderOf('ORD-2026-0812').billing_installments.map((bi) => bi.invoice_status));
    for (const v of values) expect(['未開立', '已開立', '已作廢']).toContain(v);
  });
});
