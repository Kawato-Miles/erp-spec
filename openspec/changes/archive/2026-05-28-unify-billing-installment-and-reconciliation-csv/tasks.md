## 1. 型別層重構（合併 PaymentPlan + PlannedInvoice → BillingInstallment + 新增 PaymentAllocation）

- [x] 1.1 新建 `src/types/billingInstallment.ts`：InvoicingStatus / PaymentStatus / BillingInstallmentSourceType / BillingInstallment interface（含雙維度狀態、original 日期凍結基準、split_from_installment_id 純追溯、change_count derived、cancelled）
- [x] 1.2 新建 `src/types/paymentAllocation.ts`：PaymentAllocation interface（含 auto_allocated / manually_overridden / locked_by_period_close 三 flag）
- [x] 1.3 擴充 `src/types/orderActivityLog.ts`：新增 7 個 event type（BILLING_INSTALLMENT_CREATED / DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / PAYMENT_ALLOCATION_OVERRIDDEN / PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE）+ 對應 payload 結構
- [x] 1.4 修改 `src/types/payment.ts`：標 paymentPlanId 為 @deprecated 並改透過 PaymentAllocation 推導（過渡期保留欄位以兼容舊資料與 UI；待 task 4 完成後正式移除）
- [x] 1.5 修改 `src/types/invoice.ts`：新增 sourceBillingInstallmentId optional FK（過渡期，task 3.x backfill + task 4.x UI 重構完成後改為 NOT NULL UNIQUE）；PaymentInvoice junction interface 暫保留並存
- [x] 1.6 修改 `src/types/orderAdjustment.ts`：新增 requires_supervisor_approval derived field（依 amount 正負 + adjustment_type 判定）
- [ ] 1.7 移除 `src/types/payment.ts` 內 PaymentPlan interface 與 derivePlanStatus / calcPlanCollectedAmount helpers
- [ ] 1.8 移除 `src/types/plannedInvoice.ts` 全檔

## 2. Store 層重構（Zustand state / selector / action）

