## REMOVED Requirements

### Requirement: 業務主管核可議價推進

**Reason**: v2.0 設計的「核可進議價」gate 在實務上業務主管於議價前無新資訊可判斷，淪為形式蓋章。本 change 將業務主管的審核時點搬到「成交後 / 出報價單前」，更貼合真實工作節奏（見 design.md D1）。

**Migration**: 既有 v2.0 的「進入議價」按鈕業務主管核可邏輯與「業務主管首次查看」記錄機制 SHALL 移除；業務 SHALL 可於「已評估成本」狀態直接點擊「進入議價」推進。`approved_by_sales_manager_id` / `approval_required` / `payment_terms_note` / `lastApprovedPaymentTermsNote` 欄位 MUST 保留但語意改綁定至新增的「業務主管成交後審核」Requirement（見下方 ADDED）。

---

## MODIFIED Requirements

### Requirement: 需求單狀態轉換

需求單 SHALL 依照 [狀態機 spec](../state-machines/spec.md) § 需求單定義的規則進行狀態轉換。完整流程為：

需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 → 待業務主管成交審核 → 已核准成交 / 流失

其中：

- 「已評估成本 → 議價中」 SHALL 由業務直接執行，無需業務主管核可（v2.0 議價前 gate 已移除）
- 「議價中 → 成交」 SHALL 由業務於議價成交後觸發
- 「成交 → 待業務主管成交審核」 SHALL 由業務點擊「送業務主管審核」觸發（或於成交時自動推進）
- 「待業務主管成交審核 → 已核准成交」 MUST 由指定業務主管（`approved_by_sales_manager_id`）執行，前提為 `approval_required = true`
- 業務 MUST NOT 從「待業務主管成交審核」直接推進至「已核准成交」
- 流失可發生在 `'需求確認中' / '待評估成本' / '已評估成本' / '議價中' / '待業務主管成交審核'` 任一非終態（待業務主管成交審核 → 流失 為新增轉換，業務 SHALL 可於業務主管尚未核准前流失需求單）

#### Scenario: 完整成交流程

- **WHEN** 需求單經過需求確認、成本評估、議價、成交、業務主管成交後審核
- **THEN** 狀態依序轉換至「已核准成交」，業務於該狀態下方可執行「轉訂單」並出報價單給客人

#### Scenario: 業務直接從已評估成本進入議價

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 系統 SHALL 直接推進至「議價中」狀態
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 議價成交送業務主管審核

- **GIVEN** 需求單狀態為「議價中」
- **WHEN** 業務點擊「成交」
- **THEN** 系統 SHALL 推進至「待業務主管成交審核」狀態
- **AND** 系統 SHALL 透過 Slack Webhook 通知指定業務主管（approved_by_sales_manager_id）
- **AND** 業務 MUST NOT 看到「轉訂單」按鈕（待審核中不可轉訂單）

#### Scenario: 業務主管核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」、approved_by_sales_manager_id 等於當前業務主管、approval_required = true
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准成交」）
- **AND** 業務 SHALL 看到「轉訂單」按鈕

#### Scenario: 待業務主管成交審核流失

- **GIVEN** 需求單狀態為「待業務主管成交審核」（業務主管尚未核准）
- **WHEN** 客戶反悔、業務點擊「流失」並選流失原因
- **THEN** 需求單狀態 SHALL 變為「流失」
- **AND** 系統 MUST 寫入 ActivityLog
- **AND** 若需求單來源為 ConsultationRequest，觸發諮詢費收尾流程（add-consultation-request-and-revise-approval-gate change）

#### Scenario: US-QR-002 業務管理需求單進度

- **WHEN** 需求單成本評估完成進入「已評估成本」狀態
- **THEN** 業務 SHALL 於 `payment_terms_note` 欄位填寫與客戶確認的收款說明（選填）
- **AND** 業務 SHALL 看到「進入議價」按鈕可直接推進
- **AND** 需求單進入「議價中」後，業務 SHALL 視客戶回應執行「成交」（送業務主管審核）或「流失」標記終態
- **AND** 每次狀態變更 MUST 自動記錄至 ActivityLog
- **AND** 管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價

- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估
- **AND** 歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄
- **AND** 重新進入「已評估成本」後業務 SHALL 可直接再進入「議價中」（無需再經業務主管核可）
- **AND** 後續成交時若 payment_terms_note 與上次業務主管核准時相同（lastApprovedPaymentTermsNote），UI SHALL 提供業務主管「一鍵確認（條件未變）」捷徑（見「業務主管成交後審核」Requirement）

