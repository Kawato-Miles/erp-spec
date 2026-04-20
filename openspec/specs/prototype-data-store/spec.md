# prototype-data-store Specification

## Purpose
TBD - created by archiving change end-to-end-data-flow. Update Purpose after archive.
## Requirements
### Requirement: 統一 Store 架構

系統 SHALL 使用單一 Zustand store 作為所有實體的唯一資料來源，取代分散的 React Context。

Store SHALL 包含以下 entity slices：

| Slice | 型別 | 說明 |
|-------|------|------|
| quotes | QuoteRequest[] | 需求單 |
| orders | Order[] | 訂單 |
| workOrders | WorkOrderDetail[] | 工單（含嵌套 tasks / productionTasks） |
| workPackages | WorkPackage[] | 工作包 |
| workReports | WorkReport[] | 報工紀錄 |
| workers | Worker[] | 師傅（reference data） |
| equipment | Equipment[] | 設備（reference data） |
| currentUser | User | 當前操作使用者 |

#### Scenario: 任何元件可讀取 store 資料

- **WHEN** 任意 React 元件呼叫 `useErpStore(selector)`
- **THEN** SHALL 取得對應的 store 資料，不需要 Provider 包裹

#### Scenario: 跨實體原子更新

- **WHEN** 執行 `convertQuoteToOrder(quoteId)` action
- **THEN** 系統 SHALL 在單一 `set()` 呼叫中同時更新 quote（status、linkedOrderId）與新增 order，確保一致性

---

### Requirement: Seed Data 初始化

Store 初始狀態 SHALL 從既有 mock 資料檔案組裝，確保 Demo 情境（大方文創禮盒組等）在啟動時即可使用。

#### Scenario: ID 對齊業務編號

- **WHEN** 組裝 seed data
- **THEN** 所有實體 id SHALL 使用對應業務編號，避免 demo-* placeholder 造成 UAT 理解落差：
  - `Order.id` = `orderNo`（`ORD-YYYYMMDD-NN`）
  - `OrderPrintItem.id` = `printItemNo`（`{orderNo}_{三位流水號}`）
  - `WorkOrderDetail.id` = `workOrderNo`（`W-YYYYMMDD-NN`）
  - `Task.id` = `{workOrderNo}_{taskNo}`
  - `ProductionTask.id` = `{workOrderNo}_{taskNo}`
  - `QCRecord.id` = `qcNo`（`QC-YYYYMMDD-DNN`）
  - `ShipmentRecord.id` = `shipmentNo`（`SH-YYYYMMDD-NN`）
- **AND** 所有 FK（`linkedOrderId`、`printItemId`、`workOrderId`、`taskId`、`productionTaskId` 等）SHALL 引用對應業務編號字串
- **AND** 跨 view mock 的派工欄位合併 join key SHALL 使用 `taskNo`（不再依賴 `demo-pt-XX` 字面相等）

#### Scenario: 派工欄位合併

- **WHEN** 組裝 seed data
- **THEN** seedData SHALL 將 mockDispatch 的派工欄位（scheduledDate、workPackageId、assignedOperator 等）合併回對應 WorkOrderDetail 的 ProductionTask，以 taskNo 為 join key

---

### Requirement: Selector 衍生 View Types

各頁面所需的 view-specific types（DispatchProductionTask、SchedulePanelTask 等）SHALL 透過 selector 函式從 canonical store 資料衍生，不直接儲存於 store。

#### Scenario: 衍生 DispatchProductionTask

- **WHEN** TaskDispatch 頁面需要 DispatchProductionTask[]
- **THEN** `selectDispatchTasks(state)` SHALL 遍歷所有 workOrders → tasks → productionTasks，附上 workOrderNo、printItemName、deliveryDate 等上層資訊

#### Scenario: 報工數量計算

- **WHEN** 衍生 DispatchProductionTask 的 ptProducedQty
- **THEN** SHALL 從 workReports 中篩選對應 productionTaskId 的報工紀錄，加總 reportedQuantity

---

### Requirement: 報工回寫（與 QC 通過分離）

addWorkReport action SHALL 記錄報工紀錄並推進生產任務至「製作中」，但不寫入 `qcPassedQty`、不自動推進「已完成」。QC 通過數量與 PT 完成須由 QC 模組（未規劃）或經 `updateWorkOrderStatus` 手動觸發，避免在 QC 模組尚未實作時讓印件錯誤地進入「製作完成」。

#### Scenario: 報工累加於 workReports

- **WHEN** 呼叫 `addWorkReport(report)`
- **THEN** 系統 SHALL 將 `report` 加入 `workReports[]`
- **AND** 該 `productionTaskId` 的累計報工數量 SHALL 可透過 `workReports.filter(r => r.productionTaskId === pt.id).reduce((s, r) => s + r.reportedQuantity, 0)` 即時推算

#### Scenario: 報工不寫入 qcPassedQty

- **WHEN** 呼叫 `addWorkReport(report)`
- **THEN** 對應 ProductionTask 的 `qcPassedQty` SHALL 保持不變
- **AND** `qcPassedQty` 僅能由 QC 模組或 mock seed data 寫入（報工端不碰）

#### Scenario: 首次報工推進 PT 至製作中

