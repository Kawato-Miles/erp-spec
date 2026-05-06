## REMOVED Requirements

### Requirement: 業務主管核可議價推進

**Reason**: v2.0 設計的「核可進議價」gate 在實務上業務主管於議價前無新資訊可判斷，淪為形式蓋章。本 change 將業務主管的審核時點搬到「成交後 / 出報價單前」，更貼合真實工作節奏（見 design.md D3）。

**Migration**: 已存在的 v2.0 相關 prototype 程式碼 SHALL 移除「進入議價」按鈕的業務主管核可邏輯與「業務主管首次查看」記錄機制；業務 SHALL 可於「已評估成本」狀態直接點擊「進入議價」推進。`approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` 欄位 MUST 保留但語意改綁定至新增的「業務主管成交後審核」Requirement（見下方 ADDED）。

---

## MODIFIED Requirements

### Requirement: 需求單狀態轉換

需求單 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 需求單定義的規則進行狀態轉換。完整流程為：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 → 待業務主管成交審核 → 已核准成交（可轉訂單）/ 流失。其中：

- 「已評估成本 → 議價中」 SHALL 由業務直接執行，無需業務主管核可（v2.0 議價前 gate 已移除，見 § REMOVED Requirements）
- 「成交 → 待業務主管成交審核」 SHALL 由業務於議價成交後觸發
- 「待業務主管成交審核 → 已核准成交」 SHALL 由指定業務主管（`approved_by_sales_manager_id`）核可執行
- 業務 MUST NOT 從「待業務主管成交審核」直接推進至「已核准成交」

#### Scenario: 完整成交流程

- **WHEN** 需求單經過需求確認、成本評估、議價、成交、業務主管成交後審核
- **THEN** 狀態依序轉換至「已核准成交」，業務於該狀態下方可執行「轉訂單」並出報價單給客人

#### Scenario: 業務直接從已評估成本進入議價

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 系統 SHALL 直接推進至「議價中」狀態
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 需求單流失

- **WHEN** 業務判斷客戶不成交
- **THEN** 業務 SHALL 可將需求單標記為「流失」於議價中或更早狀態，MUST 選擇流失原因（LOV 選單）

#### Scenario: US-QR-002 業務管理需求單進度

- **WHEN** 需求單成本評估完成進入「已評估成本」狀態
- **THEN** 業務 SHALL 於 `payment_terms_note` 欄位填寫與客戶確認的收款說明（選填）
- **AND** 業務 SHALL 看到「進入議價」按鈕可直接推進
- **AND** 需求單進入「議價中」後，業務 SHALL 視客戶回應執行「成交」或「流失」標記終態
- **AND** 每次狀態變更 MUST 自動記錄至 ActivityLog
- **AND** 管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價

- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估
- **AND** 歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄
- **AND** 重新進入「已評估成本」後業務 SHALL 可直接再進入「議價中」（無需再經業務主管核可）

---

### Requirement: 成交轉訂單

系統 SHALL 支援需求單於「已核准成交」狀態時一鍵轉建訂單，自動帶入需求單的客戶資料、印件規格、交期、報價金額、`payment_terms_note` 等基本資料至訂單。若需求單由 ConsultationRequest 轉入（`from_consultation_request_id` 非空），系統 MUST 在訂單建立時將 Payment 從 ConsultationRequest 轉移至新訂單，並在新訂單上建立 OrderExtraCharge(charge_type=consultation_fee)（見 [order-management spec](../order-management/spec.md) § Payment 跨實體轉移 與 § 訂單其他費用明細）。

「轉訂單」按鈕 MUST 於「已核准成交」狀態才顯示；於「成交」（待審核）狀態下，業務 MUST NOT 可執行轉訂單。

#### Scenario: 業務於已核准成交需求單轉訂單

- **GIVEN** 需求單狀態為「已核准成交」
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立新訂單（type = `線下`），自動帶入客戶資料、印件項目、交期、報價金額
- **AND** 訂單 MUST 與需求單建立關聯（QuoteRequest.linked_order_id）
- **AND** 業務 SHALL 出報價單給客人簽回（後續訂單流程依 order-management spec）

#### Scenario: 諮詢來源需求單轉訂單，Payment 轉移與 OrderExtraCharge 建立

