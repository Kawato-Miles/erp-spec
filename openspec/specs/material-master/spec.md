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

系統 SHALL 支援生產任務引用 MaterialSpec，除 `material_spec_id` 外，另需記錄 `pricing_selection`（使用者選擇的計價鍵），形狀依 Material.pricing_type 分支不同。pricing_selection 採混合帶入模式：系統依印件內容自動預設，使用者可手動覆寫。

#### Scenario: 按重量引用 -- selection 為單一規格

- **WHEN** 生產任務引用 pricing_type = 按重量 的材料規格
- **THEN** pricing_selection SHALL 形狀為 `{ size_name }`；例如 `{ size_name: "A2" }`

#### Scenario: 按面積引用 -- selection 為巢狀二鍵

- **WHEN** 生產任務引用 pricing_type = 按面積 的材料規格
- **THEN** pricing_selection SHALL 形狀為 `{ area_range_id, qty_range_id }`

#### Scenario: 按數量引用 -- selection 為單一級距

- **WHEN** 生產任務引用 pricing_type = 按數量 的材料規格
- **THEN** pricing_selection SHALL 形狀為 `{ qty_tier_id }`

#### Scenario: 系統依印件內容預設 pricing_selection

- **WHEN** 開立生產任務時綁定印件
- **THEN** 系統 SHALL 依印件的尺寸、印量自動計算並預填 pricing_selection

#### Scenario: 使用者手動覆寫 pricing_selection

- **WHEN** 使用者於生產任務頁面修改 pricing_selection
- **THEN** 系統 SHALL 以覆寫後的 selection 重新計算成本；生產任務 MUST 留存系統預設值與覆寫值兩版供稽核

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

> 來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### MaterialGroup（材料群組）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 群組名稱 | name | 字串 | Y | | 包裝材料 / 名片材料 / 壓克力材料⋯ |
| 顯示排序 | display_order | 整數 | | | 左側群組導覽排序 |
| 啟用狀態 | enabled | 布林值 | Y | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**約束**：群組為單層結構，無 parent_id。

### Material（材料）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬群組 | group_id | FK | Y | | FK -> MaterialGroup |
| 材料名稱 | name | 字串 | Y | | 白卡紙 / 銀卡紙⋯，由使用者自訂 |
| 材料品牌 | brand | 字串 | Y | | 永豐 / 恆成⋯ |
| 計價方式大類 | pricing_type | 單選 | Y | | 按重量 / 按面積 / 按數量 |
| 採購單位 | purchase_unit | 單選 | Y | | 噸 / 張 / dm²⋯ |
| 銷售單位 | sale_unit | 單選 | Y | | 噸 / 張 / dm²⋯ |
| 啟用狀態 | enabled | 布林值 | Y | | |
| 顯示排序 | display_order | 整數 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**唯一鍵**：`(name, brand, pricing_type)`。

### MaterialSpec（材料規格）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬材料 | material_id | FK | Y | Y | FK -> Material |
| 規格名稱 | spec_name | 字串 | Y | | 230g / A2⋯，由使用者自訂 |
| 啟用狀態 | enabled | 布林值 | Y | | |
| 重量 | weight | 小數 | | | 單位：g |
| 厚度 | thickness | 小數 | | | 單位：mm |
| 進貨價 | purchase_price | 小數 | | | 單位：NTD |
| 銷售價 | sale_price | 小數 | | | 單位：NTD |
| 最小長邊 | min_long_side | 小數 | | | 單位：cm；設備約束 |
| 最大長邊 | max_long_side | 小數 | | | 單位：cm；設備約束 |
| 長邊起始倍數 | long_side_unit_increment | 小數 | | | 單位：倍；設備約束 |
| 最小短邊 | min_short_side | 小數 | | | 單位：cm；設備約束 |
| 最大短邊 | max_short_side | 小數 | | | 單位：cm；設備約束 |
| 短邊起始倍數 | short_side_unit_increment | 小數 | | | 單位：倍；設備約束 |
| 最小面積 | min_area | 小數 | | | 單位：cm²；設備約束 |
| 計價方式子類型 | pricing_method | 單選 | | | 依 pricing_type 分支可選值；按數量可為 null |
| 備註 | notes | 文字 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**pricing_method 與 pricing_type 對應表**：

| Material.pricing_type | MaterialSpec.pricing_method 可選值 |
|----------------------|----------------------------------|
| 按重量 | 重量計 / 令價計 / 單張計 |
| 按面積 | 單價面積 / 綜容積 |
| 按數量 | null（無子類型） |

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

---

## Open Questions

1. **按面積用量單位**：PriceMatrix.price 對應的用量計算基準為「每 m²」還是「每區間固定價」？影響 E2E-2 的實際成本換算
2. **綜容積 vs 單價面積的計算差異**：兩者資料結構相同，但業務結帳語意是否有別？
3. **單張計「自定義」規格**：由使用者自由命名，是否需命名規則約束（避免重複或歧義）？
4. **pricing_selection 覆寫稽核**：除留存 default / override 兩版外，是否需記錄覆寫歷程（who、when、why）？
5. **採購單位 / 銷售單位不一致**：列表可見採購「噸」、銷售「噸」或「張」「dm²」等；換算邏輯在哪一層處理（材料主檔 vs 採購 / 庫存模組）？

---

## Version History

- v0.1（2026-04-17）：初版，依 Figma 中台介面稿（node-id: 122-29763 / 366-181798 / 366-182377 / 2-19344 / 366-187221 / 366-188456）逆向建立；定義三層結構、三種計價分支、生產任務引用 pricing_selection 形狀與混合帶入模式
