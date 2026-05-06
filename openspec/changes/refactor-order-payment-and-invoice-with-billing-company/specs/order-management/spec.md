# order-management — Delta Spec

## ADDED Requirements

### Requirement: 帳務公司管理（BillingCompany）

系統 SHALL 維護 BillingCompany 主檔，每個 BillingCompany 對應一個藍新（NewebPay / ezPay）商店帳號（ezpay_merchant_id）。系統管理員可新增、停用 BillingCompany；業務 / 諮詢 / 會計僅可讀取，於需求單 / 訂單建立時選用。BillingCompany.ezpay_merchant_id MUST 唯一，避免兩家公司共用同一商店代號（會違反藍新 MerchantOrderNo 不可重覆規則）。同時間 SHALL 僅允許一筆 is_default = true。

#### Scenario: 系統管理員建立帳務公司

- **WHEN** 系統管理員於後台新增 BillingCompany
- **THEN** 系統 SHALL 寫入 BillingCompany 主檔，要求填入 name、tax_id、ezpay_merchant_id、address、phone
- **AND** 系統 MUST 驗證 ezpay_merchant_id 唯一性

#### Scenario: 業務於需求單下拉選擇帳務公司

- **WHEN** 業務於需求單編輯頁開啟帳務公司下拉
- **THEN** 系統 SHALL 僅顯示 is_active = true 的 BillingCompany
- **AND** 預設值 SHALL 為 is_default = true 的那筆

### Requirement: 付款計畫建立（PaymentPlan）

業務 / 諮詢 SHALL 於訂單成立後（狀態 = 報價待回簽 或 訂單確認）建立付款計畫，定義一個訂單分成 N 期收款的金額與時程。每筆 PaymentPlan 紀錄期別、描述、預定金額、預計收款日。建立時各期金額合計 MUST = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)；若不等系統 SHALL 顯示差額提示。

#### Scenario: 業務建立兩期付款計畫

- **WHEN** 業務於訂單詳情頁點擊「建立付款計畫」，新增「訂金 30%」「尾款 70%」兩期
- **THEN** 系統 SHALL 建立兩筆 PaymentPlan 紀錄（installment_no = 1, 2）
- **AND** 系統 MUST 驗證兩期合計 = 訂單應收總額

#### Scenario: 付款計畫合計與應收總額不符的提示

- **WHEN** 業務輸入的各期合計 ≠ 訂單應收總額
- **THEN** 系統 SHALL 顯示警告「合計金額與應收總額差 X 元」
- **AND** 系統 SHALL 拒絕儲存，要求業務調整

### Requirement: 付款計畫變更觸發訂單回業務主管審核

