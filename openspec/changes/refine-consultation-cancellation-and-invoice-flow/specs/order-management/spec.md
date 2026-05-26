## MODIFIED Requirements

### Requirement: 訂單建立

系統 SHALL 支援以下訂單建立路徑（按 `order_type` 分類）：

**`order_type = 線下`（一般訂單）**：

1. 業務於需求單「成交」狀態點擊「轉訂單」，自動帶入印件規格、客戶資料、交期、報價金額。若需求單來源為 ConsultationRequest（`linked_consultation_request_id` 非空），主訂單建立時 SHALL 自動：(a) 在主訂單建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)、(b) 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 Payment 的 polymorphic 關聯）。**諮詢費 PlannedInvoice 由業務於主訂單既有發票時程規劃流程自行加入，系統 MUST NOT 自動建立諮詢費 PlannedInvoice 於主訂單**。`consultation_invoice_option` 作為客戶意向參考保留於 ConsultationRequest 實體，業務可參考決定主訂單發票時程，但不驅動系統行為。

**`order_type = 線上`（EC 訂單）**：

2. EC 線上單：Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

**`order_type = 諮詢`（諮詢訂單）**：

諮詢訂單只在以下**兩種**收尾情境之一才建立（webhook 階段不建）：

3. **不做大貨**：客戶最終沒做大貨製作，涵蓋兩個觸發點：
   - 3.1 諮詢人員於諮詢單階段點「結束諮詢 - 不做大貨」時建立
   - 3.2 諮詢結束做大貨後，需求單流失：系統將此事件歸類為「不做大貨」結局，自動建諮詢訂單收尾
4. **待諮詢取消（半額退費）**：諮詢人員 / 諮詢主管於待諮詢階段點「取消諮詢」並於 dialog 確認後建立，含退款 Payment 與 OrderAdjustment

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，**不建任何訂單**；需求單流失走需求單自身的退款 / 流失流程。

兩種情境共同的建立動作：(a) 訂單金額 = 諮詢費全額（2000），(b) 建立 OrderExtraCharge(charge_type=consultation_fee, amount=諮詢費)，(c) Payment 從 ConsultationRequest 轉移至此諮詢訂單，(d) **自動建立 PlannedInvoice 1 筆作為待開發票提醒**（金額依情境決定：不做大貨 / 需求單流失 = 2000；諮詢取消 = 1000），(e) 取消情境額外建立 OrderAdjustment(-1000) + 退款 Payment(-1000)，(f) **MUST NOT 自動開立 Invoice 或 SalesAllowance**（廢止 `consultation_invoice_option` 對發票自動化的影響）。

訂單實體 SHALL 包含 `order_type` 欄位（enum: `線下` / `線上` / `諮詢`，必填，建立時設定不可變更）。

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在「成交」需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿（`order_type = 線下`），自動帶入印件規格、客戶資料、交期
- **AND** 帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則

#### Scenario: 諮詢來源主訂單建立時自動建 OrderExtraCharge 與轉移 Payment

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，諮詢費 = 2000、印件費 = 4000
- **WHEN** 業務於「成交」需求單執行「轉訂單」
- **THEN** 系統 SHALL 建立主訂單（`order_type = 線下`）
- **AND** 系統 SHALL 自動建立 OrderExtraCharge（charge_type = consultation_fee、amount = 2000、description = 「諮詢費（諮詢單編號 [CR-XXX]）」）
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至主訂單（修改 linked_entity_type 與 linked_entity_id）
- **AND** 系統 MUST NOT 自動建立諮詢費的 PlannedInvoice（業務於主訂單既有發票時程規劃流程自行加入）
- **AND** 系統 MUST NOT 依 `consultation_invoice_option` 自動開立 Invoice（欄位降為客戶意向參考）
- **AND** 主訂單三方對帳：應收 = 6000 = 已收 2000 + 待繳 4000

#### Scenario: 諮詢結束不做大貨建諮詢訂單（觸發點 3.1）

