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
last-reviewed: 2026-06-03
source:
  - openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md
  - openspec/changes/converge-consultation-cancel-to-order-cancel-flow/specs/order-management/spec.md § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單
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
月底跑批次自動產出「三方對帳差錯訂單清單」（涵蓋 status ∈ {訂單完成, 已取消} 且有開立發票的訂單，篩出應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額者）讓會計檢視

### 以便
取代過去依賴 Excel 人工逐張核對的對帳工作；CEO 指標 2 量測來源（目標差錯訂單率 ≤ 1%）；無需另建會計回饋系統（CEO Challenge 1 採 (c) 路徑）

### 前置條件
- 訂單 status ∈ {訂單完成, 已取消} 且該訂單有 status=開立 的發票（涵蓋已取消但有認列收入的訂單，根治諮詢取消留存 1000／一般訂單取消保留部分收入的漏帳；待開票中間態仍排除）
- 月結批次邏輯已上線

### 業務流程
1. 月結批次跑「三方對帳差錯訂單清單」（每月一次或會計手動觸發）
2. 批次計算偵測集合內每張訂單（status ∈ {訂單完成, 已取消} 且有開立發票）的三方對帳：應收（含已執行訂單異動）vs 發票淨額（已開立合計 − 已確認折讓）vs 收款淨額（已完成收款含退款負值）
3. 差額 ≠ 0 的訂單列入差錯清單推送給會計
4. 會計檢視清單後 Slack 通知對應訂單業務 / 諮詢追查原因（人工閉環，不另建系統內回饋機制）
5. 業務修正資料（如補建期次、補登收款、開折讓單）後下次批次重跑驗證對帳通過
6. 若訂單已取消但尚未開立任何發票，由「應收 > 發票淨額」差額警示提醒未開票（取代已廢除的諮詢專屬自動建待開發票機制）

### 成功條件（acceptance criteria）

1. 批次偵測集合 = status ∈ {訂單完成, 已取消} 且有 status=開立 發票的訂單（推翻 unify-billing 限訂單完成拍板，根治已取消但有認列收入訂單漏帳；待開票中間態仍排除）
2. 差錯判定使用三方對帳 invariant：應收 ≠ 發票淨額 OR 應收 ≠ 收款淨額
3. 已取消但尚無發票的訂單由「應收 > 發票淨額」差額警示兜底（不依賴諮詢專屬自動建待開發票）
4. 差錯訂單率 = 差錯訂單數 / 偵測集合訂單數（status ∈ {訂單完成, 已取消} 且有開立發票），目標 ≤ 1%（CEO 指標 2）
5. 會計收到清單後透過 Slack / Email 人工聯絡業務追查（不需要系統內回饋系統，避免額外開發成本）

## 來源（provenance）

- openspec/changes/unify-billing-installment-and-reconciliation-csv/specs/order-management/spec.md § Requirement: 三方對帳差錯訂單清單
- openspec/changes/converge-consultation-cancel-to-order-cancel-flow/specs/order-management/spec.md § Requirement: 對帳差錯偵測涵蓋已取消但有開立發票訂單
- design.md § KPI 對齊 § CEO 指標 2 + Challenge 1 採納 (c) 路徑
- [[BI-8-月結閉檔批次觸發時點]]

## 校對紀錄

### 第二輪（2026-06-03，對齊 converge-consultation-cancel-to-order-cancel-flow change）
- 三方差錯偵測集合由「限訂單完成」擴為「status ∈ {訂單完成, 已取消} 且有開立發票」，根治已取消但有認列收入（諮詢取消留存 1000／一般訂單取消保留部分收入）的漏帳；待開票中間態仍排除。
- 補兜底機制：已取消但尚無發票的訂單由「應收 > 發票淨額」差額警示涵蓋，取代已廢除的諮詢專屬自動建待開發票機制。
- 差錯訂單率分母由「總已完成訂單數」改為「偵測集合訂單數」以對齊擴大後範圍。
