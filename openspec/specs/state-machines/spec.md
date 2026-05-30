## Purpose

定義 ERP 系統所有實體的狀態機規格，涵蓋各實體狀態流轉規則、跨實體狀態傳遞鏈、完成度計算邏輯，以及關鍵設計決策。

本規格之業務來源為 [狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)（Notion 發布版本）。

涵蓋實體：需求單、訂單、工單、印件、任務、生產任務、出貨單。

QC 任務狀態 = ProductionTask 狀態（依 reclassify-qc-and-add-inspection change 2026-05-20 歸檔，QCRecord 獨立實體廢止，QC 統一進 ProductionTask 框架，`type = qc`、`scope = print_item`）；inspection 任務狀態同樣 = ProductionTask 狀態（`type = inspection`、`scope = work_order_task`）。「QC 通過數」欄位定義以 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md) 為準（`pt_qc_passed = sum(ProductionTaskWorkRecord.passed_quantity where type IN ('qc', 'inspection') AND status = '已完成')`）。

---
## Requirements
### Requirement: 跨實體狀態向上傳遞鏈

當下層實體狀態變更時，系統 SHALL 依以下傳遞鏈自動推進上層實體狀態：

`type = production` 的生產任務（製作中）→ 任務 → 工單 → 印件 → 訂單

生管指派師傅（更新 assigned_operator）MUST NOT 觸發向上傳遞。僅 `type = production` 的生產任務進入「製作中」時 SHALL 觸發向上傳遞。

供應商觸發的狀態變更 SHALL 與 ERP 內部觸發的狀態變更適用相同的向上傳遞規則。

**QC PT 與 inspection PT 的狀態變更不走此鏈**（依 erp-consultant Round 1 P1 修正補強）：

- `type = qc`、`scope = print_item` 的 PT：狀態變更直接影響其所屬印件層的 `pi_warehouse_qty` 計算（依本 spec § 完成度計算公式）；MUST NOT 觸發「PT → 任務」傳遞
- `type = inspection`、`scope = work_order_task` 的 PT：狀態變更影響對應 production PT 的 `pt_effective_qty`（依 `requires_inspection` 旗標）；MUST NOT 觸發「PT → 任務」傳遞（inspection PT 不歸屬於任何「任務」實體）

#### Scenario: production 生產任務開始製作時觸發狀態向上傳遞

- **WHEN** 某 `type = production` 的生產任務狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 檢查其所屬任務下所有 production 生產任務狀態，若為該任務首個進入「製作中」的生產任務，則將任務狀態推進為「製作中」
- **THEN** 系統 SHALL 依相同邏輯逐層向上傳遞至工單、印件、訂單

#### Scenario: 部分生產任務完成不影響上層狀態回退

- **WHEN** 某任務下有 3 個 `type = production` 生產任務，其中 1 個已完成、2 個製作中
- **THEN** 任務狀態 SHALL 維持「製作中」，不得因部分完成而回退或跳進

#### Scenario: 指派師傅不觸發向上傳遞

- **WHEN** 生管為某生產任務指派師傅（更新 assigned_operator 欄位）
- **THEN** 系統 MUST NOT 向上傳遞狀態變更至任務、工單層

#### Scenario: 首次報工觸發向上傳遞

- **WHEN** 某 `type = production` 生產任務首次報工使狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依正常邏輯向上傳遞至任務、工單、印件、訂單

#### Scenario: 供應商報工觸發向上傳遞

- **WHEN** 供應商首次報工使 `type = production` 生產任務從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依傳遞鏈自動推進：任務 → 工單 → 印件 → 訂單

#### Scenario: QC PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = qc`、`scope = print_item` 的 QC PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發其所屬印件的 `pi_warehouse_qty` 重算（依本 spec § 完成度計算公式）

#### Scenario: inspection PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = inspection` 的 PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發對應 production PT 的 `pt_effective_qty` 重算

### Requirement: 完成度計算（齊套性邏輯 Kitting Logic）

工單完成度 SHALL 以下列公式計算：

`floor(min over affects_product production PT (pt_effective_qty / qpwo))`

其中 `pt_effective_qty` 定義（依 production PT 的 `requires_inspection` 屬性而定）：

- 若 `requires_inspection = TRUE`：`pt_effective_qty` = 對應 inspection PT（type = `inspection`）的 `pt_qc_passed`（= 所有已完成 inspection WorkRecord 的 passed_quantity 加總）
- 若 `requires_inspection = FALSE`：`pt_effective_qty` = `pt_produced_qty`（production PT 自身報工累計）

`pt_effective_qty` 與 `pt_qc_passed` 的正式欄位定義詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)。

此計算 MUST 基於累加邏輯，不需序列化。

**入庫公式**：C1 過渡期沿用既有「`pi_warehouse_qty = 工單完成度 × qppi`」（聚合至印件層）；C4 `move-warehousing-to-print-item-layer` 後，`pi_warehouse_qty` 改為「印件對應的 QC PT（type = `qc`、scope = `print_item`）通過數量加總」，本 Requirement 公式將進一步調整。

#### Scenario: 工單完成度計算範例（皆 requires_inspection = TRUE）

- **WHEN** 某工單有 2 個影響成品的 production PT：A（requires_inspection = TRUE）與 B（requires_inspection = TRUE）
- **AND** A 的 inspection PT.pt_qc_passed = 120、A.qpwo = 50
- **AND** B 的 inspection PT.pt_qc_passed = 90、B.qpwo = 50
- **THEN** 工單完成度 SHALL 為 floor(min(120/50, 90/50)) = floor(min(2.4, 1.8)) = floor(1.8) = 1

#### Scenario: 工單完成度計算範例（混合 requires_inspection）

- **WHEN** 某工單有 production PT：A（requires_inspection = TRUE，inspection PT.pt_qc_passed = 1000）與 B（requires_inspection = FALSE，pt_produced_qty = 1000）、皆 qpwo = 1
- **THEN** 工單完成度 SHALL 為 floor(min(1000/1, 1000/1)) = 1000

#### Scenario: 異動期間完成度計算持續運作

- **WHEN** 工單處於異動流程中
- **THEN** 完成度計算 SHALL 持續運作，不因異動狀態而暫停

#### Scenario: 打樣工單完成度獨立計算

- **WHEN** 工單為打樣工單
- **THEN** 其完成度 SHALL 獨立計算，不納入正式工單的完成度統計

#### Scenario: 分批出貨情境下 QC PT 累計與 pi_warehouse_qty 計算（P1-6，C1 過渡期）

- **WHEN** 印件分批出貨：第一批計劃 300 件、第二批計劃 200 件，total `pi_planned_qty = 500`
- **AND** QC PT.target = 500，第一筆 WorkRecord passed = 300（QC 完成第一批驗收，但 PT 未達標）
- **THEN** C1 過渡期 `pi_warehouse_qty` SHALL 依「工單完成度 × qppi」計算（非 QC PT.passed 直接 sum）
- **AND** 出貨單建立時 SHALL 檢查 `pi_warehouse_qty >= 出貨數量`，允許第一批 300 出貨（即使 QC PT 仍 pending）
- **AND** QC PT 仍維持 1 個累計 target，第二筆 WorkRecord passed = 200 後達標
- **AND** C4 `move-warehousing-to-print-item-layer` 後 `pi_warehouse_qty` 改為 `sum(QC PT.passed where status = 已完成)`，分批驗收的累計直接成為入庫量

### Requirement: 層級建立順序

實體建立 SHALL 遵循以下順序：訂單 → 印件審稿合格後建立工單 → 工單審核完成後建立生產任務。

#### Scenario: 印件審稿未合格時不得建立工單

WHEN 某訂單下的印件審稿狀態為「等待審稿」
THEN 系統 MUST NOT 允許為該印件建立工單

#### Scenario: 工單審核完成後方可建立生產任務

WHEN 某工單狀態為「製程審核完成」
THEN 系統 SHALL 允許為該工單建立生產任務

---

### Requirement: 需求單狀態機

需求單（Quote Request）SHALL 依以下狀態流轉：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失

角色權責：業務 / 諮詢業務負責需求確認、議價對談、成交 / 流失決策、以及「已評估成本 → 議價中」的直接推進；印務主管負責成本評估。業務主管不介入需求單流程任何狀態轉換。

業務主管 gate 位於訂單階段（線下訂單建立後 → 報價待回簽前），詳見本 spec § 訂單狀態機 與 [order-management spec](../order-management/spec.md) § 業務主管核准訂單。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管。其他狀態轉換不再觸發 Slack 通知（v2.0 的「進入已評估成本通知業務主管」隨業務主管 gate 移除而下架）。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 待評估成本進入已評估成本

- **WHEN** 印務主管執行「評估完成」
- **THEN** 需求單狀態 SHALL 變為「已評估成本」
- **AND** 系統 MUST 寫入 ActivityLog 記錄印務主管評估動作

#### Scenario: 業務直接從已評估成本推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價後成交

- **WHEN** 客戶於議價階段接受報價，業務點擊「成交」
- **THEN** 需求單狀態 SHALL 變為「成交」
- **AND** 系統 SHALL 允許後續建立訂單（轉訂單動作）
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 議價後流失

- **WHEN** 客戶於議價階段拒絕報價或逾期未回覆
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 此轉換 SHALL 由業務角色執行

#### Scenario: 業務於重新評估後可直接再進入議價中

- **GIVEN** 需求單原處於「議價中」狀態，業務執行「重新評估報價」
- **AND** 需求單回到「待評估成本」狀態，印務主管重新評估後再次進入「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 需求單狀態 SHALL 直接變更為「議價中」（無需業務主管核可）

---

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
2. **待諮詢取消（半額退費）**：諮詢人員 / 業務主管於待諮詢階段點「取消諮詢」並於 dialog 確認（含 OA 自動建 + 退款 Payment）

