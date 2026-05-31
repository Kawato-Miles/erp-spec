---
type: user-story
us-id: US-QR-013
module:
  - quote-request
role:
  - "[[印務主管]]"
priority: low
stage: business-only
status: active
created-at: 2026-05-22
last-reviewed: 2026-05-22
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 成本評估"
related-spec: openspec/specs/quote-request/spec.md
related-scenarios: []
related-business-logic:
  - "[[報價邏輯]]"
related-entities:
  - "[[需求單]]"
  - "[[印件]]"
related-oq: []
related-test-cases: []
prerequisites:
  - "[[US-QR-005-待評估報價通知]]：業務已執行「送印務評估」"
  - 當前印務主管為該需求單的指定評估人員
---

# US-QR-013 評估需求單報價

## 業務情境（穩定層）

### 作為
[[印務主管]]

### 我希望
能看我負責的「待評估成本」需求單並填入成本評估

### 以便
與業務有統一視角，且印務主管可於每日待辦清單規劃工作安排

### 前置條件
- 業務已執行「送印務評估」
- 需求單狀態為「待評估成本」
- 當前印務主管為該需求單的指定評估人員

### 業務流程

1. 印務主管登入後於待辦清單看到指定給自己的「待評估成本」需求單
2. 印務主管進入需求單詳情查看印件規格與業務上傳的參考附件（[[US-QR-004-管理需求單參考資料]]）
3. 印務主管逐一填入各印件項目的成本總額（必填）
4. 印務主管確認所有印件項目成本填寫完畢後執行「評估完成」
5. 系統自動建立**報價紀錄**並通知業務
6. 需求單狀態推進至「已評估成本」

### 成功條件

1. 印務主管的列表頁僅顯示**指定給自己**且狀態為「待評估成本」的需求單（不顯示給其他印務主管的需求單）
2. 印務主管可看到印件規格 / 參考附件，但**成本評估欄位以外的欄位顯示為唯讀**（不可改印件規格 / 客戶資料）
3. 所有印件項目成本填寫完畢後才允許執行「評估完成」（任一未填則阻擋）
4. 執行「評估完成」後系統自動建立報價紀錄並通知業務
5. 需求單狀態推進至「已評估成本」，業務可進入議價流程（[[US-QR-002-管理需求單進度]]）

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) v3.2 § Requirement「成本評估」L134-144 + Scenario US-QR-013 L141-143
- [[報價邏輯]]
- 原 Notion User Story DB `US-QR-013`（2026-05-22 遷入並依 spec 深度校對）

## 校對紀錄

### 第一輪（2026-05-22 v2，直接從 Notion + spec 整合）

- 對齊 spec L141-143：印務主管待辦清單過濾 / 所有成本填完才允許評估完成 / 評估完成後建報價紀錄 + 通知業務
- 補成本評估外欄位唯讀（業務上的合理權限邊界）
- 邊界：本卡為印務主管視角；業務視角的建單 / 進度管理由 [[US-QR-001]] / [[US-QR-002]] 處理
