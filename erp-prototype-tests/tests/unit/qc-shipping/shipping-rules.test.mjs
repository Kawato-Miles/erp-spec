import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildPackingCorrection,
  canCorrectPacking,
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
import {
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  BOX_SPEC_OPTIONS,
  BOX_SPECS,
  CUSTOM_BOX_SPEC,
  MOCK_SHIPMENTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { box, departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.5（揀貨數量與明細不符時照實填）、12.19（不符擋下出貨動作、業務改明細或揀貨人員修正後放行）、
// 12.20（裝箱回報修正：每個被改的欄位一筆、原因必填、依項目判斷可執行條件、併發時以當下條件重新檢核）、
// 12.21（拋單生成物流單號與子單號）、12.32（箱規不分出貨方式）、12.44（箱規共用十筆加自訂、長寬高照主檔帶入）、
// 12.45（部分離廠後的修正項目）的驗算。
// 依據：grill G31、G32（拋單失敗不算離廠）；G42～G46、G52、G60（箱規共用與長寬高）；G49、G55（修正依項目）。

const NO = 'PI-2026-0820';
const NAME = '《山城記事》精裝書（128 頁）';

const detail = (qty, picked = null) => ({
  print_item_no: NO,
  name: NAME,
  qty,
  picked_qty: picked,
});

// 已裝箱、物流單都沒有離廠時間的出貨單：10 箱新竹物流（不支援子母單，一箱一筆物流單，這裡只放兩箱）
const shipmentOf = (overrides = {}) => {
  const los = [logistics('SH-2026-9001-001', '已裝箱'), logistics('SH-2026-9001-002', '已裝箱')];
  return {
    ...packedShipment({
      id: 'sh-test-1',
      shipmentNo: 'SH-2026-9001',
      orderNo: 'ORD-TEST-PICK',
      method: '新竹物流',
      printItemNo: NO,
      name: NAME,
      qty: 500,
      logisticsOrders: los,
      boxes: [box('001', 'SH-2026-9001-001'), box('002', 'SH-2026-9001-002')],
    }),
    details: [detail(500, 500)],
    ...overrides,
  };
};

const photo = (name) => ({ name, url: null });
const boxInput = (spec, extra = {}) => ({ box_spec: spec, photos: [photo('裝箱照.jpg')], note: '', ...extra });
const dims = (b) => [b.length ?? null, b.width ?? null, b.height ?? null];

describe('12.19 揀貨不符的判定：任一條明細揀貨數量不等於出貨數量', () => {
  it('每一條都相符時不是不符', () => {
    expect(isPickingMismatch(shipmentOf())).toBe(false);
    expect(mismatchedDetails(shipmentOf())).toEqual([]);
  });

  it('一條不符就是不符，並列出是哪一條', () => {
    const sh = shipmentOf({
      details: [
        detail(500, 500),
        { ...detail(300, 280), print_item_no: 'PI-2026-0821', name: '海報' },
      ],
    });
    expect(isPickingMismatch(sh)).toBe(true);
    expect(mismatchedDetails(sh).map((d) => d.print_item_no)).toEqual(['PI-2026-0821']);
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

  it('不符時出貨人員在物流單上沒有出貨動作，各出貨方式都一樣', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      const sh = shipmentOf({ method, details: [detail(500, 480)] });
      sh.logistics_orders.forEach((lo) => {
        expect(logisticsActionsOf({ role: 'shipper', shipment: sh, logistics: lo })).toEqual([]);
      });
    });
  });

  it('兩數相符後放行：每筆已裝箱物流單各列一顆出貨動作（第三方拋單、專車出貨確認、自取標記可自取）', () => {
    const third = shipmentOf();
    third.logistics_orders.forEach((lo) => {
      expect(logisticsActionsOf({ role: 'shipper', shipment: third, logistics: lo })).toEqual([L.DISPATCH]);
    });
    ['自取', '專車配送'].forEach((method) => {
      const sh = shipmentOf({ method });
      expect(
        logisticsActionsOf({ role: 'shipper', shipment: sh, logistics: sh.logistics_orders[0] }),
      ).toEqual([L.DISPATCH]);
    });
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

  it('每箱箱規必填；箱規要是箱規主檔或「自訂」', () => {
    expect(validatePackingBoxes([boxInput(undefined)]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('順豐標準箱 A（40×30×30）')]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('1 號箱')]).ok).toBe(true);
    expect(validatePackingBoxes([boxInput(CUSTOM_BOX_SPEC)]).ok).toBe(true);
  });

  it('每箱至少一張照片，缺一箱就整批不通過', () => {
    expect(validatePackingBoxes([boxInput('1 號箱'), boxInput('1 號箱', { photos: [] })]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('1 號箱'), boxInput('1 號箱')]).ok).toBe(true);
  });
});

