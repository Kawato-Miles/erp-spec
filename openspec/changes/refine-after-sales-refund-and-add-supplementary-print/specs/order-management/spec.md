## MODIFIED Requirements

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止原 v1.2 「雙重身份」設計（`adjustment_phase` 欄位 + UI 「售後服務單」雙重表述）。OrderAdjustment 不再依 Order.status 自動推算 phase，所有 `adjustment_type` 皆可於任何 Order 狀態下選用（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑），無關聯售後 ticket
- **非 NULL**：源自 AfterSalesTicket 內部建立的關聯異動（退款、補印收費）

訂單已完成後（Order.status = 已完成）的售後事件改走 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。業務不再於訂單詳情頁直接建「售後服務單」OrderAdjustment，而是於 AfterSalesTicket 內部建關聯 OrderAdjustment。

OrderAdjustment SHALL 支援多筆明細項（OrderAdjustmentItem 子實體），每筆明細記錄 `item_type`（print_item / fee）、描述、金額。OrderAdjustment.amount 為所有明細金額加總（系統自動計算）。

**[本 change 新增] 編輯閘門新規則**：

OrderAdjustment 金額編輯閘門按 status 分階段：

| status | 業務可改金額？ | 改後狀態流轉 | 主管動作 |
|--------|--------------|-------------|---------|
| 草稿 | 可（不限次數）| 維持「草稿」 | 無 |
| 待主管審核 | 不可（已送出，待主管動作）| — | 主管核可 / 退回 |
| 已退回 | 可（業務修正後重送）| 改後維持「已退回」直至業務重新送出 → 進入「待主管審核」 | 業務送出後主管重新審核 |
| **已核可（本次新規）** | **可（業務退款前最後校正）** | **維持「已核可」（不需重新送審）** | 對照欄位即時顯示業務調整 |
| 已執行 | 不可（金錢已實際發生，鎖定）| — | 無 |
| 已取消 | 不可（終態）| — | 無 |

**[本 change 新增] 主管核可金額對照欄位**：

OrderAdjustment 卡片於 `status = 已核可` 時 SHALL 顯示「主管核可金額 vs 當前金額」對照欄位：

- 對照欄位內容：`主管核可金額 ${approved_amount}（{approved_at}）｜當前金額 ${current_amount}`
- 若 `current_amount ≠ approved_amount`，對照欄位 SHALL 加註「業務已調整 ${diff}」並用視覺標示（如顏色或圖示）強調
- 主管（業務主管 / Supervisor）於訂單詳情頁的異動清單 SHALL 即時看到所有「已核可」OA 的對照欄位（無需點開卡片）

**[本 change 新增] audit log 必欄位**：

OrderAdjustment 金額異動 audit log SHALL 記錄：

- `adjusted_at`：異動時間戳
- `adjusted_by`：操作者（user_id）
- `previous_amount`：異動前金額
- `new_amount`：異動後金額
- `status_at_adjustment`：異動當時的 OA status（區分「草稿改」「已退回改」「已核可改」三類）

audit log 公開於 OA 詳情頁的「活動紀錄」區，主管 SHALL 可隨時查閱。

**[本 change 變更] 「已執行」綁定機制**：

