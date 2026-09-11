import { describe, it, expect } from 'vitest';
import {
  orderReviewSortKeyOf,
  compareOrdersByReviewSortKey,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/prepress-review/_lib/selectors.js';

// 5.13 待審清單依印件預計交期排序、空值排最後
// prepress-review spec § 待審清單排序與停滯規則：待審清單（含待審訂單模組）依印件「預計交期」
// 近者優先排序，空值排在有值之後，同組依印件編號排序；系統不用建立時間先進先出。
// 印件不存交期欄，預計交期一律由印件自身的訂單交期 − 1 天 − 急件選項凍結天數推導
// （order-management spec § 印件預計交期推導）。
// 畫面上母列以「訂單」為單位呈現（ReviewOrderList.js defaultExpandAllRows，
// 排序只作用在 orders.sort(compareOrdersByReviewSortKey)），故用訂單級的排序鍵函式驗算；
// 每張測試訂單只掛一件印件時，訂單的排序鍵等於該印件自身的預計交期，等同驗證 spec Scenario
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

describe('5.13 待審清單依印件預計交期排序、空值排最後', () => {
  it('依印件預計交期近者優先排序（spec 範例 09-18、09-20、09-25）', () => {
    // 訂單交期 − 1 天（一般件，凍結天數 0）＝ 預計交期
    const orders = [
      order('ORD-A', [item('PI-A', '2026-09-21')]), // 預計交期 2026-09-20
      order('ORD-B', [item('PI-B', '2026-09-26')]), // 預計交期 2026-09-25
      order('ORD-C', [item('PI-C', '2026-09-19')]), // 預計交期 2026-09-18
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-C', 'ORD-A', 'ORD-B']);
  });

  it('印件訂單交期未填（預計交期為空）者排在有值之後', () => {
    const orders = [
      order('ORD-EMPTY', [item('PI-EMPTY', null)]),
      order('ORD-LATE', [item('PI-LATE', '2026-09-21')]), // 預計交期 2026-09-20
      order('ORD-EARLY', [item('PI-EARLY', '2026-09-19')]), // 預計交期 2026-09-18
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

  it('同一筆預計交期時依印件編號排序（決勝規則）', () => {
    const orders = [
      order('ORD-Z', [item('PI-Z9', '2026-09-11')]),
      order('ORD-Y', [item('PI-A1', '2026-09-11')]),
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    // PI-A1 < PI-Z9（字母序），故掛 PI-A1 的訂單排前面
    expect(sorted).toEqual(['ORD-Y', 'ORD-Z']);
  });
});
