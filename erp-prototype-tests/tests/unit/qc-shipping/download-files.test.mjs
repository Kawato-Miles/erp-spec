import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  canDownloadFile,
  DOWNLOAD_FILE_RETENTION_DAYS,
  DOWNLOAD_FILE_STATUS,
  DOWNLOADABLE_STATUSES,
  downloadCenterRows,
  finishDownloadFile,
  isDownloadFileExpired,
  planPrintFiles,
  selectableLogisticsIdsOf,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/download-files.js';
import { MOCK_DOWNLOAD_FILES, MOCK_SHIPMENTS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  DOWNLOAD_NOT_READY_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { dispatched, logistics, packedShipment, undispatched } from './_fixtures.mjs';

// 情境 12.51 批次列印、12.52 下載檔案狀態、12.53 下載中心的檢視與下載、12.59 保存 7 天與只印拋單成功。
// 對齊後端第一版（Miles 2026-10-27 拍板）：下載檔案沒有等待中，建立即為處理中；只能列印拋單成功的物流單，
// 勾選範圍內任一筆不能列印就整批不受理；檔案保存 7 天；有入口的人看得到全部人的紀錄，也可只篩自己的。
// Prototype 不產檔：下載檔案的狀態與異常內容以純函式判定，產檔出錯以 failures 參數（以物流單內部識別為鍵）模擬。
// 角色與入口（業務進不了下載中心）在 tests/unit/access/access-control.test.mjs 與 menu-and-roster.test.mjs。

const ORDER_NO = 'ORD-TEST-DLF';
const pad2 = (n) => String(n).padStart(2, '0');
const stampOf = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
// 下載檔案的建立時間取當下，才落在 7 天保存期限內（store 的下載以當下時間判期限）
const at = stampOf(new Date());

/**
 * 一張出貨單，specs 逐筆指定物流單：'d'＝拋單成功（物流單號 T-<我方自編單號>）、'u'＝未拋單、'v'＝已作廢（拋單成功後作廢）。
 * 物流單內部識別與我方自編單號取同一個值：<出貨單編號>-01、-02…
 */
const shipmentOf = (no, method, specs) =>
  packedShipment({
    id: no,
    shipmentNo: no,
    orderNo: ORDER_NO,
    method,
    logisticsOrders: specs.map((s, i) => {
      const id = `${no}-${pad2(i + 1)}`;
      if (s === 'u') return undispatched(id);
      if (s === 'v') return dispatched(id, { cargo_status: '已作廢', label_file: `物流單-T-${id}.pdf` });
      return dispatched(id, { label_file: `物流單-T-${id}.pdf` });
    }),
  });

const seed = (shipments, downloadFiles = []) => {
  useOrdersStore.setState({
    orders: [
      { id: 'ord-test-dlf', order_no: ORDER_NO, client_name: '樣本客戶', status: '出貨中', activities: [], print_items: [] },
    ],
  });
  useQcShippingStore.setState({ shipments, downloadFiles });
};

const store = () => useQcShippingStore.getState();
const byType = (files, type) => files.find((f) => f.file_type === type);
const stateOf = (shipments) =>
  shipments.flatMap((s) => s.logistics_orders.map((l) => `${l.dispatch_status}/${l.cargo_status}`));

// ── 12.51 批次列印 ──

describe('12.51 批次列印：依按下列印當下的涵蓋範圍決定產哪幾份、每份收哪幾筆', () => {
  it('列印新竹物流三筆拋單成功的物流單：建立物流單列印（3）與新竹托運總表（3）兩筆下載檔案，皆處理中、建立人與時間為這次列印；物流單的拋單狀態與貨態不變', () => {
    const shipments = [shipmentOf('SH-2026-10-20001', '新竹物流', ['d', 'd', 'd'])];
    const ids = ['SH-2026-10-20001-01', 'SH-2026-10-20001-02', 'SH-2026-10-20001-03'];
    const r = planPrintFiles({ shipments, logisticsIds: ids, at, actor: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.files.map((f) => f.file_type).sort()).toEqual(['新竹托運總表', '物流單列印'].sort());
    r.files.forEach((f) => {
      expect(f).toMatchObject({
        status: '處理中',
        logistics_ids: ids,
        logistics_count: 3,
        created_at: at,
        created_by: '曾志偉',
        error_lines: [],
        file: null,
      });
    });
    expect(stateOf(shipments)).toEqual(Array(3).fill('拋單成功/待出貨'));
  });

  it('跨出貨單列印：順豐 1 筆、新竹物流 2 筆皆拋單成功 → 物流單列印 3、順豐托運總表 1、新竹托運總表 2', () => {
    const shipments = [
      shipmentOf('SH-2026-10-21001', '順豐', ['d']),
      shipmentOf('SH-2026-10-22001', '新竹物流', ['d', 'd']),
    ];
    const r = planPrintFiles({
      shipments,
      logisticsIds: ['SH-2026-10-21001-01', 'SH-2026-10-22001-01', 'SH-2026-10-22001-02'],
      at,
      actor: '曾志偉',
    });
    expect(r.files).toHaveLength(3);
    expect(byType(r.files, '物流單列印').logistics_count).toBe(3);
    expect(byType(r.files, '順豐托運總表').logistics_ids).toEqual(['SH-2026-10-21001-01']);
    expect(byType(r.files, '新竹托運總表').logistics_ids).toEqual(['SH-2026-10-22001-01', 'SH-2026-10-22001-02']);
  });

  it('按下列印之後才作廢的物流單不回頭改已建立的下載檔案；重新列印依當下勾選範圍另建新的下載檔案', () => {
    seed([shipmentOf('SH-2026-10-22001', '新竹物流', ['d', 'd'])]);
    const scope = ['SH-2026-10-22001-01', 'SH-2026-10-22001-02'];
    const first = store().printLogistics({ logisticsIds: scope, operator: '曾志偉' });
    expect(first.ok).toBe(true);
    const hct = byType(first.files, '新竹托運總表');
    expect(hct.id).toBeTruthy();
    expect(
      store().voidLogistics('SH-2026-10-22001', 'SH-2026-10-22001-02', { reason: '客戶改單', operator: '業務甲' }).ok,
    ).toBe(true);
    const kept = store().downloadFiles.find((f) => f.id === hct.id);
    expect(kept.logistics_count).toBe(2);
    expect(kept.logistics_ids).toEqual(scope);

    const again = store().printLogistics({ logisticsIds: ['SH-2026-10-22001-01'], operator: '曾志偉' });
    expect(again.ok).toBe(true);
    expect(byType(again.files, '新竹托運總表').logistics_count).toBe(1);
    expect(store().downloadFiles).toHaveLength(first.files.length + again.files.length);
  });

  it('只有順豐與新竹物流另產托運總表；7-11 交貨便、全家只產物流單列印', () => {
    const shipments = [
      shipmentOf('SH-2026-10-23001', '7-11 交貨便', ['d']),
      shipmentOf('SH-2026-10-23002', '全家', ['d']),
    ];
    const r = planPrintFiles({
      shipments,
      logisticsIds: ['SH-2026-10-23001-01', 'SH-2026-10-23002-01'],
      at,
      actor: '曾志偉',
    });
    expect(r.files.map((f) => f.file_type)).toEqual(['物流單列印']);
    expect(r.files[0].logistics_ids).toEqual(['SH-2026-10-23001-01', 'SH-2026-10-23002-01']);
  });

  it('勾母列等於勾底下全部未作廢物流單；沒有勾選任何物流單時不能列印', () => {
    const sh = shipmentOf('SH-2026-10-24001', '全家', ['d', 'v', 'u']);
    expect(selectableLogisticsIdsOf(sh)).toEqual(['SH-2026-10-24001-01', 'SH-2026-10-24001-03']);
    const none = planPrintFiles({ shipments: [sh], logisticsIds: [], at, actor: '曾志偉' });
    expect(none.ok).toBe(false);
    expect(none.error).toBeTruthy();
    expect(none.files).toEqual([]);
  });
});

// ── 12.52 下載檔案狀態 ──

describe('12.52 下載檔案狀態：沒有等待中，建立即為處理中，產檔結束依結果轉成功、部分成功或失敗', () => {
  const processing = (ids, type = '物流單列印') => ({
    id: 'DLF-TEST-1',
    file_type: type,
    status: '處理中',
    logistics_ids: ids,
    logistics_count: ids.length,
    created_at: at,
    created_by: '曾志偉',
    error_lines: [],
    file: null,
  });

  it('下載檔案狀態只有處理中、成功、部分成功、失敗四種，沒有等待中', () => {
    expect(Object.values(DOWNLOAD_FILE_STATUS).sort()).toEqual(['處理中', '成功', '部分成功', '失敗'].sort());
  });

  it('全部產出時由處理中直接轉成功：異常內容為空、檔案寫入', () => {
    seed([shipmentOf('SH-2026-10-20001', '新竹物流', ['d', 'd', 'd'])]);
    const printed = store().printLogistics({
      logisticsIds: ['SH-2026-10-20001-01', 'SH-2026-10-20001-02', 'SH-2026-10-20001-03'],
      operator: '曾志偉',
    });
    const fileId = byType(printed.files, '物流單列印').id;
    expect(store().downloadFiles.find((f) => f.id === fileId).status).toBe('處理中');
    expect(store().processDownloadFile(fileId).ok).toBe(true);
    const done = store().downloadFiles.find((f) => f.id === fileId);
    expect(done.status).toBe('成功');
    expect(done.error_lines).toEqual([]);
    expect(done.file).toBeTruthy();
  });

  it('產檔前一筆物流單被作廢時轉部分成功：十筆中第 3 筆已作廢 → 異常內容一行、以物流單號開頭，物流單筆數維持 10＝9＋1', () => {
    const specs = Array.from({ length: 10 }, (_, i) => (i === 2 ? 'v' : 'd'));
    const shipments = [shipmentOf('SH-2026-09-01001', '7-11 交貨便', specs)];
    const ids = Array.from({ length: 10 }, (_, i) => `SH-2026-09-01001-${pad2(i + 1)}`);
    const done = finishDownloadFile(processing(ids), { shipments });
    expect(done.status).toBe('部分成功');
    expect(done.error_lines).toEqual(['T-SH-2026-09-01001-03：物流單已作廢']);
    expect(done.logistics_count).toBe(10);
    expect(done.logistics_count).toBe(9 + done.error_lines.length);
    expect(done.file).toBeTruthy();
  });

  it('全部物流單都產不出時轉失敗、檔案不寫入', () => {
    const shipments = [shipmentOf('SH-2026-10-23001', '全家', ['v', 'v'])];
    const done = finishDownloadFile(processing(['SH-2026-10-23001-01', 'SH-2026-10-23001-02']), { shipments });
    expect(done.status).toBe('失敗');
    expect(done.error_lines).toEqual([
      'T-SH-2026-10-23001-01：物流單已作廢',
      'T-SH-2026-10-23001-02：物流單已作廢',
    ]);
    expect(done.file).toBeNull();
  });

  it('產檔出錯的物流單記錯誤訊息原文：順豐托運總表兩筆一筆出錯 → 部分成功、異常內容一行以物流單號開頭並附原文', () => {
    const shipments = [
      shipmentOf('SH-2026-10-21001', '順豐', ['d']),
      shipmentOf('SH-2026-10-21002', '順豐', ['d']),
    ];
    const done = finishDownloadFile(processing(['SH-2026-10-21001-01', 'SH-2026-10-21002-01'], '順豐托運總表'), {
      shipments,
      failures: { 'SH-2026-10-21002-01': '物流商標籤服務逾時（code 504）' },
    });
    expect(done.status).toBe('部分成功');
    expect(done.error_lines).toEqual(['T-SH-2026-10-21002-01：物流商標籤服務逾時（code 504）']);
  });

  it('失敗不重試，重新列印另建新紀錄：失敗的那一筆維持失敗；系統沒有重試與通知的動作', () => {
    const failed = {
      ...processing(['SH-2026-10-21003-01'], '順豐托運總表'),
      status: '失敗',
      error_lines: ['T-SH-2026-10-21003-01：產檔服務回應逾時，請重新列印'],
    };
    expect(finishDownloadFile(failed, { shipments: [] })).toEqual(failed);

    seed([shipmentOf('SH-2026-10-21003', '順豐', ['d'])], [failed]);
    const r = store().printLogistics({ logisticsIds: ['SH-2026-10-21003-01'], operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.files.every((f) => f.status === '處理中')).toBe(true);
    expect(store().downloadFiles.find((f) => f.id === failed.id).status).toBe('失敗');
    expect(store().retryDownloadFile).toBeUndefined();
    expect(store().notifyDownloadFile).toBeUndefined();
  });

  it('只有成功與部分成功屬可下載', () => {
    expect([...DOWNLOADABLE_STATUSES].sort()).toEqual(['成功', '部分成功'].sort());
  });
});

// ── 12.53 下載中心的檢視與下載 ──

describe('12.53 下載中心：有入口的人看全部人的紀錄、可只篩自己的，只有可下載的狀態能下載', () => {
  beforeEach(() => seed([shipmentOf('SH-2026-10-25001', '新竹物流', ['d', 'd'])], []));

  it('有入口的人看得到全部人的紀錄，也可用建立人篩選只看自己的：甲、乙各列印一次，下載中心兩人的都列出；篩甲只剩甲的', () => {
    store().printLogistics({ logisticsIds: ['SH-2026-10-25001-01'], operator: '曾志偉' });
    store().printLogistics({ logisticsIds: ['SH-2026-10-25001-02'], operator: '江俊賢' });
    const rows = downloadCenterRows(store().downloadFiles);
    expect(rows).toHaveLength(4);
    expect(new Set(rows.map((r) => r.created_by))).toEqual(new Set(['曾志偉', '江俊賢']));
    const mine = downloadCenterRows(store().downloadFiles, { createdBy: '曾志偉' });
    expect(mine).toHaveLength(2);
    expect(mine.every((r) => r.created_by === '曾志偉')).toBe(true);
  });

  it('成功與部分成功的檔案可下載：下載後狀態不變、可再次下載', () => {
    const ok = { id: 'D-OK', file_type: '物流單列印', status: '成功', logistics_ids: ['X-01'], logistics_count: 1, created_at: at, created_by: '曾志偉', error_lines: [], file: 'a.pdf' };
    const partial = { ...ok, id: 'D-PART', status: '部分成功', logistics_ids: ['X-01', 'X-02'], logistics_count: 2, error_lines: ['T-X-02：物流單已作廢'], file: 'b.pdf' };
    seed([], [ok, partial]);
    for (const f of [ok, partial]) {
      expect(canDownloadFile(f)).toBe(true);
      expect(store().downloadFile(f.id).ok).toBe(true);
      expect(store().downloadFile(f.id).ok).toBe(true);
      expect(store().downloadFiles.find((x) => x.id === f.id)).toEqual(f);
    }
  });

  it('處理中、失敗的檔案不可下載：繞過介面送出下載擋下', () => {
    const base = { file_type: '物流單列印', logistics_ids: ['X-01'], logistics_count: 1, created_at: at, created_by: '曾志偉', error_lines: [], file: null };
    const files = ['處理中', '失敗'].map((status, i) => ({ ...base, id: `D-${i}`, status }));
    seed([], files);
    files.forEach((f) => {
      expect(canDownloadFile(f), f.status).toBe(false);
      const r = store().downloadFile(f.id);
      expect(r.ok, f.status).toBe(false);
      expect(r.error).toBe(DOWNLOAD_NOT_READY_HINT);
    });
  });

  it('下載中心依建立時間新到舊排列，可依檔案類型、狀態、建立人篩選', () => {
    const rows = downloadCenterRows(MOCK_DOWNLOAD_FILES);
    const times = rows.map((r) => r.created_at);
    expect(times).toEqual([...times].sort().reverse());
    const sf = downloadCenterRows(MOCK_DOWNLOAD_FILES, { fileType: '順豐托運總表' });
    expect(sf.length).toBeGreaterThan(0);
    expect(sf.every((r) => r.file_type === '順豐托運總表')).toBe(true);
    const failed = downloadCenterRows(MOCK_DOWNLOAD_FILES, { status: '失敗' });
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((r) => r.status === '失敗')).toBe(true);
    const mine = downloadCenterRows(MOCK_DOWNLOAD_FILES, { createdBy: '曾志偉' });
    expect(mine.every((r) => r.created_by === '曾志偉')).toBe(true);
  });

  it('下載檔案模擬資料：狀態只用處理中、成功、部分成功、失敗；建立人有兩位出貨人員；失敗附異常內容且以物流單號開頭；全部在保存期限內', () => {
    MOCK_DOWNLOAD_FILES.forEach((f) => {
      expect(['處理中', '成功', '部分成功', '失敗'], f.id).toContain(f.status);
    });
    ['處理中', '成功', '失敗'].forEach((s) => {
      expect(MOCK_DOWNLOAD_FILES.some((f) => f.status === s), s).toBe(true);
    });
    expect(new Set(MOCK_DOWNLOAD_FILES.map((f) => f.created_by)).size).toBeGreaterThanOrEqual(2);
    const trackingNos = MOCK_SHIPMENTS.flatMap((sh) => sh.logistics_orders ?? []).map((l) => l.tracking_no).filter(Boolean);
    MOCK_DOWNLOAD_FILES.filter((f) => ['部分成功', '失敗'].includes(f.status)).forEach((f) => {
      expect(f.error_lines.length, f.id).toBeGreaterThan(0);
      f.error_lines.forEach((line) => {
        const [head] = line.split('：');
        expect(trackingNos, f.id).toContain(head);
      });
    });
    MOCK_DOWNLOAD_FILES.forEach((f) => {
      expect(f.logistics_count, f.id).toBe(f.logistics_ids.length);
      expect(Boolean(f.file), f.id).toBe(DOWNLOADABLE_STATUSES.includes(f.status));
    });
    expect(downloadCenterRows(MOCK_DOWNLOAD_FILES)).toHaveLength(MOCK_DOWNLOAD_FILES.length);
  });
});

// ── 12.59 下載檔案保存 7 天、只能列印拋單成功的物流單 ──

describe('12.59 下載檔案保存 7 天、只能列印拋單成功的物流單', () => {
  const file = {
    id: 'D-RET',
    file_type: '物流單列印',
    status: '成功',
    logistics_ids: ['X-01'],
    logistics_count: 1,
    created_at: '2026-10-20 10:00',
    created_by: '曾志偉',
    error_lines: [],
    file: 'x.pdf',
  };
  const exactlySeven = new Date(2026, 9, 27, 10, 0);
  const pastSeven = new Date(2026, 9, 27, 10, 1);

  it('保存天數為 7 天', () => {
    expect(DOWNLOAD_FILE_RETENTION_DAYS).toBe(7);
  });

  it('建立後剛好 7 天仍在保存期限內：未過期、可下載、下載中心列得出來', () => {
    expect(isDownloadFileExpired(file, exactlySeven)).toBe(false);
    expect(canDownloadFile(file, exactlySeven)).toBe(true);
    expect(downloadCenterRows([file], { now: exactlySeven }).map((f) => f.id)).toEqual(['D-RET']);
  });

  it('超過 7 天即過期：不能下載、下載中心不再列出', () => {
    expect(isDownloadFileExpired(file, pastSeven)).toBe(true);
    expect(canDownloadFile(file, pastSeven)).toBe(false);
    expect(downloadCenterRows([file], { now: pastSeven })).toEqual([]);
  });

  it('過期的成功檔案繞過介面送出下載擋下', () => {
    const old = { ...file, created_at: stampOf(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)) };
    seed([], [old]);
    const r = store().downloadFile(old.id);
    expect(r.ok).toBe(false);
    expect(r.error).toBe(DOWNLOAD_NOT_READY_HINT);
  });

  it('勾選範圍內有一筆未拋單：整批不受理、不建立任何下載檔案，訊息列出那一筆的我方自編單號', () => {
    seed([shipmentOf('SH-2026-10-26001', '新竹物流', ['d', 'd', 'u'])]);
    const r = store().printLogistics({
      logisticsIds: ['SH-2026-10-26001-01', 'SH-2026-10-26001-02', 'SH-2026-10-26001-03'],
      operator: '曾志偉',
    });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('只能列印拋單成功的物流單，整批不受理：SH-2026-10-26001-03');
    expect(store().downloadFiles).toEqual([]);
  });

  it('拋單失敗、已作廢、自取專車其他（沒有拋單狀態）的物流單都不能列印，整批不受理', () => {
    const failed = packedShipment({
      id: 'SH-2026-10-26002',
      shipmentNo: 'SH-2026-10-26002',
      orderNo: ORDER_NO,
      method: '順豐',
      logisticsOrders: [logistics('SH-2026-10-26002-01', '待出貨', { dispatch_status: '拋單失敗', dispatch_error: '物流商拒收' })],
    });
    const voided = shipmentOf('SH-2026-10-26003', '全家', ['v']);
    const car = packedShipment({
      id: 'SH-2026-10-26004',
      shipmentNo: 'SH-2026-10-26004',
      orderNo: ORDER_NO,
      method: '專車配送',
      logisticsOrders: [undispatched('SH-2026-10-26004-01')],
    });
    const ok = shipmentOf('SH-2026-10-26005', '全家', ['d']);
    const shipments = [failed, voided, car, ok];
    for (const id of ['SH-2026-10-26002-01', 'SH-2026-10-26003-01', 'SH-2026-10-26004-01']) {
      const r = planPrintFiles({ shipments, logisticsIds: ['SH-2026-10-26005-01', id], at, actor: '曾志偉' });
      expect(r.ok, id).toBe(false);
      expect(r.files, id).toEqual([]);
      expect(r.error, id).toMatch(/^只能列印拋單成功的物流單，整批不受理：/);
    }
    expect(planPrintFiles({ shipments, logisticsIds: ['SH-2026-10-26005-01'], at, actor: '曾志偉' }).ok).toBe(true);
  });
});
