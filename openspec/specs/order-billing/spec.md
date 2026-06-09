## Purpose

訂單帳務模組 — 管理訂單的應收、發票、收款三條線的全生命週期，並以三方對帳機制確保一致性。

**問題**：
- 印刷廠一筆訂單的錢分三條線各自記：業務先算出「這筆訂單客戶應該付多少」（應收）、開了幾張發票合計多少（發票）、實際收到客戶匯來多少（收款）。這三條線是不同人、不同時間、用不同單據各自填進系統的，很容易某一條漏記或填錯
- 公司的做法不是事先用一堆硬性規定把三條線綁死（那樣會把正常生意卡死），而是讓業務照客戶實際狀況自由處理，最後靠對帳把這三個數字湊在一起比對
- 退款牽動已開發票（折讓或作廢），受中華民國齊報稅期 14 天時限法規約束
- 七個帳務實體（收款紀錄、訂單異動、請款期次、發票、折讓單、收款核銷分配、售後服務單）互相連帶，改一個要檢查其他

**目標**：
- 給業務處理款項的彈性（不綁死收款順序與發票時機），靠對帳兜底確保一致
- 發票開立、折讓、作廢符合 ezPay 與中華民國電子發票法規硬約束
- 三方對帳（應收 = 發票淨額 = 收款淨額）作為所有帳務操作的最終檢查點

- 相依模組：[order-management](../order-management/spec.md)（共用 Order 實體）、[order-adjustment](../order-adjustment/spec.md)（金額異動影響應收）、[consultation-request](../consultation-request/spec.md)（諮詢費帳務）、[after-sales-ticket](../after-sales-ticket/spec.md)（售後退款）

---
## Requirements

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

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與收款解耦：可先開後收、後收先開（開票維度與收款維度獨立）。發票與收款的對應透過「請款期次」中介——一張發票對應唯一一個請款期次（期次↔發票業務 1:1，見 § 請款期次行為規則 › 期次↔發票 1:1 嚴格約束）、一個期次可被多筆收款入帳、一筆收款可入帳多個期次（PaymentAllocation N:M，見 § 收款核銷分配）；不再是發票↔收款直接多對多（舊 PaymentInvoice junction 已廢止）。

**品項欄位送藍新對應**（本次新增）：每張 Invoice.items 陣列轉換為藍新 PostData 五欄序列（`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`），多項以 `|` 分隔。送出前 SHALL 通過「發票品項符合 ezPay 與電子發票法規硬約束」Requirement 全部 Scenario 驗證。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編、品項列輸入 name + count + unit + unitPrice（unitPrice 為未稅金額）
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立
- **AND** Invoice.items 每筆 itemAmount SHALL = count × unitPrice

#### Scenario: 客戶要兩張發票（拆期 = 拆票）

- **GIVEN** 訂單某期次 BI-X（scheduled_amount=100,000）客戶要求拆成兩張發票
- **WHEN** 業務先將 BI-X 拆為兩個獨立平輩期次 BI-X1（50,000）+ BI-X2（50,000）（見 § 請款期次行為規則 › 拆票 = 拆期），再各自一鍵開立發票
- **THEN** 系統 SHALL 為 BI-X1 / BI-X2 各建一張 Invoice（各 source_billing_installment_id 指向對應期次，期次↔發票 1:1）
- **AND** 兩張 Invoice 各自 items 從對應期次繼承 / 業務微調；一筆收款可同時入帳兩期（PaymentAllocation，見 § 收款核銷分配）

#### Scenario: 多筆收款對一張發票（一期次多筆收款）

- **GIVEN** 訂單某期次 BI-Y（scheduled_amount=100,000）已開立一張 Invoice
- **WHEN** 客戶分兩筆付款 30,000 + 70,000
- **THEN** 業務於各筆收款的入帳明細勾選 BI-Y 入帳（兩筆 PaymentAllocation → BI-Y），不另建發票
- **AND** BI-Y 收款維度累計達 100,000 推進「已收訖」（發票仍 1 張，發票↔期次 1:1 不變）

#### Scenario: 業務先開發票後收款（雙維度獨立）

- **WHEN** 業務於某期次尚未收款時先一鍵開立發票
- **THEN** 系統 SHALL 允許，該期次開票維度 = 已開立、收款維度 = 未收（雙維度獨立，見 § 請款期次行為規則 › 期次雙維度狀態）
- **AND** 後續收款時業務於入帳明細勾選該期次入帳（PaymentAllocation），收款維度依累計推進

#### Scenario: 業務開立 B2C 發票時單價為含稅金額

- **GIVEN** 業務於 Dialog 選擇 category = B2C
- **WHEN** 業務於品項列輸入 unitPrice = 1050（含 5% 稅）
- **THEN** 系統 SHALL 將該 unitPrice 視為含稅金額寫入 Invoice.items
- **AND** 系統 SHALL 自動換算 Invoice.salesAmount（未稅）= total / 1.05、taxAmount = total - salesAmount

### Requirement: 發票作廢與折讓

訂單詳情頁發票異動 UI SHALL 維持「作廢」「折讓」兩個獨立按鈕讓業務 / 諮詢依情境選擇。業務 / 諮詢 SHALL 可於訂單詳情頁作廢已開立的發票，不需業務主管 / 會計核可。

**作廢動作**：
- 業務點擊「作廢」 → 系統呼叫第三方發票平台執行作廢
- 作廢時必填作廢原因（限中文 6 字或英文 20 字，對應藍新 InvalidReason 限制）
- 平台回應成功：發票狀態變「作廢」，記錄作廢時間 / 原因 / 操作者；提示「流水號 +1，新發票自動生成下一號」。發票字軌號碼作廢後不可重用，重新開新發票時 ezpay_merchant_order_no 流水號 +1
- 平台回應失敗（跨齊報稅期）：UI MUST 顯示明確錯誤訊息「此發票已跨齊報稅期無法作廢，請改開折讓單」並引導業務改點「折讓」

**折讓動作**：
- 業務點擊「折讓」 → 開立折讓單（金額為負）關聯既有發票
- 折讓單成功開立後 MUST 更新發票淨額（發票金額 − 折讓 = 發票淨額）

**規則判斷在後端**：業務不需自行判斷跨齊報稅期，系統依第三方發票平台實際回應引導正確流程。

#### Scenario: 業務作廢統編打錯的發票

- **GIVEN** 業務開立 Invoice 時誤填客戶統編
- **WHEN** 業務於發票清單點擊「作廢」並填入原因「統編錯誤」
- **THEN** 系統 SHALL 更新 Invoice.status = 作廢、invalid_reason、invalid_at、invalid_by
- **AND** 系統 MUST 在訂單活動紀錄記載作廢

#### Scenario: 業務作廢後重新開立新發票

- **GIVEN** Invoice #1 已作廢（ezpay_merchant_order_no = O-25050601-INV-01）
- **WHEN** 業務開立新 Invoice
- **THEN** 系統 SHALL 產生新 ezpay_merchant_order_no = O-25050601-INV-02（流水 +1，不重用）

#### Scenario: 作廢未跨齊報稅期成功

- **GIVEN** 訂單已開立發票，發票未跨齊報稅期
- **WHEN** 業務於發票詳情點擊「作廢」並填寫作廢原因
- **THEN** 系統呼叫第三方發票平台
- **AND** 平台回應成功
- **AND** 發票狀態 SHALL 變「作廢」
- **AND** 系統 MUST 記錄作廢時間 / 原因 / 操作者

#### Scenario: 作廢跨齊報稅期失敗引導折讓

- **GIVEN** 訂單已開立發票，發票已跨齊報稅期
- **WHEN** 業務於發票詳情點擊「作廢」並填寫作廢原因
- **THEN** 系統呼叫第三方發票平台
- **AND** 平台回應失敗（跨齊報稅期不可作廢）
- **AND** UI MUST 顯示錯誤訊息「此發票已跨齊報稅期無法作廢，請改開折讓單」
- **AND** 業務 SHALL 改點「折讓」按鈕走折讓流程

#### Scenario: 開立折讓單關聯既有發票

- **GIVEN** 訂單已開立發票（金額 1000）
- **WHEN** 業務點擊「折讓」並填寫折讓金額 -300
- **THEN** 系統 SHALL 開立折讓單並關聯此發票
- **AND** 發票淨額 SHALL 更新為 700（1000 - 300）

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

退款 Payment 與 SalesAllowance 為**分離設計**，符合業界會計分離原則（Credit Memo 與 Refund 分軸）。實務流程：(1) 業務 / 諮詢先在訂單詳情頁建立退款 Payment（payment_method = 「退款」、amount 為負數）；(2) 視情境決定後續：(a) 已開立發票且需保留發票 → 開立 SalesAllowance；(b) 發票錯誤可作廢 → 作廢原發票重開。系統 SHALL NOT 在折讓建立時自動建立 Payment。退款 Payment 與 SalesAllowance 完全解耦，系統不記錄兩者對應（帳平以三軸總額比對），後續反查以訂單活動紀錄為準。

#### Scenario: 業務先建退款 Payment 再開折讓

- **GIVEN** Invoice #1 = 100,000 已開立、客戶已付款
- **WHEN** 客戶投訴 10,000 元品質瑕疵，業務先於訂單詳情頁建立 Payment（amount = -10,000、payment_method = 退款）
- **AND** 業務於 Invoice #1 開立 SalesAllowance（allowance_amount = -10,000、reason = 品質瑕疵）
- **THEN** Activity log MUST 分別記載 Payment 建立與 SalesAllowance 開立（退款與折讓不建立 FK 關聯，後續反查以活動紀錄為準）
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

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額分解：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（**僅 Payment.paymentStatus = '已完成'**，含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

**差額分解（四向善後引導）**：
- 應收 > 發票淨額 → **待開票 / 待折讓**（尚有收入未開立發票，或退款已調應收但未開折讓）
- 應收 > 收款淨額 → **待收**（尚有應收未收款）
- 收款淨額 > 應收 → **應退差額**（已收 > 應收，本 change 一律當「退款待執行」；溢收 / 預收細分另議，見 BI-3）
- 發票淨額 > 應收 → **待折讓**（已開票過多，需折讓沖減）

對帳平衡採 pairwise 判準（三軸兩兩相等，以應收總額為基準）：開票差額 = 應收總額 − 發票淨額；收款差額 = 應收總額 − 收款淨額。兩者皆為 0（即 應收 = 發票淨額 且 應收 = 收款淨額）視為對帳通過。

**退款核銷應退差額**：退款 Payment（amount < 0）核銷「應退差額」、不綁單一 OA 累計（`linkedOrderAdjustmentId` 選填）、不進期次。退款完成的物理錨點 = 退款 Payment 自身切「已完成」（業務上傳匯款證明），對帳差額歸零是**結果呈現**、非完成判定本身。多筆退款帳平不分筆判定，但每筆退款 Payment MUST 各自挂匯款證明附件。

**差額警示不可忽略**：對帳面板的應退差額 / 待開票 / 待收警示 SHALL NOT 提供「忽略此差額」選項——缺口只能靠實際開票 / 收款 / 退款消除（補「帳上已退、實際沒退」保護降級洞）。

**完成前調降與期次同步引導**：完成前明細調降致應收下降、若 `Σ BillingInstallment.scheduled_amount > 應收`，對帳面板 SHALL 顯示「應收已下降、期次規劃需同步」引導（不阻擋；沿用警示而非阻擋精神），業務 MAY 下修期次 scheduled_amount。

**[本 change 沿用] 處理中 Payment 資訊軸（不計入收款淨額）**：對帳面板收款淨額卡片內 SHALL 顯示 breakdown（已完成一般收款 +N / 已完成退款 -M / 處理中 ±0 muted）；差額 hint 加註「另含處理中款項 K 元，齊備後將計入」。

#### Scenario: 完成前減量退款核銷應退差額（情境 C）

- **GIVEN** 訂單某印件 800 張 × 100 = 印件費 80000、已開發票 80000、已完成收款 80000（三軸平）
- **WHEN** 業務於 Side Panel 改數量 800 → 500（調降）
- **THEN** 印件費即時 = 50000、應收 = 50000；對帳面板顯示「發票淨額(80000) > 應收(50000) 待折讓 30000」「收款淨額(80000) > 應收(50000) 應退差額 30000」
- **WHEN** 業務於原發票開折讓 SalesAllowance(-30000)
- **THEN** 發票淨額 = 50000
- **WHEN** 業務建退款 Payment(-30000, linkedOrderAdjustmentId = null)、上傳匯款證明、切已完成
- **THEN** 收款淨額 = 50000、三軸平、應退差額歸零（退款完成 = 退款 Payment 已完成）

#### Scenario: 多筆退款逐筆挂憑證

- **GIVEN** 訂單應退差額 = 40000（明細減 30000 + 售後 OA 退 10000）
- **WHEN** 業務建退款 Payment P-A(-30000) + P-B(-10000)
- **THEN** P-A 與 P-B SHALL 各自挂匯款證明附件方可切「已完成」
- **AND** 兩筆皆已完成後收款淨額減 40000、應退差額歸零（帳平不分筆判定）

#### Scenario: 應退差額警示不可忽略

