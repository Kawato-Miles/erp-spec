## ADDED Requirements

### Requirement: 訂單詳情頁客戶溝通備註 section

訂單詳情頁的「資訊 Tab」SHALL 新增「客戶溝通備註」section，容納三個 free-text 欄位：`order_note`（訂單備註）、`delivery_note`（交貨備註）、`payment_note`（付款備註），由業務 / 諮詢在訂單階段填寫對客戶說明的標準化條款。

此 section 與既有「訂單備註三類分欄」Requirement（`customer_note` / `internal_note` / `production_note`）並存：
- **既有三類**：按「來源／可見性」分（員工內部紀錄、客戶不可見）
- **新三類**：按「業務主題」分（訂單條件 / 交貨條件 / 付款條件，供後續匯出至客戶文件）

每個新欄位的 textarea label 列右側 SHALL 顯示「插入常用備註」按鈕，觸發 [NoteTemplatePopover](../prototype-shared-ui/spec.md) 共用元件，業務可多選 seed 模板組合插入備註尾端。

#### Scenario: 訂單詳情頁顯示客戶溝通備註 section

- **GIVEN** 訂單 status >= 訂單建立
- **WHEN** 業務開啟訂單詳情頁切到「資訊 Tab」
- **THEN** 資訊 Tab SHALL 顯示「客戶溝通備註」section
- **AND** section 內 SHALL 包含三個 textarea：訂單備註、交貨備註、付款備註
- **AND** 每個 textarea label 列右側 SHALL 顯示「插入常用備註」按鈕
- **AND** section 標題下方 SHALL 顯示副標題「訂單階段對客戶說明的標準化條款」

#### Scenario: 既有訂單備註 section 與新 section 視覺分組

- **GIVEN** 訂單詳情頁同時顯示既有「訂單備註三類分欄」與新「客戶溝通備註」section
- **THEN** 兩個 section SHALL 在視覺上明確分組（不同 section title、不同位置）
- **AND** 新「客戶溝通備註」section MUST 位於既有「訂單資訊卡」下方
- **AND** 既有 customer_note / internal_note / production_note 區塊保持原有條件顯示邏輯（依 order_source 決定可見性）

#### Scenario: 三個新欄位整批編輯

- **WHEN** 業務點訂單詳情頁的「編輯訂單資訊」按鈕
- **THEN** OrderInfoEditDialog SHALL 新增三個欄位的編輯區（訂單備註 / 交貨備註 / 付款備註）
- **AND** 編輯 dialog 內每個欄位 label 旁 SHALL 顯示「插入常用備註」按鈕
- **AND** 業務 SHALL 可同時編輯多個欄位後一次儲存

---

### Requirement: 訂單階段客戶溝通備註編輯權限與時機

訂單階段新增的三個備註欄位（`order_note` / `delivery_note` / `payment_note`）SHALL 由以下角色可編輯：

| 角色 | 編輯權限 |
|------|---------|
| 業務（訂單 sales_id 對應） | 可編輯 |
| 諮詢 | 可編輯（諮詢轉訂單後仍可補充） |
| 業務主管 | 可編輯（代編場景） |
| 訂單管理人 | 可編輯（進度追蹤時補充客戶溝通記錄） |
| 其他角色（印務 / 出貨 / 會計） | 唯讀 |

編輯時機 SHALL 遵守以下規則：

- 訂單成立後（status >= 訂單建立）且訂單未完成（`completed_at IS NULL`）：三個欄位皆可編輯
- 訂單已完成（`completed_at IS NOT NULL`）：三個欄位 SHALL 鎖定為唯讀，避免訂單結算後改備註影響歷史對帳

對應「插入常用備註」按鈕 SHALL 與 textarea 編輯權限同步（textarea 唯讀時按鈕 disabled）。

#### Scenario: 業務於訂單未完成階段編輯客戶溝通備註

- **GIVEN** Order.status = 製作等待中
- **AND** Order.completed_at IS NULL
- **AND** 使用者為訂單 sales_id 對應的業務
- **WHEN** 業務於訂單詳情頁編輯三個客戶溝通備註欄位
- **THEN** 系統 SHALL 允許編輯並儲存

