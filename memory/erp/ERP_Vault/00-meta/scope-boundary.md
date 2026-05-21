---
type: meta
status: active
last-reviewed: 2026-05-21
---

# Vault Scope Boundary（收 / 不收）

> 明確定義 Vault 內容邊界。**避免 AI 把 UI 規範誤拉進 spec、避免實作層內容雙重維護**。

## 一、收（屬 Vault 範疇）

### 商業層內容

| 類別 | 對應目錄 | 範例 |
|------|---------|------|
| 商業目標 / Phase / 北極星指標 | `01-products/` | [[product-vision]]、[[phases]]、[[success-metrics]] |
| 痛點 / 利害關係人 / Impact Score | 同上 | [[pain-points]]、[[stakeholders]]、[[impact-score-framework]] |
| 印刷業 domain | `02-domain/` | [[printing-industry]]、glossary 三份 |
| 角色 R&R | `03-roles/` | 16 角色 + [[_alignment-report]] |
| 商業邏輯（業務規則） | `04-business-logic/` | [[齊套邏輯]]、[[數量換算規則]]、[[付款發票邏輯]] 等 |
| 資料模型實體與欄位 | `05-entities/` | 10 個實體卡 |
| 狀態機 | `06-state-machines/` | 9 個狀態機卡 |
| 跨模組情境 | `07-scenarios/` | 13 個情境 |
| OQ | `08-open-questions/` | oq-manage skill 改寫後寫入 |
| KPI | `01-products/erp/kpi/` | 各模組 KPI |
| 視覺化 | `09-canvases/` | 6 張 Canvas |
| 外部連結索引 | `10-references/` | Notion / OpenSpec / Prototype / decks |
| **Audit Log** | `00-meta/audit-log.md` | vault-audit / vault-insight skill 追加式日誌 |
| **Wiki Schema** | `00-meta/wiki-schema.md` | Vault formal 治理規則（lint 依據）|
| **Insights** | `12-insights/` | vault-insight skill 產出的跨主題模式識別 + 下一步建議 |
| **Raw 素材** | `raw/` | 已驗證但未精練的觀察 / 反饋 / 研究筆記（由 vault-ingest skill 寫入；2026-05-21 新增）|
| **Daily / Weekly Review** | `14-reviews/daily/`、`14-reviews/weekly/` | 每日進度回顧 + 今日建議；每週學到 / 完成 / 下週重點（由 daily-brief / weekly-review skill 寫入；2026-05-21 新增）|

### 收的判斷準則

- **WHAT**（這是什麼業務概念）
- **WHY**（為什麼這樣設計，業務背景與動機）
- **怎麼連**（實體 / 規則 / 角色之間的關聯）
- **未精練的已驗證素材**（觀察 / 反饋 / 研究筆記）：進 `raw/`，由 vault-ingest skill 寫入
- **時序回顧**（每日進度 / 每週學到）：進 `14-reviews/`，由 daily-brief / weekly-review skill 寫入

## 二、不收（屬其他層）

### UI 設計系統

| 屬於 | 位置 |
|------|------|
| 視覺規範（顏色 / 字型 / 元件 / layout） | `sens-erp-prototype/DESIGN.md`（**Prototype 唯一權威**）|
| 設計系統 token | 同上 |
| 元件清單 | 同上 |

### UI 業務規則（屬 Prototype）

| 屬於 | 位置 |
|------|------|
| 表格密度 / 批次操作 / 響應式 | `memory/shared/ui-business-rules.md` |
| 跨產品通用工作原則（Spec 撰寫 / OQ 管理 / PM 視角 / 迭代工作流） | `memory/shared/principles.md` § 一~五 |
| ERP 資料模型設計模式（指針模式 / 狀態碼結構化 / 合格終態 / B2C-B2B 分流 / 稽核鉤子）| **已遷入 Vault**：[[erp-design-patterns]]（2026-05-19）|
| 禁 Emoji / 詳情頁 Tab 順序 / Info Banner | `sens-erp-prototype/DESIGN.md` §0 |

### 演算法 / 實作細節

| 屬於 | 位置 |
|------|------|
| 自動分配演算法步驟（5 步驟） | `sens-erp-prototype/src/utils/prepressReview.ts` |
| 計算公式（齊套計算實作） | `sens-erp-prototype/src/utils/printItemStatus.ts` |
| 訂單計價公式 | `sens-erp-prototype/src/utils/orderPricing.ts` |
| 排程演算法 | `sens-erp-prototype/src/utils/scheduling.ts` |

### 功能 step-by-step Requirement

| 屬於 | 位置 |
|------|------|
| 模組功能 Requirement | OpenSpec 各模組 `spec.md § Requirements` |
| change workflow（proposal / design / tasks） | OpenSpec changes/ |
| delta spec / archive | OpenSpec |

### 過程決策評估

| 屬於 | 位置 |
|------|------|
| 設計方案比較 | `decks/after-sales-design-comparison.html` |
| Spec 撰寫過程的圖解 | `decks/` 其他過程圖解 |

→ decks/ 中**業務性內容**（流程圖、欄位對照、業務流程變更說明）會以連結形式進 Vault（見 [[decks-index]]），**非業務性的決策評估**留 decks 原處。

## 三、判斷準則對照表

當不確定某內容該不該進 Vault 時，依下表判斷：

| 問題 | 答 | 行動 |
|------|---|------|
| 這是「業務概念」還是「實作細節」？ | 業務概念 | 進 Vault |
| 這是「業務概念」還是「實作細節」？ | 實作細節 | 留程式碼 / 不進 |
| 這是「UI 規範」嗎？ | 是 | 留 Prototype DESIGN.md |
| 這是「演算法 / 計算公式」嗎？ | 是 | 留 src/utils/ |
| 這是「step-by-step 功能 Requirement」嗎？ | 是 | 留 OpenSpec spec |
| 這是「商業層的 WHAT/WHY」嗎？ | 是 | 進 Vault |
| 這是「實體間關聯 / 角色責任 / 狀態機規則」嗎？ | 是 | 進 Vault |
| 這是「未消化已驗證素材」（觀察 / 反饋 / 研究筆記）？ | 是 | 進 `raw/`（觸發 vault-ingest mode A） |
| 這是「明確未解問題」（不是觀察，是待回答的問題）？ | 是 | 進 OQ（不進 raw/，觸發 oq-manage mode B） |
| 這是「LLM 自己編出來的內容」（無真實外部來源）？ | 是 | **不進 raw/**（防 Model Collapse） |

## 四、典型違反案例（不要做）

| 不要做 | 為什麼 |
|--------|--------|
| 在 Vault 寫「按鈕按下後應彈出 modal」 | 這是 UI 規範，屬 DESIGN.md |
| 在 Vault 寫「report.passed_quantity = sum(QCRecord.passed)」 | 這是實作公式，屬程式碼 |
| 在 Vault 寫「step 1: 點工單清單；step 2: 點異動 ...」 | 這是功能 step Requirement，屬 OpenSpec |
| 把 `prepressReview.ts` 5 步驟演算法整段貼進 Vault | 實作細節，留程式碼 |

## 五、相關卡

- [[vault-charter]] — 三邊分工原則
- [[editing-conventions]] — 編輯規約
- [[sync-workflow]] — 同步流程
- [[decks-index]] — decks/ 業務性內容入口
