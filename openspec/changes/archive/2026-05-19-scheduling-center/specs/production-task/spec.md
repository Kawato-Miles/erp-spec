## MODIFIED Requirements

### Requirement: 派工板

系統 SHALL 提供排程中心作為印務的主要排程工作介面，取代原有在各工單詳情頁逐筆排程的方式。排程中心 SHALL 顯示跨工單的所有待排程生產任務，以設備佇列為核心組織方式。

原有工單詳情頁的排程功能調整為排程預覽（唯讀），顯示該工單各生產任務在排程中心的排程狀態。

#### Scenario: 印務查看待排程任務

- **WHEN** 印務開啟排程中心
- **THEN** 系統 SHALL 在待排區顯示所有待排程的生產任務，包含工單資訊、工序、印件名稱、交貨日期
- **AND** 系統 SHALL 在設備佇列區顯示各設備的已排程任務

#### Scenario: US-WO-013 查看派工板（待派工的生產任務清單）

- **WHEN** 印務主管進入排程中心
- **THEN** 系統 SHALL 在待排區列出所有待派工的生產任務，按交貨日期排序，每筆任務 MUST 顯示：任務編號、所屬工單、交貨日期、預計工作量、所屬工廠類型
- **AND** 系統 SHALL 在設備佇列區顯示已排入設備的任務清單與自動推算的日期

### Requirement: 設備選擇與工廠指定

系統 SHALL 在排程中心以設備佇列方式完成設備選擇。印務將任務拖入對應設備佇列即完成設備指定，系統自動設定 equipment_id。工廠依工序自動決定（唯讀）。

#### Scenario: 印務為生產任務選擇設備

- **WHEN** 印務在排程中心將生產任務拖入「海德堡四色機」佇列
- **THEN** 系統 SHALL 自動設定該任務的 equipment_id 為該設備 ID
- **AND** planned_equipment SHALL 記錄該設備名稱（向下相容）

#### Scenario: 工序不需要設備

- **WHEN** 某工序不需要指定設備
- **THEN** 系統允許跳過設備選擇，該任務 SHALL 在待排區標示「免排設備」
- **AND** 印務可直接設定開工日期與工期，不需排入設備佇列

#### Scenario: US-WO-014 為生產任務選擇設備

- **WHEN** 印務主管在排程中心查看待排任務
- **THEN** 若工序需要設備，印務 SHALL 將任務拖入對應設備佇列完成設備指定
- **AND** 若工序不需要設備，系統 MUST 在待排區標示「免排設備」，印務可直接設定日期

### Requirement: 開工日期設定與完工推算

系統 SHALL 在排程中心透過佇列式自動推算完成開工日期與完工日設定。印務將任務排入設備佇列後，系統依佇列順序自動推算 scheduled_date 與 planned_end_date，印務不需手動逐筆填寫。

印務仍可手動覆蓋 scheduled_date（產生佇列空隙），系統 SHALL 即時重算後續任務日期。

自有工廠的 planned_end_date 推算規則維持不變：scheduled_date + estimated_duration_days（跳過週日）。外包廠的 planned_end_date 維持印務手動填寫。

#### Scenario: 印務設定開工日期（佇列自動推算）

- **WHEN** 印務將生產任務排入海德堡佇列第 3 位，前 2 位任務的預計完工日為 4/3
- **THEN** 系統 SHALL 自動推算該任務 scheduled_date 為 4/4
- **AND** 系統 SHALL 依 estimated_duration_days 推算 planned_end_date

#### Scenario: US-WO-015 手動設定開工日期與完工推算

- **WHEN** 印務主管在排程中心手動覆蓋某任務的開工日期
- **THEN** 系統 SHALL 保留手動設定的日期
- **AND** 系統 SHALL 即時重算後續佇列任務的日期
- **AND** 印務主管 MUST 確認推算完工日期是否在交貨日期之前

### Requirement: 設備/工廠負載視圖

系統 SHALL 在排程中心以三週滾動時間軸提供設備負載視覺化。時間軸以設備為縱軸、日期為橫軸，甘特圖呈現各設備佇列的排程分布與負載狀況。

