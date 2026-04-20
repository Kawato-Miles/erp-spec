## MODIFIED Requirements

### Requirement: 設備預計成本計算

系統 SHALL 將設備預計成本（`estimated_equipment_cost`）計為設備的開機費（`setup_fee`）。色數相關的加價（單黑、CMYK、Pantone 倍率、金/銀/白/螢光倍率、最低色數倍率）已拆出為 `estimated_color_cost`（詳見 Requirement「色數加價計算」），歸屬工序本身，不再併入 `estimated_equipment_cost`。任何影響因子（`setup_fee`、設備）變動時，系統 SHALL 即時重算。

計算公式：

```
estimated_equipment_cost = 設備.setup_fee ?? 0
```

#### Scenario: 設備有開機費

- **WHEN** 印務為生產任務選擇設備，該設備 `setup_fee = 3000`
- **THEN** `estimated_equipment_cost` SHALL = 3000

#### Scenario: 設備無開機費

- **WHEN** 設備的 `setup_fee` 為 null
- **THEN** `estimated_equipment_cost` SHALL = 0

#### Scenario: 設備未指定

- **WHEN** 生產任務尚未設定設備（`planned_equipment` 為 null）
- **THEN** `estimated_equipment_cost` MUST NOT 計算，UI 顯示為「待排程」

#### Scenario: 色數不再影響設備預計成本

- **WHEN** 印務修改色數選項（front/back/特殊色）
- **THEN** `estimated_equipment_cost` MUST NOT 受影響
- **AND** 色數變動僅影響 `estimated_color_cost`

## ADDED Requirements

### Requirement: 色數加價計算

系統 SHALL 計算色數加價（`estimated_color_cost`）作為生產任務的變動成本，歸屬工序本身，僅對 `bom_type = process` 的生產任務有效。色數加價依生產任務的顏色選項（`front_color_count` / `back_color_count` / `special_colors`）、所綁定設備的 `pricing_tiers` 與特殊色倍率、及目標印量自動計算。任一影響因子變動時，系統 SHALL 即時重算。

計算公式：

```
units = pt_target_qty / (500 or 1000)     # 依設備 pricing_unit: 令 / 千車
tier  = findPricingTier(units, 設備.pricing_tiers)
basic_cost  = front_color_count × (單色單價) × units
            + back_color_count × (單色單價) × units
              （色數 = 1 套 mono_price_per_color；色數 ≥ 2 套 cmyk_price_per_color）
special_cost = Σ tier.cmyk_price_per_color × multiplier × units
              （逐一計算每個特殊色類型：Pantone / 金銀白螢光 / 最低色數）
estimated_color_cost = basic_cost + special_cost
```

#### Scenario: 工序類生產任務計色數加價（CMYK 四色）

- **WHEN** `bom_type = process`，`front_color_count = 4`、`back_color_count = 0`，設備 `cmyk_price_per_color = 800/令`，`pt_target_qty = 5000 張`
- **THEN** `units = 10`，`basic_cost = 4 × 800 × 10 = 32,000`
- **AND** `estimated_color_cost` SHALL = 32,000

#### Scenario: 工序類生產任務計色數加價（CMYK + Pantone）

- **WHEN** `bom_type = process`，`front_color_count = 4`，`special_colors = ['pantone']`，設備 `cmyk_price_per_color = 800`、`pantone_multiplier = 2`，`pt_target_qty = 5000`
- **THEN** `units = 10`，`basic_cost = 32,000`，`special_cost = 800 × 2 × 10 = 16,000`
- **AND** `estimated_color_cost` SHALL = 48,000

#### Scenario: 材料類生產任務不計色數加價

- **WHEN** `bom_type = material`
- **THEN** `estimated_color_cost` MUST 為 null（UI 不顯示色數輸入）

#### Scenario: 裝訂類生產任務不計色數加價

- **WHEN** `bom_type = binding`
- **THEN** `estimated_color_cost` MUST 為 null（UI 不顯示色數輸入）

#### Scenario: 設備不支援色數加價

- **WHEN** 生產任務設備 `supports_colors = false`
- **THEN** `estimated_color_cost` SHALL = 0
- **AND** UI 色數輸入欄位 SHALL 為 disabled，顯示說明「此設備（設備名）僅計開機費，不計色數加價」

#### Scenario: 未指定設備

- **WHEN** 生產任務尚未設定設備
- **THEN** `estimated_color_cost` MUST NOT 計算
- **AND** UI 色數輸入 SHALL 為 disabled，顯示「請先選擇設備」

#### Scenario: 切換設備時保留色數 state

- **WHEN** 印務在支援色數的設備 A 填入色數值後，切換至不支援色數的設備 B
- **THEN** 系統 SHALL 保留色數 state（`front_color_count` / `back_color_count` / `special_colors` 不清空）
- **AND** UI 色數欄位顯示為 disabled 灰階
- **AND** 印務再切回支援色數的設備 C 時，原色數值 SHALL 自動恢復可編輯

#### Scenario: 色數選項變更觸發重算

- **WHEN** 印務在 `bom_type = process` 的生產任務修改色數選項（如新增 Pantone）
- **THEN** 系統 SHALL 即時重算 `estimated_color_cost` 並更新顯示
- **AND** `estimated_equipment_cost` MUST NOT 受影響

## Data Model Changes

### ProductionTask -- 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 色數加價 | estimated_color_cost | 小數 | | Y | 變動成本，歸屬工序。僅 `bom_type = process` 時計算；未指定設備或設備 `supports_colors = false` 時為 null / 0 |

### ProductionTask -- 修改欄位

| 欄位 | 英文名稱 | 變更 | 說明 |
|------|----------|------|------|
| 設備預計成本 | estimated_equipment_cost | 語意修訂 | 原本包含 setup_fee + 色數加價，現 **縮為只含 setup_fee**；色數加價移至 `estimated_color_cost` |
