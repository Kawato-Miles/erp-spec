## ADDED Requirements

### Requirement: 工單區域設定

系統 SHALL 在建立工單時要求設定 region（台灣/中國），作為該工單下生產任務可用工廠類別的篩選依據。region 設定後不可變更。

#### Scenario: 印務主管建立台灣工單

- **WHEN** 印務主管建立工單並設定 region 為「台灣」
- **THEN** 系統 SHALL 記錄工單 region 為台灣
- **AND** 該工單下新增生產任務時，factory_type 僅可選擇：自有工廠、加工廠、外包廠

#### Scenario: 印務主管建立中國工單

- **WHEN** 印務主管建立工單並設定 region 為「中國」
- **THEN** 系統 SHALL 記錄工單 region 為中國
- **AND** 該工單下新增生產任務時，factory_type 僅可選擇：中國廠商

#### Scenario: 同一印件拆分台灣與中國工單

- **WHEN** 印務主管為同一印件建立多張工單，其中 2 張 region 為台灣、1 張 region 為中國
- **THEN** 系統 SHALL 允許同一印件下存在不同 region 的工單
- **AND** 齊套性計算 SHALL 不區分 region，仍以所有工單的 min() 計算

#### Scenario: region 設定後不可變更

- **WHEN** 工單 region 已設定，印務嘗試修改 region
- **THEN** 系統 MUST 阻擋修改，region 為唯讀欄位

### Requirement: 印務印件篩選

系統 SHALL 在印件總覽提供「只顯示我參與的印件」篩選功能，讓印務快速查看自己負責的工單所屬印件。

#### Scenario: 印務篩選參與的印件

- **WHEN** 印務在印件總覽開啟「只顯示我參與的印件」篩選
- **THEN** 系統 SHALL 僅顯示印件下有任何 WorkOrder.assigned_to 等於當前印務的印件
- **AND** 印件展開後 SHALL 顯示該印件下所有工單（含其他印務負責的工單）的狀態與進度

#### Scenario: 印務查看跨印務協作的印件

- **WHEN** 印件 A 下有工單 1（印務甲負責）和工單 2（印務乙負責），印務甲使用篩選
- **THEN** 印務甲 SHALL 可看到印件 A
- **AND** 印件 A 展開後 SHALL 顯示工單 1 和工單 2 的狀態
- **AND** 印務甲 SHALL 可查看工單 2 的進度但 MUST NOT 編輯工單 2 的內容

## MODIFIED Requirements

### Requirement: 印務主管印件總覽（防掉單）

系統 SHALL 提供印務主管專用的印件總覽，以印件為起點追蹤工單建立與生產狀態，確保審稿通過的印件不遺漏建立工單。

印件總覽 SHALL 使用狀態機的印製維度狀態作為篩選 Tab 與狀態顯示：等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達。不得使用非狀態機的自訂狀態標籤。

每個印件項目 SHALL 顯示：印件名稱、案名（來自所屬訂單 case_name）、客戶名稱、訂單編號、交貨日期、印製狀態、完成度、工單數量。案名、客戶、訂單編號 SHALL 為獨立欄位，不合併顯示。

當印件有多張工單時（如拆給不同印務），展開列 SHALL 列出各工單的狀態與負責印務，並顯示進度摘要（如「3/5 工單已審核完成」）。

印務主管 SHALL 可在印件總覽上執行「分配印件」操作：一次完成工單草稿建立（可多份，各自設定工單類型與 region）與印務指派。尚未建立工單的印件（等待中且工單數為 0）優先顯示。

#### Scenario: 印務主管查看待分配印件

- **WHEN** 印務主管開啟印件總覽，篩選「等待中」
- **THEN** 系統 SHALL 顯示所有印製狀態為「等待中」的印件
- **AND** 尚未建立工單的印件 SHALL 置頂顯示

#### Scenario: 印務主管分配印件

- **WHEN** 印務主管點擊某印件的「分配印件」按鈕
- **THEN** 系統 SHALL 顯示分配表單（可新增多張工單，每張設定工單類型、region 與指派印務）
- **AND** 提交後，系統建立工單草稿並記錄指派

#### Scenario: 印件跨多張工單分組顯示

- **WHEN** 某印件有多個組件，對應多張工單分別指派給不同印務
- **THEN** 展開列 SHALL 列出各工單的狀態與負責印務
- **AND** SHALL 顯示進度摘要（如「4/5 工單已審核完成」）

#### Scenario: 印件總覽顯示案名與訂單資訊

- **WHEN** 印務主管在印件總覽查看印件列表
- **THEN** 每個印件項目 SHALL 獨立顯示案名、客戶名稱、訂單編號三個欄位
- **AND** 案名 SHALL 來自所屬訂單的 case_name 欄位

## MODIFIED Data Model

### WorkOrder

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工單編號 | wo_no | 字串 | Y | Y | 系統自動產生，格式 W-[YYYYMMDD]-[NN] |
| 印件 | print_item_id | FK | Y | Y | FK -> 印件 |
| 工單類型 | type | 單選 | Y | | 打樣 / 大貨 |
| 區域 | region | 單選 | Y | Y | 台灣 / 中國（建立時設定，不可變更） |
| 工單狀態 | status | 單選 | Y | | 依狀態機定義 |
| 負責人 | assigned_to | FK | Y | | 負責排程人員 |
| 每份印件生產數量 | quantity_per_print_item | 小數 | Y | | 每份印件需生產數量 |
| 目標數量 | wo_target_qty | 整數 | Y | | 工單目標生產數量 |
| 生產數量 | wo_produced_qty | 整數 | | Y | 報工累計 |
| 入庫數量 | wo_warehouse_qty | 整數 | | Y | QC 通過，齊套性邏輯計算結果 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |
