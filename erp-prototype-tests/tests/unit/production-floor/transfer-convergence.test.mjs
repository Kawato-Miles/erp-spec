import { beforeEach, describe, expect, it } from 'vitest';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import {
  calcArrivedQty,
  calcDetailReceivedQty,
  calcMovableQty,
  canVoidTransfer,
  lineTagOfStationKey,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.51～10.55、10.58：點收單一動作、點收紀錄作廢與退回已送達、點收前作廢、
// 批次建單任一超額全擋、搬運數量修改更正、以站點為目的地的轉交單。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence production-execution delta
// § 場內轉交、§ 點收紀錄的修改與作廢、§ 生管批次建轉交單、§ 轉交單改單與更正 的 THEN；
// 情境卡 場內轉交與更正、生產數量錯誤的逐層更正。
//
// 資料層契約（新契約等 tasks 5.1～5.6 實作）：
//   轉交單單頭 destination_line（目的產線）、明細 destination_station_key（目的站點）
//   transfer-rules.lineTagOfStationKey(stationKey) → 站點所屬的產線（站點清單假資料見 MOCK-DATA-CHAIN）
//   store.createTransferTickets({ picks, actor, plannedDate, note, assignedMover })
//     → { created, rejected, error? }；依目的產線分組成單、明細各記站點；預計轉交日必填；
//     任一張超額即全部擋下（created 為空、rejected 指出超額的明細與當下可搬量）
//   store.updateTransferTicket(ticketId, { details, plannedDate, note, actor })  待搬運改單、先還回本單原佔用
//   store.editTransferQty(ticketId, { taskId, qty, reason, by })  開始搬運之後的搬運數量修改
//   store.receiveTransfer(ticketId, { by, quantities, remarks? })  點收單一動作
//   store.voidTransferReceipt(ticketId, { taskId, receiptId, reason, by })  點收紀錄作廢
//   store.voidTransfer(ticketId, { reason, by })  點收前的單都可作廢、原因為文字

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  workReports: useProductionFloorStore.getState().workReports,
  transferTickets: useProductionFloorStore.getState().transferTickets,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
});

const floor = () => useProductionFloorStore.getState();
const ticketById = (id) => floor().transferTickets.find((t) => t.id === id);
const taskById = (id) => floor().tasks.find((t) => t.id === id);

// 合成資料：一批已報出良品、目的站點各異的生產任務（不掛工單）
const sourceTask = (id, name, station, good) => ({
  id,
  name,
  work_order_no: 'WO-TEST',
  print_item_no: 'PI-TEST',
  print_item_name: '合成印件',
  status: '製作中',
  needs_transfer: true,
  delivered_at: '2026-10-01 09:00',
  target_qty: 1000,
  input_qty: good,
  good_qty: good,
  produced_qty: good,
  downstream_station_key: station,
  downstream_station: station,
  depends_on: [],
  history: [],
  package_id: null,
});
const receipt = (id, qty, by = '陳金水', status = '有效') => ({
  id,
  qty,
  remark: '',
  received_by: by,
  received_at: '2026-10-05 10:00',
  status,
  voided_by: null,
  voided_at: null,
  void_reason: null,
});
const seed = ({ tasks = [], tickets = [], reports = [] }) => {
  useProductionFloorStore.setState({ tasks, transferTickets: tickets, workReports: reports });
  useWorkOrdersStore.setState({ workOrders: [] });
};

