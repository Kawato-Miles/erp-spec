import { describe, it, expect } from 'vitest';
import {
  isUrgentOrder,
  isUrgentPrintItem,
  isUrgentPrintItemNo,
  urgentDueDateReminderOf,
  URGENT_DUE_DATE_REMINDER,
  purchasedUrgentDaysLabelOf,
  purchasedUrgentLabelOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/urgent-due-date.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';

// 急件標注判準（OpenSpec change rush-order-definition 第二輪，order-management spec § 印件是否急件、
// § 訂單急件標注、§ 訂單詳情印件列的急件標注；work-order spec § 工單與生產任務的急件標示）：
// 印件被標注＝是否急件為是、且印製維度不是「已棄用」。訂單不存急件欄，訂單標注取旗下任一有效印件；
// 線上單印件的購買的急件選項不參與判定。工單、生產任務、轉交單明細、出貨明細都依印件編號回讀這一支。

const byNo = (no) => MOCK_ORDERS.find((o) => o.order_no === no);
const pi = (no, isUrgent, overrides = {}) => ({
  print_item_no: no,
  is_urgent: isUrgent,
  print_item_status: '製作中',
  ...overrides,
});

describe('6.5（5.6／5.7）急件標示只看印件自身的是否急件，訂單層不設急件欄', () => {
  it('orders/mock-data.js 全部訂單物件皆無 is_urgent 鍵（急件的唯一事實在印件層）', () => {
    expect(MOCK_ORDERS.length).toBeGreaterThan(0);
    for (const order of MOCK_ORDERS) {
      expect(Object.prototype.hasOwnProperty.call(order, 'is_urgent')).toBe(false);
    }
  });

  it('印件全數不帶舊模型的急件選項欄（urgent_option_*）', () => {
    for (const order of MOCK_ORDERS) {
      for (const item of order.print_items ?? []) {
        expect(Object.keys(item).filter((k) => k.startsWith('urgent_option'))).toEqual([]);
      }
    }
  });
});

describe('4.24 急件標注判準：是否急件為是且非已棄用', () => {
  it('業務逐印件勾選：名片是否急件為是則標注、型錄為否不標', () => {
    expect(isUrgentPrintItem(pi('名片', true))).toBe(true);
    expect(isUrgentPrintItem(pi('型錄', false))).toBe(false);
  });

  it('已棄用的急件印件不標注，是否急件值維持是', () => {
    const abandoned = pi('名片', true, { print_item_status: '已棄用' });
    expect(isUrgentPrintItem(abandoned)).toBe(false);
    expect(abandoned.is_urgent).toBe(true);
  });

  it('購買的急件選項不參與判定：購買三天急件但是否急件為否不標；購買延後型但是否急件為是照標', () => {
    expect(
      isUrgentPrintItem(pi('A', false, { purchased_urgent_name: '三天急件', purchased_urgent_days: -3 })),
    ).toBe(false);
    expect(
      isUrgentPrintItem(pi('B', true, { purchased_urgent_name: '延後兩天', purchased_urgent_days: 2 })),
    ).toBe(true);
  });

  it('訂單含一件是否急件為是的有效印件即標注；皆為否不標', () => {
    expect(isUrgentOrder({ print_items: [pi('名片', true), pi('型錄', false)] })).toBe(true);
    expect(isUrgentOrder({ print_items: [pi('名片', false), pi('型錄', false)] })).toBe(false);
  });

  it('唯一的急件印件取消勾選後訂單不標注', () => {
    expect(isUrgentOrder({ print_items: [pi('名片', false), pi('型錄', false)] })).toBe(false);
  });

  it('急件印件棄用後訂單不標注', () => {
    expect(
      isUrgentOrder({
        print_items: [pi('名片', true, { print_item_status: '已棄用' }), pi('型錄', false)],
      }),
    ).toBe(false);
  });

  it('依印件編號回讀訂單模組的印件判定（工單、生產任務、轉交單明細、出貨明細、派單共用）', () => {
    const orders = [
      { print_items: [pi('PI-A', true), pi('PI-B', false), pi('PI-C', true, { print_item_status: '已棄用' })] },
    ];
    expect(isUrgentPrintItemNo(orders, 'PI-A')).toBe(true);
    expect(isUrgentPrintItemNo(orders, 'PI-B')).toBe(false);
    expect(isUrgentPrintItemNo(orders, 'PI-C')).toBe(false);
    expect(isUrgentPrintItemNo(orders, 'PI-404')).toBe(false);
  });

  it('mock：鏈四 ORD-2026-0820 與線上單 ORD-2026-0816 標注；ORD-2026-0913 不標', () => {
    expect(isUrgentOrder(byNo('ORD-2026-0820'))).toBe(true);
    expect(isUrgentOrder(byNo('ORD-2026-0816'))).toBe(true);
    expect(isUrgentOrder(byNo('ORD-2026-0913'))).toBe(false);
  });

  it('mock：ORD-2026-0816 只有 PI-2026-0861 標注，購買延後型的 PI-2026-0862 不標', () => {
    expect(isUrgentPrintItemNo(MOCK_ORDERS, 'PI-2026-0861')).toBe(true);
    expect(isUrgentPrintItemNo(MOCK_ORDERS, 'PI-2026-0862')).toBe(false);
    expect(isUrgentPrintItemNo(MOCK_ORDERS, 'PI-2026-0863')).toBe(false);
  });
});

describe('4.5 是否急件為勾起時的交期確認提示', () => {
  it('勾起即回提示文字「此印件為急件，請確認印件預計交期」', () => {
    expect(URGENT_DUE_DATE_REMINDER).toBe('此印件為急件，請確認印件預計交期');
    expect(urgentDueDateReminderOf(true)).toBe('此印件為急件，請確認印件預計交期');
  });

  it('取消勾選（或未勾）即無提示', () => {
    expect(urgentDueDateReminderOf(false)).toBeUndefined();
    expect(urgentDueDateReminderOf(undefined)).toBeUndefined();
  });
});

describe('4.26 線上單印件的購買的急件選項顯示', () => {
  it('增減天數負數顯示提早 N 天、正數顯示延後 N 天、0 顯示不增減', () => {
    expect(purchasedUrgentDaysLabelOf(-3)).toBe('提早 3 天');
    expect(purchasedUrgentDaysLabelOf(2)).toBe('延後 2 天');
    expect(purchasedUrgentDaysLabelOf(0)).toBe('不增減');
  });

  it('mock：ORD-2026-0816 三件依序為提早 3 天、延後 2 天、不增減', () => {
    const items = byNo('ORD-2026-0816').print_items;
    const label = (no) => purchasedUrgentLabelOf(items.find((p) => p.print_item_no === no));
    expect(label('PI-2026-0861')).toBe('三天急件（提早 3 天）');
    expect(label('PI-2026-0862')).toBe('延後兩天（延後 2 天）');
    expect(label('PI-2026-0863')).toBe('一般件（不增減）');
  });

  it('線下單印件的購買的急件選項為空（例：鏈四 PI-2026-0820）', () => {
    const item = byNo('ORD-2026-0820').print_items.find((p) => p.print_item_no === 'PI-2026-0820');
    expect(item.purchased_urgent_name ?? null).toBeNull();
    expect(purchasedUrgentLabelOf(item)).toBeNull();
  });
});
