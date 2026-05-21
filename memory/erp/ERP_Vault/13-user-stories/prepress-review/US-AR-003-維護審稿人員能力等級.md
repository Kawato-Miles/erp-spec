---
type: user-story
us-id: US-AR-003
module:
  - prepress-review
role:
  - "[[03-roles/審稿主管]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
  - "[[04-business-logic/審稿分配規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/審稿分配規則]]"
  - "[[04-business-logic/難易度機制]]"
related-entities: []
related-test-cases: []
---

# US-AR-003 維護審稿人員能力等級

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能設定每位審稿員可承擔的最高印件難易度

### 以便
系統自動分派時不把超出能力的印件派給審稿員，保持分派合理性與審稿品質

### 前置條件
- 審稿部門人員已建立於系統

### 業務流程

1. 審稿主管查看審稿部門所有審稿員清單與當前能力等級
2. 審稿主管依審稿員實際表現與經驗，調整其能力等級（1-10）
3. 系統紀錄調整事件（時間、調整前後等級、調整原因），供後續追蹤

### 成功條件

1. 每位審稿員有可維護的能力等級欄位（1-10 整數）
2. 等級調整事件留有活動紀錄供事後追蹤
3. 調整後新分派立即套用新等級（既有未完成分派不自動回收）

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
- [[04-business-logic/審稿分配規則]]
- 原 Notion User Story DB `US-AR-003`（2026-05-21 遷入）
