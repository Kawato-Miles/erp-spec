import { beforeEach, describe, expect, it } from 'vitest';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { resolvePrecedence } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/precedence.js';
import {
  calcArrivedQty,
  calcReceivedQtyAt,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { canEditTaskDestination } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';
import { hasStockedOutput } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/removal-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.22～10.24：場內轉交規則改版（取消回運單、目的站點可改、到料量不比對站點）。
// 起點資料：鏈四 WO-2026-0820（已完成，負責印務周建宏）的 PT-0820-9 精裝裝訂
//（已完成，目的站點品檢站，良品 500、尚未開轉交單）；鏈五 WO-2026-0901（草稿，尚未交付產線）。

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
});

const floor = () => useProductionFloorStore.getState();
const floorTask = (id) => floor().tasks.find((t) => t.id === id);
const ticketById = (id) => floor().transferTickets.find((t) => t.id === id);

describe('10.22 改目的站點後已建的轉交單不動，之後新建的單取新站', () => {
  it('已交付產線的任務：現場那一份目的站點跟著換，任務歷程記原站、新站與修改人', () => {
    floor().syncTaskDestination('pt-0820-9', {
      fromKey: '品檢站',
      toKey: '覆膜機',
      actor: '周建宏',
    });
    const task = floorTask('pt-0820-9');
    expect(task.downstream_station_key).toBe('覆膜機');
    expect(task.downstream_station).toBe('雙面覆霧膜｜覆膜機');
    const last = task.history.at(-1);
    expect(last.actor).toBe('周建宏');
    expect(last.at).toBeTruthy();
    expect(last.event).toContain('目的站點由 品檢站 改為 雙面覆霧膜｜覆膜機');
  });

  it('改站前建的單維持原目的地；改站後新建的單取新目的站點，呼叫端帶的目的地不被採用', () => {
    const { created: before } = floor().createTransferTickets({
      picks: [{ task_id: 'pt-0820-9', qty: 200 }],
      actor: '許文傑',
    });
    expect(before[0].target_station_key).toBe('品檢站');

    floor().syncTaskDestination('pt-0820-9', { fromKey: '品檢站', toKey: '覆膜機', actor: '周建宏' });
    expect(ticketById(before[0].id).target_station_key).toBe('品檢站');

    const { created: after } = floor().createTransferTickets({
      // 資料層不接受覆寫目的地：即使帶了舊站點鍵，新單仍取任務當下的目的站點
      picks: [{ task_id: 'pt-0820-9', qty: 100, station_key: '品檢站' }],
      actor: '許文傑',
    });
    expect(after[0].target_station_key).toBe('覆膜機');
    expect(after[0].target_station).toBe('雙面覆霧膜｜覆膜機');
  });

  it('改單不改目的地；作廢重開的新單沿用原單目的地', () => {
    const { created } = floor().createTransferTickets({
      picks: [{ task_id: 'pt-0820-9', qty: 200 }],
      actor: '許文傑',
    });
    const ticket = created[0];
    floor().syncTaskDestination('pt-0820-9', { fromKey: '品檢站', toKey: '覆膜機', actor: '周建宏' });

    const edit = floor().updateTransferTicket(ticket.id, {
      details: [{ ...ticket.details[0], qty: 150 }],
      stationKey: '覆膜機',
      actor: '許文傑',
    });
    expect(edit.ok).toBe(true);
    expect(ticketById(ticket.id).target_station_key).toBe('品檢站');

    floor().voidTransfer(ticket.id, { reason: '數量填錯', by: '許文傑' });
    const reopened = floor().reopenTransferTicket(ticket.id, {
      details: [{ ...ticket.details[0], qty: 150 }],
      stationKey: '覆膜機',
      onsite: false,
      actor: '許文傑',
    });
    expect(reopened.ok).toBe(true);
    expect(reopened.ticket.target_station_key).toBe('品檢站');
  });

  it('尚未交付產線的任務：歷程記在工單端那一本，交付時隨任務帶到現場', () => {
    floor().syncTaskDestination('pt-0901-1', {
      fromKey: '海德堡 SM102 四色機',
      toKey: 'POLAR 137 裁切機',
      actor: '周建宏',
    });
    const woTask = useWorkOrdersStore
      .getState()
      .workOrders.find((o) => o.work_order_no === 'WO-2026-0901')
      .tasks.find((t) => t.id === 'pt-0901-1');
    expect(woTask.history.at(-1).event).toContain(
      '目的站點由 海報印刷｜海德堡 SM102 四色機 改為 裁切｜POLAR 137 裁切機',
    );
  });

  it('轉交單不再帶單別與原轉交單連結', () => {
    const { created } = floor().createTransferTickets({
      picks: [{ task_id: 'pt-0820-9', qty: 100 }],
      actor: '許文傑',
    });
    expect(created[0]).not.toHaveProperty('ticket_kind');
    expect(created[0]).not.toHaveProperty('original_ticket_id');
    floor().transferTickets.forEach((t) => {
      expect(t).not.toHaveProperty('ticket_kind');
      expect(t).not.toHaveProperty('original_ticket_id');
    });
    expect(floor().createReturnTicket).toBeUndefined();
  });
});

