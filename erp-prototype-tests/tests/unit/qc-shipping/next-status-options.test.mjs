import { describe, expect, it } from 'vitest';
import {
  BATCH_DISPATCH_NO_SHIPPABLE_HINT,
  batchDispatchOf,
  dispatchableLogisticsOf,
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
  nextStatusOptions,
  SHIPMENT_LEVEL_KEY as S,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { shipmentStatusOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/logistics-rules.js';
import { canVoidShipment } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipment-access.js';
import { boxedShipment, departed, dispatched, logistics, packedShipment, undispatched } from './_fixtures.mjs';

// 情境 12.15「列上動作鈕只列合法的下一步，依角色、出貨方式與物流單的拋單狀態、貨態過濾」與 12.42「批次拋單依出貨單狀態與
// 出貨方式渲染」的驗算（畫面呈現另在 e2e 12.15、12.42 驗）。
// 期望值取自出貨對齊後端第一版決定表（Miles 2026-10-27 拍板）與 wiki 出貨單狀態 § 轉換條件與觸發事件。
// 出貨單層：揀貨人員在已裝箱有確認可出貨（做完為已確認）；業務端作廢出貨單只限未處理。
// 物流單層：出貨動作在貨態待出貨（第三方另限未拋單或拋單失敗，拋單失敗可再次拋單）；第三方物流沒有標記例外；
// 沒有重新同步、補附送達憑證；任何未作廢物流單可下載物流單檔案。
// 拋單狀態只適用第三方物流：自取、專車配送、其他的物流單拋單狀態為 null。

const prePacking = (status, method = '新竹物流') => ({ status, method, details: [], logistics_orders: [] });
const packed = (method, los) => packedShipment({ method, logisticsOrders: los });
const keysOf = (role, shipment, extra = {}) =>
  nextStatusOptions({ role, shipment, ...extra }).map((o) => o.key);
const failed = (id, extra = {}) =>
  logistics(id, '待出貨', { dispatch_status: '拋單失敗', dispatch_error: '物流商回應：這筆托運暫時無法受理', ...extra });

describe('12.15 揀貨人員的出貨單層動作', () => {
  it('未處理只推得到打包中，不必填任何欄位', () => {
    const options = nextStatusOptions({ role: 'picker', shipment: prePacking('未處理') });
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ key: S.START_PICKING, status: '打包中', required: [] });
  });

  it('打包中只推得到已裝箱：逐條填揀貨數量，再填裝箱明細（每箱箱規與照片）', () => {
    const options = nextStatusOptions({ role: 'picker', shipment: prePacking('打包中') });
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ key: S.REPORT_PACKING, status: '已裝箱' });
    expect(options[0].required).toEqual(['picked_qty', 'packing_boxes']);
  });

  it('已裝箱有確認可出貨（推到已確認，動作名維持確認可出貨）', () => {
    const options = nextStatusOptions({ role: 'picker', shipment: boxedShipment({ boxCount: 2 }) });
    expect(options.map((o) => o.key)).toEqual([S.CONFIRM_SHIPPABLE]);
    expect(options[0]).toMatchObject({ status: '已確認', label: '已確認（確認可出貨）' });
    expect(options[0].disabledReason ?? null).toBeNull();
  });

  it('出貨單層動作鍵只有開始揀貨、裝箱回報、確認可出貨、作廢四種', () => {
    expect(S.WITHDRAW_SHIPPABLE).toBeUndefined();
    expect(Object.keys(S)).toEqual(['START_PICKING', 'REPORT_PACKING', 'CONFIRM_SHIPPABLE', 'VOID']);
  });

  it('確認可出貨之後（已確認、待出貨、運送中）、草稿與已作廢都不是揀貨人員的球', () => {
    expect(keysOf('picker', packed('新竹物流', [undispatched('L-1'), undispatched('L-2')]))).toEqual([]);
    expect(keysOf('picker', packed('新竹物流', [dispatched('L-1'), undispatched('L-2')]))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [dispatched('L-1')]))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [departed('L-1', '運送中')]))).toEqual([]);
    expect(keysOf('picker', prePacking('草稿'))).toEqual([]);
    expect(keysOf('picker', prePacking('已作廢'))).toEqual([]);
  });
});

