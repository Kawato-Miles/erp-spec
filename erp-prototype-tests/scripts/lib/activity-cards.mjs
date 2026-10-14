// 解析 wiki 活動清單卡（04-business-logic/服務藍圖/<流程群組>/<階段>活動清單.md）的活動表，
// 供兩處使用：產生 Prototype 的活動表資料（gen-access-activities.mjs）、核對 Prototype 活動表與 wiki 一致的單元測試。
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { TESTS_ROOT } from '../../config.mjs';

export const BLUEPRINT_ROOT = path.resolve(
  TESTS_ROOT,
  '../memory/Sens_wiki/wiki/erp/04-business-logic/服務藍圖',
);

const stripLink = (s) => s.replace(/\[\[([^\]]+)\]\]/g, '$1').trim();

/** 解析一張卡的活動表，回傳活動列陣列（欄位意義見 Prototype `_lib/access-activities.js` 檔頭） */
export function parseActivityCard(text) {
  const rows = [];
  let sec = '';
  for (const line of text.split('\n')) {
    if (line.startsWith('### ')) sec = line.slice(4).trim();
    if (line.startsWith('## ') && !line.startsWith('## 活動表')) sec = '';
    if (!line.startsWith('| ACT-')) continue;
    const c = line.trim().replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    if (c.length !== 6) throw new Error(`活動列欄數不是 6：${line.slice(0, 60)}`);
    const [id, , roleCell, scope, basisCell, opCell] = c;
    const roles = roleCell === '所有角色' ? ['*'] : roleCell.split('、').map(stripLink);
    const basis = basisCell === '—' ? null : stripLink(basisCell);
    const m = opCell.match(/^\[\[([^\]]+)\]\]\s+(OP-[A-Z]+-\d+)\s+(.+)$/);
    if (!m) throw new Error(`操作欄格式不符：${id} ${opCell}`);
    rows.push({ id, roles, scope, basis, op: m[2], opName: m[3].trim(), opEntity: m[1], sec });
  }
  return rows;
}

/** 讀全部活動清單卡，回傳 { cards: [{ code, file, rows }] }；卡代碼取活動編號的第二段 */
export function readAllActivityCards() {
  const out = [];
  for (const group of readdirSync(BLUEPRINT_ROOT, { withFileTypes: true })) {
    if (!group.isDirectory()) continue;
    for (const f of readdirSync(path.join(BLUEPRINT_ROOT, group.name))) {
      if (!f.endsWith('活動清單.md')) continue;
      const rows = parseActivityCard(readFileSync(path.join(BLUEPRINT_ROOT, group.name, f), 'utf8'));
      if (rows.length) out.push({ code: rows[0].id.split('-')[1], file: `${group.name}/${f}`, rows });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file, 'zh-Hant'));
}
