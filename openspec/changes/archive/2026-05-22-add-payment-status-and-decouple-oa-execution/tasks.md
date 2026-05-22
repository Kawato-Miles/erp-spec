## 1. Types 層擴充

- [x] 1.1 `src/types/payment.ts` 新增 `PaymentStatus` enum（'處理中' / '已完成'）
- [x] 1.2 `src/types/payment.ts` Payment interface 加 `paymentStatus: PaymentStatus`（必填）、`completedAt?: string | null`
- [x] 1.3 `src/types/payment.ts` 修改 helpers：`calcPaymentsNetAmount`、`calcRegularPaymentsAmount`、`calcRefundsAmount`、`derivePlanStatus` 全部加 `paymentStatus === '已完成'` 過濾
- [x] 1.4 `src/types/payment.ts` 新增 helper：`calcPendingPaymentsAmount(payments)` 回傳 `{ pendingRegular, pendingRefunds }`
- [x] 1.5 `src/types/order.ts` PaymentRecord interface 同步加 `paymentStatus` + `completedAt` 欄位（兩套並存型別）
- [x] 1.6 `src/types/orderAdjustment.ts` 新增 helper：`calcOACompletedPaymentsTotal(oaId, payments)` 計算對應 OA 的已完成 Payment 累計（含符號）
- [x] 1.7 執行 `npx tsc --noEmit` 確認所有 type 變動無編譯錯誤

## 2. Mock data Migration（一次性 backfill + 新增 demo）

- [x] 2.1 `src/data/mockPayments.ts`（或 mock data 來源）所有既有 Payment 加 `paymentStatus: '已完成'` + `completedAt = createdAt`
- [x] 2.2 確認既有 4 筆退款 Payment（pay-f1-2 / pay-f8-2 / pay-a3-2 等）正確 backfill
- [x] 2.3 新增 demo mock：1-2 筆一般收款 Payment 處於 `paymentStatus = '處理中'`（情境「客戶說已匯但對帳未到」）
- [x] 2.4 新增 demo mock：1-2 筆退款 Payment 處於 `paymentStatus = '處理中'`（情境「OA 已核可、業務還沒匯款」）
- [x] 2.5 新增 demo mock：1 筆補收 Payment 處於 `paymentStatus = '處理中'`（情境「加印追加 OA 已核可、補收 Payment 待匯」）
- [x] 2.6 跑 dev server 驗證 mock data 載入不破壞既有對帳數字（已完成 backfill 應與 backfill 前數值一致）

## 3. Store action 改寫

- [x] 3.1 `src/store/useErpStore.ts` 改寫 `createRefundPayment`：建立時預設 `paymentStatus = '處理中'`、不再同 transaction 推進 OA 至「已執行」、不再強制 attachments 必填（移到切已完成時驗證）
- [x] 3.2 `src/store/useErpStore.ts` 新增 `createOAPayment(oaId, payload)`：通用入口（退款 + 補收皆用），依 OA 正負自動預填 paymentMethod，amount 符號驗證
- [x] 3.3 `src/store/useErpStore.ts` 新增 `updatePayment(paymentId, patch)`：含 paymentStatus 切換驗證；若切「已完成」驗證 paidAt + attachments ≥ 1
- [x] 3.4 `src/store/useErpStore.ts` 新增 `cancelPayment(paymentId)`：處理中直接刪除、已完成可能觸發 OA 回退（重算累計 ≠ OA.amount 時推進已執行 → 已核可）
- [x] 3.5 `src/store/useErpStore.ts` 新增 OA 自動推進邏輯：每次 Payment 切「已完成」事件後重算對應 OA 累計，若 = OA.amount 則同 transaction 推進 OA → '已執行'
- [x] 3.6 `src/store/useErpStore.ts` 棄用「執行 OA 自動建補收 Payment」邏輯（若 OrderAdjustmentSection 內或 store 內有相關自動建立，移除）
- [x] 3.7 確認 `updatePayment` 阻擋「已完成 → 處理中」反向切換（UI 與 store 雙重保護）

## 4. OrderPaymentSection 改造（一般收款入口）

- [x] 4.1 `src/components/order/OrderPaymentSection.tsx` 列表新增「狀態」column，顯示 paymentStatus badge（處理中 / 已完成）
- [x] 4.2 處理中 row 視覺差異：半透明 + 虛線邊
- [x] 4.3 退款 row 維持 amber 底色（既有設計）+ 加 paymentStatus badge
- [ ] 4.4 操作欄統一單一「編輯」button（不分「補齊資料 / 標記已完成 / 編輯草稿」）
- [x] 4.5 編輯 Dialog 改為單一表單 + 單一「儲存」button + paymentStatus 切換 toggle / select
- [x] 4.6 paymentStatus = '已完成' 切換時 conditional required：paidAt 必填、attachments 必填 ≥ 1（用紅星標示）
- [ ] 4.7 「已完成 → 處理中」切換時 UI 阻擋 + 顯示提示「請改用『取消』功能後重建」
- [x] 4.8 新增收款按鈕 dialog 預設 paymentStatus = '處理中'（業務可在 dialog 內切「已完成」直接建完成 Payment）
- [x] 4.9 paymentMethod 下拉選單維持排除「退款」選項（既有設計，退款仍從 OA 入口建）