describe('12.15 出貨人員在出貨單層沒有狀態推進的動作（批次拋單另由 batchDispatchOf 判定）', () => {
  it('不論出貨方式、物流單狀態，出貨單層都沒有狀態推進的動作，也沒有確認可出貨', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      expect(keysOf('shipper', packed(method, [undispatched('L-1'), dispatched('L-2')])), method).toEqual([]);
      expect(keysOf('shipper', packed(method, [undispatched('L-1')])), method).toEqual([]);
      expect(keysOf('shipper', boxedShipment({ method })), method).toEqual([]);
    });
    expect(keysOf('shipper', prePacking('未處理'))).toEqual([]);
    expect(keysOf('shipper', prePacking('打包中'))).toEqual([]);
  });
});

describe('12.23 業務的作廢出貨單只限未處理（作廢依訂單編輯權，由呼叫端判好 canVoid 傳入）', () => {
  it('未處理推得到已作廢，理由必填', () => {
    const options = nextStatusOptions({ role: 'sales', shipment: prePacking('未處理'), canVoid: true });
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ key: S.VOID, status: '已作廢', required: ['reason'] });
  });

  it('打包中、已裝箱、已確認、待出貨都沒有作廢出貨單', () => {
    [
      prePacking('打包中'),
      boxedShipment({}),
      packed('順豐', [undispatched('L-1')]),
      packed('順豐', [dispatched('L-1')]),
      packed('7-11 交貨便', [dispatched('L-1'), undispatched('L-2')]),
    ].forEach((shipment) => {
      expect(keysOf('sales', shipment, { canVoid: true }), shipmentStatusOf(shipment)).toEqual([]);
    });
  });

  it('部分離廠與全數離廠沒有作廢出貨單：只能逐筆作廢物流單', () => {
    expect(keysOf('sales', packed('7-11 交貨便', [departed('L-1', '運送中'), undispatched('L-2')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('專車配送', [departed('L-1', '已出貨')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('順豐', [departed('L-1', '運送中')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('順豐', [departed('L-1', '例外事故')]), { canVoid: true })).toEqual([]);
  });

  it('沒有訂單編輯權（canVoid 為否）時，角色是業務也沒有作廢', () => {
    ['未處理', '打包中'].forEach((status) => expect(keysOf('sales', prePacking(status))).toEqual([]));
  });

  it('草稿的出口是刪除、不走作廢；已作廢的單沒有下一步', () => {
    expect(keysOf('sales', prePacking('草稿'), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', prePacking('已作廢'), { canVoid: true })).toEqual([]);
  });

  it('六個全公司協助角色在未處理有作廢；揀貨人員、出貨人員沒有', () => {
    const anyOrder = { sales_person: '洪嘉駿', shared_members: [] };
    const helpers = [
      ['sales_manager', '林雅婷'],
      ['order_manager', '黃聖雯'],
      ['print_manager', '吳國豪'],
      ['print_officer', '周建宏'],
      ['reviewer_supervisor', '魏彣軒'],
      ['supervisor', '王大明'],
    ];
    const shipment = prePacking('未處理');
    helpers.forEach(([role, name]) => {
      const canVoid = canVoidShipment(anyOrder, role, name);
      expect(canVoid, role).toBe(true);
      expect(keysOf(role, shipment, { canVoid }), role).toContain(S.VOID);
    });
    [['picker', '范姜宏'], ['shipper', '曾志偉']].forEach(([role, name]) => {
      const canVoid = canVoidShipment(anyOrder, role, name);
      expect(canVoid).toBe(false);
      expect(keysOf(role, shipment, { canVoid })).not.toContain(S.VOID);
    });
  });

  it('沒有出貨單時回空陣列', () => {
    expect(nextStatusOptions({ role: 'sales', shipment: null })).toEqual([]);
    expect(nextStatusOptions({})).toEqual([]);
  });
});

// ── 物流單層動作 ──

const logisticsKeys = (role, method, lo, extra = {}) => {
  const shipment = packed(method, [lo]);
  return logisticsActionsOf({ role, shipment, logistics: shipment.logistics_orders[0], ...extra });
};

describe('12.15 出貨人員對物流單：出貨動作、標記例外、送達確認與交付確認、下載物流單檔案依拋單狀態、貨態與出貨方式分流', () => {
  it('沒有重新同步、補附送達憑證與下載全部物流單的動作鍵', () => {
    expect(L.RESYNC).toBeUndefined();
    expect(L.ATTACH_PROOF).toBeUndefined();
    expect(L.DOWNLOAD_ALL).toBeUndefined();
  });

  it('第三方物流：未拋單只有拋單與下載；拋單成功待出貨、運送中、例外有送達確認（備援）與下載；沒有標記例外；已送達只剩下載', () => {
    const sent = (cargo) => departed('L-1', cargo, { tracking_no: 'SF1', label_file: 'a.pdf' });
    expect(logisticsKeys('shipper', '順豐', undispatched('L-1'))).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '順豐', dispatched('L-1'))).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '順豐', sent('運送中'))).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((status) => {
      expect(logisticsKeys('shipper', '新竹物流', sent(status)), status).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    });
    expect(logisticsKeys('shipper', '7-11 交貨便', sent('已送達'))).toEqual([L.DOWNLOAD_LABEL]);
    ['順豐', '新竹物流', '7-11 交貨便', '全家'].forEach((method) => {
      [dispatched('L-1'), sent('運送中')].forEach((lo) => {
        expect(logisticsKeys('shipper', method, lo), `${method} ${lo.cargo_status}`).not.toContain(L.MARK_EXCEPTION);
      });
    });
  });

  it('第三方物流拋單失敗的物流單仍有拋單鈕（再次拋單），沒有送達確認', () => {
    ['順豐', '新竹物流', '7-11 交貨便', '全家'].forEach((method) => {
      expect(logisticsKeys('shipper', method, failed('L-1')), method).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
    });
  });

  it('第三方物流拋單成功之後沒有拋單鈕；拋單中與已取消也沒有', () => {
    ['拋單成功', '拋單中', '已取消'].forEach((dispatchStatus) => {
      const lo = logistics('L-1', '待出貨', { dispatch_status: dispatchStatus });
      expect(logisticsKeys('shipper', '新竹物流', lo), dispatchStatus).not.toContain(L.DISPATCH);
    });
  });

  it('專車與其他：待出貨有出貨確認；已出貨可標記例外、送達確認；例外只剩送達確認；已送達只剩下載', () => {
    ['專車配送', '其他'].forEach((method) => {
      expect(logisticsKeys('shipper', method, undispatched('L-1')), method).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
      expect(logisticsKeys('shipper', method, departed('L-1', '已出貨')), method).toEqual([
        L.MARK_EXCEPTION,
        L.DELIVER,
        L.DOWNLOAD_LABEL,
      ]);
      expect(logisticsKeys('shipper', method, departed('L-1', '例外事故')), method).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
      expect(logisticsKeys('shipper', method, departed('L-1', '已送達')), method).toEqual([L.DOWNLOAD_LABEL]);
    });
  });

  it('自取：待出貨有標記可自取；可自取可標記例外、交付確認（不叫送達確認）；已自取只剩下載', () => {
    expect(logisticsKeys('shipper', '自取', undispatched('L-1'))).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '自取', departed('L-1', '可自取'))).toEqual([
      L.MARK_EXCEPTION,
      L.HANDOVER,
      L.DOWNLOAD_LABEL,
    ]);
    expect(logisticsKeys('shipper', '自取', departed('L-1', '例外事故'))).toEqual([L.HANDOVER, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '自取', departed('L-1', '已自取'))).toEqual([L.DOWNLOAD_LABEL]);
  });

  it('非第三方方式的物流單沒有拋單狀態：自取、專車配送、其他的物流單拋單狀態為 null，出貨動作不看拋單狀態', () => {
    ['自取', '專車配送', '其他'].forEach((method) => {
      const shipment = packed(method, [undispatched('L-1')]);
      expect(shipment.logistics_orders[0].dispatch_status, method).toBeNull();
      expect(dispatchableLogisticsOf(shipment), method).toEqual([]);
      expect(logisticsActionsOf({ role: 'shipper', shipment, logistics: shipment.logistics_orders[0] }), method).toContain(L.DISPATCH);
    });
  });

  it('已作廢的物流單沒有任何出貨人員動作（不提供下載）', () => {
    expect(logisticsKeys('shipper', '順豐', logistics('L-1', '已作廢', { label_file: 'a.pdf' }))).toEqual([]);
  });

  it('出貨動作只在貨態待出貨（第三方另限未拋單或拋單失敗）、訂單未取消；依出貨方式只有一顆', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      expect(logisticsKeys('shipper', method, undispatched('L-1')), method).toContain(L.DISPATCH);
    });
    expect(logisticsKeys('shipper', '順豐', undispatched('L-1'), { orderCancelled: true })).not.toContain(L.DISPATCH);
    expect(logisticsKeys('shipper', '順豐', failed('L-1'), { orderCancelled: true })).not.toContain(L.DISPATCH);
    const mixed = packed('7-11 交貨便', [dispatched('L-0'), undispatched('L-1')]);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: mixed.logistics_orders[0] })).not.toContain(L.DISPATCH);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: mixed.logistics_orders[1] })).toContain(L.DISPATCH);
  });

  it('其他角色在物流單上沒有出貨動作、標記例外、送達確認與下載', () => {
    ['sales', 'picker', 'planner', 'sales_manager'].forEach((role) => {
      const keys = logisticsKeys(role, '專車配送', departed('L-1', '已出貨'));
      [L.DISPATCH, L.MARK_EXCEPTION, L.DELIVER, L.DOWNLOAD_LABEL].forEach((k) => expect(keys, `${role} ${k}`).not.toContain(k));
    });
  });
});

