---
type: user-story
us-id: US-ORD-023
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
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-ORD-023 業務登錄收款並由系統依序填滿核銷分配

## 業務情境（穩定層）

### 作為
[[../../03-roles/業務]]

### 我希望
登錄客戶匯款後，系統自動把這筆收款依應收日早到晚分配到各期請款，少數情況業務可手動覆寫各期分配額

### 以便
取代過去要手動勾選「這筆款對應哪張票、分攤多少」的逐筆配對；系統預設處理 80% 一期一票一款場景；少數拆票 / 一次付清多期 / 部分收款情境業務可手動調整

### 前置條件
- 訂單下存在「未收」或「部分收款」狀態的請款期次
- 業務知道實收金額與收款方式

### 業務流程
1. 業務登錄一筆收款（含金額、收款方式、收款憑證）
2. 系統依應收日由早到晚把收款金額依序填滿各期未收餘額
3. 業務檢視系統預設的分配結果；多數情境（一期一票一款）直接接受
4. 少數情境業務手動覆寫各期分配額（如：客戶口頭指定某期先付、跨期拆票等）
5. 業務送出後系統建立收款核銷分配紀錄；溢收部分自動掛「預收（未分配）」桶
6. 系統依累計核銷推導各期收款狀態（未收 / 部分收款 / 已收訖）

### 成功條件（acceptance criteria）

1. 系統依應收日早到晚自動填滿各期未收餘額至實收用罄（不採比例平攤）
2. 業務可手動覆寫；總和必須等於實收金額才能送出（即時校驗）
3. 業務手動修改後與系統初次填滿值不同的紀錄會標「手動覆寫」（diff-based 判定，避免業務只是點輸入框沒實際改值被誤標）
4. 實收超過全部未收金額時，溢收部分掛「預收（未分配）」桶供後續核銷新期次或退款處理
5. 業務切收款為「已完成」前可隨意調整分配；切已完成後仍可調整但留異動軌跡（保留可修正性，避免硬鎖死污染對帳紀錄）

## UI 操作（易變層）

<!-- ui-binding: prototype-v1 -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/PaymentAllocationDialog.tsx -->

> 待 task 4.5/4.6 OrderInvoiceSection 整合後接入完整 Payment 登錄流程。

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 收款核銷分配（PaymentAllocation 依序填滿 + 業務手動覆寫）
- design.md § Decisions D3
