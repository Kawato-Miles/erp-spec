## MODIFIED Requirements

### Requirement: 收款記錄（Payment）

業務 / 諮詢 SHALL 可於訂單詳情頁建立收款紀錄，每筆 Payment 紀錄關聯（可選）一個 PaymentPlan 期次與金額、收款方式、第三方付款序號、收款時間。允許不關聯 PaymentPlan 的臨時收款（如預收款）。

**Payment polymorphic 關聯設計（沿用 refactor change）**：

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

**[本 change 新增] Payment 狀態欄通用化（一般收款 + 退款 + 補收同邏輯）**：

Payment SHALL 新增 `paymentStatus` 欄位：

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `paymentStatus` | enum: `處理中` / `已完成` | 必填 | 新建預設 `處理中`；業務手動切「已完成」表示款項實際發生且對帳資料齊備 |
| `completedAt` | timestamp | nullable | 業務切「已完成」時系統寫入；切回「處理中」禁止（見修正路徑）|

`paymentStatus` 適用所有 paymentMethod（一般收款 / 退款 / 補收皆同邏輯），不分情境。

**Invariant**：

- 新建 Payment MUST 帶 `paymentStatus`（不可為 null）
- 既有資料 Migration：所有歷史 Payment backfill `paymentStatus = '已完成'`、`completedAt = createdAt`（過去設計即為「建立 = 完成」）
- `paymentStatus = '已完成' → completedAt 必為非 null timestamp`

**[本 change 修訂] paidAt 欄位語意通用化**：

`paidAt` 欄位語意明文化為「款項實際完成日」，所有 Payment（一般收款 / 退款 / 補收）共用此欄位：

- 處理中 Payment：paidAt 可空（業務尚未確認實際完成日）
- 已完成 Payment：paidAt 必填（業務確認的實際匯款 / 沖帳日）

棄用既有「退款情境另用 refundDate」雙軌語意（spec L875 既有設計），統一用 paidAt。types/payment.ts L77 既有註解已暗示通用語意，本 change 正式統一。

**[本 change 修訂] 對帳附件（attachments）切「已完成」時必填**：

切「已完成」時 attachments 必填 ≥ 1 個檔案，規則從 refine-after-sales-refund 既有「退款專用」擴及所有 Payment：

| 欄位 | 處理中（建立 / 編輯時）| 已完成（切換時驗證）|
|------|----------------------|---------------------|
| amount | 必填、非 0 | 鎖定（不可改）|
| paymentMethod | 必填 | 鎖定 |
| paidAt（款項實際完成日）| 選填 | 必填（所有 Payment 適用）|
| attachments | 選填 | 必填 ≥ 1（所有 Payment 適用，作為款項實際發生的事實依據）|
| linkedOrderAdjustmentId | 從 OA 入口建：必填、symbol(amount) = symbol(OA.amount)；從 OrderPaymentSection 建一般收款：null | 同處理中 |
| paymentRef | 選填 | 選填 |
| notes / reconciliation_note | 選填 | 選填 |

切「已完成」未通過上述必填驗證時 MUST NOT 通過儲存。

**[本 change 新增] linkedOrderAdjustmentId 必填規則對稱化**：

從 OA 編輯介面建立的 Payment（不論退款 / 補收）：

- linkedOrderAdjustmentId 必填 = OA.id
- amount 符號必須與 OA.amount 同方向（退款 OA amount < 0 → Payment amount ≤ 0；補收 OA amount > 0 → Payment amount ≥ 0）

從 OrderPaymentSection 入口建立的一般收款 Payment：linkedOrderAdjustmentId 可空（一般收款 / 臨時預收沿用 spec L850 既有設計）。

退款 / 補收 Payment SHALL NOT 從 OrderPaymentSection 直接建立（保留 OA 審核流程的權威性）；要建退款 / 補收 Payment 必須走 OA 編輯介面入口。

**[本 change MODIFY refine-after-sales-refund] 退款 / 補收 Payment 切「已完成」自動推進關聯 OrderAdjustment**：

當 Payment 滿足以下條件時，系統 SHALL 同 transaction 推進關聯 OA 狀態：

- Payment.linkedOrderAdjustmentId 非空
- Payment.paymentStatus 從 '處理中' 切換為 '已完成'
- 對應 OA 的所有已完成 Payment 累計 amount（含符號比較）= OA.amount

