import { describe, it, expect } from 'vitest';
import { dateOnly } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/date-display.js';

// 情境目錄 7.14：生產任務展開列的兩個事實時間只顯示日期。
// 期望值取自 Miles 2026-09-22 指示——取數來源的時間戳不變，只改呈現格式。

describe('7.14 任務實際開工與任務實際完成日只顯示日期', () => {
  it('帶時分的時間戳只留日期那一段', () => {
    expect(dateOnly('2026-08-27 15:00')).toBe('2026-08-27');
    expect(dateOnly('2026-09-02 16:30')).toBe('2026-09-02');
  });

  it('本來就只有日期的值原樣回傳', () => {
    expect(dateOnly('2026-09-03')).toBe('2026-09-03');
  });

  it('ISO 格式的時間戳同樣只留日期', () => {
    expect(dateOnly('2026-08-31T09:05:00')).toBe('2026-08-31');
  });

  it('無值時回全形連字號，可自訂', () => {
    expect(dateOnly(null)).toBe('－');
    expect(dateOnly(undefined)).toBe('－');
    expect(dateOnly('')).toBe('－');
    expect(dateOnly(null, '尚未開工')).toBe('尚未開工');
  });

  it('認不出日期的字串原樣回傳，不吞掉內容', () => {
    expect(dateOnly('尚未報工')).toBe('尚未報工');
  });
});
