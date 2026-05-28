---
type: user-story
us-id: US-ORD-027
module:
  - order-management
role:
  - "[[../../03-roles/業務主管]]"
priority: high
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

# US-ORD-027 業務主管核可退款訂單異動（rewording 沿用 v1.13）

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務主管]]

### 我希望
專注於核可退款負項訂單異動（公司現金流出方向），不再因業務調整付款計畫 / 拆期 / 改日期被要求重審

### 以便
聚焦在「現金流出」的雙重把關責任，廢止「付款計畫變更觸發訂單回業務主管審核」事前 gate 後減少主管干擾；補收正項業務直接執行、退款負項仍需主管核可形成對稱破壞但語意分流

### 前置條件
- 業務已建立退款負項訂單異動（amount < 0）並送審
- 業務主管有訂單核可權限

### 業務流程
1. 業務主管於「待主管審核」列表看到退款異動單
2. 業務主管檢視退款原因、明細、責任歸屬
3. 業務主管決定核可、退回（要求業務修正）或事後監督補收大額紅標通知
4. 核可後業務於異動單建立退款 Payment，補實際退款日 + 對帳附件 + 切「已完成」
5. 系統檢驗已完成退款 Payment 累計 = 異動金額 → 同 transaction 推進異動至「已執行」
6. 業務於發票端後續處理：作廢重開（未跨月）或開折讓（已跨月）

### 成功條件（acceptance criteria）

1. 業務主管唯一審核 gate：退款負項異動（amount < 0），補收正項業務直接執行不送主管
2. 退款異動已執行 invariant：必有已完成退款 Payment 累計達異動金額（沿用 v1.13 設計，本 change 不改）
3. 退款 Payment 不入正向期次的核銷分配（保留正向期次稽核歷史）
4. 業務主管 SLA 目標 ≤ 8 小時（CEO 指標 7 量測來源；補收免審後驗證主管不成新瓶頸）

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderAdjustmentEditDialog.tsx -->

### 介面入口
- 訂單詳情頁 → 訂單異動區塊 → 待主管審核中的退款異動 row → 點開 Dialog 核可 / 退回

### 介面元素
- OrderAdjustmentEditDialog 顯示「退款負項 — 沿用 v1.13 主管核可流程」sky 提示橫幅

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 退款 OA（負項）沿用業務主管核可 + 不進期次
- design.md § Decisions D4（補退不對稱）
- 沿用 v1.13 既有設計、本 change rewording 對齊新規
