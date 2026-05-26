## 1. Types 層擴充

- [ ] 1.1 `src/types/payment.ts` 新增欄位：Payment interface 加 `cancelled: boolean`、`cancelReason: string`、`cancelledAt: string | null`
- [ ] 1.2 `src/types/payment.ts` 修改 helpers：`calcOACompletedPaymentsTotal` 過濾 `cancelled === false`、`calcPaymentsNetAmount` 過濾 `cancelled === false`、`calcRegularPaymentsAmount` / `calcRefundsAmount` / `calcPendingPaymentsAmount` 全部過濾 cancelled
- [ ] 1.3 `src/types/payment.ts` 新增 helper：`isPaymentAging(payment, nowMs)` 判定 `paymentStatus === '處理中' && cancelled === false && (nowMs - new Date(createdAt).getTime()) > 7 * 86400000`，回傳 `{ aging: boolean, days: number }`
- [ ] 1.4 `src/types/order.ts` PaymentRecord interface 同步加三欄位（兩套並存型別）
- [ ] 1.5 執行 `npx tsc --noEmit` 確認所有 type 變動無編譯錯誤

## 2. Mock data Migration（一次性 backfill + 新增 demo）

- [ ] 2.1 `src/data/mockPayments.ts` 所有既有 Payment backfill：`cancelled: false`、`cancelReason: ''`、`cancelledAt: null`
- [ ] 2.2 新增 demo mock：1 筆「已取消」Payment 用於 cancelled toggle 顯示驗證
- [ ] 2.3 新增 demo mock：1 筆「老化 14 天處理中」Payment（createdAt = now - 14 天、paymentStatus = '處理中'）用於老化 Badge 視覺驗證
- [ ] 2.4 跑 dev server 驗證 mock data 載入不破壞既有對帳數字（cancelled = false backfill 應與 backfill 前數值一致）

## 3. Store action 改寫

- [ ] 3.1 `src/store/useErpStore.ts` `cancelPayment` 改寫：paymentStatus = '處理中' 維持物理刪除（既有）；paymentStatus = '已完成' 改為邏輯刪除（設 cancelled = true / cancelReason / cancelledAt、不從陣列移除）
- [ ] 3.2 `cancelPayment` 邏輯刪除路徑必填驗證：`options.cancelReason` 為空字串時回傳 error「取消原因為必填」、不寫入
- [ ] 3.3 `cancelPayment` 邏輯刪除後觸發 OA 回退邏輯（既有邏輯沿用、但 calcOACompletedPaymentsTotal 已加 cancelled 過濾、自然會把取消的扣除）
- [ ] 3.4 `updatePayment` 切「已完成」事件後若 paymentMethod = '退款' SHALL 回傳 `salesAllowanceHintFlag: true`（供 PaymentEditDialog 判斷是否顯示 inline banner）
- [ ] 3.5 新增 selector `getAgingPendingPayments(orders, nowMs)`：跨訂單聚合所有老化處理中 Payment（不含 cancelled = true），回傳清單供主管看板使用

## 4. PaymentEditPanel 共用元件抽出

- [ ] 4.1 新建 `src/components/order/PaymentEditPanel.tsx`，從 `OrderAdjustmentEditDialog.tsx` 內 EditPaymentPanel 抽出為獨立檔
- [ ] 4.2 PaymentEditPanel props 介面定義：`payment: PaymentRecord, onSave, onCancel, onCancelPayment, oa?: OrderAdjustment, salesAllowanceHintFlag?: boolean`
- [ ] 4.3 抽出後 OrderAdjustmentEditDialog.tsx 改 import PaymentEditPanel、確保既有行為不變
- [ ] 4.4 PaymentEditPanel 內顯示 paymentStatus 切「已完成」成功後 inline banner（限退款型）：「此筆退款已完成，若訂單有對應發票請考慮開立 SalesAllowance」+「我知道了」「前往 Invoice 詳情頁」兩個 action
- [ ] 4.5 PaymentEditPanel 內阻擋「已完成 → 處理中」反向：disabled radio + 顯示提示「請改用『取消』功能後重建新 Payment」

## 5. OrderPaymentSection UI 補完

- [ ] 5.1 `src/components/order/OrderPaymentSection.tsx` 收款紀錄列表 thead 新增「操作」column
- [ ] 5.2 列表 row 操作欄加單一「編輯」icon button（重用 Pencil icon、與 PaymentPlan row 既有按鈕風格一致）
- [ ] 5.3 「編輯」點擊行為：開啟 PaymentEditDialog（包裹 PaymentEditPanel 共用元件），傳入該 Payment 與 onSave / onCancel handlers
- [ ] 5.4 列表加「顯示已取消」toggle（位於列表 header 右側），預設不顯示 cancelled = true 的 row；toggle 開啟後顯示含 grey Badge「已取消」+ cancelReason hover tooltip 的 row
- [ ] 5.5 列表 row 顯示老化 Badge：`isPaymentAging(p, Date.now())` 為 true 時顯示 amber Badge「老化 N 天」
- [ ] 5.6 已取消 row 視覺差異：grey-500 文字 + line-through

