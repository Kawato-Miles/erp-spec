import { describe, it, expect } from 'vitest';
import {
  internalDeadlineOf,
  isTaskDueDateCheckable,
  isTaskOverInternalDeadline,
  noDeadlineBaselineText,
  overdueTasksOf,
  taskDueDateWarningText,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/task-due-date-warning.js';

// 7.24 超期判定納入哪些任務、排除哪些任務
// 規則正本 wiki [[交期鏈]]（Miles 2026-09-11 拍板）：生產任務的預計完成日晚於**所屬工單**的
// 內部完成日時軟提示，只標示與提示、不擋存檔。排除已進終態者（已完成、已作廢、報廢）與
// 售後服務單決議補做的任務；品檢缺口補做照常判定。基準為空時整張單不比對。

const DEADLINE = '2026-09-20';

const task = (name, plannedEnd, overrides = {}) => ({
  id: `pt-${name}`,
  name,
  status: '待處理',
  planned_end_date: plannedEnd,
  ...overrides,
});

const workOrder = (deliveryDate, tasks = []) => ({
  work_order_no: 'WO-TEST',
  print_item: { print_item_no: 'PI-TEST', delivery_date: deliveryDate },
  tasks,
});

describe('7.24 超期判定納入哪些任務、排除哪些任務', () => {
  it('三個終態（已完成、已作廢、報廢）一律不判超期', () => {
    for (const status of ['已完成', '已作廢', '報廢']) {
      const t = task(`終態-${status}`, '2026-09-30', { status });
      expect(isTaskDueDateCheckable(t)).toBe(false);
      expect(isTaskOverInternalDeadline(t, DEADLINE)).toBe(false);
    }
  });

  it('售後服務單決議補做的任務不判超期', () => {
    const t = task('售後補做', '2026-09-30', {
      remake_source: {
        source_type: 'after_sales',
        disposition_ids: [],
        qc_record_ids: [],
        after_sales_ticket_id: 'AFT-2026-0001',
      },
    });
    expect(isTaskDueDateCheckable(t)).toBe(false);
    expect(isTaskOverInternalDeadline(t, DEADLINE)).toBe(false);
  });

  it('品檢缺口補做的任務照常判定超期', () => {
    const t = task('品檢缺口補做', '2026-09-30', {
      remake_source: {
        source_type: 'qc_gap',
        disposition_ids: ['dp-01'],
        qc_record_ids: ['QC-2026-0001'],
        after_sales_ticket_id: null,
      },
    });
    expect(isTaskDueDateCheckable(t)).toBe(true);
    expect(isTaskOverInternalDeadline(t, DEADLINE)).toBe(true);
  });

  it('基準為空時不比對、不提示，並給出沒有交期基準的說明', () => {
    const blank = workOrder(null, [task('晚很多', '2026-12-31')]);
    expect(internalDeadlineOf(blank)).toBeNull();
    expect(isTaskOverInternalDeadline(task('晚很多', '2026-12-31'), null)).toBe(false);
    expect(overdueTasksOf(blank)).toEqual([]);
    expect(noDeadlineBaselineText(blank)).toBe('這張工單沒有交期基準');
  });

  it('有基準時不顯示沒有交期基準那一行', () => {
    expect(noDeadlineBaselineText(workOrder(DEADLINE, []))).toBeNull();
  });

  it('同日不算超期，晚一天才算', () => {
    expect(isTaskOverInternalDeadline(task('同日', DEADLINE), DEADLINE)).toBe(false);
    expect(isTaskOverInternalDeadline(task('早一天', '2026-09-19'), DEADLINE)).toBe(false);
    expect(isTaskOverInternalDeadline(task('晚一天', '2026-09-21'), DEADLINE)).toBe(true);
  });

  it('預計完成日未排定時不判超期', () => {
    expect(isTaskOverInternalDeadline(task('未排定', null), DEADLINE)).toBe(false);
  });

  it('整張工單的超期清單只收納入判定且晚於基準的那幾筆', () => {
    const wo = workOrder(DEADLINE, [
      task('外包上光', '2026-09-24'),
      task('同日完成', DEADLINE),
      task('已完成的晚工序', '2026-09-30', { status: '已完成' }),
      task('未排定', null),
    ]);
    expect(overdueTasksOf(wo).map((t) => t.name)).toEqual(['外包上光']);
  });

  it('提示句寫明任務名稱、預計完成日與本工單的內部完成日，並說明已存檔', () => {
    const t = task('局部上光', '2026-09-24');
    expect(taskDueDateWarningText(t, DEADLINE)).toBe(
      '生產任務「局部上光」的預計完成日 2026-09-24 晚於本工單內部完成日 2026-09-20，已存檔，請自行確認排程',
    );
    expect(taskDueDateWarningText(task('同日', DEADLINE), DEADLINE)).toBeNull();
  });
});

// 鏈外 WO-2026-0906 是 mock 上的常駐樣本：外包廠局部上光預計完成日 2026-09-24，
// 晚於內部完成日 2026-09-20。改 mock 時這條會擋下把樣本改掉的情形。
describe('7.24（補）mock 有一筆看得到超期標示的常駐樣本', async () => {
  const { MOCK_WORK_ORDERS } = await import(
    '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js'
  );

  it('WO-2026-0906 的局部上光落在超期清單裡', () => {
    const wo = MOCK_WORK_ORDERS.find((o) => o.work_order_no === 'WO-2026-0906');
    expect(wo, '找不到 WO-2026-0906').toBeTruthy();
    expect(internalDeadlineOf(wo)).toBe('2026-09-20');
    expect(overdueTasksOf(wo).map((t) => t.name)).toEqual(['局部上光']);
  });
});
