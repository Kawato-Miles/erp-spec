## ADDED Requirements

### Requirement: 請款與核銷流程（合併規劃層雙實體 + 自動分配）

系統 SHALL 提供以下統一請款 + 核銷流程，取代 v1.13「PaymentPlan 建立 + PlannedInvoice 建立 + Invoice 開立 + Payment 登錄 + PaymentInvoice junction 勾選」五步驟分散流程：

```
規劃 BillingInstallment（一次建立含應收日 / 預計開票日 / 金額 / 品項 / 備註）
   ↓
一鍵開票（從 BillingInstallment 繼承應收日 / 備註 / 品項 → Invoice，期次↔發票 1:1）
   ↓
登錄 Payment（系統依序填滿 PaymentAllocation 至各期 + 業務可手動覆寫）
   ↓
Payment 切已完成 → BillingInstallment.payment_status derived 更新
```

業務在規劃階段一次建期次即同時定義「何時收 + 何時開票 + 開什麼品項」三個面向，不再雙頭維護。事實層 PaymentAllocation 取代 PaymentInvoice junction 手動勾選，依「應收日早→晚」自動分配 + 業務可手動覆寫 + UI 即時校驗 sum 等於實收。

#### Scenario: 完整請款 + 核銷流程（一期一票一款情境 A）

- **GIVEN** 訂單成立後總額 30000
- **WHEN** 業務建立 BillingInstallment BI-001（scheduled_amount=30000, due_date=2026-06-01, expected_invoice_date=2026-05-15, items=[訂金品項], note=「訂金 30%」）
- **AND** 業務於 BI-001 點「一鍵開立發票」→ 系統建立 Invoice INV-001（total_amount=30000, items=深拷貝, source_billing_installment_id=BI-001.id）
- **AND** 業務登錄 Payment P-001（amount=30000）→ 系統依序填滿建 PaymentAllocation PA-001（payment_id=P-001, billing_installment_id=BI-001, allocated=30000, auto_allocated=true）
- **AND** 業務切 P-001 為已完成
- **THEN** BI-001.invoicing_status = 已開立、payment_status = 已收訖（兩維度均推進完成）
- **AND** 全流程業務操作步數從 v1.13 預估 ≥ 8 次降至 ≤ 4 次（CEO 指標 3）

### Requirement: 補收 / 退款不對稱操作流（訂單完成前後分容器）

系統 SHALL 提供以下兩條核心操作流，**訂單完成是路徑分水嶺**：未完成走 OA 直接建立、已完成必須先建 AfterSalesTicket 容器（OA 在 ticket 內建立、掛 linked_after_sales_ticket_id）。底層機制相同（OA + Payment + 折讓/作廢），ticket 只是容器 + 結案追蹤。

**補收（正項，免審核 + 進期次）**：
- 訂單完成前：業務直接建 OA(+N) → 跳過審核中間態直達已執行 → 業務新增 BillingInstallment 承載補收應收（或併入既有未開期次）→ 從期次一鍵開票 + 收款核銷（走情境 A）
- 訂單完成後：業務先建 AfterSalesTicket → ticket 內建 OA(+N, linked_after_sales_ticket_id) → 同樣跳過審核直達已執行 → 業務新增 BillingInstallment 承載補收應收 → 開票 + 收款核銷 → ticket 結案

**退款（負項，需業務主管核可 + 不進期次）**：
- 訂單完成前：業務直接建 OA(-N) → 送業務主管審核 → 已核可 → 業務於 OA 介面建退款 Payment（處理中）→ 補對帳附件切已完成 → 系統推進 OA 已執行 → 發票端折讓（跨月）/ 作廢重開（未跨月）；**退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次）
- 訂單完成後：業務先建 AfterSalesTicket → ticket 內建 OA(-N, linked_after_sales_ticket_id) → 同樣送業務主管審核 → 後續流程同上 → ticket 結案

#### Scenario: 訂單完成前補收 +8000 立即執行

- **GIVEN** 訂單在製作中、客戶要求加印 +8000
- **WHEN** 業務建立 OA-010（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** OA-010.status SHALL = 已執行（跳過審核中間態）
- **AND** 應收 SHALL = 100000 + 8000 = 108000
- **AND** Order 對帳檢視 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃」+ action「建立期次」
- **WHEN** 業務點 action 新增 BillingInstallment BI-010（scheduled_amount=8000）
- **AND** 業務於 BI-010 一鍵開票 + 客戶付款 + 切已完成
- **THEN** 補收流程完成，應收 = 發票淨額 = 收款淨額 = 108000

#### Scenario: 訂單完成後售後退款 -5000 透過 AfterSalesTicket

