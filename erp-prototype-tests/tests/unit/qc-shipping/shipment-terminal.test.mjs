import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
  nextStatusOptions,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import {
  calcShippableQty,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { boxedShipment, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.22（出貨人員對專車、其他、自取的物流單標記例外 → 出貨單轉異常，異常仍佔用、不回補）、
// 12.23（作廢出貨單只限未離廠，含可出貨與等待出貨，不向物流商取消）、12.24（收掉最後一張在途單時補跑送達收尾判定）的規則驗算。
// 畫面呈現在 tests/e2e/12-shipping/shipping.spec.mjs。
// 期望值取自 shipment spec（本 change delta）§ 物流單例外、§ 出貨單狀態機、§ 可出貨額度的回補入口、§ 送達後的收尾判定。

const NO = 'PI-TEST-TERM';
const ORDER_NO = 'ORD-TEST-TERM';

const shipmentOf = (id, status, overrides = {}) => {
  // status 為物流單狀態（可出貨之後）；'未處理'、'打包中' 為尚無物流單的單頭狀態；'已裝箱' 為尚無物流單的已裝箱
  if (status === '已裝箱') {
    return boxedShipment({ id, shipmentNo: `SH-TEST-${id}`, orderNo: ORDER_NO, method: '專車配送', printItemNo: NO, name: '終態樣本', qty: 100, ...overrides });
  }
  const early = ['未處理', '打包中'].includes(status);
  if (early) {
    return {
      id,
      shipment_no: `SH-TEST-${id}`,
      order_no: ORDER_NO,
      status,
      method: '專車配送',
      details: [{ print_item_no: NO, name: '終態樣本', qty: 100, picked_qty: null }],
      planned_details: [],
      packing_boxes: [],
      logistics_orders: [],
      packing_corrections: [],
      history: [],
      ...overrides,
    };
  }
  const { method = '專車配送', ...rest } = overrides;
  const lo = logistics(`SH-TEST-${id}-001`, status);
  return packedShipment({
    id,
    shipmentNo: `SH-TEST-${id}`,
    orderNo: ORDER_NO,
    method,
    printItemNo: NO,
    name: '終態樣本',
    qty: 100,
    logisticsOrders: [lo],
    ...rest,
  });
};

const seed = (shipments, { orderedQty = 100 } = {}) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-term',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: '出貨中',
        activities: [],
        print_items: [
          {
            print_item_no: NO,
            name: '終態樣本',
            type: '大貨印件',
            ordered_qty: orderedQty,
            print_item_status: '出貨中',
          },
        ],
      },
    ],
  });
  useQcShippingStore.setState({ shipments });
};

const byId = (id) => useQcShippingStore.getState().shipments.find((sh) => sh.id === id);
const lo1 = (id) => byId(id).logistics_orders[0];
const statusOf = (id) => shipmentStatusOf(byId(id));
const printItem = { print_item_no: NO };
const qcRecords = [{ print_item_no: NO, passed_qty: 100, failed_qty: 0 }];
const shipments = () => useQcShippingStore.getState().shipments;

