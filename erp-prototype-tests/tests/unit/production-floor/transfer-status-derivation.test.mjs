import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import * as transferRules from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/transfer-rules.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境目錄 10.32、10.33、10.39：生產任務轉交狀態推導。
// 狀態列舉與推導條件正本：wiki 生產任務轉交狀態；數量算式正本：wiki 生產任務 § 數量。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence
// production-execution delta § 生產任務轉交狀態推導、§ 轉交單改單與更正 各 Scenario 的 THEN。
//
// 本檔先於實作撰寫（tasks 2.6、2.14），下列純函式與動作由 tasks 6.2、6.4、6.5、6.6 依此契約補上：
//   transfer-rules.deriveTransferStatus(task, tickets)
//     → '不適用'｜'待轉交'｜'轉交中'｜'待點收'｜'已轉交'｜'－'
//   transfer-rules.calcTransferReceivedQty(taskId, tickets)  轉交點收量＝各明細有效點收紀錄 receipts[].qty 合計
//   transfer-rules.hasGoodsAwaitingReceipt(taskId, tickets)   已送達待點收判定（函式保留；畫面不呈現，2026-10-06 拍板）
//   transfer-rules.describeTransferProgress(task, tickets)    轉交進度文字「轉交量 N／點收量 M／良品 K」
//   store.editWorkReport(reportId, { input_qty?, good_qty?, defect_qty?, reason, by })
//   store.receiveTransfer(ticketId, { by, quantities })      點收單一動作，已點收的單再點收一筆也走這一支
//   store.editTransferQty(ticketId, { taskId, qty, reason, by })
//     搬運數量修改（新契約，等 tasks 5.6 實作）：開始搬運後只能經這一支更正；修改原因必填；
//     改後大於 0、不得低於該明細的點收數量；調升受轉交可申請上限管制（先還回本單原佔用）；
//     每次記一筆搬運數量修改並寫入轉交單歷程；不改單頭狀態。
// 轉交量沿用既有 calcOccupiedQty，轉交可申請上限沿用既有 calcMovableQty。

const {
  calcMovableQty,
  calcOccupiedQty,
  calcTransferReceivedQty,
  deriveTransferStatus,
  describeTransferProgress,
  hasGoodsAwaitingReceipt,
} = transferRules;

// 合成資料：一筆需轉交的生產任務與它的轉交單（點收紀錄掛在每條明細上）
const TASK_ID = 'pt-test-transfer';
const taskOf = (overrides = {}) => ({
  id: TASK_ID,
  name: '合成印刷',
  status: '製作中',
  needs_transfer: true,
  good_qty: 0,
  ...overrides,
});
const ticketOf = (id, status, qty, receipts = []) => ({
  id,
  ticket_no: id.toUpperCase(),
  status,
  destination_line: '手工產線',
  details: [
    {
      task_id: TASK_ID,
      task_name: '合成印刷',
      destination_station_key: '裁切站',
      qty,
      receipts: receipts.map((q, i) => ({
        id: `${id}-r${i + 1}`,
        qty: q,
        received_by: '李榮發',
        received_at: '2026-10-05 10:00',
        remark: '',
        status: '有效',
      })),
    },
  ],
});

describe('10.32 生產任務轉交狀態推導：推導條件逐格', () => {
  it('需轉交為否 → 不適用', () => {
    expect(deriveTransferStatus(taskOf({ needs_transfer: false, good_qty: 300 }), [])).toBe('不適用');
  });

  it('需轉交、良品 0、沒有任何轉交單 → 待轉交', () => {
    expect(deriveTransferStatus(taskOf(), [])).toBe('待轉交');
  });

  it('任務已作廢或報廢 → 顯示「－」、不再推導', () => {
    const tickets = [ticketOf('t1', '已點收', 200, [200])];
    expect(deriveTransferStatus(taskOf({ status: '報廢', good_qty: 200 }), tickets)).toBe('－');
    expect(deriveTransferStatus(taskOf({ status: '已作廢', good_qty: 200 }), tickets)).toBe('－');
  });

  it('轉交點收量取點收紀錄合計，不取設定量', () => {
    const tickets = [ticketOf('t1', '已點收', 500, [480])];
    expect(calcTransferReceivedQty(TASK_ID, tickets)).toBe(480);
    expect(calcOccupiedQty(TASK_ID, tickets)).toBe(500);
  });
});

