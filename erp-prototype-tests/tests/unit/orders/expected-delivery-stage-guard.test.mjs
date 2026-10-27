// 情境目錄 4.25：印件預計交期依階段必填（訂單離開草稿後新增印件必填、既有印件可改不可清空）；
// 1.6、1.10：需求單印件項目的是否急件（新增預設否、複製需求單照原值帶入、轉訂單帶入作為預設值且不回寫）。
// 期望值取自 OpenSpec change rush-order-definition 的 delta specs：
//   order-management § 印件預計交期依階段必填檢核、§ 新增印件欄位與必填檢核、§ 成交轉訂單
//   quote-request § 印件項目管理、§ 成交轉訂單
// 規則正本：wiki 訂單異動規則 § 印件預計交期依階段必填、印件「是否急件」欄。
// 起點資料：鏈八 ORD-2026-0913（審核通過，已離開草稿；PI-2026-0913 印件預計交期 2026-10-21）、
// ORD-2026-0911（草稿）、鏈二 ORD-2026-0710（製作中）、線上單 ORD-2026-0816（等待付款）、
// 鏈四需求單 Q-20260820-01（印件項目是否急件為是、印件預計交期 2026-09-07）。
import { beforeEach, describe, expect, it } from 'vitest';
import {
  expectedDeliveryGuardOf,
  isExpectedDeliveryRequiredStage,
  EXPECTED_DELIVERY_REQUIRED_ON_ADD,
  EXPECTED_DELIVERY_NOT_CLEARABLE,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/urgent-due-date.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';
import { useQuotesStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/store.js';
import { QUOTE_ITEM_DEFAULT_VALUES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/_lib/constants.js';

const initialOrders = useOrdersStore.getState().orders;
const initialQuotes = useQuotesStore.getState().quotes;
const orders = () => useOrdersStore.getState();
const quotes = () => useQuotesStore.getState();
const orderOf = (id) => orders().getOrder(id);

const NEW_ITEM = {
  name: '活動貼紙（新增）',
  type: '大貨印件',
  ordered_qty: 300,
  unit: '張',
  unit_price_untaxed: 2,
  difficulty_level: 3,
};

beforeEach(() => {
  useOrdersStore.setState({ orders: initialOrders });
  useQuotesStore.setState({ quotes: initialQuotes });
  useSessionStore.setState({ role: 'sales', userName: null });
});

describe('4.25 印件預計交期依階段必填：哪些訂單要求必填', () => {
  it('線下單離開草稿且未進終態才要求；草稿、終態、線上單、諮詢訂單不要求', () => {
    const offline = (status) => ({ order_type: '線下單', status });
    expect(isExpectedDeliveryRequiredStage(offline('草稿'))).toBe(false);
    for (const status of ['待業務主管審核', '審核通過', '報價待回簽', '已回簽', '製作等待中', '製作中', '出貨中']) {
      expect(isExpectedDeliveryRequiredStage(offline(status)), status).toBe(true);
    }
    expect(isExpectedDeliveryRequiredStage(offline('訂單完成'))).toBe(false);
    expect(isExpectedDeliveryRequiredStage(offline('已取消'))).toBe(false);
    expect(isExpectedDeliveryRequiredStage({ order_type: '線上單', status: '等待付款' })).toBe(false);
    expect(isExpectedDeliveryRequiredStage({ order_type: '諮詢訂單', status: '訂單完成' })).toBe(false);
  });

  it('存檔把關：新增未填擋下、既有清空擋下、改為另一日期放行、已棄用印件不受約束', () => {
    const pending = { order_type: '線下單', status: '待業務主管審核' };
    expect(expectedDeliveryGuardOf(pending, null, null)).toEqual({
      allowed: false,
      reason: EXPECTED_DELIVERY_REQUIRED_ON_ADD,
    });
    const existing = { print_item_status: '製作中', expected_delivery_date: '2026-10-13' };
    expect(expectedDeliveryGuardOf(pending, existing, null)).toEqual({
      allowed: false,
      reason: EXPECTED_DELIVERY_NOT_CLEARABLE,
    });
    expect(expectedDeliveryGuardOf(pending, existing, '2026-10-19').allowed).toBe(true);
    expect(expectedDeliveryGuardOf(pending, { ...existing, print_item_status: '已棄用' }, null).allowed).toBe(true);
    expect(expectedDeliveryGuardOf({ order_type: '線下單', status: '草稿' }, null, null).allowed).toBe(true);
  });
});

describe('4.25 訂單離開草稿後新增印件未填印件預計交期不能存檔', () => {
  it('ORD-2026-0913（審核通過）新增印件留空：擋下並提示，印件清單不變', () => {
    const before = orderOf('ORD-2026-0913').print_items.length;
    const res = orders().addPrintItem('ORD-2026-0913', NEW_ITEM);
    expect(res).toEqual({ ok: false, reason: '訂單已離開草稿，請填寫印件預計交期' });
    expect(orderOf('ORD-2026-0913').print_items).toHaveLength(before);
  });

  it('填入 2026-11-20（五）後存檔：建立新印件，印件內部完成日 2026-11-19（四），是否急件為否', () => {
    const res = orders().addPrintItem('ORD-2026-0913', { ...NEW_ITEM, expected_delivery_date: '2026-11-20' });
    expect(res.ok).toBe(true);
    const added = orderOf('ORD-2026-0913').print_items.at(-1);
    expect(added).toMatchObject({
      name: '活動貼紙（新增）',
      expected_delivery_date: '2026-11-20',
      delivery_date: '2026-11-19',
      is_urgent: false,
      purchased_urgent_name: null,
      review_status: '待分派',
      print_item_status: '等待中',
    });
  });

  it('草稿訂單 ORD-2026-0911 新增印件留空可存檔，印件內部完成日為空', () => {
    const res = orders().addPrintItem('ORD-2026-0911', NEW_ITEM);
    expect(res.ok).toBe(true);
    expect(orderOf('ORD-2026-0911').print_items.at(-1)).toMatchObject({
      expected_delivery_date: null,
      delivery_date: null,
    });
  });

  it('新增時勾選是否急件：存檔照收、日期不變（2026-10-13 → 2026-10-12）', () => {
    const res = orders().addPrintItem('ORD-2026-0911', {
      ...NEW_ITEM,
      is_urgent: true,
      expected_delivery_date: '2026-10-13',
    });
    expect(res.ok).toBe(true);
    expect(orderOf('ORD-2026-0911').print_items.at(-1)).toMatchObject({
      is_urgent: true,
      expected_delivery_date: '2026-10-13',
      delivery_date: '2026-10-12',
    });
  });
});

describe('4.25 訂單離開草稿後既有印件的印件預計交期可改不可清空', () => {
  it('ORD-2026-0913 清空 PI-2026-0913：擋下、維持 2026-10-21；改為 2026-10-26 可存', () => {
    const itemOf = () => orderOf('ORD-2026-0913').print_items.find((p) => p.id === 'pi-2026-0913');
    expect(itemOf().expected_delivery_date).toBe('2026-10-21');
    const blocked = orders().updatePrintItem('ORD-2026-0913', 'pi-2026-0913', { expected_delivery_date: null });
    expect(blocked).toMatchObject({ ok: false, reason: '訂單已離開草稿，印件預計交期可改不可清空' });
    expect(itemOf().expected_delivery_date).toBe('2026-10-21');
    const ok = orders().updatePrintItem('ORD-2026-0913', 'pi-2026-0913', { expected_delivery_date: '2026-10-26' });
    expect(ok.ok).toBe(true);
    // 2026-10-26（一）往前減 1 個工作天：10/24、10/25 週末 → 2026-10-23（五）
    expect(itemOf()).toMatchObject({ expected_delivery_date: '2026-10-26', delivery_date: '2026-10-23' });
  });

  it('製作中 ORD-2026-0710 清空被擋下；改為另一日期照常重算', () => {
    const blocked = orders().updatePrintItem('ORD-2026-0710', 'pi-2026-0710', { expected_delivery_date: null });
    expect(blocked.ok).toBe(false);
    const ok = orders().updatePrintItem('ORD-2026-0710', 'pi-2026-0710', { expected_delivery_date: '2026-10-19' });
    expect(ok.ok).toBe(true);
    const item = orderOf('ORD-2026-0710').print_items.find((p) => p.id === 'pi-2026-0710');
    expect(item).toMatchObject({ expected_delivery_date: '2026-10-19', delivery_date: '2026-10-16' });
  });

  it('只改是否急件不受必填檢核影響（不帶日期欄的修改照常存檔）', () => {
    const res = orders().updatePrintItem('ORD-2026-0913', 'pi-2026-0913', { is_urgent: true });
    expect(res.ok).toBe(true);
  });
});

describe('1.10 需求單印件項目的是否急件', () => {
  it('新增印件項目時印件預計交期空白、是否急件為否', () => {
    expect(QUOTE_ITEM_DEFAULT_VALUES.expected_delivery_date).toBeNull();
    expect(QUOTE_ITEM_DEFAULT_VALUES.is_urgent).toBe(false);
  });

  it('轉訂單帶入作為預設值、不改日期；之後在訂單取消，需求單項目維持是', () => {
    const quote = quotes().quotes.find((q) => q.quote_no === 'Q-20260820-01');
    const quoteItem = quote.items[0];
    expect(quoteItem).toMatchObject({ is_urgent: true, expected_delivery_date: '2026-09-07' });
    const { id } = orders().createOrderFromQuote({ ...quote, quote_no: 'Q-TEST-URGENT' });
    const item = orderOf(id).print_items[0];
    expect(item).toMatchObject({
      is_urgent: true,
      expected_delivery_date: '2026-09-07',
      delivery_date: '2026-09-04',
      purchased_urgent_name: null,
    });
    orders().updatePrintItem(id, item.id, { is_urgent: false });
    expect(orderOf(id).print_items[0].is_urgent).toBe(false);
    expect(quotes().quotes.find((q) => q.quote_no === 'Q-20260820-01').items[0].is_urgent).toBe(true);
  });
});

describe('1.6 複製需求單時印件預計交期與是否急件照原值帶入', () => {
  it('複製 Q-20260820-01：新需求單印件項目是否急件為是、印件預計交期 2026-09-07', () => {
    const source = quotes().quotes.find((q) => q.quote_no === 'Q-20260820-01');
    const newId = quotes().duplicateQuote(source.id, '洪嘉駿');
    const copy = quotes().getQuote(newId);
    expect(copy.items.map((x) => [x.is_urgent, x.expected_delivery_date ?? null])).toEqual(
      source.items.map((x) => [x.is_urgent, x.expected_delivery_date ?? null]),
    );
    expect(copy.items[0]).toMatchObject({ is_urgent: true, expected_delivery_date: '2026-09-07' });
  });
});
