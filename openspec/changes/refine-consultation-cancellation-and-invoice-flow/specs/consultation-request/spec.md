## MODIFIED Requirements

### Requirement: 諮詢單實體與表單欄位

系統 SHALL 提供 ConsultationRequest 諮詢單實體，作為「客人付款後尚未進入訂單流程」的前置紀錄。實體 SHALL 包含 14 個來自外部 surveycake 表單的蒐集欄位，以及系統內生欄位（id、時間戳、狀態、結果、關聯需求單與後續訂單、**諮詢人員筆記**、**取消理由分類**）。

**表單蒐集欄位（webhook 帶入）：**

| # | 欄位 | 類型 | 必填 | 說明 |
|---|------|------|------|------|
| 1 | `customer_type` | enum: `general` / `corporate` | Y | 散客 / 企業客 |
| 2 | `company_tax_id` | string(8) | corporate 必填 | 公司統編 |
| 3 | `company_name` | string | corporate 必填 | 公司抬頭 |
| 4 | `consultation_invoice_option` | enum: `defer_to_main_order` / `issue_now` | Y | 諮詢費發票時間點（**本 change 後降為客戶意向參考，不再驅動系統行為**，見 § 諮詢費發票時間點處理）|
| 5 | `company_phone` | string | Y | 市話 |
| 6 | `extension` | string | N | 分機 |
| 7 | `contact_name` | string | Y | 聯絡人（須與身份證件相同） |
| 8 | `mobile` | string | Y | 手機 |
| 9 | `email` | string | Y | 區分大小寫 |
| 10 | `reserved_date` | date | Y | 預約日期 |
| 11 | `reserved_time` | enum: `10:30 / 11:00 / ... / 18:30`（30 分鐘間隔） | Y | 預約時間 |
| 12 | `visitor_count` | int(1-4) | Y | 來訪人數 |
| 13 | `consultation_topic` | text | Y | 客戶原始填寫的討論內容（**唯讀**，不允許諮詢人員或業務覆寫；對齊 ISO 9001 客戶指示可追溯不可竄改原則） |
| 14 | `estimated_quantity_band` | enum: `1-100` / `101-300` / `301-500` / `501-1000` / `1000+` | Y | 預計製作數量級距 |

**系統內生欄位：**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `consultation_request_id` | PK | 主鍵 |
| `created_at` | timestamp | webhook 收到付款成功時間 |
| `consultant_id` | FK -> 使用者 | 諮詢人員自我認領時寫入（見 § 諮詢人員認領） |
| `consulted_at` | timestamp | 實際諮詢時間（諮詢開始記錄） |
| `status` | enum | `待諮詢` / `已轉需求單` / `完成諮詢` / `已取消` |
| `consultation_fee` | decimal | 諮詢費（含稅，固定 NT$ 2000） |
| `consultant_note` | text（最長 2000 字，非必填）| 諮詢人員與客戶溝通記錄；獨立於客戶原話 `consultation_topic` 的雙欄位設計（編輯規則見 § 諮詢人員筆記欄位） |
| `cancel_reason_category` | enum 6 值（`找到其他廠商` / `預算問題` / `需求改變` / `時間無法配合` / `諮詢人員無法出席` / `其他（原因請參考備註）`）| 取消理由分類；`status = 已取消` 時 SHALL 非空必填，其他狀態 SHALL 為 NULL；「其他」情境的補充說明寫入 `consultant_note` 欄位（本 change 不新增獨立 note 欄位） |
| `linked_quote_request_id` | FK -> QuoteRequest | 諮詢結束選做大貨時建立 |
| `linked_consultation_order_id` | FK -> Order | 諮詢訂單關聯（完成諮詢 / 需求單流失 / 諮詢取消時建立） |
| `payments` | ConsultationPayment[] | 沿用訂單付款結構（paidAt / amount / paymentMethod / paymentRef / recordedBy / notes）|

**狀態機說明（v2 簡化）**：諮詢進行中不需狀態追蹤，狀態機收斂為四值：

