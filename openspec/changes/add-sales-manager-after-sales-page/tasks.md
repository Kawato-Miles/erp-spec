## 1. Helper 與型別擴充

- [x] 1.1 在 `src/types/afterSalesTicket.ts` 新建 `calcAfterSalesSummary(tickets, orderAdjustments, printItems, options?)` 函式 + 並列 `groupAfterSalesByAction`（不限定 owner）；既有 `calcMyAfterSalesSummary` / `groupMyAfterSalesByAction` 改為 wrapper（filter user 後呼叫新 helper）
- [x] 1.2 確認 `calcMyAfterSalesActionGroup` 函式不依賴 `currentUserName`（簽名為 `(ticket, orderAdjustments, printItems, options)`，無 user 參數，可直接重用）
- [x] 1.3 確認 `updatedAt` 在所有 transitions（`transitionTicketToProcessing` / `transitionTicketToClosed` / `modifyTicketResolution`）+ `appendComplaintLog` 正確更新（line 248 / 270 / 289 / 308 皆有寫入；`slackThreadUrl` 變更走 useErpStore mutation 不在此檔，驗證留 e2e）

## 2. Page 元件實作

- [x] 2.1 新建 `src/pages/sales-manager/SalesManagerAfterSales.tsx` page 元件骨架（AppLayout + title「售後服務」+ breadcrumb [首頁, 訂單管理, 售後服務]）
- [x] 2.2 實作搜尋框（訂單編號 / 案名 / 客戶名稱 / 售後單號，部分匹配、不分大小寫）
- [x] 2.3 實作篩選 grid 第一行 4 欄：next action select / status select / case_category select / responsibility select
- [x] 2.4 實作篩選 grid 第二行 4 欄：業務 / 諮詢負責人 select（單選）/ 受理區間 date range / 預留 / 預留
- [x] 2.5 實作 StatusCard grid 3 張：逾期 / 待填決議 / 待結案（沿用 `StatusCard` 元件 + `SummaryButton` toggle 邏輯）
- [x] 2.6 實作操作列：右對齊「重設篩選」按鈕（依篩選 active 狀態 disabled）
- [x] 2.7 實作 12 欄表格（`ErpTableCard scrollX` + `table.erp-table`），含 colgroup 寬度設定
- [x] 2.8 實作整行可點擊（`row onClick` 跳轉 `/orders/:orderId?tab=afterSales&ticket=:ticketId`）
- [x] 2.9 實作 `ErpPagination` 分頁（PAGE_SIZE = 10）
- [x] 2.10 實作預設排序 `opened_at` 升序
- [x] 2.11 實作預設 status filter ∈ {受理中, 處理中}（排除已結案，主管可顯式切換）
- [x] 2.12 實作 `opened_by` 欄 hover tooltip 顯示角色（業務 / 諮詢）
- [x] 2.13 實作「最後活動時間」欄（沿用 `updatedAt`，顯示相對時間如「3 天前」）
- [x] 2.14 實作 `NextActionBadge` 與 `StatusBadge`（可從 `MyAfterSales.tsx` 抽取至 `components/shared/after-sales-badges.tsx` 共用）
- [x] 2.15 實作空狀態：「目前沒有符合條件的售後服務單」row + 條件式提示文案（filter active vs 真實無資料）

## 3. Sidebar 與路由

- [x] 3.1 在 `src/components/layout/AppSidebar.tsx` 業務主管 group「訂單管理_業務主管」加第 4 個 sub item「售後服務」，path = `/sales-manager/after-sales`
- [x] 3.2 確認 sub item 無數字徽章（與「訂單審核」「訂單異動審核」一致風格）
- [x] 3.3 在 `src/App.tsx` 加路由 `<Route path="/sales-manager/after-sales" element={<SalesManagerAfterSales />} />`
- [x] 3.4 在 `src/App.tsx` 加 redirect 規則 `/sales-manager/after-sales-tickets` → `/sales-manager/after-sales` + Toast 提示「已升級為全公司售後管理頁」
- [x] 3.5 在 `roleAllowedPaths.sales_manager` 加 `/sales-manager/after-sales` 路徑

## 4. 權限與資料範圍驗證

- [x] 4.1 確認業務主管 visit `/sales-manager/after-sales` 可看到全公司所有 ticket（不過濾 `Order.approved_by_sales_manager_id`）
- [x] 4.2 確認業務 / 諮詢 / 會計 / Supervisor / 訂單管理人 / 印務主管 / 審稿主管 / EC商品管理 visit 此路徑被拒絕並 redirect 至各角色首頁
- [x] 4.3 確認其他中台角色 sidebar 不顯示「售後服務」入口（僅業務主管可見）
- [x] 4.4 確認業務主管跳轉至訂單詳情頁售後 Tab 後仍為唯讀視角（訂單詳情頁的權限控制負責）

## 5. E2E 測試（Playwright）

- [x] 5.1 在 `src/test/sales-manager/` 新建 `salesManagerAfterSales.spec.ts`
- [x] 5.2 Smoke 測試：業務主管登入後可導航至 `/sales-manager/after-sales`、看到全公司 ticket 列表
- [x] 5.3 篩選測試：status filter（預設 ∈ {受理中, 處理中}、可切換已結案）
- [x] 5.4 篩選測試：next action filter / case_category / responsibility / 受理區間
- [x] 5.5 篩選測試：業務 / 諮詢負責人 filter 收斂為單一 owner
- [x] 5.6 摘要卡 toggle 測試：點擊「逾期」摘要卡套用 filter、再點取消、其他卡數字依篩選後重新計算
- [x] 5.7 跳轉測試：點擊 ticket 行跳至 `/orders/:orderId?tab=afterSales&ticket=:ticketId`
- [x] 5.8 權限測試：業務 / 諮詢 / 會計 visit `/sales-manager/after-sales` 應被拒絕並 redirect
- [x] 5.9 Redirect 測試：visit 舊路由 `/sales-manager/after-sales-tickets` 應 redirect + Toast 顯示
- [x] 5.10 空狀態測試：filter 過嚴或全公司無資料時顯示對應文案
- [x] 5.11 分頁測試：25 張 ticket 時顯示 3 頁，切換頁正確顯示對應資料

## 6. 文件與 OQ 同步

- [x] 6.1 觸發 `oq-manage` mode B 新建 OQ AFT-9「最後活動時間 derived field 升級條件」於 Vault `memory/erp/ERP_Vault/08-open-questions/`
- [x] 6.2 更新 CLAUDE.md § Spec 規格檔清單：標 after-sales-ticket spec v0.5 → v0.6（本 change 歸檔後生效）+ user-roles spec MODIFIED
- [x] 6.3 更新 Vault `00-meta/audit-log.md`：記載本 change 歸檔事件
- [x] 6.4 確認 [Notion ERP Test Case DB](https://www.notion.so/2b93886511fa817fbd65e7608726f036) 後續新增「業務主管全公司售後管理頁」test case 集（不在本 change 範圍，archive 後另開）

## 7. Type Check 與 Build 驗證

- [x] 7.1 跑 `pnpm tsc --noEmit` 確認 TypeScript 無錯誤
- [x] 7.2 跑 `pnpm build` 確認生產構建成功
- [x] 7.3 跑 `pnpm test` 確認既有測試（含「我的售後服務」測試）未受影響
- [x] 7.4 在 localhost:8080 手動驗證：(a) 業務主管登入後 sidebar 看到「售後服務」入口、(b) 點擊進入頁面看到全公司 ticket、(c) 篩選與摘要卡 toggle 正常、(d) 整行點擊跳訂單詳情頁、(e) 業務角色 visit 此路徑被拒絕

## 8. 三視角驗收前審查（過渡期）

- [x] 8.1 跑 `/opsx:verify` 前不觸發三視角審查（依本 change 變動性質「流程節點調整單模組內」分級，**不觸發驗收前審查**）
- [x] 8.2 由 PM Phase 4 已收斂並拍板，跳過此步驟
