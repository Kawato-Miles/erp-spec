// 即時進度回報器：Playwright 執行時把進度與每條測試的最近一次結果寫到固定資料夾，
// 供 Claude 介面的「測試進度與涵蓋地圖」外掛讀取。只寫檔，不輸出到終端機。
//
// 輸出位置：環境變數 ERP_TEST_PROGRESS_DIR，預設 ~/.claude/erp-test-progress/
//   live.json     本輪執行的即時狀態（每個事件整檔覆寫）
//   results.json  每條測試各自的最近一次結果（跨輪累積，以「檔案::標題」為鍵）
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const OUT_DIR = process.env.ERP_TEST_PROGRESS_DIR ?? path.join(os.homedir(), '.claude', 'erp-test-progress');
const LIVE = path.join(OUT_DIR, 'live.json');
const RESULTS = path.join(OUT_DIR, 'results.json');
const STATION = /test\.step\(\s*(['"`])第\s*(\d+)\s*站/g;

function writeJson(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 1));
  fs.renameSync(tmp, file);
}

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function outcome(status) {
  if (status === 'passed') return '通過';
  if (status === 'skipped') return '略過';
  if (status === 'interrupted') return '中斷';
  return '失敗';
}

export default class LiveProgressReporter {
  printsToStdio() { return false; }

  onBegin(config, suite) {
    // 測試專案根目錄＝設定檔所在資料夾；它的上一層是 Sens 根目錄（外掛從這裡讀情境目錄與 wiki 卡）
    const suiteRoot = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.e2eRoot = path.join(suiteRoot, 'tests', 'e2e');
    const tests = suite.allTests().filter((t) => t.parent.project()?.name !== 'setup');
    this.ids = new Set(tests.map((t) => t.id));
    this.stationTotals = new Map();
    for (const t of tests) {
      if (!(t.tags ?? []).includes('@smoke')) continue;
      try {
        const src = fs.readFileSync(t.location.file, 'utf8');
        const nums = [...src.matchAll(STATION)].map((m) => Number(m[2]));
        if (nums.length) this.stationTotals.set(t.id, Math.max(...nums));
      } catch { /* 讀不到原始檔就不顯示站數 */ }
    }
    fs.mkdirSync(OUT_DIR, { recursive: true });
    this.live = {
      status: '執行中',
      startedAt: new Date().toISOString(),
      endedAt: null,
      repoRoot: path.dirname(suiteRoot),
      total: tests.length,
      finished: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      chapters: [...new Set(tests.map((t) => this.chapterOf(t)))],
      current: null,
      done: [],
    };
    this.flush();
  }

  chapterOf(test) {
    const rel = path.relative(this.e2eRoot, test.location.file);
    return rel.includes(path.sep) ? rel.split(path.sep)[0] : '';
  }

  entryOf(test) {
    return {
      file: path.relative(this.e2eRoot, test.location.file),
      chapter: this.chapterOf(test),
      title: test.title,
    };
  }

  onTestBegin(test) {
    if (!this.ids.has(test.id)) return;
    this.live.current = {
      ...this.entryOf(test),
      index: this.live.finished + 1,
      stationTotal: this.stationTotals.get(test.id) ?? null,
      step: null,
      steps: [],
    };
    this.flush();
  }

  onStepBegin(test, _result, step) {
    if (!this.ids.has(test.id) || step.category !== 'test.step' || step.parent) return;
    if (this.live.current) this.live.current.step = step.title;
    this.flush();
  }

  onStepEnd(test, _result, step) {
    if (!this.ids.has(test.id) || step.category !== 'test.step' || step.parent) return;
    if (!this.live.current) return;
    this.live.current.steps.push({ title: step.title, result: step.error ? '失敗' : '通過' });
    this.live.current.step = null;
    this.flush();
  }

  onTestEnd(test, result) {
    if (!this.ids.has(test.id)) return;
    const entry = this.entryOf(test);
    const label = outcome(result.status);
    this.live.finished += 1;
    if (label === '通過') this.live.passed += 1;
    else if (label === '略過') this.live.skipped += 1;
    else this.live.failed += 1;
    const steps = this.live.current?.title === test.title ? this.live.current.steps : [];
    this.live.done.push({ ...entry, result: label, durationMs: result.duration, steps });
    this.live.current = null;

    const results = readJson(RESULTS, {});
    results[`${entry.file}::${entry.title}`] = { ...entry, result: label, at: new Date().toISOString() };
    writeJson(RESULTS, results);
    this.flush();
  }

  onEnd(result) {
    this.live.status = result.status === 'interrupted' ? '已中斷' : '已結束';
    this.live.endedAt = new Date().toISOString();
    this.live.current = null;
    this.flush();
  }

  flush() {
    try { writeJson(LIVE, this.live); } catch { /* 寫入失敗不影響測試本身 */ }
  }
}
