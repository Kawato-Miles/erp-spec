import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  boxCountOf,
  CARRIER_SYNC_ACTOR,
  carrierReplyTransition,
  isFullyDeparted,
  isNotDeparted,
  isPartiallyDeparted,
  lastLogisticsFillOf,
  occupiedQtyOf,
  shipmentStatusOf,
  splitIntoLogistics,
  validateUndelivered,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import { logisticsFileOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/download-files.js';
import { MOCK_SHIPMENTS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  canCorrectPacking,
  packingCorrectionScope,
  withdrawShippableCheck,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  calcShippableQty,
  calcShippedQty,
  DISPATCH_TIMEOUT_HINT,
  ORDER_CANCELLED_HINT,
  SETTLED_ALREADY_HINT,
  useQcShippingStore,
  validateShipmentQuota,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { box, boxedShipment, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.32～12.38、12.41、12.43、12.45、12.49、12.50、12.54 的規則驗算（出貨單、裝箱資料、物流單三層）。
// 期望值取自 shipment spec（本 change delta）各 Requirement 的驗收條目，以及 business-scenarios spec § 品檢與出貨。
// 物流單於確認可出貨時產生、初始可出貨；第三方物流拋單後只依物流商回傳推進（不經已出貨），
// 物流商回傳以純函式 carrierReplyTransition 與 store 的 receiveCarrierReply 驗（grill § 七：畫面不加示意鈕）。
// 物流商拒收與逾時以物流單上的 Prototype 模擬開關 simulated_carrier_reply 驗（不是箱規、不依尺寸）。
// 畫面呈現在 tests/e2e/12-shipping/shipping.spec.mjs。

const NO = 'PI-TEST-LOG';
const NAME = '物流樣本';
const ORDER_NO = 'ORD-TEST-LOG';
const printItem = { print_item_no: NO };

const seed = (shipments, { orderStatus = '出貨中', orderedQty = 100, itemStatus = '出貨中' } = {}) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-log',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: orderStatus,
        activities: [],
        print_items: [
          { print_item_no: NO, name: NAME, type: '大貨印件', ordered_qty: orderedQty, print_item_status: itemStatus },
        ],
      },
    ],
  });
  useQcShippingStore.setState({ shipments, downloadFiles: [] });
};

const sh = (overrides) =>
  packedShipment({ id: 'a', shipmentNo: 'SH-TEST-A', orderNo: ORDER_NO, printItemNo: NO, name: NAME, ...overrides });
const boxed = (overrides) =>
  boxedShipment({ id: 'a', shipmentNo: 'SH-TEST-A', orderNo: ORDER_NO, printItemNo: NO, name: NAME, ...overrides });
const lo = (no, status, extra) => logistics(no, status, extra);
const nos3 = (n, prefix = 'SH-TEST-A') => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);
const get = (id = 'a') => useQcShippingStore.getState().shipments.find((x) => x.id === id);
const los = (id = 'a') => get(id).logistics_orders;
const lget = (no, id = 'a') => los(id).find((l) => l.logistics_order_no === no);
const store = () => useQcShippingStore.getState();
const all = () => useQcShippingStore.getState().shipments;
const qcOf = (passed) => [{ print_item_no: NO, passed_qty: passed, failed_qty: 0 }];
const quota = (passed) => calcShippableQty(printItem, all(), qcOf(passed));
const keepBoxes = (shipment) =>
  shipment.packing_boxes.map(({ box_no, box_spec, length, width, height, photos, note }) => ({
    box_no,
    box_spec,
    length,
    width,
    height,
    photos,
    note,
  }));
const photo = [{ name: '裝箱照.jpg', url: null }];
const f13 = { box_spec: 'F13 箱', length: 29, width: 21, height: 6 };
const reply = (no, r, id = 'a', at) => store().receiveCarrierReply(id, no, { reply: r, at });

// ── 12.32 依出貨方式產生物流單（確認可出貨時） ──

