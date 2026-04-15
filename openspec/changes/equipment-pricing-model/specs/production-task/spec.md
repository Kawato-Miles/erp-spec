## MODIFIED Requirements

### Requirement: 設備預計成本計算

系統 SHALL 根據生產任務的色數標記（正面色數、背面色數）、特殊色陣列、所選設備的區間階梯定價（pricingTiers）、硬性倍率、開機費、目標印量，自動計算設備預計成本（estimated_equipment_cost）。任何影響因子變動時，系統 SHALL 即時重算。

計算公式：

```
/* Step 1: 換算印量為計價單位 */
unitsByPricingUnit = 設備.pricing_unit = '令' ? pt_target_qty / 500
                   : 設備.pricing_unit = '千車' ? pt_target_qty / 1000

/* Step 2: 依印量落點找到 tier */
tier = 設備.pricing_tiers 中符合 min_qty <= unitsByPricingUnit <= (max_qty ?? ∞) 的區間
   ※ 若 unitsByPricingUnit 低於最小 tier 的 min_qty，取最小 tier

/* Step 3: 基本印工成本（正面 + 背面獨立計算） */
frontBasePrice = front_color_count <= 1 ? tier.mono_price_per_color : tier.cmyk_price_per_color
backBasePrice  = back_color_count  <= 1 ? tier.mono_price_per_color : tier.cmyk_price_per_color
basicCost = front_color_count × frontBasePrice × unitsByPricingUnit
          + back_color_count  × backBasePrice  × unitsByPricingUnit

/* Step 4: 特殊色成本（每種特殊色類型分別計算） */
specialBasePrice = tier.cmyk_price_per_color  // 特殊色倍率固定以彩色單價為基礎
specialCost = 0
for each 特殊色 in pt.special_colors:
  multiplier = 依類型取設備倍率：
    特殊色 = 'pantone'       → 設備.pantone_multiplier
    特殊色 = 'metallic'      → 設備.metallic_multiplier
    特殊色 = 'metallic_min'  → 設備.metallic_min_multiplier
  specialCost += specialBasePrice × multiplier × unitsByPricingUnit

/* Step 5: 加計開機費 */
estimated_equipment_cost = (設備.setup_fee ?? 0) + basicCost + specialCost
```

#### Scenario: 單面 CMYK 印刷（4/0）

- **WHEN** 生產任務目標印量 2,500 張、設備「海德堡 XL106」（pricing_unit = 千車、setup_fee = 500、tier2 範圍 2~3 千車、CMYK 單價 250 元/色）、front_color_count = 4、back_color_count = 0、special_colors = []
- **THEN** unitsByPricingUnit = 2.5 千車
- **AND** tier = tier2 → cmyk_price_per_color = 250
- **AND** basicCost = 4 × 250 × 2.5 + 0 = 2,500
- **AND** specialCost = 0
- **AND** estimated_equipment_cost = 500 + 2,500 = 3,000

#### Scenario: 雙面 CMYK 印刷（4/4）

- **WHEN** 生產任務目標印量 2,500 張、同上設備、front_color_count = 4、back_color_count = 4、special_colors = []
- **THEN** basicCost = 4 × 250 × 2.5 + 4 × 250 × 2.5 = 2,500 + 2,500 = 5,000
- **AND** estimated_equipment_cost = 500 + 5,000 = 5,500

#### Scenario: 雙面印刷含 Pantone 特殊色（4+1/4）

- **WHEN** 生產任務目標印量 2,500 張、同上設備（pantone_multiplier = 2）、front_color_count = 4、back_color_count = 4、special_colors = ['pantone']
- **THEN** basicCost = 5,000（同上）
- **AND** specialCost = 250 × 2 × 2.5 = 1,250
- **AND** estimated_equipment_cost = 500 + 5,000 + 1,250 = 6,750

#### Scenario: 單黑印刷（1/0）

- **WHEN** 生產任務目標印量 2,500 張、同上設備（tier2 單黑 200 元/色）、front_color_count = 1、back_color_count = 0、special_colors = []
- **THEN** frontBasePrice = 200（色數 = 1 使用單黑單價）
- **AND** basicCost = 1 × 200 × 2.5 = 500
- **AND** estimated_equipment_cost = 500 + 500 = 1,000

#### Scenario: 印量變動觸發區間切換

- **WHEN** 生產任務原目標印量 2,500 張（落在 tier2 單黑 200/CMYK 250）
- **AND** 印務調整目標印量為 6,000 張（落在 tier4 單黑 100/CMYK 150）
- **THEN** 系統 SHALL 即時重算 estimated_equipment_cost，採用 tier4 單價

#### Scenario: 多種特殊色疊加

- **WHEN** 特殊色陣列含 `['pantone', 'metallic']`、設備 pantone_multiplier = 2、metallic_multiplier = 3
- **THEN** specialCost = (cmyk_price_per_color × 2 × units) + (cmyk_price_per_color × 3 × units)
- **AND** 兩種特殊色成本分別加總至 estimated_equipment_cost

#### Scenario: 設備不支援顏色時成本為 0

- **WHEN** 生產任務選擇 supports_colors = false 的設備（膠裝機）
- **THEN** estimated_equipment_cost = setup_fee ?? 0（僅開機費，若有定義）
- **AND** front_color_count / back_color_count / special_colors 不參與計算

#### Scenario: 設備未指定

- **WHEN** 生產任務 planned_equipment = null
- **THEN** estimated_equipment_cost MUST NOT 計算，UI 顯示為「待排程」
- **AND** 顏色 UI 不顯示

#### Scenario: 特殊色類型與設備能力不符

