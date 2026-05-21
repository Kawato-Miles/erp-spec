---
type: meta
status: active
last-reviewed: 2026-05-21
---

# Wiki Schema（Formal）

> Vault 治理規則的**正式版**。`vault-audit` skill 依此 schema 執行 lint。
> 取代 `editing-conventions.md` 的分散規則（editing-conventions 仍保留為「人類友善版」摘要）。

## 一、type Enum（必填）

| type | 用途 | 對應目錄 |
|------|------|---------|
| `meta` | Vault 元數據（章程 / 入口 / 規約 / 邊界 / 流程 / log） | `00-meta/` |
| `product-vision` | 產品願景 / 痛點 / 利害關係人 | `01-products/` |
| `phase` | 產品 Phase 定義 | `01-products/erp/phases.md` |
| `metric` | KPI / 北極星指標 / Impact Score | `01-products/erp/`、`01-products/erp/kpi/` |
| `domain` | 印刷業 domain knowledge | `02-domain/` |
| `glossary` | 術語表 | `02-domain/glossary-*.md` |
| `role` | 角色 R&R | `03-roles/` |
| `business-logic` | 商業邏輯卡（業務規則）| `04-business-logic/` |
| `entity` | 資料模型實體 | `05-entities/` |
| `state-machine` | 狀態機 | `06-state-machines/` |
| `scenario` | 跨模組情境 | `07-scenarios/` |
| `open-question` | OQ 卡 | `08-open-questions/` |
| `canvas-ref` | Canvas 對應的 markdown 描述 | `09-canvases/` |
| `reference` | 外部連結索引 | `10-references/` |
| `insight` | vault-insight 產出 | `12-insights/` |
| `raw` | Raw 素材（已驗證的觀察 / 反饋 / 研究筆記，未精練）| `raw/` |

## 二、module Enum（多選）

```yaml
module:
  - quote-request | order-management | consultation-request | after-sales-ticket
  - work-order | production-task | prepress-review | qc
  - material-master | process-master | binding-master
  - graphic-editor          # 圖編產品
  - cross-module            # 跨模組（狀態機 / 商業流程 / 業務情境 / 使用者角色）
```

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
related-spec: openspec/specs/user-roles/spec.md  # 若 OpenSpec 有
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
related-spec: openspec/specs/<模組>/spec.md  # 若 OpenSpec 有
related-prototype: sens-erp-prototype/src/types/<...>.ts  # 若 Prototype 有
status: active
last-reviewed: YYYY-MM-DD
---
```

### type=entity

```yaml
---
type: entity
module:
  - <模組>
related-spec: openspec/specs/<模組>/spec.md
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
related-spec: openspec/specs/state-machines/spec.md
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
related-spec: openspec/specs/business-scenarios/spec.md
related-notion: <Notion 業務情境 DB 連結>
status: active
last-reviewed: YYYY-MM-DD
---
```

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

**Anti-Model-Collapse 規約**：
- `claude-self-capture` 必須 Miles 確認才寫入
- `claude-research` 必須附真實 raw-source-link，無來源不寫
- `miles-upload` 必須附真實 raw-source-link（原始檔出處）+ 原檔搬進 `raw/_attachments/<檔名>` + 在 `attached-files` 列出
- raw 卡是「已驗證素材的歸檔」，不是 LLM 自編內容的暫存區

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
| `raw/` | `raw` / `meta`（`README.md` / `_template.md`）|
| `raw/_attachments/` | 任意檔（PDF / 圖 / docx / 訪談錄音轉文字等）；不需 frontmatter |

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

## 七、命名規約

### 一般卡

- 繁體中文檔名，名詞 / 名詞片語
- 不用動詞、不用問號 / 驚嘆號

### OQ 卡

- 格式：`<MODULE>-<NNN>-<簡述 slug>.md`
- MODULE 前綴：QR / ORD / WO / PI / PT / QC / SHP / CR / AS / XM
- NNN 三位數字補零

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
- ❌ Wiki link 到不存在的卡（dangling）
- ❌ orphan 卡（除 README / index 性質）

## 十、與其他規範的關係

| 規範 | 範圍 | 關係 |
|------|------|------|
| `editing-conventions.md` | 人類友善版規約 | 本 schema 的精簡版，方便閱讀 |
| `scope-boundary.md` | Vault 收 / 不收 | 與本 schema 配合：scope-boundary 決定什麼進 Vault，本 schema 決定怎麼寫 |
| `vault-charter.md` | KM 章程 | 本 schema 是 charter § 編輯規約 的展開 |
| `sync-workflow.md` | 三邊同步流程 | 本 schema 不涉及 sync，sync 由 sync-workflow 處理 |