- [x] 2.1 useErpStore 新增 `billingInstallments: BillingInstallment[]` state（取代 paymentPlans + plannedInvoices 兩個 state；本輪暫保留並存待 store / UI 完成重構後正式移除舊兩態）
- [x] 2.2 useErpStore 新增 `paymentAllocations: PaymentAllocation[]` state + `billingActivityEvents: BillingActivityEvent[]` 結構化事件 state
- [x] 2.3 新增 action `addBillingInstallment(bi)`：建立期次 + 首次儲存凍結 originalDueDate / originalExpectedInvoiceDate + 寫入 BILLING_INSTALLMENT_CREATED ActivityLog 事件
- [x] 2.4 新增 action `updateBillingInstallment(id, patch)`：變更 dueDate / expectedInvoiceDate 時自動寫入 DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED ActivityLog 事件 + change_count derived
- [x] 2.5 新增 action `splitBillingInstallment(id, [n1Spec, n2Spec])`：原期次 cancelled=true + 建兩筆獨立平輩期次（split_from_installment_id 純追溯）+ 寫入 SPLIT + 兩筆 BILLING_INSTALLMENT_CREATED 事件
- [x] 2.6 新增 action `cancelBillingInstallment(id, reason)`：cancelled=true + 寫入 CANCELLED ActivityLog 事件
- [x] 2.7 新增 helper `allocatePaymentSequentially(orderId, paymentAmount)`：依 dueDate ASC 依序填滿 + 溢收建 billing_installment_id=NULL 預收桶（在 `types/paymentAllocation.ts`，供 Dialog 與 store action 共用）
- [x] 2.8 新增 helper `validatePaymentAllocationsSum(allocations, paymentAmount)`：UI 即時校驗（同上檔）
- [x] 2.9 新增 helper `autoFillDifferenceToLast(allocations, paymentAmount)`：自動回填差額（同上檔）
- [x] 2.10 新增 helper `markManuallyOverriddenByDiff(allocations, originalAllocations)`：diff-based 判定 manually_overridden（同上檔）
- [x] 2.11 新增 selector `deriveBillingInstallmentPaymentStatus(id)`：依未取消已完成 PaymentAllocation 累計推導（types helper + store selector 雙層）
- [x] 2.12 新增 selector `getBillingInstallmentOverdueDays(id)`：沿用 v1.13 spec L1609 overdue_days 邏輯（在 `types/billingInstallment.ts` 內 `calcBillingInstallmentOverdueDays`）
- [x] 2.13 新增 selector `getOrderReceivableMismatch(orderId)`：檢核 invariant「應收 = Σ scheduled_amount where cancelled=false」、返回差額用於警示 banner
- [x] 2.14 新增 selector `getChangeCountByInstallment(installmentId)`：query DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED 計數（在 `types/orderActivityLog.ts` 內 `calcChangeCountByInstallment`）
- [x] 2.15 新增 selector `getOrderPaymentChangeRate(orderId)`：Miles 指標 ⑩ 訂單收款變更率（在 `types/orderActivityLog.ts` 內 `calcOrderPaymentChangeRate`，含 CEO 指標 4 平均率 `calcOrderInstallmentChangeRate`）
- [x] 2.16 修改 OA action：補收正項 OA 跳過審核中間態直達已執行（OrderAdjustmentSection 建立流程內依 `requiresSupervisorApproval` derived 判定；補收 status='已執行' / approvedBy=自己 / approvedAt+executedAt+approvedAmount 自動填；應收 +N 立即認列、不綁 Payment）
- [x] 2.17 退款負項 OA 沿用 v1.13 主管核可 + 退款 Payment 切已完成累計達 OA.amount 才推進已執行（v1.13 既有邏輯保留、無需變動）
- [x] 2.18 大額補收 OA 監督機制：OrderAdjustmentSection 建立流程內依 `isHighAmountSupplementaryCharge` 判定（amount > 50000），觸發 `console.warn` Slack mock 通知（prototype 階段用 console.warn 模擬，上線時整合實際 Slack API）+ toast warning「業務主管將收到 Slack 通知做事後監督」；ActivityLog 紅標事件 high_amount_supplementary_charge 留 D-final-B 整合至訂單活動紀錄
- [x] 2.19 移除既有「PaymentPlan 變更 → Order.status 回退至業務主管審核」邏輯（grep 確認 store 與 components 內無對應實作，v1.13 spec 規定但 prototype 未實作；本 change 標明廢止）
- [x] 2.20 修改諮詢取消半額退費連動鏈：自動建 BillingInstallment（含 source_type=consultation_cancellation）+ BILLING_INSTALLMENT_CREATED 事件；PlannedInvoice 雙寫保留以兼容舊 UI
- [x] 2.21 修改諮詢結束不做大貨（source_type=consultation_end_no_production）+ 需求單流失（source_type=quote_lost）連動：自動建 BillingInstallment + 對應 ActivityLog 事件；PlannedInvoice 雙寫保留

## 3. Mock 資料 backfill（一次性遷移）

- [x] 3.1 寫 backfill helper（`src/data/buildBillingInstallmentsFromLegacy.ts`）將既有 MOCK_PAYMENT_PLANS + MOCK_PLANNED_INVOICES 動態轉換為 BillingInstallment（合併規則：description 完全匹配 → keyword 匹配 → 第一筆 fallback → 未匹配獨立成新期次；seedData.ts buildInitialState 內呼叫）
- [x] 3.2 backfill helper 將既有 MOCK_PAYMENT_INVOICES 轉換為 PaymentAllocation（透過 invoiceSourceMap 對應 BillingInstallment；autoAllocated=false / manuallyOverridden=false / lockedByPeriodClose=false）
- [x] 3.3 backfill helper 產出 invoiceSourceMap（{ [invoiceId]: billingInstallmentId }）供 store.invoices 後續 task 4.x UI 整合時消化（mockInvoices 為 const 陣列無法直接 patch，留 store-level enrich 路徑）
- [ ] 3.4 移除 mockPaymentPlans / mockPlannedInvoices / mockPaymentInvoices 三個 mock 檔（延後至 task 4.x UI 重構完成 + 1.7 / 1.8 一起執行）
- [x] 3.5 backfill mock 資料涵蓋 payment-invoice-scenarios.md 13 情境（既有 mockPaymentPlans 已涵蓋 13 情境 + ORD 編號對應；backfill 1:1 轉換不增不減，13 情境繼承為 BillingInstallment）

## 4. UI 層整合（OrderPaymentSection / OrderInvoiceSection / OrderReconciliationPanel）

