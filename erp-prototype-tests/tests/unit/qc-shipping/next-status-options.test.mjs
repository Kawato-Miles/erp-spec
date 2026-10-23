import { describe, expect, it } from 'vitest';
import {
  batchDispatchOf,
  LOGISTICS_LEVEL_KEY as L,
  logisticsActionsOf,
  nextStatusOptions,
  SHIPMENT_LEVEL_KEY as S,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { canVoidShipment } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipment-access.js';
import { departed, logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.15「列上動作鈕只列合法的下一步，依角色、出貨方式與物流單狀態過濾」的驗算
//（畫面呈現另在 e2e 12.15 驗）。
//
// 出貨單層的動作（開始揀貨、完成裝箱回報、作廢出貨單）與物流單層的動作（出貨動作、重新同步、
// 標記例外、送達確認、交付確認、補附送達憑證、下載、作廢物流單）各自只列合法的那幾個
//（依據 grill G31：出貨動作在物流單列上；G32：不設單筆重試）：可選值錯一格就會讓現場推出一個狀態機不允許的轉換。
// 情境 12.42：拋單方式的出貨單另有批次拋單（G39），依出貨單狀態顯示、資料條件不符時停用並顯示理由（G56），
// 只有能拋單的出貨人員看得到（G57）。批次拋單不是狀態轉換，另由 batchDispatchOf 判定。

const prePacking = (status, method = '新竹物流') => ({ status, method, details: [], logistics_orders: [] });
const packed = (method, los) => packedShipment({ method, logisticsOrders: los });
const keysOf = (role, shipment, extra = {}) =>
  nextStatusOptions({ role, shipment, ...extra }).map((o) => o.key);

describe('揀貨人員', () => {
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

  it('已裝箱之後與草稿、已作廢都不是揀貨人員的球（修正不是狀態轉換，列上鈕另判）', () => {
    expect(keysOf('picker', prePacking('草稿'))).toEqual([]);
    expect(keysOf('picker', prePacking('已作廢'))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [logistics('SH-TEST-0001-001', '已裝箱')]))).toEqual([]);
    expect(keysOf('picker', packed('順豐', [departed('SH-TEST-0001-001', '運送中')]))).toEqual([]);
  });
});

describe('出貨人員在出貨單層沒有狀態推進的動作（批次拋單另由 batchDispatchOf 判定）', () => {
  it('不論出貨方式、物流單狀態，出貨單層都沒有狀態推進的動作', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      const sh = packed(method, [
        logistics('SH-TEST-0001-001', '已裝箱'),
        departed('SH-TEST-0001-002', '等待出貨'),
      ]);
      expect(keysOf('shipper', sh), method).toEqual([]);
    });
  });

  it('單還在揀貨之前（沒有物流單）時也沒有', () => {
    expect(keysOf('shipper', prePacking('未處理'))).toEqual([]);
    expect(keysOf('shipper', prePacking('打包中'))).toEqual([]);
  });
});