推進動作：OrderAdjustment.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點。

注意：「建立退款 Payment 即推進 OA 已執行」既有設計（spec L883）已 MODIFY 為「Payment 切已完成累計達 OA.amount 才推進」。建立處理中 Payment 不影響 OA 狀態。

**[本 change MODIFY] 退款 / 補收 Payment 與 OA 資料一致性 invariant**：

系統 MUST 強制以下不變式：

- `OrderAdjustment.status = '已執行' AND linkedAfterSalesTicketId 任意 → 存在至少一筆關聯 Payment WHERE Payment.linkedOrderAdjustmentId = OA.id AND Payment.paymentStatus = '已完成'，且所有已完成 Payment 累計 amount = OA.amount（含符號比較）`
- 既有 invariant「OA 已執行 → 必有關聯退款 Payment」MODIFY 為「OA 已執行 → 必有關聯已完成 Payment 累計達 OA.amount」（涵蓋退款 + 補收兩類）
- 此 invariant 於 verify 階段 SHALL 被 Playwright 斷言檢驗

#### Scenario: 業務記錄訂金收款（一般收款，預設處理中）

- **WHEN** 客戶轉帳訂金 30,000，業務於訂單詳情頁點擊「新增收款」
- **THEN** 系統 SHALL 開啟 Payment 建立 dialog
- **AND** 業務 MUST 填入 amount = +30000、paymentMethod = '銀行轉帳'、paymentPlanId（選擇對應期次）
- **AND** 業務可選填 paidAt 與 attachments（處理中態可缺）
- **AND** 業務點擊「儲存」後系統 SHALL 建立 Payment（paymentStatus = '處理中'）
- **AND** Payment 出現在收款列表標「處理中」狀態 badge

#### Scenario: 業務先填一半再補齊資料切已完成

- **GIVEN** 業務先建一筆處理中 Payment P-007（amount = +30000, paymentMethod = '銀行轉帳', paidAt = null, attachments = []）
- **WHEN** 業務於後續日子收到銀行對帳單，於收款列表點 P-007「編輯」開啟 dialog，補入 paidAt = 2026-05-25、上傳對帳單.pdf、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過必填驗證（paidAt 與 attachments 已齊）
- **AND** 系統 SHALL 寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 對帳收款淨額 SHALL 增加 +30000（之前處理中不計入，現在計入）
- **AND** 若該 Payment 對應 PaymentPlan 期次，期次累計可能達 scheduledAmount → status 變「已收訖」

#### Scenario: 業務未補齊資料直接切已完成被擋

- **GIVEN** 業務開啟處理中 Payment P-008 編輯 dialog（attachments = []）
- **WHEN** 業務直接切換 paymentStatus → '已完成' 並點擊「儲存」
- **THEN** 系統 SHALL 顯示驗證錯誤「對帳附件為必填（至少 1 個）」「款項實際完成日為必填」
- **AND** 系統 SHALL NOT 寫入 paymentStatus = '已完成'
- **AND** Payment 維持 paymentStatus = '處理中'

#### Scenario: 諮詢費 webhook 建立的 Payment 預設已完成（既有自動化流程）

- **GIVEN** webhook 觸發、ConsultationRequest 已建立
- **WHEN** 系統建立諮詢費 Payment
- **THEN** Payment.linked_entity_type SHALL = `ConsultationRequest`
- **AND** Payment.linked_entity_id SHALL = consultation_request_id
- **AND** Payment.is_transferred SHALL = false
- **AND** Payment.paymentStatus SHALL = '已完成'（webhook 觸發代表金流已實際發生，不需業務手動切）
- **AND** Payment.completedAt SHALL = webhook 觸發時點

#### Scenario: PaymentPlan 期次狀態僅累計已完成 Payment

- **GIVEN** PaymentPlan PP-001（scheduledAmount = 30000, status = '未收'）
- **AND** 對應一筆處理中 Payment（amount = +30000, paymentStatus = '處理中', paymentPlanId = PP-001.id）
- **WHEN** 系統推導 PP-001.status
- **THEN** 系統 SHALL 過濾 paymentStatus = '已完成' 的 Payment 累計（此時 = 0）
- **AND** PP-001.status SHALL 維持「未收」（處理中 Payment 不影響期次狀態）

#### Scenario: 業務於 OA 編輯介面建立退款 Payment（處理中，OA 不動）

