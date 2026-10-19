import { describe, expect, it } from 'vitest';
import {
  canConfirmProducible,
  canReturnForRework,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';

// 情境目錄 5.x、5.18：確認可製作與退回重審是同一個決定的兩個方向，操作者依活動清單
// （稿件審查活動清單 ACT-ART-017 至 022）：接單業務（業務與諮詢）、編輯層級分享成員、六個全公司協助角色。
// 審稿人員、會計、生管不在其列。
const ORDER = { sales_person: '洪嘉駿', shared_members: [] };
const ASSIST_ROLES = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '周建宏'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];

describe('確認可製作與退回重審的操作角色', () => {
  it('接單業務與接單諮詢都能確認可製作', () => {
    expect(canConfirmProducible(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(canConfirmProducible({ ...ORDER, sales_person: '張惠雯' }, 'consultant', '張惠雯')).toBe(true);
  });

  it('業務主管、訂單管理人、印務主管、印務、審稿主管、Supervisor 都能確認可製作（全公司協助角色）', () => {
    for (const [role, name] of ASSIST_ROLES) {
      expect(canConfirmProducible(ORDER, role, name), role).toBe(true);
    }
  });

  it('審稿人員、會計、生管不能確認可製作', () => {
    for (const [role, name] of [
      ['reviewer', '魏彣軒'],
      ['accountant', '陳美玲'],
      ['production_planner', '許文傑'],
    ]) {
      expect(canConfirmProducible(ORDER, role, name), role).toBe(false);
    }
  });

  it('非接單業務、不在分享成員的業務不能確認可製作；被分享（編輯）可、被分享（檢視）不可', () => {
    expect(canConfirmProducible(ORDER, 'sales', '陳映蓉')).toBe(false);
    const shared = {
      ...ORDER,
      shared_members: [
        { name: '陳映蓉', level: 'edit' },
        { name: '蘇怡君', level: 'view' },
      ],
    };
    expect(canConfirmProducible(shared, 'sales', '陳映蓉')).toBe(true);
    expect(canConfirmProducible(shared, 'consultant', '蘇怡君')).toBe(false);
  });

  it('確認可製作與退回重審的操作者一致', () => {
    const shared = { ...ORDER, shared_members: [{ name: '陳映蓉', level: 'edit' }] };
    for (const [role, name] of [
      ['sales', '洪嘉駿'],
      ['sales', '陳映蓉'],
      ['consultant', '蘇怡君'],
      ['sales_manager', '林雅婷'],
      ['order_manager', '黃聖雯'],
      ['reviewer', '魏彣軒'],
      ['accountant', '陳美玲'],
    ]) {
      expect(canConfirmProducible(shared, role, name)).toBe(canReturnForRework(shared, role, name));
    }
  });
});
