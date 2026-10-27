import { describe, expect, it } from 'vitest';
import {
  buildPackingCorrection,
  canCorrectPacking,
  confirmShippableCheck,
  describeBoxes,
  dimensionsForSpecChange,
  generateSubTrackingNo,
  generateTrackingNo,
  hasPackingReport,
  isPickingMismatch,
  MIN_CUSTOM_DIMENSION,
  mismatchedDetails,
  missingReceiverFields,
  missingSenderFields,
  normalizeSenderFields,
  packingCorrectionScope,
  validatePackingBoxes,
  validatePackingLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import { nextBoxNoOf, shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  BOX_SPEC_OPTIONS,
  BOX_SPECS,
  CUSTOM_BOX_SPEC,
  describeShipmentSender,
  formatAddress,
  isValidZip,
  MOCK_SHIPMENTS,
  receiverAddressOf,
  SENDER_BY_ACCOUNT_COMPANY,
  shipmentNoOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { box, boxedShipment, departed, dispatched, logistics, packedShipment, undispatched } from './_fixtures.mjs';

// 情境 12.3（完成裝箱回報不產生物流單）、12.5（揀貨不符照實回報、擋下確認可出貨）、12.19（業務改明細或揀貨人員修正後放行）、
// 12.20、12.45（裝箱回報修正只在已裝箱、整批取代、一次一筆修正紀錄；確認可出貨後全關）、12.21（物流單號與子單號）、
// 12.32、12.44（箱規共用十筆加自訂箱規、材積與預估運費、長寬高照箱規帶入、自訂箱規不存名稱）、
// 12.37（逐箱新增、新增箱先顯示下一個箱序）、12.57（收件與寄件地址四欄、郵遞區號 3 碼或 5 碼）的驗算。
// 期望值取自出貨對齊後端第一版決定表（Miles 2026-10-27 拍板）與 wiki 出貨單 § 揀貨與裝箱回報、§ 箱規、§ 歷程紀錄。
// 自訂箱規的輸入形狀：{ custom: true } 或 box_spec 為「自訂箱規」；存檔時 box_spec 存「自訂箱規」、custom 為 true，
// 不存名稱、不指向任何一筆箱規，長寬高三欄必填、最小 0.1 公分、最多一位小數。

const NO = 'PI-2026-0820';
const NAME = '《山城記事》精裝書（128 頁）';
const ORDER_NO = 'ORD-TEST-PICK';
const SHIPMENT_NO = 'SH-2026-10-30001';

const detail = (qty, picked = null) => ({ print_item_no: NO, name: NAME, qty, picked_qty: picked });

// 已裝箱、尚未確認可出貨的新竹物流出貨單：兩箱、沒有物流單
const shipmentOf = (overrides = {}) => ({
  ...boxedShipment({
    id: 'sh-test-1',
    shipmentNo: SHIPMENT_NO,
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

// 已確認可出貨的出貨單（一箱一筆物流單）；list 為物流單陣列
const confirmedOf = (method, list, qty = 100) =>
  packedShipment({
    id: 'sh-test-1',
    shipmentNo: SHIPMENT_NO,
    orderNo: ORDER_NO,
    method,
    printItemNo: NO,
    name: NAME,
    qty,
    logisticsOrders: list,
  });
const lgNo = (n) => `${SHIPMENT_NO}-0${n}`;

const photo = (name) => ({ name, url: null });
const boxInput = (spec, extra = {}) => ({ box_spec: spec, photos: [photo('裝箱照.jpg')], note: '', ...extra });
const customInput = (extra = {}) => boxInput(CUSTOM_BOX_SPEC, { custom: true, ...extra });
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
  shipment_no: SHIPMENT_NO,
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
    expect(validatePackingLines(details, [{ print_item_no: NO, picked_qty: 0 }]).ok).toBe(true);
    expect(validatePackingLines(details, [{ print_item_no: NO, picked_qty: -1 }]).ok).toBe(false);
    expect(validatePackingLines(details, [{ print_item_no: NO, picked_qty: 1.5 }]).ok).toBe(false);
  });
});

describe('12.3 裝箱明細檢核：至少一箱、每箱箱規與至少一張照片', () => {
  it('沒有任何一箱不通過', () => {
    const result = validatePackingBoxes([]);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('至少');
  });

  it('每箱箱規必填；箱規要是箱規主檔或自訂箱規（自訂箱規要填齊長寬高）', () => {
    expect(validatePackingBoxes([boxInput(undefined)]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('順豐標準箱 A（40×30×30）')]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('1 號箱')]).ok).toBe(true);
    expect(validatePackingBoxes([boxInput(CUSTOM_BOX_SPEC, { length: 60, width: 40, height: 30 })]).ok).toBe(true);
    expect(validatePackingBoxes([customInput({ length: 60, width: 40, height: 30 })]).ok).toBe(true);
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
    expect(sh.packing_boxes.map((b) => [b.box_no, b.box_spec, b.logistics_id])).toEqual([
      ['001', '1 號箱', null],
      ['002', '1 號箱', null],
      ['003', '馬克杯箱', null],
    ]);
    const categories = sh.history.map((h) => h.category);
    expect(categories.slice(-2)).toEqual(['開始揀貨', '裝箱回報']);
    const packing = sh.history.at(-1);
    expect(packing.actor).toBe('范姜宏');
    expect(packing.attachments.map((a) => a.name)).toEqual(['裝箱照.jpg', '裝箱照.jpg', '裝箱照.jpg']);
    expect(JSON.stringify(packing.changes)).not.toContain(lgNo(1));
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

  it('每筆箱規記材積與預估運費（十筆值照決定表）', () => {
    expect(BOX_SPECS.map((b) => [b.name, b.volume, b.est_freight])).toEqual([
      ['F12 箱', 35, 75],
      ['N3 箱（3 號箱）', 60, 75],
      ['F13 箱', 61, 75],
      ['K1 箱', 70, 75],
      ['MIX 箱（新 Mix 散件）', 75, 75],
      ['300 拼圖箱', 86, 105],
      ['1 號箱', 90, 105],
      ['感官箱', 92, 105],
      ['馬克杯箱', 131, 150],
      ['1000 拼圖箱（地墊箱）', 143, 150],
    ]);
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

  it('選自訂箱規時不存名稱、長寬高三欄必填：第三箱缺高時整筆擋下、維持打包中；補齊後三箱都存「自訂箱規」與手填長寬高、不指向任何一筆箱規', () => {
    seed(packingShipment('專車配送'));
    const lines = [{ print_item_no: NO, picked_qty: 500 }];
    const first = customInput({ length: 60, width: 40, height: 30 });
    const second = customInput({ length: 12.5, width: 8, height: 0.1 });
    const blocked = store().reportPacking('sh-test-1', {
      lines,
      boxes: [first, second, customInput({ length: 100, width: 20 })],
      operator: '范姜宏',
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toBe('第 3 箱選自訂箱規，高必填（公分）');
    expect(current().status).toBe('打包中');
    const ok = store().reportPacking('sh-test-1', {
      lines,
      boxes: [first, second, customInput({ length: 100, width: 20, height: 20, box_name: '展架長箱' })],
      operator: '范姜宏',
    });
    expect(ok.ok).toBe(true);
    const [b1, b2, b3] = current().packing_boxes;
    expect([b1.box_spec, ...dims(b1)]).toEqual(['自訂箱規', 60, 40, 30]);
    expect([b2.box_spec, ...dims(b2)]).toEqual(['自訂箱規', 12.5, 8, 0.1]);
    expect([b3.box_spec, ...dims(b3)]).toEqual(['自訂箱規', 100, 20, 20]);
    [b1, b2, b3].forEach((b) => {
      expect(b.custom).toBe(true);
      expect(BOX_SPECS.some((m) => m.name === b.box_spec)).toBe(false);
    });
    expect(JSON.stringify(current().packing_boxes)).not.toContain('展架長箱');
  });

  it('自訂箱規的長寬高三欄必填：缺任一欄擋下並指出第幾箱缺哪一欄', () => {
    expect(validatePackingBoxes([{ ...customInput({ width: 30, height: 20 }), box_no: '001' }]).error).toBe(
      '第 001 箱選自訂箱規，長必填（公分）',
    );
    expect(validatePackingBoxes([customInput({ length: 40, height: 20 })]).error).toBe('第 1 箱選自訂箱規，寬必填（公分）');
    expect(validatePackingBoxes([customInput({ length: 40, width: 30 })]).error).toBe('第 1 箱選自訂箱規，高必填（公分）');
    expect(validatePackingBoxes([customInput()]).ok).toBe(false);
  });

  it('手填的長寬高最小 0.1 公分、最多一位小數：0.1 與 40.5 通過，0.05、0、負數與 40.55 擋下', () => {
    expect(MIN_CUSTOM_DIMENSION).toBe(0.1);
    expect(validatePackingBoxes([customInput({ length: 40.5, width: 30, height: 20 })]).ok).toBe(true);
    expect(validatePackingBoxes([customInput({ length: 0.1, width: 0.1, height: 0.1 })]).ok).toBe(true);
    expect(validatePackingBoxes([customInput({ length: 40.55, width: 30, height: 20 })]).ok).toBe(false);
    expect(validatePackingBoxes([customInput({ length: 0.05, width: 30, height: 20 })]).ok).toBe(false);
    expect(validatePackingBoxes([customInput({ length: 0, width: 30, height: 20 })]).ok).toBe(false);
    const neg = validatePackingBoxes([{ ...customInput({ length: -1, width: 30, height: 20 }), box_no: '001' }]);
    expect(neg.ok).toBe(false);
    expect(neg.error).toBe('第 001 箱的長最小 0.1 公分，最多一位小數');
  });

  it('裝箱回報修正改箱規，長寬高照箱規帶入，改成自訂箱規保留原值：第一箱 F13 箱 29、21、6；第二箱 K1 箱空白；第三箱自訂箱規 45、30、15；修正紀錄一筆，修正前後各三箱', () => {
    seed({ ...boxedShipment({ id: 'sh-test-1', shipmentNo: SHIPMENT_NO, orderNo: ORDER_NO, method: '7-11 交貨便', printItemNo: NO, name: NAME, qty: 500, boxCount: 3 }) });
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
    expect(current().packing_corrections).toHaveLength(1);
    const [record] = current().packing_corrections;
    expect(record.before.boxes.map((b) => [b.box_spec, ...dims(b)])).toEqual([
      ['1 號箱', 45, 30, 15],
      ['1 號箱', 45, 30, 15],
      ['1 號箱', 45, 30, 15],
    ]);
    expect(record.after.boxes.map((b) => [b.box_spec, ...dims(b)])).toEqual([
      ['F13 箱', 29, 21, 6],
      ['K1 箱', null, null, null],
      ['自訂箱規', 45, 30, 15],
    ]);
  });

  it('每箱各存一份長寬高：箱規主檔日後改尺寸，已存的裝箱資料不跟著變', () => {
    const stored = MOCK_SHIPMENTS.find((x) => x.id === 'sh-0601').packing_boxes[0];
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

describe('12.20 裝箱回報修正：整批取代，一次一筆修正紀錄（修正前後整批內容含照片）', () => {
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
    const result = build(next({ reason: '   ', lines: [{ print_item_no: NO, picked_qty: 500 }] }));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('修正原因');
  });

  it('沒有任何欄位被改時不成立', () => {
    expect(build(next()).ok).toBe(false);
  });

  it('一次改了揀貨數量與新增一箱：只產生一筆修正紀錄，修正前與修正後各是整批內容（逐條揀貨數量、整批箱子含照片），記修正人、時間與原因', () => {
    const result = build(
      next({
        lines: [{ print_item_no: NO, picked_qty: 500 }],
        boxes: [...next().boxes, { box_spec: spec, photos: [photo('第三箱.jpg')], note: '補裝' }],
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.entries).toBeUndefined();
    const { record } = result;
    expect(record).toMatchObject({
      corrected_by: '范姜宏',
      corrected_at: '2026-10-13 10:00',
      reason: '清點後找到 20 張',
    });
    expect(record.id).toBeTruthy();
    expect(record.before.lines).toEqual([{ print_item_no: NO, name: NAME, picked_qty: 480 }]);
    expect(record.after.lines).toEqual([{ print_item_no: NO, name: NAME, picked_qty: 500 }]);
    expect(record.before.boxes.map((b) => [b.box_no, b.box_spec, b.photos])).toEqual([
      ['001', spec, ['裝箱照.jpg']],
      ['002', spec, ['裝箱照.jpg']],
    ]);
    expect(record.after.boxes.map((b) => [b.box_no, b.box_spec, b.photos, b.note])).toEqual([
      ['001', spec, ['裝箱照.jpg'], ''],
      ['002', spec, ['裝箱照.jpg'], ''],
      ['003', spec, [photo('第三箱.jpg')], '補裝'],
    ]);
    expect(result.nextDetails[0].picked_qty).toBe(500);
    expect(result.nextDetails[0].qty).toBe(500);
    expect(result.nextBoxes.map((b) => b.box_no)).toEqual(['001', '002', '003']);
    expect(result.nextBoxes.every((b) => b.logistics_id === null)).toBe(true);
  });

  it('刪除一箱、改箱規、改備註、換照片：修正後整批只剩改過的第 001 箱，修正前整批保留兩箱與原照片；至少留一箱', () => {
    const result = build(
      next({
        boxes: [{ box_no: '001', box_spec: '馬克杯箱', photos: [photo('新裝箱照.jpg')], note: '易碎' }],
      }),
    );
    expect(result.ok).toBe(true);
    const { record } = result;
    expect(record.before.boxes.map((b) => [b.box_no, b.box_spec, b.photos, b.note])).toEqual([
      ['001', spec, ['裝箱照.jpg'], ''],
      ['002', spec, ['裝箱照.jpg'], ''],
    ]);
    expect(record.after.boxes.map((b) => [b.box_no, b.box_spec, b.photos, b.note])).toEqual([
      ['001', '馬克杯箱', [photo('新裝箱照.jpg')], '易碎'],
    ]);
    expect(build(next({ boxes: [] })).ok).toBe(false);
  });

  it('新增箱的箱序接在最大箱序之後，刪過的箱序不重用', () => {
    const shipment = { ...base, box_seq: 5 };
    const result = build(
      next({ boxes: [{ box_no: '001', box_spec: spec, photos: ['裝箱照.jpg'], note: '' }, boxInput(spec)] }),
      shipment,
    );
    expect(result.ok).toBe(true);
    expect(result.nextBoxes.map((b) => b.box_no)).toEqual(['001', '006']);
  });

  it('每箱至少一張照片、箱規要是箱規主檔或自訂箱規', () => {
    expect(build(next({ boxes: [{ box_no: '001', box_spec: spec, photos: [], note: '' }] })).ok).toBe(false);
    expect(build(next({ boxes: [{ box_no: '001', box_spec: 'A 箱（60×40×40）', photos: ['x.jpg'], note: '' }] })).ok).toBe(false);
  });

  it('只在已裝箱時成立：打包中、已作廢、已確認（有物流單）都不成立', () => {
    const confirmed = {
      ...base,
      status: '已確認',
      logistics_orders: [undispatched(lgNo(1)), undispatched(lgNo(2))],
      packing_boxes: base.packing_boxes.map((b, i) => ({ ...b, logistics_id: lgNo(i + 1) })),
    };
    [{ ...base, status: '打包中' }, { ...base, status: '已作廢' }, confirmed].forEach((shipment) => {
      const result = build(next({ lines: [{ print_item_no: NO, picked_qty: 500 }] }), shipment);
      expect(result.ok).toBe(false);
    });
  });

  it('不符的判定隨修正重算：改為與出貨數量相同即解除', () => {
    const result = build(next({ lines: [{ print_item_no: NO, picked_qty: 500 }] }));
    expect(isPickingMismatch({ ...base, details: result.nextDetails })).toBe(false);
  });

  it('describeBoxes 把整批箱子寫成一行：箱序、箱規、長寬高、照片檔名、備註', () => {
    expect(
      describeBoxes([
        { box_no: '001', box_spec: '1 號箱', length: 45, width: 30, height: 15, photos: ['a.jpg', photo('b.jpg')], note: '易碎' },
        { box_no: '002', box_spec: 'K1 箱', length: null, width: null, height: null, photos: [], note: '' },
      ]),
    ).toBe('第 001 箱 1 號箱 45×30×15，照片 a.jpg、b.jpg，備註 易碎；第 002 箱 K1 箱 －×－×－，照片 －');
  });
});

// ── store：改明細、裝箱回報修正 ──

describe('12.19 業務改明細或揀貨人員修正揀貨數量後放行', () => {
  it('兩張新竹（明細 100、揀貨 80、各 2 箱）：業務把第一張明細改為 80、揀貨人員把第二張揀貨數量修正為 100 → 兩張不符解除、都能確認可出貨', () => {
    seed(shipmentOf({ details: [detail(100, 80)] }));
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
    seed(confirmedOf('新竹物流', [undispatched(lgNo(1)), undispatched(lgNo(2))], 500));
    const r = store().updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 480 }], { operator: '洪嘉駿' });
    expect(r.ok).toBe(false);
    expect(current().details[0].qty).toBe(500);
  });
});

describe('12.20 已裝箱時裝箱回報修正整批取代、留一筆紀錄、不產生物流單', () => {
  it('新竹明細 500、揀貨 480、2 箱：第一次沒填原因擋下不變；第二次把揀貨改 500、新增一箱、刪第 1 箱 → 一筆修正紀錄（前後整批）、新箱 003、沒有物流單、歷程一筆「裝箱回報修正（整批取代）」含前後值與修正前後照片、維持已裝箱', () => {
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
    expect(sh.packing_boxes.every((b) => b.logistics_id === null)).toBe(true);

    expect(sh.packing_corrections).toHaveLength(1);
    const [record] = sh.packing_corrections;
    expect(record.before.boxes.map((b) => b.box_no)).toEqual(['001', '002']);
    expect(record.after.boxes.map((b) => b.box_no)).toEqual(['002', '003']);
    expect(record.reason).toBe('清點後找到 20 張');
    expect(record.corrected_by).toBe('范姜宏');

    const last = sh.history.at(-1);
    expect(last.category).toBe('裝箱回報修正');
    expect(last.event).toBe('裝箱回報修正（整批取代）');
    expect(last.remark).toBe('修正原因：清點後找到 20 張');
    expect(last.changes).toContainEqual({ field: `揀貨數量 ${NAME}`, before: 480, after: 500 });
    const boxChange = last.changes.find((c) => c.field === '裝箱資料');
    expect(boxChange.before).toBe(describeBoxes(record.before.boxes));
    expect(boxChange.after).toBe(describeBoxes(record.after.boxes));
    expect(last.before_attachments.map((a) => a.name)).toEqual(['裝箱照.jpg', '裝箱照.jpg']);
    expect(last.attachments.map((a) => a.name)).toEqual(['裝箱照.jpg', '新箱.jpg']);
    expect(shipmentStatusOf(sh)).toBe('已裝箱');
  });

  it('再修正一次再多一筆：兩次修正各一筆紀錄、各一筆歷程', () => {
    seed(shipmentOf({ details: [detail(500, 480)] }));
    store().correctPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 490 }], boxes: keep(current()), reason: '第一次', operator: '范姜宏' });
    store().correctPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: keep(current()), reason: '第二次', operator: '范姜宏' });
    expect(current().packing_corrections.map((r) => [r.before.lines[0].picked_qty, r.after.lines[0].picked_qty, r.reason])).toEqual([
      [480, 490, '第一次'],
      [490, 500, '第二次'],
    ]);
    expect(current().history.filter((h) => h.category === '裝箱回報修正')).toHaveLength(2);
  });

  it('至少保留一箱：刪光全部箱擋下', () => {
    seed(shipmentOf());
    expect(store().correctPacking('sh-test-1', { lines: [{ print_item_no: NO, picked_qty: 500 }], boxes: [], reason: '刪光', operator: '范姜宏' }).ok).toBe(false);
  });
});

describe('12.20、12.45 裝箱回報修正只在已裝箱時可做：已裝箱全開，確認可出貨之後全關', () => {
  it('已裝箱（尚未確認可出貨）：揀貨數量、新增箱、刪除箱、修改每一箱都開放', () => {
    expect(packingCorrectionScope(shipmentOf())).toEqual({ pickedQty: true, deleteBox: true, addBox: true, editableBoxNos: ['001', '002'] });
    expect(canCorrectPacking(shipmentOf())).toBe(true);
  });

  it('確認可出貨之後不論物流單貨態都全關：7-11 三筆（未拋單、拋單成功待出貨、運送中）與全部未拋單都沒有可修正項目', () => {
    const none = { pickedQty: false, deleteBox: false, addBox: false, editableBoxNos: [] };
    const mixed = confirmedOf('7-11 交貨便', [undispatched(lgNo(1)), dispatched(lgNo(2)), departed(lgNo(3), '運送中')]);
    const fresh = confirmedOf('7-11 交貨便', [undispatched(lgNo(1)), undispatched(lgNo(2))]);
    [mixed, fresh].forEach((sh) => {
      expect(packingCorrectionScope(sh)).toEqual(none);
      expect(canCorrectPacking(sh)).toBe(false);
    });
  });

  it('確認可出貨之後繞過介面送出修正（改照片、改備註、改箱規、改揀貨數量）：整筆擋下、什麼都不變', () => {
    seed(confirmedOf('7-11 交貨便', [undispatched(lgNo(1)), dispatched(lgNo(2)), departed(lgNo(3), '運送中')]));
    const before = JSON.stringify(current());
    [
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current(), { '002': { photos: [photo('重拍.jpg')] } }) },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current(), { '001': { note: '易碎' } }) },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current(), { '001': f13 }) },
      { lines: [{ print_item_no: NO, picked_qty: 90 }], boxes: keep(current()) },
    ].forEach((a) => {
      expect(store().correctPacking('sh-test-1', { ...a, reason: '想改', operator: '范姜宏' }).ok).toBe(false);
    });
    expect(JSON.stringify(current())).toBe(before);
  });

  it('打包中與已作廢沒有修正', () => {
    expect(canCorrectPacking(shipmentOf({ status: '打包中', details: [detail(500)] }))).toBe(false);
    expect(canCorrectPacking({ ...confirmedOf('順豐', [logistics(lgNo(1), '已作廢')]), status: '已作廢' })).toBe(false);
    expect(canCorrectPacking(shipmentOf({ status: '已作廢' }))).toBe(false);
  });
});

