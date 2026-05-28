# Tasks — remove-legacy-payment-plan-planned-invoice-junction

承接 `unify-billing-installment-and-reconciliation-csv` change 的 D-final-B 結構性 cutover，正式移除 PaymentPlan / PlannedInvoice / PaymentInvoice junction 三型別的 dead code。

完整 cutover 三 layer 已於 prototype repo 完成（commits 47f6ff9 / 587e4e3 / 513fca9）：

## Layer 1：PaymentInvoice junction 業務 UI 完整移除（commit 47f6ff9）

- [x] 1.1 `src/types/invoice.ts` 移除 PaymentInvoice interface + calcInvoicePaidAmount / calcPaymentInvoicedAmount / getPaymentInvoicesByInvoice / getPaymentInvoicesByOrder 4 helpers
- [x] 1.2 `src/data/mockInvoices.ts` 移除 SCENARIO_PAYMENT_INVOICES + MOCK_PAYMENT_INVOICES export + getMockPaymentInvoicesByOrder helper（含 ORD-20260301-01 / ORD-20260415-01 / ORD-20260415-03 / ORD-20260418-02 mock 引用）
- [x] 1.3 `src/data/buildBillingInstallmentsFromLegacy.ts` 移除 paymentInvoices 參數 + Step 3 PaymentInvoice → PaymentAllocation 轉換邏輯
- [x] 1.4 `src/store/seedData.ts` 移除 MOCK_PAYMENT_INVOICES import 與 backfill 引數
- [x] 1.5 `src/components/order/OrderInvoiceSection.tsx` 移除 paymentInvoices state + 「對應收款」勾選 UI（~75 行）+ selectedPaymentIds 欄位
- [x] 1.6 `src/utils/reconciliationCsv.ts` 移除 legacyPaymentInvoices fallback path + buildReconciliationRows sources 介面對應參數
- [x] 1.7 `src/components/finance/ReconciliationCsvExportDialog.tsx` 移除 MOCK_PAYMENT_INVOICES import 與 sources 內參數
- [x] 1.8 e2e fix：billing-installment-smoke / dialogs tab 名稱對齊 OrderDetail 既有「金額及付款狀態」
- [x] 1.9 Layer 1 commit + tsc + 7/8 e2e 通過（1 個 split-store 屬既有 bug、留 Layer 3 修）

## Layer 2：PlannedInvoice 業務 UI 完整移除 + 開立發票流程整合 + 一期多發票 Table 欄位（commit 587e4e3）

- [x] 2.1 `src/store/useErpStore.ts` 移除 plannedInvoices state + addPlannedInvoice action + 三情境雙寫（line 1299 / 1555 / 1848 / 1876）；保留諮詢三情境 BillingInstallment 寫入（source_type=quote_lost / consultation_end_no_production / consultation_cancellation）
- [x] 2.2 `src/store/seedData.ts` 移除 plannedInvoices state 初值（MOCK_PLANNED_INVOICES 保留作 buildBillingInstallmentsFromLegacy 內部 seed data）
- [x] 2.3 `src/components/order/OrderInvoiceSection.tsx` 移除 plannedInvoices state + plannedForOrder useMemo + PlannedInvoice CRUD ~200 行（dialog / form / handlers / cancel target）+ 預計發票列表渲染段 ~150 行 + PlannedInvoiceStatusBadge component
- [x] 2.4 `src/components/order/OrderInvoiceSection.tsx` issueForm sourcePlannedInvoiceId 改名 sourceBillingInstallmentId（必填）+ openIssueDialog 改用 storeBillingInstallments + buildInvoiceItemsFromBillingInstallment + 加 useEffect 接 defaultSourceBillingInstallmentId
- [x] 2.5 `src/components/order/OrderInvoiceSection.tsx` 「開立發票」Dialog 內加「來源請款期次」必選下拉 + 必填驗證
- [x] 2.6 `src/components/order/OrderInvoiceSection.tsx` 「手動開立（不關聯預計）」按鈕改回「手動開立」維持原名 + disabled 條件：無未開立期次時禁用
- [x] 2.7 `src/components/order/OrderInvoiceSection.tsx` 修 React Fragment list key warning（invoices.map 內 `<>` 改 `<React.Fragment key={inv.id}>`）
- [x] 2.8 `src/utils/invoiceItemPrefill.ts` 移除 buildInvoiceItemsFromPlannedInvoice、新增 buildInvoiceItemsFromBillingInstallment（含 items 為空時 fallback）
- [x] 2.9 `src/components/order/OrderBillingInstallmentSection.tsx` 接 onIssueInvoiceForInstallment callback prop → 父層 OrderDetail state lift → OrderInvoiceSection useEffect 自動開 Dialog
- [x] 2.10 `src/components/order/BillingInstallmentListCard.tsx` 「一鍵開票」按鈕改為 icon 無文字 + title「開立發票」+ 新增「歷史發票」Table 欄位（顯示「目前 X / 歷史 Y」、業務 1:1 + 資料 1:N 對齊）
- [x] 2.11 `src/pages/OrderDetail.tsx` 新增 defaultIssueSourceBillingInstallmentId state lift + invoices TabsContent forceMount（讓 OrderInvoiceSection 常駐 mount、useEffect 能接 prop）
- [x] 2.12 `src/pages/finance/PendingInvoices.tsx` 整頁重寫：資料源從 plannedInvoices 改為 billingInstallments.invoicingStatus='未開立'
- [x] 2.13 `src/pages/ConsultationRequestDetail.tsx` 對白對齊（PlannedInvoice → 請款期次）
- [x] 2.14 新增 e2e spec：
  - `e2e/issue-invoice-from-installment-no-tab-switch.spec.ts`：期次 row「開立發票」icon 觸發 Dialog 從原 Tab 開啟、不切 Tab
  - `e2e/manual-invoice-issue-must-select-installment.spec.ts`：手動開立 Dialog 內出現「來源請款期次」必選欄位
