## ADDED Requirements

### Requirement: BillingInstallmentListCard 期次列表元件

Prototype 共用 UI SHALL 提供 `BillingInstallmentListCard` 元件，於訂單詳情頁的 OrderPaymentSection 內顯示訂單下所有未取消（cancelled=false）的 BillingInstallment：

**欄位顯示**：
- installmentNo / description / scheduledAmount
- 雙維度狀態 badge：開票維度（未開立 / 已開立 / 已作廢回未開立）+ 收款維度（未收 / 部分收款 / 已收訖）
- dueDate（含 OriginalVsCurrentDateLabel 顯示「原始 vs 現況」對照）
- expectedInvoiceDate（同上）
- changeCount（變更次數，超過 CEO 指標 4 警示閾值時紅標）
- 操作按鈕：「編輯」「拆此期」「一鍵開立發票」「取消」

**篩選 / 排序**：
- 預設依 dueDate ASC 排序
- 篩選「顯示已取消期次」toggle（預設關閉）

#### Scenario: 業務於訂單詳情頁查看期次列表

- **WHEN** 業務開啟訂單詳情頁、捲動至 OrderPaymentSection
- **THEN** 系統 SHALL 顯示 BillingInstallmentListCard 列出所有未取消期次（依 dueDate ASC）
- **AND** 每期 row 顯示雙維度狀態 badge + dueDate「原始 vs 現況」對照 + 操作按鈕

### Requirement: OriginalVsCurrentDateLabel 「原始 vs 現況」對照元件

Prototype 共用 UI SHALL 提供 `OriginalVsCurrentDateLabel` 元件，顯示期次日期欄位的「原始凍結基準 vs 現況值」對照：

**顯示邏輯**：
- 若 originalValue = currentValue：顯示「{value}」（單一日期，無對照）
- 若 originalValue ≠ currentValue：顯示「原始 {originalValue} ｜ 現況 {currentValue}（業務於 {changedAt} 調整）」（雙日期對照）
- 變更次數 ≥ 警示閾值（per-installment 平均 ≥ 1.5）：紅色標記

#### Scenario: 期次日期未調整顯示單一日期

- **GIVEN** BI-001.originalDueDate = '2026-06-01', BI-001.dueDate = '2026-06-01'
- **WHEN** UI 渲染 OriginalVsCurrentDateLabel(originalValue='2026-06-01', currentValue='2026-06-01')
- **THEN** UI SHALL 顯示「2026-06-01」（單一日期，無對照）

#### Scenario: 期次日期已調整顯示雙日期對照

- **GIVEN** BI-002.originalDueDate = '2026-06-01', BI-002.dueDate = '2026-06-15'（變更於 2026-05-20）
- **WHEN** UI 渲染 OriginalVsCurrentDateLabel
- **THEN** UI SHALL 顯示「原始 2026-06-01 ｜ 現況 2026-06-15（業務於 2026-05-20 調整）」

### Requirement: BillingInstallmentEditDialog 期次編輯 Dialog

Prototype 共用 UI SHALL 提供 `BillingInstallmentEditDialog` 元件，於建立 / 編輯 BillingInstallment 時使用：

**欄位**：
- description（必填，文字輸入）
- scheduledAmount（必填，整數，derived from items 或業務手動輸入）
- dueDate（必填，日期選擇器，含 OriginalVsCurrentDateLabel 顯示對照）
- expectedInvoiceDate（選填，日期選擇器，同上對照）
- items（InvoiceItem[]，沿用既有 InvoiceItemTable 元件）
- note（選填，多行文字）

**校驗**：
- 訂單下所有未取消期次的 scheduledAmount 合計與 Order.應收 對照、不等時顯示警示（不阻擋儲存）
- 首次儲存時自動凍結 originalDueDate / originalExpectedInvoiceDate

#### Scenario: 業務建立新期次首次儲存

- **WHEN** 業務於 Dialog 輸入 description='訂金', scheduledAmount=30000, dueDate='2026-06-01', expectedInvoiceDate='2026-05-15'
- **AND** 點「儲存」
- **THEN** Store SHALL 建立 BillingInstallment、originalDueDate / originalExpectedInvoiceDate 凍結為輸入值
- **AND** Store SHALL 寫入 OrderActivityLog BILLING_INSTALLMENT_CREATED 事件

### Requirement: BillingInstallmentSplitDialog 期次拆分 Dialog

Prototype 共用 UI SHALL 提供 `BillingInstallmentSplitDialog` 元件，於拆期時使用：

**入口**：
- 入口 A：BillingInstallmentListCard 該期 row 點「拆此期」按鈕
- 入口 B：「一鍵開立發票」Dialog 內點「拆此期」捷徑切換至此 Dialog

**欄位**：
- 原期次資訊顯示（description / scheduledAmount / dueDate / expectedInvoiceDate）唯讀
- 新期次 A（scheduledAmount 必填 / dueDate 必填 / expectedInvoiceDate 選填 / note 選填）
- 新期次 B（同上）
- 校驗：新期 A.scheduledAmount + 新期 B.scheduledAmount = 原期次.scheduledAmount

**拆期執行**：
- 原期次 cancelled = true、cancel_reason = '拆兩期'
- 兩筆新期次 splitFromInstallmentId 指向原期次 id（純追溯，非父子）
- 新期次 sourceType 繼承原期次（若原 = manual 則新 = manual；若原 = consultation_cancellation 則新繼承為 consultation_cancellation；類推）
- 新期次 note 自動帶「原一期拆兩期，源期次描述：「[原 description]」」前綴
- 新期次 changeCount 從 0 起算

#### Scenario: 業務拆期執行

