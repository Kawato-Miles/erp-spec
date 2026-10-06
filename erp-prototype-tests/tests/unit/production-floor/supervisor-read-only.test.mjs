import { describe, expect, it } from 'vitest';
import {
  canManuallyCompleteTask,
  canOperateFloorUnit,
  canReportWork,
  canVoidWorkReport,
  checkReportPermission,
  FLOOR_MANAGER_ROLES,
  FLOOR_PERMISSIONS as P,
  floorUnitsOf,
  hasFloorPermission,
  isFloorReadOnly,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { canReceiveTransfer } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import {
  isTaskInMyLines,
  isTicketInMyLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/unit-scope.js';

// 情境 9.12「主管在生產管理五個產線單元唯讀看全貌」的判定驗算（畫面另在 e2e 9.12 驗）。
// 規則正本：wiki 印件生產流程 § 生產管理單元的權限範圍（主管對五個產線單元只有唯讀檢視）、
// wiki Supervisor（生產管理各頁唯讀看全貌）。現場代行角色仍只有生管、印務、印務主管。

const pkg = { id: 'wp-demo', master: '劉阿海' };
// 轉交單單頭記目的產線（destination_line），明細記目的站點（Miles 2026-10-06 拍板）
const ticket = {
  id: 'tt-demo',
  status: '已送達',
  destination_line: '手工產線',
  details: [{ task_id: 'pt-demo', destination_station_key: '裁切站', qty: 100, receipts: [] }],
};
const who = { role: 'supervisor', currentUser: '王大明' };

const LINE_UNITS = [
  P.TASKS_LINE,
  P.PACKAGES_LINE,
  P.PENDING_MOVES_LINE,
  P.TRANSFERS_LINE,
  P.RECEIVING_LINE,
];

describe('9.12 主管在生產管理五個產線單元唯讀看全貌', () => {
  it('主管拿到五個產線單元、沒有負責單元', () => {
    expect(floorUnitsOf('supervisor').map((u) => u.label)).toEqual([
      '所有生產任務',
      '所有工作包',
      '待轉交任務',
      '所有轉交單',
      '點收佇列',
    ]);
    expect(hasFloorPermission('supervisor', P.TASKS_OWN)).toBe(false);
  });

  it('五個單元都只有檢視：單元操作一律不開放', () => {
    expect(isFloorReadOnly('supervisor')).toBe(true);
    LINE_UNITS.forEach((key) => expect(canOperateFloorUnit('supervisor', key)).toBe(false));
    // 對照：生管持同樣的單元、可以操作
    LINE_UNITS.forEach((key) => expect(canOperateFloorUnit('production_planner', key)).toBe(true));
  });

  it('看全貌：六條產線與品檢線的單據都在主管的範圍內', () => {
    ['壓克力產線', '馬克杯產線', '杯墊產線', '數位產線', '裝訂產線', '手工產線'].forEach(
      (line) => expect(isTaskInMyLines({ production_line: line }, '王大明')).toBe(true),
    );
    expect(
      isTicketInMyLines(
        { destination_line: '品檢線', details: [{ task_id: 'x', destination_station_key: '品檢站' }] },
        [],
        '王大明',
      ),
    ).toBe(true);
  });

  it('同權角色清單不含主管，主管不能手動完成', () => {
    expect(FLOOR_MANAGER_ROLES).toEqual(['production_planner', 'print_officer', 'print_manager']);
    expect(canManuallyCompleteTask('supervisor')).toBe(false);
  });

  it('主管不能代報工、不能作廢報工', () => {
    expect(canReportWork(pkg, 'supervisor', '王大明')).toBe(false);
    expect(
      checkReportPermission({
        source: REPORT_SOURCES.ALL_PACKAGES,
        ...who,
        task: { production_line: '手工產線' },
        pkg,
      }).allowed,
    ).toBe(false);
    expect(canVoidWorkReport({ reporter: '劉阿海' }, 'supervisor', '王大明', {})).toBe(false);
  });

  it('主管看得到點收佇列但不能點收；所屬產線含手工產線的生管可點收，不留代點收標記', () => {
    expect(canReceiveTransfer(ticket, who).allowed).toBe(false);
    const planner = canReceiveTransfer(ticket, { role: 'production_planner', currentUser: '許文傑' });
    expect(planner.allowed).toBe(true);
    expect(planner.proxy).toBeFalsy();
  });
});
