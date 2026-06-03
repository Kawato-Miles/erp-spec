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

Store 初始狀態 SHALL 從情境驅動的 7 筆 mock 資料鏈組裝。每條資料鏈 SHALL 從一筆 Quote 開始，且鏈上所有實體（Quote → Order → 印件 → ReviewRound → WO → Task → ProductionTask → Report → QC 等）的 FK SHALL 貫通，不得存在「Order 但無 Quote」、「印件但無 Order」等斷鏈。

允許 mock 預載到情境中間階段（例：首審不合格、製作中待 QC、打樣工單已完成），只要從 Quote 到該階段的所有 FK 完整。

Mock 檔案保留型別匯出結構；reference data（審稿員、師傅、設備等 Master Data）保留；既有分散的 Transactional Data demo 清空。

#### Scenario: ID 對齊業務編號

- **WHEN** 組裝 seed data 或 UI actions 建立新實體
- **THEN** 所有實體 id SHALL 使用對應業務編號，避免 demo-* placeholder 造成 UAT 理解落差：
  - `Order.id` = `orderNo`（`ORD-YYYYMMDD-NN`）
  - `OrderPrintItem.id` = `printItemNo`（`{orderNo}_{三位流水號}`）
  - `WorkOrderDetail.id` = `workOrderNo`（`W-YYYYMMDD-NN`）
  - `Task.id` = `{workOrderNo}_{taskNo}`
  - `ProductionTask.id` = `{workOrderNo}_{taskNo}`
  - `QCRecord.id` = `qcNo`（`QC-YYYYMMDD-DNN`）
  - `ShipmentRecord.id` = `shipmentNo`（`SH-YYYYMMDD-NN`）
- **AND** 所有 FK（`linkedOrderId`、`printItemId`、`workOrderId`、`taskId`、`productionTaskId` 等）SHALL 引用對應業務編號字串

#### Scenario: 派工欄位合併（歷史相容性保留）

- **WHEN** 若 mockDispatch 仍有 reference data（如工作包範本）
- **THEN** seedData SHALL 將其合併回 store；但本 change 後 mockDispatch 的 demo 資料已清空，此合併實際上為 no-op

#### Scenario: 啟動時 7 筆情境驅動 mock 資料鏈

- **WHEN** Prototype 啟動時
- **THEN** store 的 `quotes[]` SHALL 包含 7 筆情境驅動 Quote（對應 demo-intent.md 定義的 Q1-Q7）
- **AND** `orders[]` SHALL 包含 Q3/Q4/Q5/Q7 對應的預載 Order（4 筆）
- **AND** `workOrders[]` SHALL 包含 Q3（製作中 WO）/ Q7（已完成打樣 WO）對應的預載 WO
- **AND** 其他預載實體（ReviewRound / Task / ProductionTask / WorkReport / QCRecord）依 demo-intent.md 設定
- **AND** `workers[]` / `equipment[]` / `prepressReviewers[]` 等 Master Data 保留既有內容

#### Scenario: 運行時資料鏈不變量

- **WHEN** 任意時刻（含初始狀態與 UI actions 執行後）
- **THEN** 每筆 `order.linkedQuoteId` SHALL 非 null 且能在 `quotes[]` 找到對應 Quote
- **AND** 每筆 `orderPrintItem.sourceItemNo` SHALL 能在對應 Quote 的 `printItems[]` 找到相同 `itemNo`
- **AND** 每筆 `workOrder.linkedOrderId` SHALL 能在 `orders[]` 找到
- **AND** 每筆 `workOrder.printItemId` SHALL 能在對應 Order 的 `printItems[]` 找到
- **AND** 每筆 `reviewRound` SHALL 屬於某 `orderPrintItem.reviewRounds[]`，且 `currentRoundId`（若有）指向其中之一
- **AND** 任一不變量違反時 audit test SHALL 失敗

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

### Requirement: 情境驅動 Mock 完備性

Mock 集合 SHALL 提供 7 條情境驅動資料鏈，覆蓋 [business-scenarios spec](../../../../specs/business-scenarios/spec.md) P0 情境（1, 2, 10, 12, 13, 15）與 P1 情境（3, 4, 5, 6, 11）所需的資料結構。情境 14 不在本 change 範圍（Miles 2026-04-20 決策）。情境 7, 8, 9 為 P2（另立 change）。

#### Scenario: 7 條資料鏈的情境對應

- **WHEN** Prototype 載入 7 條 mock 資料鏈
- **THEN** 以下特徵組合 SHALL 至少各有一筆覆蓋：
  - Q1 類型 A：線下單、1 印件（打樣+大貨）、非免審、Quote 起點 — 涵蓋情境 1（P0）
  - Q2 類型 B：線下單、1 印件、多任務層級 + 跨廠、Quote 起點 — 涵蓋情境 2（P0）
  - Q3 類型 C：線下單、1 大貨印件、`orderedQty >= 1000`、預載至「製作中待 QC」 — 涵蓋情境 10（P0）、11（P1）
  - Q4 類型 D：線下單、1 印件、預載至首審不合格 — 涵蓋情境 12（P0）
  - Q5 類型 E：線上單 EC、1 印件、預載至首審不合格 + round 2 審稿中 — 涵蓋情境 13（P0）
  - Q6 類型 G：線下單、1 印件、`skipReview=true`、Quote 起點 — 涵蓋情境 15（P0）
  - Q7 類型 H：線下單、1 印件、預載至打樣工單已完成 — 涵蓋情境 3, 4, 5, 6（P1）