- **WHEN** 生產任務 special_colors 含 `metallic`
- **AND** 設備 metallic_multiplier = null（不支援金銀白螢光）
- **THEN** 系統 SHALL 阻擋此組合
- **AND** UI 顯示警告「此設備不支援金銀白螢光印刷」
- **AND** estimated_equipment_cost 不計算該特殊色成本（視為無效設定）

### Requirement: 生產任務顏色選擇 UI

新增生產任務頁（AddProductionTasks）SHALL 在設備支援顏色時，於每筆生產任務下方子行顯示顏色選擇 UI。UI 包含：正面色數輸入、背面色數輸入、特殊色 chip 複選、唯讀倍率顯示、即時成本。

倍率顯示 MUST NOT 允許使用者修改（違反設備主檔硬性規則）。

#### Scenario: 設備支援顏色時顯示色數與特殊色 UI

- **WHEN** 生產任務選擇 supports_colors = true 的設備
- **THEN** 顏色子行 SHALL 顯示：
  - 正面色數 input（integer 0-8）
  - 背面色數 input（integer 0-8）
  - 特殊色 chip 複選（Pantone / 金銀白螢光 / 最低色數，依設備能力過濾）
  - 設備帶入的倍率值（唯讀顯示，灰底不可編輯）
  - 即時計算的 estimated_equipment_cost

#### Scenario: 特殊色 chip 依設備能力過濾

- **WHEN** 設備 pantone_multiplier = 2、metallic_multiplier = null、metallic_min_multiplier = null
- **THEN** 特殊色 chip 僅顯示「Pantone」可選
- **AND** 「金銀白螢光」「最低色數」chip 不出現或顯示為 disabled 狀態

#### Scenario: 變更設備為不支援顏色時清除資料

- **WHEN** 印務將生產任務的設備從「海德堡 XL106（supports_colors = true）」改為「膠裝機（supports_colors = false）」
- **AND** 原本已填 front_color_count = 4、special_colors = ['pantone']
- **THEN** 系統 SHALL 重置 front_color_count / back_color_count / special_colors 為預設值（0 / 0 / []）
- **AND** 系統 SHALL 顯示提示「設備不支援顏色選項，已清除顏色設定」
- **AND** estimated_equipment_cost 重算為 setup_fee ?? 0

#### Scenario: 變更設備為不支援某特殊色時清除該項

- **WHEN** 印務將設備從「海德堡 XL106（支援 Pantone + 金銀白螢光）」改為「某設備 A（僅支援 Pantone）」
- **AND** 原 special_colors = ['pantone', 'metallic']
- **THEN** 系統 SHALL 保留 'pantone'、移除 'metallic'
- **AND** 顯示提示「新設備不支援金銀白螢光印刷，已自動移除」

#### Scenario: 2~3 色印刷成本警語

- **WHEN** 印務設定 front_color_count ∈ [2, 3] 或 back_color_count ∈ [2, 3]
- **THEN** UI SHALL 顯示警語「2~3 色印刷實際成本可能較低，本計算採用 CMYK 單價可能高估 25~50%，請人工調整報價」
- **AND** estimated_equipment_cost 仍依公式計算（不自動調整）
- **AND** 警語 SHALL 不阻擋儲存

## ADDED Requirements

### Requirement: 業務於需求單報價階段檢視設備成本

需求單 / 訂單的報價流程 SHALL 讓業務能檢視不同候選設備對同一印件的 estimated_equipment_cost 差異，以便選擇最符合客戶預算的生產方式。

#### Scenario: 業務比較不同設備的預計成本

- **WHEN** 業務在需求單階段為某印件評估候選設備（例：海德堡 XL106、小森 GL40）
- **AND** 印件色數規格：4/0、目標印量 2,500 張
- **THEN** 系統 SHALL 顯示每台候選設備在該印件規格下的 estimated_equipment_cost
- **AND** 業務 SHALL 能依據成本差異選擇設備

> 註：此 Requirement 屬業務視角的延伸情境，實作優先順序依需求單 / 訂單模組的成本試算功能排程；本 change 主要交付 ProductionTask 層級的成本計算，此 Scenario 供後續整合參考。

## REMOVED Requirements

### Requirement: 顏色倍率自動帶入

**Reason**: equipment-color-cost change 定義的「印務選擇設備後自動帶入倍率並可覆寫」機制被本 change 取代。倍率改為設備主檔硬性規則（透過 Equipment capability 的新 Requirement「特殊色等效單色規則（硬性倍率）」強制約束），ProductionTask 不儲存倍率欄位，UI 僅唯讀顯示當前設備倍率。

**Migration**：
- ProductionTask 的 `color_pantone_multiplier / color_metallic_multiplier / color_metallic_min_multiplier` 三個欄位移除（見下方 Data Model Changes）
- 舊「可覆寫」行為從 UI 層消失，改為唯讀顯示
- Prototype 無 production 資料，直接重寫

## Data Model Changes

### ProductionTask -- 移除欄位

移除 equipment-color-cost change 新增的 5 個顏色欄位：
- `color_mono_black`（布林）
- `color_cmyk`（布林）
- `color_pantone_multiplier`（小數）
- `color_metallic_multiplier`（小數）
- `color_metallic_min_multiplier`（小數）

### ProductionTask -- 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 正面色數 | front_color_count | 整數 | | | 範圍 0-8；0 代表不印、1 代表單色（單黑）、>=2 為彩色（CMYK 或更多） |
| 背面色數 | back_color_count | 整數 | | | 同上 |
| 特殊色 | special_colors | 陣列 | | | `Array<'pantone' \| 'metallic' \| 'metallic_min'>`；空陣列代表無特殊色；元素受設備能力約束 |

### ProductionTask -- 保留欄位

- `estimated_equipment_cost`（小數，唯讀）：計算公式重寫，欄位保留
- `planned_equipment`（字串或 FK）：保留
