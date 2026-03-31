## Why

印務建立生產任務並排程後，系統缺乏交期風險的即時可視化機制。印務無法從系統得知工單和印件的預估完成時間，只能靠經驗心算每天 20-30 次排程是否趕得上交期；業務無法回覆客戶「什麼時候能交」，只能口頭問印務再轉述；管理層無法一覽哪些訂單可能延遲。目前 ProductionTask Data Model 缺少預估工期與預計完工日欄位，工單和印件層也沒有完成日期的彙總機制。

## What Changes

- ProductionTask 新增 `estimated_duration_days`（預估工期/天）與 `planned_end_date`（預計完工日）欄位
  - 自有工廠：系統推算（`scheduled_date + estimated_duration_days`）
  - 外包廠：印務手動填寫（跟廠商確認的日期）
- 工單層新增預估完成日計算邏輯：`max(所有生產任務的 planned_end_date)`，計算欄位不存儲
- 印件層新增預估完成日計算邏輯：`max(所有工單的預估完成日)`，計算欄位不存儲
- 三層交期預警機制：當預估完成日晚於印件交貨日期時，以紅色標記顯示超期天數
- 部分未排程標記：工單/印件層顯示「N/M 已排程」，讓使用者知道預估日期基於不完整資料
- 訂單印件清單新增「預估完成日」欄位，讓業務直接查看

## Capabilities

### New Capabilities

（無新增獨立模組）

### Modified Capabilities

- `production-task`：Data Model 新增 estimated_duration_days、planned_end_date 欄位；補齊開工日期設定與完工推算的 Requirement 與 Data Model 一致性
- `work-order`：新增工單預估完成日計算邏輯、工單層交期預警顯示、訂單印件清單新增預估完成日欄位

## Impact

- 生產任務 Data Model 新增 2 個欄位（estimated_duration_days、planned_end_date）
- 派工板排程 UI 需配合新欄位調整（自有工廠：新增工期輸入；外包廠：新增完工日輸入）
- 工單詳情頁、印件總覽、訂單印件清單需新增預估完成日與預警顯示
- 不影響狀態機（純計算欄位，不觸發狀態轉換）
- 不影響進行中的 wo-modification change（該 change 處理異動流程，與排程計算無交集）
