import { describe, it, expect } from 'vitest';
import {
  derivePrintItemExpectedDeliveryDate,
  derivePrintItemInternalDueDate,
  recalcPrintItemDates,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import { applyPrintItemDueDate } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/due-date-sync.js';

// 印件預計交期往前減 1 個工作天得印件內部完成日；是否急件不參與（情境目錄 4.5、4.6）
// 期望值取自 order-management spec § 印件內部完成日推導、§ 印件預計交期變更的重算與同步
//（OpenSpec change rush-order-definition，Miles 2026-10-27 急件新定義）。

const item = (expected, isUrgent = false, overrides = {}) => ({
  print_item_no: 'PI-2026-0388',
  expected_delivery_date: expected,
  is_urgent: isUrgent,
  ...overrides,
});

describe('4.5 業務填印件預計交期，系統往前減 1 個工作天得印件內部完成日', () => {
  it('印件預計交期 2026-10-13（二）得印件內部完成日 2026-10-12（一）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-13'))).toBe('2026-10-12');
  });

  it('印件預計交期直接取業務填的值，沒有系統建議值', () => {
    expect(derivePrintItemExpectedDeliveryDate(item('2026-10-13'))).toBe('2026-10-13');
  });

  it('預計交期落週一時跨週末推到週五：2026-10-19（一）得 2026-10-16（五）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-19'))).toBe('2026-10-16');
  });

  it('預計交期落週六時推到前一個工作天：2026-10-17（六）得 2026-10-16（五）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-17'))).toBe('2026-10-16');
  });

  it('是否急件不影響推導：是否急件為是或否都得 2026-10-12', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-13', true))).toBe('2026-10-12');
    expect(derivePrintItemInternalDueDate(item('2026-10-13', false))).toBe('2026-10-12');
    expect(derivePrintItemExpectedDeliveryDate(item('2026-10-13', true))).toBe('2026-10-13');
  });

  it('印件預計交期為空時印件內部完成日為空，是否急件為是也一樣', () => {
    expect(derivePrintItemInternalDueDate(item(null, true))).toBeNull();
    expect(derivePrintItemExpectedDeliveryDate(item(null, true))).toBeNull();
  });

  it('早於今日照實回傳、不校正為今日（今天 2026-10-20 填 2026-10-13 得 2026-10-12）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-13'))).toBe('2026-10-12');
  });
});

describe('4.6 改印件預計交期重算與同步非終態工單；改是否急件不重算', () => {
  const workOrders = () => [
    {
      id: 'wo-making',
      work_order_no: 'WO-A',
      status: '製作中',
      print_item: {
        print_item_no: 'PI-2026-0388',
        delivery_date: '2026-10-12',
        expected_delivery_date: '2026-10-13',
      },
    },
    {
      id: 'wo-done',
      work_order_no: 'WO-B',
      status: '已完成',
      print_item: {
        print_item_no: 'PI-2026-0388',
        delivery_date: '2026-10-12',
        expected_delivery_date: '2026-10-13',
      },
    },
  ];

  it('改為 2026-10-19（一）：內部完成日重算為 2026-10-16（五）', () => {
    expect(recalcPrintItemDates(item('2026-10-19'))).toEqual({ delivery_date: '2026-10-16' });
  });

  it('製作中工單兩欄同步為 2026-10-16 與 2026-10-19，已完成工單維持 2026-10-12 與 2026-10-13', () => {
    const next = applyPrintItemDueDate(workOrders(), 'PI-2026-0388', '2026-10-16', '2026-10-19');
    const pi = (id) => next.find((o) => o.id === id).print_item;
    expect(pi('wo-making')).toMatchObject({
      delivery_date: '2026-10-16',
      expected_delivery_date: '2026-10-19',
    });
    expect(pi('wo-done')).toMatchObject({
      delivery_date: '2026-10-12',
      expected_delivery_date: '2026-10-13',
    });
  });

  it('清空印件預計交期：內部完成日為空，非終態工單兩欄同步為空、不保留原值', () => {
    expect(recalcPrintItemDates(item(null))).toEqual({ delivery_date: null });
    const next = applyPrintItemDueDate(workOrders(), 'PI-2026-0388', null, null);
    expect(next.find((o) => o.id === 'wo-making').print_item).toMatchObject({
      delivery_date: null,
      expected_delivery_date: null,
    });
  });

  it('工單副本不再承接未扣急件內部完成日（既存缺陷修正）', () => {
    const next = applyPrintItemDueDate(workOrders(), 'PI-2026-0388', '2026-10-16', '2026-10-19');
    expect(next[0].print_item).not.toHaveProperty('undeducted_internal_due_date');
  });

  it('改是否急件不重算：否改為是，兩個日期維持 2026-10-13 與 2026-10-12', () => {
    const before = item('2026-10-13', false);
    const after = { ...before, is_urgent: true };
    expect(derivePrintItemInternalDueDate(after)).toBe(derivePrintItemInternalDueDate(before));
    expect(derivePrintItemExpectedDeliveryDate(after)).toBe('2026-10-13');
  });
});
