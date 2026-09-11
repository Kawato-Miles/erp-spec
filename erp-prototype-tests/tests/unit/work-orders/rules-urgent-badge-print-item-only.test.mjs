import { describe, it, expect } from 'vitest';
import {
  urgentBadgeLabelOf,
  isUrgentPrintItem,
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
    expect(urgentBadgeLabelOf(urgentItem)).toBe('急件・三天急件提前 3 天');

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