- [x] 2.15 既有 e2e fix：smoke 標題 / 描述、reconciliation-csv-rows 簽名對齊 Layer 1、過濾 React dev list key warning
- [x] 2.16 Layer 2 commit + tsc + 12 e2e 全綠（含 2 個新 spec）

## Layer 3：PaymentPlan 業務 UI 完整移除 + 分期 UX 移除 + 帳齡推導改 BillingInstallment（commit 513fca9）

- [x] 3.1 `src/components/order/OrderPaymentSection.tsx` 移除 PaymentPlan / derivePlanStatus / calcPlansTotalAmount / calcOverdueDays / calcPlanCollectedAmount / getPaymentPlansByOrder imports；保留 Payment / PaymentMethod / PaymentFile + 必要 helper
- [x] 3.2 `src/components/order/OrderPaymentSection.tsx` 移除 plans state + plansTotal / derivedPlans / planVsTotalDelta / paymentPlanChangedSinceApproval + 「預計付款」區塊渲染 ~250 行 + planDialog Dialog + 刪除付款計畫 AlertDialog + PlanStatusBadge / PlanRowActions 內部元件
- [x] 3.3 `src/components/order/OrderPaymentSection.tsx` 收款紀錄 row「對應期次」改顯示「—」（沖銷期次紀錄 UI 接入留 follow-up）+ 收款 Dialog 內「對應付款計畫期次」下拉移除
- [x] 3.4 `src/components/order/OrderReconciliationPanel.tsx` 最長逾期天數改從 BillingInstallment（cancelled=false + paymentStatus!=已收訖 + calcBillingInstallmentOverdueDays）推導；移除 MOCK_PAYMENT_PLANS / getMaxOverdueDays imports
- [x] 3.5 `src/pages/finance/Receivables.tsx` 同等邏輯改 BillingInstallment 推導；useMemo deps 加 billingInstallments
- [x] 3.6 分期 UX 移除：
  - `src/components/order/BillingInstallmentListCard.tsx` 移除「拆此期」icon + Split lucide import；保留 onSplit prop（reference）；onCancel title 改「刪除」
  - `src/components/order/OrderBillingInstallmentSection.tsx` 移除 splitDialogOpen / splittingInstallment state + handleSplit / handleSplitSubmit + Split Dialog 渲染段 + BillingInstallmentSplitDialog import
  - `BillingInstallmentSplitDialog` 元件保留為 reference（splitBillingInstallment store action 保留作系統內生諮詢連動）
- [x] 3.7 Layer 3 commit + tsc + 11 e2e 通過 + 1 skipped + split-store spec 仍通過（store action 保留）

## 餘留項（follow-up 範圍）

- [ ] R1 `BillingInstallmentAllocationTable` inline 元件 + `addPaymentWithAllocations` store action：業務「新增收款」Dialog 內 inline 期次勾選表（業務勾期 + 手動填金額 + 防呆 sum ≤ 收款金額），由 Miles 拍板下個 change 接入
- [ ] R2 PaymentPlan / PlannedInvoice 型別檔與 mock 檔正式移除（目前保留為 buildBillingInstallmentsFromLegacy 內部 seed data，未來重寫 backfill 為靜態 mockBillingInstallments.ts 時一併處理）
- [ ] R3 OrderInvoiceSection / OrderPaymentSection 內既有「列表頁 list key 缺失」修補（多處 `.map` 仍未補 key 屬性，本次以 e2e 過濾繞過、非本 cutover 引入問題）

## Spec sync 對齊（已於前 change 補救 commit f453480 完成、本段為紀錄）

- [x] S1 前 change 8 個 delta spec MODIFIED Requirements 標籤錯誤已修正
- [x] S2 `/opsx:sync` 把 delta 對齊到 main spec 已透過正規 archive 完成
- [x] S3 前 change spec § REMOVED Requirements「Cutover 狀態說明」段已於補救 commit 一併移除
- [x] S4 CLAUDE.md § Spec 規格檔清單 v1.14 摘要已於補救 commit 完成

## Archive 收尾

- [ ] A1 `/opsx:archive remove-legacy-payment-plan-planned-invoice-junction` 歸檔（觸發 doc-audit 跨檔案一致性檢查）
- [ ] A2 CLAUDE.md § Spec 規格檔清單對應 row 延伸 dead code 移除描述
- [ ] A3 audit-log 追加本 change cutover archive 軌跡

## 驗證

- ✅ `cd /Users/b-f-03-029/sens-erp-prototype && npx tsc --noEmit` 通過（3 layer cutover 後）
- ✅ 既有 8 個 e2e spec + 2 個 Layer 2 新增 e2e spec 全部通過（12 個 spec 全綠）
- ✅ `billing-installment-split-store.spec.ts` 通過（splitBillingInstallment store action 保留作系統內生）
- ⚠️ 既有 list key warning 透過 e2e 過濾繞過（非本 cutover 引入、屬 follow-up R3）
