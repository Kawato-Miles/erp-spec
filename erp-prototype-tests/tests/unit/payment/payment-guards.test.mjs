// 情境目錄第三章「款項與發票」的把關規則（手冊對照 Prototype 修訂 D17-2～D17-6、B2、B3）：
// 切已完成的條件、單期分配上限、訂單付款狀態「已退款」、作廢發票申報期限、帳務公司顯示抬頭、
// 應收金額卡三格同一口徑、兩張查帳清單讀即時資料。
// 規則正本：wiki 款項狀態、收款項目狀態、付款發票邏輯、訂單（付款狀態）、發票狀態、
// 發票法規硬約束-ezPay-MIG § 4.1、帳務（帳務公司）。
//
// 本檔另開一支、不併入 payment-rules.test.mjs：store 為 zustand 單例，各測試檔各自一份模組狀態，
// 這裡的寫入動作不會污染該檔的敘事鏈。

import { describe, it, expect } from 'vitest';
import {
  allocationOverCaps,
  completionBlockers,
  invoiceVoidDeadline,
  isWithinVoidDeadline,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/billing-rules.js';
import {
  deriveOrderAmounts,
  receivableSummaryOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/order-amounts.js';
import {
  useOrdersStore,
  calcPaymentSummary,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { accountCompanyName } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { BILLING_COMPANY_LABELS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/constants.js';
import {
  pendingInvoiceRows,
  receivableRows,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/derive.js';
import { toListOrders } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/mock-data.js';

const store = () => useOrdersStore.getState();
const orderOf = (id) => store().getOrder(id);
const FILE = [{ id: 'PAYF-T-1', name: '入帳憑證-TXN-TEST.pdf' }];

describe('3.6 作廢發票限申報期限內（D17-5）', () => {
  it('兩個月一期，最晚到下一期第一個月 14 日', () => {
    expect(invoiceVoidDeadline('2026-05-01')).toBe('2026-07-14'); // wiki 例：7/14 前可作廢 5/1-6/30
    expect(invoiceVoidDeadline('2026-06-30')).toBe('2026-07-14');
    expect(invoiceVoidDeadline('2026-08-12')).toBe('2026-09-14'); // 鏈二 SSP-26081201
    expect(invoiceVoidDeadline('2026-09-02')).toBe('2026-11-14');
    expect(invoiceVoidDeadline('2026-11-05')).toBe('2027-01-14'); // 跨年
    expect(invoiceVoidDeadline('2026-12-31')).toBe('2027-01-14');
  });

  it('期限日當天仍可作廢，隔天起只能折讓', () => {
    expect(isWithinVoidDeadline('2026-08-12', '2026-09-14')).toBe(true);
    expect(isWithinVoidDeadline('2026-08-12', '2026-09-15')).toBe(false);
    expect(isWithinVoidDeadline('2026-09-02', '2026-09-24')).toBe(true);
    expect(isWithinVoidDeadline('2026-06-20', '2026-09-24')).toBe(false); // 鏈一 6 月開立
  });
});

describe('3.8 收款每一期累計分配不超過該期預計金額（D17-3）', () => {
  const order = () => orderOf('ORD-2026-0815'); // 訂金 10,584 已由 PAY-0815-1 分配滿；尾款 24,696 未收

  it('已分配滿的訂金期再分配 1 元即超過上限', () => {
    const o = order();
    const over = allocationOverCaps({
      type: '收款',
      allocations: [{ installment_id: 'BI-0815-1', amount: 1 }],
      installments: o.billing_installments,
      payments: o.payments,
    });
    expect(over).toHaveLength(1);
    expect(over[0]).toMatchObject({ installment_id: 'BI-0815-1', cap: 0, amount: 1 });
  });

  it('尾款期填 24,696 在上限內、填 24,697 超過', () => {
    const o = order();
    const args = { type: '收款', installments: o.billing_installments, payments: o.payments };
    expect(allocationOverCaps({ ...args, allocations: [{ installment_id: 'BI-0815-2', amount: 24696 }] })).toEqual([]);
    expect(allocationOverCaps({ ...args, allocations: [{ installment_id: 'BI-0815-2', amount: 24697 }] })).toHaveLength(1);
  });

  it('編輯既有款項時不把自己原本的分配算進其他款項', () => {
    const o = order();
    expect(
      allocationOverCaps({
        type: '收款',
        allocations: [{ installment_id: 'BI-0815-1', amount: 10584 }],
        installments: o.billing_installments,
        payments: o.payments,
        editingId: 'PAY-0815-1',
      }),
    ).toEqual([]);
  });

  it('退款不套用本上限', () => {
    const o = order();
    expect(
      allocationOverCaps({
        type: '退款',
        allocations: [{ installment_id: 'BI-0815-1', amount: 99999 }],
        installments: o.billing_installments,
        payments: o.payments,
      }),
    ).toEqual([]);
  });
});

describe('3.8／3.10 切已完成須掛對帳附件且全額有歸屬（D17-2）', () => {
  const base = () => {
    const o = orderOf('ORD-2026-0815');
    return { installments: o.billing_installments, payments: o.payments };
  };

  it('沒有對帳附件時擋下', () => {
    const reasons = completionBlockers({
      ...base(),
      type: '收款',
      amount: 24696,
      allocations: [{ installment_id: 'BI-0815-2', amount: 24696 }],
      files: [],
    });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/對帳附件/);
  });

  it('附件齊、金額全數分配時可切已完成', () => {
    expect(
      completionBlockers({
        ...base(),
        type: '收款',
        amount: 24696,
        allocations: [{ installment_id: 'BI-0815-2', amount: 24696 }],
        files: FILE,
      }),
    ).toEqual([]);
  });

  it('還有期次沒分配到上限時，餘額不能掛預收', () => {
    const reasons = completionBlockers({
      ...base(),
      type: '收款',
      amount: 20000,
      allocations: [{ installment_id: 'BI-0815-2', amount: 15000 }],
      files: FILE,
    });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/還有 5,000 元沒有分配/);
  });

  it('各期都分配到上限後，剩餘金額記入預收、可切已完成（溢收）', () => {
    expect(
      completionBlockers({
        ...base(),
        type: '收款',
        amount: 30000,
        allocations: [{ installment_id: 'BI-0815-2', amount: 24696 }],
        files: FILE,
      }),
    ).toEqual([]);
  });

  it('退款須全數核銷到收款項目', () => {
    const reasons = completionBlockers({
      ...base(),
      type: '退款',
      amount: 5000,
      allocations: [{ installment_id: 'BI-0815-1', amount: 3000 }],
      files: FILE,
    });
    expect(reasons).toEqual(['退款金額還有 2,000 元沒有核銷到收款項目']);
  });
});

describe('訂單付款狀態補「已退款」（D17-4）', () => {
  it('ORD-2026-0906 起點部分付款；全額退款完成後收款淨額為 0，付款狀態為已退款', () => {
    expect(calcPaymentSummary(orderOf('ORD-2026-0906'))).toBe('部分付款');
    store().addPayment('ORD-2026-0906', {
      type: '退款',
      status: '已完成',
      amount_taxed: 17010,
      allocations: [{ installment_id: 'BI-0906-1', amount: 17010 }],
      method: '退款',
      completed_at: '2026-09-24',
      files: FILE,
    });
    expect(calcPaymentSummary(orderOf('ORD-2026-0906'))).toBe('已退款');
  });

  it('退款仍在處理中時不算已退款', () => {
    store().addPayment('ORD-2026-0907', {
      type: '退款',
      status: '處理中',
      amount_taxed: 9450,
      allocations: [{ installment_id: 'BI-0907-1', amount: 9450 }],
      method: '退款',
    });
    expect(calcPaymentSummary(orderOf('ORD-2026-0907'))).toBe('部分付款');
  });
});

describe('帳務公司顯示公司抬頭（D17-6）', () => {
  it('代碼 SSP、BRO 顯示「感官」「柏樂」，需求單與訂單用同一份對照', () => {
    expect(accountCompanyName('SSP')).toBe('感官');
    expect(accountCompanyName('BRO')).toBe('柏樂');
    expect(BILLING_COMPANY_LABELS).toEqual({ SSP: '感官', BRO: '柏樂' });
  });
});

describe('應收金額卡三格同一口徑（B2）', () => {
  it('有已認列訂單異動時，小計（未稅）＋營業稅＝應收總額（含稅）', () => {
    const seed = orderOf('ORD-2026-0710'); // 應收 67,725（未稅 64,500＋稅 3,225）
    const order = {
      ...seed,
      adjustments: [{ id: 'OA-T-1', status: '確認可執行', amount: 5250, amount_without_tax: 5000 }],
    };
    const summary = receivableSummaryOf(order);
    expect(summary.untaxed).toBe(69500);
    expect(summary.tax).toBe(3475);
    expect(summary.taxed).toBe(72975);
    expect(summary.untaxed + summary.tax).toBe(summary.taxed);
    expect(summary.taxed).toBe(deriveOrderAmounts(order).receivable_taxed);
  });

  it('沒有訂單異動時與訂單原始金額一致', () => {
    const summary = receivableSummaryOf(orderOf('ORD-2026-0710'));
    expect(summary).toEqual({ untaxed: 64500, tax: 3225, taxed: 67725 });
  });
});

describe('3.11 兩張查帳清單讀訂單即時資料（B3）', () => {
  it('開立發票後，該期從待開發票清單移出', () => {
    const before = pendingInvoiceRows(toListOrders(store().orders));
    expect(before.some((r) => r.key === 'BI-0904-2')).toBe(true);
    store().issueInvoice('ORD-2026-0904', {
      buyer: '測試買受人',
      tax_id: '12345678',
      items: [],
      sales_amount: 33600,
      tax_amount: 1680,
      amount_taxed: 35280,
      source_installment_id: 'BI-0904-2',
    });
    const after = pendingInvoiceRows(toListOrders(store().orders));
    expect(after.some((r) => r.key === 'BI-0904-2')).toBe(false);
  });

  it('尾款收足後，訂單從應收款項清單移出', () => {
    const order = orderOf('ORD-2026-0904');
    const outstanding = deriveOrderAmounts(order).receivable_taxed - 15120;
    expect(receivableRows(toListOrders(store().orders)).some((r) => r.order_no === 'ORD-2026-0904')).toBe(true);
    store().addPayment('ORD-2026-0904', {
      type: '收款',
      status: '已完成',
      amount_taxed: outstanding,
      allocations: [{ installment_id: 'BI-0904-2', amount: outstanding }],
      method: '銀行轉帳',
      completed_at: '2026-09-24',
      files: FILE,
    });
    expect(receivableRows(toListOrders(store().orders)).some((r) => r.order_no === 'ORD-2026-0904')).toBe(false);
  });
});