- **GIVEN** 需求單狀態為「已核准成交」且為 ConsultationRequest 轉入（`from_consultation_request_id` 非空）、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 系統 SHALL 在主訂單上建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)
- **AND** 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，系統 SHALL 在主訂單上立即開立諮詢費 Invoice
- **AND** 系統 MUST NOT 建立諮詢訂單（諮詢結束做大貨需求單成交情境下諮詢訂單從未建立）
- **AND** 主訂單應收 = ∑ 印件費 + ∑ OrderExtraCharge（含諮詢費）；主訂單已收 = 諮詢費（轉移 Payment）；待繳 = 應收 - 已收

#### Scenario: 成交但未經業務主管審核不可轉訂單

- **GIVEN** 需求單狀態為「成交」（待業務主管審核）
- **WHEN** 業務開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「轉訂單」按鈕
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核成交條件中」資訊

---

### Requirement: 收款備註欄位

QuoteRequest 資料模型 SHALL 保有 `payment_terms_note` 欄位（text，最長 500 字，選填），供業務記錄與客戶討論的收款條件，作為後續報價單內容基礎。

業務 SHALL 於需求單任何狀態（草稿、需求確認中、待評估成本、已評估成本、議價中、成交）皆可編輯此欄位；進入「待業務主管成交審核」狀態後 SHALL 鎖定為唯讀。

業務主管 SHALL 於成交後審核時查看此欄位內容，作為審核決策依據之一。本欄位 MUST NOT 為強制必填，但業務主管核准時若該欄位為空，UI MUST 觸發 Confirm Dialog 進行二次確認（見「業務主管成交後審核」ADDED Requirement）。

語意更新（vs v2.0）：欄位本身不變，但綁定的審核 gate 從議價前移至成交後。鎖定時點改為進入「待業務主管成交審核」狀態。

#### Scenario: 業務於議價中編輯收款備註

- **WHEN** 業務於需求單詳情頁編輯 `payment_terms_note` 欄位
- **THEN** 系統 SHALL 接受最長 500 字 free text 內容
- **AND** 超過 500 字 MUST 拒絕儲存並顯示字數超出提示
- **AND** 留空允許儲存，欄位存為 NULL

#### Scenario: 待業務主管成交審核狀態收款備註鎖定

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 業務嘗試修改 `payment_terms_note`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀

#### Scenario: 業務主管查看收款備註

- **WHEN** 業務主管於需求單詳情頁查看 `payment_terms_note`
- **THEN** 系統 SHALL 以唯讀方式呈現內容
- **AND** 系統 MUST NOT 提供業務主管編輯此欄位的入口

---

### Requirement: 核可條件預留欄位（Phase 2 條件化升級）

QuoteRequest 資料模型 SHALL 保有 `approval_required` 欄位（boolean，必填，系統設定，不可手動編輯）。Phase 1 範疇內所有需求單 SHALL 預設為 `true`，意即必經業務主管「成交後審核」才能從「待業務主管成交審核」推進至「已核准成交」。

語意更新（vs v2.0）：欄位本身不變，但綁定的 gate 從「議價前核可」改為「成交後審核」。Phase 2 條件化升級邏輯不變（依規則動態計算），僅 gate 位置改變。

Phase 1 內 `approval_required` 規則 MUST 為「永遠 true」，不開放任何降級路徑。

#### Scenario: Phase 1 預設所有需求單 approval_required 為 true

- **WHEN** 業務於 Phase 1 建立任何需求單
- **THEN** 系統 SHALL 自動將 `approval_required` 設為 `true`
- **AND** 此欄位 SHALL 在 UI 中顯示為唯讀（或不顯示）
- **AND** 業務、業務主管、印務主管 MUST NOT 能手動修改此欄位

#### Scenario: Phase 2 條件化升級時的相容性

- **GIVEN** Phase 2 已實作條件化規則
- **WHEN** 系統建立 / 更新需求單觸發規則計算
- **THEN** `approval_required` SHALL 依規則結果寫入 true 或 false
- **AND** Phase 1 既有 `approval_required = true` 的需求單 SHALL 繼續視為必審核，無需資料回填

---

## ADDED Requirements

### Requirement: 業務主管成交後審核

需求單從「成交」推進至「已核准成交」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，需求單維持「待業務主管成交審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行（從需求單 `slack_thread_url` 欄位點擊進入）。

