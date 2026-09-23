import { describe, expect, it } from 'vitest';
import {
  checkReportPermission,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { isEditorOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';

// 情境 10.5「報工權限綁在工作歸屬上」的代理半段（畫面入口另在 e2e 10.5 驗）。
// 印務在工單詳情頁與印件詳情頁報工，範圍是自己負責、或取得「編輯（代理）」分享的工單
//（wiki 報工規則 § 報工權限守門、報工紀錄卡）。
// 以合成資料驗算：工單負責人蔡明修，交付產線後才把周建宏加為編輯（代理）。
// 現場任務身上的負責人與分享成員是交付當時的副本，系統守門要讀工單當下的值。

const floorTask = {
  id: 'pt-demo-1',
  work_order_no: 'WO-2026-0999',
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

describe('10.5 工單詳情頁與印件詳情頁的報工代理範圍', () => {
  it('交付後才授予的編輯（代理）成員，工單詳情頁報工放行', () => {
    const wo = workOrderWith([{ name: '周建宏', level: 'edit' }]);
    expect(isEditorOf(wo, '周建宏')).toBe(true);
    const result = guard('print_officer', '周建宏', wo);
    expect(result.allowed).toBe(true);
    expect(result.channel).toBe('印務於工單詳情頁');
  });

  it('印件詳情頁同一套判斷：代理成員放行', () => {
    const wo = workOrderWith([{ name: '周建宏', level: 'edit' }]);
    const result = guard('print_officer', '周建宏', wo, REPORT_SOURCES.PRINT_ITEM_DETAIL);
    expect(result.allowed).toBe(true);
    expect(result.channel).toBe('印務於印件詳情頁');
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

  it('負責人本人照舊放行；非印務角色一律沒有這個管道', () => {
    const wo = workOrderWith([]);
    expect(guard('print_officer', '蔡明修', wo).allowed).toBe(true);
    expect(guard('production_planner', '許文傑', wo).allowed).toBe(false);
  });
});
