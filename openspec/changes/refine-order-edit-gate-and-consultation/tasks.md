## 1. Spec delta 確認

- [x] 1.1 確認 `specs/order-management/spec.md` delta：MODIFIED 訂單建立（兩種收尾情境）+ MODIFIED 訂單階段印件規格編輯時機（製作等待中閘門）+ REMOVED 訂單階段改派負責業務
- [x] 1.2 確認 `specs/consultation-request/spec.md` delta：MODIFIED 需求單流失觸發建諮詢訂單收尾（補非諮詢來源不觸發 Scenario + 重要限制）
- [x] 1.3 確認 `specs/state-machines/spec.md` delta：MODIFIED 訂單狀態機（諮詢路徑從三種改兩種高層情境 + 補非諮詢來源不觸發 Scenario）

## 2. Prototype 邏輯調整

- [ ] 2.1 OrderDetail.tsx：isBeforeSigned → isBeforeProduction 重新命名，狀態列表更新為 PRE_PRODUCTION_STATUSES（含審稿段）
- [ ] 2.2 OrderDetail.tsx：印件「申請異動」切換條件改用 isBeforeProduction
- [ ] 2.3 OrderDetail.tsx：移除「業務負責人」欄位旁的「改派」連結
- [ ] 2.4 OrderDetail.tsx：訂單詳情頁加「分享」入口（沿用 US-ORD-004；若 UI 尚未實作則先 toast 提示「沿用既有分享機制」）

## 3. Prototype UI 大改（接續 9 條調整）

- [ ] 3.1 訂單詳情頁新增「檔案」Tab，OrderSignedFile 從資訊 Tab 獨立至此
- [ ] 3.2 資訊 Tab 新增「出貨資訊」Section，集中：客戶交期、審稿前 / 後預計出貨日、內部製作截止日、出貨方式、運費
- [ ] 3.3 收款記錄 Dialog 內就可上傳 PaymentFile（不是事後從列表上傳）
- [ ] 3.4 「印件清單」Tab → 「訂單項目」Tab，含兩個 sub-section：
  - 印件 sub-section：列出 PrintItem，可編輯售價（未稅）
  - 其他項目 sub-section：列出 OrderExtraCharge，可新增 / 編輯 / 自定義名稱、可編售價（未稅）
- [ ] 3.5 發票開立 Dialog：支援多筆 InvoiceItem（名稱 + 金額），總金額 = 商品明細加總
- [ ] 3.6 確保資訊 Tab 主要欄位都可編輯（除唯讀欄位外，如訂單編號 / 建立時間）
- [ ] 3.7 確保金額及付款狀態 Tab 內 PaymentPlan / Payment / OrderAdjustment 都可編輯
- [ ] 3.8 確保發票 Tab 內 Invoice / SalesAllowance 都可編輯

## 4. Archive 與後續

- [ ] 4.1 觸發 /opsx:archive 歸檔本 change（sync delta 至 main spec）
- [ ] 4.2 CLAUDE.md § Spec 規格檔清單版本更新（order-management v1.3 → v1.4）
- [ ] 4.3 Notion 訂單模組 BRD v1.3 修訂備忘 callout 補一條 v1.4 修訂說明