- **GIVEN** 訂單應退差額 = 30000（已收 > 應收）
- **WHEN** 業務 / 會計查看對帳面板
- **THEN** 面板 SHALL 顯示「應退差額 30000、退款待執行」警示
- **AND** 面板 MUST NOT 提供「忽略此差額」選項

#### Scenario: 訂單異動 + 折讓退款的三方對帳（已完成 Payment 條件）

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000（已執行）、開立發票合計 25,000、確認折讓 -10,000、已完成收款合計 25,000、已完成退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

---

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

系統 SHALL 計算 BillingInstallment（請款期次）的 derived field `overdue_days`（收款維度狀態 ≠ 已收訖 時 = TODAY - due_date；due_date 為空時 = NULL），作為應收帳款帳齡（AR aging）底層基礎。訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 BillingInstallment 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）、逾期自動通知、應收帳款 Dashboard 不在本次範疇。

#### Scenario: BillingInstallment 逾期天數自動計算

- **GIVEN** BillingInstallment #1 收款維度 = 未收、due_date = 2026-04-01
- **WHEN** 系統時間為 2026-05-06
- **THEN** BillingInstallment #1.overdue_days SHALL = 35

#### Scenario: 已收訖 BillingInstallment 不算逾期

- **GIVEN** BillingInstallment #1 收款維度 = 已收訖、due_date = 2026-04-01
- **WHEN** 系統計算 overdue_days
- **THEN** overdue_days SHALL = NULL（不顯示逾期）

#### Scenario: 訂單列表依最長逾期天數篩選

- **WHEN** 業務 / 主管於訂單列表選擇篩選器「最長逾期天數 ≥ 30 天」
- **THEN** 系統 SHALL 列出所有有 BillingInstallment.overdue_days ≥ 30 的訂單
- **AND** 列表 SHALL 顯示該訂單最長逾期天數欄位

### Requirement: Payment 跨實體轉移

系統 SHALL 支援 Payment 從 ConsultationRequest 轉移至 Order 的單向能力，僅限於以下四種觸發情境之一：

1. 諮詢結束選「不做大貨」 → Payment 轉移至新建諮詢訂單
2. 諮詢結束選「做大貨」、需求單成交、業務轉訂單 → Payment 轉移至新建一般訂單
3. 諮詢結束選「做大貨」、需求單流失 → Payment 轉移至新建諮詢訂單
4. 待諮詢取消（退費）→ Payment 轉移至新建諮詢訂單

**轉移動作**：

1. 修改 `Payment.linked_entity_type` 從 `ConsultationRequest` 改為 `Order`
2. 修改 `Payment.linked_entity_id` 為新建訂單 ID
3. 紀錄 `Payment.original_entity_type / original_entity_id` 為原 ConsultationRequest（保留歷史）
4. 設定 `Payment.is_transferred = true`
5. ActivityLog 記錄轉移動作

**轉移後限制**：Payment.is_transferred = true 後 MUST NOT 再次轉移。

**為何僅限 ConsultationRequest → Order 單向**：本 change 範疇內 Payment 轉移只服務於諮詢費四種收尾情境；其他「跨訂單支付調整」走 refactor change 既有的「退款 Payment + SalesAllowance」分離設計。

#### Scenario: 諮詢結束不做大貨 Payment 轉移

- **GIVEN** ConsultationRequest CR-XXX、Payment(linked_entity_type=ConsultationRequest, linked_entity_id=CR-XXX, amount=1000)
- **WHEN** 諮詢人員點擊「結束諮詢 - 不做大貨」、系統建立諮詢訂單 SO-YYY
- **THEN** 系統 SHALL 修改 Payment.linked_entity_type 從 `ConsultationRequest` 改為 `Order`、linked_entity_id 從 CR-XXX 改為 SO-YYY
- **AND** Payment.is_transferred SHALL = true
- **AND** Payment.original_entity_type / original_entity_id MUST 保留 CR-XXX
- **AND** ActivityLog 記錄「Payment 由 ConsultationRequest CR-XXX 轉移至諮詢訂單 SO-YYY」

#### Scenario: 諮詢結束做大貨需求單成交 Payment 轉移至一般訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX（linked_consultation_request_id = CR-XXX）成交
- **WHEN** 業務點擊「轉訂單」、系統建立一般訂單 SO-ZZZ
- **THEN** 系統 SHALL 修改 Payment.linked_entity_id 為 SO-ZZZ、linked_entity_type = Order
- **AND** is_transferred = true

#### Scenario: 需求單流失觸發 Payment 轉移至諮詢訂單

- **GIVEN** ConsultationRequest CR-XXX、Payment 綁 CR-XXX、需求單 QR-XXX 流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單 SO-WWW
- **THEN** 系統 SHALL 將 Payment 轉移至 SO-WWW
- **AND** is_transferred = true

#### Scenario: 已轉移 Payment 不可再次轉移

- **GIVEN** Payment.is_transferred = true
- **WHEN** 系統嘗試再次修改 Payment.linked_entity_id
- **THEN** 系統 MUST 拒絕
- **AND** ActivityLog 記錄拒絕事件

---

### Requirement: 諮詢訂單帳務處理（發票 / 期次 / 對帳）

**發票時間點規則**

諮詢訂單（`order_type = 諮詢`）的 Invoice **MUST NOT 由系統自動開立**。發票開立依情境分流：不做大貨 / 需求單流失情境由系統自動建待開發票（BillingInstallment）提醒、諮詢人員手動一鍵開立 Invoice（見下方 § 收尾自動建請款期次）；諮詢取消情境系統 MUST NOT 自動建待開發票，留存 1000 收入由業務手動開立 Invoice、未開票由對帳差額警示兜底（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）。

廢止既有「依 `consultation_invoice_option` 自動開立 Invoice」邏輯：
- `issue_now` 與 `defer_to_main_order` 兩值在任何諮詢訂單收尾情境（不做大貨 / 需求單流失 / 諮詢取消）下，系統 MUST NOT 自動觸發 Invoice 開立
- `consultation_invoice_option` 欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示（不再驅動系統行為）

#### Scenario: 諮詢訂單建立時不自動開立 Invoice（任一 invoice_option）

- **GIVEN** ConsultationRequest `consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **AND** 諮詢訂單因不做大貨 / 需求單流失情境建立
- **WHEN** 系統建立諮詢訂單
- **THEN** 系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance
- **AND** 系統 SHALL 依情境自動建立對應金額的待開發票（BillingInstallment）（見下方 § 收尾自動建請款期次）
- **AND** 諮詢人員 SHALL 後續手動將待開發票轉為實際 Invoice（金額由諮詢人員依客戶需求決定）
- **AND** 諮詢取消情境系統 MUST NOT 自動開立 Invoice 亦 MUST NOT 自動建待開發票（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）

**收尾自動建請款期次**

當諮詢訂單於不做大貨 / 需求單流失兩收尾情境任一建立時，系統 SHALL 自動建立 BillingInstallment 1 筆作為「待開發票提醒」，讓諮詢人員於待開票期次列表看到待辦並手動一鍵開立為實際 Invoice。諮詢取消情境系統 MUST NOT 自動建待開發票（見下方「諮詢取消情境例外」）。各情境機制單一正本見 [consultation-request spec](../consultation-request/spec.md) § 諮詢結束不做大貨情境自動建請款期次 / § 需求單流失情境自動建請款期次 / § 諮詢取消半額退費自動建請款期次。

**BillingInstallment 實體與狀態機**：完整欄位定義與雙維度狀態機（開票維度 invoicing_status + 收款維度 payment_status）見 [state-machines spec](../state-machines/spec.md) § BillingInstallment 雙維度狀態機 / § BillingInstallment 取代 PlannedInvoice 狀態機。品項鏈式預填語意見本 spec § Requirement: 請款期次行為規則 › 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承 / § Requirement: BillingInstallment 品項鏈式預填。

**自動建立規則**（依諮詢訂單收尾情境）：

| 觸發情境 | scheduled_amount | description | due_date / scheduled_issue_date | source_type |
|---------|-----------------|-------------|--------------|-------------|
| 諮詢結束不做大貨（諮詢人員點「結束諮詢 - 不做大貨」）| 2000 | 「諮詢費」 | 完成諮詢時點當天 | consultation_end_no_production |
| 諮詢來源需求單流失歸類為不做大貨 | 2000 | 「諮詢費」 | 需求單流失時點當天 | quote_lost |

**諮詢取消情境例外**：諮詢取消（待諮詢狀態半額退費）情境系統 **MUST NOT 自動建待開發票**（2026-05-30 converge-consultation-cancel-to-order-cancel-flow 收斂、廢除諮詢專屬自動建期次，推翻既有自動建 1000 待開發票拍板）。留存 1000 收入由業務手動開立 Invoice、未開票由對帳差額警示兜底（見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）。`source_type = consultation_cancellation` enum 保留供業務手動建期次時標示來源。

**諮詢結束做大貨 → 需求單成交轉一般訂單情境**：系統 MUST NOT 自動於主訂單建立諮詢費 BillingInstallment。業務於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment（既有 BillingInstallment 手動建立流程），可參考 `consultation_invoice_option` 客戶意向決定獨立 / 併入其他 BillingInstallment。

**共同欄位**：所有自動建立的 BillingInstallment SHALL 設定 `invoicing_status = 未開立`、`created_by = system`、`linked_invoice_id = NULL`。

#### Scenario: 諮詢結束不做大貨自動建 BillingInstallment

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」、系統建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 BillingInstallment（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 完成諮詢時點當天、source_type = consultation_end_no_production、invoicing_status = 未開立、created_by = system、linked_invoice_id = NULL）

#### Scenario: 諮詢來源需求單流失自動建 BillingInstallment

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、對應需求單流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 BillingInstallment（order_id = 諮詢訂單 ID、scheduled_amount = 2000、description = 「諮詢費」、due_date / scheduled_issue_date = 流失時點當天、source_type = quote_lost、invoicing_status = 未開立、created_by = system、linked_invoice_id = NULL）

#### Scenario: 諮詢取消不自動建待開發票

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 確認取消、系統建立諮詢訂單 + OA + 退款 Payment
- **THEN** 系統 MUST NOT 自動建立待開發票（BillingInstallment）（留存 1000 收入由業務手動開立 Invoice）
- **AND** 未開票由對帳差額警示兜底（應收 1000 > 發票淨額 0，見 § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單）

#### Scenario: 自動建立的 BillingInstallment 出現在待開票期次待辦列表

- **GIVEN** 諮詢訂單收尾自動建立 BillingInstallment、invoicing_status = 未開立
- **WHEN** 諮詢人員開啟待開票期次列表頁
- **THEN** 列表 SHALL 包含此 BillingInstallment
- **AND** 列表 SHALL 顯示「今天到期」狀態（依 scheduled_issue_date 推導）以提示諮詢人員優先處理
- **AND** 諮詢人員 SHALL 可點擊進入諮詢訂單詳情頁一鍵開立 Invoice

#### Scenario: 諮詢人員手動一鍵開立 BillingInstallment 為 Invoice

- **GIVEN** BillingInstallment(scheduled_amount = 2000、description = 「諮詢費」、invoicing_status = 未開立)（不做大貨 / 需求單流失情境自動建）
- **WHEN** 諮詢人員於諮詢訂單詳情頁發票區點「一鍵開立」並確認金額
- **THEN** 系統 SHALL 建立 Invoice（金額由諮詢人員確認、預設帶入 BillingInstallment.scheduled_amount、品項繼承自 BillingInstallment.items）
- **AND** 系統 SHALL 將 BillingInstallment.invoicing_status 改為「已開立」、linked_invoice_id 寫入新建 Invoice ID
- **AND** BillingInstallment 從待開票期次待辦列表移除

#### Scenario: 諮詢結束做大貨需求單成交主訂單不自動建諮詢費 BillingInstallment

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立 BillingInstallment
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 BillingInstallment

**諮詢取消對帳**

諮詢取消（待諮詢狀態半額退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並依新公式計算與標示。

**新對帳公式**：
- 應收總額 = OEC(2000) + ∑(已執行或已核可 OA(-1000)) = 1000
- 收款淨額 = Payment(+2000, 已完成) + Payment(-1000, 已完成) = 1000
- 發票淨額 = ∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance（由業務 / 諮詢人員手動開立、預設目標 1000）
- 差額 = 應收總額 - 發票淨額 - 收款淨額 = 1000 - 發票淨額 - 1000 = -發票淨額

對帳狀態標示規則：
- 退款 Payment 仍處理中（OA 為已核可、未推進已執行）：標示「退費處理中」、應收 SHALL 顯示為 1000（已核可 OA 即時計入應收）、收款淨額顯示為 2000（含+2000、扣除處理中-1000 = 不計入處理中 Payment 規則，依既有對帳規則）；發票淨額 0 = 預期當下尚未開
- 退款 Payment 已完成（OA 已推進已執行）且發票淨額 = 1000：標示「對帳通過 - 退費完成」
- 退款 Payment 已完成（OA 已推進已執行）且發票淨額 ≠ 1000：標示「待對帳 - 發票金額需確認」、差額由既有對帳警示 banner 提示業務 / 諮詢人員處理

#### Scenario: 諮詢取消退費完成對帳通過

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已執行) + Payment(+2000, 已完成) + Payment(-1000, 已完成) + Invoice(1000, 已開立)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 1000、差額 SHALL = 0
- **AND** 面板 SHALL 標示「對帳通過 - 退費完成」

#### Scenario: 諮詢取消退費處理中

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已核可) + Payment(+2000, 已完成) + Payment(-1000, 處理中)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 2000（處理中退款 -1000 不計入既有對帳公式）
- **AND** 應收總額 SHALL = 1000（已核可 OA 即時計入應收）
- **AND** 對帳面板 SHALL 標示「退費處理中」並顯示「另含處理中退款 1000 元」

#### Scenario: 諮詢取消後發票金額不符提示

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(-1000, 已執行) + Payment(+2000) + Payment(-1000, 已完成) + Invoice(2000, 已開立，諮詢人員誤開全額)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 2000、差額 SHALL = -1000
- **AND** 對帳面板 SHALL 標示「待對帳 - 發票金額需確認」
- **AND** 既有對帳警示 banner SHALL 提示諮詢人員修正誤開的發票（將 2000 發票作廢重開為 1000，或開立 SalesAllowance(-1000) 將發票淨額降至 1000）——此為**發票開立金額更正**動作；退款本身已由系統自動建立的 OA(-1000) + 退款 Payment(-1000) 處理，非以折讓退費（對齊 converge-consultation-cancel OA 退款模型、退款 Payment 與 SalesAllowance 分離設計）

### Requirement: 對帳警示 banner 觸發條件

訂單詳情頁的對帳檢視面板 SHALL 於以下條件成立時顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行，請會計確認原月結紀錄」：

```
任一 OrderAdjustment 滿足：
  Order.completed_at IS NOT NULL
  AND OrderAdjustment.status = 已執行
  AND OrderAdjustment.executed_at > Order.completed_at
