## ADDED Requirements

### Requirement: 請款期次（BillingInstallment）統一實體

系統 SHALL 提供「請款期次（BillingInstallment）」作為訂單應收的單一規劃實體，合併原本「付款計畫（PaymentPlan）」與「預計發票（PlannedInvoice）」雙頭維護。每筆 BillingInstallment 同時承載：應收日、預計金額、預計開票日、品項、備註、雙維度狀態（開票/收款獨立）、來源類型（source_type）、原始日期凍結基準、變更歷史。業務於訂單成立後（status = 報價待回簽 / 訂單確認）建立一筆或多筆 BillingInstallment 規劃分期請款，建立期間各期金額合計 SHALL 等於 Order.total_with_tax + Σ 已執行 OrderAdjustment.amount（補收進期次、退款不進期次的不對稱規則，違反時系統 SHALL 顯示警示但允許儲存）。

#### Scenario: 業務建立兩期請款期次（取代 PaymentPlan + PlannedInvoice 雙建立流程）

- **GIVEN** 訂單成立後總額 100000
- **WHEN** 業務點「新增請款期次」、建立 BillingInstallment(installment_no=1, description=「訂金」, scheduled_amount=30000, due_date=2026-06-01, expected_invoice_date=2026-05-15, items=[訂金品項]) + BillingInstallment(installment_no=2, description=「尾款」, scheduled_amount=70000, due_date=2026-07-01, expected_invoice_date=2026-06-30, items=[尾款品項])
- **THEN** 系統 SHALL 建立兩筆 BillingInstallment 紀錄，各自 invoicing_status = 未開立、payment_status = 未收
- **AND** 系統 MUST NOT 另外建立 PaymentPlan / PlannedInvoice 紀錄（雙實體已棄用）
- **AND** 兩筆 BillingInstallment.scheduled_amount 合計 = 100000 = Order.total_with_tax

#### Scenario: 期次合計與應收總額不符時警示但允許儲存（沿用既有 L915 規則）

- **GIVEN** 訂單總額 100000 + 已執行 OA(+5000 加印追加)，應收 = 105000
- **WHEN** 業務建立 BillingInstallment 合計只填 100000（少 5000）
- **THEN** 系統 SHALL 顯示警示「應收 105000、期次合計 100000、差額 5000」
- **AND** 系統 SHALL 允許儲存（業務後續可補建 BillingInstallment 或調整既有期次金額）

### Requirement: 期次↔發票 1:1 嚴格約束 + 一鍵開票繼承

每張 Invoice MUST 透過 `source_billing_installment_id` NOT NULL UNIQUE FK 指向唯一一筆 BillingInstallment。業務在 BillingInstallment「一鍵開票」時，系統 SHALL 建立 Invoice 並從來源期次自動繼承品項、應收日、備註；Invoice.source_billing_installment_id 寫入該期次 id、BillingInstallment.linked_invoice_id 寫入新 Invoice id、BillingInstallment.invoicing_status 推進為「已開立」。原 v1.13「業務從 PlannedInvoice 一鍵開立」入口廢止，取代為「從 BillingInstallment 一鍵開立」。

#### Scenario: 業務從期次一鍵開立發票繼承品項

- **GIVEN** BillingInstallment BI-001（scheduled_amount=30000, expected_invoice_date=2026-05-15, items=[訂金品項], invoicing_status=未開立）
- **WHEN** 業務點 BI-001「一鍵開立發票」
- **THEN** 系統 SHALL 建立 Invoice INV-001（total_amount=30000, items=深拷貝自 BI-001.items, source_billing_installment_id=BI-001.id, status=開立）
- **AND** 系統 SHALL 寫入 BI-001.linked_invoice_id = INV-001.id、BI-001.invoicing_status = 已開立
- **AND** 業務 MAY 在開立 dialog 內微調品項（不影響 BI-001.items，深拷貝原則沿用 v1.13）

#### Scenario: 期次↔發票 1:1 約束阻擋重複開票

- **GIVEN** BillingInstallment BI-002.invoicing_status = 已開立、linked_invoice_id = INV-002
- **WHEN** 業務再次點 BI-002「一鍵開立發票」
- **THEN** 系統 SHALL 隱藏「一鍵開立」按鈕（按鈕只在 invoicing_status = 未開立 / 已作廢回未開立 顯示）

