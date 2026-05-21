---
type: user-story
us-id: US-AR-011
module:
  - prepress-review
role:
  - "[[03-roles/審稿]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
  - "[[04-business-logic/打樣流程]]"
  - "[[04-business-logic/稿件管理規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 2：打樣決策流程]]"
related-business-logic:
  - "[[04-business-logic/打樣流程]]"
  - "[[04-business-logic/稿件管理規則]]"
related-entities:
  - "[[05-entities/印件]]"
related-test-cases: []
---

# US-AR-011 打樣後重新處理稿件

> 本卡為原 Notion 上重複編碼之 US-AR-002 重新編號而來。詳見 [[AR-2-Notion-US-AR-002編碼重複處理]]。

## 業務情境（穩定層）

### 作為
[[03-roles/審稿]]

### 我希望
當打樣不合格且問題根因為稿件本身（非製程問題）時，能讓客戶提供修改後的新稿件，重新走完整審稿流程

### 以便
打樣後發現的稿件問題能正確回到稿件源頭處理，避免將稿件問題誤認為製程問題而錯誤調整生產設定

### 前置條件
- 打樣結果為不合格
- 根因分析判定問題來自稿件（非製程）

### 業務流程

1. 打樣結果經分析確認問題來自稿件
2. 業務與客戶聯繫，取得修改後的新稿件
3. 新稿件視為全新審稿歷史，重新進入審稿流程（與 [[US-AR-001-審核稿件]] 主流程一致）
4. 新稿件經審稿通過後，可重新安排打樣

### 成功條件

1. 打樣不合格且根因為稿件問題時，可由客戶 / 業務提供修改後的新稿件
2. 新稿件視為全新審稿歷史，重新走完審稿流程
3. 新稿件審核通過後可重新安排打樣，不需重複先前已通過的審稿動作

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：sens-erp-prototype/src/components/prepress/（待 Prototype 定案後補） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md)
- [[04-business-logic/打樣流程]]
- [[04-business-logic/稿件管理規則]]
- 原 Notion User Story DB `US-AR-002`（編碼重複版，2026-05-21 重新編號為 US-AR-011 並遷入）

## 相關 OQ

- [[AR-2-Notion-US-AR-002編碼重複處理]]：Notion 端歷史資料如何處理待 Miles 確認
