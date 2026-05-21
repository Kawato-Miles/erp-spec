---
type: user-story
us-id: US-AR-006
module:
  - prepress-review
role:
  - "[[03-roles/審稿主管]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-AR-006 比對審稿人員績效

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能看每位審稿員在指定時間區間（今日 / 本週 / 本月）的審稿件數、退件率、平均處理時間

### 以便
辨識異常退件或工作量不均的情形，調整分派策略或安排個別培訓

### 前置條件
- 審稿主管已登入系統
- 部門有 ≥ 2 位審稿員（單人無比對需求）

### 業務流程

1. 審稿主管選擇要比對的時間範圍（今日 / 本週 / 本月）
2. 系統呈現部門所有審稿員的關鍵績效指標：審稿件數、退件率、平均處理時間
3. 審稿主管依退件率高低排序，辨識異常退件審稿員
4. 審稿主管依結果調整分派策略或安排培訓

### 成功條件

1. 審稿主管可比對部門內所有審稿員的件數、退件率、平均處理時間
2. 比對資料可依「今日 / 本週 / 本月」三種時間範圍切換
3. 比對結果可依退件率高低排序

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
- 原 Notion User Story DB `US-AR-006`（2026-05-21 遷入）