**重要釐清**：非諮詢來源（`linked_consultation_request_id` 為空）的需求單流失與諮詢訂單無關，不建任何訂單；需求單流失走需求單自身的退款 / 流失流程。

**諮詢訂單狀態簡化（本 change 廢止 invoice_option 對狀態機分支的影響）**：諮詢訂單狀態不進入線下 / 線上路徑共用段任何狀態（如稿件未上傳、等待審稿、製作中、出貨中、已開發票等皆不適用）。「已開發票」狀態於諮詢訂單路徑廢止（不再依 invoice_option 自動開立 Invoice、Invoice 由業務 / 諮詢人員手動開立）。諮詢訂單終態依情境分流：不做大貨 / 需求單流失 = 訂單完成；待諮詢取消 = 已取消（見 § Requirement: 諮詢取消諮詢訂單終態收斂）。

諮詢訂單終態的觸發條件依情境：

- **不做大貨 / 需求單流失情境**：諮詢訂單建立完成（Payment 轉移完成 + 自動建待開發票完成）即推進至「訂單完成」。理由：Payment(+諮詢費) 已完成、應收 = 已收，無待退款動作；待開發票是稅務待辦不影響訂單終態
- **待諮詢取消情境**：諮詢訂單建立即推進至「已取消」終態（諮詢取消不需製作中間態）。OA 於諮詢取消觸發時建為「已核可」（approved_by=system、executed_at=NULL）、應收 = OEC(2000) + ∑已執行或已核可 OA(-1000) = 1000；退款 Payment(-1000) 維持「處理中」，由諮詢人員後續處理銀行退款後切「已完成」，累計達 -1000 推進 OA「已執行」，不影響「已取消」終態（退款 Payment 切已完成只是金流完結、不再推進訂單狀態）；系統 MUST NOT 為諮詢取消自動建待開發票（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）

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
- 諮詢訂單 Invoice 由諮詢人員手動將 BillingInstallment 一鍵開立、系統 MUST NOT 自動開立 Invoice（不論 `consultation_invoice_option` 值為何，本 change 廢止此自動化）
- 待諮詢取消情境下，系統 SHALL 自動建立 OrderAdjustment(-1000, type=諮詢取消退費, status=已核可, approved_by=system, executed_at=NULL) + 退款 Payment(-1000, status=處理中)；**諮詢訂單建立即推進至「已取消」終態**（不需製作 / 退款中間態）；退款 Payment 切「已完成」累計達 -1000 推進 OA「已執行」，但不影響「已取消」終態（退款 Payment 切已完成只是金流完結、不再推進訂單狀態）；系統 MUST NOT 為諮詢取消自動建待開發票（見 § Requirement: 諮詢取消諮詢訂單終態收斂 / 諮詢取消退費 OA 系統建已核可）
- 諮詢結束做大貨且需求單成交轉一般訂單情境下 MUST NOT 建立諮詢訂單；諮詢費透過 Payment 轉移至一般訂單 + 一般訂單建立 OrderExtraCharge(consultation_fee) 進入一般訂單應收；諮詢費 BillingInstallment 不自動建，由業務於主訂單既有發票時程規劃流程自行加入

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
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount 2000、description 「諮詢費」、source_type = consultation_end_no_production、invoicing_status = 未開立）
- **AND** 系統 MUST NOT 自動開立 Invoice
- **AND** 諮詢訂單 SHALL 即時推進至「訂單完成」終態（Payment +諮詢費 已完成、應收已滿足）

#### Scenario: 需求單流失觸發建諮詢訂單並推進訂單完成

- **GIVEN** ConsultationRequest 狀態 = 已轉需求單、Payment 綁 ConsultationRequest
- **AND** 對應需求單流失
- **WHEN** 系統處理需求單流失事件
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）
- **AND** 系統 SHALL 在諮詢訂單上建立 OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 系統 SHALL 自動建立 BillingInstallment 1 筆（scheduled_amount 2000、description 「諮詢費」、source_type = quote_lost、invoicing_status = 未開立）
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
- **AND** 系統 MUST NOT 自動於主訂單建立諮詢費 BillingInstallment（業務自行規劃）

