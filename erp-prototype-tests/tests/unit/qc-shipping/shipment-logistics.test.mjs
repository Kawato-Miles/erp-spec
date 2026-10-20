import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { shipmentActualShipDate } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import {
  hasDispatchActionDone,
  isBeforeDispatchAction,
  isFullyDeparted,
  isPartiallyDeparted,
  lastLogisticsFillOf,
  occupiedQtyOf,
  shipmentStatusOf,
  splitIntoLogistics,
  validateUndelivered,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import { boxSpecOptionsOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { PICKING_MISMATCH_HINT } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  calcShippableQty,
  calcShippedQty,
  ORDER_CANCELLED_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { box, departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.32 至 12.38（出貨單裝箱資料與物流單拆分，設計 2026-10-20 § 六至 § 八）的規則驗算：
// 拆單規則、出貨單狀態取最落後、例外使出貨單轉異常並可重新同步恢復、出貨動作與失敗重試、
// 作廢物流單回補（含最後一筆預填、不重複回補）、自取部分交付、訂單取消連鎖、三個集合詞互斥。
// 畫面呈現在 tests/e2e/12-shipping/shipping.spec.mjs。

const NO = 'PI-TEST-LOG';
const NAME = '物流樣本';
const ORDER_NO = 'ORD-TEST-LOG';
const qcRecords = [{ print_item_no: NO, passed_qty: 100, failed_qty: 0 }];
const printItem = { print_item_no: NO };

const seed = (shipments, { orderStatus = '出貨中', orderedQty = 100 } = {}) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-log',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: orderStatus,
        activities: [],
        print_items: [
          {
            print_item_no: NO,
            name: NAME,
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

const sh = (overrides) =>
  packedShipment({ id: 'a', shipmentNo: 'SH-TEST-A', orderNo: ORDER_NO, printItemNo: NO, name: NAME, ...overrides });
const get = (id = 'a') => useQcShippingStore.getState().shipments.find((x) => x.id === id);
const los = (id = 'a') => get(id).logistics_orders;
const lo = (no, id = 'a') => los(id).find((l) => l.logistics_order_no === no);
const store = () => useQcShippingStore.getState();
const all = () => useQcShippingStore.getState().shipments;
const spec = (method) => boxSpecOptionsOf(method)[0];

// ── 12.32 拆單規則 ──

describe('12.32 拆單規則：支援子母單合成一筆、否則一箱一筆', () => {
  const boxes = (n, method) =>
    Array.from({ length: n }, (_, i) => box(String(i + 1).padStart(3, '0'), null, { box_spec: spec(method) }));

  it('順豐 6 箱：一筆物流單、六箱共用', () => {
    const r = splitIntoLogistics({ shipmentNo: 'SH-1', method: '順豐', boxes: boxes(6, '順豐') });
    expect(r.logistics).toHaveLength(1);
    expect(r.logistics[0].logistics_order_no).toBe('SH-1-001');
    expect(new Set(r.boxes.map((b) => b.logistics_order_no))).toEqual(new Set(['SH-1-001']));
  });

  it('7-11 交貨便 3 箱：三筆物流單，編號依序、各自一箱', () => {
    const r = splitIntoLogistics({ shipmentNo: 'SH-1', method: '7-11 交貨便', boxes: boxes(3, '7-11 交貨便') });
    expect(r.logistics.map((l) => l.logistics_order_no)).toEqual(['SH-1-001', 'SH-1-002', 'SH-1-003']);
    expect(r.boxes.map((b) => b.logistics_order_no)).toEqual(['SH-1-001', 'SH-1-002', 'SH-1-003']);
    expect(r.lastSeq).toBe(3);
  });

  it('新竹物流、全家同樣一箱一筆；自取、專車配送、其他同樣合成一筆', () => {
    ['新竹物流', '全家'].forEach((m) => {
      expect(splitIntoLogistics({ shipmentNo: 'SH-1', method: m, boxes: boxes(2, m) }).logistics, m).toHaveLength(2);
    });
    ['自取', '專車配送', '其他'].forEach((m) => {
      expect(splitIntoLogistics({ shipmentNo: 'SH-1', method: m, boxes: boxes(2, m) }).logistics, m).toHaveLength(1);
    });
  });

  it('序號從 startSeq 之後接續，不重用', () => {
    const r = splitIntoLogistics({ shipmentNo: 'SH-1', method: '全家', boxes: boxes(2, '全家'), startSeq: 4 });
    expect(r.logistics.map((l) => l.logistics_order_no)).toEqual(['SH-1-005', 'SH-1-006']);
  });
});

// ── 12.33 出貨單狀態取最落後、異常優先 ──

describe('12.33 出貨單已裝箱之後的狀態由物流單計算：取最落後、任一在例外即異常', () => {
  const status = (...states) =>
    shipmentStatusOf(sh({ method: '7-11 交貨便', logisticsOrders: states.map((s, i) => departed(`L-${i}`, s)) }));

  it('取最落後的那一筆：已裝箱 → 等待出貨 → 已出貨（可自取）→ 運送中 → 已送達', () => {
    expect(status('等待出貨', '運送中')).toBe('等待出貨');
    expect(status('已出貨', '運送中', '已送達')).toBe('已出貨');
    expect(status('運送中', '已送達')).toBe('運送中');
    expect(status('可自取', '已自取')).toBe('已出貨');
    expect(
      shipmentStatusOf(sh({ logisticsOrders: [logistics('L-0', '已裝箱'), departed('L-1', '運送中')] })),
    ).toBe('已裝箱');
  });

  it('全部已送達或已自取才算已送達', () => {
    expect(status('已送達', '已送達')).toBe('已送達');
    expect(status('已送達', '已自取')).toBe('已送達');
  });

  it('任一未作廢物流單在例外即異常，優先於已裝箱到已送達的所有結果', () => {
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((e) => {
      expect(status('已送達', e), e).toBe('異常');
      expect(status('等待出貨', e), e).toBe('異常');
    });
    expect(
      shipmentStatusOf(sh({ logisticsOrders: [logistics('L-0', '已裝箱'), departed('L-1', '例外事故')] })),
    ).toBe('異常');
  });

  it('已作廢的物流單不參與計算；全部作廢則出貨單已作廢', () => {
    expect(status('已作廢', '運送中')).toBe('運送中');
    expect(status('已作廢', '例外事故')).toBe('異常');
    expect(status('已作廢', '已作廢')).toBe('已作廢');
    expect(status('已作廢', '已送達')).toBe('已送達');
  });

  it('草稿、未處理、打包中取單上記的值', () => {
    ['草稿', '未處理', '打包中'].forEach((s) =>
      expect(shipmentStatusOf({ status: s, logistics_orders: [] })).toBe(s),
    );
  });
});

// ── 12.34 出貨動作（批次）、失敗與單筆重試 ──

describe('12.36 出貨動作：第三方拋單、專車與其他出貨確認、自取標記可自取', () => {
  beforeEach(() => seed([]));

  const packed = (method, n = 2, extraBoxSpec) =>
    sh({
      method,
      logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱')],
      boxes: Array.from({ length: n }, (_, i) =>
        box(String(i + 1).padStart(3, '0'), 'SH-TEST-A-001', { box_spec: extraBoxSpec ?? spec(method) }),
      ),
    });

  it('順豐拋單：物流單號、檔案、每箱子單號由系統回傳，物流單轉等待出貨並寫離廠時間，出貨單同為等待出貨', () => {
    seed([packed('順豐', 3)]);
    const r = store().dispatchShipment('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results.map((x) => x.ok)).toEqual([true]);
    const l = lo('SH-TEST-A-001');
    expect(l.status).toBe('等待出貨');
    expect(l.tracking_no).toMatch(/^SF\d{9}$/);
    expect(l.label_file).toContain(l.tracking_no);
    expect(l.left_at).toBeTruthy();
    expect(l.left_by).toBe('曾志偉');
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual([
      `${l.tracking_no}001`,
      `${l.tracking_no}002`,
      `${l.tracking_no}003`,
    ]);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(isFullyDeparted(get())).toBe(true);
    expect(shipmentActualShipDate(get())).toBe(l.left_at.slice(0, 10));
  });

  it('不支援子母單的第三方（7-11 交貨便）：批次拋單，每筆物流單各自一個物流單號、沒有子單號', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱'), logistics('SH-TEST-A-002', '已裝箱')],
        boxes: [
          box('001', 'SH-TEST-A-001', { box_spec: spec('7-11 交貨便') }),
          box('002', 'SH-TEST-A-002', { box_spec: spec('7-11 交貨便') }),
        ],
      }),
    ]);
    store().dispatchShipment('a', { operator: '曾志偉' });
    const nos = los().map((l) => l.tracking_no);
    expect(nos.every((n) => /^PYU-\d{9}$/.test(n))).toBe(true);
    expect(new Set(nos).size).toBe(2);
    expect(get().packing_boxes.every((b) => b.sub_tracking_no === null)).toBe(true);
  });

  it('專車與其他出貨確認：物流單轉已出貨、沒有物流單號與檔案；自取標記可自取：物流單轉可自取', () => {
    ['專車配送', '其他'].forEach((m) => {
      seed([packed(m)]);
      store().dispatchShipment('a', { operator: '曾志偉' });
      expect(lo('SH-TEST-A-001').status, m).toBe('已出貨');
      expect(lo('SH-TEST-A-001').tracking_no, m).toBeNull();
      expect(lo('SH-TEST-A-001').left_at, m).toBeTruthy();
      expect(shipmentStatusOf(get()), m).toBe('已出貨');
    });
    seed([packed('自取')]);
    store().dispatchShipment('a', { operator: '曾志偉' });
    expect(lo('SH-TEST-A-001').status).toBe('可自取');
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });

  it('部分失敗：失敗的物流單留在已裝箱並寫失敗原因，其餘照常送出；出貨單仍是已裝箱（取最落後）、部分離廠', () => {
    const failing = '7-11 材積 L（示意：拋單失敗）';
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱'), logistics('SH-TEST-A-002', '已裝箱')],
        boxes: [
          box('001', 'SH-TEST-A-001', { box_spec: spec('7-11 交貨便') }),
          box('002', 'SH-TEST-A-002', { box_spec: failing }),
        ],
      }),
    ]);
    const r = store().dispatchShipment('a', { operator: '曾志偉' });
    expect(r.results.map((x) => x.ok)).toEqual([true, false]);
    expect(lo('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-002').status).toBe('已裝箱');
    expect(lo('SH-TEST-A-002').dispatch_error).toBeTruthy();
    expect(lo('SH-TEST-A-002').left_at).toBeNull();
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(isPartiallyDeparted(get())).toBe(true);
    expect(isFullyDeparted(get())).toBe(false);
    expect(shipmentActualShipDate(get())).toBeNull();
    // 裝箱資料已鎖住（含部分失敗）
    expect(
      store().correctPacking('a', {
        lines: [{ print_item_no: NO, picked_qty: 100 }],
        boxes: get().packing_boxes.map((b) => ({ ...b })),
        reason: '想改',
        operator: '范姜宏',
      }).ok,
    ).toBe(false);
  });

  it('單筆重試：只送失敗的那筆，成功後寫離廠時間、清失敗原因；批次動作不重送已離廠的', () => {
    const failing = '7-11 材積 L（示意：拋單失敗）';
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱'), logistics('SH-TEST-A-002', '已裝箱')],
        boxes: [
          box('001', 'SH-TEST-A-001', { box_spec: spec('7-11 交貨便') }),
          box('002', 'SH-TEST-A-002', { box_spec: failing }),
        ],
      }),
    ]);
    store().dispatchShipment('a', { operator: '曾志偉' });
    const firstTracking = lo('SH-TEST-A-001').tracking_no;
    const r = store().retryDispatch('a', 'SH-TEST-A-002', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results[0].ok).toBe(true);
    expect(lo('SH-TEST-A-002').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-002').dispatch_error).toBeNull();
    expect(lo('SH-TEST-A-002').left_at).toBeTruthy();
    expect(lo('SH-TEST-A-001').tracking_no).toBe(firstTracking);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(isFullyDeparted(get())).toBe(true);
    // 已全部離廠，沒有可重試也沒有可批次送出的
    expect(store().retryDispatch('a', 'SH-TEST-A-002', { operator: '曾志偉' }).ok).toBe(false);
    expect(store().dispatchShipment('a', { operator: '曾志偉' }).ok).toBe(false);
  });

  it('揀貨不符時出貨動作與重試都被擋下，單與歷程不變', () => {
    const base = packed('順豐');
    seed([{ ...base, details: [{ ...base.details[0], picked_qty: 80 }] }]);
    const r = store().dispatchShipment('a', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(PICKING_MISMATCH_HINT);
    expect(lo('SH-TEST-A-001').status).toBe('已裝箱');
    expect(hasDispatchActionDone(get())).toBe(false);
  });

  it('所屬訂單已取消時出貨動作與重試都被擋下', () => {
    seed([packed('順豐')], { orderStatus: '已取消' });
    const r = store().dispatchShipment('a', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(ORDER_CANCELLED_HINT);
    expect(lo('SH-TEST-A-001').status).toBe('已裝箱');
  });
});

