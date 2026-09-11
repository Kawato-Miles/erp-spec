import { describe, it, expect } from 'vitest';
import {
  computeOrderDeadline,
  computeOrderDaysToDeadline,
  orderReviewSortKeyOf,
  compareOrdersByReviewSortKey,
  isPrintItemUrgent,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/prepress-review/_lib/selectors.js';

// 5.13 待審清單依印件內部完成日排序、空值排最後
// prepress-review spec § 待審清單排序與停滯規則：待審清單（含待審訂單模組）依印件「內部完成日」
// 近者優先排序，空值排在有值之後，同組依印件編號排序；系統不用建立時間先進先出。
// 印件不存這個日期欄，內部完成日一律由印件自身的預計出貨日 − 1 天 − 急件選項凍結天數推導
// （order-management spec § 印件預計交期推導）。
// 畫面上母列以「訂單」為單位呈現（ReviewOrderList.js defaultExpandAllRows，
// 排序只作用在 orders.sort(compareOrdersByReviewSortKey)），故用訂單級的排序鍵函式驗算；
// 每張測試訂單只掛一件印件時，訂單的排序鍵等於該印件自身的內部完成日，等同驗證 spec Scenario
// 「審稿人員名下三件待審印件」的排序結果。

const item = (printItemNo, orderDueDate, overrides = {}) => ({
  print_item_no: printItemNo,
  review_status: '等待審稿',
  print_item_status: '製程已確認',
  order_due_date: orderDueDate,
  urgent_option_days: 0,
  ...overrides,
});

const order = (orderNo, items) => ({ order_no: orderNo, status: '製作等待中', print_items: items });

describe('5.13 待審清單依印件內部完成日排序、空值排最後', () => {
  it('依印件內部完成日近者優先排序（spec 範例 09-18、09-20、09-25）', () => {
    // 預計出貨日 − 1 天（一般件，凍結天數 0）＝ 內部完成日
    const orders = [
      order('ORD-A', [item('PI-A', '2026-09-21')]), // 內部完成日 2026-09-20
      order('ORD-B', [item('PI-B', '2026-09-26')]), // 內部完成日 2026-09-25
      order('ORD-C', [item('PI-C', '2026-09-19')]), // 內部完成日 2026-09-18
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-C', 'ORD-A', 'ORD-B']);
  });

  it('印件預計出貨日未填（內部完成日為空）者排在有值之後', () => {
    const orders = [
      order('ORD-EMPTY', [item('PI-EMPTY', null)]),
      order('ORD-LATE', [item('PI-LATE', '2026-09-21')]), // 內部完成日 2026-09-20
      order('ORD-EARLY', [item('PI-EARLY', '2026-09-19')]), // 內部完成日 2026-09-18
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-EARLY', 'ORD-LATE', 'ORD-EMPTY']);
  });

  it('全數待審印件皆已收斂或無交期時排到最後，訂單本身不受此影響出清單', () => {
    // ORD-DONE 的唯一印件已到「已確認可製作」，不再計入待審母集合的排序候選
    const noPending = order('ORD-DONE', [
      item('PI-DONE', '2026-09-01', { review_status: '已確認可製作' }),
    ]);
    const withPending = order('ORD-PENDING', [item('PI-PENDING', '2026-09-30')]);

    const key = orderReviewSortKeyOf(noPending);
    expect(key.date).toBeNull();

    const sorted = [noPending, withPending]
      .sort(compareOrdersByReviewSortKey)
      .map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-PENDING', 'ORD-DONE']);
  });

  it('同一筆內部完成日時依印件編號排序（決勝規則）', () => {
    const orders = [
      order('ORD-Z', [item('PI-Z9', '2026-09-11')]),
      order('ORD-Y', [item('PI-A1', '2026-09-11')]),
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    // PI-A1 < PI-Z9（字母序），故掛 PI-A1 的訂單排前面
    expect(sorted).toEqual(['ORD-Y', 'ORD-Z']);
  });
});

// tasks.md 任務 6.5（prepress-review spec § 待審清單排序與停滯規則 Scenario「急單標示取印件
// 急件選項」）：急單標示只取印件的急件選項凍結天數，訂單層已無任何形式的急件欄位。
// 補一筆迴歸測試，防止未來又誤讀訂單層欄位。
describe('6.5 急單標示取印件急件選項，不誤讀訂單層欄位', () => {
  it('isPrintItemUrgent 只依印件自身的急件選項判定', () => {
    const urgentItem = item('PI-URGENT', '2026-09-20', {
      urgent_option_days: 3,
      urgent_option_name: '三天急件',
      is_urgent: false, // 刻意放矛盾值：若函式誤讀外層（訂單層）欄位就會判成非急件
    });
    const normalItem = item('PI-NORMAL', '2026-09-20', {
      is_urgent: true, // 一般件本身凍結天數為 0，即使外層帶 is_urgent: true 也不判成急件
    });
    expect(isPrintItemUrgent(urgentItem)).toBe(true);
    expect(isPrintItemUrgent(normalItem)).toBe(false);
  });
});

// 5.15 母列的預計出貨日取旗下未收斂印件最早的那一個
// prepress-review spec § 審稿訂單脈絡查詢視圖：訂單層已無交期欄，待審訂單模組母列那一格改由
// 旗下**未收斂**印件（審稿維度未達「已確認可製作」、未棄用）的預計出貨日取最早值；已收斂的
// 印件不納入，全數留空時取值為空、畫面兩欄皆顯示破折號，不拿已收斂印件的值頂替。
describe('5.15 母列的預計出貨日取旗下未收斂印件最早的那一個', () => {
  it('取未收斂印件的最早值，已收斂印件不納入', () => {
    const target = order('ORD-MIX', [
      item('PI-LATE', '2026-09-25'),
      item('PI-EARLY', '2026-09-20'),
      // 已確認可製作＝已收斂：日期最早，但不該被母列取用
      item('PI-SETTLED', '2026-09-01', { review_status: '已確認可製作' }),
    ]);
    expect(computeOrderDeadline(target)).toBe('2026-09-20');
  });

  it('旗下印件的預計出貨日全部留空時取值為空，距交期天數同樣為空', () => {
    const blank = order('ORD-BLANK', [item('PI-B1', null), item('PI-B2', null)]);
    expect(computeOrderDeadline(blank)).toBeNull();
    expect(computeOrderDaysToDeadline(blank)).toBeNull();
  });

  it('只有已收斂印件有日期時不拿它頂替，取值仍為空', () => {
    const onlySettled = order('ORD-ONLY-SETTLED', [
      item('PI-S1', '2026-09-01', { review_status: '已確認可製作' }),
      item('PI-S2', null),
    ]);
    expect(computeOrderDeadline(onlySettled)).toBeNull();
  });
});
