import { describe, expect, it } from 'vitest';
import {
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
  nextStatusOptions,
  SHIPMENT_LEVEL_KEY as S,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { canVoidShipment } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipment-access.js';
import { boxedShipment, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.15「列上動作鈕只列合法的下一步，依角色、出貨方式與物流單狀態過濾」與 12.42「批次拋單依出貨單狀態與
// 出貨方式渲染」的驗算（畫面呈現另在 e2e 12.15、12.42 驗）。
// 期望值取自 shipment spec（本 change delta）§ 確認可出貨與撤回確認可出貨、§ 出貨與送達確認、§ 物流單例外、
// § 作廢物流單與未送達數量、§ 從出貨單批次拋單。
// 出貨單層：揀貨人員在已裝箱有確認可出貨、在可出貨（全部物流單都在可出貨）有撤回確認可出貨；業務端作廢只限未離廠。
// 物流單層：出貨動作只在可出貨；第三方物流沒有標記例外；沒有重新同步、補附送達憑證；任何未作廢物流單可下載物流單檔案。

const prePacking = (status, method = '新竹物流') => ({ status, method, details: [], logistics_orders: [] });
const packed = (method, los) => packedShipment({ method, logisticsOrders: los });
const keysOf = (role, shipment, extra = {}) =>
  nextStatusOptions({ role, shipment, ...extra }).map((o) => o.key);

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

  it('已裝箱有確認可出貨（推到可出貨）', () => {
    const options = nextStatusOptions({ role: 'picker', shipment: boxedShipment({ boxCount: 2 }) });
    expect(options.map((o) => o.key)).toEqual([S.CONFIRM_SHIPPABLE]);
    expect(options[0].status).toBe('可出貨');
  });

  it('可出貨且全部物流單都在可出貨時有撤回確認可出貨（推回已裝箱）', () => {
    const options = nextStatusOptions({
      role: 'picker',
      shipment: packed('新竹物流', [logistics('SH-TEST-0001-001'), logistics('SH-TEST-0001-002')]),
    });
    expect(options.map((o) => o.key)).toEqual([S.WITHDRAW_SHIPPABLE]);
    expect(options[0].status).toBe('已裝箱');
  });

  it('有任一物流單不在可出貨（含已作廢）時沒有撤回；等待出貨之後、草稿與已作廢都不是揀貨人員的球', () => {
    expect(keysOf('picker', packed('新竹物流', [logistics('L-1', '等待出貨'), logistics('L-2')]))).toEqual([]);
    expect(keysOf('picker', packed('新竹物流', [logistics('L-1', '已作廢'), logistics('L-2')]))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [logistics('L-1', '等待出貨')]))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [logistics('L-1', '運送中')]))).toEqual([]);
    expect(keysOf('picker', prePacking('草稿'))).toEqual([]);
    expect(keysOf('picker', prePacking('已作廢'))).toEqual([]);
  });
});

describe('12.15 出貨人員在出貨單層沒有狀態推進的動作（批次拋單另由 batchDispatchOf 判定）', () => {
  it('不論出貨方式、物流單狀態，出貨單層都沒有狀態推進的動作，也沒有確認可出貨與撤回', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      expect(keysOf('shipper', packed(method, [logistics('L-1'), logistics('L-2', '等待出貨')])), method).toEqual([]);
      expect(keysOf('shipper', packed(method, [logistics('L-1')])), method).toEqual([]);
      expect(keysOf('shipper', boxedShipment({ method })), method).toEqual([]);
    });
    expect(keysOf('shipper', prePacking('未處理'))).toEqual([]);
    expect(keysOf('shipper', prePacking('打包中'))).toEqual([]);
  });
});

