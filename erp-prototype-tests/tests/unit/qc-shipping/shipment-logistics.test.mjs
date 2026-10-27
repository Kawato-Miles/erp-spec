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
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  calcShippableQty,
  calcShippedQty,
  DISPATCH_TIMEOUT_HINT,
  NOT_THIRD_PARTY_DISPATCH_HINT,
  ORDER_CANCELLED_HINT,
  SETTLED_ALREADY_HINT,
  useQcShippingStore,
  validateShipmentQuota,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import {
  BATCH_DISPATCH_NO_SHIPPABLE_HINT,
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { box, boxedShipment, departed, dispatched, logistics, packedShipment, undispatched } from './_fixtures.mjs';

// 情境 12.32～12.38、12.41、12.43、12.45、12.49、12.50、12.54、12.55 的規則驗算（出貨單、裝箱資料、物流單三層）。
// 期望值取自 shipment spec 各 Requirement 的驗收條目、business-scenarios spec § 品檢與出貨，
// 以及對齊後端第一版的拍板決定表（2026-10-27）。
// 物流單於確認可出貨時產生、貨態待出貨；第三方物流另有拋單狀態（未拋單 → 拋單成功／拋單失敗），
// 拋單成功後貨態只依物流商回傳推進（不經已出貨）。部分物流單拋單成功時出貨單停在已確認，全部成功才轉待出貨。
// 物流商回傳以純函式 carrierReplyTransition 與 store 的 receiveCarrierReply 驗（畫面不加示意鈕）。
// 物流商拒收與逾時以物流單上的 Prototype 模擬開關 simulated_carrier_reply 驗（只失敗一次，再次拋單即成功）。
// 物流單沒有獨立歷程：拋單、貨態更新等事件都記在出貨單歷程，事件文字帶「（物流單 <我方自編單號>）」。
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

// 樣本物流單：state 為「未拋單」「拋單失敗」「拋單成功」（貨態都在待出貨），其餘值當貨態（已拋單成功之後的貨態）。
// 非第三方物流的拋單狀態由 packedShipment 清成 null。樣本的 id 與我方自編單號取同一個值。
const lo = (id, state = '未拋單', extra = {}) => {
  if (state === '未拋單') return undispatched(id, extra);
  if (state === '拋單失敗') return logistics(id, '待出貨', { dispatch_status: '拋單失敗', dispatch_error: '樣本失敗原因', ...extra });
  if (state === '拋單成功') return dispatched(id, extra);
  return departed(id, state, extra);
};
// 我方自編單號＝出貨單編號＋兩碼流水
const nos = (n, prefix = 'SH-TEST-A') => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
const get = (id = 'a') => useQcShippingStore.getState().shipments.find((x) => x.id === id);
const los = (id = 'a') => get(id).logistics_orders;
const lget = (lid, id = 'a') => los(id).find((l) => l.id === lid);
const store = () => useQcShippingStore.getState();
const all = () => useQcShippingStore.getState().shipments;
const events = (id = 'a') => get(id).history.map((h) => h.event);
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
const reply = (lid, r, id = 'a', at) => store().receiveCarrierReply(id, lid, { reply: r, at });

// ── 12.32 依出貨方式產生物流單（確認可出貨時） ──

describe('12.32 拆單：確認可出貨時依出貨方式產生物流單，支援子母單合成一筆、否則一箱一筆', () => {
  const boxes = (n) => Array.from({ length: n }, (_, i) => box(String(i + 1).padStart(3, '0'), null));

  it('拆單純函式：產生的物流單貨態待出貨、第三方為未拋單；順豐 6 箱一筆、7-11 交貨便 3 箱三筆、流水接在 startSeq 之後', () => {
    const merged = splitIntoLogistics({ shipmentId: 's1', shipmentNo: 'SH-1', method: '順豐', boxes: boxes(6) });
    expect(merged.logistics).toHaveLength(1);
    expect(merged.logistics[0]).toMatchObject({ id: 's1-lg-1', own_order_no: 'SH-1-01', cargo_status: '待出貨', dispatch_status: '未拋單' });
    expect(merged.boxes.every((b) => b.logistics_id === 's1-lg-1')).toBe(true);
    const split = splitIntoLogistics({ shipmentId: 's1', shipmentNo: 'SH-1', method: '7-11 交貨便', boxes: boxes(3), startSeq: 4 });
    expect(split.logistics.map((l) => l.own_order_no)).toEqual(['SH-1-05', 'SH-1-06', 'SH-1-07']);
    expect(split.lastSeq).toBe(7);
    expect(split.logistics.every((l) => l.cargo_status === '待出貨' && l.dispatch_status === '未拋單')).toBe(true);
    ['新竹物流', '全家'].forEach((m) => expect(splitIntoLogistics({ shipmentId: 's', shipmentNo: 'S', method: m, boxes: boxes(2) }).logistics, m).toHaveLength(2));
    ['自取', '專車配送', '其他'].forEach((m) => {
      const r = splitIntoLogistics({ shipmentId: 's', shipmentNo: 'S', method: m, boxes: boxes(2) });
      expect(r.logistics, m).toHaveLength(1);
      // 拋單狀態只適用第三方物流
      expect(r.logistics[0].dispatch_status, m).toBeNull();
    });
    // 物流單上不帶離廠時間欄，也沒有舊的單號欄、單一狀態欄與獨立歷程
    ['left_at', 'logistics_order_no', 'status', 'history'].forEach((k) => expect(k in merged.logistics[0], k).toBe(false));
  });

  it('支援子母單時全部箱合成一筆物流單：順豐 3 箱確認可出貨 → 一筆 -01、三箱同屬它、未拋單、箱數 3；出貨單已確認', () => {
    seed([boxed({ method: '順豐', boxCount: 3 })]);
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(true);
    expect(r.logisticsIds).toEqual(['a-lg-1']);
    expect(los().map((l) => [l.own_order_no, l.dispatch_status, l.cargo_status])).toEqual([['SH-TEST-A-01', '未拋單', '待出貨']]);
    expect(get().packing_boxes.every((b) => b.logistics_id === 'a-lg-1')).toBe(true);
    expect(boxCountOf(get())).toBe(3);
    expect(shipmentStatusOf(get())).toBe('已確認');
    const entry = get().history.at(-1);
    expect(entry.category).toBe('確認可出貨');
    expect(entry.changes).toEqual(expect.arrayContaining([expect.objectContaining({ field: '物流單（我方自編單號）', after: 'SH-TEST-A-01' })]));
  });

  it('不支援子母單時一箱一筆物流單：7-11 交貨便 3 箱 → -01、-02、-03 皆未拋單、貨態待出貨', () => {
    seed([boxed({ method: '7-11 交貨便', boxCount: 3 })]);
    store().confirmShippable('a', { operator: '范姜宏' });
    expect(los().map((l) => l.own_order_no)).toEqual(nos(3));
    expect(get().packing_boxes.map((b) => b.logistics_id)).toEqual(['a-lg-1', 'a-lg-2', 'a-lg-3']);
    expect(los().every((l) => l.cargo_status === '待出貨' && l.dispatch_status === '未拋單')).toBe(true);
  });

  it('已裝箱時增刪箱後才確認，物流單依當下箱數產生：刪 002、新增一箱（箱序 004）不產生物流單；確認後三筆 -01 至 -03 分屬 001、003、004', () => {
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
    const ownOf = (lid) => los().find((l) => l.id === lid)?.own_order_no;
    expect(get().packing_boxes.map((b) => [b.box_no, ownOf(b.logistics_id)])).toEqual([
      ['001', 'SH-TEST-A-01'],
      ['003', 'SH-TEST-A-02'],
      ['004', 'SH-TEST-A-03'],
    ]);
  });
});

// ── 12.33 出貨單狀態取最落後、異常優先 ──

describe('12.33 出貨單確認可出貨之後的狀態由未作廢物流單計算：取最落後、任一在例外即異常', () => {
  const status = (...states) =>
    shipmentStatusOf(sh({ method: '7-11 交貨便', logisticsOrders: states.map((s, i) => lo(`L-${i}`, s)) }));

  it('取最落後的那一筆：已確認（未拋單成功）→ 待出貨（拋單成功、物流商未收件）→ 已出貨（可自取）→ 運送中 → 已送達', () => {
    expect(status('未拋單', '運送中')).toBe('已確認');
    expect(status('拋單失敗', '運送中')).toBe('已確認');
    expect(status('拋單成功', '運送中')).toBe('待出貨');
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
      expect(status('未拋單', e), e).toBe('異常');
    });
    expect(status('已作廢', '例外事故')).toBe('異常');
  });

  it('草稿、未處理、打包中與尚無物流單的已裝箱取單上記的值', () => {
    ['草稿', '未處理', '打包中', '已裝箱'].forEach((s) => expect(shipmentStatusOf({ status: s, logistics_orders: [] })).toBe(s));
  });

  it('部分物流單拋單成功時出貨單停在已確認：新竹兩筆只拋第一筆仍為已確認，兩筆都拋單成功才轉待出貨、各有自己的物流單號', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01'), lo('SH-TEST-A-02')] })]);
    store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(shipmentStatusOf(get())).toBe('已確認');
    store().dispatchLogistics('a', 'SH-TEST-A-02', { operator: '曾志偉' });
    expect(shipmentStatusOf(get())).toBe('待出貨');
    expect(new Set(los().map((l) => l.tracking_no)).size).toBe(2);
  });

  it('出貨單取未作廢物流單最落後：7-11 三筆待出貨（已拋單成功），一筆回傳到店仍為待出貨，三筆都到運送中才轉運送中', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(3).map((n) => lo(n, '拋單成功')) })]);
    reply('SH-TEST-A-01', '到店');
    expect(shipmentStatusOf(get())).toBe('待出貨');
    reply('SH-TEST-A-02', '到店');
    reply('SH-TEST-A-03', '到店');
    expect(shipmentStatusOf(get())).toBe('運送中');
  });

  it('任一物流單例外即異常：兩筆已送達一筆運送中，運送中那筆收到例外 → 異常；下一次回傳在途後重算為運送中', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [lo('SH-TEST-A-01', '已送達'), lo('SH-TEST-A-02', '已送達'), lo('SH-TEST-A-03', '運送中')],
      }),
    ]);
    reply('SH-TEST-A-03', '例外事故');
    expect(shipmentStatusOf(get())).toBe('異常');
    reply('SH-TEST-A-03', '在途');
    expect(lget('SH-TEST-A-03').cargo_status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
  });

  it('已送達需至少一筆未作廢物流單且全部送達：一筆已作廢、兩筆運送中都配達 → 出貨單已送達並寫入送達數量', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-01', '已作廢'), lo('SH-TEST-A-02', '運送中'), lo('SH-TEST-A-03', '運送中')],
      }),
    ]);
    reply('SH-TEST-A-02', '配達');
    expect(shipmentStatusOf(get())).toBe('運送中');
    reply('SH-TEST-A-03', '配達');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(100);
  });
});

