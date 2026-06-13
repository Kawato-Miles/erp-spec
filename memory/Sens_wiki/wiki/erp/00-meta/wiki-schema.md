---
type: meta
status: active
last-reviewed: 2026-05-31
---

# Wiki Schema（Formal）

> Vault 治理規則的**正式版**。`vault-audit` skill 依此 schema 執行 lint。
> Vault frontmatter 的正式規範。vault-audit skill 依此 lint。

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
| `service-blueprint` | 服務藍圖（端到端業務鏈） | `04-business-logic/服務藍圖/` |
| `business-rule` | 商業規則（決策邏輯、領域知識、外部約束） | `04-business-logic/` 各子目錄 |
| `entity` | 資料模型實體 | `05-entities/` |
| `state-machine` | 狀態機 | `06-state-machines/` |
| `scenario` | 業務情境（目標完成過程；接力型／能力型／排程型） | `07-scenarios/` |
| `open-question` | OQ 卡 | `08-open-questions/` |
| `canvas-ref` | Canvas 對應的 markdown 描述 | `09-canvases/` |
| `reference` | 外部連結索引 | `10-references/` |
| `insight` | vault-insight 產出 | `12-insights/` |
| `raw` | Raw 素材（已驗證的觀察 / 反饋 / 研究筆記，未精練）| `raw/` |
| `review` | 每日 / 每週回顧（daily-brief 與 weekly-review skill 產出）| `14-reviews/daily/`、`14-reviews/weekly/` |

**分層與 type 的對應**（對齊 [[erp_index]] § 一架構概述）：

| 分層 | 對應 type | 對應目錄 |
|------|----------|---------|
| 產品策略 | `product-vision` / `phase` / `metric` | `01-products/` |
| 商業邏輯 | `service-blueprint`（服務藍圖）/ `business-rule`（商業規則） | `04-business-logic/` |
| 狀態 / 角色 / 資料 | `state-machine` / `role` / `entity` | `06` / `03` / `05` |
| 業務情境（過程） | `scenario` | `07-scenarios/` |

> 產品策略（`01-products/`）定商業方向，本 schema 屬文件管理層（`type=meta`）。架構概述見 [[erp_index]] § 一。

## 二、module Enum（多選）

> 2026-06-10 起 module 值改用繁體中文（與 business-domain 一致）。舊卡的英文 token 隨各卡被異動時逐步統一，新卡一律用中文值。

```yaml
module:
  - 需求單 | 訂單管理 | 諮詢單 | 售後服務
  - 工單 | 生產任務 | 印前審稿 | 品檢
  - 材料主檔 | 製程主檔 | 裝訂主檔
  - 圖編                    # 圖編產品
  - 跨模組                  # 跨模組（狀態機 / 商業流程 / 業務情境 / 使用者角色）
```

**新舊值對照**（轉換期查表用）：需求單 = quote-request、訂單管理 = order-management、諮詢單 = consultation-request、售後服務 = after-sales-ticket、工單 = work-order、生產任務 = production-task、印前審稿 = prepress-review、品檢 = qc、材料主檔 = material-master、製程主檔 = process-master、裝訂主檔 = binding-master、圖編 = graphic-editor、跨模組 = cross-module。

## 二B、business-domain Enum（必填，2026-05-28 新增）

> 業務領域分類，對應 [[business-domain-taxonomy]] 6 領域 + 跨領域共用層。
> **新卡必填、舊卡視需要 backfill**（第一輪只 backfill Billing & Cash 領域卡作為實證）。
> 對應 （見 erp-planning-pre-check skill 附件） 雙軸結構之軸 1，`erp-planning-pre-check` skill 用此欄位 grep 載入對應領域卡。

