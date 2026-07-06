# 審稿模組搬移 erp repo prototype 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 erp repo `(prototype)/` 依 `prototype-from-prompt` skill 規範重做審稿模組（兩個列表頁＋審稿詳情頁＋orders 詳情掛載點），範圍內商業邏輯 1:1 對照 sens-erp-prototype。

**Architecture:** 審稿純函式（狀態機／自動分派演算法）與審稿人員主檔放腳手架層 `(prototype)/_lib/prepressReview.js`（零依賴）；印件審稿資料異動 action 全放 orders store（單一資料真相）；`(prototype)/prepress-review/` 模組只放頁面、對話框與頁面級過濾邏輯。依賴方向：orders → 腳手架、prepress-review → orders（讀資料）、prepress-review → 腳手架。

**Tech Stack:** Next.js 15（App Router、JavaScript）、antd 5、zustand、`@shared/components/common/*` 真元件。

**設計文件（需求正本）：** `/Users/b-f-03-029/Sens/docs/superpowers/specs/2026-07-06-prepress-review-prototype-migration-design.md`
**來源側邏輯正本：** `/Users/b-f-03-029/sens-erp-prototype/src/utils/prepressReview.ts`（狀態機第 34-61 行、演算法第 85-145 行）、`src/types/prepressReview.ts`

**驗證方式說明：** erp repo prototype 區無單元測試基礎設施（依 repo skill，驗證方式為 `pnpm dev:erp` 開本地伺服器操作確認）。每個 Task 的驗證步驟 = Next.js 編譯無錯誤 + 瀏覽器具體操作與成功條件。不寫測試檔。

**工作目錄：** 全部在 `/Users/b-f-03-029/erp`。commit 訊息依 erp repo 慣例（繁體中文、`feat:`／`fix:` prefix）。

---

## 全域規則（每個 Task 都適用）

1. 禁自創 UI、禁手寫 hex／px：一律 import `@shared/components/common/*` 真元件或 antd 原生＋`@shared/styles/theme` token（`Designs.md` §6.5）。
2. 頁面只寫內容：不加 Sider／Header、不包外層 padding（`DashboardShell` 腳手架已提供），直接 `return <>…</>`。
3. 對話框比照 orders 模組既有作法用 antd `Modal`（`ItemsTab.js` 先例）。
4. mock 欄位 snake_case；狀態枚舉中文標籤逐字取自 sens-erp-prototype。
5. 狀態標籤用 orders 模組的 `StatusTag`（META 驅動）。
6. 腳手架層檔案禁止 import 任何模組檔案。

---

### Task 0: 開分支

**Files:** 無（git 操作）

- [ ] **Step 1: 確認乾淨工作區並開分支**

```bash
cd /Users/b-f-03-029/erp && git status --short && git checkout main && git pull && git checkout -b prototype/prepress-review
```
Expected: 無未提交變更；新分支 `prototype/prepress-review` 建立。

---

### Task 1: 腳手架層審稿邏輯（狀態機＋演算法＋人員主檔）

**Files:**
- Create: `apps/erp/src/app/(prototype)/_lib/prepressReview.js`

- [ ] **Step 1: 建立檔案（完整內容如下）**

```js
// 審稿模擬機制（腳手架層）：狀態機 / 自動分派演算法 / 輪次序號 / 審稿人員主檔 / 退件原因 LOV。
// 模擬正式環境的後端邏輯與人員主檔；handoff 時由後端 API 取代、原地留下。
// 邏輯逐字對照 sens-erp-prototype src/utils/prepressReview.ts（需求唯一事實來源）。
// 腳手架層鐵則：禁止 import 任何模組檔案。

// ── 審稿人員主檔（對齊 2026-04-20 組織圖；能力 5 涵蓋多數印件、能力 10 備援）──
export const PREPRESS_REVIEWERS = [
  { id: 'rv2', name: '魏彣軒', max_difficulty_level: 5, available_status: '在崗', active: true },
  { id: 'rv6', name: '范湘瑜', max_difficulty_level: 10, available_status: '在崗', active: true },
];

export const reviewerNameById = (id) =>
  PREPRESS_REVIEWERS.find((r) => r.id === id)?.name ?? '—';
export const reviewerIdByName = (name) =>
  PREPRESS_REVIEWERS.find((r) => r.name === name)?.id ?? null;

// ── 退件原因 LOV（10 項固定；「其他」需補審稿備註）──
export const REJECT_REASON_CATEGORIES = [
  '出血不足',
  '解析度過低',
  '色彩模式錯誤',
  '缺少必要元素',
  '版面超出安全區',
  '尺寸不符',
  '特殊工藝圖層異常',
  '字型未外框',
  '技術性退件',
  '其他',
];

export const SUBMITTED_NOTE_MAX_LENGTH = 500; // 送審 / 補件備註上限
export const REVIEW_NOTE_MAX_LENGTH = 1000; // 審稿備註上限

// ── 審稿維度狀態機（轉移白名單）──
// 主線：待分派 → 稿件未上傳 → 等待審稿 → 合格 → 已確認可製作（終態）
// 分支：不合格 ↔ 已補件；合格 → 待改稿 → 等待審稿（退回重審後客戶上傳新稿直接回重審）
export const REVIEW_TRANSITIONS = {
  待分派: ['稿件未上傳', '等待審稿', '合格'], // 分派（稿未到 / 稿已到）/ 免審直通
  稿件未上傳: ['等待審稿', '合格'],
  等待審稿: ['合格', '不合格'],
  不合格: ['已補件'],
  已補件: ['合格', '不合格'],
  合格: ['已確認可製作', '待改稿'],
  已確認可製作: [],
  待改稿: ['等待審稿'],
};

export const canTransitionReviewStatus = (from, to) =>
  REVIEW_TRANSITIONS[from]?.includes(to) ?? false;

export const isReviewTerminalStatus = (status) => status === '已確認可製作';

// ── 難易度分層（1-3 低 / 4-6 中 / 7-9 高 / 10 極高）──
export const getDifficultyTier = (level) => {
  if (level <= 3) return { label: '低', color: 'green' };
  if (level <= 6) return { label: '中', color: 'gold' };
  if (level <= 9) return { label: '高', color: 'orange' };
  return { label: '極高', color: 'red' };
};

// ── 進行中審稿數（等待審稿 + 已補件且指派給該人）；orders 由呼叫端傳入，保持純函式 ──
export const getReviewerActiveLoad = (orders, reviewerId) =>
  orders
    .flatMap((o) => o.print_items ?? [])
    .filter(
      (p) =>
        p.assigned_reviewer_id === reviewerId &&
        (p.review_status === '等待審稿' || p.review_status === '已補件'),
    ).length;

export const buildReviewerLoads = (orders) =>
  PREPRESS_REVIEWERS.map((reviewer) => ({
    reviewer,
    active_load: getReviewerActiveLoad(orders, reviewer.id),
  }));

// ── 自動分派演算法 ──
// 1. 候選集：active && 在崗 && max_difficulty_level >= difficulty
// 2. 候選集中取 max_difficulty_level 最小者（能力最接近）
// 3. 並列取 active_load 最少者（負載最少）
// 4. 再並列取 id 字典序最小者（tie-break）
// 5. 候選集為空 → 破例派給能力最高者（再走 3-4），標註「破例派工」
// 回傳 null 表示全員停用或不在崗
export const runAutoAssign = (difficulty, loads) => {
  const eligible = loads.filter((l) => l.reviewer.active && l.reviewer.available_status === '在崗');
  if (eligible.length === 0) return null;

  const pickByLoadThenId = (candidates) => {
    const minLoad = Math.min(...candidates.map((l) => l.active_load));
    const byLoad = candidates.filter((l) => l.active_load === minLoad);
    return [...byLoad].sort((a, b) => a.reviewer.id.localeCompare(b.reviewer.id))[0];
  };

  const candidates = eligible.filter((l) => l.reviewer.max_difficulty_level >= difficulty);
  if (candidates.length > 0) {
    const minCap = Math.min(...candidates.map((l) => l.reviewer.max_difficulty_level));
    const closest = candidates.filter((l) => l.reviewer.max_difficulty_level === minCap);
    const picked = pickByLoadThenId(closest);
    let ruleHit = '能力最接近';
    if (closest.length > 1) {
      const minLoad = Math.min(...closest.map((l) => l.active_load));
      ruleHit = closest.filter((l) => l.active_load === minLoad).length === 1 ? '負載最少' : 'tie-break';
    }
    return { assigned_reviewer_id: picked.reviewer.id, rule_hit: ruleHit };
  }

  // 破例派工：無人能力足夠，派給能力最高者
  const maxCap = Math.max(...eligible.map((l) => l.reviewer.max_difficulty_level));
  const fallback = pickByLoadThenId(eligible.filter((l) => l.reviewer.max_difficulty_level === maxCap));
  return {
    assigned_reviewer_id: fallback.reviewer.id,
    rule_hit: '破例派給能力最高者',
    note: `被指派者能力 ${fallback.reviewer.max_difficulty_level} < 印件難易度 ${difficulty}`,
  };
};

// ── 輪次序號（同印件遞增，從 1 開始）──
export const nextRoundNo = (rounds) =>
  rounds.length === 0 ? 1 : Math.max(...rounds.map((r) => r.round_no)) + 1;
```