describe('12.32 拆單：確認可出貨時依出貨方式產生物流單，支援子母單合成一筆、否則一箱一筆', () => {
  const boxes = (n) => Array.from({ length: n }, (_, i) => box(String(i + 1).padStart(3, '0'), null));

  it('拆單純函式：產生的物流單初始狀態為可出貨；順豐 6 箱一筆、7-11 交貨便 3 箱三筆、序號接在 startSeq 之後', () => {
    const merged = splitIntoLogistics({ shipmentNo: 'SH-1', method: '順豐', boxes: boxes(6) });
    expect(merged.logistics).toHaveLength(1);
    expect(merged.logistics[0]).toMatchObject({ logistics_order_no: 'SH-1-001', status: '可出貨' });
    const split = splitIntoLogistics({ shipmentNo: 'SH-1', method: '7-11 交貨便', boxes: boxes(3), startSeq: 4 });
    expect(split.logistics.map((l) => l.logistics_order_no)).toEqual(['SH-1-005', 'SH-1-006', 'SH-1-007']);
    expect(split.logistics.every((l) => l.status === '可出貨')).toBe(true);
    ['新竹物流', '全家'].forEach((m) => expect(splitIntoLogistics({ shipmentNo: 'S', method: m, boxes: boxes(2) }).logistics, m).toHaveLength(2));
    ['自取', '專車配送', '其他'].forEach((m) => expect(splitIntoLogistics({ shipmentNo: 'S', method: m, boxes: boxes(2) }).logistics, m).toHaveLength(1));
    // 物流單上不帶離廠時間欄
    expect('left_at' in merged.logistics[0]).toBe(false);
  });

  it('支援子母單時全部箱合成一筆物流單：順豐 3 箱確認可出貨 → 一筆 -001、三箱同屬它、可出貨、箱數 3', () => {
    seed([boxed({ method: '順豐', boxCount: 3 })]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(los().map((l) => [l.logistics_order_no, l.status])).toEqual([['SH-TEST-A-001', '可出貨']]);
    expect(get().packing_boxes.every((b) => b.logistics_order_no === 'SH-TEST-A-001')).toBe(true);
    expect(boxCountOf(get())).toBe(3);
  });

  it('不支援子母單時一箱一筆物流單：7-11 交貨便 3 箱 → -001、-002、-003 皆可出貨', () => {
    seed([boxed({ method: '7-11 交貨便', boxCount: 3 })]);
    store().confirmShippable('a', { operator: '范姜宏' });
    expect(los().map((l) => l.logistics_order_no)).toEqual(nos3(3));
    expect(get().packing_boxes.map((b) => b.logistics_order_no)).toEqual(nos3(3));
    expect(los().every((l) => l.status === '可出貨')).toBe(true);
  });

  it('已裝箱時增刪箱後才確認，物流單依當下箱數產生：刪 002、新增一箱（箱序 004）不產生物流單；確認後三筆 -001 至 -003 分屬 001、003、004', () => {
    seed([boxed({ method: '全家', boxCount: 3 })]);
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [...keepBoxes(get()).filter((b) => b.box_no !== '002'), { box_spec: '1 號箱', photos: photo, note: '' }],
      reason: '第二箱改裝',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    expect(los()).toEqual([]);
    expect(get().packing_boxes.map((b) => b.box_no)).toEqual(['001', '003', '004']);
    store().confirmShippable('a', { operator: '范姜宏' });
    expect(get().packing_boxes.map((b) => [b.box_no, b.logistics_order_no])).toEqual([
      ['001', 'SH-TEST-A-001'],
      ['003', 'SH-TEST-A-002'],
      ['004', 'SH-TEST-A-003'],
    ]);
  });
});

// ── 12.33 出貨單狀態取最落後、異常優先 ──

describe('12.33 出貨單可出貨之後的狀態由未作廢物流單計算：取最落後、任一在例外即異常', () => {
  const status = (...states) =>
    shipmentStatusOf(sh({ method: '7-11 交貨便', logisticsOrders: states.map((s, i) => lo(`L-${i}`, s)) }));

  it('取最落後的那一筆：可出貨 → 等待出貨 → 已出貨（可自取）→ 運送中 → 已送達', () => {
    expect(status('可出貨', '運送中')).toBe('可出貨');
    expect(status('等待出貨', '運送中')).toBe('等待出貨');
    expect(status('已出貨', '運送中', '已送達')).toBe('已出貨');
    expect(status('運送中', '已送達')).toBe('運送中');
    expect(status('可自取', '已自取')).toBe('已出貨');
  });

  it('已送達需至少一筆未作廢物流單且全部送達；已作廢的物流單不參與計算；全部作廢則已作廢', () => {
    expect(status('已送達', '已自取')).toBe('已送達');
    expect(status('已作廢', '運送中')).toBe('運送中');
    expect(status('已作廢', '已送達')).toBe('已送達');
    expect(status('已作廢', '已作廢')).toBe('已作廢');
  });

  it('任一未作廢物流單在例外即異常，優先於其他結果', () => {
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((e) => {
      expect(status('已送達', '已送達', e), e).toBe('異常');
      expect(status('可出貨', e), e).toBe('異常');
    });
    expect(status('已作廢', '例外事故')).toBe('異常');
  });

  it('草稿、未處理、打包中與尚無物流單的已裝箱取單上記的值', () => {
    ['草稿', '未處理', '打包中', '已裝箱'].forEach((s) => expect(shipmentStatusOf({ status: s, logistics_orders: [] })).toBe(s));
  });

  it('逐筆拋單時出貨單取最落後：新竹兩筆只拋第一筆仍為可出貨，兩筆都拋完轉等待出貨、各有自己的物流單號', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001'), lo('SH-TEST-A-002')] })]);
    store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(shipmentStatusOf(get())).toBe('可出貨');
    store().dispatchLogistics('a', 'SH-TEST-A-002', { operator: '曾志偉' });
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(new Set(los().map((l) => l.tracking_no)).size).toBe(2);
  });

  it('出貨單取未作廢物流單最落後：7-11 三筆等待出貨，一筆回傳到店仍為等待出貨，三筆都到運送中才轉運送中', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(3).map((n) => lo(n, '等待出貨', { tracking_no: `P-${n}` })) })]);
    reply('SH-TEST-A-001', '到店');
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    reply('SH-TEST-A-002', '到店');
    reply('SH-TEST-A-003', '到店');
    expect(shipmentStatusOf(get())).toBe('運送中');
  });

  it('任一物流單例外即異常：兩筆已送達一筆運送中，運送中那筆收到例外 → 異常；下一次回傳運送中後重算為運送中', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          lo('SH-TEST-A-001', '已送達', { tracking_no: 'P1' }),
          lo('SH-TEST-A-002', '已送達', { tracking_no: 'P2' }),
          lo('SH-TEST-A-003', '運送中', { tracking_no: 'P3' }),
        ],
      }),
    ]);
    reply('SH-TEST-A-003', '例外事故');
    expect(shipmentStatusOf(get())).toBe('異常');
    reply('SH-TEST-A-003', '在途');
    expect(lget('SH-TEST-A-003').status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
  });

  it('已送達需至少一筆未作廢物流單且全部送達：一筆已作廢、兩筆運送中都配達 → 出貨單已送達並寫入送達數量', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [
          lo('SH-TEST-A-001', '已作廢'),
          lo('SH-TEST-A-002', '運送中', { tracking_no: 'H2' }),
          lo('SH-TEST-A-003', '運送中', { tracking_no: 'H3' }),
        ],
      }),
    ]);
    reply('SH-TEST-A-002', '配達');
    expect(shipmentStatusOf(get())).toBe('運送中');
    reply('SH-TEST-A-003', '配達');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(100);
  });
});

// ── 12.21、12.36 出貨動作 ──

describe('12.21、12.36 出貨動作：第三方拋單、專車與其他出貨確認、自取標記可自取；拋單失敗不推進', () => {
  beforeEach(() => seed([]));

  const one = (method, n = 2, extra = {}) =>
    sh({
      method,
      logisticsOrders: [lo('SH-TEST-A-001', '可出貨', extra)],
      boxes: Array.from({ length: n }, (_, i) => box(String(i + 1).padStart(3, '0'), 'SH-TEST-A-001')),
    });

  it('第三方拋單後物流單號與子單號由物流商回傳：順豐 3 箱拋單 → 物流單轉等待出貨、寫入物流單號、標籤與三個子單號；出貨單轉等待出貨、仍屬未離廠', () => {
    seed([one('順豐', 3)]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    const l = lget('SH-TEST-A-001');
    expect(l.status).toBe('等待出貨');
    expect(l.tracking_no).toMatch(/^SF\d{9}$/);
    expect(l.label_file).toContain(l.tracking_no);
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual(['001', '002', '003'].map((n) => `${l.tracking_no}${n}`));
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(isNotDeparted(get())).toBe(true);
    expect(isFullyDeparted(get())).toBe(false);
    expect('left_at' in l).toBe(false);
    expect('actual_ship_date' in get()).toBe(false);
  });

  it('拋單成功記入物流單歷程並帶物流單號：一筆「拋單成功」含時間、操作人與物流單號', () => {
    seed([one('順豐', 1)]);
    store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    const l = lget('SH-TEST-A-001');
    const entry = l.history.at(-1);
    expect(entry.event).toContain('拋單成功');
    expect(entry.actor).toBe('曾志偉');
    expect(entry.at).toBeTruthy();
    expect(JSON.stringify(entry)).toContain(l.tracking_no);
  });

  it('專車與其他出貨確認：物流單轉已出貨、沒有物流單號；自取標記可自取：物流單轉可自取；出貨單皆為已出貨', () => {
    ['專車配送', '其他'].forEach((m) => {
      seed([one(m)]);
      store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
      expect(lget('SH-TEST-A-001').status, m).toBe('已出貨');
      expect(lget('SH-TEST-A-001').tracking_no, m).toBeNull();
      expect(shipmentStatusOf(get()), m).toBe('已出貨');
    });
    seed([one('自取')]);
    store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(lget('SH-TEST-A-001').status).toBe('可自取');
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });

  it('拋單失敗時物流單不推進、不設重試：連按兩次都回錯誤訊息、單與歷程不變、不存失敗原因；期間揀貨人員有修正與撤回、業務有作廢出貨單、物流單列沒有作廢物流單；改箱規後第三次成功，之後沒有撤回', () => {
    seed([one('順豐', 2, { simulated_carrier_reply: 'reject' })]);
    const before = JSON.stringify(get());
    for (let i = 0; i < 2; i += 1) {
      const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
      expect(r.ok).toBe(false);
      expect(r.error).toBeTruthy();
      expect(r.error).not.toMatch(/箱規|尺寸|材積/);
    }
    expect(JSON.stringify(get())).toBe(before);
    expect(lget('SH-TEST-A-001')).not.toHaveProperty('dispatch_error');
    expect(store().retryDispatch).toBeUndefined();
    expect(isNotDeparted(get())).toBe(true);
    expect(canCorrectPacking(get())).toBe(true);
    expect(withdrawShippableCheck(get()).allowed).toBe(true);
    expect(logisticsActionsOf({ role: 'sales', shipment: get(), logistics: lget('SH-TEST-A-001'), canVoid: true })).not.toContain(L.VOID);

    const fixed = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(get()).map((b) => ({ ...b, ...f13 })),
      reason: '物流商拒收，改用較小的箱子',
      operator: '范姜宏',
    });
    expect(fixed.ok).toBe(true);
    const third = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(third.ok).toBe(true);
    expect(lget('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lget('SH-TEST-A-001').tracking_no).toBeTruthy();
    expect(withdrawShippableCheck(get()).allowed).toBe(false);
  });

  it('一筆成功一筆失敗仍屬未離廠：出貨單為可出貨；修正只開放兩箱的修改；沒有撤回；可出貨那一筆對業務渲染作廢物流單', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-001'), lo('SH-TEST-A-002', '可出貨', { simulated_carrier_reply: 'reject' })],
      }),
    ]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-002', { operator: '曾志偉' }).ok).toBe(false);
    expect(shipmentStatusOf(get())).toBe('可出貨');
    expect(isNotDeparted(get())).toBe(true);
    expect(isPartiallyDeparted(get())).toBe(false);
    expect(packingCorrectionScope(get())).toEqual({ pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: ['001', '002'] });
    expect(withdrawShippableCheck(get()).allowed).toBe(false);
    expect(logisticsActionsOf({ role: 'sales', shipment: get(), logistics: lget('SH-TEST-A-002'), canVoid: true })).toContain(L.VOID);
  });

  it('只有可出貨的物流單可做出貨動作：已拋單的不重送', () => {
    seed([one('順豐')]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    const tracking = lget('SH-TEST-A-001').tracking_no;
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(false);
    expect(lget('SH-TEST-A-001').tracking_no).toBe(tracking);
  });

  it('確認可出貨之後出貨動作不再檢查揀貨是否相符', () => {
    const base = one('專車配送');
    seed([{ ...base, details: [{ ...base.details[0], picked_qty: 80 }] }]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
  });

  it('所屬訂單已取消時出貨動作被擋下、物流單列不渲染出貨動作', () => {
    seed([one('順豐')], { orderStatus: '已取消' });
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(ORDER_CANCELLED_HINT);
    expect(lget('SH-TEST-A-001').status).toBe('可出貨');
  });
});