#### Scenario: Store Actions 支援 P0 情境推進

- **WHEN** UAT 者從 P0 情境對應 mock 出發
- **THEN** store 提供的 actions SHALL 足夠將資料推進到該情境的終點狀態，不因缺漏 action 而卡住
- **AND** 本 change apply 階段 SHALL 對 P0 情境（1, 2, 10, 12, 13, 15）執行端到端驗證
- **AND** P1 情境（3, 4, 5, 6, 11）能做就做，但不列為本 change spec 契約（若完成補測試，若未完成記錄於 change archive 時的 follow-up）

#### Scenario: 情境覆蓋 e2e 測試

- **WHEN** `src/test/scenarios/scenarioCoverage.test.ts` 執行
- **THEN** 對每個 P0 情境，測試 SHALL 從對應 mock 資料鏈出發，依序呼叫情境步驟表所需 actions，驗證最終狀態與 business-scenarios spec 情境表記載一致
- **AND** 測試採步驟累積式風格（與既有 `fullProductionFlow.test.ts` 一致）

---

### Requirement: 跨層欄位一致性 Audit 常駐

Prototype 測試套件 SHALL 提供常駐 audit 測試，對 `seedData()` 產出的狀態 + `scenarioCoverage.test.ts` 執行過程中的狀態執行跨層欄位 parity 斷言與 FK 完整性檢查，任何 seed / factory / enrichment / action 漂移必須自動於 CI 被揪出。

Audit 範圍由 `TRACKED_PARITY_FIELDS` 常數顯式列舉，不綁特定 change 名稱。第一版常數內容：

```
TRACKED_PARITY_FIELDS = [
  'difficultyLevel',
  'expectedProductionLines',
  'skipReview',
  'specNotes',
  'shippingMethod',
  'packagingNotes',
  'deliveryDate',
]
```

後續新增跨層欄位的 change 若適用 parity 語意，SHALL 同步擴充此常數（由本 spec 的 Requirement「新增跨層欄位的 Change 工作流 Checklist」強制要求）。

#### Scenario: Quote → Order 印件欄位 parity

- **WHEN** audit 測試讀取 seedData 後的 `quotes` 與 `orders` 狀態，或 `scenarioCoverage.test.ts` 中 `convertQuoteToOrder` 執行後的狀態
- **THEN** SHALL 對每筆有 `linkedOrderId` 的 Quote，以 join key（`Order.linkedQuoteId` + `printItem.itemNo/sourceItemNo`）找到對應 Order 與其印件
- **AND** 對 `TRACKED_PARITY_FIELDS` 中每個欄位，Quote 印件與對應 Order 印件的值 SHALL 相等
- **AND** 若 Quote 印件該欄位為 `undefined` 或 `null`，視為「需求單未填」，audit SHALL 報告此為「上游源頭缺值」斷點（修復方向：回填 Quote）
- **AND** 若 Quote 有值但 Order 不同值，audit SHALL 報告為「下游覆寫」斷點（修復方向：確認業務意圖後調整任一側）
- **AND** 斷言失敗 SHALL 輸出結構化清單：`{ quoteId, orderId, printItemId, field, quoteValue, orderValue, diagnosis }`

#### Scenario: FK 完整性正向檢查

- **WHEN** audit 測試檢查 entity 引用
- **THEN** 每筆 `order.workOrders[].printItemId` SHALL 能在該 Order 的 `printItems[]` 中找到
- **AND** 每筆 `workOrderDetail.printItemId` SHALL 能在對應 Order 的 `printItems[]` 中找到
- **AND** 每筆 `productionTask.workPackageId`（若有值）SHALL 能在 `workPackages[]` 中找到
- **AND** 任一 FK 無法解析時測試 SHALL 失敗

#### Scenario: FK 反向孤兒檢查

- **WHEN** audit 檢查反向引用
- **THEN** 處於「製作等待中」及之後狀態的 Order 之每筆 `printItems[].id`，SHALL 至少被一筆 `workOrderDetail.printItemId` 引用
- **AND** 若有印件未被任何 WO 引用，audit SHALL 輸出「孤兒印件」警告（業務語意：應為異常）
- **AND** 處於「報價待回簽」或更早狀態的 Order 之印件可暫無 WO 引用，不視為斷點

---

### Requirement: 印件欄位單層不變量檢查

對僅存於單層的擴充欄位，`dataConsistency.test.ts` SHALL 執行 intra-layer invariant 檢查，而非跨層 parity。

#### Scenario: reviewRounds 嚴格遞增

- **WHEN** audit 遍歷所有 Order 印件的 `reviewRounds[]`
- **THEN** 同一印件的 `reviewRounds[].round_no` SHALL 嚴格單調遞增
- **AND** `currentRoundId`（若非 null）SHALL 指向該印件 reviewRounds 中存在的某一項

#### Scenario: reviewDimensionStatus 枚舉合法

- **WHEN** audit 檢查 Order 印件的 `reviewDimensionStatus`
- **THEN** 若有值，SHALL 為 `types/prepressReview.ReviewDimensionStatus` 定義的合法枚舉值之一

#### Scenario: assignedReviewerId 指向存在使用者

- **WHEN** audit 檢查 Order 印件的 `assignedReviewerId`
- **THEN** 若非 null，SHALL 能在 `prepressReviewers[]` 中找到對應使用者

---

### Requirement: 訂單金額彙總一致性 Audit

`dataConsistency.test.ts` SHALL 驗證每筆訂單的 `totalAmount` 與其 `printItems[]` 加總相符。

