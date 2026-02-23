# ERP 全局資料模型（Data Model）

> **維護者**：PM（Miles）
> **用途**：Prototype 設計參考、與開發及主管確認欄位邏輯
> **注意**：本文件以業務語意為主；詳細 schema（constraints、index、migration）由開發維護。
>
> 最後更新：2026-02-23

---

## 目錄

| 模組 | 狀態 | 主要資料表 |
|------|------|-----------|
| [廠客管理（CRM）](#crm) | 最小必要版 | Customer |
| [工序主檔](#process) | ⚠️ 欄位待補（附圖）| Process |
| [需求單](#quote-request) | ✅ 設計完成 | QuoteRequest, QuoteRequestItem, QuoteRequestItemAttachment, QuoteRequestPriceLog, QuoteRequestActivityLog |
| [訂單](#order) | 🔲 Scaffold | Order, OrderItem |
| [工單](#work-order) | 🔲 Scaffold | WorkOrder |
| [印件](#print-item) | 🔲 Scaffold | PrintItem |
| [任務](#task) | 🔲 Scaffold | Task |
| [生產任務](#production-task) | 🔲 Scaffold | ProductionTask |
| [QC 單](#qc) | 🔲 Scaffold | QCRecord, QCDetail |
| [出貨單](#shipment) | 🔲 Scaffold | Shipment, ShipmentItem |

---

## 模組關聯圖

```
Customer (CRM)
  └─ 1:N ── QuoteRequest
               └─ 1:N ── QuoteRequestItem
               │            └─ 1:N ── QuoteRequestItemAttachment
               ├─ 1:N ── QuoteRequestPriceLog
               ├─ 1:N ── QuoteRequestActivityLog
               └─ 0:1 ── Order（成交後建立）

Order
  ├─ 1:N ── PrintItem
  │            └─ 1:N ── WorkOrder
  │                        └─ 1:N ── Task
  │                                    └─ 1:N ── ProductionTask
  │                                                └─ N:1 ── Process（工序主檔）
  ├─ 1:N ── QCRecord
  │            └─ 1:N ── QCDetail（per PrintItem）
  └─ 1:N ── Shipment
               └─ 1:N ── ShipmentItem（per PrintItem）
```

---

## 廠客管理（CRM）<a name="crm"></a>

> 最小必要版 — 僅列需求單、訂單等模組所需的參照欄位。完整 CRM 功能待後續規劃。

### Customer（客戶）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `company_name` | varchar(200) | 客戶公司名稱 | |
| `short_name` | varchar(50) | 簡稱（顯示用） | 選填 |
| `contact_name` | varchar(100) | 主要聯絡人姓名 | |
| `contact_phone` | varchar(30) | 聯絡電話 | |
| `contact_email` | varchar(200) | 聯絡 Email | 選填 |
| `address` | varchar(500) | 地址 | 選填 |
| `invoice_type` | enum | 發票類型（電子發票 / 紙本 / 免開）| 待 QR-001 確認選項 |
| `notes` | text | 備註 | 選填 |
| `created_at` | datetime | 建立時間 | |
| `updated_at` | datetime | 最後更新時間 | |

---

## 工序主檔<a name="process"></a>

> ⚠️ 欄位設計待補（Miles 附圖確認後更新）。下列為已知最小欄位；工廠產能優化相關欄位待 XM-003 確認後補充。

### Process（工序）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `code` | varchar(20) | 工序代碼（短代碼，內部使用）| 唯一值 |
| `name` | varchar(100) | 工序名稱（例：平版印刷、裁切、騎馬釘裝）| |
| `category` | enum | 工序分類（印刷 / 裁切 / 裝訂 / 後加工 / 其他）| TBD — 待附圖確認 |
| `factory_type` | enum | 適用工廠類型（自有工廠 / 加工廠 / 外包廠 / 全部）| |
| `estimated_minutes_per_unit` | int | 每單位預估工時（分鐘）| 供產能優化計算用 |
| `setup_minutes` | int | 每次準備時間（分鐘）| 供合批計算用（XM-003）|
| `can_batch_merge` | boolean | 是否支援同工序合批派工 | 產能優化（XM-003）|
| `notes` | text | 備註 | 選填 |
| `is_active` | boolean | 是否啟用 | |
| `created_at` | datetime | 建立時間 | |
| `updated_at` | datetime | 最後更新時間 | |

> **其他待補欄位**：請補上附圖後，依圖中欄位定義更新本節。

---

## 需求單<a name="quote-request"></a>

> 設計完成（v0.4）。詳細業務規則見 `spec-quote-request.md`。

### QuoteRequest（需求單主表）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `quote_no` | varchar(20) | 顯示用流水號（Q-YYYYMMDD-XX）| 系統自動產生 |
| `title` | varchar(200) | 需求案名 | |
| `status` | enum | 需求確認中 / 待評估報價 / 已評估報價 / 已提供報價 / 議價中 / 成交 / 流失 | |
| `customer_id` | FK → Customer | 客戶（從 CRM 取最新資料，不快照）| |
| `inquiry_source` | enum | 詢問管道（Line / Email / 電話 / 現場 / 其他）| |
| `expected_delivery_date` | date | 客戶期望交期 | 選填 |
| `invoice_type` | enum | 發票類型（繼承自 Customer，可覆蓋）| 待 QR-001 |
| `linked_order_id` | FK → Order | 成交後關聯訂單（系統自動寫入）| 選填 |
| `lost_reason` | enum | 流失原因 | 待 QR-002；狀態為「流失」時必填 |
| `lost_note` | text | 流失補充說明 | 選填 |
| `slack_thread_url` | varchar(500) | 建立時送出的 Slack Webhook URL（自動回填）| |
| `sales_id` | FK → User | 接單業務 | |
| `primary_contact` | varchar(100) | 主要聯絡人姓名（手動填入，可從 CRM 帶入）| 選填 |
| `quote_deadline` | date | 報價截止日 | 選填；截止前 1 天通知業務 |
| `expected_delivery_date` | date | 客戶期望交期 | 選填 |
| `delivery_note` | text | 交貨備註（成交後轉訂單時帶入）| 選填 |
| `order_note` | text | 訂單備註（成交後轉訂單時帶入）| 選填 |
| `experience_note` | text | 報價經驗傳承（文字或 URL，供相似案件參考）| 選填 |
| `quote_provided_at` | datetime | 對外提供報價時間（系統自動記錄，不可修改）| 執行「提供報價」時自動寫入 |
| `notes` | text | 備註 | 選填 |
| `created_at` | datetime | 建立時間 | |
| `updated_at` | datetime | 最後更新時間 | |
| `created_by` | FK → User | 建立者 | |

### QuoteRequestItem（需求單印件項目）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `item_no` | varchar(30) | 顯示用編號（`{quote_no}-{seq}`，例：Q-20260127-02-1）| 系統自動產生 |
| `quote_request_id` | FK → QuoteRequest | 所屬需求單 | |
| `seq` | int | 項次（排序用，可調整）| |
| `name` | varchar(200) | 印件項目名稱 | |
| `item_type` | enum | 印件類型（卡類 / DM / 書冊 / 摺頁...）| 待 QR-003 確認選項 |
| `spec_note` | text | 規格備註（尺寸、紙材、印刷方式、加工等）| |
| `quantity` | int | 需求數量 | |
| `cost_estimate` | decimal(12,2) | 成本預估（由印務主管填入）| 觸發「評估完成」時必填；歷史版本透過 PriceLog 追蹤 |
| `price_per_unit` | decimal(10,2) | 報價單價（未稅），業務可覆寫 | 選填 |
| `price_multiplier` | decimal(5,2) | 報價倍數（成本 × 倍數 = 定價參考）| 選填 |
| `quantity` | decimal(12,2) | 數量 | 選填 |
| `unit` | varchar(20) | 單位（批 / 張 / 個 / 冊）| 選填 |
| `amount_excl_tax` | decimal(12,2) | 費用未稅（= 單價 × 數量，系統計算）| 系統自動計算 |
| `tax_amount` | decimal(12,2) | 稅額（= 費用 × 稅率，預設 5%）| 系統自動計算 |
| `total_incl_tax` | decimal(12,2) | 含稅總金額（系統計算）| 系統自動計算 |
| `delivery_method` | varchar(100) | 出貨方式（整疊 / 折好 / TBD）| 選填 |
| `packaging_note` | text | 包裝說明 | 選填 |
| `created_at` | datetime | 建立時間 | |
| `updated_at` | datetime | 最後更新時間 | |

### QuoteRequestItemAttachment（印件項目附件）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `item_id` | FK → QuoteRequestItem | 所屬印件項目 | |
| `file_type` | enum | 檔案類型（image / pdf）| |
| `file_url` | varchar(1000) | 檔案儲存路徑 | |
| `filename` | varchar(200) | 顯示用檔案名稱 | |
| `file_size_kb` | int | 檔案大小（KB）| |
| `uploaded_by` | FK → User | 上傳者 | |
| `uploaded_at` | datetime | 上傳時間 | |

### QuoteRequestPriceLog（報價紀錄）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `quote_request_id` | FK → QuoteRequest | 所屬需求單 | |
| `evaluated_by` | FK → User | 評估者（印務主管）| |
| `evaluated_at` | datetime | 評估完成時間 | |
| `items_snapshot` | JSON | 各印件當下的成本預估、倍數、報價單價快照 | |
| `notes` | text | 評估備註 | 選填 |

### QuoteRequestActivityLog（活動紀錄）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | 系統唯一識別碼 | PK |
| `quote_request_id` | FK → QuoteRequest | 所屬需求單 | |
| `actor_id` | FK → User | 操作者（系統事件填 system）| |
| `action_type` | enum | 狀態異動 / 欄位修改 / 系統事件 | |
| `description` | text | 事件描述 | |
| `diff` | JSON | 修改前後值（欄位修改類）| 選填 |
| `created_at` | datetime | 發生時間 | |

---

## 訂單<a name="order"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。欄位以狀態機和已確認的跨模組關聯為基礎。

### Order（訂單）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `order_no` | varchar(20) | 訂單編號 | 系統自動產生 |
| `quote_request_id` | FK → QuoteRequest | 來源需求單 | 選填（線上訂單可無）|
| `customer_id` | FK → Customer | 客戶 | |
| `order_type` | enum | 線下 / 線上（EC）| |
| `status` | enum | 依狀態機設計 | 見 state-machines.md |
| `payment_status` | enum | 未付款 / 已付款 / 部分退款 / 已退款 | 待 ORD-002 |
| `sales_id` | FK → User | 負責業務 | |
| `signed_at` | datetime | 回簽時間（線下）| |
| `paid_at` | datetime | 付款時間（線上）| |
| `created_at` | datetime | | |
| `updated_at` | datetime | | |

### OrderItem（訂單項目）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `order_id` | FK → Order | 所屬訂單 | |
| `quote_request_item_id` | FK → QuoteRequestItem | 來源需求單項目 | 選填 |
| `name` | varchar(200) | 品項名稱 | |
| `quantity` | int | 訂購數量 | |
| `unit_price` | decimal(10,2) | 成交單價 | |

---

## 工單<a name="work-order"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。

### WorkOrder（工單）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `wo_no` | varchar(20) | 工單編號 | |
| `print_item_id` | FK → PrintItem | 所屬印件 | |
| `type` | enum | 打樣 / 大貨 | |
| `status` | enum | 依狀態機設計 | 見 state-machines.md |
| `assigned_to` | FK → User | 負責排程人員 | |
| `created_at` | datetime | | |
| `updated_at` | datetime | | |

---

## 印件<a name="print-item"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。

### PrintItem（印件）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `order_id` | FK → Order | 所屬訂單 | |
| `order_item_id` | FK → OrderItem | 對應訂單項目 | |
| `type` | enum | 打樣 / 大貨 | |
| `review_status` | enum | 審稿狀態（依狀態機）| 見 state-machines.md |
| `production_status` | enum | 印製狀態（依狀態機）| 見 state-machines.md |
| `proof_result` | enum | 打樣結果（OK / NG / 待確認）| 打樣印件用 |
| `file_lock_wo_id` | FK → WorkOrder | 鎖定稿件的工單 | 工單建立時鎖定 |
| `created_at` | datetime | | |
| `updated_at` | datetime | | |

---

## 任務<a name="task"></a>

> 🔲 Scaffold — 任務為派發給各工廠的執行單位，含 1～N 筆生產任務。

### Task（任務）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `work_order_id` | FK → WorkOrder | 所屬工單 | |
| `process_id` | FK → Process | 工序 | |
| `factory_type` | enum | 自有工廠 / 加工廠 / 外包廠 | |
| `status` | enum | 依狀態機設計 | 見 state-machines-ops.md |
| `target_quantity` | int | 目標生產數量 | |
| `scheduled_date` | date | 預計執行日期 | 產能優化關鍵欄位（XM-003）|
| `batch_group_id` | varchar(50) | 合批群組 ID（同工序合批派工時使用）| 待 XM-003 確認後設計 |
| `assigned_factory` | varchar(200) | 指派工廠名稱 | |
| `created_at` | datetime | | |
| `updated_at` | datetime | | |

---

## 生產任務<a name="production-task"></a>

> 🔲 Scaffold — 最小生產追蹤單位，用於計算報工完成數量。

### ProductionTask（生產任務）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `task_id` | FK → Task | 所屬任務 | |
| `process_id` | FK → Process | 工序 | 冗餘存儲，便於查詢 |
| `factory_type` | enum | 自有工廠 / 加工廠 / 外包廠 | |
| `status` | enum | 依狀態機設計 | 見 state-machines-ops.md |
| `target_quantity` | int | 目標數量 | |
| `completed_quantity` | int | 已完成數量（報工累計）| |
| `scheduled_date` | date | 預計執行日期 | 產能優化合批的時間窗口欄位 |
| `created_at` | datetime | | |
| `updated_at` | datetime | | |

---

## QC 單<a name="qc"></a>

> 🔲 Scaffold — 詳細設計見 state-machines-ops.md。

### QCRecord（QC 單）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `order_id` | FK → Order | 所屬訂單 | |
| `status` | enum | 依狀態機設計 | 見 state-machines-ops.md |
| `created_by` | FK → User | 建立者（印務）| |
| `assigned_to` | FK → User | QC 執行人員 | |
| `created_at` | datetime | | |

### QCDetail（QC 明細，per 生產任務）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `qc_record_id` | FK → QCRecord | 所屬 QC 單 | |
| `production_task_id` | FK → ProductionTask | 對應生產任務 | |
| `production_quantity` | int | 生產數量 | |
| `passed_quantity` | int | QC 通過數量 | |
| `failed_quantity` | int | QC 不通過數量 | |
| `notes` | text | 不通過原因 | 選填 |

---

## 出貨單<a name="shipment"></a>

> 🔲 Scaffold — 出貨單位於訂單層；支援多印件合併出貨。

### Shipment（出貨單）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `shipment_no` | varchar(20) | 出貨單編號 | |
| `order_id` | FK → Order | 所屬訂單 | |
| `status` | enum | 依狀態機設計 | 見 state-machines-ops.md |
| `logistics_provider` | varchar(100) | 物流商 | 選填 |
| `tracking_no` | varchar(100) | 物流追蹤號碼 | 選填 |
| `shipped_at` | datetime | 出貨時間 | |
| `created_at` | datetime | | |

### ShipmentItem（出貨明細，per 印件）

| 欄位 | 型別 | 說明 | 備註 |
|------|------|------|------|
| `id` | UUID | PK | |
| `shipment_id` | FK → Shipment | 所屬出貨單 | |
| `print_item_id` | FK → PrintItem | 對應印件 | |
| `quantity` | int | 本次出貨數量 | |
