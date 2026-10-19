import { describe, expect, it } from 'vitest';
import { nextStatusOptions } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';
import { canVoidShipment } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/shipment-access.js';

// 情境 12.15「列上動作鈕（原出貨單側板的狀態欄）只列合法的下一步，依角色與出貨方式過濾」的驗算
//（畫面呈現另在 e2e 12.15 驗）。
//
// 狀態欄是側板裡唯一會推進單據的控制項，可選值錯一格就會讓現場推出一個狀態機不允許的轉換，
// 所以逐一格驗：角色 × 當下狀態 × 出貨方式三個維度的每一種組合各對一次。
// required 是這個轉換要填齊才推得動的欄位；目前沒有轉換帶選填欄位（出貨單不記重量）。

const shipmentOf = (status, method = '新竹物流') => ({ status, method });
// canVoid：呼叫端先依訂單編輯權（出貨活動清單 ACT-SHP-015、027、033）判好是否可作廢，下一步清單不再用角色名單猜
const statusesOf = (role, shipment, canVoid = false) =>
  nextStatusOptions({ role, shipment, canVoid }).map((o) => o.status);
const onlyOption = (role, shipment, canVoid = false) => {
  const options = nextStatusOptions({ role, shipment, canVoid });
  expect(options).toHaveLength(1);
  return options[0];
};

describe('揀貨人員', () => {
  it('未處理只推得到打包中，不必填任何欄位', () => {
    const option = onlyOption('picker', shipmentOf('未處理'));
    expect(option.status).toBe('打包中');
    expect(option.required).toEqual([]);
  });

  it('打包中只推得到待出貨，要逐條填揀貨數量與每箱幾個，再填箱數、箱規與裝箱照', () => {
    const option = onlyOption('picker', shipmentOf('打包中'));
    expect(option.status).toBe('待出貨');
    expect(option.required).toEqual([
      'picked_qty',
      'per_box_qty',
      'boxes',
      'box_spec',
      'packing_photos',
    ]);
  });

  it('待出貨之後的每一格都不是揀貨人員的球', () => {
    // 待出貨期間的「修正」不是狀態轉換，不在這份清單裡（列上鈕另判，見 12.20）
    ['待出貨', '運送中', '已送達', '異常', '已作廢', '草稿'].forEach((status) => {
      expect(statusesOf('picker', shipmentOf(status))).toEqual([]);
    });
  });
});

describe('出貨人員在待出貨依出貨方式分流', () => {
  it('自取直接到已送達，附現場點交照（不經運送中）', () => {
    const option = onlyOption('shipper', shipmentOf('待出貨', '自取'));
    expect(option.status).toBe('已送達');
    expect(option.required).toEqual(['pickup_proof']);
    expect(option.optional).toEqual([]);
  });

  it('專車配送到運送中，發車確認不必附任何憑證', () => {
    const option = onlyOption('shipper', shipmentOf('待出貨', '專車配送'));
    expect(option.status).toBe('運送中');
    expect(option.required).toEqual([]);
    expect(option.optional).toEqual([]);
  });

  it('第三方物流為拋單到運送中，不填物流單號（由系統示意生成）、沒有選填欄位', () => {
    ['順豐', '新竹物流', '超商', '其他'].forEach((method) => {
      const option = onlyOption('shipper', shipmentOf('待出貨', method));
      expect(option.status).toBe('運送中');
      expect(option.label).toContain('拋單');
      expect(option.required).toEqual([]);
      expect(option.optional).toEqual([]);
    });
  });

  it('出貨方式還沒填時沒有可推的下一步（草稿成立前才可能發生）', () => {
    expect(statusesOf('shipper', { status: '待出貨', method: null })).toEqual([]);
  });
});

describe('出貨人員在運送中', () => {
  it('專車配送有已送達（司機交付照）與異常（理由必填）兩條路', () => {
    const options = nextStatusOptions({
      role: 'shipper',
      shipment: shipmentOf('運送中', '專車配送'),
    });
    expect(options.map((o) => o.status)).toEqual(['已送達', '異常']);
    expect(options[0].required).toEqual(['driver_proof']);
    expect(options[1].required).toEqual(['reason']);
  });

  it('第三方物流的已送達為備援的手動補登配達時間，另有異常', () => {
    const options = nextStatusOptions({ role: 'shipper', shipment: shipmentOf('運送中', '順豐') });
    expect(options.map((o) => o.status)).toEqual(['已送達', '異常']);
    expect(options[0].required).toEqual(['delivered_time']);
    expect(options[0].label).toContain('備援');
    expect(options[1].required).toEqual(['reason']);
  });

  it('自取本來就不會停在運送中；真的落在這一格時走與專車同一條（不另設特例）', () => {
    expect(statusesOf('shipper', shipmentOf('運送中', '自取'))).toEqual(['已送達', '異常']);
  });

  it('終態沒有下一步', () => {
    ['已送達', '異常', '已作廢'].forEach((status) => {
      expect(statusesOf('shipper', shipmentOf(status))).toEqual([]);
    });
  });
});