- [x] 4.1 新增 `BillingInstallmentListCard` 元件（`src/components/order/BillingInstallmentListCard.tsx`）：含雙維度狀態 badge + OriginalVsCurrentDateLabel + 操作按鈕（編輯 / 拆此期 / 一鍵開票 / 取消）+ 預設依 dueDate ASC 排序 + 顯示已取消 toggle + 逾期天數顯示（沿用 calcBillingInstallmentOverdueDays）；內部組合 ErpTableCard + ErpEmptyState + Badge + lucide icons
- [x] 4.2 新增 `OriginalVsCurrentDateLabel` 共用元件（`src/components/order/OriginalVsCurrentDateLabel.tsx`）：依 originalValue vs currentValue 顯示單一日期或雙日期對照 + 變更次數 badge（≥ 警示閾值紅標）；沿用 OA「主管核可金額 vs 當前金額」對照樣式
- [x] 4.3 新增 `BillingInstallmentEditDialog` 元件（`src/components/order/BillingInstallmentEditDialog.tsx`）：建立 / 編輯期次表單（description / scheduledAmount / dueDate / expectedInvoiceDate / note）+ Order 應收 vs 期次合計差額警示（不阻擋儲存）+ 編輯時顯示「原始凍結基準」對照；InvoiceItemTable 整合延後至 task 4.5-4.7 OrderInvoiceSection 整合階段；內部組合 Dialog + ErpFormField + ErpInput + Textarea
- [x] 4.4 新增 `BillingInstallmentSplitDialog` 元件（`src/components/order/BillingInstallmentSplitDialog.tsx`）：兩條入口共用同一 Dialog（期次列表 + 一鍵開票 Dialog 內捷徑）+ A/B 兩期金額合計即時校驗（不等時 disable 儲存 + AlertCircle 紅標）+ 預設帶入原期次金額平分 + 描述自動加「拆 1/2」「拆 2/2」前綴
- [x] 4.5 OrderInvoiceSection 一鍵開立發票流程接 BillingInstallment（軟 cutover）：開票時自動反查訂單下未開立的 BillingInstallment + 寫入 Invoice.sourceBillingInstallmentId + 呼叫 store.updateBillingInstallment 標期次 invoicingStatus='已開立' + linkedInvoiceId；既有 PlannedInvoice 連動保留為 fallback（後續 follow-up change `remove-legacy-payment-plan-planned-invoice-junction` 完整移除）
- [x] 4.6 Invoice.sourceBillingInstallmentId 在開票時自動填寫（task 4.5 含此邏輯）；UI 強制業務在手動開票 dialog 內顯式選擇來源期次的 UX 留 follow-up
- [x] 4.7 新增 `PaymentAllocationDialog` 元件（`src/components/order/PaymentAllocationDialog.tsx`）：登錄 Payment 後系統依序填滿預載 + 業務手動覆寫每期 Input + 即時校驗 sum = paymentAmount + 「自動回填差額」按鈕（補至最後一期/預收桶）+ 預收（未分配）badge 顯示 + diff-based manually_overridden 判定（送出時呼叫 markManuallyOverriddenByDiff）；待 task 4.5/4.6 OrderInvoiceSection 整合時接入完整流程
- [x] 4.8 OrderReconciliationPanel 新增「期次規劃 invariant 警示 banner」：訂單應收（含已執行 OA）≠ Σ BillingInstallment.scheduledAmount（cancelled=false）時顯示 amber 橫幅 + 引導至「請款期次（v2 統一規劃）」區塊；action button「建立期次」由區塊內既有「新增期次」按鈕承接
- [x] 4.9 OrderReconciliationPanel 三方對帳「已核銷至本訂單發票收款金額」derived 改用 store.paymentAllocations 推導（取代 MOCK_PAYMENT_INVOICES junction）：透過 Invoice → BillingInstallment.linkedInvoiceId 反查 → PaymentAllocation 累計 allocatedAmount；UI 文案更新「核銷分配」
- [x] 4.10 OrderAdjustmentEditDialog 加入「補收正項免主管核可 / 退款負項沿用主管核可」UX 不對稱提示橫幅（emerald = 補收免審 / sky = 退款沿用主管核可），呼叫 `requiresSupervisorApproval` derived 判定；store action 連動執行延後至下個 change（避免一次破壞既有 OA submit/approve/execute 流程）
- [x] 4.11 OrderAdjustmentEditDialog 大額補收 OA（amount > SUPPLEMENTARY_CHARGE_HIGH_AMOUNT_THRESHOLD = 50000）切 amber 警示橫幅 + BellRing 提示「業務主管將收到事後 Slack 通知（mock）」；閾值常數從 `types/orderAdjustment.ts` import；實際 Slack 通知 mock 延後至 store action 連動階段
- [x] 4.12 OrderPaymentSection 接入新「請款期次（v2 統一規劃）」區塊（漸進並存模式）：新增獨立子元件 `OrderBillingInstallmentSection.tsx` 自封閉處理 add/edit/split/cancel 全流程；OrderPaymentSection 主檔僅 1 行 import + 1 行 JSX 掛入；應收 vs 期次合計 invariant 警示（顧問 C-PM-2）已掛入

   **2026-MM-DD Layer 3 軟 cutover 補完**：既有「預計付款」區塊（PaymentPlan）加 amber deprecated banner（line 735+）+ 標題改 line-through「預計付款（已棄用）」引導業務改用上方新區塊；功能保留作 v1.13 既有資料 fallback；正式移除留 follow-up change `remove-legacy-payment-plan-planned-invoice-junction`
