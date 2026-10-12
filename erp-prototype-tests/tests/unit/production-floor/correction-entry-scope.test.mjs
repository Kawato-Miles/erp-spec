import { describe, expect, it } from 'vitest';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import * as transferRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';

// 情境目錄 14.31（轉交進度兩數）、14.32（工單詳情修正範圍）、14.35（我的生產任務只改自己提交的報工）的判定驗算。
// 畫面另在 tests/e2e/14-query-ui/correction-entries.spec.mjs 驗。
// 規則正本：wiki 生產任務、報工規則（報工可修正與作廢）；設計 production-ui-correction-20261012 § 三、§ 四。

const { describeTransferProgress } = transferRules;
const { REPORT_SOURCES, canEditWorkReport, canVoidWorkReport } = permissions;

const TASK_ID = 'pt-test-progress';
const task = (overrides = {}) => ({
  id: TASK_ID,
  name: '合成印刷',
  status: '已完成',
  needs_transfer: true,
  good_qty: 500,
  ...overrides,
});
const ticket = (qty, received) => ({
  id: 'tt-test',
  ticket_no: 'TT-TEST',
  status: '已點收',
  details: [
    {
      task_id: TASK_ID,
      task_name: '合成印刷',
      qty,
      receipts: [
        {
          id: 'r1',
          qty: received,
          received_by: '李榮發',
          received_at: '2026-10-12 10:00',
          remark: '',
          status: '有效',
        },
      ],
    },
  ],
});

describe('14.31 轉交進度只列搬運量與點收量兩個數字', () => {
  it('搬運量 500、點收量 480 → 「500／480」，不帶文字與良品', () => {
    expect(describeTransferProgress(task(), [ticket(500, 480)])).toBe('500／480');
  });

  it('千分位照常：搬運量 1,000、點收量 500 → 「1,000／500」', () => {
    expect(describeTransferProgress(task({ good_qty: 1000 }), [ticket(1000, 500)])).toBe(
      '1,000／500',
    );
  });

  it('不需轉交的任務沒有進度文字（畫面顯示「－」）', () => {
    expect(describeTransferProgress(task({ needs_transfer: false }), [])).toBeNull();
  });
});

describe('14.32 工單詳情的報工修正範圍＝工單詳情報工範圍', () => {
  const report = { id: 'wr-1', task_id: TASK_ID, reporter: '劉阿海' };
  const workOrder = { owner: '周建宏', shared_members: [{ name: '蔡明修', level: 'edit' }] };
  const opts = { source: REPORT_SOURCES.WORK_ORDER_DETAIL, workOrder };

  it('負責印務與編輯（代理）分享成員可修正與作廢，不限提交者', () => {
    expect(canEditWorkReport(report, 'print_officer', '周建宏', task(), opts)).toBe(true);
    expect(canVoidWorkReport(report, 'print_officer', '周建宏', task(), opts)).toBe(true);
    expect(canEditWorkReport(report, 'print_officer', '蔡明修', task(), opts)).toBe(true);
  });

  it('不是負責人也不是編輯分享成員的印務主管唯讀', () => {
    expect(canEditWorkReport(report, 'print_manager', '吳國豪', task(), opts)).toBe(false);
    expect(canVoidWorkReport(report, 'print_manager', '吳國豪', task(), opts)).toBe(false);
  });
});

describe('14.35 我的生產任務、我的工作包只能修正與作廢自己提交、且任務在自己工作包內的報工', () => {
  const own = { id: 'wr-own', task_id: TASK_ID, reporter: '劉阿海' };
  const proxied = { id: 'wr-proxy', task_id: TASK_ID, reporter: '許文傑' };
  const line = task({ production_line: '數位產線' });
  const mine = { id: 'wp-1', master: '劉阿海' };

  it.each([REPORT_SOURCES.MY_TASKS, REPORT_SOURCES.MY_PACKAGES])('%s：自己提交的可以、別人代報的不行', (source) => {
    const opts = { source, pkg: mine };
    expect(canEditWorkReport(own, 'master', '劉阿海', line, opts)).toBe(true);
    expect(canVoidWorkReport(own, 'master', '劉阿海', line, opts)).toBe(true);
    expect(canEditWorkReport(proxied, 'master', '劉阿海', line, opts)).toBe(false);
    expect(canVoidWorkReport(proxied, 'master', '劉阿海', line, opts)).toBe(false);
  });

  it('自己提交但任務已改派給別人（工作包指派師傅不是自己）→ 不可修正與作廢', () => {
    for (const source of [REPORT_SOURCES.MY_TASKS, REPORT_SOURCES.MY_PACKAGES]) {
      const opts = { source, pkg: { id: 'wp-2', master: '陳金水' } };
      expect(canEditWorkReport(own, 'master', '劉阿海', line, opts)).toBe(false);
      expect(canVoidWorkReport(own, 'master', '劉阿海', line, opts)).toBe(false);
    }
    // 任務已不在任何工作包內也不可
    expect(canEditWorkReport(own, 'master', '劉阿海', line, { source: REPORT_SOURCES.MY_TASKS })).toBe(false);
  });

  it('持有我的單元的非師傅角色也要自己提交且任務在自己工作包內，不因產線範圍放寬', () => {
    const opts = { source: REPORT_SOURCES.MY_TASKS, pkg: { id: 'wp-3', master: '許文傑' } };
    expect(canEditWorkReport(proxied, 'production_planner', '許文傑', line, opts)).toBe(true);
    expect(canEditWorkReport(own, 'production_planner', '許文傑', line, opts)).toBe(false);
  });

  it('所有生產任務、所有工作包仍是範圍內全部報工', () => {
    for (const source of [REPORT_SOURCES.ALL_TASKS, REPORT_SOURCES.ALL_PACKAGES]) {
      expect(canEditWorkReport(own, 'production_planner', '許文傑', line, { source })).toBe(true);
    }
  });
});
