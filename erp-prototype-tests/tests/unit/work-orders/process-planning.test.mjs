// 情境目錄第七章「印務登打製程與備料規格選擇」中帶明確算式或可判定規則的條目。
// 畫面操作的驗收在 tests/e2e/07-process-planning/。
import { describe, it, expect } from 'vitest';
import {
  deriveTargetQty,
  validateTaskQtys,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/target-qty.js';
import {
  COLOR_KEYS,
  estimateTaskCost,
  scaleEstCost,
  sumColors,
  sumCost,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/estimate-cost.js';
import { MOCK_WORK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/mock-data.js';
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
  findBomRow,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/bom-picker-rows.js';
import { pricingInputOf } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/work-orders/_lib/bom-master-mock.js';

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
    colors: {
      single_black: 0,
      cmyk: 0,
      pantone: 0,
      metallic: 0,
      metal_only: 0,
    },
    ...patch,
  });

  it('選定自有平版機台後，開機費進任務小計、各色貢獻依色別各自成一筆', () => {
    const cost = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: {
          single_black: 0,
          cmyk: 0,
          pantone: 1,
          metallic: 0,
          metal_only: 1,
        },
      }),
    );
    // 開機費 3,200 留在任務小計（不含顏色）；顏色費用：Pantone 1,200×1.3、顏色費用：獨立印 1,200×2.2
    expect(cost.colors.pantone).toBe(1560);
    expect(cost.colors.metal_only).toBe(2640);
    expect(sumColors(cost.colors)).toBe(4200);
    // 任務小計含工序費與開機費，且不含任何顏色貢獻
    const withoutColors = estimateTaskCost(
      offsetTask({ planned_equipment: '海德堡 SM102 四色機' }),
    );
    expect(cost.subtotal).toBe(withoutColors.subtotal);
    expect(sumColors(withoutColors.colors)).toBe(0);
  });

  it('未選我方機台時色數為純記錄，五個色別的顏色費用皆為 0', () => {
    const cost = estimateTaskCost(
      offsetTask({
        planned_equipment: null,
        colors: {
          single_black: 0,
          cmyk: 0,
          pantone: 1,
          metallic: 0,
          metal_only: 1,
        },
      }),
    );
    expect(sumColors(cost.colors)).toBe(0);
    COLOR_KEYS.forEach((key) => expect(cost.colors[key]).toBe(0));
  });

  it('五個色別各自計數、相加不擇一', () => {
    const one = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: {
          single_black: 0,
          cmyk: 1,
          pantone: 0,
          metallic: 0,
          metal_only: 0,
        },
      }),
    );
    const two = estimateTaskCost(
      offsetTask({
        planned_equipment: '海德堡 SM102 四色機',
        colors: {
          single_black: 1,
          cmyk: 1,
          pantone: 0,
          metallic: 0,
          metal_only: 0,
        },
      }),
    );
    // 單黑價 820、彩色價 1,200（令數 42 落第二階）：兩色別各自成一筆，不合成一格
    expect(one.colors.cmyk).toBe(1200);
    expect(one.colors.single_black).toBe(0);
    expect(two.colors.cmyk).toBe(1200);
    expect(two.colors.single_black).toBe(820);
    // 任務小計不隨色數變動
    expect(two.subtotal).toBe(one.subtotal);
  });
});

