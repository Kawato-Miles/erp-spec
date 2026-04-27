## ADDED Requirements

### Requirement: 審核業務主管指定

系統 SHALL 支援業務在建立需求單時指定審核業務主管，進入「待評估成本」後該欄位鎖定不可更改。指定機制與「評估印務主管指定」對稱。

QuoteRequest 資料模型 SHALL 新增 `approved_by_sales_manager_id` 欄位（FK -> 使用者，必填，建立時填寫，進入「待評估成本」後唯讀）。可選範圍 MUST 限定為具業務主管角色的用戶。

#### Scenario: US-QR-014 設定審核業務主管

- **WHEN** 業務在建立需求單時，從業務主管清單選擇指定審核人員
- **THEN** 可選人員 MUST 限定為具業務主管角色的用戶
- **AND** 進入「待評估成本」後欄位 SHALL 鎖定不可更改
- **AND** 指定的業務主管 MUST 於需求單進入「已評估成本」狀態時，於自己的待辦清單看到此需求單

#### Scenario: 未指定審核業務主管不可送印務評估

- **GIVEN** 需求單 `approved_by_sales_manager_id` 為空
- **WHEN** 業務嘗試執行「送印務評估」
- **THEN** 系統 SHALL 拒絕並提示「請指定審核業務主管」
- **AND** 需求單狀態 MUST 維持原狀態（草稿或需求確認中）

#### Scenario: 進入待評估成本後審核業務主管不可變更

- **GIVEN** 需求單狀態為「待評估成本」、「已評估成本」、「議價中」、「成交」、「流失」之一
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `approved_by_sales_manager_id`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀
- **AND** 此規則 MUST NOT 限制 Supervisor 的解鎖權限（見「Supervisor 重新指定業務主管」Requirement）

---

### Requirement: 評估印務主管欄位 lifecycle 補齊

既有 `estimated_by_manager_id`（FK -> 使用者，必填）SHALL 對齊 `approved_by_sales_manager_id` 的 lifecycle 規則：建立時填寫，進入「待評估成本」後鎖定，僅 Supervisor 可解鎖重新指定。

本補齊為對齊兩個指定類欄位的對稱性，避免一般使用者誤解既有印務主管欄位的鎖定時機。

#### Scenario: 進入待評估成本後評估印務主管不可變更

- **GIVEN** 需求單狀態為「待評估成本」或更後狀態
- **WHEN** 一般使用者（業務、業務主管、印務主管）嘗試修改 `estimated_by_manager_id`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀

#### Scenario: Supervisor 解鎖評估印務主管

- **GIVEN** 需求單狀態為「待評估成本」或更後狀態
- **WHEN** Supervisor 於需求單詳情頁執行「重新指定評估印務主管」操作
- **THEN** 系統 SHALL 允許 Supervisor 變更 `estimated_by_manager_id`
- **AND** 系統 MUST 寫入 ActivityLog 記錄解鎖動作（操作者 = Supervisor、事件描述 = 「重新指定評估印務主管」、舊值、新值）

---

### Requirement: 收款備註欄位

QuoteRequest 資料模型 SHALL 新增 `payment_terms_note` 欄位（text，最長 500 字，選填），供業務記錄與客戶討論的收款條件，作為後續報價單內容基礎。

業務 SHALL 於需求單任何狀態（草稿、需求確認中、待評估成本、已評估成本、議價中）皆可編輯此欄位；進入「成交」或「流失」終態後 SHALL 鎖定為唯讀。

業務主管 SHALL 於核可進入議價前查看此欄位內容，作為核可決策依據之一。本欄位 MUST NOT 為強制必填，但業務主管核可時若該欄位為空，UI MUST 觸發 Confirm Dialog 進行二次確認（見「業務主管核可議價推進」Requirement）。

#### Scenario: 業務於需求單填寫收款備註

- **WHEN** 業務於需求單詳情頁編輯 `payment_terms_note` 欄位
- **THEN** 系統 SHALL 接受最長 500 字 free text 內容
- **AND** 超過 500 字 MUST 拒絕儲存並顯示字數超出提示
- **AND** 留空允許儲存，欄位存為 NULL

#### Scenario: 終態後收款備註鎖定

