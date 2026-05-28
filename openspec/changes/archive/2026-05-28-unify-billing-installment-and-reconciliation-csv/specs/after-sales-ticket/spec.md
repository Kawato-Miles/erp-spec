## ADDED Requirements

### Requirement: 售後 ticket 內建 OA 連動 BillingInstallment（取代 PaymentPlan / PlannedInvoice 連動）

系統 SHALL 沿用 v0.6 AfterSalesTicket → OA → Payment + 折讓 / 作廢連動鏈主結構，且 SHALL 對齊 v1.14 結構性變更：補收 OA 跳過審核中間態 + 退款 OA 沿用主管核可 + 補收場景由業務新增 BillingInstallment 取代 PaymentPlan + 退款 Payment MUST NOT 建立 PaymentAllocation 以保留正向期次稽核歷史。

v0.6 既有「AfterSalesTicket → OA → Payment + 折讓/作廢」連動鏈主結構保留，本 change 沿用：
- 訂單完成後補收（客戶承擔）：ticket 內建 OA(+N) → 跳過審核中間態直達已執行（補收 OA 新規則）→ 業務新增 BillingInstallment 承載補收應收 → 開票 + 收款核銷
- 訂單完成後退款：ticket 內建 OA(-N) → 業務主管核可 → 業務於 OA 介面建退款 Payment（處理中）+ 補對帳附件 + 切已完成 → 系統推進 OA 已執行 → 發票端折讓 / 作廢
- 補印免費（公司認賠）：ticket 內建補印 PrintItem（沿用既有設計、不建 OA）

對齊本 change 結構性變更：
- ticket 內建 OA 沿用「補收正項跳過審核 / 退款負項主管核可」對稱破壞規則（補收進期次、退款不進期次）
- ticket 內補收場景由業務新增 BillingInstallment（取代既有「業務新增 PaymentPlan」）
- 退款 Payment 不建 PaymentAllocation（不進正向期次，保留 BillingInstallment 稽核歷史）

#### Scenario: 訂單完成後客戶承擔補印費 ticket 內建 OA 立即執行

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=客戶承擔, resolution=補印）
- **WHEN** 業務於 ticket 內建 OA-200（amount=+3000, adjustment_type=補退, linked_after_sales_ticket_id=ticket.id）並點「儲存並執行」
- **THEN** OA-200.status SHALL = 已執行（跳過審核中間態）
- **AND** 應收 SHALL +3000
- **AND** 業務 MAY 新增 BillingInstallment「售後補印費 3000」承載補收應收
- **AND** 業務於該期次一鍵開票 + 收款核銷後 → ticket 結案

#### Scenario: 訂單完成後售後退款 ticket 內建 OA 沿用主管核可

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=客戶投訴, resolution=退款）
- **WHEN** 業務於 ticket 內建 OA-201（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）並送審
- **THEN** OA-201.status SHALL = 待主管審核
- **WHEN** 業務主管核可 + 業務建退款 Payment + 切已完成
- **THEN** 系統推進 OA-201 = 已執行、應收 -5000
- **AND** 退款 Payment MUST NOT 建 PaymentAllocation（不進正向期次）
- **AND** 業務於 INV 詳情頁建 SalesAllowance（refund_payment_id 關聯退款 Payment）
- **AND** 業務確認客戶滿意 → 點 ticket「結案」

#### Scenario: 補印免費場景沿用既有設計（不建 OA + 不影響 BillingInstallment）

- **GIVEN** 訂單已完成、業務建立 AfterSalesTicket（responsibility=公司認賠, resolution=補印）
- **WHEN** 業務於 ticket 內建補印 PrintItem
- **THEN** 系統 MUST NOT 建立 OrderAdjustment
- **AND** 訂單應收 / BillingInstallment / 發票 / 收款 SHALL 完全不變動
- **AND** 不出現對帳警示 banner（無 OA 執行）
