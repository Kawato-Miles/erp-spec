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
（諮詢人員自行認領；業務主管亦可代為認領，詳見 consultation-request spec § 諮詢人員認領）
        ↓
諮詢人員與客戶討論（諮詢進行不在 status 機，v2 簡化）
（諮詢人員可於 consultant_note 編輯溝通記錄，客戶原話 consultation_topic 唯讀）
        ↓
諮詢人員「結束諮詢」分支：
  ├ 不做大貨 → 建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  │           Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  │           系統自動建 PlannedInvoice(scheduledAmount=2000, description=「諮詢費」,
  │                                    expectedDate=當天, status=預計開立, createdBy=system)
  │           （MUST NOT 自動開立 Invoice、不論 consultation_invoice_option 值）
  │           諮詢訂單即時推進至「訂單完成」
  │           ConsultationRequest 狀態 = 完成諮詢
  │           後續：諮詢人員於 PendingInvoices 列表手動將 PlannedInvoice 轉立 Invoice
  │
  └ 做大貨 → 建需求單 (status=需求確認中)
            ConsultationRequest 狀態 = 已轉需求單
            Payment 維持綁 ConsultationRequest
            （MUST NOT 建任何 Order、MUST NOT 建任何 PlannedInvoice）
            （需求單 requirement_note 自 consultation_topic + consultant_note 雙區塊合併帶入）
                ↓
            需求單流程：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交
                ↓
            業務「轉訂單」 (Order, type=線下)
            （訂單階段業務主管 gate 由獨立 change 處理）
                + Payment(+2000) 從 ConsultationRequest 轉移至一般訂單
                + 一般訂單建立 OrderExtraCharge(consultation_fee, +2000)
                + 諮詢費 PlannedInvoice 不自動建（業務於主訂單既有發票時程規劃流程自行加入；
                  可參考 consultation_invoice_option 客戶意向決定獨立 / 併入其他 PlannedInvoice）
                ↓
            訂單流程：報價待回簽 → ... → 訂單完成

需求單在議價中或更早任何狀態流失（做大貨分支的另一條路徑）：
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  → Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單
  → 系統自動建 PlannedInvoice(scheduledAmount=2000, description=「諮詢費」,
                              expectedDate=當天, status=預計開立, createdBy=system)
  → （MUST NOT 自動開立 Invoice、不論 consultation_invoice_option 值）
  → 諮詢訂單即時推進至「訂單完成」
  → ConsultationRequest 狀態從「已轉需求單」更新為「完成諮詢」

待諮詢取消（半額退費）：
  → 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並確認
  → 系統建諮詢訂單(type=諮詢) + OrderExtraCharge(consultation_fee, +2000)
  → Payment(+2000) 從 ConsultationRequest 轉移至諮詢訂單（status 維持已完成）
  → 系統自動建 OrderAdjustment(-1000, type=諮詢取消退費, status=已核可, approved_by=system,
                              approved_at=取消時點)
  → 系統自動建退款 Payment(-1000, paymentMethod=退款, paymentStatus=處理中,
                          linkedOrderAdjustmentId=上述 OA.id)
  → 系統自動建 PlannedInvoice(scheduledAmount=1000, description=「諮詢費（取消退費後）」,
                              expectedDate=取消時點當天, status=預計開立, createdBy=system)
  → （MUST NOT 自動開立 Invoice 或 SalesAllowance、不論 consultation_invoice_option 值）
  → 諮詢訂單維持「建立」狀態
  → ConsultationRequest 狀態 = 已取消、cancel_reason_category 寫入 dialog 選定值
  → 退款撥付：依原付款方式刷退、由第三方金流處理
  → 客戶通知：諮詢人員手動執行（不入系統）
        ↓
諮詢人員後續手動動作：
  ├ 處理銀行退款金流 → 將退款 Payment 切「已完成」並上傳退款證明附件
  │   → OA 推進至「已執行」（依 order-management § OA 已執行推進規則）
  │   → 諮詢訂單從「建立」推進至「訂單完成」
  └ 將 PlannedInvoice 轉立 Invoice（金額由諮詢人員依客戶需求決定，建議 1000 元）