#### Scenario: 印務查看設備負載

- **WHEN** 印務在排程中心查看時間軸視圖
- **THEN** 系統 SHALL 以甘特圖顯示各設備已排定的任務時段
- **AND** 每台設備 SHALL 標示負載摘要（已排天數 / 可用天數）

#### Scenario: US-WO-017 查看設備/工廠負載視圖

- **WHEN** 印務主管在排程中心查看時間軸
- **THEN** 系統 SHALL 以日期軸搭配設備軸展示時間軸與任務分布
- **AND** 系統 MUST 清晰標示目前負荷狀況，輔助識別過載時段

### Requirement: 工序相依性管理

系統 SHALL 在排程中心以「階段」（stage_order）管理工序相依性。同工單內同階段的任務可平行執行，跨階段任務須依序執行。

排入設備佇列時，系統 SHALL 檢查前置階段任務的排程狀態，以提示方式呈現（不阻擋排入操作）。日期推算時 SHALL 自動考慮相依性約束。

#### Scenario: 生管管理工序順序

- **WHEN** 印務在排程中心查看某工單的多工序任務
- **THEN** 系統 SHALL 依 stage_order 標示各任務的階段歸屬
- **AND** 排入設備佇列時，系統 SHALL 提示前置階段任務的排程狀態
- **AND** 日期推算 SHALL 自動確保後置階段的開工日不早於前置階段的完工日

### Requirement: 重新排程

系統 SHALL 支援印務在排程中心隨時調整已排程任務的設備或佇列位置。調整後系統 SHALL 自動重算所有受影響任務的日期。重新排程不受生產任務狀態機限制。

#### Scenario: 印務調整已交付任務的排程

- **WHEN** 印務在排程中心將已排入設備的任務移到另一台設備或調整佇列順序
- **THEN** 系統 SHALL 更新 equipment_id 與 queue_position
- **AND** 系統 SHALL 自動重算所有受影響任務的 scheduled_date 與 planned_end_date
- **AND** 不影響生產任務狀態轉換

## ADDED Requirements

### Requirement: 排程兩階段分離

系統 SHALL 將生產任務管理分為兩個獨立階段：建立階段（Phase 1）與排程階段（Phase 2）。

建立階段：印務在工單詳情頁建立生產任務，設定工序、數量、工廠等基本資料。此階段 MUST NOT 要求填寫開工日期與工期。

排程階段：印務在排程中心將任務排入設備佇列，系統自動推算日期。此階段完成設備指定與日期推算。

#### Scenario: 建立生產任務時不需填寫排程資訊

- **WHEN** 印務在工單詳情頁新增生產任務
- **THEN** 系統 SHALL 要求填寫：工序、數量、工廠類型等基本資料
- **AND** 系統 MUST NOT 要求填寫 scheduled_date 與 estimated_duration_days
- **AND** 新建的任務 SHALL 自動出現在排程中心的待排區

#### Scenario: 排程中心完成排程資訊

- **WHEN** 印務在排程中心將生產任務排入設備佇列
- **THEN** 系統 SHALL 自動推算 scheduled_date 與 planned_end_date
- **AND** 系統 SHALL 自動帶入 estimated_duration_days 預設值（若未填寫）

## Data Model Changes

### ProductionTask（新增欄位）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 設備 | equipment_id | FK | | | FK -> Equipment，排入設備佇列時設定 |
| 佇列位置 | queue_position | 整數 | | | 在設備佇列中的排序位置，排入時設定 |
| 外包預計回廠日 | expected_return_date | 日期 | | | 外包類任務，印務填寫與廠商確認的預計回廠日期 |
| 階段序號 | stage_order | 整數 | | | 同工單內的工序階段序號（1 = 第一階段，同階段可平行），預設 1 |

### ProductionTask（修改欄位）

| 欄位 | 英文名稱 | 變更說明 |
|------|----------|---------|
| 預計執行日 | scheduled_date | 從必填改為選填（建立時不填，排入佇列時系統自動推算）|
| 計畫設備 | planned_equipment | 保留文字欄位作向下相容，新增 equipment_id FK 作為主要參照 |
