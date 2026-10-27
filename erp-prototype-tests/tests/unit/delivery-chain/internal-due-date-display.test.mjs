import { describe, it, expect } from 'vitest';
import {
  formatInternalDueDate,
  printItemInternalDueDateText,
  workOrderInternalDueDateText,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/internal-due-date-display.js';

// 情境目錄 4.14：唯讀呈現處的印件內部完成日只印一組日期。
// 急件新定義（Miles 2026-10-27）：急件不改日期，印件內部完成日＝印件預計交期往前減 1 個工作天，
// 呈現處不再帶「未扣急件」括號。

describe('4.14 印件內部完成日的唯讀呈現只印一組日期', () => {
  it('有值時原樣輸出', () => {
    expect(formatInternalDueDate('2026-09-04')).toBe('2026-09-04');
  });

  it('印件內部完成日為空時回無值符號', () => {
    expect(formatInternalDueDate(null)).toBe('－');
  });

  it('可指定日期格式與無值符號', () => {
    const format = (iso) => iso.replaceAll('-', '/');
    expect(formatInternalDueDate('2026-09-04', { format })).toBe('2026/09/04');
    expect(formatInternalDueDate(null, { dash: '未定' })).toBe('未定');
  });

  it('由印件推導：鏈四急件樣本（是否急件為是），預計交期 2026-09-07 只印 2026-09-04、不帶括號', () => {
    const item = { expected_delivery_date: '2026-09-07', is_urgent: true };
    expect(printItemInternalDueDateText(item)).toBe('2026-09-04');
  });

  it('由印件推導：預計交期為空時印無值符號', () => {
    expect(printItemInternalDueDateText({ expected_delivery_date: null })).toBe('－');
  });

  it('由工單承接值取數，不回頭推導', () => {
    expect(workOrderInternalDueDateText({ print_item: { delivery_date: '2026-09-04' } })).toBe(
      '2026-09-04',
    );
    expect(workOrderInternalDueDateText({ print_item: {} })).toBe('－');
  });
});
