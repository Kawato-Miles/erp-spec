## Purpose

裝訂主檔（Binding Master）-- 定義 ERP 裝訂方式的單層結構與三種計價方式（台數計價 / 頁數計價 / 本數計價，皆為巢狀矩陣），作為後續工單、生產任務、報價、訂單等模組引用裝訂成本的底層 BOM 規範。

**問題**：
- 裝訂模組已於 ERP 中台實作（Figma 稿為準），但規則散落於介面稿，無正式 OpenSpec 記錄
- 工單 / 生產任務的資料模型需引用裝訂與計價規則，缺少共同參考基準
- 三種計價方式的 X 軸語意不同（區間 vs 枚舉值），生產任務引用時需要一致的 selection 語意

**目標**：
- 主要：將裝訂模組的單層結構與三種計價方式正式化為 OpenSpec spec，作為 BOM 底層參考
- 次要：定義生產任務引用裝訂時的 `pricing_selection` 形狀、最低金額套用邏輯與混合帶入模式

- 實作位置：ERP 中台（Figma 稿為準），Prototype 不另建置
- 相依模組：工單管理、生產任務、報價、訂單管理（皆為下游引用方）
- 本 spec 為「既有實作的結構性記錄」，不預期頻繁變更；後續若需變更，走 OpenSpec change 流程
- 設計取捨：三種巢狀計價中，台數計價與頁數計價的 X 軸為「連續區間」，本數計價的 X 軸為「離散枚舉值（頁數項目）」。Y 軸皆為「本數區間」。採**統一 Axis 表**（BindingPricingAxis + BindingPricingMatrix）聯合 range / enum_value 兩種 item_type，而非分立多表
- 特殊欄位：Binding 層具備 `cross_page`（跨頁設計）、`illustration_url`（示意圖）、`min_amount_per_unit`（每本最低金額）、`min_total_amount`（總價最低金額）等材料 / 工序所無的欄位
- **無廠商欄位**：裝訂方式不記錄廠商（與工序 vendor_id 不同），後續若新增外包裝訂廠商概念再走 change

---

**範圍外（本輪掛點，不展開）**：台數換算所需的拼版演算法、多工單合併上機的用量分攤，皆屬拼版功能（本輪掛點）。示意圖片的儲存位置屬檔案管理實作。跨頁設計欄位維持純顯示、不做稿件驗證（升級為驗證欄位屬未來擴充，本輪不預留）。計價軸值域項目被刪除時既有引用的處置待 `PT-039` 裁決（主檔改價不影響既有工單已定，見 `work-order` § 預估成本凍結）。

## Requirements

### Requirement: 裝訂方式管理

系統 SHALL 提供單層的裝訂方式主檔（Binding），無群組層。每筆裝訂方式需指定名稱、啟用狀態、跨頁設計、示意圖片、每本最低金額、總價最低金額、計價方式（三選一）。

#### Scenario: 管理員建立裝訂方式

- **WHEN** 管理員於裝訂管理頁點擊「新增裝訂」，輸入名稱、跨頁設計、示意圖、最低金額、計價方式
- **THEN** 系統 SHALL 建立 Binding 並依 pricing_method 展開對應計價設定區塊

#### Scenario: 裝訂方式為單層結構

- **WHEN** 管理員瀏覽裝訂管理頁
- **THEN** 系統 MUST 不提供群組導覽；所有裝訂方式直接平列於列表

#### Scenario: 裝訂方式無廠商欄位

- **WHEN** 管理員編輯裝訂方式
- **THEN** 系統 MUST 不提供廠商欄位；裝訂預設為公司內部執行

### Requirement: 跨頁設計欄位（純顯示）

系統 SHALL 於 Binding 層提供 `cross_page` 布林欄位，標示該裝訂方式是否支援跨頁設計。此欄位為純資訊標籤，系統 MUST 不以此欄位進行攔截或驗證。

#### Scenario: 列表顯示跨頁設計標籤

- **WHEN** 使用者瀏覽裝訂列表
- **THEN** 系統 SHALL 於「跨頁設計」欄顯示「是」或「否」

#### Scenario: 跨頁設計不影響系統邏輯

- **WHEN** 業務選用 cross_page = 否 的裝訂方式
- **THEN** 系統 MUST 不攔截；僅作為參考資訊供使用者判斷

### Requirement: 計價方式 - 台數計價

系統 SHALL 為 pricing_method = 台數計價 提供「台數區間 × 本數區間」的二維巢狀矩陣。適用於膠裝商品、拉頁馬釘、穿線 + 膠裝等多台數的書刊。