describe('12.34 作廢物流單的開放狀態（業務端，canVoid 依訂單編輯權）', () => {
  const voidable = (shipment, index = 0) =>
    logisticsActionsOf({ role: 'sales', shipment, logistics: shipment.logistics_orders[index], canVoid: true }).includes(L.VOID);

  it('還在等出貨動作（未拋單或拋單失敗）的物流單只在同單有一筆不在這一格時可作廢：同單有拋單成功或已作廢時可，全部未拋單時不可', () => {
    expect(voidable(packed('新竹物流', [dispatched('L-1'), dispatched('L-2'), undispatched('L-3')]), 2)).toBe(true);
    expect(voidable(packed('全家', [undispatched('L-1'), undispatched('L-2')]), 1)).toBe(false);
    expect(voidable(packed('全家', [undispatched('L-1'), failed('L-2')]), 1)).toBe(false);
    expect(voidable(packed('全家', [logistics('L-1', '已作廢'), undispatched('L-2')]), 1)).toBe(true);
  });

  it('第三方物流在拋單成功待出貨、運送中與例外可直接作廢', () => {
    [dispatched('L-1'), ...['運送中', '未送達', '無追蹤中包裹', '例外事故'].map((c) => departed('L-1', c))].forEach((lo) => {
      expect(voidable(packed('新竹物流', [lo])), `${lo.dispatch_status} ${lo.cargo_status}`).toBe(true);
    });
  });

  it('專車與其他已出貨要先轉例外才能作廢；自取可自取不可、例外可；已送達與已自取不可', () => {
    expect(voidable(packed('專車配送', [departed('L-1', '已出貨')]))).toBe(false);
    expect(voidable(packed('專車配送', [departed('L-1', '例外事故')]))).toBe(true);
    expect(voidable(packed('自取', [departed('L-1', '可自取')]))).toBe(false);
    expect(voidable(packed('專車配送', [departed('L-1', '已送達')]))).toBe(false);
    expect(voidable(packed('自取', [departed('L-1', '已自取')]))).toBe(false);
  });

  it('沒有訂單編輯權時沒有作廢物流單；出貨人員也沒有', () => {
    const shipment = packed('順豐', [dispatched('L-1')]);
    expect(logisticsActionsOf({ role: 'sales', shipment, logistics: shipment.logistics_orders[0] })).not.toContain(L.VOID);
    expect(logisticsKeys('shipper', '順豐', dispatched('L-1'))).not.toContain(L.VOID);
  });
});

