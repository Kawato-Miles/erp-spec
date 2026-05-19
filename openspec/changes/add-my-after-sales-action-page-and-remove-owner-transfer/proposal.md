## Why

既有的售後服務設計（[add-after-sales-ticket](../archive/2026-05-18-add-after-sales-ticket) 2026-05-18 歸檔）已提供訂單詳情頁售後 Tab、首頁 `MyAfterSalesBucket` widget、訂單列表售後欄位、業務主管後台轉派頁。但業務 / 諮詢實務上**漏單沒處理**（widget 信號太被動 + 無專屬作業頁面），且 Miles 確認**業務主管不會介入轉派**，既有轉派功能屬冗餘。需新增「我的售後服務」作業頁解決漏單痛點，同時移除冗餘的轉派功能。

商業背景對應 Vault：[售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)（角色、欄位、case_category / responsibility 邏輯）、[業務角色卡](../../../memory/erp/ERP_Vault/03-roles/業務.md) 與 [諮詢角色卡](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)（諮詢繼承業務權限，含售後 ticket owner 行為）。

## What Changes

### 新增（解決漏單痛點）

- 新建「我的售後服務」作業頁（`/my-after-sales`）：業務 / 諮詢可見的個人作業視圖，列出 `openedBy = self AND status ≠ 已結案` 的 AfterSalesTicket
- 頁面結構：頂端待辦摘要（逾期 / 待填決議 / 待結案 三張數字卡）+ 依 next action 分組的 ticket 列表
- 預設視圖：「我的未結案」（單一視圖，不做 saved views）
- 卡片明示 next action 提示：「待填 resolution」「待建關聯動作」「待結案」
- 完整篩選器：case_category / responsibility / 受理區間 / 訂單編號搜尋
- 業務平台 sidebar 新增「我的售後服務」入口（業務 / 諮詢可見）
- 業務 / 諮詢 sidebar 「我的售後服務」入口 SHALL 顯示未結案 ticket 數字徽章作為 quick glance 提醒（取代既有 widget 的提醒功能）

### 修改（諮詢角色明確化）

- AfterSalesTicket 既有 Requirement 中所有「業務 SHALL / 業務 WHEN」描述補入「業務 / 諮詢」（schema 不變，僅文字明確化；user-roles spec 既有「諮詢繼承業務權限」Requirement 已隱含支援，但 after-sales-ticket spec 文字應顯式化）
- ~~業務看板「我的未結案售後」分桶 Requirement~~：改為 REMOVED（見下方），業務 / 諮詢看板（首頁 `Index.tsx`）即為「需求單管理」頁，業務情境上不該嵌入售後 widget，故移除整個分桶與對應 `MyAfterSalesBucket` 元件
- 訂單詳情頁售後 Tab 建單流程：建單者為當前使用者（業務 / 諮詢）

### **BREAKING** 移除（業務主管轉派 + 錯位的售後 widget）

- AfterSalesTicket spec REMOVED：「業務離職 / 請假時 ticket 負責人轉派」整個 Requirement
- AfterSalesTicket schema REMOVED：`owner_transfer_log` 欄位
- AfterSalesTicket spec REMOVED：「業務看板『我的未結案售後』分桶」整個 Requirement（首頁 `Index.tsx` 為「需求單管理」頁，業務情境上不該嵌入售後 widget；新模組 + sidebar 入口數字徽章已替代「漏單提醒」功能）
- Prototype REMOVED：
  - `src/pages/sales-manager/ManageAfterSalesTicketOwnership.tsx` 整頁、`/sales-manager/after-sales-tickets` 路由、業務主管 sidebar 入口、`useErpStore.transferAfterSalesTickets` action、`OwnerTransferLog` type / interface
  - `src/components/order/MyAfterSalesBucket.tsx` 整個元件、`src/pages/Index.tsx` 中對該元件的 import 與嵌入
- sales-platform spec REMOVED：「業務主管後台售後服務單轉派」入口 Requirement（若有）