- **GIVEN** 需求單狀態為「成交」或「流失」
- **WHEN** 任何使用者嘗試修改 `payment_terms_note`
- **THEN** 系統 MUST 拒絕變更
- **AND** UI MUST 將該欄位顯示為唯讀

#### Scenario: 業務主管查看收款備註

- **WHEN** 業務主管於需求單詳情頁查看 `payment_terms_note`
- **THEN** 系統 SHALL 以唯讀方式呈現內容
- **AND** 系統 MUST NOT 提供業務主管編輯此欄位的入口

---

### Requirement: 核可條件預留欄位（Phase 2 條件化升級）

QuoteRequest 資料模型 SHALL 新增 `approval_required` 欄位（boolean，必填，系統設定，不可手動編輯）。Phase 1 範疇內所有需求單 SHALL 預設為 `true`，意即必經業務主管核可才能從「已評估成本」推進至「議價中」。

本欄位為 Phase 2 條件化 gate 升級預留。Phase 2 系統 SHALL 可依規則（報價金額、客戶類型、折扣率、收款條件特殊度等）動態計算此欄位值，當 `approval_required = false` 時，業務 SHALL 可直接從「已評估成本」推進至「議價中」，跳過業務主管 gate。

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
- **AND** Phase 1 既有 `approval_required = true` 的需求單 SHALL 繼續視為必核可，無需資料回填

---

### Requirement: 業務主管核可議價推進

需求單從「已評估成本」推進至「議價中」 SHALL 由指定的業務主管（`approved_by_sales_manager_id`）執行核可，前提為 `approval_required = true`。業務角色 MUST NOT 直接執行此狀態推進。

業務主管核可 MUST 為單向狀態轉換動作。業務主管不核可時，需求單維持「已評估成本」狀態，業務主管 / 業務之間的討論 SHALL 透過 Slack thread 進行（從需求單 `slackLink` 欄位點擊進入 thread 回溯歷次討論）；需重新評估成本時，由業務透過 US-QR-006「重新評估報價」路徑發起，本 Requirement MUST NOT 提供業務主管側的「退回討論」按鈕或 ActivityLog 記錄機制（避免 ERP 內 / Slack 內雙軌討論造成資訊分散）。

業務主管核可動作 MUST 寫入 QuoteRequestActivityLog（事件描述 = 「核可進入議價」）。業務主管「首次查看需求單時間」MUST 由系統自動記錄一次至 ActivityLog（事件描述 = 「業務主管首次查看」），作為 Phase 2 lead time KPI 資料基礎。

業務主管核可時若 `payment_terms_note` 欄位為空，UI MUST 觸發 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」需業務主管二次確認後才推進狀態，並於 ActivityLog 記錄「業務主管確認口頭對齊（無書面備註）」。

#### Scenario: US-QR-015 業務主管核可需求單進入議價

- **GIVEN** 需求單狀態為「已評估成本」且 `approval_required = true`
- **AND** 該需求單 `approved_by_sales_manager_id` 等於當前業務主管
- **WHEN** 業務主管於需求單詳情頁點擊「核可進入議價」
- **AND** `payment_terms_note` 欄位非空
- **THEN** 需求單狀態 SHALL 變更為「議價中」
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務主管、事件描述 = 「核可進入議價」）

#### Scenario: 空收款備註核可需二次確認

- **GIVEN** 需求單狀態為「已評估成本」且 `payment_terms_note` 為空
- **WHEN** 業務主管點擊「核可進入議價」
- **THEN** UI MUST 跳出 Confirm Dialog「此需求單無收款條件備註，確認已與業務口頭對齊？」
- **AND** 業務主管點擊確認後，需求單狀態 SHALL 變更為「議價中」
- **AND** 系統 MUST 寫入 ActivityLog（事件描述 = 「核可進入議價（業務主管確認口頭對齊，無書面備註）」）
- **AND** 業務主管點擊取消後，需求單狀態 MUST 維持「已評估成本」

#### Scenario: 業務主管不核可時透過 Slack thread 溝通

