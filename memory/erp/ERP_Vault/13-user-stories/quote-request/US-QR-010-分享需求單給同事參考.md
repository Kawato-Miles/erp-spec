---
type: user-story
us-id: US-QR-010
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
---

# US-QR-010 分享需求單給同事參考

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能新增指定同事的檢視授權

### 以便
同事參考過往報價方案或成本邏輯時可看到需求單內容（不可編輯）

### 前置條件
- 業務為需求單擁有者
- 同事已於系統建立帳號

### 業務流程

1. 業務於需求單詳情進入權限管理區
2. 業務搜尋指定同事
3. 業務新增「檢視」權限給該同事
4. 被授權同事可查閱需求單內容（含印件規格 / 報價 / 議價歷史），但不可編輯
5. 業務（擁有者）可於權限管理區檢視目前授權清單
6. 業務可隨時移除授權，移除後即時生效

### 成功條件

1. 業務可新增指定同事的檢視授權
2. 被授權同事可查閱完整內容但不可編輯（系統阻擋編輯動作）
3. 業務可檢視當前授權清單並隨時移除授權
4. 授權移除即時生效，被移除者立即無法查看

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「檢視權限管理」L152-169
- 原 Notion User Story DB `US-QR-010`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 檢視權限管理（檢視 vs 編輯權限分離）
- 邊界：本卡涵蓋檢視權限；編輯權限（代理人）由 [[US-QR-011-設定需求單職務代理人]] 處理
