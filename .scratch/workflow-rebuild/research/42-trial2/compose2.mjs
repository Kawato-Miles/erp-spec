// 用法：node compose2.mjs <標籤1> <標籤2> ...   例：node compose2.mjs a1 b1   或   node compose2.mjs a1 a2 b1 b2
// 讀 shots2/<標籤>-S<n>.png，每個 S 代號產出一張並排對照圖 compare2/S<n>.png。
// 每欄上方標版本名稱；缺圖的格子標「無」。只借用 Sens erp-prototype-tests 的 Playwright 排版截圖。
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const labels = process.argv.slice(2);
if (!labels.length) { console.error('用法：node compose2.mjs <標籤1> <標籤2> ...'); process.exit(1); }

const TESTS = '/Users/b-f-03-029/Sens/erp-prototype-tests';
const BASE = '/tmp/workflow-rebuild-ticket42-trial-20261114';
const SHOTS = path.join(BASE, 'shots2');
const OUT = path.join(BASE, 'compare2');
const HTML_DIR = path.join(OUT, '_html');
fs.mkdirSync(HTML_DIR, { recursive: true });

const NAMES = { a1: '甲初版', a2: '甲改後', b1: '乙初版', b2: '乙改後' };
const CODES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
const COL_W = 720; // 每欄排版寬（原圖 1440 寬縮一半）；輸出用 2 倍像素密度，每欄實際保留原圖 1440 像素，放大可讀

const require = createRequire(path.join(TESTS, 'package.json'));
const { chromium } = require('@playwright/test');

const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: labels.length * (COL_W + 24) + 24, height: 600 }, deviceScaleFactor: 2 });
  for (const code of CODES) {
    const cells = labels.map((lab) => {
      const file = path.join(SHOTS, `${lab}-${code}.png`);
      const name = `${NAMES[lab] ?? lab}（${lab}）`;
      const body = fs.existsSync(file)
        ? `<img src="${pathToFileURL(file).href}?t=${fs.statSync(file).mtimeMs}">`
        : '<div class="none">無</div>';
      return `<div class="col"><div class="head">${escHtml(name)}</div>${body}</div>`;
    }).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body { margin: 0; padding: 12px; background: #e5e7eb; font-family: "PingFang TC", "Noto Sans TC", sans-serif; }
      .title { font-size: 22px; font-weight: 600; margin: 0 0 12px; color: #111827; }
      .row { display: flex; gap: 24px; align-items: flex-start; }
      .col { width: ${COL_W}px; background: #fff; border: 1px solid #d1d5db; }
      .head { font-size: 20px; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #d1d5db; background: #f9fafb; }
      img { display: block; width: ${COL_W}px; }
      .none { height: 450px; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #9ca3af; }
    </style></head><body><div class="title">${code}</div><div class="row">${cells}</div></body></html>`;
    const htmlFile = path.join(HTML_DIR, `${code}.html`);
    fs.writeFileSync(htmlFile, html);
    await page.goto(pathToFileURL(htmlFile).href);
    await page.waitForFunction(() => [...document.images].every((i) => i.complete));
    const out = path.join(OUT, `${code}.png`);
    await page.screenshot({ path: out, fullPage: true });
    console.log('已產出', out);
  }
} finally {
  await browser.close();
}