- **GIVEN** OrderAdjustment OA-001（status = 已核可、amount = -5000、linkedAfterSalesTicketId = AS-001、adjustment_type = 退印）
- **WHEN** 業務於 OA-001 編輯 dialog 內點「新增 Payment」按鈕（OA 退款型自動預填 paymentMethod = '退款'）、填入 amount = -5000、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-001.id, linked_entity_type = Order, linked_entity_id = OA-001.order_id）
- **AND** OA-001.status SHALL 維持「已核可」（建立處理中 Payment 不推進 OA）
- **AND** 對帳收款淨額不變（處理中 Payment 不計入）

#### Scenario: 業務切退款 Payment 已完成自動推進 OA

- **GIVEN** OA-001 已有處理中 Payment P-001（amount = -5000）
- **WHEN** 業務於 OA-001 編輯 dialog 點 P-001 row「編輯」、補 paidAt = 2026-05-21、上傳銀行轉帳憑證.pdf、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-001.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-001 對應已完成 Payment 累計 = -5000 = OA-001.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-001.status → '已執行'、executedAt = now
- **AND** 系統 SHALL 觸發訂單應收總額重算
- **AND** OA 編輯介面 SHALL 顯示「已執行（透過 Payment P-001 推進）」

#### Scenario: 補收 OA 對稱化建立 + 切已完成自動推進（新規）

- **GIVEN** 訂單期間客戶要求加印，業務建立 OrderAdjustment OA-002（amount = +20000, adjustment_type = 加印追加, status = 已核可）
- **WHEN** 業務於 OA-002 編輯 dialog 內點「新增 Payment」（OA 補收型自動預填 paymentMethod 為非「退款」項）、填入 amount = +20000、paymentMethod = '銀行轉帳'、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment P-002（amount = +20000, paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **AND** OA-002.status SHALL 維持「已核可」
- **WHEN** 客戶實際匯款後，業務於 P-002 補 paidAt、上傳轉帳憑證、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 重算 OA-002 對應已完成 Payment 累計 = +20000 = OA-002.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-002.status → '已執行'、executedAt = now

#### Scenario: 退款 / 補收 Payment 不允許從 OrderPaymentSection 入口建立

- **GIVEN** 業務於訂單詳情頁 OrderPaymentSection 點「新增收款」
- **WHEN** dialog 顯示
- **THEN** paymentMethod 下拉選單 SHALL NOT 包含「退款」選項
- **AND** dialog SHALL NOT 提供 linkedOrderAdjustmentId 欄位
- **AND** 業務若要建退款 / 補收 Payment SHALL 從 OA 編輯介面入口建立（保留 OA 審核流程的權威性）

### Requirement: 付款計畫建立（PaymentPlan）

業務 / 諮詢 SHALL 於訂單成立後（狀態 = 報價待回簽 或 訂單確認）建立付款計畫，定義一個訂單分成 N 期收款的金額與時程。每筆 PaymentPlan 紀錄期別、描述、預定金額、預計收款日。

`PaymentPlan.scheduled_date` SHALL 為必填欄位，避免追款篩選遺漏。

建立時各期金額合計 MUST = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)；若不等系統 SHALL 顯示差額提示。

**[本 change 修訂] PaymentPlan.status 推導機制**：

`PaymentPlan.status`（未收 / 部分收款 / 已收訖）SHALL 依「對應 PaymentPlan 且 paymentStatus = '已完成'」的 Payment 累計推導：

- 累計 ≤ 0：status = '未收'
- 0 < 累計 < scheduledAmount：status = '部分收款'
- 累計 ≥ scheduledAmount：status = '已收訖'

處理中 Payment 不影響期次狀態（避免「業務先填一半就讓期次跳『已收訖』」的虛假狀態）。

#### Scenario: 業務建立兩期付款計畫

- **GIVEN** 訂單成立後總額 100,000
- **WHEN** 業務建立 PaymentPlan 訂金 30,000、尾款 70,000，並各填入 scheduled_date
- **THEN** 系統 SHALL 建立兩筆 PaymentPlan 紀錄（installment_no = 1, 2）

#### Scenario: 付款計畫合計與應收總額不符的提示

- **WHEN** 業務建立 PaymentPlan 各期合計 ≠ Order.total_with_tax + ∑(OrderAdjustment.amount)
- **THEN** 系統 SHALL 顯示「差額 X 元」提示，仍允許儲存

