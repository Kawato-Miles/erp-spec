## MODIFIED Requirements

### Requirement: 訂單建立

系統 SHALL 支援兩種訂單建立方式：(1) 線下單由需求單成交後一鍵轉訂單，自動帶入印件規格、客戶資料、交期，**訂單建立後初始狀態為「待業務主管審核」**；(2) EC 線上單 Phase 1 暫不實作自動同步（狀態機已預留進入節點），納入 Phase 2。

線下單建立時，系統 MUST：
- 自動指派審核業務主管至訂單 `approved_by_sales_manager_id` 欄位（Phase 1 預設第一位業務主管）
- 將需求單 `payment_terms_note` 帶入訂單同名欄位
- 將訂單 `approval_required` 設為 `true`（Phase 1 全部訂單必審）
- 訂單 `lastApprovedPaymentTermsNote` 預設為 `null`

#### Scenario: 線下單由需求單轉入

- **WHEN** 業務在成交需求單點擊「轉訂單」
- **THEN** 系統建立訂單草稿，自動帶入印件規格、客戶資料、交期（帶入規則詳見[商業流程 spec](../business-processes/spec.md) § 需求單轉訂單欄位帶入規則）
- **AND** 訂單初始狀態 SHALL = 「待業務主管審核」
- **AND** 訂單 `approved_by_sales_manager_id` MUST 自動指派
- **AND** 訂單 `payment_terms_note` MUST 從來源需求單帶入

#### Scenario: EC 訂單進入節點預留

- **WHEN** EC 訂單同步功能上線（Phase 2）
- **THEN** 系統透過 API 全自動同步 EC 訂單（含一般訂單與客製單），進入已有狀態機節點
- **AND** EC 訂單 MUST NOT 進入「待業務主管審核」狀態（業務主管 gate 僅適用於線下訂單）

#### Scenario: US-ORD-001 建立線下訂單

- **WHEN** 業務在需求單執行「轉建訂單」
- **THEN** 系統 SHALL 建立訂單並使其進入「待業務主管審核」狀態；活動紀錄 MUST 記錄操作人與時間戳
- **AND** 訂單推進至「報價待回簽」前 MUST 經業務主管核准（見 § 業務主管核准訂單）

---

## ADDED Requirements

### Requirement: 訂單業務主管審核欄位

Order 資料模型 SHALL 新增以下業務主管審核相關欄位：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 審核業務主管 | approved_by_sales_manager_id | FK | Y（線下單）| | FK->使用者；訂單建立時指派、進入「報價待回簽」後鎖定（僅 Supervisor 可解鎖） |
| 是否需審核 | approval_required | boolean | Y | Y | 系統設定，Phase 1 線下單預設 true、線上 / 諮詢訂單預設 false |
| 收款條件備註 | payment_terms_note | text(500) | | | 從來源 QuoteRequest 帶入；業務主管於審核時查看作為決策依據；進入「報價待回簽」後鎖定 |
| 上次核准備註快照 | lastApprovedPaymentTermsNote | text(500) | | Y | 業務主管核准時系統寫入 `payment_terms_note` 快照；用於後續若訂單退回需重審時的條件對照 |

`approved_by_sales_manager_id` 欄位的可選範圍 MUST 限定為具業務主管角色的用戶。

#### Scenario: 線下訂單建立時自動指派業務主管

- **WHEN** 業務於需求單成交後點擊「轉訂單」建立線下訂單
- **THEN** 系統 SHALL 自動將 `approved_by_sales_manager_id` 設為預設業務主管（Phase 1 第一位）
- **AND** 系統 SHALL 將 `approval_required` 設為 `true`
- **AND** 系統 SHALL 將來源需求單的 `payment_terms_note` 內容寫入訂單同名欄位
- **AND** 系統 SHALL 將 `lastApprovedPaymentTermsNote` 預設為 `null`

#### Scenario: 進入報價待回簽後業務主管欄位鎖定

- **GIVEN** 訂單狀態為「報價待回簽」或更後狀態
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `approved_by_sales_manager_id`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀
- **AND** 此規則 MUST NOT 限制 Supervisor 的解鎖權限（見 § Supervisor 重新指定訂單業務主管）

---

### Requirement: 業務主管核准訂單

線下訂單從「待業務主管審核」推進至「報價待回簽」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核准，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核准 MUST 為單向狀態轉換動作。業務主管不核准時，訂單維持「待業務主管審核」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行；本 Requirement MUST NOT 提供「退回討論」按鈕（避免 ERP 內 / Slack 內雙軌討論造成資訊分散）。

