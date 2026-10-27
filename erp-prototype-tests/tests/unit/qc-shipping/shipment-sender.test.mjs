import { beforeEach, describe, expect, it } from 'vitest';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  describeShipmentSender,
  formatAddress,
  isValidZip,
  MOCK_SHIPMENTS,
  receiverAddressOf,
  SENDER_BY_ACCOUNT_COMPANY,
  senderOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  missingReceiverFields,
  missingSenderFields,
  normalizeSenderFields,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.39（保密代寄）的取值與整理驗算：預設否取帳務公司、勾選後取出貨單上的寄件資訊六欄、
// 取消勾選不保留改過的值、建立出貨單後寄件資訊凍在單上。依據：G30。
// 情境 12.57（收件與寄件地址四欄、郵遞區號 3 碼或 5 碼；寄件資訊為寄件人、電話＋地址四欄）：
// 對齊後端第一版（Miles 2026-10-27 拍板）。

const ORDER_NO = 'ORD-TEST-SENDER';
const ORDER = { order_no: ORDER_NO, account_company: 'SSP' };
const CONFIDENTIAL = {
  confidential_sender: true,
  sender_brand_name: '晴禾選物',
  sender_phone: '02-2755-0123',
  sender_zip: '106',
  sender_city: '台北市',
  sender_district: '大安區',
  sender_address: '復興南路一段 200 號 5 樓',
};
const SENDER_KEYS = ['sender_brand_name', 'sender_phone', 'sender_zip', 'sender_city', 'sender_district', 'sender_address'];
const DETAILS = [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty: 100 }];
const RECEIVER = {
  receiver_name: '周雅文',
  receiver_phone: '02-2790-6611',
  receiver_zip: '114',
  receiver_city: '台北市',
  receiver_district: '內湖區',
  receiver_address: '文德路 168 號 3 樓',
};
const HEADER = {
  planned_ship_date: '2026-09-20',
  method: '順豐',
  ...RECEIVER,
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
  it('保密代寄預設否：取帳務公司的寄件人（品牌名稱）、電話、地址四欄，單上六欄無值', () => {
    const sh = byId(newDraft());
    expect(sh.confidential_sender).toBe(false);
    expect(SENDER_KEYS.map((k) => sh[k])).toEqual(Array(6).fill(null));
    expect(senderOf(sh, ORDER)).toEqual(SENDER_BY_ACCOUNT_COMPANY.SSP);
    expect(describeShipmentSender(sh, ORDER)).toBe('感官文化印刷｜02 2736 6566｜235 新北市中和區建康路 168 號 3 樓');
  });

  it('保密代寄為是：取出貨單上的六欄，不再取帳務公司', () => {
    const sh = byId(newDraft(CONFIDENTIAL));
    expect(senderOf(sh, ORDER)).toEqual({
      brand_name: '晴禾選物',
      phone: '02-2755-0123',
      zip: '106',
      city: '台北市',
      district: '大安區',
      address: '復興南路一段 200 號 5 樓',
    });
    expect(describeShipmentSender(sh, ORDER)).toBe('晴禾選物｜02-2755-0123｜106 台北市大安區復興南路一段 200 號 5 樓');
    expect(describeShipmentSender(sh, ORDER)).not.toContain('感官');
  });

  it('已成立的單也一樣：保密代寄為是取六欄，為否取成立時記下的帳務公司', () => {
    const idYes = newDraft(CONFIDENTIAL);
    const idNo = newDraft();
    useQcShippingStore.getState().finalizeShipment(idYes, { details: DETAILS, ...HEADER, ...CONFIDENTIAL });
    useQcShippingStore.getState().finalizeShipment(idNo, { details: DETAILS, ...HEADER });
    expect(describeShipmentSender(byId(idYes), null)).toContain('晴禾選物');
    expect(describeShipmentSender(byId(idNo), null)).toContain('感官文化印刷');
  });
});

describe('12.39 六欄整理與必填', () => {
  it('取消勾選不保留修改值：六欄一律清空，回到帳務公司', () => {
    const next = normalizeSenderFields({ ...CONFIDENTIAL, confidential_sender: false });
    expect(next).toEqual({
      confidential_sender: false,
      ...Object.fromEntries(SENDER_KEYS.map((k) => [k, null])),
    });
  });

  it('勾選時六欄去頭尾空白後存入', () => {
    const next = normalizeSenderFields({ ...CONFIDENTIAL, sender_brand_name: ' 晴禾選物 ', sender_city: ' 台北市 ' });
    expect(next).toEqual({ ...CONFIDENTIAL });
  });

  it('勾選時寄件人、寄件電話、寄件郵遞區號、寄件縣市、寄件區、寄件地址六欄全部必填，缺哪欄列哪欄；未勾選不檢核', () => {
    expect(missingSenderFields({ ...CONFIDENTIAL, sender_phone: '  ' })).toEqual([
      { key: 'sender_phone', label: '寄件電話' },
    ]);
    const empty = Object.fromEntries(SENDER_KEYS.map((k) => [k, '']));
    expect(missingSenderFields({ confidential_sender: true, ...empty }).map((m) => m.label)).toEqual([
      '寄件人',
      '寄件電話',
      '寄件郵遞區號',
      '寄件縣市',
      '寄件區',
      '寄件地址',
    ]);
    expect(missingSenderFields({ ...CONFIDENTIAL, sender_zip: '' })).toEqual([
      { key: 'sender_zip', label: '寄件郵遞區號' },
    ]);
    expect(missingSenderFields({ confidential_sender: false })).toEqual([]);
    expect(missingSenderFields(CONFIDENTIAL)).toEqual([]);
  });

  it('建立出貨單時未勾選，即使帶了六欄也不存', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, {
      details: DETAILS,
      ...HEADER,
      ...CONFIDENTIAL,
      confidential_sender: false,
    });
    expect(byId(id)).toMatchObject({ confidential_sender: false, sender_brand_name: null, sender_zip: null, sender_address: null });
  });
});

