import { beforeEach, describe, expect, it } from 'vitest';
import {
  calcRemainingToShipQty,
  displayDetailsOf,
  displayDetailsTotalQty,
  SETTLED_ALREADY_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  describeSender,
  dispatchLabelOf,
  isThirdPartyMethod,
  senderCompanyCodeOf,
  SHIPPING_METHOD_OPTIONS,
  shippingMethodProfileOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY,
  logisticsActionsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { departed, logistics, packedShipment } from './_fixtures.mjs';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.1（清單與側板呈現草稿的預計值）、12.2（出貨印件預設數量、六值出貨方式、新建入口
// 一律先落草稿）、12.6 與 12.7（第三方判定、送達的終態守衛）、12.11（寄件資訊依帳務公司、
// 成立那一刻凍住代號）的數字與取值驗算。

const printItem = { print_item_no: 'PI-2026-0820', ordered_qty: 500 };

const shipmentWith = (id, status, qty) => ({
  id,
  status,
  details: [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty }],
  planned_details: [],
});

const draftWith = (id, qty) => ({
  id,
  status: '草稿',
  details: [],
  planned_details: [
    { print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty },
  ],
});

describe('出貨印件的預設數量（剩餘應出量）', () => {
  it('沒有其他出貨單時等於購買數量', () => {
    expect(calcRemainingToShipQty(printItem, [])).toBe(500);
  });

  it('扣掉其他出貨單已佔用的量，未離廠與已送達都算', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 200)])).toBe(300);
    const delivered = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [departed('SH-1-001', '已送達')],
    });
    expect(calcRemainingToShipQty(printItem, [delivered])).toBe(300);
  });

  it('已作廢的單退出佔用；異常的單仍佔用（不回補）', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-2', '已作廢', 100)])).toBe(500);
    const abnormal = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [departed('SH-1-001', '例外事故', { exception_source: 'manual' })],
    });
    expect(calcRemainingToShipQty(printItem, [abnormal])).toBe(300);
  });

  it('草稿的預計數量不算佔用（預計值不是出貨指令）', () => {
    expect(calcRemainingToShipQty(printItem, [draftWith('sh-d1', 500)])).toBe(500);
  });

  it('改某張單時排除本單自身的佔用', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 200)], 'sh-1')).toBe(
      500,
    );
  });

  it('已佔用超過購買數量時夾在 0、不為負', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '未處理', 600)])).toBe(0);
  });
});

describe('清單與側板要顯示的印件列', () => {
  it('草稿顯示預計出貨印件', () => {
    const draft = draftWith('sh-d1', 500);
    expect(displayDetailsOf(draft)).toHaveLength(1);
    expect(displayDetailsTotalQty(draft)).toBe(500);
  });

  it('成立後的單顯示正式明細', () => {
    const shipment = shipmentWith('sh-1', '未處理', 480);
    expect(displayDetailsOf(shipment)[0].qty).toBe(480);
    expect(displayDetailsTotalQty(shipment)).toBe(480);
  });

  it('還沒填預計出貨印件的草稿合計為 0', () => {
    expect(displayDetailsTotalQty({ status: '草稿', details: [], planned_details: [] })).toBe(0);
  });
});

