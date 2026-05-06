# Tasks

> 順序為強制依賴順序：BillingCompany → Invoice / Payment / SalesAllowance → OrderAdjustment → PaymentPlan 變更回審 → 業務情境驗證 → 文件同步。
> 並行會造成 spec 互相引用未定義實體（如 Invoice 引用 BillingCompany 但後者尚未建立），務必鎖死順序。

## 1. 資料模型基礎（BillingCompany + 既有實體擴充）

- [x] 1.1 在 prototype-data-store 建立 BillingCompany 型別（name / tax_id / ezpay_merchant_id / address / phone / is_default / is_active / timestamps）
- [x] 1.2 mock 兩家 BillingCompany 種子資料（含 ezpay_merchant_id 唯一性、is_default 預設一家為 true）
- [x] 1.3 QuoteRequest 型別新增 billing_company_id（必填 FK）
- [x] 1.4 Order 型別新增 billing_company_id（必填 FK）；標記 deprecated 欄位（payment_status / payment_method / payment_detail / paid_at / invoice_unified_number / parent_order_id / is_supplemental）
- [x] 1.5 既有需求單 / 訂單 mock 資料補上 billing_company_id（可指派預設那家）
- [x] 1.6 BillingCompany 後台管理頁（系統管理員角色）：列表 + 新增 / 編輯 / 啟停用 / 設定 is_default 互斥邏輯
- [x] 1.7 需求單編輯頁新增帳務公司下拉選單（is_active = true 篩選；預設 is_default = true 那家）
- [x] 1.8 需求單編輯頁顯示「該接單公司近 30 天最常用：[X]」軟性提示（mock 計算或固定值）
- [x] 1.9 需求單成交轉訂單時 billing_company_id 自動繼承到訂單

## 2. 付款計畫與收款記錄

- [x] 2.1 PaymentPlan 型別（order_id / installment_no / description / scheduled_amount / scheduled_date / status）
- [x] 2.2 Payment 型別（order_id / payment_plan_id 可空 / amount 可正可負 / payment_method 含「退款」/ payment_ref / paid_at / recorded_by）
- [x] 2.3 訂單詳情頁「付款計畫」區塊：列表 + 新增 / 編輯 / 刪除期次
- [x] 2.4 PaymentPlan 各期合計與訂單應收總額對齊驗證（不符時顯示差額警告，拒絕儲存）
- [x] 2.5 訂單詳情頁「收款紀錄」區塊：列表 + 新增 Payment（可關聯 PaymentPlan，可不關聯）
- [x] 2.6 PaymentPlan.status 自動更新邏輯（依累計 Payment 金額：未收 / 部分收款 / 已收訖）

## 3. 發票模組（藍新 Mockup）

- [x] 3.1 Invoice 型別（含完整藍新欄位 + status 開立 / 作廢 + invalid_reason / invalid_at / invalid_by）
- [x] 3.2 PaymentInvoice junction 型別（payment_id 可空 / invoice_id / amount）
- [x] 3.3 Mockup 字軌號產生函式：InvoiceTransNo（17 碼時間戳）/ InvoiceNumber（兩碼英文 + 8 碼遞增 / 跳過已用編號）/ RandomNum（4 碼）
- [x] 3.4 ezpay_merchant_order_no 產生規則：`{order_no}-INV-{流水}`，限英數 + 底線 + 20 字元
- [x] 3.5 ezpay_merchant_order_no 複合唯一鍵驗證：(billing_company_id, ezpay_merchant_order_no) 不可重覆
- [x] 3.6 訂單詳情頁「發票」區塊：列表 + 新增（手動填表）+ 一鍵開發票（自動帶入買受人 / 金額 / 商品明細）
- [x] 3.7 發票表單：B2B（必填統編）/ B2C（可選載具或捐贈碼）區分；課稅別 / 商品明細
- [x] 3.8 發票作廢功能：填入 invalid_reason（限中文 6 字 / 英文 20 字）、Activity log 留痕
- [x] 3.9 作廢後流水號 +1 不重用驗證
- [x] 3.10 PaymentInvoice 對應介面：業務勾選收款記錄與發票對應、支援拆分 / 合併
- [x] 3.11 先開發票後收款 → PaymentInvoice 暫無 payment_id 的 UI 流程

## 4. 折讓單模組（與退款 Payment 分離）

