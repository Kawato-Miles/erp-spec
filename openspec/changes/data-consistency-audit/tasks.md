## 1. Actions Gap 盤點（前置）

- [x] 1.1 讀 `src/store/useErpStore.ts` 現有 actions 列出清單
- [x] 1.2 對 P0 情境（1, 2, 10, 12, 13, 15）+ P1 情境（3, 4, 5, 6, 11）逐一 table-top walkthrough：從對應 mock 起點到情境終點所需 actions
- [x] 1.3 產出 `openspec/changes/data-consistency-audit/actions-gap-list.md`（本 change 交付物之一）
- [x] 1.4 依 gap list 調整 § 5 P0 / P1 actions 補齊範圍；P0 無重大缺漏超時，維持原分級

## 2. 7 筆 mock 資料鏈準備（demo-intent.md 為依據）

- [x] 2.1 Miles 確認「直接做」（2026-04-21 授權 Claude 草擬，不逐項審閱）
- [x] 2.2 caseName / client / 產線用語 Claude 草擬為台灣印刷業語感；Miles 未另外調整
- [x] 2.3 `PREPRESS_REVIEWERS` 既有多位 active 審稿員可接指派
- [x] 2.4 `demo-intent.md § 待確認事項 5 項` 移入 § 10.5 新 OQ 清單處理（Customer master、產線用語等）

## 3. 清除舊 mock demo 資料（依 design.md § D10 分層）

- [x] 3.1 `mockOrders.ts`：`export const mockOrders: Order[] = []`，刪除 5 筆既有 Demo 訂單
- [x] 3.2 `mockWorkOrders.ts`：`mockWorkOrderDetailsRaw = []`，`mockWorkOrderDetails = []`
- [x] 3.3 `mockDispatch.ts`：`mockDispatchTasks = []` / `mockWorkPackages = []` / `mockWorkReports = []`；保留 `mockWorkers` / `mockEquipmentList`（Master Data）
- [x] 3.4 `mockPrepressReview.ts`：demo 資料清空；保留 `PREPRESS_REVIEWERS`（Master Data）+ `REVIEWER_CAPABILITY_CHANGE_LOGS`
- [x] 3.5 `mockArtwork.ts` / `mockSchedulePanel.ts` / `mockSchedulingCenter.ts` / `mockDispatchBoard.ts`：demo 資料清空
- [x] 3.6 Lovable UAT：Miles 2026-04-21 回報「大體上流程 ok」，9 情境腳本跑通

## 4. 建立 7 條 mock 資料鏈

- [x] 4.1 重建 `mockQuotes.ts`：依 demo-intent.md Q1-Q7 建立 7 筆 Quote
- [x] 4.2 為 Q3/Q4/Q5/Q7 在 `mockOrders.ts` 建立對應預載 Order（含印件、`linkedQuoteId`、`sourceItemNo`）
- [x] 4.3 為 Q3 在 `mockWorkOrders.ts` 建預載大貨工單（狀態：製作中，報工達標）+ Q3 報工紀錄放 `mockDispatch.mockWorkReports`
- [x] 4.4 為 Q7 在 `mockWorkOrders.ts` 建預載打樣工單（狀態：已完成，含完整 QC）
- [x] 4.5 為 Q4/Q5 在 `mockOrders.ts` 印件內建預載 ReviewRound（首審不合格 + Q5 的 round 2 假檔案）
- [x] 4.6 確認 FK 完整：TypeScript 編譯 0 錯誤；dataConsistency.test.ts 驗證延至 § 6
- [x] 4.7 Lovable UAT：Miles 確認需求單 7 筆 + 訂單 4 筆 預載正確

## 5. 補齊 Store Actions（依 § 1 gap list；Miles 2026-04-21 決策：流程到報工即可，QC/出貨不做）

- [x] 5.1 依 gap list 補 P0 情境所需 actions：
  - 情境 1：`convertQuoteToOrder` + `confirmSignBack` + `submitReviewForPrintItem`(合格) + 既有 WO / 報工 actions（無新增需求）
  - 情境 2：同情境 1 + 多次 `addWorkOrder`（既有 action 支援）
  - 情境 12：**新增 `resubmitPrintItemFile`** + 既有 `submitReviewForPrintItem`
  - 情境 13：同 12（多輪補件相同 action）
  - 情境 15：既有 `convertQuoteToOrder`（補 `skipReview=true` 時 reviewStatus='免審稿'）+ `confirmSignBack` 免審稿快速路徑
- [x] 5.2 補 P1 情境所需 actions：
  - **新增 `fillSampleResult`**（情境 1, 3, 4）
  - **新增 `rebuildPrintItemForSampleNG`**（情境 4，NG-稿件棄用原印件建新印件）
  - 情境 5, 6：既有 `updateWorkOrderStatus` 已支援（製程審核通過/退回、工單收回）
- [x] 5.3 新增 actions 同步註記情境：`resubmitPrintItemFile` / `fillSampleResult` / `rebuildPrintItemForSampleNG`
- [x] 5.4 UI 入口：WorkOrderDetail 加「填打樣結果」按鈕 + Dialog；補件沿用既有 ResupplyDialog
- [x] 5.5 P0 actions 無重大缺漏，不需延後

## 6. 跨層欄位 Audit