```

觸發條件 SHALL 同時適用於：
- 訂單期間建立但跨期執行的 OrderAdjustment（linked_after_sales_ticket_id IS NULL）
- AfterSalesTicket 內部建立的關聯 OrderAdjustment（linked_after_sales_ticket_id IS NOT NULL）

兩種情境的對帳意義相同（跨完成日的金額異動需重新對帳），不分桶判斷。Order 尚未完成時（completed_at IS NULL），banner 不觸發。

完整對帳警示與三方對帳檢視邏輯延續本 spec § 三方對帳檢視面板 既有定義。

#### Scenario: 訂單期間建立但跨期執行觸發警示

- **GIVEN** OrderAdjustment 建立時 Order.status = 生產中（executed_at 尚未設定）
- **AND** 業務主管核可後 Order 推進至已完成（completed_at = 2026-03-15）
- **WHEN** 業務於 2026-05-06 點擊「執行」（executed_at = 2026-05-06）
- **THEN** 因 executed_at（2026-05-06）> completed_at（2026-03-15），對帳檢視面板 SHALL 顯示警示 banner
- **AND** banner 文字 SHALL = 「歷史對帳需重新核對 — 訂單已於 2026-03-15 完成，異動於 2026-05-06 執行，請會計確認原月結紀錄」

#### Scenario: AfterSalesTicket 關聯 OrderAdjustment 執行觸發警示

- **GIVEN** Order.completed_at = 2026-03-15、AfterSalesTicket AS-001 已建立、resolution = 退款
- **WHEN** 業務於 ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=AS-001, amount=-5000) 並執行於 2026-05-06
- **THEN** 對帳檢視面板 SHALL 顯示警示 banner（與訂單期間建立的 OA 處理方式相同）

#### Scenario: 訂單未完成時不觸發警示

- **GIVEN** OrderAdjustment 已執行（executed_at = 2026-05-06）
- **AND** Order.completed_at IS NULL（尚未完成）
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 系統 SHALL NOT 顯示警示 banner

### Requirement: 雙欄計價輸入與顯示

訂單 SHALL 採雙欄計價，所有金額欄位（subtotal、other_fee、shipping_fee、consult_fee、discount、total）同時儲存 `_with_tax` 與 `_without_tax` 兩個值，並於 `Order.tax_amount` 記錄總稅額。

**輸入規則：**

- 線下訂單（order_source = 線下）：業務於需求單 / 訂單階段輸入**未稅金額**，系統依稅率（預設 5%）反推含稅；雙欄同步寫入。
- 線上訂單（order_source ∈ {線上, 線上自定義}）：EC 帶入**含稅金額**，系統反推未稅；雙欄同步寫入。

**顯示規則**：訂單詳情頁「金額組成」區塊 SHALL 採雙欄並列（未稅 / 含稅），取代原本「主從欄位動態切換」邏輯，線下單與線上單顯示結構一致。UI 顯示規則（模式 A1 分項表格 + summary 水平 4 欄）見 DESIGN.md §10.1.14。

- 列表 / 報表查詢 SHALL 支援以任一基準篩選與排序。

**計算公式（稅率 r，預設 r = 0.05）：**

```
with_tax = round(without_tax × (1 + r))
without_tax = round(with_tax / (1 + r))
tax_amount = total_with_tax − total_without_tax
```

rounding 採整數（小數 0 位，與會計慣例一致）。

退款 / 折讓 / OrderAdjustment 金額 SHALL 沿用雙欄結構；實際收款 Payment.amount 不拆雙欄（含稅實收即為入帳金額）。

#### Scenario: 線下單業務輸入未稅金額

- **GIVEN** 業務於需求單成交轉訂單，需求單商品小計（未稅）= 100,000
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_without_tax = 100,000
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_with_tax = 105,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 5,000（總額層級）

#### Scenario: 線上單 EC 帶入含稅金額

- **GIVEN** EC 商品成交金額（含稅）= 5,250
- **WHEN** 系統建立訂單
- **THEN** 系統 SHALL 寫入 Order.subtotal_with_tax = 5,250
- **AND** 系統 SHALL 計算並寫入 Order.subtotal_without_tax = 5,000
- **AND** 系統 SHALL 計算並寫入 Order.tax_amount = 250（總額層級）

#### Scenario: 雙欄寫入失敗的一致性保護

- **WHEN** 系統寫入金額時其中一欄寫入失敗
- **THEN** 系統 MUST rollback 整筆寫入並回報錯誤
- **AND** 訂單金額狀態 MUST 保持寫入前一致

---

### Requirement: Invoice Data Model 與 ezpay 連結

訂單發票 SHALL 透過藍新（NewebPay / ezPay）電子發票平台開立。Invoice 子實體欄位定義如下（資料模型詳見本 spec § Data Model）：

| 欄位 | 必填 | 說明 |
|------|------|------|
| `category` | Y | 發票種類：B2B / B2C |
| `buyer_name` | Y | 買受人名稱 |
| `buyer_ubn` | Y（B2B）| 買方統一編號（B2C 留空）|
| `buyer_address` | N | 買受人地址 |
| `buyer_email` | N | 發票寄送信箱 |
| `carrier_type` | N | 載具類別（B2C 適用）|
| `carrier_num` | N | 載具編號 |
| `tax_type` | Y | 課稅別：應稅 / 零稅率 / 免稅 |
| `tax_rate` | Y（auto）| 稅率，依 tax_type 自動帶入 |
| `sales_amount` | Y（auto）| 銷售額（未稅，自動計算）|
| `tax_amount` | Y（auto）| 稅額（自動計算）|
| `total_amount` | Y | 發票金額（含稅），業務可微調 |
| `items` | Y | 商品明細，自訂單印件帶入可編輯 |
| `comment` | N | 發票備註 |
| `status` | Y | 開立 / 作廢 |
| `invoice_number` | Y（藍新回傳）| 財政部核發的發票號碼 |
| `invalid_reason` | Y（作廢時）| 作廢原因，限中文 6 字或英文 20 字 |
| `ezpay_invoice_url` | Y（derived）| 藍新平台單張發票的連結 URL，呼叫藍新 API 取得，業務可從訂單詳情頁直接開啟下載 PDF |
| `folded` | Y（derived）| 此張發票已確認折讓的金額合計（∑ 已確認折讓單金額絕對值，排除已作廢）|
| `remaining` | Y（derived）| 此張發票尚可開立折讓的金額上限（= 發票金額 − 折讓累計）|
| `allowance_label` | Y（derived）| 折讓衍生標示，依折讓累計即時計算 |

Invoice MUST NOT 包含 `print_flag`（索取紙本）欄位；客戶 SHALL 統一至 ezpay 自行下載 PDF；業務若需代客寄信 / 列印，從 `ezpay_invoice_url` 開啟。

#### Scenario: 業務從訂單詳情頁開啟 ezpay 發票連結

- **GIVEN** 訂單 SO-001 已開立發票 INV-001、藍新已回傳 invoice_number
- **WHEN** 業務於訂單詳情頁的發票區點擊「下載發票」
- **THEN** 系統 SHALL 呼叫藍新 API 取得 `ezpay_invoice_url`
- **AND** 系統 SHALL 於新分頁開啟連結，供業務下載 PDF 或寄送客戶

#### Scenario: 客戶端不暴露索取紙本選項

- **WHEN** 任何客戶端介面（EC 前台、訂單確認 email、客戶查詢頁）顯示發票
- **THEN** 系統 MUST NOT 提供「索取紙本」選項
- **AND** SHALL 提供 ezpay 平台連結供客戶自行下載

---

### Requirement: SalesAllowanceFile 折讓回簽附件

每筆 SalesAllowance SHALL 支援多檔回簽檔案上傳，透過子表 `SalesAllowanceFile` 儲存。檔案用途包含：用印折讓單 PDF、客戶端折讓證明、其他補充文件。

`SalesAllowanceFile` 欄位：

| 欄位 | 型別 | 必填 | 唯讀 | 說明 |
|------|------|------|------|------|
| id | UUID | Y | Y | 主鍵 |
| sales_allowance_id | FK | Y | Y | FK → SalesAllowance |
| filename | 字串 | Y | | |
| file_url | 字串 | Y | Y | |
| file_size_kb | 整數 | Y | Y | |
| file_type | 字串 | Y | | MIME type（如 application/pdf, image/jpeg）|
| uploaded_by | FK | Y | Y | FK → 使用者 |
| uploaded_at | 日期時間 | Y | Y | |

業務 SHALL 可於折讓單詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次上傳 / 刪除動作。

#### Scenario: 業務上傳折讓單回簽檔

- **GIVEN** SalesAllowance SA-001 狀態 = 已確認、折讓金額 = -3,000
- **WHEN** 業務於折讓單詳情頁上傳「用印折讓單.pdf」
- **THEN** 系統 SHALL 建立 SalesAllowanceFile 紀錄
- **AND** 折讓單詳情頁 SHALL 顯示已上傳的檔案清單
- **AND** ActivityLog MUST 記錄上傳

#### Scenario: 業務上傳多份回簽檔案

- **GIVEN** SalesAllowance SA-001 已上傳「用印折讓單.pdf」
- **WHEN** 業務再上傳「客戶折讓證明.jpg」
- **THEN** 系統 SHALL 建立第二筆 SalesAllowanceFile 紀錄
- **AND** 兩筆檔案 SHALL 並列顯示

---

### Requirement: PaymentFile 收款對帳附件

每筆 Payment SHALL 支援多檔對帳檔案上傳，透過子表 `PaymentFile` 儲存。檔案用途包含：對帳截圖、收據照片、匯款信 PDF、第三方付款證明。

`PaymentFile` 欄位結構同 § SalesAllowanceFile（父實體 FK 改為 `payment_id`）。

業務 SHALL 可於收款記錄詳情頁上傳 / 刪除 / 下載檔案；ActivityLog MUST 記錄每次動作。

#### Scenario: 業務上傳收款對帳截圖

- **GIVEN** Payment P-001 狀態 = 已收訖、金額 = 30,000
- **WHEN** 業務上傳「銀行對帳截圖.png」
- **THEN** 系統 SHALL 建立 PaymentFile 紀錄
- **AND** 收款記錄 SHALL 顯示已上傳的檔案清單

---

### Requirement: 訂單金額 Data Model 雙欄擴充

Order Data Model 金額相關欄位 SHALL 同時包含 `_with_tax` 與 `_without_tax` 兩個基準的儲存：

| 業務語義 | 含稅欄位（既有保留）| 未稅欄位（新增）|
|---------|-------------------|----------------|
| 商品小計 | `subtotal_with_tax` | `subtotal_without_tax` |
| 其他費用小計 | `other_fee_with_tax` | `other_fee_without_tax` |
| 運費 | `shipping_fee_with_tax` | `shipping_fee_without_tax` |
| 諮詢費 | `consult_fee_with_tax` | `consult_fee_without_tax` |
| 折扣金額 | `discount_amount`（含稅）| `discount_without_tax` |
| 訂單總額 | `total_with_tax` | `total_without_tax` |
| 稅額 | — | `tax_amount`（= total_with_tax − total_without_tax）|

新增欄位 type 為 Decimal(12,2)，必填，預設 0；既有 `_with_tax` 欄位定義不變更。

OrderAdjustment.amount 與 OrderExtraCharge.amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

SalesAllowance.allowance_amount SHALL 同時包含 `_with_tax` / `_without_tax` 兩欄；既有單欄定義為含稅，新增未稅欄位。

Payment.amount 不拆雙欄（實際收款金額為含稅實收）。

#### Scenario: 既有訂單未稅欄位回填

- **GIVEN** 既有 Order 資料的 `_with_tax` 欄位有值、`_without_tax` 欄位為空
- **WHEN** 資料遷移腳本執行
- **THEN** 系統 SHALL 計算 `_without_tax = round(_with_tax / 1.05)` 並寫入
- **AND** 系統 SHALL 計算 `tax_amount = total_with_tax − total_without_tax` 並寫入

### Requirement: Payment 修正路徑（已完成不可改回處理中）

業務發現「已完成」標錯時，SHALL NOT 直接從 paymentStatus = '已完成' 切回 '處理中'。修正路徑為「取消整筆 Payment → 重建新 Payment」。

此規則維持 OA「已執行」的終態語意（避免狀態反覆翻動）。訂單收退款模型重構後 OA「已執行」於主管核可時即生效、不綁 Payment 累計，取消已完成退款 Payment SHALL NOT 回退 OA（見 [state-machines spec § 訂單異動狀態機](../state-machines/spec.md)「[訂單收退款模型重構移除]『已執行』回退機制」），改由對帳應退差額重現 + 差額警示引導重退。

#### Scenario: 業務嘗試將已完成 Payment 切回處理中被擋

- **GIVEN** Payment P-099（paymentStatus = '已完成', completedAt = 2026-05-21）
- **WHEN** 業務於 P-099 編輯 dialog 內嘗試將 paymentStatus 切換為 '處理中'
- **THEN** dialog UI SHALL 阻擋切換（toggle / select 限制或 disabled）
- **AND** UI SHALL 顯示提示「已完成 Payment 不可改回處理中。如需修正請改用「取消」功能後重建新 Payment」

#### Scenario: 業務取消已完成 Payment 後重建

- **GIVEN** Payment P-099（已完成、amount = -5000、關聯 OA-099 已執行）
- **WHEN** 業務於 OA-099 編輯介面 P-099 row 點「取消」
- **THEN** 系統 SHALL 邏輯刪除 P-099（已完成 Payment 保留稽核軌跡）
- **AND** OA-099 SHALL 維持「已執行」（OA 已執行於核可時已生效、不回退已核可）；對帳應退差額 SHALL 重現並觸發不可忽略警示
- **AND** 業務 SHALL 可於 OA-099 編輯介面重新建立新退款 Payment 沖銷應退差額

---

### Requirement: 既有資料 Migration（一次性 backfill）

本 change 上線時 SHALL 對既有所有 Payment 執行一次性 backfill：

- 所有 paymentStatus 為 null 的既有 Payment（含一般收款 + 退款 + 補收 + 諮詢費）SHALL 設為 `paymentStatus = '已完成'`、`completedAt = createdAt`
- 理由：refine-after-sales-refund + refactor change 時期的設計即為「建立 = 完成」，既有資料的 paidAt 與 attachments 也已是「實際發生」狀態，backfill 為「已完成」符合實質

Migration SHALL 為冪等：重複執行不會改變已 backfill 的資料。

#### Scenario: 既有退款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆退款 Payment P-old（amount = -5000, paymentMethod = '退款', paymentStatus = null, createdAt = 2026-05-20T10:00:00Z）
- **WHEN** 系統執行 Migration
- **THEN** P-old.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** P-old.completedAt SHALL 被 backfill 為 2026-05-20T10:00:00Z（= createdAt）
- **AND** Migration 結束後 OA invariant SHALL 仍滿足（既有「已執行 OA → 必有關聯退款 Payment」已隱含「已完成」語意）

#### Scenario: 既有一般收款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆一般收款 Payment P-old2（amount = +30000, paymentMethod = '銀行轉帳', paymentStatus = null, createdAt = 2026-04-10）
- **WHEN** 系統執行 Migration
- **THEN** P-old2.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** 對帳收款淨額計算結果 SHALL 與本 change 上線前一致（向後相容）

### Requirement: 處理中 Payment 老化追蹤

Payment 滿足以下條件時系統 SHALL 視為「老化處理中 Payment」：

- `paymentStatus = '處理中'`
- `cancelled = false`
- `createdAt < now - 7 天`（依自然日計算，閾值 resolve [[ORD-021-處理中Payment老化追蹤機制]]）

老化判定後系統 SHALL 於訂單詳情頁 `OrderPaymentSection` 收款紀錄列表 row 顯示 amber Badge「老化 N 天」，N = `floor((now - createdAt) / 86400000)`。

老化閾值 7 天為初版固定值，未來累積 KPI「處理中 Payment 老化率」UAT 數據後可調整。

**設計理由**：原 change 引入 paymentStatus 雙態後，業務先建處理中 Payment 屬於「實際金流尚未發生、待確認」的中間態。若無老化追蹤、業務忘了補齊資料 → Payment 永遠停留處理中 → 對帳數字虛胖（應收找不到對應已完成 Payment）。7 天閾值對應印刷業常見「客戶說已匯款 → 銀行對帳單收到」週期。訂單層級的 row Badge 提示讓業務在訂單詳情頁不離開頁面即可知悉該筆 Payment 已老化，提示時機與業務操作焦點對齊。

跨訂單聚合的「業務主管老化清單」視圖在 2026-05-26 後續決策中拆除（remove-aging-payment-supervisor-dashboard change） — 主管追蹤跨訂單老化 Payment 改採「匯出 csv row data 後 Excel 自行篩選」方式進行；系統內保留訂單層級 row Badge 但不再提供 sidebar 入口與聚合清單頁（csv 匯出機制本 spec 不定義、另議）。

#### Scenario: 處理中 Payment 超過 7 天顯示老化 Badge

- **GIVEN** Payment P-013 createdAt = now - 8 天、paymentStatus = '處理中'、cancelled = false
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** P-013 row SHALL 顯示 amber Badge「老化 8 天」

#### Scenario: 處理中未滿 7 天不顯示老化 Badge

- **GIVEN** Payment P-014 createdAt = now - 5 天、paymentStatus = '處理中'
- **WHEN** 業務刷新訂單詳情頁
- **THEN** P-014 row SHALL NOT 顯示老化 Badge（未達閾值）

#### Scenario: 已取消 Payment 不列入老化追蹤

- **GIVEN** Payment P-015 createdAt = now - 10 天、paymentStatus = '處理中'、cancelled = true
- **WHEN** 老化追蹤掃描
- **THEN** P-015 SHALL NOT 顯示老化 Badge（cancelled 排除）

### Requirement: 處理中 Payment 不入會計帳本（GL 邊界規範）

處理中 Payment SHALL NOT 影響 General Ledger 應收應付帳本：

- 處理中 Payment 僅在訂單詳情頁三方對帳面板顯示為「處理中（合計）」資訊軸（既有實作沿用）
- 已完成才入 GL 應收應付帳本
- 對帳面板「處理中（合計）」軸下方 SHALL 補註「不入 GL 應收應付帳本」說明文字 + hover tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

當前 Prototype 階段無正式 GL 系統，本規範作為未來導入 GL 時的入帳邊界規範（resolve [[ORD-019-會計處理中Payment應收應付處理]]）。

**設計理由**：會計準則要求應收應付認列須有「實際交易發生」事實依據（對帳附件）。處理中 Payment 屬於業務預登記、未有事實依據，不應入 GL 避免月結 / 季結報表虛胖。雙重保護：對帳面板顯示處理中合計（業務 / 會計可見、便於追蹤）+ GL 不入帳。

#### Scenario: 對帳面板處理中合計軸顯示「不入 GL」說明

- **WHEN** 業務 / 會計開啟訂單詳情頁對帳面板
- **THEN**「處理中（合計）」軸下方 SHALL 顯示說明文字「不入 GL 應收應付帳本」
- **AND** 業務 / 會計 hover 該說明 SHALL 顯示 tooltip「處理中 Payment 不影響應收應付，已完成才入帳」

#### Scenario: 處理中 Payment 不影響應收應付推導

- **GIVEN** 訂單應收 30000、已完成 Payment 累計 20000、處理中 Payment 累計 10000
- **WHEN** 系統推導 Order.payment_status（既有設計、僅累計已完成 Payment）
- **THEN** Order.payment_status 推導 SHALL 僅計入已完成 20000、處理中 10000 不入
- **AND** 對帳面板「應收應付差額」計算 SHALL 不含處理中金額

### Requirement: Payment 邏輯刪除（取消已完成 Payment 保留稽核軌跡）

Payment Data Model SHALL 新增以下三個欄位：

| 欄位 | 類型 | 必填 | 預設 | 說明 |
|------|------|------|------|------|
| cancelled | boolean | 必填 | false | 是否已取消（邏輯刪除旗標）|
| cancelReason | string | 選填 | '' | 取消原因（cancelled = true 時 SHALL 為非空字串）|
| cancelledAt | string \| null | nullable | null | 取消時點（cancelled = true 時必填 ISO 8601 timestamp）|

`cancelPayment(paymentId, options)` action 行為依 paymentStatus 分支：

- **paymentStatus = '處理中'**：直接從 `Order.payments` 陣列刪除（物理刪除、無稽核需求）
- **paymentStatus = '已完成'**：邏輯刪除（設 `cancelled = true`、`cancelReason`、`cancelledAt = now`），SHALL NOT 從陣列移除；訂單收退款模型重構後 SHALL NOT 觸發 OA 回退（OA 已執行於核可時已生效、不綁 Payment 累計），改觸發對帳應退差額重現（收款淨額 − 應收 > 0）+ 差額警示引導重退

`calcOACompletedPaymentsTotal` 與對帳面板收款淨額計算 SHALL 排除 `cancelled = true` 的 Payment。

訂單詳情頁 OrderPaymentSection 列表 SHALL 預設隱藏 `cancelled = true` 的 Payment，提供「顯示已取消」toggle 切換可見性；已取消 row 顯示時 SHALL 標示 grey Badge「已取消」+ cancelReason hover tooltip。

既有 mock data SHALL backfill `cancelled = false`、`cancelReason = ''`、`cancelledAt = null`（一次性 migration）。

（resolve [[ORD-020-取消已完成Payment邏輯刪除vs物理刪除]]）

**設計理由**：已完成 Payment 代表「實際金流已發生且對帳已過」，物理刪除會造成稽核軌跡缺失（無法回查「為什麼這筆 Payment 不見了」）。處理中 Payment 屬於「業務預登記未實際發生」，刪除等同放棄此登記、無稽核需求。雙態分支符合「實際發生事件不可抹除」會計準則。

#### Scenario: 取消處理中 Payment 直接物理刪除

- **GIVEN** Payment P-016 paymentStatus = '處理中'、Order.payments 含 P-016
- **WHEN** 業務於 OA 編輯介面內點 P-016「取消」、確認
- **THEN** 系統 SHALL 從 Order.payments 陣列移除 P-016（物理刪除）
- **AND** Order.payments SHALL NOT 含 P-016

#### Scenario: 取消已完成 Payment 邏輯刪除保留稽核軌跡 + OA 維持已執行

- **GIVEN** Payment P-017 paymentStatus = '已完成'、amount = -5000、linkedOrderAdjustmentId = OA-001
- **AND** OA-001.status = '已執行'、amount = -5000
- **AND** Order.payments 含 P-017
- **WHEN** 業務於 OA 編輯介面內點 P-017「取消」、填入 cancelReason = '對帳資料填錯'、確認
- **THEN** 系統 SHALL 設 P-017.cancelled = true、cancelReason = '對帳資料填錯'、cancelledAt = now
- **AND** Order.payments SHALL 仍含 P-017（邏輯刪除、不從陣列移除）
- **AND** OA-001.status SHALL 維持 '已執行'（OA 已執行於核可時已生效、取消 Payment 不回退）
- **AND** 對帳應退差額 SHALL 重現（收款淨額 − 應收 > 0）並觸發不可忽略警示引導重退

#### Scenario: 已取消 Payment 預設隱藏 + toggle 顯示

- **GIVEN** Order.payments 含 P-017（cancelled = true）+ P-018（cancelled = false）
- **WHEN** 業務刷新訂單詳情頁 OrderPaymentSection
- **THEN** 列表 SHALL 僅顯示 P-018（預設隱藏已取消）
- **WHEN** 業務點「顯示已取消」toggle 切換為顯示
- **THEN** 列表 SHALL 同時顯示 P-017（含 grey Badge「已取消」+ cancelReason hover tooltip）

#### Scenario: 對帳收款淨額排除已取消 Payment

- **GIVEN** Order.payments 含 P-017（cancelled = true、amount = +5000、paymentStatus = '已完成'）+ P-018（cancelled = false、amount = +3000、paymentStatus = '已完成'）
- **WHEN** 業務開啟對帳面板
- **THEN** 收款淨額 SHALL = 3000（僅計入未取消 + 已完成）
- **AND** 已完成一般收款 breakdown SHALL = 3000

#### Scenario: 多筆退款 Payment 取消其一 OA 仍維持已執行

- **GIVEN** OA-002 amount = -10000、status = '已執行'（核可時已生效）
- **AND** 關聯已完成退款 Payment P-019（amount = -5000）+ P-020（amount = -5000）
- **WHEN** 業務取消 P-019、填入 cancelReason、確認
- **THEN** P-019.cancelled SHALL = true（邏輯刪除）
- **AND** OA-002.status SHALL 維持 '已執行'（不綁 Payment 累計、取消 Payment 不回退）
- **AND** 對帳應退差額 SHALL 重現 5000（收款淨額 − 應收 > 0）並觸發不可忽略警示引導重退

#### Scenario: cancelReason 必填驗證

- **GIVEN** Payment P-021 paymentStatus = '已完成'
- **WHEN** 業務點 P-021「取消」、未填 cancelReason 直接點「確認」
- **THEN** 系統 SHALL 顯示驗證錯誤「取消原因為必填」
- **AND** 系統 SHALL NOT 寫入 cancelled = true
- **AND** P-021 維持 paymentStatus = '已完成'、cancelled = false

### Requirement: 發票品項符合 ezPay 與電子發票法規硬約束

Invoice.items 陣列 SHALL 對齊 ezPay 電子發票 API（[EZP_INVI_1.2.2](../../../memory/Sens_wiki/raw/_attachments/EZP_INVI_1.2.2.pdf)）對品項的五欄結構要求 + 平台檢核硬性條件。法規源頭：財政部電子發票整合服務平台 MIG（Message Implementation Guideline）。詳細規格與印刷業實務衝突點參見 raw 卡 [2026-05-26-miles-upload-ezpay-invoice-api-spec](../../../memory/Sens_wiki/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

每個 InvoiceItem MUST 包含五欄：

| 欄位 | 對應藍新 | 型別 | 必填 | 約束 |
|------|---------|------|------|------|
| `name` | ItemName | 字串 (≤ 30) | Y | 商品名稱 |
| `count` | ItemCount | 整數 (Int(5)) | Y | 純整數 ≤ 99999 |
| `unit` | ItemUnit | 列舉 | Y | 必須來自 `prototype-shared-ui` 的共用單位 LOV（≤ 2 中文字 / ≤ 6 英數字符合 ezPay Varchar(2)）|
| `unitPrice` | ItemPrice | 整數 (Int(10)) | Y | 純整數；B2B 為未稅金額 / B2C 為含稅金額 |
| `itemAmount` | ItemAmt | 整數 (Int(10)) | Y | 系統計算 = `count × unitPrice`，業務不可手動覆寫 |

平台檢核硬性條件（不可違反）：

- `itemAmount = count × unitPrice`（每筆品項皆須成立）
- `Invoice.totalAmount = Invoice.salesAmount + Invoice.taxAmount`（既有規則，與本 change 無關但仍須符合）

#### Scenario: 業務開立發票時五欄全部必填

- **GIVEN** 業務於訂單詳情頁點擊「開立發票」打開 Dialog
- **WHEN** 業務新增一筆品項但未填寫 `count` / `unit` / `unitPrice` 任一欄
- **THEN** 系統 SHALL 顯示該欄位錯誤提示
- **AND** 系統 MUST NOT 允許送出表單

#### Scenario: itemAmount 由系統計算且業務不可手動覆寫

- **GIVEN** 業務輸入 `count = 5`、`unitPrice = 1500`
- **WHEN** 系統渲染品項列
- **THEN** `itemAmount` 欄位 SHALL 自動顯示 `7500`
- **AND** `itemAmount` 欄位輸入框 SHALL 為 disabled 狀態，業務無法手動修改
- **AND** 業務修改 `count` 或 `unitPrice` 時 `itemAmount` SHALL 即時重新計算

#### Scenario: count 純整數且 ≤ 99999

- **GIVEN** 業務於品項列輸入 `count`
- **WHEN** 業務嘗試輸入小數（如 `5.5`）或負數
- **THEN** 系統 SHALL 拒絕輸入並顯示「數量必須為正整數」
- **WHEN** 業務嘗試輸入超過 99999 的值
- **THEN** 系統 SHALL 顯示「數量上限 99999；超量請拆分多筆品項或改用更大單位」

#### Scenario: unitPrice 純整數，前端 lint 擋小數

- **GIVEN** 業務於品項列輸入 `unitPrice`
- **WHEN** 業務嘗試輸入小數（如 `0.5`）
- **THEN** 系統 SHALL 拒絕輸入並顯示「單價必須為正整數；如為小數計價（如每張 0.5 元）建議改用較大單位（如『每千張 500 元』）」
- **AND** 業務修改後系統 SHALL 即時重算 `itemAmount`

#### Scenario: unit 來自共用 LOV，dropdown 強制選擇

- **GIVEN** 業務於品項列要選擇 `unit`
- **WHEN** 業務點擊單位欄位
- **THEN** 系統 SHALL 顯示 dropdown，選項來自 [`prototype-shared-ui` § 共用單位 LOV](../prototype-shared-ui/spec.md)
- **AND** 業務 SHALL NOT 自由輸入文字（防止填入超出 ezPay Varchar(2) 限制的值）

#### Scenario: unitPrice label 依 Category 切換稅基提示

- **GIVEN** 業務於 Dialog 選擇 `category = B2B`
- **WHEN** 系統渲染品項列 `unitPrice` 輸入框
- **THEN** label SHALL 顯示「單價（未稅）」
- **WHEN** 業務切換 `category = B2C`
- **THEN** label SHALL 即時切換為「單價（含稅）」
- **AND** 已輸入的 `unitPrice` 值 SHALL NOT 自動換算（業務需手動確認金額重新填入）

### Requirement: BillingInstallment 品項鏈式預填

業務 / 諮詢建立 BillingInstallment 時 SHALL 可從訂單印件清單預填 `items[]`，使用者可編輯預填內容；後續訂單印件異動 SHALL NOT 即時連動至已建立的 BillingInstallment。實際開立 Invoice 時，由 BillingInstallment 「一鍵開立」觸發 SHALL 將 BillingInstallment.items 深拷貝預填至 Invoice.items，使用者可編輯（與本 spec § Requirement: 請款期次行為規則 › 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承 的繼承品項規則一致）。

#### Scenario: 建立 BillingInstallment 時從訂單印件預填 items

- **GIVEN** 訂單包含 3 筆印件（PrintItem A 數量 1000 張、B 數量 5000 張、C 數量 500 本）
- **WHEN** 業務點擊「新增請款期次」打開 Dialog
- **THEN** 系統 SHALL 預填 3 筆 InvoiceItem 候選（name = 印件名稱、count = 印件數量、unit = 印件單位、unitPrice = 印件未稅單價、itemAmount 自動計算）
- **AND** 業務 SHALL 可勾選 / 取消勾選候選項，或編輯任一欄位
- **AND** 業務 SHALL 可手動新增不對應印件的品項（如「製版費」「運費」）

#### Scenario: 印件異動不連動到已建立的 BillingInstallment

- **GIVEN** BillingInstallment BI-001 已從印件 A 預填（count = 1000）
- **WHEN** 業務將印件 A 的數量改為 2000
- **THEN** 系統 SHALL NOT 修改 BI-001.items 中的 count 值
- **AND** BI-001.items 維持原預填內容
- **AND** UI 在 BillingInstallment 編輯介面 SHALL 顯示 hint「品項複製自訂單印件，後續異動需手動同步」

#### Scenario: Invoice 一鍵開立沿用 BillingInstallment items

- **GIVEN** BillingInstallment BI-001 已規劃 items 含 3 筆品項
- **WHEN** 業務點擊「一鍵開立」按鈕
- **THEN** 系統 SHALL 開啟開立發票 Dialog，items 區塊預填 BI-001.items 全部 3 筆內容（深拷貝）
- **AND** 業務 SHALL 可編輯任一品項欄位或新增 / 移除品項
- **AND** 開立完成後 Invoice.items 為業務最終確認的內容（非 BI-001.items 原值，深拷貝原則沿用 v1.13）

#### Scenario: 手動建立品項（期次未從印件預填時）

- **GIVEN** 業務新增 BillingInstallment 時未從訂單印件預填（手動填品項）
- **WHEN** 系統渲染品項區塊
- **THEN** 系統 SHALL 顯示空品項列 + 「新增品項」按鈕
- **AND** 業務 SHALL 手動逐筆輸入品項；如需印件預填應於建立 BillingInstallment 時使用「從訂單印件帶入」候選功能

### Requirement: 請款期次（BillingInstallment）統一實體

系統 SHALL 提供「請款期次（BillingInstallment）」作為訂單應收的單一規劃實體，合併原本「付款計畫（PaymentPlan）」與「預計發票（PlannedInvoice）」雙頭維護。每筆 BillingInstallment 同時承載：應收日、預計金額、預計開票日、品項、備註、雙維度狀態（開票/收款獨立）、來源類型（source_type）、原始日期凍結基準、變更歷史。業務於訂單成立後（status = 報價待回簽 / 訂單確認）建立一筆或多筆 BillingInstallment 規劃分期請款，建立期間各期金額合計 SHALL 等於 Order.total_with_tax + Σ 已執行 OrderAdjustment.amount（補收進期次、退款不進期次的不對稱規則，違反時系統 SHALL 顯示警示但允許儲存）。

#### Scenario: 業務建立兩期請款期次（取代 PaymentPlan + PlannedInvoice 雙建立流程）

- **GIVEN** 訂單成立後總額 100000
- **WHEN** 業務點「新增請款期次」、建立 BillingInstallment(installment_no=1, description=「訂金」, scheduled_amount=30000, due_date=2026-06-01, expected_invoice_date=2026-05-15, items=[訂金品項]) + BillingInstallment(installment_no=2, description=「尾款」, scheduled_amount=70000, due_date=2026-07-01, expected_invoice_date=2026-06-30, items=[尾款品項])
- **THEN** 系統 SHALL 建立兩筆 BillingInstallment 紀錄，各自 invoicing_status = 未開立、payment_status = 未收
- **AND** 系統 MUST NOT 另外建立 PaymentPlan / PlannedInvoice 紀錄（雙實體已棄用）
- **AND** 兩筆 BillingInstallment.scheduled_amount 合計 = 100000 = Order.total_with_tax

#### Scenario: 期次合計與應收總額不符時警示但允許儲存（沿用既有 L915 規則）

- **GIVEN** 訂單總額 100000 + 已執行 OA(+5000 加印追加)，應收 = 105000
- **WHEN** 業務建立 BillingInstallment 合計只填 100000（少 5000）
- **THEN** 系統 SHALL 顯示警示「應收 105000、期次合計 100000、差額 5000」
- **AND** 系統 SHALL 允許儲存（業務後續可補建 BillingInstallment 或調整既有期次金額）

### Requirement: 請款期次（BillingInstallment）行為規則

**期次↔發票 1:1 嚴格約束 + 一鍵開票繼承**

每張 Invoice MUST 透過 `source_billing_installment_id` NOT NULL UNIQUE FK 指向唯一一筆 BillingInstallment。業務在 BillingInstallment「一鍵開票」時，系統 SHALL 建立 Invoice 並從來源期次自動繼承品項、應收日、備註；Invoice.source_billing_installment_id 寫入該期次 id、BillingInstallment.linked_invoice_id 寫入新 Invoice id、BillingInstallment.invoicing_status 推進為「已開立」。原 v1.13「業務從 PlannedInvoice 一鍵開立」入口廢止，取代為「從 BillingInstallment 一鍵開立」。

#### Scenario: 業務從期次一鍵開立發票繼承品項

- **GIVEN** BillingInstallment BI-001（scheduled_amount=30000, expected_invoice_date=2026-05-15, items=[訂金品項], invoicing_status=未開立）
- **WHEN** 業務點 BI-001「一鍵開立發票」
- **THEN** 系統 SHALL 建立 Invoice INV-001（total_amount=30000, items=深拷貝自 BI-001.items, source_billing_installment_id=BI-001.id, status=開立）
- **AND** 系統 SHALL 寫入 BI-001.linked_invoice_id = INV-001.id、BI-001.invoicing_status = 已開立
- **AND** 業務 MAY 在開立 dialog 內微調品項（不影響 BI-001.items，深拷貝原則沿用 v1.13）

#### Scenario: 期次↔發票 1:1 約束阻擋重複開票

- **GIVEN** BillingInstallment BI-002.invoicing_status = 已開立、linked_invoice_id = INV-002
- **WHEN** 業務再次點 BI-002「一鍵開立發票」
- **THEN** 系統 SHALL 隱藏「一鍵開立」按鈕（按鈕只在 invoicing_status = 未開立 / 已作廢 顯示）

**拆票 = 拆期（產生獨立平輩期次 + 純追溯欄位）**

業務於 BillingInstallment 列表編輯動作或開立發票 Dialog 內按「拆此期」捷徑時，系統 SHALL 將原期次拆為兩個獨立平輩期次。原期次設 cancelled = true 保留稽核軌跡（不物理刪除）；兩筆新期次各自獨立 query / aggregation（無父子 hierarchical FK），但**保留** `split_from_installment_id` 純追溯欄位指向原期次 id 用於 CSV 諮詢取消半額退費 lineage 稽核與 source_type 繼承。新期次 source_type 繼承原期次（manual / consultation_cancellation 等），note 自動帶「原一期拆兩期，源期次描述：「{原 description}」」前綴。

#### Scenario: 業務在規劃階段拆票（一期 78000 拆兩張票各 2500 + 75500）

- **GIVEN** BillingInstallment BI-010（installment_no=1, scheduled_amount=78000, source_type=manual, invoicing_status=未開立）
- **WHEN** 業務於期次列表點 BI-010「拆此期」，輸入拆分規格（期A 2500 / 期B 75500，各自 due_date 業務填）
- **THEN** 系統 SHALL 建立 BillingInstallment BI-010-A（installment_no=新序號, scheduled_amount=2500, source_type=manual, split_from_installment_id=BI-010.id, note=「原一期拆兩期，源期次描述：「[原 description]」」）+ BI-010-B（scheduled_amount=75500, 同上欄位）
- **AND** 系統 SHALL 設定 BI-010.cancelled = true、cancel_reason = 「拆兩期」（保留稽核，UI 預設隱藏可切換顯示）
- **AND** 兩筆新期次 change_count 從 0 起算（拆期事件本身寫入 OrderActivityLog SPLIT 事件作為稽核依據，不計入 change_count）

#### Scenario: 業務在開票 Dialog 內動態拆票

- **GIVEN** 業務在 BI-011「一鍵開立發票」Dialog 內、客戶臨時要求拆兩張票
- **WHEN** 業務於 Dialog 內按「拆此期」捷徑、輸入兩期金額與日期
- **THEN** 系統 SHALL 執行同「規劃階段拆票」邏輯（產生 BI-011-A + BI-011-B、原期次 cancelled = true）
- **AND** Dialog SHALL 切換至「選擇對哪筆新期次開票」step、業務選定後完成開票（單一 Dialog 流程內完成拆 + 開）

**期次變更稽核軌跡（原始日期凍結基準 + 變更歷史 + 變更次數）**

每筆 BillingInstallment SHALL 凍結 `original_due_date` 與 `original_expected_invoice_date` 兩個基準欄位（於期次首次儲存當下凍結，之後變更不影響）。每次 due_date / expected_invoice_date 變更 SHALL 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED）含 old_value / new_value / operator / timestamp。`change_count` derived field 統計該期次 due_date + expected_invoice_date 兩欄位變更累計次數（拆期事件不計入）。UI 顯示「原始 vs 現況」對照 + 變更次數，作為業務操作穩定性的事後稽核依據（沿用顧問 §1 + CEO 指標 4）。

#### Scenario: 業務修改期次預計開票日寫入變更歷史

- **GIVEN** BillingInstallment BI-020（original_due_date=2026-06-01, due_date=2026-06-01, original_expected_invoice_date=2026-05-15, expected_invoice_date=2026-05-15, change_count=0）
- **WHEN** 業務修改 BI-020.expected_invoice_date 從 2026-05-15 改為 2026-05-20
- **THEN** 系統 SHALL 寫入 OrderActivityLog EXPECTED_DATE_CHANGED 事件（old_value=2026-05-15, new_value=2026-05-20, operator=業務 user_id, timestamp=now）
- **AND** BI-020.change_count SHALL = 1
- **AND** BI-020.original_expected_invoice_date SHALL 維持 2026-05-15（凍結基準不變）
- **AND** UI 顯示「原始預計開立日：2026-05-15 ｜ 現況：2026-05-20（業務於 [日期] 調整）｜ 本期變更次數 1」

**期次雙維度狀態（開票維度 + 收款維度獨立）**

BillingInstallment SHALL 維護兩個獨立狀態維度：
- **開票維度（invoicing_status）**：`未開立` → `已開立`（業務一鍵開票觸發）；`已開立` → `已作廢`（Invoice 作廢觸發，linked_invoice_id 設 NULL，可重新開票）
- **收款維度（payment_status，derived）**：依未取消已完成 PaymentAllocation 累計推導
  - 累計 = 0：未收
  - 0 < 累計 < scheduled_amount：部分收款
  - 累計 ≥ scheduled_amount：已收訖

兩維度完全獨立，支援「先收後開」（收款維度先到已收訖、開票維度仍未開立）與「先開後收」（開票維度先到已開立、收款維度仍未收）情境。

#### Scenario: 先收後開情境 — 業務先收訂金 30000 後再開票

- **GIVEN** BillingInstallment BI-030（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收）
- **WHEN** 業務登錄 Payment 30000、於入帳明細手動勾選 BI-030 填 30000（PaymentAllocation.allocated_amount=30000、auto_allocated=false）、業務切 Payment 為已完成
- **THEN** BI-030.payment_status SHALL = 已收訖（payment 維度已推進）
- **AND** BI-030.invoicing_status SHALL = 未開立（開票維度仍未推進）
- **WHEN** 業務於 BI-030 點「一鍵開立發票」
- **THEN** BI-030.invoicing_status SHALL = 已開立（兩維度均推進完成）

#### Scenario: 發票作廢後期次回未開立可重新開票

- **GIVEN** BI-031.invoicing_status = 已開立、linked_invoice_id = INV-031
- **WHEN** 業務於 Invoice 詳情頁作廢 INV-031（填入作廢原因）
- **THEN** 系統 SHALL 設定 INV-031.status = 作廢
- **AND** BI-031.invoicing_status SHALL → 已作廢、linked_invoice_id 設 NULL
- **AND** BI-031.payment_status SHALL 不受影響（保留稽核）
- **AND** 業務 MAY 於 BI-031 重新點「一鍵開立發票」建立新 Invoice INV-031'

### Requirement: 收款核銷分配（PaymentAllocation 業務手動入帳）

業務登錄一筆 Payment（amount > 0、paymentMethod ∈ 一般收款）時，系統 SHALL 於「新增收款」Dialog 內 inline 顯示該訂單所有未取消收款項目（BillingInstallment where cancelled = false），不需先填收款金額即顯示。業務 SHALL 勾選要入帳的收款項目並逐筆手動填入帳金額（PaymentAllocation.allocated_amount）。系統 SHALL NOT 自動依序填滿、SHALL NOT 提供「自動回填差額」按鈕——入帳金額由業務全手動決定（Miles 拍板）。

校驗（防呆）：系統 SHALL 即時校驗「勾選入帳金額合計 ≤ Payment.amount」，超過時 Input 紅標 + 禁止送出並提示「入帳合計不可大於收款金額」。允許合計 < Payment.amount（溢收場景）：剩餘金額 SHALL 自動記為「預收（未分配）」桶（PaymentAllocation.billing_installment_id = NULL）。

PaymentAllocation 的 auto_allocated / manually_overridden 欄位於業務手動入帳模型下恆為 false（無系統自動預設值可供覆寫），保留為相容欄位；變更率類指標 MUST NOT 依「覆寫事件」計算（見 § 訂單收款變更率指標）。Payment 切「已完成」時系統 SHALL 觸發各對應 BillingInstallment 收款維度狀態（payment_status）依累計已完成入帳金額推導（未收 / 部分收款 / 已收訖）。

#### Scenario: 一筆 Payment 業務手動入帳兩期

- **GIVEN** 訂單兩筆未收期次：BI-040（scheduled_amount=30000, due_date=2026-06-01）+ BI-041（scheduled_amount=70000, due_date=2026-07-01）
- **WHEN** 業務於「新增收款」Dialog 填 Payment P-040（amount=100000, paymentMethod=銀行轉帳），於入帳明細勾選 BI-040 填 30000、勾選 BI-041 填 70000
- **THEN** 系統 SHALL 校驗入帳合計 100000 = Payment.amount（PASS）並建立兩筆 PaymentAllocation（PA-040a → BI-040 allocated 30000、PA-040b → BI-041 allocated 70000；auto_allocated=false、manually_overridden=false）
- **AND** 業務切 P-040 為已完成後，BI-040.payment_status 與 BI-041.payment_status SHALL 均推進至「已收訖」

#### Scenario: 業務只入帳部分金額（某期部分收款）

- **GIVEN** 訂單兩筆未收期次：BI-050（scheduled_amount=3000）+ BI-051（scheduled_amount=2000）
- **WHEN** 業務登錄 Payment 4000，勾 BI-050 填 3000、勾 BI-051 填 1000
- **THEN** 系統 SHALL 校驗入帳合計 4000 = Payment.amount（PASS）並建立兩筆 PaymentAllocation（BI-050 allocated 3000、BI-051 allocated 1000）
- **AND** 業務切 Payment 為已完成後，BI-050.payment_status = 已收訖（累計達 3000）、BI-051.payment_status = 部分收款（累計 1000 < 2000）

#### Scenario: 入帳合計超過收款金額被擋（防呆）

- **GIVEN** 業務登錄 Payment 5000
- **WHEN** 業務勾 BI-050 填 3000、勾 BI-051 填 3000（合計 6000 > 5000）
- **THEN** 系統 SHALL 將超額 Input 紅標 + 禁止送出，提示「入帳合計不可大於收款金額」

#### Scenario: 溢收標記為「預收（未分配）」桶

- **GIVEN** 訂單兩筆未收期次合計 5000，業務登錄 Payment 6000
- **WHEN** 業務勾兩期入帳合計 5000（剩 1000 未指定收款項目）
- **THEN** 系統 SHALL 額外建立 PaymentAllocation（billing_installment_id=NULL, allocated_amount=1000）作「預收（未分配）」桶
- **AND** 預收桶後續業務可手動核銷至新期次或退款處理（後續路徑見 OQ-BI-C）

### Requirement: 補收 OA 規則（免審 + 大額監督）

**免審直達已執行**

系統 SHALL 依 amount 正負與 adjustment_type 自動判定 OA 是否需業務主管審核：補收正項 OA（amount > 0 且 adjustment_type ∈ 五項補收 type）SHALL 跳過「待主管審核」與「已核可」中間態直達「已執行」狀態（approved_by = 業務 user_id、executed_at = now、應收 +N 立即認列）。

OrderAdjustment `requires_supervisor_approval` derived field：
- amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項} → false（補收正項）
- amount < 0 → true（退款負項）
- adjustment_type = 諮詢取消退費（系統內生）→ false

**OA「已執行」語意統一**：補收與退款 OA 的「已執行」一致定義為「核可後應收調整生效」（不綁 Payment 切已完成累計達標）。補收 OA 核可 = 建立即執行（免審）、應收即時 +N。此語意取代舊「退款 OA 已執行需綁 Payment 累計達 OA.amount」（退款 OA 改同此語意，見 § 退款 OA Requirement）。

補收 OA 主要適用訂單完成後對客戶加收（完成前增項走明細直接改、不建 OA）。

#### Scenario: 業務建立加印追加補收 OA 立即執行（訂單完成後）

- **GIVEN** 訂單已完成、客戶要求補印 +8000（客戶承擔）
- **WHEN** 業務於 AfterSalesTicket 內建立 OA-060（amount=+8000, adjustment_type=加印追加）並點「儲存並執行」
- **THEN** 系統 SHALL 設定 requires_supervisor_approval = false、OA-060.status 直接 = 已執行（approved_by=業務, executed_at=now）
- **AND** 應收 SHALL 立即 +8000
- **AND** 對帳面板 SHALL 顯示「應收 > 期次規劃」差額、引導業務建 / 併期次

**大額閾值監督**

當補收 OA 建立時，若 amount > 大額閾值（建議起始 50000，實際值待 OQ-BI-4 Miles 拍板）SHALL 觸發以下事後監督：
- OrderActivityLog 寫入紅色標記事件（high_amount_supplementary_charge）
- Slack 自動通知該訂單業務主管「業務 [name] 建立大額補收 OA +N 元於訂單 [order_no]」
- 業務主管 MAY 事後審查、發現異常時與業務溝通修正（不阻擋業務操作）

#### Scenario: 業務建立超閾值補收 OA 觸發 Slack 通知

- **GIVEN** 大額閾值設為 50000（系統設定值）
- **WHEN** 業務建立 OA-061（amount=+60000, adjustment_type=規格變更）並執行
- **THEN** OA-061.status SHALL = 已執行（仍立即執行、不阻擋）
- **AND** 系統 SHALL 寫入 OrderActivityLog 紅標事件 high_amount_supplementary_charge
- **AND** 系統 SHALL 透過 Slack 推送通知至業務主管：「業務 [name] 建立大額補收 OA +60000 元於訂單 [order_no]」

### Requirement: 三方對帳警示 banner（期次規劃 invariant）

訂單 SHALL 維護以下 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`。違反時對帳檢視（OrderReconciliationPanel）SHALL 顯示警示 banner「OA 已執行 N 元、但未對應期次規劃」+ action button「建立期次」，讓業務一鍵新增期次承載該補收金額。本警示為提示性質、不阻擋業務後續操作（沿用既有警示而非阻擋的設計精神）。

