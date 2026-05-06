## ADDED Requirements

### Requirement: 諮詢單實體與表單欄位

系統 SHALL 提供 ConsultationRequest 諮詢單實體，作為「客人付款後尚未進入訂單流程」的前置紀錄。實體 SHALL 包含 14 個來自外部 surveycake 表單的蒐集欄位，以及系統內生欄位（id、時間戳、狀態、結果、關聯需求單與後續訂單）。

**表單蒐集欄位（webhook 帶入）：**

| # | 欄位 | 類型 | 必填 | 說明 |
|---|------|------|------|------|
| 1 | `customer_type` | enum: `general` / `corporate` | Y | 散客 / 企業客 |
| 2 | `company_tax_id` | string(8) | corporate 必填 | 公司統編 |
| 3 | `company_name` | string | corporate 必填 | 公司抬頭 |
| 4 | `consultation_invoice_option` | enum: `defer_to_main_order` / `issue_now` | Y | 諮詢費發票時間點 |
| 5 | `company_phone` | string | Y | 市話 |
| 6 | `extension` | string | N | 分機 |
| 7 | `contact_name` | string | Y | 聯絡人（須與身份證件相同） |
| 8 | `mobile` | string | Y | 手機 |
| 9 | `email` | string | Y | 區分大小寫 |
| 10 | `reserved_date` | date | Y | 預約日期 |
| 11 | `reserved_time` | enum: `10:30 / 11:00 / ... / 18:30`（30 分鐘間隔） | Y | 預約時間 |
| 12 | `visitor_count` | int(1-4) | Y | 來訪人數 |
| 13 | `consultation_topic` | text | Y | 討論內容 |
| 14 | `estimated_quantity_band` | enum: `1-100` / `101-300` / `301-500` / `501-1000` / `1000+` | Y | 預計製作數量級距 |

**系統內生欄位：**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `consultation_request_id` | PK | 主鍵 |
| `created_at` | timestamp | webhook 收到付款成功時間 |
| `consultant_id` | FK -> 使用者 | 業務 / 諮詢專員指定（建立後填入） |
| `consulted_at` | timestamp | 實際諮詢時間（諮詢開始記錄） |
| `status` | enum | `待諮詢` / `已轉需求單` / `完成諮詢` / `已取消` |
| `consultation_fee` | decimal | 諮詢費（含稅，固定 NT$ 2000） |
| `linked_quote_request_id` | FK -> QuoteRequest | 諮詢結束選做大貨時建立 |
| `linked_consultation_order_id` | FK -> Order | 諮詢訂單關聯（完成諮詢 / 需求單流失 / 諮詢取消時建立） |
| `payments` | ConsultationPayment[] | 沿用訂單付款結構（paidAt / amount / paymentMethod / paymentRef / recordedBy / notes）|

**狀態機說明（v2 簡化）**：諮詢進行中不需狀態追蹤，狀態機收斂為四值：

- 待諮詢 → 已轉需求單（諮詢人員選做大貨）
- 待諮詢 → 完成諮詢（諮詢人員選不做大貨；或諮詢來源需求單後續流失自動觸發）
- 待諮詢 → 已取消（待諮詢階段取消預約退費）

`result` 欄位於 v2 移除，由 status 直接表達結局。

**Payment 關聯**：諮詢費 Payment（由 [refactor-order-payment-and-invoice-with-billing-company](../../../refactor-order-payment-and-invoice-with-billing-company) 定義並由本 change MODIFY 為 polymorphic）一開始 SHALL 關聯 ConsultationRequest（`Payment.linked_entity_type = ConsultationRequest`、`Payment.linked_entity_id = consultation_request_id`），後續依結局轉移至對應訂單（見 [order-management spec](../order-management/spec.md) § Payment 跨實體轉移）。

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

---

### Requirement: 諮詢費付款成功觸發自動建單（不建訂單）

系統 SHALL 透過金流平台 webhook，於諮詢費付款成功時自動建立：

1. `ConsultationRequest`（status = 待諮詢，14 表單欄位寫入）
2. `Payment`（金額 = 諮詢費、`linked_entity_type = ConsultationRequest`、`linked_entity_id = consultation_request_id`、payment_method 依金流回傳）

