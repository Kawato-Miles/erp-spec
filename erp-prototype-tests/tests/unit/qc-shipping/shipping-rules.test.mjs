import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildPackingCorrection,
  canCorrectPacking,
  confirmShippableCheck,
  dimensionsForSpecChange,
  generateSubTrackingNo,
  generateTrackingNo,
  hasPackingReport,
  isPickingMismatch,
  mismatchedDetails,
  packingCorrectionScope,
  validatePackingBoxes,
  validatePackingLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import { nextBoxNoOf, shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  BOX_SPEC_OPTIONS,
  BOX_SPECS,
  CUSTOM_BOX_SPEC,
  MOCK_SHIPMENTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { box, boxedShipment, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.3（完成裝箱回報不產生物流單）、12.5（揀貨不符照實回報、擋下確認可出貨）、12.19（業務改明細或揀貨人員修正後放行）、
// 12.20（裝箱回報修正：已裝箱時留紀錄不牽動物流單；確認可出貨後只開放所屬物流單未離廠的箱）、12.21（物流單號與子單號）、
// 12.32、12.44（箱規共用十筆加自訂箱規、長寬高照箱規帶入）、12.37（逐箱新增、新增箱先顯示下一個箱序）的驗算。
// 期望值取自 shipment spec（本 change delta）§ 揀貨與裝箱回報、§ 箱規選擇與長寬高帶入、§ 出貨單歷程紀錄。
// 自訂箱規的輸入形狀：{ custom: true, box_spec: 手填名稱 }（box_spec 等於「自訂箱規」時同樣視為自訂箱規、名稱即預設值）；
// 存檔時 box_spec 存手填名稱、custom 為 true，不指向任何一筆箱規（見 api-contract.md）。

const NO = 'PI-2026-0820';
const NAME = '《山城記事》精裝書（128 頁）';
const ORDER_NO = 'ORD-TEST-PICK';

const detail = (qty, picked = null) => ({ print_item_no: NO, name: NAME, qty, picked_qty: picked });

// 已裝箱、尚未確認可出貨的新竹物流出貨單：兩箱、沒有物流單
const shipmentOf = (overrides = {}) => ({
  ...boxedShipment({
    id: 'sh-test-1',
    shipmentNo: 'SH-2026-9001',
    orderNo: ORDER_NO,
    method: '新竹物流',
    printItemNo: NO,
    name: NAME,
    qty: 500,
    boxCount: 2,
  }),
  details: [detail(500, 500)],
  ...overrides,
});

// 已確認可出貨的出貨單（一箱一筆物流單）
const confirmedOf = (method, statuses, qty = 100) =>
  packedShipment({
    id: 'sh-test-1',
    shipmentNo: 'SH-2026-9001',
    orderNo: ORDER_NO,
    method,
    printItemNo: NO,
    name: NAME,
    qty,
    logisticsOrders: statuses.map((s, i) => logistics(`SH-2026-9001-00${i + 1}`, s)),
  });

const photo = (name) => ({ name, url: null });
const boxInput = (spec, extra = {}) => ({ box_spec: spec, photos: [photo('裝箱照.jpg')], note: '', ...extra });
const customInput = (name, extra = {}) => boxInput(name, { custom: true, ...extra });
const dims = (b) => [b.length ?? null, b.width ?? null, b.height ?? null];

const seed = (shipment) => {
  useOrdersStore.setState({
    orders: [
      { id: 'ord-test-pick', order_no: ORDER_NO, client_name: '樣本客戶', status: '出貨中', account_company: 'SSP', activities: [], print_items: [] },
    ],
  });
  useQcShippingStore.setState({ shipments: [shipment], downloadFiles: [] });
};
const current = () => useQcShippingStore.getState().shipments[0];
const store = () => useQcShippingStore.getState();

// 打包中、尚未裝箱回報的單
const packingShipment = (method) => ({
  id: 'sh-test-1',
  shipment_no: 'SH-2026-9001',
  order_no: ORDER_NO,
  status: '打包中',
  method,
  details: [detail(500)],
  planned_details: [],
  packing_boxes: [],
  box_seq: 0,
  logistics_seq: 0,
  logistics_orders: [],
  packing_corrections: [],
  history: [],
});
const keep = (sh, patch = {}) =>
  sh.packing_boxes.map((b) => ({
    box_no: b.box_no,
    box_spec: b.box_spec,
    length: b.length,
    width: b.width,
    height: b.height,
    photos: b.photos,
    note: b.note,
    ...(patch[b.box_no] ?? {}),
  }));
const f13 = { box_spec: 'F13 箱', length: 29, width: 21, height: 6 };

describe('12.5、12.19 揀貨不符的判定：任一條明細揀貨數量不等於出貨數量，不符時擋下確認可出貨', () => {
  it('每一條都相符時不是不符，確認可出貨放行', () => {
    expect(isPickingMismatch(shipmentOf())).toBe(false);
    expect(mismatchedDetails(shipmentOf())).toEqual([]);
    expect(confirmShippableCheck(shipmentOf()).allowed).toBe(true);
  });

  it('一條不符就是不符，並列出是哪一條；確認可出貨擋下', () => {
    const sh = shipmentOf({ details: [detail(500, 500), { ...detail(300, 280), print_item_no: 'PI-2026-0821', name: '海報' }] });
    expect(isPickingMismatch(sh)).toBe(true);
    expect(mismatchedDetails(sh).map((d) => d.print_item_no)).toEqual(['PI-2026-0821']);
    expect(confirmShippableCheck(sh).allowed).toBe(false);
  });

  it('揀貨數量多於出貨數量同樣是不符', () => {
    expect(isPickingMismatch(shipmentOf({ details: [detail(500, 520)] }))).toBe(true);
  });

  it('還沒裝箱回報（揀貨數量為空）不判不符，也不算已有裝箱回報', () => {
    const sh = shipmentOf({ status: '打包中', details: [detail(500)] });
    expect(hasPackingReport(sh)).toBe(false);
    expect(isPickingMismatch(sh)).toBe(false);
  });

  it('草稿與空明細不判不符', () => {
    expect(isPickingMismatch(shipmentOf({ status: '草稿', details: [] }))).toBe(false);
    expect(isPickingMismatch(null)).toBe(false);
  });

  it('揀貨不符照實回報、列表標示並擋下確認可出貨：揀貨 470／明細 500 → 轉已裝箱、不符、確認可出貨被擋下、明細數量不被系統改動、沒有物流單', () => {
    seed(packingShipment('順豐'));
    expect(store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 470 }], boxes: [boxInput('1 號箱')], operator: '范姜宏' }).ok).toBe(true);
    expect(shipmentStatusOf(current())).toBe('已裝箱');
    expect(isPickingMismatch(current())).toBe(true);
    expect(current().details[0]).toMatchObject({ qty: 500, picked_qty: 470 });
    expect(store().confirmShippable('sh-test-1', { operator: '范姜宏' }).ok).toBe(false);
    expect(current().logistics_orders).toEqual([]);
  });
});