## 5. OA 編輯介面共用 Dialog 建立（核心新元件）

- [x] 5.1 建立共用元件 `OrderAdjustmentEditDialog`（路徑 TBD，建議 `src/components/order/OrderAdjustmentEditDialog.tsx`）
- [x] 5.2 Dialog 結構：上半 OA 欄位（adjustmentType / amount / reason）依 OA.status 決定可改否；下半關聯 Payment Table
- [x] 5.3 Payment Table 列出 linkedOrderAdjustmentId = OA.id 的所有 Payment（含 paymentStatus / amount / paidAt / 操作）
- [x] 5.4 Payment Table 底部「新增 Payment」button（僅 OA.status = '已核可' 時可用）：點開 inline Payment 表單，依 OA 正負自動預填 paymentMethod
- [x] 5.5 OA 退款型（amount < 0）：預填 paymentMethod = '退款'、amount 限制 ≤ 0
- [x] 5.6 OA 補收型（amount > 0）：預填 paymentMethod = '銀行轉帳'（或選單第一個非「退款」項）、amount 限制 ≥ 0
- [x] 5.7 Payment row 操作欄「編輯」button：點開另一個 PaymentEditDialog（沿用 § 4.5 的單一表單設計）
- [x] 5.8 Payment row 操作欄「取消」button：呼叫 `cancelPayment` action
- [x] 5.9 OA 編輯 dialog 確認 SHALL NOT 提供「執行」按鈕（既有設計，沿用 refine-after-sales-refund）

## 6. AfterSalesTicketDetail OA 改 ErpTable

- [x] 6.1 `src/components/order/AfterSalesTicketDetail.tsx` OA section 從卡片改 ErpTable 形式
- [x] 6.2 Table 欄位：異動類型 / 金額（顯示正負）/ 狀態 badge / 對應 Payment 數（「N 筆已完成 / M 筆處理中」）/ 建立時間 / 操作
- [x] 6.3 操作欄統一單一「編輯」button → 開啟共用 `OrderAdjustmentEditDialog`（§ 5）
- [x] 6.4 移除原「建立退款 Payment」按鈕（已由 OA 編輯 dialog 內「新增 Payment」入口取代）
- [x] 6.5 OA section header 維持「新增異動單」入口（既有設計，不變）

## 7. OrderAdjustmentSection 訂單詳情頁 OA 改 ErpTable（兩處統一）

- [x] 7.1 `src/components/order/OrderAdjustmentSection.tsx` 從既有顯示形式改 ErpTable（與 AfterSalesTicketDetail 一致）
- [x] 7.2 Table 欄位、操作按鈕、編輯 dialog 與 § 6 共用
- [x] 7.3 移除既有「執行」按鈕（refine-after-sales-refund 已移除退款型 OA 的執行按鈕，本 change 也移除補收型 OA 的執行按鈕）
- [x] 7.4 移除既有「OA 已執行自動建補收 Payment」邏輯（若 UI 層有觸發此自動建立的程式碼）

## 8. OrderReconciliationPanel 對帳面板改造

- [x] 8.1 `src/components/order/OrderReconciliationPanel.tsx` 收款淨額卡片內 breakdown 改顯示三項：
  - 已完成一般收款：+N
  - 已完成退款：-M
  - 處理中（合計）：±0（muted、加 tooltip「不計入收款淨額」）
- [x] 8.2 處理中合計細分（hover 或展開）：「處理中一般收款 K1 / 處理中退款 K2 / 處理中補收 K3」
- [x] 8.3 差額 hint 文字加註「另含處理中款項 K 元，齊備後將計入」
- [x] 8.4 對帳警示 banner（既有 executedAt > completedAt 觸發邏輯）不變

## 9. SalesAllowance 弱提示（resolve ORD-004 補 constraint）

- [x] 9.1 處理中退款 Payment 期間：系統 SHALL NOT 自動建立 SalesAllowance 或顯示弱提示
- [x] 9.2 退款 Payment 切「已完成」事件後：系統顯示弱提示「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance」（不阻擋業務）
- [x] 9.3 在 PaymentEditDialog 或 OrderReconciliationPanel 加入此弱提示 UI

## 10. Playwright e2e 驗證