#### Scenario: 待諮詢取消建諮詢訂單與半額退費

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id`、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 2000)
- **AND** Payment P0 從 ConsultationRequest 轉移至諮詢訂單（+2000 不變、status 維持已完成）
- **AND** 系統 SHALL 自動建立 OrderAdjustment（amount = -1000、adjustment_type = 諮詢取消退費、status = 已核可、approved_by = system、executed_at = NULL、requires_supervisor_approval = false）
- **AND** 系統 SHALL 自動建立退款 Payment（amount = -1000、paymentStatus = 處理中、linkedOrderAdjustmentId = 上述 OA.id）
- **AND** 系統 MUST NOT 為諮詢取消自動建待開發票（留存 1000 收入由業務手動開票、未開票由對帳差額警示兜底）
- **AND** 系統 MUST NOT 自動開立 Invoice 或 SalesAllowance
- **AND** 諮詢訂單 SHALL 直接推進至「已取消」終態（諮詢取消不需製作 / 退款中間態）、paymentStatus = 已付款
- **AND** 退款 Payment 維持「處理中」（已取消後的金流動作）

#### Scenario: 待諮詢取消退款 Payment 後續切已完成（金流完結、不影響訂單終態）

- **GIVEN** 待諮詢取消後諮詢訂單已是「已取消」、退款 Payment(-1000, status=處理中, linkedOrderAdjustmentId=OA-c1) 存在、OA-c1 status = 已核可
- **WHEN** 諮詢人員處理銀行退款後將退款 Payment 切「已完成」並上傳退款證明附件
- **THEN** 退款 Payment.paymentStatus SHALL 改為「已完成」（金流完結）
- **AND** 系統 SHALL 重算 OA-c1 對應已完成 Payment 累計 = -1000 = OA.amount、推進 OA-c1 status → 已執行、executed_at = now
- **AND** 諮詢訂單 status MUST 維持「已取消」（退款 Payment 切已完成不再推進訂單狀態）
- **AND** 對帳：應收 1000 = 收款淨額（+2000 - 1000）= 1000，對帳通過

#### Scenario: 諮詢訂單不進入共用段

- **GIVEN** 訂單 `order_type = 諮詢`
- **WHEN** 系統檢視訂單狀態推進邏輯
- **THEN** 訂單 MUST NOT 進入「稿件未上傳」、「等待審稿」、「製作等待中」等共用段狀態
- **AND** 訂單 MUST NOT 進入「已開發票」狀態（本 change 廢止諮詢訂單路徑的此狀態）
- **AND** 諮詢訂單 MUST NOT 觸發 work_order / production_task 建立

#### Scenario: 訂單狀態推進至製作完成

- **WHEN** 訂單下所有印件的印製狀態皆為「製作完成」
- **THEN** 訂單狀態 SHALL 推進為「製作完成」（僅 `order_type ∈ {線下, 線上}` 適用）

---

### Requirement: 訂單狀態不可逆

訂單段落（付款段 → 審稿段 → 製作段 → 出貨段）間 MUST NOT 回退。

審稿段內子狀態（等待審稿 ↔ 待補件）SHALL 允許雙向互換。其他段落內子狀態維持單向推進。

#### Scenario: 訂單已進入製作中不可回退

WHEN 訂單狀態為「製作中」
THEN 系統 MUST NOT 允許將訂單狀態回退為「製作等待中」或更早狀態

#### Scenario: 審稿段內允許待補件與等待審稿互換

- **WHEN** 訂單狀態為「待補件」且不合格印件補件完成、無其他不合格印件
- **THEN** 系統 SHALL 允許訂單狀態回到「等待審稿」
- **AND** 此互換 MUST NOT 視為狀態回退

#### Scenario: 審稿段不可回退至付款段

- **WHEN** 訂單狀態位於審稿段（稿件未上傳 / 等待審稿 / 待補件）
- **THEN** 系統 MUST NOT 允許將訂單狀態回退至「已付款」、「已回簽」或更早狀態

### Requirement: 工單狀態機

工單（Work Order）SHALL 依以下狀態流轉：

草稿 → 製程確認中 ↔ 重新確認製程 → 製程審核完成 → 工單已交付 → 製作中 → 已完成

終態：已完成、已取消。

可逆路徑：
- 收回（Withdraw）：製程確認中 / 製程審核完成 → 草稿
- 異動（Modification）：由任務層 bubble-up 驅動。當任何任務處於「異動」或「已確認異動內容」時，工單狀態 SHALL 為「異動」。所有任務離開異動相關狀態後，工單自動回到正常狀態。

角色權責：印務負責製程確認與發起異動；印務主管負責製程審核；生管負責任務層異動確認（確認收到 + 完成安排）。

任務獨立交付模式下，工單狀態推進規則：
- 「製程審核完成」→「工單已交付」：首個任務（Task）交付時觸發
- 「工單已交付」→「製作中」：首個生產任務進入「製作中」時觸發（由狀態向上傳遞驅動）
- 後續任務交付時，工單狀態 MUST NOT 重複推進或回退
- 異動回到「製程審核完成」後，若已有生產任務處於「製作中」，新任務交付時工單 SHALL 直接推進為「製作中」（跳過「工單已交付」）

#### Scenario: 首個任務交付觸發工單狀態推進

- **WHEN** 工單狀態為「製程審核完成」，且該工單下首個任務被印務交付
- **THEN** 工單狀態 SHALL 推進為「工單已交付」

#### Scenario: 後續任務交付不影響工單狀態

- **WHEN** 工單狀態已為「工單已交付」或「製作中」，且該工單下其他任務被交付
- **THEN** 工單狀態 MUST NOT 變化，維持當前狀態

#### Scenario: 工單從草稿進入製程確認

- **WHEN** 印務建立工單並填寫製程資訊
- **THEN** 工單狀態 SHALL 變為「製程確認中」

#### Scenario: 製程確認需重新確認

- **WHEN** 印務主管審核製程後要求修改
- **THEN** 工單狀態 SHALL 變為「重新確認製程」
- **AND** 印務 SHALL 可修改後重新提交，狀態回到「製程確認中」

#### Scenario: 工單交付後進入製作

- **WHEN** 工單狀態為「工單已交付」且任一生產任務進入「製作中」
- **THEN** 工單狀態 SHALL 推進為「製作中」

---

### Requirement: 工單收回（Withdraw）機制

當工單已交付但需修正時，系統 SHALL 提供收回機制，允許將工單從「工單已交付」回退至適當狀態進行修正。

#### Scenario: 工單交付後收回

- **WHEN** 印務發現已交付工單有誤，執行收回
- **THEN** 工單狀態 SHALL 回退至「製程確認中」或「重新確認製程」
- **AND** 其下所有尚未開始製作的生產任務 SHALL 同步暫停

---

### Requirement: 工單異動流程

工單異動 SHALL 由印務發起。印務發起時 MUST 選擇「是否需重新審核製程」，系統依此決定前段路徑：

- 不需重新審核：受影響的任務立即進入「異動」狀態 → 工單 bubble-up 為「異動」→ 通知生管
- 需重新審核：工單直接回到「重新確認製程」→ 印務修改 → 印務主管審核 → 印務交付新任務（任務標記為「異動」）→ 工單 bubble-up 為「異動」→ 通知生管

兩條路徑最終匯入同一個收尾流程（任務層）：
1. 生管確認收到 → 任務進入「已確認異動內容」
2. 生管分配生產任務 → 安排師傅/通知外包廠
3. 生管完成安排 → 手動將任務改回「製作中」
4. 所有任務離開異動相關狀態 → 工單 bubble-up 回到正常狀態

異動期間（不論路徑），已在執行中且未被異動的生產任務 SHALL 持續運作，完成度計算 SHALL 持續運作，師傅與供應商報工 MUST NOT 受阻擋。

#### Scenario: 工單異動（不需重新審核）

- **WHEN** 印務在「工單已交付」或「製作中」狀態發起異動，選擇「不需重新審核」
- **THEN** 受影響的任務 SHALL 進入「異動」狀態
- **AND** 工單狀態 SHALL 因 bubble-up 變為「異動」
- **AND** 系統 SHALL 通知生管

#### Scenario: 工單異動（需重新審核）

- **WHEN** 印務在「工單已交付」或「製作中」狀態發起異動，選擇「需重新審核」
- **THEN** 工單狀態 SHALL 直接回到「重新確認製程」
- **AND** 印務修改後重新送審，走製程審核流程
- **AND** 審核通過後印務交付新任務，新任務 SHALL 標記為「異動」狀態
- **AND** 工單因任務 bubble-up 進入「異動」，通知生管

#### Scenario: 生管確認任務異動

- **WHEN** 生管在日程面板確認某任務的異動
- **THEN** 該任務狀態 SHALL 從「異動」變為「已確認異動內容」
- **AND** 工單 SHALL 維持「異動」狀態（因仍有任務處於異動相關狀態）

#### Scenario: 生管完成安排後恢復製作中

- **WHEN** 生管完成生產任務分配後，手動將任務從「已確認異動內容」改回「製作中」
- **THEN** 系統 SHALL 檢查工單下是否仍有任務處於「異動」或「已確認異動內容」
- **AND** 若無，工單 SHALL 自動回到正常狀態（由 bubble-up 決定）

#### Scenario: 需重新審核時已交付任務不收回

- **WHEN** 工單因異動回到「重新確認製程」，且該工單下已有任務被交付且在執行中
- **THEN** 已交付的任務 SHALL 繼續執行，MUST NOT 收回
- **AND** 新增的任務 SHALL 在審核通過後方可交付

#### Scenario: 異動後審核通過且已有任務在製作中時交付新任務

- **WHEN** 工單因異動（需重新審核）回到「製程審核完成」，且該工單下已有生產任務處於「製作中」，印務交付新增的任務
- **THEN** 新任務 SHALL 標記為「異動」，工單因 bubble-up 進入「異動」
- **AND** 系統 MUST NOT 將工單推進為「工單已交付」（跳過，因為已有任務在跑且任務為異動狀態）

#### Scenario: 異動期間完成度計算持續運作

- **WHEN** 工單處於「異動」狀態
- **THEN** 完成度計算 SHALL 持續運作，不因異動狀態而暫停
- **AND** 未受異動影響的師傅與供應商 SHALL 可繼續報工

---

### Requirement: 任務異動狀態機

任務（Task）SHALL 支援以下異動狀態路徑：

已交付 / 製作中 → 異動 → 已確認異動內容 → 製作中

- 「異動」：印務發起異動後，受影響的任務進入此狀態（系統自動設定）
- 「已確認異動內容」：生管確認收到異動通知後進入此狀態（生管手動觸發）
- 回到「製作中」：生管完成生產任務分配後手動觸發

#### Scenario: 任務進入異動

- **WHEN** 印務發起工單異動，且某任務下有生產任務被新增、修改或作廢
- **THEN** 該任務 SHALL 進入「異動」狀態

#### Scenario: 任務異動確認

- **WHEN** 生管在日程面板點擊「確認收到」
- **THEN** 任務狀態 SHALL 從「異動」變為「已確認異動內容」

#### Scenario: 任務恢復製作中

- **WHEN** 生管完成安排後點擊「已安排完畢，恢復製作中」
- **THEN** 任務狀態 SHALL 從「已確認異動內容」回到「製作中」

---

### Requirement: 印件狀態機（雙維度）

印件（Print Item）SHALL 以雙維度管理狀態：

**審稿維度**：
```
稿件未上傳 → 等待審稿 → 合格
                │
                └─► 不合格 ◄─► 已補件 ─► 合格
                        ▲            │
                        └── 再審 NG ──┘