- **WHEN** ConsultationRequest 諮詢結束，諮詢人員選「不做大貨」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何）

#### Scenario: 諮詢來源需求單流失歸類為「不做大貨」（觸發點 3.2）

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失（流失事件由需求單模組觸發）
- **WHEN** 系統處理需求單流失事件，且需求單 `linked_consultation_request_id` 非空
- **THEN** 系統 SHALL 將此事件歸類為「不做大貨」結局
- **AND** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 流失時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice

#### Scenario: 非諮詢來源的需求單流失不建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 為空（非諮詢來源）
- **WHEN** 需求單流失
- **THEN** 系統 MUST NOT 建立諮詢訂單
- **AND** 需求單流失走需求單自身的退款 / 流失流程，與諮詢訂單無關

#### Scenario: 待諮詢取消觸發建諮詢訂單與半額退費

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 諮詢主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（`order_type = 諮詢`、總額 = 諮詢費 2000）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 2000)
- **AND** 系統 SHALL 將 Payment P0 從 ConsultationRequest 轉移至諮詢訂單（金額 +2000 不變、status 維持已完成）
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = `諮詢取消退費`、status = 已核可、approved_by = system、approved_at = 取消時點、linked_after_sales_ticket_id = NULL、reason = 「諮詢取消退費（50%）」）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentMethod = 退款、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id、linked_entity_type = Order、linked_entity_id = 諮詢訂單 ID）
- **AND** 系統 SHALL 自動建立 PlannedInvoice 1 筆（orderId = 諮詢訂單 ID、scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 系統 MUST NOT 自動開立 SalesAllowance
- **AND** 諮詢訂單應收 = OEC(2000) + OA(-1000) = 1000

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（`order_type = 線上`），進入已有狀態機節點

#### Scenario: US-ORD-001 建立線下訂單（回簽觸發）

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「報價待回簽」狀態；活動紀錄 MUST 記錄操作人與時間戳

---

### Requirement: OrderAdjustment.adjustment_type 完整 enum

`OrderAdjustment.adjustment_type` SHALL 採用以下完整 enum 列舉，不再依 phase 限制可選範圍：

| adjustment_type | 適用情境 | 建立方式 |
|----------------|---------|---------|
| 規格變更 | 訂單期間客戶變更印件規格導致金額調整 | 業務手動 |
| 加印追加 | 訂單期間客戶要求加印 | 業務手動 |
| 退印 | 退印 / 退款（訂單期間或售後皆可）| 業務手動 |
| 折扣 | 業務給予客戶折扣 | 業務手動 |
| 加運費 | 訂單成立後補收運費 | 業務手動 |
| 急件費 | 訂單成立後補收急件費 | 業務手動 |
| 補退 | 售後補印收費 / 訂單期間補退 | 業務手動 |
| **諮詢取消退費** | **諮詢取消觸發的半額退款（諮詢費 × 50%）；僅由系統於諮詢取消觸發點自動建立**| **系統內生（業務 UI 不顯示此選項）**|
| 其他 | 不屬上述類別 | 業務手動 |

業務透過 UI 與 API 皆 SHALL 可選用「業務手動」類別的任一 adjustment_type，系統不再依 Order.status 推算限制。「諮詢取消退費」為系統內生 type — 業務 UI 的 adjustment_type 下拉選單 MUST NOT 包含此選項，僅由系統於 [consultation-request spec § 諮詢取消觸發建諮詢訂單與半額退費](../consultation-request/spec.md) 流程自動建立。

當業務於 AfterSalesTicket 內建關聯 OrderAdjustment 時，UI 仍 SHALL 預填合理的 adjustment_type（例：resolution=退款 → 預填退印；resolution=補印 → 預填補退），但業務可改選（限「業務手動」類別內選項）。

#### Scenario: 業務於 AfterSalesTicket 內建關聯 OrderAdjustment 預填 adjustment_type