- [ ] **Step 2: 語法驗證**

```bash
cd /Users/b-f-03-029/erp && node -e "console.log('ok')" && npx next lint --dir 'apps/erp/src/app/(prototype)/_lib' 2>/dev/null || echo 'lint 指令不存在則跳過，後續由 dev server 編譯驗證'
```
Expected: 無語法錯誤（若 lint 不可用，Task 3 的 dev server 編譯會涵蓋驗證）。

- [ ] **Step 3: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/_lib/prepressReview.js' && git commit -m "feat: 腳手架層審稿邏輯（狀態機/自動分派演算法/審稿人員主檔）"
```

---

### Task 2: 角色模擬擴充＋側邊選單

**Files:**
- Modify: `apps/erp/src/app/(prototype)/_lib/sessionStore.js`（ROLES 陣列）
- Modify: `apps/erp/src/app/(prototype)/layout.js`（MENU_GROUPS、ROLE_VISIBLE_ITEMS）

- [ ] **Step 1: sessionStore.js 的 ROLES 陣列尾端加三個角色**

```js
  { value: 'reviewer', label: '審稿人員', user_name: '魏彣軒' },
  { value: 'order_manager', label: '訂單管理人', user_name: '黃聖雯' },
  { value: 'reviewer_supervisor', label: '審稿主管', user_name: '魏彣軒' },
```
（人物逐字取自來源側：`src/types/quote.ts` 第 290 行 om1 黃聖雯；`src/data/mockPrepressReview.ts` rs1／rv2 魏彣軒——審稿組長實務上身兼審稿人員與主管，兩角色同名屬真實情況。）

- [ ] **Step 2: layout.js 的 MENU_GROUPS 加兩個群組變體（比照既有「訂單管理_業務」模式）**

```js
  審稿管理: {
    icon: 'rate_review',
    children: [{ label: '待審訂單', path: '/prepress-review' }],
  },
  審稿管理_訂單管理人: {
    label: '審稿管理',
    icon: 'rate_review',
    children: [
      { label: '待審訂單', path: '/prepress-review' },
      { label: '待分派審稿', path: '/prepress-review/pending-assign' },
    ],
  },
```

- [ ] **Step 3: layout.js 的 ROLE_VISIBLE_ITEMS 加三個角色（既有五角色不動）**

```js
  reviewer: ['審稿管理'],
  order_manager: ['訂單管理', '審稿管理_訂單管理人'],
  reviewer_supervisor: ['審稿管理'],
```
（選單可見性依來源側：待分派審稿僅訂單管理人有獨立選單項；審稿主管的分派入口在列表／詳情頁操作按鈕。）

- [ ] **Step 4: 瀏覽器驗證**

`pnpm dev:erp` 起伺服器，開 `http://localhost:3000/orders`。
Expected: Header 右上角色切換器出現「審稿人員（魏彣軒）」「訂單管理人（黃聖雯）」「審稿主管（魏彣軒）」三個新選項；切到審稿人員後側欄只剩「審稿管理」群組（子項「待審訂單」，點擊導向 `/prepress-review`——此時 404 屬預期，頁面 Task 7 才建）。

- [ ] **Step 5: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/_lib/sessionStore.js' 'apps/erp/src/app/(prototype)/layout.js' && git commit -m "feat: 角色切換器加審稿三角色＋側邊選單審稿管理群組"
```

---

### Task 3: orders mock 資料升級（欄位擴充＋狀態補齊＋審稿情境種子）

**Files:**
- Modify: `apps/erp/src/app/(prototype)/orders/mock-data.js`
- Modify: `apps/erp/src/app/(prototype)/orders/_components/detail/PrintItemViewDrawer.js`（`review_records` 改名連動，見 Step 5）

- [ ] **Step 1: REVIEW_STATUS_META 由 5 態補齊為 8 態（原地改寫）**

```js
export const REVIEW_STATUS_META = {
  待分派: { color: 'gold', pulse: true },
  稿件未上傳: { color: 'default' },
  等待審稿: { color: 'orange' },
  不合格: { color: 'red', pulse: true },
  已補件: { color: 'blue' },
  待改稿: { color: 'orange' },
  合格: { color: 'green' },
  已確認可製作: { color: 'green' },
};
```

- [ ] **Step 2: 全部既有印件物件統一加四個欄位、改一個欄位名**

對 `MOCK_ORDERS` 內每個 print_items 元素：
- 新增 `assigned_reviewer_id: null`、`current_round_id: null`、`review_activity_logs: []`
- `review_records` 改名為 `review_rounds`（多數為空陣列直接改名）
- `addPrintItem` action（store.js 第 95-131 行）產生的新印件物件同步：`review_records: []` 改 `review_rounds: []`，並補 `assigned_reviewer_id: null, current_round_id: null, review_activity_logs: []`；初始 `review_status` 由 `skip_review ? '合格' : '稿件未上傳'` 改為 `skip_review ? '合格' : '待分派'`（新狀態機初始態）

- [ ] **Step 3: 既有審稿情境印件補齊完整欄位**

`PI-0004-001`（等待審稿，線上單）：
```js
        assigned_reviewer_id: 'rv6',
        current_round_id: null,
        review_rounds: [
          {
            id: 'RR-0004-001-1', print_item_id: 'PI-0004-001', round_no: 1, source: '審稿',
            submitted_at: '2026-06-05', submitted_by: '萌芽選物（會員）',
            reviewer_id: 'rv6', result: null,
          },
        ],
        review_activity_logs: [
          { id: 'AL-0004-001-1', timestamp: '2026-06-05 13:10', type: '稿件上傳', actor: '萌芽選物（會員）' },
          { id: 'AL-0004-001-2', timestamp: '2026-06-05 13:10', type: '自動分配', actor: 'system', assigned_to: 'rv6', rule_hit: '能力最接近' },
          { id: 'AL-0004-001-3', timestamp: '2026-06-05 13:10', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '等待審稿' },
        ],
```
（指派給 rv6 范湘瑜——用來驗證審稿人員（魏彣軒）視角看不到非自己負責的印件。）

`PI-0004-002`（不合格，線上單）：舊 `review_records` 一筆升級為新 shape：
```js
        assigned_reviewer_id: 'rv2',
        current_round_id: null,
        review_rounds: [
          {
            id: 'RR-0004-002-1', print_item_id: 'PI-0004-002', round_no: 1, source: '審稿',
            submitted_at: '2026-06-06', submitted_by: '萌芽選物（會員）',
            reviewer_id: 'rv2', reviewed_at: '2026-06-07', result: '不合格',
            reject_reason_category: '出血不足',
            review_note: '吊牌四邊出血不足 3mm，請補出血後重新上傳',
          },
        ],
        review_activity_logs: [
          { id: 'AL-0004-002-1', timestamp: '2026-06-06 09:00', type: '稿件上傳', actor: '萌芽選物（會員）' },
          { id: 'AL-0004-002-2', timestamp: '2026-06-06 09:00', type: '自動分配', actor: 'system', assigned_to: 'rv2', rule_hit: '能力最接近' },
          { id: 'AL-0004-002-3', timestamp: '2026-06-06 09:00', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '等待審稿' },
          { id: 'AL-0004-002-4', timestamp: '2026-06-07 15:20', type: '送出審核', actor: 'rv2', round_no: 1, round_result: '不合格', reject_reason_category: '出血不足' },
          { id: 'AL-0004-002-5', timestamp: '2026-06-07 15:20', type: '狀態轉移', actor: 'system', from_status: '等待審稿', to_status: '不合格' },
        ],
