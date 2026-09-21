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
  firstShipmentOfPrintItem,
  shipmentOnTimeOfPrintItem,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import {
  calcShippableQty,
  calcShippedQty,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';

// 15.5 印件出貨統計反映已送達的出貨單（原編號 185）
// 起點資料：鏈一 PI-2026-0601 分兩批出——SH-2026-0601（首張，3,000，實際出貨日 2026-06-18）
// 與 SH-2026-0602（2,000，實際出貨日 2026-06-22），兩張皆已送達。
// 業務檢視該印件的已出貨、可出貨額度、累計已出貨數量、累計送達數四個數字，
// 四個數字與兩張已送達出貨單的合計對得起來：已出貨 5,000、累計已出貨數量 5,000、
// 累計送達數 5,000、可出貨額度 0。
// 實際出貨日與出貨準時判定一律取**首張**出貨單，後續出貨單不改判（shipment spec
// § 實際出貨日與出貨準時判定）。
describe('15.5 印件出貨統計反映已送達的出貨單', () => {
  const PRINT_ITEM_NO = 'PI-2026-0601';

  it('鏈一分兩批出，兩張皆已送達、合計 5,000', () => {
    const shipments = MOCK_SHIPMENTS.filter((sh) =>
      sh.details.some((d) => d.print_item_no === PRINT_ITEM_NO),
    );
    expect(shipments.map((sh) => sh.shipment_no)).toEqual(['SH-2026-0601', 'SH-2026-0602']);
    expect(shipments.every((sh) => sh.status === '已送達')).toBe(true);
    const total = shipments
      .flatMap((sh) => sh.details)
      .filter((d) => d.print_item_no === PRINT_ITEM_NO)
      .reduce((sum, d) => sum + d.qty, 0);
    expect(total).toBe(5000);
  });

  it('首張出貨單為 SH-2026-0601，實際出貨日 2026-06-18，出貨判為準時', () => {
    const printItem = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === PRINT_ITEM_NO);
    expect(firstShipmentOfPrintItem(MOCK_SHIPMENTS, PRINT_ITEM_NO).shipment_no).toBe(
      'SH-2026-0601',
    );
    const result = shipmentOnTimeOfPrintItem(printItem, MOCK_SHIPMENTS);
    expect(result.actualShipDate).toBe('2026-06-18');
    expect(result.expectedDeliveryDate).toBe('2026-06-22');
    expect(result.onTime).toBe(true);
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

  // 情境 12.1、12.2：鏈四 SH-2026-0820 是草稿，預計出貨印件 PI-2026-0820 × 500 不計入任何出貨統計
  it('草稿的預計出貨印件不計入已出貨與累計已出貨數量', () => {
    const DRAFT_PRINT_ITEM_NO = 'PI-2026-0820';
    const draft = MOCK_SHIPMENTS.find((sh) => sh.status === '草稿');
    expect(draft).toBeTruthy();
    expect(draft.planned_details.some((d) => d.print_item_no === DRAFT_PRINT_ITEM_NO)).toBe(true);
    expect(draft.details).toHaveLength(0);
    expect(calcShippedQty({ print_item_no: DRAFT_PRINT_ITEM_NO }, MOCK_SHIPMENTS)).toBe(0);
    expect(sumShippedQty(MOCK_SHIPMENTS, DRAFT_PRINT_ITEM_NO)).toBe(0);
  });
});