- [ ] 4.1 SalesAllowance 型別（invoice_id / ezpay_allowance_no / allowance_amount 限負數 / remain_amount / reason / status / refund_payment_id 業務手動關聯 / 各 timestamps）
- [ ] 4.2 Mockup 折讓號產生函式：「A」+ 14 碼數字
- [ ] 4.3 訂單詳情頁 / 發票詳情頁「折讓」區塊：列表 + 新增（限負數防呆）
- [ ] 4.4 折讓金額不可超過發票剩餘可折讓金額驗證（含已確認折讓的累計扣減）
- [ ] 4.5 Mockup 兩段式流程：開立折讓（status = 草稿）→ 立即觸發確認（status = 已確認，自動）
- [ ] 4.6 折讓開立 UI 加「關聯退款 Payment」下拉選單：列出該訂單 payment_method = 退款 的所有 Payment 供業務手動關聯
- [ ] 4.7 系統 SHALL NOT 在折讓建立 / 確認時自動建立 Payment（D12 折讓 / 退款分離）
- [ ] 4.8 作廢已確認折讓功能：填入 invalid_reason、status → 已作廢、發票剩餘金額回到作廢前；refund_payment_id 自動取消關聯
- [ ] 4.9 已作廢折讓不參與三方對帳的計算驗證

## 4A. 退款 Payment 獨立流程（D12）

- [ ] 4A.1 訂單詳情頁「收款記錄」區塊新增「建立退款」入口（payment_method = 退款預選）
- [ ] 4A.2 退款 Payment 與一般收款 Payment 在資料模型上同表（差別僅 payment_method 與 amount 正負）
- [ ] 4A.3 退款 Payment 可選關聯 PaymentPlan（如：原期次部分退款）
- [ ] 4A.4 退款 Payment 可不關聯任何 SalesAllowance（適合作廢重開情境，純訂單級退款）

## 5. 訂單異動（OrderAdjustment + 獨立狀態機）

- [ ] 5.1 OrderAdjustment 型別（含 adjustment_type 五分類列舉 / amount 可正可負 / status 六態 / approved_by / reject_reason / 各 timestamps）
- [ ] 5.2 OrderAdjustment 獨立狀態機 reducer / state transitions（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消）
- [ ] 5.3 訂單詳情頁「訂單異動」區塊：列表 + 新增（業務 / 諮詢角色）
- [ ] 5.4 業務提交審核 → status 推進（驗證草稿 → 待主管審核）
- [ ] 5.5 業務主管核可 / 退回介面（含必填退回原因）
- [ ] 5.6 業務執行已核可異動：status → 已執行 + 訂單應收總額重算
- [ ] 5.7 應收總額計算函式：Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)
- [ ] 5.8 OrderAdjustment 不阻擋主訂單推進的驗證（生產中 / 出貨中時仍可獨立完成審核）
- [ ] 5.9 訂單已完成但 OrderAdjustment 未完結時的 banner 提示
- [ ] 5.10 後台「待審核訂單異動」頁（業務主管角色）：批次列表 + 篩選（adjustment_type / 業務 / 訂單編號）
- [ ] 5.11 已完成訂單仍可建立 OrderAdjustment（D13 售後服務）：UI 不限制 status = 已完成 的訂單建立異動入口
- [ ] 5.12 已完成訂單異動執行後對帳檢視面板顯示警示 banner（與 7.5 連動）
- [ ] 5.13 主訂單狀態 = 已完成 時建立 / 執行 OrderAdjustment 不觸發任何主訂單狀態變化

## 6. PaymentPlan 變更觸發訂單回業務主管審核

- [ ] 6.1 PaymentPlan 變更（新增 / 修改 / 刪除）觸發訂單狀態 → 業務主管審核
- [ ] 6.2 沿用既有的核可流程（add-sales-manager-quote-approval 機制）
- [ ] 6.3 業務主管核可後訂單恢復至原狀態
- [ ] 6.4 訂單已進入生產段（製作等待中、生產中、出貨中、已完成）時不觸發回審，僅作記錄並 Activity log 留痕
- [ ] 6.5 「應收總額 vs PaymentPlan 未付期合計差額」提示 banner（差額 ≠ 0 時）

## 7. 對帳檢視面板（Verification 演示路徑必要）

