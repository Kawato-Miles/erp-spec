## REMOVED Requirements

### Requirement: PaymentPlan 變更觸發訂單回業務主管審核

**Reason**: 舊規則「PaymentPlan 變更（拆期 / 改期 / 改金額）SHALL 觸發訂單回業務主管審核」已由「廢止『付款計畫變更觸發訂單回業務主管審核』」Requirement（新規則：BillingInstallment 變更 SHALL NOT 觸發回審、改三管道事後稽核）+「BillingInstallment 取代 PaymentPlan 狀態機（廢止 v1.13 PaymentPlan.status）」Requirement 取代。新舊規則對立並存於 main spec。

**Migration**: 期次金額 / 日期變更改記 BillingActivityEvent + 變更次數（changeCount），事後稽核（CEO 指標 4 變更率 + Slack mock + ActivityLog），不再同步觸發回審。現行權威為「廢止『付款計畫變更觸發訂單回業務主管審核』」+「BillingInstallment 取代 PaymentPlan 狀態機」兩個 Requirement。
