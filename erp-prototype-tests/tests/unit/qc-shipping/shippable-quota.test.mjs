import { describe, expect, it } from 'vitest';
import {
  calcShippableQty,
  calcShippedQty,
  detailsTotalQty,
  validateShipmentQuota,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';

// 情境 12.2「額度即時檢核並整張擋下」與 12.4「回報總數與明細數量並排」的數字驗算
// （畫面呈現另在 e2e 12.2、12.4 驗）。
// 可出貨額度＝完工良品數 − 未回補的出貨佔用；異常與已作廢兩終態退出佔用。

const printItem = { print_item_no: 'PI-2026-0820' };
const qcRecords = [{ print_item_no: 'PI-2026-0820', passed_qty: 480, failed_qty: 20 }];

const shipment = (id, status, qty) => ({
  id,
  status,
  order_no: 'ORD-2026-0820',
  details: [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty }],
});

describe('可出貨額度', () => {
  it('沒有出貨單時額度等於完工良品數', () => {
    expect(calcShippableQty(printItem, [], qcRecords)).toBe(480);
  });

  it('尚未離廠的出貨單也算佔用', () => {
    const shipments = [shipment('sh-1', '未處理', 200)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(280);
  });

  it('異常與已作廢的出貨單退出佔用、額度回補', () => {
    const shipments = [shipment('sh-1', '異常', 200), shipment('sh-2', '已作廢', 100)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(480);
  });

  it('改某張單的明細數量時，本單原有的佔用先還回來當增量基準', () => {
    const shipments = [shipment('sh-1', '未處理', 200)];
    expect(calcShippableQty(printItem, shipments, qcRecords, 'sh-1')).toBe(480);
  });
});

describe('建單額度檢核', () => {
  it('任一條明細超額即整張擋下，並逐筆帶出當下額度', () => {
    const result = validateShipmentQuota({
      details: [
        { print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty: 600 },
      ],
      shipments: [],
      qcRecords,
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].quota).toBe(480);
  });

  it('填在額度內即通過', () => {
    const result = validateShipmentQuota({
      details: [{ print_item_no: 'PI-2026-0820', name: '精裝書', qty: 480 }],
      shipments: [],
      qcRecords,
    });
    expect(result.ok).toBe(true);
  });
});

describe('出貨單上的兩個數', () => {
  it('出貨明細數量為明細合計（與實際裝箱數量並排比對用）', () => {
    expect(detailsTotalQty(shipment('sh-1', '待出貨', 500))).toBe(500);
  });

  it('已出貨只認貨已離廠的單（運送中、已送達）', () => {
    const shipments = [
      shipment('sh-1', '待出貨', 100),
      shipment('sh-2', '運送中', 200),
      shipment('sh-3', '已送達', 150),
      shipment('sh-4', '異常', 50),
    ];
    expect(calcShippedQty(printItem, shipments)).toBe(350);
  });
});
