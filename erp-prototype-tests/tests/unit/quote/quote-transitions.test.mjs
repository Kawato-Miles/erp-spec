// 情境目錄第一章「需求單」中帶明確狀態轉換規則的條目：狀態列舉、重新評估／重新啟動的
// 目標與備註必填規則、主要前進轉換目標。畫面操作的驗收在第一章 e2e（01-quote）補上。
import { describe, it, expect } from 'vitest';
import {
  QUOTE_STATUS,
  QUOTE_STATUS_LABELS,
  QUOTE_STEPS,
  QUOTE_TRANSITIONS,
  REQUOTE_TARGETS,
  getPrimaryTarget,
  isNoteRequired,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/constants.js';

describe('1.9 需求單狀態只出現六個值，顯示名依 wiki', () => {
  it('狀態列舉恰為六個值，顯示名與 wiki 一致', () => {
    expect(Object.keys(QUOTE_STATUS)).toHaveLength(6);
    expect(Object.values(QUOTE_STATUS_LABELS)).toEqual([
      '需求確認中',
      '待評估成本',
      '已評估成本',
      '議價中',
      '成交',
      '流失',
    ]);
  });

  it('步驟條只列前五個值，不含流失（流失在畫面上另以錯誤色標示，不佔一個步驟格）', () => {
    expect(QUOTE_STEPS).toHaveLength(5);
    expect(QUOTE_STEPS.map((s) => s.key)).not.toContain(QUOTE_STATUS.LOST);
  });
});

describe('1.4 議價中申請重新評估，需求單退回待評估成本', () => {
  it('議價中的重新評估目標為待評估成本，且此轉換須填調整說明', () => {
    expect(REQUOTE_TARGETS[QUOTE_STATUS.NEGOTIATING]).toBe(QUOTE_STATUS.PENDING_QUOTE_EVALUATION);
    expect(isNoteRequired(QUOTE_STATUS.NEGOTIATING, QUOTE_STATUS.PENDING_QUOTE_EVALUATION)).toBe(
      true,
    );
  });

  it('已評估成本、需求確認中沒有重新評估目標（規則只開放議價中一途）', () => {
    expect(REQUOTE_TARGETS[QUOTE_STATUS.QUOTE_EVALUATED]).toBeUndefined();
    expect(REQUOTE_TARGETS[QUOTE_STATUS.REQUIREMENT_CONFIRMING]).toBeUndefined();
  });
});

describe('1.8 流失需求單重新啟動回待評估成本', () => {
  it('流失只能轉回待評估成本一途，且此轉換須填重啟原因', () => {
    expect(QUOTE_TRANSITIONS[QUOTE_STATUS.LOST]).toEqual([QUOTE_STATUS.PENDING_QUOTE_EVALUATION]);
    expect(isNoteRequired(QUOTE_STATUS.LOST, QUOTE_STATUS.PENDING_QUOTE_EVALUATION)).toBe(true);
  });

  it('成交為終局狀態，沒有任何可轉換目標', () => {
    expect(QUOTE_TRANSITIONS[QUOTE_STATUS.WON]).toEqual([]);
    expect(getPrimaryTarget(QUOTE_STATUS.WON)).toBeUndefined();
  });
});

describe('1.1／1.2／1.3 主要前進轉換目標（供詳情頁主動作鈕挑字用）', () => {
  it('每個非終局狀態的主要前進目標依序為評估成本、報價、議價、成交', () => {
    expect(getPrimaryTarget(QUOTE_STATUS.REQUIREMENT_CONFIRMING)).toBe(
      QUOTE_STATUS.PENDING_QUOTE_EVALUATION,
    );
    expect(getPrimaryTarget(QUOTE_STATUS.PENDING_QUOTE_EVALUATION)).toBe(
      QUOTE_STATUS.QUOTE_EVALUATED,
    );
    expect(getPrimaryTarget(QUOTE_STATUS.QUOTE_EVALUATED)).toBe(QUOTE_STATUS.NEGOTIATING);
    expect(getPrimaryTarget(QUOTE_STATUS.NEGOTIATING)).toBe(QUOTE_STATUS.WON);
  });
});
