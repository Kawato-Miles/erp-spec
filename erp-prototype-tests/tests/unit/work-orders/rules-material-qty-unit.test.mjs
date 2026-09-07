import { describe, it, expect } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { deriveTargetQty } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/target-qty.js';
import { estimateTaskCost, sumCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/estimate-cost.js';

// 15.4 材料數量與售價是同一個量級（原編號 111）
// 起點資料：錨例 PI-2026-0801 名片與 WO-2026-0908。
// 備料任務的目標數量以備料張計，不是成品件數；毛利率不會出現負三位數。
// 數字：備料 628 張八開，除以開料數 8 進位為 79 張四六全，乘供應商原料單張進價 6.95 元，
// 材料費 549 元。
describe('15.4 材料數量與售價是同一個量級', () => {
  const WORK_ORDER_NO = 'WO-2026-0908';

  it('備料任務的目標數量以備料張（名片八開）計，不是成品件數（訂單購買數量 123 盒）', () => {
    const wo = MOCK_WORK_ORDERS.find((w) => w.work_order_no === WORK_ORDER_NO);
    expect(wo).toBeTruthy();
    const materialTask = wo.tasks.find((t) => t.task_type === '材料');
    expect(materialTask).toBeTruthy();
    // 目標數量＝預計生產 615 ＋放損 13＝628，與工單「每份印件生產數量」（123）不同量級，
    // 證明這裡填的是備料張數而非成品件數
    expect(deriveTargetQty(materialTask)).toBe(628);
    expect(wo.target_qty).toBe(123);
    expect(deriveTargetQty(materialTask)).not.toBe(wo.target_qty);
  });

  it('材料費＝ceil(628÷8)＝79 張四六全 × 供應商原料單張進價 6.95 元＝549 元（與 est_cost 一致）', () => {
    const wo = MOCK_WORK_ORDERS.find((w) => w.work_order_no === WORK_ORDER_NO);
    const materialTask = wo.tasks.find((t) => t.task_type === '材料');

    // 換算單位是這條情境唯一容易算錯量級的一步：628 張八開 ÷ 8（開料數）進位為 79 張四六全
    const sheetsFromEighthCut = Math.ceil(628 / 8);
    expect(sheetsFromEighthCut).toBe(79);
    expect(Math.round(sheetsFromEighthCut * 6.95)).toBe(549);

    // 引擎重算的材料費與 mock 存的 est_cost 一致，兩處不是各自寫一套算式
    const recalculated = estimateTaskCost(materialTask);
    expect(recalculated.material).toBe(549);
    expect(recalculated.material).toBe(materialTask.est_cost.material);
  });

  it('毛利率不會出現負三位數：整張工單的預估成本合計遠小於印件小計（123 盒 × 單價）', () => {
    const wo = MOCK_WORK_ORDERS.find((w) => w.work_order_no === WORK_ORDER_NO);
    const estTotal = wo.tasks.reduce((acc, t) => acc + sumCost(t.est_cost), 0);
    // 名片單價現行牌價遠高於材料費一張的量級；若材料成本誤乘到成品件數量級（例如 123 × 549），
    // estTotal 會爆到六位數以上、毛利率就會出現負三位數
    expect(estTotal).toBeLessThan(10000);
  });
});
