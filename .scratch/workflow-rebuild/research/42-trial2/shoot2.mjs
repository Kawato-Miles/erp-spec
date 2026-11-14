// 用法：node shoot2.mjs <標籤> <走法檔.json>
// 輸出 shots2/<標籤>-S<n>.png；失敗時的除錯截圖在 shots2/_debug/，伺服器與瀏覽器紀錄在 shots2/_logs/。
// 開發伺服器固定從 ticket42-shots 工作樹啟動（3142 埠），拍完自動關閉。先用 git checkout --detach 切好要拍的版本。
// 只借用 Sens erp-prototype-tests 的 Playwright 與 switchRole，不跑它的測試。
//
// 走法檔格式：
// { "warmUp": ["/consultations", "/consultations/detail"],
//   "shots": [ { "code": "S1", "url": "/consultations", "role": "諮詢（張惠雯）",
//                "steps": [ ...動作 ], "capture": "page" | "viewport" } ] }
// 動作（每筆一個鍵）：
//   { "click": "按鈕文字", "scope": "page|dialog|drawer" }   點按鈕（自動容許 AntD 兩字按鈕中間的空白）
//   { "clickText": "文字" }                                   點頁面上完全符合的文字（例：表格中的單號連結）
//   { "clickRow": "列中文字" }                                點含該文字的表格列
//   { "select": { "label": "欄名" 或 "placeholder": "提示字", "option": "選項", "scope": ... } }
//   { "fill": { "placeholder": "提示字", "value": "內容", "enter": true } }
//   { "waitText": "文字" }                                    等文字出現
//   { "wait": 毫秒 }
// 每張圖都從起始網址整頁載入、切角色、再用點擊前往；中途不重新整理（角色與資料只在記憶體）。
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const [label, walkFile] = process.argv.slice(2);
if (!label || !walkFile) { console.error('用法：node shoot2.mjs <標籤> <走法檔.json>'); process.exit(1); }
const walk = JSON.parse(fs.readFileSync(walkFile, 'utf8'));

const TESTS = '/Users/b-f-03-029/Sens/erp-prototype-tests';
const APP_DIR = '/Users/b-f-03-029/erp/.claude/worktrees/ticket42-shots/apps/erp';
const PORT = 3142;
const BASE = `http://localhost:${PORT}`;
const ROOT = '/tmp/workflow-rebuild-ticket42-trial-20261114/shots2';
const DEBUG = path.join(ROOT, '_debug');
const LOGS = path.join(ROOT, '_logs');
for (const d of [ROOT, DEBUG, LOGS]) fs.mkdirSync(d, { recursive: true });

// 帳密（本機測試用）放在 Sens 測試目錄的 .env.local，不印出
process.loadEnvFile(path.join(TESTS, '.env.local'));

const require = createRequire(path.join(TESTS, 'package.json'));
const { chromium } = require('@playwright/test');
const { switchRole } = await import(path.join(TESTS, 'tests/e2e/_helpers.mjs'));

const up = async () => { try { return (await fetch(BASE + '/login')).status < 500; } catch { return false; } };
if (await up()) { console.error(`${PORT} 埠已有服務，請先關閉再跑`); process.exit(1); }
const serverLog = fs.openSync(path.join(LOGS, `${label}-server.log`), 'w');
const server = spawn('node_modules/.bin/next', ['dev', '--port', String(PORT)], {
  cwd: APP_DIR, env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=6144' },
  stdio: ['ignore', serverLog, serverLog], detached: true,
});
const stop = () => { try { process.kill(-server.pid, 'SIGTERM'); } catch {} };
process.on('exit', stop);
process.on('SIGINT', () => { stop(); process.exit(130); });
for (let i = 0; i < 120 && !(await up()); i += 1) await new Promise((r) => setTimeout(r, 1000));
if (!(await up())) { stop(); console.error('伺服器沒有在 120 秒內啟動'); process.exit(1); }

// 按鈕名稱：AntD 會在兩個中文字的按鈕中間插空白，故每字之間容許空白
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const btnName = (text) => new RegExp(`^\\s*${[...text].map(esc).join('\\s*')}\\s*$`);

const scopeOf = (page, scope) => {
  if (scope === 'dialog') return page.locator('.ant-modal-wrap:visible, .ant-modal-confirm:visible').last();
  if (scope === 'drawer') return page.locator('.ant-drawer-content-wrapper:visible').last();
  return page;
};

