// 情境目錄 13.1：派單推進與回廠點收登記不改生產任務狀態，印務報工達標才完成。
//
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的
// production-execution 規格差異檔 § 生產任務狀態轉換（派單推進不改動生產任務狀態、
// 點收登記不令任務完成、印務報工後完成）與 work-order 規格差異檔 § 生產任務結構與帶入規則
//（外發任務產出數量取報工累計）各 Scenario 的 THEN。
//
// 合成資料的理由：現行派單資料為空陣列（dispatch-orders/_lib/mock-data.js），沒有外發樣本。
// 報工走現場模組唯一寫入路徑 submitWorkReport；外發任務不在現場任務池，累計寫回工單模組那一筆。
// 本檔只動 tests/unit/production-floor/ 下以 13-1 開頭的這一份。
import { beforeEach, describe, expect, it } from 'vitest';
import { useDispatchOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/dispatch-orders/_lib/store.js';
import { REPORT_CHANNELS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/permissions.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

const DISPATCH_NO = 'DO-TEST-1301';

// 一筆中國廠商生產任務（待處理、已發稿、目標 1,500）
const outsourcedTask = (id, name) => ({
  id,
  seq: 1,
  name,
  task_type: '工序',
  unit_class: '中國廠商',
  vendor: '東莞盛達彩印包裝廠',
  status: '待處理',
  dispatch_no: DISPATCH_NO,
  production_line: '外發加工線',
  destination_station_key: '品檢站',
  needs_transfer: true,
  count_in_completion: true,
  planned_qty: 1500,
  spoilage_qty: 0,
  target_qty: 1500,
  input_qty: 0,
  good_qty: 0,
  produced_qty: 0,
  received_qty: 0,
  delivered: true,
  delivered_at: '2026-09-01 10:00',
  delivered_by: '周建宏',
  history: [],
});

const seed = () => {
  useWorkOrdersStore.setState({
    workOrders: [
      {
        id: 'wo-test-1301',
        work_order_no: 'WO-TEST-1301',
        status: '工單已交付',
        work_order_type: '一般',
        owner: '周建宏',
        shared_members: [],
        qty_per_print_item: 1,
        print_item: { print_item_no: 'PI-TEST-1301', name: '外發盒型' },
        adjustments: [],
        tasks: [
          outsourcedTask('pt-test-1301-a', '盒型印刷（整批回台）'),
          { ...outsourcedTask('pt-test-1301-b', '盒型印刷（分兩批回台）'), seq: 2 },
        ],
      },
    ],
  });
  useDispatchOrdersStore.setState({
    dispatchOrders: [
      {
        id: 'do-test-1301',
        dispatch_no: DISPATCH_NO,
        work_order_no: 'WO-TEST-1301',
        vendor: '東莞盛達彩印包裝廠',
        status: '已發稿',
        details: [
          { task_id: 'pt-test-1301-a', task_name: '盒型印刷（整批回台）' },
          { task_id: 'pt-test-1301-b', task_name: '盒型印刷（分兩批回台）' },
        ],
        receipts: [],
        timeline: [],
      },
    ],
  });
  useProductionFloorStore.setState({ tasks: [], workReports: [], transferTickets: [] });
};

beforeEach(seed);

const taskOf = (id) =>
  useWorkOrdersStore
    .getState()
    .workOrders.find((o) => o.id === 'wo-test-1301')
    .tasks.find((t) => t.id === id);

// 印務在工單詳情頁代登記外發任務的報工（良品等於生產數量、無不良）
const reportByOfficer = (taskId, qty) =>
  useProductionFloorStore.getState().submitWorkReport(taskId, {
    input_qty: qty,
    good_qty: qty,
    defect_qty: 0,
    photos: ['外發報工.jpg'], // 報工至少附一張現場照片（資料層一併把關）
    channel: REPORT_CHANNELS.PRINT_OFFICER_WORK_ORDER,
    reporter: '周建宏',
  });

describe('13.1 派單推進與回廠點收登記不改生產任務狀態，印務報工達標才完成', () => {
  it('派單狀態推進至製作中（整批）後，生產任務維持待處理，系統不寫入任何在途狀態', () => {
    useDispatchOrdersStore.getState().updateStatus('do-test-1301', '製作中（整批）', '周建宏');
    expect(useDispatchOrdersStore.getState().dispatchOrders[0].status).toBe('製作中（整批）');
    const task = taskOf('pt-test-1301-a');
    expect(task.status).toBe('待處理');
    expect(task.history).toEqual([]);
  });

  it('揀貨人員完成回廠點收登記 1,500、印務尚未報工時，任務仍為待處理、不自動轉已完成', () => {
    useDispatchOrdersStore.getState().registerReceipt('do-test-1301', {
      counted: { '盒型印刷（整批回台）': 1500 },
      note: '',
      by: '范姜宏',
    });
    useWorkOrdersStore.getState().setOutsourceReceivedQty({ 'pt-test-1301-a': 1500 });
    const task = taskOf('pt-test-1301-a');
    expect(task.received_qty).toBe(1500);
    expect(task.status).toBe('待處理');
    expect(task.input_qty).toBe(0);
  });

  it('印務對該任務報工生產數量 1,500 後，累計達目標轉已完成', () => {
    useWorkOrdersStore.getState().setOutsourceReceivedQty({ 'pt-test-1301-a': 1500 });
    const result = reportByOfficer('pt-test-1301-a', 1500);
    expect(result).not.toBeNull();
    const task = taskOf('pt-test-1301-a');
    expect(task.input_qty).toBe(1500);
    expect(task.status).toBe('已完成');
  });

  it('分兩批回台：第一批點收 900、印務報工 900 後為製作中、生產數量累計 900', () => {
    useWorkOrdersStore.getState().setOutsourceReceivedQty({ 'pt-test-1301-b': 900 });
    reportByOfficer('pt-test-1301-b', 900);
    const task = taskOf('pt-test-1301-b');
    expect(task.received_qty).toBe(900);
    expect(task.input_qty).toBe(900);
    expect(task.status).toBe('製作中');
  });

  it('分兩批回台：第二批點收 600、印務補報工 600 後累計 1,500，轉已完成', () => {
    useWorkOrdersStore.getState().setOutsourceReceivedQty({ 'pt-test-1301-b': 900 });
    reportByOfficer('pt-test-1301-b', 900);
    useWorkOrdersStore.getState().setOutsourceReceivedQty({ 'pt-test-1301-b': 1500 });
    // 點收數量是報工的對照憑據：點收補齊、還沒補報工之前，任務不因點收而完成
    expect(taskOf('pt-test-1301-b').status).not.toBe('已完成');
    reportByOfficer('pt-test-1301-b', 600);
    const task = taskOf('pt-test-1301-b');
    expect(task.input_qty).toBe(1500);
    expect(task.status).toBe('已完成');
  });
});
