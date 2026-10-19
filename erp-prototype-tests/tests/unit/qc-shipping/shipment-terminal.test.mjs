import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  attachDeliveryProofOf,
  nextStatusOptions,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import {
  calcShippableQty,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';

// 情境 12.22（運送中轉異常）、12.23（未離廠作廢）、12.24（收掉最後一張在途單補跑收尾判定）、
// 12.25（已送達補附送達憑證）的規則驗算。畫面呈現在 tests/e2e/12-shipping/shipping.spec.mjs。
// 依據：wiki 出貨單狀態（運送中 → 異常、未離廠 → 已作廢）、出貨單 OP-SHP-011、OP-SHP-012、OP-SHP-015。

const NO = 'PI-TEST-TERM';
const ORDER_NO = 'ORD-TEST-TERM';

const shipmentOf = (id, status, overrides = {}) => ({
  id,
  shipment_no: `SH-TEST-${id}`,
  order_no: ORDER_NO,
  status,
  method: '專車配送',
  details: [{ print_item_no: NO, name: '終態樣本', qty: 100, picked_qty: 100, per_box_qty: 50 }],
  planned_details: [],
  history: [],
  delivery_proof: null,
  ...overrides,
});

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
const printItem = { print_item_no: NO };
const qcRecords = [{ print_item_no: NO, passed_qty: 100, failed_qty: 0 }];

describe('12.22 出貨人員對運送中的出貨單轉異常', () => {
  beforeEach(() => seed([shipmentOf('a', '運送中')]));

  it('轉異常只歸出貨人員：業務與諮詢在運送中沒有任何下一步，出貨人員有轉異常', () => {
    const shipment = byId('a');
    expect(nextStatusOptions({ role: 'sales', shipment })).toEqual([]);
    expect(nextStatusOptions({ role: 'consultant', shipment })).toEqual([]);
    const options = nextStatusOptions({ role: 'shipper', shipment });
    expect(options.map((o) => o.status)).toContain('異常');
    expect(options.find((o) => o.status === '異常').required).toEqual(['reason']);
  });

  it('理由必填：理由空白時單不變、歷程不增加', () => {
    useQcShippingStore.getState().markAbnormal('a', '   ', '曾志偉');
    expect(byId('a').status).toBe('運送中');
    expect(byId('a').void_reason ?? null).toBeNull();
    expect(byId('a').history).toHaveLength(0);
  });

  it('填理由後單轉異常，記理由與轉入時間，歷程多一筆轉異常', () => {
    useQcShippingStore.getState().markAbnormal('a', '客戶拒收', '曾志偉');
    const sh = byId('a');
    expect(sh.status).toBe('異常');
    expect(sh.void_reason).toBe('客戶拒收');
    expect(sh.void_at).toBeTruthy();
    const last = sh.history.at(-1);
    expect(last.category).toBe('異常');
    expect(last.event).toBe('轉異常');
    expect(last.actor).toBe('曾志偉');
    expect(last.remark).toContain('客戶拒收');
    expect(last.changes).toEqual([{ field: '出貨單狀態', before: '運送中', after: '異常' }]);
  });

  it('只有運送中的單轉得了異常：待出貨與已送達直接呼叫也不寫入', () => {
    seed([shipmentOf('p', '待出貨'), shipmentOf('d', '已送達')]);
    useQcShippingStore.getState().markAbnormal('p', '亂轉', '曾志偉');
    useQcShippingStore.getState().markAbnormal('d', '亂轉', '曾志偉');
    expect(byId('p').status).toBe('待出貨');
    expect(byId('d').status).toBe('已送達');
  });

  it('轉異常後不再計入累計已出貨數量，可出貨額度加回明細數量（印件列表與詳情共用這一個算式）', () => {
    const before = calcShippableQty(printItem, useQcShippingStore.getState().shipments, qcRecords);
    expect(before).toBe(0);
    useQcShippingStore.getState().markAbnormal('a', '客戶拒收', '曾志偉');
    const after = calcShippableQty(printItem, useQcShippingStore.getState().shipments, qcRecords);
    expect(after).toBe(100);
  });
});

describe('12.23 業務對未離廠的出貨單作廢', () => {
  const PRE_DEPARTURE = ['未處理', '打包中', '待出貨'];

  it('業務與諮詢在未離廠三態有作廢（理由必填），出貨人員與揀貨人員沒有', () => {
    PRE_DEPARTURE.forEach((status) => {
      const shipment = shipmentOf('x', status);
      const options = nextStatusOptions({ role: 'sales', shipment, canVoid: true });
      expect(options.map((o) => o.status), status).toContain('已作廢');
      expect(options.find((o) => o.status === '已作廢').required).toEqual(['reason']);
      expect(
        nextStatusOptions({ role: 'consultant', shipment, canVoid: true }).map((o) => o.status),
      ).toContain('已作廢');
      expect(
        nextStatusOptions({ role: 'shipper', shipment }).map((o) => o.status),
        status,
      ).not.toContain('已作廢');
    });
  });

  it('運送中與已送達沒有作廢：選項不出現，直接呼叫也不寫入', () => {
    ['運送中', '已送達'].forEach((status) => {
      expect(
        nextStatusOptions({ role: 'sales', shipment: shipmentOf('x', status), canVoid: true }),
        status,
      ).toEqual([]);
    });
    seed([shipmentOf('t', '運送中'), shipmentOf('d', '已送達')]);
    useQcShippingStore.getState().voidShipment('t', '亂作廢', '洪嘉駿');
    useQcShippingStore.getState().voidShipment('d', '亂作廢', '洪嘉駿');
    expect(byId('t').status).toBe('運送中');
    expect(byId('d').status).toBe('已送達');
  });

  it('理由必填：理由空白時單不變', () => {
    seed([shipmentOf('u', '未處理')]);
    useQcShippingStore.getState().voidShipment('u', '', '洪嘉駿');
    expect(byId('u').status).toBe('未處理');
    expect(byId('u').history).toHaveLength(0);
  });

  it('填理由後單轉已作廢，記理由與轉入時間，歷程多一筆作廢出貨單，額度加回明細數量', () => {
    seed([shipmentOf('u', '未處理')]);
    expect(calcShippableQty(printItem, useQcShippingStore.getState().shipments, qcRecords)).toBe(0);
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
    expect(calcShippableQty(printItem, useQcShippingStore.getState().shipments, qcRecords)).toBe(100);
  });
});

describe('12.24 收掉最後一張在途單時補跑送達收尾判定', () => {
  // 購買數量 100：一張已送達（100）加一張運送中（50，補出的量）
  const orderState = () => useOrdersStore.getState().orders[0];
  const shipments = () => [
    shipmentOf('done', '已送達', {
      details: [{ print_item_no: NO, name: '終態樣本', qty: 100, picked_qty: 100, per_box_qty: 50 }],
    }),
    shipmentOf('road', '運送中', {
      details: [{ print_item_no: NO, name: '終態樣本', qty: 50, picked_qty: 50, per_box_qty: 50 }],
    }),
  ];

  it('轉異常前還有在途單，印件與訂單都不收尾', () => {
    seed(shipments());
    expect(orderState().print_items[0].print_item_status).toBe('出貨中');
    expect(orderState().status).toBe('出貨中');
  });

  it('在途單轉異常後補跑判定：印件轉已送達、訂單轉訂單完成', () => {
    seed(shipments());
    const result = useQcShippingStore.getState().markAbnormal('road', '客戶拒收', '曾志偉');
    expect(result.deliveredNames).toEqual(['終態樣本']);
    expect(result.orderCompleted).toBe(true);
    expect(orderState().print_items[0].print_item_status).toBe('已送達');
    expect(orderState().status).toBe('訂單完成');
  });

  it('作廢也補跑：未離廠那張作廢後，其餘單已全部送達且量足，印件轉已送達', () => {
    seed([
      shipmentOf('done', '已送達'),
      shipmentOf('pre', '待出貨', {
        details: [{ print_item_no: NO, name: '終態樣本', qty: 50, picked_qty: 50, per_box_qty: 50 }],
      }),
    ]);
    const result = useQcShippingStore.getState().voidShipment('pre', '客戶改期', '洪嘉駿');
    expect(result.deliveredNames).toEqual(['終態樣本']);
    expect(orderState().print_items[0].print_item_status).toBe('已送達');
  });

  it('收掉在途單後量仍不足時不收尾：已送達的量不足購買數量', () => {
    seed(shipments(), { orderedQty: 300 });
    const result = useQcShippingStore.getState().markAbnormal('road', '客戶拒收', '曾志偉');
    expect(result.deliveredNames).toEqual([]);
    expect(orderState().print_items[0].print_item_status).toBe('出貨中');
  });
});

describe('12.25 出貨人員對已送達的出貨單補附送達憑證', () => {
  it('專車與自取的已送達單，出貨人員可補附，憑證名稱分別是司機交付照與現場點交照', () => {
    expect(attachDeliveryProofOf({ role: 'shipper', shipment: shipmentOf('a', '已送達') })).toEqual({
      allowed: true,
      proofLabel: '司機交付照',
    });
    expect(
      attachDeliveryProofOf({ role: 'shipper', shipment: shipmentOf('a', '已送達', { method: '自取' }) }),
    ).toEqual({ allowed: true, proofLabel: '現場點交照' });
  });

  it('第三方物流的已送達單也可補附，憑證名稱為送達照片；其他狀態與其他角色都沒有', () => {
    expect(
      attachDeliveryProofOf({
        role: 'shipper',
        shipment: shipmentOf('a', '已送達', { method: '新竹物流' }),
      }),
    ).toEqual({ allowed: true, proofLabel: '送達照片' });
    ['草稿', '未處理', '打包中', '待出貨', '運送中', '異常', '已作廢'].forEach((status) => {
      expect(
        attachDeliveryProofOf({ role: 'shipper', shipment: shipmentOf('a', status) }).allowed,
        status,
      ).toBe(false);
    });
    ['sales', 'consultant', 'picker', 'sales_manager', null].forEach((role) => {
      expect(
        attachDeliveryProofOf({ role, shipment: shipmentOf('a', '已送達') }).allowed,
        String(role),
      ).toBe(false);
    });
  });

  it('補附後單仍為已送達，送達時間與操作人不變；沒有憑證時寫入憑證欄，歷程多一筆補附送達憑證', () => {
    seed([
      shipmentOf('a', '已送達', {
        delivered_at: '2026-10-01 09:00',
        delivered_by: '曾志偉',
        delivery_proof: null,
      }),
    ]);
    const result = useQcShippingStore
      .getState()
      .attachDeliveryProof('a', { operator: '曾志偉', proof: { name: '司機交付照-補.jpg', url: null } });
    expect(result.ok).toBe(true);
    const sh = byId('a');
    expect(sh.status).toBe('已送達');
    expect(sh.delivered_at).toBe('2026-10-01 09:00');
    expect(sh.delivered_by).toBe('曾志偉');
    expect(sh.delivery_proof).toEqual({ name: '司機交付照-補.jpg', url: null });
    const last = sh.history.at(-1);
    expect(last.category).toBe('送達確認');
    expect(last.event).toBe('補附送達憑證');
    expect(last.attachments.map((a) => a.name)).toEqual(['司機交付照-補.jpg']);
    expect(last.changes).toEqual([]);
  });

  it('已有憑證時保留原憑證，新照片進歷程附件', () => {
    seed([shipmentOf('a', '已送達', { delivery_proof: '司機交付照-原.jpg' })]);
    useQcShippingStore
      .getState()
      .attachDeliveryProof('a', { operator: '曾志偉', proof: { name: '司機交付照-補.jpg', url: null } });
    expect(byId('a').delivery_proof).toBe('司機交付照-原.jpg');
    expect(byId('a').history.at(-1).attachments.map((a) => a.name)).toEqual(['司機交付照-補.jpg']);
  });

  it('第三方物流的已送達單補附：保留原配達時間憑證，歷程多一筆帶送達照片', () => {
    seed([
      shipmentOf('h', '已送達', {
        method: '新竹物流',
        delivery_proof: '物流商配達時間：2026-06-23 10:20',
      }),
    ]);
    const result = useQcShippingStore
      .getState()
      .attachDeliveryProof('h', { operator: '曾志偉', proof: { name: '送達照片-補.jpg', url: null } });
    expect(result.ok).toBe(true);
    expect(byId('h').status).toBe('已送達');
    expect(byId('h').delivery_proof).toBe('物流商配達時間：2026-06-23 10:20');
    const last = byId('h').history.at(-1);
    expect(last.event).toBe('補附送達憑證');
    expect(last.attachments.map((a) => a.name)).toEqual(['送達照片-補.jpg']);
  });

  it('只有已送達的單補得進去；沒附照片直接呼叫不寫入', () => {
    seed([shipmentOf('t', '運送中'), shipmentOf('d', '已送達')]);
    const store = useQcShippingStore.getState();
    const proof = { name: 'x.jpg', url: null };
    expect(store.attachDeliveryProof('t', { operator: '曾志偉', proof }).ok).toBe(false);
    expect(store.attachDeliveryProof('d', { operator: '曾志偉', proof: null }).ok).toBe(false);
    expect(byId('t').history).toHaveLength(0);
    expect(byId('d').history).toHaveLength(0);
  });
});
