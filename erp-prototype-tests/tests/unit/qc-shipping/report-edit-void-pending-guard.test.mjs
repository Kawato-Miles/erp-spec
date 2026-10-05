// 情境目錄 11.19：報工修改或作廢會讓待驗量變負時擋下，待驗量不出現負數。
//
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的
// qc 規格差異檔 § 待驗清單「報工修改或作廢會讓待驗量變負時擋下」的 THEN：
// 兩者都整筆擋下、顯示該印件已驗量 600；待驗量維持 0、不出現負數；列照樣留在清單上標示已驗完。
// 擋下條件的正本見 wiki 場內轉交與更正 § 副流程「報工要修改或作廢」。
//
// 起點資料為合成資料（情境目錄 11.19）：一件印件已驗收通過 600，
// 其唯一一筆計入完成度任務的報工良品 600。任務刻意停在製作中（目標 1,000）：
// 已完成的任務作廢會先被「已完成任務作廢擋下、改走修改」那一道擋住，走不到已驗量這一道。
//
// 本檔先於實作寫成（task 2.10），報工修改的寫入路徑尚未存在，修改那一條跑起來應為紅：
//   production-floor/_lib/store.js
//     editWorkReport(reportId, { input_qty, good_qty, defect_qty, reason, by }) → { ok, error }
//       與 voidWorkReport 共用擋下條件；擋下時整筆不寫，報工紀錄與任務累計維持原樣。
//   （函式名由本檔先定；生產側純函式測試若另定名稱，以兩邊對齊後的名稱為準。）
import { beforeEach, describe, expect, it } from 'vitest';
import { calcPendingInspections } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/pending-inspections.js';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

const PRINT_ITEM_NO = 'PI-TEST-1119';
const TASK_ID = 'pt-test-1119';
const REPORT_ID = 'wr-test-1119';

const taskFields = {
  name: '精裝裝訂',
  count_in_completion: true,
  status: '製作中',
  target_qty: 1000,
  input_qty: 600,
  good_qty: 600,
  produced_qty: 600,
  qty_per_work_order: 1,
  print_item_units_per_output: 1,
  // 末道不需轉交：貨還在站上，轉交與點收那兩道擋下條件不會先命中
  needs_transfer: false,
  depends_on: [],
  history: [],
};

beforeEach(() => {
  useWorkOrdersStore.setState({
    workOrders: [
      {
        id: 'wo-test-1119',
        work_order_no: 'WO-TEST-1119',
        status: '製作中',
        work_order_type: '一般',
        qty_per_print_item: 1,
        print_item: { print_item_no: PRINT_ITEM_NO, name: '待驗量樣本' },
        tasks: [{ id: TASK_ID, ...taskFields }],
      },
    ],
  });
  useProductionFloorStore.setState({
    tasks: [{ id: TASK_ID, source_task_id: TASK_ID, work_order_no: 'WO-TEST-1119', ...taskFields }],
    workReports: [
      {
        id: REPORT_ID,
        task_id: TASK_ID,
        input_qty: 600,
        good_qty: 600,
        defect_qty: 0,
        status: '有效',
        reporter: '陳金水',
      },
    ],
    transferTickets: [],
  });
  usePrintItemsStore.setState({
    printItems: [{ print_item_no: PRINT_ITEM_NO, name: '待驗量樣本', print_item_type: '大貨印件' }],
    qcRecords: [
      {
        id: 'qc-test-1119',
        print_item_no: PRINT_ITEM_NO,
        passed_qty: 600,
        failed_qty: 0,
        photos: ['品檢照-待驗量樣本-01.jpg'],
        inspected_at: '2026-09-18 10:00',
        inspector: '郭淑芬',
      },
    ],
  });
});

const floor = () => useProductionFloorStore.getState();
const report = () => floor().workReports.find((r) => r.id === REPORT_ID);
const floorTask = () => floor().tasks.find((t) => t.id === TASK_ID);

const pendingRow = () =>
  calcPendingInspections({
    printItems: usePrintItemsStore.getState().printItems,
    orders: [],
    workOrders: useWorkOrdersStore.getState().workOrders,
    floorTasks: floor().tasks,
    qcRecords: usePrintItemsStore.getState().qcRecords,
  }).find((r) => r.print_item_no === PRINT_ITEM_NO);

describe('11.19 報工修改或作廢會讓待驗量變負時擋下，待驗量不出現負數', () => {
  it('起點：已驗 600、良品 600，待驗量為 0、列留在清單上', () => {
    const row = pendingRow();
    expect(row).toBeTruthy();
    expect(row.inspected_pass).toBe(600);
    expect(row.pending_qty).toBe(0);
  });

  it('師傅作廢該筆報工：整筆擋下並顯示該印件已驗量 600，待驗量維持 0', () => {
    const result = floor().voidWorkReport(REPORT_ID, { reason: '誤報', by: '劉阿海' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('600');
    expect(report().status).toBe('有效');
    expect(floorTask().good_qty).toBe(600);
    const row = pendingRow();
    expect(row.pending_qty).toBe(0);
  });

  it('印務把那筆報工的良品改為 500：整筆擋下並顯示該印件已驗量 600，待驗量維持 0、不出現負數', () => {
    expect(typeof floor().editWorkReport, '尚未實作 editWorkReport').toBe('function');
    const result = floor().editWorkReport(REPORT_ID, {
      input_qty: 600,
      good_qty: 500,
      defect_qty: 100,
      reason: '良品點錯數',
      by: '周建宏',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('600');
    expect(report().good_qty).toBe(600);
    expect(floorTask().good_qty).toBe(600);
    const row = pendingRow();
    expect(row).toBeTruthy();
    expect(row.pending_qty).toBe(0);
  });
});
