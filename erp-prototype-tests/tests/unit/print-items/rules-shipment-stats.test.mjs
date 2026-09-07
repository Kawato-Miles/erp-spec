import { describe, it, expect } from 'vitest';
import { MOCK_PRINT_ITEMS, MOCK_QC_RECORDS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import {
  sumShippedQty,
  sumDeliveredQty,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/detail-selectors.js';
import {
  MOCK_SHIPMENTS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  calcShippableQty,
  calcShippedQty,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';

// 15.5 印件出貨統計反映已送達的出貨單（原編號 185）
// 起點資料：鏈一 PI-2026-0601 與 SHP-2026-0601-01（已送達 5,000）。
// 業務檢視該印件的已出貨、可出貨額度、累計已出貨數量、累計送達數四個數字，
// 四個數字與該張已送達出貨單對得起來：已出貨 5,000、累計已出貨數量 5,000、
// 累計送達數 5,000、可出貨額度 0。
describe('15.5 印件出貨統計反映已送達的出貨單', () => {
  const PRINT_ITEM_NO = 'PI-2026-0601';

  it('鏈一唯一一張出貨單已送達 5,000', () => {
    const shipment = MOCK_SHIPMENTS.find((sh) =>
      sh.details.some((d) => d.print_item_no === PRINT_ITEM_NO),
    );
    expect(shipment).toBeTruthy();
    expect(shipment.status).toBe('已送達');
    expect(shipment.details.find((d) => d.print_item_no === PRINT_ITEM_NO).qty).toBe(5000);
  });

  it('已出貨（訂單印件列的口徑：運送中或已送達）為 5,000', () => {
    const value = calcShippedQty({ print_item_no: PRINT_ITEM_NO }, MOCK_SHIPMENTS);
    expect(value).toBe(5000);
  });

  it('累計已出貨數量（印件詳情的口徑：出貨單佔用量，異常與已作廢不計）為 5,000', () => {
    const value = sumShippedQty(MOCK_SHIPMENTS, PRINT_ITEM_NO);
    expect(value).toBe(5000);
  });

  it('累計送達數為 5,000', () => {
    const value = sumDeliveredQty(MOCK_SHIPMENTS, PRINT_ITEM_NO);
    expect(value).toBe(5000);
  });

  it('可出貨額度＝完工良品數（5,000）－出貨單佔用量（5,000）＝0', () => {
    const printItem = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === PRINT_ITEM_NO);
    expect(printItem).toBeTruthy();
    const value = calcShippableQty(printItem, MOCK_SHIPMENTS, MOCK_QC_RECORDS);
    expect(value).toBe(0);
  });
});