describe('12.3 裝箱回報逐條填揀貨數量', () => {
  it('揀貨數量逐條必填、不預填：缺漏即不通過', () => {
    const details = [detail(500)];
    expect(validatePackingLines(details, [{ print_item_no: NO, picked_qty: 500 }]).ok).toBe(true);
    expect(validatePackingLines(details, [{ print_item_no: NO }]).ok).toBe(false);
    expect(validatePackingLines(details, []).ok).toBe(false);
  });

  it('數值檢核：揀貨數量為 0 以上整數', () => {
    const details = [detail(500)];
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: 0 }]).ok,
    ).toBe(true);
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: -1 }]).ok,
    ).toBe(false);
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: 1.5 }]).ok,
    ).toBe(false);
  });
});

describe('12.3 裝箱明細檢核：至少一箱、每箱箱規與至少一張照片', () => {
  it('沒有任何一箱不通過', () => {
    const result = validatePackingBoxes([]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('至少');
  });

  it('每箱箱規必填；箱規要是箱規主檔或自訂箱規', () => {
    expect(validatePackingBoxes([boxInput(undefined)]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('順豐標準箱 A（40×30×30）')]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('1 號箱')]).ok).toBe(true);
    expect(validatePackingBoxes([boxInput(CUSTOM_BOX_SPEC)]).ok).toBe(true);
    expect(validatePackingBoxes([customInput('展架長箱')]).ok).toBe(true);
  });

  it('每箱至少一張照片，缺一箱就整批不通過', () => {
    expect(validatePackingBoxes([boxInput('1 號箱'), boxInput('1 號箱', { photos: [] })]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('1 號箱'), boxInput('1 號箱')]).ok).toBe(true);
  });
});