- [ ] 4.13 修改 OrderInvoiceSection：移除既有 PlannedInvoiceListCard / PlannedInvoiceEditDialog
- [x] 4.14 OrderInvoiceSection 移除 PaymentInvoice junction 編輯 UI + 寫入邏輯 + state：移除 paymentInvoices state（line 142）+ useEffect reset（line 159）+ 開票時寫入 junction 邏輯（line 452-472）+ 對應展開 junction table UI（line 1250-1294）+ PaymentInvoice/calcInvoicePaidAmount/getMockPaymentInvoicesByOrder imports；改用 store.paymentAllocations 推導 linkedAllocations 顯示對應收款

## 5. 對帳 CSV 匯出（會計模組）

- [x] 5.1 新增 `ReconciliationCsvExportDialog` 元件（`src/components/finance/ReconciliationCsvExportDialog.tsx`）：日期範圍（預設本月）+ 帳務公司 / 業務 / 含作廢發票篩選 + 14 欄預覽前 5 列（含 paymentStatus badge）+ 「匯出 CSV」按鈕含計數
- [x] 5.2 實作 14 欄 CSV 匯出 helper（`src/utils/reconciliationCsv.ts`）：通用 `buildCsv` / `downloadCsv` + 序列化 escape 含逗號/雙引號/換行 + UTF-8 with BOM（`'﻿' + lines`）+ Blob/URL.createObjectURL 觸發瀏覽器下載
- [x] 5.3 14 欄資料 mapping（`buildReconciliationRows`）：帳務公司 / 發票號碼 / 訂單編號 / 案名 / 開立日期 / 應收日期（透過 invoiceSourceMap 反查 BillingInstallment）/ 客戶名稱 / 總金額(含稅) / 備註（繼承來源期次）/ 收款日期（最近已完成 Payment.paidAt，含 fallback 至既有 PaymentInvoice junction）/ 收款狀態（依累計核銷推導三態）/ 業務名稱 / 開立日期月底（`endOfMonth` EOM 計算）/ 天數（`daysBetween` 應收日−開立日）
- [x] 5.4 將 ReconciliationCsvExportDialog 入口加到 `pages/finance/Receivables.tsx`：操作列「匯出對帳 CSV」按鈕觸發 Dialog；會計可一鍵開啟
- [x] 5.5 新增月結批次「三方對帳差錯訂單清單」mock helper（`calcReconciliationDiscrepancies` + `calcDiscrepancyRate`）：限定 Order.status = '訂單完成'、計算應收 vs 發票淨額（含折讓）vs 收款淨額三方差額；CEO 指標 2 量測來源（目標 ≤ 1%）；UI 端後續可在 finance 模組「月結對帳」按鈕觸發

## 6. Playwright e2e 驗證