### Requirement: 拆票 = 拆期（產生獨立平輩期次 + 純追溯欄位）

業務於 BillingInstallment 列表編輯動作或開立發票 Dialog 內按「拆此期」捷徑時，系統 SHALL 將原期次拆為兩個獨立平輩期次。原期次設 cancelled = true 保留稽核軌跡（不物理刪除）；兩筆新期次各自獨立 query / aggregation（無父子 hierarchical FK），但**保留** `split_from_installment_id` 純追溯欄位指向原期次 id 用於 CSV 諮詢取消半額退費 lineage 稽核與 source_type 繼承。新期次 source_type 繼承原期次（manual / consultation_cancellation 等），note 自動帶「原一期拆兩期，源期次描述：「{原 description}」」前綴。

#### Scenario: 業務在規劃階段拆票（一期 78000 拆兩張票各 2500 + 75500）

- **GIVEN** BillingInstallment BI-010（installment_no=1, scheduled_amount=78000, source_type=manual, invoicing_status=未開立）
- **WHEN** 業務於期次列表點 BI-010「拆此期」，輸入拆分規格（期A 2500 / 期B 75500，各自 due_date 業務填）
- **THEN** 系統 SHALL 建立 BillingInstallment BI-010-A（installment_no=新序號, scheduled_amount=2500, source_type=manual, split_from_installment_id=BI-010.id, note=「原一期拆兩期，源期次描述：「[原 description]」」）+ BI-010-B（scheduled_amount=75500, 同上欄位）
- **AND** 系統 SHALL 設定 BI-010.cancelled = true、cancel_reason = 「拆兩期」（保留稽核，UI 預設隱藏可切換顯示）
- **AND** 兩筆新期次 change_count 從 0 起算（拆期事件本身寫入 OrderActivityLog SPLIT 事件作為稽核依據，不計入 change_count）

#### Scenario: 業務在開票 Dialog 內動態拆票

- **GIVEN** 業務在 BI-011「一鍵開立發票」Dialog 內、客戶臨時要求拆兩張票
- **WHEN** 業務於 Dialog 內按「拆此期」捷徑、輸入兩期金額與日期
- **THEN** 系統 SHALL 執行同「規劃階段拆票」邏輯（產生 BI-011-A + BI-011-B、原期次 cancelled = true）
- **AND** Dialog SHALL 切換至「選擇對哪筆新期次開票」step、業務選定後完成開票（單一 Dialog 流程內完成拆 + 開）

### Requirement: 期次變更稽核軌跡（原始日期凍結基準 + 變更歷史 + 變更次數）

每筆 BillingInstallment SHALL 凍結 `original_due_date` 與 `original_expected_invoice_date` 兩個基準欄位（於期次首次儲存當下凍結，之後變更不影響）。每次 due_date / expected_invoice_date 變更 SHALL 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED）含 old_value / new_value / operator / timestamp。`change_count` derived field 統計該期次 due_date + expected_invoice_date 兩欄位變更累計次數（拆期事件不計入）。UI 顯示「原始 vs 現況」對照 + 變更次數，作為業務操作穩定性的事後稽核依據（沿用顧問 §1 + CEO 指標 4）。

#### Scenario: 業務修改期次預計開票日寫入變更歷史

- **GIVEN** BillingInstallment BI-020（original_due_date=2026-06-01, due_date=2026-06-01, original_expected_invoice_date=2026-05-15, expected_invoice_date=2026-05-15, change_count=0）
- **WHEN** 業務修改 BI-020.expected_invoice_date 從 2026-05-15 改為 2026-05-20
- **THEN** 系統 SHALL 寫入 OrderActivityLog EXPECTED_DATE_CHANGED 事件（old_value=2026-05-15, new_value=2026-05-20, operator=業務 user_id, timestamp=now）
- **AND** BI-020.change_count SHALL = 1
- **AND** BI-020.original_expected_invoice_date SHALL 維持 2026-05-15（凍結基準不變）
- **AND** UI 顯示「原始預計開立日：2026-05-15 ｜ 現況：2026-05-20（業務於 [日期] 調整）｜ 本期變更次數 1」

