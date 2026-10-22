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
import {
  SIMULATED_CARRIER_REJECT_NOTE,
  SIMULATED_CARRIER_TIMEOUT_NOTE,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { PICKING_MISMATCH_HINT } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  calcShippableQty,
  calcShippedQty,
  DISPATCH_TIMEOUT_HINT,
  ORDER_CANCELLED_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { batchDispatchOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { box, departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.32 至 12.38（出貨單裝箱資料與物流單拆分，設計 2026-10-20 § 六至 § 八）與 12.41、12.43、12.45
//（批次拋單、拋單逾時、部分離廠後拆箱，設計 2026-10-22）的規則驗算：
// 拆單規則、出貨單狀態取最落後、例外使出貨單轉異常並可重新同步恢復、物流單逐筆出貨動作與拋單失敗（G31、G32）、
// 批次拋單逐筆獨立（G38、G39、G52）、逾時視為失敗（G59）、
// 作廢物流單回補（含最後一筆預填、不重複回補）、自取部分交付、訂單取消連鎖、三個集合詞互斥。
// 物流商拒收與逾時以物流單上的 Prototype 模擬開關 simulated_carrier_reply 驗（不是箱規、不依尺寸）。
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
// 箱規所有出貨方式共用（grill G42），各出貨方式一律用 1 號箱
const spec = () => '1 號箱';

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

// ── 12.36 出貨動作：物流單逐筆執行（G31），拋單失敗不推進、不存失敗原因（G32） ──

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
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
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

  it('不支援子母單的第三方（7-11 交貨便）：每筆物流單各自拋單，各自一個物流單號、沒有子單號', () => {
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
    store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    // 只拋第一筆：第二筆仍在已裝箱，出貨單部分離廠
    expect(lo('SH-TEST-A-002').status).toBe('已裝箱');
    expect(isPartiallyDeparted(get())).toBe(true);
    store().dispatchLogistics('a', 'SH-TEST-A-002', { operator: '曾志偉' });
    const nos = los().map((l) => l.tracking_no);
    expect(nos.every((n) => /^PYU-\d{9}$/.test(n))).toBe(true);
    expect(new Set(nos).size).toBe(2);
    expect(get().packing_boxes.every((b) => b.sub_tracking_no === null)).toBe(true);
  });

  it('專車與其他出貨確認：物流單轉已出貨、沒有物流單號與檔案；自取標記可自取：物流單轉可自取', () => {
    ['專車配送', '其他'].forEach((m) => {
      seed([packed(m)]);
      store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
      expect(lo('SH-TEST-A-001').status, m).toBe('已出貨');
      expect(lo('SH-TEST-A-001').tracking_no, m).toBeNull();
      expect(lo('SH-TEST-A-001').left_at, m).toBeTruthy();
      expect(shipmentStatusOf(get()), m).toBe('已出貨');
    });
    seed([packed('自取')]);
    store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(lo('SH-TEST-A-001').status).toBe('可自取');
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });

  it('拋單失敗（G32）：物流商拒收時回傳錯誤訊息，物流單狀態不推進、不存失敗原因與嘗試次數、沒有離廠時間；單與歷程不變', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱', { simulated_carrier_reply: 'reject' })],
        boxes: [box('001', 'SH-TEST-A-001')],
      }),
    ]);
    const before = JSON.stringify(get());
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
    // 拒收的錯誤訊息是物流商回傳的，不呈現為系統依箱規或尺寸把關
    expect(r.error).not.toMatch(/箱規|尺寸|材積/);
    expect(JSON.stringify(get())).toBe(before);
    expect(lo('SH-TEST-A-001')).not.toHaveProperty('dispatch_error');
    expect(lo('SH-TEST-A-001')).not.toHaveProperty('dispatch_attempts');
    expect(lo('SH-TEST-A-001').left_at).toBeNull();
    // 再按一次仍會重拋（沒有單筆重試動作）；每次都失敗，要經裝箱回報修正後才拋得成功
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
    expect(store().retryDispatch).toBeUndefined();
  });

  it('裝箱備註含示意字樣時，完成裝箱回報產生的物流單帶上物流商模擬回應（拒收或逾時）；沒有字樣者正常', () => {
    seed([
      {
        id: 'a',
        shipment_no: 'SH-TEST-A',
        order_no: ORDER_NO,
        status: '打包中',
        method: '新竹物流',
        details: [{ print_item_no: NO, name: NAME, qty: 100, picked_qty: null }],
        planned_details: [],
        packing_boxes: [],
        box_seq: 0,
        logistics_orders: [],
        packing_corrections: [],
        history: [],
      },
    ]);
    const photo = [{ name: '裝箱照.jpg', url: null }];
    const r = store().reportPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [
        { box_spec: '1 號箱', photos: photo, note: '' },
        { box_spec: '1 號箱', photos: photo, note: `第二箱（${SIMULATED_CARRIER_TIMEOUT_NOTE}）` },
        { box_spec: '1 號箱', photos: photo, note: SIMULATED_CARRIER_REJECT_NOTE },
      ],
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    expect(los().map((l) => l.simulated_carrier_reply ?? null)).toEqual([null, 'timeout', 'reject']);
  });

  it('拋單失敗不算離廠：出貨單仍是未出貨動作，裝箱回報修正仍開放；改箱規後再拋成功', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱', { simulated_carrier_reply: 'reject' })],
        boxes: [box('001', 'SH-TEST-A-001')],
      }),
    ]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
    expect(isBeforeDispatchAction(get())).toBe(true);
    expect(isPartiallyDeparted(get())).toBe(false);
    const fixed = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [{ box_no: '001', box_spec: 'F13 箱', length: 29, width: 21, height: 6, photos: [{ name: '裝箱照.jpg', url: null }], note: '' }],
      reason: '物流商拒收，改用較小的箱子',
      operator: '范姜宏',
    });
    expect(fixed.ok).toBe(true);
    const retried = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(retried.ok).toBe(true);
    expect(lo('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-001').left_at).toBeTruthy();
    expect(isFullyDeparted(get())).toBe(true);
  });

  it('部分離廠：一筆拋單成功、另一筆失敗；出貨單仍是已裝箱（取最落後）、部分離廠；揀貨數量鎖住；已裝箱那筆可作廢', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          logistics('SH-TEST-A-001', '已裝箱'),
          logistics('SH-TEST-A-002', '已裝箱', { simulated_carrier_reply: 'reject' }),
        ],
        boxes: [box('001', 'SH-TEST-A-001'), box('002', 'SH-TEST-A-002')],
      }),
    ]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-002', { operator: '曾志偉' }).ok).toBe(false);
    expect(lo('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-002').status).toBe('已裝箱');
    expect(lo('SH-TEST-A-002').left_at).toBeNull();
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(isPartiallyDeparted(get())).toBe(true);
    expect(isFullyDeparted(get())).toBe(false);
    expect(shipmentActualShipDate(get())).toBeNull();
    // 已有物流單離廠：揀貨數量不能再改
    expect(
      store().correctPacking('a', {
        lines: [{ print_item_no: NO, picked_qty: 90 }],
        boxes: get().packing_boxes.map((b) => ({ ...b })),
        reason: '想改',
        operator: '范姜宏',
      }).ok,
    ).toBe(false);
    // 已裝箱的物流單在部分離廠時可作廢
    expect(
      store().voidLogistics('a', 'SH-TEST-A-002', { reason: '另一箱裝錯', undelivered: { [NO]: 50 }, operator: '洪嘉駿' }).ok,
    ).toBe(true);
  });

  it('只有已裝箱的物流單可出貨動作：已離廠的不重送', () => {
    seed([packed('順豐')]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    const tracking = lo('SH-TEST-A-001').tracking_no;
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
    expect(lo('SH-TEST-A-001').tracking_no).toBe(tracking);
  });

  it('揀貨不符時出貨動作被擋下，單與歷程不變', () => {
    const base = packed('順豐');
    seed([{ ...base, details: [{ ...base.details[0], picked_qty: 80 }] }]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(PICKING_MISMATCH_HINT);
    expect(lo('SH-TEST-A-001').status).toBe('已裝箱');
    expect(hasDispatchActionDone(get())).toBe(false);
  });

  it('所屬訂單已取消時出貨動作被擋下', () => {
    seed([packed('順豐')], { orderStatus: '已取消' });
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
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
        logistics('SH-TEST-p-002', '已裝箱'),
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
    // 訂單已取消後，系統擋下出貨動作
    useOrdersStore.setState({ orders: [{ ...useOrdersStore.getState().orders[0], status: '已取消' }] });
    expect(store().dispatchLogistics('p', 'SH-TEST-p-002', { operator: '曾志偉' }).ok).toBe(false);
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
        logisticsOrders: [departed('L-1', '等待出貨'), logistics('L-2', '已裝箱')],
      }),
      expected: 'partial',
    },
    拋單全部失敗: {
      shipment: sh({ logisticsOrders: [logistics('L-1', '已裝箱')] }),
      expected: 'before',
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
      logisticsOrders: [departed('L-1', '等待出貨'), logistics('L-2', '已裝箱')],
    });
    expect(calcShippedQty(printItem, [full, part])).toBe(40);
  });
});

