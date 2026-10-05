// 情境目錄 2.19：沒有任何印件的訂單回簽後不自動推進、不提示取消，業務逐格手動推到訂單完成；
// 全數棄用仍提示改走取消。期望值取自 order-management 規格差異檔 § 訂單完成判定 的 Scenario
// 「沒有任何印件的訂單由業務手動推到訂單完成」「全數棄用走取消不走完成」。
// 規則正本 wiki [[訂單狀態]] 轉換表「出貨中 → 訂單完成」列與「手動推進」子表。
// 畫面操作的驗收見 tests/e2e/02-order-setup/no-print-item-manual-completion.spec.mjs。
import { beforeEach, describe, expect, it } from 'vitest';
import {
  evaluateOrderCompletion,
  useOrdersStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  canAdvanceOrderStatus,
  nextOrderStatus,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import { deriveOrderStatusOnReview } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/order-review-derive.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

const ORDER_ID = 'ORD-2026-0813';
const initialOrders = useOrdersStore.getState().orders;
const store = () => useOrdersStore.getState();
const orderOf = () => store().orders.find((o) => o.id === ORDER_ID);

// 已回簽之後順序上的每一格（手動推進一次只推一格）
const STEPS = [
  '稿件未上傳',
  '等待審稿',
  '製作等待中',
  '工單已交付',
  '製作中',
  '製作完成',
  '出貨中',
  '訂單完成',
];

beforeEach(() => {
  useOrdersStore.setState({ orders: initialOrders });
  useSessionStore.setState({ role: 'sales' });
});

describe('2.19 沒有任何印件與全數棄用分開判定', () => {
  it('起點資料 ORD-2026-0813 為已回簽、沒有任何印件', () => {
    expect(orderOf().status).toBe('已回簽');
    expect(orderOf().print_items).toEqual([]);
  });

  it('沒有任何印件：不觸發完成、也不屬於全數棄用（不提示改走取消）', () => {
    const result = evaluateOrderCompletion([], '已回簽');
    expect(result.completable).toBe(false);
    expect(result.allAbandoned).toBe(false);
  });

  it('沒有任何印件：回簽後審稿段歸納沒有落點，訂單維持已回簽、系統不自動推進', () => {
    expect(deriveOrderStatusOnReview(orderOf())).toBe('已回簽');
  });

  it('對照組：兩件印件皆已棄用時不推進訂單完成，屬全數棄用、提示改走取消', () => {
    const items = [
      { name: '冬季菜單 A4 對摺', type: '大貨印件', print_item_status: '已棄用' },
      { name: '桌卡 A6', type: '大貨印件', print_item_status: '已棄用' },
    ];
    const result = evaluateOrderCompletion(items, '出貨中');
    expect(result.completable).toBe(false);
    expect(result.allAbandoned).toBe(true);
  });

  it('沒有任何印件的訂單到出貨中仍不自動完成，要靠手動推進', () => {
    expect(evaluateOrderCompletion([], '出貨中').completable).toBe(false);
    expect(canAdvanceOrderStatus({ status: '出貨中' }, 'sales')).toBe(true);
    expect(nextOrderStatus('出貨中')).toBe('訂單完成');
  });
});

describe('2.19 業務以手動推進逐格推到訂單完成', () => {
  it('自已回簽起一次只推一格，依序經過八格到訂單完成', () => {
    let from = '已回簽';
    for (const to of STEPS) {
      expect(nextOrderStatus(from)).toBe(to);
      expect(store().advanceOrderStatus(ORDER_ID)).toMatchObject({ ok: true, from, to });
      expect(orderOf().status).toBe(to);
      from = to;
    }
    // 終態之後沒有下一格，手動推進不再提供
    expect(nextOrderStatus('訂單完成')).toBeNull();
    expect(canAdvanceOrderStatus(orderOf(), 'sales')).toBe(false);
  });

  it('每一格在活動紀錄留一筆：推進人、時間、推進前後狀態', () => {
    const before = orderOf().activities.length;
    let from = '已回簽';
    for (const to of STEPS) {
      store().advanceOrderStatus(ORDER_ID);
      const act = orderOf().activities.at(-1);
      expect(act.actor).toBe('洪嘉駿');
      expect(act.time).toBeTruthy();
      expect(act.action).toContain(`「${from}」`);
      expect(act.action).toContain(`「${to}」`);
      from = to;
    }
    expect(orderOf().activities).toHaveLength(before + STEPS.length);
  });

  it('手動推進限業務：業務主管發起不推進', () => {
    expect(canAdvanceOrderStatus(orderOf(), 'sales_manager')).toBe(false);
  });
});
