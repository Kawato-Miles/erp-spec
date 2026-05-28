## 1. Type 層調整

- [x] 1.1 在 `ConsultationRequestPayment` interface 加 `transferredToOrderId?: string` 欄位（轉移後寫入新訂單 id）
- [x] 1.2 確認 `Order.payments` 的元素型別（PaymentRecord）能容納從諮詢單轉過來的 payment 結構欄位（paymentRef / recordedBy / notes 等）；不相容欄位 inline 轉換在 helper 內處理

## 2. Store helper

- [x] 2.1 新增 `buildConsultationOrder(cr, currentUser, reason): Order` helper，產出諮詢訂單骨架（沿用既有 endConsultationNoProduction 的訂單欄位設定，抽共用）
- [x] 2.2 新增 `transferPaymentsFromCr(cr, order)` helper：複製 cr.payments 內未轉移的 payment 到 order.payments；同時在 cr.payments 對應筆寫入 transferredToOrderId
- [x] 2.3 新增 `recalcOrderAmounts(order)` helper：依 printItems 與 extraCharges 重算 productAmount / totalAmount
- [x] 2.4 為三個 helper 補 JSDoc，標明哪個 action 呼叫、guard 條件

## 3. Store actions 修改

- [x] 3.1 `endConsultationNoProduction`：改為使用 `buildConsultationOrder` + `transferPaymentsFromCr` + `recalcOrderAmounts`，paymentStatus 設「已付款」
- [x] 3.2 `updateQuoteStatus` 內「諮詢來源需求單流失」hook：同上重構，paymentStatus 設「已付款」
- [x] 3.3 `cancelConsultation`：完整重寫
   - 用 `buildConsultationOrder` 建諮詢訂單（reason = '取消退費'）
   - 用 `transferPaymentsFromCr` 轉移原付款
   - 在 order.payments 加退款 Payment（amount = -consultationFee、paymentMethod = '退款'、notes = '客戶取消預約全額退費'）
   - 更新 cr.linkedConsultationOrderId = 新訂單 id
   - paymentStatus 設「已退款」、staffNotes 標 SalesAllowance 待手動開（issue_now 路徑）
- [x] 3.4 `convertQuoteToOrder`：偵測 quote.linkedConsultationRequestId
   - 非空時：在 newOrder.extraCharges push consultation_fee charge、呼叫 transferPaymentsFromCr 將 cr.payments 轉移至 newOrder
   - 呼叫 recalcOrderAmounts 更新金額
   - 寫 ActivityLog 標明「諮詢費已併入主訂單應收」
   - 注意：MUST NOT 建立諮詢訂單（spec 明示）

## 4. Mock 資料修整

- [x] 4.1 在 `mockOrders` 加 `order-cr-completed-001`：諮詢訂單、linkedConsultationRequestId = 'cr-202604-0005'、ExtraCharge consultation_fee = 諮詢費、payments = [從 cr 轉移過來的付款 1 筆]
- [x] 4.2 在 `mockOrders` 加 `order-cr-refunded-001`：諮詢訂單、linkedConsultationRequestId = 'cr-202604-0002'、ExtraCharge consultation_fee = 諮詢費、payments = [原付款（已標 transferredToOrderId）、退款 Payment amount 為負]、paymentStatus = '已退款'
- [x] 4.3 修 `mockConsultationRequests` cr-202604-0005 的 payments[0] 加 transferredToOrderId = 'order-cr-completed-001'
- [x] 4.4 修 `mockConsultationRequests` cr-202604-0002 的 payments：
   - payments[0]（原付款）加 transferredToOrderId = 'order-cr-refunded-001'
   - payments[1]（退款 Payment）：從 cr.payments **移除**（搬到訂單 payments），符合新設計
- [x] 4.5 確認 mockOrders 內既有「已轉需求單後流失」mock 是否存在；如有，比照 4.1 結構補

## 5. 對帳檢視 UI 驗證

- [x] 5.1 開「完成諮詢」mock cr → 點 linkedConsultationOrderId 跳訂單詳情頁 → 確認應收 / 已收 / 待繳對得上、Payment 區看得到諮詢付款
- [x] 5.2 開「已取消」mock cr → 點 linkedConsultationOrderId 跳訂單 → 確認應收 = 諮詢費、已收 + 退款淨額 = 0、paymentStatus 顯示「已退款」
- [x] 5.3 模擬「諮詢轉需求單成交轉訂單」端到端：切到諮詢角色 → 開 cr → 點「轉需求單（做大貨）」→ 切到業務 → 開需求單填規格 → 評估 → 議價 → 成交 → 轉訂單；新訂單詳情頁應看到 ExtraCharge consultation_fee + 諮詢付款已收
- [x] 5.4 模擬「待諮詢取消退費」：切到諮詢角色 → 開 cr-202605-0001 → 點「取消諮詢」→ 確認自動建立諮詢訂單 + 退款 Payment + paymentStatus = '已退款'
- [x] 5.5 諮詢單詳情頁的「諮詢付款紀錄」區塊顯示 transferredToOrderId 連結

## 6. 驗證 + 收尾

- [x] 6.1 `npx tsc --noEmit` 通過
- [x] 6.2 走過 5.x 四條 demo 路徑驗證
- [x] 6.3 commit `feat(consultation): 諮詢費 Payment 跨實體轉移 + 退費路徑建諮詢訂單`
- [x] 6.4 `openspec validate complete-consultation-order-linkage --strict` 通過
- [x] 6.5 push 至 main，等 Lovable 部署完成

## 7. 歸檔

- [x] 7.1 Miles 測試驗收後 `openspec archive complete-consultation-order-linkage`
- [x] 7.2 本 change 不動 main spec（無 delta），歸檔僅移到 archive/ 資料夾
- [x] 7.3 更新 CLAUDE.md Spec 規格檔清單註記「Phase 1 諮詢訂單連動已落地」

## Phase 2 預留（不在本 change 範疇）

- [ ] 8.1 Invoice / SalesAllowance 提升到 Zustand store
- [ ] 8.2 諮詢訂單 status flow 改嚴格走「建立 → 已開發票 → 訂單完成」
- [ ] 8.3 issue_now 路徑自動開 Invoice
- [ ] 8.4 取消退費 issue_now 路徑自動 SalesAllowance
- [ ] 8.5 諮詢訂單建立後狀態改為「建立」而非「訂單完成」，等 Invoice 開立後才推進