- **GIVEN** AfterSalesTicket.resolution = 退款
- **WHEN** 業務於 ticket 內點「建立退款異動單」
- **THEN** 系統 SHALL 預填 adjustment_type = 退印
- **AND** 業務可改選為 折扣 / 補退 / 其他（「業務手動」類別內）
- **AND** 業務下拉選單 MUST NOT 顯示「諮詢取消退費」選項

#### Scenario: 業務於訂單期間自由選 adjustment_type

- **GIVEN** Order.status = 生產中
- **WHEN** 業務建立 OrderAdjustment
- **THEN** 業務 SHALL 可從「業務手動」8 個 enum（規格變更 / 加印追加 / 退印 / 折扣 / 加運費 / 急件費 / 補退 / 其他）選擇
- **AND** 業務下拉選單 MUST NOT 顯示「諮詢取消退費」選項

#### Scenario: 系統自動建立諮詢取消退費 OA

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、諮詢人員觸發取消諮詢確認流程
- **WHEN** 系統執行「諮詢取消觸發建諮詢訂單與半額退費」流程
- **THEN** 系統 SHALL 自動建立 OrderAdjustment（adjustment_type = `諮詢取消退費`、amount = -1000、status = 已核可、approved_by = system、approved_at = 取消時點）
- **AND** OA 建立 MUST NOT 經過業務 / 主管的 UI 操作
- **AND** OA 於訂單詳情頁顯示為唯讀（業務不可編輯系統內生 type 的 OA）

---

### Requirement: 諮詢訂單發票時間點處理

諮詢訂單（`order_type = 諮詢`）的 Invoice **MUST NOT 由系統自動開立**。所有諮詢費 Invoice 統一由諮詢人員於 PlannedInvoice 既有手動轉立流程處理（見 § 諮詢訂單收尾自動建 PlannedInvoice 規則）。

本 change 廢止既有「依 `consultation_invoice_option` 自動開立 Invoice」邏輯：
- `issue_now` 與 `defer_to_main_order` 兩值在任何諮詢訂單收尾情境（不做大貨 / 需求單流失 / 諮詢取消）下，系統 MUST NOT 自動觸發 Invoice 開立
- `consultation_invoice_option` 欄位保留於 ConsultationRequest 實體作為「客戶意向參考」純展示（不再驅動系統行為）
- 於諮詢結束做大貨 → 需求單成交轉一般訂單情境，諮詢費 PlannedInvoice **不自動建**，業務於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice 並可參考客戶意向決定獨立 / 併入主訂單其他 Invoice

#### Scenario: 諮詢訂單建立時不自動開立 Invoice（任一 invoice_option）

- **GIVEN** ConsultationRequest `consultation_invoice_option` ∈ {`issue_now`, `defer_to_main_order`}（任一值）
- **AND** 諮詢訂單因任一收尾情境（不做大貨 / 需求單流失 / 諮詢取消）建立
- **WHEN** 系統建立諮詢訂單
- **THEN** 系統 MUST NOT 自動開立任何 Invoice 或 SalesAllowance
- **AND** 系統 SHALL 依情境自動建立對應金額的 PlannedInvoice（見 § 諮詢訂單收尾自動建 PlannedInvoice 規則）
- **AND** 諮詢人員 SHALL 後續手動將 PlannedInvoice 轉為實際 Invoice（金額由諮詢人員依客戶需求決定）

#### Scenario: 諮詢結束做大貨主訂單不自動建諮詢費 PlannedInvoice

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立諮詢費的 PlannedInvoice
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice
- **AND** 業務 SHALL 可參考 `consultation_invoice_option` 客戶意向決定獨立 PlannedInvoice 或併入其他主訂單 PlannedInvoice

---

### Requirement: 諮詢取消對帳邏輯

諮詢取消（待諮詢狀態半額退費）情境下，諮詢訂單三方對帳檢視面板 MUST 識別此特殊情境並依新公式計算與標示。

