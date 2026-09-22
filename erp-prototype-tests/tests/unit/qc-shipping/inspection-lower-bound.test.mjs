import { beforeEach, describe, expect, it } from 'vitest';
import { usePrintItemsStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';

// 情境 11.18「更正紀錄沖不到負數」與 11.23「每筆品檢紀錄必附照片至少一張」的判定驗算
//（畫面呈現另在 e2e 11.18 與 11.23 驗）。
// 累計是代數和，填一個絕對值過大的負數會把通過或不通過壓到 0 以下——那代表一批不存在的貨
// 被沖銷掉。通過與不通過兩本各自判，任一違反即整筆擋下、紀錄不新增。
// 上限（不超過送出那一刻的待驗量）由品檢站頁在送出前把關，不在這一支。

const PRINT_ITEM_NO = 'PI-TEST-BOUND';
const INSPECTOR = { inspector: '郭淑芬', role: 'qc_inspector' };

// 起點：這件印件已驗收通過 500、不通過 20
const seedRecords = () => [
  {
    id: 'qc-seed',
    print_item_no: PRINT_ITEM_NO,
    print_item_name: '下限樣本',
    passed_qty: 500,
    failed_qty: 20,
    fail_reason: '色差／偏色',
    photos: ['品檢照-下限樣本-01.jpg'],
    inspected_at: '2026-09-18 10:00',
    inspector: '郭淑芬',
  },
];

const submit = (passed, failed, photos = ['品檢照-下限樣本-02.jpg']) =>
  usePrintItemsStore.getState().submitInspection({
    print_item_no: PRINT_ITEM_NO,
    name: '下限樣本',
    passed_qty: passed,
    failed_qty: failed,
    fail_reason: '色差／偏色',
    photos,
    ...INSPECTOR,
  });

const recordCount = () =>
  usePrintItemsStore.getState().qcRecords.filter((r) => r.print_item_no === PRINT_ITEM_NO).length;

describe('11.18 更正紀錄沖不到負數', () => {
  beforeEach(() => {
    usePrintItemsStore.setState({ qcRecords: seedRecords() });
  });

  it('已驗通過 500 時填通過 −600 整筆擋下，訊息只有一句', () => {
    const result = submit(-600, 0);
    expect(result).toEqual({ ok: false, error: '更正後的累計不得低於 0' });
    expect(recordCount()).toBe(1);
  });

  it('改填通過 −500 剛好沖到 0，這一筆成立', () => {
    const result = submit(-500, 0);
    expect(result.ok).toBe(true);
    expect(recordCount()).toBe(2);
  });

  it('不通過那一本自己判：已驗不通過 20 時填 −30 同樣擋下', () => {
    const result = submit(0, -30);
    expect(result).toEqual({ ok: false, error: '更正後的累計不得低於 0' });
    expect(recordCount()).toBe(1);
  });

  it('兩本只要有一本被沖成負數就整筆擋下，另一本不先進帳', () => {
    const result = submit(-100, -30);
    expect(result.ok).toBe(false);
    expect(recordCount()).toBe(1);
  });

  it('客戶照收改判良品（通過 +20、不通過 −20）兩本都不為負，照樣成立', () => {
    const result = submit(20, -20);
    expect(result.ok).toBe(true);
    expect(recordCount()).toBe(2);
  });

  it('一般驗收（兩欄皆為正）不受下限影響，上限不由這一支把關', () => {
    const result = submit(9999, 0);
    expect(result.ok).toBe(true);
  });
});

describe('11.23 品檢紀錄與更正紀錄都必附品檢照片至少一張', () => {
  beforeEach(() => {
    usePrintItemsStore.setState({ qcRecords: seedRecords() });
  });

  it('一般驗收沒附照片時整筆擋下，訊息只有一句', () => {
    const result = submit(100, 0, []);
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(recordCount()).toBe(1);
  });

  it('更正紀錄走同一條檢核：沒附照片一樣擋下', () => {
    const result = submit(-100, 0, []);
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(recordCount()).toBe(1);
  });

  it('沒傳照片欄位（繞過介面直接呼叫）視同沒附，照樣擋下', () => {
    const result = usePrintItemsStore.getState().submitInspection({
      print_item_no: PRINT_ITEM_NO,
      name: '下限樣本',
      passed_qty: 100,
      failed_qty: 0,
      fail_reason: '色差／偏色',
      ...INSPECTOR,
    });
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
    expect(recordCount()).toBe(1);
  });

  it('附一張即成立，照片跟著那一筆紀錄存下來', () => {
    const result = submit(100, 0, ['品檢照-下限樣本-03.jpg']);
    expect(result.ok).toBe(true);
    const latest = usePrintItemsStore
      .getState()
      .qcRecords.find((r) => r.print_item_no === PRINT_ITEM_NO);
    expect(latest.photos).toEqual(['品檢照-下限樣本-03.jpg']);
  });

  it('照片檢核排在累計下限之前：兩條都違反時回照片那一句', () => {
    const result = submit(-600, 0, []);
    expect(result).toEqual({ ok: false, error: '品檢照片至少一張' });
  });
});