- **GIVEN** 需求單狀態為「已評估成本」
- **AND** 業務主管認為需重新討論收款條件或成本評估
- **WHEN** 業務主管選擇暫不核可
- **THEN** 業務主管 MUST NOT 於 ERP 內留 comment 或執行「退回」動作
- **AND** 業務主管 SHALL 透過需求單既有 `slackLink` 欄位進入 Slack thread，與業務直接討論
- **AND** 需求單狀態 MUST 維持「已評估成本」直到業務主管核可
- **AND** 若需重新評估成本，業務 SHALL 走 US-QR-006「重新評估報價」路徑（議價中後可用，本 change 不變更此既有路徑）

#### Scenario: 業務主管首次查看時間記錄

- **GIVEN** 需求單狀態為「已評估成本」且業務主管未曾查看
- **WHEN** 指定業務主管首次開啟此需求單詳情頁
- **THEN** 系統 MUST 寫入 ActivityLog 一次（事件描述 = 「業務主管首次查看」、時間戳）
- **AND** 後續業務主管再次查看 MUST NOT 重複寫入此事件

#### Scenario: 業務不可從已評估成本直接推進至議價中

- **GIVEN** 需求單狀態為「已評估成本」且 `approval_required = true`
- **WHEN** 業務（非指定業務主管）開啟需求單詳情頁
- **THEN** 系統 MUST NOT 顯示「進入議價」按鈕給業務
- **AND** UI SHALL 顯示「等待 [業務主管姓名] 核可中（已等待 X 天）」資訊（見「業務側等待可見性」Scenario）
- **AND** 任何 API 請求嘗試由業務直接推進至「議價中」 MUST 回傳權限不足錯誤

#### Scenario: 業務主管核可後業務照常處理成交 / 流失

- **GIVEN** 需求單狀態為「議價中」（已由業務主管核可進入）
- **WHEN** 業務於議價過程中與客戶協商
- **THEN** 業務 SHALL 可執行「成交」或「流失」動作（對應 US-QR-002 / US-QR-008 既有流程）
- **AND** 業務主管 MUST NOT 介入成交 / 流失決策

#### Scenario: 業務側等待可見性

- **GIVEN** 需求單狀態為「已評估成本」且未獲業務主管核可
- **WHEN** 業務於需求單詳情頁查看狀態資訊區
- **THEN** UI SHALL 顯示「等待 [業務主管姓名] 核可中」
- **AND** UI SHALL 顯示等待天數（依進入「已評估成本」狀態的時間戳計算，按日累加）
- **AND** 若業務主管已執行過「退回討論」，UI SHALL 顯示最新一筆退回理由與時間戳

#### Scenario: 重新評估後快速 confirm

- **GIVEN** 需求單原處於「議價中」，業務執行 US-QR-006 重新評估，回到「待評估成本」後再次進入「已評估成本」
- **AND** 重新評估後 `payment_terms_note` 與上次業務主管核可時的內容相同
- **WHEN** 業務主管於需求單詳情頁查看核可區塊
- **THEN** UI SHALL 顯示「上次核可的收款條件：[內容]」與「本次評估後收款條件：[內容]」對照
- **AND** 若兩者相同，UI SHALL 提供「一鍵確認（條件未變）」捷徑按鈕
- **AND** 業務主管點擊捷徑按鈕後，需求單 SHALL 直接推進至「議價中」並寫入 ActivityLog（事件描述 = 「核可進入議價（重新評估後條件未變，快速確認）」）
- **AND** 若 `payment_terms_note` 已變更，UI MUST NOT 顯示捷徑，業務主管 MUST 走標準核可流程

---

### Requirement: 業務主管側選單與兩個頁面

業務主管的中台側選單 SHALL 包含「需求單管理」單一 menu group，內含兩個 sub item（兩個獨立頁面）：

1. **需求單核可（`/sales-manager/approvals`）** — 業務主管登入後的預設首頁
2. **需求單列表（`/`）** — 與業務 / Supervisor 共用的需求單列表頁（同一 URL、同一元件）

兩個頁面服務不同視角，職責分離但共用 mock 資料：