### Open Questions（不阻擋本 change）

- [OQ AFT-1 業務離職 / 請假時未結案 ticket 的實務替代處理方式](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md)：本 change 移除轉派功能後，業務離職實務替代方案待後續釐清
- [OQ AFT-2「逾期」是否分 7 / 14 / 30 三級](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-2-逾期分級.md)：MVP 維持 7 天單一閾值，分級設計待後續

## Capabilities

### New Capabilities

無（本 change 在既有 capabilities 上修改）

### Modified Capabilities

- `after-sales-ticket`：新增「我的售後服務作業頁」Requirement（含 sidebar 入口數字徽章）、新增「業務 / 諮詢角色售後 ticket 權限範圍」Requirement、AfterSalesTicket 實體欄位明確化「業務 / 諮詢」並移除 `owner_transfer_log` 欄位、移除「業務看板分桶」Requirement、移除「業務離職轉派」Requirement
- `sales-platform`：新增「業務平台『我的售後服務』入口」Requirement、移除「業務主管後台『售後服務單轉派』入口」Requirement（若該 Requirement 既存於 sales-platform spec）

## Impact

### 受影響的 OpenSpec specs

- `openspec/specs/after-sales-ticket/spec.md`：主修
- `openspec/specs/sales-platform/spec.md`：sidebar 入口調整

### 受影響的 Prototype（`/Users/b-f-03-029/sens-erp-prototype/src/`）

**新增**：
- `pages/MyAfterSales.tsx`：新作業頁主元件
- `components/order/MyAfterSalesActionCard.tsx`：卡片含 next action 提示（從 `MyAfterSalesBucket.TicketRow` 抽出並擴充）
- `store/useErpStore.ts` 新 selectors：`selectMyActiveAfterSalesTickets`、`selectMyAfterSalesActionGroups`、`selectMyAfterSalesSummary`

**修改**：
- `App.tsx`：加 `/my-after-sales` 路由
- `components/layout/AppSidebar.tsx`：業務 / 諮詢加新入口（含未結案 ticket 數字徽章）；移除 `/sales-manager/after-sales-tickets` 入口
- `components/order/AfterSalesSection.tsx`：建單 owner 從 currentUser 推導（業務 / 諮詢通用）、文案調整
- `pages/Index.tsx`：移除 `MyAfterSalesBucket` import 與嵌入（首頁回歸純需求單列表頁）

**移除**：
- `pages/sales-manager/ManageAfterSalesTicketOwnership.tsx`：整頁
- `components/order/MyAfterSalesBucket.tsx`：整個元件（無其他引用點）
- `store/useErpStore.ts` 中 `transferAfterSalesTickets` action
- `types/afterSalesTicket.ts` 中 `OwnerTransferLog` 相關 type / interface
- 既有 mock data 中 `ownerTransferLog` 欄位（mock data 不需保留歷史紀錄）

### Vault 同步影響

- [售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)：核心欄位段移除 `owner_transfer_log`、相關角色段移除「訂單管理人：批次轉派 ticket 負責人」
- [諮詢角色卡](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)：frontmatter `module` 加 `after-sales-ticket`
- 新增 2 個 OQ 卡至 [`08-open-questions/`](../../../memory/erp/ERP_Vault/08-open-questions/)（AFT-1 業務離職實務、AFT-2 逾期分級）

### 不影響範圍

- AfterSalesTicket 狀態機（受理中 → 處理中 → 已結案 三狀態不變）
- AfterSalesTicket case_category 7 enum / responsibility 3 enum / resolution 4 enum 不變
- 訂單列表「售後狀態」欄位與篩選器（既有運作維持）
- 訂單詳情頁「售後服務」Tab 結構（既有運作維持，僅建單 owner 邏輯微調）
- OrderAdjustment / PrintItem 關聯邏輯不變
- user-roles spec 不動（既有「諮詢繼承業務權限」Requirement 已隱含支援）