// ── 12.35 例外與重新同步 ──

describe('12.33 物流單例外使出貨單異常；重新同步依序推進、例外回到已出貨', () => {
  const thirdParty = (status, extra = {}) =>
    sh({ method: '順豐', logisticsOrders: [departed('SH-TEST-A-001', status, { tracking_no: 'SF1', ...extra })] });

  it('重新同步依序推進：等待出貨 → 已出貨 → 運送中 → 已送達（物流商回傳），已送達後出貨單轉已送達並寫入送達數量', () => {
    seed([thirdParty('等待出貨')]);
    const walk = [];
    for (let i = 0; i < 3; i += 1) {
      expect(store().syncLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
      walk.push(lo('SH-TEST-A-001').status);
    }
    expect(walk).toEqual(['已出貨', '運送中', '已送達']);
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(100);
    expect(lo('SH-TEST-A-001').delivered_by).toBe('物流商回傳');
    expect(store().syncLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
  });

  it('只有第三方（有外部物流單號）且非終態才可重新同步', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [departed('SH-TEST-A-001', '已出貨')] })]);
    expect(store().syncLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
    seed([thirdParty('已裝箱')]);
    expect(store().syncLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
  });

  it('任一物流單例外時出貨單異常；重新同步後例外回到已出貨，出貨單恢復依物流單計算', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          departed('SH-TEST-A-001', '運送中', { tracking_no: 'P1' }),
          departed('SH-TEST-A-002', '運送中', { tracking_no: 'P2' }),
        ],
      }),
    ]);
    store().markLogisticsException('a', 'SH-TEST-A-002', { kind: '無追蹤中包裹', reason: '查無追蹤', operator: '曾志偉' });
    expect(shipmentStatusOf(get())).toBe('異常');
    store().syncLogistics('a', 'SH-TEST-A-002', { operator: '曾志偉' });
    expect(lo('SH-TEST-A-002').status).toBe('已出貨');
    expect(lo('SH-TEST-A-002').exception_reason).toBeNull();
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });
});