```

- [ ] **Step 4: MOCK_ORDERS 尾端追加兩張審稿情境種子訂單**

id 用 `ORD-2026-0090`／`ORD-2026-0091`（跳號避免與既有 mock 撞號，語意＝審稿情境專用種子）。訂單外殼欄位完整比照 `ORD-2026-0004` 的結構（customer／金額／billing 等欄位齊備、值自訂合理即可），關鍵欄位如下；print_items 逐字用下列內容：

**ORD-2026-0090**（線下單、status `等待審稿`、sales_person 洪嘉駿、case_name 文創園區導覽手冊、client_name 山城文化事業有限公司、deadline `2026-07-20`）——覆蓋 待分派／稿件未上傳／合格待確認／待改稿：

```js
    print_items: [
      { id: 'PI-0090-001', print_item_no: 'ORD-2026-0090_001', name: '導覽手冊 A5 40P', type: '大貨印件',
        print_item_status: '待生產', review_status: '待分派', sample_result: null,
        ordered_qty: 2000, unit: '本', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 45, spec_notes: 'A5 雪銅 128g 騎馬釘 40 頁', delivery_date: '2026-07-20',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 4,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2B', files: [], work_orders: [],
        assigned_reviewer_id: null, current_round_id: null, review_rounds: [], review_activity_logs: [] },
      { id: 'PI-0090-002', print_item_no: 'ORD-2026-0090_002', name: '導覽地圖摺頁', type: '大貨印件',
        print_item_status: '待生產', review_status: '稿件未上傳', sample_result: null,
        ordered_qty: 5000, unit: '張', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 8, spec_notes: 'A3 對摺再三摺 銅版 100g', delivery_date: '2026-07-20',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 2,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2B', files: [], work_orders: [],
        assigned_reviewer_id: 'rv2', current_round_id: null, review_rounds: [],
        review_activity_logs: [
          { id: 'AL-0090-002-1', timestamp: '2026-07-01 10:00', type: '手動分派', actor: '黃聖雯', assigned_to: 'rv2' },
          { id: 'AL-0090-002-2', timestamp: '2026-07-01 10:00', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '稿件未上傳' },
        ] },
      { id: 'PI-0090-003', print_item_no: 'ORD-2026-0090_003', name: '園區形象海報', type: '大貨印件',
        print_item_status: '待生產', review_status: '合格', sample_result: null,
        ordered_qty: 300, unit: '張', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 120, spec_notes: 'A1 銅版 150g 單面四色', delivery_date: '2026-07-20',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 3,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2B',
        files: [{ id: 'F-0090-003-1', file_name: 'poster_final.pdf', file_role: '印件檔', uploaded_at: '2026-07-01' }],
        work_orders: [],
        assigned_reviewer_id: 'rv2', current_round_id: 'RR-0090-003-1',
        review_rounds: [
          { id: 'RR-0090-003-1', print_item_id: 'PI-0090-003', round_no: 1, source: '審稿',
            submitted_at: '2026-07-01', submitted_by: '洪嘉駿',
            reviewer_id: 'rv2', reviewed_at: '2026-07-02', result: '合格' },
        ],
        review_activity_logs: [
          { id: 'AL-0090-003-1', timestamp: '2026-07-01 11:00', type: '稿件上傳', actor: '洪嘉駿' },
          { id: 'AL-0090-003-2', timestamp: '2026-07-02 09:30', type: '送出審核', actor: 'rv2', round_no: 1, round_result: '合格' },
          { id: 'AL-0090-003-3', timestamp: '2026-07-02 09:30', type: '狀態轉移', actor: 'system', from_status: '等待審稿', to_status: '合格' },
        ] },
      { id: 'PI-0090-004', print_item_no: 'ORD-2026-0090_004', name: '入園導覽卡', type: '大貨印件',
        print_item_status: '待生產', review_status: '待改稿', sample_result: null,
        ordered_qty: 10000, unit: '張', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 3, spec_notes: '90×54mm 萊妮卡 240g 雙面', delivery_date: '2026-07-20',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 2,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2B',
        files: [{ id: 'F-0090-004-1', file_name: 'card_v1.pdf', file_role: '印件檔', uploaded_at: '2026-06-30' }],
        work_orders: [],
        assigned_reviewer_id: 'rv2', current_round_id: 'RR-0090-004-1',
        review_rounds: [
          { id: 'RR-0090-004-1', print_item_id: 'PI-0090-004', round_no: 1, source: '審稿',
            submitted_at: '2026-06-30', submitted_by: '洪嘉駿',
            reviewer_id: 'rv2', reviewed_at: '2026-07-01', result: '合格' },
        ],
        review_activity_logs: [
          { id: 'AL-0090-004-1', timestamp: '2026-07-03 14:00', type: '退回重審', actor: '洪嘉駿', note: '客戶要求改版面配色，退回重審' },
          { id: 'AL-0090-004-2', timestamp: '2026-07-03 14:00', type: '狀態轉移', actor: 'system', from_status: '合格', to_status: '待改稿' },
          { id: 'AL-0090-004-3', timestamp: '2026-07-01 09:00', type: '送出審核', actor: 'rv2', round_no: 1, round_result: '合格' },
        ] },
    ],
```

**ORD-2026-0091**（線上單EC、status `等待審稿`、case_name 甜點禮盒包裝組、client_name 沐甜烘焙坊、deadline `2026-07-12`——距今 6 天內含逾期驗證用、order_source B2C）——覆蓋 等待審稿（我的待審）／已補件／免審直通／售後補印：

```js
    print_items: [
      { id: 'PI-0091-001', print_item_no: 'ORD-2026-0091_001', name: '禮盒外盒', type: '大貨印件',
        print_item_status: '待生產', review_status: '等待審稿', sample_result: null,
        ordered_qty: 1000, unit: '個', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 35, spec_notes: '瓦楞 E 浪 四色 霧膜', delivery_date: '2026-07-12',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 3,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2C',
        files: [{ id: 'F-0091-001-1', file_name: 'giftbox_v1.ai', file_role: '印件檔', uploaded_at: '2026-07-04' }],
        work_orders: [],
        assigned_reviewer_id: 'rv2', current_round_id: null,
        review_rounds: [
          { id: 'RR-0091-001-1', print_item_id: 'PI-0091-001', round_no: 1, source: '審稿',
            submitted_at: '2026-07-04', submitted_by: '沐甜烘焙坊（會員）',
            reviewer_id: 'rv2', result: null },
        ],
        review_activity_logs: [
          { id: 'AL-0091-001-1', timestamp: '2026-07-04 10:00', type: '稿件上傳', actor: '沐甜烘焙坊（會員）' },
          { id: 'AL-0091-001-2', timestamp: '2026-07-04 10:00', type: '自動分配', actor: 'system', assigned_to: 'rv2', rule_hit: '能力最接近' },
          { id: 'AL-0091-001-3', timestamp: '2026-07-04 10:00', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '等待審稿' },
        ] },
      { id: 'PI-0091-002', print_item_no: 'ORD-2026-0091_002', name: '禮盒緞帶腰封', type: '大貨印件',
        print_item_status: '待生產', review_status: '已補件', sample_result: null,
        ordered_qty: 1000, unit: '條', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 6, spec_notes: '銅版 128g 燙金', delivery_date: '2026-07-12',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 5,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2C',
        files: [
          { id: 'F-0091-002-1', file_name: 'band_v1.pdf', file_role: '印件檔', uploaded_at: '2026-07-02' },
          { id: 'F-0091-002-2', file_name: 'band_v2.pdf', file_role: '印件檔', uploaded_at: '2026-07-05' },
        ],
        work_orders: [],
        assigned_reviewer_id: 'rv2', current_round_id: null,
        review_rounds: [
          { id: 'RR-0091-002-1', print_item_id: 'PI-0091-002', round_no: 1, source: '審稿',
            submitted_at: '2026-07-02', submitted_by: '沐甜烘焙坊（會員）',
            reviewer_id: 'rv2', reviewed_at: '2026-07-03', result: '不合格',
            reject_reason_category: '特殊工藝圖層異常', review_note: '燙金圖層未獨立，請分層後重新上傳' },
          { id: 'RR-0091-002-2', print_item_id: 'PI-0091-002', round_no: 2, source: '審稿',
            submitted_at: '2026-07-05', submitted_by: '沐甜烘焙坊（會員）',
            submitted_note: '已將燙金圖層獨立為專色層', reviewer_id: 'rv2', result: null },
        ],
        review_activity_logs: [
          { id: 'AL-0091-002-1', timestamp: '2026-07-05 16:00', type: '補件完成', actor: '沐甜烘焙坊（會員）', round_no: 2 },
          { id: 'AL-0091-002-2', timestamp: '2026-07-05 16:00', type: '狀態轉移', actor: 'system', from_status: '不合格', to_status: '已補件' },
          { id: 'AL-0091-002-3', timestamp: '2026-07-03 11:00', type: '送出審核', actor: 'rv2', round_no: 1, round_result: '不合格', reject_reason_category: '特殊工藝圖層異常' },
        ] },
      { id: 'PI-0091-003', print_item_no: 'ORD-2026-0091_003', name: '常規品牌貼紙（重複品）', type: '大貨印件',
        print_item_status: '待生產', review_status: '已確認可製作', sample_result: null,
        ordered_qty: 3000, unit: '張', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 2, spec_notes: '直徑 40mm 銅版貼 亮膜', delivery_date: '2026-07-12',
        skip_review: true, related_after_sales_ticket_id: null, difficulty_level: 1,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2C', files: [], work_orders: [],
        assigned_reviewer_id: null, current_round_id: 'RR-0091-003-1',
        review_rounds: [
          { id: 'RR-0091-003-1', print_item_id: 'PI-0091-003', round_no: 1, source: '免審稿',
            submitted_at: '2026-07-01', submitted_by: '系統', reviewer_id: null, result: '合格' },
        ],
        review_activity_logs: [
          { id: 'AL-0091-003-1', timestamp: '2026-07-01 09:00', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '合格', note: '免審稿快速路徑（source=免審稿）' },
          { id: 'AL-0091-003-2', timestamp: '2026-07-01 09:00', type: '確認可製作', actor: 'system', note: 'B2C 合格後自動確認可製作' },
        ] },
      { id: 'PI-0091-004', print_item_no: 'ORD-2026-0091_004', name: '禮盒外盒（售後補印）', type: '補印印件',
        print_item_status: '待生產', review_status: '已確認可製作', sample_result: null,
        ordered_qty: 100, unit: '個', produced_qty: 0, warehouse_qty: 0, shipped_qty: 0,
        price_per_unit_untaxed: 0, spec_notes: '沿用 PI-0090-003 合格稿件補印', delivery_date: '2026-07-12',
        skip_review: false, related_after_sales_ticket_id: null, difficulty_level: 3,
        expected_production_lines: [], packaging_notes: '', file_notes: '', staff_notes: '',
        order_source: 'B2C', files: [], work_orders: [],
        assigned_reviewer_id: null, current_round_id: 'RR-0091-004-1',
        review_rounds: [
          { id: 'RR-0091-004-1', print_item_id: 'PI-0091-004', round_no: 1, source: '售後補印',
            source_print_item_id: 'PI-0090-003',
            submitted_at: '2026-07-05', submitted_by: '系統', reviewer_id: null, result: '合格' },
        ],
        review_activity_logs: [
          { id: 'AL-0091-004-1', timestamp: '2026-07-05 10:00', type: '狀態轉移', actor: 'system', from_status: '待分派', to_status: '合格', note: '售後補印沿用來源印件合格稿件' },
          { id: 'AL-0091-004-2', timestamp: '2026-07-05 10:00', type: '確認可製作', actor: 'system' },
        ] },
    ],