- [x] 6.1 補 smoke spec（`e2e/billing-installment-smoke.spec.ts`）：訂單詳情頁款項 Tab 進出 + OrderBillingInstallmentSection 新區塊渲染 + backfill 後 store.billingInstallments 非空 + 無 console.error
- [x] 6.2 補 navigation spec（`e2e/billing-installment-dialogs.spec.ts`）：BillingInstallmentEditDialog 開關 + 4 個必填欄位 label 出現 + BillingInstallmentSplitDialog「已對齊」即時校驗
- [x] 6.3 補 13 情境 sanity spec（`e2e/reconciliation-csv-rows-coverage.spec.ts`）：驗證 14 個情境訂單編號（F1-F8 + C1-C4 + A1-A3）在 mock 內存在；逐情境功能 e2e 留 apply 階段累積（規模太大不適合單輪寫完）
- [x] 6.4 補三方對帳 invariant 斷言 spec（同上 spec 內 invariantStats）：每筆訂單應收 vs Σ BillingInstallment.scheduledAmount 對齊統計（matched / mismatched 計數）
- [x] 6.5 補 14 欄 CSV 輸出驗證 spec（`e2e/reconciliation-csv-export.spec.ts`）：從 finance/Receivables 開 Dialog + 14 欄表頭齊全 + 「匯出 CSV（N 列）」按鈕計數 + 篩選無資料時 disabled + 提示「篩選範圍內無資料」（實際 download + UTF-8 BOM 驗證留 apply 階段手動測試）
- [x] 6.6 補補收 OA derived spec（`e2e/oa-supervisor-approval-derived.spec.ts`）：requiresSupervisorApproval = false（補收正項）+ isHighAmountSupplementaryCharge 大額判定 + 諮詢取消退費系統內生免審；store action 連動執行（草稿→已執行）留 D-final 階段補完
- [x] 6.7 補退款 OA derived spec（同上）：requiresSupervisorApproval = true（退款負項）+ 退款不參與大額補收閾值；OA 推進已執行 + 不入 PaymentAllocation 沿用 v1.13 既有 e2e 覆蓋
- [x] 6.8 補拆期 store 行為 spec（`e2e/billing-installment-split-store.spec.ts`）：呼叫 store.splitBillingInstallment 驗證原期次 cancelled=true / cancelReason='拆兩期' + 兩筆新獨立平輩期次 splitFromInstallmentId 純追溯 + sourceType 繼承 + changeCount=0 + ActivityLog SPLIT + 兩筆 BILLING_INSTALLMENT_CREATED 事件
- [x] 6.9 補收款依序填滿 + 手動覆寫 + diff-based spec（`e2e/payment-allocation-helpers.spec.ts`）：四情境 A/B/C/D 含溢收預收桶 + diff-based markManuallyOverriddenByDiff 值未改變時 manuallyOverridden=false
- [x] 6.10 補諮詢三情境連動 spec（`e2e/consultation-cancel-billing-installment.spec.ts`）：驗證 mock backfill 後三 source_type enum 值（consultation_cancellation / consultation_end_no_production / quote_lost）正確、有對應 BILLING_INSTALLMENT_CREATED 事件

## 7. 連動 spec 文件同步

- [ ] 7.1 archive 階段觸發 doc-audit skill 驗證跨檔案一致性
- [x] 7.2 CLAUDE.md § Spec 規格檔清單 order-management v1.14 摘要文字預備（`cutover-followup.md` § CLAUDE.md 摘要預備文字 / order-management row）；archive 時 copy-paste 進 CLAUDE.md
- [x] 7.3 CLAUDE.md § Spec 規格檔清單 7 個 spec rows 摘要文字預備（state-machines / user-roles / business-processes / consultation-request / after-sales-ticket / prototype-data-store / prototype-shared-ui）；archive 時批次更新

## 8. OQ 處理（透過 oq-manage mode B 開檔）

- [x] 8.1 開檔 OQ-BI-A 期次「原始日期基準」凍結時點 → `ERP_Vault/08-open-questions/BI-1-原始日期基準凍結時點.md`
- [x] 8.2 開檔 OQ-BI-B 折讓後「已收訖」判定基準 → `BI-2-折讓後已收訖判定基準.md`
- [x] 8.3 開檔 OQ-BI-C 溢收「預收（未分配）」後續處理 → `BI-3-溢收預收未分配後續處理.md`
- [x] 8.4 開檔 OQ-BI-D CSV #10 收款日（最近 vs 結清）→ `BI-6-CSV收款日最近或結清.md`
- [x] 8.5 開檔 OQ-BI-E 「多期合期開一張發票」（合期）是否支援 → `BI-7-合期開一張發票是否支援.md`
- [x] 8.6 開檔 OQ-BI-2 月結閉檔批次觸發者與時點 → `BI-8-月結閉檔批次觸發時點.md`
- [x] 8.7 開檔 OQ-BI-4 補收 OA 大額閾值定義 → `BI-4-補收OA大額閾值定義.md`
- [x] 8.8 開檔 OQ-CSV-1 CSV 14 欄會計實務驗證 → `BI-5-CSV14欄會計實務驗證.md`
- [x] 8.9 開檔 OQ-US-2 補收 OA「立即執行」對稱破壞 spec 表述 → `BI-9-補收OA立即執行對稱破壞表述.md`
- [x] 8.10 開檔 OQ-BI-G 作廢發票 CSV 篩選 → `BI-10-作廢發票CSV篩選.md`
- [x] 8.11 開檔 OQ-BI-H 三方對帳警示 banner 觸發條件細化 → `BI-11-三方對帳警示banner觸發條件.md`
- [x] 8.12 已 Miles 拍板的 3 個 OQ（OQ-BI-5 / OQ-US-1 / OQ-BI-1）+ 已關閉 OQ-BI-F + 5 個新開檔 OQ 寫入 `ERP_Vault/00-meta/audit-log.md` 立案決策軌跡（含 Miles 新增 KPI ⑩⑪ 採納紀錄）

