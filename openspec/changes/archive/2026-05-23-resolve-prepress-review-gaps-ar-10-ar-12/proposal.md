## Why

User story v2 校對過程中（2026-05-21）識別到審稿模組兩項 spec ↔ user story 不一致：

- **AR-10（主管覆寫破例派工）**：[prepress-review spec](../../specs/prepress-review/spec.md) L41 自動分配演算法允許「破例派工」（無人能力達標時派給能力最高者 + ActivityLog）vs L92 主管覆寫嚴格擋（能力不足者拒絕）— 同模組兩條 path 規則不一致；主管遇到「請假 / 急件 / 客戶指定 + 目標員能力不足」時無解，唯一繞道是改該員 `max_difficulty_level`（影響全系統的自動分配，不合理）。詳見 [AR-10 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-10-主管覆寫分派是否允許破例派工.md)
- **AR-12（打樣後新稿件實體機制 + 根因判定機制）**：[US-AR-011 打樣後重新處理稿件](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件.md) 涉及兩個 spec 缺口：
  - 議題 1 — 新稿件實體機制：spec L244 只寫「合格為終態，後續需變更內容須透過棄用原印件 + 建立新印件」概念，但 clone 機制 / 追溯關聯 / 狀態流轉細節 spec 沒寫
  - 議題 2 — 根因判定機制：spec 完全沒定義（誰判 / 依據什麼 / 流程 / enum）
  - 詳見 [AR-12 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-12-打樣後新稿件實體機制與根因判定.md)

不解 → user story v2 校對停留草稿、相關 spec 條文與 user story 持續引用未解 OQ、後續 Prototype 與測試案例階段卡關。本次拍板方案已於 [規劃文件](../../../.claude/plans/user-story-squishy-moonbeam.md) 確定，本 change 落實 spec 修訂。

對應 Vault 商業背景卡：[印件實體](../../../memory/erp/ERP_Vault/05-entities/印件.md)、[打樣流程](../../../memory/erp/ERP_Vault/04-business-logic/打樣流程.md)、[審稿分配規則](../../../memory/erp/ERP_Vault/04-business-logic/審稿分配規則.md)。

## What Changes

### A. AR-10：主管覆寫候選清單 UI 層阻擋

- MODIFIED「審稿主管覆寫分配」Requirement：
  - 條文補「能力不足者 SHALL 不出現於主管覆寫的審稿人員候選清單」（UI 層阻擋，而非事後拒絕）
  - 補設計理由段：自動派工破例 = 系統不得已的降級（留 ActivityLog 給主管事後監看做人力決策）vs 主管手動覆寫 = 主動行為（不應比自動派工更寬鬆，避免主管隨意覆寫造成審稿品質問題）— 兩條 path 規則不同是因動機不同，不是設計矛盾
- Scenario「覆寫至能力不足者被拒」rename 為「覆寫候選清單預先過濾能力不足者」，改為描述 UI 層阻擋細節
- 新增 Scenario「可選清單為空時 UI 提示」：若無人能力夠且原審稿員離職停用，UI 顯示「無可選審稿人員，請先調整能力等級或恢復原審稿員」（避免主管陷入無路可走）

### B. AR-12 議題 2：補 spec 對齊 Prototype 既有「打樣結果業務判定」實作

**Prototype 既有實作對照**（[src/types/order.ts:38](../../../sens-erp-prototype/src/types/order.ts)、[src/pages/WorkOrderDetail.tsx](../../../sens-erp-prototype/src/pages/WorkOrderDetail.tsx)、[src/store/useErpStore.ts:2482 fillSampleResult](../../../sens-erp-prototype/src/store/useErpStore.ts)）：apply 階段檢查發現 Prototype 已實作完整業務判定機制；本 change 工作為「補 spec 描述對齊既有實作」而非「決定新設計」。

新增 Requirement「打樣結果業務判定」（對齊 Prototype 命名與行為）：
- PrintItem 新增欄位：`sampleResult` enum（`待確認` / `OK` / `NG-製程問題` / `NG-稿件問題`）— 預設 `待確認`
- 觸發位置：**打樣 WorkOrder 詳情頁**（不是印件詳情頁；對齊 Prototype 既有 UI）
- 觸發條件：`WorkOrder.type = 打樣 && WorkOrder.status = 已完成 && sampleResult = 待確認`
- 判定者：業務（owner of 訂單）
- 各 enum 分支後續流程：
  - `OK` → 業務後續手動建大貨工單（系統不自動觸發）
  - `NG-製程問題` → 業務 UI 自行建新打樣 WorkOrder（系統不自動建，保留業務決定權；下游自動化待 OQ AR-13）
  - `NG-稿件問題` → 系統 SHALL 自動觸發棄用 + clone 流程（見下方 C）
- 判定不可逆（避免規避稽核軌跡）
- ActivityLog 走訂單層（`Order.activityLogs`，弱型別文字 "填打樣結果：{result}（工單 {workOrderNo}）"），印件層 ActivityLog（PrintItemActivityEvent）不引入新事件型別

### C. AR-12 議題 1：補 spec 對齊 Prototype 既有「棄用 + clone」實作 + 新增結構化追溯 FK

