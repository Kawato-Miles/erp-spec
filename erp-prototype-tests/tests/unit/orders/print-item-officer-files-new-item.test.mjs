// 情境 4.17（加開印件的新印件不帶入印務印件檔案與檔案備註）與 5.17（打樣結果判 NG-稿件問題後
// 棄用重建的新印件同樣不帶入，原印件的值留在原印件）。
// 規格：order-management spec § 加開印件（複製原印件規格）、prepress-review spec § 打樣後棄用原印件建新印件
//（change officer-files-to-print-item；印件複製規則見 change print-item-copy-rule）。
// 起點資料：鏈七 PI-2026-0904（兩份印務印件檔案、一則檔案備註）；
// 鏈外 ORD-2026-0817 PI-2026-0872（打樣印件、已送達、審稿已確認可製作、稿件上傳開放為否、打樣結果 OK）。
import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';

const ORDER_ID = 'ORD-2026-0904';
const SOURCE_ID = 'pi-2026-0904';

const initialState = useOrdersStore.getState();
const orderOf = () => useOrdersStore.getState().orders.find((o) => o.id === ORDER_ID);
const itemOf = (predicate) => orderOf().print_items.find(predicate);
const source = () => itemOf((p) => p.id === SOURCE_ID);

beforeEach(() => {
  useOrdersStore.setState(initialState, true);
});

describe('起點資料', () => {
  it('鏈七 PI-2026-0904 帶兩份印務印件檔案與一則檔案備註', () => {
    expect(source().officer_files).toHaveLength(2);
    expect(source().file_note).not.toBe('');
  });
});

describe('4.17 加開印件的新印件，印務印件檔案與檔案備註為空', () => {
  it('複製 PI-2026-0904 規格加開：新印件兩欄為空，來源印件不被改動', () => {
    const before = source();
    const count = orderOf().print_items.length;
    useOrdersStore.getState().addPrintItem(ORDER_ID, {
      name: '促銷立牌 A1（第二批）',
      type: '大貨印件',
      copy_from_id: SOURCE_ID,
      // 訂單已離開草稿：加開存檔必填印件預計交期（order-management spec § 印件預計交期依階段必填檢核）
      expected_delivery_date: '2026-11-20',
    });
    const items = orderOf().print_items;
    expect(items).toHaveLength(count + 1);
    const added = items[items.length - 1];
    expect(added.officer_files).toEqual([]);
    expect(added.file_note).toBe('');
    expect(source().officer_files).toEqual(before.officer_files);
    expect(source().file_note).toBe(before.file_note);
  });
});

describe('5.17 打樣結果判 NG-稿件問題後棄用重建，新印件兩欄為空', () => {
  it('系統複製的新印件兩欄為空；原印件的檔案與備註留在原印件', () => {
    const before = source();
    const result = useOrdersStore.getState().copyPrintItemForSampleArtworkNg(ORDER_ID, SOURCE_ID);
    expect(result.ok).toBe(true);
    const created = itemOf((p) => p.print_item_no === result.printItemNo);
    expect(created.derived_from_print_item_id).toBe('PI-2026-0904');
    expect(created.officer_files).toEqual([]);
    expect(created.file_note).toBe('');
    expect(source().officer_files).toEqual(before.officer_files);
    expect(source().file_note).toBe(before.file_note);
  });
});

