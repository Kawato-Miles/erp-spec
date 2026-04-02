## MODIFIED Requirements

### Requirement: 開工日期設定與完工推算

系統 SHALL 支援印務手動設定開工日期（`scheduled_date`），並依工廠類型決定預計完工日（`planned_end_date`）的填寫方式：

- 自有工廠：印務 MUST 填寫預估工期天數（`estimated_duration_days`），系統自動推算 `planned_end_date = scheduled_date + estimated_duration_days`（跳過週日）。自有工廠的 planned_end_date 為唯讀計算欄位，印務 MUST NOT 手動覆寫
- 外包廠：印務 MUST 手動填寫預計完工日（`planned_end_date`），為與廠商確認後的日期。系統 MUST NOT 要求填寫 estimated_duration_days（外包廠不適用推算）

派工時間單位為天（整數）。`estimated_duration_days` 與 `planned_end_date` 的填寫為排程必要步驟。

完工日推算規則：跳過週日（週六計為工作天）。例如：週五開工、工期 3 天 → 週一完工（跳過週日）。

#### Scenario: 自有工廠印務設定開工日期與工期

- **WHEN** 印務為自有工廠生產任務設定開工日期為 2026-04-01（週三），預估工期 3 天
- **THEN** 系統 SHALL 自動推算 planned_end_date 為 2026-04-04（週六）
- **AND** planned_end_date SHALL 在開工日期或工期變更時即時重算
- **AND** 印務 MUST NOT 可直接編輯 planned_end_date（唯讀）

#### Scenario: 自有工廠完工推算跳過週日

- **WHEN** 印務為自有工廠生產任務設定開工日期為 2026-04-04（週六），預估工期 2 天
- **THEN** 系統 SHALL 跳過週日（2026-04-05），推算 planned_end_date 為 2026-04-07（週一）

#### Scenario: 外包廠印務設定預計完工日

- **WHEN** 印務為外包廠生產任務設定排程
- **THEN** 系統 SHALL 提供 planned_end_date 日期選擇器供印務填寫
- **AND** 系統 MUST NOT 要求填寫 estimated_duration_days（外包廠不適用推算）

#### Scenario: 外包廠完工日基本校驗

- **WHEN** 印務為外包廠生產任務填寫 planned_end_date
- **THEN** planned_end_date MUST >= 今天日期
- **AND** 當 planned_end_date > delivery_date + 30 天時，系統 SHALL 顯示確認提示

#### Scenario: 自有工廠工期為必填

- **WHEN** 印務為自有工廠生產任務設定排程，但未填寫 estimated_duration_days
- **THEN** 系統 SHALL 以黃色提醒標示工期欄位
- **AND** 任務交付前置條件檢查 SHALL 包含 estimated_duration_days 是否已填

#### Scenario: US-WO-015 手動設定開工日期與完工推算

- **WHEN** 印務主管選擇待派工任務並輸入開工日期
- **THEN** 自有工廠：系統 SHALL 要求填寫預估工期天數，並即時推算完工日期顯示（跳過週日）
- **AND** 外包廠：系統 SHALL 要求填寫預計完工日
- **AND** 印務主管 MUST 確認完工日期是否在交貨日期之前，確認後保存派工

### Requirement: 任務交付

系統 SHALL 支援印務確認派工排程完成後透過系統交付任務（任務狀態：待交付 -> 已交付）。前置條件：所有生產任務均已設定設備（若工序需要）與開工日期。自有工廠生產任務 MUST 已填寫 estimated_duration_days；所有生產任務 MUST 已設定 planned_end_date。

#### Scenario: 印務交付任務給生管

- **WHEN** 印務確認派工排程完成，所有生產任務已設定設備與開工日期，且 planned_end_date 皆已設定
- **THEN** 系統將任務狀態從「待交付」轉為「已交付」，生管收到通知

#### Scenario: 前置條件未滿足（缺少完工日期）

- **WHEN** 印務嘗試交付但有生產任務未設定 planned_end_date
- **THEN** 系統 SHALL 阻擋交付並提示未完成排程的任務清單

#### Scenario: 前置條件未滿足（自有工廠缺少工期）

- **WHEN** 印務嘗試交付但有自有工廠生產任務未填寫 estimated_duration_days
- **THEN** 系統 SHALL 阻擋交付並提示缺少工期的任務清單

## ADDED Requirements

### Requirement: 生產任務批量新增

