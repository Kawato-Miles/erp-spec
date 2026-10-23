import { beforeEach, describe, expect, it } from 'vitest';
import { useOrdersStore } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/_lib/store.js';
import {
  canDownloadFile,
  DOWNLOADABLE_STATUSES,
  downloadCenterRows,
  finishDownloadFile,
  planPrintFiles,
  printableLogisticsNosOf,
  startDownloadFile,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/download-files.js';
import { MOCK_DOWNLOAD_FILES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/mock-data.js';
import {
  DOWNLOAD_NOT_READY_HINT,
  useQcShippingStore,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { logistics, packedShipment } from './_fixtures.mjs';

// 情境 12.51 批次列印、12.52 下載檔案狀態、12.53 下載中心的檢視與下載。
// 期望值取自 download-center spec（本 change 新增）三條 Requirement 的驗收條目。
// Prototype 不產檔（grill § 七）：下載檔案的狀態與異常內容以純函式判定，產檔出錯以 failures 參數模擬。
// 角色與入口（業務進不了下載中心）在 tests/unit/access/access-control.test.mjs 與 menu-and-roster.test.mjs。

const ORDER_NO = 'ORD-TEST-DLF';
const at = '2026-10-23 10:00';

const shipmentOf = (id, method, statuses, extra = {}) =>
  packedShipment({
    id,
    shipmentNo: id,
    orderNo: ORDER_NO,
    method,
    logisticsOrders: statuses.map((s, i) => {
      const no = `${id}-${String(i + 1).padStart(3, '0')}`;
      return s === '可出貨'
        ? logistics(no, '可出貨')
        : logistics(no, s, { tracking_no: `T-${no}`, label_file: `物流單-T-${no}.pdf` });
    }),
    ...extra,
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
const statusesOf = (shipments) => shipments.flatMap((s) => s.logistics_orders.map((l) => l.status));

// ── 12.51 批次列印 ──

describe('12.51 批次列印：依按下列印當下的涵蓋範圍決定產哪幾份、每份收哪幾筆', () => {
  it('列印新竹物流三筆已拋單物流單：建立物流單列印（3）與新竹托運總表（3）兩筆下載檔案，皆等待中、建立人與時間為這次列印；物流單狀態不變', () => {
    const shipments = [shipmentOf('SH-2026-1020', '新竹物流', ['等待出貨', '等待出貨', '等待出貨'])];
    const r = planPrintFiles({
      shipments,
      logisticsOrderNos: ['SH-2026-1020-001', 'SH-2026-1020-002', 'SH-2026-1020-003'],
      at,
      actor: '曾志偉',
    });
    expect(r.ok).toBe(true);
    expect(r.files.map((f) => f.file_type).sort()).toEqual(['新竹托運總表', '物流單列印'].sort());
    r.files.forEach((f) => {
      expect(f).toMatchObject({ status: '等待中', logistics_count: 3, created_at: at, created_by: '曾志偉', error_lines: [], file: null });
    });
    expect(statusesOf(shipments)).toEqual(['等待出貨', '等待出貨', '等待出貨']);
  });

  it('跨出貨單列印時托運總表只收已拋單者：順豐 1 筆已拋單、新竹 2 筆已拋單 1 筆可出貨 → 物流單列印 4、順豐托運總表 1、新竹托運總表 2；新竹第 3 筆只進物流單列印', () => {
    const shipments = [
      shipmentOf('SH-2026-1021', '順豐', ['等待出貨']),
      shipmentOf('SH-2026-1022', '新竹物流', ['等待出貨', '等待出貨', '可出貨']),
    ];
    const r = planPrintFiles({
      shipments,
      logisticsOrderNos: ['SH-2026-1021-001', 'SH-2026-1022-001', 'SH-2026-1022-002', 'SH-2026-1022-003'],
      at,
      actor: '曾志偉',
    });
    expect(r.files).toHaveLength(3);
    expect(byType(r.files, '物流單列印').logistics_count).toBe(4);
    expect(byType(r.files, '順豐托運總表').logistics_order_nos).toEqual(['SH-2026-1021-001']);
    expect(byType(r.files, '新竹托運總表').logistics_order_nos).toEqual(['SH-2026-1022-001', 'SH-2026-1022-002']);
    expect(byType(r.files, '物流單列印').logistics_order_nos).toContain('SH-2026-1022-003');
    expect(byType(r.files, '新竹托運總表').logistics_order_nos).not.toContain('SH-2026-1022-003');
  });

  it('按下列印之後才拋單的物流單不補進已建立的托運總表；重新列印依當下涵蓋範圍另建新的下載檔案', () => {
    seed([
      shipmentOf('SH-2026-1021', '順豐', ['等待出貨']),
      shipmentOf('SH-2026-1022', '新竹物流', ['等待出貨', '等待出貨', '可出貨']),
    ]);
    const scope = ['SH-2026-1021-001', 'SH-2026-1022-001', 'SH-2026-1022-002', 'SH-2026-1022-003'];
    const first = store().printLogistics({ logisticsOrderNos: scope, operator: '曾志偉' });
    expect(first.ok).toBe(true);
    const hct = byType(first.files, '新竹托運總表');
    expect(hct.id).toBeTruthy();
    expect(store().dispatchLogistics('SH-2026-1022', 'SH-2026-1022-003', { operator: '曾志偉' }).ok).toBe(true);
    const kept = store().downloadFiles.find((f) => f.id === hct.id);
    expect(kept.logistics_count).toBe(2);
    expect(kept.logistics_order_nos).not.toContain('SH-2026-1022-003');

    const again = store().printLogistics({ logisticsOrderNos: scope, operator: '曾志偉' });
    expect(byType(again.files, '新竹托運總表').logistics_count).toBe(3);
    expect(store().downloadFiles).toHaveLength(first.files.length + again.files.length);
  });

  it('只有順豐與新竹物流另產托運總表；7-11 交貨便、全家、專車只產物流單列印；已作廢的物流單不收', () => {
    const shipments = [
      shipmentOf('SH-T-711', '7-11 交貨便', ['等待出貨', '已作廢']),
      shipmentOf('SH-T-CAR', '專車配送', ['可出貨']),
    ];
    const r = planPrintFiles({
      shipments,
      logisticsOrderNos: ['SH-T-711-001', 'SH-T-711-002', 'SH-T-CAR-001'],
      at,
      actor: '曾志偉',
    });
    expect(r.files.map((f) => f.file_type)).toEqual(['物流單列印']);
    expect(r.files[0].logistics_order_nos).toEqual(['SH-T-711-001', 'SH-T-CAR-001']);
  });

  it('勾母列等於勾底下全部未作廢物流單；勾選範圍沒有任何未作廢物流單時不能列印', () => {
    const sh = shipmentOf('SH-T-FM', '全家', ['可出貨', '已作廢', '等待出貨']);
    expect(printableLogisticsNosOf(sh)).toEqual(['SH-T-FM-001', 'SH-T-FM-003']);
    const none = planPrintFiles({ shipments: [sh], logisticsOrderNos: ['SH-T-FM-002'], at, actor: '曾志偉' });
    expect(none.ok).toBe(false);
    expect(none.error).toBeTruthy();
  });
});

// ── 12.52 下載檔案狀態 ──

describe('12.52 下載檔案狀態：開始產檔轉處理中，產檔結束依結果轉成功、部分成功或失敗', () => {
  const waiting = (nos, type = '物流單列印') => ({
    id: 'DLF-TEST-1',
    file_type: type,
    status: '等待中',
    logistics_order_nos: nos,
    logistics_count: nos.length,
    created_at: at,
    created_by: '曾志偉',
    error_lines: [],
    file: null,
  });

  it('全部產出時轉成功：先轉處理中，結束時轉成功、異常內容為空、檔案寫入', () => {
    const shipments = [shipmentOf('SH-T-A', '新竹物流', ['等待出貨', '等待出貨', '等待出貨'])];
    const file = waiting(['SH-T-A-001', 'SH-T-A-002', 'SH-T-A-003']);
    const processing = startDownloadFile(file);
    expect(processing.status).toBe('處理中');
    const done = finishDownloadFile(processing, { shipments });
    expect(done.status).toBe('成功');
    expect(done.error_lines).toEqual([]);
    expect(done.file).toBeTruthy();
  });

  it('產檔前一筆物流單被作廢時轉部分成功：十筆中 SH-2026-0901-003 已作廢 → 異常內容一行、物流單筆數維持 10＝9＋1', () => {
    const statuses = Array.from({ length: 10 }, (_, i) => (i === 2 ? '已作廢' : '等待出貨'));
    const shipments = [shipmentOf('SH-2026-0901', '7-11 交貨便', statuses)];
    const nos = Array.from({ length: 10 }, (_, i) => `SH-2026-0901-${String(i + 1).padStart(3, '0')}`);
    const done = finishDownloadFile(startDownloadFile(waiting(nos)), { shipments });
    expect(done.status).toBe('部分成功');
    expect(done.error_lines).toEqual(['SH-2026-0901-003：物流單已作廢']);
    expect(done.logistics_count).toBe(10);
    expect(done.logistics_count).toBe(9 + done.error_lines.length);
    expect(done.file).toBeTruthy();
  });

  it('撤回確認可出貨刪除物流單後產檔轉失敗：異常內容三行「物流單編號：物流單已刪除」、檔案不寫入', () => {
    seed([shipmentOf('SH-2026-1023', '全家', ['可出貨', '可出貨', '可出貨'])]);
    const printed = store().printLogistics({
      logisticsOrderNos: ['SH-2026-1023-001', 'SH-2026-1023-002', 'SH-2026-1023-003'],
      operator: '曾志偉',
    });
    const fileId = byType(printed.files, '物流單列印').id;
    expect(store().withdrawShippable('SH-2026-1023', { operator: '范姜宏' }).ok).toBe(true);
    const r = store().processDownloadFile(fileId);
    expect(r.ok).toBe(true);
    const done = store().downloadFiles.find((f) => f.id === fileId);
    expect(done.status).toBe('失敗');
    expect(done.error_lines).toEqual([
      'SH-2026-1023-001：物流單已刪除',
      'SH-2026-1023-002：物流單已刪除',
      'SH-2026-1023-003：物流單已刪除',
    ]);
    expect(done.file).toBeNull();
  });

  it('產檔出錯的物流單記錯誤訊息原文：順豐托運總表兩筆一筆出錯 → 部分成功、異常內容一行含編號與原文', () => {
    const shipments = [
      shipmentOf('SH-T-S1', '順豐', ['等待出貨']),
      shipmentOf('SH-T-S2', '順豐', ['等待出貨']),
    ];
    const done = finishDownloadFile(startDownloadFile(waiting(['SH-T-S1-001', 'SH-T-S2-001'], '順豐托運總表')), {
      shipments,
      failures: { 'SH-T-S2-001': '物流商標籤服務逾時（code 504）' },
    });
    expect(done.status).toBe('部分成功');
    expect(done.error_lines).toEqual(['SH-T-S2-001：物流商標籤服務逾時（code 504）']);
  });

  it('缺物流商標籤的物流單照常產出：一筆還沒拋單、在可出貨 → 不寫異常內容，轉成功', () => {
    const shipments = [shipmentOf('SH-T-B', '新竹物流', ['等待出貨', '可出貨'])];
    const done = finishDownloadFile(startDownloadFile(waiting(['SH-T-B-001', 'SH-T-B-002'])), { shipments });
    expect(done.status).toBe('成功');
    expect(done.error_lines).toEqual([]);
  });

  it('失敗不重試，重新列印另建新紀錄：失敗的那一筆維持失敗；系統沒有重試與通知的動作', () => {
    const failed = { ...waiting(['SH-T-C-001'], '順豐托運總表'), status: '失敗', error_lines: ['SH-T-C-001：物流單已作廢'] };
    expect(startDownloadFile(failed)).toEqual(failed);
    expect(finishDownloadFile(failed, { shipments: [] })).toEqual(failed);

    seed([shipmentOf('SH-T-C', '順豐', ['等待出貨'])], [failed]);
    const r = store().printLogistics({ logisticsOrderNos: ['SH-T-C-001'], operator: '曾志偉' });
    expect(r.ok).toBe(true);
    expect(r.files.every((f) => f.status === '等待中')).toBe(true);
    expect(store().downloadFiles.find((f) => f.id === failed.id).status).toBe('失敗');
    expect(store().retryDownloadFile).toBeUndefined();
    expect(store().notifyDownloadFile).toBeUndefined();
  });

  it('只有成功與部分成功屬可下載', () => {
    expect([...DOWNLOADABLE_STATUSES].sort()).toEqual(['成功', '部分成功'].sort());
  });
});

// ── 12.53 下載中心的檢視與下載 ──

describe('12.53 下載中心：能進的人看全部資料列，只有可下載的狀態能下載，不刪不過期', () => {
  beforeEach(() => seed([shipmentOf('SH-T-D', '新竹物流', ['等待出貨', '等待出貨'])], []));

  it('出貨人員看得到別人建立的下載檔案：甲列印產生兩筆，下載中心列出這兩筆、建立人為甲', () => {
    store().printLogistics({ logisticsOrderNos: ['SH-T-D-001', 'SH-T-D-002'], operator: '曾志偉' });
    const rows = downloadCenterRows(store().downloadFiles);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.created_by === '曾志偉')).toBe(true);
  });

  it('成功與部分成功的檔案可下載：下載後狀態不變、可再次下載', () => {
    const ok = { id: 'D-OK', file_type: '物流單列印', status: '成功', logistics_order_nos: ['X-001'], logistics_count: 1, created_at: at, created_by: '曾志偉', error_lines: [], file: 'a.pdf' };
    const partial = { ...ok, id: 'D-PART', status: '部分成功', logistics_order_nos: ['X-001', 'X-002'], logistics_count: 2, error_lines: ['X-002：物流單已作廢'], file: 'b.pdf' };
    seed([], [ok, partial]);
    for (const f of [ok, partial]) {
      expect(canDownloadFile(f)).toBe(true);
      expect(store().downloadFile(f.id).ok).toBe(true);
      expect(store().downloadFile(f.id).ok).toBe(true);
      expect(store().downloadFiles.find((x) => x.id === f.id)).toEqual(f);
    }
  });

  it('等待中、處理中、失敗的檔案不可下載：繞過介面送出下載擋下', () => {
    const base = { file_type: '物流單列印', logistics_order_nos: ['X-001'], logistics_count: 1, created_at: at, created_by: '曾志偉', error_lines: [], file: null };
    const files = ['等待中', '處理中', '失敗'].map((status, i) => ({ ...base, id: `D-${i}`, status }));
    seed([], files);
    files.forEach((f) => {
      expect(canDownloadFile(f), f.status).toBe(false);
      const r = store().downloadFile(f.id);
      expect(r.ok, f.status).toBe(false);
      expect(r.error).toBe(DOWNLOAD_NOT_READY_HINT);
    });
  });

  it('下載檔案不刪除也不過期：2026-01-05 建立的成功檔案仍在下載中心、可下載；系統沒有刪除下載檔案的動作', () => {
    const old = MOCK_DOWNLOAD_FILES.find((f) => f.created_at.startsWith('2026-01-05'));
    expect(old).toBeTruthy();
    expect(old.status).toBe('成功');
    expect(downloadCenterRows(MOCK_DOWNLOAD_FILES).map((r) => r.id)).toContain(old.id);
    expect(canDownloadFile(old)).toBe(true);
    expect(store().deleteDownloadFile).toBeUndefined();
  });

  it('下載中心依建立時間新到舊排列，可依檔案類型、狀態、建立人篩選', () => {
    const rows = downloadCenterRows(MOCK_DOWNLOAD_FILES);
    const times = rows.map((r) => r.created_at);
    expect(times).toEqual([...times].sort().reverse());
    const sf = downloadCenterRows(MOCK_DOWNLOAD_FILES, { fileType: '順豐托運總表' });
    expect(sf.every((r) => r.file_type === '順豐托運總表')).toBe(true);
    const failed = downloadCenterRows(MOCK_DOWNLOAD_FILES, { status: '失敗' });
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((r) => r.status === '失敗')).toBe(true);
    const mine = downloadCenterRows(MOCK_DOWNLOAD_FILES, { createdBy: '曾志偉' });
    expect(mine.every((r) => r.created_by === '曾志偉')).toBe(true);
  });

  it('下載檔案模擬資料：五種狀態各至少一筆、建立人有兩位出貨人員、部分成功與失敗附異常內容', () => {
    ['等待中', '處理中', '成功', '部分成功', '失敗'].forEach((s) => {
      expect(MOCK_DOWNLOAD_FILES.some((f) => f.status === s), s).toBe(true);
    });
    expect(new Set(MOCK_DOWNLOAD_FILES.map((f) => f.created_by)).size).toBeGreaterThanOrEqual(2);
    MOCK_DOWNLOAD_FILES.filter((f) => ['部分成功', '失敗'].includes(f.status)).forEach((f) => {
      expect(f.error_lines.length, f.id).toBeGreaterThan(0);
      f.error_lines.forEach((line) => expect(line, f.id).toMatch(/^SH-2026-\d{4}-\d{3}：.+/));
    });
    MOCK_DOWNLOAD_FILES.forEach((f) => {
      expect(f.logistics_count, f.id).toBe(f.logistics_order_nos.length);
      expect(Boolean(f.file), f.id).toBe(DOWNLOADABLE_STATUSES.includes(f.status));
    });
  });
});
