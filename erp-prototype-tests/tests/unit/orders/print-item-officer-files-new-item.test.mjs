// 情境 4.17（加開印件的新印件不帶入印務印件檔案與檔案備註）與 5.17（打樣結果判 NG-稿件問題後
// 棄用重建的新印件同樣不帶入，原印件的值留在原印件）。
// 規格：order-management spec § 加開印件（複製原印件規格）、prepress-review spec § 打樣後棄用原印件建新印件
//（change officer-files-to-print-item）。起點資料：鏈七 PI-2026-0904（兩份印務印件檔案、一則檔案備註）。
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
