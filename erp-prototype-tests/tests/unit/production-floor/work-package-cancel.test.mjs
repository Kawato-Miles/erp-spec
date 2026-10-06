import { beforeEach, describe, expect, it } from 'vitest';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';

// 情境目錄 9.13「工作包的師傅不可改，換人走取消工作包後重新打包；取消即刪除、報工不記所屬工作包」的資料層驗算
//（畫面另在 e2e 9.13 驗）。報工不記所屬工作包為新契約（等 tasks 4.3 實作）。
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

  it('取消即刪除工作包：已有報工的裁切成型照樣可取消，狀態與報工累計不變，報工紀錄不帶任何工作包連結', () => {
    // 前置：裁切成型（WP-2026-0710-02）先有一筆報工、轉製作中
    const pkg = pkgByNo('WP-2026-0710-02');
    const taskId = floor().tasks.find((t) => t.package_id === pkg.id).id;
    floor().submitWorkReport(taskId, {
      input_qty: 100,
      good_qty: 100,
      defect_qty: 0,
      photos: ['裁切-首批.jpg'],
      channel: '生產管理頁面代報',
      reporter: '許文傑',
    });
    const before = floor().tasks.find((t) => t.id === taskId);
    expect(before.status).toBe('製作中');
    const result = floor().cancelWorkPackage(pkg.id, { by: '許文傑' });
    expect(result.ok).toBe(true);
    expect(floor().workPackages.some((p) => p.id === pkg.id)).toBe(false);
    const after = floor().tasks.find((t) => t.id === taskId);
    expect(after.package_id).toBeNull();
    expect(after.status).toBe('製作中');
    expect(after.input_qty).toBe(before.input_qty);
    floor()
      .workReports.filter((r) => r.task_id === taskId)
      .forEach((r) => expect('work_package_id' in r).toBe(false));
  });

  it('工作包沒有改師傅的動作', () => {
    expect(floor().updateMaster).toBeUndefined();
  });
});