```

- [ ] **Step 5: PrintItemViewDrawer.js 連動改名**

第 89 行 `item.review_records` 改為 `item.review_rounds`，該檔內渲染輪次欄位處同步對應新欄位名：`reject_category` → `reject_reason_category`、`note` → `review_note`、`reviewer` → 以 `reviewer_id` 經 `reviewerNameById`（從 `../../../_lib/prepressReview` import）轉人名、`method` 欄位已不存在（該欄移除）。

- [ ] **Step 6: 全域檢查無殘留舊欄位名**

```bash
grep -rn "review_records" 'apps/erp/src/app/(prototype)/' ; echo "exit=$?"
```
Expected: 無任何輸出（exit=1）。

- [ ] **Step 7: 瀏覽器驗證**

開 `/orders/detail?id=ORD-2026-0004`（訂單項目 Tab）。
Expected: 編譯無錯誤；PI-0004-002 審稿狀態顯示「不合格」紅色標籤（脈動圓點）；檢視印件側板開啟時輪次資料正常顯示（審稿人員顯示「魏彣軒」）。

- [ ] **Step 8: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/orders/' && git commit -m "feat: orders mock 印件審稿欄位升級（8 態狀態機/審稿輪次/活動紀錄/情境種子）"
```

---

### Task 4: orders store 審稿 action（範圍內 1:1 邏輯）

**Files:**
- Modify: `apps/erp/src/app/(prototype)/orders/_lib/store.js`

- [ ] **Step 1: 檔頭 import 腳手架審稿邏輯**

```js
import {
  buildReviewerLoads,
  canTransitionReviewStatus,
  nextRoundNo,
  reviewerIdByName,
  runAutoAssign,
} from '../../_lib/prepressReview';
```

- [ ] **Step 2: 加共用 helper（放 `withActivity` 之後）**

```js
// 印件層 patch + 審稿活動紀錄追加（審稿事件寫進 print_item.review_activity_logs）
const patchItemWithReviewEvents = (order, itemId, patch, events) => ({
  ...order,
  print_items: order.print_items.map((p) =>
    p.id === itemId
      ? { ...p, ...patch, review_activity_logs: [...events, ...p.review_activity_logs] }
      : p,
  ),
});
const reviewEvent = (type, extra = {}) => ({
  id: nextId('AL'),
  timestamp: now(),
  type,
  actor: extra.actor ?? 'system',
  ...extra,
});
```

- [ ] **Step 3: 升級 `uploadArtwork`（整段替換既有實作）**

行為：追加 `file_role: '印件檔'` 檔案＋「稿件上傳」事件；`待分派` → 跑自動分派（寫「自動分配」＋必要時「破例派工」事件）→ `等待審稿`；`稿件未上傳` → `等待審稿`；首次進等待審稿且無輪次時建 round 1（result null）。

```js
  uploadArtwork: (orderId, itemId, fileName) =>
    get()._patchOrder(orderId, (o) => {
      const item = o.print_items.find((p) => p.id === itemId);
      const events = [reviewEvent('稿件上傳', { actor: currentUser() })];
      const patch = {
        files: [
          ...item.files,
          { id: nextId('F'), file_name: fileName, file_role: '印件檔', uploaded_at: today() },
        ],
      };
      if (item.review_status === '待分派') {
        const decision = runAutoAssign(item.difficulty_level ?? 1, buildReviewerLoads(get().orders));
        if (decision) {
          patch.assigned_reviewer_id = decision.assigned_reviewer_id;
          events.push(
            reviewEvent('自動分配', {
              assigned_to: decision.assigned_reviewer_id,
              rule_hit: decision.rule_hit,
              note: decision.note,
            }),
          );
          if (decision.rule_hit === '破例派給能力最高者') {
            events.push(
              reviewEvent('破例派工', {
                assigned_to: decision.assigned_reviewer_id,
                reason: decision.note,
              }),
            );
          }
          patch.review_status = '等待審稿';
          events.push(reviewEvent('狀態轉移', { from_status: '待分派', to_status: '等待審稿' }));
        }
      } else if (item.review_status === '稿件未上傳') {
        patch.review_status = '等待審稿';
        events.push(reviewEvent('狀態轉移', { from_status: '稿件未上傳', to_status: '等待審稿' }));
      }
      if (patch.review_status === '等待審稿' && item.review_rounds.length === 0) {
        patch.review_rounds = [
          {
            id: nextId('RR'), print_item_id: itemId, round_no: 1, source: '審稿',
            submitted_at: today(), submitted_by: currentUser(),
            reviewer_id: patch.assigned_reviewer_id ?? item.assigned_reviewer_id, result: null,
          },
        ];
      }
      return withActivity(
        patchItemWithReviewEvents(o, itemId, patch, events),
        currentUser(),
        `上傳稿件（${fileName}）`,
      );
    }),
```

- [ ] **Step 4: 升級 `resupplyArtwork`（整段替換既有實作；加 `submittedNote` 參數）**

行為：允許自 `不合格`／`待改稿`；`待改稿` → `等待審稿`、`不合格` → `已補件`；開新輪次（round_no 遞增、result null、帶送審備註）；寫「補件完成」＋「狀態轉移」事件。

```js
  resupplyArtwork: (orderId, itemId, fileName, submittedNote = '') =>
    get()._patchOrder(orderId, (o) => {
      const item = o.print_items.find((p) => p.id === itemId);
      const target = item.review_status === '待改稿' ? '等待審稿' : '已補件';
      if (!canTransitionReviewStatus(item.review_status, target)) return o;
      const roundNo = nextRoundNo(item.review_rounds);
      const patch = {
        review_status: target,
        files: [
          ...item.files,
          { id: nextId('F'), file_name: fileName, file_role: '印件檔', uploaded_at: today() },
        ],
        review_rounds: [
          ...item.review_rounds,
          {
            id: nextId('RR'), print_item_id: itemId, round_no: roundNo, source: '審稿',
            submitted_at: today(), submitted_by: currentUser(),
            submitted_note: submittedNote || undefined,
            reviewer_id: item.assigned_reviewer_id, result: null,
          },
        ],
      };
      const events = [
        reviewEvent('補件完成', { actor: currentUser(), round_no: roundNo }),
        reviewEvent('狀態轉移', { from_status: item.review_status, to_status: target }),
      ];
      return withActivity(
        patchItemWithReviewEvents(o, itemId, patch, events),
        currentUser(),
        `補件上傳（${fileName}）`,
      );
    }),
```

- [ ] **Step 5: 新增 `submitReview`（完成審核）**

行為：guard 狀態機；有待審輪次（result null）則回填審稿端欄位，否則開新輪次；合格 → `current_round_id` 指向該輪；B2C 合格自動再轉「已確認可製作」（含「確認可製作」事件，actor 'system'）。

```js
  submitReview: (orderId, itemId, { result, reject_reason_category, review_note }) =>
    get()._patchOrder(orderId, (o) => {
      const item = o.print_items.find((p) => p.id === itemId);
      const toStatus = result === '合格' ? '合格' : '不合格';
      if (!canTransitionReviewStatus(item.review_status, toStatus)) return o;
      const myId = reviewerIdByName(currentUser());
      const pending = item.review_rounds.find((r) => r.result === null);
      const reviewed = {
        reviewer_id: myId, reviewed_at: today(), result,
        reject_reason_category: result === '不合格' ? reject_reason_category : undefined,
        review_note: review_note || undefined,
      };
      const rounds = pending
        ? item.review_rounds.map((r) => (r.id === pending.id ? { ...r, ...reviewed } : r))
        : [
            ...item.review_rounds,
            {
              id: nextId('RR'), print_item_id: itemId, round_no: nextRoundNo(item.review_rounds),
              source: '審稿', submitted_at: today(), submitted_by: currentUser(), ...reviewed,
            },
          ];
      const doneRound = pending ? rounds.find((r) => r.id === pending.id) : rounds[rounds.length - 1];
      const patch = { review_rounds: rounds, review_status: toStatus };
      const events = [
        reviewEvent('送出審核', {
          actor: myId ?? currentUser(), round_no: doneRound.round_no, round_result: result,
          reject_reason_category: reviewed.reject_reason_category, review_note: reviewed.review_note,
        }),
        reviewEvent('狀態轉移', { from_status: item.review_status, to_status: toStatus }),
      ];
      if (result === '合格') {
        patch.current_round_id = doneRound.id;
        if (item.order_source === 'B2C') {
          patch.review_status = '已確認可製作';
          events.push(reviewEvent('確認可製作', { note: 'B2C 合格後自動確認可製作' }));
          events.push(reviewEvent('狀態轉移', { from_status: '合格', to_status: '已確認可製作' }));
        }
      }
      return withActivity(
        patchItemWithReviewEvents(o, itemId, patch, events),
        currentUser(),
        `完成審核（${item.name}：${result}）`,
      );
    }),
```