// ── 12.43 拋單逾時 ──

describe('12.43 拋單逾時視為失敗：物流單維持可出貨、不寫入物流單號與標籤、不存失敗原因', () => {
  it('單筆拋單逾時：回傳逾時失敗，物流單與出貨單維持可出貨，物流單列仍渲染拋單', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '可出貨', { simulated_carrier_reply: 'timeout' })] })]);
    const before = JSON.stringify(get());
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.timeout).toBe(true);
    expect(r.error).toBe(DISPATCH_TIMEOUT_HINT);
    expect(JSON.stringify(get())).toBe(before);
    expect(lget('SH-TEST-A-001')).toMatchObject({ status: '可出貨', tracking_no: null, label_file: null });
    expect(shipmentStatusOf(get())).toBe('可出貨');
    expect(logisticsActionsOf({ role: 'shipper', shipment: get(), logistics: lget('SH-TEST-A-001') })).toContain(L.DISPATCH);
  });

  it('批次拋單中某一筆逾時：該筆結果標逾時、停在可出貨，其他筆照常成功', () => {
    seed([
      sh({
        method: '全家',
        logisticsOrders: [lo('SH-TEST-A-001'), lo('SH-TEST-A-002', '可出貨', { simulated_carrier_reply: 'timeout' })],
      }),
    ]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.results).toEqual([
      expect.objectContaining({ logistics_order_no: 'SH-TEST-A-001', ok: true }),
      expect.objectContaining({ logistics_order_no: 'SH-TEST-A-002', ok: false, timeout: true, error: DISPATCH_TIMEOUT_HINT }),
    ]);
    expect(lget('SH-TEST-A-002').status).toBe('可出貨');
  });
});

// ── 12.50 第三方物流只依物流商回傳推進 ──

