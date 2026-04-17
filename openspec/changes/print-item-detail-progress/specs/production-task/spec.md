## ADDED Requirements

### Requirement: 印件詳情頁報工入口

系統 SHALL 於印件詳情頁的「工單與生產任務」區塊提供生產任務報工入口（單筆與批次），作為工單詳情頁、派工板、任務平台、供應商平台之外的新增觸發點。

報工入口的權限守門 SHALL 依以下規則執行：
- 僅當生產任務所屬 WorkOrder.assigned_to 等於當前登入印務 / 印務主管時，報工按鈕與勾選框 SHALL 可用
- 其餘狀況：報工按鈕與勾選框 MUST 為禁用狀態，並顯示禁用原因提示
- 守門規則 MUST 在 UI 層與 API 層雙重檢查，防止繞過 UI 直接呼叫 API

報工提交後的所有副作用（ProductionTaskWorkRecord 建立、pt_produced_qty 累加、首次報工觸發狀態從待處理轉為製作中、狀態向上傳遞）SHALL 與工單詳情頁批次報工完全一致，本入口僅變更觸發位置。

#### Scenario: 印務在印件詳情頁批次報工自己負責工單下的生產任務

- **WHEN** 印務甲在印件 B 詳情頁勾選工單 #3（自己負責）下的 PT-6、PT-9 兩筆生產任務，點擊「批次報工」並提交
- **THEN** 系統 SHALL 為 PT-6 與 PT-9 各建立一筆 ProductionTaskWorkRecord
- **AND** 兩筆生產任務的 pt_produced_qty SHALL 累加對應的報工數量
- **AND** 若任一筆為「待處理」且首次報工，狀態 SHALL 自動轉為「製作中」並向上傳遞

#### Scenario: 非工單負責人嘗試報工被阻擋

- **WHEN** 印務甲在印件 B 詳情頁，工單 #4（印務乙負責）下的 PT-7 報工按鈕為禁用狀態
- **THEN** 印務甲 MUST NOT 能透過 UI 對 PT-7 提交報工
- **AND** 即使印務甲繞過 UI 直接呼叫報工 API，系統 SHALL 在 API 層拒絕並回傳權限錯誤

#### Scenario: 印務主管的報工權限與印務一致

- **WHEN** 印務主管開啟印件詳情頁
- **THEN** 報工守門規則 SHALL 與印務角色完全一致：僅 WorkOrder.assigned_to 等於該主管的工單下生產任務可報工
- **AND** 印務主管 MUST NOT 因主管身份取得跨工單代報工權限

### Requirement: 報工來源管道紀錄

ProductionTaskWorkRecord SHALL 新增 `source_channel` 欄位，記錄該筆報工的提交來源管道，用於資料溯源、稽核、未來各管道採用率分析。

`source_channel` SHALL 為 enum 型別，取值範圍：
- `craftsman_platform`：師傅自助報工（任務平台）
- `supplier_platform`：供應商自助報工（供應商平台）
- `dispatch_board`：生管代報（日程面板批次報工 / 單筆報工）
- `work_order_detail`：印務於工單詳情頁報工
- `print_item_detail`：印務於印件詳情頁報工（本 change 新增）

`source_channel` MUST 由系統依提交來源自動填入，使用者 MUST NOT 可手動指定或修改。

API 層守門被觸發時（例如非工單負責人繞過 UI 呼叫報工 API），系統 SHALL 寫入稽核日誌，記錄：嘗試報工的使用者、目標 PT、來源 channel、被拒原因、時間戳。被拒紀錄 MUST NOT 寫入 ProductionTaskWorkRecord。

#### Scenario: 印件詳情頁報工自動填入 source_channel

- **WHEN** 印務在印件詳情頁提交報工
- **THEN** 系統 SHALL 建立 ProductionTaskWorkRecord，`source_channel` = `print_item_detail`
- **AND** 使用者介面 MUST NOT 顯示 source_channel 欄位供修改

#### Scenario: 既有報工管道 source_channel 對應

- **WHEN** 師傅在任務平台提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `craftsman_platform`

- **WHEN** 供應商在供應商平台提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `supplier_platform`

- **WHEN** 生管在日程面板提交報工（單筆或批次）
- **THEN** ProductionTaskWorkRecord.source_channel = `dispatch_board`

- **WHEN** 印務在工單詳情頁提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `work_order_detail`

#### Scenario: 守門被觸發寫入稽核日誌

- **WHEN** 印務甲繞過 UI 對非自己負責工單下的 PT 呼叫報工 API
- **THEN** 系統 SHALL 在 API 層拒絕該請求
- **AND** 系統 SHALL 寫入稽核日誌：使用者 ID、目標 PT ID、來源 channel、被拒原因、時間戳
- **AND** 系統 MUST NOT 為該次嘗試建立 ProductionTaskWorkRecord
