import { describe, expect, it } from 'vitest';
import {
  calcKittingGoodQty,
  calcKittingQty,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';
import { calcShortfallQty } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';

// 15.18 完成數與待驗量只依兩層整數倍率換算、15.19 缺口下限 0。
// 算式正本：wiki 印件卡 § 生產與出貨進度；grill G2、G3、G9、G14、G16、G17（production-quantity-audit-20261026）。
// 完成數＝floor(min(生產任務.良品數 ÷ 生產任務.每份工單需生產數量 ÷ 工單.每份印件生產數量))；
// 待驗量是同一個數再扣已驗量。層間沒有單位或拼版換算。

const workOrderOf = (id, tasks, extra = {}) => ({
  id,
  status: '製作中',
  qty_per_print_item: 1,
  print_item: { print_item_no: 'PI-TEST-0001' },
  tasks,
  ...extra,
});

const taskOf = (id, producedQty, extra = {}) => ({
  id,
  name: id,
  count_in_completion: true,
  status: '製作中',
  produced_qty: producedQty,
  good_qty: producedQty,
  qty_per_work_order: 1,
  history: [],
  ...extra,
});

describe('15.18 完成數與待驗量只依兩層整數倍率換算', () => {
  it('鑰匙圈：工單每份印件生產數量 2、任務倍率 1、產出 180，完成數 180 ÷ 1 ÷ 2 ＝ 90', () => {
    const wo = workOrderOf('wo-keychain', [taskOf('pt-keychain', 180)], { qty_per_print_item: 2 });
    expect(calcKittingQty([wo])).toBe(90);
  });

  it('原子筆：筆管 100、筆芯 100、彈簧倍率 2 產出 200，完成數 100', () => {
    const wo = workOrderOf('wo-pen', [
      taskOf('pt-barrel', 100),
      taskOf('pt-refill', 100),
      taskOf('pt-spring', 200, { qty_per_work_order: 2 }),
    ]);
    expect(calcKittingQty([wo])).toBe(100);
  });

  it('除不盡無條件捨去：彈簧產出 199 時 199 ÷ 2 ＝ 99.5，完成數 99', () => {
    const wo = workOrderOf('wo-pen', [
      taskOf('pt-barrel', 100),
      taskOf('pt-spring', 199, { qty_per_work_order: 2 }),
    ]);
    expect(calcKittingQty([wo])).toBe(99);
  });

  it('任務上殘留的拼版換算欄不參與：產出 2,000、帶 print_item_units_per_output 0.25，完成數仍為 2,000', () => {
    const wo = workOrderOf('wo-legacy', [
      taskOf('pt-legacy', 2000, { print_item_units_per_output: 0.25 }),
    ]);
    expect(calcKittingQty([wo])).toBe(2000);
  });

  it('任務倍率未填視為 1', () => {
    const wo = workOrderOf('wo-default', [taskOf('pt-default', 300, { qty_per_work_order: undefined })]);
    expect(calcKittingQty([wo])).toBe(300);
  });

  it('取數範圍：已取消工單、不計入完成度、已作廢與報廢的任務都不參與取最小', () => {
    const counted = workOrderOf('wo-main', [
      taskOf('pt-main', 500),
      taskOf('pt-side', 10, { count_in_completion: false }),
      taskOf('pt-void', 0, { status: '已作廢' }),
      taskOf('pt-scrap', 0, { status: '報廢' }),
    ]);
    const cancelled = workOrderOf('wo-cancel', [taskOf('pt-cancel', 0)], { status: '已取消' });
    expect(calcKittingQty([counted, cancelled])).toBe(500);
  });

  it('完成數只取良品：鑰匙圈產出 180、良品 170、不良 10，完成數 170 ÷ 1 ÷ 2 ＝ 85，齊套良品數同為 85', () => {
    const wo = workOrderOf(
      'wo-keychain',
      [taskOf('pt-keychain', 180, { good_qty: 170 })],
      { qty_per_print_item: 2 },
    );
    expect(calcKittingQty([wo])).toBe(85);
    expect(calcKittingGoodQty([wo])).toBe(85);
  });

  it('補做超量照實：購買 500、補做後末道良品累計 520，完成數 520', () => {
    const wo = workOrderOf('wo-remake', [taskOf('pt-final', 525, { good_qty: 520 })]);
    expect(calcKittingQty([wo])).toBe(520);
  });
});

describe('15.19 缺口＝max(0, 購買數量 − 完工良品數)', () => {
  it('購買 500、完工良品數 480，缺口 20', () => {
    expect(calcShortfallQty(500, 480)).toBe(20);
  });

  it('補做後完工良品數 520 大於購買 500，缺口 0、不出現負數', () => {
    expect(calcShortfallQty(500, 520)).toBe(0);
  });

  it('尚未驗收時缺口等於購買數量', () => {
    expect(calcShortfallQty(500, 0)).toBe(500);
  });

  it('購買數量取不到時不猜，回空值', () => {
    expect(calcShortfallQty(null, 480)).toBeNull();
  });
});

describe('印件層不存目標數量，生產任務不存拼版換算欄（mock 資料）', () => {
  it('印件 mock 沒有 target_qty：購買數量的正本在訂單模組', () => {
    expect(MOCK_PRINT_ITEMS.filter((p) => 'target_qty' in p).map((p) => p.print_item_no)).toEqual([]);
  });

  it('生產任務 mock 沒有 print_item_units_per_output', () => {
    const leftovers = MOCK_WORK_ORDERS.flatMap((wo) =>
      (wo.tasks ?? []).filter((t) => 'print_item_units_per_output' in t).map((t) => t.id),
    );
    expect(leftovers).toEqual([]);
  });
});
