---
type: user-story
us-id: US-ORD-030
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
priority: medium
status: draft
created-at: 2026-05-28
last-reviewed: 2026-06-03
source:
  - memory/Sens_wiki/wiki/erp/04-business-logic/payment-invoice-scenarios.md
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md
  - openspec/changes/archive/2026-06-02-refactor-order-receivable-refund-model/proposal.md
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-030 F1 情境：預開發票 + 拆 2 張 + 實作金額調整退款

## 業務情境

### 作為
[[業務]]

### 我希望
處理政府單位 / 學校的預開發票情境：先預收金額 + 拆 2 張發票（單張不能超過限額）+ 實作金額低於預估時走退款 + 折讓單流程

### 以便
覆蓋 payment-invoice-scenarios.md 情境 F1（如：中央大學系所招生簡介，預開 15K → 實做 9.1K → 退 5.9K）的完整全鏈路；顧問 Phase 3 C-PM-4 採納為新增 user story

### 前置條件
- 客戶為學校 / 政府單位（內部核銷流程要求預開發票）
- 預開金額超過單張發票限額（需拆 2 張各 7.5K）
- 訂單實作金額有可能低於預估

### 業務流程
1. 訂單成立、業務記錄一筆預收款（15K）；此預收款無對應請款期次關聯，溢收部分標記為「預收（未分配）」
2. 業務於規劃階段建 2 筆請款期次（各 7.5K），各自一鍵開立預開發票（發票繼承來源期次的品項 / 應收日 / 備註）
3. 預開發票後客戶完成內部核銷流程
4. 訂單實作完成、實際金額（9.1K）低於預估（15K）
5. 業務建退款訂單異動（−5.9K）→ 業務主管核可，訂單異動核可即推進「已執行」、應收即時下調至 9.1K（不等退款款項）→ 業務另建退款款項（−5.9K，可選填關聯該退款訂單異動）、上傳匯款證明、切「已完成」核銷應退差額
6. 業務於發票端跨月處理：對兩張預開發票開立折讓單（合計折讓 −5.9K，分配到兩張發票上）
7. 折讓單手動關聯該退款款項（已跨月走折讓；未跨月則作廢原發票重開）
8. 三方對帳通過：應收 9.1K = 發票淨額 9.1K（15K - 5.9K 折讓）= 收款淨額 9.1K（15K - 5.9K 退款）

### 成功條件（acceptance criteria）

1. 預收款可記錄為無請款期次關聯的款項（無前置請款期次也能登錄，溢收歸「預收（未分配）」）
2. 拆 2 張發票各自獨立金額（合計 = 預收 15K），同一筆款項可透過收款分攤對應到兩期
3. 退款款項核銷「收款淨額 − 應收」的應退差額、不建收款分攤（不進正向期次）、可選填關聯退款訂單異動；退款完成判定 = 退款款項切「已完成」（物理錨點），跨月時透過折讓單關聯
4. 折讓金額大於單張發票金額時，業務可拆成多筆折讓單各自關聯不同發票
5. 三方對帳三軸平（應收 9.1K = 發票淨額 9.1K = 收款淨額 9.1K）、差額 = 0；退款執行前對帳面板顯示「應退差額」警示且不可忽略（不提供「忽略此差額」選項）

## 來源（provenance）

- memory/Sens_wiki/wiki/erp/04-business-logic/payment-invoice-scenarios.md § 1 預開發票 + 拆 2 筆發票開立 + 實際製作金額調整（情境 F1）
- openspec/changes/unify-billing-installment-and-reconciliation-csv/design.md § Open Questions OQ-US-1 + 顧問 C-PM-4 採納

## 校對紀錄

### 第二輪（2026-06-03，對齊 unify-billing 與路 C refactor-order-receivable-refund-model）

- PaymentPlan / PlannedInvoice 雙實體用語收斂為單一請款期次（BillingInstallment）：預收款改記「無 BillingInstallment 關聯 + 預收（未分配）桶」、開票繼承鏈改 source_billing_installment_id。
- 退款執行語意對齊路 C：退款 OA 業務主管核可即推進「已執行」、應收即時下調（不等退款 Payment 累計達標）；退款 Payment 切「已完成」為核銷應退差額的物理錨點，與 OA 推進解耦、linkedOrderAdjustmentId 選填。
- 三方對帳成功條件改三軸定義（應收 = 發票淨額 = 收款淨額）；退款前「應退差額」警示不可忽略、不提供忽略選項。
- 折讓單欄位名對齊 spec 為 refund_payment_id，補跨月走折讓 / 未跨月作廢重開分支。
