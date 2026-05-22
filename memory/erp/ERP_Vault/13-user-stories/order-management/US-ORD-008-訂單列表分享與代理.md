---
type: user-story
us-id: US-ORD-008
module:
  - order-management
role:
  - "[[03-roles/業務]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單列表與分享權限"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "業務已建立訂單"
  - "業務為訂單擁有者"
---

# US-ORD-008 訂單列表分享與代理

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能授予同事訂單的檢視或編輯權限

### 以便
請假時有同事代為跟進，或需要分享訂單給同事參考

### 前置條件
- 業務為訂單擁有者
- 同事已於系統建立帳號

### 業務流程

1. 業務於訂單詳情進入權限管理區
2. 業務搜尋指定同事
3. 業務授予「檢視」或「編輯」權限
4. 被授權同事依權限存取訂單：
   - 檢視權限：可查閱訂單但不可改
   - 編輯權限（代理人）：可代為推進狀態與修改訂單
5. 業務可於權限管理區檢視當前授權清單並隨時移除（移除即時生效）

### 成功條件

1. 業務可授予同事檢視或編輯權限
2. 被授權同事依權限存取訂單，編輯權限同事可代為推進狀態（活動紀錄歸屬實際操作者）
3. 業務可檢視當前授權清單並隨時移除
4. 授權移除即時生效，被移除者立即無法存取
5. 分享行為與 [[US-QR-010-分享需求單給同事參考]] / [[US-QR-011-設定需求單職務代理人]] 採同一授權邏輯元件（跨模組一致）

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單列表與分享權限」L248+
- 原 Notion User Story DB `US-ORD-008`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單列表與分享權限
- 補與 [[US-QR-010]] / [[US-QR-011]] 跨模組授權元件一致性說明
- 補活動紀錄歸屬實際操作者（職務代理人模式對齊 QR-011）
