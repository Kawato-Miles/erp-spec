## MODIFIED Requirements

### Requirement: OrderActivityLog 擴充 6 個事件型別

Prototype 資料層 SHALL 擴充 OrderActivityLog 型別 + Zustand store action：

**事件型別 enum**：新增以下值至既有 `OrderActivityLogEventType`：
- BILLING_INSTALLMENT_CREATED
- DUE_DATE_CHANGED
- EXPECTED_DATE_CHANGED
- SPLIT
- CANCELLED
- PAYMENT_ALLOCATION_SET（業務手動建立 / 修改入帳明細）
- **PRE_COMPLETION_AMOUNT_DECREASE（路 C 新增：訂單完成前明細金額調降留痕——印件 price_per_unit / pi_ordered_qty 調降或 OrderExtraCharge.amount 調降 / 刪除致應收減少時寫入；弱把關、不阻擋、供主管事後查見）**

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
    // 路 C PRE_COMPLETION_AMOUNT_DECREASE 用：
    printItemId?: string;        // 調降對象印件（OEC 調降時為 orderExtraChargeId）
    decreaseFrom?: number;       // 調降前金額
    decreaseTo?: number;         // 調降後金額
    [key: string]: unknown;
  };
}
```

**核心 action**：
- `logBillingInstallmentEvent(eventType, billingInstallmentId, payload)`：寫入對應事件
- `logPreCompletionAmountDecrease(orderId, payload)`：路 C——明細金額調降時寫入 PRE_COMPLETION_AMOUNT_DECREASE 事件
- `getChangeCountByInstallment(installmentId)`：query DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED 兩事件型別計數
- `getOrderPaymentChangeRate(orderId)`：query 訂單下所有期次與入帳相關修改事件次數（業務層級彙總）

#### Scenario: 寫入拆期事件

- **GIVEN** 業務拆 BI-001 為 BI-001-A + BI-001-B
- **WHEN** `splitBillingInstallment` action 執行
- **THEN** Store SHALL 寫入 OrderActivityLog SPLIT 事件 + 兩筆 BILLING_INSTALLMENT_CREATED 事件

#### Scenario: 完成前明細調降寫入留痕事件（路 C）

- **GIVEN** 訂單 SO-001 未進入終態、某印件 price_per_unit = 100
- **WHEN** 業務於 Side Panel 改 price_per_unit = 90（調降）並儲存
- **THEN** Store SHALL 寫入 OrderActivityLog PRE_COMPLETION_AMOUNT_DECREASE 事件（payload: { printItemId, decreaseFrom: 100, decreaseTo: 90, 操作者, 時間 }）
- **AND** 印件費與訂單應收 SHALL 即時重算減少
- **AND** Store MUST NOT 阻擋或要求業務主管核可

## ADDED Requirements

### Requirement: 路 C 退款核銷應退差額 store 規格

Prototype 資料層 SHALL 提供「退款核銷對帳應退差額」的 selector 與 store action，退款完成判定與 OrderAdjustment 累計**解耦**（路 C）：

**核心 selector**：
- `getOrderReceivable(orderId)`：應收總額 = ∑印件費 + ∑OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)
- `getOrderPaymentNet(orderId)`：收款淨額 = ∑(已完成 Payment.amount，含退款負數，linked_entity = 當前訂單)
- `getOrderRefundableGap(orderId)`：應退差額 = max(收款淨額 − 應收, 0)（> 0 即「退款待執行」；本 change 一律當該退，溢收 / 預收細分另議，見 BI-3）
- `getOrderGapOwner(orderId)`：缺口第一責任人 = `order.sales_id`（訂單負責業務；監督人 = 該業務之主管，由角色關係推導，不新增欄位）

**store action**：
- 退款 Payment 建立（amount < 0, paymentMethod = 退款, `linkedOrderAdjustmentId` 選填）→ 上傳匯款證明 → 切 paymentStatus = '已完成'：核銷應退差額；**MUST NOT 建 PaymentAllocation**（不進正向期次）；**MUST NOT 觸發 OrderAdjustment 狀態推進 / 回退**（OA 已執行於核可時已生效）。
- 退款完成判定 = 退款 Payment 自身 paymentStatus = '已完成'（物理錨點，掛匯款證明）；對帳 `getOrderRefundableGap` 歸零是結果呈現。
- 多筆退款 Payment 各自獨立切「已完成」、各自挂匯款證明附件；帳平判定看 `getOrderRefundableGap = 0`，不逐筆勾稽 OA。

#### Scenario: 退款 Payment 核銷應退差額不綁 OA

- **GIVEN** 訂單應退差額 = 10000（退款 OA-070 已執行致應收 −10000、尚未退款）
- **WHEN** 業務建退款 Payment P-070（amount = -10000, linkedOrderAdjustmentId = OA-070.id）、上傳匯款證明、切已完成
- **THEN** `getOrderPaymentNet` SHALL 減 10000、`getOrderRefundableGap` SHALL = 0
- **AND** P-070 MUST NOT 建 PaymentAllocation
- **AND** 系統 MUST NOT 因 P-070 切已完成而推進 / 回退 OA-070（OA-070 已於主管核可時推進已執行）

#### Scenario: 完成前減量退款不綁 OA（linkedOA 選填為 null）

- **GIVEN** 訂單完成前明細減量致應收 −30000、已收 > 應收、應退差額 = 30000
- **WHEN** 業務建退款 Payment（amount = -30000, linkedOrderAdjustmentId = null）、上傳匯款證明、切已完成
- **THEN** `getOrderRefundableGap` SHALL = 0（退款完成）
- **AND** 此退款無關聯 OA（完成前減量走明細直接改、未建 OA），linkedOrderAdjustmentId 留 null

### Requirement: reconciliationCsv 差錯偵測涵蓋終態集合（路 C 確認沿用）

`reconciliationCsv.ts` 的 `calcReconciliationDiscrepancies` 既有設計已涵蓋 `status ∈ {訂單完成, 已取消}` 的訂單篩選，與路 C「明細鎖定點 = 訂單完成終態集合」一致（雙終態），**本 change 不需改動此偵測範圍**。路 C 僅補充：對帳差額分解 SHALL 區分「待開票 / 待收 / 應退差額 / 待折讓」四向（見 [order-management § 三方對帳檢視面板](../order-management/spec.md)），差錯偵測 selector 沿用既有終態集合。

#### Scenario: 差錯偵測沿用終態集合不變

- **GIVEN** 路 C 上線後對帳差錯偵測
- **WHEN** `calcReconciliationDiscrepancies` 執行
- **THEN** 訂單篩選 SHALL 維持 `status ∈ {訂單完成, 已取消}`（與路 C 鎖定終態集合一致、不需改）
- **AND** 差額分解 SHALL 依四向（待開票 / 待收 / 應退差額 / 待折讓）標示
