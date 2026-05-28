## Why

承接 [`unify-billing-installment-and-reconciliation-csv` change](../archive/2026-05-28-unify-billing-installment-and-reconciliation-csv/) 的 D-final-B 結構性 cutover dead code 清理工作。前 change 採「漸進並存」策略完成新模型導入（BillingInstallment / PaymentAllocation / 14 欄 CSV / e2e 全套），但 PaymentPlan / PlannedInvoice / PaymentInvoice junction 三個舊型別 + 對應 mock 檔 + UI 區塊仍以 dead code 形態存在於 prototype（無實質讀寫點、純兼容兼容歷史 mock）。本 change 完成正式移除 + spec sync 對齊。

完整 cutover 範圍與 grep 編譯破壞點記錄於 [前 change 的 cutover-followup.md](../archive/2026-05-28-unify-billing-installment-and-reconciliation-csv/cutover-followup.md)。

商業背景與業務邏輯依據：
- [前 change archive](../archive/2026-05-28-unify-billing-installment-and-reconciliation-csv/) — 完整 cutover 範圍 / Migration grep 點 / archive 摘要預備文字
- [Vault 業務邏輯卡](../../../memory/erp/ERP_Vault/04-business-logic/)
- [Vault 實體卡](../../../memory/erp/ERP_Vault/05-entities/)

## What Changes

### Layer 1 PaymentInvoice junction 完整移除
- **BREAKING**：`src/types/invoice.ts` 移除 PaymentInvoice interface + calcInvoicePaidAmount / calcPaymentInvoicedAmount / getPaymentInvoicesByInvoice / getPaymentInvoicesByOrder 4 helpers
- **BREAKING**：`src/data/mockInvoices.ts` 移除 SCENARIO_PAYMENT_INVOICES + MOCK_PAYMENT_INVOICES export + getMockPaymentInvoicesByOrder helper
- 清 `src/utils/reconciliationCsv.ts` legacyPaymentInvoices fallback path + buildReconciliationRows 移除 legacyPaymentInvoices 參數
- 清 `src/data/buildBillingInstallmentsFromLegacy.ts` paymentInvoices 參數

### Layer 2 PlannedInvoice 完整移除
- **BREAKING**：移除 `src/types/plannedInvoice.ts` 全檔（PlannedInvoice interface + helpers）
- **BREAKING**：移除 `src/data/mockPlannedInvoices.ts` MOCK_PLANNED_INVOICES export
- **BREAKING**：移除 `src/components/order/OrderInvoiceSection.tsx` 內 plannedInvoices state（line 154-185）+ PlannedInvoice CRUD UI 區塊（line 480-621）+ sourcePlannedInvoiceId 欄位（line 240）
- 改 `src/pages/finance/PendingInvoices.tsx` 從 PlannedInvoice 改 BillingInstallment.invoicingStatus = '未開立' 推導
- 清 useErpStore 內 plannedInvoices state + addPlannedInvoice action

### Layer 3 PaymentPlan 完整移除
- **BREAKING**：`src/types/payment.ts` 移除 PaymentPlan interface + derivePlanStatus / calcPlanCollectedAmount / calcOverdueDays / getMaxOverdueDays / calcPlansTotalAmount 5 helpers
- **BREAKING**：`src/data/mockPaymentPlans.ts` 移除 MOCK_PAYMENT_PLANS export（保留 MOCK_PAYMENTS）
- **BREAKING**：`src/components/order/OrderPaymentSection.tsx` 移除「預計付款」整個區塊（line 735+）+ plans state（line 181）+ CRUD action（line 211-340）
- 改 `src/pages/finance/Receivables.tsx` 從 MOCK_PAYMENT_PLANS 改 store.billingInstallments

### Spec sync 對齊
- 修正前 change 8 個 delta spec 內 MODIFIED Requirements 標籤錯誤（前 change archive 時 sync fail，標 MODIFIED 但 main spec 無對應 Requirement、應改 ADDED）
- 跑 `/opsx:sync remove-legacy-payment-plan-planned-invoice-junction`（或手動 merge）把前 change 的 delta + 本 change 的 delta 對齊到 main spec
- archive 時觸發 doc-audit 跨檔案一致性檢查

### 配套 spec 文字更新
- 移除前 change spec § REMOVED Requirements 「Cutover 狀態說明」段（本 change cutover 完成後該段不再適用）
- CLAUDE.md § Spec 規格檔清單 8 行同步更新 v1.14 完整版摘要（去掉「軟 cutover」措辭、改「完整 cutover 完成」）

## Capabilities

### Modified Capabilities
- `order-management`：完整移除 PaymentPlan / PlannedInvoice / PaymentInvoice junction 三型別於 spec 與 code 層；REMOVED Requirements 標籤糾正
- `prototype-data-store`：完整移除三型別於型別 / mock / store action
- `prototype-shared-ui`：完整移除 PlannedInvoiceListCard / PaymentPlan UI 區塊
- `state-machines` / `user-roles` / `business-processes` / `consultation-request` / `after-sales-ticket`：對齊前 change delta（修正 ADDED vs MODIFIED 標籤）

### New Capabilities
無新 capability。

## Impact

### 編譯破壞點（grep 待修引用清單）
依前 change cutover-followup.md grep 統計：
- PaymentPlan：17 個 src 檔仍 import（含 OrderPaymentSection / Receivables / 其他 finance 頁）
- PlannedInvoice：15 個 src 檔仍 import（含 OrderInvoiceSection 主體）
- PaymentInvoice：10 個 src 檔仍 import（前 change 已軟 cutover 至 UI 不用、type 仍 export）

每個檔案需 grep + 改 import + 移除 dead code 引用。

### 既有 e2e spec 影響
- 前 change 8 個新 e2e spec 應全部仍通過（新模型路徑不變、純 dead code 移除）
- 跑 `npx playwright test e2e/billing-installment-*.spec.ts e2e/payment-allocation-*.spec.ts e2e/oa-supervisor-*.spec.ts e2e/consultation-cancel-*.spec.ts e2e/reconciliation-csv-*.spec.ts` 驗證

### 影響的角色
- 業務：「預計付款」舊區塊（deprecated banner）移除，純使用 BillingInstallment 區塊
- 開發：dead code 清理、後續維護成本下降；spec 標籤修正讓 archive sync 可正常執行

## 預估工作量
- Layer 1 / 2 / 3 各 2-3 session（grep + 移除 + 修引用）
- spec 修正 + sync：1 session
- archive + CLAUDE.md：1 session
- 合計 7-10 session
