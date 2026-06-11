---
type: meta
status: deprecated
last-reviewed: 2026-05-21
---

# 13-user-stories — User Story 中樞

> **已廢止（2026-06-11）**：user-story 單元併入業務情境（[[_template-business-scenario]]）。本 README 的命名規約與推送流程隨之失效；Notion 對接由下游另行規劃。既有卡遷移期間保留原處。

> ERP 商業 User Story 的**內部正本**。Notion User Story DB（[發布版本](https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d)）由本目錄推送，禁反向覆寫。
> 由 [[erp-user-story]] skill 自動化新增 / 推送，由 [[wiki-schema#維度 13：User Story 撰寫紀律|vault-audit 維度 13]] 做 lint。

## 一、定位

| 層 | 角色 | 路徑 |
|---|------|------|
| **Vault `13-user-stories/`** | 內部正本（business-level User Story）| 本目錄 |
| **OpenSpec spec § Scenarios** | requirement-level Acceptance Scenarios（Given/When/Then，工程驗收用）| `openspec/specs/<module>/spec.md` |
| **Notion User Story DB** | 對外發布版本（推送自 Vault）| https://www.notion.so/32c3886511fa808d8cb7db5c7af8ce6d |

**重要區別**：

- User Story（本目錄）：**業務視角**，「作為 [角色]，我希望 [動作]，以便 [價值]」單一故事；PM / 利害關係人 / Test Case 設計用
- Acceptance Scenarios（OpenSpec spec § Scenarios）：**工程驗收視角**，Given/When/Then 行為描述；LLM / 工程驗收用
- Cross-module Scenarios（[[wiki/erp/07-scenarios/README|07-scenarios/]]）：**端到端流程視角**，跨多模組多實體狀態流轉
- 三者**互補不衝突**，透過 frontmatter `related-spec` / `related-scenarios` 雙向連結

## 二、單階段撰寫紀律（2026-06-01 自兩階段收斂）

每張 user-story 卡為**單階段純業務情境卡**：只寫業務情境（含 Gherkin 成功條件），不含 UI 操作層。

### 業務情境（H2「業務情境」）

- 內容含 H3：作為 / 我希望 / 以便 / 成功條件（必填）+ 前置條件 / 業務流程（可選）
- **全卡禁含 UI 措辭**（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器）
- **禁含未轉中文的英文欄位名**（payment → 付款紀錄 / printItem → 印件 / orderAdjustment → 訂單異動 / quoteRequest → 需求單 等）
- 引自 [Atlassian](https://www.atlassian.com/agile/project-management/user-stories)：「This statement should be implementation free — if you're describing any part of the UI you're missing the point」

### 成功條件（Gherkin 框架）

- 每條寫成 Gherkin 情境（Scenario / Given / When / Then）；2-5 條（超過 5 建議 split story）。
- 守**單一 When + 單一 Then**（多個獨立 When → 拆條或 split）；Given 可疊加。
- 涵蓋**正向達成型**（Given 前置 → When 動作 → Then 達成）與**禁止/守衛型**（Given 某狀態 → When 嘗試 → Then 不允許，如「訂單完成後不可建訂單異動」）。
- 業務 outcome 級、禁 UI；守衛規則本體 wiki link 指 [[../04-business-logic|business-logic]] 正本。
- 與 OpenSpec § Scenarios 層級區隔（業務驗收意圖 vs requirement 工程驗收）。

### UI 與驗收的去向

- **UI 操作層已移除**（原階段 2）。介面層級驗收下移 [[erp-test-case]]（業務級 happy/edge）；真正的 UI 點擊操作歸 Prototype 端對端測試（Playwright spec，frontmatter `implemented-by` 指向）。
- 成功條件是 test-case 的取材種子：正向→happy、守衛→edge。

## 二之二、獨立性紀律（禁 anchor 故事）

每張 user-story 卡 **MUST** 描述單一角色的單一情境，對應實務物理世界的一個動作或決策。完整工作流程由多張獨立 user story **組合**而成，**MUST NOT 建立統合多角色 / 多動作的 anchor 故事**。

### 禁 anchor 紀律（2026-05-22 新增）

- **MUST NOT** 寫「統合 N 張子故事」的 user story
- 違反 INVEST Independent（每張 user story 須獨立可交付 / 可驗收）
- 統合卡造成：(a) 改一個子情境須回溯統合卡同步、(b) 跨多角色職責邊界模糊、(c) 隱藏相依性使 PM 難以辨識「A 完成才能 B」順序

### 跨多角色 / 多動作流程的處理

跨多角色或多動作的端到端流程 **MUST** 由 [[wiki/erp/07-scenarios/README|07-scenarios]] 處理（2026-05-22 擴展涵蓋「跨模組或跨角色的端到端流程」，不再限於跨模組）。

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
3. 套 [[wiki/erp/13-user-stories/_template]]
4. 寫業務情境（INVEST 自審：Independent / Negotiable / Valuable / Estimable / Small / Testable）
5. 識別不確定項 → 觸發 [[oq-manage]] mode B 開 OQ 卡（不可 inline 標注）
6. 補 provenance（`source` frontmatter）
7. 跑 lint（vault-audit 維度 13 — 第三階段實作前先人工檢查）
8. commit

### 推送 Notion（Mode B）

觸發詞「推 user story 到 Notion」「同步 user story」→ [[erp-user-story]] skill mode B

> 原「補 UI 操作層（Mode B）」已隨 2026-06-01 單階段化移除；介面層級驗收改由 [[erp-test-case]] 承接、UI 點擊歸 Prototype e2e。

1. 列出 status=active + 未列入 `memory/erp/notion-publish-manifest.md` 或推送日過舊的卡
2. 批次推送（property mapping 詳見 skill）
3. 更新 `memory/erp/notion-publish-manifest.md` 對應列（Notion URL + 最後推送日；不回寫卡 frontmatter）

## 七、與其他 Vault 卡的關係

- [[wiki/erp/07-scenarios/README]]：跨模組端到端情境（業務流程串接層，與單一 user story 互補）
- [[_alignment-report|03-roles/]]：角色卡（user-story `role` frontmatter wiki link 至此）
- [[04-business-logic|04-business-logic/]]：業務邏輯卡（user-story `related-business-logic` wiki link 至此）
- [[05-entities|05-entities/]]：實體卡（user-story `related-entities` wiki link 至此）
- `raw/`：原始素材（user-story `source` 可指向 raw 卡）

## 八、相關 skill / agent

- [[erp-user-story]] — 新增 / 推送 Notion 主 skill
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
