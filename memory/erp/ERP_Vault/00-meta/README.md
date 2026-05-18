---
type: meta
status: active
last-reviewed: 2026-05-19
---

# ERP_Vault 入口

> 此處為 Sens ERP 與圖編產品的「商業需求 KM」中樞。先讀 [[vault-charter]] 了解定位與三邊分工。

## 給人讀（Miles）

建議閱讀順序：

1. [[vault-charter]] — 本 Vault 的章程、三邊分工、Source of Truth 規則
2. [[editing-conventions]] — frontmatter schema、wiki link 規則、檔名規約（**新建任何卡前必讀**）
3. [[scope-boundary]] — 哪些內容收進來、哪些不收（**Phase C 撰寫**）
4. [[sync-workflow]] — Vault ↔ OpenSpec ↔ Notion 同步流程（**Phase C 撰寫**）
5. `01-products/erp/product-vision.md` — ERP 產品願景與痛點
6. `03-roles/` — 五大角色 + Notion DB 補齊角色
7. `09-canvases/` — JSON Canvas 視覺化（在 Obsidian app 開啟最佳）

## 給 AI 讀（Claude Code）

撰寫 OpenSpec change proposal 時，本 Vault 為「商業背景 ground truth」，依模組與議題類型查詢以下節點：

| 議題類型 | 進入點 |
|---------|--------|
| 商業目標 / Phase / 北極星指標 | `01-products/erp/product-vision.md`、`phases.md`、`success-metrics.md` |
| 痛點 / 自建 ERP 動機 | `01-products/erp/pain-points.md` |
| 利害關係人 | `01-products/erp/stakeholders.md` |
| 功能優先度評估 | `01-products/erp/impact-score-framework.md`（4 維度評分） |
| 印刷業 domain / 術語 | `02-domain/printing-industry.md`、`glossary-*.md` |
| 角色權責 | `03-roles/<角色名>.md` |
| 商業邏輯（齊套 / 報價 / 付款發票 / 審稿等） | `04-business-logic/<邏輯名>.md` |
| 資料模型實體與欄位 | `05-entities/<實體名>.md` |
| 狀態機 | `06-state-machines/<實體名>狀態.md` |
| 跨模組情境 | `07-scenarios/<情境名>.md` |
| 既有 OQ | `08-open-questions/<OQ 編號>.md`（Phase B 後寫入） |

撰寫時於 proposal `## Why` / `## Background` 段以 wiki link 引用對應節點，例：

```markdown
本 change 解決的商業需求見 [[齊套邏輯]] 與 [[工單]]，涉及角色 [[業務]]、[[印務主管]]。
```

## 目錄結構

完整結構見 [[vault-charter]] § 四。

## 工具

- **Obsidian Desktop**：人工編輯介面 / Graph view / Canvas / Backlinks panel
- **Obsidian CLI**（v1.12.7+）：`obsidian search`、`backlinks`、`orphans`、`bases` 等命令列操作
- **kepano/obsidian-skills**（已安裝於 `~/.claude/skills/`）：
  - `obsidian-markdown` — wiki link / embed / callout 結構化寫入
  - `obsidian-bases` — `.base` 檔案操作
  - `json-canvas` — `.canvas` 檔案操作
  - `obsidian-cli` — 包裝 CLI 的高階查詢

## 不在此 Vault

| 內容類型 | 位置 |
|---------|------|
| UI 設計系統 | `sens-erp-prototype/DESIGN.md` |
| UI 業務規則 | `memory/shared/ui-business-rules.md` |
| Prototype 設計原則 | `memory/shared/principles.md` |
| 演算法 / 計算公式 | Prototype `src/utils/` |
| 功能 step Requirement | OpenSpec 各模組 spec |