describe('12.22 標記例外只限專車配送、其他、自取：出貨單轉異常、仍佔用額度', () => {
  beforeEach(() => seed([shipmentOf('a', '已出貨')]));

  it('標記例外只歸出貨人員：業務與諮詢在已出貨沒有任何出貨單層動作，出貨單層也沒有轉異常', () => {
    const shipment = byId('a');
    expect(nextStatusOptions({ role: 'sales', shipment })).toEqual([]);
    expect(nextStatusOptions({ role: 'consultant', shipment })).toEqual([]);
    expect(nextStatusOptions({ role: 'shipper', shipment }).map((o) => o.status)).not.toContain('異常');
  });

  it('理由必填、例外種類必選：空白理由或無效種類時單不變、歷程不增加', () => {
    const store = useQcShippingStore.getState();
    expect(store.markLogisticsException('a', 'SH-TEST-a-001', { kind: '例外事故', reason: '   ', operator: '曾志偉' }).ok).toBe(false);
    expect(store.markLogisticsException('a', 'SH-TEST-a-001', { kind: '亂填', reason: '破損', operator: '曾志偉' }).ok).toBe(false);
    expect(lo1('a').status).toBe('已出貨');
    expect(lo1('a').history).toHaveLength(0);
    expect(statusOf('a')).toBe('已出貨');
  });

  it('填理由後物流單轉所選例外態、記理由與來源（人工），出貨單依物流單算出異常，歷程各記一筆', () => {
    useQcShippingStore
      .getState()
      .markLogisticsException('a', 'SH-TEST-a-001', { kind: '例外事故', reason: '客戶拒收', operator: '曾志偉' });
    const lo = lo1('a');
    expect(lo.status).toBe('例外事故');
    expect(lo.exception_reason).toBe('客戶拒收');
    expect(lo.exception_source).toBe('manual');
    expect(statusOf('a')).toBe('異常');
    const last = lo.history.at(-1);
    expect(last.category).toBe('標記例外');
    expect(last.actor).toBe('曾志偉');
    expect(last.remark).toContain('客戶拒收');
    expect(last.changes).toEqual([{ field: '物流單狀態', before: '已出貨', after: '例外事故' }]);
    const sh = byId('a').history.at(-1);
    expect(sh.changes).toEqual([{ field: '出貨單狀態', before: '已出貨', after: '異常' }]);
  });

  it('只有已出貨與可自取的物流單標得了例外：可出貨與已送達直接呼叫也不寫入；第三方物流一律不開放', () => {
    seed([
      shipmentOf('p', '可出貨'),
      shipmentOf('d', '已送達'),
      shipmentOf('s', '可自取', { method: '自取' }),
      shipmentOf('o', '已出貨', { method: '其他' }),
      shipmentOf('w', '等待出貨', { method: '順豐' }),
      shipmentOf('t', '運送中', { method: '新竹物流' }),
    ]);
    const store = useQcShippingStore.getState();
    const mark = (id) => store.markLogisticsException(id, `SH-TEST-${id}-001`, { kind: '例外事故', reason: '標記', operator: '曾志偉' }).ok;
    expect(mark('p')).toBe(false);
    expect(mark('d')).toBe(false);
    expect(mark('w')).toBe(false);
    expect(mark('t')).toBe(false);
    expect(lo1('p').status).toBe('可出貨');
    expect(lo1('w').status).toBe('等待出貨');
    expect(mark('s')).toBe(true);
    expect(mark('o')).toBe(true);
  });

  it('業務的出貨單列與物流單列不出現標記例外', () => {
    const shipment = byId('a');
    expect(logisticsActionsOf({ role: 'sales', shipment, logistics: lo1('a'), canVoid: true })).not.toContain(L.MARK_EXCEPTION);
    expect(logisticsActionsOf({ role: 'shipper', shipment, logistics: lo1('a') })).toContain(L.MARK_EXCEPTION);
  });

  it('異常不回補、作廢物流單才回補：異常後仍佔用、額度不變；作廢最後一筆（預填 100）後出貨單已作廢、額度回補', () => {
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(0);
    useQcShippingStore
      .getState()
      .markLogisticsException('a', 'SH-TEST-a-001', { kind: '例外事故', reason: '客戶拒收', operator: '曾志偉' });
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(0);
    const voided = useQcShippingStore.getState().voidLogistics('a', 'SH-TEST-a-001', {
      reason: '貨已退回',
      operator: '洪嘉駿',
    });
    expect(voided.ok).toBe(true);
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(100);
  });
});

describe('12.23 作廢出貨單只限未離廠：含可出貨與等待出貨，不向物流商取消', () => {
  it('業務與諮詢在未處理、打包中、已裝箱、可出貨與物流單在等待出貨時有作廢（理由必填），出貨人員與揀貨人員沒有', () => {
    ['未處理', '打包中', '已裝箱', '可出貨', '等待出貨'].forEach((status) => {
      const shipment = shipmentOf('x', status, status === '等待出貨' ? { method: '順豐' } : {});
      const options = nextStatusOptions({ role: 'sales', shipment, canVoid: true });
      expect(options.map((o) => o.status), status).toContain('已作廢');
      expect(options.find((o) => o.status === '已作廢').required).toEqual(['reason']);
      expect(
        nextStatusOptions({ role: 'consultant', shipment, canVoid: true }).map((o) => o.status),
      ).toContain('已作廢');
      expect(nextStatusOptions({ role: 'shipper', shipment }).map((o) => o.status), status).not.toContain('已作廢');
      expect(nextStatusOptions({ role: 'picker', shipment }).map((o) => o.status), status).not.toContain('已作廢');
    });
  });

  it('離廠之後沒有作廢出貨單：已出貨那一張列上沒有作廢，直接呼叫也不寫入', () => {
    ['已出貨', '運送中', '已送達', '例外事故'].forEach((status) => {
      expect(
        nextStatusOptions({ role: 'sales', shipment: shipmentOf('x', status), canVoid: true }),
        status,
      ).toEqual([]);
    });
    seed([shipmentOf('t', '運送中'), shipmentOf('d', '已送達')]);
    useQcShippingStore.getState().voidShipment('t', '亂作廢', '洪嘉駿');
    useQcShippingStore.getState().voidShipment('d', '亂作廢', '洪嘉駿');
    expect(statusOf('t')).toBe('運送中');
    expect(statusOf('d')).toBe('已送達');
  });

  it('理由必填：理由空白時單不變', () => {
    seed([shipmentOf('u', '未處理')]);
    useQcShippingStore.getState().voidShipment('u', '', '洪嘉駿');
    expect(byId('u').status).toBe('未處理');
    expect(byId('u').history).toHaveLength(0);
  });

  it('填理由後單轉已作廢，記理由與轉入時間，歷程多一筆作廢出貨單，額度加回明細數量', () => {
    seed([shipmentOf('u', '未處理')]);
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(0);
    useQcShippingStore.getState().voidShipment('u', '客戶改期', '洪嘉駿');
    const sh = byId('u');
    expect(sh.status).toBe('已作廢');
    expect(sh.void_reason).toBe('客戶改期');
    expect(sh.void_at).toBeTruthy();
    const last = sh.history.at(-1);
    expect(last.category).toBe('作廢');
    expect(last.event).toBe('作廢出貨單');
    expect(last.actor).toBe('洪嘉駿');
    expect(last.changes).toEqual([{ field: '出貨單狀態', before: '未處理', after: '已作廢' }]);
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(100);
  });

  it('作廢未離廠的出貨單時物流單一併作廢、整張回補：可出貨與已拋單在等待出貨的順豐單都可作廢、物流單一併已作廢、不填未送達數量、不向物流商取消', () => {
    ['可出貨', '等待出貨'].forEach((status) => {
      seed([shipmentOf('p', status, { method: '順豐' })]);
      expect(calcShippableQty(printItem, shipments(), qcRecords), status).toBe(0);
      useQcShippingStore.getState().voidShipment('p', '客戶改地址', '洪嘉駿');
      expect(byId('p').status, status).toBe('已作廢');
      expect(lo1('p').status, status).toBe('已作廢');
      expect(lo1('p').void_reason).toBe('客戶改地址');
      expect(lo1('p').undelivered).toEqual([]);
      expect(calcShippableQty(printItem, shipments(), qcRecords), status).toBe(100);
      expect(JSON.stringify(byId('p').history)).not.toContain('向物流商取消');
    });
  });

  it('已裝箱、尚無物流單的單作廢後整張回補', () => {
    seed([shipmentOf('b', '已裝箱')]);
    useQcShippingStore.getState().voidShipment('b', '客戶改期', '洪嘉駿');
    expect(byId('b').status).toBe('已作廢');
    expect(calcShippableQty(printItem, shipments(), qcRecords)).toBe(100);
  });
});

