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
| 營運原則（最高層）（分權方向，不可驗算、Miles 拍板）| `01-products/erp/` | [[operating-principles]]（type=product-vision，沿用既有 type 不新增；如「現金流出須把關、客戶加單不阻擋」「彈性優先、事後對帳兜底」）|
| 商業目標 / Phase / 北極星指標 | `01-products/` | [[wiki/erp/01-products/erp/product-vision]]、[[phases]]、[[success-metrics]] |
| 痛點 / 利害關係人 / Impact Score | 同上 | [[pain-points]]、[[stakeholders]]、[[impact-score-framework]] |
| 印刷業 domain | `02-domain/` | [[printing-industry]]、glossary 三份 |
| 角色 R&R | `03-roles/` | 16 角色 + [[_alignment-report]] |
| 商業邏輯：共用規則卡（這個領域所有規則都一定要遵守的底線，可驗算）| `04-business-logic/` | 對帳一致性「應收 ＝ 發票淨額 ＝ 收款淨額」等共用規則卡（帶實例階段建）|
| 商業邏輯：業務規則卡（具體 if-then 規則 / 計算邏輯）| `04-business-logic/` | [[齊套邏輯]]、[[數量換算規則]]、[[付款發票邏輯]] 等 |
| 資料模型實體與欄位 | `05-entities/` | 10 個實體卡 |
| 狀態機 | `06-state-machines/` | 9 個狀態機卡 |
| 跨模組情境 | `07-scenarios/` | 13 個情境 |
| OQ | `08-open-questions/` | oq-manage skill 改寫後寫入 |
| User Story（操作步驟）| `13-user-stories/` | 各模組業務故事（兩階段：業務情境 / UI 操作）|
| Test Case（驗收項目，**限 UAT 業務層**）| `15-test-cases/` | UAT 驗收索引卡：角色 / 前置 / 業務動作 / 可觀察結果；正文存 Notion ERP Test Case DB、Vault 僅承載索引與依據（source 往上指 user-story）。**技術 SIT / UT / 端對端測試（Playwright e2e）不收、留 Prototype** |
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

### 技術層測試（SIT / UT / 端對端 e2e）

> Vault Test Case（`15-test-cases/`）**只收 UAT 業務層驗收項目**（角色 / 前置 / 業務動作 / 可觀察結果，業務驗收視角）。以下技術層測試屬實作層，留 Prototype，不進 Vault：

| 屬於 | 位置 |
|------|------|
| 端對端測試（Playwright e2e）含 UI 點擊步驟 / DOM 斷言 / console.error 斷言 | `sens-erp-prototype/tests/e2e/*.spec.ts` |
| 單元測試（UT）/ 系統整合測試（SIT） | Prototype 測試碼 |
| 含技術步驟的測試腳本（點某按鈕 → 斷言某 DOM 節點 → 檢查某 store 狀態） | 同上 |

→ 界線判準：測試以「業務動作 + 可觀察業務結果」描述（如「業務發起補收 6000 → 應收由 1000 變 7000、未產生待主管審核項」）= UAT 業務層，進 `15-test-cases/`（索引卡，正文存 Notion）；測試以「UI 點擊步驟 + 技術斷言」描述（如「點訂單詳情頁 → 按新增異動 → 斷言 DOM 出現 toast」）= 技術層，留 Prototype e2e。同一驗收點可在兩層各有一筆（業務層驗收項目卡 + 技術層 e2e），透過 `implemented-by`（往下指被誰實作）從驗收項目卡往下連 e2e。

### 功能 step-by-step Requirement

| 屬於 | 位置 |
|------|------|
| 模組功能 Requirement | OpenSpec 各模組 `spec.md § Requirements` |
| change workflow（proposal / design / tasks） | OpenSpec changes/ |
| delta spec / archive | OpenSpec |

→ 與「收 UAT Test Case」不衝突：step-by-step Requirement 是**實作步驟視角**（功能該怎麼被做出來、含實作分解），屬 OpenSpec；UAT Test Case 是**業務驗收視角**（給定業務輸入是否得到正確的可觀察業務結果），屬 Vault `15-test-cases/`。兩者描述對象不同層——前者答「怎麼實作」、後者答「業務驗收過了沒」。UAT Test Case 的測試步驟寫**業務動作**（非 UI 點擊、非實作分解），故不落入此「step-by-step Requirement」禁區；驗收項目卡正文存 Notion，並以 `implemented-by` 往下指對應 OpenSpec Requirement 標題層（只是導航、不作為這條規則正不正確的依據）。

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
| 這是「UAT 業務層驗收」（角色 / 前置 / 業務動作 / 可觀察業務結果）？ | 是 | 進 Vault `15-test-cases/`（索引卡，正文存 Notion；source 往上指 user-story）|
| 這是「技術層測試」（UI 點擊步驟 / DOM 斷言 / SIT / UT / e2e）？ | 是 | 留 Prototype（`tests/e2e/*.spec.ts` 等），不進 Vault |
| 這是「商業層的 WHAT/WHY」嗎？ | 是 | 進 Vault |
| 這是「實體間關聯 / 角色責任 / 狀態機規則」嗎？ | 是 | 進 Vault |
| 這是「未消化已驗證素材」（觀察 / 反饋 / 研究筆記）？ | 是 | 進 `raw/`（觸發 vault-ingest mode A） |
| 這是「明確未解問題」（不是觀察，是待回答的問題）？ | 是 | 進 OQ（不進 raw/，觸發 oq-manage mode B） |
| 這是「LLM 自己編出來的內容」（無真實外部來源）？ | 是 | **不進 raw/**（防止 AI 拿自己寫的東西當依據再生出新東西）|

## 四、典型違反案例（不要做）

| 不要做 | 為什麼 |
|--------|--------|
| 在 Vault 寫「按鈕按下後應彈出 modal」 | 這是 UI 規範，屬 DESIGN.md |
| 在 Vault 寫「report.passed_quantity = sum(QCRecord.passed)」 | 這是實作公式，屬程式碼 |
| 在 Vault 寫「step 1: 點工單清單；step 2: 點異動 ...」 | 這是功能 step Requirement，屬 OpenSpec |
| 把 `prepressReview.ts` 5 步驟演算法整段貼進 Vault | 實作細節，留程式碼 |
| 在 Vault test-case 寫「點訂單詳情頁 → 按新增異動 → 斷言 DOM 出現 toast」 | 這是技術層 e2e（UI 點擊 + DOM 斷言），屬 Prototype；Vault 驗收項目卡只寫業務動作與可觀察業務結果 |
| 把 Playwright e2e spec 完整步驟貼進 Vault `15-test-cases/` | 技術層測試，留 Prototype；Vault 僅以 `implemented-by`（往下指被誰實作）往下連 e2e |

## 五、相關卡

- [[vault-charter]] — 三邊分工原則
- [[editing-conventions]] — 編輯規約
- [[sync-workflow]] — 同步流程
- [[decks-index]] — decks/ 業務性內容入口