OrderAdjustment 的 `status = 已執行` 推進**不再**由業務手動點按鈕觸發。改為由「業務於 ticket 內建立關聯退款 Payment」事件**自動推進**（詳見 [Requirement: 收款記錄（Payment）](#requirement-收款記錄payment) 中的退款 Payment 建立行為）。

OrderAdjustment 卡片於 `status = 已核可` 時 SHALL 顯示「建立退款 Payment」入口（取代原「執行」按鈕），業務點擊後開啟退款 Payment 建立 dialog。

#### Scenario: 業務建立加印追加異動

- **GIVEN** 訂單 SO-001 狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁點擊「建立訂單異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、UI 標題顯示「訂單異動單」
- **AND** 業務 SHALL 可選 `adjustment_type = 加印追加`
- **AND** 業務新增明細「item_type = print_item，描述 = 加印 200 份，金額 = +20,000」
- **AND** OrderAdjustment.amount SHALL 自動加總為 +20,000
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment

- **GIVEN** AfterSalesTicket AS-001 status = 處理中、resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、預填 adjustment_type = 退印、linked_after_sales_ticket_id = AS-001
- **AND** 業務填入 amount = -5000、明細描述
- **AND** OrderAdjustment.status SHALL = 草稿，後續走原狀態機（提交審核 → 主管核可 → **業務建立退款 Payment 自動推進已執行**）

#### Scenario: 業務主管核可 OrderAdjustment

- **GIVEN** OrderAdjustment.status = 待主管審核、amount = -5000
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at、approved_amount = -5000

#### Scenario: 業務主管退回 OrderAdjustment

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務於已核可狀態調整金額（新規）

- **GIVEN** OrderAdjustment.status = 已核可、approved_amount = -5000、current_amount = -5000
- **WHEN** 業務發現實際退款金額應為 -4800（客戶談判），於 OA 卡片點擊「編輯金額」
- **THEN** 系統 SHALL 允許業務修改 current_amount = -4800
- **AND** OrderAdjustment.status SHALL 維持「已核可」（不需重新送審）
- **AND** 對照欄位 SHALL 顯示「主管核可金額 -$5,000（{approved_at}）｜當前金額 -$4,800｜業務已調整 +$200」
- **AND** audit log SHALL 記錄此異動（previous_amount = -5000, new_amount = -4800, status_at_adjustment = 已核可）

#### Scenario: 主管在訂單詳情頁看到核可金額對照

- **GIVEN** 訂單 SO-001 有 2 筆 OA（OA-A 已核可且金額被業務調整、OA-B 已核可且金額未變）
- **WHEN** 業務主管打開訂單詳情頁的異動清單
- **THEN** OA-A 對照欄位 SHALL 顯示「業務已調整 ${diff}」並用視覺強調
- **AND** OA-B 對照欄位 SHALL 顯示「核可金額 vs 當前金額一致」（無強調）

#### Scenario: 退款 Payment 建立自動推進 OA 已執行（替代原業務執行按鈕）

- **GIVEN** OrderAdjustment.status = 已核可、current_amount = -5000、linked_after_sales_ticket_id = AS-001
- **WHEN** 業務於 ticket AS-001 內點「建立退款 Payment」，填入退款日期 / 對帳附件 / 對帳備註並提交（詳見 [Requirement: 收款記錄（Payment）](#requirement-收款記錄payment) 退款 Payment 建立 dialog 規範）
- **THEN** 系統 SHALL 建立 Payment（amount = -5000, type = refund, linked_order_adjustment_id = OA.id）
- **AND** 系統 SHALL 自動將 OrderAdjustment.status 推進為「已執行」，executedAt = Payment.created_at
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動
- **AND** ticket 內部「關聯 OrderAdjustment 卡片」SHALL 顯示「已執行（透過 Payment-{payment_no} 推進）」

#### Scenario: OA 上找不到「執行」按鈕（已移除）

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務打開 OA 卡片
- **THEN** 系統 SHALL NOT 顯示「執行」按鈕（已移除，由建立退款 Payment 取代）
- **AND** 系統 SHALL 顯示「建立退款 Payment」按鈕（若 OA 是退款型即顯示此入口）

#### Scenario: 已執行 OA 鎖定金額

- **GIVEN** OrderAdjustment.status = 已執行
- **WHEN** 業務嘗試打開 OA 編輯金額
- **THEN** 系統 SHALL NOT 顯示「編輯金額」按鈕
- **AND** 金額欄位 SHALL 為唯讀（disabled）

#### Scenario: 訂單異動不阻擋主訂單推進

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

#### Scenario: 訂單異動執行後生產內容變更提示

- **GIVEN** OrderAdjustment 含 print_item 類型明細（例如加印追加、規格變更）
- **WHEN** 透過退款 Payment 建立自動推進 OA 至「已執行」（或加印型 OA 經正常路徑推進）
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 提示為非阻擋式（業務可關閉提示繼續），系統 NOT 自動建立或修改 PrintItem

---

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

**Payment polymorphic 關聯設計（本 change MODIFY refactor change 設計）**：

Payment 的關聯目標 SHALL 為 polymorphic，支援關聯 ConsultationRequest 或 Order：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `linked_entity_type` | enum: `ConsultationRequest` / `Order` | Payment 關聯的實體類型 |
| `linked_entity_id` | UUID | 依 `linked_entity_type` 指向 ConsultationRequest 或 Order 主鍵 |
| `is_transferred` | boolean | 是否已從 ConsultationRequest 轉移過至 Order（一次性轉移完成標記）|
| `original_entity_type` / `original_entity_id` | optional | 若 is_transferred = true，紀錄原始關聯（保留歷史） |

`linked_entity_type = ConsultationRequest` 僅出現在「諮詢費 webhook 自動建立的 Payment 尚未轉移至訂單」的中間態。一旦轉移至 Order（諮詢結束或需求單流失或諮詢取消觸發），`is_transferred` 設為 true，後續不可再次轉移。

`linked_entity_type = Order` 為一般情境（refactor change 原設計皆涵蓋）。

退款 Payment 的 `linked_entity_type` 一律為 `Order`（諮詢取消情境下退款 Payment 直接建在新建的諮詢訂單上）。

**[本 change 新增] 退款 Payment 對帳資料必填**：

當 Payment 的 `type = refund`（退款），系統 SHALL 強制業務於建立 dialog 內提供下列對帳資料：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `refund_date` | date | 必填 | 退款實際發生日期（業務向客戶確認的退款轉帳 / 沖帳日） |
| `reconciliation_attachment` | file[] | 必填（至少 1 個檔案）| 對帳附件：銀行轉帳憑證、對帳單截圖、客戶簽收回條等任一可佐證退款已實際發生的檔案 |
| `reconciliation_note` | text | 選填 | 對帳備註（如「客戶要求退至指定帳戶」「沖帳對應 PT-2026-0042」等） |

dialog 未通過上述必填驗證時 MUST NOT 提交。

**[本 change 新增] 退款 Payment 建立自動推進關聯 OrderAdjustment**：

當 Payment.type = refund 且 Payment.linked_order_adjustment_id 非空（建立時必填），系統 SHALL 於 Payment 建立成功的同一 transaction 內自動將該 OrderAdjustment.status 推進為「已執行」、`executedAt = Payment.created_at`。

**[本 change 新增] 退款 Payment 與 OA 資料一致性 invariant**：

系統 MUST 強制以下不變式：

- `OrderAdjustment.status = '已執行' AND adjustment_type IN (退印 / 補退) → 存在至少一筆關聯 Payment WHERE Payment.type = refund AND Payment.linked_order_adjustment_id = OA.id`
- 不存在「OA.status = '已執行' 但無關聯退款 Payment」的孤兒態
- 此 invariant 於 verify 階段 SHALL 被 Playwright 斷言檢驗

#### Scenario: 業務記錄訂金收款

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 建立 Payment 紀錄（linked_entity_type = Order、linked_entity_id = 訂單 ID）
- **AND** 業務 MUST 填入金額、付款方式、收款時間、可選填第三方付款序號

#### Scenario: 諮詢費 webhook 建立的 Payment 關聯 ConsultationRequest

- **GIVEN** webhook 觸發、ConsultationRequest 已建立
- **WHEN** 系統建立諮詢費 Payment
- **THEN** Payment.linked_entity_type SHALL = `ConsultationRequest`
- **AND** Payment.linked_entity_id SHALL = consultation_request_id
- **AND** Payment.is_transferred SHALL = false

#### Scenario: PaymentPlan 期次狀態自動更新

- **WHEN** 某 PaymentPlan 的累計 Payment 金額 = scheduled_amount
- **THEN** 系統 SHALL 自動更新 PaymentPlan.status = 已收訖

#### Scenario: 業務於 ticket 內建立退款 Payment 自動推進 OA 已執行（新規）

- **GIVEN** OrderAdjustment OA-001（status = 已核可、amount = -5000、linked_after_sales_ticket_id = AS-001、adjustment_type = 退印）
- **WHEN** 業務於 ticket AS-001 內點「建立退款 Payment」按鈕，dialog 顯示
- **AND** 業務填入 amount = -5000（預設帶 OA.amount，可微調）、refund_date = 2026-05-21、reconciliation_attachment = 銀行轉帳憑證.pdf（必填）、reconciliation_note = 「沖帳對應原訂金 Payment-0042」（選填）
- **AND** 業務點擊「提交」
- **THEN** 系統 SHALL 在同一 transaction 建立 Payment（amount = -5000, type = refund, linked_entity_type = Order, linked_entity_id = OA.order_id, linked_order_adjustment_id = OA-001.id）
- **AND** 系統 SHALL 將 OA-001.status 推進為「已執行」、executedAt = Payment.created_at
- **AND** 系統 SHALL 觸發訂單應收總額重算
- **AND** ticket AS-001 內部「關聯 OrderAdjustment 卡片」SHALL 顯示「已執行（透過 Payment-{payment_no} 推進）」

#### Scenario: 退款 Payment 缺對帳附件被擋

- **GIVEN** 業務於 ticket 內開啟「建立退款 Payment」dialog
- **WHEN** 業務填入 amount 與 refund_date 但**未上傳** reconciliation_attachment，點擊「提交」
- **THEN** 系統 SHALL 顯示驗證錯誤「對帳附件為必填」
- **AND** 系統 SHALL NOT 建立 Payment
- **AND** 系統 SHALL NOT 推進 OA 狀態

#### Scenario: OA 已執行不存在無關聯 Payment（資料一致性 invariant）

- **GIVEN** OA-001.status = 已執行、adjustment_type = 退印
- **WHEN** 任何時點透過資料層查詢 Payment WHERE linked_order_adjustment_id = OA-001.id AND type = refund
- **THEN** 結果 SHALL 至少回傳 1 筆 Payment 紀錄
- **AND** 若 0 筆，系統 SHALL 視為資料一致性錯誤並於 Playwright verify 階段失敗

## ADDED Requirements

### Requirement: 訂單詳情頁印件區「印件類型」欄位

訂單詳情頁印件區的印件表格 SHALL 新增「印件類型」欄位，呈現規範依 [prototype-shared-ui spec § 列表頁印件類型欄位通用設計](../prototype-shared-ui/spec.md)。補印與大貨印件混合排列、**不獨立分組**，靠欄位內 `PrintItemTypeLabel` 標籤識別。

訂單詳情頁印件區屬同訂單下印件總表，數量有限，**不需要 filter**（避免干擾），但欄位 MUST 顯示。

#### Scenario: 訂單詳情頁印件區三值同表呈現

- **GIVEN** 訂單 SO-001 有 4 筆印件：2 筆大貨（PI-001 / PI-002）、2 筆補印（PI-003 / PI-004，來自 AS-001）
- **WHEN** 業務 / 印務 / 主管打開 SO-001 訂單詳情頁的印件區
- **THEN** 4 筆印件 SHALL 在同一張表格內呈現（按印件編號排序）
- **AND** 每筆印件 SHALL 在「印件類型」欄位顯示對應的 `PrintItemTypeLabel`
- **AND** 補印印件 SHALL NOT 被獨立分組 / 加分隔線 / 加區塊標題
- **AND** 補印印件的標籤 SHALL 可點擊跳轉 ticket AS-001