describe('7.8 印刷任務的成本分成任務小計與各顏色費用兩處凍結（原編號 158）', () => {
  const task = {
    task_type: '工序',
    bom_ref: { process_id: 'pc-101' },
    target_qty: 20800,
    planned_equipment: '海德堡 SM102 四色機',
    colors: {
      single_black: 0,
      cmyk: 1,
      pantone: 0,
      metallic: 0,
      metal_only: 0,
    },
  };

  it('工序費與開機費併進任務小計，各色貢獻另外成一組，不二選一', () => {
    const cost = estimateTaskCost(task);
    // 任務小計（不含顏色）＝工序費＋開機費，兩項都在裡面
    const withoutEquipment = estimateTaskCost({
      ...task,
      planned_equipment: null,
    });
    expect(withoutEquipment.subtotal).toBeGreaterThan(0);
    expect(cost.subtotal).toBe(withoutEquipment.subtotal + 3200);
    expect(cost.colors.cmyk).toBeGreaterThan(0);
    expect(sumCost(cost)).toBe(cost.subtotal + sumColors(cost.colors));
  });

  it('快照不再出現材料費、工序費、裝訂費、設備費四個欄位', () => {
    const cost = estimateTaskCost(task);
    expect(Object.keys(cost).sort()).toEqual(['colors', 'subtotal']);
  });

  it('大圖任務的設備側金額全進任務小計，五個色別的顏色費用皆為 0', () => {
    const largeFormat = estimateTaskCost({
      task_type: '工序',
      bom_ref: { process_group_id: 'pg-01', process_id: 'pc-104' },
      unit_class: '自有工廠',
      planned_equipment: '愛普生 SureColor S80680 大圖機',
      target_qty: 60,
      finished_size_cm: { length_cm: 120, width_cm: 90 },
      colors: {
        single_black: 0,
        cmyk: 4,
        pantone: 0,
        metallic: 0,
        metal_only: 0,
      },
    });
    // 才數 12 × 每才 28 元 × 數量 60 × 折扣 0.92 ＝ 18,547，全部落在任務小計
    expect(largeFormat.subtotal).toBeGreaterThanOrEqual(18547);
    expect(sumColors(largeFormat.colors)).toBe(0);
    COLOR_KEYS.forEach((key) => expect(largeFormat.colors[key]).toBe(0));
  });

  it('計價數量一律取該任務自己的目標數量，任務之間不互相取數', () => {
    const half = estimateTaskCost({ ...task, target_qty: 10400 });
    const full = estimateTaskCost(task);
    expect(half.subtotal).not.toBe(full.subtotal);
    // 目標數量為 0 時照實回 0，不向其他任務借數
    const zero = estimateTaskCost({ ...task, target_qty: 0 });
    expect(zero.subtotal).toBe(0);
    expect(sumColors(zero.colors)).toBe(0);
  });
});

describe('7.27 工單成本的顏色列固定呈現，未登記的色別為 0', () => {
  const anchor = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0820');
  const colorTotals = () => {
    const totals = {
      single_black: 0,
      cmyk: 0,
      pantone: 0,
      metallic: 0,
      metal_only: 0,
    };
    anchor.tasks
      .filter((t) => t.status !== '已作廢')
      .forEach((t) =>
        COLOR_KEYS.forEach((k) => {
          totals[k] += t.est_cost?.colors?.[k] ?? 0;
        }),
      );
    return totals;
  };

  it('每一筆生產任務的計價快照都帶齊五個色別，未登記者為 0', () => {
    anchor.tasks.forEach((t) => {
      expect(Object.keys(t.est_cost.colors).sort()).toEqual([...COLOR_KEYS].sort());
      COLOR_KEYS.forEach((k) => expect(Number.isFinite(t.est_cost.colors[k])).toBe(true));
    });
  });

  it('錨例 WO-2026-0820 的顏色列只有單黑與 CMYK 有金額，其餘三個色別為 0', () => {
    const totals = colorTotals();
    expect(totals.single_black).toBe(260);
    expect(totals.cmyk).toBe(1520);
    expect(totals.pantone).toBe(0);
    expect(totals.metallic).toBe(0);
    expect(totals.metal_only).toBe(0);
  });

  it('任務小計不含任何顏色貢獻，工單合計為任務小計相加再加顏色的各列', () => {
    const printing = anchor.tasks.find((t) => t.id === 'pt-0820-2');
    const cover = anchor.tasks.find((t) => t.id === 'pt-0820-5');
    expect(printing.est_cost.subtotal).toBe(5054);
    expect(printing.est_cost.colors.single_black).toBe(260);
    expect(cover.est_cost.subtotal).toBe(3677);
    expect(cover.est_cost.colors.cmyk).toBe(1520);

    const subtotalSum = anchor.tasks
      .filter((t) => t.status !== '已作廢')
      .reduce((acc, t) => acc + t.est_cost.subtotal, 0);
    const totals = colorTotals();
    expect(subtotalSum + sumColors(totals)).toBe(43009);
  });
});

