# Cutover Follow-up + Archive 預備文件

本 change `unify-billing-installment-and-reconciliation-csv` 採「漸進並存」策略，主要功能（型別 / Store / UI 共用元件 / CSV 匯出 / OQ / US / e2e）已落地並驗證。剩餘 8 個 task 屬「結構性取代」（D-final-B）— 移除舊架構並修所有引用點，建議作為獨立 follow-up change 處理。

## D-final-B 範圍（建議 follow-up change 名稱：`remove-legacy-payment-plan-planned-invoice-junction`）

### 移除舊型別（2 task）
- **1.7**：`src/types/payment.ts` 移除 PaymentPlan interface + derivePlanStatus / calcPlanCollectedAmount helpers
- **1.8**：`src/types/plannedInvoice.ts` 全檔移除

### 移除舊 Mock（1 task）
- **3.4**：移除 `mockPaymentPlans.ts` MOCK_PAYMENT_PLANS export / `mockPlannedInvoices.ts` 全檔 / `mockInvoices.ts` MOCK_PAYMENT_INVOICES export；store 改直接維護 mockBillingInstallments + mockPaymentAllocations 靜態檔（取代動態 backfill）

### UI 取代（4 task）
- **4.5**：OrderInvoiceSection「一鍵開立發票」入口從 PlannedInvoice 改 BillingInstallment 觸發；Invoice.sourceBillingInstallmentId 寫入必填化
- **4.6**：OrderInvoiceSection「手動開立發票」MUST 指定 sourceBillingInstallmentId（業務於 dialog 內選擇來源期次）
- **4.13**：OrderInvoiceSection 移除舊 PlannedInvoiceListCard / EditDialog（並合併「請款期次（v2 統一規劃）」上方既有區塊）
- **4.14**：OrderInvoiceSection 移除舊 PaymentInvoice junction 編輯 UI（業務手動勾選分攤金額 row）

### 三方對帳公式對齊（1 task）
- **4.9**：OrderReconciliationPanel 三方對帳「發票對應收款」derived 從 PaymentInvoice junction 改用 PaymentAllocation 推導；既有「應收 / 發票淨額 / 收款淨額」公式沿用 v1.13 無需重寫

## Follow-up change 設計建議

### Why
本 change 已將規劃層雙實體（PaymentPlan + PlannedInvoice）合併為 BillingInstallment + 落地 PaymentAllocation 取代 PaymentInvoice junction，但**舊型別 / Mock / UI 仍並存以保編譯**。Follow-up change 完成 cutover，正式移除舊架構。

### Scope（capabilities）
Modified Capabilities：
- `prototype-data-store`：移除 PaymentPlan / PlannedInvoice / PaymentInvoice 三型別 + 對應 mock
- `prototype-shared-ui`：移除 PlannedInvoiceListCard / PaymentInvoice junction 編輯 UI
- `order-management`：OrderInvoiceSection 開票流程改 BillingInstallment 觸發

### Migration（編譯破壞點需修）
grep 所有引用點：
- `import.*PaymentPlan` 引用點（OrderPaymentSection / Receivables / PendingInvoices / etc.）
- `import.*PlannedInvoice` 引用點（OrderInvoiceSection / Receivables / PendingInvoices / store / etc.）
- `MOCK_PAYMENT_PLANS` / `MOCK_PLANNED_INVOICES` / `MOCK_PAYMENT_INVOICES` 引用點
- `paymentInvoices`（state / props / helpers）引用點

### 預估規模
- 8 task / 2-3 session
- 需 Playwright e2e 完整跑通 13 業務情境（前置條件：本 change 的 e2e 框架已建立）

## 本 change 累計成果（archive 時參考）

### 主要交付
- **新增實體**：BillingInstallment（合併 PaymentPlan + PlannedInvoice，含雙維度狀態 / source_type 五值 / split_from_installment_id 純追溯 / original 日期凍結基準 / change_count derived / cancelled 軟刪除）+ PaymentAllocation（取代 PaymentInvoice junction，含 auto_allocated / manually_overridden / locked_by_period_close 三 flag）+ BillingActivityEvent（7 個事件型別）
- **新增 UI 元件**：BillingInstallmentListCard / BillingInstallmentEditDialog / BillingInstallmentSplitDialog / OriginalVsCurrentDateLabel / PaymentAllocationDialog / OrderBillingInstallmentSection / ReconciliationCsvExportDialog
- **新增 CSV 匯出**：14 欄對帳 CSV 含應收日繼承 / 月底基準 / 帳期天數 + UTF-8 BOM 編碼；月結批次差錯訂單清單 mock helper
- **異動審核簡化**：補收正項 OA 跳過審核中間態直達已執行 + 大額閾值（50000）Slack mock 監督；退款負項沿用 v1.13 主管核可
- **諮詢三情境連動**：consultation_cancellation / consultation_end_no_production / quote_lost 三 source_type 自動建 BillingInstallment

### 觀測指標 11 個
- NSM ① 訂單款項操作時間 ≤ 45 天
- NSM ② 三方對帳差錯訂單率 ≤ 1%
- 營運 ③ 建期次步數 ≥ 8 → ≤ 4
- 營運 ④ 期次變更次數 per-installment 平均 ≤ 1.5
- 營運 ⑤ 收款手動覆寫率 ≤ 20%
- 營運 ⑥ CSV 匯出 + 對帳完成率 ≥ 95%
- 模組 ⑦ 退款 OA 審核 SLA ≤ 8 小時
- 模組 ⑧ 拆票兩條路徑分佈觀測
- 模組 ⑨ 諮詢取消退款處理中→已完成 ≤ 5 工作天
- Miles 補充 ⑩ 訂單收款變更率
- Miles 補充 ⑪ 收款逾期天數