- [ ] **Step 6: 新增 `submitBatchReview`（批次審稿）**

規則（逐字對照來源側 BatchReviewDialog）：整批同一結果；不合格時退件原因整批共用、審稿備註預設共用可逐件覆寫。逐件先寫「批次審稿」事件再走 `submitReview`。

```js
  submitBatchReview: (entries, { result, reject_reason_category, note, note_overrides = {} }) => {
    entries.forEach(({ order_id, item_id }) => {
      get()._patchOrder(order_id, (o) =>
        patchItemWithReviewEvents(o, item_id, {}, [
          reviewEvent('批次審稿', { actor: reviewerIdByName(currentUser()) ?? currentUser() }),
        ]),
      );
      get().submitReview(order_id, item_id, {
        result,
        reject_reason_category,
        review_note: note_overrides[item_id] ?? note,
      });
    });
  },
```

- [ ] **Step 7: 新增 `assignReviewer`（分派／改派統一，2026-07-03 拍板：原因選填、雙角色全權、混合批次）**

```js
  assignReviewer: (entries, reviewerId, reason = '') => {
    entries.forEach(({ order_id, item_id }) => {
      get()._patchOrder(order_id, (o) => {
        const item = o.print_items.find((p) => p.id === item_id);
        const events = [];
        const patch = { assigned_reviewer_id: reviewerId };
        if (item.assigned_reviewer_id) {
          // 已有負責人 → 改派（狀態不動；待審輪次的 reviewer 同步換人）
          events.push(
            reviewEvent('改派', {
              actor: currentUser(), from_user: item.assigned_reviewer_id,
              to_user: reviewerId, reason: reason.trim() || undefined,
            }),
          );
        } else {
          // 首次分派：稿已到 → 等待審稿（無輪次則建 round 1）；稿未到 → 稿件未上傳
          events.push(reviewEvent('手動分派', { actor: currentUser(), assigned_to: reviewerId }));
          const hasArtwork = item.files.some((f) => f.file_role === '印件檔');
          const to = hasArtwork ? '等待審稿' : '稿件未上傳';
          if (canTransitionReviewStatus(item.review_status, to)) {
            patch.review_status = to;
            events.push(reviewEvent('狀態轉移', { from_status: item.review_status, to_status: to }));
            if (to === '等待審稿' && item.review_rounds.length === 0) {
              patch.review_rounds = [
                {
                  id: nextId('RR'), print_item_id: item_id, round_no: 1, source: '審稿',
                  submitted_at: today(), submitted_by: currentUser(), reviewer_id: reviewerId, result: null,
                },
              ];
            }
          }
        }
        patch.review_rounds = (patch.review_rounds ?? item.review_rounds).map((r) =>
          r.result === null ? { ...r, reviewer_id: reviewerId } : r,
        );
        return withActivity(
          patchItemWithReviewEvents(o, item_id, patch, events),
          currentUser(),
          `分派審稿人員（${item.name}）`,
        );
      });
    });
  },
```

- [ ] **Step 8: 新增 `confirmProducible`（B2B 業務確認可製作）與 `openReviewDiscussion`（審稿討論串）**

```js
  confirmProducible: (orderId, itemId) =>
    get()._patchOrder(orderId, (o) => {
      const item = o.print_items.find((p) => p.id === itemId);
      if (!canTransitionReviewStatus(item.review_status, '已確認可製作')) return o;
      const events = [
        reviewEvent('確認可製作', { actor: currentUser() }),
        reviewEvent('狀態轉移', { from_status: '合格', to_status: '已確認可製作' }),
      ];
      return withActivity(
        patchItemWithReviewEvents(o, itemId, { review_status: '已確認可製作' }, events),
        currentUser(),
        `確認可製作（${item.name}）`,
      );
    }),

  // 審稿討論串：mock Slack webhook（不真實呼叫），mention 訂單管理人，連結留存供回溯
  openReviewDiscussion: (orderId, printItemIds) =>
    get()._patchOrder(orderId, (o) =>
      withActivity(
        {
          ...o,
          review_discussions: [
            ...(o.review_discussions ?? []),
            {
              id: nextId('RD'), print_item_ids: printItemIds,
              thread_url: `https://slack.example.com/archives/C-PREPRESS/p${Date.now()}`,
              mentioned_user: '黃聖雯', created_by: currentUser(), created_at: now(),
            },
          ],
        },
        currentUser(),
        `開啟審稿討論（${printItemIds.length} 件印件）`,
      ),
    ),
```

- [ ] **Step 9: 瀏覽器驗證（console 快測）**

`pnpm dev:erp` 開 `/orders`，瀏覽器 console 執行動作驗證不做（store 未掛 window）——改由編譯結果驗證：頁面正常載入、無 runtime 錯誤。行為驗證延後至 Task 8（掛載點 UI）與 Task 10（端到端）。
Expected: 編譯通過、`/orders` 與 `/orders/detail?id=ORD-2026-0004` 正常渲染。

- [ ] **Step 10: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/orders/_lib/store.js' && git commit -m "feat: orders store 審稿 action（上傳自動分派/補件開輪/完成審核/批次/分派改派/確認可製作/討論串）"
```

---

### Task 5: 審稿模組頁面級純函式

**Files:**
- Create: `apps/erp/src/app/(prototype)/prepress-review/_lib/selectors.js`

- [ ] **Step 1: 建立檔案（完整內容）**

```js
// 審稿模組頁面級純函式：列表母集合過濾 / 交期計算 / 權限判斷。
// 邏輯對照 sens-erp-prototype src/utils/prepressReview.ts 第 1251-1347 行。
// handoff 時隨模組整包搬走、原樣保留。

// 尚未進入審稿段的訂單狀態（審稿段始於回簽（線下）/ 付款（線上））
const PRE_REVIEW_ORDER_STATUSES = ['草稿', '待業務主管審核', '審核通過', '報價待回簽', '等待付款'];

// 審稿段未完結：尚未到達「已確認可製作」
export const isPrintItemReviewUnresolved = (status) => (status ?? '待分派') !== '已確認可製作';

// 待分派判準：無負責審稿人員且非免審
export const isPrintItemPendingAssign = (item) =>
  item.review_status === '待分派' && !item.skip_review;

// 待審訂單母集合：底下至少一件「審稿段未完結且非已棄用」印件的訂單；
// 排除已取消與尚未進入審稿段的訂單。
// assignedReviewerId：審稿人員視角，僅取「有自己負責之未完結印件」的訂單。
export const selectOrdersWithUnresolvedReview = (orders, { assignedReviewerId } = {}) =>
  orders.filter((o) => {
    if (o.status === '已取消') return false;
    if (PRE_REVIEW_ORDER_STATUSES.includes(o.status)) return false;
    return (o.print_items ?? []).some((pi) => {
      if (pi.print_item_status === '已棄用') return false;
      if (!isPrintItemReviewUnresolved(pi.review_status)) return false;
      if (assignedReviewerId) return pi.assigned_reviewer_id === assignedReviewerId;
      return true;
    });
  });

// 待分派審稿母集合：底下至少一件待分派（非免審、非已棄用）印件的訂單
export const selectOrdersWithPendingAssign = (orders) =>
  selectOrdersWithUnresolvedReview(orders).filter((o) =>
    (o.print_items ?? []).some(
      (pi) => pi.print_item_status !== '已棄用' && isPrintItemPendingAssign(pi),
    ),
  );

// 訂單交期：優先 order.deadline；無則取（非已棄用）印件最早 delivery_date；皆無 null
export const computeOrderDeadline = (order) => {
  if (order.deadline) return order.deadline;
  const dates = (order.print_items ?? [])
    .filter((pi) => pi.print_item_status !== '已棄用' && pi.delivery_date)
    .map((pi) => pi.delivery_date);
  if (dates.length === 0) return null;
  return dates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min));
};

// 距交期天數（向上取整；負值 = 已過期）；無交期 null
export const computeOrderDaysToDeadline = (order, now = Date.now()) => {
  const deadline = computeOrderDeadline(order);
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - now) / (24 * 60 * 60 * 1000));
};

// 審稿關卡逾期：距交期 < 安全緩衝（2 天）
export const isOrderOverdueInReview = (order, bufferDays = 2) => {
  const days = computeOrderDaysToDeadline(order);
  return days !== null && days < bufferDays;
};

// ── 權限（角色代號對齊腳手架 sessionStore）──
export const canAssignReviewer = (role) => role === 'order_manager' || role === 'reviewer_supervisor';
// 審稿人員本人才可完成審核／批次審稿：限自己負責且待審（等待審稿 / 已補件）的印件
export const canReviewItem = (item, role, reviewerId) =>
  role === 'reviewer' &&
  !!reviewerId &&
  item.assigned_reviewer_id === reviewerId &&
  (item.review_status === '等待審稿' || item.review_status === '已補件');
```