describe('10.58 轉交以站點為目的地：一張單一條目的產線、明細各記站點，一趟送多站回報一次抵達', () => {
  it('站點各屬一條產線（假資料）：數位站與雷切站屬壓克力產線、裁切站屬手工產線、品檢站屬品檢線', () => {
    expect(lineTagOfStationKey('數位站')).toBe('壓克力產線');
    expect(lineTagOfStationKey('雷切站')).toBe('壓克力產線');
    expect(lineTagOfStationKey('裁切站')).toBe('手工產線');
    expect(lineTagOfStationKey('品檢站')).toBe('品檢線');
  });

  it('壓克力產線的數位站與雷切站兩筆一次建單：一張單、單頭目的產線壓克力產線、兩條明細各記站點', () => {
    seed({
      tasks: [
        sourceTask('pt-test-a', '壓克力切割', '數位站', 300),
        sourceTask('pt-test-b', '壓克力印刷', '雷切站', 200),
      ],
    });
    const { created, rejected } = floor().createTransferTickets({
      picks: [
        { task_id: 'pt-test-a', qty: 300 },
        { task_id: 'pt-test-b', qty: 200 },
      ],
      actor: '許文傑',
      plannedDate: '2026-10-07',
      assignedMover: '簡俊男',
    });
    expect(rejected).toEqual([]);
    expect(created).toHaveLength(1);
    expect(created[0].destination_line).toBe('壓克力產線');
    expect(created[0].details.map((d) => d.destination_station_key).sort()).toEqual(['數位站', '雷切站'].sort());
  });

  it('開始搬運後一次回報抵達、兩條各附一張簽收照片：轉已送達並寫入實際轉交日', () => {
    seed({
      tasks: [
        sourceTask('pt-test-a', '壓克力切割', '數位站', 300),
        sourceTask('pt-test-b', '壓克力印刷', '雷切站', 200),
      ],
    });
    const { created } = floor().createTransferTickets({
      picks: [
        { task_id: 'pt-test-a', qty: 300 },
        { task_id: 'pt-test-b', qty: 200 },
      ],
      actor: '許文傑',
      plannedDate: '2026-10-07',
      assignedMover: '簡俊男',
    });
    const id = created[0].id;
    expect(floor().startTransfer(id, { by: '簡俊男' }).ok).toBe(true);
    const arrived = floor().deliverTransfer(id, {
      by: '簡俊男',
      photosByTask: { 'pt-test-a': ['數位站照.jpg'], 'pt-test-b': ['雷切站照.jpg'] },
    });
    expect(arrived.ok).toBe(true);
    expect(ticketById(id).status).toBe('已送達');
    expect(ticketById(id).actual_date).toBeTruthy();
  });

  it('預計轉交日沒填或搬運數量填 0 時擋下建單，不建立任何轉交單', () => {
    seed({ tasks: [sourceTask('pt-test-a', '壓克力切割', '數位站', 300)] });
    const noDate = floor().createTransferTickets({
      picks: [{ task_id: 'pt-test-a', qty: 300 }],
      actor: '許文傑',
      assignedMover: '簡俊男',
    });
    expect(noDate.created).toHaveLength(0);
    expect(noDate.error).toContain('預計轉交日');
    const zero = floor().createTransferTickets({
      picks: [{ task_id: 'pt-test-a', qty: 0 }],
      actor: '許文傑',
      plannedDate: '2026-10-07',
      assignedMover: '簡俊男',
    });
    expect(zero.created).toHaveLength(0);
    expect(floor().transferTickets).toHaveLength(0);
  });
});

describe('10.54 一次勾多筆建單任一張超額即全部擋下', () => {
  const tasks = () => [
    sourceTask('pt-test-cut1', '裁切甲', '裁切站', 300),
    sourceTask('pt-test-cut2', '裁切乙', '裁切站', 100),
    sourceTask('pt-test-foil', '燙金丙', '燙金站', 200),
    sourceTask('pt-test-qc', '裝訂丁', '品檢站', 500),
  ];

  it('四筆都沒超額：手工產線一張（三條明細各記裁切站或燙金站）、品檢線一張', () => {
    seed({ tasks: tasks() });
    const { created } = floor().createTransferTickets({
      picks: [
        { task_id: 'pt-test-cut1', qty: 300 },
        { task_id: 'pt-test-cut2', qty: 100 },
        { task_id: 'pt-test-foil', qty: 200 },
        { task_id: 'pt-test-qc', qty: 500 },
      ],
      actor: '許文傑',
      plannedDate: '2026-10-07',
      assignedMover: '簡俊男',
    });
    expect(created).toHaveLength(2);
    const handmade = created.find((t) => t.destination_line === '手工產線');
    const qc = created.find((t) => t.destination_line === '品檢線');
    expect(handmade.details).toHaveLength(3);
    expect(qc.details).toHaveLength(1);
  });

  it('手工產線其中一條超額：兩張都不建立，並指出超額的燙金丙與當下可搬量 200', () => {
    seed({ tasks: tasks() });
    const result = floor().createTransferTickets({
      picks: [
        { task_id: 'pt-test-cut1', qty: 300 },
        { task_id: 'pt-test-cut2', qty: 100 },
        { task_id: 'pt-test-foil', qty: 250 },
        { task_id: 'pt-test-qc', qty: 500 },
      ],
      actor: '許文傑',
      plannedDate: '2026-10-07',
      assignedMover: '簡俊男',
    });
    expect(result.created).toHaveLength(0);
    expect(floor().transferTickets).toHaveLength(0);
    const listed = JSON.stringify(result.rejected) + (result.error ?? '');
    expect(listed).toContain('燙金丙');
    expect(listed).toContain('200');
  });
});

