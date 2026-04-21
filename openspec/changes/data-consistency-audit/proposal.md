## Why

Prototype 已於 [2026-04-20-end-to-end-data-flow](../../changes/archive/2026-04-20-end-to-end-data-flow/) 建立完整 e2e 資料架構並沉澱為 [prototype-data-store spec](../../specs/prototype-data-store/spec.md)。然而現行 mock 架構有兩個嚴重落差：

**落差一：分散快照，無法端到端驗證**

既有 `mockOrders` / `mockWorkOrders` / `mockDispatch` / `mockPrepressReview` 是「已跑到不同階段的訂單快照」，UAT 者從任一訂單切入都是「半路狀態」，無法觀察從需求單一路走到報工的完整資料流動。[業務情境 spec](../../specs/business-scenarios/spec.md) 定義的 15 個關鍵情境（打樣全流程 / 一印件多工單 / 打樣 NG 分路 / 工單異動 / 任務層級作廢 / QC 不通過 / 分批出貨 / B2B/B2C 補件 / 審稿人員離職 / 免審稿等）未被 mock 系統性覆蓋。

**落差二：跨層欄位漂移**

`add-prepress-review` change 新增跨層欄位（`difficultyLevel` 等）時未同步更新 factory / seed / 繼承推導，導致 mockQuotes（0 筆 difficultyLevel）vs mockOrders（6 筆獨立值）vs mockPrepressReview（12 筆獨立值）對不齊。即使 UAT 走通流程，切換頁面看到同一印件不同難易度值，會立即喪失可信度。

本 change 同時解決兩個落差：改以「情境驅動 seed」為主軸（7 筆需求單 mock 覆蓋 15 情境 + 清除分散快照）、建立常駐 audit 保護跨層欄位一致性、並補工作流 checklist 避免再發生。

## What Changes

### A. Mock 架構重構（情境驅動，資料鏈連續）

- **BREAKING** 清除既有 `mockOrders.ts` / `mockWorkOrders.ts` / `mockDispatch.ts` / `mockPrepressReview.ts` 的 demo 資料
- 重建 7 筆情境驅動 mock，**每筆為一條完整資料鏈**：Quote（源頭）+ 視情境需要預載的 Order / 印件 / ReviewRound / WO / Report（資料鏈連續，不可斷）
- 預載中間階段的 mock 允許 UAT 者從情境「最有感檢查點」出發（例：Q4 預載到首審不合格讓 UAT 直接驗證補件流程）
- 7 筆 mock 具體設計見 `demo-intent.md`（v2.0，Claude 草擬 Miles 待確認）

### B. Store Actions 完備性補強

- 驗證並補齊從需求單到報工所需的 actions：`convertQuoteToOrder` / 審稿合格/不合格 / 建工單（含多工單）/ 打樣結果填寫（含 NG 分路）/ 製程審核通過/退回 / 工單收回 / 工單異動 / 任務層級作廢 / QC 通過/不通過 / 分批 QC / 建出貨單 / 報工
- 對 15 個情境逐一驗證：從該情境對應的需求單出發，UI actions 能否把資料推進到情境終點

### C. 跨層欄位一致性 Audit（常駐）

- 新增 `src/test/scenarios/dataConsistency.test.ts`，對 `TRACKED_PARITY_FIELDS` 執行 parity + FK 完整性（正向 + 反向孤兒）+ 金額彙總一致性
- 新增 `src/test/helpers/crossLayerAssertions.ts` + `crossLayerSuppressions.ts`

### D. Factory 擴充 + 繼承推導

- `storeTestUtils.ts` 新增 `makeQuotePrintItem` / `makeQuote`，擴充 `makeOrderPrintItem` 預設值
- `seedData.ts` 新增 `enrichOrdersFromQuotes` fill-down（即便情境驅動架構下 mock 無 Order，此邏輯仍服務於 UI 互動期的 Order 建立）
- `useErpStore.convertQuoteToOrder` 繼承清單審視