**Prototype 既有實作對照**（[src/store/useErpStore.ts:2531 rebuildPrintItemForSampleNG](../../../sens-erp-prototype/src/store/useErpStore.ts)）：Prototype 已實作棄用 + clone 機制；本 change 補 spec 描述 + 新增結構化追溯 FK 補強 Prototype 既有 notes 文字追溯。

新增 Requirement「打樣後棄用原印件建新印件」（對齊 Prototype 既有實作）：
- 觸發條件：`sampleResult = NG-稿件問題`
- 系統動作（atomic transaction）：
  1. 原打樣印件 `printItemStatus = 已棄用`（用既有 `PrintItemStatus` enum，**不引入** `lifecycle_status` 獨立欄位）+ notes 加註棄用說明
  2. clone 原打樣印件至新打樣印件（保留印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度 + 印製維度 + sampleResult = 待確認）
  3. **新打樣印件 `derived_from_print_item_id` 寫入原印件 ID**（**本 change 新增結構化追溯 FK**；補 Prototype 既有 notes 文字追溯的反向查詢能力）
  4. 新印件 notes 加註「（由 [原印件 ID] NG-稿件問題重建）」（對齊 Prototype 既有實作）
  5. 訂單層 ActivityLog 寫入「NG-稿件問題：棄用 [原印件號]，建立新印件 [新印件號]」
- 新打樣印件等待業務重新上傳稿件 → 進入審稿流程

新增 Requirement「印件追溯欄位」：
- `PrintItem.derived_from_print_item_id` FK PrintItem nullable — 本 change 新增結構化追溯 FK
- 用途：clone 自其他印件時提供結構化反向查詢能力（補 Prototype 既有 `notes` 文字追溯）
- 與 notes 並存：notes 是人類可讀、FK 是機器可查詢
- 反向查詢：原印件可透過 `WHERE derived_from_print_item_id = X` 找到所有自其衍生的新印件

## Capabilities

### New Capabilities

無（本 change 全為既有 capability 補齊）。

### Modified Capabilities

- `prepress-review`：審稿主管覆寫分配 UI 層阻擋（AR-10）+ ADDED「打樣結果業務判定」/「印件追溯欄位」/「打樣後棄用原印件建新印件」三個 Requirement（對齊 Prototype 既有 `sampleResult` enum 命名 / 觸發位置 / 棄用流程；本 change 補 spec 描述 + 新增結構化追溯 FK `derived_from_print_item_id`）（AR-12）
- `business-processes`：「打樣流程規則」對齊 Prototype enum 名稱（`OK` / `NG-製程問題` / `NG-稿件問題`）+ 引用 prepress-review spec 新 Requirements + 觸發時機改為「業務在打樣 WorkOrder 已完成後判定 sampleResult」（AR-12 下游同步）
- `state-machines`：「印件狀態機（雙維度）」補既有 PrintItemStatus = '已棄用' 觸發場景（NG-稿件問題自動棄用）+ 「印件打樣特殊流程」對齊 Prototype enum 並涵蓋三個業務判定分支 Scenarios（AR-12 下游同步）

## Impact

- **specs（3 個 modified）**：prepress-review（主要）+ business-processes（打樣流程規則對齊新 enum）+ state-machines（雙維度狀態機補 lifecycle 屬性說明 + 打樣特殊流程對齊新 enum）
- **OQ closure**：[AR-10](../../../memory/erp/ERP_Vault/08-open-questions/AR-10-主管覆寫分派是否允許破例派工.md)、[AR-12](../../../memory/erp/ERP_Vault/08-open-questions/AR-12-打樣後新稿件實體機制與根因判定.md) archive 後標 status=closed + 補決議段
- **新開 OQ**：AR-13「打樣 ng-製成問題下游處理機制」（candidate 候選：建新打樣 ProductionTask 重做 / 轉 NCR 走 production-task spec disposition 機制；待業務累積案例後再決定）
- **User Story 同步**：[US-AR-004](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-004-覆寫印件分派.md)、[US-AR-011](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件.md) 移除「待 OQ 解答」措辭、補決議結果
- **Vault 卡同步**：
  - [印件實體卡](../../../memory/erp/ERP_Vault/05-entities/印件.md) 新增 lifecycle_status / derived_from_print_item_id / proofing_result / proofing_result_note 4 個欄位描述
  - [打樣流程](../../../memory/erp/ERP_Vault/04-business-logic/打樣流程.md) 補業務判定 enum + ng_artwork 觸發棄用建新流程
  - [審稿分配規則](../../../memory/erp/ERP_Vault/04-business-logic/審稿分配規則.md) 補主管覆寫 UI 層阻擋設計理由
- **Prototype 影響**（後續另案實作）：
  - 主管覆寫 Dialog 候選清單預先過濾能力不足者（**目前 Prototype 採事後拒絕**，需改為 UI 層阻擋）
  - 新增 PrintItem.derived_from_print_item_id 結構化追溯 FK（**目前 Prototype 用 notes 文字追溯**，新增後可保留 notes 但補結構化欄位）
  - 印件詳情頁新印件追溯顯示（從 derived_from_print_item_id 正向 + 反向查詢連結）
- **不需 Prototype 改動**：sampleResult enum / 打樣 WorkOrder 詳情頁判定 UI / NG-稿件問題自動棄用 + clone 流程 — Prototype 已實作
