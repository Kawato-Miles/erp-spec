---
type: user-story
us-id: US-QR-012
module:
  - quote-request
role:
  - "[[03-roles/業務]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 評估印務主管指定"
  - "openspec/specs/quote-request/spec.md#Requirement: 評估印務主管欄位 lifecycle"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-001-建立需求單]]：需求單為「需求確認中」狀態"
  - "系統內存在具印務主管角色的用戶"
---

# US-QR-012 設定評估印務主管

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能指定特定印務主管負責評估報價

### 以便
分散印務主管工作量並依專長指派評估人員

### 前置條件
- 需求單為「需求確認中」狀態（評估前可指定）
- 系統內存在具印務主管角色的用戶

### 業務流程

1. 業務於建立需求單時從印務主管清單選擇指定評估人員
2. 系統限定可選人員為**具印務主管角色的用戶**（不可選一般印務 / 業務 / 其他角色）
3. 業務於「需求確認中」狀態可修改評估印務主管欄位
4. 業務執行「送印務評估」後需求單推進至「待評估成本」，**評估印務主管欄位鎖定為唯讀**（不可再改）
5. 指定的印務主管於待辦清單看到此需求單

### 成功條件

1. 業務於「需求確認中」狀態可選 / 改評估印務主管
2. 可選清單限定為具印務主管角色的用戶
3. 送印務評估後欄位鎖定為唯讀，業務無法再改
4. 指定的印務主管於待辦清單看到此需求單

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「評估印務主管指定」L127-132 + § Requirement「評估印務主管欄位 lifecycle」L275-294
- 原 Notion User Story DB `US-QR-012`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L127-132 角色限定（限印務主管角色）+ 鎖定 lifecycle
- 與 [[US-QR-001-建立需求單]] 邊界：QR-001 step 3 簡述指定動作；本卡涵蓋指定後欄位 lifecycle 細節
