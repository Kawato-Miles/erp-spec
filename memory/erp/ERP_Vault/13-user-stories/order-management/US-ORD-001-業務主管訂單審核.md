---
type: user-story
us-id: US-ORD-001
module:
  - order-management
role:
  - "[[03-roles/業務主管]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 業務主管核准訂單"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單業務主管審核欄位"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
---

# US-ORD-001 業務主管訂單審核

## 業務情境（穩定層）

### 作為
[[03-roles/業務主管]]

### 我希望
能於訂單審核清單看到待審訂單並核可或退回

### 以便
訂單內容正確才提供給客戶，避免錯誤報價外流造成內部爭議或公司損失

### 前置條件
- 業務或諮詢已建立訂單並送出主管審核
- 訂單狀態為「待主管審核」
- 業務主管角色已分派並為該訂單的指定審核人

### 業務流程

1. 業務主管於訂單審核清單看到所有狀態為「待主管審核」的訂單
2. 業務主管進入訂單詳情檢視印件規格 / 金額 / 付款條件 / 客戶資料
3. 業務主管依檢視結果執行：
   - **核可**：訂單狀態推進至「審核通過」，業務可繼續推進送出報價單流程（[[US-ORD-002-業務送出報價單給客戶]]）
   - **退回**：填寫退回原因，訂單狀態回「草稿」狀態供業務修正後重送
4. 系統寫入活動紀錄（事件描述：訂單核可 / 退回 + 業務主管姓名 + 時間 + 退回時含原因）

### 成功條件

1. 業務主管可看到所有狀態為「待主管審核」的訂單（不限於自己建立的）
2. 核可後訂單狀態推進至「審核通過」，業務可繼續推進
3. 退回時必須填寫退回原因；訂單狀態回「草稿」供業務修正
4. 核可 / 退回動作皆寫入活動紀錄供事後稽核

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「業務主管核准訂單」L684+ + § Requirement「訂單業務主管審核欄位」L653+
- 原 Notion User Story DB `US-ORD-001`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 業務主管核准訂單核可 / 退回流程
- 補活動紀錄事件
- 與 [[US-QR-002-管理需求單進度]] 差異：需求單議價中業務直接推進不需業務主管核可；訂單階段才有業務主管 gate
