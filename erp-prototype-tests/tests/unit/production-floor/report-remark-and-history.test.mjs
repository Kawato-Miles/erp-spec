import { beforeEach, describe, expect, it } from 'vitest';
import { resolveTaskHistory } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/history.js';
import {
  GOOD_DEFECT_BOTH_ZERO_ERROR,
  isGoodAndDefectBothZero,
  validateReportRow,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/report-rules.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.41～10.43：報工備註、良品與不良品同時為 0 擋下、生產任務歷程統合（Miles 2026-10-06 拍板）。
// 規則正本：wiki 報工紀錄（備註欄）、wiki 生產任務 § 歷程紀錄（事件範圍、每筆格式、同一份歷程）。
// 良品與不良品同時為 0 擋下尚未寫入 wiki（見情境目錄 10.42 說明）。
//
// 契約：
//   submitWorkReport(taskId, { input_qty, good_qty, defect_qty, photos, remark, channel, reporter })
//     → 報工紀錄帶 remark；任務歷程那一筆帶 remark、attachments（照片）、changes（三個累計與狀態）
//   editWorkReport(reportId, { remark, reason, by }) → 備註可單獨改，edit_logs 記「備註」
//   歷程事件 { at, actor, event, ref, ref_kind, note, remark, changes, attachments }
//   resolveTaskHistory(task, { workOrders, floorTasks }) → 工單端與現場兩份合併去重

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workReports: useProductionFloorStore.getState().workReports,
  workPackages: useProductionFloorStore.getState().workPackages,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
});

const floor = () => useProductionFloorStore.getState();
const taskById = (id) => floor().tasks.find((t) => t.id === id);
const reportById = (id) => floor().workReports.find((r) => r.id === id);
const historyOf = (id) =>
  resolveTaskHistory(taskById(id), {
    workOrders: useWorkOrdersStore.getState().workOrders,
    floorTasks: floor().tasks,
  });

