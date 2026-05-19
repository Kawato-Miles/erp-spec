---
name: oq-manage
description: >
  OQ（Open Question）管理 skill。
  正本：Vault `memory/erp/ERP_Vault/08-open-questions/`（Vault Charter v2026-05-19 變更）。
  觸發時機：發現設計不確定項、Miles 說「新增 OQ」「這個要記下來」「有個問題要確認」，
  或任何 Spec / 規劃 / 討論中需要新增、查詢、更新 OQ 時（不限於 Spec 撰寫情境）。
  此 skill 強制執行去重邏輯：新增前先搜尋相似 OQ，由 Claude 分析並建議，由 Miles 決定。
  **強制規則（禁止以下 anti-pattern）**：
    1. 禁止在 Vault 卡內使用 `> [!question]` callout 標注 OQ
    2. 禁止以「待確認」「待釐清」「需確認」「尚未確認」「待補」「待釐清事項」等措辭 inline 標注卻不開檔
    3. 禁止只在當前回應中口頭說「列為 OQ」「我會記下來」卻不觸發本 skill
    4. 任何撰寫 Vault 卡 / Spec / 對話過程中識別到不確定項 MUST 立即觸發 mode B 開獨立檔（含去重流程），原處改 wiki link 引用
    5. 既有 inline OQ pattern 出現時，MUST 觸發 mode D（遷出）改為獨立檔
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

## 四種操作模式

| 模式 | 觸發時機 |
|------|---------|
| A：查詢 | 討論開始前 / 確認特定模組的未解 OQ |
| B：新增（含去重）| 識別到不確定項 / Miles 說「新增 OQ」|
| C：更新 | OQ 已解答 / 說明需補充 |
| D：遷出（inline OQ → 獨立檔）| Miles 說「遷出 [檔案 / 目錄] 的 OQ」/ 主動收尾掃描發現 inline pattern |

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

## 模式 D：遷出（inline OQ → 獨立檔）

**用途**：把 Vault 卡內既有的 inline OQ pattern（`> [!question]` callout / `## Open Questions` section / 內文「待確認」標注）轉成獨立的 OQ 卡，原處改為 wiki link。

**觸發時機**：
- Miles 說「遷出 [檔案 / 目錄] 的 OQ」「把這個 OQ 拉出來」「OQ 太多 inline，整理一下」
- 主動收尾掃描發現 inline pattern（CLAUDE.md § 主動收尾原則要求）
- `/opsx:archive` 前掃描 design.md 未解 OQ

### Step D1：掃描識別

```bash
# 在目標檔 / 目錄 grep inline OQ pattern
grep -rn "\[!question\]\|^## Open Questions\|^### Open Questions" <目標路徑>
```

也檢查內文是否有：
- 「待確認」「待釐清」「需確認」「尚未確認」「待補」「待釐清事項」加問題敘述
- 表格欄位含 OQ 編號（如「OQ XM-003」）但無對應獨立檔

### Step D2：對每筆命中提取問題核心

對每筆命中：

1. **讀上下文**（前後 5-10 行）萃取問題核心
2. **識別 metadata**：
   - 模組（依檔案位置或內容推斷）
   - 優先順序（依問題影響範圍，預設 medium）
   - source-link（目前所在卡的相對路徑 + 行號）

### Step D3：對每筆執行 mode B 開檔

