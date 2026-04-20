## ADDED Requirements

### Requirement: BOM 行項目管理

系統 SHALL 支援工單下的印件（PrintItem）以 `BOMLineItem` 資料表記錄 BOM 行項目。每筆 BOMLineItem 對應一項 BOM 類型（材料 / 工序 / 裝訂），透過 `bom_type` + 三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）指向 BOM 底層 master（material-master / process-master / binding-master）的對應記錄。

#### Scenario: BOMLineItem 多形引用三個 master

- **WHEN** 印件定義其所需的材料 / 工序 / 裝訂
- **THEN** 系統 SHALL 為每項 BOM 建立一筆 BOMLineItem
- **AND** 依 BOM 類型設定 `bom_type`，指向對應 master 的 FK；其餘兩個 FK MUST 為 null

#### Scenario: BOMLineItem 記錄預計用量與產線

- **WHEN** 印件填入 BOM 行項目
- **THEN** 每筆 BOMLineItem SHALL 記錄：`quantity_per_work_order`（每份工單的預計用量）、`factory_type`（工廠類別）、`production_line_id`（產線 FK）
- **AND** 產線 SHALL 依 factory_type 自動帶入：外包廠 -> 外包廠產線；中國廠商 -> 中國廠商產線；自有 / 加工廠 -> 對應的自有產線

### Requirement: 依 BOM 展開生產任務時帶入 BOM 引用欄位

系統 SHALL 於工單依 BOM 展開生產任務時，為每筆 BOMLineItem 產生一筆 ProductionTask，並將下列欄位從 BOMLineItem 複製或衍生至 ProductionTask：`bom_type`、三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）、`production_line_id`、`factory_type`。

展開後，系統 SHALL 為每筆 ProductionTask 依印件內容（尺寸、印量、拼版結果、裝訂所需台數 / 頁數 / 本數）計算 `pricing_selection_default`，並初始化 `pricing_selection = pricing_selection_default`、`pricing_selection_overridden = false`。

現階段（排程模組上線前）`pricing_selection_default` 為 null，`pricing_selection` 由印務手動輸入、`pricing_selection_overridden = true`（詳見 production-task spec § pricing_selection 混合帶入）。

#### Scenario: 工單自動展開帶入 BOM 引用

- **WHEN** 系統依印件的 BOMLineItem 清單展開建立生產任務
- **THEN** 每筆生產任務 SHALL 複製對應 BOMLineItem 的 `bom_type` 與三個互斥 FK
- **AND** `production_line_id` 與 `factory_type` SHALL 從 BOMLineItem 帶入
- **AND** 展開後 BOMLineItem 與 ProductionTask 之間 SHALL 維持可追溯的關聯（FK 或 source_bom_line_item_id）

#### Scenario: 排程模組上線時自動計算 pricing_selection_default

- **WHEN** 排程模組上線並開立生產任務
- **THEN** 系統 SHALL 依印件內容計算 pricing_selection_default 並寫入生產任務
- **AND** pricing_selection 初始值 SHALL 等於 pricing_selection_default
- **AND** pricing_selection_overridden SHALL 預設為 false

#### Scenario: 現階段展開後使用者手動輸入 pricing_selection

- **WHEN** 排程模組尚未上線，工單展開生產任務後
- **THEN** pricing_selection_default SHALL 為 null
- **AND** pricing_selection SHALL 等待印務手動輸入，pricing_selection_overridden SHALL 預設為 true

## MODIFIED Requirements

### Requirement: 工單草稿建立

系統 SHALL 支援兩種工單草稿建立方式：(1) 線上單由審稿通過後系統依 BOM 自動建立，帶入生產任務；(2) 線下單由印務主管手動建立。工單號格式：W-[YYYYMMDD]-[NN]。

BOM 展開建立生產任務時，系統 SHALL 依印件的 `BOMLineItem` 清單逐筆展開為 ProductionTask。每筆生產任務 SHALL 從對應 BOMLineItem 帶入下列欄位：`bom_type`、三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）、`production_line_id`、`factory_type`。外包廠的 BOMLineItem SHALL 自動帶入「外包廠」產線，中國廠商的 BOMLineItem SHALL 自動帶入「中國廠商」產線。

#### Scenario: 線上單審稿通過自動建立工單

- **WHEN** 線上單印件審稿通過
- **THEN** 系統自動建立工單草稿，依印件的 BOMLineItem 清單展開生產任務
- **AND** 每筆生產任務的 `bom_type` 與三個互斥 FK SHALL 從 BOMLineItem 複製
- **AND** 每筆生產任務的 `production_line_id` SHALL 從 BOMLineItem 自動帶入
- **AND** factory_type 為「外包廠」的 BOMLineItem，生產任務 production_line_id SHALL 自動設為「外包廠」產線
- **AND** factory_type 為「中國廠商」的 BOMLineItem，生產任務 production_line_id SHALL 自動設為「中國廠商」產線

#### Scenario: 線下單印務主管手動建立

- **WHEN** 印務主管為線下全客製品建立工單
- **THEN** 系統建立工單草稿，印務主管逐一新增生產任務
- **AND** 若印件已有 BOMLineItem，依 BOMLineItem 自動展開時，bom_type / FK / production_line_id SHALL 從 BOMLineItem 帶入
- **AND** 手動建立生產任務時，印務 SHALL 選擇 BOM 項目（材料 / 工序 / 裝訂）；系統 SHALL 依選擇設定 bom_type 與對應 FK

#### Scenario: US-WO-003 建立工單草稿並選擇類型

- **WHEN** 線上單審稿通過由系統自動建立工單草稿，或印務主管為線下單手動建立工單草稿並選擇工單類型（打樣/大貨）
- **THEN** 系統 SHALL 建立工單草稿，工單狀態為「草稿」，可供印務主管分配給印務填寫

## Data Model Changes

### BOMLineItem -- 新增資料表

定義工單下印件的 BOM 行項目，每筆對應一項材料 / 工序 / 裝訂，多形引用三個 BOM master。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬印件 | print_item_id | FK | Y | Y | FK -> PrintItem |
| BOM 類型 | bom_type | 單選 | Y | | material / process / binding |
| 材料規格 | material_spec_id | FK | | | FK -> material-master 的 MaterialSpec；bom_type = material 時必填 |
| 工序 | process_id | FK | | | FK -> process-master 的 Process；bom_type = process 時必填 |
| 裝訂 | binding_id | FK | | | FK -> binding-master 的 Binding；bom_type = binding 時必填 |
| 每份工單用量 | quantity_per_work_order | 小數 | Y | | 每份工單需此 BOM 項目的用量 |
| 工廠類別 | factory_type | 單選 | Y | | 自有工廠 / 加工廠 / 外包廠 / 中國廠商 |
| 產線 | production_line_id | FK | Y | | FK -> ProductionLine；外包廠 / 中國廠商 SHALL 自動帶入對應產線 |
| 顯示排序 | display_order | 整數 | | | 印件內的 BOM 項目排序 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**約束**：
- 依 `bom_type`，恰好 `material_spec_id` / `process_id` / `binding_id` 其中一個有值；其餘 MUST 為 null
- 工單依印件 BOM 展開生產任務時，每筆 BOMLineItem 產生一筆 ProductionTask；關聯可透過 source_bom_line_item_id（選配）保留

### ProductionTask 關聯欄位（與 BOMLineItem 對接）

本 change 僅於 work-order spec 層面定義 BOMLineItem 與 ProductionTask 的欄位複製規則；ProductionTask 的欄位定義詳見 production-task spec delta § Data Model Changes。
