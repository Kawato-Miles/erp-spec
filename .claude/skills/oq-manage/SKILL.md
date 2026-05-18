---
name: oq-manage
description: >
  OQ（Open Question）管理 skill。
  觸發時機：發現設計不確定項、Miles 說「新增 OQ」「這個要記下來」「有個問題要確認」，
  或任何 Spec / 規劃 / 討論中需要新增、查詢、更新 OQ 時（不限於 Spec 撰寫情境）。
  此 skill 強制執行去重邏輯：新增前先搜尋相似 OQ，由 Claude 分析並建議，由 Miles 決定。
  正本：Vault `memory/erp/ERP_Vault/08-open-questions/`（Vault Charter v2026-05-19 變更）。
  不適用：已確認的決策記錄、術語定義更新、一般討論備忘。
---

# OQ 管理

統一管理 ERP 模組的 Open Questions。**操作正本在 Vault**，Notion OQ DB 留作對外確認版。

---

## 重要變更（2026-05-19 v2）

依 [[../../memory/erp/ERP_Vault/00-meta/vault-charter|Vault Charter]] § 三同步方向：

| 項 | 舊（v1）| 新（v2，本版）|
|---|--------|--------------|
| OQ 操作正本 | Notion Follow-up DB | Vault `08-open-questions/` |
| skill 寫入位置 | Notion（透過 MCP）| Vault markdown 檔（Write） |
| Notion 角色 | 內部正本 | 對外確認版（彙整推送時更新） |
| 推送 Notion 時機 | 即時 | Miles 觸發（見 [[../../memory/erp/ERP_Vault/00-meta/sync-workflow]]）|

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| A：查詢 | 討論開始前 / 確認特定模組的未解 OQ |
| B：新增（含去重）| 識別到不確定項 / Miles 說「新增 OQ」|
| C：更新 | OQ 已解答 / 說明需補充 |

---

## Vault 位置與檔名規約

- **目錄**：`/Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions/`
- **檔名格式**：`<MODULE>-<NNN>-<簡述 slug>.md`
- **範例**：
  - `ORD-008-訂單審核權限是否分層.md`
  - `XM-003-合批派工合併邏輯.md`
  - `SHP-005-分批出貨觸發節點.md`

---

## Frontmatter Schema（OQ 卡）

```yaml
---
type: open-question
module:
  - <模組>  # quote-request / order-management / work-order / production-task / qc / shipping / consultation-request / after-sales-ticket / cross-module
oq-id: <MODULE>-<NNN>  # 例：ORD-008
status: open           # open / answered / cancelled
priority: high         # high / medium / low
audience: internal     # internal / external（取代舊「內外部」欄位）
raised-at: YYYY-MM-DD
raised-by: <角色或姓名>
source-link: <討論連結 / Notion 頁面 / Slack URL>
related-vault:
  - <wiki link 至相關 vault 卡>
related-oq:
  - <其他相關 OQ 的 oq-id>
expected-resolution-at: YYYY-MM-DD  # 可選
answered-at: YYYY-MM-DD             # status=answered 時填
answered-by: <角色或姓名>            # status=answered 時填
notion-published-at: YYYY-MM-DD     # 若已推送 Notion 對外確認時填
notion-page-url: <URL>              # 若已推送則記錄頁面
---
```

---

## audience 預設規則

**所有討論 Spec / 規格設計延伸的 OQ，新增時預設 `audience: internal`。**

- 目的：避免與外部廠商 / 客戶 / 跨部門討論時，混入僅限內部研發釐清的設計細節
- 適用範圍：所有 erp-spec / opsx:explore / opsx:propose / 其他設計討論新增的 OQ
- 例外：僅當 Miles 明確指示「這條要讓 X 外部回答」或 OQ 主體屬於外部決定（如：客戶需求確認、廠商技術回覆）時才設為 `external`
- 實作：Step B3 frontmatter 預設 `audience: internal`（除非 Miles 明確改）

---

## 模式 A：查詢

### 查單一模組所有未解 OQ

```bash
cd /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions
grep -l "status: open" *.md | xargs grep -l "module:.*<模組>"
```

或用 Obsidian CLI（若已啟用）：

```bash
obsidian base:query path=memory/erp/ERP_Vault filter='type == "open-question" AND status == "open" AND module contains "<模組>"' format=md
```

或 Grep 工具：

```
pattern: "status: open"
path: memory/erp/ERP_Vault/08-open-questions/
output_mode: files_with_matches
```

### 列出結果格式

```
<MODULE>-<NNN>：<任務名稱> (priority: high|medium|low, raised-at: YYYY-MM-DD)
```

---

## 模式 B：新增（強制去重流程）

**禁止跳過任何步驟。**

### Step B1：描述問題

確認以下要素（若 Miles 未完整提供，補充詢問）：

- 問題是什麼（不確定的設計事項）
- 涉及模組（quote-request / order-management / work-order / production-task / qc / shipping / consultation-request / after-sales-ticket / cross-module）
- 問題來源（討論連結、Notion 頁面、Slack 訊息）
- 預期解答時點（可選）

### Step B2：搜尋相似 OQ（去重）

1. **查詢該模組（同時包含 cross-module）的所有未解 OQ**：

   ```
   Grep
   pattern: "module:" 
   path: memory/erp/ERP_Vault/08-open-questions/
   output_mode: content
   ```

   或讀取 `08-open-questions/` 下所有 `<MODULE>-*.md` 檔案的標題。

