import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境 7.44：印務刪掉規劃中不要的生產任務，被其他任務設為前置的任務擋下。
// 依據：wiki 生產任務狀態（待處理 → 刪除）、製程規劃活動清單 ACT-PLAN-044～046、工序相依性規則。
// 畫面操作在 tests/e2e/07-process-planning/delete-task.spec.mjs。

const clone = (v) => JSON.parse(JSON.stringify(v));
const wo0901 = () => clone(MOCK_WORK_ORDERS.find((o) => o.work_order_no === 'WO-2026-0901'));

describe('7.44 誰可以在什麼狀態刪除生產任務（與編輯製程規劃同一把關）', () => {
  it('草稿：負責印務周建宏與印務主管可刪，非負責的印務與檢視層級分享成員不可', () => {
    const wo = wo0901();
    expect(permissions.canEditProcess(wo, 'print_officer', '周建宏')).toBe(true);
    expect(permissions.canEditProcess(wo, 'print_manager', '吳國豪')).toBe(true);
    expect(permissions.canEditProcess(wo, 'print_officer', '林佩君')).toBe(false);
    // 蔡明修是 WO-2026-0901 的檢視層級分享成員
    expect(permissions.canEditProcess(wo, 'print_officer', '蔡明修')).toBe(false);
  });

  it('取得編輯分享的成員可刪', () => {
    const wo = wo0901();
    wo.shared_members = [{ name: '蔡明修', level: 'edit' }];
    expect(permissions.canEditProcess(wo, 'print_officer', '蔡明修')).toBe(true);
  });

  it('業務與生管等其他角色不可刪', () => {
    const wo = wo0901();
    ['sales', 'production_planner', 'supervisor', 'qc_inspector'].forEach((role) => {
      expect(permissions.canEditProcess(wo, role, '路人'), role).toBe(false);
    });
  });

  it('只有草稿與重新確認製程可刪：製程確認中、審核完成之後都不可', () => {
    ['草稿', '重新確認製程'].forEach((status) => {
      const wo = { ...wo0901(), status };
      expect(permissions.canEditProcess(wo, 'print_manager', '吳國豪'), status).toBe(true);
      expect(permissions.canEditProcess(wo, 'print_officer', '周建宏'), status).toBe(true);
    });
    ['製程確認中', '製程審核完成', '工單已交付', '製作中', '已完成', '異動', '已取消'].forEach(
      (status) => {
        const wo = { ...wo0901(), status };
        expect(permissions.canEditProcess(wo, 'print_manager', '吳國豪'), status).toBe(false);
        expect(permissions.canEditProcess(wo, 'print_officer', '周建宏'), status).toBe(false);
      },
    );
  });
});

describe('7.44 被設為前置的任務擋下刪除', () => {
  it('WO-2026-0901 的前置鏈：DM 四色雙面印刷被裁切成型當前置，三摺加工沒有人以它為前置', () => {
    const wo = wo0901();
    const dm = wo.tasks.find((t) => t.name === 'DM 四色雙面印刷');
    const fold = wo.tasks.find((t) => t.name === '三摺加工');
    expect(permissions.taskDeleteBlockersOf(wo, dm).map((b) => b.name)).toEqual(['裁切成型']);
    expect(permissions.taskDeleteBlockersOf(wo, fold)).toEqual([]);
  });

  it('跨工單前置也擋下：同印件另一張工單的任務以本任務為前置（工單編號#識別序號）', () => {
    const wo = wo0901();
    const dm = wo.tasks.find((t) => t.name === 'DM 四色雙面印刷');
    const fold = wo.tasks.find((t) => t.name === '三摺加工');
    const sibling = {
      work_order_no: 'WO-2026-0999',
      tasks: [{ id: 'x-1', seq: 1, name: '裝盒組裝', depends_on: [`WO-2026-0901#${fold.seq}`] }],
    };
    const blockers = permissions.taskDeleteBlockersOf(wo, fold, [sibling]);
    expect(blockers).toEqual([{ name: '裝盒組裝', work_order_no: 'WO-2026-0999', cross: true }]);
    // 前置指向別的任務時不影響本任務
    expect(permissions.taskDeleteBlockersOf(wo, dm, [sibling]).map((b) => b.name)).toEqual([
      '裁切成型',
    ]);
    // 另一張工單用同樣的識別序號指向自己的任務，不算數
    const unrelated = {
      work_order_no: 'WO-2026-0998',
      tasks: [{ id: 'y-1', seq: 1, name: '無關任務', depends_on: [`WO-2026-0998#${fold.seq}`] }],
    };
    expect(permissions.taskDeleteBlockersOf(wo, fold, [unrelated])).toEqual([]);
  });
});

