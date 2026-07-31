## Purpose

材料主檔（Material Master）-- 定義 ERP 材料的三層結構（群組 / 材料 / 規格）與三種計價分支（按重量 / 按面積 / 按數量），作為後續工單、生產任務、報價、訂單等模組引用材料成本的底層 BOM 規範。

**問題**：
- 材料、工序、裝訂已於 ERP 中台實作（Figma 稿為準），但規則散落於介面稿，無正式 OpenSpec 記錄
- 工單 / 生產任務的資料模型需引用材料規格與計價規則，缺少共同參考基準
- 同一材料在不同計價方式下的單價欄位、資料形狀不同（單一規格 vs 巢狀矩陣 vs 級距），生產任務引用時需要一致的 selection 語意

**目標**：
- 主要：將材料模組的三層結構與三種計價分支正式化為 OpenSpec spec，作為 BOM 底層參考
- 次要：定義生產任務引用材料規格時的 `pricing_selection` 形狀與混合帶入模式

- 實作位置：ERP 中台（Figma 稿為準），Prototype 不另建置
- 相依模組：工單管理、生產任務、報價、訂單管理（皆為下游引用方）
- 本 spec 為「既有實作的結構性記錄」，不預期頻繁變更；後續若需變更，走 OpenSpec change 流程

---

**範圍外（本輪掛點，不展開）**：採購單位與銷售單位不一致時的換算（列表可見採購「噸」、銷售「噸／張／dm²」）屬採購與庫存模組，物料庫存量帳為本輪掛點（見 `production-stage-high-level-design.md` § 0.2）。材料規格的「自定義」命名約束與 `pricing_selection` 覆寫歷程屬實作參數。三種計價分支的計算公式正本見 wiki [BOM結構](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)（按面積已收斂為「單獨面積」與「總面積」兩支，皆為單件或總面積 × 查表值 × 數量）。

## Requirements

### Requirement: 材料群組管理

系統 SHALL 提供材料群組作為材料的頂層分類，群組為單層結構（無巢狀父子關係）。群組可啟用或停用，並可調整顯示排序。

#### Scenario: 管理員建立新群組

- **WHEN** 管理員於材料管理頁點擊「新增群組」並輸入名稱
- **THEN** 系統 SHALL 建立 MaterialGroup，並顯示於左側群組導覽

#### Scenario: 群組僅單層

- **WHEN** 管理員嘗試於群組內建立子群組
- **THEN** 系統 SHALL 不提供此操作；群組結構限制為單層

### Requirement: 材料管理

系統 SHALL 支援在群組下建立材料（Material），每筆材料需指定 `pricing_type`（按重量 / 按面積 / 按數量）作為計價方式大類，並設定材料品牌、採購單位、銷售單位。

#### Scenario: 建立材料並指定計價方式大類

- **WHEN** 管理員於群組下點擊「新增材料」，輸入材料名稱、品牌，選擇 pricing_type
- **THEN** 系統 SHALL 建立 Material；同一 (name, brand, pricing_type) 組合 MUST 為唯一鍵

#### Scenario: 同名材料因計價方式大類不同而分別存在

- **WHEN** 管理員建立「白卡紙·永豐·按重量」與「白卡紙·永豐·按面積」兩筆材料
- **THEN** 系統 SHALL 允許兩筆並存，視為不同 Material 記錄

#### Scenario: 採購單位 / 銷售單位於材料層設定

- **WHEN** 管理員編輯材料
- **THEN** 系統 SHALL 提供採購單位與銷售單位欄位（例如：噸、張、dm²）；規格層不另行覆寫

### Requirement: 材料規格管理

系統 SHALL 支援每筆材料擁有多個材料規格（MaterialSpec）。規格名稱由使用者自訂（例如 230g、A2），並包含物理屬性（重量、厚度）、價格（進貨價、銷售價）、設備約束欄位、計價方式子類型（pricing_method）。

#### Scenario: 建立材料規格並設定子類型

- **WHEN** 管理員於材料下點擊「新增規格」，輸入規格名稱、物理屬性、價格、計價方式子類型
- **THEN** 系統 SHALL 建立 MaterialSpec；pricing_method MUST 屬於 Material.pricing_type 所對應的子類型範圍

#### Scenario: 子類型不可脫離大類