// ── 12.36 至 12.38 作廢物流單回補 ──

describe('12.34 作廢物流單：逐印件未送達數量回補額度、最後一筆預填並使出貨單已作廢、不重複回補', () => {
  // 明細 100，3 筆物流單（設計 § 守恆段的雙向驗算例）
  const three = () =>
    sh({
      method: '7-11 交貨便',
      logisticsOrders: [
        departed('SH-TEST-A-001', '例外事故', { exception_source: 'manual' }),
        departed('SH-TEST-A-002', '例外事故', { exception_source: 'manual' }),
        departed('SH-TEST-A-003', '例外事故', { exception_source: 'manual' }),
      ],
    });
  const occupied = () => occupiedQtyOf(get(), NO);
  const quota = () => calcShippableQty(printItem, all(), qcRecords);

  beforeEach(() => seed([three()]));

  it('步驟 1：建立出貨單，佔用 100、額度 0', () => {
    expect(occupied()).toBe(100);
    expect(quota()).toBe(0);
  });

  it('步驟 2、3：作廢 A 未送達 30、作廢 B 未送達 40，佔用依序 70、30，額度依序回補 30、70', () => {
    const a = store().voidLogistics('a', 'SH-TEST-A-001', {
      reason: '一箱遺失',
      undelivered: { [NO]: 30 },
      operator: '洪嘉駿',
    });
    expect(a.ok).toBe(true);
    expect(occupied()).toBe(70);
    expect(quota()).toBe(30);
    store().voidLogistics('a', 'SH-TEST-A-002', { reason: '一箱遺失', undelivered: { [NO]: 40 }, operator: '洪嘉駿' });
    expect(occupied()).toBe(30);
    expect(quota()).toBe(70);
    expect(shipmentStatusOf(get())).toBe('異常');
  });

  it('非最後一筆預設 0：不填未送達數量也可作廢，不回補', () => {
    store().voidLogistics('a', 'SH-TEST-A-001', { reason: '貨已退回', operator: '洪嘉駿' });
    expect(lo('SH-TEST-A-001').status).toBe('已作廢');
    expect(lo('SH-TEST-A-001').undelivered).toEqual([]);
    expect(quota()).toBe(0);
  });

  it('步驟 4：作廢最後一筆 C，系統預填 100 − 70 ＝ 30、不可改，出貨單轉已作廢，佔用歸 0、額度共回補 100，沒有重複回補', () => {
    store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', undelivered: { [NO]: 30 }, operator: '洪嘉駿' });
    store().voidLogistics('a', 'SH-TEST-A-002', { reason: '遺失', undelivered: { [NO]: 40 }, operator: '洪嘉駿' });
    expect(lastLogisticsFillOf(get(), 'SH-TEST-A-003')).toEqual({ [NO]: 30 });
    // 使用者想填別的值也不採用：系統預填優先
    const last = store().voidLogistics('a', 'SH-TEST-A-003', {
      reason: '遺失',
      undelivered: { [NO]: 5 },
      operator: '洪嘉駿',
    });
    expect(last.ok).toBe(true);
    expect(lo('SH-TEST-A-003').undelivered).toEqual([{ print_item_no: NO, qty: 30 }]);
    expect(shipmentStatusOf(get())).toBe('已作廢');
    expect(get().status).toBe('已作廢');
    expect(get().void_reason).toBeTruthy();
    expect(occupied()).toBe(0);
    expect(quota()).toBe(100);
  });

  it('理由必填；未送達數量上限＝明細數量（同一印件合計）；狀態不開放時不能作廢', () => {
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '  ', operator: '洪嘉駿' }).ok).toBe(false);
    const over = store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', undelivered: { [NO]: 101 }, operator: '洪嘉駿' });
    expect(over.ok).toBe(false);
    store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', undelivered: { [NO]: 60 }, operator: '洪嘉駿' });
    const overSum = store().voidLogistics('a', 'SH-TEST-A-002', { reason: '遺失', undelivered: { [NO]: 41 }, operator: '洪嘉駿' });
    expect(overSum.ok).toBe(false);
    expect(overSum.error).toContain('不得超過');
    seed([sh({ method: '順豐', logisticsOrders: [departed('SH-TEST-A-001', '運送中')] })]);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', operator: '洪嘉駿' }).ok).toBe(false);
    expect(lo('SH-TEST-A-001').status).toBe('運送中');
  });

  it('validateUndelivered 本身：缺的視為 0、負數與小數不通過', () => {
    expect(validateUndelivered({ shipment: get(), entries: {} })).toEqual({ ok: true, rows: [] });
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: -1 } }).ok).toBe(false);
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: 1.5 } }).ok).toBe(false);
  });

  it('已作廢出貨單整張不計：底下物流單的未送達也不再扣，不重複回補', () => {
    seed([sh({ method: '順豐', status: '已作廢', logisticsOrders: [departed('SH-TEST-A-001', '已作廢', { undelivered: [{ print_item_no: NO, qty: 30 }] })] })]);
    expect(occupiedQtyOf(get(), NO)).toBe(0);
    expect(calcShippableQty(printItem, all(), qcRecords)).toBe(100);
  });
});

