# Store Actions Gap List

**建立時戳**：2026-04-20（tasks § 1.1-1.3 產出）
**來源**：`src/store/useErpStore.ts` 現況 + business-scenarios P0/P1 情境 walkthrough

## 現況 Actions 盤點（useErpStore.ts）

| 類別 | Action | 說明 |
|------|--------|------|
| Quote | addQuote / updateQuoteFields / updateQuoteStatus / updatePrintItems / addSnapshot / updateSharedMembers | 需求單 CRUD |
| Quote → Order | convertQuoteToOrder | 成交轉訂單（L419） |
| Order | addOrder / updateOrder / updateOrderStatus / confirmSignBack / getNextOrderNo | 訂單狀態推進（含免審稿快速路徑） |
| Prepress Review | submitReviewForPrintItem / updateReviewerCapability / setReviewerAvailableStatus / addReviewer / setReviewerActive / overridePrintItemAssignment | 審稿 + 審稿員管理 |
| WorkOrder | addWorkOrder / updateWorkOrder / updateWorkOrderStatus / addTaskToWorkOrder / updateProductionTask / addQcRecord / addModification | 工單 + 任務 + 生產任務 |
| WorkPackage | addWorkPackage / updateWorkPackage / removeWorkPackage | 工作包 |
| WorkReport | addWorkReport / tryReportWork | 報工（含權限守門） |

## Gap 對應情境（P0 = 必修、P1 = 能補就補）

### 情境 1 線下訂單全流程（P0）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 轉單 | convertQuoteToOrder | 存在 | — |
| 確認回簽 | confirmSignBack | 存在 | — |
| 審稿合格 | submitReviewForPrintItem | 存在 | — |
| 合格後自動建打樣工單 | buildAutoCreatedWorkOrder（內嵌） | 存在（`submitReviewForPrintItem` 內呼叫） | — |
| 印務填工單送製程審核 | updateWorkOrderStatus('製程確認中') | 可用 | — |
| 主管審核通過 | updateWorkOrderStatus('製程審核完成') | 可用 | — |
| 交付工單 | updateWorkOrderStatus('工單已交付') | 可用 | — |
| 師傅報工 | addWorkReport | 存在（自動推 PT 至「製作中」）| — |
| QC 通過 | addQcRecord + updateWorkOrderStatus('已完成') | 可用 | — |
| **填打樣結果（OK）** | **fillSampleResult** | **缺** | **P0 補** |
| 建打樣出貨單 | **createShipment** | **缺** | **P0 補** |
| 建大貨工單（打樣 OK 後）| 既有 addWorkOrder | 存在但需觸發時機邏輯 | P1 視情況 |
| 大貨全流程 | 同上 | — | — |

### 情境 2 一印件多工單（P0）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 審稿合格 → 建多張工單 | addWorkOrder（多次）| 存在 | — |
| 多任務層級 / 跨廠 | addTaskToWorkOrder（多次）+ updateProductionTask | 存在 | — |
| 手動延後交付工單 B | updateWorkOrderStatus（分次推進）| 存在 | — |

### 情境 10 QC 不通過 → 補 PT + 任務異動（P0，Miles 升級）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 建 QC 單 | addQcRecord | 存在 | — |
| **QC 填不通過** | **failQCRecord** 或 addQcRecord 內 status='不合格' | 可用 addQcRecord 但需明確 | **P0 補**：加獨立 action 或包裝函式 |
| 補生產任務（在現有 task 下加新 PT）| **addProductionTaskToTask** | **缺** | **P0 補** |
| 異動紀錄 | addModification | 存在 | — |

### 情境 11 分批出貨（P1）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| QC 批次通過 | addQcRecord（多筆）| 存在 | — |
| **建出貨單** | **createShipment** | **缺** | **P0 補**（情境 1 也需要）|
| **更新出貨狀態（出貨中/已送達）** | **updateShipmentStatus** | **缺** | **P1 補** |

### 情境 12 B2B 印件一次補件後通過（P0）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 首審不合格 | submitReviewForPrintItem（result=不合格）| 存在 | — |
| **業務補件上傳** | **resubmitPrintItemFile** | **缺** | **P0 補** |
| 重審合格（round 2）| submitReviewForPrintItem（'已補件' → '合格'）| 存在（L725 接受 '已補件' 為再審起點）| — |
| 合格後自動建工單 | buildAutoCreatedWorkOrder（內嵌）| 存在 | — |