#### Scenario: 補收 OA 已執行但未建期次觸發警示

- **GIVEN** 訂單應收 = 印件費 100000 + OEC 0 + 已執行 OA(+8000) = 108000
- **AND** Σ BillingInstallment.scheduled_amount where cancelled=false = 100000（業務未補建期次）
- **WHEN** 業務或會計查看 OrderReconciliationPanel
- **THEN** 系統 SHALL 顯示警示 banner「OA 已執行 +8000、但未對應期次規劃（差額 8000）」
- **AND** banner SHALL 含 action button「建立期次」、點擊後開啟 BillingInstallment 新建 Dialog 預填 scheduled_amount=8000

### Requirement: 退款 OA（負項）沿用業務主管核可 + 不進期次

退款負項 OA（amount < 0）SHALL 沿用業務主管核可把關（現金流出強把關），但「已執行」語意改為「核可後應收調整生效」（與補收對稱、不綁 Payment 累計達標）：

- requires_supervisor_approval = true
- 狀態流轉：草稿 → 待主管審核 → 已核可（業務主管核可）→ **已執行（核可後應收調整生效，系統自動推進、不等退款 Payment）**
- **[訂單收退款模型重構移除]** 舊「業務建退款 Payment 切已完成 → 累計達 OA.amount 才推進已執行」推進綁定 **移除**；OA 已執行不再等退款 Payment。
- **[訂單收退款模型重構移除]** 舊「取消已完成 Payment 致累計不足回退 OA 至已核可」回退機制 **移除**（不再有「累計達標」概念，見 [ORD-003](../../../memory/Sens_wiki/wiki/erp/08-open-questions/ORD-003-取消退款Payment是否回退OA.md) 取代）。
- **退款現金動作**：業務於 OA 介面或對帳面板建退款 Payment（amount < 0, paymentMethod=退款, `linkedOrderAdjustmentId` 選填）、上傳匯款證明、切「已完成」核銷應退差額；**退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次）。
- **退款完成判定** = 退款 Payment 切「已完成」（物理錨點）；對帳應退差額歸零為結果呈現。
- 誤建退款 Payment 修正：取消退款 Payment → 應退差額重新出現 → 對帳差額警示引導重退（OA 已執行 / 應收已調整維持不動）。
- 發票端（免審核，退款 OA 已核可即批准）：未跨月作廢原 Invoice 重開；已跨月開立 SalesAllowance 折讓關聯原 Invoice（折讓不關聯退款 Payment）。
- BillingInstallment 不受退款影響（保留正向期次稽核歷史）。