**新對帳公式**：
- 應收總額 = OEC(2000) + ∑(已執行 OA(-1000)) = 1000
- 收款淨額 = Payment(+2000, 已完成) + Payment(-1000, 已完成) = 1000
- 發票淨額 = ∑ 開立 Invoice.total_amount - ∑ 已確認 SalesAllowance（由諮詢人員手動開立、預設目標 1000）
- 差額 = 應收總額 - 發票淨額 - 收款淨額 = 1000 - 發票淨額 - 1000 = -發票淨額

對帳狀態標示規則：
- 退款 Payment 仍處理中（OA 未已執行）：標示「退費處理中」、應收 SHALL 顯示為 2000（OA 未計入）、收款淨額顯示為 2000（含+2000、扣除處理中-1000 = 不計入處理中 Payment 規則，依既有對帳規則）；發票淨額 0 = 預期當下尚未開
- 退款 Payment 已完成（OA 已執行）且發票淨額 = 1000：標示「對帳通過 - 退費完成」
- 退款 Payment 已完成（OA 已執行）且發票淨額 ≠ 1000：標示「待對帳 - 發票金額需確認」、差額由既有對帳警示 banner 提示諮詢人員處理

#### Scenario: 諮詢取消退費完成對帳通過

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已執行) + Payment(+2000, 已完成) + Payment(-1000, 已完成) + Invoice(1000, 已開立)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 1000、差額 SHALL = 0
- **AND** 面板 SHALL 標示「對帳通過 - 退費完成」

#### Scenario: 諮詢取消退費處理中

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(諮詢取消退費, -1000, 已核可) + Payment(+2000, 已完成) + Payment(-1000, 處理中)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 收款淨額 SHALL = 2000（處理中退款 -1000 不計入既有對帳公式）
- **AND** 應收總額 SHALL = 2000（OA 未已執行不計入既有對帳公式）
- **AND** 對帳面板 SHALL 標示「退費處理中」並顯示「另含處理中退款 1000 元」

#### Scenario: 諮詢取消後發票金額不符提示

- **GIVEN** 諮詢訂單 OEC(consultation_fee, 2000) + OA(-1000, 已執行) + Payment(+2000) + Payment(-1000, 已完成) + Invoice(2000, 已開立，諮詢人員誤開全額)
- **WHEN** 業務 / 會計開啟對帳檢視面板
- **THEN** 應收總額 SHALL = 1000、收款淨額 SHALL = 1000、發票淨額 SHALL = 2000、差額 SHALL = -1000
- **AND** 對帳面板 SHALL 標示「待對帳 - 發票金額需確認」
- **AND** 既有對帳警示 banner SHALL 提示諮詢人員開立 SalesAllowance(-1000) 或作廢部分 Invoice

---

## ADDED Requirements

### Requirement: 諮詢訂單收尾自動建 PlannedInvoice 規則

當諮詢訂單於三個收尾情境（不做大貨 / 需求單流失 / 諮詢取消）任一建立時，系統 SHALL 自動建立 PlannedInvoice 1 筆作為「待開發票提醒」，讓諮詢人員於 PendingInvoices 列表頁看到待辦並手動轉為實際 Invoice。

**PlannedInvoice 實體**（Prototype 既有，[src/types/plannedInvoice.ts](../../../sens-erp-prototype/src/types/plannedInvoice.ts)）：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | string PK | 主鍵 |
| `orderId` | FK Order | 關聯訂單 |
| `expectedDate` | date | 預計開立日 |
| `scheduledAmount` | decimal | 預計金額（含稅）|
| `description` | string | 描述（如「諮詢費」/「諮詢費（取消退費後）」）|
| `status` | enum | `預計開立` / `已開立` / `已取消` |
| `linkedInvoiceId` | FK Invoice (nullable) | 實際開立 Invoice 的關聯（status = 已開立 時必填）|
| `createdBy` | string | 建立者 user_id 或 `system` |
| `createdAt` | timestamp | 建立時點 |