**MUST NOT 建立任何 Order**。Order 在 ConsultationRequest 後續結局明確時才依結局建立（見「諮詢結束分支」與「諮詢取消觸發退費」）。

`consultation_invoice_option = issue_now` 時，諮詢費 Invoice **不在** webhook 階段開立（因為沒有訂單可掛 Invoice）；Invoice 開立時點延後至諮詢訂單建立後（諮詢結束不做大貨 / 需求單流失 / 諮詢取消三種收尾情境之一）。

#### Scenario: webhook 自動建立 ConsultationRequest 與 Payment

- **GIVEN** 客人於 surveycake 完成表單填寫並付款成功
- **WHEN** 金流 webhook 將付款成功事件 + 表單 payload 傳送至 ERP
- **THEN** 系統 SHALL 建立 ConsultationRequest（status = 待諮詢）
- **AND** 系統 SHALL 建立 Payment（amount = 諮詢費、linked_entity_type = ConsultationRequest）
- **AND** 系統 MUST NOT 建立任何 Order
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「諮詢單與付款記錄自動建立（webhook）」、含 payload 摘要）
- **AND** 系統 SHALL 發送 Slack 通知給值班業務指派 `consultant_id`

#### Scenario: webhook payload schema 異動偵測

- **WHEN** webhook 接收 payload 但欄位名 / 結構與預期不符
- **THEN** 系統 MUST 拒絕建單
- **AND** 系統 MUST 觸發 alert 通知工程值班「surveycake 表單可能已異動，需更新 ConsultationRequest mapping」

---

### Requirement: 諮詢人員指派

業務或值班人員 SHALL 於 ConsultationRequest 建立後（status = 待諮詢）指派 `consultant_id`。指派完成後狀態 SHALL 維持「待諮詢」，僅標示已分派。

#### Scenario: 業務指派諮詢人員

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且 `consultant_id` 為空
- **WHEN** 業務於諮詢單詳情頁選擇諮詢人員指派
- **THEN** 系統 SHALL 寫入 `consultant_id`
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「指派諮詢人員」、人員姓名）
- **AND** 系統 SHALL 發送 Slack 通知給被指派的諮詢人員

---

### Requirement: 諮詢結束分支（v2 簡化）

諮詢人員 SHALL 於諮詢結束時直接於「待諮詢」狀態下選擇分支動作（v2 簡化：移除「諮詢中」過渡狀態，諮詢進行不需 status 追蹤）：

- **完成諮詢（不做大貨）**：系統建立諮詢訂單（type=諮詢訂單）+ OrderExtraCharge(consultation_fee) + Payment 從 ConsultationRequest 轉移至諮詢訂單；諮詢訂單推進至訂單完成；ConsultationRequest 推進至「完成諮詢」
- **轉需求單（做大貨）**：系統建立需求單（QuoteRequest, status=需求確認中, linked_consultation_request_id 寫入）；ConsultationRequest 推進至「已轉需求單」；**MUST NOT 建任何訂單**；Payment 維持綁 ConsultationRequest，等需求單流程結局明確時才轉移

#### Scenario: 完成諮詢 - 不做大貨（建諮詢訂單收尾）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且已指派 `consultant_id`
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」
- **THEN** 系統 SHALL 建立 Order（order_type = 諮詢訂單、客戶資料來自 ConsultationRequest、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** ConsultationRequest 狀態 MUST 推進至「完成諮詢」終態
- **AND** `linked_consultation_order_id` MUST 寫入新建諮詢訂單 ID
- **AND** 諮詢訂單 SHALL 推進至完成路徑（依 invoice_option 開立 Invoice → 訂單完成）