**需求單核可頁（`/sales-manager/approvals`）**：
- 預設套用篩選 `approved_by_sales_manager_id = self AND status = 已評估成本`，按「進入已評估成本時間」ASC 排序（最久優先）
- 業務主管可切換狀態篩選為「議價中」、「成交」、「流失」、「全部」（限業務主管可見的 4 個狀態），但 `approved_by_sales_manager_id = self` 限制 MUST NOT 解除
- 顯示「等待天數」欄位（同「業務側等待可見性」邏輯）
- MUST NOT 含 4 張流程階段 KPI 統計卡（待確認需求 / 待評估成本 / 待報價 / 議價中）— 業務主管視角不關注前段流程 count
- MUST NOT 提供「新增」與「刪除」按鈕

**需求單列表頁（`/`，與業務 / Supervisor 共用）**：
- 業務主管 SHALL 可看到所有需求單（不限 `approved_by_sales_manager_id = self`），含其他業務主管被指定的、含未進入評估的草稿等
- 此頁面對業務主管的角色 = 部門總覽，提供跨需求單比對 / 查詢的能力
- 業務主管於此頁面點開需求單詳情頁時，僅可對自己被指定的需求單執行「核可進入議價」（細粒度權限見 § 業務主管核可議價推進）

業務主管 MUST NOT 看到「訂單管理 / 工單管理 / 任務管理」模組（與業務不同：業務主管在中台，業務在業務平台）。

業務（業務平台）的側選單 MUST 僅顯示「需求單管理 → 需求單列表」單一 menu group + sub item。訂單後續流程由訂單管理人接手，不在業務側選單（Miles 2026-04-27 修正）。

#### Scenario: 業務主管登入後預設導航至需求單核可頁

- **WHEN** 業務主管登入系統
- **THEN** 系統 SHALL 自動導航至 `/sales-manager/approvals`
- **AND** 該頁面 SHALL 預設套用篩選 `approved_by_sales_manager_id = self AND status = 已評估成本`
- **AND** 列表 SHALL 按「進入已評估成本時間」ASC 排序
- **AND** UI SHALL 顯示等待天數欄位

#### Scenario: 業務主管於核可頁切換篩選查看其他狀態

- **WHEN** 業務主管手動切換狀態篩選為「議價中」、「成交」、「流失」或「全部」
- **THEN** 系統 SHALL 顯示對應狀態的需求單清單
- **AND** 篩選 MUST 仍限制 `approved_by_sales_manager_id = self`（不顯示他人指定範圍的需求單）

#### Scenario: 需求單核可頁不含流程階段 KPI 統計卡

- **WHEN** 業務主管開啟 `/sales-manager/approvals`
- **THEN** 頁面 MUST NOT 顯示「待確認需求 / 待評估成本 / 待報價 / 議價中」4 張 KPI 統計卡
- **AND** 頁面僅保留搜尋框與 4 個篩選器（狀態 / 帳務公司 / 接單業務 / 日期範圍）

#### Scenario: 業務主管於需求單列表頁可看全部需求單

- **WHEN** 業務主管點側選單「需求單管理 → 需求單列表」進入 `/`
- **THEN** 頁面 SHALL 顯示所有需求單（不限自己被指定的）
- **AND** 此頁面 SHALL 顯示 4 張流程階段 KPI 統計卡（與業務 / Supervisor 視角一致）
- **AND** 業務主管點任一需求單進入詳情頁，若該需求單非自己被指定，MUST NOT 顯示「核可進入議價」按鈕

#### Scenario: 業務（業務平台）側選單僅顯示需求單管理

- **WHEN** 業務角色登入
- **THEN** 側選單 MUST 僅顯示「需求單管理 → 需求單列表」（單一 menu group + sub item）
- **AND** MUST NOT 顯示「訂單管理 / 工單管理 / 任務管理」

---

### Requirement: 資料可見範圍

需求單模組 SHALL 依角色與頁面實施資料可見範圍規則。本 Requirement 不取代 [user-roles spec](../user-roles/spec.md) § 模組存取權限模型 的「R/W vs X」粗粒度設定，而是補充細粒度資料範圍。