describe('12.3 揀貨兩步推進並逐條、逐箱回報：完成裝箱回報不產生物流單', () => {
  it('開始揀貨轉打包中、完成裝箱回報轉已裝箱；明細記揀貨數量、三箱各有箱規長寬高照片備註、所屬物流單為空；歷程多「開始揀貨」「裝箱回報」兩筆、裝箱回報附照片', () => {
    seed({ ...packingShipment('順豐'), status: '未處理' });
    store().startPicking('sh-test-1', '范姜宏');
    expect(current().status).toBe('打包中');
    const result = store().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('1 號箱'), boxInput('1 號箱'), boxInput('馬克杯箱')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(shipmentStatusOf(sh)).toBe('已裝箱');
    expect(sh.logistics_orders).toEqual([]);
    expect(sh.details[0].picked_qty).toBe(500);
    expect(sh.packing_boxes.map((b) => [b.box_no, b.box_spec, b.logistics_order_no])).toEqual([
      ['001', '1 號箱', null],
      ['002', '1 號箱', null],
      ['003', '馬克杯箱', null],
    ]);
    const categories = sh.history.map((h) => h.category);
    expect(categories.slice(-2)).toEqual(['開始揀貨', '裝箱回報']);
    const packing = sh.history.at(-1);
    expect(packing.actor).toBe('范姜宏');
    expect(packing.attachments.map((a) => a.name)).toEqual(['裝箱照.jpg', '裝箱照.jpg', '裝箱照.jpg']);
    expect(JSON.stringify(packing.changes)).not.toContain('SH-2026-9001-001');
  });

  it('單頭不存箱規、照片與揀貨總數，箱數是計算值', () => {
    seed(packingShipment('新竹物流'));
    store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 480 }], boxes: [boxInput('1 號箱'), boxInput('馬克杯箱')], operator: '范姜宏' });
    const sh = current();
    ['actual_qty', 'box_spec', 'packing_photos', 'boxes'].forEach((k) => expect(sh[k], k).toBeUndefined());
    expect(isPickingMismatch(sh)).toBe(true);
  });

  it('沒有裝箱明細、缺箱規、缺照片或箱規不在箱規主檔都整筆擋下，單上什麼都不變', () => {
    seed(packingShipment('順豐'));
    const lines = [{ print_item_no: NO, picked_qty: 500 }];
    [[], [boxInput(undefined)], [boxInput('1 號箱', { photos: [] })], [boxInput('A 箱（60×40×40）')]].forEach((boxes) => {
      expect(store().reportPacking('sh-test-1', { lines, boxes, operator: '范姜宏' }).ok).toBe(false);
    });
    expect(current().status).toBe('打包中');
    expect(current().details[0].picked_qty).toBeNull();
  });
});

describe('12.37 逐箱新增、沒有一次新增多箱：新增箱先顯示下一個箱序', () => {
  it('按四次新增一箱、移除一箱後送出 → 三箱、箱序 001 至 003、沒有物流單', () => {
    seed(packingShipment('全家'));
    const r = store().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('1 號箱'), boxInput('1 號箱', { photos: [photo('b.jpg')] }), boxInput('1 號箱', { photos: [photo('c.jpg')] })],
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    expect(current().packing_boxes.map((b) => b.box_no)).toEqual(['001', '002', '003']);
    expect(current().logistics_orders).toEqual([]);
    expect(store().addBoxes).toBeUndefined();
  });

  it('新增箱先顯示下一個箱序：已有 001 至 003 → 004；刪過的箱序不重用', () => {
    expect(nextBoxNoOf(shipmentOf({ box_seq: 3, packing_boxes: ['001', '002', '003'].map((n) => box(n, null)) }))).toBe('004');
    expect(nextBoxNoOf(shipmentOf({ box_seq: 3, packing_boxes: ['001', '003'].map((n) => box(n, null)) }))).toBe('004');
  });
});

// ── 12.32、12.44 箱規共用與長寬高 ──

describe('12.32、12.44 箱規選單列全部箱規加自訂箱規，不分出貨方式', () => {
  it('箱規主檔十筆，名稱與長寬高照 wiki 出貨單 § 箱規；K1 箱長寬高留空', () => {
    expect(BOX_SPECS.map((b) => [b.name, b.length, b.width, b.height])).toEqual([
      ['F12 箱', 15, 11, 4.5],
      ['N3 箱（3 號箱）', 30, 15, 15],
      ['F13 箱', 29, 21, 6],
      ['K1 箱', null, null, null],
      ['MIX 箱（新 Mix 散件）', 35, 25, 15],
      ['300 拼圖箱', 35.5, 45.5, 4.5],
      ['1 號箱', 45, 30, 15],
      ['感官箱', 32, 24, 36],
      ['馬克杯箱', 50, 45, 36],
      ['1000 拼圖箱（地墊箱）', 80, 55, 7.5],
    ]);
    BOX_SPECS.forEach((b) => expect('shipping_method' in b, b.name).toBe(false));
  });

  it('箱規選單列全部箱規加自訂箱規，不分出貨方式：十筆箱規、最後一項為「自訂箱規」', () => {
    expect(BOX_SPEC_OPTIONS).toHaveLength(11);
    expect(BOX_SPEC_OPTIONS.slice(0, 10)).toEqual(BOX_SPECS.map((b) => b.name));
    expect(BOX_SPEC_OPTIONS[10]).toBe('自訂箱規');
    expect(CUSTOM_BOX_SPEC).toBe('自訂箱規');
  });

  it('同一個箱規在各出貨方式都能用（裝箱回報檢核不看出貨方式）', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      seed(packingShipment(method));
      const result = store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [boxInput('馬克杯箱')], operator: '范姜宏' });
      expect(result.ok, method).toBe(true);
    });
  });
});

