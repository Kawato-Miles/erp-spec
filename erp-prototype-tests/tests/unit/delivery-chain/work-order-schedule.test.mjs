import { describe, it, expect } from 'vitest';
import {
  isScheduleOverrun,
  noDeadlineBaselineText,
  scheduleBlockOf,
  taskDueBadge,
  taskOnTime,
  workOrderOnTime,
  workOrderPlannedEndDate,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 2.6 排程硬擋、2.7 排程超期標示、2.8 工單準時判定、2.9 任務日期（情境目錄 7.27、7.28、15.13、10.20）
// 期望值取自 work-order spec § 工單排程硬擋、§ 核可後的排程超期標示、§ 工單準時判定、
// § 任務實際完成日與到期逾期標示。

const task = (plannedEnd, overrides = {}) => ({
  id: `pt-${plannedEnd ?? 'null'}`,
  name: '四色印刷',
  status: '待處理',
  planned_end_date: plannedEnd,
  ...overrides,
});

const workOrder = (internalDue, tasks = [], overrides = {}) => ({
  work_order_no: 'WO-TEST',
  status: '草稿',
  print_item: { print_item_no: 'PI-TEST', delivery_date: internalDue },
  tasks,
  ...overrides,
});

describe('7.27 工單送審與核可的排程硬擋', () => {
  it('工單預排完成日晚於印件內部完成日即擋下，並列出兩個日期與相差工作天數', () => {
    const wo = workOrder('2026-10-15', [task('2026-10-14'), task('2026-10-16')]);
    const result = scheduleBlockOf(wo);
    expect(result.blocked).toBe(true);
    expect(result.plannedEnd).toBe('2026-10-16');
    expect(result.internalDue).toBe('2026-10-15');
    expect(result.overWorkingDays).toBe(1);
    expect(result.reason).toContain('2026-10-16');
    expect(result.reason).toContain('2026-10-15');
    expect(result.reason).toContain('1 個工作天');
  });

  it('工單預排完成日等於印件內部完成日時不擋', () => {
    expect(scheduleBlockOf(workOrder('2026-10-15', [task('2026-10-15')])).blocked).toBe(false);
  });

  it('印件內部完成日為空時不比對、不擋，並顯示沒有交期基準', () => {
    const wo = workOrder(null, [task('2026-10-16')]);
    expect(scheduleBlockOf(wo).blocked).toBe(false);
    expect(noDeadlineBaselineText(wo)).toBe('這張工單沒有交期基準');
  });

  it('工單預排完成日為空時不比對、不擋', () => {
    const wo = workOrder('2026-10-15', [task(null), task(null)]);
    expect(workOrderPlannedEndDate(wo)).toBeNull();
    expect(scheduleBlockOf(wo).blocked).toBe(false);
  });

  it('作廢最晚那筆任務使預排回落後即放行', () => {
    const wo = workOrder('2026-10-15', [
      task('2026-10-14'),
      task('2026-10-16', { status: '已作廢' }),
    ]);
    expect(workOrderPlannedEndDate(wo)).toBe('2026-10-14');
    expect(scheduleBlockOf(wo).blocked).toBe(false);
  });
});

describe('7.28 核可後的排程超期標示', () => {
  it('已核可工單超期即標示', () => {
    const wo = workOrder('2026-10-15', [task('2026-10-19')], { status: '製程審核完成' });
    expect(isScheduleOverrun(wo)).toBe(true);
  });

  it('排程回落後標示消失', () => {
    const wo = workOrder('2026-10-15', [task('2026-10-14')], { status: '製程審核完成' });
    expect(isScheduleOverrun(wo)).toBe(false);
  });

  it('終態工單不標', () => {
    const wo = workOrder('2026-10-15', [task('2026-10-19')], { status: '已完成' });
    expect(isScheduleOverrun(wo)).toBe(false);
  });

  it('尚未核可的工單不標（把關由硬擋承接）', () => {
    const wo = workOrder('2026-10-15', [task('2026-10-19')], { status: '製程確認中' });
    expect(isScheduleOverrun(wo)).toBe(false);
  });

  it('任一日期為空時不標', () => {
    expect(
      isScheduleOverrun(workOrder(null, [task('2026-10-19')], { status: '製作中' })),
    ).toBe(false);
  });
});

describe('15.13 工單準時判定取凍結的印件內部完成日', () => {
  it('工單實際完成日不晚於印件內部完成日判為準時', () => {
    const wo = workOrder('2026-10-15', [], { status: '已完成', actual_end_date: '2026-10-14' });
    expect(workOrderOnTime(wo)).toEqual({ judged: true, onTime: true, overWorkingDays: null });
  });

  it('晚於時標逾期 N 個工作天', () => {
    const wo = workOrder('2026-10-15', [], { status: '已完成', actual_end_date: '2026-10-19' });
    expect(workOrderOnTime(wo)).toEqual({ judged: true, onTime: false, overWorkingDays: 2 });
  });

  it('取工單凍結的值、不取印件現值', () => {
    // 工單的 print_item.delivery_date 已凍結為 2026-10-15，印件現值改為 2026-10-12 也不影響
    const wo = workOrder('2026-10-15', [], { status: '已完成', actual_end_date: '2026-10-14' });
    expect(wo.print_item.delivery_date).toBe('2026-10-15');
    expect(workOrderOnTime(wo).onTime).toBe(true);
  });

  it('補做重開後取末次完成時間判定', () => {
    const wo = workOrder('2026-10-15', [], { status: '已完成', actual_end_date: '2026-10-22' });
    expect(workOrderOnTime(wo).onTime).toBe(false);
  });

  it('印件內部完成日為空或尚未完成時不判定', () => {
    expect(workOrderOnTime(workOrder(null, [], { actual_end_date: '2026-10-14' })).judged).toBe(
      false,
    );
    expect(workOrderOnTime(workOrder('2026-10-15', [], { actual_end_date: null })).judged).toBe(
      false,
    );
  });
});

describe('10.20 任務實際完成日與到期逾期標示', () => {
  it('系統日期等於任務預計完成日且未完成時標今日到期', () => {
    expect(taskDueBadge(task('2026-10-15'), '2026-10-15').label).toBe('今日到期');
  });

  it('逾期天數以工作天計，週六與週日不計入', () => {
    expect(taskDueBadge(task('2026-10-15'), '2026-10-19')).toEqual({
      kind: 'overdue',
      overWorkingDays: 2,
      label: '逾期 2 個工作天',
    });
  });

  it('終態任務不標今日到期或逾期', () => {
    for (const status of ['已完成', '已作廢', '報廢']) {
      expect(taskDueBadge(task('2026-10-15', { status }), '2026-10-19').kind).toBeNull();
    }
  });

  it('任務預計完成日為空時不標', () => {
    expect(taskDueBadge(task(null), '2026-10-19').kind).toBeNull();
  });

  it('任務準時判定取任務實際完成日比對任務預計完成日', () => {
    expect(
      taskOnTime(task('2026-10-15', { status: '已完成', actual_end_date: '2026-10-14' })).onTime,
    ).toBe(true);
    expect(
      taskOnTime(task('2026-10-15', { status: '已完成', actual_end_date: '2026-10-19' })),
    ).toEqual({ judged: true, onTime: false, overWorkingDays: 2 });
  });

  it('作廢任務無任務實際完成日、不判定準時', () => {
    expect(taskOnTime(task('2026-10-15', { status: '已作廢', actual_end_date: null })).judged).toBe(
      false,
    );
  });
});