- 待諮詢 → 已轉需求單（諮詢人員選做大貨）
- 待諮詢 → 完成諮詢（諮詢人員選不做大貨；或諮詢來源需求單後續流失自動觸發）
- 待諮詢 → 已取消（待諮詢階段取消預約退費，本 change 後採半額退費）

`result` 欄位於 v2 移除，由 status 直接表達結局。

**Payment 關聯**：諮詢費 Payment 一開始 SHALL 關聯 ConsultationRequest（`Payment.linked_entity_type = ConsultationRequest`、`Payment.linked_entity_id = consultation_request_id`），後續依結局轉移至對應訂單（見 [order-management spec](../order-management/spec.md) § Payment 跨實體轉移）。

#### Scenario: 必填欄位驗證

- **WHEN** webhook 接收 surveycake 表單 payload，但缺少必填欄位（如 `contact_name` 為空）
- **THEN** 系統 MUST 拒絕建立 ConsultationRequest
- **AND** 系統 MUST 寫入 webhook error log（事件描述 = 「諮詢單建單失敗：必填欄位缺失」、payload 摘要）
- **AND** 系統 SHALL 觸發 alert 通知值班業務手動補件

#### Scenario: 企業客必填欄位

- **GIVEN** 表單 `customer_type = corporate`
- **WHEN** webhook 接收 payload 但 `company_tax_id` 或 `company_name` 為空
- **THEN** 系統 MUST 拒絕建立 ConsultationRequest
- **AND** webhook error log MUST 標示「企業客缺統編 / 抬頭」

#### Scenario: 客戶原話 consultation_topic 唯讀

- **GIVEN** ConsultationRequest 已自 webhook 建立、`consultation_topic` = 客戶 surveycake 填寫的原始內容
- **WHEN** 諮詢人員或業務嘗試於諮詢單詳情頁編輯 `consultation_topic`
- **THEN** 系統 MUST 拒絕修改並提示「客戶原話唯讀」
- **AND** 諮詢人員須改於 `consultant_note` 欄位寫入溝通筆記

#### Scenario: consultant_note 預設為空

- **WHEN** webhook 自動建立 ConsultationRequest
- **THEN** 系統 SHALL 將 `consultant_note` 預設為 NULL（諮詢人員認領後再行編輯）

#### Scenario: cancel_reason_category 預設為空

- **WHEN** webhook 自動建立 ConsultationRequest 或諮詢單處於 `待諮詢` / `已轉需求單` / `完成諮詢` 狀態
- **THEN** 系統 SHALL 將 `cancel_reason_category` 預設為 NULL
- **AND** 系統 MUST NOT 允許在非 `已取消` 狀態填入此欄位

#### Scenario: cancel_reason_category 於取消時必填

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員或諮詢主管點擊「取消諮詢」並進入取消 dialog
- **THEN** dialog SHALL 顯示 cancel_reason_category 必選下拉（6 個 enum 值）
- **AND** 系統 MUST 阻擋在未選 cancel_reason_category 的情況下提交取消動作
- **AND** 提交取消後系統 SHALL 將 cancel_reason_category 寫入 ConsultationRequest

---

### Requirement: 諮詢結束分支（v2 簡化）

諮詢人員 SHALL 於諮詢結束時直接於「待諮詢」狀態下選擇分支動作（v2 簡化：移除「諮詢中」過渡狀態，諮詢進行不需 status 追蹤）：

- **完成諮詢（不做大貨）**：系統建立諮詢訂單（type=諮詢訂單）+ OrderExtraCharge(consultation_fee) + Payment 從 ConsultationRequest 轉移至諮詢訂單 + **自動建立 PlannedInvoice 1 筆**（金額 = 諮詢費全額 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system）；諮詢訂單推進至訂單完成路徑（**不自動開 Invoice**，由諮詢人員後續手動將 PlannedInvoice 轉為實際 Invoice）；ConsultationRequest 推進至「完成諮詢」
- **轉需求單（做大貨）**：系統建立需求單（QuoteRequest, status=需求確認中, linked_consultation_request_id 寫入）；ConsultationRequest 推進至「已轉需求單」；**MUST NOT 建任何訂單**；Payment 維持綁 ConsultationRequest，等需求單流程結局明確時才轉移