describe('12.50 第三方物流只依物流商回傳推進：不經已出貨、只往前、終態不動', () => {
  it('物流商回傳的對映（純函式）：已登記追蹤不改狀態、在途與到店轉運送中、配達與取件完成轉已送達、倒退不改、終態不動', () => {
    const t = (status, r, method = '順豐') => carrierReplyTransition({ method, status, reply: r });
    expect(t('等待出貨', '已登記追蹤')).toEqual({ status: '等待出貨', changed: false });
    expect(t('等待出貨', '在途')).toEqual({ status: '運送中', changed: true });
    expect(t('等待出貨', '配達')).toEqual({ status: '已送達', changed: true });
    expect(t('等待出貨', '到店', '7-11 交貨便')).toEqual({ status: '運送中', changed: true });
    expect(t('運送中', '取件完成', '全家')).toEqual({ status: '已送達', changed: true });
    expect(t('運送中', '已登記追蹤')).toEqual({ status: '運送中', changed: false });
    expect(t('已送達', '在途')).toEqual({ status: '已送達', changed: false });
    expect(t('已作廢', '配達')).toEqual({ status: '已作廢', changed: false });
    expect(t('運送中', '例外事故')).toEqual({ status: '例外事故', changed: true });
    expect(t('無追蹤中包裹', '在途')).toEqual({ status: '運送中', changed: true });
    ['等待出貨', '運送中'].forEach((s) => {
      ['已登記追蹤', '在途', '到店', '配達', '取件完成'].forEach((r) => {
        expect(t(s, r).status, `${s} ${r}`).not.toBe('已出貨');
      });
    });
  });

  it('物流商依序回傳在途與配達：順豐已登記追蹤不改狀態（仍寫歷程）；依序轉運送中、已送達，不經已出貨；出貨單依序運送中、已送達，不必另做送達確認', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'SF1' })] })]);
    const historyBefore = lget('SH-TEST-A-001').history.length;
    const tracked = reply('SH-TEST-A-001', '已登記追蹤');
    expect(tracked).toMatchObject({ ok: true, changed: false });
    expect(lget('SH-TEST-A-001').status).toBe('等待出貨');
    expect(lget('SH-TEST-A-001').history.length).toBe(historyBefore + 1);
    reply('SH-TEST-A-001', '在途');
    expect(lget('SH-TEST-A-001').status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
    reply('SH-TEST-A-001', '配達', 'a', '2026-10-21 14:00');
    expect(lget('SH-TEST-A-001')).toMatchObject({ status: '已送達', delivered_by: CARRIER_SYNC_ACTOR, delivered_at: '2026-10-21 14:00' });
    expect(shipmentStatusOf(get())).toBe('已送達');
    const statuses = lget('SH-TEST-A-001').history.flatMap((h) => h.changes ?? []).map((c) => c.after);
    expect(statuses).not.toContain('已出貨');
  });

  it('超商到店對映運送中：7-11 回傳到店 → 運送中、不是已送達；取件完成才轉已送達', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'P1' })] })]);
    reply('SH-TEST-A-001', '到店');
    expect(lget('SH-TEST-A-001').status).toBe('運送中');
    reply('SH-TEST-A-001', '取件完成');
    expect(lget('SH-TEST-A-001').status).toBe('已送達');
  });

  it('已作廢物流單收到配達回傳只寫歷程：維持已作廢、未送達數量 40 不變，出貨單狀態與可出貨額度不變', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          lo('SH-TEST-A-001', '已作廢', { tracking_no: 'P1', undelivered: [{ print_item_no: NO, qty: 40 }] }),
          lo('SH-TEST-A-002', '運送中', { tracking_no: 'P2' }),
        ],
      }),
    ]);
    const statusBefore = shipmentStatusOf(get());
    const quotaBefore = quota(100);
    const historyBefore = lget('SH-TEST-A-001').history.length;
    const r = reply('SH-TEST-A-001', '配達');
    expect(r.changed).toBe(false);
    expect(lget('SH-TEST-A-001').status).toBe('已作廢');
    expect(lget('SH-TEST-A-001').undelivered).toEqual([{ print_item_no: NO, qty: 40 }]);
    expect(lget('SH-TEST-A-001').history.length).toBe(historyBefore + 1);
    expect(shipmentStatusOf(get())).toBe(statusBefore);
    expect(quota(100)).toBe(quotaBefore);
  });

  it('人工送達確認與物流商回傳同時到時先寫入者成立：配達回傳先寫入，出貨人員隨後送出 → 不改任何欄位、提示此單已收尾請重新整理', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '運送中', { tracking_no: 'H1' })] })]);
    reply('SH-TEST-A-001', '配達', 'a', '2026-10-21 09:30');
    const before = JSON.stringify(get());
    const late = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(late.ok).toBe(false);
    expect(late.settledAlready).toBe(true);
    expect(late.error).toBe(SETTLED_ALREADY_HINT);
    expect(JSON.stringify(get())).toBe(before);
    expect(lget('SH-TEST-A-001')).toMatchObject({ delivered_by: CARRIER_SYNC_ACTOR, delivered_at: '2026-10-21 09:30' });
  });

  it('第三方物流不開放人工標記例外：繞過介面送出擋下、維持運送中', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '運送中', { tracking_no: 'H1' })] })]);
    const r = store().markLogisticsException('a', 'SH-TEST-A-001', { kind: '例外事故', reason: '想撤回', operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(lget('SH-TEST-A-001').status).toBe('運送中');
  });

  it('物流商回傳例外後依下一次回傳恢復：7-11 一筆收到無追蹤中包裹 → 出貨單異常；下一次回傳運送中 → 恢復運送中；沒有人工取回物流商狀態的動作', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(3).map((n) => lo(n, '運送中', { tracking_no: `P-${n}` })) })]);
    reply('SH-TEST-A-002', '無追蹤中包裹');
    expect(lget('SH-TEST-A-002')).toMatchObject({ status: '無追蹤中包裹', exception_source: 'carrier' });
    expect(shipmentStatusOf(get())).toBe('異常');
    reply('SH-TEST-A-002', '在途');
    expect(lget('SH-TEST-A-002').status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(store().syncLogistics).toBeUndefined();
  });

  it('配達回傳未進來時由出貨人員備援確認：等待出貨的新竹物流單回填配達時間做送達確認 → 已送達、確認人為該出貨人員', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'H1' })] })]);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', delivered_at: '2026-10-20 15:30' });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-001')).toMatchObject({ status: '已送達', delivered_by: '曾志偉', delivered_at: '2026-10-20 15:30' });
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(100);
  });
});

// ── 12.34 作廢物流單與回補 ──

describe('12.34 作廢物流單：依未送達數量重算佔用、最後一筆系統預填、不重複回補', () => {
  it('逐筆作廢物流單，最後一筆系統預填並使出貨單作廢：7-11 明細 100 三筆運送中、額度 400 → 作廢 30 後 430、作廢 40 後 470、第三筆預填 30 不可改、出貨單已作廢、額度 500', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(3).map((n) => lo(n, '運送中', { tracking_no: `P-${n}` })) })]);
    expect(quota(500)).toBe(400);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '一箱遺失', undelivered: { [NO]: 30 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(500)).toBe(430);
    store().voidLogistics('a', 'SH-TEST-A-002', { reason: '一箱遺失', undelivered: { [NO]: 40 }, operator: '洪嘉駿' });
    expect(quota(500)).toBe(470);
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(lastLogisticsFillOf(get(), 'SH-TEST-A-003')).toEqual({ [NO]: 30 });
    store().voidLogistics('a', 'SH-TEST-A-003', { reason: '一箱遺失', undelivered: { [NO]: 5 }, operator: '洪嘉駿' });
    expect(lget('SH-TEST-A-003').undelivered).toEqual([{ print_item_no: NO, qty: 30 }]);
    expect(shipmentStatusOf(get())).toBe('已作廢');
    expect(quota(500)).toBe(500);
  });

  it('其餘物流單都已作廢時剩下這一筆的作廢：專車唯一一筆在例外事故 → 預填 100 不可改、作廢後出貨單已作廢、不要求出貨單作廢理由', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-001', '例外事故', { exception_source: 'manual' })] })]);
    expect(lastLogisticsFillOf(get(), 'SH-TEST-A-001')).toEqual({ [NO]: 100 });
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '客戶拒收', operator: '洪嘉駿' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('已作廢');
  });

  it('第三方物流在等待出貨與運送中可直接作廢：新竹三筆（等待出貨、運送中、運送中）、額度 0 → 作廢前兩筆（50、30）直接轉已作廢、額度 80、出貨單依第三筆為運送中；不向物流商取消', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [
          lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'H1' }),
          lo('SH-TEST-A-002', '運送中', { tracking_no: 'H2' }),
          lo('SH-TEST-A-003', '運送中', { tracking_no: 'H3' }),
        ],
      }),
    ]);
    expect(quota(100)).toBe(0);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '裝錯', undelivered: { [NO]: 50 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(store().voidLogistics('a', 'SH-TEST-A-002', { reason: '裝錯', undelivered: { [NO]: 30 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect([lget('SH-TEST-A-001').status, lget('SH-TEST-A-002').status]).toEqual(['已作廢', '已作廢']);
    expect(quota(100)).toBe(80);
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(JSON.stringify(lget('SH-TEST-A-001').history)).not.toContain('向物流商取消');
  });

  it('專車已出貨要先轉例外才能作廢：已出貨時作廢被擋下；出貨人員標記例外後業務可作廢', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-001', '已出貨')] })]);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '裝錯', operator: '洪嘉駿' }).ok).toBe(false);
    expect(lget('SH-TEST-A-001').status).toBe('已出貨');
    store().markLogisticsException('a', 'SH-TEST-A-001', { kind: '例外事故', reason: '裝錯貨', operator: '曾志偉' });
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '裝錯', operator: '洪嘉駿' }).ok).toBe(true);
  });

  it('可出貨的物流單只在撤回走不通時可單筆作廢：新竹第 3 筆（另兩筆等待出貨）作廢成立、未送達 20 回補；全家兩筆皆可出貨時作廢被擋下', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'H1' }), lo('SH-TEST-A-002', '等待出貨', { tracking_no: 'H2' }), lo('SH-TEST-A-003')],
      }),
      sh({ id: 'f', shipmentNo: 'SH-TEST-F', method: '全家', qty: 0, logisticsOrders: [lo('SH-TEST-F-001'), lo('SH-TEST-F-002')] }),
    ]);
    const before = quota(200);
    expect(store().voidLogistics('a', 'SH-TEST-A-003', { reason: '拋單一直失敗', undelivered: { [NO]: 20 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(200)).toBe(before + 20);
    expect(store().voidLogistics('f', 'SH-TEST-F-001', { reason: '想作廢', operator: '洪嘉駿' }).ok).toBe(false);
    expect(lget('SH-TEST-F-001', 'f').status).toBe('可出貨');
  });

  it('作廢物流單後依未送達數量重算，不另加回補項：完工良品數 1,000、明細 1,000、一筆作廢未送達 400 → 累計已出貨 600、額度 400', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        qty: 1000,
        logisticsOrders: [lo('SH-TEST-A-001', '已作廢', { undelivered: [{ print_item_no: NO, qty: 400 }] }), lo('SH-TEST-A-002', '運送中')],
      }),
    ]);
    expect(occupiedQtyOf(get(), NO)).toBe(600);
    expect(quota(1000)).toBe(400);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 400 }], shipments: all(), qcRecords: qcOf(1000) }).ok).toBe(true);
  });

  it('守恆鏈不得被違反：完工良品數 950 時，會使累計已出貨數量超過 950 的建單被擋下', () => {
    seed([sh({ method: '順豐', qty: 900, logisticsOrders: [lo('SH-TEST-A-001', '運送中')] })]);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 51 }], shipments: all(), qcRecords: qcOf(950) }).ok).toBe(false);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 50 }], shipments: all(), qcRecords: qcOf(950) }).ok).toBe(true);
  });

  it('重出開新單：原出貨單與原物流單沒有復用入口，已作廢物流單沒有任何動作', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: [lo('SH-TEST-A-001', '已作廢', { undelivered: [{ print_item_no: NO, qty: 40 }] }), lo('SH-TEST-A-002', '運送中')] })]);
    ['reopenShipment', 'restoreLogistics', 'reuseLogistics', 'reviveShipment'].forEach((k) => expect(store()[k], k).toBeUndefined());
    ['sales', 'shipper'].forEach((role) => {
      expect(logisticsActionsOf({ role, shipment: get(), logistics: lget('SH-TEST-A-001'), canVoid: true }), role).toEqual([]);
    });
  });

  it('理由必填；未送達數量上限＝明細數量（同一印件合計）；負數與小數不通過', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(2).map((n) => lo(n, '運送中')) })]);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '  ', operator: '洪嘉駿' }).ok).toBe(false);
    expect(store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', undelivered: { [NO]: 101 }, operator: '洪嘉駿' }).ok).toBe(false);
    store().voidLogistics('a', 'SH-TEST-A-001', { reason: '遺失', undelivered: { [NO]: 60 }, operator: '洪嘉駿' });
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: 41 } }).ok).toBe(false);
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: -1 } }).ok).toBe(false);
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: 1.5 } }).ok).toBe(false);
  });
});