```yaml
business-domain:
  - 售前              # 諮詢 / 報價 / 需求單
  - 訂單管理          # 訂單 / 異動
  - 印前審稿          # 稿件審查 / 打樣 / 印件規格
  - 生產執行          # 工單 / 任務 / 排程 / 品檢 / 派工
  - 履約與售後        # 出貨 / 售後 / 客訴
  - 款項與發票        # 收款 / 開票 / 對帳 / 退款
  - 跨領域            # 角色 / 術語 / 跨模組情境 / 狀態機 / KPI
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

> **鐵則：卡片 frontmatter 禁含外部系統狀態欄位**（2026-06-10 新增）。「這張卡何時被推到哪個外部系統」是發布管線的狀態，不是商業知識——對外發布追蹤（Notion URL / 最後推送日）唯一正本在 `memory/erp/notion-publish-manifest.md`，由發布類 skill 維護，全程不回寫 wiki 卡。性質同「source 禁指 OpenSpec」：wiki 獨立維護，不與外部系統耦合。

### 4.0 往上指依據、往下指實作的通則（2026-05-31 新增）

> 對齊 [[erp_index]] § 一連結方向。所有承載商業邏輯的卡（`business-rule` / `service-blueprint` / `entity` / `state-machine` / `scenario` / `role` / `user-story` / `test-case`）採「往上 `source` + 往下 `implemented-by`」兩欄連結，整張圖的連結不會繞回自己。

| 欄位 | 方向 | 用途 | 指向對象 | 硬規則 |
|------|------|------|---------|--------|
| `source` | 往**上層**（更上層）| **正確性根據**（這張卡為什麼對 → 上層卡授權）| 更上層的 Vault 卡（營運原則 / 共用規則 / 業務規則 / 流程狀態角色資料 / 操作步驟），或最上層的依據（法規 / 客戶訪談 / 產業慣例；管理層決策本身不留卡上，脈絡歸 log 與 OQ）| **禁指 OpenSpec spec**（OpenSpec 是實作規格，不是正確性來源，方向顛倒）；**禁指同層卡**（平行卡不互為正確性根據，容易繞回自己）；**禁指下層卡**（下層不授權上層）|
| `implemented-by` | 往**下層**（實作層）| **導航 / 覆蓋**（這張卡落到哪 → 下層實作位置）| OpenSpec spec 檔（`openspec/specs/<module>/spec.md`，**不綁 `#Requirement: <標題>` 標題錨點**）/ Prototype 端對端測試 / Prototype 型別檔 | **不承載正確性**（只是導航）；**可多值**；**可留空 = 待實作**（漸進填寫，不強制）；**禁用標題錨點寫關聯**（見下）|

- `source` 的「往上指更上層」原則，使依據鏈終止於最上層的依據（法規／訪談／產業慣例），不在 Vault 內部繞回自己；管理層決策不寫進 source，脈絡由 log 與 OQ 承載。
- `implemented-by` 連到 OpenSpec **spec 檔層**（非行號、**非 `#Requirement: <標題>` 標題錨點**）；要標明對應哪條 Requirement 時，於卡內文字描述（如「實作於 § <標題>」），**不綁進連結錨點**。留空代表該卡尚未落到 OpenSpec / Prototype，屬待實作狀態。
  - **不用標題錨點寫關聯（2026-06-01 ORD-027 教訓）**：OpenSpec Requirement 標題會改名（如縮寫中文化 / 措辭調整），標題錨點一改即斷鏈、且反過來卡住標題改名（牽動所有引用它的卡）。故關聯一律指 spec 檔層級，Requirement 名稱只當文字描述。既有已寫標題錨點的卡先留著、不回頭批量改，新卡 / 被 change 異動的卡採新寫法。
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
source:                          # 往上層 = 正確性根據（營運原則 / 商業流程共用規則 / 權責表），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡或最上層依據>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec spec 檔層，不綁標題錨點），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<對應模組>/spec.md"
related-notion: <Notion 核心角色權責 DB 連結>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=service-blueprint

```yaml
---
type: service-blueprint
module:
  - <模組>
business-domain:
  - <領域或 cross-domain>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=business-rule

```yaml
---
type: business-rule
mutability: external | domain | internal  # 可變性：external=外部約束 / domain=領域知識 / internal=營運規則
module:
  - <模組>
business-domain:
  - <領域或 cross-domain>
source:
  - "<依據來源：產業慣例 / 法規 / 客戶訪談 / 上層商業規則卡>"
status: active
last-reviewed: YYYY-MM-DD
---
```

**商業規則的三種可變性（`mutability`）**：

| `mutability` | 意義 | 子目錄 | 誰能改 |
|---|---|---|---|
| `external` | 外部約束（法規 / 第三方規格） | `外部約束/` | 只有外部來源變更時 |
| `domain` | 領域知識（產業事實） | `領域知識/` | 產業本身改變時（極少） |
| `internal` | 營運規則（公司決策） | `營運規則/` | 訪談、管理層拍板可改 |

撰寫流程與產出格式詳見 `04-business-logic/_template-business-logic.md`。

### type=entity

```yaml
---
type: entity
module:
  - <模組>
source:                          # 往上層 = 正確性根據（所屬 business-logic 規則 / 流程狀態角色資料層情境），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
implemented-by:                  # 往下層 = 導航（OpenSpec spec 檔層不綁標題錨點 / Prototype 型別檔），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<模組>/spec.md"
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
implemented-by:                  # 往下層 = 導航（OpenSpec spec 檔層，不綁標題錨點），可多值 / 可留空=待實作；見 § 4.0
  - "openspec/specs/<對應模組>/spec.md"
related-spec: openspec/specs/<對應模組>/spec.md  # 補充參照，非正確性來源
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=scenario

