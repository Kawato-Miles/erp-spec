---
type: user-story
us-id: US-AR-002
module:
  - prepress-review
  - quote-request
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/quote-request/spec.md#Requirement: 印件難易度欄位"
  - "openspec/specs/prepress-review/spec.md#Requirement: 印件自動分配機制"
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
related-spec:
  - openspec/specs/quote-request/spec.md
  - openspec/specs/prepress-review/spec.md
related-scenarios: []
related-business-logic:
  - "[[04-business-logic/難易度機制]]"
  - "[[04-business-logic/免審決策樹]]"
  - "[[04-business-logic/審稿分配規則]]"
related-entities:
  - "[[05-entities/印件]]"
  - "[[05-entities/需求單]]"
related-oq:
  - "[[AR-8-免審稿適用條件與核可機制]]"
related-test-cases: []
prerequisites:
  - "客戶有詢價需求"
  - "業務已建立需求單並進入印件項目建立階段"
---

# US-AR-002 設定印件難易度與免審稿

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

### 我希望
在需求單建立印件時，能標註該印件的審稿難易度與是否需要審稿

### 以便
後續審稿分配與工單建立流程能依此分流；免審稿印件略過審稿環節，加速進入工單階段

### 前置條件
- 需求單已建立
- 印件項目建立中（尚未送出）

### 業務流程

1. 業務於需求單建立印件時，評估稿件審稿複雜度，標註難易度等級（1-10 整數，必填）
2. 業務判斷是否屬於免審稿情境（如客戶提供的稿件已多次合作驗證、單純文字稿件等），可勾選免審稿快速路徑（**適用條件與核可機制待 [[AR-8-免審稿適用條件與核可機制]] 解答後補完**）
3. 若任一印件未填難易度，系統拒絕送出需求單並指出未填的印件
4. 需求單成交轉訂單時，系統自動將難易度與免審稿標記繼承至訂單對應印件
5. **成交轉訂單後，難易度與免審稿標記不可再於訂單階段修改**（依 [[04-business-logic/難易度機制]] § 五；如業務確認需變更，須走訂單異動流程）
6. 後續系統行為由下游模組承接，本 user story 範疇結束：
   - 免審稿印件直接建立來源為「免審稿」的合格審稿輪次，不進入審稿員自動分配清單
   - 一般印件付款後依難易度進入自動分配流程（詳見 [[07-scenarios/README#情境 14：審稿流程端到端（單模組跨角色）|07-scenarios 情境 14 審稿流程端到端]] 與業務流程 spec）

### 成功條件

1. 印件可標註難易度等級（1-10 整數，必填，未填或範圍外時系統拒絕送出需求單並指出未填的印件）
2. 印件可標註是否免審稿（適用條件與核可機制待 [[AR-8-免審稿適用條件與核可機制]] 解答後補完）
3. 需求單成交轉訂單時，難易度與免審稿標記自動繼承至訂單印件，無需業務重新輸入
4. 成交轉訂單後，訂單階段不可再修改難易度與免審稿標記（變更須走訂單異動流程）

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

- [`openspec/specs/quote-request/spec.md`](../../../../openspec/specs/quote-request/spec.md) § Requirement「印件難易度欄位」L221-244
- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) § Requirement「印件自動分配機制」L28-86（特別 L71-76「免審稿印件不進入分配」）
- [[04-business-logic/難易度機制]]：1-10 等級 + 成交轉訂單繼承 + 訂單階段不可修改
- [[04-business-logic/免審決策樹]]：免審稿直接建合格 Round + 不進入分配
- 原 Notion User Story DB `US-AR-002`（2026-05-21 遷入並依 spec v1.5 深度校對）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 B 級，識別 7 gap；senior-pm INVEST 4 PASS / 3 WARN，5 問題。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 補「未填難易度無法送出需求單」（quote-request spec L233-237） | erp-consultant G2 / G7（high）| 已採納：業務流程 step 3 + 成功條件 1 |
| 補「成交後訂單階段不可修改」（[[04-business-logic/難易度機制]] § 五）| erp-consultant G5（high）| 已採納：業務流程 step 5 + 成功條件 4 |
| 補「免審稿直接建合格 Round + 不進入分配」（prepress-review spec L71-76 + 免審決策樹）| erp-consultant G3 / G4（high / medium）| 已採納：業務流程 step 6 下游連鎖反應段（含 wiki link 引 US-AR-001） |
| 「以便」職責邊界錯位（下游效果寫進「以便」）| senior-pm P4（medium）| 已採納：以便改為「後續審稿分配與工單建立流程能依此分流；免審稿印件略過審稿環節，加速進入工單階段」 |
| 免審稿適用條件 / 核可機制 | senior-pm P3（high）| 已採納：開新 OQ [[AR-8-免審稿適用條件與核可機制]]，業務流程 step 2 + 成功條件 2 引 OQ wiki link |
| frontmatter `related-business-logic` 缺審稿分配規則 | senior-pm INVEST Independent WARN | 已採納：補入 |
| 跨模組 user story 拆 / 不拆 | senior-pm 段 4 | 已採納「不拆」：核心動作單一（業務填難易度與免審稿），下游連鎖反應由 wiki link 引用 |
| 「以便」量化（spec 五新紀律）| senior-pm P1（medium）| **未採納**：本 US 業務價值來自「下游分流能依此運作」，量化基準屬下游模組 KPI（如分配時間 / 出貨速度），不在本 US 範疇 |

### 第二輪審查衍生 OQ

- [[AR-8-免審稿適用條件與核可機制]]（priority medium，跨 prepress-review + quote-request）

### 暫不處理（Miles 拍板）

- 「難易度判斷依據（業務主觀標準）」（senior-pm 提）：屬業務培訓 SOP 議題，不屬系統設計議題，不開 OQ
- 「跨模組情境：免審稿後客戶要求改規格」（senior-pm 提）：屬 [[07-scenarios]] 範疇，列為 follow-up
