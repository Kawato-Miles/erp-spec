## Why

訂單模組應收帳款（AR）結構雙重困境：(1) 規劃層「付款計畫（PaymentPlan）+ 預計發票（PlannedInvoice）」雙實體高度重疊，業務在訂單成立後要分別維護兩套時程（各有日期、金額、狀態），手動同步成本高；(2) 事實層「Payment ↔ PaymentInvoice junction ↔ Invoice ↔ SalesAllowance」靠四組手動關聯串接，缺乏統一主軸，業務開票/收款後要手動勾選誰對應誰、各分攤多少。同時財務缺乏可靠的對帳 CSV 工具，月結對帳依賴 Excel 人工拼湊。

業界（NetSuite SuiteBilling / SAP Billing Schedule）以單一「Billing Schedule」管理應收，發票直接從排程生成、應收日為發票屬性；目前 SENS 設計違背此主流範式。本 change 將規劃層合併為單一「請款期次（BillingInstallment）」，事實層手動 junction 演化為 PaymentAllocation 自動分配，並新增 14 欄對帳 CSV，以「已開立發票」為主軸對齊財務月結實務。

商業背景與業務邏輯依據（必讀）：
- [探索計畫 csv-wobbly-liskov](/Users/b-f-03-029/.claude/plans/csv-wobbly-liskov.md)（13 拍板決策 + 三條操作流 + CSV 14 欄定稿）
- [Vault 業務邏輯卡目錄](../../../memory/erp/ERP_Vault/04-business-logic/)（請款 / 對帳邏輯）
- [Vault 角色責任卡目錄](../../../memory/erp/ERP_Vault/03-roles/)（業務 / 業務主管 / 諮詢 / 會計責任）
- [Vault 實體卡目錄](../../../memory/erp/ERP_Vault/05-entities/)（PaymentPlan / Invoice / Payment / SalesAllowance / OrderAdjustment 既有定義）
- [Vault 既有 OQ](../../../memory/erp/ERP_Vault/08-open-questions/)（搜尋訂單款項相關 OQ）
- [13 真實業務情境（payment-invoice-scenarios）](../../../memory/erp/payment-invoice-scenarios.md)（F1-F8 + C1-C4 + A1-A3 全要在 Acceptance Scenarios 覆蓋）

序列協作 4 階段（PM 釐清範疇 → CEO 提 9 指標 + 6 challenge → 顧問五層實作 + 7 challenge → PM 收斂匯報）已完成，13 條 challenge 全採納、9 砍掉項透明化、16 個 OQ 待裁決。Miles Phase 4 後拍板 4 個關鍵 OQ + 新增 2 個 KPI（訂單收款變更率、收款逾期天數）。

## What Changes

### 規劃層合併
- **BillingInstallment**（新實體）合併 PaymentPlan + PlannedInvoice：應收日 / 預計開票日 / 預計金額 / 品項 / 備註 + **雙維度狀態**（開票維度與收款維度獨立）+ 期次變更稽核軌跡（original 日期凍結基準 + change_count derived + ActivityLog 7 個新事件型別）
- **BREAKING**：PaymentPlan、PlannedInvoice、PaymentInvoice junction 棄用（Prototype 階段直接移除，前系統視為遷移前歷史基準）

### 期次↔發票 1:1 + 拆票=拆期
- Invoice 新增 `source_billing_installment_id` NOT NULL UNIQUE FK，期次↔發票嚴格 1:1
- 拆票 = 拆期：產生兩個獨立平輩期次，原期次 cancelled=true 保留稽核；保留 `split_from_installment_id` 純追溯欄位（非 aggregation FK；Miles 拍板）
- BillingInstallment.source_type enum 四值：`manual` / `consultation_cancellation` / `consultation_end_no_production` / `quote_lost` / `installment_split`（Miles 拍板諮詢三情境拆三個 enum 值）

### 收款核銷
- **PaymentAllocation**（新實體）取代 PaymentInvoice junction 手動勾選分攤
- 系統按 due_date 早→晚「依序填滿」自動分配（auto_allocated=true）
- 業務可手動覆寫（manually_overridden=true，diff-based 判定）+ UI 即時校驗 + 「自動回填差額」按鈕
- 溢收掛 billing_installment_id=NULL 的「預收（未分配）」桶
- `locked_by_period_close` 預設 false（月結閉檔機制延遲導入）

