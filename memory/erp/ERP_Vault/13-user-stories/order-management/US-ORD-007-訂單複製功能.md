---
type: user-story
us-id: US-ORD-007
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
  - "openspec/specs/order-management/spec.md#Requirement: 訂單建立"
related-spec: openspec/specs/order-management/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[05-entities/訂單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "業務遇到老客戶重複下單需求"
  - "原訂單仍保留於系統（任意狀態）"
---

# US-ORD-007 訂單複製功能

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
能從歷史訂單一鍵複製建立新訂單

### 以便
老客戶「照上次一樣」的重複下單可快速建單，業務不需重輸入印件規格

### 前置條件
- 業務遇到老客戶重複下單需求
- 原訂單仍保留於系統（任何狀態，含已完成）

### 業務流程

1. 業務於訂單列表找到要複製的歷史訂單
2. 業務執行「複製訂單」
3. 系統建立新訂單並自動帶入：
   - 客戶資料（接單公司 / 帳務公司 / 統編 / 聯絡人）
   - 印件規格（含預計產線、難易度、免審稿標記）
   - 價格欄位（成本 / 報價 / 毛利率）
4. 系統依新訂單的接單公司**重新推導**帳務公司（不直接複製原值；對齊 [[US-QR-009-複製需求單]] 同樣紀律）
5. 新訂單狀態為「草稿」，業務可調整差異欄位（如：客戶要求新規格 / 數量調整）
6. 新訂單與原訂單建立關聯欄位作為複製來源追溯

### 成功條件

1. 業務可於訂單列表執行「複製訂單」建立新訂單，自動帶入客戶 / 印件規格 / 報價結構
2. 系統依新訂單接單公司重新推導帳務公司（不沿用原值）
3. 新訂單狀態為「草稿」，業務可進一步編輯
4. 新訂單與原訂單建立關聯，可追溯複製來源

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

- [`openspec/specs/order-management/spec.md`](../../../../openspec/specs/order-management/spec.md) v1.7 § Requirement「訂單建立」L21+
- 原 Notion User Story DB `US-ORD-007`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 沿用 [[US-QR-009-複製需求單]] 帳務公司推導紀律（不直接複製）
- 補關聯追溯
- 邊界：訂單複製建立後一切流程同既有訂單（不在本卡擴充）
