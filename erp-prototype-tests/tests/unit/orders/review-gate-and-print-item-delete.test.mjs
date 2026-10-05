// 情境目錄 2.14～2.17、4.18～4.20：線下單送審條件、核准當下重檢、成立前刪除印件。
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的 order-management
// 規格差異檔 Scenario THEN；規則正本 wiki [[訂單狀態]]「草稿 → 待業務主管審核」列、
// [[明細時點分界]] § 階段一的印件存廢子分界。畫面操作的驗收見 tests/e2e/02-order-setup/ 與
// tests/e2e/04-order-print-item/。
//
// 本檔先寫、功能後做（tasks 2.2）：新規則以命名空間取用，函式還沒實作時該條測試失敗、其餘照跑。
// 本檔訂下的介面（由 tasks 4.1、4.2 實作）：
//   permissions.js
//     missingReviewConditions(order) → 缺項清單（字串陣列，依序：訂單須知、交貨備註、付款備註、
//       收款條件備註、至少一期收款項目）；齊備時為空陣列
//     canSubmitOrderForReview(order, role, userName) → 「送主管審核」顯示對象（草稿態、負責該單的業務或諮詢）
//     canDeletePrintItem(order, role, userName) → 印件列「刪除」顯示對象（線下單審核段、負責該單的業務或諮詢）
//   store.js（useOrdersStore）
//     submitForReview(id) → { ok, missing?, reason? }
//     approveOrder(id) → { ok, missing?, reason? }
//     deletePrintItem(orderId, itemId) → { ok, reason? }
import { beforeEach, describe, expect, it } from 'vitest';
import * as perms from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/permissions.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { deriveOrderAmounts } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/order-amounts.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

const ORDER_ID = 'ORD-2026-0814';
const STICKER_ID = 'pi-2026-0843'; // 貼紙 700 × 2.5 ＝ 1,750
const ALL_MISSING_LABELS = ['訂單須知', '交貨備註', '付款備註', '收款條件備註', '至少一期收款項目'];

const initialOrders = useOrdersStore.getState().orders;
const store = () => useOrdersStore.getState();
const orderOf = (id = ORDER_ID) => store().orders.find((o) => o.id === id);
const actAs = (role) => useSessionStore.setState({ role });
const lastActivity = (id = ORDER_ID) => orderOf(id).activities.at(-1);

// 一期收款項目（只填送審要看的欄位，其餘沿用新增時的預設）
const installment = (description, amount_taxed, extra = {}) => ({
  id: `BI-TEST-${description}`,
  description,
  amount_taxed,
  payment_status: '未收',
  invoice_status: '未開立',
  cancelled: false,
  ...extra,
});

// 四格備註齊、兩期未取消收款項目（3,938＋9,188）的草稿單：ORD-2026-0814 補完送審條件後的樣子
const completeDraft = (patch = {}) => ({
  ...orderOf(),
  order_note: '印刷色差以打樣為準',
  delivery_note: '宅配至青硯文具倉庫',
  payment_note: '匯款後請提供後五碼',
  payment_terms_note: '訂金 30% 回簽後匯款、尾款出貨前結清',
  billing_installments: [installment('訂金', 3938), installment('尾款', 9188)],
  ...patch,
});

// 把 ORD-2026-0814 直接換成指定內容（前置步驟，不經畫面）
const seedOrder = (order) =>
  useOrdersStore.setState({
    orders: store().orders.map((o) => (o.id === order.id ? order : o)),
  });

beforeEach(() => {
  useOrdersStore.setState({ orders: initialOrders });
  actAs('sales');
});

