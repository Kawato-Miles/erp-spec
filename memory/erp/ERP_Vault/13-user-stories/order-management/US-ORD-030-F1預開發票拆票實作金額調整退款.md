---
type: user-story
us-id: US-ORD-030
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[../../03-roles/業務]]"
priority: medium
stage: business-only
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - memory/erp/ERP_Vault/04-business-logic/payment-invoice-scenarios.md
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-030 F1 情境：預開發票 + 拆 2 張 + 實作金額調整退款

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
處理政府單位 / 學校的預開發票情境：先預收金額 + 拆 2 張發票（單張不能超過限額）+ 實作金額低於預估時走退款 + 折讓單流程

### 以便
覆蓋 payment-invoice-scenarios.md 情境 F1（如：中央大學系所招生簡介，預開 15K → 實做 9.1K → 退 5.9K）的完整全鏈路；顧問 Phase 3 C-PM-4 採納為新增 user story

### 前置條件
- 客戶為學校 / 政府單位（內部核銷流程要求預開發票）
- 預開金額超過單張發票限額（需拆 2 張各 7.5K）
- 訂單實作金額有可能低於預估

### 業務流程
1. 訂單成立、業務記錄預收款（金額 15K，無對應期次的臨時收款）
2. 業務於規劃階段建 2 筆請款期次（各 7.5K）+ 兩筆各自開預開發票
3. 預開發票後客戶完成內部核銷流程
4. 訂單實作完成、實際金額（9.1K）低於預估（15K）
5. 業務建退款訂單異動（−5.9K）→ 業務主管核可 → 建退款 Payment（−5.9K）切已完成 → 異動推進已執行
6. 業務於發票端跨月處理：開折讓單 SalesAllowance 關聯兩張預開發票（合計折讓 −5.9K，業務分配到兩張發票上）
7. 折讓單 refundPaymentId 手動關聯該退款 Payment
8. 三方對帳通過：應收 9.1K = 發票淨額 9.1K（15K - 5.9K 折讓）= 收款淨額 9.1K（15K - 5.9K 退款）

### 成功條件（acceptance criteria）

1. 預收款可記錄為「無 PaymentPlan 關聯」的 Payment（無前置請款期次也能登錄）
2. 拆 2 張發票各自獨立金額（合計 = 預收 15K），透過 PaymentAllocation 對應一筆 Payment 拆兩期分攤
3. 退款 Payment 不入正向期次的核銷分配（PaymentAllocation），透過 SalesAllowance.refundPaymentId 連結
4. 折讓金額大於單張發票金額時，業務可拆成多筆 SalesAllowance 各自關聯不同發票
5. 三方對帳差額 = 0（含負項對齊），對帳警示 banner 因執行時點跨期觸發

## UI 操作（易變層）

<!-- ui-binding: draft -->

> 全鏈路涉及 OrderPaymentSection / OrderInvoiceSection / OrderAdjustmentSection 多區塊跨流程，UI 路徑待 task 4.5-4.14 整合後填寫。

## 來源（provenance）

- memory/erp/ERP_Vault/04-business-logic/payment-invoice-scenarios.md § 1 預開發票 + 拆 2 筆發票開立 + 實際製作金額調整（情境 F1）
- openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md § Open Questions OQ-US-1 + 顧問 C-PM-4 採納
