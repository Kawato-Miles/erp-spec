---
type: meta
status: active
last-reviewed: 2026-05-28
---

# 11-review-knowledge 入口

> 此目錄為 ERP 三 agent（[senior-pm](../../../../.claude/agents/senior-pm.md) / [ceo-reviewer](../../../../.claude/agents/ceo-reviewer.md) / [erp-consultant](../../../../.claude/agents/erp-consultant.md)）的「審查與協作方法論」層，與 01-10 業務層並列。
>
> **2026-05-28 大改**：[[sequential-design-collaboration]] 重塑為「PM-中介來回」模型（Phase 2/3 上限 2 次來回、Phase 2.5 廢除、Phase 4 加 verify consistency）。CEO / ERP 顧問在 sequential 下角色定位變更（管理層需求提出方 / 統合需求設計者）。新建 [[dispatch-prompt-template]] 規範 sub-agent 呼叫 prompt 5 區塊標準。[[multi-agent-discussion-protocol]] 標 `deprecated-verify-only`，僅 `/opsx:verify` 前審查保留。
> **2026-05-26 變更（歷史）**：新增 [[sequential-design-collaboration]] 序列協作協議。

## 一、定位

- **承載內容**：審查維度框架、審查誤區、設計模式、命名規則、跨 agent 共用規範、多視角討論協議
- **不承載內容**：業務邏輯 / 實體 / 狀態機 / 角色（這些在 02-07）；Agent 自身的觸發設定 / 輸出格式 / 行為規範（這些留在 `.claude/agents/<name>.md`）
- **與 [[04-business-logic]] 的邊界**：04 是「業務怎麼運作」，11 是「如何審查業務設計」。前者是被審查對象，後者是審查工具。

## 二、目錄結構

```
11-review-knowledge/
├── README.md                                  入口（本檔）
├── _shared/                                   跨 Agent 共用（任一 agent 都載）
│   ├── prototype-stage-context.md             prototype 探索階段背景
│   ├── language-conventions.md                台灣繁體中文用語規則
│   ├── insight-discipline.md                  Insight 不是讚美 / 必附解法 / 必附 URL
│   ├── cross-agent-checklist.md               跨 agent 共用 checklist
│   └── review-loading-checklist.md            背景載入規則 + 設計理解摘要 + 防誤審記錄
├── pm/                                        senior-pm 專屬
│   ├── pm-review-framework.md                 BRD 審查 5 維度
│   ├── early-intervention-framework.md        前期介入 5 維度
│   ├── user-story-spec.md                     User Story 撰寫規格
│   └── pm-data-map.md                         PM 視角資料地圖索引表
├── ceo/                                       ceo-reviewer 專屬
│   ├── ceo-review-framework.md                審查 6 維度（5 既有 + KPI 對齊新增）
│   └── ceo-review-pitfalls.md                 常見誤區 + 有效角度
├── erp/                                       erp-consultant 專屬
│   ├── erp-review-framework.md                審查 6 維度 + 5 設計模式 checklist 反向掛入
│   ├── erp-design-patterns.md                 5 個資料模型設計模式
│   ├── erp-naming-rules.md                    用語規則 + 5 秒測試
│   └── erp-naming-misjudgements.md            命名誤審記錄
└── protocols/                                 流程協議
    ├── sequential-design-collaboration.md     **主協議**：序列式設計協作（4-Phase + PM-中介 Phase 2/3 來回上限 2）
    ├── dispatch-prompt-template.md            Sub-agent 呼叫 prompt 5 區塊標準（2026-05-28 新建）
    ├── multi-agent-discussion-protocol.md     舊協議：多 Agent 輪次討論（deprecated-verify-only，僅 verify 前驗收用）
    ├── lightweight-review-mode.md             單 Agent 輕量審查
    └── senior-pm-write-mode.md                Senior PM Mode A/B 寫入流程
```

## 二之一、協議選擇決策樹