describe('7.28 加登記一個色別只動該顏色列，任務小計不變', () => {
  const anchor = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0820');
  const cover = anchor.tasks.find((t) => t.id === 'pt-0820-5');

  it('封面書腰合印加登記 Pantone 一色，顏色費用：Pantone 為 494、任務小計仍為 3,677', () => {
    const after = estimateTaskCost({
      ...cover,
      colors: { ...cover.colors, pantone: 1 },
    });
    // 該任務目標數量 530 張，令數 ceil(530 ÷ 500)＝2 落 5 令級距（彩色價 380）；380 × 1.3 ＝ 494
    expect(after.colors.pantone).toBe(494);
    expect(after.colors.cmyk).toBe(1520);
    expect(after.subtotal).toBe(3677);
  });

  it('工單預估成本合計由 43,009 變為 43,503，只多了顏色費用：Pantone 那一列', () => {
    const before = anchor.tasks
      .filter((t) => t.status !== '已作廢')
      .reduce((acc, t) => acc + sumCost(t.est_cost), 0);
    const after = estimateTaskCost({
      ...cover,
      colors: { ...cover.colors, pantone: 1 },
    });
    expect(before).toBe(43009);
    expect(before - sumCost(cover.est_cost) + sumCost(after)).toBe(43503);
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
    const result = applyTaskOrder(tasks, ['t3', 't1', 't2'], {
      openedVersion: opened,
    });
    expect(result.ok).toBe(true);
    expect(sortTasksForDisplay(result.tasks).map((t) => t.id)).toEqual(['t3', 't1', 't2']);
  });

  it('排序期間清單被加開時擋下，順序不寫入', () => {
    const opened = taskListVersion(tasks);
    const afterInsert = [...tasks, { id: 't4', sort_order: 4 }];
    const result = applyTaskOrder(afterInsert, ['t3', 't1', 't2'], {
      openedVersion: opened,
    });
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

describe('7.12 任務預計完成日純手填，工單預排完成日取最大值（原編號 164）', () => {
  it('全部任務未填時工單預排完成日為空', () => {
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

  it('工單自身留有舊的手填值也不採用，一律回任務的最大值', () => {
    expect(
      resolvePlannedEndDate({
        planned_end_date: '2026-09-25',
        tasks: [{ planned_end_date: '2026-09-18', status: '待處理' }],
      }),
    ).toBe('2026-09-18');
  });

  it('任務的預計完成日改動後即時重算', () => {
    const before = {
      tasks: [{ planned_end_date: '2026-09-18', status: '待處理' }],
    };
    expect(resolvePlannedEndDate(before)).toBe('2026-09-18');
    const after = {
      tasks: [{ planned_end_date: '2026-09-15', status: '待處理' }],
    };
    expect(resolvePlannedEndDate(after)).toBe('2026-09-15');
  });
});

describe('7.15 選擇器一列等於一個主檔品項（原編號 175）', () => {
  const materialRows = bomRowsOf('材料');
  const bindingRows = bomRowsOf('裝訂');

  it('同一種紙的兩個磅數各一列', () => {
    const rows = materialRows.filter((r) => r.name === '雪銅紙');
    expect(rows.map((r) => r.spec)).toEqual(['150g', '200g']);
  });

  it('按面積計價的輸出材只出一列，面積區間不展成列', () => {
    const rows = materialRows.filter((r) => r.name === '珠光合成紙');
    expect(rows).toHaveLength(1);
    expect(rows[0].option).toBeUndefined();
  });

  it('騎馬釘只出一列，頁數項目不展成列', () => {
    const rows = bindingRows.filter((r) => r.name === '騎馬釘裝訂');
    expect(rows).toHaveLength(1);
  });

  it('頁數計價的膠裝與台數計價的裸背線裝也各只出一列', () => {
    expect(bindingRows.filter((r) => r.name === '膠裝')).toHaveLength(1);
    expect(bindingRows.filter((r) => r.name === '裸背線裝')).toHaveLength(1);
  });

  it('裝訂與工序頁籤每個主檔品項各一列，沒有重複的品項', () => {
    for (const type of ['工序', '裝訂']) {
      const names = bomRowsOf(type).map((r) => r.parentId);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('牌價欄顯示整張價格矩陣的最低到最高', () => {
    // 騎馬釘本數計價矩陣最低 3.6、最高 7.6
    expect(bindingRows.find((r) => r.name === '騎馬釘裝訂').price).toBe('3.6 ~ 7.6 元／本');
    // 珠光合成紙面積矩陣最低 88、最高 130
    expect(materialRows.find((r) => r.name === '珠光合成紙').price).toBe('88 ~ 130 元／平方公尺');
    // 手工貼標時間矩陣最低 1.25、最高 4
    expect(bomRowsOf('工序').find((r) => r.name === '手工貼標').price).toBe('1.25 ~ 4 元／張');
  });

  it('編輯既有任務時依主檔品項反查到唯一一列', () => {
    expect(findBomRow({ task_type: '工序', bom_ref: { process_id: 'pc-203' } })?.name).toBe(
      '局部上光',
    );
    expect(
      findBomRow({
        task_type: '裝訂',
        bom_ref: { binding_id: 'bd-01' },
        binding_pages: 16,
      })?.name,
    ).toBe('騎馬釘裝訂');
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

describe('7.14 按面積計價的工序在選擇器只出一列，表單填面積依面積查格（原編號 173）', () => {
  it('局部上光在選擇器只出一列，牌價顯示整張矩陣範圍', () => {
    const rows = bomRowsOf('工序').filter((r) => r.name === '局部上光');
    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe('14 ~ 34 元／平方公尺');
  });

  it('面積計價的工序要手填面積，單位取該工序價格表的面積單位', () => {
    expect(pricingInputOf({ task_type: '工序', bom_ref: { process_id: 'pc-203' } })).toEqual({
      field: 'pricing_area',
      label: '面積',
      unit: '平方公尺',
    });
    // 平版印刷不是面積計價，沒有計價輸入欄
    expect(pricingInputOf({ task_type: '工序', bom_ref: { process_id: 'pc-101' } })).toBeNull();
  });

  it('沒填面積時面積計價的工序費照實算成 0，不以區間頂替', () => {
    const row = bomRowsOf('工序').find((r) => r.name === '局部上光');
    const base = { ...row.patch, target_qty: 1000 };
    expect(estimateTaskCost({ ...base, pricing_area: null }).subtotal).toBe(0);
    expect(estimateTaskCost({ ...base, pricing_area: 0.06 }).subtotal).toBeGreaterThan(0);
  });

  it('依填寫的面積與目標數量查矩陣落格：0.18 平方公尺、520 件落第二列第一欄 17 元', () => {
    const task = {
      task_type: '工序',
      bom_ref: { process_id: 'pc-201' },
      target_qty: 520,
    };
    // 0.18 × 17 × 520 ＝ 1,591.2，取整 1,591
    expect(estimateTaskCost({ ...task, pricing_area: 0.18 }).subtotal).toBe(1591);
    // 面積換到第三列（大於 0.25）：0.3 × 13 × 520 ＝ 2,028
    expect(estimateTaskCost({ ...task, pricing_area: 0.3 }).subtotal).toBe(2028);
  });

  it('成品計價（全版過油）同樣填面積查格：0.3 平方公尺、2,000 張落第二列第二欄 8 元', () => {
    const task = {
      task_type: '工序',
      bom_ref: { process_id: 'pc-204' },
      target_qty: 2000,
    };
    expect(pricingInputOf(task)).toMatchObject({
      field: 'pricing_area',
      unit: '平方公尺',
    });
    expect(estimateTaskCost({ ...task, pricing_area: 0.3 }).subtotal).toBe(4800);
    expect(estimateTaskCost({ ...task, pricing_area: null }).subtotal).toBe(0);
  });

  it('材料按面積：單獨面積以單件面積落列、總面積以單件面積乘目標數量落列', () => {
    // ms-2011 單獨面積：0.0064 落第一列、63 張落第一欄 130 元 → 0.0064 × 130 × 63 ＝ 52.4，取整 52
    const single = {
      task_type: '材料',
      bom_ref: { material_spec_id: 'ms-2011' },
      pricing_area: 0.0064,
      target_qty: 63,
    };
    expect(pricingInputOf(single)).toEqual({
      field: 'pricing_area',
      label: '面積',
      unit: '平方公尺',
    });
    expect(estimateTaskCost(single).subtotal).toBe(52);
    // ms-2021 總面積：單件 0.3 × 1,000 ＝ 總面積 300 落第三列、1,000 張落第二欄 75 元 → 22,500
    const total = {
      task_type: '材料',
      bom_ref: { material_spec_id: 'ms-2021' },
      pricing_area: 0.3,
      target_qty: 1000,
    };
    expect(estimateTaskCost(total).subtotal).toBe(22500);
    expect(estimateTaskCost({ ...total, pricing_area: null }).subtotal).toBe(0);
  });
});

describe('7.41 時間計價工序填每件時間查格（手工貼標、手工包裝）', () => {
  const sticker = { task_type: '工序', bom_ref: { process_id: 'pc-501' } };
  const packing = { task_type: '工序', bom_ref: { process_id: 'pc-502' } };

  it('手工貼標要填每件時間，單位為分鐘；手工包裝單位為秒', () => {
    expect(pricingInputOf(sticker)).toEqual({
      field: 'pricing_time',
      label: '每件時間',
      unit: '分鐘',
    });
    expect(pricingInputOf(packing)).toEqual({
      field: 'pricing_time',
      label: '每件時間',
      unit: '秒',
    });
  });

  it('驗算錨例：每件 0.8 分鐘、目標數量 1,500 → 單價 2.5 元、成本 3,750 元', () => {
    expect(estimateTaskCost({ ...sticker, pricing_time: 0.8, target_qty: 1500 }).subtotal).toBe(
      3750,
    );
  });

  it('時間軸與數量軸各自落格：0.4 分鐘、1,500 件落第一列第二欄 1.5 元 → 2,250', () => {
    expect(estimateTaskCost({ ...sticker, pricing_time: 0.4, target_qty: 1500 }).subtotal).toBe(
      2250,
    );
    // 2 分鐘落最後一列、800 件落第一欄 4 元 → 3,200
    expect(estimateTaskCost({ ...sticker, pricing_time: 2, target_qty: 800 }).subtotal).toBe(3200);
  });

  it('秒單位的手工包裝：20 秒、503 個落第二列第一欄 1.6 元 → 805', () => {
    expect(estimateTaskCost({ ...packing, pricing_time: 20, target_qty: 503 }).subtotal).toBe(805);
  });

  it('沒填每件時間時工序費為 0，不以預設值頂替', () => {
    expect(estimateTaskCost({ ...sticker, pricing_time: null, target_qty: 1500 }).subtotal).toBe(0);
  });

  it('存量的手工包裝任務已補每件時間，成本與改版前一致', () => {
    const task = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0812').tasks.find((t) =>
      t.name.includes('三件配套裝袋'),
    );
    expect(task.pricing_time).toBe(20);
    expect(estimateTaskCost(task).subtotal).toBe(task.est_cost.subtotal);
    expect(task.est_cost.subtotal).toBe(805);
  });
});

describe('7.42 裝訂依計價方式填台數、頁數或選頁數項目', () => {
  it('台數計價填台數、頁數計價填頁數（數字）、本數計價從主檔頁數項目選', () => {
    expect(pricingInputOf({ task_type: '裝訂', bom_ref: { binding_id: 'bd-03' } })).toEqual({
      field: 'binding_signatures',
      label: '台數',
      unit: '台',
    });
    expect(pricingInputOf({ task_type: '裝訂', bom_ref: { binding_id: 'bd-02' } })).toEqual({
      field: 'binding_pages',
      label: '頁數',
      unit: '頁',
    });
    expect(pricingInputOf({ task_type: '裝訂', bom_ref: { binding_id: 'bd-01' } })).toEqual({
      field: 'binding_pages',
      label: '頁數',
      unit: '',
      options: [8, 16, 24, 32],
    });
  });

  it('B1 台數計價：6 台落台數區間第二列、500 本落第二欄 22.5 元 → 11,250', () => {
    const task = {
      task_type: '裝訂',
      bom_ref: { binding_id: 'bd-03' },
      target_qty: 500,
    };
    expect(estimateTaskCost({ ...task, binding_signatures: 6 }).subtotal).toBe(11250);
    // 9 台落第三列：29 × 500 ＝ 14,500
    expect(estimateTaskCost({ ...task, binding_signatures: 9 }).subtotal).toBe(14500);
    expect(estimateTaskCost({ ...task, binding_signatures: null }).subtotal).toBe(0);
  });

  it('B2 頁數計價：100 頁落第二列、300 本落第二欄 14.5 元 → 4,350', () => {
    const task = {
      task_type: '裝訂',
      bom_ref: { binding_id: 'bd-02' },
      target_qty: 300,
    };
    expect(estimateTaskCost({ ...task, binding_pages: 100 }).subtotal).toBe(4350);
    expect(estimateTaskCost({ ...task, binding_pages: null }).subtotal).toBe(0);
  });

  it('B3 本數計價：頁數精確比對頁數項目，16 頁、300 本 → 4.8 × 300 ＝ 1,440；不在項目內回 0', () => {
    const task = {
      task_type: '裝訂',
      bom_ref: { binding_id: 'bd-01' },
      target_qty: 300,
    };
    expect(estimateTaskCost({ ...task, binding_pages: 16 }).subtotal).toBe(1440);
    expect(estimateTaskCost({ ...task, binding_pages: 20 }).subtotal).toBe(0);
  });

  it('總價最低金額仍生效：B3 16 頁、50 本查表 6.0 元，合計 300 低於總價最低金額 800 補到 800', () => {
    const task = {
      task_type: '裝訂',
      bom_ref: { binding_id: 'bd-01' },
      target_qty: 50,
    };
    // 16 頁第一欄 6.0 元 × 50 ＝ 300，低於總價最低金額 800
    expect(estimateTaskCost({ ...task, binding_pages: 16 }).subtotal).toBe(800);
  });
});

// 7.29 補做與異動改量時，任務小計與各顏色費用按數量比例縮放並各自取整
// 起點資料：錨例 WO-2026-0820 書芯印刷（目標數量 2,060，任務小計 5,054，顏色費用：單黑 260）
describe('7.29 補做與異動改量時，任務小計與各顏色費用按數量比例縮放並各自取整', () => {
  const base = MOCK_WORK_ORDERS.find((w) => w.work_order_no === 'WO-2026-0820').tasks.find((t) =>
    t.name.includes('書芯印刷'),
  );

  it('比例 0.25：任務小計 5,054 取整 1,264、顏色費用：單黑 65，其餘色別 0', () => {
    expect(base.target_qty).toBe(2060);
    const scaled = scaleEstCost(base.est_cost, 515 / base.target_qty);
    expect(scaled.subtotal).toBe(1264);
    expect(scaled.colors.single_black).toBe(65);
    for (const k of COLOR_KEYS.filter((key) => key !== 'single_black'))
      expect(scaled.colors[k]).toBe(0);
    // 合計以各列相加為準
    expect(sumCost(scaled)).toBe(1264 + 65);
  });

  it('五個色別鍵固定齊備，未登記者為 0、不是 undefined', () => {
    const scaled = scaleEstCost(base.est_cost, 0.5);
    expect(Object.keys(scaled.colors).sort()).toEqual([...COLOR_KEYS].sort());
    expect(Object.values(scaled.colors).every((v) => Number.isInteger(v))).toBe(true);
  });

  it('基準目標數量為 0（比例 0）或比例不合法時全部回 0、不推估', () => {
    for (const ratio of [0, -1, NaN, undefined]) {
      const scaled = scaleEstCost(base.est_cost, ratio);
      expect(scaled.subtotal).toBe(0);
      expect(sumColors(scaled.colors)).toBe(0);
    }
  });
});
