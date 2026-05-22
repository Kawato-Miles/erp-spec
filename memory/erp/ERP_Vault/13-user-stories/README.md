---
type: meta
status: active
last-reviewed: 2026-05-21
---

# 13-user-stories — User Story 中樞

> ERP 商業 User Story 的**內部正本**。Notion User Story DB（[發布版本](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d)）由本目錄推送，禁反向覆寫。
> 由 [[erp-user-story]] skill 自動化新增 / 補 UI / 推送，由 [[wiki-schema#維度 13：User Story 撰寫紀律|vault-audit 維度 13]] 做 lint。

## 一、定位

| 層 | 角色 | 路徑 |
|---|------|------|
| **Vault `13-user-stories/`** | 內部正本（business-level User Story）| 本目錄 |
| **OpenSpec spec § Scenarios** | requirement-level Acceptance Scenarios（Given/When/Then，工程驗收用）| `openspec/specs/<module>/spec.md` |
| **Notion User Story DB** | 對外發布版本（推送自 Vault）| https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d |

**重要區別**：

- User Story（本目錄）：**業務視角**，「作為 [角色]，我希望 [動作]，以便 [價值]」單一故事；PM / 利害關係人 / Test Case 設計用
- Acceptance Scenarios（OpenSpec spec § Scenarios）：**工程驗收視角**，Given/When/Then 行為描述；LLM / 工程驗收用
- Cross-module Scenarios（[[07-scenarios/README|07-scenarios/]]）：**端到端流程視角**，跨多模組多實體狀態流轉
- 三者**互補不衝突**，透過 frontmatter `related-spec` / `related-scenarios` 雙向連結

## 二、兩階段撰寫紀律

每張 user-story 卡採「同檔分兩段」結構：

### 階段 1：業務情境（穩定層）

- frontmatter `stage: business-only`
- 內容含 H3：作為 / 我希望 / 以便 / 前置條件 / 業務流程 / 成功條件（acceptance criteria）
- **禁含 UI 措辭**（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）
- **禁含未轉中文的英文欄位名**（payment → 付款紀錄 / printItem → 印件 / orderAdjustment → 訂單異動 / quoteRequest → 需求單 等）
- acceptance criteria 數量 2-5 條（業界共識，超過 5 建議 split story）
- 引自 [Atlassian](https://www.atlassian.com/agile/project-management/user-stories)：「This statement should be implementation free — if you're describing any part of the UI you're missing the point」

### 階段 2：UI 操作（易變層）

- 觸發：對應 Prototype 功能定案後
- frontmatter `stage: ui-bound` + `ui-binding: prototype-v1` 等版本標記
- 內容含 H3：介面入口 / 操作步驟 / 介面元素
- 對應 Prototype 路徑（如 `sens-erp-prototype/src/components/prepress/...`）
- Prototype 改版時只動 UI 操作段；業務情境段保持不動（穩定性保險）

## 二之二、獨立性紀律（禁 anchor 故事）

每張 user-story 卡 **MUST** 描述單一角色的單一情境，對應實務物理世界的一個動作或決策。完整工作流程由多張獨立 user story **組合**而成，**MUST NOT 建立統合多角色 / 多動作的 anchor 故事**。

### 禁 anchor 紀律（2026-05-22 新增）

- **MUST NOT** 寫「統合 N 張子故事」的 user story
- 違反 INVEST Independent（每張 user story 須獨立可交付 / 可驗收）
- 統合卡造成：(a) 改一個子情境須回溯統合卡同步、(b) 跨多角色職責邊界模糊、(c) 隱藏相依性使 PM 難以辨識「A 完成才能 B」順序

### 跨多角色 / 多動作流程的處理

跨多角色或多動作的端到端流程 **MUST** 由 [[07-scenarios/README|07-scenarios]] 處理（2026-05-22 擴展涵蓋「跨模組或跨角色的端到端流程」，不再限於跨模組）。

例：審稿流程端到端（業務填難易度 → 系統分派 → 審稿員審稿 → 補件迴圈 → 合格終態）涉及業務 / 系統 / 審稿員 / 補件方 4 角色多動作，**MUST** 放 07-scenarios 不放 user story。

### 相依性以 prerequisites 欄位記錄

user story 間「A 完成才能 B」的相依性以 frontmatter `prerequisites` 欄位記錄（詳見 [[wiki-schema#type=user-story]]）：

```yaml
prerequisites:
  - "[[US-AR-002-設定印件難易度與免審稿]]"   # 其他 user story
  - "系統自動分派完成"                       # 系統行為描述
  - "審稿主管已維護能力等級"                 # 角色準備動作
```

PM 從 prerequisites 鏈可看出動作順序與相依關係，不需依賴 anchor 故事的「業務流程段」串接。

## 三、命名規約

- 格式：`US-<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴對照（詳見 [[wiki-schema#User Story 卡]]）：

| 前綴 | 模組 |
|------|------|
| QR | 需求單（quote-request）|
| ORD | 訂單管理（order-management）|
| CR | 諮詢單（consultation-request）|
| AS | 售後服務（after-sales-ticket）|
| WO | 工單管理（work-order）|
| PT | 生產任務（production-task）|
| AR | 稿件審查（prepress-review，沿用 Notion 既有 US-AR-NNN）|
| QC | 品檢（qc）|
| SHP | 出貨 |
| MM | 材料主檔（material-master）|
| PM | 工序主檔（process-master）|
| BM | 裝訂主檔（binding-master）|
| XM | 跨模組（放 `_shared/`）|

- NNN 三位數字補零
- 簡述：繁體中文、名詞或動詞 + 名詞片語

## 四、目錄結構

```
13-user-stories/
├── README.md                          # 本卡（入口）
├── _template.md                       # 標準模板（給 erp-user-story skill 與 Miles 用）
├── _shared/                           # 跨模組 user story（module=cross-module）
├── quote-request/
├── order-management/
├── consultation-request/
├── after-sales-ticket/
├── work-order/
├── production-task/
├── prepress-review/                   # pilot 模組
├── qc/
├── material-master/
├── process-master/
└── binding-master/
```

子目錄建立原則：實際有第一張 user-story 卡時才建（避免空目錄佔位）。

## 五、Provenance 規約（Anti-Model-Collapse）

每張 user-story 卡 frontmatter `source` 必填 ≥ 1 條，指向：

- raw 卡（`raw/<...>`）
- OpenSpec spec（`openspec/specs/<module>/spec.md#<requirement>`）
- 業務邏輯卡（`04-business-logic/<...>`）
- 訪談紀錄 / Prototype 試用回饋（raw/_attachments/<...>）

**禁止 `source` 指向其他 user-story 卡** — 此為 LLM 自迭代風險，違反 [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) 防 model collapse 原則。

## 六、工作流

### 新增 User Story（Mode A）

觸發詞「寫 user story」「新增故事」「補 user story」「寫 [模組] 故事」→ [[erp-user-story]] skill mode A

1. 確認模組 / 角色
2. 讀對應 spec § Requirements + Vault 對應業務邏輯卡 / 實體卡
3. 套 [[_template]]
4. 寫業務情境（INVEST 自審：Independent / Negotiable / Valuable / Estimable / Small / Testable）
5. 識別不確定項 → 觸發 [[oq-manage]] mode B 開 OQ 卡（不可 inline 標注）
6. 補 provenance（`source` frontmatter）
7. 跑 lint（vault-audit 維度 13 — 第三階段實作前先人工檢查）
8. commit

### 補 UI 操作層（Mode B）

觸發：對應 Prototype 功能定案

1. 讀對應 Prototype 路徑
2. 填 ui-binding 標記
3. 填介面入口 / 操作步驟 / 介面元素
4. frontmatter `stage` 改為 `ui-bound`
5. 跑 lint
6. commit

### 推送 Notion（Mode C）

觸發詞「推 user story 到 Notion」「同步 user story」→ [[erp-user-story]] skill mode C

1. 列出 status=active + notion-published-at 為空 / 過舊的卡
2. 批次推送（property mapping 詳見 skill）
3. 回填 `notion-page-url` + `notion-published-at`

## 七、與其他 Vault 卡的關係

- [[07-scenarios/README]]：跨模組端到端情境（業務流程串接層，與單一 user story 互補）
- [[03-roles/_alignment-report|03-roles/]]：角色卡（user-story `role` frontmatter wiki link 至此）
- [[04-business-logic|04-business-logic/]]：業務邏輯卡（user-story `related-business-logic` wiki link 至此）
- [[05-entities|05-entities/]]：實體卡（user-story `related-entities` wiki link 至此）
- `raw/`：原始素材（user-story `source` 可指向 raw 卡）

## 八、相關 skill / agent

- [[erp-user-story]] — 新增 / 補 UI / 推送 Notion 主 skill
- [[oq-manage]] — 識別到不確定項時觸發
- [[vault-audit]] — 維度 13 lint（第三階段實作）
- [[erp-test-case]] — Test Case 撰寫時引用本目錄 user story 的 acceptance criteria

## 九、與 OpenSpec change 工作流的整合

OpenSpec change 撰寫時：

- `## Why` / `## Background` 段：引用 Vault 對應 user story `[[13-user-stories/<module>/US-XX-NNN]]`
- `## Spec Delta` 內 § Scenarios：保留 Given/When/Then 格式（acceptance scenarios），不是 user story
- change archive 後：若有新增 user story，由 erp-user-story mode A 補入 Vault

## 十、來源

- 業界共識：[Atlassian User Stories](https://www.atlassian.com/agile/project-management/user-stories) / [Mountain Goat Software](https://www.mountaingoatsoftware.com/agile/user-stories) / [Cucumber Better Gherkin](https://cucumber.io/docs/bdd/better-gherkin/)
- INVEST：[Agile Alliance Glossary](https://agilealliance.org/glossary/invest/) + [Revisiting INVEST 20+ Years Later](https://mdalmijn.com/p/revisiting-invest-20-years-later)
- Anti-Model-Collapse：[Karpathy LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
