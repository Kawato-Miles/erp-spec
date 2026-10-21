// 全套測試：Vitest 純函式一次，Playwright 依章節分批，每批各自啟動、結束開發伺服器。
// 一次連跑全部 Playwright 近兩小時，開發伺服器會失去反應或中途停掉，失敗項每次不同；
// 分批後每批伺服器都是新的，結果穩定。章節清單由 tests/e2e 目錄自動列出。
// 任一批失敗即以非零代碼結束；最後印出每批與總計的通過、失敗、略過數。
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const e2eDir = path.join(root, 'tests', 'e2e');

const batches = readdirSync(e2eDir)
  .filter((name) => !name.startsWith('_') && name !== 'auth.setup.mjs')
  .filter((name) => {
    const full = path.join(e2eDir, name);
    return statSync(full).isDirectory() || name.endsWith('.spec.mjs');
  })
  .sort((a, b) => {
    // 根目錄的單檔先跑，再依章節編號
    const fa = a.endsWith('.spec.mjs') ? 0 : 1;
    const fb = b.endsWith('.spec.mjs') ? 0 : 1;
    return fa - fb || a.localeCompare(b);
  })
  .map((name) => (name.endsWith('.spec.mjs') ? name : `${name}/`));

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', env: process.env, maxBuffer: 1 << 28 });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  process.stdout.write(out);
  return { code: r.status ?? 1, out: out.replace(/\x1b\[[0-9;]*m/g, '') };
};

const count = (out, word) => {
  const m = out.match(new RegExp(`^\\s+(\\d+) ${word}`, 'm'));
  return m ? Number(m[1]) : 0;
};

const rows = [];
let failed = false;

const unit = run('npx', ['vitest', 'run']);
const unitPassed = Number(unit.out.match(/Tests\s+(\d+) passed/)?.[1] ?? 0);
const unitFailed = Number(unit.out.match(/Tests\s+.*?(\d+) failed/)?.[1] ?? 0);
rows.push(['單元測試', unitPassed, unitFailed, 0, unit.code]);
if (unit.code !== 0) failed = true;

for (const batch of batches) {
  const r = run('npx', ['playwright', 'test', batch, '--reporter=line']);
  // 每批都含登入前置步驟一項，總計時扣掉
  const passed = Math.max(count(r.out, 'passed') - 1, 0);
  rows.push([batch, passed, count(r.out, 'failed'), count(r.out, 'skipped'), r.code]);
  if (r.code !== 0) failed = true;
}

const e2e = rows.slice(1);
const sum = (i) => e2e.reduce((s, row) => s + row[i], 0);
console.log('\n全套測試結果（端對端各批已扣登入前置步驟）');
for (const [name, p, f, s, code] of rows) console.log(`${code === 0 ? '通過' : '失敗'}  ${name}：通過 ${p}、失敗 ${f}、略過 ${s}`);
console.log(`總計：單元通過 ${rows[0][1]}；端對端通過 ${sum(1)}、失敗 ${sum(2)}、略過 ${sum(3)}`);
process.exit(failed ? 1 : 0);
