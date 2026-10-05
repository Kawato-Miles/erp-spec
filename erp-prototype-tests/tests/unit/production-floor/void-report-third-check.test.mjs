import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

// 情境 10.20「已被品檢驗過的良品不可作廢報工，也不可調降良品」的判定驗算。
// 報工修改與作廢共用的一道檢核：改後或作廢後該印件做出來的良品不可低於已驗量，違反即整筆擋下。
// 與另外幾道（量已被下游點收或在途、下游已開工）並列，任一命中即擋（見 10.35）。
// 報工修改 editWorkReport 的契約見 report-edit-and-void.test.mjs 檔頭。
//
// 合成資料的理由：鏈四 PT-0820-9 精裝裝訂是同一種情形，但該筆任務已完成，作廢會先被
// 「已完成的任務不可作廢報工」擋下，走不到這一道檢核。本檔的任務刻意停在製作中。

const PRINT_ITEM_NO = 'PI-TEST-VOID';
const TASK_ID = 'pt-test-void';
const REPORT_ID = 'wr-test-void';

const seed = (qcRecords) => {
  useWorkOrdersStore.setState({
    workOrders: [
      {
        id: 'wo-test-void',
        work_order_no: 'WO-TEST-VOID',
        status: '製作中',
        work_order_type: '一般',
        qty_per_print_item: 1,
        print_item: { print_item_no: PRINT_ITEM_NO },
        tasks: [
          {
            id: TASK_ID,
            name: '精裝裝訂',
            count_in_completion: true,
            status: '製作中',
            input_qty: 500,
            good_qty: 500,
            produced_qty: 500,
            qty_per_work_order: 1,
            print_item_units_per_output: 1,
            // 末道不需轉交：貨還在站上，既有的轉交與點收兩道檢核因此都不會先命中
            needs_transfer: false,
            history: [],
          },
        ],
      },
    ],
  });
  useProductionFloorStore.setState({
    tasks: [
      {
        id: TASK_ID,
        source_task_id: TASK_ID,
        name: '精裝裝訂',
        work_order_no: 'WO-TEST-VOID',
        status: '製作中',
        input_qty: 500,
        good_qty: 500,
        produced_qty: 500,
        needs_transfer: false,
        depends_on: [],
        history: [],
      },
    ],
    workReports: [
      {
        id: REPORT_ID,
        task_id: TASK_ID,
        input_qty: 500,
        good_qty: 500,
        defect_qty: 0,
        status: '已送出',
        reporter: '陳金水',
      },
    ],
    transferTickets: [],
  });
  usePrintItemsStore.setState({
    printItems: [{ print_item_no: PRINT_ITEM_NO, name: '作廢樣本', print_item_type: '大貨印件' }],
    qcRecords,
  });
};

const qcRecordOf = (passed, failed, at) => ({
  print_item_no: PRINT_ITEM_NO,
  passed_qty: passed,
  failed_qty: failed,
  inspected_at: at,
});

const voidIt = () =>
  useProductionFloorStore.getState().voidWorkReport(REPORT_ID, {
    reason: '誤報',
    by: '陳金水',
  });

const taskGoodQty = () => useProductionFloorStore.getState().tasks[0].good_qty;
const reportStatus = () => useProductionFloorStore.getState().workReports[0].status;

describe('10.20 已被品檢驗過的良品不可作廢報工，也不可調降良品', () => {
  it('品檢已驗收通過 500 時作廢整筆擋下，訊息帶出已驗量與該做的下一步', () => {
    seed([qcRecordOf(500, 0, '2026-09-18 10:00')]);
    const result = voidIt();
    expect(result.ok).toBe(false);
    // 修改與作廢共用同一句訊息（情境目錄 10.20）：只驗規格要求的已驗量與下一步
    expect(result.error).toContain('該印件已驗收 500 件');
    expect(result.error).toContain('請先請品檢人員補更正紀錄');
    // 擋下就是整筆不寫：報工紀錄與任務累計都留在原樣
    expect(reportStatus()).toBe('已送出');
    expect(taskGoodQty()).toBe(500);
  });

  it('已驗量取通過與不通過的代數和，不只看通過那一本', () => {
    seed([qcRecordOf(480, 20, '2026-09-18 10:00')]);
    const result = voidIt();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('已驗收 500 件');
  });

  it('把良品改為 400 的修改同樣整筆擋下，訊息帶出已驗量與該做的下一步', () => {
    seed([qcRecordOf(500, 0, '2026-09-18 10:00')]);
    const result = useProductionFloorStore.getState().editWorkReport(REPORT_ID, {
      good_qty: 400,
      reason: '誤報',
      by: '陳金水',
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('該印件已驗收 500 件');
    expect(result.error).toContain('請先請品檢人員補更正紀錄');
    expect(useProductionFloorStore.getState().workReports[0].good_qty).toBe(500);
    expect(taskGoodQty()).toBe(500);
  });

  it('品檢人員補一筆通過 −500 的更正紀錄後，同一筆報工作廢成立', () => {
    seed([qcRecordOf(500, 0, '2026-09-18 10:00'), qcRecordOf(-500, 0, '2026-09-18 11:00')]);
    const result = voidIt();
    expect(result.ok).toBe(true);
    expect(reportStatus()).toBe('已作廢');
    expect(taskGoodQty()).toBe(0);
  });

  it('那件印件根本還沒被驗過時這一道不擋（作廢照常成立）', () => {
    seed([]);
    expect(voidIt().ok).toBe(true);
    expect(taskGoodQty()).toBe(0);
  });

  it('作廢後的良品仍不低於已驗量時放行（已驗 200、作廢後仍有 300）', () => {
    seed([qcRecordOf(200, 0, '2026-09-18 10:00')]);
    // 這一筆報工只佔 200：作廢後該任務還剩 300 件良品，仍蓋得住已驗量
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => ({ ...t, input_qty: 500, good_qty: 500, produced_qty: 500 })),
      workReports: s.workReports.map((r) => ({ ...r, input_qty: 200, good_qty: 200 })),
    }));
    const result = voidIt();
    expect(result.ok).toBe(true);
    expect(taskGoodQty()).toBe(300);
  });
});

describe('10.20（既有檢核）已完成的生產任務先被擋在前一道', () => {
  beforeEach(() => {
    seed([qcRecordOf(500, 0, '2026-09-18 10:00')]);
    useProductionFloorStore.setState((s) => ({
      tasks: s.tasks.map((t) => ({ ...t, status: '已完成' })),
    }));
  });

  it('任務已完成時擋下的是狀態那一道，訊息指向人工程序', () => {
    const result = voidIt();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('該生產任務已完成，報工不可作廢');
  });
});