describe('7.44 刪除動作（store）：擋下時不動，成立後任務消失且不留作廢紀錄', () => {
  const wo = (id) => useWorkOrdersStore.getState().workOrders.find((o) => o.id === id);

  beforeEach(() => {
    useWorkOrdersStore.setState({ workOrders: clone(MOCK_WORK_ORDERS) });
  });

  it('刪掉沒有人以它為前置的三摺加工：任務自工單消失，其餘任務原樣', () => {
    const before = wo('wo-2026-0901').tasks.length;
    const fold = wo('wo-2026-0901').tasks.find((t) => t.name === '三摺加工');
    const result = useWorkOrdersStore.getState().removeProductionTask('wo-2026-0901', fold.id);
    expect(result.ok).toBe(true);
    const tasks = wo('wo-2026-0901').tasks;
    expect(tasks).toHaveLength(before - 1);
    expect(tasks.find((t) => t.id === fold.id)).toBeUndefined();
    // 刪除不留已作廢的任務
    expect(tasks.some((t) => t.status === '已作廢')).toBe(false);
  });

  it('DM 四色雙面印刷是裁切成型的前置：擋下並指出對方，任務數不變', () => {
    const before = wo('wo-2026-0901').tasks.length;
    const dm = wo('wo-2026-0901').tasks.find((t) => t.name === 'DM 四色雙面印刷');
    const result = useWorkOrdersStore.getState().removeProductionTask('wo-2026-0901', dm.id);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('裁切成型');
    expect(wo('wo-2026-0901').tasks).toHaveLength(before);
  });

  it('解除相依（裁切成型不再以 DM 四色雙面印刷為前置）後才刪得掉', () => {
    const dm = wo('wo-2026-0901').tasks.find((t) => t.name === 'DM 四色雙面印刷');
    useWorkOrdersStore.setState((s) => ({
      workOrders: s.workOrders.map((o) =>
        o.id === 'wo-2026-0901'
          ? {
              ...o,
              tasks: o.tasks.map((t) => (t.name === '裁切成型' ? { ...t, depends_on: [] } : t)),
            }
          : o,
      ),
    }));
    expect(useWorkOrdersStore.getState().removeProductionTask('wo-2026-0901', dm.id).ok).toBe(true);
  });

  it('同印件另一張工單的任務以本任務為前置時，store 也擋下，訊息帶出對方工單編號與任務名稱', () => {
    const fold = wo('wo-2026-0901').tasks.find((t) => t.name === '三摺加工');
    // WO-2026-0905 與 WO-2026-0904 同印件 PI-2026-0904；把 0901 的三摺加工掛成它旗下任務的前置不合邏輯，
    // 改造一張同印件的合成工單來驗跨工單
    useWorkOrdersStore.setState((s) => {
      const base = s.workOrders.find((o) => o.id === 'wo-2026-0901');
      const sibling = {
        ...clone(base),
        id: 'wo-test-sibling',
        work_order_no: 'WO-TEST-SIBLING',
        tasks: [
          {
            ...clone(base.tasks[0]),
            id: 'sib-1',
            seq: 1,
            name: '裝盒組裝',
            depends_on: [`WO-2026-0901#${fold.seq}`],
          },
        ],
      };
      return { workOrders: [...s.workOrders, sibling] };
    });
    const result = useWorkOrdersStore.getState().removeProductionTask('wo-2026-0901', fold.id);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('WO-TEST-SIBLING');
    expect(result.error).toContain('裝盒組裝');
    expect(wo('wo-2026-0901').tasks.some((t) => t.id === fold.id)).toBe(true);
  });

  it('工單送審後（製程確認中）刪除被擋下', () => {
    const task = wo('wo-2026-0907').tasks.at(-1);
    const result = useWorkOrdersStore.getState().removeProductionTask('wo-2026-0907', task.id);
    expect(result.ok).toBe(false);
    expect(wo('wo-2026-0907').tasks.some((t) => t.id === task.id)).toBe(true);
  });
});
