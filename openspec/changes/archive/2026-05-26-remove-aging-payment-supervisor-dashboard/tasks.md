# Tasks: remove-aging-payment-supervisor-dashboard

## 1. Prototype 程式碼移除

- [x] 1.1 `src/pages/finance/AgingPaymentsPage.tsx`：整檔刪除
- [x] 1.2 `src/App.tsx`：移除 `import AgingPaymentsPage from "./pages/finance/AgingPaymentsPage.tsx";`（原 L42）
- [x] 1.3 `src/App.tsx`：移除 `<Route path="/finance/aging-payments" element={<AgingPaymentsPage />} />`（原 L188）
- [x] 1.4 `src/components/layout/AppSidebar.tsx`：移除「款項管理」群組下的「老化處理中 Payment」navLink（原 L154-155，含註解 + 物件）
- [x] 1.5 `src/store/useErpStore.ts`：移除 `getAgingPendingPayments` interface 宣告（原 L661-676）
- [x] 1.6 `src/store/useErpStore.ts`：移除 `getAgingPendingPayments` implementation（原 L3942-3972）
- [x] 1.7 確認 `isPaymentAging` helper 保留（OrderPaymentSection L889 仍 import + 使用）
- [x] 1.8 確認 PaymentRecord.createdAt 欄位保留（老化判定仍要用）+ mockPayments 內 `pay-aging-demo-001` 保留（作為 row Badge 視覺驗證 mock）

## 2. Prototype dev 驗證

- [x] 2.1 TypeScript 編譯通過（`npx tsc --noEmit` 無 error output）
- [x] 2.2 dev server 啟動載入訂單詳情頁，console 無 error
- [x] 2.3 sidebar「款項管理」群組已無「老化處理中 Payment」項目（DOM 搜尋 `a[href^="/finance/"]` 無 aging-payments）
- [x] 2.4 路由 `/finance/aging-payments` 直接訪問顯示 NotFound（h1 = "404"、body 含 "找不到"）
- [x] 2.5 既有 e2e（playwright）spec 無引用 aging-payments 路徑 / AgingPaymentsPage / getAgingPendingPayments（grep 已驗證）

## 3. Spec 收尾

- [x] 3.1 `/opsx:verify` 驗證 change vs 實作對齊
- [x] 3.2 `/opsx:archive` 歸檔：specs/order-management/spec.md delta 套用至 main spec（取代既有 Requirement「處理中 Payment 老化追蹤」內容）
- [x] 3.3 archive 後確認 main spec 該 Requirement 收斂為 3 個 Scenario（原 4 個）+ 設計理由補註 csv 另議
- [ ] 3.4 CLAUDE.md § Spec 規格檔清單 — 訂單管理 row 補本 change archive 註

## 4. OQ 收尾

- [ ] 4.1 `memory/erp/ERP_Vault/08-open-questions/ORD-021-處理中Payment老化追蹤機制.md` resolved 決策補註：「2026-05-26 後續決策：主管看板入口移除、改用 csv 匯出後 Excel 篩選方式進行（csv 匯出機制另議，見新 OQ）」
- [ ] 4.2 新增 OQ 卡：`memory/erp/ERP_Vault/08-open-questions/ORD-NNN-Payment-csv-匯出機制.md`（編號接續、status = open），記錄 csv 匯出觸發位置 / 欄位 / 權限三項待釐清

## 5. 治理收尾

- [ ] 5.1 doc-audit skill 跑過
- [ ] 5.2 Sens repo commit + push（含 openspec/ + memory/ + CLAUDE.md）
- [ ] 5.3 sens-erp-prototype repo commit + push（含 src/ 修動）