describe('業務（作廢依訂單編輯權，由呼叫端判好 canVoid 傳入）', () => {
  it('未處理、打包中與物流單都沒有離廠時間的已裝箱都推得到已作廢，理由必填', () => {
    const shipments = [
      prePacking('未處理'),
      prePacking('打包中'),
      packed('順豐', [logistics('SH-TEST-0001-001', '已裝箱')]),
    ];
    for (const shipment of shipments) {
      const options = nextStatusOptions({ role: 'sales', shipment, canVoid: true });
      expect(options).toHaveLength(1);
      expect(options[0]).toMatchObject({ key: S.VOID, status: '已作廢', required: ['reason'] });
    }
  });

  it('任一筆物流單離廠之後整張單不能作廢：只能逐筆作廢物流單；拋單失敗不算離廠，仍可作廢', () => {
    const failedOnly = packed('順豐', [logistics('SH-TEST-0001-001', '已裝箱')]);
    expect(keysOf('sales', failedOnly, { canVoid: true })).toEqual([S.VOID]);
    const out = packed('順豐', [departed('SH-TEST-0001-001', '等待出貨')]);
    expect(keysOf('sales', out, { canVoid: true })).toEqual([]);
    const partial = packed('7-11 交貨便', [
      departed('SH-TEST-0001-001', '等待出貨'),
      logistics('SH-TEST-0001-002', '已裝箱'),
    ]);
    expect(keysOf('sales', partial, { canVoid: true })).toEqual([]);
  });

  it('沒有訂單編輯權（canVoid 為否）時，角色是業務也沒有作廢：不再以角色名單判斷', () => {
    ['未處理', '打包中'].forEach((status) => {
      expect(keysOf('sales', prePacking(status))).toEqual([]);
    });
  });

  it('草稿的出口是刪除、不走作廢；已作廢的單沒有下一步', () => {
    expect(keysOf('sales', prePacking('草稿'), { canVoid: true })).toEqual([]);
    expect(keysOf('sales', prePacking('已作廢'), { canVoid: true })).toEqual([]);
  });

  it('諮詢比照業務', () => {
    expect(keysOf('consultant', prePacking('未處理'), { canVoid: true })).toEqual([S.VOID]);
    expect(keysOf('consultant', prePacking('草稿'), { canVoid: true })).toEqual([]);
  });
});

describe('其他角色與缺件輸入', () => {
  it('生管、品檢人員等沒有訂單編輯權的角色在任何一格都沒有出貨單層動作', () => {
    ['planner', 'qc_inspector', null].forEach((role) => {
      ['未處理', '打包中'].forEach((status) => {
        expect(keysOf(role, prePacking(status))).toEqual([]);
      });
      expect(keysOf(role, packed('順豐', [logistics('SH-TEST-0001-001', '已裝箱')]))).toEqual([]);
    });
  });

  // C18（12.15 改寫）：六個全公司協助角色有作廢；揀貨人員、出貨人員沒有作廢（現場角色不隨訂單編輯權開放）
  it('六個全公司協助角色在未出貨動作有作廢；揀貨人員、出貨人員沒有', () => {
    const anyOrder = { sales_person: '洪嘉駿', shared_members: [] };
    const helpers = [
      ['sales_manager', '林雅婷'],
      ['order_manager', '黃聖雯'],
      ['print_manager', '吳國豪'],
      ['print_officer', '周建宏'],
      ['reviewer_supervisor', '魏彣軒'],
      ['supervisor', '王大明'],
    ];
    ['未處理', '打包中'].forEach((status) => {
      helpers.forEach(([role, name]) => {
        const canVoid = canVoidShipment(anyOrder, role, name);
        expect(canVoid, `${role} ${status}`).toBe(true);
        expect(keysOf(role, prePacking(status), { canVoid }), `${role} ${status}`).toEqual([S.VOID]);
      });
      [['picker', '范姜宏'], ['shipper', '曾志偉']].forEach(([role, name]) => {
        const canVoid = canVoidShipment(anyOrder, role, name);
        expect(canVoid).toBe(false);
        expect(keysOf(role, prePacking(status), { canVoid })).not.toContain(S.VOID);
      });
    });
  });

  it('沒有出貨單時回空陣列（建立草稿的對話框沒有進度）', () => {
    expect(nextStatusOptions({ role: 'sales', shipment: null })).toEqual([]);
    expect(nextStatusOptions({})).toEqual([]);
  });
});

// ── 物流單層動作 ──

const logisticsKeys = (role, method, lo, extra = {}) =>
  logisticsActionsOf({ role, shipment: packed(method, [lo]), logistics: lo, ...extra });

