---
type: user-story
us-id: US-ORD-026
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[../../03-roles/業務]]"
priority: high
stage: business-only
status: draft
created-at: 2026-05-28
last-reviewed: 2026-05-28
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios:
  - "[[../../07-scenarios/訂單異動流程#旅程 A：訂單期間加印補收（情境 8）]]"
related-business-logic:
  - "[[../../04-business-logic/訂單異動規則#R1：補收正項免審，直達已執行]]"
related-entities:
  - "[[../../05-entities/訂單]]"
related-test-cases: []
---

# US-ORD-026 業務建補收訂單異動免主管核可直接執行

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
建立補收正項訂單異動（加印追加 / 加運費 / 急件費 / 規格變更加價 / 補退正項）時跳過業務主管核可流程、直接執行讓應收即時 +N

### 以便
對齊台灣印刷業實務分權（主管把關現金流出方向、不把關客戶下單追加方向）；補收屬「客戶下訂單追加」延續、業務本人扛責任，不需主管 gate 拖延

### 前置條件
- 業務有訂單編輯權限
- 訂單異動為正項（amount > 0）且 adjustment_type 屬補收類（加印追加 / 加運費 / 急件費 / 規格變更正項 / 補退正項）
- 訂單仍在製作中（非已完成；訂單完成後的補收須走售後服務）

### 業務流程
1. 業務於訂單異動區塊點「新增異動」建補收正項
2. 業務填入金額、原因、明細
3. 業務點「直接執行」（無需送業務主管審核中間態）
4. 系統將異動狀態直接設為「已執行」、approved_by = 業務本人、應收 +N 立即認列
5. 業務後續新增請款期次承載該補收金額 → 開票 + 收款
6. 若金額超過大額閾值（建議起始 50000），系統寫入活動紀錄紅標 + 業務主管接收 Slack 通知做事後監督

### 成功條件（acceptance criteria）

1. 補收正項異動跳過「待主管審核」「已核可」中間態，直接從草稿到已執行
2. 應收 +N 立即認列，不需等對應收款 Payment 切已完成才推進（與退款負項對稱破壞、語意分流）
3. 大額補收（amount > SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD = 50000）觸發 ActivityLog 紅標事件 high_amount_supplementary_charge + 業務主管 Slack 通知（mock）
4. 業務主管事後監督，不阻擋業務操作（業務 MAY 立即建異動，主管事後查 audit log 或 Slack 通知）

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderAdjustmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁 → 訂單異動區塊 → 「新增異動」按鈕

### 介面元素
- OrderAdjustmentEditDialog 顯示「補收正項 — 直接執行（免主管核可）」emerald 提示橫幅
- 大額補收顯示 amber 警示橫幅 + BellRing「業務主管將收到事後 Slack 通知」

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 補收 OA（正項）跳過審核中間態直達已執行
- design.md § Decisions D4（補退不對稱）
- CEO Challenge 2 採納澄清語意 + 顧問 C-PM-3 大額閾值監督
