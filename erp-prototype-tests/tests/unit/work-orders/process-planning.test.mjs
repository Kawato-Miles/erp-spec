// 情境目錄第七章「印務登打製程與備料規格選擇」中帶明確算式或可判定規則的條目。
// 畫面操作的驗收在 tests/e2e/07-process-planning/。
import { describe, it, expect } from 'vitest';
import {
  deriveTargetQty,
  validateTaskQtys,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/target-qty.js';
import { estimateTaskCost } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/estimate-cost.js';
import { resolvePlannedEndDate } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/due-date-sync.js';
import {
  applyTaskOrder,
  nextTaskSortOrder,
  sortTasksForDisplay,
  taskListVersion,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/task-order.js';
import {
  bomRowsOf,
  bomSidebarItems,
  filterBomRows,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/bom-picker-rows.js';

// 情境的錨數字：鏈五 WO-2026-0901 新增一筆平版印刷，預計生產 20,000、放損率 3%（放損預填 600）
const PLANNED = 20000;
const SPOILAGE_DEFAULT = 600;
const SPOILAGE_EDITED = 800;

describe('7.6 投入計畫拆成預計生產與放損兩欄，目標數量唯讀加總（原編號 156）', () => {
  it('目標數量等於預計生產加放損，改放損即時重算', () => {
    expect(deriveTargetQty({ planned_qty: PLANNED, spoilage_qty: SPOILAGE_DEFAULT })).toBe(20600);
    expect(deriveTargetQty({ planned_qty: PLANNED, spoilage_qty: SPOILAGE_EDITED })).toBe(20800);
  });

  it('目標數量沒有自己的輸入：兩個成分欄留空時加總為零，防呆掛在成分欄上', () => {
    expect(deriveTargetQty({})).toBe(0);
    expect(validateTaskQtys({ planned_qty: null, spoilage_qty: null }).ok).toBe(false);
    expect(validateTaskQtys({ planned_qty: PLANNED, spoilage_qty: SPOILAGE_EDITED }).ok).toBe(true);
  });
});

describe('7.7 色數依印刷類工序旗標顯示，五個色別各自計數（原編號 157）', () => {
  const offsetTask = (patch) => ({
    task_type: '工序',
    bom_ref: { process_id: 'pc-101' },
    target_qty: 20800,
    colors: { single_black: 0, cmyk: 0, pantone: 0, metallic: 0, metal_only: 0 },
    ...patch,
  });

  it('選定自有平版機台後，設備費為開機費加各色貢獻（特別色 1 加獨立印 1 為 7,400）', () => {
    const cost = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: { single_black: 0, cmyk: 0, pantone: 1, metallic: 0, metal_only: 1 },
      }),
    );
    // 開機費 3,200 ＋ 1,200×1.3（Pantone）＋ 1,200×2.2（獨立印）
    expect(cost.equipment).toBe(3200 + 1200 * 1.3 + 1200 * 2.2);
    expect(cost.equipment).toBe(7400);
  });

  it('未選我方機台時色數為純記錄，設備費為 0', () => {
    const cost = estimateTaskCost(
      offsetTask({
        planned_equipment: null,
        colors: { single_black: 0, cmyk: 0, pantone: 1, metallic: 0, metal_only: 1 },
      }),
    );
    expect(cost.equipment).toBe(0);
  });

  it('五個色別各自計數、相加不擇一', () => {
    const one = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: { single_black: 0, cmyk: 1, pantone: 0, metallic: 0, metal_only: 0 },
      }),
    );
    const two = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: { single_black: 1, cmyk: 1, pantone: 0, metallic: 0, metal_only: 0 },
      }),
    );
    // 單黑價 820、彩色價 1,200（令數 42 落第二階）：兩色別各自計數相加
    expect(one.equipment).toBe(3200 + 1200);
    expect(two.equipment).toBe(3200 + 1200 + 820);
  });
});

describe('7.8 印刷任務成本等於工序費加設備費（原編號 158）', () => {
  const task = {
    task_type: '工序',
    bom_ref: { process_id: 'pc-101' },
    target_qty: 20800,
    planned_equipment: '海德堡 SM102 四色機',
    colors: { single_black: 0, cmyk: 1, pantone: 0, metallic: 0, metal_only: 0 },
  };

  it('工序費與設備費各自並列相加，不二選一', () => {
    const cost = estimateTaskCost(task);
    expect(cost.process).toBeGreaterThan(0);
    expect(cost.equipment).toBeGreaterThan(0);
    expect(cost.material).toBe(0);
    expect(cost.binding).toBe(0);
  });

  it('計價數量一律取該任務自己的目標數量，任務之間不互相取數', () => {
    const half = estimateTaskCost({ ...task, target_qty: 10400 });
    const full = estimateTaskCost(task);
    expect(half.process).not.toBe(full.process);
    // 目標數量為 0 時工序費照實回 0，不向其他任務借數
    expect(estimateTaskCost({ ...task, target_qty: 0 }).process).toBe(0);
  });
});

