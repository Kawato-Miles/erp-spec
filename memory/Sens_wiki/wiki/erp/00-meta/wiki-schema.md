---
type: meta
status: active
last-reviewed: 2026-07-29
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
| `service-blueprint` | 服務藍圖（公司提供什麼服務、商業行為的邊界） | `04-business-logic/服務藍圖/` |
| `business-rule` | 商業規則（決策邏輯、領域知識、外部約束） | `04-business-logic/` 各子目錄 |
| `entity` | 資料模型實體 | `05-entities/` |
| `state-machine` | 狀態機 | `06-state-machines/` |
| `scenario` | 業務情境（目標完成過程；接力型／能力型／排程型） | `07-scenarios/` |
| `open-question` | OQ 卡 | `08-open-questions/` |
| `canvas-ref` | Canvas 對應的 markdown 描述 | `09-canvases/` |
| `reference` | 外部連結索引 | `10-references/` |
| `insight` | vault-insight 產出 | `12-insights/` |
| `raw` | Raw 素材（已驗證的觀察 / 反饋 / 研究筆記，未精練）| `raw/` |

**分層與 type 的對應**（對齊 [[erp_index]] § 一架構概述）：

| 分層 | 對應 type | 對應目錄 |
|------|----------|---------|
| 產品策略 | `product-vision` / `phase` / `metric` | `01-products/` |
| 商業邏輯 | `service-blueprint`（服務藍圖）/ `business-rule`（商業規則） | `04-business-logic/` |
| 狀態 / 角色 / 資料 | `state-machine` / `role` / `entity` | `06` / `03` / `05` |
| 業務情境（過程） | `scenario` | `07-scenarios/` |

> 產品策略（`01-products/`）定商業方向，本 schema 屬文件管理層（`type=meta`）。架構概述見 [[erp_index]] § 一。

## 二、module Enum（多選）

> 2026-06-10 起 module 值改用繁體中文。舊卡的英文 token 隨各卡被異動時逐步統一，新卡一律用中文值。

```yaml
module:
  - 需求單 | 訂單管理 | 諮詢單 | 售後服務
  - 工單 | 生產任務 | 印前審稿 | 品檢
  - 材料主檔 | 製程主檔 | 裝訂主檔
  - 線上編輯器                    # 線上編輯器產品
  - 跨模組                  # 跨模組（狀態機 / 商業流程 / 業務情境 / 使用者角色）
```

**新舊值對照**（轉換期查表用）：需求單 = quote-request、訂單管理 = order-management、諮詢單 = consultation-request、售後服務 = after-sales-ticket、工單 = work-order、生產任務 = production-task、印前審稿 = prepress-review、品檢 = qc、材料主檔 = material-master、製程主檔 = process-master、裝訂主檔 = binding-master、線上編輯器 = graphic-editor、跨模組 = cross-module。

## 二B、領域 tag（`tags:` 欄位，必填）

> 業務領域分類，enum 正本、標注規則、檢索規約皆在 [[business-domain-taxonomy]]，本節只定 frontmatter 格式，不複寫判定規則。

```yaml
tags:
  - 領域/售前          # 值域 = 六領域（售前 / 訂單管理 / 印前審稿 / 生產執行 / 履約與售後 / 款項與發票）+ 全域哨兵
  - 領域/款項與發票    # 可多值：卡片沾幾個領域標幾個；全沾的極少數卡標 領域/全域
```

- tag 值 MUST 逐字命中 [[business-domain-taxonomy]] enum，禁自創值。
- 領域判定（觸發詞 + 邊界裁定）與必標範圍見 [[business-domain-taxonomy]] § 領域 tag 標注規則。
- lint：缺 tag / 值不在 enum / 濫標 `領域/全域`（實際只沾一兩個領域）皆為 Error。

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

