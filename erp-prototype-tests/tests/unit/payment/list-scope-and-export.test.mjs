// 情境目錄 3.25、3.27（單據權責修正第六批）：四張跨訂單清單的可見範圍依活動清單、匯出對帳明細與匯出待退款報表的操作者。
// 依據：訂單與帳務檢視活動清單（ACT-VORD-019 至 042）、輸出活動清單（ACT-OUT-004 至 009、012 至 014）。
// 範圍判斷：業務、諮詢在應收款項看全公司、其餘三張只看自己負責；被分享（檢視或編輯）的訂單項目一律列入；
// 業務主管、會計、Supervisor 看全公司；其餘角色沒有任何列。畫面見 tests/e2e/03-payment/billing-access-scope.spec.mjs。
// 清單入口的側欄判斷見 tests/unit/access/menu-and-roster.test.mjs。
import { describe, expect, it } from 'vitest';
import {
  billingAnomalyRows,
  pendingInvoiceRows,
  receivableRows,
  refundPayoutRows,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/derive.js';
import {
  canExportReconciliation,
  canExportRefundReport,
  canSeeOrderInList,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/access.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/payment/_lib/mock-data.js';

const person = (role, userName) => ({ role, userName, lines: [] });
const JIA = person('sales', '洪嘉駿'); // 業務甲：mock 全部訂單的接單業務
const YI = person('sales', '陳映蓉'); // 業務乙：ORD-2026-0820 檢視、ORD-2026-0601 編輯層級分享
const CONSULT_YI = person('consultant', '蘇怡君'); // 諮詢乙：ORD-2026-0815 編輯層級分享
const CONSULT_JIA = person('consultant', '張惠雯'); // ORD-2026-0710 檢視層級分享
const MANAGER = person('sales_manager', '林雅婷');
const ACCOUNTANT = person('accountant', '陳美玲');
const SUPERVISOR = person('supervisor', '王大明');
const OFFICER = person('print_officer', '周建宏');
const PLANNER = person('production_planner', '許文傑');
const MASTER = person('master', '劉阿海');

const nos = (rows) => [...new Set(rows.map((r) => r.order_no))].sort();

// 合成訂單：mock 沒有退款款項與帳務異常，這兩張清單的範圍用合成資料驗
const synth = (order_no, sales_person, shared_members = []) => ({
  order_no,
  case_name: `案名 ${order_no}`,
  client_name: '合成客戶',
  sales_person,
  assigned_manager: '林雅婷',
  shared_members,
  account_company: 'SSP',
  status: '製作中',
  created_date: '2026-10-01',
  receivable_taxed: 1000,
  billing_installments: [],
  invoices: [],
  payments: [
    { id: `P-${order_no}-R`, type: '退款', status: '處理中', amount_taxed: -500, refund_account: '012-345', created_at: '2026-10-02' },
    { id: `P-${order_no}-1`, type: '收款', status: '已完成', amount_taxed: 1500, cancelled: false },
  ],
});
const SYNTH = [
  synth('SYN-A', '洪嘉駿'),
  synth('SYN-B', '賴柏宇', [{ name: '陳映蓉', level: 'edit' }]),
  synth('SYN-C', '賴柏宇', [{ name: '周建宏', level: 'view' }]),
  synth('SYN-D', '賴柏宇'),
];

describe('3.25 待開發票清單：業務與諮詢看自己負責與被分享的訂單，業務主管、會計、Supervisor 看全公司', () => {
  const rowsOf = (p) => nos(pendingInvoiceRows(MOCK_ORDERS, { person: p }));
  const ALL = nos(pendingInvoiceRows(MOCK_ORDERS));

  it('接單業務洪嘉駿看到自己負責的全部訂單', () => {
    expect(rowsOf(JIA)).toEqual(ALL);
    expect(ALL.length).toBeGreaterThan(3);
  });

  it('業務乙陳映蓉只被分享兩張訂單：檢視層級的 ORD-2026-0820 列入，不列別人的訂單', () => {
    const rows = rowsOf(YI);
    expect(rows).toContain('ORD-2026-0820');
    expect(rows).not.toContain('ORD-2026-0710');
    expect(rows).not.toContain('ORD-2026-0815');
    for (const no of rows) expect(['ORD-2026-0601', 'ORD-2026-0820']).toContain(no);
  });

  it('諮詢乙蘇怡君被分享（編輯）ORD-2026-0815：該訂單的待開發票期次列入，別的訂單不列', () => {
    expect(rowsOf(CONSULT_YI)).toEqual(['ORD-2026-0815']);
  });

  it('業務主管、會計、Supervisor 看全公司', () => {
    for (const p of [MANAGER, ACCOUNTANT, SUPERVISOR]) expect(rowsOf(p)).toEqual(ALL);
  });

  it('沒有訂單檢視列、也沒被分享的角色一列都不列', () => {
    for (const p of [OFFICER, PLANNER, MASTER]) expect(rowsOf(p)).toEqual([]);
  });

  it('不帶人員時只做清單衍生，不過濾（純衍生）', () => {
    expect(ALL).toContain('ORD-2026-0710');
  });
});

describe('3.25 應收款項清單：業務與諮詢看全公司（獨立列），不因自己沒有負責而少列', () => {
  const rowsOf = (p) => nos(receivableRows(MOCK_ORDERS, { person: p }));
  const ALL = nos(receivableRows(MOCK_ORDERS));

  it('業務乙、諮詢乙、洪嘉駿都看到全公司', () => {
    for (const p of [JIA, YI, CONSULT_YI, CONSULT_JIA]) expect(rowsOf(p)).toEqual(ALL);
  });

  it('業務主管、會計、Supervisor 看全公司', () => {
    for (const p of [MANAGER, ACCOUNTANT, SUPERVISOR]) expect(rowsOf(p)).toEqual(ALL);
  });

  it('印務沒有被分享任何訂單時一列都不列；被分享的訂單看得到（檢視層級即可）', () => {
    expect(rowsOf(OFFICER)).toEqual([]);
    const shared = MOCK_ORDERS.map((o) =>
      o.order_no === 'ORD-2026-0815' ? { ...o, shared_members: [{ name: '周建宏', level: 'view' }] } : o,
    );
    expect(nos(receivableRows(shared, { person: OFFICER }))).toEqual(['ORD-2026-0815']);
  });
});

describe('3.25 待退款與帳務異常清單：業務與諮詢看自己負責與被分享的訂單，協助以外的角色只看被分享', () => {
  const refund = (p) => nos(refundPayoutRows(SYNTH, { person: p }));
  const anomaly = (p) => nos(billingAnomalyRows(SYNTH, { person: p }));

  it('洪嘉駿只看自己負責的 SYN-A；陳映蓉看被分享（編輯）的 SYN-B', () => {
    expect(refund(JIA)).toEqual(['SYN-A']);
    expect(anomaly(JIA)).toEqual(['SYN-A']);
    expect(refund(YI)).toEqual(['SYN-B']);
    expect(anomaly(YI)).toEqual(['SYN-B']);
  });

  it('被分享（檢視）的印務看得到該訂單，其餘不列', () => {
    expect(refund(OFFICER)).toEqual(['SYN-C']);
    expect(anomaly(OFFICER)).toEqual(['SYN-C']);
  });

  it('業務主管、會計、Supervisor 看全公司四張訂單', () => {
    const all = ['SYN-A', 'SYN-B', 'SYN-C', 'SYN-D'];
    for (const p of [MANAGER, ACCOUNTANT, SUPERVISOR]) {
      expect(refund(p)).toEqual(all);
      expect(anomaly(p)).toEqual(all);
    }
  });

  it('沒有任何列的角色一列都不列', () => {
    expect(refund(PLANNER)).toEqual([]);
    expect(anomaly(MASTER)).toEqual([]);
  });

  it('單筆判斷與清單一致', () => {
    expect(canSeeOrderInList(SYNTH[1], YI, 'refund')).toBe(true);
    expect(canSeeOrderInList(SYNTH[3], YI, 'refund')).toBe(false);
    expect(canSeeOrderInList(SYNTH[3], YI, 'receivable')).toBe(true); // 應收款項業務全公司
    expect(canSeeOrderInList(SYNTH[3], ACCOUNTANT, 'billingAnomaly')).toBe(true);
  });
});

describe('3.27 匯出對帳明細：看得到應收款項清單的角色都可匯出；匯出待退款報表只給業務主管、會計、Supervisor', () => {
  it('業務、諮詢、業務主管、會計、Supervisor 可匯出對帳明細', () => {
    for (const p of [JIA, YI, CONSULT_YI, MANAGER, ACCOUNTANT, SUPERVISOR]) {
      expect(canExportReconciliation(p, MOCK_ORDERS)).toBe(true);
    }
  });

  it('印務、生管、師傅沒有任何被分享訂單時不可匯出；被分享訂單（檢視或編輯）可匯出', () => {
    for (const p of [OFFICER, PLANNER, MASTER]) expect(canExportReconciliation(p, MOCK_ORDERS)).toBe(false);
    expect(canExportReconciliation(OFFICER, SYNTH)).toBe(true); // SYN-C 檢視層級
  });

  it('只有業務主管、會計、Supervisor 可匯出待退款報表', () => {
    for (const p of [MANAGER, ACCOUNTANT, SUPERVISOR]) expect(canExportRefundReport(p)).toBe(true);
  });

  it('業務、諮詢（含被分享編輯）與其餘角色不可匯出待退款報表：不隨清單檢視權開放', () => {
    for (const p of [JIA, YI, CONSULT_YI, CONSULT_JIA, OFFICER, PLANNER, MASTER]) {
      expect(canExportRefundReport(p)).toBe(false);
    }
  });
});
