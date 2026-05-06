## MODIFIED Requirements

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 → 待業務主管成交審核 → 已核准成交 / 流失

角色權責：業務 / 諮詢業務負責需求確認、報價、議價對談與成交 / 流失決策；印務主管負責成本評估；業務主管負責「待業務主管成交審核 → 已核准成交」的核准推進，並於核准前確認收款條件、報價單條件、交期是否合理。

「已評估成本 → 議價中」轉換 SHALL 由業務直接執行，無需業務主管核可（v2.0 議價前 gate 已取消，理由見 [quote-request spec](../quote-request/spec.md) § REMOVED Requirements「業務主管核可議價推進」）。

「成交 → 待業務主管成交審核」 SHALL 由業務於議價成交後觸發。

「待業務主管成交審核 → 已核准成交」 MUST 由指定的業務主管（`approved_by_sales_manager_id`）執行，前提為 `approval_required = true`（Phase 1 預設所有需求單皆 true）。業務角色 MUST NOT 直接執行此轉換。業務主管核准動作為單向狀態轉換（無「退回至成交」按鈕）；業務主管不核准時透過 Slack thread 溝通，需求單維持「待業務主管成交審核」狀態。

「已核准成交」狀態 SHALL 為轉訂單前的最後狀態，業務於該狀態下方可執行「轉訂單」並出報價單給客人。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管；進入「待業務主管成交審核」時，系統 SHALL 透過 Slack Webhook 通知指定業務主管。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 業務直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價後成交進入待業務主管成交審核

- **WHEN** 客戶於議價階段接受報價，業務點擊「成交」
- **THEN** 需求單狀態 SHALL 變為「待業務主管成交審核」
- **AND** 業務主管 SHALL 收到 Slack Webhook 通知
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 業務主管核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」且 `approved_by_sales_manager_id` 等於當前業務主管
- **AND** `approval_required = true`
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog 記錄業務主管核准動作

#### Scenario: 業務不可從待業務主管成交審核直接推進至已核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」且 `approval_required = true`
- **WHEN** 業務（非指定業務主管）於需求單詳情頁查看狀態推進選項
- **THEN** 系統 MUST NOT 提供「核准成交」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」提示文字
- **AND** 任何 API 請求嘗試由業務直接推進至「已核准成交」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管暫不核准透過 Slack 溝通

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過需求單 `slack_thread_url` 進入 Slack thread 與業務直接討論
- **AND** 需求單狀態 MUST 維持「待業務主管成交審核」直到核准

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: Phase 2 條件化跳過審核

- **GIVEN** Phase 2 已實作條件化規則
- **AND** 需求單 `approval_required = false`（依規則計算結果）
- **WHEN** 需求單進入「成交」狀態
- **THEN** 業務 SHALL 可直接從「成交」推進至「已核准成交」（跳過業務主管 gate）
- **AND** 此轉換 MUST 寫入 ActivityLog 標示「條件化跳過業務主管成交審核」
- **AND** Phase 1 範疇內所有需求單 `approval_required` 皆為 true，此 Scenario MUST NOT 觸發

---

### Requirement: 訂單狀態機

訂單（Order）SHALL 依以下狀態流轉，分為三條前段路徑：

**線下路徑（`order_type = 線下`）**：報價待回簽 → 已回簽 → [共用段]

**線上路徑（`order_type = 線上`，含一般訂單與客製單）**：等待付款 → 已付款（由 EC 付款完成自動觸發）→ [共用段]

**諮詢訂單路徑（`order_type = 諮詢`）**：諮詢訂單只在以下三種「沒進大貨製作」收尾情境之一才建立（webhook 階段不建）：

1. 諮詢結束 - 不做大貨：諮詢人員選「不做大貨」時建立
2. 需求單流失：ConsultationRequest 已轉需求單後、需求單流失時系統自動建立
3. 待諮詢取消（退費）：業務取消預約時建立

三種情境共用相同短路徑：建立 → 已開發票 → 訂單完成。其中「待諮詢取消」情境不開 Invoice（defer_to_main_order）或開 Invoice + SalesAllowance（issue_now）。

狀態流：

- 不做大貨 / 需求單流失：建立 → 已開發票（依 invoice_option 開立 Invoice）→ 訂單完成
- 待諮詢取消（defer_to_main_order）：建立 → 訂單完成（不開 Invoice、退款 Payment 抵銷）
- 待諮詢取消（issue_now）：建立 → 已開發票（含 SalesAllowance 抵銷）→ 訂單完成

