import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildPackingCorrection,
  generateTrackingNo,
  hasPackingReport,
  isPickingMismatch,
  mismatchedDetails,
  validatePackingLines,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipping-rules.js';
import { nextStatusOptions } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { MOCK_SHIPMENTS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { useQcShippingStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

// 情境 12.5（揀貨數量與明細不符時照實填）、12.19（不符擋下拋單、業務改明細或揀貨人員修正後放行）、
// 12.20（裝箱回報修正：每個被改的欄位一筆、原因必填、只限待出貨）、12.21（拋單生成物流單號）的驗算。

const NO = 'PI-2026-0820';
const NAME = '《山城記事》精裝書（128 頁）';

const detail = (qty, picked = null, perBox = null) => ({
  print_item_no: NO,
  name: NAME,
  qty,
  picked_qty: picked,
  per_box_qty: perBox,
});

const shipmentOf = (overrides = {}) => ({
  id: 'sh-test-1',
  shipment_no: 'SH-2026-9001',
  order_no: 'ORD-TEST-PICK',
  status: '待出貨',
  method: '新竹物流',
  details: [detail(500, 500, 50)],
  planned_details: [],
  boxes: 10,
  box_spec: 'A 箱（60×40×40）',
  packing_photos: ['裝箱照.jpg'],
  weight_kg: null,
  tracking_no: null,
  packing_corrections: [],
  history: [],
  ...overrides,
});

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

  it('不符時出貨人員在待出貨沒有任何下一步，三種出貨方式都一樣', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '超商', '其他'].forEach((method) => {
      const sh = shipmentOf({ method, details: [detail(500, 480, 48)] });
      expect(nextStatusOptions({ role: 'shipper', shipment: sh })).toEqual([]);
    });
  });

  it('兩數相符後放行：第三方列拋單（運送中）、專車列出貨確認、自取列交付確認', () => {
    const third = nextStatusOptions({ role: 'shipper', shipment: shipmentOf() });
    expect(third.map((o) => o.status)).toEqual(['運送中']);
    expect(third[0].label).toContain('拋單');
    expect(third[0].required).toEqual([]);
    expect(
      nextStatusOptions({ role: 'shipper', shipment: shipmentOf({ method: '自取' }) })[0].status,
    ).toBe('已送達');
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

describe('12.21 拋單生成物流單號', () => {
  it('物流單號為 HCT 開頭加數字，同一個序號永遠生成同一組', () => {
    expect(generateTrackingNo(1)).toMatch(/^HCT-\d{9}$/);
    expect(generateTrackingNo(1)).toBe(generateTrackingNo(1));
    expect(generateTrackingNo(1)).not.toBe(generateTrackingNo(2));
  });
});

describe('12.20 裝箱回報修正的差異判定', () => {
  const base = shipmentOf({ details: [detail(500, 480, 48)] });
  const next = (patch = {}) => ({
    lines: [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }],
    boxes: 10,
    box_spec: 'A 箱（60×40×40）',
    reason: '清點後找到 20 張',
    ...patch,
  });
  const build = (n) => buildPackingCorrection({ shipment: base, next: n, actor: '范姜宏', at: '2026-10-13 10:00' });

  it('修正原因必填，空白不行', () => {
    const result = build(next({ reason: '   ', lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }] }));
    expect(result.ok).toBe(false);
    expect(result.error).toContain('修正原因');
  });

  it('沒有任何欄位被改時不成立', () => {
    expect(build(next()).ok).toBe(false);
  });

  it('一次改了揀貨數量與箱數，每個被改的欄位各一筆，其餘欄位不記', () => {
    const result = build(
      next({ lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }], boxes: 11 }),
    );
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(2);
    const [qtyEntry, boxEntry] = result.entries;
    expect(qtyEntry.field).toContain('揀貨數量');
    expect(qtyEntry.before).toBe(480);
    expect(qtyEntry.after).toBe(500);
    expect(boxEntry.field).toBe('箱數');
    expect(boxEntry.before).toBe(10);
    expect(boxEntry.after).toBe(11);
    result.entries.forEach((e) => {
      expect(e.corrected_by).toBe('范姜宏');
      expect(e.corrected_at).toBe('2026-10-13 10:00');
      expect(e.reason).toBe('清點後找到 20 張');
    });
    expect(result.nextDetails[0].picked_qty).toBe(500);
    expect(result.nextDetails[0].qty).toBe(500);
    expect(result.nextBoxes).toBe(11);
  });

  it('換裝箱照片時修正紀錄留修正前的照片，至少留一張', () => {
    const result = build(next({ photos: ['新裝箱照.jpg'] }));
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].field).toBe('裝箱照片');
    expect(result.entries[0].before_photos).toEqual(['裝箱照.jpg']);
    expect(build(next({ photos: [] })).ok).toBe(false);
  });

  it('只限待出貨且已有裝箱回報：打包中、運送中以後都不成立', () => {
    ['打包中', '運送中', '已送達', '異常', '已作廢'].forEach((status) => {
      const result = buildPackingCorrection({
        shipment: { ...base, status },
        next: next({ boxes: 11 }),
        actor: '范姜宏',
        at: '2026-10-13 10:00',
      });
      expect(result.ok).toBe(false);
    });
  });

  it('不符的判定隨修正重算：改為與出貨數量相同即解除', () => {
    const result = build(next({ lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }] }));
    expect(isPickingMismatch({ ...base, details: result.nextDetails })).toBe(false);
  });
});

