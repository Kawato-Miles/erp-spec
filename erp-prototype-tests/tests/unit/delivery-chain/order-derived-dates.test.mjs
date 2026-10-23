import { describe, it, expect } from 'vitest';
import {
  isPrintItemShipped,
  orderAllDeliveredByDate,
  orderDelayFlags,
  orderExpectedDeliveryDate,
  orderInternalCompletionDate,
  printItemOverdueWorkingDays,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_SHIPMENTS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import { logistics, packedShipment } from '../qc-shipping/_fixtures.mjs';

// 2.4 訂單層衍生值、2.5 逾期標示（情境目錄 4.11、4.12、4.13）
// 期望值取自 order-management spec（本 change delta）§ 訂單層衍生交期日期、§ 交期逾期標示。
// 「已出貨」＝含該印件的出貨單有任一張屬全數離廠（依物流單狀態判定）；物流單在可出貨或等待出貨時仍算尚未出貨。

const item = (no, undeducted, overrides = {}) => ({
  print_item_no: no,
  undeducted_internal_due_date: undeducted,
  urgent_option_id: 'UO-001',
  urgent_option_name: '一般件',
  urgent_option_days: 0,
  ...overrides,
});

describe('4.11 訂單層三個衍生日期', () => {
  it('訂單內部完成時間取最晚一筆、全部交完日為其下一個工作天', () => {
    const items = [item('A', '2026-10-12'), item('B', '2026-10-14'), item('C', '2026-10-19')];
    expect(orderInternalCompletionDate(items)).toBe('2026-10-19');
    expect(orderAllDeliveredByDate(items)).toBe('2026-10-20');
  });

  it('已棄用印件不計入', () => {
    const items = [
      item('A', '2026-10-12'),
      item('B', '2026-10-14'),
      item('C', '2026-10-30', { print_item_status: '已棄用' }),
    ];
    expect(orderInternalCompletionDate(items)).toBe('2026-10-14');
  });

  it('全部印件皆無日期時三個衍生值皆為空', () => {
    const items = [item('A', null), item('B', null)];
    expect(orderInternalCompletionDate(items)).toBeNull();
    expect(orderAllDeliveredByDate(items)).toBeNull();
    expect(orderExpectedDeliveryDate(items)).toBeNull();
  });
});

// 一張只含某件印件的出貨單，物流單狀態依參數（全數離廠＝全部未作廢物流單都已離廠）
const shipmentOf = (printItemNo, statuses, extra = {}) =>
  packedShipment({
    id: `sh-${printItemNo}`,
    shipmentNo: `SH-TEST-${printItemNo}`,
    printItemNo,
    method: '順豐',
    logisticsOrders: statuses.map((s, i) => logistics(`SH-TEST-${printItemNo}-00${i + 1}`, s)),
    ...extra,
  });
const shippedBy = (shipments) => (i) => isPrintItemShipped(shipments, i.print_item_no);

describe('4.12 訂單預計交貨日期依全數離廠滾動', () => {
  // 三件印件的印件預計交期分別為 2026-10-13、2026-10-15、2026-10-20
  const items = [item('A', '2026-10-12'), item('B', '2026-10-14'), item('C', '2026-10-19')];

  it('皆未出貨時取最早一筆', () => {
    expect(orderExpectedDeliveryDate(items, shippedBy([]))).toBe('2026-10-13');
  });

  it('訂單預計交貨日期依全數離廠滾動：含 A 的出貨單物流商回傳在途、屬全數離廠後，滾到 2026-10-15', () => {
    const shipments = [shipmentOf('A', ['運送中'])];
    expect(isPrintItemShipped(shipments, 'A')).toBe(true);
    expect(orderExpectedDeliveryDate(items, shippedBy(shipments))).toBe('2026-10-15');
  });

  it('物流單在等待出貨時不算已出貨、逾期也不跳筆：A 已拋單在等待出貨、系統日期 2026-10-16，仍顯示 2026-10-13', () => {
    const shipments = [shipmentOf('A', ['等待出貨'])];
    expect(isPrintItemShipped(shipments, 'A')).toBe(false);
    expect(orderExpectedDeliveryDate(items, shippedBy(shipments))).toBe('2026-10-13');
    expect(isPrintItemShipped([shipmentOf('A', ['可出貨'])], 'A')).toBe(false);
    expect(isPrintItemShipped([shipmentOf('A', ['運送中', '等待出貨'])], 'A')).toBe(false);
  });

  it('全部印件出貨後停在最後一筆：三件的出貨單皆屬全數離廠，顯示 2026-10-20', () => {
    const shipments = ['A', 'B', 'C'].map((no) => shipmentOf(no, ['運送中']));
    expect(orderExpectedDeliveryDate(items, shippedBy(shipments))).toBe('2026-10-20');
  });

  it('全數離廠的出貨單作廢後滾動值退回、轉異常不退回', () => {
    const abnormal = [shipmentOf('A', ['例外事故'])];
    expect(orderExpectedDeliveryDate(items, shippedBy(abnormal))).toBe('2026-10-15');
    const voided = [shipmentOf('A', ['已作廢'], { status: '已作廢' })];
    expect(isPrintItemShipped(voided, 'A')).toBe(false);
    expect(orderExpectedDeliveryDate(items, shippedBy(voided))).toBe('2026-10-13');
  });

  it('草稿與已裝箱、尚無物流單的出貨單不使印件算已出貨', () => {
    const draft = { ...shipmentOf('A', []), status: '草稿', details: [], planned_details: [{ print_item_no: 'A', qty: 100 }] };
    const boxed = { ...shipmentOf('A', []), status: '已裝箱' };
    expect(isPrintItemShipped([draft, boxed], 'A')).toBe(false);
  });
});

describe('4.13 交期逾期標示：部分延遲與整單逾期以全部交完日切開、互斥', () => {
  // 全部交完日 2026-10-20（二）：訂單內部完成時間取最晚一筆 2026-10-19
  // PI-2026-0821 的印件預計交期 2026-10-13（二）
  const items = [item('PI-2026-0821', '2026-10-12'), item('PI-2026-0822', '2026-10-19')];

  it('印件逾期天數以工作天計', () => {
    // 印件預計交期 2026-10-13，系統日期 2026-10-15 → 2 個工作天
    expect(printItemOverdueWorkingDays(item('A', '2026-10-12'), '2026-10-15')).toBe(2);
  });

  it('物流單在等待出貨時印件仍標逾期、訂單標部分延遲：2026-10-14 拋單成功在等待出貨 → 逾期 1 個工作天、部分延遲、不標整單逾期', () => {
    const shipments = [shipmentOf('PI-2026-0821', ['等待出貨'])];
    const shipped = isPrintItemShipped(shipments, 'PI-2026-0821');
    expect(printItemOverdueWorkingDays(items[0], '2026-10-14', shipped)).toBe(1);
    expect(orderDelayFlags(items, '2026-10-14', shippedBy(shipments))).toEqual({ partialDelay: true, wholeOverdue: false });
  });

  it('全數離廠後解除逾期：2026-10-15 物流商回傳在途 → 印件不標逾期、訂單不標部分延遲', () => {
    const shipments = [shipmentOf('PI-2026-0821', ['運送中'])];
    const shipped = isPrintItemShipped(shipments, 'PI-2026-0821');
    expect(printItemOverdueWorkingDays(items[0], '2026-10-15', shipped)).toBeNull();
    expect(orderDelayFlags(items, '2026-10-15', shippedBy(shipments)).partialDelay).toBe(false);
  });

  it('系統日期跨過全部交完日時部分延遲換成整單逾期：2026-10-20 部分延遲；2026-10-21 起整單逾期、不同時標部分延遲；印件仍標逾期', () => {
    const none = shippedBy([]);
    expect(orderAllDeliveredByDate(items)).toBe('2026-10-20');
    expect(orderDelayFlags(items, '2026-10-20', none)).toEqual({ partialDelay: true, wholeOverdue: false });
    expect(orderDelayFlags(items, '2026-10-21', none)).toEqual({ partialDelay: false, wholeOverdue: true });
    expect(printItemOverdueWorkingDays(items[0], '2026-10-21', false)).not.toBeNull();
  });

  it('印件預計交期改晚到全部交完日之後仍只看全部交完日：印件甲改為 2026-10-23、系統日期 2026-10-21 → 甲不標逾期、訂單標整單逾期', () => {
    const late = [item('甲', '2026-10-19', { expected_delivery_date: '2026-10-23' })];
    expect(orderAllDeliveredByDate(late)).toBe('2026-10-20');
    expect(printItemOverdueWorkingDays(late[0], '2026-10-21', false)).toBeNull();
    expect(orderDelayFlags(late, '2026-10-21', shippedBy([]))).toEqual({ partialDelay: false, wholeOverdue: true });
  });

  it('全部交完日為空時不判整單逾期；任一印件逾期仍標部分延遲', () => {
    const items2 = [item('A', '2026-10-12'), item('B', null)];
    // 全部交完日為空：有效印件都沒有印件內部完成日
    const onlyExpected = [{ print_item_no: 'X', undeducted_internal_due_date: null, expected_delivery_date: '2026-10-13' }];
    expect(orderAllDeliveredByDate(onlyExpected)).toBeNull();
    expect(orderDelayFlags(onlyExpected, '2026-10-30', shippedBy([])).wholeOverdue).toBe(false);
    expect(orderDelayFlags(items2, '2026-10-15', shippedBy([])).partialDelay).toBe(true);
  });

  it('日期為空時不判定：不標任何逾期、部分延遲或整單逾期', () => {
    const empty = [item('A', null), item('B', null)];
    expect(orderDelayFlags(empty, '2026-10-22', shippedBy([]))).toEqual({ partialDelay: false, wholeOverdue: false });
  });

  it('逾期標示不通知：判定只回兩個標示，沒有通知、寄信或待辦的輸出', () => {
    const flags = orderDelayFlags(items, '2026-10-21', shippedBy([]));
    expect(Object.keys(flags).sort()).toEqual(['partialDelay', 'wholeOverdue']);
  });

  it('全部模擬訂單在系統日期 2026-10-23 下，沒有任何一張同時標部分延遲與整單逾期', () => {
    const isShipped = shippedBy(MOCK_SHIPMENTS);
    const both = MOCK_ORDERS.filter((o) => {
      const f = orderDelayFlags(o.print_items ?? [], '2026-10-23', isShipped);
      return f.partialDelay && f.wholeOverdue;
    }).map((o) => o.order_no);
    expect(both).toEqual([]);
  });
});