### Requirement: 期次雙維度狀態（開票維度 + 收款維度獨立）

BillingInstallment SHALL 維護兩個獨立狀態維度：
- **開票維度（invoicing_status）**：`未開立` → `已開立`（業務一鍵開票觸發）；`已開立` → `已作廢回未開立`（Invoice 作廢觸發，linked_invoice_id 設 NULL，可重新開票）
- **收款維度（payment_status，derived）**：依未取消已完成 PaymentAllocation 累計推導
  - 累計 = 0：未收
  - 0 < 累計 < scheduled_amount：部分收款
  - 累計 ≥ scheduled_amount：已收訖

兩維度完全獨立，支援「先收後開」（收款維度先到已收訖、開票維度仍未開立）與「先開後收」（開票維度先到已開立、收款維度仍未收）情境。

#### Scenario: 先收後開情境 — 業務先收訂金 30000 後再開票

- **GIVEN** BillingInstallment BI-030（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收）
- **WHEN** 業務登錄 Payment 30000、依序填滿核銷至 BI-030（PaymentAllocation.allocated_amount=30000、auto_allocated=true、業務切 Payment 為已完成）
- **THEN** BI-030.payment_status SHALL = 已收訖（payment 維度已推進）
- **AND** BI-030.invoicing_status SHALL = 未開立（開票維度仍未推進）
- **WHEN** 業務於 BI-030 點「一鍵開立發票」
- **THEN** BI-030.invoicing_status SHALL = 已開立（兩維度均推進完成）

#### Scenario: 發票作廢後期次回未開立可重新開票

- **GIVEN** BI-031.invoicing_status = 已開立、linked_invoice_id = INV-031
- **WHEN** 業務於 Invoice 詳情頁作廢 INV-031（填入作廢原因）
- **THEN** 系統 SHALL 設定 INV-031.status = 作廢
- **AND** BI-031.invoicing_status SHALL → 已作廢回未開立、linked_invoice_id 設 NULL
- **AND** BI-031.payment_status SHALL 不受影響（保留稽核）
- **AND** 業務 MAY 於 BI-031 重新點「一鍵開立發票」建立新 Invoice INV-031'

### Requirement: 收款核銷分配（PaymentAllocation 依序填滿 + 業務手動覆寫）

業務登錄一筆 Payment（amount > 0、paymentMethod ∈ 一般收款）後，系統 SHALL 自動建立 PaymentAllocation 分配明細，依「應收日（due_date）由早到晚」順序填滿至各 BillingInstallment 待收金額至 Payment.amount 用罄。每筆 PaymentAllocation 初始時 auto_allocated = true、manually_overridden = false。業務在 PaymentEditDialog 內 MAY 手動覆寫各期 allocated_amount，UI SHALL 即時校驗 sum(allocated_amount) = Payment.amount，差額時禁存檔並顯示提示。Dialog SHALL 提供「自動回填差額」按鈕將 sum 差額補至最後一期。實收 > 全部待收金額時，溢收部分 SHALL 標記為「預收（未分配）」（PaymentAllocation.billing_installment_id = NULL）。

#### Scenario: 一筆 Payment 結清頭尾兩期（依序填滿 + 系統自動分配）

- **GIVEN** 訂單兩筆未收期次：BI-040（scheduled_amount=30000, due_date=2026-06-01）+ BI-041（scheduled_amount=70000, due_date=2026-07-01）
- **WHEN** 業務登錄 Payment P-040（amount=100000, paymentMethod=銀行轉帳）並選擇結清兩期
- **THEN** 系統 SHALL 建立兩筆 PaymentAllocation：PA-040a（payment_id=P-040.id, billing_installment_id=BI-040.id, allocated_amount=30000, auto_allocated=true, manually_overridden=false）+ PA-040b（同上但 billing_installment_id=BI-041.id, allocated_amount=70000）
- **AND** 業務切 P-040 為已完成後，BI-040.payment_status 與 BI-041.payment_status SHALL 均推進至「已收訖」

#### Scenario: 不足額分配（實收 4000 < 期1 3000 + 期2 2000，依序填滿）

