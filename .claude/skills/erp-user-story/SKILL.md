---
name: erp-user-story
description: >
  ERP 商業 User Story 撰寫與管理 skill。
  正本：Vault `memory/erp/ERP_Vault/13-user-stories/`（2026-05-21 新增）。
  Notion User Story DB 降為對外發布版本（推送自 Vault，單向）。
  觸發時機：Miles 說「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」「推 user story 到 Notion」「同步 user story」，
  或撰寫 spec / 討論需求中識別到須具體化為業務故事時。
  此 skill 強制執行兩階段撰寫紀律（業務情境穩定層 / UI 操作易變層）+ Anti-Model-Collapse provenance 規約。
  **強制規則（禁止以下 anti-pattern）**：
    1. 業務情境段（H2「業務情境（穩定層）」）禁含 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）
    2. 內容禁中英夾雜：英文欄位名 / 實體名一律用介面中文（payment → 付款紀錄、printItem → 印件、orderAdjustment → 訂單異動、quoteRequest → 需求單、workOrder → 工單、productionTask → 生產任務、reviewRound → 審稿輪次、paymentPlan → 付款計畫、afterSalesTicket → 售後服務單 等）
    3. 必填 `source` frontmatter ≥ 1 條（指向 raw / spec / 業務邏輯卡 / 訪談紀錄），禁指向其他 user-story 卡（LLM 自迭代風險）
    4. acceptance criteria 2-5 條（超過 5 建議 split story）
    5. 識別到不確定項 MUST 觸發 [[oq-manage]] mode B 開獨立 OQ 卡，不可只 inline 標注
    6. stage=business-only 時 UI 操作段須保持空 / 待補；填了內容 MUST 將 stage 改為 ui-bound
    7. Mode C 推送 Notion 前 MUST 跑 lint（vault-audit 維度 13 自審）
    8. Notion 推送單元以 `us-id` 為唯一鍵；既有條目 update、不存在則 create，禁建重複條目
  不適用：requirement-level Given/When/Then 驗收（屬 OpenSpec spec § Scenarios）、跨模組端到端情境（屬 Vault 07-scenarios）、test case 撰寫（屬 erp-test-case skill）。
---

# ERP User Story 管理

統一管理 ERP 商業 User Story。**操作正本在 Vault**，Notion User Story DB 為對外發布版本。