describe('10.41 報工時填備註，修改報工時可改；歷程顯示備註與照片', () => {
  // 鏈二 WP-2026-0710-01 的海報四色印刷（pt-0710-2，製作中、已報 2,000、目標 3,090）
  it('師傅報工 500 並填備註：報工紀錄留備註，任務歷程那一筆帶備註、照片與三個累計的前後值', () => {
    const result = floor().submitWorkReport('pt-0710-2', {
      input_qty: 500,
      good_qty: 490,
      defect_qty: 10,
      defect_reason: '色差',
      photos: ['海報印刷-第二批.jpg'],
      remark: '換版後第二批，色偏已調回',
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(result.report.remark).toBe('換版後第二批，色偏已調回');
    const last = taskById('pt-0710-2').history.at(-1);
    expect(last.ref).toBe(result.report.id);
    expect(last.remark).toBe('換版後第二批，色偏已調回');
    expect(last.attachments).toEqual([{ name: '海報印刷-第二批.jpg', url: null }]);
    expect(last.changes).toContainEqual({ field: '生產數量', before: 2000, after: 2500 });
  });

  it('沒填備註時備註為空，不以空字串頂替', () => {
    const result = floor().submitWorkReport('pt-0710-2', {
      input_qty: 100,
      good_qty: 100,
      defect_qty: 0,
      photos: [],
      remark: '   ',
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(result.report.remark).toBeNull();
  });

  it('修改報工只改備註：修改紀錄記「備註」前後值，數字不動，任務歷程記一筆備註前後值', () => {
    const before = reportById('wr-0018');
    const result = floor().editWorkReport('wr-0018', {
      remark: '首件比對後才放量',
      reason: '補記',
      by: '周建宏',
    });
    expect(result.ok).toBe(true);
    const after = reportById('wr-0018');
    expect(after.remark).toBe('首件比對後才放量');
    expect(after.good_qty).toBe(before.good_qty);
    expect(after.edit_logs.at(-1)).toMatchObject({
      field: '備註',
      before: null,
      after: '首件比對後才放量',
      edited_by: '周建宏',
      reason: '補記',
    });
    const last = taskById('pt-0812-2').history.at(-1);
    expect(last.ref).toBe('wr-0018');
    expect(last.changes).toEqual([{ field: '備註', before: null, after: '首件比對後才放量' }]);
  });
});

describe('10.42 生產數量大於 0 時，良品數與不良品數不可同時為 0', () => {
  it('純函式：投入 300、良品 0、不良品 0 擋下；不良品 300 或良品 1 都放行', () => {
    expect(isGoodAndDefectBothZero({ input_qty: 300, good_qty: 0, defect_qty: 0 })).toBe(true);
    expect(validateReportRow({}, { input_qty: 300, good_qty: 0, defect_qty: 0 })).toContain(
      GOOD_DEFECT_BOTH_ZERO_ERROR,
    );
    expect(
      validateReportRow({}, { input_qty: 300, good_qty: 0, defect_qty: 300, defect_reason: '色差' }),
    ).toEqual([]);
    expect(validateReportRow({}, { input_qty: 300, good_qty: 1, defect_qty: 0 })).toEqual([]);
  });

  it('修改報工把良品與不良品都改成 0：擋下並提示，數字不動', () => {
    const result = floor().editWorkReport('wr-0018', {
      good_qty: 0,
      defect_qty: 0,
      reason: '誤報',
      by: '周建宏',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toBe(GOOD_DEFECT_BOTH_ZERO_ERROR);
    expect(reportById('wr-0018').good_qty).toBe(500);
    expect(reportById('wr-0018').defect_qty).toBe(15);
  });
});

describe('10.43 生產任務歷程統合報工、轉交、點收、交付與接收、手動完成與欄位變更', () => {
  it('既有 mock：證書四色印刷的歷程含報工照片、開始搬運、抵達站點附簽收照片，關聯轉交單號，新到舊排在最上的是抵達', () => {
    const history = historyOf('pt-0812-2');
    const report = history.find((e) => e.ref === 'wr-0018' && e.event.startsWith('報工：'));
    expect(report.attachments).toEqual([{ name: '證書印刷-完成照.jpg', url: null }]);
    const arrived = history.find((e) => e.event.startsWith('抵達'));
    expect(arrived).toMatchObject({ actor: '簡俊男', ref: 'TT-20260827-001', ref_kind: '轉交單' });
    expect(arrived.attachments.map((a) => a.name)).toEqual(['簽收照-TT015.jpg']);
    expect(history.some((e) => e.event.startsWith('開始搬運'))).toBe(true);
  });

  it('負責廠務回報抵達站點：來源任務歷程記一筆，附該條明細的簽收照片與轉交單號', () => {
    // 鏈二 TT-20260830-003（搬運中，負責廠務簡俊男，明細海報四色印刷 800）
    const ticket = floor().transferTickets.find((t) => t.ticket_no === 'TT-20260830-003');
    const result = floor().deliverTransfer(ticket.id, {
      by: '簡俊男',
      photosByTask: { 'pt-0710-2': ['簽收-海報.jpg'] },
    });
    expect(result.ok).toBe(true);
    const last = taskById('pt-0710-2').history.at(-1);
    expect(last.event).toContain('抵達');
    expect(last.actor).toBe('簡俊男');
    expect(last.ref).toBe('TT-20260830-003');
    expect(last.attachments).toEqual([{ name: '簽收-海報.jpg', url: null }]);
  });

  it('負責廠務回報開始搬運：來源任務歷程記一筆開始搬運，關聯轉交單號', () => {
    useProductionFloorStore.setState({
      transferTickets: [
        ...floorInitial.transferTickets,
        {
          id: 'tt-test-pending',
          ticket_no: 'TT-TEST-PENDING',
          status: '待搬運',
          assigned_mover: '邱志明',
          target_station_key: '手工產線',
          target_station: '手工產線',
          details: [{ task_id: 'pt-0710-2', task_name: '海報四色印刷', qty: 200 }],
          history: [],
        },
      ],
    });
    const result = floor().startTransfer('tt-test-pending', { by: '邱志明' });
    expect(result.ok).toBe(true);
    const last = taskById('pt-0710-2').history.at(-1);
    expect(last).toMatchObject({ actor: '邱志明', ref: 'TT-TEST-PENDING', ref_kind: '轉交單' });
    expect(last.event).toContain('開始搬運 200');
  });

  it('接收工作：歷程記一筆，交付狀態前後值已交付 → 已接收', () => {
    floor().confirmTaskReceipt(['pt-0815-2'], '許文傑');
    const last = taskById('pt-0815-2').history.at(-1);
    expect(last).toMatchObject({ actor: '許文傑', event: '接收工作' });
    expect(last.changes).toEqual([{ field: '交付狀態', before: '已交付', after: '已接收' }]);
  });

  it('手動完成：歷程那一筆帶生產任務狀態前後值製作中 → 已完成', () => {
    const result = floor().manuallyCompleteTask('pt-0710-2', { by: '許文傑' });
    expect(result.ok).toBe(true);
    const last = taskById('pt-0710-2').history.at(-1);
    expect(last.changes).toEqual([{ field: '生產任務狀態', before: '製作中', after: '已完成' }]);
  });

  it('同一份歷程：工單端改產線的事件與現場那一份的報工，合併後兩者都在、不重複', () => {
    const order = useWorkOrdersStore
      .getState()
      .workOrders.find((o) => o.work_order_no === 'WO-2026-0710');
    useWorkOrdersStore
      .getState()
      .updateTaskProductionLine(order.id, 'pt-0710-2', '手工產線', { by: '吳國豪' });
    const history = historyOf('pt-0710-2');
    const lineChange = history.filter((e) => e.event === '產線變更');
    expect(lineChange).toHaveLength(1);
    expect(lineChange[0].changes[0]).toMatchObject({ field: '產線', after: '手工產線' });
    // 交付時複製到現場的那幾筆不重複出現
    const keys = history.map((e) => [e.at, e.actor, e.event, e.ref].join('|'));
    expect(new Set(keys).size).toBe(keys.length);
    expect(history.some((e) => e.ref_kind === '報工紀錄')).toBe(true);
  });
});
