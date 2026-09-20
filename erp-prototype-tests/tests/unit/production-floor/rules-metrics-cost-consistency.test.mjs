import { describe, it, expect } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import {
  MOCK_FLOOR_TASKS,
  MOCK_WORK_REPORTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { calcWorkOrderActualCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/actual-cost.js';
import { calcCostMetrics, calcMetrics } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/metrics.js';
import { sumCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/estimate-cost.js';

// 15.2 五個指標與工單成本對照走同一支算式（原編號 102，併入原編號 25）
// 起點資料：鏈二 WP-2026-0710-01 的「海報四色印刷」與 WO-2026-0710 的成本對照。
// 生管、高階主管或印務先記下五張指標卡的數字與工單成本對照的實際成本；到工作包頁對該任務
// 再報一筆工；回兩個頁面比對：利潤率與成本達成率隨同一筆報工變動，工單成本對照的實際成本
// 同步變動，兩處金額一致（指標卡的成本讀數＝calcCostMetrics，工單成本對照＝
// calcWorkOrderActualCost，兩支共用同一顆 calcWorkOrderActualCost 引擎）。
// 成本達成率的取數為預估成本合計與實際成本合計＝任務小計（不含顏色）加五個色別的顏色費用。
describe('15.2 五個指標與工單成本對照走同一支算式', () => {
  const period = { from: '2026-08-01', to: '2026-09-30', today: '2026-09-05' };
  // 利潤率的分母取印件的小計（未稅），不取「售價」一詞（wiki 生產績效指標 § 規則 4）
  const subtotalOf = (printItemNo) => (printItemNo === 'PI-2026-0710' ? 21.5 * 3000 : null);

  const buildScenario = (workReports) => {
    const workOrders = MOCK_WORK_ORDERS.filter((w) => w.work_order_no === 'WO-2026-0710');
    const cost = calcCostMetrics({
      workOrders,
      workReports,
      period,
      facts: { workReports, floorTasks: MOCK_FLOOR_TASKS },
      subtotalOf,
    });
    const directActual = calcWorkOrderActualCost({
      workOrder: workOrders[0],
      workReports,
      floorTasks: MOCK_FLOOR_TASKS,
    });
    return { cost, directActual };
  };

  it('工單成本對照的實際成本合計＝指標卡母體只有這張工單時的實際成本合計（同一支算式，非各算各的）', () => {
    const { cost, directActual } = buildScenario(MOCK_WORK_REPORTS);
    expect(cost.actualSum).toBe(sumCost(directActual));
  });

  it('工作包對「海報四色印刷」再報一筆工後，兩處金額同步變動且變動量一致', () => {
    const before = buildScenario(MOCK_WORK_REPORTS);
    const extraReport = {
      id: 'wr-test-15-2',
      task_id: 'pt-0710-2',
      input_qty: 500,
      good_qty: 495,
      defect_qty: 5,
      status: '有效',
      reported_at: '2026-09-02 10:00',
    };
    const after = buildScenario([...MOCK_WORK_REPORTS, extraReport]);

    const directDelta = sumCost(after.directActual) - sumCost(before.directActual);
    const costCardDelta = after.cost.actualSum - before.cost.actualSum;

    expect(directDelta).toBeGreaterThan(0);
    expect(costCardDelta).toBe(directDelta);
  });

  it('成本達成率帶正負號；利潤率拆預估與實際兩組、分母同為印件小計，實際那一組隨同一筆報工變動', () => {
    const before = buildScenario(MOCK_WORK_REPORTS);
    const extraReport = {
      id: 'wr-test-15-2b',
      task_id: 'pt-0710-2',
      input_qty: 500,
      good_qty: 500,
      defect_qty: 0,
      status: '有效',
      reported_at: '2026-09-02 11:00',
    };
    const after = buildScenario([...MOCK_WORK_REPORTS, extraReport]);

    expect(after.cost.costAttainment).not.toBe(before.cost.costAttainment);
    // 實際利潤率隨報工變動；預估利潤率不隨報工變動（預估成本是建單當時凍結的）
    expect(after.cost.actualProfitRate).not.toBe(before.cost.actualProfitRate);
    expect(after.cost.estProfitRate).toBe(before.cost.estProfitRate);

    // 成本達成率公式驗算：(實際-預估)/預估
    const expectedAttainment =
      Math.round(((after.cost.actualSum - after.cost.estSum) / after.cost.estSum) * 1000) / 10;
    expect(after.cost.costAttainment).toBe(expectedAttainment);

    // 兩式的分母都是印件小計（未稅），不是售價、也不是含稅金額
    const subtotal = after.cost.subtotalSum;
    expect(subtotal).toBe(21.5 * 3000);
    expect(after.cost.estProfitRate).toBe(
      Math.round(((subtotal - after.cost.estSum) / subtotal) * 1000) / 10,
    );
    expect(after.cost.actualProfitRate).toBe(
      Math.round(((subtotal - after.cost.actualSum) / subtotal) * 1000) / 10,
    );
  });

  it('五指標一次算齊（calcMetrics）的成本讀數與 calcCostMetrics 單獨呼叫一致', () => {
    const workOrders = MOCK_WORK_ORDERS.filter((w) => w.work_order_no === 'WO-2026-0710');
    const metrics = calcMetrics({
      workReports: MOCK_WORK_REPORTS,
      tasks: MOCK_FLOOR_TASKS,
      workOrders,
      subtotalOf,
      period,
    });
    const cost = calcCostMetrics({
      workOrders,
      workReports: MOCK_WORK_REPORTS,
      period,
      facts: { workReports: MOCK_WORK_REPORTS, floorTasks: MOCK_FLOOR_TASKS },
      subtotalOf,
    });
    expect(metrics.grossMargin).toBe(cost.grossMargin);
    expect(metrics.costAttainment).toBe(cost.costAttainment);
  });
});