#### Scenario: 訂單完成後售後退款（核可即生效 + 退款核銷差額）

- **GIVEN** 訂單已完成、應收 80000、已開發票 80000、已收訖 80000
- **WHEN** 業務建立 AfterSalesTicket + 內建退款 OA-070（amount=-10000, adjustment_type=退印）並送審
- **THEN** OA-070.status = 待主管審核
- **WHEN** 業務主管核可
- **THEN** OA-070.status SHALL 直接 = 已執行（核可即生效）、應收 SHALL = 70000（不等退款 Payment）
- **AND** 對帳面板 SHALL 顯示「收款淨額(80000) > 應收(70000) 應退差額 10000」
- **WHEN** 業務建退款 Payment P-070(amount=-10000, linkedOrderAdjustmentId=OA-070.id)、上傳匯款證明、切已完成
- **THEN** 收款淨額 = 70000、應退差額歸零（退款完成）
- **AND** P-070 MUST NOT 建 PaymentAllocation
- **WHEN** 已跨月：業務於原發票建 SalesAllowance(-10000)
- **THEN** 發票淨額 = 70000、三軸平

#### Scenario: 取消退款 Payment 後差額重現（無回退機制）

- **GIVEN** 退款 OA-070 已執行（應收已 -10000）、退款 Payment P-070 已完成
- **WHEN** 業務取消 P-070（發現匯款金額打錯）
- **THEN** OA-070 SHALL 維持「已執行」（應收維持已調整 -10000、不回退）
- **AND** 對帳面板 SHALL 重新出現「應退差額 10000」、引導業務重建退款 Payment

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

