import { describe, expect, it } from 'vitest';
import {
  MOCK_FLOOR_TASKS,
  MOCK_WORK_PACKAGES,
  MOCK_WORK_REPORTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import {
  canEditWorkReport,
  canVoidWorkReport,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import {
  describeBlocking,
  resolvePrecedence,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/precedence.js';
import {
  canReportTask,
  describeReportWaiting,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/report-rules.js';

// 情境目錄 10.44、10.45 的判定驗算。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 production-execution delta
// Scenario THEN（師傅不能修改或作廢別人提交的報工；前置未到料擋報工；多前置取最小值），
// 以及 wiki 業務情境卡「師傅報工與修改」。

describe('10.44 師傅不能修改或作廢別人提交的報工', () => {
  // 起點：WP-2026-0812-01 的指派師傅為劉阿海；旗下證書四色印刷的報工 wr-0018 由劉阿海提交，
  // 另一筆同任務的報工改由生管許文傑代報提交
  const pkg = MOCK_WORK_PACKAGES.find((p) => p.package_no === 'WP-2026-0812-01');
  const task = MOCK_FLOOR_TASKS.find((t) => t.id === 'pt-0812-2');
  const own = MOCK_WORK_REPORTS.find((r) => r.id === 'wr-0018');
  const byPlanner = { ...own, id: 'wr-test-proxy', reporter: '許文傑', channel: '生產管理頁面代報' };

  it('起點：工作包師傅為劉阿海，wr-0018 由劉阿海提交', () => {
    expect(pkg.master).toBe('劉阿海');
    expect(own.reporter).toBe('劉阿海');
    expect(own.task_id).toBe(task.id);
  });

  it('生管代報的那筆：劉阿海不可修改、不可作廢', () => {
    expect(canEditWorkReport(byPlanner, 'master', '劉阿海', task)).toBe(false);
    expect(canVoidWorkReport(byPlanner, 'master', '劉阿海', task)).toBe(false);
  });

  it('生管、印務、印務主管可修改或作廢這筆報工', () => {
    const cases = [
      ['production_planner', '許文傑'],
      ['print_officer', '周建宏'],
      ['print_manager', '吳國豪'],
    ];
    for (const [role, user] of cases) {
      expect(canEditWorkReport(byPlanner, role, user, task)).toBe(true);
      expect(canVoidWorkReport(byPlanner, role, user, task)).toBe(true);
    }
  });

  it('劉阿海自己提交的那筆照樣可修改與作廢；別的師傅不行', () => {
    expect(canEditWorkReport(own, 'master', '劉阿海', task)).toBe(true);
    expect(canVoidWorkReport(own, 'master', '劉阿海', task)).toBe(true);
    expect(canEditWorkReport(own, 'master', '李榮發', task)).toBe(false);
    expect(canVoidWorkReport(own, 'master', '李榮發', task)).toBe(false);
  });
});

describe('10.45 多前置取最小值；前置未到料時提示指出在等哪張工單的哪一筆任務', () => {
  // 合成資料：裝訂任務的前置為封面加工與內頁加工，兩者皆需轉交
  const cover = {
    id: 'pt-test-cover',
    work_order_no: 'WO-TEST-01',
    name: '封面加工',
    status: '已完成',
    needs_transfer: true,
  };
  const inner = {
    id: 'pt-test-inner',
    work_order_no: 'WO-TEST-02',
    name: '內頁加工',
    status: '製作中',
    needs_transfer: true,
  };
  const binding = {
    id: 'pt-test-binding',
    work_order_no: 'WO-TEST-01',
    name: '騎馬釘裝訂',
    status: '待處理',
    depends_on: [cover.id, inner.id],
    delivered_at: '2026-10-01 09:00',
  };
  const tasks = [cover, inner, binding];
  const received = (id, taskId, qty) => ({
    id,
    status: '已點收',
    destination_line: '裝訂產線',
    details: [
      {
        task_id: taskId,
        destination_station_key: '後加工站',
        qty,
        receipts: [
          { id: `${id}-r1`, qty, received_by: '陳金水', received_at: '2026-10-05 10:00', remark: '', status: '有效' },
        ],
      },
    ],
  });

  it('封面加工到料 300、內頁加工到料 200 → 可做量為 200，可報工', () => {
    const tickets = [received('t1', cover.id, 300), received('t2', inner.id, 200)];
    const result = resolvePrecedence(binding, tasks, tickets);
    expect(result.workableQty).toBe(200);
    expect(result.blocking).toEqual([]);
    expect(canReportTask(binding, { tasks, tickets })).toBe(true);
    expect(describeReportWaiting(binding, { tasks, tickets })).toBeNull();
  });

  it('其中一筆前置到料為 0 → 擋下報工，可做量為 0，提示只列出在等的那一筆（含跨工單標示）', () => {
    const tickets = [received('t1', cover.id, 300)];
    const result = resolvePrecedence(binding, tasks, tickets);
    expect(result.workableQty).toBe(0);
    expect(result.blocking.map((b) => b.name)).toEqual(['內頁加工']);
    expect(canReportTask(binding, { tasks, tickets })).toBe(false);
    expect(describeReportWaiting(binding, { tasks, tickets })).toBe(
      '前置未到料：等 WO-TEST-02／內頁加工（跨工單） 的貨',
    );
  });

  it('兩筆前置都沒到料 → 提示依前置順序列出兩筆工單與任務', () => {
    const waiting = describeReportWaiting(binding, { tasks, tickets: [] });
    expect(waiting).toBe('前置未到料：等 WO-TEST-01／封面加工、WO-TEST-02／內頁加工（跨工單） 的貨');
    expect(describeBlocking(resolvePrecedence(binding, tasks, []).blocking)).toBe(
      'WO-TEST-01／封面加工、WO-TEST-02／內頁加工（跨工單）',
    );
  });
});
