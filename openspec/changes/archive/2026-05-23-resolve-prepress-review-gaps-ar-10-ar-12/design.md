## Context

本 change 解 OQ AR-10（主管覆寫破例派工）+ OQ AR-12（打樣後新稿件實體機制 + 根因判定機制），落實 user story v2 校對中發現的 spec 缺口。拍板方案見 [規劃文件](../../../.claude/plans/user-story-squishy-moonbeam.md)。

商業背景：

- [印件實體](../../../memory/erp/ERP_Vault/05-entities/印件.md)：PrintItem 既有欄位與生命週期
- [打樣流程](../../../memory/erp/ERP_Vault/04-business-logic/打樣流程.md)：打樣業務邏輯與情境
- [審稿分配規則](../../../memory/erp/ERP_Vault/04-business-logic/審稿分配規則.md)：自動分配演算法 + 主管覆寫
- [AR-10 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-10-主管覆寫分派是否允許破例派工.md)：主管覆寫破例派工選項分析
- [AR-12 OQ](../../../memory/erp/ERP_Vault/08-open-questions/AR-12-打樣後新稿件實體機制與根因判定.md)：兩個議題分析

## Goals / Non-Goals

**Goals**：

- **AR-10**：主管覆寫候選清單 UI 層阻擋（取代既有事後拒絕）+ 補設計理由說明「自動派工破例 vs 主管覆寫嚴格」的動機不同
- **AR-12 議題 1**：PrintItem 新增 `lifecycle_status` + `derived_from_print_item_id`；`proofing_result = ng_artwork` 觸發棄用原印件 + clone 至新印件 + 新印件走自動分派
- **AR-12 議題 2**：PrintItem 新增 `proofing_result` + `proofing_result_note`；業務在打樣印件詳情頁判定三值 enum（ok / ng_artwork / ng_process）
- spec 修訂結束後 OQ / user story 同步 close 與校對措辭清理

**Non-Goals**：

- 不展開 `ng_process` 下游處理機制（新開 OQ AR-13 暫不解；本 change 只記錄判定結果）
- 不變動既有自動分配演算法 + 破例派工降級邏輯（spec L28-43 + L77-84 不動）
- 不變動既有 PrintItem 審稿維度 5 狀態（lifecycle_status 是平行新維度，與 reviewDimensionStatus 不衝突）
- 不變動既有 ReviewRound 結構（clone 至新印件時 reset，不繼承原印件 Round[]）
- 不處理 PrintItem 細部 RBAC（沿用既有業務 / 印務 / 審稿主管 / 審稿員權限模型）

## Decisions

### D1：AR-10 採 UI 層阻擋而非事後拒絕

- **選項**：嚴格擋（事後拒絕）/ UI 層阻擋（候選清單預先過濾）/ 允許破例 + 警示 / 雙簽核
- **拍板**：UI 層阻擋
- **理由**：
  - Miles 明確指示「選項就要先擋著」（候選清單預先過濾，不讓主管選了才被拒）
  - 既有 spec L102-107 事後拒絕「能力不足」提示語意，UX 上不夠友善（主管選了才被擋，產生「為什麼有這選項但不能用」的困惑）
  - UI 層阻擋讓主管在做決定前就看到約束（候選清單本身已過濾），避免無效操作
- **與既有「自動派工破例」path 規則不同的設計理由**：
  - 自動派工的破例派工（spec L41, L77-84）是系統不得已的降級（無人能力夠時保證印件不卡住），留 ActivityLog 給主管事後監看做人力決策
  - 主管手動覆寫是「主動行為」，不應比自動派工更寬鬆 — 避免主管隨意覆寫造成審稿品質問題
  - 兩條 path 規則不同是因動機不同（系統降級 vs 主管主動），不是設計矛盾

### D2：AR-12 採方向 A 棄用 + 建新印件而非追加新審稿輪次

