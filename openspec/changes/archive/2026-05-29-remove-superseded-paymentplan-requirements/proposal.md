## Why

四來源一致性比對（[[../../../memory/erp/ERP_Vault/12-insights/2026-05-29-款項發票四來源一致性比對]]）發現：`unify-billing-installment-and-reconciliation-csv`（v1.14）以「ADDED 新模型 + 文字宣告廢止舊」方式合進 main spec，但舊 PaymentPlan 相關 Requirement 本體從未刪除；follow-up `remove-legacy-payment-plan-planned-invoice-junction`（2026-05-29 歸檔）用 `--skip-specs`（無 specs delta）只清 prototype dead code、未清 spec。導致 order-management / state-machines / business-processes 三份主規格**新舊模型並存、內部互斥**。

本 change 為**收斂 Step 1**：移除「已被新模型完整取代、移除不留行為缺口」的舊 PaymentPlan 相關 Requirement。PlannedInvoice / 諮詢收尾 / Data Model / 入帳機制（涉及 ADD/MODIFY 設計實質、需對齊 as-built prototype）留 **Step 2** 另開 change 處理。

商業背景：[[../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯]]、新模型權威 Requirement 已在 order-management spec（請款期次 BillingInstallment 統一實體 / 收款核銷分配 PaymentAllocation 等）。

## What Changes

### order-management（REMOVED 3）
- **付款計畫建立（PaymentPlan）** — 已由「請款期次（BillingInstallment）統一實體」完整取代
- **付款計畫建立（PaymentPlan）— 廢止改為 BillingInstallment** — transition tombstone，舊本體移除後不再需要（migration 歷史保留於 archived change）
- **收款記錄（Payment）**（舊、規範可選 paymentPlanId）— 已由「收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導」取代

### state-machines（REMOVED 1）
- **PaymentPlan 變更觸發訂單回業務主管審核** — 已由「廢止『付款計畫變更觸發訂單回業務主管審核』」+「BillingInstallment 取代 PaymentPlan 狀態機」取代（新規則：期次變更 SHALL NOT 觸發回審）

### business-processes（REMOVED 1）
- **付款計畫建立與變更流程** — 已由「請款與核銷流程（合併規劃層雙實體 + 自動分配）」取代

### 保留（新模型權威，本 change 不動）
請款期次（BillingInstallment）統一實體 / 期次雙維度狀態 / 收款核銷分配（PaymentAllocation）/ 收款記錄（Payment）— 移除 paymentPlanId / BillingInstallment 取代 PaymentPlan 狀態機 / 廢止「付款計畫變更觸發回審」/ 請款與核銷流程。

## Capabilities

### Modified Capabilities
- `order-management`：移除 3 個舊 PaymentPlan / Payment Requirement
- `state-machines`：移除 1 個舊 PaymentPlan 回審狀態機 Requirement
- `business-processes`：移除 1 個舊 PaymentPlan 流程 Requirement

### New Capabilities
無。

## Impact

- 規格層：移除 5 個已被取代的舊 Requirement，消除三份主 spec 內部新舊並存矛盾（PaymentPlan 軸）。
- 程式層：無（prototype 已於 `remove-legacy-payment-plan-planned-invoice-junction` cutover 移除 PaymentPlan 型別）。
- **未涵蓋（Step 2 另開 change）**：
  - PlannedInvoice Requirement（諮詢收尾自動建 / 品項鏈式預填 / 發票時間點）→ 改 BillingInstallment + source_type
  - Data Model：移除 PlannedInvoice 表 + ADD BillingInstallment / PaymentAllocation Data Model section
  - 入帳機制：spec 現為「依序填滿自動分配」，as-built prototype 為「業務手動勾選」（Miles 拍板手動）→ MODIFY 對齊
  - 發票開票維度 enum：spec `已作廢回未開立` → as-built `已作廢` → MODIFY 對齊
  - 新 store actions（addPaymentWithAllocations / updatePaymentWithAllocations / cancelPaymentWithAllocations）+ BillingInstallment.paymentMethod 欄位 + BillingInstallmentAllocationTable 元件（prototype-data-store / prototype-shared-ui）