// ── store：裝箱回報、修正、拋單、改明細 ──

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

describe('裝箱回報寫入明細並留歷程', () => {
  beforeEach(() => seed(shipmentOf({ status: '打包中', details: [detail(500)], packing_photos: [], boxes: null, box_spec: null })));

  it('逐條揀貨數量與每箱幾個寫進明細，單頭不再有實際裝箱數量', () => {
    useQcShippingStore.getState().reportPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 480, per_box_qty: 48 }],
      boxes: 10,
      box_spec: 'A 箱（60×40×40）',
      photos: [{ name: '裝箱照.jpg', url: null }],
      operator: '范姜宏',
    });
    const sh = current();
    expect(sh.status).toBe('待出貨');
    expect(sh.details[0].picked_qty).toBe(480);
    expect(sh.details[0].per_box_qty).toBe(48);
    expect(sh.actual_qty).toBeUndefined();
    expect(sh.boxes).toBe(10);
    expect(isPickingMismatch(sh)).toBe(true);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('裝箱回報');
    expect(last.actor).toBe('范姜宏');
    expect(last.changes.some((c) => c.field === '出貨單狀態' && c.after === '待出貨')).toBe(true);
    expect(last.attachments.map((a) => a.name)).toEqual(['裝箱照.jpg']);
  });
});

describe('12.19 業務改明細數量後重新判定不符，揀貨數量不被覆蓋', () => {
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480, 48)] })));

  it('明細數量改為 480 後兩數相符，揀貨數量與每箱幾個照舊', () => {
    expect(isPickingMismatch(current())).toBe(true);
    useQcShippingStore.getState().updateShipmentDetails(
      'sh-test-1',
      [{ print_item_no: NO, name: NAME, qty: 480 }],
      { operator: '洪嘉駿' },
    );
    const sh = current();
    expect(sh.details[0].qty).toBe(480);
    expect(sh.details[0].picked_qty).toBe(480);
    expect(sh.details[0].per_box_qty).toBe(48);
    expect(isPickingMismatch(sh)).toBe(false);
    expect(sh.history[sh.history.length - 1].category).toBe('編輯');
  });
});

describe('12.20 裝箱回報修正寫入紀錄與歷程', () => {
  beforeEach(() => seed(shipmentOf({ details: [detail(500, 480, 48)] })));

  it('成立時更新明細與箱數、每個被改的欄位一筆修正紀錄、歷程多一筆', () => {
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 50 }],
      boxes: 11,
      box_spec: 'A 箱（60×40×40）',
      reason: '清點後找到 20 張',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.details[0].picked_qty).toBe(500);
    expect(sh.details[0].per_box_qty).toBe(50);
    expect(sh.boxes).toBe(11);
    expect(sh.status).toBe('待出貨');
    expect(sh.packing_corrections).toHaveLength(3);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('裝箱回報修正');
    expect(last.remark).toContain('清點後找到 20 張');
    expect(last.changes).toHaveLength(3);
  });

  it('沒填原因整筆擋下，單上什麼都不變', () => {
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }],
      boxes: 10,
      box_spec: 'A 箱（60×40×40）',
      reason: '',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
    expect(current().details[0].picked_qty).toBe(480);
    expect(current().packing_corrections).toEqual([]);
  });

  it('運送中以後不可修正', () => {
    useQcShippingStore.setState({ shipments: [{ ...current(), status: '運送中' }] });
    const result = useQcShippingStore.getState().correctPacking('sh-test-1', {
      lines: [{ print_item_no: NO, picked_qty: 500, per_box_qty: 48 }],
      boxes: 10,
      box_spec: 'A 箱（60×40×40）',
      reason: '想改',
      operator: '范姜宏',
    });
    expect(result.ok).toBe(false);
  });
});