// ── 12.42 批次拋單的顯示與停用 ──

describe('12.42 批次拋單依出貨單狀態與出貨方式渲染、沒有可拋單的物流單時停用', () => {
  const of = (shipment, role = 'shipper') => batchDispatchOf({ role, shipment });

  it('出貨人員在已確認的新竹物流出貨單上看到批次拋單；已裝箱、全部拋單成功（待出貨）的新竹物流與已確認的自取出貨單不渲染', () => {
    expect(of(packed('新竹物流', [undispatched('L-1')]))).toEqual({ visible: true, disabled: false, reason: null });
    expect(of(boxedShipment({ method: '新竹物流' })).visible).toBe(false);
    expect(of(packed('新竹物流', [dispatched('L-1')])).visible).toBe(false);
    expect(of(packed('自取', [undispatched('L-1')])).visible).toBe(false);
  });

  it('揀貨人員與接單業務看不到批次拋單（沒有拋單權限）', () => {
    const sh = packed('新竹物流', [undispatched('L-1')]);
    ['picker', 'sales', 'consultant', 'print_manager', null].forEach((role) => {
      expect(of(sh, role).visible, String(role)).toBe(false);
    });
  });

  it('只有出貨動作為拋單的四種出貨方式有批次拋單', () => {
    ['順豐', '新竹物流', '7-11 交貨便', '全家'].forEach((method) => {
      expect(of(packed(method, [undispatched('L-1')])).visible, method).toBe(true);
    });
    ['自取', '專車配送', '其他'].forEach((method) => {
      expect(of(packed(method, [undispatched('L-1')])).visible, method).toBe(false);
    });
  });

  it('只在出貨單狀態為已確認或異常時渲染；草稿、未處理、打包中、已裝箱、待出貨、運送中、已送達、已作廢都不渲染', () => {
    ['草稿', '未處理', '打包中'].forEach((status) => {
      expect(of(prePacking(status, '新竹物流')).visible, status).toBe(false);
    });
    [
      ['待出貨', [dispatched('L-1')]],
      ['運送中', [departed('L-1', '運送中')]],
      ['已送達', [departed('L-1', '已送達')]],
    ].forEach(([status, los]) => {
      const sh = packed('新竹物流', los);
      expect(shipmentStatusOf(sh)).toBe(status);
      expect(of(sh).visible, status).toBe(false);
    });
    expect(of({ ...packed('新竹物流', [logistics('L-1', '已作廢')]), status: '已作廢' }).visible).toBe(false);
    // 部分拋單成功：出貨單停在已確認，顯示、可按
    const partial = packed('新竹物流', [dispatched('L-1'), undispatched('L-2')]);
    expect(shipmentStatusOf(partial)).toBe('已確認');
    expect(of(partial)).toEqual({ visible: true, disabled: false, reason: null });
    // 異常且還有未拋單的物流單：顯示、可按
    expect(of(packed('新竹物流', [departed('L-1', '例外事故'), undispatched('L-2')]))).toEqual({
      visible: true,
      disabled: false,
      reason: null,
    });
  });

  it('拋單失敗的物流單算可拋單：已確認且全部拋單失敗、異常且只剩拋單失敗時都可按', () => {
    expect(of(packed('全家', [failed('L-1'), failed('L-2')]))).toEqual({ visible: true, disabled: false, reason: null });
    expect(of(packed('全家', [departed('L-1', '例外事故'), failed('L-2')]))).toEqual({ visible: true, disabled: false, reason: null });
  });

  it('出貨單為異常且底下沒有可拋單（未拋單或拋單失敗）的物流單時停用並顯示理由「底下沒有可拋單的物流單」', () => {
    expect(BATCH_DISPATCH_NO_SHIPPABLE_HINT).toBe('底下沒有可拋單的物流單');
    const btn = of(packed('7-11 交貨便', [departed('L-1', '例外事故'), dispatched('L-2')]));
    expect(btn).toEqual({ visible: true, disabled: true, reason: BATCH_DISPATCH_NO_SHIPPABLE_HINT });
  });

  it('可拋單的物流單只取未作廢、貨態待出貨、拋單狀態為未拋單或拋單失敗者', () => {
    const sh = packed('新竹物流', [
      undispatched('L-1'),
      failed('L-2'),
      dispatched('L-3'),
      departed('L-4', '運送中'),
      logistics('L-5', '已作廢'),
    ]);
    expect(dispatchableLogisticsOf(sh).map((l) => l.id)).toEqual(['L-1', 'L-2']);
  });
});
