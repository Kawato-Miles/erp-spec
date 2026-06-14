## 1. spec delta（sign 對齊）

- [x] 1.1 折讓相關 Requirement 改正值：折讓單建立（折讓金額正數 + 折讓限正數防呆）、Invoice 折讓衍生標籤（去 abs）、折讓單狀態機（去 abs）、發票異動流程情境 C 折讓、跨齊報稅期作廢 vs 折讓流程節點（L1443 金額為負→正值，consultant 複查補抓）
- [x] 1.2 退款 Payment 相關 Requirement 改款項類型 + 正值：退款 Payment 與折讓分離、Payment 修正路徑、發票異動流程情境 C 退款；對帳分桶述「退款正值記錄、對帳作減項」
- [x] 1.3 確認訂單異動 sign 未被誤動（維持可正可負）

## 2. spec delta（Data Model 單一正本）

- [x] 2.1 SalesAllowanceFile / PaymentFile：移除技術欄位表，改引用 wiki 帳務卡附件欄位，保留多檔上傳 + 活動紀錄行為
- [x] 2.2 發票品項符合 ezPay：移除五欄表，改引用 wiki 帳務卡發票品項 + MIG §二，保留檢核行為與 scenarios
- [x] 2.3 REMOVED 訂單金額 Data Model 雙欄擴充（附 Reason / Migration）
- [x] 2.4 REMOVED 既有資料 Migration 一次性 backfill（附 Reason / Migration）

## 3. 一致性驗證

- [x] 3.1 `openspec validate refactor-order-billing-data-model-and-refund-sign` 通過
- [x] 3.2 grep 確認 order-billing 主 spec（archive 後）無殘留「金額為負數 / 收款方式＝退款 / 折讓.*負數 / allowance_amount」舊模型字句
- [x] 3.3 確認 Prototype 無需改動（types/payment.ts、salesAllowance.ts、orderAdjustment.ts 對照三實體 sign 慣例一致，純 spec 追上 prototype）
- [x] 3.4 確認與 add-pending-refund-payout-list 無同條 Requirement 衝突（MODIFIED/REMOVED vs ADDED 不重疊）
