// 情境目錄第二章「訂單成立與維護」中帶明確規則或算式的條目：金額重算、角色把關、
// 終態鎖定。畫面操作的驗收見 tests/e2e/02-order-setup/。
import { describe, it, expect } from 'vitest';
import {
  canCancelOrder,
  canEditOrderNotes,
  canEditPrintItemOrderedQty,
  canEditPrintItemPrice,
  canManageSharing,
  canReassignOwner,
  isOrderTerminal,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import {
  deriveOrderAmounts,
  lineAmountOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/order-amounts.js';

describe('2.1／2.2 訂單四步接力與核可（把關條件）', () => {
  it('取消訂單限業務，且限非終態；訂單完成與已取消兩個終態都擋下', () => {
    expect(canCancelOrder({ status: '草稿' }, 'sales')).toBe(true);
    expect(canCancelOrder({ status: '待業務主管審核' }, 'sales')).toBe(true);
    expect(canCancelOrder({ status: '訂單完成' }, 'sales')).toBe(false);
    expect(canCancelOrder({ status: '已取消' }, 'sales')).toBe(false);
    expect(canCancelOrder({ status: '草稿' }, 'sales_manager')).toBe(false);
  });
});

describe('2.4 比價期間直接改印件單價（金額重算口徑）', () => {
  it('小計＝購買數量 × 單價四捨五入至整數元；改單價後小計跟著重算', () => {
    expect(lineAmountOf(100, 50)).toBe(5000);
    expect(lineAmountOf(100, 60)).toBe(6000);
    expect(lineAmountOf(100, 65)).toBe(6500);
  });

  it('應收總額隨印件單價變動即時導出：稅額 5% 取整，含稅總額恆為整數', () => {
    const order = {
      print_items: [{ ordered_qty: 100, unit_price_untaxed: 60 }],
      other_fees: [],
      shipping_fee_untaxed: 0,
      discount_amount_untaxed: 0,
      adjustments: [],
    };
    expect(deriveOrderAmounts(order)).toMatchObject({
      product_amount_untaxed: 6000,
      total_amount_untaxed: 6000,
      tax_amount: 300,
      total_amount_taxed: 6300,
      receivable_taxed: 6300,
    });
  });
});

describe('2.6 訂單進終態後客戶欄與印件欄唯讀', () => {
  it('訂單完成與已取消為終態；製作中／製作等待中等非終態不鎖', () => {
    expect(isOrderTerminal('訂單完成')).toBe(true);
    expect(isOrderTerminal('已取消')).toBe(true);
    expect(isOrderTerminal('製作中')).toBe(false);
    expect(isOrderTerminal('報價待回簽')).toBe(false);
  });

  it('購買數量與單價僅在終態鎖定，其餘（含製作段）全程可改', () => {
    expect(canEditPrintItemOrderedQty({ status: '製作中' })).toBe(true);
    expect(canEditPrintItemOrderedQty({ status: '訂單完成' })).toBe(false);
    expect(canEditPrintItemPrice({ status: '製作中' })).toBe(true);
    expect(canEditPrintItemPrice({ status: '已取消' })).toBe(false);
  });
});

describe('2.7／2.8 三類備註的編輯把關（只有已取消才鎖）', () => {
  it('訂單完成後三類備註仍可編輯，只有已取消才鎖成唯讀', () => {
    expect(canEditOrderNotes({ status: '訂單完成' })).toBe(true);
    expect(canEditOrderNotes({ status: '製作中' })).toBe(true);
    expect(canEditOrderNotes({ status: '已取消' })).toBe(false);
  });
});

describe('2.10 分享成員管理與改派負責人的角色把關', () => {
  it('分享管理限負責業務本人、編輯（代理）成員，或業務主管／主管；已取消一律唯讀', () => {
    const order = {
      status: '製作中',
      sales_person: '洪嘉駿',
      shared_members: [{ name: '張惠雯', level: 'view' }, { name: '李志豪', level: 'edit' }],
    };
    expect(canManageSharing(order, 'sales', '洪嘉駿')).toBe(true);
    expect(canManageSharing(order, 'sales', '張惠雯')).toBe(false); // 檢視層級不可管理
    expect(canManageSharing(order, 'sales', '李志豪')).toBe(true); // 編輯（代理）視同負責人
    expect(canManageSharing(order, 'sales_manager', '林雅婷')).toBe(true);
    expect(canManageSharing({ ...order, status: '已取消' }, 'sales', '洪嘉駿')).toBe(false);
  });

  it('改派負責業務限業務主管或主管', () => {
    expect(canReassignOwner('sales_manager')).toBe(true);
    expect(canReassignOwner('supervisor')).toBe(true);
    expect(canReassignOwner('sales')).toBe(false);
  });
});