---

### Requirement: 成交轉訂單

系統 SHALL 支援需求單於「已核准成交」狀態時一鍵轉建訂單，自動帶入需求單的客戶資料、印件規格、交期、報價金額、`payment_terms_note` 等基本資料至訂單。

「轉訂單」按鈕 MUST 於「已核准成交」狀態才顯示；於「成交」（已送審）/「待業務主管成交審核」狀態下，業務 MUST NOT 可執行轉訂單。

#### Scenario: 業務於已核准成交需求單轉訂單

- **GIVEN** 需求單狀態為「已核准成交」
- **WHEN** 業務點擊「轉訂單」
- **THEN** 系統 SHALL 建立新訂單（type = `線下單`），自動帶入客戶資料、印件項目、交期、報價金額
- **AND** 訂單 MUST 與需求單建立關聯（QuoteRequest.linked_order_id）
- **AND** 業務 SHALL 出報價單給客人簽回（後續訂單流程依 order-management spec）

#### Scenario: 待業務主管成交審核狀態不可轉訂單

- **GIVEN** 需求單狀態為「待業務主管成交審核」
- **WHEN** 業務開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「轉訂單」按鈕
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核成交條件中（已等待 X 天）」資訊

#### Scenario: 成交未送審狀態不可轉訂單

- **GIVEN** 需求單狀態為「成交」（業務尚未點擊「送業務主管審核」或自動觸發失敗）
- **WHEN** 業務開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「轉訂單」按鈕
- **AND** UI SHALL 顯示「請先送業務主管審核」提示與「送業務主管審核」按鈕

---

### Requirement: 收款備註欄位

QuoteRequest 資料模型 SHALL 保有 `payment_terms_note` 欄位（text，最長 PAYMENT_TERMS_NOTE_MAX_LENGTH 字，選填），供業務記錄與客戶討論的收款條件，作為後續報價單內容基礎。

業務 SHALL 於需求單任何狀態（草稿、需求確認中、待評估成本、已評估成本、議價中、成交）皆可編輯此欄位；進入「待業務主管成交審核」狀態後 SHALL 鎖定為唯讀。

業務主管 SHALL 於成交後審核時查看此欄位內容，作為審核決策依據之一。本欄位 MUST NOT 為強制必填，但業務主管核准時若該欄位為空，UI MUST 觸發 Confirm Dialog 進行二次確認（見「業務主管成交後審核」ADDED Requirement）。

語意更新（vs v2.0）：欄位本身不變，但綁定的審核 gate 從議價前移至成交後。鎖定時點改為進入「待業務主管成交審核」狀態。

#### Scenario: 業務於議價中編輯收款備註

- **WHEN** 業務於需求單詳情頁編輯 `payment_terms_note` 欄位
- **THEN** 系統 SHALL 接受最長 PAYMENT_TERMS_NOTE_MAX_LENGTH 字 free text 內容
- **AND** 留空允許儲存，欄位存為空字串

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

需求單從「待業務主管成交審核」推進至「已核准成交」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，需求單維持「待業務主管成交審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行（從需求單 `slackLink` 欄位點擊進入 thread 回溯歷次討論）。

業務主管核准動作 MUST 寫入 QuoteRequestActivityLog（事件描述 = 「核准成交（出報價單前審核）」）。業務主管「首次查看待審核需求單時間」MUST 由系統自動記錄一次至 ActivityLog（事件描述 = 「業務主管首次查看（成交審核）」），作為 Phase 2 lead time KPI 資料基礎。

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

業務主管核准成功時，系統 MUST 將當前 `payment_terms_note` 寫入 `lastApprovedPaymentTermsNote` 欄位，供後續 US-QR-006 重新評估時的「條件未變一鍵確認」捷徑判斷。

#### Scenario: 業務主管核准需求單成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」、approved_by_sales_manager_id 等於當前業務主管、approval_required = true
- **WHEN** 業務主管於需求單詳情頁點擊「核准成交」
- **AND** payment_terms_note 欄位非空
- **THEN** 需求單狀態 SHALL 變更為「已核准成交」
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准成交（出報價單前審核）」）
- **AND** 業務 SHALL 看到「轉訂單」按鈕可推進至訂單建立
- **AND** lastApprovedPaymentTermsNote 寫入當前 payment_terms_note 快照

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 需求單狀態為「待業務主管成交審核」、payment_terms_note 為空
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
- **AND** 業務主管 SHALL 透過需求單 slackLink 進入 Slack thread 與業務直接討論
- **AND** 需求單狀態 MUST 維持「待業務主管成交審核」直到核准

