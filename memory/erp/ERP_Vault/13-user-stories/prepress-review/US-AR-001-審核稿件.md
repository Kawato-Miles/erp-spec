---
type: user-story
us-id: US-AR-001
module:
  - prepress-review
role:
  - "[[03-roles/審稿]]"
priority: high
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - openspec/specs/prepress-review/spec.md
  - "[[04-business-logic/稿件管理規則]]"
  - "[[04-business-logic/審稿分配規則]]"
related-spec: openspec/specs/prepress-review/spec.md
related-scenarios:
  - "[[07-scenarios/README#情境 6：同印件補件後再審]]"
related-business-logic:
  - "[[04-business-logic/稿件管理規則]]"
  - "[[04-business-logic/審稿分配規則]]"
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
related-entities:
  - "[[05-entities/印件]]"
related-test-cases: []
---

# US-AR-001 審核稿件

## 業務情境（穩定層）

### 作為
[[03-roles/審稿]]

### 我希望
印件進入審稿階段後，能完整走完「自動分派 → 多輪審查 → 補件迴圈」的結構化審稿流程，直到合格為終態

### 以便
客戶 / 業務與審稿人員間的雙向溝通有系統化紀錄可追溯；審稿部門工作量有 KPI 量化基礎；退件原因能累積分析供公司改善服務

### 前置條件
- 訂單中的印件進入審稿階段
- 稿件檔案已上傳
- 系統已自動分派審稿人員（或標記為免審稿）

### 業務流程

本流程為審稿模組的主要骨幹，串接以下個別 user story 為完整循環：

1. 前置設定（[[US-AR-002-設定印件難易度與免審稿]]）：業務於需求單標註印件難易度與是否免審稿
2. 人員調度（[[US-AR-003-維護審稿人員能力等級]] / [[US-AR-004-覆寫印件分派]]）：審稿主管維護人員能力等級，必要時人工覆寫分派
3. 自動分派：稿件上傳後，系統依「能力最接近難易度 → 進行中負擔最少」原則挑選審稿員
4. 執行審稿（[[US-AR-007-執行印件審稿]]）：審稿員提交合格 / 不合格判定，含退件原因與審稿備註
5. 補件迴圈（[[US-AR-009-B2B業務代客戶補件]] / [[US-AR-010-B2C會員補件流程]]）：判定不合格 → 業務或會員補件 → 系統將印件回送原審稿員重審 → 重新進入步驟 4，直到合格
6. 終態：合格 → 系統自動建立工單草稿，印件進入製程審核階段
7. 全程監控（[[US-AR-005-監控當日審稿工作量]] / [[US-AR-006-比對審稿人員績效]] / [[US-AR-008-追蹤部門審稿完成紀錄]]）：審稿主管同步監控當日工作量、人員績效、部門完成度

免審稿快速路徑：標記「免審稿」的印件直接跳過步驟 3~5，系統產生來源為「免審稿」的審稿輪次並標為合格，進入步驟 6。

### 成功條件

1. 印件可從稿件上傳走到合格進入製程審核階段，多輪審稿之間狀態正確轉移
2. 每一輪審稿留有結構化紀錄（審稿檔案、送審備註、結果、退件原因、審稿備註），事後可查核與統計
3. 免審稿印件可直接跳過審稿環節進入製程審核階段，但仍產生對應的審稿輪次紀錄（來源標記為「免審稿」）
4. 退件原因可累積為統計分析資料，供公司改善服務參考

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) — 稿件審查模組正本（v1.5）
- [[04-business-logic/稿件管理規則]]
- [[04-business-logic/審稿分配規則]]
- 原 Notion User Story DB `US-AR-001`（2026-05-21 遷入 Vault，內容經中英夾雜與 UI 措辭清理）
