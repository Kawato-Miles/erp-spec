## 0. 前置 / Blocker：StatusCard 元件擴充

> 必須在 Task 1（DESIGN.md 補強）之前完成，因規範文字會引用 `count: number | string` 與 `filtered` prop。

- [x] 0.1 修改 [StatusCard.tsx](sens-erp-prototype/src/components/shared/StatusCard.tsx) 介面：`count` 型別 `number` → `number | string`
- [x] 0.2 元件內部使用 `String(count)` 隱轉，確保 number / string 兩種入參都能顯示
- [x] 0.3 新增 `filtered?: boolean` prop（預設 `false`），為 `true` 時 Card 上顯示「（當前篩選）」muted text 或「已篩選」小 badge（採方案 a：label 後 muted text）
- [x] 0.4 視覺無回歸驗證：dev server 已啟動（localhost:8082），既有 19+ 使用點都傳 number → `{count}` → `{String(count)}` React render 語義相同；filtered 預設 false 不渲染標記；實機 filtered 視覺效果留至 Task 3 Receivables 實作時驗證
- [x] 0.5 `npx tsc --noEmit` 通過（無 error）
- [x] 0.6 既有 e2e 測試（`/Users/b-f-03-029/sens-erp-prototype/e2e/*.spec.ts`）無 StatusCard 直接斷言；元件擴充由三模組頁面 e2e 在 Task 3-5 覆蓋

## 1. 規範先行：補強 DESIGN.md § 6.1

- [x] 1.1 在 [DESIGN.md § 6.1](sens-erp-prototype/DESIGN.md) 範式 B 模板中，明確標註「`StatusCard` 統計 grid 應置於搜尋 Card 內部下方（篩選器之下）」
- [x] 1.2 在 § 6.1「列表頁共同準則」新增條款 7：「列表頁狀態主篩 MUST 使用 `<select>`，**MUST NOT 使用 `ErpStatusTabs`**」
- [x] 1.3 在 § 6.1 新增「狀態主篩 vs 上層 view 切換操作性判定」段（4 項判定條件表格 + 正反例）
- [x] 1.4 在 § 6.1「列表頁共同準則」新增條款 8/9：KPI 卡 SHALL 用 `StatusCard`、數值來源 `rows`、篩選非預設傳 `filtered={true}`
- [x] 1.5 在 § 6.1 新增條款 10：KPI 卡片數量視業務必要性，1-4 卡皆可
- [x] 1.6 在 § 6.1 條款 12 明定 `QuoteListPage.tsx` 為 canonical reference
- [x] 1.7 在 § 6.1 新增「列表頁稽核清單」12 項
- [x] 1.8 § 6.1 範式 B 模板視覺對齊：`rounded-lg` / `font-medium` / 搜尋框左內嵌 `Search` icon（含 `pl-9`）
- [x] 1.9 在 § 0.1「列表頁不得按狀態拆多張表」末加「具體實作細節見 § 6.1」交叉引用
- [x] 1.10 在 § 9 版本記錄追加 2026-05-19 條目（含對應 change 名稱）

## 2. 規範先行：補強 prototype-shared-ui spec

- [x] 2.1 delta spec 內容已完整（5 個 ADDED Requirement：列表頁標準佈局 / StatusCard 元件擴充 / 款項管理 / 諮詢單 / QuoteListPage 對齊）。套用至 main spec 由 `/opsx:archive` 時自動執行
- [x] 2.2 已驗證：main spec 既有 4 個 Requirement（ErpSummaryGrid 三項 + 印件詳情頁 Tabs 化版型）與 delta 新增 5 個主題完全不重疊，無內容衝突

## 3. 重構 Receivables.tsx 作為新樣板

- [x] 3.1 移除上方 KPI Card（含 `StatItem` 元件 4 卡）
- [x] 3.2 移除 `ErpStatusTabs` 區塊
- [x] 3.3 OverdueBucket 改為 `<select>` 篩選器（6 options：全部 / 未到期 / 1-29 / 30-59 / 60-89 / ≥90 天）
- [x] 3.4 搜尋 Card 容器 `rounded-lg`、標題 `font-medium`、`space-y-4`
- [x] 3.5 搜尋框左內嵌 `Search` icon、Input `pl-9`
- [x] 3.6 StatusCard grid-4：待收訂單 / 待收金額（string）/ 逾期未收 / 逾 30 天
- [x] 3.7 KPI 數值來源改為 `rows`（依當前篩選動態重算）
- [x] 3.8 `isFiltered` 邏輯 + StatusCard 4 卡都傳 `filtered={isFiltered}`
- [N/A] 3.9 此檔案無分頁（待收訂單通常不多，現況未實作分頁；保持現況符合 Non-Goals 不改動既有業務邏輯）
- [x] 3.10 移除原檔的 `function StatItem(...)` 元件定義
- [x] 3.11 tsc --noEmit 通過；dev server 已啟動於 localhost:8082；實機 filtered 視覺驗證留待 Task 6 三視角審查 round 2 / 用戶 UAT
- [N/A] 3.12 e2e 目錄無 finance / receivable / payment 既有 spec；新增 e2e 不在本 change scope（屬於另一個獨立 task）

## 4. 依新樣板重構 PendingInvoices.tsx