describe('2.14 線下單送審條件不齊時列出缺項，已取消的收款項目不算數', () => {
  it('起點資料 ORD-2026-0814 缺交貨備註、收款條件備註、至少一期收款項目三項', () => {
    expect(perms.missingReviewConditions(orderOf())).toEqual([
      '交貨備註',
      '收款條件備註',
      '至少一期收款項目',
    ]);
  });

  it('四格備註全空又沒有收款項目時五項全列，順序固定', () => {
    const empty = completeDraft({
      order_note: '',
      delivery_note: '',
      payment_note: '',
      payment_terms_note: '',
      billing_installments: [],
    });
    expect(perms.missingReviewConditions(empty)).toEqual(ALL_MISSING_LABELS);
  });

  it('每補一項缺項就少一項，四格與一期收款項目都齊時缺項為空', () => {
    let draft = completeDraft({ delivery_note: '', payment_terms_note: '', billing_installments: [] });
    expect(perms.missingReviewConditions(draft)).toHaveLength(3);
    draft = { ...draft, delivery_note: '宅配至青硯文具倉庫' };
    expect(perms.missingReviewConditions(draft)).toEqual(['收款條件備註', '至少一期收款項目']);
    draft = { ...draft, payment_terms_note: '全額出貨前結清' };
    expect(perms.missingReviewConditions(draft)).toEqual(['至少一期收款項目']);
    draft = { ...draft, billing_installments: [installment('全額', 13126)] };
    expect(perms.missingReviewConditions(draft)).toEqual([]);
  });

  it('唯一一期收款項目已取消時，缺項只列「至少一期收款項目」', () => {
    const draft = completeDraft({
      billing_installments: [installment('全額', 13126, { cancelled: true, cancel_reason: '客戶改分期' })],
    });
    expect(perms.missingReviewConditions(draft)).toEqual(['至少一期收款項目']);
  });

  it('條件不齊時送審被擋下並回缺項，訂單維持草稿、不留送審活動紀錄', () => {
    const before = orderOf().activities.length;
    const result = store().submitForReview(ORDER_ID);
    expect(result).toMatchObject({
      ok: false,
      missing: ['交貨備註', '收款條件備註', '至少一期收款項目'],
    });
    expect(orderOf().status).toBe('草稿');
    expect(orderOf().activities).toHaveLength(before);
  });

  it('條件齊備時送審推進至待業務主管審核，活動紀錄事件為「送主管審核」、操作者為業務', () => {
    seedOrder(completeDraft());
    const result = store().submitForReview(ORDER_ID);
    expect(result).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('待業務主管審核');
    expect(lastActivity()).toMatchObject({ actor: '洪嘉駿', action: '送主管審核' });
  });
});

describe('2.15 收款項目合計不一致、沒有印件、應收總額 0 元時照樣送得出審核', () => {
  it('合計 3,938 與應收總額 13,126 不一致不算缺項，送審照樣推進', () => {
    seedOrder(completeDraft({ billing_installments: [installment('訂金', 3938)] }));
    expect(deriveOrderAmounts(orderOf()).receivable_taxed).toBe(13126);
    expect(perms.missingReviewConditions(orderOf())).toEqual([]);
    expect(store().submitForReview(ORDER_ID)).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('待業務主管審核');
  });

  it('沒有印件不算缺項：刪光印件只剩運費 200、稅額 10、應收總額 210，送審照樣推進', () => {
    seedOrder(completeDraft({ print_items: [], billing_installments: [installment('全額', 210)] }));
    expect(deriveOrderAmounts(orderOf())).toMatchObject({
      total_amount_untaxed: 200,
      tax_amount: 10,
      receivable_taxed: 210,
    });
    expect(perms.missingReviewConditions(orderOf())).toEqual([]);
    expect(store().submitForReview(ORDER_ID)).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('待業務主管審核');
  });

  it('應收總額 0 的訂單以預計金額 0 的一期收款項目送審，0 元期算數', () => {
    seedOrder(completeDraft({ print_items: [], other_fees: [], billing_installments: [] }));
    store().addBillingInstallment(ORDER_ID, { description: '零元期', amount_taxed: 0 });
    expect(orderOf().billing_installments.at(-1).amount_taxed).toBe(0);
    expect(deriveOrderAmounts(orderOf()).receivable_taxed).toBe(0);
    expect(perms.missingReviewConditions(orderOf())).toEqual([]);
    expect(store().submitForReview(ORDER_ID)).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('待業務主管審核');
  });
});

