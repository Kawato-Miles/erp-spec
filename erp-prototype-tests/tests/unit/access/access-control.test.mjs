// 集中權限判斷（(prototype)/_lib/access-control.js）：依活動表的執行角色、範圍、依據欄位判斷，未列即不可做。
// 對應情境目錄 2.20（會計不在訂單模組）、2.21（業務只看自己負責與被分享的訂單）、2.26（印務主管、印務、審稿主管看全公司訂單）、
// 2.27（訂單分享候選）、14.41（工單分享候選）、1.29（需求單分享候選）與出貨單、品檢站入口。
import { describe, expect, it } from 'vitest';
import {
  canDo,
  canViewDoc,
  hasEntry,
  listScopeOf,
  rowMatches,
  shareCandidateRoleNames,
  activitiesOfOp,
  SCOPE,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/access-control.js';

const person = (role, userName, lines) => ({ role, userName, lines });
const ORDER_FACTS = {
  '訂單 接單業務': '洪嘉駿',
  '訂單 分享成員': [
    { name: '蘇怡君', level: 'edit' },
    { name: '張惠雯', level: 'view' },
  ],
};

describe('2.20 會計不在訂單模組，帳務從四張跨訂單清單進入', () => {
  it('會計沒有任何訂單檢視列，訂單詳情不可進入', () => {
    expect(hasEntry('accountant', { card: 'VORD', sec: '訂單' })).toBe(false);
    expect(canViewDoc(person('accountant', '陳美玲'), 'order', ORDER_FACTS)).toBe(false);
  });

  it('會計有四張跨訂單清單的入口，範圍全公司', () => {
    for (const sec of ['應收款項清單', '待開發票清單', '待退款清單', '帳務異常清單']) {
      expect(hasEntry('accountant', { card: 'VORD', sec })).toBe(true);
      expect(listScopeOf('accountant', { card: 'VORD', sec })).toBe('all');
    }
  });
});

describe('2.21 業務只看自己負責與被分享的訂單；被分享後直連可進', () => {
  const orderView = (p) => canViewDoc(p, 'order', ORDER_FACTS);

  it('接單業務本人可進；別的業務沒有檢視組合', () => {
    expect(orderView(person('sales', '洪嘉駿'))).toBe(true);
    expect(orderView(person('sales', '陳映蓉'))).toBe(false);
  });

  it('被分享（編輯）與被分享（檢視）的人都可進，不限角色', () => {
    expect(orderView(person('consultant', '蘇怡君'))).toBe(true);
    expect(orderView(person('consultant', '張惠雯'))).toBe(true);
    // 層級以活動列判斷：分享成員不在名單上就不算
    expect(orderView(person('consultant', '林欣怡'))).toBe(false);
  });

  it('建立者欄不給權限：只有接單業務欄、分享成員欄會讓人看得到', () => {
    const facts = { '訂單 接單業務': '李志豪', '訂單 分享成員': [] };
    expect(canViewDoc(person('sales', '洪嘉駿'), 'order', facts)).toBe(false);
  });
});

describe('2.26 印務主管、印務、審稿主管看全公司訂單；Supervisor、訂單管理人、業務主管同', () => {
  for (const [role, name] of [
    ['print_manager', '吳國豪'],
    ['print_officer', '周建宏'],
    ['reviewer_supervisor', '魏彣軒'],
    ['supervisor', '王大明'],
    ['order_manager', '黃聖雯'],
    ['sales_manager', '林雅婷'],
  ]) {
    it(`${role} 有訂單入口、範圍全公司，直連別人的訂單可進`, () => {
      expect(hasEntry(role, { card: 'VORD', sec: '訂單' })).toBe(true);
      expect(listScopeOf(role, { card: 'VORD', sec: '訂單' })).toBe('all');
      expect(canViewDoc(person(role, name), 'order', { '訂單 接單業務': '洪嘉駿' })).toBe(true);
    });
  }

  it('業務、諮詢的訂單範圍是自己負責（列表另含被分享）', () => {
    expect(listScopeOf('sales', { card: 'VORD', sec: '訂單' })).toBe('scoped');
    expect(listScopeOf('consultant', { card: 'VORD', sec: '訂單' })).toBe('scoped');
  });

  it('審稿人員、生管、師傅、廠務沒有訂單入口', () => {
    for (const role of ['reviewer', 'production_planner', 'master', 'facility_staff', 'qc_inspector']) {
      expect(hasEntry(role, { card: 'VORD', sec: '訂單' })).toBe(false);
    }
  });
});

describe('2.27、14.41、1.29 分享成員候選：對該單據至少有一列不靠分享的活動的角色', () => {
  const sorted = (xs) => [...xs].sort();

  it('訂單：業務、諮詢與六個全公司協助角色；不含會計、生管', () => {
    expect(sorted(shareCandidateRoleNames('order'))).toEqual(
      sorted(['業務', '諮詢', '業務主管', '訂單管理人', '印務主管', '印務', '審稿主管', 'Supervisor']),
    );
    expect(shareCandidateRoleNames('order')).not.toContain('會計');
    expect(shareCandidateRoleNames('order')).not.toContain('生管');
  });

  it('工單：印務、印務主管、生管、訂單管理人、Supervisor、業務、諮詢', () => {
    expect(sorted(shareCandidateRoleNames('workOrder'))).toEqual(
      sorted(['印務', '印務主管', '生管', '訂單管理人', 'Supervisor', '業務', '諮詢']),
    );
  });

  it('需求單：業務、諮詢、業務主管、印務主管、Supervisor', () => {
    expect(sorted(shareCandidateRoleNames('quote'))).toEqual(
      sorted(['業務', '諮詢', '業務主管', '印務主管', 'Supervisor']),
    );
  });
});

describe('未列即不可做：出貨單與品檢站的入口', () => {
  it('生管、品檢人員沒有出貨單檢視列（出貨管理入口不顯示）', () => {
    expect(hasEntry('production_planner', { card: 'VDLV', sec: '出貨單' })).toBe(false);
    expect(hasEntry('qc_inspector', { card: 'VDLV', sec: '出貨單' })).toBe(false);
  });

  it('揀貨、出貨人員、業務主管、印務主管、印務有出貨單入口', () => {
    for (const role of ['picker', 'shipper', 'sales_manager', 'print_manager', 'print_officer', 'supervisor']) {
      expect(hasEntry(role, { card: 'VDLV', sec: '出貨單' })).toBe(true);
    }
  });

  it('活動清單沒有列出的角色對出貨單作廢回不可以', () => {
    const op = activitiesOfOp('OP-SHP-013')[0].op;
    expect(op).toBe('OP-SHP-013');
    // OP-SHP-012 作廢出貨單：ACT-SHP-015、027、033
    expect(activitiesOfOp('OP-SHP-012').length).toBeGreaterThan(0);
    expect(canDo(person('production_planner', '許文傑'), 'OP-SHP-012', { '訂單 接單業務': '洪嘉駿' })).toBe(false);
    expect(canDo(person('picker', '范姜宏'), 'OP-SHP-012', {})).toBe(false);
    // 對照：六個全公司協助角色可作廢，不看負責人
    expect(canDo(person('print_manager', '吳國豪'), 'OP-SHP-012', { '訂單 接單業務': '洪嘉駿' })).toBe(true);
  });
});

describe('範圍比對：自己負責、被分享層級、所屬產線', () => {
  const rows = (id) => activitiesOfOp('OP-TSK-008').find((r) => r.id === id);

  it('所屬產線：生管看自己所屬產線的生產任務，不在所屬產線內就看不到', () => {
    const row = rows('ACT-VPRD-049');
    expect(row.scope).toBe(SCOPE.LINE);
    const planner = person('production_planner', '許文傑', ['數位產線', '裝訂產線']);
    expect(rowMatches(row, planner, { '生產任務 產線': '數位產線' })).toBe(true);
    expect(rowMatches(row, planner, { '生產任務 產線': '壓克力產線' })).toBe(false);
  });

  it('檢視層級的分享成員不會命中被分享（編輯）列', () => {
    const editRow = activitiesOfOp('OP-ORD-020').find((r) => r.scope === SCOPE.SHARED_EDIT);
    const viewer = person('sales', '陳映蓉');
    expect(rowMatches(editRow, viewer, { '訂單 分享成員': [{ name: '陳映蓉', level: 'view' }] })).toBe(false);
    expect(rowMatches(editRow, viewer, { '訂單 分享成員': [{ name: '陳映蓉', level: 'edit' }] })).toBe(true);
  });
});

// 12.53 下載中心：入口、檢視、下載、列印物流單只給活動清單列出的出貨人員（ACT-VDLV-016、ACT-OUT-017、ACT-SHP-044）
describe('12.53 活動清單沒有列出的角色進不了下載中心', () => {
  const VIEW_DLF = { card: 'VDLV', sec: '下載檔案' };

  it('出貨人員有下載中心入口、範圍全公司，可檢視、下載與列印物流單', () => {
    expect(hasEntry('shipper', VIEW_DLF)).toBe(true);
    expect(listScopeOf('shipper', VIEW_DLF)).toBe('all');
    for (const op of ['OP-DLF-001', 'OP-DLF-002', 'OP-DLF-003']) {
      expect(activitiesOfOp(op).length, op).toBeGreaterThan(0);
      expect(canDo(person('shipper', '曾志偉'), op, {}), op).toBe(true);
    }
  });

  it('業務與其他角色沒有下載中心入口，繞過介面送出下載或列印物流單擋下', () => {
    for (const role of ['sales', 'sales_manager', 'picker', 'print_manager', 'supervisor', 'qc_inspector']) {
      expect(hasEntry(role, VIEW_DLF), role).toBe(false);
      for (const op of ['OP-DLF-001', 'OP-DLF-002', 'OP-DLF-003']) {
        expect(canDo(person(role, '測試'), op, { '訂單 接單業務': '測試' }), `${role} ${op}`).toBe(false);
      }
    }
  });

  it('確認可出貨與撤回確認可出貨只給揀貨人員（ACT-SHP-042、043）；業務沒有', () => {
    for (const op of ['OP-SHP-023', 'OP-SHP-024']) {
      expect(canDo(person('picker', '范姜宏'), op, {}), op).toBe(true);
      expect(canDo(person('sales', '洪嘉駿'), op, { '訂單 接單業務': '洪嘉駿' }), op).toBe(false);
      expect(canDo(person('shipper', '曾志偉'), op, {}), op).toBe(false);
    }
  });

  it('重新同步、補附送達憑證、下載全部物流單已不在活動表', () => {
    expect(activitiesOfOp('OP-SHP-019')).toEqual([]);
    expect(activitiesOfOp('OP-SHP-015')).toEqual([]);
    expect(activitiesOfOp('OP-SHP-014')).toEqual([]);
  });
});
