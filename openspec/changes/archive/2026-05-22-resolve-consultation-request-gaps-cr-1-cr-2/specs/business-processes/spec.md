## MODIFIED Requirements

### Requirement: 諮詢前置流程端到端規則

當客人於 surveycake 表單付款成功觸發 webhook 後，系統 SHALL 依以下端到端流程處理：

```
[客人] surveycake 填表 → 付款成功 (webhook)
        ↓
ConsultationRequest 自動建立 (status=待諮詢)
+ Payment(linked_entity_type=ConsultationRequest, amount=諮詢費)
（不建任何 Order）
        ↓
諮詢人員自我認領 consultant_id (status=待諮詢)
（諮詢人員自行認領；主管亦可代為認領，詳見 consultation-request spec § 諮詢人員認領）
        ↓
諮詢人員與客戶討論（諮詢進行不在 status 機，v2 簡化）
（諮詢人員可於 consultant_note 欄位編輯溝通記錄，客戶原話 consultation_topic 唯讀）
        ↓
諮詢人員「結束諮詢」分支：
  ├ 不做大貨 → 建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee)
  │           Payment 從 ConsultationRequest 轉移至諮詢訂單
  │           諮詢訂單推進至訂單完成
  │           ConsultationRequest 狀態 = 完成諮詢
  │
  └ 做大貨 → 建需求單 (status=需求確認中)
            ConsultationRequest 狀態 = 已轉需求單
            Payment 維持綁 ConsultationRequest
            （MUST NOT 建任何 Order）
            （需求單 requirement_note 自 consultation_topic + consultant_note 雙區塊合併帶入）
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務「轉訂單」 (Order, type=線下)
            （訂單階段業務主管 gate 由獨立 change 處理）
                + Payment 從 ConsultationRequest 轉移至一般訂單
                + 一般訂單建立 OrderExtraCharge(consultation_fee)
                ↓
            訂單流程：報價待回簽 → ... → 訂單完成

需求單在議價中或更早任何狀態流失（做大貨分支的另一條路徑）：
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee)
  → Payment 從 ConsultationRequest 轉移至諮詢訂單
  → 諮詢訂單推進至訂單完成
  → ConsultationRequest 狀態從「已轉需求單」更新為「完成諮詢」

待諮詢取消（退費）：
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee)
  → Payment 從 ConsultationRequest 轉移至諮詢訂單
  → 同步建退款 Payment(amount=-諮詢費)
  → issue_now 路徑：開 Invoice + 開 SalesAllowance 抵銷
  → 諮詢訂單推進至訂單完成
  → ConsultationRequest 狀態 = 已取消
```

**諮詢費的對帳邏輯**：

- 諮詢結束**不做大貨**：建諮詢訂單收尾，三方對帳通過（應收 = 收款 = 發票 = 諮詢費）
- 諮詢結束**做大貨 + 需求單成交**：Payment 轉至一般訂單，一般訂單應收含諮詢費，三方對帳通過
- 諮詢結束**做大貨 + 需求單流失**：建諮詢訂單收尾（複用「不做大貨」路徑），三方對帳通過
- **待諮詢取消**：建諮詢訂單 + 退款 Payment 抵銷收款，發票（issue_now）+ SalesAllowance 抵銷淨額，標示「退費完成」

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾。複用單一收尾流程，不增加新訂單類型。

#### Scenario: 諮詢費走「不做大貨」分支端到端

- **GIVEN** 客人 surveycake 付諮詢費 2000 元（`consultation_invoice_option = defer_to_main_order`）
- **WHEN** webhook 觸發
- **THEN** 系統 SHALL 建立 ConsultationRequest（待諮詢）+ Payment（綁 ConsultationRequest、amount = 1000）
- **AND** 系統 MUST NOT 建立任何 Order
- **WHEN** 諮詢人員結束諮詢選擇「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 1000) + Payment 轉移
- **AND** 諮詢訂單推進至完成路徑（開 Invoice → 訂單完成）
- **AND** ConsultationRequest 狀態 = 完成諮詢

#### Scenario: 諮詢費走「做大貨 + 需求單成交」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、後續需求單議價成交報價總額 4000 元（印件費）
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單 + OrderExtraCharge(consultation_fee, 1000) + Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 一般訂單應收 = 5000、已收 = 1000、待繳 = 4000

#### Scenario: 諮詢費走「做大貨 + 需求單流失」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、Payment 綁 ConsultationRequest
- **WHEN** 後續需求單於議價中流失
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 1000) + Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單推進至完成路徑
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 待諮詢取消退費端到端

- **GIVEN** 客人付諮詢費 2000 元（`consultation_invoice_option = defer_to_main_order`）、ConsultationRequest 狀態 = 待諮詢
- **WHEN** 客人取消預約、業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 1000) + Payment 從 ConsultationRequest 轉移
- **AND** 系統 SHALL 在諮詢訂單上建立退款 Payment（amount = -1000）
- **AND** 諮詢訂單 status SHALL 推進至「訂單完成」（退費完成）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance（defer 路徑未開票）
