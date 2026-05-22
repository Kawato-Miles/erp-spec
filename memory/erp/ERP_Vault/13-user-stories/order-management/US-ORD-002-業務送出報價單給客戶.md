---
type: user-story
us-id: US-ORD-002
module:
  - order-management
role:
  - "[[03-roles/業務]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單狀態機"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
---

# US-ORD-002 業務送出報價單給客戶

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能將訂單狀態手動推進至「報價待回簽」

### 以便
明確區分「審完未送」與「已送等回簽」兩個業務階段，業務知道哪些單要追客戶回簽

### 前置條件
- 訂單狀態為「審核通過」（已通過 [[US-ORD-001-業務主管訂單審核]]）
- 業務已透過外部管道（即時通訊 / 電子郵件 / 紙本）將報價單送給客戶

### 業務流程

1. 業務主管核可訂單後，業務於外部管道將報價單送給客戶
2. 業務於訂單詳情執行「已送報價單」
3. 系統將訂單狀態從「審核通過」推進至「報價待回簽」
4. 系統寫入活動紀錄（事件描述：送出報價單 + 業務姓名 + 時間）

### 成功條件

1. 業務可於「審核通過」狀態執行「已送報價單」推進至「報價待回簽」
2. 送出動作須於系統內手動觸發（系統不自動推進，因外部送出動作系統無法偵測）
3. 活動紀錄留送出時間與操作者，便於後續追蹤回簽進度
4. 狀態為「報價待回簽」的訂單於業務待辦清單顯示為「等候回簽」分類，便於業務批次追客戶

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/order/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單狀態機」L190+
- 原 Notion User Story DB `US-ORD-002`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單狀態機「審核通過 → 報價待回簽」由業務手動推進
- 補「外部送出動作系統無法偵測，須手動」設計理由
- 邊界：上游 [[US-ORD-001]] 處理審核；下游 [[US-ORD-003]] 處理回簽
