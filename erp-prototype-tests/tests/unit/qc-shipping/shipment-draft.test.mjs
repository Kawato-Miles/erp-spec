import { beforeEach, describe, expect, it } from 'vitest';
import {
  calcRemainingToShipQty,
  DETAILS_ITEMS_LOCKED_HINT,
  DETAILS_LOCKED_HINT,
  displayDetailsOf,
  displayDetailsTotalQty,
  nextShipmentNoOf,
  SETTLED_ALREADY_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  describeSender,
  dispatchLabelOf,
  isThirdPartyMethod,
  senderCompanyCodeOf,
  shipmentNoOf,
  SHIPPING_METHOD_OPTIONS,
  shippingMethodProfileOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY,
  logisticsActionsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { boxedShipment, departed, dispatched, packedShipment, undispatched } from './_fixtures.mjs';
import { isFullyDeparted, isNotDeparted, isPartiallyDeparted } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import { isPrintItemShipped } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.1（清單與側板呈現草稿的預計值）、12.2（出貨印件預設數量、六值出貨方式、新建入口
// 一律先落草稿）、12.6 與 12.7（第三方判定、送達的終態守衛）、12.11（寄件資訊依帳務公司、
// 成立那一刻凍住代號）、12.58（出貨單編號送出時產生，草稿沒有編號；草稿期間不記歷程；
// 送出後只能改出貨明細數量）的數字與取值驗算。

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
      logisticsOrders: [departed('SH-1-01', '已送達')],
    });
    expect(calcRemainingToShipQty(printItem, [delivered])).toBe(300);
  });

  it('已作廢的單退出佔用；異常的單仍佔用（不回補）', () => {
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-2', '已作廢', 100)])).toBe(500);
    const abnormal = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [departed('SH-1-01', '例外事故', { exception_source: 'manual' })],
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
  const pickup = packedShipment({ method: '自取', logisticsOrders: [undispatched('SH-TEST-0001-01')] });
  const carrier = packedShipment({
    method: '新竹物流',
    logisticsOrders: [undispatched('SH-TEST-0002-01'), undispatched('SH-TEST-0002-02')],
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
    expect(keysOf(pickup, pickup.logistics_orders[0]).filter((k) => k !== LOGISTICS_LEVEL_KEY.DOWNLOAD_LABEL)).toEqual([LOGISTICS_LEVEL_KEY.DISPATCH]);
    expect(dispatchLabelOf('自取')).toBe('標記可自取');
    carrier.logistics_orders.forEach((l) => {
      expect(keysOf(carrier, l).filter((k) => k !== LOGISTICS_LEVEL_KEY.DOWNLOAD_LABEL)).toEqual([LOGISTICS_LEVEL_KEY.DISPATCH]);
    });
    expect(dispatchLabelOf('新竹物流')).toBe('拋單');
  });

  it('出貨動作在物流單貨態為待出貨且未拋單成功時出現；已拋單成功的物流單沒有出貨動作；物流單列沒有重新同步', () => {
    expect(LOGISTICS_LEVEL_KEY.RESYNC).toBeUndefined();
    const waiting = packedShipment({ method: '新竹物流', logisticsOrders: [dispatched('SH-TEST-0002-01')] });
    expect(logisticsActionsOf({ role: 'shipper', shipment: waiting, logistics: waiting.logistics_orders[0] })).not.toContain(LOGISTICS_LEVEL_KEY.DISPATCH);
  });

  it('出貨確認與標記可自取沒有出貨單層的入口：專車配送、其他、自取都沒有批次', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      const sh = packedShipment({ method, logisticsOrders: [undispatched('SH-TEST-0003-01')] });
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
  receiver_zip: '114',
  receiver_city: '台北市',
  receiver_district: '內湖區',
  receiver_address: '文德路 168 號 3 樓',
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
    shipmentNo: 'SH-2026-09-01001',
    orderNo: ORDER_NO,
    method: '順豐',
    printItemNo: DETAILS[0].print_item_no,
    name: DETAILS[0].name,
    qty: DETAILS[0].qty,
    logisticsOrders: [departed('SH-2026-09-01001-01', '運送中', { tracking_no: 'SF-9001' })],
  });

describe('12.7 送達確認與交付確認不附照片；第三方以物流商回傳為主、送達確認為備援；後到者不改任何欄位', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [transitShipment()] });
  });

  it('人工送達確認先寫入後，第二次送達確認改不動任何欄位', () => {
    const written = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-09-01001-01', {
        operator: '吳孟哲',
        delivered_at: '2026-09-20 10:00',
      });
    expect(written.ok).toBe(true);
    const first = shipmentById('sh-test-transit').logistics_orders[0];
    expect(first.cargo_status).toBe('已送達');
    expect(first.delivered_by).toBe('吳孟哲');
    expect(shipmentStatusOf(shipmentById('sh-test-transit'))).toBe('已送達');

    const late = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-09-01001-01', {
        operator: '范姜宏',
      });
    expect(late.ok).toBe(false);
    expect(late.settledAlready).toBe(true);
    const after = shipmentById('sh-test-transit').logistics_orders[0];
    expect(after.delivered_by).toBe('吳孟哲');
    expect(after.delivered_at).toBe('2026-09-20 10:00');
    expect('delivery_proof' in after).toBe(false);
  });

  it('還沒拋單成功（拋單狀態未拋單、貨態待出貨）的物流單不接受送達確認，貨態不變', () => {
    useQcShippingStore.setState({
      shipments: [
        packedShipment({
          id: 'sh-test-transit',
          method: '順豐',
          printItemNo: DETAILS[0].print_item_no,
          logisticsOrders: [undispatched('SH-2026-09-01001-01')],
        }),
      ],
    });
    const result = useQcShippingStore
      .getState()
      .confirmLogisticsDelivery('sh-test-transit', 'SH-2026-09-01001-01', {
        operator: '吳孟哲',
      });
    expect(result.ok).toBe(false);
    expect(shipmentById('sh-test-transit').logistics_orders[0].cargo_status).toBe('待出貨');
    expect(shipmentById('sh-test-transit').logistics_orders[0].dispatch_status).toBe('未拋單');
  });

  it('第三方送達由物流商回傳推進（receiveCarrierReply）；沒有重新同步與補附送達憑證的動作', () => {
    expect(useQcShippingStore.getState().syncCarrierDelivered).toBeUndefined();
    expect(useQcShippingStore.getState().syncLogistics).toBeUndefined();
    expect(useQcShippingStore.getState().attachLogisticsProof).toBeUndefined();
    expect(typeof useQcShippingStore.getState().receiveCarrierReply).toBe('function');
  });

  it('專車送達確認不附照片：已出貨的專車物流單不傳任何附件即成立，物流單轉已送達', () => {
    useQcShippingStore.setState({
      shipments: [
        packedShipment({ id: 'sh-car', method: '專車配送', orderNo: ORDER_NO, printItemNo: DETAILS[0].print_item_no, qty: 100, logisticsOrders: [departed('SH-CAR-01', '已出貨')] }),
      ],
    });
    expect(useQcShippingStore.getState().confirmLogisticsDelivery('sh-car', 'SH-CAR-01', { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentById('sh-car').logistics_orders[0].cargo_status).toBe('已送達');
  });

  it('後到者看到的提示只有一句，送達確認共用同一份文字', () => {
    expect(SETTLED_ALREADY_HINT).toBe('此單已收尾，請重新整理');
  });
});

