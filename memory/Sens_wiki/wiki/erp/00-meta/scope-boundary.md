---
type: meta
module: 跨模組
status: active
last-reviewed: 2026-07-28
---

# Vault Scope Boundary（收 / 不收）

> 明確定義 Vault 內容邊界。**避免 AI 把 UI 規範誤拉進 spec、避免實作層內容雙重維護**。

## 一、收（屬 Vault 範疇）

### 商業層內容

| 類別 | 對應目錄 | 範例 |
|------|---------|------|
| 公司北極星指標（跨專案、長期） | `01-products/` | [[北極星指標]] |
| 專案範疇與階段驗收指標（專案層，不進檢索範圍） | `01-products/` | [[ERP與MES建置專案]] |
| 專案要解決的痛點 | `01-products/` | [[痛點]] |
| 行業語言術語表（換家同業仍成立的詞彙） | `wiki/跨產品/` | [[印刷業共用術語表]]。ERP 各實體、狀態、規則的定義**不另立詞彙表**，以各正本卡的一句話定位段承載 |
| 角色 R&R | `03-roles/` | 全部角色卡 |
| 商業邏輯：服務藍圖（A 類，端到端業務鏈）| `04-business-logic/` | 線下訂單流程、諮詢服務流程等（`type: service-blueprint`）|
| 商業邏輯：商業規則（B 類，獨立決策邏輯 / 領域知識）| `04-business-logic/` | [[訂單異動規則]]、[[齊套邏輯]]、[[對帳一致性]] 等（`type: business-rule`）|
| 資料模型實體與欄位（**含業務欄位表正本**） | `05-entities/` | 實體卡；業務可見欄位表為正本（2026-06-09 從 OpenSpec Data Model 遷入） |
| 狀態機（**含狀態列舉正本**） | `06-state-machines/` | 狀態機卡；狀態列舉為正本 |
| 業務情境（過程）| `07-scenarios/` | 業務目標完成過程 |
| OQ | `08-open-questions/` | oq-manage skill 改寫後寫入 |
| 營運指標 / 模組級 KPI | `04-business-logic/` | 各領域指標卡（如 [[生產績效指標]]），算法正本隨領域走不集中放產品層 |
| 視覺化 | `09-canvases/` | Canvas 視覺化 |
| **操作史** | `wiki/log.md` | 全知識庫唯一只追加層（[[log]]）；健檢／納入類條目皆記於此 |
| **Wiki Schema** | `00-meta/wiki-schema.md` | Vault formal 治理規則（lint 依據）|
| **Raw 素材** | `raw/` | 已驗證但未精練的觀察 / 反饋 / 研究筆記（由 vault-ingest skill 寫入；2026-05-21 新增）。設計討論的收斂記錄（架構整合、現況比對、缺口報告）也歸此層——它們是素材，規則與欄位的正本在 04／05／06 各卡 |

### 收的判斷準則

- **WHAT**（這是什麼業務概念）
- **WHY**（為什麼這樣設計，業務背景與動機）
- **怎麼連**（實體 / 規則 / 角色之間的關聯）
- **未精練的已驗證素材**（觀察 / 反饋 / 研究筆記）：進 `raw/`，由 vault-ingest skill 寫入

### ERP / MES 邊界（工廠現場）

ERP 的管轄範圍到「派工指令送到工廠」和「師傅回報完工」。以下屬工廠內部作業，不在 ERP 範圍：

| 不收（工廠現場） | 說明 |
|----------------|------|
| 機台操作（上機、換模、調色） | 工廠內部製程執行 |
| 工廠內部排程（機台排隊、插單調序） | 工廠自行安排 |

以下屬 ERP 範圍：

| 收（ERP 管轄） | 說明 |
|---------------|------|
| 派工指令 | ERP 發出工單派工 |
| 領料（材料出庫） | 系統記錄 |
| 師傅報工（回報完工） | 系統記錄 |
| 轉交（製作完成項目移動到品檢區） | 系統記錄 |
| 品檢（半成品 QC + 成品品檢） | 系統記錄 |

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
| ERP 資料模型設計模式（指針模式 / 狀態碼結構化 / 合格終態 / B2C-B2B 分流 / 稽核鉤子）| 原承載卡已隨舊三 agent 審查體系刪除（2026-08-05）；設計比對基準由 [[規劃品質評分準則]] 5-4 業界範式對照承接 |
| 禁 Emoji / 詳情頁 Tab 順序 / Info Banner | `sens-erp-prototype/DESIGN.md` §0 |