// ── 12.57 收件與寄件地址四欄 ──

describe('12.57 收件與寄件地址拆成郵遞區號、縣市、區、地址四欄；郵遞區號 3 碼或 5 碼', () => {
  const receiver = (patch = {}) => ({
    receiver_name: '王思穎',
    receiver_phone: '',
    receiver_zip: '110',
    receiver_city: '台北市',
    receiver_district: '信義區',
    receiver_address: '菸廠路 88 號 5 樓',
    ...patch,
  });
  const sender = (patch = {}) => ({
    confidential_sender: true,
    sender_brand_name: '晴禾選物',
    sender_phone: '02-2755-0123',
    sender_zip: '106',
    sender_city: '台北市',
    sender_district: '大安區',
    sender_address: '復興南路一段 200 號 5 樓',
    ...patch,
  });

  it('郵遞區號只收 3 碼或 5 碼數字', () => {
    expect(isValidZip('110')).toBe(true);
    expect(isValidZip('11061')).toBe(true);
    ['', '11', '1106', '110611', '11A', '一一〇'].forEach((z) => expect(isValidZip(z), z).toBe(false));
  });

  it('宅配（順豐、新竹物流）收件人與地址四欄齊全、收件電話空白時沒有缺漏（電話在確認可出貨時才檢查）', () => {
    expect(missingReceiverFields(receiver({ method: '順豐' }))).toEqual([]);
    expect(missingReceiverFields(receiver({ method: '新竹物流' }))).toEqual([]);
  });

  it('宅配四欄全空時依序列出收件人、收件郵遞區號、收件縣市、收件區、收件地址；只填空白視同沒填', () => {
    expect(missingReceiverFields({ method: '順豐' }).map((f) => f.label)).toEqual([
      '收件人',
      '收件郵遞區號',
      '收件縣市',
      '收件區',
      '收件地址',
    ]);
    expect(missingReceiverFields(receiver({ method: '順豐', receiver_city: '  ' })).map((f) => f.key)).toEqual(['receiver_city']);
  });

  it('超商不需要收件地址；自取、專車、其他只要收件地址欄', () => {
    expect(missingReceiverFields({ method: '全家', receiver_name: '王思穎' })).toEqual([]);
    expect(missingReceiverFields({ method: '專車配送', receiver_name: '王思穎' }).map((f) => f.key)).toEqual(['receiver_address']);
    expect(
      missingReceiverFields({ method: '自取', receiver_name: '王思穎', receiver_address: '台北市信義區菸廠路 88 號 5 樓' }),
    ).toEqual([]);
  });

  it('收件郵遞區號有填時要 3 碼或 5 碼：4 碼列出格式錯誤，3 碼與 5 碼通過', () => {
    expect(missingReceiverFields(receiver({ method: '順豐', receiver_zip: '1106' }))).toEqual([
      { key: 'receiver_zip_format', label: '收件郵遞區號（3 碼或 5 碼）' },
    ]);
    expect(missingReceiverFields(receiver({ method: '順豐', receiver_zip: '110' }))).toEqual([]);
    expect(missingReceiverFields(receiver({ method: '順豐', receiver_zip: '11061' }))).toEqual([]);
  });

  it('保密代寄未勾選時不檢核寄件資訊', () => {
    expect(missingSenderFields({ confidential_sender: false })).toEqual([]);
  });

  it('保密代寄勾選時寄件人、寄件電話、寄件郵遞區號、寄件縣市、寄件區、寄件地址六欄全部必填', () => {
    expect(missingSenderFields(sender())).toEqual([]);
    expect(missingSenderFields(sender({ sender_zip: '' })).map((f) => f.key)).toEqual(['sender_zip']);
    expect(missingSenderFields({ confidential_sender: true }).map((f) => f.label)).toEqual([
      '寄件人',
      '寄件電話',
      '寄件郵遞區號',
      '寄件縣市',
      '寄件區',
      '寄件地址',
    ]);
  });

  it('寄件郵遞區號有填時要 3 碼或 5 碼', () => {
    expect(missingSenderFields(sender({ sender_zip: '10' }))).toEqual([
      { key: 'sender_zip_format', label: '寄件郵遞區號（3 碼或 5 碼）' },
    ]);
    expect(missingSenderFields(sender({ sender_zip: '106' }))).toEqual([]);
  });

  it('寄件資訊整理：勾選時存寄件人、電話、郵遞區號、縣市、區、地址六欄（去頭尾空白）；未勾選時六欄清空', () => {
    expect(normalizeSenderFields(sender({ sender_brand_name: '  晴禾選物 ', sender_zip: ' 106 ' }))).toEqual({
      confidential_sender: true,
      sender_brand_name: '晴禾選物',
      sender_phone: '02-2755-0123',
      sender_zip: '106',
      sender_city: '台北市',
      sender_district: '大安區',
      sender_address: '復興南路一段 200 號 5 樓',
    });
    expect(normalizeSenderFields({ ...sender(), confidential_sender: false })).toEqual({
      confidential_sender: false,
      sender_brand_name: null,
      sender_phone: null,
      sender_zip: null,
      sender_city: null,
      sender_district: null,
      sender_address: null,
    });
  });

  it('四欄地址合成一行：郵遞區號空白隔開、其餘三欄相連；缺的欄位略過；全空回 null', () => {
    expect(formatAddress({ zip: '110', city: '台北市', district: '信義區', address: '菸廠路 88 號 5 樓' })).toBe('110 台北市信義區菸廠路 88 號 5 樓');
    expect(formatAddress({ city: '台北市', district: '信義區', address: '菸廠路 88 號 5 樓' })).toBe('台北市信義區菸廠路 88 號 5 樓');
    expect(formatAddress({})).toBeNull();
    expect(receiverAddressOf(MOCK_SHIPMENTS.find((x) => x.id === 'sh-0601'))).toBe('110 台北市信義區菸廠路 88 號 5 樓');
  });

  it('帳務公司寄件資訊為寄件人、電話＋地址四欄；一行顯示為「品牌｜電話｜郵遞區號 縣市區地址」', () => {
    expect(SENDER_BY_ACCOUNT_COMPANY.SSP).toEqual({
      brand_name: '感官文化印刷',
      phone: '02 2736 6566',
      zip: '235',
      city: '新北市',
      district: '中和區',
      address: '建康路 168 號 3 樓',
    });
    expect(describeShipmentSender({ confidential_sender: false, sender_company_code: 'SSP' }, null)).toBe(
      '感官文化印刷｜02 2736 6566｜235 新北市中和區建康路 168 號 3 樓',
    );
    expect(describeShipmentSender(MOCK_SHIPMENTS.find((x) => x.id === 'sh-0820'), { account_company: 'SSP' })).toBe(
      '晴禾選物｜02-2755-0123｜106 台北市大安區復興南路一段 200 號 5 樓',
    );
  });
});