describe('出貨方式一欄七值，各帶兩個屬性', () => {
  it('七個值為自取、專車配送、順豐、新竹物流、7-11 交貨便、全家、其他（超商已拆成後兩者）', () => {
    expect(SHIPPING_METHOD_OPTIONS).toEqual([
      '自取',
      '專車配送',
      '順豐',
      '新竹物流',
      '7-11 交貨便',
      '全家',
      '其他',
    ]);
    expect(SHIPPING_METHOD_OPTIONS).not.toContain('超商');
  });

  it('兩個屬性：支援子母單、有外部物流單號（設計 § 三）', () => {
    const profile = (m) => shippingMethodProfileOf(m);
    expect(profile('順豐')).toMatchObject({ supports_master_child: true, has_external_no: true });
    expect(profile('新竹物流')).toMatchObject({ supports_master_child: false, has_external_no: true });
    expect(profile('7-11 交貨便')).toMatchObject({ supports_master_child: false, has_external_no: true });
    expect(profile('全家')).toMatchObject({ supports_master_child: false, has_external_no: true });
    expect(profile('自取')).toMatchObject({ supports_master_child: true, has_external_no: false });
    expect(profile('專車配送')).toMatchObject({ supports_master_child: true, has_external_no: false });
    expect(profile('其他')).toMatchObject({ supports_master_child: true, has_external_no: false });
    expect(profile(null)).toBeNull();
  });

  it('出貨動作名稱依出貨方式：拋單、出貨確認、標記可自取', () => {
    expect(dispatchLabelOf('順豐')).toBe('拋單');
    expect(dispatchLabelOf('7-11 交貨便')).toBe('拋單');
    expect(dispatchLabelOf('專車配送')).toBe('出貨確認');
    expect(dispatchLabelOf('其他')).toBe('出貨確認');
    expect(dispatchLabelOf('自取')).toBe('標記可自取');
  });

  it('自取、專車配送、其他沒有外部物流單號，不算第三方', () => {
    expect(isThirdPartyMethod('自取')).toBe(false);
    expect(isThirdPartyMethod('專車配送')).toBe(false);
    expect(isThirdPartyMethod('其他')).toBe(false);
  });

  it('順豐、新竹物流、7-11 交貨便、全家有外部物流單號，算第三方', () => {
    expect(isThirdPartyMethod('順豐')).toBe(true);
    expect(isThirdPartyMethod('新竹物流')).toBe(true);
    expect(isThirdPartyMethod('7-11 交貨便')).toBe(true);
    expect(isThirdPartyMethod('全家')).toBe(true);
  });

  it('草稿還沒填出貨方式時不算第三方', () => {
    expect(isThirdPartyMethod(null)).toBe(false);
  });
});

// ── 12.6 出貨動作依出貨方式分流，只有拋單方式的出貨單有批次拋單（shipment spec § 出貨與送達確認；grill G39） ──

describe('12.6 出貨動作分流：自取出貨單上沒有任何出貨動作，新竹物流出貨單上只有批次拋單一顆', () => {
  const pickup = packedShipment({ method: '自取', logisticsOrders: [logistics('SH-TEST-0001-001', '已裝箱')] });
  const carrier = packedShipment({
    method: '新竹物流',
    logisticsOrders: [logistics('SH-TEST-0002-001', '已裝箱'), logistics('SH-TEST-0002-002', '已裝箱')],
  });

  it('出貨單層：自取沒有批次拋單，新竹物流有且可按', () => {
    expect(batchDispatchOf({ role: 'shipper', shipment: pickup }).visible).toBe(false);
    expect(batchDispatchOf({ role: 'shipper', shipment: carrier })).toEqual({
      visible: true,
      disabled: false,
      reason: null,
    });
  });

  it('物流單列：自取只有標記可自取（出貨動作鈕名由出貨方式決定），新竹物流兩筆各只有拋單', () => {
    const keysOf = (sh, l) => logisticsActionsOf({ role: 'shipper', shipment: sh, logistics: l });
    expect(keysOf(pickup, pickup.logistics_orders[0])).toEqual([LOGISTICS_LEVEL_KEY.DISPATCH]);
    expect(dispatchLabelOf('自取')).toBe('標記可自取');
    carrier.logistics_orders.forEach((l) => {
      expect(keysOf(carrier, l)).toEqual([LOGISTICS_LEVEL_KEY.DISPATCH]);
    });
    expect(dispatchLabelOf('新竹物流')).toBe('拋單');
  });

  it('出貨確認與標記可自取沒有出貨單層的入口：專車配送、其他、自取都沒有批次', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      const sh = packedShipment({ method, logisticsOrders: [logistics('SH-TEST-0003-001', '已裝箱')] });
      expect(batchDispatchOf({ role: 'shipper', shipment: sh }).visible, method).toBe(false);
    });
  });
});