// ── 12.32、12.44 箱規共用與長寬高（grill G42～G46、G52、G60） ──

describe('12.32 箱規選單列全部箱規加自訂，不分出貨方式', () => {
  it('箱規主檔十筆，名稱與長寬高照 grill § 二；K1 箱長寬高留空', () => {
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

  it('選單＝十筆箱規，最後一項為「自訂」；不依出貨方式分組或過濾', () => {
    expect(BOX_SPEC_OPTIONS).toHaveLength(11);
    expect(BOX_SPEC_OPTIONS.slice(0, 10)).toEqual(BOX_SPECS.map((b) => b.name));
    expect(BOX_SPEC_OPTIONS[10]).toBe('自訂');
    expect(CUSTOM_BOX_SPEC).toBe('自訂');
  });

  it('同一個箱規在各出貨方式都能用（裝箱回報檢核不看出貨方式）', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      seed(packingShipment(method));
      const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
        lines: [{ print_item_no: NO, picked_qty: 500 }],
        boxes: [boxInput('馬克杯箱')],
        operator: '范姜宏',
      });
      expect(result.ok, method).toBe(true);
    });
  });
});

describe('12.44 長寬高照箱規主檔帶入並鎖住、只有自訂可填（出貨單卡「長、寬、高的帶入」表）', () => {
  it('選有尺寸的箱規：帶入主檔長寬高並鎖住', () => {
    expect(dimensionsForSpecChange({ nextSpec: '1 號箱' })).toEqual({
      length: 45,
      width: 30,
      height: 15,
      locked: true,
    });
  });

  it('選沒有記尺寸的箱規（K1 箱）：照主檔空白並鎖住；選「自訂」：空白、選填手填', () => {
    expect(dimensionsForSpecChange({ nextSpec: 'K1 箱' })).toEqual({
      length: null,
      width: null,
      height: null,
      locked: true,
    });
    expect(dimensionsForSpecChange({ nextSpec: '自訂' })).toEqual({
      length: null,
      width: null,
      height: null,
      locked: false,
    });
  });

  it('箱規只記長、寬時照實帶入：長、寬帶主檔值，高空白，三欄都鎖住', () => {
    const master = BOX_SPECS.find((b) => b.name === 'K1 箱');
    master.length = 40;
    master.width = 30;
    try {
      expect(dimensionsForSpecChange({ nextSpec: 'K1 箱' })).toEqual({
        length: 40,
        width: 30,
        height: null,
        locked: true,
      });
      expect(validatePackingBoxes([boxInput('K1 箱', { length: 40, width: 30 })]).ok).toBe(true);
      expect(validatePackingBoxes([boxInput('K1 箱', { length: 40, width: 30, height: 10 })]).ok).toBe(false);
    } finally {
      master.length = null;
      master.width = null;
    }
  });

  it('裝箱回報修正改成另一筆箱規照主檔帶入並鎖住（K1 箱帶入空白）；從箱規改成自訂保留原值可修改', () => {
    const prevDims = { length: 45, width: 30, height: 15 };
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: 'F13 箱' })).toEqual({
      length: 29,
      width: 21,
      height: 6,
      locked: true,
    });
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: 'K1 箱' })).toEqual({
      length: null,
      width: null,
      height: null,
      locked: true,
    });
    expect(dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims, nextSpec: '自訂' })).toEqual({
      length: 45,
      width: 30,
      height: 15,
      locked: false,
    });
  });

  it('選有尺寸的箱規時帶入並存下：完成裝箱回報後這一箱為 1 號箱 45×30×15', () => {
    seed(packingShipment('新竹物流'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('1 號箱')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    expect(current().packing_boxes[0].box_spec).toBe('1 號箱');
    expect(dims(current().packing_boxes[0])).toEqual([45, 30, 15]);
  });

  it('依箱規帶入的長寬高不可改：繞過介面送出與箱規不同的值時擋下', () => {
    seed(packingShipment('新竹物流'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('1 號箱', { length: 50, width: 30, height: 15 })],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().status).toBe('打包中');
    expect(current().packing_boxes).toEqual([]);
  });

  it('選沒有記尺寸的箱規時長寬高照實空白：K1 箱空白不擋下，完成後箱規為 K1 箱、長寬高無值', () => {
    seed(packingShipment('全家'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('K1 箱')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const [first] = current().packing_boxes;
    expect(first.box_spec).toBe('K1 箱');
    expect(dims(first)).toEqual([null, null, null]);
  });

  it('K1 箱的長寬高不開放填寫：繞過介面送出任何長寬高時擋下', () => {
    seed(packingShipment('全家'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('K1 箱', { length: 40, width: 30, height: 20 })],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().status).toBe('打包中');
    expect(current().packing_boxes).toEqual([]);
    expect(validatePackingBoxes([boxInput('K1 箱', { height: 20 })]).ok).toBe(false);
  });

  it('選自訂時長寬高選填、箱規存「自訂」不指向任何一筆箱規：第一箱 60×40×30、第二箱無值', () => {
    seed(packingShipment('專車配送'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [boxInput('自訂', { length: 60, width: 40, height: 30 }), boxInput('自訂')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const [first, second] = current().packing_boxes;
    expect(first.box_spec).toBe('自訂');
    expect(BOX_SPECS.some((b) => b.name === first.box_spec)).toBe(false);
    expect(dims(first)).toEqual([60, 40, 30]);
    expect(dims(second)).toEqual([null, null, null]);
  });

  it('手填的長寬高要是大於 0 的數字、最多一位小數', () => {
    expect(validatePackingBoxes([boxInput('自訂', { length: 40.5, width: 30, height: 20 })]).ok).toBe(true);
    expect(validatePackingBoxes([boxInput('自訂', { length: 40.55, width: 30, height: 20 })]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('自訂', { length: -1 })]).ok).toBe(false);
    expect(validatePackingBoxes([boxInput('自訂', { length: 0 })]).ok).toBe(false);
  });

  it('裝箱回報修正改箱規：第一箱改 F13 箱帶入 29、21、6；第二箱改 K1 箱帶入空白；第三箱改自訂保留 45、30、15；修正紀錄第一、二箱各四筆、第三箱只有箱規一筆', () => {
    const sh = packedShipment({
      id: 'sh-test-1',
      shipmentNo: 'SH-2026-9001',
      orderNo: ORDER_NO,
      method: '7-11 交貨便',
      printItemNo: NO,
      name: NAME,
      qty: 500,
      logisticsOrders: [
        logistics('SH-2026-9001-001', '已裝箱'),
        logistics('SH-2026-9001-002', '已裝箱'),
        logistics('SH-2026-9001-003', '已裝箱'),
      ],
    });
    seed(sh);
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [
        { box_no: '001', box_spec: 'F13 箱', photos: ['裝箱照.jpg'], note: '', ...dimensionsForSpecChange({ prevSpec: '1 號箱', prevDims: { length: 45, width: 30, height: 15 }, nextSpec: 'F13 箱' }) },
        { box_no: '002', box_spec: 'K1 箱', photos: ['裝箱照.jpg'], note: '', length: null, width: null, height: null },
        { box_no: '003', box_spec: '自訂', photos: ['裝箱照.jpg'], note: '', length: 45, width: 30, height: 15 },
      ],
      reason: '改用較小的箱子',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const [b1, b2, b3] = current().packing_boxes;
    expect([b1.box_spec, ...dims(b1)]).toEqual(['F13 箱', 29, 21, 6]);
    expect([b2.box_spec, ...dims(b2)]).toEqual(['K1 箱', null, null, null]);
    expect([b3.box_spec, ...dims(b3)]).toEqual(['自訂', 45, 30, 15]);
    const fields = current().packing_corrections.map((c) => c.field);
    expect(fields).toEqual([
      '第 001 箱 箱規',
      '第 001 箱 長',
      '第 001 箱 寬',
      '第 001 箱 高',
      '第 002 箱 箱規',
      '第 002 箱 長',
      '第 002 箱 寬',
      '第 002 箱 高',
      '第 003 箱 箱規',
    ]);
    const len1 = current().packing_corrections.find((c) => c.field === '第 001 箱 長');
    expect([len1.before, len1.after]).toEqual([45, 29]);
  });

  it('每箱各存一份長寬高：箱規主檔日後改尺寸，已存的裝箱資料不跟著變', () => {
    const stored = MOCK_SHIPMENTS.find((x) => x.shipment_no === 'SH-2026-0601').packing_boxes[0];
    const master = BOX_SPECS.find((b) => b.name === stored.box_spec);
    expect(dims(stored)).toEqual([master.length, master.width, master.height]);
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

  it('每箱至少一張照片、箱規要是箱規主檔或自訂', () => {
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: spec, photos: [], note: '' }] })).ok,
    ).toBe(false);
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: 'A 箱（60×40×40）', photos: ['x.jpg'], note: '' }] }))
        .ok,
    ).toBe(false);
  });

  it('打包中、已作廢不成立；有物流單離廠後改揀貨數量不成立（揀貨數量只在未出貨動作）', () => {
    const outShipment = {
      ...base,
      logistics_orders: [departed('SH-2026-9001-001', '等待出貨'), logistics('SH-2026-9001-002', '已裝箱')],
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

// ── store：裝箱回報、修正、改明細 ──

const ORDER_NO = 'ORD-TEST-PICK';

const seed = (shipment) => {
  useOrdersStore.setState({
    orders: [
      {
        id: 'ord-test-pick',
        order_no: ORDER_NO,
        client_name: '樣本客戶',
        status: '出貨中',
        account_company: 'SSP',
        activities: [],
        print_items: [],
      },
    ],
  });
  useQcShippingStore.setState({ shipments: [shipment] });
};

const current = () => useQcShippingStore.getState().shipments[0];

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
  logistics_orders: [],
  packing_corrections: [],
  history: [],
});

describe('裝箱回報寫入明細、裝箱資料與物流單並留歷程', () => {
  const lines = [{ print_item_no: NO, picked_qty: 480 }];

  it('逐條揀貨數量寫進明細，單頭不再有箱規與照片，箱數是計算值', () => {
    seed(packingShipment('新竹物流'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines,
      boxes: [boxInput('1 號箱'), boxInput('馬克杯箱')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.status).toBe('已裝箱');
    expect(sh.details[0].picked_qty).toBe(480);
    expect(sh.actual_qty).toBeUndefined();
    expect(sh.box_spec).toBeUndefined();
    expect(sh.packing_photos).toBeUndefined();
    expect(sh.boxes).toBeUndefined();
    expect(sh.packing_boxes.map((b) => b.box_no)).toEqual(['001', '002']);
    expect(isPickingMismatch(sh)).toBe(true);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('裝箱回報');
    expect(last.actor).toBe('范姜宏');
    expect(last.changes.some((c) => c.field === '出貨單狀態' && c.after === '已裝箱')).toBe(true);
    expect(last.attachments.map((a) => a.name)).toEqual(['裝箱照.jpg', '裝箱照.jpg']);
  });

  it('不支援子母單的出貨方式（新竹物流）：一箱一筆物流單，編號＝出貨單編號＋三位序號', () => {
    seed(packingShipment('新竹物流'));
    useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines,
      boxes: [boxInput('1 號箱'), boxInput('1 號箱'), boxInput('馬克杯箱')],
      operator: '范姜宏',
    });
    const sh = current();
    expect(sh.logistics_orders.map((l) => l.logistics_order_no)).toEqual([
      'SH-2026-9001-001',
      'SH-2026-9001-002',
      'SH-2026-9001-003',
    ]);
    expect(sh.logistics_orders.every((l) => l.status === '已裝箱')).toBe(true);
    expect(sh.packing_boxes.map((b) => b.logistics_order_no)).toEqual(
      sh.logistics_orders.map((l) => l.logistics_order_no),
    );
    expect(shipmentStatusOf(sh)).toBe('已裝箱');
  });

  it('支援子母單的出貨方式（順豐、自取、專車配送、其他）：全部箱子合成一筆物流單', () => {
    ['順豐', '自取', '專車配送', '其他'].forEach((method) => {
      seed(packingShipment(method));
      const spec = '1 號箱';
      useQcShippingStore.getState().reportPacking('sh-test-1', {
        lines,
        boxes: [boxInput(spec), boxInput(spec), boxInput(spec)],
        operator: '范姜宏',
      });
      const sh = current();
      expect(sh.logistics_orders, method).toHaveLength(1);
      expect(sh.logistics_orders[0].logistics_order_no).toBe('SH-2026-9001-001');
      expect(sh.packing_boxes.every((b) => b.logistics_order_no === 'SH-2026-9001-001'), method).toBe(true);
    });
  });

  it('沒有裝箱明細、缺箱規、缺照片或箱規不在箱規主檔都整筆擋下，單上什麼都不變', () => {
    seed(packingShipment('順豐'));
    const spec = '1 號箱';
    const bad = [
      [],
      [boxInput(undefined)],
      [boxInput(spec, { photos: [] })],
      [boxInput('A 箱（60×40×40）')],
    ];
    bad.forEach((boxes) => {
      const result = useQcShippingStore
        .getState()
        .reportPacking('sh-test-1', { lines, boxes, operator: '范姜宏' });
      expect(result.ok).toBe(false);
    });
    expect(current().status).toBe('打包中');
    expect(current().logistics_orders).toEqual([]);
    expect(current().details[0].picked_qty).toBeNull();
  });
});

describe('12.19 業務改明細數量後重新判定不符，揀貨數量不被覆蓋', () => {
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480)] })));

  it('明細數量改為 480 後兩數相符，揀貨數量照舊', () => {
    expect(isPickingMismatch(current())).toBe(true);
    useQcShippingStore
      .getState()
      .updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 480 }], {
        operator: '洪嘉駿',
      });
    const sh = current();
    expect(sh.details[0].qty).toBe(480);
    expect(sh.details[0].picked_qty).toBe(480);
    expect(isPickingMismatch(sh)).toBe(false);
    expect(sh.history[sh.history.length - 1].category).toBe('編輯');
  });

  it('執行過出貨動作之後明細鎖住，改不動', () => {
    seed(
      shipmentOf({
        details: [detail(500, 480)],
        logistics_orders: [departed('SH-2026-9001-001', '等待出貨'), logistics('SH-2026-9001-002', '已裝箱')],
      }),
    );
    useQcShippingStore
      .getState()
      .updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 480 }], {
        operator: '洪嘉駿',
      });
    expect(current().details[0].qty).toBe(500);
  });
});

