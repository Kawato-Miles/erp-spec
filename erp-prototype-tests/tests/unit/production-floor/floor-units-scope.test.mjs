import { describe, expect, it } from 'vitest';
import {
  MOCK_FLOOR_TASKS,
  MOCK_TRANSFER_TICKETS,
  MOCK_WORK_PACKAGES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import {
  FLOOR_PERMISSIONS as P,
  floorUnitsOf,
  hasFloorPermission,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { calcReceivingQueue } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import {
  isMyTransferTicket,
  isMyWorkPackage,
  isPackageInMyLines,
  isTaskInMyLines,
  isTicketInMyLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/unit-scope.js';

// 情境目錄 14.28「生產管理權限分產線與負責兩種範圍」的判定驗算（畫面另在 e2e 14.10、14.28 驗）。
// 規則正本：Miles 2026-10-06 第三輪拍板（單元拆分與權限更正版）；角色預設權限表在 permissions.ROLE_FLOOR_PERMISSIONS。

const labelsOf = (role) => floorUnitsOf(role).map((u) => u.label);
const LINE_UNITS = ['所有生產任務', '所有工作包', '待轉交任務', '所有轉交單', '點收佇列'];

describe('14.28 各角色預設拿到的單元', () => {
  it('印務、印務主管、生管持五個產線權限', () => {
    expect(labelsOf('print_officer')).toEqual(LINE_UNITS);
    expect(labelsOf('print_manager')).toEqual(LINE_UNITS);
    expect(labelsOf('production_planner')).toEqual(LINE_UNITS);
  });

  it('師傅：我的生產任務、我的工作包、點收佇列；品檢人員：點收佇列；廠務：我的轉交單', () => {
    expect(labelsOf('master')).toEqual(['我的生產任務', '我的工作包', '點收佇列']);
    expect(labelsOf('qc_inspector')).toEqual(['點收佇列']);
    expect(labelsOf('facility_staff')).toEqual(['我的轉交單']);
  });

  it('業務沒有生產管理權限；主管只拿到五個產線單元（唯讀，見 9.12）；生管沒有負責範圍的權限', () => {
    expect(labelsOf('supervisor')).toEqual([
      '所有生產任務',
      '所有工作包',
      '待轉交任務',
      '所有轉交單',
      '點收佇列',
    ]);
    expect(floorUnitsOf('sales')).toEqual([]);
    expect(hasFloorPermission('production_planner', P.TASKS_OWN)).toBe(false);
    expect(hasFloorPermission('production_planner', P.TASKS_LINE)).toBe(true);
  });
});

describe('14.28 兩種範圍的判定', () => {
  it('所有生產任務（產線）：許文傑涵蓋全部 mock 任務，鄭宇翔只剩手工產線的', () => {
    const xu = MOCK_FLOOR_TASKS.filter((t) => isTaskInMyLines(t, '許文傑'));
    const zheng = MOCK_FLOOR_TASKS.filter((t) => isTaskInMyLines(t, '鄭宇翔'));
    expect(xu).toHaveLength(MOCK_FLOOR_TASKS.length);
    expect(zheng.length).toBeGreaterThan(0);
    expect(zheng.length).toBeLessThan(MOCK_FLOOR_TASKS.length);
    zheng.forEach((t) => expect(t.production_line).toBe('手工產線'));
  });

  it('印務周建宏六條產線加品檢站全選，看得到全部 mock 任務；業務沒有所屬產線，一筆都看不到', () => {
    expect(MOCK_FLOOR_TASKS.filter((t) => isTaskInMyLines(t, '周建宏'))).toHaveLength(
      MOCK_FLOOR_TASKS.length,
    );
    expect(MOCK_FLOOR_TASKS.filter((t) => isTaskInMyLines(t, '洪嘉駿'))).toHaveLength(0);
  });

  it('所有工作包（產線）：旗下任務產線在所屬產線；我的工作包（負責）：師傅為自己', () => {
    const zheng = MOCK_WORK_PACKAGES.filter((p) =>
      isPackageInMyLines(p, MOCK_FLOOR_TASKS, '鄭宇翔'),
    );
    zheng.forEach((p) =>
      expect(
        MOCK_FLOOR_TASKS.some((t) => t.package_id === p.id && t.production_line === '手工產線'),
      ).toBe(true),
    );
    const liu = MOCK_WORK_PACKAGES.filter((p) => isMyWorkPackage(p, '劉阿海'));
    expect(liu.length).toBeGreaterThan(0);
    liu.forEach((p) => expect(p.master).toBe('劉阿海'));
  });

  it('所有轉交單（產線）：來源任務產線或目的站在所屬產線；郭淑芬只看目的站為品檢站的單', () => {
    const xu = MOCK_TRANSFER_TICKETS.filter((t) => isTicketInMyLines(t, MOCK_FLOOR_TASKS, '許文傑'));
    expect(xu).toHaveLength(MOCK_TRANSFER_TICKETS.length);
    const guo = MOCK_TRANSFER_TICKETS.filter((t) => isTicketInMyLines(t, MOCK_FLOOR_TASKS, '郭淑芬'));
    guo.forEach((t) => expect(t.target_station_key).toBe('品檢站'));
  });

  it('我的轉交單（負責）：簡俊男看得到全部既有轉交單，邱志明一張都沒有', () => {
    expect(MOCK_TRANSFER_TICKETS.filter((t) => isMyTransferTicket(t, '簡俊男'))).toHaveLength(
      MOCK_TRANSFER_TICKETS.length,
    );
    expect(MOCK_TRANSFER_TICKETS.filter((t) => isMyTransferTicket(t, '邱志明'))).toHaveLength(0);
  });

  it('點收佇列（產線）：只列已送達與已點收、目的站在所屬產線，依建單時間新到舊', () => {
    const xu = calcReceivingQueue(MOCK_TRANSFER_TICKETS, {
      role: 'production_planner',
      currentUser: '許文傑',
    });
    xu.forEach((row) => expect(['已送達', '已點收']).toContain(row.ticket.status));
    const created = xu.map((row) => row.ticket.created_at);
    expect(created).toEqual([...created].sort().reverse());
    const liu = calcReceivingQueue(MOCK_TRANSFER_TICKETS, { role: 'master', currentUser: '劉阿海' });
    liu.forEach((row) => expect(['數位產線', '裝訂產線']).toContain(row.ticket.target_station_key));
    expect(liu.some((row) => row.ticket.ticket_no === 'TT-20260830-002')).toBe(false);
  });
});