async function runStep(page, step) {
  if (step.click !== undefined) {
    const root = scopeOf(page, step.scope);
    const btn = root.getByRole('button', { name: btnName(step.click) }).filter({ visible: true });
    await btn.first().waitFor({ state: 'visible', timeout: 15000 });
    await btn.first().click();
  } else if (step.clickText !== undefined) {
    const el = page.getByText(step.clickText, { exact: true }).filter({ visible: true }).first();
    await el.waitFor({ state: 'visible', timeout: 15000 });
    await el.click();
  } else if (step.clickRow !== undefined) {
    const row = page.locator('tbody tr', { hasText: step.clickRow }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.click();
  } else if (step.select) {
    const { label: lab, placeholder, option } = step.select;
    const root = scopeOf(page, step.select.scope);
    let sel;
    if (placeholder) {
      sel = root.locator('.ant-select').filter({ has: page.locator('.ant-select-selection-placeholder', { hasText: placeholder }) }).first();
    } else {
      sel = root.locator(`xpath=(//*[normalize-space(text())="${lab}"]/following::div[contains(concat(" ",@class," ")," ant-select ")])[1]`);
    }
    await sel.waitFor({ state: 'visible', timeout: 15000 });
    await sel.click();
    const dropdown = page.locator('.ant-select-dropdown:visible').last();
    await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    await dropdown.locator('.ant-select-item-option', { hasText: option }).first().click();
    await page.waitForTimeout(300);
  } else if (step.fill) {
    const { placeholder, value, enter } = step.fill;
    const input = page.getByPlaceholder(placeholder).filter({ visible: true }).first();
    await input.click();
    await input.fill(value);
    if (enter) await input.press('Enter');
  } else if (step.waitText !== undefined) {
    await page.getByText(step.waitText, { exact: false }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 20000 });
  } else if (step.wait !== undefined) {
    await page.waitForTimeout(step.wait);
  } else {
    throw new Error(`不認得的動作：${JSON.stringify(step)}`);
  }
  await page.waitForTimeout(400);
}

const consoleLog = [];
const results = [];
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-TW', baseURL: BASE });
  const page = await context.newPage();
  let current = '';
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleLog.push(`[${current}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => consoleLog.push(`[${current}] pageerror: ${e.message}\n${e.stack ?? ''}`));

  await page.goto('/login', { timeout: 120000 });
  await page.locator('input[name="username"]').fill(process.env.ERP_TEST_USERNAME);
  await page.locator('input[name="password"]').fill(process.env.ERP_TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 60000 });

  // 暖機：先整頁載入會用到的路由，讓開發伺服器編譯完，之後站內點擊才不會退回整頁載入
  for (const w of walk.warmUp ?? []) {
    current = `warmUp ${w}`;
    await page.goto(w, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.locator('.ant-layout, main').first().waitFor({ state: 'attached', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  for (const s of walk.shots) {
    current = s.code;
    const file = path.join(ROOT, `${label}-${s.code}.png`);
    try {
      await page.goto(s.url, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.locator('header, .ant-layout-header').first().waitFor({ state: 'visible', timeout: 60000 });
      await page.waitForLoadState('networkidle').catch(() => {});
      if (s.role) await switchRole(page, s.role);
      await page.waitForTimeout(800);
      for (const step of s.steps ?? []) await runStep(page, step);
      await page.waitForLoadState('networkidle').catch(() => {});
      // 視窗範圍截圖前把頁面捲回頂端（點對話框內的下拉會把背後頁面捲動）
      if (s.capture === 'viewport') await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1200); // 等抽屜與對話框的展開動畫結束
      if (/\/login/.test(new URL(page.url()).pathname)) throw new Error('停在登入頁');
      // Next 開發模式的錯誤浮層：nextjs-portal 平時就存在（左下角開發工具鈕），只看其中是否有錯誤對話框
      const overlay = await page.evaluate(() => {
        const p = document.querySelector('nextjs-portal');
        const root = p?.shadowRoot;
        return root ? root.querySelectorAll('[data-nextjs-dialog], [data-nextjs-toast-errors-parent]').length : 0;
      }).catch(() => 0);
      await page.screenshot({ path: file, fullPage: s.capture !== 'viewport' });
      results.push({ code: s.code, ok: true, url: page.url(), overlay });
      console.log('已拍', file, page.url(), overlay ? '（頁面上有 Next 錯誤浮層元素）' : '');
    } catch (e) {
      const dbg = path.join(DEBUG, `${label}-${s.code}-fail.png`);
      await page.screenshot({ path: dbg, fullPage: false }).catch(() => {});
      results.push({ code: s.code, ok: false, url: page.url(), error: e.message.split('\n')[0] });
      console.log('失敗', s.code, e.message.split('\n')[0], '除錯截圖', dbg);
    }
  }
} finally {
  await browser.close();
  stop();
  try { execSync(`lsof -ti :${PORT} | xargs kill 2>/dev/null || true`); } catch {}
  fs.writeFileSync(path.join(LOGS, `${label}-console.log`), consoleLog.join('\n'));
  fs.writeFileSync(path.join(LOGS, `${label}-results.json`), JSON.stringify(results, null, 2));
  console.log(`瀏覽器錯誤與警告 ${consoleLog.length} 筆，見 ${LOGS}/${label}-console.log`);
}