#### Scenario: Order.totalAmount 等於印件加總

- **WHEN** audit 遍歷所有 orders
- **THEN** 對每筆 Order，SHALL 計算 `sum = printItems.reduce((s, pi) => s + (pi.orderedQty * pi.pricePerUnit || 0), 0)`
- **AND** `Math.abs(Order.totalAmount - sum) <= tolerance`（容差 ≤ 1）
- **AND** 若印件 `pricePerUnit` 為 `null`，跳過該筆並將訂單標記為「部分報價中」不納入斷言
- **AND** 斷言失敗 SHALL 輸出 `{ orderId, declared, calculated, diff, unitPriceMissingItems }`

---

### Requirement: Quote → Order 欄位繼承推導

`seedData.ts` 與 `convertQuoteToOrder` action SHALL 對印件類跨層欄位執行「Quote 為源頭 → Order 預設繼承 → 建立後不變更」的推導規則。

本 Requirement 僅適用於 `TRACKED_PARITY_FIELDS`（符合「需求單階段初估後不再變更」語意的欄位）。

#### Scenario: convertQuoteToOrder action 繼承清單

- **WHEN** 使用者於 UI 點擊「建立訂單」觸發 `convertQuoteToOrder(quoteId)`
- **THEN** 新建立的 Order 印件 SHALL 從對應 Quote 印件繼承 `TRACKED_PARITY_FIELDS` 列舉的全部欄位
- **AND** 新建立的 Order SHALL 設定 `linkedQuoteId = quote.id`
- **AND** 新建立的 Order 印件 SHALL 設定 `sourceItemNo = quotePrintItem.itemNo`
- **AND** Order 階段新增的系統欄位（`printItemNo` / `reviewStatus` 等）SHALL 由 action 依業務規則設定初值

#### Scenario: seedData enrichOrdersFromQuotes fill-down（歷史相容）

- **WHEN** seedData 組裝狀態時（本 change 後 orders 預設為空）或未來若有靜態 Order mock 需要 fill-down
- **THEN** SHALL 呼叫 `enrichOrdersFromQuotes(orders, quotes)`
- **AND** join key SHALL 為 `order.linkedQuoteId` + `quotePrintItem.itemNo === orderPrintItem.sourceItemNo`
- **AND** 對 `TRACKED_PARITY_FIELDS` 中每個欄位，若 Order 印件該欄位為 `undefined` 或 `null`，SHALL 從對應 Quote 印件 fill-down
- **AND** 若 Order 印件該欄位已有明確值（含 `0` 或空字串），SHALL 保留原值不覆蓋

#### Scenario: 繼承鏈不覆蓋顯式覆寫

- **WHEN** Order 印件已由業務在訂單階段覆寫 `TRACKED_PARITY_FIELDS` 中某欄位
- **THEN** 後續 seedData 重建 / enrich 執行 SHALL NOT 覆蓋此顯式值
- **AND** 依本 change D9 假設「業務初估不再改」，此情境在本 change 範圍預期不出現；若 audit 發現存在覆寫，SHALL 輸出警告要求確認業務意圖
- **AND** 若確認為合理覆寫，加入 `src/test/helpers/crossLayerSuppressions.ts`，格式 `{ printItemId: string, field: string, reason: string }`，由 audit test 讀取並跳過斷言

---

### Requirement: Factory 預設值覆蓋擴充欄位

Factory 函數集（`src/test/helpers/storeTestUtils.ts`）SHALL 為所有跨層流動的擴充欄位提供預設值，確保 e2e 測試使用 factory 建資料時，UI 不會因欄位缺失而顯示空白或破版。

#### Scenario: makeQuotePrintItem factory 存在且涵蓋擴充欄位

- **WHEN** 測試呼叫 `makeQuotePrintItem(overrides)`
- **THEN** SHALL 回傳包含下列預設值的 `PrintItem`：
  - `difficultyLevel: 5`（中等值，Miles 決策：僅做流程驗證）
  - `expectedProductionLines: []`
  - `specNotes: ''` / `shippingMethod: '宅配'` / `packagingNotes: ''` / `deliveryDate: '2026-04-30'`
  - 其他必填欄位依 `types/quote.ts PrintItem` 型別
- **AND** `overrides` 參數 SHALL 允許覆寫任一欄位

#### Scenario: makeOrderPrintItem factory 補齊擴充欄位預設

- **WHEN** 測試呼叫 `makeOrderPrintItem(overrides)`
- **THEN** 預設回傳值 SHALL 包含：
  - `difficultyLevel: 5`
  - `skipReview: false`
  - `expectedProductionLines: []`
  - `reviewDimensionStatus: undefined`
  - `reviewRounds: undefined`
  - `assignedReviewerId: null`
  - `orderSource: undefined`
  - `sourceItemNo` 為新必填欄位，預設自動依 factory 建立順序遞增
- **AND** 任一擴充欄位的預設值 SHALL 與既有 e2e 測試斷言兼容

#### Scenario: makeQuote factory

- **WHEN** 測試呼叫 `makeQuote(overrides)`
- **THEN** SHALL 回傳包含 `printItems[0] = makeQuotePrintItem()` 的 `QuoteRequest`，其他必填欄位依型別

### Requirement: AfterSalesTicket entity 與 Factory

Prototype 資料層 SHALL 新增 `AfterSalesTicket` entity，承載訂單已完成後的售後事件案件容器。Entity 包含以下核心欄位（完整欄位定義見 [after-sales-ticket spec § AfterSalesTicket 實體與欄位](../after-sales-ticket/spec.md)）：