- [ ] **Step 2: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/prepress-review/_lib/selectors.js' && git commit -m "feat: 審稿模組頁面級純函式（母集合過濾/交期/權限）"
```

---

### Task 6: 審稿對話框元件（分派／完成審核／批次審稿）

**Files:**
- Create: `apps/erp/src/app/(prototype)/prepress-review/_components/AssignReviewerDialog.js`
- Create: `apps/erp/src/app/(prototype)/prepress-review/_components/SubmitReviewDialog.js`
- Create: `apps/erp/src/app/(prototype)/prepress-review/_components/BatchReviewDialog.js`

- [ ] **Step 1: AssignReviewerDialog.js（候選不過濾、能力僅參考標示、原因選填）**

```js
'use client';

import { App, Form, Input, Modal, Select, Typography } from 'antd';
import { useOrdersStore } from '../../orders/_lib/store';
import {
  PREPRESS_REVIEWERS,
  buildReviewerLoads,
} from '../../_lib/prepressReview';

const { Text } = Typography;

// 分派 / 改派統一對話框（2026-07-03 拍板：候選不過濾、能力僅參考、原因一律選填、混合批次）
// entries: [{ order_id, item_id, name, assigned_reviewer_id }]
export default function AssignReviewerDialog({ open, entries, onClose }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const orders = useOrdersStore((s) => s.orders);
  const assignReviewer = useOrdersStore((s) => s.assignReviewer);

  const loads = buildReviewerLoads(orders);
  const options = PREPRESS_REVIEWERS.filter((r) => r.active).map((r) => ({
    value: r.id,
    label: `${r.name}（能力 ${r.max_difficulty_level}／${r.available_status}／進行中 ${
      loads.find((l) => l.reviewer.id === r.id)?.active_load ?? 0
    } 件）`,
  }));

  const handleOk = async () => {
    const values = await form.validateFields();
    assignReviewer(
      entries.map(({ order_id, item_id }) => ({ order_id, item_id })),
      values.reviewer_id,
      values.reason ?? '',
    );
    message.success(`已分派 ${entries.length} 件印件`);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="分派審稿人員"
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText="確認分派"
      cancelText="取消"
      destroyOnClose
    >
      <Text type="secondary">
        本次分派 {entries.length} 件印件：{entries.map((e) => e.name).join('、')}
      </Text>
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="reviewer_id"
          label="審稿人員"
          rules={[{ required: true, message: '請選擇審稿人員' }]}
        >
          <Select placeholder="請選擇審稿人員" options={options} />
        </Form.Item>
        <Form.Item name="reason" label="原因（選填）">
          <Input.TextArea rows={2} placeholder="改派或特殊指派時可補充原因" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: SubmitReviewDialog.js（單件完成審核）**

驗證規則：不合格必選退件原因；原因＝「其他」時審稿備註必填；備註上限 1000 字。

```js
'use client';

import { App, Form, Input, Modal, Radio, Select } from 'antd';
import { useOrdersStore } from '../../orders/_lib/store';
import { REJECT_REASON_CATEGORIES, REVIEW_NOTE_MAX_LENGTH } from '../../_lib/prepressReview';

export default function SubmitReviewDialog({ open, orderId, item, onClose }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const submitReview = useOrdersStore((s) => s.submitReview);

  const handleOk = async () => {
    const values = await form.validateFields();
    submitReview(orderId, item.id, {
      result: values.result,
      reject_reason_category: values.result === '不合格' ? values.reject_reason_category : undefined,
      review_note: values.review_note ?? '',
    });
    message.success(`已完成審核：${values.result}`);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={`完成審核：${item?.name ?? ''}`}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onClose(); }}
      okText="送出審核"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ result: '合格' }}>
        <Form.Item name="result" label="審核結果" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="合格">合格</Radio>
            <Radio value="不合格">不合格</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.result !== b.result || a.reject_reason_category !== b.reject_reason_category}>
          {({ getFieldValue }) => (
            <>
              {getFieldValue('result') === '不合格' && (
                <Form.Item
                  name="reject_reason_category"
                  label="退件原因"
                  rules={[{ required: true, message: '不合格時必選退件原因' }]}
                >
                  <Select
                    placeholder="請選擇退件原因"
                    options={REJECT_REASON_CATEGORIES.map((c) => ({ label: c, value: c }))}
                  />
                </Form.Item>
              )}
              <Form.Item
                name="review_note"
                label="審稿備註"
                rules={[
                  {
                    required:
                      getFieldValue('result') === '不合格' &&
                      getFieldValue('reject_reason_category') === '其他',
                    message: '退件原因為「其他」時必填審稿備註',
                  },
                ]}
              >
                <Input.TextArea rows={3} maxLength={REVIEW_NOTE_MAX_LENGTH} showCount placeholder="選填；退件原因為「其他」時必填" />
              </Form.Item>
            </>
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 3: BatchReviewDialog.js（整批同一結果；不合格原因共用、備註可逐件覆寫）**

```js
'use client';

import { App, Collapse, Form, Input, Modal, Radio, Select, Typography } from 'antd';
import { useState } from 'react';
import { useOrdersStore } from '../../orders/_lib/store';
import { REJECT_REASON_CATEGORIES, REVIEW_NOTE_MAX_LENGTH } from '../../_lib/prepressReview';

const { Text } = Typography;

// 批次審稿：整批同一結果（全合格 / 全不合格）；個別印件有問題請先自批次移除、另行單獨送審。
// entries: [{ order_id, item_id, name }]
export default function BatchReviewDialog({ open, entries, onClose }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [noteOverrides, setNoteOverrides] = useState({});
  const submitBatchReview = useOrdersStore((s) => s.submitBatchReview);

  const handleOk = async () => {
    const values = await form.validateFields();
    submitBatchReview(
      entries.map(({ order_id, item_id }) => ({ order_id, item_id })),
      {
        result: values.result,
        reject_reason_category: values.result === '不合格' ? values.reject_reason_category : undefined,
        note: values.note ?? '',
        note_overrides: noteOverrides,
      },
    );
    message.success(`已批次審核 ${entries.length} 件印件：${values.result}`);
    form.resetFields();
    setNoteOverrides({});
    onClose();
  };

  return (
    <Modal
      title={`批次審稿（${entries.length} 件）`}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); setNoteOverrides({}); onClose(); }}
      okText="送出審核"
      cancelText="取消"
      width={560}
      destroyOnClose
    >
      <Text type="secondary">整批同一結果；個別印件結果不同時請自批次移除、另行單獨送審。</Text>
      <Form form={form} layout="vertical" initialValues={{ result: '合格' }} style={{ marginTop: 16 }}>
        <Form.Item name="result" label="審核結果" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="合格">合格</Radio>
            <Radio value="不合格">不合格</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.result !== b.result}>
          {({ getFieldValue }) =>
            getFieldValue('result') === '不合格' && (
              <>
                <Form.Item
                  name="reject_reason_category"
                  label="退件原因（整批共用）"
                  rules={[{ required: true, message: '不合格時必選退件原因' }]}
                >
                  <Select
                    placeholder="請選擇退件原因"
                    options={REJECT_REASON_CATEGORIES.map((c) => ({ label: c, value: c }))}
                  />
                </Form.Item>
                <Form.Item name="note" label="審稿備註（預設整批共用）">
                  <Input.TextArea rows={2} maxLength={REVIEW_NOTE_MAX_LENGTH} showCount />
                </Form.Item>
                <Collapse
                  ghost
                  items={[
                    {
                      key: 'overrides',
                      label: '逐件覆寫備註（選用）',
                      children: entries.map((e) => (
                        <Form.Item key={e.item_id} label={e.name} style={{ marginBottom: 8 }}>
                          <Input
                            value={noteOverrides[e.item_id] ?? ''}
                            onChange={(ev) =>
                              setNoteOverrides((prev) => ({ ...prev, [e.item_id]: ev.target.value }))
                            }
                            placeholder="留空則用整批共用備註"
                          />
                        </Form.Item>
                      )),
                    },
                  ]}
                />
              </>
            )
          }
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/prepress-review/_components/' && git commit -m "feat: 審稿對話框三件（分派/完成審核/批次審稿）"
```

---

### Task 7: 審稿列表（待審訂單／待分派審稿）與審稿詳情頁

**Files:**
- Create: `apps/erp/src/app/(prototype)/prepress-review/_components/ReviewOrderList.js`（兩列表共用元件）
- Create: `apps/erp/src/app/(prototype)/prepress-review/page.js`（待審訂單）
- Create: `apps/erp/src/app/(prototype)/prepress-review/pending-assign/page.js`（待分派審稿）
- Create: `apps/erp/src/app/(prototype)/prepress-review/detail/page.js`（審稿詳情，`?id=<印件id>`）

- [ ] **Step 1: ReviewOrderList.js（共用列表；`mode` 為 `'all'`｜`'pendingAssign'`）**

要點（完整實作依此規格展開，全部用真元件）：
- 資料：`useOrdersStore((s) => s.orders)`；`role`／`currentUser` 取自腳手架 `sessionStore`；`reviewerIdByName(currentUser)` 得審稿人員視角 id。
- 母集合：`mode==='all'` 用 `selectOrdersWithUnresolvedReview(orders, role==='reviewer' ? { assignedReviewerId: myId } : {})`；`mode==='pendingAssign'` 用 `selectOrdersWithPendingAssign(orders)`。
- 篩選列（`FilterBlock` 容器）：`Input`（placeholder「搜尋訂單編號 / 案名 / 客戶 / 印件名稱」，比對母訂單四欄）＋ antd `Checkbox`「僅顯示審稿逾期」（`isOrderOverdueInReview`）＋ 右側操作鈕：`PrimaryActionButton`「批次審稿」（僅 `role==='reviewer'` 顯示，選取項全部 `canReviewItem` 才 enabled）與 `PrimaryActionButton`「分派審稿人員」（僅 `canAssignReviewer(role)` 顯示，有選取即 enabled）。
- 母表格（`TableBlock`＋antd `Table`，`pagination={{ pageSize: 10 }}`，`expandable={{ expandedRowRender, defaultExpandAllRows: true }}`）欄位：訂單編號（`<a>` 連 `/orders/detail?id=...`）、案名、客戶、訂單狀態（`StatusTag`＋orders 的 `ORDER_STATUS_META`）、距交期天數（`computeOrderDaysToDeadline`；逾期以 `Typography.Text type="danger"` 顯示「N 天（逾期）」）、未完結印件數。
- 子表格（expandedRowRender 內再一個 antd `Table`，`pagination={false}`，`rowSelection`）：列出該訂單「審稿段未完結且非已棄用」印件（`pendingAssign` 模式只列 `isPrintItemPendingAssign` 的印件）；欄位：印件名稱（`<a>` 連 `/prepress-review/detail?id=<印件id>`）、類型（`StatusTag`＋`PRINT_ITEM_TYPE_META`）、難易度（`StyledTag` 用 `getDifficultyTier(level).color`，顯示「N（低/中/高/極高）」；null 顯示「—」）、審稿狀態（`StatusTag`＋`REVIEW_STATUS_META`）、負責審稿人員（`reviewerNameById`）、操作（「去審」`Button` size small，`canReviewItem` 時顯示，導 `/prepress-review/detail?id=...`）。
- 勾選狀態：單一 `useState(new Set())` 存 `${order.id}::${item.id}`，子表格 `rowSelection.onChange` 增刪；跨訂單混合批次允許。
- 兩個對話框：選取項組成 `entries`（含 `order_id`／`item_id`／`name`／`assigned_reviewer_id`）傳入 `BatchReviewDialog`／`AssignReviewerDialog`；對話框關閉後清空勾選。

- [ ] **Step 2: page.js 與 pending-assign/page.js（薄殼）**

```js
// page.js
'use client';
import ReviewOrderList from './_components/ReviewOrderList';
export default function PrepressReviewPage() {
  return <ReviewOrderList mode="all" />;
}
```

```js
// pending-assign/page.js
'use client';
import { Result } from 'antd';
import { useSessionStore } from '../../_lib/sessionStore';
import ReviewOrderList from '../_components/ReviewOrderList';
export default function PendingAssignPage() {
  const role = useSessionStore((s) => s.role);
  if (role !== 'order_manager') {
    return <Result status="403" title="僅訂單管理人可存取待分派審稿" />;
  }
  return <ReviewOrderList mode="pendingAssign" />;
}
```

- [ ] **Step 3: detail/page.js（審稿詳情，套 detail-page recipe）**

要點（完整實作依此規格展開）：
- `useSearchParams` 取 `?id=`（印件 id），掃 `orders` 找到 `order`＋`item`；找不到顯示 antd `Result` 404＋返回列表鈕。整頁包 `Suspense`（比照 `orders/detail/page.js` 第 269-275 行寫法）。
- 頁首列（比照 orders 詳情頁首）：返回鈕（`router.back()`）＋ `Typography.Title`「{item.print_item_no}　{item.name}」＋審稿狀態 `StatusTag`；右側操作：「完成審核」`PrimaryActionButton`（`canReviewItem(item, role, myId)` 時顯示，開 `SubmitReviewDialog`）＋「分派審稿人員」`PrimaryActionButton`（`canAssignReviewer(role)` 時顯示，開 `AssignReviewerDialog`，entries 單件）。
- 審稿進度 antd `Steps`（size small）：五步「待分派／稿件未上傳／等待審稿／合格／已確認可製作」；current 依 `review_status` 對映（待分派 0、稿件未上傳 1、等待審稿 2、不合格／已補件／待改稿 2 且 `status="error"`、合格 3、已確認可製作 4）。
- 分段（每段 `BorderBlock $autoHeight`＋`SectionHeader` number 遞增，`ReadOnlyField`／`ReadOnlyValue` 呈現）：
  1. 基本資訊：訂單編號（連 `/orders/detail?id=`）、案名、客戶、訂單狀態、印件類型、難易度、負責審稿人員、距交期天數
  2. 規格：規格備註、購買數量＋單位、交期、生產線（`expected_production_lines.join('、') || '—'`）
  3. 稿件檔案：antd `Table`（檔名／檔案角色（`StyledTag`）／上傳日期），空陣列顯示 antd `Empty`
  4. 審稿輪次：antd `Timeline`，輪次由新到舊；每則含「第 N 輪（source）」標題、送審（submitted_by／submitted_at／submitted_note）、結果（result `StyledTag`；null 顯示「待審」）、退件原因、審稿備註、審稿人員（`reviewerNameById`）；`source_print_item_id` 存在時顯示「沿用 {source_print_item_id} 合格稿件」
  5. 活動紀錄：antd `Timeline`，`review_activity_logs` 由新到舊；每則顯示 timestamp、type、actor（rv 開頭 id 經 `reviewerNameById` 轉名）、補充欄（rule_hit／reason／from_status→to_status／note）

- [ ] **Step 4: 瀏覽器驗證**

Expected（角色切到審稿人員 魏彣軒）：
1. `/prepress-review` 列出 ORD-2026-0090／0091／0004（0004 因 PI-0004-002 由 rv2 負責）；展開 0091 看到 PI-0091-001（等待審稿）與 PI-0091-002（已補件）兩列可勾選，「去審」按鈕顯示。
2. 搜尋框輸入「甜點」只剩 ORD-2026-0091；勾「僅顯示審稿逾期」時 0091（deadline 2026-07-12，距今 6 天 > 2 天緩衝）不出現、無逾期單則列表為空。
3. 角色切到訂單管理人：`/prepress-review/pending-assign` 只列 ORD-2026-0090（含待分派 PI-0090-001）；「分派審稿人員」鈕可用。
4. `/prepress-review/detail?id=PI-0091-002` 顯示 Steps（等待審稿位置、error 狀態）、輪次 Timeline 兩輪（第 2 輪待審＋補件備註、第 1 輪不合格＋退件原因）、活動紀錄。

- [ ] **Step 5: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/prepress-review/' && git commit -m "feat: 審稿列表（待審訂單/待分派）與審稿詳情頁"
```

