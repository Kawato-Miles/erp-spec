import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';

// 情境 11.18「品檢修正受三條界線約束，違反即整筆擋下」與 11.23「品檢紀錄與品檢修正都必附品檢照片至少一張」
// 的判定驗算（畫面呈現另在 e2e 11.23、11.24～11.27 驗）。
// 依據：wiki 品檢紀錄 § 品檢修正規則與單筆檢核——總數上限、通過下限、不通過下限三條品檢修正界線，
// 命中任一條即整筆擋下、原紀錄不改、不新增修正紀錄。
// 出貨明細佔用由呼叫端（品檢站頁）自出貨單算出後帶入（occupied），報廢類處置取自印件的處置留痕。

const PRINT_ITEM_NO = 'PI-TEST-BOUND';
const INSPECTOR = { inspector: '郭淑芬', role: 'qc_inspector' };

// 起點：這件印件已驗收通過 500、不通過 20（本筆原合計 520）
const seedRecords = () => [
  {
    id: 'qc-seed',
    print_item_no: PRINT_ITEM_NO,
    print_item_name: '界線樣本',
    passed_qty: 500,
    failed_qty: 20,
    fail_reason: '色差／偏色',
    photos: ['品檢照-界線樣本-01.jpg'],
    inspected_at: '2026-09-18 10:00',
    inspector: '郭淑芬',
  },
];

const seedPrintItem = (dispositions = []) => ({
  print_item_no: PRINT_ITEM_NO,
  name: '界線樣本',
  dispositions,
});

const correct = (patch = {}, extra = {}) =>
  usePrintItemsStore.getState().correctInspection({
    record_id: 'qc-seed',
    passed_qty: 500,
    failed_qty: 20,
    fail_reason: '色差／偏色',
    photos: ['品檢照-界線樣本-01.jpg'],
    reason: '複驗後重新分配',
    occupied: [],
    ...patch,
    ...INSPECTOR,
    ...extra,
  });

const record = () => usePrintItemsStore.getState().qcRecords.find((r) => r.id === 'qc-seed');

beforeEach(() => {
  usePrintItemsStore.setState({ qcRecords: seedRecords(), printItems: [seedPrintItem()] });
});

