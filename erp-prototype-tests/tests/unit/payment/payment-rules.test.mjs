// 情境目錄第三章「款項與發票」中帶明確算式或跨訂單清單規則的條目：收款項目合計、
// 反推未稅、核銷分配推導、三方對帳、跨訂單四張清單。畫面操作的驗收在 tests/e2e/03-payment。
//
// 本檔直接呼叫 erp orders/_lib/store.js 的 store 動作與其匯出的純衍生函式（calcReconciliation、
// calcInstallmentCollected、calcInstallmentPaymentStatus、calcPaymentUnallocated），以及
// payment/_lib/derive.js 的跨訂單清單純函式。orders/_components/detail/billing/*.js 內雖也
// 匯出部分算式（如 IssueInvoiceModal 的 untaxedOfTaxed／calcInvoiceAmounts），但那些檔案含
// JSX，vitest 的 esbuild 設定不吃 .js 檔內的 JSX 語法，故無法在此匯入；相關數字改在
// e2e 由畫面顯示字串驗證（3.4／3.5）。此為既有邊界，建議見測試回報「對共用工具的提議」。
//
// store 為 zustand 單例，跨 it() 的動作會累積在同一份記憶體狀態上——本檔刻意讓每個情境的
// 起點資料各用不同訂單（或在同一張訂單內延續情境目錄本身的敘事鏈），避免互相污染。