describe('10.55 搬運數量修改更正：待搬運先還回本單原佔用；開始搬運後經修改、原因必填、大於 0 且不得低於點收數量', () => {
  const pendingTicket = (id, qty, status = '待搬運', receipts = []) => ({
    id,
    ticket_no: id.toUpperCase(),
    status,
    destination_line: '手工產線',
    assigned_mover: '簡俊男',
    planned_date: '2026-10-07',
    note: '',
    details: [
      {
        task_id: 'pt-test-src',
        task_name: '合成印刷',
        destination_station_key: '裁切站',
        qty,
        sign_photos: status === '待搬運' || status === '搬運中' ? [] : ['照.jpg'],
        receipts,
      },
    ],
    history: [],
  });

  it('良品 500、本單 200、另一張 100，可搬量 200：本單改 400 成立（還回 200 後額度 400）、改 450 擋下並顯示 400', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-mine', 200), pendingTicket('tt-test-other', 100)],
    });
    expect(calcMovableQty(taskById('pt-test-src'), floor().transferTickets)).toBe(200);
    const ok = floor().updateTransferTicket('tt-test-mine', {
      details: [{ task_id: 'pt-test-src', qty: 400 }],
      actor: '許文傑',
    });
    expect(ok.ok).toBe(true);
    const over = floor().updateTransferTicket('tt-test-mine', {
      details: [{ task_id: 'pt-test-src', qty: 450 }],
      actor: '許文傑',
    });
    expect(over.ok).toBe(false);
    expect(over.error).toContain('400');
  });

  it('待搬運改單與重開新單：搬運數量填 0 或清空擋下並指出那一條，不再當成移除明細；單與額度維持原狀', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-mine', 200)],
    });
    [0, null].forEach((blank) => {
      const edit = floor().updateTransferTicket('tt-test-mine', {
        details: [{ task_id: 'pt-test-src', qty: blank }],
        actor: '許文傑',
      });
      expect(edit.ok).toBe(false);
      expect(edit.error).toContain('搬運數量須大於 0');
      expect(ticketById('tt-test-mine').details[0].qty).toBe(200);
    });
    const reopen = floor().reopenTransferTicket('tt-test-mine', {
      details: [{ task_id: 'pt-test-src', qty: 0 }],
      actor: '許文傑',
    });
    expect(reopen.ok).toBe(false);
    expect(reopen.error).toContain('搬運數量須大於 0');
    expect(calcMovableQty(taskById('pt-test-src'), floor().transferTickets)).toBe(300);
  });

  it('待搬運可改預計轉交日與備註，改後維持待搬運', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-mine', 200)],
    });
    const result = floor().updateTransferTicket('tt-test-mine', {
      details: [{ task_id: 'pt-test-src', qty: 200 }],
      plannedDate: '2026-10-09',
      note: '先送裁切站門口',
      actor: '許文傑',
    });
    expect(result.ok).toBe(true);
    expect(ticketById('tt-test-mine')).toMatchObject({ status: '待搬運', planned_date: '2026-10-09', note: '先送裁切站門口' });
  });

  it('搬運中：改單被擋（明細鎖定），搬運數量 500 經修改改為 480 成立、單維持搬運中，歷程記改前改後', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-moving', 500, '搬運中')],
    });
    const locked = floor().updateTransferTicket('tt-test-moving', {
      details: [{ task_id: 'pt-test-src', qty: 480 }],
      actor: '許文傑',
    });
    expect(locked.ok).toBe(false);
    const edited = floor().editTransferQty('tt-test-moving', {
      taskId: 'pt-test-src',
      qty: 480,
      reason: '裝車時少一落',
      by: '許文傑',
    });
    expect(edited.ok).toBe(true);
    const ticket = ticketById('tt-test-moving');
    expect(ticket.status).toBe('搬運中');
    expect(ticket.details[0].qty).toBe(480);
    const last = ticket.history.at(-1);
    expect(last.event).toContain('500');
    expect(last.event).toContain('480');
    expect(last.event).toContain('裝車時少一落');
  });

  it('已點收、點收 480：改 470 擋下（不得低於點收數量 480）、改 0 擋下、沒填原因擋下、改 480 成立', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-recv', 500, '已點收', [receipt('tt-test-recv-r1', 480)])],
    });
    const edit = (qty, reason = '實際只搬了 480') =>
      floor().editTransferQty('tt-test-recv', { taskId: 'pt-test-src', qty, reason, by: '許文傑' });
    const below = edit(470);
    expect(below.ok).toBe(false);
    expect(below.error).toContain('480');
    expect(edit(0).ok).toBe(false);
    expect(edit(480, '').ok).toBe(false);
    expect(edit(480).ok).toBe(true);
    expect(ticketById('tt-test-recv').details[0].qty).toBe(480);
    expect(ticketById('tt-test-recv').status).toBe('已點收');
  });

  it('調升受轉交可申請上限管制：良品 500、本單 300 搬運中、另一張 200，本單改 350 擋下', () => {
    seed({
      tasks: [sourceTask('pt-test-src', '合成印刷', '裁切站', 500)],
      tickets: [pendingTicket('tt-test-moving', 300, '搬運中'), pendingTicket('tt-test-other', 200)],
    });
    const result = floor().editTransferQty('tt-test-moving', {
      taskId: 'pt-test-src',
      qty: 350,
      reason: '多搬了一落',
      by: '許文傑',
    });
    expect(result.ok).toBe(false);
    expect(ticketById('tt-test-moving').details[0].qty).toBe(300);
  });
});