- **WHEN** Material.pricing_type = 按重量，管理員嘗試將規格的 pricing_method 設為「單價面積」
- **THEN** 系統 SHALL 阻擋；pricing_method 僅可選重量計 / 令價計 / 單張計

### Requirement: 計價規則 - 按重量（三子類型）

系統 SHALL 為 `pricing_type = 按重量` 的材料規格提供三個子類型：重量計、令價計、單張計。三者共用「規格尺寸表」結構，但欄位集合與計算公式不同。

#### Scenario: 子類型「重量計」使用噸價計算

- **WHEN** 規格的 pricing_method = 重量計
- **THEN** 系統 SHALL 於規格尺寸表提供欄位：規格 / 尺寸（寬 × 長 + 單位）/ 重量(g) / 噸價(元/t)
- **AND** 單張價格計算公式 SHALL 為 `面積(㎡) × 克重(g/㎡) ÷ 1000 × 噸價 ÷ 1000`

#### Scenario: 子類型「令價計」使用磅價計算

- **WHEN** 規格的 pricing_method = 令價計
- **THEN** 系統 SHALL 於規格尺寸表提供欄位：規格 / 尺寸（寬 × 長 + 單位）/ 重量(g) / 磅價(元/磅)
- **AND** 單張價格計算公式 SHALL 為 `令價 ÷ 500`；令價 = `克重 × 長(英吋) × 寬(英吋) × 0.00071117 × 磅價`

#### Scenario: 子類型「單張計」直接取用單張價

- **WHEN** 規格的 pricing_method = 單張計
- **THEN** 系統 SHALL 於規格尺寸表提供欄位：規格 / 尺寸（寬 × 長 + 單位）/ 單張價(元/張)
- **AND** 此子類型之規格表 MUST 不含「重量(g)」欄位
- **AND** 規格欄 SHALL 允許輸入「自定義」名稱（除 A0-A4 預設選項外）

#### Scenario: 尺寸單位可逐列切換

- **WHEN** 管理員編輯規格尺寸表
- **THEN** 每一列的尺寸單位 SHALL 可獨立切換為英吋 / 公分 / 公釐

### Requirement: 計價規則 - 按面積（巢狀）

系統 SHALL 為 `pricing_type = 按面積` 的材料規格提供兩個子類型：單價面積、綜容積。兩者共用「面積區間 × 數量區間」的巢狀矩陣結構，計算邏輯相同，差異僅在預設面積區間範圍（綜容積通常較大）。

#### Scenario: 設定面積區間與數量區間

- **WHEN** 管理員編輯按面積規格
- **THEN** 系統 SHALL 提供面積區間（m²）與數量區間兩個一維陣列，允許管理員自行新增 / 刪除區間

#### Scenario: 價格矩陣對應 (面積 × 數量) 組合

- **WHEN** 面積區間有 N 個、數量區間有 M 個
- **THEN** 系統 SHALL 產生 N × M 筆價格項，每筆對應一組 (area_range, qty_range) 的單價

### Requirement: 計價規則 - 按數量（單維度級距）

系統 SHALL 為 `pricing_type = 按數量` 的材料規格提供單維度級距結構（無子類型），每個級距設定 (min_qty, max_qty, unit, price)。

#### Scenario: 設定數量級距與對應單價

- **WHEN** 管理員編輯按數量規格
- **THEN** 系統 SHALL 提供可編輯的級距表；每列包含：數量下限、數量上限、單位、單價

#### Scenario: 按數量不限定於紙張

- **WHEN** 材料類型為壓克力、杯墊等非紙張類
- **THEN** 系統 SHALL 允許以按數量作為計價方式，單位可為張 / 件 / 組等

### Requirement: 設備約束欄位

系統 SHALL 於 MaterialSpec 層提供設備約束欄位（最小 / 最大長邊、最小 / 最大短邊、起始倍數、最小面積），用於判斷設備是否能使用此材料。這些欄位 MUST 不用於成本計算。

#### Scenario: 判斷設備可用性

- **WHEN** 系統於生產排程或工單建立時，評估設備與材料的匹配性
- **THEN** 系統 SHALL 依設備的承受尺寸範圍與材料規格的尺寸約束欄位比對，篩選可用設備

### Requirement: 生產任務引用材料規格

