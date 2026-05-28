---
type: user-story
us-id: US-ORD-028
module:
  - order-management
role:
  - "[[../../03-roles/業務]]"
priority: low
stage: business-only
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-028 業務查看溢收「預收（未分配）」桶

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
客戶多匯款（實收 > 訂單所有未收期次合計）時，溢收金額暫掛「預收（未分配）」桶讓業務後續處理

### 以便
保留溢收紀錄、不需立即決定是退款還是抵充未來請款；對齊業界主流預收款處理模式（如 NetSuite Unapplied Payment）

### 前置條件
- 業務登錄一筆收款，金額大於該訂單所有未收期次合計

### 業務流程
1. 業務登錄收款 + 進入核銷分配流程
2. 系統依應收日早到晚把實收依序填滿各期未收餘額
3. 全部期次填滿後仍有剩餘金額，系統建立「billingInstallmentId = NULL」的預收分配紀錄（預收桶）
4. 業務於對帳 / 訂單款項區塊可看到該訂單下「預收未分配」金額
5. 業務後續決定：(a) 待新請款期次建立後核銷至新期次，或 (b) 退還客戶

### 成功條件（acceptance criteria）

1. 溢收場景系統自動建立 billingInstallmentId = null 的預收分配紀錄、不阻擋收款儲存
2. 預收金額在訂單款項區塊或對帳 UI 有明確 badge 標示（「預收（未分配）」）
3. 預收後續處理路徑列為 OQ-BI-3 待 Miles 拍板（兩者皆可 / 強制退款 / 強制核銷新期次）
4. 對帳 CSV 預設不列預收（CSV 主軸 = 一張已開立發票一列）

## UI 操作（易變層）

<!-- ui-binding: draft -->

> 對帳 / 訂單款項區塊「預收（未分配）」顯示與業務後續處理入口待 task 4.x 後續整合時細化。

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 收款核銷分配
- design.md § Decisions D3（PaymentAllocation 依序填滿）
- [[../../08-open-questions/BI-3-溢收預收未分配後續處理]]