> 本節的 yaml 區塊是**欄位定義與值域的正本**；可複製的起手樣板由 `wiki/範本/` 骨架卡承載。兩者重疊處以本節為準，骨架異動時與本節同 commit 對齊（治理見 [[卡片撰寫共用規範]] § 一）。
> **鐵則：卡片 frontmatter 禁含外部系統狀態欄位**（2026-06-10 新增）。「這張卡何時被推到哪個外部系統」是發布管線的狀態，不是商業知識——對外發布追蹤（Notion URL / 最後推送日）唯一正本在 `memory/erp/notion-publish-manifest.md`，由發布類 skill 維護，全程不回寫 wiki 卡。性質同「source 禁指 OpenSpec」：wiki 獨立維護，不與外部系統耦合。

### 4.0 往上指依據、往下指實作的通則（2026-05-31 新增）

> 對齊 [[erp_index]] § 一連結方向。所有承載商業邏輯的卡（`business-rule` / `service-blueprint` / `entity` / `state-machine` / `scenario` / `role`）採「往上 `source`」單欄連結，整張圖的連結不會繞回自己。這些卡型一律**不設 `module` / `implemented-by` / `related-spec`**——與實作模組／實作文件的對應屬 PRD 層，wiki 不承載；領域歸屬由 `tags`（`領域/<領域名>`）承載。

| 欄位 | 方向 | 用途 | 指向對象 | 硬規則 |
|------|------|------|---------|--------|
| `source` | 往**上層**（更上層）| **正確性根據**（這張卡為什麼對 → 上層卡授權）| 更上層的 Vault 卡（營運原則 / 共用規則 / 業務規則 / 流程狀態角色資料 / 操作步驟），或最上層的依據（法規 / 客戶訪談 / 產業慣例；管理層決策本身不留卡上，脈絡歸 log 與 OQ）| **禁指 OpenSpec spec**（OpenSpec 是實作規格，不是正確性來源，方向顛倒）；**禁指同層卡**（平行卡不互為正確性根據，容易繞回自己）；**禁指下層卡**（下層不授權上層）|

- `source` 的「往上指更上層」原則，使依據鏈終止於最上層的依據（法規／訪談／產業慣例），不在 Vault 內部繞回自己；管理層決策不寫進 source，脈絡由 log 與 OQ 承載。
- 連結不繞回自己由 § 六維度 15 lint 把關（`source` 鏈繞回自己報 Error、`source` 指向 OpenSpec 報 Error）。

### type=meta

```yaml
---
type: meta
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=example（凍結範例卡）

```yaml
---
title: "範例 - <單元名>"
type: example
example-of: <entity|role|state-machine|scenario|...>   # 對應單元的 type
snapshot-source: "[[<快照來源卡>]]"
synced-with-template: YYYY-MM-DD   # 最後與規範同步日，不得早於對應 _template 規範檔的最後實質修改
status: active
last-reviewed: YYYY-MM-DD
---
```

- 定位與治理鐵則見 [[卡片撰寫共用規範]] § 一：凍結快照非正本、與骨架／規範同 commit 更新、豁免孤島與 frontmatter 完整性 lint、不受所屬目錄語意鐵則約束。

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

### type=glossary

```yaml
---
type: glossary
module:
  - <ERP|線上編輯器|跨產品>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=role

```yaml
---
type: role
source:                          # 往上層 = 正確性根據（營運原則 / 商業流程共用規則 / 權責表），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡或最上層依據>]]"
related-notion: <Notion 核心角色權責 DB 連結>
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=service-blueprint

```yaml
---
type: service-blueprint
tags:
  - 領域/<領域名>   # 可多值；判定依 [[business-domain-taxonomy]]
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=business-rule

```yaml
---
type: business-rule
mutability: external | domain | internal  # 可變性：external=外部約束 / domain=領域知識 / internal=營運規則
tags:
  - 領域/<領域名>   # 可多值；判定依 [[business-domain-taxonomy]]
source:
  - "<依據來源：產業慣例 / 法規 / 客戶訪談 / 上層商業規則卡>"
status: active
last-reviewed: YYYY-MM-DD
---
```

**商業規則的三種可變性（`mutability`）**——與 `service-blueprint` 合計為商業邏輯層四型，一型一骨架，歸類決策樹與互斥判定句見 `04-business-logic/規範 - 商業邏輯.md` § 二：

