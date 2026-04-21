## MODIFIED Requirements

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

## ADDED Requirements

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

---

<!-- Requirement「新增跨層欄位的 Change 工作流 Checklist」已移出本 change（Miles 2026-04-20 決策）。
     後續若跨層欄位漂移再次發生，另立 follow-up change `cross-layer-field-discipline` 處理。 -->