// ── MOCK-DATA-CHAIN 出貨段落的資料形狀（改 mock 的唯一正本是 MOCK-DATA-CHAIN.md） ──

describe('出貨單 mock 形狀：揀貨數量在明細，箱規與物流單號在子表；物流單以我方自編單號識別、沒有獨立歷程', () => {
  const byId = (id) => MOCK_SHIPMENTS.find((sh) => sh.id === id);

  it('每張單的單頭都沒有實際出貨日、實際裝箱數量、箱規、照片、物流單號與送達欄位；物流單沒有離廠時間、送達憑證、單一狀態欄與歷程（以我方自編單號識別）', () => {
    MOCK_SHIPMENTS.forEach((sh) => {
      ['actual_qty', 'per_box_qty', 'box_spec', 'packing_photos', 'tracking_no', 'boxes', 'actual_ship_date'].forEach((k) =>
        expect(k in sh, `${sh.id} ${k}`).toBe(false),
      );
      ['shipped_at', 'shipped_by', 'delivered_at', 'delivered_by', 'delivery_proof'].forEach((k) => expect(k in sh, k).toBe(false));
      expect(Array.isArray(sh.packing_boxes)).toBe(true);
      expect(Array.isArray(sh.logistics_orders)).toBe(true);
      expect(Array.isArray(sh.packing_corrections)).toBe(true);
      expect(Array.isArray(sh.history)).toBe(true);
      sh.logistics_orders.forEach((l) => {
        ['left_at', 'left_by', 'delivery_proof', 'logistics_order_no', 'status', 'history'].forEach((k) =>
          expect(k in l, `${l.own_order_no} ${k}`).toBe(false),
        );
        expect(l.own_order_no.startsWith(`${sh.shipment_no}-`), l.own_order_no).toBe(true);
      });
      sh.packing_boxes.forEach((b) => expect('logistics_order_no' in b, `${sh.id} ${b.box_no}`).toBe(false));
    });
  });

  it('出貨單編號格式為 SH-年-月-日加當日流水號（至少三碼）；草稿沒有編號、顯示「－」', () => {
    MOCK_SHIPMENTS.filter((sh) => sh.status !== '草稿').forEach((sh) =>
      expect(sh.shipment_no, sh.id).toMatch(/^SH-\d{4}-\d{2}-\d{2}\d{3,}$/),
    );
    expect(byId('sh-0601').shipment_no).toBe('SH-2026-06-18001');
    expect(byId('sh-0820').shipment_no).toBeNull();
    expect(shipmentNoOf(byId('sh-0820'))).toBe('－');
  });

  it('SH-2026-06-18001 與 SH-2026-06-22001 明細照原值填：揀貨數量與出貨數量相符，送達數量等於揀貨數量', () => {
    expect(byId('sh-0601').details[0]).toMatchObject({ qty: 3000, picked_qty: 3000, delivered_qty: 3000 });
    expect(byId('sh-0602').details[0]).toMatchObject({ qty: 2000, picked_qty: 2000, delivered_qty: 2000 });
  });

  it('SH-2026-06-18001 是順豐五箱、一筆物流單（我方自編單號 -01、拋單成功、貨態已送達）、五個子單號，送達由物流商回傳（確認人為物流商同步），由物流單算出已送達', () => {
    const sh = byId('sh-0601');
    expect(sh.method).toBe('順豐');
    expect(sh.packing_boxes).toHaveLength(5);
    expect(sh.logistics_orders).toHaveLength(1);
    expect(sh.logistics_orders[0]).toMatchObject({
      own_order_no: 'SH-2026-06-18001-01',
      dispatch_status: '拋單成功',
      cargo_status: '已送達',
      delivered_by: '物流商同步',
    });
    expect(sh.logistics_orders[0].tracking_no).toMatch(/^SF/);
    expect(sh.packing_boxes.every((b) => b.logistics_id === sh.logistics_orders[0].id)).toBe(true);
    expect(new Set(sh.packing_boxes.map((b) => b.sub_tracking_no)).size).toBe(5);
    expect(shipmentStatusOf(sh)).toBe('已送達');
  });

  it('SH-2026-06-18001 歷程照第三方新路徑：建立出貨單、開始揀貨、裝箱回報、確認可出貨、拋單成功（已確認 → 待出貨）、貨態更新（運送中）、貨態更新（已送達）；沒有已出貨', () => {
    const sh = byId('sh-0601');
    expect(sh.history.map((h) => h.category)).toEqual([
      '建立出貨單',
      '開始揀貨',
      '裝箱回報',
      '確認可出貨',
      '拋單成功',
      '貨態更新',
      '貨態更新',
    ]);
    const statusAfters = sh.history.flatMap((h) => h.changes ?? []).filter((c) => c.field === '出貨單狀態').map((c) => c.after);
    expect(statusAfters).toEqual(['未處理', '打包中', '已裝箱', '已確認', '待出貨', '運送中', '已送達']);
    expect(sh.history[0].actor).toBe(sh.created_by);
  });

  it('SH-2026-06-22001 是自取兩箱、一筆物流單，已自取、沒有拋單狀態與外部物流單號；歷程：建立出貨單、開始揀貨、裝箱回報、確認可出貨、出貨確認或標記可自取、交付確認', () => {
    const sh = byId('sh-0602');
    expect(sh.method).toBe('自取');
    expect(sh.logistics_orders[0]).toMatchObject({ cargo_status: '已自取', dispatch_status: null, tracking_no: null });
    expect(shipmentStatusOf(sh)).toBe('已送達');
    expect(sh.history.map((h) => h.category)).toEqual(['建立出貨單', '開始揀貨', '裝箱回報', '確認可出貨', '出貨確認或標記可自取', '交付確認']);
  });

  it('物流單沒有獨立歷程：物流單的事件記在出貨單歷程，事件文字帶「（物流單 <我方自編單號>）」', () => {
    const sh = byId('sh-0601');
    const own = sh.logistics_orders[0].own_order_no;
    const events = sh.history.filter((h) => ['拋單成功', '貨態更新'].includes(h.category));
    expect(events).toHaveLength(3);
    events.forEach((h) => expect(h.event).toContain(`（物流單 ${own}）`));
  });

  it('草稿（鏈四，客戶晨光文創）沒有出貨單編號；明細、裝箱資料、物流單與歷程皆空', () => {
    const draft = byId('sh-0820');
    expect(draft.status).toBe('草稿');
    expect(draft.client_name).toContain('晨光文創');
    expect(draft.shipment_no).toBeNull();
    expect(draft.details).toEqual([]);
    expect(draft.packing_boxes).toEqual([]);
    expect(draft.logistics_orders).toEqual([]);
    expect(draft.history).toEqual([]);
  });
});