describe('10.23 已作廢或報廢的任務不可改目的站點，已完成仍可改', () => {
  const workOrder = () =>
    useWorkOrdersStore.getState().workOrders.find((o) => o.work_order_no === 'WO-2026-0820');
  const task = () => workOrder().tasks.find((t) => t.id === 'pt-0820-9');

  it('負責印務：已完成的任務可改；已作廢、報廢不可改', () => {
    expect(task().status).toBe('已完成');
    expect(canEditTaskDestination(workOrder(), task(), 'print_officer', '周建宏')).toBe(true);
    for (const status of ['已作廢', '報廢']) {
      expect(
        canEditTaskDestination(workOrder(), { ...task(), status }, 'print_officer', '周建宏'),
      ).toBe(false);
    }
  });

  it('編輯（代理）成員可改；檢視層級的分享成員與非負責印務不可改', () => {
    const shared = {
      ...workOrder(),
      shared_members: [
        { name: '蔡明修', level: 'edit' },
        { name: '林佩君', level: 'view' },
      ],
    };
    expect(canEditTaskDestination(shared, task(), 'print_officer', '蔡明修')).toBe(true);
    expect(canEditTaskDestination(shared, task(), 'print_officer', '林佩君')).toBe(false);
    expect(canEditTaskDestination(workOrder(), task(), 'print_officer', '蔡明修')).toBe(false);
  });

  it('印務主管：製程核可後可改（不必重審），核可前三態不可改', () => {
    expect(canEditTaskDestination(workOrder(), task(), 'print_manager', '吳國豪')).toBe(true);
    for (const status of ['製程審核完成', '工單已交付', '製作中', '異動']) {
      expect(
        canEditTaskDestination({ ...workOrder(), status }, task(), 'print_manager', '吳國豪'),
      ).toBe(true);
    }
    for (const status of ['草稿', '製程確認中', '重新確認製程']) {
      expect(
        canEditTaskDestination({ ...workOrder(), status }, task(), 'print_manager', '吳國豪'),
      ).toBe(false);
    }
    expect(
      canEditTaskDestination(workOrder(), { ...task(), status: '報廢' }, 'print_manager', '吳國豪'),
    ).toBe(false);
  });

  it('生管與主管不改目的站點（發現設錯時在系統外通知印務）', () => {
    expect(canEditTaskDestination(workOrder(), task(), 'production_planner', '許文傑')).toBe(false);
    expect(canEditTaskDestination(workOrder(), task(), 'supervisor', '王大明')).toBe(false);
  });
});

describe('10.24 下游到料量不比對站點，只增不減；入庫成品判定仍只看品檢站', () => {
  // 合成資料：前置「印刷」需轉交、目的站點裁切機；下游「裁切」在 POLAR 137 裁切機
  const upstream = {
    id: 'pt-test-up',
    work_order_no: 'WO-TEST',
    name: '印刷',
    status: '已完成',
    needs_transfer: true,
    downstream_station_key: 'POLAR 137 裁切機',
    good_qty: 1000,
  };
  const downstream = {
    id: 'pt-test-down',
    work_order_no: 'WO-TEST',
    name: '裁切',
    status: '待處理',
    planned_equipment: 'POLAR 137 裁切機',
    depends_on: ['pt-test-up'],
    bom_unit_usage: 1,
  };
  const ticket = (id, status, stationKey, qty) => ({
    id,
    status,
    target_station_key: stationKey,
    details: [{ task_id: 'pt-test-up', qty }],
  });

  it('送錯站（或改站前在舊站）點收的量照樣計入下游到料量', () => {
    const tickets = [
      ticket('t1', '已點收', 'POLAR 137 裁切機', 300),
      ticket('t2', '已點收', '覆膜機', 200),
    ];
    expect(calcArrivedQty('pt-test-up', tickets)).toBe(500);
    const result = resolvePrecedence(downstream, [upstream, downstream], tickets);
    expect(result.blocking).toHaveLength(0);
    expect(result.workableQty).toBe(500);
  });

  it('只有送錯站那一張已點收時，下游照樣放行', () => {
    const tickets = [ticket('t2', '已點收', '覆膜機', 200)];
    const result = resolvePrecedence(downstream, [upstream, downstream], tickets);
    expect(result.blocking).toHaveLength(0);
    expect(result.workableQty).toBe(200);
  });

  it('未點收（已送達、搬運中、已作廢）的單不計入', () => {
    const tickets = [
      ticket('t1', '已送達', 'POLAR 137 裁切機', 300),
      ticket('t2', '搬運中', 'POLAR 137 裁切機', 200),
      ticket('t3', '已作廢', 'POLAR 137 裁切機', 100),
    ];
    expect(calcArrivedQty('pt-test-up', tickets)).toBe(0);
    expect(resolvePrecedence(downstream, [upstream, downstream], tickets).blocking).toHaveLength(1);
  });

  it('外發前置同一套：不比對下游的計畫設備', () => {
    const task = {
      ...downstream,
      depends_on: [],
      depends_on_external: [{ task_id: 'pt-test-up', work_order_no: 'WO-TEST', name: '外發燙金' }],
    };
    // 下游在 POLAR 137 裁切機，貨點收在精裝線：舊口徑會永遠不放行
    const tickets = [ticket('t1', '已點收', '精裝線', 400)];
    const result = resolvePrecedence(task, [task], tickets);
    expect(result.blocking).toHaveLength(0);
    expect(result.workableQty).toBe(400);
  });

  it('入庫成品判定仍比對站點：只有進了品檢站的量才算', () => {
    const qcRecords = [{ print_item_no: 'PI-TEST', passed_qty: 100, failed_qty: 0 }];
    const facts = (tickets) => ({ transferTickets: tickets, floorTasks: [], qcRecords, printItemNo: 'PI-TEST' });
    const task = { id: 'pt-test-up' };
    expect(calcReceivedQtyAt('pt-test-up', '品檢站', [ticket('t1', '已點收', '覆膜機', 300)])).toBe(0);
    expect(hasStockedOutput(task, facts([ticket('t1', '已點收', '覆膜機', 300)]))).toBe(false);
    expect(hasStockedOutput(task, facts([ticket('t1', '已點收', '品檢站', 300)]))).toBe(true);
  });
});