describe('12.35 送達確認與交付確認可填逐印件未送達數量（各出貨方式皆可）', () => {
  it('順豐子母單一箱遺失：物流商回傳例外後出貨人員送達確認、填未送達量，回補額度，出貨單轉已送達、送達數量扣除', () => {
    seed([
      sh({
        method: '順豐',
        qty: 600,
        logisticsOrders: [departed('SH-TEST-A-001', '例外事故', { exception_source: 'carrier', tracking_no: 'SF1' })],
      }),
    ]);
    const orderedState = () => useOrdersStore.getState().orders[0];
    seed(all(), { orderedQty: 500 });
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', {
      operator: '曾志偉',
      proof: '物流商配達時間：2026-10-20 10:00',
      undelivered: { [NO]: 100 },
    });
    expect(r.ok).toBe(true);
    expect(lo('SH-TEST-A-001').status).toBe('已送達');
    expect(lo('SH-TEST-A-001').undelivered).toEqual([{ print_item_no: NO, qty: 100 }]);
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(500);
    expect(occupiedQtyOf(get(), NO)).toBe(500);
    expect(orderedState().print_items[0].print_item_status).toBe('已送達');
  });

  it('自取客戶只載走一部分：交付確認填未送達數量，物流單已自取，系統回補；超過明細數量擋下', () => {
    seed([sh({ method: '自取', logisticsOrders: [departed('SH-TEST-A-001', '可自取')] })]);
    const over = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', {
      operator: '曾志偉',
      proof: '現場點交照.jpg',
      undelivered: { [NO]: 101 },
    });
    expect(over.ok).toBe(false);
    expect(lo('SH-TEST-A-001').status).toBe('可自取');
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', {
      operator: '曾志偉',
      proof: '現場點交照.jpg',
      undelivered: { [NO]: 30 },
    });
    expect(r.ok).toBe(true);
    expect(lo('SH-TEST-A-001').status).toBe('已自取');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(70);
    expect(calcShippableQty(printItem, all(), qcRecords)).toBe(30);
  });

  it('專車少交一箱：送達確認時填未送達數量；沒填就是全數送達', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [departed('SH-TEST-A-001', '已出貨')] })]);
    store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', proof: '司機交付照.jpg', undelivered: { [NO]: 20 } });
    expect(get().details[0].delivered_qty).toBe(80);
    seed([sh({ method: '專車配送', logisticsOrders: [departed('SH-TEST-A-001', '已出貨')] })]);
    store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', proof: '司機交付照.jpg' });
    expect(get().details[0].delivered_qty).toBe(100);
  });

  it('同一出貨單的未送達合計跨物流單累計：作廢填過的量，後續送達確認只能填剩下的', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          departed('SH-TEST-A-001', '已作廢', { undelivered: [{ print_item_no: NO, qty: 70 }] }),
          departed('SH-TEST-A-002', '運送中', { tracking_no: 'P2' }),
        ],
      }),
    ]);
    const over = store().confirmLogisticsDelivery('a', 'SH-TEST-A-002', { operator: '曾志偉', proof: '物流商配達時間：x', undelivered: { [NO]: 31 } });
    expect(over.ok).toBe(false);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-002', { operator: '曾志偉', proof: '物流商配達時間：x', undelivered: { [NO]: 30 } }).ok).toBe(true);
    expect(get().details[0].delivered_qty).toBe(0);
  });
});