describe('寄件資訊依訂單的帳務公司帶出', () => {
  it('SSP 帶出感官文化印刷', () => {
    expect(describeSender('SSP')).toContain('感官文化印刷');
  });

  it('BRO 帶出品牌名稱理想印制（「制」不是「製」）', () => {
    expect(describeSender('BRO')).toContain('理想印制');
    expect(describeSender('BRO')).not.toContain('理想印製');
  });

  it('寄件資訊寫品牌名稱，不寫帳務公司抬頭', () => {
    expect(describeSender('SSP').startsWith('感官文化印刷｜')).toBe(true);
    expect(describeSender('BRO').startsWith('理想印制｜')).toBe(true);
  });

  it('查無帳務公司時為空值（畫面顯示破折號）', () => {
    expect(describeSender(null)).toBeNull();
  });
});

// ── 12.2：新建入口沒有直達未處理的路 ──

const ORDER_NO = 'ORD-TEST-SHIP';

const seedOrder = (accountCompany) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-ship',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: '製作完成',
        account_company: accountCompany,
        activities: [],
        print_items: [],
      },
    ],
  });
};

const DETAILS = [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty: 100 }];

const HEADER = {
  planned_ship_date: '2026-09-20',
  method: '順豐',
  receiver_name: '周雅文',
  receiver_phone: '02-2790-6611',
  receiver_address: '台北市內湖區文德路 168 號 3 樓',
  packing_note: '',
  note: '',
};

const newDraft = () =>
  useQcShippingStore.getState().createDraft({
    order_no: ORDER_NO,
    client_name: '樣本客戶',
    created_by: '洪嘉駿',
    planned_details: DETAILS,
    ...HEADER,
  });

const shipmentById = (id) => useQcShippingStore.getState().shipments.find((sh) => sh.id === id);

describe('12.2 出貨單的寫入口只有建草稿與草稿成立兩支', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [] });
  });

  it('store 上沒有直達未處理的建單動作（createShipment 已移除）', () => {
    expect(useQcShippingStore.getState().createShipment).toBeUndefined();
    expect(typeof useQcShippingStore.getState().createDraft).toBe('function');
    expect(typeof useQcShippingStore.getState().finalizeShipment).toBe('function');
  });

  it('建草稿回傳新單的識別碼，讓同一個動作接得上成立那一步', () => {
    const id = newDraft();
    expect(id).toBeTruthy();
    expect(shipmentById(id).status).toBe('草稿');
  });

  it('一次建草稿再成立之後列表只有一張未處理的單，不留半張草稿', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    const shipments = useQcShippingStore.getState().shipments;
    expect(shipments).toHaveLength(1);
    expect(shipments[0].status).toBe('未處理');
    // 預計出貨印件轉為正式明細，同一件事只留一個家
    expect(shipments[0].details).toHaveLength(1);
    expect(shipments[0].planned_details).toHaveLength(0);
    // 建單人與建立日期照草稿路徑寫
    expect(shipments[0].created_by).toBe('洪嘉駿');
  });

  it('同一張草稿不會被成立第二次', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    expect(
      useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER }),
    ).toBeNull();
  });
});

// ── 12.11：寄件資訊在成立那一刻凍住的是代號 ──

