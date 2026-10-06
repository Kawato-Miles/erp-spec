// 情境目錄 7.40「生產任務的單位取 BOM 主檔項目的單位欄，只顯示、不換算」、
// 8.18「加工廠任務交付後照常推導已交付、已接收」。
// 期望值取自 openspec change production-dispatch-report-transfer-convergence
// work-order delta § 生產任務單位呈現、§ 生產任務交付時間與交付狀態 的 THEN；
// 規則正本 wiki 材料主檔／工序主檔／裝訂主檔單位欄、數量換算規則、生產任務交付狀態。
//
// 契約（等 tasks 6.1、6.5 實作）：
//   work-orders/_lib/bom-master-mock.js 的 resolveTaskUnit(task) 取所引用主檔項目的 unit 欄，
//     不依計價方法或任務類型推導（主檔項目的 unit 由 mock 提供，見 MOCK-DATA-CHAIN § 生產任務的單位）。
//   work-orders/_lib/delivery-status.js 的 deriveDeliveryStatus(task, floorTasks)：
//     加工廠與自有工廠同樣推導未交付、已交付、已接收；外包廠、中國廠商與終態顯示「－」（null）。
//   work-orders/_lib/deliver-actions.js 的 floorDeliverableTasks(tasks)：自有工廠與加工廠進現場任務池。
import { describe, expect, it } from 'vitest';
import {
  BINDINGS,
  findProcess,
  MATERIAL_SPECS,
  PROCESSES,
  resolveTaskUnit,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/bom-master-mock.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
import { MOCK_FLOOR_TASKS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/production-floor/_lib/mock-data.js';
import { floorDeliverableTasks } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/deliver-actions.js';

const DELIVERY_RULES_PATH =
  '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/delivery-status.js';
const loadDeliveryRules = () => import(DELIVERY_RULES_PATH).catch(() => ({}));

const workOrderOf = (no) => MOCK_WORK_ORDERS.find((o) => o.work_order_no === no);
const taskOf = (no, name) => workOrderOf(no).tasks.find((t) => t.name === name);
const masterUnitOf = (task) => {
  const ref = task?.bom_ref ?? {};
  return (
    MATERIAL_SPECS.find((s) => s.id === ref.material_spec_id)?.unit ??
    PROCESSES.find((p) => p.id === ref.process_id)?.unit ??
    BINDINGS.find((b) => b.id === ref.binding_id)?.unit ??
    null
  );
};

describe('7.40 生產任務的單位取 BOM 主檔項目的單位欄，只顯示、不換算', () => {
  it('主檔每一個材料規格、工序、裝訂項目都設了單位', () => {
    [...MATERIAL_SPECS, ...PROCESSES, ...BINDINGS].forEach((item) =>
      expect(item.unit, item.id).toBeTruthy(),
    );
  });

  it('三件配套裝袋引用的手工包裝，主檔單位設為「個」，任務單位顯示「個」（不再依時間計價推成張）', () => {
    const task = taskOf('WO-2026-0812', '三件配套裝袋');
    expect(findProcess(task.bom_ref.process_id).unit).toBe('個');
    expect(resolveTaskUnit(task)).toBe('個');
  });

  it('每一筆工單任務的單位都等於所引用主檔項目的單位欄', () => {
    MOCK_WORK_ORDERS.flatMap((o) => o.tasks)
      .filter((t) => masterUnitOf(t))
      .forEach((t) => expect(resolveTaskUnit(t), `${t.id} ${t.name}`).toBe(masterUnitOf(t)));
  });

  it('主檔改了單位，任務跟著顯示新單位；任務本身不設單位欄', () => {
    const task = taskOf('WO-2026-0812', '三件配套裝袋');
    expect('unit' in task).toBe(false);
    const process = findProcess(task.bom_ref.process_id);
    const original = process.unit;
    try {
      process.unit = '袋';
      expect(resolveTaskUnit(task)).toBe('袋');
    } finally {
      process.unit = original;
    }
  });
});

describe('8.18 加工廠任務交付後照常推導已交付、已接收', () => {
  it('交付產線時加工廠任務照常進現場任務池；外包廠與中國廠商不進', () => {
    const tasks = [
      { id: 'a', unit_class: '自有工廠' },
      { id: 'b', unit_class: '加工廠' },
      { id: 'c', unit_class: '外包廠' },
      { id: 'd', unit_class: '中國廠商' },
    ];
    expect(floorDeliverableTasks(tasks).map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('WO-2026-0812 的證書局部上光（加工廠）已交付、已接收：交付狀態為已接收，不顯示「－」', async () => {
    const { deriveDeliveryStatus } = await loadDeliveryRules();
    expect(typeof deriveDeliveryStatus).toBe('function');
    const task = taskOf('WO-2026-0812', '證書局部上光');
    expect(task.unit_class).toBe('加工廠');
    expect(deriveDeliveryStatus(task, MOCK_FLOOR_TASKS)).toBe('已接收');
  });

  it('加工廠任務未交付為未交付、交付後未接收為已交付', async () => {
    const { deriveDeliveryStatus } = await loadDeliveryRules();
    const task = { id: 'pt-test-plant', unit_class: '加工廠', status: '待處理', delivered_at: null };
    expect(deriveDeliveryStatus(task, [])).toBe('未交付');
    expect(deriveDeliveryStatus({ ...task, delivered_at: '2026-10-06 09:00' }, [])).toBe('已交付');
  });

  it('外包廠任務交付後仍顯示「－」', async () => {
    const { deriveDeliveryStatus } = await loadDeliveryRules();
    const task = { id: 'pt-test-out', unit_class: '外包廠', status: '待處理', delivered_at: '2026-10-06 09:00' };
    expect(deriveDeliveryStatus(task, [])).toBeNull();
  });
});
