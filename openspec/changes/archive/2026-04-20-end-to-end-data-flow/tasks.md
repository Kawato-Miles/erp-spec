## Tasks

### Phase 0: 基礎建設

- [x] 安裝 Zustand 依賴（package.json）
- [x] 統一 mockDispatch ID（`demo-dpt-XX` → `demo-pt-XX`）
- [x] 建立 `src/store/useErpStore.ts`（entity slices + actions）
- [x] 建立 `src/store/seedData.ts`（從 mock 檔案組裝初始 state）
- [x] 建立 `src/store/selectors/dispatchSelectors.ts`（衍生 DispatchProductionTask）

### Phase 1: Quote + Order 遷移

- [x] QuoteDetailPage — `useQuotes()` → `useErpStore()`，啟用「建立訂單」按鈕
- [x] CreateQuotePanel / QuoteListPage / PrintItemsTable / RoleSwitcher — 替換 `useQuotes()`
- [x] OrderList / OrderDetail — `useOrders()` → `useErpStore()`
- [x] WorkOrderList / OperatorTasks / PrintItemDashboard — 替換 `useQuotes()`（僅用 currentUser）
- [x] AppSidebar / AppLayout — 替換 `useQuotes()`
- [x] App.tsx — 移除 QuoteProvider / OrderProvider

### Phase 2: WorkOrder 遷移

- [x] WorkOrderDetail（1700 行）— `useState(mockWorkOrderDetails.find(...))` → store，9 處 setWo → updateWorkOrder
- [x] WorkOrderList — mockWorkOrders → store 衍生 WorkOrderSummary[]
- [x] AddProductionTasks — mockWorkOrderDetails → store，handleSave 改用 updateWorkOrder
- [x] WorkOrderSchedule / PrintItemSchedule — mockWorkOrderDetails → store

### Phase 3: Dispatch / Scheduling 遷移

- [x] TaskDispatch — mockDispatch import → store（selectDispatchTasks + storeState.workPackages/workers/equipment）
- [x] ProductionTaskList — mockDispatch import → store
- [x] OperatorTasks — 新增 addWorkReport 回寫至 store

### Phase 4: 訂單狀態修正

- [x] Store 新增 updateOrderStatus / updateOrder / confirmSignBack actions
- [x] OrderDetail — 移除 8 個手動狀態推進按鈕，僅保留「確認回簽」+「取消訂單」
- [x] confirmSignBack — 依印件 reviewStatus 自動決定下一步（免審稿快速路徑）

### Phase 5: 印件總覽補強 + 清理

- [x] PrintItemDashboard — 新增第三資料來源（orders 中已進入製作流程的印件）
- [x] PrintItemProgress — 同步補充無工單但已進入製作流程的印件
- [x] 刪除 `src/contexts/QuoteContext.tsx` / `src/contexts/OrderContext.tsx`

### Phase 6: Demo 資料

- [x] mockOrders 新增「漢城屋春季促銷 DM」訂單（製作等待中，審稿完成，0 工單）

### Phase 7: UI 修正

- [x] 業務角色可點選「評估完成」按鈕（原僅印務主管可見）
- [x] EditPrintItemPanel 印件編號改為 `quoteNo-itemNo` 格式（原為 UUID 截斷）

### Phase 8: 印件為中心 E2E 補強（延伸）

- [x] `ShipmentRecord` 新增 `items[]` 精準記錄每印件出貨數（`types/order.ts`）
- [x] `OrderPrintItem` 新增 `printItemNo` 業務編號欄位（`{訂單編號}_{三位流水號}`）
- [x] `Order.WorkOrder` / `DispatchProductionTask` / `SchedulePanelTask` 型別補 `printItemId`
- [x] `selectDispatchTasks` 傳遞 `printItemId` 至 DispatchProductionTask
- [x] `OrderDetail` 印件列新增詳情按鈕 + 印件名稱可點擊跳頁，關聯工單改用 `printItemId` 比對（原用 `printItemName`）
- [x] `WorkOrderDetail` 基本資訊表「印件名稱」改為可點擊跳印件詳情
- [x] `ProductionTaskList` 子表格新增「印件」欄位可點擊跳頁
- [x] `SchedulePanel` 任務列印件欄位改為可點擊連結
- [x] `ProductionTaskDrawer` 印件名稱改為可點擊（跳頁前關閉 Drawer）
- [x] `WorkReportDialog` 批次模式顯示印件名稱
- [x] `PrintItemDetail` 整合 QC 紀錄卡、出貨紀錄卡（後續 refactor 為 Tabs 佈局）
- [x] `demo2` 訂單補完整出貨單 mock（`SH-20260329-01`，兩個印件明細）
- [x] 清理 `mockArtwork` 孤兒 key（`demo-pi-a2` 合併回盒身大貨印件）

### Phase 9: Mock id 業務編號化

- [x] Order / PrintItem / WorkOrder / Task / ProductionTask / QC / Shipment 所有 id 改用對應業務編號
- [x] 所有 FK（`linkedOrderId` / `printItemId` / `workOrderId` / `taskId` / `productionTaskId`）同步更新
- [x] 跨 9 檔 291 處替換（`mockOrders` / `mockWorkOrders` / `mockArtwork` / `mockQuotes` / `mockSchedulePanel` / `mockDispatch` / `mockDispatchBoard` / `mockSchedulingCenter` / `mockEquipment`）
- [x] URL 同步反映業務編號（`/orders/ORD-…`、`/print-items/ORD-…_NNN`、`/work-orders/W-…`）

### Phase 10: 報工與 QC 邊界修正

- [x] `useErpStore.addWorkReport` 不再寫入 `qcPassedQty`（QC 模組未規劃前保留 mock 初值）
- [x] `useErpStore.addWorkReport` 不再因報工達標自動推進 PT 至「已完成」
- [x] PT 狀態僅從「待處理 / 已分派 / 已交付」推進至「製作中」
- [x] `PrintItemDetail` PT 表頭「入庫」改為「QC 通過數量」，避免與印件層「入庫數」混淆
- [x] 24 個測試（`addWorkReport.test.ts` / `bubbleUp.test.ts` / `fullProductionFlow.test.ts` / `purchaseModels.test.ts`）改用 `updateWorkOrderStatus('已完成')` 模擬 QC 通過後的 bubble-up