- `id`、`order_id`（FK -> Order）、`case_no`（業務可讀編號 AS-YYYYMMDD-XX）
- `opened_at`、`opened_by`（FK -> User）
- `customer_complaint`（text）、`case_category`（enum）、`responsibility`（enum）
- `resolution`（enum，nullable）、`slack_thread_url`（URL，nullable）
- `additional_complaint_log`（array of {logged_at, note}）
- `customer_feedback_note`（text，nullable）
- `status`（enum: 受理中 / 處理中 / 已結案）
- `closure_status`（derived: 未結案 / 已結案）
- `closed_at`（timestamp，nullable）、`closed_by`（FK -> User，nullable）
- `legacy_migrated`（boolean，預設 false；標記是否為從歷史 OrderAdjustment(phase=after_completion) 遷移而來）
- `owner_transfer_log`（array of {transferred_at, previous_owner, new_owner, transferred_by, reason}；預設空陣列；業務主管批次轉派時 append，既有紀錄不可改）

Prototype `storeTestUtils.ts` SHALL 提供 `makeAfterSalesTicket(overrides)` factory，回傳含合理預設值的 AfterSalesTicket。`seedData.ts` SHALL 提供 mockAfterSalesTickets 含至少三筆情境驅動 mock：
- 一筆 resolution=不處理（已結案）
- 一筆 resolution=退款（處理中）
- 一筆 resolution=補印（處理中）

#### Scenario: makeAfterSalesTicket factory 提供預設值

- **WHEN** 測試呼叫 `makeAfterSalesTicket({})`
- **THEN** SHALL 回傳含下列預設值的 AfterSalesTicket：
  - status = 受理中
  - resolution = NULL
  - closure_status = 未結案
  - additional_complaint_log = []
  - legacy_migrated = false
- **AND** 其他必填欄位（order_id、opened_at、opened_by、case_category、responsibility）SHALL 由 overrides 提供或 factory 帶入合理 mock

#### Scenario: mockAfterSalesTickets 含三筆情境驅動 mock

- **WHEN** Prototype 啟動載入 seedData
- **THEN** mockAfterSalesTickets SHALL 至少包含三筆：
  - AS-XXX-不處理-已結案
  - AS-XXX-退款-處理中（含關聯 OrderAdjustment linked_after_sales_ticket_id）
  - AS-XXX-補印-處理中（含關聯補印 PrintItem related_after_sales_ticket_id）

### Requirement: PrintItem 加 related_after_sales_ticket_id FK

