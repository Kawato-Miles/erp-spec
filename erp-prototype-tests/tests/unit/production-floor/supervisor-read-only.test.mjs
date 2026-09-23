import { describe, expect, it } from 'vitest';
import {
  canConfirmTaskReceipt,
  canMaintainWorkPackage,
  canManuallyCompleteTask,
  canReportWork,
  canVoidWorkReport,
  checkReportPermission,
  FLOOR_MANAGER_ROLES,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { canReceiveTransfer } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';

// 情境 9.12「主管在生產管理各頁唯讀」的判定驗算（畫面另在 e2e 9.12 驗）。
// 主管（Supervisor）看全公司、不動單據（wiki Supervisor 角色卡）；生產管理五模組的
// 同權角色只有生管、印務、印務主管。

const pkg = { id: 'wp-demo', master: '劉阿海' };
const ticket = { id: 'tt-demo', status: '已送達', target_station_key: 'POLAR 137 裁切機', details: [] };
const who = { role: 'supervisor', currentUser: '王大明' };

describe('9.12 主管在生產管理唯讀', () => {
  it('同權角色清單不含主管', () => {
    expect(FLOOR_MANAGER_ROLES).toEqual(['production_planner', 'print_officer', 'print_manager']);
  });

  it('主管不能接收工作、派工維護工作包、手動完成', () => {
    expect(canConfirmTaskReceipt('supervisor')).toBe(false);
    expect(canMaintainWorkPackage('supervisor')).toBe(false);
    expect(canManuallyCompleteTask('supervisor')).toBe(false);
  });

  it('主管不能代報工、不能作廢報工', () => {
    expect(canReportWork(pkg, 'supervisor', '王大明')).toBe(false);
    expect(
      checkReportPermission({ source: REPORT_SOURCES.FLOOR, ...who, task: {}, pkg }).allowed,
    ).toBe(false);
    expect(canVoidWorkReport({ reporter: '劉阿海' }, 'supervisor', '王大明', {})).toBe(false);
  });

  it('主管不能代點收；生管照舊可代點收', () => {
    expect(canReceiveTransfer(ticket, who).allowed).toBe(false);
    const planner = canReceiveTransfer(ticket, { role: 'production_planner', currentUser: '許文傑' });
    expect(planner.allowed).toBe(true);
    expect(planner.proxy).toBe(true);
  });
});
