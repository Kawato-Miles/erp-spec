## Context

`add-consultation-request-and-revise-approval-gate`（2026-05-07 歸檔）的 spec 把諮詢費的金流跨實體串聯說清楚：Payment 一開始綁 ConsultationRequest，諮詢結束後依路徑轉移到對應的訂單，搭配 OrderExtraCharge(consultation_fee) 與 Invoice / SalesAllowance（適用時）達成完整對帳。

實際 prototype 落地時三條建諮詢訂單的路徑都做了 Phase 1 簡化（store 內註解明示「先把流程跑通，後續迭代補」），導致諮詢費的金流足跡只走到「建訂單 + 加 ExtraCharge」就停下，Payment 還掛在諮詢單上、退費路徑甚至沒建訂單、需求單轉訂單路徑沒帶諮詢費進主訂單。對帳檢視全失準。

本 change 把 Payment 跨實體轉移與「取消退費也走諮詢訂單收尾」這兩個 Phase 1 缺口補齊。Invoice 自動開立與 SalesAllowance 維持留在 Phase 2，原因見 Non-Goals。

設計參照：
- [consultation-request spec](../../specs/consultation-request/spec.md)：諮詢單實體與三條收尾路徑
- [order-management spec](../../specs/order-management/spec.md) § Payment 跨實體轉移、§ 訂單其他費用明細、§ 業務主管核准訂單
- [business-processes spec](../../specs/business-processes/spec.md) § 諮詢前置流程端到端規則：含對帳邏輯表

## Goals / Non-Goals

**Goals**：
- 三條建諮詢訂單路徑都把 cr.payments[] 整批轉移到新建訂單（含取消退費路徑首次補齊）
- 諮詢來源需求單成交轉訂單時，主訂單建 OrderExtraCharge(consultation_fee) + Payment 轉移到主訂單
- 諮詢單詳情頁仍可追溯「付款已轉至訂單 [order-no]」（透過 `transferredToOrderId` 標記）
- 訂單詳情頁打開可看到諮詢費的收款紀錄、應收 / 已收 / 待繳對得上

**Non-Goals**：
- 不做 Invoice 自動開立。prototype 目前 Invoice/SalesAllowance 用 React local state，沒接 Zustand store；要從 store action 自動開 Invoice 得先把 Invoice / SalesAllowance 提升到 store layer，工作量等同另一個 change。spec 的「issue_now 路徑自動開 Invoice」「取消退費 issue_now 自動 SalesAllowance」暫由 UI 手動操作補。
- 不重構既有 prototype 對 Payment / Invoice 的本地 state 設計
- 不改變 spec（spec 方向不變，本 change 為 prototype 落地）

## Decisions

### D1：Payment 轉移採非破壞性 — 保留 cr.payments，加 `transferredToOrderId` 標記

`ConsultationRequestPayment` 介面新增可選欄位 `transferredToOrderId?: string`。轉移時：

1. 在新訂單的 `order.payments` 內 push 同一筆 Payment（複製內容、可保留同 id 或重生）
2. 在 cr.payments 對應筆寫入 `transferredToOrderId = newOrderId`
3. 不從 cr.payments 移除

**理由**：
- 諮詢單詳情頁 Payment 區塊仍能看到「已轉至訂單 [order-no]（可點擊跳轉）」的稽核足跡，符合「諮詢付款的紀錄不該突然消失」的業務直覺
- 訂單詳情頁的「應收 / 已收」計算只看 `order.payments`，與 cr.payments 無 double-count 風險
- 重複觸發轉移時可用 `transferredToOrderId` 非空判斷已轉移、拒絕重做

**替代方案否決**：
- (A) 從 cr.payments 移除：諮詢單詳情頁付款區突然空白，對業務排查反而困擾
- (B) 用獨立 transfer log 表：過度設計，prototype 階段 inline 標記已足夠

### D2：訂單金額計算 — totalAmount 反映「應收總額」、productAmount 反映「印件金額」

- 諮詢訂單：印件 0、ExtraCharge `consultationFee` → `totalAmount = consultationFee`、`productAmount = 0`、`paymentStatus = '已付款'`（Payment 轉移後即覆蓋）
- 諮詢取消退費：諮詢訂單 `totalAmount = consultationFee`、Payment（正 + 負）淨額 0 → `paymentStatus = '已退款'`
- 諮詢來源一般訂單：印件總 `productAmount`、ExtraCharge `consultationFee` → `totalAmount = productAmount + consultationFee`

`totalAmount` 與 `productAmount` 雙寫的設計與既有 prototype 一般訂單一致（productAmount 已存在，不新增欄位）。

### D3：諮詢訂單 status 寫法 — 跳到「訂單完成」搭配 staffNotes 標 Invoice 待開

Spec 寫的諮詢訂單路徑是「建立 → 已開發票 → 訂單完成」。但 prototype 沒有 Invoice store action，無法在建訂單時自動觸發「已開發票」狀態轉換；若硬寫 `status: '已開發票'` 訂單會卡在那個狀態出不去。