- [x] 6.1 新增 `src/test/helpers/crossLayerAssertions.ts`：`assertQuoteOrderFieldParity` / `assertFKIntegrityForward` / `assertFKIntegrityReverseOrphans` / `assertOrderTotalAmountSum` / `assertIntraLayerInvariants` + `runDataConsistencyAudit`
- [x] 6.2 新增 `src/test/helpers/crossLayerSuppressions.ts`（預設空）
- [x] 6.3 `TRACKED_PARITY_FIELDS` 常數定義於 `storeTestUtils.ts`（audit / enrichment 共用）
- [x] 6.4 新增 `src/test/scenarios/dataConsistency.test.ts` 五組 describe（parity / FK 正向 / FK 反向孤兒 / 金額 / intra-layer invariant）
- [x] 6.5 第一次執行揪出 Q4 specNotes 斷點已修正；5/5 斷言全綠

## 7. Factory 擴充 + 繼承推導

- [x] 7.1 `storeTestUtils.ts` 新增 `makeQuotePrintItem(overrides)` factory
- [x] 7.2 新增 `makeQuote(overrides)` factory
- [x] 7.3 擴充 `makeOrderPrintItem` 預設值（含 `sourceItemNo` 自動遞增）
- [x] 7.4 `types/order.ts` 補 `Order.linkedQuoteId: string | null` 與 `OrderPrintItem.sourceItemNo: number`；`types/quote.ts` 補 `PrintItem.skipReview`
- [x] 7.5 `seedData.ts` 新增 `enrichOrdersFromQuotes(orders, quotes)` 函式，並在 `buildInitialState` 內呼叫
- [x] 7.6 修改 `useErpStore.ts` 的 `convertQuoteToOrder` action：補齊 `TRACKED_PARITY_FIELDS` 繼承 + 設 `linkedQuoteId` / `sourceItemNo`；`skipReview: true` 時 reviewStatus 直接設為 '免審稿'

## 8. 情境覆蓋 e2e 測試 + 欄位繼承範例

- [x] 8.1 新增 `src/test/scenarios/fieldInheritance.test.ts` 4 個 scenario（繼承 / skipReview / override / upstream-missing）
- [x] 8.2 新增 `src/test/scenarios/scenarioCoverage.test.ts` P0 情境（Miles 決策「流程到報工即可」收斂範疇）：
  - 情境 1 線下全流程（4 step：轉單 / 回簽 / 合格 / 報工）
  - 情境 12 B2B 補件完整 loop（不合格 → resubmit → 重審合格 round 2）
  - 情境 15 免審稿快速路徑
  - 情境 2 / 13 類似邏輯留 UAT 驗證（scenario 測試投資遞減）
- [x] 8.3 P1 情境（3, 4, 5, 6）actions 已補齊，scenario 測試留 UAT 驗證
- [x] 8.4 vitest 全 suite 147/147 綠燈，既有 e2e 測試（`fullProductionFlow` / `prepressReviewE2E` / `reviewToProduction` / `purchaseModels`）無 regression

## 9. Phase E → G 切換（Soft fail 轉 hard fail）

- [x] 9.1 切換 gating criteria 滿足：
  - P0 scenarioCoverage（情境 1 / 12 / 15）綠燈
  - dataConsistency 五組 describe 全綠
  - `crossLayerSuppressions` 空（無需 suppress）
  - actions-gap-list.md P0 項目全部 resolved
- [x] 9.2 `dataConsistency.test.ts` 採 `expect.toEqual([])` hard fail 模式（console.warn 僅 debug 輸出）
- [x] 9.3 本地 vitest CI 綠燈（147/147）；push Lovable 等待 Miles UAT 驗證
- [x] 9.4 本 change archive 前 gating 已達成

## 10. 驗證與歸檔

- [x] 10.1 Miles 2026-04-21 UAT：「大體上流程 ok」；UAT 期間發現的 UI bug 已於本 change 修復（審稿檔案三值 role / 工單指派印務 / 訂單上傳稿件入口 / 檔案欄位垂直堆疊 / 審稿紀錄三欄）
- [x] 10.2 Audit 斷言在 seedData 載入時已驗證跨層一致性；異常情境有 UAT 腳本建議（利用 DevTools Console 觸發）記錄於本 change 的 UAT 指引回應
- [x] 10.3 本地 vitest 綠燈 147/147（dataConsistency + fieldInheritance + scenarioCoverage + 既有 4 組 e2e 測試全綠）
- [x] 10.4 `doc-audit` 完成：索引層全綠；邏輯層補 CLAUDE.md § Spec 清單 4 個 spec + 新增 prepress-review delta spec 擴三值 file_role
- [x] 10.5 `oq-manage` 模式 B 新增 4 筆 OQ：ORD-011（Customer master）/ XM-008（Zod schema）/ WO-012（P2 情境後續）/ XM-009（Rules 機制）；本 change 既有 OQ PI-010 / PI-011 / XM-006 / XM-007 亦已盤點對齊
- [ ] 10.6 `/opsx:verify` 驗證實作符合 spec（執行中）
- [ ] 10.7 commit 完成 → `/opsx:archive data-consistency-audit` 歸檔，delta spec 合併回 main specs
- [x] 10.8 P2 情境（7, 8, 9）另立 change 的決策記錄於 WO-012 OQ；情境 14 已於 PI-011 覆蓋