describe('2.16 業務主管核准當下重檢送審條件', () => {
  const pendingReview = (patch = {}) =>
    completeDraft({ status: '待業務主管審核', assigned_manager: '林雅婷', ...patch });

  it('條件齊備時指定的業務主管核准推進至審核通過，活動紀錄事件為「核准訂單（成交條件審核）」', () => {
    seedOrder(pendingReview());
    actAs('sales_manager');
    expect(store().approveOrder(ORDER_ID)).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('審核通過');
    expect(lastActivity()).toMatchObject({ actor: '林雅婷', action: '核准訂單（成交條件審核）' });
  });

  it('待審期間付款備註被清空，核准被擋下並列出缺項「付款備註」，訂單維持待業務主管審核', () => {
    seedOrder(pendingReview({ payment_note: '' }));
    actAs('sales_manager');
    const before = orderOf().activities.length;
    expect(store().approveOrder(ORDER_ID)).toMatchObject({ ok: false, missing: ['付款備註'] });
    expect(orderOf().status).toBe('待業務主管審核');
    expect(orderOf().activities).toHaveLength(before);
  });

  it('業務補填付款備註後，業務主管再按核准即推進至審核通過', () => {
    seedOrder(pendingReview({ payment_note: '' }));
    actAs('sales');
    store().updateOrderFields(ORDER_ID, { payment_note: '匯款後請提供後五碼' }, '編輯訂單備註');
    actAs('sales_manager');
    expect(store().approveOrder(ORDER_ID)).toMatchObject({ ok: true });
    expect(orderOf().status).toBe('審核通過');
  });

  it('業務發起的核准回權限不足，訂單維持待業務主管審核', () => {
    seedOrder(pendingReview());
    actAs('sales');
    const result = store().approveOrder(ORDER_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/權限不足/);
    expect(orderOf().status).toBe('待業務主管審核');
  });

  it('非指定的業務主管不可核准：按鈕判定為否，直接呼叫回權限不足', () => {
    seedOrder(pendingReview({ assigned_manager: '蔡佩珊' }));
    expect(perms.canApproveOrder(orderOf(), 'sales_manager', '林雅婷')).toBe(false);
    actAs('sales_manager'); // 模擬身分為林雅婷
    const result = store().approveOrder(ORDER_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/權限不足/);
    expect(orderOf().status).toBe('待業務主管審核');
  });
});

describe('2.17 送審鈕只給可編輯角色；草稿與待審兩態修改直接儲存不回審', () => {
  it('草稿態的「送主管審核」只對負責該單的業務或諮詢顯示', () => {
    const draft = orderOf();
    expect(perms.canSubmitOrderForReview(draft, 'sales', '洪嘉駿')).toBe(true);
    expect(perms.canSubmitOrderForReview({ ...draft, sales_person: '張惠雯' }, 'consultant', '張惠雯')).toBe(true);
    for (const [role, name] of [
      ['sales_manager', '林雅婷'],
      ['print_manager', '吳國豪'],
      ['accountant', '陳美玲'],
    ]) {
      expect(perms.canSubmitOrderForReview(draft, role, name)).toBe(false);
    }
  });

  it('草稿以外的狀態不顯示送審鈕', () => {
    for (const status of ['待業務主管審核', '審核通過', '報價待回簽', '已回簽']) {
      expect(perms.canSubmitOrderForReview({ ...orderOf(), status }, 'sales', '洪嘉駿')).toBe(false);
    }
  });

  it('非可編輯角色發起的送審請求回權限不足，訂單維持草稿', () => {
    seedOrder(completeDraft());
    for (const role of ['sales_manager', 'print_manager', 'accountant']) {
      actAs(role);
      const result = store().submitForReview(ORDER_ID);
      expect(result.ok).toBe(false);
      expect(result.reason).toMatch(/權限不足/);
      expect(orderOf().status).toBe('草稿');
    }
  });

  it('待審期間改成交單價、收款條件備註與第二期預計收款日：直接儲存、維持待審、留活動紀錄、變更次數加 1', () => {
    seedOrder(
      completeDraft({
        status: '待業務主管審核',
        billing_installments: [
          installment('訂金', 3938, { planned_paid_date: '2026-10-20', change_count: 0 }),
          installment('尾款', 9188, { planned_paid_date: '2026-11-20', change_count: 0 }),
        ],
      }),
    );
    const before = orderOf().activities.length;
    store().updatePrintItemUnitPrice(ORDER_ID, 'pi-2026-0841', 5.5);
    store().updateOrderFields(ORDER_ID, { payment_terms_note: '訂金 40%、尾款出貨前結清' }, '編輯發票與收款');
    store().updateBillingInstallment(ORDER_ID, 'BI-TEST-尾款', { planned_paid_date: '2026-11-30' });
    expect(orderOf().status).toBe('待業務主管審核');
    expect(orderOf().activities.length).toBeGreaterThanOrEqual(before + 3);
    const second = orderOf().billing_installments.find((bi) => bi.id === 'BI-TEST-尾款');
    expect(second.planned_paid_date).toBe('2026-11-30');
    expect(second.change_count).toBe(1);
  });
});