- **GIVEN** BI-010（scheduledAmount=78000, sourceType=manual, description='活動小冊'）
- **WHEN** 業務於 Dialog 輸入新期A（scheduledAmount=2500, dueDate=2026-06-01）+ 新期B（scheduledAmount=75500, dueDate=2026-06-15）並點「儲存」
- **THEN** 校驗 2500 + 75500 = 78000 PASS
- **AND** Store SHALL 設定 BI-010.cancelled = true、cancel_reason = '拆兩期'
- **AND** Store SHALL 建立 BI-010-A（scheduledAmount=2500, sourceType=manual, splitFromInstallmentId=BI-010.id, note='原一期拆兩期，源期次描述：「活動小冊」'）+ BI-010-B（scheduledAmount=75500, 同欄位）
- **AND** Store SHALL 寫入 SPLIT + 兩筆 BILLING_INSTALLMENT_CREATED ActivityLog 事件

### Requirement: PaymentAllocationDialog 核銷分配 UI

Prototype 共用 UI SHALL 提供 `PaymentAllocationDialog` 元件，於業務登錄 Payment 後顯示系統依序填滿分配結果、業務 MAY 手動覆寫：

**初始狀態**：
- 系統呼叫 `allocatePaymentSequentially(orderId, paymentAmount)` 取得 PaymentAllocation 列表（auto_allocated=true）
- Dialog 顯示每筆 row：BillingInstallment 摘要（description / dueDate / 未收金額）+ 分配額輸入欄位（預填系統依序填滿值）
- 溢收部分顯示「預收（未分配）{N} 元」row、billing_installment_id=NULL

**業務互動**：
- 業務 MAY 修改任一 row.allocatedAmount
- UI SHALL 即時校驗 sum(allocatedAmount) = Payment.amount，差額時顯示提示「總和必須等於實收 {N} 元，目前差額 {diff} 元」+ 禁止儲存
- 「自動回填差額」按鈕：點擊後 helper `autoFillDifferenceToLast` 將 sum 差額補至最後一期或預收桶（業務選擇）
- 儲存後 helper `markManuallyOverriddenByDiff` 依 diff 判定 manually_overridden（最終值 ≠ 初值時 true）

#### Scenario: 業務手動覆寫核銷分配總和校驗

- **GIVEN** Dialog 顯示初值 [PA1.allocated=3000 (BI-A), PA2.allocated=1000 (BI-B)]，Payment.amount=4000
- **WHEN** 業務修改 PA1 為 2000、PA2 維持 1000
- **THEN** UI 即時校驗 sum = 3000 ≠ 4000、差額 1000、顯示提示「總和必須等於實收 4000 元，目前差額 1000 元」+ 儲存按鈕 disabled
- **WHEN** 業務按「自動回填差額」+ 選「補至 PA2（BI-B）」
- **THEN** UI SHALL 自動填入 PA2.allocated = 2000、sum = 4000 PASS、儲存按鈕 enabled

### Requirement: ReconciliationCsvExportDialog 對帳 CSV 匯出元件

Prototype 共用 UI SHALL 提供 `ReconciliationCsvExportDialog` 元件，會計於對帳模組匯出 14 欄對帳 CSV：

**Dialog 內容**：
- 日期範圍選擇（預設本月 1 日至月底）
- 帳務公司篩選（預設全部）
- 業務篩選（預設全部）
- 「包含作廢發票」toggle（預設關閉、OQ-BI-G 待擴充）
- 預覽前 5 列 14 欄資料
- 「匯出 CSV」按鈕

**匯出內容**：
- 沿用既有 csv 匯出機制（v1.12 老化處理中 Payment 主管看板 archive 後的 csv export helper）
- 編碼 UTF-8 with BOM（Excel 開啟中文不亂碼）
- 檔名格式：`對帳CSV_{帳務公司}_{日期範圍}_{匯出時點}.csv`
- 14 欄資料對齊 order-management spec § 對帳 CSV 匯出 14 欄定稿

#### Scenario: 會計匯出當月對帳 CSV

- **WHEN** 會計於對帳模組點「匯出對帳 CSV」、選擇本月日期範圍、保留其他篩選預設
- **THEN** Dialog 顯示前 5 列預覽、14 欄資料完整
- **AND** 點「匯出 CSV」後系統 SHALL 下載 CSV 檔（UTF-8 with BOM）
- **AND** 檔名含日期範圍 + 帳務公司資訊

### Requirement: OrderReconciliationPanel 三方對帳警示 banner

Prototype 共用 UI SHALL 在訂單詳情頁 OrderReconciliationPanel 內，當期次規劃 invariant 違反時顯示警示 banner：

**警示觸發**：
- invariant：`Order.應收 = Σ BillingInstallment.scheduledAmount where cancelled=false`
- 違反條件：應收 ≠ Σ scheduledAmount → 顯示警示 banner

**Banner 內容**：
- 訊息：「OA 已執行 {N} 元、但未對應期次規劃（差額 {差額} 元）」
- action button「建立期次」：點擊後開啟 BillingInstallmentEditDialog 預填 scheduledAmount = 差額

#### Scenario: 補收 OA 已執行未補建期次觸發警示

- **GIVEN** 訂單應收 108000、Σ 未取消 BillingInstallment.scheduledAmount = 100000
- **WHEN** 業務 / 會計查看 OrderReconciliationPanel
- **THEN** Panel SHALL 顯示警示 banner「OA 已執行 +8000、但未對應期次規劃（差額 8000）」
- **AND** Banner SHALL 含 action button「建立期次」
- **WHEN** 業務點 action
- **THEN** UI SHALL 開啟 BillingInstallmentEditDialog、預填 scheduledAmount = 8000

