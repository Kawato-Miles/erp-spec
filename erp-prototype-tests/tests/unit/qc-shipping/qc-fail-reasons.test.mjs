import { describe, expect, it } from 'vitest';
import {
  QC_FAIL_REASON_GROUPS,
  QC_FAIL_REASON_SELECT_OPTIONS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';

// 情境 11.9「原因為固定的六個分組選項、沒有『其他』」的值域驗算。
// 畫面上的下拉為虛擬捲動，只看得到最前面幾組，故值域本身在這裡驗（e2e 只驗選得到）。

describe('11.9 不通過原因的值域', () => {
  it('分六組：印刷面、表面加工、裁切／成型、裝訂、材料、規格／數量', () => {
    expect(QC_FAIL_REASON_GROUPS.map((g) => g.group)).toEqual([
      '印刷面',
      '表面加工',
      '裁切／成型',
      '裝訂',
      '材料',
      '規格／數量',
    ]);
  });

  it('沒有「其他」這個籃子（留一個籃子，八成的不良都會掉進去）', () => {
    const reasons = QC_FAIL_REASON_GROUPS.flatMap((g) => g.reasons);
    expect(reasons).not.toContain('其他');
    expect(reasons.length).toBe(20);
  });

  it('下拉選項照分組結構產生，值與標籤同一個字串', () => {
    expect(QC_FAIL_REASON_SELECT_OPTIONS).toHaveLength(6);
    const first = QC_FAIL_REASON_SELECT_OPTIONS[0];
    expect(first.label).toBe('印刷面');
    expect(first.options[0]).toEqual({ value: '色差／偏色', label: '色差／偏色' });
  });
});