2. **分析語意相似度**，依以下標準分類：

| 相似度 | 判斷標準 | 建議動作 |
|--------|---------|---------|
| 高（疑似重複）| 核心問題相同，只是描述角度不同 | 建議更新現有 OQ，不新增 |
| 中（部分重疊）| 同一主題但問題面向不同 | 列出現有 OQ，讓 Miles 決定合併或新增 |
| 低（無重疊）| 問題性質明顯不同 | 建議新增 |

3. **回報格式**：

```
[去重分析]
相似度：高 / 中 / 低
現有相關 OQ：
  - ORD-005：訂單審核權限是否分層（status: open）

建議：合併至現有 OQ / 新增 / 由你決定
原因：（一句話說明判斷依據）
```

4. **等待 Miles 確認後**才執行 Step B3（新增）或 Step C（更新現有 OQ）。

### Step B3：建立新 OQ 卡

確認新增後，執行：

**查詢現有最大序號**：

```bash
ls /Users/b-f-03-029/Sens/memory/erp/ERP_Vault/08-open-questions/ \
  | grep "^<MODULE>-" \
  | sort -t- -k2 -n -r \
  | head -1
```

解析最大序號 → +1 → 補齊三位數 → 取 `<MODULE>-<NNN>` 格式。

範例：`ls ... | grep "^ORD-"` 找到最大 `ORD-007` → 新增為 `ORD-008`。

**建立檔案**：

檔名格式：`<MODULE>-<NNN>-<簡述 slug>.md`，例：`ORD-008-訂單審核權限是否分層.md`

內容範本：

```markdown
---
type: open-question
module:
  - <模組>
oq-id: <MODULE>-<NNN>
status: open
priority: <high|medium|low>
audience: internal  # 預設，除非 Miles 明確改
raised-at: <今日日期>
raised-by: Miles
source-link: <來源連結>
related-vault:
  - <wiki link>
related-oq: []
expected-resolution-at: <可選>
---

# <MODULE>-<NNN>：<問題標題>

## 問題描述

<具體問題內容>

## 涉及範圍

- 模組：<模組>
- 相關卡：<wiki link 列表>
- 影響範圍：<可能影響的功能 / 流程>

## 討論記錄

<從 Miles 提供的 source-link 整理重點>

## 待解答

- [ ] <要解答的子問題 1>
- [ ] <要解答的子問題 2>

## 候選方案（若有）

### 方案 A：<簡述>
- 優點：
- 缺點：

### 方案 B：<簡述>
- 優點：
- 缺點：
```

**用 Write 工具寫入。**

---

## 模式 C：更新

### C1：OQ 已解答

讀檔 → 用 Edit 更新：

```yaml
---
status: answered
answered-at: <今日日期>
answered-by: <角色或姓名>
---
```

並在內文最後新增章節：

```markdown
## 決議與理由

**決議**：採用方案 X / 確認做法

**理由**：1-2 句說明判斷依據

**決策者**：Miles（YYYY-MM-DD）

**參考討論**：<連結>
```

> [!info] BRD 引用格式
> 在 BRD / spec 中以 wiki link 標注 OQ，例如「採系統自動執行審稿狀態轉換（詳見 [[ORD-008-訂單審核權限是否分層|ORD-008]]）」。
>
> 決策細節不重複寫入 BRD，以 OQ 卡為正本。

### C2：OQ 說明補充

讀檔 → 用 Edit 在「## 討論記錄」或「## 候選方案」段追加新內容。**保留原有內容**，不覆寫。

### C3：OQ 有依賴關係

Edit frontmatter `related-oq` 列表，加入所依賴的 OQ id。

範例：

```yaml
related-oq:
  - ORD-005
  - XM-003
```

---

## 模組前綴對照

| 模組 | 前綴 |
|------|------|
| 需求單 | QR |
| 訂單管理 | ORD |
| 工單管理 | WO |
| 印件 | PI |
| 生產任務 | PT |
| QC | QC |
| 出貨單 | SHP |
| 諮詢單 | CR |
| 售後服務 | AS |
| 跨模組 | XM |

---

## 推送 Notion 對外確認版

依 [[../../memory/erp/ERP_Vault/00-meta/sync-workflow|Sync Workflow]] § 流程 1：

- 本 skill **不主動推送 Notion**
- 由 Miles 觸發「Vault → Notion 彙整推送」時，OQ 與其他 Vault 內容一起被組合成 BRD 推送
- 推送後在 OQ 卡 frontmatter 補 `notion-published-at` 與 `notion-page-url`

---

## 既有 Notion OQ 漸進式遷移

依 [[../../memory/erp/ERP_Vault/08-open-questions/README]]：

- **不需大量遷移**（既有 Notion OQ 量大）
- 新 OQ 直接寫 Vault
- 既有 Notion OQ 在被引用 / 解答時，由 Claude 個別鏡像進 Vault（**過渡期手動**）

---

## 工具使用

| 操作 | 工具 |
|------|------|
| 查詢 | Grep / Glob / `obsidian search` / `obsidian base:query` |
| 新增 | Write |
| 更新 | Edit |
| 列出 OQ 清單 | Bash `ls` |
| 找最大序號 | Bash `ls + sort` |

**不再使用** `mcp__notion__notion-create-pages` / `notion-update-page` 寫入 Notion（除非 Miles 觸發推送流程）。