- [ ] 7.1 訂單詳情頁右側「對帳檢視」面板元件：顯示應收 / 發票淨額 / 收款淨額 / 差額
- [ ] 7.2 三方對帳計算函式（依 [business-processes spec](specs/business-processes/spec.md) § 三方對帳計算規則）
- [ ] 7.3 差額 = 0 顯示「對帳通過」；差額 ≠ 0 顯示「待對帳」+ 可能原因細項（待開發票 / 待收款 / 待退款）
- [ ] 7.4 對帳檢視 Payment 區段分桶顯示：一般收款（payment_method ≠ 退款）+ 退款（payment_method = 退款），收款淨額 = 一般收款 - |退款|
- [ ] 7.5 已完成訂單上有 OrderAdjustment 已執行時，面板顯示警示 banner「歷史對帳需重新核對 — 訂單已於 [completion_date] 完成，異動於 [executed_at] 執行」
- [ ] 7.6 後台「對帳檢視」頁（會計角色）：批次查詢訂單，依 BillingCompany / 期間 / 狀態篩選
- [ ] 7.7 「僅顯示差額 ≠ 0」篩選器
- [ ] 7.8 對帳清單匯出 CSV（含 ERP 訂單編號 / ezpay_merchant_order_no / InvoiceTransNo / InvoiceNumber / ezpay_allowance_no / 三方金額 / 差額）

## 7A. 應收帳款帳齡底層欄位（D14，完整帳齡分析延後）

- [ ] 7A.1 PaymentPlan 計算 derived field overdue_days（status ≠ 已收訖時 = TODAY - scheduled_date；scheduled_date 為空則 NULL）
- [ ] 7A.2 訂單列表 / 對帳檢視頁加篩選欄位「最長逾期天數」（取訂單下所有未收 PaymentPlan 的 max(overdue_days)）
- [ ] 7A.3 訂單列表顯示「最長逾期天數」欄位，>= 30 / 60 / 90 用顏色標記（黃 / 橙 / 紅）
- [ ] 7A.4 完整應收帳款帳齡分析表（30/60/90 天分級）/ 逾期自動通知 / 應收帳款 Dashboard 不在本次範疇，留待下輪 change

## 8. 角色權責調整

- [ ] 8.1 會計角色：移除「開立發票 / 作廢 / 折讓」功能入口；保留訂單 / 發票 / 折讓 / 異動的讀取權
- [ ] 8.2 會計角色：新增「對帳檢視」頁的存取權（含批次查詢與匯出）
- [ ] 8.3 業務 / 諮詢角色：新增發票開立、作廢、折讓、退款 Payment 的執行權
- [ ] 8.4 業務主管角色：新增 OrderAdjustment 審核權；補「待審核訂單異動」頁存取
- [ ] 8.5 系統管理員：新增 BillingCompany 管理權（一般使用者 read-only）
- [ ] 8.6 Activity log 涵蓋所有付款 / 發票 / 折讓 / 異動操作（誰、何時、操作類型、原因）

## 9. 業務情境端到端驗證（Prototype 演示）

- [ ] 9.1 情境 1：兩帳務公司多期付款合併發票端到端流程跑通（依 [business-scenarios spec](specs/business-scenarios/spec.md) § 兩帳務公司多期付款...）
- [ ] 9.2 情境 1 驗證：對帳檢視面板顯示差額 = 0
- [ ] 9.3 情境 1 驗證：兩家 BillingCompany 複合唯一鍵不衝突
- [ ] 9.4 情境 2：訂單異動加印追加 + 折讓退款端到端流程跑通
- [ ] 9.5 情境 2 驗證：應收 = 發票淨額 = 收款淨額 = 110,000
- [ ] 9.6 情境 2 驗證：OrderAdjustment 已執行但 PaymentPlan 未調整時顯示差額警告
- [ ] 9.7 情境 3：作廢發票後重新開立（改買受人）端到端流程跑通
- [ ] 9.8 情境 3 驗證：作廢後流水號 +1 且不參與對帳計算
- [ ] 9.9 情境 4：已完成訂單售後服務（OrderAdjustment + 折讓退款）端到端流程跑通
- [ ] 9.10 情境 4 驗證：主訂單狀態維持已完成 + 對帳檢視面板顯示警示 banner

## 10. 文件同步與審查

- [ ] 10.1 跨 spec 一致性自我檢查（state-machines / business-processes / user-roles / business-scenarios 互不矛盾）
- [ ] 10.2 訂單管理 spec / 需求單 spec / 狀態機 spec 等 6 個正本 spec 同步更新（執行 `/opsx:archive` 時自動）
- [ ] 10.3 觸發 doc-audit skill 檢查跨檔案一致性
- [ ] 10.4 累積足夠 change 後 Miles 手動推送到 Notion 發布版本（需求單 v2.1 / 訂單管理 v0.6）
- [ ] 10.5 OQ-1 至 OQ-6 的 default 答案於 Prototype 跑通後回到 design.md 移除或正式拍板