詳見 [[../../memory/erp/ERP_Vault/13-user-stories/README|13-user-stories/README]] 與 [[../../memory/erp/ERP_Vault/00-meta/wiki-schema#type=user-story|wiki-schema § type=user-story]]。

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| **A：新增 User Story** | Miles 說「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」/ Spec 撰寫識別到須具體化為業務故事 |
| **B：補 UI 操作層** | Prototype 對應功能定案後 / Miles 說「補 [US-XX-NNN] 的 UI 操作」「user story X 的 Prototype 定案了」|
| **C：推送 Notion** | Miles 說「推 user story 到 Notion」「同步 user story」「推 [模組] user story」|

---

## Vault 位置與檔名規約

- **目錄**：`/Users/b-f-03-029/Sens/memory/erp/ERP_Vault/13-user-stories/<module>/`
- **檔名格式**：`US-<MODULE>-<NNN>-<簡述 slug>.md`
- **MODULE 前綴對照**：QR / ORD / CR / AS / WO / PT / AR / QC / SHP / MM / PM / BM / XM（詳見 [[../../memory/erp/ERP_Vault/00-meta/wiki-schema#User Story 卡]]）
- **範例**：
  - `13-user-stories/prepress-review/US-AR-001-審核稿件.md`
  - `13-user-stories/order-management/US-ORD-001-建立訂單草稿.md`
  - `13-user-stories/_shared/US-XM-001-訂單跨帳務公司付款.md`

---

## Frontmatter Schema

```yaml
---
type: user-story
us-id: US-<MODULE>-<NNN>                    # 必填，唯一鍵
module:
  - <module>                                # 必填，對齊 wiki-schema § 二 module enum
role:
  - "[[<角色卡>]]"                          # 必填，wiki link 至 03-roles/
priority: high | medium | low               # 必填
stage: business-only | ui-bound             # 必填，兩階段標記
ui-binding: draft | prototype-v1 | locked   # stage=ui-bound 時必填
status: draft | active | deprecated         # 必填
created-at: YYYY-MM-DD                      # 必填
last-reviewed: YYYY-MM-DD                   # 必填
source:                                     # 必填 ≥ 1 條
  - "[[<raw / spec / 業務邏輯卡>]]"
related-spec: openspec/specs/<module>/spec.md
related-scenarios:                          # 可選
  - "[[07-scenarios/README#情境 X]]"
related-business-logic:                     # 可選
  - "[[<業務邏輯卡>]]"
related-entities:                           # 可選
  - "[[<實體卡>]]"
related-test-cases:                         # 可選
  - <Notion Test Case URL>
notion-published-at: YYYY-MM-DD             # mode C 推送後填
notion-page-url: <URL>                      # mode C 推送後填
---
```

---

## 兩階段紀律

### 階段 1：業務情境（穩定層）

- frontmatter `stage: business-only`
- H2 §「業務情境（穩定層）」內含 4 個必填 H3：
  - § 作為（wiki link 至角色卡）
  - § 我希望（一句話業務動作）
  - § 以便（業務價值，可量化更佳）
  - § 成功條件（acceptance criteria 2-5 條，可驗證）
- 可選 H3：§ 前置條件、§ 業務流程
- **禁含 UI 措辭**：按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器
- **禁中英夾雜**：英文欄位名 / 實體名一律用介面中文

### 階段 2：UI 操作（易變層）

- 觸發：對應 Prototype 功能定案
- frontmatter `stage: ui-bound` + `ui-binding: prototype-v1` 等版本標記
- H2 §「UI 操作（易變層）」內含 3 個 H3：
  - § 介面入口
  - § 操作步驟
  - § 介面元素
- 上方加 HTML 註解標明：`<!-- ui-binding: ... -->` + `<!-- 對應 Prototype 路徑：... -->`

---

## 模式 A：新增 User Story

### Step A1：確認模組與角色

Claude 問 Miles：
- 此 user story 屬哪個模組？（quote-request / order-management / consultation-request / after-sales-ticket / work-order / production-task / prepress-review / qc / material-master / process-master / binding-master / cross-module）
- 主要角色是哪位？（業務 / 諮詢 / 印務 / 印務主管 / 審稿 / 審稿主管 / 生管 / 師傅 / QC / 出貨 / 會計 / 訂單管理人 / Supervisor / EC 商品管理 / 中國廠商 / 外包廠商）
- 大致業務動作與價值？

### Step A2：載入背景知識

Claude 讀取：
- 對應 spec `openspec/specs/<module>/spec.md` § Requirements（功能規格）
- Vault 對應業務邏輯卡 `04-business-logic/<...>`（業務規則）
- Vault 對應角色卡 `03-roles/<角色>.md`（角色責任）
- Vault 對應實體卡 `05-entities/<實體>.md`（資料模型）
- 既有 user-story 卡（同模組）— **只看編碼用以決定 NNN**，**不引用其他 user-story 內容作為 source**

### Step A3：套模板撰寫業務情境

1. 複製 [[../../memory/erp/ERP_Vault/13-user-stories/_template|_template.md]] 內容
2. 填 frontmatter（必填項全填，stage 預設 business-only）
3. 寫 § 作為（wiki link 至 03-roles/）
4. 寫 § 我希望（一句話，介面中文，禁英文欄位名）
5. 寫 § 以便（業務價值，量化更佳）
6. 寫 § 前置條件（如有）
7. 寫 § 業務流程（業務動作步驟，非 UI 操作）
8. 寫 § 成功條件（acceptance criteria 2-5 條，每條可驗證）

### Step A4：INVEST 自審

對照以下 6 點：

| 字母 | 含義 | 自審問題 |
|------|------|---------|
| **I** | Independent | 此 story 可否獨立交付？依賴其他未完成 story？|
| **N** | Negotiable | 預留討論空間？是否過度規範實作？|
| **V** | Valuable | 「以便」明示業務價值？利害關係人可理解？|
| **E** | Estimable | 可估規模？描述含糊？|
| **S** | Small | 一個 Sprint 可完成？acceptance criteria ≤ 5？|
| **T** | Testable | 成功條件可驗證？Test Case 能否從 criteria 設計？|

任一項不滿足 → 修正或 split story。

### Step A5：識別不確定項（觸發 oq-manage）

若撰寫過程中發現任何不確定（業務規則待確認 / 角色權責待釐清 / 跨模組互動待釐清）：
- **MUST 觸發 [[oq-manage]] mode B 開獨立 OQ 卡**（含去重流程）
- user story 內以 wiki link 引用 OQ：「待 [[OQ-XX-NNN]] 解答後補完」
- **禁止 inline 標注**「待確認」「待釐清」等措辭

### Step A6：補 provenance

frontmatter `source` 必填 ≥ 1 條，指向：
- raw 卡（`raw/<...>`）
- spec 路徑與段（`openspec/specs/<module>/spec.md#<Requirement>`）
- 業務邏輯卡（`04-business-logic/<...>`）
- 訪談紀錄（`raw/_attachments/<...>`）

**禁止指向其他 user-story 卡**（LLM 自迭代風險）。

### Step A7：跑 lint（人工檢查或 vault-audit 維度 13）

對照 [[../../memory/erp/ERP_Vault/13-user-stories/_template#Lint 自檢（提交前）|_template § Lint 自檢]] 清單逐項檢查。

關鍵 grep（業務情境段）：

```bash
# UI 措辭
grep -E "按鈕|下拉|彈窗|點擊|分頁|Tab|Modal|選單|視窗|Side Panel|Toast|Banner|Dialog|篩選器|表格欄位" <檔案>

# 英文欄位名
grep -E "payment|printItem|orderAdjustment|quoteRequest|workOrder|productionTask|reviewRound|paymentPlan|afterSalesTicket" <檔案>
```

任一 grep 命中 → 必須修正才能 commit。

### Step A8：commit

依 [[../../memory/erp/ERP_Vault/00-meta/vault-charter#五、Commit 規範|vault-charter § 五]]：

```
feat: 新增 [模組] User Story US-XX-NNN <標題>

- 業務情境段：<簡述>
- acceptance criteria N 條
- source: <provenance 來源>
- stage: business-only（UI 操作層待 Prototype 定案後補）

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 模式 B：補 UI 操作層

### Step B1：確認 Prototype 對應路徑

Claude 問 Miles：
- 此 user story 對應 Prototype 的哪個檔案 / 元件？
- 該功能是否已定案（locked）？或還在 prototype-v1 階段？

### Step B2：讀 Prototype 實作

讀 `sens-erp-prototype/src/<...>` 對應檔案，理解：
- 介面入口（從哪個頁面 / 入口進入）
- 操作步驟（使用者實際的 UI 互動順序）
- 介面元素（涉及的元件、欄位、狀態）

### Step B3：補 UI 操作層內容

1. H2 §「UI 操作（易變層）」上方加 HTML 註解：
   ```html
   <!-- ui-binding: prototype-v1 -->
   <!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/<...> -->
   ```
2. 填 § 介面入口（從哪進入）
3. 填 § 操作步驟（UI 互動順序）
4. 填 § 介面元素（涉及元件、欄位、狀態）

### Step B4：更新 frontmatter

```yaml
stage: ui-bound           # 從 business-only 改為 ui-bound
ui-binding: prototype-v1  # 或 locked-v1.0（依 Prototype 狀態）
last-reviewed: <當天>
```

### Step B5：跑 lint

對照 [[../../memory/erp/ERP_Vault/13-user-stories/_template#Lint 自檢（提交前）|_template § Lint 自檢]] 確認：
- stage=ui-bound 但 UI 操作段不為空（一致性）
- ui-binding 有填
- 業務情境段保持不動（穩定性）

### Step B6：commit

```
docs: 補 US-XX-NNN <標題> UI 操作層

- ui-binding: prototype-v1
- 對應 Prototype: sens-erp-prototype/src/<...>
- stage: business-only → ui-bound

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 模式 C：推送 Notion

### Step C1：列出待推送清單

掃 `13-user-stories/<module>/` 內 user-story 卡，列出：
- status=active
- `notion-published-at` 為空 / 距今 > 60 天 / 自上次推送後 `last-reviewed` 有更新

並報告給 Miles 確認推送範圍。

### Step C2：跑 lint（推送前必跑）

對待推送清單每張卡跑 Step A7 的 grep 檢查。**任一張 lint 失敗 → 中止推送**，要求修正後重來。

### Step C3：Property Mapping（Vault → Notion）

| Vault frontmatter / 段 | Notion property | 類型 | 備註 |
|------------------------|-----------------|------|------|
| `us-id` | 編碼 | text | 唯一鍵 |
| 標題 H1（去除 us-id 前綴）| 名稱 | title | |
| `role` | 作為 | relation | 對應業務角色 DB |
| § 我希望 內文 | 我希望 | text | |
| § 以便 內文 | 以便 | text | |
| § 前置條件 內文 | 前置條件 | text | |
| § 業務流程 內文 | 流程說明 | text | |
| § 成功條件 內文（編號條列）| 成功條件 | text | |
| `priority` | 優先度 | select | 高 / 中 / 低 |
| `module` | 涉及模組 | multi-select | |
| `related-spec` 對應 Feature | Feature | relation | 對應 Feature DB |

**不推送**：H2 §「UI 操作（易變層）」內容、frontmatter `source` / `related-business-logic` / `related-entities` / `related-test-cases`（這些屬內部知識管理）

### Step C4：配對既有 Notion 條目

1. 用 Notion MCP `notion-query-database-view` 查 User Story DB 既有條目
2. 以 `us-id` 為唯一鍵配對：
   - 既有 → `notion-update-page`（update）
   - 不存在 → `notion-create-pages`（create）
3. **禁建重複條目**

### Step C5：回填 Vault frontmatter

對每張推送成功的卡：

```yaml
notion-published-at: <當天>
notion-page-url: <Notion 頁面 URL>
```

### Step C6：報告與 commit

向 Miles 報告：
- 推送清單（新增 N 條、更新 M 條）
- Notion 頁面 URL 連結
- 任何 lint 失敗 / 推送失敗的卡

commit：

```
docs: 推送 N 條 user story 至 Notion 發布版本

- 新增：US-XX-NNN, US-XX-NNN+1 ...
- 更新：US-XX-NNN-x, ...
- 已回填 notion-published-at + notion-page-url

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Anti-Pattern 強制規則

| 規則 | 適用 mode |
|------|----------|
| 業務情境段含 UI 措辭 → 禁 commit | A / B |
| 內容含未轉中文的英文欄位名 → 禁 commit | A / B |
| `source` 為空或指向其他 user-story 卡 → 禁 commit | A |
| acceptance criteria > 5 條未 split → 警告 + 建議 split | A |
| acceptance criteria < 2 條 → 警告 + 建議補強 | A |
| 識別到不確定項只 inline 標注未開 OQ → 禁 commit，必觸發 [[oq-manage]] mode B | A / B |
| stage=business-only 但 UI 操作段有內容 → 禁 commit | A / B |
| stage=ui-bound 但 UI 操作段空 / 缺 ui-binding → 警告 | B |
| Mode C 推送前未跑 lint → 中止推送 | C |
| Mode C 建重複 Notion 條目 → 禁推送，必先配對 us-id | C |

---

## 整合說明

### 與 OpenSpec change 工作流

- OpenSpec change `## Why` / `## Background` 段：引用 Vault user story `[[13-user-stories/<module>/US-XX-NNN]]`
- OpenSpec spec § Scenarios 保留 Given/When/Then 格式（acceptance scenarios，工程驗收），不是 user story
- change archive 後識別到新業務故事 → 觸發 mode A 補入 Vault

### 與 erp-test-case skill

- Test Case 撰寫時引用 user story `[[13-user-stories/<module>/US-XX-NNN#成功條件]]` 的 acceptance criteria
- 每條 acceptance criteria 對應 ≥ 1 個 Test Case
- Test Case ID 反向連結至 user story frontmatter `related-test-cases`

### 與 oq-manage skill

- 撰寫 user story 中發現不確定項 → 立即觸發 oq-manage mode B 開獨立 OQ 卡
- user story 以 wiki link 引用 OQ：「[[<OQ-id>]]」
- OQ 解答後回頭更新 user story（觸發 mode A 重審或 mode C 推 Notion）

### 與 vault-audit skill

- vault-audit 維度 13（User Story 撰寫紀律）由本 skill 觸發 lint 規則
- 第三階段實作前，由本 skill 自我執行 Step A7 grep 檢查

---

## 參考

- [[../../memory/erp/ERP_Vault/13-user-stories/README]] — 13-user-stories 入口
- [[../../memory/erp/ERP_Vault/13-user-stories/_template]] — 模板與 lint 自檢清單
- [[../../memory/erp/ERP_Vault/00-meta/wiki-schema#type=user-story]] — frontmatter 正式規格
- [[../../memory/erp/ERP_Vault/00-meta/wiki-schema#維度 13：User Story 撰寫紀律]] — lint 規則
- [[../../memory/erp/ERP_Vault/00-meta/sync-workflow#二之二、流程 1-B：Vault → Notion User Story DB（單向推送）]] — 同步流程
- [[oq-manage]] — 不確定項處理
- [[erp-test-case]] — Test Case 撰寫
- [[vault-audit]] — Vault 健康稽核