#### Scenario: 業務不可直接從待業務主管成交審核推進至已核准成交

- **GIVEN** 需求單狀態為「待業務主管成交審核」、approval_required = true
- **WHEN** 業務（非指定業務主管）開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准成交」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「已核准成交」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管首次查看時間記錄

- **GIVEN** 需求單狀態為「待業務主管成交審核」、業務主管未曾查看
- **WHEN** 指定業務主管首次開啟此需求單詳情頁
- **THEN** 系統 MUST 寫入 ActivityLog 一次（事件描述 = 「業務主管首次查看（成交審核）」、時間戳）
- **AND** 後續業務主管再次查看 MUST NOT 重複寫入此事件

#### Scenario: 重新評估後快速 confirm

- **GIVEN** 需求單原處於「議價中」，業務執行 US-QR-006 重新評估
- **AND** 需求單回到「待評估成本」狀態，印務主管重新評估後再次進入「已評估成本」
- **AND** 業務再次推進議價 → 成交 → 待業務主管成交審核
- **AND** 重新評估後 payment_terms_note 與 lastApprovedPaymentTermsNote 相同
- **WHEN** 業務主管於需求單詳情頁查看核准區塊
- **THEN** UI SHALL 顯示「上次核准的收款條件：[內容]」與「本次成交時收款條件：[內容]」對照
- **AND** 若兩者相同，UI SHALL 提供「一鍵確認（條件未變）」捷徑按鈕
- **AND** 業務主管點擊捷徑按鈕後，需求單 SHALL 直接推進至「已核准成交」並寫入 ActivityLog（事件描述 = 「核准成交（重新評估後條件未變，快速確認）」）
- **AND** 若 payment_terms_note 已變更，UI MUST NOT 顯示捷徑，業務主管 MUST 走標準核准流程

---

### Requirement: 業務主管側選單與兩個頁面（v3 翻轉）

業務主管的中台側選單 SHALL 包含「需求單管理」單一 menu group，內含兩個 sub item：

1. **需求單核可頁**（`/sales-manager/approvals`）— 業務主管登入後的預設首頁
2. **需求單列表頁**（`/`）— 與業務 / Supervisor 共用的需求單列表頁

語意更新（vs v2.0）：兩個頁面結構不變，但「需求單核可頁」的篩選邏輯翻轉。

**需求單核可頁（`/sales-manager/approvals`）**：

- 預設套用篩選 `approved_by_sales_manager_id = self AND status = 待業務主管成交審核`，按「進入待業務主管成交審核時間」ASC 排序（最久優先）
- 業務主管可切換狀態篩選為「已核准成交」、「流失」、「全部」（限業務主管可見的 3 個狀態），但 `approved_by_sales_manager_id = self` 限制 MUST NOT 解除
- 顯示「等待天數」欄位（依進入「待業務主管成交審核」狀態的時間戳計算）
- MUST NOT 含 4 張流程階段 KPI 統計卡（業務主管視角不關注前段流程 count）
- MUST NOT 提供「新增」與「刪除」按鈕

**需求單列表頁（`/`）**：

- 業務主管 SHALL 可看到所有需求單（不限 `approved_by_sales_manager_id = self`）
- 此頁面對業務主管的角色 = 部門總覽，提供跨需求單比對 / 查詢的能力
- 業務主管於此頁面點開需求單詳情頁時，僅可對自己被指定的需求單執行「核准成交」（細粒度權限見 § 業務主管成交後審核）

#### Scenario: 業務主管進入核可頁看到待審核清單

- **GIVEN** 業務主管 A 為 5 張需求單的 approved_by_sales_manager_id（其中 3 張為「待業務主管成交審核」、1 張為「議價中」、1 張為「已核准成交」）
- **WHEN** 業務主管 A 進入 `/sales-manager/approvals`
- **THEN** 預設清單 SHALL 顯示 3 張「待業務主管成交審核」狀態的需求單
- **AND** 「議價中」狀態的需求單 MUST NOT 出現在預設清單（業務主管尚未介入時點）

#### Scenario: 業務主管於核可頁切換狀態篩選

- **WHEN** 業務主管於核可頁切換狀態篩選為「已核准成交」
- **THEN** 系統 SHALL 顯示 `approved_by_sales_manager_id = self AND status = '已核准成交'` 的需求單
- **AND** 列表 SHALL 不顯示其他業務主管被指定的需求單
