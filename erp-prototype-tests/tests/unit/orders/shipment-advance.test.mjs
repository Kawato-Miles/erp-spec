import { beforeEach, describe, expect, it } from 'vitest';
import {
  isPrintItemDelivered,
  useOrdersStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { departed, dispatched, packedShipment } from '../qc-shipping/_fixtures.mjs';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { totalDeliveredQty } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';

// 情境 12.13（先做完的那一批可以先出）與 12.8 補充（殘留的草稿不卡收尾）的判定驗算。
// 合成資料的理由：現行 mock 的鏈四訂單與印件都已在製作完成，構造不出「兩者皆製作中」的起點；
// 一張訂單底下兩件印件各走各的，mock 上也沒有現成樣本。

const ORDER_NO = 'ORD-TEST-ADVANCE';

const seedOrder = ({ orderStatus, itemStatus }) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-advance',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: orderStatus,
        account_company: 'SSP',
        activities: [],
        print_items: [
          {
            id: 'pi-a',
            print_item_no: 'PI-TEST-A',
            name: '甲印件',
            print_item_status: itemStatus,
            ordered_qty: 500,
            unit_price: 10,
          },
          {
            id: 'pi-b',
            print_item_no: 'PI-TEST-B',
            name: '乙印件',
            print_item_status: itemStatus,
            ordered_qty: 300,
            unit_price: 10,
          },
        ],
      },
    ],
  });
};

const orderNow = () => useOrdersStore.getState().orders[0];
const itemStatusOf = (printItemNo) =>
  orderNow().print_items.find((p) => p.print_item_no === printItemNo).print_item_status;

describe('12.13 首張出貨單成立時，製作中的印件與訂單都推得動出貨中', () => {
  beforeEach(() => {
    seedOrder({ orderStatus: '製作中', itemStatus: '製作中' });
  });

  it('單上那一件印件與訂單自製作中轉出貨中', () => {
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(result.shippingNames).toEqual(['甲印件']);
    expect(result.orderAdvanced).toBe(true);
    expect(itemStatusOf('PI-TEST-A')).toBe('出貨中');
    expect(orderNow().status).toBe('出貨中');
  });

  it('不在這張單上的第二件印件維持製作中', () => {
    useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(itemStatusOf('PI-TEST-B')).toBe('製作中');
  });

  it('第二張單成立時兩邊都已在出貨中，前態守衛讓它推不動任何東西', () => {
    useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    const second = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(second.shippingNames).toEqual([]);
    expect(second.orderAdvanced).toBe(false);
  });

  it('製作完成的那一側照樣推得動（兩個前態並列，不是二選一）', () => {
    seedOrder({ orderStatus: '製作完成', itemStatus: '製作完成' });
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-B']);
    expect(result.orderAdvanced).toBe(true);
    expect(itemStatusOf('PI-TEST-B')).toBe('出貨中');
    expect(itemStatusOf('PI-TEST-A')).toBe('製作完成');
  });

  it('已送達的印件不會被新成立的單拉回（印製維度沒有回退弧）', () => {
    seedOrder({ orderStatus: '出貨中', itemStatus: '已送達' });
    const result = useOrdersStore.getState().advanceOnFirstShipment(ORDER_NO, ['PI-TEST-A']);
    expect(result.shippingNames).toEqual([]);
    expect(itemStatusOf('PI-TEST-A')).toBe('已送達');
  });
});

// ── 12.8 補充：殘留的草稿不卡印件與訂單收尾 ──

const printItem = { print_item_no: 'PI-TEST-A', ordered_qty: 500 };

// 出貨單已裝箱之後的狀態由物流單計算：這張的物流單已送達，所以出貨單是已送達，送達數量 500
const deliveredShipment = packedShipment({
  id: 'sh-done',
  printItemNo: 'PI-TEST-A',
  name: '甲印件',
  qty: 500,
  logisticsOrders: [departed('SH-TEST-0001-01', '已送達')],
});

// 草稿的印件列存在預計出貨印件、正式明細為空：收尾判定只認正式明細
const draftShipment = {
  id: 'sh-draft',
  status: '草稿',
  details: [],
  planned_details: [{ print_item_no: 'PI-TEST-A', name: '甲印件', qty: 500 }],
};

describe('12.8 補充 沒清掉的草稿不擋印件收尾', () => {
  it('唯一一張正式的單已送達且累計送達達到購買數量時成立', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment])).toBe(true);
  });

  it('同一件印件上另掛一張草稿時判定不變', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment, draftShipment])).toBe(true);
  });

  it('只有一張草稿、沒有任何正式的單時不成立（貨根本還沒出）', () => {
    expect(isPrintItemDelivered(printItem, [draftShipment])).toBe(false);
  });
});