`OrderPrintItem` entity SHALL 新增 `related_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位，標示此 PrintItem 是否為補印（屬於某張售後 ticket）。

- **NULL**：原始訂單 PrintItem（轉訂單時建立）或訂單期間加印 PrintItem（不屬於售後）
- **非 NULL**：補印 PrintItem，業務於 AfterSalesTicket 內建立

補印 PrintItem 走原審稿 / 工單 / 生產任務 / QC / 出貨流程，無特殊路徑。`related_after_sales_ticket_id` 一經建立 MUST NOT 變動。

訂單詳情頁印件區塊 SHALL 區分顯示原始 PrintItem 與補印 PrintItem（後者標「補印（來自 AS-XXX）」）。

#### Scenario: 業務於 ticket 內建補印 PrintItem 自動關聯

- **GIVEN** AfterSalesTicket AS-001.resolution = 補印
- **WHEN** 業務於 ticket 內點「建立補印印件」並填入規格
- **THEN** 系統 SHALL 建 PrintItem，related_after_sales_ticket_id = AS-001
- **AND** PrintItem 出現在訂單詳情頁印件區塊，標「補印（來自 AS-001）」

#### Scenario: 原始 PrintItem 不影響 related_after_sales_ticket_id

- **GIVEN** Order 從 Quote 轉訂單時自動建立的 PrintItem
- **THEN** related_after_sales_ticket_id SHALL = NULL

### Requirement: OrderAdjustment entity 結構

OrderAdjustment entity SHALL 移除 `adjustment_phase` 欄位（v1.2 雙重身份廢止），新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位。

**欄位調整**：

| 欄位 | 異動 | 說明 |
|------|------|------|
| `adjustment_phase` | REMOVED | v1.2 雙重身份廢止，不再依 Order.status 推算 phase |
| `linked_after_sales_ticket_id` | ADDED | nullable，標示此 OrderAdjustment 是否源自某張 AfterSalesTicket。NULL = 訂單期間直接建立；非 NULL = ticket 內建關聯異動 |
| `adjustment_type` | 不變 | enum 列舉全保留，移除依 phase 的限制；UI 仍可依 ticket.resolution 預填合理值 |

Prototype `storeTestUtils.ts` 的 `makeOrderAdjustment(overrides)` factory SHALL 更新預設值：
- 移除 `adjustment_phase` 欄位
- `linked_after_sales_ticket_id` 預設 = NULL

`seedData.ts` 的 mockOrderAdjustments SHALL 更新：
- 移除 `adjustment_phase = after_completion` 路徑的 mock
- 改寫為「mock OrderAdjustment + linked_after_sales_ticket_id 指向對應 AfterSalesTicket」

歷史 phase=after_completion 的 OrderAdjustment 遷移策略：建對應 AfterSalesTicket（含 `legacy_migrated = true` 標記）並反向關聯，customer_complaint 從 OrderAdjustment.reason 帶入。完整遷移細節見 [OQ-MIGRATE-1](../../changes/add-after-sales-ticket/design.md#oq-migrate-1)。

#### Scenario: makeOrderAdjustment factory 不含 adjustment_phase

- **WHEN** 測試呼叫 `makeOrderAdjustment({})`
- **THEN** 回傳的 OrderAdjustment SHALL NOT 包含 `adjustment_phase` 欄位
- **AND** SHALL 包含 `linked_after_sales_ticket_id`（預設 NULL）

#### Scenario: 歷史資料遷移時 OrderAdjustment 反向關聯 ticket

- **GIVEN** 歷史 mockData 中存在 OrderAdjustment(phase=after_completion)
- **WHEN** Prototype seedData 重建
- **THEN** 系統 SHALL 為每筆歷史 phase=after_completion OA 建立對應 AfterSalesTicket
- **AND** 新建 AfterSalesTicket.legacy_migrated SHALL = true
- **AND** 新建 AfterSalesTicket.customer_complaint SHALL 從 OrderAdjustment.reason 帶入
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL 寫入新建 ticket id
- **AND** OrderAdjustment.adjustment_phase 欄位 SHALL 移除

### Requirement: Order entity 售後狀態 derived field

Order entity SHALL 新增 derived field（不存實體資料庫，UI 推導用）：

- `after_sales_status`（enum: 無 / 售後處理中 / 售後逾期 / 售後已結案）
  - **無**：訂單無關聯 AfterSalesTicket
  - **售後處理中**：訂單至少有 1 張 status ≠ 已結案 的 ticket，且 ticket.opened_at 距今 ≤ 7 天
  - **售後逾期**：訂單至少有 1 張 status ≠ 已結案 的 ticket，且 ticket.opened_at 距今 > 7 天
  - **售後已結案**：訂單所有 ticket 皆 status = 已結案
  - **N 天閾值**：MVP 預設 7 天，可未來於 [OQ-AST-3](../../changes/add-after-sales-ticket/design.md#oq-ast-3) 調整

訂單列表 / 訂單詳情頁 SHALL 依此 derived field 顯示「售後」徽章。

#### Scenario: 訂單有未結案 ticket 顯示徽章

- **GIVEN** Order 有 AfterSalesTicket.status = 處理中、opened_at = 5 天前
- **WHEN** UI 計算 Order.after_sales_status
- **THEN** 該值 SHALL = 「售後處理中」（黃色徽章）

#### Scenario: 訂單未結案 ticket 超過 7 天顯示逾期

- **GIVEN** Order 有 AfterSalesTicket.status = 處理中、opened_at = 10 天前
- **WHEN** UI 計算 Order.after_sales_status
- **THEN** 該值 SHALL = 「售後逾期」（紅色徽章）

---

<!-- Requirement「新增跨層欄位的 Change 工作流 Checklist」已移出本 change（Miles 2026-04-20 決策）。
     後續若跨層欄位漂移再次發生，另立 follow-up change `cross-layer-field-discipline` 處理。 -->

### Requirement: BillingInstallment 型別與 Zustand store 整合

Prototype 資料層 SHALL 新增 BillingInstallment TypeScript 型別與對應 Zustand store state / selector / action：

**型別位置**：`src/types/billingInstallment.ts`（新檔）

**完整欄位**（對齊 order-management spec § Data Model）：
```typescript
type InvoicingStatus = '未開立' | '已開立' | '已作廢';
type PaymentStatus = '未收' | '部分收款' | '已收訖';
type BillingInstallmentSourceType =
  | 'manual'
  | 'consultation_cancellation'
  | 'consultation_end_no_production'
  | 'quote_lost'
  | 'installment_split';