describe('12.44 長寬高照箱規帶入並鎖住，只有自訂箱規可填（出貨單卡「長、寬、高的帶入」表）', () => {
  it('選有尺寸的箱規時帶入並鎖住：1 號箱 → 45、30、15 鎖住；完成裝箱回報後這一箱為 1 號箱 45×30×15', () => {
    expect(dimensionsForSpecChange({ nextSpec: '1 號箱' })).toEqual({ length: 45, width: 30, height: 15, locked: true });
    seed(packingShipment('新竹物流'));
    expect(store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [boxInput('1 號箱')], operator: '范姜宏' }).ok).toBe(true);
    expect([current().packing_boxes[0].box_spec, ...dims(current().packing_boxes[0])]).toEqual(['1 號箱', 45, 30, 15]);
  });

  it('依箱規帶入的長寬高不可改：繞過介面送出與箱規不同的值時擋下', () => {
    seed(packingShipment('新竹物流'));
    const result = store().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('1 號箱', { length: 50, width: 30, height: 15 })],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().status).toBe('打包中');
    expect(current().packing_boxes).toEqual([]);
  });

  it('選沒有記尺寸的箱規時長寬高照實空白、不開放填寫：K1 箱空白鎖住、不擋下；送出任何長寬高時擋下', () => {
    expect(dimensionsForSpecChange({ nextSpec: 'K1 箱' })).toEqual({ length: null, width: null, height: null, locked: true });
    seed(packingShipment('全家'));
    expect(store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [boxInput('K1 箱', { height: 20 })], operator: '范姜宏' }).ok).toBe(false);
    expect(store().reportPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [boxInput('K1 箱')], operator: '范姜宏' }).ok).toBe(true);
    expect([current().packing_boxes[0].box_spec, ...dims(current().packing_boxes[0])]).toEqual(['K1 箱', null, null, null]);
  });

  it('選自訂箱規時長寬高空白、開放手填；從箱規改成自訂箱規保留原值可修改；改成另一筆箱規照主檔帶入並鎖住', () => {
    expect(dimensionsForSpecChange({ nextSpec: CUSTOM_BOX_SPEC })).toEqual({ length: null, width: null, height: null, locked: false });
    const prevDims = { length: 45, width: 30, height: 15 };
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: CUSTOM_BOX_SPEC })).toEqual({ ...prevDims, locked: false });
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: 'F13 箱' })).toEqual({ length: 29, width: 21, height: 6, locked: true });
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: 'K1 箱' })).toEqual({ length: null, width: null, height: null, locked: true });
  });

  it('選自訂箱規時名稱必填、長寬高選填：第三箱名稱清空時整筆擋下、維持打包中；補回後第一箱存「展架長箱」60×40×30、第二箱存「自訂箱規」無長寬高；三箱都不指向任何一筆箱規', () => {
    seed(packingShipment('專車配送'));
    const lines = [{ print_item_no: NO, picked_qty: 500 }];
    const first = customInput('展架長箱', { length: 60, width: 40, height: 30 });
    const second = customInput(CUSTOM_BOX_SPEC);
    const blocked = store().reportPacking('sh-test-1', { lines, boxes: [first, second, customInput('')], operator: '范姜宏' });
    expect(blocked.ok).toBe(false);
    expect(current().status).toBe('打包中');
    const ok = store().reportPacking('sh-test-1', { lines, boxes: [first, second, customInput('長條箱')], operator: '范姜宏' });
    expect(ok.ok).toBe(true);
    const [b1, b2, b3] = current().packing_boxes;
    expect([b1.box_spec, ...dims(b1)]).toEqual(['展架長箱', 60, 40, 30]);
    expect([b2.box_spec, ...dims(b2)]).toEqual(['自訂箱規', null, null, null]);
    [b1, b2, b3].forEach((b) => {
      expect(b.custom).toBe(true);
      expect(BOX_SPECS.some((m) => m.name === b.box_spec)).toBe(false);
    });
  });

  it('手填的長寬高要是大於 0 的數字、最多一位小數', () => {
    expect(validatePackingBoxes([customInput(CUSTOM_BOX_SPEC, { length: 40.5, width: 30, height: 20 })]).ok).toBe(true);
    expect(validatePackingBoxes([customInput(CUSTOM_BOX_SPEC, { length: 40.55, width: 30, height: 20 })]).ok).toBe(false);
    expect(validatePackingBoxes([customInput(CUSTOM_BOX_SPEC, { length: -1 })]).ok).toBe(false);
    expect(validatePackingBoxes([customInput(CUSTOM_BOX_SPEC, { length: 0 })]).ok).toBe(false);
  });

  it('裝箱回報修正改箱規，長寬高照箱規帶入，改成自訂箱規保留原值：第一箱 F13 箱 29、21、6；第二箱 K1 箱空白；第三箱自訂箱規保留 45、30、15；修正紀錄第一、二箱各四筆、第三箱只有箱規一筆', () => {
    seed({ ...boxedShipment({ id: 'sh-test-1', shipmentNo: 'SH-2026-9001', orderNo: ORDER_NO, method: '7-11 交貨便', printItemNo: NO, name: NAME, qty: 500, boxCount: 3 }) });
    const result = store().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [
        { box_no: '001', photos: ['裝箱照.jpg'], note: '', ...f13 },
        { box_no: '002', box_spec: 'K1 箱', photos: ['裝箱照.jpg'], note: '', length: null, width: null, height: null },
        { box_no: '003', box_spec: CUSTOM_BOX_SPEC, custom: true, photos: ['裝箱照.jpg'], note: '', length: 45, width: 30, height: 15 },
      ],
      reason: '改用較小的箱子',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const [b1, b2, b3] = current().packing_boxes;
    expect([b1.box_spec, ...dims(b1)]).toEqual(['F13 箱', 29, 21, 6]);
    expect([b2.box_spec, ...dims(b2)]).toEqual(['K1 箱', null, null, null]);
    expect([b3.box_spec, ...dims(b3)]).toEqual(['自訂箱規', 45, 30, 15]);
    expect(current().packing_corrections.map((c) => c.field)).toEqual([
      '第 001 箱 箱規', '第 001 箱 長', '第 001 箱 寬', '第 001 箱 高',
      '第 002 箱 箱規', '第 002 箱 長', '第 002 箱 寬', '第 002 箱 高',
      '第 003 箱 箱規',
    ]);
    const len1 = current().packing_corrections.find((c) => c.field === '第 001 箱 長');
    expect([len1.before, len1.after]).toEqual([45, 29]);
  });

  it('每箱各存一份長寬高：箱規主檔日後改尺寸，已存的裝箱資料不跟著變', () => {
    const stored = MOCK_SHIPMENTS.find((x) => x.shipment_no === 'SH-2026-0601').packing_boxes[0];
    const master = BOX_SPECS.find((b) => b.name === stored.box_spec);
    const before = dims(stored);
    const originalLength = master.length;
    master.length = 99;
    try {
      expect(dims(stored)).toEqual(before);
    } finally {
      master.length = originalLength;
    }
  });
});