系統 SHALL 支援印務在工單詳情頁透過全屏右抽屜一次批量新增多筆生產任務。抽屜內應顯示工單上下文資訊（工單號、客戶、交貨日期、工單數量），幫助印務邊填邊參考。

抽屜內為可編輯表格，包含欄位：任務名稱、製程、數量、單位、尺寸、工廠、設備、工期(天)、完工日、影響成品、備註。印務可新增單列或使用「批量快速新增」按鈕（預設常見工序組合），一鍵展開多列。

新增的生產任務初始狀態為「待處理」，estimated_duration_days 與 planned_end_date 留待派工排程階段填入。

#### Scenario: 印務批量新增生產任務

- **WHEN** 印務在工單詳情頁點擊「新增生產任務」按鈕
- **THEN** 系統開啟全屏右抽屜（90vw × 100% 高），顯示工單號、客戶名、交貨日期、工單數量於抽屜頂部
- **AND** 抽屜內為空白表格，印務可點「新增列」逐行填寫，或選「批量快速新增」展開預設組合（如「印刷 → 裁切 → 折疊」）
- **AND** 表格行內編輯，無需額外確認，支援直接修改工廠等欄位
- **AND** 點「儲存」後新任務出現在工單詳情頁的生產任務列表中
- **AND** 點「取消」前若有未保存更改，系統提示確認

#### Scenario: 快速新增預設組合

- **WHEN** 印務點「批量快速新增」按鈕
- **THEN** 系統 SHALL 顯示常見工序組合清單（如「平版印刷套流程」、「數位印刷套流程」、「裝訂套流程」等）
- **AND** 選定後自動展開 3-5 列對應任務，印務可按需編輯工廠、設備等欄位後儲存

### Requirement: 工單成本試算

系統 SHALL 在新增生產任務抽屜右側提供工單成本試算面板，即時從左側生產任務表格計算各列成本（數量 × 單價），按製程分類彙總並顯示合計金額。左側表格任何數量或內容變更時即時更新。

#### Scenario: 印務查看工單成本試算

- **WHEN** 印務在新增生產任務抽屜中已填入多筆生產任務
- **THEN** 右側成本試算面板即時顯示各製程的小計與合計金額
- **AND** 印務修改任一生產任務的數量或內容時，成本試算即時更新

### Requirement: 生產任務交期預警

系統 SHALL 依生產任務的預計完工日與所屬印件交貨日期的關係，分兩級預警：

- 黃色預警（即將超期）：planned_end_date 在 delivery_date 前 2 天以內（含等於 delivery_date 當天）
- 紅色預警（已超期）：planned_end_date > delivery_date

預警 SHALL 在派工板即時顯示。

#### Scenario: 排程時紅色預警（已超期）

- **WHEN** 印務在派工板為生產任務設定排程，planned_end_date 為 2026-04-10，印件交貨日期為 2026-04-08
- **THEN** 系統 SHALL 以紅色標記該生產任務
- **AND** SHALL 顯示「超期 2 天」

#### Scenario: 排程時黃色預警（即將超期）

- **WHEN** 印務在派工板為生產任務設定排程，planned_end_date 為 2026-04-08，印件交貨日期為 2026-04-09
- **THEN** 系統 SHALL 以黃色標記該生產任務
- **AND** SHALL 顯示「距交期 1 天」

#### Scenario: 完工日等於交貨日期時黃色預警

- **WHEN** 印務設定排程，planned_end_date 為 2026-04-10，印件交貨日期為 2026-04-10
- **THEN** 系統 SHALL 以黃色標記（非綠色），因 QC/入庫/出貨仍需時間

#### Scenario: 排程調整後預警更新

- **WHEN** 印務調整生產任務的開工日期或工期，使 planned_end_date 從超期變為不超期
- **THEN** 系統 SHALL 即時更新預警狀態（移除標記或降級）

#### Scenario: 未設定完工日期時不顯示預警

- **WHEN** 生產任務尚未設定 planned_end_date
- **THEN** 系統 MUST NOT 顯示交期預警（因無法比對）

## Data Model Changes

### ProductionTask（修改欄位）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 預估工期（天）| estimated_duration_days | 整數 | 條件必填 | | 自有工廠必填，外包廠不適用。單位：天（整數）|
| 預計完工日 | planned_end_date | 日期 | 條件必填 | 條件唯讀 | 自有工廠：唯讀，系統推算（scheduled_date + estimated_duration_days，跳過週日）；外包廠：印務手動填寫 |
