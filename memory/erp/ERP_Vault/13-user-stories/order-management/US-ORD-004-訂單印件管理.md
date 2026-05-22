---
type: user-story
us-id: US-ORD-004
module:
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 多印件管理"
  - "openspec/specs/order-management/spec.md#Requirement: 訂單階段印件規格編輯時機"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
  - "[[05-entities/印件]]"
related-oq: []
related-test-cases: []
---

# US-ORD-004 訂單印件管理

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能於訂單詳情新增 / 編輯多筆印件並設定免審稿標記

### 以便
訂單成立後仍可調整印件結構，免審稿印件可加速生產

### 前置條件
- 訂單已成立且尚未進入製作完成階段
- 業務為訂單擁有者或職務代理人

### 業務流程

1. 業務於訂單詳情查看印件清單
2. 業務於訂單階段（指定時機，依 spec § 訂單階段印件規格編輯時機）可新增 / 編輯印件
3. 業務為每筆印件設定獨立規格 / 數量 / 免審稿標記
4. 免審稿印件自動跳過審稿環節，直接建立合格的審稿輪次（依 [[US-AR-002-設定印件難易度與免審稿]] 免審稿快速路徑）
5. 系統寫入印件 ActivityLog（事件描述：印件新增 / 修改 + 業務姓名 + 變更內容）

### 成功條件

1. 業務可於訂單詳情新增多筆印件，每筆獨立設定規格 / 數量 / 免審稿
2. 免審稿印件自動跳過審稿環節進入製程審核（連動 [[US-AR-002]]）
3. 訂單階段印件規格編輯時機依 spec 限制（金額異動由訂單異動流程處理；本卡涵蓋規格編輯）
4. 印件異動寫入 ActivityLog 供事後稽核

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「多印件管理」L157+ + § Requirement「訂單階段印件規格編輯時機」L1821+
- 原 Notion User Story DB `US-ORD-004`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 多印件管理 + § 訂單階段印件規格編輯時機（v1.7 refine-order-detail-tabs 歸檔變更）
- 補免審稿連動 [[US-AR-002]]
- 邊界：金額異動由訂單異動流程處理（不在本卡）；規格編輯由本卡涵蓋