#### Scenario: 轉需求單 - 做大貨（只建需求單，不建訂單）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且已指派 `consultant_id`
- **WHEN** 諮詢人員點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立 QuoteRequest（status = 需求確認中、from_consultation_request_id 寫入）
- **AND** ConsultationRequest 狀態 MUST 推進至「已轉需求單」終態
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）
- **AND** `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** 系統 MUST NOT 建立任何 Order
- **AND** Payment MUST 維持綁 ConsultationRequest（等需求單結局決定後再轉移）

---

### Requirement: 諮詢單轉需求單欄位帶入

當諮詢結束分支為「做大貨」時，系統 SHALL 建立新需求單（[quote-request spec](../quote-request/spec.md)）並依以下規則 mapping ConsultationRequest 欄位：

| 欄位類別 | ConsultationRequest 來源 | QuoteRequest 目的地 | 處理方式 |
|---------|--------------------------|---------------------|---------|
| 客戶資料 | customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension | 需求單客戶資料區 | 直接 mapping |
| 諮詢討論記錄 | consultation_topic | 需求單 `requirement_note` | 直接 mapping，業務（即諮詢人員）可編輯 |
| 數量級距預填 | estimated_quantity_band | 印件項目 `quantity` 預填 | 中間值預填：1-100→50；101-300→200；301-500→400；501-1000→750；1000+→1500（皆可業務手動調整） |
| 諮詢預約資訊 | reserved_date / reserved_time / visitor_count | 不帶入 | 已過期 |
| 印件規格細節 | （諮詢單不蒐集）| 印件規格欄位 | 由「需求確認中」狀態下業務（即諮詢人員）與客人交互填入 |
| 來源關聯 | consultation_request_id | `from_consultation_request_id` | 反向關聯 |

**諮詢人員 = 需求單負責業務**：諮詢人員轉需求單時，新建需求單的負責業務（owner）SHALL 設定為當前諮詢人員（即 `consultant_id`）。

需求單後續結局影響 Payment 轉移目的地：

- 需求單成交且業務轉訂單 → Payment 轉移至一般訂單，主訂單上建 OrderExtraCharge(consultation_fee)（見 [order-management spec](../order-management/spec.md) § Payment 跨實體轉移、§ 訂單其他費用明細）
- 需求單流失 → 系統建諮詢訂單收尾，Payment 轉移至諮詢訂單（見「需求單流失觸發建諮詢訂單收尾」Requirement）

#### Scenario: 諮詢結束建立需求單帶入欄位

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 `consultant_id`、客戶資料完整、estimated_quantity_band = `101-300`、consultation_topic = 「想做名片，雙面 250g」
- **WHEN** 諮詢人員點擊「結束諮詢 - 轉需求單」
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料 MUST 自 ConsultationRequest 直接帶入
- **AND** `requirement_note` 欄位 MUST = 「想做名片，雙面 250g」
- **AND** `from_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** 印件預填 `quantity` MUST = 200（級距 101-300 中間值）
- **AND** 需求單負責業務 MUST = `consultant_id`

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `from_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

---

### Requirement: 需求單流失觸發建諮詢訂單收尾

當諮詢結束選「做大貨」後，需求單於議價中或更早任何狀態流失時，系統 SHALL 觸發「建諮詢訂單收尾」流程，複用「不做大貨」的諮詢訂單路徑：

1. 系統建立諮詢訂單（type=諮詢、客戶資料來自原 ConsultationRequest、總額 = 諮詢費）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單
4. 諮詢訂單推進至完成路徑（依 invoice_option 開立 Invoice → 訂單完成）

ConsultationRequest 狀態 MUST 從「已轉需求單」更新為「完成諮詢」（最終結局）。`linked_consultation_order_id` 寫入新建諮詢訂單 ID。

**設計理由**：複用「最終沒進入大貨製作」的單一收尾流程，避免新增訂單類型或新流程。

#### Scenario: 議價中需求單流失觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 需求單狀態為「議價中」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（type=諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑（已開發票 → 訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID
- **AND** ConsultationRequest 同時保留 `linked_quote_request_id`（保留歷史足跡）

#### Scenario: 早期狀態需求單流失（待評估成本前）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單
- **AND** 需求單狀態為「需求確認中」或「待評估成本」、業務點擊「流失」
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 狀態更新）

---

### Requirement: 諮詢取消觸發建諮詢訂單與退費

當客人在「待諮詢」狀態取消預約 / 退費時，系統 SHALL 觸發「建諮詢訂單 + 退費」流程：

1. 系統建立諮詢訂單（type=諮詢、客戶資料來自 ConsultationRequest、總額 = 諮詢費）
2. 諮詢訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
3. Payment 從 ConsultationRequest 轉移至諮詢訂單
4. 系統於諮詢訂單上同步建立退款 Payment（amount = -諮詢費、payment_method = 退款）
5. 視情境處理 Invoice 與 SalesAllowance：
   - `consultation_invoice_option = issue_now`：諮詢訂單推進至「已開發票」並開立 Invoice，再開 SalesAllowance 關聯退款 Payment（金額 = -諮詢費、reason = 諮詢取消）
   - `consultation_invoice_option = defer_to_main_order`：諮詢訂單 MUST NOT 開 Invoice，亦無需 SalesAllowance
6. 諮詢訂單推進至「訂單完成」終態（退費完成）

ConsultationRequest 狀態 MUST 推進至「已取消」終態，`linked_consultation_order_id` 寫入新諮詢訂單 ID。

離開「待諮詢」狀態以後（已轉需求單 / 完成諮詢 / 已取消）MUST NOT 退費（諮詢結束分支已執行即不可退）。

#### Scenario: 待諮詢狀態取消（defer_to_main_order，未開票）

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultation_invoice_option = defer_to_main_order`、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（type=諮詢、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上建立退款 Payment（amount = -諮詢費、payment_method = 退款）
- **AND** 諮詢訂單 SHALL 推進至「訂單完成」終態
- **AND** 系統 MUST NOT 建立 Invoice 與 SalesAllowance
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** 諮詢訂單三方對帳：應收 = 諮詢費（OrderExtraCharge）、收款 = 0（諮詢費 + 退款 = 0）、發票淨額 = 0，差額 = 諮詢費 - 0 - 0... 此情境下對帳特殊：以「應收 = 已沖銷 = 0」視為對帳通過（細節見 [order-management spec](../order-management/spec.md) § 諮詢取消對帳邏輯）