**共用段（線下 / 線上適用）**：稿件未上傳 → 等待審稿 ↔ 待補件 → 製作等待中 → 工單已交付 → 製作中 → 製作完成 → 出貨中 → 訂單完成

**審稿段子狀態說明**（線下 / 線上適用）：
- 「等待審稿」與「待補件」互為審稿段內的平行子狀態
- 「待補件」：存在任一印件 `reviewDimensionStatus = '不合格'`（業務需補件）
- 「等待審稿」：無印件不合格，且存在至少一件印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'`
- 子狀態間 SHALL 允許雙向互換（補件完成從「待補件」回到「等待審稿」）
- QC 不合格 MUST NOT 冒升至 Order 層；訂單本身永遠沒有「QC 不合格」狀態

**諮詢訂單特殊規則**：
- 諮詢訂單 MUST NOT 進入共用段（無印件、無製作、無出貨）
- 諮詢訂單只在三種「沒進大貨製作」收尾情境建立（不做大貨 / 需求單流失 / 待諮詢取消），webhook 階段不建
- 諮詢訂單建立時即在訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)，並從 ConsultationRequest 將 Payment 轉移過來
- 諮詢訂單從「建立」推進至「已開發票」依 invoice_option 與情境觸發，詳見 [order-management spec](../order-management/spec.md) § 諮詢訂單發票時間點處理
- 諮詢訂單從「已開發票」推進至「訂單完成」 MUST 為自動推進（無人工確認步驟）
- 諮詢結束做大貨且需求單成交轉一般訂單情境下 MUST NOT 建立諮詢訂單；諮詢費透過 Payment 轉移至一般訂單 + 一般訂單建立 OrderExtraCharge(consultation_fee) 進入一般訂單應收

免審稿快速路徑（線下 / 線上適用）：當訂單下所有印件的 review_status 皆為「合格」（含免審稿設定）時，訂單 SHALL 從「已付款」或「已回簽」直接進入「製作等待中」，跳過「稿件未上傳」、「等待審稿」、「待補件」。

#### Scenario: 線下訂單回簽後進入共用段

- **WHEN** 線下訂單的報價已回簽
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 線上訂單付款後進入共用段

- **WHEN** 線上訂單（含客製單）已完成付款（EC 自動觸發）
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 諮詢結束不做大貨建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 諮詢中
- **WHEN** 諮詢人員選「結束諮詢 - 不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統依 invoice_option 開立 Invoice 並推進「已開發票 → 訂單完成」

#### Scenario: 需求單流失觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統依 invoice_option 開立 Invoice 並推進「已開發票 → 訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」（最終結局）

#### Scenario: 諮詢結束做大貨需求單成交時建一般訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已核准成交
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單（order_type = 線下）
- **AND** 系統 SHALL 在一般訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 系統 MUST NOT 建立諮詢訂單

#### Scenario: 待諮詢取消建諮詢訂單與退款

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment（amount = -諮詢費）
- **AND** 若 issue_now：系統 SHALL 開立 Invoice + SalesAllowance 抵銷
- **AND** 諮詢訂單 SHALL 推進至「訂單完成」（退費完成終態）

#### Scenario: 諮詢訂單不進入共用段

- **GIVEN** 訂單 `order_type = 諮詢`
- **WHEN** 系統檢視訂單狀態推進邏輯
- **THEN** 訂單 MUST NOT 進入「稿件未上傳」、「等待審稿」、「製作等待中」等共用段狀態
- **AND** 諮詢訂單 MUST NOT 觸發 work_order / production_task 建立

#### Scenario: 訂單狀態推進至製作完成

- **WHEN** 訂單下所有印件的印製狀態皆為「製作完成」
- **THEN** 訂單狀態 SHALL 推進為「製作完成」（僅 `order_type ∈ {線下, 線上}` 適用）

---

## ADDED Requirements

### Requirement: 諮詢單狀態機（v2 簡化）

諮詢單（ConsultationRequest）SHALL 依以下狀態流轉（v2 簡化：移除「諮詢中」「諮詢結束」過渡狀態，諮詢進行不需 status 追蹤；`result` 欄位移除，由 status 直接表達結局）：

待諮詢 → 已轉需求單 / 完成諮詢 / 已取消

其中「已轉需求單」可在後續因需求單流失而**更新為「完成諮詢」**（最終結局更新，反映實際資料流向）。

**狀態說明**：

- **待諮詢**：webhook 自動建單後的初始狀態（只建 ConsultationRequest 與 Payment，**不建任何訂單**），等待業務指派 `consultant_id`；所有諮詢結束分支動作（完成諮詢 / 轉需求單 / 取消）皆於此狀態下執行
- **已轉需求單**：諮詢人員選做大貨後的中間狀態（雖列為終態但可更新），系統建立 QuoteRequest，`linked_quote_request_id` 寫入；Payment 維持綁 ConsultationRequest 等需求單結局
- **完成諮詢**：終態，諮詢訂單建立完成（兩種收尾情境之一：不做大貨 / 需求單流失），`linked_consultation_order_id` 寫入
- **已取消**：終態，待諮詢狀態取消預約退費，已建諮詢訂單 + 退款 Payment

實際終態合併為「完成諮詢」（含兩種子情境）/「已轉需求單」（後續可能再更新為完成諮詢）/「已取消」。

角色權責：業務 / 諮詢人員負責諮詢單建立後的指派、結束分支決策；金流系統觸發 webhook 自動建單。諮詢進行階段不在 status 機（諮詢人員與客戶討論時無系統動作）。

逾時自動結案規則：OQ #4 已解 — Phase 1 不實作自動結案，由業務人工判斷處理。

#### Scenario: webhook 自動建單進入待諮詢（不建訂單）

- **WHEN** 客人於 surveycake 完成表單填寫並付款成功
- **THEN** 系統 SHALL 建立 ConsultationRequest（status = 待諮詢）
- **AND** 系統 SHALL 建立 Payment（linked_entity_type = ConsultationRequest、amount = 諮詢費）
- **AND** 系統 MUST NOT 建立任何 Order

#### Scenario: 待諮詢取消推進至已取消

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment 綁 ConsultationRequest
- **WHEN** 業務 / 諮詢人員點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上建立退款 Payment（amount = -諮詢費）
- **AND** 諮詢訂單 SHALL 推進至「訂單完成」（退費完成終態）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 業務指派諮詢人員

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且 `consultant_id` 為空
- **WHEN** 業務於諮詢單詳情頁選擇諮詢人員指派
- **THEN** 系統 SHALL 寫入 `consultant_id`
- **AND** 狀態維持「待諮詢」（標示已分派）

#### Scenario: 完成諮詢 - 不做大貨（建諮詢訂單收尾）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 `consultant_id`、Payment 綁 ConsultationRequest
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢訂單）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑（已開發票 → 訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 推進至「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 轉需求單 - 做大貨（只建需求單，不建訂單）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 `consultant_id`、Payment 綁 ConsultationRequest
- **WHEN** 諮詢人員點擊「轉需求單（做大貨）」
- **THEN** 系統 SHALL 建立 QuoteRequest（status = 需求確認中、linked_consultation_request_id 寫入）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已轉需求單」
- **AND** Payment MUST 維持綁 ConsultationRequest（等需求單結局決定才轉移）
- **AND** 系統 MUST NOT 建立任何 Order

#### Scenario: 需求單流失觸發 ConsultationRequest 結局更新

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單流失
- **WHEN** 系統處理需求單流失事件（updateQuoteStatus side-effect）
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢訂單）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」（最終結局）
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID
- **AND** `linked_quote_request_id` 維持保留（保留歷史足跡）

#### Scenario: 需求單成交業務轉訂單時 Payment 轉移至一般訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已核准成交
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單（order_type = 線下）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 系統 MUST NOT 建立諮詢訂單
- **AND** ConsultationRequest 狀態維持「已轉需求單」（成功進入大貨製作後不再更新）

#### Scenario: 諮詢單狀態大致不可逆，例外為「已轉需求單 → 完成諮詢」

- **GIVEN** ConsultationRequest 狀態為「完成諮詢」或「已取消」
- **WHEN** 任何角色嘗試變更狀態
- **THEN** 系統 MUST 拒絕

- **GIVEN** ConsultationRequest 狀態為「已轉需求單」
- **WHEN** 對應需求單流失（系統觸發，非人工）
- **THEN** 系統 SHALL 將狀態更新為「完成諮詢」並建立諮詢訂單收尾
- **AND** 任何角色 MUST NOT 手動變更「已轉需求單」狀態（只允許系統因需求單流失事件觸發更新）
