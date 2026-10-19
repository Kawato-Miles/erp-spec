// 情境目錄 12.29、12.30（單據權責修正第五批）：售後服務單的可見範圍跟著訂單（不看開立者）、
// 編輯／送出決議／結案／在售後服務單內建立訂單異動依訂單編輯權，會計只能檢視。
// 依據：出貨與售後檢視活動清單（ACT-VDLV-008 至 013、015）、售後受理活動清單（ACT-AFR-001 至 015）、
// 售後結案活動清單（ACT-AFC-001 至 006）、訂單異動活動清單（ACT-CHG-004、005、021）。
// 畫面見 tests/e2e/12-shipping/access-scope.spec.mjs。
import { describe, expect, it } from 'vitest';
import {
  canCloseTicket,
  canEditTicket,
  canOperateAdjustments,
  canOpenTicketOnOrder,
  canSubmitTicketResolution,
  canViewTicket,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';

const ORDER = {
  sales_person: '洪嘉駿',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '李志豪', level: 'view' },
  ],
};
const OTHER_ORDER = { sales_person: '賴柏宇', shared_members: [] };

const HELPERS = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '周建宏'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];
const WRITES = [
  ['編輯', canEditTicket],
  ['送出決議', canSubmitTicketResolution],
  ['結案', canCloseTicket],
  ['建立訂單異動', canOperateAdjustments],
  ['建立售後服務單', canOpenTicketOnOrder],
];

describe('12.29 售後服務單的檢視範圍跟著訂單，不看開立者', () => {
  it('接單業務看得到同事（編輯分享成員）代開的單：判斷只吃訂單，不吃開立者', () => {
    expect(canViewTicket(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(canViewTicket(ORDER, 'sales', '陳映蓉')).toBe(true);
    expect(canViewTicket(ORDER, 'sales', '李志豪')).toBe(true);
  });

  it('非負責又未被分享的業務、諮詢看不到', () => {
    expect(canViewTicket(OTHER_ORDER, 'sales', '洪嘉駿')).toBe(false);
    expect(canViewTicket(ORDER, 'consultant', '蘇怡君')).toBe(false);
  });

  it('業務主管、會計、Supervisor 與四個協助角色看全公司', () => {
    for (const [role, name] of [...HELPERS, ['accountant', '陳美玲']]) {
      expect(canViewTicket(ORDER, role, name)).toBe(true);
      expect(canViewTicket(OTHER_ORDER, role, name)).toBe(true);
    }
  });

  it('生管、品檢人員、揀貨、出貨、師傅、廠務、審稿人員沒有售後檢視', () => {
    for (const [role, name] of [
      ['production_planner', '許文傑'],
      ['qc_inspector', '郭淑芬'],
      ['picker', '范姜宏'],
      ['shipper', '曾志偉'],
      ['master', '劉阿海'],
      ['facility_staff', '簡俊男'],
      ['reviewer', '魏彣軒'],
    ]) {
      expect(canViewTicket(ORDER, role, name)).toBe(false);
    }
  });
});

describe('12.30 售後服務單操作：接單業務、編輯分享成員、六個全公司協助角色；會計只能看', () => {
  it.each(WRITES)('%s：接單業務、編輯分享成員與六個協助角色可以', (_, can) => {
    expect(can(ORDER, 'sales', '洪嘉駿')).toBe(true);
    expect(can(ORDER, 'sales', '陳映蓉')).toBe(true);
    for (const [role, name] of HELPERS) expect(can(OTHER_ORDER, role, name)).toBe(true);
  });

  it.each(WRITES)('%s：檢視分享成員、非負責業務、會計與現場角色不可', (_, can) => {
    expect(can(ORDER, 'sales', '李志豪')).toBe(false);
    expect(can(OTHER_ORDER, 'sales', '洪嘉駿')).toBe(false);
    for (const [role, name] of [
      ['accountant', '陳美玲'],
      ['picker', '范姜宏'],
      ['shipper', '曾志偉'],
      ['qc_inspector', '郭淑芬'],
      ['production_planner', '許文傑'],
    ]) {
      expect(can(ORDER, role, name)).toBe(false);
    }
  });

  it('沒有訂單時，編輯類一律不可；檢視只剩全公司的角色（業務查無負責訂單）', () => {
    expect(canEditTicket(null, 'sales_manager', '林雅婷')).toBe(false);
    expect(canViewTicket(undefined, 'sales', '洪嘉駿')).toBe(false);
    expect(canViewTicket(undefined, 'supervisor', '王大明')).toBe(true);
  });
});
