---
paths:
  - memory/Sens_wiki/**
---

# Sens 知識庫操作模式

## 一、角色與語言

- **角色**：你正在維護一個 LLM Wiki（根據 [Karpathy的規範](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)），你的任務是把零散資訊編譯成結構化、互相連結的卡片，編譯成高度相互鏈接的知識庫；每次納入新素材都要更新相關卡、維護目錄與操作史、標記矛盾。
- **語言鐵則（後續所有產出的評分標準）**：卡名、段落、欄位描述一律**繁體中文**，依**語意**翻譯，**禁直譯、禁中英夾雜**。
  - 範例：business process → 業務流程、work order → 工單、payment → 付款紀錄、print item → 印件。
  - 技術 token 例外：skill 名（`vault-ingest`）、frontmatter 欄位名（`type` / `status`）保留原樣，但說明文字用繁中。

## 二、目錄與權限（底線）

你必須嚴格遵守以下文件操作權限，不可逾越
- `raw/`：素材真相層，**唯讀不可變，禁止修改 / 刪除**。
- `assets/`：媒體資產，引用用 `![[檔名]]`。
- `wiki/`：知識輸出層，可寫。這是你的專屬工作區，你需要在此創建、更新、提煉知識並解決矛盾，改任何卡都在這裡。

## 三、共用標準（所有主題、所有卡都遵守）

- **所有 wiki 頁面使用 Markdown**
- **所有生成的 wiki 都必須包含下列 frontmatter 必填**：
  ``` yaml
  ---
  title: "頁面標題"
  type: "資料結構"
  status: "草稿|有效|棄用"
  last-reviewed: YYYY-MM-DD
  ---
  ```
- **內部連結**：每個 wiki 頁面必須有 `##關聯區域`，連結到相關內容，並使用 Obsidian `[[wikilink]]` 語法，不用完整相對路徑，絕不能產生孤島頁面。
- **外部連結**：連 vault 外（OpenSpec / Prototype）用相對路徑 markdown link。
- **命名繁中語意化（產出評分標準）**：所有命名依語意翻譯、不直譯、不中英夾雜（見 § 一語言鐵則）；帶序號的卡用 `前綴-NNN-簡述`（NNN 三位補零）。
- **禁孤島**：每張卡至少被一張卡連到。互鏈**機制**各主題自定（如 ERP 用「依據往上、實作往下」兩欄連結）。

> 以上是唯一跨主題標準。主題專屬欄位（module / 領域 / tag / 序號前綴 / 各 type 細則）放各主題 `00-meta/`。

## 四、寫入後必維護

每次動 `wiki/` 後，同步維護兩個基石檔：

- **`wiki/index.md`（總目錄）**：新增 / 刪除卡時同步。格式分主題 →（分層）列：
  ```
  ## ERP
  ### 資料結構
  - [[卡名]] — 一句話描述
  ```
- **`wiki/log.md`（操作史）**：只追加（append-only）。格式：
  ```
  ## [YYYY-MM-DD] <動作> | <一句話簡述>
  - 變更：新增 [[A]]、更新 [[B]]
  - 衝突：無（或：與 [[C]] 衝突，已開 OQ）
  ```
  動作 enum（繁中）：**納入 / 查詢 / 健檢 / 同步**。

## 五、工作流

| 工作流 | 做什麼 | 由誰執行 |
|--------|--------|---------|
| 納入（ingest）| 素材 `raw/` → 精練進 `wiki/` | `vault-ingest` skill |
| 查詢（query）| 讀 index 定位 → 讀卡 → 附 `[[引用]]` 作答 → 高價值答案固化成卡（ERP 走 `12-insights/`），不讓探索價值只留對話 | 日常對話 |
| 健檢（lint）| 巡檢：矛盾 / 死鏈 / 孤兒 / 過時 / 缺欄位 / **命名違反繁中語意化（直譯 / 中英夾雜）** | `vault-audit` skill |

- **Obsidian 稽核 / 查詢一律優先用 `obsidian-cli`**：搜尋（`obsidian search`）、讀卡（`obsidian read`）、反向連結 / 死鏈 / 孤兒（`obsidian backlinks` / `deadends`，或 `obsidian eval` 查 `metadataCache.unresolvedLinks`）一律走 CLI，**不以 grep 當 vault 稽核手段**（grep 只看純文字，無法解析 wiki link 與 vault 索引）。
- **矛盾不靜默覆寫**：發現矛盾立即開 OQ 卡（`oq-manage` skill），原處改連結引用，不直接蓋掉舊說法。

## 六、新增主題（recipe）

1. 建 `wiki/<topic>/`；需要才加 `wiki/<topic>/00-meta/` 放主題專屬規則（type 清單 / 命名前綴 / 目錄）。
2. 直接沿用 § 三共用標準，不重寫。

鐵則（YAGNI）：主題專屬的留在主題；共用標準只長不為單一主題膨脹。

## 七、各主題專屬規則入口

- **ERP**（產品，wiki 與 OpenSpec 的 BRD / PRD 分工見 [CLAUDE.md](../../CLAUDE.md) § wiki 與 OpenSpec 分工）：導航入口 `wiki/erp/00-meta/`（[[wiki-schema]] / [[wiki-architecture]] / [[vault-charter]] 等）。
- **編輯器 canvas**（產品）：`wiki/canvas/`，內部結構待依需求定義。
