import { beforeEach, describe, expect, it } from 'vitest';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';

// 情境目錄 9.13「工作包的師傅不可改，換人走取消工作包後重新打包」的資料層驗算（畫面另在 e2e 9.13 驗）。
// 起點資料：鏈二 WP-2026-0710-02（指派師傅李榮發，旗下裁切成型）。

const initial = {
  tasks: useProductionFloorStore.getState().tasks,
  workPackages: useProductionFloorStore.getState().workPackages,
  workReports: useProductionFloorStore.getState().workReports,
};
beforeEach(() => useProductionFloorStore.setState(initial));
const floor = () => useProductionFloorStore.getState();
const pkgByNo = (no) => floor().workPackages.find((p) => p.package_no === no);

describe('9.13 取消工作包後重新打包', () => {
  it('取消後工作包消失、旗下任務回待派，報工紀錄留在任務上，歷程記一筆', () => {
    const pkg = pkgByNo('WP-2026-0710-01');
    const memberIds = floor().tasks.filter((t) => t.package_id === pkg.id).map((t) => t.id);
    const reportsBefore = floor().workReports.filter((r) => memberIds.includes(r.task_id)).length;
    expect(memberIds.length).toBeGreaterThan(0);

    const result = floor().cancelWorkPackage(pkg.id, { by: '許文傑' });
    expect(result).toMatchObject({ ok: true, taskCount: memberIds.length });
    expect(pkgByNo('WP-2026-0710-01')).toBeUndefined();
    memberIds.forEach((id) => {
      const task = floor().tasks.find((t) => t.id === id);
      expect(task.package_id).toBeNull();
      expect(task.history.at(-1).event).toContain('取消工作包 WP-2026-0710-01');
    });
    expect(floor().workReports.filter((r) => memberIds.includes(r.task_id))).toHaveLength(reportsBefore);
  });

  it('回待派的任務可重新打包給另一位師傅', () => {
    const pkg = pkgByNo('WP-2026-0710-02');
    const memberIds = floor().tasks.filter((t) => t.package_id === pkg.id).map((t) => t.id);
    floor().cancelWorkPackage(pkg.id, { by: '許文傑' });
    const next = floor().createWorkPackage({
      taskIds: memberIds,
      master: '陳金水',
      plannedEndDate: '2026-10-10',
      operator: '許文傑',
    });
    expect(next.master).toBe('陳金水');
    memberIds.forEach((id) => expect(floor().tasks.find((t) => t.id === id).package_id).toBe(next.id));
  });

  it('工作包沒有改師傅的動作', () => {
    expect(floor().updateMaster).toBeUndefined();
  });
});
