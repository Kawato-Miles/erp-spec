---
type: user-story
us-id: US-ORD-021
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[業務]]"
  - "[[諮詢]]"
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

# US-ORD-021 業務於請款期次一鍵開立發票

## 業務情境（穩定層）

### 作為
[[業務]]

### 我希望
在請款期次到開票時點時，一鍵從期次資料生成發票，發票自動繼承期次的應收日、備註、品項

### 以便
避免從預計發票拿資料 → 再到開票表單貼一遍的重複輸入；確保發票與期次資料完全對齊（期次↔發票 1:1 嚴格約束）

### 前置條件
- 訂單下存在「未開立」狀態的請款期次
- 業務有開票權限
- 期次的品項、買受人資訊已準備好（可於開票前最後微調）

### 業務流程
1. 業務於請款期次列表點該期的「一鍵開立發票」
2. 系統開出發票表單預填來源期次的品項 / 預計金額 / 買受人資訊（從訂單繼承）
3. 業務確認或微調發票內容（如：選 B2B/B2C、確認統編、調整品項）
4. 業務送出後系統建立發票紀錄、寫入發票↔期次反向指針（sourceBillingInstallmentId）
5. 系統推進該期次的「開票維度」狀態為「已開立」

### 成功條件（acceptance criteria）

1. 系統強制每張發票對應唯一一筆請款期次（NOT NULL UNIQUE FK）
2. 發票自動繼承來源期次的品項與業務備註（後續期次品項異動不連動既有發票，沿用 v1.13 鏈式預填無連動規則）
3. 期次開票後「開票維度」狀態 = 已開立、「收款維度」狀態保留不動（雙維度獨立）
4. 若期次已有對應發票（已開立 / 已作廢回未開立），一鍵開票按鈕不顯示重複開立入口

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/OrderInvoiceSection.tsx（task 4.5 整合中）-->

> task 4.5 整合 OrderInvoiceSection 後填寫具體 UI 步驟。

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承
