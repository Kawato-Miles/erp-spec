// 情境目錄 3.24、3.28（單據權責修正第六批）：訂單詳情內收款項目、發票與折讓、款項紀錄的操作者，與訂單異動的操作者。
// 依據：收款項目規劃、收款項目開立發票、收款核銷活動清單（ACT-BPL、ACT-INV、ACT-RCV、ACT-CSH）；
// 訂單異動活動清單（ACT-CHG-001 至 021）；受控清單 § 訂單關聯單據的編輯權。
// 規則：有訂單編輯權（自己負責、被分享（編輯）、六個全公司協助角色）才能動帳務與建立、送審、確認生效、取消未認列的訂單異動；
// 核可、退回與取消已認列的訂單異動只給該訂單的審核業務主管本人，不隨編輯權開放。
// 畫面見 tests/e2e/03-payment/billing-access-scope.spec.mjs。
import { describe, expect, it } from 'vitest';
import { canDo } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/access-control.js';
import {
  canCancelAdjustment,
  canEditOrder,
  canOperateAdjustments,
  canReviewAdjustment,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import { orderFacts, orderPerson } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/access-facts.js';

const BILLING_OPS = [
  'OP-BIL-001', 'OP-BIL-002', 'OP-BIL-003', // 收款項目：編輯、取消、刪除
  'OP-BIL-004', 'OP-BIL-005', // 發票：開立、作廢
  'OP-BIL-006', 'OP-BIL-007', 'OP-BIL-011', // 折讓：開立、作廢、編輯
  'OP-BIL-008', 'OP-BIL-009', 'OP-BIL-010', // 款項紀錄：編輯、標記已完成、取消
];
const ADJ_EDIT_OPS = ['OP-ORD-006', 'OP-ADJ-001', 'OP-ADJ-002', 'OP-ADJ-005', 'OP-ADJ-006']; // 建立、編輯、提交審核、確認生效、取消（未認列）

// 訂單：接單業務洪嘉駿，審核業務主管林雅婷，陳映蓉編輯、張惠雯檢視層級分享
const ORDER = {
  sales_person: '洪嘉駿',
  assigned_manager: '林雅婷',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '張惠雯', level: 'view' },
  ],
};
const FACTS = orderFacts(ORDER);
const can = (role, userName, op) => canDo(orderPerson(role, userName), op, FACTS);

const HELPERS = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '周建宏'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];
const NO_ACCESS = [
  ['accountant', '陳美玲'],
  ['production_planner', '許文傑'],
  ['master', '劉阿海'],
  ['qc_inspector', '郭淑芬'],
  ['picker', '范姜宏'],
  ['shipper', '曾志偉'],
  ['facility_staff', '簡俊男'],
  ['reviewer', '魏彣軒'],
];

describe('3.24 訂單詳情的帳務操作依訂單編輯權：自己負責、被分享（編輯）、六個協助角色可做', () => {
  it('接單業務洪嘉駿、編輯層級的陳映蓉、六個全公司協助角色對每一項帳務操作都成立', () => {
    for (const op of BILLING_OPS) {
      expect(can('sales', '洪嘉駿', op), `${op} 接單業務`).toBe(true);
      expect(can('sales', '陳映蓉', op), `${op} 編輯分享成員`).toBe(true);
      for (const [role, name] of HELPERS) expect(can(role, name, op), `${op} ${role}`).toBe(true);
    }
  });

  it('編輯分享成員不限業務：諮詢乙也一樣（分享列的執行角色是所有角色）', () => {
    const order = { ...ORDER, shared_members: [{ name: '蘇怡君', level: 'edit' }] };
    for (const op of BILLING_OPS) {
      expect(canDo(orderPerson('consultant', '蘇怡君'), op, orderFacts(order))).toBe(true);
    }
  });

  it('檢視層級的分享成員一項都不能做（反向）', () => {
    for (const op of BILLING_OPS) {
      expect(can('consultant', '張惠雯', op), op).toBe(false);
    }
    expect(canEditOrder(ORDER, 'consultant', '張惠雯')).toBe(false);
  });

  it('非負責又未被分享的業務、諮詢不能動這張訂單的帳務（反向）', () => {
    for (const op of BILLING_OPS) {
      expect(can('sales', '賴柏宇', op), op).toBe(false);
      expect(can('consultant', '蘇怡君', op), op).toBe(false);
    }
  });

  it('會計與現場角色沒有任何帳務操作：會計對帳走清單，不在訂單內動帳（反向）', () => {
    for (const op of BILLING_OPS) {
      for (const [role, name] of NO_ACCESS) expect(can(role, name, op), `${op} ${role}`).toBe(false);
    }
  });

  it('帳務各操作與訂單編輯權同一個結果，詳情頁一道 canEdit 即涵蓋', () => {
    const people = [
      ['sales', '洪嘉駿'], ['sales', '陳映蓉'], ['sales', '賴柏宇'], ['consultant', '張惠雯'],
      ['consultant', '蘇怡君'], ...HELPERS, ...NO_ACCESS,
    ];
    for (const [role, name] of people) {
      const edit = canEditOrder(ORDER, role, name);
      for (const op of BILLING_OPS) expect(can(role, name, op), `${op} ${role} ${name}`).toBe(edit);
    }
  });
});

