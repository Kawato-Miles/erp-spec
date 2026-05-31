---
type: meta
status: active
last-reviewed: 2026-05-31
---

# Wiki Schema（Formal）

> Vault 治理規則的**正式版**。`vault-audit` skill 依此 schema 執行 lint。
> 取代 `editing-conventions.md` 的分散規則（editing-conventions 仍保留為「人類友善版」摘要）。

## 一、type Enum（必填）

| type | 用途 | 對應目錄 |
|------|------|---------|
| `meta` | Vault 元數據（章程 / 入口 / 規約 / 邊界 / 流程 / log） | `00-meta/` |
| `product-vision` | 產品願景 / 痛點 / 利害關係人 | `01-products/` |
| `phase` | 產品 Phase 定義 | `01-products/phases.md` |
| `metric` | KPI / 北極星指標 / Impact Score | `01-products/`、`01-products/kpi/` |
| `domain` | 印刷業 domain knowledge | `02-domain/` |
| `glossary` | 術語表 | `02-domain/glossary-*.md` |
| `role` | 角色 R&R | `03-roles/` |
| `business-logic` | 商業邏輯卡（業務規則）| `04-business-logic/` |
| `entity` | 資料模型實體 | `05-entities/` |
| `state-machine` | 狀態機 | `06-state-machines/` |
| `scenario` | 跨模組情境 | `07-scenarios/` |
| `user-story` | 業務 User Story（單一故事，含兩階段內容）| `13-user-stories/` |
| `open-question` | OQ 卡 | `08-open-questions/` |
| `canvas-ref` | Canvas 對應的 markdown 描述 | `09-canvases/` |
| `reference` | 外部連結索引 | `10-references/` |
| `insight` | vault-insight 產出 | `12-insights/` |
| `raw` | Raw 素材（已驗證的觀察 / 反饋 / 研究筆記，未精練）| `raw/` |
| `review` | 每日 / 每週回顧（daily-brief 與 weekly-review skill 產出）| `14-reviews/daily/`、`14-reviews/weekly/` |
| `test-case` | UAT 業務層驗收項目卡（正文存 Notion，Vault 卡只承載索引與往上指依據）| `15-test-cases/<module>/` |

**六層與 type 的對應（2026-05-31 新增，對齊 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）]]）**：本 Vault 的商業邏輯正本依「營運原則 → 共用規則 → 業務規則 → 流程／狀態／角色／資料 → 操作步驟 → 驗收項目」六層組織。各層對應的 type 如下表。**營運原則層沿用既有 `type=product-vision`，不新增獨立 type**（避免 enum 膨脹；營運原則卡以 `01-products/` 目錄 + 內容判別，不靠新 type 區隔）。

| 分層 | 定位 | 對應 type | 對應目錄 |
|------|---------|----------|---------|
| 營運原則（最高層）| 最高價值 / 分權方向（由 Miles 拍板、不可驗算）| `product-vision`（沿用，**不新增 type**）| `01-products/` |
| 共用規則 | 這個領域所有規則都一定要遵守的底線（如對帳一致性，跨多條業務規則的恆定約束）| `business-logic`（共用規則卡，見 § 四 business-logic 內部分層）| `04-business-logic/` |
| 業務規則 | 具體規則（可驗算的 if-then 業務規則）| `business-logic`（業務規則卡）| `04-business-logic/` |
| 流程／狀態／角色／資料 | 個案執行指令（情境 / 狀態 / 角色 / 實體）| `scenario` / `state-machine` / `role` / `entity` | `07-scenarios/` / `06-state-machines/` / `03-roles/` / `05-entities/` |
| 操作步驟 | 單一角色執行某規則的步驟 | `user-story` | `13-user-stories/<module>/` |
| 驗收項目 | 某具體輸入下的可勾稽驗收結論 | `test-case` | `15-test-cases/<module>/` |

> **兩種最高層分開**：營運原則（`type=product-vision`，業務主管讀，定公司最高價值與分權方向）與文件管理規範（[[wiki-architecture]] + 專案 `CLAUDE.md`，定「Vault > OpenSpec」等知識管理規約）是兩條獨立的最高層，互不混用。本 schema 屬文件管理層（`type=meta`）。

## 二、module Enum（多選）

```yaml
module:
  - quote-request | order-management | consultation-request | after-sales-ticket
  - work-order | production-task | prepress-review | qc
  - material-master | process-master | binding-master
  - graphic-editor          # 圖編產品
  - cross-module            # 跨模組（狀態機 / 商業流程 / 業務情境 / 使用者角色）
```

## 二B、business-domain Enum（必填，2026-05-28 新增）

> 業務領域分類，對應 [[business-domain-taxonomy]] 6 領域 + 跨領域共用層。
> **新卡必填、舊卡視需要 backfill**（第一輪只 backfill Billing & Cash 領域卡作為實證）。
> 對應 [[erp-planning-audit-framework]] 雙軸結構之軸 1，`erp-planning-pre-check` skill 用此欄位 grep 載入對應領域卡。

```yaml
business-domain:
  - pre-sales                  # 商務前置：諮詢 / 報價 / 需求單
  - order-management           # 訂單管理：訂單 / 異動（不含 Payment-Invoice）
  - prepress                   # 印前審稿：稿件審查 / 打樣 / 印件規格
  - production                 # 生產執行：工單 / 任務 / 排程 / QC（已併 ProductionTask）/ 派工
  - fulfillment-after-sales    # 履約與售後：出貨 / 售後 ticket / 客訴
  - billing-cash               # 款項與發票：收款 / 開票 / 對帳 / 退款 / OA-Payment 推進
  - cross-domain               # 跨領域共用層：角色 / 術語 / 跨模組情境 / 狀態機 / KPI / Master Data
```

