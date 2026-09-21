import { describe, it, expect } from 'vitest';
import {
  derivePrintItemExpectedDeliveryDate,
  derivePrintItemInternalDueDate,
  expectedDeliveryDateGuard,
  recalcPrintItemDates,
  suggestExpectedDeliveryDate,
  urgentDeductionNote,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 2.2 急件扣減、2.3 印件預計交期推算（情境目錄 4.5、4.6）
// 期望值取自 order-management spec § 印件內部完成日推導、§ 印件交期欄變更的重算、覆蓋與同步。

const item = (undeducted, urgentDays = 0, overrides = {}) => ({
  print_item_no: 'PI-2026-0388',
  undeducted_internal_due_date: undeducted,
  urgent_option_id: urgentDays === 0 ? 'UO-001' : 'UO-003',
  urgent_option_name: urgentDays === 0 ? '一般件' : '三天急件',
  urgent_option_days: urgentDays,
  ...overrides,
});

describe('4.5 業務壓的未扣急件內部完成日扣急件工作天得印件內部完成日', () => {
  it('凍結天數 3、未扣值 2026-10-15（四）得印件內部完成日 2026-10-12（一）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-15', 3))).toBe('2026-10-12');
  });

  it('印件預計交期的建議值為 2026-10-13（二）', () => {
    expect(derivePrintItemExpectedDeliveryDate(item('2026-10-15', 3))).toBe('2026-10-13');
  });

  it('一般件（凍結天數 0）時兩個日期同一天', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-20', 0))).toBe('2026-10-20');
    expect(derivePrintItemExpectedDeliveryDate(item('2026-10-20', 0))).toBe('2026-10-21');
  });

  it('延後型急件（凍結天數 −3）往後數三個工作天得 2026-10-20（二）', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-15', -3))).toBe('2026-10-20');
  });

  it('未扣急件內部完成日為空時整條鏈為空', () => {
    expect(derivePrintItemInternalDueDate(item(null, 3))).toBeNull();
    expect(derivePrintItemExpectedDeliveryDate(item(null, 3))).toBeNull();
    expect(suggestExpectedDeliveryDate(null)).toBeNull();
  });

  it('扣減後早於今日照實回傳、不校正為今日', () => {
    expect(derivePrintItemInternalDueDate(item('2026-10-15', 3))).toBe('2026-10-12');
  });

  it('畫面註明扣了幾個工作天；一般件與無值時不註明', () => {
    expect(urgentDeductionNote(item('2026-10-15', 3))).toBe('已扣 3 個工作天');
    expect(urgentDeductionNote(item('2026-10-15', -3))).toBe('已延後 3 個工作天');
    expect(urgentDeductionNote(item('2026-10-15', 0))).toBeNull();
    expect(urgentDeductionNote(item(null, 3))).toBeNull();
  });
});

describe('4.6 印件預計交期的重算、覆蓋與把關', () => {
  it('印件預計交期未經業務改寫時取系統建議值', () => {
    expect(derivePrintItemExpectedDeliveryDate(item('2026-10-16', 0))).toBe('2026-10-19');
  });

  it('業務改成更晚的日期時保留業務改過的值', () => {
    const changed = item('2026-10-15', 3, { expected_delivery_date: '2026-10-16' });
    expect(derivePrintItemExpectedDeliveryDate(changed)).toBe('2026-10-16');
    expect(derivePrintItemInternalDueDate(changed)).toBe('2026-10-12');
  });

  it('業務改成早於印件內部完成日的日期時擋下', () => {
    const guard = expectedDeliveryDateGuard(item('2026-10-15', 3), '2026-10-09');
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toContain('2026-10-12');
  });

  it('等於印件內部完成日時放行', () => {
    expect(expectedDeliveryDateGuard(item('2026-10-15', 3), '2026-10-12').allowed).toBe(true);
  });

  it('改未扣急件內部完成日時重算並覆蓋業務改過的印件預計交期', () => {
    const changed = item('2026-10-20', 3, { expected_delivery_date: '2026-10-19' });
    expect(recalcPrintItemDates(changed)).toEqual({
      delivery_date: '2026-10-15',
      expected_delivery_date: '2026-10-16',
    });
  });

  it('清空未扣急件內部完成日時兩個推得值同為空', () => {
    const cleared = item(null, 3, { expected_delivery_date: '2026-10-19' });
    expect(recalcPrintItemDates(cleared)).toEqual({
      delivery_date: null,
      expected_delivery_date: null,
    });
  });
});
