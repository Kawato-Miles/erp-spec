## Purpose

定義 ERP 系統所有實體的狀態機規格，涵蓋各實體狀態流轉規則、跨實體狀態傳遞鏈、完成度計算邏輯，以及關鍵設計決策。

本規格之業務來源為 [狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)（Notion 發布版本）。

涵蓋實體：需求單、訂單、工單、印件、任務、生產任務、出貨單。

QC 單狀態機已移至獨立 [qc capability](../qc/spec.md)，不在本 spec 範圍。本 spec § 完成度計算（齊套性邏輯 Kitting Logic）的「QC 通過數」欄位定義亦以 qc capability 為準。

---
## Requirements
### Requirement: 跨實體狀態向上傳遞鏈

當下層實體狀態變更時，系統 SHALL 依以下傳遞鏈自動推進上層實體狀態：

生產任務（製作中）→ 任務 → 工單 → 印件 → 訂單

生管指派師傅（更新 assigned_operator）MUST NOT 觸發向上傳遞。僅生產任務進入「製作中」時 SHALL 觸發向上傳遞。

供應商觸發的狀態變更 SHALL 與 ERP 內部觸發的狀態變更適用相同的向上傳遞規則。

#### Scenario: 生產任務開始製作時觸發狀態向上傳遞

WHEN 某生產任務狀態從「待處理」變為「製作中」
THEN 系統 SHALL 檢查其所屬任務下所有生產任務狀態，若為該任務首個進入「製作中」的生產任務，則將任務狀態推進為「製作中」
THEN 系統 SHALL 依相同邏輯逐層向上傳遞至工單、印件、訂單

#### Scenario: 部分生產任務完成不影響上層狀態回退

WHEN 某任務下有 3 個生產任務，其中 1 個已完成、2 個製作中
THEN 任務狀態 SHALL 維持「製作中」，不得因部分完成而回退或跳進

#### Scenario: 指派師傅不觸發向上傳遞

- **WHEN** 生管為某生產任務指派師傅（更新 assigned_operator 欄位）
- **THEN** 系統 MUST NOT 向上傳遞狀態變更至任務、工單層

#### Scenario: 首次報工觸發向上傳遞

- **WHEN** 某生產任務首次報工使狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依正常邏輯向上傳遞至任務、工單、印件、訂單

#### Scenario: 供應商報工觸發向上傳遞

- **WHEN** 供應商首次報工使生產任務從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依傳遞鏈自動推進：任務 → 工單 → 印件 → 訂單

---

### Requirement: 完成度計算（齊套性邏輯 Kitting Logic）

工單完成度 SHALL 以下列公式計算：

`floor(min(各「影響成品」生產任務之 QC 通過數 / 每份工單需生產數量))`

此計算 MUST 基於 QC 加總邏輯，不需序列化。

「QC 通過數」的正式欄位定義與計算公式見 [qc capability § QC 通過數與入庫數量的分層定義](../qc/spec.md)（`pt_qc_passed` = 該生產任務所有已完成 QC 紀錄之 `passed_quantity` 加總）。

#### Scenario: 工單完成度計算範例

WHEN 某工單有 2 個影響成品的生產任務 A 與 B
AND 生產任務 A 的 QC 通過數為 120，每份工單需生產數量為 50
AND 生產任務 B 的 QC 通過數為 90，每份工單需生產數量為 50
THEN 工單完成度 SHALL 為 floor(min(120/50, 90/50)) = floor(min(2.4, 1.8)) = floor(1.8) = 1

#### Scenario: 異動期間完成度計算持續運作

WHEN 工單處於異動流程中
THEN 完成度計算 SHALL 持續運作，不因異動狀態而暫停

#### Scenario: 打樣工單完成度獨立計算

WHEN 工單為打樣工單
THEN 其完成度 SHALL 獨立計算，不納入正式工單的完成度統計

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

**審稿維度合格為終態**：審稿維度的「合格」狀態無任何出向轉移。若印件合格後需變更內容（客戶改稿、印務拼版時發現原稿錯誤等），SHALL 透過「棄用原印件 + 建立新印件」處理，參考 `business-scenarios` spec §「打樣 NG 建新印件」既有路徑。本 change 的補件 loop 僅適用於審稿階段（尚未合格）的稿件內容修正。

**與印製維度回退路徑無衝突**：state-machines L330「印件打樣特殊流程」的「打樣 NG 後回退至等待中」屬於**印製維度**，不影響審稿維度狀態。打樣 NG 製程問題時，印件審稿維度維持「合格」不動，僅印製維度於同印件下建新打樣工單（業務情境見 business-scenarios L85-98）。

