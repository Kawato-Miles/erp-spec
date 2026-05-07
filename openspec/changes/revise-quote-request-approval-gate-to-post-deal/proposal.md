## Why

需求單 v2.0（`add-sales-manager-quote-approval` change，2026-04-27 歸檔）將業務主管核可 gate 設置在「已評估成本 → 議價中」之間，但實務上此時點業務主管並無新資訊可判斷，淪為形式蓋章。真正需要業務主管把關的時點是「議價成交後、出報價單給客人之前」 — 此時報價單條件、付款條件、交期都已敲定，主管確認後才正式發給客人簽回，這跟「印章一蓋就外發」的真實工作節奏吻合。

本 change 翻轉業務主管 gate 的位置：從議價前移到成交後，使需求單推進至「轉訂單」前必經一道「成交後業務主管審核」gate。

此設計同時與 `add-consultation-request-and-revise-approval-gate` change 配合 — 諮詢來源需求單在議價中流失時，仍走相同流程（業務主管不需再次介入），但成交後的審核作為對外發送報價單的最終把關點。

## What Changes

- **BREAKING** `QuoteStatus` enum 擴充：新增「待業務主管成交審核」與「已核准成交」兩個狀態
  - 移除 v2.0 的「核可進議價」gate（業務可直接從「已評估成本」推進至「議價中」）
  - 新增成交後 gate：成交 → 待業務主管成交審核 → 已核准成交 / 流失
  - 「轉訂單」MUST 從「已核准成交」狀態觸發（v2.0 是從「成交」觸發）
- **BREAKING** 業務主管 actions 重新定義
  - 移除 `approveQuoteByManager`（議價前核可）
  - 新增 `approveDealByManager`（成交後審核）
- **業務主管專屬頁面** 篩選邏輯翻轉
  - 「需求單核可頁」（`/sales-manager/approvals`）篩選條件從 `status = '已評估成本'` 改為 `status = '待業務主管成交審核'`
- **既有欄位語意保留**：`approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` / `lastApprovedPaymentTermsNote` 欄位保留，但綁定的 gate 從議價前移至成交後
- **諮詢來源需求單流失** 維持既有流程（已由 `add-consultation-request-and-revise-approval-gate` change 處理）

## Capabilities

### New Capabilities
- 無（沿用 quote-request、state-machines、user-roles）

### Modified Capabilities
- `quote-request`: 狀態機翻轉（議價前 gate 移除、成交後 gate 新增）；`approveDealByManager` 取代 `approveQuoteByManager`；「轉訂單」前提變更
- `state-machines`: 需求單上層狀態機重新定義（新增兩狀態、改變業務主管 gate 位置）
- `user-roles`: 業務主管職責修訂（從議價前核可變更為成交後審核）

## Impact

- **現行 prototype 的衝擊**：
  - `src/types/quote.ts`：QuoteStatus enum 擴充 + STATUS_STEPS 重新定義
  - `src/store/useErpStore.ts`：移除 approveQuoteByManager、新增 approveDealByManager + convertQuoteToOrder 前提變更
  - `src/pages/SalesManagerApprovals.tsx`：篩選邏輯翻轉
  - `src/pages/QuoteDetail.tsx` / `src/components/quote/QuoteDetailPage.tsx`：業務主管 UI 動作翻轉
  - 預估 60+ 處引用變更，分批 commit

- **既有 mock 資料**：
  - 現有需求單 mock 中 `status = '議價中' / '成交' / '流失'` 的需重新評估是否符合 v3 流程
  - `lastApprovedPaymentTermsNote` 在 v3 下對應「成交後審核時的快照」而非「議價前核可時的快照」（語意翻轉但欄位保留）

- **與既有 change 的關係**：
  - 翻轉 `add-sales-manager-quote-approval`（2026-04-27 歸檔）的核心 gate 設計
  - 與 `add-consultation-request-and-revise-approval-gate`（active）的「已核准成交」狀態對齊
  - 與 `refactor-order-payment-and-invoice-with-billing-company` 無直接衝突