- **GIVEN** 訂單兩筆未收期次：BI-050（scheduled_amount=3000, due_date 早）+ BI-051（scheduled_amount=2000, due_date 晚）
- **WHEN** 業務登錄 Payment 4000 並選擇核銷兩期
- **THEN** 系統 SHALL 依序填滿：PaymentAllocation 1（billing_installment_id=BI-050.id, allocated=3000）+ PaymentAllocation 2（billing_installment_id=BI-051.id, allocated=1000）
- **AND** 業務切 Payment 為已完成後，BI-050.payment_status = 已收訖（累計達 3000）、BI-051.payment_status = 部分收款（累計 1000 < 2000）

#### Scenario: 業務手動覆寫核銷分配（diff-based 判定）

- **GIVEN** 系統依序填滿建立 PaymentAllocation 1（allocated=3000, auto_allocated=true, manually_overridden=false）+ PaymentAllocation 2（allocated=1000, 同）
- **WHEN** 業務於 PaymentEditDialog 內手動修改 PA1 為 2000 + PA2 為 2000
- **THEN** UI SHALL 即時校驗 sum = 4000 = Payment.amount（PASS）
- **AND** 業務按儲存後，PA1.manually_overridden SHALL = true（diff 後 allocated 2000 ≠ 系統填值 3000）、PA2.manually_overridden = true
- **AND** PA1.auto_allocated 維持 true（系統初次建立 flag 不變）

#### Scenario: 業務改值後又改回原值（diff-based 不算 overridden）

- **GIVEN** 系統依序填滿建立 PA1（allocated=3000）
- **WHEN** 業務點輸入框後輸入 3000（與初值相同）然後儲存
- **THEN** PA1.manually_overridden SHALL = false（diff 後 allocated 3000 = 系統填值 3000，未實際改值）

#### Scenario: 溢收標記為「預收（未分配）」桶

- **GIVEN** 訂單兩筆未收期次合計 5000，業務登錄 Payment 6000
- **WHEN** 系統依序填滿
- **THEN** 系統 SHALL 建立 PaymentAllocation 1（billing_installment_id=期1.id, allocated=3000）+ PA2（=期2.id, allocated=2000）+ PA3（billing_installment_id=NULL, allocated=1000）
- **AND** PA3 視為「預收（未分配）」桶、後續業務可手動核銷至新期次或退款處理（後續路徑見 OQ-BI-C）

### Requirement: 補收 OA（正項）跳過審核中間態直達已執行

系統 SHALL 依 amount 正負與 adjustment_type 自動判定 OA 是否需業務主管審核：補收正項 OA（amount > 0 且 adjustment_type ∈ 五項補收 type）SHALL 跳過「待主管審核」與「已核可」中間態直達「已執行」狀態（approved_by=業務 user_id、executed_at=now、應收 +N 立即認列、MUST NOT 綁 Payment 切已完成才推進）。

OrderAdjustment 新增 `requires_supervisor_approval` derived field：
- amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項} → false（補收正項）
- amount < 0 → true（退款負項，沿用 v1.13）
- adjustment_type = 諮詢取消退費（系統內生）→ false（v1.10 既有）

補收正項 OA 建立後 SHALL 跳過「待主管審核」與「已核可」中間態，直接推進至「已執行」狀態（approved_by = self/business、executed_at = now），應收 +N 立即認列。**補收 OA MUST NOT 綁 Payment 切已完成才推進已執行**（與退款 OA 對稱破壞但語意分流：補收 = 即時 +N、退款 = 必綁退款動作）。

#### Scenario: 業務建立加印追加補收 OA 立即執行

- **GIVEN** 訂單在製作中、客戶要求加印 +8000
- **WHEN** 業務建立 OA-060（amount=+8000, adjustment_type=加印追加, linked_after_sales_ticket_id=null）並點「儲存並執行」
- **THEN** 系統 SHALL 設定 OA-060.requires_supervisor_approval = false
- **AND** OA-060.status SHALL 跳過「草稿 → 待主管審核 → 已核可」直接 = 已執行（approved_by=業務 user_id, executed_at=now）
- **AND** 應收 SHALL 立即 +8000（不需等收款）
- **AND** Order 對帳檢視 SHALL 顯示警示「OA 已執行 +8000、但未對應期次規劃」+ action button「建立期次」（顧問 C-PM-2 期次規劃 invariant）
- **AND** 業務 MAY 點 action 新增 BillingInstallment（scheduled_amount=8000, source_type=manual）或併入既有未開期次

