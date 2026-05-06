## MODIFIED Requirements

### Requirement: 需求單轉訂單欄位帶入規則

需求單轉為訂單時，系統 SHALL 依以下規則處理欄位帶入：

- **自動帶入（唯讀）**：客戶基本資料、印件規格
- **自動帶入（可編輯）**：交期與備註、付款資訊、訂金設定、案名（需求單 title → 訂單 case_name）
- **自動帶入（原值）**：各印件項目的預計產線（QuoteRequestItem.expected_production_lines → PrintItem.expected_production_lines）
- **不帶入**：報價紀錄、活動紀錄

**前置條件**：需求單 SHALL 為「已核准成交」狀態才能執行轉訂單；於「成交（待業務主管成交審核）」狀態下，業務 MUST NOT 可執行轉訂單（v3.0 變更，見 [quote-request spec](../quote-request/spec.md) § 成交轉訂單）。

**諮詢來源需求單的諮詢費處理**：當需求單 `from_consultation_request_id` 非空時，系統 SHALL 於主訂單建立時自動執行：

1. 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment.linked_entity_type 與 linked_entity_id）
2. 在主訂單上建立一筆 `OrderExtraCharge(charge_type = consultation_fee, amount = 諮詢費, description = 諮詢單編號)`
3. 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，主訂單上立即開立諮詢費 Invoice
4. 系統 MUST NOT 建立諮詢訂單（諮詢結束做大貨需求單成交情境下諮詢訂單從未建立）

主訂單應收 = ∑ 印件費 + ∑ OrderExtraCharge（含諮詢費）；主訂單已收 = 轉移過來的諮詢費 Payment + 後續客人補繳；客人實際補繳 = 主訂單應收 - 諮詢費。三方對帳通過。

#### Scenario: 需求單轉訂單時客戶資料帶入

- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 自動帶入客戶基本資料與印件規格，且這些欄位為唯讀狀態

#### Scenario: 需求單轉訂單時交期可編輯

- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 自動帶入交期與備註、付款資訊、訂金設定，且這些欄位允許使用者編輯

#### Scenario: 需求單轉訂單時案名帶入

- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 將需求單的 title 帶入訂單的 case_name 欄位
- **AND** case_name SHALL 允許業務編輯

#### Scenario: 需求單轉訂單時預計產線帶入

- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 將各印件項目的預計產線帶入對應 PrintItem 的 expected_production_lines
- **AND** 帶入後印件的預計產線 SHALL 可繼續編輯

#### Scenario: 需求單轉訂單時報價紀錄不帶入

- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 不帶入報價紀錄與活動紀錄至訂單

#### Scenario: 諮詢來源需求單轉訂單同步處理 Payment 轉移與 OrderExtraCharge

- **GIVEN** 需求單 `from_consultation_request_id` 非空，諮詢費 = 2000、印件費 = 4000、Payment 綁 ConsultationRequest
- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單
- **AND** 系統 SHALL 在主訂單上建立 OrderExtraCharge（charge_type = consultation_fee、amount = 1000）
- **AND** 系統 MUST NOT 建立諮詢訂單
- **AND** 主訂單應收總額 SHALL = 5000（印件費 4000 + 諮詢費 OrderExtraCharge 1000）
- **AND** 主訂單已收 SHALL = 1000（轉移過來的諮詢費 Payment）
- **AND** 主訂單待繳 SHALL = 4000

#### Scenario: 待業務主管成交審核狀態不可轉訂單

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 業務開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「轉訂單」按鈕
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核成交條件中」資訊

---

## ADDED Requirements

### Requirement: 諮詢前置流程端到端規則

當客人於 surveycake 表單付款成功觸發 webhook 後，系統 SHALL 依以下端到端流程處理：

```
[客人] surveycake 填表 → 付款成功 (webhook)
        ↓
ConsultationRequest 自動建立 (status=待諮詢)
+ Payment(linked_entity_type=ConsultationRequest, amount=諮詢費)
（不建任何 Order）
        ↓
業務指派 consultant_id (status=待諮詢)
        ↓
諮詢人員與客戶討論（諮詢進行不在 status 機，v2 簡化）
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
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務主管成交後審核 (status=已核准成交)
                ↓
            業務「轉訂單」 (Order, type=線下)
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
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交、業務主管核准
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **WHEN** 業務於「已核准成交」需求單執行「轉訂單」
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

---

### Requirement: 訂單應收計算規則（含諮詢費 OrderExtraCharge）

訂單應收計算 SHALL 以「印件費 + OrderExtraCharge + OrderAdjustment」三層構成，實際算式由 [order-management spec](../order-management/spec.md) § 三方對帳檢視面板 定義。

**三層構成**：

| 層級 | 概念 | 範例 |
|------|------|------|
| 印件費 | 訂單下各 PrintItem 的金額合計 | 名片印件 4000 |
| OrderExtraCharge | 訂單建立時即確定的其他費用明細 | 諮詢費 2000、運費 200、急件費 500 |
| OrderAdjustment | 訂單成立後的金額異動（需審核） | 規格變更 +500、退印 -300 |

**禁止的情境**：

- 諮詢費 OrderExtraCharge.amount > 0 但實際諮詢費 = 0 之類的不合理組合：系統 MUST 在建立時驗證 `OrderExtraCharge.amount = 對應 ConsultationRequest 的諮詢費`
- ConsultationRequest 的 Payment 已轉移後，再次嘗試從同一 ConsultationRequest 建立關聯訂單：系統 MUST 拒絕（透過 ConsultationRequest 與 Payment 1:1 關聯保證）

#### Scenario: 諮詢費 2000 + 印件 4000 主訂單應收計算

- **GIVEN** 主訂單印件費 = 4000、OrderExtraCharge(consultation_fee) = 1000、無其他費用、無 OrderAdjustment
- **WHEN** 系統計算應收
- **THEN** 主訂單應收 SHALL = 5000

#### Scenario: 諮詢費 + 運費 + 急件費組合

- **GIVEN** 主訂單印件費 = 4000、OrderExtraCharge: consultation_fee = 1000、shipping_fee = 200、rush_fee = 500
- **WHEN** 系統計算應收
- **THEN** 主訂單應收 SHALL = 5700

#### Scenario: 諮詢訂單應收 = 諮詢費

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee) = 1000、無印件、無其他費用
- **WHEN** 系統計算應收
- **THEN** 諮詢訂單應收 SHALL = 1000

#### Scenario: ConsultationRequest 的 Payment 已轉移後不可重複建立關聯訂單

- **GIVEN** ConsultationRequest CR-001 的 Payment 已轉移至訂單 A
- **WHEN** 系統嘗試從同一 ConsultationRequest CR-001 建立另一個關聯訂單 B
- **THEN** 系統 MUST 拒絕
- **AND** UI SHALL 顯示「此諮詢單已關聯訂單 [A]，無法重複建立關聯」
