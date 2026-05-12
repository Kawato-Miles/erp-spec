## Why

`add-consultation-request-and-revise-approval-gate`（2026-05-07 歸檔）的 spec 定義了諮詢費跟著「最終訂單」走的完整金流：Payment 一開始綁 ConsultationRequest，諮詢結束後（不做大貨 / 需求單流失 / 取消退費 / 做大貨成交轉訂單）依路徑轉移到對應的訂單，並建 OrderExtraCharge(consultation_fee) 與 Invoice / SalesAllowance（如適用）。

實際 prototype 落地時，三條建諮詢訂單路徑為了「先把流程能跑通」採 Phase 1 簡化（store 註解明示「不轉移 Payment 至訂單；後續迭代補」），導致：

1. 三條建諮詢訂單路徑都沒做 Payment 轉移（cr.payments 仍掛在諮詢單上、訂單 payments 永遠空陣列）
2. **取消諮詢退費**根本沒建諮詢訂單（只把退款 Payment 加到 cr.payments），跟 spec「複用『不做大貨』收尾路徑」的統一規則違背
3. **諮詢來源需求單成交轉一般訂單**時，`convertQuoteToOrder` 沒做諮詢費 ExtraCharge、沒做 Payment 從 CR 轉移到一般訂單；spec 預期主訂單應收 5000、已收 1000、待繳 4000，實際 prototype 一般訂單只看到 5000 應收，諮詢費那 1000 還掛在諮詢單上

驗證時會看到：訂單詳情頁打開沒有諮詢費的收款紀錄、應收已收不對、退費後找不到對應訂單。所有對帳檢視都失準。

## What Changes

- **新增** Payment 跨實體轉移 store helper：把 cr.payments[] 整批搬到 order.payments，同時在來源（諮詢單）寫入「已轉移」標記避免重複搬
- **修訂** `endConsultationNoProduction` action：建諮詢訂單時 Payment 從 cr 轉移到訂單
- **修訂** `updateQuoteStatus`（諮詢來源需求單流失 hook）：建諮詢訂單時 Payment 從 cr 轉移到訂單
- **修訂** `cancelConsultation` action：完整實作「建諮詢訂單 + OrderExtraCharge + Payment 轉移 + 退款 Payment 寫在訂單上」流程，與其他兩條收尾路徑共用
- **修訂** `convertQuoteToOrder` action：偵測來源需求單的 `linkedConsultationRequestId`，若非空則於新一般訂單建 OrderExtraCharge(consultation_fee) + Payment 從 CR 轉移到一般訂單；訂單 totalAmount / productAmount 重新計算（含諮詢費）
- **明確 Non-Goal**：本 change 不處理 Invoice 自動開立與 SalesAllowance 建立（spec 有要求 issue_now 路徑自動開 Invoice，但 prototype 的 Invoice 目前使用 React local state 而非 Zustand store，需先有 Invoice store action 才能自動開；保留為 Phase 2）

## Capabilities

本 change 不修改 main spec（spec 已歸檔且方向不變）。僅補齊 prototype 對既有 spec 的落地缺口。

如未來決定把 Invoice 自動開立補上，會另開 change 並更新 spec scenarios 標明自動 vs 手動的差異。

## Impact

- **修訂 prototype**：
  - `sens-erp-prototype/src/store/useErpStore.ts` 四個 action 修改：`endConsultationNoProduction` / `updateQuoteStatus` 流失 hook / `cancelConsultation` / `convertQuoteToOrder`
  - 可能新增 `src/utils/transferConsultationPayments.ts` 或在 store 內 inline helper
- **type 層**：ConsultationRequest payment 結構可能需加 `transferred_to_order_id` 或 `is_transferred` 標記欄位（避免重複轉移）；或改為「轉移後從 cr.payments 移除、改放在 order.payments」的非破壞性語意
- **mock 資料**：mockConsultationRequests 中已是「完成諮詢」「已取消」狀態的 mock，需補 mockOrders 對應的諮詢訂單 mock（含 Payment 轉移後狀態），以便切到該諮詢單時能跳到關聯訂單檢視
- **驗證情境**：
  - 諮詢費 1000、做大貨總額 5000：轉一般訂單後 → 應收 5000、已收 1000、待繳 4000
  - 諮詢費 1000、不做大貨：諮詢訂單應收 1000、已收 1000、差額 0
  - 諮詢費 1000、取消退費：諮詢訂單應收 1000、已收 1000、退款 -1000、淨額 0
  - 諮詢費 1000、需求單流失：諮詢訂單應收 1000、已收 1000、差額 0
- **無 Notion 同步需求**（spec 不變）
- **無新 OQ**

## Open Questions

| # | OQ | 必解時機 |
|---|----|---------|
| 1 | Payment 轉移後 cr.payments 是否清空？或保留並加 `transferred_to_order_id` 標記？影響「諮詢單詳情頁是否還看得到付款紀錄」 | design.md |
| 2 | 諮詢來源訂單的 totalAmount 與 productAmount 怎麼算？目前 prototype `totalAmount = ∑印件單價`，是否要改成 `∑印件單價 + ∑ExtraCharge` 以反映諮詢費已併入應收 | design.md |
| 3 | 諮詢訂單（order_type='諮詢訂單'）的 status 是否應該照「建立 → 已開發票 → 訂單完成」短路徑跑？目前直接寫 `status: '訂單完成'` 太樂觀，連 Invoice 都還沒開 | design.md |
