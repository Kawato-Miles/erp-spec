// 情境目錄 7.48（單據權責修正第七批）：印務自行加開工單，負責人固定為加開者、不經分派；
// 工單審核主管由印務送製程審核時指定。印務主管加開工單維持既有分派流程。
// 規則正本：wiki 工單產生與分派活動清單 ACT-WOA-006、ACT-WOA-009；製程規劃活動清單 ACT-PLAN-018；工單實體卡（負責人、工單審核主管）。
// 畫面操作在 tests/e2e/07-process-planning/self-add-work-order.spec.mjs。
import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

const clone = (v) => JSON.parse(JSON.stringify(v));
const PRINT_ITEM = {
  print_item_no: 'PI-2026-0907',
  name: '型錄內頁',
  delivery_date: '2026-09-22',
  order_no: 'ORD-2026-0907',
  client_name: '峰華科技股份有限公司',
};

describe('7.48 誰可以自行加開工單', () => {
  it('印務在印件印製維度未到終態時可以自行加開（範圍全公司，不看是不是該印件任何工單的負責人）', () => {
    for (const status of [null, '等待中', '製程已確認', '製作中', '製作完成', '出貨中']) {
      expect(permissions.canSelfAddWorkOrder('print_officer', '周建宏', status).allowed, String(status)).toBe(true);
    }
  });

  it('印件已送達或已棄用不可再加開，理由指向售後補做', () => {
    for (const status of ['已送達', '已棄用']) {
      const guard = permissions.canSelfAddWorkOrder('print_officer', '周建宏', status);
      expect(guard.allowed, status).toBe(false);
      expect(guard.reason).toContain(status);
    }
  });

  it('其他角色沒有自行加開：業務、印務主管、生管、訂單管理人、Supervisor、會計', () => {
    for (const role of ['sales', 'consultant', 'print_manager', 'production_planner', 'order_manager', 'supervisor', 'accountant', 'master']) {
      expect(permissions.canSelfAddWorkOrder(role, null, '製程已確認').allowed, role).toBe(false);
    }
  });

  it('印務主管的加開工單維持既有守衛：印務不經這一條', () => {
    expect(permissions.canAddWorkOrder('print_manager', '製程已確認').allowed).toBe(true);
    expect(permissions.canAddWorkOrder('print_officer', '製程已確認').allowed).toBe(false);
  });
});

describe('7.48 自行加開的工單：負責人是加開者，審核主管送審時才指定', () => {
  const store = () => useWorkOrdersStore.getState();
  const byId = (id) => store().workOrders.find((o) => o.id === id);

  beforeEach(() => {
    useWorkOrdersStore.setState({ workOrders: clone(MOCK_WORK_ORDERS) });
  });

  it('加開時寫入負責人，工單為草稿、審核主管為空、沒有分享成員', () => {
    const draft = store().createDraftWorkOrder({
      print_item: PRINT_ITEM,
      work_order_type: '大貨',
      target_qty: 2000,
      owner: '周建宏',
    });
    const created = byId(draft.id);
    expect(created.status).toBe('草稿');
    expect(created.owner).toBe('周建宏');
    expect(created.reviewer).toBeNull();
    expect(created.shared_members).toEqual([]);
  });

  it('印務主管加開沿用既有流程：不帶負責人，之後由印務主管分派', () => {
    const draft = store().createDraftWorkOrder({ print_item: PRINT_ITEM, work_order_type: '大貨', target_qty: 2000 });
    expect(byId(draft.id).owner).toBeNull();
  });

  it('自行加開的工單送審必須選審核主管：沒有指定被擋下、工單維持草稿', () => {
    const draft = store().createDraftWorkOrder({
      print_item: PRINT_ITEM,
      work_order_type: '大貨',
      target_qty: 2000,
      owner: '周建宏',
    });
    expect(permissions.needsReviewerOnSubmit(byId(draft.id))).toBe(true);
    expect(store().submitProcess(draft.id).ok).toBe(false);
    expect(byId(draft.id).status).toBe('草稿');
    expect(byId(draft.id).reviewer).toBeNull();
  });

  it('送審時指定審核主管：工單轉製程確認中，審核主管寫入工單', () => {
    const draft = store().createDraftWorkOrder({
      print_item: PRINT_ITEM,
      work_order_type: '大貨',
      target_qty: 2000,
      owner: '周建宏',
    });
    const result = store().submitProcess(draft.id, { reviewer: '吳國豪' });
    expect(result.ok).toBe(true);
    expect(byId(draft.id).status).toBe('製程確認中');
    expect(byId(draft.id).reviewer).toBe('吳國豪');
  });

  it('印務主管分派過的工單已有審核主管：送審不再要求指定，也不覆蓋', () => {
    const assigned = byId('wo-2026-0901');
    expect(assigned.reviewer).toBe('吳國豪');
    expect(permissions.needsReviewerOnSubmit(assigned)).toBe(false);
    expect(store().submitProcess('wo-2026-0901').ok).toBe(true);
    expect(byId('wo-2026-0901').status).toBe('製程確認中');
    expect(byId('wo-2026-0901').reviewer).toBe('吳國豪');
  });
});