interface BillingInstallment {
  id: string;
  orderId: string;
  installmentNo: number;
  description: string;
  scheduledAmount: number;
  dueDate: string; // ISO date
  expectedInvoiceDate: string | null;
  invoicingStatus: InvoicingStatus;
  paymentStatus: PaymentStatus; // derived
  linkedInvoiceId: string | null;
  items: InvoiceItem[];
  note: string;
  sourceType: BillingInstallmentSourceType;
  splitFromInstallmentId: string | null; // 純追溯
  originalDueDate: string; // 凍結基準（首次儲存當下）
  originalExpectedInvoiceDate: string | null;
  changeCount: number; // derived from ActivityLog
  cancelled: boolean;
  cancelReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Store state**：`useErpStore.billingInstallments: BillingInstallment[]`

**核心 action**：
- `addBillingInstallment(bi)`：新建期次（首次儲存凍結 originalDueDate / originalExpectedInvoiceDate）
- `updateBillingInstallment(id, patch)`：修改期次（變動 dueDate / expectedInvoiceDate 時自動寫入 ActivityLog 對應事件 + changeCount +1）
- `splitBillingInstallment(id, [n1Spec, n2Spec])`：拆期（原期次 cancelled=true、建兩筆新期次平輩、寫入 SPLIT 事件 + 兩筆 BILLING_INSTALLMENT_CREATED 事件）
- `cancelBillingInstallment(id, reason)`：取消期次（cancelled=true、寫入 CANCELLED 事件）

**核心 selector**：
- `getBillingInstallmentsByOrder(orderId)`：取訂單下所有期次（cancelled=false）
- `getActiveBillingInstallmentsByOrder(orderId)`：取訂單下未取消期次
- `deriveBillingInstallmentPaymentStatus(id)`：依未取消已完成 PaymentAllocation 累計推導
- `getBillingInstallmentOverdueDays(id)`：沿用 v1.13 spec L1609 overdue_days 邏輯
- `getOrderReceivableMismatch(orderId)`：檢核 invariant「應收 = Σ scheduled_amount where cancelled=false」、返回差額用於警示 banner

#### Scenario: 業務新建期次首次儲存凍結原始日期基準

- **WHEN** 業務呼叫 `addBillingInstallment({ scheduledAmount: 30000, dueDate: '2026-06-01', expectedInvoiceDate: '2026-05-15', ... })`
- **THEN** Store SHALL 寫入新 BillingInstallment、originalDueDate = '2026-06-01'（凍結）、originalExpectedInvoiceDate = '2026-05-15'（凍結）
- **AND** Store SHALL 寫入 OrderActivityLog BILLING_INSTALLMENT_CREATED 事件

### Requirement: PaymentAllocation 型別與業務手動入帳 store actions

Prototype 資料層 SHALL 提供 PaymentAllocation TypeScript 型別與「業務手動入帳」store actions（Miles 拍板手動，取代原「系統依序填滿自動分配」模型）：

**型別位置**：`src/types/paymentAllocation.ts`

```typescript
interface PaymentAllocation {
  id: string;
  paymentId: string;
  billingInstallmentId: string | null; // NULL = 預收（未分配）桶
  allocatedAmount: number;
  autoAllocated: boolean; // 手動入帳模型下恆 false（保留相容）
  manuallyOverridden: boolean; // 手動入帳模型下恆 false（無自動預設值可覆寫，保留相容）
  lockedByPeriodClose: boolean; // 月結閉檔（Phase 1 預設 false）
  createdAt: string;
  updatedAt: string;
}
```

**Store state**：`useErpStore.paymentAllocations: PaymentAllocation[]`

**核心 store actions（業務手動入帳）**：
- `addPaymentWithAllocations(payment, allocations)`：一次寫入一筆 Payment + N 筆業務手動勾選的 PaymentAllocation；溢收（amount − Σ入帳 > 0）由呼叫端補一筆 billingInstallmentId=NULL 預收桶 allocation；寫入後重算受影響 BillingInstallment 收款維度狀態（僅已完成且未取消 Payment 計入）
- `updatePaymentWithAllocations(paymentId, patch, allocations)`：編輯既有 Payment 欄位 + 重設其 PaymentAllocation（取代舊 inline PaymentEditPanel 本地更新）；重算新舊分配涉及的 BillingInstallment 收款維度狀態
- `cancelPaymentWithAllocations(paymentId, reason)`：處理中 Payment 物理刪除（含其 PaymentAllocation）/ 已完成 Payment 邏輯刪除（cancelled=true、保留稽核）；重算受影響 BillingInstallment 收款維度狀態

**校驗**：入帳明細防呆於 UI 元件 inline 即時校驗「勾選入帳金額合計 ≤ Payment.amount」（手動入帳模型，取代舊「sum = Payment.amount 強制相等」）。

**已廢止（自動分配模型殘留，主流程不再使用）**：`allocatePaymentSequentially` / `autoFillDifferenceToLast` / `markManuallyOverriddenByDiff` / `validatePaymentAllocationsSum`（sum 強制相等）/ `getPaymentAllocationOverrideRate`（覆寫率）為原依序填滿 + 覆寫率模型 helper；改業務手動入帳後主流程不呼叫。`allocatePaymentSequentially` 於型別檔內保留作系統內生 seed（buildBillingInstallmentsFromLegacy）相容，其餘失去意義。

#### Scenario: 業務手動入帳寫入 Payment + N 筆 PaymentAllocation

- **GIVEN** 訂單下兩筆未收期次：BI-A（scheduledAmount=3000）+ BI-B（scheduledAmount=2000）
- **WHEN** 業務於「新增收款」勾 BI-A 填 3000、勾 BI-B 填 1000，呼叫 `addPaymentWithAllocations(payment(amount=4000, 已完成), [{BI-A,3000},{BI-B,1000}])`
- **THEN** store SHALL 寫入 Payment + 兩筆 PaymentAllocation（autoAllocated=false, manuallyOverridden=false）
- **AND** BI-A 收款維度推進「已收訖」、BI-B「部分收款」

#### Scenario: 入帳合計超過收款金額（UI 防呆擋下）

- **GIVEN** Payment amount = 5000、業務勾選入帳合計 6000
- **WHEN** UI inline 校驗
- **THEN** SHALL 判定超額（6000 > 5000）、紅標 + 禁止送出

#### Scenario: 溢收進預收桶

- **GIVEN** Payment amount = 6000、業務勾選入帳合計 5000
- **WHEN** 呼叫端建 allocations 時補一筆 billingInstallmentId=NULL allocatedAmount=1000
- **THEN** `addPaymentWithAllocations` SHALL 寫入該預收桶 allocation

### Requirement: OrderActivityLog 擴充 6 個事件型別

Prototype 資料層 SHALL 擴充 OrderActivityLog 型別 + Zustand store action：

**事件型別 enum**：新增以下值至既有 `OrderActivityLogEventType`：
- BILLING_INSTALLMENT_CREATED
- DUE_DATE_CHANGED
- EXPECTED_DATE_CHANGED
- SPLIT
- CANCELLED
- PAYMENT_ALLOCATION_SET（業務手動建立 / 修改入帳明細）
- **PRE_COMPLETION_AMOUNT_DECREASE（訂單收退款模型重構 新增：訂單完成前明細金額調降留痕——印件 price_per_unit / pi_ordered_qty 調降或 OrderExtraCharge.amount 調降 / 刪除致應收減少時寫入；弱把關、不阻擋、供主管事後查見）**

**每筆事件記錄欄位**（沿用既有 ActivityLog 結構 + payload 子物件）：
```typescript
interface OrderActivityLog {
  // ... 既有欄位
  eventType: OrderActivityLogEventType;
  payload: {
    billingInstallmentId?: string;
    paymentAllocationId?: string;
    paymentId?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    splitSpec?: { newInstallmentIds: string[]; spec: string };
    cancelReason?: string;
    // 訂單收退款模型重構 PRE_COMPLETION_AMOUNT_DECREASE 用：
    printItemId?: string;        // 調降對象印件（OEC 調降時為 orderExtraChargeId）
    decreaseFrom?: number;       // 調降前金額
    decreaseTo?: number;         // 調降後金額
    [key: string]: unknown;
  };
}
```

**核心 action**：
- `logBillingInstallmentEvent(eventType, billingInstallmentId, payload)`：寫入對應事件
- `logPreCompletionAmountDecrease(orderId, payload)`：訂單收退款模型重構——明細金額調降時寫入 PRE_COMPLETION_AMOUNT_DECREASE 事件
- `getChangeCountByInstallment(installmentId)`：query DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED 兩事件型別計數
- `getOrderPaymentChangeRate(orderId)`：query 訂單下所有期次與入帳相關修改事件次數（業務層級彙總）

#### Scenario: 寫入拆期事件

- **GIVEN** 業務拆 BI-001 為 BI-001-A + BI-001-B
- **WHEN** `splitBillingInstallment` action 執行
- **THEN** Store SHALL 寫入 OrderActivityLog SPLIT 事件 + 兩筆 BILLING_INSTALLMENT_CREATED 事件

#### Scenario: 完成前明細調降寫入留痕事件（訂單收退款模型重構）

- **GIVEN** 訂單 SO-001 未進入終態、某印件 price_per_unit = 100
- **WHEN** 業務於 Side Panel 改 price_per_unit = 90（調降）並儲存
- **THEN** Store SHALL 寫入 OrderActivityLog PRE_COMPLETION_AMOUNT_DECREASE 事件（payload: { printItemId, decreaseFrom: 100, decreaseTo: 90, 操作者, 時間 }）
- **AND** 印件費與訂單應收 SHALL 即時重算減少
- **AND** Store MUST NOT 阻擋或要求業務主管核可

### Requirement: cancelConsultation 諮詢取消收斂到一般訂單取消

`useErpStore.cancelConsultation` action SHALL 將諮詢取消的諮詢訂單收斂為一般訂單取消形態：

- 諮詢訂單 `status` 設為「**已取消**」（取代既有「訂單完成」）、`paymentStatus` 維持「已付款」
- 自動建退款 `OrderAdjustment`：`status='已核可'`、`approvedBy='system'`、`approvedAmount=-1000`、`executedAt=null`、`requiresSupervisorApproval=false`（取代既有 `status='已執行'`）
- **MUST NOT 自動建立 BillingInstallment**（移除既有 `newCancellationBI` + `cancellationBiEvent` 寫入）；`source_type='consultation_cancellation'` enum 值保留供業務手動建期次標示來源
- 退款 Payment（-1000, 處理中）+ 收款 Payment（+2000, 已完成）+ OrderExtraCharge（+2000）維持既有
- 寫 OrderActivityLog 留痕（OA 系統建立 + 後續業務調整金額事件）

**實作邊界（MUST 遵守）**：status / OA 改寫 SHALL 限定在 `cancelConsultation` 內的 `orderWithPayments` 組裝層，**MUST NOT 修改共用 `buildConsultationOrder` helper 本體**（諮詢結束不做大貨 / 需求單流失兩情境共用此 helper，須維持「訂單完成」終態 + 自動建 BillingInstallment 不受波及）。

#### Scenario: cancelConsultation 建已取消訂單 + 已核可 OA + 無自動建 BillingInstallment

- **WHEN** 呼叫 `cancelConsultation(crId, reason)`
- **THEN** 建立的諮詢訂單 `status='已取消'`、`paymentStatus='已付款'`
- **AND** 自動建退款 OA `status='已核可'`、`approvedBy='system'`、`executedAt=null`
- **AND** MUST NOT 寫入任何 BillingInstallment（無 source_type=consultation_cancellation 的待開期次）
- **AND** 收款 Payment(+2000, 已完成) + 退款 Payment(-1000, 處理中) 正常寫入

#### Scenario: buildConsultationOrder helper 不受波及（另兩情境回歸保護）

- **GIVEN** 諮詢結束不做大貨 / 需求單流失情境呼叫共用 `buildConsultationOrder` helper
- **WHEN** 系統建立諮詢訂單收尾
- **THEN** 該兩情境諮詢訂單 SHALL 維持 `status='訂單完成'` 終態
- **AND** 該兩情境 SHALL 維持自動建 BillingInstallment（source_type=consultation_end_no_production / quote_lost）不變

### Requirement: reconciliationCsv 差錯偵測涵蓋已取消有收入訂單

`reconciliationCsv.ts` 的 `calcReconciliationDiscrepancies` SHALL 將訂單篩選從 `orders.filter(o => o.status === '訂單完成')` 改為涵蓋 `status ∈ {訂單完成, 已取消}` 的訂單（已取消訂單須「有 status=開立 Invoice **或** 應收 ≠ 0」才納入——有發票者供對帳差錯偵測、未開票但留存收入者供差額警示兜底；全額退款應收=0 者排除以免污染）；`calcDiscrepancyRate` 分母同步調整。CSV 匯出層 `buildReconciliationRows` 維持既有（已以已開立發票為主軸，不需改）。

#### Scenario: 差錯偵測納入已取消有發票訂單

- **GIVEN** 已取消諮詢訂單有 status=開立 的諮詢費 Invoice
- **WHEN** 呼叫 `calcReconciliationDiscrepancies`
- **THEN** 該已取消訂單 SHALL 被納入差錯偵測訂單集合（不因 status=已取消 被排除）

#### Scenario: 已取消未開票但留存收入納入差額警示兜底

- **GIVEN** 已取消諮詢訂單尚未開立發票、應收 = 1000（≠ 0）
- **WHEN** 呼叫 `calcReconciliationDiscrepancies`
- **THEN** 該已取消訂單 SHALL 被納入偵測集合（依「應收 ≠ 0」條件，非「有開立發票」條件）
- **AND** 系統 SHALL 透過「應收 > 發票淨額」差額警示提醒未開票（應收 1000 > 發票淨額 0）

#### Scenario: CSV 匯出層不變

- **WHEN** 呼叫 `buildReconciliationRows` 匯出對帳 CSV
- **THEN** 匯出邏輯維持既有（以 status=開立 且非作廢 Invoice 為列，不依 order.status 篩選）
- **AND** 涵蓋率本就 100%（已取消訂單的已開立發票本就在匯出範圍內）

### Requirement: 訂單收退款模型重構 退款核銷應退差額 store 規格

Prototype 資料層 SHALL 提供「退款核銷對帳應退差額」的 selector 與 store action，退款完成判定與 OrderAdjustment 累計**解耦**（訂單收退款模型重構）：

**核心 selector**：
- `getOrderReceivable(orderId)`：應收總額 = ∑印件費 + ∑OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)
- `getOrderPaymentNet(orderId)`：收款淨額 = ∑(已完成 Payment.amount，含退款負數，linked_entity = 當前訂單)
- `getOrderRefundableGap(orderId)`：應退差額 = max(收款淨額 − 應收, 0)（> 0 即「退款待執行」；本 change 一律當該退，溢收 / 預收細分另議，見 BI-3）
- `getOrderGapOwner(orderId)`：缺口第一責任人 = `order.sales_id`（訂單負責業務；監督人 = 該業務之主管，由角色關係推導，不新增欄位）

