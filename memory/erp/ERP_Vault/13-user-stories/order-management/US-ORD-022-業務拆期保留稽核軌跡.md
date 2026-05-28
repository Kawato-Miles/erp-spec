---
type: user-story
us-id: US-ORD-022
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[../../03-roles/業務]]"
priority: medium
stage: ui-bound
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

# US-ORD-022 業務拆期保留稽核軌跡

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
客戶臨時要求把一期請款拆成兩張發票時，把該期拆成兩個獨立平輩期次，原期次保留作稽核紀錄

### 以便
讓拆票場景（如政府單位限額拆票、B2B + B2C 混合、跨月拆票）有對應的期次結構承載；同時原期次保留供事後追查業務操作軌跡

### 前置條件
- 拆分的原期次必須是未取消狀態
- 業務必須輸入兩筆新期次的金額且合計等於原期次金額
- 業務知道兩筆新期次各自的應收日（可同日可不同日）

### 業務流程
1. 業務於請款期次列表點「拆此期」（或於一鍵開票時臨時點「拆此期」捷徑）
2. 系統預設帶入原期次金額平分 + 兩筆新期次描述自動加「拆 1/2」「拆 2/2」前綴
3. 業務確認或調整兩筆新期次的金額、應收日、預計開票日（系統即時校驗兩期合計 = 原期次金額）
4. 業務送出後系統將原期次標為「已取消」（cancel_reason = '拆兩期'）保留稽核軌跡，建立兩筆獨立平輩期次
5. 兩筆新期次沿用原期次的來源類型（如諮詢取消半額退費的拆期，新期次仍標 source_type = consultation_cancellation）

### 成功條件（acceptance criteria）

1. 拆分後原期次不被物理刪除，cancelled = true 保留稽核軌跡
2. 兩筆新期次無父子彙整關聯（不可透過 split_from_installment_id 做 query / aggregation；該欄位僅供 CSV lineage 追溯）
3. 拆期事件寫入活動紀錄（含原期次 id / 兩筆新期次 id / 拆分規格），新期次變更次數從 0 起算（不繼承原期次變更歷史）
4. 兩條入口（規劃階段「拆此期」+ 開票時 Dialog 內「拆此期」捷徑）共用同一拆分邏輯

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/BillingInstallmentSplitDialog.tsx -->

### 介面入口
- 訂單詳情頁「款項」Tab → 請款期次列表 → 該期「拆此期」按鈕（兩條入口共用此 Dialog）

### 介面元素
- BillingInstallmentSplitDialog 顯示原期次資訊 + A/B 兩期表單 + 即時合計校驗（不等時 disable 儲存）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 拆票 = 拆期
- design.md § Decisions D2 + Miles OQ-BI-5 拍板