describe('出貨人員對物流單：重新同步、標記例外、送達確認與交付確認依狀態與出貨方式分流', () => {
  it('第三方：等待出貨可重新同步、標記例外；已出貨與運送中可重新同步、標記例外；只有運送中可送達確認', () => {
    const waiting = departed('SH-TEST-0001-001', '等待出貨', { tracking_no: 'SF1', label_file: 'a.pdf' });
    expect(logisticsKeys('shipper', '順豐', waiting)).toEqual([
      L.RESYNC,
      L.MARK_EXCEPTION,
      L.DOWNLOAD_LABEL,
    ]);
    const shipped = departed('SH-TEST-0001-001', '已出貨', { tracking_no: 'SF1', label_file: 'a.pdf' });
    expect(logisticsKeys('shipper', '順豐', shipped)).toEqual([
      L.RESYNC,
      L.MARK_EXCEPTION,
      L.DOWNLOAD_LABEL,
    ]);
    const moving = departed('SH-TEST-0001-001', '運送中', { tracking_no: 'SF1', label_file: 'a.pdf' });
    expect(logisticsKeys('shipper', '順豐', moving)).toEqual([
      L.RESYNC,
      L.MARK_EXCEPTION,
      L.DELIVER,
      L.DOWNLOAD_LABEL,
    ]);
  });

  it('專車與其他：已出貨可標記例外、送達確認，沒有重新同步（沒有物流商可同步）', () => {
    ['專車配送', '其他'].forEach((method) => {
      const lo = departed('SH-TEST-0001-001', '已出貨');
      expect(logisticsKeys('shipper', method, lo), method).toEqual([L.MARK_EXCEPTION, L.DELIVER]);
    });
  });

  it('自取：可自取可標記例外、交付確認（不叫送達確認）；沒有重新同步', () => {
    const lo = departed('SH-TEST-0001-001', '可自取');
    expect(logisticsKeys('shipper', '自取', lo)).toEqual([L.MARK_EXCEPTION, L.HANDOVER]);
  });

  it('例外三態：第三方可重新同步、送達確認；專車與自取可送達確認或交付確認；都沒有再標記例外', () => {
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((status) => {
      const lo = departed('SH-TEST-0001-001', status, { exception_source: 'manual' });
      expect(logisticsKeys('shipper', '新竹物流', lo), status).toEqual([L.RESYNC, L.DELIVER]);
      expect(logisticsKeys('shipper', '專車配送', lo), status).toEqual([L.DELIVER]);
      expect(logisticsKeys('shipper', '自取', lo), status).toEqual([L.HANDOVER]);
    });
  });

  it('已送達與已自取只剩補附送達憑證（與下載）；已作廢沒有任何出貨人員動作', () => {
    expect(
      logisticsKeys('shipper', '專車配送', departed('SH-TEST-0001-001', '已送達')),
    ).toEqual([L.ATTACH_PROOF]);
    expect(
      logisticsKeys('shipper', '自取', departed('SH-TEST-0001-001', '已自取')),
    ).toEqual([L.ATTACH_PROOF]);
    expect(
      logisticsKeys('shipper', '順豐', departed('SH-TEST-0001-001', '已作廢', { label_file: 'a.pdf' })),
    ).toEqual([]);
  });

  it('出貨動作：只在該筆物流單為已裝箱時出現，揀貨相符、訂單未取消；依出貨方式只有一顆（鈕名由方式決定）', () => {
    ['自取', '專車配送', '順豐', '新竹物流', '7-11 交貨便', '全家', '其他'].forEach((method) => {
      expect(logisticsKeys('shipper', method, logistics('SH-TEST-0001-001', '已裝箱')), method).toEqual([L.DISPATCH]);
    });
    const fresh = logistics('SH-TEST-0001-001', '已裝箱');
    expect(logisticsKeys('shipper', '順豐', fresh, { orderCancelled: true })).toEqual([]);
    const mismatch = packed('順豐', [fresh]);
    mismatch.details[0].picked_qty = 90;
    expect(logisticsActionsOf({ role: 'shipper', shipment: mismatch, logistics: fresh })).toEqual([]);
    // 已離廠的物流單沒有出貨動作；同單另一筆仍在已裝箱者各自有
    const mixed = packed('7-11 交貨便', [departed('SH-TEST-0001-001', '等待出貨'), fresh]);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: mixed.logistics_orders[0] })).not.toContain(L.DISPATCH);
    expect(logisticsActionsOf({ role: 'shipper', shipment: mixed, logistics: fresh })).toEqual([L.DISPATCH]);
  });

  it('其他角色在物流單上沒有出貨動作', () => {
    ['sales', 'picker', 'planner'].forEach((role) => {
      expect(logisticsKeys(role, '順豐', logistics('SH-TEST-0001-001', '已裝箱')), role).not.toContain(L.DISPATCH);
    });
  });
});

