## ADDED Requirements

### Requirement: 設備主檔基本屬性

設備主檔 SHALL 記錄每台設備的基本識別與計價屬性，供生產任務、排程、成本計算等模組引用。

#### Scenario: 設備主檔欄位定義

- **WHEN** 系統維護一筆設備資料
- **THEN** 該設備 SHALL 包含：識別欄位（id、名稱、類型、是否啟用、顯示順序）、計價相關屬性（計價單位、開機費、區間階梯定價、硬性倍率）、是否支援顏色選項（supports_colors）、機械規格（每日可用時數）
- **AND** 系統 MUST 確保設備類型為預定義枚舉之一：`平板印刷` / `數位印刷` / `大圖輸出`

### Requirement: 設備計價單位

每台設備 SHALL 設定其計價單位為「令」或「千車」，用於將生產數量換算為計價基礎。

計價單位定義：
- **令**：1 令 = 500 張
- **千車**：1 千車 = 1000 張

#### Scenario: 平板印刷設備以令計價

- **WHEN** 設備「海德堡 XL106」pricingUnit = `令`
- **THEN** 成本計算時 SHALL 將目標印量（張）除以 500 換算為令數
- **AND** pricingTiers 的 minQty / maxQty 單位 SHALL 解讀為「令數」

#### Scenario: 數位印刷設備以千車計價

- **WHEN** 設備「Indigo 7900」pricingUnit = `千車`
- **THEN** 成本計算時 SHALL 將目標印量（張）除以 1000 換算為千車數
- **AND** pricingTiers 的 minQty / maxQty 單位 SHALL 解讀為「千車數」

### Requirement: 開機費

每台設備 SHALL 可設定開機費（setupFee），代表使用該設備每次生產任務的固定成本。

#### Scenario: 成本計算納入開機費

- **WHEN** 設備「海德堡 XL106」setupFee = 500（元）
- **THEN** 任何使用該設備的生產任務 SHALL 在 estimated_equipment_cost 加計 500 元開機費
- **AND** 若設備 setupFee 未設定（null / 0），SHALL 不加計開機費

### Requirement: 色數區間階梯定價

設備的印工單價 SHALL 以色數區間（pricingTiers）表達，每個區間以印量範圍（minQty ~ maxQty）對應「單黑單價」（monoPricePerColor）與「彩色單價」（cmykPricePerColor）。

區間規則：
- minQty、maxQty 單位依設備 pricingUnit 解讀（令數 或 千車數）
- maxQty = `null` 代表無上限（∞）
- 多個 tier SHALL 依 minQty 遞增排列，相鄰 tier 的 maxQty 與下一 tier 的 minQty SHALL 連續（前一 tier 的 maxQty = 下一 tier 的 minQty）
- 每單位印量 SHALL 對應唯一的 tier

#### Scenario: 階梯定價符合 Figma 設計範例

- **WHEN** 設備「海德堡 XL106」pricingUnit = `千車`，pricingTiers 為：
  ```
  tier1: 1~2 千車 → 單黑 250 / CMYK 300（元/色）
  tier2: 2~3 千車 → 單黑 200 / CMYK 250
  tier3: 4~5 千車 → 單黑 150 / CMYK 200
  tier4: 6~∞ 千車 → 單黑 100 / CMYK 150
  ```
- **THEN** 生產任務目標印量 2,500 張 → 2.5 千車 → 落在 tier2（2~3 千車）
- **AND** 該生產任務的基本色單價 SHALL 為 單黑 200 元/色 或 CMYK 250 元/色

#### Scenario: 印量超過最高 tier

- **WHEN** 設備 pricingTiers 最高 tier 為 6~∞ 千車
- **AND** 生產任務目標印量 = 10 千車
- **THEN** 系統 SHALL 取最高 tier（maxQty = null）的單價

#### Scenario: 印量低於最低 tier

- **WHEN** 設備 pricingTiers 最低 tier 為 1~2 千車（minQty = 1）
- **AND** 生產任務目標印量 = 0.5 千車（500 張）
- **THEN** 系統 SHALL 取最低 tier 的單價（寬鬆策略），並在 UI 標記「低於最低區間，已採最低區間單價」

### Requirement: 特殊色等效單色規則（硬性倍率）

設備主檔 SHALL 定義三種特殊色倍率，用於將特殊色印工換算為等效單色成本：

- `pantoneMultiplier`：Pantone 專色倍率
- `metallicMultiplier`：金/銀/白/螢光倍率（一般設定）
- `metallicMinMultiplier`：單金/銀/白/螢光色最低色數倍率（印量極少的專色印刷加成）

這些倍率 SHALL 為設備主檔硬性規則，MUST NOT 在生產任務層級覆寫。

#### Scenario: 倍率固定取自設備主檔

- **WHEN** 設備「海德堡 XL106」pantoneMultiplier = 2、metallicMultiplier = 3、metallicMinMultiplier = 4
- **THEN** 生產任務選用該設備後，特殊色成本計算 SHALL 固定使用該組倍率
- **AND** 生產任務 UI SHALL 以唯讀方式顯示倍率值
- **AND** 系統 MUST NOT 允許印務在生產任務上修改倍率

#### Scenario: 設備無倍率定義時特殊色不可選

- **WHEN** 設備 `metallicMultiplier = null`
- **AND** 生產任務特殊色陣列包含 `金` / `銀` / `白` / `螢光` 任一項
- **THEN** 系統 SHALL 禁止此組合並在 UI 顯示「此設備不支援金銀白螢光印刷」

### Requirement: 支援顏色的 Gate（保留 equipment-color-cost 已實作行為）

設備主檔 SHALL 以 `supportsColors: boolean` 欄位標記是否支援顏色選項。生產任務選擇 `supportsColors = false` 的設備（如膠裝機、裁切機）時，顏色 UI 區塊 SHALL 完全隱藏，色數與特殊色 MUST NOT 參與成本計算。

#### Scenario: 膠裝機不顯示顏色選項

- **WHEN** 生產任務選擇「膠裝機」（supportsColors = false）
- **THEN** 顏色 UI（色數輸入 + 特殊色 chip + 倍率顯示）SHALL 完全隱藏
- **AND** estimated_equipment_cost SHALL 不計算顏色相關成本（只計 setupFee，若有）

## Data Model

### Equipment -- 完整欄位定義

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 識別碼 | id | 字串 | Y | Y | 唯一識別 |
| 名稱 | name | 字串 | Y | | 設備顯示名稱 |
| 設備類型 | equipment_type | 枚舉 | Y | | `平板印刷` / `數位印刷` / `大圖輸出` |
| 工序類型 | process_type | 字串 | Y | | 可執行的工序類型（印刷、上光、裁切等） |
| 是否啟用 | is_active | 布林 | Y | | false 時不出現在生產任務選單 |
| 顯示順序 | display_order | 整數 | Y | | UI 排序 |
| 每日可用時數 | daily_available_hours | 小數 | Y | | 每日可用時數（預設 8.0） |
| 是否支援顏色選項 | supports_colors | 布林 | Y | | true 才在 ProductionTask 顯示顏色 UI |
| 計價單位 | pricing_unit | 枚舉 | Y | | `令` / `千車`；決定 pricingTiers 區間單位 |
| 開機費 | setup_fee | 小數 | | | 每次生產任務加計一次；null 代表不收 |
| 區間階梯定價 | pricing_tiers | 陣列 | | | 見下方子欄位；supports_colors = false 時可為空陣列 |
| Pantone 倍率 | pantone_multiplier | 小數 | | | 硬性，ProductionTask 不可覆寫；null 代表此設備不支援 Pantone |
| 金銀白螢光倍率 | metallic_multiplier | 小數 | | | 硬性；null 代表不支援 |
| 最低色數倍率 | metallic_min_multiplier | 小數 | | | 硬性；null 代表不支援 |

### Equipment.pricingTiers -- 子欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|----------|------|------|------|
| 最小印量 | min_qty | 整數 | Y | 區間下界（含），依設備 pricing_unit 解讀 |
| 最大印量 | max_qty | 整數 \| null | | 區間上界（含）；null 代表無上限 |
| 單黑單價 | mono_price_per_color | 小數 | Y | 元/色；此區間內單色（色數 = 1）的每色單價 |
| 彩色單價 | cmyk_price_per_color | 小數 | Y | 元/色；此區間內彩色（色數 >= 2）的每色單價，亦為特殊色倍率基礎價 |

### Equipment -- 移除欄位

移除以下既有欄位（由 pricingTiers 取代）：
- `mono_black_unit_price`（單黑單價，原單一值）
- `cmyk_unit_price`（CMYK 單價，原單一值）

**Migration**：equipment-color-cost change 定義的 `monoBlackUnitPrice / cmykUnitPrice` 為過渡模型，由本 change 的 pricingTiers 取代。Prototype 無 production 資料，mock data 直接重寫。