- **選項**：A 棄用 + 建新印件 / B 同印件追加新 ReviewRound
- **拍板**：方向 A — **對齊 Prototype 既有實作**（`rebuildPrintItemForSampleNG`）
- **理由**：
  - 對齊 spec L244「合格為終態，後續需變更內容須透過棄用原印件 + 建立新印件處理」既定設計（add-prepress-review change archive 時拍板）
  - **Prototype 早已實作此設計**（[src/store/useErpStore.ts:2531](../../../sens-erp-prototype/src/store/useErpStore.ts) `rebuildPrintItemForSampleNG`）：原印件 `printItemStatus = '已棄用'` + clone 新印件沿用規格 + reset 審稿狀態
  - ReviewRound 設計上是同一審稿週期內的補件 / 重審；打樣後重新處理是「跨階段重新進入審稿」（業務本質不同）
  - 新印件保留稿件需求規格 / 客戶資訊 / 訂單關聯 + reset 審稿狀態，與既有「自動分派演算法」邏輯一致 — 不需在審稿流程中增加特殊分支
  - **棄用實作採既有 `PrintItemStatus = '已棄用'` enum 值**（不新增獨立 `lifecycle_status` 欄位）— 對齊 Prototype 既有實作，避免雙重狀態機制混淆
  - `derived_from_print_item_id` 為**本 change 新增**的結構化追溯 FK（Prototype 既有實作用 notes 文字追溯；本 change 新增結構化 FK 提供反向查詢能力）

### D3：AR-12 業務判定採三值 enum 而非單純 ng / ok 二分

- **選項**：A 二分（ok / ng）+ 根因獨立欄位 / B 三值 enum / C 多值（含 ng_material / ng_other ...）
- **拍板**：B 三值 enum — 對齊 Prototype 既有 `'待確認' | 'OK' | 'NG-製程問題' | 'NG-稿件問題'` 四值（含初始「待確認」狀態）
- **理由**：
  - 業務判定 = 「判定問題在稿件還是製程」這個動作本身就是區分根因，合併在同一個 enum 簡化操作
  - **Prototype 早已實作此 enum 設計**（[src/types/order.ts:38](../../../sens-erp-prototype/src/types/order.ts) SampleResult），本 change 為「補 spec 對齊既有實作」
  - 對齊 user story v2 校對中 Miles 明示的「ok / ng-審稿 / ng-製成」業務語意
  - 「NG-製程問題 / NG-稿件問題」涵蓋打樣不合格的主要兩個根因類型；ng_material 等下游細分可歸入 ng_process 後續走 production-task NCR 機制細分
  - 多值會增加業務判斷負擔（業務不一定能精確區分 ng_material vs ng_process）
  - **命名採 Prototype 中文措辭**（OK / NG-製程問題 / NG-稿件問題）而非英文（ok / ng_artwork / ng_process）— 對齊 Prototype 既有實作，避免雙重命名混淆

### D5：cross-spec 同步修訂範圍涵蓋 business-processes + state-machines

- **背景**：apply 階段檢查發現 business-processes spec § 打樣流程規則 與 state-machines spec § 印件狀態機（雙維度）+ § 印件打樣特殊流程 已有打樣相關 Requirement（既有 spec 用「OK / NG 製程問題 / NG 稿件問題」措辭，與本 change `ok / ng_artwork / ng_process` 命名不一致），存在 cross-spec 不一致
- **選項**：A 加入本 change 範疇擴張 / B 另開 follow-up change / C 本 change 收斂措辭與既有 spec 共存
- **拍板**：A 加入本 change
- **理由**：
  - 既有 spec 已有打樣三分概念但無實作機制（clone / lifecycle_status / derived_from_print_item_id 等）；本 change 提供實作層細節，自然應與既有概念性描述對齊
  - 同 change 內統一處理可避免中間時段 spec 之間描述不一致
  - 命名差異（OK / NG 製程 / NG 稿件 → ok / ng_artwork / ng_process）若不同步修訂，未來看 state-machines / business-processes 的人不知道對應實作 enum 名稱