// ── 12.41 批次拋單（grill G38、G39、G52；shipment spec § 從出貨單批次拋單） ──

describe('12.41 批次拋單：對本單每一筆已裝箱的物流單各執行一次拋單，逐筆獨立', () => {
  beforeEach(() => seed([]));

  const nos = (n, prefix = 'SH-TEST-A') =>
    Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);
  const resultNos = (r) => r.results.map((x) => x.logistics_order_no);

  it('全部成功：7-11 交貨便 5 筆各轉等待出貨、各有物流單號與離廠時間；出貨單轉等待出貨並寫入實際出貨日；不另記批次事件；之後不再渲染批次拋單', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(5).map((no) => logistics(no, '已裝箱')) })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results).toHaveLength(5);
    expect(r.results.every((x) => x.ok && x.tracking_no)).toBe(true);
    expect(los().every((l) => l.status === '等待出貨' && l.tracking_no && l.left_at)).toBe(true);
    expect(new Set(los().map((l) => l.tracking_no)).size).toBe(5);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(shipmentActualShipDate(get())).toBeTruthy();
    los().forEach((l) => {
      expect(l.history.filter((h) => h.event.startsWith('拋單成功')), l.logistics_order_no).toHaveLength(1);
    });
    expect(get().history.some((h) => h.event.includes('批次'))).toBe(false);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() }).visible).toBe(false);
  });

  it('部分失敗：新竹物流 3 筆、物流商拒收第 3 筆；第 1、2 筆轉等待出貨，第 3 筆停在已裝箱、不存失敗原因；結果列 2 成功 1 失敗附錯誤訊息；再按只送第 3 筆', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [
          logistics('SH-TEST-A-001', '已裝箱'),
          logistics('SH-TEST-A-002', '已裝箱'),
          logistics('SH-TEST-A-003', '已裝箱', { simulated_carrier_reply: 'reject' }),
        ],
      }),
    ]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results.map((x) => x.ok)).toEqual([true, true, false]);
    expect(r.results[2].error).toBeTruthy();
    expect(lo('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-002').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-003')).toMatchObject({ status: '已裝箱', tracking_no: null, left_at: null });
    expect(lo('SH-TEST-A-003')).not.toHaveProperty('dispatch_error');
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(isPartiallyDeparted(get())).toBe(true);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() })).toMatchObject({ visible: true, disabled: false });
    const again = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultNos(again)).toEqual(['SH-TEST-A-003']);
  });

  it('支援子母單（順豐）只有一筆物流單：只送出這一筆，主單號與五個子單號寫入，物流單與出貨單轉等待出貨', () => {
    seed([
      sh({
        method: '順豐',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱')],
        boxes: ['001', '002', '003', '004', '005'].map((no) => box(no, 'SH-TEST-A-001')),
      }),
    ]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultNos(r)).toEqual(['SH-TEST-A-001']);
    const l = lo('SH-TEST-A-001');
    expect(l.status).toBe('等待出貨');
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual(
      ['001', '002', '003', '004', '005'].map((n) => `${l.tracking_no}${n}`),
    );
    expect(shipmentStatusOf(get())).toBe('等待出貨');
  });

  it('出貨單異常時只送已裝箱的物流單：例外與等待出貨的維持原狀，出貨單仍為異常，送完後批次拋單停用並顯示理由', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          departed('SH-TEST-A-001', '例外事故', { exception_source: 'carrier', exception_reason: '物流商回傳例外' }),
          departed('SH-TEST-A-002', '等待出貨', { tracking_no: 'PYU-2' }),
          logistics('SH-TEST-A-003', '已裝箱'),
        ],
      }),
    ]);
    expect(shipmentStatusOf(get())).toBe('異常');
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultNos(r)).toEqual(['SH-TEST-A-003']);
    expect(lo('SH-TEST-A-003').status).toBe('等待出貨');
    expect(lo('SH-TEST-A-001').status).toBe('例外事故');
    expect(lo('SH-TEST-A-002').tracking_no).toBe('PYU-2');
    expect(shipmentStatusOf(get())).toBe('異常');
    const btn = batchDispatchOf({ role: 'shipper', shipment: get() });
    expect(btn).toMatchObject({ visible: true, disabled: true });
    expect(btn.reason).toBeTruthy();
  });

  it('訂單已取消時部分離廠出貨單的批次拋單逐筆失敗：已裝箱那一筆被擋下、結果列出理由，等待出貨那一筆不變', () => {
    seed(
      [
        sh({
          method: '新竹物流',
          logisticsOrders: [
            departed('SH-TEST-A-001', '等待出貨', { tracking_no: 'HCT-1' }),
            logistics('SH-TEST-A-002', '已裝箱'),
          ],
        }),
      ],
      { orderStatus: '已取消' },
    );
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results).toEqual([
      expect.objectContaining({ logistics_order_no: 'SH-TEST-A-002', ok: false, error: ORDER_CANCELLED_HINT }),
    ]);
    expect(lo('SH-TEST-A-002').status).toBe('已裝箱');
    expect(lo('SH-TEST-A-001')).toMatchObject({ status: '等待出貨', tracking_no: 'HCT-1' });
  });

  it('揀貨不符時繞過介面送出批次拋單：整批擋下，不送出任何一筆', () => {
    const base = sh({ method: '全家', logisticsOrders: nos(3).map((no) => logistics(no, '已裝箱')) });
    seed([{ ...base, details: [{ ...base.details[0], picked_qty: 80 }] }]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(PICKING_MISMATCH_HINT);
    expect(los().every((l) => l.status === '已裝箱' && !l.left_at)).toBe(true);
  });

  it('出貨動作不是拋單的出貨方式、或出貨單不在已裝箱與異常：沒有批次拋單，直接呼叫也擋下', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      seed([sh({ method, logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱')] })]);
      expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok, method).toBe(false);
      expect(lo('SH-TEST-A-001').status, method).toBe('已裝箱');
    });
    seed([sh({ method: '新竹物流', logisticsOrders: [departed('SH-TEST-A-001', '等待出貨')] })]);
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
  });
});