**狀態機**：
- `預計開立` → `已開立`（諮詢人員手動轉立 Invoice、寫入 linkedInvoiceId）
- `預計開立` → `已取消`（諮詢人員手動取消、寫入 cancelReason）

**自動建立規則**（依諮詢訂單收尾情境）：

| 觸發情境 | scheduledAmount | description | expectedDate |
|---------|-----------------|-------------|--------------|
| 諮詢結束不做大貨（諮詢人員點「結束諮詢 - 不做大貨」）| 2000 | 「諮詢費」 | 完成諮詢時點當天 |
| 諮詢來源需求單流失歸類為不做大貨 | 2000 | 「諮詢費」 | 需求單流失時點當天 |
| 諮詢取消（諮詢人員 / 諮詢主管點「取消諮詢」並確認）| 1000 | 「諮詢費（取消退費後）」 | 取消時點當天 |

**諮詢結束做大貨 → 需求單成交轉一般訂單情境**：系統 MUST NOT 自動於主訂單建立諮詢費 PlannedInvoice。業務於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice（既有 PlannedInvoice 手動建立流程），可參考 `consultation_invoice_option` 客戶意向決定獨立 / 併入其他 PlannedInvoice。

**共同欄位**：所有自動建立的 PlannedInvoice SHALL 設定 `status = 預計開立`、`createdBy = system`、`linkedInvoiceId = NULL`。

#### Scenario: 諮詢結束不做大貨自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、`consultant_id` 非空
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」、系統建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 完成諮詢時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 諮詢來源需求單流失自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、對應需求單流失
- **WHEN** 系統處理需求單流失事件、建立諮詢訂單
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 2000、description = 「諮詢費」、expectedDate = 流失時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 諮詢取消自動建 PlannedInvoice

- **GIVEN** ConsultationRequest 狀態 = 待諮詢
- **WHEN** 諮詢人員 / 諮詢主管於取消 dialog 確認取消、系統建立諮詢訂單 + OA + 退款 Payment
- **THEN** 系統 SHALL 自動建立 PlannedInvoice（orderId = 諮詢訂單 ID、scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、expectedDate = 取消時點當天、status = 預計開立、createdBy = system、linkedInvoiceId = NULL）

#### Scenario: 自動建立的 PlannedInvoice 出現在 PendingInvoices 待辦列表

- **GIVEN** 諮詢訂單收尾自動建立 PlannedInvoice、status = 預計開立
- **WHEN** 諮詢人員開啟 `/finance/pending-invoices` 列表頁
- **THEN** 列表 SHALL 包含此 PlannedInvoice
- **AND** 列表 SHALL 顯示「今天到期」狀態（`deriveExpectedDateStatus`）以提示諮詢人員優先處理
- **AND** 諮詢人員 SHALL 可點擊進入諮詢訂單詳情頁手動開立 Invoice

#### Scenario: 諮詢人員手動轉立 PlannedInvoice 為 Invoice

- **GIVEN** PlannedInvoice(scheduledAmount = 1000、description = 「諮詢費（取消退費後）」、status = 預計開立)
- **WHEN** 諮詢人員於諮詢訂單詳情頁發票區點「開立」並確認金額
- **THEN** 系統 SHALL 建立 Invoice（金額由諮詢人員確認、預設帶入 PlannedInvoice.scheduledAmount）
- **AND** 系統 SHALL 將 PlannedInvoice.status 改為「已開立」、linkedInvoiceId 寫入新建 Invoice ID
- **AND** PlannedInvoice 從 PendingInvoices 待辦列表移除

#### Scenario: 諮詢結束做大貨需求單成交主訂單不自動建諮詢費 PlannedInvoice

- **GIVEN** ConsultationRequest 諮詢結束選做大貨、需求單成交業務轉訂單
- **WHEN** 系統建立主訂單與 OEC、轉移 Payment
- **THEN** 系統 MUST NOT 自動於主訂單建立 PlannedInvoice
- **AND** 業務 SHALL 於主訂單既有發票時程規劃流程自行加入諮詢費 PlannedInvoice
