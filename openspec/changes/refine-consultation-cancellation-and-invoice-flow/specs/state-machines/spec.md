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
2. **待諮詢取消（半額退費）**：諮詢人員 / 諮詢主管於待諮詢階段點「取消諮詢」並於 dialog 確認（含 OA 自動建 + 退款 Payment）

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，不建任何訂單；需求單流失走需求單自身的退款 / 流失流程。

**諮詢訂單狀態簡化（本 change 廢止 invoice_option 對狀態機分支的影響）**：諮詢訂單狀態僅在「建立」與「訂單完成」之間轉換，**不進入線下 / 線上路徑共用段任何狀態**（如稿件未上傳、等待審稿、製作中、出貨中、已開發票等皆不適用）。「已開發票」狀態於諮詢訂單路徑廢止（既不再依 invoice_option 自動開立 Invoice、Invoice 由諮詢人員手動轉立 PlannedInvoice 處理）。

推進至「訂單完成」的觸發條件依情境：

- **不做大貨 / 需求單流失情境**：諮詢訂單建立完成（Payment 轉移完成 + PlannedInvoice 自動建立完成）即推進至「訂單完成」。理由：Payment(+諮詢費) 已完成、應收 = 已收，無待退款動作；PlannedInvoice 是稅務待辦不影響訂單終態
- **待諮詢取消情境**：諮詢訂單建立後維持「建立」狀態，待退款 Payment(-1000) 切「已完成」且 OA 推進至「已執行」後（依 [order-management § OA 已執行推進規則](../order-management/spec.md) 既有規則），系統 SHALL 推進至「訂單完成」

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
- 諮詢訂單 Invoice 由諮詢人員手動將 PlannedInvoice 轉立、系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何，本 change 廢止此自動化）
- 待諮詢取消情境下，系統 SHALL 自動建立 OrderAdjustment(-1000, type=諮詢取消退費, status=已核可) + 退款 Payment(-1000, status=處理中)；訂單推進「訂單完成」的觸發條件為退款 Payment 切「已完成」（依 [order-management § OA 已執行推進規則](../order-management/spec.md)）
- 諮詢結束做大貨且需求單成交轉一般訂單情境下 MUST NOT 建立諮詢訂單；諮詢費透過 Payment 轉移至一般訂單 + 一般訂單建立 OrderExtraCharge(consultation_fee) 進入一般訂單應收；諮詢費 PlannedInvoice 不自動建，由業務於主訂單既有發票時程規劃流程自行加入

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

#### Scenario: 諮詢結束不做大貨建諮詢訂單並推進訂單完成

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id`
- **WHEN** 諮詢人員選「結束諮詢 - 不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（金額 2000、description 「諮詢費」）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」終態（Payment +諮詢費 已完成、應收已滿足）

#### Scenario: 需求單流失觸發建諮詢訂單並推進訂單完成

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（金額 2000、description 「諮詢費」）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」終態
- **AND** ConsultationRequest 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」（最終結局）

#### Scenario: 諮詢結束做大貨需求單成交時建一般訂單

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、需求單已成交
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立一般訂單（order_type = 線下）
- **AND** 系統 SHALL 在一般訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至一般訂單
- **AND** 系統 MUST NOT 建立諮詢訂單
- **AND** 系統 MUST NOT 自動於主訂單建立諮詢費 PlannedInvoice（業務自行規劃）

#### Scenario: 待諮詢取消建諮詢訂單與半額退費

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id`、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 諮詢主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 2000)
- **AND** Payment P0 從 ConsultationRequest 轉移至諮詢訂單（+2000 不變、status 維持已完成）
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = 諮詢取消退費、status = 已核可、approved_by = system）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id）
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（金額 1000、description 「諮詢費（取消退費後）」）
- **AND** 系統 MUST NOT 自動開立 Invoice 或 SalesAllowance
- **AND** 諮詢訂單 SHALL 維持「建立」狀態（待退款 Payment 切已完成後系統再推進至「訂單完成」）

#### Scenario: 待諮詢取消退款 Payment 切已完成推進訂單完成

- **GIVEN** 待諮詢取消觸發後諮詢訂單已建立、退款 Payment(-1000, status=處理中, linkedOrderAdjustmentId=OA-c1) 存在、OA-c1 status = 已核可
- **WHEN** 諮詢人員於 OA 編輯介面將退款 Payment 切「已完成」並上傳退款證明附件
- **THEN** 系統 SHALL 依既有 OA 推進規則將 OA-c1 status 推進至「已執行」
- **AND** 系統 SHALL 將諮詢訂單從「建立」推進至「訂單完成」終態
- **AND** 訂單終態 MUST NOT 受發票開立狀態影響（PlannedInvoice 是否轉立 Invoice 不影響訂單完成）

#### Scenario: 諮詢訂單不進入共用段

- **GIVEN** 訂單 `order_type = 諮詢`
- **WHEN** 系統檢視訂單狀態推進邏輯
- **THEN** 訂單 MUST NOT 進入「稿件未上傳」、「等待審稿」、「製作等待中」等共用段狀態
- **AND** 訂單 MUST NOT 進入「已開發票」狀態（本 change 廢止諮詢訂單路徑的此狀態）
- **AND** 諮詢訂單 MUST NOT 觸發 work_order / production_task 建立

#### Scenario: 訂單狀態推進至製作完成

- **WHEN** 訂單下所有印件的印製狀態皆為「製作完成」
- **THEN** 訂單狀態 SHALL 推進為「製作完成」（僅 `order_type ∈ {線下, 線上}` 適用）
