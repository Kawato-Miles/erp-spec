## Why

Prototype 從需求單到報工共 ~20 個頁面，但資料架構是割裂的：QuoteContext / OrderContext 各自為政，工單以下所有頁面直接 import 靜態 mock data，各模組 mock 使用不同 ID 體系且彼此無關聯。無法在同一 session 內從建立需求單一路操作到報工驗證完整流程邏輯。此外，訂單狀態推進原為每個狀態一個手動按鈕，違反狀態機 spec 的 bubble-up 設計。

## What Changes

### 資料架構統一
- **BREAKING** 以 Zustand 單一 store 取代分散的 QuoteContext / OrderContext
- 統一 mock data ID（mockDispatch `demo-dpt-XX` 對齊為 mockWorkOrders `demo-pt-XX`）
- 建立 seedData.ts 將既有 mock 資料整合為 store 初始狀態
- 建立 selector 層（dispatchSelectors.ts）從 canonical work order 衍生 DispatchProductionTask

### 頁面遷移（~25 個檔案）
- 所有 quote/order 元件改接 useErpStore
- WorkOrderDetail / WorkOrderList / AddProductionTasks / WorkOrderSchedule / PrintItemSchedule 改接 store
- TaskDispatch / ProductionTaskList 改從 store 衍生 DispatchProductionTask
- OperatorTasks 報工回寫 store（addWorkReport 同步更新生產任務數量與狀態）
- PrintItemDashboard / PrintItemProgress 改接 store

### 端到端動作串接
- 啟用「成交轉訂單」按鈕（convertQuoteToOrder action）
- 訂單狀態推進改為純正 bubble-up 模式：僅保留「確認回簽」與「取消訂單」兩個人工按鈕
- confirmSignBack action 依印件審稿狀態自動決定下一步（免審稿快速路徑 → 製作等待中）

### 印件總覽補強
- PrintItemDashboard / PrintItemProgress 新增第三資料來源：以 orders 為權威來源，補充已進入製作流程但尚無工單的印件

### Demo 資料
- 新增「漢城屋春季促銷 DM」訂單（製作等待中，審稿完成，0 工單），用於測試從審稿完成後開始製作的流程

## Capabilities

### New Capabilities

- `prototype-data-store`: Zustand 統一 store 架構，涵蓋 entity 定義、seed data、selector 衍生、跨實體原子操作（如成交轉訂單）

### Modified Capabilities

- `order-management`: 訂單狀態推進改為 bubble-up 模式（移除手動推進按鈕，新增 confirmSignBack action 含免審稿快速路徑判斷）
- `state-machines`: 無 spec 層級變更（實作對齊既有 spec 規則），但 Prototype 行為修正為符合 spec

## Impact

- **依賴新增**：zustand ^5.0.12
- **刪除檔案**：`src/contexts/QuoteContext.tsx`、`src/contexts/OrderContext.tsx`
- **新增檔案**：`src/store/useErpStore.ts`、`src/store/seedData.ts`、`src/store/selectors/dispatchSelectors.ts`
- **修改檔案**：~25 個頁面/元件（import 來源從 context/mock 改為 store）
- **App.tsx**：移除 QuoteProvider / OrderProvider 包裹
- **mock data**：`mockDispatch.ts` ID 統一（demo-dpt → demo-pt），`mockOrders.ts` 新增 1 筆 Demo 訂單
- **DispatchBoard / SchedulePanel / SchedulingCenter**：維持 mock import 不動（view-specific types，不影響主流程）
