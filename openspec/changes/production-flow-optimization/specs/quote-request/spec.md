## MODIFIED Requirements

### Requirement: 印件項目管理

系統 SHALL 支援需求單內建立多筆印件項目（Print Items），每筆包含印件規格（類型、尺寸、數量、紙張、加工等）。印件類型支援 27 種分類。每筆印件項目可填寫「預計產線」（多選）。

#### Scenario: 業務新增印件項目時填寫預計產線

- **WHEN** 業務在需求單下新增或編輯印件項目
- **THEN** 系統 SHALL 提供預計產線多選欄位，顯示所有產線供選擇
- **AND** 選取結果 SHALL 儲存至 QuoteRequestItemExpectedLine junction

#### Scenario: 需求單轉訂單時帶入預計產線

- **WHEN** 需求單成交並建立訂單
- **THEN** 系統 SHALL 將各印件項目的預計產線帶入對應 PrintItem 的 expected_production_lines

## MODIFIED Data Model

### QuoteRequestItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 需求單 | quote_request_id | FK | Y | Y | FK->需求單 |
| 項目編號 | item_no | 字串 | Y | Y | 格式：{quote_no}-{seq} |
| 排序 | seq | 整數 | Y | | 排序用 |
| 印件名稱 | name | 字串 | Y | | 印件名稱 |
| 規格備註 | spec_note | 文字 | Y | | 規格備註 |
| 數量 | quantity | 小數 | Y | | 數量 |
| 單位 | unit | 單選 | | | 張/本/冊/份/個/卷/盒/套/批 |
| 成本總額 | cost_estimate | 整數 | | | 成本總額 |
| 報價總額（未稅） | price_per_unit | 整數 | | | 報價總額（未稅） |
| 毛利率 | profit_margin | 小數 | | Y | 系統自動計算毛利率 |
| 預計產線 | expected_production_lines | M:N | | | 多選；FK -> ProductionLine（透過 QuoteRequestItemExpectedLine） |
| 出貨日期 | delivery_date | 日期 | | | 出貨日期 |
| 出貨方式 | delivery_method | 字串 | | | 出貨方式 |
| 包裝說明 | packaging_note | 文字 | | | 包裝說明 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

## ADDED Data Model

### QuoteRequestItemExpectedLine（需求單印件預計產線 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 印件項目 | item_id | FK | Y | Y | FK -> QuoteRequestItem |
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine |
