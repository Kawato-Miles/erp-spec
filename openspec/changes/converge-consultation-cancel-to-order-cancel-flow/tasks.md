## 1. Store 層：cancelConsultation 收斂（核心）

- [ ] 1.1 `useErpStore.cancelConsultation`：諮詢訂單 `status` 改 `'已取消'`（限 `orderWithPayments` 組裝層，**MUST NOT 改 `buildConsultationOrder` helper 本體**）、`paymentStatus` 維持 `'已付款'`
- [ ] 1.2 退款 OA 建法：`status='已核可'`、`approvedBy='system'`、`approvedAmount=-1000`、`executedAt=null`、`requiresSupervisorApproval=false`（取代既有 `status='已執行'`）
- [ ] 1.3 移除自動建 BillingInstallment（刪 `newCancellationBI` + `cancellationBiEvent` 寫入）；確認 `source_type='consultation_cancellation'` enum 值保留於型別定義
- [ ] 1.4 確認退款 Payment 切已完成 → 推進 OA「已核可 → 已執行」沿用一般退款既有邏輯（cancelConsultation 不另寫推進，靠既有 Payment 切已完成 hook）
- [ ] 1.5 OA 系統建立 + 業務後續調整金額寫 OrderActivityLog（沿用既有稽核鉤子）

## 2. 對帳層：差錯偵測篩選

- [ ] 2.1 `reconciliationCsv.ts` `calcReconciliationDiscrepancies`：訂單篩選 `o.status === '訂單完成'` 改為 `o.status ∈ {訂單完成, 已取消} 且該訂單有 status=開立 Invoice`
- [ ] 2.2 `calcDiscrepancyRate` 分母同步調整（涵蓋已取消有發票訂單）
- [ ] 2.3 確認 `buildReconciliationRows`（CSV 匯出層）不動（已以已開立發票為主軸）

## 3. Mock 資料對齊

- [ ] 3.1 既有諮詢取消 mock 諮詢訂單：`status` 改 `'已取消'`、退款 OA 改 `'已核可'`（確認不影響 `buildBillingInstallmentsFromLegacy` 反向重建——廢的是新建邏輯非歷史遷移）

## 4. e2e 驗證（Playwright）

- [ ] 4.1 諮詢取消 → 諮詢訂單 `status='已取消'` + 退款 OA `status='已核可'` + 無自動建 BillingInstallment（斷言 store 狀態）
- [ ] 4.2 退款 Payment 切已完成 → OA 推進 `'已執行'` + 諮詢訂單維持 `'已取消'`（善後金流不推進訂單狀態）
- [ ] 4.3 回歸：諮詢結束不做大貨 / 需求單流失兩情境仍 `status='訂單完成'` + 仍自動建 BillingInstallment（保護 buildConsultationOrder helper 未誤傷）
- [ ] 4.4 對帳差錯偵測納入已取消有開立發票的諮詢訂單（應收 1000 = 發票淨額 = 收款淨額、差額 0）
- [ ] 4.5 已取消但未開票諮詢訂單觸發「應收 > 發票淨額」差額警示（未開票兜底提醒）
- [ ] 4.6 諮詢取消後 console 無 error / pageerror（top-down 連鎖空轉 no-op 驗證）
- [ ] 4.7 smoke + navigation 既有 e2e 全數通過（無回歸）

## 5. 驗證與收尾

- [ ] 5.1 `tsc` 型別檢查通過
- [ ] 5.2 完整 e2e 套件通過（含上述新增案例 + 既有套件）
- [ ] 5.3 更新 OQ（archive 前）：[CR-5](../../../memory/erp/ERP_Vault/08-open-questions/CR-5-諮詢取消退款OA審核路徑.md)（OA 建已核可）/ [CR-6](../../../memory/erp/ERP_Vault/08-open-questions/CR-6-諮詢取消專屬待開發票是否廢除.md)（廢自動建 + 保留 source_type）/ [BI-15](../../../memory/erp/ERP_Vault/08-open-questions/BI-15-對帳主軸改已開發票後未開票應收呈現.md)（差額警示兜底）標 answered（oq-manage mode C）
- [ ] 5.4 開新 OQ（oq-manage mode B）：差額警示文案區分「應收>發票淨額（待開票）」vs「收款淨額>應收（退款待執行）」（顧問 C-2，上線前驗證）
- [ ] 5.5 `/opsx:verify` 前三視角審查（依 multi-agent-discussion-protocol，過渡期保留）
- [ ] 5.6 doc-audit 跨檔一致性（特別檢查 consultation-request L398 舊版 PlannedInvoice 描述與本 change MODIFIED 後的一致性）
