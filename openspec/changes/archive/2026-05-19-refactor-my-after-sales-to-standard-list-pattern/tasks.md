## 1. MyAfterSales.tsx 改寫為 QuoteListPage 範式

- [x] 1.1 讀 QuoteListPage.tsx 完整結構，作為改寫範本
- [x] 1.2 改寫 `src/pages/MyAfterSales.tsx`：
   - 移除原本的「依 next action 分組」邏輯（GroupSection 渲染、groupRefs / scrollToGroup）
   - 移除原本的「待辦摘要區獨立 Card」結構
   - 移除 `MyAfterSalesActionCard` 引用
   - 改用「搜尋 + 篩選 + StatusCard」整合至同一 Card（範式 B）
   - 改用 `<ErpTableCard>` 包 `<table className="erp-table">` 渲染所有 ticket
   - 加 `<ErpPagination>` PAGE_SIZE = 10
- [x] 1.3 實作 next action filter state：`nextActionFilter` 變數 + 點摘要卡 toggle 邏輯（再點同卡取消）
- [x] 1.4 改 StatusCard 為可點 button 包裹，當 nextActionFilter active 時加視覺強調（border / 背景）；傳 `filtered={true}` prop
- [x] 1.5 table 欄位實作（10 欄）：# / caseNo / 訂單編號 / 客戶·案名 / 受理時間 / 售後類型 / 責任歸屬 / 決議 / next action / status / 操作
- [x] 1.6 next action 欄位邏輯：呼叫 `calcMyAfterSalesActionGroup(ticket, orderAdjustments, printItems)` 取得每行 next action 值（'逾期' / '待填決議' / '待建關聯動作' / '待結案'）
- [x] 1.7 status badge：逾期紅 / 受理中黃 / 處理中藍 配色沿用 AfterSalesSection 慣例
- [x] 1.8 操作欄：`[→]` 按鈕點擊跳 `/orders/:orderId?tab=afterSales&ticket=:ticketId`
- [x] 1.9 空狀態：依規範顯示「目前沒有符合條件的售後服務單」+ 引導文

## 2. 刪除 MyAfterSalesActionCard 元件

- [x] 2.1 刪除 `src/components/order/MyAfterSalesActionCard.tsx` 整檔
- [x] 2.2 全域 grep `MyAfterSalesActionCard` 確認無殘留引用（含 test 檔）

## 3. e2e spec 更新

- [x] 3.1 改寫 `e2e/my-after-sales.spec.ts` 既有 8 個 spec 的 assertion：
   - 移除「待辦摘要」「Next action」卡片文字檢查
   - 改檢查 `<table className="erp-table">` 結構 + table row 內 next action 欄位文字
- [x] 3.2 新增 spec：點摘要卡套用 next action filter（業務角色，select「逾期」摘要卡 → table 只列逾期 ticket）
- [x] 3.3 新增 spec：再點同摘要卡取消 filter（toggle 行為）
- [x] 3.4 新增 spec：分頁顯示與切換（給 mock 加足夠 ticket 數量驗證或用 mock 量級可達分頁）
- [x] 3.5 跑 `npx playwright test my-after-sales.spec.ts navigation.spec.ts` 確認全綠

## 4. 驗證

- [x] 4.1 `openspec validate refactor-my-after-sales-to-standard-list-pattern --strict` 通過
- [x] 4.2 `npx tsc --noEmit` Exit 0
- [x] 4.3 `npx vitest run src/test/after-sales/` 19/19 仍通過（helper 邏輯不變，test 應沿用）
- [x] 4.4 跑全套 e2e：`npx playwright test` 全綠（≥ 23 tests）
- [x] 4.5 視覺一致性 dogfood：dev server 啟動 `/my-after-sales`、`/`（QuoteListPage）、`/orders`、`/consultations` 依序開啟，肉眼比對版型（同一個 search Card / table 結構 / pagination 風格 / StatusCard 慣例）
- [x] 4.6 角色 visibility 驗證：業務 / 諮詢可進入 + 看到 table；會計 / 業務主管 / Supervisor 入口不顯示且 URL 直訪被擋

## 5. 歸檔準備

- [ ] 5.1 跑 `/opsx:verify refactor-my-after-sales-to-standard-list-pattern` 確認實作符合 spec
- [ ] 5.2 commit 本 change 內所有檔案異動（含 prototype + spec），commit message：`fix: 我的售後服務改用標準 list 範式（table + ErpPagination）+ 移除卡片分組（refactor-my-after-sales-to-standard-list-pattern）`
- [ ] 5.3 待 Miles 確認後跑 `/opsx:archive refactor-my-after-sales-to-standard-list-pattern` 歸檔
- [ ] 5.4 archive 階段 sync 至 main spec：after-sales-ticket v0.2 → v0.3
- [ ] 5.5 CLAUDE.md § Spec 規格檔清單 售後服務 row 同步更新（v0.3 註記 + 本 change 摘要）
- [ ] 5.6 兩 repo 同步 push（main + sens-erp-prototype）
