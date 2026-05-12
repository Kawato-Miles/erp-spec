## ADDED Requirements

### Requirement: 待收款列管模組總覽

系統 SHALL 於 ERP 主導覽提供獨立的「待收款」頁面，列出所有 `PaymentPlan.status ≠ 已收訖` 的記錄，支援業務追款與會計列管。列表 SHALL 顯示以下欄位：訂單編號、客戶名稱、應收金額（PaymentPlan.scheduled_amount 減去已對應 Payment 累計）、預計收款日（scheduled_date）、逾期天數（overdue_days）、負責業務、帳務公司。底層查詢 SHALL 復用既有 `PaymentPlan.overdue_days` derived field（不重新定義計算邏輯）。

#### Scenario: 業務於主導覽進入待收款模組

- **WHEN** 業務點擊主導覽「待收款」入口
- **THEN** 系統 SHALL 列出所有與該業務相關的未收 PaymentPlan 記錄（依角色 view 篩選）
- **AND** 預設依 `overdue_days` 由大到小排序（最逾期的優先）
- **AND** 應收金額欄位 SHALL = `scheduled_amount - ∑(對應 Payment.amount)`

#### Scenario: 會計於主導覽進入待收款模組

- **WHEN** 會計點擊主導覽「待收款」入口
- **THEN** 系統 SHALL 列出全公司的未收 PaymentPlan 記錄
- **AND** 會計 SHALL 可依「帳務公司」篩選

### Requirement: 待收款列表的篩選與排序

待收款列表 SHALL 提供以下篩選與排序操作：

- 篩選：客戶、負責業務、帳務公司、預計收款日區間、逾期天數區間（如「逾期 ≥ 30 天」）、訂單狀態
- 排序：逾期天數、預計收款日、應收金額、客戶名稱

#### Scenario: 業務篩選逾期 30 天以上的待收款

- **WHEN** 業務於待收款模組選擇篩選器「逾期天數 ≥ 30」
- **THEN** 系統 SHALL 僅列出 `overdue_days ≥ 30` 的 PaymentPlan 記錄
- **AND** 結果 SHALL 預設依逾期天數由大到小排序

#### Scenario: 會計依帳務公司與預計收款日篩選

- **WHEN** 會計選擇「帳務公司 = 森紙股份有限公司」與「預計收款日 = 2026-05」
- **THEN** 系統 SHALL 列出 2026-05 該帳務公司的未收 PaymentPlan 記錄

### Requirement: 待收款列表項目跳轉訂單詳情

每筆 PaymentPlan 列項 SHALL 提供「查看訂單」連結，點擊後跳轉至對應 `Order` 詳情頁的「款項與發票」區塊。

#### Scenario: 業務點擊訂單編號跳轉

- **WHEN** 業務點擊待收款列表中某筆 PaymentPlan 的訂單編號
- **THEN** 系統 SHALL 導向該訂單詳情頁
- **AND** 預設展開「款項與發票」區塊並聚焦至對應 PaymentPlan 期次

### Requirement: 待收款模組為唯讀視圖

待收款模組 SHALL 為唯讀列管視圖，業務 / 業務主管 / 會計 SHALL NOT 可於本模組執行任何寫入操作（如修改 PaymentPlan、記錄 Payment）。所有寫入操作 SHALL 跳轉至訂單詳情頁完成（保持寫入入口單一）。

#### Scenario: 待收款模組不提供寫入操作

- **WHEN** 業務嘗試於待收款列表項目編輯應收金額或預計收款日
- **THEN** 系統 SHALL 拒絕並引導業務至訂單詳情頁修改

### Requirement: 待收款模組逾期警示

列表項目 SHALL 依 `overdue_days` 顯示視覺警示：

- `overdue_days < 0`（尚未到期）：無警示
- `0 ≤ overdue_days < 30`：黃色警示
- `overdue_days ≥ 30`：紅色警示

警示為純視覺呈現，不影響資料邏輯或自動觸發任何動作（如自動發 email）。

#### Scenario: 列表呈現三色警示

- **GIVEN** PaymentPlan #1 overdue_days = -5、PaymentPlan #2 overdue_days = 15、PaymentPlan #3 overdue_days = 45
- **WHEN** 業務開啟待收款模組
- **THEN** PaymentPlan #1 SHALL 無警示、PaymentPlan #2 SHALL 顯示黃色警示、PaymentPlan #3 SHALL 顯示紅色警示