系統 SHALL 支援生產任務引用材料規格，除主檔項目外另記錄 `pricing_selection`（計價鍵）。生產任務的**生產單位類別 SHALL 由所引用材料主檔項目的承作廠商決定且對印務唯讀**——承作廠商留空即自有工廠，填外部廠商時依該廠商的類別（加工廠／外包廠／中國廠商）帶出。BOM SHALL NOT 規定某類主檔只能配某類廠商。

pricing_selection 採混合帶入：目前由使用者手動選擇；拼版模數自動換算接上後由系統依印件內容預填，使用者 MAY 覆寫，生產任務 MUST 留存系統預設值與覆寫值兩版供稽核。

**Priority**: P0

**Rationale**: 執行方（自有或外發）的決策必須只有一個來源。若生產任務可人工改生產單位類別，同一道工序會出現「BOM 說外包、任務說自有」兩個真相，外包成本與派單的產生條件都會跟著錯。

#### Scenario: 承作廠商決定生產單位類別

- **GIVEN** 材料主檔項目的承作廠商為外部廠商、類別為加工廠
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的生產單位類別為加工廠且唯讀

#### Scenario: 承作廠商留空即自有工廠

- **GIVEN** 材料主檔項目的承作廠商留空
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的生產單位類別為自有工廠、不產生派單

#### Scenario: 手動輸入 pricing_selection（目前階段）

- **WHEN** 印務於製程規劃建立引用材料規格的生產任務
- **THEN** 使用者手動選擇 pricing_selection，系統不自動計算

### Requirement: 成本計算流程

系統 SHALL 依 pricing_selection 回查對應 PricingRule 的單價，乘以生產任務用量（依計價方式換算）得出材料成本。

#### Scenario: 按重量材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ size_name: "A2" }`，規格子類型 = 重量計
- **THEN** 系統 SHALL 依 A2 列的重量與噸價套用公式計算單張價，再乘以印量

#### Scenario: 按面積材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ area_range: "100-199", qty_range: "1-99" }`
- **THEN** 系統 SHALL 查 price_matrix[100-199][1-99] 取得單價，乘以用量

#### Scenario: 按數量材料成本計算

- **WHEN** 生產任務 pricing_selection = `{ qty_tier: "100-199" }`，印量 150 件，該級距單價 4 元/件
- **THEN** 材料成本 SHALL = 4 × 150 = 600 元

---

## Data Model

> 欄位正本（業務可見欄位表）在 wiki 實體卡；本段僅保留實作層計價結構與引用結構。
>
> - 材料群組 / 材料 / 材料規格欄位正本：[wiki 材料主檔實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/材料主檔.md) § 欄位（業務可見）
> - 計價子分支組成與公式正本：[wiki BOM 結構卡](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)

以下為實作層計價設定與生產任務引用結構（技術層欄位，非業務欄位正本；wiki 材料主檔卡明文將計價子表細項列為實作規格）：

### PricingRuleWeightBased（按重量規格尺寸表）

適用 pricing_type = 按重量。每筆 MaterialSpec 可擁有多列 `PricingRuleWeightBased` 項，構成尺寸表。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬規格 | material_spec_id | FK | Y | Y | FK -> MaterialSpec |
| 規格名稱 | size_spec | 字串 | Y | | A0 / A1⋯，單張計可為「自定義」 |
| 寬 | width | 小數 | Y | | |
| 長 | length | 小數 | Y | | |
| 尺寸單位 | dim_unit | 單選 | Y | | 英吋 / 公分 / 公釐，逐列可切換 |
| 重量 | weight_g | 小數 | | | 單位：g；僅重量計 / 令價計使用，單張計為 null |
| 噸價 | ton_price | 小數 | | | 單位：元/t；僅重量計使用 |
| 磅價 | pound_price | 小數 | | | 單位：元/磅；僅令價計使用 |
| 單張價 | price_per_sheet | 小數 | | | 單位：元/張；僅單張計使用 |
| 顯示排序 | display_order | 整數 | | | |

**約束**：依 MaterialSpec.pricing_method 啟用對應價格欄位，其餘欄位為 null。

### PricingRuleAreaBased（按面積巢狀矩陣）

適用 pricing_type = 按面積。由 AreaRange、QtyRange、PriceMatrix 三張表構成巢狀結構。

