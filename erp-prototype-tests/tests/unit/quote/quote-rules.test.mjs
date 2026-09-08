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
  canEditCostFields,
  canManageQuote,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/permissions.js';
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

describe('需求單角色把關（wiki 需求單狀態：業務推進、印務主管評估）', () => {
  const quote = {
    status: 'pending_quote_evaluation',
    sales_name: '洪嘉駿',
    created_by_name: '洪嘉駿',
    estimated_by_manager_ids: ['AU-009'],
    permissions: [
      { granted_to_user: { name: '張惠雯' }, permission: 'edit' },
      { granted_to_user: { name: '陳映蓉' }, permission: 'view' },
    ],
  };

  it('業務本人與取得編輯（代理）的諮詢人員可管理；只有檢視授權者不可', () => {
    expect(canManageQuote(quote, 'sales', '洪嘉駿')).toBe(true);
    expect(canManageQuote(quote, 'consultant', '張惠雯')).toBe(true);
    expect(canManageQuote(quote, 'sales', '陳映蓉')).toBe(false);
  });

  it('業務主管與印務主管不能推進成交等業務動作', () => {
    expect(canManageQuote(quote, 'sales_manager', '林雅婷')).toBe(false);
    expect(canManageQuote(quote, 'print_manager', '吳國豪')).toBe(false);
  });

  it('評估完成限被指派的印務主管，且限待評估成本', () => {
    expect(canCompleteEstimate(quote, 'print_manager', '吳國豪')).toBe(true);
    expect(canCompleteEstimate(quote, 'print_manager', '林雅婷')).toBe(false);
    expect(canCompleteEstimate({ ...quote, status: 'quote_evaluated' }, 'print_manager', '吳國豪')).toBe(
      false,
    );
  });

  it('印務主管在待評估與已評估兩階段可改成本欄，議價中不可', () => {
    expect(canEditCostFields(quote, 'print_manager', '吳國豪')).toBe(true);
    expect(canEditCostFields({ ...quote, status: 'quote_evaluated' }, 'print_manager', '吳國豪')).toBe(
      true,
    );
    expect(canEditCostFields({ ...quote, status: 'negotiating' }, 'print_manager', '吳國豪')).toBe(
      false,
    );
  });
});