describe('12.20 裝箱回報修正寫入紀錄與歷程，並同步調整物流單', () => {
  const spec = '1 號箱';
  const nextBoxes = (extra = []) => [
    { box_no: '001', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
    { box_no: '002', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
    ...extra,
  ];
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480)] })));

  it('成立時更新明細與裝箱資料、每個被改的欄位一筆修正紀錄、歷程多一筆；新增箱產生新物流單', () => {
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: nextBoxes([boxInput(spec)]),
      reason: '清點後找到 20 張',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.details[0].picked_qty).toBe(500);
    expect(sh.packing_boxes.map((b) => b.box_no)).toEqual(['001', '002', '003']);
    expect(sh.logistics_orders.map((l) => l.logistics_order_no)).toEqual([
      'SH-2026-9001-001',
      'SH-2026-9001-002',
      'SH-2026-9001-003',
    ]);
    expect(sh.packing_boxes[2].logistics_order_no).toBe('SH-2026-9001-003');
    expect(sh.status).toBe('已裝箱');
    expect(sh.packing_corrections).toHaveLength(2);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('裝箱回報修正');
    expect(last.remark).toContain('清點後找到 20 張');
    expect(last.changes).toHaveLength(2);
  });

  it('刪除一箱時，一箱一筆的物流單隨之刪除；物流單序號不重用', () => {
    useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480 }],
      boxes: [nextBoxes()[0]],
      reason: '多裝了一箱',
      operator: '范姜宏',
    });
    expect(current().logistics_orders.map((l) => l.logistics_order_no)).toEqual(['SH-2026-9001-001']);
    useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480 }],
      boxes: [nextBoxes()[0], boxInput(spec)],
      reason: '又補一箱',
      operator: '范姜宏',
    });
    // 002 已刪過，新箱的箱序與物流單序號都接在最大值之後，不回頭用 002
    expect(current().packing_boxes.map((b) => b.box_no)).toEqual(['001', '003']);
    expect(current().logistics_orders.map((l) => l.logistics_order_no)).toEqual([
      'SH-2026-9001-001',
      'SH-2026-9001-003',
    ]);
  });

  it('支援子母單的出貨方式：新增與刪除箱都留在同一筆物流單', () => {
    const spec2 = '1 號箱';
    seed(
      packedShipment({
        id: 'sh-test-1',
        shipmentNo: 'SH-2026-9001',
        orderNo: ORDER_NO,
        method: '順豐',
        printItemNo: NO,
        name: NAME,
        qty: 500,
        logisticsOrders: [logistics('SH-2026-9001-001', '已裝箱')],
        boxes: [
          box('001', 'SH-2026-9001-001', { box_spec: spec2 }),
          box('002', 'SH-2026-9001-001', { box_spec: spec2 }),
        ],
      }),
    );
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [
        { box_no: '001', box_spec: spec2, photos: ['裝箱照.jpg'], note: '' },
        boxInput(spec2),
        boxInput(spec2),
      ],
      reason: '多兩箱、少一箱',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    expect(current().logistics_orders).toHaveLength(1);
    expect(current().packing_boxes.map((b) => b.logistics_order_no)).toEqual([
      'SH-2026-9001-001',
      'SH-2026-9001-001',
      'SH-2026-9001-001',
    ]);
  });

  it('沒填原因整筆擋下，單上什麼都不變', () => {
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: nextBoxes(),
      reason: '',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().details[0].picked_qty).toBe(480);
    expect(current().packing_corrections).toEqual([]);
  });

  it('有物流單離廠（部分離廠）後不能改揀貨數量：整筆擋下、什麼都不變', () => {
    useQcShippingStore.setState({
      shipments: [
        {
          ...current(),
          logistics_orders: [
            departed('SH-2026-9001-001', '等待出貨'),
            logistics('SH-2026-9001-002', '已裝箱'),
          ],
        },
      ],
    });
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: nextBoxes(),
      reason: '想改',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().details[0].picked_qty).toBe(480);
  });
});