describe('7.10 排序走側板，一次生效；清單被動過就擋下（原編號 162）', () => {
  const tasks = [
    { id: 't1', sort_order: 1 },
    { id: 't2', sort_order: 2 },
    { id: 't3', sort_order: 3 },
  ];

  it('按確定時清單依側板新序寫入', () => {
    const opened = taskListVersion(tasks);
    const result = applyTaskOrder(tasks, ['t3', 't1', 't2'], { openedVersion: opened });
    expect(result.ok).toBe(true);
    expect(sortTasksForDisplay(result.tasks).map((t) => t.id)).toEqual(['t3', 't1', 't2']);
  });

  it('排序期間清單被加開時擋下，順序不寫入', () => {
    const opened = taskListVersion(tasks);
    const afterInsert = [...tasks, { id: 't4', sort_order: 4 }];
    const result = applyTaskOrder(afterInsert, ['t3', 't1', 't2'], { openedVersion: opened });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('清單已變更');
    expect(result.tasks).toBe(afterInsert);
  });
});

describe('7.11 新增生產任務一開就選主檔，新任務排在最後（原編號 163）', () => {
  it('新任務的排序值為現有最大值加一，既有順序不變', () => {
    const tasks = [
      { id: 't1', sort_order: 1 },
      { id: 't2', sort_order: 2 },
    ];
    expect(nextTaskSortOrder(tasks)).toBe(3);
    const added = [...tasks, { id: 't3', sort_order: nextTaskSortOrder(tasks) }];
    expect(sortTasksForDisplay(added).map((t) => t.id)).toEqual(['t1', 't2', 't3']);
  });
});

describe('7.12 預計完成日純手填，工單預計完工日取最大值（原編號 164）', () => {
  it('全部任務未填時工單預計完工日為空', () => {
    expect(resolvePlannedEndDate({ tasks: [{ planned_end_date: null }] })).toBeNull();
  });

  it('填了之後取已填者的最大值，已作廢任務不參與', () => {
    const workOrder = {
      tasks: [
        { planned_end_date: '2026-09-12', status: '待處理' },
        { planned_end_date: '2026-09-18', status: '待處理' },
        { planned_end_date: '2026-09-30', status: '已作廢' },
        { planned_end_date: null, status: '待處理' },
      ],
    };
    expect(resolvePlannedEndDate(workOrder)).toBe('2026-09-18');
  });

  it('在工單資訊直接填過值時以人填的為準', () => {
    expect(
      resolvePlannedEndDate({
        planned_end_date: '2026-09-25',
        tasks: [{ planned_end_date: '2026-09-18', status: '待處理' }],
      }),
    ).toBe('2026-09-25');
  });
});

describe('7.15 選擇器一列等於一個計價層級的選項（原編號 175）', () => {
  const materialRows = bomRowsOf('材料');
  const bindingRows = bomRowsOf('裝訂');

  it('同一種紙的兩個磅數各一列', () => {
    const rows = materialRows.filter((r) => r.name === '雪銅紙');
    expect(rows.map((r) => r.spec)).toEqual(['150g', '200g']);
  });

  it('同一種輸出材的三個面積區間各一列', () => {
    const rows = materialRows.filter((r) => r.name === '珠光合成紙');
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.option)).toEqual([
      '0.5平方公尺以下',
      '0.5 至 1平方公尺',
      '1平方公尺以上',
    ]);
  });

  it('騎馬釘的四種頁數各一列', () => {
    const rows = bindingRows.filter((r) => r.name === '騎馬釘裝訂');
    expect(rows.map((r) => r.option)).toEqual(['8 頁', '16 頁', '24 頁', '32 頁']);
  });

  it('每一列都帶計價大類與計價子類兩欄', () => {
    expect(materialRows.every((r) => r.pricingCategory && r.pricingMethod)).toBe(true);
  });

  it('裝訂頁籤沒有左側分類側欄', () => {
    expect(bomSidebarItems('裝訂')).toEqual([]);
    expect(bomSidebarItems('材料').length).toBeGreaterThan(0);
  });

  it('材料型任務名稱等於材料名加規格名加備料名稱', () => {
    const row = materialRows.find((r) => r.name === '一級卡' && r.prepName === '名片八開');
    expect(row.patch.name).toBe('一級卡 300g 名片八開');
  });
});

