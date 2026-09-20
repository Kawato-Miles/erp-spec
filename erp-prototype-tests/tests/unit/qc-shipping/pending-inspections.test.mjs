import { describe, expect, it } from 'vitest';
import { calcPendingInspections } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/pending-inspections.js';
import {
  MOCK_PRINT_ITEMS,
  MOCK_QC_RECORDS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_FLOOR_TASKS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';

// 情境 11.1（待驗清單列出條件與欄位）、11.14（多部件取良品最小值）、11.15（不需轉交照樣列出）、
// 11.16（更正沖銷後回升）、11.17（不良品不進待驗量）、11.19（良品縮回 0 仍留在清單上）、
// 11.20（打樣印件同一套算法、重打只算本週期）、11.21（外發報工後即進清單）
// 的數字驗算；畫面呈現另在 e2e 第十一章驗。
//
// 待驗量＝做出來的良品 − 已驗量（品檢紀錄通過與不通過的代數和），不看轉交、不看點收。
// 齊套完成數取產出（良品＋不良品），是製作進度那一欄，不參與待驗量。

// 起點資料以外的情境用合成資料：多部件、不需轉交、報廢三種樣本現行 mock 上沒有對應的印件。
const workOrderOf = (printItemNo, tasks, extra = {}) => ({
  id: `wo-${printItemNo}`,
  status: '製作中',
  work_order_type: '一般',
  qty_per_print_item: 1,
  print_item: { print_item_no: printItemNo },
  tasks,
  ...extra,
});

// 一筆生產任務：良品與不良品分開給，產出數量為兩者之和（現場報工的三本帳）
const taskOf = (id, goodQty, defectQty = 0, extra = {}) => ({
  id,
  name: id,
  count_in_completion: true,
  status: '製作中',
  good_qty: goodQty,
  produced_qty: goodQty + defectQty,
  qty_per_work_order: 1,
  print_item_units_per_output: 1,
  history: [],
  ...extra,
});

const printItemOf = (printItemNo, name) => ({
  print_item_no: printItemNo,
  name,
  print_item_type: '大貨印件',
});

const qcRecordOf = (printItemNo, passed, failed, at) => ({
  print_item_no: printItemNo,
  passed_qty: passed,
  failed_qty: failed,
  inspected_at: at,
});

describe('11.1 待驗清單依印件做出來的良品列出', () => {
  const rows = calcPendingInspections({
    printItems: MOCK_PRINT_ITEMS,
    orders: MOCK_ORDERS,
    workOrders: MOCK_WORK_ORDERS,
    floorTasks: MOCK_FLOOR_TASKS,
    qcRecords: MOCK_QC_RECORDS,
  });
  const rowOf = (printItemNo) => rows.find((r) => r.print_item_no === printItemNo);

  it('鏈四 PI-2026-0820 精裝裝訂已報工良品 500、尚無轉交單，待驗量 500', () => {
    expect(rowOf('PI-2026-0820')).toMatchObject({
      kitting_qty: 500,
      kitting_good_qty: 500,
      inspected_pass: 0,
      inspected_fail: 0,
      pending_qty: 500,
    });
  });

  it('鏈一 PI-2026-0601 已驗完，待驗量 0 的列留在清單上', () => {
    expect(rowOf('PI-2026-0601')).toMatchObject({
      kitting_qty: 5000,
      kitting_good_qty: 5000,
      inspected_pass: 5000,
      pending_qty: 0,
    });
  });

  it('每一列帶所屬訂單編號與客戶名稱（自訂單帶出）', () => {
    expect(rowOf('PI-2026-0820')).toMatchObject({
      order_no: 'ORD-2026-0820',
      client_name: '晨光文創股份有限公司',
    });
    expect(rowOf('PI-2026-0601')).toMatchObject({
      order_no: 'ORD-2026-0601',
      client_name: '誠品書店股份有限公司',
    });
  });

  it('沒有良品也沒有品檢紀錄的印件不列（鏈二裁切未完成、鏈三尚未派工）', () => {
    expect(rowOf('PI-2026-0710')).toBeUndefined();
    expect(rowOf('PI-2026-0815')).toBeUndefined();
    expect(rows).toHaveLength(2);
  });
});

describe('11.14 多部件印件的待驗量取各部件良品的最小值', () => {
  const printItems = [printItemOf('PI-TEST-GIFT', '禮盒')];
  const buildWorkOrders = (linerGood, linerDefect) => [
    workOrderOf('PI-TEST-GIFT', [
      taskOf('pt-body', 1000),
      taskOf('pt-liner', linerGood, linerDefect),
    ]),
  ];

  it('盒身良品 1,000、內襯良品 590（不良品 10）時待驗量為 590', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: buildWorkOrders(590, 10),
      qcRecords: [],
    });
    expect(rows[0].kitting_good_qty).toBe(590);
    expect(rows[0].pending_qty).toBe(590);
  });

  it('待驗量不是兩個部件相加，也不是含不良品的那個數', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: buildWorkOrders(590, 10),
      qcRecords: [],
    });
    expect(rows[0].pending_qty).not.toBe(1590);
    expect(rows[0].pending_qty).not.toBe(600);
    // 齊套完成數（製作進度）仍取產出，內襯做了 600 件所以是 600
    expect(rows[0].kitting_qty).toBe(600);
  });

  it('內襯再報良品 400、累計 990 後待驗量為 990', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: buildWorkOrders(990, 10),
      qcRecords: [],
    });
    expect(rows[0].pending_qty).toBe(990);
  });
});

