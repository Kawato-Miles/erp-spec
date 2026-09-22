import { describe, expect, it } from 'vitest';
import { nextStatusOptions } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/next-status-options.js';

// 情境 12.15「出貨單側板的狀態欄只列合法的下一步，依角色與出貨方式過濾」的驗算
//（畫面呈現另在 e2e 12.15 驗）。
//
// 狀態欄是側板裡唯一會推進單據的控制項，可選值錯一格就會讓現場推出一個狀態機不允許的轉換，
// 所以逐一格驗：角色 × 當下狀態 × 出貨方式三個維度的每一種組合各對一次。
// required 是這個轉換要填齊才推得動的欄位；重量（公斤）三種出貨方式都填得了，掛在 optional。

const shipmentOf = (status, method = '新竹物流') => ({ status, method });
const statusesOf = (role, shipment) => nextStatusOptions({ role, shipment }).map((o) => o.status);
const onlyOption = (role, shipment) => {
  const options = nextStatusOptions({ role, shipment });
  expect(options).toHaveLength(1);
  return options[0];
};

describe('揀貨人員', () => {
  it('未處理只推得到打包中，不必填任何欄位', () => {
    const option = onlyOption('picker', shipmentOf('未處理'));
    expect(option.status).toBe('打包中');
    expect(option.required).toEqual([]);
  });

  it('打包中只推得到待出貨，要填實際裝箱數量、箱數、每箱幾個、箱規與裝箱照', () => {
    const option = onlyOption('picker', shipmentOf('打包中'));
    expect(option.status).toBe('待出貨');
    expect(option.required).toEqual([
      'actual_qty',
      'boxes',
      'per_box_qty',
      'box_spec',
      'packing_photos',
    ]);
  });

  it('待出貨之後的每一格都不是揀貨人員的球', () => {
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
    expect(option.optional).toEqual(['weight_kg']);
  });

  it('專車配送到運送中，發車確認不必附任何憑證', () => {
    const option = onlyOption('shipper', shipmentOf('待出貨', '專車配送'));
    expect(option.status).toBe('運送中');
    expect(option.required).toEqual([]);
    expect(option.optional).toEqual(['weight_kg']);
  });

  it('第三方物流到運送中，托運單號必填、重量選填', () => {
    ['順豐', '新竹物流', '超商', '其他'].forEach((method) => {
      const option = onlyOption('shipper', shipmentOf('待出貨', method));
      expect(option.status).toBe('運送中');
      expect(option.required).toEqual(['tracking_no']);
      expect(option.optional).toEqual(['weight_kg']);
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

describe('業務', () => {
  it('未離廠三態都只推得到已作廢，理由必填', () => {
    ['未處理', '打包中', '待出貨'].forEach((status) => {
      const option = onlyOption('sales', shipmentOf(status));
      expect(option.status).toBe('已作廢');
      expect(option.required).toEqual(['reason']);
    });
  });

  it('草稿的出口是刪除、不走作廢，所以狀態欄沒有下一步', () => {
    expect(statusesOf('sales', shipmentOf('草稿'))).toEqual([]);
  });

  it('貨已離廠與終態的單業務都推不動', () => {
    ['運送中', '已送達', '異常', '已作廢'].forEach((status) => {
      expect(statusesOf('sales', shipmentOf(status))).toEqual([]);
    });
  });
});

describe('其他角色與缺件輸入', () => {
  it('印務、生管等角色在任何一格都沒有下一步（狀態欄唯讀）', () => {
    ['printing', 'planner', 'qc_inspector', null].forEach((role) => {
      ['未處理', '打包中', '待出貨', '運送中'].forEach((status) => {
        expect(statusesOf(role, shipmentOf(status))).toEqual([]);
      });
    });
  });

  it('沒有出貨單時回空陣列（建立草稿的側板沒有進度頁籤）', () => {
    expect(nextStatusOptions({ role: 'sales', shipment: null })).toEqual([]);
    expect(nextStatusOptions({})).toEqual([]);
  });
});