describe('10.51 點收單一動作：每次新增一筆，第一筆轉已點收，之後只新增紀錄、狀態不變', () => {
  it('已送達的兩條明細第一次點收轉已點收；之後對其中一條再點收一筆，紀錄變兩筆、單頭維持已點收', () => {
    // 鏈外 TT-20260827-002（tt-016，已送達）：內卡四色印刷 200、信封四色印刷 300
    expect(floor().receiveTransfer('tt-016', { by: '許文傑', quantities: { 'pt-0812-6': 200, 'pt-0812-4': 280 } }).ok).toBe(true);
    expect(ticketById('tt-016').status).toBe('已點收');
    expect(floor().receiveTransfer('tt-016', { by: '李榮發', quantities: { 'pt-0812-4': 20 } }).ok).toBe(true);
    const ticket = ticketById('tt-016');
    expect(ticket.status).toBe('已點收');
    const envelope = ticket.details.find((d) => d.task_id === 'pt-0812-4');
    const card = ticket.details.find((d) => d.task_id === 'pt-0812-6');
    expect(envelope.receipts.map((r) => [r.qty, r.received_by])).toEqual([
      [280, '許文傑'],
      [20, '李榮發'],
    ]);
    expect(card.receipts).toHaveLength(1);
    expect(calcDetailReceivedQty(envelope)).toBe(300);
  });

  it('點收量須大於 0：再點收填 0 擋下、不新增紀錄', () => {
    const result = floor().receiveTransfer('tt-015', { by: '許文傑', quantities: { 'pt-0812-2': 0 } });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('點收量須大於 0');
    expect(ticketById('tt-015').details[0].receipts).toHaveLength(1);
  });
});