印製維度狀態僅在審稿維度為「合格」後開始推進，既有行為不變。

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

### Requirement: 印件打樣特殊流程

打樣印件送達後若品質不合格，SHALL 允許回退處理。

#### Scenario: 打樣 NG 後回退

WHEN 打樣印件狀態為「已送達」且品質判定為 NG
THEN 印件印製狀態 SHALL 回退至「等待中」，重新進入生產流程

#### Scenario: 打樣 NG 後棄用

WHEN 打樣印件狀態為「已送達」且品質判定為 NG，且決定不再重製
THEN 印件印製狀態 SHALL 變為「已棄用」

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
| 已核可 | 業務主管核可，等待業務執行 |
| 已退回 | 業務主管退回（含原因），業務可修改後重交 |
| 已執行 | 業務執行核可後的異動，應收總額更新（終態） |
| 已取消 | 業務主動取消（草稿或已退回階段）（終態） |

狀態轉換：

```
草稿 ─ 提交審核 ──────▶ 待主管審核
草稿 ─ 取消 ──────────▶ 已取消
待主管審核 ─ 核可 ────▶ 已核可
待主管審核 ─ 退回 ────▶ 已退回
已退回 ─ 修改後重交 ──▶ 待主管審核
已退回 ─ 取消 ────────▶ 已取消
已核可 ─ 執行 ────────▶ 已執行
```

OrderAdjustment 處於非終態時 SHALL NOT 阻擋主訂單狀態推進。OrderAdjustment「已執行」時 SHALL 觸發訂單應收總額更新（Order.total_with_tax + ∑ 已執行 OrderAdjustment.amount），但 SHALL NOT 自動建立或修改 PaymentPlan。

#### Scenario: OrderAdjustment 草稿提交審核

- **GIVEN** OrderAdjustment.status = 草稿
- **WHEN** 業務點擊「提交審核」
- **THEN** status SHALL → 待主管審核
- **AND** 系統 MUST 通知業務主管（Slack 或站內訊息）

#### Scenario: 業務主管核可後業務執行

- **GIVEN** OrderAdjustment.status = 已核可
- **WHEN** 業務點擊「執行」
- **THEN** status SHALL → 已執行
- **AND** 系統 MUST 重算訂單應收總額
- **AND** 系統 MUST NOT 自動修改 PaymentPlan

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

#### Scenario: 訂單已完成但 OrderAdjustment 未完結

- **GIVEN** 主訂單狀態 = 已完成
- **AND** OrderAdjustment.status = 待主管審核
- **WHEN** 業務 / 主管查看訂單詳情頁
- **THEN** 系統 SHALL 顯示提示 banner「該訂單仍有 N 筆訂單異動待主管審核」
- **AND** OrderAdjustment SHALL 仍可獨立完成審核與執行

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

### Requirement: PaymentPlan 變更觸發訂單回業務主管審核

訂單已通過業務主管審核後，業務 / 諮詢若變更 PaymentPlan（新增、刪除、修改期別金額或日期），訂單 SHALL 回退至「業務主管審核」狀態，等待主管重新核可。沿用 [archived change: add-sales-manager-quote-approval](../../../changes/archive/2026-04-27-add-sales-manager-quote-approval/proposal.md) 的「核可後可解鎖、變更後重審」機制。

#### Scenario: 業務修改 PaymentPlan 觸發回審

- **GIVEN** 訂單已通過業務主管審核，狀態 = 訂單確認
- **WHEN** 業務修改 PaymentPlan #2.scheduled_amount
- **THEN** 訂單狀態 SHALL → 業務主管審核
- **AND** 活動紀錄 MUST 記載變更原因（系統自動：「付款計畫變更」）

#### Scenario: 業務新增 PaymentPlan 期次觸發回審

- **GIVEN** 訂單已通過業務主管審核
- **WHEN** 業務新增 PaymentPlan #3
- **THEN** 訂單狀態 SHALL → 業務主管審核

#### Scenario: 業務主管核可後訂單恢復

- **GIVEN** 訂單因 PaymentPlan 變更回到「業務主管審核」
- **WHEN** 業務主管核可
- **THEN** 訂單 SHALL 推進至原狀態（變更前的後續狀態）

#### Scenario: PaymentPlan 變更不影響主訂單後續狀態

- **GIVEN** 訂單已進入「生產中」
- **WHEN** 業務變更 PaymentPlan
- **THEN** 訂單 SHALL NOT 回退至業務主管審核（已過審核段，不可回退；對應 § 訂單狀態不可逆）
- **AND** 系統 SHALL 顯示警告「訂單已進入生產段，付款計畫變更僅作記錄，無法重新審核」

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

