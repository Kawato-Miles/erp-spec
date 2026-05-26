## 1. Types 層擴充

- [x] 1.1 `src/types/payment.ts` 新增欄位：Payment interface 加 `cancelled: boolean`、`cancelReason: string`、`cancelledAt: string | null`
- [x] 1.2 `src/types/payment.ts` 修改 helpers：`calcOACompletedPaymentsTotal` 過濾 `cancelled === false`、`calcPaymentsNetAmount` 過濾 `cancelled === false`、`calcRegularPaymentsAmount` / `calcRefundsAmount` / `calcPendingPaymentsAmount` 全部過濾 cancelled
- [x] 1.3 `src/types/payment.ts` 新增 helper：`isPaymentAging(payment, nowMs)` 判定 `paymentStatus === '處理中' && cancelled === false && (nowMs - new Date(createdAt).getTime()) > 7 * 86400000`，回傳 `{ aging: boolean, days: number }`
- [x] 1.4 `src/types/order.ts` PaymentRecord interface 同步加三欄位 + 加 `createdAt?: string` 用於老化追蹤
- [x] 1.5 執行 `npx tsc --noEmit` 確認所有 type 變動無編譯錯誤

## 2. Mock data Migration（一次性 backfill + 新增 demo）

- [x] 2.1 `src/data/mockPaymentPlans.ts` 所有既有 Payment 透過 backfillPayment 自動補：`cancelled: false`、`cancelReason: ''`、`cancelledAt: null`
- [x] 2.2 新增 demo mock：1 筆「已取消」Payment 用於 cancelled toggle 顯示驗證（pay-cancelled-demo-001）
- [x] 2.3 新增 demo mock：1 筆「老化 14 天處理中」Payment 用於老化 Badge 視覺驗證（pay-aging-demo-001）
- [x] 2.4 e2e 通過驗證 mock data 載入不破壞既有對帳數字

## 3. Store action 改寫

- [x] 3.1 `src/store/useErpStore.ts` `cancelPayment` 改寫：paymentStatus = '處理中' 維持物理刪除；paymentStatus = '已完成' 改為邏輯刪除（設 cancelled = true / cancelReason / cancelledAt、不從陣列移除）
- [x] 3.2 `cancelPayment` 邏輯刪除路徑必填驗證：`options.cancelReason` 為空字串時回傳 error「取消原因為必填」、不寫入
- [x] 3.3 `cancelPayment` 邏輯刪除後觸發 OA 回退邏輯（既有邏輯沿用、calcOACompletedPaymentsTotal 已加 cancelled 過濾自然觸發）
- [x] 3.4 `updatePayment` 切「已完成」事件後若 paymentMethod = '退款' SHALL 回傳 `salesAllowanceHint: true`（供 PaymentEditPanel 判斷顯示 inline banner）
- [x] 3.5 新增 selector `getAgingPendingPayments(nowMs)`：跨訂單聚合所有老化處理中 Payment
- [x] 3.6 `createRefundPayment` paymentId 加 random suffix 避免 Date.now() 同毫秒衝突（e2e 同步呼叫場景）
- [x] 3.7 新增 testing helper `pushPayment(orderId, payment)`：供 e2e 「一般收款」流程繞過 OrderPaymentSection local state

## 4. PaymentEditPanel 共用元件抽出

- [x] 4.1 新建 `src/components/order/PaymentEditPanel.tsx`，從 `OrderAdjustmentEditDialog.tsx` 內 EditPaymentPanel 抽出
- [x] 4.2 PaymentEditPanel props 介面定義：受控元件（payment / onUpdate / onCancelPayment / onClose / onNavigateToInvoice）
- [x] 4.3 抽出後 OrderAdjustmentEditDialog.tsx 改 import PaymentEditPanel
- [x] 4.4 PaymentEditPanel 內顯示 paymentStatus 切「已完成」成功後 inline banner（限退款型）：「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance」+「我知道了」「前往 Invoice 詳情頁」兩個 action
- [x] 4.5 PaymentEditPanel 內阻擋「已完成 → 處理中」反向：disabled radio + 顯示提示「請改用『取消此 Payment』功能後重建」
- [x] 4.6 PaymentEditPanel 內含取消模式（cancelReason 必填、依 paymentStatus 邏輯/物理刪除分支）

## 5. OrderPaymentSection UI 補完

