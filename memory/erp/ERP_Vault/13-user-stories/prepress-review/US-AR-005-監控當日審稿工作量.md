---
type: user-story
us-id: US-AR-005
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
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic: []
related-entities: []
related-test-cases: []
---

# US-AR-005 監控當日審稿工作量

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能一眼看出今天有多少稿件進來、多少已合格、多少不合格

### 以便
快速掌握審稿部門當日運作是否異常，即時排除瓶頸或調度人力

### 前置條件
- 審稿主管已登入系統

### 業務流程

1. 審稿主管登入系統後即可看到部門當日即時狀況
2. 系統持續即時更新當日 3 個關鍵指標（新進稿件數、已合格數、未合格數）
3. 審稿主管依指標判斷是否需要調度人力（如：未合格數異常多 → 補強審稿員）

### 成功條件

1. 審稿主管登入後可即時查看當日新進稿件數、合格數、不合格數
2. 指標數字即時更新，無需手動重新整理
3. 切換其他工作區時，指標保持可見以利持續監控

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
- 原 Notion User Story DB `US-AR-005`（2026-05-21 遷入）
