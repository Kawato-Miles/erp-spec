import { describe, expect, it } from 'vitest';
import { calcPendingInspections } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/pending-inspections.js';
import {
  MOCK_PRINT_ITEMS,
  MOCK_QC_RECORDS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_FLOOR_TASKS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';

// 情境 11.1（待驗清單依齊套完成數列出）、11.14（多部件取最小值）、11.15（不需轉交照樣列出）、
// 11.16（更正沖銷後回升）的數字驗算；畫面呈現另在 e2e 第十一章驗。
// 待驗量＝齊套完成數 − 已驗量（品檢紀錄通過與不通過的代數和），不看轉交、不看點收。

// 起點資料以外的情境用合成資料：多部件與不需轉交兩種樣本現行 mock 上沒有對應的印件。
const workOrderOf = (printItemNo, tasks, extra = {}) => ({
  id: `wo-${printItemNo}`,
  status: '製作中',
  work_order_type: '一般',
  qty_per_print_item: 1,
  print_item: { print_item_no: printItemNo },
  tasks,
  ...extra,
});

const taskOf = (id, producedQty, extra = {}) => ({
  id,
  name: id,
  count_in_completion: true,
  status: '製作中',
  produced_qty: producedQty,
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

describe('11.1 待驗清單依印件的齊套完成數列出', () => {
  const rows = calcPendingInspections({
    printItems: MOCK_PRINT_ITEMS,
    orders: MOCK_ORDERS,
    workOrders: MOCK_WORK_ORDERS,
    floorTasks: MOCK_FLOOR_TASKS,
    qcRecords: MOCK_QC_RECORDS,
  });
  const rowOf = (printItemNo) => rows.find((r) => r.print_item_no === printItemNo);

  it('鏈四 PI-2026-0820 精裝裝訂已報工 500、尚無轉交單，待驗量 500', () => {
    expect(rowOf('PI-2026-0820')).toMatchObject({
      kitting_qty: 500,
      inspected_pass: 0,
      inspected_fail: 0,
      pending_qty: 500,
    });
  });

  it('鏈一 PI-2026-0601 已驗完，待驗量 0 的列留在清單上', () => {
    expect(rowOf('PI-2026-0601')).toMatchObject({
      kitting_qty: 5000,
      inspected_pass: 5000,
      pending_qty: 0,
    });
  });

  it('齊套完成數為 0 或算不出來的印件不列（鏈二裁切未完成、鏈三尚未派工）', () => {
    expect(rowOf('PI-2026-0710')).toBeUndefined();
    expect(rowOf('PI-2026-0815')).toBeUndefined();
    expect(rows).toHaveLength(2);
  });
});

describe('11.14 多部件印件的待驗量取各部件齊套完成數的最小值', () => {
  const printItems = [printItemOf('PI-TEST-GIFT', '禮盒')];
  const orders = [];
  const buildWorkOrders = (linerQty) => [
    workOrderOf('PI-TEST-GIFT', [taskOf('pt-body', 1000), taskOf('pt-liner', linerQty)]),
  ];

  it('盒身 1,000、內襯 600 時待驗量為 600，不是兩者相加的 1,600', () => {
    const rows = calcPendingInspections({
      printItems,
      orders,
      workOrders: buildWorkOrders(600),
      qcRecords: [],
    });
    expect(rows[0].kitting_qty).toBe(600);
    expect(rows[0].pending_qty).toBe(600);
  });

  it('內襯補到 1,000 後待驗量為 1,000', () => {
    const rows = calcPendingInspections({
      printItems,
      orders,
      workOrders: buildWorkOrders(1000),
      qcRecords: [],
    });
    expect(rows[0].pending_qty).toBe(1000);
  });
});

describe('11.15 末道任務標不需轉交的印件照樣進待驗清單', () => {
  it('唯一的計入完成度任務標不需轉交、報工良品 500，待驗量仍為 500', () => {
    const rows = calcPendingInspections({
      printItems: [printItemOf('PI-TEST-NOMOVE', '免搬運印件')],
      orders: [],
      workOrders: [
        workOrderOf('PI-TEST-NOMOVE', [taskOf('pt-last', 500, { needs_transfer: false })]),
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
      qcRecords: [
        { print_item_no: 'PI-TEST-FIX', passed_qty: 500, failed_qty: 0, inspected_at: '2026-09-17 10:00' },
      ],
    });
    expect(rows[0].pending_qty).toBe(0);
  });

  it('補一筆通過 −500 的更正紀錄後待驗量回升為 500', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders,
      qcRecords: [
        { print_item_no: 'PI-TEST-FIX', passed_qty: 500, failed_qty: 0, inspected_at: '2026-09-17 10:00' },
        { print_item_no: 'PI-TEST-FIX', passed_qty: -500, failed_qty: 0, inspected_at: '2026-09-17 11:00' },
      ],
    });
    expect(rows[0].inspected_pass).toBe(0);
    expect(rows[0].pending_qty).toBe(500);
  });

  it('已驗量超過齊套完成數時待驗量夾在 0、不為負', () => {
    const rows = calcPendingInspections({
      printItems,
      orders: [],
      workOrders,
      qcRecords: [
        { print_item_no: 'PI-TEST-FIX', passed_qty: 480, failed_qty: 20, inspected_at: '2026-09-17 10:00' },
        { print_item_no: 'PI-TEST-FIX', passed_qty: 30, failed_qty: 0, inspected_at: '2026-09-17 11:00' },
      ],
    });
    expect(rows[0].pending_qty).toBe(0);
  });
});

describe('已棄用的印件不進待驗清單', () => {
  it('訂單上的印件狀態為已棄用時整列排除（那批貨不做了）', () => {
    const rows = calcPendingInspections({
      printItems: [printItemOf('PI-TEST-DROP', '已棄用樣本')],
      orders: [
        {
          order_no: 'ORD-TEST-DROP',
          print_items: [{ print_item_no: 'PI-TEST-DROP', print_item_status: '已棄用' }],
        },
      ],
      workOrders: [workOrderOf('PI-TEST-DROP', [taskOf('pt-only', 500)])],
      qcRecords: [],
    });
    expect(rows).toHaveLength(0);
  });
});
