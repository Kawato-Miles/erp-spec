## Why

業務主管目前在中台僅能透過「訂單列表 + 售後狀態 filter」間接查看部門內未結案售後訂單，缺乏 ticket-centric 視角的全公司售後監控頁面；當客戶投訴 / 公司認賠案件跨業務 / 諮詢負責人發生時，主管必須一一打開訂單詳情頁才能掌握全貌，且看不到「最後活動時間」這類「ticket 是否停滯」的關鍵跟催信號。本 change 新增中台「售後服務」頁（路由 `/sales-manager/after-sales`），讓業務主管以唯讀視角檢視全公司所有 AfterSalesTicket，作為他在 Slack 與業務跟催的決策入口，與業務平台「我的售後服務」對稱。

商業背景：依 [user-roles spec § 業務主管角色職責](../../specs/user-roles/spec.md) 既有設計，業務主管「不參與 AfterSalesTicket 系統流程」+ 「核可決策範圍 = 部門內」，但業務主管對「售後事件處理品質」具高度利害關係（售後是公司整體服務水準指標）。本 change 確立「**檢視範圍 = 全公司唯讀**」與「**核可決策範圍 = 部門內**」並存的職責邊界，補完業務主管在售後模組的角色定位。

## What Changes

- **ADDED** `after-sales-ticket` capability 新 Requirement「業務主管全公司售後管理頁」
  - 路由 `/sales-manager/after-sales`（中台），sidebar 入口在「訂單管理_業務主管」group 第 4 個 sub item
  - 範圍：全公司所有 AfterSalesTicket（**不過濾** `Order.approved_by_sales_manager_id = self`），跨業務主管管轄
  - 動作：純檢視 + 整行可點擊跳訂單詳情頁售後 Tab（唯讀）
  - 頁面結構：嚴格對齊 [DESIGN.md § 6.1 範式 B](../../../sens-erp-prototype/DESIGN.md) — 搜尋 + 篩選 + 統計卡同一 Card → 操作列 → ErpTableCard + 表格 → ErpPagination
  - 12 欄表格（在「我的售後服務」11 欄基礎上新增「業務 / 諮詢負責人」+「最後活動時間」，移除獨立「操作」欄改整行可點擊）
  - 6 個篩選器（Next action / status / 售後類型 / 責任歸屬 / 業務 / 諮詢負責人 / 受理區間），主篩用 `<select>` 嚴守列表頁版型範式
  - 3 張摘要卡（逾期 / 待填決議 / 待結案）與「我的售後服務」對稱、可點擊 toggle next action filter
  - 預設 status filter ∈ {受理中, 處理中}（排除已結案），主管可篩到已結案查歷史
  - 預設排序：`opened_at` 升序，PAGE_SIZE = 10
  - 無 sidebar 數字徽章（管理視角無 `opened_by = self` 概念）
- **MODIFIED** `user-roles` capability § 業務主管角色職責
  - 補充「中台售後服務檢視」職責措辭，明示「檢視範圍 = 全公司唯讀」與「核可決策範圍 = 部門內」並存的設計理由
  - **ADDED** Scenario「業務主管查看非管轄業務的售後 ticket」紀律邊界
- **ADDED** Prototype 工程改動（不影響 spec，但 tasks 內涵蓋）
  - `calcMyAfterSalesSummary` helper 函式擴充以支援非 user-scoped 查詢（全公司範圍）
  - 既有路由 `/sales-manager/after-sales-tickets`（已 REMOVED）redirect 至新路由 `/sales-manager/after-sales` + Toast「已升級為全公司售後管理頁」
- **無 BREAKING**：本 change 純新增管理頁 + 角色職責補完，不變更既有業務 / 諮詢「我的售後服務」行為、不變更 AfterSalesTicket 實體 / 狀態機 / lifecycle、不變更會計查閱路徑

## Capabilities

### New Capabilities
無。本 change 不新建 capability。

### Modified Capabilities
- `after-sales-ticket`：ADDED 新 Requirement「業務主管全公司售後管理頁」（頁面結構 / 路由 / 過濾規則 / 篩選器 / 表格欄位 / 摘要卡 / 跳轉行為 / Scenarios）
- `user-roles`：MODIFIED § 業務主管角色職責，補「中台售後服務檢視」職責 + ADDED Scenario「業務主管查看非管轄業務的售後 ticket」

## Impact

**Spec 異動**：
- `openspec/specs/after-sales-ticket/spec.md`：v0.5 → v0.6
- `openspec/specs/user-roles/spec.md`：MODIFIED § 業務主管角色職責 + ADDED Scenario

**Prototype 工程影響**：
- 新增 page：`src/pages/sales-manager/SalesManagerAfterSales.tsx`（或 `src/components/sales-manager/`）
- 新增 sidebar 入口：`src/components/layout/AppSidebar.tsx` 中業務主管 group 第 4 個 sub item
- 既有路由 redirect：`src/App.tsx` router 加 `/sales-manager/after-sales-tickets` → `/sales-manager/after-sales`（含 Toast）
- helper 擴充：`src/types/afterSalesTicket.ts` 的 `calcMyAfterSalesSummary` 或新建並列函式 `calcAfterSalesSummary(tickets, options?)`
- E2E 測試：Playwright `src/test/sales-manager/` 新增 spec 涵蓋導航 / 篩選 / 摘要卡 toggle / 跳轉 / 權限 / redirect

**OQ 處置**：
- **新建 OQ AFT-9**：「最後活動時間」欄是否需升級為 `last_activity_at` derived field（避免 `updatedAt` 語意污染）
- **關聯既有 OQ AFT-1**：「業務離職轉派」（業務主管全公司售後管理頁可作為「主管監督所有 ticket + Slack 協調介入」的部分替代方案，正式離職轉派實務留 AFT-1 持續觀察）

**無下列影響**：
- 不影響 AfterSalesTicket 實體 / 狀態機 / lifecycle
- 不影響業務 / 諮詢「我的售後服務」行為
- 不影響會計「訂單詳情頁售後 Tab 唯讀查閱」路徑
- 不影響 OrderAdjustment / PrintItem / Payment / SalesAllowance 等下游模組
- 不影響商業流程 / 狀態機 spec
- 不引入新 API / 新 entity / 新狀態值

**業務團隊影響**：
- 業務主管：新增中台「售後服務」sidebar 入口，每日工作流新增「掃描全公司售後狀況」例行動作（與既有「訂單審核 / 訂單異動審核」並列）
- 業務 / 諮詢：無影響，繼續使用業務平台「我的售後服務」
- 會計：無影響，繼續從訂單詳情頁售後 Tab 唯讀查閱
- Supervisor / 訂單管理人 / 印務主管 / 審稿主管 / EC商品管理：無影響（中台 sidebar 不顯示「售後服務」入口）

**參考連結**：
- [Notion 業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05)（業務主管監督售後跟催情境，後續可補相關業務情境）
- [Notion ERP Test Case DB](https://www.notion.so/2b93886511fa817fbd65e7608726f036)（本 change 完成後新增「業務主管全公司售後管理頁」test case 集）
- 對稱結構參考：`openspec/specs/after-sales-ticket/spec.md` § Requirement: 我的售後服務作業頁
- 業界對標：Zendesk escalation queue / Freshservice Supervisor Rules / Global Shop Solutions Dashboards
