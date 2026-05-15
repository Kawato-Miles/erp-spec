## MODIFIED Requirements

### Requirement: 需求單流失觸發建諮詢訂單收尾

當諮詢結束選「做大貨」後，需求單於議價中或更早任何狀態流失時，系統 SHALL 觸發「建諮詢訂單收尾」流程，複用「不做大貨」的諮詢訂單路徑：

1. 系統建立諮詢訂單（type=諮詢、客戶資料來自原 ConsultationRequest、總額 = 諮詢費）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單
4. 諮詢訂單推進至完成路徑（依 invoice_option 開立 Invoice → 訂單完成）

ConsultationRequest 狀態 MUST 從「已轉需求單」更新為「完成諮詢」（最終結局）。`linked_consultation_order_id` 寫入新建諮詢訂單 ID。

**設計理由**：複用「最終沒進入大貨製作」的單一收尾流程，避免新增訂單類型或新流程。本情境在 [order-management spec § 訂單建立](../order-management/spec.md) 概念分類上歸入「不做大貨」高層情境（觸發點 3.2，與諮詢人員直接點不做大貨並列）。

**重要限制**：本 Requirement 僅適用於 `linked_consultation_request_id` 非空（諮詢來源）的需求單。**非諮詢來源**（直接從需求單建立、`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不觸發本流程**。

#### Scenario: 議價中需求單流失觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 需求單狀態為「議價中」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（type=諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑（已開發票 → 訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID
- **AND** ConsultationRequest 同時保留 `linked_quote_request_id`（保留歷史足跡）
- **AND** 系統 ActivityLog SHALL 將事件歸類標籤標為「不做大貨」（與觸發點 3.1 諮詢人員直接點不做大貨同分類）

#### Scenario: 早期狀態需求單流失（待評估成本前）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單
- **AND** 需求單狀態為「需求確認中」或「待評估成本」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 狀態更新）

#### Scenario: 非諮詢來源的需求單流失不觸發本流程

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（業務直接從需求單建立、無諮詢階段）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 系統 MUST NOT 觸發本 Requirement 的任何動作
- **AND** 需求單流失走需求單自身的退款 / 流失流程（不在本 spec 範圍）
