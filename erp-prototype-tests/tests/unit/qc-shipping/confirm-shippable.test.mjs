import { describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  nextStatusOptions,
  SHIPMENT_LEVEL_KEY as S,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import {
  canEditShipmentDetails,
  confirmShippableCheck,
  packingCorrectionScope,
  PICKING_MISMATCH_HINT,
  RECEIVER_MOBILE_REQUIRED_HINT,
  RECEIVER_PHONE_REQUIRED_HINT,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  DETAILS_LOCKED_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { boxedShipment, undispatched, packedShipment } from './_fixtures.mjs';

// 情境 12.46 確認可出貨、12.48 確認可出貨的併發、12.56 確認可出貨時依出貨方式檢查收件電話。
// 期望值取自出貨對齊後端第一版決定表（Miles 2026-10-27 拍板）：確認可出貨時產生物流單、出貨單轉已確認；
// 揀貨不符或收件電話不符出貨方式的要求時擋下；確認後裝箱資料與數量都不能改。
// Prototype 沒有真正的併發，「先寫入者」以先呼叫的那一支模擬。

const NO = 'PI-TEST-CONF';
const NAME = '確認樣本';
const ORDER_NO = 'ORD-TEST-CONF';

const seed = (shipments, { passed = 500 } = {}) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-conf',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: '出貨中',
        activities: [],
        print_items: [
          { print_item_no: NO, name: NAME, type: '大貨印件', ordered_qty: passed, print_item_status: '出貨中' },
        ],
      },
    ],
  });
  useQcShippingStore.setState({ shipments, downloadFiles: [] });
};

const store = () => useQcShippingStore.getState();
const get = (id = 'a') => store().shipments.find((x) => x.id === id);
const ownNos = (id = 'a') => get(id).logistics_orders.map((l) => l.own_order_no);
const boxed = (overrides) =>
  boxedShipment({ id: 'a', shipmentNo: 'SH-TEST-A', orderNo: ORDER_NO, printItemNo: NO, name: NAME, ...overrides });
const packed = (overrides) =>
  packedShipment({ id: 'a', shipmentNo: 'SH-TEST-A', orderNo: ORDER_NO, printItemNo: NO, name: NAME, ...overrides });
const keepBoxes = (sh) =>
  sh.packing_boxes.map(({ box_no, box_spec, length, width, height, photos, note }) => ({
    box_no,
    box_spec,
    length,
    width,
    height,
    photos,
    note,
  }));
const newBox = () => ({ box_spec: '1 號箱', photos: [{ name: '新箱照.jpg', url: null }], note: '' });
const pickerKeys = (shipment) => nextStatusOptions({ role: 'picker', shipment }).map((o) => o.key);
const confirmOption = (shipment) =>
  nextStatusOptions({ role: 'picker', shipment }).find((o) => o.key === S.CONFIRM_SHIPPABLE);

// ── 12.46 確認可出貨 ──

