## 1. Vault 商業層同步（先做：商業層 ground truth）

- [ ] 1.1 更新 [售後服務實體卡](../../../memory/erp/ERP_Vault/05-entities/售後服務.md)：核心欄位段移除 `owner_transfer_log` row；相關角色段移除「訂單管理人：批次轉派 ticket 負責人」這行；frontmatter `last-reviewed` 更新為今日日期
- [ ] 1.2 更新 [諮詢角色卡](../../../memory/erp/ERP_Vault/03-roles/諮詢.md)：frontmatter `module` 陣列加 `after-sales-ticket`；備註段補一句「諮詢角色 SHALL 具備與業務角色相同的售後 ticket 模組權限與操作能力」對應 user-roles spec § 諮詢角色額外職責
- [ ] 1.3 驗證 OQ 檔已建立：`memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md` 與 `after-sales-ticket-AFT-2-逾期分級.md` 兩檔存在，frontmatter 完整

## 2. 移除業務主管轉派功能（BREAKING）

- [ ] 2.1 刪除 `/Users/b-f-03-029/sens-erp-prototype/src/pages/sales-manager/ManageAfterSalesTicketOwnership.tsx` 整檔
- [ ] 2.2 從 `App.tsx` 移除 `/sales-manager/after-sales-tickets` 路由宣告與對應 import
- [ ] 2.3 從 `AppSidebar.tsx` 移除「售後服務單轉派」sidebar 入口（line 79 附近）
- [ ] 2.4 從 `useErpStore.ts` 移除 `transferAfterSalesTickets` action 與相關 state slice
- [ ] 2.5 從 `types/afterSalesTicket.ts` 移除 `OwnerTransferLog` interface 與 `AfterSalesTicket.ownerTransferLog` 欄位
- [ ] 2.6 從 `data/mockAfterSalesTickets.ts`（如有 seed data）移除 `ownerTransferLog` 屬性
- [ ] 2.7 全域搜尋 `ownerTransferLog` / `transferAfterSalesTickets` / `OwnerTransferLog` / `ManageAfterSalesTicketOwnership` 確認無殘留引用（含 test 檔）

## 3. Store 與 type 擴展（新模組基礎）

- [ ] 3.1 在 `types/afterSalesTicket.ts` 新增 `MyAfterSalesActionGroup` 型別（枚舉：`'逾期' | '待填決議' | '待建關聯動作' | '待結案'`）
- [ ] 3.2 在 `types/afterSalesTicket.ts` 新增 `MyAfterSalesSummary` 型別（含 `overdueCount` / `awaitingResolutionCount` / `awaitingLinkedActionCount` / `awaitingCloseCount`）
- [ ] 3.3 在 `useErpStore.ts` 新增 selector `selectMyActiveAfterSalesTickets(currentUserName)` 回傳當前使用者未結案 ticket
- [ ] 3.4 在 `useErpStore.ts` 新增 selector `selectMyAfterSalesActionGroups(currentUserName)` 依 next action 分組（逾期 / 待填決議 / 待建關聯動作 / 待結案），組內按 `openedAt` 升序，分組互斥（逾期優先）
- [ ] 3.5 在 `useErpStore.ts` 新增 selector `selectMyAfterSalesSummary(currentUserName)` 回傳頂端待辦摘要數字
- [ ] 3.6 為 selector 邏輯撰寫 unit test（覆蓋 D1 的 4 個分組條件 + 逾期優先互斥邏輯）

## 4. 「我的售後服務」作業頁

- [ ] 4.1 新建 `src/components/order/MyAfterSalesActionCard.tsx`：從 `MyAfterSalesBucket.TicketRow` 抽出 + 擴充欄位（含 next action CTA 與訂單編號 / 客戶名稱 / `case_category` / `responsibility` / `resolution` / `openedAt` 相對時間）
- [ ] 4.2 新建 `src/components/order/MyAfterSalesSummaryCards.tsx`：三張數字卡（逾期紅 / 待填決議黃 / 待結案灰），點擊跳對應分組錨點
- [ ] 4.3 新建 `src/components/order/MyAfterSalesFilters.tsx`：篩選器（`case_category` / `responsibility` / 受理區間 / 訂單編號搜尋）
- [ ] 4.4 新建 `src/pages/MyAfterSales.tsx`：頁面組裝（AppLayout + 標題 + Summary + Filters + 依 next action 分組的 list），組內以 `MyAfterSalesActionCard` 渲染
- [ ] 4.5 處理空狀態：當篩選後 ticket 列表為空時顯示「目前無待處理售後服務單」+ 說明文
- [ ] 4.6 在 `App.tsx` 加 `/my-after-sales` 路由綁定 `MyAfterSales` 元件
- [ ] 4.7 在 `AppSidebar.tsx` 新增「我的售後服務」入口（業務 / 諮詢角色可見，會計與業務主管 / Supervisor 不可見）
- [ ] 4.8 sidebar 入口顯示未結案 ticket 數字徽章（透過 `selectMyActiveAfterSalesTickets` 即時計算）

