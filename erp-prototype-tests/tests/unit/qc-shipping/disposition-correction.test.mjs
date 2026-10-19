import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';

// 情境 11.27「印務記錯報廢，先修正處置為照收，品檢人員再修正把不通過改判通過」與處置修正界線的判定驗算。
// 依據：wiki 印件 § 品檢缺口處置（處置修正界線、處置修正紀錄）——印務可修正處置數量與瑕疵品去向，
// 修正原因必填；修正後報廢類處置合計不得大於不通過累計；不另設補做限制；
// 缺口是否補做與處置備註不在可修正欄位內。

const PRINT_ITEM_NO = 'PI-TEST-DISP';
// 周建宏是這件印件旗下工單的負責印務（處置操作者依工單編輯權，見 11.30）
const OFFICER = { by: '周建宏', role: 'print_officer', work_orders: [{ owner: '周建宏' }] };

const failedRecord = (failed, id = 'qc-d1') => ({
  id,
  print_item_no: PRINT_ITEM_NO,
  print_item_name: '處置樣本',
  passed_qty: 470,
  failed_qty: failed,
  fail_reason: '色差／偏色',
  photos: ['品檢照-處置樣本-01.jpg'],
  inspected_at: '2026-09-18 10:00',
  inspector: '郭淑芬',
});

const disposition = (id, qty, handling, extra = {}) => ({
  id,
  decision: '補做（原工單異動加開）',
  defect_handling: handling,
  qty,
  decided_by: '周建宏',
  decided_at: '2026-09-18 12:00',
  note: '原備註',
  source_qc_records: [{ qc_record_id: 'qc-d1', qty }],
  remake_work_order_nos: [],
  remake_task_ids: [],
  remade_at: null,
  ...extra,
});

// 起點：不通過累計 30；處置 d1 報廢 20、d2 客戶照收 10
beforeEach(() => {
  usePrintItemsStore.setState({
    qcRecords: [failedRecord(30)],
    printItems: [
      {
        print_item_no: PRINT_ITEM_NO,
        name: '處置樣本',
        dispositions: [disposition('d1', 20, '報廢'), disposition('d2', 10, '客戶照收')],
      },
    ],
  });
});

const correctDisp = (id, patch, extra = {}) =>
  usePrintItemsStore.getState().correctDisposition(PRINT_ITEM_NO, id, {
    reason: '當初記錯',
    ...OFFICER,
    ...patch,
    ...extra,
  });

const dispOf = (id) =>
  usePrintItemsStore.getState().printItems[0].dispositions.find((d) => d.id === id);

describe('11.27 印務記錯報廢，先修正處置為照收，品檢人員再修正把不通過改判通過：處置修正界線：修正後報廢類處置合計不得超過不通過累計', () => {
  it('把報廢處置的數量由 20 調到 30（剛好等於不通過累計 30）成立', () => {
    const result = correctDisp('d1', { qty: 30 });
    expect(result.ok).toBe(true);
    expect(dispOf('d1').qty).toBe(30);
  });

  it('調到 31 超過不通過累計 30 整筆擋下，原處置不改、不新增修正紀錄', () => {
    const result = correctDisp('d1', { qty: 31 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不通過累計');
    expect(dispOf('d1').qty).toBe(20);
    expect(dispOf('d1').corrections ?? []).toHaveLength(0);
  });

  it('把客戶照收改成報廢，報廢合計變 30，剛好不超過，成立', () => {
    const result = correctDisp('d2', { defect_handling: '報廢' });
    expect(result.ok).toBe(true);
    expect(dispOf('d2').defect_handling).toBe('報廢');
  });

  it('照收改報廢又把數量加大使合計超過不通過累計時擋下', () => {
    const result = correctDisp('d2', { defect_handling: '報廢', qty: 11 });
    expect(result.ok).toBe(false);
    expect(dispOf('d2').defect_handling).toBe('客戶照收');
  });
});

describe('11.27 印務記錯報廢，先修正處置為照收，品檢人員再修正把不通過改判通過：處置修正的留痕與限制', () => {
  it('報廢改客戶照收：留一筆處置修正紀錄（修正欄位、修正前、修正後、修正人、修正時間、修正原因）', () => {
    const result = correctDisp('d1', { defect_handling: '客戶照收', reason: '客戶決定照收' });
    expect(result.ok).toBe(true);
    const entry = dispOf('d1').corrections[0];
    expect(entry.field).toBe('瑕疵品去向');
    expect(entry.before).toBe('報廢');
    expect(entry.after).toBe('客戶照收');
    expect(entry.corrected_by).toBe('周建宏');
    expect(entry.reason).toBe('客戶決定照收');
    expect(entry.corrected_at).toBeTruthy();
  });

  it('修正原因必填', () => {
    const result = correctDisp('d1', { defect_handling: '客戶照收', reason: '' });
    expect(result).toEqual({ ok: false, error: '修正原因必填' });
    expect(dispOf('d1').defect_handling).toBe('報廢');
  });

  it('沒有任何欄位被改時不成立', () => {
    const result = correctDisp('d1', { qty: 20, defect_handling: '報廢' });
    expect(result.ok).toBe(false);
  });

  it('已被補做承接的處置照樣可修正（不另設補做限制），缺口是否補做與備註不變', () => {
    usePrintItemsStore.setState({
      printItems: [
        {
          print_item_no: PRINT_ITEM_NO,
          name: '處置樣本',
          dispositions: [
            disposition('d1', 20, '報廢', {
              remake_work_order_nos: ['WO-TEST-1'],
              remake_task_ids: ['pt-1'],
            }),
          ],
        },
      ],
    });
    const result = correctDisp('d1', { defect_handling: '客戶照收' });
    expect(result.ok).toBe(true);
    expect(dispOf('d1').decision).toBe('補做（原工單異動加開）');
    expect(dispOf('d1').note).toBe('原備註');
  });

  it('品檢人員不得修正處置（印務與印務主管才是處置的決策者）', () => {
    const result = correctDisp('d1', { defect_handling: '客戶照收' }, { role: 'qc_inspector' });
    expect(result.ok).toBe(false);
    expect(dispOf('d1').defect_handling).toBe('報廢');
  });
});

describe('11.27 印務記錯報廢，先修正處置為照收，品檢人員再修正把不通過改判通過：順序：印務先修正處置為照收，品檢人員才改得動不通過', () => {
  const qcCorrect = () =>
    usePrintItemsStore.getState().correctInspection({
      record_id: 'qc-d1',
      passed_qty: 500,
      failed_qty: 0,
      fail_reason: null,
      photos: ['品檢照-處置樣本-01.jpg'],
      reason: '客戶照收，改判良品',
      occupied: [],
      inspector: '郭淑芬',
      role: 'qc_inspector',
    });

  it('報廢處置還在時，品檢把不通過 30 改成 0 被不通過下限擋下', () => {
    const result = qcCorrect();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('d1');
  });

  it('印務把報廢處置修正為照收後，品檢同一筆修正成立', () => {
    expect(correctDisp('d1', { defect_handling: '客戶照收' }).ok).toBe(true);
    const result = qcCorrect();
    expect(result.ok).toBe(true);
    const rec = usePrintItemsStore.getState().qcRecords[0];
    expect(rec.passed_qty).toBe(500);
    expect(rec.failed_qty).toBe(0);
  });
});