// ── MOCK-DATA-CHAIN 出貨段落的資料形狀（改 mock 的唯一正本是 MOCK-DATA-CHAIN.md） ──

describe('出貨單 mock 形狀：揀貨數量在明細，箱規與物流單號在子表，單頭不存', () => {
  const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);

  it('三張單的單頭都沒有實際裝箱數量、箱規、裝箱照片、物流單號與離廠送達欄位，都有裝箱資料、物流單、修正紀錄與歷程陣列', () => {
    MOCK_SHIPMENTS.forEach((sh) => {
      ['actual_qty', 'per_box_qty', 'box_spec', 'packing_photos', 'tracking_no', 'boxes'].forEach((k) =>
        expect(k in sh, k).toBe(false),
      );
      ['shipped_at', 'shipped_by', 'delivered_at', 'delivered_by', 'delivery_proof'].forEach((k) =>
        expect(k in sh, k).toBe(false),
      );
      sh.details.forEach((d) => expect('per_box_qty' in d).toBe(false));
      expect(Array.isArray(sh.packing_boxes)).toBe(true);
      expect(Array.isArray(sh.logistics_orders)).toBe(true);
      expect(Array.isArray(sh.packing_corrections)).toBe(true);
      expect(Array.isArray(sh.history)).toBe(true);
    });
  });

  it('SH-2026-0601 與 SH-2026-0602 明細照原值填：揀貨數量與出貨數量相符，送達數量等於揀貨數量', () => {
    expect(byNo('SH-2026-0601').details[0]).toMatchObject({ qty: 3000, picked_qty: 3000, delivered_qty: 3000 });
    expect(byNo('SH-2026-0602').details[0]).toMatchObject({ qty: 2000, picked_qty: 2000, delivered_qty: 2000 });
    expect(isPickingMismatch(byNo('SH-2026-0601'))).toBe(false);
    expect(isPickingMismatch(byNo('SH-2026-0602'))).toBe(false);
  });

  it('SH-2026-0601 是順豐五箱、一筆物流單、五個子單號，由物流單算出已送達', () => {
    const sh = byNo('SH-2026-0601');
    expect(sh.method).toBe('順豐');
    expect(sh.packing_boxes).toHaveLength(5);
    expect(sh.logistics_orders).toHaveLength(1);
    expect(sh.logistics_orders[0]).toMatchObject({
      logistics_order_no: 'SH-2026-0601-001',
      status: '已送達',
    });
    expect(sh.logistics_orders[0].tracking_no).toMatch(/^SF/);
    expect(new Set(sh.packing_boxes.map((b) => b.sub_tracking_no)).size).toBe(5);
    expect(sh.packing_boxes.every((b) => b.logistics_order_no === 'SH-2026-0601-001')).toBe(true);
    expect(shipmentStatusOf(sh)).toBe('已送達');
  });

  it('SH-2026-0602 是自取兩箱、一筆物流單，已自取，沒有外部物流單號', () => {
    const sh = byNo('SH-2026-0602');
    expect(sh.method).toBe('自取');
    expect(sh.packing_boxes).toHaveLength(2);
    expect(sh.logistics_orders).toHaveLength(1);
    expect(sh.logistics_orders[0]).toMatchObject({ status: '已自取', tracking_no: null });
    expect(shipmentStatusOf(sh)).toBe('已送達');
  });

  it('已送達的兩張出貨單歷程依序記下每一次狀態變化：順豐多兩筆物流商回傳（已出貨、運送中），自取五筆', () => {
    ['SH-2026-0601', 'SH-2026-0602'].forEach((no) => {
      const categories = byNo(no).history.map((h) => h.category);
      expect(categories.slice(0, 4)).toEqual(['建立出貨單', '開始揀貨', '裝箱回報', '拋單或出貨確認']);
    });
    expect(byNo('SH-2026-0601').history.map((h) => h.category).slice(4)).toEqual([
      '物流商回傳',
      '物流商回傳',
      '送達確認',
    ]);
    expect(byNo('SH-2026-0602').history).toHaveLength(5);
  });

  it('歷程時間與人員取自物流單既有欄位', () => {
    const sh = byNo('SH-2026-0601');
    const lo = sh.logistics_orders[0];
    const ship = sh.history.find((h) => h.category === '拋單或出貨確認');
    expect(ship.at).toBe(lo.left_at);
    expect(ship.actor).toBe(lo.left_by);
    expect(sh.history[0].actor).toBe(sh.created_by);
    const self = byNo('SH-2026-0602');
    const handover = self.logistics_orders[0].history.find((h) => h.category === '交付確認');
    expect(handover.at).toBe(self.logistics_orders[0].delivered_at);
    expect(handover.attachments.map((a) => a.name)).toEqual([self.logistics_orders[0].delivery_proof]);
  });

  it('草稿 SH-2026-0820 的明細、裝箱資料、物流單與歷程皆空', () => {
    const draft = byNo('SH-2026-0820');
    expect(draft.details).toEqual([]);
    expect(draft.packing_boxes).toEqual([]);
    expect(draft.logistics_orders).toEqual([]);
    expect(draft.history).toEqual([]);
  });
});