describe('7.16 選擇器的篩選：分類側欄、名稱、品牌與廠商（原編號 176）', () => {
  const materialRows = bomRowsOf('材料');
  const processRows = bomRowsOf('工序');
  const bindingRows = bomRowsOf('裝訂');

  it('點群組只剩該群組的列', () => {
    const groupId = materialRows.find((r) => r.groupName === '輸出材').groupId;
    const rows = filterBomRows(materialRows, { groupId });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.groupName === '輸出材')).toBe(true);
  });

  it('點材料名稱只剩該材料的列', () => {
    const parentId = materialRows.find((r) => r.name === '珠光合成紙').parentId;
    const rows = filterBomRows(materialRows, { parentId });
    expect(rows.every((r) => r.name === '珠光合成紙')).toBe(true);
  });

  it('品牌篩到該品牌的列', () => {
    const rows = filterBomRows(materialRows, { brand: '南亞' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.brand === '南亞')).toBe(true);
  });

  it('名稱關鍵字同時比對名稱、規格、備料、供應商原料與品牌', () => {
    expect(filterBomRows(materialRows, { search: '珠光' }).length).toBeGreaterThan(0);
    expect(filterBomRows(materialRows, { search: '300g' }).length).toBeGreaterThan(0);
    expect(filterBomRows(materialRows, { search: '名片八開' }).length).toBeGreaterThan(0);
    expect(filterBomRows(materialRows, { search: '四六全 787×1091' }).length).toBeGreaterThan(0);
    expect(filterBomRows(materialRows, { search: '榮成' }).length).toBeGreaterThan(0);
  });

  it('工序頁籤的篩選是工序廠商，裝訂頁籤有裝訂廠商篩選', () => {
    const procRows = filterBomRows(processRows, { vendor: '協力一廠' });
    expect(procRows.length).toBeGreaterThan(0);
    expect(procRows.every((r) => r.vendor === '協力一廠')).toBe(true);
    const bindRows = filterBomRows(bindingRows, { vendor: '立揚裝訂' });
    expect(bindRows.length).toBeGreaterThan(0);
  });
});

describe('7.2 備料規格選擇器的牌價欄顯示價格範圍（原編號 69）', () => {
  const materialRows = bomRowsOf('材料');

  it('按面積材料的牌價寫成範圍', () => {
    const row = materialRows.find((r) => r.name === '珠光合成紙');
    expect(row.price).toMatch(/^\d[\d,]* ~ \d[\d,]* 元／平方公尺$/);
  });

  it('按重量材料一筆備料一列，牌價為供應商原料的噸價、不顯示換算後的備料單價', () => {
    const rows = materialRows.filter((r) => r.name === '一級卡');
    expect(rows.map((r) => r.prepName)).toEqual(['四六全', '名片八開']);
    rows.forEach((r) => {
      expect(r.prepSize).toMatch(/×.*mm$/);
      expect(Number(r.cuttingCount)).toBeGreaterThan(0);
      expect(r.supplierName).toBeTruthy();
      expect(r.price).toBe('27,000 元／噸');
    });
  });
});

describe('7.14 按面積計價的工序改選面積規格（原編號 173）', () => {
  it('面積規格在選擇器是一列一個尺寸，單價欄顯示該尺寸落到的區間價', () => {
    const rows = bomRowsOf('工序').filter((r) => r.name === '局部上光');
    expect(rows.map((r) => r.option)).toEqual([
      '20×20 公分',
      '20×25 公分',
      '20×30 公分',
      '30×40 公分',
    ]);
    rows.forEach((r) => expect(r.price).toMatch(/元／平方公尺$/));
  });

  it('沒填面積時面積計價的工序費照實算成 0，不以選項面積頂替', () => {
    const row = bomRowsOf('工序').find((r) => r.name === '局部上光');
    const base = { ...row.patch, target_qty: 1000 };
    expect(estimateTaskCost({ ...base, pricing_area: null }).process).toBe(0);
    expect(estimateTaskCost({ ...base, pricing_area: 0.06 }).process).toBeGreaterThan(0);
  });
});
