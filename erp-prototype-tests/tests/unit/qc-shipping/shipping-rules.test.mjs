import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildPackingCorrection,
  generateSubTrackingNo,
  generateTrackingNo,
  hasPackingReport,
  isPickingMismatch,
  mismatchedDetails,
  validatePackingBoxes,
  validatePackingLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import {
  nextStatusOptions,
  SHIPMENT_LEVEL_KEY as S,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import {
  boxSpecOptionsOf,
  MOCK_SHIPMENTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import { box, departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.5（揀貨數量與明細不符時照實填）、12.19（不符擋下出貨動作、業務改明細或揀貨人員修正後放行）、
// 12.20（裝箱回報修正：每個被改的欄位一筆、原因必填、只限未出貨動作）、12.21（拋單生成物流單號與子單號）的驗算。

const NO = 'PI-2026-0820';
const NAME = '《山城記事》精裝書（128 頁）';

const detail = (qty, picked = null, perBox = null) => ({
  print_item_no: NO,
  name: NAME,
  qty,
  picked_qty: picked,
  per_box_qty: perBox,
});

// 已裝箱、尚未執行過出貨動作的出貨單：10 箱新竹物流（不支援子母單，一箱一筆物流單，這裡只放兩箱）
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
      boxes: [
        box('001', 'SH-2026-9001-001', { box_spec: '新竹物流 60 公分箱' }),
        box('002', 'SH-2026-9001-002', { box_spec: '新竹物流 60 公分箱' }),
      ],
    }),
    details: [detail(500, 500, 50)],
    ...overrides,
  };
};

const photo = (name) => ({ name, url: null });
const boxInput = (spec, extra = {}) => ({ box_spec: spec, photos: [photo('裝箱照.jpg')], note: '', ...extra });

describe('12.19 揀貨不符的判定：任一條明細揀貨數量不等於出貨數量', () => {
  it('每一條都相符時不是不符', () => {
    expect(isPickingMismatch(shipmentOf())).toBe(false);
    expect(mismatchedDetails(shipmentOf())).toEqual([]);
  });

  it('一條不符就是不符，並列出是哪一條', () => {
    const sh = shipmentOf({
      details: [
        detail(500, 500, 50),
        { ...detail(300, 280, 28), print_item_no: 'PI-2026-0821', name: '海報' },
      ],
    });
    expect(isPickingMismatch(sh)).toBe(true);
    expect(mismatchedDetails(sh).map((d) => d.print_item_no)).toEqual(['PI-2026-0821']);
  });

  it('揀貨數量多於出貨數量同樣是不符', () => {
    expect(isPickingMismatch(shipmentOf({ details: [detail(500, 520, 52)] }))).toBe(true);
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

  it('不符時出貨人員沒有出貨動作，各出貨方式都一樣', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      const sh = shipmentOf({ method, details: [detail(500, 480, 48)] });
      expect(nextStatusOptions({ role: 'shipper', shipment: sh })).toEqual([]);
    });
  });

  it('兩數相符後放行：第三方列拋單、專車列出貨確認、自取列標記可自取', () => {
    const third = nextStatusOptions({ role: 'shipper', shipment: shipmentOf() });
    expect(third.map((o) => o.key)).toEqual([S.DISPATCH]);
    expect(third[0].label).toContain('拋單');
    expect(third[0].required).toEqual([]);
    expect(
      nextStatusOptions({ role: 'shipper', shipment: shipmentOf({ method: '自取' }) })[0].label,
    ).toContain('標記可自取');
    expect(
      nextStatusOptions({ role: 'shipper', shipment: shipmentOf({ method: '專車配送' }) })[0].label,
    ).toContain('出貨確認');
  });
});

describe('12.3 裝箱回報逐條填揀貨數量與每箱幾個', () => {
  it('兩個欄位逐條必填、不預填：缺一個即不通過', () => {
    const details = [detail(500)];
    expect(validatePackingLines(details, [{ print_item_no: NO, picked_qty: 500 }]).ok).toBe(false);
    expect(validatePackingLines(details, [{ print_item_no: NO, per_box_qty: 50 }]).ok).toBe(false);
    expect(validatePackingLines(details, []).ok).toBe(false);
  });

  it('數值檢核：揀貨數量為 0 以上整數、每箱幾個為 1 以上整數', () => {
    const details = [detail(500)];
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: 0, per_box_qty: 50 }]).ok,
    ).toBe(true);
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: -1, per_box_qty: 50 }]).ok,
    ).toBe(false);
    expect(
      validatePackingLines(details, [{ print_item_no: NO, picked_qty: 500, per_box_qty: 0 }]).ok,
    ).toBe(false);
  });
});

