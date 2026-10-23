import { beforeEach, describe, expect, it } from 'vitest';
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
  withdrawShippableCheck,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  calcShippableQty,
  DETAILS_LOCKED_HINT,
  LOGISTICS_DELETED_BY_WITHDRAW_HINT,
  useQcShippingStore,
  WITHDRAW_BLOCKED_DISPATCHING_HINT,
  WITHDRAW_IN_PROGRESS_HINT,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { box, boxedShipment, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.46 確認可出貨、12.47 撤回確認可出貨、12.48 確認可出貨與撤回的併發。
// 期望值取自 shipment spec（本 change delta）§ 確認可出貨與撤回確認可出貨、§ 出貨單狀態機、
// § 出貨單歷程紀錄、§ 併發寫入的重新檢核、§ 依出貨方式產生物流單。
// Prototype 沒有真正的併發，「先寫入者」以先呼叫的那一支模擬；處理中與撤回執行中以單據上的旗標
//（物流單 dispatching、出貨單 withdrawing）模擬，見 api-contract.md。

const NO = 'PI-TEST-CONF';
const NAME = '確認樣本';
const ORDER_NO = 'ORD-TEST-CONF';
const printItem = { print_item_no: NO };

const seed = (shipments, { passed = 500, downloadFiles = [] } = {}) => {
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
  useQcShippingStore.setState({ shipments, downloadFiles });
  return [{ print_item_no: NO, passed_qty: passed, failed_qty: 0 }];
};

const store = () => useQcShippingStore.getState();
const get = (id = 'a') => store().shipments.find((x) => x.id === id);
const nos = (id = 'a') => get(id).logistics_orders.map((l) => l.logistics_order_no);
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

// ── 12.46 確認可出貨 ──

describe('12.46 確認可出貨：揀貨相符時產生物流單，揀貨不符時擋下，之後數量與箱數鎖住', () => {
  it('揀貨相符時確認可出貨並產生物流單：順豐 495、5 箱 → 出貨單可出貨，一筆可出貨物流單 -001，5 箱皆屬它；歷程記一筆「確認可出貨」帶 -001', () => {
    seed([boxed({ method: '順豐', qty: 495, boxCount: 5 })]);
    const r = store().confirmShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('可出貨');
    expect(get().logistics_orders).toHaveLength(1);
    expect(get().logistics_orders[0]).toMatchObject({ logistics_order_no: 'SH-TEST-A-001', status: '可出貨' });
    expect(get().packing_boxes.map((b) => b.logistics_order_no)).toEqual(Array(5).fill('SH-TEST-A-001'));
    const last = get().history.at(-1);
    expect(last.category).toBe('確認可出貨');
    expect(last.actor).toBe('范姜宏');
    expect(last.at).toBeTruthy();
    expect(JSON.stringify(last)).toContain('SH-TEST-A-001');
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
    expect(get().packing_boxes.every((b) => b.logistics_order_no === null)).toBe(true);

    const edited = store().updateShipmentDetails('a', [{ print_item_no: NO, name: NAME, qty: 80 }], { operator: '洪嘉駿' });
    expect(edited.ok).toBe(true);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(nos()).toEqual(['SH-TEST-A-001', 'SH-TEST-A-002', 'SH-TEST-A-003']);
    expect(get().logistics_orders.every((l) => l.status === '可出貨')).toBe(true);
  });

  it('揀貨不符時確認可出貨仍渲染、但停用並帶理由（資料條件不符）', () => {
    const option = nextStatusOptions({ role: 'picker', shipment: boxed({ qty: 100, picked: 80 }) }).find(
      (o) => o.key === S.CONFIRM_SHIPPABLE,
    );
    expect(option).toBeTruthy();
    expect(option.disabledReason).toContain('揀貨數量與出貨明細不符');
    const ok = nextStatusOptions({ role: 'picker', shipment: boxed({ qty: 100 }) }).find(
      (o) => o.key === S.CONFIRM_SHIPPABLE,
    );
    expect(ok.status).toBe('可出貨');
    expect(ok.disabledReason ?? null).toBeNull();
  });

  it('揀貨不符時停在已裝箱、沒有物流單：專車 200／揀貨 180 繞過介面確認被擋下；揀貨人員修正為 200 後確認成立，出貨確認後出貨單轉已出貨', () => {
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
    expect(shipmentStatusOf(get())).toBe('可出貨');
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    expect(shipmentStatusOf(get())).toBe('已出貨');
  });

  it('只有已裝箱的出貨單可以確認可出貨：未處理、打包中與已可出貨者繞過介面送出都擋下、不產生物流單', () => {
    const early = (status) => ({ ...boxed({}), status, packing_boxes: [], details: [{ print_item_no: NO, name: NAME, qty: 100, picked_qty: null }] });
    seed([early('未處理')]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    seed([early('打包中')]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    seed([packed({ method: '順豐', logisticsOrders: [logistics('SH-TEST-A-001')] })]);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(false);
    expect(nos()).toEqual(['SH-TEST-A-001']);
  });

  it('確認可出貨後數量與箱數鎖住：新竹 300、3 箱 3 筆可出貨 → 編輯出貨單不開放明細數量；修正只開放三箱的修改；繞過介面改揀貨數量 290 或新增一箱都擋下、什麼都不變', () => {
    seed([
      packed({
        method: '新竹物流',
        qty: 300,
        logisticsOrders: ['001', '002', '003'].map((n) => logistics(`SH-TEST-A-${n}`)),
      }),
    ]);
    expect(canEditShipmentDetails(get())).toBe(false);
    expect(packingCorrectionScope(get())).toEqual({
      pickedQty: false,
      deleteBox: false,
      addBox: false,
      editableBoxNos: ['001', '002', '003'],
    });
    const before = JSON.stringify(get());
    const qty = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 290 }],
      boxes: keepBoxes(get()),
      reason: '想改數量',
      operator: '范姜宏',
    });
    expect(qty.ok).toBe(false);
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

// ── 12.47 撤回確認可出貨 ──

describe('12.47 撤回確認可出貨：刪除物流單並回到已裝箱，序號接續不重用，額度不變', () => {
  const sevenEleven = () =>
    packed({
      method: '7-11 交貨便',
      qty: 400,
      logisticsOrders: ['001', '002', '003', '004'].map((n) => logistics(`SH-TEST-A-${n}`)),
    });

  it('撤回後 -001 至 -004 被刪除、不轉已作廢、不要求未送達數量；4 箱所屬物流單清空；出貨單轉已裝箱；額度前後皆 100；歷程記刪除的編號；再確認產生 -005 至 -009', () => {
    const qc = seed([sevenEleven()]);
    const quota = () => calcShippableQty(printItem, store().shipments, qc);
    expect(quota()).toBe(100);
    expect(pickerKeys(get())).toContain(S.WITHDRAW_SHIPPABLE);

    const r = store().withdrawShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(true);
    expect(get().logistics_orders).toEqual([]);
    expect(get().packing_boxes.map((b) => b.logistics_order_no)).toEqual([null, null, null, null]);
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(quota()).toBe(100);
    const last = get().history.at(-1);
    expect(last.category).toBe('撤回確認可出貨');
    ['001', '002', '003', '004'].forEach((n) => expect(JSON.stringify(last)).toContain(`SH-TEST-A-${n}`));
    expect(JSON.stringify(get().logistics_orders)).not.toContain('已作廢');

    const added = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 400 }],
      boxes: [...keepBoxes(get()), newBox()],
      reason: '多裝一箱',
      operator: '范姜宏',
    });
    expect(added.ok).toBe(true);
    expect(get().packing_boxes.map((b) => b.box_no)).toEqual(['001', '002', '003', '004', '005']);
    expect(store().confirmShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(nos()).toEqual(['SH-TEST-A-005', 'SH-TEST-A-006', 'SH-TEST-A-007', 'SH-TEST-A-008', 'SH-TEST-A-009']);
  });

  it('撤回確認可出貨只給揀貨人員：業務與出貨人員沒有', () => {
    const shipment = sevenEleven();
    expect(nextStatusOptions({ role: 'sales', shipment, canVoid: true }).map((o) => o.key)).not.toContain(
      S.WITHDRAW_SHIPPABLE,
    );
    expect(nextStatusOptions({ role: 'shipper', shipment }).map((o) => o.key)).not.toContain(S.WITHDRAW_SHIPPABLE);
  });

  it('有物流單不在可出貨時不能撤回：新竹（一筆等待出貨、兩筆可出貨）與 7-11（一筆已作廢、兩筆可出貨）都不渲染，繞過介面送出擋下、什麼都不變', () => {
    const hct = packed({
      id: 'h',
      shipmentNo: 'SH-TEST-H',
      method: '新竹物流',
      logisticsOrders: [
        logistics('SH-TEST-H-001', '等待出貨', { tracking_no: 'HCT-1' }),
        logistics('SH-TEST-H-002'),
        logistics('SH-TEST-H-003'),
      ],
    });
    const seven = packed({
      id: 's',
      shipmentNo: 'SH-TEST-S',
      method: '7-11 交貨便',
      logisticsOrders: [
        logistics('SH-TEST-S-001', '已作廢', { void_reason: '箱子壓壞' }),
        logistics('SH-TEST-S-002'),
        logistics('SH-TEST-S-003'),
      ],
    });
    seed([hct, seven]);
    for (const id of ['h', 's']) {
      expect(withdrawShippableCheck(get(id)).allowed, id).toBe(false);
      expect(pickerKeys(get(id)), id).not.toContain(S.WITHDRAW_SHIPPABLE);
      const before = JSON.stringify(get(id));
      expect(store().withdrawShippable(id, { operator: '范姜宏' }).ok, id).toBe(false);
      expect(JSON.stringify(get(id)), id).toBe(before);
    }
  });

  it('撤回時已列印的下載檔案保留：全家兩筆可出貨已列印成功一筆下載檔案，撤回後物流單刪除，該筆下載檔案的狀態、物流單筆數與檔案不變', () => {
    const printed = {
      id: 'DLF-TEST-001',
      file_type: '物流單列印',
      status: '成功',
      logistics_order_nos: ['SH-TEST-A-001', 'SH-TEST-A-002'],
      logistics_count: 2,
      created_at: '2026-10-23 09:00',
      created_by: '曾志偉',
      error_lines: [],
      file: '物流單列印-DLF-TEST-001.pdf',
    };
    seed([packed({ method: '全家', logisticsOrders: [logistics('SH-TEST-A-001'), logistics('SH-TEST-A-002')] })], {
      downloadFiles: [printed],
    });
    expect(store().withdrawShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    expect(get().logistics_orders).toEqual([]);
    expect(store().downloadFiles).toEqual([printed]);
  });

  it('確認可出貨與撤回各記一筆並帶物流單編號：新竹兩箱確認後撤回，歷程依序「確認可出貨」（-001、-002）與「撤回確認可出貨」（-001、-002），撤回後不留這兩筆物流單', () => {
    seed([boxed({ method: '新竹物流', qty: 100, boxCount: 2 })]);
    store().confirmShippable('a', { operator: '范姜宏' });
    store().withdrawShippable('a', { operator: '范姜宏' });
    const [confirmEntry, withdrawEntry] = get().history.slice(-2);
    expect([confirmEntry.category, withdrawEntry.category]).toEqual(['確認可出貨', '撤回確認可出貨']);
    [confirmEntry, withdrawEntry].forEach((e) => {
      expect(e.actor).toBe('范姜宏');
      expect(e.at).toBeTruthy();
      expect(JSON.stringify(e)).toContain('SH-TEST-A-001');
      expect(JSON.stringify(e)).toContain('SH-TEST-A-002');
    });
    expect(get().logistics_orders).toEqual([]);
  });
});

// ── 12.48 確認可出貨與撤回的併發 ──

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

  it('撤回先成立時拋單被擋下：告知該物流單已因撤回確認可出貨刪除、不送出；出貨單為已裝箱、沒有物流單', () => {
    seed([packed({ method: '新竹物流', logisticsOrders: [logistics('SH-TEST-A-001'), logistics('SH-TEST-A-002')] })]);
    expect(store().withdrawShippable('a', { operator: '范姜宏' }).ok).toBe(true);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(LOGISTICS_DELETED_BY_WITHDRAW_HINT);
    expect(shipmentStatusOf(get())).toBe('已裝箱');
    expect(get().logistics_orders).toEqual([]);
  });

  it('撤回執行中時出貨動作擋下', () => {
    seed([
      packed({
        method: '新竹物流',
        withdrawing: true,
        logisticsOrders: [logistics('SH-TEST-A-001'), logistics('SH-TEST-A-002')],
      }),
    ]);
    const r = store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(WITHDRAW_IN_PROGRESS_HINT);
    expect(get().logistics_orders[0].status).toBe('可出貨');
  });

  it('拋單處理中時撤回被擋下：告知有物流單的出貨動作處理中；第一筆拋單成功後撤回不再渲染', () => {
    seed([
      packed({
        method: '7-11 交貨便',
        logisticsOrders: [logistics('SH-TEST-A-001', '可出貨', { dispatching: true }), logistics('SH-TEST-A-002')],
      }),
    ]);
    expect(withdrawShippableCheck(get()).allowed).toBe(false);
    const r = store().withdrawShippable('a', { operator: '范姜宏' });
    expect(r.ok).toBe(false);
    expect(r.error).toBe(WITHDRAW_BLOCKED_DISPATCHING_HINT);
    expect(nos()).toEqual(['SH-TEST-A-001', 'SH-TEST-A-002']);

    seed([packed({ method: '7-11 交貨便', logisticsOrders: [logistics('SH-TEST-A-001'), logistics('SH-TEST-A-002')] })]);
    expect(store().dispatchLogistics('a', 'SH-TEST-A-001', { operator: '曾志偉' }).ok).toBe(true);
    expect(pickerKeys(get())).not.toContain(S.WITHDRAW_SHIPPABLE);
    expect(store().withdrawShippable('a', { operator: '范姜宏' }).ok).toBe(false);
  });

  it('物流商回傳在途先寫入後，裝箱回報修正以當下的可執行條件重新檢核：改第一、二箱箱規被擋下並告知第一箱所屬物流單已離廠；只改第二箱時接受', () => {
    seed([
      packed({
        method: '新竹物流',
        logisticsOrders: [
          logistics('SH-TEST-A-001', '等待出貨', { tracking_no: 'HCT-1' }),
          logistics('SH-TEST-A-002', '等待出貨', { tracking_no: 'HCT-2' }),
        ],
        boxes: [box('001', 'SH-TEST-A-001'), box('002', 'SH-TEST-A-002')],
      }),
    ]);
    expect(store().receiveCarrierReply('a', 'SH-TEST-A-001', { reply: '在途' }).ok).toBe(true);
    const f13 = { box_spec: 'F13 箱', length: 29, width: 21, height: 6 };
    const before = JSON.stringify(get().packing_boxes);
    const stale = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(get()).map((b) => ({ ...b, ...f13 })),
      reason: '兩箱都換小箱',
      operator: '范姜宏',
    });
    expect(stale.ok).toBe(false);
    expect(stale.error).toContain('第 001 箱');
    expect(stale.error).toContain('已離廠');
    expect(JSON.stringify(get().packing_boxes)).toBe(before);

    const ok = store().correctPacking('a', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keepBoxes(get()).map((b) => (b.box_no === '002' ? { ...b, ...f13 } : b)),
      reason: '第二箱換小箱',
      operator: '范姜宏',
    });
    expect(ok.ok).toBe(true);
    expect(get().packing_boxes[1].box_spec).toBe('F13 箱');
  });
});
