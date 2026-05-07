## MODIFIED Requirements

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

> 訂單前段「業務主管審核」狀態（線下訂單建立後 → 報價待回簽前）由獨立 change `relocate-sales-manager-approval-from-quote-to-order` 處理，本 change 不涉及。

#### Scenario: 線下訂單回簽後進入共用段

- **WHEN** 線下訂單的報價已回簽
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 線上訂單付款後進入共用段

- **WHEN** 線上訂單（含客製單）已完成付款（EC 自動觸發）
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 諮詢結束不做大貨建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已指派 `consultant_id`
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

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已成交
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

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已成交
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
