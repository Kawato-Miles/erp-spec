---
type: open-question
module:
  - order-management
oq-id: BI-17
status: open
priority: medium
audience: internal
raised-at: 2026-05-30
raised-by: Claude (PlannedInvoice 遷移揭露)
source-link: PlannedInvoice→BillingInstallment 全遷移收尾（2026-05-30）；unify-billing-installment-and-reconciliation-csv 遺留 gap
related-vault:
  - "[[訂單]]"
  - "[[付款發票邏輯]]"
related-oq:
  - BI-7
related-change: unify-billing-installment-and-reconciliation-csv（遺留）
expected-resolution-at: 另批補強
---

# BI-17：BillingInstallment 缺完整 Data Model 實體表

## 問題描述

unify-billing-installment-and-reconciliation-csv 定義 BillingInstallment 時，只用 Requirements + 雙維度狀態機（開票維度 invoicing_status / 收款維度 derived 自核銷），**未在 openspec 補完整 Data Model 實體欄位表**（欄位名 / 型別 / 必填 / 預設依賴 prototype `src/types/billingInstallment.ts` 承載）。

PlannedInvoice→BillingInstallment 全遷移（2026-05-30）後，order-management 原 PlannedInvoice Data Model 實體表改為「廢止 + supersession 註記指向 BillingInstallment」，但 **BillingInstallment 自身在 openspec 無正式 Data Model 權威定義** → 形成「實體有 Requirements + 狀態機、卻無 Data Model 欄位表」的缺口。

## 涉及範圍

- 模組：order-management（Data Model）/ billing
- 影響：openspec 缺 BillingInstallment 實體權威欄位定義（scheduled_amount / due_date / scheduled_issue_date / invoicing_status / source_type / split_from_installment_id / 原始日期凍結欄位等散在 Requirements + prototype，無單一 Data Model 表）

## 待解答

- [ ] 是否補 BillingInstallment 完整 Data Model 實體表於 order-management（或 prototype-data-store）§ Data Model
- [ ] 欄位來源：從 prototype `src/types/billingInstallment.ts` + unify-billing Requirements 彙整為單一權威表
- [ ] 與 PaymentAllocation / BillingActivityEvent 子實體的 cross-link

## 候選方案

### 方案 A：補完整 Data Model 實體表
- 優點：openspec 有 BillingInstallment 權威定義，未來 change 不必翻 prototype/Requirements
- 缺點：需從 prototype + 多個 Requirements 彙整、確保欄位/型別準確

### 方案 B：維持 supersession 註記 + cross-ref prototype
- 優點：改動最小
- 缺點：實體定義散落、違反「文件即規格」（openspec 應有實體權威定義）
