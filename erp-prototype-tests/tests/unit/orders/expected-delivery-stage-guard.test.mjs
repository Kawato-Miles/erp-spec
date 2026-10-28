// 情境目錄 4.25：印件預計交期依階段必填（訂單離開草稿後新增印件必填、既有印件可改不可清空）；
// 1.6、1.10：需求單印件項目的是否急件（新增預設否、複製需求單照原值帶入、轉訂單帶入作為預設值且不回寫）。
// 期望值取自 OpenSpec change rush-order-definition 的 delta specs：
//   order-management § 印件預計交期依階段必填檢核、§ 新增印件欄位與必填檢核、§ 成交轉訂單
//   quote-request § 印件項目管理、§ 成交轉訂單
// 規則正本：wiki 訂單異動規則 § 印件預計交期依階段必填、印件「是否急件」欄。
// 4.8 複製加開：OpenSpec change print-item-copy-rule 的 order-management § 加開印件（複製原印件規格）；
// 規則正本 wiki 印件複製規則（內容類帶入原值當預設、建立當下可改含印件屬性）。
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

describe('4.25 訂單離開草稿後複製加開：帶入原印件預計交期，清空才擋下', () => {
  it('ORD-2026-0913 對 PI-2026-0913 加開未改日期：帶入 2026-10-21、照常建立', () => {
    const res = orders().addPrintItem('ORD-2026-0913', { copy_from_id: 'pi-2026-0913' });
    expect(res.ok).toBe(true);
    expect(orderOf('ORD-2026-0913').print_items.at(-1)).toMatchObject({
      expected_delivery_date: '2026-10-21',
      delivery_date: '2026-10-20',
      is_urgent: false,
    });
  });

  it('清空帶入的印件預計交期後存檔：擋下並提示，印件清單不變', () => {
    const before = orderOf('ORD-2026-0913').print_items.length;
    const res = orders().addPrintItem('ORD-2026-0913', {
      copy_from_id: 'pi-2026-0913',
      expected_delivery_date: null,
    });
    expect(res).toEqual({ ok: false, reason: '訂單已離開草稿，請填寫印件預計交期' });
    expect(orderOf('ORD-2026-0913').print_items).toHaveLength(before);
  });
});

// 4.8 起點資料：鏈二 ORD-2026-0710（製作中，出貨方式第三方物流）旗下 PI-2026-0710（品牌形象海報 A2、大貨印件、
// 3,000 張 × 21.5、印件預計交期 2026-09-15、製程說明與品檢需求已填、稿件已審稿確認可製作）。
describe('4.8 複製加開帶入內容類欄位原值，建立當下可改含印件屬性', () => {
  const SRC = 'pi-2026-0710';
  const srcItem = () => orderOf('ORD-2026-0710').print_items.find((p) => p.id === SRC);

  it('未改任何欄位即存檔：帶入印件名稱（不加字樣）、購買數量、印件預計交期、出貨方式、製程說明與品檢需求；售價依帶入值算出', () => {
    // 出貨方式取原印件的值：先把原印件改成自取（訂單仍為第三方物流）
    orders().updatePrintItem('ORD-2026-0710', SRC, { shipping_method: '自取', customer_requested_delivery_date: '2026-09-16' });
    const source = srcItem();
    const res = orders().addPrintItem('ORD-2026-0710', { copy_from_id: SRC });
    expect(res.ok).toBe(true);
    const added = orderOf('ORD-2026-0710').print_items.at(-1);
    expect(added.id).not.toBe(SRC);
    expect(added).toMatchObject({
      name: '品牌形象海報 A2',
      type: '大貨印件',
      ordered_qty: 3000,
      unit: '張',
      unit_price_untaxed: 21.5,
      sale_amount_untaxed: 64500,
      expected_delivery_date: '2026-09-15',
      delivery_date: '2026-09-14',
      is_urgent: false,
      shipping_method: '自取',
      customer_requested_delivery_date: '2026-09-16',
      process_note: source.process_note,
      qc_requirement: source.qc_requirement,
      spec_notes: source.spec_notes,
      packaging_notes: source.packaging_notes,
      difficulty_level: source.difficulty_level,
      skip_review: false,
    });
    expect(added.process_note).not.toBe('');
    // 歷程與產出類回到初始值
    expect(added).toMatchObject({
      review_status: '待分派',
      print_item_status: '等待中',
      files: [],
      review_rounds: [],
      assigned_reviewer_id: null,
      derived_from_print_item_id: null,
      artwork_upload_open: true,
    });
    // 來源印件不被改動；活動紀錄記本次加開與來源印件
    expect(srcItem().ordered_qty).toBe(3000);
    const last = orderOf('ORD-2026-0710').activities.at(-1).action;
    expect(last).toContain('加開印件');
    expect(last).toContain('PI-2026-0710');
  });

  it('建立當下改印件屬性為打樣印件、購買數量改為 300：售價重算為 6450，來源印件維持大貨 3,000', () => {
    const res = orders().addPrintItem('ORD-2026-0710', {
      copy_from_id: SRC,
      type: '打樣印件',
      ordered_qty: 300,
    });
    expect(res.ok).toBe(true);
    const added = orderOf('ORD-2026-0710').print_items.at(-1);
    expect(added).toMatchObject({ type: '打樣印件', ordered_qty: 300, sale_amount_untaxed: 6450 });
    expect(srcItem()).toMatchObject({ type: '大貨印件', ordered_qty: 3000 });
  });

  it('清空印件預計交期後存檔被擋下；填入 2026-10-26（一）後建立，印件內部完成日 2026-10-23（五）', () => {
    const blocked = orders().addPrintItem('ORD-2026-0710', { copy_from_id: SRC, expected_delivery_date: '' });
    expect(blocked).toMatchObject({ ok: false, reason: '訂單已離開草稿，請填寫印件預計交期' });
    const ok = orders().addPrintItem('ORD-2026-0710', { copy_from_id: SRC, expected_delivery_date: '2026-10-26' });
    expect(ok.ok).toBe(true);
    expect(orderOf('ORD-2026-0710').print_items.at(-1)).toMatchObject({
      expected_delivery_date: '2026-10-26',
      delivery_date: '2026-10-23',
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