describe('12.21 拋單生成物流單號與子單號', () => {
  it('物流單號依出貨方式加前綴、九位數字，同一個序號永遠生成同一組', () => {
    expect(generateTrackingNo('新竹物流', 1)).toMatch(/^HCT-\d{9}$/);
    expect(generateTrackingNo('順豐', 1)).toMatch(/^SF\d{9}$/);
    expect(generateTrackingNo('順豐', 1)).toBe(generateTrackingNo('順豐', 1));
    expect(generateTrackingNo('順豐', 1)).not.toBe(generateTrackingNo('順豐', 2));
  });

  it('順豐子單號＝主單號加三位序號，每箱一個', () => {
    expect(generateSubTrackingNo('SF903200001', 0)).toBe('SF903200001001');
    expect(generateSubTrackingNo('SF903200001', 4)).toBe('SF903200001005');
  });
});

describe('12.20 裝箱回報修正的差異判定', () => {
  const base = shipmentOf({ details: [detail(500, 480)] });
  const spec = '1 號箱';
  const next = (patch = {}) => ({
    lines: [{ print_item_no: NO, picked_qty: 480 }],
    boxes: [
      { box_no: '001', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
      { box_no: '002', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
    ],
    reason: '清點後找到 20 張',
    ...patch,
  });
  const build = (n, shipment = base) =>
    buildPackingCorrection({ shipment, next: n, actor: '范姜宏', at: '2026-10-13 10:00' });

  it('修正原因必填，空白不行', () => {
    const result = build(
      next({ reason: '   ', lines: [{ print_item_no: NO, picked_qty: 500 }] }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain('修正原因');
  });

  it('沒有任何欄位被改時不成立', () => {
    expect(build(next()).ok).toBe(false);
  });

  it('一次改了揀貨數量與新增一箱，每個被改的欄位各一筆，其餘欄位不記', () => {
    const result = build(
      next({
        lines: [{ print_item_no: NO, picked_qty: 500 }],
        boxes: [
          ...next().boxes,
          { box_spec: spec, photos: [photo('第三箱.jpg')], note: '補裝' },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(2);
    const [qtyEntry, boxEntry] = result.entries;
    expect(qtyEntry.field).toContain('揀貨數量');
    expect(qtyEntry.before).toBe(480);
    expect(qtyEntry.after).toBe(500);
    expect(boxEntry.field).toBe('新增第 003 箱');
    expect(boxEntry.after).toBe(spec);
    result.entries.forEach((e) => {
      expect(e.corrected_by).toBe('范姜宏');
      expect(e.corrected_at).toBe('2026-10-13 10:00');
      expect(e.reason).toBe('清點後找到 20 張');
    });
    expect(result.nextDetails[0].picked_qty).toBe(500);
    expect(result.nextDetails[0].qty).toBe(500);
    expect(result.nextBoxes.map((b) => b.box_no)).toEqual(['001', '002', '003']);
  });

  it('刪除一箱、改箱規、改備註、換照片各記一筆；刪除與換照片留修正前的照片；至少留一箱', () => {
    const result = build(
      next({
        boxes: [
          {
            box_no: '001',
            box_spec: '馬克杯箱',
            photos: [photo('新裝箱照.jpg')],
            note: '易碎',
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    const fields = result.entries.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining([
        '刪除第 002 箱',
        '第 001 箱 箱規',
        '第 001 箱 備註',
        '第 001 箱 照片',
      ]),
    );
    expect(result.entries.find((e) => e.field === '第 001 箱 照片').before_photos).toEqual(['裝箱照.jpg']);
    expect(result.entries.find((e) => e.field === '刪除第 002 箱').before_photos).toEqual(['裝箱照.jpg']);
    expect(build(next({ boxes: [] })).ok).toBe(false);
  });

  it('新增箱的箱序接在最大箱序之後，刪過的箱序不重用', () => {
    const shipment = { ...base, box_seq: 5 };
    const result = build(
      next({
        boxes: [{ box_no: '001', box_spec: spec, photos: ['裝箱照.jpg'], note: '' }, boxInput(spec)],
      }),
      shipment,
    );
    expect(result.ok).toBe(true);
    expect(result.nextBoxes.map((b) => b.box_no)).toEqual(['001', '006']);
  });

  it('每箱至少一張照片、箱規要是箱規主檔或自訂箱規', () => {
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: spec, photos: [], note: '' }] })).ok,
    ).toBe(false);
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: 'A 箱（60×40×40）', photos: ['x.jpg'], note: '' }] }))
        .ok,
    ).toBe(false);
  });

  it('打包中、已作廢不成立；確認可出貨之後改揀貨數量不成立（揀貨數量只在已裝箱）', () => {
    const outShipment = {
      ...base,
      status: '可出貨',
      logistics_orders: [logistics('SH-2026-9001-001', '等待出貨'), logistics('SH-2026-9001-002', '可出貨')],
      packing_boxes: base.packing_boxes.map((b, i) => ({ ...b, logistics_order_no: `SH-2026-9001-00${i + 1}` })),
    };
    const cases = [
      { ...base, status: '打包中' },
      { ...base, status: '已作廢' },
      outShipment,
    ];
    cases.forEach((shipment) => {
      const result = build(
        next({ lines: [{ print_item_no: NO, picked_qty: 500 }] }),
        shipment,
      );
      expect(result.ok).toBe(false);
    });
  });

  it('不符的判定隨修正重算：改為與出貨數量相同即解除', () => {
    const result = build(
      next({ lines: [{ print_item_no: NO, picked_qty: 500 }] }),
    );
    expect(isPickingMismatch({ ...base, details: result.nextDetails })).toBe(false);
  });
});

