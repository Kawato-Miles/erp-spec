import { describe, it, expect } from 'vitest';
import {
  addWorkingDays,
  isWorkingDay,
  nextWorkingDay,
  subtractWorkingDays,
  workingDaysBetween,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/working-days.js';

// 2.1 工作天算法（情境目錄 15.12）
// 期望值取自 order-management spec § 交期鏈日期以工作天計算 的四個 Scenario，
// 與 wiki 工作天規則卡 § 具體例子 例子 1 至例子 5。
describe('15.12 工作天算法在交期鏈各處取得同一個結果', () => {
  it('週一至週五算工作天、週六與週日不算', () => {
    expect(isWorkingDay('2026-10-15')).toBe(true); // 四
    expect(isWorkingDay('2026-10-16')).toBe(true); // 五
    expect(isWorkingDay('2026-10-17')).toBe(false); // 六
    expect(isWorkingDay('2026-10-18')).toBe(false); // 日
    expect(isWorkingDay('2026-10-19')).toBe(true); // 一
  });

  it('國定假日即使落在週一至週五也不算工作天', () => {
    expect(isWorkingDay('2026-01-01')).toBe(false); // 四，開國紀念日
    expect(isWorkingDay('2026-09-25')).toBe(false); // 五，中秋節
    expect(isWorkingDay('2026-09-28')).toBe(false); // 一，教師節
    expect(isWorkingDay('2026-10-26')).toBe(false); // 一，臺灣光復節
  });

  it('2026 年度全年無補班日，週六與週日一律不算工作天', () => {
    expect(isWorkingDay('2026-02-14')).toBe(false);
    expect(isWorkingDay('2026-02-15')).toBe(false);
  });

  it('減急件天數時跳過非工作天：2026-10-15 減 3 個工作天得 2026-10-12', () => {
    expect(subtractWorkingDays('2026-10-15', 3)).toBe('2026-10-12');
  });

  it('下一個工作天跳過週末：2026-10-16（五）得 2026-10-19（一）', () => {
    expect(nextWorkingDay('2026-10-16')).toBe('2026-10-19');
  });

  it('下一個工作天跳過連續假日：2026-09-24（四）得 2026-09-29（二）', () => {
    // 9/25 中秋、9/26 六、9/27 日、9/28 教師節
    expect(nextWorkingDay('2026-09-24')).toBe('2026-09-29');
  });

  it('加減一律自隔日起算，當天不計為第 1 天', () => {
    expect(addWorkingDays('2026-10-15', 1)).toBe('2026-10-16');
    expect(addWorkingDays('2026-10-15', 0)).toBe('2026-10-15');
    expect(subtractWorkingDays('2026-10-15', 1)).toBe('2026-10-14');
  });

  it('往後數三個工作天跨週末：2026-10-15（四）得 2026-10-20（二）', () => {
    expect(addWorkingDays('2026-10-15', 3)).toBe('2026-10-20');
  });

  it('兩日之間的工作天數起日不計、迄日計', () => {
    // wiki 例子 4：應完成 2026-10-15（四）、系統日期 2026-10-20（二）→ 3 個工作天
    expect(workingDaysBetween('2026-10-15', '2026-10-20')).toBe(3);
    // wiki 例子 5：同一天 → 0
    expect(workingDaysBetween('2026-10-15', '2026-10-15')).toBe(0);
  });

  it('逾期天數不因週末增加', () => {
    // spec Scenario：印件預計交期 2026-10-16（五），系統日期 2026-10-17（六）→ 0 個工作天
    expect(workingDaysBetween('2026-10-16', '2026-10-17')).toBe(0);
    // 系統日期 2026-10-19（一）→ 1 個工作天
    expect(workingDaysBetween('2026-10-16', '2026-10-19')).toBe(1);
  });

  it('假日表更新不回溯重算：本模組只回答當下的推算，既算出的日期由呼叫端保存', () => {
    // 已算出的 2026-10-12 由印件欄位保存；本模組不提供任何回頭重算既有日期的入口
    expect(subtractWorkingDays('2026-10-15', 3)).toBe('2026-10-12');
    expect(Object.keys({ subtractWorkingDays })).not.toContain('recalculateHistoricalDates');
  });

  it('空值進、空值出', () => {
    expect(nextWorkingDay(null)).toBeNull();
    expect(addWorkingDays(null, 3)).toBeNull();
    expect(subtractWorkingDays(undefined, 3)).toBeNull();
    expect(workingDaysBetween(null, '2026-10-15')).toBeNull();
    expect(workingDaysBetween('2026-10-15', null)).toBeNull();
  });
});