describe('12.46 確認可出貨：揀貨相符且收件電話符合出貨方式時產生物流單，否則擋下，之後數量與裝箱資料鎖住', () => {
  it('揀貨相符時確認可出貨並產生物流單：順豐 495、5 箱 → 出貨單已確認，一筆物流單（我方自編單號 -01，拋單狀態未拋單、貨態待出貨），5 箱皆屬它；歷程記一筆「確認可出貨」帶 -01', () => {
    seed([boxed({ method: '順豐', qty: 495, boxCount: 5 })]);
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(true);
    expect(r.logisticsIds).toEqual(['a-lg-1']);
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(get().logistics_orders).toHaveLength(1);
    expect(get().logistics_orders[0]).toMatchObject({
      id: 'a-lg-1',
      own_order_no: 'SH-TEST-A-01',
      tracking_no: null,
      dispatch_status: '未拋單',
      cargo_status: '待出貨',
    });
    expect(get().packing_boxes.map((b) => b.logistics_id)).toEqual(Array(5).fill('a-lg-1'));
    const last = get().history.at(-1);
    expect(last.category).toBe('確認可出貨');
    expect(last.actor).toBe('范姜宏');
    expect(last.at).toBeTruthy();
    expect(last.changes).toContainEqual({ field: '物流單（我方自編單號）', before: null, after: 'SH-TEST-A-01' });
  });

  it('確認可出貨只給揀貨人員：已裝箱時揀貨人員有，接單業務與出貨人員沒有', () => {
    const shipment = boxed({ method: '順豐', qty: 495, boxCount: 5 });
    expect(pickerKeys(shipment)).toContain(S.CONFIRM_SHIPPABLE);
    expect(nextStatusOptions({ role: 'sales', shipment, canVoid: true }).map((o) => o.key)).not.toContain(
      S.CONFIRM_SHIPPABLE,
    );
    expect(nextStatusOptions({ role: 'shipper', shipment }).map((o) => o.key)).not.toContain(S.CONFIRM_SHIPPABLE);
  });

  it('揀貨不符時擋下確認可出貨：全家 100／揀貨 80、3 箱 → 提示揀貨數量與出貨明細不符、維持已裝箱、沒有物流單；業務改明細為 80 後成立並產生三筆物流單', () => {
    seed([boxed({ method: '全家', qty: 100, picked: 80, boxCount: 3 })]);
    expect(confirmShippableCheck(get())).toMatchObject({ allowed: false });
    expect(PICKING_MISMATCH_HINT).toContain('揀貨數量與出貨明細不符');
    const blocked = store().confirmShippable('a', { operator: '范姜宏' });
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain('揀貨數量與出貨明細不符');
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(get().logistics_orders).toEqual([]);
    expect(get().packing_boxes.every((b) => b.logistics_id === null)).toBe(true);

    const edited = store().updateShipmentDetails('a', [{ print_item_no: NO, name: NAME, qty: 80 }], { operator: '洪嘉駿' });
    expect(edited.ok).toBe(true);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(ownNos()).toEqual(['SH-TEST-A-01', 'SH-TEST-A-02', 'SH-TEST-A-03']);
    expect(get().logistics_orders.every((l) => l.cargo_status === '待出貨' && l.dispatch_status === '未拋單')).toBe(true);
  });

  it('揀貨不符時確認可出貨仍渲染、但停用並帶理由（資料條件不符）；相符時做完狀態為已確認', () => {
    const option = confirmOption(boxed({ qty: 100, picked: 80 }));
    expect(option).toBeTruthy();
    expect(option.disabledReason).toContain('揀貨數量與出貨明細不符');
    const ok = confirmOption(boxed({ qty: 100 }));
    expect(ok.status).toBe('已確認');
    expect(ok.label).toBe('已確認（確認可出貨）');
    expect(ok.disabledReason ?? null).toBeNull();
  });

  it('揀貨不符時停在已裝箱、沒有物流單：專車 200／揀貨 180 繞過介面確認被擋下；揀貨人員修正為 200 後確認成立，專車物流單沒有拋單狀態，出貨確認後出貨單轉已出貨', () => {
    seed([boxed({ method: '專車配送', qty: 200, picked: 180, boxCount: 2 })]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(get().logistics_orders).toEqual([]);
    const fixed = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 200 }],
      boxes: keepBoxes(get()),
      reason: '重新清點',
      operator: '范姜宏',
    });
    expect(fixed.ok).toBe(true);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(get().logistics_orders.every((l) => l.dispatch_status === null)).toBe(true);
    for (const l of get().logistics_orders) {
      expect(store().dispatchLogistics('a', l.id, { operator: '曾志偉' }).ok).toBe(true);
    }
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });

  it('只有已裝箱的出貨單可以確認可出貨：未處理、打包中與已確認者繞過介面送出都擋下、不產生物流單', () => {
    const early = (status) => ({ ...boxed({}), status, packing_boxes: [], details: [{ print_item_no: NO, name: NAME, qty: 100, picked_qty: null }] });
    seed([early('未處理')]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    seed([early('打包中')]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    seed([packed({ method: '順豐', logisticsOrders: [undispatched('SH-TEST-A-01')] })]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    expect(ownNos()).toEqual(['SH-TEST-A-01']);
  });

  it('確認可出貨後數量與裝箱資料鎖住：新竹 300、3 箱 3 筆物流單 → 不能改出貨明細數量；裝箱回報修正全關；繞過介面改揀貨數量 290、只改箱規或新增一箱都擋下、什麼都不變', () => {
    seed([
      packed({
        method: '新竹物流',
        qty: 300,
        logisticsOrders: ['01', '02', '03'].map((n) => undispatched(`SH-TEST-A-${n}`)),
      }),
    ]);
    expect(canEditShipmentDetails(get())).toBe(false);
    expect(packingCorrectionScope(get())).toEqual({
      pickedQty: false,
      deleteBox: false,
      addBox: false,
      editableBoxNos: [],
    });
    expect(pickerKeys(get())).toEqual([]);
    const before = JSON.stringify(get());
    const qty = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 290 }],
      boxes: keepBoxes(get()),
      reason: '想改數量',
      operator: '范姜宏',
    });
    expect(qty.ok).toBe(false);
    const spec = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 300 }],
      boxes: keepBoxes(get()).map((b) => ({ ...b, box_spec: 'F13 箱', length: 29, width: 21, height: 6 })),
      reason: '想換小箱',
      operator: '范姜宏',
    });
    expect(spec.ok).toBe(false);
    const add = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 300 }],
      boxes: [...keepBoxes(get()), newBox()],
      reason: '想多一箱',
      operator: '范姜宏',
    });
    expect(add.ok).toBe(false);
    const detail = store().updateShipmentDetails('a', [{ print_item_no: NO, name: NAME, qty: 290 }], { operator: '洪嘉駿' });
    expect(detail.ok).toBe(false);
    expect(detail.error).toBe(DETAILS_LOCKED_HINT);
    expect(JSON.stringify(get())).toBe(before);
  });

  it('確認可出貨前（未處理、打包中、已裝箱）可以改出貨明細數量', () => {
    expect(canEditShipmentDetails(boxed({}))).toBe(true);
    expect(canEditShipmentDetails({ ...boxed({}), status: '未處理' })).toBe(true);
    expect(canEditShipmentDetails({ ...boxed({}), status: '打包中' })).toBe(true);
  });
});

