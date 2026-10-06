import { beforeEach, describe, expect, it } from 'vitest';
import {
  MOCK_TRANSFER_TICKETS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import {
  canOperateFloorUnit,
  checkReportPermission,
  FLOOR_PERMISSIONS as P,
  REPORT_SOURCES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { canReportTask } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/report-rules.js';
import { sortHistoryDesc } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/history.js';
import {
  isPackableTask,
  useProductionFloorStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { calcReceivingQueue } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import {
  isMyWorkPackage,
  isPackageInMyLines,
  isTaskInMyLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/unit-scope.js';
import { floorDeliverableTasks } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/deliver-actions.js';

// 情境目錄 9.15 至 9.18：派工範圍與打包的資料層驗算。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 production-execution delta
// Scenario THEN，以及 wiki 業務情境卡「生產任務接收與派工」「生產管理單元可見範圍」。

const initial = {
  tasks: useProductionFloorStore.getState().tasks,
  workPackages: useProductionFloorStore.getState().workPackages,
  workReports: useProductionFloorStore.getState().workReports,
  transferTickets: useProductionFloorStore.getState().transferTickets,
};
beforeEach(() => useProductionFloorStore.setState(initial));
const floor = () => useProductionFloorStore.getState();
const taskOf = (id) => floor().tasks.find((t) => t.id === id);
const pkgByNo = (no) => floor().workPackages.find((p) => p.package_no === no);
const packageOfTask = (task) => floor().workPackages.find((p) => p.id === task?.package_id);

describe('9.15 師傅被借調到別線時照樣看得到並報得了工，點收範圍不變', () => {
  // 起點：劉阿海所屬產線為數位、裝訂產線；證書裁切（pt-0812-3）產線為手工產線、尚未派工；
  // TT-20260830-002 已送達、目的產線為手工產線
  const packToLiu = () =>
    floor().createWorkPackage({
      taskIds: ['pt-0812-3'],
      master: '劉阿海',
      plannedEndDate: '2026-09-08',
      operator: '許文傑',
    });

  it('起點：證書裁切的產線不在劉阿海的所屬產線', () => {
    expect(taskOf('pt-0812-3').production_line).toBe('手工產線');
    expect(isTaskInMyLines(taskOf('pt-0812-3'), '劉阿海')).toBe(false);
  });

  it('許文傑把證書裁切打包給劉阿海後，我的工作包與我的生產任務都列出它', () => {
    const pkg = packToLiu();
    expect(isMyWorkPackage(pkg, '劉阿海')).toBe(true);
    const myTasks = floor().tasks.filter((t) => isMyWorkPackage(packageOfTask(t), '劉阿海'));
    expect(myTasks.map((t) => t.name)).toContain('證書裁切');
  });

  it('劉阿海在我的工作包對證書裁切報得了工', () => {
    const pkg = packToLiu();
    const task = taskOf('pt-0812-3');
    expect(canOperateFloorUnit('master', P.PACKAGES_OWN)).toBe(true);
    expect(
      checkReportPermission({
        source: REPORT_SOURCES.FLOOR,
        role: 'master',
        currentUser: '劉阿海',
        task,
        pkg,
      }).allowed,
    ).toBe(true);
    expect(canReportTask(task, { tasks: floor().tasks, tickets: floor().transferTickets })).toBe(true);
  });

  it('點收佇列不列目的產線為手工產線的 TT-20260830-002', () => {
    packToLiu();
    const queue = calcReceivingQueue(MOCK_TRANSFER_TICKETS, {
      role: 'master',
      currentUser: '劉阿海',
    });
    expect(queue.some((row) => row.ticket.ticket_no === 'TT-20260830-002')).toBe(false);
    queue.forEach((row) => expect(row.ticket.target_station_key).not.toBe('手工產線'));
  });
});

describe('9.16 指派師傅在我的工作包編輯自己的工作包，指派師傅唯讀，編輯寫入任務歷程', () => {
  it('劉阿海在我的工作包改 WP-2026-0812-01 的備註：寫入新備註，生管在所有工作包看到改後的值', () => {
    const pkg = pkgByNo('WP-2026-0812-01');
    expect(isMyWorkPackage(pkg, '劉阿海')).toBe(true);
    expect(canOperateFloorUnit('master', P.PACKAGES_OWN)).toBe(true);

    const result = floor().updateWorkPackage(pkg.id, { note: '先印證書再印信封', by: '劉阿海' });
    expect(result.ok).toBe(true);
    const after = pkgByNo('WP-2026-0812-01');
    expect(after.note).toBe('先印證書再印信封');
    expect(isPackageInMyLines(after, floor().tasks, '許文傑')).toBe(true);
  });

  it('編輯不改指派師傅、工作包編號與旗下任務；帶了師傅也不改', () => {
    const pkg = pkgByNo('WP-2026-0812-01');
    const members = floor().tasks.filter((t) => t.package_id === pkg.id).map((t) => t.id);
    floor().updateWorkPackage(pkg.id, {
      plannedEndDate: '2026-09-10',
      master: '陳金水',
      by: '許文傑',
    });
    const after = floor().workPackages.find((p) => p.id === pkg.id);
    expect(after.master).toBe('劉阿海');
    expect(after.package_no).toBe('WP-2026-0812-01');
    expect(after.planned_end_date).toBe('2026-09-10');
    expect(floor().tasks.filter((t) => t.package_id === pkg.id).map((t) => t.id)).toEqual(members);
    expect(floor().updateMaster).toBeUndefined();
  });

  it('編輯寫進旗下每筆任務的歷程：事件、原值與新值、操作人', () => {
    const pkg = pkgByNo('WP-2026-0812-01');
    const before = pkg.planned_end_date;
    floor().updateWorkPackage(pkg.id, { plannedEndDate: '2026-09-10', by: '劉阿海' });
    const members = floor().tasks.filter((t) => t.package_id === pkg.id);
    expect(members.length).toBeGreaterThan(0);
    members.forEach((t) => {
      const last = t.history.at(-1);
      expect(last.event).toContain('編輯工作包 WP-2026-0812-01');
      expect(last.actor).toBe('劉阿海');
      expect(last.changes).toEqual([{ field: '預計完成日', before, after: '2026-09-10' }]);
    });
  });

  it('沒改到任何值時不寫歷程', () => {
    const pkg = pkgByNo('WP-2026-0812-01');
    const lengths = floor()
      .tasks.filter((t) => t.package_id === pkg.id)
      .map((t) => t.history.length);
    floor().updateWorkPackage(pkg.id, { note: pkg.note, by: '劉阿海' });
    expect(
      floor()
        .tasks.filter((t) => t.package_id === pkg.id)
        .map((t) => t.history.length),
    ).toEqual(lengths);
  });

  it('打包、編輯、取消工作包依新到舊記入任務歷程：取消工作包、編輯工作包、打包派工、接收（系統補記）', () => {
    // 起點：鏈三 WO-2026-0815 的牛皮紙 150g 備料（pt-0815-1）尚未接收
    expect(taskOf('pt-0815-1').received_confirmed_at).toBeNull();
    const pkg = floor().createWorkPackage({
      taskIds: ['pt-0815-1'],
      master: '劉阿海',
      plannedEndDate: '2026-09-04',
      operator: '許文傑',
    });
    floor().updateWorkPackage(pkg.id, { plannedEndDate: '2026-09-05', by: '許文傑' });
    floor().cancelWorkPackage(pkg.id, { by: '許文傑' });

    const history = sortHistoryDesc(taskOf('pt-0815-1').history);
    const top4 = history.slice(0, 4);
    expect(top4[0].event).toContain('取消工作包');
    expect(top4[1].event).toContain('編輯工作包');
    expect(top4[1].changes).toEqual([
      { field: '預計完成日', before: '2026-09-04', after: '2026-09-05' },
    ]);
    expect(top4[2].event).toContain('派工');
    expect(top4[2].event).toContain('劉阿海');
    expect(top4[3].event).toContain('接收');
    top4.forEach((e) => {
      expect(e.actor).toBe('許文傑');
      expect(e.at).toBeTruthy();
    });
  });
});

describe('9.17 工單取消後任務轉終態、留在所有生產任務且不可打包', () => {
  it('取消連鎖使鏈三兩筆任務轉已作廢與報廢：仍列在許文傑的所有生產任務，不可打包', () => {
    floor().applyCancelledTaskStatuses(
      { 'pt-0815-1': '已作廢', 'pt-0815-2': '報廢' },
      { operator: '周建宏', reason: '訂單取消連鎖' },
    );
    for (const [id, status] of [
      ['pt-0815-1', '已作廢'],
      ['pt-0815-2', '報廢'],
    ]) {
      const t = taskOf(id);
      expect(t.status).toBe(status);
      expect(isTaskInMyLines(t, '許文傑')).toBe(true);
      expect(isPackableTask(t)).toBe(false);
    }
    expect(isPackableTask(taskOf('pt-0815-3'))).toBe(true);
  });

  it('繞過介面直接打包時，已作廢與報廢的任務不進工作包，其餘照常打包', () => {
    floor().applyCancelledTaskStatuses({ 'pt-0815-1': '已作廢', 'pt-0815-2': '報廢' });
    const pkg = floor().createWorkPackage({
      taskIds: ['pt-0815-1', 'pt-0815-2', 'pt-0815-3'],
      master: '劉阿海',
      plannedEndDate: '2026-09-04',
      operator: '許文傑',
    });
    expect(taskOf('pt-0815-1').package_id).toBeNull();
    expect(taskOf('pt-0815-2').package_id).toBeNull();
    expect(taskOf('pt-0815-3').package_id).toBe(pkg.id);
  });

  it('已打包的任務不可再打包', () => {
    const packed = floor().tasks.find((t) => t.package_id);
    expect(isPackableTask(packed)).toBe(false);
  });
});

describe('9.18 加工廠與外包任務交付產線後不進所有生產任務', () => {
  const delivered = [
    { id: 'a', name: '海報四色印刷', unit_class: '自有工廠' },
    { id: 'b', name: '燙金', unit_class: '加工廠' },
    { id: 'c', name: '絲印', unit_class: '外包廠' },
    { id: 'd', name: '精裝', unit_class: '中國廠商' },
  ];

  it('只有自有工廠的任務轉進生管的所有生產任務', () => {
    expect(floorDeliverableTasks(delivered).map((t) => t.id)).toEqual(['a']);
  });

  it('加工廠任務不進所有生產任務', () => {
    expect(floorDeliverableTasks([delivered[1]])).toEqual([]);
  });

  it('外包廠與中國廠商任務不進所有生產任務', () => {
    expect(floorDeliverableTasks([delivered[2], delivered[3]])).toEqual([]);
  });
});