折衷：
- 諮詢訂單建立後直接 `status: '訂單完成'`、`paymentStatus: '已付款'`（或退款情境 `'已退款'`）
- 在 `staffNotes` 寫入「諮詢費發票尚未開立（依 invoice_option = [issue_now / defer_to_main_order]）」
- ActivityLog 寫入「Phase 1 Prototype：Invoice 自動開立待 Phase 2 補」
- Phase 2 補 Invoice store action 時，把諮詢訂單 status flow 改為嚴格走「已開發票 → 訂單完成」並在 Phase 2 change 內處理資料遷移

### D4：取消退費的諮詢訂單建立 — 與「不做大貨」收尾路徑共用 helper

抽 `buildConsultationOrder(cr, reason)` helper，三條建諮詢訂單的路徑（不做大貨 / 需求單流失 / 取消退費）都呼叫它建立諮詢訂單骨架，再各自加：
- 不做大貨：Payment 轉移
- 需求單流失：Payment 轉移
- 取消退費：Payment 轉移 + 加一筆退款 Payment（amount = -consultationFee）寫在 `order.payments`

取消退費的諮詢訂單 status：`'訂單完成'`、paymentStatus：`'已退款'`。

`cancelConsultation` action 簽名不變，但內部改為走完整建訂單路徑（不再只 push 退款 Payment 到 cr.payments）。

### D5：convertQuoteToOrder 偵測諮詢來源 — 帶入 ExtraCharge 與 Payment

`convertQuoteToOrder(quoteId)` 內：

```
if (quote.linkedConsultationRequestId) {
  const cr = consultationRequests.find(c => c.id === quote.linkedConsultationRequestId);
  if (cr && !cr.payments.every(p => p.transferredToOrderId)) {
    // 帶入諮詢費 ExtraCharge
    newOrder.extraCharges.push({ chargeType: 'consultation_fee', amount: cr.consultationFee, ... });
    // 轉移 Payment 至新訂單
    transferPayments(cr, newOrder);
    // 更新 totalAmount
    newOrder.totalAmount = newOrder.productAmount + cr.consultationFee;
  }
}
```

注意：諮詢來源需求單轉訂單時，**沒有**新建諮詢訂單（spec 明示「諮詢結束做大貨需求單成交情境下諮詢訂單從未建立」）。Payment 直接從 CR 跳到一般訂單。

### D6：mock 資料補齊

mockConsultationRequests 中已有狀態為「完成諮詢」「已取消」的 mock，但對應的 mockOrders 沒有相應的諮詢訂單。需要補：
- `order-cr-completed-001`：諮詢訂單，linkedConsultationRequestId = `cr-202604-0005`，含 ExtraCharge + 已轉移 Payment
- `order-cr-refunded-001`：諮詢訂單（退費），linkedConsultationRequestId = `cr-202604-0002`，含 ExtraCharge + 已轉移 Payment + 退款 Payment

同時將對應諮詢單的 `payments[].transferredToOrderId` 填上。這讓 demo 切到該諮詢單 → 點 linkedConsultationOrderId → 跳到訂單時看得到正確 mock。

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Phase 1 跳「訂單完成」可能讓未來 Phase 2 加 Invoice gate 時 status 規則矛盾 | D3 加 staffNotes 與 ActivityLog 留下 Phase 1 標記；Phase 2 change 顯式處理遷移 |
| `transferredToOrderId` 為新加欄位，可能漏判導致重複轉移 | helper 內統一 guard（payments.every(p => !p.transferredToOrderId) 才轉），所有 caller 走 helper |
| productAmount / totalAmount 雙寫一致性 | 抽 `recalcOrderAmounts(order)` helper，加 / 改 ExtraCharge 時呼叫一次 |
| 取消退費 prototype 既有 mock 內 cr.payments[1] 已是退款 Payment（v1 設計），改設計後變成「應該在訂單上」會產生資料不一致 | mock 重建時把退款 Payment 從 cr 搬到 order；cr.payments 只保留原付款一筆（帶 transferredToOrderId） |

## Migration Plan

1. **Phase 1**（本 change）
   - 加 helper（buildConsultationOrder / transferPayments / recalcOrderAmounts）
   - 改四個 action（endConsultationNoProduction / updateQuoteStatus loss hook / cancelConsultation / convertQuoteToOrder）
   - 修 mock（補諮詢訂單 mock + 修退費情境 cr.payments）
   - type-check + 走過四條情境驗證

2. **Phase 2**（後續另開 change）
   - Invoice / SalesAllowance 提升到 Zustand store
   - 諮詢訂單 status flow 改嚴格走「已開發票 → 訂單完成」
   - issue_now 路徑自動開 Invoice、取消退費 issue_now 自動 SalesAllowance

## Open Questions

OQ #1 / #2 / #3 在 § Decisions 已解。本 change 進入 tasks 階段無未決 OQ。