- **trade-off**：本 change 範疇從「單 spec」擴張為「3 specs」，但變更性質仍屬同一主題（打樣結果業務判定 + 棄用建新印件機制的概念到實作完整對齊），不違反 OpenSpec change 內聚原則；production-task spec 不擴張（既有 spec 沒有「打樣 ProductionTask 屬性」概念，打樣由 WorkOrder.type 區分）

### D6：對齊 Prototype 既有實作 — 重大方向調整

- **背景**：apply 階段檢查 Prototype（[src/types/order.ts:38](../../../sens-erp-prototype/src/types/order.ts)、[src/pages/WorkOrderDetail.tsx](../../../sens-erp-prototype/src/pages/WorkOrderDetail.tsx)、[src/store/useErpStore.ts:2482-2592](../../../sens-erp-prototype/src/store/useErpStore.ts)）發現 AR-12 議題 1 + 議題 2 業務機制 Prototype 早已實作完整；本 change 工作重新定位為「補 spec 對齊既有實作」+「補結構化追溯 FK 增強」
- **選項**：A 對齊 Prototype（最小改動）/ B 對齊 Prototype + 補結構化追溯（折衷）/ C Prototype 對齊新 spec（最大改動）
- **拍板**：B 折衷
- **對齊範圍**：
  - 欄位命名：`sampleResult`（不採用 `proofing_result`）
  - Enum 值：`'待確認' / 'OK' / 'NG-製程問題' / 'NG-稿件問題'`（中文措辭 + 含初始「待確認」狀態）
  - 觸發位置：打樣 WorkOrder 詳情頁（不採用「印件詳情頁」）
  - 棄用狀態：用既有 `PrintItemStatus = '已棄用'`（不新增 `lifecycle_status` 獨立欄位）
  - 取消 `proofing_result_note` 欄位（Prototype 沒有；判定理由透過 ActivityLog 文字描述涵蓋）
  - ActivityLog 走訂單層（弱型別文字 `Order.activityLogs`），印件層 PrintItemActivityEvent 不擴張
- **新增範圍（補強 Prototype）**：
  - `PrintItem.derived_from_print_item_id` FK PrintItem nullable：結構化追溯關聯，補 Prototype 既有 notes 文字追溯的反向查詢能力
  - 主管覆寫 UI 層阻擋（AR-10，Prototype 目前採事後拒絕，需後續改動）
- **理由**：
  - Prototype 既有實作經過審稿模組 add-prepress-review change archive 階段拍板，業務邏輯已被驗證
  - 雙重命名（sampleResult vs proofing_result）/ 雙重狀態機制（PrintItemStatus 已棄用 vs lifecycle_status）會造成 spec 與 Prototype 落差，後續維護困難
  - 結構化追溯 FK 為實際補強（Prototype 既有 notes 文字無法做反向查詢「此印件衍生過哪些新印件」），是本 change 真正創造的設計價值
- **trade-off**：spec 命名遷就 Prototype（中文 enum），不一定符合通用工程命名習慣；但本 change 範疇是 ERP（業務系統，中文措辭合理）— 不算問題

---

### D4：AR-12 ng_process 下游另開 OQ 而非本 change 設計

- **選項**：A 本 change 設計 ng_process 下游（建新打樣 ProductionTask / NCR disposition / 其他）/ B 留 OQ 暫不展開
- **拍板**：B 留 OQ AR-13
- **理由**：
  - 業務尚未累積足夠 ng_process 案例，過早設計可能與實際業務不符
  - production-task v0.4 NCR 機制（rework / use_as_is / scrap）需評估與打樣場景的整合方式（這是跨 spec 設計，超出本 change 範疇）
  - 本 change 範疇聚焦「業務判定 enum 機制」+「ng_artwork 下游」即可達成 user story v2 校對的主要目標
  - 中間時段 ng_process 印件可能停留在「業務判定後但無系統下游」狀態 — 短期可接受（業務手動跟印務協調）

