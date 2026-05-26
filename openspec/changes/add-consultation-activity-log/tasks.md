## 1. Type 層

- [ ] 1.1 `sens-erp-prototype/src/types/consultationRequest.ts` import `ActivityLog` from `@/types/quote`
- [ ] 1.2 `ConsultationRequest` interface 加 `activityLogs: ActivityLog[]` 必填欄位

## 2. Store actions 補 activityLog 寫入

- [ ] 2.1 `assignConsultant`：set state 時 `activityLogs: [...c.activityLogs, createActivityLog(currentUser.name, '諮詢人員認領', '')]`
- [ ] 2.2 `endConsultationNoProduction`：set state 時 push createActivityLog(currentUser.name, '結束諮詢 - 不做大貨', `建立諮詢訂單 ${orderWithPayments.orderNo}（Payment 已轉移）`)
- [ ] 2.3 `endConsultationWithQuote`：set state 時 push createActivityLog(currentUser.name, '結束諮詢 - 轉需求單', `建立需求單 ${quoteNo}，Payment 暫綁諮詢單等需求單流程結局`)
- [ ] 2.4 `cancelConsultation`：set state 時 push createActivityLog(currentUser.name, '待諮詢取消', `建立諮詢訂單 ${orderWithPayments.orderNo} + 退款 Payment（-NT$${cr.consultationFee.toLocaleString()}）`)
- [ ] 2.5 `updateQuoteStatus` 流失分支：諮詢來源需求單流失建諮詢訂單時，在 CR 上 push createActivityLog('系統', '需求單流失觸發建諮詢訂單', `需求單 ${quote.quoteNo} 流失，系統自動建諮詢訂單 ${orderWithPayments.orderNo}（Payment 已轉移）`)

## 3. UI 層

- [ ] 3.1 `pages/ConsultationRequestDetail.tsx` import `ActivityTimeline` from `@/components/shared/ActivityTimeline`
- [ ] 3.2 在「付款紀錄」`ErpDetailCard` 之後新增「活動紀錄」`ErpDetailCard`，內含 `<ActivityTimeline>`（空時顯示「尚無活動紀錄」）

## 4. Mock 層

- [ ] 4.1 `data/mockConsultationRequests.ts` import `createActivityLog` 或 inline 寫死 ActivityLog 物件
- [ ] 4.2 為 5 張既有 mock CR 補 `activityLogs`（依 design.md D4 表格反推事件序列）

## 5. 驗證

- [ ] 5.1 `npx tsc --noEmit` 通過
- [ ] 5.2 啟動 dev server，巡 5 張 mock CR 詳情頁，確認活動紀錄區顯示正確
- [ ] 5.3 操作 CR-202605-0001（待諮詢 + 無 consultantId）→ 指派諮詢人員 → 確認新增「諮詢人員認領」事件
- [ ] 5.4 操作 CR-202605-0002（待諮詢 + 已指派）→ 取消諮詢 → 確認新增「待諮詢取消」事件
- [ ] 5.5 截圖一張 mock CR 詳情頁活動紀錄區（已轉需求單情境）作為實作證明

## 6. 收尾

- [ ] 6.1 `git diff` 檢視 Sens repo 與 sens-erp-prototype repo 變動
- [ ] 6.2 Sens repo commit（新增 change artifacts）
- [ ] 6.3 sens-erp-prototype repo commit（4 個 prototype 檔案變動）
