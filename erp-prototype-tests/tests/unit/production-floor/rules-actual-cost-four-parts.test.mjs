import { describe, it, expect } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import {
  MOCK_FLOOR_TASKS,
  MOCK_WORK_REPORTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { calcWorkOrderActualCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/actual-cost.js';

// 15.3 印件層的實際成本由四個分項各自對得回事實（原編號 109）
// 起點資料：鏈一 PI-2026-0601（四分項齊備）、鏈二 PI-2026-0710（報工後即時變動）、
// 鏈三 PI-2026-0815（旗下工單全無報工）。
// 四分項與預估同名同算式，只把數量輸入換成該任務有效報工的生產數量（投入）累計；
// 設備費只算階梯價、不含開機費。鏈二印件報工後實際成本即時變動。鏈三印件顯示尚無資料，不填 0。
describe('15.3 印件層的實際成本由四個分項各自對得回事實', () => {
  const actualCostOf = (workOrderNo, workReports) => {
    const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === workOrderNo);
    return calcWorkOrderActualCost({ workOrder, workReports, floorTasks: MOCK_FLOOR_TASKS });
  };

  it('鏈一 WO-2026-0601 已全數報工完成，實際成本四分項皆有事實（hasFact 為真）', () => {
    const actual = actualCostOf('WO-2026-0601', MOCK_WORK_REPORTS);
    expect(actual.hasFact).toBe(true);
    // 四分項一律非負，且合計大於 0（有真的投入才有真的成本）
    expect(actual.material + actual.process + actual.binding + actual.equipment).toBeGreaterThan(0);
  });

  it('鏈三 WO-2026-0815 旗下工單全無報工，實際成本顯示尚無資料（hasFact 為假），不是四個 0', () => {
    const actual = actualCostOf('WO-2026-0815', MOCK_WORK_REPORTS);
    expect(actual.hasFact).toBe(false);
  });

  it('鏈二 WO-2026-0710 報工後實際成本即時變動：多報一筆工，材料費不變、工序費隨投入增加', () => {
    const before = actualCostOf('WO-2026-0710', MOCK_WORK_REPORTS);
    expect(before.hasFact).toBe(true);

    // 模擬對印刷任務（pt-0710-2，目前累計投入 2,000）再報一筆工：投入 500、良品 500、不良 0
    const extraReport = {
      id: 'wr-test-extra',
      task_id: 'pt-0710-2',
      input_qty: 500,
      good_qty: 500,
      defect_qty: 0,
      status: '有效',
      reported_at: '2026-09-01 10:00',
    };
    const after = actualCostOf('WO-2026-0710', [...MOCK_WORK_REPORTS, extraReport]);

    // 材料任務（pt-0710-1）投入不變，材料費維持同一個數字
    expect(after.material).toBe(before.material);
    // 印刷任務（工序）投入從 2,000 累計到 2,500，工序費隨之增加（同一支算式重算，不是另存欄位）
    expect(after.process).toBeGreaterThan(before.process);
  });

  it('報工作廢時投入累計回落，實際成本跟著回沖（作廢報工不計入 isActiveReport）', () => {
    const voidedReport = {
      id: 'wr-test-voided',
      task_id: 'pt-0710-2',
      input_qty: 9999,
      good_qty: 9999,
      defect_qty: 0,
      status: '已作廢',
      reported_at: '2026-09-01 10:00',
    };
    const withVoided = actualCostOf('WO-2026-0710', [...MOCK_WORK_REPORTS, voidedReport]);
    const baseline = actualCostOf('WO-2026-0710', MOCK_WORK_REPORTS);
    // 已作廢的報工不進有效報工累計，成本與沒有這筆報工時一致
    expect(withVoided.process).toBe(baseline.process);
  });
});
