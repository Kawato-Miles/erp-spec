## REMOVED Requirements

### Requirement: 付款計畫建立與變更流程

**Reason**: 舊 PaymentPlan 建立 / 變更流程（N 期付款定義 + 變更觸發回審）已由「請款與核銷流程（合併規劃層雙實體 + 自動分配）」Requirement 取代（v1.14 unify-billing-installment 明列取代此五步驟流程）。新舊流程並存於 main spec。

**Migration**: 請款規劃流程改以 BillingInstallment 為單一規劃實體 + PaymentAllocation 核銷；現行權威為「請款與核銷流程（合併規劃層雙實體 + 自動分配）」Requirement。