// ── 12.21、12.36 出貨動作 ──

describe('12.21、12.36 出貨動作：第三方拋單、專車與其他出貨確認、自取標記可自取；拋單失敗寫入並可再次拋單', () => {
  beforeEach(() => seed([]));

  const one = (method, n = 2, extra = {}) =>
    sh({
      method,
      logisticsOrders: [lo('SH-TEST-A-01', '未拋單', extra)],
      boxes: Array.from({ length: n }, (_, i) => box(String(i + 1).padStart(3, '0'), 'SH-TEST-A-01')),
    });

  it('第三方拋單後物流單號與子單號由物流商回傳：順豐 3 箱拋單 → 拋單狀態拋單成功、貨態仍待出貨、寫入物流單號、標籤與三個子單號；出貨單轉待出貨、仍屬未離廠', () => {
    seed([one('順豐', 3)]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    const l = lget('SH-TEST-A-01');
    expect(l).toMatchObject({ dispatch_status: '拋單成功', cargo_status: '待出貨', dispatch_error: null });
    expect(l.tracking_no).toMatch(/^SF\d{9}$/);
    expect(l.label_file).toContain(l.tracking_no);
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual(['001', '002', '003'].map((n) => `${l.tracking_no}${n}`));
    expect(shipmentStatusOf(get())).toBe('待出貨');
    expect(isNotDeparted(get())).toBe(true);
    expect(isFullyDeparted(get())).toBe(false);
    expect('left_at' in l).toBe(false);
    expect('actual_ship_date' in get()).toBe(false);
  });

  it('拋單成功記在出貨單歷程並帶我方自編單號與物流單號：一筆「拋單成功」含時間、操作人、拋單狀態前後值、出貨單狀態前後值；物流單沒有獨立歷程', () => {
    seed([one('順豐', 1)]);
    store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    const l = lget('SH-TEST-A-01');
    expect('history' in l).toBe(false);
    const entry = get().history.at(-1);
    expect(entry.category).toBe('拋單成功');
    expect(entry.event).toContain('拋單成功');
    expect(entry.event).toContain('（物流單 SH-TEST-A-01）');
    expect(entry.actor).toBe('曾志偉');
    expect(entry.at).toBeTruthy();
    expect(entry.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: '物流單號', after: l.tracking_no }),
        expect.objectContaining({ field: '拋單狀態', before: '未拋單', after: '拋單成功' }),
        expect.objectContaining({ field: '出貨單狀態', before: '已確認', after: '待出貨' }),
      ]),
    );
  });

  it('專車與其他出貨確認：貨態轉已出貨、沒有物流單號、沒有拋單狀態；自取標記可自取：貨態轉可自取；出貨單皆為已出貨；事件記在出貨單歷程', () => {
    ['專車配送', '其他'].forEach((m) => {
      seed([one(m)]);
      store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
      expect(lget('SH-TEST-A-01').cargo_status, m).toBe('已出貨');
      expect(lget('SH-TEST-A-01').tracking_no, m).toBeNull();
      expect(lget('SH-TEST-A-01').dispatch_status, m).toBeNull();
      expect(shipmentStatusOf(get()), m).toBe('已出貨');
      expect(get().history.at(-1).category, m).toBe('出貨確認或標記可自取');
    });
    seed([one('自取')]);
    store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(lget('SH-TEST-A-01').cargo_status).toBe('可自取');
    expect(shipmentStatusOf(get())).toBe('已出貨');
    expect(events().at(-1)).toContain('（物流單 SH-TEST-A-01）');
  });

  it('拋單失敗會寫入：拋單狀態轉拋單失敗並記失敗原因、出貨單停在已確認、歷程記一筆拋單失敗；物流單列仍有拋單鈕；再次拋單換發我方自編單號 -02 並成功（模擬開關只失敗一次）', () => {
    seed([one('順豐', 2, { simulated_carrier_reply: 'reject' })]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
    expect(r.error).not.toMatch(/箱規|尺寸|材積/);
    expect(lget('SH-TEST-A-01')).toMatchObject({
      own_order_no: 'SH-TEST-A-01',
      dispatch_status: '拋單失敗',
      dispatch_error: r.error,
      cargo_status: '待出貨',
      tracking_no: null,
      label_file: null,
    });
    expect(lget('SH-TEST-A-01').simulated_carrier_reply).toBeFalsy();
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(isNotDeparted(get())).toBe(true);
    const failed = get().history.at(-1);
    expect(failed.category).toBe('拋單失敗');
    expect(failed.event).toContain('（物流單 SH-TEST-A-01）');
    expect(failed.remark).toContain(r.error);
    expect(failed.changes).toEqual(expect.arrayContaining([expect.objectContaining({ field: '拋單狀態', before: '未拋單', after: '拋單失敗' })]));
    expect(logisticsActionsOf({ role: 'shipper', shipment: get(), logistics: lget('SH-TEST-A-01') })).toContain(L.DISPATCH);
    // 確認可出貨之後裝箱資料不能改；沒有作廢出貨單（只限未處理）；物流單都還在等出貨動作，沒有作廢物流單
    expect(canCorrectPacking(get())).toBe(false);
    expect(logisticsActionsOf({ role: 'sales', shipment: get(), logistics: lget('SH-TEST-A-01'), canVoid: true })).not.toContain(L.VOID);

    const again = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(again.ok).toBe(true);
    expect(lget('SH-TEST-A-01')).toMatchObject({ own_order_no: 'SH-TEST-A-02', dispatch_status: '拋單成功', dispatch_error: null });
    expect(lget('SH-TEST-A-01').tracking_no).toBeTruthy();
    expect(get().logistics_seq).toBe(2);
    expect(shipmentStatusOf(get())).toBe('待出貨');
    const ok = get().history.at(-1);
    expect(ok.event).toContain('（物流單 SH-TEST-A-02）');
    expect(ok.changes).toEqual(expect.arrayContaining([expect.objectContaining({ field: '我方自編單號', before: 'SH-TEST-A-01', after: 'SH-TEST-A-02' })]));
  });

  it('一筆成功一筆失敗仍屬未離廠：出貨單停在已確認；沒有裝箱回報修正；拋單失敗那一筆對業務渲染作廢物流單', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-01'), lo('SH-TEST-A-02', '未拋單', { simulated_carrier_reply: 'reject' })],
      }),
    ]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' }).ok).toBe(true);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-02', { operator: '曾志偉' }).ok).toBe(false);
    expect(lget('SH-TEST-A-02').dispatch_status).toBe('拋單失敗');
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(isNotDeparted(get())).toBe(true);
    expect(isPartiallyDeparted(get())).toBe(false);
    expect(packingCorrectionScope(get())).toEqual({ pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: [] });
    expect(logisticsActionsOf({ role: 'sales', shipment: get(), logistics: lget('SH-TEST-A-02'), canVoid: true })).toContain(L.VOID);
  });

  it('只有未拋單或拋單失敗的物流單可拋單：已拋單成功的不重送、物流單號不變', () => {
    seed([one('順豐')]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' }).ok).toBe(true);
    const tracking = lget('SH-TEST-A-01').tracking_no;
    const again = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(again.ok).toBe(false);
    expect(again.error).toBe('這筆物流單已拋單成功');
    expect(lget('SH-TEST-A-01').tracking_no).toBe(tracking);
    expect(logisticsActionsOf({ role: 'shipper', shipment: get(), logistics: lget('SH-TEST-A-01') })).not.toContain(L.DISPATCH);
  });

  it('確認可出貨之後出貨動作不再檢查揀貨是否相符', () => {
    const base = one('專車配送');
    seed([{ ...base, details: [{ ...base.details[0], picked_qty: 80 }] }]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' }).ok).toBe(true);
  });

  it('所屬訂單已取消時出貨動作被擋下、不寫入；物流單列不渲染出貨動作', () => {
    seed([one('順豐')], { orderStatus: '已取消' });
    const r = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(ORDER_CANCELLED_HINT);
    expect(lget('SH-TEST-A-01')).toMatchObject({ dispatch_status: '未拋單', cargo_status: '待出貨' });
    expect(get().history).toEqual([]);
    expect(
      logisticsActionsOf({ role: 'shipper', shipment: get(), logistics: lget('SH-TEST-A-01'), orderCancelled: true }),
    ).not.toContain(L.DISPATCH);
  });
});

