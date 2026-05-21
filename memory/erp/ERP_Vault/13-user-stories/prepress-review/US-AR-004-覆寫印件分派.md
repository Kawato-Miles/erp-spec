---
type: user-story
us-id: US-AR-004
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
related-entities:
  - "[[05-entities/印件]]"
related-test-cases: []
---

# US-AR-004 覆寫印件分派

## 業務情境（穩定層）

### 作為
[[03-roles/審稿主管]]

### 我希望
能對已自動分派但尚未完成審稿的印件，重新指派給其他審稿員

### 以便
人員異動、負擔不均、特殊需求時可人工介入調度，避免印件卡關或品質不穩

### 前置條件
- 印件已由系統自動分派審稿員
- 印件尚未完成審稿（未達合格終態）

### 業務流程

1. 審稿主管查看部門內印件分派狀況
2. 審稿主管挑選一筆或多筆需要轉派的印件
3. 審稿主管指定新審稿員並填寫轉派原因（如：原審稿員請假 / 負擔過重 / 特殊客戶指定）
4. 系統驗證新審稿員能力等級足夠承擔該印件難易度
5. 系統執行轉派，並留下活動紀錄（時間、原審稿員、新審稿員、原因）

### 成功條件

1. 已分派但未完成審稿的印件可重新指派給其他審稿員
2. 覆寫必須填寫原因
3. 系統驗證新審稿員能力等級 ≥ 印件難易度，否則拒絕轉派並提示原因
4. 覆寫事件留有活動紀錄供事後追蹤

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
- 原 Notion User Story DB `US-AR-004`（2026-05-21 遷入）
