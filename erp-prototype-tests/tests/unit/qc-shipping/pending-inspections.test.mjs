import { describe, expect, it } from 'vitest';
import { calcPendingInspections } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/pending-inspections.js';

// 情境 11.8「待驗量由轉交事實推導」的數字驗算（畫面呈現另在 e2e 11.8 驗）。
// 待驗量＝目的地為品檢站且已點收的轉交明細彙總 − 已驗量（通過＋不通過），已送達未點收的不算。

const task = {
  id: 'pt-0820-9',
  name: '精裝裝訂',
  planned_equipment: '精裝線',
  print_item_no: 'PI-2026-0820',
};

const ticket = (status, qty, extra = {}) => ({
  id: `tt-${status}-${qty}`,
  status,
  target_station_key: '品檢站',
  target_station: '品檢站',
  received_at: '2026-09-08 10:00',
  details: [
    {
      task_id: task.id,
      task_name: task.name,
      print_item_no: task.print_item_no,
      print_item_name: '《山城記事》精裝書（128 頁）',
      qty,
    },
  ],
  ...extra,
});

describe('品檢站待驗量', () => {
  it('已點收的轉交明細才進待驗量，來源站點取該工序與設備', () => {
    const rows = calcPendingInspections([ticket('已點收', 500)], [task], []);
    expect(rows).toHaveLength(1);
    expect(rows[0].arrived_qty).toBe(500);
    expect(rows[0].from_station).toBe('精裝裝訂｜精裝線');
  });

  it('已送達但未點收的不算，該印件不出現在待驗清單', () => {
    expect(calcPendingInspections([ticket('已送達', 500)], [task], [])).toHaveLength(0);
  });

  it('待驗量扣掉已驗量（通過＋不通過皆計入已驗）', () => {
    const rows = calcPendingInspections([ticket('已點收', 500)], [task], [
      { print_item_no: 'PI-2026-0820', passed_qty: 300, failed_qty: 20 },
    ]);
    expect(rows[0].arrived_qty).toBe(180);
  });

  it('驗完的列留在清單上、待驗量夾在 0 不為負', () => {
    const rows = calcPendingInspections([ticket('已點收', 500)], [task], [
      { print_item_no: 'PI-2026-0820', passed_qty: 480, failed_qty: 20 },
      { print_item_no: 'PI-2026-0820', passed_qty: 30, failed_qty: 0 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].arrived_qty).toBe(0);
  });
});
