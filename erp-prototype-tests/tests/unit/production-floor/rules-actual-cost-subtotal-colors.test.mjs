import { describe, it, expect } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import {
  MOCK_FLOOR_TASKS,
  MOCK_WORK_REPORTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { calcWorkOrderActualCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/actual-cost.js';
import {
  COLOR_KEYS,
  estimateTaskCost,
  sumColors,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/estimate-cost.js';
import { findEquipment } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/bom-master-mock.js';

// 15.3 印件層的實際成本合計由任務小計與各顏色費用對得回事實（原編號 109）
// 起點資料：鏈一 PI-2026-0601（已有報工事實）、鏈二 PI-2026-0710（報工後即時變動）、
// 鏈三 PI-2026-0815（旗下工單全無報工）。
// 實際側與預估側欄位組成同、算式同，只把數量輸入換成該任務有效報工的生產數量（投入）累計；
// 顏色費用的實際值只取階梯價、不含開機費，開機費也不進任務實際小計。
describe('15.3 印件層的實際成本合計由任務小計與各顏色費用對得回事實', () => {
  const actualCostOf = (workOrderNo, workReports) => {
    const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === workOrderNo);
    return calcWorkOrderActualCost({ workOrder, workReports, floorTasks: MOCK_FLOOR_TASKS });
  };

  it('鏈一 WO-2026-0601 已全數報工完成，任務小計與顏色費用都有事實（hasFact 為真）', () => {
    const actual = actualCostOf('WO-2026-0601', MOCK_WORK_REPORTS);
    expect(actual.hasFact).toBe(true);
    expect(actual.subtotal).toBeGreaterThan(0);
    // 該工單的印刷任務登記 CMYK 四色，實際側的顏色費用：CMYK 算得出金額
    expect(actual.colors.cmyk).toBeGreaterThan(0);
  });

  it('顏色群固定五個色別，未登記者為 0、不回傳 undefined', () => {
    const actual = actualCostOf('WO-2026-0601', MOCK_WORK_REPORTS);
    expect(Object.keys(actual.colors).sort()).toEqual([...COLOR_KEYS].sort());
    COLOR_KEYS.forEach((key) => expect(Number.isFinite(actual.colors[key])).toBe(true));
    expect(actual.colors.pantone).toBe(0);
    expect(actual.colors.metallic).toBe(0);
    expect(actual.colors.metal_only).toBe(0);
  });

  it('鏈三 WO-2026-0815 旗下工單全無報工，實際成本顯示尚無資料（hasFact 為假），不是一整排 0', () => {
    const actual = actualCostOf('WO-2026-0815', MOCK_WORK_REPORTS);
    expect(actual.hasFact).toBe(false);
  });

  it('鏈二 WO-2026-0710 報工後即時變動：材料任務小計不變、印刷任務的小計與顏色費用隨投入增加', () => {
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

    // 材料任務（pt-0710-1）投入不變，它的任務實際小計維持同一個數字
    expect(after.byTask['pt-0710-1'].subtotal).toBe(before.byTask['pt-0710-1'].subtotal);
    // 印刷任務投入從 2,000 累計到 2,500，工序費隨之增加（同一支算式重算，不是另存欄位）
    expect(after.byTask['pt-0710-2'].subtotal).toBeGreaterThan(
      before.byTask['pt-0710-2'].subtotal,
    );
    expect(after.subtotal).toBeGreaterThan(before.subtotal);
  });

  it('顏色費用的實際值只取階梯價：平版的開機費不進任務實際小計、也不進任何顏色列', () => {
    const actual = actualCostOf('WO-2026-0710', MOCK_WORK_REPORTS);
    const printing = actual.byTask['pt-0710-2'];
    const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0710');
    const task = workOrder.tasks.find((t) => t.id === 'pt-0710-2');
    const equipment = findEquipment('海德堡 SM102 四色機');
    // 以該任務有效報工的投入累計（2,000）代入同一支引擎，扣掉開機費即為實際小計
    const recomputed = estimateTaskCost({ ...task, target_qty: 2000 });
    expect(printing.subtotal).toBe(recomputed.subtotal - equipment.setup_cost);
    // 顏色列取的是階梯價本身，預估與實際同一條算式、只換數量輸入
    expect(printing.colors.cmyk).toBe(recomputed.colors.cmyk);
    expect(printing.colors.cmyk).toBeGreaterThan(0);
  });

  it('材料任務即使填了計畫設備也不扣開機費：預估側本來就沒加這一段，實際小計等於同一支引擎重算的值', () => {
    const actual = actualCostOf('WO-2026-0710', MOCK_WORK_REPORTS);
    const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0710');
    const material = workOrder.tasks.find((t) => t.id === 'pt-0710-1');
    // 這筆是材料型任務、卻掛著平版機（計畫設備供排程分組用，不代表它在上機）
    expect(material.task_type).toBe('材料');
    expect(material.planned_equipment).toBe('海德堡 SM102 四色機');
    expect(findEquipment(material.planned_equipment).pricing_type).toBe('平版');
    // 有效報工的投入累計代入同一支引擎，結果原樣就是實際小計（不再扣一次開機費）
    const inputQty = MOCK_WORK_REPORTS.filter(
      (r) => r.task_id === 'pt-0710-1' && r.status !== '已作廢',
    ).reduce((acc, r) => acc + r.input_qty, 0);
    const recomputed = estimateTaskCost({ ...material, target_qty: inputQty });
    expect(actual.byTask['pt-0710-1'].subtotal).toBe(recomputed.subtotal);
    expect(actual.byTask['pt-0710-1'].subtotal).toBeGreaterThan(0);
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
    expect(withVoided.subtotal).toBe(baseline.subtotal);
    expect(sumColors(withVoided.colors)).toBe(sumColors(baseline.colors));
  });
});