**store action**：
- 退款 Payment 建立（amount < 0, paymentMethod = 退款, `linkedOrderAdjustmentId` 選填）→ 上傳匯款證明 → 切 paymentStatus = '已完成'：核銷應退差額；**MUST NOT 建 PaymentAllocation**（不進正向期次）；**MUST NOT 觸發 OrderAdjustment 狀態推進 / 回退**（OA 已執行於核可時已生效）。
- 退款完成判定 = 退款 Payment 自身 paymentStatus = '已完成'（物理錨點，掛匯款證明）；對帳 `getOrderRefundableGap` 歸零是結果呈現。
- 多筆退款 Payment 各自獨立切「已完成」、各自挂匯款證明附件；帳平判定看 `getOrderRefundableGap = 0`，不逐筆勾稽 OA。

#### Scenario: 退款 Payment 核銷應退差額不綁 OA

- **GIVEN** 訂單應退差額 = 10000（退款 OA-070 已執行致應收 −10000、尚未退款）
- **WHEN** 業務建退款 Payment P-070（amount = -10000, linkedOrderAdjustmentId = OA-070.id）、上傳匯款證明、切已完成
- **THEN** `getOrderPaymentNet` SHALL 減 10000、`getOrderRefundableGap` SHALL = 0
- **AND** P-070 MUST NOT 建 PaymentAllocation
- **AND** 系統 MUST NOT 因 P-070 切已完成而推進 / 回退 OA-070（OA-070 已於主管核可時推進已執行）

