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

const shipment = (no, status, dates, printItemNos) => ({
  shipment_no: no,
  status,
  shipped_at: dates.shipped_at ?? null,
  delivered_at: dates.delivered_at ?? null,
  details: printItemNos.map((n) => ({ print_item_no: n, qty: 100 })),
  planned_details: [],
});

describe('12.8 實際出貨日與出貨準時判定', () => {
  it('第三方物流轉運送中時取該日為實際出貨日', () => {
    const s = shipment('SH-1', '運送中', { shipped_at: '2026-10-14 16:00' }, ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('自取單直接轉已送達時同樣取該日，不另設取值規則', () => {
    const s = shipment('SH-1', '已送達', { delivered_at: '2026-10-14 10:00' }, ['A']);
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('實際出貨日不因後續轉已送達而重寫', () => {
    const s = shipment(
      'SH-1',
      '已送達',
      { shipped_at: '2026-10-14 16:00', delivered_at: '2026-10-16 09:00' },
      ['A'],
    );
    expect(shipmentActualShipDate(s)).toBe('2026-10-14');
  });

  it('草稿、異常與已作廢的單沒有實際出貨日', () => {
    for (const status of ['草稿', '未處理', '打包中', '待出貨', '異常', '已作廢']) {
      const s = shipment('SH-1', status, { shipped_at: '2026-10-14 16:00' }, ['A']);
      expect(shipmentActualShipDate(s)).toBeNull();
    }
  });

  it('首張出貨單晚於印件預計交期時判為逾期', () => {
    // 印件預計交期 2026-10-13，首張出貨單 2026-10-14
    const result = shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), [
      shipment('SH-1', '運送中', { shipped_at: '2026-10-14 16:00' }, ['A']),
    ]);
    expect(result).toMatchObject({ judged: true, onTime: false, overWorkingDays: 1 });
  });

  it('分批出貨以首張判定、後續不改判', () => {
    const shipments = [
      shipment('SH-1', '已送達', { shipped_at: '2026-10-12 16:00' }, ['A']),
      shipment('SH-2', '運送中', { shipped_at: '2026-10-20 16:00' }, ['A']),
    ];
    expect(firstShipmentOfPrintItem(shipments, 'A').shipment_no).toBe('SH-1');
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).onTime).toBe(true);
  });

  it('同一時間進入已出貨狀態群時取出貨單編號較小者為首張', () => {
    const shipments = [
      shipment('SH-2026-0602', '運送中', { shipped_at: '2026-10-12 16:00' }, ['A']),
      shipment('SH-2026-0601', '運送中', { shipped_at: '2026-10-12 16:00' }, ['A']),
    ];
    expect(firstShipmentOfPrintItem(shipments, 'A').shipment_no).toBe('SH-2026-0601');
  });

  it('一張出貨單含多件印件時各自比對自己的印件預計交期', () => {
    const shipments = [shipment('SH-1', '運送中', { shipped_at: '2026-10-14 16:00' }, ['A', 'B'])];
    // A 的印件預計交期 2026-10-13（逾期）、B 的 2026-10-16（準時）
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).onTime).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('B', '2026-10-15'), shipments).onTime).toBe(true);
  });

  it('首張出貨單轉異常後該印件回到未出貨、原判定失效', () => {
    const shipments = [shipment('SH-1', '異常', { shipped_at: '2026-10-12 16:00' }, ['A'])];
    expect(isPrintItemShipped(shipments, 'A')).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).judged).toBe(false);
  });

  it('印件預計交期為空時不判定、不計入指標', () => {
    const shipments = [shipment('SH-1', '運送中', { shipped_at: '2026-10-14 16:00' }, ['A'])];
    expect(shipmentOnTimeOfPrintItem(item('A', null), shipments).judged).toBe(false);
  });

  it('尚無出貨單進入已出貨狀態群時視為未出貨', () => {
    const shipments = [shipment('SH-1', '草稿', {}, ['A'])];
    expect(isPrintItemShipped(shipments, 'A')).toBe(false);
    expect(shipmentOnTimeOfPrintItem(item('A', '2026-10-12'), shipments).judged).toBe(false);
  });
});
