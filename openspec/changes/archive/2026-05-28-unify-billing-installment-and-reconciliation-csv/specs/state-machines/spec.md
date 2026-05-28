## ADDED Requirements

### Requirement: BillingInstallment 雙維度狀態機

BillingInstallment SHALL 維護兩個獨立狀態維度，互相不耦合：

**開票維度（invoicing_status）**：
```
未開立 ──[業務一鍵開票]──▶ 已開立（linked_invoice_id 寫入、Invoice.source_billing_installment_id 寫入）
已開立 ──[Invoice 作廢]──▶ 已作廢回未開立（linked_invoice_id 設 NULL，可重新開票）
已作廢回未開立 ──[業務一鍵開票]──▶ 已開立（重啟）
```

**收款維度（payment_status，derived）**：
```
依未取消已完成 PaymentAllocation 累計推導：
  累計 = 0：未收
  0 < 累計 < scheduled_amount：部分收款
  累計 ≥ scheduled_amount：已收訖
```

兩維度推導獨立，支援：
- 先收後開：收款維度先到「已收訖」、開票維度仍「未開立」
- 先開後收：開票維度先到「已開立」、收款維度仍「未收」
- 開票後作廢重開：開票維度從「已開立」回「已作廢回未開立」、收款維度不動（保留稽核）
- 拆期：原期次 cancelled = true 不入兩維度推導；兩筆新期次各自獨立推導

#### Scenario: 先收後開雙維度獨立推進

- **GIVEN** BI-001（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收, cancelled=false）
- **WHEN** 業務登錄 Payment 30000 → 系統依序填滿建 PaymentAllocation（allocated=30000）→ 業務切 Payment 為已完成
- **THEN** BI-001.payment_status SHALL = 已收訖（已完成 PaymentAllocation 累計達 30000）
- **AND** BI-001.invoicing_status SHALL 維持 = 未開立
- **WHEN** 業務於 BI-001「一鍵開票」
- **THEN** BI-001.invoicing_status SHALL → 已開立
- **AND** BI-001.payment_status 維持 = 已收訖

#### Scenario: 發票作廢開票維度回退、收款維度不動

- **GIVEN** BI-002（invoicing_status=已開立, linked_invoice_id=INV-002, payment_status=已收訖）
- **WHEN** 業務於 INV-002 詳情頁作廢（填入作廢原因「統編誤填」）
- **THEN** INV-002.status SHALL = 作廢
- **AND** BI-002.invoicing_status SHALL → 已作廢回未開立、linked_invoice_id 設 NULL
- **AND** BI-002.payment_status SHALL 維持 = 已收訖（收款歷史保留）

#### Scenario: 拆期原期次 cancelled 不入推導

- **GIVEN** BI-003.scheduled_amount = 78000、業務點「拆此期」拆為 BI-003-A（2500）+ BI-003-B（75500）
- **WHEN** 系統執行拆期
- **THEN** BI-003.cancelled SHALL = true、cancel_reason = 「拆兩期」
- **AND** BI-003 SHALL NOT 入兩維度狀態推導（cancelled = true 期次過濾掉）
- **AND** BI-003-A / BI-003-B 各自獨立推導兩維度（初始 invoicing_status = 未開立、payment_status = 未收）

### Requirement: BillingInstallment 取代 PaymentPlan 狀態機（廢止 v1.13 PaymentPlan.status）

系統 SHALL 廢止 v1.13 PaymentPlan.status 三態（未收 / 部分收款 / 已收訖），由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925、過濾條件改為「未取消已完成 PaymentAllocation」）。

**BREAKING**：v1.13 PaymentPlan.status 三態（未收/部分收款/已收訖）廢止，由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925，過濾條件改為「未取消已完成 PaymentAllocation」）。

**Migration**：Prototype store 移除 derivePlanStatus helper，改為 deriveBillingInstallmentPaymentStatus helper。

#### Scenario: BillingInstallment.payment_status 由 PaymentAllocation 推導

- **GIVEN** BillingInstallment BI-001（scheduled_amount = 30000）
- **AND** PaymentAllocation PA-001（billing_installment_id=BI-001, allocated_amount=20000, payment.paymentStatus=已完成）
- **WHEN** 系統計算 BI-001.payment_status
- **THEN** 系統 SHALL 推導 payment_status = 部分收款（已分配 20000 < scheduled 30000）
- **WHEN** PaymentAllocation PA-002（allocated_amount=10000, payment.paymentStatus=已完成）追加
- **THEN** 系統 SHALL 推導 payment_status = 已收訖（已分配 30000 = scheduled 30000）

### Requirement: BillingInstallment 取代 PlannedInvoice 狀態機

系統 SHALL 廢止 v1.13 PlannedInvoice.status 三態（預計開立 / 已開立 / 已取消），由 BillingInstallment.invoicing_status 三態（未開立 / 已開立 / 已作廢回未開立）+ cancelled boolean 取代。

**BREAKING**：v1.13 PlannedInvoice.status 三態（預計開立/已開立/已取消）廢止，由 BillingInstallment.invoicing_status 三態（未開立/已開立/已作廢回未開立）+ cancelled boolean 取代：
- PlannedInvoice.status = 預計開立 → invoicing_status = 未開立 + cancelled = false
- PlannedInvoice.status = 已開立 → invoicing_status = 已開立 + cancelled = false
- PlannedInvoice.status = 已取消 → cancelled = true + cancel_reason 補寫
- 新增：invoicing_status = 已作廢回未開立（Invoice 作廢觸發回退，PlannedInvoice 既有設計無此態）