describe('10.52 點收紀錄作廢；全部作廢退回已送達，可重新點收或作廢整張單', () => {
  // wiki 生產數量錯誤的逐層更正 副流程第 2 步分支：陳金水把 TT-20260901-002 的貨誤點收到 TT-20260901-003
  const seedMisReceived = () =>
    seed({
      tasks: [
        sourceTask('pt-test-x', '軋盒來料甲', '後加工站', 300),
        sourceTask('pt-test-y', '軋盒來料乙', '後加工站', 200),
      ],
      tickets: [
        {
          id: 'tt-test-002',
          ticket_no: 'TT-20260901-002',
          status: '已送達',
          destination_line: '裝訂產線',
          assigned_mover: '簡俊男',
          details: [
            { task_id: 'pt-test-x', task_name: '軋盒來料甲', destination_station_key: '後加工站', qty: 300, sign_photos: ['照.jpg'], receipts: [] },
          ],
          history: [],
        },
        {
          id: 'tt-test-003',
          ticket_no: 'TT-20260901-003',
          status: '已點收',
          destination_line: '裝訂產線',
          assigned_mover: '簡俊男',
          details: [
            {
              task_id: 'pt-test-y',
              task_name: '軋盒來料乙',
              destination_station_key: '後加工站',
              qty: 200,
              sign_photos: ['照.jpg'],
              receipts: [receipt('tt-test-003-r1', 300)],
            },
          ],
          history: [],
        },
      ],
    });

  it('作廢 TT-20260901-003 唯一一筆點收紀錄：仍看得到並列為已作廢、不計入點收數量，單頭自動退回已送達', () => {
    seedMisReceived();
    const result = floor().voidTransferReceipt('tt-test-003', {
      taskId: 'pt-test-y',
      receiptId: 'tt-test-003-r1',
      reason: '點錯單，貨屬 TT-20260901-002',
      by: '陳金水',
    });
    expect(result.ok).toBe(true);
    const ticket = ticketById('tt-test-003');
    expect(ticket.details[0].receipts).toHaveLength(1);
    expect(ticket.details[0].receipts[0]).toMatchObject({
      status: '已作廢',
      voided_by: '陳金水',
      void_reason: '點錯單，貨屬 TT-20260901-002',
    });
    expect(ticket.details[0].receipts[0].voided_at).toBeTruthy();
    expect(calcDetailReceivedQty(ticket.details[0])).toBe(0);
    expect(ticket.status).toBe('已送達');
    expect(calcArrivedQty('pt-test-y', floor().transferTickets)).toBe(0);
    const last = ticket.history.at(-1);
    expect(last.event).toContain('作廢');
    expect(last.actor).toBe('陳金水');
  });

  it('作廢原因必填', () => {
    seedMisReceived();
    const result = floor().voidTransferReceipt('tt-test-003', {
      taskId: 'pt-test-y',
      receiptId: 'tt-test-003-r1',
      reason: '',
      by: '陳金水',
    });
    expect(result.ok).toBe(false);
    expect(ticketById('tt-test-003').status).toBe('已點收');
  });

  it('再到 TT-20260901-002 點收實際收到的量：新增一筆點收紀錄', () => {
    seedMisReceived();
    floor().voidTransferReceipt('tt-test-003', {
      taskId: 'pt-test-y',
      receiptId: 'tt-test-003-r1',
      reason: '點錯單',
      by: '陳金水',
    });
    expect(floor().receiveTransfer('tt-test-002', { by: '陳金水', quantities: { 'pt-test-x': 300 } }).ok).toBe(true);
    expect(ticketById('tt-test-002').details[0].receipts).toHaveLength(1);
    expect(ticketById('tt-test-002').status).toBe('已點收');
  });

  it('退回已送達的 TT-20260901-003 可重新點收，也可由生管以文字原因作廢，作廢後搬運數量退回來源任務', () => {
    seedMisReceived();
    floor().voidTransferReceipt('tt-test-003', {
      taskId: 'pt-test-y',
      receiptId: 'tt-test-003-r1',
      reason: '點錯單',
      by: '陳金水',
    });
    expect(canVoidTransfer(ticketById('tt-test-003'), floor().tasks)).toBe(true);
    expect(calcMovableQty(taskById('pt-test-y'), floor().transferTickets)).toBe(0);
    const voided = floor().voidTransfer('tt-test-003', { reason: '這趟其實沒搬', by: '許文傑' });
    expect(voided.ok).toBe(true);
    expect(ticketById('tt-test-003').status).toBe('已作廢');
    expect(calcMovableQty(taskById('pt-test-y'), floor().transferTickets)).toBe(200);
  });

  it('部分作廢不改單頭狀態：鏈一 TT-20260615-001 已有一筆作廢紀錄，單頭仍為已點收', () => {
    const ticket = floor().transferTickets.find((t) => t.ticket_no === 'TT-20260615-001');
    expect(ticket.status).toBe('已點收');
    expect(ticket.details[0].receipts.filter((r) => r.status === '已作廢')).toHaveLength(1);
  });
});

describe('10.53 點收前（待搬運、搬運中、已送達）可作廢、原因為文字；已點收不可作廢', () => {
  it('三種點收前狀態都渲染作廢；已點收、已作廢不渲染', () => {
    const base = floor().transferTickets.find((t) => t.ticket_no === 'TT-20260830-003');
    const tasks = floor().tasks;
    for (const status of ['待搬運', '搬運中', '已送達']) {
      expect(canVoidTransfer({ ...base, status }, tasks), status).toBe(true);
    }
    for (const status of ['已點收', '已作廢']) {
      expect(canVoidTransfer({ ...base, status }, tasks), status).toBe(false);
    }
  });

  it('已送達的 TT-20260830-002（來源任務有效）以自由文字原因作廢成立，額度回到來源任務', () => {
    const result = floor().voidTransfer('tt-005', { reason: '點收前發現數量不對，依實況重建', by: '許文傑' });
    expect(result.ok).toBe(true);
    const ticket = floor().transferTickets.find((t) => t.id === 'tt-005');
    expect(ticket.status).toBe('已作廢');
    expect(ticket.void_reason).toBe('點收前發現數量不對，依實況重建');
  });

  it('作廢原因必填', () => {
    const result = floor().voidTransfer('tt-006', { reason: '', by: '許文傑' });
    expect(result.ok).toBe(false);
    expect(floor().transferTickets.find((t) => t.id === 'tt-006').status).toBe('搬運中');
  });
});
