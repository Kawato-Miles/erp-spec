---
type: user-story
us-id: US-QR-009
module:
  - quote-request
role:
  - "[[業務]]"
priority: medium
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 需求單建立與編輯"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic: []
related-entities:
  - "[[需求單]]"
related-oq: []
related-test-cases: []
prerequisites:
  - 業務遇到與過往案件規格相似的新詢價
  - 過往需求單存在系統中（任意狀態）
---

# US-QR-009 複製需求單

## 業務情境

### 作為
[[業務]]

### 我希望
能複製過往需求單作為新需求單的起點

### 以便
類似規格的新詢價可快速建單，業務不需重填重複資料

### 前置條件
- 業務遇到與過往案件規格相似的新詢價
- 過往需求單存在系統中（任意狀態，含已成交 / 流失）

### 業務流程

1. 業務於需求單列表找到相似的過往需求單
2. 業務執行「複製」
3. 系統建立新需求單並自動帶入：
   - 客戶資料 / 印件規格 / 接單公司
   - 印件項目（規格、數量、報價結構）
4. 系統依新需求單的接單公司**重新推導**帳務公司（不直接複製原值，確保推導規則一致；依 spec L43）
5. 新需求單狀態為「需求確認中」，業務可調整差異欄位（如：客戶要求更換紙材、調整數量）
6. 新需求單與原需求單建立關聯（可選追溯，業務知道來源）

### 成功條件

1. 業務可於需求單列表執行「複製」建立新需求單，自動帶入客戶 / 印件規格 / 接單公司
2. 系統依新需求單接單公司重新推導帳務公司（不沿用原值）
3. 新需求單狀態為「需求確認中」，業務可進一步編輯
4. 新需求單與原需求單建立關聯欄位，業務可追溯複製來源（業務可選擇性查看歷史報價脈絡）

## 來源（provenance）

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「需求單建立與編輯」L40-44（Scenario US-QR-009）
- 原 Notion User Story DB `US-QR-009`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L40-44 補「依新接單公司重新推導帳務公司」核心紀律（避免直接複製造成推導規則不一致）
- 補關聯追溯（業務上有需要查歷史脈絡）
