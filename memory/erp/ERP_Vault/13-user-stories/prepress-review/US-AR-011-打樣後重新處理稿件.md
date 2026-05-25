---
type: user-story
us-id: US-AR-011
module:
  - prepress-review
role:
  - "[[03-roles/業務]]"
priority: medium
stage: business-only
status: active
created-at: 2026-05-21
last-reviewed: 2026-05-21
source:
  - "openspec/specs/prepress-review/spec.md#Requirement: 審稿人員審稿作業"
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
related-oq:
  - "[[AR-2-Notion-US-AR-002編碼重複處理]]"
  - "[[AR-12-打樣後新稿件實體機制與根因判定]]"
  - "[[AR-13-打樣NG製程問題下游處理機制]]"
related-test-cases: []
prerequisites:
  - "印件已完成打樣，結果記錄為不合格"
  - "原印件審稿維度已為終態（合格）"
  - "根因判定者已確認問題來自稿件（待 [[AR-12-打樣後新稿件實體機制與根因判定]] 解答）"
---

# US-AR-011 打樣後重新處理稿件

> 本卡為原 Notion 上重複編碼之 US-AR-002 重新編號而來。詳見 [[AR-2-Notion-US-AR-002編碼重複處理]]。

## 業務情境（穩定層）

### 作為
[[03-roles/業務]]

> 「作為」原為審稿員，雙視角審查後改為業務：審稿員是流程後段承接者，但觸發點是業務（打樣後通知客戶取得新稿件 → 走重新審稿流程）。

### 我希望
當打樣根因為稿件問題時，能讓客戶提供新稿件重新走完整審稿流程

### 以便
打樣後發現的稿件問題能正確回到稿件源頭處理，避免誤判為製程問題而錯誤調整生產設定，並讓根因分類可被統計（稿件 vs 製程）

### 前置條件
- 打樣印件對應的打樣 WorkOrder（`WorkOrder.type = 打樣`）已推進至「已完成」
- 原打樣印件審稿維度已為終態（合格）
- 業務（owner of 訂單）於打樣 WorkOrder 詳情頁判定 `sampleResult = NG-稿件問題`（對齊 AR-12 拍板的判定者與依據）

### 業務流程

1. 打樣 WorkOrder 推進至「已完成」後，業務於該打樣 WorkOrder 詳情頁點擊「填打樣結果」按鈕，判定 `sampleResult = NG-稿件問題`（中文 enum，對齊 Prototype 既有實作）
2. 系統 atomic 自動觸發棄用 + clone 流程：
   - 原打樣印件 `printItemStatus = '已棄用'`（用既有 PrintItemStatus enum）+ notes 加註棄用說明
   - clone 新打樣印件（沿用印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度與印製維度；`sampleResult = '待確認'`）
   - 新印件 `derived_from_print_item_id` 指向原印件 ID（**結構化追溯 FK，本 change 新增**）+ notes 加註「（由 [原印件 ID] NG-稿件問題重建）」
   - 訂單層 ActivityLog 寫入「NG-稿件問題：棄用 [原印件號]，建立新印件 [新印件號]」