#### Scenario: 缺漏 scheduled_date 無法儲存

- **WHEN** 業務建立 PaymentPlan 未填入 scheduled_date
- **THEN** 系統 SHALL 阻擋儲存並提示「預計收款日為必填」

#### Scenario: PaymentPlan 期次狀態僅累計已完成 Payment

- **GIVEN** PaymentPlan PP-010（scheduledAmount = 50000, status 推導前 = '未收'）
- **AND** 兩筆對應 Payment：P-010a（amount = +30000, paymentStatus = '已完成', paymentPlanId = PP-010.id）+ P-010b（amount = +20000, paymentStatus = '處理中', paymentPlanId = PP-010.id）
- **WHEN** 系統推導 PP-010.status
- **THEN** 系統 SHALL 累計已完成 Payment = 30000
- **AND** 30000 < 50000 → status = '部分收款'（非「已收訖」，因 P-010b 處理中不計入）

### Requirement: 訂單異動（OrderAdjustment）建立與審核

業務 / 諮詢 SHALL 可於訂單詳情頁建立訂單異動，記錄訂單成立後因規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 其他原因導致的金額異動（可正可負）。OrderAdjustment 有獨立狀態機（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消，詳見 [state-machines spec](../state-machines/spec.md)），不影響主訂單狀態。OrderAdjustment「已執行」時觸發應收總額更新，但 PaymentPlan SHALL NOT 自動變動，由業務手動調整。

**OrderAdjustment 回歸純金額異動載具**：本 change（add-after-sales-ticket）廢止原 v1.2 「雙重身份」設計（`adjustment_phase` 欄位 + UI 「售後服務單」雙重表述）。OrderAdjustment 不再依 Order.status 自動推算 phase，所有 `adjustment_type` 皆可於任何 Order 狀態下選用（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑），無關聯售後 ticket
- **非 NULL**：源自 AfterSalesTicket 內部建立的關聯異動（退款、補印收費）

訂單已完成後（Order.status = 已完成）的售後事件改走 AfterSalesTicket（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。業務不再於訂單詳情頁直接建「售後服務單」OrderAdjustment，而是於 AfterSalesTicket 內部建關聯 OrderAdjustment。

OrderAdjustment SHALL 支援多筆明細項（OrderAdjustmentItem 子實體），每筆明細記錄 `item_type`（print_item / fee）、描述、金額。OrderAdjustment.amount 為所有明細金額加總（系統自動計算）。

**[refine-after-sales-refund 既有] 編輯閘門規則**（不動）：

OrderAdjustment 金額編輯閘門按 status 分階段：

| status | 業務可改金額？ | 改後狀態流轉 | 主管動作 |
|--------|--------------|-------------|---------|
| 草稿 | 可（不限次數）| 維持「草稿」 | 無 |
| 待主管審核 | 不可（已送出，待主管動作）| — | 主管核可 / 退回 |
| 已退回 | 可（業務修正後重送）| 改後維持「已退回」直至業務重新送出 → 進入「待主管審核」 | 業務送出後主管重新審核 |
| 已核可 | 可（業務退款前最後校正）| 維持「已核可」（不需重新送審）| 對照欄位即時顯示業務調整 |
| 已執行 | 不可（金錢已實際發生，鎖定）| — | 無 |
| 已取消 | 不可（終態）| — | 無 |

**[refine-after-sales-refund 既有] 主管核可金額對照欄位 + audit log 必欄位**（不動）：

OrderAdjustment 卡片於 `status = 已核可` 時 SHALL 顯示「主管核可金額 vs 當前金額」對照欄位（沿用 refine-after-sales-refund 設計）；金額異動 audit log 必欄位（adjusted_at / adjusted_by / previous_amount / new_amount / status_at_adjustment）沿用。

**[本 change 變更] 「已執行」推進機制 — 從「建立 Payment 自動推進」改為「Payment 切已完成累計達 OA.amount 自動推進」**：

OrderAdjustment 的 `status = 已執行` 推進條件 MODIFY 為：

- 觸發事件：任一關聯 Payment（linkedOrderAdjustmentId = OA.id）從 paymentStatus = '處理中' 切為 '已完成'
- 推進條件：對應 OA 的所有已完成 Payment 累計 amount（含符號比較）= OA.amount
- 推進動作：同 transaction 將 OA.status → '已執行'、executedAt = 該 Payment 切「已完成」的時點