| 角色 / 頁面 | 需求單可見範圍 |
|------|--------------|
| 業務（需求單列表頁 `/`） | `created_by = self` |
| 業務主管（需求單核可頁 `/sales-manager/approvals`） | `approved_by_sales_manager_id = self` AND `status ∈ {已評估成本, 議價中, 成交, 流失}` |
| 業務主管（需求單列表頁 `/`） | 所有需求單（與 Supervisor 一致；提供部門總覽能力）|
| 兼具兩角色（業務 + 業務主管）的使用者 | 業務頁範圍與業務主管頁範圍各自獨立、不取聯集（兩個 URL）|
| Supervisor | 所有需求單（既有規則，本 change 不改）|

業務 MUST NOT 看到他人建立的需求單（除既有「分享需求單給同事參考」US-QR-010 / US-QR-011 授權機制涵蓋的範圍）。業務主管於「需求單核可頁」MUST NOT 看到他人指定範圍的需求單；於「需求單列表頁」 SHALL 可看到所有需求單（含未進入評估階段的草稿）以提供部門總覽能力，但對非自己被指定的需求單 MUST NOT 顯示「核可進入議價」按鈕。

#### Scenario: 業務主管於需求單核可頁不可見他人指定範圍

- **GIVEN** 需求單 `approved_by_sales_manager_id` 不等於當前業務主管
- **WHEN** 業務主管登入並開啟 `/sales-manager/approvals`
- **THEN** 系統 MUST NOT 在核可清單中顯示此需求單

#### Scenario: 業務主管於需求單列表頁可見全部

- **WHEN** 業務主管登入並開啟 `/`
- **THEN** 列表 SHALL 顯示所有需求單（含其他業務主管被指定、含草稿 / 需求確認中 / 待評估成本等所有狀態）
- **AND** 業務主管點開非自己被指定的需求單詳情頁，MUST NOT 顯示「核可進入議價」按鈕

---

### Requirement: Supervisor 重新指定業務主管

Supervisor SHALL 擁有「解鎖並重新指定 `approved_by_sales_manager_id`」的權限，作為業務主管離職 / 請假 / 異動時的 Phase 1 處理機制，避免需求單卡死。

此操作 MUST 寫入 ActivityLog 記錄解鎖動作（操作者 = Supervisor、舊業務主管、新業務主管、解鎖原因 free text 必填）。新業務主管 MUST 為具業務主管角色的用戶。

#### Scenario: Supervisor 重新指定業務主管

- **GIVEN** 需求單狀態為「待評估成本」、「已評估成本」、「議價中」之一
- **AND** 原指定業務主管因離職 / 請假 / 異動無法核可
- **WHEN** Supervisor 於需求單詳情頁執行「重新指定業務主管」並填寫解鎖原因
- **THEN** 系統 SHALL 允許 Supervisor 變更 `approved_by_sales_manager_id`
- **AND** 新業務主管 MUST 為具業務主管角色的用戶
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = Supervisor、事件描述 = 「重新指定業務主管」、舊值、新值、原因）
- **AND** 新業務主管 SHALL 收到 Slack Webhook 通知（對齊評估通知機制）

#### Scenario: 一般使用者不可重新指定業務主管

- **WHEN** 業務、業務主管、印務主管或其他非 Supervisor 角色嘗試執行「重新指定業務主管」
- **THEN** 系統 MUST NOT 顯示此操作入口
- **AND** 任何 API 請求嘗試變更 `approved_by_sales_manager_id` MUST 回傳權限不足錯誤

---

## MODIFIED Requirements

### Requirement: 需求單建立與編輯

系統 SHALL 支援業務/諮詢角色建立需求單，包含客戶資訊（從廠客管理選取）、印件項目、交期等基本資料。需求單建立後為「草稿」狀態。建立時 MUST 同時指定評估印務主管（`estimated_by_manager_id`）與審核業務主管（`approved_by_sales_manager_id`）。

#### Scenario: 業務建立新需求單

- **WHEN** 業務角色從需求單列表點擊建立
- **THEN** 系統建立草稿狀態需求單，業務可填寫客戶、印件規格、數量、交期等欄位
- **AND** 業務 MUST 從業務主管清單指定審核業務主管（`approved_by_sales_manager_id`）

#### Scenario: 業務編輯既有需求單

- **WHEN** 業務角色開啟草稿或需求確認中狀態的需求單
- **THEN** 系統允許編輯印件規格、數量、備註等欄位

