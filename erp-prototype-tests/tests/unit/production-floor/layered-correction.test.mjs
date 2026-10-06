import { beforeEach, describe, expect, it } from 'vitest';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import {
  calcMovableQty,
  calcOccupiedQty,
  calcTransferReceivedQty,
  deriveTransferStatus,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.56「逐層更正主流程：五色印刷良品 500 改 480 的四層接力」、
// 10.57「逐層更正副流程：上游已完成或還在做、貨在途、整筆遺失、工單已完成」。
// 依據：wiki 生產數量錯誤的逐層更正 主流程第 0～4 步與副流程；
// 期望值取自 openspec change production-dispatch-report-transfer-convergence production-execution delta
// § 生產數量錯誤的逐層更正、§ 報工修改、作廢與留痕、§ 點收紀錄的修改與作廢、§ 轉交單改單與更正 的 THEN。
//
// 起點以鏈三 WO-2026-0815 推到 wiki 例子的處境（MOCK-DATA-CHAIN § 逐層更正與點收紀錄作廢的情境樣本：
// 鏈三的 mock 起點不動，本檔在前置把報工與 TT-20260901-001 寫進記憶體）：
//   五色印刷（pt-0815-2）報工 500／500／0；TT-20260901-001 搬運數量 500、目的產線裝訂產線、
//   目的站點後加工站、點收 500；軋盒成型（pt-0815-3）陳金水報工 500／500／0。
// 修改原因一律自由填寫，測試不驗固定字樣。
// 資料層契約：store.editWorkReport、store.editTransferReceipt、store.editTransferQty（新，見
// transfer-convergence.test.mjs 檔頭）、store.voidTransfer、store.receiveTransfer。

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  workReports: useProductionFloorStore.getState().workReports,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workPackages: useProductionFloorStore.getState().workPackages,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;

const floor = () => useProductionFloorStore.getState();
const taskById = (id) => floor().tasks.find((t) => t.id === id);
const reportById = (id) => floor().workReports.find((r) => r.id === id);
const ticket001 = () => floor().transferTickets.find((t) => t.ticket_no === 'TT-20260901-001');
const PRINT = 'pt-0815-2';
const BOX = 'pt-0815-3';

const report = (id, taskId, qty, reporter) => ({
  id,
  task_id: taskId,
  input_qty: qty,
  good_qty: qty,
  defect_qty: 0,
  defect_reason: null,
  photos: ['現場照.jpg'],
  channel: '師傅自助',
  reporter,
  reported_at: '2026-09-01 10:00',
  status: '有效',
  void_reason: null,
  voided_by: null,
  voided_at: null,
  edit_logs: [],
});

// 前置：把鏈三推到 wiki 例子的處境。printStatus＝五色印刷第 4 步之前的狀態（已完成或製作中）
const seedExample = ({ printStatus = '製作中', printTarget = 1000 } = {}) => {
  useProductionFloorStore.setState({
    ...floorInitial,
    tasks: floorInitial.tasks.map((t) => {
      if (t.id === PRINT) {
        return { ...t, status: printStatus, target_qty: printTarget, input_qty: 500, good_qty: 500, produced_qty: 500 };
      }
      if (t.id === BOX) return { ...t, status: '製作中', input_qty: 500, good_qty: 500, produced_qty: 500 };
      return t;
    }),
    workReports: [
      ...floorInitial.workReports,
      report('wr-test-print', PRINT, 500, '劉阿海'),
      report('wr-test-box', BOX, 500, '陳金水'),
    ],
    transferTickets: [
      ...floorInitial.transferTickets,
      {
        id: 'tt-test-0901-1',
        ticket_no: 'TT-20260901-001',
        status: '已點收',
        destination_line: '裝訂產線',
        assigned_mover: '簡俊男',
        planned_date: '2026-09-01',
        created_by: '許文傑',
        created_at: '2026-09-01 11:00',
        details: [
          {
            task_id: PRINT,
            task_name: '五色印刷',
            work_order_no: 'WO-2026-0815',
            destination_station_key: '後加工站',
            qty: 500,
            sign_photos: ['簽收照-0901.jpg'],
            receipts: [
              {
                id: 'tt-test-0901-1-r1',
                qty: 500,
                remark: '',
                received_by: '陳金水',
                received_at: '2026-09-01 14:00',
                status: '有效',
                voided_by: null,
                voided_at: null,
                void_reason: null,
              },
            ],
          },
        ],
        history: [],
      },
    ],
  });
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
};

const editPrint = (by = '周建宏') =>
  floor().editWorkReport('wr-test-print', { good_qty: 480, defect_qty: 20, reason: '現場清點只有 480', by });
const editBox = () =>
  floor().editWorkReport('wr-test-box', { input_qty: 480, good_qty: 480, reason: '現場清點只做了 480', by: '陳金水' });
const editReceipt = () =>
  floor().editTransferReceipt('tt-test-0901-1', {
    taskId: PRINT,
    receiptId: 'tt-test-0901-1-r1',
    qty: 480,
    reason: '重點只有 480',
    by: '周建宏',
  });
const editMoveQty = () =>
  floor().editTransferQty('tt-test-0901-1', { taskId: PRINT, qty: 480, reason: '實際只搬了 480', by: '周建宏' });

describe('10.56 逐層更正主流程：五色印刷良品 500 改 480 的四層接力', () => {
  beforeEach(() => seedExample());

  it('第 0 步：印務直接改上游報工被擋下，指出卡在 TT-20260901-001 的點收 500；數字不改，也不自動改點收與下游報工', () => {
    const result = editPrint();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('TT-20260901-001');
    expect(result.error).toContain('500');
    expect(reportById('wr-test-print').good_qty).toBe(500);
    expect(ticket001().details[0].receipts[0].qty).toBe(500);
    expect(reportById('wr-test-box').input_qty).toBe(500);
  });

  it('第 2 步提前做會被擋：軋盒成型還沒改回 480 時改點收量，指出軋盒成型已報工 500', () => {
    const result = editReceipt();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('軋盒成型');
    expect(result.error).toContain('500');
    expect(ticket001().details[0].receipts[0].qty).toBe(500);
  });

  it('四層依序：下游報工 → 點收量 → 搬運數量 → 上游報工，每層成立、各記一筆修改紀錄', () => {
    // 第 1 步：陳金水改軋盒成型 500 → 480
    const step1 = editBox();
    expect(step1.ok).toBe(true);
    const boxLogs = reportById('wr-test-box').edit_logs;
    expect(boxLogs.map((l) => l.field).sort()).toEqual(['生產數量', '良品數'].sort());
    boxLogs.forEach((l) => expect(l).toMatchObject({ before: 500, after: 480, edited_by: '陳金水' }));

    // 第 2 步：周建宏改 TT-20260901-001 點收量 500 → 480，單維持已點收
    const step2 = editReceipt();
    expect(step2.ok).toBe(true);
    expect(ticket001().status).toBe('已點收');
    expect(calcTransferReceivedQty(PRINT, floor().transferTickets)).toBe(480);

    // 第 3 步：周建宏（代行生管）改搬運數量 500 → 480，記一筆搬運數量修改
    const step3 = editMoveQty();
    expect(step3.ok).toBe(true);
    expect(calcOccupiedQty(PRINT, floor().transferTickets)).toBe(480);
    const moveLog = ticket001().history.at(-1);
    expect(moveLog.event).toContain('500');
    expect(moveLog.event).toContain('480');
    expect(moveLog.actor).toBe('周建宏');

    // 第 4 步：周建宏改五色印刷良品 500 → 480、不良品 0 → 20，生產數量維持 500
    const step4 = editPrint();
    expect(step4.ok).toBe(true);
    const print = taskById(PRINT);
    expect(print.good_qty).toBe(480);
    expect(print.input_qty).toBe(500);
    expect(calcOccupiedQty(PRINT, floor().transferTickets)).toBe(480);
    expect(calcTransferReceivedQty(PRINT, floor().transferTickets)).toBe(480);
    expect(calcMovableQty(print, floor().transferTickets)).toBe(0);
    expect(reportById('wr-test-print').edit_logs.map((l) => l.field).sort()).toEqual(['不良品數', '良品數'].sort());
  });
});

describe('10.57 逐層更正副流程', () => {
  const runFourSteps = () => {
    expect(editBox().ok).toBe(true);
    expect(editReceipt().ok).toBe(true);
    expect(editMoveQty().ok).toBe(true);
    expect(editPrint().ok).toBe(true);
  };

  it('上游已完成：第 4 步成立後良品數、轉交量、轉交點收量皆 480，轉交狀態已轉交', () => {
    seedExample({ printStatus: '已完成', printTarget: 500 });
    runFourSteps();
    expect(deriveTransferStatus(taskById(PRINT), floor().transferTickets)).toBe('已轉交');
  });

  it('上游還在做：第 4 步成立後落在轉交中、可搬量 0；之後再報 500、建第二張單 500 並點收 500、任務完成後三數皆 980、已轉交', () => {
    seedExample({ printStatus: '製作中', printTarget: 1000 });
    runFourSteps();
    expect(deriveTransferStatus(taskById(PRINT), floor().transferTickets)).toBe('轉交中');
    expect(calcMovableQty(taskById(PRINT), floor().transferTickets)).toBe(0);

    floor().submitWorkReport(PRINT, {
      input_qty: 500,
      good_qty: 500,
      defect_qty: 0,
      photos: ['第二批.jpg'],
      channel: '師傅自助',
      reporter: '劉阿海',
    });
    expect(taskById(PRINT).status).toBe('已完成');
    const { created } = floor().createTransferTickets({
      picks: [{ task_id: PRINT, qty: 500 }],
      actor: '許文傑',
      plannedDate: '2026-09-03',
      assignedMover: '簡俊男',
    });
    expect(created).toHaveLength(1);
    const id = created[0].id;
    floor().startTransfer(id, { by: '簡俊男' });
    floor().deliverTransfer(id, { by: '簡俊男', photosByTask: { [PRINT]: ['第二趟.jpg'] } });
    expect(floor().receiveTransfer(id, { by: '陳金水', quantities: { [PRINT]: 500 } }).ok).toBe(true);

    const print = taskById(PRINT);
    expect(print.good_qty).toBe(980);
    expect(calcOccupiedQty(PRINT, floor().transferTickets)).toBe(980);
    expect(calcTransferReceivedQty(PRINT, floor().transferTickets)).toBe(980);
    expect(deriveTransferStatus(print, floor().transferTickets)).toBe('已轉交');
  });

  it('卡住的是還沒點收的單（搬運中 500）：改上游報工被擋並指出那張單；先把搬運數量改為 480，上游報工的修改即成立', () => {
    seedExample();
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === BOX ? { ...t, status: '待處理', input_qty: 0, good_qty: 0, produced_qty: 0 } : t)),
      workReports: s.workReports.filter((r) => r.id !== 'wr-test-box'),
      transferTickets: s.transferTickets.map((t) =>
        t.id === 'tt-test-0901-1'
          ? { ...t, status: '搬運中', details: t.details.map((d) => ({ ...d, sign_photos: [], receipts: [] })) }
          : t,
      ),
    }));
    const blocked = editPrint();
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain('TT-20260901-001');
    expect(editMoveQty().ok).toBe(true);
    expect(ticket001().status).toBe('搬運中');
    expect(editPrint().ok).toBe(true);
    expect(taskById(PRINT).good_qty).toBe(480);
  });

  it('貨在途中全部遺失、還沒點收：生管點收前作廢整張單，上游報工把良品 500 全數移到不良品（生產數量不變）即成立', () => {
    seedExample();
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === BOX ? { ...t, status: '待處理', input_qty: 0, good_qty: 0, produced_qty: 0 } : t)),
      workReports: s.workReports.filter((r) => r.id !== 'wr-test-box'),
      transferTickets: s.transferTickets.map((t) =>
        t.id === 'tt-test-0901-1'
          ? { ...t, status: '搬運中', details: t.details.map((d) => ({ ...d, sign_photos: [], receipts: [] })) }
          : t,
      ),
    }));
    expect(floor().voidTransfer('tt-test-0901-1', { reason: '整車貨在路上不見了', by: '許文傑' }).ok).toBe(true);
    expect(ticket001().status).toBe('已作廢');
    // 只把良品改 0、不良品維持 0：良品數與不良品數同時為 0，擋下
    const bothZero = floor().editWorkReport('wr-test-print', { good_qty: 0, reason: '整車遺失', by: '周建宏' });
    expect(bothZero.ok).toBe(false);
    expect(bothZero.error).toContain('不可同時為 0');
    // 良品 500 → 0、不良品 0 → 500：成立，生產數量 500 不變
    const moved = floor().editWorkReport('wr-test-print', { good_qty: 0, defect_qty: 500, reason: '整車遺失', by: '周建宏' });
    expect(moved.ok).toBe(true);
    const r = reportById('wr-test-print');
    expect([r.input_qty, r.good_qty, r.defect_qty]).toEqual([500, 0, 500]);
    expect(r.edit_logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: '良品數', before: 500, after: 0 }),
        expect.objectContaining({ field: '不良品數', before: 0, after: 500 }),
      ]),
    );
  });

  it('所屬工單已完成後才發現：軋盒成型沒有被轉交或品檢佔用時，修改照常成立，不因工單已完成擋下', () => {
    seedExample();
    useWorkOrdersStore.setState({
      workOrders: workOrdersInitial.map((o) => (o.work_order_no === 'WO-2026-0815' ? { ...o, status: '已完成' } : o)),
    });
    expect(editBox().ok).toBe(true);
    expect(reportById('wr-test-box').input_qty).toBe(480);
  });
});