### Requirement: 補收 OA 大額閾值監督機制

當補收 OA 建立時，若 amount > 大額閾值（建議起始 50000，實際值待 OQ-BI-4 Miles 拍板）SHALL 觸發以下事後監督：
- OrderActivityLog 寫入紅色標記事件（high_amount_supplementary_charge）
- Slack 自動通知該訂單業務主管「業務 [name] 建立大額補收 OA +N 元於訂單 [order_no]」
- 業務主管 MAY 事後審查、發現異常時與業務溝通修正（不阻擋業務操作）

#### Scenario: 業務建立超閾值補收 OA 觸發 Slack 通知

- **GIVEN** 大額閾值設為 50000（系統設定值）
- **WHEN** 業務建立 OA-061（amount=+60000, adjustment_type=規格變更）並執行
- **THEN** OA-061.status SHALL = 已執行（仍立即執行、不阻擋）
- **AND** 系統 SHALL 寫入 OrderActivityLog 紅標事件 high_amount_supplementary_charge
- **AND** 系統 SHALL 透過 Slack 推送通知至業務主管：「業務 [name] 建立大額補收 OA +60000 元於訂單 [order_no]」

### Requirement: 三方對帳警示 banner（期次規劃 invariant）

訂單 SHALL 維護以下 invariant：`Order 應收 = Σ BillingInstallment.scheduled_amount where cancelled=false`。違反時對帳檢視（OrderReconciliationPanel）SHALL 顯示警示 banner「OA 已執行 N 元、但未對應期次規劃」+ action button「建立期次」，讓業務一鍵新增期次承載該補收金額。本警示為提示性質、不阻擋業務後續操作（沿用既有警示而非阻擋的設計精神）。

#### Scenario: 補收 OA 已執行但未建期次觸發警示

- **GIVEN** 訂單應收 = 印件費 100000 + OEC 0 + 已執行 OA(+8000) = 108000
- **AND** Σ BillingInstallment.scheduled_amount where cancelled=false = 100000（業務未補建期次）
- **WHEN** 業務或會計查看 OrderReconciliationPanel
- **THEN** 系統 SHALL 顯示警示 banner「OA 已執行 +8000、但未對應期次規劃（差額 8000）」
- **AND** banner SHALL 含 action button「建立期次」、點擊後開啟 BillingInstallment 新建 Dialog 預填 scheduled_amount=8000

### Requirement: 退款 OA（負項）沿用業務主管核可 + 不進期次

退款負項 OA（amount < 0）SHALL 沿用 v1.13 流程：
- requires_supervisor_approval = true
- 狀態流轉：草稿 → 待主管審核 → 已核可（業務主管核可）→ 業務於 OA 介面建退款 Payment（處理中）→ 業務補對帳附件 + paidAt 切已完成 → 累計達 OA.amount 時系統推進 OA 至「已執行」
- **退款 Payment MUST NOT 建 PaymentAllocation**（不進正向期次，沿用 v1.13 設計）
- 發票端處理（免審核，退款 OA 已核可即為批准）：
  - 未跨月：作廢原 Invoice + 重開正確金額
  - 已跨月：開立 SalesAllowance 折讓關聯原 Invoice，refund_payment_id 手動關聯退款 Payment
- BillingInstallment 不受退款影響（保留正向期次稽核歷史）

#### Scenario: 訂單已完成後售後退款 5000（透過 AfterSalesTicket）

- **GIVEN** 訂單已完成、期2 尾款 70000 已開 INV-002 已收訖
- **WHEN** 業務建立 AfterSalesTicket（responsibility=客戶投訴、resolution=退款）+ ticket 內建退款 OA-070（amount=-5000, linked_after_sales_ticket_id=ticket.id, adjustment_type=退印）並送審
- **THEN** OA-070.status = 待主管審核
- **WHEN** 業務主管核可 → OA-070.status = 已核可
- **WHEN** 業務於 OA-070 介面建退款 Payment P-070（amount=-5000, paymentMethod=退款, paymentStatus=處理中, linkedOrderAdjustmentId=OA-070.id）+ 補對帳附件 + paidAt + 切已完成
- **THEN** 系統 SHALL 推進 OA-070.status = 已執行、executedAt=now
- **AND** P-070 MUST NOT 建立 PaymentAllocation（不進正向期次）
- **AND** 應收 SHALL = -5000
- **AND** BillingInstallment 期2 仍記 payment_status = 已收訖、scheduled_amount = 70000（保留稽核歷史、不變動）