// ── store：改明細、裝箱回報修正 ──

describe('12.19 業務改明細或揀貨人員修正揀貨數量後放行', () => {
  it('兩張新竹（明細 100、揀貨 80、各 2 箱）：業務把第一張明細改為 80、揀貨人員把第二張揀貨數量修正為 100 → 兩張不符解除、都能確認可出貨；第一張未出到的 20 留在可出貨額度', () => {
    const one = { ...shipmentOf({ details: [detail(100, 80)] }) };
    seed(one);
    const edited = store().updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 80 }], { operator: '洪嘉駿' });
    expect(edited.ok).toBe(true);
    expect(current().details[0]).toMatchObject({ qty: 80, picked_qty: 80 });
    expect(isPickingMismatch(current())).toBe(false);
    expect(confirmShippableCheck(current()).allowed).toBe(true);
    expect(current().history.at(-1).category).toBe('編輯');

    seed(shipmentOf({ details: [detail(100, 80)] }));
    const fixed = store().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keep(current()),
      reason: '清點後找到 20',
      operator: '范姜宏',
    });
    expect(fixed.ok).toBe(true);
    expect(isPickingMismatch(current())).toBe(false);
    expect(confirmShippableCheck(current()).allowed).toBe(true);
  });

  it('確認可出貨之後明細數量鎖住，改不動', () => {
    seed(confirmedOf('新竹物流', ['可出貨', '可出貨'], 500));
    const r = store().updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 480 }], { operator: '洪嘉駿' });
    expect(r.ok).toBe(false);
    expect(current().details[0].qty).toBe(500);
  });
});