- **WHEN** 呼叫 `addWorkReport(report)` 且該 ProductionTask 的 `status` 為「待處理」/「已分派」/「已交付」
- **THEN** 系統 SHALL 將該 ProductionTask.status 更新為「製作中」
- **AND** 若工單狀態為「工單已交付」，WO 狀態 SHALL 連動推進至「製作中」（現有 bubble-up 規則）

#### Scenario: 報工達標不自動推進已完成

- **WHEN** 呼叫 `addWorkReport(report)`，累計報工數達到或超過 `quantityPerWorkOrder * workOrder.targetQty`
- **THEN** ProductionTask.status SHALL 維持「製作中」（非「已完成」）
- **AND** WO / Order 層的 bubble-up 完成推進 SHALL NOT 因單純報工而觸發
- **AND** 完成須經 QC 模組或 `updateWorkOrderStatus(woId, '已完成')` 手動觸發

---

### Requirement: 印件總覽資料完整性

PrintItemDashboard SHALL 顯示所有已進入製作流程的訂單印件，不論是否已建立工單。

#### Scenario: 三資料來源整合

- **WHEN** 建構印件總覽資料
- **THEN** SHALL 從以下三個來源收集：
  1. mockPipelineItems（靜態 pipeline data）
  2. WorkOrderSummary group by printItemId（有工單的進度追蹤）
  3. Orders 中狀態為「製作等待中」及之後的印件（以 orders 為權威來源）
- **AND** 使用 printItem ID 去重，確保每個印件只出現一次

#### Scenario: PrintItemProgress 同步

- **WHEN** PrintItemProgress 頁面載入
- **THEN** SHALL 以相同邏輯補充無工單但已進入製作流程的印件

---

### Requirement: 印件編號欄位

OrderPrintItem SHALL 新增業務可讀的 `printItemNo` 欄位，與訂單生命週期綁定，供 UI 顯示與跨單據引用，避免 UAT 時暴露內部 FK。

#### Scenario: 印件編號格式

- **WHEN** 建立 OrderPrintItem（seed data、轉單、手動新增）
- **THEN** `printItemNo` SHALL 以 `{訂單編號}_{三位流水號}` 格式產生（例：`ORD-20260328-01_002`）
- **AND** 流水號 SHALL 依該訂單下印件建立順序遞增

#### Scenario: UI 顯示印件編號

- **WHEN** PrintItemDetail 顯示「印件編號」欄位
- **THEN** SHALL 顯示 `printItemNo`（舊資料若無則 fallback 至 `id`）

---

### Requirement: 印件 FK 貫通

所有承載生產任務或排程資訊的型別 SHALL 帶 `printItemId`，讓 UI 可由任一入口直達印件詳情，且允許印件層正確聚合關聯資料。

#### Scenario: 型別補 printItemId

- **WHEN** 定義以下型別
- **THEN** SHALL 包含 `printItemId: string` 欄位：
  - `Order.WorkOrder`（`src/types/order.ts`）
  - `DispatchProductionTask`（`src/types/dispatch.ts`）
  - `SchedulePanelTask`（`src/data/mockSchedulePanel.ts`）

#### Scenario: selectDispatchTasks 傳遞 printItemId

- **WHEN** selector 從 workOrders 衍生 DispatchProductionTask
- **THEN** SHALL 將 `wo.printItemId` 傳遞給每一筆 DispatchProductionTask

#### Scenario: OrderDetail 印件關聯工單

- **WHEN** OrderDetail 為每筆印件列出關聯工單
- **THEN** SHALL 以 `order.workOrders.filter(wo => wo.printItemId === pi.id)` 比對（禁止用 `printItemName`）

---

### Requirement: 出貨單明細欄位

ShipmentRecord SHALL 提供 `items[]` 可選欄位，精準記錄每個印件的出貨數量，供印件詳情頁聚合出貨紀錄。

#### Scenario: items 結構

- **WHEN** 建立 Shipment mock 資料
- **THEN** `items?: ShipmentItem[]` SHALL 包含每筆印件的 `{ printItemId, printItemName, qty }`
- **AND** 舊資料無 items 時仍可運作（optional）

#### Scenario: 印件層出貨聚合

- **WHEN** PrintItemDetail 聚合本印件的出貨紀錄
- **THEN** SHALL 掃 `orders.flatMap(o => o.shipments)` 並篩選 `s.items?.some(it => it.printItemId === 當前印件)`
- **AND** 每筆出貨紀錄 SHALL 顯示 shipmentNo、日期、對應訂單、本印件出貨數、物流狀態

---

### Requirement: 印件為中心的跨單據導航

UI SHALL 允許使用者從訂單、工單、生產任務、排程面板、報工 Dialog 等任一入口直達印件詳情頁，以印件為中心驗證 E2E 資料流。

#### Scenario: 各入口跳轉路徑

- **WHEN** 使用者在下列頁面看到印件資訊
- **THEN** SHALL 提供可點擊連結或按鈕跳至 `/print-items/{printItemId}`：
  - OrderDetail 印件列「操作」欄（詳情按鈕）與印件名稱
  - WorkOrderDetail 基本資訊表「印件名稱」欄位
  - ProductionTaskList 子表格「印件」欄位
  - SchedulePanel 任務列「印件」欄位
  - ProductionTaskDrawer 基本資訊區「印件名稱」欄位

