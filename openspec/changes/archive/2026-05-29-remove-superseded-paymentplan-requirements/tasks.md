# Tasks — remove-superseded-paymentplan-requirements

收斂 Step 1：移除已被新模型完整取代、移除不留行為缺口的舊 PaymentPlan 相關 Requirement。

## 移除（REMOVED delta）

- [x] 1.1 order-management REMOVED 3：付款計畫建立（PaymentPlan）/ 付款計畫建立（PaymentPlan）— 廢止改為 BillingInstallment / 收款記錄（Payment）
- [x] 1.2 state-machines REMOVED 1：PaymentPlan 變更觸發訂單回業務主管審核
- [x] 1.3 business-processes REMOVED 1：付款計畫建立與變更流程

## 驗證 + 歸檔

- [x] 2.1 `openspec validate remove-superseded-paymentplan-requirements --strict` 通過
- [x] 2.2 `openspec archive remove-superseded-paymentplan-requirements`（sync 把 REMOVED 套用至 main spec、移除對應 5 段）
- [x] 2.3 archive 跨檔案殘留引用檢查（手動 grep；發現 ~10 個殘留 PaymentPlan 引用於其他 Requirement，歸 Step 2 MODIFY）
- [x] 2.4 記錄於 [[2026-05-29-款項發票四來源一致性比對]] § 8（CLAUDE.md spec 清單為版本史摘要、cleanup 不另 bump，故不動該 row）

## 後續（Step 2 另開 change：reconcile billing spec to as-built）

- [ ] S2-1 PlannedInvoice Requirement（諮詢收尾自動建 / 品項鏈式預填 / 發票時間點）→ 改 BillingInstallment + source_type
- [ ] S2-2 Data Model：移除 PlannedInvoice 表 + ADD BillingInstallment / PaymentAllocation Data Model section
- [ ] S2-3 入帳機制：spec「依序填滿自動分配」→ as-built「業務手動勾選 + 填金額 + 防呆 sum ≤ 金額 + 溢收預收桶」（Miles 拍板手動）
- [ ] S2-4 發票開票維度 enum：`已作廢回未開立` → `已作廢`
- [ ] S2-5 新 store actions（addPaymentWithAllocations / updatePaymentWithAllocations / cancelPaymentWithAllocations）+ BillingInstallment.paymentMethod 欄位（prototype-data-store）
- [ ] S2-6 入帳 UI 元件：PaymentAllocationDialog → BillingInstallmentAllocationTable inline（prototype-shared-ui）

## 後續（Step 3：vault 商業邏輯 + 諮詢 US 對齊）

- [ ] S3-1 付款發票邏輯.md + payment-invoice-scenarios.md：舊詞（付款計畫 / 預計發票 / PaymentInvoice junction）→ 新模型
- [ ] S3-2 US-CR-005 / US-CR-006：去 invoice_option + 半額退費對齊
- [ ] S3-3 US-ORD-010 補收訂單模式 vs US-ORD-026 補收 OA 模式：標註取捨或廢止