## Risks / Trade-offs

- **[Risk] clone 機制可能漏複製某些 PrintItem 欄位，導致新印件流程不完整** → [Mitigation] spec 明示 clone 範圍：**保留**（稿件需求規格 / 客戶資訊 / 訂單關聯 / 印件難易度 / client_note 等業務屬性）+ **reset**（reviewDimensionStatus / ReviewRound[] / current_round_id / assignedReviewerId / proofing_result / lifecycle_status = active）；實作期針對未明示欄位走「保留」預設
- **[Risk] 主管覆寫候選清單為空（所有審稿員能力都不足）時主管無路可走** → [Mitigation] 新增 Scenario「可選清單為空時 UI 提示」明示應對動作（請先調整能力等級或恢復原審稿員），UI 須顯示 actionable 提示而非空白清單
- **[Risk] PrintItem 新增 4 個欄位影響既有 query / Prototype 顯示** → [Mitigation] 4 欄位均為 nullable（lifecycle_status 預設 active，其餘預設 NULL）；既有 query 不依賴新欄位仍可正常運作
- **[Trade-off] 業務判定 ng_process 但下游處理未定** → 本 change 只記錄判定結果（proofing_result + proofing_result_note），下游動作（重做打樣 / NCR / 其他）待 AR-13 解後實作；中間時段 ng_process 印件可能停留在「業務判定後但無下游」狀態 — 短期可接受
- **[Trade-off] derived_from_print_item_id 追溯關聯只單向（新印件 → 原印件）** → 原印件查詢「自此衍生的新印件」需 reverse query；spec 不額外建立雙向欄位避免冗餘；Prototype 詳情頁可在原印件顯示 reverse query 結果

## Migration Plan

無資料庫遷移考量（Prototype 階段尚未有 production data）。

archive 後同步動作：

1. 新開 OQ AR-13「打樣 ng-製成問題下游處理機制」（candidate：建新打樣 ProductionTask 重做 / 轉 NCR 走 production-task spec disposition 機制等；待業務累積案例後再決定）
2. close OQ [AR-10](../../../memory/erp/ERP_Vault/08-open-questions/AR-10-主管覆寫分派是否允許破例派工.md) + [AR-12](../../../memory/erp/ERP_Vault/08-open-questions/AR-12-打樣後新稿件實體機制與根因判定.md)（補決議段）
3. 同步 user story [US-AR-004](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-004-覆寫印件分派.md) + [US-AR-011](../../../memory/erp/ERP_Vault/13-user-stories/prepress-review/US-AR-011-打樣後重新處理稿件.md)（移除「待 OQ 解答」措辭 + 補決議結果）
4. Vault 卡同步：
   - [05-entities/印件](../../../memory/erp/ERP_Vault/05-entities/印件.md)：新增 4 個欄位描述
   - [04-business-logic/打樣流程](../../../memory/erp/ERP_Vault/04-business-logic/打樣流程.md)：補業務判定 enum + ng_artwork 觸發棄用建新流程
   - [04-business-logic/審稿分配規則](../../../memory/erp/ERP_Vault/04-business-logic/審稿分配規則.md)：補主管覆寫 UI 層阻擋設計理由
5. CLAUDE.md § Spec 規格檔清單更新（prepress-review v1.5 → v1.6）
6. doc-audit 跑一次驗證跨檔案一致性

## Open Questions

本 change 引入 1 個新 OQ：

- **AR-13**：打樣 ng-製成問題下游處理機制（archive 後新開；candidate 候選方案：建新打樣 ProductionTask 重做 / 轉 NCR 走 production-task spec disposition 機制 / 其他；待業務累積案例後再決定）