#### Scenario: 完成諮詢 - 不做大貨（建諮詢訂單收尾 + 自動建 PlannedInvoice）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且已認領 `consultant_id`
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」
- **THEN** 系統 SHALL 建立 Order（order_type = 諮詢訂單、客戶資料來自 ConsultationRequest、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）
- **AND** ConsultationRequest 狀態 MUST 推進至「完成諮詢」終態
- **AND** `linked_consultation_order_id` MUST 寫入新建諮詢訂單 ID
- **AND** 諮詢訂單 SHALL 推進至完成路徑（諮詢人員後續手動將 PlannedInvoice 轉為實際 Invoice 後訂單完成）

#### Scenario: 轉需求單 - 做大貨（只建需求單，不建訂單）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且已認領 `consultant_id`
- **WHEN** 諮詢人員點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立 QuoteRequest（status = 需求確認中、linked_consultation_request_id 寫入）
- **AND** ConsultationRequest 狀態 MUST 推進至「已轉需求單」終態
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）
- **AND** `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** 系統 MUST NOT 建立任何 Order
- **AND** 系統 MUST NOT 建立任何 PlannedInvoice（PlannedInvoice 的建立時機延後到需求單結局明確時：成交轉訂單由業務於主訂單規劃時自行加入；流失時走「需求單流失觸發建諮詢訂單收尾」分支自動建）

---

### Requirement: 需求單流失觸發建諮詢訂單收尾

當諮詢結束選「做大貨」後，需求單於議價中或更早任何狀態流失時，系統 SHALL 觸發「建諮詢訂單收尾」流程，複用「不做大貨」的諮詢訂單路徑：

1. 系統建立諮詢訂單（type=諮詢、客戶資料來自原 ConsultationRequest、總額 = 諮詢費）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單
4. **系統 SHALL 自動建立 PlannedInvoice 1 筆**（金額 = 諮詢費全額 2000、description = 「諮詢費」、expectedDate = 需求單流失時點當天、status = 預計開立、createdBy = system）
5. 諮詢訂單推進至完成路徑（**不自動開 Invoice**，由諮詢人員後續手動將 PlannedInvoice 轉為實際 Invoice）

ConsultationRequest 狀態 MUST 從「已轉需求單」更新為「完成諮詢」（最終結局）。`linked_consultation_order_id` 寫入新建諮詢訂單 ID。

**設計理由**：複用「最終沒進入大貨製作」的單一收尾流程，避免新增訂單類型或新流程。本情境在 [order-management spec § 訂單建立](../order-management/spec.md) 概念分類上歸入「不做大貨」高層情境（觸發點 3.2，與諮詢人員直接點不做大貨並列）。

**重要限制**：本 Requirement 僅適用於 `linked_consultation_request_id` 非空（諮詢來源）的需求單。**非諮詢來源**（直接從需求單建立、`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不觸發本流程**。

#### Scenario: 議價中需求單流失觸發建諮詢訂單與自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 需求單狀態為「議價中」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（type=諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 流失時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）
- **AND** 諮詢訂單 SHALL 推進至完成路徑（諮詢人員後續手動轉立 Invoice 後訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID
- **AND** ConsultationRequest 同時保留 `linked_quote_request_id`（保留歷史足跡）
- **AND** 系統 ActivityLog SHALL 將事件歸類標籤標為「不做大貨」（與觸發點 3.1 諮詢人員直接點不做大貨同分類）

#### Scenario: 非諮詢來源的需求單流失不觸發本流程

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（業務直接從需求單建立、無諮詢階段）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 系統 MUST NOT 觸發本 Requirement 的任何動作
- **AND** 需求單流失走需求單自身的退款 / 流失流程（不在本 spec 範圍）