describe('12.3 裝箱明細檢核：至少一箱、每箱箱規與至少一張照片、箱規只能選本出貨方式的', () => {
  it('沒有任何一箱不通過', () => {
    const result = validatePackingBoxes('順豐', []);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('至少');
  });

  it('每箱箱規必填；箱規只列本出貨方式的箱規', () => {
    expect(validatePackingBoxes('順豐', [boxInput(undefined)]).ok).toBe(false);
    expect(validatePackingBoxes('順豐', [boxInput('A 箱（60×40×40）')]).ok).toBe(false);
    expect(validatePackingBoxes('順豐', [boxInput(boxSpecOptionsOf('順豐')[0])]).ok).toBe(true);
  });

  it('自取、專車配送、其他共用公司自有箱規；順豐、新竹物流、7-11 交貨便、全家各有一組不重疊', () => {
    const own = boxSpecOptionsOf('自取');
    expect(boxSpecOptionsOf('專車配送')).toEqual(own);
    expect(boxSpecOptionsOf('其他')).toEqual(own);
    const groups = ['順豐', '新竹物流', '7-11 交貨便', '全家'].map((m) => boxSpecOptionsOf(m));
    const all = [own, ...groups].flat();
    expect(new Set(all).size).toBe(all.length);
    expect(validatePackingBoxes('專車配送', [boxInput(own[0])]).ok).toBe(true);
    expect(validatePackingBoxes('7-11 交貨便', [boxInput(own[0])]).ok).toBe(false);
  });

  it('每箱至少一張照片，缺一箱就整批不通過', () => {
    const spec = boxSpecOptionsOf('順豐')[0];
    expect(validatePackingBoxes('順豐', [boxInput(spec), boxInput(spec, { photos: [] })]).ok).toBe(false);
    expect(validatePackingBoxes('順豐', [boxInput(spec), boxInput(spec)]).ok).toBe(true);
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
  const base = shipmentOf({ details: [detail(500, 480, 48)] });
  const spec = '新竹物流 60 公分箱';
  const next = (patch = {}) => ({
    lines: [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }],
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
      next({ reason: '   ', lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }] }),
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
        lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }],
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
            box_spec: '新竹物流 90 公分箱',
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

  it('每箱至少一張照片、箱規要屬於本出貨方式', () => {
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: spec, photos: [], note: '' }] })).ok,
    ).toBe(false);
    expect(
      build(next({ boxes: [{ box_no: '001', box_spec: 'A 箱（60×40×40）', photos: ['x.jpg'], note: '' }] }))
        .ok,
    ).toBe(false);
  });

  it('只限未出貨動作的已裝箱：打包中、已執行過出貨動作、終態都不成立', () => {
    const outShipment = {
      ...base,
      logistics_orders: [departed('SH-2026-9001-001', '等待出貨'), logistics('SH-2026-9001-002', '已裝箱')],
    };
    const failedShipment = {
      ...base,
      logistics_orders: [
        logistics('SH-2026-9001-001', '已裝箱', { dispatch_attempts: 1, dispatch_error: '拒收' }),
        logistics('SH-2026-9001-002', '已裝箱'),
      ],
    };
    const cases = [
      { ...base, status: '打包中' },
      { ...base, status: '已作廢' },
      outShipment,
      failedShipment,
    ];
    cases.forEach((shipment) => {
      const result = build(
        next({ lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }] }),
        shipment,
      );
      expect(result.ok).toBe(false);
    });
  });

  it('不符的判定隨修正重算：改為與出貨數量相同即解除', () => {
    const result = build(
      next({ lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }] }),
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
  const lines = [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }];

  it('逐條揀貨數量與每箱幾個寫進明細，單頭不再有箱規與照片，箱數是計算值', () => {
    seed(packingShipment('新竹物流'));
    const result = useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines,
      boxes: [boxInput('新竹物流 60 公分箱'), boxInput('新竹物流 90 公分箱')],
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.status).toBe('已裝箱');
    expect(sh.details[0].picked_qty).toBe(480);
    expect(sh.details[0].per_box_qty).toBe(48);
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
      boxes: [boxInput('新竹物流 60 公分箱'), boxInput('新竹物流 60 公分箱'), boxInput('新竹物流 90 公分箱')],
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
      const spec = boxSpecOptionsOf(method)[0];
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

  it('沒有裝箱明細、缺箱規、缺照片或箱規不屬於本出貨方式都整筆擋下，單上什麼都不變', () => {
    seed(packingShipment('順豐'));
    const spec = boxSpecOptionsOf('順豐')[0];
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
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480, 48)] })));

  it('明細數量改為 480 後兩數相符，揀貨數量與每箱幾個照舊', () => {
    expect(isPickingMismatch(current())).toBe(true);
    useQcShippingStore
      .getState()
      .updateShipmentDetails('sh-test-1', [{ print_item_no: NO, name: NAME, qty: 480 }], {
        operator: '洪嘉駿',
      });
    const sh = current();
    expect(sh.details[0].qty).toBe(480);
    expect(sh.details[0].picked_qty).toBe(480);
    expect(sh.details[0].per_box_qty).toBe(48);
    expect(isPickingMismatch(sh)).toBe(false);
    expect(sh.history[sh.history.length - 1].category).toBe('編輯');
  });

  it('執行過出貨動作之後明細鎖住，改不動', () => {
    seed(
      shipmentOf({
        details: [detail(500, 480, 48)],
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
  const spec = '新竹物流 60 公分箱';
  const nextBoxes = (extra = []) => [
    { box_no: '001', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
    { box_no: '002', box_spec: spec, photos: ['裝箱照.jpg'], note: '' },
    ...extra,
  ];
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480, 48)] })));

  it('成立時更新明細與裝箱資料、每個被改的欄位一筆修正紀錄、歷程多一筆；新增箱產生新物流單', () => {
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 50 }],
      boxes: nextBoxes([boxInput(spec)]),
      reason: '清點後找到 20 張',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.details[0].picked_qty).toBe(500);
    expect(sh.details[0].per_box_qty).toBe(50);
    expect(sh.packing_boxes.map((b) => b.box_no)).toEqual(['001', '002', '003']);
    expect(sh.logistics_orders.map((l) => l.logistics_order_no)).toEqual([
      'SH-2026-9001-001',
      'SH-2026-9001-002',
      'SH-2026-9001-003',
    ]);
    expect(sh.packing_boxes[2].logistics_order_no).toBe('SH-2026-9001-003');
    expect(sh.status).toBe('已裝箱');
    expect(sh.packing_corrections).toHaveLength(3);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('裝箱回報修正');
    expect(last.remark).toContain('清點後找到 20 張');
    expect(last.changes).toHaveLength(3);
  });

  it('刪除一箱時，一箱一筆的物流單隨之刪除；物流單序號不重用', () => {
    useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }],
      boxes: [nextBoxes()[0]],
      reason: '多裝了一箱',
      operator: '范姜宏',
    });
    expect(current().logistics_orders.map((l) => l.logistics_order_no)).toEqual(['SH-2026-9001-001']);
    useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }],
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
    const spec2 = boxSpecOptionsOf('順豐')[0];
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
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 50 }],
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
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }],
      boxes: nextBoxes(),
      reason: '',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().details[0].picked_qty).toBe(480);
    expect(current().packing_corrections).toEqual([]);
  });

  it('執行過出貨動作（含部分失敗）後鎖住，不可修正', () => {
    useQcShippingStore.setState({
      shipments: [
        {
          ...current(),
          logistics_orders: [
            logistics('SH-2026-9001-001', '已裝箱', { dispatch_attempts: 1, dispatch_error: '拒收' }),
            logistics('SH-2026-9001-002', '已裝箱'),
          ],
        },
      ],
    });
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }],
      boxes: nextBoxes(),
      reason: '想改',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().details[0].picked_qty).toBe(480);
  });
});

