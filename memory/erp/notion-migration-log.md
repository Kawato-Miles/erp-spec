---
name: Notion 遷移記錄與工作流
description: memory 檔案遷移至 Notion 的進度、方式與命名規則，供後續接續執行
type: project
---

# Notion 遷移記錄與工作流

**Why:** 將業務參考文件集中至 Notion，方便團隊共享；Claude 操作指引留在 Repo。
**How to apply:** 每次遷移前查此文件確認進度，遷移後更新表格與索引。

---

## 已遷移（Notion 正本）

| 本地檔案 | Notion 頁面 | Notion URL | 遷移日期 |
|---------|------------|-----------|---------|
| `memory/erp/state-machines.md` + `memory/erp/state-machines-ops.md` | 狀態變化（合併為同一頁面，分上層 / 下層兩段）| https://www.notion.so/32c3886511fa81539eb9d3c97630caa0 | 2026-03-23 |
| `memory/erp/business-process.md` | 商業流程 | https://www.notion.so/32c3886511fa81ccaaf9fbfd3882f19a | 2026-03-23 |
| `memory/erp/scenarios.md` | 業務情境 DB（原本已在 Notion）| https://www.notion.so/3163886511fa808a9d9bda01dc812206 | 先前 |
| `memory/erp/open-questions.md` | Follow-up DB（OQ + Task）| https://www.notion.so/32c3886511fa808e9754ea1f18248d92 | 先前 |
| `spec/*.md`（所有規格書）| Feature Database | https://www.notion.so/2823886511fa83d08c16815824afd2b7 | 先前 |

父頁面（Roadmap）：https://www.notion.so/Roadmap-8ba3886511fa83f8a5ce8173a6de3eca

---

## 待遷移（建議優先序）

| 本地檔案 | 建議 Notion 頁面名稱 | 優先 | 備註 |
|---------|-------------------|------|------|
| `memory/erp/product-goals.md` | 產品目標 | 高 | 商業目標 / KPI，適合關係人閱讀 |
| `memory/erp/user-scenarios.md` | 使用者情境 | 高 | 角色需求故事，與 Spec 強相關 |
| `memory/erp/quantity-calculation-rules.md` | 數量換算規則 | 中 | Prototype 設計參考 |
| `memory/erp/shipment-logic-diagnosis.md` | 出貨邏輯診斷 | 中 | 設計診斷紀錄，可作 Spec 附件 |
| `memory/erp/test-cases.md` | 測試案例 | 中 | 45+ 測試案例，與 Spec 一起維護較方便 |
| `memory/erp/glossary.md` | ERP 術語表 | 低 | 術語適合 Notion wiki |
| `memory/shared/glossary.md` | 共用術語 | 低 | 同上 |
| `memory/graphic-editor/glossary.md` | 圖編術語 | 低 | 同上 |
| `memory/shared/context/industry.md` | 產業背景 | 低 | 背景知識 wiki |

## 留在 Repo（Claude 操作指引）

| 檔案 | 原因 |
|------|------|
| `CLAUDE.md` | Claude 主要指引，必須在 Repo |
| `MEMORY.md` | Claude 記憶索引 |
| `memory/feedback_*.md` | Claude 行為修正記憶 |
| `memory/erp/spec-iteration-workflow.md` | 告訴 Claude 如何執行迭代流程 |
| `memory/shared/prototype-guidelines.md` | 告訴 Claude Prototype 製作規則 |
| `memory/shared/ui-design-system.md` | 告訴 Claude 用哪些 UI 元件 |
| `memory/shared/principles.md` | 可考慮與 CLAUDE.md 合併 |
| `memory/erp/open-questions-archive.md` | 歷史存檔，低頻讀取 |

---

## 遷移 SOP（每次搬移一份文件）

### Step 1：確認父頁面
所有 ERP 參考文件放在 Roadmap 頁面下：
`https://www.notion.so/Roadmap-8ba3886511fa83f8a5ce8173a6de3eca`

### Step 2：建立 Notion 頁面
```
mcp__notion__notion-create-pages
  parent: { page_id: "8ba3886511fa83f8a5ce8173a6de3eca" }
  pages: [{ properties: { title: "頁面名稱" } }]
```

### Step 3：寫入內容
```
mcp__notion__notion-update-page
  page_id: <新頁面 ID>
  command: "replace_content"
  new_str: <本地檔案內容，轉為 Notion Markdown>
```

### Step 4：更新三個索引檔案
遷移後必須同步更新以下三處，否則 Claude 下次找不到：

| 索引檔 | 更新位置 |
|--------|---------|
| `CLAUDE.md` | § 核心原則 § 2.5、§ 載入原則表、§ ERP 資源表 |
| `.claude/skills/erp-spec/SKILL.md` | Step 2 必讀表、§ 參考資源表 |
| `memory/erp/spec-iteration-workflow.md` | § 迭代涉及的 ERP 參考檔案表、§ 迭代中各表、§ 快速參考 |

### Step 5：Commit
```
git add CLAUDE.md .claude/skills/erp-spec/SKILL.md memory/erp/spec-iteration-workflow.md
git commit -m "refactor: 將 [檔名] 遷移至 Notion，更新索引引用

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## 命名規範

- 同一 Notion 頁面含多個原始檔時，用 `§ 上層` / `§ 下層` 區分段落
- CLAUDE.md ERP 資源表：直接寫 `Notion 頁面名稱：<URL>`
- SKILL.md / spec-iteration-workflow.md：用 `Notion 頁面名稱` + 必要時補 URL
- 只在快速參考 / 索引表中保留完整 URL，正文用名稱即可