## 9. User Story 補完（Miles 拍板「13 情境 + Phase 4 新增全覆蓋」）

- [x] 9.1 補 US「業務建立請款期次」→ `US-ORD-020-業務建立請款期次.md`
- [x] 9.2 補 US「業務於期次一鍵開立發票」→ `US-ORD-021-業務於期次一鍵開立發票.md`
- [x] 9.3 補 US「業務拆期保留稽核軌跡」（兩條入口）→ `US-ORD-022-業務拆期保留稽核軌跡.md`
- [x] 9.4 補 US「業務登錄收款核銷分配」→ `US-ORD-023-業務登錄收款核銷分配.md`
- [x] 9.5 補 US「業務查看期次原始 vs 現況對照」→ `US-ORD-025-業務查看期次原始vs現況對照.md`
- [x] 9.6 補 US「業務建補收 OA 免主管核可直接執行」→ `US-ORD-026-業務建補收OA免主管核可直接執行.md`
- [x] 9.7 補 US「業務主管核可退款 OA」（rewording 沿用 v1.13）→ `US-ORD-027-業務主管核可退款訂單異動.md`
- [x] 9.8 補 US「會計匯出 14 欄對帳 CSV」→ `US-ORD-024-會計匯出14欄對帳CSV.md`
- [x] 9.9 補 US「業務查看溢收（預收未分配）」→ `US-ORD-028-業務查看溢收預收未分配.md`
- [x] 9.10 補 US「會計收到月結差錯訂單警示」→ `US-ORD-029-會計收到月結差錯訂單警示.md`
- [x] 9.11 補 US-AR-F1 等價情境（F1 預開拆票退款全鏈路）→ `US-ORD-030-F1預開發票拆票實作金額調整退款.md`
- [x] 9.12 補 Phase 4 新增情境 US（期次規劃 invariant 警示 + 大額補收紅標組合）→ `US-ORD-031-期次規劃invariant警示與大額補收紅標.md`

## 10. 收尾 + Archive 準備

- [x] 10.1 執行 /opsx:verify 立案前審查（**Miles 指示跳過三視角審查**、純技術 verify）：三維度報告無 CRITICAL；1 條 WARNING（spec REMOVED Requirements 需補「prototype 並存、由 follow-up change 正式 cutover」說明）；82/95 task 全部分類正確；e2e 8 spec 100% 覆蓋 task 6.x；ADDED Requirements 11 個全實作
- [x] 10.2 修正 verify 階段識別的 WARNING：spec § REMOVED Requirements（order-management spec line 344）補「Cutover 狀態說明」段，明示「prototype 階段漸進並存」+ 引用 follow-up change `remove-legacy-payment-plan-planned-invoice-junction` 承接完整型別/mock/UI 移除工作；archive 時讀者可清楚理解 cutover 進度
- [x] 10.3 確認 13 業務情境 + Phase 4 新增情境的 user story 補完：12 個 US-ORD-020~031 已建檔（含 US-ORD-030 F1 情境全鏈路、US-ORD-031 Phase 4 新增警示組合）；test case 補完留 follow-up change（Notion ERP Test Case DB 推送由 erp-test-case skill 後續執行）
- [ ] 10.4 執行 /opsx:archive 歸檔（觸發 doc-audit 跨檔案一致性檢查）
- [ ] 10.5 CLAUDE.md § Spec 規格檔清單 8 行同步更新 archive 摘要