// ── 12.43 拋單逾時 ──

describe('12.43 拋單逾時視為拋單失敗：拋單狀態拋單失敗並記逾時原因、不寫入物流單號與標籤，可再次拋單', () => {
  it('單筆拋單逾時：回傳逾時失敗，拋單狀態拋單失敗、失敗原因為逾時訊息、貨態待出貨；出貨單停在已確認；物流單列仍渲染拋單；再次拋單成功', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '未拋單', { simulated_carrier_reply: 'timeout' })] })]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.timeout).toBe(true);
    expect(r.error).toBe(DISPATCH_TIMEOUT_HINT);
    expect(lget('SH-TEST-A-01')).toMatchObject({
      dispatch_status: '拋單失敗',
      dispatch_error: DISPATCH_TIMEOUT_HINT,
      cargo_status: '待出貨',
      tracking_no: null,
      label_file: null,
    });
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(events().at(-1)).toContain('拋單失敗（逾時）');
    expect(logisticsActionsOf({ role: 'shipper', shipment: get(), logistics: lget('SH-TEST-A-01') })).toContain(L.DISPATCH);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-01', { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('待出貨');
  });

  it('批次拋單中某一筆逾時：該筆結果標逾時、拋單狀態拋單失敗，其他筆照常成功；出貨單停在已確認', () => {
    seed([
      sh({
        method: '全家',
        logisticsOrders: [lo('SH-TEST-A-01'), lo('SH-TEST-A-02', '未拋單', { simulated_carrier_reply: 'timeout' })],
      }),
    ]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.results).toEqual([
      expect.objectContaining({ logistics_id: 'SH-TEST-A-01', own_order_no: 'SH-TEST-A-01', ok: true }),
      expect.objectContaining({ logistics_id: 'SH-TEST-A-02', ok: false, timeout: true, error: DISPATCH_TIMEOUT_HINT }),
    ]);
    expect(lget('SH-TEST-A-02')).toMatchObject({ dispatch_status: '拋單失敗', cargo_status: '待出貨' });
    expect(shipmentStatusOf(get())).toBe('已確認');
  });
});

// ── 12.50 第三方物流只依物流商回傳推進 ──

describe('12.50 第三方物流拋單成功後只依物流商回傳推進貨態：不經已出貨、只往前、終態不動、查無資料不覆蓋', () => {
  it('物流商回傳的對映（純函式）：已登記追蹤與查無資料不改貨態、在途與到店轉運送中、配達與取件完成轉已送達、倒退不改、終態不動、未拋單成功不動', () => {
    const t = (status, r, method = '順豐', dispatchStatus = '拋單成功') =>
      carrierReplyTransition({ method, dispatchStatus, status, reply: r });
    expect(t('待出貨', '已登記追蹤')).toEqual({ status: '待出貨', changed: false });
    expect(t('待出貨', '在途')).toEqual({ status: '運送中', changed: true });
    expect(t('待出貨', '配達')).toEqual({ status: '已送達', changed: true });
    expect(t('待出貨', '到店', '7-11 交貨便')).toEqual({ status: '運送中', changed: true });
    expect(t('運送中', '取件完成', '全家')).toEqual({ status: '已送達', changed: true });
    expect(t('運送中', '已登記追蹤')).toEqual({ status: '運送中', changed: false });
    expect(t('已送達', '在途')).toEqual({ status: '已送達', changed: false });
    expect(t('已作廢', '配達')).toEqual({ status: '已作廢', changed: false });
    expect(t('運送中', '例外事故')).toEqual({ status: '例外事故', changed: true });
    expect(t('無追蹤中包裹', '在途')).toEqual({ status: '運送中', changed: true });
    // 查無資料不覆蓋原本貨態（含例外）
    ['待出貨', '運送中', '例外事故'].forEach((s) => expect(t(s, '查無資料'), s).toEqual({ status: s, changed: false }));
    // 還沒拋單成功（未拋單、拋單失敗）時回傳不動
    ['未拋單', '拋單失敗'].forEach((d) => expect(t('待出貨', '在途', '順豐', d), d).toEqual({ status: '待出貨', changed: false }));
    ['待出貨', '運送中'].forEach((s) => {
      ['已登記追蹤', '在途', '到店', '配達', '取件完成'].forEach((r) => {
        expect(t(s, r).status, `${s} ${r}`).not.toBe('已出貨');
      });
    });
  });

  it('物流商依序回傳在途與配達：順豐已登記追蹤不改貨態（出貨單歷程仍寫一筆貨態更新）；依序轉運送中、已送達，不經已出貨；出貨單依序運送中、已送達，不必另做送達確認', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功', { tracking_no: 'SF1' })] })]);
    const historyBefore = get().history.length;
    const tracked = reply('SH-TEST-A-01', '已登記追蹤');
    expect(tracked).toMatchObject({ ok: true, changed: false });
    expect(lget('SH-TEST-A-01').cargo_status).toBe('待出貨');
    expect(get().history.length).toBe(historyBefore + 1);
    expect(get().history.at(-1)).toMatchObject({ category: '貨態更新', event: '貨態更新：已登記追蹤（貨態不變）（物流單 SH-TEST-A-01）' });
    reply('SH-TEST-A-01', '在途');
    expect(lget('SH-TEST-A-01').cargo_status).toBe('運送中');
    expect(get().history.at(-1).event).toBe('貨態更新：在途（物流單 SH-TEST-A-01）');
    expect(get().history.at(-1).changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: '貨態', before: '待出貨', after: '運送中' }),
        expect.objectContaining({ field: '出貨單狀態', before: '待出貨', after: '運送中' }),
      ]),
    );
    expect(shipmentStatusOf(get())).toBe('運送中');
    reply('SH-TEST-A-01', '配達', 'a', '2026-10-21 14:00');
    expect(lget('SH-TEST-A-01')).toMatchObject({ cargo_status: '已送達', delivered_by: CARRIER_SYNC_ACTOR, delivered_at: '2026-10-21 14:00' });
    expect(shipmentStatusOf(get())).toBe('已送達');
    const statuses = get().history.flatMap((h) => h.changes ?? []).map((c) => c.after);
    expect(statuses).not.toContain('已出貨');
  });

  it('查無資料不覆蓋原本貨態：運送中的新竹物流單收到查無資料 → 維持運送中、出貨單狀態不變，歷程記「貨態更新：查無資料（貨態不變）」', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '運送中')] })]);
    const r = reply('SH-TEST-A-01', '查無資料');
    expect(r).toMatchObject({ ok: true, changed: false });
    expect(lget('SH-TEST-A-01').cargo_status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(events().at(-1)).toBe('貨態更新：查無資料（貨態不變）（物流單 SH-TEST-A-01）');
  });

  it('超商到店對映運送中：7-11 回傳到店 → 運送中、不是已送達；取件完成才轉已送達', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功')] })]);
    reply('SH-TEST-A-01', '到店');
    expect(lget('SH-TEST-A-01').cargo_status).toBe('運送中');
    reply('SH-TEST-A-01', '取件完成');
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已送達');
  });

  it('已作廢物流單收到配達回傳只寫歷程：維持已作廢、未送達數量 40 不變，出貨單狀態與可出貨額度不變', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          lo('SH-TEST-A-01', '已作廢', { undelivered: [{ print_item_no: NO, qty: 40 }] }),
          lo('SH-TEST-A-02', '運送中'),
        ],
      }),
    ]);
    const statusBefore = shipmentStatusOf(get());
    const quotaBefore = quota(100);
    const historyBefore = get().history.length;
    const r = reply('SH-TEST-A-01', '配達');
    expect(r.changed).toBe(false);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已作廢');
    expect(lget('SH-TEST-A-01').undelivered).toEqual([{ print_item_no: NO, qty: 40 }]);
    expect(get().history.length).toBe(historyBefore + 1);
    expect(shipmentStatusOf(get())).toBe(statusBefore);
    expect(quota(100)).toBe(quotaBefore);
  });

  it('人工送達確認與物流商回傳同時到時先寫入者成立：配達回傳先寫入，出貨人員隨後送出 → 不改任何欄位、提示此單已收尾請重新整理', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '運送中')] })]);
    reply('SH-TEST-A-01', '配達', 'a', '2026-10-21 09:30');
    const before = JSON.stringify(get());
    const late = store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉' });
    expect(late.ok).toBe(false);
    expect(late.settledAlready).toBe(true);
    expect(late.error).toBe(SETTLED_ALREADY_HINT);
    expect(JSON.stringify(get())).toBe(before);
    expect(lget('SH-TEST-A-01')).toMatchObject({ delivered_by: CARRIER_SYNC_ACTOR, delivered_at: '2026-10-21 09:30' });
  });

  it('第三方物流不開放人工標記例外：繞過介面送出擋下、維持運送中', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '運送中')] })]);
    const r = store().markLogisticsException('a', 'SH-TEST-A-01', { kind: '例外事故', reason: '想改成例外', operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('運送中');
  });

  it('物流商回傳例外後依下一次回傳恢復：7-11 一筆收到無追蹤中包裹 → 出貨單異常；下一次回傳在途 → 恢復運送中；沒有人工取回物流商狀態的動作', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(3).map((n) => lo(n, '運送中')) })]);
    reply('SH-TEST-A-02', '無追蹤中包裹');
    expect(lget('SH-TEST-A-02')).toMatchObject({ cargo_status: '無追蹤中包裹', exception_source: 'carrier' });
    expect(shipmentStatusOf(get())).toBe('異常');
    reply('SH-TEST-A-02', '在途');
    expect(lget('SH-TEST-A-02').cargo_status).toBe('運送中');
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(store().syncLogistics).toBeUndefined();
  });

  it('配達回傳未進來時由出貨人員備援確認：拋單成功、貨態待出貨的新竹物流單回填配達時間做送達確認 → 已送達、確認人為該出貨人員', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功')] })]);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉', delivered_at: '2026-10-20 15:30' });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-01')).toMatchObject({ cargo_status: '已送達', delivered_by: '曾志偉', delivered_at: '2026-10-20 15:30' });
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(100);
  });
});