業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到「業務主管審核」狀態（沿用 [add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 機制）。業務主管未核可前訂單不得進入後續狀態。

#### Scenario: 業務修改尾款日期觸發回審

- **GIVEN** 訂單付款計畫已建立且訂單已過業務主管審核
- **WHEN** 業務修改 PaymentPlan #2 的 scheduled_date
- **THEN** 系統 SHALL 將訂單狀態回退至「業務主管審核」
- **AND** 系統 MUST 在活動紀錄記載「付款計畫變更，回業務主管審核」

#### Scenario: 業務主管核可付款計畫變更

- **GIVEN** 訂單因付款計畫變更回到「業務主管審核」狀態
- **WHEN** 業務主管於訂單詳情頁核可
- **THEN** 訂單 SHALL 推進至原付款計畫變更前的後續狀態

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

#### Scenario: 業務記錄訂金收款

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 建立 Payment 紀錄，可選關聯 PaymentPlan 期次
- **AND** 業務 MUST 填入金額、付款方式、收款時間，可選填第三方付款序號

#### Scenario: PaymentPlan 期次狀態自動更新

- **WHEN** 某 PaymentPlan 的累計 Payment 金額 = scheduled_amount
- **THEN** 系統 SHALL 自動更新 PaymentPlan.status = 已收訖

#### Scenario: 部分收款狀態

- **GIVEN** 某 PaymentPlan scheduled_amount = 30,000
- **WHEN** 業務記錄一筆 Payment 金額 = 10,000 關聯該期
- **THEN** 系統 SHALL 更新 PaymentPlan.status = 部分收款

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與 PaymentPlan / Payment 解耦：可先開後收、後收先開、合併（多筆 Payment 對一張 Invoice）、拆分（一筆 Payment 對多張 Invoice）。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立

#### Scenario: 業務拆分一筆收款開兩張發票

- **GIVEN** 訂單有一筆 Payment 100,000
- **WHEN** 業務開立兩張 Invoice 各 50,000，於 PaymentInvoice junction 各關聯該 Payment 50,000
- **THEN** 系統 SHALL 允許並驗證 ∑(PaymentInvoice.amount where payment_id = X) ≤ Payment.amount

#### Scenario: 業務合併多筆收款開一張發票

- **GIVEN** 訂單有 Payment #1 = 30,000、Payment #2 = 70,000
- **WHEN** 業務開立 Invoice = 100,000，於 PaymentInvoice junction 各關聯一筆
- **THEN** 系統 SHALL 允許並寫入兩筆 PaymentInvoice 紀錄

#### Scenario: 業務先開發票後收款

- **WHEN** 業務於 Payment 為空時開立 Invoice
- **THEN** 系統 SHALL 允許，PaymentInvoice 暫無記錄
- **AND** 後續 Payment 建立時，業務 SHALL 可手動關聯到該 Invoice

### Requirement: 發票作廢

業務 / 諮詢 SHALL 可於訂單詳情頁作廢已開立的發票，不需業務主管 / 會計核可。作廢時必填作廢原因（限中文 6 字或英文 20 字，對應藍新 InvalidReason 限制）。發票字軌號碼作廢後不可重用，重新開新發票時 ezpay_merchant_order_no 流水號 +1。系統 SHALL 在活動紀錄記載作廢動作（誰、何時、原因）。

#### Scenario: 業務作廢統編打錯的發票

- **GIVEN** 業務開立 Invoice 時誤填客戶統編
- **WHEN** 業務於發票清單點擊「作廢」並填入原因「統編錯誤」
- **THEN** 系統 SHALL 更新 Invoice.status = 作廢、invalid_reason、invalid_at、invalid_by
- **AND** 系統 MUST 在訂單活動紀錄記載作廢

#### Scenario: 業務作廢後重新開立新發票

- **GIVEN** Invoice #1 已作廢（ezpay_merchant_order_no = O-25050601-INV-01）
- **WHEN** 業務開立新 Invoice
- **THEN** 系統 SHALL 產生新 ezpay_merchant_order_no = O-25050601-INV-02（流水 +1，不重用）

### Requirement: Invoice 折讓衍生標籤（derived，不入狀態機）

Invoice 自身狀態機只有「開立 / 作廢」兩態，**折讓資訊不入發票狀態機**，改以 derived 衍生標籤呈現於 UI。系統 SHALL 即時計算每張發票的折讓衍生屬性，於發票清單與發票詳情頁顯示。

**衍生欄位算法**：

```
folded = ∑ SalesAllowance.|allowance_amount|
         where invoice_id = X AND status = 已確認

remaining = invoice.total_amount - folded

折讓衍生標籤：
  if invoice.status = 作廢                     → 顯示「－」（不適用）
  elif folded = 0                              → 顯示「無折讓」
  elif 0 < folded < total_amount               → 顯示「已部分折讓 -{folded}」
  elif folded = total_amount                   → 顯示「已完全折讓」
```

**為什麼不入狀態機**：
- 折讓金額是 ∑ SalesAllowance 累計算出，重複進 Invoice.status 會造成同步問題（SalesAllowance 變動要回頭改 Invoice）
- 一張發票可被多次折讓 / 作廢折讓，狀態回退邏輯複雜
- 業界（SAP / NetSuite / Oracle）做法一致：發票狀態只記 issued / void，credited 是 derived

#### Scenario: 發票清單顯示折讓衍生標籤

- **WHEN** 業務 / 會計於訂單詳情頁查看發票清單
- **THEN** 每張發票 SHALL 顯示三欄：對帳編號 / 發票號碼 / 金額 / 狀態 badge / 折讓衍生標籤
- **AND** 折讓衍生標籤 SHALL 依即時計算結果呈現「無折讓 / 已部分折讓 -X,XXX / 已完全折讓 / －（作廢）」

#### Scenario: 發票詳情頁顯示折讓累計

- **WHEN** 業務 / 會計開啟發票詳情頁
- **THEN** 系統 SHALL 顯示：發票金額（total_amount）、折讓累計（folded，已確認折讓合計）、剩餘可折讓金額（remaining）、折讓記錄清單
- **AND** 折讓累計 SHALL 排除 status = 已作廢 的 SalesAllowance

#### Scenario: 折讓變動後衍生標籤即時更新

- **GIVEN** Invoice = 100,000，已有 SalesAllowance #1 = -10,000（已確認）
- **WHEN** 業務作廢 SalesAllowance #1（status → 已作廢）
- **THEN** 折讓衍生標籤 SHALL 從「已部分折讓 -10,000」變回「無折讓」
- **AND** 剩餘可折讓金額 SHALL 從 90,000 回到 100,000

### Requirement: 折讓單（SalesAllowance）建立、確認、作廢

業務 / 諮詢 SHALL 可於已開立發票的詳情頁建立折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條），用於發票已開後不能整張作廢時，附加在原發票上的部分減額憑證。折讓單建立不需業務主管核可。折讓金額 MUST 為負數且絕對值 MUST ≤ 該發票尚未折讓的剩餘金額（即原發票金額 - 已確認折讓累計）。折讓建立時系統 SHALL 呼叫藍新（Mockup）兩段式流程：開立折讓 → 觸發確認折讓，狀態直接寫入「已確認」。已確認折讓可作廢（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立），作廢後該筆 SalesAllowance.status = 已作廢，發票剩餘可折讓金額回到作廢前狀態。一張發票 SHALL 可建立多筆折讓單，直到累計金額 = 原發票金額（已完全折讓）。

#### Scenario: 業務開立折讓單

- **WHEN** 業務於 Invoice = 100,000 詳情頁點擊「開立折讓」，填入金額 -10,000、原因「品質投訴」
- **THEN** 系統 SHALL 建立 SalesAllowance 紀錄、Mockup 產生 ezpay_allowance_no（A + 14 碼數字）
- **AND** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API，status 直接寫入「已確認」（不停留於草稿）
- **AND** Mockup 回傳 RemainAmt = 90,000（折讓後發票剩餘）

#### Scenario: 折讓金額超過剩餘可折讓金額被擋

- **GIVEN** Invoice = 100,000 已有 SalesAllowance #1 = -50,000（已確認）
- **WHEN** 業務嘗試開立 SalesAllowance #2 = -60,000
- **THEN** 系統 SHALL 拒絕並提示「折讓金額不可超過發票剩餘 50,000」

#### Scenario: 折讓限負數防呆

- **WHEN** 業務於折讓金額欄位輸入正數或零
- **THEN** 系統 SHALL 拒絕並提示「折讓金額必須為負數」

#### Scenario: 業務作廢已確認的折讓

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務點擊「作廢折讓」並填入原因
- **THEN** 系統 SHALL 更新 SalesAllowance.status = 已作廢，發票回到折讓前狀態
- **AND** Mockup 呼叫 allowanceInvalid API

### Requirement: 退款 Payment 與折讓分離（先記退款，再開折讓）

退款 Payment 與 SalesAllowance 為**分離設計**，符合業界會計分離原則（Credit Memo 與 Refund 分軸）。實務流程：(1) 業務 / 諮詢先在訂單詳情頁建立退款 Payment（payment_method = 「退款」、amount 為負數）；(2) 視情境決定後續：(a) 已開立發票且需保留發票 → 開立 SalesAllowance 並手動關聯 refund_payment_id；(b) 發票錯誤可作廢 → 作廢原發票重開（refund_payment_id 不需關聯到 SalesAllowance）。系統 SHALL NOT 在折讓建立時自動建立 Payment。

#### Scenario: 業務先建退款 Payment 再開折讓

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先於訂單詳情頁建立 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -10,000、reason = 品質瑕疵）
- **THEN** SalesAllowance.refund_payment_id SHALL 由業務手動關聯該退款 Payment
- **AND** Activity log MUST 分別記載 Payment 建立與 SalesAllowance 開立
- **AND** 系統 SHALL NOT 自動建立任何 Payment

#### Scenario: 業務先建退款後決定走作廢重開

- **GIVEN** Invoice #1 = 100,000 已開立但金額誤填
- **WHEN** 業務先建立 Payment（amount = -100,000、payment_method = 退款）
- **AND** 業務作廢 Invoice #1，重新開立 Invoice #2（金額正確）
- **THEN** 系統 SHALL 接受兩個獨立動作（退款 Payment、作廢 Invoice）
- **AND** SalesAllowance 不需建立

#### Scenario: 對帳檢視面板分桶顯示收款與退款

- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** Payment 區段 SHALL 分兩桶顯示：
- **AND** 一般收款（payment_method ≠ 退款）：累計正項
- **AND** 退款（payment_method = 退款）：累計負項
- **AND** 收款淨額 SHALL = 一般收款 - |退款|

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

#### Scenario: 業務建立加印追加異動

- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁建立 OrderAdjustment
- **THEN** 系統 SHALL 要求業務填入 adjustment_type（加印追加）、amount（如 +20,000）、reason
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務主管核可訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at

#### Scenario: 業務主管退回訂單異動

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務執行已核可的訂單異動

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行（終態）
- **AND** 訂單應收總額 MUST 更新（Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動

#### Scenario: 訂單異動不阻擋主訂單推進

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額：應收總額（= Order.total_with_tax + ∑ 已執行 OrderAdjustment.amount）、發票淨額（= ∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|）、收款淨額（= ∑ Payment.amount，含退款負數）。差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

#### Scenario: 完整支付且對帳通過顯示差額 0

- **GIVEN** 訂單應收 100,000、開立兩張發票合計 100,000、收款合計 100,000
- **WHEN** 業務 / 會計開啟訂單詳情頁的對帳檢視面板
- **THEN** 系統 SHALL 顯示應收 100,000、發票淨額 100,000、收款淨額 100,000、差額 0
- **AND** 面板 SHALL 標記「對帳通過」

#### Scenario: 訂單異動 + 折讓退款的三方對帳

- **GIVEN** 訂單原應收 100,000、訂單異動 +20,000、開立發票合計 130,000、確認折讓 -10,000、收款合計 130,000、退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 系統 SHALL 顯示應收 120,000、發票淨額 120,000、收款淨額 120,000、差額 0

#### Scenario: 應收與發票不符顯示差額

- **GIVEN** 訂單應收 100,000、開立發票合計 80,000、收款合計 80,000
- **WHEN** 開啟對帳檢視面板
- **THEN** 差額 SHALL 顯示 20,000（未開發票）
- **AND** 面板 SHALL 標記「待對帳」

### Requirement: 會計批次對帳檢視

會計 SHALL 可於後台「對帳檢視」頁批次查詢訂單，依 BillingCompany、開立期間、狀態（對帳通過 / 待對帳）篩選，並匯出對帳清單（含 ERP 訂單編號、藍新 InvoiceTransNo、InvoiceNumber、AllowanceNo、三方金額、差額）供藍新後台對帳使用。

#### Scenario: 會計依帳務公司與期間批次查詢

- **WHEN** 會計於「對帳檢視」頁選擇 BillingCompany = 森紙公司、期間 = 2026-04
- **THEN** 系統 SHALL 列出該期間該帳務公司所有訂單對帳狀態
- **AND** 業務 / 會計 SHALL 可勾選「僅顯示差額 ≠ 0」篩選待對帳訂單

#### Scenario: 會計匯出對帳清單

- **WHEN** 會計於對帳清單點擊「匯出」
- **THEN** 系統 SHALL 匯出 CSV 含 ERP 訂單編號、藍新 ezpay_merchant_order_no、InvoiceTransNo、InvoiceNumber、ezpay_allowance_no、應收 / 發票 / 收款 / 差額

### Requirement: 業務一鍵開發票（user story）

業務 / 諮詢 SHALL 可於訂單詳情頁付款區塊點擊「一鍵開發票」，系統自動帶入買受人資訊（從客戶資料）、訂單金額、商品明細（從訂單印件）。業務確認 / 微調後送出。此為效率優化，不取代手動建立發票流程。

#### Scenario: 業務於訂單詳情頁一鍵開發票

- **WHEN** 業務於訂單詳情頁的「發票」區塊點擊「一鍵開發票」
- **THEN** 系統 SHALL 開啟發票表單，自動帶入買受人（B2B 從客戶 tax_id；B2C 從客戶 name）、發票金額（= 訂單應收總額 - 已開發票淨額）、商品明細（從訂單印件）
- **AND** 業務 SHALL 可微調後送出，呼叫藍新 Mockup

### Requirement: 應收帳款帳齡底層欄位與訂單列表帳齡篩選

系統 SHALL 計算 PaymentPlan 的 derived field `overdue_days`（status ≠ 已收訖 時 = TODAY - scheduled_date；scheduled_date 為空時 = NULL），作為應收帳款帳齡（AR aging）底層基礎。訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 PaymentPlan 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）、逾期自動通知、應收帳款 Dashboard 不在本次範疇。

#### Scenario: PaymentPlan 逾期天數自動計算

- **GIVEN** PaymentPlan #1 status = 未收、scheduled_date = 2026-04-01
- **WHEN** 系統時間為 2026-05-06
- **THEN** PaymentPlan #1.overdue_days SHALL = 35

#### Scenario: 已收訖 PaymentPlan 不算逾期

- **GIVEN** PaymentPlan #1 status = 已收訖、scheduled_date = 2026-04-01
- **WHEN** 系統計算 overdue_days
- **THEN** overdue_days SHALL = NULL（不顯示逾期）

#### Scenario: 訂單列表依最長逾期天數篩選

- **WHEN** 業務 / 主管於訂單列表選擇篩選器「最長逾期天數 ≥ 30 天」
- **THEN** 系統 SHALL 列出所有有 PaymentPlan.overdue_days ≥ 30 的訂單
- **AND** 列表 SHALL 顯示該訂單最長逾期天數欄位

### Requirement: 已完成訂單仍可建立 OrderAdjustment（售後服務）

業務 / 諮詢 SHALL 可於主訂單狀態 = 已完成 的訂單建立 OrderAdjustment（典型情境：售後服務、品質投訴退款、補印追加）。已完成訂單上的 OrderAdjustment 觸發應收總額更新後，訂單詳情頁的對帳檢視面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」，提示會計人工重新對帳。系統 SHALL NOT 引入「對帳鎖定 / 解鎖」狀態機（會計人工確認即可）。

#### Scenario: 已完成訂單建立 OrderAdjustment 並執行

- **GIVEN** 訂單狀態 = 已完成、completion_date = 2026-03-15
- **WHEN** 業務於 2026-05-06 建立 OrderAdjustment（adjustment_type = 退印、amount = -5,000、reason = 客戶事後品質投訴）
- **AND** 完成審核流程後業務執行異動
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 訂單應收總額 SHALL 更新
- **AND** 訂單詳情頁的對帳檢視面板 SHALL 顯示警示 banner「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行」

#### Scenario: 主訂單狀態維持已完成不回退

- **GIVEN** OrderAdjustment 在已完成訂單上執行
- **THEN** 訂單主狀態 SHALL 維持「已完成」
- **AND** 系統 SHALL NOT 觸發任何訂單狀態回退（與 D5 PaymentPlan 變更生產段不回審原則一致）

### Requirement: 業務主管批次審核 OrderAdjustment（user story）

業務主管 SHALL 可於後台「待審核訂單異動」頁批次查看所有 status = 待主管審核 的 OrderAdjustment，依負責業務 / adjustment_type / 訂單編號篩選，逐筆核可 / 退回。

#### Scenario: 業務主管查看待審核異動清單

- **WHEN** 業務主管登入後台進入「待審核訂單異動」頁
- **THEN** 系統 SHALL 列出所有 status = 待主管審核 的 OrderAdjustment
- **AND** 主管 SHALL 可依 adjustment_type 篩選

## REMOVED Requirements

### Requirement: 付款記錄

**Reason**：原 Requirement 文字宣稱支援多次付款但 Data Model 只有平面欄位，文字與資料模型嚴重脫節。重構後由 § 付款計畫建立、§ 收款記錄 兩個 Requirement 取代，搭配 PaymentPlan 與 Payment 兩個獨立實體支援完整多期付款 + 多筆收款。

**Migration**：原平面欄位（payment_status / payment_method / paid_at / payment_detail / 第三方付款序號）的資料：
- 新訂單：使用新 Data Model（PaymentPlan + Payment）
- 舊訂單：保留平面欄位資料供讀取，UI 顯示「（舊資料）」標記，不允許用新流程操作
- 後續若需全面遷移舊資料，另開 `migrate-legacy-order-payment` change

### Requirement: 電子發票

**Reason**：原 Requirement 僅文字描述發票概念，無 Data Model 支援。重構後由 § 發票開立（藍新 Mockup）、§ 發票作廢、§ 折讓單建立、確認、作廢、§ 折讓伴隨退款 Payment 記錄 四個 Requirement 取代，搭配 Invoice、SalesAllowance、PaymentInvoice 三個實體支援完整發票流程含藍新對接、折讓、作廢。

**Migration**：原 Order.invoice_unified_number（買方統編）遷至 Invoice.buyer_ubn；舊訂單 invoice_unified_number 維持不變供讀取。

### Requirement: 補收款管理

**Reason**：「補收款 = 子訂單」是錯誤抽象，業務每次補收款要建子訂單操作冗餘。重構後由 § 訂單異動（OrderAdjustment）建立與審核 取代，OrderAdjustment 為獨立實體，可正可負、分類型、有獨立狀態機，不需新建訂單即可調整應收總額。

**Migration**：parent_order_id / is_supplemental 兩個 Order 欄位 deprecated（保留欄位供讀舊資料）；新訂單不再使用補收款子訂單機制；既有補收款子訂單維持原狀但不可新增。

## ADDED Data Model

### BillingCompany（帳務公司）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 公司名稱 | name | 字串 | Y | | 例：森紙股份有限公司 |
| 統一編號 | tax_id | 字串 | Y | | 賣方統一編號 |
| 藍新商店代號 | ezpay_merchant_id | 字串 | Y | | 唯一鍵；對應藍新 MerchantID_ |
| 公司地址 | address | 字串 | | | |
| 連絡電話 | phone | 字串 | | | |
| 是否預設 | is_default | 布林 | Y | | 同時間僅一筆 true |
| 是否啟用 | is_active | 布林 | Y | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### PaymentPlan（付款計畫期次）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> Order |
| 期別 | installment_no | 整數 | Y | | 1, 2, 3 ... |
| 描述 | description | 字串 | | | 例：訂金 30%、尾款 70% |
| 預定金額 | scheduled_amount | 小數 | Y | | 含稅 |
| 預計收款日 | scheduled_date | 日期 | | | |
| 狀態 | status | 單選 | Y | | 未收 / 部分收款 / 已收訖 |
| 逾期天數 | overdue_days | 整數 | | Y | Derived field：status ≠ 已收訖 時 = TODAY - scheduled_date；scheduled_date 為空則為 NULL；用於應收帳款帳齡底層計算 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### Payment（實際收款紀錄）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> Order |
| 付款計畫期次 | payment_plan_id | FK | | | FK -> PaymentPlan，可空（臨時收款 / 退款） |
| 收款金額 | amount | 小數 | Y | | 可正可負（退款為負） |
| 付款方式 | payment_method | 單選 | Y | | 現金 / 信用卡 / 銀行轉帳 / 支票 / 退款 / 其他 |
| 第三方付款序號 | payment_ref | 字串 | | | 銀行入帳序號 / 信用卡授權碼 |
| 收款時間 | paid_at | 日期時間 | Y | | |
| 紀錄人 | recorded_by | FK | Y | Y | FK -> 使用者 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### Invoice（統一發票）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> Order |
| 帳務公司 | billing_company_id | FK | Y | Y | FK -> BillingCompany；繼承自 Order |
| 藍新自訂編號 | ezpay_merchant_order_no | 字串 | Y | Y | 格式 `{order_no}-INV-{流水}`；複合唯一鍵 (billing_company_id, ezpay_merchant_order_no) |
| 藍新開立序號 | ezpay_invoice_trans_no | 字串 | | Y | Mockup：17 碼時間戳 |
| 發票號碼 | invoice_number | 字串 | | Y | Mockup：兩碼大寫英文 + 8 碼數字（如 AB10000001） |
| 防偽隨機碼 | random_num | 字串 | | Y | 4 碼 |
| 發票種類 | category | 單選 | Y | | B2B / B2C |
| 買受人名稱 | buyer_name | 字串 | Y | | |
| 買受人統編 | buyer_ubn | 字串 | | | B2B 必填 |
| 買受人地址 | buyer_address | 字串 | | | |
| 買受人信箱 | buyer_email | 字串 | | | |
| 載具類別 | carrier_type | 單選 | | | 0=手機條碼 / 1=自然人憑證 / 2=ezPay 載具；B2C 用 |
| 載具編號 | carrier_num | 字串 | | | |
| 索取紙本 | print_flag | 布林 | Y | | |
| 課稅別 | tax_type | 單選 | Y | | 1=應稅 / 2=零稅率 / 3=免稅 |
| 稅率 | tax_rate | 小數 | Y | | |
| 銷售額（未稅） | sales_amount | 小數 | Y | | |
| 稅額 | tax_amount | 小數 | Y | | |
| 發票金額（含稅） | total_amount | 小數 | Y | | sales_amount + tax_amount |
| 商品明細 | items | JSON | Y | | 格式：[{name, count, unit, unit_price, item_amount}] |
| 備註 | comment | 字串 | | | |
| 狀態 | status | 單選 | Y | | 開立 / 作廢 |
| 開立時間 | issued_at | 日期時間 | Y | Y | |
| 作廢原因 | invalid_reason | 字串 | | | 限中文 6 字或英文 20 字 |
| 作廢時間 | invalid_at | 日期時間 | | | |
| 作廢人 | invalid_by | FK | | | FK -> 使用者 |
| 開立人 | issued_by | FK | Y | Y | FK -> 使用者 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### PaymentInvoice（收款 ↔ 發票對應 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬發票 | invoice_id | FK | Y | Y | FK -> Invoice |
| 對應收款 | payment_id | FK | | Y | FK -> Payment，可空（先開發票後收款） |
| 對應金額 | amount | 小數 | Y | | 該收款用於該發票的金額 |
| 建立時間 | created_at | 日期時間 | Y | Y | |

### SalesAllowance（折讓單）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 原發票 | invoice_id | FK | Y | Y | FK -> Invoice |
| 藍新折讓號 | ezpay_allowance_no | 字串 | Y | Y | Mockup：A + 14 碼數字 |
| 折讓金額 | allowance_amount | 小數 | Y | | 限負數 |
| 折讓後剩餘 | remain_amount | 小數 | Y | Y | 藍新回傳 |
| 折讓原因 | reason | 字串 | Y | | |
| 狀態 | status | 單選 | Y | | 已確認 / 已作廢（Mockup 階段不停留於草稿，建立時直接寫入「已確認」） |
| 退款 Payment | refund_payment_id | FK | | | FK -> Payment（自動建立的退款記錄） |
| 開立時間 | issued_at | 日期時間 | Y | Y | |
| 確認時間 | confirmed_at | 日期時間 | | | |
| 作廢時間 | invalid_at | 日期時間 | | | |
| 作廢原因 | invalid_reason | 字串 | | | |
| 開立人 | issued_by | FK | Y | Y | FK -> 使用者 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### OrderAdjustment（訂單異動）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 所屬訂單 | order_id | FK | Y | Y | FK -> Order |
| 異動類型 | adjustment_type | 單選 | Y | | 規格變更 / 加印追加 / 退印 / 折扣 / 其他 |
| 異動金額 | amount | 小數 | Y | | 可正可負 |
| 異動原因 | reason | 字串 | Y | | |
| 狀態 | status | 單選 | Y | | 草稿 / 待主管審核 / 已核可 / 已退回 / 已執行 / 已取消 |
| 退回原因 | reject_reason | 字串 | | | status = 已退回時填入 |
| 建立人 | created_by | FK | Y | Y | FK -> 使用者（業務 / 諮詢） |
| 核可人 | approved_by | FK | | | FK -> 使用者（業務主管） |
| 核可時間 | approved_at | 日期時間 | | | |
| 執行時間 | executed_at | 日期時間 | | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### Order 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 帳務公司 | billing_company_id | FK | Y | Y | FK -> BillingCompany；建立時繼承自需求單；不可變更 |

## REMOVED Data Model

### Order 移除欄位

下列欄位 deprecated（保留欄位供讀舊資料，新訂單不寫入）：

| 欄位 | 英文名稱 | Migration |
|------|---------|-----------|
| 付款狀態 | payment_status | 由 PaymentPlan.status 統計推導；UI 顯示舊資料時直接讀此欄位 |
| 付款方式 | payment_method | 由 Payment.payment_method 多筆紀錄取代 |
| 付款備註 | payment_detail | 由 PaymentPlan.description 與 Payment 紀錄取代 |
| 付款時間 | paid_at | 由 Payment.paid_at 多筆紀錄取代 |
| 發票統一編號 | invoice_unified_number | 遷至 Invoice.buyer_ubn |
| 主訂單 | parent_order_id | OrderAdjustment 取代補收款子訂單機制 |
| 是否補收款訂單 | is_supplemental | OrderAdjustment 取代 |