// ── 12.38 訂單取消連鎖與集合詞 ──

describe('12.38 訂單取消連鎖：未出貨動作作廢、部分離廠擋下、全數離廠不動', () => {
  const unstarted = (id) =>
    sh({ id, shipmentNo: `SH-TEST-${id}`, method: '順豐', logisticsOrders: [logistics(`SH-TEST-${id}-001`, '已裝箱')] });
  const partial = () =>
    sh({
      id: 'p',
      shipmentNo: 'SH-TEST-p',
      method: '7-11 交貨便',
      logisticsOrders: [
        departed('SH-TEST-p-001', '等待出貨'),
        logistics('SH-TEST-p-002', '已裝箱', { dispatch_attempts: 1, dispatch_error: '拒收' }),
      ],
    });
  const full = () =>
    sh({ id: 'f', shipmentNo: 'SH-TEST-f', method: '順豐', logisticsOrders: [departed('SH-TEST-f-001', '運送中')] });
  const pre = (status) => ({
    id: status,
    shipment_no: `SH-TEST-${status}`,
    order_no: ORDER_NO,
    status,
    method: '順豐',
    details: [{ print_item_no: NO, name: NAME, qty: 10 }],
    planned_details: [],
    packing_boxes: [],
    logistics_orders: [],
    history: [],
  });

  it('未處理、打包中與未出貨動作的已裝箱由系統作廢（底下物流單一併作廢），草稿直接刪除', () => {
    seed([unstarted('u'), pre('未處理'), pre('打包中'), { ...pre('草稿'), details: [] }, partial(), full()]);
    const affected = store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(affected.map((v) => [v.shipment_no, v.status_before]).sort()).toEqual(
      [
        ['SH-TEST-u', '已裝箱'],
        ['SH-TEST-未處理', '未處理'],
        ['SH-TEST-打包中', '打包中'],
        ['SH-TEST-草稿', '草稿'],
      ].sort(),
    );
    expect(get('u').status).toBe('已作廢');
    expect(lo('SH-TEST-u-001', 'u').status).toBe('已作廢');
    expect(lo('SH-TEST-u-001', 'u').void_reason).toBe('訂單取消');
    expect(get('未處理').status).toBe('已作廢');
    expect(all().some((x) => x.id === '草稿')).toBe(false);
  });

  it('部分離廠與全數離廠的單不動；部分離廠者已裝箱的物流單留給業務作廢', () => {
    seed([partial(), full()]);
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(shipmentStatusOf(get('p'))).toBe('已裝箱');
    expect(lo('SH-TEST-p-002', 'p').status).toBe('已裝箱');
    expect(shipmentStatusOf(get('f'))).toBe('運送中');
    // 訂單已取消後，系統擋下出貨動作與重試
    useOrdersStore.setState({ orders: [{ ...useOrdersStore.getState().orders[0], status: '已取消' }] });
    expect(store().dispatchShipment('p', { operator: '曾志偉' }).ok).toBe(false);
    expect(store().retryDispatch('p', 'SH-TEST-p-002', { operator: '曾志偉' }).ok).toBe(false);
    // 業務作廢那筆已裝箱的物流單（填未送達數量）
    const r = store().voidLogistics('p', 'SH-TEST-p-002', { reason: '訂單取消', undelivered: { [NO]: 50 }, operator: '洪嘉駿' });
    expect(r.ok).toBe(true);
    expect(occupiedQtyOf(get('p'), NO)).toBe(50);
  });
});