#### Scenario: 設定台數計價

- **WHEN** 管理員選擇 pricing_method = 台數計價
- **THEN** 系統 SHALL 提供台數區間（X 軸）與本數區間（Y 軸）兩組可編輯的區間陣列
- **AND** BindingPricingAxis 之 X 軸 MUST 為 item_type = range，range_type = signature_count
- **AND** Y 軸 MUST 為 item_type = range，range_type = qty

### Requirement: 計價方式 - 頁數計價

系統 SHALL 為 pricing_method = 頁數計價 提供「頁數區間 × 本數區間」的二維巢狀矩陣。適用於頁數有變化的小冊子、手冊。

#### Scenario: 設定頁數計價

- **WHEN** 管理員選擇 pricing_method = 頁數計價
- **THEN** 系統 SHALL 提供頁數區間（X 軸）與本數區間（Y 軸）兩組可編輯的區間陣列
- **AND** X 軸 MUST 為 item_type = range，range_type = page_range

### Requirement: 計價方式 - 本數計價（X 軸為枚舉值）

系統 SHALL 為 pricing_method = 本數計價 提供「頁數項目（枚舉值） × 本數區間」的巢狀矩陣。適用於數位印刷、標準書冊等「頁數固定」的商品。頁數項目由管理員自行輸入候選值（例如 36 / 48 / 64）。

#### Scenario: 設定本數計價

- **WHEN** 管理員選擇 pricing_method = 本數計價
- **THEN** 系統 SHALL 提供頁數項目（X 軸）與本數區間（Y 軸）兩組可編輯陣列
- **AND** X 軸 MUST 為 item_type = enum_value，range_type = page_item
- **AND** 系統 SHALL 提供「編輯頁數項目（非區間）」介面，管理員可自行新增 / 刪除枚舉值

#### Scenario: 頁數項目與頁數計價的選用指引

- **WHEN** 管理員需要針對可自由填寫頁數的商品計價
- **THEN** 管理員 SHALL 使用頁數計價（連續區間）；本數計價僅用於頁數固定的商品

### Requirement: pricing_method 與 pricing_rule 對應

系統 SHALL 依 Binding.pricing_method 決定 X 軸與 Y 軸的 item_type 與 range_type 語意。

#### Scenario: pricing_method 對應表

- **WHEN** 系統建立或讀取 Binding 的計價規則
- **THEN** 對應關係 MUST 遵循下列對應：

  | pricing_method | X 軸 item_type / range_type / unit | Y 軸 item_type / range_type / unit |
  |----------------|------------------------------|------------------------------|
  | 台數計價 | range / signature_count / 台 | range / qty / 本 |
  | 頁數計價 | range / page_range / 頁 | range / qty / 本 |
  | 本數計價 | **enum_value** / page_item / 頁 | range / qty / 本 |

### Requirement: 最低金額套用邏輯

系統 SHALL 於計算裝訂成本時套用兩層最低金額：每本最低金額（min_amount_per_unit）與總價最低金額（min_total_amount）。計算結果若低於最低值則以最低值取代。

#### Scenario: 每本最低金額套用

- **WHEN** 系統計算每本裝訂單價 `unit_price_calculated`
- **THEN** 實際每本單價 MUST = `max(unit_price_calculated, min_amount_per_unit)`

#### Scenario: 總價最低金額套用

- **WHEN** 系統計算裝訂總價 `total_calculated = unit_price × qty`
- **THEN** 實際總價 MUST = `max(total_calculated, min_total_amount)`

#### Scenario: 兩層最低金額同時套用

- **WHEN** 計算出的每本單價與總價皆低於最低金額
- **THEN** 系統 SHALL 先以 min_amount_per_unit 替換每本單價，再檢查 (替換後單價 × 本數) 是否低於 min_total_amount；兩層獨立判斷，取較嚴者

### Requirement: 預設放損率

裝訂方式 SHALL 有「預設放損率」欄（百分比），建立時 SHALL 必填、預設 0，值 SHALL 不小於 0。生產任務引用該項目時 SHALL 帶入此值為唯讀參考並凍結於任務，主檔事後改率 SHALL NOT 回寫；該值 SHALL NOT 驅動任何數量預填或校驗。

**Priority**: P1

**Rationale**: 三類 BOM 主檔項目都提供預設放損率，生產任務的放損率欄才能對三類任務一律顯示、不依類型分支（2026-09-03 拍板）。