### 演算法 / 實作細節

| 屬於 | 位置 |
|------|------|
| 自動分配演算法步驟（5 步驟） | `sens-erp-prototype/src/utils/prepressReview.ts` |
| 計算公式（齊套計算實作） | `sens-erp-prototype/src/utils/printItemStatus.ts` |
| 訂單計價公式 | `sens-erp-prototype/src/utils/orderPricing.ts` |
| 排程演算法 | `sens-erp-prototype/src/utils/scheduling.ts` |

### 驗收測試（UAT / SIT / UT / 端對端 e2e）

> 驗收知識的正本＝業務情境卡（`07-scenarios/`）的判準與下游規格 Scenario（OpenSpec 各模組 spec § Scenarios）。驗收執行（測試案例本身）屬下游產物，**不進 Vault**：

| 屬於 | 位置 |
|------|------|
| 端對端測試（Playwright e2e）含 UI 點擊步驟 / DOM 斷言 / console.error 斷言 | `sens-erp-prototype/tests/e2e/*.spec.ts` |
| 單元測試（UT）/ 系統整合測試（SIT） | Prototype 測試碼 |
| 含技術步驟的測試腳本（點某按鈕 → 斷言某 DOM 節點 → 檢查某 store 狀態） | 同上 |

→ 界線判準：業務「在什麼前置下做什麼動作、應看到什麼可觀察結果」的判準＝驗收知識，由業務情境卡承載判準、下游規格以 Scenario（Given/When/Then）定行為契約；至於把這些判準寫成可執行的測試案例（無論 UAT、SIT、UT 或 e2e），屬下游驗收執行產物，留 Prototype，不進 Vault。

### 功能 step-by-step Requirement

| 屬於 | 位置 |
|------|------|
| 模組功能 Requirement | OpenSpec 各模組 `spec.md § Requirements` |
| change workflow（proposal / design / tasks） | OpenSpec changes/ |
| delta spec / archive | OpenSpec |
| **Data Model 技術欄位備忘**（id / FK / 時間戳記） | OpenSpec 各模組 spec § Data Model（**業務欄位正本已遷至 wiki 實體卡，此處僅保留技術參照**） |

→ 與驗收知識不衝突：step-by-step Requirement 是**實作步驟視角**（功能該怎麼被做出來、含實作分解），屬 OpenSpec；業務驗收知識是**業務驗收視角**（給定業務輸入是否得到正確的可觀察業務結果），由業務情境卡判準與下游規格 Scenario 承載。兩者描述對象不同層——前者答「怎麼實作」、後者答「業務驗收過了沒」。

### 過程決策評估

| 屬於 | 位置 |
|------|------|
| 設計方案比較 | `decks/after-sales-design-comparison.html` |
| Spec 撰寫過程的圖解 | `decks/` 其他過程圖解 |

→ decks/ 中**業務性內容**（流程圖、欄位對照、業務流程變更說明）於精練時直接寫入對應 wiki 卡，不另設索引層。

## 三、判斷準則對照表

當不確定某內容該不該進 Vault 時，依下表判斷：

| 問題 | 答 | 行動 |
|------|---|------|
| 這是「業務概念」還是「實作細節」？ | 業務概念 | 進 Vault |
| 這是「業務概念」還是「實作細節」？ | 實作細節 | 留程式碼 / 不進 |
| 這是「UI 規範」嗎？ | 是 | 留 Prototype DESIGN.md |
| 這是「演算法 / 計算公式」嗎？ | 是 | 留 src/utils/ |
| 這是「step-by-step 功能 Requirement」嗎？ | 是 | 留 OpenSpec spec |
| 這是「業務驗收判準」（在什麼前置下做什麼動作、應看到什麼可觀察業務結果）？ | 是 | 進 Vault：業務情境卡（`07-scenarios/`）承載判準，下游規格 Scenario 定行為契約 |
| 這是「測試案例本身」（UAT / SIT / UT / e2e，把判準寫成可執行測試）？ | 是 | 留 Prototype（`tests/e2e/*.spec.ts` 等），屬下游驗收執行產物，不進 Vault |
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
| 把 Playwright e2e spec 完整步驟（UI 點擊 + DOM 斷言）貼進 Vault | 測試案例本身屬下游驗收執行產物，留 Prototype；Vault 只寫業務驗收判準（業務情境卡），不寫測試步驟 |

## 五、相關卡

- [[erp_index]] — 入口 + 架構概述
- [[wiki-schema]] — frontmatter 規範
