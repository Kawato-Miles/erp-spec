// 情境目錄 4.6：改印件預計交期重算印件內部完成日、同步非終態工單、寫訂單活動紀錄；
// 改是否急件不重算、不同步，只寫活動紀錄（舊值、新值為是／否）；兩者都不通知任何角色。
// 訂單離開草稿後印件預計交期可改不可清空；草稿期間清空則內部完成日同為空。
// 規則正本：order-management spec § 印件預計交期變更的重算與同步、§ 印件預計交期依階段必填檢核
//（OpenSpec change rush-order-definition）；wiki 訂單異動規則 § 印件日期人工修改配套、§ 印件預計交期依階段必填。
// 起點資料：鏈二 ORD-2026-0710 旗下 PI-2026-0710（是否急件否，印件預計交期 2026-09-15、印件內部完成日 2026-09-14），
// 旗下工單 WO-2026-0710 製作中；另於工單模組補一張同印件的已完成工單，驗終態不回寫。
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';
import { useSessionStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/sessionStore.js';

const ORDER_ID = 'ORD-2026-0710';
const ITEM_ID = 'pi-2026-0710';
const PI_NO = 'PI-2026-0710';

const initialOrders = useOrdersStore.getState().orders;
const initialWorkOrders = useWorkOrdersStore.getState().workOrders;
const orders = () => useOrdersStore.getState();
const itemNow = () => orders().getOrder(ORDER_ID).print_items.find((p) => p.id === ITEM_ID);
const woOf = (no) => useWorkOrdersStore.getState().workOrders.find((w) => w.work_order_no === no);
const lastActivity = () => orders().getOrder(ORDER_ID).activities.at(-1);

const DONE_WO = {
  id: 'wo-test-done-0710',
  work_order_no: 'WO-TEST-DONE-0710',
  status: '已完成',
  tasks: [],
  print_item: {
    print_item_no: PI_NO,
    name: '品牌形象海報 A2',
    delivery_date: '2026-09-14',
    expected_delivery_date: '2026-09-15',
  },
};

beforeEach(() => {
  useOrdersStore.setState({ orders: initialOrders });
  useWorkOrdersStore.setState({ workOrders: [...initialWorkOrders, DONE_WO] });
  useSessionStore.setState({ role: 'sales', userName: null });
});

describe('4.6 改印件預計交期：重算、同步非終態工單、留痕、不通知', () => {
  it('起點：印件預計交期 2026-09-15、印件內部完成日 2026-09-14，製作中工單同值', () => {
    expect(itemNow()).toMatchObject({
      expected_delivery_date: '2026-09-15',
      delivery_date: '2026-09-14',
    });
    expect(woOf('WO-2026-0710').status).not.toBe('已完成');
    expect(woOf('WO-2026-0710').print_item).toMatchObject({
      delivery_date: '2026-09-14',
      expected_delivery_date: '2026-09-15',
    });
  });

  it('改為 2026-09-21（一）：內部完成日重算為 2026-09-18（五），製作中工單同步、已完成工單維持', () => {
    const result = orders().updatePrintItem(ORDER_ID, ITEM_ID, {
      expected_delivery_date: '2026-09-21',
    });
    expect(itemNow()).toMatchObject({
      expected_delivery_date: '2026-09-21',
      delivery_date: '2026-09-18',
    });
    expect(woOf('WO-2026-0710').print_item).toMatchObject({
      delivery_date: '2026-09-18',
      expected_delivery_date: '2026-09-21',
    });
    expect(woOf('WO-TEST-DONE-0710').print_item).toMatchObject({
      delivery_date: '2026-09-14',
      expected_delivery_date: '2026-09-15',
    });
    expect(result.dueDateSync.syncedWorkOrders).toEqual(['WO-2026-0710']);
    const log = lastActivity();
    expect(log.actor).toBeTruthy();
    expect(log.time).toBeTruthy();
    expect(log.action).toContain('2026-09-15');
    expect(log.action).toContain('2026-09-21');
    expect(log.action).toContain('未發出任何通知');
  });

  it('製作中（已離開草稿）清空印件預計交期被擋下：日期與工單兩欄維持原值', () => {
    const res = orders().updatePrintItem(ORDER_ID, ITEM_ID, { expected_delivery_date: null });
    expect(res).toMatchObject({ ok: false, reason: '訂單已離開草稿，印件預計交期可改不可清空' });
    expect(itemNow()).toMatchObject({ expected_delivery_date: '2026-09-15', delivery_date: '2026-09-14' });
    expect(woOf('WO-2026-0710').print_item).toMatchObject({
      delivery_date: '2026-09-14',
      expected_delivery_date: '2026-09-15',
    });
  });

  it('預計交期無下限：填早於內部完成日的過去日期照收、照實推導', () => {
    orders().updatePrintItem(ORDER_ID, ITEM_ID, { expected_delivery_date: '2026-09-01' });
    expect(itemNow()).toMatchObject({
      expected_delivery_date: '2026-09-01',
      delivery_date: '2026-08-31',
    });
  });
});

describe('4.6 草稿期間清空印件預計交期：內部完成日同為空、留痕', () => {
  it('ORD-2026-0911（草稿）清空 PI-2026-0911 的 2026-10-15：兩欄皆空，活動紀錄記「改為「未定」」', () => {
    const res = orders().updatePrintItem('ORD-2026-0911', 'pi-2026-0911', { expected_delivery_date: null });
    expect(res.ok).toBe(true);
    const item = orders().getOrder('ORD-2026-0911').print_items.find((p) => p.id === 'pi-2026-0911');
    expect(item).toMatchObject({ expected_delivery_date: null, delivery_date: null });
    const log = orders().getOrder('ORD-2026-0911').activities.at(-1).action;
    expect(log).toContain('2026-10-15');
    expect(log).toContain('改為「未定」');
  });
});

describe('4.6 改是否急件：不重算、不同步，只留痕', () => {
  it('否改為是：兩個日期與工單兩欄維持，活動紀錄記舊值「否」、新值「是」、未發通知', () => {
    expect(itemNow().is_urgent).toBe(false);
    const result = orders().updatePrintItem(ORDER_ID, ITEM_ID, { is_urgent: true });
    expect(itemNow()).toMatchObject({
      is_urgent: true,
      expected_delivery_date: '2026-09-15',
      delivery_date: '2026-09-14',
    });
    expect(woOf('WO-2026-0710').print_item).toMatchObject({
      delivery_date: '2026-09-14',
      expected_delivery_date: '2026-09-15',
    });
    expect(result.dueDateSync).toMatchObject({ syncedWorkOrders: [], urgentChanged: true, expectedChanged: false });
    const log = lastActivity();
    expect(log.actor).toBeTruthy();
    expect(log.time).toBeTruthy();
    expect(log.action).toContain('是否急件由「否」改為「是」');
    expect(log.action).toContain('未發出任何通知');
    expect(log.action).not.toContain('已同步');
  });

  it('是改回否：一樣只留痕，標注隨之消失', () => {
    orders().updatePrintItem(ORDER_ID, ITEM_ID, { is_urgent: true });
    orders().updatePrintItem(ORDER_ID, ITEM_ID, { is_urgent: false });
    expect(itemNow().is_urgent).toBe(false);
    expect(lastActivity().action).toContain('是否急件由「是」改為「否」');
  });
});

describe('1.10／4.5 成交轉訂單：印件預計交期逐件帶入、推得內部完成日，空值即為空', () => {
  it('名片 2026-10-13（二）→ 內部完成日 2026-10-12；型錄 2026-10-19（一）→ 2026-10-16；空值兩欄皆空', () => {
    const quote = {
      quote_no: 'Q-TEST-RUSH-01',
      sales_name: '洪嘉駿',
      items: [
        { name: '名片', quantity: 500, unit_price: 2, subtotal_excl_tax: 1000, expected_delivery_date: '2026-10-13', is_urgent: true },
        { name: '型錄', quantity: 300, unit_price: 50, subtotal_excl_tax: 15000, expected_delivery_date: '2026-10-19', is_urgent: false },
        { name: '貼紙', quantity: 100, unit_price: 3, subtotal_excl_tax: 300, expected_delivery_date: null, is_urgent: false },
      ],
    };
    const { id } = orders().createOrderFromQuote(quote);
    const items = orders().getOrder(id).print_items;
    expect(items.map((p) => [p.expected_delivery_date, p.delivery_date])).toEqual([
      ['2026-10-13', '2026-10-12'],
      ['2026-10-19', '2026-10-16'],
      [null, null],
    ]);
    // 是否急件自需求單印件項目帶入作為預設值；帶入不改任何日期（名片 2026-10-13 → 2026-10-12）；
    // 線下單沒有購買的急件選項
    expect(items.map((p) => p.is_urgent)).toEqual([true, false, false]);
    expect(items.every((p) => (p.purchased_urgent_name ?? null) === null)).toBe(true);
    expect(items.some((p) => Object.prototype.hasOwnProperty.call(p, 'undeducted_internal_due_date'))).toBe(false);
  });
});

describe('4.8／打樣 NG：加開不預填但離開草稿後必填、打樣 NG 複製帶入原印件預計交期', () => {
  it('製作中訂單加開印件未填印件預計交期：擋下存檔，不新增印件', () => {
    const before = orders().getOrder(ORDER_ID).print_items.length;
    const res = orders().addPrintItem(ORDER_ID, {
      name: '品牌形象海報 A2（加開）',
      type: '大貨印件',
      copy_from_id: ITEM_ID,
      ordered_qty: 100,
    });
    expect(res).toMatchObject({ ok: false, reason: '訂單已離開草稿，請填寫印件預計交期' });
    expect(orders().getOrder(ORDER_ID).print_items).toHaveLength(before);
  });

  it('製作中訂單加開印件填 2026-11-20（五）後存檔：建立新印件，內部完成日 2026-11-19（四），不帶購買的急件選項', () => {
    const res = orders().addPrintItem(ORDER_ID, {
      name: '品牌形象海報 A2（加開）',
      type: '大貨印件',
      copy_from_id: ITEM_ID,
      ordered_qty: 100,
      expected_delivery_date: '2026-11-20',
    });
    expect(res.ok).toBe(true);
    const added = orders().getOrder(ORDER_ID).print_items.at(-1);
    expect(added).toMatchObject({
      expected_delivery_date: '2026-11-20',
      delivery_date: '2026-11-19',
      is_urgent: false,
      purchased_urgent_name: null,
      purchased_urgent_days: null,
    });
  });

  it('草稿訂單（ORD-2026-0911）加開不填日期可存檔，兩欄為空', () => {
    const res = orders().addPrintItem('ORD-2026-0911', {
      name: '加開（草稿）',
      type: '大貨印件',
      copy_from_id: 'pi-2026-0911',
      ordered_qty: 100,
    });
    expect(res.ok).toBe(true);
    const added = orders().getOrder('ORD-2026-0911').print_items.at(-1);
    expect(added.expected_delivery_date).toBeNull();
    expect(added.delivery_date).toBeNull();
  });

  it('打樣 NG-稿件問題複製新印件：帶入原印件的印件預計交期、推得的內部完成日與是否急件，不帶購買的急件選項', () => {
    // prepress-review spec Scenario「新印件帶入原印件的印件預計交期與是否急件」
    orders().updatePrintItem(ORDER_ID, ITEM_ID, { is_urgent: true });
    const res = orders().copyPrintItemForSampleArtworkNg(ORDER_ID, ITEM_ID);
    expect(res.ok).toBe(true);
    const copied = orders().getOrder(ORDER_ID).print_items.find((p) => p.print_item_no === res.printItemNo);
    expect(copied).toMatchObject({
      expected_delivery_date: '2026-09-15',
      delivery_date: '2026-09-14',
      is_urgent: true,
      purchased_urgent_name: null,
      purchased_urgent_days: null,
    });
  });
});