| `mutability` | 意義 | 子目錄 | 誰能改 |
|---|---|---|---|
| `external` | 外部約束（法規 / 第三方規格） | `外部約束/` | 只有外部來源變更時 |
| `domain` | 領域知識（產業事實） | `領域知識/` | 產業本身改變時（極少） |
| `internal` | 營運規則（公司決策） | `營運規則/` | 訪談、管理層拍板可改 |

撰寫流程與產出格式詳見 `04-business-logic/規範 - 商業邏輯.md`。

### type=entity

```yaml
---
type: entity
source:                          # 往上層 = 正確性根據（所屬 business-logic 規則 / 流程狀態角色資料層情境），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=state-machine

```yaml
---
type: state-machine
source:                          # 往上層 = 正確性根據（所屬 business-logic 規則 / 流程狀態角色資料層情境），禁指 OpenSpec / 同層 / 下層；見 § 4.0
  - "[[<上層卡>]]"
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=scenario

```yaml
---
type: scenario
variant: 接力型 | 能力型 | 排程型      # 必填；判定見 07-scenarios/規範 - 業務情境.md § 二
tags:
  - 領域/<領域名>   # 可多值；判定依 [[business-domain-taxonomy]]
source:                          # 往上層 = 正確性根據（服務藍圖 / business-logic 規則 / 拍板 OQ / 外部依據），禁指 OpenSpec / 同層 / 下層；狀態機卡僅得並列為參考資料，不得為唯一來源
  - "[[<藍圖或規則卡>]]"
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
tags:
  - 領域/<領域名>   # 必填，可多值；oq-manage mode A 依領域 tag 查佇列
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
  - "[[<相關 OQ 全檔名>]]"   # 禁別名、禁短名
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
tags:
  - 領域/<領域名>   # insight 屬正本卡被載入決策引用時必標
status: open | in-progress | resolved | cancelled
priority: high | medium | low
raised-at: YYYY-MM-DD
raised-by: vault-insight skill
triggered-by: manual | oq-accumulation | phase | change-archive | audit | raw
related-vault:
  - <wiki link>
related-oq:
  - "[[<相關 OQ 全檔名>]]"   # 禁別名、禁短名
related-raw:                  # vault-insight 從 raw 素材累積識別 pattern 時填
  - "[[raw/<檔名>]]"          # MUST 是 status=ingested 或 reviewed 的卡（vault-ingest 防線 4）
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

## 五、目錄允許 Page-Type 規約

| 目錄 | 允許 type |
|------|----------|
| `00-meta/` | `meta` |
| `01-products/` | `product-vision` / `phase` / `metric` |
| `02-domain/` | `domain` / `glossary` |
| `03-roles/` | `role` / `meta`（`_alignment-report.md`／`規範 - 角色.md`）/ `example`（`範例 - 角色.md`）|
| `04-business-logic/` | `service-blueprint` / `business-rule` / `meta`（`規範 - 商業邏輯.md`）/ `example`（`範例 - 服務藍圖.md`／`範例 - 商業規則.md`）|
| `05-entities/` | `entity` / `meta`（`規範 - 實體.md`）/ `example`（`範例 - 實體.md`）|
| `06-state-machines/` | `state-machine` / `meta`（`規範 - 狀態機.md`）/ `example`（`範例 - 狀態機.md`）|
| `wiki/範本/`（vault 層，跨主題） | 骨架檔（內容為填空 frontmatter 樣板，豁免本 schema 檢查；見 [[卡片撰寫共用規範]] § 一）|
| `07-scenarios/` | `scenario`（業務情境）/ `meta`（`規範 - 業務情境.md` 等）/ `example`（`範例 - 業務情境.md`）|
| `08-open-questions/` | `open-question` / `meta`（`OQ運作總覽.md`／`規範 - OQ.md`）/ `example`（`範例 - OQ.md`）|
| `09-canvases/` | `.canvas` 檔（無 frontmatter）/ `canvas-ref` |
| `10-references/` | `reference` |
| `12-insights/` | `insight` / `meta`（`insight定位說明.md`）/ `example`（`範例 - Insight.md`）|
| `raw/` | `raw` / `meta`（`README.md`）|
| `raw/_attachments/` | 任意檔（PDF / 圖 / docx / 訪談錄音轉文字等）；不需 frontmatter |

## 六、Lint 規則

**Lint 維度定義的正本在 `.claude/skills/vault-audit/SKILL.md`**（12 維度：編號、檢查方法、判定門檻、三層結構豁免），本節不重複維度清單——兩處並存曾造成維度編號分裂與豁免漏列。

本 schema 承載 lint 所依據的**定義層**：type 與 status 值域（§ 一、§ 三）、領域 tag（§ 二B）、各 type 欄位定義（§ 四，含 § 4.0 依據鏈方向與「不繞回自己」）、目錄允許 type（§ 五）、命名規約（§ 七）、wiki link 規約（§ 八）、Anti-Pattern（§ 九）、內容職責邊界（§ 十一）。vault-audit 依這些定義判定，schema 異動時同輪檢查 skill 是否需同步。

## 七、命名規約

### 一般卡

- 繁體中文檔名，名詞 / 名詞片語
- 不用動詞、不用問號 / 驚嘆號

### OQ 卡

- 格式：`<前綴>-<NNN>-<簡述>.md`；NNN 三位補零，取號平層與 `_archives/` 一起算、永不重用
- **前綴＝議題的英文縮寫**（2-3 大寫字母），enum 正本在此，oq-manage 取號時比對本表：

| 前綴 | 議題 | 前綴 | 議題 |
|------|------|------|------|
| QR | 需求單（quote request）| CR | 諮詢（consultation request）|
| ORD | 訂單（order）| AFT | 售後（after-sales）|
| WO | 工單（work order）| AR | 審稿（artwork review）|
| PI | 印件（print item）| BI | 帳務（billing）|
| PT | 生產階段規劃（production）| XM | 跨模組與 vault 治理（cross-module）|
| QC | 品檢 | SHP | 出貨（shipping）|

- **新前綴的產生**：議題無可歸屬的既有前綴時，取議題英文名縮寫，**先增列本表再開卡**（enum 外前綴視為違規，vault-audit 維度 8 抓）

### 規則的連結指向位置命名（業務規則 / 共用規則，2026-05-31 補述）

> 商業規則卡內的「單條規則」以**業務語意命名的連結指向位置**標識，供 scenario 等下游卡跨卡 wiki link 引用單條規則。撰寫規範見 `04-business-logic/規範 - 商業邏輯.md`。

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

### 範本與範例卡（三層結構）

- 骨架：`範本 - <單元名>.md`，一律置 `wiki/範本/`
- 範例：`範例 - <單元名>.md`，置所屬單元資料夾
- 單元名用繁中（實體／角色／狀態機／業務情境／服務藍圖／商業規則），既定技術 token 例外（OQ／Insight／Raw 素材）

### Meta 卡（00-meta）

- 簡短英文 kebab-case：`scope-boundary` / `wiki-schema` / `business-domain-taxonomy` / `changelog`
- README 例外：`README.md`

## 八、Wiki Link 規約

- 內部連結：`[[節點名]]`、`[[節點名#段落]]`；**禁用別名**（`[[節點名|顯示文字]]` 的 `|` 會截斷表格儲存格且易斷鏈），補充說明寫在連結外
- 連 OpenSpec / Prototype：用相對路徑 markdown link（如 `[spec.md](../../../openspec/specs/xxx/spec.md)`）
- **禁止 wiki link 到 vault 外**（Obsidian 不解析）

## 九、Anti-Pattern（vault-audit Error 級）

- ❌ Vault 卡用 `> [!question]` callout
- ❌ Inline OQ 措辭（「待確認」「待釐清」等）卻不開 OQ 卡
- ❌ 缺必填 frontmatter
- ❌ 命名不合規約
- ❌ Wiki link 連到不存在的卡（dangling）
- ❌ 沒有任何卡連到它的孤島卡（orphan，除 README / index 性質）
- ❌ `source` 鏈繞回自己（違反連結不繞回自己，見 § 六維度 15）
- ❌ `source` 指向 OpenSpec spec 路徑（方向顛倒，應改指上層 Vault 卡或最上層依據）
- ❌ 卡片 frontmatter 含外部系統狀態欄位（`notion-published-at` / `notion-page-url` 等——發布追蹤唯一正本在 `memory/erp/notion-publish-manifest.md`，見 § 四鐵則）

## 十、與其他規範的關係

| 規範 | 範圍 | 關係 |
|------|------|------|
| [[erp_index]] | 入口 + 架構概述 | 分層結構、連結方向的定義 |
| [[scope-boundary]] | Vault 收 / 不收 | scope-boundary 決定什麼進 Vault，本 schema 決定怎麼寫 |
| [[卡片撰寫共用規範]] | 三層結構治理＋共用撰寫流程／停下鐵則／紀律 | 本 schema 管欄位定義，共用規範管撰寫治理 |
| 各單元規範 `規範 - <單元名>`（實體／角色／狀態機／業務情境／商業邏輯） | 該單元撰寫規則與稽核維度 | 產出格式、判斷表、稽核維度的單元正本 |
| `wiki/範本/` 骨架卡（範本 - <單元名>） | 寫新卡的起手樣板 | 樣板層；欄位定義與值域以本 schema § 四為準 |
| 各資料夾範例卡（範例 - <單元名>） | 合規凍結快照 | 稽核通過樣本，治理見 [[卡片撰寫共用規範]] § 一 |
| `.claude/skills/vault-audit/SKILL.md` | 12 維度 lint 定義 | 本 schema 提供定義層，skill 提供檢查與判定（§ 六） |

## 十一、卡類型內容職責邊界（2026-05-28 新增）

> 各卡類型的「正文內容職責」邊界，防止越界內容混入（對應 [[audit-failure-patterns]] Scope creep 反模式）。vault-audit 維度 12（撰寫規範勾稽）依各單元規範的不收清單 lint，本節是跨類型總覽。

### 11.1 各卡類型內容職責

| 卡類型 | 正文該寫（職責內容）| 不該寫（越界內容）|
|-------|------------------|------------------|
| `service-blueprint` | 端到端業務鏈（流程階段 / 角色交接 / 決策分叉）| 規則細節（引用商業規則卡）/ 實作術語 |
| `business-rule` | 商業規則 / 領域知識 / 外部約束 | 情境格式模板 / UI 措辭 / 完整實體 Data Model / 欄位定義 |
| `scenario` | 跨模組端到端情境（角色傳遞 / 狀態鏈）| 計價公式細節（屬 business-logic）/ UI 措辭（歸 Prototype）|
| `entity` | 實體欄位 / 關聯 / 狀態 | 業務流程敘述（屬 business-logic / scenario）|
| `role` | 角色職責 / 權限 / 工作流 / 痛點 | 跨角色流程細節（屬 scenario）/ 實體欄位定義 |
| `state-machine` | 狀態定義 / 轉換條件 / 觸發事件 | 業務情境敘述（屬 scenario）/ UI 措辭 |

### 11.2 共通原則

- **產業務情境一律 cross-reference 而非複製模板**：business-logic / scenario 卡若要說明「如何產業務情境」，MUST 指向 [[規範 - 業務情境]]（業務情境撰寫規範），**禁把範本格式說明複製進內容卡正文**（「寫新卡從 `wiki/範本/` 骨架複製起手填寫」屬正常撰寫流程，不在此禁令內）
- **越界內容移到對應卡類型**：發現越界內容時移到該內容職責所屬的卡類型（如實體 Data Model 從 business-logic 移到 entity）
- **cross-reference 用 wiki link / skill 名稱**，不複製內容（避免雙份維護 + 防止 AI 拿自己寫的東西當依據再生內容）