依 [[#模式 B：新增（強制去重流程）]] 完整流程：

- Step B2 去重檢查（避免與其他 inline 重複）
- Step B3 建檔（檔名 `<MODULE>-<NNN>-<簡述>.md`）

**關鍵**：mode D 不跳過去重邏輯——多個檔案的 inline OQ 可能講同一件事，要合併為 1 個 OQ 卡。

### Step D4：修原處為 wiki link

對每筆 inline OQ，**用 Edit 把原處 callout / 表格列**替換為 wiki link 引用：

```markdown
# 反例（替換前）
## 五、難易度分數的業務含義（待補）

> [!question] OQ
> Notion / Spec 中目前未明確定義「1-10 分各代表什麼產品類型」...
```

```markdown
# 正例（替換後）
## 五、難易度分數的業務含義

詳見 [[PI-001-難易度分數業務含義]]。
```

若原章節只剩「待補」框架沒實際內容，**整段刪除**僅保留 wiki link：

```markdown
詳見 [[PI-001-難易度分數業務含義]]（OQ）。
```

### Step D5：回報

```
[Mode D 遷出完成]
掃描範圍：<檔案 / 目錄>
找到 inline OQ：X 筆
去重後建檔：Y 個獨立 OQ 卡
原處替換為 wiki link：Z 處
OQ 清單：
  - <MODULE>-<NNN>-<簡述>（原 inline 位置：file:line）
  - ...
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

## OpenSpec change 內 OQ 處理

依 `openspec/config.yaml` rules § archive：

| 階段 | 處理 |
|------|------|
| change 探索期 | design.md / proposal.md 可使用 `## Open Questions` section（change-local OQ） |
| change 內 OQ 解答 | design.md 內 OQ 末加「決議與理由」標注，不強制遷 Vault（屬 change-local 範疇）|
| **`/opsx:archive` 前** | **MUST 掃描 design.md / proposal.md / specs/ 內未解 `## Open Questions`** |
| archive 前未解 OQ 處理 | 觸發 mode B 為每筆未解 OQ 建 Vault OQ 卡 → design.md 原處改為「→ 對應 Vault OQ：[[<MODULE>-<NNN>-<簡述>]]」雙向引用 |
| 已解 OQ | design.md 保留「決議與理由」即可，不必遷 Vault（除非該結論需於跨 change 引用）|

**範例**：

archive 前 design.md 含：

```markdown
## Open Questions

- **OQ-3：審稿合格後印件狀態是否需 buffer 時間才允許工單建立？**
  - 還在內部討論
```

archive 流程：
1. 觸發 mode B 建 Vault OQ 卡 `PI-XXX-審稿合格後工單建立 buffer.md`
2. Edit design.md 把該條改為：

```markdown
## Open Questions

- **OQ-3：審稿合格後印件狀態是否需 buffer 時間才允許工單建立？**
  - → 對應 Vault OQ：[[PI-XXX-審稿合格後工單建立 buffer]]
```

3. archive 完成

---

## Anti-Pattern 範例

### 反例 1：Vault 卡內用 callout

```markdown
## 五、難易度分數的業務含義（待補）

> [!question] OQ
> Notion / Spec 中目前未明確定義「1-10 分各代表什麼產品類型」...
```

**錯在哪**：用 `> [!question]` callout 把 OQ 嵌入 entity / business-logic 卡，違反 hard rule 第 1 條。

**正例**：

```markdown
## 五、難易度分數的業務含義

詳見 [[PI-001-難易度分數業務含義]]。
```

並在 `08-open-questions/PI-001-難易度分數業務含義.md` 建獨立卡。

---

### 反例 2：表格列出「OQ-XXX」但無對應檔

```markdown
| 角色 | 主要影響 | OQ |
|------|---------|------|
| 出貨 | shipping | OQ SHP-005（分批出貨觸發節點）|
```

**錯在哪**：只有 OQ 編號文字，沒實際檔案，讀者無從追溯。

**正例**：

```markdown
| 角色 | 主要影響 | OQ |
|------|---------|------|
| 出貨 | shipping | [[SHP-005-分批出貨觸發節點]] |
```

---

### 反例 3：對話中口頭說「列為 OQ」

```
Claude: 「這個分批出貨觸發節點還沒確認，我列為 OQ。」
```

**錯在哪**：沒實際觸發本 skill mode B 建檔，下次討論時失憶。

**正例**：

```
Claude: 「這個分批出貨觸發節點還沒確認，我用 oq-manage mode B 建檔。」
[實際觸發 mode B → 完成去重 → 建檔 → 回報 OQ ID]
```

---

### 反例 4：「待補」「待釐清」inline 措辭

```markdown
## 三、難易度分數的業務含義（**待補**）

目前由業務「經驗判斷」，無共識量表。
```

**錯在哪**：用「待補」標記但沒建 OQ 卡，與 callout 同性質違規。

**正例**：

```markdown
## 三、難易度分數的業務含義

詳見 [[PI-001-難易度分數業務含義]]。
```

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
