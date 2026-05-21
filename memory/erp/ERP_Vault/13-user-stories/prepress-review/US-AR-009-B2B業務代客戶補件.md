---
type: user-story
us-id: US-AR-009
module:
  - prepress-review
  - order-management
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
  - "[[04-business-logic/稿件管理規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
  - "[[05-entities/訂單]]"
related-test-cases: []
---

# US-AR-009 B2B 業務代客戶補件

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
收到審稿退件通知後，能在訂單詳情看到退件原因，並直接補上客戶新提供的稿件與補件說明

### 以便
不必再透過即時通訊軟體往返傳檔，補件與退件原因對應清楚，審稿員重審時看得到業務的補件說明

### 前置條件
- 訂單印件審稿不合格
- 業務已收到退件通知

### 業務流程

1. 業務收到退件通知後，查看該印件的審稿不合格原因與審稿備註
2. 業務與客戶（B2B 客戶）聯繫，取得修改後的新稿件
3. 業務上傳新稿件至訂單對應印件
4. 業務（選填）填寫補件說明，描述本次修改重點
5. 業務送出補件，系統將印件狀態轉為「已補件」並回送原審稿員待審清單

### 成功條件

1. 業務可在訂單詳情看到印件的退件原因與審稿備註
2. 業務可在訂單詳情直接上傳新稿件完成補件
3. 業務可選填補件說明，內容會在審稿員重審時可見
4. 補件完成後印件狀態自動轉為「已補件」，並自動回到原審稿員的待審清單

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md)
- [[04-business-logic/稿件管理規則]]
- 原 Notion User Story DB `US-AR-009`（2026-05-21 遷入）
