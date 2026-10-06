import { describe, expect, it } from 'vitest';
import {
  MOCK_FLOOR_TASKS,
  MOCK_TRANSFER_TICKETS,
  MOCK_WORK_PACKAGES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
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

  it('印務周建宏六條產線加品檢線全選，看得到全部 mock 任務；業務沒有所屬產線，一筆都看不到', () => {
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

  it('所有轉交單（產線）：來源任務產線或目的產線在所屬產線；郭淑芬只看目的產線為品檢線的單', () => {
    const xu = MOCK_TRANSFER_TICKETS.filter((t) => isTicketInMyLines(t, MOCK_FLOOR_TASKS, '許文傑'));
    expect(xu).toHaveLength(MOCK_TRANSFER_TICKETS.length);
    const guo = MOCK_TRANSFER_TICKETS.filter((t) => isTicketInMyLines(t, MOCK_FLOOR_TASKS, '郭淑芬'));
    expect(guo.length).toBeGreaterThan(0);
    guo.forEach((t) => expect(t.destination_line).toBe('品檢線'));
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
    liu.forEach((row) => expect(['數位產線', '裝訂產線']).toContain(row.ticket.destination_line));
    expect(liu.some((row) => row.ticket.ticket_no === 'TT-20260830-002')).toBe(false);
  });
});

// 10.10 拿掉人工註記（Miles 2026-10-06 拍板）：報工與轉交單都不再提供人工註記，改不動的數字走逐層更正。
describe('10.10 不設人工註記', () => {
  it('權限表沒有新增人工註記這一支', () => {
    expect(permissions.canAddManualNote).toBeUndefined();
  });
});

// 9.20、9.21、14.28（2026-10-06 改版）：所有生產任務納入加工廠；跨產線工作包只對自己產線範圍的任務開放
// 報工、修改與作廢；我的生產任務開放報工、修改與作廢自己的報工。
// 新契約（等 tasks 6.1、6.2 實作）：
//   permissions.canEditWorkReport／canVoidWorkReport(report, role, currentUser, task, { source })
//     source 為 ALL_PACKAGES、ALL_TASKS｜任務的產線在操作者所屬產線內（生管、印務、印務主管）
//     source 為 MY_PACKAGES、MY_TASKS｜師傅只對自己提交的報工
//     source 為 WORK_ORDER_DETAIL｜工單負責人或編輯（代理）分享成員
describe('9.20 所有生產任務納入已交付的加工廠任務', () => {
  it('鏈外 WO-2026-0812 的證書局部上光（加工廠、手工產線）在現場任務池，列在許文傑與鄭宇翔的所有生產任務', () => {
    const plant = MOCK_FLOOR_TASKS.find((t) => t.id === 'pt-0812-9');
    expect(plant).toBeTruthy();
    expect(plant.unit_class).toBe('加工廠');
    expect(plant.delivered_at).toBeTruthy();
    expect(isTaskInMyLines(plant, '許文傑')).toBe(true);
    expect(isTaskInMyLines(plant, '鄭宇翔')).toBe(true);
    expect(isTaskInMyLines(plant, '劉阿海')).toBe(false);
  });

  it('現場任務池只有自有工廠與加工廠的任務', () => {
    MOCK_FLOOR_TASKS.forEach((t) => expect(['自有工廠', '加工廠']).toContain(t.unit_class));
  });
});

describe('9.21 跨產線工作包只能對自己產線範圍的任務報工、修改與作廢', () => {
  // 生管許文傑把證書裁切（手工產線）與五色印刷（數位產線）打成一包給劉阿海；鄭宇翔的所屬產線為手工與壓克力
  const cut = { id: 'pt-0812-3', name: '證書裁切', production_line: '手工產線', package_id: 'wp-mix' };
  const print = { id: 'pt-0815-2', name: '五色印刷', production_line: '數位產線', package_id: 'wp-mix' };
  const pkg = { id: 'wp-mix', master: '劉阿海' };
  const opts = { source: permissions.REPORT_SOURCES.ALL_PACKAGES };

  it('這一包列在鄭宇翔的所有工作包（旗下任一任務在範圍內）', () => {
    expect(isPackageInMyLines(pkg, [cut, print], '鄭宇翔')).toBe(true);
  });

  it('鄭宇翔只能修改與作廢證書裁切的報工；五色印刷的報工只能看', () => {
    const cutReport = { id: 'wr-cut', task_id: cut.id, reporter: '劉阿海' };
    const printReport = { id: 'wr-print', task_id: print.id, reporter: '劉阿海' };
    expect(permissions.canEditWorkReport(cutReport, 'production_planner', '鄭宇翔', cut, opts)).toBe(true);
    expect(permissions.canVoidWorkReport(cutReport, 'production_planner', '鄭宇翔', cut, opts)).toBe(true);
    expect(permissions.canEditWorkReport(printReport, 'production_planner', '鄭宇翔', print, opts)).toBe(false);
    expect(permissions.canVoidWorkReport(printReport, 'production_planner', '鄭宇翔', print, opts)).toBe(false);
  });

  it('許文傑（數位、裝訂、手工）兩筆都能操作', () => {
    const printReport = { id: 'wr-print', task_id: print.id, reporter: '劉阿海' };
    expect(permissions.canEditWorkReport(printReport, 'production_planner', '許文傑', print, opts)).toBe(true);
  });
});

describe('14.28 我的生產任務可報工、修改與作廢自己的報工', () => {
  const task = { id: 'pt-0812-4', name: '信封四色印刷', production_line: '數位產線', package_id: 'wp-0010' };
  const opts = { source: permissions.REPORT_SOURCES.MY_TASKS };

  it('師傅持我的生產任務，該單元可以操作', () => {
    expect(permissions.canOperateFloorUnit('master', P.TASKS_OWN)).toBe(true);
  });

  it('劉阿海對自己提交的報工可修改與作廢；別人代報的那筆不行', () => {
    const own = { id: 'wr-own', task_id: task.id, reporter: '劉阿海' };
    const proxied = { id: 'wr-proxy', task_id: task.id, reporter: '許文傑' };
    expect(permissions.canEditWorkReport(own, 'master', '劉阿海', task, opts)).toBe(true);
    expect(permissions.canVoidWorkReport(own, 'master', '劉阿海', task, opts)).toBe(true);
    expect(permissions.canEditWorkReport(proxied, 'master', '劉阿海', task, opts)).toBe(false);
    expect(permissions.canVoidWorkReport(proxied, 'master', '劉阿海', task, opts)).toBe(false);
  });

  it('點收佇列與所有轉交單提供相同的點收：生管許文傑在所有轉交單點得了目的產線為手工產線的單', () => {
    const ticket = MOCK_TRANSFER_TICKETS.find((t) => t.ticket_no === 'TT-20260830-002');
    expect(isTicketInMyLines(ticket, MOCK_FLOOR_TASKS, '許文傑')).toBe(true);
    expect(
      calcReceivingQueue(MOCK_TRANSFER_TICKETS, { role: 'production_planner', currentUser: '許文傑' }).some(
        (row) => row.ticket.ticket_no === 'TT-20260830-002' && row.permission.allowed,
      ),
    ).toBe(true);
  });
});