// ── 12.56 確認可出貨時依出貨方式檢查收件電話 ──

describe('12.56 確認可出貨時依出貨方式檢查收件電話（只有一欄）：超商必須是手機，宅配必填（手機或市話皆可），自取、專車、其他不檢查', () => {
  const withPhone = (method, phone = '') => boxed({ method, receiver_phone: phone });

  it.each(['7-11 交貨便', '全家'])('%s 收件電話是市話或空白時擋下：理由為超商的收件電話必須是手機、維持已裝箱、沒有物流單、不寫歷程', (method) => {
    seed([withPhone(method, '02-2345-6789')]);
    expect(confirmShippableCheck(get())).toEqual({ allowed: false, reason: RECEIVER_MOBILE_REQUIRED_HINT });
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(RECEIVER_MOBILE_REQUIRED_HINT);
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(get().logistics_orders).toEqual([]);
    expect(get().history).toEqual([]);
    expect(confirmShippableCheck(withPhone(method, '')).reason).toBe(RECEIVER_MOBILE_REQUIRED_HINT);
  });

  it.each([
    ['7-11 交貨便', '0935-553-228'],
    ['全家', '0935553228'],
  ])('%s 收件電話是手機（09 開頭共 10 碼，允許連字號）時通過：%s', (method, phone) => {
    seed([withPhone(method, phone)]);
    expect(confirmShippableCheck(get())).toEqual({ allowed: true, reason: null });
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('已確認');
  });

  it.each(['0935-553-22', '0835-553-228', '0935-553-2288', '   '])('超商的收件電話不是 09 開頭共 10 碼時擋下：%s', (phone) => {
    expect(confirmShippableCheck(withPhone('7-11 交貨便', phone)).reason).toBe(RECEIVER_MOBILE_REQUIRED_HINT);
  });

  it.each(['順豐', '新竹物流'])('%s 收件電話空白時擋下：理由為宅配必須有收件電話、沒有物流單', (method) => {
    seed([withPhone(method)]);
    expect(confirmShippableCheck(get())).toEqual({ allowed: false, reason: RECEIVER_PHONE_REQUIRED_HINT });
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(RECEIVER_PHONE_REQUIRED_HINT);
    expect(get().logistics_orders).toEqual([]);
    expect(confirmShippableCheck(withPhone(method, '   ')).reason).toBe(RECEIVER_PHONE_REQUIRED_HINT);
  });

  it.each([
    ['順豐', '0912-345-678'],
    ['順豐', '02-2345-6789'],
    ['新竹物流', '0912-345-678'],
    ['新竹物流', '02-2345-6789'],
  ])('%s 收件電話有填即通過，手機或市話皆可（%s）', (method, phone) => {
    expect(confirmShippableCheck(withPhone(method, phone))).toEqual({ allowed: true, reason: null });
  });

  it.each(['自取', '專車配送', '其他'])('%s 收件電話空白也不擋', (method) => {
    seed([withPhone(method)]);
    expect(confirmShippableCheck(get())).toEqual({ allowed: true, reason: null });
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
  });

  it('收件電話不符時確認可出貨仍渲染、但停用並帶理由；揀貨不符優先回報揀貨不符', () => {
    expect(confirmOption(withPhone('7-11 交貨便')).disabledReason).toBe(RECEIVER_MOBILE_REQUIRED_HINT);
    expect(confirmOption(withPhone('全家', '02-2345-6789')).disabledReason).toBe(RECEIVER_MOBILE_REQUIRED_HINT);
    expect(confirmOption(withPhone('順豐')).disabledReason).toBe(RECEIVER_PHONE_REQUIRED_HINT);
    expect(confirmOption(withPhone('新竹物流', '02-2345-6789')).disabledReason ?? null).toBeNull();
    expect(confirmOption({ ...withPhone('7-11 交貨便'), details: [{ print_item_no: NO, name: NAME, qty: 100, picked_qty: 80 }] }).disabledReason).toBe(
      PICKING_MISMATCH_HINT,
    );
  });

  it('收件電話改成手機後確認可出貨即成立：7-11 交貨便填市話被擋，改成手機後再確認產生物流單', () => {
    seed([withPhone('7-11 交貨便', '02-2345-6789')]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    useQcShippingStore.setState((s) => ({
      shipments: s.shipments.map((x) => (x.id === 'a' ? { ...x, receiver_phone: '0935-553-228' } : x)),
    }));
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(ownNos()).toEqual(['SH-TEST-A-01']);
  });
});

// ── 12.48 確認可出貨的併發 ──

describe('12.48 併發：後到者以寫入當下的資料重新檢核', () => {
  it('明細改動先寫入後，確認可出貨以當下判定重新檢核：業務先把 100 改為 80，揀貨人員隨後送出確認 → 擋下、維持已裝箱、沒有物流單', () => {
    seed([boxed({ method: '新竹物流', qty: 100, boxCount: 2 })]);
    expect(store().updateShipmentDetails('a', [{ print_item_no: NO, name: NAME, qty: 80 }], { operator: '洪嘉駿' }).ok).toBe(true);
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('揀貨數量與出貨明細不符');
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(get().logistics_orders).toEqual([]);
  });

  it('確認可出貨先寫入後，業務改明細數量以當下判定擋下：告知已確認可出貨、明細不變', () => {
    seed([boxed({ method: '新竹物流', qty: 100, boxCount: 2 })]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    const before = JSON.stringify(get().details);
    const r = store().updateShipmentDetails('a', [{ print_item_no: NO, name: NAME, qty: 80 }], { operator: '洪嘉駿' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(DETAILS_LOCKED_HINT);
    expect(JSON.stringify(get().details)).toBe(before);
  });

  it('確認可出貨先寫入後，裝箱回報修正以當下判定擋下：揀貨人員兩人同時開著已裝箱的單，一人先確認，另一人送出修正 → 擋下、裝箱資料與物流單不變', () => {
    seed([boxed({ method: '新竹物流', qty: 100, boxCount: 2 })]);
    const stale = keepBoxes(get());
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    const boxesBefore = JSON.stringify(get().packing_boxes);
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: stale.map((b) => ({ ...b, box_spec: 'F13 箱', length: 29, width: 21, height: 6 })),
      reason: '兩箱都換小箱',
      operator: '江俊賢',
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('已裝箱');
    expect(JSON.stringify(get().packing_boxes)).toBe(boxesBefore);
    expect(ownNos()).toEqual(['SH-TEST-A-01', 'SH-TEST-A-02']);
    expect(get().packing_corrections).toEqual([]);
  });

  it('裝箱回報修正先寫入後，確認可出貨以修正後的內容產生物流單：新竹 2 箱修正為 3 箱後確認 → 三筆物流單、3 箱各屬一筆', () => {
    seed([boxed({ method: '新竹物流', qty: 100, boxCount: 2 })]);
    expect(
      store().correctPacking('a', {
        lines: [{ print_item_no: NO, picked_qty: 100 }],
        boxes: [...keepBoxes(get()), newBox()],
        reason: '多裝一箱',
        operator: '江俊賢',
      }).ok,
    ).toBe(true);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(ownNos()).toEqual(['SH-TEST-A-01', 'SH-TEST-A-02', 'SH-TEST-A-03']);
    expect(get().packing_boxes.map((b) => b.logistics_id)).toEqual(['a-lg-1', 'a-lg-2', 'a-lg-3']);
  });
});