describe('業務（作廢依訂單編輯權，由呼叫端判好 canVoid 傳入）', () => {
  it('未離廠三態都只推得到已作廢，理由必填', () => {
    ['未處理', '打包中', '待出貨'].forEach((status) => {
      const option = onlyOption('sales', shipmentOf(status), true);
      expect(option.status).toBe('已作廢');
      expect(option.required).toEqual(['reason']);
    });
  });

  it('沒有訂單編輯權（canVoid 為否）時，角色是業務也沒有作廢：不再以角色名單判斷', () => {
    ['未處理', '打包中', '待出貨'].forEach((status) => {
      expect(statusesOf('sales', shipmentOf(status))).toEqual([]);
    });
  });

  it('草稿的出口是刪除、不走作廢，所以狀態欄沒有下一步', () => {
    expect(statusesOf('sales', shipmentOf('草稿'), true)).toEqual([]);
  });

  it('貨已離廠與終態的單業務都推不動', () => {
    ['運送中', '已送達', '異常', '已作廢'].forEach((status) => {
      expect(statusesOf('sales', shipmentOf(status), true)).toEqual([]);
    });
  });
});

describe('諮詢（建單人權限比照業務，情境 12.17）', () => {
  it('未離廠三態同樣只推得到已作廢，理由必填', () => {
    ['未處理', '打包中', '待出貨'].forEach((status) => {
      const option = onlyOption('consultant', shipmentOf(status), true);
      expect(option.status).toBe('已作廢');
      expect(option.required).toEqual(['reason']);
    });
  });

  it('草稿與貨已離廠的單都沒有下一步', () => {
    ['草稿', '運送中', '已送達', '異常', '已作廢'].forEach((status) => {
      expect(statusesOf('consultant', shipmentOf(status), true)).toEqual([]);
    });
  });
});

describe('其他角色與缺件輸入', () => {
  it('生管、品檢人員等沒有訂單編輯權的角色在任何一格都沒有下一步（狀態欄唯讀）', () => {
    ['planner', 'qc_inspector', null].forEach((role) => {
      ['未處理', '打包中', '待出貨', '運送中'].forEach((status) => {
        expect(statusesOf(role, shipmentOf(status))).toEqual([]);
      });
    });
  });

  // C18（12.15 改寫）：六個全公司協助角色有作廢；揀貨人員、出貨人員沒有作廢（現場角色不隨訂單編輯權開放）
  it('六個全公司協助角色在未離廠三態有作廢；揀貨人員、出貨人員沒有', () => {
    const anyOrder = { sales_person: '洪嘉駿', shared_members: [] };
    const helpers = [
      ['sales_manager', '林雅婷'],
      ['order_manager', '黃聖雯'],
      ['print_manager', '吳國豪'],
      ['print_officer', '周建宏'],
      ['reviewer_supervisor', '魏彣軒'],
      ['supervisor', '王大明'],
    ];
    ['未處理', '打包中', '待出貨'].forEach((status) => {
      helpers.forEach(([role, name]) => {
        const canVoid = canVoidShipment(anyOrder, role, name);
        expect(canVoid, `${role} ${status}`).toBe(true);
        expect(statusesOf(role, shipmentOf(status), canVoid), `${role} ${status}`).toEqual(['已作廢']);
      });
      [['picker', '范姜宏'], ['shipper', '曾志偉']].forEach(([role, name]) => {
        const canVoid = canVoidShipment(anyOrder, role, name);
        expect(canVoid).toBe(false);
        expect(statusesOf(role, shipmentOf(status), canVoid)).not.toContain('已作廢');
      });
    });
  });

  it('沒有出貨單時回空陣列（建立草稿的側板沒有進度頁籤）', () => {
    expect(nextStatusOptions({ role: 'sales', shipment: null })).toEqual([]);
    expect(nextStatusOptions({})).toEqual([]);
  });
});
