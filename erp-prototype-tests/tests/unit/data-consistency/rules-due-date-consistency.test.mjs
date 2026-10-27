import { describe, it, expect } from 'vitest';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_QUOTES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/mock-data.js';
import { derivePrintItemInternalDueDate } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/delivery-chain.js';

// 15.7 印件與工單的印件內部完成日一致（原編號 184，交期鏈日期定義改版後改寫）
// order-management spec § 印件內部完成日推導、work-order spec § 工單排程日期：工單的
// 印件內部完成日與印件預計交期唯讀承接自所屬印件的推導值，兩處必須一致。訂單層已無任何交期欄
//（訂單交期與內部製作截止日兩欄已刪除），沒有第三個數字可比。
// 急件新定義（2026-10-27）：源頭是業務填的印件預計交期，印件內部完成日＝其往前減 1 個工作天。
// 鏈二 PI-2026-0710／WO-2026-0710：印件預計交期 2026-09-15（二）、一般件，
//   印件內部完成日 2026-09-14（一）。
// 鏈三 PI-2026-0815／WO-2026-0815：印件預計交期 2026-10-05（一）、一般件，
//   印件內部完成日 2026-10-02（五，跳週末）。
describe('15.7 印件與工單的印件內部完成日一致', () => {
  const CASES = [
    {
      printItemNo: 'PI-2026-0710',
      workOrderNo: 'WO-2026-0710',
      internalDueDate: '2026-09-14',
      expectedDeliveryDate: '2026-09-15',
    },
    {
      printItemNo: 'PI-2026-0815',
      workOrderNo: 'WO-2026-0815',
      internalDueDate: '2026-10-02',
      expectedDeliveryDate: '2026-10-05',
    },
  ];

  it.each(CASES)(
    '$printItemNo／$workOrderNo：印件內部完成日與印件預計交期兩處相等',
    ({ printItemNo, workOrderNo, internalDueDate, expectedDeliveryDate }) => {
      const printItem = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === printItemNo);
      const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === workOrderNo);

      expect(printItem, `找不到印件 ${printItemNo}`).toBeTruthy();
      expect(workOrder, `找不到工單 ${workOrderNo}`).toBeTruthy();

      expect(printItem.delivery_date).toBe(internalDueDate);
      expect(workOrder.print_item.delivery_date).toBe(internalDueDate);
      expect(printItem.expected_delivery_date).toBe(expectedDeliveryDate);
      expect(workOrder.print_item.expected_delivery_date).toBe(expectedDeliveryDate);
    },
  );
});

// 急件新定義的 mock 鏈一致性：未扣欄已刪除；每件印件的印件內部完成日＝印件預計交期往前減 1 個工作天；
// 需求單印件項目的印件預計交期＝成交後訂單印件的印件預計交期（轉訂單直接帶入）
describe('急件新定義的 mock 日期鏈', () => {
  const orderItems = MOCK_ORDERS.flatMap((o) => o.print_items ?? []);

  it('訂單印件、印件列表、工單副本、需求單印件項目皆無未扣急件內部完成日欄', () => {
    const carriers = [
      ...orderItems,
      ...MOCK_PRINT_ITEMS,
      ...MOCK_WORK_ORDERS.map((w) => w.print_item ?? {}),
      ...MOCK_QUOTES.flatMap((q) => q.items ?? []),
    ];
    const bad = carriers.filter((x) => Object.prototype.hasOwnProperty.call(x, 'undeducted_internal_due_date'));
    expect(bad.length).toBe(0);
  });

  it('每件訂單印件的印件內部完成日＝印件預計交期往前減 1 個工作天（急件不影響）', () => {
    const bad = orderItems
      .filter((p) => (p.delivery_date ?? null) !== (derivePrintItemInternalDueDate(p) ?? null))
      .map((p) => `${p.print_item_no}：${p.expected_delivery_date} → ${p.delivery_date}`);
    expect(bad).toEqual([]);
  });

  it('鏈四三天急件 PI-2026-0820：預計交期 2026-09-07、內部完成日 2026-09-04（急件不扣日期）', () => {
    const p = orderItems.find((x) => x.print_item_no === 'PI-2026-0820');
    expect(p).toMatchObject({ urgent_option_days: 3, expected_delivery_date: '2026-09-07', delivery_date: '2026-09-04' });
  });

  it('需求單印件項目的印件預計交期＝成交後訂單印件的值', () => {
    const bad = [];
    for (const q of MOCK_QUOTES) {
      const order = MOCK_ORDERS.find((o) => o.source_quote_no === q.quote_no);
      if (!order) continue;
      (q.items ?? []).forEach((x, i) => {
        const y = (order.print_items ?? [])[i];
        if (y && (x.expected_delivery_date ?? null) !== (y.expected_delivery_date ?? null))
          bad.push(`${q.quote_no}／${y.print_item_no}`);
      });
    }
    expect(bad).toEqual([]);
  });
});
