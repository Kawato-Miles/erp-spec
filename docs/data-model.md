# ERP 全局資料模型（Data Model）

> **維護者**：PM（Miles）
> **用途**：Prototype 設計參考、與開發及主管確認欄位邏輯
> **注意**：本文件以業務語意為主；詳細 schema（constraints、index、migration）由開發維護。
> 欄位以**中文名稱**為主要顯示，英文鍵名為開發對照參考。
>
> 最後更新：2026-02-23（工序主檔 v1 完成；QuoteRequest 新增 negotiation_note）

---

## 目錄

| 模組 | 狀態 | 主要資料表 |
|------|------|-----------|
| [廠客管理（CRM）](#crm) | 最小必要版 | 客戶 |
| [工序主檔](#process) | ✅ 設計完成（v1）| 工序 |
| [需求單](#quote-request) | ✅ 設計完成（v0.6）| 需求單、需求單印件項目、需求單印件工序、印件項目附件、報價紀錄、活動紀錄、相似案件連結 |
| [訂單](#order) | 🔲 Scaffold | 訂單、訂單項目 |
| [工單](#work-order) | 🔲 Scaffold | 工單 |
| [印件](#print-item) | 🔲 Scaffold | 印件 |
| [任務](#task) | 🔲 Scaffold | 任務 |
| [生產任務](#production-task) | 🔲 Scaffold | 生產任務、報工紀錄 |
| [QC 單](#qc) | 🔲 Scaffold | QC 單、QC 明細 |
| [出貨單](#shipment) | 🔲 Scaffold | 出貨單、出貨明細 |

---

## 模組關聯圖

```
客戶（CRM）
  └─ 1:N ── 需求單
               ├─ 1:N ── 需求單印件項目
               │            ├─ 1:N ── 需求單印件工序（評估製程）
               │            │            └─ N:1 ── 工序
               │            └─ 1:N ── 印件項目附件
               ├─ 1:N ── 報價紀錄
               ├─ 1:N ── 活動紀錄
               ├─ M:N ── 相似案件連結（自關聯）
               └─ 0:1 ── 訂單（成交後建立）

訂單
  ├─ 1:N ── 印件
  │            └─ 1:N ── 工單
  │                        └─ 1:N ── 任務
  │                                    └─ 1:N ── 生產任務
  │                                                ├─ N:1 ── 工序
  │                                                └─ 1:N ── 報工紀錄
  ├─ 1:N ── QC 單
  │            └─ 1:N ── QC 明細（per 生產任務）
  └─ 1:N ── 出貨單
               └─ 1:N ── 出貨明細（per 印件）
```

---

## 廠客管理（CRM）<a name="crm"></a>

> 最小必要版 — 僅列需求單、訂單等模組所需的參照欄位。完整 CRM 功能待後續規劃。

### 客戶（Customer）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | 唯一識別碼 | PK |
| 公司名稱 | `company_name` | varchar(200) | 客戶公司名稱 | |
| 簡稱 | `short_name` | varchar(50) | 顯示用簡稱 | 選填 |
| 聯絡人姓名 | `contact_name` | varchar(100) | 主要聯絡人 | |
| 聯絡電話 | `contact_phone` | varchar(30) | | |
| 聯絡 Email | `contact_email` | varchar(200) | | 選填 |
| 地址 | `address` | varchar(500) | | 選填 |
| 發票類型 | `invoice_type` | enum | 電子發票 / 紙本 / 免開 | 待 QR-001 確認選項 |
| 備註 | `notes` | text | | 選填 |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

---

## 工序主檔<a name="process"></a>

> 設計完成（v1）。以實際 Ragic 工單使用的製程分類為基礎，進行資料治理（Data Governance）。
> 工廠產能優化相關欄位（`setup_minutes`、`can_batch_merge`）待 XM-003 確認後啟用。

### 製程分類代碼表

> 17 個標準分類，來源：現行工單實際製程結構。

| 代碼 | 中文名稱 | 說明 | 欄位群組 |
|------|---------|------|---------|
| 01 | 印前 | 印刷前置作業（拼版、色稿確認等）| A |
| 02 | 製版 | 製作印版或底片 | A |
| 03A | 紙張 | 紙材採購 / 領料 | A |
| 03B | 原料 | 非紙材原料（封面膠布、特殊材料等）| A |
| 04A | 數位 | 數位印刷（噴墨、數位彩色等）| A |
| 04B | 印刷 | 傳統印刷（平版、網版等）| B |
| 05 | 上光 | 表面上光 / 覆膜 | C |
| 06 | 軋工 | 軋型 / 壓凹凸 | C |
| 07 | 燙工 | 燙金 / 燙銀 / 燙色 | C |
| 08 | 裝訂 | 騎馬釘 / 膠裝 / 精裝等 | C |
| 09 | 裱紙 | 裱貼 / 裱板 | C |
| 10 | 糊盒 | 包裝盒糊製 | C |
| 11 | 手工 | 人工後加工（折疊、組裝等）| C |
| 12 | 運送 | 工序間運送費用 | C |
| 13 | 裁摺 | 裁切 / 摺疊 | C |
| 14 | 刀模 | 刀模費用（新刀 / 舊刀）| C |
| 15 | 自訂 | 其他自訂工序 | C |
| 16 | 包裝 | 最終包裝（OPP 袋、裝箱等）| C |

### 欄位群組說明

> 製程分類決定記錄實際執行成本時使用的欄位組。開發設計工單成本記錄 UI 時依此分組顯示對應欄位。

| 欄位群組 | 適用製程代碼 | 主要差異欄位 |
|---------|------------|------------|
| A | 01、02、03A、03B、04A | 紙材、紙大、正 / 反面印刷色、1車幾色、一份幾張、印幾份、實數（車）、放損耗（切割） |
| B | 04B | 印刷尺寸、印刷色別、印刷台數、印刷實數、放損數量、車數選擇 |
| C | 05～16 | 發單圖（刀模）、模數（裝訂/裁摺）、刀模編號與新舊刀 |

> ⚠️ 欄位群組為工單成本記錄（PrintItemProcessRecord）的設計依據，該資料表待工單 Spec 撰寫時細化。

### 工序（Process）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | 唯一識別碼 | PK |
| 製程分類代碼 | `category_code` | varchar(5) | 01 / 02 / 03A / 03B / 04A / 04B / 05～16 | 對應分類代碼表 |
| 製程分類名稱 | `category_name` | varchar(50) | 由代碼帶入，例：印前、製版、數位、燙工 | 唯讀，系統自動 |
| 工序代碼 | `code` | varchar(30) | 內部識別碼（例：04A-數位大台小張-2025）| 唯一值 |
| 工序名稱 | `name` | varchar(200) | 顯示名稱（例：數位印刷-大台-小張、燙銀 MS-01）| |
| 欄位群組 | `field_group` | enum | A / B / C | 決定工單成本記錄使用的欄位組；見群組說明表 |
| 適用工廠類型 | `factory_type` | enum | 自有工廠 / 加工廠 / 兩者皆可 | |
| 牌價單位 | `price_unit` | varchar(20) | 張 / 份 / 批 / 件 | 與標準成本搭配使用 |
| 標準成本 / 單位 | `standard_cost_per_unit` | decimal(10,2) | 帶入需求單報價成本預估（FR-011a）| 供印務主管評估參考；可覆寫 |
| 換工準備時間（分）| `setup_minutes` | int | 合批計算用（⚠️ 待 XM-003 確認後啟用）| 選填 |
| 每單位預估工時（分）| `estimated_minutes_per_unit` | int | 產能計算用 | 選填 |
| 支援合批派工 | `can_batch_merge` | boolean | 允許同工序生產任務合批（⚠️ 待 XM-003）| |
| 備註 | `notes` | text | | 選填 |
| 啟用狀態 | `is_active` | boolean | | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

---

## 需求單<a name="quote-request"></a>

> 設計完成（v0.6）。詳細業務規則見 `spec-quote-request.md`。

### 需求單（QuoteRequest）主表

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 需求單號 | `quote_no` | | ✓ | ✓ | 字串（varchar 20） | 格式：Q-YYYYMMDD-XX | 系統自動產生 |
| 案名 | `title` | | ✓ | | 字串（varchar 200） | 需求案名 | |
| 狀態 | `status` | | ✓ | | 單選（enum） | 需求確認中 / 待評估報價 / 已評估報價 / 已提供報價 / 議價中 / 成交 / 流失 | |
| 客戶 | `customer_id` | | ✓ | | FK | 從廠客管理取最新資料，不快照 | FK → 客戶 |
| 詢問來源 | `inquiry_source` | | ✓ | | 單選（enum） | Line / Email / 電話 / 現場 / 其他 | |
| 期望交期 | `expected_delivery_date` | | | | 日期（date） | 客戶期望交期 | |
| 發票類型 | `invoice_type` | | | | 單選（enum） | 繼承自客戶預設值，可覆寫 | 待 QR-001 |
| 關聯訂單 | `linked_order_id` | | | | FK | 成交後系統自動寫入 | FK → 訂單 |
| 流失原因 | `lost_reason` | | | | 單選（enum） | 狀態為「流失」時必填 | 待 QR-002 |
| 流失補充說明 | `lost_note` | | | | 文本（text） | | |
| 議價備註 | `negotiation_note` | | | | 文本（text） | 議價過程的補充說明；狀態為「議價中」時可填寫 | QR-004 ✅ |
| Slack 訊息連結 | `slack_thread_url` | | | | 字串（varchar 500） | Webhook 通知成功後自動回填 | |
| 接單業務 | `sales_id` | | ✓ | | FK | | FK → 使用者 |
| 聯絡人姓名 | `primary_contact` | | | | 字串（varchar 100） | 可從客戶資料帶入，或手動填寫 | |
| 報價截止日 | `quote_deadline` | | | | 日期（date） | 截止前 1 天通知業務 | |
| 交貨備註 | `delivery_note` | | | | 文本（text） | 成交後轉訂單時帶入 | |
| 訂單備註 | `order_note` | | | | 文本（text） | 成交後轉訂單時帶入 | |
| 提供報價時間 | `quote_provided_at` | | ✓ | ✓ | 日期時間（datetime） | 執行「對外提供報價」時系統自動記錄 | 唯讀，系統自動生成 |
| 備註 | `notes` | | | | 文本（text） | | |
| 建立時間 | `created_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 更新時間 | `updated_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 建立者 | `created_by` | | ✓ | ✓ | FK | | FK → 使用者，系統自動紀錄 |

### 需求單印件項目（QuoteRequestItem）

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 項目編號 | `item_no` | | ✓ | ✓ | 字串（varchar 30） | 格式：`{quote_no}-{seq}`（例：Q-20260127-02-1） | 系統自動產生 |
| 所屬需求單 | `quote_request_id` | | ✓ | ✓ | FK | | FK → 需求單 |
| 項次 | `seq` | | ✓ | | 整數（int） | 排序用，可調整 | |
| 印件名稱 | `name` | | ✓ | | 字串（varchar 200） | | |
| 印件類型 | `item_type` | | ✓ | | 單選（enum） | 卡類 / DM / 書冊 / 摺頁… | 待 QR-003 確認選項 |
| 規格備註 | `spec_note` | | ✓ | | 文本（text） | 尺寸、紙材、印刷方式、加工等 | |
| 數量 | `quantity` | | ✓ | | 小數（decimal 12,2） | | |
| 單位 | `unit` | | | | 字串（varchar 20） | 批 / 張 / 個 / 冊 | |
| 預計製程 | `planned_process_id` | | | | FK | 印務主管選擇；帶入工序標準成本 / 單位 × 數量 | FK → 工序；見 FR-011a |
| 成本預估 | `cost_estimate` | | | | 小數（decimal 12,2） | 由印務主管填入 / 系統帶入；觸發「評估完成」時必填 | 歷史版本透過報價紀錄追蹤 |
| 報價倍數 | `price_multiplier` | | | | 小數（decimal 5,2） | 成本 × 倍數 = 定價參考 | |
| 報價單價（未稅） | `price_per_unit` | | | | 小數（decimal 10,2） | 業務可覆寫 | |
| 費用（未稅） | `amount_excl_tax` | | | ✓ | 小數（decimal 12,2） | = 單價 × 數量 | 系統自動計算 |
| 稅額 | `tax_amount` | | | ✓ | 小數（decimal 12,2） | = 費用 × 稅率（預設 5%） | 系統自動計算 |
| 含稅總額 | `total_incl_tax` | | | ✓ | 小數（decimal 12,2） | | 系統自動計算 |
| 出貨方式 | `delivery_method` | | | | 字串（varchar 100） | 整疊 / 折好 / TBD | |
| 包裝說明 | `packaging_note` | | | | 文本（text） | | |
| 建立時間 | `created_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 更新時間 | `updated_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |

### 需求單印件工序（QuoteRequestItemProcess）

> 在評估報價時，一個印件項目通常需要經過多道工序完成。本表記錄該印件項目預計使用的所有工序及其順序，供成本評估與製程溝通使用。

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 所屬印件項目 | `quote_item_id` | | ✓ | ✓ | FK | | FK → 需求單印件項目 |
| 工序 | `process_id` | | ✓ | | FK | | FK → 工序 |
| 工序順序 | `seq` | | ✓ | | 整數（int） | 製程執行順序 | 由系統或使用者設定 |
| 成本預估 | `cost_estimate` | | | | 小數（decimal 12,2） | 該工序的成本預估 | 由印務主管填入；整個印件項目的成本預估為所有工序成本之和 |
| 備註 | `notes` | | | | 文本（text） | | 選填 |
| 建立時間 | `created_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 更新時間 | `updated_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |

### 印件項目附件（QuoteRequestItemAttachment）

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 所屬印件項目 | `item_id` | | ✓ | ✓ | FK | | FK → 需求單印件項目 |
| 檔案類型 | `file_type` | | ✓ | | 單選（enum） | image / pdf | |
| 檔案路徑 | `file_url` | | ✓ | | 字串（varchar 1000） | | |
| 檔案名稱 | `filename` | | ✓ | | 字串（varchar 200） | 顯示用 | |
| 檔案大小（KB） | `file_size_kb` | | ✓ | ✓ | 整數（int） | | 系統自動計算，唯讀 |
| 上傳者 | `uploaded_by` | | ✓ | ✓ | FK | | FK → 使用者，系統自動紀錄 |
| 上傳時間 | `uploaded_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |

### 報價紀錄（QuoteRequestPriceLog）

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 所屬需求單 | `quote_request_id` | | ✓ | ✓ | FK | | FK → 需求單 |
| 評估者 | `evaluated_by` | | ✓ | ✓ | FK | 印務主管 | FK → 使用者，系統自動紀錄 |
| 評估時間 | `evaluated_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 印件快照 | `items_snapshot` | | ✓ | ✓ | JSON | 各印件當下的預計製程、成本預估、倍數、報價單價快照 | 系統自動紀錄，不可編輯 |
| 評估備註 | `notes` | | | | 文本（text） | | |

### 活動紀錄（QuoteRequestActivityLog）

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 所屬需求單 | `quote_request_id` | | ✓ | ✓ | FK | | FK → 需求單 |
| 操作者 | `actor_id` | | ✓ | ✓ | FK | 系統自動事件填 `system` | FK → 使用者，系統自動紀錄 |
| 事件類型 | `action_type` | | ✓ | ✓ | 單選（enum） | 狀態異動 / 欄位修改 / 系統事件 | 系統自動紀錄 |
| 事件描述 | `description` | | ✓ | ✓ | 文本（text） | | 系統自動紀錄 |
| 變更詳情 | `diff` | | | ✓ | JSON | 欄位舊值 / 新值（欄位修改類） | 系統自動紀錄 |
| 發生時間 | `created_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |

### 相似案件連結（QuoteRequestReference）

> 業務 / 諮詢可在新需求單中連結過去相似案件，供報價時參考歷史成本與售價。

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 需求單 | `quote_request_id` | | ✓ | ✓ | FK | 發起連結的需求單 | FK → 需求單 |
| 參考需求單 | `referenced_quote_request_id` | | ✓ | | FK | 被參考的歷史需求單 | FK → 需求單 |
| 建立時間 | `created_at` | | ✓ | ✓ | 日期時間（datetime） | | 系統自動生成，唯讀 |
| 建立者 | `created_by` | | ✓ | ✓ | FK | | FK → 使用者，系統自動紀錄 |

---

## 訂單<a name="order"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。

### 訂單（Order）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 訂單號 | `order_no` | varchar(20) | 系統自動產生 | |
| 來源需求單 | `quote_request_id` | FK → 需求單 | 選填（線上訂單可無）| |
| 客戶 | `customer_id` | FK → 客戶 | | |
| 訂單類型 | `order_type` | enum | 線下 / 線上（EC）| |
| 狀態 | `status` | enum | 依狀態機設計 | 見 state-machines.md |
| 付款狀態 | `payment_status` | enum | 未付款 / 已付款 / 部分退款 / 已退款 | 待 ORD-002 |
| 負責業務 | `sales_id` | FK → 使用者 | | |
| 回簽時間 | `signed_at` | datetime | 線下訂單用 | |
| 付款時間 | `paid_at` | datetime | 線上訂單用 | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

### 訂單項目（OrderItem）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬訂單 | `order_id` | FK → 訂單 | | |
| 來源印件項目 | `quote_request_item_id` | FK → 需求單印件項目 | 選填 | |
| 品項名稱 | `name` | varchar(200) | | |
| 數量 | `quantity` | int | | |
| 成交單價 | `unit_price` | decimal(10,2) | | |

---

## 工單<a name="work-order"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。

### 工單（WorkOrder）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 工單號 | `wo_no` | varchar(20) | | |
| 所屬印件 | `print_item_id` | FK → 印件 | | |
| 工單類型 | `type` | enum | 打樣 / 大貨 | |
| 狀態 | `status` | enum | 依狀態機設計 | 見 state-machines.md |
| 負責排程人員 | `assigned_to` | FK → 使用者 | | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

---

## 印件<a name="print-item"></a>

> 🔲 Scaffold — 詳細設計待 Spec 撰寫。

### 印件（PrintItem）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬訂單 | `order_id` | FK → 訂單 | | |
| 對應訂單項目 | `order_item_id` | FK → 訂單項目 | | |
| 類型 | `type` | enum | 打樣 / 大貨 | |
| 審稿狀態 | `review_status` | enum | 依狀態機 | 見 state-machines.md |
| 印製狀態 | `production_status` | enum | 依狀態機 | 見 state-machines.md |
| 打樣結果 | `proof_result` | enum | OK / NG / 待確認 | 打樣印件用 |
| 稿件鎖定工單 | `file_lock_wo_id` | FK → 工單 | 工單建立時鎖定 | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

---

## 任務<a name="task"></a>

> 🔲 Scaffold — 任務為派發給工廠的執行單位。

### 任務（Task）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬工單 | `work_order_id` | FK → 工單 | | |
| 工序 | `process_id` | FK → 工序 | | |
| 工廠類型 | `factory_type` | enum | 自有工廠 / 加工廠 / 外包廠 | |
| 狀態 | `status` | enum | 依狀態機 | 見 state-machines-ops.md |
| 目標數量 | `target_quantity` | int | | |
| 預計執行日 | `scheduled_date` | date | 產能優化關鍵欄位（XM-003）| |
| 合批群組 ID | `batch_group_id` | varchar(50) | 同工序合批派工時使用 | 待 XM-003 確認 |
| 指派工廠 | `assigned_factory` | varchar(200) | | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

---

## 生產任務<a name="production-task"></a>

> 🔲 Scaffold — 最小生產追蹤單位。

### 生產任務（ProductionTask）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬任務 | `task_id` | FK → 任務 | | |
| 工序 | `process_id` | FK → 工序 | 冗餘存儲，便於查詢 | |
| 工廠類型 | `factory_type` | enum | 自有工廠 / 加工廠 / 外包廠 | |
| 狀態 | `status` | enum | 依狀態機 | 見 state-machines-ops.md |
| 目標數量 | `target_quantity` | int | | |
| 完成數量 | `completed_quantity` | int | 報工累計 | |
| 預計執行日 | `scheduled_date` | date | 產能優化合批時間窗口 | |
| 建立時間 | `created_at` | datetime | | |
| 更新時間 | `updated_at` | datetime | | |

### 報工紀錄（ProductionTaskWorkRecord）

> 師傅 / 廠商每日報工的紀錄，用於追蹤生產進度、投入工時與成本。一個生產任務可有多筆報工紀錄（對應多次報工）。

| 中文名稱 | 英文鍵名 | PK | 必填 | 唯讀 | 型別 | 說明 | 備註 |
|---------|---------|:--:|:--:|:--:|------|------|------|
| 系統 ID | `id` | ✓ | ✓ | ✓ | UUID | 唯一識別碼 | 系統自動生成，前台不顯示 |
| 所屬生產任務 | `production_task_id` | | ✓ | | FK | | FK → 生產任務 |
| 工序 | `process_id` | | ✓ | ✓ | FK | 冗餘存儲，便於查詢 | FK → 工序，系統自動帶入 |
| 報工數量 | `reported_quantity` | | ✓ | | 整數（int） | 本次報工完成的數量 | |
| 報工工時（分） | `reported_minutes` | | | | 整數（int） | 本次投入的工時（分鐘） | 選填；與工序的 `estimated_minutes_per_unit` 對比 |
| **A 群組成本欄位** | | | | | | — | 適用製程 01, 02, 03A, 03B, 04A |
| 紙材 | `material_type_a` | | | | varchar(100) | 使用的紙張 / 原料名稱 | 選填 |
| 紙大 | `paper_size_a` | | | | varchar(50) | 紙張規格 | 選填 |
| 印刷色數 | `print_colors_a` | | | | int | 印刷色別數 | 選填 |
| 印刷數量 | `print_quantity_a` | | | | int | 實際印刷數量 | 選填 |
| 損耗數量 | `waste_quantity_a` | | | | int | 切割 / 廢料損耗 | 選填 |
| A 群組成本 | `cost_a` | | | | decimal(12,2) | 該工序產生的成本（A 群組） | 選填 |
| **B 群組成本欄位** | | | | | | — | 適用製程 04B（傳統印刷） |
| 印刷尺寸 | `print_size_b` | | | | varchar(50) | 印刷幅面 | 選填 |
| 印刷台數 | `print_units_b` | | | | int | 使用的印刷台數 | 選填 |
| 印刷數量 | `print_quantity_b` | | | | int | 實際印刷數量 | 選填 |
| 損耗數量 | `waste_quantity_b` | | | | int | 放損數量 | 選填 |
| B 群組成本 | `cost_b` | | | | decimal(12,2) | 該工序產生的成本（B 群組） | 選填 |
| **C 群組成本欄位** | | | | | | — | 適用製程 05～16（後加工 / 特殊工序） |
| 刀模編號 | `die_cut_no_c` | | | | varchar(100) | 使用的刀模編號 | 選填 |
| 刀模新舊 | `die_cut_status_c` | | | | enum | 新刀 / 舊刀 | 選填 |
| 加工模數 | `module_count_c` | | | | int | 模數（裝訂 / 裁摺用） | 選填 |
| 加工數量 | `process_quantity_c` | | | | int | 實際加工數量 | 選填 |
| C 群組成本 | `cost_c` | | | | decimal(12,2) | 該工序產生的成本（C 群組） | 選填 |
| 缺陷數量 | `defect_count` | | | | 整數（int） | 本次報工中發現的缺陷數量 | 選填 |
| 報工備註 | `notes` | | | | 文本（text） | | 選填 |
| 報工人員 | `reported_by` | | ✓ | ✓ | FK | 師傅 / 廠商 | FK → 使用者，系統自動紀錄 |
| 報工時間 | `reported_at` | | ✓ | ✓ | 日期時間（datetime） | 報工紀錄產生時間 | 系統自動生成，唯讀 |

---

## QC 單<a name="qc"></a>

> 🔲 Scaffold — 詳細設計見 state-machines-ops.md。

### QC 單（QCRecord）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬訂單 | `order_id` | FK → 訂單 | | |
| 狀態 | `status` | enum | 依狀態機 | 見 state-machines-ops.md |
| 建立者 | `created_by` | FK → 使用者 | 印務 | |
| QC 執行人員 | `assigned_to` | FK → 使用者 | | |
| 建立時間 | `created_at` | datetime | | |

### QC 明細（QCDetail，per 生產任務）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬 QC 單 | `qc_record_id` | FK → QC 單 | | |
| 對應生產任務 | `production_task_id` | FK → 生產任務 | | |
| 生產數量 | `production_quantity` | int | | |
| 通過數量 | `passed_quantity` | int | | |
| 不通過數量 | `failed_quantity` | int | | |
| 不通過原因 | `notes` | text | | 選填 |

---

## 出貨單<a name="shipment"></a>

> 🔲 Scaffold — 出貨單位於訂單層；支援多印件合併出貨。

### 出貨單（Shipment）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 出貨單號 | `shipment_no` | varchar(20) | | |
| 所屬訂單 | `order_id` | FK → 訂單 | | |
| 狀態 | `status` | enum | 依狀態機 | 見 state-machines-ops.md |
| 物流商 | `logistics_provider` | varchar(100) | | 選填 |
| 物流追蹤號 | `tracking_no` | varchar(100) | | 選填 |
| 出貨時間 | `shipped_at` | datetime | | |
| 建立時間 | `created_at` | datetime | | |

### 出貨明細（ShipmentItem，per 印件）

| 中文名稱 | 英文鍵名 | 型別 | 說明 | 備註 |
|---------|---------|------|------|------|
| 系統 ID | `id` | UUID | PK | |
| 所屬出貨單 | `shipment_id` | FK → 出貨單 | | |
| 對應印件 | `print_item_id` | FK → 印件 | | |
| 出貨數量 | `quantity` | int | | |