#### Scenario: 跨月退款開立折讓 + 關聯退款 Payment

- **GIVEN** OA-070 已執行、退款 Payment P-070 已完成
- **AND** INV-002（total_amount=70000, 已跨月不可作廢）
- **WHEN** 業務於 INV-002 詳情頁建立 SalesAllowance SA-070（allowance_amount=-5000, linked_invoice_id=INV-002.id, refund_payment_id=P-070.id, status=已確認）
- **THEN** INV-002 自動顯示「已部分折讓 -5000」（既有 derived 折讓衍生標籤）
- **AND** 三方對帳對齊：應收 -5000 ｜ 發票淨額 70000-5000 ｜ 收款淨額 70000-5000 = 65000

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

廢止 v1.13 spec L951「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則。**BREAKING**：BillingInstallment 變更（新增 / 修改 / 拆期 / 取消）SHALL NOT 觸發訂單回審，改為 ActivityLog 留軌跡 + change_count derived 供事後稽核。

#### Scenario: 業務修改期次日期不再觸發回審

- **GIVEN** BillingInstallment BI-080.due_date = 2026-06-01、訂單已過業務主管審核進入製作中
- **WHEN** 業務修改 BI-080.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-080.change_count SHALL = 1
- **AND** 訂單狀態 SHALL 維持「製作中」（不回退至「業務主管審核」）

### Requirement: 對帳 CSV 匯出（14 欄定稿）

會計 SHALL 可於對帳模組匯出 14 欄對帳 CSV，一列 = 一張已開立發票（status = 開立、不含作廢）。每欄資料來源：

| # | 欄位 | 來源 |
|---|------|------|
| 1 | 帳務公司 | Invoice.billing_company → BillingCompany.name |
| 2 | 發票號碼 | Invoice.invoice_number |
| 3 | 訂單編號 | Order.order_no |
| 4 | 案名 | Order.case_name |
| 5 | 開立日期 | Invoice.issued_at |
| 6 | 應收日期 | 繼承來源期次 Invoice.source_billing_installment_id → BillingInstallment.due_date（現況值，非 original） |
| 7 | 客戶名稱 | Order.customer_name |
| 8 | 總金額(含稅) | Invoice.total_amount（發票面額，不扣折讓） |
| 9 | 備註 | 繼承來源期次 BillingInstallment.note |
| 10 | 收款日期 | derived（透過 Invoice → BillingInstallment → PaymentAllocation → Payment.paidAt）|
| 11 | 收款狀態 | derived（依 BillingInstallment.payment_status 推導：未收/部分/已收訖） |
| 12 | 業務名稱 | Order.sales_id → User.name |
| 13 | 開立日期月底 | EOM(Invoice.issued_at) 計算結果 |
| 14 | 天數 | #6 - #5（應收日 − 開立日，正值代表給客戶的帳期 Net N） |

#### Scenario: 會計匯出當月對帳 CSV

- **WHEN** 會計於對帳模組點「匯出當月對帳 CSV」、選擇日期範圍 2026-05-01 ~ 2026-05-31
- **THEN** 系統 SHALL 列出所有 Invoice.status=開立 且 Invoice.issued_at IN 範圍的發票紀錄
- **AND** 每張發票一列，14 欄資料依上表填寫
- **AND** Invoice.status=作廢 的發票預設不列入（OQ-BI-G 待會計實務反饋擴充篩選 UI）
- **AND** CSV 檔案格式 UTF-8 with BOM（對應 Excel 開啟中文不亂碼）

#### Scenario: 已部分收款發票的 CSV 收款日與狀態

- **GIVEN** INV-090（total_amount=70000）已收 40000（PaymentAllocation 1 = 25000 paid_at=2026-05-10 + PaymentAllocation 2 = 15000 paid_at=2026-05-25）
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-090 對應 row 第 10 欄收款日 = 最近收款日 2026-05-25（OQ-BI-D 待 Miles 拍板「最近 vs 結清」）
- **AND** 第 11 欄收款狀態 = 部分收款

