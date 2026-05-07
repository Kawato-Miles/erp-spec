# business-processes — Delta Spec

## ADDED Requirements

### Requirement: 付款計畫建立與變更流程

訂單成立後（狀態進入「報價待回簽」或「訂單確認」），業務 / 諮詢 SHALL 建立 PaymentPlan，定義 N 期付款的金額與時程。建立 / 變更 PaymentPlan 的流程規則：

**建立流程**：
1. 業務於訂單詳情頁點擊「建立付款計畫」
2. 業務新增 N 期，每期填入 description、scheduled_amount、可選 scheduled_date
3. 系統驗證合計 = 訂單應收總額（= Order.total_with_tax + ∑ 已執行 OrderAdjustment.amount）
4. 業務送出後系統寫入 PaymentPlan 紀錄

**變更流程**（已建立後）：
1. 業務修改 / 新增 / 刪除 PaymentPlan 期次
2. 系統驗證合計 = 訂單應收總額
3. 系統將訂單狀態回退至「業務主管審核」（沿用 [add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 機制）
4. 業務主管核可後，訂單恢復至原狀態

**例外情境**：訂單已進入生產段（製作等待中、生產中、出貨中）時，PaymentPlan 變更僅作記錄，不觸發回審（避免影響生產推進）。

#### Scenario: 訂單確認階段業務建立兩期付款計畫

- **GIVEN** 訂單狀態 = 訂單確認，業務主管已核可
- **WHEN** 業務於訂單詳情頁建立 PaymentPlan #1（30,000）+ PaymentPlan #2（70,000），訂單應收總額 = 100,000
- **THEN** 系統 SHALL 寫入兩筆 PaymentPlan 紀錄並驗證合計 = 100,000
- **AND** 訂單狀態 SHALL 維持「訂單確認」（建立時不觸發回審）

#### Scenario: 業務修改尾款日期觸發回審

- **GIVEN** 訂單狀態 = 訂單確認，PaymentPlan 已建立
- **WHEN** 業務修改 PaymentPlan #2.scheduled_date
- **THEN** 訂單狀態 SHALL → 業務主管審核
- **AND** 業務主管核可後 SHALL 恢復至「訂單確認」

#### Scenario: 訂單進入生產段後付款計畫變更不觸發回審

- **GIVEN** 訂單狀態 = 生產中
- **WHEN** 業務修改 PaymentPlan #2.scheduled_amount
- **THEN** 系統 SHALL 寫入變更但訂單狀態維持「生產中」
- **AND** Activity log MUST 記載「付款計畫變更（生產段不回審）」

### Requirement: 訂單異動執行流程

訂單成立後，業務 / 諮詢 SHALL 可建立 OrderAdjustment 處理應收金額異動（規格變更 / 加印追加 / 退印 / 折扣 / 其他）。OrderAdjustment MUST 走獨立狀態機，**不影響主訂單狀態**。已執行時系統 SHALL 自動重算訂單應收總額，但 PaymentPlan SHALL NOT 自動變動。流程規則：

**建立與審核流程**：
1. 業務於訂單詳情頁點擊「建立訂單異動」，填入 adjustment_type、amount、reason
2. OrderAdjustment.status = 草稿；業務點擊「提交審核」後 → 待主管審核
3. 業務主管核可（→ 已核可）或退回（→ 已退回，業務修改後重交）
4. 業務於已核可後點擊「執行」→ 已執行（終態）
5. 系統重算訂單應收總額；PaymentPlan 不自動變動

**後續關聯動作**（業務手動）：
- 加印追加（amount > 0）：業務後續視情境開立發票（增開的 Invoice）
- 退印 / 折扣（amount < 0）：若已開過發票，業務開立 SalesAllowance（折讓）+ 退款 Payment
- 業務手動調整 PaymentPlan（如新增一期 / 修改未付期金額）

#### Scenario: 加印追加完整流程

- **WHEN** 客戶要求加印 200 份，業務建立 OrderAdjustment（adjustment_type = 加印追加，amount = +20,000，reason = 客戶加印）
- **THEN** OrderAdjustment.status SHALL → 草稿 → 待主管審核 → 已核可 → 已執行
- **AND** 業務後續手動：(a) 新增 PaymentPlan #3（20,000）；(b) 收到加印款後記錄 Payment；(c) 開立 Invoice #2（20,000）

#### Scenario: 退印完整流程（已開發票）

- **GIVEN** Invoice #1 = 100,000 已開立
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務建立 OrderAdjustment（adjustment_type = 退印，amount = -10,000，reason = 品質瑕疵）並執行
- **THEN** OrderAdjustment.status SHALL → 已執行，訂單應收總額 = 90,000
- **AND** 業務後續手動：(a) 開立 SalesAllowance #1（-10,000，關聯 Invoice #1）；(b) 系統自動建立關聯退款 Payment（-10,000）

#### Scenario: 訂單異動不阻擋主流程

- **GIVEN** 訂單狀態 = 生產中，OrderAdjustment.status = 待主管審核
- **WHEN** 工單交付完成觸發 bubble-up
- **THEN** 訂單狀態 SHALL 推進至「出貨中」
- **AND** OrderAdjustment 維持「待主管審核」獨立狀態

### Requirement: 發票異動流程（作廢、折讓、改買受人）

業務 / 諮詢 SHALL 處理發票異動的三種情境，依情境選擇對應流程：

**情境 A：發票錯誤可作廢**（同期未交付未申報，藍新 Mockup 階段不檢查申報期）
- 業務於 Invoice 詳情頁點擊「作廢」，填入 invalid_reason
- Invoice.status → 作廢
- 字軌號碼不重用，新發票流水 +1

**情境 B：客戶要求改買受人（如統編打錯）**
- 業務作廢原 Invoice（情境 A 流程）
- 業務開立新 Invoice（帶入正確買受人）
- 不額外設計「換開」捷徑

**情境 C：已開發票後客戶要求金額調整（先退款，再決定折讓 / 作廢）**

實務步驟（業務 / 諮詢 SHALL 依此順序）：
1. 業務於訂單詳情頁建立退款 Payment（amount 為負數、payment_method = 「退款」、可選關聯 PaymentPlan）
2. 視情境決定後續：
   - **路徑 a（保留發票走折讓）**：適合已交付買方、跨期或不適合作廢的情境。業務於 Invoice 詳情頁點擊「開立折讓」，填入 allowance_amount（負數）、reason。系統 Mockup 兩段式：開立折讓 + 觸發確認折讓 → SalesAllowance.status = 已確認。業務手動關聯 SalesAllowance.refund_payment_id 至步驟 1 的退款 Payment。
   - **路徑 b（作廢重開）**：適合發票錯誤可作廢的情境（如金額誤填）。業務作廢原 Invoice、開立新 Invoice。退款 Payment 不需關聯 SalesAllowance（直接作為訂單級退款記錄）。
3. 已確認折讓可作廢（→ 已作廢，發票回到折讓前狀態，refund_payment_id 自動取消關聯）

**約束**：
- 折讓金額 |allowance_amount| MUST ≤ 該發票尚未折讓的剩餘金額
- 折讓 + 退款不需主管核可（業務 / 諮詢可單獨執行）
- 作廢不需主管核可（業務 / 諮詢可單獨執行）
- 系統 SHALL NOT 在折讓建立時自動建立 Payment（D12 折讓 / 退款分離原則）

#### Scenario: 客戶要求改公司名（情境 B）

- **GIVEN** Invoice #1 buyer_name = "錯誤公司名"，已開立
- **WHEN** 業務作廢 Invoice #1（reason = 公司名錯誤）
- **AND** 業務開立 Invoice #2（buyer_name = "正確公司名"）
- **THEN** Invoice #1.status SHALL = 作廢
- **AND** Invoice #2 SHALL 為新紀錄，ezpay_merchant_order_no 流水 +1

#### Scenario: 折讓 + 退款流程（情境 C 路徑 a）

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先建立退款 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance #1（allowance_amount = -10,000、reason = 品質投訴）
- **AND** 業務手動關聯 SalesAllowance.refund_payment_id = 步驟 1 的退款 Payment
- **THEN** SalesAllowance.status SHALL → 已確認
- **AND** Invoice #1 剩餘可折讓金額 SHALL = 90,000
- **AND** 系統 SHALL NOT 自動建立任何 Payment（折讓 / 退款分離原則）

#### Scenario: 折讓金額超過剩餘可折讓金額被擋

- **GIVEN** Invoice = 100,000 已有 SalesAllowance #1 = -50,000（已確認）
- **WHEN** 業務嘗試開立 SalesAllowance #2 = -60,000
- **THEN** 系統 SHALL 拒絕並提示「折讓金額不可超過發票剩餘 50,000」

### Requirement: 三方對帳計算規則

訂單詳情頁的對帳檢視面板與會計批次對帳檢視 SHALL 依下列規則計算三個總額：

```
應收總額 = Order.total_with_tax + ∑ OrderAdjustment.amount
          where OrderAdjustment.status = 已執行

發票淨額 = ∑ Invoice.total_amount where Invoice.status = 開立
        - ∑ |SalesAllowance.allowance_amount| where SalesAllowance.status = 已確認

收款淨額 = ∑ Payment.amount
          含正數（一般收款）與負數（退款）

差額 = 應收總額 - 發票淨額（衡量「未開發票」的金額）
差額 = 應收總額 - 收款淨額（衡量「未收款」的金額）
```

對帳通過條件：應收總額 = 發票淨額 = 收款淨額（三者一致，差額 = 0）。

**作廢的 Invoice / SalesAllowance 不參與計算**：避免雙重扣減。

#### Scenario: 對帳通過

- **GIVEN** Order.total_with_tax = 100,000、OrderAdjustment 無、開立 Invoice 合計 100,000、SalesAllowance 無、Payment 合計 100,000
- **WHEN** 系統計算三方對帳
- **THEN** 應收 = 發票淨額 = 收款淨額 = 100,000，差額 = 0

#### Scenario: 含異動 + 折讓 + 退款的對帳

- **GIVEN** Order.total_with_tax = 100,000、OrderAdjustment +20,000（已執行）、開立 Invoice 合計 130,000、已確認 SalesAllowance -10,000、Payment 合計 130,000、退款 Payment -10,000
- **WHEN** 系統計算三方對帳
- **THEN** 應收 = 120,000、發票淨額 = 120,000、收款淨額 = 120,000、差額 = 0

#### Scenario: 作廢發票不參與計算

- **GIVEN** 開立 Invoice #1 = 100,000、Invoice #2 = 100,000，其中 Invoice #1 已作廢
- **WHEN** 系統計算發票淨額
- **THEN** 發票淨額 SHALL = 100,000（僅計算 Invoice #2）

### Requirement: 報價單印件填寫原則 — 帳務公司延伸

需求單 / 報價單建立時 SHALL 同時指定接單公司（account_company）與帳務公司（billing_company_id）。兩者為**獨立欄位**，業務分別填寫；UI 軟性提示「該接單公司近期常用帳務公司」（不強制）。需求單成交轉訂單時，billing_company_id 隨之帶入訂單。

#### Scenario: 業務於需求單填寫接單公司與帳務公司

- **WHEN** 業務於需求單編輯頁分別選 account_company（如 SSP 感官）與 billing_company（如 帳務公司 A）
- **THEN** 系統 SHALL 寫入兩個獨立欄位
- **AND** UI SHALL 在 billing_company 選項顯示「該接單公司近 30 天最常用：[X]」軟性提示
