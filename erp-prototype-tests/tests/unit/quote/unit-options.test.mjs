import { describe, expect, it } from 'vitest';
import { MOCK_ORDERS } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/orders/mock-data.js';
import {
  MOCK_QUANTITY_UNITS,
  MOCK_QUOTES,
} from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/quote-prototype/mock-data.js';

// 情境目錄 1.17／4.16：需求單印件項目與訂單印件共用同一組單位選項（暫定，見 QR-019）。
// 名稱與順序照後端數量主檔「數量」分類（sens-print-core quantity_seeders，category 7），最後加「張」。
// 訂單印件的下拉直接取 MOCK_QUANTITY_UNITS（orders/_components/detail/ItemsTab.js），兩處不各自另造。

const EXPECTED = [
  '本 (冊)',
  '份',
  '令',
  '卷',
  '盒',
  '箱',
  '包',
  '個',
  '件',
  '支',
  '根',
  '條',
  '塊',
  '副',
  '套',
  '張',
];

describe('需求單與訂單印件的單位選項', () => {
  it('16 個單位，名稱與順序照後端數量分類，最後是「張」', () => {
    expect(MOCK_QUANTITY_UNITS.map((u) => u.name_zh)).toEqual(EXPECTED);
  });

  it('舊值「本」「組」「座」「冊」「批」不再出現在選項裡', () => {
    const names = MOCK_QUANTITY_UNITS.map((u) => u.name_zh);
    for (const old of ['本', '組', '座', '冊', '批']) expect(names).not.toContain(old);
  });

  it('需求單每一筆印件項目的單位都指得到選項裡的一個單位', () => {
    const ids = new Set(MOCK_QUANTITY_UNITS.map((u) => u.id));
    MOCK_QUOTES.flatMap((q) => q.items ?? [])
      .filter((i) => i.unit_id)
      .forEach((i) => expect(ids.has(i.unit_id)).toBe(true));
  });

  it('訂單印件的單位都落在同一組選項內；原為「本」的精裝書改記「本 (冊)」', () => {
    const items = MOCK_ORDERS.flatMap((o) => o.print_items ?? []).filter((i) => i.unit);
    items.forEach((i) => expect(EXPECTED).toContain(i.unit));
    const book = items.find((i) => i.name === '《山城記事》精裝書（128 頁）');
    expect(book.unit).toBe('本 (冊)');
  });
});
