import { describe, it, expect } from 'vitest';
import {
  firstShipmentOfPrintItem,
  isPrintItemShipped,
  shipmentActualShipDate,
  shipmentOnTimeOfPrintItem,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 2.11 實際出貨日與出貨準時判定（情境目錄 12.8）
// 期望值取自 shipment spec § 實際出貨日與出貨準時判定。

const item = (no, undeducted, overrides = {}) => ({
  print_item_no: no,
  undeducted_internal_due_date: undeducted,
  urgent_option_id: 'UO-001',
  urgent_option_name: '一般件',
  urgent_option_days: 0,
  ...overrides,
});

// 出貨單的實際出貨日由物流單的離廠時間計算：全部未作廢物流單都有離廠時間時取最晚那筆
//（離廠時間：第三方＝拋單成功、專車與其他＝出貨確認、自取＝標記可自取）。
const lo = (status, left_at = null) => ({ logistics_order_no: `L-${status}`, status, left_at });

const shipment = (no, logisticsOrders, printItemNos, status = '已裝箱') => ({
  shipment_no: no,
  status,
  logistics_orders: logisticsOrders,
  details: printItemNos.map((n) => ({ print_item_no: n, qty: 100 })),
  planned_details: [],
});

describe('12.8 實際出貨日與出貨準時判定', () => {
  it('第三方物流拋單成功的那一天為離廠日，也是實際出貨日', () => {
    const s = shipment('SH-1', [lo('等待出貨', '2026-10-14 16:00')], ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('自取標記可自取的那一天同樣是實際出貨日，不另設取值規則', () => {
    const s = shipment('SH-1', [lo('可自取', '2026-10-14 10:00')], ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('實際出貨日不因後續送達而重寫', () => {
    const s = shipment('SH-1', [{ ...lo('已送達', '2026-10-14 16:00'), delivered_at: '2026-10-16 09:00' }], ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('多筆物流單：全部都有離廠時間才有值，取最晚那筆', () => {
    const s = shipment(
      'SH-1',
      [lo('等待出貨', '2026-10-14 16:00'), lo('等待出貨', '2026-10-15 09:00')],
      ['A'],
    );
    expect(shipmentActualShipDate(s)).toBe('2026-10-15');
  });

  it('有一筆物流單還沒離廠（例如拋單失敗留在已裝箱）時無值；作廢的物流單不參與', () => {
    const partial = shipment('SH-1', [lo('等待出貨', '2026-10-14 16:00'), lo('已裝箱')], ['A']);
    expect(shipmentActualShipDate(partial)).toBeNull();
    const withVoided = shipment('SH-1', [lo('等待出貨', '2026-10-14 16:00'), lo('已作廢')], ['A']);
    expect(shipmentActualShipDate(withVoided)).toBe('2026-10-14');
  });

  it('草稿、未處理、打包中、已裝箱尚未出貨與已作廢的單沒有實際出貨日', () => {
    for (const status of ['草稿', '未處理', '打包中']) {
      expect(shipmentActualShipDate(shipment('SH-1', [], ['A'], status)), status).toBeNull();
    }
    expect(shipmentActualShipDate(shipment('SH-1', [lo('已裝箱')], ['A']))).toBeNull();
    expect(
      shipmentActualShipDate(shipment('SH-1', [lo('已作廢', '2026-10-14 16:00')], ['A'], '已作廢')),
    ).toBeNull();
  });

  it('異常的出貨單只要全數離廠仍有實際出貨日（回到未出貨的條件是作廢，不是異常）', () => {
    const s = shipment('SH-1', [lo('例外事故', '2026-10-14 16:00')], ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
    expect(isPrintItemShipped([s], 'A')).toBe(true);
  });

  it('首張出貨單晚於印件預計交期時判為逾期', () => {
    // 印件預計交期 2026-10-13，首張出貨單 2026-10-14
    const result = shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), [
      shipment('SH-1', [lo('運送中', '2026-10-14 16:00')], ['A']),
    ]);
    expect(result).toMatchObject({ judged: true, onTime: false, overWorkingDays: 1 });
  });

  it('分批出貨以首張判定、後續不改判', () => {
    const shipments = [
      shipment('SH-1', [lo('已送達', '2026-10-12 16:00')], ['A']),
      shipment('SH-2', [lo('運送中', '2026-10-20 16:00')], ['A']),
    ];
    expect(firstShipmentOfPrintItem(shipments, 'A').shipment_no).toBe('SH-1');
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).onTime).toBe(true);
  });

  it('同一天全數離廠時取出貨單編號較小者為首張', () => {
    const shipments = [
      shipment('SH-2026-0602', [lo('運送中', '2026-10-12 16:00')], ['A']),
      shipment('SH-2026-0601', [lo('運送中', '2026-10-12 16:00')], ['A']),
    ];
    expect(firstShipmentOfPrintItem(shipments, 'A').shipment_no).toBe('SH-2026-0601');
  });

  it('一張出貨單含多件印件時各自比對自己的印件預計交期', () => {
    const shipments = [shipment('SH-1', [lo('運送中', '2026-10-14 16:00')], ['A', 'B'])];
    // A 的印件預計交期 2026-10-13（逾期）、B 的 2026-10-16（準時）
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).onTime).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('B', '2026-10-15'), shipments).onTime).toBe(true);
  });

  it('首張出貨單作廢後該印件回到未出貨、原判定失效', () => {
    const shipments = [
      shipment('SH-1', [lo('已作廢', '2026-10-12 16:00')], ['A'], '已作廢'),
    ];
    expect(isPrintItemShipped(shipments, 'A')).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).judged).toBe(false);
  });

  it('印件預計交期為空時不判定、不計入指標', () => {
    const shipments = [shipment('SH-1', [lo('運送中', '2026-10-14 16:00')], ['A'])];
    expect(shipmentOnTimeOfPrintItem(item('A', null), shipments).judged).toBe(false);
  });

  it('尚無出貨單全數離廠時視為未出貨', () => {
    const shipments = [shipment('SH-1', [], ['A'], '草稿')];
    expect(isPrintItemShipped(shipments, 'A')).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).judged).toBe(false);
  });
});