describe('12.24 收掉最後一張在途單時補跑送達收尾判定', () => {
  // 購買數量 100：一張已送達（100）加一張已出貨（專車，50，補出的量）
  const orderState = () => useOrdersStore.getState().orders[0];
  const pair = () => [
    shipmentOf('done', '已送達'),
    shipmentOf('road', '已出貨', { qty: 50 }),
  ];

  it('在途單還在時，印件與訂單都不收尾', () => {
    seed(pair());
    expect(orderState().print_items[0].print_item_status).toBe('出貨中');
    expect(orderState().status).toBe('出貨中');
  });

  it('在途單的物流單作廢後補跑判定：整張退出分母，印件轉已送達、訂單轉訂單完成', () => {
    seed(pair());
    useQcShippingStore
      .getState()
      .markLogisticsException('road', 'SH-TEST-road-001', { kind: '例外事故', reason: '客戶拒收', operator: '曾志偉' });
    // 異常視為未收尾：此時不收尾
    expect(orderState().print_items[0].print_item_status).toBe('出貨中');
    const result = useQcShippingStore
      .getState()
      .voidLogistics('road', 'SH-TEST-road-001', { reason: '貨已退回', operator: '洪嘉駿' });
    expect(result.ok).toBe(true);
    expect(statusOf('road')).toBe('已作廢');
    expect(result.settled.deliveredNames).toEqual(['終態樣本']);
    expect(result.settled.orderCompleted).toBe(true);
    expect(orderState().print_items[0].print_item_status).toBe('已送達');
    expect(orderState().status).toBe('訂單完成');
  });

  it('作廢出貨單也補跑：未離廠的那張作廢後，其餘單已全部送達且量足，印件轉已送達', () => {
    seed([shipmentOf('done', '已送達'), shipmentOf('pre', '可出貨', { qty: 50 })]);
    const result = useQcShippingStore.getState().voidShipment('pre', '客戶改期', '洪嘉駿');
    expect(result.deliveredNames).toEqual(['終態樣本']);
    expect(orderState().print_items[0].print_item_status).toBe('已送達');
  });

  it('收掉在途單後量仍不足時不收尾：已送達的量不足購買數量', () => {
    seed(pair(), { orderedQty: 300 });
    useQcShippingStore
      .getState()
      .markLogisticsException('road', 'SH-TEST-road-001', { kind: '例外事故', reason: '客戶拒收', operator: '曾志偉' });
    const result = useQcShippingStore
      .getState()
      .voidLogistics('road', 'SH-TEST-road-001', { reason: '貨已退回', operator: '洪嘉駿' });
    expect(result.settled.deliveredNames).toEqual([]);
    expect(orderState().print_items[0].print_item_status).toBe('出貨中');
  });

  it('送達確認讓最後一張在途單轉已送達時也補跑收尾判定', () => {
    seed(pair());
    const result = useQcShippingStore.getState().confirmLogisticsDelivery('road', 'SH-TEST-road-001', {
      operator: '曾志偉',
    });
    expect(result.ok).toBe(true);
    expect(statusOf('road')).toBe('已送達');
    expect(result.settled.orderCompleted).toBe(true);
    expect(orderState().status).toBe('訂單完成');
  });
});
