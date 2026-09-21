import { describe, it, expect } from 'vitest';
import {
  formatInternalDueDate,
  printItemInternalDueDateText,
  workOrderInternalDueDateText,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/internal-due-date-display.js';

// 情境目錄 4.14：唯讀呈現處的印件內部完成日合併未扣急件那一天。
// 期望值取自公司 2026-09-18 對照表與 Miles 2026-09-21 拍板，不由實作反推。

describe('4.14 印件內部完成日的合併顯示格式', () => {
  it('有扣減時括號帶未扣急件那一天', () => {
    expect(formatInternalDueDate('2026-09-04', '2026-09-09')).toBe(
      '2026-09-04（未扣急件 2026-09-09）',
    );
  });

  it('兩者相同（一般件）時只顯示一組日期', () => {
    expect(formatInternalDueDate('2026-09-14', '2026-09-14')).toBe('2026-09-14');
  });

  it('印件內部完成日為空時回無值符號', () => {
    expect(formatInternalDueDate(null, '2026-09-09')).toBe('－');
  });

  it('未扣值為空時只顯示印件內部完成日', () => {
    expect(formatInternalDueDate('2026-09-04', null)).toBe('2026-09-04');
  });

  it('可指定日期格式與無值符號', () => {
    const format = (iso) => iso.replaceAll('-', '/');
    expect(formatInternalDueDate('2026-09-04', '2026-09-09', { format })).toBe(
      '2026/09/04（未扣急件 2026/09/09）',
    );
    expect(formatInternalDueDate(null, null, { dash: '未定' })).toBe('未定');
  });

  it('由印件推導：三天急件的鏈四樣本', () => {
    const item = {
      undeducted_internal_due_date: '2026-09-09',
      urgent_option_days: 3,
    };
    expect(printItemInternalDueDateText(item)).toBe('2026-09-04（未扣急件 2026-09-09）');
  });

  it('由印件推導：一般件只有一組日期', () => {
    const item = { undeducted_internal_due_date: '2026-09-14', urgent_option_days: 0 };
    expect(printItemInternalDueDateText(item)).toBe('2026-09-14');
  });

  it('由工單承接值取數，不回頭推導', () => {
    const workOrder = {
      print_item: {
        delivery_date: '2026-09-04',
        undeducted_internal_due_date: '2026-09-09',
      },
    };
    expect(workOrderInternalDueDateText(workOrder)).toBe('2026-09-04（未扣急件 2026-09-09）');
    expect(workOrderInternalDueDateText({ print_item: {} })).toBe('－');
  });
});
