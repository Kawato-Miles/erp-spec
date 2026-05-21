---
type: user-story
us-id: US-AR-010
module:
  - prepress-review
  - order-management
role:
  - "B2C 會員（外部使用者）"  # AR-1 已解答（選 C：B2C 會員不入 ERP role 體系），role 採純文字而非 wiki link
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

# US-AR-010 B2C 會員補件流程

## 業務情境（穩定層）

### 作為
B2C 會員（外部使用者）

> AR-1 已解答（[[AR-1-B2C會員是否納入正式角色]]，2026-05-21 選 C）：B2C 會員不入 ERP role 體系，採純文字標記。

### 我希望
能在 EC 會員中心看到訂單印件的退件原因，並重新上傳稿件完成補件，業務在 ERP 端可同步追蹤進度

### 以便
B2C 訂單不需業務介入轉傳檔案，降低業務處理負擔，維持補件時效，B2C 客戶也能自助處理稿件問題

### 前置條件
- B2C 訂單印件審稿不合格
- B2C 會員已收到退件通知

### 業務流程

1. B2C 會員登入 EC 會員中心，查看訂單印件狀態為「待補件」
2. 會員查看退件原因與審稿備註
3. 會員上傳修改後的新稿件
4. 系統將印件狀態轉為「已補件」，回送原審稿員待審清單
5. 業務於 ERP 訂單詳情可同步看到補件完成狀態，無需主動聯繫客戶

### 成功條件

1. B2C 會員可在 EC 會員中心查看訂單印件的退件原因與審稿備註
2. B2C 會員可在 EC 會員中心上傳新稿件完成補件
3. 補件完成後印件狀態自動轉為「已補件」，並自動回到原審稿員的待審清單
4. 業務於 ERP 訂單詳情可見補件完成狀態（時間、檔案）

## UI 操作（易變層）

<!-- ui-binding: draft -->
<!-- 對應 Prototype 路徑：EC 會員中心對應檔案（待 Prototype 定案後補；ERP 端 sens-erp-prototype/src/components/order/） -->

### 介面入口
- Prototype 定案後補

### 操作步驟
- Prototype 定案後補

### 介面元素
- Prototype 定案後補

## 來源（provenance）

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md)
- [[04-business-logic/稿件管理規則]]
- 原 Notion User Story DB `US-AR-010`（2026-05-21 遷入）

## 相關 OQ

- [[AR-1-B2C會員是否納入正式角色]]（**已解答 2026-05-21**）：選 C，B2C 會員不入 ERP role 體系，role 採純文字標記