#### Scenario: 建立時必填預設 0

- **GIVEN** 印務新建一筆裝訂方式
- **WHEN** 檢視預設放損率欄
- **THEN** 該欄 SHALL 必填且預先帶 0

#### Scenario: 引用後凍結

- **GIVEN** 一筆裝訂方式預設放損率為 2%，已有生產任務引用
- **WHEN** 印務把預設放損率改為 5%
- **THEN** 既有生產任務的放損率仍 SHALL 顯示 2%

### Requirement: 生產任務引用裝訂

系統 SHALL 支援生產任務引用裝訂，除主檔項目外另記錄 `pricing_selection`（計價鍵）。生產任務的**廠商類別 SHALL 由所引用裝訂主檔項目的承作廠商決定且對印務唯讀**——承作廠商留空即自有工廠，填外部廠商時依該廠商的類別（加工廠／外包廠／中國廠商）帶出。BOM SHALL NOT 規定某類主檔只能配某類廠商。

pricing_selection 採混合帶入：目前由使用者手動選擇；拼版模數自動換算接上後由系統依印件內容預填，使用者 MAY 覆寫，生產任務 MUST 留存系統預設值與覆寫值兩版供稽核。

**Priority**: P0

**Rationale**: 執行方（自有或外發）的決策必須只有一個來源。若生產任務可人工改廠商類別，同一道工序會出現「BOM 說外包、任務說自有」兩個真相，外包成本與派單的產生條件都會跟著錯。

#### Scenario: 承作廠商決定廠商類別

- **GIVEN** 裝訂主檔項目的承作廠商為外部廠商、類別為加工廠
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的廠商類別為加工廠且唯讀

#### Scenario: 承作廠商留空即自有工廠

- **GIVEN** 裝訂主檔項目的承作廠商留空
- **WHEN** 印務以該項目建立生產任務
- **THEN** 該任務的廠商類別為自有工廠、不產生派單

#### Scenario: 手動輸入 pricing_selection（目前階段）

- **WHEN** 印務於製程規劃建立引用裝訂的生產任務
- **THEN** 使用者手動選擇 pricing_selection，系統不自動計算

### Requirement: 裝訂成本計算流程

系統 SHALL 依 pricing_selection 回查 BindingPricingMatrix 的單價，套用最低金額邏輯後得出裝訂總成本。

#### Scenario: 查單價並套用最低金額

- **WHEN** 生產任務 pricing_selection = `{ x_axis_id, y_axis_id }`
- **THEN** 系統 SHALL 執行：
  1. 查 BindingPricingMatrix 對應 cell 取得 price_calculated
  2. unit_price_actual = max(price_calculated, min_amount_per_unit)
  3. total_actual = max(unit_price_actual × qty, min_total_amount)

---

## Data Model

> 欄位正本（業務可見欄位表）在 wiki 實體卡；本段僅保留實作層計價結構與引用結構。
>
> - 裝訂方式欄位正本：[wiki 裝訂主檔實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/裝訂主檔.md) § 欄位（業務可見）
> - 計價子分支組成與公式正本：[wiki BOM 結構卡](../../../memory/Sens_wiki/wiki/erp/04-business-logic/營運規則/訂單到交付/BOM結構.md)

以下為實作層計價設定與生產任務引用結構（技術層欄位，非業務欄位正本；wiki 裝訂主檔卡明文將計價軸項目與價格矩陣格列為實作規格）：

### BindingPricingAxis（計價軸項目，統一表）

適用三種 pricing_method。每筆 Binding 擁有多筆 Axis 項目，分 X 軸與 Y 軸。同一 Axis 可為連續區間（range）或離散枚舉值（enum_value）。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬裝訂 | binding_id | FK | Y | Y | FK -> Binding |
| 軸別 | axis | 單選 | Y | | x / y |
| 項目類型 | item_type | 單選 | Y | | range（連續區間） / enum_value（離散枚舉值） |
| 軸語意 | range_type | 單選 | Y | | signature_count / page_range / qty / page_item |
| 區間下限 | min | 小數 | | | item_type = range 用；enum_value 時為 null |
| 區間上限 | max | 小數 | | | item_type = range 用，null 代表 ∞ |
| 枚舉值 | enum_value | 小數 | | | item_type = enum_value 用；range 時為 null |
| 單位 | unit | 單選 | Y | | 台 / 頁 / 本（依 range_type 決定） |
| 顯示排序 | display_order | 整數 | | | |

**欄位使用規則**：

