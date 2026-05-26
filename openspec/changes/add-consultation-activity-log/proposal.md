## Why

consultation-request spec v0.2（L479-505）已詳列 8 個事件型別 + 2 個 Scenarios 的「諮詢單活動紀錄」Requirement，但 prototype 完全沒實作：

1. `ConsultationRequest` type 沒有 `activityLogs` 欄位
2. 4 個諮詢單 store actions（`assignConsultant` / `endConsultationNoProduction` / `endConsultationWithQuote` / `cancelConsultation`）以及 `updateQuoteStatus` 流失分支建諮詢訂單時，都沒寫入 CR 層 activityLog
3. `ConsultationRequestDetail.tsx` 沒有活動紀錄區塊

結果：spec 規定「不做大貨 / 轉需求單 / 取消退費 / 認領 / 需求單流失觸發」等業務動作會留下稽核足跡，但詳情頁完全看不到，業務 / 諮詢人員 / 業務主管無法追溯諮詢單操作歷程。

quote-request spec L205-210 等價 Requirement 在 prototype 已完整實作（`types/quote.ts` 的 `ActivityLog` 型別 + `shared/ActivityTimeline` 元件 + 6 個 store action 寫入）。本 change 把同樣機制套用到諮詢單，補齊既有 spec 落地缺口。

## What Changes

- **新增** `ConsultationRequest.activityLogs: ActivityLog[]` 欄位（複用 `quote.ts` 既有 `ActivityLog` 型別，不另開）
- **修訂** 4 個諮詢單 store actions：set state 時呼叫既有 `createActivityLog` helper 累加事件
- **修訂** `updateQuoteStatus` 流失分支：諮詢來源需求單流失建諮詢訂單時，在 CR 同步寫入 activityLog（actor = 系統）
- **新增** `ConsultationRequestDetail` 在「付款紀錄」之後新增「活動紀錄」`ErpDetailCard`（沿用 `<ActivityTimeline>` 元件）
- **修訂** `mockConsultationRequests`：為既有 5 張 mock CR 依當前狀態反推回溯 activityLog 序列

## Capabilities

本 change **不修改 main spec**。consultation-request spec v0.2 § 諮詢單活動紀錄（L479-505）已詳列 8 個事件型別表格與 2 個 Scenarios，方向明確。本 change 僅補齊 prototype 對既有 spec 的落地缺口。

## Impact

- **修訂 prototype**：
  - `sens-erp-prototype/src/types/consultationRequest.ts`：加 `activityLogs` 欄位
  - `sens-erp-prototype/src/store/useErpStore.ts`：4 個 action + `updateQuoteStatus` 流失分支補 activityLog 寫入
  - `sens-erp-prototype/src/pages/ConsultationRequestDetail.tsx`：加活動紀錄區
  - `sens-erp-prototype/src/data/mockConsultationRequests.ts`：5 張 mock CR 補 `activityLogs`

- **本次涵蓋 5 個可觸發事件 + 1 個 mock-only 事件**：
  - mock seed only：諮詢單與付款記錄自動建立（webhook）
  - 諮詢人員認領
  - 結束諮詢 - 不做大貨
  - 結束諮詢 - 轉需求單
  - 需求單流失觸發建諮詢訂單（系統事件）
  - 待諮詢取消

- **Non-Goal**（spec 列但本次不做的 2 個事件）：
  - **主管代為認領** 事件寫入：CR-1（spec v0.2 新加）對應的「主管代為認領 dialog + `assignConsultantByManager` action」prototype 未實作，留待 CR-1 prototype change 隨案補。
  - **諮詢備註修改** 事件寫入：CR-2（spec v0.2 新加）對應的 `consultant_note` 雙欄位 + 編輯介面 prototype 未實作，留待 CR-2 prototype change 隨案補。

- **無 Notion 同步需求**（spec 不變）
- **無新 OQ**（探索階段已收斂三個 trade-off）

## Open Questions

無未決 OQ。探索階段（2026-05-26）已收斂的三個 trade-off：

| Trade-off | 決定 | 原因 |
|----------|------|------|
| 資料結構 | 完全對齊 quote 簡版 | 複用 `ActivityLog` 型別、`shared/ActivityTimeline` 元件，避免再開一套 |
| 詳情頁版型 | 維持 vertical card stack | 不引入 Tab，與既有諮詢單頁面 4 張卡視覺一致 |
| Mock 是否回溯 | 補回溯記錄 | 既有 5 張 mock CR 都有對應狀態，補事件序列讓詳情頁打開可看 |
