## ADDED Requirements

### Requirement: 從諮詢單轉建需求單

系統 SHALL 支援由 ConsultationRequest（[consultation-request spec](../consultation-request/spec.md)）轉建需求單。轉建時系統 MUST 自動帶入 ConsultationRequest 的客戶資料欄位至新需求單，並於需求單記錄 `linked_consultation_request_id` 反向關聯。

ConsultationRequest 蒐集的印件相關欄位（`consultation_topic`、`estimated_quantity_band`）SHALL 帶入需求單作為印件規格的初始參考（`consultation_topic` 寫入 `requirement_note`，業務於需求單細化時可調整）。

#### Scenario: 諮詢結束建立需求單

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 consultant_id、諮詢人員選擇「轉需求單（做大貨）」、Payment 綁 ConsultationRequest
- **WHEN** 系統觸發轉需求單動作
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料（customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension）MUST 自 ConsultationRequest 直接帶入
- **AND** `linked_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** `requirement_note` MUST 寫入 ConsultationRequest 的 `consultation_topic`
- **AND** ConsultationRequest 的 `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `linked_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

---

### Requirement: 諮詢來源需求單流失觸發建諮詢訂單

當需求單 `linked_consultation_request_id` 非空、需求單流失（議價中或更早任何狀態觸發）時，系統 SHALL 自動觸發建諮詢訂單收尾流程，將原 ConsultationRequest 的 Payment 轉移至新建諮詢訂單。

實作細節見 [consultation-request spec](../consultation-request/spec.md) § 需求單流失觸發建諮詢訂單收尾、[order-management spec](../order-management/spec.md) § 訂單建立 § 需求單流失觸發建諮詢訂單。

設計理由：諮詢結束選做大貨後若需求單流失，客人付的諮詢費依然存在 ConsultationRequest 上需要收尾；複用「不做大貨」的諮詢訂單路徑可避免新增訂單類型或新流程，讓系統一致地將「最終沒進大貨」的所有情境都收斂到諮詢訂單。

#### Scenario: 議價中流失觸發建諮詢訂單與 Payment 轉移

- **GIVEN** 需求單 `linked_consultation_request_id = CR-XXX` 非空，狀態為「議價中」、Payment 綁 CR-XXX
- **WHEN** 業務點擊「流失」、選擇流失原因
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 CR-XXX 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑
- **AND** ConsultationRequest CR-XXX 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 早期狀態流失（待評估成本前）觸發建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，狀態為「需求確認中」或「待評估成本」
- **WHEN** 業務點擊「流失」
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 結局更新）

#### Scenario: 一般需求單（非諮詢來源）流失不影響諮詢流程

- **GIVEN** 需求單 `linked_consultation_request_id` 為 null（非諮詢來源）
- **WHEN** 業務點擊「流失」
- **THEN** 需求單依既有流失流程處理
- **AND** 系統 MUST NOT 建立任何諮詢訂單

---

### Requirement: 諮詢來源需求備註欄位

QuoteRequest 資料模型 SHALL 新增 `requirement_note` 欄位（text，選填），記錄需求單的需求描述。當需求單由 ConsultationRequest 轉入時（`linked_consultation_request_id` 非空），系統 MUST 將 ConsultationRequest 的 `consultation_topic` 帶入此欄位。

業務 SHALL 於需求單任何狀態皆可編輯此欄位，作為需求紀錄文字。

#### Scenario: 諮詢轉需求單時帶入 consultation_topic

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份雙面銅版紙傳單，A4 大小"
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST = "希望製作 500 份雙面銅版紙傳單，A4 大小"
- **AND** 業務開啟需求單詳情頁 SHALL 看到此備註內容

#### Scenario: 一般需求單 requirement_note 預設為空

- **GIVEN** 業務手動建立需求單（非諮詢來源）
- **WHEN** 系統建立 QuoteRequest
- **THEN** `requirement_note` SHALL 預設為空字串
- **AND** 業務於詳情頁 SHALL 可手動填寫此欄位