describe('12.20 已裝箱時裝箱回報修正留紀錄、不牽動物流單', () => {
  it('新竹明細 500、揀貨 480、2 箱：第一次沒填原因擋下不變；第二次把揀貨改 500、新增一箱、刪第 1 箱 → 每個被改欄位一筆紀錄、第 1 箱照片留修正前、新箱 003、沒有物流單、歷程一筆裝箱回報修正、維持已裝箱', () => {
    seed(shipmentOf({ details: [detail(500, 480)] }));
    const next = {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [...keep(current()).filter((b) => b.box_no !== '001'), boxInput('1 號箱', { photos: [photo('新箱.jpg')] })],
      operator: '范姜宏',
    };
    const before = JSON.stringify(current());
    expect(store().correctPacking('sh-test-1', { ...next, reason: '' }).ok).toBe(false);
    expect(JSON.stringify(current())).toBe(before);
    expect(store().correctPacking('sh-test-1', { ...next, reason: '清點後找到 20 張' }).ok).toBe(true);
    const sh = current();
    expect(sh.details[0].picked_qty).toBe(500);
    expect(sh.packing_boxes.map((b) => b.box_no)).toEqual(['002', '003']);
    expect(sh.logistics_orders).toEqual([]);
    expect(sh.packing_boxes.every((b) => b.logistics_order_no === null)).toBe(true);
    const fields = sh.packing_corrections.map((c) => c.field);
    expect(fields).toEqual(expect.arrayContaining(['揀貨數量 ' + NAME, '刪除第 001 箱', '新增第 003 箱']));
    expect(sh.packing_corrections.find((c) => c.field === '刪除第 001 箱').before_photos).toEqual(['裝箱照.jpg']);
    const last = sh.history.at(-1);
    expect(last.category).toBe('裝箱回報修正');
    expect(last.remark).toContain('清點後找到 20 張');
    expect(shipmentStatusOf(sh)).toBe('已裝箱');
  });

  it('至少保留一箱：刪光全部箱擋下', () => {
    seed(shipmentOf());
    expect(store().correctPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [], reason: '刪光', operator: '范姜宏' }).ok).toBe(false);
  });
});

describe('12.20、12.45 裝箱回報修正依項目開放：已裝箱四項都開放；確認可出貨後只開放所屬物流單在可出貨或等待出貨的箱', () => {
  it('已裝箱（尚未確認可出貨）：揀貨數量、新增箱、刪除箱、修改每一箱都開放', () => {
    expect(packingCorrectionScope(shipmentOf())).toEqual({ pickedQty: true, deleteBox: true, addBox: true, editableBoxNos: ['001', '002'] });
    expect(canCorrectPacking(shipmentOf())).toBe(true);
  });

  it('確認可出貨後只開放所屬物流單還沒離廠的箱：7-11 三箱（運送中、等待出貨、可出貨）→ 只開放第 2、3 箱；改第 2 箱照片與第 3 箱備註成立，物流單狀態與筆數不變', () => {
    seed(confirmedOf('7-11 交貨便', ['運送中', '等待出貨', '可出貨']));
    expect(packingCorrectionScope(current())).toEqual({ pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: ['002', '003'] });
    const before = current().logistics_orders.map((l) => [l.logistics_order_no, l.status]);
    const r = store().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keep(current(), { '002': { photos: [photo('重拍.jpg')] }, '003': { note: '易碎' } }),
      reason: '照片拍錯、補備註',
      operator: '范姜宏',
    });
    expect(r.ok).toBe(true);
    expect(current().logistics_orders.map((l) => [l.logistics_order_no, l.status])).toEqual(before);
  });

  it('確認可出貨後繞過介面送出修改已離廠物流單底下的箱、刪箱或改揀貨數量：整筆擋下、什麼都不變', () => {
    seed(confirmedOf('7-11 交貨便', ['運送中', '等待出貨', '可出貨']));
    const before = JSON.stringify(current());
    [
      { lines: [{ print_item_no: NO, picked_qty: 90 }], boxes: keep(current()) },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current()).filter((b) => b.box_no !== '003') },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current(), { '001': f13 }) },
    ].forEach((a) => {
      expect(store().correctPacking('sh-test-1', { ...a, reason: '想改', operator: '范姜宏' }).ok).toBe(false);
    });
    expect(JSON.stringify(current())).toBe(before);
  });

  it('全數離廠後沒有任何項目可修正，揀貨人員沒有修正', () => {
    const sh = confirmedOf('7-11 交貨便', ['運送中', '運送中']);
    expect(packingCorrectionScope(sh)).toEqual({ pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: [] });
    expect(canCorrectPacking(sh)).toBe(false);
  });

  it('打包中與已作廢沒有修正', () => {
    expect(canCorrectPacking(shipmentOf({ status: '打包中', details: [detail(500)] }))).toBe(false);
    expect(canCorrectPacking({ ...confirmedOf('順豐', ['已作廢']), status: '已作廢' })).toBe(false);
  });
});

// ── MOCK-DATA-CHAIN 出貨段落的資料形狀（改 mock 的唯一正本是 MOCK-DATA-CHAIN.md） ──