廢止 v1.13 spec L951「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則。**BREAKING**：BillingInstallment 變更（新增 / 修改 / 拆期 / 取消）SHALL NOT 觸發訂單回審，改為 ActivityLog 留軌跡 + change_count derived 供事後稽核。

#### Scenario: 業務修改期次日期不再觸發回審

- **GIVEN** BillingInstallment BI-080.due_date = 2026-06-01、訂單已過業務主管審核進入製作中
- **WHEN** 業務修改 BI-080.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-080.change_count SHALL = 1
- **AND** 訂單狀態 SHALL 維持「製作中」（不回退至「業務主管審核」）

### Requirement: 對帳 CSV 匯出（14 欄定稿）

會計 SHALL 可於對帳模組匯出 14 欄對帳 CSV，一列 = 一張已開立發票（status = 開立、不含作廢）。每欄資料來源：

| # | 欄位 | 來源 |
|---|------|------|
| 1 | 帳務公司 | Invoice.billing_company → BillingCompany.name |
| 2 | 發票號碼 | Invoice.invoice_number |
| 3 | 訂單編號 | Order.order_no |
| 4 | 案名 | Order.case_name |
| 5 | 開立日期 | Invoice.issued_at |
| 6 | 應收日期 | 繼承來源期次 Invoice.source_billing_installment_id → BillingInstallment.due_date（現況值，非 original） |
| 7 | 客戶名稱 | Order.customer_name |
| 8 | 總金額(含稅) | Invoice.total_amount（發票面額，不扣折讓） |
| 9 | 備註 | 繼承來源期次 BillingInstallment.note |
| 10 | 收款日期 | derived（透過 Invoice → BillingInstallment → PaymentAllocation → Payment.paidAt）|
| 11 | 收款狀態 | derived（依 BillingInstallment.payment_status 推導：未收/部分/已收訖） |
| 12 | 業務名稱 | Order.sales_id → User.name |
| 13 | 開立日期月底 | EOM(Invoice.issued_at) 計算結果 |
| 14 | 天數 | #6 - #5（應收日 − 開立日，正值代表給客戶的帳期 Net N） |