---

### Task 8: orders 詳情掛載點升級（ItemsTab）

**Files:**
- Modify: `apps/erp/src/app/(prototype)/orders/_components/detail/ItemsTab.js`

- [ ] **Step 1: 表格加兩欄（「審稿狀態」欄之後）**

```js
      {
        title: '難易度',
        key: 'difficulty_level',
        width: 100,
        render: (_, record) => {
          if (record.row_kind === 'extra_charge' || record.difficulty_level == null) return DASH;
          const tier = getDifficultyTier(record.difficulty_level);
          return <StyledTag color={tier.color}>{`${record.difficulty_level}（${tier.label}）`}</StyledTag>;
        },
      },
      {
        title: '負責審稿',
        key: 'assigned_reviewer_id',
        width: 100,
        render: (_, record) =>
          record.row_kind === 'extra_charge' || !record.assigned_reviewer_id
            ? DASH
            : reviewerNameById(record.assigned_reviewer_id),
      },
```
（檔頭補 import：`getDifficultyTier, reviewerNameById` 自 `'../../../_lib/prepressReview'`。）

- [ ] **Step 2: 操作欄條件更新**

- 「上傳稿件」條件由 `record.review_status === '稿件未上傳'` 改為 `['待分派', '稿件未上傳'].includes(record.review_status)`
- 「補件」條件由 `record.review_status === '不合格'` 改為 `['不合格', '待改稿'].includes(record.review_status)`
- 新增「確認可製作」按鈕：`record.review_status === '合格' && record.order_source === 'B2B' && !readOnly` 時顯示；點擊 `modal.confirm` 確認後呼叫 `confirmProducible(order.id, record.id)`（store selector 檔頭補訂閱）＋ `message.success('已確認可製作')`