describe('12.23 業務的作廢出貨單只限未離廠（作廢依訂單編輯權，由呼叫端判好 canVoid 傳入）', () => {
  it('未處理、打包中、已裝箱、可出貨與物流單在等待出貨的出貨單都推得到已作廢，理由必填', () => {
    const shipments = [
      prePacking('未處理'),
      prePacking('打包中'),
      boxedShipment({}),
      packed('順豐', [logistics('L-1')]),
      packed('順豐', [logistics('L-1', '等待出貨')]),
      packed('7-11 交貨便', [logistics('L-1', '等待出貨'), logistics('L-2')]),
    ];
    for (const shipment of shipments) {
      const options = nextStatusOptions({ role: 'sales', shipment, canVoid: true });
      expect(options).toHaveLength(1);
      expect(options[0]).toMatchObject({ key: S.VOID, status: '已作廢', required: ['reason'] });
    }
  });

  it('部分離廠與全數離廠沒有作廢出貨單：只能逐筆作廢物流單', () => {
    expect(keysOf('sales', packed('7-11 交貨便', [logistics('L-1', '運送中'), logistics('L-2')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('專車配送', [logistics('L-1', '已出貨')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('順豐', [logistics('L-1', '運送中')]), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', packed('順豐', [logistics('L-1', '例外事故')]), { canVoid: true })).toEqual([]);
  });

  it('沒有訂單編輯權（canVoid 為否）時，角色是業務也沒有作廢', () => {
    ['未處理', '打包中'].forEach((status) => expect(keysOf('sales', prePacking(status))).toEqual([]));
  });

  it('草稿的出口是刪除、不走作廢；已作廢的單沒有下一步', () => {
    expect(keysOf('sales', prePacking('草稿'), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', prePacking('已作廢'), { canVoid: true })).toEqual([]);
  });

  it('六個全公司協助角色在未離廠有作廢；揀貨人員、出貨人員沒有', () => {
    const anyOrder = { sales_person: '洪嘉駿', shared_members: [] };
    const helpers = [
      ['sales_manager', '林雅婷'],
      ['order_manager', '黃聖雯'],
      ['print_manager', '吳國豪'],
      ['print_officer', '周建宏'],
      ['reviewer_supervisor', '魏彣軒'],
      ['supervisor', '王大明'],
    ];
    const shippableNow = packed('新竹物流', [logistics('L-1'), logistics('L-2')]);
    [prePacking('未處理'), shippableNow].forEach((shipment) => {
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
  });

  it('沒有出貨單時回空陣列', () => {
    expect(nextStatusOptions({ role: 'sales', shipment: null })).toEqual([]);
    expect(nextStatusOptions({})).toEqual([]);
  });
});

// ── 物流單層動作 ──

const logisticsKeys = (role, method, lo, extra = {}) =>
  logisticsActionsOf({ role, shipment: packed(method, [lo]), logistics: lo, ...extra });

describe('12.15 出貨人員對物流單：出貨動作、標記例外、送達確認與交付確認、下載物流單檔案依狀態與出貨方式分流', () => {
  it('沒有重新同步、補附送達憑證與下載全部物流單的動作鍵', () => {
    expect(L.RESYNC).toBeUndefined();
    expect(L.ATTACH_PROOF).toBeUndefined();
    expect(L.DOWNLOAD_ALL).toBeUndefined();
  });

  it('第三方物流：可出貨只有拋單與下載；等待出貨、運送中、例外有送達確認（備援）與下載；沒有標記例外；已送達只剩下載', () => {
    const third = (status) => logistics('SH-TEST-0001-001', status, status === '可出貨' ? {} : { tracking_no: 'SF1', label_file: 'a.pdf' });
    expect(logisticsKeys('shipper', '順豐', third('可出貨'))).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '順豐', third('等待出貨'))).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '順豐', third('運送中'))).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((status) => {
      expect(logisticsKeys('shipper', '新竹物流', third(status)), status).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
    });
    expect(logisticsKeys('shipper', '7-11 交貨便', third('已送達'))).toEqual([L.DOWNLOAD_LABEL]);
    ['順豐', '新竹物流', '7-11 交貨便', '全家'].forEach((method) => {
      ['等待出貨', '運送中'].forEach((status) => {
        expect(logisticsKeys('shipper', method, third(status)), `${method} ${status}`).not.toContain(L.MARK_EXCEPTION);
      });
    });
  });

  it('專車與其他：可出貨有出貨確認；已出貨可標記例外、送達確認；例外只剩送達確認；已送達只剩下載', () => {
    ['專車配送', '其他'].forEach((method) => {
      expect(logisticsKeys('shipper', method, logistics('L-1')), method).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
      expect(logisticsKeys('shipper', method, logistics('L-1', '已出貨')), method).toEqual([
        L.MARK_EXCEPTION,
        L.DELIVER,
        L.DOWNLOAD_LABEL,
      ]);
      expect(logisticsKeys('shipper', method, logistics('L-1', '例外事故')), method).toEqual([L.DELIVER, L.DOWNLOAD_LABEL]);
      expect(logisticsKeys('shipper', method, logistics('L-1', '已送達')), method).toEqual([L.DOWNLOAD_LABEL]);
    });
  });

  it('自取：可出貨有標記可自取；可自取可標記例外、交付確認（不叫送達確認）；已自取只剩下載', () => {
    expect(logisticsKeys('shipper', '自取', logistics('L-1'))).toEqual([L.DISPATCH, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '自取', logistics('L-1', '可自取'))).toEqual([
      L.MARK_EXCEPTION,
      L.HANDOVER,
      L.DOWNLOAD_LABEL,
    ]);
    expect(logisticsKeys('shipper', '自取', logistics('L-1', '例外事故'))).toEqual([L.HANDOVER, L.DOWNLOAD_LABEL]);
    expect(logisticsKeys('shipper', '自取', logistics('L-1', '已自取'))).toEqual([L.DOWNLOAD_LABEL]);
  });

  it('已作廢的物流單沒有任何出貨人員動作（不提供下載）', () => {
    expect(logisticsKeys('shipper', '順豐', logistics('L-1', '已作廢', { label_file: 'a.pdf' }))).toEqual([]);
  });

  it('出貨動作只在可出貨、訂單未取消、出貨單沒有撤回執行中；依出貨方式只有一顆', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      expect(logisticsKeys('shipper', method, logistics('L-1')), method).toContain(L.DISPATCH);
    });
    const fresh = logistics('L-1');
    expect(logisticsKeys('shipper', '順豐', fresh, { orderCancelled: true })).not.toContain(L.DISPATCH);
    const withdrawing = { ...packed('順豐', [fresh]), withdrawing: true };
    expect(logisticsActionsOf({ role: 'shipper', shipment: withdrawing, logistics: fresh })).not.toContain(L.DISPATCH);
    const mixed = packed('7-11 交貨便', [logistics('L-0', '等待出貨'), fresh]);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: mixed.logistics_orders[0] })).not.toContain(L.DISPATCH);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: fresh })).toContain(L.DISPATCH);
  });

  it('其他角色在物流單上沒有出貨動作、標記例外、送達確認與下載', () => {
    ['sales', 'picker', 'planner', 'sales_manager'].forEach((role) => {
      const keys = logisticsKeys(role, '專車配送', logistics('L-1', '已出貨'));
      [L.DISPATCH, L.MARK_EXCEPTION, L.DELIVER, L.DOWNLOAD_LABEL].forEach((k) => expect(keys, `${role} ${k}`).not.toContain(k));
    });
  });
});