對稱適用退款 OA（amount < 0，配對 paymentMethod = '退款' 的負值 Payment）與補收 OA（amount > 0，配對 paymentMethod ≠ '退款' 的正值 Payment）。詳見 [state-machines spec § 訂單異動狀態機](../state-machines/spec.md)。

**[本 change BREAKING] 棄用「執行 OA 自動建補收 Payment」既有設計**：

既有 spec 對補收 OA（如加印追加 / 加運費 / 急件費）的處理流程（L1719「OrderAdjustment 經核可並執行後系統 SHALL 同步更新 PrintItem.ordered_qty 並建立補收 Payment」、L1734「系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）」）SHALL 廢止。

新設計：所有 OA（退款 + 補收）核可後，由業務於 OA 編輯介面手動建立關聯 Payment（處理中態），補齊資料切「已完成」後自動推進 OA「已執行」。兩條路徑完全對稱。

**Migration 影響**：既有實作中若有「OA 已執行自動建 Payment」邏輯 MUST 移除，相關 UI（如加印追加流程的提示）改為「業務應至 OA 編輯介面建立補收 Payment」。

**[本 change 新增] OA 編輯介面入口（取代既有「建立退款 Payment」按鈕）**：

OrderAdjustment 卡片 / Table row 點「編輯」開啟 OA 編輯 dialog，dialog 內結構：

- 上半：OA 欄位（adjustmentType / amount / reason）依 OA.status 決定可改否
- 下半：關聯 Payment 列表（Table，列出 linkedOrderAdjustmentId = OA.id 的所有 Payment、含 paymentStatus 與金額顯示）
- 下半底部：「新增 Payment」button（僅 OA.status = '已核可' 時可用）
  - OA 為退款型（amount < 0）：自動預填 paymentMethod = '退款'、amount 必須 ≤ 0
  - OA 為補收型（amount > 0）：自動預填 paymentMethod 為非「退款」項（如「銀行轉帳」）、amount 必須 ≥ 0
- 每筆關聯 Payment row 操作欄：「編輯」單一按鈕（點開另一 dialog 編輯該 Payment、含切換 paymentStatus、補齊資料、取消）

OA 編輯介面 SHALL NOT 提供「執行」按鈕（沿用 refine-after-sales-refund 對 UI 入口的處置）。

#### Scenario: 業務建立加印追加異動（不變，沿用既有）

- **GIVEN** 訂單 SO-001 狀態 = 生產中
- **WHEN** 客戶要求加印 200 份，業務於訂單詳情頁點擊「建立訂單異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、UI 標題顯示「訂單異動單」
- **AND** 業務 SHALL 可選 `adjustment_type = 加印追加`
- **AND** 業務新增明細「item_type = print_item，描述 = 加印 200 份，金額 = +20,000」
- **AND** OrderAdjustment.amount SHALL 自動加總為 +20,000
- **AND** OrderAdjustment.status SHALL = 草稿
- **AND** OrderAdjustment.linked_after_sales_ticket_id SHALL = NULL
- **AND** 業務點擊「提交審核」後 status SHALL → 待主管審核

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment（不變，沿用既有）

- **GIVEN** AfterSalesTicket AS-001 status = 處理中、resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 建立 OrderAdjustment、預填 adjustment_type = 退印、linked_after_sales_ticket_id = AS-001
- **AND** 業務填入 amount = -5000、明細描述
- **AND** OrderAdjustment.status SHALL = 草稿，後續走原狀態機（提交審核 → 主管核可 → 業務於 OA 編輯介面建立關聯 Payment 並切「已完成」累計達 OA.amount 自動推進已執行）

#### Scenario: 業務主管核可 OrderAdjustment（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核、amount = -5000
- **WHEN** 業務主管於訂單詳情頁的異動清單點擊「核可」
- **THEN** OrderAdjustment.status SHALL → 已核可
- **AND** 系統 MUST 記錄 approved_by、approved_at、approved_amount = -5000

#### Scenario: 業務主管退回 OrderAdjustment（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核
- **WHEN** 業務主管點擊「退回」並填入退回原因
- **THEN** OrderAdjustment.status SHALL → 已退回
- **AND** 業務 SHALL 可修改後重交審核

#### Scenario: 業務於已核可狀態調整金額（沿用 refine-after-sales-refund 設計）