```
討論類型（依 CLAUDE.md § ERP 討論主動路由 判定）
   ↓
┌─ 純查詢 / 純澄清 ────────────→ 不啟動任何協議，直接回答
│
├─ 局部欄位調整 / 系統一致性 ─→ [[lightweight-review-mode]]（單 agent 單輪）
│
├─ 規格撰寫 / 變更 / 結構性變更 / 商業邏輯
│  └─ `/opsx:explore` 階段 ───→ [[sequential-design-collaboration]] Phase 1（單 PM）
│  └─ `/opsx:propose` 階段 ───→ [[sequential-design-collaboration]] Phase 1-4
│                                  Phase 2 PM↔CEO 來回上限 2
│                                  Phase 3 PM↔ERP 來回上限 2
│                                  Phase 4 PM 集中收斂 + verify consistency
│  └─ `/opsx:verify` 前 ──────→ [[multi-agent-discussion-protocol]]（過渡期保留，最終驗收前審查）
│
└─ 已 verify 完成 / 純歸檔 ───→ 不啟動，跑 vault-audit skill
```

**dispatch prompt 組裝**：協調者呼叫任一 sub-agent 時，prompt MUST 依 [[dispatch-prompt-template]] 5 區塊組裝。

## 三、引用慣例

### Agent.md 引用本目錄

Claude Code 的 Read 工具吃絕對路徑，wikilink 在工具層失效。`.claude/agents/<name>.md` 中採絕對路徑 + wikilink 雙寫格式，便於 Miles 在 Obsidian 中跳轉：

```
Read: memory/Sens_wiki/wiki/erp/11-review-knowledge/erp/erp-review-framework.md
（Vault 內 [[erp-review-framework]]）
```

### 本目錄內部互引

統一使用 wikilink：`[[erp-design-patterns]]`、`[[language-conventions]]`、`[[multi-agent-discussion-protocol]]`。

### 引用業務層

連到 02-07 業務卡用 wikilink：`[[齊套邏輯]]`、`[[訂單]]`、`[[業務]]`。
連到 OpenSpec 用相對路徑 markdown link：`[work-order/spec.md](../../../../openspec/specs/work-order/spec.md)`。

## 四、給人讀（Miles）

建議閱讀順序：

1. `_shared/` 全部 — 三個 agent 共用的基礎規範（一次讀完）
2. 對應視角的子目錄 — 想了解 PM 視角讀 `pm/`，想了解 CEO 視角讀 `ceo/`，依此類推
3. `protocols/` — 想了解三視角討論機制怎麼運作時讀

## 五、給 AI 讀（Claude Code）

三個審查 agent（senior-pm / ceo-reviewer / erp-consultant）執行時，依以下載入序：

| 步驟 | 載入 |
|------|------|
| 1 | `_shared/prototype-stage-context.md`（共用階段背景） |
| 2 | `_shared/language-conventions.md`（共用用語規則） |
| 3 | `_shared/insight-discipline.md`（共用行為規範） |
| 4 | `_shared/review-loading-checklist.md`（背景載入規則 + 設計理解摘要 + 防誤審記錄） |
| 5 | 對應子目錄的審查框架（如 erp-consultant 載入 [[erp-review-framework]]、[[erp-design-patterns]]、[[erp-naming-rules]]）|
| 6 | 依議題類型載入 Vault 02-07 業務層對應卡 |

序列協作時，協調者額外載入 [[sequential-design-collaboration]] + [[dispatch-prompt-template]]，並依 Phase 編號 + Round 編號傳遞前序輸出全文（依 dispatch-prompt-template 5 區塊組裝）；最終驗收前審查時載入 [[multi-agent-discussion-protocol]]；單 Agent 輕量審查時載入 [[lightweight-review-mode]]。

## 六、相關卡

- [[erp_index]] — Vault 三邊分工
- [[scope-boundary]] — Vault 收 / 不收邊界
- [[wiki-schema]] — Frontmatter / wiki link / 檔名規約
