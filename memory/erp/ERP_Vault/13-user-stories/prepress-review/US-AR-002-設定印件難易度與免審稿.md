---
type: user-story
us-id: US-AR-002
module:
  - prepress-review
  - quote-request
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
related-entities:
  - "[[05-entities/印件]]"
  - "[[05-entities/需求單]]"
related-test-cases: []
---

# US-AR-002 設定印件難易度與免審稿

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
在需求單建立印件時，能標註該印件的審稿難易度與是否需要審稿

### 以便
系統可依難易度自動分派合適的審稿員；標記為免審稿的印件可略過審稿環節加速出貨

### 前置條件
- 需求單已建立
- 印件項目建立中（尚未送出）

### 業務流程

1. 業務於需求單建立印件時，評估稿件審稿複雜度，標註難易度等級
2. 業務判斷是否屬於免審稿情境（如客戶提供的稿件已多次合作驗證、單純文字稿件等），可勾選免審稿快速路徑
3. 需求單成交轉訂單時，系統自動將難易度與免審稿標記繼承至訂單對應印件

### 成功條件

1. 印件可標註難易度等級（1-10 整數）
2. 印件可標註是否免審稿（可單獨設定或與難易度共存）
3. 需求單成交轉訂單時，難易度與免審稿標記自動繼承至訂單印件，無需業務重新輸入

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md)
- [[04-business-logic/難易度機制]]
- [[04-business-logic/免審決策樹]]
- 原 Notion User Story DB `US-AR-002`（2026-05-21 遷入）
