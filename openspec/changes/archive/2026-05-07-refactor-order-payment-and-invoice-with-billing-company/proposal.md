# 訂單付款發票重構 + 多帳務公司支援

## Why

業務 / 諮詢目前處理線下單付款 / 發票的實際情境（多期付款、發票時序自由、合併拆分發票、作廢折讓）在現況訂單 spec 找不到對應的資料結構：Order 表只有單筆平面欄位（payment_status / payment_method / paid_at / invoice_unified_number），文字 Requirement 雖宣稱「支援多次付款」「1-N 張發票」，但 Data Model 根本不支援。同時公司有兩個帳務主體（兩個藍新 MerchantID_），現況沒有帳務公司概念，需求單 / 訂單成立時無從指定。本次重構同時：
1. 清掉錯誤抽象「補收款 = 子訂單」，由 OrderAdjustment 取代
2. 建立完整的付款 / 發票 / 折讓 / 訂單異動資料模型
3. 加入 BillingCompany 支援多帳務公司，發票送藍新時對應正確 MerchantID_

## What Changes

- **新增 BillingCompany 實體**：對應藍新 MerchantID_，公司有兩家帳務主體
- **新增 6 個付款發票相關實體**：PaymentPlan、Payment、Invoice、PaymentInvoice (M:N junction)、SalesAllowance、OrderAdjustment
- **新增 3 個獨立狀態機**：Invoice（開立 / 作廢）、SalesAllowance（草稿 / 已確認 / 已作廢）、OrderAdjustment（草稿 / 待主管審核 / 已核可 / 已退回 / 已執行 / 已取消）
- **OrderAdjustment 不退主訂單流程**：訂單異動有獨立狀態機，主訂單可繼續推進至生產 / 出貨
- **PaymentPlan 變更觸發訂單回審核**：沿用 add-sales-manager-quote-approval 機制，付款計畫變更後業務主管要重審
- **BREAKING：Order 平面化付款欄位 deprecated**：payment_status / payment_method / payment_detail / paid_at / invoice_unified_number 移除，資料遷移到新實體；buyer_ubn 遷至 Invoice
- **BREAKING：補收款機制由 OrderAdjustment 取代**：parent_order_id / is_supplemental 移除，原概念由 OrderAdjustment 表達（可正可負，分類型）
- **QuoteRequest 新增 billing_company_id 必填欄位**：需求單建立時就要選帳務公司，訂單從需求單繼承
- **角色權責調整**：會計從「發票操作者」改為「對帳查詢者」（user-roles spec L157-171 更新）；業務 / 諮詢取得發票開立 / 作廢 / 折讓權；OrderAdjustment 需業務主管審核；發票作廢、折讓不需主管審核
- **客戶不綁定帳務公司**：每張需求單 / 訂單獨立指定 billing_company
- **OrderAdjustment 已執行後 PaymentPlan 不自動變動**：應收金額更新，但業務手動調整 PaymentPlan
- **改買受人走「作廢重開」路徑**：對應藍新 API 標準流程，不額外設計「換開」捷徑
- **Mockup 對接藍新 API 欄位**：InvoiceTransNo / InvoiceNumber / RandomNum / AllowanceNo 依藍新格式產生假資料；不模擬申報期、跨期作廢限制
- **訂單詳情頁擴充欄位**：付款 / 發票 / 折讓 / 異動相關欄位呈現；UX 細節留待 [refactor-order-detail-to-hero-tab-layout](../refactor-order-detail-to-hero-tab-layout) 完成後再做

## Capabilities

### New Capabilities

- 無（所有改動沿用現有 capability，不切新 spec）

### Modified Capabilities

- `order-management`：新增 7 個實體 Data Model（BillingCompany / PaymentPlan / Payment / Invoice / PaymentInvoice / SalesAllowance / OrderAdjustment）+ 對應 Requirements；移除平面化付款欄位與補收款子訂單機制；補會計對帳 / 業務一鍵開發票 / 業務主管批次審核 OrderAdjustment 三個 user story
- `quote-request`：Data Model 新增 billing_company_id（必填）；Requirements 補建立時選帳務公司
- `state-machines`：新增 OrderAdjustment / Invoice / SalesAllowance 三個獨立狀態機；補 PaymentPlan 變更觸發訂單回業務主管審核的邏輯
- `user-roles`：更新會計角色權責（從發票操作者改為對帳查詢者）；新增業務 / 諮詢的發票開立 / 作廢 / 折讓權；補業務主管審核 OrderAdjustment 權責
- `business-processes`：新增付款計畫變更流程、訂單異動執行流程、發票異動（作廢 / 折讓 / 改買受人）流程
- `business-scenarios`：新增「兩帳務公司、多期付款、合併發票、訂單異動 + 折讓退款」端到端情境驗證

## Impact

**資料層**：訂單模組資料模型大幅擴張（+ 7 entities + 1 junction），Order 表收斂為純訂單核心欄位，付款發票資料移至獨立實體。

**角色權責邊界**：會計、業務、諮詢、業務主管的付款發票相關操作邊界重新界定。會計從操作者降為查詢者後，會計部門可能反彈（已決定不加額外制衡，業務可單獨作廢；以「業務主管審核 OrderAdjustment」作為金額層次的把關）。

**跨模組連動**：需求單建立流程多一個必填欄位（billing_company_id），下游訂單繼承；訂單詳情頁要新增四個區塊（付款計畫 / 收款紀錄 / 發票清單 / 訂單異動）；報價單轉訂單時 billing_company_id 隨需求單帶入。

**第三方整合（Mockup）**：BillingCompany.ezpay_merchant_id 對應藍新 MerchantID_；Invoice / SalesAllowance 留存藍新對帳鍵（InvoiceTransNo、InvoiceNumber、AllowanceNo）。實際藍新 API 串接不在本次範疇。

**KPI 設計（Phase 2/3 北極星指標下）**：
- 目標：三方對帳差額 = 0 的訂單比率（baseline 預估 80%，target 100%）
- 防禦：訂單異動平均審核時長（避免主管審核拖慢出貨）
- 運營：手動三方對帳時間成本下降（以對帳檢視面板替代 Excel 對帳）

**不在範疇**：
- 訂單詳情頁 UX 細節（等 [refactor-order-detail-to-hero-tab-layout](../refactor-order-detail-to-hero-tab-layout) 完成後再做）
- 真實藍新 API 串接 / 退款金流串接
- 申報期判斷 / 跨期作廢限制（藍新自行處理，ERP 不模擬）
- 歷史訂單資料遷移（新模型套用於新訂單，舊訂單維持平面欄位；除非後續另開遷移 change）

**依賴關係**：
- 沿用 archive `2026-04-27-add-sales-manager-quote-approval` 的「核可後可解鎖、變更後重審」機制
- 重用 [openspec/specs/user-roles/spec.md:492](../../specs/user-roles/spec.md:492) 已定義的業務主管角色
