---
type: user-story
us-id: US-ORD-020
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
  - "[[諮詢]]"
priority: high
stage: ui-bound
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-020 業務建立請款期次

## 業務情境（穩定層）

### 作為
[[業務]]（或 [[諮詢]]）

### 我希望
在訂單成立後一次規劃所有請款期次，含應收日、預計開票日、品項、預計金額、備註

### 以便
取代過去要分別維護「付款計畫」+「預計發票」雙頭時程的重複輸入，業務操作步數從 ≥ 8 步降至 ≤ 4 步

### 前置條件
- 訂單已成立（狀態為「報價待回簽」或「訂單確認」）
- 業務有訂單編輯權限（owner 或 sales role）

### 業務流程
1. 業務於訂單款項區塊點「新增期次」
2. 業務填入期次描述（如「訂金 30%」「尾款 70%」「加印款」）+ 預計金額 + 應收日 + 預計開票日（選填）+ 備註
3. 業務儲存後系統建立一筆請款期次，凍結原始日期基準供事後稽核
4. 系統檢核訂單應收（含已執行訂單異動）與所有未取消期次金額合計，差額時顯示提示（不阻擋儲存）
5. 業務可重複建立多筆期次完成分期規劃

### 成功條件（acceptance criteria）

1. 業務一次建立期次同時記錄「何時收 + 何時開票 + 開什麼品項」三個面向
2. 系統凍結首次儲存當下的「原始應收日」「原始預計開票日」作為事後稽核基準（業務之後修改不影響此基準）
3. 訂單應收與期次合計差額時系統顯示警示但允許儲存（沿用 v1.13 spec L915 既有規則）
4. 業務 / 諮詢 兩個角色都能建立期次（諮詢角色等價沿用 after-sales-ticket § 諮詢角色等價原則）

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/BillingInstallmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 「請款期次（v2 統一規劃）」區塊 → 「新增期次」按鈕

### 操作步驟
- 點「新增期次」開 BillingInstallmentEditDialog
- 填入描述 / 預計金額 / 應收日 / 預計開票日（選填）/ 備註
- 點「建立期次」儲存

### 介面元素
- BillingInstallmentEditDialog 表單欄位：description / scheduledAmount / dueDate / expectedInvoiceDate / note
- 訂單應收 vs 期次合計差額警示橫幅（amber-50 + AlertCircle）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 請款期次（BillingInstallment）統一實體
- design.md § Decisions D1（規劃層合併為 BillingInstallment）
