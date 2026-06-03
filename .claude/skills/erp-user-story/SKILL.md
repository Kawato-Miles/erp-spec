---
name: erp-user-story
description: >
  ERP 商業 User Story 撰寫與管理 skill。
  正本：Vault `memory/Sens_wiki/wiki/erp/13-user-stories/`（2026-05-21 新增）。
  Notion User Story DB 降為對外發布版本（推送自 Vault，單向）。
  觸發時機：Miles 說「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」「推 user story 到 Notion」「同步 user story」，
  或撰寫 spec / 討論需求中識別到須具體化為業務故事時。
  此 skill 為單階段撰寫（純業務情境，UI 操作不在 user story；驗收責任下移 test case 層、UI 點擊層歸 Prototype e2e）+ Gherkin 驗收條件框架 + Anti-Model-Collapse provenance 規約。
  **強制規則（禁止以下 anti-pattern）**：
    1. 全卡禁含 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）；UI 操作層已自 user story 移除（下移 test case 業務級驗收 + Prototype e2e）
    2. 內容禁中英夾雜：英文欄位名 / 實體名一律用介面中文（payment → 付款紀錄、printItem → 印件、orderAdjustment → 訂單異動、quoteRequest → 需求單、workOrder → 工單、productionTask → 生產任務、reviewRound → 審稿輪次、paymentPlan → 付款計畫、afterSalesTicket → 售後服務單 等）
    3. 必填 `source` frontmatter ≥ 1 條（指向 raw / spec / 業務邏輯卡 / 訪談紀錄），禁指向其他 user-story 卡（LLM 自迭代風險）
    4. 成功條件採 Gherkin 框架（Scenario / Given / When / Then），守單一 When + 單一 Then 紀律（多個獨立 When → split story）；2-5 條（超過 5 建議 split）
    5. 識別到不確定項 MUST 觸發 [[oq-manage]] mode B 開獨立 OQ 卡，不可只 inline 標注
    6. 成功條件須業務 outcome 級可驗證，且涵蓋正向達成型與禁止/守衛型；UI 點擊細節不寫此處（歸 Prototype e2e）
    7. Mode B 推送 Notion 前 MUST 跑 lint（vault-audit 維度 13 自審）
    8. Notion 推送單元以 `us-id` 為唯一鍵；既有條目 update、不存在則 create，禁建重複條目
  不適用：requirement-level 工程驗收 Scenarios（屬 OpenSpec spec § Scenarios，含分支與系統行為，層級高於本 skill 的業務驗收意圖）、跨模組端到端情境（屬 Vault 07-scenarios）、test case 撰寫（屬 erp-test-case skill）。
---

# ERP User Story 管理

統一管理 ERP 商業 User Story。**操作正本在 Vault**，Notion User Story DB 為對外發布版本。