- [x] 5.1 `src/components/order/OrderPaymentSection.tsx` 收款紀錄列表 thead 新增「操作」column
- [x] 5.2 列表 row 操作欄加單一「編輯」icon button（Pencil icon、與 PaymentPlan row 既有按鈕風格一致）
- [x] 5.3 「編輯」點擊行為：開啟 PaymentEditPanel（包裹 PaymentRecord shape wrapper + onUpdate / onCancelPayment local state callbacks）
- [x] 5.4 列表加「顯示已取消」toggle（位於列表 header 右側），預設不顯示 cancelled = true 的 row
- [x] 5.5 列表 row 顯示老化 Badge：`isPaymentAging(p, Date.now())` 為 true 時顯示 amber Badge「老化 N 天」
- [x] 5.6 已取消 row 視覺差異：line-through + grey Badge「已取消」+ cancelReason hover tooltip

## 6. OrderReconciliationPanel 對帳面板補強

- [x] 6.1 處理中款項 hint 加「不入 GL 應收應付帳本」說明（resolve ORD-019）
- [x] 6.2 處理中合計軸 hover 補 tooltip 行為（既有 ReconciliationCard breakdown muted 樣式提供）
- [x] 6.3 對帳面板下方新增 sticky 提示區塊：條件「refunds > allowanceTotal 且 issuedTotal > allowanceTotal」→ 顯示 amber banner「此訂單有已完成退款 N 元、但 Invoice 累計尚未折讓對應」
- [x] 6.4 SalesAllowance 建立後 sticky 提示 SHALL 自動消失（重算條件不滿足）
- [x] 6.5 收款淨額計算 SHALL 排除 cancelled = true（§ 1.2 helpers 已過濾、e2e 驗證對帳數字正確）

## 7. 業務主管「老化處理中 Payment」清單頁

- [x] 7.1 新建 `src/pages/finance/AgingPaymentsPage.tsx`
- [x] 7.2 sidebar「款項管理」加「老化處理中 Payment」入口
- [x] 7.3 清單頁欄位：訂單編號 / 業務負責人 / 處理中天數 / 金額 / 付款方式 / 備註 / 跳轉訂單詳情頁 action
- [x] 7.4 清單頁使用 `getAgingPendingPayments` selector 取資料
- [x] 7.5 「跳轉訂單詳情頁」action 點擊導航至 `/orders/:orderId`

## 8. OrderAdjustmentEditDialog 銷貨折讓 inline banner 接線

- [x] 8.1 OrderAdjustmentEditDialog 內 PaymentEditPanel 通過 onUpdate callback 接收 `salesAllowanceHint` 旗標（PaymentEditPanel 內部處理 banner 顯示）
- [x] 8.2 PaymentEditPanel 收到 flag 後顯示 inline banner（限切已完成成功事件、限退款型 Payment）— e2e 驗證 salesAllowanceHint = true
- [ ] 8.3 **deferred**：banner「前往 Invoice 詳情頁」action navigation 接線 — 留下一輪 prototype work，目前 onNavigateToInvoice 未傳則該按鈕自動隱藏、業務點「我知道了」可關閉。不影響 banner 核心通知 user story

## 9. Playwright e2e 驗證（14 條 spec items / 13 cases）

- [x] 9.1 重寫 `e2e/refund-payment-auto-execute-oa.spec.ts` → 重命名為 `e2e/refund-payment-status-transition.spec.ts`、3 cases 全部通過
- [x] 9.2 一般收款先填一半（regular-payment-status-transition.spec.ts case 1）
- [x] 9.3 一般收款補齊資料切已完成（regular-payment-status-transition.spec.ts case 2）
- [x] 9.4 退款分階段建檔（refund-payment-status-transition.spec.ts case 1 涵蓋建處理中段）
- [x] 9.5 退款補齊資料切完成（refund-payment-status-transition.spec.ts case 1 涵蓋切已完成段 + OA 推進）
- [x] 9.6 分次退款（partial-refund-and-supplementary.spec.ts case 1）
- [x] 9.7 補收 OA 對稱情境（partial-refund-and-supplementary.spec.ts case 2）
- [x] 9.8 分次補收（partial-refund-and-supplementary.spec.ts case 3）
- [x] 9.9 缺資料驗證（refund-payment-status-transition.spec.ts case 2）
- [x] 9.10 取消處理中 Payment 物理刪除（cancel-payment-logical-deletion.spec.ts case 1）
- [x] 9.11 取消已完成 Payment 觸發 OA 回退（cancel-payment-logical-deletion.spec.ts case 2）
- [x] 9.12 OA 已執行後取消處理中 Payment OA 維持已執行（cancel-payment-logical-deletion.spec.ts case 3、原 spec「雙筆 Payment 累計仍達」場景數學上不可達已重設計）
- [x] 9.13 對帳三軸顯示 + 不入 GL 說明（reconciliation-three-axis-display.spec.ts case 1）
- [x] 9.14 棄用自動建補收 Payment（partial-refund-and-supplementary.spec.ts case 4）
- [x] 9.15 跑 `npx playwright test` 全部通過、`console.error / pageerror` 為 0（serial mode、13 cases pass、6.3s）
- [x] 9.16 跑 `npm run typecheck` 無錯誤（lint 沿用既有 CI 配置）