#### Scenario: BillingInstallment.invoicing_status 狀態流轉

- **GIVEN** BillingInstallment BI-001（invoicing_status = 未開立、cancelled = false）
- **WHEN** 業務於 BI-001 點「一鍵開立發票」、系統建立 Invoice INV-001 並回寫 BI-001.linked_invoice_id
- **THEN** BI-001.invoicing_status SHALL = 已開立
- **WHEN** INV-001 被作廢
- **THEN** BI-001.invoicing_status SHALL 回退至「已作廢回未開立」、BI-001.linked_invoice_id SHALL 清空
- **WHEN** 業務於 BI-001 點「取消期次」並補 cancel_reason
- **THEN** BI-001.cancelled SHALL = true、業務 SHALL 不再可於該期次新增開票或核銷動作

### Requirement: OrderAdjustment 狀態機修訂（補收正項跳過審核中間態）

系統 SHALL 沿用 v1.13 OrderAdjustment 狀態機主結構（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消），但 SHALL 新增 requires_supervisor_approval derived field 決定狀態流轉路徑：補收正項 OA SHALL 跳過審核中間態直達已執行、退款負項 OA SHALL 沿用主管核可路徑。

v1.13 OrderAdjustment 狀態機保留主結構：草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消。**新增 requires_supervisor_approval derived field 決定狀態流轉路徑**：

| OA 類型 | requires_supervisor_approval | 狀態流轉 |
|---------|----------------------------|---------|
| 補收正項（amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項}）| false | **草稿 → 已執行（跳過待主管審核 + 已核可）**；approved_by = 業務 user_id、executed_at = now；應收 +N 立即認列，**不綁 Payment** |
| 退款負項（amount < 0）| true | 草稿 → 待主管審核 → 已核可 / 已退回 → 已執行（沿用 v1.13）；綁定退款 Payment 切已完成累計達 OA.amount 才推進已執行 |
| 諮詢取消退費（系統內生，amount = -1000 固定）| false | **已執行**（系統建立直接已執行，approved_by = system、executed_at = now，v1.10 既有設計沿用）|
| 規格變更（amount = 0）| - | 不建 OA（沿用既有規則）|

**對稱破壞理由**：對齊台灣印刷業實務分權（主管把關現金流出方向、不把關客戶下單追加方向）。spec 中明示「補收 OA 立即認列應收、退款 OA 必須綁退款動作」兩條獨立 invariant。

#### Scenario: 補收 OA 跳過審核中間態直達已執行

- **GIVEN** 業務建立 OA-010（amount=+8000, adjustment_type=加印追加, linked_after_sales_ticket_id=null）
- **WHEN** 業務點「儲存並執行」
- **THEN** 系統 SHALL 設定 OA-010.requires_supervisor_approval = false
- **AND** OA-010.status SHALL 直接 = 已執行（跳過「待主管審核」與「已核可」中間態）
- **AND** OA-010.approved_by = 業務 user_id、executed_at = now
- **AND** 應收 SHALL 立即 +8000

#### Scenario: 退款 OA 沿用主管核可 + 綁退款 Payment 推進已執行

- **GIVEN** 業務建立 OA-011（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）
- **WHEN** 業務送審
- **THEN** OA-011.status SHALL = 待主管審核
- **WHEN** 業務主管核可
- **THEN** OA-011.status SHALL = 已核可
- **WHEN** 業務於 OA-011 介面建退款 Payment(-5000, 處理中) + 補對帳附件 + 切已完成
- **THEN** 系統 SHALL 驗證對應已完成 Payment 累計 = -5000 = OA-011.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-011.status → 已執行、executedAt = now

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

**BREAKING**：v1.13 spec「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則廢止。BillingInstallment 變更 SHALL NOT 觸發訂單狀態回退，改為：

1. 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / BILLING_INSTALLMENT_CREATED）含 operator / timestamp / old_value / new_value
2. BillingInstallment.change_count derived field 累計 due_date + expected_invoice_date 變更次數
3. 訂單狀態維持不變（業務操作不阻塞）

事後稽核透過：CEO 指標 4「期次變更次數 per-installment 平均」+ Slack 通知主管（補收 OA 大額閾值）+ ActivityLog 完整軌跡三管道。

#### Scenario: 業務修改期次日期不觸發回審

- **GIVEN** BillingInstallment BI-020.due_date = 2026-06-01、訂單狀態 = 製作中（已過業務主管審核）
- **WHEN** 業務修改 BI-020.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-020.change_count SHALL = 1
- **AND** Order.status SHALL 維持 = 製作中（**MUST NOT** 回退至「業務主管審核」）

#### Scenario: 業務拆期不觸發回審

- **GIVEN** 訂單狀態 = 製作中、BI-021.scheduled_amount = 78000
- **WHEN** 業務拆 BI-021 為 BI-021-A + BI-021-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件
- **AND** Order.status SHALL 維持 = 製作中（不回審）
