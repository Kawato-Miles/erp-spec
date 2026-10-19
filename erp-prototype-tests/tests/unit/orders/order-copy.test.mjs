// 情境目錄 2.28（單據權責修正第七批）：複製訂單的操作者依活動清單，新訂單的接單業務記執行複製的人。
// 規則正本：wiki 訂單審核活動清單 ACT-APV-017 至 019、訂單複製建單情境卡、訂單實體卡（接單業務、訂單複製來源）。
// 能複製者：對來源訂單自己負責（業務、諮詢）、被分享（編輯）者、六個全公司協助角色；檢視層級分享成員與其餘角色不可。
// 來源訂單任一狀態皆可；帶入客戶面、報價面、帳務公司、配送面與備註，不帶收款項目、發票、稿件、工單與活動紀錄。
// 畫面操作在 tests/e2e/02-order-setup/copy-order.spec.mjs。
import { beforeEach, describe, expect, it } from 'vitest';
import * as perms from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

const ASSIST = [
  ['sales_manager', '林雅婷'],
  ['order_manager', '黃聖雯'],
  ['print_manager', '吳國豪'],
  ['print_officer', '周建宏'],
  ['reviewer_supervisor', '魏彣軒'],
  ['supervisor', '王大明'],
];
const NOT_ALLOWED = [
  ['accountant', '陳美玲'],
  ['production_planner', '許文傑'],
  ['picker', '范姜宏'],
  ['shipper', '曾志偉'],
  ['qc_inspector', '郭淑芬'],
  ['reviewer', '魏彣軒'],
];
const order = (patch = {}) => ({
  status: '訂單完成',
  order_type: '線下單',
  sales_person: '洪嘉駿',
  assigned_manager: '林雅婷',
  shared_members: [
    { name: '陳映蓉', level: 'edit' },
    { name: '蘇怡君', level: 'view' },
  ],
  ...patch,
});

// 起點資料：鏈一 ORD-2026-0601（訂單完成，接單業務洪嘉駿，陳映蓉為編輯層級分享成員，有兩筆以上的帳務紀錄與稿件審稿輪次）；
// 鏈四 ORD-2026-0820（陳映蓉為檢視層級分享成員）
const SOURCE_ID = 'ORD-2026-0601';
const VIEW_ONLY_ID = 'ORD-2026-0820';

describe('2.28 複製訂單：誰可以複製', () => {
  it('接單業務、編輯層級分享成員、六個全公司協助角色可以；任一狀態的來源訂單皆可', () => {
    for (const status of ['草稿', '製作中', '訂單完成', '已取消']) {
      const o = order({ status });
      expect(perms.canCopyOrder(o, 'sales', '洪嘉駿'), `接單業務 ${status}`).toBe(true);
      expect(perms.canCopyOrder(o, 'sales', '陳映蓉'), `編輯分享成員 ${status}`).toBe(true);
      for (const [role, name] of ASSIST) expect(perms.canCopyOrder(o, role, name), `${role} ${status}`).toBe(true);
    }
  });

  it('接單的諮詢也可以複製自己負責的訂單', () => {
    expect(perms.canCopyOrder(order({ sales_person: '張惠雯' }), 'consultant', '張惠雯')).toBe(true);
  });

  it('檢視層級分享成員、非負責又未被分享的業務、會計與現場角色都不可', () => {
    const o = order();
    expect(perms.canCopyOrder(o, 'consultant', '蘇怡君'), '檢視層級分享成員').toBe(false);
    expect(perms.canCopyOrder(o, 'sales', '李志豪'), '非負責業務').toBe(false);
    for (const [role, name] of NOT_ALLOWED) expect(perms.canCopyOrder(o, role, name), role).toBe(false);
    expect(perms.canCopyOrder(null, 'sales', '洪嘉駿'), '查無訂單').toBe(false);
  });
});