// ── 12.35 送達確認與交付確認（不附照片，可填未送達數量） ──

describe('12.35 送達確認與交付確認不附照片，可選填逐印件未送達數量', () => {
  it('子母單一箱遺失以送達確認填未送達數量：順豐 6 箱明細 600、物流商回傳例外 → 送達確認填 100，物流單與出貨單已送達、送達數量 500、額度回補 100', () => {
    seed([sh({ method: '順豐', qty: 600, logisticsOrders: [lo('SH-TEST-A-001', '例外事故', { exception_source: 'carrier', tracking_no: 'SF1' })] })], { orderedQty: 500 });
    const before = quota(600);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', undelivered: { [NO]: 100 } });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-001').status).toBe('已送達');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(500);
    expect(quota(600)).toBe(before + 100);
    expect('delivery_proof' in lget('SH-TEST-A-001')).toBe(false);
  });

  it('自取客戶只載走一部分：交付確認不附照片、未送達 30 → 已自取、出貨單已送達、送達數量 70、額度 430', () => {
    seed([sh({ method: '自取', logisticsOrders: [lo('SH-TEST-A-001', '可自取')] })]);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', undelivered: { [NO]: 30 } });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-001').status).toBe('已自取');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(70);
    expect(quota(500)).toBe(430);
  });

  it('專車少交一箱以送達確認填未送達數量：未送達 50 → 送達數量 50；合計超過明細數量時擋下', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-001', '已出貨')] })]);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', undelivered: { [NO]: 101 } }).ok).toBe(false);
    expect(lget('SH-TEST-A-001').status).toBe('已出貨');
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-001', { operator: '曾志偉', undelivered: { [NO]: 50 } }).ok).toBe(true);
    expect(lget('SH-TEST-A-001').status).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(50);
  });

  it('同一出貨單的未送達合計跨物流單累計：作廢填過 70，後續送達確認只能填剩下的 30', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [lo('SH-TEST-A-001', '已作廢', { undelivered: [{ print_item_no: NO, qty: 70 }] }), lo('SH-TEST-A-002', '運送中', { tracking_no: 'P2' })],
      }),
    ]);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-002', { operator: '曾志偉', undelivered: { [NO]: 31 } }).ok).toBe(false);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-002', { operator: '曾志偉', undelivered: { [NO]: 30 } }).ok).toBe(true);
    expect(get().details[0].delivered_qty).toBe(0);
  });
});

// ── 12.10、12.38 訂單取消連鎖與集合詞 ──

describe('12.38 三個集合詞依物流單狀態判定、互斥，涵蓋草稿以外的全部未作廢出貨單', () => {
  const tag = (shipment) =>
    [
      ['未離廠', isNotDeparted(shipment)],
      ['部分離廠', isPartiallyDeparted(shipment)],
      ['全數離廠', isFullyDeparted(shipment)],
    ]
      .filter(([, v]) => v)
      .map(([k]) => k);
  const cases = {
    未處理: [{ status: '未處理', logistics_orders: [] }, '未離廠'],
    打包中: [{ status: '打包中', logistics_orders: [] }, '未離廠'],
    已裝箱尚無物流單: [boxedShipment({}), '未離廠'],
    全部可出貨: [sh({ logisticsOrders: [lo('L-1'), lo('L-2')] }), '未離廠'],
    等待出貨: [sh({ logisticsOrders: [lo('L-1', '等待出貨')] }), '未離廠'],
    可出貨與等待出貨: [sh({ logisticsOrders: [lo('L-1', '等待出貨'), lo('L-2')] }), '未離廠'],
    運送中與可出貨: [sh({ logisticsOrders: [lo('L-1', '運送中'), lo('L-2')] }), '部分離廠'],
    運送中與等待出貨: [sh({ logisticsOrders: [lo('L-1', '運送中'), lo('L-2', '等待出貨')] }), '部分離廠'],
    已出貨: [sh({ method: '專車配送', logisticsOrders: [lo('L-1', '已出貨')] }), '全數離廠'],
    全部運送中: [sh({ logisticsOrders: [lo('L-1', '運送中'), lo('L-2', '已送達')] }), '全數離廠'],
    異常: [sh({ logisticsOrders: [lo('L-1', '例外事故')] }), '全數離廠'],
  };

  it('每種單剛好落在一個集合', () => {
    for (const [name, [shipment, expected]] of Object.entries(cases)) {
      expect(tag(shipment), name).toEqual([expected]);
    }
  });

  it('草稿與已作廢不屬任何集合', () => {
    expect(tag({ status: '草稿', logistics_orders: [] })).toEqual([]);
    expect(tag(sh({ status: '已作廢', logisticsOrders: [lo('L-1', '已作廢')] }))).toEqual([]);
  });

  it('已離廠量只算全數離廠者：等待出貨與部分離廠都不算', () => {
    const full = sh({ id: 'f', qty: 40, logisticsOrders: [lo('L-1', '運送中')] });
    const waiting = sh({ id: 'w', qty: 30, logisticsOrders: [lo('L-1', '等待出貨')] });
    const part = sh({ id: 'p', qty: 60, logisticsOrders: [lo('L-1', '運送中'), lo('L-2')] });
    expect(calcShippedQty(printItem, [full, waiting, part])).toBe(40);
  });

  it('等待出貨仍屬未離廠、物流商回傳在途才全數離廠：回傳前業務能作廢出貨單，運送中後作廢不開放', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'SF1' })] })]);
    expect(isNotDeparted(get())).toBe(true);
    reply('SH-TEST-A-001', '在途');
    expect(isFullyDeparted(get())).toBe(true);
    store().voidShipment('a', '客戶取消', '洪嘉駿');
    expect(shipmentStatusOf(get())).toBe('運送中');
  });
});