describe('12.38 三個集合詞互斥，涵蓋草稿以外的全部未作廢出貨單', () => {
  const cases = {
    未處理: { shipment: { status: '未處理', logistics_orders: [] }, expected: 'before' },
    打包中: { shipment: { status: '打包中', logistics_orders: [] }, expected: 'before' },
    已裝箱未出貨: {
      shipment: sh({ logisticsOrders: [logistics('L-1', '已裝箱'), logistics('L-2', '已裝箱')] }),
      expected: 'before',
    },
    部分離廠: {
      shipment: sh({
        logisticsOrders: [departed('L-1', '等待出貨'), logistics('L-2', '已裝箱', { dispatch_attempts: 1, dispatch_error: 'x' })],
      }),
      expected: 'partial',
    },
    全部失敗: {
      shipment: sh({
        logisticsOrders: [logistics('L-1', '已裝箱', { dispatch_attempts: 1, dispatch_error: 'x' })],
      }),
      expected: 'partial',
    },
    全數離廠: {
      shipment: sh({ logisticsOrders: [departed('L-1', '運送中'), departed('L-2', '已送達')] }),
      expected: 'full',
    },
    異常但全數離廠: {
      shipment: sh({ logisticsOrders: [departed('L-1', '例外事故')] }),
      expected: 'full',
    },
  };
  const tag = (shipment) => {
    const flags = [
      ['before', isBeforeDispatchAction(shipment)],
      ['partial', isPartiallyDeparted(shipment)],
      ['full', isFullyDeparted(shipment)],
    ].filter(([, v]) => v);
    return flags.map(([k]) => k);
  };

  it('每種單剛好落在一個集合', () => {
    for (const [name, { shipment, expected }] of Object.entries(cases)) {
      expect(tag(shipment), name).toEqual([expected]);
    }
  });

  it('草稿與已作廢不屬任何集合', () => {
    expect(tag({ status: '草稿', logistics_orders: [] })).toEqual([]);
    expect(
      tag(sh({ status: '已作廢', logisticsOrders: [departed('L-1', '已作廢')] })),
    ).toEqual([]);
  });

  it('已離廠量（calcShippedQty）只算全數離廠者；部分離廠不算', () => {
    const full = sh({ id: 'f', qty: 40, logisticsOrders: [departed('L-1', '運送中')] });
    const part = sh({
      id: 'p',
      qty: 60,
      logisticsOrders: [departed('L-1', '等待出貨'), logistics('L-2', '已裝箱', { dispatch_attempts: 1 })],
    });
    expect(calcShippedQty(printItem, [full, part])).toBe(40);
  });
});