// ── 12.2 草稿不使印件算已出貨 ──

describe('12.2 草稿不使印件算已出貨：不屬任一集合詞、沒有物流單', () => {
  it('一張草稿出貨單：所屬印件維持未出貨，草稿不屬未離廠、部分離廠、全數離廠，沒有物流單', () => {
    const draft = draftWith('d-1', 500);
    draft.logistics_orders = [];
    expect(isPrintItemShipped([draft], 'PI-2026-0820')).toBe(false);
    expect([isNotDeparted(draft), isPartiallyDeparted(draft), isFullyDeparted(draft)]).toEqual([false, false, false]);
    expect(draft.logistics_orders).toEqual([]);
  });
});

// ── 12.58 出貨單編號送出時產生，草稿沒有編號 ──

const pad2 = (n) => String(n).padStart(2, '0');
const todayPrefix = () => {
  const d = new Date();
  return `SH-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

describe('12.58 出貨單編號送出時產生（SH-年-月-日加當日流水號），草稿沒有編號', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [] });
  });

  it('草稿沒有出貨單編號，畫面顯示破折號', () => {
    const id = newDraft();
    expect(shipmentById(id).shipment_no).toBeNull();
    expect(shipmentNoOf(shipmentById(id))).toBe('－');
  });

  it('送出時產生出貨單編號：SH-年-月-日加當日流水號三碼，當日第一張為 001', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    expect(shipmentById(id).shipment_no).toBe(`${todayPrefix()}001`);
    expect(shipmentById(id).shipment_no).toMatch(/^SH-\d{4}-\d{2}-\d{2}\d{3,}$/);
  });

  it('同日第二張送出的流水 +1；先建的草稿後送出也照送出順序取號', () => {
    const first = newDraft();
    const second = newDraft();
    useQcShippingStore.getState().finalizeShipment(second, { details: DETAILS, ...HEADER });
    useQcShippingStore.getState().finalizeShipment(first, { details: DETAILS, ...HEADER });
    expect(shipmentById(second).shipment_no).toBe(`${todayPrefix()}001`);
    expect(shipmentById(first).shipment_no).toBe(`${todayPrefix()}002`);
  });

  it('流水號依日期各自起算、至少三碼：別日的編號不影響當日流水', () => {
    const now = new Date(2026, 9, 20, 9, 0);
    expect(nextShipmentNoOf([], now)).toBe('SH-2026-10-20001');
    expect(
      nextShipmentNoOf(
        [{ shipment_no: 'SH-2026-10-19007' }, { shipment_no: 'SH-2026-10-20001' }, { shipment_no: null }],
        now,
      ),
    ).toBe('SH-2026-10-20002');
    expect(nextShipmentNoOf([{ shipment_no: 'SH-2026-10-20999' }], now)).toBe('SH-2026-10-201000');
  });

  it('草稿期間不記歷程：建草稿、改草稿都不寫歷程；送出時記一筆建立出貨單，含出貨單編號的前後值', () => {
    const id = newDraft();
    expect(shipmentById(id).history).toEqual([]);
    useQcShippingStore.getState().updateDraft(id, { note: '改備註' });
    expect(shipmentById(id).history).toEqual([]);
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    const history = shipmentById(id).history;
    expect(history).toHaveLength(1);
    expect(history[0].category).toBe('建立出貨單');
    expect(history[0].changes).toContainEqual({ field: '出貨單編號', before: null, after: `${todayPrefix()}001` });
    expect(history[0].changes).toContainEqual({ field: '出貨單狀態', before: '草稿', after: '未處理' });
  });
});

describe('12.58 送出後只能改出貨明細數量：不能增刪印件、數量最小 1，確認可出貨之後鎖住', () => {
  const TWO = [
    { print_item_no: 'PI-A', name: '印件甲', qty: 100, picked_qty: null },
    { print_item_no: 'PI-B', name: '印件乙', qty: 50, picked_qty: null },
  ];
  const unprocessed = (status = '未處理') => ({
    id: 'sh-edit',
    shipment_no: 'SH-2026-10-20001',
    order_no: ORDER_NO,
    status,
    method: '順豐',
    details: TWO,
    planned_details: [],
    packing_boxes: [],
    logistics_orders: [],
    packing_corrections: [],
    history: [],
  });
  const edit = (details) =>
    useQcShippingStore.getState().updateShipmentDetails('sh-edit', details, { operator: '洪嘉駿' });

  it('未處理、打包中、已裝箱時可改數量，改的那一條記一筆編輯歷程', () => {
    ['未處理', '打包中'].forEach((status) => {
      useQcShippingStore.setState({ shipments: [unprocessed(status)] });
      const r = edit([{ print_item_no: 'PI-A', qty: 80 }, { print_item_no: 'PI-B', qty: 50 }]);
      expect(r.ok, status).toBe(true);
      expect(shipmentById('sh-edit').details.map((d) => d.qty), status).toEqual([80, 50]);
      expect(shipmentById('sh-edit').history.at(-1).changes, status).toEqual([
        { field: '出貨明細 印件甲數量', before: 100, after: 80 },
      ]);
    });
    useQcShippingStore.setState({ shipments: [boxedShipment({ id: 'sh-edit', qty: 100 })] });
    expect(edit([{ print_item_no: 'PI-TEST', qty: 90 }]).ok).toBe(true);
    expect(shipmentById('sh-edit').details[0].qty).toBe(90);
  });

  it('增加印件或移除印件整筆擋下，明細不變', () => {
    useQcShippingStore.setState({ shipments: [unprocessed()] });
    const removed = edit([{ print_item_no: 'PI-A', qty: 100 }]);
    expect(removed).toEqual({ ok: false, error: DETAILS_ITEMS_LOCKED_HINT });
    const added = edit([
      { print_item_no: 'PI-A', qty: 100 },
      { print_item_no: 'PI-B', qty: 50 },
      { print_item_no: 'PI-C', qty: 10 },
    ]);
    expect(added).toEqual({ ok: false, error: DETAILS_ITEMS_LOCKED_HINT });
    const swapped = edit([{ print_item_no: 'PI-A', qty: 100 }, { print_item_no: 'PI-C', qty: 50 }]);
    expect(swapped).toEqual({ ok: false, error: DETAILS_ITEMS_LOCKED_HINT });
    expect(shipmentById('sh-edit').details).toEqual(TWO);
    expect(shipmentById('sh-edit').history).toEqual([]);
  });

  it('數量最小 1：改成 0、負數或非整數整筆擋下；改成 1 成立', () => {
    useQcShippingStore.setState({ shipments: [unprocessed()] });
    [0, -5, 1.5].forEach((qty) => {
      expect(edit([{ print_item_no: 'PI-A', qty }, { print_item_no: 'PI-B', qty: 50 }]).ok, String(qty)).toBe(false);
    });
    expect(shipmentById('sh-edit').details).toEqual(TWO);
    expect(edit([{ print_item_no: 'PI-A', qty: 1 }, { print_item_no: 'PI-B', qty: 50 }]).ok).toBe(true);
  });

  it('已確認可出貨之後數量鎖住：直接呼叫也不寫入', () => {
    useQcShippingStore.setState({
      shipments: [packedShipment({ id: 'sh-edit', qty: 100, logisticsOrders: [undispatched('SH-EDIT-01')] })],
    });
    expect(edit([{ print_item_no: 'PI-TEST', qty: 80 }])).toEqual({ ok: false, error: DETAILS_LOCKED_HINT });
    expect(shipmentById('sh-edit').details[0].qty).toBe(100);
  });
});