// ── 12.34 作廢物流單與回補 ──

describe('12.34 作廢物流單：依未送達數量重算佔用、最後一筆系統預填、不重複回補', () => {
  it('逐筆作廢物流單，最後一筆系統預填並使出貨單作廢：7-11 明細 100 三筆運送中、額度 400 → 作廢 30 後 430、作廢 40 後 470、第三筆預填 30 不可改、出貨單已作廢、額度 500', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(3).map((n) => lo(n, '運送中')) })]);
    expect(quota(500)).toBe(400);
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '一箱遺失', undelivered: { [NO]: 30 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(500)).toBe(430);
    store().voidLogistics('a', 'SH-TEST-A-02', { reason: '一箱遺失', undelivered: { [NO]: 40 }, operator: '洪嘉駿' });
    expect(quota(500)).toBe(470);
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(lastLogisticsFillOf(get(), 'SH-TEST-A-03')).toEqual({ [NO]: 30 });
    store().voidLogistics('a', 'SH-TEST-A-03', { reason: '一箱遺失', undelivered: { [NO]: 5 }, operator: '洪嘉駿' });
    expect(lget('SH-TEST-A-03').undelivered).toEqual([{ print_item_no: NO, qty: 30 }]);
    expect(shipmentStatusOf(get())).toBe('已作廢');
    expect(quota(500)).toBe(500);
    expect(events().filter((e) => e.startsWith('作廢物流單'))).toEqual(
      nos(3).map((n) => `作廢物流單（物流單 ${n}）`),
    );
  });

  it('其餘物流單都已作廢時剩下這一筆的作廢：專車唯一一筆在例外事故 → 預填 100 不可改、作廢後出貨單已作廢、不要求出貨單作廢理由', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-01', '例外事故', { exception_source: 'manual' })] })]);
    expect(lastLogisticsFillOf(get(), 'SH-TEST-A-01')).toEqual({ [NO]: 100 });
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '客戶拒收', operator: '洪嘉駿' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('已作廢');
  });

  it('第三方物流在拋單成功後（物流商未收件）與運送中可直接作廢：新竹三筆（拋單成功、運送中、運送中）、額度 0 → 作廢前兩筆（50、30）直接轉已作廢、額度 80、出貨單依第三筆為運送中；不向物流商取消', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-01', '拋單成功'), lo('SH-TEST-A-02', '運送中'), lo('SH-TEST-A-03', '運送中')],
      }),
    ]);
    expect(quota(100)).toBe(0);
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '裝錯', undelivered: { [NO]: 50 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(store().voidLogistics('a', 'SH-TEST-A-02', { reason: '裝錯', undelivered: { [NO]: 30 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect([lget('SH-TEST-A-01').cargo_status, lget('SH-TEST-A-02').cargo_status]).toEqual(['已作廢', '已作廢']);
    expect(quota(100)).toBe(80);
    expect(shipmentStatusOf(get())).toBe('運送中');
    expect(JSON.stringify(get().history)).not.toContain('向物流商取消');
  });

  it('專車已出貨要先轉例外才能作廢：已出貨時作廢被擋下；出貨人員標記例外後業務可作廢', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-01', '已出貨')] })]);
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '裝錯', operator: '洪嘉駿' }).ok).toBe(false);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已出貨');
    store().markLogisticsException('a', 'SH-TEST-A-01', { kind: '例外事故', reason: '裝錯貨', operator: '曾志偉' });
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '裝錯', operator: '洪嘉駿' }).ok).toBe(true);
  });

  it('還在等出貨動作的物流單只在本單另有物流單已不在這一格時可單筆作廢：新竹第 3 筆（另兩筆拋單成功）作廢成立、未送達 20 回補；全家兩筆皆未拋單時作廢被擋下', () => {
    seed([
      sh({
        method: '新竹物流',
        logisticsOrders: [lo('SH-TEST-A-01', '拋單成功'), lo('SH-TEST-A-02', '拋單成功'), lo('SH-TEST-A-03')],
      }),
      sh({ id: 'f', shipmentNo: 'SH-TEST-F', method: '全家', qty: 0, logisticsOrders: [lo('SH-TEST-F-01'), lo('SH-TEST-F-02')] }),
    ]);
    const before = quota(200);
    expect(store().voidLogistics('a', 'SH-TEST-A-03', { reason: '拋單一直失敗', undelivered: { [NO]: 20 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(200)).toBe(before + 20);
    expect(store().voidLogistics('f', 'SH-TEST-F-01', { reason: '想作廢', operator: '洪嘉駿' }).ok).toBe(false);
    expect(lget('SH-TEST-F-01', 'f').cargo_status).toBe('待出貨');
  });

  it('作廢物流單後依未送達數量重算，不另加回補項：完工良品數 1,000、明細 1,000、一筆作廢未送達 400 → 累計已出貨 600、額度 400', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        qty: 1000,
        logisticsOrders: [lo('SH-TEST-A-01', '已作廢', { undelivered: [{ print_item_no: NO, qty: 400 }] }), lo('SH-TEST-A-02', '運送中')],
      }),
    ]);
    expect(occupiedQtyOf(get(), NO)).toBe(600);
    expect(quota(1000)).toBe(400);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 400 }], shipments: all(), qcRecords: qcOf(1000) }).ok).toBe(true);
  });

  it('守恆鏈不得被違反：完工良品數 950 時，會使累計已出貨數量超過 950 的建單被擋下', () => {
    seed([sh({ method: '順豐', qty: 900, logisticsOrders: [lo('SH-TEST-A-01', '運送中')] })]);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 51 }], shipments: all(), qcRecords: qcOf(950) }).ok).toBe(false);
    expect(validateShipmentQuota({ details: [{ print_item_no: NO, name: NAME, qty: 50 }], shipments: all(), qcRecords: qcOf(950) }).ok).toBe(true);
  });

  it('重出開新單：原出貨單與原物流單沒有復用入口，已作廢物流單沒有任何動作', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: [lo('SH-TEST-A-01', '已作廢', { undelivered: [{ print_item_no: NO, qty: 40 }] }), lo('SH-TEST-A-02', '運送中')] })]);
    ['reopenShipment', 'restoreLogistics', 'reuseLogistics', 'reviveShipment'].forEach((k) => expect(store()[k], k).toBeUndefined());
    ['sales', 'shipper'].forEach((role) => {
      expect(logisticsActionsOf({ role, shipment: get(), logistics: lget('SH-TEST-A-01'), canVoid: true }), role).toEqual([]);
    });
  });

  it('理由必填；未送達數量上限＝明細數量（同一印件合計）；負數與小數不通過', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(2).map((n) => lo(n, '運送中')) })]);
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '  ', operator: '洪嘉駿' }).ok).toBe(false);
    expect(store().voidLogistics('a', 'SH-TEST-A-01', { reason: '遺失', undelivered: { [NO]: 101 }, operator: '洪嘉駿' }).ok).toBe(false);
    store().voidLogistics('a', 'SH-TEST-A-01', { reason: '遺失', undelivered: { [NO]: 60 }, operator: '洪嘉駿' });
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: 41 } }).ok).toBe(false);
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: -1 } }).ok).toBe(false);
    expect(validateUndelivered({ shipment: get(), entries: { [NO]: 1.5 } }).ok).toBe(false);
  });
});

