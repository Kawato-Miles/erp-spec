import { describe, expect, it } from 'vitest';
import {
  canConfirmProducible,
  canReturnForRework,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';

// 情境目錄 5.x：確認可製作與退回重審是同一個決定的兩個方向，業務與諮詢同權（D9）
describe('確認可製作與退回重審的操作角色', () => {
  it('業務與諮詢都能確認可製作', () => {
    expect(canConfirmProducible('sales')).toBe(true);
    expect(canConfirmProducible('consultant')).toBe(true);
  });
  it('其他角色不能確認可製作', () => {
    for (const role of ['sales_manager', 'order_manager', 'reviewer', 'print_officer', 'supervisor']) {
      expect(canConfirmProducible(role)).toBe(false);
    }
  });
  it('確認可製作與退回重審的角色一致', () => {
    for (const role of ['sales', 'consultant', 'sales_manager', 'order_manager', 'reviewer']) {
      expect(canConfirmProducible(role)).toBe(canReturnForRework(role));
    }
  });
});
