## Why

`add-my-after-sales-action-page-and-remove-owner-transfer` change（2026-05-19 歸檔 v0.2）建立的「我的售後服務」作業頁採用「依 next action 分組的卡片列表」呈現，**違反** [Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：「列表頁採『搜尋 + 多維度篩選 + 狀態統計卡 + **單一資料表** + 分頁』模式，**不得按狀態拆多張表**」+「列表頁狀態主篩 MUST 用 `select`，**MUST NOT** 用卡片或 Tab 分組呈現資料」。

跑偏 root cause：原 design D1 將 Miles 提到的「layout 用需求單詳情頁形式」誤套用，把容器版型（AppLayout + breadcrumb + spacing）與資料呈現範式（table / 卡片）混為一談。詳情頁可用卡片分組（QuoteDetailPage 範式），列表頁禁止卡片分組。

本次補修將 MyAfterSales 對齊 QuoteListPage / OrderList / ConsultationRequestList 範式 B，確保業務 / 諮詢角色在所有列表頁獲得一致 UX。已將案例寫入 Vault `11-review-knowledge/_shared/review-loading-checklist.md` § 三（2026-05-19 跨 agent 通用誤審），避免後續工作流重蹈覆轍。

商業背景對應 Vault：[售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)、[誤審記錄](../../../memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md)。

## What Changes

### 修改（標準 list pattern 對齊）

- MyAfterSales 內部資料呈現從「依 next action 分組的卡片」改為「單一 table + ErpPagination + StatusCard 統一摘要卡」
- next action 信號保留為 **獨立 table 欄位**（每行顯示「逾期 / 待填決議 / 待建關聯動作 / 待結案」），sortable / filterable
- 頂端摘要卡（逾期 / 待填決議 / 待結案）行為從「scroll 到分組」改為 **套用 next action filter（toggle 行為）**；再點同卡取消 filter
- 「搜尋 + 篩選 + StatusCard」整合至同一 Card（沿用 QuoteListPage 範式 B）
- table 欄位順序對齊既有列表頁慣例：`# | caseNo | 訂單編號 | 客戶 / 案名 | 受理時間 | 售後類型 | 責任歸屬 | 決議 | next action | status | 操作`
- 新增 `ErpPagination` 分頁（沿用 PAGE_SIZE = 10 與 ConsultationRequestList 一致）

### **BREAKING** 移除

- Prototype 移除 `src/components/order/MyAfterSalesActionCard.tsx` 整檔（卡片元件改為 `<tr>` inline，不再需要）

### 保留

- `src/types/afterSalesTicket.ts` 中 `calcMyAfterSalesActionGroup` / `groupMyAfterSalesByAction` / `calcMyAfterSalesSummary` helpers（next action 計算邏輯仍用於每行的欄位值 + 摘要數字）
- `MyAfterSalesSummary` / `MyAfterSalesActionGroup` types
- Unit test `src/test/after-sales/myAfterSalesGroups.test.ts`（19 個 test 邏輯不變）
- AppSidebar「我的售後服務」入口含未結案數字徽章
- 角色 visibility 規則（業務 / 諮詢可見、會計 / 業務主管 / Supervisor 不可見）

## Capabilities

### New Capabilities

無（在既有 capabilities 上修正）

### Modified Capabilities

- `after-sales-ticket`：MODIFIED「我的售後服務作業頁」Requirement（資料呈現範式從「依 next action 分組」改為「table 欄位 + filter」、摘要卡互動行為改為 toggle filter、新增分頁）

## Impact

### 受影響的 OpenSpec specs

- `openspec/specs/after-sales-ticket/spec.md`：MODIFIED「我的售後服務作業頁」Requirement

### 受影響的 Prototype（`/Users/b-f-03-029/sens-erp-prototype/`）

**修改**：
- `src/pages/MyAfterSales.tsx`：完整改寫為 QuoteListPage 範式 B（搜尋 + 篩選 + StatusCard 同一 Card + ErpTableCard + ErpPagination）
- `e2e/my-after-sales.spec.ts`：assertion 改為 table 結構驗證；加 filter toggle + 分頁 spec

**移除**：
- `src/components/order/MyAfterSalesActionCard.tsx`：整檔

### 不影響範圍

- AfterSalesTicket 實體欄位與狀態機（不變）
- next action 計算邏輯 helper（保留）
- AppSidebar 入口與數字徽章（不變）
- 角色 visibility / RoleGuard（不變）
- AfterSalesTicketDetail / AfterSalesSection / Index 等其他既有頁面（不動）
- DESIGN.md § 6.1 規範本體（不動，本 change 屬「修正既有頁對齊現有規範」而非「修改規範」）

### Vault 同步

- 已寫入 [`memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md`](../../../memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md) § 三：2026-05-19「我的售後服務」列表頁版型範式誤審案例（跨 agent 通用，含 4 條教訓 + 規則：「規劃任何新列表頁時，erp-consultant agent MUST 先讀 DESIGN.md § 6.1 + 對照 canonical reference」）
- `frontmatter` `last-reviewed` + `last-case-added` 已更新為 2026-05-19