// ── MOCK-DATA-CHAIN 出貨段落的資料形狀（改 mock 的唯一正本是 MOCK-DATA-CHAIN.md） ──

describe('出貨單 mock 形狀：揀貨數量與每箱幾個在明細，箱規與物流單號在子表，單頭不存', () => {
  const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);

  it('三張單的單頭都沒有實際裝箱數量、箱規、裝箱照片、物流單號與離廠送達欄位，都有裝箱資料、物流單、修正紀錄與歷程陣列', () => {
    MOCK_SHIPMENTS.forEach((sh) => {
      ['actual_qty', 'per_box_qty', 'box_spec', 'packing_photos', 'tracking_no', 'boxes'].forEach((k) =>
        expect(k in sh, k).toBe(false),
      );
      ['shipped_at', 'shipped_by', 'delivered_at', 'delivered_by', 'delivery_proof'].forEach((k) =>
        expect(k in sh, k).toBe(false),
      );
      expect(Array.isArray(sh.packing_boxes)).toBe(true);
      expect(Array.isArray(sh.logistics_orders)).toBe(true);
      expect(Array.isArray(sh.packing_corrections)).toBe(true);
      expect(Array.isArray(sh.history)).toBe(true);
    });
  });

  it('SH-2026-0601 與 SH-2026-0602 明細照原值填：揀貨數量與出貨數量相符，送達數量等於揀貨數量', () => {
    expect(byNo('SH-2026-0601').details[0]).toMatchObject({ qty: 3000, picked_qty: 3000, per_box_qty: 600, delivered_qty: 3000 });
    expect(byNo('SH-2026-0602').details[0]).toMatchObject({ qty: 2000, picked_qty: 2000, per_box_qty: 1000, delivered_qty: 2000 });
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

  it('已出貨的兩張各有五筆出貨單歷程：建立出貨單、開始揀貨、裝箱回報、出貨動作、送達', () => {
    ['SH-2026-0601', 'SH-2026-0602'].forEach((no) => {
      const categories = byNo(no).history.map((h) => h.category);
      expect(categories.slice(0, 4)).toEqual(['建立出貨單', '開始揀貨', '裝箱回報', '拋單或出貨確認']);
      expect(categories).toHaveLength(5);
    });
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
