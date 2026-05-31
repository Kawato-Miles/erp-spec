---
type: user-story
us-id: US-ORD-025
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
  - "[[業務主管]]"
priority: medium
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

# US-ORD-025 業務查看期次原始 vs 現況對照

## 業務情境

### 作為
[[業務]]（自己檢視操作軌跡）或 [[業務主管]]（事後稽核業務操作穩定性）

### 我希望
查看請款期次列表時，每期的應收日 + 預計開票日同時顯示「原始凍結基準」與「現況值」對照

### 以便
事後稽核業務是否頻繁調整期次（CEO 指標 4 「期次變更次數」量測來源）；廢止「付款計畫變更觸發訂單回業務主管審核」事前 gate 後，以「留軌跡 + 對照顯示」作為事後監督機制

### 前置條件
- 訂單下存在請款期次（cancelled = false）
- 期次首次儲存當下已凍結原始日期基準

### 業務流程
1. 業務 / 業務主管 進入訂單款項區塊查看請款期次列表
2. 每期的應收日 + 預計開票日欄位顯示「原始 vs 現況」對照
3. 若兩值相同，僅顯示單一日期（節省版面）
4. 若兩值不同，顯示「原始 {日期} ｜ 現況 {日期}（變更人 / 變更時間 / 變更次數）」對照
5. 變更次數 ≥ 警示閾值（per-installment 平均 ≥ 1.5）時對照外觀紅色標記

### 成功條件（acceptance criteria）

1. 期次首次儲存當下凍結 originalDueDate / originalExpectedInvoiceDate，後續修改不影響此凍結值
2. 對照顯示須使用業務一眼可辨識的視覺差異（紅色 / 變更 badge / 線刪除原值）
3. 變更次數的警示閾值對齊 CEO 指標 4（健康 ≤ 1.5 per-installment 平均、警示 1.5-3、異常 ≥ 3）
4. 拆期產生的新期次變更次數從 0 起算（拆期事件本身寫入活動紀錄、不計入 changeCount）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 期次變更稽核軌跡
- design.md § Decisions D5（廢止付款計畫變更回審改留軌跡）
- CEO 指標 4「期次變更次數 per-installment 平均」量測來源