#### Scenario: 會計匯出當月對帳 CSV

- **WHEN** 會計於對帳模組點「匯出當月對帳 CSV」、選擇日期範圍 2026-05-01 ~ 2026-05-31
- **THEN** 系統 SHALL 列出所有 Invoice.status=開立 且 Invoice.issued_at IN 範圍的發票紀錄
- **AND** 每張發票一列，14 欄資料依上表填寫
- **AND** Invoice.status=作廢 的發票預設不列入（OQ-BI-G 待會計實務反饋擴充篩選 UI）
- **AND** CSV 檔案格式 UTF-8 with BOM（對應 Excel 開啟中文不亂碼）

#### Scenario: 已部分收款發票的 CSV 收款日與狀態

- **GIVEN** INV-090（total_amount=70000）已收 40000（PaymentAllocation 1 = 25000 paid_at=2026-05-10 + PaymentAllocation 2 = 15000 paid_at=2026-05-25）
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-090 對應 row 第 10 欄收款日 = 最近收款日 2026-05-25（OQ-BI-D 待 Miles 拍板「最近 vs 結清」）
- **AND** 第 11 欄收款狀態 = 部分收款

#### Scenario: 先開後收尚未收款發票的 CSV

- **GIVEN** INV-091（issued_at=2026-05-20, total_amount=50000, source_billing_installment_id=BI-091）+ BI-091.payment_status=未收
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-091 對應 row 第 10 欄收款日 = 空（未收款）
- **AND** 第 11 欄收款狀態 = 未收

### Requirement: 營運管理 KPI 定義（收款 / 開票）

系統 SHALL 提供以下「營運管理 KPI」供業務主管管理組員收款績效、業務 / 會計檢視自身達成度。這些是**營運管理指標（管理組員 KPI）**，非產品成功指標（NSM / 衡量功能成不成功），亦非產品機制指標（如已移除的「業務手動覆寫率」——衡量自動分配演算法預設準不準，業務手動入帳後失去意義）。判斷錨點：每個指標皆能回答「誰、在什麼情境看、用來管理誰」。

閾值為起始建議值，SHALL 標「上線前 / 累積實務數據後校準」，prototype 階段不當硬規則。

**KPI 總表**

| KPI | 定義 | 公式（as-built 實體）| 看的人 / 管理場景 | 健康 / 警示（暫定）| 詳細定義位置 |
|-----|------|---------------------|------------------|-------------------|---------|
| 收款達成率 | 該收的錢實收比例 | Σ 已完成入帳金額（PaymentAllocation where Payment 已完成、扣已完成退款）÷ Σ 應收期次金額（BillingInstallment.scheduled_amount where !cancelled 且 due_date ≤ 區間末）| 業務看自己、主管月會排名 | ≥ 95% / < 85% | 本 Requirement |
| 訂單異動率 | 成立後又改金額 / 退補比例（反映前期報價品質）| count(有非系統內生 OrderAdjustment 的訂單) ÷ count(該業務該期間成立訂單)；可拆補收 / 退款子率 | 業務看自己、主管看誰常事後補退 | < 15% / > 30%（退款子率 > 10% 須檢討報價）| 本 Requirement |
| 對帳差錯率 | 三方（應收 / 發票 / 收款）對不起來的訂單比例 | count(應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額 的訂單) ÷ count(該期間有應收 / 已開票訂單)| 會計月結追、主管看自己組 | = 0% / > 0% 即列管 | § 三方對帳警示 banner（期次規劃 invariant）|
| 逾期收款率 | 過應收日未收金額占比（含 30 / 60 / 90 帳齡）| Σ scheduled_amount（BillingInstallment where 收款維度 ≠ 已收訖 且 overdue_days > 0）÷ Σ scheduled_amount（!cancelled 期次）| 業務看自己、主管催收盯人 | < 5% / > 15%（90 天以上單獨列管）| § 收款逾期天數（overdue_days）|
| 預收未沖比例 | 溢收預收桶掛著沒沖 / 沒退金額 | Σ allocated_amount（PaymentAllocation where billing_installment_id = NULL）÷ Σ 已完成入帳金額（或看絕對金額 + 筆數）| 業務 / 會計收尾 | 趨近 0 / 單筆 > 30 天未處理 | 本 Requirement |
| 開票及時率 | 該開的票有沒有在預計開票日前開出 | count(已開立且 Invoice.issued_at ≤ expected_invoice_date 的期次) ÷ count(已過 expected_invoice_date 的期次)| 業務 / 會計月結看漏開 | ≥ 95% / < 80% | 本 Requirement |
| 收款變更率 | 業務對款項操作的穩定性 | 見 § 收款變更率詳細定義 | 主管看誰老改期次 / 入帳明細 | 待校準 | § 收款變更率詳細定義 |

平均收款天數（DSO）列為次要——偏經營趨勢指標、受客戶帳期影響非業務全可控，**定義保留、視覺化後驗 dashboard epic、不在本批實作**（依 MEMORY「核心流程完成前不規劃 dashboard 類功能」）。實作優先序：收款達成率 / 訂單異動率 / 對帳差錯率 / 逾期收款率為第一批，其餘第二批（非「效益低砍掉」，是分批落地）。

#### Scenario: 業務主管月會看組員收款達成率

- **GIVEN** 業務 A 本月應收期次合計 1,000,000、已完成入帳 920,000
- **WHEN** 業務主管於月會檢視收款達成率
- **THEN** 業務 A 收款達成率 SHALL = 92%（低於 95% 健康線，主管關注）

#### Scenario: 移除產品機制指標「業務手動覆寫率」

- **GIVEN** unify-billing change 曾定義「業務手動覆寫率」衡量系統依序填滿預設被業務改的比例
- **WHEN** 入帳機制改為業務手動（無系統自動預設值可供覆寫）
- **THEN** 「業務手動覆寫率」SHALL 移除（無可覆寫的自動值、且非營運管理 KPI）

**收款變更率詳細定義**

系統 SHALL 統計每張訂單的「收款變更率」derived 指標（營運管理 KPI——業務主管管理組員操作穩定性用），用於業務主管月會檢視業務對訂單款項操作的整體穩定性。
- **公式**：每張訂單 = sum(該訂單期次與入帳相關修改事件次數)；業務層級彙總 = 該業務訂單的平均每訂單修改次數（不再除以 Payment 數——Payment 數無營運管理意義）
- **修改事件涵蓋**：DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED + SPLIT + CANCELLED + PAYMENT_ALLOCATION_SET（業務手動建立 / 修改入帳明細；取代已廢自動分配模型的 PAYMENT_ALLOCATION_OVERRIDDEN + PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE 兩事件）；BILLING_INSTALLMENT_CREATED 不計入
- **與既有 BillingInstallment.change_count 差異**：change_count 是期次層級變更頻率、本指標是訂單層級整體收款相關修改頻率（含期次調整 + 入帳明細修改兩類）

#### Scenario: 計算訂單收款變更率

- **GIVEN** 某訂單有 5 個期次與入帳相關修改事件（2 個 DUE_DATE_CHANGED + 1 個 SPLIT + 2 個 PAYMENT_ALLOCATION_SET）
- **WHEN** 系統計算該訂單收款變更率
- **THEN** 該訂單修改次數 = 5；業務層級彙總 = 該業務所有訂單修改次數平均
- **AND** 健康範圍待累積實務數據後校準（暫不設警示閾值）

**諮詢退款 OA 排除規則**

收款變更率指標分子（修改事件：DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / PAYMENT_ALLOCATION_SET）SHALL NOT 含任何 OrderAdjustment 事件。故諮詢取消退費 OA（系統內生）及其金額調整天然不計入收款變更率分子，**無需新增排除規則**（公式本就不含 OA 事件，CEO「排除諮詢退款 OA」需求為 no-op）。

**設計理由**：收款變更率量測「業務對自己規劃的收款計畫（BillingInstallment / PaymentAllocation）改了幾次」的操作穩定性；OrderAdjustment 是獨立金額異動實體、非收款計畫操作，本就不在分子。諮詢退款 OA 由系統內生、更非業務主動操作，計入會污染指標語意。

#### Scenario: 諮詢退款 OA 建立與調整不影響收款變更率