### 補收 / 退款不對稱
- **補收（正項，免審核）**：OA 跳過「待主管審核」中間態直達「已執行」，不綁 Payment 切已完成（修正 Phase 1 假設 4 語意錯亂）。應收 +N 立即認列 → 進請款期次（新增/併入既有）→ 走正向核銷
- **退款（負項，需業務主管核可）**：沿用 v1.13 主管核可 + 退款 Payment 切已完成累計達 OA.amount 才推進「已執行」。應收 −N → 退款 Payment + 折讓/作廢沖減已開發票，**不進正向期次**（保留稽核歷史，發票 derived 折讓標籤自動提示）
- 補收 OA 大額閾值監督（建議起始 50000）：超閾值 ActivityLog 紅標 + Slack 通知主管事後監督

### 訂單完成前後分容器
- 訂單完成前：直接建 OA
- 訂單完成後：必須先建 AfterSalesTicket，OA 在 ticket 內建立並掛 linkedAfterSalesTicketId（沿用 after-sales-ticket spec 既有設計）

### 諮詢取消半額退費連動
- 諮詢三情境（取消 / 結束不做大貨 / 需求單流失）自動建 PlannedInvoice → 改為自動建 BillingInstallment
- source_type 三值分流（consultation_cancellation / consultation_end_no_production / quote_lost）

### 異動審核簡化
- **BREAKING**：廢止「付款計畫變更觸發訂單回業務主管審核」（order-management spec L951）→ 改為不回審、留變更軌跡

### 對帳 CSV（新增 Requirement）
- 一列 = 一張已開立發票，14 欄定稿：帳務公司 / 發票號碼 / 訂單編號 / 案名 / 開立日期 / 應收日期 / 客戶名稱 / 總金額(含稅，發票面額) / 備註 / 收款日期 / 收款狀態 / 業務名稱 / 開立日期月底 / 天數(應收日−開立日)
- 應收日期 + 備註繼承來源 BillingInstallment
- 收款日期 + 收款狀態 derived（透過 PaymentAllocation 推導）

