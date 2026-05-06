# business-scenarios — Delta Spec

## ADDED Requirements

### Requirement: 兩帳務公司多期付款與發票合併情境

系統 SHALL 通過此端到端情境驗證「兩個 BillingCompany 並存 + 多期付款 + 發票合併」的資料流，作為三方對帳邏輯的整合測試。Prototype MUST 能完整跑通下列 10 步驟並對帳通過。

**情境設定**：
- 帳務公司 A：森紙股份有限公司（ezpay_merchant_id = 3502275）
- 帳務公司 B：奕果有限公司（ezpay_merchant_id = 3502276）
- 客戶 X：與兩家帳務公司都有業務往來
- 訂單 #O-25050601 的 billing_company = A
- 訂單 #O-25050602 的 billing_company = B
- 兩張訂單可能在同一天建立

**端到端步驟**：
1. 業務於需求單 Q-001 選 billing_company = A，成交轉訂單 → Order #O-25050601 繼承 billing_company_id = A
2. 業務建立 PaymentPlan：訂金 30,000 + 尾款 70,000
3. 客戶轉訂金，業務記錄 Payment #1（30,000）關聯 PaymentPlan #1
4. 業務開立 Invoice #1（30,000，B2B，帶入客戶統編，送藍新 MerchantID = 3502275）
5. Mockup 回傳 InvoiceTransNo = 25050617583641325、InvoiceNumber = AB10000001
6. PaymentInvoice 記錄：[Payment #1 → Invoice #1, 30,000]
7. 客戶轉尾款，業務記錄 Payment #2（70,000）關聯 PaymentPlan #2
8. 業務合併開 Invoice #2（70,000，送藍新 MerchantID = 3502275）
9. Mockup 回傳 InvoiceNumber = AB10000002
10. PaymentInvoice 記錄：[Payment #2 → Invoice #2, 70,000]

**對帳驗證**：
- 應收總額 = 100,000
- 發票淨額 = 100,000（Invoice #1 + Invoice #2）
- 收款淨額 = 100,000（Payment #1 + Payment #2）
- 差額 = 0，對帳通過

**同步驗證**：
- 訂單 #O-25050602 的 ezpay_merchant_order_no 也是 `O-25050602-INV-01`，但因 billing_company_id 不同（B）所以複合唯一鍵 (B, `O-25050602-INV-01`) 與 A 公司的 (A, `O-25050601-INV-01`) 互不衝突

#### Scenario: 端到端多期付款合併發票

- **WHEN** 完整執行上述 10 步驟
- **THEN** 系統 SHALL 寫入 1 個 BillingCompany、2 個 PaymentPlan、2 個 Payment、2 個 Invoice、2 個 PaymentInvoice
- **AND** 訂單詳情頁對帳檢視面板 SHALL 顯示差額 = 0

#### Scenario: 兩家帳務公司複合唯一鍵不衝突

- **GIVEN** 帳務公司 A 已有 Invoice ezpay_merchant_order_no = `O-25050601-INV-01`
- **WHEN** 帳務公司 B 開立發票，ezpay_merchant_order_no = `O-25050602-INV-01`
- **THEN** 系統 SHALL 接受（複合唯一鍵不衝突）
- **AND** 兩張發票送藍新時帶不同 MerchantID_

### Requirement: 訂單異動加印追加 + 折讓退款情境

系統 SHALL 通過此端到端情境驗證「OrderAdjustment 加印 + 後續折讓退款」的完整資料流。Prototype MUST 跑通下列 17 步驟並三方對帳通過。折讓 / 退款流程 MUST 依 D12 「先退款 Payment、後開折讓並手動關聯」的順序執行（系統 SHALL NOT 自動建立 Payment）。

**情境設定**：
- 訂單 #O-25050601，原應收 100,000，已開 Invoice #1 = 100,000，已收款 100,000

**端到端步驟（加印追加）**：
1. 客戶要求加印 200 份
2. 業務建立 OrderAdjustment #1：adjustment_type = 加印追加、amount = +20,000、reason = 客戶加印 200 份
3. OrderAdjustment.status = 草稿 → 業務提交審核 → 待主管審核
4. 業務主管核可 → 已核可
5. 業務點擊執行 → 已執行
6. 訂單應收總額更新為 120,000
7. 業務手動新增 PaymentPlan #3 = 20,000
8. 客戶付款 20,000，業務記錄 Payment #3
9. 業務開立 Invoice #2 = 20,000，PaymentInvoice 關聯 Payment #3 → Invoice #2

**接續情境（部分退印 + 折讓退款，依 D12 先退款再折讓順序）**：
10. 客戶投訴部分品質瑕疵，要求退款 10,000
11. 業務建立 OrderAdjustment #2：adjustment_type = 退印、amount = -10,000、reason = 品質投訴
12. OrderAdjustment.status → 草稿 → 待主管審核 → 已核可 → 已執行
13. 訂單應收總額更新為 110,000
14. 業務先建立退款 Payment #4：amount = -10,000、payment_method = 退款
15. 業務於 Invoice #1 開立 SalesAllowance #1：allowance_amount = -10,000、reason = 品質瑕疵
16. SalesAllowance.status = 已確認（Mockup 兩段式），業務手動關聯 SalesAllowance.refund_payment_id = Payment #4
17. 系統 SHALL NOT 自動建立任何 Payment（折讓 / 退款分離原則）

**對帳驗證**：
- 應收總額 = 100,000 + 20,000 - 10,000 = 110,000
- 發票淨額 = 100,000（Invoice #1）+ 20,000（Invoice #2）- 10,000（SalesAllowance #1）= 110,000
- 收款淨額 = 100,000 + 20,000 - 10,000（退款）= 110,000
- 差額 = 0，對帳通過

#### Scenario: 端到端加印 + 退印折讓對帳通過

- **WHEN** 完整執行上述 16 步驟
- **THEN** 訂單詳情頁對帳檢視面板 SHALL 顯示應收 = 發票淨額 = 收款淨額 = 110,000，差額 = 0

#### Scenario: OrderAdjustment 已執行但 PaymentPlan 未調整時的差額提示

- **GIVEN** OrderAdjustment #1 已執行（+20,000），訂單應收總額 = 120,000
- **AND** PaymentPlan 尚未新增第三期（合計仍為 100,000）
- **WHEN** 業務查看訂單詳情頁
- **THEN** 系統 SHALL 顯示警告 banner「應收總額 120,000 與 PaymentPlan 合計 100,000 差 20,000，請手動調整 PaymentPlan」

#### Scenario: 主訂單已生產中時 OrderAdjustment 仍可獨立執行

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 業務建立 OrderAdjustment 並完成審核 / 執行
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 訂單狀態 SHALL 維持「生產中」（不被影響）

### Requirement: 作廢發票後重新開立情境（改買受人）

系統 SHALL 通過此端到端情境驗證「客戶要求改統編 / 改公司名」走作廢重開的標準路徑。Prototype MUST 跑通下列 7 步驟，且作廢的字軌號碼 SHALL NOT 重用。

**情境設定**：
- 訂單 #O-25050601 = 100,000
- 業務開立 Invoice #1 時誤填客戶統編

**端到端步驟**：
1. Invoice #1：buyer_ubn = "12345678"（誤填）、ezpay_merchant_order_no = `O-25050601-INV-01`、invoice_number = AB10000001
2. 客戶通知統編應為 "87654321"
3. 業務於 Invoice #1 詳情頁點擊「作廢」、填入 invalid_reason = "統編錯誤"
4. Invoice #1.status → 作廢
5. 業務點擊「開立新發票」，帶入 buyer_ubn = "87654321"
6. Invoice #2：ezpay_merchant_order_no = `O-25050601-INV-02`（流水 +1）、invoice_number = AB10000002
7. 系統不重用 Invoice #1 的字軌號碼

**對帳驗證**：
- 發票淨額 = 100,000（僅 Invoice #2）
- Invoice #1（作廢）不參與計算

#### Scenario: 作廢後重新開立流水號 +1 不重用

- **GIVEN** Invoice #1 ezpay_merchant_order_no = `O-25050601-INV-01` 已作廢
- **WHEN** 業務開立 Invoice #2
- **THEN** Invoice #2.ezpay_merchant_order_no SHALL = `O-25050601-INV-02`
- **AND** 系統 SHALL NOT 重用 `O-25050601-INV-01`

#### Scenario: 作廢的發票不參與三方對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 Invoice #1（作廢），只加總 Invoice #2 = 100,000

### Requirement: 已完成訂單建立 OrderAdjustment 售後服務情境

系統 SHALL 通過此端到端情境驗證「主訂單已完成後仍可建立 OrderAdjustment 處理售後服務」的設計（依 D13）。Prototype MUST 跑通下列步驟，且訂單主狀態 SHALL 維持「已完成」不回退，對帳檢視面板 SHALL 顯示「歷史對帳需重新核對」警示 banner。

**情境設定**：
- 訂單 #O-25030101 = 50,000，已於 2026-03-15 完成（狀態 = 已完成）
- 已開 Invoice #1 = 50,000，客戶已付款 50,000
- 三方對帳當時通過

**端到端步驟**：
1. 2026-05-06 客戶投訴部分品質瑕疵，要求退款 5,000
2. 業務建立 OrderAdjustment #1（adjustment_type = 退印、amount = -5,000、reason = 客戶事後品質投訴）
3. OrderAdjustment.status → 草稿 → 待主管審核 → 已核可 → 已執行
4. 訂單應收總額更新為 45,000（50,000 - 5,000）
5. 業務先建立退款 Payment（amount = -5,000、payment_method = 退款）
6. 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -5,000、reason = 品質瑕疵）
7. 業務手動關聯 SalesAllowance.refund_payment_id = 步驟 5 的退款 Payment
8. 訂單詳情頁對帳檢視面板顯示警示 banner「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行」

**對帳驗證**：
- 應收總額 = 50,000 - 5,000 = 45,000
- 發票淨額 = 50,000（Invoice #1）- 5,000（SalesAllowance）= 45,000
- 收款淨額 = 50,000（原收款）- 5,000（退款 Payment）= 45,000
- 差額 = 0，對帳通過（雖然主訂單已完成）

#### Scenario: 已完成訂單售後異動主狀態不回退

- **GIVEN** 訂單主狀態 = 已完成
- **WHEN** 業務建立並執行 OrderAdjustment（amount = -5,000）
- **THEN** 訂單主狀態 SHALL 維持「已完成」（不觸發回退）
- **AND** OrderAdjustment.status SHALL → 已執行

#### Scenario: 售後異動觸發歷史對帳警示

- **GIVEN** 已完成訂單上有已執行的 OrderAdjustment
- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** 面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行」
- **AND** 面板 SHALL 仍正常計算三方金額

#### Scenario: 售後折讓 / 退款依 D12 分離

- **WHEN** 已完成訂單售後折讓退款
- **THEN** 業務 SHALL 先建立退款 Payment、後開立 SalesAllowance、手動關聯 refund_payment_id
- **AND** 系統 SHALL NOT 自動建立 Payment