describe('12.34 作廢物流單的開放狀態（業務端，canVoid 依訂單編輯權）', () => {
  const voidable = (shipment, lo) =>
    logisticsActionsOf({ role: 'sales', shipment, logistics: lo, canVoid: true }).includes(L.VOID);

  it('可出貨的物流單只在撤回走不通時可作廢：同單有一筆在等待出貨或已作廢時可，全部可出貨時不可', () => {
    const third = logistics('L-3');
    expect(voidable(packed('新竹物流', [logistics('L-1', '等待出貨'), logistics('L-2', '等待出貨'), third]), third)).toBe(true);
    const fm = logistics('L-2');
    expect(voidable(packed('全家', [logistics('L-1'), fm]), fm)).toBe(false);
    expect(voidable(packed('全家', [logistics('L-1', '已作廢'), fm]), fm)).toBe(true);
  });

  it('第三方物流在等待出貨、運送中與例外可直接作廢', () => {
    ['等待出貨', '運送中', '未送達', '無追蹤中包裹', '例外事故'].forEach((status) => {
      const lo = logistics('L-1', status);
      expect(voidable(packed('新竹物流', [lo]), lo), status).toBe(true);
    });
  });

  it('專車與其他已出貨要先轉例外才能作廢；自取可自取不可、例外可；已送達與已自取不可', () => {
    const shipped = logistics('L-1', '已出貨');
    expect(voidable(packed('專車配送', [shipped]), shipped)).toBe(false);
    const exc = logistics('L-1', '例外事故');
    expect(voidable(packed('專車配送', [exc]), exc)).toBe(true);
    const ready = logistics('L-1', '可自取');
    expect(voidable(packed('自取', [ready]), ready)).toBe(false);
    const delivered = logistics('L-1', '已送達');
    expect(voidable(packed('專車配送', [delivered]), delivered)).toBe(false);
    const picked = logistics('L-1', '已自取');
    expect(voidable(packed('自取', [picked]), picked)).toBe(false);
  });

  it('沒有訂單編輯權時沒有作廢物流單；出貨人員也沒有', () => {
    const lo = logistics('L-1', '等待出貨');
    expect(logisticsActionsOf({ role: 'sales', shipment: packed('順豐', [lo]), logistics: lo })).not.toContain(L.VOID);
    expect(logisticsKeys('shipper', '順豐', lo)).not.toContain(L.VOID);
  });
});

