---
type: user-story
us-id: US-AR-008
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
related-entities:
  - "[[05-entities/印件]]"
related-test-cases: []
---

# US-AR-008 追蹤部門審稿完成紀錄

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能依時間區間列出部門已完成的審稿清單，並可細部到每位審稿員

### 以便
確認部門工作完成度；遇跨部門爭議時（如印務反映收單數與審稿合格數不一致）可列具體清單對帳釐清責任

### 前置條件
- 審稿主管已登入系統

### 業務流程

1. 審稿主管選擇要查詢的時間範圍（如本週、本月、自訂區間）
2. 審稿主管選擇要查詢的審稿員（單人或全部）
3. 審稿主管選擇要查詢的狀態（如：合格）
4. 系統列出符合條件的印件清單與總筆數摘要
5. 跨部門對帳時，審稿主管可調出具體印件紀錄供討論

### 成功條件

1. 審稿主管可依時間區間 + 審稿員 + 狀態組合查詢部門已完成審稿清單
2. 查詢結果含具體印件清單與總筆數摘要
3. 每筆印件可追溯原始審稿紀錄（檔案、輪次、結果、退件原因、備註）

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
- 原 Notion User Story DB `US-AR-008`（2026-05-21 遷入）