#### Scenario: 待諮詢狀態取消（issue_now，已開票）

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultation_invoice_option = issue_now`、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單與 OrderExtraCharge（同 defer_to_main_order）
- **AND** 系統 SHALL 將 Payment 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至「已開發票」並開立 Invoice（金額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立退款 Payment + 開立 SalesAllowance 關聯該退款 Payment
- **AND** 諮詢訂單 SHALL 推進至「訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」

#### Scenario: 已離開待諮詢狀態後不可取消退費

- **GIVEN** ConsultationRequest 狀態 ∈ {已轉需求單, 完成諮詢, 已取消}
- **WHEN** 業務嘗試點擊「取消諮詢」
- **THEN** 系統 MUST 拒絕該動作
- **AND** UI SHALL 顯示「諮詢結束分支已執行，無法退費」提示

---

### Requirement: 諮詢費發票時間點處理

`consultation_invoice_option` SHALL 由客人於 surveycake 表單 Q4 自選，系統 MUST 依此值決定諮詢費 Invoice 開立時點。由於 webhook 階段不建訂單，Invoice 統一延後至「訂單建立後」開立：

- `issue_now`：客人意願是「現在開立」，但因 webhook 階段沒有訂單可掛 Invoice，實際開立時點 = 諮詢結局明確、訂單建立後立即開立。對應的 Invoice 開立情境：
  - 諮詢結束不做大貨：建諮詢訂單後立即開立諮詢費 Invoice
  - 諮詢結束做大貨 → 需求單成交轉一般訂單：一般訂單建立後立即開立諮詢費 Invoice（金額 = 諮詢費，獨立於主訂單其他發票）
  - 諮詢結束做大貨 → 需求單流失：建諮詢訂單後立即開立諮詢費 Invoice
  - 待諮詢取消：建諮詢訂單後立即開立諮詢費 Invoice 並同步開立 SalesAllowance（沖銷）

- `defer_to_main_order`：諮詢費發票延後到主訂單其他發票一起開：
  - 諮詢結束不做大貨：建諮詢訂單後開立諮詢費 Invoice（單筆）
  - 諮詢結束做大貨 → 需求單成交轉一般訂單：諮詢費以 OrderExtraCharge 形式進入主訂單，主訂單 Invoice 由業務於正常開立流程涵蓋全額（含諮詢費）
  - 諮詢結束做大貨 → 需求單流失：建諮詢訂單後開立諮詢費 Invoice
  - 待諮詢取消：諮詢訂單 MUST NOT 開立 Invoice，無需 SalesAllowance

#### Scenario: issue_now 不做大貨諮詢訂單建立時開立 Invoice

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、諮詢結束選「不做大貨」
- **WHEN** 系統建立諮詢訂單
- **THEN** 諮詢訂單 SHALL 立即開立 Invoice（金額 = 諮詢費）
- **AND** 諮詢訂單狀態 SHALL 推進至「已開發票」、再推進至「訂單完成」

#### Scenario: issue_now 做大貨需求單成交一般訂單立即開諮詢費發票

- **GIVEN** ConsultationRequest `consultation_invoice_option = issue_now`、諮詢結束選「做大貨」、需求單成交業務轉訂單
- **WHEN** 系統建立一般訂單並轉移 Payment
- **THEN** 系統 SHALL 在一般訂單上立即開立諮詢費 Invoice（金額 = 諮詢費，與主訂單其他 Invoice 獨立）
- **AND** 業務後續 SHALL 於一般訂單上開立其他 Invoice 涵蓋「印件費 + 其他非諮詢費 OrderExtraCharge」

#### Scenario: defer_to_main_order 做大貨主訂單合併開票

- **GIVEN** ConsultationRequest `consultation_invoice_option = defer_to_main_order`、需求單成交業務轉訂單
- **WHEN** 一般訂單建立、Payment 轉移、進入正常 Invoice 開立流程
- **THEN** 業務 SHALL 開立 Invoice 涵蓋一般訂單全額（含諮詢費 OrderExtraCharge）
- **AND** 系統 MUST NOT 將諮詢費獨立成單張 Invoice

---

### Requirement: 諮詢單列表與檢視

系統 SHALL 提供諮詢單列表頁，依 `created_at` ASC 排序（最早優先）。業務、業務主管、諮詢人員 SHALL 可檢視諮詢單列表，並支援狀態篩選 Tab（全部 / 待諮詢 / 已轉需求單 / 完成諮詢 / 已取消）。

#### Scenario: 諮詢人員檢視待辦諮詢單

- **WHEN** 諮詢人員登入並進入諮詢單列表頁
- **THEN** 系統 SHALL 預設篩選「`consultant_id = self` AND `status = 待諮詢`」
- **AND** 列表 SHALL 顯示：諮詢單編號、客戶聯絡人、預約日期 / 時間、預計製作數量級距、狀態、關聯需求單編號（若已轉）

---

### Requirement: 諮詢單活動紀錄

系統 SHALL 記錄 ConsultationRequest 的所有操作歷程（webhook 自動建單、指派諮詢人員、開始諮詢、結束諮詢、轉需求單、需求單流失觸發建諮詢訂單、轉諮詢訂單、取消等），供稽核與追溯。

#### Scenario: 查閱諮詢單活動紀錄

- **WHEN** 使用者於諮詢單詳情頁查看活動紀錄
- **THEN** 系統 SHALL 顯示完整操作歷程（操作人、操作時間、事件描述）

---

## Open Questions

5 個原始 OQ 已於 2026-05-06 全部解答完畢：

- OQ #1（欄位帶入）→ 本 spec § 諮詢單轉需求單欄位帶入 + design.md D7
- OQ #2（退款）→ design.md D2、本 spec § 諮詢取消觸發建諮詢訂單與退費
- OQ #3（諮詢角色）→ design.md OQ #3 章節 + user-roles spec
- OQ #4（諮詢逾時）→ Phase 1 不實作自動結案，業務人工判斷
- OQ #5（級距校驗）→ 不校驗，級距僅作預填參考、諮詢費為固定金額