詳見 [[../../memory/Sens_wiki/wiki/erp/13-user-stories/README|13-user-stories/README]] 與 [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema#type=user-story|wiki-schema § type=user-story]]。

---

## 單階段定位（2026-06-01 自兩階段收斂）

User story 為**單階段純業務情境卡**：只寫「角色執行某條業務規則的步驟」與「業務 outcome 級的成功條件」。

- **UI 操作不寫進 user story**：原階段 2「UI 操作（易變層）」已移除。介面層級的驗收責任**下移到 test case 業務級驗收**（[[erp-test-case]]，Vault 索引卡 + Notion 正文），真正的 UI 點擊操作歸 **Prototype 端對端測試**（Playwright spec，由 `implemented-by` 指向）。
- **理由**：階段 2 與 test case／Prototype e2e 職責重疊且 86% 卡從未填寫（51 張 business-only 空佔位 vs 8 張曾填），維護一個重疊又多空著的層屬負債。收斂後 user story 回歸穩定的業務語言，UI 改版不再污染故事卡。

---

## 三種操作模式

| 模式 | 觸發時機 |
|------|---------|
| **A：新增 User Story** | Miles 說「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」/ Spec 撰寫識別到須具體化為業務故事 |
| **B：推送 Notion** | Miles 說「推 user story 到 Notion」「同步 user story」「推 [模組] user story」|

> 原「補 UI 操作層」模式已隨單階段化移除。

---

## Vault 位置與檔名規約

- **目錄**：`/Users/b-f-03-029/Sens/memory/Sens_wiki/wiki/erp/13-user-stories/<module>/`
- **檔名格式**：`US-<MODULE>-<NNN>-<簡述 slug>.md`
- **MODULE 前綴對照**：QR / ORD / CR / AS / WO / PT / AR / QC / SHP / MM / PM / BM / XM（詳見 [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema#User Story 卡]]）
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
business-domain:
  - <6 領域之一>                            # 必填，對齊 wiki-schema § 二B
role:
  - "[[<角色卡>]]"                          # 必填，wiki link 至 03-roles/（外部 B2C 會員可純文字）
priority: high | medium | low               # 必填
status: draft | active | deprecated         # 必填
created-at: YYYY-MM-DD                      # 必填
last-reviewed: YYYY-MM-DD                   # 必填
source:                                     # 必填 ≥ 1 條；往上指依據，禁指其他 user-story 卡、禁指 OpenSpec
  - "[[<raw / spec / 業務邏輯卡>]]"
implemented-by:                             # 往下指實作（OpenSpec Requirement 標題層 / Prototype e2e），可留空=待實作
  - "openspec/specs/<module>/spec.md#Requirement: <標題>"
  - "sens-erp-prototype/tests/e2e/<spec>.spec.ts"
related-spec: openspec/specs/<module>/spec.md
related-scenarios:                          # 可選
  - "[[07-scenarios/README#情境 X]]"
related-business-logic:                     # 可選
  - "[[<業務邏輯卡>]]"
related-entities:                           # 可選
  - "[[<實體卡>]]"
related-test-cases:                         # 往下的驗收：Vault test-case 卡 wiki link（2026-06-01 由 Notion URL 改）
  - "[[../../15-test-cases/<module>/TC-<MODULE>-<NNN>-<簡述>]]"
prerequisites:                              # 相依性（禁用串接故事代替）
  - "[[US-<MODULE>-<NNN>-<前置故事>]]"
source-gap: false                           # 補不出上層依據時設 true
notion-published-at: YYYY-MM-DD             # mode B 推送後填
notion-page-url: <URL>                      # mode B 推送後填
---
```

> 已移除 `stage` / `ui-binding` 兩欄（單階段化，2026-06-01）。

---

## 卡結構（單階段）

H2 §「業務情境」內含必填 H3：

- § 作為（wiki link 至角色卡，單一角色）
- § 我希望（一句話業務動作，介面中文，建議 ≤ 30 字）
- § 以便（業務價值，可量化更佳）
- § 成功條件（Gherkin 驗收框架，2-5 條，見下節）

可選 H3：§ 前置條件、§ 業務流程（業務動作步驟，非 UI 操作）。

**全卡禁 UI 措辭、禁中英夾雜**（不再有「業務情境段 vs UI 段」之分，整卡都是業務語言）。

---

## 成功條件：Gherkin 驗收框架（2026-06-01 採納）

每條成功條件（acceptance criteria）寫成一個 Gherkin 情境：

```
- 情境：<一行業務情境描述>
  Given <前置狀態或條件，可疊加多條 Given>
  When  <單一觸發動作>
  Then  <單一可觀測結果>
```

### 涵蓋兩類驗收

| 類型 | 結構 | 範例 |
|------|------|------|
| 正向達成 | Given 前置 → When 業務動作 → Then 可觀測結果達成 | Given 需求單狀態=報價已確認 / When 業務轉訂單 / Then 產生與需求單一致的訂單草稿 |
| 禁止/守衛 | Given 某狀態 → When 嘗試某動作 → Then 不允許/被擋下 | Given 訂單狀態=訂單完成 / When 業務嘗試建立訂單異動 / Then 系統不允許建立 |

### 紀律（lint 依此）

- **單一 When + 單一 Then**：一個情境只一個觸發、一個結果。需要多個獨立 When/Then → 拆成多條情境或 split story（呼應 INVEST 之 Small）。
- **Given 可疊加**：前置條件可多條（「Given 已登入」+「Given 訂單已完成」）。
- **業務 outcome 級、禁 UI**：Then 寫可觀測的業務結果（狀態名 / 金額 / 是否允許），不寫「看到 toast」「按鈕變灰」等 UI 表現（UI 屬 Prototype e2e）。
- **對齊**：When 對應「我希望」的動作；Then 對應「以便」的價值或守衛規則。
- **規則本體不重述**：守衛條件所依據的規則（如「訂單完成後鎖定」），以 wiki link 指 [[../../memory/Sens_wiki/wiki/erp/04-business-logic|business-logic]] 規則正本卡，本卡只寫「驗收得到什麼」。
- **數量 2-5 條**：超過 5 建議 split story；少於 2 過於模糊。

### 與 OpenSpec § Scenarios 的層級區隔

user story 的 Gherkin ＝**業務驗收意圖**（outcome 級、UI-free、給業務/PM 看，單一情境聚焦）。OpenSpec spec § Scenarios ＝ **requirement-level 工程驗收**（含分支、邊界、系統行為，給工程看）。前者是後者與 test case 的種子，兩者層級不同、不重複；不得把工程分支細節塞進 user story 成功條件。

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
- Vault 對應業務邏輯卡 `04-business-logic/<...>`（業務規則，守衛型成功條件的規則正本）
- Vault 對應角色卡 `03-roles/<角色>.md`（角色責任）
- Vault 對應實體卡 `05-entities/<實體>.md`（資料模型）
- 既有 user-story 卡（同模組）— **只看編碼用以決定 NNN**，**不引用其他 user-story 內容作為 source**

### Step A3：套模板撰寫業務情境

1. 複製 [[../../memory/Sens_wiki/wiki/erp/13-user-stories/_template|_template.md]] 內容
2. 填 frontmatter（必填項全填）
3. 寫 § 作為（wiki link 至 03-roles/，單一角色）
4. 寫 § 我希望（一句話，介面中文，禁英文欄位名）
5. 寫 § 以便（業務價值，量化更佳）
6. 寫 § 前置條件（如有）
7. 寫 § 業務流程（業務動作步驟，非 UI 操作）
8. 寫 § 成功條件（Gherkin 框架，2-5 條；涵蓋正向達成 + 禁止/守衛；守衛規則 wiki link 指 business-logic 正本）

### Step A4：INVEST 自審

| 字母 | 含義 | 自審問題 |
|------|------|---------|
| **I** | Independent | 此 story 可否獨立交付？依賴其他未完成 story？|
| **N** | Negotiable | 預留討論空間？是否過度規範實作（UI 細節）？|
| **V** | Valuable | 「以便」明示業務價值？利害關係人可理解？|
| **E** | Estimable | 可估規模？描述含糊？|
| **S** | Small | 一個 Sprint 可完成？成功條件 ≤ 5？單一 When/Then？|
| **T** | Testable | 每條 Gherkin 成功條件可觀測？Test Case 能否直接從 Given/When/Then 設計？|

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

對照 [[../../memory/Sens_wiki/wiki/erp/13-user-stories/_template#Lint 自檢（提交前）|_template § Lint 自檢]] 清單逐項檢查。

關鍵檢查（全卡，非僅特定段）：

```bash
# UI 措辭（全卡禁）
grep -E "按鈕|下拉|彈窗|點擊|分頁|Tab|Modal|選單|視窗|Side Panel|Toast|Banner|Dialog|篩選器|表格欄位" <檔案>

# 英文欄位名
grep -E "payment|printItem|orderAdjustment|quoteRequest|workOrder|productionTask|reviewRound|paymentPlan|afterSalesTicket" <檔案>
```

成功條件額外檢查：每條為 Gherkin（含 Given/When/Then）、單一 When + 單一 Then、2-5 條。任一命中 → 修正才能 commit。

### Step A8：commit

依 [[../../memory/Sens_wiki/wiki/erp/00-meta/vault-charter#五、Commit 規範|vault-charter § 五]]：

```
feat: 新增 [模組] User Story US-XX-NNN <標題>

- 業務情境：<簡述>
- 成功條件 N 條（Gherkin；含 M 條守衛型）
- source: <provenance 來源>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 模式 B：推送 Notion

### Step B1：列出待推送清單（change-driven delta + frontmatter 兩路取聯集）

掃 `13-user-stories/<module>/` 內 user-story 卡，列出：
- status=active
- **change-driven delta**：依 [[iteration-delta-publish]] 算出受 archived change 影響的卡（只反映 `openspec/changes/archive/`，active change 不納入）；對映後做覆蓋檢查（每個 change 至少對映一張卡，無對映者揭露為覆蓋缺口 → 補卡或記 OQ）
- **frontmatter 判定**：`notion-published-at` 為空 / 距今 > 60 天 / 自上次推送後 `last-reviewed` 有更新

待推送清單 = 上述兩路**取聯集**。並報告給 Miles 確認推送範圍。

### Step B2：跑 lint（推送前必跑）

對待推送清單每張卡跑 Step A7 的檢查。**任一張 lint 失敗 → 中止推送**，要求修正後重來。

### Step B2.5：senior-pm 評審（推送前品質閘門，結構性推送 MUST）

引用 [`references/notion-publish-rubric.md`](references/notion-publish-rubric.md)，調用 senior-pm 當評審（執行者 / 評審分離），逐維度給通過 / 部分 / 未通過 + evidence-anchored。**4 維度全「通過」才進 B3**；維度 4（真實性）一票否決。未通過 → 修正 → 重新評審（餵完整草稿、不暗示改動），硬上限 3 輪、卡住問 Miles。單張微調 MAY 由主 agent 自審；批次 / 結構性推送 SHALL 調用 senior-pm。

### Step B3：Property Mapping（Vault → Notion）

| Vault frontmatter / 段 | Notion property | 類型 | 備註 |
|------------------------|-----------------|------|------|
| `us-id` | 編碼 | text | 唯一鍵 |
| 標題 H1（去除 us-id 前綴）| 名稱 | title | |
| `role` | 作為 | relation | 對應業務角色 DB |
| § 我希望 內文 | 我希望 | text | |
| § 以便 內文 | 以便 | text | |
| § 前置條件 內文 | 前置條件 | text | |
| § 業務流程 內文 | 流程說明 | text | |
| § 成功條件（Gherkin 條列）| 成功條件 | text | 保留 Given/When/Then 結構 |
| `priority` | 優先度 | select | 高 / 中 / 低 |
| `module` | 涉及模組 | multi-select | |
| `related-spec` 對應 Feature | Feature | relation | 對應 Feature DB |

**不推送**：frontmatter `source` / `related-business-logic` / `related-entities` / `related-test-cases`（屬內部知識管理）

### Step B4：配對既有 Notion 條目

1. 用 Notion MCP `notion-query-database-view` 查 User Story DB 既有條目
2. 以 `us-id` 為唯一鍵配對：
   - 既有 → `notion-update-page`（update）
   - 不存在 → `notion-create-pages`（create）
3. **禁建重複條目**

### Step B5：回填 Vault frontmatter（MUST，不可略）

對每張推送成功的卡：

```yaml
notion-published-at: <當天>
notion-page-url: <Notion 頁面 URL>
```

**強制回填，禁略**：未回填會導致下次 Step B1 的 change-driven delta 與 frontmatter 判定雙雙失準。教訓：訂單模組曾整批推送 Notion 卻全未回填，35 張卡 `notion-published-at` 全空，delta 偵測只能靠查 Notion 缺項兜底（見 [[iteration-delta-publish]] § 四）。

### Step B6：報告與 commit

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
| 全卡含 UI 措辭 → 禁 commit | A |
| 內容含未轉中文的英文欄位名 → 禁 commit | A |
| `source` 為空或指向其他 user-story 卡 → 禁 commit | A |
| 成功條件非 Gherkin（缺 Given/When/Then）→ 禁 commit | A |
| 單一成功條件含多個獨立 When/Then → 警告 + 建議拆條或 split story | A |
| 成功條件 > 5 條未 split → 警告 + 建議 split | A |
| 成功條件 < 2 條 → 警告 + 建議補強 | A |
| 識別到不確定項只 inline 標注未開 OQ → 禁 commit，必觸發 [[oq-manage]] mode B | A |
| Mode B 推送前未跑 lint → 中止推送 | B |
| Mode B 建重複 Notion 條目 → 禁推送，必先配對 us-id | B |

---

## 整合說明

### 與 OpenSpec change 工作流

- OpenSpec change `## Why` / `## Background` 段：引用 Vault user story `[[13-user-stories/<module>/US-XX-NNN]]`
- OpenSpec spec § Scenarios 為 requirement-level 工程驗收（含分支與系統行為），層級高於 user story 的業務驗收意圖，不是 user story
- change archive 後識別到新業務故事 → 觸發 mode A 補入 Vault

### 與 erp-test-case skill

- user story 的每條 Gherkin 成功條件是 test case 的取材種子：正向達成型 → test case happy path；禁止/守衛型 → test case edge case。
- test case Vault 索引卡（[[erp-test-case]]，`15-test-cases/<module>/TC-XX-NNN`）以 frontmatter `source` 往上指本 user story；本 user story 以 `related-test-cases` wiki link 往下指 test case 卡（雙向可達，2026-06-01 由 Notion URL 改 Vault wiki link）。
- test case 正文（前置 / 步驟 / 預期）存 Notion，Vault 卡只承載索引；介面層級的 UI 點擊操作歸 Prototype e2e。

### 與 oq-manage skill

- 撰寫 user story 中發現不確定項 → 立即觸發 oq-manage mode B 開獨立 OQ 卡
- user story 以 wiki link 引用 OQ：「[[<OQ-id>]]」
- OQ 解答後回頭更新 user story（觸發 mode A 重審或 mode B 推 Notion）

### 與 vault-audit skill

- vault-audit 維度 13（User Story 撰寫紀律）由本 skill 觸發 lint 規則
- 提交前由本 skill 自我執行 Step A7 檢查

---

## 參考

- [[../../memory/Sens_wiki/wiki/erp/13-user-stories/README]] — 13-user-stories 入口
- [[../../memory/Sens_wiki/wiki/erp/13-user-stories/_template]] — 模板與 lint 自檢清單
- [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema#type=user-story]] — frontmatter 正式規格
- [[../../memory/Sens_wiki/wiki/erp/00-meta/wiki-schema#維度 13：User Story 撰寫紀律]] — lint 規則
- [[../../memory/Sens_wiki/wiki/erp/00-meta/sync-workflow#二之二、流程 1-B：Vault → Notion User Story DB（單向推送）]] — 同步流程
- [[oq-manage]] — 不確定項處理
- [[erp-test-case]] — Test Case 撰寫（驗收種子來自本 skill 的 Gherkin 成功條件）
- [[vault-audit]] — Vault 健康稽核