describe('4.18 訂單成立前刪除印件，金額當下重算、活動紀錄留一筆', () => {
  it('ORD-2026-0814 起點金額：未稅 12,501、稅額 625、應收 13,126', () => {
    expect(deriveOrderAmounts(orderOf())).toMatchObject({
      total_amount_untaxed: 12501,
      tax_amount: 625,
      receivable_taxed: 13126,
    });
  });

  it('刪除貼紙後只剩名片與 DM，未稅 10,751、稅額 538、應收 11,289', () => {
    expect(store().deletePrintItem(ORDER_ID, STICKER_ID)).toMatchObject({ ok: true });
    expect(orderOf().print_items.map((p) => p.name)).toEqual(['名片', 'DM']);
    expect(orderOf()).toMatchObject({
      total_amount_untaxed: 10751,
      tax_amount: 538,
      receivable_taxed: 11289,
    });
  });

  it('活動紀錄新增一筆「刪除印件 貼紙」，操作者為業務', () => {
    store().deletePrintItem(ORDER_ID, STICKER_ID);
    expect(lastActivity()).toMatchObject({ actor: '洪嘉駿', action: '刪除印件 貼紙' });
    expect(lastActivity().time).toBeTruthy();
  });
});

describe('4.19 可刪到零件、差額提示不擋刪除', () => {
  it('兩期合計 13,126 的訂單刪除貼紙照樣成立，收款項目維持原樣', () => {
    seedOrder(completeDraft());
    expect(store().deletePrintItem(ORDER_ID, STICKER_ID)).toMatchObject({ ok: true });
    expect(orderOf().receivable_taxed).toBe(11289);
    expect(orderOf().billing_installments.map((bi) => bi.amount_taxed)).toEqual([3938, 9188]);
  });

  it('三件依序刪光，系統不以「至少一件印件」擋下，印件清單為空', () => {
    for (const id of ['pi-2026-0843', 'pi-2026-0841', 'pi-2026-0842']) {
      expect(store().deletePrintItem(ORDER_ID, id)).toMatchObject({ ok: true });
    }
    expect(orderOf().print_items).toEqual([]);
    expect(orderOf().receivable_taxed).toBe(210);
  });

  it('待業務主管審核期間只剩一件印件時同樣刪得掉', () => {
    seedOrder(completeDraft({ status: '待業務主管審核', print_items: [orderOf().print_items[0]] }));
    expect(store().deletePrintItem(ORDER_ID, 'pi-2026-0841')).toMatchObject({ ok: true });
    expect(orderOf().print_items).toEqual([]);
  });
});

describe('4.20 可刪時點與角色：成立後、線上單等待付款、印務主管都不提供刪除', () => {
  const offline = (status) => ({ ...orderOf(), order_type: '線下單', status });

  it('線下單審核段四格（草稿、待業務主管審核、審核通過、報價待回簽）業務可刪', () => {
    for (const status of ['草稿', '待業務主管審核', '審核通過', '報價待回簽']) {
      expect(perms.canDeletePrintItem(offline(status), 'sales', '洪嘉駿')).toBe(true);
    }
  });

  it('成立後（已回簽起）一律不提供刪除', () => {
    for (const status of ['已回簽', '稿件未上傳', '製作中', '出貨中', '訂單完成', '已取消']) {
      expect(perms.canDeletePrintItem(offline(status), 'sales', '洪嘉駿')).toBe(false);
    }
  });

  it('線上單等待付款期間不提供刪除', () => {
    const online = { ...orderOf(), order_type: '線上單', status: '等待付款' };
    expect(perms.canDeletePrintItem(online, 'sales', '洪嘉駿')).toBe(false);
  });

  it('負責該訂單的諮詢在成立前看得到刪除；印務主管看不到', () => {
    const consultantOrder = { ...offline('草稿'), sales_person: '張惠雯' };
    expect(perms.canDeletePrintItem(consultantOrder, 'consultant', '張惠雯')).toBe(true);
    expect(perms.canDeletePrintItem(offline('草稿'), 'print_manager', '吳國豪')).toBe(false);
  });

  it('已回簽的訂單直接呼叫刪除被擋下，印件原樣留著', () => {
    seedOrder({ ...orderOf(), status: '已回簽' });
    expect(store().deletePrintItem(ORDER_ID, STICKER_ID).ok).toBe(false);
    expect(orderOf().print_items).toHaveLength(3);
  });

  it('印務主管直接呼叫刪除被擋下，印件原樣留著', () => {
    actAs('print_manager');
    expect(store().deletePrintItem(ORDER_ID, STICKER_ID).ok).toBe(false);
    expect(orderOf().print_items).toHaveLength(3);
  });
});
