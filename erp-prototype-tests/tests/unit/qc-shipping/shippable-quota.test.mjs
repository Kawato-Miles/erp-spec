import { describe, expect, it } from 'vitest';
import {
  calcShippableQty,
  calcShippedQty,
  detailsTotalQty,
  validateShipmentQuota,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/qc-shipping/_lib/store.js';
import { departed, dispatched, packedShipment, undispatched } from './_fixtures.mjs';

// 情境 12.2「額度即時檢核並整張擋下」與 12.4「回報總數與明細數量並排」的數字驗算
// （畫面呈現另在 e2e 12.2、12.4 驗）。
// 可出貨額度＝完工良品數 − 累計已出貨數量（Σ 單張佔用量）；只有已作廢的出貨單退出佔用，
// 異常的出貨單仍佔用、不回補；回補只發生在作廢物流單（未送達數量）與作廢出貨單（整張）。

const printItem = { print_item_no: 'PI-2026-0820' };
const qcRecords = [{ print_item_no: 'PI-2026-0820', passed_qty: 480, failed_qty: 20 }];

const shipment = (id, status, qty) => ({
  id,
  status,
  order_no: 'ORD-2026-0820',
  details: [{ print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty }],
});

// 草稿的印件與數量存在 planned_details、正式明細為空：額度是建立那一刻才被吃掉的
const draft = (id, qty) => ({
  id,
  status: '草稿',
  order_no: 'ORD-2026-0820',
  details: [],
  planned_details: [
    { print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty },
  ],
});

describe('可出貨額度', () => {
  it('沒有出貨單時額度等於完工良品數', () => {
    expect(calcShippableQty(printItem, [], qcRecords)).toBe(480);
  });

  it('尚未離廠的出貨單也算佔用', () => {
    const shipments = [shipment('sh-1', '未處理', 200)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(280);
  });

  it('已作廢的出貨單退出佔用、額度回補', () => {
    const shipments = [shipment('sh-1', '已作廢', 200), shipment('sh-2', '已作廢', 100)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(480);
  });

  it('異常的出貨單仍佔用、不回補（回補只在作廢物流單或作廢出貨單）', () => {
    const abnormal = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [departed('SH-1-01', '例外事故', { exception_source: 'manual' })],
    });
    expect(calcShippableQty(printItem, [abnormal], qcRecords)).toBe(280);
  });

  it('作廢物流單填的未送達數量回補額度：單張佔用量＝明細數量 − 未送達合計', () => {
    const sh = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [
        departed('SH-1-01', '已作廢', {
          undelivered: [{ print_item_no: 'PI-2026-0820', qty: 60 }],
        }),
        dispatched('SH-1-02'),
      ],
    });
    expect(calcShippableQty(printItem, [sh], qcRecords)).toBe(480 - 140);
  });

  it('改某張單的明細數量時，本單原有的佔用先還回來當增量基準', () => {
    const shipments = [shipment('sh-1', '未處理', 200)];
    expect(calcShippableQty(printItem, shipments, qcRecords, 'sh-1')).toBe(480);
  });

  // 情境 12.2：草稿不佔額度——兩張草稿各填 500，印件的可出貨額度不動
  it('草稿的預計出貨印件不佔額度，開幾張都不動', () => {
    const shipments = [draft('sh-d1', 500), draft('sh-d2', 500)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(480);
  });

  it('草稿建立為出貨單、數量轉為正式明細之後才佔額度', () => {
    const shipments = [shipment('sh-d1', '未處理', 400)];
    expect(calcShippableQty(printItem, shipments, qcRecords)).toBe(80);
  });
});

describe('建單額度檢核', () => {
  it('任一條明細超額即整張擋下，並逐筆帶出當下額度', () => {
    const result = validateShipmentQuota({
      details: [
        { print_item_no: 'PI-2026-0820', name: '《山城記事》精裝書（128 頁）', qty: 600 },
      ],
      shipments: [],
      qcRecords,
    });
    expect(result.ok).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].quota).toBe(480);
  });

  it('填在額度內即通過', () => {
    const result = validateShipmentQuota({
      details: [{ print_item_no: 'PI-2026-0820', name: '精裝書', qty: 480 }],
      shipments: [],
      qcRecords,
    });
    expect(result.ok).toBe(true);
  });
});

describe('出貨單上的兩個數', () => {
  it('出貨明細數量為明細合計（與逐條揀貨數量比對用）', () => {
    expect(detailsTotalQty(shipment('sh-1', '已裝箱', 500))).toBe(500);
  });

  it('已出貨只認全部物流單都已離廠的單（部分離廠、尚未離廠都不算）；已作廢不計', () => {
    const at = (id, qty, los) =>
      packedShipment({ id, printItemNo: 'PI-2026-0820', qty, logisticsOrders: los });
    const shipments = [
      at('sh-1', 100, [undispatched('a-01')]),
      at('sh-2', 200, [departed('b-01', '運送中')]),
      at('sh-3', 150, [departed('c-01', '已送達')]),
      at('sh-4', 50, [departed('d-01', '例外事故')]),
      at('sh-5', 70, [departed('e-01', '運送中'), dispatched('e-02')]),
      shipment('sh-6', '已作廢', 80),
    ];
    // 全數離廠者：sh-2（200）、sh-3（150）、sh-4（50，異常仍算已離廠）＝400；
    // sh-5 只離廠一部分（一筆運送中、一筆拋單成功但貨態仍待出貨）、sh-1 未離廠
    expect(calcShippedQty(printItem, shipments)).toBe(400);
  });

  it('已離廠量取單張佔用量：扣掉作廢或送達確認填的未送達數量', () => {
    const sh = packedShipment({
      id: 'sh-1',
      printItemNo: 'PI-2026-0820',
      qty: 200,
      logisticsOrders: [
        departed('a-01', '已送達', { undelivered: [{ print_item_no: 'PI-2026-0820', qty: 20 }] }),
      ],
    });
    expect(calcShippedQty(printItem, [sh])).toBe(180);
  });
});