describe('3.28 訂單異動：建立、編輯、送審、確認生效、取消（未認列）依訂單編輯權', () => {
  it('接單業務、編輯分享成員、六個協助角色可建立並送審', () => {
    expect(canOperateAdjustments(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(canOperateAdjustments(ORDER, 'sales', '陳映蓉')).toBe(true);
    for (const [role, name] of HELPERS) expect(canOperateAdjustments(ORDER, role, name), role).toBe(true);
    for (const op of ADJ_EDIT_OPS) {
      expect(can('order_manager', '黃聖雯', op), op).toBe(true);
      expect(can('sales', '陳映蓉', op), op).toBe(true);
    }
  });

  it('檢視層級的分享成員不能建立訂單異動（反向）', () => {
    expect(canOperateAdjustments(ORDER, 'consultant', '張惠雯')).toBe(false);
    for (const op of ADJ_EDIT_OPS) expect(can('consultant', '張惠雯', op), op).toBe(false);
  });

  it('非負責業務不能建立、不能取消未認列的訂單異動（反向）', () => {
    expect(canOperateAdjustments(ORDER, 'sales', '賴柏宇')).toBe(false);
    for (const status of ['草稿', '待主管審核', '已退回', '已核可']) {
      expect(canCancelAdjustment({ status }, ORDER, 'sales', '賴柏宇'), status).toBe(false);
      expect(canCancelAdjustment({ status }, ORDER, 'sales', '洪嘉駿'), status).toBe(true);
    }
  });

  it('會計不能建立、取消訂單異動', () => {
    expect(canOperateAdjustments(ORDER, 'accountant', '陳美玲')).toBe(false);
    expect(canCancelAdjustment({ status: '草稿' }, ORDER, 'accountant', '陳美玲')).toBe(false);
  });

  it('已取消的訂單異動沒有取消動作', () => {
    expect(canCancelAdjustment({ status: '已取消' }, ORDER, 'sales_manager', '林雅婷')).toBe(false);
  });
});

describe('3.28 審核類不隨編輯權開放：核可、退回與取消已認列的訂單異動限審核業務主管本人', () => {
  const RECOGNIZED = { status: '確認可執行' };

  it('審核業務主管本人（林雅婷）可核可、退回、取消已認列的', () => {
    expect(canReviewAdjustment(ORDER, 'sales_manager', '林雅婷')).toBe(true);
    expect(canCancelAdjustment(RECOGNIZED, ORDER, 'sales_manager', '林雅婷')).toBe(true);
  });

  it('另一位業務主管有全公司編輯權，但不是本單的審核業務主管：不能核可、退回、取消已認列的；可取消未認列的', () => {
    const other = ['sales_manager', '李主管'];
    expect(canOperateAdjustments(ORDER, ...other)).toBe(true);
    expect(canReviewAdjustment(ORDER, ...other)).toBe(false);
    expect(canCancelAdjustment(RECOGNIZED, ORDER, ...other)).toBe(false);
    expect(canCancelAdjustment({ status: '草稿' }, ORDER, ...other)).toBe(true);
  });

  it('接單業務、編輯分享成員與其餘五個協助角色都不能核可、退回、取消已認列的', () => {
    const people = [
      ['sales', '洪嘉駿'], ['sales', '陳映蓉'],
      ['order_manager', '黃聖雯'], ['print_manager', '吳國豪'], ['print_officer', '周建宏'],
      ['reviewer_supervisor', '魏彣軒'], ['supervisor', '王大明'],
    ];
    for (const [role, name] of people) {
      expect(canReviewAdjustment(ORDER, role, name), `核可 ${role}`).toBe(false);
      expect(canCancelAdjustment(RECOGNIZED, ORDER, role, name), `取消已認列 ${role}`).toBe(false);
      expect(canDo(orderPerson(role, name), 'OP-ADJ-004', FACTS), `退回 ${role}`).toBe(false);
    }
  });

  it('審核業務主管換成別人，原業務主管林雅婷就不再有審核類動作', () => {
    const reassigned = { ...ORDER, assigned_manager: '李主管' };
    expect(canReviewAdjustment(reassigned, 'sales_manager', '林雅婷')).toBe(false);
    expect(canCancelAdjustment(RECOGNIZED, reassigned, 'sales_manager', '林雅婷')).toBe(false);
    expect(canReviewAdjustment(reassigned, 'sales_manager', '李主管')).toBe(true);
  });
});
