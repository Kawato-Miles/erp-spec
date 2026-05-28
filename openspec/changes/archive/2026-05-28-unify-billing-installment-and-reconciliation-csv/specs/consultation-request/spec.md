## ADDED Requirements

### Requirement: 諮詢取消半額退費自動建請款期次（取代既有自動建 PlannedInvoice）

系統 SHALL 沿用 v1.10「諮詢取消觸發建諮詢訂單與退費」主結構（半額退費 1000、自動建 OA(-1000)、自動建退款 Payment(-1000) 處理中、訂單推進完成），但「自動建 PlannedInvoice 1 筆」SHALL 替換為「自動建 BillingInstallment 1 筆」，含 source_type = consultation_cancellation。

v1.10 既有「諮詢取消觸發建諮詢訂單與退費」流程主結構保留（半額退費 1000、自動建 OA(-1000)、自動建退款 Payment(-1000) 處理中、訂單推進完成），但「自動建 PlannedInvoice 1 筆」改為「自動建 BillingInstallment 1 筆」，新增 source_type 三值分流。

**完整連動鏈（取代 v1.10 § 諮詢取消觸發建單）**：
1. 系統自動建立諮詢訂單（order_type = 諮詢、總額 = 諮詢費 2000）
2. 系統自動建立 OrderExtraCharge（charge_type = consultation_fee, amount = 2000）
3. 系統轉移 Payment 從 ConsultationRequest 至諮詢訂單（is_transferred = true）
4. 系統自動建立 OrderAdjustment(-1000, adjustment_type=諮詢取消退費, status=已執行, approved_by=system, executed_at=now, linked_after_sales_ticket_id=null)
5. 系統自動建立退款 Payment(-1000, paymentMethod=退款, paymentStatus=處理中, linkedOrderAdjustmentId=OA.id)
6. **系統自動建立 BillingInstallment**（取代 v1.10 既有自動建 PlannedInvoice）：scheduled_amount=1000、description=「諮詢費（取消退費後）」、due_date / expected_invoice_date=取消時點當天、`source_type = consultation_cancellation`、invoicing_status=未開立、payment_status=未收（後續由 PaymentAllocation 推導）、created_by=system
7. 諮詢訂單推進至「訂單完成」終態（不經製作 / 退款中間態）

#### Scenario: 諮詢取消自動建 BillingInstallment（取代 PlannedInvoice）

- **GIVEN** 諮詢人員或業務主管於諮詢取消 dialog 確認、cancel_reason_category 已選
- **WHEN** 系統執行連動鏈
- **THEN** 系統 SHALL 依步驟 1-7 完整執行
- **AND** 步驟 6 自動建立 BillingInstallment 含 `source_type = consultation_cancellation`、不建 PlannedInvoice
- **AND** 諮詢人員後續 MAY 於該 BillingInstallment 一鍵開立諮詢費 Invoice

### Requirement: 諮詢結束不做大貨情境自動建請款期次

系統 SHALL 於諮詢人員選「諮詢結束 + 不做大貨」時自動建立 BillingInstallment 1 筆（scheduled_amount=2000、source_type=consultation_end_no_production），取代 v1.10 既有自動建 PlannedInvoice。

v1.10 「諮詢結束選不做大貨」情境，系統自動建立諮詢訂單收尾，自動建立 BillingInstallment 1 筆（取代既有自動建 PlannedInvoice）：
- scheduled_amount = 2000（諮詢費全額）
- description = 「諮詢費」
- due_date / expected_invoice_date = 完成諮詢時點當天
- **source_type = consultation_end_no_production**（拆三個 enum 值，與 cancellation / quote_lost 區分）
- invoicing_status = 未開立、created_by = system

#### Scenario: 諮詢結束不做大貨自動建 BillingInstallment

- **GIVEN** 諮詢人員於諮詢單詳情頁選「結束 + 不做大貨」
- **WHEN** 系統觸發收尾連動
- **THEN** 系統 SHALL 自動建立諮詢訂單 + OEC + 轉移 Payment + 推進訂單完成
- **AND** 系統 SHALL 自動建立 BillingInstallment（scheduled_amount=2000, source_type=consultation_end_no_production, description=「諮詢費」, status=未開立, created_by=system）
- **AND** 諮詢人員 MAY 於 BillingInstallment 一鍵開立諮詢費 Invoice

### Requirement: 需求單流失情境自動建請款期次

系統 SHALL 於諮詢結束做大貨後需求單推進「流失」時自動建立 BillingInstallment 1 筆（scheduled_amount=2000、source_type=quote_lost），取代 v1.10 既有自動建 PlannedInvoice。

v1.10 「諮詢結束做大貨 → 需求單流失」情境，系統自動建立諮詢訂單收尾，自動建立 BillingInstallment 1 筆：
- scheduled_amount = 2000
- description = 「諮詢費」
- due_date / expected_invoice_date = 流失時點當天
- **source_type = quote_lost**（與 cancellation / end_no_production 區分，反映「需求單流失」非客戶取消是業務流失）
- invoicing_status = 未開立、created_by = system

#### Scenario: 需求單流失自動建 BillingInstallment

- **GIVEN** 諮詢後業務建立需求單、需求單後續推進「流失」
- **WHEN** 系統觸發諮詢訂單收尾連動
- **THEN** 系統 SHALL 自動建立 BillingInstallment（scheduled_amount=2000, source_type=quote_lost, description=「諮詢費」, status=未開立, created_by=system）
- **AND** 諮詢人員 MAY 於 BillingInstallment 一鍵開立諮詢費 Invoice

### Requirement: 諮詢結束做大貨主訂單不自動建諮詢費期次（沿用 v1.10）

v1.10 spec § 諮詢結束做大貨 → 需求單成交轉一般訂單情境保留：系統 MUST NOT 自動於主訂單建立諮詢費的 BillingInstallment（取代既有 PlannedInvoice）。業務於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment，可參考 `consultation_invoice_option` 客戶意向決定獨立 BillingInstallment 或併入其他主訂單 BillingInstallment。

#### Scenario: 諮詢結束做大貨主訂單不自動建期次

- **GIVEN** 諮詢結束選「做大貨」+ 需求單成交轉一般訂單
- **WHEN** 系統執行 ConsultationRequest → Order 轉換
- **THEN** 系統 MUST NOT 自動於主訂單建立諮詢費 BillingInstallment
- **AND** 業務 SHALL 於主訂單既有 BillingInstallment 規劃流程自行加入諮詢費期次
- **AND** 業務 MAY 參考 consultation_invoice_option 客戶意向決定獨立期次或併入其他 BillingInstallment
