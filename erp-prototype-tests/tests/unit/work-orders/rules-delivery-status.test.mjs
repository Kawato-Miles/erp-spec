// 情境目錄 8.3、8.15、8.16、9.2：生產任務的交付時間與交付狀態推導，以及工單「工單已交付」的判定。
// 畫面操作的驗收在 tests/e2e/08-process-review-deliver/ 與 tests/e2e/09-planner-dispatch/。
//
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的
// work-order 規格差異檔 § 生產任務交付時間與交付狀態（Scenario 的 THEN）；
// 推導條件正本為 wiki 生產任務交付狀態（依序判定：「－」→ 已接收 → 已交付 → 未交付）。
//
// 本檔先於實作寫成（tasks 2.8、2.13），下列函式尚未存在，跑起來應為紅：
//   work-orders/_lib/delivery-status.js（新檔）
//     deriveDeliveryStatus(task, floorTasks = []) → '未交付'｜'已交付'｜'已接收'｜null
//       null 代表畫面顯示「－」（廠商類別為外包廠或中國廠商，或生產任務狀態屬終態；加工廠與自有工廠
//       同樣推導，見 8.18 task-unit-and-plant-delivery.test.mjs，2026-10-06 拍板 D3）。
//       接收工作取現場任務池那一筆的 received_confirmed_at（以 source_task_id 或 id 對回）。
//     isWorkOrderFullyDelivered(workOrder) → 布林：旗下有效任務（不含已作廢、報廢）的交付時間皆有值。
//   work-orders/_lib/store.js
//     deliverTasks(id, taskIds, { by }) 每筆寫入 delivered_at 與 delivered_by；有效任務到齊才轉工單已交付。
//     deliverAllTasks(id, { by }) 只對有效任務寫入交付時間與操作人，到齊即轉工單已交付。
//
// 已完成屬生產任務終態：依 wiki 生產任務交付狀態推導條件第 1 條，交付狀態顯示「－」（null）。
import { beforeEach, describe, expect, it } from 'vitest';
import { MOCK_FLOOR_TASKS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { useProductionFloorStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/store.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

const DELIVERY_RULES_PATH =
  '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/delivery-status.js';

// 新檔尚未建立時整份測試檔仍要跑得起來、逐條顯示紅，故以動態載入、載入失敗回空物件
const loadDeliveryRules = () => import(DELIVERY_RULES_PATH).catch(() => ({}));
const ruleOf = (mod, name) => {
  expect(typeof mod[name], `尚未實作 ${name}`).toBe('function');
  return mod[name];
};

const workOrdersInitial = useWorkOrdersStore.getState().workOrders;
const floorInitial = {
  tasks: useProductionFloorStore.getState().tasks,
  transferTickets: useProductionFloorStore.getState().transferTickets,
  workReports: useProductionFloorStore.getState().workReports,
};
beforeEach(() => {
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
  useProductionFloorStore.setState(floorInitial);
});

const store = () => useWorkOrdersStore.getState();
const floor = () => useProductionFloorStore.getState();
const workOrderOf = (no) => store().workOrders.find((o) => o.work_order_no === no);
const taskOf = (no, name) => workOrderOf(no).tasks.find((t) => t.name === name);

describe('8.3 印務逐筆把生產任務交付產線（原編號 7）', () => {
  it('每交付一筆，該任務寫入交付時間與操作人，交付狀態由未交付轉已交付；部分交付時工單狀態不變', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    expect(deriveDeliveryStatus(taskOf('WO-2026-0908', '一級卡 300g 名片八開'))).toBe('未交付');

    store().deliverTasks('wo-2026-0908', ['pt-0908-1'], { by: '周建宏' });
    const task = taskOf('WO-2026-0908', '一級卡 300g 名片八開');
    expect(task.delivered_at).toBeTruthy();
    expect(task.delivered_by).toBe('周建宏');
    expect(deriveDeliveryStatus(task)).toBe('已交付');
    expect(workOrderOf('WO-2026-0908').status).toBe('製程審核完成');
  });
});

describe('8.15 工單詳情任務列表三個狀態欄；外發任務交付後交付狀態顯示「－」', () => {
  it('WO-2026-0812 已交付、生管已接收、尚未收尾的六筆任務交付狀態皆為已接收', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    const names = ['證書裁切', '信封四色印刷', '信封裁切', '內卡四色印刷', '內卡裁切', '三件配套裝袋'];
    for (const name of names) {
      expect(deriveDeliveryStatus(taskOf('WO-2026-0812', name), MOCK_FLOOR_TASKS), name).toBe('已接收');
    }
  });

  it('WO-2026-0812 已完成的雪銅紙 150g 菊全與證書四色印刷屬終態，交付狀態顯示「－」', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    for (const name of ['雪銅紙 150g 菊全', '證書四色印刷']) {
      const task = taskOf('WO-2026-0812', name);
      expect(task.status, name).toBe('已完成');
      expect(deriveDeliveryStatus(task, MOCK_FLOOR_TASKS), name).toBeNull();
    }
  });

  it('WO-2026-0906 的局部上光（外包廠任務）顯示「－」，雪銅紙備料顯示未交付', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    expect(deriveDeliveryStatus(taskOf('WO-2026-0906', '局部上光'), MOCK_FLOOR_TASKS)).toBeNull();
    expect(deriveDeliveryStatus(taskOf('WO-2026-0906', '雪銅紙 150g 菊全'), MOCK_FLOOR_TASKS)).toBe('未交付');
  });

  it('WO-2026-0909 已作廢的 DM 對摺加工顯示「－」', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    expect(deriveDeliveryStatus(taskOf('WO-2026-0909', 'DM 對摺加工'), MOCK_FLOOR_TASKS)).toBeNull();
  });

  it('交付狀態已接收的自有工廠任務因工單異動轉報廢後顯示「－」', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    const received = {
      id: 'pt-test-scrap',
      unit_class: '自有工廠',
      status: '製作中',
      delivered_at: '2026-09-01 10:00',
      delivered_by: '周建宏',
    };
    const floorTasks = [
      { id: 'pt-test-scrap', received_confirmed_by: '許文傑', received_confirmed_at: '2026-09-01 11:00' },
    ];
    expect(deriveDeliveryStatus(received, floorTasks)).toBe('已接收');
    expect(deriveDeliveryStatus({ ...received, status: '報廢' }, floorTasks)).toBeNull();
  });

  it('交付時間有值、接收工作無值時為已交付；現場另配 id 時以來源任務對回接收工作', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    const task = { id: 'pt-test-1', unit_class: '自有工廠', status: '待處理', delivered_at: '2026-09-01 10:00' };
    expect(deriveDeliveryStatus(task, [])).toBe('已交付');
    expect(
      deriveDeliveryStatus(task, [
        { id: 'wo-test-floor-1', source_task_id: 'pt-test-1', received_confirmed_at: '2026-09-01 11:00' },
      ]),
    ).toBe('已接收');
  });

  it('中國廠商任務交付後寫入交付時間，交付狀態仍顯示「－」', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    // 合成資料：外包派單暫不納入畫面情境，現行派單資料為空陣列
    useWorkOrdersStore.setState({
      workOrders: [
        {
          id: 'wo-test-cn',
          work_order_no: 'WO-TEST-CN',
          status: '製程審核完成',
          print_item: { print_item_no: 'PI-TEST-CN', name: '外發樣本' },
          tasks: [
            {
              id: 'pt-test-cn-1',
              seq: 1,
              name: '盒型印刷',
              unit_class: '中國廠商',
              status: '待處理',
              dispatch_no: 'DO-TEST-CN',
              production_line: '外發加工線',
              delivered: false,
              delivered_at: null,
            },
          ],
        },
      ],
    });
    store().deliverTasks('wo-test-cn', ['pt-test-cn-1'], { by: '周建宏' });
    const task = workOrderOf('WO-TEST-CN').tasks[0];
    expect(task.delivered_at).toBeTruthy();
    expect(task.delivered_by).toBe('周建宏');
    expect(deriveDeliveryStatus(task, [])).toBeNull();
  });
});

describe('8.16 印務在工單一次交付全部生產任務，每筆寫入交付時間、工單轉工單已交付；逐筆交付未到齊時工單停在製程審核完成', () => {
  it('WO-2026-0909 全部交付：三筆有效任務各寫入交付時間與操作人、轉已交付；已作廢那筆不寫入；工單推進至工單已交付', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    expect(typeof store().deliverAllTasks, '尚未實作 deliverAllTasks').toBe('function');
    store().deliverAllTasks('wo-2026-0909', { by: '周建宏' });

    for (const name of ['雪銅紙 150g 菊全', 'DM 雙面四色印刷', 'DM 裁切成品']) {
      const task = taskOf('WO-2026-0909', name);
      expect(task.delivered_at, name).toBeTruthy();
      expect(task.delivered_by, name).toBe('周建宏');
      expect(deriveDeliveryStatus(task), name).toBe('已交付');
    }
    const voided = taskOf('WO-2026-0909', 'DM 對摺加工');
    expect(voided.delivered_at).toBeNull();
    expect(deriveDeliveryStatus(voided)).toBeNull();
    expect(workOrderOf('WO-2026-0909').status).toBe('工單已交付');
  });

  it('WO-2026-0909 逐筆交完三筆有效任務：已作廢那筆不列入判定，工單同樣推進至工單已交付', () => {
    store().deliverTasks('wo-2026-0909', ['pt-0909-1', 'pt-0909-2', 'pt-0909-3'], { by: '周建宏' });
    expect(workOrderOf('WO-2026-0909').status).toBe('工單已交付');
  });

  it('WO-2026-0908 只交一筆時工單維持製程審核完成，其餘兩筆交完後才推進', async () => {
    const isWorkOrderFullyDelivered = ruleOf(await loadDeliveryRules(), 'isWorkOrderFullyDelivered');
    store().deliverTasks('wo-2026-0908', ['pt-0908-1'], { by: '周建宏' });
    expect(taskOf('WO-2026-0908', '一級卡 300g 名片八開').delivered_by).toBe('周建宏');
    expect(isWorkOrderFullyDelivered(workOrderOf('WO-2026-0908'))).toBe(false);
    expect(workOrderOf('WO-2026-0908').status).toBe('製程審核完成');

    store().deliverTasks('wo-2026-0908', ['pt-0908-2', 'pt-0908-3'], { by: '周建宏' });
    expect(isWorkOrderFullyDelivered(workOrderOf('WO-2026-0908'))).toBe(true);
    expect(workOrderOf('WO-2026-0908').status).toBe('工單已交付');
  });

  it('有效任務的判定排除已作廢與報廢', async () => {
    const isWorkOrderFullyDelivered = ruleOf(await loadDeliveryRules(), 'isWorkOrderFullyDelivered');
    const order = {
      status: '製程審核完成',
      tasks: [
        { id: 'a', status: '待處理', delivered_at: '2026-09-01 10:00' },
        { id: 'b', status: '已作廢', delivered_at: null },
        { id: 'c', status: '報廢', delivered_at: null },
      ],
    };
    expect(isWorkOrderFullyDelivered(order)).toBe(true);
    expect(
      isWorkOrderFullyDelivered({ ...order, tasks: [...order.tasks, { id: 'd', status: '待處理', delivered_at: null }] }),
    ).toBe(false);
  });
});

describe('9.2 生管對已交付產線的任務按「接收工作」（原編號 14）', () => {
  it('生管接收 WO-2026-0815 的牛皮紙備料後，交付狀態由已交付轉已接收，生產任務狀態仍為待處理', async () => {
    const deriveDeliveryStatus = ruleOf(await loadDeliveryRules(), 'deriveDeliveryStatus');
    const task = taskOf('WO-2026-0815', '牛皮紙 150g 菊全');
    expect(deriveDeliveryStatus(task, floor().tasks)).toBe('已交付');

    floor().confirmTaskReceipt(['pt-0815-1'], '許文傑');
    expect(deriveDeliveryStatus(task, floor().tasks)).toBe('已接收');
    expect(floor().tasks.find((t) => t.id === 'pt-0815-1').status).toBe('待處理');
    // 其餘尚未接收的三筆仍是已交付
    expect(deriveDeliveryStatus(taskOf('WO-2026-0815', '五色印刷'), floor().tasks)).toBe('已交付');
  });
});