// ── 12.42 批次拋單的顯示與停用 ──

describe('12.42 批次拋單依出貨單狀態與出貨方式渲染、異常且沒有可出貨物流單時停用', () => {
  const of = (shipment, role = 'shipper') => batchDispatchOf({ role, shipment });

  it('出貨人員只在可出貨的新竹物流出貨單上看到批次拋單；已裝箱、全部等待出貨的新竹物流與可出貨的自取出貨單不渲染', () => {
    expect(of(packed('新竹物流', [logistics('L-1')]))).toEqual({ visible: true, disabled: false, reason: null });
    expect(of(boxedShipment({ method: '新竹物流' })).visible).toBe(false);
    expect(of(packed('新竹物流', [logistics('L-1', '等待出貨')])).visible).toBe(false);
    expect(of(packed('自取', [logistics('L-1')])).visible).toBe(false);
  });

  it('揀貨人員與接單業務看不到批次拋單（沒有拋單權限）', () => {
    const sh = packed('新竹物流', [logistics('L-1')]);
    ['picker', 'sales', 'consultant', 'print_manager', null].forEach((role) => {
      expect(of(sh, role).visible, String(role)).toBe(false);
    });
  });

  it('只有出貨動作為拋單的四種出貨方式有批次拋單', () => {
    ['順豐', '新竹物流', '7-11 交貨便', '全家'].forEach((method) => {
      expect(of(packed(method, [logistics('L-1')])).visible, method).toBe(true);
    });
    ['自取', '專車配送', '其他'].forEach((method) => {
      expect(of(packed(method, [logistics('L-1')])).visible, method).toBe(false);
    });
  });

  it('只在出貨單狀態為可出貨或異常時渲染；草稿、未處理、打包中、已裝箱、等待出貨、運送中、已送達、已作廢都不渲染', () => {
    ['草稿', '未處理', '打包中'].forEach((status) => {
      expect(of(prePacking(status, '新竹物流')).visible, status).toBe(false);
    });
    [
      ['等待出貨', [logistics('L-1', '等待出貨')]],
      ['運送中', [logistics('L-1', '運送中')]],
      ['已送達', [logistics('L-1', '已送達')]],
    ].forEach(([status, los]) => {
      expect(of(packed('新竹物流', los)).visible, status).toBe(false);
    });
    expect(of({ ...packed('新竹物流', [logistics('L-1', '已作廢')]), status: '已作廢' }).visible).toBe(false);
    // 一筆等待出貨、一筆可出貨：出貨單取最落後為可出貨，顯示
    expect(of(packed('新竹物流', [logistics('L-1', '等待出貨'), logistics('L-2')])).visible).toBe(true);
    // 異常且還有可出貨物流單：顯示、可按
    expect(of(packed('新竹物流', [logistics('L-1', '例外事故'), logistics('L-2')]))).toMatchObject({
      visible: true,
      disabled: false,
    });
  });

  it('出貨單為異常且底下沒有可出貨的物流單時停用並顯示理由', () => {
    const btn = of(packed('7-11 交貨便', [logistics('L-1', '例外事故'), logistics('L-2', '等待出貨')]));
    expect(btn).toMatchObject({ visible: true, disabled: true });
    expect(btn.reason).toBeTruthy();
  });
});