// ── 12.43 拋單逾時（grill G59） ──

describe('12.43 拋單逾時視為失敗：物流單停在已裝箱、不寫入物流單號與離廠時間、不存失敗原因', () => {
  it('單筆拋單逾時：回傳逾時失敗，物流單與出貨單維持已裝箱，仍可再拋', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [logistics('SH-TEST-A-001', '已裝箱', { simulated_carrier_reply: 'timeout' })],
      }),
    ]);
    const before = JSON.stringify(get());
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.timeout).toBe(true);
    expect(r.error).toBe(DISPATCH_TIMEOUT_HINT);
    expect(JSON.stringify(get())).toBe(before);
    expect(lo('SH-TEST-A-001')).toMatchObject({ status: '已裝箱', tracking_no: null, label_file: null, left_at: null });
    expect(shipmentStatusOf(get())).toBe('已裝箱');
  });

  it('批次拋單中某一筆逾時：該筆結果標逾時、停在已裝箱，其他筆照常成功', () => {
    seed([
      sh({
        method: '全家',
        logisticsOrders: [
          logistics('SH-TEST-A-001', '已裝箱'),
          logistics('SH-TEST-A-002', '已裝箱', { simulated_carrier_reply: 'timeout' }),
        ],
      }),
    ]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.results).toEqual([
      expect.objectContaining({ logistics_order_no: 'SH-TEST-A-001', ok: true }),
      expect.objectContaining({ logistics_order_no: 'SH-TEST-A-002', ok: false, timeout: true, error: DISPATCH_TIMEOUT_HINT }),
    ]);
    expect(lo('SH-TEST-A-002').status).toBe('已裝箱');
  });
});

