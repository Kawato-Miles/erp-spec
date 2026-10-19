import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  attachDeliveryProofOf,
  nextStatusOptions,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import {
  calcShippableQty,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.22（出貨人員標記例外 → 出貨單轉異常，異常仍佔用、不回補）、12.23（未出貨動作的出貨單作廢）、
// 12.24（收掉最後一張在途單時補跑送達收尾判定）、12.25（已送達的物流單補附送達憑證）的規則驗算。
// 畫面呈現在 tests/e2e/12-shipping/shipping.spec.mjs。
// 依據：wiki 出貨單狀態（異常由物流單例外計算、未出貨動作可作廢）、出貨單 OP-SHP-011、OP-SHP-012、OP-SHP-015，
// 設計 § 六之一、§ 六之二、§ 八之一。

const NO = 'PI-TEST-TERM';
const ORDER_NO = 'ORD-TEST-TERM';

const shipmentOf = (id, status, overrides = {}) => {
  // status 為物流單狀態（已裝箱之後）；'未處理'、'打包中' 為尚無物流單的單頭狀態
  const early = ['未處理', '打包中'].includes(status);
  if (early) {
    return {
      id,
      shipment_no: `SH-TEST-${id}`,
      order_no: ORDER_NO,
      status,
      method: '專車配送',
      details: [{ print_item_no: NO, name: '終態樣本', qty: 100, picked_qty: null, per_box_qty: null }],
      planned_details: [],
      packing_boxes: [],
      logistics_orders: [],
      packing_corrections: [],
      history: [],
      ...overrides,
    };
  }
  const lo = status === '已裝箱' ? logistics(`SH-TEST-${id}-001`, '已裝箱') : departed(`SH-TEST-${id}-001`, status);
  return packedShipment({
    id,
    shipmentNo: `SH-TEST-${id}`,
    orderNo: ORDER_NO,
    method: '專車配送',
    printItemNo: NO,
    name: '終態樣本',
    qty: 100,
    logisticsOrders: [lo],
    ...overrides,
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

describe('12.22 出貨人員對物流單標記例外，出貨單轉異常、仍佔用額度', () => {
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

  it('只有等待出貨、已出貨、可自取、運送中的物流單標得了例外：已裝箱與已送達直接呼叫也不寫入', () => {
    seed([shipmentOf('p', '已裝箱'), shipmentOf('d', '已送達')]);
    const store = useQcShippingStore.getState();
    expect(store.markLogisticsException('p', 'SH-TEST-p-001', { kind: '例外事故', reason: '亂標', operator: '曾志偉' }).ok).toBe(false);
    expect(store.markLogisticsException('d', 'SH-TEST-d-001', { kind: '例外事故', reason: '亂標', operator: '曾志偉' }).ok).toBe(false);
    expect(lo1('p').status).toBe('已裝箱');
    expect(lo1('d').status).toBe('已送達');
  });

  it('異常不回補：出貨單轉異常後仍佔用，可出貨額度不變；回補只在作廢物流單與作廢出貨單', () => {
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

describe('12.23 業務對未出貨動作的出貨單作廢', () => {
  it('業務與諮詢在未處理、打包中與未執行過出貨動作的已裝箱有作廢（理由必填），出貨人員與揀貨人員沒有', () => {
    ['未處理', '打包中', '已裝箱'].forEach((status) => {
      const shipment = shipmentOf('x', status);
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

  it('執行過出貨動作之後沒有作廢出貨單：選項不出現，直接呼叫也不寫入', () => {
    ['等待出貨', '已出貨', '運送中', '已送達', '例外事故'].forEach((status) => {
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

  it('已裝箱的單作廢時，底下物流單一併作廢，整張明細回補、不填未送達數量', () => {
    seed([shipmentOf('p', '已裝箱')]);
    useQcShippingStore.getState().voidShipment('p', '客戶改地址', '洪嘉駿');
    expect(byId('p').status).toBe('已作廢');
    expect(lo1('p').status).toBe('已作廢');
    expect(lo1('p').void_reason).toBe('客戶改地址');
    expect(lo1('p').undelivered).toEqual([]);
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

  it('作廢出貨單也補跑：未出貨動作的那張作廢後，其餘單已全部送達且量足，印件轉已送達', () => {
    seed([shipmentOf('done', '已送達'), shipmentOf('pre', '已裝箱', { qty: 50 })]);
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
      proof: '司機交付照.jpg',
    });
    expect(result.ok).toBe(true);
    expect(statusOf('road')).toBe('已送達');
    expect(result.settled.orderCompleted).toBe(true);
    expect(orderState().status).toBe('訂單完成');
  });
});

describe('12.25 出貨人員對已送達的物流單補附送達憑證', () => {
  const sh = (method) => ({ status: '已裝箱', method });

  it('專車與自取的已送達（已自取）物流單，出貨人員可補附，憑證名稱分別是司機交付照與現場點交照', () => {
    expect(
      attachDeliveryProofOf({ role: 'shipper', shipment: sh('專車配送'), logistics: { status: '已送達' } }),
    ).toEqual({ allowed: true, proofLabel: '司機交付照' });
    expect(
      attachDeliveryProofOf({ role: 'shipper', shipment: sh('自取'), logistics: { status: '已自取' } }),
    ).toEqual({ allowed: true, proofLabel: '現場點交照' });
  });

  it('第三方物流的已送達物流單也可補附，憑證名稱為送達照片；其他狀態與其他角色都沒有', () => {
    expect(
      attachDeliveryProofOf({ role: 'shipper', shipment: sh('新竹物流'), logistics: { status: '已送達' } }),
    ).toEqual({ allowed: true, proofLabel: '送達照片' });
    ['已裝箱', '等待出貨', '已出貨', '可自取', '運送中', '未送達', '例外事故', '已作廢'].forEach((status) => {
      expect(
        attachDeliveryProofOf({ role: 'shipper', shipment: sh('專車配送'), logistics: { status } }).allowed,
        status,
      ).toBe(false);
    });
    ['sales', 'consultant', 'picker', 'sales_manager', null].forEach((role) => {
      expect(
        attachDeliveryProofOf({ role, shipment: sh('專車配送'), logistics: { status: '已送達' } }).allowed,
        String(role),
      ).toBe(false);
    });
  });

  it('補附後物流單仍為已送達，送達時間與操作人不變；已有憑證時保留原憑證，新照片進歷程附件', () => {
    seed([
      shipmentOf('a', '已送達'),
    ]);
    useQcShippingStore.setState({
      shipments: [
        {
          ...byId('a'),
          logistics_orders: [
            {
              ...lo1('a'),
              delivered_at: '2026-10-01 09:00',
              delivered_by: '曾志偉',
              delivery_proof: '司機交付照-原.jpg',
            },
          ],
        },
      ],
    });
    const result = useQcShippingStore.getState().attachLogisticsProof('a', 'SH-TEST-a-001', {
      operator: '曾志偉',
      proof: { name: '司機交付照-補.jpg', url: null },
    });
    expect(result.ok).toBe(true);
    const lo = lo1('a');
    expect(lo.status).toBe('已送達');
    expect(lo.delivered_at).toBe('2026-10-01 09:00');
    expect(lo.delivered_by).toBe('曾志偉');
    expect(lo.delivery_proof).toBe('司機交付照-原.jpg');
    const last = lo.history.at(-1);
    expect(last.category).toBe('送達確認');
    expect(last.event).toBe('補附送達憑證');
    expect(last.attachments.map((a) => a.name)).toEqual(['司機交付照-補.jpg']);
    expect(last.changes).toEqual([]);
  });

  it('只有已送達或已自取的物流單補得進去；沒附照片直接呼叫不寫入', () => {
    seed([shipmentOf('t', '運送中'), shipmentOf('d', '已送達')]);
    const store = useQcShippingStore.getState();
    const proof = { name: 'x.jpg', url: null };
    expect(store.attachLogisticsProof('t', 'SH-TEST-t-001', { operator: '曾志偉', proof }).ok).toBe(false);
    expect(store.attachLogisticsProof('d', 'SH-TEST-d-001', { operator: '曾志偉', proof: null }).ok).toBe(false);
    expect(lo1('t').history).toHaveLength(0);
    expect(lo1('d').history).toHaveLength(0);
  });
});