- **GIVEN** OrderAdjustment.status = 已核可、approved_amount = -5000、current_amount = -5000
- **WHEN** 業務發現實際退款金額應為 -4800（客戶談判），於 OA 編輯介面點擊「編輯金額」
- **THEN** 系統 SHALL 允許業務修改 current_amount = -4800
- **AND** OrderAdjustment.status SHALL 維持「已核可」（不需重新送審）
- **AND** 對照欄位 SHALL 顯示「主管核可金額 -$5,000（{approved_at}）｜當前金額 -$4,800｜業務已調整 +$200」
- **AND** audit log SHALL 記錄此異動（previous_amount = -5000, new_amount = -4800, status_at_adjustment = 已核可）

#### Scenario: Payment 切已完成累計達 OA.amount 自動推進 OA 已執行（MODIFY 既有「建立即推進」）

- **GIVEN** OrderAdjustment.status = 已核可、current_amount = -5000、linked_after_sales_ticket_id = AS-001
- **AND** 業務已在 OA 編輯介面建立關聯 Payment P-001（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中'）
- **WHEN** 業務於 P-001 編輯 dialog 補 paidAt、上傳對帳附件、切 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 P-001.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA 對應已完成 Payment 累計 = -5000 = OA.amount
- **AND** 系統 SHALL 同 transaction 推進 OrderAdjustment.status → '已執行'、executedAt = now
- **AND** 訂單應收總額 MUST 更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)）
- **AND** PaymentPlan SHALL NOT 自動變動
- **AND** OA 編輯介面內「關聯 Payment 卡片」SHALL 顯示「已執行（透過 Payment-{payment_no} 推進）」

#### Scenario: 補收 OA 對稱化建立 Payment + 切已完成自動推進（對稱化新規）

- **GIVEN** OrderAdjustment OA-002（status = 已核可、amount = +20000、adjustment_type = 加印追加）
- **WHEN** 業務於 OA-002 編輯介面點「新增 Payment」（OA 補收型 → 預填 paymentMethod = '銀行轉帳'）、填入 amount = +20000、點擊「儲存」
- **THEN** 系統 SHALL 建立 Payment P-002（amount = +20000, paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **AND** OA-002.status SHALL 維持「已核可」
- **WHEN** 客戶匯款後業務補 paidAt + attachments、切 P-002 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 重算 OA-002 對應已完成 Payment 累計 = +20000 = OA-002.amount
- **AND** 系統 SHALL 推進 OA-002.status → '已執行'

#### Scenario: 棄用「執行 OA 自動建補收 Payment」舊行為驗證

- **GIVEN** 業務建立 OrderAdjustment OA-003（adjustment_type = 加印追加, amount = +20000, status = 草稿）→ 提交審核 → 主管核可（status = 已核可）
- **WHEN** 系統處理該 OA 核可事件
- **THEN** 系統 SHALL NOT 自動建立補收 Payment（既有 spec L1719 / L1734 行為已廢止）
- **AND** OA 編輯介面 SHALL 顯示「新增 Payment」入口供業務手動建補收 Payment
- **AND** 業務 SHALL 在 OA 編輯介面手動建 + 補齊 + 切已完成才能推進 OA 至已執行

#### Scenario: OA 上找不到「執行」按鈕（沿用 refine-after-sales-refund 設計）

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務打開 OA 編輯介面
- **THEN** 系統 SHALL NOT 顯示「執行」按鈕
- **AND** 系統 SHALL 顯示「新增 Payment」按鈕（OA 編輯介面 dialog 內、退款型 / 補收型皆顯示）

#### Scenario: 已執行 OA 鎖定金額（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 已執行
- **WHEN** 業務嘗試打開 OA 編輯金額
- **THEN** 系統 SHALL NOT 顯示「編輯金額」按鈕
- **AND** 金額欄位 SHALL 為唯讀（disabled）

#### Scenario: 訂單異動不阻擋主訂單推進（不變，沿用既有）

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 訂單主狀態 = 生產中
- **WHEN** 工單 / 印件層級觸發 bubble-up 推進主訂單至「出貨中」
- **THEN** 系統 SHALL 允許主訂單推進，OrderAdjustment 仍維持其獨立狀態

#### Scenario: 訂單異動執行後生產內容變更提示（修訂觸發機制描述）

