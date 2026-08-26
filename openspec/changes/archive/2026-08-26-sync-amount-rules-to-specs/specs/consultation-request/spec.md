## MODIFIED Requirements

### Requirement: 諮詢前置流程端到端規則

當客人於 surveycake 表單付款成功觸發 webhook 後，系統 SHALL 依以下端到端流程處理：

```
[客人] surveycake 填表 → 付款成功 (webhook)
        ↓
ConsultationRequest 自動建立 (status=待諮詢, cancel_reason_category=NULL)
+ Payment(linked_entity_type=ConsultationRequest, amount=+2000, status=已完成)
（不建任何 Order）
        ↓
諮詢人員自我認領 consultant_id (status=待諮詢)
        ↓
諮詢人員與客戶討論
        ↓
諮詢人員「結束諮詢」分支：
  ├ 不做大貨 → 建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  │           Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  │           系統自動建 BillingInstallment
  │           諮詢訂單即時推進至「訂單完成」
  │           ConsultationRequest 狀態 = 完成諮詢
  │
  └ 做大貨 → 建需求單 (status=需求確認中)
            ConsultationRequest 狀態 = 已轉需求單
            Payment 維持綁 ConsultationRequest
            （MUST NOT 建任何 Order、MUST NOT 建任何 BillingInstallment）
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務「轉訂單」
                + Payment(+2000) 從 ConsultationRequest 轉移至一般訂單
                + 一般訂單建立 OrderExtraCharge(consultation_fee, +2000)

需求單流失（做大貨分支另一條路徑）：
  → 系統建諮詢訂單收尾（複用「不做大貨」路徑）

待諮詢取消（半額退費）：
  → 系統建諮詢訂單 + OrderExtraCharge + Payment 轉移
  → 系統自動建 OrderAdjustment(-1000) + 退款 Payment(-1000, 處理中)
  → 諮詢訂單 status = 已取消
  → ConsultationRequest 狀態 = 已取消
```

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾。諮詢費 Invoice 統一由諮詢人員 / 業務手動開立。終態分流：不做大貨 / 需求單流失 = 訂單完成、諮詢取消 = 已取消。

**`consultation_invoice_option` 欄位定位**：此欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示，**不再驅動系統行為**。

**Priority**: P0

**Rationale**: 諮詢前置流程端到端規則確保諮詢費在任何結束路徑都能正確收尾並通過三方對帳。

#### Scenario: 諮詢費走「不做大貨」分支端到端

- **GIVEN** 客人 surveycake 付諮詢費 2000 元
- **WHEN** webhook 觸發
- **THEN** 系統 SHALL 建立 ConsultationRequest（待諮詢）+ Payment（綁 ConsultationRequest、amount = +2000、status = 已完成）
- **AND** 系統 MUST NOT 建立任何 Order
- **WHEN** 諮詢人員結束諮詢選擇「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、source_type = consultation_end_no_production、invoicing_status = 未開立）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 = 完成諮詢

#### Scenario: 諮詢費走「做大貨 + 需求單成交」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、後續需求單議價成交，各印件項目小計（單價 × 數量，取整）合計 4000 元
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **AND** 系統 MUST NOT 建立任何 BillingInstallment
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 訂單商品小計 SHALL 由各印件售價原值繼承後加總 ＝ 4000（見 [order-management spec § 成交轉訂單](../order-management/spec.md)）
- **AND** 一般訂單應收 = 6000、已收 = 2000、待繳 = 4000

#### Scenario: 諮詢費走「做大貨 + 需求單流失」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、Payment 綁 ConsultationRequest
- **WHEN** 後續需求單於議價中流失
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount = 2000、source_type = quote_lost、invoicing_status = 未開立）
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 維持「已轉需求單」不變

#### Scenario: 待諮詢取消半額退費端到端

- **GIVEN** 客人付諮詢費 2000 元、ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員點擊「取消諮詢」並選定 cancel_reason_category
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment(+2000) 從 ConsultationRequest 轉移
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = 諮詢取消退費、status = 已核可）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中）
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance
- **AND** 諮詢訂單 status SHALL 直接推進至「已取消」
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
