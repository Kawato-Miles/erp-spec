## ADDED Requirements

### Requirement: BillingInstallment 型別與 Zustand store 整合

Prototype 資料層 SHALL 新增 BillingInstallment TypeScript 型別與對應 Zustand store state / selector / action：

**型別位置**：`src/types/billingInstallment.ts`（新檔）

**完整欄位**（對齊 order-management spec § Data Model）：
```typescript
type InvoicingStatus = '未開立' | '已開立' | '已作廢回未開立';
type PaymentStatus = '未收' | '部分收款' | '已收訖';
type BillingInstallmentSourceType =
  | 'manual'
  | 'consultation_cancellation'
  | 'consultation_end_no_production'
  | 'quote_lost'
  | 'installment_split';

interface BillingInstallment {
  id: string;
  orderId: string;
  installmentNo: number;
  description: string;
  scheduledAmount: number;
  dueDate: string; // ISO date
  expectedInvoiceDate: string | null;
  invoicingStatus: InvoicingStatus;
  paymentStatus: PaymentStatus; // derived
  linkedInvoiceId: string | null;
  items: InvoiceItem[];
  note: string;
  sourceType: BillingInstallmentSourceType;
  splitFromInstallmentId: string | null; // 純追溯
  originalDueDate: string; // 凍結基準（首次儲存當下）
  originalExpectedInvoiceDate: string | null;
  changeCount: number; // derived from ActivityLog
  cancelled: boolean;
  cancelReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Store state**：`useErpStore.billingInstallments: BillingInstallment[]`

**核心 action**：
- `addBillingInstallment(bi)`：新建期次（首次儲存凍結 originalDueDate / originalExpectedInvoiceDate）
- `updateBillingInstallment(id, patch)`：修改期次（變動 dueDate / expectedInvoiceDate 時自動寫入 ActivityLog 對應事件 + changeCount +1）
- `splitBillingInstallment(id, [n1Spec, n2Spec])`：拆期（原期次 cancelled=true、建兩筆新期次平輩、寫入 SPLIT 事件 + 兩筆 BILLING_INSTALLMENT_CREATED 事件）
- `cancelBillingInstallment(id, reason)`：取消期次（cancelled=true、寫入 CANCELLED 事件）

**核心 selector**：
- `getBillingInstallmentsByOrder(orderId)`：取訂單下所有期次（cancelled=false）
- `getActiveBillingInstallmentsByOrder(orderId)`：取訂單下未取消期次
- `deriveBillingInstallmentPaymentStatus(id)`：依未取消已完成 PaymentAllocation 累計推導
- `getBillingInstallmentOverdueDays(id)`：沿用 v1.13 spec L1609 overdue_days 邏輯
- `getOrderReceivableMismatch(orderId)`：檢核 invariant「應收 = Σ scheduled_amount where cancelled=false」、返回差額用於警示 banner

#### Scenario: 業務新建期次首次儲存凍結原始日期基準

- **WHEN** 業務呼叫 `addBillingInstallment({ scheduledAmount: 30000, dueDate: '2026-06-01', expectedInvoiceDate: '2026-05-15', ... })`
- **THEN** Store SHALL 寫入新 BillingInstallment、originalDueDate = '2026-06-01'（凍結）、originalExpectedInvoiceDate = '2026-05-15'（凍結）
- **AND** Store SHALL 寫入 OrderActivityLog BILLING_INSTALLMENT_CREATED 事件

### Requirement: PaymentAllocation 型別與依序填滿 helper

Prototype 資料層 SHALL 新增 PaymentAllocation TypeScript 型別與「依序填滿」核銷分配 helper：

**型別位置**：`src/types/paymentAllocation.ts`（新檔）

```typescript
interface PaymentAllocation {
  id: string;
  paymentId: string;
  billingInstallmentId: string | null; // NULL = 預收（未分配）桶
  allocatedAmount: number;
  autoAllocated: boolean; // 系統依序填滿建立時 true
  manuallyOverridden: boolean; // diff-based 判定
  lockedByPeriodClose: boolean; // 月結閉檔（Phase 1 預設 false）
  createdAt: string;
  updatedAt: string;
}
```

**Store state**：`useErpStore.paymentAllocations: PaymentAllocation[]`

**核心 helper**：
- `allocatePaymentSequentially(orderId, paymentAmount)`：依序填滿核心 helper
  - 取訂單下所有 BillingInstallment WHERE cancelled = false ORDER BY dueDate ASC, installmentNo ASC
  - 依未收金額 = scheduledAmount − sum(已完成 PaymentAllocation.allocatedAmount) 填滿至 paymentAmount 用罄
  - 建立 PaymentAllocation 列表（auto_allocated=true, manually_overridden=false）
  - 溢收部分建立 billing_installment_id=NULL 的「預收」allocation
- `validatePaymentAllocationsSum(allocations, paymentAmount)`：UI 即時校驗 sum 等於 paymentAmount
- `autoFillDifferenceToLast(allocations, paymentAmount)`：「自動回填差額」按鈕邏輯（差額補至最後一期）
- `markManuallyOverriddenByDiff(allocations, originalAllocations)`：diff-based 判定 manually_overridden
- `getPaymentAllocationOverrideRate(month)`：CEO 指標 5 量測

#### Scenario: 依序填滿不足額分配

- **GIVEN** 訂單下兩筆未收期次：BI-A（scheduledAmount=3000, dueDate 早）+ BI-B（scheduledAmount=2000, dueDate 晚）
- **WHEN** 呼叫 `allocatePaymentSequentially(orderId, 4000)`
- **THEN** helper SHALL 返回兩筆 PaymentAllocation：[{ billingInstallmentId: BI-A.id, allocatedAmount: 3000, autoAllocated: true, manuallyOverridden: false }, { billingInstallmentId: BI-B.id, allocatedAmount: 1000, autoAllocated: true, manuallyOverridden: false }]

#### Scenario: 業務手動覆寫 diff-based 判定

- **GIVEN** 系統依序填滿初次值 [{ allocated: 3000 }, { allocated: 1000 }]
- **WHEN** 業務修改為 [{ allocated: 2000 }, { allocated: 2000 }] 並儲存
- **THEN** `markManuallyOverriddenByDiff` SHALL 設定兩筆 manuallyOverridden = true（diff 後值不等於初值）

#### Scenario: 業務改值後又改回原值不算覆寫

- **GIVEN** 系統依序填滿初次值 [{ allocated: 3000 }, { allocated: 1000 }]
- **WHEN** 業務於 PA1 輸入 3000（與初值相同）後儲存
- **THEN** PA1.manuallyOverridden SHALL = false（diff 後值等於初值）

### Requirement: OrderActivityLog 擴充 7 個事件型別

Prototype 資料層 SHALL 擴充 OrderActivityLog 型別 + Zustand store action：

**事件型別 enum**：新增以下值至既有 `OrderActivityLogEventType`：
- BILLING_INSTALLMENT_CREATED
- DUE_DATE_CHANGED
- EXPECTED_DATE_CHANGED
- SPLIT
- CANCELLED
- PAYMENT_ALLOCATION_OVERRIDDEN
- PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE

**每筆事件記錄欄位**（沿用既有 ActivityLog 結構 + payload 子物件）：
```typescript
interface OrderActivityLog {
  // ... 既有欄位
  eventType: OrderActivityLogEventType;
  payload: {
    billingInstallmentId?: string;
    paymentAllocationId?: string;
    paymentId?: string;
    oldValue?: string | number | null;
    newValue?: string | number | null;
    splitSpec?: { newInstallmentIds: string[]; spec: string };
    cancelReason?: string;
    [key: string]: unknown;
  };
}
```

**核心 action**：
- `logBillingInstallmentEvent(eventType, billingInstallmentId, payload)`：寫入對應事件
- `getChangeCountByInstallment(installmentId)`：query DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED 兩事件型別計數
- `getOrderPaymentChangeRate(orderId)`：query 訂單下所有相關事件 / 訂單下 Payment 總數（Miles 指標 ⑩）

#### Scenario: 寫入拆期事件

- **GIVEN** 業務拆 BI-001 為 BI-001-A + BI-001-B
- **WHEN** `splitBillingInstallment` action 執行
- **THEN** Store SHALL 寫入 OrderActivityLog SPLIT 事件（payload: { billingInstallmentId: BI-001.id, splitSpec: { newInstallmentIds: [BI-001-A.id, BI-001-B.id], spec: '2500/75500' } }）
- **AND** Store SHALL 寫入兩筆 BILLING_INSTALLMENT_CREATED 事件（各新期次一筆）

