import { describe, it, expect } from 'vitest';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';

// 15.7 印件與工單的印件內部完成日一致（原編號 184，交期鏈日期定義改版後改寫）
// order-management spec § 印件內部完成日推導、work-order spec § 工單排程日期：工單的
// 印件內部完成日與印件預計交期唯讀承接自所屬印件的推導值，兩處必須一致。訂單層已無任何交期欄
//（訂單交期與內部製作截止日兩欄已刪除），沒有第三個數字可比。
// 鏈二 PI-2026-0710／WO-2026-0710：未扣急件內部完成日 2026-09-14（一）、一般件，
//   印件內部完成日 2026-09-14、印件預計交期 2026-09-15（二）。
// 鏈三 PI-2026-0815／WO-2026-0815：未扣急件內部完成日 2026-10-02（五）、一般件，
//   印件內部完成日 2026-10-02、印件預計交期 2026-10-05（一，跳週末）。
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