// ── 12.20、12.45 裝箱回報修正依項目判斷可執行條件（出貨單狀態卡 § 揀貨不符與裝箱回報修正，grill G49、G55） ──

describe('12.45 裝箱回報修正依項目開放：揀貨數量與刪除箱看未出貨動作，新增箱看出貨單已裝箱，修改箱看所屬物流單已裝箱', () => {
  // 7-11 交貨便 4 箱 4 筆物流單，第 1、2、4 筆已拋單成功、第 3 筆被物流商拒收停在已裝箱
  const partial = () =>
    packedShipment({
      id: 'sh-test-1',
      shipmentNo: 'SH-2026-9001',
      orderNo: ORDER_NO,
      method: '7-11 交貨便',
      printItemNo: NO,
      name: NAME,
      qty: 100,
      logisticsOrders: [
        departed('SH-2026-9001-001', '等待出貨', { tracking_no: 'PYU-1' }),
        departed('SH-2026-9001-002', '等待出貨', { tracking_no: 'PYU-2' }),
        logistics('SH-2026-9001-003', '已裝箱'),
        departed('SH-2026-9001-004', '等待出貨', { tracking_no: 'PYU-4' }),
      ],
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

  it('未出貨動作的已裝箱：四個項目都開放', () => {
    const scope = packingCorrectionScope(shipmentOf());
    expect(scope).toMatchObject({ pickedQty: true, deleteBox: true, addBox: true });
    expect(scope.editableBoxNos).toEqual(['001', '002']);
    expect(canCorrectPacking(shipmentOf())).toBe(true);
  });

  it('部分離廠：揀貨數量與刪除箱不開放；只有第 3 箱可改；新增箱開放', () => {
    const scope = packingCorrectionScope(partial());
    expect(scope).toMatchObject({ pickedQty: false, deleteBox: false, addBox: true });
    expect(scope.editableBoxNos).toEqual(['003']);
    expect(canCorrectPacking(partial())).toBe(true);
  });

  it('一筆成功一筆失敗即部分離廠：只開放第二筆物流單底下的箱與新增箱', () => {
    const sh = shipmentOf({
      logistics_orders: [departed('SH-2026-9001-001', '等待出貨'), logistics('SH-2026-9001-002', '已裝箱')],
    });
    const scope = packingCorrectionScope(sh);
    expect(scope).toMatchObject({ pickedQty: false, deleteBox: false, addBox: true });
    expect(scope.editableBoxNos).toEqual(['002']);
  });

  it('全數離廠（出貨單等待出貨）後沒有任何項目可修正，揀貨人員沒有修正', () => {
    const sh = shipmentOf({
      logistics_orders: [departed('SH-2026-9001-001', '等待出貨'), departed('SH-2026-9001-002', '等待出貨')],
    });
    const scope = packingCorrectionScope(sh);
    expect(scope).toMatchObject({ pickedQty: false, deleteBox: false, addBox: false });
    expect(scope.editableBoxNos).toEqual([]);
    expect(canCorrectPacking(sh)).toBe(false);
  });

  it('部分離廠後改被拒收那一箱的箱規：只改第 3 箱，箱規、長、寬、高各一筆修正紀錄，揀貨數量與其他箱不變', () => {
    seed(partial());
    const before = current();
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: keep(before, { '003': f13 }),
      reason: '第 3 箱超過物流商尺寸上限被拒收，改小一號',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const after = current();
    expect(after.packing_corrections.map((c) => c.field)).toEqual([
      '第 003 箱 箱規',
      '第 003 箱 長',
      '第 003 箱 寬',
      '第 003 箱 高',
    ]);
    expect(dims(after.packing_boxes[2])).toEqual([29, 21, 6]);
    ['001', '002', '004'].forEach((no) => {
      expect(after.packing_boxes.find((b) => b.box_no === no)).toEqual(
        before.packing_boxes.find((b) => b.box_no === no),
      );
    });
    expect(after.details[0].picked_qty).toBe(100);
    expect(shipmentStatusOf(after)).toBe('已裝箱');
  });

  it('部分離廠後不能刪箱、不能改已離廠物流單底下的箱、不能改揀貨數量：繞過介面送出時整筆擋下', () => {
    seed(partial());
    const before = JSON.stringify(current());
    const attempts = [
      { lines: [{ print_item_no: NO, picked_qty: 90 }], boxes: keep(current()) },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current()).filter((b) => b.box_no !== '003') },
      { lines: [{ print_item_no: NO, picked_qty: 100 }], boxes: keep(current(), { '001': f13 }) },
    ];
    attempts.forEach((a) => {
      const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
        ...a,
        reason: '想改',
        operator: '范姜宏',
      });
      expect(result.ok).toBe(false);
    });
    expect(JSON.stringify(current())).toBe(before);
  });

  it('全數離廠後繞過介面送出新增箱與修改第 2 箱：擋下，裝箱資料與物流單不變、不產生新物流單', () => {
    seed(
      packedShipment({
        id: 'sh-test-1',
        shipmentNo: 'SH-2026-9001',
        orderNo: ORDER_NO,
        method: '7-11 交貨便',
        printItemNo: NO,
        name: NAME,
        qty: 100,
        logisticsOrders: [
          departed('SH-2026-9001-001', '等待出貨'),
          departed('SH-2026-9001-002', '等待出貨'),
          departed('SH-2026-9001-003', '等待出貨'),
        ],
      }),
    );
    const before = JSON.stringify(current());
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 100 }],
      boxes: [...keep(current(), { '002': f13 }), boxInput('1 號箱')],
      reason: '想多寄一箱',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(current())).toBe(before);
  });
});

