import { describe, it, expect } from 'vitest';
import {
  urgentBadgeLabelOf,
  isUrgentOrder,
  isUrgentPrintItem,
  isUrgentPrintItemNo,
  shouldRemindUrgentOnManualPick,
  URGENT_PICK_REMINDER,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/urgent-due-date.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';

// tasks.md 任務 5.6／5.7（work-order delta § 工單與生產任務的急件標示）：
// 工單頁與生產任務清單的急件標示只讀印件層的急件選項，訂單層已無任何形式的急件欄位
// （「是否急件」已於任務 3.7 刪除）。本檔補一筆迴歸測試，防止未來又把急件標示接回訂單層欄位。

describe('5.6／5.7 工單急件標示不再引用訂單是否急件', () => {
  it('urgentBadgeLabelOf／isUrgentPrintItem 只依印件自身的急件選項判定，不吃訂單層欄位', () => {
    // 印件本身標三天急件：即使外層物件（模擬訂單）帶著 is_urgent: false 這種矛盾值，
    // 函式只認印件自己的 urgent_option_days，不查任何訂單層欄位。
    const urgentItem = {
      urgent_option_days: 3,
      urgent_option_name: '三天急件',
      is_urgent: false, // 刻意放一個矛盾值：若函式誤讀外層欄位就會判成非急件
    };
    expect(isUrgentPrintItem(urgentItem)).toBe(true);
    // 急件不改日期，標示只寫凍結的選項名稱、不寫提前天數
    expect(urgentBadgeLabelOf(urgentItem)).toBe('急件・三天急件');

    // 一般件（凍結天數 0）：即使外層帶 is_urgent: true 也不判成急件
    const normalItem = {
      urgent_option_days: 0,
      urgent_option_name: '一般件',
      is_urgent: true,
    };
    expect(isUrgentPrintItem(normalItem)).toBe(false);
    expect(urgentBadgeLabelOf(normalItem)).toBeNull();
  });

  it('orders/mock-data.js 全部訂單物件皆無 is_urgent 鍵（防止「是否急件」欄位又被接回訂單層）', () => {
    expect(MOCK_ORDERS.length).toBeGreaterThan(0);
    for (const order of MOCK_ORDERS) {
      expect(Object.prototype.hasOwnProperty.call(order, 'is_urgent')).toBe(false);
    }
  });
});

// 急件新定義（rush-order-definition，Miles 2026-10-27）：急件標注判準為凍結天數大於 0；
// 一般件（0）與延後型（負數）不標，已棄用印件不標；訂單標注取旗下任一有效印件。
describe('急件標注判準：凍結天數大於 0', () => {
  const pi = (no, days, overrides = {}) => ({
    print_item_no: no,
    urgent_option_id: days === 0 ? 'UO-001' : 'UO-X',
    urgent_option_name: days === 0 ? '一般件' : days > 0 ? '三天急件' : '延後 2 天',
    urgent_option_days: days,
    print_item_status: '製作中',
    ...overrides,
  });

  it('三天急件（3）標注；一般件（0）與延後 2 天（−2）不標', () => {
    expect(isUrgentPrintItem(pi('名片', 3))).toBe(true);
    expect(isUrgentPrintItem(pi('型錄', 0))).toBe(false);
    expect(isUrgentPrintItem(pi('海報', -2))).toBe(false);
    expect(urgentBadgeLabelOf(pi('海報', -2))).toBeNull();
  });

  it('已棄用的急件印件不標注', () => {
    expect(isUrgentPrintItem(pi('名片', 3, { print_item_status: '已棄用' }))).toBe(false);
  });

  it('訂單含一件急件印件即標注；延後型與一般件不使訂單標注', () => {
    expect(isUrgentOrder({ print_items: [pi('名片', 3), pi('型錄', 0)] })).toBe(true);
    expect(isUrgentOrder({ print_items: [pi('名片', 0), pi('型錄', -2)] })).toBe(false);
  });

  it('唯一的急件印件棄用後訂單不標注', () => {
    expect(
      isUrgentOrder({
        print_items: [pi('名片', 3, { print_item_status: '已棄用' }), pi('型錄', 0)],
      }),
    ).toBe(false);
  });

  it('依印件編號回讀訂單模組的印件判定（工單、生產任務、轉交單明細、出貨明細共用）', () => {
    const orders = [{ print_items: [pi('PI-A', 3), pi('PI-B', 0), pi('PI-C', -2)] }];
    expect(isUrgentPrintItemNo(orders, 'PI-A')).toBe(true);
    expect(isUrgentPrintItemNo(orders, 'PI-B')).toBe(false);
    expect(isUrgentPrintItemNo(orders, 'PI-C')).toBe(false);
    expect(isUrgentPrintItemNo(orders, 'PI-404')).toBe(false);
  });

  it('mock：鏈四 ORD-2026-0820 標注、延後型 ORD-2026-0913 不標注', () => {
    const byNo = (no) => MOCK_ORDERS.find((o) => o.order_no === no);
    expect(isUrgentOrder(byNo('ORD-2026-0820'))).toBe(true);
    expect(isUrgentOrder(byNo('ORD-2026-0913'))).toBe(false);
  });
});

describe('手動選定急件選項的提醒', () => {
  it('新增印件直接選三天急件：提醒', () => {
    expect(shouldRemindUrgentOnManualPick(3, 'UO-003', null)).toBe(true);
    expect(URGENT_PICK_REMINDER).toBe('此印件為急件，請確認印件預計交期');
  });

  it('從一般件改選急件、或從急件改選另一急件：提醒', () => {
    expect(shouldRemindUrgentOnManualPick(3, 'UO-003', 'UO-001')).toBe(true);
    expect(shouldRemindUrgentOnManualPick(5, 'UO-004', 'UO-003')).toBe(true);
  });

  it('選一般件或延後型不提醒；沿用原本（系統帶入）的選項不提醒', () => {
    expect(shouldRemindUrgentOnManualPick(0, 'UO-001', 'UO-003')).toBe(false);
    expect(shouldRemindUrgentOnManualPick(-2, 'UO-005', 'UO-001')).toBe(false);
    expect(shouldRemindUrgentOnManualPick(3, 'UO-003', 'UO-003')).toBe(false);
  });
});