#### AreaRange（面積區間）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬規格 | material_spec_id | FK | Y | Y | FK -> MaterialSpec |
| 面積下限 | min_m2 | 小數 | Y | | 單位：m² |
| 面積上限 | max_m2 | 小數 | | | null 代表 ∞ |
| 顯示排序 | display_order | 整數 | | | |

#### QtyRange（數量區間）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬規格 | material_spec_id | FK | Y | Y | FK -> MaterialSpec |
| 數量下限 | min_qty | 整數 | Y | | |
| 數量上限 | max_qty | 整數 | | | null 代表 ∞ |
| 顯示排序 | display_order | 整數 | | | |

#### PriceMatrix（面積 × 數量價格矩陣）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬規格 | material_spec_id | FK | Y | Y | FK -> MaterialSpec |
| 面積區間 | area_range_id | FK | Y | | FK -> AreaRange |
| 數量區間 | qty_range_id | FK | Y | | FK -> QtyRange |
| 單價 | price | 小數 | Y | | |

**約束**：每筆 (area_range_id, qty_range_id) 組合於同一 MaterialSpec 下 MUST 唯一。

### PricingRuleQtyBased（按數量級距）

適用 pricing_type = 按數量。每筆 MaterialSpec 擁有多列級距，構成級距表。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬規格 | material_spec_id | FK | Y | Y | FK -> MaterialSpec |
| 數量下限 | min_qty | 整數 | Y | | |
| 數量上限 | max_qty | 整數 | | | null 代表 ∞ |
| 單位 | unit | 單選 | Y | | 張 / 件 / 組⋯ |
| 單價 | price | 小數 | Y | | 單位：NTD |
| 顯示排序 | display_order | 整數 | | | |

### 生產任務對材料規格的引用（下游模組參考）

下列為生產任務（ProductionTask）引用材料規格時應包含的欄位，正式定義見生產任務 spec。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 材料規格 | material_spec_id | FK | Y | FK -> MaterialSpec |
| 計價選擇 | pricing_selection | JSON | Y | 形狀依 Material.pricing_type 不同 |
| 系統預設值 | pricing_selection_default | JSON | Y | 系統依印件內容自動帶入的原始值 |
| 覆寫標記 | pricing_selection_overridden | 布林值 | Y | 使用者是否手動覆寫 |

**pricing_selection 形狀**：

| pricing_type | pricing_selection JSON 結構 |
|--------------|---------------------------|
| 按重量 | `{ "size_name": "A2" }` |
| 按面積 | `{ "area_range_id": "...", "qty_range_id": "..." }` |
| 按數量 | `{ "qty_tier_id": "..." }` |

---

## Scenarios（端到端計算範例）

### Scenario E2E-1：按重量-重量計材料

- **材料**：白卡紙·永豐（按重量），230g 規格，pricing_method = 重量計
- **生產任務**：10000 張，A2 尺寸
- **pricing_selection**：`{ size_name: "A2" }`
- **查表**：size_table A2 列 → weight_g = 128, ton_price = 5000
- **計算**：單張價 = 面積(㎡) × 128 ÷ 1000 × 5000 ÷ 1000；材料成本 = 單張價 × 10000

### Scenario E2E-2：按面積-單價面積材料

- **材料**：白卡皮·永豐（按面積），250g 規格，pricing_method = 單價面積
- **生產任務**：150 張，單張面積 0.5 m²，總面積 75 m²
- **pricing_selection**（系統預設）：`{ area_range: "1-99", qty_range: "100-199" }`
- **查表**：price_matrix[1-99][100-199] → price = 11
- **計算**：材料成本 = 11 × 用量（單位依後續模組 spec 釐清，見 OQ）

### Scenario E2E-3：按數量材料

- **材料**：壓克力板（按數量），3mm 規格
- **生產任務**：150 件
- **pricing_selection**（系統預設）：`{ qty_tier: "100-199" }`
- **查表**：qty_tiers → price = 4 元/件
- **計算**：材料成本 = 4 × 150 = 600 元

### Scenario E2E-4：使用者手動覆寫 pricing_selection

- 同 E2E-3，使用者預期擴單，手動改為 `{ qty_tier: "200-299" }`
- **計算**：材料成本 = 3 × 150 = 450 元
- 生產任務留存 pricing_selection_default = `{ qty_tier: "100-199" }`、pricing_selection = `{ qty_tier: "200-299" }`、pricing_selection_overridden = true