- **GIVEN** 諮詢取消自動建退款 OA(-1000, 已核可) + 業務後續調整其金額
- **WHEN** 系統計算該訂單收款變更率
- **THEN** 諮詢退款 OA 的建立與金額調整 MUST NOT 計入收款變更率分子（分子僅含 6 種 BillingInstallment / PaymentAllocation 修改事件）

**收款逾期天數（overdue_days）**

overdue_days 欄位定義見 § 應收帳款帳齡底層欄位與訂單列表帳齡篩選。

訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 BillingInstallment 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）+ 逾期自動通知 + 應收帳款 Dashboard 不在本 change 範疇。

#### Scenario: BillingInstallment 逾期天數自動計算

- **GIVEN** BillingInstallment BI-100.payment_status = 未收、due_date = 2026-04-01
- **WHEN** 系統於 2026-05-06 顯示 BI-100
- **THEN** BI-100.overdue_days SHALL = 35

#### Scenario: 已收訖 BillingInstallment 不算逾期

- **GIVEN** BI-101.payment_status = 已收訖、due_date = 2026-04-01
- **WHEN** 系統顯示 BI-101
- **THEN** BI-101.overdue_days SHALL = NULL

### Requirement: OrderActivityLog 擴充 6 個事件型別

OrderActivityLog SHALL 新增以下 6 個事件型別記錄 BillingInstallment 與 PaymentAllocation 的稽核軌跡：

| 事件型別 | 觸發時機 | 記錄欄位 |
|---------|---------|---------|
| BILLING_INSTALLMENT_CREATED | 新建 BillingInstallment | operator / timestamp / billing_installment_id / scheduled_amount / source_type |
| DUE_DATE_CHANGED | 修改 BillingInstallment.due_date | operator / timestamp / billing_installment_id / old_value / new_value |
| EXPECTED_DATE_CHANGED | 修改 BillingInstallment.expected_invoice_date | 同上 |
| SPLIT | 拆期（原期次 cancelled=true + 建兩筆新期次）| operator / timestamp / original_installment_id / new_installment_ids[] / split_spec |
| CANCELLED | 期次取消（cancelled = true）| operator / timestamp / billing_installment_id / cancel_reason |
| PAYMENT_ALLOCATION_SET | 業務手動建立 / 修改收款入帳明細（取代已廢自動分配模型的 PAYMENT_ALLOCATION_OVERRIDDEN + PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE 兩事件）| operator / timestamp / payment_allocation_id / payment_id / billing_installment_id / allocated_amount |

#### Scenario: 拆期觸發 SPLIT 事件 + 兩個 BILLING_INSTALLMENT_CREATED 事件

- **WHEN** 業務拆 BI-110 為 BI-110-A + BI-110-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件（original_installment_id=BI-110.id, new_installment_ids=[BI-110-A.id, BI-110-B.id], split_spec=「2500/75500 各自 due_date」）
- **AND** 系統 SHALL 寫入兩筆 BILLING_INSTALLMENT_CREATED 事件（各新期次一筆）

### Requirement: 收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導

系統 SHALL 沿用 v1.13 Payment 主結構，但 paymentPlanId 欄位 SHALL 不再強制必填、不再透過 Payment 直接關聯期次；Payment 與期次的關聯 SHALL 改為透過 PaymentAllocation N:M 推導。

v1.13 既有 Payment Requirement 主體沿用，但 `paymentPlanId` 欄位 **REMOVED**（不再強制必填、不再透過 Payment 直接關聯期次）。Payment 與期次的關聯改為透過 PaymentAllocation N:M 推導：sum(PaymentAllocation where payment_id = X).billing_installment_id distinct = Payment 對應的期次清單。

#### Scenario: Payment 不再有 paymentPlanId 欄位

- **WHEN** 業務建立 Payment
- **THEN** Payment 紀錄 MUST NOT 包含 paymentPlanId 欄位
- **AND** 對應期次清單 SHALL 透過 PaymentAllocation 表查詢推導

### Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單

對帳三方差錯偵測 SHALL 涵蓋「`status ∈ {訂單完成, 已取消}` 且該訂單有 `status=開立` 的 Invoice」的訂單，取代既有「限 `status=訂單完成`」篩選。此修訂根治「已取消但有認列收入訂單從對帳差錯偵測消失」的漏帳——包含諮詢取消（留存 1000 收入）+ 一般訂單取消後依實際成本保留部分收入兩種情境。

**範圍界定**：對帳 CSV 匯出層已以「已開立發票」為主軸（一列 = 一張已開立發票、無 order.status 篩選），涵蓋率本就 100%，**不需修改**。本 requirement 針對的是**差錯偵測層**（計算應收 / 發票淨額 / 收款淨額三方差額時的訂單集合篩選）。**推翻 unify-billing（2026-05-28）對帳差錯偵測「限訂單完成」拍板**，補齊其只改一半的對帳主軸修正。

#### Scenario: 諮詢取消訂單納入對帳差錯偵測

- **GIVEN** 諮詢取消後諮詢訂單 status = 已取消、有 status=開立 的諮詢費 Invoice（1000）
- **WHEN** 系統執行三方對帳差錯偵測
- **THEN** 該已取消諮詢訂單 SHALL 被納入偵測集合（不因 status=已取消 被排除）
- **AND** 對帳：應收 1000 = 發票淨額 1000 = 收款淨額 1000，差額 = 0 對帳通過

#### Scenario: 一般訂單取消保留收入納入對帳差錯偵測

- **GIVEN** 一般訂單取消、業務依實際成本退部分款、保留部分收入、有 status=開立 Invoice
- **WHEN** 系統執行三方對帳差錯偵測
- **THEN** 該已取消訂單 SHALL 被納入偵測集合（連帶修一般訂單取消的同類漏帳）

#### Scenario: 已取消但無發票訂單由差額警示涵蓋

- **GIVEN** 諮詢取消後諮詢訂單 status = 已取消、尚未開立任何 Invoice（諮詢人員還沒手動開那 1000 發票）
- **WHEN** 系統執行對帳
- **THEN** 系統 SHALL 透過「應收 > 發票淨額」差額警示提醒未開票（應收 1000 > 發票淨額 0）
- **AND** 此差額警示為廢除「諮詢專屬自動建待開發票」後的未開票兜底提醒機制

### Requirement: 發票金額誤差核銷規則

開立多品項發票時，系統 SHALL 採以下計算規則處理稅額尾差：

1. 每品項各自無條件進位計算含稅金額：
   - 未稅金額 = 品項金額 / 1.05
   - 稅額 = 未稅金額 × 0.05（無條件進位至整數）
   - 含稅金額 = 未稅金額 + 稅額
2. 加總所有品項含稅金額（「品項加總」）
3. 與「總額一次計算」結果比對（總額直接無條件進位）
4. 若品項加總 ≠ 總額：差額（通常為 1 元）SHALL 集中於最後一個品項

**禁止規則**：MUST NOT 將差額平均分攤至所有品項。平均分攤會破壞每品項稅額正確性，違反中華民國稅務規則「每品項分別計算稅額」原則。

#### Scenario: 多品項發票進位差額集中最後品項

- **GIVEN** 發票含三品項：A = 1050、B = 1050、C = 1050（含稅金額）
- **WHEN** 系統依規則計算
- **THEN** 每品項各自計算未稅 = 1000、稅額 = 50、含稅 = 1050
- **AND** 品項加總 = 3150
- **AND** 總額一次計算 = 3150
- **AND** 此例無差額，三品項各自 1050

#### Scenario: 發票進位後差額補於最後品項

- **GIVEN** 發票含三品項：A = 1000、B = 1000、C = 1001（含稅金額）
- **WHEN** 系統依規則計算
- **THEN** 品項加總 = 3001
- **AND** 若品項算法產生差額 1 元
- **AND** 差額 MUST 集中於品項 C，C 顯示 = 1002
- **AND** 品項 A、B MUST 保持原計算值

### Requirement: 退款流程三組件

**三組件組合規則**

實務退款場景 SHALL 由三組件組合構成完整流程，每組件對應獨立 Requirement 與 UI 動作：

1. **訂單異動單 + 業務主管審核**（金額異動審批）：建立訂單異動單記錄退款原因與金額 → 業務主管核可 → 業務執行重算應收
2. **退款款項處理**（金流動作）：業務於訂單詳情頁建立負值收款紀錄，記錄退款金額 / 日期 / 方式
3. **發票異動**（稅務動作）：依發票是否跨齊報稅期選擇開立折讓單（負值，跨期適用）或作廢發票（未跨期適用）

三組件互不重疊：金額異動審批 / 金流動作 / 稅務動作各自獨立可驗證。業務需依場景組合三組件完成完整退款流程。

**禁止簡化**：MUST NOT 用單一動作完成三組件邏輯（例如「點退款」直接同時建立負值收款 + 折讓單）。此禁止規則確保每組件可獨立稽核且符合中華民國稅務規則。

#### Scenario: 完整退款流程三組件組合

- **GIVEN** 訂單已收款 1000、開立發票 1000，客戶提出退款需求
- **WHEN** 業務執行退款流程
- **THEN** 步驟 1：業務建立訂單異動單（金額 -1000，原因「客戶取消」）→ 提交業務主管審核
- **AND** 步驟 2：業務主管核可 → 業務執行 → 應收重算為 0
- **AND** 步驟 3：業務於訂單詳情頁建立負值收款紀錄（-1000）
- **AND** 步驟 4：依發票是否跨齊報稅期選擇開立折讓單或作廢發票
- **AND** 三組件完成後對帳：應收 = 0、收款淨額 = 0、發票淨額 = 0

#### Scenario: 跨齊報稅期退款走折讓單

- **GIVEN** 退款場景發票已跨齊報稅期
- **WHEN** 業務完成訂單異動單核可 + 負值收款紀錄
- **THEN** 業務 SHALL 走「開立折讓單」（不可作廢）
- **AND** 折讓金額 SHALL 為 -1000 等於退款金額
- **AND** 折讓單 SHALL 關聯負值收款紀錄

#### Scenario: 未跨齊報稅期退款走作廢

- **GIVEN** 退款場景發票未跨齊報稅期
- **WHEN** 業務完成訂單異動單核可 + 負值收款紀錄
- **THEN** 業務 SHALL 走「作廢發票」（系統呼叫第三方平台）
- **AND** 業務 SHALL 重新開立金額為 0 或調整後金額的新發票
- **AND** 原發票流水號 MUST NOT 重用，新發票流水號自動 +1

**進度展示**

訂單詳情頁付款管理 Tab SHALL 顯示「主訂單退款進度區」，當訂單存在處於「進行中」狀態的退款動作時（即有訂單異動單 type = 退款且狀態為「待主管審核」/「已核可未執行」/「已執行未完成發票異動」）顯示三組件完成狀態提示區，含每組件的：
- 完成狀態（已完成 / 進行中 / 未開始）
- 對應實體連結（訂單異動單編號 / 收款紀錄編號 / 發票或折讓單編號）
- 完成時間與操作者

此展示協助業務 / 諮詢於主訂單退款場景追蹤進度，避免漏做任一組件（與 after-sales-ticket spec § 售後服務單三組件進度展示 為相同設計範式，但展示位置在訂單詳情頁付款管理 Tab）。

#### Scenario: 主訂單退款進行中顯示三組件進度

- **GIVEN** 訂單已建立退款訂單異動單（type = 退款）且狀態為「已核可未執行」
- **AND** 尚未建立負值收款紀錄、尚未處理發票異動
- **WHEN** 業務開啟訂單詳情頁付款管理 Tab
- **THEN** 系統 SHALL 顯示三組件進度區：
  - 訂單異動單：進行中（連結至異動單編號 + 「已核可待執行」）
  - 退款收款紀錄：未開始
  - 發票異動：未開始

#### Scenario: 三組件全完成隱藏進度區

- **GIVEN** 訂單退款三組件全部完成（訂單異動單已執行、負值收款紀錄已建立、發票異動已完成）
- **WHEN** 業務開啟訂單詳情頁付款管理 Tab
- **THEN** 退款進度區 MUST 隱藏或顯示「已完成」摺疊狀態
- **AND** 退款紀錄 MUST 仍可於收款紀錄列表 / 發票列表 / 訂單異動列表查閱

---
## Data Model

> **欄位正本已遷移至 wiki 實體卡**。本段僅保留實體關聯總覽。
>
> - 帳務欄位正本：[wiki 帳務實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/帳務.md) § 欄位（業務可見）
> - 訂單核心欄位：[wiki 訂單實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/訂單.md)
> - Prototype 型別定義：`sens-erp-prototype/src/types/order.ts`

### 實體關聯總覽

帳務領域的實體關係（業務語言）：

- 一張**訂單**可開多張**發票**（每張發票對應一個請款期次，1:1）
- 一張**發票**可有多筆**折讓單**（部分減額憑證）
- 一張**訂單**可有多個**請款期次**（分期請款規劃）
- 一個**請款期次**可被多筆**收款紀錄**核銷（透過收款核銷分配）
- 一筆**收款紀錄**可同時核銷多個請款期次
- 折讓回簽附件與收款對帳附件各自掛在父單據上
- 一個**帳務公司**對應一個藍新商店帳號，訂單建立時選定
- 已廢止：預計發票（PlannedInvoice）/ 付款計畫（PaymentPlan）已由請款期次取代

