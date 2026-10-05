import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import * as transferRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.17（純函式段）、10.26～10.31、10.38：轉交單逐條上傳簽收照片、逐條點收、
// 再次點收、點收修改、到料量取轉交點收量、已送達不可作廢、作廢重開重走搬運。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt
// production-execution delta § 場內轉交、§ 轉交單改單與更正、§ 生產任務與轉交單歷程紀錄 的 THEN。
//
// 2026-10-06 第三輪拍板：明細欄名改「搬運數量」「點收數量」；點收數量不擋超過搬運數量（推翻第二輪）；
// 開始搬運與抵達站點的回報者即負責廠務（單上不設廠內執行者與確認操作人）；
// 點收佇列的「修改」為整張單一個對話框（store.editTicketReceipts）。
// 資料層契約：
//   store.deliverTransfer(ticketId, { by, photosByTask: { [task_id]: string[] } })
//     任一條明細沒有照片即整筆擋下，錯誤訊息列出缺照明細（任務名稱與搬運數量）；成立時照片寫入該條明細 sign_photos
//   store.receiveTransfer(ticketId, { by, proxy, quantities: { [task_id]: number } })
//     未給的明細預設帶搬運數量；每條明細 receipts 追加一筆 { qty, received_by, received_at, proxy_received }
//   store.receiveTransferAgain(ticketId, { taskId, qty, by, proxy })
//   store.editTransferReceipt(ticketId, { taskId, receiptId, qty, reason, by })
//   store.editTicketReceipts(ticketId, { quantities: { [task_id]: 改後點收數量 }, reason, by })
//   transfer-rules.calcDetailReceivedQty(detail)          點收數量
//   transfer-rules.defaultReceiveAgainQty(detail)         再次點收預設量＝搬運數量 − 點收數量
//   transfer-rules.canVoidTransfer(ticket, tasks)         作廢操作要不要渲染
//   transfer-rules.calcArrivedQty(taskId, tickets)        到料量＝點收紀錄合計

const {
  calcArrivedQty,
  calcDetailReceivedQty,
  calcMovableQty,
  canVoidTransfer,
  defaultReceiveAgainQty,
  deriveTransferStatus,
  describeTransferProgress,
} = transferRules;

const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workReports: useProductionFloorStore.getState().workReports,
};
const workOrdersInitial = useWorkOrdersStore.getState().workOrders;
const printItemsInitial = {
  printItems: usePrintItemsStore.getState().printItems,
  qcRecords: usePrintItemsStore.getState().qcRecords,
};

beforeEach(() => {
  useProductionFloorStore.setState(floorInitial);
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
  usePrintItemsStore.setState(printItemsInitial);
});

const floor = () => useProductionFloorStore.getState();
const ticketByNo = (no) => floor().transferTickets.find((t) => t.ticket_no === no);
const detailOf = (ticket, taskId) => ticket.details.find((d) => d.task_id === taskId);
const taskById = (id) => floor().tasks.find((t) => t.id === id);