```yaml
---
type: scenario
variant: 接力型 | 能力型 | 排程型      # 必填；判定見 07-scenarios/_template-business-scenario.md § 二
module:
  - <模組>
business-domain:
  - <六領域之一或跨領域>
source:                          # 往上層 = 正確性根據（服務藍圖 / business-logic 規則 / 拍板 OQ / 外部依據），禁指 OpenSpec / 同層 / 下層
  - "[[<藍圖或規則卡>]]"
implemented-by:                  # 往下層 = 導航（實作規格檔層），可多值 / 可留空
  - "openspec/specs/<模組>/spec.md"
status: draft | active
last-reviewed: YYYY-MM-DD
---
```

### type=open-question

> 平層 `08-open-questions/`＝未結案佇列（只放 status=open）；`08-open-questions/_archives/<拍板年份>/`＝已結案封存（answered／cancelled 拍板即移入，封存卡只增不改、翻案開新 OQ 引舊卡）。序號取號平層與封存一起算、永不重用。操作一律走 `oq-manage` skill。

```yaml
---
type: open-question
module:
  - <中文 module，見 § 二>
oq-id: <前綴>-<NNN>
status: open | answered | cancelled   # 嚴格三值，禁 resolved / closed / active 等自創值，禁行內註解
priority: high | medium | low
audience: internal | external
# audience 判斷問句：「誰能回答這個問題？」
#   internal＝開發迭代待確認議題（Miles 或內部討論可拍板）
#   external＝要與業務單位確認的未知內容（商業層面：現場實務／客戶慣例／計價緣由），彙整推送 Notion Follow-up DB
raised-at: YYYY-MM-DD
raised-by: <誰提出>
source-link: <識別到此問題的出處>
related-vault:
  - <wiki link>
related-oq:
  - <相關 OQ 全檔名 wiki link（帶別名），禁短名>
expected-resolution-at: YYYY-MM-DD  # external 必填；internal 建議填
answered-at: YYYY-MM-DD  # 拍板時填
answered-by: <拍板者>
notion-url: <external 推送 Notion 後回填>
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
| `04-business-logic/` | `service-blueprint` / `business-rule` |
| `05-entities/` | `entity` |
| `06-state-machines/` | `state-machine` |
| `07-scenarios/` | `scenario`（業務情境）/ `meta` |
| `08-open-questions/` | `open-question` / `meta`（`README.md`）|
| `09-canvases/` | `.canvas` 檔（無 frontmatter）/ `canvas-ref` |
| `10-references/` | `reference` |
| `12-insights/` | `insight` / `meta`（`README.md`）|
| `raw/` | `raw` / `meta`（`README.md` / `_template.md`）|
| `raw/_attachments/` | 任意檔（PDF / 圖 / docx / 訪談錄音轉文字等）；不需 frontmatter |
| `14-reviews/` | `meta`（`README.md`）|
| `14-reviews/daily/` | `review`（review-kind=daily）/ `meta`（`_template.md`）|
| `14-reviews/weekly/` | `review`（review-kind=weekly）/ `meta`（`_template.md`）|

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

**提示（Info）條件**：
- `implemented-by`（或 `source`）值含 `#Requirement:` 標題錨點（如 `openspec/specs/<module>/spec.md#Requirement: <標題>`）— 標題錨點易因 Requirement 改名斷鏈（2026-06-01 ORD-027 教訓），建議改指 spec 檔層、Requirement 名稱以文字描述。**僅對本輪新增 / 異動的卡提示**（既有存量卡先留著、不回頭批量改，故不對未異動卡報此項，避免噪音）。

> `source` 往上層 + `implemented-by` 往下層的兩欄設計，使依據鏈終止於最上層的依據（依據鏈終止於法規／訪談／產業慣例等最上層依據），下層導航鏈終止於 OpenSpec / Prototype，整張圖的連結不會繞回自己。本維度待 vault-audit skill 擴充實作「檢查有沒有繞回自己」的偵測邏輯。

## 七、命名規約

### 一般卡

- 繁體中文檔名，名詞 / 名詞片語
- 不用動詞、不用問號 / 驚嘆號

### OQ 卡

