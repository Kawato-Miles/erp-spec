---
type: meta
status: active
last-reviewed: 2026-05-19
---

# 編輯規約

> 新建或修改任何 Vault 卡前必讀。確保 frontmatter / wiki link / 檔名一致，否則 Graph view 與 backlinks 會失效。

## 一、Frontmatter Schema

每個 `.md` 檔頂部必含 YAML frontmatter，欄位如下：

```yaml
---
type: <類型>             # 必填，見下表
module: <模組>           # 多選，以 yaml 列表表示
related-spec: <相對路徑>  # 對應 OpenSpec spec（若有）
related-notion: <URL>    # 對應 Notion 頁面（若有）
related-prototype: <相對路徑>  # 對應 Prototype 檔案（若有）
status: draft | active | deprecated
last-reviewed: YYYY-MM-DD
---
```

### type 欄位允許值

| type | 用於 |
|------|------|
| `meta` | `00-meta/` 下的章程、規約、流程 |
| `product-vision` | `01-products/` 願景、痛點、利害關係人 |
| `phase` | `01-products/erp/phases.md`、各 Phase 拆分卡 |
| `metric` | KPI、北極星指標、Impact Score 框架 |
| `domain` | `02-domain/` 印刷業 domain |
| `glossary` | 術語表 |
| `role` | `03-roles/` 角色卡 |
| `business-logic` | `04-business-logic/` 商業邏輯卡 |
| `entity` | `05-entities/` 資料模型實體 |
| `state-machine` | `06-state-machines/` 狀態機卡 |
| `scenario` | `07-scenarios/` 跨模組情境 |
| `open-question` | `08-open-questions/` OQ 卡 |
| `canvas-ref` | `09-canvases/` 對應的 markdown 描述（若有） |
| `reference` | `10-references/` 外部連結索引 |

### module 欄位允許值

| module | 對應 OpenSpec spec |
|--------|---------------------|
| `quote-request` | 需求單 |
| `order-management` | 訂單管理 |
| `consultation-request` | 諮詢單 |
| `after-sales-ticket` | 售後服務 |
| `work-order` | 工單管理 |
| `production-task` | 生產任務 |
| `prepress-review` | 稿件審查 |
| `qc` | QC |
| `material-master` | 材料主檔 |
| `process-master` | 工序主檔 |
| `binding-master` | 裝訂主檔 |
| `cross-module` | 跨模組（狀態機 / 商業流程 / 業務情境 / 使用者角色） |

### 範例

```yaml
---
type: business-logic
module:
  - work-order
  - production-task
related-spec: openspec/specs/business-processes/spec.md
related-notion: https://www.notion.so/...
status: active
last-reviewed: 2026-05-19
---
```

## 二、Wiki Link 規則

- **內部連結**：一律使用 wiki link `[[節點名]]`，Obsidian 會自動處理重新命名
- **顯示文字不同時**：`[[節點名|顯示文字]]`
- **連到段落 heading**：`[[節點名#段落]]`
- **連到 block**：`[[節點名#^block-id]]`
- **同檔內 heading**：`[[#段落]]`
- **外部連結**：用標準 markdown `[文字](URL)`
- **連到 OpenSpec / Prototype 檔案**：用相對路徑 markdown link `[檔名](../../../openspec/specs/...)`，**不要用 wiki link**（Obsidian 不會解析 vault 外部）

## 三、檔名規約

- **語言**：繁體中文，避免英文（除非該術語在台灣業界本身就是英文，例：`BOM.md`、`SKU.md`）
- **詞性**：名詞或名詞片語，不用動詞
  - 正例：`齊套邏輯.md`、`訂單.md`、`審稿分配規則.md`
  - 反例：`如何審稿.md`、`計算齊套.md`
- **避免特殊字元**：不用 `/ \ : * ? " < > |`；連字符用全形 `／` 或英文 `-`
- **巢狀結構**：以目錄分層為主，不用 `模組_實體.md` 這種命名（用目錄路徑表達）
- **以底線開頭**：`_` 開頭的檔為元資料 / 索引（例：`03-roles/_alignment-report.md`），Obsidian 預設不排入主清單

## 四、Tag 命名

- 全形冒號 / 斜線：使用 `tags: [模組/quote-request, 狀態/active]`
- 在 frontmatter 中以 yaml 列表表示，不在內文用 `#tag`（避免 ERP 業務文件中文出現 `#字`）
- 主要 tag 類別：
  - `模組/<module>` — 對應 frontmatter module 欄位
  - `狀態/<status>` — 對應 frontmatter status 欄位
  - `Phase/<1|2|3>` — 對應產品 Phase
  - `來源/<notion|openspec|prototype|memory>` — 內容主要來源

## 五、Callout 使用

Obsidian Callout 用 GitHub Markdown 引用語法 + `[!type]`：

```markdown
> [!note] 標題
> 內容

> [!warning] 警告
> 內容

> [!info]
> 內容（無標題）
```

常用 type：`note` / `info` / `tip` / `warning` / `danger` / `example` / `quote` / `question` / `success` / `failure`

## 六、引用 OpenSpec / Notion / Prototype

於卡片內容中明確標註資料來源，便於追溯：

```markdown
## 來源

- OpenSpec：[business-processes/spec.md § 齊套性](../../openspec/specs/business-processes/spec.md#齊套性)
- Notion：[業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05)
- Prototype：`sens-erp-prototype/src/types/workOrder.ts` L54-57
```

## 七、不要做的事

- 不要把 OpenSpec spec 完整內容貼到 Vault（會雙重維護）→ 用 wiki link 或相對路徑連過去
- 不要在卡中寫 step-by-step 功能 Requirement（屬於 OpenSpec spec 範疇）
- 不要在卡中寫實作細節（演算法、計算公式、UI 規範）→ 留在程式碼或 DESIGN.md
- 不要為了避免重複而省略 frontmatter（即使是 1 行的卡也要有 frontmatter）