#### Scenario: 訂單完成後鎖定客戶溝通備註

- **GIVEN** Order.completed_at IS NOT NULL
- **WHEN** 業務於訂單詳情頁查看客戶溝通備註 section
- **THEN** 三個 textarea SHALL 顯示為唯讀模式
- **AND** 「插入常用備註」按鈕 SHALL disabled
- **AND** 既有已填寫內容仍可閱讀

#### Scenario: 非授權角色查看客戶溝通備註

- **GIVEN** Order.status = 製作中
- **AND** 使用者為印務 / 出貨 / 會計（非業務 / 諮詢 / 業務主管 / 訂單管理人）
- **WHEN** 該角色開啟訂單詳情頁
- **THEN** 三個 textarea SHALL 顯示為唯讀模式（可閱讀，不可編輯）
- **AND** 「插入常用備註」按鈕 SHALL 不顯示

---

### Requirement: 客戶溝通備註與 payment_terms_note 共存策略

新欄位 `payment_note`（訂單階段補充付款條件）與既有 `payment_terms_note`（從需求單帶入並鎖定的報價合約條款）SHALL 同時顯示於訂單詳情頁，並透過以下策略明確區分：

- **位置區分**：`payment_terms_note` 放在「訂單資訊卡」內既有位置；`payment_note` 放在新「客戶溝通備註」section 內
- **Label 加註**：
  - `payment_terms_note` 顯示為「收款條件（來自需求單）」
  - `payment_note` 顯示為「付款備註（訂單階段補充）」
- **可編輯性對比**：`payment_terms_note` 唯讀；`payment_note` 依「訂單階段客戶溝通備註編輯權限與時機」Requirement 開放編輯

#### Scenario: 兩個 payment 相關欄位同時顯示

- **GIVEN** Order 含 payment_terms_note 與 payment_note 兩個欄位
- **WHEN** 業務開啟訂單詳情頁資訊 Tab
- **THEN** 訂單資訊卡 SHALL 顯示 payment_terms_note label 為「收款條件（來自需求單）」、唯讀
- **AND** 客戶溝通備註 section SHALL 顯示 payment_note label 為「付款備註（訂單階段補充）」、可編輯（依角色與時機）
- **AND** 兩個欄位之間 MUST NOT 互相覆蓋或合併

---

### Requirement: 訂單客戶溝通備註 Data Model

Order 實體 SHALL 新增以下三個 free-text 欄位：

| 欄位 | type | 長度上限 | 預設值 | 用途 |
|------|------|---------|--------|------|
| `order_note` | text | 500 | `''` | 訂單條件備註（印刷須知 / 不打樣聲明 / 印刷風險告知等對客戶說明的整體訂單條款） |
| `delivery_note` | text | 500 | `''` | 交貨條件備註（工作天估算 / 急件處理 / 外島運費 / 規格調整交期順延等對客戶說明的交貨條款） |
| `payment_note` | text | 500 | `''` | 付款條件備註（全額 vs 頭尾款 / 指定日期付款 / 發票開立等對客戶說明的付款補充說明） |

三個欄位皆為 optional，預設空字串。儲存時 SHALL trim 前後空白；長度超過 500 字 SHALL 由 UI 顯示警告，但 spec 不強制截斷。

三個欄位與既有 5 個備註欄位（`payment_terms_note` / `payment_detail` / `customer_note` / `internal_note` / `production_note`）並存，**MUST NOT 合併或覆蓋既有欄位**。

#### Scenario: 新訂單初始化三個備註欄位為空

- **WHEN** 新訂單建立
- **THEN** order_note / delivery_note / payment_note SHALL 預設為空字串

#### Scenario: 三個欄位獨立儲存

- **GIVEN** Order.order_note = "已知悉印刷須知"
- **AND** Order.delivery_note = "預估 15-18 工作天"
- **AND** Order.payment_note = "全額付款 3-5 工作天"
- **WHEN** 業務僅更新 payment_note 為新內容
- **THEN** 系統 SHALL 只更新 payment_note 欄位
- **AND** order_note 與 delivery_note 保持原值