// ── 12.35 送達確認與交付確認（不附照片，可填未送達數量） ──

describe('12.35 送達確認與交付確認不附照片，可選填逐印件未送達數量', () => {
  it('子母單一箱遺失以送達確認填未送達數量：順豐 6 箱明細 600、物流商回傳例外 → 送達確認填 100，物流單與出貨單已送達、送達數量 500、額度回補 100', () => {
    seed([sh({ method: '順豐', qty: 600, logisticsOrders: [lo('SH-TEST-A-01', '例外事故', { exception_source: 'carrier' })] })], { orderedQty: 500 });
    const before = quota(600);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉', undelivered: { [NO]: 100 } });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已送達');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(500);
    expect(quota(600)).toBe(before + 100);
    expect('delivery_proof' in lget('SH-TEST-A-01')).toBe(false);
  });

  it('自取客戶只載走一部分：交付確認不附照片、未送達 30 → 已自取、出貨單已送達、送達數量 70、額度 430', () => {
    seed([sh({ method: '自取', logisticsOrders: [lo('SH-TEST-A-01', '可自取')] })]);
    const r = store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉', undelivered: { [NO]: 30 } });
    expect(r.ok).toBe(true);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已自取');
    expect(shipmentStatusOf(get())).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(70);
    expect(quota(500)).toBe(430);
  });

  it('專車少交一箱以送達確認填未送達數量：未送達 50 → 送達數量 50；合計超過明細數量時擋下', () => {
    seed([sh({ method: '專車配送', logisticsOrders: [lo('SH-TEST-A-01', '已出貨')] })]);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉', undelivered: { [NO]: 101 } }).ok).toBe(false);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已出貨');
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-01', { operator: '曾志偉', undelivered: { [NO]: 50 } }).ok).toBe(true);
    expect(lget('SH-TEST-A-01').cargo_status).toBe('已送達');
    expect(get().details[0].delivered_qty).toBe(50);
  });

  it('同一出貨單的未送達合計跨物流單累計：作廢填過 70，後續送達確認只能填剩下的 30', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [lo('SH-TEST-A-01', '已作廢', { undelivered: [{ print_item_no: NO, qty: 70 }] }), lo('SH-TEST-A-02', '運送中')],
      }),
    ]);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-02', { operator: '曾志偉', undelivered: { [NO]: 31 } }).ok).toBe(false);
    expect(store().confirmLogisticsDelivery('a', 'SH-TEST-A-02', { operator: '曾志偉', undelivered: { [NO]: 30 } }).ok).toBe(true);
    expect(get().details[0].delivered_qty).toBe(0);
  });
});

// ── 12.10、12.38 訂單取消連鎖與集合詞 ──

describe('12.38 三個集合詞依物流單貨態判定、互斥，涵蓋草稿以外的全部未作廢出貨單', () => {
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
    全部未拋單: [sh({ logisticsOrders: [lo('L-1'), lo('L-2')] }), '未離廠'],
    拋單失敗: [sh({ logisticsOrders: [lo('L-1', '拋單失敗')] }), '未離廠'],
    待出貨: [sh({ logisticsOrders: [lo('L-1', '拋單成功')] }), '未離廠'],
    未拋單與拋單成功: [sh({ logisticsOrders: [lo('L-1', '拋單成功'), lo('L-2')] }), '未離廠'],
    運送中與未拋單: [sh({ logisticsOrders: [lo('L-1', '運送中'), lo('L-2')] }), '部分離廠'],
    運送中與拋單成功: [sh({ logisticsOrders: [lo('L-1', '運送中'), lo('L-2', '拋單成功')] }), '部分離廠'],
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

  it('已離廠量只算全數離廠者：待出貨與部分離廠都不算', () => {
    const full = sh({ id: 'f', qty: 40, logisticsOrders: [lo('L-1', '運送中')] });
    const waiting = sh({ id: 'w', qty: 30, logisticsOrders: [lo('L-1', '拋單成功')] });
    const part = sh({ id: 'p', qty: 60, logisticsOrders: [lo('L-1', '運送中'), lo('L-2')] });
    expect(calcShippedQty(printItem, [full, waiting, part])).toBe(40);
  });

  it('待出貨仍屬未離廠、物流商回傳在途才全數離廠；已確認之後業務不能作廢出貨單（只限未處理）', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功')] })]);
    expect(isNotDeparted(get())).toBe(true);
    expect(store().voidShipment('a', '客戶取消', '洪嘉駿')).toBeNull();
    expect(shipmentStatusOf(get())).toBe('待出貨');
    reply('SH-TEST-A-01', '在途');
    expect(isFullyDeparted(get())).toBe(true);
    expect(store().voidShipment('a', '客戶取消', '洪嘉駿')).toBeNull();
    expect(shipmentStatusOf(get())).toBe('運送中');
  });
});

describe('12.10、12.38 訂單取消連鎖：草稿刪除、未離廠自動作廢、部分離廠擋下出貨動作、全數離廠不動', () => {
  const pre = (id, status) => ({
    id,
    shipment_no: status === '草稿' ? null : `SH-TEST-${id}`,
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
  const ofId = (id, method, states) =>
    sh({
      id,
      shipmentNo: `SH-TEST-${id}`,
      method,
      qty: 10,
      logisticsOrders: states.map((s, i) => lo(`SH-TEST-${id}-0${i + 1}`, s)),
    });

  it('三個集合詞各自分流：甲（全部未拋單）、丁（拋單成功＋未拋單）、未處理、打包中、已裝箱轉已作廢、原因訂單取消、物流單一併作廢；草稿刪除（沒有出貨單編號）；乙（運送中＋未拋單）與丙（全部運送中）維持原狀', () => {
    seed([
      ofId('甲', '新竹物流', ['未拋單', '未拋單']),
      ofId('丁', '新竹物流', ['拋單成功', '未拋單']),
      ofId('乙', '新竹物流', ['運送中', '未拋單']),
      ofId('丙', '新竹物流', ['運送中', '運送中']),
      pre('u', '未處理'),
      pre('k', '打包中'),
      { ...boxed({ id: 'b', shipmentNo: 'SH-TEST-b' }), details: [{ print_item_no: NO, name: NAME, qty: 10, picked_qty: 10 }] },
      pre('d', '草稿'),
    ]);
    const affected = store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(affected.map((v) => v.id).sort()).toEqual(['甲', '丁', 'u', 'k', 'b', 'd'].sort());
    expect(affected.find((v) => v.id === 'd').shipment_no).toBeNull();
    ['甲', '丁', 'u', 'k', 'b'].forEach((id) => {
      expect(shipmentStatusOf(get(id)), id).toBe('已作廢');
      expect(get(id).void_reason, id).toBe('訂單取消');
      get(id).logistics_orders.forEach((l) => expect(l.cargo_status, id).toBe('已作廢'));
    });
    expect(all().some((x) => x.id === 'd')).toBe(false);
    expect(shipmentStatusOf(get('乙'))).toBe('已確認');
    expect(los('乙').map((l) => l.cargo_status)).toEqual(['運送中', '待出貨']);
    expect(shipmentStatusOf(get('丙'))).toBe('運送中');
  });

  it('訂單取消連鎖不另設狀態：已確認的出貨單經既有作廢轉入已作廢，單上不多出連鎖專用的欄位', () => {
    seed([ofId('甲', '順豐', ['未拋單'])]);
    const keysBefore = new Set(Object.keys(get('甲')));
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(get('甲').status).toBe('已作廢');
    const extra = Object.keys(get('甲')).filter((k) => !keysBefore.has(k) && !['void_reason', 'void_at'].includes(k));
    expect(extra).toEqual([]);
  });

  it('未離廠且有物流單已拋單成功時系統照常作廢：順豐唯一一筆待出貨（已拋單成功）→ 出貨單與物流單已作廢、原因訂單取消、明細回補額度；不向物流商取消', () => {
    seed([ofId('w', '順豐', ['拋單成功'])]);
    expect(quota(10)).toBe(0);
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(get('w').status).toBe('已作廢');
    expect(get('w').void_reason).toBe('訂單取消');
    expect(lget('SH-TEST-w-01', 'w').cargo_status).toBe('已作廢');
    expect(quota(10)).toBe(10);
    expect(JSON.stringify(get('w').history)).not.toContain('向物流商取消');
  });

  it('部分離廠的出貨單擋下其餘出貨動作、未離廠的物流單由業務作廢：7-11 三筆（運送中、拋單成功、未拋單）→ 第 3 筆拋單擋下、不渲染出貨動作；業務作廢第 2、3 筆成立、回補，出貨單依第 1 筆為運送中', () => {
    seed([ofId('p', '7-11 交貨便', ['運送中', '拋單成功', '未拋單'])], { orderStatus: '已取消' });
    store().voidShipmentsOnOrderCancel(ORDER_NO);
    expect(los('p').map((l) => [l.dispatch_status, l.cargo_status])).toEqual([
      ['拋單成功', '運送中'],
      ['拋單成功', '待出貨'],
      ['未拋單', '待出貨'],
    ]);
    expect(store().dispatchLogistics('p', 'SH-TEST-p-03', { operator: '曾志偉' }).ok).toBe(false);
    expect(
      logisticsActionsOf({ role: 'shipper', shipment: get('p'), logistics: lget('SH-TEST-p-03', 'p'), orderCancelled: true }),
    ).not.toContain(L.DISPATCH);
    const before = quota(10);
    expect(store().voidLogistics('p', 'SH-TEST-p-02', { reason: '訂單取消', undelivered: { [NO]: 3 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(store().voidLogistics('p', 'SH-TEST-p-03', { reason: '訂單取消', undelivered: { [NO]: 3 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(10)).toBe(before + 6);
    expect(shipmentStatusOf(get('p'))).toBe('運送中');
  });
});

// ── 12.41 出貨單上的批次拋單 ──

describe('12.41 出貨單上的批次拋單：對本單每一筆未拋單或拋單失敗的物流單各執行一次拋單，逐筆獨立', () => {
  const resultIds = (r) => r.results.map((x) => x.logistics_id);

  it('批次拋單全部成功：7-11 5 筆各轉拋單成功、各有物流單號；出貨單待出貨、仍屬未離廠；出貨單歷程每筆各一筆拋單成功、不另記批次事件；之後不再渲染批次拋單', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(5).map((n) => lo(n)) })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results.every((x) => x.ok && x.tracking_no)).toBe(true);
    expect(r.results.every((x) => x.shipment_id === 'a' && x.shipment_no === 'SH-TEST-A')).toBe(true);
    expect(los().every((l) => l.dispatch_status === '拋單成功' && l.cargo_status === '待出貨' && l.tracking_no)).toBe(true);
    expect(new Set(los().map((l) => l.tracking_no)).size).toBe(5);
    expect(shipmentStatusOf(get())).toBe('待出貨');
    expect(isNotDeparted(get())).toBe(true);
    nos(5).forEach((n) => {
      expect(events().filter((e) => e.startsWith('拋單成功') && e.endsWith(`（物流單 ${n}）`)), n).toHaveLength(1);
    });
    expect(events().some((e) => e.includes('批次'))).toBe(false);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() }).visible).toBe(false);
  });

  it('批次拋單部分失敗：新竹 3 筆、拒收第 3 筆 → 第 1、2 筆拋單成功、第 3 筆拋單失敗並記原因；結果 2 成功 1 失敗附錯誤訊息；出貨單停在已確認、屬未離廠、批次拋單仍可按；再按只送第 3 筆並成功、換發我方自編單號', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01'), lo('SH-TEST-A-02'), lo('SH-TEST-A-03', '未拋單', { simulated_carrier_reply: 'reject' })] })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.results.map((x) => x.ok)).toEqual([true, true, false]);
    expect(r.results[2].error).toBeTruthy();
    expect(lget('SH-TEST-A-03')).toMatchObject({ dispatch_status: '拋單失敗', dispatch_error: r.results[2].error, tracking_no: null });
    expect(shipmentStatusOf(get())).toBe('已確認');
    expect(isNotDeparted(get())).toBe(true);
    expect(batchDispatchOf({ role: 'shipper', shipment: get() })).toMatchObject({ visible: true, disabled: false });
    const again = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultIds(again)).toEqual(['SH-TEST-A-03']);
    expect(again.results[0]).toMatchObject({ ok: true, own_order_no: 'SH-TEST-A-04' });
    expect(shipmentStatusOf(get())).toBe('待出貨');
  });

  it('支援子母單的出貨單批次拋單只送一筆：順豐 5 箱一筆 → 只送這一筆，主單號與 5 個子單號寫入、拋單成功、出貨單轉待出貨', () => {
    seed([sh({ method: '順豐', logisticsOrders: [lo('SH-TEST-A-01')], boxes: ['001', '002', '003', '004', '005'].map((n) => box(n, 'SH-TEST-A-01')) })]);
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(resultIds(r)).toEqual(['SH-TEST-A-01']);
    const l = lget('SH-TEST-A-01');
    expect(l.dispatch_status).toBe('拋單成功');
    expect(get().packing_boxes.map((b) => b.sub_tracking_no)).toEqual(['001', '002', '003', '004', '005'].map((n) => `${l.tracking_no}${n}`));
    expect(shipmentStatusOf(get())).toBe('待出貨');
  });

  it('出貨單異常時只送可拋單的物流單：例外、拋單成功、未拋單三筆 → 只送第 3 筆；出貨單仍為異常；之後批次拋單停用並顯示理由', () => {
    seed([
      sh({
        method: '7-11 交貨便',
        logisticsOrders: [
          lo('SH-TEST-A-01', '例外事故', { exception_source: 'carrier' }),
          lo('SH-TEST-A-02', '拋單成功', { tracking_no: 'PYU-2' }),
          lo('SH-TEST-A-03'),
        ],
      }),
    ]);
    expect(resultIds(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }))).toEqual(['SH-TEST-A-03']);
    expect(lget('SH-TEST-A-03').dispatch_status).toBe('拋單成功');
    expect(lget('SH-TEST-A-01').cargo_status).toBe('例外事故');
    expect(lget('SH-TEST-A-02').tracking_no).toBe('PYU-2');
    expect(shipmentStatusOf(get())).toBe('異常');
    expect(batchDispatchOf({ role: 'shipper', shipment: get() })).toEqual({ visible: true, disabled: true, reason: BATCH_DISPATCH_NO_SHIPPABLE_HINT });
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
  });

  it('訂單已取消時部分離廠出貨單的批次拋單逐筆失敗：未拋單那一筆擋下並列理由、不寫入，運送中那一筆不變', () => {
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '運送中', { tracking_no: 'HCT-1' }), lo('SH-TEST-A-02')] })], { orderStatus: '已取消' });
    const r = store().dispatchLogisticsBatch('a', { operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.results).toEqual([expect.objectContaining({ logistics_id: 'SH-TEST-A-02', ok: false, error: ORDER_CANCELLED_HINT })]);
    expect(lget('SH-TEST-A-02')).toMatchObject({ dispatch_status: '未拋單', cargo_status: '待出貨' });
    expect(lget('SH-TEST-A-01')).toMatchObject({ cargo_status: '運送中', tracking_no: 'HCT-1' });
  });

  it('出貨動作不是拋單的出貨方式、或出貨單不在已確認與異常：直接呼叫擋下', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      seed([sh({ method, logisticsOrders: [lo('SH-TEST-A-01')] })]);
      expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok, method).toBe(false);
      expect(lget('SH-TEST-A-01').cargo_status, method).toBe('待出貨');
    });
    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功')] })]);
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
    seed([boxed({ method: '新竹物流' })]);
    expect(store().dispatchLogisticsBatch('a', { operator: '曾志偉' }).ok).toBe(false);
  });
});