#### Scenario: 先開後收尚未收款發票的 CSV

- **GIVEN** INV-091（issued_at=2026-05-20, total_amount=50000, source_billing_installment_id=BI-091）+ BI-091.payment_status=未收
- **WHEN** 會計匯出當月 CSV
- **THEN** INV-091 對應 row 第 10 欄收款日 = 空（未收款）
- **AND** 第 11 欄收款狀態 = 未收

### Requirement: 訂單收款變更率指標（Miles 補充指標 ⑩）

系統 SHALL 統計每張訂單的「收款變更率」derived 指標，用於業務主管月會檢視業務對訂單款項操作的整體穩定性。
- **公式**：sum(訂單下所有修改事件次數) / count(訂單下總 Payment 數)
- **修改事件涵蓋**：DUE_DATE_CHANGED + EXPECTED_DATE_CHANGED + SPLIT + CANCELLED + PAYMENT_ALLOCATION_OVERRIDDEN + PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE（BILLING_INSTALLMENT_CREATED 不計入）
- **與既有 BillingInstallment.change_count 差異**：change_count 是期次層級變更頻率、本指標是訂單層級整體收款相關修改頻率（含期次 + PaymentAllocation 兩類）

#### Scenario: 計算訂單收款變更率

- **GIVEN** 訂單下 3 筆 Payment、5 個修改事件（含 2 個 DUE_DATE_CHANGED + 1 個 SPLIT + 2 個 PAYMENT_ALLOCATION_OVERRIDDEN）
- **WHEN** 系統計算訂單收款變更率
- **THEN** 變更率 = 5 / 3 = 1.67
- **AND** 健康範圍待累積實務數據後校準（暫不設警示閾值）

### Requirement: 收款逾期天數指標（Miles 補充指標 ⑪，沿用 v1.13 spec L1609）

`BillingInstallment.overdue_days` derived field SHALL 沿用 v1.13 spec L1609 既有設計：
- payment_status ≠ 已收訖 且 due_date 不為空時：overdue_days = TODAY − due_date
- payment_status = 已收訖 或 due_date 為空時：overdue_days = NULL

訂單列表頁 / 對帳檢視頁 SHALL 提供「最長逾期天數」篩選欄位（取訂單下所有未收 BillingInstallment 的 max(overdue_days)）。完整應收帳款帳齡分析表（30/60/90 天分級）+ 逾期自動通知 + 應收帳款 Dashboard 不在本 change 範疇。

#### Scenario: BillingInstallment 逾期天數自動計算

- **GIVEN** BillingInstallment BI-100.payment_status = 未收、due_date = 2026-04-01
- **WHEN** 系統於 2026-05-06 顯示 BI-100
- **THEN** BI-100.overdue_days SHALL = 35

#### Scenario: 已收訖 BillingInstallment 不算逾期

- **GIVEN** BI-101.payment_status = 已收訖、due_date = 2026-04-01
- **WHEN** 系統顯示 BI-101
- **THEN** BI-101.overdue_days SHALL = NULL

### Requirement: OrderActivityLog 擴充 7 個事件型別

OrderActivityLog SHALL 新增以下 7 個事件型別記錄 BillingInstallment 與 PaymentAllocation 的稽核軌跡：

| 事件型別 | 觸發時機 | 記錄欄位 |
|---------|---------|---------|
| BILLING_INSTALLMENT_CREATED | 新建 BillingInstallment | operator / timestamp / billing_installment_id / scheduled_amount / source_type |
| DUE_DATE_CHANGED | 修改 BillingInstallment.due_date | operator / timestamp / billing_installment_id / old_value / new_value |
| EXPECTED_DATE_CHANGED | 修改 BillingInstallment.expected_invoice_date | 同上 |
| SPLIT | 拆期（原期次 cancelled=true + 建兩筆新期次）| operator / timestamp / original_installment_id / new_installment_ids[] / split_spec |
| CANCELLED | 期次取消（cancelled = true）| operator / timestamp / billing_installment_id / cancel_reason |
| PAYMENT_ALLOCATION_OVERRIDDEN | 業務手動覆寫 PaymentAllocation（diff-based） | operator / timestamp / payment_allocation_id / old_allocated / new_allocated |
| PAYMENT_ALLOCATION_ADJUSTED_AFTER_COMPLETE | Payment 切已完成後業務調整 PaymentAllocation（CEO Challenge 4） | operator / timestamp / payment_allocation_id / payment_id / old_allocated / new_allocated |