- [ ] 10.1 一般收款先填一半：新增收款只填 amount → 儲存（處理中）→ 列表出現處理中 row → 對帳收款淨額不變
- [ ] 10.2 一般收款補齊資料：編輯處理中 → 補 paidAt + attachments → 切已完成 → 通過驗證 → 對帳收款淨額增加
- [ ] 10.3 退款分階段建檔：售後 ticket → OA Table → 編輯 OA → 新增 Payment 只填 amount → 儲存（處理中）→ OA 維持已核可
- [ ] 10.4 退款補齊資料 + 切完成：補 paidAt / attachments → 切已完成 → 累計達 OA.amount → OA 自動推進「已執行」
- [ ] 10.5 分次退款：OA -10000 → 建兩筆退款 Payment 各 -5000（處理中）→ 補第一筆切已完成（OA 維持已核可）→ 補第二筆切已完成（OA 推進已執行）
- [ ] 10.6 補收 OA 對稱情境：加印追加 +20000 → 主管核可 → OA 編輯介面建補收 Payment（處理中）→ 補齊切已完成 → OA 推進已執行
- [ ] 10.7 分次補收：補收 OA +5000 → 兩筆 +2500（處理中）→ 補第一筆切已完成（維持已核可）→ 補第二筆（推進已執行）
- [ ] 10.8 缺資料驗證：未補 paidAt / attachments 直接切已完成 → 系統擋下 + 錯誤訊息
- [ ] 10.9 取消處理中 Payment：刪除 → OA 不動
- [ ] 10.10 取消已完成 Payment 觸發 OA 回退：累計不再達 OA.amount → OA 回退已核可 → 對帳淨額恢復
- [ ] 10.11 取消已完成 Payment 但累計仍達 OA.amount：OA 維持已執行（雙筆 Payment 情境）
- [ ] 10.12 對帳分軸顯示：對帳面板顯示三軸「已完成一般收款 / 已完成退款 / 處理中（合計）」+ 差額 hint
- [ ] 10.13 OA UI 兩處統一改 Table：售後 ticket 內 + 訂單詳情頁訂單異動 Tab 同樣 ErpTable + 單一「編輯」按鈕
- [ ] 10.14 棄用自動建補收 Payment：訂單期間加印追加 OA 核可後 SHALL NOT 自動建補收 Payment（需業務在 OA 編輯介面手動建）

## 11. Vault 收尾

- [x] 11.1 更新 `memory/erp/ERP_Vault/08-open-questions/ORD-003-取消退款Payment是否回退OA.md`：status 改 resolved + 記錄決策（處理中刪除不動 OA、已完成取消重算累計後回退）
- [x] 11.2 更新 `memory/erp/ERP_Vault/08-open-questions/ORD-004-跨期退款SalesAllowance自動建立.md`：補 constraint「處理中期間禁止觸發 SalesAllowance」
- [x] 11.3 更新 `memory/erp/ERP_Vault/05-entities/訂單.md` § OrderAdjustment 行為摘要：「已執行」推進機制描述改為「對應 Payment 切已完成累計達 OA.amount 自動推進」
- [x] 11.4 更新 `memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md` § 六、三方對帳：收款淨額公式加註「僅 paymentStatus = '已完成'」
- [x] 11.5 新增 OQ（從 design.md § Open Questions 提煉）：
  - OQ：處理中 Payment 老化追蹤機制（後續 change）
  - OQ：會計實務對處理中 Payment 應收應付處理（需與會計確認）
  - OQ：取消已完成 Payment 邏輯刪除 vs 物理刪除
- [x] 11.6 觸發 `vault-audit` skill（≥ 5 個 Vault 卡異動時建議）

## 12. 三視角審查（specs + design 完成後觸發）

- [ ] 12.1 觸發 `senior-pm` agent 審查（已在 propose 階段前期介入，本次審查 specs + design 完整性，依 [[multi-agent-discussion-protocol]]）
- [ ] 12.2 觸發 `ceo-reviewer` agent 審查（KPI 對齊 + 商業合理性，依 [[ceo-review-framework]] § 6）
- [ ] 12.3 觸發 `erp-consultant` agent 審查（5 個資料模型設計模式對照、系統一致性）
- [ ] 12.4 三視角結果整合至 design.md（若有需修正項目，更新 spec / design 後重新驗證）

## 13. 文件稽核

- [x] 13.1 觸發 `doc-audit` skill（spec 異動後自動執行）
- [x] 13.2 確認 state-machines spec / order-management spec / business-processes spec 之間描述一致（特別是「OA 已執行」觸發條件三處同步）
- [x] 13.3 確認 Vault 卡與 OpenSpec spec 描述一致

## 14. KPI 與監測（後驗）

- [ ] 14.1 於 [Notion KPI DB](https://www.notion.so/0ec626299b6545fab5f7e49dffc15e9f) 新增 3 個 KPI 條目：款項資料齊備率 / 處理中 Payment 老化率 / OA 平均推進時間（Feature 欄位掛「訂單管理」）
- [ ] 14.2 UAT 階段量測基準線（處理中 Payment 老化率、OA 推進時間）
- [ ] 14.3 上線 1 個月後檢視指標，若達失敗條件（老化率 > 20% 或 OA 推進時間延長 3 倍）→ 觸發 follow-up review

## 15. Verify 與 Archive 準備

- [x] 15.1 執行 `openspec validate add-payment-status-and-decouple-oa-execution --strict`
- [x] 15.2 執行 `/opsx:verify add-payment-status-and-decouple-oa-execution` 確認實作對齊 spec
- [ ] 15.3 commit 所有變更（包含 Prototype + Vault + Notion KPI 新增）
- [ ] 15.4 觸發 `/opsx:archive add-payment-status-and-decouple-oa-execution`