describe('10.26 抵達站點逐條明細上傳簽收照片，任一條不足擋下', () => {
  // 合成：把 TT-20260827-002 的兩條明細（內卡 200、信封 300）倒回搬運中、尚未附照
  const MOVING_ID = 'tt-test-moving';
  beforeEach(() => {
    const base = floorInitial.transferTickets.find((t) => t.ticket_no === 'TT-20260827-002');
    const moving = {
      ...base,
      id: MOVING_ID,
      ticket_no: 'TT-20261005-901',
      status: '搬運中',
      actual_date: null,
      details: base.details.map((d) => ({ ...d, sign_photos: [], receipts: [] })),
    };
    useProductionFloorStore.setState({
      transferTickets: floorInitial.transferTickets
        .filter((t) => t.id !== base.id)
        .concat(moving),
    });
  });

  it('只為第一條明細附照時整筆擋下，列出缺照的第二條，單維持搬運中', () => {
    const result = floor().deliverTransfer(MOVING_ID, {
      by: '簡俊男',
      photosByTask: { 'pt-0812-6': ['內卡到站照.jpg'] },
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('信封四色印刷');
    expect(result.error).toContain('300');
    expect(result.error).not.toContain('內卡四色印刷');
    expect(floor().transferTickets.find((t) => t.id === MOVING_ID).status).toBe('搬運中');
  });

  it('兩條各有至少一張照片後轉已送達，寫入送達時間，照片掛在各自的明細', () => {
    const result = floor().deliverTransfer(MOVING_ID, {
      by: '簡俊男',
      photosByTask: {
        'pt-0812-6': ['內卡到站照.jpg'],
        'pt-0812-4': ['信封到站照.jpg'],
      },
    });
    expect(result.ok).toBe(true);
    const ticket = floor().transferTickets.find((t) => t.id === MOVING_ID);
    expect(ticket.status).toBe('已送達');
    expect(ticket.actual_date).toBeTruthy();
    expect(detailOf(ticket, 'pt-0812-6').sign_photos).toEqual(['內卡到站照.jpg']);
    expect(detailOf(ticket, 'pt-0812-4').sign_photos).toEqual(['信封到站照.jpg']);
    expect(ticket).not.toHaveProperty('sign_photos');
  });
});

describe('10.27 首次點收逐條填實際量，點收數量不擋超過搬運數量', () => {
  // 鏈外 TT-20260827-002（tt-016，已送達）：內卡四色印刷 200、信封四色印刷 300
  it('內卡填 210 照收：點收數量 210 超過搬運數量 200 不擋，單轉已點收', () => {
    const result = floor().receiveTransfer('tt-016', {
      by: '許文傑',
      proxy: true,
      quantities: { 'pt-0812-6': 210, 'pt-0812-4': 300 },
    });
    expect(result.ok).toBe(true);
    const ticket = ticketByNo('TT-20260827-002');
    expect(ticket.status).toBe('已點收');
    expect(calcDetailReceivedQty(detailOf(ticket, 'pt-0812-6'))).toBe(210);
    expect(describeTransferProgress(taskById('pt-0812-6'), floor().transferTickets)).toBe(
      '轉交量 200／點收量 210／良品 200',
    );
  });

  it('內卡 200、信封 280 送出成立：單轉已點收，兩條各寫一筆點收紀錄並留代點收標記', () => {
    const result = floor().receiveTransfer('tt-016', {
      by: '許文傑',
      proxy: true,
      quantities: { 'pt-0812-6': 200, 'pt-0812-4': 280 },
    });
    expect(result.ok).toBe(true);
    const ticket = ticketByNo('TT-20260827-002');
    expect(ticket.status).toBe('已點收');
    const card = detailOf(ticket, 'pt-0812-6');
    const envelope = detailOf(ticket, 'pt-0812-4');
    expect(card.receipts).toHaveLength(1);
    expect(envelope.receipts).toHaveLength(1);
    expect(card.receipts[0]).toMatchObject({ qty: 200, received_by: '許文傑', proxy_received: true });
    expect(envelope.receipts[0]).toMatchObject({ qty: 280, received_by: '許文傑', proxy_received: true });
    expect(card.receipts[0].received_at).toBeTruthy();
    expect(calcDetailReceivedQty(card)).toBe(200);
    expect(calcDetailReceivedQty(envelope)).toBe(280);
  });

  it('點收後兩筆任務的轉交進度照實顯示轉交量、點收量與良品數', () => {
    const tickets0 = floor().transferTickets;

    floor().receiveTransfer('tt-016', {
      by: '許文傑',
      proxy: true,
      quantities: { 'pt-0812-6': 200, 'pt-0812-4': 280 },
    });
    const tickets = floor().transferTickets;
    expect(describeTransferProgress(taskById('pt-0812-4'), tickets)).toBe('轉交量 300／點收量 280／良品 300');
    expect(describeTransferProgress(taskById('pt-0812-6'), tickets)).toBe('轉交量 200／點收量 200／良品 200');
  });

  it('未填的明細預設帶搬運數量', () => {
    expect(floor().receiveTransfer('tt-016', { by: '許文傑', proxy: true }).ok).toBe(true);
    const ticket = ticketByNo('TT-20260827-002');
    expect(calcDetailReceivedQty(detailOf(ticket, 'pt-0812-6'))).toBe(200);
    expect(calcDetailReceivedQty(detailOf(ticket, 'pt-0812-4'))).toBe(300);
  });

  it('所屬產線含手工產線的人員本人點收時不留代點收標記', () => {
    floor().receiveTransfer('tt-016', { by: '李榮發', proxy: false });
    const ticket = ticketByNo('TT-20260827-002');
    ticket.details.forEach((d) => {
      expect(d.receipts[0]).toMatchObject({ received_by: '李榮發', proxy_received: false });
    });
  });
});

describe('10.28 短少照實點收，已送達的單不可作廢', () => {
  // 鏈二 TT-20260830-002（tt-005，已送達，海報四色印刷搬運數量 1,190）
  it('來源任務有效時，已送達的單不提供作廢；資料層作廢也被擋下、單維持已送達', () => {
    const ticket = ticketByNo('TT-20260830-002');
    expect(canVoidTransfer(ticket, floor().tasks)).toBe(false);
    const result = floor().voidTransfer('tt-005', { reason: '數量填錯', by: '許文傑' });
    expect(result.ok).toBe(false);
    expect(ticketByNo('TT-20260830-002').status).toBe('已送達');
  });

  it('待搬運與搬運中仍可作廢，已點收不可作廢', () => {
    const tasks = floor().tasks;
    expect(canVoidTransfer(ticketByNo('TT-20260830-003'), tasks)).toBe(true); // 搬運中
    expect(canVoidTransfer({ ...ticketByNo('TT-20260830-003'), status: '待搬運' }, tasks)).toBe(true);
    expect(canVoidTransfer(ticketByNo('TT-20260828-001'), tasks)).toBe(false); // 已點收
  });

  it('現場只點到 1,150：照實點收成立，明細點收數量 1,150，到料量 1,150', () => {
    const result = floor().receiveTransfer('tt-005', {
      by: '許文傑',
      proxy: true,
      quantities: { 'pt-0710-2': 1150 },
    });
    expect(result.ok).toBe(true);
    const ticket = ticketByNo('TT-20260830-002');
    expect(ticket.status).toBe('已點收');
    expect(calcDetailReceivedQty(detailOf(ticket, 'pt-0710-2'))).toBe(1150);
    expect(calcArrivedQty('pt-0710-2', floor().transferTickets)).toBe(1150);
  });

  it('結果樣本 TT-20260827-001：搬運數量 500、點收數量 480，差額 20 留在明細，證書四色印刷停在待點收', () => {
    const ticket = ticketByNo('TT-20260827-001');
    const detail = detailOf(ticket, 'pt-0812-2');
    expect(detail.qty).toBe(500);
    expect(calcDetailReceivedQty(detail)).toBe(480);
    expect(deriveTransferStatus(taskById('pt-0812-2'), floor().transferTickets)).toBe('待點收');
  });
});

describe('10.29 貨補到後對同一明細再次點收，點收數量可超過搬運數量', () => {
  // 鏈外 TT-20260827-001（tt-015，已點收；證書四色印刷搬運數量 500、點收數量 480）
  it('再次點收的點收量預設帶 20（搬運數量減點收數量）', () => {
    expect(defaultReceiveAgainQty(detailOf(ticketByNo('TT-20260827-001'), 'pt-0812-2'))).toBe(20);
  });

  it('填 30 照收：點收數量 510 超過搬運數量 500 不擋，新增一筆點收紀錄', () => {
    const result = floor().receiveTransferAgain('tt-015', {
      taskId: 'pt-0812-2',
      qty: 30,
      by: '許文傑',
      proxy: true,
    });
    expect(result.ok).toBe(true);
    const detail = detailOf(ticketByNo('TT-20260827-001'), 'pt-0812-2');
    expect(detail.receipts).toHaveLength(2);
    expect(calcDetailReceivedQty(detail)).toBe(510);
  });

  it('填 20 成立：新增一筆點收紀錄、累計 500、單頭維持已點收，歷程記再次點收', () => {
    const result = floor().receiveTransferAgain('tt-015', {
      taskId: 'pt-0812-2',
      qty: 20,
      by: '許文傑',
      proxy: true,
    });
    expect(result.ok).toBe(true);
    const ticket = ticketByNo('TT-20260827-001');
    const detail = detailOf(ticket, 'pt-0812-2');
    expect(detail.receipts).toHaveLength(2);
    expect(detail.receipts[1]).toMatchObject({ qty: 20, received_by: '許文傑', proxy_received: true });
    expect(calcDetailReceivedQty(detail)).toBe(500);
    expect(ticket.status).toBe('已點收');
    const last = ticket.history.at(-1);
    expect(last.event).toContain('再次點收');
    expect(last.event).toContain('20');
    expect(last.actor).toBe('許文傑');
    expect(last.at).toBeTruthy();
    expect(deriveTransferStatus(taskById('pt-0812-2'), floor().transferTickets)).toBe('已轉交');
  });
});

describe('10.30 收貨人點錯數修改點收數量並填原因，低於下游已報工量時擋下', () => {
  it('未填原因時擋下送出', () => {
    const result = floor().editTransferReceipt('tt-015', {
      taskId: 'pt-0812-2',
      receiptId: 'tt-015-r1',
      qty: 490,
      reason: '',
      by: '許文傑',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('原因');
    expect(calcDetailReceivedQty(detailOf(ticketByNo('TT-20260827-001'), 'pt-0812-2'))).toBe(480);
  });

  it('改成 490 成立：點收數量 490、證書裁切的到料量 490，歷程記修改前後值、修改人與原因', () => {
    const result = floor().editTransferReceipt('tt-015', {
      taskId: 'pt-0812-2',
      receiptId: 'tt-015-r1',
      qty: 490,
      reason: '重點數量',
      by: '許文傑',
    });
    expect(result.ok).toBe(true);
    const ticket = ticketByNo('TT-20260827-001');
    expect(calcDetailReceivedQty(detailOf(ticket, 'pt-0812-2'))).toBe(490);
    expect(calcArrivedQty('pt-0812-2', floor().transferTickets)).toBe(490);
    expect(ticket.status).toBe('已點收');
    const last = ticket.history.at(-1);
    expect(last.event).toContain('480');
    expect(last.event).toContain('490');
    expect(last.event).toContain('重點數量');
    expect(last.actor).toBe('許文傑');
  });

  it('改成 510 照收：點收數量 510 超過搬運數量 500 不擋', () => {
    const result = floor().editTransferReceipt('tt-015', {
      taskId: 'pt-0812-2',
      receiptId: 'tt-015-r1',
      qty: 510,
      reason: '重點數量',
      by: '許文傑',
    });
    expect(result.ok).toBe(true);
    expect(calcDetailReceivedQty(detailOf(ticketByNo('TT-20260827-001'), 'pt-0812-2'))).toBe(510);
  });

  it('點收佇列的整張單修改：證書那一條改成 490 並填原因成立，改的是最近一筆點收紀錄', () => {
    const noReason = floor().editTicketReceipts('tt-015', {
      quantities: { 'pt-0812-2': 490 },
      reason: '',
      by: '許文傑',
    });
    expect(noReason.ok).toBe(false);
    expect(noReason.error).toContain('原因');
    const result = floor().editTicketReceipts('tt-015', {
      quantities: { 'pt-0812-2': 490 },
      reason: '重點數量',
      by: '許文傑',
    });
    expect(result.ok).toBe(true);
    const detail = detailOf(ticketByNo('TT-20260827-001'), 'pt-0812-2');
    expect(detail.receipts).toHaveLength(1);
    expect(calcDetailReceivedQty(detail)).toBe(490);
    expect(ticketByNo('TT-20260827-001').history.at(-1).event).toContain('重點數量');
  });

  it('點收佇列的整張單修改：數量沒變時擋下，提示沒有要儲存的修改', () => {
    const result = floor().editTicketReceipts('tt-015', {
      quantities: { 'pt-0812-2': 480 },
      reason: '重點數量',
      by: '許文傑',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('沒有要儲存的修改');
  });

  // 合成資料：前置甲（需轉交）一張已點收的單，下游乙依甲開工
  const seedUpDown = ({ receipts, setQty, downstreamInput }) => {
    const up = {
      id: 'pt-test-a',
      name: '甲',
      work_order_no: 'WO-TEST',
      status: '已完成',
      needs_transfer: true,
      input_qty: setQty,
      good_qty: setQty,
      produced_qty: setQty,
      downstream_station_key: '手工產線',
      depends_on: [],
      history: [],
    };
    const down = {
      id: 'pt-test-b',
      name: '乙',
      work_order_no: 'WO-TEST',
      status: downstreamInput > 0 ? '製作中' : '待處理',
      needs_transfer: true,
      target_qty: 1000,
      input_qty: downstreamInput,
      good_qty: downstreamInput,
      produced_qty: downstreamInput,
      planned_equipment: 'POLAR 137 裁切機',
      depends_on: ['pt-test-a'],
      bom_unit_usage: 1,
      history: [],
    };
    useProductionFloorStore.setState({
      tasks: [up, down],
      workReports:
        downstreamInput > 0
          ? [
              {
                id: 'wr-test-b',
                task_id: 'pt-test-b',
                input_qty: downstreamInput,
                good_qty: downstreamInput,
                defect_qty: 0,
                status: '有效',
                reporter: '李榮發',
                edit_logs: [],
              },
            ]
          : [],
      transferTickets: [
        {
          id: 'tt-test-a',
          ticket_no: 'TT-TEST-A',
          status: '已點收',
          target_station_key: '手工產線',
          target_station: '手工產線',
          details: [
            {
              task_id: 'pt-test-a',
              task_name: '甲',
              qty: setQty,
              sign_photos: ['合成照.jpg'],
              receipts: receipts.map((qty, i) => ({
                id: `tt-test-a-r${i + 1}`,
                qty,
                received_by: '李榮發',
                received_at: '2026-10-05 10:00',
                proxy_received: false,
              })),
            },
          ],
          history: [],
        },
      ],
    });
    useWorkOrdersStore.setState({ workOrders: [] });
  };

  it('純函式：甲點收紀錄 200、乙已報工 190，把甲那筆改為 150 被擋，提示下游乙已報工 190，紀錄維持 200', () => {
    seedUpDown({ receipts: [200], setQty: 200, downstreamInput: 190 });
    const result = floor().editTransferReceipt('tt-test-a', {
      taskId: 'pt-test-a',
      receiptId: 'tt-test-a-r1',
      qty: 150,
      reason: '重點數量',
      by: '李榮發',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('乙');
    expect(result.error).toContain('已報工 190');
    const detail = floor().transferTickets[0].details[0];
    expect(calcDetailReceivedQty(detail)).toBe(200);
  });

  it('純函式：搬運數量 200、兩筆點收紀錄 150 與 30，把 30 那筆改為 60 照收，點收數量 210', () => {
    seedUpDown({ receipts: [150, 30], setQty: 200, downstreamInput: 0 });
    const result = floor().editTransferReceipt('tt-test-a', {
      taskId: 'pt-test-a',
      receiptId: 'tt-test-a-r2',
      qty: 60,
      reason: '重點數量',
      by: '李榮發',
    });
    expect(result.ok).toBe(true);
    expect(calcDetailReceivedQty(floor().transferTickets[0].details[0])).toBe(210);
  });

  it('純函式：整張單修改改到下游已報工以下時整筆擋下、不寫入', () => {
    seedUpDown({ receipts: [200], setQty: 200, downstreamInput: 190 });
    const result = floor().editTicketReceipts('tt-test-a', {
      quantities: { 'pt-test-a': 150 },
      reason: '重點數量',
      by: '李榮發',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('已報工 190');
    expect(calcDetailReceivedQty(floor().transferTickets[0].details[0])).toBe(200);
  });
});

describe('10.31 到料量取轉交點收量，含再次點收與修改後的值', () => {
  // 鏈外 WO-2026-0812 證書裁切的前置證書四色印刷經 TT-20260827-001 點收 480
  it('起點到料量 480，不是搬運數量 500', () => {
    expect(calcArrivedQty('pt-0812-2', floor().transferTickets)).toBe(480);
  });

  it('再次點收 20 後為 500', () => {
    floor().receiveTransferAgain('tt-015', { taskId: 'pt-0812-2', qty: 20, by: '許文傑', proxy: true });
    expect(calcArrivedQty('pt-0812-2', floor().transferTickets)).toBe(500);
  });

  it('點收紀錄由 480 改為 490 時為 490', () => {
    floor().editTransferReceipt('tt-015', {
      taskId: 'pt-0812-2',
      receiptId: 'tt-015-r1',
      qty: 490,
      reason: '重點數量',
      by: '許文傑',
    });
    expect(calcArrivedQty('pt-0812-2', floor().transferTickets)).toBe(490);
  });
});

describe('10.17（純函式）來源任務報廢或作廢時，已送達的單生管可作廢，已點收的單再次點收與點收修改一併擋下', () => {
  const markDead = (taskId, status) =>
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));

  it('來源任務已轉報廢：已送達的 TT-20260830-002 看得到作廢，作廢後轉已作廢', () => {
    markDead('pt-0710-2', '報廢');
    expect(canVoidTransfer(ticketByNo('TT-20260830-002'), floor().tasks)).toBe(true);
    const result = floor().voidTransfer('tt-005', { reason: '來源任務已報廢', by: '許文傑' });
    expect(result.ok).toBe(true);
    expect(ticketByNo('TT-20260830-002').status).toBe('已作廢');
  });

  it('來源任務已作廢時同樣可作廢已送達的單', () => {
    markDead('pt-0710-2', '已作廢');
    expect(canVoidTransfer(ticketByNo('TT-20260830-002'), floor().tasks)).toBe(true);
  });

  it('來源任務已報廢的已點收單（TT-20260828-001）：再次點收與點收修改都被擋下，點收紀錄不變', () => {
    markDead('pt-0710-1', '報廢');
    const again = floor().receiveTransferAgain('tt-004', {
      taskId: 'pt-0710-1',
      qty: 0,
      by: '許文傑',
      proxy: true,
    });
    expect(again.ok).toBe(false);
    expect(again.error).toContain('來源任務');

    const edit = floor().editTransferReceipt('tt-004', {
      taskId: 'pt-0710-1',
      receiptId: 'tt-004-r1',
      qty: 3000,
      reason: '重點數量',
      by: '許文傑',
    });
    expect(edit.ok).toBe(false);
    expect(edit.error).toContain('來源任務');
    const detail = detailOf(ticketByNo('TT-20260828-001'), 'pt-0710-1');
    expect(detail.receipts).toHaveLength(1);
    expect(calcDetailReceivedQty(detail)).toBe(3090);
  });
});

describe('10.38 搬運中作廢重開沿用原單目的地、重走搬運，沒有「貨已在現場」', () => {
  // 鏈二 TT-20260830-003（tt-006，搬運中，目的地手工產線，海報四色印刷 800）
  beforeEach(() => {
    floor().syncTaskDestination('pt-0710-2', {
      fromKey: '手工產線',
      toKey: '裝訂產線',
      actor: '周建宏',
    });
  });

  it('作廢成立當下明細退出轉交量，海報四色印刷的可搬量由 0 回到 800', () => {
    const task = () => taskById('pt-0710-2');
    expect(calcMovableQty(task(), floor().transferTickets)).toBe(0);
    expect(floor().voidTransfer('tt-006', { reason: '數量填錯', by: '許文傑' }).ok).toBe(true);
    expect(calcMovableQty(task(), floor().transferTickets)).toBe(800);
  });

  it('重開的新單沿用原單目的地、停在待搬運；即使呼叫端帶「貨已在現場」也不直接以已送達生成', () => {
    floor().voidTransfer('tt-006', { reason: '數量填錯', by: '許文傑' });
    const reopened = floor().reopenTransferTicket('tt-006', {
      details: [{ task_id: 'pt-0710-2', qty: 800 }],
      onsite: true,
      actor: '許文傑',
    });
    expect(reopened.ok).toBe(true);
    expect(reopened.ticket.target_station_key).toBe('手工產線');
    expect(reopened.ticket.status).toBe('待搬運');
    expect(reopened.ticket.actual_date ?? null).toBeNull();
    expect(reopened.ticket).not.toHaveProperty('onsite_flag');
    reopened.ticket.history.forEach((h) => expect(h.event).not.toContain('貨已在現場'));
  });
});
