// 情境目錄 11.30（單據權責修正第四批）：缺口處置、修正缺口處置、補做（品檢缺口與售後決議兩種觸發）、短出結案，
// 操作者一律依該印件所屬工單的編輯權：負責印務、工單的被分享（編輯）成員（不限角色）、印務主管全公司。
// 任一印務都能處置別人工單的錯誤要修正；品檢人員、業務（沒被分享）沒有入口。
// 依據：品檢活動清單（ACT-INSP-003 至 011）、製作與報工活動清單（ACT-MFG-019、020、024）、
// 售後處理活動清單（ACT-AFH-003、004、006）、受控清單 § 工單關聯單據的編輯權。
// 畫面操作的缺口處置見 tests/e2e/11-qc/qc.spec.mjs（11.28）。
import { describe, expect, it } from 'vitest';
import {
  canDecideDisposition,
  canShortClose,
  canStartRemake,
  REMAKE_SOURCE_QC,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/permissions.js';

// 同一件印件旗下兩張工單：印刷工單負責印務周建宏，裝訂工單負責印務蔡明修並以編輯層級分享給業務陳映蓉、檢視層級分享給印務郭俊賢
const PRINTING = { work_order_no: 'WO-X-1', owner: '周建宏', shared_members: [] };
const BINDING = {
  work_order_no: 'WO-X-2',
  owner: '蔡明修',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '郭俊賢', level: 'view' },
  ],
};
const WORK_ORDERS = [PRINTING, BINDING];
const access = (userName, workOrders = WORK_ORDERS) => ({ userName, workOrders });

const ALLOWED = [
  ['print_officer', '周建宏', '印刷工單的負責印務'],
  ['print_officer', '蔡明修', '裝訂工單的負責印務（旗下任一工單即可）'],
  ['sales', '陳映蓉', '編輯分享成員（業務）'],
  ['print_manager', '吳國豪', '印務主管（全公司）'],
];
const DENIED = [
  ['print_officer', '李佩珊', '不負責這件印件任何工單的印務'],
  ['print_officer', '郭俊賢', '檢視層級分享成員'],
  ['sales', '洪嘉駿', '沒被分享的業務'],
  ['qc_inspector', '郭淑芬', '品檢人員'],
  ['production_planner', '許文傑', '沒被分享的生管'],
];

describe('11.30 記錄缺口處置與修正缺口處置的操作者', () => {
  it.each(ALLOWED)('%s %s（%s）可記錄與修正缺口處置', (role, user) => {
    expect(canDecideDisposition(role, access(user)).allowed).toBe(true);
    expect(canDecideDisposition(role, access(user), 'OP-PI-022').allowed).toBe(true);
  });

  it.each(DENIED)('%s %s（%s）沒有入口，理由有寫', (role, user) => {
    const guard = canDecideDisposition(role, access(user));
    expect(guard.allowed).toBe(false);
    expect(guard.reason).toBeTruthy();
    expect(canDecideDisposition(role, access(user), 'OP-PI-022').allowed).toBe(false);
  });

  it('印件旗下沒有任何工單時，只有印務主管可處置', () => {
    expect(canDecideDisposition('print_manager', access('吳國豪', [])).allowed).toBe(true);
    expect(canDecideDisposition('print_officer', access('周建宏', [])).allowed).toBe(false);
  });
});

describe('11.30 發起補做（品檢缺口軌與售後決議軌）的操作者', () => {
  const qc = (role, user) => canStartRemake(role, '製作中', '大貨印件', null, access(user));

  it.each(ALLOWED)('%s %s（%s）可發起品檢缺口補做', (role, user) => {
    expect(qc(role, user).allowed).toBe(true);
  });

  it.each(DENIED)('%s %s（%s）不可發起補做', (role, user) => {
    expect(qc(role, user).allowed).toBe(false);
  });

  it('品檢缺口軌的來源標示不影響操作者判定', () => {
    const guard = canStartRemake(
      'sales',
      '製作中',
      '大貨印件',
      { type: REMAKE_SOURCE_QC },
      access('陳映蓉'),
    );
    expect(guard.allowed).toBe(true);
  });
});

describe('11.30 短出結案的操作者', () => {
  it.each(ALLOWED)('%s %s（%s）可短出結案', (role, user) => {
    expect(canShortClose(role, '製作中', access(user)).allowed).toBe(true);
  });

  it.each(DENIED)('%s %s（%s）不可短出結案', (role, user) => {
    expect(canShortClose(role, '製作中', access(user)).allowed).toBe(false);
  });

  it('操作者通過後，印製狀態的時機把關維持：尚未投產與已送達仍擋下', () => {
    expect(canShortClose('print_manager', '待製作', access('吳國豪')).allowed).toBe(false);
    expect(canShortClose('print_manager', '已送達', access('吳國豪')).allowed).toBe(false);
  });
});
