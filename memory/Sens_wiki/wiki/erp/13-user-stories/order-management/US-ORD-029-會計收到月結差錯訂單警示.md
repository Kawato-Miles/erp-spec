---
type: user-story
us-id: US-ORD-029
module:
  - order-management
business-domain:
  - billing-cash
role:
  - "[[會計]]"
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

# US-ORD-029 會計收到月結差錯訂單警示清單

## 業務情境

### 作為
[[會計]]

### 我希望
月底跑批次自動產出「三方對帳差錯訂單清單」（已完成訂單中應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額）讓會計檢視

### 以便
取代過去依賴 Excel 人工逐張核對的對帳工作；CEO 指標 2 量測來源（目標差錯訂單率 ≤ 1%）；無需另建會計回饋系統（CEO Challenge 1 採 (c) 路徑）

### 前置條件
- 訂單狀態為「訂單完成」（限定已完成訂單避免誤計入「待開票」中間態）
- 月結批次邏輯已上線

### 業務流程
1. 月結批次跑「三方對帳差錯訂單清單」（每月一次或會計手動觸發）
2. 批次計算每張已完成訂單的三方對帳：應收（含已執行訂單異動）vs 發票淨額（已開立合計 − 已確認折讓）vs 收款淨額（已完成收款含退款負值）
3. 差額 ≠ 0 的訂單列入差錯清單推送給會計
4. 會計檢視清單後 Slack 通知對應訂單業務 / 諮詢追查原因（人工閉環，不另建系統內回饋機制）
5. 業務修正資料（如補建期次、補登收款、開折讓單）後下次批次重跑驗證對帳通過

### 成功條件（acceptance criteria）

1. 批次限定 Order.status = '訂單完成'（避免誤計入待開票中間態，顧問 C-CEO-2 採納）
2. 差錯判定使用三方對帳 invariant：應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額
3. 差錯訂單率 = 差錯訂單數 / 總已完成訂單數，目標 ≤ 1%（CEO 指標 2）
4. 會計收到清單後透過 Slack / Email 人工聯絡業務追查（不需要系統內回饋系統，避免額外開發成本）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 三方對帳差錯訂單清單
- design.md § KPI 對齊 § CEO 指標 2 + Challenge 1 採納 (c) 路徑
- [[BI-8-月結閉檔批次觸發時點]]