#### Scenario: 拆期觸發 SPLIT 事件 + 兩個 BILLING_INSTALLMENT_CREATED 事件

- **WHEN** 業務拆 BI-110 為 BI-110-A + BI-110-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件（original_installment_id=BI-110.id, new_installment_ids=[BI-110-A.id, BI-110-B.id], split_spec=「2500/75500 各自 due_date」）
- **AND** 系統 SHALL 寫入兩筆 BILLING_INSTALLMENT_CREATED 事件（各新期次一筆）

### Requirement: 付款計畫建立（PaymentPlan）— 廢止改為 BillingInstallment

系統 SHALL 廢止 v1.13「付款計畫建立（PaymentPlan）」Requirement 全文，由 ADDED「請款期次（BillingInstallment）統一實體」Requirement 完整取代。

**BREAKING**：v1.13 「付款計畫建立（PaymentPlan）」Requirement 全文廢止，由 ADDED「請款期次（BillingInstallment）統一實體」Requirement 取代。

**Migration**：Prototype 階段直接移除 `src/types/payment.ts` 內 PaymentPlan 型別與相關 helper（derivePlanStatus / calcPlanCollectedAmount）。既有 mockPaymentPlans 一次性 backfill 為 BillingInstallment（依 design.md § Migration Plan）。

#### Scenario: PaymentPlan 型別於 cutover 完成後從程式碼移除

- **GIVEN** v1.13 既有 PaymentPlan 型別於 src/types/payment.ts 與 MOCK_PAYMENT_PLANS
- **WHEN** v1.14 完整 cutover 完成（follow-up change `remove-legacy-payment-plan-planned-invoice-junction` 處理）
- **THEN** Prototype SHALL 移除 PaymentPlan 型別與 derivePlanStatus / calcPlanCollectedAmount helper
- **AND** 既有 MOCK_PAYMENT_PLANS SHALL 一次性 backfill 為 BillingInstallment（依 design.md Migration Plan + buildBillingInstallmentsFromLegacy helper）
- **AND** 訂單建立流程 SHALL 改用 addBillingInstallment action 不再呼叫 addPaymentPlan

### Requirement: 收款記錄（Payment）— 移除 paymentPlanId 必填、改透過 PaymentAllocation 推導

系統 SHALL 沿用 v1.13 Payment 主結構，但 paymentPlanId 欄位 SHALL 不再強制必填、不再透過 Payment 直接關聯期次；Payment 與期次的關聯 SHALL 改為透過 PaymentAllocation N:M 推導。

v1.13 既有 Payment Requirement 主體沿用，但 `paymentPlanId` 欄位 **REMOVED**（不再強制必填、不再透過 Payment 直接關聯期次）。Payment 與期次的關聯改為透過 PaymentAllocation N:M 推導：sum(PaymentAllocation where payment_id = X).billing_installment_id distinct = Payment 對應的期次清單。

#### Scenario: Payment 不再有 paymentPlanId 欄位

- **WHEN** 業務建立 Payment
- **THEN** Payment 紀錄 MUST NOT 包含 paymentPlanId 欄位
- **AND** 對應期次清單 SHALL 透過 PaymentAllocation 表查詢推導

## REMOVED Requirements

### Requirement: 付款計畫變更觸發訂單回業務主管審核

**Reason**：Miles Phase 4 拍板「拆期/改期不需審核、只要留痕」，業務主管職責簡化為僅核可退款負項 OA。期次變更次數透過 CEO 指標 4 + Slack 通知主管（補收 OA 大額閾值）+ ActivityLog 完整軌跡三管道事後稽核。

**Migration**：v1.13 「付款計畫變更觸發訂單回業務主管審核」Requirement 全文廢止。Prototype store 移除「PaymentPlan 變更 → Order.status 回退至業務主管審核」邏輯。BillingInstallment 變更只寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED）。
