// 15.15 Prototype 的活動表與 wiki 活動清單卡逐列一致。
// 活動表（(prototype)/_lib/access-activities.js）由 scripts/gen-access-activities.mjs 從 wiki 活動清單卡轉錄，
// 集中權限判斷只認這份資料；wiki 活動清單卡改動而活動表沒重新產生時，本檔失敗。
import { describe, expect, it } from 'vitest';
import { ACCESS_ACTIVITIES } from '/Users/b-f-03-029/erp/apps/erp/src/app/(prototype)/_lib/access-activities.js';
import { readAllActivityCards } from '../../../scripts/lib/activity-cards.mjs';

const cards = readAllActivityCards();
const wikiRows = cards.flatMap((c) => c.rows);
const protoRows = ACCESS_ACTIVITIES;

// 抽樣核對的三張卡：訂單審核（APV）、出貨（SHP）、製程規劃（PLAN）
const SAMPLE_CARDS = [
  { code: 'APV', name: '訂單審核活動清單' },
  { code: 'SHP', name: '出貨活動清單' },
  { code: 'PLAN', name: '製程規劃活動清單' },
];

const cardOf = (row) => row.id.split('-')[1];
// 角色組合：同一活動列的執行角色排序後相連，整張卡取各列組合的多重集合
const roleCombos = (rows) => rows.map((r) => `${r.id}｜${[...r.roles].sort().join('、')}｜${r.scope}`).sort();

describe('15.15 活動表與 wiki 活動清單卡一致', () => {
  it('wiki 有活動表的活動清單卡都轉錄進來，總列數相同', () => {
    expect(wikiRows.length).toBeGreaterThan(500);
    expect(protoRows.length).toBe(wikiRows.length);
  });

  for (const { code, name } of SAMPLE_CARDS) {
    it(`${name}（${code}）：列數與每列的角色組合、範圍一致`, () => {
      const wiki = wikiRows.filter((r) => cardOf(r) === code);
      const proto = protoRows.filter((r) => cardOf(r) === code);
      expect(wiki.length).toBeGreaterThan(0);
      expect(proto.length).toBe(wiki.length);
      expect(roleCombos(proto)).toEqual(roleCombos(wiki));
    });
  }

  it('每一列的活動編號、操作編號、依據欄位逐列相同（全部活動清單卡）', () => {
    const key = (r) => `${r.id}｜${r.op}｜${r.basis ?? '—'}｜${r.sec}`;
    expect(protoRows.map(key).sort()).toEqual(wikiRows.map(key).sort());
  });

  it('活動編號不重複', () => {
    const ids = protoRows.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
