---
type: user-story
us-id: US-ORD-005
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-28
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單建立"
  - "openspec/specs/order-management/spec.md#Requirement: 帳務公司管理（BillingCompany）"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "訂單已成立"
  - "業務為訂單擁有者或職務代理人"
---

# US-ORD-005 訂單發票與配送資訊編輯

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能編輯訂單的開票資訊與出貨資訊

### 以便
開票與出貨資訊與訂單關聯統一管理，後續開立發票 / 配送自動帶入正確資訊

### 前置條件
- 訂單已成立
- 業務為訂單擁有者或職務代理人

### 業務流程

1. 業務於訂單詳情查看開票資訊與出貨資訊兩個獨立區塊
2. 業務編輯開票相關欄位：開票公司 / 抬頭 / 統編 / 地址
3. 業務編輯出貨相關欄位：出貨地址 / 出貨方式 / 預計出貨日
4. 系統寫入活動紀錄（事件描述：發票資訊變更 / 出貨資訊變更 + 變更前 / 變更後內容）
5. 後續開立發票自動帶入開票公司 / 抬頭 / 統編 / 地址；後續建立出貨單自動帶入出貨地址 / 方式 / 預計日

### 成功條件

1. 開票公司 / 抬頭 / 統編 / 地址可獨立編輯（不互相連動，業務可分別維護）
2. 出貨地址 / 方式 / 預計出貨日可獨立編輯
3. 變更於活動紀錄留痕（含變更前 / 變更後內容）
4. 後續開立發票 / 建立出貨單時自動帶入對應資訊

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單建立」L21+ + § Requirement「帳務公司管理（BillingCompany）」L791+
- 原 Notion User Story DB `US-ORD-005`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單建立 + § 帳務公司管理
- 補活動紀錄變更前後 diff
- 邊界：發票實際開立由 § Invoice 流程處理（不在本卡）；出貨單實際建立由出貨模組處理（不在本卡）
