import { describe, it, expect } from 'vitest';
import {
  computeOrderDeadline,
  computeOrderDaysToDeadline,
  orderReviewSortKeyOf,
  compareOrdersByReviewSortKey,
  isPrintItemUrgent,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/prepress-review/_lib/selectors.js';
import { nextWorkingDay } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 5.13 待審清單依印件內部完成日排序、空值排最後（2.13 排序鍵純函式）
// prepress-review spec § 待審清單排序與停滯規則：待審清單（含待審訂單模組）依印件
//「印件內部完成日」近者優先排序，空值排在有值之後，同組依印件編號排序；不用建立時間先進先出。
// 印件內部完成日一律由業務填的「印件預計交期」往前減 1 個工作天推導，是否急件不參與
//（order-management spec § 印件內部完成日推導，OpenSpec change rush-order-definition）。
// 急件只做標示、不影響排序：急件不會因是否急件為是而排前，除非業務把預計交期壓早。
// 畫面上母列以「訂單」為單位呈現（ReviewOrderList.js defaultExpandAllRows，
// 排序只作用在 orders.sort(compareOrdersByReviewSortKey)），故用訂單級的排序鍵函式驗算；
// 每張測試訂單只掛一件印件時，訂單的排序鍵等於該印件自身的內部完成日，等同驗證 spec Scenario
// 「審稿人員名下三件待審印件」的排序結果。

// 第二參數為「印件內部完成日」：以其下一個工作天當印件預計交期，推回來即為該日
const item = (printItemNo, internalDate, overrides = {}) => ({
  print_item_no: printItemNo,
  review_status: '等待審稿',
  print_item_status: '製程已確認',
  expected_delivery_date: internalDate ? nextWorkingDay(internalDate) : null,
  is_urgent: false,
  ...overrides,
});

const order = (orderNo, items) => ({ order_no: orderNo, status: '製作等待中', print_items: items });

describe('5.13 待審清單依印件內部完成日排序、空值排最後', () => {
  it('依印件內部完成日近者優先排序（spec 範例 09-18、09-20、09-25）', () => {
    const orders = [
      order('ORD-A', [item('PI-A', '2026-09-21')]), // 印件內部完成日 2026-09-21
      order('ORD-B', [item('PI-B', '2026-09-25')]), // 印件內部完成日 2026-09-25
      order('ORD-C', [item('PI-C', '2026-09-18')]), // 印件內部完成日 2026-09-18
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-C', 'ORD-A', 'ORD-B']);
  });

  it('印件預計交期未填（印件內部完成日為空）者排在有值之後', () => {
    const orders = [
      order('ORD-EMPTY', [item('PI-EMPTY', null)]),
      order('ORD-LATE', [item('PI-LATE', '2026-09-21')]), // 印件內部完成日 2026-09-21
      order('ORD-EARLY', [item('PI-EARLY', '2026-09-18')]), // 印件內部完成日 2026-09-18
    ];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-EARLY', 'ORD-LATE', 'ORD-EMPTY']);
  });

  it('急件不改變排序鍵：甲（否，內部完成日 2026-10-15）排在乙（是，2026-10-16）之前，乙帶急單標示、甲不帶', () => {
    // prepress-review spec Scenario「急件不改變排序鍵」：乙的印件預計交期 2026-10-19（一）、是否急件為是
    const 甲 = item('PI-甲', '2026-10-15');
    const 乙 = item('PI-乙', '2026-10-16', { is_urgent: true });
    expect(乙.expected_delivery_date).toBe('2026-10-19');
    const orders = [order('ORD-乙', [乙]), order('ORD-甲', [甲])];
    const sorted = [...orders].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(sorted).toEqual(['ORD-甲', 'ORD-乙']);
    expect(isPrintItemUrgent(乙)).toBe(true);
    expect(isPrintItemUrgent(甲)).toBe(false);
  });

  it('取消是否急件後急單標示即時消失，印件內部完成日與排序位置不變', () => {
    const before = item('PI-丙', '2026-10-12', { is_urgent: true });
    const after = { ...before, is_urgent: false };
    expect(isPrintItemUrgent(before)).toBe(true);
    expect(isPrintItemUrgent(after)).toBe(false);
    const other = order('ORD-丁', [item('PI-丁', '2026-10-14')]);
    const rank = (x) => [order('ORD-丙', [x]), other].sort(compareOrdersByReviewSortKey).map((o) => o.order_no);
    expect(rank(after)).toEqual(rank(before));
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

// 6.5／5.13（prepress-review spec § 待審清單排序與停滯規則 Scenario「急單標示取印件的急件標注」）：
// 急單標示只看印件的是否急件與印製維度，訂單層沒有急件欄位。
describe('6.5 急單標示取印件的急件標注，不誤讀訂單層欄位', () => {
  it('名片（是）帶急單標示、型錄（否）不帶、貼紙（是但已棄用）不帶', () => {
    const 名片 = item('PI-名片', '2026-09-20', { is_urgent: true });
    const 型錄 = item('PI-型錄', '2026-09-20', { is_urgent: false });
    const 貼紙 = item('PI-貼紙', '2026-09-20', { is_urgent: true, print_item_status: '已棄用' });
    expect(isPrintItemUrgent(名片)).toBe(true);
    expect(isPrintItemUrgent(型錄)).toBe(false);
    expect(isPrintItemUrgent(貼紙)).toBe(false);
  });

  it('外層（訂單）帶任何急件值都不影響：判定只讀印件自身', () => {
    const normalItem = item('PI-NORMAL', '2026-09-20', { is_urgent: false });
    const fakeOrder = { is_urgent: true, print_items: [normalItem] };
    expect(isPrintItemUrgent(fakeOrder.print_items[0])).toBe(false);
  });
});

// 5.15 母列的印件預計交期取旗下未收斂印件最早的那一個（2.12）
// prepress-review spec § 審稿訂單脈絡查詢視圖：訂單層已無交期欄，待審訂單模組母列那一格改由
// 旗下**未收斂**印件（審稿維度未達「已確認可製作」、未棄用）的「印件預計交期」取最早值；
// 已收斂的印件不納入，全數留空時取值為空、畫面兩欄皆顯示無值符號，不拿已收斂印件的值頂替。
// 母列 SHALL NOT 取訂單層的「訂單預計交貨日期」——後者只計未出貨印件，與審稿段要盯的未收斂
// 印件不是同一組。天數一律以工作天計。
describe('5.15 母列的印件預計交期取旗下未收斂印件最早的那一個', () => {
  it('取未收斂印件的最早值，已收斂印件不納入', () => {
    const target = order('ORD-MIX', [
      item('PI-LATE', '2026-09-24'), // 印件預計交期 2026-09-29
      item('PI-EARLY', '2026-09-17'), // 印件預計交期 2026-09-18
      // 已確認可製作＝已收斂：日期最早，但不該被母列取用
      item('PI-SETTLED', '2026-09-01', { review_status: '已確認可製作' }),
    ]);
    expect(computeOrderDeadline(target)).toBe('2026-09-18');
  });

  it('母列不取訂單預計交貨日期（只認未收斂印件）', () => {
    // 已收斂但尚未出貨的印件會落進訂單預計交貨日期（2026-09-02），母列不得取它
    const target = order('ORD-CTX', [
      item('PI-SETTLED', '2026-09-01', { review_status: '已確認可製作' }),
      item('PI-PENDING', '2026-09-17'), // 印件預計交期 2026-09-18
    ]);
    expect(computeOrderDeadline(target)).toBe('2026-09-18');
  });

  it('距印件預計交期天數以工作天計', () => {
    // 母列日期 2026-10-19（一），系統日期 2026-10-15（四）→ 起日不計、迄日計，共 2 個工作天
    const target = order('ORD-DAYS', [item('PI-D', '2026-10-16')]);
    expect(computeOrderDeadline(target)).toBe('2026-10-19');
    expect(computeOrderDaysToDeadline(target, Date.parse('2026-10-15T00:00:00Z'))).toBe(2);
  });

  it('旗下印件的印件預計交期全部留空時取值為空，距交期天數同樣為空', () => {
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