describe('業務對物流單：作廢的開放狀態', () => {
  const voidable = (method, lo, shipmentExtra = {}) =>
    logisticsActionsOf({
      role: 'sales',
      shipment: { ...packed(method, [lo]), ...shipmentExtra },
      logistics: lo,
      canVoid: true,
    }).includes(L.VOID);

  it('已裝箱：只在出貨單部分離廠時可作廢；沒有任何物流單離廠（含拋單失敗）時不可（改走作廢出貨單）', () => {
    expect(voidable('順豐', logistics('SH-TEST-0001-001', '已裝箱'))).toBe(false);
  });

  it('部分離廠：同單其他物流單已離廠時（例如另一箱已送出才發現這一箱裝錯、或訂單取消後被擋下），已裝箱的物流單可作廢', () => {
    const waiting = logistics('SH-TEST-0001-002', '已裝箱');
    const shipment = packed('7-11 交貨便', [departed('SH-TEST-0001-001', '等待出貨'), waiting]);
    expect(
      logisticsActionsOf({ role: 'sales', shipment, logistics: waiting, canVoid: true }),
    ).toContain(L.VOID);
  });

  it('等待出貨與例外三態可作廢；已出貨、可自取、運送中要先轉例外；已送達與已自取不可', () => {
    expect(voidable('順豐', departed('SH-TEST-0001-001', '等待出貨'))).toBe(true);
    ['未送達', '無追蹤中包裹', '例外事故'].forEach((status) => {
      expect(voidable('順豐', departed('SH-TEST-0001-001', status)), status).toBe(true);
    });
    ['已出貨', '運送中'].forEach((status) => {
      expect(voidable('順豐', departed('SH-TEST-0001-001', status)), status).toBe(false);
    });
    expect(voidable('自取', departed('SH-TEST-0001-001', '可自取'))).toBe(false);
    expect(voidable('專車配送', departed('SH-TEST-0001-001', '已送達'))).toBe(false);
    expect(voidable('自取', departed('SH-TEST-0001-001', '已自取'))).toBe(false);
  });

  it('沒有訂單編輯權（canVoid 為否）時沒有作廢物流單；出貨人員也沒有', () => {
    const lo = departed('SH-TEST-0001-001', '等待出貨');
    expect(logisticsActionsOf({ role: 'sales', shipment: packed('順豐', [lo]), logistics: lo })).toEqual([]);
    expect(logisticsKeys('shipper', '順豐', lo)).not.toContain(L.VOID);
  });
});

// ── 12.42 批次拋單的顯示與停用（shipment spec § 從出貨單批次拋單；grill G56、G57） ──

