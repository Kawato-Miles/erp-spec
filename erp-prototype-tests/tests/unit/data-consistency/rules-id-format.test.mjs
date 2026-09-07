import { describe, it, expect } from 'vitest';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_RECIPES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/recipes/_lib/mock-data.js';

// 15.1 編號只有一種格式（原編號 73）
// 印件編號一律 PI 加年份加四碼；工單編號一律 WO 加年份加四碼；配方以 PS 與 BR 開頭的編號認人。
// 舊格式（例如無年份、位數不同）不應再出現在任一模組的 mock 資料中。
describe('15.1 編號只有一種格式', () => {
  const PI_FORMAT = /^PI-\d{4}-\d{4}$/;
  const WO_FORMAT = /^WO-\d{4}-\d{4}$/;
  const RECIPE_FORMAT = /^(PS|BR)-\d{4}-\d{4}(-\d+)?$/;

  it('工單編號一律為 WO 加年份加四碼', () => {
    expect(MOCK_WORK_ORDERS.length).toBeGreaterThan(0);
    MOCK_WORK_ORDERS.forEach((wo) => {
      expect(wo.work_order_no, `${wo.work_order_no} 不符合 WO 格式`).toMatch(WO_FORMAT);
    });
  });

  it('印件編號一律為 PI 加年份加四碼', () => {
    expect(MOCK_PRINT_ITEMS.length).toBeGreaterThan(0);
    MOCK_PRINT_ITEMS.forEach((pi) => {
      expect(pi.print_item_no, `${pi.print_item_no} 不符合 PI 格式`).toMatch(PI_FORMAT);
    });
    // 工單模組內嵌的印件參照也要同一種格式（不同模組各自持有這份印件摘要）
    MOCK_WORK_ORDERS.forEach((wo) => {
      expect(wo.print_item.print_item_no).toMatch(PI_FORMAT);
    });
  });

  it('配方編號一律以 PS 或 BR 開頭（多部件配方可再帶部件序號）', () => {
    expect(MOCK_RECIPES.length).toBeGreaterThan(0);
    MOCK_RECIPES.forEach((r) => {
      expect(r.recipe_no, `${r.recipe_no} 不符合 PS/BR 格式`).toMatch(RECIPE_FORMAT);
    });
  });
});
