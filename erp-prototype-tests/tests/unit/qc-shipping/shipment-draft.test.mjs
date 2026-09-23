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
  isThirdPartyMethod,
  senderCompanyCodeOf,
  SHIPPING_METHOD_OPTIONS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
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
    expect(calcRemainingToShipQty(printItem, [shipmentWith('sh-1', '已送達', 600 - 400)])).toBe(300);
  });

  it('異常與已作廢的單退出佔用', () => {
    const shipments = [shipmentWith('sh-1', '異常', 200), shipmentWith('sh-2', '已作廢', 100)];
    expect(calcRemainingToShipQty(printItem, shipments)).toBe(500);
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

describe('出貨方式一欄六值', () => {
  it('六個值為自取、專車配送、順豐、新竹物流、超商、其他', () => {
    expect(SHIPPING_METHOD_OPTIONS).toEqual([
      '自取',
      '專車配送',
      '順豐',
      '新竹物流',
      '超商',
      '其他',
    ]);
  });

  it('自取與專車配送是自家人送，不算第三方', () => {
    expect(isThirdPartyMethod('自取')).toBe(false);
    expect(isThirdPartyMethod('專車配送')).toBe(false);
  });

  it('其餘四值交給外部物流商，算第三方', () => {
    expect(isThirdPartyMethod('順豐')).toBe(true);
    expect(isThirdPartyMethod('新竹物流')).toBe(true);
    expect(isThirdPartyMethod('超商')).toBe(true);
    expect(isThirdPartyMethod('其他')).toBe(true);
  });

  it('草稿還沒填出貨方式時不算第三方', () => {
    expect(isThirdPartyMethod(null)).toBe(false);
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

// ── 12.6、12.7：送達的兩條路徑先寫入者成立 ──

const inTransitShipment = () => ({
  id: 'sh-test-transit',
  shipment_no: 'SH-2026-9001',
  order_no: ORDER_NO,
  client_name: '樣本客戶',
  status: '運送中',
  method: '順豐',
  details: DETAILS,
  planned_details: [],
  tracking_no: 'SF-9001',
  delivered_at: null,
  delivered_by: null,
  delivery_proof: null,
});

describe('12.6、12.7 送達只對運送中的單生效，後到者不改任何欄位', () => {
  beforeEach(() => {
    seedOrder('SSP');
    useQcShippingStore.setState({ shipments: [inTransitShipment()] });
  });

  it('人工送達確認先寫入時，物流商回傳改不動任何欄位', () => {
    const written = useQcShippingStore
      .getState()
      .confirmDelivery('sh-test-transit', { operator: '吳孟哲', proof: '物流商配達時間：2026-09-20 10:00' });
    expect(written.status).toBe('已送達');
    expect(written.delivered_by).toBe('吳孟哲');

    const late = useQcShippingStore
      .getState()
      .syncCarrierDelivered('sh-test-transit', { delivered_at: '2026-09-20 18:00' });
    expect(late).toBeNull();
    const after = shipmentById('sh-test-transit');
    expect(after.delivered_by).toBe('吳孟哲');
    expect(after.delivered_at).not.toBe('2026-09-20 18:00');
  });

  it('物流商回傳先寫入時，人工送達確認同樣被擋下', () => {
    const written = useQcShippingStore
      .getState()
      .syncCarrierDelivered('sh-test-transit', { delivered_at: '2026-09-20 10:00' });
    expect(written.status).toBe('已送達');
    expect(written.delivered_by).toBe('物流商同步（模擬）');

    const late = useQcShippingStore
      .getState()
      .confirmDelivery('sh-test-transit', { operator: '吳孟哲', proof: '補登' });
    expect(late).toBeNull();
    expect(shipmentById('sh-test-transit').delivered_by).toBe('物流商同步（模擬）');
  });

  it('還沒離廠的單也不接受送達寫入', () => {
    useQcShippingStore.setState({
      shipments: [{ ...inTransitShipment(), status: '待出貨' }],
    });
    expect(
      useQcShippingStore.getState().syncCarrierDelivered('sh-test-transit', {
        delivered_at: '2026-09-20 10:00',
      }),
    ).toBeNull();
    expect(shipmentById('sh-test-transit').status).toBe('待出貨');
  });

  it('後到者看到的提示只有一句，兩條路徑共用同一份文字', () => {
    expect(SETTLED_ALREADY_HINT).toBe('此單已收尾，請重新整理');
  });
});