3. 業務後續與客戶聯繫，取得修改後的新稿件
4. 業務於新印件上傳新稿件 → 系統建立 ReviewRound 1 進入審稿流程（與 [[07-scenarios/README#情境 14：審稿流程端到端（單模組跨角色）|07-scenarios 情境 14 審稿流程端到端]] 主流程一致；不繼承原印件的審稿輪次歷史）
5. 新稿件經審稿通過後，業務後續手動建大貨工單 / 重新安排打樣

> **AR-12 已 closed（2026-05-23）**：議題 1 拍板方向 A 棄用 + 建新印件（對齊 Prototype 既有 `rebuildPrintItemForSampleNG`）+ 新增 `derived_from_print_item_id` 結構化追溯 FK；議題 2 拍板業務在打樣 WorkOrder 詳情頁判定 `sampleResult` 中文 enum（待確認 / OK / NG-製程問題 / NG-稿件問題）。詳見 [[AR-12-打樣後新稿件實體機制與根因判定]]。NG-製程問題下游處理另開 [[AR-13-打樣NG製程問題下游處理機制]]。

> **與補件迴圈的業務本質差異**：本 user story 是「跨階段重新進入審稿（打樣 → 審稿）」；[[US-AR-009-B2B業務代客戶補件]] / [[US-AR-010-B2C會員補件流程]] 是「同一審稿週期內的補件修正」。兩者狀態流轉與資料模型處理皆不同。

### 成功條件

1. 打樣不合格且根因為稿件問題時，可由業務與客戶聯繫取得修改後的新稿件
2. 新稿件視為全新審稿生命週期，重新走完整審稿流程，不繼承原印件審稿輪次歷史
3. 新稿件經審稿通過後可重新安排打樣，無需重複先前已通過的審稿動作
4. 系統留印件活動紀錄反映「打樣後重提稿件」事件（事件細節與實體關聯方式待 [[AR-12]] 解答後補入）

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

- [`openspec/specs/prepress-review/spec.md`](../../../../openspec/specs/prepress-review/spec.md) v1.5 § Requirement「審稿人員審稿作業」L244「合格為終態，後續需變更內容須透過棄用原印件 + 建立新印件處理」
- [[04-business-logic/打樣流程]] § 情境 3「引導建立新打樣印件」
- [[04-business-logic/稿件管理規則]]：審稿輪次資料模型
- 原 Notion User Story DB `US-AR-002`（編碼重複版，2026-05-21 重新編號為 US-AR-011 並遷入）

## 相關 OQ

- [[AR-2-Notion-US-AR-002編碼重複處理]]（**已解答 2026-05-21**）：Miles 拍板保留 US-AR-011 為獨立卡
- [[AR-12-打樣後新稿件實體機制與根因判定]]（priority high，spec 級設計議題）

## 校對紀錄

### 第一輪（2026-05-21 v1）

依 spec 對齊清理 UI 措辭與中英夾雜；原 Notion 條目「我希望」「以便」為空，內容由 v1 補完。

### 第二輪（2026-05-21 v2，雙視角審查後）

erp-consultant 評 75/100，識別 5 gap；senior-pm INVEST 多 WARN，4 問題 + 3 痛點。整合採納 / 拒絕：

| 修正項 | 來源 | 處理 |
|--------|------|------|
| 「我希望」52 字超 30 字 | senior-pm 問題 1（high）| 已採納：縮為 24 字「當打樣根因為稿件問題時，能讓客戶提供新稿件重新走完整審稿流程」 |
| 「作為」應改業務（不是審稿員）| senior-pm 段 4（high）| 已採納：role 改為 [[03-roles/業務]]；業務情境段加註說明改變理由 |
| 補根因判定者（誰判 / 依據什麼）| erp-consultant G2 + senior-pm 問題 4（medium）| 已採納：開 OQ [[AR-12]]，業務流程 step 1 + 前置條件引 OQ |
| 補「棄用 + 建新印件」實體機制（spec L244 + 打樣流程 § 情境 3）| erp-consultant G1（high）| 已採納：開 OQ [[AR-12]]，業務流程 step 3 列兩候選方案引 OQ |
| 前置條件 incomplete（原打樣印件狀態 + 審稿維度終態）| erp-consultant G3（medium）| 已採納：前置條件 |
| 補與 US-AR-009 / 010 業務本質差異 | senior-pm 段 4（medium）| 已採納：業務流程末段補差異說明 + 成功條件 2 明示「不繼承原印件審稿輪次歷史」 |
| 補「原打樣印件如何處理」成功條件 | erp-consultant G4（medium）| **部分採納**：成功條件 4 補活動紀錄事件，實體後果待 AR-12 解答後補入 |
| frontmatter `related-oq` 補 AR-2 + AR-12 | erp-consultant G5（low）| 已採納 |
| 「以便」量化 | senior-pm 問題 2（弱）| 已採納：補「根因分類可被統計（稿件 vs 製程）」量化方向 |
| 成功條件重述「我希望」未新增可驗證 | senior-pm 問題 3 | 已採納：重構為 4 條獨立可驗證 |
| 打樣費 / 重收費用邊界 | senior-pm 痛點 3 | **未採納**：屬訂單管理模組（訂單異動）議題，超出本 US 範疇 |

### 第三輪（2026-05-23 v3，AR-12 closed 後同步）

[[AR-12-打樣後新稿件實體機制與根因判定]] 議題 1 + 2 已 closed（2026-05-23）。本卡同步：

| 修正項 | 處理 |
|--------|------|
| 前置條件改：對齊 AR-12 拍板的觸發機制（打樣 WorkOrder 已完成 + 業務在 WorkOrder 詳情頁判定 sampleResult = NG-稿件問題）| 已採納 |
| 業務流程 step 1：「根因判定流程」改為「業務於打樣 WorkOrder 詳情頁判定 sampleResult = NG-稿件問題」（對齊 Prototype 既有 UI）| 已採納 |
| 業務流程 step 2：補 atomic 棄用 + clone 流程細節（PrintItemStatus = '已棄用' + derived_from_print_item_id FK + notes 雙寫 + 訂單 ActivityLog）| 已採納 |
| 業務流程 step 3 + 4 順序調整：業務取得新稿件後才上傳，系統建立 ReviewRound 1 進入審稿流程 | 已採納 |
| 業務流程後加註「AR-12 已 closed」段，補 NG-製程問題下游 OQ AR-13 wiki link | 已採納 |
| 「step 3 兩候選方案 A/B」措辭移除 | 已採納：拍板方向 A 對齊 spec L244 + Prototype |
| frontmatter `related-oq` 補 [[AR-13-打樣NG製程問題下游處理機制]]（衍生 OQ）| 待補（task 5.4） |
| `resolve-prepress-review-gaps-ar-10-ar-12` 引用 | 已採納：來源段補 archive 後 Requirement 演變說明 |
