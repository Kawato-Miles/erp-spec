## NEW Requirements

### Requirement: 供應商自助報工

系統 SHALL 支援外包廠商與中國廠商透過供應商平台直接回報生產進度。

#### Scenario: 供應商回報完成數量

- **WHEN** 供應商在供應商平台為「製作中」狀態的生產任務提交報工
- **THEN** 系統 SHALL 記錄報工數量至 ProductionTaskWorkRecord
- **AND** reported_by SHALL 記錄為該供應商操作員

#### Scenario: 供應商標記製作完成

- **WHEN** 供應商在供應商平台將生產任務標記為「製作完畢」
- **THEN** 外包廠路徑：生產任務狀態 SHALL 從「製作中」變為「運送中」
- **AND** 中國廠商路徑：生產任務狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 供應商僅可查看分派給該廠商的任務

- **WHEN** 供應商登入供應商平台
- **THEN** 系統 SHALL 僅顯示 assigned_factory 為該供應商的生產任務
- **AND** 系統 MUST NOT 顯示其他供應商的任務

### Requirement: 供應商報價

系統 SHALL 支援供應商針對被分派的生產任務提交報價。

#### Scenario: 供應商提交報價

- **WHEN** 供應商查看被分派的生產任務後填寫單價報價
- **THEN** 系統 SHALL 記錄 unit_price_quoted、quoted_at、quoted_by
- **AND** 生管 SHALL 收到報價通知

#### Scenario: 供應商修改報價

- **WHEN** 供應商在報價尚未被確認前修改報價
- **THEN** 系統 SHALL 更新 unit_price_quoted 與 quoted_at
- **AND** 生管 SHALL 收到報價更新通知

#### Scenario: 報價已確認後不可修改

- **WHEN** 生管已確認某筆報價
- **THEN** 供應商 MUST NOT 修改該筆報價
- **AND** 若需調整，須由生管退回後重新報價

### Requirement: 生管確認報價

系統 SHALL 支援生管審核供應商提交的報價。

#### Scenario: 生管確認報價

- **WHEN** 生管在日程面板或任務詳情查看供應商報價後確認
- **THEN** 系統 SHALL 記錄 price_confirmed_by 與 price_confirmed_at
- **AND** 報價狀態 SHALL 變為「已確認」

#### Scenario: 生管退回報價

- **WHEN** 生管認為報價不合理，退回並填寫退回原因
- **THEN** 系統 SHALL 將報價狀態改為「已退回」
- **AND** 供應商 SHALL 收到退回通知與退回原因
- **AND** 供應商可重新提交報價

## MODIFIED Requirements

### Requirement: 生產任務狀態機

生產任務（Production Task）外包廠路徑新增供應商報工觸發的狀態轉換：

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 生產任務狀態 SHALL 從「待處理」變為「製作中」

## Data Model Changes

### ProductionTask（新增欄位）

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|----------|------|------|------|
| 供應商報價單價 | unit_price_quoted | 小數 | | 供應商提交的單價 |
| 報價時間 | quoted_at | 日期時間 | | 供應商提交報價的時間 |
| 報價人 | quoted_by | FK | | FK -> 使用者（供應商操作員） |
| 報價狀態 | quote_status | 單選 | | 待報價 / 已報價 / 已確認 / 已退回 |
| 報價確認人 | price_confirmed_by | FK | | FK -> 使用者（生管） |
| 報價確認時間 | price_confirmed_at | 日期時間 | | |
| 退回原因 | quote_reject_reason | 文字 | | 生管退回時填寫 |