- [x] 4.1 套用 Receivables 新樣板（移除 KPI Card / ErpStatusTabs，搜尋 Card 整合 select + StatusCard）
- [x] 4.2 狀態 select 5 options：全部 / 尚有時間 / 即將到期 / 今天 / 逾期
- [x] 4.3 StatusCard 4 卡：待開總筆數 / 待開金額（string）/ 逾期未開 / 即將到期
- [x] 4.4 KPI 數值來源改為 `pendingRows`
- [x] 4.5 `isFiltered` 邏輯 + 4 卡都傳 `filtered={isFiltered}`
- [x] 4.6 「業務尚未規劃」提示文字保留，置於搜尋 Card 內 StatusCard 之下
- [x] 4.7 移除原檔的 `function StatItem(...)` 元件定義
- [x] 4.8 tsc --noEmit 通過；e2e 目錄無 pending-invoices spec，新增測試不在本 change scope

## 5. 重構 BillingAnomalies.tsx（含 OQ-1 決議）

- [x] 5.1 OQ-1 已確認：採方案 B（grid-2 「訂單帳不平 / 異常項目」），不加 banner
- [x] 5.2 StatusCard grid-2 實作：訂單帳不平（amber icon）/ 異常項目（destructive icon）
- [x] 5.3 異常類型 select 5 options：全部 / 退印未折讓 / 加印未開發票 / 退款未實際退款 / 超收
- [x] 5.4 移除上方 AlertTriangle 警告 Card，警告語意以 amber icon 整合進「訂單帳不平」StatusCard
- [x] 5.5 KPI 數值來源改為 `rows`，`isFiltered` + StatusCard 2 卡傳 `filtered={isFiltered}`
- [x] 5.6 移除 ErpStatusTabs
- [x] 5.7 tsc --noEmit 通過；e2e 目錄無 billing-anomalies spec，新增測試不在本 change scope

## 5.5. 重構 ConsultationRequestList.tsx（同款違規一併修正，決策 7）

- [x] 5.5.1 套用 Receivables / PendingInvoices 新樣板（移除 ErpStatusTabs、搜尋 Card 整合 select + StatusCard）
- [x] 5.5.2 狀態 select 5 options：全部 / 待諮詢 / 已轉需求單 / 完成諮詢 / 已取消
- [x] 5.5.3 StatusCard grid-4：對應 4 個狀態（待諮詢 / 已轉需求單 / 完成諮詢 / 已取消），KPI 數值來源 `filtered` 動態
- [x] 5.5.4 視覺對齊：`rounded-lg` / `font-medium` / 搜尋框內嵌 `Search` icon
- [x] 5.5.5 業務邏輯（諮詢單流程、surveycake webhook）完全保留
- [x] 5.5.6 tsc --noEmit 通過；setPage(1) 重置邏輯保留；e2e 目錄無 consultation 列表 spec，新增測試不在本 change scope

## 5.6. QuoteListPage canonical reference 動態 KPI 同步（決策 8）

- [x] 5.6.1 `statusCounts` useMemo 從 `quotes`（全域 scoped）改為 `filtered`（依篩選）
- [x] 5.6.2 新增 `isFiltered` 邏輯（6 個篩選器任一非預設）
- [x] 5.6.3 4 個 StatusCard 加 `filtered={isFiltered}` prop
- [x] 5.6.4 tsc --noEmit 通過；視覺已對齊（QuoteListPage 本就是 canonical reference，rounded-lg / font-medium / Search icon 都已存在）
- [N/A] 5.6.5 既有 e2e quote-to-order.spec.ts / quote-negotiation-to-deal.spec.ts 無對 KPI 卡的具體斷言；補測試不在本 change scope

## 6. 三視角審查 round 2（實作後）

> 規格期三視角審查已執行（見 conversation log）；此 round 為實作後審查。

- [ ] 6.1 觸發 senior-pm agent：審查實作是否真正解決「使用者跨模組學習成本」問題，是否有 UX 退化（select 兩步 vs Tab 一步在實際操作下的體感）
- [ ] 6.2 觸發 ceo-reviewer agent：審查 OQ-1 決議是否合理、是否符合業務追款日常需求；若 OQ-0 在審查中再次被提起，記錄並 follow-up
- [ ] 6.3 觸發 erp-consultant agent：審查實作與 spec 一致性、是否有規格未涵蓋的實作細節、`filtered` 標記視覺方案是否符合 SAP Fiori / NetSuite 業界做法
- [ ] 6.4 三視角審查回饋整合至 design.md「審查回饋」段落，必要時更新 spec / DESIGN.md

## 7. 跨檔案一致性檢查 + 收尾

- [ ] 7.1 觸發 doc-audit skill 檢查 DESIGN.md / spec / 6 個程式檔（StatusCard / Receivables / PendingInvoices / BillingAnomalies / ConsultationRequestList / QuoteListPage）之間的一致性
- [ ] 7.2 確認 `memory/shared/prototype-guidelines.md` 是否需補充列表頁規範指引（如有，附帶更新）
- [ ] 7.3 在 Vault `08-open-questions/` 開卡：**OQ-0「款項管理頁面業務日常的最重要決策」**作長期追蹤（CEO 視角審查提出，獨立於本 change）；OQ-1 解答後同步更新 Vault；OQ-2 / OQ-3 / OQ-4 列為 follow-up
- [ ] 7.4 `/opsx:verify` 驗證實作與 spec 一致
- [ ] 7.5 `/opsx:archive` 歸檔 change，main spec 自動合併 5 個 ADDED Requirement
