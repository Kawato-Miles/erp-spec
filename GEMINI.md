# Sens 專案：印刷 ERP / MES 與線上商品編輯器規格

## 專案概覽
Sens 是一個以規格驅動（Specification-driven）為核心的專案倉庫，主要負責**印刷業 ERP / MES 系統**（生產排程 / 客戶訂單管理 / BOM 管理）與 **B2C Saas 線上商品編輯器**的規格定義。本倉庫是業務邏輯與系統需求的「唯一事實來源」（Single Source of Truth）。

- **核心技術：** OpenSpec (需求管理)、Markdown (文件化)、自定義 Claude Agents 與 Skills。
- **關聯專案：** 實際的 ERP Prototype 位於獨立倉庫 `sens-erp-prototype` (React + TypeScript + Tailwind + shadcn/ui)。你只能作為需求參考的來源，不可以直接編。
- **核心策略：** Prototype 優先、邏輯驗證優於空談，並嚴格遵守台灣在地化繁體中文術語。

---

## 核心原則 (GEMINI.md 強制規範)

1.  **Prototype 優先：** 著重於規格、邏輯與情境驗證。除非在 Change 的 「Apply」階段，否則**不撰寫實作程式碼**。
2.  **邏輯驗證優於空談：** 所有的設計決策必須附帶具體例子與計算驗證。
3.  **台灣繁體中文：** 所有文件與 UI 描述必須使用台灣印刷產業術語（例如：使用「推演」而非「走查」，「說明」而非「描述」）。
4. **Obsidian wiki (Vault) 為業務正本：** 位於 `memory/Sens_wiki/wiki/` 是業務邏輯(BRD)的權威來源；OpenSpec (`openspec/specs/`) 則是系統行為的規格（PRD）正本。

---

## 關鍵指令與工作流

本專案使用
1. **Obsidian CLI** 來管理 BRD 內容，所有 Obsidian 的操作，優先使用 CLI，規範可參考 `.claude/rules/sens-wiki.md`
2. **OpenSpec (opsx)** 工作流來管理所有 PRD 規格變動。

### 變更管理指令
| 指令 | 用途 |
| :--- | :--- |
| `/opsx:explore` | 在正式建立變更前，進行問題探索與方向驗證。 |
| `/opsx:propose` | 在 `openspec/changes/` 建立新變更（包含提案、設計與任務清單）。 |
| `/opsx:apply` | 根據 `tasks.md` 在 Prototype 倉庫實作變更。 |
| `/opsx:verify` | 執行測試 (Playwright/Vitest) 並驗證實作是否符合規格。 |
| `/opsx:archive` | 將 Delta Specs 合併回主規格檔並歸檔變更。 |

### 專用 Skills
- `oq-manage`：管理 Vault 中的待確認事項 (Open Questions, OQ)。
- `erp-planning-pre-check`：在任何 ERP 規劃開始前，必須執行的業務領域稽核。
- `doc-audit` / `vault-audit`：執行規格與 Vault 之間的一致性檢查。
- `erp-user-story` / `erp-test-case`：產出業務故事與測試案例，並同步至 Notion。
- `obsidian-markdown`：操作 Obsidian Markdown 屬性、Embeds 與 Callouts。
- `obsidian-cli`：透過 CLI 執行 Obsidian 專屬操作。
- `json-canvas`：讀取與修改 Obsidian Canvas (.canvas) 檔案。
- `defuddle`：協助釐清模糊的需求、概念或複雜邏輯。

---

## 專案結構

- `openspec/`：所有技術規格與活動中變更的中心。
    - `specs/`：主規格檔案（需求、資料模型、狀態機）。
    - `changes/`：活動中與已歸檔的功能變更。
- `memory/`：專案知識與記憶。
    - `Sens_wiki/wiki/` (Vault)：權威業務邏輯與領域知識。
    - `erp/` / `graphic-editor/`：領域術語表與特定工作流。
    - `shared/`：通用原則、UI 規範與 Notion 索引。
- `.claude/`：自定義 AI Agents 與 Skills 的設定。

---

## 開發規範

### 文件撰寫
- **語言：** 繁體中文 (zh-TW)。需完整考慮台灣繁體中文用語，不可直接機翻。
- **格式：** 純 Markdown。規格檔內禁用 Emoji。
- **引用：** 引用 Notion 頁面時一律使用 `[可讀名稱](URL)` 格式。

### Commit 訊息
遵循格式：`{prefix}: {繁體中文描述}`
- **前綴 (Prefixes)：** `feat:`, `fix:`, `refactor:`, `docs:`
- **強制後綴：** `Co-Authored-By: Gemini CLI>`

### OQ 管理
禁止在歸檔文件中留下行內問題或 `[!question]` callout。所有未解事項必須使用 `oq-manage` 遷出至 Vault 管理。

---

## 外部資源 (Notion MCP)
專案高度依賴 Notion 作為規格的「發布版本」與進度追蹤。
- **Notion 資源索引：** `memory/shared/notion-index.md`
- **MCP 伺服器：** `notion`, `figma` (配置於 `.mcp.json`)
