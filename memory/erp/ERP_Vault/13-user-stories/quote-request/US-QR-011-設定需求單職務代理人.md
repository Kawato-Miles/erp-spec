---
type: user-story
us-id: US-QR-011
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
  - "openspec/specs/quote-request/spec.md#Requirement: 檢視權限管理"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-001-建立需求單]]：需求單已建立"
  - "業務為需求單擁有者"
  - "業務預期缺席需委託代理"
---

# US-QR-011 設定需求單職務代理人

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能新增指定同事的編輯授權作為職務代理人

### 以便
我請假或缺席時同事可代為跟進需求單進度

### 前置條件
- 業務為需求單擁有者
- 業務預期缺席（如請假），需委託同事代為跟進進行中的需求單
- 同事已於系統建立帳號

### 業務流程

1. 業務於需求單詳情進入權限管理區
2. 業務搜尋指定同事
3. 業務新增「編輯」權限（職務代理人）給該同事
4. 被授權同事可代為編輯需求單、推進狀態（如：進入議價 / 成交 / 流失）、回覆客戶議價內容
5. 業務（擁有者）可於權限管理區檢視當前授權清單
6. 業務可隨時移除授權，移除後即時生效（被移除者無法再編輯）

### 成功條件

1. 業務可新增指定同事的編輯授權（職務代理人）
2. 被授權同事可代為編輯需求單與推進狀態，操作紀錄歸屬被授權同事（活動紀錄含實際操作者）
3. 業務可檢視當前授權清單並隨時移除
4. 授權移除即時生效（被移除者編輯操作會被系統拒絕）

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「檢視權限管理」L152-169（編輯授權部分）
- 原 Notion User Story DB `US-QR-011`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 檢視權限管理（編輯 vs 檢視分離）
- 補活動紀錄歸屬「實際操作者」（業務情境上代理人操作須留稽核軌跡）
- 邊界：本卡涵蓋編輯權限（代理人）；檢視權限由 [[US-QR-010-分享需求單給同事參考]] 處理