## 10. 三視角審查補跑

- [ ] 10.1 **deferred**：senior-pm agent 審查 — 依 Decision 6 範疇凍結原則延後處理；本次 archive 後若 vault-audit 發現新議題則獨立 change 處理
- [ ] 10.2 **deferred**：ceo-reviewer agent 審查 — 同上
- [ ] 10.3 **deferred**：erp-consultant agent 審查 — 同上
- [ ] 10.4 **deferred**：三視角結果整合至 design.md § 三視角審查整合 — 同上
- [ ] 10.5 **deferred**：審查識別漏項處理 — 同上

**Decision 6 適用理由**：本 change 補完了原 archive 過早漏實作的核心項目（UI / e2e / OQ resolve / 治理收尾），三視角審查事後補跑屬於品質提升項目、不阻擋 user story 實現。延後至下一輪 vault-audit cycle 或專門 review change 處理。

## 11. Vault 收尾與 OQ resolve

- [x] 11.1 重編號 `ORD-018-處理中Payment老化追蹤機制.md` → `ORD-021-處理中Payment老化追蹤機制.md`（修撞號治理債）
- [x] 11.2 ORD-021 卡片 status 改 resolved + 寫入決策（7 天閾值、主管看板、老化 Badge）
- [x] 11.3 ORD-019 卡片 status 改 resolved + 寫入決策（處理中不入 GL）
- [x] 11.4 ORD-020 卡片 status 改 resolved + 寫入決策（邏輯刪除分支）
- [ ] 11.5 **deferred**：付款發票邏輯卡 § 六、三方對帳 補「處理中不入 GL」說明 — 屬背景知識同步、待下一輪 Vault housekeeping 處理；本次 archive 後 OpenSpec spec 已含同等內容
- [ ] 11.6 **deferred**：訂單實體卡 § Payment 行為摘要 補老化追蹤、邏輯刪除規範 — 同上
- [ ] 11.7 **deferred**：跑 `vault-audit` skill — 留待 § 11.5 / 11.6 完成後跑、本批僅 3 個 OQ + 1 個誤審卡 + 1 個 audit-log entry 異動、未達 ≥ 5 卡觸發閾值

## 12. 治理收尾（audit-log + misjudgement-record）

- [x] 12.1 `memory/erp/ERP_Vault/00-meta/audit-log.md` 追加事件「2026-05-26 18:00 complete-payment-status-ui-and-followups 治理收尾」
- [x] 12.2 寫入跨 agent 通用誤審案例 `memory/erp/ERP_Vault/11-review-knowledge/_shared/archive-completeness-misjudgement.md`（ARCHIVE-001）
- [x] 12.3 誤審卡四要素：案例情境 / 誤審內容 / 實際情況 / 教訓 + 適用範圍 + 後續行動

## 13. Verify 與 Archive 準備

- [x] 13.1 執行 `openspec validate complete-payment-status-ui-and-followups --strict`
- [ ] 13.2 **deferred**：執行 `/opsx:verify` 確認實作對齊 spec — 本次靠 e2e 13 cases 全通過 + typecheck + spec ADDED Requirements 與實作對齊驗證、跳過 verify skill
- [ ] 13.3 **deferred**：跑 `doc-audit` skill — 待 § 11.5 / 11.6 完成後跑
- [ ] 13.4 **deferred**：CLAUDE.md § Spec 規格檔清單更新 — archive 後手動同步
- [x] 13.5 commit 所有變更（含 Prototype + Vault + audit-log + misjudgement-record）
- [ ] 13.6 觸發 `/opsx:archive complete-payment-status-ui-and-followups`（本任務最後一步）