describe('出貨單 mock 形狀：揀貨數量在明細，箱規與物流單號在子表；沒有實際出貨日、離廠時間與送達憑證', () => {
  const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);

  it('每張單的單頭都沒有實際出貨日、實際裝箱數量、箱規、照片、物流單號與送達欄位；物流單沒有離廠時間與送達憑證', () => {
    MOCK_SHIPMENTS.forEach((sh) => {
      ['actual_qty', 'per_box_qty', 'box_spec', 'packing_photos', 'tracking_no', 'boxes', 'actual_ship_date'].forEach((k) =>
        expect(k in sh, `${sh.shipment_no} ${k}`).toBe(false),
      );
      ['shipped_at', 'shipped_by', 'delivered_at', 'delivered_by', 'delivery_proof'].forEach((k) => expect(k in sh, k).toBe(false));
      expect(Array.isArray(sh.packing_boxes)).toBe(true);
      expect(Array.isArray(sh.logistics_orders)).toBe(true);
      expect(Array.isArray(sh.packing_corrections)).toBe(true);
      expect(Array.isArray(sh.history)).toBe(true);
      sh.logistics_orders.forEach((l) => {
        ['left_at', 'left_by', 'delivery_proof'].forEach((k) => expect(k in l, `${l.logistics_order_no} ${k}`).toBe(false));
      });
    });
  });

  it('SH-2026-0601 與 SH-2026-0602 明細照原值填：揀貨數量與出貨數量相符，送達數量等於揀貨數量', () => {
    expect(byNo('SH-2026-0601').details[0]).toMatchObject({ qty: 3000, picked_qty: 3000, delivered_qty: 3000 });
    expect(byNo('SH-2026-0602').details[0]).toMatchObject({ qty: 2000, picked_qty: 2000, delivered_qty: 2000 });
  });

  it('SH-2026-0601 是順豐五箱、一筆物流單、五個子單號，送達由物流商回傳（確認人為物流商同步），由物流單算出已送達', () => {
    const sh = byNo('SH-2026-0601');
    expect(sh.method).toBe('順豐');
    expect(sh.packing_boxes).toHaveLength(5);
    expect(sh.logistics_orders).toHaveLength(1);
    expect(sh.logistics_orders[0]).toMatchObject({ logistics_order_no: 'SH-2026-0601-001', status: '已送達', delivered_by: '物流商同步' });
    expect(sh.logistics_orders[0].tracking_no).toMatch(/^SF/);
    expect(new Set(sh.packing_boxes.map((b) => b.sub_tracking_no)).size).toBe(5);
    expect(shipmentStatusOf(sh)).toBe('已送達');
  });

  it('SH-2026-0601 歷程照第三方新路徑：建立出貨單、開始揀貨、裝箱回報、確認可出貨、拋單或出貨確認（可出貨 → 等待出貨）、物流商回傳（運送中）、物流商回傳（已送達）；沒有已出貨', () => {
    const sh = byNo('SH-2026-0601');
    expect(sh.history.map((h) => h.category)).toEqual([
      '建立出貨單',
      '開始揀貨',
      '裝箱回報',
      '確認可出貨',
      '拋單或出貨確認',
      '物流商回傳',
      '物流商回傳',
    ]);
    const statusAfters = sh.history.flatMap((h) => h.changes ?? []).filter((c) => c.field === '出貨單狀態').map((c) => c.after);
    expect(statusAfters).toEqual(['未處理', '打包中', '已裝箱', '可出貨', '等待出貨', '運送中', '已送達']);
    expect(sh.history[0].actor).toBe(sh.created_by);
  });

  it('SH-2026-0602 是自取兩箱、一筆物流單，已自取、沒有外部物流單號；歷程補交付確認：建立出貨單、開始揀貨、裝箱回報、確認可出貨、拋單或出貨確認（標記可自取）、交付確認', () => {
    const sh = byNo('SH-2026-0602');
    expect(sh.method).toBe('自取');
    expect(sh.logistics_orders[0]).toMatchObject({ status: '已自取', tracking_no: null });
    expect(shipmentStatusOf(sh)).toBe('已送達');
    expect(sh.history.map((h) => h.category)).toEqual(['建立出貨單', '開始揀貨', '裝箱回報', '確認可出貨', '拋單或出貨確認', '交付確認']);
  });

  it('出貨單歷程的出貨動作時間取自物流單歷程的同一事件', () => {
    const sh = byNo('SH-2026-0601');
    const ship = sh.history.find((h) => h.category === '拋單或出貨確認');
    const loShip = sh.logistics_orders[0].history.find((h) => h.category === '拋單或出貨確認');
    expect(ship.at).toBe(loShip.at);
    expect(ship.actor).toBe(loShip.actor);
  });

  it('草稿 SH-2026-0820 的明細、裝箱資料、物流單與歷程皆空', () => {
    const draft = byNo('SH-2026-0820');
    expect(draft.details).toEqual([]);
    expect(draft.packing_boxes).toEqual([]);
    expect(draft.logistics_orders).toEqual([]);
    expect(draft.history).toEqual([]);
  });
});
