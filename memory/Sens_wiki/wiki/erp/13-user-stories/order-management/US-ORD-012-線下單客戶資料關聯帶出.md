---
type: user-story
us-id: US-ORD-012
module:
  - order-management
business-domain:
  - order-management
role:
  - "[[業務]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-28
source:
  - "openspec/specs/order-management/spec.md#Requirement: 訂單聯絡人"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 客戶資料已建立於廠客模組
  - 訂單類型為線下單（非 B2C 自助下單）
---

# US-ORD-012 線下單客戶資料關聯帶出

## 業務情境（穩定層）

### 作為
[[業務]]

### 我希望
線下單訂單的客戶資料採關聯帶出而非寫死

### 以便
客戶改名 / 統編變更時不需逐張訂單修改，資料一致性自動保證

### 前置條件
- 客戶資料已建立於廠客模組
- 訂單類型為線下單（非 B2C 自助下單）

### 業務流程

1. 業務於建立訂單時選擇客戶（從廠客模組關聯）
2. 訂單客戶欄位顯示為廠客模組關聯（非靜態快照）
3. 廠客資料異動後（如：客戶改名、統編變更），訂單客戶顯示同步更新
4. 例外處理：已開立發票的訂單，客戶資料採「快照」保留當時值（不被廠客資料異動覆寫，符合會計法規）

### 成功條件

1. 訂單客戶欄位採廠客模組關聯，非寫死快照
2. 廠客資料異動後既有訂單客戶顯示同步更新（資料一致性自動保證）
3. **已開發票的訂單**保留當時客戶資料快照，不被廠客模組異動覆寫
4. 異動軌跡可於廠客模組活動紀錄追溯

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單聯絡人」L1762+
- 原 Notion User Story DB `US-ORD-012`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec § 訂單聯絡人關聯模式
- 補「已開發票快照」邊界（會計法規要求發票客戶資料不可被後續異動覆寫）
- 邊界：廠客模組本身的客戶資料維護不在本卡範疇