### E. 情境驅動 e2e 測試

- 新增 `src/test/scenarios/scenarioCoverage.test.ts`：每個 business-scenario 一組步驟累積式測試，驗證「從 mock 需求單一路走到情境終點」
- 新增 `src/test/scenarios/fieldInheritance.test.ts`：Quote → Order 欄位繼承範例

### F. ~~流程機制（治本）~~ — 移出本 change

依 CEO 審查建議與 Miles 2026-04-20 決策，Phase F（config.yaml rules / CLAUDE.md 原則 / DESIGN.md 守則 / agent 審查守則）**移出本 change**，避免把「商業問題（情境驅動 UAT）」與「工程自嗨（rules 機制）」綁在一起。

後續處理：待本 change archive 後若再次發生跨層欄位漂移事件，另立 change `cross-layer-field-discipline` 處理；在此之前不建制度護欄，相信 audit 常駐（C 節）作為最後防線足夠。

## Capabilities

### New Capabilities
（無）

### Modified Capabilities

- `prototype-data-store`：
  - MODIFIED Requirement「Seed Data 初始化」：改為情境驅動 seed（7 筆 mock 資料鏈，每條從 Quote 起）
  - ADDED Requirement「跨層欄位一致性 Audit 常駐」
  - ADDED Requirement「印件欄位單層不變量檢查」
  - ADDED Requirement「訂單金額彙總一致性 Audit」
  - ADDED Requirement「Quote → Order 欄位繼承推導」
  - ADDED Requirement「Factory 預設值覆蓋擴充欄位」
  - ADDED Requirement「情境驅動 Mock 完備性」
  - ~~ADDED Requirement「新增跨層欄位的 Change 工作流 Checklist」~~ 移出本 change

## Impact

### 新增檔案
- `openspec/changes/data-consistency-audit/demo-intent.md`（Miles 草擬 7 筆需求單設定；一次性文件）
- `src/test/scenarios/dataConsistency.test.ts`
- `src/test/scenarios/scenarioCoverage.test.ts`
- `src/test/scenarios/fieldInheritance.test.ts`
- `src/test/helpers/crossLayerAssertions.ts`
- `src/test/helpers/crossLayerSuppressions.ts`

### 修改檔案
- `src/data/mockQuotes.ts`（清除並重建為 7 筆情境驅動 Quote）
- `src/data/mockOrders.ts`（清除 demo，部分情境預載 Order 鏈 — 見 demo-intent.md）
- `src/data/mockWorkOrders.ts` / `src/data/mockDispatch.ts` / `src/data/mockPrepressReview.ts`（demo 資料清除；對 Q3/Q7 的預載 WO/PT/ReviewRound mock，在對應 mock 檔新增）
- `src/test/helpers/storeTestUtils.ts`（新增 `makeQuotePrintItem` / `makeQuote`，擴充 `makeOrderPrintItem`）
- `src/store/seedData.ts`（新增 `enrichOrdersFromQuotes`）
- `src/store/useErpStore.ts`（`convertQuoteToOrder` 繼承清單 + P0 情境所需 actions 補齊）
- `src/types/order.ts`（Order 補 `linkedQuoteId` / OrderPrintItem 補 `sourceItemNo`）

### 不影響
- UI 視覺與互動行為設計（僅底層資料流程補強 + 測試補強）
- 既有 e2e 測試（`fullProductionFlow` / `prepressReviewE2E` / `reviewToProduction` / `purchaseModels`）必須維持全綠（若使用 factory 建資料不受 seed 變更影響）
- ERP 生產系統（Prototype 獨立變更）

### 依賴
- 無新套件依賴
- 依賴既有 Zustand store + vitest 測試基礎建設

### 驗證
- push Lovable 後 CI 跑完整 test suite
- UI 驗證：操作 7 筆新 mock 需求單，逐一驗證能走到對應情境終點
