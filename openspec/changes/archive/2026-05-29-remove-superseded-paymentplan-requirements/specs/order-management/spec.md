## REMOVED Requirements

### Requirement: 付款計畫建立（PaymentPlan）

**Reason**: 已由「請款期次（BillingInstallment）統一實體」Requirement 完整取代（v1.14 unify-billing-installment 合併 PaymentPlan + PlannedInvoice 雙頭維護為單一規劃實體）。舊本體與新 Requirement 並存造成 main spec 內部矛盾（同檔另有「付款計畫建立（PaymentPlan）— 廢止改為 BillingInstallment」宣告本 Requirement 全文廢止）。

**Migration**: 收款規劃改用「請款期次（BillingInstallment）統一實體」Requirement（addBillingInstallment）。Prototype 已於 `remove-legacy-payment-plan-planned-invoice-junction`（2026-05-29 歸檔）移除 PaymentPlan 型別與 helper。

### Requirement: 付款計畫建立（PaymentPlan）— 廢止改為 BillingInstallment

**Reason**: 此為宣告舊「付款計畫建立（PaymentPlan）」Requirement 廢止的 transition tombstone。舊本體已於本 change 一併移除，tombstone 不再需要；main spec 應只保留現行狀態，migration 歷史保留於 archived change（unify-billing-installment / remove-legacy-payment-plan-planned-invoice-junction）。

**Migration**: 無（純文件清理）。現行收款規劃權威為「請款期次（BillingInstallment）統一實體」Requirement。

### Requirement: 收款記錄（Payment）

**Reason**: 舊版 Payment Requirement 規範每筆 Payment 可選關聯單一 PaymentPlan 期次（paymentPlanId），已由「收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導」Requirement 取代。兩個同名 Requirement 並存且 paymentPlanId 一處 MUST 填、一處 MUST NOT 含，造成 main spec 直接矛盾。

**Migration**: Payment 改透過 PaymentAllocation N:M 入帳明細關聯期次；現行權威為「收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導」Requirement。