describe('12.20 併發：拋單先成功後，裝箱回報修正以當下的可執行條件重新檢核', () => {
  it('揀貨人員照舊畫面送出改揀貨數量與第一箱箱規：擋下並告知已有物流單離廠；只改第二箱時接受', () => {
    // 揀貨人員開啟修正時兩筆物流單都在已裝箱；出貨人員先對第一筆拋單成功
    seed(shipmentOf());
    expect(useQcShippingStore.getState().dispatchLogistics('sh-test-1', 'SH-2026-9001-001', { operator: '曾志偉' }).ok).toBe(true);
    const stale = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480 }],
      boxes: [
        { box_no: '001', box_spec: 'F13 箱', length: 29, width: 21, height: 6, photos: ['裝箱照.jpg'], note: '' },
        { box_no: '002', box_spec: '1 號箱', length: 45, width: 30, height: 15, photos: ['裝箱照.jpg'], note: '' },
      ],
      reason: '改揀貨數量與第一箱',
      operator: '范姜宏',
    });
    expect(stale.ok).toBe(false);
    expect(stale.error).toContain('已有物流單離廠');
    expect(stale.error).toContain('揀貨數量');
    expect(stale.error).toContain('第 001 箱');
    expect(current().details[0].picked_qty).toBe(500);
    expect(current().packing_boxes[0].box_spec).toBe('1 號箱');

    const ok = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500 }],
      boxes: [
        { box_no: '001', box_spec: '1 號箱', length: 45, width: 30, height: 15, photos: ['裝箱照.jpg'], note: '' },
        { box_no: '002', box_spec: 'F13 箱', length: 29, width: 21, height: 6, photos: ['裝箱照.jpg'], note: '' },
      ],
      reason: '第二箱換小箱',
      operator: '范姜宏',
    });
    expect(ok.ok).toBe(true);
    expect(current().packing_boxes[1].box_spec).toBe('F13 箱');
  });
});