- 格式：`<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴：QR / ORD / WO / PI / PT / QC / SHP / CR / AS / XM
- NNN 三位數字補零

### Scenario 卡 scenario-id（流程／狀態／角色／資料層旅程卡，2026-05-31 新增）

> **已廢止（2026-06-11）**：業務情境卡不再配 scenario-id（名稱即連結指向的位置）；既有 scenario-id 保留至遷移清理。

> scenario 卡採旅程卡（journey）粒度，以 `scenario-id` 標識，供 user-story / test-case 反向引用某段端到端旅程。scenario 拆旅程卡 + 標 scenario-id。

- frontmatter `scenario-id` 格式：`SC-<主題 slug>-<NNN>`
- `<主題 slug>`：繁體中文主題詞（旅程主題，非模組代號；跨模組情境用主題分類比模組前綴更貼合）
- NNN 三位數字補零
- 檔名仍依「一般卡」規約（繁體中文名詞片語，如 `訂單異動流程.md`），`scenario-id` 在 frontmatter 標識，兩者分工：檔名給人讀、scenario-id 給連結指向的位置
- 範例 scenario-id：`SC-訂單異動-001`、`SC-諮詢取消-001`、`SC-退款折讓-001`

### 規則的連結指向位置命名（業務規則 / 共用規則，2026-05-31 補述）

> 商業規則卡內的「單條規則」以**業務語意命名的連結指向位置**標識，供 scenario / user-story / test-case 跨卡 wiki link 引用單條規則。撰寫規範見 `04-business-logic/_template-business-logic.md`。

- 規則的連結指向位置用**業務語意命名**（如 `#補收免審`、`#諮詢取消半額退費`），**不用流水號**（如 `#R1`）
- 理由：流水號重排 / 重用會讓連回來的連結斷掉；用業務語意命名時改規則只改內容、定位點不變，跨卡引用不斷鏈
- 引用方式：`[[<業務邏輯卡>#<業務語意定位點>]]`（如 `[[付款發票邏輯#補收免審]]`）
- 既有 `#R1` 等流水號定位點 MUST 一次性遷移為業務語意命名（遷移機制見 `wiki-amend` skill），遷移後由 vault-audit lint 偵測斷鏈兜底

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

- 簡短英文 kebab-case：`scope-boundary` / `wiki-schema` / `business-domain-taxonomy` / `changelog`
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
- ❌ 卡片 frontmatter 含外部系統狀態欄位（`notion-published-at` / `notion-page-url` 等——發布追蹤唯一正本在 `memory/erp/notion-publish-manifest.md`，見 § 四鐵則）

## 十、與其他規範的關係

| 規範 | 範圍 | 關係 |
|------|------|------|
| [[erp_index]] | 入口 + 架構概述 | 分層結構、連結方向的定義 |
| [[scope-boundary]] | Vault 收 / 不收 | scope-boundary 決定什麼進 Vault，本 schema 決定怎麼寫 |
| `04-business-logic/_template-business-logic.md` | 商業邏輯撰寫準則 | 撰寫流程、分類判斷、產出格式 |

## 十一、卡類型內容職責邊界（2026-05-28 新增）

> 各卡類型的「正文內容職責」。之前 schema 只規範 frontmatter（§ 四）+ user-story 內容（§ 六維度 13），其他卡類型正文無邊界 → business-logic / scenario 卡易混入 user-story 格式模板 / test-case 範本 / UI 措辭等越界內容（對應 [[audit-failure-patterns]] Scope creep 反模式）。維度 14 依本節 lint。

### 11.1 各卡類型內容職責

| 卡類型 | 正文該寫（職責內容）| 不該寫（越界內容）|
|-------|------------------|------------------|
| `service-blueprint` | 端到端業務鏈（流程階段 / 角色交接 / 決策分叉）| 規則細節（引用商業規則卡）/ user-story / test-case / 實作術語 |
| `business-rule` | 商業規則 / 領域知識 / 外部約束 | user-story 格式模板 / test-case 步驟範本 / UI 措辭 / 完整實體 Data Model / 欄位定義 / 計算公式 |
| `scenario` | 跨模組端到端情境（角色傳遞 / 狀態鏈）| user-story 格式模板 / test-case 範本 / 計價公式細節（屬 business-logic）|
| `entity` | 實體欄位 / 關聯 / 狀態 | 業務流程敘述（屬 business-logic / scenario）/ user-story |
| `role` | 角色職責 / 權限 / 工作流 / 痛點 | 跨角色流程細節（屬 scenario）/ 實體欄位定義 |
| `state-machine` | 狀態定義 / 轉換條件 / 觸發事件 | 業務情境敘述（屬 scenario）/ UI 措辭 |
| `user-story` | 業務情境（單階段：作為 / 我希望 / 以便 / Gherkin 成功條件）| 詳見 § 六維度 13；UI 操作不在此（歸 Prototype e2e）|

### 11.2 共通原則

- **產業務情境一律 cross-reference 而非複製模板**：business-logic / scenario 卡若要說明「如何產業務情境」，MUST 指向 [[_template-business-scenario]]（業務情境範本），**禁複製格式模板進卡**；[[user-story-spec]] 為歷史方法論（業務情境範本已吸收 INVEST / 禁 anchor / 中英夾雜紀律）
- **越界內容移到對應卡類型**：發現越界內容時移到該內容職責所屬的卡類型（如實體 Data Model 從 business-logic 移到 entity）
- **cross-reference 用 wiki link / skill 名稱**，不複製內容（避免雙份維護 + 防止 AI 拿自己寫的東西當依據再生內容）