| item_type | 使用欄位 | 未使用欄位（null） |
|-----------|---------|-----------------|
| range | min, max | enum_value |
| enum_value | enum_value | min, max |

**約束**：
- 同一 Binding 下，axis = x 的所有項目 MUST 共用相同 item_type 與 range_type
- 同一 Binding 下，axis = y 的所有項目 MUST 為 item_type = range、range_type = qty（本 spec 限定 Y 軸恆為本數區間）

### BindingPricingMatrix（巢狀價格矩陣 cell）

每 (X 軸項目 × Y 軸項目) 組合對應一筆。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬裝訂 | binding_id | FK | Y | Y | FK -> Binding |
| X 軸項目 | x_axis_id | FK | Y | | FK -> BindingPricingAxis（axis = x） |
| Y 軸項目 | y_axis_id | FK | Y | | FK -> BindingPricingAxis（axis = y） |
| 單價 | price | 小數 | Y | | 單位：NTD |

**約束**：同一 Binding 下，(x_axis_id, y_axis_id) 組合 MUST 唯一。

### 生產任務對裝訂的引用（下游模組參考）

下列為生產任務（ProductionTask）引用裝訂時應包含的欄位，正式定義見生產任務 spec。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 裝訂 | binding_id | FK | Y | FK -> Binding |
| 計價選擇 | pricing_selection | JSON | Y | 形狀統一為 `{ x_axis_id, y_axis_id }` |
| 系統預設值 | pricing_selection_default | JSON | | 排程模組上線後由系統依印件自動計算的原始值；目前階段為 null |
| 覆寫標記 | pricing_selection_overridden | 布林值 | Y | 使用者是否手動覆寫；目前階段預設 true |

**用量來源維度**（排程模組上線後由系統自動換算）：

| pricing_method | X 軸用量來源 | Y 軸用量來源 |
|----------------|------------|------------|
| 台數計價 | 印件尺寸 + 材料拼版後的台數 | 本數（印量） |
| 頁數計價 | 印件規格的頁數 | 本數 |
| 本數計價 | 印件規格的固定頁數（對應枚舉值） | 本數 |

---

## Scenarios（端到端計算範例）

### Scenario E2E-1：台數計價

- **裝訂**：硬殼膠裝（pricing_method = 台數計價，min_amount_per_unit = 200 NTD，min_total_amount = 20000 NTD）
- **生產任務**：印件 150 本，拼版後每本需 4 台
- **pricing_selection**：`{ x_axis_id: "3-4 台", y_axis_id: "100-199 本" }`
- **查表**：BindingPricingMatrix → price_calculated = 8 NTD
- **最低金額套用**：
  - unit_price_actual = max(8, 200) = 200 NTD
  - total_actual = max(200 × 150, 20000) = max(30000, 20000) = 30000 NTD

### Scenario E2E-2：頁數計價

- **裝訂**：穿線膠裝（pricing_method = 頁數計價）
- **生產任務**：印件 150 本，每本 120 頁
- **pricing_selection**：`{ x_axis_id: "100-199 頁", y_axis_id: "100-199 本" }`
- **查表**：BindingPricingMatrix → price_calculated = 8 NTD
- **成本**：套用最低金額後計算總價

### Scenario E2E-3：本數計價（枚舉值 X 軸）

- **裝訂**：騎馬釘（pricing_method = 本數計價，頁數項目 = { 36, 48, 64 }）
- **生產任務**：印件 150 本，每本 48 頁
- **pricing_selection**：`{ x_axis_id: "enum 48", y_axis_id: "100-199 本" }`
- **查表**：BindingPricingMatrix → price_calculated = 8 NTD
- **成本**：套用最低金額後計算總價

### Scenario E2E-4：使用者手動覆寫 pricing_selection

- 同 E2E-3，使用者發現實際為 64 頁版本，手動改為 `{ x_axis_id: "enum 64", y_axis_id: "100-199 本" }`
- 系統以覆寫後 selection 重新計算成本
- 生產任務留存 pricing_selection_default（排程預設值；目前階段為 null）與 pricing_selection（覆寫值）

### Scenario E2E-5：最低金額觸發（小量訂單）

- **裝訂**：騎馬釘（min_amount_per_unit = 200，min_total_amount = 20000）
- **生產任務**：50 本，計算出單價 150 NTD
- **套用**：
  - unit_price_actual = max(150, 200) = 200 NTD
  - total_actual = max(200 × 50, 20000) = max(10000, 20000) = **20000 NTD**（總價最低金額觸發）