## 6. OrderReconciliationPanel 對帳面板補強

- [ ] 6.1 `src/components/order/OrderReconciliationPanel.tsx` 處理中合計軸下方新增說明文字「不入 GL 應收應付帳本」（muted 視覺）
- [ ] 6.2 該說明文字 hover SHALL 顯示 tooltip「處理中 Payment 不影響應收應付，已完成才入帳」
- [ ] 6.3 對帳面板下方新增 sticky 提示區塊：條件判斷「至少一筆未取消已完成退款 Payment 且 Invoice 累計 - 已確認 SalesAllowance 累計 > 退款 Payment 累計絕對值」→ 顯示 amber banner「此訂單有已完成退款 N 元、但 Invoice 累計尚未折讓對應」+「前往建 SalesAllowance」action button
- [ ] 6.4 SalesAllowance 建立後 sticky 提示 SHALL 自動消失（重算條件不滿足）
- [ ] 6.5 收款淨額計算 SHALL 排除 cancelled = true（依 § 1.2 helpers 已過濾、本任務驗證對帳數字正確）

## 7. 業務主管「老化處理中 Payment」清單頁

- [ ] 7.1 新建 `src/pages/AgingPaymentsPage.tsx` 業務主管清單頁
- [ ] 7.2 sidebar（業務主管 / 諮詢主管 / supervisor role）新增「老化處理中 Payment」入口、含數字徽章顯示老化筆數
- [ ] 7.3 清單頁欄位（採 QuoteListPage 範式 B）：訂單編號 / 業務負責人 / 處理中天數（DESC 預設排序）/ 金額 / paymentMethod / 對應 OA 連結（若有）/「跳轉訂單詳情頁」action
- [ ] 7.4 清單頁使用 `getAgingPendingPayments` selector 取資料、即時計算天數
- [ ] 7.5 「跳轉訂單詳情頁」action SHALL 開新分頁至 `/orders/:orderId` 並滾動到 OrderPaymentSection（hash / scroll target）

## 8. OrderAdjustmentEditDialog 銷貨折讓 inline banner 接線

- [ ] 8.1 OrderAdjustmentEditDialog 內呼叫 updatePayment 後接收 `salesAllowanceHintFlag` 旗標、傳入 PaymentEditPanel
- [ ] 8.2 PaymentEditPanel 收到 flag 後顯示 inline banner（限切已完成成功事件、限退款型 Payment）
- [ ] 8.3 banner「前往 Invoice 詳情頁」action 點擊 SHALL 開新分頁至訂單詳情頁 Invoice Tab、滾動到對應 Invoice row

## 9. Playwright e2e 驗證（14 條）

- [ ] 9.1 重寫 `e2e/refund-payment-auto-execute-oa.spec.ts` → 重命名為 `e2e/refund-payment-status-transition.spec.ts`：補 updatePayment 切已完成步驟、對齊新 spec、三案例全部通過
- [ ] 9.2 新增 e2e：一般收款先填一半（新增收款只填 amount → 儲存處理中 → 列表出現處理中 row → 對帳收款淨額不變）
- [ ] 9.3 新增 e2e：一般收款補齊資料（OrderPaymentSection row 點編輯 → 補 paidAt + attachments → 切已完成 → 通過驗證 → 對帳收款淨額增加）
- [ ] 9.4 新增 e2e：退款分階段建檔（售後 ticket → OA Table → 編輯 OA → 新增 Payment 只填 amount → 儲存處理中 → OA 維持已核可）
- [ ] 9.5 新增 e2e：退款補齊資料切完成（補 paidAt / attachments → 切已完成 → 累計達 OA.amount → OA 自動推進已執行 + 退款 inline banner 顯示）
- [ ] 9.6 新增 e2e：分次退款（OA -10000 → 建兩筆退款 Payment 各 -5000 處理中 → 補第一筆切已完成 OA 維持已核可 → 補第二筆切已完成 OA 推進已執行）
- [ ] 9.7 新增 e2e：補收 OA 對稱情境（加印追加 +20000 → 主管核可 → OA 編輯介面建補收 Payment 處理中 → 補齊切已完成 → OA 推進已執行）
- [ ] 9.8 新增 e2e：分次補收（補收 OA +5000 → 兩筆 +2500 處理中 → 補第一筆切已完成維持已核可 → 補第二筆切已完成推進已執行）
- [ ] 9.9 新增 e2e：缺資料驗證（未補 paidAt / attachments 直接切已完成 → 系統擋下 + 錯誤訊息）
- [ ] 9.10 新增 e2e：取消處理中 Payment（物理刪除 → OA 不動）
- [ ] 9.11 新增 e2e：取消已完成 Payment 觸發 OA 回退（邏輯刪除 + 累計不再達 OA.amount → OA 回退已核可 → 對帳淨額恢復 + cancelled badge 顯示）
- [ ] 9.12 新增 e2e：取消已完成 Payment 但累計仍達 OA.amount（雙筆 Payment 情境，OA 維持已執行）
- [ ] 9.13 新增 e2e：對帳三軸顯示（對帳面板顯示三軸「已完成一般收款 / 已完成退款 / 處理中（合計）」+ 差額 hint + 處理中軸下方「不入 GL」說明）
- [ ] 9.14 新增 e2e：銷貨折讓 sticky 提示（建已完成退款 → 訂單詳情頁刷新 → 對帳面板下方 sticky 提示出現 → 建 SalesAllowance → 刷新 → sticky 消失）
- [ ] 9.15 跑 `npx playwright test` 全部通過、`console.error / pageerror` 為 0
- [ ] 9.16 跑 `npm run typecheck` + `npm run lint` 無錯誤