// ── 12.55 跨出貨單批次拋單 ──

describe('12.55 跨出貨單批次拋單：出貨管理列表勾選多張出貨單的物流單一起拋，不能拋的列失敗', () => {
  it('勾兩張第三方出貨單與一張專車出貨單的物流單：新竹單只勾兩筆中的一筆 → 拋單成功但出貨單停在已確認；7-11 單唯一一筆成功 → 待出貨；專車那一筆列失敗（只有第三方物流可以拋單）、不寫入', () => {
    seed([
      sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01'), lo('SH-TEST-A-02')] }),
      sh({ id: 'b', shipmentNo: 'SH-TEST-B', method: '7-11 交貨便', logisticsOrders: [lo('SH-TEST-B-01')] }),
      sh({ id: 'c', shipmentNo: 'SH-TEST-C', method: '專車配送', logisticsOrders: [lo('SH-TEST-C-01')] }),
    ]);
    const r = store().dispatchLogisticsAcross(
      [
        { shipmentId: 'a', logisticsId: 'SH-TEST-A-01' },
        { shipmentId: 'b', logisticsId: 'SH-TEST-B-01' },
        { shipmentId: 'c', logisticsId: 'SH-TEST-C-01' },
      ],
      { operator: '曾志偉' },
    );
    expect(r.ok).toBe(true);
    expect(r.results).toEqual([
      expect.objectContaining({ shipment_id: 'a', shipment_no: 'SH-TEST-A', logistics_id: 'SH-TEST-A-01', own_order_no: 'SH-TEST-A-01', ok: true, error: null }),
      expect.objectContaining({ shipment_id: 'b', shipment_no: 'SH-TEST-B', logistics_id: 'SH-TEST-B-01', own_order_no: 'SH-TEST-B-01', ok: true, error: null }),
      expect.objectContaining({ shipment_id: 'c', shipment_no: 'SH-TEST-C', logistics_id: 'SH-TEST-C-01', ok: false, tracking_no: null, error: NOT_THIRD_PARTY_DISPATCH_HINT }),
    ]);
    expect(r.results[0].tracking_no).toBeTruthy();
    expect(r.results[1].tracking_no).toBeTruthy();
    expect(lget('SH-TEST-A-01').dispatch_status).toBe('拋單成功');
    expect(lget('SH-TEST-A-02').dispatch_status).toBe('未拋單');
    expect(shipmentStatusOf(get('a'))).toBe('已確認');
    expect(shipmentStatusOf(get('b'))).toBe('待出貨');
    expect(lget('SH-TEST-C-01', 'c')).toMatchObject({ dispatch_status: null, cargo_status: '待出貨' });
    expect(get('c').history).toEqual([]);
    // 每筆照常記在所屬出貨單歷程，不另記批次紀錄
    expect(events('a')).toEqual([expect.stringMatching(/^拋單成功.*（物流單 SH-TEST-A-01）$/)]);
    expect(events('b')).toEqual([expect.stringMatching(/^拋單成功.*（物流單 SH-TEST-B-01）$/)]);
  });

  it('不能拋的列逐筆列失敗、不擋其他筆：已拋單成功、所屬訂單已取消、拋單失敗後可再次拋單', () => {
    seed([
      sh({ method: '全家', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功'), lo('SH-TEST-A-02', '拋單失敗')] }),
    ]);
    const r = store().dispatchLogisticsAcross(
      [
        { shipmentId: 'a', logisticsId: 'SH-TEST-A-01' },
        { shipmentId: 'a', logisticsId: 'SH-TEST-A-02' },
      ],
      { operator: '曾志偉' },
    );
    expect(r.results.map((x) => [x.ok, x.error])).toEqual([
      [false, '這筆物流單已拋單成功'],
      [true, null],
    ]);
    // 拋單失敗後再次拋單換發我方自編單號（流水接在本單已發出的最大號之後）
    expect(r.results[1].own_order_no).toBe('SH-TEST-A-03');
    expect(shipmentStatusOf(get())).toBe('待出貨');

    seed([sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01')] })], { orderStatus: '已取消' });
    const cancelled = store().dispatchLogisticsAcross([{ shipmentId: 'a', logisticsId: 'SH-TEST-A-01' }], { operator: '曾志偉' });
    expect(cancelled.results).toEqual([expect.objectContaining({ ok: false, error: ORDER_CANCELLED_HINT })]);
    expect(lget('SH-TEST-A-01').dispatch_status).toBe('未拋單');

    expect(store().dispatchLogisticsAcross([], { operator: '曾志偉' }).ok).toBe(false);
  });
});

// ── 12.45 確認可出貨之後裝箱資料不能改，被拒收的物流單再次拋單 ──

describe('12.45 確認可出貨之後裝箱資料與數量都不能改：被拒收的物流單以再次拋單處理，仍不成就作廢物流單', () => {
  const rejected = () =>
    sh({
      method: '7-11 交貨便',
      logisticsOrders: [
        lo('SH-TEST-A-01', '拋單成功', { tracking_no: 'PYU-1' }),
        lo('SH-TEST-A-02', '拋單成功', { tracking_no: 'PYU-2' }),
        lo('SH-TEST-A-03', '未拋單', { simulated_carrier_reply: 'reject' }),
        lo('SH-TEST-A-04', '拋單成功', { tracking_no: 'PYU-4' }),
      ],
    });

  it('確認後修正鈕不出現、繞過介面送出被擋：改第 3 箱箱規擋下，裝箱資料、揀貨數量、修正紀錄與歷程都不變', () => {
    seed([rejected()]);
    expect(canCorrectPacking(get())).toBe(false);
    expect(packingCorrectionScope(get())).toEqual({ pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: [] });
    const before = JSON.stringify(get());
    const r = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(get()).map((b) => (b.box_no === '003' ? { ...b, ...f13 } : b)),
      reason: '第 3 箱被物流商拒收，改小一號',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(false);
    expect(JSON.stringify(get())).toBe(before);
    const add = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [...keepBoxes(get()), { box_spec: 'F13 箱', photos: photo, note: '' }],
      reason: '拆成兩箱',
      operator: '范姜宏',
    });
    expect(add.ok).toBe(false);
    expect(JSON.stringify(get())).toBe(before);
  });

  it('被拒收的那一筆以再次拋單處理：第 3 筆拋單失敗、出貨單停在已確認；再次拋單換發我方自編單號 -05 並成功，出貨單轉待出貨；其他筆與箱數不變', () => {
    seed([rejected()]);
    const others = los().filter((l) => l.id !== 'SH-TEST-A-03');
    const first = store().dispatchLogistics('a', 'SH-TEST-A-03', { operator: '曾志偉' });
    expect(first.ok).toBe(false);
    expect(lget('SH-TEST-A-03')).toMatchObject({ dispatch_status: '拋單失敗', dispatch_error: first.error });
    expect(shipmentStatusOf(get())).toBe('已確認');
    const again = store().dispatchLogistics('a', 'SH-TEST-A-03', { operator: '曾志偉' });
    expect(again.ok).toBe(true);
    expect(lget('SH-TEST-A-03')).toMatchObject({ own_order_no: 'SH-TEST-A-05', dispatch_status: '拋單成功' });
    expect(shipmentStatusOf(get())).toBe('待出貨');
    expect(los().filter((l) => l.id !== 'SH-TEST-A-03')).toEqual(others);
    expect(boxCountOf(get())).toBe(4);
  });

  it('再次拋單仍不成時以作廢物流單處理：業務作廢第 3 筆、未送達回補；其他筆不變、箱數維持 4', () => {
    seed([rejected()]);
    store().dispatchLogistics('a', 'SH-TEST-A-03', { operator: '曾志偉' });
    const others = los().filter((l) => l.id !== 'SH-TEST-A-03');
    const before = quota(500);
    expect(store().voidLogistics('a', 'SH-TEST-A-03', { reason: '物流商一直拒收', undelivered: { [NO]: 25 }, operator: '洪嘉駿' }).ok).toBe(true);
    expect(quota(500)).toBe(before + 25);
    expect(los().filter((l) => l.id !== 'SH-TEST-A-03')).toEqual(others);
    expect(boxCountOf(get())).toBe(4);
    expect(shipmentStatusOf(get())).toBe('待出貨');
  });

  it('全數離廠後也沒有裝箱回報修正：三筆運送中 → 揀貨人員沒有修正；繞過介面改第 2 箱箱規擋下、什麼都不變', () => {
    seed([sh({ method: '7-11 交貨便', logisticsOrders: nos(3).map((n) => lo(n, '運送中')) })]);
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
  it('還沒出貨也可下載：鏈九 SH-2026-10-21001（專車配送、已確認、我方自編單號 SH-2026-10-21001-01、沒有物流商標籤）→ 直接提供檔案，含整張出貨單印件與數量；下載中心不新增資料列、貨態不變', () => {
    const chain9 = MOCK_SHIPMENTS.find((x) => x.id === 'sh-0921');
    expect(chain9).toBeTruthy();
    expect(chain9.shipment_no).toBe('SH-2026-10-21001');
    expect(chain9.method).toBe('專車配送');
    expect(chain9.logistics_orders.map((l) => [l.own_order_no, l.dispatch_status, l.cargo_status])).toEqual([
      ['SH-2026-10-21001-01', null, '待出貨'],
    ]);
    const lid = chain9.logistics_orders[0].id;
    const withVoided = {
      ...chain9,
      logistics_orders: [...chain9.logistics_orders, logistics('lg-0921-voided', '已作廢', { dispatch_status: null })],
    };
    seed([withVoided]);
    const r = logisticsFileOf({ shipment: withVoided, logisticsId: lid });
    expect(r.ok).toBe(true);
    expect(r.file).toMatchObject({ logistics_id: lid, own_order_no: 'SH-2026-10-21001-01', tracking_no: null, carrier_label: null });
    expect(r.file.detail_lines).toEqual(withVoided.details.map((d) => ({ print_item_no: d.print_item_no, name: d.name, qty: d.qty })));
    expect(logisticsFileOf({ shipment: withVoided, logisticsId: 'lg-0921-voided' }).ok).toBe(false);

    const statusBefore = withVoided.logistics_orders.map((l) => l.cargo_status);
    expect(store().downloadLogisticsFile(withVoided.id, lid).ok).toBe(true);
    expect(store().downloadLogisticsFile(withVoided.id, 'lg-0921-voided').ok).toBe(false);
    expect(store().downloadFiles).toEqual([]);
    expect(get(withVoided.id).logistics_orders.map((l) => l.cargo_status)).toEqual(statusBefore);
    expect(shipmentStatusOf(get(withVoided.id))).toBe('已確認');
  });

  it('已拋單成功的物流單檔案附物流商標籤', () => {
    const shipment = sh({ method: '新竹物流', logisticsOrders: [lo('SH-TEST-A-01', '拋單成功', { tracking_no: 'HCT-1', label_file: '物流單-HCT-1.pdf' })] });
    expect(logisticsFileOf({ shipment, logisticsId: 'SH-TEST-A-01' }).file).toMatchObject({ tracking_no: 'HCT-1', carrier_label: '物流單-HCT-1.pdf' });
  });

  it('鏈九另兩張：SH-2026-10-22001 順豐已裝箱尚無物流單、SH-2026-10-22002 7-11 交貨便未處理', () => {
    const of = (id) => MOCK_SHIPMENTS.find((x) => x.id === id);
    expect(of('sh-0922')).toMatchObject({ shipment_no: 'SH-2026-10-22001', method: '順豐', status: '已裝箱', logistics_orders: [] });
    expect(of('sh-0922').packing_boxes).toHaveLength(3);
    expect(of('sh-0923')).toMatchObject({ shipment_no: 'SH-2026-10-22002', method: '7-11 交貨便', status: '未處理' });
  });
});

// ── 12.54 分次驗收與分批出貨的跨模組接力 ──

describe('12.54 分次驗收與分批出貨：數量帳每一步對得上（business-scenarios spec § 品檢與出貨）', () => {
  it('購買 1,000、分兩批驗收與兩張出貨單（A 順豐 2 箱、B 自取 1 箱）逐步驗印件印製、可出貨額度、出貨單與物流單', () => {
    seed([], { orderStatus: '製作中', orderedQty: 1000, itemStatus: '製作中' });
    const qc = [{ print_item_no: NO, passed_qty: 500, failed_qty: 0 }];
    const q = () => calcShippableQty(printItem, all(), qc);
    const item = () => useOrdersStore.getState().orders[0].print_items[0];
    const header = {
      planned_ship_date: '2026-10-20',
      receiver_name: '周雅文',
      receiver_phone: '02-2790-6611',
      receiver_zip: '114',
      receiver_city: '台北市',
      receiver_district: '內湖區',
      receiver_address: '文德路 168 號 3 樓',
      packing_note: '',
      note: '',
    };
    const createShipment = (method) => {
      const id = store().createDraft({ order_no: ORDER_NO, client_name: '樣本客戶', created_by: '洪嘉駿', method, planned_details: [{ print_item_no: NO, name: NAME, qty: 500 }], ...header });
      expect(get(id).shipment_no).toBeNull();
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
    // 步驟 2：業務建出貨單 A（送出時產生出貨單編號）
    const a = createShipment('順豐');
    expect(get(a).shipment_no).toMatch(/^SH-\d{4}-\d{2}-\d{5,}$/);
    expect(item().print_item_status).toBe('出貨中');
    expect(q()).toBe(0);
    expect(shipmentStatusOf(get(a))).toBe('未處理');
    // 步驟 3：揀貨、裝箱回報 2 箱，尚無物流單
    store().startPicking(a, '范姜宏');
    expect(shipmentStatusOf(get(a))).toBe('打包中');
    expect(pack(a, 2).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('已裝箱');
    expect(los(a)).toEqual([]);
    // 步驟 4：確認可出貨，產生一筆物流單（未拋單、貨態待出貨），出貨單已確認
    expect(store().confirmShippable(a, { operator: '范姜宏' }).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('已確認');
    expect(los(a).map((l) => [l.own_order_no, l.dispatch_status, l.cargo_status])).toEqual([[`${get(a).shipment_no}-01`, '未拋單', '待出貨']]);
    expect(q()).toBe(0);
    // 步驟 5：拋單成功 → 待出貨；物流商回傳在途 → 運送中
    const aId = los(a)[0].id;
    expect(store().dispatchLogistics(a, aId, { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentStatusOf(get(a))).toBe('待出貨');
    reply(aId, '在途', a);
    expect(shipmentStatusOf(get(a))).toBe('運送中');
    // 步驟 6：第二批驗收通過 500
    qc.push({ print_item_no: NO, passed_qty: 500, failed_qty: 0 });
    expect(q()).toBe(500);
    // 步驟 7：業務建出貨單 B
    const b = createShipment('自取');
    expect(get(b).shipment_no).not.toBe(get(a).shipment_no);
    expect(q()).toBe(0);
    expect(shipmentStatusOf(get(b))).toBe('未處理');
    // 步驟 8：物流商回傳 A 配達，A 送達數量 500，印件仍出貨中
    reply(aId, '配達', a);
    expect(shipmentStatusOf(get(a))).toBe('已送達');
    expect(get(a).details[0].delivered_qty).toBe(500);
    expect(item().print_item_status).toBe('出貨中');
    expect(q()).toBe(0);
    // 步驟 9：B 揀貨、裝箱、確認可出貨、標記可自取、交付確認 → 印件已送達
    store().startPicking(b, '范姜宏');
    pack(b, 1);
    store().confirmShippable(b, { operator: '范姜宏' });
    const bId = los(b)[0].id;
    expect(lget(bId, b).dispatch_status).toBeNull();
    store().dispatchLogistics(b, bId, { operator: '曾志偉' });
    expect(lget(bId, b).cargo_status).toBe('可自取');
    expect(store().confirmLogisticsDelivery(b, bId, { operator: '曾志偉' }).ok).toBe(true);
    expect(lget(bId, b).cargo_status).toBe('已自取');
    expect(shipmentStatusOf(get(b))).toBe('已送達');
    expect(get(b).details[0].delivered_qty).toBe(500);
    expect(item().print_item_status).toBe('已送達');
    expect(q()).toBe(0);
  });
});