業務主管核准動作 MUST 寫入 QuoteRequestActivityLog（事件描述 = 「核准成交（出報價單前審核）」）。業務主管「首次查看待審核需求單時間」MUST 由系統自動記錄一次至 ActivityLog（事件描述 = 「業務主管首次查看（成交審核）」），作為 Phase 2 lead time KPI 資料基礎。

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: 業務主管核准需求單成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」且 `approval_required = true`
- **AND** 該需求單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **AND** `payment_terms_note` 欄位非空
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准成交（出報價單前審核）」）
- **AND** 業務 SHALL 看到「轉訂單」按鈕可推進至訂單建立

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 需求單狀態為「待業務主管成交審核」且 `payment_terms_note` 為空
- **WHEN** 業務主管點擊「核准成交」
- **THEN** UI MUST 跳出 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核准成交（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，需求單狀態 MUST 維持「待業務主管成交審核」

#### Scenario: 業務主管不核准透過 Slack thread 溝通

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **AND** 業務主管認為需重新討論收款條件或成交條件
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過需求單 `slack_thread_url` 進入 Slack thread 與業務直接討論
- **AND** 需求單狀態 MUST 維持「待業務主管成交審核」直到業務主管核准

#### Scenario: 業務不可直接從成交推進至已核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」且 `approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准成交」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「已核准成交」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管首次查看時間記錄

- **GIVEN** 需求單狀態為「待業務主管成交審核」且業務主管未曾查看
- **WHEN** 指定業務主管首次開啟此需求單詳情頁
- **THEN** 系統 MUST 寫入 ActivityLog 一次（事件描述 = 「業務主管首次查看（成交審核）」、時間戳）
- **AND** 後續業務主管再次查看 MUST NOT 重複寫入此事件

---

### Requirement: 從諮詢單轉建需求單

系統 SHALL 支援由 ConsultationRequest（[consultation-request spec](../consultation-request/spec.md)）轉建需求單。轉建時系統 MUST 自動帶入 ConsultationRequest 的客戶資料欄位至新需求單，並於需求單記錄 `from_consultation_request_id` 反向關聯。

ConsultationRequest 蒐集的印件相關欄位（`consultation_topic`、`estimated_quantity_band`）SHALL 帶入需求單作為印件規格的初始參考；業務於需求單細化時可調整。具體欄位 mapping table 待 OQ #1 解答後補入本 Requirement。

#### Scenario: 諮詢結束建立需求單

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 consultant_id、諮詢人員選擇「轉需求單（做大貨）」、Payment 綁 ConsultationRequest
- **WHEN** 系統觸發轉需求單動作
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料（customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension）MUST 自 ConsultationRequest 直接帶入
- **AND** `from_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** ConsultationRequest 的 `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `from_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

---

### Requirement: 諮詢來源需求單流失觸發建諮詢訂單

當需求單 `from_consultation_request_id` 非空、需求單流失（議價中或更早任何狀態觸發）時，系統 SHALL 自動觸發建諮詢訂單收尾流程，將原 ConsultationRequest 的 Payment 轉移至新建諮詢訂單。

實作細節見 [consultation-request spec](../consultation-request/spec.md) § 需求單流失觸發建諮詢訂單收尾、[order-management spec](../order-management/spec.md) § 訂單建立 § 需求單流失觸發建諮詢訂單。

設計理由：諮詢結束選做大貨後若需求單流失，客人付的諮詢費依然存在 ConsultationRequest 上需要收尾；複用「不做大貨」的諮詢訂單路徑可避免新增訂單類型或新流程，讓系統一致地將「最終沒進大貨」的所有情境都收斂到諮詢訂單。

#### Scenario: 議價中流失觸發建諮詢訂單與 Payment 轉移

- **GIVEN** 需求單 `from_consultation_request_id = CR-XXX` 非空，狀態為「議價中」、Payment 綁 CR-XXX
- **WHEN** 業務點擊「流失」、選擇流失原因
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 CR-XXX 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑
- **AND** ConsultationRequest CR-XXX 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 早期狀態流失（待評估成本前）觸發建諮詢訂單

- **GIVEN** 需求單 `from_consultation_request_id` 非空，狀態為「需求確認中」或「待評估成本」
- **WHEN** 業務點擊「流失」
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 結局更新）

#### Scenario: 一般需求單（非諮詢來源）流失不影響諮詢流程

- **GIVEN** 需求單 `from_consultation_request_id` 為 null（非諮詢來源）
- **WHEN** 業務點擊「流失」
- **THEN** 需求單依既有流失流程處理
- **AND** 系統 MUST NOT 建立任何諮詢訂單