### 情境 13 B2C 多輪補件（P0）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 同 12 但多輪 | 同上 | 同上 | 同 12（resubmitPrintItemFile P0 補齊即可支援多輪）|
| round 3 合格 | submitReviewForPrintItem | 存在 | — |

### 情境 15 免審稿（P0）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 轉單 | convertQuoteToOrder | 存在 | — |
| 確認回簽 → 免審稿快速路徑 | confirmSignBack（依 skipReview 自動判斷）| 存在（L580 有免審稿判斷邏輯）| — |
| 合格後自動建工單 | buildAutoCreatedWorkOrder | 存在 | — |

### 情境 3 打樣 NG 製程（P1）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| **填打樣結果（NG-製程問題）** | **fillSampleResult** | **缺** | **P0 補（情境 1 也需要）** |
| 同印件新打樣工單（觸發邏輯）| addWorkOrder + fillSampleResult 聯動 | 部分 | P1 視情況 |

### 情境 4 打樣 NG 稿件（P1）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 填打樣結果（NG-稿件問題）| fillSampleResult | 缺 | 同 P0 |
| **棄用原印件 + 建新打樣印件** | **rebuildPrintItemForSampleNG** | **缺** | **P1 補** |

### 情境 5 製程審核通過/退回（P1）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 印務送審 | updateWorkOrderStatus('製程確認中')| 存在 | — |
| 主管退回草稿 | updateWorkOrderStatus('草稿')| 存在 | — |
| 修正後再送 | 同上 | 存在 | — |

### 情境 6 工單收回（P1）

| 步驟 | 所需 action | 現況 | 補齊範圍 |
|------|------------|------|---------|
| 印務退回草稿 | updateWorkOrderStatus('草稿')| 存在 | — |

---

## Gap 總結

### P0 必補（6 項）

1. **`fillSampleResult(woId, result)`** — 填打樣結果（OK / NG-製程 / NG-稿件）。情境 1, 3, 4 必需
2. **`resubmitPrintItemFile(printItemId, input)`** — 業務/客戶補件。情境 12, 13 必需
3. **`createShipment(orderId, shipmentData)`** — 建出貨單。情境 1, 11 必需
4. **`updateShipmentStatus(orderId, shipmentId, status)`** — 更新出貨狀態。情境 1, 11 必需
5. **`failQCRecord(woId, qcId, reason)`** — QC 不通過（addQcRecord 的語意分離包裝）。情境 10 必需
6. **`addProductionTaskToTask(woId, taskId, pt)`** — 於既有 task 下補生產任務。情境 10 必需

### P1 補（1 項，P0 完成後做）

7. **`rebuildPrintItemForSampleNG(orderId, originalItemId, newItem)`** — NG-稿件問題棄用原印件建新印件。情境 4 必需

### 不需新增（用現有 actions）

- 製程審核退回 → `updateWorkOrderStatus('草稿')`
- 工單收回 → `updateWorkOrderStatus('草稿')`
- 審稿重審 → `submitReviewForPrintItem`（已接受 '已補件' 起點）

---

## 對本 change tasks 的影響

- tasks § 5.1（補 P0 actions）：改為實作上述 P0 必補 6 項
- tasks § 5.2（補 P1 actions）：改為實作 rebuildPrintItemForSampleNG 1 項
- P0 補齊估時：約 0.5-1 天（6 個 action，多數為既有資料結構的操作包裝）
- **無重大 P0 缺漏需降級為 P1**（§ 1.4 判斷通過）

---

## 建議 Miles 確認

1. `fillSampleResult` 的 UI 入口已存在嗎？若無，本 change 要一併加 UI 還是另立 change？
   - 建議：action 補上、UI 入口同步加一個簡單的「填打樣結果」按鈕於 WorkOrderDetail 頁面
2. `createShipment` / `updateShipmentStatus` 的 UI 入口已存在嗎？
   - 建議：OrderDetail 頁面加「建立出貨單」按鈕、Shipment 列表加狀態推進操作
3. P1 情境 4 的 `rebuildPrintItemForSampleNG` 若牽涉複雜 UI（建新印件表單），可降級至 P2 另立 change
