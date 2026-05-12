## ADDED Requirements

### Requirement: 諮詢來源訂單的金額與付款狀態推導

諮詢訂單與諮詢來源一般訂單建立時，系統 SHALL 依以下規則推導 `totalAmount` / `productAmount` / `paymentStatus`：

**諮詢訂單**（order_type = '諮詢訂單'）：
- `productAmount` = 0（無印件）
- `totalAmount` = 諮詢費（OrderExtraCharge consultation_fee 的金額）
- `paymentStatus`：
  - 收尾路徑為「完成諮詢（不做大貨）」或「需求單流失」：Payment 轉移後 `paymentStatus = '已付款'`
  - 收尾路徑為「取消諮詢（退費）」：Payment 轉移 + 退款 Payment 寫入後 `paymentStatus = '已退款'`

**諮詢來源一般訂單**（order_type = '線下單'、`linkedConsultationRequestId` 非空）：
- `productAmount` = ∑ 印件報價金額
- `totalAmount` = productAmount + 諮詢費（OrderExtraCharge consultation_fee 的金額）
- `paymentStatus` 依 Payment 轉移狀況推導：
  - Payment 已轉移、客人未補繳：`paymentStatus = '部分付款'`（已收 = 諮詢費、待繳 = productAmount）
  - 客人補繳完成：`paymentStatus = '已付款'`

#### Scenario: 完成諮詢路徑諮詢訂單金額計算

- **GIVEN** ConsultationRequest 諮詢費 = 1000、諮詢人員選「完成諮詢（不做大貨）」
- **WHEN** 系統建立諮詢訂單並轉移 Payment
- **THEN** 訂單 `productAmount = 0`、`totalAmount = 1000`、`paymentStatus = '已付款'`
- **AND** 訂單詳情頁顯示應收 1000 / 已收 1000 / 待繳 0

#### Scenario: 取消退費路徑諮詢訂單金額計算

- **GIVEN** ConsultationRequest 諮詢費 = 1000、狀態為「待諮詢」、業務點擊「取消諮詢」
- **WHEN** 系統建立諮詢訂單、轉移 Payment、加退款 Payment
- **THEN** 訂單 `totalAmount = 1000`、訂單 payments = [原付款 +1000、退款 -1000]、淨額 = 0
- **AND** 訂單 `paymentStatus = '已退款'`
- **AND** 訂單詳情頁顯示應收 1000 / 已收 1000 / 退款 1000 / 淨額 0

#### Scenario: 諮詢來源一般訂單轉訂單時金額帶入

- **GIVEN** 需求單 linkedConsultationRequestId 非空、ConsultationRequest 諮詢費 = 1000、需求單 ∑ 印件金額 = 4000
- **WHEN** 業務於成交需求單執行「轉訂單」
- **THEN** 新建一般訂單 `productAmount = 4000`、`totalAmount = 5000`、ExtraCharge consultation_fee = 1000、payments = [從 cr 轉移的諮詢費 1000]
- **AND** 訂單 `paymentStatus = '部分付款'`（已收 1000、待繳 4000）

---

### Requirement: ConsultationRequestPayment 轉移後標記

ConsultationRequest 的 payments 陣列 SHALL 在 Payment 轉移至訂單時保留原項目，但於該項目加註 `transferredToOrderId` 欄位指向新訂單 id。

此設計目的：諮詢單詳情頁的 Payment 區塊 SHALL 仍可顯示原付款紀錄，並標示「已轉至訂單 [order-no]」連結，提供完整稽核足跡。訂單詳情頁的 `payments` 為獨立陣列，計算「已收 / 待繳」時 MUST NOT 重複計算諮詢單 payments。

系統重複觸發 Payment 轉移時 MUST 以 `transferredToOrderId` 非空判斷該筆已轉移、拒絕重做。

#### Scenario: 諮詢單詳情頁顯示已轉移付款連結

- **GIVEN** ConsultationRequest 已完成諮詢、Payment 已轉移至訂單 'order-cr-completed-001'
- **WHEN** 使用者開啟諮詢單詳情頁
- **THEN** Payment 區塊 SHALL 顯示原付款金額（綠色標記「已轉至訂單 order-cr-completed-001」）
- **AND** 點擊連結 SHALL 導航至訂單詳情頁

#### Scenario: 重複觸發 Payment 轉移被拒絕

- **GIVEN** ConsultationRequest 的 payments[0].transferredToOrderId 非空
- **WHEN** 系統 / 程式錯誤重複呼叫 transferPaymentsFromCr(cr, newOrder)
- **THEN** 系統 MUST 跳過已轉移的 payment（不重複 push 至新訂單）
- **AND** 系統 MAY 寫 ActivityLog 警示「重複轉移嘗試被拒絕」