describe('11.15 末道任務標不需轉交的印件照樣進待驗清單', () => {
  it('唯一的計入完成度任務標不需轉交、報工良品 500，待驗量仍為 500', () => {
    const rows = calcPendingInspections({
      printItems: [printItemOf('PI-TEST-NOMOVE', '免搬運印件')],
      orders: [],
      workOrders: [
        workOrderOf('PI-TEST-NOMOVE', [taskOf('pt-last', 500, 0, { needs_transfer: false })]),
      ],
      qcRecords: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].pending_qty).toBe(500);
  });
});

describe('11.16 更正紀錄沖銷後待驗量回升', () => {
  const printItems = [printItemOf('PI-TEST-FIX', '更正樣本')];
  const workOrders = [workOrderOf('PI-TEST-FIX', [taskOf('pt-only', 500)])];

  it('驗完 500 之後待驗量為 0', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders,
      qcRecords: [qcRecordOf('PI-TEST-FIX', 500, 0, '2026-09-17 10:00')],
    });
    expect(rows[0].pending_qty).toBe(0);
  });

  it('補一筆通過 −500 的更正紀錄後待驗量回升為 500', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders,
      qcRecords: [
        qcRecordOf('PI-TEST-FIX', 500, 0, '2026-09-17 10:00'),
        qcRecordOf('PI-TEST-FIX', -500, 0, '2026-09-17 11:00'),
      ],
    });
    expect(rows[0].inspected_pass).toBe(0);
    expect(rows[0].pending_qty).toBe(500);
  });

  it('已驗量多過良品時照實顯示負數，不夾在 0', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders,
      qcRecords: [
        qcRecordOf('PI-TEST-FIX', 480, 20, '2026-09-17 10:00'),
        qcRecordOf('PI-TEST-FIX', 30, 0, '2026-09-17 11:00'),
      ],
    });
    expect(rows[0].pending_qty).toBe(-30);
  });
});

describe('11.17 不良品不進待驗量，齊套完成數照樣含它', () => {
  const rows = calcPendingInspections({
    printItems: [printItemOf('PI-TEST-DEFECT', '不良品樣本')],
    orders: [],
    workOrders: [workOrderOf('PI-TEST-DEFECT', [taskOf('pt-cut', 1000, 3)])],
    qcRecords: [],
  });

  it('裁切良品 1,000、不良品 3 時待驗量為 1,000', () => {
    expect(rows[0].kitting_good_qty).toBe(1000);
    expect(rows[0].pending_qty).toBe(1000);
  });

  it('齊套完成數仍顯示 1,003（製作進度取產出，兩個數互不覆蓋）', () => {
    expect(rows[0].kitting_qty).toBe(1003);
  });
});

describe('11.19 良品縮回 0 但已驗過的印件仍留在清單上', () => {
  const printItems = [printItemOf('PI-TEST-SCRAP', '報廢樣本')];
  const qcRecords = [qcRecordOf('PI-TEST-SCRAP', 500, 0, '2026-09-18 10:00')];

  it('唯一的計入完成度任務轉報廢後該列仍列出，待驗量為 −500', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: [
        workOrderOf('PI-TEST-SCRAP', [taskOf('pt-only', 500, 0, { status: '報廢' })]),
      ],
      qcRecords,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].kitting_good_qty).toBe(0);
    expect(rows[0].inspected_pass).toBe(500);
    expect(rows[0].pending_qty).toBe(-500);
  });

  it('待驗量不大於 0 又沒有任何品檢紀錄的印件才不列', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: [
        workOrderOf('PI-TEST-SCRAP', [taskOf('pt-only', 500, 0, { status: '報廢' })]),
      ],
      qcRecords: [],
    });
    expect(rows).toHaveLength(0);
  });
});