- [ ] **Step 3: 上傳／補件 Modal 換真實檔案選擇器**

兩個 Modal 的檔名 `Input` 改為 antd `Upload`（`beforeUpload={() => false}` 阻止自動上傳、`maxCount={1}`、`accept=".pdf,.ai,.psd,.tif,.jpg,.png"`），取 `file.name` 存入既有的 `uploadFileName`／`resupplyFileName` state；補件 Modal 加「補件說明（選填）」`Input.TextArea`（`maxLength={500}` 對應送審備註上限），呼叫 `resupplyArtwork(order.id, item.id, fileName, note)`。上傳成功訊息改為動態：待分派時「已上傳稿件並自動分派審稿人員」、其他「已上傳稿件，等待審稿」。

- [ ] **Step 4: 加「開啟審稿討論」功能**

- `SectionHeader` extra 區加 `SecondaryActionButton`「開啟審稿討論」，顯示條件：`order.order_type === '線下單' && !isOrderBeforeContractLock(order.status) && !readOnly`（回簽後的線下單）。
- 點擊開 Modal：antd `Checkbox.Group` 列出全部非已棄用印件（label 用印件名稱），至少勾一件才可送出；送出呼叫 `openReviewDiscussion(order.id, checkedIds)`＋`message.success('已開啟審稿討論並通知訂單管理人')`。
- 表格下方加一個 `BorderBlock $autoHeight` 區塊「審稿討論串」，列出 `order.review_discussions ?? []`：建立時間、發起人、涵蓋印件數、`<a href={thread_url} target="_blank">`Slack 討論串連結（mock）。無資料時整塊不渲染。

- [ ] **Step 5: 瀏覽器驗證（核心互動：上傳觸發自動分派）**

角色切到業務（洪嘉駿），開 `/orders/detail?id=ORD-2026-0090`＆tab=printItems：
1. PI-0090-001（待分派、難易度 4）點「上傳稿件」→ 選檔 → 確定。Expected: 審稿狀態變「等待審稿」、負責審稿變「魏彣軒」（能力 5 ≥ 4、rv2 字典序先於 rv6 的 tie-break 或能力最接近規則命中）、成功訊息「已上傳稿件並自動分派審稿人員」。
2. 切到審稿人員角色開 `/prepress-review`：ORD-2026-0090 展開後 PI-0090-001 出現在待審清單。
3. 「開啟審稿討論」：勾兩件印件送出後，頁面下方出現「審稿討論串」區塊含 mock Slack 連結；活動紀錄 Tab 出現「開啟審稿討論（2 件印件）」。

- [ ] **Step 6: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/orders/_components/detail/ItemsTab.js' && git commit -m "feat: 訂單詳情審稿掛載點（真實檔案選擇器/自動分派/確認可製作/審稿討論串）"
```

---

### Task 9: 模組 README（依賴註記）

**Files:**
- Create: `apps/erp/src/app/(prototype)/prepress-review/README.md`

- [ ] **Step 1: 建立檔案**

```markdown
# 審稿模組（prepress-review）prototype

需求正本：sens-erp-prototype 審稿模組（狀態機 / 自動分派演算法 / 輪次模型逐字對照
`src/utils/prepressReview.ts`）。範圍：待審訂單列表、待分派審稿列表、審稿詳情、
orders 詳情掛載點。審稿總覽（主管儀表板 / KPI）不在本次範圍。

## 依賴（handoff 注意）

- 本模組讀取 `(prototype)/orders/` 的 store 與 mock（審稿資料掛在訂單的印件上，
  單一資料真相）。**handoff 時 orders 需先行或與本模組一起搬**。
- 審稿資料異動 action 在 orders store（`orders/_lib/store.js`）：`uploadArtwork` /
  `resupplyArtwork` / `submitReview` / `submitBatchReview` / `assignReviewer` /
  `confirmProducible` / `openReviewDiscussion`——handoff 逐顆換 React Query mutation。
- 審稿純函式與審稿人員主檔在腳手架層 `(prototype)/_lib/prepressReview.js`
  （模擬後端邏輯，handoff 時由後端 API 取代、原地留下）。
- skill 的兩層放置規則未涵蓋「模組 → 模組」依賴，本模組為首例，已回報前端主管。
```

- [ ] **Step 2: Commit**

```bash
git add 'apps/erp/src/app/(prototype)/prepress-review/README.md' && git commit -m "docs: 審稿模組依賴與 handoff 註記"
```

---

### Task 10: 端到端驗證（七情境）＋截圖

**Files:** 無（驗證）

`pnpm dev:erp`，依序執行並逐項截圖：

- [ ] **情境 1（上傳→自動分派）**：業務角色，`/orders/detail?id=ORD-2026-0090` 上傳 PI-0090-001 稿件。成功條件：審稿狀態「等待審稿」、負責審稿「魏彣軒」、活動紀錄含「自動分配」。
- [ ] **情境 2（完成審核・不合格）**：審稿人員角色，`/prepress-review` → PI-0091-001「去審」→ 完成審核選不合格＋退件原因「解析度過低」。成功條件：狀態變「不合格」、輪次 Timeline 第 1 輪顯示不合格＋原因；驗證「其他」原因時備註必填的表單阻擋。
- [ ] **情境 3（補件→再審→合格→B2C 自動確認）**：業務角色在訂單詳情對 PI-0091-001 補件（含補件說明）→ 狀態「已補件」、開第 2 輪；切審稿人員完成審核合格 → 因 order_source B2C 狀態直達「已確認可製作」、活動紀錄含系統「確認可製作」。
- [ ] **情境 4（B2B 手動確認）**：業務角色，ORD-2026-0090 的 PI-0090-003（合格）點「確認可製作」→ 狀態「已確認可製作」，該印件自 `/prepress-review` 列表消失（若訂單所有印件皆完結，母列一併消失）。
- [ ] **情境 5（批次審稿）**：先以訂單管理人將 PI-0090-002 上傳稿件（狀態等待審稿）後切審稿人員，列表勾選兩件自己負責的待審印件 → 批次審稿全合格。成功條件：兩件狀態同步更新、各自活動紀錄含「批次審稿」＋「送出審核」。
- [ ] **情境 6（分派／改派）**：訂單管理人角色，`/prepress-review/pending-assign` 勾 PI-0090-001（若情境 1 已消化，改用新增印件產生的待分派件）→ 分派給范湘瑜；再於詳情頁改派回魏彣軒（填原因）。成功條件：負責人變更、活動紀錄分別出現「手動分派」與「改派（含原因）」；審稿人員角色看得到新分派的印件。
- [ ] **情境 7（視角與過濾）**：審稿人員視角看不到 PI-0004-001（rv6 負責）；待分派清單僅訂單管理人選單可見；審稿主管角色可在列表／詳情操作「分派審稿人員」但看不到「完成審核」。
- [ ] **回歸檢查**：`/orders` 列表與訂單詳情各 Tab 正常、after-sales 頁正常（共用 orders store 未破壞）、browser console 無紅字錯誤。
- [ ] **截圖**：情境 1／3／6 的關鍵畫面與 `/prepress-review` 列表全貌，存工作目錄外的 scratchpad，附進 PR。

---

### Task 11: 發 PR

- [ ] **Step 1: push 並依 erp repo PR 模板發 PR**

```bash
git push -u origin prototype/prepress-review
gh pr create --repo <erp repo> --title "feat: 審稿模組 prototype（待審訂單/待分派/審稿詳情/訂單掛載點）" --body-file <依 .github/PULL_REQUEST_TEMPLATE.md 撰寫>
```

PR 內文必含（繁體中文、依模板四段：Linear issue 填 N/A／開發項目勾選／修改內容／驗證／備註）：
1. 備註段附「模組間依賴說明」：prepress-review → orders（讀資料）；handoff 時 orders 先行或一起搬；skill 未規範模組間依賴，本 PR 為首例，請前端主管裁決是否補規範
2. 備註段附「腳手架層改動清單」：sessionStore 加三角色、layout 選單加審稿管理群組、新增 `_lib/prepressReview.js`
3. 驗證段貼 Task 10 七情境結果與截圖

---

## Self-Review 檢核（計畫完成後執行者自查）

1. 規格覆蓋：設計文件 §二 範圍四項（兩列表／詳情／掛載點）各有對應 Task（7／7／8）；不納入項（儀表板／建工單／免審與售後補印觸發）無任何 Task 實作、僅 mock 種子呈現 ✓
2. 型別一致：`review_status`（8 態）／`review_rounds`／`review_activity_logs`／`assigned_reviewer_id` 等欄位名在 Task 3／4／5／6／7／8 一致；`entries` 形狀 `{order_id, item_id}` 在 store 與對話框一致 ✓
3. 依賴方向：腳手架 `prepressReview.js` 零 import；orders 只 import 腳手架；prepress-review import orders＋腳手架 ✓