- **GIVEN** OrderAdjustment 含 print_item 類型明細（例如加印追加、規格變更）
- **WHEN** 透過關聯 Payment 切「已完成」累計達 OA.amount 自動推進 OA 至「已執行」
- **THEN** 系統 SHALL 顯示提示「此異動涉及生產內容，請至訂單詳情頁編輯印件以接續審稿 / 工單流程」
- **AND** 提示為非阻擋式（業務可關閉提示繼續），系統 NOT 自動建立或修改 PrintItem

### Requirement: 三方對帳檢視面板

訂單詳情頁 SHALL 提供「對帳檢視」面板，即時計算並顯示三個總額與差額：

- **應收總額** = `∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`
- **發票淨額** = `∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance.|allowance_amount|`
- **收款淨額** = `∑ Payment.amount`（**僅 Payment.paymentStatus = '已完成'**，含退款負數，僅計入 `linked_entity_type = Order` 且 `linked_entity_id = 當前訂單 ID` 的 Payment）

差額 = 應收總額 - 發票淨額 - 收款淨額；差額 = 0 視為對帳通過。

**[本 change 修訂] 收款淨額公式變動**：

收款淨額公式從「∑ Payment.amount」修訂為「∑ Payment.amount WHERE paymentStatus = '已完成'」。處理中 Payment 不計入收款淨額，避免「業務先填一半即影響對帳數字」。

**[本 change 新增] 處理中 Payment 資訊軸（不計入收款淨額）**：

對帳面板收款淨額卡片內 SHALL 顯示三項 breakdown：

- 已完成一般收款（一般收款 + 補收的已完成 Payment 加總）：+N
- 已完成退款（退款的已完成 Payment 加總絕對值）：-M
- 處理中（合計：含一般收款 / 退款 / 補收的處理中 Payment）：±0（muted 視覺，加 tooltip「不計入收款淨額」）

差額 hint 文字 SHALL 加註：「另含處理中款項 K 元，齊備後將計入」。

語意更新（vs refactor change + refine-after-sales-refund）：原算式 `應收總額 = Order.total_with_tax + ∑(已執行 OrderAdjustment.amount)` 已於 refactor change 修訂為 `應收總額 = ∑ 印件費 + ∑ OrderExtraCharge.amount + ∑(已執行 OrderAdjustment.amount)`；收款淨額本 change 進一步限縮為「只計已完成 Payment」。

#### Scenario: 諮詢來源主訂單對帳通過（已完成 Payment 條件）

- **GIVEN** 主訂單印件費 4000、OrderExtraCharge(consultation_fee, 1000) = 1000、無其他 OrderAdjustment
- **AND** Payment 累計（綁主訂單 AND paymentStatus = '已完成'）= 5000（諮詢費轉移 Payment 1000 + 後續補繳 Payment 4000）
- **AND** Invoice 累計開立 = 5000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 5000，發票淨額 SHALL = 5000，收款淨額 SHALL = 5000，差額 SHALL = 0
- **AND** 面板 SHALL 標記「對帳通過」

#### Scenario: 處理中 Payment 不計入收款淨額

- **GIVEN** 訂單應收 30000、已開發票 30000、已完成 Payment 累計 = 20000、處理中 Payment 累計 = 10000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 20000（僅已完成）
- **AND** 差額 SHALL = 30000 - 30000 - 20000 = -20000（待收 20000）
- **AND** 對帳面板 SHALL 顯示處理中 Payment 資訊軸「處理中 10000（不計入）」
- **AND** 差額 hint 文字 SHALL = 「另含處理中款項 10000 元，齊備後將計入」

#### Scenario: 處理中退款不影響收款淨額

- **GIVEN** 訂單應收 30000、發票 30000、已完成一般收款 30000、處理中退款 Payment 5000
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 SHALL = 30000，發票淨額 SHALL = 30000，收款淨額 SHALL = 30000（處理中退款 -5000 不計入）
- **AND** 差額 SHALL = 0（對帳通過，因處理中退款仍未實際發生）
- **AND** 對帳面板 SHALL 標示「處理中退款 5000（不計入）」

#### Scenario: 諮詢訂單退費對帳通過（已完成退款條件）

- **GIVEN** 諮詢訂單 OrderExtraCharge(consultation_fee, 1000) = 1000、issue_now 路徑
- **AND** Payment 綁諮詢訂單：諮詢費 1000（已完成）+ 退款 -1000（已完成）= 0
- **AND** Invoice 1000 + SalesAllowance -1000，發票淨額 = 0
- **WHEN** 開啟對帳檢視面板
- **THEN** 應收 = 1000、發票淨額 = 0、收款淨額 = 0、差額 = 1000