#### Scenario: 早期狀態需求單流失（待評估成本前）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單
- **AND** 需求單狀態為「需求確認中」或「待評估成本」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + 自動建 PlannedInvoice 2000 + ConsultationRequest 狀態更新）

---

### Requirement: 諮詢取消觸發建諮詢訂單與半額退費

當客人或諮詢人員於「待諮詢」狀態取消預約時，系統 SHALL 觸發「建諮詢訂單 + 半額退費 + 自動建 PlannedInvoice」流程。退費金額固定為諮詢費 50%（諮詢費 2000 → 退 1000），**不分客戶 / 諮詢人員主動、不分取消時機**，比例 hardcode in code 不開放系統設定。

**自動建單流程（事務性，全成功或全回滾）**：

1. 系統 SHALL 建立諮詢訂單（type=諮詢、客戶資料來自 ConsultationRequest、總額 = 諮詢費 2000）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費 2000)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id；Payment.amount 維持 +2000、status 維持 已完成）
4. **系統 SHALL 自動建立 OrderAdjustment**（金額 = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、approved_at = 取消時點、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）— 跳過業務主管核可（退費政策事先公開、無個案判斷）
5. **系統 SHALL 自動建立退款 Payment**（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
6. **系統 SHALL 自動建立 PlannedInvoice 1 筆**（orderId = 諮詢訂單 ID、scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system）
7. **系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance**（不論 `consultation_invoice_option` 值為何）
8. ConsultationRequest 狀態 MUST 推進至「已取消」終態、`cancel_reason_category` 寫入 dialog 選定值、`linked_consultation_order_id` 寫入新諮詢訂單 ID

**退款金流處理**：退款依原付款方式刷退，由第三方金流處理。ERP 只記錄取消事實與處理中退款 Payment，實際銀行撥款由第三方金流負責，撥款時程不承諾 SLA。

**諮詢人員後續手動**：
- 處理銀行退款金流（與第三方金流確認刷退完成）後，於 OA 編輯介面內將退款 Payment 切「已完成」（依既有 [order-management § OA 已執行推進](../order-management/spec.md) 規則自動推進 OA 至「已執行」、訂單推進至「訂單完成」）
- 將 PlannedInvoice 手動轉為實際 Invoice（金額由諮詢人員依客戶需求決定，建議 1000 元）
- 主動通知客戶退款已處理（不入系統，由諮詢人員以電話 / Email 等管道執行）

**對帳公式**：
- 應收 = OEC(2000) + ∑OA(-1000) = 1000
- 收款淨額 = Payment(+2000) + Payment(-1000) = 1000
- 發票淨額 = 諮詢人員實際開立金額（人工負責，預設目標 1000 元）
- 對帳邏輯：應收 = 收款淨額 = 1000 對帳通過；發票差異由訂單詳情頁既有對帳警示 banner 提示

**離開「待諮詢」狀態以後**（已轉需求單 / 完成諮詢 / 已取消）MUST NOT 退費（諮詢結束分支已執行即不可退）。