describe('11.18 品檢修正受三條界線約束，違反即整筆擋下：總數上限：修正後通過加不通過不得超過本筆原合計', () => {
  it('合計改成 530（原合計 520）整筆擋下，訊息提示新到的量請另按驗收', () => {
    const result = correct({ passed_qty: 510, failed_qty: 20 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('530');
    expect(result.error).toContain('520');
    expect(result.error).toContain('另按驗收');
    expect(record().passed_qty).toBe(500);
    expect(record().corrections ?? []).toHaveLength(0);
  });

  it('合計剛好 520（只改分配）成立，原紀錄改值', () => {
    const result = correct({ passed_qty: 480, failed_qty: 40 });
    expect(result.ok).toBe(true);
    expect(record().passed_qty).toBe(480);
    expect(record().failed_qty).toBe(40);
  });

  it('合計改小（誤記多算）同樣成立', () => {
    const result = correct({ passed_qty: 400, failed_qty: 20 });
    expect(result.ok).toBe(true);
    expect(record().passed_qty).toBe(400);
  });
});

describe('11.18 品檢修正受三條界線約束，違反即整筆擋下：通過下限：修正後通過累計不得低於出貨明細佔用', () => {
  const occupied = [{ shipment_no: 'SH-TEST-001', qty: 300 }];

  it('出貨明細佔用 300 時把通過改為 200 整筆擋下，訊息列出出貨單編號與數量', () => {
    const result = correct({ passed_qty: 200, failed_qty: 320 }, { occupied });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('SH-TEST-001');
    expect(result.error).toContain('300');
    expect(record().passed_qty).toBe(500);
    expect(record().corrections ?? []).toHaveLength(0);
  });

  it('通過累計剛好等於佔用 300 成立', () => {
    const result = correct({ passed_qty: 300, failed_qty: 220 }, { occupied });
    expect(result.ok).toBe(true);
    expect(record().passed_qty).toBe(300);
  });

  it('通過累計取該印件各筆修正後的值：另一筆通過 100 墊著時，本筆可降到 200', () => {
    usePrintItemsStore.setState({
      qcRecords: [
        ...seedRecords(),
        {
          id: 'qc-other',
          print_item_no: PRINT_ITEM_NO,
          print_item_name: '界線樣本',
          passed_qty: 100,
          failed_qty: 0,
          fail_reason: null,
          photos: ['品檢照-界線樣本-02.jpg'],
          inspected_at: '2026-09-18 11:00',
          inspector: '郭淑芬',
        },
      ],
    });
    const result = correct({ passed_qty: 200, failed_qty: 320 }, { occupied });
    expect(result.ok).toBe(true);
  });
});

describe('11.18 品檢修正受三條界線約束，違反即整筆擋下：不通過下限：修正後不通過累計不得低於報廢類處置合計', () => {
  const scrap = (qty, id = 'disp-1') => ({
    id,
    decision: '不補（印件層結案）',
    defect_handling: '報廢',
    qty,
    decided_by: '周建宏',
    decided_at: '2026-09-18 12:00',
    note: '',
    source_qc_records: [],
  });

  it('報廢類處置已有 15 時把不通過改為 10 整筆擋下，訊息列出報廢類處置紀錄', () => {
    usePrintItemsStore.setState({ printItems: [seedPrintItem([scrap(15)])] });
    const result = correct({ passed_qty: 510, failed_qty: 10 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('disp-1');
    expect(result.error).toContain('15');
    expect(record().failed_qty).toBe(20);
    expect(record().corrections ?? []).toHaveLength(0);
  });

  it('不通過累計剛好等於報廢合計 15 成立', () => {
    usePrintItemsStore.setState({ printItems: [seedPrintItem([scrap(15)])] });
    const result = correct({ passed_qty: 505, failed_qty: 15 });
    expect(result.ok).toBe(true);
  });

  it('客戶照收類處置不算減項：只有照收處置時不通過可以改為 0', () => {
    usePrintItemsStore.setState({
      printItems: [
        seedPrintItem([{ ...scrap(20, 'disp-keep'), defect_handling: '客戶照收' }]),
      ],
    });
    const result = correct({ passed_qty: 520, failed_qty: 0, fail_reason: null });
    expect(result.ok).toBe(true);
  });
});

describe('11.18 品檢修正受三條界線約束，違反即整筆擋下：修正的留痕與原因清空', () => {
  it('不通過數量改為 0 時不通過原因清空', () => {
    const result = correct({ passed_qty: 520, failed_qty: 0, fail_reason: '色差／偏色' });
    expect(result.ok).toBe(true);
    expect(record().fail_reason).toBeNull();
  });

  it('每個被改的欄位留一筆修正紀錄，含修正前、修正後、修正人、修正時間與修正原因', () => {
    const result = correct({ passed_qty: 480, failed_qty: 40, reason: '複驗發現色差' });
    expect(result.ok).toBe(true);
    const entries = record().corrections;
    expect(entries.map((c) => [c.field, c.before, c.after])).toEqual([
      ['通過數量', 500, 480],
      ['不通過數量', 20, 40],
    ]);
    entries.forEach((c) => {
      expect(c.corrected_by).toBe('郭淑芬');
      expect(c.reason).toBe('複驗發現色差');
      expect(c.corrected_at).toBeTruthy();
    });
  });

  it('沒有任何欄位被改時不成立', () => {
    const result = correct();
    expect(result.ok).toBe(false);
    expect(record().corrections ?? []).toHaveLength(0);
  });

  it('修正原因必填', () => {
    const result = correct({ passed_qty: 480, failed_qty: 40, reason: '  ' });
    expect(result).toEqual({ ok: false, error: '修正原因必填' });
    expect(record().passed_qty).toBe(500);
  });

  it('非品檢人員不得修正（繞過介面直接呼叫時擋下）', () => {
    const result = correct({ passed_qty: 480, failed_qty: 40 }, { role: 'print_officer' });
    expect(result.ok).toBe(false);
    expect(record().passed_qty).toBe(500);
  });

  it('累計取各筆修正後的值：修正後不再有負數紀錄', () => {
    correct({ passed_qty: 480, failed_qty: 40 });
    const rows = usePrintItemsStore.getState().qcRecords;
    expect(rows.every((r) => r.passed_qty >= 0 && r.failed_qty >= 0)).toBe(true);
  });
});

describe('11.23 品檢紀錄與品檢修正都必附品檢照片至少一張', () => {
  const submit = (passed, failed, photos = ['品檢照-界線樣本-03.jpg']) =>
    usePrintItemsStore.getState().submitInspection({
      print_item_no: PRINT_ITEM_NO,
      name: '界線樣本',
      passed_qty: passed,
      failed_qty: failed,
      fail_reason: '色差／偏色',
      photos,
      ...INSPECTOR,
    });

  const recordCount = () =>
    usePrintItemsStore.getState().qcRecords.filter((r) => r.print_item_no === PRINT_ITEM_NO).length;

  it('一般驗收沒附照片時整筆擋下，訊息只有一句', () => {
    const result = submit(100, 0, []);
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(recordCount()).toBe(1);
  });

  it('沒傳照片欄位（繞過介面直接呼叫）視同沒附，照樣擋下', () => {
    const result = usePrintItemsStore.getState().submitInspection({
      print_item_no: PRINT_ITEM_NO,
      name: '界線樣本',
      passed_qty: 100,
      failed_qty: 0,
      fail_reason: '色差／偏色',
      ...INSPECTOR,
    });
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(recordCount()).toBe(1);
  });

  it('附一張即成立，照片跟著那一筆紀錄存下來', () => {
    const result = submit(100, 0, ['品檢照-界線樣本-04.jpg']);
    expect(result.ok).toBe(true);
    const latest = usePrintItemsStore
      .getState()
      .qcRecords.find((r) => r.print_item_no === PRINT_ITEM_NO);
    expect(latest.photos).toEqual(['品檢照-界線樣本-04.jpg']);
  });

  it('品檢修正把照片全部移除時整筆擋下，原紀錄不改', () => {
    const result = correct({ passed_qty: 480, failed_qty: 40, photos: [] });
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(record().passed_qty).toBe(500);
  });

  it('品檢修正換掉照片：新照片存進紀錄，換掉的照片留在修正紀錄的修正前照片', () => {
    const result = correct({ photos: ['品檢照-界線樣本-換.jpg'] });
    expect(result.ok).toBe(true);
    expect(record().photos).toEqual(['品檢照-界線樣本-換.jpg']);
    const entry = record().corrections.find((c) => c.field === '品檢照片');
    expect(entry.before_photos).toEqual(['品檢照-界線樣本-01.jpg']);
  });

  it('照片檢核排在界線之前：兩條都違反時回照片那一句', () => {
    const result = correct({ passed_qty: 510, failed_qty: 20, photos: [] });
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
  });
});