describe('12.8 補充 異常的出貨單視為未收尾，已作廢的單先排除再判定', () => {
  const abnormalShipment = packedShipment({
    id: 'sh-abn',
    printItemNo: 'PI-TEST-A',
    name: '甲印件',
    qty: 100,
    logisticsOrders: [departed('SH-TEST-0002-01', '例外事故', { exception_source: 'manual' })],
  });
  const voidedShipment = packedShipment({
    id: 'sh-void',
    printItemNo: 'PI-TEST-A',
    name: '甲印件',
    qty: 100,
    status: '已作廢',
    logisticsOrders: [departed('SH-TEST-0003-01', '已作廢')],
  });

  it('同一件印件另有一張異常的單時不收尾：異常不回補、仍佔用，要等例外物流單處理完', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment, abnormalShipment])).toBe(false);
  });

  it('例外物流單作廢（填未送達數量）後出貨單轉已作廢，退出分母，已送達的那張就足以收尾', () => {
    expect(isPrintItemDelivered(printItem, [deliveredShipment, voidedShipment])).toBe(true);
  });

  it('累計送達數取送達數量：物流單填了未送達數量時，送達數量不足購買數量就不收尾', () => {
    const shortDelivered = packedShipment({
      id: 'sh-short',
      printItemNo: 'PI-TEST-A',
      name: '甲印件',
      qty: 500,
      logisticsOrders: [
        departed('SH-TEST-0004-01', '已送達', {
          undelivered: [{ print_item_no: 'PI-TEST-A', qty: 100 }],
        }),
      ],
    });
    expect(isPrintItemDelivered(printItem, [shortDelivered])).toBe(false);
  });
});

// ── 12.8 送達由物流商回傳推進（shipment spec 本 change delta § 送達後的收尾判定、§ 物流單狀態推進與物流商回傳） ──

describe('12.8 送達由物流商回傳推進，不經重新同步；最後一張送達才收尾', () => {
  it('最後一張送達才收尾：PI-TEST-A 購買 500、順豐一筆物流單已拋單成功、貨態待出貨；物流商回傳在途不收尾；回傳配達後出貨單已送達、送達數量 500、印件已送達、訂單完成', () => {
    seedOrder({ orderStatus: '出貨中', itemStatus: '出貨中' });
    useOrdersStore.setState({
      orders: [{ ...orderNow(), print_items: orderNow().print_items.map((p) => (p.print_item_no === 'PI-TEST-B' ? { ...p, print_item_status: '已送達' } : p)) }],
    });
    useQcShippingStore.setState({
      shipments: [
        packedShipment({ id: 'sh-sf', orderNo: ORDER_NO, method: '順豐', printItemNo: 'PI-TEST-A', name: '甲印件', qty: 500, logisticsOrders: [dispatched('SH-TEST-SF-01', { tracking_no: 'SF1' })] }),
      ],
      downloadFiles: [],
    });
    const q = useQcShippingStore.getState();
    q.receiveCarrierReply('sh-sf', 'SH-TEST-SF-01', { reply: '在途' });
    expect(itemStatusOf('PI-TEST-A')).toBe('出貨中');
    const r = useQcShippingStore.getState().receiveCarrierReply('sh-sf', 'SH-TEST-SF-01', { reply: '配達' });
    expect(r.ok).toBe(true);
    const sh = useQcShippingStore.getState().shipments[0];
    expect(sh.details[0].delivered_qty).toBe(500);
    expect(itemStatusOf('PI-TEST-A')).toBe('已送達');
    expect(orderNow().status).toBe('訂單完成');
    expect(useQcShippingStore.getState().syncLogistics).toBeUndefined();
  });

  it('補做超量送達不卡住判定：購買 300、出了 330 全數送達 → 成立', () => {
    const over = packedShipment({ id: 'sh-over', printItemNo: 'PI-TEST-A', name: '甲印件', qty: 330, logisticsOrders: [departed('L-1', '已送達')] });
    expect(isPrintItemDelivered({ print_item_no: 'PI-TEST-A', ordered_qty: 300 }, [over])).toBe(true);
  });

  it('售後補做量於印件終態後送達只記數不動狀態：印件已送達（累計 1,000）後補出 100 送達 → 累計送達數 1,100、印件維持已送達', () => {
    seedOrder({ orderStatus: '訂單完成', itemStatus: '已送達' });
    const first = packedShipment({ id: 'sh-1', orderNo: ORDER_NO, printItemNo: 'PI-TEST-A', name: '甲印件', qty: 1000, logisticsOrders: [departed('SH-1-01', '已送達')] });
    const extra = packedShipment({ id: 'sh-2', shipmentNo: 'SH-TEST-0002', orderNo: ORDER_NO, method: '專車配送', printItemNo: 'PI-TEST-A', name: '甲印件', qty: 100, logisticsOrders: [departed('SH-TEST-0002-01', '已出貨')] });
    useQcShippingStore.setState({ shipments: [first, extra], downloadFiles: [] });
    expect(useQcShippingStore.getState().confirmLogisticsDelivery('sh-2', 'SH-TEST-0002-01', { operator: '曾志偉' }).ok).toBe(true);
    expect(totalDeliveredQty(useQcShippingStore.getState().shipments, 'PI-TEST-A')).toBe(1100);
    expect(itemStatusOf('PI-TEST-A')).toBe('已送達');
  });
});