#### Scenario: 諮詢取消觸發建單與資料模型

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空（已認領）、Payment(P0: +2000, linked=CR, status=已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員或諮詢主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（type = 諮詢、總額 = 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 的 linked_entity_type 與 linked_entity_id 改為諮詢訂單（金額不變、status 維持已完成）
- **AND** 系統 SHALL 建立 OrderAdjustment(amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、approved_at = 取消時點、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」)
- **AND** 系統 SHALL 建立退款 Payment(amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id)
- **AND** 系統 SHALL 建立 PlannedInvoice(scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system)
- **AND** 系統 MUST NOT 建立任何 Invoice
- **AND** 系統 MUST NOT 建立任何 SalesAllowance
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** ConsultationRequest.cancel_reason_category SHALL = dialog 選定值
- **AND** ConsultationRequest.linked_consultation_order_id SHALL 寫入新諮詢訂單 ID

#### Scenario: 退款 Payment 切已完成推進諮詢訂單完成

- **GIVEN** 諮詢取消後諮詢訂單已建立、退款 Payment(P1: -1000、paymentStatus = 處理中、linkedOrderAdjustmentId = OA-c1) 存在、OA-c1 status = 已核可
- **WHEN** 諮詢人員於 OA 編輯介面將退款 Payment P1 切「已完成」並上傳退款證明附件
- **THEN** 系統 SHALL 將 P1.paymentStatus 改為「已完成」
- **AND** 系統 SHALL 依既有 OA 推進規則將 OA-c1 status 推進至「已執行」
- **AND** 系統 SHALL 將諮詢訂單推進至「訂單完成」終態
- **AND** 諮詢訂單終態 MUST NOT 受發票開立狀態影響（PlannedInvoice 是否轉立 Invoice 不影響訂單完成）

#### Scenario: 諮詢取消不自動開 Invoice 或 SalesAllowance

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **WHEN** 諮詢人員點擊「確認取消諮詢」
- **THEN** 系統 MUST NOT 在諮詢訂單上自動開立 Invoice（不論 `consultation_invoice_option` 為何值）
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆作為待開發票提醒（金額 1000）

#### Scenario: 已離開待諮詢狀態後不可取消退費

- **GIVEN** ConsultationRequest 狀態 ∈ {已轉需求單, 完成諮詢, 已取消}
- **WHEN** 諮詢人員 / 諮詢主管嘗試點擊「取消諮詢」
- **THEN** 系統 MUST 拒絕該動作
- **AND** UI SHALL 顯示「諮詢結束分支已執行，無法退費」提示

#### Scenario: 取消 dialog 內容防呆

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員或諮詢主管點擊「取消諮詢」按鈕
- **THEN** UI SHALL 彈出二次確認 dialog
- **AND** dialog SHALL 顯示警示文字：「確定取消？將自動建諮詢訂單並退款 1000 元，無法復原」
- **AND** dialog SHALL 顯示 cancel_reason_category 必選下拉（6 個 enum 值）
- **AND** dialog MUST NOT 顯示 `consultation_invoice_option` 意向（既已不驅動發票自動化、避免使用者誤解）
- **AND** dialog MUST NOT 顯示客戶聯絡資訊或預約時間（資訊精簡）
- **AND** dialog 提供「取消」與「確認取消諮詢」兩個按鈕；「確認取消諮詢」按鈕在未選 cancel_reason_category 時 MUST 為 disabled

---

### Requirement: 諮詢費發票時間點處理

`consultation_invoice_option` SHALL 由客人於 surveycake 表單 Q4 自選，**作為客戶意向參考保留於諮詢單實體欄位**。本 change 後此欄位 **MUST NOT 驅動任何系統發票自動化行為**（包含 Invoice / SalesAllowance / PlannedInvoice 的建立），所有諮詢費 Invoice 統一由諮詢人員於 PlannedInvoice 既有手動轉立流程處理。

`consultation_invoice_option` 欄位的純展示用途：
- 諮詢人員可於諮詢單詳情頁查看客戶當初選擇的意向
- 於主訂單成交（諮詢結束做大貨）情境，業務於主訂單規劃發票時程時可參考此意向決定是否將諮詢費獨立成單張 Invoice 或併入主訂單其他 Invoice
- 不顯示於取消 dialog 或結束諮詢 dialog（避免使用者誤解系統會依此自動處理）

PlannedInvoice 自動建立規則統一改為依「諮詢訂單收尾情境」分類（見 § 諮詢結束分支、§ 需求單流失觸發建諮詢訂單收尾、§ 諮詢取消觸發建諮詢訂單與半額退費 三個 Requirement）：

| 情境 | PlannedInvoice 自動建立 |
|------|------------------------|
| 諮詢結束不做大貨 | 1 筆 2000 元（description = 「諮詢費」）|
| 需求單流失（已轉需求單後）| 1 筆 2000 元（description = 「諮詢費」）|
| 諮詢取消 | 1 筆 1000 元（description = 「諮詢費（取消退費後）」）|
| 諮詢結束做大貨 → 需求單成交轉一般訂單 | 不自動建（業務於主訂單既有發票時程流程自行規劃）|

#### Scenario: invoice_option 欄位保留於諮詢單實體但不驅動系統行為

- **GIVEN** ConsultationRequest 任一狀態、`consultation_invoice_option` 值為 `issue_now` 或 `defer_to_main_order`
- **WHEN** 系統處理諮詢單任何狀態轉換或建單流程
- **THEN** 系統 MUST NOT 依 `consultation_invoice_option` 決定 Invoice / SalesAllowance / PlannedInvoice 的建立或不建立
- **AND** PlannedInvoice 與 Invoice 的自動建立規則 SHALL 完全依「諮詢訂單收尾情境」決定

#### Scenario: 諮詢人員於諮詢單詳情頁查看客戶 invoice_option 意向

- **GIVEN** ConsultationRequest 已建立、`consultation_invoice_option = issue_now`
- **WHEN** 諮詢人員開啟諮詢單詳情頁
- **THEN** UI SHALL 顯示「客戶發票意向：現在開立」純展示欄位
- **AND** UI MUST 標明「此為客戶意向參考，不驅動系統自動開立」

#### Scenario: 主訂單成交業務參考 invoice_option 規劃主訂單發票時程

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、諮詢結束選做大貨、需求單成交轉一般訂單
- **WHEN** 業務於主訂單規劃 PlannedInvoice 時程
- **THEN** 業務 SHALL 可參考客戶意向決定是否將諮詢費獨立成單張 PlannedInvoice 或併入其他 PlannedInvoice
- **AND** 系統 MUST NOT 自動於主訂單建立諮詢費的 PlannedInvoice（業務自行規劃）

---

### Requirement: 諮詢單活動紀錄

系統 SHALL 記錄 ConsultationRequest 的所有操作歷程（webhook 自動建單、**諮詢人員認領 / 主管代為認領**、**諮詢備註修改**、開始諮詢、結束諮詢、轉需求單、需求單流失觸發建諮詢訂單、轉諮詢訂單、**取消（含 cancel_reason_category）**等），供稽核與追溯。

事件型別：

| 事件描述 | 觸發時機 | 主要欄位 |
|---------|---------|---------|
| 諮詢單與付款記錄自動建立（webhook） | webhook 自動建單 | payload 摘要 |
| 諮詢人員認領 | 諮詢人員自我認領（actor = 諮詢人員 user_id） | actor |
| 主管代為認領 | 主管代為指定某諮詢人員（actor = 主管 user_id；assigned_to = 諮詢人員 user_id） | actor, assigned_to |
| 諮詢備註修改 | `consultant_note` 編輯儲存 | actor, from, to |
| 結束諮詢 - 不做大貨 | 諮詢人員點擊「完成諮詢（不做大貨）」 | actor |
| 結束諮詢 - 轉需求單 | 諮詢人員點擊「轉需求單（做大貨）」 | actor |
| 需求單流失觸發建諮詢訂單 | 系統自動（需求單 side-effect） | system |
| **待諮詢取消** | 諮詢人員 / 諮詢主管點擊「取消諮詢」並確認 dialog | actor, **cancel_reason_category** |

#### Scenario: 查閱諮詢單活動紀錄

- **WHEN** 使用者於諮詢單詳情頁查看活動紀錄
- **THEN** 系統 SHALL 顯示完整操作歷程（操作人、操作時間、事件描述）

#### Scenario: ActivityLog 紀錄諮詢人員認領事件

- **WHEN** 諮詢人員 X 認領一張 ConsultationRequest
- **THEN** 系統 MUST 寫入 ActivityLog 事件（事件描述 = 「諮詢人員認領」、actor = X、timestamp）
- **AND** ActivityLog MUST 不再使用「指派諮詢人員」舊措辭

#### Scenario: ActivityLog 紀錄待諮詢取消含 cancel_reason_category

- **WHEN** 諮詢人員 X（或諮詢主管）點擊「取消諮詢」並於 dialog 選定 `cancel_reason_category = 找到其他廠商` 後確認取消
- **THEN** 系統 MUST 寫入 ActivityLog 事件（事件描述 = 「待諮詢取消」、actor = X、cancel_reason_category = 找到其他廠商、timestamp）
- **AND** ActivityLog 事件 SHALL 包含 cancel_reason_category 欄位以便後續流失分析

---

## ADDED Requirements

### Requirement: 諮詢取消權限

諮詢取消按鈕的執行權限 SHALL 限定為以下兩類使用者：

1. **當前 `consultant_id` 對應的諮詢人員**（已認領該諮詢單的諮詢人員自己）
2. **諮詢主管**（可代為取消任一諮詢人員負責的諮詢單）

**業務不可取消諮詢**（包含一般業務與業務主管）。本 Requirement 取代既有 spec 內「業務 / 諮詢人員點擊取消諮詢」條款 — 業務不負責諮詢階段任何操作，沿用「諮詢人員 = 諮詢階段唯一操作者」設計範式。

**權限驗證**：
- UI 層：未具權限角色 SHALL 隱藏「取消諮詢」按鈕
- API 層：未具權限角色嘗試 API 取消 MUST 被系統拒絕並回覆 403 Forbidden 並提示「僅當前諮詢人員或諮詢主管可取消」

**未認領狀態的取消處理**：若 ConsultationRequest 處於「待諮詢」但 `consultant_id` 為空（尚未有諮詢人員認領）、系統 SHALL 允許諮詢主管代為取消（沿用「諮詢主管代為認領」設計範式）。

**Activity Log 標明操作者類型**：
- 當前諮詢人員自我取消：actor = 諮詢人員 user_id、操作者類型 = `當前諮詢人員`
- 諮詢主管代為取消：actor = 諮詢主管 user_id、操作者類型 = `諮詢主管代為`、assigned_consultant_id = ConsultationRequest.consultant_id（若有）

#### Scenario: 當前諮詢人員可取消自己的諮詢單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` = 諮詢人員 A
- **WHEN** 諮詢人員 A 開啟此諮詢單詳情頁
- **THEN** UI SHALL 顯示「取消諮詢」按鈕
- **AND** A 點擊後可進入取消 dialog 並完成取消流程

#### Scenario: 其他諮詢人員不可取消他人的諮詢單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` = 諮詢人員 A
- **WHEN** 諮詢人員 B（A 的同模組同事但非當前 consultant_id）開啟此諮詢單詳情頁
- **THEN** UI MUST NOT 顯示「取消諮詢」按鈕
- **AND** B 嘗試 API 直接取消時 MUST 被系統拒絕並回 403

#### Scenario: 諮詢主管可代為取消任一諮詢單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` = 諮詢人員 A
- **WHEN** 諮詢主管 M 開啟此諮詢單詳情頁
- **THEN** UI SHALL 顯示「取消諮詢」按鈕
- **AND** M 點擊後可進入取消 dialog 並完成取消流程
- **AND** ActivityLog 事件 SHALL 標明 actor = M、操作者類型 = `諮詢主管代為`、assigned_consultant_id = A

#### Scenario: 業務不可取消諮詢

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` = 諮詢人員 A
- **WHEN** 業務 S（一般業務或業務主管）開啟此諮詢單詳情頁
- **THEN** UI MUST NOT 顯示「取消諮詢」按鈕
- **AND** S 嘗試 API 直接取消時 MUST 被系統拒絕並回 403
- **AND** S 若遇到客戶要求取消 SHALL 通知諮詢主管處理

#### Scenario: 未認領的諮詢單由諮詢主管取消

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` = NULL（尚未認領）
- **WHEN** 諮詢主管 M 開啟此諮詢單詳情頁
- **THEN** UI SHALL 顯示「取消諮詢」按鈕
- **AND** M 點擊後可進入取消 dialog 並完成取消流程
- **AND** ActivityLog 事件 SHALL 標明 actor = M、操作者類型 = `諮詢主管代為`、assigned_consultant_id = NULL