```

**諮詢費的對帳邏輯（本 change 後）**：

- 諮詢結束**不做大貨**：建諮詢訂單收尾，應收 = OEC(2000) = 收款 = 2000；發票淨額由諮詢人員手動開立決定（建議 2000 元）
- 諮詢結束**做大貨 + 需求單成交**：Payment 轉至一般訂單，一般訂單應收含 OEC(2000)，三方對帳通過；諮詢費 PlannedInvoice 由業務於主訂單發票時程規劃自行加入
- 諮詢結束**做大貨 + 需求單流失**：建諮詢訂單收尾（複用「不做大貨」路徑），對帳通過；自動建 PlannedInvoice 2000
- **待諮詢取消（半額退費）**：應收 = OEC(2000) + OA(-1000) = 1000；收款淨額 = +2000 - 1000 = 1000（兩筆 Payment 都已完成）；發票淨額由諮詢人員手動開立決定（建議 1000 元）；標示「對帳通過 - 退費完成」（既有 [order-management § 諮詢取消對帳邏輯](../order-management/spec.md)）

**統一規則**：所有「最終沒進入大貨製作」的路徑都建諮詢訂單收尾。複用單一收尾流程，不增加新訂單類型。所有諮詢費 Invoice 統一由諮詢人員於 PlannedInvoice 手動轉立流程處理（廢止 `consultation_invoice_option` 對發票自動化的影響）。

**`consultation_invoice_option` 欄位定位變更**：本 change 後此欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示，**不再驅動系統行為**（不影響 Invoice / SalesAllowance / PlannedInvoice 的自動建立或不建立）。業務於主訂單發票時程規劃時可參考此意向。

#### Scenario: 諮詢費走「不做大貨」分支端到端

- **GIVEN** 客人 surveycake 付諮詢費 2000 元（`consultation_invoice_option = defer_to_main_order`）
- **WHEN** webhook 觸發
- **THEN** 系統 SHALL 建立 ConsultationRequest（待諮詢）+ Payment（綁 ConsultationRequest、amount = +2000、status = 已完成）
- **AND** 系統 MUST NOT 建立任何 Order
- **WHEN** 諮詢人員結束諮詢選擇「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 轉移
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（scheduledAmount = 2000、description = 「諮詢費」）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 = 完成諮詢
- **AND** 諮詢人員 SHALL 後續手動將 PlannedInvoice 轉立 Invoice

#### Scenario: 諮詢費走「做大貨 + 需求單成交」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、後續需求單議價成交報價總額 4000 元（印件費）
- **WHEN** webhook 觸發、諮詢結束、需求單建立、議價成交
- **THEN** 系統 MUST NOT 建立任何 Order（Payment 維持綁 ConsultationRequest）
- **AND** 系統 MUST NOT 建立任何 PlannedInvoice
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 一般訂單應收 = 6000、已收 = 2000、待繳 = 4000
- **AND** 系統 MUST NOT 自動於主訂單建立諮詢費的 PlannedInvoice（業務自行規劃）
- **AND** 業務 SHALL 可參考 `consultation_invoice_option` 客戶意向決定主訂單發票時程

#### Scenario: 諮詢費走「做大貨 + 需求單流失」分支端到端

- **GIVEN** 客人付諮詢費 2000 元、諮詢結束選「做大貨」、Payment 綁 ConsultationRequest
- **WHEN** 後續需求單於議價中流失
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（scheduledAmount = 2000、description = 「諮詢費」）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 待諮詢取消半額退費端到端

- **GIVEN** 客人付諮詢費 2000 元（`consultation_invoice_option = issue_now` 或 `defer_to_main_order` 任一值）、ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id` = 諮詢人員 A
- **WHEN** 客人取消預約、諮詢人員 A 點擊「取消諮詢」按鈕、於 dialog 選定 `cancel_reason_category = 找到其他廠商` 並確認
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, +2000) + Payment(+2000) 從 ConsultationRequest 轉移
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id）
- **AND** 系統 SHALL 自動建立 PlannedInvoice（scheduledAmount = 1000、description = 「諮詢費（取消退費後）」）
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance（不論 `consultation_invoice_option` 值為何）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** ConsultationRequest.cancel_reason_category SHALL = `找到其他廠商`
- **WHEN** 諮詢人員 A 處理銀行退款金流後、於 OA 編輯介面將退款 Payment 切「已完成」並上傳退款證明
- **THEN** OA SHALL 推進至「已執行」
- **AND** 諮詢訂單 SHALL 推進至「訂單完成」終態
- **AND** 諮詢人員 A SHALL 手動將 PlannedInvoice 轉立 Invoice（金額由諮詢人員依客戶需求決定）
- **AND** 諮詢人員 A SHALL 手動通知客戶退款已處理（不入系統）
