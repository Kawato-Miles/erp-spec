---
type: user-story
us-id: US-ORD-003
module:
  - order-management
role:
  - "[[業務]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單確認觸發"
  - "openspec/specs/order-management/spec.md#Requirement: OrderSignedFile 訂單回簽附件"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-ORD-002-業務送出報價單給客戶]]：訂單狀態為「報價待回簽」"
  - 客戶已透過外部管道送回回簽紙本 / 電子檔
---

# US-ORD-003 業務上傳回簽檔案

## 業務情境（穩定層）

### 作為
[[業務]]

### 我希望
能上傳客戶回簽檔案讓訂單推進至「已回簽」

### 以便
訂單狀態反映客戶正式同意，觸發後續工單建立與製作流程

### 前置條件
- 訂單狀態為「報價待回簽」（已執行 [[US-ORD-002-業務送出報價單給客戶]]）
- 客戶已透過外部管道將回簽紙本 / 電子檔送回業務

### 業務流程

1. 業務收到客戶回簽（紙本掃描 / 電子簽署檔）
2. 業務於訂單詳情上傳回簽檔案（OrderSignedFile）
3. 系統將訂單狀態自動推進至「已回簽」（後續視業務需求觸發訂單確認流程）
4. 系統寫入活動紀錄（含上傳操作者 / 時間戳 / 檔案名稱）

### 成功條件

1. 業務可於「報價待回簽」狀態上傳回簽檔案
2. 上傳成功後訂單狀態自動推進至「已回簽」
3. 回簽檔案保留於訂單供事後追溯（含上傳時間、操作者）
4. 活動紀錄留上傳事件供稽核

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單確認觸發」L108+ + § Requirement「OrderSignedFile 訂單回簽附件」L2133+
- 原 Notion User Story DB `US-ORD-003`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單確認觸發「上傳回簽 → 已回簽」自動推進
- 對齊 spec § OrderSignedFile 補檔案保留 / 追溯
- 邊界：上游 [[US-ORD-002]] 送出報價；下游進入工單建立流程（不在本卡）