describe('12.21 拋單：系統生成物流單號、單轉運送中、寫歷程', () => {
  beforeEach(() => seed(shipmentOf()));

  it('第三方拋單寫入 HCT 開頭的物流單號與實際出貨時間，歷程多一筆拋單', () => {
    const result = useQcShippingStore
      .getState()
      .confirmShipping('sh-test-1', { operator: '曾志偉', weight_kg: 8.2 });
    expect(result.ok).toBe(true);
    const sh = current();
    expect(sh.status).toBe('運送中');
    expect(sh.tracking_no).toMatch(/^HCT-\d+$/);
    expect(sh.shipped_by).toBe('曾志偉');
    expect(sh.weight_kg).toBe(8.2);
    const last = sh.history[sh.history.length - 1];
    expect(last.category).toBe('拋單或出貨確認');
    expect(last.event).toContain('拋單');
    expect(last.changes.some((c) => c.field === '物流單號' && c.after === sh.tracking_no)).toBe(true);
  });

  it('專車出貨確認不生成物流單號', () => {
    seed(shipmentOf({ method: '專車配送' }));
    useQcShippingStore.getState().confirmShipping('sh-test-1', { operator: '曾志偉' });
    expect(current().tracking_no).toBeNull();
    expect(current().status).toBe('運送中');
  });

  it('拋單後可補填重量，限運送中與已送達，改動寫一筆編輯歷程', () => {
    useQcShippingStore.getState().confirmShipping('sh-test-1', { operator: '曾志偉' });
    const result = useQcShippingStore
      .getState()
      .recordWeight('sh-test-1', { weight_kg: 9.5, operator: '曾志偉' });
    expect(result.ok).toBe(true);
    expect(current().weight_kg).toBe(9.5);
    const last = current().history[current().history.length - 1];
    expect(last.category).toBe('編輯');
    expect(last.changes[0]).toMatchObject({ field: '重量（公斤）', before: null, after: 9.5 });
    // 已送達仍可補，異常、已作廢、待出貨不可
    useQcShippingStore.setState({ shipments: [{ ...current(), status: '已送達' }] });
    expect(useQcShippingStore.getState().recordWeight('sh-test-1', { weight_kg: 9.8, operator: '曾志偉' }).ok).toBe(true);
    ['異常', '已作廢'].forEach((status) => {
      useQcShippingStore.setState({ shipments: [{ ...current(), status }] });
      expect(useQcShippingStore.getState().recordWeight('sh-test-1', { weight_kg: 1, operator: '曾志偉' }).ok).toBe(false);
    });
    // 還沒出貨的單不能補填
    seed(shipmentOf());
    expect(
      useQcShippingStore.getState().recordWeight('sh-test-1', { weight_kg: 1, operator: '曾志偉' }).ok,
    ).toBe(false);
  });

  it('揀貨不符時拋單被擋下，單與歷程都不變', () => {
    seed(shipmentOf({ details: [detail(500, 480, 48)] }));
    const result = useQcShippingStore
      .getState()
      .confirmShipping('sh-test-1', { operator: '曾志偉' });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('揀貨數量與出貨明細不符');
    expect(current().status).toBe('待出貨');
    expect(current().tracking_no).toBeNull();
  });
});

// ── MOCK-DATA-CHAIN 出貨段落的資料形狀（改 mock 的唯一正本是 MOCK-DATA-CHAIN.md） ──

describe('出貨單 mock 形狀：揀貨數量與每箱幾個在明細，單頭不存總數', () => {
  const byNo = (no) => MOCK_SHIPMENTS.find((sh) => sh.shipment_no === no);

  it('三張單的單頭都沒有實際裝箱數量與每箱幾個，都有修正紀錄與歷程陣列', () => {
    MOCK_SHIPMENTS.forEach((sh) => {
      expect('actual_qty' in sh).toBe(false);
      expect('per_box_qty' in sh).toBe(false);
      expect(Array.isArray(sh.packing_corrections)).toBe(true);
      expect(Array.isArray(sh.history)).toBe(true);
    });
  });

  it('SH-2026-0601 與 SH-2026-0602 明細照原值填：揀貨數量與出貨數量相符、每箱 500', () => {
    expect(byNo('SH-2026-0601').details[0]).toMatchObject({ qty: 3000, picked_qty: 3000, per_box_qty: 500 });
    expect(byNo('SH-2026-0602').details[0]).toMatchObject({ qty: 2000, picked_qty: 2000, per_box_qty: 500 });
    expect(isPickingMismatch(byNo('SH-2026-0601'))).toBe(false);
    expect(isPickingMismatch(byNo('SH-2026-0602'))).toBe(false);
  });

  it('已出貨的兩張各有五筆歷程：建立出貨單、開始揀貨、裝箱回報、出貨確認、送達確認', () => {
    ['SH-2026-0601', 'SH-2026-0602'].forEach((no) => {
      expect(byNo(no).history.map((h) => h.category)).toEqual([
        '建立出貨單',
        '開始揀貨',
        '裝箱回報',
        '拋單或出貨確認',
        '送達確認',
      ]);
    });
  });

  it('歷程時間與人員取自單上既有欄位', () => {
    const sh = byNo('SH-2026-0601');
    const ship = sh.history.find((h) => h.category === '拋單或出貨確認');
    expect(ship.at).toBe(sh.shipped_at);
    expect(ship.actor).toBe(sh.shipped_by);
    const delivered = sh.history.find((h) => h.category === '送達確認');
    expect(delivered.at).toBe(sh.delivered_at);
    expect(delivered.actor).toBe(sh.delivered_by);
    expect(sh.history[0].actor).toBe(sh.created_by);
    expect(delivered.attachments.map((a) => a.name)).toEqual([sh.delivery_proof]);
  });

  it('草稿 SH-2026-0820 的明細與歷程皆空，無裝箱照片', () => {
    const draft = byNo('SH-2026-0820');
    expect(draft.details).toEqual([]);
    expect(draft.history).toEqual([]);
    expect(draft.packing_photos).toEqual([]);
  });
});