describe('10.32 生產任務轉交狀態推導：各走法', () => {
  it('先做完再分批送：第一張點收 500 → 待點收，第二張點收 500 → 已轉交', () => {
    const task = taskOf({ status: '已完成', good_qty: 1000 });
    const firstReceived = [ticketOf('t1', '已點收', 500, [500]), ticketOf('t2', '搬運中', 500)];
    expect(deriveTransferStatus(task, firstReceived)).toBe('待點收');
    expect(describeTransferProgress(task, firstReceived)).toBe('轉交量 1,000／點收量 500／良品 1,000');

    const bothReceived = [ticketOf('t1', '已點收', 500, [500]), ticketOf('t2', '已點收', 500, [500])];
    expect(deriveTransferStatus(task, bothReceived)).toBe('已轉交');
  });

  it('邊做邊送：任務製作中時點收 200 最高只到轉交中；任務完成且點收量等於良品後已轉交', () => {
    const tickets = [ticketOf('t1', '已點收', 200, [200])];
    expect(deriveTransferStatus(taskOf({ status: '製作中', good_qty: 200 }), tickets)).toBe('轉交中');
    expect(deriveTransferStatus(taskOf({ status: '已完成', good_qty: 200 }), tickets)).toBe('已轉交');
  });

  it('在途作廢：唯一一張搬運中的單作廢後轉交量 0，回到待轉交', () => {
    const task = taskOf({ good_qty: 300 });
    expect(deriveTransferStatus(task, [ticketOf('t1', '搬運中', 300)])).toBe('轉交中');
    const voided = [ticketOf('t1', '已作廢', 300)];
    expect(calcOccupiedQty(TASK_ID, voided)).toBe(0);
    expect(deriveTransferStatus(task, voided)).toBe('待轉交');
  });

  it('已送達待點收判定（函式保留、畫面不呈現）：單轉已送達時為真，被點收後為假', () => {
    expect(hasGoodsAwaitingReceipt(TASK_ID, [ticketOf('t1', '搬運中', 300)])).toBe(false);
    expect(hasGoodsAwaitingReceipt(TASK_ID, [ticketOf('t1', '已送達', 300)])).toBe(true);
    expect(hasGoodsAwaitingReceipt(TASK_ID, [ticketOf('t1', '已點收', 300, [300])])).toBe(false);
  });

  it('任務報廢：轉交中的任務轉報廢後顯示「－」，之後再點收也不變', () => {
    const moving = [ticketOf('t1', '已送達', 300)];
    expect(deriveTransferStatus(taskOf({ good_qty: 300 }), moving)).toBe('轉交中');
    const scrapped = taskOf({ status: '報廢', good_qty: 300 });
    expect(deriveTransferStatus(scrapped, moving)).toBe('－');
    expect(deriveTransferStatus(scrapped, [ticketOf('t1', '已點收', 300, [300])])).toBe('－');
  });
});

describe('10.39 轉交狀態兩條邊界（純函式）', () => {
  it('任務已完成但良品多於轉交量時停在轉交中；補建 100 並點收後轉已轉交', () => {
    // 合成：良品 1,000，已建單合計 900 且已全數點收；印務在印件層短出結案把任務推到已完成
    const task = taskOf({ status: '已完成', good_qty: 1000 });
    const before = [ticketOf('t1', '已點收', 900, [900])];
    expect(deriveTransferStatus(task, before)).toBe('轉交中');
    expect(describeTransferProgress(task, before)).toBe('轉交量 900／點收量 900／良品 1,000');

    const after = [...before, ticketOf('t2', '已點收', 100, [100])];
    expect(deriveTransferStatus(task, after)).toBe('已轉交');
  });

  it('生管不建單時一直停在轉交中', () => {
    const task = taskOf({ status: '已完成', good_qty: 1000 });
    expect(deriveTransferStatus(task, [ticketOf('t1', '已點收', 900, [900])])).toBe('轉交中');
  });

  it('轉交點收量多於良品時落在轉交中，進度文字照實顯示', () => {
    const task = taskOf({ status: '已完成', good_qty: 480 });
    const tickets = [ticketOf('t1', '已點收', 500, [480, 20])];
    expect(deriveTransferStatus(task, tickets)).toBe('轉交中');
    expect(describeTransferProgress(task, tickets)).toBe('轉交量 500／點收量 500／良品 480');
    expect(deriveTransferStatus({ ...task, good_qty: 500 }, tickets)).toBe('已轉交');
  });
});

// ── 畫面樣本的資料層：鏈外 WO-2026-0812 證書四色印刷（pt-0812-2，已完成、良品 500）
//    TT-20260827-001（tt-015，設定量 500、點收紀錄一筆 480，已點收）──

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

const floor = () => useProductionFloorStore.getState();
const certTask = () => floor().tasks.find((t) => t.id === 'pt-0812-2');
const tickets = () => floor().transferTickets;