## 10. 三視角審查補跑

- [ ] 10.1 觸發 `senior-pm` agent 審查（specs + design + 既有實作 + 本次補完設計，依 [[multi-agent-discussion-protocol]] 與 review-loading-checklist）
- [ ] 10.2 觸發 `ceo-reviewer` agent 審查（KPI 對齊 + 商業合理性，含「處理中 Payment 老化率」KPI 加入 KPI DB 建議）
- [ ] 10.3 觸發 `erp-consultant` agent 審查（5 個資料模型設計模式對照、Payment 邏輯刪除設計是否符合業界 ERP 慣例、系統一致性）
- [ ] 10.4 三視角結果整合至 design.md § 三視角審查整合
- [ ] 10.5 若審查識別 ≤ 2 個新 Requirement 微小漏項 → 補入本 change spec deltas + 重新 verify；若 > 2 個 → 凍結本 change 範疇、獨立開新 change 處理

## 11. Vault 收尾與 OQ resolve

- [ ] 11.1 重編號 `memory/erp/ERP_Vault/08-open-questions/ORD-018-處理中Payment老化追蹤機制.md` → `ORD-021-處理中Payment老化追蹤機制.md`（修正撞號）
- [ ] 11.2 ORD-021 卡片內容更新：status 改 resolved + 寫入決策（7 天閾值 + 主管看板 + 老化 Badge）
- [ ] 11.3 更新 `memory/erp/ERP_Vault/08-open-questions/ORD-019-會計處理中Payment應收應付處理.md`：status 改 resolved + 寫入決策（不入 GL + 對帳面板資訊軸 + 「不入 GL」說明）
- [ ] 11.4 更新 `memory/erp/ERP_Vault/08-open-questions/ORD-020-取消已完成Payment邏輯刪除vs物理刪除.md`：status 改 resolved + 寫入決策（已完成邏輯刪除、處理中物理刪除）
- [ ] 11.5 更新 `memory/erp/ERP_Vault/05-entities/訂單.md` § Payment 行為摘要：補老化追蹤、邏輯刪除規範
- [ ] 11.6 更新 `memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md` § 六、三方對帳：補「處理中不入 GL」說明
- [ ] 11.7 跑 `vault-audit` skill（≥ 5 個 Vault 卡異動觸發）

## 12. 治理收尾（audit-log + misjudgement-record）

- [ ] 12.1 `memory/erp/ERP_Vault/00-meta/audit-log.md` 追加事件：「2026-05-22 add-payment-status-and-decouple-oa-execution archive 過早漏實作」（描述漏項：§ 4.4 編輯入口 / § 9 弱提示 / § 10 14 條 e2e / § 12 三視角審查，本 change resolve 範疇）
- [ ] 12.2 觸發 `misjudgement-record` skill mode B 寫入跨 agent 通用誤審案例：「OpenSpec change 主動 archive 但 tasks.md 含未勾選核心實作項」（四要素：案例情境 / 誤審內容 / 實際情況 / 教訓）
- [ ] 12.3 寫入 `memory/erp/ERP_Vault/11-review-knowledge/_shared/` 對應誤審卡（依 misjudgement-record 規範決定具體檔名）

## 13. Verify 與 Archive 準備

- [ ] 13.1 執行 `openspec validate complete-payment-status-ui-and-followups --strict`
- [ ] 13.2 執行 `/opsx:verify complete-payment-status-ui-and-followups` 確認實作對齊 spec
- [ ] 13.3 跑 `doc-audit` skill 檢查跨檔案一致性（state-machines / business-processes / order-management 三 spec 描述對齊）
- [ ] 13.4 更新 CLAUDE.md § Spec 規格檔清單：order-management spec 加註本 change archive 後版本變動
- [ ] 13.5 commit 所有變更（含 Prototype + Vault + audit-log + misjudgement-record）
- [ ] 13.6 觸發 `/opsx:archive complete-payment-status-ui-and-followups`
