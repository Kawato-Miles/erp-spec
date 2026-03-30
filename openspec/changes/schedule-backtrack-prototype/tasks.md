## 1. 資料層準備

- [x] 1.1 ProductionTask 型別新增 stageOrder（階段序號，number）欄位
- [x] 1.2 建立工序預設工期對照表（PROCESS_DEFAULT_DURATION）：數位=2、製版=1、裁摺=1、上光=1、手工=2、切割=1、運送=1、自訂=1
- [x] 1.3 擴展 mockWorkOrders 第二筆工單（製作中）的生產任務：補上 stageOrder、estimatedDurationDays，設計 3 階段情境

## 2. 排程回推演算

- [x] 2.1 建立 `src/lib/scheduleBacktrack.ts`：實作回推函式，輸入（生產任務陣列 + 交貨日）→ 輸出（各任務的 scheduledDate / plannedEndDate）
- [x] 2.2 處理邊界情況：回推結果在過去時標記警告、缺少工期時回傳錯誤

## 3. 排程規劃 Tab

- [x] 3.1 工單詳情頁 Tab 列新增「排程規劃」Tab
- [x] 3.2 建立 `src/components/workorder/SchedulePlanner.tsx` 主元件：顯示生產任務表格（含階段下拉、工期輸入）與「自動排程」按鈕
- [x] 3.3 實作階段下拉選單：選擇 1-6 階段，動態偵測最大階段數
- [x] 3.4 實作工期輸入欄位：整數天，預設值依工序帶入

## 4. 甘特圖時間軸

- [x] 4.1 建立 `src/components/workorder/ScheduleGantt.tsx`：水平甘特圖元件
- [x] 4.2 X 軸為日期範圍（最早開始日 ~ 交貨日），Y 軸為各生產任務
- [x] 4.3 每筆任務以色塊呈現（依階段著色），交貨日以紅色垂直線標示
- [x] 4.4 階段邊界以虛線標示，滑鼠 hover 顯示任務詳情 tooltip

## 5. 整合與驗證

- [x] 5.1 將 SchedulePlanner 整合至工單詳情頁 Tab
- [x] 5.2 端到端驗證：開啟工單 → 排程規劃 Tab → 設定階段與工期 → 點自動排程 → 甘特圖呈現結果
