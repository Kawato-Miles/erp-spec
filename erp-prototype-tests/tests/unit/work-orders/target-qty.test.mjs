import { describe, it, expect } from 'vitest';
import { deriveTargetQty } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/target-qty.js';

// 骨架驗證用：目標數量＝預計生產＋放損（鏈一 PT-0601-1：5,000＋100）
describe('目標數量', () => {
  it('預計生產加放損', () => {
    expect(deriveTargetQty({ planned_qty: 5000, spoilage_qty: 100 })).toBe(5100);
  });
});
