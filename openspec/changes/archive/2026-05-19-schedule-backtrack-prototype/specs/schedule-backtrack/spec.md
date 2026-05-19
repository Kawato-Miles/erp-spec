## ADDED Requirements

### Requirement: 階段管理

系統 SHALL 支援印務為工單內的生產任務指定「階段序號」（stage_order），同階段的任務可平行執行，跨階段依序執行（前一階段全部完成後，後一階段才開始）。

#### Scenario: 印務為生產任務指定階段
- **WHEN** 印務在排程規劃 Tab 為某生產任務選擇階段 = 2
- **THEN** 該任務歸入階段 2，與其他階段 2 的任務平行排程

#### Scenario: 未指定階段的任務
- **WHEN** 生產任務未指定階段
- **THEN** 系統預設歸入階段 1

#### Scenario: 動態新增階段
- **WHEN** 印務需要更多階段
- **THEN** 系統允許新增階段，階段序號自動遞增

### Requirement: 自動排程回推

系統 SHALL 提供「自動排程」功能，從工單交貨日倒推計算各生產任務的預計開始日與預計完成日。回推規則：同階段取最大工期為階段持續天數，從交貨日依階段倒序排列。

#### Scenario: 點擊自動排程
- **WHEN** 印務在排程規劃 Tab 點擊「自動排程」
- **THEN** 系統依以下規則計算：
  1. 最後一階段完成日 = 工單交貨日
  2. 每階段持續天數 = max(該階段所有任務的 estimated_duration_days)
  3. 每階段開始日 = 完成日 - 持續天數
  4. 前一階段完成日 = 下一階段開始日
  5. 各任務 scheduled_date = 所屬階段開始日
  6. 各任務 planned_end_date = scheduled_date + 該任務 estimated_duration_days

#### Scenario: 回推結果在過去
- **WHEN** 計算出的最早開始日早於今日
- **THEN** 系統 MUST 顯示警告「排程起始日已過，請調整工期或交貨日」

#### Scenario: 缺少工期資料
- **WHEN** 某筆生產任務未填寫 estimated_duration_days
- **THEN** 系統 MUST 阻擋自動排程並提示「請先填寫所有任務的預估工期」

### Requirement: 排程時間軸

系統 SHALL 以水平甘特圖呈現排程結果。X 軸為日期，Y 軸為各生產任務。以階段色塊區分，交貨日以紅色垂直線標示。

#### Scenario: 顯示排程甘特圖
- **WHEN** 自動排程計算完成
- **THEN** 系統顯示甘特圖，每筆任務為一條水平色塊，長度對應工期天數，位置對應日期

#### Scenario: 階段色塊區分
- **WHEN** 甘特圖顯示多階段任務
- **THEN** 不同階段的任務使用不同背景色，方便辨識階段邊界

#### Scenario: 交貨日標示
- **WHEN** 甘特圖顯示
- **THEN** 交貨日以紅色垂直線標示於圖表中

### Requirement: 預估工期欄位

每筆生產任務 SHALL 有 estimated_duration_days 欄位（整數，天），印務可手動填寫。系統依工序類型提供預設值。

#### Scenario: 工序預設工期
- **WHEN** 印務建立工序為「數位」的生產任務
- **THEN** 系統預設 estimated_duration_days = 2，印務可覆寫

#### Scenario: 印務修改工期
- **WHEN** 印務將某任務的工期從 2 天改為 4 天
- **THEN** 系統記錄新值，下次自動排程使用更新後的工期