```

**印製維度**：`等待中 → 工單已交付 → 部分工單製作中 → 製作中 → 製作完成 → 出貨中 → 已送達`

審稿維度允許的轉移：
- `稿件未上傳 → 等待審稿`：稿件首次上傳
- `等待審稿 → 合格`：審稿人員首審通過
- `等待審稿 → 不合格`：審稿人員首審判定內容不符
- `不合格 → 已補件`：客戶（B2C）或業務（B2B）完成補件
- `已補件 → 合格`：審稿人員重審通過
- `已補件 → 不合格`：審稿人員重審仍判定不合格

**審稿維度合格為終態**：審稿維度的「合格」狀態無任何出向轉移。若印件合格後需變更內容（客戶改稿、印務拼版時發現原稿錯誤、打樣後業務判定 `sampleResult = NG-稿件問題` 等），SHALL 透過「棄用原印件 + 建立新印件」處理：原印件 `printItemStatus` 轉「已棄用」+ 系統 clone 新印件並設定 `derived_from_print_item_id` 結構化追溯（實作機制見 [prepress-review spec § 印件追溯欄位 + § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。本 change 的補件 loop 僅適用於審稿階段（尚未合格）的稿件內容修正。

**與印製維度回退路徑無衝突**：本 spec § 印件打樣特殊流程 的「打樣 NG-製程問題 後回退至等待中」屬於**印製維度**，不影響審稿維度狀態。打樣 NG-製程問題（`sampleResult = NG-製程問題`）時，印件審稿維度維持「合格」不動，僅印製維度於同打樣印件下建新打樣 WorkOrder（業務情境見 [business-processes spec § 打樣流程規則](../business-processes/spec.md)）。

印製維度狀態僅在審稿維度為「合格」後開始推進，既有行為不變。

**已棄用狀態觸發場景**：印製維度的「已棄用」（既有 `PrintItemStatus` enum 值）目前唯一自動觸發場景為「打樣判定 NG-稿件問題」（見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)）。已棄用印件 MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單；雙維度狀態保留原值作為棄用前稽核軌跡，印件詳情頁仍可訪問。

#### Scenario: 印件審稿合格後允許建立工單

- **WHEN** 印件的審稿狀態變為「合格」
- **THEN** 系統 SHALL 允許為該印件建立工單
- **AND** 印製狀態 SHALL 維持「等待中」直到工單交付

#### Scenario: 部分工單開始製作

- **WHEN** 印件對應的多個工單中，部分工單進入「製作中」
- **THEN** 印件印製狀態 SHALL 變為「部分工單製作中」

#### Scenario: 所有工單皆製作中

- **WHEN** 印件對應的所有工單皆進入「製作中」
- **THEN** 印件印製狀態 SHALL 變為「製作中」

#### Scenario: 首審不合格

- **WHEN** 印件審稿維度狀態為「等待審稿」
- **AND** 審稿人員送出審核並標為「不合格」
- **THEN** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方（B2C 客戶 / B2B 業務）

#### Scenario: 補件完成後轉已補件

- **WHEN** 印件審稿維度狀態為「不合格」
- **AND** 客戶（B2C）或業務（B2B）完成補件上傳
- **THEN** 印件審稿維度狀態 SHALL 轉為「已補件」
- **AND** 該印件 SHALL 重新出現在原審稿人員的待審列表

#### Scenario: 補件重審通過

- **WHEN** 印件審稿維度狀態為「已補件」
- **AND** 原審稿人員送出審核並標為「合格」
- **THEN** 印件審稿維度狀態 SHALL 轉為「合格」
- **AND** 觸發下游自動建工單流程（沿用既有規則）

#### Scenario: 補件重審仍不合格

- **WHEN** 印件審稿維度狀態為「已補件」
- **AND** 原審稿人員送出審核並標為「不合格」
- **THEN** 印件審稿維度狀態 SHALL 轉回「不合格」
- **AND** 系統 SHALL 再次通知補件方

#### Scenario: 已棄用印件雙維度狀態保留作為稽核軌跡

- **GIVEN** 印件 X `printItemStatus = 已棄用`（因 NG-稿件問題觸發棄用）
- **WHEN** 系統檢查印件 X 的雙維度狀態
- **THEN** 雙維度狀態值保留原值（如審稿維度「合格」、印製維度棄用前的狀態），作為棄用前稽核軌跡
- **AND** 印件 X MUST NOT 出現於審稿員待審列表 / 主管覆寫候選清單 / 訂單完成度計算分母 / 新工單建立候選清單 / 出貨清單
- **AND** 印件 X 仍可於印件詳情頁直接訪問（稽核用途）

### Requirement: 印件打樣特殊流程

打樣印件對應的打樣 WorkOrder（`WorkOrder.type = 打樣`）推進至「已完成」後，業務（owner of 訂單）SHALL 於該打樣 WorkOrder 詳情頁判定 `sampleResult`（見 [prepress-review spec § 打樣結果業務判定](../prepress-review/spec.md)）。判定結果 SHALL 觸發不同的後續流程（依 enum 分支處理見以下 Scenarios）。系統 MUST 依業務判定結果自動觸發對應的下游動作（NG-稿件問題 → 自動棄用 + clone 新印件；OK / NG-製程問題 → 系統不自動觸發，保留業務決定權）。

#### Scenario: 打樣判定 OK 後開放大貨

- **WHEN** 業務判定 `sampleResult = OK`
- **THEN** 打樣印件繼續走後續流程（不變現有狀態機）
- **AND** 系統 MUST NOT 自動建大貨工單（業務後續手動建）
- **AND** 業務 SHALL 後續手動建大貨工單 / 進入大貨生產流程

#### Scenario: 打樣判定 NG-製程問題後印製維度回退

- **WHEN** 業務判定 `sampleResult = NG-製程問題`（製程問題，稿件本身無問題）
- **THEN** 該打樣印件審稿維度狀態維持「合格」不動（稿件本身無問題）
- **AND** 系統 MUST NOT 自動建新打樣 WorkOrder（業務 UI 自行建，保留業務決定權）
- **AND** 業務 SHALL 於同打樣印件下手動建立新打樣 WorkOrder 重新打樣
- **AND** ng_process 下游自動化處理機制細節待 OQ AR-13 解後實作

#### Scenario: 打樣判定 NG-稿件問題後棄用 + 建新打樣印件

- **WHEN** 業務判定 `sampleResult = NG-稿件問題`（稿件問題）
- **THEN** 系統 SHALL 自動觸發 atomic transaction：
  - 原打樣印件 `printItemStatus` 轉「已棄用」+ notes 加註棄用說明
  - 系統 clone 原打樣印件至新打樣印件（保留印件規格 / 客戶資訊 / 訂單關聯 / difficultyLevel；reset 審稿維度與印製維度）
  - 新打樣印件 `derived_from_print_item_id` 指向原打樣印件（結構化追溯）
  - 新打樣印件 `sampleResult = 待確認` / `printItemStatus = 待生產` / `reviewStatus = 稿件未上傳`
  - 訂單 `printItemCount + 1`
  - 訂單層 ActivityLog 寫入「NG-稿件問題：棄用 [原印件號]，建立新印件 [新印件號]」
- **AND** 流程細節詳見 [prepress-review spec § 打樣後棄用原印件建新印件](../prepress-review/spec.md)

---

### Requirement: 任務狀態機

任務（Task）SHALL 依以下狀態流轉：

待交付 → 已交付 → 製作中 → 已完成

可逆路徑：異動 → 已確認異動內容（中間態）→ 回到正常流程。

依工廠類型（自有/外包/中國）有不同終態路徑。

#### Scenario: 任務從待交付到已交付

WHEN 工單交付後，其下任務同步交付
THEN 任務狀態 SHALL 變為「已交付」

#### Scenario: 任務異動流程（含中間態）

WHEN 任務於製作中需要異動
THEN 任務狀態 SHALL 先進入「異動」狀態
AND 確認異動內容後 SHALL 進入「已確認異動內容」中間態
THEN 再回到正常流程繼續執行

#### Scenario: 任務 Bottom-up 作廢

WHEN 任務下所有生產任務皆為「已作廢」
THEN 任務 SHALL 自動標記為作廢

---

### Requirement: 生產任務狀態機

生產任務（Production Task）SHALL 依以下狀態流轉，依工廠類型有不同路徑：

自有工廠路徑：
- 待處理 → 製作中 → 已完成
- 「製作中」由首次報工觸發

加工廠路徑：
- 待處理 → 製作中 → 已完成
- 與自有工廠相同路徑

外包廠路徑：
- 待處理 → 製作中 → 運送中 → 已完成

中國廠商路徑：
- 待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

終態：已完成、已作廢、報廢。

生管指派師傅（assigned_operator）為欄位更新，不觸發狀態變更。生產任務維持「待處理」直到首次報工。

#### Scenario: 自有工廠生產任務首次報工進入製作中

- **WHEN** 生管或師傅為「待處理」狀態的自有工廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 自有工廠生產任務完成

WHEN 自有工廠的生產任務製作完畢
THEN 狀態 SHALL 直接從「製作中」變為「已完成」

#### Scenario: 外包工廠生產任務含運送

- **WHEN** 外包工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 中國工廠生產任務含集運

- **WHEN** 中國工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「已送集運商」
- **AND** 集運商出貨後 SHALL 變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」
- **AND** 向上狀態傳遞 SHALL 正常觸發

#### Scenario: 供應商標記製作完畢觸發運送中

- **WHEN** 供應商將「製作中」狀態的外包廠生產任務標記為製作完畢
- **THEN** 狀態 SHALL 從「製作中」變為「運送中」

#### Scenario: 中國廠商標記出貨觸發已送集運商

- **WHEN** 中國廠商將「製作中」狀態的生產任務標記出貨
- **THEN** 狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 待處理狀態的生產任務作廢

- **WHEN** 「待處理」狀態的生產任務因異動需作廢
- **THEN** 狀態 SHALL 變為「已作廢」（無成本，因尚未實際生產）

---

### Requirement: 出貨單狀態機

出貨單 SHALL 掛於訂單層級，依物流方式分為兩條路徑：

自行出貨：未處理 → 打包中 → 待出貨 → 出貨中 → 已送達
第三方物流：未處理 → 已出貨 → 運送中 → 已送達

出貨單 SHALL 支援異常分支處理。

#### Scenario: 自行出貨正常流程

WHEN 倉管開始打包出貨單
THEN 狀態 SHALL 從「未處理」依序經過「打包中」→「待出貨」→「出貨中」→「已送達」

#### Scenario: 第三方物流出貨流程

WHEN 出貨單交由第三方物流處理
THEN 狀態 SHALL 從「未處理」經過「已出貨」→「運送中」→「已送達」

#### Scenario: 出貨數量防呆

WHEN 建立出貨單並填寫出貨數量
THEN 出貨數量 MUST 滿足：出貨數 <= QC 入庫數 - 已出貨數
AND 系統 MUST NOT 允許超出可出貨數量的出貨單建立

---

### Requirement: 出貨單掛訂單層

出貨單 SHALL 掛於訂單層級，而非工單或印件層級。

#### Scenario: 出貨單歸屬於訂單

WHEN 建立出貨單
THEN 出貨單 SHALL 關聯至訂單
AND 一張訂單下 SHALL 可建立多張出貨單（支援分批出貨）

### Requirement: 訂單審稿段 Bubble-up 派生

訂單狀態位於審稿段（稿件未上傳 / 等待審稿 / 待補件）時，Order.status SHALL 由其下所有印件的 `reviewDimensionStatus` 派生，依以下優先序（4 條規則）：

1. 若存在任一印件 `reviewDimensionStatus = '不合格'` → Order.status = **待補件**
2. 否則，若所有印件 `reviewDimensionStatus = '合格'` → Order.status = **製作等待中**（進入製作段）
3. 否則，若存在任一印件 `reviewDimensionStatus = '等待審稿'` 或 `'已補件'` → Order.status = **等待審稿**（該印件稿件已上傳 / 已補件，球在審稿人員）
4. 否則（全部「稿件未上傳」；或「合格」+「稿件未上傳」混合）→ Order.status = **稿件未上傳**

**規則 3 的設計**：`reviewDimensionStatus = '等待審稿'` 本身即隱含「稿件已上傳、等待審稿人員處理」；EC 混合訂單中需審稿但尚未上傳稿件的印件狀態是「稿件未上傳」而非「等待審稿」，規則 3 不會誤觸發。

**觸發時機**：任何會改動印件 `reviewDimensionStatus` 的 action SHALL 於完成後觸發此派生邏輯：
- 印件送審完成（合格 / 不合格）
- 補件完成（不合格 → 已補件）
- 首次稿件上傳（稿件未上傳 → 等待審稿）

**邊界**：
- 免審稿快速路徑不走此派生（印件直接進入「合格」終態，Order 直達「製作等待中」）
- 訂單離開審稿段後此派生邏輯 MUST NOT 重新套用（不可逆段落原則）
- 打樣 NG 棄用後原訂單新增免審稿印件：Order 已離開審稿段時本派生不觸發，Order 維持當前製作段狀態
- 同印件追加製作走新訂單（見「同印件追加製作走新訂單」Scenario），本派生不處理原訂單分裂情境

#### Scenario: 送審不合格觸發 bubble-up

- **WHEN** 審稿人員送出審核結果為「不合格」，印件 `reviewDimensionStatus` 變為「不合格」
- **AND** 訂單位於審稿段
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 變為「待補件」

#### Scenario: 補件完成觸發 bubble-up

- **WHEN** 業務或會員完成補件，印件 `reviewDimensionStatus` 由「不合格」變為「已補件」
- **AND** 訂單下已無其他「不合格」印件
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 由「待補件」變為「等待審稿」

#### Scenario: 最後一件合格觸發離開審稿段

- **WHEN** 審稿人員送出最後一件印件的審核結果為「合格」，且訂單下所有印件皆為「合格」
- **THEN** 系統 SHALL 重新派生 Order.status
- **AND** Order.status SHALL 變為「製作等待中」（離開審稿段）

#### Scenario: 免審稿路徑不觸發 bubble-up

- **WHEN** 訂單回簽 / 付款後自動分配，所有印件經免審稿快速路徑直接進入「合格」
- **THEN** Order.status SHALL 直接進入「製作等待中」
- **AND** 訂單 MUST NOT 經過「稿件未上傳」、「等待審稿」、「待補件」

#### Scenario: 混合免審稿與需審稿未上傳印件不誤派為等待審稿

- **WHEN** 訂單混合印件：部分為免審稿（reviewDimensionStatus = '合格'）+ 部分為需審稿但尚未上傳稿件（reviewDimensionStatus = '稿件未上傳'）
- **THEN** Order.status SHALL 派生為「稿件未上傳」（規則 4）
- **AND** Order.status MUST NOT 派生為「等待審稿」（規則 3 不觸發，因為沒有印件處於「等待審稿」或「已補件」）

#### Scenario: QC 不合格不冒升至 Order 層

- **WHEN** 某生產任務的 QC 結果為「不合格」
- **THEN** Order.status MUST NOT 變為任何「不合格」相關狀態
- **AND** Order 層永遠沒有「QC 不合格」狀態

### Requirement: 訂單異動（OrderAdjustment）狀態機

OrderAdjustment SHALL 為**獨立狀態機**，不影響主訂單狀態。狀態定義：

| 狀態 | 說明 |
|------|------|
| 草稿 | 業務 / 諮詢建立但未提交審核 |
| 待主管審核 | 業務提交後等待業務主管核可 |
| 已核可 | 業務主管核可後等待業務於 OA 編輯介面建立關聯 Payment 並切「已完成」累計達 OA.amount |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | 對應 OA 的關聯 Payment（linkedOrderAdjustmentId = OA.id AND paymentStatus = '已完成'）累計 amount = OA.amount（含符號比較），系統自動推進；應收總額更新（終態） |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核 ──────────────────────────▶ 待主管審核
草稿 ─ 取消 ──────────────────────────────▶ 已取消
待主管審核 ─ 核可 ────────────────────────▶ 已核可
待主管審核 ─ 退回 ────────────────────────▶ 已退回
已退回 ─ 修改後重交 ──────────────────────▶ 待主管審核
已退回 ─ 取消 ────────────────────────────▶ 已取消
已核可 ─ 對應 Payment 累計達 OA.amount ──▶ 已執行
已執行 ─ 對應 Payment 取消致累計不足 ────▶ 已核可（修正路徑，沿用 ORD-003 候選做法 1）
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（∑ 印件費 + ∑ OrderExtraCharge.amount + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 BillingInstallment（請款期次）。

**「已執行」推進機制（本 change MODIFY refine-after-sales-refund 既有設計）**：

OrderAdjustment 的 `status = 已執行` 推進條件從「業務於 ticket 內建立關聯退款 Payment」改為「對應 OA 的關聯 Payment 累計達 OA.amount」。對稱適用退款 OA（amount < 0，配對 paymentMethod = '退款' 的負值 Payment）與補收 OA（amount > 0，配對 paymentMethod ≠ '退款' 的正值 Payment）。觸發時機：

- 每次業務將某筆 Payment 從 paymentStatus = '處理中' 切換為 '已完成' 時，系統 SHALL 重算該 OA 的對應 Payment 累計
- 若累計值（含符號）= OA.amount，系統 SHALL 同 transaction 推進 OA.status → 已執行、executedAt = 該 Payment 切「已完成」的時點
- 若累計值仍 ≠ OA.amount，OA 維持「已核可」

「執行」action 從業務手動觸發改為系統自動觸發；UI 上 OA 編輯介面 SHALL NOT 提供「執行」按鈕（沿用 refine-after-sales-refund 對 UI 入口的處置）。

**「已執行」回退機制（本 change 新增）**：

業務取消已完成的關聯 Payment 時，系統 SHALL 重算該 OA 的對應 Payment 累計：

- 若累計值（含符號）已 ≠ OA.amount，系統 SHALL 同 transaction 將 OA.status 從「已執行」回退至「已核可」、清空 executedAt
- 若累計值仍 = OA.amount（例如取消的不是最後一筆，剩餘已完成 Payment 仍滿足條件），OA 維持「已執行」

此回退機制 resolve 既有 ORD-003 OQ（候選做法 1：取消已完成 Payment 自動回退 OA 至已核可）。

**OrderAdjustment 雙重身份廢止**：本 change（add-after-sales-ticket）廢止 v1.2 的「雙重身份標註」設計。OrderAdjustment 不再有 `adjustment_phase` 欄位，不再依 Order.status 推算 phase，所有 adjustment_type 皆可於任何 Order 狀態下選用。原 phase = after_completion 的「售後服務單」業務情境改由 AfterSalesTicket 承載（見 [after-sales-ticket spec](../after-sales-ticket/spec.md)）。

OrderAdjustment 新增 `linked_after_sales_ticket_id`（FK -> AfterSalesTicket，nullable）欄位標示其源自哪張售後 ticket：

- **NULL**：訂單期間業務直接建立的金額異動（原 during_order 路徑）
- **非 NULL**：AfterSalesTicket 內部建立的關聯異動（退款 / 補印收費）

兩種情境共用同一狀態機。`linked_after_sales_ticket_id` 一經建立 MUST NOT 變動。

**對帳警示觸發**：對帳檢視面板的警示 banner 觸發條件仍為「`OrderAdjustment.executed_at > Order.completed_at`」（執行時點跨越訂單完成日），同時適用 linked_after_sales_ticket_id 為 NULL 與非 NULL 的 OrderAdjustment。完整觸發邏輯詳見 [order-management spec § 對帳警示 banner 觸發條件](../order-management/spec.md)。

#### Scenario: OrderAdjustment 草稿提交審核

- **GIVEN** OrderAdjustment.status = 草稿
- **WHEN** 業務點擊「提交審核」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 MUST 通知業務主管（Slack 或站內訊息）

#### Scenario: 退款 OA 對應單筆 Payment 切已完成推進已執行

- **GIVEN** OrderAdjustment OA-001（status = 已核可、amount = -5000）
- **AND** 業務已在 OA-001 編輯介面建立關聯 Payment P-001（amount = -5000, paymentMethod = '退款', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-001.id）
- **WHEN** 業務於 P-001 編輯 dialog 內補齊 paidAt 與 attachments、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-001 對應 Payment 累計 = -5000，等於 OA-001.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-001.status → 已執行、executedAt = now
- **AND** 系統 MUST 重算訂單應收總額（含此筆已執行 OA）
- **AND** 系統 MUST NOT 自動修改 BillingInstallment（請款期次）

#### Scenario: 補收 OA 對應 Payment 切已完成推進已執行（對稱化新規）

- **GIVEN** OrderAdjustment OA-002（status = 已核可、amount = +20000、adjustment_type = 加印追加）
- **AND** 業務已在 OA-002 編輯介面建立關聯 Payment P-002（amount = +20000, paymentMethod = '銀行轉帳', paymentStatus = '處理中', linkedOrderAdjustmentId = OA-002.id）
- **WHEN** 業務於 P-002 編輯 dialog 內補齊 paidAt 與 attachments、切換 paymentStatus → '已完成'、點擊「儲存」
- **THEN** 系統 SHALL 通過驗證並寫入 Payment.paymentStatus = '已完成'、completedAt = now
- **AND** 系統 SHALL 重算 OA-002 對應 Payment 累計 = +20000，等於 OA-002.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-002.status → 已執行、executedAt = now
- **AND** 系統 MUST 重算訂單應收總額

#### Scenario: 分次退款 / 分次補收累計未達 OA.amount 維持已核可

- **GIVEN** OrderAdjustment OA-003（status = 已核可、amount = -10000）
- **AND** 業務分兩次匯款，已建立兩筆關聯 Payment P-003a、P-003b（各 amount = -5000, paymentStatus = '處理中'）
- **WHEN** 業務先將 P-003a 切「已完成」
- **THEN** 系統 SHALL 重算 OA-003 對應已完成 Payment 累計 = -5000
- **AND** 累計 -5000 ≠ OA-003.amount (-10000)，OA-003.status SHALL 維持「已核可」
- **AND** OA-003.executedAt SHALL 維持 NULL

#### Scenario: 取消已完成 Payment 致累計不足回退 OA

- **GIVEN** OrderAdjustment OA-004（status = 已執行、amount = -5000、executedAt = 2026-05-21T10:00:00Z）
- **AND** 關聯 Payment P-004（paymentStatus = '已完成', amount = -5000）為觸發 OA 已執行的最後一筆
- **WHEN** 業務於 P-004 row 點擊「取消」並確認
- **THEN** 系統 SHALL 刪除 Payment P-004
- **AND** 系統 SHALL 重算 OA-004 對應已完成 Payment 累計 = 0
- **AND** 累計 0 ≠ OA-004.amount (-5000)，系統 SHALL 同 transaction 將 OA-004.status 從「已執行」回退至「已核可」、清空 executedAt
- **AND** 系統 MUST 重算訂單應收總額（不再含此筆 OA 為已執行）

#### Scenario: 取消已完成 Payment 但累計仍滿足維持已執行

- **GIVEN** OrderAdjustment OA-005（status = 已執行、amount = -10000）
- **AND** 兩筆已完成關聯 Payment（P-005a amount = -7000, P-005b amount = -3000）累計 -10000
- **WHEN** 業務於 P-005a row 點擊「取消」
- **THEN** 系統 SHALL 刪除 P-005a
- **AND** 系統 SHALL 重算累計 = -3000 ≠ OA-005.amount (-10000)
- **AND** 系統 SHALL 將 OA-005.status 從「已執行」回退至「已核可」、清空 executedAt
- **註**：此情境結果與「致累計不足回退」一致。若三方對帳邏輯認為「業務後續會補建新 Payment」，需 UAT 階段驗證業務是否覺得意外回退干擾流程

#### Scenario: 取消處理中 Payment 不影響 OA 狀態

- **GIVEN** OrderAdjustment OA-006（status = 已核可、amount = -5000）
- **AND** 關聯 Payment P-006（paymentStatus = '處理中', amount = -5000）
- **WHEN** 業務於 P-006 row 點擊「取消」
- **THEN** 系統 SHALL 刪除 Payment P-006
- **AND** OA-006.status SHALL 維持「已核可」（處理中 Payment 從未影響 OA 狀態）

#### Scenario: 業務主管退回後修改重交

- **GIVEN** OrderAdjustment.status = 已退回
- **WHEN** 業務修改 amount 或 reason 後點擊「重新提交」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 SHALL 清空原 reject_reason

#### Scenario: 主訂單推進不受 OrderAdjustment 阻擋

- **GIVEN** OrderAdjustment.status = 待主管審核
- **AND** 主訂單狀態 = 生產中
- **WHEN** 工單 / 印件層 bubble-up 觸發主訂單推進
- **THEN** 主訂單 SHALL 推進至下個狀態
- **AND** OrderAdjustment 維持「待主管審核」

### Requirement: AfterSalesTicket 狀態機

AfterSalesTicket SHALL 為獨立狀態機，與 Order 主狀態、OrderAdjustment 狀態機平行運作。狀態定義：

| 狀態 | 說明 |
|------|------|
| 受理中 | 業務已建 ticket、尚未填入 resolution |
| 處理中 | 業務已填入 resolution 並送出決議；下游動作（關聯 OrderAdjustment / 補印 PrintItem）可建立與執行 |
| 已結案 | 業務手動點「結案」推進的終態 |

狀態轉換：

```
受理中 ─ 送出決議（填 resolution）──▶ 處理中
處理中 ─ 業務點結案 ────────────────▶ 已結案
處理中 ─ 修改 resolution ───────────▶ 處理中（同態，允許 resolution 變更）
已結案 ─ 不可重開 ──────────────────▶ X
```

**無核可關卡**：AfterSalesTicket 狀態機無「待主管核可」階段。業務與業務主管於 Slack 線下討論，ERP 僅記錄結果（resolution / responsibility / slack_thread_url）。

**結案純手動**：MVP 階段「處理中 → 已結案」轉換 SHALL 為業務手動操作（點「結案」按鈕），系統 SHALL NOT 依關聯動作（補印 PrintItem 出貨完成、退款 Payment 入帳）自動推導結案。

**ticket 不阻擋主訂單**：AfterSalesTicket 處於任何狀態 SHALL NOT 影響 Order.status。Order.status 永遠保持「已完成」不回退。

**ticket 不阻擋 OrderAdjustment**：AfterSalesTicket 內建關聯 OrderAdjustment 仍走 OrderAdjustment 既有狀態機（含業務主管審核關卡）。ticket 結案前 OrderAdjustment 可獨立運作。

**結案後不可重開**：MVP 階段已結案 ticket 不支援重開。客戶後續再投訴時，業務 SHALL 建立新 ticket（已結案 ticket 不算入「最多 1 張」限制）。

完整 ticket 規格詳見 [after-sales-ticket spec](../after-sales-ticket/spec.md)。

#### Scenario: ticket 受理中填入 resolution 推進處理中

- **GIVEN** AfterSalesTicket.status = 受理中、resolution = NULL
- **WHEN** 業務填入 resolution = 退款 並點「送出決議」
- **THEN** status SHALL → 處理中
- **AND** 系統 SHALL 寫入 ActivityLog（事件描述 = 「決議送出」、resolution 值）

#### Scenario: ticket 處理中業務手動結案

- **GIVEN** AfterSalesTicket.status = 處理中、resolution = 退款、關聯 OrderAdjustment 已執行
- **WHEN** 業務點擊「結案」
- **THEN** status SHALL → 已結案
- **AND** 系統 SHALL 寫入 closed_at、closed_by

#### Scenario: ticket 結案不影響 Order.status

- **GIVEN** Order.status = 已完成、AfterSalesTicket.status = 處理中
- **WHEN** 業務於 ticket 上推進結案
- **THEN** AfterSalesTicket.status SHALL → 已結案
- **AND** Order.status MUST 維持「已完成」不變

#### Scenario: ticket 內 OrderAdjustment 獨立運作

- **GIVEN** AfterSalesTicket.status = 處理中
- **AND** ticket 內建 OrderAdjustment(linked_after_sales_ticket_id=此 ticket).status = 待主管審核
- **WHEN** 業務嘗試結案 ticket
- **THEN** 系統 SHALL 提示「ticket 內有未完結的 OrderAdjustment（待主管審核），建議完成後再結案」
- **AND** 系統允許強制結案（業務確認時）；OrderAdjustment 仍可獨立完成狀態機

### Requirement: 發票（Invoice）狀態機

Invoice SHALL 有獨立狀態機，狀態定義：

| 狀態 | 說明 |
|------|------|
| 開立 | 藍新 Mockup 開立成功；可被引用至 PaymentInvoice 與 SalesAllowance |
| 作廢 | 業務作廢（含作廢原因）；終態 |

狀態轉換：

```
開立 ─ 業務作廢 ──▶ 作廢
```

作廢後 ezpay_merchant_order_no 流水號 SHALL NOT 重用；同訂單若需重新開立發票，新發票流水號 SHALL +1。

#### Scenario: 發票開立後可作廢

- **GIVEN** Invoice.status = 開立
- **WHEN** 業務 / 諮詢點擊「作廢」並填入原因
- **THEN** status SHALL → 作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at、invalid_by

#### Scenario: 作廢後流水號不重用

- **GIVEN** Invoice #1 status = 作廢，ezpay_merchant_order_no = `O-25050601-INV-01`
- **WHEN** 業務於同訂單開立新 Invoice
- **THEN** 新 Invoice 的 ezpay_merchant_order_no SHALL = `O-25050601-INV-02`

#### Scenario: 作廢的發票不參與三方對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 作廢 的 Invoice，只加總 status = 開立 的 total_amount

### Requirement: 折讓單（SalesAllowance）狀態機

折讓單（中文：銷貨折讓證明單；依台灣統一發票使用辦法第 20 條）SHALL 有獨立狀態機，狀態定義（Mockup 階段精簡為兩態）：

| 狀態 | 說明 |
|------|------|
| 已確認 | 業務開立折讓並 Mockup 立即觸發確認；折讓正式生效，影響三方對帳；終態之一 |
| 已作廢 | 業務作廢已確認的折讓單（情境：金額打錯 / 客戶撤回投訴 / 開錯發票 / 雙重開立）；終態之一 |

狀態轉換：

```
（建立時直接寫入）─▶ 已確認 ─ 業務作廢折讓 ──▶ 已作廢
```

**Mockup 階段不使用「草稿」過渡態**：藍新 API 雖支援 Status = 0 不立即確認模式，但 Prototype 不模擬此情境（業務開立 = 自動已確認）。未來真實藍新串接若需要 Status = 0 等待買受人確認流程，另開 change 補「草稿 / 已取消」狀態。

已作廢的折讓單 SHALL NOT 再參與三方對帳。已作廢後該發票 SHALL 回到折讓前的剩餘可折讓金額狀態。

#### Scenario: 折讓開立後立即為已確認

- **WHEN** 業務開立 SalesAllowance
- **THEN** 系統 SHALL Mockup 呼叫藍新「開立折讓」+「觸發確認折讓」兩段式 API
- **AND** SalesAllowance.status SHALL 直接寫入「已確認」（不停留於草稿）
- **AND** issued_at 與 confirmed_at MUST 同時寫入

#### Scenario: 業務作廢已確認的折讓（undo 機制）

- **GIVEN** SalesAllowance.status = 已確認
- **WHEN** 業務於折讓詳情頁點擊「作廢折讓」並填入原因（如：金額打錯）
- **THEN** status SHALL → 已作廢
- **AND** 系統 MUST 寫入 invalid_reason、invalid_at
- **AND** 該發票剩餘可折讓金額 SHALL 回到作廢前狀態（因為已作廢折讓不再扣減）

#### Scenario: 已作廢的折讓不參與對帳

- **WHEN** 系統計算發票淨額
- **THEN** 系統 SHALL 排除 status = 已作廢 的 SalesAllowance
- **AND** 系統 SHALL 只扣減 status = 已確認 的 |allowance_amount|

### Requirement: 諮詢單狀態機（v2 簡化）

諮詢單（ConsultationRequest）SHALL 依以下狀態流轉（v2 簡化：移除「諮詢中」「諮詢結束」過渡狀態，諮詢進行不需 status 追蹤；`result` 欄位移除，由 status 直接表達結局）：

待諮詢 → 已轉需求單 / 完成諮詢 / 已取消

其中「已轉需求單」可在後續因需求單流失而**更新為「完成諮詢」**（最終結局更新，反映實際資料流向）。

**狀態說明**：

- **待諮詢**：webhook 自動建單後的初始狀態（只建 ConsultationRequest 與 Payment，**不建任何訂單**），等待諮詢人員自我認領 `consultant_id`（諮詢人員自行認領，主管亦可代為認領，詳見 [consultation-request spec](../consultation-request/spec.md) § 諮詢人員認領）；所有諮詢結束分支動作（完成諮詢 / 轉需求單 / 取消）皆於此狀態下執行
- **已轉需求單**：諮詢人員選做大貨後的中間狀態（雖列為終態但可更新），系統建立 QuoteRequest，`linked_quote_request_id` 寫入；Payment 維持綁 ConsultationRequest 等需求單結局
- **完成諮詢**：終態，諮詢訂單建立完成（兩種收尾情境之一：不做大貨 / 需求單流失），`linked_consultation_order_id` 寫入
- **已取消**：終態，待諮詢狀態取消預約退費，已建諮詢訂單 + 退款 Payment

實際終態合併為「完成諮詢」（含兩種子情境）/「已轉需求單」（後續可能再更新為完成諮詢）/「已取消」。

角色權責：諮詢人員負責諮詢單建立後的自我認領、結束分支決策（業務若具諮詢權限可代理）；金流系統觸發 webhook 自動建單。諮詢進行階段不在 status 機（諮詢人員與客戶討論時無系統動作）。

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
- **AND** 諮詢訂單 SHALL 推進至「已取消」終態（諮詢取消為「沒成交的生意」，見 § Requirement: 諮詢取消諮詢訂單終態收斂）
- **AND** ConsultationRequest 狀態 SHALL 推進至「已取消」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 諮詢人員自我認領

- **GIVEN** ConsultationRequest 狀態為「待諮詢」且 `consultant_id` 為空
- **WHEN** 諮詢人員於諮詢單清單頁點擊某張未認領諮詢單的「認領」按鈕
- **THEN** 系統 SHALL 將該諮詢人員 user_id 寫入 `consultant_id`
- **AND** 狀態維持「待諮詢」（標示已分派）
- **AND** 詳見 [consultation-request spec](../consultation-request/spec.md) § Requirement: 諮詢人員認領 涵蓋併發衝突、主管代為認領等情境

#### Scenario: 完成諮詢 - 不做大貨（建諮詢訂單收尾）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、Payment 綁 ConsultationRequest
- **WHEN** 諮詢人員點擊「完成諮詢（不做大貨）」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢訂單）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 ConsultationRequest 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑（已開發票 → 訂單完成）
- **AND** ConsultationRequest 狀態 SHALL 推進至「完成諮詢」
- **AND** `linked_consultation_order_id` MUST 寫入新諮詢訂單 ID

#### Scenario: 轉需求單 - 做大貨（只建需求單，不建訂單）

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、Payment 綁 ConsultationRequest
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

### Requirement: BillingInstallment 雙維度狀態機

BillingInstallment SHALL 維護兩個獨立狀態維度，互相不耦合：

**開票維度（invoicing_status）**：
```
未開立 ──[業務一鍵開票]──▶ 已開立（linked_invoice_id 寫入、Invoice.source_billing_installment_id 寫入）
已開立 ──[Invoice 作廢]──▶ 已作廢（linked_invoice_id 設 NULL，可重新開票）
已作廢 ──[業務一鍵開票]──▶ 已開立（重啟）
```

**收款維度（payment_status，derived）**：
```
依未取消已完成 PaymentAllocation 累計推導：
  累計 = 0：未收
  0 < 累計 < scheduled_amount：部分收款
  累計 ≥ scheduled_amount：已收訖