describe('12.10、12.38 訂單取消連鎖：草稿刪除、未離廠自動作廢、部分離廠擋下出貨動作、全數離廠不動', () => {
  const pre = (id, status) => ({
    id,
    shipment_no: `SH-TEST-${id}`,
    order_no: ORDER_NO,
    status,
    method: '順豐',
    details: status === '草稿' ? [] : [{ print_item_no: NO, name: NAME, qty: 10, picked_qty: null }],
    planned_details: status === '草稿' ? [{ print_item_no: NO, name: NAME, qty: 10 }] : [],
    packing_boxes: [],
    logistics_orders: [],
    packing_corrections: [],
    history: [],
  });
  const ofId = (id, method, statuses) =>
    sh({ id, shipmentNo: `SH-TEST-${id}`, method, qty: 10, logisticsOrders: statuses.map((s, i) => lo(`SH-TEST-${id}-00${i + 1}`, s)) });

  it('三個集合詞各自分流：甲（全部可出貨）、丁（等待出貨＋可出貨）、未處理、打包中、已裝箱轉已作廢、原因訂單取消、物流單一併作廢；草稿刪除；乙（運送中＋可出貨）與丙（全部運送中）維持原狀', () => {
    seed([
      ofId('甲', '新竹物流', ['可出貨', '可出貨']),
      ofId('丁', '新竹物流', ['等待出貨', '可出貨']),
      ofId('乙', '新竹物流', ['運送中', '可出貨']),
      ofId('丙', '新竹物流', ['運送中', '運送中']),
      pre('u', '未處理'),
      pre('k', '打包中'),
      { ...boxed({ id: 'b', shipmentNo: 'SH-TEST-b' }), details: [{ print_item_no: NO, name: NAME, qty: 10, picked_qty: 10 }] },
      pre('d', '草稿'),
    ]);
    const affected = store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(affected.map((v) => v.shipment_no).sort()).toEqual(
      ['SH-TEST-甲', 'SH-TEST-丁', 'SH-TEST-u', 'SH-TEST-k', 'SH-TEST-b', 'SH-TEST-d'].sort(),
    );
    ['甲', '丁', 'u', 'k', 'b'].forEach((id) => {
      expect(shipmentStatusOf(get(id)), id).toBe('已作廢');
      expect(get(id).void_reason, id).toBe('訂單取消');
      get(id).logistics_orders.forEach((l) => expect(l.status, id).toBe('已作廢'));
    });
    expect(all().some((x) => x.id === 'd')).toBe(false);
    expect(shipmentStatusOf(get('乙'))).toBe('可出貨');
    expect(los('乙').map((l) => l.status)).toEqual(['運送中', '可出貨']);
    expect(shipmentStatusOf(get('丙'))).toBe('運送中');
  });

  it('訂單取消連鎖不另設狀態：可出貨的出貨單經既有作廢轉入已作廢，單上不多出連鎖專用的欄位', () => {
    seed([ofId('甲', '順豐', ['可出貨'])]);
    const keysBefore = new Set(Object.keys(get('甲')));
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(get('甲').status).toBe('已作廢');
    const extra = Object.keys(get('甲')).filter((k) => !keysBefore.has(k) && !['void_reason', 'void_at'].includes(k));
    expect(extra).toEqual([]);
  });

  it('未離廠且有物流單已拋單時系統照常作廢：順豐唯一一筆在等待出貨 → 出貨單與物流單已作廢、原因訂單取消、明細回補額度；不向物流商取消', () => {
    seed([ofId('w', '順豐', ['等待出貨'])]);
    expect(quota(10)).toBe(0);
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(get('w').status).toBe('已作廢');
    expect(get('w').void_reason).toBe('訂單取消');
    expect(lget('SH-TEST-w-001', 'w').status).toBe('已作廢');
    expect(quota(10)).toBe(10);
    expect(JSON.stringify(get('w').history)).not.toContain('向物流商取消');
  });

  it('部分離廠的出貨單擋下其餘出貨動作、未離廠的物流單由業務作廢：7-11 三筆（運送中、等待出貨、可出貨）→ 第 3 筆拋單擋下、不渲染出貨動作；業務作廢第 2、3 筆成立、回補，出貨單依第 1 筆為運送中', () => {
    seed([ofId('p', '7-11 交貨便', ['運送中', '等待出貨', '可出貨'])], { orderStatus: '已取消' });
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(los('p').map((l) => l.status)).toEqual(['運送中', '等待出貨', '可出貨']);
    expect(store().dispatchLogistics('p', 'SH-TEST-p-003', { operator: '曾志偉' }).ok).toBe(false);
    expect(
      logisticsActionsOf({ role: 'shipper', shipment: get('p'), logistics: lget('SH-TEST-p-003', 'p'), orderCancelled: true }),
    ).not.toContain(L.DISPATCH);
    const before = quota(10);
    expect(store().voidLogistics('p', 'SH-TEST-p-002', { reason: '訂單取消', undelivered: { [NO]: 3 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(store().voidLogistics('p', 'SH-TEST-p-003', { reason: '訂單取消', undelivered: { [NO]: 3 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(10)).toBe(before + 6);
    expect(shipmentStatusOf(get('p'))).toBe('運送中');
  });
});

// ── 12.41 批次拋單 ──

describe('12.41 批次拋單：對本單每一筆可出貨的物流單各執行一次拋單，逐筆獨立', () => {
  const resultNos = (r) => r.results.map((x) => x.logistics_order_no);

  it('批次拋單全部成功：7-11 5 筆各轉等待出貨、各有物流單號；出貨單等待出貨、仍屬未離廠；每筆各一筆拋單成功、出貨單不另記批次事件；之後不再渲染批次拋單', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(5).map((n) => lo(n)) })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results.every((x) => x.ok && x.tracking_no)).toBe(true);
    expect(los().every((l) => l.status === '等待出貨' && l.tracking_no)).toBe(true);
    expect(new Set(los().map((l) => l.tracking_no)).size).toBe(5);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
    expect(isNotDeparted(get())).toBe(true);
    los().forEach((l) => expect(l.history.filter((h) => h.event.startsWith('拋單成功')), l.logistics_order_no).toHaveLength(1));
    expect(get().history.some((h) => h.event.includes('批次'))).toBe(false);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() }).visible).toBe(false);
  });

  it('批次拋單部分失敗：新竹 3 筆、拒收第 3 筆 → 第 1、2 筆等待出貨、第 3 筆停在可出貨；結果 2 成功 1 失敗附錯誤訊息；出貨單可出貨、屬未離廠、批次拋單仍渲染；再按只送第 3 筆', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001'), lo('SH-TEST-A-002'), lo('SH-TEST-A-003', '可出貨', { simulated_carrier_reply: 'reject' })] })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.results.map((x) => x.ok)).toEqual([true, true, false]);
    expect(r.results[2].error).toBeTruthy();
    expect(lget('SH-TEST-A-003')).toMatchObject({ status: '可出貨', tracking_no: null });
    expect(shipmentStatusOf(get())).toBe('可出貨');
    expect(isNotDeparted(get())).toBe(true);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() })).toMatchObject({ visible: true, disabled: false });
    expect(resultNos(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }))).toEqual(['SH-TEST-A-003']);
  });

  it('支援子母單的出貨單批次拋單只送一筆：順豐 5 箱一筆 → 只送這一筆，主單號與 5 個子單號寫入、物流單與出貨單轉等待出貨', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-001')], boxes: ['001', '002', '003', '004', '005'].map((n) => box(n, 'SH-TEST-A-001')) })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultNos(r)).toEqual(['SH-TEST-A-001']);
    const l = lget('SH-TEST-A-001');
    expect(l.status).toBe('等待出貨');
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual(['001', '002', '003', '004', '005'].map((n) => `${l.tracking_no}${n}`));
    expect(shipmentStatusOf(get())).toBe('等待出貨');
  });

  it('出貨單異常時只送可出貨的物流單：例外、等待出貨、可出貨三筆 → 只送第 3 筆；出貨單仍為異常；之後批次拋單停用並顯示理由', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          lo('SH-TEST-A-001', '例外事故', { exception_source: 'carrier' }),
          lo('SH-TEST-A-002', '等待出貨', { tracking_no: 'PYU-2' }),
          lo('SH-TEST-A-003'),
        ],
      }),
    ]);
    expect(resultNos(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }))).toEqual(['SH-TEST-A-003']);
    expect(lget('SH-TEST-A-003').status).toBe('等待出貨');
    expect(lget('SH-TEST-A-001').status).toBe('例外事故');
    expect(lget('SH-TEST-A-002').tracking_no).toBe('PYU-2');
    expect(shipmentStatusOf(get())).toBe('異常');
    const btn = batchDispatchOf({ role: 'shipper', shipment: get() });
    expect(btn).toMatchObject({ visible: true, disabled: true });
    expect(btn.reason).toBeTruthy();
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
  });

  it('訂單已取消時部分離廠出貨單的批次拋單逐筆失敗：可出貨那一筆擋下並列理由，運送中那一筆不變', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '運送中', { tracking_no: 'HCT-1' }), lo('SH-TEST-A-002')] })], { orderStatus: '已取消' });
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results).toEqual([expect.objectContaining({ logistics_order_no: 'SH-TEST-A-002', ok: false, error: ORDER_CANCELLED_HINT })]);
    expect(lget('SH-TEST-A-002').status).toBe('可出貨');
    expect(lget('SH-TEST-A-001')).toMatchObject({ status: '運送中', tracking_no: 'HCT-1' });
  });

  it('出貨動作不是拋單的出貨方式、或出貨單不在可出貨與異常：直接呼叫擋下', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      seed([sh({ method, logisticsOrders: [lo('SH-TEST-A-001')] })]);
      expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok, method).toBe(false);
      expect(lget('SH-TEST-A-001').status, method).toBe('可出貨');
    });
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨')] })]);
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
    seed([boxed({ method: '新竹物流' })]);
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
  });
});