### OQ 立案決策軌跡
- Miles 已拍板 3 OQ：OQ-BI-5 拆期 lineage / OQ-US-1 user story 範疇 / OQ-BI-1 source_type enum
- 已關閉 1 OQ：OQ-BI-F 既有資料 Migration（依 scope-boundary 紀律）
- 11 個 BI- 系列 OQ 開檔：BI-1 ~ BI-11
- 12 個 US 補完：US-ORD-020 ~ US-ORD-031

### Vault audit-log
完整立案決策軌跡寫入 `memory/erp/ERP_Vault/00-meta/audit-log.md`（含 Miles 新增 KPI ⑩⑪ 採納紀錄 + 啟示 3 條）

## CLAUDE.md § Spec 規格檔清單摘要預備文字（task 7.2 / 7.3）

archive 時將以下文字附加至 CLAUDE.md 對應 row 的「狀態」欄：

### order-management row
> v1.14：unify-billing-installment-and-reconciliation-csv 2026-MM-DD 歸檔 — ADDED「請款期次（BillingInstallment）統一實體」（合併 PaymentPlan + PlannedInvoice 雙頭維護）+ ADDED「期次↔發票 1:1 嚴格約束 + 一鍵開票繼承」+ ADDED「拆票 = 拆期」（獨立平輩期次 + split_from_installment_id 純追溯，Miles OQ-BI-5 拍板）+ ADDED「期次變更稽核軌跡」（original 日期凍結 + change_count + 7 個 ActivityLog 事件型別）+ ADDED「期次雙維度狀態」（開票/收款獨立，支援先收後開）+ ADDED「收款核銷分配（PaymentAllocation 依序填滿 + 業務手動覆寫 diff-based）」+ ADDED「補收 OA 跳過審核中間態 + 大額閾值監督」+ ADDED「退款 OA 不進期次」+ ADDED「對帳 CSV 匯出 14 欄」（Miles 拍板含月底基準 + 帳期天數）+ ADDED「訂單收款變更率」「收款逾期天數」兩個 KPI（Miles Phase 4 後補充）+ MODIFIED 廢止「付款計畫變更觸發訂單回業務主管審核」改為留軌跡稽核 + REMOVED PaymentPlan / PlannedInvoice / PaymentInvoice junction 於 spec 標廢止（prototype 階段並存、cutover 由 follow-up change `remove-legacy-payment-plan-planned-invoice-junction` 處理）

### state-machines row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 ADDED BillingInstallment 雙維度狀態機（開票維度 / 收款維度 derived）+ MODIFIED OrderAdjustment 狀態機（補收正項跳過「待主管審核」直達「已執行」）+ 廢止「付款計畫變更觸發訂單回審」改為留軌跡

### user-roles row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 MODIFIED 業務主管職責調整（廢止付款計畫變更回審、僅核可退款負項 OA、新增大額補收事後監督）+ MODIFIED 業務職責（補收 OA 直接執行免主管核可）+ ADDED 會計職責（CSV 匯出 + 月結對帳差錯訂單追蹤）

### business-processes row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 ADDED 請款 + 核銷流程（合併規劃層雙實體 + 自動分配）+ ADDED 補收 / 退款不對稱操作流（訂單完成前後分容器）+ ADDED 先收後開操作流（雙維度狀態獨立）+ ADDED 期次規劃 invariant + 三方對帳警示

### consultation-request row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 MODIFIED 諮詢三情境自動建 PlannedInvoice 改為自動建 BillingInstallment + source_type 三值分流（consultation_cancellation / consultation_end_no_production / quote_lost，Miles OQ-BI-1 拍板）

### after-sales-ticket row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 MODIFIED 售後 ticket 內建 OA 沿用補收 / 退款不對稱新流程（補收正項免審 + 退款負項沿用主管核可）+ ticket 內補收場景由業務新增 BillingInstallment（取代既有 PaymentPlan）

### prototype-data-store row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 ADDED BillingInstallment / PaymentAllocation / BillingActivityEvent 三個型別 + 對應 store state / actions / selectors + backfill helper（buildBillingInstallmentsFromLegacy）動態合併 MOCK_PAYMENT_PLANS + MOCK_PLANNED_INVOICES + MOCK_PAYMENT_INVOICES；PaymentPlan / PlannedInvoice / PaymentInvoice 三型別 spec 標廢止（prototype 階段並存，cutover 由 follow-up change 處理）

### prototype-shared-ui row
> 2026-MM-DD unify-billing-installment-and-reconciliation-csv 歸檔 ADDED 5 個新元件：BillingInstallmentListCard / OriginalVsCurrentDateLabel / BillingInstallmentEditDialog / BillingInstallmentSplitDialog / PaymentAllocationDialog + ReconciliationCsvExportDialog（financ 模組）+ OrderBillingInstallmentSection（OrderPaymentSection 內掛載並存）；嚴格沿用既有共用元件（ErpTableCard / ErpInfoTable / ErpEmptyState / Dialog / ErpFormField / Badge / lucide icons）組合而非新造輪子