```

兩維度推導獨立，支援：
- 先收後開：收款維度先到「已收訖」、開票維度仍「未開立」
- 先開後收：開票維度先到「已開立」、收款維度仍「未收」
- 開票後作廢重開：開票維度從「已開立」回「已作廢」、收款維度不動（保留稽核）
- 拆期：原期次 cancelled = true 不入兩維度推導；兩筆新期次各自獨立推導

#### Scenario: 先收後開雙維度獨立推進

- **GIVEN** BI-001（scheduled_amount=30000, invoicing_status=未開立, payment_status=未收, cancelled=false）
- **WHEN** 業務登錄 Payment 30000 → 系統依序填滿建 PaymentAllocation（allocated=30000）→ 業務切 Payment 為已完成
- **THEN** BI-001.payment_status SHALL = 已收訖（已完成 PaymentAllocation 累計達 30000）
- **AND** BI-001.invoicing_status SHALL 維持 = 未開立
- **WHEN** 業務於 BI-001「一鍵開票」
- **THEN** BI-001.invoicing_status SHALL → 已開立
- **AND** BI-001.payment_status 維持 = 已收訖

#### Scenario: 發票作廢開票維度回退、收款維度不動

- **GIVEN** BI-002（invoicing_status=已開立, linked_invoice_id=INV-002, payment_status=已收訖）
- **WHEN** 業務於 INV-002 詳情頁作廢（填入作廢原因「統編誤填」）
- **THEN** INV-002.status SHALL = 作廢
- **AND** BI-002.invoicing_status SHALL → 已作廢、linked_invoice_id 設 NULL
- **AND** BI-002.payment_status SHALL 維持 = 已收訖（收款歷史保留）

#### Scenario: 拆期原期次 cancelled 不入推導

- **GIVEN** BI-003.scheduled_amount = 78000、業務點「拆此期」拆為 BI-003-A（2500）+ BI-003-B（75500）
- **WHEN** 系統執行拆期
- **THEN** BI-003.cancelled SHALL = true、cancel_reason = 「拆兩期」
- **AND** BI-003 SHALL NOT 入兩維度狀態推導（cancelled = true 期次過濾掉）
- **AND** BI-003-A / BI-003-B 各自獨立推導兩維度（初始 invoicing_status = 未開立、payment_status = 未收）

### Requirement: BillingInstallment 取代 PaymentPlan 狀態機（廢止 v1.13 PaymentPlan.status）

系統 SHALL 廢止 v1.13 PaymentPlan.status 三態（未收 / 部分收款 / 已收訖），由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925、過濾條件改為「未取消已完成 PaymentAllocation」）。

**BREAKING**：v1.13 PaymentPlan.status 三態（未收/部分收款/已收訖）廢止，由 BillingInstallment.payment_status derived 取代（推導邏輯沿用 v1.13 spec L919-925，過濾條件改為「未取消已完成 PaymentAllocation」）。

**Migration**：Prototype store 移除 derivePlanStatus helper，改為 deriveBillingInstallmentPaymentStatus helper。

#### Scenario: BillingInstallment.payment_status 由 PaymentAllocation 推導

- **GIVEN** BillingInstallment BI-001（scheduled_amount = 30000）
- **AND** PaymentAllocation PA-001（billing_installment_id=BI-001, allocated_amount=20000, payment.paymentStatus=已完成）
- **WHEN** 系統計算 BI-001.payment_status
- **THEN** 系統 SHALL 推導 payment_status = 部分收款（已分配 20000 < scheduled 30000）
- **WHEN** PaymentAllocation PA-002（allocated_amount=10000, payment.paymentStatus=已完成）追加
- **THEN** 系統 SHALL 推導 payment_status = 已收訖（已分配 30000 = scheduled 30000）

### Requirement: BillingInstallment 取代 PlannedInvoice 狀態機

系統 SHALL 廢止 v1.13 PlannedInvoice.status 三態（預計開立 / 已開立 / 已取消），由 BillingInstallment.invoicing_status 三態（未開立 / 已開立 / 已作廢）+ cancelled boolean 取代。

**BREAKING**：v1.13 PlannedInvoice.status 三態（預計開立/已開立/已取消）廢止，由 BillingInstallment.invoicing_status 三態（未開立/已開立/已作廢）+ cancelled boolean 取代：
- PlannedInvoice.status = 預計開立 → invoicing_status = 未開立 + cancelled = false
- PlannedInvoice.status = 已開立 → invoicing_status = 已開立 + cancelled = false
- PlannedInvoice.status = 已取消 → cancelled = true + cancel_reason 補寫
- 新增：invoicing_status = 已作廢（Invoice 作廢觸發回退，PlannedInvoice 既有設計無此態）

#### Scenario: BillingInstallment.invoicing_status 狀態流轉

- **GIVEN** BillingInstallment BI-001（invoicing_status = 未開立、cancelled = false）
- **WHEN** 業務於 BI-001 點「一鍵開立發票」、系統建立 Invoice INV-001 並回寫 BI-001.linked_invoice_id
- **THEN** BI-001.invoicing_status SHALL = 已開立
- **WHEN** INV-001 被作廢
- **THEN** BI-001.invoicing_status SHALL 回退至「已作廢」、BI-001.linked_invoice_id SHALL 清空
- **WHEN** 業務於 BI-001 點「取消期次」並補 cancel_reason
- **THEN** BI-001.cancelled SHALL = true、業務 SHALL 不再可於該期次新增開票或核銷動作

### Requirement: OrderAdjustment 狀態機修訂（補收正項跳過審核中間態）

系統 SHALL 沿用 v1.13 OrderAdjustment 狀態機主結構（草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消），但 SHALL 新增 requires_supervisor_approval derived field 決定狀態流轉路徑：補收正項 OA SHALL 跳過審核中間態直達已執行、退款負項 OA SHALL 沿用主管核可路徑。

v1.13 OrderAdjustment 狀態機保留主結構：草稿 → 待主管審核 → 已核可 / 已退回 → 已執行 / 已取消。**新增 requires_supervisor_approval derived field 決定狀態流轉路徑**：

| OA 類型 | requires_supervisor_approval | 狀態流轉 |
|---------|----------------------------|---------|
| 補收正項（amount > 0 且 adjustment_type ∈ {加印追加, 加運費, 急件費, 補退正項, 規格變更正項}）| false | **草稿 → 已執行（跳過待主管審核 + 已核可）**；approved_by = 業務 user_id、executed_at = now；應收 +N 立即認列，**不綁 Payment** |
| 退款負項（amount < 0）| true | 草稿 → 待主管審核 → 已核可 / 已退回 → 已執行（沿用 v1.13）；綁定退款 Payment 切已完成累計達 OA.amount 才推進已執行 |
| 諮詢取消退費（系統內生，amount = -1000 固定）| false | **草稿 → 已核可**（系統建立直接已核可，approved_by = system、executed_at = NULL）；退款 Payment 切已完成累計達 -1000 推進已執行（見 § Requirement: 諮詢取消退費 OA 系統建已核可，取代既有「系統建直接已執行」）|
| 規格變更（amount = 0）| - | 不建 OA（沿用既有規則）|

**對稱破壞理由**：對齊台灣印刷業實務分權（主管把關現金流出方向、不把關客戶下單追加方向）。spec 中明示「補收 OA 立即認列應收、退款 OA 必須綁退款動作」兩條獨立 invariant。

#### Scenario: 補收 OA 跳過審核中間態直達已執行

- **GIVEN** 業務建立 OA-010（amount=+8000, adjustment_type=加印追加, linked_after_sales_ticket_id=null）
- **WHEN** 業務點「儲存並執行」
- **THEN** 系統 SHALL 設定 OA-010.requires_supervisor_approval = false
- **AND** OA-010.status SHALL 直接 = 已執行（跳過「待主管審核」與「已核可」中間態）
- **AND** OA-010.approved_by = 業務 user_id、executed_at = now
- **AND** 應收 SHALL 立即 +8000

#### Scenario: 退款 OA 沿用主管核可 + 綁退款 Payment 推進已執行

- **GIVEN** 業務建立 OA-011（amount=-5000, adjustment_type=退印, linked_after_sales_ticket_id=ticket.id）
- **WHEN** 業務送審
- **THEN** OA-011.status SHALL = 待主管審核
- **WHEN** 業務主管核可
- **THEN** OA-011.status SHALL = 已核可
- **WHEN** 業務於 OA-011 介面建退款 Payment(-5000, 處理中) + 補對帳附件 + 切已完成
- **THEN** 系統 SHALL 驗證對應已完成 Payment 累計 = -5000 = OA-011.amount
- **AND** 系統 SHALL 同 transaction 推進 OA-011.status → 已執行、executedAt = now

### Requirement: 廢止「付款計畫變更觸發訂單回業務主管審核」

**BREAKING**：v1.13 spec「業務 / 諮詢變更已建立的付款計畫（新增 / 刪除 / 修改期別金額或日期）SHALL 觸發訂單回到『業務主管審核』狀態」規則廢止。BillingInstallment 變更 SHALL NOT 觸發訂單狀態回退，改為：

1. 寫入 OrderActivityLog 對應事件型別（DUE_DATE_CHANGED / EXPECTED_DATE_CHANGED / SPLIT / CANCELLED / BILLING_INSTALLMENT_CREATED）含 operator / timestamp / old_value / new_value
2. BillingInstallment.change_count derived field 累計 due_date + expected_invoice_date 變更次數
3. 訂單狀態維持不變（業務操作不阻塞）

事後稽核透過：CEO 指標 4「期次變更次數 per-installment 平均」+ Slack 通知主管（補收 OA 大額閾值）+ ActivityLog 完整軌跡三管道。

#### Scenario: 業務修改期次日期不觸發回審

- **GIVEN** BillingInstallment BI-020.due_date = 2026-06-01、訂單狀態 = 製作中（已過業務主管審核）
- **WHEN** 業務修改 BI-020.due_date 為 2026-06-15
- **THEN** 系統 SHALL 寫入 OrderActivityLog DUE_DATE_CHANGED 事件
- **AND** BI-020.change_count SHALL = 1
- **AND** Order.status SHALL 維持 = 製作中（**MUST NOT** 回退至「業務主管審核」）

#### Scenario: 業務拆期不觸發回審

- **GIVEN** 訂單狀態 = 製作中、BI-021.scheduled_amount = 78000
- **WHEN** 業務拆 BI-021 為 BI-021-A + BI-021-B
- **THEN** 系統 SHALL 寫入 OrderActivityLog SPLIT 事件
- **AND** Order.status SHALL 維持 = 製作中（不回審）

### Requirement: 諮詢取消諮詢訂單終態收斂（訂單完成 → 已取消）

系統 SHALL 將「待諮詢取消」情境的諮詢訂單終態改為「**已取消**」，取代既有訂單狀態機「諮詢訂單路徑：建立 → 訂單完成」中此情境的終態。諮詢結束不做大貨 / 需求單流失兩情境維持「訂單完成」不變（它們是諮詢正常收尾、有完整應收、非取消）。

**修訂理由**：諮詢取消是「沒成交的生意」，結算為「訂單完成」會污染成交統計（業務誤讀、月會數字虛胖）。「已取消」是訂單狀態機既有終態（[order-management spec § 訂單取消流程](../../specs/order-management/spec.md)），諮詢取消改走此終態符合語意。**推翻 unify-billing（2026-05-28）「諮詢取消結算訂單完成」拍板**（當時為順帶沿用、非 explore 深思）。

**top-down 連鎖空轉邊界**：諮詢訂單無 printItems / workOrders，一般訂單取消的 top-down 連鎖（工單轉取消 / 生產任務報廢）SHALL 為 no-op（迭代空集合，不報錯、不執行無意義連鎖）。

#### Scenario: 待諮詢取消推進已取消終態（取代訂單完成）

- **GIVEN** ConsultationRequest 狀態 = 待諮詢、已認領 `consultant_id`、Payment(P0: +2000, 已完成) 綁 ConsultationRequest
- **WHEN** 諮詢人員 / 業務主管於取消 dialog 選定 cancel_reason_category 並點擊「確認取消諮詢」
- **THEN** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 2000)
- **AND** Payment P0 從 ConsultationRequest 轉移至諮詢訂單（+2000 不變、status 維持已完成）
- **AND** 諮詢訂單 SHALL 直接推進至「**已取消**」終態（取代既有「訂單完成」）、paymentStatus = 已付款
- **AND** top-down 連鎖（工單 / 生產任務）SHALL 為 no-op（諮詢訂單無印件 / 工單）

#### Scenario: 諮詢結束不做大貨 / 需求單流失仍維持訂單完成（回歸保護）

- **GIVEN** ConsultationRequest 走「諮詢結束不做大貨」或「需求單流失」收尾
- **WHEN** 系統建立諮詢訂單收尾
- **THEN** 諮詢訂單 SHALL 維持推進至「訂單完成」終態（非已取消）
- **AND** 兩情境 SHALL 維持既有自動建 BillingInstallment（source_type = consultation_end_no_production / quote_lost）行為不變

### Requirement: 諮詢取消退費 OA 系統建已核可（取代既有系統建已執行）

系統 SHALL 將諮詢取消退費 OA（系統內生 amount=-1000）建為「**已核可**」（approved_by=system、executed_at=NULL、requires_supervisor_approval=false），沿用一般退款 OA「退款 Payment 切已完成累計達 -1000 推進已執行」機制。取代既有「諮詢取消 OA 系統建直接已執行」（[consultation-request spec 既有 + state-machines § OrderAdjustment 狀態機修訂](../../specs/state-machines/spec.md)）。

**修訂理由**：既有「諮詢取消 OA 一建即已執行」是 bug——「已執行」鎖死金額（[order-management spec L1230](../../specs/order-management/spec.md)，業務無法調整退款金額）+ 配「處理中」退款 Payment 破壞「OA 已執行 → 必有已完成 Payment 累計達 OA.amount」invariant。改建「已核可」同時滿足：系統審核通過（approved_by=system 免人工）+ 可調（[L1184 已核可後修改不需重審](../../specs/order-management/spec.md)）+ 善後歸一 + 修 invariant bug。

**OrderAdjustment 三方審核分流**（補充 unify-billing「OrderAdjustment 狀態機修訂」）：

| OA 類型 | requires_supervisor_approval | 建立後狀態流轉 |
|---------|------------------------------|----------------|
| 補收正項（amount>0 且 type ∈ 五項補收）| false | 草稿 → 已執行（跳過審核中間態，不綁 Payment）|
| 一般退款負項（amount<0，業務發起）| true | 草稿 → 待主管審核 → 人工核可 → 已核可 → 退款 Payment 切已完成推進已執行 |
| 諮詢取消退費（amount=-1000，系統內生）| false | **系統建直接「已核可」（approved_by=system）→ 退款 Payment 切已完成推進已執行** |

#### Scenario: 諮詢取消退費 OA 系統建已核可

- **GIVEN** 諮詢人員 / 業務主管確認諮詢取消
- **WHEN** 系統自動建立諮詢取消退費 OA
- **THEN** OA.status SHALL = 已核可、approved_by = system、approved_amount = -1000、executed_at = NULL、requires_supervisor_approval = false
- **AND** 系統 MUST NOT 將 OA 建為「已執行」（避免鎖金額 + 破壞 invariant）
- **AND** 業務 SHALL 可於 OA 已核可狀態調整退款金額（沿用既有「已核可後修改不需重審」）

#### Scenario: 諮詢取消退費 OA 經退款 Payment 切已完成推進已執行

- **GIVEN** 諮詢取消退費 OA(status=已核可, amount=-1000) + 退款 Payment(-1000, 處理中, linkedOrderAdjustmentId=OA.id)
- **WHEN** 諮詢人員將退款 Payment 切「已完成」並上傳退款證明
- **THEN** 系統 SHALL 重算 OA 對應已完成 Payment 累計 = -1000 = OA.amount
- **AND** 系統 SHALL 同 transaction 推進 OA.status → 已執行、executed_at = now
- **AND** invariant 維持：OA 已執行 → 必有已完成 Payment 累計達 OA.amount（修正既有「已執行配處理中 Payment」破洞）