**註**：此情境差額 = 1000 反映「應收沒沖銷」，但實務上退費完成的諮詢訂單視為合法終態。對帳面板 SHALL 標示「退費完成（OrderExtraCharge 與 SalesAllowance / 退款抵銷）」而非「對帳通過」（細節見「諮詢取消對帳邏輯」既有 ADDED Requirement）。

#### Scenario: 訂單異動 + 折讓退款的三方對帳（已完成 Payment 條件）

- **GIVEN** 訂單原應收 5000、訂單異動 +20,000（已執行）、開立發票合計 25,000、確認折讓 -10,000、已完成收款合計 25,000、已完成退款 -10,000
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收 SHALL = 25,000（5000 + 20,000）、發票淨額 SHALL = 15,000、收款淨額 SHALL = 15,000、差額 SHALL = 0

## ADDED Requirements

### Requirement: Payment 修正路徑（已完成不可改回處理中）

業務發現「已完成」標錯時，SHALL NOT 直接從 paymentStatus = '已完成' 切回 '處理中'。修正路徑為「取消整筆 Payment → 重建新 Payment」。

此規則維持 OA「已執行」的終態語意（避免狀態反覆翻動），與 [state-machines spec § 訂單異動狀態機](../state-machines/spec.md) 內「已執行回退機制」搭配運作。

#### Scenario: 業務嘗試將已完成 Payment 切回處理中被擋

- **GIVEN** Payment P-099（paymentStatus = '已完成', completedAt = 2026-05-21）
- **WHEN** 業務於 P-099 編輯 dialog 內嘗試將 paymentStatus 切換為 '處理中'
- **THEN** dialog UI SHALL 阻擋切換（toggle / select 限制或 disabled）
- **AND** UI SHALL 顯示提示「已完成 Payment 不可改回處理中。如需修正請改用「取消」功能後重建新 Payment」

#### Scenario: 業務取消已完成 Payment 後重建

- **GIVEN** Payment P-099（已完成、amount = -5000、關聯 OA-099 已執行）
- **WHEN** 業務於 OA-099 編輯介面 P-099 row 點「取消」
- **THEN** 系統 SHALL 刪除 P-099
- **AND** OA-099 對應已完成 Payment 累計 = 0 ≠ OA-099.amount → OA-099 回退至「已核可」（沿用 state-machines spec 回退機制）
- **AND** 業務 SHALL 可於 OA-099 編輯介面重新建立新 Payment

### Requirement: 既有資料 Migration（一次性 backfill）

本 change 上線時 SHALL 對既有所有 Payment 執行一次性 backfill：

- 所有 paymentStatus 為 null 的既有 Payment（含一般收款 + 退款 + 補收 + 諮詢費）SHALL 設為 `paymentStatus = '已完成'`、`completedAt = createdAt`
- 理由：refine-after-sales-refund + refactor change 時期的設計即為「建立 = 完成」，既有資料的 paidAt 與 attachments 也已是「實際發生」狀態，backfill 為「已完成」符合實質

Migration SHALL 為冪等：重複執行不會改變已 backfill 的資料。

#### Scenario: 既有退款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆退款 Payment P-old（amount = -5000, paymentMethod = '退款', paymentStatus = null, createdAt = 2026-05-20T10:00:00Z）
- **WHEN** 系統執行 Migration
- **THEN** P-old.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** P-old.completedAt SHALL 被 backfill 為 2026-05-20T10:00:00Z（= createdAt）
- **AND** Migration 結束後 OA invariant SHALL 仍滿足（既有「已執行 OA → 必有關聯退款 Payment」已隱含「已完成」語意）

#### Scenario: 既有一般收款 Payment 自動 backfill 為已完成

- **GIVEN** 既有資料庫中有一筆一般收款 Payment P-old2（amount = +30000, paymentMethod = '銀行轉帳', paymentStatus = null, createdAt = 2026-04-10）
- **WHEN** 系統執行 Migration
- **THEN** P-old2.paymentStatus SHALL 被 backfill 為 '已完成'
- **AND** 對帳收款淨額計算結果 SHALL 與本 change 上線前一致（向後相容）