describe('11.20 打樣印件與大貨印件同一套算法，重打只算本打樣週期', () => {
  // 現行七條主鏈旗下全是大貨印件，打樣要用合成資料：一件打樣印件、旗下都是打樣工單
  const printItems = [
    { print_item_no: 'PI-TEST-SAMPLE', name: '樣品盒', print_item_type: '打樣印件' },
  ];
  // 第一輪的打樣工單（沒有重打起點標記，界線仍為空）
  const firstRound = workOrderOf('PI-TEST-SAMPLE', [taskOf('pt-sample-1', 1)], {
    id: 'wo-sample-1',
    work_order_type: '打樣',
    created_at: '2026-09-10 09:00',
  });
  // 業務填打樣結果 NG-製程問題時系統自動建的那一張，帶重打起點標記、界線認它
  const secondRound = workOrderOf('PI-TEST-SAMPLE', [taskOf('pt-sample-2', 1)], {
    id: 'wo-sample-2',
    work_order_type: '打樣',
    created_at: '2026-09-12 09:00',
    sample_cycle_reset: true,
  });
  const firstRoundPass = qcRecordOf('PI-TEST-SAMPLE', 1, 0, '2026-09-10 15:00');

  it('第一輪報工良品 1 時打樣印件照樣列出，待驗量為 1', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: [firstRound],
      qcRecords: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      print_item_type: '打樣印件',
      kitting_qty: 1,
      kitting_good_qty: 1,
      pending_qty: 1,
    });
  });

  it('第一輪驗完通過 1 之後待驗量歸零，列仍留著', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: [firstRound],
      qcRecords: [firstRoundPass],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].inspected_pass).toBe(1);
    expect(rows[0].pending_qty).toBe(0);
  });

  it('重打之後只算新那一輪：良品仍為 1、不是兩輪相加的 2，已驗量按週期回到 0', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders: [firstRound, secondRound],
      qcRecords: [firstRoundPass],
    });
    expect(rows[0].kitting_qty).toBe(1);
    expect(rows[0].kitting_good_qty).toBe(1);
    expect(rows[0].inspected_pass).toBe(0);
    expect(rows[0].pending_qty).toBe(1);
  });
});

describe('11.21 外發生產任務報工後即進待驗清單', () => {
  it('整筆交外包廠、印務依回廠點收報工良品 1,200 且沒有轉交單時，待驗量為 1,200', () => {
    const rows = calcPendingInspections({
      printItems: [printItemOf('PI-TEST-OUT', '外發樣本')],
      orders: [],
      workOrders: [
        workOrderOf('PI-TEST-OUT', [
          // 外發任務的良品寫在工單模組那一筆（現場任務池沒有它），故不給 floorTasks
          taskOf('pt-outsourced', 1200, 0, {
            unit_class: '外包廠',
            vendor: '誠泰紙藝加工廠',
            dispatch_no: 'DP-2026-0921',
            destination_station_key: '品檢站',
          }),
        ]),
      ],
      floorTasks: [],
      qcRecords: [],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kitting_good_qty: 1200,
      pending_qty: 1200,
    });
  });
});

describe('已棄用的印件不進待驗清單', () => {
  it('訂單上的印件狀態為已棄用時整列排除（那批貨不做了）', () => {
    const rows = calcPendingInspections({
      printItems: [printItemOf('PI-TEST-DROP', '已棄用樣本')],
      orders: [
        {
          order_no: 'ORD-TEST-DROP',
          client_name: '樣本客戶',
          print_items: [{ print_item_no: 'PI-TEST-DROP', print_item_status: '已棄用' }],
        },
      ],
      workOrders: [workOrderOf('PI-TEST-DROP', [taskOf('pt-only', 500)])],
      qcRecords: [qcRecordOf('PI-TEST-DROP', 100, 0, '2026-09-18 10:00')],
    });
    expect(rows).toHaveLength(0);
  });
});
