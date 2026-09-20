import { describe, expect, it } from 'vitest';
import {
  calcPrintItemProfit,
  formatRate,
  PROFIT_BANDS,
  profitBandOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/profit.js';
import {
  canSeePrintItemCost,
  canSeePrintItemProfit,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/permissions.js';

// 15.8 印件的四式利潤與三段門檻
// 期望值取自 openspec production-overview § 利潤率以小計為分母、
// sales-platform § 業務於報價與利潤頁籤只見五欄，算式正本為 wiki 生產績效指標 § 規則 4。
// 分母一律是印件小計（未稅），不取「售價」一詞。

describe('15.8 印件的預估與實際兩組利潤、四式共用同一個分母', () => {
  const ANCHOR = { subtotal: 50000, estCost: 42000, actualCost: 45150 };

  it('小計 50,000、預計成本 42,000、實際成本 45,150 時四式的讀數', () => {
    const r = calcPrintItemProfit(ANCHOR);
    expect(r.estProfit).toBe(8000);
    expect(Number(r.estRate.toFixed(1))).toBe(16.0);
    expect(r.actualProfit).toBe(4850);
    expect(Number(r.actualRate.toFixed(1))).toBe(9.7);
  });

  it('小計為空時四式皆為空，畫面顯示破折號、不顯示 0%', () => {
    const r = calcPrintItemProfit({ subtotal: null, estCost: 42000, actualCost: 45150 });
    expect(r.estProfit).toBeNull();
    expect(r.estRate).toBeNull();
    expect(r.actualProfit).toBeNull();
    expect(r.actualRate).toBeNull();
    expect(formatRate(r.estRate)).toBe('－');
  });

  it('旗下工單全無報工事實時只有預估算得出來，實際兩式為空', () => {
    const r = calcPrintItemProfit({ subtotal: 50000, estCost: 42000, actualCost: null });
    expect(r.estProfit).toBe(8000);
    expect(r.actualProfit).toBeNull();
    expect(r.actualRate).toBeNull();
  });
});

describe('15.9 利潤率的三段門檻只標示、不分出第四段', () => {
  it('38.0% 落在 35% 以上那一段', () => {
    expect(profitBandOf(38.0)).toBe(PROFIT_BANDS.HIGH);
  });

  it('16.0% 落在 20% 以下那一段', () => {
    expect(profitBandOf(16.0)).toBe(PROFIT_BANDS.LOW);
  });

  it('門檻值落在段的下界：35% 屬上段、20% 屬中段', () => {
    expect(profitBandOf(35)).toBe(PROFIT_BANDS.HIGH);
    expect(profitBandOf(20)).toBe(PROFIT_BANDS.MID);
  });

  it('負數仍落在 20% 以下那一段，不另立一段', () => {
    expect(profitBandOf(-12.5)).toBe(PROFIT_BANDS.LOW);
  });

  it('取不到利潤率時不標示', () => {
    expect(profitBandOf(null)).toBeNull();
  });
});

describe('15.10 報價與利潤的兩層可見範圍', () => {
  it('成本兩欄限印務、印務主管與主管', () => {
    for (const role of ['print_officer', 'print_manager', 'supervisor']) {
      expect(canSeePrintItemCost(role)).toBe(true);
    }
    for (const role of ['sales', 'sales_manager', 'order_manager', 'qc_inspector', 'master']) {
      expect(canSeePrintItemCost(role)).toBe(false);
    }
  });

  it('印件小計與四個利潤欄另開放業務與業務主管', () => {
    for (const role of ['print_officer', 'print_manager', 'supervisor', 'sales', 'sales_manager']) {
      expect(canSeePrintItemProfit(role)).toBe(true);
    }
    for (const role of [
      'consultant',
      'accountant',
      'order_manager',
      'reviewer',
      'production_planner',
      'master',
      'qc_inspector',
    ]) {
      expect(canSeePrintItemProfit(role)).toBe(false);
    }
  });
});

// 15.3 補充：印件層的預計成本＝旗下**全部未作廢工單**的預估成本合計加總
// 期望值取自 openspec work-order § 預估成本凍結的兩個 Scenario（本體 30,000、封面 8,000、
// 配件 4,000 → 42,000；配件工單轉已作廢後 → 38,000）。系統不以任一張工單的合計充當印件層成本。
describe('15.3 印件預計成本取旗下全部未作廢工單的彙總', () => {
  const summaryOf = (subtotal) => ({
    est: {
      subtotal,
      colors: { single_black: 0, cmyk: 0, pantone: 0, metallic: 0, metal_only: 0 },
    },
    actual: null,
  });

  it('本體 30,000、封面 8,000、配件 4,000 三張工單彙總為 42,000', async () => {
    const { aggregatePrintItemCost } = await import(
      '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/detail-selectors.js'
    );
    const cost = aggregatePrintItemCost([summaryOf(30000), summaryOf(8000), summaryOf(4000)]);
    expect(cost.estTotal).toBe(42000);
  });

  it('配件工單轉已作廢、自彙總剔除後為 38,000', async () => {
    const { aggregatePrintItemCost } = await import(
      '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/detail-selectors.js'
    );
    const cost = aggregatePrintItemCost([summaryOf(30000), summaryOf(8000)]);
    expect(cost.estTotal).toBe(38000);
  });

  it('旗下工單全無報工事實時實際成本為空，不以 0 代入', async () => {
    const { aggregatePrintItemCost } = await import(
      '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/detail-selectors.js'
    );
    const cost = aggregatePrintItemCost([summaryOf(30000)]);
    expect(cost.actualTotal).toBeNull();
  });
});