#### Scenario: US-QR-001 建立需求單並送印務評估

- **WHEN** 客戶詢問報價，業務在系統內建立需求單
- **THEN** 業務 SHALL 填寫印件項目與規格備註，指定評估印務主管與審核業務主管，並執行「送印務評估」；需求單 MUST 建立成功，指定印務主管 MUST 收到評估通知；指定業務主管於後續「已評估成本」階段 MUST 收到核可通知（對齊 Slack Webhook 機制）

#### Scenario: US-QR-009 複製既有需求單

- **WHEN** 業務在需求單列表找到過往需求單並執行「複製」
- **THEN** 系統 SHALL 建立新需求單，MUST 帶入原需求單的客戶資訊、印件項目規格等關鍵欄位
- **AND** 業務 SHALL 重新指定評估印務主管與審核業務主管（不從原需求單複製）

---

### Requirement: 需求單狀態轉換

需求單 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 需求單定義的規則進行狀態轉換。完整流程為：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交/流失。其中「已評估成本 → 議價中」轉換 MUST 由指定的業務主管核可執行（前提為 `approval_required = true`），業務角色 MUST NOT 直接執行此轉換。

#### Scenario: 完整成交流程

- **WHEN** 需求單經過需求確認、成本評估、業務主管核可、議價流程
- **THEN** 狀態依序轉換至「成交」，各轉換由對應角色觸發

#### Scenario: 需求單流失

- **WHEN** 業務判斷客戶不成交
- **THEN** 業務可將需求單標記為「流失」，MUST 選擇流失原因（LOV 選單）

#### Scenario: US-QR-002 業務管理需求單進度

- **WHEN** 需求單成本評估完成進入「已評估成本」狀態
- **THEN** 業務 SHALL 於 `payment_terms_note` 欄位填寫與客戶確認的收款說明（選填）
- **AND** 業務 MUST NOT 看到「進入議價」按鈕（轉換由業務主管執行，見 US-QR-015）
- **AND** 業務 SHALL 於需求單詳情頁看到「等待 [業務主管姓名] 核可中（已等待 X 天）」資訊
- **AND** 需求單進入「議價中」後（由業務主管核可推進），業務 SHALL 視客戶回應執行「成交」或「流失」標記終態
- **AND** 每次狀態變更 MUST 自動記錄至 ActivityLog
- **AND** 管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價

- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估
- **AND** 歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄
- **AND** 重新進入「已評估成本」後 SHALL 再次由業務主管核可才能進入「議價中」（若 `payment_terms_note` 與上次核可時相同，UI SHALL 提供快速確認捷徑，見「業務主管核可議價推進」§ Scenario「重新評估後快速 confirm」）

---

### Requirement: Slack Webhook 通知

系統 SHALL 在關鍵狀態轉換時透過 Slack Webhook 發送通知，確保相關角色即時收到更新。

#### Scenario: 需求單狀態變更觸發通知

- **WHEN** 需求單狀態發生關鍵轉換（如進入評估中、報價完成、進入議價等）
- **THEN** 系統透過 Slack Webhook 通知對應角色

#### Scenario: US-QR-005 待評估成本通知

- **WHEN** 業務執行「送印務評估」
- **THEN** 系統 MUST 自動透過 Slack Webhook 發送通知給指定印務主管
- **AND** Slack 訊息 permalink SHALL 自動回寫至需求單的 `slack_thread_url` 欄位
- **AND** 通知發送失敗時業務 SHALL 可手動補填 `slack_thread_url`

#### Scenario: US-QR-016 已評估成本通知業務主管

- **WHEN** 印務主管執行「評估完成」，需求單狀態變為「已評估成本」
- **THEN** 系統 MUST 自動透過 Slack Webhook 發送通知給指定業務主管（`approved_by_sales_manager_id`）
- **AND** 通知內容 SHALL 包含需求單編號、客戶、報價總額、印件項數摘要
- **AND** Slack 訊息 permalink SHALL 附加至需求單的 `slack_thread_url` 欄位（可與印務主管通知共用同一 thread）
- **AND** 通知發送失敗 SHALL 不阻擋狀態轉換，業務主管仍可從待辦清單看到此需求單