## 5. 首頁清理（移除錯位的售後 widget）

- [ ] 5.1 從 `src/pages/Index.tsx` 移除 `MyAfterSalesBucket` 的 import 與 `<MyAfterSalesBucket />` 嵌入；首頁回歸純 `QuoteListPage`
- [ ] 5.2 刪除 `src/components/order/MyAfterSalesBucket.tsx` 整檔
- [ ] 5.3 全域搜尋 `MyAfterSalesBucket` 確認無殘留引用（含 test 檔）
- [ ] 5.4 修改 `AfterSalesSection.tsx` 建單流程：`openedBy` 從 `currentUser.name` 推導（業務 / 諮詢通用），文案 review 確認無「業務」字眼誤導

## 6. 視覺與互動驗證（dev server + browser dogfood）

- [ ] 6.1 於 `/Users/b-f-03-029/sens-erp-prototype` 跑 `npm run dev`（localhost:8080），瀏覽器登入業務角色驗證：
   - sidebar 看到「我的售後服務」入口 + 數字徽章
   - 進入頁面顯示頂端摘要 + 依 next action 分組
   - 點摘要卡跳對應分組
   - 點 ticket 卡跳訂單詳情頁售後 Tab + 自動展開
   - 篩選器組合 / 訂單編號搜尋運作正確
   - 空狀態文案正確
- [ ] 6.2 切換到諮詢角色重複 6.1 驗證
- [ ] 6.3 切換到會計角色驗證：sidebar 不顯示「我的售後服務」入口；直接 visit URL 被擋
- [ ] 6.4 切換到業務主管 / Supervisor 角色驗證：sidebar 不再顯示「售後服務單轉派」入口；直接 visit `/sales-manager/after-sales-tickets` 被擋（404 或重定向）
- [ ] 6.5 驗證 `Index.tsx`（首頁，標題「需求單管理」）回歸純需求單列表內容，無任何售後 widget 殘留
- [ ] 6.6 驗證 sidebar「我的售後服務」入口顯示未結案數字徽章（任何頁面都可見），結案 1 張後徽章即時更新

## 7. e2e Playwright 測試

- [ ] 7.1 新增 `tests/e2e/my-after-sales.spec.ts`：頁面進入 + 摘要顯示 + 分組顯示 + 卡片點擊跳訂單詳情頁
- [ ] 7.2 補 spec：篩選器組合 + 訂單編號搜尋 + 空狀態
- [ ] 7.3 補 spec：業務 / 諮詢兩角色各自看到自己 ticket，看不到他人 ticket
- [ ] 7.4 補 spec：會計 / 業務主管角色 sidebar 入口不顯示
- [ ] 7.5 補 spec：舊路由 `/sales-manager/after-sales-tickets` 已不存在或被重定向
- [ ] 7.6 跑全套 e2e（smoke + navigation + my-after-sales + 售後相關舊 spec 確認未破壞）並要求 console.error / pageerror 零容忍

## 8. 文件與一致性稽核

- [ ] 8.1 跑 `openspec validate add-my-after-sales-action-page-and-remove-owner-transfer --strict` 確認 spec 結構通過
- [ ] 8.2 觸發 `doc-audit` skill 檢查跨檔案一致性（after-sales-ticket spec / sales-platform spec / Vault 售後服務卡 / Vault 諮詢角色卡）
- [ ] 8.3 確認本 change 已從 plan 同步至 CLAUDE.md § Spec 規格檔清單 § 售後服務 row（版本 / 狀態註記）
- [ ] 8.4 確認 `memory/erp/ERP_Vault/08-open-questions/` 兩 OQ 檔仍為 `status: open`，與本 change 解決範圍對齊

## 9. 歸檔準備

- [ ] 9.1 跑 `/opsx:verify add-my-after-sales-action-page-and-remove-owner-transfer` 確認所有 tasks 完成且實作符合 specs
- [ ] 9.2 commit 本 change 內所有檔案異動（含 Vault 同步 / spec / Prototype），commit message 依規範 `feat: 新增「我的售後服務」作業頁 + 移除業務主管轉派功能（add-my-after-sales-action-page-and-remove-owner-transfer）`
- [ ] 9.3 待 Miles 確認後跑 `/opsx:archive add-my-after-sales-action-page-and-remove-owner-transfer` 歸檔 change（delta specs 合併入 main spec）