**領域邊界判斷規則**：見 [[business-domain-taxonomy#四、邊界判斷規則]]。

**適用 type**：
- `role` / `business-logic` / `entity` / `state-machine` / `scenario` / `user-story` / `test-case` / `insight` / `raw` **必填**
- `meta` / `glossary` / `domain` / `product-vision` / `phase` / `metric` / `open-question` / `reference` / `review` **視需要**（多為 cross-domain）

## 三、status Enum

| status | 用於 |
|--------|------|
| `draft` | 草稿，待完善 |
| `active` | 現行有效 |
| `deprecated` | 已過時，待移除 |
| `open` | OQ 開啟未解 |
| `answered` | OQ 已解答 |
| `cancelled` | OQ 取消（已不適用）|
| `in-progress` | insight 進行中 |
| `resolved` | insight 已落實 |
| `raw` | raw 卡剛寫入，待精練 |
| `reviewed` | raw 卡已分析，等待 Miles 確認 |
| `ingested` | raw 卡內容已寫入既有 vault 卡 / 升級為 OQ 或 insight |

## 四、各 type 必填 Frontmatter 欄位

### 4.0 往上指依據、往下指實作的通則（2026-05-31 新增）

> 對齊 [[wiki-architecture#依據往上、實作往下，連結不繞回自己]]。所有承載商業邏輯的卡（`business-logic` / `entity` / `state-machine` / `scenario` / `role` / `user-story` / `test-case`）採「往上 `source` + 往下 `implemented-by`」兩欄連結，整張圖的連結不會繞回自己。

| 欄位 | 方向 | 用途 | 指向對象 | 硬規則 |
|------|------|------|---------|--------|
| `source` | 往**上層**（更上層）| **正確性根據**（這張卡為什麼對 → 上層卡授權）| 更上層的 Vault 卡（營運原則 / 共用規則 / 業務規則 / 流程狀態角色資料 / 操作步驟），或最上層的依據（Miles 拍板 / 法規 / 客戶訪談）| **禁指 OpenSpec spec**（OpenSpec 是實作規格，不是正確性來源，方向顛倒）；**禁指同層卡**（平行卡不互為正確性根據，容易繞回自己）；**禁指下層卡**（下層不授權上層）|
| `implemented-by` | 往**下層**（實作層）| **導航 / 覆蓋**（這張卡落到哪 → 下層實作位置）| OpenSpec Requirement 標題層（`openspec/specs/<module>/spec.md#Requirement: <標題>`）/ Prototype 端對端測試 / Prototype 型別檔 | **不承載正確性**（只是導航）；**可多值**；**可留空 = 待實作**（漸進填寫，不強制）|

- `source` 的「往上指更上層」原則，使依據鏈終止於最上層的依據（如營運原則的 source 終止於 Miles 拍板），不在 Vault 內部繞回自己。
- `implemented-by` 連到 OpenSpec **Requirement 標題層**（非整份 spec、非行號），方便 change archive 後對齊；留空代表該卡尚未落到 OpenSpec / Prototype，屬待實作狀態。
- 連結不繞回自己由 § 六維度 15 lint 把關（`source` 鏈繞回自己報 Error、`source` 指向 OpenSpec 報 Error）。

### type=meta

```yaml
---
type: meta
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=product-vision / phase / metric

```yaml
---
type: <product-vision|phase|metric>
module:
  - cross-module  # 或具體模組
status: active
last-reviewed: YYYY-MM-DD
related-notion: <URL>  # 若有
---
```

### type=domain / glossary

```yaml
---
type: <domain|glossary>
module:
  - cross-module
status: active
last-reviewed: YYYY-MM-DD
related-spec: <memory/erp/glossary.md 或 memory/shared/...>  # 來源 memory 檔
---
```

### type=role

```yaml
---
type: role
module:
  - <主要模組>
source:                          # 往上層 = 正確性根據（營運原則 / 商業流程共用規則 / Miles 拍板），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡或最上層依據>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec Requirement 標題層），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/user-roles/spec.md#Requirement: <標題>"
related-spec: openspec/specs/user-roles/spec.md  # 若 OpenSpec 有（補充參照，非正確性來源）
related-notion: <Notion 核心角色權責 DB 連結>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=business-logic

```yaml
---
type: business-logic
module:
  - <模組>
logic-tier: general | specific   # 內部分層（2026-05-31 新增）：general=共用規則（這個領域所有規則都一定要遵守的底線）/ specific=業務規則（具體規則）；見下方「business-logic 內部分層」
source:                          # 往上層 = 正確性根據；共用規則卡指營運原則 / 最上層依據，業務規則卡可指所屬共用規則卡；禁指 OpenSpec / 同層平行業務規則 / 下層；見 § 4.0
  - "[[<上層卡或最上層依據>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec Requirement 標題層 / Prototype 型別檔），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<模組>/spec.md#Requirement: <標題>"
related-spec: openspec/specs/<模組>/spec.md  # 若 OpenSpec 有（補充參照，非正確性來源）
related-prototype: sens-erp-prototype/src/types/<...>.ts  # 若 Prototype 有
status: active
last-reviewed: YYYY-MM-DD
---
```

**business-logic 內部分層（共用規則卡 vs 業務規則卡，2026-05-31 新增）**：

> business-logic 目錄同時承載六層中的「共用規則」與「業務規則」兩層，以 frontmatter `logic-tier` 區分。對齊 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）]]與 [[business-logic-writing-guide#4.0 各類卡的單一職責]]。

| 內部分層 | `logic-tier` 值 | 角色 | 該寫 | 範例 |
|---------|----------------|------|------|------|
| 共用規則 | `general` | **這個領域所有規則都一定要遵守的底線**：跨多條業務規則恆定成立的約束，業務規則不得違反 | 一定要成立的規則陳述（甚麼恆為真）+ 為何恆定 + 統攝哪些業務規則 | 對帳一致性（應收 = 發票淨額 = 收款淨額）；獨立成卡，帶實例階段再建 |
| 業務規則 | `specific` | **具體規則**：可驗算的 if-then 業務規則 | 觸發條件 + 計算 / 判定邏輯 + 邊界情況 + 連帶影響 | 補收正項 OA 免主管審核直達已執行；諮詢取消半額退費 1000 |

- 共用規則卡的 `source` 往上指營運原則 / 最上層依據（不指任何業務規則）；業務規則卡的 `source` 可往上指其所屬共用規則卡（受共用規則約束），但**禁指同層平行業務規則**（避免繞回自己）。
- 業務規則 MUST NOT 違反其所屬共用規則；衝突時以共用規則為準（共用規則層高於業務規則）。

### type=entity

```yaml
---
type: entity
module:
  - <模組>
source:                          # 往上層 = 正確性根據（所屬 business-logic 規則 / 流程狀態角色資料層情境），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec Requirement 標題層 / Prototype 型別檔），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<模組>/spec.md#Requirement: <標題>"
related-spec: openspec/specs/<模組>/spec.md  # 補充參照，非正確性來源
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=state-machine

```yaml
---
type: state-machine
module:
  - <模組>
source:                          # 往上層 = 正確性根據（所屬 business-logic 規則 / 流程狀態角色資料層情境），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec Requirement 標題層），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/state-machines/spec.md#Requirement: <標題>"
related-spec: openspec/specs/state-machines/spec.md  # 補充參照，非正確性來源
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=scenario

```yaml
---
type: scenario
module:
  - cross-module
source:                          # 往上層 = 正確性根據（所依據的 business-logic 規則 / 商業流程共用規則），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec Requirement 標題層），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/business-scenarios/spec.md#Requirement: <標題>"
related-spec: openspec/specs/business-scenarios/spec.md  # 補充參照，非正確性來源
related-notion: <Notion 業務情境 DB 連結>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=user-story

```yaml
---
type: user-story
us-id: US-<MODULE>-<NNN>                   # 如 US-AR-001（沿用 Notion 既有編碼）
module:
  - <module>                                # 對齊本 schema § 二 module enum
role:
  - "[[<角色卡>]]"                          # wiki link 至 03-roles/
priority: high | medium | low
stage: business-only | ui-bound             # 兩階段標記（必填）
ui-binding: draft | prototype-v1 | locked   # UI 段版本標記（stage=ui-bound 時必填）
status: draft | active | deprecated
created-at: YYYY-MM-DD
last-reviewed: YYYY-MM-DD
source:                                     # 往上層 = 正確性根據 + 來源（防 AI 拿自己寫的東西當依據再生內容），必填 ≥ 1；指更上層卡（business-logic 規則 / scenario）或最上層依據（raw / 訪談）；禁指其他 user-story 卡（同層繞回自己）、禁指 OpenSpec（方向顛倒）；見 § 4.0
  - "[[<raw / 業務邏輯卡 / scenario>]]"
implemented-by:                             # 往下層 = 導航（OpenSpec Requirement 標題層 / Prototype e2e），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<module>/spec.md#Requirement: <標題>"
related-spec: openspec/specs/<module>/spec.md  # 補充參照，非正確性來源
related-scenarios:                          # 連到跨模組情境（可選）
  - "[[07-scenarios/README#情境 X]]"
related-business-logic:                     # 連到業務邏輯卡（可選）
  - "[[<業務邏輯卡>]]"
related-entities:                           # 連到實體卡（可選）
  - "[[<實體卡>]]"
related-test-cases:                         # Notion Test Case URL（選填）
  - <URL>
prerequisites:                              # 相依性（2026-05-22 新增）：本 US 執行前須完成的前置動作
  - "[[<US-XX-NNN>]]"                       # 其他 user story（具體 wiki link）
  - "<系統行為或角色準備動作的文字描述>"   # 如「系統自動分派完成」「審稿主管已維護能力等級」
notion-published-at: YYYY-MM-DD             # 推送後填
notion-page-url: <URL>                      # 推送後填
---
```

**防止 AI 拿自己寫的東西當依據再生內容的規約**：
- 每張 user-story 卡必填 `source` ≥ 1 條（指向 raw / spec / 業務邏輯卡 / 訪談紀錄）
- 禁止 Claude 引用其他 user-story 卡作為 source（會造成 AI 拿自己寫的東西當依據再生內容）
- 業務情境段（H2「業務情境（穩定層）」）禁含 UI 措辭（見 § 六 維度 13）
- stage=business-only 時 UI 操作段須保持空 / 待補；填了內容須將 stage 改為 ui-bound

**禁彙整型入口故事規約**（2026-05-22 新增）：
- **MUST NOT** 建立「統合多角色 / 多動作」的 user story 作為總分結構入口（彙整型入口故事）
- 違反 INVEST 的「每張故事彼此獨立」原則；統合卡造成維護困難 + 隱藏相依性
- 跨多角色 / 多動作的端到端流程 **MUST** 由 [[../07-scenarios]] 處理
- user story 間的相依性以 `prerequisites` 欄位記錄，禁用彙整型入口故事代替

### type=test-case

> 驗收項目卡（UAT 業務層）。**正文（前置條件 / 測試步驟 / 預期結果）存 Notion ERP Test Case DB，Vault 卡只承載 frontmatter（含往上指依據）+ 相關連結**。撰寫 / 稽核基準正本：[[_template-test-case]]（這份範本同時是寫的時候照著填、事後照著檢查）。對齊 [[wiki-architecture#分層體系（營運原則 → 驗收項目，由大到細）]]（驗收項目 = 最具體層）。

```yaml
---
type: test-case
tc-id: TC-<MODULE>-<NNN>                    # 必填，唯一鍵；NNN 三位補零（如 TC-ORD-001）
module:                                      # 必填，對齊 § 二 module enum
  - <module>
business-domain:                             # 必填（test-case 屬商業邏輯正本卡群），對齊 § 二B 6 領域之一
  - <pre-sales | order-management | prepress | production | fulfillment-after-sales | billing-cash | cross-domain>
status: draft | active | deprecated         # 必填
last-reviewed: YYYY-MM-DD                    # 必填
source:                                      # 往上層 = 正確性根據，必填 ≥ 1；MUST 指 user-story 卡（驗收項目依操作步驟）；禁指同層 test-case / business-logic / OpenSpec；見 § 4.0
  - "[[../13-user-stories/<module>/US-<MODULE>-<NNN>-<簡述>]]"
implemented-by:                              # 往下層 = 導航 / 覆蓋，可多值 / 可留空=待實作；指 OpenSpec Requirement 標題層 / Prototype e2e；見 § 4.0
  - "openspec/specs/<module>/spec.md#Requirement: <標題>"
  - "sens-erp-prototype/tests/e2e/<spec>.spec.ts"   # 若已實作
notion-page-url: <Notion ERP Test Case DB 該卡 URL>   # 必填（正文落點，Vault 不放正文；推送後填）
provenance-commit: <SHA>                     # 可選但建議：上次對齊 commit，供 doc-audit stale 偵測
last-passed-at: YYYY-MM-DD                    # 可選：上次 UAT 驗收通過日期（執行後回填）
---
```

**驗收項目卡規約**：
- `source` MUST 指 user-story 卡（驗收項目依操作步驟），**禁指同層 test-case / business-logic / OpenSpec**（依據往上、實作往下，正確性只往上指更上層）。
- 對應的 user-story 卡以 frontmatter `related-test-cases` 欄位填 Notion URL 回連（雙向可達）。
- Vault 卡只放 frontmatter + 相關連結，**正文存 Notion**，不在 Vault 重抄 Notion 正文（內容職責邊界見 § 十一）。
- 適用範圍限 **UAT 業務層**驗收（順利情境 / 邊界情境分區、明確結束點），不涵蓋單元測試 / SIT。

### type=open-question

```yaml
---
type: open-question
module:
  - <模組>
oq-id: <MODULE>-<NNN>
status: open | answered | cancelled
priority: high | medium | low
audience: internal | external  # 預設 internal
raised-at: YYYY-MM-DD
raised-by: <角色或姓名>
source-link: <討論連結 / Notion 頁面 / Slack URL>
related-vault:
  - <wiki link>
related-oq:
  - <其他 oq-id>
expected-resolution-at: YYYY-MM-DD  # 可選但建議填
answered-at: YYYY-MM-DD  # status=answered 時填
answered-by: <角色或姓名>
notion-published-at: YYYY-MM-DD  # 若已推 Notion
notion-page-url: <URL>
---
```

### type=insight

```yaml
---
type: insight
module:
  - <模組>
status: open | in-progress | resolved | cancelled
priority: high | medium | low
raised-at: YYYY-MM-DD
raised-by: vault-insight skill
triggered-by: manual | OQ-累積 | phase-切換 | change-archive | audit
related-vault:
  - <wiki link>
related-oq:
  - <oq-id>
related-raw:                  # 2026-05-21 新增：vault-insight 從 raw 素材累積識別 pattern 時填
  - "[[raw/<檔名>]]"          # MUST 是 status=ingested 或 reviewed 的卡（vault-ingest 防線 4）
related-spec: <OpenSpec spec 路徑>  # 若有
expected-action-at: YYYY-MM-DD
resolved-at: YYYY-MM-DD  # status=resolved 時填
---
```

### type=reference

```yaml
---
type: reference
module:
  - cross-module
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=raw

```yaml
---
type: raw
status: raw | reviewed | ingested | cancelled
created-at: YYYY-MM-DD
source: miles-dialogue | claude-research | claude-self-capture | prototype-dogfood | mes-study | miles-upload
captured-by: miles | claude-on-task | claude-self
module:
  - <候選模組或 cross-module>
topic-tag:
  - <自由標籤>
related-vault:
  - "[[候選相關卡]]"
raw-source-link: <對話片段 / WebFetch URL / Slack URL / 原始檔出處>  # claude-research / miles-upload 必填
attached-files:                                        # source=miles-upload 必填；其他可選
  - "_attachments/<檔名>"
ingested-at: YYYY-MM-DD                                # status=ingested 時填
ingested-to:                                           # status=ingested 時填
  - "[[寫入的既有卡]]"
---
```

**防止 AI 拿自己寫的東西當依據再生內容的規約**：
- `claude-self-capture` 必須 Miles 確認才寫入
- `claude-research` 必須附真實 raw-source-link，無來源不寫
- `miles-upload` 必須附真實 raw-source-link（原始檔出處）+ 原檔搬進 `raw/_attachments/<檔名>` + 在 `attached-files` 列出
- raw 卡是「已驗證素材的歸檔」，不是 AI 自編內容的暫存區

### type=review

```yaml
---
type: review
review-kind: daily | weekly
status: active
created-at: YYYY-MM-DD            # daily 即當日；weekly 為週日（週末整理日）
period:                            # 涵蓋區間
  start: YYYY-MM-DD
  end: YYYY-MM-DD
module:
  - cross-module
related-vault:                     # 本期涉及的既有 vault 卡（含 raw / OQ / insight 等）
  - "[[<卡>]]"
related-commits:                   # 本期 commit hash 列表
  - <hash>
related-changes:                   # 本期涉及的 openspec change
  - <change-id>
---
```

**Anti-Pattern 規約**：
- 禁空洞讚美（「本週進度良好」「執行順利」等無 actionable 內容）
- 禁無 source（每個觀察 MUST 指向具體 commit / OQ / 卡 / change）
- 禁無下一步（daily「今日建議行動」、weekly「下週重點」MUST 帶具體 action）
- 禁重複（與 audit-log 內容重複時引用而非重寫）

## 五、目錄允許 Page-Type 規約

| 目錄 | 允許 type |
|------|----------|
| `00-meta/` | `meta` |
| `01-products/` | `product-vision` / `phase` / `metric` |
| `02-domain/` | `domain` / `glossary` |
| `03-roles/` | `role` / `meta`（`_alignment-report.md`）|
| `04-business-logic/` | `business-logic` |
| `05-entities/` | `entity` |
| `06-state-machines/` | `state-machine` |
| `07-scenarios/` | `scenario` / `meta`（`README.md`）|
| `08-open-questions/` | `open-question` / `meta`（`README.md`）|
| `09-canvases/` | `.canvas` 檔（無 frontmatter）/ `canvas-ref` |
| `10-references/` | `reference` |
| `12-insights/` | `insight` / `meta`（`README.md`）|
| `13-user-stories/` | `meta`（`README.md` / `_template.md`）|
| `13-user-stories/<module>/` | `user-story` |
| `13-user-stories/_shared/` | `user-story`（module=cross-module）|
| `raw/` | `raw` / `meta`（`README.md` / `_template.md`）|
| `raw/_attachments/` | 任意檔（PDF / 圖 / docx / 訪談錄音轉文字等）；不需 frontmatter |
| `14-reviews/` | `meta`（`README.md`）|
| `14-reviews/daily/` | `review`（review-kind=daily）/ `meta`（`_template.md`）|
| `14-reviews/weekly/` | `review`（review-kind=weekly）/ `meta`（`_template.md`）|
| `15-test-cases/` | `meta`（`README.md` / `_template-test-case.md`）|
| `15-test-cases/<module>/` | `test-case` |

## 六、Lint 規則（vault-audit 依此判定）

### 維度 1：頁面間矛盾

**Error 條件**：同概念在多卡有明確矛盾敘述
**Warning 條件**：補充性差異（不矛盾，但細節不同）

### 維度 2：過時宣稱

**Error 條件**：> 5 卡 `last-reviewed` > 90 天 + `status: active`
**Warning 條件**：1-5 卡符合上述

### 維度 3：孤立頁面

**Error 條件**：> 3 個 orphan（除 README / index 性質檔）
**Warning 條件**：1-3 個 orphan

### 維度 4：缺失連結

**Error 條件**：> 5 個 dangling wiki link
**Warning 條件**：1-5 個 dangling

### 維度 5：數據缺口

**Error 條件**：> 5 個必填 frontmatter 欄位缺失
**Warning 條件**：1-5 個缺失

### 維度 6：規則遵守

**Error 條件**：
- 任何 Vault 卡（除 README anti-pattern 說明）有 `[!question]` callout
- 任何 Vault 卡有 inline OQ 措辭（「待確認 / 待釐清 / 需確認 / 尚未確認 / 待補」）
- OQ 卡未遵守 `<MODULE>-<NNN>-<簡述>.md` 命名

**Warning 條件**：1-3 違規

### 維度 7：Vault ↔ OpenSpec 對齊

**Error 條件**：明顯不對齊（如某模組無 Vault 對應卡 / Vault 引用的 spec 不存在）
**Warning 條件**：< 3 個缺漏

### 維度 8：OQ 健康度

**Error 條件**：> 3 OQ open 過久（raised-at > 30 天 + 無進度）
**Warning 條件**：1-3 OQ

### 維度 9：角色 alignment 落後狀態

**Error 條件**：> 5 角色持續落後 + 已過 60 天
**Warning 條件**：1-5 角色持續落後

### 維度 10：KPI / Phase 進度對照

**Error 條件**：多數 KPI 無法對照 Vault / spec 內容
**Warning 條件**：少數 KPI 缺對應

### 維度 11：Raw 健康度（Phase 2 待 vault-audit 實作）

**Error 條件**：> 5 張 raw 卡 `status: raw` 且 `created-at` > 180 天
**Warning 條件**：1-5 張符合上述，或同主題 raw 累積 ≥ 3 張未精練

> 本維度由 vault-ingest skill 引入後預留，待 vault-audit skill 第二階段擴充實作。

### 維度 12：Review 規律性（Phase 2 待 vault-audit 實作）

**Error 條件**：本月 daily review < 工作日數 × 50% 或本月無 weekly review
**Warning 條件**：本週 daily review 缺 ≥ 2 工作日，或上週無 weekly review

> 本維度由 daily-brief / weekly-review skill 引入後預留，待 vault-audit skill 第二階段擴充實作。

### 維度 13：User Story 撰寫紀律（Phase 3 待 vault-audit 實作）

**Error 條件**：
- 業務情境段缺「作為 / 我希望 / 以便 / 成功條件」任一 H3
- 業務情境段含 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal / 選單 / 視窗 / Side Panel / Toast / Banner / Dialog / 表格欄位 / 篩選器 等）
- 內容含英文欄位名（payment / printItem / orderAdjustment / quoteRequest / workOrder / productionTask / reviewRound / paymentPlan 等）未轉中文
- 缺來源（frontmatter `source` 為空或不存在）
- stage=business-only 但 UI 操作段已填內容（stage 不一致）
- 命名不符 `US-<MODULE>-<NNN>-<slug>.md`
- frontmatter 缺 us-id / module / role / priority / stage / status / created-at / source 任一必填項

**Warning 條件**：
- acceptance criteria > 5 條（業界共識，建議 split story）
- acceptance criteria < 2 條（過於模糊）
- stage=ui-bound 但 UI 操作段空 / 缺 ui-binding 註解
- last-reviewed > 90 天 + status=active
- source 指向其他 user-story 卡（疑似 AI 拿自己寫的東西當依據再生內容）
- 「我希望」段字數 > 30 字（違反 INVEST Small，對應 [[user-story-spec#五、撰寫原則|user-story-spec § 五]]，2026-05-21 新增）
- 「成功條件」單條塞 ≥ 2 個獨立業務規則（違反 Testable 單一可驗證原則，2026-05-21 新增）

**Lint 例外**（2026-05-21 新增）：
- 外部使用者角色（如 B2C 會員 / EC 註冊會員）允許 `role` 為純文字而非 wiki link 至 `03-roles/`；對應 [[AR-1-B2C會員是否納入正式角色|AR-1]] 決策

> 本維度由 erp-user-story skill 引入後預留，待 vault-audit skill 第三階段擴充實作。

### 維度 14：卡類型內容職責邊界（2026-05-28 新增）

> 之前 schema 只規範 frontmatter（§ 四）+ user-story 內容（維度 13），其他卡類型正文無邊界 → business-logic / scenario 卡易混入 user-story 格式模板 / test-case 範本等越界內容。本維度補此缺口。詳見 § 十一。

**Error 條件**：
- business-logic / scenario / entity / role / state-machine 卡正文含 **user-story 格式模板**（「作為 [」+「我希望」+「以便」三者連續出現於同一程式碼區塊或段落）
- business-logic / scenario 卡正文含 **test-case 範本**（「測試案例：」+「前置條件：」+「測試步驟：」+「預期結果：」連續出現）

**Warning 條件**：
- business-logic 卡正文含完整實體 Data Model 表格（疑似 entity 內容越界）
- scenario 卡正文含計價公式細節（疑似 business-logic 越界）
- 任一卡正文用「複製格式模板」而非「cross-reference skill / spec」說明如何產 user story / test case

> 本維度 2026-05-28 由 `erp-planning-pre-check` 第一輪稽核發現 business-logic 卡缺內容規範後新增（付款發票邏輯.md § 九 + payment-invoice-scenarios.md § 使用建議曾混入 user-story 範本，已清理為 cross-reference）。對應 [[audit-failure-patterns]] Scope creep 反模式。

### 維度 15：依據鏈健康度（往上指依據、不繞回自己；2026-05-31 新增）

> 對齊 § 4.0 往上指依據、往下指實作的通則。`source` 鏈的連結不會繞回自己；`source` 方向必須往上層（更上層），不得指向 OpenSpec（方向顛倒）。本維度把關「依據往上、實作往下」的紀律。

**Error 條件**：
- `source` 鏈繞回自己（A 的 source 指 B、B 的 source 直接或間接指回 A）— 違反連結不繞回自己
- 任一卡 `source` 指向 OpenSpec spec 路徑（`openspec/specs/...`）— 方向顛倒（OpenSpec 是實作規格非正確性來源，應改填 `implemented-by` 或改指上層 Vault 卡）
- `test-case` 卡 `source` 未指任何 user-story 卡（驗收項目未依操作步驟）
- `user-story` 卡 `source` 指向另一 `user-story` 卡（同層繞回自己，已於維度 13 涵蓋，此處併入把關）

**Warning 條件**：
- `source` 指向同層平行卡（如 business-logic 業務規則 A 指業務規則 B 而非所屬共用規則）— 疑似橫向耦合，建議改指上層卡
- 承載商業邏輯的卡（business-logic / entity / state-machine / scenario / role / user-story / test-case）`source` 欄位為空 — 缺正確性根據（漸進補齊，非硬性）
- `implemented-by` 全空且 status=active 超過 90 天 — 疑似 active 卡長期未落到實作（提示而非錯誤，因 implemented-by 可留空=待實作）

> `source` 往上層 + `implemented-by` 往下層的兩欄設計，使依據鏈終止於最上層的依據（營運原則的 source 指 Miles 拍板），下層導航鏈終止於 OpenSpec / Prototype，整張圖的連結不會繞回自己。本維度待 vault-audit skill 擴充實作「檢查有沒有繞回自己」的偵測邏輯。

## 七、命名規約

### 一般卡

- 繁體中文檔名，名詞 / 名詞片語
- 不用動詞、不用問號 / 驚嘆號

### OQ 卡

- 格式：`<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴：QR / ORD / WO / PI / PT / QC / SHP / CR / AS / XM
- NNN 三位數字補零

### User Story 卡

- 格式：`US-<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴對照（保留 Notion 既有 US-AR-NNN 編碼 + 對齊 OQ 命名 + 補主檔模組）：
  - `QR` 需求單
  - `ORD` 訂單管理
  - `CR` 諮詢單
  - `AS` 售後服務
  - `WO` 工單管理
  - `PT` 生產任務
  - `AR` 稿件審查（沿用 Notion 既有 US-AR-NNN 編碼）
  - `QC` 品檢
  - `SHP` 出貨
  - `MM` 材料主檔
  - `PM` 工序主檔
  - `BM` 裝訂主檔
  - `XM` 跨模組（放 `13-user-stories/_shared/`）
- NNN 三位數字補零
- 簡述 slug：繁體中文、名詞或動詞 + 名詞片語
- 範例：`13-user-stories/prepress-review/US-AR-001-審核稿件.md`
- 範例：`13-user-stories/_shared/US-XM-001-訂單跨帳務公司付款.md`

### Test Case 卡（驗收項目，2026-05-31 新增）

- 格式：`TC-<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴對照同 User Story 卡（QR / ORD / CR / AS / WO / PT / AR / QC / SHP / MM / PM / BM / XM）
- NNN 三位數字補零
- frontmatter `tc-id` 與檔名前綴一致（如檔名 `TC-ORD-001-...`、`tc-id: TC-ORD-001`）
- 簡述 slug：繁體中文、名詞或動詞 + 名詞片語，描述被驗收的對象
- 範例：`15-test-cases/order-management/TC-ORD-001-補收免審直達已執行.md`
- 範例：`15-test-cases/billing-cash/TC-ORD-002-諮詢取消半額退費.md`

### Scenario 卡 scenario-id（流程／狀態／角色／資料層旅程卡，2026-05-31 新增）

> scenario 卡採旅程卡（journey）粒度，以 `scenario-id` 標識，供 user-story / test-case 反向引用某段端到端旅程。scenario 拆旅程卡 + 標 scenario-id。

- frontmatter `scenario-id` 格式：`SC-<主題 slug>-<NNN>`
- `<主題 slug>`：繁體中文主題詞（旅程主題，非模組代號；跨模組情境用主題分類比模組前綴更貼合）
- NNN 三位數字補零
- 檔名仍依「一般卡」規約（繁體中文名詞片語，如 `訂單異動流程.md`），`scenario-id` 在 frontmatter 標識，兩者分工：檔名給人讀、scenario-id 給連結指向的位置
- 範例 scenario-id：`SC-訂單異動-001`、`SC-諮詢取消-001`、`SC-退款折讓-001`

### 規則的連結指向位置命名（業務規則 / 共用規則，2026-05-31 補述）

> business-logic 卡內的「單條規則」以**業務語意命名的連結指向位置**標識，供 scenario / user-story / test-case 跨卡 wiki link 引用單條規則。正本規約已定於 [[wiki-architecture#各層怎麼寫]] + [[business-logic-writing-guide]]；此處併入命名規約集中索引。

- 規則的連結指向位置用**業務語意命名**（如 `#補收免審`、`#諮詢取消半額退費`），**不用流水號**（如 `#R1`）
- 理由：流水號重排 / 重用會讓連回來的連結斷掉；用業務語意命名時改規則只改內容、定位點不變，跨卡引用不斷鏈
- 引用方式：`[[<業務邏輯卡>#<業務語意定位點>]]`（如 `[[付款發票邏輯#補收免審]]`）
- 既有 `#R1` 等流水號定位點 MUST 一次性遷移為業務語意命名（遷移機制見 `wiki-amend` skill），遷移後由 vault-audit / doc-audit lint 偵測斷鏈兜底

### Insight 卡

- 格式：`<YYYY-MM-DD>-<主題 slug>.md`

### Raw 卡

- 格式：`<YYYY-MM-DD>-<source-slug>-<主題 slug>.md`
- `source-slug`：`miles-dialogue` / `claude-research` / `claude-self-capture` / `prototype-dogfood` / `mes-study` / `miles-upload`
- 範例：`2026-05-21-prototype-dogfood-狀態卡點擊區域64px過小.md`
- 範例：`2026-05-21-claude-research-tharstern-rma-flow.md`
- 範例：`2026-05-21-miles-upload-客戶訪談-富禾印務.md`

### Raw 附件（_attachments/）

- 格式：保留原檔名（不改）；若同名衝突在前綴加日期：`<YYYY-MM-DD>-<原檔名>`
- 範例：`_attachments/富禾印務訪談2026-05-15.docx`
- 範例：`_attachments/2026-05-21-廠商規格書-XX.pdf`
- 大檔案（> 10 MB）建議考慮 git-lfs 或外部存放並只在 raw-source-link 留 URL（第一版不強制）

### Review 卡

- daily 格式：`<YYYY-MM-DD>.md`（如 `2026-05-21.md`）
- weekly 格式：`<YYYY-WNN>.md`（NN 為 ISO 週數兩位數，如 `2026-W21.md`）
- 範例：`14-reviews/daily/2026-05-21.md`
- 範例：`14-reviews/weekly/2026-W21.md`

### Meta 卡（00-meta）

- 簡短英文 kebab-case：`vault-charter` / `scope-boundary` / `wiki-schema` / `editing-conventions` / `sync-workflow` / `audit-log`
- README 例外：`README.md`

## 八、Wiki Link 規約

- 內部連結：`[[節點名]]`、`[[節點名|顯示文字]]`、`[[節點名#段落]]`
- 連 OpenSpec / Prototype：用相對路徑 markdown link（如 `[spec.md](../../../openspec/specs/xxx/spec.md)`）
- **禁止 wiki link 到 vault 外**（Obsidian 不解析）

## 九、Anti-Pattern（vault-audit Error 級）

- ❌ Vault 卡用 `> [!question]` callout
- ❌ Inline OQ 措辭（「待確認」「待釐清」等）卻不開 OQ 卡
- ❌ 缺必填 frontmatter
- ❌ 命名不合規約
- ❌ Wiki link 連到不存在的卡（dangling）
- ❌ 沒有任何卡連到它的孤島卡（orphan，除 README / index 性質）
- ❌ user-story 業務情境段含 UI 措辭（按鈕 / 下拉 / 彈窗 / 點擊 / 分頁 / Tab / Modal 等）
- ❌ user-story 內容含未轉中文的英文欄位名（payment / printItem / orderAdjustment 等）
- ❌ user-story `source` frontmatter 為空（缺來源）
- ❌ user-story `source` 指向其他 user-story 卡（AI 拿自己寫的東西當依據再生內容的風險）
- ❌ user-story stage=business-only 但 UI 操作段已填內容（stage 不一致）
- ❌ `source` 鏈繞回自己（違反連結不繞回自己，見 § 六維度 15）
- ❌ `source` 指向 OpenSpec spec 路徑（方向顛倒，應改 `implemented-by` 或改指上層 Vault 卡）
- ❌ test-case `source` 未指 user-story 卡（驗收項目未依操作步驟）

## 十、與其他規範的關係

| 規範 | 範圍 | 關係 |
|------|------|------|
| `editing-conventions.md` | 人類友善版規約 | 本 schema 的精簡版，方便閱讀 |
| `scope-boundary.md` | Vault 收 / 不收 | 與本 schema 配合：scope-boundary 決定什麼進 Vault，本 schema 決定怎麼寫 |
| `vault-charter.md` | KM 章程 | 本 schema 是 charter § 編輯規約 的展開 |
| `sync-workflow.md` | 三邊同步流程 | 本 schema 不涉及 sync，sync 由 sync-workflow 處理 |

## 十一、卡類型內容職責邊界（2026-05-28 新增）

> 各卡類型的「正文內容職責」。之前 schema 只規範 frontmatter（§ 四）+ user-story 內容（§ 六維度 13），其他卡類型正文無邊界 → business-logic / scenario 卡易混入 user-story 格式模板 / test-case 範本 / UI 措辭等越界內容（對應 [[audit-failure-patterns]] Scope creep 反模式）。維度 14 依本節 lint。

### 11.1 各卡類型內容職責

| 卡類型 | 正文該寫（職責內容）| 不該寫（越界內容）|
|-------|------------------|------------------|
| `business-logic` | 業務規則 / 計算邏輯 / 連帶矩陣 / 情境分類索引 | user-story 格式模板（作為/我希望/以便）/ test-case 步驟範本 / UI 措辭 / 完整實體 Data Model |
| `scenario` | 跨模組端到端情境（角色傳遞 / 狀態鏈）| user-story 格式模板 / test-case 範本 / 計價公式細節（屬 business-logic）|
| `entity` | 實體欄位 / 關聯 / 狀態 | 業務流程敘述（屬 business-logic / scenario）/ user-story |
| `role` | 角色職責 / 權限 / 工作流 / 痛點 | 跨角色流程細節（屬 scenario）/ 實體欄位定義 |
| `state-machine` | 狀態定義 / 轉換條件 / 觸發事件 | 業務情境敘述（屬 scenario）/ UI 措辭 |
| `user-story` | 業務情境（穩定層）+ UI 操作（易變層）| 詳見 § 六維度 13（已規範）|
| `test-case` | frontmatter（含往上指依據）+ 一句話定位 + 相關連結（正文「前提條件→動作→驗收結果」三段存 Notion）| **正文三段重抄**（前置條件 / 測試步驟 / 預期結果屬 Notion）/ 規則動機長篇（屬 business-logic）/ user-story 格式模板 |

### 11.2 共通原則

- **產 user story / test case 一律 cross-reference 而非複製模板**：business-logic / scenario 卡若要說明「如何產 user story / test case」，MUST 指向 [[user-story-spec]] + `erp-user-story` / `erp-test-case` skill，**禁複製格式模板進卡**
- **越界內容移到對應卡類型**：發現越界內容時移到該內容職責所屬的卡類型（如實體 Data Model 從 business-logic 移到 entity）
- **cross-reference 用 wiki link / skill 名稱**，不複製內容（避免雙份維護 + 防止 AI 拿自己寫的東西當依據再生內容）
