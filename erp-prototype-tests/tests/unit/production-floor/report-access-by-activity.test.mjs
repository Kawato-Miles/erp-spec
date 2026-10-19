// 情境目錄 10.62：工單詳情的報工、修正、作廢依工單編輯權（單據權責修正第四批）。
// 負責印務、被分享（編輯）成員（不限角色）、印務主管（全公司）；檢視層級不可；印務不得報別人的工單。
// 畫面操作在 tests/e2e/10-report-transfer/report-access-by-activity.spec.mjs。
// 依據：製作與報工活動清單（ACT-MFG-005、006、021 新增報工；ACT-MFG-010、011、022 修正；ACT-MFG-015、016、023 作廢）；
// 受控清單 § 工單關聯單據的編輯權。
import { describe, expect, it } from 'vitest';
import {
  REPORT_SOURCES,
  canEditWorkReport,
  canVoidWorkReport,
  checkReportPermission,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';

const task = { id: 'pt-x', name: '證書四色印刷', status: '製作中', production_line: '數位產線' };
const workOrder = {
  owner: '周建宏',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '許文傑', level: 'edit' },
    { name: '蔡明修', level: 'view' },
  ],
};
const report = { id: 'wr-1', task_id: 'pt-x', reporter: '劉阿海' };
const source = REPORT_SOURCES.WORK_ORDER_DETAIL;

const reportAs = (role, currentUser) =>
  checkReportPermission({ source, role, currentUser, task, workOrder });
const optsOf = { source, workOrder };

describe('10.62 工單詳情報工：負責印務、編輯分享成員、印務主管', () => {
  it.each([
    ['print_officer', '周建宏'], // 負責印務
    ['print_manager', '吳國豪'], // 印務主管不是負責人、不在分享成員
    ['sales', '陳映蓉'], // 業務乙，編輯層級
    ['production_planner', '許文傑'], // 生管，編輯層級
  ])('%s %s 可報工，管道為印務於工單詳情頁', (role, user) => {
    const result = reportAs(role, user);
    expect(result.allowed).toBe(true);
    expect(result.channel).toBe('印務於工單詳情頁');
  });

  it('印務不得報別人的工單（周建宏不是蔡明修負責的工單的負責人、也不在分享成員）', () => {
    const others = { owner: '蔡明修', shared_members: [] };
    const result = checkReportPermission({
      source,
      role: 'print_officer',
      currentUser: '周建宏',
      task,
      workOrder: others,
    });
    expect(result.allowed).toBe(false);
  });

  it('檢視層級分享成員不可報工', () => {
    expect(reportAs('print_officer', '蔡明修').allowed).toBe(false);
  });

  it('沒被分享的業務、生管、會計不可報工', () => {
    for (const [role, user] of [
      ['sales', '洪嘉駿'],
      ['production_planner', '鄭宇翔'],
      ['accountant', '陳美玲'],
    ]) {
      expect(reportAs(role, user).allowed, `${role} ${user}`).toBe(false);
    }
  });

  it('師傅與品檢人員沒有工單詳情的報工入口', () => {
    for (const [role, user] of [['master', '劉阿海'], ['qc_inspector', '郭淑芬']]) {
      expect(reportAs(role, user).allowed, role).toBe(false);
    }
  });
});

describe('10.62 工單詳情修正與作廢：同一群人，不限報工人員', () => {
  it.each([
    ['print_officer', '周建宏'],
    ['print_manager', '吳國豪'],
    ['sales', '陳映蓉'],
    ['production_planner', '許文傑'],
  ])('%s %s 可修正與作廢劉阿海提交的報工', (role, user) => {
    expect(canEditWorkReport(report, role, user, task, optsOf)).toBe(true);
    expect(canVoidWorkReport(report, role, user, task, optsOf)).toBe(true);
  });

  it('檢視層級分享成員、沒被分享的業務、非負責印務都沒有修正與作廢', () => {
    for (const [role, user] of [
      ['print_officer', '蔡明修'],
      ['sales', '洪嘉駿'],
      ['print_officer', '郭俊賢'],
    ]) {
      expect(canEditWorkReport(report, role, user, task, optsOf), `${role} ${user}`).toBe(false);
      expect(canVoidWorkReport(report, role, user, task, optsOf), `${role} ${user}`).toBe(false);
    }
  });

  it('所屬產線的現場入口維持原判斷：生管在所有生產任務依產線範圍，業務沒有', () => {
    const allTasks = { source: REPORT_SOURCES.ALL_TASKS };
    expect(canEditWorkReport(report, 'production_planner', '許文傑', task, allTasks)).toBe(true);
    expect(canEditWorkReport(report, 'sales', '陳映蓉', task, allTasks)).toBe(false);
  });
});