describe('12.42 批次拋單依出貨單狀態與出貨方式渲染、揀貨不符與異常無已裝箱時停用', () => {
  const THROW_METHODS = ['順豐', '新竹物流', '7-11 交貨便', '全家'];
  const OTHER_METHODS = ['自取', '專車配送', '其他'];
  const of = (shipment, role = 'shipper') => batchDispatchOf({ role, shipment });

  it('出貨人員：已裝箱的新竹物流出貨單顯示；打包中、全部等待出貨的新竹物流出貨單與已裝箱的自取出貨單不渲染', () => {
    expect(of(packed('新竹物流', [logistics('SH-TEST-0001-001', '已裝箱')]))).toEqual({
      visible: true,
      disabled: false,
      reason: null,
    });
    expect(of(prePacking('打包中', '新竹物流')).visible).toBe(false);
    expect(of(packed('新竹物流', [departed('SH-TEST-0001-001', '等待出貨')])).visible).toBe(false);
    expect(of(packed('自取', [logistics('SH-TEST-0001-001', '已裝箱')])).visible).toBe(false);
  });

  it('揀貨人員與接單業務看不到批次拋單（沒有拋單權限）', () => {
    const sh = packed('新竹物流', [logistics('SH-TEST-0001-001', '已裝箱')]);
    ['picker', 'sales', 'consultant', 'print_manager', null].forEach((role) => {
      expect(of(sh, role).visible, String(role)).toBe(false);
    });
  });

  it('只有出貨動作為拋單的四種出貨方式有批次拋單', () => {
    THROW_METHODS.forEach((method) => {
      expect(of(packed(method, [logistics('SH-TEST-0001-001', '已裝箱')])).visible, method).toBe(true);
    });
    OTHER_METHODS.forEach((method) => {
      expect(of(packed(method, [logistics('SH-TEST-0001-001', '已裝箱')])).visible, method).toBe(false);
    });
  });

  it('只在出貨單狀態為已裝箱或異常時渲染；草稿、未處理、打包中、等待出貨、已出貨、運送中、已送達、已作廢都不渲染', () => {
    ['草稿', '未處理', '打包中'].forEach((status) => {
      expect(of(prePacking(status, '新竹物流')).visible, status).toBe(false);
    });
    [
      ['等待出貨', [departed('L-1', '等待出貨')]],
      ['已出貨', [departed('L-1', '已出貨')]],
      ['運送中', [departed('L-1', '運送中')]],
      ['已送達', [departed('L-1', '已送達')]],
    ].forEach(([status, los]) => {
      expect(of(packed('新竹物流', los)).visible, status).toBe(false);
    });
    expect(of({ ...packed('新竹物流', [departed('L-1', '已作廢')]), status: '已作廢' }).visible).toBe(false);
    // 部分離廠仍是已裝箱：顯示
    expect(of(packed('新竹物流', [departed('L-1', '等待出貨'), logistics('L-2', '已裝箱')])).visible).toBe(true);
    // 異常且還有已裝箱物流單：顯示、可按
    expect(of(packed('新竹物流', [departed('L-1', '例外事故'), logistics('L-2', '已裝箱')]))).toMatchObject({
      visible: true,
      disabled: false,
    });
  });

  it('揀貨不符時批次拋單停用，理由為「揀貨數量與出貨明細不符」；業務改明細為 80 後恢復可按', () => {
    const sh = packedShipment({
      method: '全家',
      qty: 100,
      logisticsOrders: ['001', '002', '003'].map((n) => logistics(`SH-TEST-0001-${n}`, '已裝箱')),
    });
    sh.details[0].picked_qty = 80;
    const btn = of(sh);
    expect(btn).toMatchObject({ visible: true, disabled: true });
    expect(btn.reason).toContain('揀貨數量與出貨明細不符');
    const fixed = { ...sh, details: [{ ...sh.details[0], qty: 80 }] };
    expect(of(fixed)).toEqual({ visible: true, disabled: false, reason: null });
  });

  it('出貨單為異常且底下沒有已裝箱的物流單時停用並顯示理由', () => {
    const btn = of(packed('7-11 交貨便', [departed('L-1', '例外事故'), departed('L-2', '等待出貨')]));
    expect(btn).toMatchObject({ visible: true, disabled: true });
    expect(btn.reason).toBeTruthy();
  });
});