- **GIVEN** 訂單已完成、期2 尾款 70000 已開 INV-002 已收訖
- **WHEN** 業務建立 AfterSalesTicket（responsibility=客戶投訴, resolution=退款）+ ticket 內建 OA-020（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）並送審
- **AND** 業務主管核可 OA-020
- **AND** 業務於 OA 介面建退款 Payment P-020（amount=-5000, paymentMethod=退款, 處理中）+ 補對帳附件 + 切已完成
- **THEN** 系統推進 OA-020 = 已執行、應收 -5000
- **AND** P-020 MUST NOT 建立 PaymentAllocation（不進正向期次）
- **AND** BillingInstallment 期2 維持 payment_status = 已收訖、scheduled_amount = 70000（稽核保留）
- **WHEN** 業務於 INV-002 詳情頁建立 SalesAllowance（allowance_amount=-5000, refund_payment_id=P-020.id, status=已確認）
- **THEN** INV-002 自動顯示「已部分折讓 -5000」（既有 derived 折讓衍生標籤）
- **AND** 三方對帳對齊：應收 −5000 ｜ 發票淨額 −5000 ｜ 收款淨額 −5000
- **AND** 業務確認客戶滿意 → 點 ticket「結案」推進 ticket.status = 已結案

### Requirement: 先收後開操作流（雙維度狀態獨立）

系統 SHALL 支援「客戶先付款、業務後開票」情境：BillingInstallment 收款維度可先推進至「已收訖」、開票維度仍維持「未開立」；後續業務於該期次一鍵開票，開票維度才推進至「已開立」。雙維度互相獨立、不阻塞。

#### Scenario: 客戶先付訂金 30000 業務後開票

- **GIVEN** BI-030.scheduled_amount = 30000, invoicing_status = 未開立, payment_status = 未收
- **WHEN** 業務於 BI-030 登錄 Payment 30000、系統依序填滿建 PaymentAllocation、業務切 Payment 為已完成
- **THEN** BI-030.payment_status SHALL = 已收訖
- **AND** BI-030.invoicing_status SHALL 維持 = 未開立
- **WHEN** 業務後續點 BI-030「一鍵開立發票」
- **THEN** BI-030.invoicing_status SHALL → 已開立
- **AND** 兩維度均推進完成

### Requirement: 期次規劃 invariant + 三方對帳警示

訂單 SHALL 維護以下 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`。其中應收計算沿用 v1.13：`應收 = Σ 印件費 + Σ OrderExtraCharge.amount + Σ 已執行 OrderAdjustment.amount`。違反時對帳檢視（OrderReconciliationPanel）SHALL 顯示警示 banner「OA 已執行 N 元、但未對應期次規劃（差額 N）」+ action button「建立期次」（不阻擋業務操作、提示為主）。

#### Scenario: 補收 OA 已執行 + 未補建期次觸發警示

- **GIVEN** 訂單應收 = 印件費 100000 + 已執行 OA(+8000) = 108000
- **AND** Σ BillingInstallment.scheduled_amount where cancelled=false = 100000（業務未補建補收期次）
- **WHEN** 業務 / 會計查看 OrderReconciliationPanel
- **THEN** 系統 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃（差額 8000）」+ action「建立期次」
- **AND** 業務 MAY 點 action 開啟 BillingInstallment 新建 Dialog 預填 scheduled_amount = 8000

### Requirement: 三方對帳對齊驗證（含補收 / 退款場景）

系統 SHALL 沿用 v1.13 三方對帳 invariant 數學定義（應收 = 發票淨額 = 收款淨額、差額 = 0 對帳通過），補收 / 退款場景三方對齊邏輯 SHALL 延伸至本 change BillingInstallment + PaymentAllocation 結構而不破壞該 invariant。

三方對帳 invariant 沿用 v1.13 公式但延伸到本 change 結構：
- **應收**：Σ 印件費 + Σ OrderExtraCharge.amount + Σ 已執行 OrderAdjustment.amount
- **發票淨額**：Σ 已開立 Invoice.total_amount − Σ 已確認 SalesAllowance.|amount|（folded）
- **收款淨額**：Σ Payment.amount where paymentStatus = 已完成 且 linked_entity_type = Order（含正向收款 - 退款 Payment）

差額 = 應收 − 發票淨額 − 收款淨額；差額 = 0 時對帳通過。**補收 / 退款場景三方對齊邏輯沿用既有公式，新模型不影響該 invariant 數學定義**。

#### Scenario: 補收場景三方對帳對齊

- **GIVEN** 訂單應收 100000 → 補收 OA +8000 已執行 → 應收 108000
- **AND** 已開 2 張發票（INV-001 = 100000 + INV-002 = 8000）= 發票淨額 108000
- **AND** 已收 2 筆 Payment（100000 + 8000）= 收款淨額 108000
- **WHEN** 系統檢核三方對帳
- **THEN** 應收 108000 = 發票淨額 108000 = 收款淨額 108000、差額 = 0

#### Scenario: 退款場景三方對帳對齊（含折讓）

- **GIVEN** 訂單應收 100000 → 售後退款 OA -5000 已執行 → 應收 95000
- **AND** 已開 INV-001 = 100000 + SalesAllowance -5000 = 發票淨額 95000
- **AND** 已收 Payment +100000 + 退款 Payment -5000 = 收款淨額 95000
- **WHEN** 系統檢核三方對帳
- **THEN** 應收 95000 = 發票淨額 95000 = 收款淨額 95000、差額 = 0
