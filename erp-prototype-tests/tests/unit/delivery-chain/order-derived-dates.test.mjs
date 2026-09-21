import { describe, it, expect } from 'vitest';
import {
  orderAllDeliveredByDate,
  orderDelayFlags,
  orderExpectedDeliveryDate,
  orderInternalCompletionDate,
  printItemOverdueWorkingDays,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 2.4 訂單層衍生值、2.5 逾期標示（情境目錄 4.11、4.12、4.13）
// 期望值取自 order-management spec § 訂單層衍生交期日期、§ 交期逾期標示。

const item = (no, undeducted, overrides = {}) => ({
  print_item_no: no,
  undeducted_internal_due_date: undeducted,
  urgent_option_id: 'UO-001',
  urgent_option_name: '一般件',
  urgent_option_days: 0,
  ...overrides,
});

describe('4.11 訂單層三個衍生日期', () => {
  it('訂單內部完成時間取最晚一筆、全部交完日為其下一個工作天', () => {
    const items = [item('A', '2026-10-12'), item('B', '2026-10-14'), item('C', '2026-10-19')];
    expect(orderInternalCompletionDate(items)).toBe('2026-10-19');
    expect(orderAllDeliveredByDate(items)).toBe('2026-10-20');
  });

  it('已棄用印件不計入', () => {
    const items = [
      item('A', '2026-10-12'),
      item('B', '2026-10-14'),
      item('C', '2026-10-30', { print_item_status: '已棄用' }),
    ];
    expect(orderInternalCompletionDate(items)).toBe('2026-10-14');
  });

  it('全部印件皆無日期時三個衍生值皆為空', () => {
    const items = [item('A', null), item('B', null)];
    expect(orderInternalCompletionDate(items)).toBeNull();
    expect(orderAllDeliveredByDate(items)).toBeNull();
    expect(orderExpectedDeliveryDate(items)).toBeNull();
  });
});

describe('4.12 訂單預計交貨日期依出貨滾動', () => {
  // 三件印件的印件預計交期分別為 2026-10-13、2026-10-15、2026-10-20
  const items = [item('A', '2026-10-12'), item('B', '2026-10-14'), item('C', '2026-10-19')];
  const shippedOnly = (...nos) => (i) => nos.includes(i.print_item_no);

  it('皆未出貨時取最早一筆', () => {
    expect(orderExpectedDeliveryDate(items, () => false)).toBe('2026-10-13');
  });

  it('第一件出貨後滾到下一筆', () => {
    expect(orderExpectedDeliveryDate(items, shippedOnly('A'))).toBe('2026-10-15');
  });

  it('日期已過而該印件尚未出貨時停在該筆、不跳筆', () => {
    // 系統日期 2026-10-16，A 仍未出貨
    expect(orderExpectedDeliveryDate(items, () => false)).toBe('2026-10-13');
  });

  it('全部出完時停在最後一筆', () => {
    expect(orderExpectedDeliveryDate(items, shippedOnly('A', 'B', 'C'))).toBe('2026-10-20');
  });

  it('首張出貨單作廢後退回該筆', () => {
    expect(orderExpectedDeliveryDate(items, shippedOnly('A'))).toBe('2026-10-15');
    expect(orderExpectedDeliveryDate(items, () => false)).toBe('2026-10-13');
  });
});

describe('4.13 交期逾期標示', () => {
  it('印件逾期天數以工作天計', () => {
    // 印件預計交期 2026-10-13，系統日期 2026-10-15 → 2 個工作天
    expect(printItemOverdueWorkingDays(item('A', '2026-10-12'), '2026-10-15')).toBe(2);
  });

  it('已出貨的印件不標逾期', () => {
    expect(printItemOverdueWorkingDays(item('A', '2026-10-12'), '2026-10-15', true)).toBeNull();
  });

  it('印件預計交期為空時不判定', () => {
    expect(printItemOverdueWorkingDays(item('A', null), '2026-10-15')).toBeNull();
  });

  it('訂單旗下任一印件逾期即標部分延遲', () => {
    const items = [item('A', '2026-10-12'), item('B', '2026-10-30')];
    expect(orderDelayFlags(items, '2026-10-15').partialDelay).toBe(true);
  });

  it('系統日期超過全部交完日且仍有印件未出貨時標整單逾期', () => {
    // 訂單內部完成時間 2026-10-19、全部交完日 2026-10-20，系統日期 2026-10-22
    const items = [item('A', '2026-10-12'), item('B', '2026-10-19')];
    expect(orderDelayFlags(items, '2026-10-22').wholeOverdue).toBe(true);
  });

  it('全部印件皆已出貨時不標整單逾期', () => {
    const items = [item('A', '2026-10-12'), item('B', '2026-10-19')];
    expect(orderDelayFlags(items, '2026-10-22', () => true).wholeOverdue).toBe(false);
  });

  it('日期皆為空時不標任何逾期', () => {
    const items = [item('A', null), item('B', null)];
    expect(orderDelayFlags(items, '2026-10-22')).toEqual({
      partialDelay: false,
      wholeOverdue: false,
    });
  });
});