describe('12.39 mock 樣本', () => {
  it('鏈四草稿（sh-0820，沒有出貨單編號）為保密代寄，SH-2026-06-18001 與 SH-2026-06-22001 為否', () => {
    const draft = MOCK_SHIPMENTS.find((sh) => sh.id === 'sh-0820');
    const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);
    expect(draft).toMatchObject({ shipment_no: null, status: '草稿', ...CONFIDENTIAL });
    expect(byNo('SH-2026-06-18001').confidential_sender).toBe(false);
    expect(byNo('SH-2026-06-22001').confidential_sender).toBe(false);
  });
});

// ── 12.57 地址四欄 ──

describe('12.57 收件與寄件地址四欄、郵遞區號 3 碼或 5 碼；寄件資訊為寄件人、電話＋地址四欄', () => {
  it('郵遞區號只收 3 碼或 5 碼數字', () => {
    expect(isValidZip('114')).toBe(true);
    expect(isValidZip('11468')).toBe(true);
    expect(isValidZip(' 114 ')).toBe(true);
    ['', '11', '1146', '114688', '11a', null].forEach((zip) => {
      expect(isValidZip(zip), String(zip)).toBe(false);
    });
  });

  it('收件必填欄依出貨方式：宅配地址四欄全部必填；超商不需要收件地址；自取、專車、其他只要收件地址欄；收件電話送出時都不必填', () => {
    const empty = { receiver_name: ' ', receiver_zip: '', receiver_city: '', receiver_district: '', receiver_address: '' };
    ['順豐', '新竹物流'].forEach((method) => {
      expect(missingReceiverFields({ ...RECEIVER, method, receiver_phone: '' }), method).toEqual([]);
      expect(missingReceiverFields({ ...empty, method }), method).toEqual([
        { key: 'receiver_name', label: '收件人' },
        { key: 'receiver_zip', label: '收件郵遞區號' },
        { key: 'receiver_city', label: '收件縣市' },
        { key: 'receiver_district', label: '收件區' },
        { key: 'receiver_address', label: '收件地址' },
      ]);
    });
    ['7-11 交貨便', '全家'].forEach((method) => {
      expect(missingReceiverFields({ ...empty, method }), method).toEqual([{ key: 'receiver_name', label: '收件人' }]);
    });
    ['自取', '專車配送', '其他', undefined].forEach((method) => {
      expect(missingReceiverFields({ ...empty, method }), String(method)).toEqual([
        { key: 'receiver_name', label: '收件人' },
        { key: 'receiver_address', label: '收件地址' },
      ]);
      expect(
        missingReceiverFields({ receiver_name: '周雅文', receiver_address: '台北市內湖區文德路 168 號 3 樓', method }),
        String(method),
      ).toEqual([]);
    });
  });

  it('郵遞區號有填時要 3 碼或 5 碼：收件與寄件都檢查格式', () => {
    expect(missingReceiverFields({ ...RECEIVER, method: '順豐', receiver_zip: '1146' })).toEqual([
      { key: 'receiver_zip_format', label: '收件郵遞區號（3 碼或 5 碼）' },
    ]);
    expect(missingSenderFields({ ...CONFIDENTIAL, sender_zip: '10' })).toEqual([
      { key: 'sender_zip_format', label: '寄件郵遞區號（3 碼或 5 碼）' },
    ]);
  });

  it('四欄合成一行顯示：郵遞區號空一格接縣市、區、地址；缺郵遞區號略過；全空為空值', () => {
    expect(formatAddress({ zip: '114', city: '台北市', district: '內湖區', address: '文德路 168 號 3 樓' })).toBe(
      '114 台北市內湖區文德路 168 號 3 樓',
    );
    expect(formatAddress({ zip: '', city: '台北市', district: '內湖區', address: '文德路 168 號 3 樓' })).toBe(
      '台北市內湖區文德路 168 號 3 樓',
    );
    expect(formatAddress({})).toBeNull();
    expect(receiverAddressOf(RECEIVER)).toBe('114 台北市內湖區文德路 168 號 3 樓');
  });

  it('建立出貨單時收件地址四欄存在單上', () => {
    const id = newDraft();
    useQcShippingStore.getState().finalizeShipment(id, { details: DETAILS, ...HEADER });
    expect(byId(id)).toMatchObject({
      receiver_zip: '114',
      receiver_city: '台北市',
      receiver_district: '內湖區',
      receiver_address: '文德路 168 號 3 樓',
      receiver_phone: '02-2790-6611',
    });
    expect('receiver_mobile' in byId(id)).toBe(false);
  });

  it('帳務公司的寄件資訊也是寄件人、電話＋地址四欄', () => {
    Object.values(SENDER_BY_ACCOUNT_COMPANY).forEach((s) => {
      expect(Object.keys(s).sort()).toEqual(['address', 'brand_name', 'city', 'district', 'phone', 'zip'].sort());
      expect(isValidZip(s.zip)).toBe(true);
    });
  });
});
