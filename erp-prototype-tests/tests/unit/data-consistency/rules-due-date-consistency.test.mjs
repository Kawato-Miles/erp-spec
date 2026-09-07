import { describe, it, expect } from 'vitest';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import { MOCK_PRINT_ITEMS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/mock-data.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_FLOOR_TASKS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';

// 15.7 訂單、印件、工單三處交期一致（原編號 184）
// 鏈二 ORD-2026-0710／PI-2026-0710／WO-2026-0710、鏈三 ORD-2026-0815／PI-2026-0815／WO-2026-0815
// 三處顯示同一個日期，生產任務管理頁的印件預計交期欄同步對齊。
// 數字：鏈二三處皆為 2026/09/15；鏈三三處皆為 2026/10/05。
describe('15.7 訂單、印件、工單三處交期一致', () => {
  const CASES = [
    { orderNo: 'ORD-2026-0710', printItemNo: 'PI-2026-0710', workOrderNo: 'WO-2026-0710', due: '2026-09-15' },
    { orderNo: 'ORD-2026-0815', printItemNo: 'PI-2026-0815', workOrderNo: 'WO-2026-0815', due: '2026-10-05' },
  ];

  it.each(CASES)('$orderNo／$printItemNo／$workOrderNo 三處交期皆為 $due', ({ orderNo, printItemNo, workOrderNo, due }) => {
    const order = MOCK_ORDERS.find((o) => o.order_no === orderNo);
    const printItem = MOCK_PRINT_ITEMS.find((p) => p.print_item_no === printItemNo);
    const workOrder = MOCK_WORK_ORDERS.find((w) => w.work_order_no === workOrderNo);

    expect(order, `找不到訂單 ${orderNo}`).toBeTruthy();
    expect(printItem, `找不到印件 ${printItemNo}`).toBeTruthy();
    expect(workOrder, `找不到工單 ${workOrderNo}`).toBeTruthy();

    expect(order.deadline).toBe(due);
    expect(printItem.delivery_date).toBe(due);
    expect(workOrder.print_item.delivery_date).toBe(due);

    // 生產任務管理頁（現場任務池）的印件預計交期欄同步對齊，旗下每一筆任務都要一致
    const floorTasks = MOCK_FLOOR_TASKS.filter((t) => t.work_order_no === workOrderNo);
    expect(floorTasks.length).toBeGreaterThan(0);
    floorTasks.forEach((t) => {
      expect(t.print_item_delivery_date).toBe(due);
    });
  });
});