describe('12.11 成立那一刻記下帳務公司代號，名稱電話地址仍取現值', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [] });
  });

  it('草稿不記代號，寄件資訊依訂單現值顯示', () => {
    const id = newDraft();
    const draft = shipmentById(id);
    expect(draft.sender_company_code).toBeNull();
    expect(senderCompanyCodeOf(draft, useOrdersStore.getState().orders[0])).toBe('SSP');
    expect(describeSender(senderCompanyCodeOf(draft, useOrdersStore.getState().orders[0]))).toContain(
      '感官文化印刷',
    );
  });

  it('成立時把當時的帳務公司代號寫進單上', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    expect(shipmentById(id).sender_company_code).toBe('SSP');
  });

  it('訂單事後改帳務公司，已成立的那張單寄件人不變', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    seedOrder('BRO');
    const order = useOrdersStore.getState().orders[0];
    expect(senderCompanyCodeOf(shipmentById(id), order)).toBe('SSP');
    expect(describeSender(senderCompanyCodeOf(shipmentById(id), order))).toContain('感官文化印刷');
  });

  it('改過帳務公司之後新開的草稿依新的帳務公司顯示', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    seedOrder('BRO');
    const laterDraftId = newDraft();
    const order = useOrdersStore.getState().orders[0];
    expect(senderCompanyCodeOf(shipmentById(laterDraftId), order)).toBe('BRO');
    expect(describeSender(senderCompanyCodeOf(shipmentById(laterDraftId), order))).toContain(
      '理想印制',
    );
  });
});

// ── 12.6、12.7：送達確認只對可確認的物流單生效，先寫入者成立 ──

const transitShipment = () =>
  packedShipment({
    id: 'sh-test-transit',
    shipmentNo: 'SH-2026-9001',
    orderNo: ORDER_NO,
    method: '順豐',
    printItemNo: DETAILS[0].print_item_no,
    name: DETAILS[0].name,
    qty: DETAILS[0].qty,
    logisticsOrders: [departed('SH-2026-9001-001', '運送中', { tracking_no: 'SF-9001' })],
  });

describe('12.6、12.7 送達確認只對運送中的第三方物流單生效，後到者不改任何欄位', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [transitShipment()] });
  });

  it('人工送達確認先寫入後，第二次送達確認改不動任何欄位', () => {
    const written = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-9001-001', {
        operator: '吳孟哲',
        proof: '物流商配達時間：2026-09-20 10:00',
      });
    expect(written.ok).toBe(true);
    const first = shipmentById('sh-test-transit').logistics_orders[0];
    expect(first.status).toBe('已送達');
    expect(first.delivered_by).toBe('吳孟哲');
    expect(shipmentStatusOf(shipmentById('sh-test-transit'))).toBe('已送達');

    const late = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-9001-001', {
        operator: '范姜宏',
        proof: '補登',
      });
    expect(late.ok).toBe(false);
    expect(late.settledAlready).toBe(true);
    const after = shipmentById('sh-test-transit').logistics_orders[0];
    expect(after.delivered_by).toBe('吳孟哲');
    expect(after.delivery_proof).toBe('物流商配達時間：2026-09-20 10:00');
  });

  it('還沒離廠的物流單不接受送達確認，狀態不變', () => {
    useQcShippingStore.setState({
      shipments: [
        packedShipment({
          id: 'sh-test-transit',
          method: '順豐',
          printItemNo: DETAILS[0].print_item_no,
          logisticsOrders: [logistics('SH-2026-9001-001', '已裝箱')],
        }),
      ],
    });
    const result = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-9001-001', {
        operator: '吳孟哲',
        proof: '補登',
      });
    expect(result.ok).toBe(false);
    expect(shipmentById('sh-test-transit').logistics_orders[0].status).toBe('已裝箱');
  });

  it('出貨單沒有直接模擬物流商回報配達的動作；模擬回傳只有物流單上的重新同步', () => {
    expect(useQcShippingStore.getState().syncCarrierDelivered).toBeUndefined();
    expect(typeof useQcShippingStore.getState().syncLogistics).toBe('function');
  });

  it('後到者看到的提示只有一句，送達確認共用同一份文字', () => {
    expect(SETTLED_ALREADY_HINT).toBe('此單已收尾，請重新整理');
  });
});
