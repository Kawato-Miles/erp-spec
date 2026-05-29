## ADDED Requirements

### Requirement: cancelConsultation 諮詢取消收斂到一般訂單取消

`useErpStore.cancelConsultation` action SHALL 將諮詢取消的諮詢訂單收斂為一般訂單取消形態：

- 諮詢訂單 `status` 設為「**已取消**」（取代既有「訂單完成」）、`paymentStatus` 維持「已付款」
- 自動建退款 `OrderAdjustment`：`status='已核可'`、`approvedBy='system'`、`approvedAmount=-1000`、`executedAt=null`、`requiresSupervisorApproval=false`（取代既有 `status='已執行'`）
- **MUST NOT 自動建立 BillingInstallment**（移除既有 `newCancellationBI` + `cancellationBiEvent` 寫入）；`source_type='consultation_cancellation'` enum 值保留供業務手動建期次標示來源
- 退款 Payment（-1000, 處理中）+ 收款 Payment（+2000, 已完成）+ OrderExtraCharge（+2000）維持既有
- 寫 OrderActivityLog 留痕（OA 系統建立 + 後續業務調整金額事件）

**實作邊界（MUST 遵守）**：status / OA 改寫 SHALL 限定在 `cancelConsultation` 內的 `orderWithPayments` 組裝層，**MUST NOT 修改共用 `buildConsultationOrder` helper 本體**（諮詢結束不做大貨 / 需求單流失兩情境共用此 helper，須維持「訂單完成」終態 + 自動建 BillingInstallment 不受波及）。

#### Scenario: cancelConsultation 建已取消訂單 + 已核可 OA + 無自動建 BillingInstallment

- **WHEN** 呼叫 `cancelConsultation(crId, reason)`
- **THEN** 建立的諮詢訂單 `status='已取消'`、`paymentStatus='已付款'`
- **AND** 自動建退款 OA `status='已核可'`、`approvedBy='system'`、`executedAt=null`
- **AND** MUST NOT 寫入任何 BillingInstallment（無 source_type=consultation_cancellation 的待開期次）
- **AND** 收款 Payment(+2000, 已完成) + 退款 Payment(-1000, 處理中) 正常寫入

#### Scenario: buildConsultationOrder helper 不受波及（另兩情境回歸保護）

- **GIVEN** 諮詢結束不做大貨 / 需求單流失情境呼叫共用 `buildConsultationOrder` helper
- **WHEN** 系統建立諮詢訂單收尾
- **THEN** 該兩情境諮詢訂單 SHALL 維持 `status='訂單完成'` 終態
- **AND** 該兩情境 SHALL 維持自動建 BillingInstallment（source_type=consultation_end_no_production / quote_lost）不變

### Requirement: reconciliationCsv 差錯偵測涵蓋已取消有發票訂單

`reconciliationCsv.ts` 的 `calcReconciliationDiscrepancies` SHALL 將訂單篩選從 `orders.filter(o => o.status === '訂單完成')` 改為涵蓋 `status ∈ {訂單完成, 已取消} 且該訂單有 status=開立 Invoice` 的訂單；`calcDiscrepancyRate` 分母同步調整。CSV 匯出層 `buildReconciliationRows` 維持既有（已以已開立發票為主軸，不需改）。

#### Scenario: 差錯偵測納入已取消有發票訂單

- **GIVEN** 已取消諮詢訂單有 status=開立 的諮詢費 Invoice
- **WHEN** 呼叫 `calcReconciliationDiscrepancies`
- **THEN** 該已取消訂單 SHALL 被納入差錯偵測訂單集合（不因 status=已取消 被排除）

#### Scenario: CSV 匯出層不變

- **WHEN** 呼叫 `buildReconciliationRows` 匯出對帳 CSV
- **THEN** 匯出邏輯維持既有（以 status=開立 且非作廢 Invoice 為列，不依 order.status 篩選）
- **AND** 涵蓋率本就 100%（已取消訂單的已開立發票本就在匯出範圍內）
