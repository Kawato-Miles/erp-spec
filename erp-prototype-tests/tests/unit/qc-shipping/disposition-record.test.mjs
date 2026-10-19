import { beforeEach, describe, expect, it } from 'vitest';
import { canDecideDisposition } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/permissions.js';
import {
  calcQualityAccount,
  usePrintItemsStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/print-items/_lib/store.js';

// 情境 11.28（兩軸各自獨立選、分次處置、處置留痕逐筆列出、品檢人員沒有入口）與
// 11.29（數量檢核只約束報廢類，客戶照收不設上限）的規則驗算。畫面呈現在 tests/e2e/11-qc/qc.spec.mjs。
// 依據：wiki 印件 § 品檢缺口處置（處置數量檢核）、QC不通過補生產。

const NO = 'PI-TEST-DISPREC';

const failedRecord = (failed) => ({
  id: 'qc-r1',
  print_item_no: NO,
  print_item_name: '處置樣本',
  passed_qty: 470,
  failed_qty: failed,
  fail_reason: '色差／偏色',
  photos: ['品檢照-處置樣本-01.jpg'],
  inspected_at: '2026-09-18 10:00',
  inspector: '郭淑芬',
});

const dispositionOf = () => usePrintItemsStore.getState().printItems[0].dispositions;
const account = () =>
  calcQualityAccount(
    usePrintItemsStore.getState().qcRecords,
    usePrintItemsStore.getState().printItems[0],
  );

const decide = (patch = {}) =>
  usePrintItemsStore.getState().decideDisposition(NO, {
    remake_decision: '一鍵補做',
    defect_handling: '報廢',
    decided_by: '吳國豪',
    note: '',
    role: 'print_manager',
    ...patch,
  });

// 起點：不通過累計 30、尚無任何處置
beforeEach(() => {
  usePrintItemsStore.setState({
    qcRecords: [failedRecord(30)],
    printItems: [{ print_item_no: NO, name: '處置樣本', dispositions: [] }],
  });
});

describe('11.28 品檢缺口處置：品檢人員沒有入口（處置操作者依工單編輯權，見 11.30）', () => {
  it('印務與印務主管有處置入口，品檢人員沒有；品檢人員直接呼叫被擋下且不寫入', () => {
    const ownWorkOrder = { access: { userName: '周建宏', workOrders: [{ owner: '周建宏' }] } };
    expect(canDecideDisposition('print_officer', ownWorkOrder.access).allowed).toBe(true);
    expect(canDecideDisposition('print_manager', { userName: '吳國豪', workOrders: [] }).allowed).toBe(true);
    expect(canDecideDisposition('qc_inspector', { userName: '郭淑芬', workOrders: [] }).allowed).toBe(false);
    const result = decide({ role: 'qc_inspector', qty: 10 });
    expect(result.ok).toBe(false);
    expect(dispositionOf()).toHaveLength(0);
  });

  it('11.30 非負責印務（不在旗下工單負責人與編輯分享成員內）直接呼叫被擋下且不寫入；負責印務與編輯分享成員通過', () => {
    const owned = [{ owner: '周建宏', shared_members: [{ name: '陳映蓉', level: 'edit' }] }];
    const blocked = decide({ role: 'print_officer', decided_by: '李佩珊', work_orders: owned, qty: 10 });
    expect(blocked.ok).toBe(false);
    expect(dispositionOf()).toHaveLength(0);
    expect(decide({ role: 'print_officer', decided_by: '周建宏', work_orders: owned, qty: 10 }).ok).toBe(true);
    expect(decide({ role: 'sales', decided_by: '陳映蓉', work_orders: owned, qty: 10 }).ok).toBe(true);
    expect(dispositionOf()).toHaveLength(2);
  });
});

describe('11.28 兩軸各自獨立選：補不補 × 瑕疵品去向，四種組合都成立', () => {
  const combos = [
    ['一鍵補做', '報廢', '補做（原工單異動加開）'],
    ['一鍵補做', '客戶照收', '補做（原工單異動加開）'],
    ['不補', '報廢', '不補（印件層結案）'],
    ['不補', '客戶照收', '不補（印件層結案）'],
  ];
  it.each(combos)('補不補選 %s、瑕疵品去向選 %s 成立並記入處置留痕', (remake, handling, decision) => {
    const result = decide({ remake_decision: remake, defect_handling: handling, qty: 5 });
    expect(result.ok).toBe(true);
    const entry = dispositionOf().at(-1);
    expect(entry.decision).toBe(decision);
    expect(entry.defect_handling).toBe(handling);
    expect(entry.qty).toBe(5);
  });
});

describe('11.28 分次處置：處置留痕逐筆列出，報廢累計逐次累加，客戶照收不讓缺口下降', () => {
  it('先報廢 20 再客戶照收 10：兩筆留痕、報廢累計 20、未處置缺口 10', () => {
    expect(account().failedUnhandled).toBe(30);
    const first = decide({ qty: 20, note: '第一筆' });
    expect(first.ok).toBe(true);
    expect(first.qty).toBe(20);
    expect(first.remaining).toBe(10);
    expect(account().scrapQty).toBe(20);
    expect(account().failedUnhandled).toBe(10);

    const second = decide({ remake_decision: '不補', defect_handling: '客戶照收', qty: 10 });
    expect(second.ok).toBe(true);
    expect(second.remaining).toBe(10);

    const rows = dispositionOf();
    expect(rows).toHaveLength(2);
    // 每筆留痕帶決策、去向、數量、決策者、時間、備註
    rows.forEach((r) => {
      expect(r.decision).toBeTruthy();
      expect(r.defect_handling).toBeTruthy();
      expect(r.qty).toBeGreaterThan(0);
      expect(r.decided_by).toBe('吳國豪');
      expect(r.decided_at).toBeTruthy();
      expect(r).toHaveProperty('note');
    });
    expect(rows[0].note).toBe('第一筆');
    expect(account().scrapQty).toBe(20);
    expect(account().failedUnhandled).toBe(10);
  });

  it('報廢類逐次累加：報廢 20 再報廢 10，報廢累計 30、缺口歸 0', () => {
    decide({ qty: 20 });
    decide({ qty: 10 });
    expect(account().scrapQty).toBe(30);
    expect(account().failedUnhandled).toBe(0);
    expect(dispositionOf()).toHaveLength(2);
  });

  it('沒有未處置缺口時不再接受處置', () => {
    decide({ qty: 30 });
    const result = decide({ qty: 1 });
    expect(result.ok).toBe(false);
    expect(dispositionOf()).toHaveLength(1);
  });
});

describe('11.29 數量檢核：只約束報廢類，報廢類合計不得大於不通過累計', () => {
  it('報廢數量等於不通過累計 30 成立', () => {
    expect(decide({ qty: 30 }).ok).toBe(true);
    expect(account().failedUnhandled).toBe(0);
  });

  it('報廢數量 31 超過不通過累計 30：整筆擋下、不靜默夾值、不寫入，訊息帶出合計與累計', () => {
    const result = decide({ qty: 31 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('不通過累計 30');
    expect(result.error).toContain('31');
    expect(dispositionOf()).toHaveLength(0);
    expect(account().scrapQty).toBe(0);
  });

  it('分次累加後超過同樣擋下：已報廢 20 再報廢 11 合計 31', () => {
    decide({ qty: 20 });
    const result = decide({ qty: 11 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain('31');
    expect(dispositionOf()).toHaveLength(1);
  });

  it('數量須為不小於 1 的整數', () => {
    expect(decide({ qty: 0 }).ok).toBe(false);
    expect(decide({ qty: 2.5 }).ok).toBe(false);
    expect(dispositionOf()).toHaveLength(0);
  });
});

describe('11.29 客戶照收不設上限，也不讓缺口下降', () => {
  it('不通過累計 30，客戶照收填 50 成立，缺口與報廢累計不動', () => {
    const result = decide({ remake_decision: '不補', defect_handling: '客戶照收', qty: 50 });
    expect(result.ok).toBe(true);
    expect(result.qty).toBe(50);
    expect(dispositionOf()[0].qty).toBe(50);
    expect(account().failedUnhandled).toBe(30);
    expect(account().scrapQty).toBe(0);
  });

  it('客戶照收超過上限後，報廢仍以未處置缺口 30 為界', () => {
    decide({ defect_handling: '客戶照收', qty: 50 });
    expect(decide({ qty: 31 }).ok).toBe(false);
    expect(decide({ qty: 30 }).ok).toBe(true);
  });

  it('處置修正與新增處置共用同一條：照收改報廢且數量超過不通過累計時擋下', () => {
    decide({ defect_handling: '客戶照收', qty: 50 });
    const id = dispositionOf()[0].id;
    const blocked = usePrintItemsStore.getState().correctDisposition(NO, id, {
      defect_handling: '報廢',
      reason: '改報廢',
      by: '吳國豪',
      role: 'print_manager',
    });
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain('不通過累計');
    expect(dispositionOf()[0].defect_handling).toBe('客戶照收');

    // 數量調到 30（等於不通過累計）同時改報廢才成立
    const allowed = usePrintItemsStore.getState().correctDisposition(NO, id, {
      defect_handling: '報廢',
      qty: 30,
      reason: '改報廢',
      by: '吳國豪',
      role: 'print_manager',
    });
    expect(allowed.ok).toBe(true);
  });
});