import { describe, it, expect } from 'vitest';
import {
  useOrdersStore,
  calcReconciliation,
  calcInstallmentPaymentStatus,
  calcPaymentUnallocated,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  receivableRows,
  pendingInvoiceRows,
  refundPayoutRows,
  billingAnomalyRows,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/derive.js';
import { MOCK_ORDERS as PAYMENT_MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/mock-data.js';

const store = () => useOrdersStore.getState();
const orderOf = (id) => store().getOrder(id);
const installmentOf = (order, id) => order.billing_installments.find((bi) => bi.id === id);

describe('3.1 業務規劃收款項目分期', () => {
  it('鏈二 ORD-2026-0710：起點兩期合計 20,300 加 47,425 等於應收總額 67,725', () => {
    const order = orderOf('ORD-2026-0710');
    const scheduled = order.billing_installments
      .filter((bi) => !bi.cancelled)
      .reduce((s, bi) => s + bi.amount_taxed, 0);
    expect(scheduled).toBe(67725);
    expect(calcReconciliation(order).receivable).toBe(67725);
  });

  it('新增收款項目：新期次開發票狀態落未開立、收款狀態落未收（由 calcInstallmentPaymentStatus 推導）', () => {
    store().addBillingInstallment('ORD-2026-0901', {
      description: '加印款',
      amount_taxed: 3000,
      planned_method: '匯款',
      planned_paid_date: '2026-09-20',
      planned_issue_date: '2026-09-20',
    });
    const order = orderOf('ORD-2026-0901');
    const added = order.billing_installments.find((bi) => bi.description === '加印款');
    expect(added.invoice_status).toBe('尚未開立');
    expect(store().getOrder('ORD-2026-0901').billing_installments).toContainEqual(
      expect.objectContaining({ description: '加印款', amount_taxed: 3000 }),
    );
    expect(calcInstallmentPaymentStatus(order, added)).toBe('未付款');
  });

  it('編輯既有一期改金額；取消一期後退出合計與進度推導，但仍留在列表上', () => {
    store().updateBillingInstallment('ORD-2026-0901', 'BI-0901-2', { amount_taxed: 15000 });
    let order = orderOf('ORD-2026-0901');
    expect(installmentOf(order, 'BI-0901-2').amount_taxed).toBe(15000);
    expect(installmentOf(order, 'BI-0901-2').change_count).toBe(0); // 金額變動不算 change_count（只有日期變動才算）

    store().cancelBillingInstallment('ORD-2026-0901', 'BI-0901-2', '客戶取消加印');
    order = orderOf('ORD-2026-0901');
    const cancelled = installmentOf(order, 'BI-0901-2');
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.cancel_reason).toBe('客戶取消加印');
    // 取消仍留在列表（不是刪除）
    expect(order.billing_installments.map((bi) => bi.id)).toContain('BI-0901-2');
    // 未取消期次合計不再含這期
    const scheduled = order.billing_installments
      .filter((bi) => !bi.cancelled)
      .reduce((s, bi) => s + bi.amount_taxed, 0);
    expect(scheduled).toBe(order.billing_installments.find((bi) => bi.id === 'BI-0901-1').amount_taxed + 3000);
  });

  it('已開立發票的期次不得取消（畫面以停用鈕擋，本測試驗證資料前提：BI-0901-1 發票狀態已開立）', () => {
    const order = orderOf('ORD-2026-0901');
    expect(installmentOf(order, 'BI-0901-1').invoice_status).toBe('已開立');
  });

  it('取消收款項目一併解除掛在它身上的核銷分配，那筆錢回到未分配', () => {
    // 用一張全新期次示範：先收款分配，再取消期次，分配應被移除
    store().addBillingInstallment('ORD-2026-0920', {
      description: '測試期次-待取消',
      amount_taxed: 5000,
      planned_method: '匯款',
      planned_paid_date: '2026-09-20',
    });
    let order = orderOf('ORD-2026-0920');
    const target = order.billing_installments.find((bi) => bi.description === '測試期次-待取消');
    store().addPayment('ORD-2026-0920', {
      type: '收款',
      status: '已完成',
      amount_taxed: 5000,
      allocations: [{ installment_id: target.id, amount: 5000 }],
      method: '銀行轉帳',
      completed_at: '2026-09-20',
    });
    order = orderOf('ORD-2026-0920');
    const payment = order.payments.find((p) => p.allocations?.some((a) => a.installment_id === target.id));
    expect(payment.allocations).toHaveLength(1);

    store().cancelBillingInstallment('ORD-2026-0920', target.id, '測試取消');
    order = orderOf('ORD-2026-0920');
    const paymentAfter = order.payments.find((p) => p.id === payment.id);
    expect(paymentAfter.allocations).toHaveLength(0);
  });
});

describe('3.2 收款項目合計與應收總額不符時顯示差額提示', () => {
  it('尾款期改成 40,000 後合計 20,300+40,000=60,300 與應收總額 67,725 不一致', () => {
    store().updateBillingInstallment('ORD-2026-0710', 'BI-0710-2', { amount_taxed: 40000 });
    const order = orderOf('ORD-2026-0710');
    const scheduled = order.billing_installments
      .filter((bi) => !bi.cancelled)
      .reduce((s, bi) => s + bi.amount_taxed, 0);
    expect(scheduled).toBe(60300);
    expect(scheduled).not.toBe(calcReconciliation(order).receivable);
  });

  it('金額改回原值後兩數字重新一致（警示消失的資料前提）', () => {
    store().updateBillingInstallment('ORD-2026-0710', 'BI-0710-2', { amount_taxed: 47425 });
    const order = orderOf('ORD-2026-0710');
    const scheduled = order.billing_installments
      .filter((bi) => !bi.cancelled)
      .reduce((s, bi) => s + bi.amount_taxed, 0);
    expect(scheduled).toBe(calcReconciliation(order).receivable);
  });
});

describe('3.3 預開發票單張超上限時規劃階段拆多期', () => {
  it('拆成任意期數，各期金額合計等於要預開的總額即可（不限期數與拆法）', () => {
    // 示範：把一筆 30,000 的預開總額拆成三期（各期都在假設的單張上限 15,000 內）
    for (const [description, amount] of [
      ['預開第一期', 12000],
      ['預開第二期', 10000],
      ['預開第三期', 8000],
    ]) {
      store().addBillingInstallment('ORD-2026-0903', {
        description,
        amount_taxed: amount,
        planned_method: '匯款',
        planned_paid_date: '2026-09-25',
      });
    }
    const order = orderOf('ORD-2026-0903');
    const total = ['預開第一期', '預開第二期', '預開第三期']
      .map((d) => order.billing_installments.find((bi) => bi.description === d).amount_taxed)
      .reduce((s, v) => s + v, 0);
    expect(total).toBe(30000);
  });
});

describe('3.4 以收款項目一鍵開立發票（金額口徑，錨例 ORD-2026-0803）', () => {
  // 未稅一律由含稅反推、取整零頭落在稅額；算式與 IssueInvoiceModal.untaxedOfTaxed 一致
  // （store 不重算，只原樣寫入呼叫端算好的三個金額，故此處自行依 wiki 拍板算式驗算）
  const untaxedOfTaxed = (taxed, rate = 0.05) => Math.round(taxed / (1 + rate));

  it('錨例：3,938 反推未稅 3,750、稅額 188；9,188 反推未稅 8,750、稅額 438', () => {
    expect(untaxedOfTaxed(3938)).toBe(3750);
    expect(3938 - untaxedOfTaxed(3938)).toBe(188);
    expect(untaxedOfTaxed(9188)).toBe(8750);
    expect(9188 - untaxedOfTaxed(9188)).toBe(438);
  });

  it('兩張未稅合計 12,500 與未稅基準 12,501 差 1 元屬取整正常誤差', () => {
    const sum = untaxedOfTaxed(3938) + untaxedOfTaxed(9188);
    expect(sum).toBe(12500);
    expect(12501 - sum).toBe(1);
  });

  it('鏈二 ORD-2026-0710 尾款期開立發票：未稅 45,167、稅額 2,258，開立後期次轉已開立、不再有開立入口', () => {
    const rate = 0.05;
    const targetTaxed = 47425;
    const untaxed = untaxedOfTaxed(targetTaxed, rate);
    expect(untaxed).toBe(45167);
    const tax = targetTaxed - untaxed;
    expect(tax).toBe(2258);

    store().issueInvoice('ORD-2026-0710', {
      category: 'B2B',
      buyer: '台北數位行銷有限公司',
      tax_id: '53192647',
      items: [{ name: '尾款 70%', count: 1, unit: '式', unit_price: untaxed, item_amount: untaxed }],
      sales_amount: untaxed,
      tax_amount: tax,
      amount_taxed: targetTaxed,
      source_installment_id: 'BI-0710-2',
    });

    const order = orderOf('ORD-2026-0710');
    const bi = installmentOf(order, 'BI-0710-2');
    expect(bi.invoice_status).toBe('已開立');
    expect(bi.invoice_info).toBeTruthy();
    const invoice = order.invoices.find((iv) => iv.invoice_no === bi.invoice_info);
    expect(invoice.amount_taxed).toBe(47425);
    expect(invoice.sales_amount).toBe(45167);
    expect(invoice.tax_amount).toBe(2258);
    expect(invoice.status).toBe('已開立');
  });
});

describe('3.6 已開立的發票作廢重開', () => {
  it('作廢 INV-0710-1：發票轉已作廢並留原因、期次開發票狀態回已作廢', () => {
    store().voidInvoice('ORD-2026-0710', 'INV-0710-1', '買受人統編打錯');
    const order = orderOf('ORD-2026-0710');
    const invoice = order.invoices.find((iv) => iv.id === 'INV-0710-1');
    expect(invoice.status).toBe('已作廢');
    expect(invoice.invalid_reason).toBe('買受人統編打錯');
    expect(installmentOf(order, 'BI-0710-1').invoice_status).toBe('已作廢');
  });

  it('對同一期重新開立一張：期次轉已開立，原作廢張金額不受牽動', () => {
    const untaxedOfTaxed = (taxed, rate = 0.05) => Math.round(taxed / (1 + rate));
    const targetTaxed = 20300;
    const untaxed = untaxedOfTaxed(targetTaxed);
    const tax = targetTaxed - untaxed;

    store().issueInvoice('ORD-2026-0710', {
      category: 'B2B',
      buyer: '台北數位行銷有限公司',
      tax_id: '53192647',
      items: [{ name: '訂金 30%', count: 1, unit: '式', unit_price: untaxed, item_amount: untaxed }],
      sales_amount: untaxed,
      tax_amount: tax,
      amount_taxed: targetTaxed,
      source_installment_id: 'BI-0710-1',
    });

    const order = orderOf('ORD-2026-0710');
    const bi = installmentOf(order, 'BI-0710-1');
    expect(bi.invoice_status).toBe('已開立');
    const newInvoiceNo = bi.invoice_info;
    const newInvoice = order.invoices.find((iv) => iv.invoice_no === newInvoiceNo);
    expect(newInvoice.status).toBe('已開立');
    expect(newInvoice.amount_taxed).toBe(20300);

    const oldInvoice = order.invoices.find((iv) => iv.id === 'INV-0710-1');
    expect(oldInvoice.status).toBe('已作廢');
    expect(oldInvoice.amount_taxed).toBe(20300); // 作廢張金額不受重開牽動
  });
});

describe('3.7 開出後折讓減額', () => {
  it('建立折讓：發票淨額扣掉折讓金額，發票本身維持開立；金額落在剩餘可折讓額度內', () => {
    let order = orderOf('ORD-2026-0710');
    const bi = installmentOf(order, 'BI-0710-1');
    const invoiceNo = bi.invoice_info;
    const invoice = order.invoices.find((iv) => iv.invoice_no === invoiceNo);
    expect(invoice.amount_taxed).toBe(20300);

    store().createAllowance('ORD-2026-0710', invoice.id, { amount_taxed: 5000, reason: '色差客訴部分退款' });
    order = orderOf('ORD-2026-0710');
    const updated = order.invoices.find((iv) => iv.id === invoice.id);
    expect(updated.status).toBe('已開立'); // 發票本身維持開立
    const allowance = updated.allowances.find((a) => a.reason === '色差客訴部分退款');
    expect(allowance.status).toBe('已確認');
    expect(allowance.amount_taxed).toBe(5000);
    expect(allowance.remain_amount).toBe(20300 - 5000);

    const usedConfirmed = updated.allowances
      .filter((a) => a.status === '已確認')
      .reduce((s, a) => s + Math.abs(a.amount_taxed), 0);
    expect(invoice.amount_taxed - usedConfirmed).toBe(15300); // 折讓後發票淨額

    expect(calcReconciliation(order).invoiced_breakdown.allowances).toBe(5000);
  });

  it('作廢折讓後發票淨額回補，且已作廢折讓不佔額度', () => {
    let order = orderOf('ORD-2026-0710');
    const bi = installmentOf(order, 'BI-0710-1');
    const invoice = order.invoices.find((iv) => iv.invoice_no === bi.invoice_info);
    const allowance = invoice.allowances.find((a) => a.reason === '色差客訴部分退款');

    store().voidAllowance('ORD-2026-0710', invoice.id, allowance.id, '客戶撤回客訴');
    order = orderOf('ORD-2026-0710');
    const updatedInvoice = order.invoices.find((iv) => iv.id === invoice.id);
    const updatedAllowance = updatedInvoice.allowances.find((a) => a.id === allowance.id);
    expect(updatedAllowance.status).toBe('已作廢');

    const usedConfirmed = updatedInvoice.allowances
      .filter((a) => a.status === '已確認')
      .reduce((s, a) => s + Math.abs(a.amount_taxed), 0);
    expect(usedConfirmed).toBe(0); // 已作廢折讓不佔額度
    expect(calcReconciliation(order).invoiced_breakdown.allowances).toBe(0); // 發票淨額回補
  });
});

describe('3.8 登錄款項並核銷分配到指定期次', () => {
  it('款項狀態處理中時不計入收款淨額，切已完成後計入且期次收款狀態依累計入帳推導', () => {
    store().addPayment('ORD-2026-0710', {
      type: '收款',
      status: '處理中',
      amount_taxed: 47425,
      allocations: [{ installment_id: 'BI-0710-2', amount: 47425 }],
      method: '銀行轉帳',
      third_party_ref: 'TXN-0915-0710',
      completed_at: null,
    });
    let order = orderOf('ORD-2026-0710');
    const before = calcReconciliation(order);
    expect(before.net_received).toBe(20300); // 訂金已收，尾款仍處理中不計入

    const payment = order.payments.find((p) => p.third_party_ref === 'TXN-0915-0710');
    store().updatePayment('ORD-2026-0710', payment.id, { status: '已完成', completed_at: '2026-09-15' });
    order = orderOf('ORD-2026-0710');
    const after = calcReconciliation(order);
    expect(after.net_received).toBe(67725);
    expect(after.balanced).toBe(true); // 應收、收款、發票三方在此鏈已全數對齊
  });

  it('分配金額合計不得超過本筆款項金額（畫面端擋下；此處驗證資料前提：分配未超額）', () => {
    const order = orderOf('ORD-2026-0710');
    const payment = order.payments.find((p) => p.third_party_ref === 'TXN-0915-0710');
    const allocatedTotal = payment.allocations.reduce((s, a) => s + a.amount, 0);
    expect(allocatedTotal).toBeLessThanOrEqual(payment.amount_taxed);
  });
});

describe('3.9 一筆匯款跨多期分配', () => {
  it('把 ORD-2026-0920 拆成兩期後，一筆款項同時勾兩期分配，兩期收款狀態依各自累計分別推導', () => {
    store().addBillingInstallment('ORD-2026-0920', {
      description: '第二期尾款',
      amount_taxed: 10000,
      planned_method: '匯款',
      planned_paid_date: '2026-10-01',
    });
    // 原 BI-0920-1 改成第一期（保留原金額 42,630 不動），新增的 10,000 為第二期
    let order = orderOf('ORD-2026-0920');
    const bi1 = order.billing_installments.find((bi) => bi.id === 'BI-0920-1');
    const bi2 = order.billing_installments.find((bi) => bi.description === '第二期尾款');

    store().addPayment('ORD-2026-0920', {
      type: '收款',
      status: '已完成',
      amount_taxed: 20000,
      allocations: [
        { installment_id: bi1.id, amount: 15000 },
        { installment_id: bi2.id, amount: 5000 },
      ],
      method: '銀行轉帳',
      third_party_ref: 'TXN-CROSS-0920',
      completed_at: '2026-09-20',
    });

    order = orderOf('ORD-2026-0920');
    expect(calcInstallmentPaymentStatus(order, bi1)).toBe('部分付款'); // 15,000 / 42,630
    expect(calcInstallmentPaymentStatus(order, bi2)).toBe('部分付款'); // 5,000 / 10,000，兩期各自累計、互不干擾
  });
});

describe('3.10 溢收餘額掛預收（未分配）', () => {
  it('款項金額大於各期未收餘額合計，各期填到滿之後，未分配差額由系統記入預收（不懸空）', () => {
    const order = orderOf('ORD-2026-0920');
    const bi1 = order.billing_installments.find((bi) => bi.id === 'BI-0920-1'); // 剩餘可收 42,630-15,000=27,630
    const bi2 = order.billing_installments.find((bi) => bi.description === '第二期尾款'); // 已滿收，理論上不會再分配

    // 業務把款項金額填得比未收餘額合計還多：以 30,000 對照剩餘 27,630（bi1 未收餘額）
    store().addPayment('ORD-2026-0920', {
      type: '收款',
      status: '已完成',
      amount_taxed: 30000,
      allocations: [{ installment_id: bi1.id, amount: 27630 }], // 各期填到滿（bi1 收滿 42,630）
      method: '銀行轉帳',
      third_party_ref: 'TXN-OVERPAY-0920',
      completed_at: '2026-09-21',
    });

    const updated = orderOf('ORD-2026-0920');
    const payment = updated.payments.find((p) => p.third_party_ref === 'TXN-OVERPAY-0920');
    // 這筆錢沒有任何一塊錢懸空：金額 30,000，已分配 27,630，未分配（記入預收）2,370
    expect(calcPaymentUnallocated(payment)).toBe(2370);
    expect(calcInstallmentPaymentStatus(updated, bi1)).toBe('已付款'); // 15,000+27,630=42,630 已達門檻
  });
});

describe('3.11 三方對帳與跨訂單四張清單', () => {
  it('ORD-2026-0601 對帳通過（差額為零）', () => {
    const order = orderOf('ORD-2026-0601');
    const recon = calcReconciliation(order);
    expect(recon.balanced).toBe(true);
  });

  it('ORD-2026-0710（起點，未受本檔後續動作影響——payment/_lib/mock-data 為靜態複本）收款差額與發票差額皆為 47,425', () => {
    const recon = billingAnomalyRows(PAYMENT_MOCK_ORDERS); // 觸發一次讀取確保模組載入
    const order = PAYMENT_MOCK_ORDERS.find((o) => o.order_no === 'ORD-2026-0710');
    expect(order.receivable_taxed).toBe(67725);
    expect(recon).toEqual([]); // 起點資料無帳務異常
  });

  it('應收款項清單列出六張尾款未收的訂單', () => {
    const rows = receivableRows(PAYMENT_MOCK_ORDERS);
    const orderNos = rows.map((r) => r.order_no);
    for (const no of ['ORD-2026-0710', 'ORD-2026-0815', 'ORD-2026-0820', 'ORD-2026-0901', 'ORD-2026-0903', 'ORD-2026-0904']) {
      expect(orderNos).toContain(no);
    }
  });

  it('待開發票清單列出各訂單未開立的期次', () => {
    const rows = pendingInvoiceRows(PAYMENT_MOCK_ORDERS);
    const bi0710 = rows.find((r) => r.order_no === 'ORD-2026-0710');
    expect(bi0710.amount_taxed).toBe(47425);
    expect(bi0710.invoice_status).toBe('尚未開立');
  });

  it('待退款清單與帳務異常清單皆無資料（現行資料沒有退款款項、沒有超收也沒有超額發票）', () => {
    expect(refundPayoutRows(PAYMENT_MOCK_ORDERS)).toEqual([]);
    expect(billingAnomalyRows(PAYMENT_MOCK_ORDERS)).toEqual([]);
  });
});

// 3.5／3.12：3.5 的品項調平與差額擋下邏輯在 IssueInvoiceModal.js（含 JSX，此檔無法匯入），
// 改於 tests/e2e/03-payment 以畫面顯示字串驗證。3.12 純為 UI 呈現與清單不存在的驗證，
// 無跨函式算式可測，同樣併入 e2e。

