## ADDED Requirements

### Requirement: 需求單印件稿件備註

需求單印件（QuoteRequestItem 對應後續 PrintItem）SHALL 支援業務於建立 / 編輯階段填寫 `client_note` 欄位，作為給審稿人員的稿件說明。

**欄位定義對齊** [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)：
- `client_note`：text（最長 500 字，非必填）
- 層級：印件 1:1，跟著印件走
- 方向：業務 → 審稿
- 需求單成交轉訂單時 SHALL 將 `client_note` 帶入對應 PrintItem
- **帶入後脫鉤**：訂單 PrintItem.client_note 與需求單 QuoteRequestItem.client_note 各自獨立編輯，不回寫同步（對齊 business-processes spec L72 expected_production_lines 帶入後可繼續編輯的設計模式）

#### Scenario: 業務於需求單印件填寫稿件備註

- **WHEN** 業務在需求單下新增或編輯印件項目
- **THEN** 系統 SHALL 提供 `client_note` textarea 欄位（非必填，最長 500 字）
- **AND** 超過 500 字系統 SHALL 拒絕儲存並顯示字數超出提示
- **AND** 留空允許儲存，欄位存為 NULL

#### Scenario: 需求單成交轉訂單時帶入稿件備註

- **WHEN** 需求單成交並建立訂單
- **THEN** 系統 SHALL 將各印件項目的 `client_note` 帶入對應 PrintItem
- **AND** 審稿人員於工作台接收此印件時 SHALL 可見 `client_note` 內容

#### Scenario: 成交後需求單與訂單 client_note 脫鉤

- **GIVEN** 需求單已成交並建立訂單；各印件 `client_note` 已帶入 PrintItem
- **WHEN** 業務事後於需求單修改原 client_note
- **THEN** 系統 SHALL 僅更新 QuoteRequestItem.client_note，訂單 PrintItem.client_note **不**受影響（各自獨立）
- **AND** 若業務需修正訂單 PrintItem 的 client_note，SHALL 於訂單 / 印件編輯介面執行（觸發 prepress-review spec § 稿件備註覆寫稽核 的 ActivityLog 記錄）
