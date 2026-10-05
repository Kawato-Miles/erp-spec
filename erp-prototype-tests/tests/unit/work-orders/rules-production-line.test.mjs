// 情境目錄 7.38、7.39、8.17：生產任務的產線欄（帶入、必填、核可後可改）。
// 畫面操作的驗收在 tests/e2e/07-process-planning/production-line.spec.mjs 與
// tests/e2e/08-process-review-deliver/delivery-status.spec.mjs。
//
// 期望值取自 openspec change order-review-gate-invoice-draft-transfer-receipt 的
// work-order 規格差異檔 § 生產任務結構與帶入規則（Scenario 的 THEN）。
//
// 本檔先於實作寫成（tasks 2.8、2.13），下列規則函式尚未存在，跑起來應為紅：
//   work-orders/_lib/production-line.js（新檔）
//     resolveDefaultProductionLine(bomRef, segments) → 產線字串或 null
//       依所引用的主檔項目（process_id／binding_id／material_spec_id）找部件配方的工序段，
//       回傳該段的 production_line；找不到工序段或該段沒有產線時回 null。
//       配方展開、新增任務、工單異動加開、品檢缺口補做、售後補做共用這一支。
//     validateProductionLine(task) → { ok, error }
//       產線空白時 ok 為 false、error 為「產線為必填」；不分廠商類別、不看計畫設備。
//   work-orders/_lib/permissions.js
//     canEditTaskProductionLine(workOrder, task, role, currentUser) → 布林
//       比照 canEditTaskDestination（wiki 生產任務 § 產線欄「比照目的站點」）。
//   work-orders/_lib/store.js
//     updateTaskProductionLine(id, taskId, line, { by }) → { ok, error }
//       不動工單狀態、不要求重新送審，任務歷程追加一筆「產線由 原值 改為 新值」。
//   recipes/_lib/expansion.js
//     planWorkOrders 展開的每一筆任務帶 production_line（取自該工序段）。
import { beforeEach, describe, expect, it } from 'vitest';
import { planWorkOrders } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/recipes/_lib/expansion.js';
import {
  MOCK_PRINT_ITEM_RECIPES,
  MOCK_RECIPES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/recipes/_lib/mock-data.js';
import {
  MOCK_WORK_ORDERS,
  PRODUCTION_LINE_OPTIONS,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import * as permissions from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/permissions.js';
import { useWorkOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/store.js';

const LINE_RULES_PATH =
  '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/production-line.js';

// 新檔尚未建立時整份測試檔仍要跑得起來，逐條顯示紅，故以動態載入、載入失敗回空物件
const loadLineRules = () => import(LINE_RULES_PATH).catch(() => ({}));

// 取規則函式；尚未實作時讓該條測試以明確訊息失敗
const ruleOf = (mod, name) => {
  expect(typeof mod[name], `尚未實作 ${name}`).toBe('function');
  return mod[name];
};

const workOrdersInitial = useWorkOrdersStore.getState().workOrders;
beforeEach(() => {
  useWorkOrdersStore.setState({ workOrders: workOrdersInitial });
});

const store = () => useWorkOrdersStore.getState();
const workOrderOf = (no) => store().workOrders.find((o) => o.work_order_no === no);
const taskOf = (no, name) => workOrderOf(no).tasks.find((t) => t.name === name);

describe('7.38 生產任務產線自部件配方工序段帶入、必填、不隨計畫設備變動', () => {
  it('起點資料：鏈五 WO-2026-0901 的 DM 四色雙面數位產線為數位產線，選項取產線標籤', () => {
    const task = MOCK_WORK_ORDERS.find((o) => o.work_order_no === 'WO-2026-0901').tasks.find(
      (t) => t.name === 'DM 四色雙面印刷',
    );
    expect(task.production_line).toBe('數位產線');
    expect(PRODUCTION_LINE_OPTIONS).toContain('數位產線');
  });

  it('配方 PS-2026-0901 展開出的每一筆任務都帶入所屬工序段的產線', () => {
    const recipe = MOCK_PRINT_ITEM_RECIPES.find((r) => r.recipe_no === 'PS-2026-0901');
    const [draft] = planWorkOrders(recipe.components, recipe.item_segments, 3000, MOCK_RECIPES);
    // 第 1 段同時掛材料與平版印刷，拆成兩筆任務，兩筆都歸數位產線
    expect(draft.tasks.map((t) => [t.task_type, t.production_line])).toEqual([
      ['材料', '數位產線'],
      ['工序', '數位產線'],
      ['工序', '手工產線'],
      ['工序', '裝訂產線'],
    ]);
  });

  it('新增任務時依所選主檔項目找到工序段，產線預設為該段的產線', async () => {
    const resolveDefaultProductionLine = ruleOf(await loadLineRules(), 'resolveDefaultProductionLine');
    const segments = MOCK_RECIPES.find((r) => r.recipe_no === 'BR-2026-0901').segments;
    expect(resolveDefaultProductionLine({ process_id: 'pc-101' }, segments)).toBe('數位產線');
    expect(resolveDefaultProductionLine({ material_spec_id: 'ms-1011' }, segments)).toBe('數位產線');
    expect(resolveDefaultProductionLine({ process_id: 'pc-301' }, segments)).toBe('手工產線');
  });

  it('改計畫設備後產線不跟著變動', () => {
    store().updateProductionTask('wo-2026-0901', 'pt-0901-2', {
      planned_equipment: 'RYOBI 755 五色機',
    });
    const task = taskOf('WO-2026-0901', 'DM 四色雙面印刷');
    expect(task.planned_equipment).toBe('RYOBI 755 五色機');
    expect(task.production_line).toBe('數位產線');
  });

  it('所引用的工序段沒有產線時留空', async () => {
    const resolveDefaultProductionLine = ruleOf(await loadLineRules(), 'resolveDefaultProductionLine');
    // 配方裡找不到這道工序（不從配方帶入的工序任務）
    expect(
      resolveDefaultProductionLine(
        { process_id: 'pc-401' },
        MOCK_RECIPES.find((r) => r.recipe_no === 'BR-2026-0901').segments,
      ),
    ).toBeNull();
    // 找得到工序段、但該段沒有產線
    expect(
      resolveDefaultProductionLine({ process_id: 'pc-401' }, [
        { seq: 1, process_id: 'pc-401', production_line: null },
      ]),
    ).toBeNull();
  });

  it('未選產線就儲存被擋下並提示產線為必填，選定後存得進去', async () => {
    const validateProductionLine = ruleOf(await loadLineRules(), 'validateProductionLine');
    const draft = { task_type: '工序', unit_class: '自有工廠', planned_equipment: '海德堡 SM102 四色機' };
    expect(validateProductionLine({ ...draft, production_line: null })).toEqual({
      ok: false,
      error: '產線為必填',
    });
    expect(validateProductionLine({ ...draft, production_line: '' }).ok).toBe(false);
    expect(validateProductionLine({ ...draft, production_line: '數位產線' })).toEqual({
      ok: true,
      error: null,
    });
  });
});

describe('7.39 外發任務同樣必填產線；異動加開與品檢缺口補做的任務產線同樣自工序段帶入', () => {
  it('外包廠承作、計畫設備留空的任務未選產線同樣被擋下', async () => {
    const validateProductionLine = ruleOf(await loadLineRules(), 'validateProductionLine');
    const outsourced = {
      task_type: '工序',
      unit_class: '外包廠',
      planned_equipment: null,
      bom_ref: { process_group_id: 'pg-04', process_id: 'pc-401' },
    };
    expect(validateProductionLine({ ...outsourced, production_line: null })).toEqual({
      ok: false,
      error: '產線為必填',
    });
    expect(validateProductionLine({ ...outsourced, production_line: '手工產線' }).ok).toBe(true);
  });

  it('產線選項只有六條產線標籤、不含外發加工線；WO-2026-0906 外發的局部上光產線填手工產線', () => {
    expect(PRODUCTION_LINE_OPTIONS).toEqual([
      '壓克力產線',
      '馬克杯產線',
      '杯墊產線',
      '數位產線',
      '裝訂產線',
      '手工產線',
    ]);
    expect(PRODUCTION_LINE_OPTIONS).not.toContain('外發加工線');
    const task = taskOf('WO-2026-0906', '局部上光');
    expect(task.unit_class).toBe('外包廠');
    expect(task.production_line).toBe('手工產線');
  });

  it('工單異動加開的燙金任務產線預設為工序段的裝訂產線', async () => {
    const resolveDefaultProductionLine = ruleOf(await loadLineRules(), 'resolveDefaultProductionLine');
    const segments = [
      { seq: 1, process_id: 'pc-101', material_spec_id: 'ms-1011', production_line: '數位產線' },
      { seq: 2, process_id: 'pc-401', material_spec_id: null, production_line: '裝訂產線' },
    ];
    expect(resolveDefaultProductionLine({ process_group_id: 'pg-04', process_id: 'pc-401' }, segments)).toBe(
      '裝訂產線',
    );
  });

  it('品檢缺口補做的裝訂任務產線預設為工序段的裝訂產線', async () => {
    const resolveDefaultProductionLine = ruleOf(await loadLineRules(), 'resolveDefaultProductionLine');
    const segments = [
      { seq: 1, process_id: 'pc-101', material_spec_id: 'ms-1031', production_line: '數位產線' },
      { seq: 2, process_id: null, binding_id: 'bd-04', production_line: '裝訂產線' },
    ];
    expect(resolveDefaultProductionLine({ binding_id: 'bd-04' }, segments)).toBe('裝訂產線');
  });

  it('補做加開的生產任務沿用原工單那道工序的產線，不留空', () => {
    // 合成資料：現行沒有品檢缺口樣本。原工單的精裝裝訂任務產線為裝訂產線（取自工序段）
    useWorkOrdersStore.setState({
      workOrders: [
        {
          id: 'wo-test-remake',
          work_order_no: 'WO-TEST-REMAKE',
          status: '製作中',
          work_order_type: '一般',
          print_item: { print_item_no: 'PI-TEST-REMAKE', name: '精裝筆記本' },
          adjustments: [],
          tasks: [
            {
              id: 'pt-test-remake-1',
              seq: 1,
              name: '精裝裝訂',
              task_type: '裝訂',
              bom_ref: { binding_id: 'bd-04' },
              unit_class: '自有工廠',
              status: '已完成',
              production_line: '裝訂產線',
              target_qty: 500,
              input_qty: 500,
              good_qty: 450,
              produced_qty: 500,
              count_in_completion: true,
              est_cost: { subtotal: 0, colors: {} },
              history: [],
            },
          ],
        },
      ],
    });
    const result = store().startRemakeProduction({
      rows: [{ work_order_id: 'wo-test-remake', base_task_id: 'pt-test-remake-1', qty: 50 }],
      sources: { qc_record_id: 'qc-test-remake', disposition_id: 'dp-test-remake' },
      reason: '品檢缺口 50',
      initiatedBy: '周建宏',
    });
    expect(result.ok).toBe(true);
    const remake = workOrderOf('WO-TEST-REMAKE').tasks.find((t) => t.id !== 'pt-test-remake-1');
    expect(remake.status).toBe('待處理');
    expect(remake.production_line).toBe('裝訂產線');
  });
});

describe('8.17 製程核可後印務主管或工單負責人改產線，不必收回或重審，歷程留原值與新值', () => {
  it('印務主管可改核可後工單的產線；負責印務可改自己的工單；非負責印務不可改；已作廢任務不可改', () => {
    const canEdit = permissions.canEditTaskProductionLine;
    expect(typeof canEdit, '尚未實作 canEditTaskProductionLine').toBe('function');
    const wo0910 = workOrderOf('WO-2026-0910');
    const wo0908 = workOrderOf('WO-2026-0908');
    const wo0909 = workOrderOf('WO-2026-0909');
    expect(canEdit(wo0910, taskOf('WO-2026-0910', '貼紙四色數位印刷'), 'print_manager', '吳國豪')).toBe(true);
    expect(canEdit(wo0908, taskOf('WO-2026-0908', '名片雙面四色印刷'), 'print_officer', '周建宏')).toBe(true);
    expect(canEdit(wo0908, taskOf('WO-2026-0908', '名片雙面四色印刷'), 'print_officer', '蔡明修')).toBe(false);
    expect(canEdit(wo0909, taskOf('WO-2026-0909', 'DM 對摺加工'), 'print_manager', '吳國豪')).toBe(false);
  });

  it('印務主管吳國豪改 WO-2026-0910 貼紙四色數位印刷的產線：直接儲存、工單維持製程審核完成、歷程記原值與新值', () => {
    expect(typeof store().updateTaskProductionLine, '尚未實作 updateTaskProductionLine').toBe('function');
    const result = store().updateTaskProductionLine('wo-2026-0910', 'pt-0910-2', '手工產線', {
      by: '吳國豪',
    });
    expect(result.ok).toBe(true);
    expect(workOrderOf('WO-2026-0910').status).toBe('製程審核完成');
    const task = taskOf('WO-2026-0910', '貼紙四色數位印刷');
    expect(task.production_line).toBe('手工產線');
    const last = task.history.at(-1);
    expect(last.actor).toBe('吳國豪');
    expect(last.at).toBeTruthy();
    expect(last.event).toContain('產線由 數位產線 改為 手工產線');
  });

  it('負責印務周建宏改 WO-2026-0908 名片雙面四色印刷的產線：同樣不要求重審、歷程記修改人', () => {
    expect(typeof store().updateTaskProductionLine, '尚未實作 updateTaskProductionLine').toBe('function');
    const result = store().updateTaskProductionLine('wo-2026-0908', 'pt-0908-2', '手工產線', {
      by: '周建宏',
    });
    expect(result.ok).toBe(true);
    expect(workOrderOf('WO-2026-0908').status).toBe('製程審核完成');
    const last = taskOf('WO-2026-0908', '名片雙面四色印刷').history.at(-1);
    expect(last.actor).toBe('周建宏');
    expect(last.event).toContain('產線由 數位產線 改為 手工產線');
  });
});
