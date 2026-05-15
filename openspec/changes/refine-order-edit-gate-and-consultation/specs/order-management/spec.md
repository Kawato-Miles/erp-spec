## MODIFIED Requirements

### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）、(c) 依 ConsultationRequest 的 `consultation_invoice_option`（若 `issue_now` 則立即在主訂單上開立諮詢費 Invoice）。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

3. **不做大貨**：客戶最終沒做大貨製作，涵蓋兩個觸發點：
   - 3.1 諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」時建立
   - 3.2 諮詢結束做大貨後，需求單流失：系統將此事件歸類為「不做大貨」結局，自動建諮詢訂單收尾
4. **待諮詢取消（退費）**：業務於待諮詢階段點「取消諮詢」時建立，含退款 Payment

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不建任何訂單**；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共同的建立動作：(a) 訂單金額 = 諮詢費，(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) 依 invoice_option 與是否退費決定 Invoice / SalesAllowance 處理（見 [consultation-request spec](../consultation-request/spec.md) § 諮詢費發票時間點處理）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 1000、印件費 = 4000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 1000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 若 ConsultationRequest 的 `consultation_invoice_option = issue_now`，主訂單 SHALL 立即開立諮詢費 Invoice（金額 = 1000）
- **AND** 主訂單三方對帳：應收 = 5000 = 已收 1000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 3.1）

- **WHEN** ConsultationRequest 諮詢結束，諮詢人員選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 3.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失（流失事件由需求單模組觸發）
- **WHEN** 系統處理需求單流失事件，且需求單 `linked_consultation_request_id` 非空
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單

#### Scenario: 非諮詢來源的需求單流失不建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（非諮詢來源）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 需求單流失走需求單自身的退款 / 流失流程，與諮詢訂單無關

#### Scenario: 待諮詢取消觸發建諮詢訂單

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment 綁 ConsultationRequest
- **WHEN** 業務點擊「取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單 + OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 在諮詢訂單上同步建立退款 Payment（amount = -諮詢費、payment_method = 退款）

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

---

### Requirement: 訂單階段印件規格編輯時機

訂單階段的印件規格（`spec_note`）/ 購買數量（`pi_ordered_qty`）/ 單位（`unit`）/ 難易度（`difficulty_level`）/ 報價單價的可編輯性 SHALL 依 `Order.status` 區分兩階段：

**階段一：訂單已建立 → 報價待回簽 → 已回簽 → 審稿段（稿件未上傳 / 等待審稿 / 待補件）**

業務 / 訂單管理人 SHALL 可直接編輯上述欄位，系統直接更新 PrintItem / OrderItem 對應值；ActivityLog MUST 記錄變更。

**階段二：製作等待中（含）之後所有狀態（已取消除外）**

涵蓋狀態：製作等待中 / 工單已交付 / 製作中 / 製作完成 / 出貨中 / 訂單完成。

業務 SHALL NOT 直接編輯上述欄位；變更 SHALL 透過 OrderAdjustment 流程處理（依變更類型選用對應 adjustment_type：規格變更 / 加印追加 / 退印 / 補退）。OrderAdjustment 經業務主管核可並執行後，系統 SHALL 同步更新 PrintItem / OrderItem 欄位並建立補收 / 退款 Payment。

> OrderAdjustment 完整 enum（8 值）與狀態機定義於 `add-after-sales-ticket` change 的 `specs/order-management/spec.md` § OrderAdjustment.adjustment_type 完整 enum 與 `specs/state-machines/spec.md` § OrderAdjustment 狀態機。訂單期間建立的 OrderAdjustment SHALL 將 `linked_after_sales_ticket_id` 設為 NULL，售後 ticket 內建立的關聯異動才填入 ticket FK。

訂單狀態 = 已取消的訂單，所有印件欄位 MUST 為唯讀，不允許異動。

#### Scenario: 報價待回簽階段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 報價待回簽
- **WHEN** 業務於印件詳情頁修改 `spec_note` 與 `pi_ordered_qty`
- **THEN** 系統 SHALL 直接更新 PrintItem
- **AND** ActivityLog MUST 記錄變更內容、操作人、時間

#### Scenario: 審稿段業務調整印件規格

- **GIVEN** 訂單 SO-001 狀態 = 等待審稿
- **WHEN** 業務 / 客戶溝通後於印件詳情頁調整 `spec_note`
- **THEN** 系統 SHALL 直接更新 PrintItem（審稿段內無需走 OrderAdjustment）
- **AND** ActivityLog MUST 記錄變更

#### Scenario: 製作等待中業務調整印件規格走 OrderAdjustment

- **GIVEN** 訂單 SO-001 狀態 = 製作等待中
- **WHEN** 業務於印件詳情頁點擊「編輯」
- **THEN** 系統 SHALL 將「編輯」按鈕改為「申請異動」並提示「訂單已進入製作階段，調整需走訂單異動流程」
- **AND** 業務點擊「申請異動」後系統 SHALL 建立 OrderAdjustment 草稿，預填變更類型與差額

#### Scenario: 製作中業務調整印件規格走 OrderAdjustment

- **GIVEN** 訂單 SO-001 狀態 = 製作中
- **WHEN** 業務於印件詳情頁點擊「編輯」
- **THEN** 系統 SHALL 顯示「申請異動」按鈕並指向 OrderAdjustment 流程

#### Scenario: OrderAdjustment 執行後同步印件欄位

- **GIVEN** OrderAdjustment OA-001 狀態 = 已核可、明細包含「PrintItem PI-001 規格變更：500g 銅版紙 → 350g 雪銅」
- **WHEN** 業務點擊「執行」
- **THEN** OrderAdjustment.status SHALL → 已執行
- **AND** 系統 SHALL 同步更新 PrintItem PI-001.spec_note
- **AND** 若異動含金額差，系統 SHALL 建立對應補收 / 退款 Payment（或提示業務手動建）

#### Scenario: 已取消訂單印件唯讀

- **GIVEN** 訂單 SO-001 狀態 = 已取消
- **WHEN** 業務開啟印件詳情頁
- **THEN** 所有印件欄位 MUST 為唯讀
- **AND** 系統 MUST NOT 顯示「編輯」或「申請異動」按鈕

---

## REMOVED Requirements

### Requirement: 訂單階段改派負責業務（轉單）

**Reason**: 與既有「US-ORD-004 訂單分享與代理授權」機制功能重複，且直接改 `Order.sales_id` 會丟失原業務指紋，造成後續對帳、業績計算、客戶溝通歷史追溯困難。改派需求由兩條既有路徑覆蓋。

**Migration**:
- **臨時協助 / 代理**（最常見情境）：業務於訂單詳情頁分享 Tab 授予同事「檢視」或「編輯」權限，沿用 [Requirement: 訂單列表與分享權限](../order-management/spec.md) US-ORD-004 機制。`Order.sales_id` 維持原始負責業務。
- **正式轉單**（離職交接 / 部門調整）：由 Supervisor 走「Supervisor 重新指定」既有機制處理（既有機制範圍是 `approved_by_sales_manager_id`；若實際業務需要擴充至 `sales_id`，後續另開 change 處理，本 change 不擴充）。
