#!/usr/bin/env node
// 迭代影響對映：把 erp repo 這次改動的 (prototype) 模組對映到情境目錄章節、測試目錄與引用該模組路由的測試檔，
// 印出「該跑哪幾章、該看哪些測試」。與 OpenSpec 無關，介面迭代一樣適用。
// 用法：node scripts/impact.mjs            → 取 erp 工作區未提交變更加最近一筆提交
//       node scripts/impact.mjs HEAD~3     → 取 erp 該範圍的變更
//       node scripts/impact.mjs --paths a b → 直接給路徑
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { ERP_ROOT, TESTS_ROOT } from '../config.mjs';

const MODULE_MAP = {
  'quote-prototype': { chapters: ['一 需求單'], routes: ['/quote-prototype'], dirs: ['01-'] },
  orders: { chapters: ['二 訂單成立與維護', '三 款項與發票', '四 訂單成立與印件', '六 確認製作細節與草稿工單'], routes: ['/orders'], dirs: ['02-', '03-', '04-', '06-'] },
  payment: { chapters: ['三 款項與發票'], routes: ['/payment'], dirs: ['03-'] },
  'prepress-review': { chapters: ['五 審稿'], routes: ['/prepress-review'], dirs: ['05-'] },
  'sample-resource': { chapters: ['五 審稿'], routes: ['/sample-resource'], dirs: ['05-'] },
  'print-items': { chapters: ['六 確認製作細節與草稿工單', '十四 查詢與畫面'], routes: ['/print-items'], dirs: ['06-', '14-'] },
  'work-orders': { chapters: ['六', '七 製程登打', '八 製程審核與交付', '十四', '十五 計算規則'], routes: ['/work-orders'], dirs: ['06-', '07-', '08-', '14-'] },
  recipes: { chapters: ['七 製程登打（配方）'], routes: ['/recipes'], dirs: ['07-'] },
  'production-floor': { chapters: ['九 生管接收與派工', '十 報工與轉交', '十四', '十五'], routes: ['/production-floor'], dirs: ['09-', '10-', '14-'] },
  'qc-shipping': { chapters: ['十一 品檢', '十二 出貨與送達'], routes: ['/qc-shipping'], dirs: ['11-', '12-'] },
  'dispatch-orders': { chapters: ['十三 外發與派單（尚無測試）'], routes: ['/dispatch-orders'], dirs: [] },
  'after-sales': { chapters: ['（範圍外，尚無測試）'], routes: ['/after-sales'], dirs: [] },
};

const args = process.argv.slice(2);
let changed = [];
if (args[0] === '--paths') changed = args.slice(1);
else {
  const range = args[0] ? `${args[0]}..HEAD` : 'HEAD~1';
  const out = execSync(`git -C "${ERP_ROOT}" diff --name-only ${range}; git -C "${ERP_ROOT}" status --porcelain | awk '{print $2}'`, { encoding: 'utf8' });
  changed = out.split('\n').filter(Boolean);
}
const proto = changed.filter((p) => p.includes('(prototype)/'));
const modules = new Set();
let mockChanged = false;
for (const p of proto) {
  const rest = p.split('(prototype)/')[1] ?? '';
  const mod = rest.split('/')[0];
  if (rest.startsWith('MOCK-DATA-CHAIN.md') || rest.includes('mock-data')) mockChanged = true;
  if (MODULE_MAP[mod]) modules.add(mod);
  else if (mod.startsWith('_') || mod === 'layout.js') modules.add('__scaffold__');
}

const e2eRoot = path.join(TESTS_ROOT, 'tests/e2e');
const e2eDirs = readdirSync(e2eRoot).filter((d) => statSync(path.join(e2eRoot, d)).isDirectory());
const specFiles = [];
for (const d of e2eDirs) for (const f of readdirSync(path.join(e2eRoot, d))) if (f.endsWith('.spec.mjs')) specFiles.push(path.join(d, f));

console.log(`erp 改動的 prototype 檔案：${proto.length} 個；模組：${[...modules].join('、') || '無'}`);
if (mockChanged) console.log('★ 動到 mock 或 MOCK-DATA-CHAIN：先確認 MOCK-DATA-CHAIN 已改，再檢查引用該鏈編號的測試。');
if (modules.has('__scaffold__')) console.log('★ 動到腳手架（_lib／_components／layout）：影響全站，跑全套。');

const runDirs = new Set();
const specHits = new Map();
for (const mod of modules) {
  const m = MODULE_MAP[mod];
  if (!m) continue;
  console.log(`\n[${mod}] 情境目錄章：${m.chapters.join('；')}`);
  for (const d of e2eDirs) if (m.dirs.some((pre) => d.startsWith(pre))) runDirs.add(d);
  for (const f of specFiles) {
    const txt = readFileSync(path.join(e2eRoot, f), 'utf8');
    if (m.routes.some((r) => txt.includes(`'${r}`))) specHits.set(f, (specHits.get(f) ?? new Set()).add(mod));
  }
}
console.log('\n該跑：');
console.log('  npm run test:smoke');
for (const d of [...runDirs].sort()) console.log(`  npm run test:module -- tests/e2e/${d}`);
console.log('\n引用到這些模組路由的測試檔（改介面或動線時逐檔看）：');
for (const [f, mods] of [...specHits].sort()) console.log(`  ${f}  ←  ${[...mods].join('、')}`);
console.log('\n提交前：npm test（全套）。若上面清單為空且未改任何測試，commit 訊息須寫明「無測試影響」的理由。');
