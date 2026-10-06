import { describe, expect, it } from 'vitest';
import {
  checkReportPermission,
  REPORT_CHANNELS,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { isEditorOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

// 情境 10.5「各入口範圍」、10.46「五個報工入口與三值提交管道」、10.47「越權只擋下」的權限判定
//（畫面入口另在 e2e 10.5、10.46、10.47 驗）。
// 規則正本：wiki 報工規則 § 報工入口與提交管道、§ 報工權限守門；
// change production-dispatch-report-transfer-convergence production-execution § 報工權限守門。
//
// 新契約（等 tasks 4.2 實作）：
//   REPORT_SOURCES 五個入口：WORK_ORDER_DETAIL（工單詳情）、ALL_PACKAGES（所有工作包）、
//     ALL_TASKS（所有生產任務）、MY_PACKAGES（我的工作包）、MY_TASKS（我的生產任務）；沒有印件詳情。
//   REPORT_CHANNELS 三值：師傅自助、生產管理頁面代報、印務於工單詳情頁。
//   checkReportPermission({ source, role, currentUser, task, pkg, workOrder }) → { allowed, channel, reason }
//     工單詳情｜工單負責人或編輯（代理）分享成員（讀工單當下的值）
//     所有工作包、所有生產任務｜任務的產線在操作者的所屬產線內
//     我的工作包、我的生產任務｜任務所屬工作包的指派師傅是自己
//   越權只擋下，不寫稽核日誌（store 不再有 logReportGuardBypass）。

const floorTask = {
  id: 'pt-demo-1',
  work_order_no: 'WO-2026-0999',
  production_line: '數位產線',
  work_order_owner: '蔡明修',
  work_order_shared_members: [], // 交付當時還沒有分享成員
};
const workOrderWith = (members) => ({
  work_order_no: 'WO-2026-0999',
  owner: '蔡明修',
  shared_members: members,
});
const guard = (role, currentUser, workOrder, source = REPORT_SOURCES.WORK_ORDER_DETAIL) =>
  checkReportPermission({ source, role, currentUser, task: floorTask, pkg: null, workOrder });

describe('10.46 五個報工入口、三值提交管道；印件詳情沒有報工入口', () => {
  it('提交管道只有三值', () => {
    expect(Object.values(REPORT_CHANNELS).sort()).toEqual(
      ['印務於工單詳情頁', '師傅自助', '生產管理頁面代報'].sort(),
    );
  });

  it('報工入口只有五個，沒有印件詳情', () => {
    expect(Object.keys(REPORT_SOURCES).sort()).toEqual(
      ['ALL_PACKAGES', 'ALL_TASKS', 'MY_PACKAGES', 'MY_TASKS', 'WORK_ORDER_DETAIL'].sort(),
    );
    expect(REPORT_SOURCES.PRINT_ITEM_DETAIL).toBeUndefined();
  });

  it('各入口依來源記提交管道：我的〇〇記師傅自助、所有〇〇記生產管理頁面代報、工單詳情記印務於工單詳情頁', () => {
    const pkg = { id: 'wp-demo', master: '劉阿海' };
    const by = (source, role, currentUser) =>
      checkReportPermission({ source, role, currentUser, task: floorTask, pkg, workOrder: workOrderWith([]) })
        .channel;
    expect(by(REPORT_SOURCES.MY_PACKAGES, 'master', '劉阿海')).toBe('師傅自助');
    expect(by(REPORT_SOURCES.MY_TASKS, 'master', '劉阿海')).toBe('師傅自助');
    expect(by(REPORT_SOURCES.ALL_PACKAGES, 'production_planner', '許文傑')).toBe('生產管理頁面代報');
    expect(by(REPORT_SOURCES.ALL_TASKS, 'production_planner', '許文傑')).toBe('生產管理頁面代報');
    expect(by(REPORT_SOURCES.WORK_ORDER_DETAIL, 'print_officer', '蔡明修')).toBe('印務於工單詳情頁');
  });
});

describe('10.5 工單詳情的報工範圍：負責人或編輯（代理）分享成員', () => {
  it('交付後才授予的編輯（代理）成員，工單詳情頁報工放行', () => {
    const wo = workOrderWith([{ name: '周建宏', level: 'edit' }]);
    expect(isEditorOf(wo, '周建宏')).toBe(true);
    const result = guard('print_officer', '周建宏', wo);
    expect(result.allowed).toBe(true);
    expect(result.channel).toBe('印務於工單詳情頁');
  });

  it('檢視層級的分享成員報不了工', () => {
    const wo = workOrderWith([{ name: '周建宏', level: 'view' }]);
    expect(isEditorOf(wo, '周建宏')).toBe(false);
    expect(guard('print_officer', '周建宏', wo).allowed).toBe(false);
  });

  it('代理被移除後，現場副本即使還留著也擋下', () => {
    const staleTask = { ...floorTask, work_order_shared_members: [{ name: '周建宏', level: 'edit' }] };
    const result = checkReportPermission({
      source: REPORT_SOURCES.WORK_ORDER_DETAIL,
      role: 'print_officer',
      currentUser: '周建宏',
      task: staleTask,
      pkg: null,
      workOrder: workOrderWith([]),
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('編輯（代理）');
  });

  it('負責人本人照舊放行；非印務角色一律沒有工單詳情這個管道', () => {
    const wo = workOrderWith([]);
    expect(guard('print_officer', '蔡明修', wo).allowed).toBe(true);
    expect(guard('production_planner', '許文傑', wo).allowed).toBe(false);
  });

  it('非負責也未取得編輯分享的印務，在工單詳情被擋下；改從所有生產任務報同一筆（產線在所屬產線內）即放行', () => {
    const wo = workOrderWith([]);
    expect(guard('print_officer', '周建宏', wo).allowed).toBe(false);
    const viaAllTasks = checkReportPermission({
      source: REPORT_SOURCES.ALL_TASKS,
      role: 'print_officer',
      currentUser: '周建宏',
      task: floorTask,
      pkg: null,
      workOrder: wo,
    });
    expect(viaAllTasks).toMatchObject({ allowed: true, channel: '生產管理頁面代報' });
  });
});

describe('10.5／10.47 所有〇〇看所屬產線、我的〇〇看指派', () => {
  const printTask = { ...floorTask, id: 'pt-0815-2', name: '五色印刷', production_line: '數位產線' };
  const cutTask = { ...floorTask, id: 'pt-0812-3', name: '證書裁切', production_line: '手工產線' };

  it('生管鄭宇翔（手工、壓克力）從所有生產任務報不了數位產線的五色印刷，報得了手工產線的證書裁切', () => {
    const check = (task) =>
      checkReportPermission({
        source: REPORT_SOURCES.ALL_TASKS,
        role: 'production_planner',
        currentUser: '鄭宇翔',
        task,
        pkg: null,
      });
    expect(check(printTask).allowed).toBe(false);
    expect(check(cutTask).allowed).toBe(true);
  });

  it('所有工作包同樣看任務的產線，不看工作包裡其他任務', () => {
    const pkg = { id: 'wp-mix', master: '劉阿海' };
    const check = (task) =>
      checkReportPermission({
        source: REPORT_SOURCES.ALL_PACKAGES,
        role: 'production_planner',
        currentUser: '鄭宇翔',
        task,
        pkg,
      });
    expect(check(cutTask).allowed).toBe(true);
    expect(check(printTask).allowed).toBe(false);
  });

  it('我的生產任務只報得到指派給自己的任務：劉阿海送出指派給陳金水的軋盒成型被擋下', () => {
    const check = (master) =>
      checkReportPermission({
        source: REPORT_SOURCES.MY_TASKS,
        role: 'master',
        currentUser: '劉阿海',
        task: { ...floorTask, id: 'pt-0815-3', name: '軋盒成型', production_line: '裝訂產線' },
        pkg: { id: 'wp-x', master },
      });
    expect(check('陳金水').allowed).toBe(false);
    expect(check('劉阿海')).toMatchObject({ allowed: true, channel: '師傅自助' });
  });

  it('師傅沒有所有〇〇的代報管道', () => {
    expect(
      checkReportPermission({
        source: REPORT_SOURCES.ALL_TASKS,
        role: 'master',
        currentUser: '劉阿海',
        task: printTask,
        pkg: null,
      }).allowed,
    ).toBe(false);
  });
});
