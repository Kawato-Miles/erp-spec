import { describe, expect, it } from 'vitest';
import {
  completionDateToWrite,
  printItemOnTimeCompletion,
  printItemOnTimeCompletionRate,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';

// 情境 15.16 印件完工日的寫入、15.17 印件準時完工率的判定。
// 期望值取自 order-management spec（本 change delta）§ 印件完工日寫入與準時完工判定的八條驗收條目。
// 完工日在旗下工單首次全部完成（齊套）那一天寫入、之後不改；短出結案與打樣印件不寫。
// 準時完工率以完工日比對印件內部完成日即時算出，不另存判定結果。

// 大貨印件「乙海報」：印件內部完成日 2026-11-10（二）＝未扣急件內部完成日 2026-11-10、一般件不扣
const poster = (overrides = {}) => ({
  print_item_no: 'PI-TEST-POSTER',
  name: '乙海報',
  type: '大貨印件',
  print_item_status: '製作中',
  undeducted_internal_due_date: '2026-11-10',
  urgent_option_days: 0,
  completion_date: null,
  short_closed: false,
  ...overrides,
});

describe('15.17 印件準時完工率的判定', () => {
  it('首次齊套當天寫入完工日並判準時：2026-11-10 另一張工單完成 → 完工日 2026-11-10，計入分子與分母', () => {
    const written = completionDateToWrite({ printItem: poster(), kittedOn: '2026-11-10' });
    expect(written).toBe('2026-11-10');
    const item = poster({ print_item_status: '製作完成', completion_date: written });
    expect(printItemOnTimeCompletion(item)).toEqual({ counted: true, onTime: true });
    expect(printItemOnTimeCompletionRate([item])).toMatchObject({ numerator: 1, denominator: 1 });
  });

  it('晚於印件內部完成日完工判未準時：2026-11-11 齊套 → 完工日 2026-11-11，計入分母、不計入分子', () => {
    const written = completionDateToWrite({ printItem: poster(), kittedOn: '2026-11-11' });
    expect(written).toBe('2026-11-11');
    const item = poster({ print_item_status: '製作完成', completion_date: written });
    expect(printItemOnTimeCompletion(item)).toEqual({ counted: true, onTime: false });
    expect(printItemOnTimeCompletionRate([item])).toMatchObject({ numerator: 0, denominator: 1 });
  });

  it('印件內部完成日為空時寫入完工日但不計入指標', () => {
    const blank = poster({ undeducted_internal_due_date: null });
    const written = completionDateToWrite({ printItem: blank, kittedOn: '2026-11-10' });
    expect(written).toBe('2026-11-10');
    const item = { ...blank, completion_date: written };
    expect(printItemOnTimeCompletion(item).counted).toBe(false);
    expect(printItemOnTimeCompletionRate([item])).toMatchObject({ numerator: 0, denominator: 0 });
  });

  it('印件內部完成日事後改動時判定依改動後的值；沒有完工日與已棄用的印件不計入', () => {
    const late = poster({ completion_date: '2026-11-11', undeducted_internal_due_date: '2026-11-12' });
    expect(printItemOnTimeCompletion(late)).toEqual({ counted: true, onTime: true });
    expect(printItemOnTimeCompletion(poster()).counted).toBe(false);
    expect(printItemOnTimeCompletion(poster({ completion_date: '2026-11-10', print_item_status: '已棄用' })).counted).toBe(false);
  });

  it('分子分母合併計算：三件中兩件準時、一件未準時、一件沒有完工日', () => {
    const items = [
      poster({ print_item_no: 'A', completion_date: '2026-11-09' }),
      poster({ print_item_no: 'B', completion_date: '2026-11-10' }),
      poster({ print_item_no: 'C', completion_date: '2026-11-13' }),
      poster({ print_item_no: 'D' }),
    ];
    expect(printItemOnTimeCompletionRate(items)).toMatchObject({ numerator: 2, denominator: 3 });
  });
});

describe('15.16 印件完工日的寫入', () => {
  it('先出一批的印件在工單全部完成當天寫入完工日：印製維度已在出貨中，2026-11-12 齊套 → 完工日 2026-11-12', () => {
    const item = poster({ print_item_status: '出貨中' });
    expect(completionDateToWrite({ printItem: item, kittedOn: '2026-11-12' })).toBe('2026-11-12');
  });

  it('補做重開工單後完工日不變：已有 2026-11-10，2026-11-14 再次全部完成 → 不改寫', () => {
    const item = poster({ completion_date: '2026-11-10', print_item_status: '製作完成' });
    expect(completionDateToWrite({ printItem: item, kittedOn: '2026-11-14' })).toBeNull();
  });

  it('短出結案造成的全部完成不寫完工日，該印件不計入分母', () => {
    const item = poster();
    expect(completionDateToWrite({ printItem: item, kittedOn: '2026-11-10', viaShortClose: true })).toBeNull();
    expect(printItemOnTimeCompletion({ ...item, short_closed: true }).counted).toBe(false);
  });

  it('短出結案後售後補做再次全部完成仍不寫完工日', () => {
    const item = poster({ short_closed: true, print_item_status: '已送達' });
    expect(completionDateToWrite({ printItem: item, kittedOn: '2026-11-20' })).toBeNull();
  });

  it('短出結案前已寫入的完工日保留並照常計入', () => {
    const item = poster({ short_closed: true, completion_date: '2026-11-10', print_item_status: '已送達' });
    expect(printItemOnTimeCompletion(item)).toEqual({ counted: true, onTime: true });
  });

  it('打樣印件不寫完工日、不計入印件準時完工率', () => {
    const sample = poster({ type: '打樣印件' });
    expect(completionDateToWrite({ printItem: sample, kittedOn: '2026-11-10' })).toBeNull();
    expect(printItemOnTimeCompletion({ ...sample, completion_date: '2026-11-10' }).counted).toBe(false);
  });

  it('模擬資料：鏈一 PI-2026-0601 完工日 2026-06-18；打樣印件沒有完工日', () => {
    const chainOne = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === 'PI-2026-0601');
    expect(chainOne.completion_date).toBe('2026-06-18');
    MOCK_PRINT_ITEMS.filter((p) => (p.type ?? p.print_item_type) === '打樣印件').forEach((p) => {
      expect(p.completion_date ?? null, p.print_item_no).toBeNull();
    });
  });
});
