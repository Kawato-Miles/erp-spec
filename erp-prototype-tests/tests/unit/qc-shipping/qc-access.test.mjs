// 情境目錄 11.31（單據權責修正第五批）：品檢待驗清單與品檢紀錄的可見範圍依活動清單。
// 待驗清單：品檢人員、印務主管、Supervisor 全公司，印務看自己負責工單，被分享工單的人看該單；
// 品檢紀錄：另含揀貨與出貨人員全公司、業務與諮詢看自己負責或被分享訂單。生管、會計沒有入口。
// 依據：生產單據檢視活動清單（ACT-VPRD-010 至 026、076、077）。畫面見 tests/e2e/11-qc/access-scope.spec.mjs。
import { describe, expect, it } from 'vitest';
import {
  hasQcEntry,
  qcRowAccess,
  qcRowFacts,
  visibleQcRows,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/qc-access.js';

const ORDER_A = { order_no: 'ORD-A', sales_person: '洪嘉駿', shared_members: [{ name: '陳映蓉', level: 'edit' }] };
const ORDER_B = { order_no: 'ORD-B', sales_person: '賴柏宇', shared_members: [{ name: '李志豪', level: 'view' }] };
const WO_A = { work_order_no: 'WO-A', owner: '周建宏', shared_members: [{ name: '張惠雯', level: 'edit' }] };
const WO_B = { work_order_no: 'WO-B', owner: '蔡明修', shared_members: [] };

const person = (role, userName) => ({ role, userName, lines: [] });
const facts = (order, workOrders) => qcRowFacts({ order, workOrders });
const A = facts(ORDER_A, [WO_A]);
const B = facts(ORDER_B, [WO_B]);

describe('11.31 待驗清單與品檢紀錄的可見範圍', () => {
  it('品檢人員、印務主管、Supervisor：待驗清單與品檢紀錄全公司', () => {
    for (const [role, name] of [['qc_inspector', '郭淑芬'], ['print_manager', '吳國豪'], ['supervisor', '王大明']]) {
      for (const f of [A, B]) {
        expect(qcRowAccess(person(role, name), f)).toEqual({ queue: true, records: true });
      }
    }
  });

  it('印務：只看自己負責工單底下的印件（待驗清單與品檢紀錄）', () => {
    expect(qcRowAccess(person('print_officer', '周建宏'), A)).toEqual({ queue: true, records: true });
    expect(qcRowAccess(person('print_officer', '周建宏'), B)).toEqual({ queue: false, records: false });
    expect(qcRowAccess(person('print_officer', '蔡明修'), A)).toEqual({ queue: false, records: false });
  });

  it('業務、諮詢：沒有待驗清單，品檢紀錄只看自己負責或被分享訂單', () => {
    expect(qcRowAccess(person('sales', '洪嘉駿'), A)).toEqual({ queue: false, records: true });
    expect(qcRowAccess(person('sales', '洪嘉駿'), B)).toEqual({ queue: false, records: false });
    expect(qcRowAccess(person('sales', '陳映蓉'), A)).toEqual({ queue: false, records: true });
    expect(qcRowAccess(person('sales', '李志豪'), B)).toEqual({ queue: false, records: true });
    expect(qcRowAccess(person('consultant', '蘇怡君'), A)).toEqual({ queue: false, records: false });
  });

  it('被分享工單的人看得到該工單底下印件的待驗清單與品檢紀錄', () => {
    expect(qcRowAccess(person('consultant', '張惠雯'), A)).toEqual({ queue: true, records: true });
    expect(qcRowAccess(person('consultant', '張惠雯'), B)).toEqual({ queue: false, records: false });
  });

  it('揀貨人員、出貨人員：品檢紀錄全公司，沒有待驗清單', () => {
    for (const [role, name] of [['picker', '范姜宏'], ['shipper', '曾志偉']]) {
      for (const f of [A, B]) {
        expect(qcRowAccess(person(role, name), f)).toEqual({ queue: false, records: true });
      }
    }
  });

  it('生管、會計、師傅、廠務、審稿人員、訂單管理人都沒有品檢檢視', () => {
    for (const [role, name] of [
      ['production_planner', '許文傑'],
      ['accountant', '陳美玲'],
      ['master', '劉阿海'],
      ['facility_staff', '簡俊男'],
      ['reviewer', '魏彣軒'],
      ['order_manager', '黃聖雯'],
    ]) {
      expect(qcRowAccess(person(role, name), A)).toEqual({ queue: false, records: false });
      expect(hasQcEntry(role)).toBe(false);
    }
  });

  it('品檢站入口：品檢人員、印務主管、Supervisor、印務、業務、諮詢、揀貨、出貨有，其餘沒有', () => {
    for (const role of ['qc_inspector', 'print_manager', 'supervisor', 'print_officer', 'sales', 'consultant', 'picker', 'shipper']) {
      expect(hasQcEntry(role)).toBe(true);
    }
  });

  it('visibleQcRows 依人員過濾並標記每列的待驗清單與品檢紀錄可見性；兩者皆不可見的列不列出', () => {
    const rows = [
      { print_item_no: 'PI-A', order_no: 'ORD-A' },
      { print_item_no: 'PI-B', order_no: 'ORD-B' },
    ];
    const orders = [ORDER_A, ORDER_B];
    const workOrdersOf = (no) => (no === 'PI-A' ? [WO_A] : [WO_B]);
    const list = (role, name) =>
      visibleQcRows({ rows, person: person(role, name), orders, workOrdersOf }).map((r) => [
        r.print_item_no,
        r.queue_visible,
        r.records_visible,
      ]);
    expect(list('print_officer', '周建宏')).toEqual([['PI-A', true, true]]);
    expect(list('sales', '洪嘉駿')).toEqual([['PI-A', false, true]]);
    expect(list('qc_inspector', '郭淑芬')).toEqual([['PI-A', true, true], ['PI-B', true, true]]);
    expect(list('picker', '范姜宏')).toEqual([['PI-A', false, true], ['PI-B', false, true]]);
    expect(list('production_planner', '許文傑')).toEqual([]);
  });

  it('只有品檢紀錄可見的人（業務、諮詢、揀貨、出貨）只列出已有品檢紀錄的印件；有待驗清單可見的列不受限', () => {
    const rows = [
      { print_item_no: 'PI-A', order_no: 'ORD-A' },
      { print_item_no: 'PI-B', order_no: 'ORD-B' },
    ];
    const orders = [ORDER_A, ORDER_B];
    const workOrdersOf = (no) => (no === 'PI-A' ? [WO_A] : [WO_B]);
    const recordedNos = new Set(['PI-B']);
    const list = (role, name) =>
      visibleQcRows({ rows, person: person(role, name), orders, workOrdersOf, recordedNos }).map(
        (r) => r.print_item_no,
      );
    expect(list('picker', '范姜宏')).toEqual(['PI-B']);
    expect(list('sales', '洪嘉駿')).toEqual([]);
    expect(list('sales', '李志豪')).toEqual(['PI-B']);
    expect(list('qc_inspector', '郭淑芬')).toEqual(['PI-A', 'PI-B']);
    expect(list('print_officer', '周建宏')).toEqual(['PI-A']);
  });
});