describe('10.33 短少確定找不到：先改搬運數量、再改報工，轉交狀態走出待點收', () => {
  beforeEach(() => {
    useProductionFloorStore.setState(floorInitial);
    useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
    usePrintItemsStore.setState(printItemsInitial);
  });

  const ticket015 = () => tickets().find((t) => t.id === 'tt-015');

  it('起點：良品 500、轉交點收量 480，待點收，轉交可申請上限 0', () => {
    expect(certTask().good_qty).toBe(500);
    expect(calcTransferReceivedQty('pt-0812-2', tickets())).toBe(480);
    expect(deriveTransferStatus(certTask(), tickets())).toBe('待點收');
    expect(calcMovableQty(certTask(), tickets())).toBe(0);
  });

  it('搬運數量修改沒填原因、改到點收數量 480 以下、或改為 0 都擋下，數字不變', () => {
    const noReason = floor().editTransferQty('tt-015', { taskId: 'pt-0812-2', qty: 480, reason: '', by: '許文傑' });
    expect(noReason.ok).toBe(false);
    expect(noReason.error).toContain('原因');
    const belowReceived = floor().editTransferQty('tt-015', {
      taskId: 'pt-0812-2',
      qty: 470,
      reason: '實際只搬了這些',
      by: '許文傑',
    });
    expect(belowReceived.ok).toBe(false);
    expect(belowReceived.error).toContain('480');
    const zero = floor().editTransferQty('tt-015', { taskId: 'pt-0812-2', qty: 0, reason: '實際只搬了這些', by: '許文傑' });
    expect(zero.ok).toBe(false);
    expect(zero.error).toContain('大於 0');
    expect(ticket015().details[0].qty).toBe(500);
  });

  it('生管把搬運數量改為 480（原因自由填寫）→ 轉交量 480、單頭維持已點收，歷程記改前 500、改後 480', () => {
    const result = floor().editTransferQty('tt-015', {
      taskId: 'pt-0812-2',
      qty: 480,
      reason: '現場清點只有 480',
      by: '許文傑',
    });
    expect(result.ok).toBe(true);
    expect(ticket015().status).toBe('已點收');
    expect(ticket015().details[0].qty).toBe(480);
    expect(calcOccupiedQty('pt-0812-2', tickets())).toBe(480);
    const last = ticket015().history.at(-1);
    expect(last.event).toContain('500');
    expect(last.event).toContain('480');
    expect(last.event).toContain('現場清點只有 480');
    expect(last.actor).toBe('許文傑');
  });

  it('再由印務把報工良品 500 改 480、不良品 15 改 35（生產數量 515 不變）→ 轉交量 480／點收量 480／良品 480，已轉交、上限 0', () => {
    floor().editTransferQty('tt-015', { taskId: 'pt-0812-2', qty: 480, reason: '現場清點只有 480', by: '許文傑' });
    const edit = floor().editWorkReport('wr-0018', {
      good_qty: 480,
      defect_qty: 35,
      reason: '現場清點只有 480',
      by: '周建宏',
    });
    expect(edit.ok).toBe(true);
    expect(certTask().good_qty).toBe(480);
    expect(certTask().input_qty).toBe(515);
    expect(describeTransferProgress(certTask(), tickets())).toBe('轉交量 480／點收量 480／良品 480');
    expect(deriveTransferStatus(certTask(), tickets())).toBe('已轉交');
    expect(calcMovableQty(certTask(), tickets())).toBe(0);
  });
});

describe('10.39 轉交狀態兩條邊界（鏈外 WO-2026-0812 證書四色印刷）', () => {
  beforeEach(() => {
    useProductionFloorStore.setState(floorInitial);
    useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
    usePrintItemsStore.setState(printItemsInitial);
    // 前置：報工良品改為 480、不良品改為 35（點收累計 480）
    floor().editWorkReport('wr-0018', { good_qty: 480, defect_qty: 35, reason: '現場清點只有 480', by: '周建宏' });
  });

  it('貨找回後再點收一筆 20：系統不以良品數擋下，落在轉交中，「轉交量 500／點收量 500／良品 480」', () => {
    expect(deriveTransferStatus(certTask(), tickets())).toBe('已轉交');
    const again = floor().receiveTransfer('tt-015', {
      by: '許文傑',
      quantities: { 'pt-0812-2': 20 },
    });
    expect(again.ok).toBe(true);
    expect(deriveTransferStatus(certTask(), tickets())).toBe('轉交中');
    expect(describeTransferProgress(certTask(), tickets())).toBe('轉交量 500／點收量 500／良品 480');
  });

  it('印務把報工良品改回 500 後轉已轉交', () => {
    floor().receiveTransfer('tt-015', { by: '許文傑', quantities: { 'pt-0812-2': 20 } });
    const edit = floor().editWorkReport('wr-0018', {
      good_qty: 500,
      defect_qty: 15,
      reason: '貨已找回',
      by: '周建宏',
    });
    expect(edit.ok).toBe(true);
    expect(deriveTransferStatus(certTask(), tickets())).toBe('已轉交');
    expect(describeTransferProgress(certTask(), tickets())).toBe('轉交量 500／點收量 500／良品 500');
  });
});
