import { beforeEach, describe, expect, it } from 'vitest';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  describeShipmentSender,
  MOCK_SHIPMENTS,
  senderOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  missingSenderFields,
  normalizeSenderFields,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.39（保密代寄）的取值與整理驗算：預設否取帳務公司、勾選後取出貨單上的三欄、
// 取消勾選不保留改過的值、建立出貨單後寄件資訊凍在單上。依據：G30。

const ORDER_NO = 'ORD-TEST-SENDER';
const ORDER = { order_no: ORDER_NO, account_company: 'SSP' };
const CONFIDENTIAL = {
  confidential_sender: true,
  sender_brand_name: '晴禾選物',
  sender_phone: '02-2755-0123',
  sender_address: '台北市大安區復興南路一段 200 號 5 樓',
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

const newDraft = (extra = {}) =>
  useQcShippingStore.getState().createDraft({
    order_no: ORDER_NO,
    client_name: '樣本客戶',
    created_by: '洪嘉駿',
    planned_details: DETAILS,
    ...HEADER,
    ...extra,
  });
const byId = (id) => useQcShippingStore.getState().shipments.find((sh) => sh.id === id);

beforeEach(() => {
  useOrdersStore.setState({
    orders: [{ ...ORDER, id: 'ord-test-sender', client_name: '樣本客戶', activities: [], print_items: [] }],
  });
  useQcShippingStore.setState({ shipments: [] });
});

describe('12.39 寄件資訊的取值（單一純函式）', () => {
  it('保密代寄預設否：取帳務公司的品牌名稱、電話、地址，單上三欄無值', () => {
    const sh = byId(newDraft());
    expect(sh.confidential_sender).toBe(false);
    expect([sh.sender_brand_name, sh.sender_phone, sh.sender_address]).toEqual([null, null, null]);
    expect(senderOf(sh, ORDER)).toMatchObject({ brand_name: '感官文化印刷', phone: '02 2736 6566' });
    expect(describeShipmentSender(sh, ORDER)).toContain('感官文化印刷');
  });

  it('保密代寄為是：取出貨單上的三欄，不再取帳務公司', () => {
    const sh = byId(newDraft(CONFIDENTIAL));
    expect(senderOf(sh, ORDER)).toEqual({
      brand_name: '晴禾選物',
      phone: '02-2755-0123',
      address: '台北市大安區復興南路一段 200 號 5 樓',
    });
    expect(describeShipmentSender(sh, ORDER)).toBe(
      '晴禾選物｜02-2755-0123｜台北市大安區復興南路一段 200 號 5 樓',
    );
    expect(describeShipmentSender(sh, ORDER)).not.toContain('感官');
  });

  it('已成立的單也一樣：保密代寄為是取三欄，為否取成立時記下的帳務公司', () => {
    const idYes = newDraft(CONFIDENTIAL);
    const idNo = newDraft();
    useQcShippingStore.getState().finalizeShipment(idYes, { details: DETAILS, ...HEADER, ...CONFIDENTIAL });
    useQcShippingStore.getState().finalizeShipment(idNo, { details: DETAILS, ...HEADER });
    expect(describeShipmentSender(byId(idYes), null)).toContain('晴禾選物');
    expect(describeShipmentSender(byId(idNo), null)).toContain('感官文化印刷');
  });
});

describe('12.39 三欄整理與必填', () => {
  it('取消勾選不保留修改值：三欄一律清空，回到帳務公司', () => {
    const next = normalizeSenderFields({ ...CONFIDENTIAL, confidential_sender: false });
    expect(next).toEqual({
      confidential_sender: false,
      sender_brand_name: null,
      sender_phone: null,
      sender_address: null,
    });
  });

  it('勾選時三欄去頭尾空白後存入', () => {
    expect(normalizeSenderFields({ ...CONFIDENTIAL, sender_brand_name: ' 晴禾選物 ' }).sender_brand_name).toBe(
      '晴禾選物',
    );
  });

  it('勾選時三欄必填，缺哪欄列哪欄；未勾選不檢核', () => {
    expect(missingSenderFields({ ...CONFIDENTIAL, sender_phone: '  ' }).map((m) => m.key)).toEqual([
      'sender_phone',
    ]);
    expect(
      missingSenderFields({ confidential_sender: true, sender_brand_name: '', sender_phone: '', sender_address: '' }),
    ).toHaveLength(3);
    expect(missingSenderFields({ confidential_sender: false })).toEqual([]);
    expect(missingSenderFields(CONFIDENTIAL)).toEqual([]);
  });

  it('建立出貨單時未勾選，即使帶了三欄也不存', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, {
      details: DETAILS,
      ...HEADER,
      ...CONFIDENTIAL,
      confidential_sender: false,
    });
    expect(byId(id)).toMatchObject({ confidential_sender: false, sender_brand_name: null });
  });
});

describe('12.39 mock 樣本', () => {
  it('鏈四草稿 SH-2026-0820 為保密代寄，其餘兩張為否', () => {
    const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);
    expect(byNo('SH-2026-0820')).toMatchObject({ confidential_sender: true, sender_brand_name: '晴禾選物' });
    expect(byNo('SH-2026-0601').confidential_sender).toBe(false);
    expect(byNo('SH-2026-0602').confidential_sender).toBe(false);
    expect(byNo('SH-2026-0820').status).toBe('草稿');
  });
});
