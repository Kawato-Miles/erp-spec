import { describe, it, expect } from 'vitest';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';

// 15.7 印件與工單的預計交期一致；訂單訂單交期是另一個獨立數字（原編號 184，交期鏈重構後改寫）
// order-management spec § 印件預計交期推導、work-order spec § 工單排程日期：工單的預計交期唯讀
// 承接自所屬印件的「預計交期」，兩者必須一致；訂單單頭的「訂單交期」是另一個顆粒度的數字
// （業務與客戶談的整張單交貨日），與印件層各自談定、各自推導的預計交期不設比對關係，兩者
// 允許不同，系統不檢查、不阻擋、不提示（order-management spec § 內部製作截止日定義）。
// 鏈二 ORD-2026-0710／PI-2026-0710／WO-2026-0710：訂單交期 2026-09-15、一般件，預計交期 2026-09-14。
// 鏈三 ORD-2026-0815／PI-2026-0815／WO-2026-0815：訂單交期 2026-10-05、一般件，預計交期 2026-10-04。
describe('15.7 印件與工單的預計交期一致；訂單訂單交期是另一個獨立數字', () => {
  const CASES = [
    {
      orderNo: 'ORD-2026-0710',
      printItemNo: 'PI-2026-0710',
      workOrderNo: 'WO-2026-0710',
      orderDueDate: '2026-09-15',
      plannedDueDate: '2026-09-14',
    },
    {
      orderNo: 'ORD-2026-0815',
      printItemNo: 'PI-2026-0815',
      workOrderNo: 'WO-2026-0815',
      orderDueDate: '2026-10-05',
      plannedDueDate: '2026-10-04',
    },
  ];

  it.each(CASES)(
    '$orderNo／$printItemNo／$workOrderNo：印件與工單預計交期一致，訂單訂單交期允許不同',
    ({ orderNo, printItemNo, workOrderNo, orderDueDate, plannedDueDate }) => {
      const order = MOCK_ORDERS.find((o) => o.order_no === orderNo);
      const printItem = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === printItemNo);
      const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === workOrderNo);

      expect(order, `找不到訂單 ${orderNo}`).toBeTruthy();
      expect(printItem, `找不到印件 ${printItemNo}`).toBeTruthy();
      expect(workOrder, `找不到工單 ${workOrderNo}`).toBeTruthy();

      // (a) 印件與工單的預計交期一致——工單的預計交期由印件的推導值承接，兩者必須相等
      expect(printItem.delivery_date).toBe(plannedDueDate);
      expect(workOrder.print_item.delivery_date).toBe(plannedDueDate);

      // (b) 訂單層的訂單交期與印件層的預計交期是兩個獨立數字，允許不同（本案例恰好差一天，
      // 因為印件自身訂單交期鏡射訂單訂單交期、一般件只多減那 1 天的內部節奏換算）
      expect(order.order_due_date).toBe(orderDueDate);
      expect(order.order_due_date).not.toBe(plannedDueDate);
    },
  );
});
