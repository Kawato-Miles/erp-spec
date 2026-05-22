## MODIFIED Requirements

### Requirement: 從諮詢單轉建需求單

系統 SHALL 支援由 ConsultationRequest（[consultation-request spec](../consultation-request/spec.md)）轉建需求單。轉建時系統 MUST 自動帶入 ConsultationRequest 的客戶資料欄位至新需求單，並於需求單記錄 `linked_consultation_request_id` 反向關聯。

ConsultationRequest 蒐集的印件相關欄位（`consultation_topic`、`estimated_quantity_band`、`consultant_note`）SHALL 帶入需求單作為印件規格的初始參考。其中 `consultation_topic`（客戶 surveycake 原話）+ `consultant_note`（諮詢人員與客戶溝通記錄）SHALL 以**雙區塊格式**合併寫入 `requirement_note`，雙區塊定義詳見 [consultation-request spec § 諮詢單轉需求單欄位帶入](../consultation-request/spec.md)。業務於需求單細化時可調整 `requirement_note` 內容。

#### Scenario: 諮詢結束建立需求單

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、諮詢人員選擇「轉需求單（做大貨）」、Payment 綁 ConsultationRequest
- **WHEN** 系統觸發轉需求單動作
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料（customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension）MUST 自 ConsultationRequest 直接帶入
- **AND** `linked_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** `requirement_note` MUST 寫入 `consultation_topic` + `consultant_note` 的雙區塊格式（雙區塊定義詳見 [consultation-request spec](../consultation-request/spec.md)；`consultant_note` 為空時 SHALL 省略諮詢人員筆記區塊）
- **AND** ConsultationRequest 的 `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `linked_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

---

### Requirement: 諮詢來源需求備註欄位

QuoteRequest 資料模型 SHALL 新增 `requirement_note` 欄位（text，選填），記錄需求單的需求描述。當需求單由 ConsultationRequest 轉入時（`linked_consultation_request_id` 非空），系統 MUST 將 ConsultationRequest 的 `consultation_topic` + `consultant_note` 以**雙區塊格式**帶入此欄位（雙區塊定義詳見 [consultation-request spec § 諮詢單轉需求單欄位帶入](../consultation-request/spec.md)）。

業務 SHALL 於需求單任何狀態皆可編輯此欄位，作為需求紀錄文字；下游 spec / Prototype MUST NOT 依賴雙區塊格式做 parsing（純文字傳輸，業務可自由編輯）。

#### Scenario: 諮詢轉需求單時帶入雙區塊 requirement_note

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份雙面銅版紙傳單，A4 大小"、`consultant_note` = "客戶確認用 250g 紙、要燙金 LOGO"
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST 以雙區塊格式帶入：
  ```
  [客戶原話]
  希望製作 500 份雙面銅版紙傳單，A4 大小

  [諮詢人員筆記]
  客戶確認用 250g 紙、要燙金 LOGO
  ```
- **AND** 業務開啟需求單詳情頁 SHALL 看到此備註內容

#### Scenario: consultant_note 為空時雙區塊省略諮詢人員筆記

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份 A4 海報"、`consultant_note` = NULL
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST 僅含客戶原話區塊：
  ```
  [客戶原話]
  希望製作 500 份 A4 海報
  ```
- **AND** 系統 MUST NOT 帶入空的「[諮詢人員筆記]」區塊

#### Scenario: 一般需求單 requirement_note 預設為空

- **GIVEN** 業務手動建立需求單（非諮詢來源）
- **WHEN** 系統建立 QuoteRequest
- **THEN** `requirement_note` SHALL 預設為空字串
- **AND** 業務於詳情頁 SHALL 可手動填寫此欄位

#### Scenario: 業務於需求單 requirement_note 自由編輯雙區塊內容

- **GIVEN** 需求單已自諮詢單帶入 `requirement_note` 雙區塊預設值
- **WHEN** 業務於需求單詳情頁編輯 `requirement_note`，修改格式或新增內容
- **THEN** 系統 SHALL 允許自由編輯
- **AND** 編輯不影響上游 ConsultationRequest 的 `consultation_topic` / `consultant_note`（兩者解耦，僅在 mapping 時刻合併）
