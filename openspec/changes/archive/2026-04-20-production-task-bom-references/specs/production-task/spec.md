## ADDED Requirements

### Requirement: BOM 多形引用

系統 SHALL 支援生產任務多形引用三個 BOM master（material-master / process-master / binding-master）。每筆生產任務以 `bom_type` 欄位決定引用的 master 類型，並以三個互斥 FK 欄位（`material_spec_id` / `process_id` / `binding_id`）指向對應的 master 記錄；其中恰好一個 FK 有值，其餘 MUST 為 null。

#### Scenario: 生產任務引用材料規格

- **WHEN** 印務為生產任務選擇材料類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = material`，`material_spec_id` 指向 material-master 的 MaterialSpec
- **AND** `process_id` 與 `binding_id` MUST 為 null

#### Scenario: 生產任務引用工序

- **WHEN** 印務為生產任務選擇工序類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = process`，`process_id` 指向 process-master 的 Process
- **AND** `material_spec_id` 與 `binding_id` MUST 為 null

#### Scenario: 生產任務引用裝訂

- **WHEN** 印務為生產任務選擇裝訂類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = binding`，`binding_id` 指向 binding-master 的 Binding
- **AND** `material_spec_id` 與 `process_id` MUST 為 null

#### Scenario: 互斥 FK 約束違反時阻擋

- **WHEN** 任何操作試圖設定多於一個 BOM FK 欄位，或在 `bom_type` 有值時對應 FK 為 null
- **THEN** 系統 MUST 阻擋該操作並回報資料一致性錯誤

### Requirement: pricing_selection 混合帶入

系統 SHALL 於生產任務 Data Model 提供 `pricing_selection`、`pricing_selection_default`、`pricing_selection_overridden` 三個欄位。pricing_selection 的 JSON 形狀依 `bom_type` 與對應 master 的 pricing 類型決定。目前階段由使用者手動輸入；排程模組上線後由系統依印件內容（尺寸、印量、拼版結果、裝訂所需台數 / 頁數 / 本數）自動計算 `pricing_selection_default`，使用者仍可覆寫。

#### Scenario: 現階段使用者手動輸入 pricing_selection

- **WHEN** 印務於新增 / 編輯生產任務時選擇 BOM
- **THEN** 使用者 SHALL 手動輸入 pricing_selection
- **AND** `pricing_selection_default` SHALL 為 null
- **AND** `pricing_selection_overridden` SHALL 預設為 true

#### Scenario: 排程模組上線後自動帶入

- **WHEN** 排程模組上線，系統依印件內容為生產任務自動計算計價鍵
- **THEN** 系統 SHALL 寫入 `pricing_selection_default` 與 `pricing_selection`（初始兩者相等）
- **AND** `pricing_selection_overridden` SHALL 預設為 false

#### Scenario: 使用者覆寫排程預設值

- **WHEN** 排程帶入後使用者手動修改 `pricing_selection`
- **THEN** 系統 SHALL 保留 `pricing_selection_default` 原值，更新 `pricing_selection` 為新值
- **AND** `pricing_selection_overridden` SHALL 設為 true

#### Scenario: pricing_selection 形狀依 bom_type 決定

- **WHEN** 系統儲存或讀取 pricing_selection
- **THEN** JSON 形狀 MUST 遵循下列對應：

  | bom_type | 引用 master | pricing_selection 形狀 |
  |----------|-----------|----------------------|
  | material | MaterialSpec | 依 Material.pricing_type：按重量 `{ size_name }`；按面積 `{ area_range_id, qty_range_id }`；按數量 `{ qty_tier_id }` |
  | process | Process | 依 Process.pricing_method：巢狀 `{ x_range_id, y_range_id }`；單一 `{ tier_id }` |
  | binding | Binding | 統一 `{ x_axis_id, y_axis_id }` |

### Requirement: BOM 單價回查與成本計算

系統 SHALL 依生產任務的 `bom_type` + FK + `pricing_selection` 回查對應 master 的 pricing rule 表，取得單價後套用相關調整邏輯（最低金額等）計算材料 / 工序 / 裝訂成本。

#### Scenario: 材料成本計算

- **WHEN** 生產任務 bom_type = material
- **THEN** 系統 SHALL 依 MaterialSpec 的 pricing_type 與 pricing_selection 查 material-master 定義的對應 pricing rule（PricingRuleWeightBased / AreaBased / QtyBased）
- **AND** 成本 = 單價 × 實際用量（用量換算規則於 material-master spec 定義）

#### Scenario: 工序成本計算

- **WHEN** 生產任務 bom_type = process
- **THEN** 系統 SHALL 依 Process 的 pricing_method 與 pricing_selection 查 process-master 定義的 ProcessPricingMatrix 或 ProcessPricingTier
- **AND** 成本 = 單價 × 實際用量（依 tier_type 或 Matrix 語意）

#### Scenario: 裝訂成本計算

- **WHEN** 生產任務 bom_type = binding
- **THEN** 系統 SHALL 依 pricing_selection 查 binding-master 定義的 BindingPricingMatrix 取得單價
- **AND** 系統 SHALL 依 binding-master § 最低金額套用邏輯計算：`unit_price_actual = max(price, min_amount_per_unit)`；`total_actual = max(unit_price_actual × qty, min_total_amount)`

#### Scenario: pricing_selection 或 FK 缺失時無法計算

- **WHEN** 生產任務 pricing_selection 為 null 或對應 FK 未設定
- **THEN** 系統 MUST NOT 計算該筆成本；UI SHALL 顯示「待設定計價」提示

## MODIFIED Requirements

### Requirement: 生產任務分類排序

系統 SHALL 支援生產任務依 BOM 分類（衍生自 `bom_type`）分組顯示，並支援分類內拖曳排序。排序順序記錄在 sort_order 欄位。分類與 `bom_type` 對應：`material` → 材料；`process` → 工序；`binding` → 裝訂。`processCategory` 欄位保留為唯讀衍生欄位，由 `bom_type` 推導，不可直接寫入。

#### Scenario: 印務查看分類排序的生產任務

- **WHEN** 印務在工單詳情頁查看生產任務清單
- **THEN** 系統 SHALL 依 `bom_type` 衍生的分類分為三組：材料、工序、裝訂
- **AND** 各組內的生產任務 SHALL 依 sort_order 升冪排列
- **AND** 三組的顯示順序固定為：材料 → 工序 → 裝訂

#### Scenario: 印務拖曳排序生產任務

- **WHEN** 印務在工單詳情頁拖曳某生產任務至同分類內的新位置
- **THEN** 系統 SHALL 更新該分類內所有受影響生產任務的 sort_order
- **AND** 拖曳 MUST 限制在同一 `bom_type` 對應的分類內，不可跨分類

#### Scenario: 新增生產任務時自動設定 sort_order

- **WHEN** 印務新增一筆生產任務，設定 bom_type = process
- **THEN** 系統 SHALL 將新任務的 sort_order 設為「工序」分類內現有最大值 + 1
- **AND** 新任務 SHALL 出現在「工序」分類的最後一筆

#### Scenario: processCategory 為唯讀衍生欄位

- **WHEN** 任何操作試圖直接寫入 `processCategory`
- **THEN** 系統 MUST 阻擋該寫入
- **AND** `processCategory` 值 SHALL 由 `bom_type` 依上述對應自動推導

## Data Model Changes

### ProductionTask -- 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| BOM 類型 | bom_type | 單選 | Y | | material / process / binding |
| 材料規格 | material_spec_id | FK | | | FK -> material-master 的 MaterialSpec；bom_type = material 時必填，其餘為 null |
| 裝訂 | binding_id | FK | | | FK -> binding-master 的 Binding；bom_type = binding 時必填，其餘為 null |
| 計價選擇 | pricing_selection | JSON | | | 形狀依 bom_type 與 master pricing 類型決定 |
| 計價預設值 | pricing_selection_default | JSON | | | 排程模組上線後由系統依印件內容自動計算 |
| 計價覆寫標記 | pricing_selection_overridden | 布林值 | Y | | 預設 true（現階段手動）；排程上線後預設 false，使用者覆寫時設 true |

### ProductionTask -- 修改欄位

| 欄位 | 英文名稱 | 變更 | 說明 |
|------|----------|------|------|
| 工序 | process_id | FK 目標變更 | 原 FK -> 簡化版 Process；改為 FK -> process-master 的 Process；bom_type = process 時必填，其餘為 null |
| 工序分類 | processCategory | enum -> 衍生 | 原為獨立 enum 欄位；改為唯讀衍生欄位（從 bom_type 推導） |

### Process（內部簡化版）-- 刪除

原 production-task spec 中定義的 `Process { id UUID, name 字串, category 單選(材料/工序/裝訂) }` 資料表刪除。所有 Process 引用 SHALL 指向 process-master spec 定義的完整 Process 表。

### 資料一致性約束

- **互斥 FK**：依 `bom_type`，恰好 `material_spec_id` / `process_id` / `binding_id` 其中一個有值；其餘 MUST 為 null
- **pricing_selection 形狀驗證**：應用層依 `bom_type` 與對應 master 的 pricing 類型驗證 JSON 結構
- **processCategory 唯讀**：不可直接寫入；由 `bom_type` 衍生（material → 材料 / process → 工序 / binding → 裝訂）