#### Scenario: 完成前減量退款不綁 OA（linkedOA 選填為 null）

- **GIVEN** 訂單完成前明細減量致應收 −30000、已收 > 應收、應退差額 = 30000
- **WHEN** 業務建退款 Payment（amount = -30000, linkedOrderAdjustmentId = null）、上傳匯款證明、切已完成
- **THEN** `getOrderRefundableGap` SHALL = 0（退款完成）
- **AND** 此退款無關聯 OA（完成前減量走明細直接改、未建 OA），linkedOrderAdjustmentId 留 null

### Requirement: reconciliationCsv 差錯偵測涵蓋終態集合（訂單收退款模型重構確認沿用）

`reconciliationCsv.ts` 的 `calcReconciliationDiscrepancies` 既有設計已涵蓋 `status ∈ {訂單完成, 已取消}` 的訂單篩選，與訂單收退款模型重構「明細鎖定點 = 訂單完成終態集合」一致（雙終態），**本 change 不需改動此偵測範圍**。訂單收退款模型重構 僅補充：對帳差額分解 SHALL 區分「待開票 / 待收 / 應退差額 / 待折讓」四向（見 [order-management § 三方對帳檢視面板](../order-management/spec.md)），差錯偵測 selector 沿用既有終態集合。

#### Scenario: 差錯偵測沿用終態集合不變

- **GIVEN** 訂單收退款模型重構 上線後對帳差錯偵測
- **WHEN** `calcReconciliationDiscrepancies` 執行
- **THEN** 訂單篩選 SHALL 維持 `status ∈ {訂單完成, 已取消}`（與訂單收退款模型重構 鎖定終態集合一致、不需改）
- **AND** 差額分解 SHALL 依四向（待開票 / 待收 / 應退差額 / 待折讓）標示

