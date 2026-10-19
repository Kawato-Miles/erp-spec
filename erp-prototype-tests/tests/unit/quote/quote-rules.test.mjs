// 情境目錄第一章「需求單」中帶明確算式或可判定規則的條目：印件金額、轉換前的缺漏檢查、
// 角色把關。畫面操作的驗收待第一章 e2e 補上。
import { describe, it, expect } from 'vitest';
import {
  lineSubtotal,
  profitMargin,
  quoteTotals,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/pricing.js';
import {
  itemsMissingCost,
  itemsMissingDifficulty,
  itemsMissingUnitPrice,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/transitions.js';
import {
  canCompleteEstimate,
  canCreateQuote,
  canDeleteQuote,
  canManageCostFields,
  canManageQuote,
  canQuoteDo,
  canReassignQuoteOwner,
  canSeeQuote,
  QUOTE_OP,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/permissions.js';
import { quoteShareRows } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/access-facts.js';
import { useQuotesStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/store.js';
import { MOCK_QUOTES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/mock-data.js';

describe('1.3 業務談定單價、標記成交並一鍵轉出訂單（金額口徑）', () => {
  it('小計等於數量乘單價、四捨五入到整數元；報價邏輯卡錨例名片 123 × 5.29 ＝ 651', () => {
    expect(lineSubtotal(123, 5.29)).toBe(651);
    expect(lineSubtotal(30000, 0.33)).toBe(9900);
    expect(lineSubtotal(700, 2.5)).toBe(1750);
  });

  it('單價未填時小計為空，不算成 0', () => {
    expect(lineSubtotal(5000, null)).toBeNull();
    expect(lineSubtotal(5000, '')).toBeNull();
  });

  it('毛利率以小計為分母、取兩位小數；小計或成本缺任一為空', () => {
    expect(profitMargin(31850, 49000)).toBe(35);
    expect(profitMargin(9800, 15000)).toBe(34.67);
    expect(profitMargin(null, 15000)).toBeNull();
    expect(profitMargin(9800, null)).toBeNull();
    expect(profitMargin(9800, 0)).toBeNull();
  });

  it('需求單三個金額欄由印件小計推導；鏈一 49,000 → 稅額 2,450 → 含稅 51,450', () => {
    expect(quoteTotals([{ subtotal_excl_tax: 49000 }])).toEqual({
      amount_excl_tax: 49000,
      tax_amount: 2450,
      total_incl_tax: 51450,
    });
    expect(quoteTotals([{ subtotal_excl_tax: 651 }, { subtotal_excl_tax: null }])).toEqual({
      amount_excl_tax: 651,
      tax_amount: 33,
      total_incl_tax: 684,
    });
  });

  it('mock 每張需求單的印件小計與單頭金額對得上資料主鏈', () => {
    const chainOne = MOCK_QUOTES.find((q) => q.quote_no === 'Q-20260601-01');
    expect(chainOne.items[0].unit_price).toBe(9.8);
    expect(lineSubtotal(chainOne.items[0].quantity, chainOne.items[0].unit_price)).toBe(49000);
    // 鏈八議價中 Q-20260908-01：6,900／345／7,245（菜單夾頁單價為空，小計不入）
    const negotiating = MOCK_QUOTES.find((q) => q.quote_no === 'Q-20260908-01');
    expect(quoteTotals(negotiating.items)).toEqual({
      amount_excl_tax: 6900,
      tax_amount: 345,
      total_incl_tax: 7245,
    });
    expect(negotiating.items[1].unit_price).toBeNull();
    // 補上菜單夾頁單價 3.2 後：小計 1,600、利潤率 25.00%、金額 8,500／425／8,925
    expect(lineSubtotal(500, 3.2)).toBe(1600);
    expect(profitMargin(1200, 1600)).toBe(25);
    expect(quoteTotals([{ subtotal_excl_tax: 6900 }, { subtotal_excl_tax: 1600 }])).toEqual({
      amount_excl_tax: 8500,
      tax_amount: 425,
      total_incl_tax: 8925,
    });
    // 鏈八流失 Q-20260909-01：12,500／625／13,125
    const lost = MOCK_QUOTES.find((q) => q.quote_no === 'Q-20260909-01');
    expect(quoteTotals(lost.items)).toEqual({
      amount_excl_tax: 12500,
      tax_amount: 625,
      total_incl_tax: 13125,
    });
    expect(lost.lost_reason).toBe('price');
    expect(lost.lost_note).toBe('客戶轉單同業，價差約一成');
    // 評估印務主管一律吳國豪（AU-009）
    for (const q of MOCK_QUOTES) expect(q.estimated_by_manager_ids).toEqual(['AU-009']);
    for (const q of MOCK_QUOTES) {
      for (const it of q.items) {
        if (it.unit_price != null) {
          expect(it.subtotal_excl_tax).toBe(lineSubtotal(it.quantity, it.unit_price));
        }
        if (it.cost_estimate != null && it.subtotal_excl_tax != null) {
          expect(it.profit_margin).toBe(profitMargin(it.cost_estimate, it.subtotal_excl_tax));
        }
        expect(it).not.toHaveProperty('price_per_unit');
      }
    }
  });
});

describe('1.1／1.2／1.3 轉換前的印件缺漏檢查', () => {
  const items = [
    { name: '甲', difficulty_level: 3, cost_estimate: 100, unit_price: 2, subtotal_excl_tax: 200 },
    { name: '乙', difficulty_level: null, cost_estimate: null, unit_price: null, subtotal_excl_tax: null },
  ];

  it('送印務評估：任一印件難易度未填即列為缺漏', () => {
    expect(itemsMissingDifficulty(items).map((i) => i.name)).toEqual(['乙']);
  });

  it('評估完成：只看成本估算，不因單價未填而擋', () => {
    expect(itemsMissingCost(items).map((i) => i.name)).toEqual(['乙']);
    expect(itemsMissingCost([{ cost_estimate: 100, unit_price: null }])).toEqual([]);
  });

  it('成交：單價或小計未填即列為缺漏', () => {
    expect(itemsMissingUnitPrice(items).map((i) => i.name)).toEqual(['乙']);
  });
});

// 需求單的權責只認活動清單（售前單據檢視、了解需求、報價評估、成交建訂單、改派負責人、分享與職務代理）：
// 自己負責只看接單業務；建立者欄不給權限；評估印務主管由系統列入分享成員（編輯），做編輯分享成員能做的全部動作；
// 業務主管、Supervisor 看全公司，改派由兩者執行；檢視層級的分享成員只能看。
describe('需求單角色把關（活動清單：自己負責、被分享、全公司）', () => {
  // 洪嘉駿負責；建立者陳映蓉（替人建單）；評估印務主管吳國豪（AU-009）；張惠雯編輯、蘇怡君檢視
  const quote = {
    status: 'pending_quote_evaluation',
    sales_name: '洪嘉駿',
    created_by_name: '陳映蓉',
    estimated_by_manager_ids: ['AU-009'],
    permissions: [
      { id: 'QP-1', granted_to_user: { id: 'AU-010', name: '張惠雯' }, permission: 'edit' },
      { id: 'QP-2', granted_to_user: { id: 'AU-011', name: '蘇怡君' }, permission: 'view' },
    ],
  };
  const withStatus = (status) => ({ ...quote, status });

  it('1.26 建立者不因建立而取得權限：替人建單的業務乙看不到、管不了', () => {
    expect(canSeeQuote(quote, 'sales', '陳映蓉')).toBe(false);
    expect(canManageQuote(quote, 'sales', '陳映蓉')).toBe(false);
    expect(canDeleteQuote(quote, 'sales', '陳映蓉')).toBe(false);
    expect(canQuoteDo(quote, 'sales', '陳映蓉', QUOTE_OP.manageShare)).toBe(false);
  });

  it('接單業務本人與編輯（代理）層級的分享成員可管理；檢視層級不可', () => {
    expect(canManageQuote(quote, 'sales', '洪嘉駿')).toBe(true);
    expect(canManageQuote(quote, 'consultant', '張惠雯')).toBe(true);
    expect(canManageQuote(quote, 'consultant', '蘇怡君')).toBe(false);
  });

  it('C01 評估印務主管可管理需求單；沒被指派的印務主管、業務主管不可', () => {
    expect(canManageQuote(quote, 'print_manager', '吳國豪')).toBe(true);
    expect(canManageQuote(quote, 'print_manager', '周文彬')).toBe(false);
    expect(canManageQuote(quote, 'sales_manager', '林雅婷')).toBe(false);
    expect(canManageQuote(quote, 'supervisor', '王大明')).toBe(false);
  });

  it('C07 評估印務主管的編輯權不限狀態，也不限成本兩欄：每個動作都過', () => {
    for (const status of [
      'requirement_confirming',
      'pending_quote_evaluation',
      'quote_evaluated',
      'negotiating',
      'won',
      'lost',
    ]) {
      expect(canManageQuote(withStatus(status), 'print_manager', '吳國豪'), status).toBe(true);
    }
    for (const op of Object.values(QUOTE_OP).filter((o) => o !== QUOTE_OP.create && o !== QUOTE_OP.reassign)) {
      expect(canQuoteDo(quote, 'print_manager', '吳國豪', op), op).toBe(true);
    }
  });

  it('C02 評估完成：自己負責、編輯分享成員與評估印務主管可按，限待評估成本；檢視層級與未被指派的印務主管不可', () => {
    expect(canCompleteEstimate(quote, 'sales', '洪嘉駿')).toBe(true);
    expect(canCompleteEstimate(quote, 'consultant', '張惠雯')).toBe(true);
    expect(canCompleteEstimate(quote, 'print_manager', '吳國豪')).toBe(true);
    expect(canCompleteEstimate(quote, 'consultant', '蘇怡君')).toBe(false);
    expect(canCompleteEstimate(quote, 'print_manager', '周文彬')).toBe(false);
    expect(canCompleteEstimate(withStatus('quote_evaluated'), 'sales', '洪嘉駿')).toBe(false);
    expect(canCompleteEstimate(withStatus('quote_evaluated'), 'print_manager', '吳國豪')).toBe(false);
  });

  it('C03 需求確認中、待評估成本、已評估成本可改成本估算，議價中不可；評估印務主管同業務', () => {
    for (const status of ['requirement_confirming', 'pending_quote_evaluation', 'quote_evaluated']) {
      expect(canManageCostFields(withStatus(status), 'sales', '洪嘉駿'), status).toBe(true);
      expect(canManageCostFields(withStatus(status), 'print_manager', '吳國豪'), status).toBe(true);
    }
    expect(canManageCostFields(withStatus('negotiating'), 'sales', '洪嘉駿')).toBe(false);
    expect(canManageCostFields(withStatus('negotiating'), 'print_manager', '吳國豪')).toBe(false);
    expect(canManageCostFields(quote, 'print_manager', '周文彬')).toBe(false);
  });

  it('C04 刪除需求單：自己負責、編輯分享成員、評估印務主管可；檢視層級、業務主管不可', () => {
    expect(canDeleteQuote(quote, 'sales', '洪嘉駿')).toBe(true);
    expect(canDeleteQuote(quote, 'consultant', '張惠雯')).toBe(true);
    expect(canDeleteQuote(quote, 'print_manager', '吳國豪')).toBe(true);
    expect(canDeleteQuote(quote, 'consultant', '蘇怡君')).toBe(false);
    expect(canDeleteQuote(quote, 'sales_manager', '林雅婷')).toBe(false);
  });

  it('C05 列表可見範圍：業務主管、印務主管、Supervisor 看全公司；業務、諮詢只看自己負責與被分享的', () => {
    const unrelated = {
      ...quote,
      sales_name: '賴柏宇',
      created_by_name: '賴柏宇',
      estimated_by_manager_ids: [],
      permissions: [],
    };
    expect(canSeeQuote(unrelated, 'sales', '洪嘉駿')).toBe(false);
    expect(canSeeQuote(unrelated, 'consultant', '張惠雯')).toBe(false);
    expect(canSeeQuote(unrelated, 'sales_manager', '林雅婷')).toBe(true);
    expect(canSeeQuote(unrelated, 'print_manager', '吳國豪')).toBe(true);
    expect(canSeeQuote(unrelated, 'supervisor', '王大明')).toBe(true);
    // 被分享（檢視）的業務乙看得到
    const shared = {
      ...unrelated,
      permissions: [{ granted_to_user: { name: '陳映蓉' }, permission: 'view' }],
    };
    expect(canSeeQuote(shared, 'sales', '陳映蓉')).toBe(true);
  });

  it('1.29 未列的角色看不到需求單：會計、生管、審稿、訂單管理人、現場角色都沒有檢視組合', () => {
    for (const [role, name] of [
      ['accountant', '陳美玲'],
      ['production_planner', '許文傑'],
      ['reviewer', '魏彣軒'],
      ['reviewer_supervisor', '魏彣軒'],
      ['order_manager', '黃聖雯'],
      ['print_officer', '周建宏'],
      ['master', '劉阿海'],
      ['qc_inspector', '郭淑芬'],
      ['picker', '范姜宏'],
      ['shipper', '曾志偉'],
      ['facility_staff', '簡俊男'],
    ]) {
      expect(canSeeQuote(quote, role, name), role).toBe(false);
    }
  });

  it('1.29 只有業務、諮詢可建立需求單；印務主管、業務主管、Supervisor、會計不可', () => {
    expect(canCreateQuote('sales')).toBe(true);
    expect(canCreateQuote('consultant')).toBe(true);
    for (const role of ['print_manager', 'sales_manager', 'supervisor', 'accountant', 'order_manager']) {
      expect(canCreateQuote(role), role).toBe(false);
    }
  });

  it('C06 改派接單業務：業務主管與 Supervisor 可；業務、評估印務主管、編輯分享成員不可；成交或流失後不可', () => {
    expect(canReassignQuoteOwner(quote, 'sales_manager')).toBe(true);
    expect(canReassignQuoteOwner(quote, 'supervisor')).toBe(true);
    expect(canReassignQuoteOwner(quote, 'sales')).toBe(false);
    expect(canReassignQuoteOwner(quote, 'consultant')).toBe(false);
    expect(canReassignQuoteOwner(quote, 'print_manager')).toBe(false);
    expect(canReassignQuoteOwner({ ...quote, status: 'won' }, 'sales_manager')).toBe(false);
    expect(canReassignQuoteOwner({ ...quote, status: 'lost' }, 'supervisor')).toBe(false);
  });

  it('1.27 檢視層級的分享成員沒有任何編輯、刪除、推進、複製或分享管理入口', () => {
    for (const op of Object.values(QUOTE_OP).filter((o) => o !== QUOTE_OP.create && o !== QUOTE_OP.reassign)) {
      expect(canQuoteDo(quote, 'consultant', '蘇怡君', op), op).toBe(false);
    }
    // 但看得到
    expect(canSeeQuote(quote, 'consultant', '蘇怡君')).toBe(true);
  });

  it('1.31 編輯分享成員與評估印務主管可管理分享成員、可複製；檢視層級不可；收回授權即時生效', () => {
    expect(canQuoteDo(quote, 'consultant', '張惠雯', QUOTE_OP.manageShare)).toBe(true);
    expect(canQuoteDo(quote, 'print_manager', '吳國豪', QUOTE_OP.manageShare)).toBe(true);
    expect(canQuoteDo(quote, 'consultant', '蘇怡君', QUOTE_OP.manageShare)).toBe(false);
    expect(canQuoteDo(quote, 'consultant', '張惠雯', QUOTE_OP.copy)).toBe(true);
    expect(canQuoteDo(quote, 'sales_manager', '林雅婷', QUOTE_OP.copy)).toBe(false);
    // 收回張惠雯的授權：下一次判斷就看不到、管不了
    const revoked = { ...quote, permissions: quote.permissions.filter((p) => p.id !== 'QP-1') };
    expect(canSeeQuote(revoked, 'consultant', '張惠雯')).toBe(false);
    expect(canManageQuote(revoked, 'consultant', '張惠雯')).toBe(false);
  });

  it('1.28 評估印務主管列入分享成員清單，層級為編輯；移出評估印務主管即撤銷', () => {
    const rows = quoteShareRows(quote);
    const manager = rows.find((r) => r.granted_to_user.name === '吳國豪');
    expect(manager).toMatchObject({ permission: 'edit', auto: true });
    // 手動授予的兩位照列
    expect(rows.map((r) => r.granted_to_user.name)).toEqual(
      expect.arrayContaining(['張惠雯', '蘇怡君', '吳國豪']),
    );
    expect(rows.filter((r) => r.auto)).toHaveLength(1);
    // 兩位評估印務主管都列入
    const two = quoteShareRows({ ...quote, estimated_by_manager_ids: ['AU-009', 'AU-006'] });
    expect(two.filter((r) => r.auto).map((r) => r.granted_to_user.name).sort()).toEqual(['吳國豪', '周文彬']);
    // 撤銷評估印務主管後，不再是分享成員，也管不了
    const removed = { ...quote, estimated_by_manager_ids: [] };
    expect(quoteShareRows(removed).some((r) => r.auto)).toBe(false);
    expect(canManageQuote(removed, 'print_manager', '吳國豪')).toBe(false);
  });
});

describe('C10 複製需求單：新單接單業務為執行複製的人', () => {
  it('編輯分享成員複製他人負責的需求單：新單接單業務與建立者都是複製者，分享成員不帶入、評估印務主管帶入', () => {
    const store = useQuotesStore.getState();
    const source = MOCK_QUOTES.find((q) => q.quote_no === 'Q-20260601-01');
    expect(source.sales_name).toBe('洪嘉駿');
    const newId = store.duplicateQuote(source.id, '蘇怡君');
    const copy = useQuotesStore.getState().getQuote(newId);
    expect(copy.sales_name).toBe('蘇怡君');
    expect(copy.sales_id).toBe('AU-011');
    expect(copy.created_by_name).toBe('蘇怡君');
    expect(copy.permissions).toEqual([]);
    expect(copy.estimated_by_manager_ids).toEqual(source.estimated_by_manager_ids);
    // 複製者負責新單：可管理；原業務不再有這張新單的權限
    expect(canManageQuote(copy, 'consultant', '蘇怡君')).toBe(true);
    expect(canSeeQuote(copy, 'sales', '洪嘉駿')).toBe(false);
  });
});