describe('2.28 複製訂單：新訂單的接單業務為執行複製的人', () => {
  const initial = useOrdersStore.getState().orders;
  const store = () => useOrdersStore.getState();

  beforeEach(() => {
    useOrdersStore.setState({ orders: initial });
    useSessionStore.setState({ role: 'sales', userName: null });
  });

  it('編輯層級分享成員（業務乙）複製：新單為草稿、接單業務是業務乙、沒有分享成員', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    const result = store().duplicateOrder(SOURCE_ID);
    expect(result.ok).toBe(true);
    const copy = store().getOrder(result.id);
    expect(copy.order_no).not.toBe(SOURCE_ID);
    expect(copy.status).toBe('草稿');
    expect(copy.sales_person).toBe('陳映蓉');
    expect(copy.shared_members).toEqual([]);
    expect(copy.copy_source_order_no).toBe(SOURCE_ID);
  });

  it('訂單管理人（全公司協助角色）複製訂單完成的訂單：接單業務是訂單管理人', () => {
    useSessionStore.setState({ role: 'order_manager', userName: null });
    const result = store().duplicateOrder(SOURCE_ID);
    expect(result.ok).toBe(true);
    expect(store().getOrder(result.id).sales_person).toBe('黃聖雯');
  });

  it('接單業務自己複製：接單業務仍是自己', () => {
    const result = store().duplicateOrder(SOURCE_ID);
    expect(result.ok).toBe(true);
    expect(store().getOrder(result.id).sales_person).toBe('洪嘉駿');
  });

  it('帶入客戶、印件規格、報價與備註；不帶收款項目、發票、稿件、審稿與分享成員', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    const source = store().getOrder(SOURCE_ID);
    expect(source.billing_installments.length).toBeGreaterThan(0);
    expect(source.payments.length).toBeGreaterThan(0);
    const result = store().duplicateOrder(SOURCE_ID);
    const copy = store().getOrder(result.id);
    // 帶入
    expect(copy.client_name).toBe(source.client_name);
    expect(copy.case_name).toBe(source.case_name);
    expect(copy.customer).toEqual(source.customer);
    expect(copy.account_company).toBe(source.account_company);
    expect(copy.order_note).toBe(source.order_note);
    expect(copy.delivery_note).toBe(source.delivery_note);
    expect(copy.payment_note).toBe(source.payment_note);
    expect(copy.payment_terms_note).toBe(source.payment_terms_note);
    expect(copy.print_items.map((p) => [p.name, p.ordered_qty, p.unit_price_untaxed, p.spec_notes])).toEqual(
      source.print_items.map((p) => [p.name, p.ordered_qty, p.unit_price_untaxed, p.spec_notes]),
    );
    expect(copy.print_items.map((p) => p.undeducted_internal_due_date)).toEqual(
      source.print_items.map((p) => p.undeducted_internal_due_date),
    );
    expect(copy.other_fees.map((f) => f.amount_untaxed)).toEqual(source.other_fees.map((f) => f.amount_untaxed));
    expect(copy.total_amount_taxed).toBe(source.total_amount_taxed);
    // 不帶
    expect(copy.billing_installments).toEqual([]);
    expect(copy.payments).toEqual([]);
    expect(copy.invoices).toEqual([]);
    expect(copy.adjustments).toEqual([]);
    expect(copy.signed_files).toEqual([]);
    expect(copy.attachments).toEqual([]);
    // 印件：新編號、回到審稿起點，稿件與審稿輪次不繼承
    copy.print_items.forEach((p, i) => {
      const src = source.print_items[i];
      expect(p.print_item_no).not.toBe(src.print_item_no);
      expect(p.id).not.toBe(src.id);
      expect(p.print_item_status).toBe('等待中');
      expect(p.review_status).toBe('待分派');
      expect(p.files).toEqual([]);
      expect(p.review_rounds).toEqual([]);
      expect(p.current_round_id).toBeNull();
      expect(p.assigned_reviewer_id).toBeNull();
    });
  });

  it('兩張訂單各寫一筆活動紀錄：新單記複製自來源、來源記衍生出新單；新單活動紀錄不繼承', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    const result = store().duplicateOrder(SOURCE_ID);
    const copy = store().getOrder(result.id);
    const source = store().getOrder(SOURCE_ID);
    expect(copy.activities).toHaveLength(1);
    expect(copy.activities[0].actor).toBe('陳映蓉');
    expect(copy.activities[0].action).toContain(`複製自 ${SOURCE_ID}`);
    const last = source.activities[source.activities.length - 1];
    expect(last.actor).toBe('陳映蓉');
    expect(last.action).toContain(`衍生出新訂單 ${copy.order_no}`);
  });

  it('改新訂單不影響來源訂單', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    const before = JSON.stringify(store().getOrder(SOURCE_ID).print_items);
    const result = store().duplicateOrder(SOURCE_ID);
    const copy = store().getOrder(result.id);
    copy.print_items[0].ordered_qty = 1; // 直接動新單的資料列
    expect(JSON.stringify(store().getOrder(SOURCE_ID).print_items)).toBe(before);
  });

  it('檢視層級分享成員繞過介面直接呼叫：被擋下，沒有新訂單', () => {
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    const countBefore = store().orders.length;
    const result = store().duplicateOrder(VIEW_ONLY_ID);
    expect(result.ok).toBe(false);
    expect(store().orders).toHaveLength(countBefore);
  });

  it('會計與非負責業務繞過介面直接呼叫：被擋下', () => {
    const countBefore = store().orders.length;
    useSessionStore.setState({ role: 'accountant', userName: null });
    expect(store().duplicateOrder(SOURCE_ID).ok).toBe(false);
    // 業務乙陳映蓉不是 ORD-2026-0710 的接單業務、也不在分享成員
    useSessionStore.setState({ role: 'sales', userName: '陳映蓉' });
    expect(store().duplicateOrder('ORD-2026-0710').ok).toBe(false);
    expect(store().orders).toHaveLength(countBefore);
  });
});