// ── 12.45 部分離廠後把被拒收的一箱拆成兩箱（grill G49、G55） ──

describe('12.45 部分離廠後拆箱：改第 3 箱、新增第 5 箱，系統產生第 5 筆物流單；批次拋單只送第 3、5 筆', () => {
  it('第 1、2、4 筆不變、揀貨數量不變、出貨單維持已裝箱、箱數 5；批次只送 -003、-005，成功後出貨單轉等待出貨', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          departed('SH-TEST-A-001', '等待出貨', { tracking_no: 'PYU-1' }),
          departed('SH-TEST-A-002', '等待出貨', { tracking_no: 'PYU-2' }),
          logistics('SH-TEST-A-003', '已裝箱', { simulated_carrier_reply: 'reject' }),
          departed('SH-TEST-A-004', '等待出貨', { tracking_no: 'PYU-4' }),
        ],
      }),
    ]);
    const before = get();
    const photo = [{ name: '裝箱照.jpg', url: null }];
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [
        ...before.packing_boxes.map((b) =>
          b.box_no === '003' ? { ...b, box_spec: 'F13 箱', length: 29, width: 21, height: 6 } : { ...b },
        ),
        { box_spec: 'F13 箱', length: 29, width: 21, height: 6, photos: photo, note: '' },
      ],
      reason: '第 3 箱被拒收，拆成兩個小箱',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    const after = get();
    expect(after.packing_boxes).toHaveLength(5);
    expect(after.packing_boxes[4]).toMatchObject({ box_no: '005', logistics_order_no: 'SH-TEST-A-005' });
    expect(lo('SH-TEST-A-005')).toMatchObject({ status: '已裝箱', left_at: null });
    ['SH-TEST-A-001', 'SH-TEST-A-002', 'SH-TEST-A-004'].forEach((no) => {
      expect(lo(no)).toEqual(before.logistics_orders.find((l) => l.logistics_order_no === no));
    });
    expect(after.details[0].picked_qty).toBe(100);
    expect(shipmentStatusOf(after)).toBe('已裝箱');
    expect(after.packing_corrections.map((c) => c.field)).toContain('新增第 005 箱');

    const batch = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(batch.results.map((x) => [x.logistics_order_no, x.ok])).toEqual([
      ['SH-TEST-A-003', true],
      ['SH-TEST-A-005', true],
    ]);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
  });
});