業務主管核准時 MUST：
- 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`（快照）
- 寫入 OrderActivityLog（事件描述 = 「核准訂單（成交條件審核）」）
- 將訂單狀態推進至「報價待回簽」

業務主管核准時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: 業務主管核准訂單

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`、`payment_terms_note` 非空
- **AND** 該訂單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於訂單詳情頁點擊「核准訂單」
- **THEN** 訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 `lastApprovedPaymentTermsNote = payment_terms_note`
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核准訂單（成交條件審核）」）
- **AND** 業務 SHALL 看到「外發報價單」相關動作可推進

#### Scenario: 空收款備註核准需二次確認

- **GIVEN** 訂單狀態為「待業務主管審核」、`payment_terms_note` 為空
- **WHEN** 業務主管點擊「核准訂單」
- **THEN** UI MUST 跳出 Confirm Dialog「此訂單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，訂單狀態 SHALL 變更為「報價待回簽」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核准訂單（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，訂單狀態 MUST 維持「待業務主管審核」

#### Scenario: 業務主管不核准透過 Slack thread 溝通

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 業務主管認為需重新討論收款條件或成交條件
- **WHEN** 業務主管選擇暫不核准
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過 Slack thread 與業務直接討論
- **AND** 訂單狀態 MUST 維持「待業務主管審核」直到業務主管核准

#### Scenario: 業務不可從待業務主管審核直接推進至報價待回簽

- **GIVEN** 訂單狀態為「待業務主管審核」、`approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟訂單詳情頁
- **THEN** 系統 MUST NOT 顯示「核准訂單」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 審核中（已等待 X 天）」資訊
- **AND** 任何 API 請求嘗試由業務直接推進至「報價待回簽」 MUST 回傳權限不足錯誤

#### Scenario: 非指定業務主管不可核准

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 該訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管嘗試於訂單詳情頁點擊「核准訂單」
- **THEN** 系統 MUST NOT 顯示該按鈕
- **AND** 該訂單 MUST NOT 出現在當前業務主管的「訂單審核」待辦清單

---

### Requirement: 業務主管於訂單模組的資料可見範圍

業務主管 SHALL 於訂單模組的可見範圍依頁面區分：

| 頁面 | 業務主管可見範圍 |
|------|----------------|
| 訂單列表頁（`/orders`）| 所有訂單（提供部門總覽能力）|
| 訂單審核待辦頁（`/sales-manager/approvals`）| `approved_by_sales_manager_id = self` AND `status ∈ {待業務主管審核, 報價待回簽, 已回簽, 已取消}` |
| 訂單詳情頁（`/orders/{id}`）| 所有訂單可瀏覽；「核准訂單」按鈕僅在 `approved_by_sales_manager_id = self` 時顯示 |

預設篩選 `status = 待業務主管審核`，按進入時間 ASC 排序（最久優先）。

#### Scenario: 業務主管於訂單審核頁僅見自己被指派的訂單

- **GIVEN** 訂單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管登入並開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 在審核清單中顯示此訂單

#### Scenario: 業務主管於訂單列表頁可見全部

- **WHEN** 業務主管登入並開啟 `/orders`
- **THEN** 列表 SHALL 顯示所有訂單（含其他業務主管被指定、含未進入審核的訂單）
- **AND** 業務主管點開非自己被指定的訂單詳情頁，MUST NOT 顯示「核准訂單」按鈕

---

### Requirement: Supervisor 重新指定訂單業務主管

Supervisor SHALL 擁有「解鎖並重新指定訂單 `approved_by_sales_manager_id`」的權限，作為業務主管離職 / 請假 / 異動時的 Phase 1 處理機制，避免訂單卡在「待業務主管審核」狀態。

此操作 MUST 寫入 OrderActivityLog 記錄解鎖動作（操作者 = Supervisor、舊業務主管、新業務主管、解鎖原因 free text 必填）。新業務主管 MUST 為具業務主管角色的用戶。

#### Scenario: Supervisor 重新指定訂單業務主管

- **GIVEN** 訂單狀態為「待業務主管審核」
- **AND** 原指定業務主管因離職 / 請假 / 異動無法核准
- **WHEN** Supervisor 於訂單詳情頁執行「重新指定業務主管」並填寫解鎖原因
- **THEN** 系統 SHALL 允許 Supervisor 變更 `approved_by_sales_manager_id`
- **AND** 新業務主管 MUST 為具業務主管角色的用戶
- **AND** 系統 MUST 寫入 OrderActivityLog（操作者 = Supervisor、事件描述 = 「重新指定訂單業務主管」、舊值、新值、原因）
- **AND** 新業務主管 SHALL 於自己的訂單審核待辦頁看到此訂單

#### Scenario: 一般使用者不可重新指定訂單業務主管

- **WHEN** 業務、業務主管、印務主管或其他非 Supervisor 角色嘗試執行「重新指定訂單業務主管」
- **THEN** 系統 MUST NOT 顯示此操作入口
- **AND** 任何 API 請求嘗試變更 `approved_by_sales_manager_id` MUST 回傳權限不足錯誤