// ── 12.45 裝箱回報修正與拒收 ──

describe('12.45 確認可出貨之後的裝箱回報修正：只改所屬物流單未離廠的箱、不能增刪箱，被拒收的一箱改箱規或作廢物流單', () => {
  const rejected = (stillReject = false) =>
    sh({
      method: '7-11 交貨便',
      logisticsOrders: [
        lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'PYU-1' }),
        lo('SH-TEST-A-002', '等待出貨', { tracking_no: 'PYU-2' }),
        lo('SH-TEST-A-003', '可出貨', stillReject ? { simulated_carrier_reply: 'reject' } : {}),
        lo('SH-TEST-A-004', '等待出貨', { tracking_no: 'PYU-4' }),
      ],
    });

  it('改被拒收那一箱的箱規再拋單：第 3 箱改 F13 箱帶入 29、21、6，箱規長寬高各一筆修正紀錄；揀貨數量與其他箱不變；第 3 筆拋單成功後出貨單轉等待出貨', () => {
    seed([rejected(true)]);
    const before = get();
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(before).map((b) => (b.box_no === '003' ? { ...b, ...f13 } : b)),
      reason: '第 3 箱超過物流商尺寸上限被拒收，改小一號',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    expect(get().packing_corrections.map((c) => c.field)).toEqual(['第 003 箱 箱規', '第 003 箱 長', '第 003 箱 寬', '第 003 箱 高']);
    expect(get().details[0].picked_qty).toBe(100);
    ['001', '002', '004'].forEach((n) => expect(get().packing_boxes.find((b) => b.box_no === n)).toEqual(before.packing_boxes.find((b) => b.box_no === n)));
    expect(los().map((l) => l.status)).toEqual(['等待出貨', '等待出貨', '可出貨', '等待出貨']);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-003', { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('等待出貨');
  });

  it('確認可出貨後不能新增箱，被拒收的一箱以作廢物流單處理：新增箱被擋下、不產生 -005；沒有撤回；業務作廢第 3 筆、未送達回補；其他筆不變、箱數維持 4', () => {
    seed([rejected(true)]);
    expect(packingCorrectionScope(get())).toMatchObject({ addBox: false, deleteBox: false });
    const add = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [...keepBoxes(get()), { box_spec: 'F13 箱', photos: photo, note: '' }],
      reason: '拆成兩箱',
      operator: '范姜宏',
    });
    expect(add.ok).toBe(false);
    expect(los().map((l) => l.logistics_order_no)).toEqual(nos3(4));
    expect(withdrawShippableCheck(get()).allowed).toBe(false);
    const others = los().filter((l) => l.logistics_order_no !== 'SH-TEST-A-003');
    const before = quota(500);
    expect(store().voidLogistics('a', 'SH-TEST-A-003', { reason: '改箱規仍被拒收', undelivered: { [NO]: 25 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(500)).toBe(before + 25);
    expect(los().filter((l) => l.logistics_order_no !== 'SH-TEST-A-003')).toEqual(others);
    expect(boxCountOf(get())).toBe(4);
  });

  it('全數離廠後沒有裝箱回報修正：三筆運送中 → 揀貨人員沒有修正；繞過介面改第 2 箱箱規擋下、什麼都不變', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos3(3).map((n) => lo(n, '運送中')) })]);
    expect(canCorrectPacking(get())).toBe(false);
    const before = JSON.stringify(get());
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(get()).map((b) => (b.box_no === '002' ? { ...b, ...f13 } : b)),
      reason: '裝錯箱',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(get())).toBe(before);
  });
});

// ── 12.49 單筆下載物流單檔案 ──

