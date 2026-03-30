## NEW Requirements

### Requirement: 師傅自助報工

系統 SHALL 支援師傅透過任務平台直接回報完成數量，取代生管代為報工的流程。

#### Scenario: 師傅首次報工觸發製作中

- **WHEN** 師傅在任務平台為「待處理」狀態（已指派師傅）的生產任務提交首次報工
- **THEN** 系統 SHALL 記錄報工數量至 ProductionTaskWorkRecord
- **AND** 生產任務狀態 SHALL 從「待處理」變為「製作中」
- **AND** reported_by SHALL 記錄為該師傅

#### Scenario: 師傅後續報工累加數量

- **WHEN** 師傅為「製作中」狀態的生產任務提交報工
- **THEN** 系統 SHALL 累加報工數量至 pt_produced_qty
- **AND** 報工數量加總 MUST NOT 超過 pt_target_qty

#### Scenario: 師傅僅可查看自身任務

- **WHEN** 師傅登入任務平台
- **THEN** 系統 SHALL 僅顯示 assigned_operator 為該師傅的生產任務
- **AND** 系統 MUST NOT 顯示其他師傅的任務

### Requirement: 師傅任務平台今日視圖

系統 SHALL 為師傅提供以日為單位的任務清單，顯示今日需執行的生產任務。

#### Scenario: 師傅查看今日任務

- **WHEN** 師傅登入任務平台
- **THEN** 系統 SHALL 顯示以下任務：assigned_operator 為該師傅且（actual_start_date 為今日或狀態為「製作中」）的生產任務
- **AND** 每筆任務 MUST 顯示：工序名稱、工單編號、目標數量、已完成數量、狀態

#### Scenario: 師傅查看明日預覽

- **WHEN** 師傅切換至「明日」標籤
- **THEN** 系統 SHALL 顯示 actual_start_date 為明日的生產任務（唯讀，不可報工）

## MODIFIED Requirements

### Requirement: 生管代替報工

系統 SHALL 支援生管代替師傅記錄 completed_quantity（報工數量）。生管代報與師傅自助報工並存，兩者皆可觸發狀態轉換。

#### Scenario: 生管記錄報工數量

- **WHEN** 師傅口頭告知完成數量，生管在系統記錄
- **THEN** 系統更新 completed_quantity，觸發上層工單完成度重算

#### Scenario: 師傅已自行報工後生管不重複記錄

- **WHEN** 師傅已透過任務平台回報完成數量
- **THEN** 生管在日程面板可查看該筆報工紀錄（唯讀）
- **AND** 生管仍可為同一任務新增報工紀錄（如師傅漏報的部分）
