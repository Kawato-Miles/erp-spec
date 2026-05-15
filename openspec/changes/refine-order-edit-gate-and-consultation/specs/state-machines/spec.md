## MODIFIED Requirements

### Requirement: 訂單狀態機

訂單（Order）SHALL 依以下狀態流轉，分為三條前段路徑：

**線下路徑（`order_type = 線下`）**：報價待回簽 → 已回簽 → [共用段]

線下路徑「報價待回簽 → 已回簽」transition SHALL 採「OR 觸發」設計（extend-order-fields-from-vendor-feedback change），任一條件成立即推進：

- **條件 A（手動）**：業務於訂單詳情頁點擊「確認回簽」按鈕
- **條件 B（自動）**：業務於訂單詳情頁「回簽檔案上傳區」成功上傳至少一份回簽檔案（建立 OrderSignedFile 紀錄）

任一觸發成立時，系統 SHALL 寫入 `Order.signed_at` = 觸發時間並推進狀態。

**線上路徑（`order_type = 線上`，含一般訂單與客製單）**：等待付款 → 已付款（由 EC 付款完成自動觸發）→ [共用段]

**諮詢訂單路徑（`order_type = 諮詢`）**：諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

1. **不做大貨**（客戶最終沒做大貨製作）：兩個觸發點同歸此類
   - 觸發點 1.1：諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」
   - 觸發點 1.2：諮詢結束做大貨後，需求單流失（仍歸類為「不做大貨」結局，自動建諮詢訂單收尾）
2. **待諮詢取消（退費）**：業務於待諮詢階段點「取消諮詢」（含退款 Payment）

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，不建任何訂單；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共用相同短路徑：建立 → 已開發票 → 訂單完成。其中「待諮詢取消」情境不開 Invoice（defer_to_main_order）或開 Invoice + SalesAllowance（issue_now）。

狀態流：

- 不做大貨（涵蓋觸發點 1.1 與 1.2）：建立 → 已開發票（依 invoice_option 開立 Invoice）→ 訂單完成
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
- 諮詢訂單只在兩種「沒進大貨製作」收尾情境建立（不做大貨 / 待諮詢取消），webhook 階段不建
- 諮詢訂單建立時即在訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)，並從 ConsultationRequest 將 Payment 轉移過來
- 諮詢訂單從「建立」推進至「已開發票」依 invoice_option 與情境觸發，詳見 [order-management spec](../order-management/spec.md) § 諮詢訂單發票時間點處理
- 諮詢訂單從「已開發票」推進至「訂單完成」 MUST 為自動推進（無人工確認步驟）
- 諮詢結束做大貨且需求單成交轉一般訂單情境下 MUST NOT 建立諮詢訂單；諮詢費透過 Payment 轉移至一般訂單 + 一般訂單建立 OrderExtraCharge(consultation_fee) 進入一般訂單應收

免審稿快速路徑（線下 / 線上適用）：當訂單下所有印件的 review_status 皆為「合格」（含免審稿設定）時，訂單 SHALL 從「已付款」或「已回簽」直接進入「製作等待中」，跳過「稿件未上傳」、「等待審稿」、「待補件」。

> 訂單前段「業務主管審核」狀態（線下訂單建立後 → 報價待回簽前）由獨立 change `relocate-sales-manager-approval-from-quote-to-order` 處理，本 change 不涉及。

#### Scenario: 線下訂單回簽後進入共用段

- **WHEN** 線下訂單的報價已回簽（業務手動點按鈕或上傳回簽檔案）
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 線下訂單上傳回簽檔案自動推進

- **GIVEN** 訂單狀態 = 報價待回簽
- **WHEN** 業務於訂單詳情頁的「回簽檔案上傳區」上傳檔案，系統 SHALL 建立 OrderSignedFile 紀錄
- **THEN** 系統 SHALL 自動推進訂單狀態
- **AND** 系統 SHALL 寫入 `Order.signed_at` = 第一份檔案上傳完成時間
- **AND** ActivityLog MUST 記錄「上傳回簽檔案自動推進」與操作人

#### Scenario: 已回簽訂單追加上傳不重複觸發

- **GIVEN** 訂單狀態 = 製作中或之後、已有 OrderSignedFile
- **WHEN** 業務追加上傳回簽相關文件
- **THEN** 系統 SHALL 建立新 OrderSignedFile 紀錄
- **AND** 訂單狀態 MUST NOT 變更
- **AND** `Order.signed_at` MUST NOT 覆寫

#### Scenario: 線上訂單付款後進入共用段

- **WHEN** 線上訂單（含客製單）已完成付款（EC 自動觸發）
- **THEN** 訂單狀態 SHALL 進入「稿件未上傳」

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 1.1）

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已指派 `consultant_id`
- **WHEN** 諮詢人員選「結束諮詢 - 不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統依 invoice_option 開立 Invoice 並推進「已開發票 → 訂單完成」
- **AND** 系統 ActivityLog SHALL 將事件歸類標籤標為「不做大貨」

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 1.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單 `linked_consultation_request_id` 非空、需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統依 invoice_option 開立 Invoice 並推進「已開發票 → 訂單完成」
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」（最終結局）
- **AND** 系統 ActivityLog SHALL 將事件歸類標籤標為「不做大貨」

#### Scenario: 非諮詢來源的需求單流失不觸發

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（非諮詢來源）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 系統 MUST NOT 觸發任何諮詢訂單相關流程

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