### 期次規劃 invariant + 三方對帳警示
- 新增 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`
- 違反時對帳檢視顯示警示「OA 已執行 N 元、但未對應期次規劃」+ action「建立期次」

### 觀測指標（11 個）
NSM 補強：①訂單款項操作時間中位數 ≤ 45 天 ②三方對帳差錯訂單數 ≤ 1%（限 Order.status=已完成）
營運：③建期次步數 ≥ 8 → ≤ 4 ④期次變更次數 per-installment 平均（健康 ≤ 1.5 / 警示 1.5-3 / 異常 ≥ 3）⑤手動覆寫率 ≤ 20%（diff-based） ⑥CSV 月匯出 ≥ 1、對帳完成率 ≥ 95%
模組級：⑦退款 OA 審核 SLA ≤ 8 小時 ⑧拆票路徑分佈 ⑨諮詢取消退款 ≤ 5 工作天
Miles 補充：⑩訂單收款變更率（design 階段給定義）⑪收款逾期天數（沿用 BillingInstallment.overdue_days）

### 砍掉的功能（透明化過濾決策）
跨訂單匯款對帳 / 重新報價議價單 / 多期合期開一張發票 / 既有資料 Migration / EC 同步 / Dashboard / 作廢發票列入 CSV（預設）/ 老化處理中 Payment 主管看板 / 月結閉檔批次「真鎖 PaymentAllocation」（延遲導入）

## Capabilities

### New Capabilities

無新 capability（沿用現有 spec 集合；本 change 為現有 capability 的結構性重構 + Requirement 擴充）。

### Modified Capabilities

- `order-management`：主檔最大改動。實體變更（新增 BillingInstallment + PaymentAllocation；修改 OrderAdjustment / Invoice / Payment；棄用 PaymentPlan / PlannedInvoice / PaymentInvoice junction）+ 五條操作流 Requirements（補收前後 / 退款前後 / 先收後開）+ 期次變更稽核軌跡 + 補收 OA 大額監督 + 新增 14 欄對帳 CSV 匯出 Requirement + 期次規劃 invariant + 三方對帳警示 banner
- `state-machines`：新增 BillingInstallment 雙維度狀態機 + OrderAdjustment 狀態機修訂（正項跳過「待主管審核」直達「已執行」）+ 廢止「付款計畫變更觸發回審」
- `user-roles`：業務主管職責調整（廢止付款計畫變更回審 + 僅核可退款負項 OA）+ 業務補收免審職責新增 + 會計月結 + CSV 匯出職責新增
- `business-processes`：請款 / 核銷流程新增 + 補退操作流五條（補收訂單完成前後 / 退款訂單完成前後 / 先收後開）
- `consultation-request`：諮詢三情境自動建 PlannedInvoice 改為自動建 BillingInstallment + source_type 三值分流（consultation_cancellation / consultation_end_no_production / quote_lost）
- `after-sales-ticket`：售後補收 / 退款連動對齊（ticket 內建 OA 沿用，補收進期次、退款不進期次）
- `prototype-data-store`：棄用 + 新建實體（PaymentAllocation + BillingInstallment）+ OrderActivityLog 擴充 7 個事件型別 + 核銷分配 helper（依序填滿 + 業務手動覆寫 diff 判定）+ 拆期 action（產生獨立平輩期次）+ 期次變更留痕
- `prototype-shared-ui`：BillingInstallmentListCard / BillingInstallmentEditDialog / BillingInstallmentSplitDialog / OriginalVsCurrentDateLabel（「原始 vs 現況」對照元件）/ PaymentAllocationDialog（核銷分配 UI 含即時校驗 + 自動回填差額按鈕）/ ReconciliationCsvExportDialog（14 欄匯出）

## Impact

### 影響的程式碼與資料
- Prototype 路徑：`/Users/b-f-03-029/sens-erp-prototype/src/`
  - `types/`：payment.ts / plannedInvoice.ts / invoice.ts 型別合併重構（BillingInstallment 含雙維度狀態 + 原始日期基準 + 變更歷史子結構；PaymentAllocation 含三 flag）
  - `store/useErpStore.ts`：state / selector / action 重構（核銷分配 helper、拆期 action、期次變更留痕、補收 OA 立即執行流程）
  - `components/order/`：OrderPaymentSection / OrderInvoiceSection / OrderReconciliationPanel 整合（含期次「原始 vs 現況」對照 UI、PaymentAllocation Dialog、補收 OA 立即執行 UX）
  - `pages/finance/`：PendingInvoices / Receivables 對齊 BillingInstallment + 新增「會計差錯訂單清單」入口
  - 新增對帳 CSV 匯出元件（沿用 csv 匯出機制，參見 [ORD-022 Payment csv 匯出機制](../../../memory/erp/ERP_Vault/08-open-questions/)）
  - Mock 資料 backfill：mockPaymentPlans / mockPlannedInvoices / mockInvoices / mockPaymentInvoices

### 影響的依賴
- 無新外部依賴（沿用既有 Tailwind / shadcn/ui / Recharts / Playwright）

### 影響的系統
- Notion 業務情境 DB（payment-invoice-scenarios 13 情境全部要在 user story 與 test case 補完，依 Miles 拍板「全覆蓋」）
- Notion ERP Test Case DB（13 情境 + Phase 4 新增情境 F1 預開拆退情境寫 test case）
- ERP_Vault：13 個開放 OQ 留待 propose / apply 過程依議題逐步開檔（透過 oq-manage mode B）

### 影響的角色
- 業務：學習 BillingInstallment 統一介面（取代雙實體維護）+ 補收免審直接執行 + 收款核銷分配介面
- 業務主管：廢止付款計畫變更回審 + 仍核可退款負項 OA + 監督補收 OA 大額（Slack 通知）
- 諮詢人員：諮詢取消觸發系統自動建 BillingInstallment + 後續手動「一鍵開票」
- 會計：學習 CSV 匯出 + 月結對帳閉環（Slack 通知差錯訂單）

### Acceptance Scenarios 覆蓋要求
- 13 業務情境（payment-invoice-scenarios F1-F8 + C1-C4 + A1-A3）全部覆蓋
- Phase 4 新增情境（F1 預開拆退、補收 OA 大額閾值、月結閉檔延遲導入、期次規劃 invariant 警示、原始 vs 現況對照）
- Miles 拍板「13 情境 + Phase 4 新增全覆蓋」（OQ-US-1 答案）

### 連動 spec 對齊（自動同步段落）
本 change 同步修改 7 個 main specs，由 archive 階段觸發 `doc-audit` skill 驗證跨檔案一致性。