describe('12.49 單筆下載物流單檔案：任何未作廢物流單可直接下載，已作廢者不提供', () => {
  it('還沒拋單也可下載：鏈九 SH-2026-0921-001（專車配送、可出貨、沒有物流商標籤）→ 直接提供檔案，含整張出貨單印件與數量、沒有物流商標籤；下載中心不新增資料列、狀態不變', () => {
    const chain9 = MOCK_SHIPMENTS.find((x) => x.shipment_no === 'SH-2026-0921');
    expect(chain9).toBeTruthy();
    expect(chain9.method).toBe('專車配送');
    expect(chain9.logistics_orders.map((l) => [l.logistics_order_no, l.status])).toEqual([['SH-2026-0921-001', '可出貨']]);
    const withVoided = {
      ...chain9,
      logistics_orders: [...chain9.logistics_orders, logistics('SH-2026-0921-002', '已作廢')],
    };
    seed([withVoided]);
    const r = logisticsFileOf({ shipment: withVoided, logisticsOrderNo: 'SH-2026-0921-001' });
    expect(r.ok).toBe(true);
    expect(r.file.carrier_label).toBeNull();
    expect(r.file.detail_lines).toEqual(withVoided.details.map((d) => ({ print_item_no: d.print_item_no, name: d.name, qty: d.qty })));
    expect(logisticsFileOf({ shipment: withVoided, logisticsOrderNo: 'SH-2026-0921-002' }).ok).toBe(false);

    const statusBefore = withVoided.logistics_orders.map((l) => l.status);
    const viaStore = store().downloadLogisticsFile(withVoided.id, 'SH-2026-0921-001');
    expect(viaStore.ok).toBe(true);
    expect(store().downloadLogisticsFile(withVoided.id, 'SH-2026-0921-002').ok).toBe(false);
    expect(store().downloadFiles).toEqual([]);
    expect(get(withVoided.id).logistics_orders.map((l) => l.status)).toEqual(statusBefore);
    expect(shipmentStatusOf(get(withVoided.id))).toBe('可出貨');
  });

  it('已拋單的物流單檔案附物流商標籤', () => {
    const shipment = sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-001', '等待出貨', { tracking_no: 'HCT-1', label_file: '物流單-HCT-1.pdf' })] });
    expect(logisticsFileOf({ shipment, logisticsOrderNo: 'SH-TEST-A-001' }).file.carrier_label).toBe('物流單-HCT-1.pdf');
  });

  it('鏈九另兩張：SH-2026-0922 順豐已裝箱尚無物流單、SH-2026-0923 7-11 交貨便未處理', () => {
    const of = (no) => MOCK_SHIPMENTS.find((x) => x.shipment_no === no);
    expect(of('SH-2026-0922')).toMatchObject({ method: '順豐', status: '已裝箱', logistics_orders: [] });
    expect(of('SH-2026-0922').packing_boxes).toHaveLength(3);
    expect(of('SH-2026-0923')).toMatchObject({ method: '7-11 交貨便', status: '未處理' });
  });
});

// ── 12.54 分次驗收與分批出貨的跨模組接力 ──

describe('12.54 分次驗收與分批出貨：數量帳每一步對得上（business-scenarios spec § 品檢與出貨）', () => {
  it('購買 1,000、分兩批驗收與兩張出貨單（A 順豐 2 箱、B 自取 1 箱）逐步驗印件印製、可出貨額度、出貨單與物流單', () => {
    seed([], { orderStatus: '製作中', orderedQty: 1000, itemStatus: '製作中' });
    const qc = [{ print_item_no: NO, passed_qty: 500, failed_qty: 0 }];
    const q = () => calcShippableQty(printItem, all(), qc);
    const item = () => useOrdersStore.getState().orders[0].print_items[0];
    const header = { planned_ship_date: '2026-10-20', receiver_name: '周雅文', receiver_phone: '02-2790-6611', receiver_address: '台北市內湖區文德路 168 號 3 樓', packing_note: '', note: '' };
    const createShipment = (method) => {
      const id = store().createDraft({ order_no: ORDER_NO, client_name: '樣本客戶', created_by: '洪嘉駿', method, planned_details: [{ print_item_no: NO, name: NAME, qty: 500 }], ...header });
      store().finalizeShipment(id, { details: [{ print_item_no: NO, name: NAME, qty: 500 }], method, operator: '洪嘉駿', ...header });
      return id;
    };
    const pack = (id, n) =>
      store().reportPacking(id, {
        lines: [{ print_item_no: NO, picked_qty: 500 }],
        boxes: Array.from({ length: n }, () => ({ box_spec: '1 號箱', photos: photo, note: '' })),
        operator: '范姜宏',
      });

    // 步驟 1：首批驗收通過 500
    expect(q()).toBe(500);
    expect(item().print_item_status).toBe('製作中');
    // 步驟 2：業務建出貨單 A
    const a = createShipment('順豐');
    expect(item().print_item_status).toBe('出貨中');
    expect(q()).toBe(0);
    expect(shipmentStatusOf(get(a))).toBe('未處理');
    // 步驟 3：揀貨、裝箱回報 2 箱，尚無物流單
    store().startPicking(a, '范姜宏');
    expect(shipmentStatusOf(get(a))).toBe('打包中');
    expect(pack(a, 2).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('已裝箱');
    expect(los(a)).toEqual([]);
    // 步驟 4：確認可出貨，產生一筆可出貨物流單
    expect(store().confirmShippable(a, { operator: '范姜宏' }).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('可出貨');
    expect(los(a).map((l) => l.status)).toEqual(['可出貨']);
    expect(q()).toBe(0);
    // 步驟 5：拋單成功 → 等待出貨；物流商回傳在途 → 運送中
    const aNo = los(a)[0].logistics_order_no;
    expect(store().dispatchLogistics(a, aNo, { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('等待出貨');
    reply(aNo, '在途', a);
    expect(shipmentStatusOf(get(a))).toBe('運送中');
    // 步驟 6：第二批驗收通過 500
    qc.push({ print_item_no: NO, passed_qty: 500, failed_qty: 0 });
    expect(q()).toBe(500);
    // 步驟 7：業務建出貨單 B
    const b = createShipment('自取');
    expect(q()).toBe(0);
    expect(shipmentStatusOf(get(b))).toBe('未處理');
    // 步驟 8：物流商回傳 A 配達，A 送達數量 500，印件仍出貨中
    reply(aNo, '配達', a);
    expect(shipmentStatusOf(get(a))).toBe('已送達');
    expect(get(a).details[0].delivered_qty).toBe(500);
    expect(item().print_item_status).toBe('出貨中');
    expect(q()).toBe(0);
    // 步驟 9：B 揀貨、裝箱、確認可出貨、標記可自取、交付確認 → 印件已送達
    store().startPicking(b, '范姜宏');
    pack(b, 1);
    store().confirmShippable(b, { operator: '范姜宏' });
    const bNo = los(b)[0].logistics_order_no;
    store().dispatchLogistics(b, bNo, { operator: '曾志偉' });
    expect(lget(bNo, b).status).toBe('可自取');
    expect(store().confirmLogisticsDelivery(b, bNo, { operator: '曾志偉' }).ok).toBe(true);
    expect(lget(bNo, b).status).toBe('已自取');
    expect(shipmentStatusOf(get(b))).toBe('已送達');
    expect(get(b).details[0].delivered_qty).toBe(500);
    expect(item().print_item_status).toBe('已送達');
    expect(q()).toBe(0);
  });
});