// 5.17（print-item-copy-rule 改寫）：prepress-review spec Scenario「複製保留業務屬性、重設審稿與印製維度」
// 「棄用重建不在備註加註來由」「新印件不繼承原印件的免審值」。
describe('5.17 打樣重建依印件複製規則：內容帶入、歷程回到初始值、免審稿為否、備註不加註', () => {
  const SAMPLE_ORDER = 'ORD-2026-0817';
  const SAMPLE_ID = 'pi-2026-0872';
  const sampleOrder = () => useOrdersStore.getState().orders.find((o) => o.id === SAMPLE_ORDER);
  const sampleSource = () => sampleOrder().print_items.find((p) => p.id === SAMPLE_ID);
  // 只為本條改來源印件的欄位（mock 不動）：出貨方式與訂單不同、免審稿為是
  const patchSource = (patch) =>
    useOrdersStore.setState((st) => ({
      orders: st.orders.map((o) =>
        o.id !== SAMPLE_ORDER
          ? o
          : { ...o, print_items: o.print_items.map((p) => (p.id === SAMPLE_ID ? { ...p, ...patch } : p)) },
      ),
    }));
  const rebuild = () => {
    const res = useOrdersStore.getState().copyPrintItemForSampleArtworkNg(SAMPLE_ORDER, SAMPLE_ID);
    expect(res.ok).toBe(true);
    return sampleOrder().print_items.find((p) => p.print_item_no === res.printItemNo);
  };

  it('內容類帶入：印件屬性、購買數量、難易度、規格備註、製程說明、品檢需求、出貨方式取原印件的值', () => {
    // 訂單的出貨方式是自取；原印件改成專車配送，新印件要跟原印件走
    patchSource({ shipping_method: '專車配送' });
    const created = rebuild();
    expect(created).toMatchObject({
      type: '打樣印件',
      ordered_qty: 2,
      difficulty_level: 3,
      spec_notes: 'A1 珍珠板 5mm 單面四色',
      process_note: '珍珠板 5mm 單面四色直噴，裁切成型。',
      qc_requirement: '色差比對打樣色票。',
      shipping_method: '專車配送',
    });
  });

  it('歷程回到初始值：審稿待分派、打樣結果待確認、印製等待中、稿件上傳開放為是；衍生來源印件指回原印件', () => {
    expect(sampleSource().artwork_upload_open).toBe(false);
    const created = rebuild();
    expect(created).toMatchObject({
      review_status: '待分派',
      assigned_reviewer_id: null,
      sample_result: '待確認',
      print_item_status: '等待中',
      artwork_upload_open: true,
      review_rounds: [],
      files: [],
      current_round_id: null,
      officer_files: [],
      file_note: '',
      derived_from_print_item_id: 'PI-2026-0872',
    });
  });

  it('原印件免審稿為是：新印件免審稿為否，停在待分派、不自動建合格輪次', () => {
    patchSource({ skip_review: true });
    const created = rebuild();
    expect(created.skip_review).toBe(false);
    expect(created.review_status).toBe('待分派');
    expect(created.review_rounds).toEqual([]);
  });

  it('原印件與新印件的規格備註都不加註棄用或重建說明', () => {
    const before = sampleSource();
    const created = rebuild();
    expect(sampleSource().spec_notes).toBe('A1 珍珠板 5mm 單面四色');
    expect(created.spec_notes).toBe('A1 珍珠板 5mm 單面四色');
    expect(created.packaging_notes).toBe(before.packaging_notes);
    expect(created.file_notes).toBe(before.file_notes);
    expect(created.staff_notes).toBe(before.staff_notes);
  });
});

describe('印務印件檔案寫在印件上，移除不限上傳者', () => {
  it('上傳、改備註、移除他人上傳的檔案都寫入同一件印件', () => {
    const store = useOrdersStore.getState();
    store.uploadPrintItemOfficerFiles(
      ORDER_ID,
      SOURCE_ID,
      [{ file_name: '促銷立牌A1-燙金位置圖.pdf', file_url: null }],
      '蔡明修',
    );
    expect(source().officer_files.map((f) => f.file_name)).toContain('促銷立牌A1-燙金位置圖.pdf');
    expect(source().officer_files).toHaveLength(3);

    store.updatePrintItemFileNote(ORDER_ID, SOURCE_ID, '燙金只做封面');
    expect(source().file_note).toBe('燙金只做封面');

    // 移除第一份（由別人上傳），同一件印件上不再列出
    const firstId = source().officer_files[0].id;
    store.removePrintItemOfficerFile(ORDER_ID, SOURCE_ID, firstId);
    expect(source().officer_files.map((f) => f.id)).not.toContain(firstId);
    expect(source().officer_files).toHaveLength(2);
  });

  it('上傳印務印件檔案不建立審稿輪次、不改審稿狀態與當前合格輪次', () => {
    const before = source();
    useOrdersStore
      .getState()
      .uploadPrintItemOfficerFiles(ORDER_ID, SOURCE_ID, [{ file_name: '參考檔.pdf' }], '周建宏');
    expect(source().review_rounds).toEqual(before.review_rounds);
    expect(source().files).toEqual(before.files);
    expect(source().review_status).toBe(before.review_status);
    expect(source().current_round_id).toBe(before.current_round_id);
  });
});
