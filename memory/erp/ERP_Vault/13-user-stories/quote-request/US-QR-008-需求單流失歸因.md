---
type: user-story
us-id: US-QR-008
module:
  - quote-request
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 需求單流失歸因"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-002-管理需求單進度]]：需求單已進入議價中"
  - "業務判斷客戶不成交"
---

# US-QR-008 需求單流失歸因

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
客戶不成交時能結構化記錄流失原因

### 以便
管理層分析流失原因比例，作為後續報價策略 / 成本結構 / 業務培訓的依據

### 前置條件
- 需求單狀態為「議價中」
- 業務判斷客戶不成交

### 業務流程

1. 業務於「議價中」狀態執行「流失」
2. 系統要求業務自結構化清單（LOV）選擇流失原因（如：價格過高 / 客戶取消 / 無法製作 / 找其他廠商 / 客戶預算不足 等）
3. 業務（選填）填寫流失補充說明
4. 系統將需求單狀態標記為「流失」終態（不可逆）
5. 系統寫入活動紀錄（事件描述：流失 + 流失原因 + 業務姓名 + 補充說明）
6. 諮詢來源需求單流失時觸發建諮詢訂單收尾（依 spec § 諮詢來源需求單流失觸發建諮詢訂單，付款轉移至諮詢訂單）

### 成功條件

1. 業務執行「流失」時必選結構化流失原因（LOV），不可跳過
2. 業務可選填補充說明
3. 流失終態**不可逆**（標記後無法退回議價）
4. 流失原因依結構化分類記錄，管理層可分析比例（如：價格過高佔 X%、找其他廠商佔 Y%）
5. 諮詢來源需求單流失時系統自動建諮詢訂單並轉移付款（連動 [[07-scenarios]] 諮詢流程）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/quote/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「需求單流失歸因」L198-204 + § Requirement「諮詢來源需求單流失觸發建諮詢訂單」L443+
- 原 Notion User Story DB `US-QR-008`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L107「MUST 選擇流失原因 LOV」必選紀律
- 補諮詢來源流失觸發建諮詢訂單（spec L443+，連動 [[US-CR-004]]）
- 補不可逆終態（spec § 狀態機）
- LOV 具體項目對齊 [[PI-009]] 模式（spec L129 退件原因設計類比）
