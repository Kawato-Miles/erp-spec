## Purpose

需求單模組 -- 客戶需求接收、成本評估、報價提供、議價、成交/流失的全流程管理。
取代現有 Ragic + Slack 組合，讓業務/諮詢與印務主管透過 ERP 完成需求單全生命週期。

**問題**：
- Ragic + Slack 分散管理需求與報價，狀態不代表真實流程位置
- 業務看狀態無法判斷「現在要做什麼」
- 成本評估無稽核軌跡，管理層無法判斷案件進度或流失原因

**目標**：
- 主要：讓業務/諮詢與印務主管透過 ERP 完成需求確認→成本評估→報價→議價→成交/流失全流程，取代 Ragic + Slack
- 次要：累積詢價與成交資料，為報價策略與營收預測提供分析基礎

- 來源 BRD：[需求單 BRD](https://www.notion.so/3293886511fa80998ac0e8cdf555da68)（v1.9）
- Prototype：`sens-erp-prototype/src/components/quote/`
- 相依模組：廠客管理（CRM）、使用者角色（RBAC）、訂單管理

---
## Requirements
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

### Requirement: 印件項目管理
系統 SHALL 支援需求單內建立多筆印件項目（Print Items），每筆包含印件規格（類型、尺寸、數量、紙張、加工等）。印件類型支援 27 種分類。每筆印件項目可填寫「預計產線」（多選）。

#### Scenario: 業務新增印件項目
- **WHEN** 業務在需求單中新增印件
- **THEN** 系統以可編輯列表格式呈現（Ant Design Editable Cells），支援固定列與橫向滑動

#### Scenario: 業務設定印件規格
- **WHEN** 業務編輯印件規格欄位
- **THEN** 系統提供印件類型 LOV（27 種）及常用規格欄位供填寫

#### Scenario: US-QR-003 管理需求單印件項目
- **WHEN** 業務在需求單下新增印件項目
- **THEN** 業務 SHALL 填寫項目名稱、規格備註、數量，並填入成本總額與報價總額；系統 MUST 自動計算毛利率；需求單 MUST 支援至少 10 個印件項目，每個印件有獨立的規格、數量與報價欄位；毛利率低於 0 時 UI MUST 顯示警告；金額彙總 SHALL 隨新增/修改/刪除即時更新

#### Scenario: 業務新增印件項目時填寫預計產線

- **WHEN** 業務在需求單下新增或編輯印件項目
- **THEN** 系統 SHALL 提供預計產線多選欄位，顯示所有產線供選擇
- **AND** 選取結果 SHALL 儲存至 QuoteRequestItemExpectedLine junction

#### Scenario: 需求單轉訂單時帶入預計產線

- **WHEN** 需求單成交並建立訂單
- **THEN** 系統 SHALL 將各印件項目的預計產線帶入對應 PrintItem 的 expected_production_lines

### Requirement: 印件參考附件
系統 SHALL 支援在每個印件項目上傳參考附件，供印務主管評估時參照。

#### Scenario: US-QR-004 管理需求單參考資料
- **WHEN** 業務在印件項目上傳參考附件（圖片/PDF）
- **THEN** 每個印件項目 MUST 支援多附件上傳；系統 SHALL 支援附件預覽與下載

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

### Requirement: 評估印務主管指定
系統 SHALL 支援業務在建立需求單時指定評估印務主管，進入「待評估成本」後該欄位鎖定不可更改。

#### Scenario: US-QR-012 設定評估印務主管
- **WHEN** 業務在建立需求單時，從印務主管清單選擇指定評估人員
- **THEN** 可選人員 MUST 限定為具印務主管角色的用戶；進入「待評估成本」後欄位 SHALL 鎖定不可更改；指定的印務主管 MUST 在待辦清單看到此需求單

### Requirement: 成本評估
系統 SHALL 支援印件的成本評估流程。業務直接填入成本總額與報價總額，系統自動計算毛利率 = (報價總額 - 成本總額) / 報價總額。

#### Scenario: 業務填入成本與報價
- **WHEN** 業務在印件層填入成本總額與報價總額
- **THEN** 系統自動計算並顯示毛利率

#### Scenario: US-QR-013 印務主管評估需求單報價
- **WHEN** 印務主管登入後從待辦清單進入需求單，查看印件規格
- **THEN** 印務主管 SHALL 逐一填入各印件項目的成本總額；所有印件項目成本填寫完畢後才允許執行「評估完成」；評估完成後系統 MUST 自動建立報價紀錄並通知業務

### Requirement: 議價備註
系統 SHALL 支援議價階段的備註記錄（negotiation_note），供業務記錄與客戶議價過程的溝通重點。

#### Scenario: 業務記錄議價內容
- **WHEN** 需求單進入議價中狀態
- **THEN** 業務可填寫議價備註，紀錄與客戶的議價歷程

### Requirement: 檢視權限管理
系統 SHALL 支援需求單的檢視權限管理，允許需求單負責人設定被授權人的檢視或編輯權限。

#### Scenario: 業務授予同事檢視權限
- **WHEN** 業務在需求單中設定被授權人
- **THEN** 被授權人可依授予的權限等級（檢視/編輯）存取該需求單

#### Scenario: 未授權人員無法存取
- **WHEN** 未被授權的使用者嘗試存取非自己負責的需求單
- **THEN** 系統拒絕存取

#### Scenario: US-QR-010 分享需求單給同事參考
- **WHEN** 擁有者在權限管理 Tab 搜尋同事名稱並新增權限
- **THEN** 被授權人 SHALL 可檢視需求單內容；被授權人 MUST 無編輯權限（僅檢視）

#### Scenario: US-QR-011 設定需求單職務代理人
- **WHEN** 業務在需求單詳情頁進入「權限管理」Tab，搜尋指定同事並授予「編輯授權」
- **THEN** 被授權同事 SHALL 可成功編輯需求單並推進狀態；授權移除 MUST 即時生效

### Requirement: 成交轉訂單
系統 SHALL 支援成交後一鍵轉建訂單，自動帶入需求單的客戶資料、印件規格、交期等基本資料至訂單。

#### Scenario: 業務將成交需求單轉為訂單
- **WHEN** 業務在成交狀態的需求單點擊「轉訂單」
- **THEN** 系統建立新訂單，自動帶入客戶資料、印件項目、交期

#### Scenario: US-QR-007 需求單成交轉訂單
- **WHEN** 需求單「成交」後業務點擊「轉建訂單」
- **THEN** 系統 SHALL 自動帶入客戶、業務、印件基本資料；訂單 MUST 與需求單建立關聯，訂單 MUST 包含需求單的所有必要資訊

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

### Requirement: 需求單流失歸因
系統 SHALL 支援需求單流失時結構化記錄流失原因，供管理層分析流失趨勢。

#### Scenario: US-QR-008 需求單流失歸因
- **WHEN** 業務執行「流失」操作
- **THEN** 業務 MUST 選擇流失原因（價格過高、客戶取消、無法製作等 LOV 選項）；流失後需求單狀態 SHALL 鎖定，不可再變更；流失原因 MUST 以結構化方式記錄，管理層 SHALL 可分析流失原因與比例

### Requirement: 活動紀錄
系統 SHALL 記錄需求單的所有操作歷程（建立、編輯、狀態轉換、權限變更等），供稽核與追溯。

#### Scenario: 查閱需求單活動紀錄
- **WHEN** 使用者在需求單詳情頁查看活動紀錄
- **THEN** 系統顯示完整的操作歷程，包含操作人、操作時間、操作內容

### Requirement: 發票開立方式
系統 SHALL 支援需求單層記錄發票開立方式，支援 4 種類型的 LOV 選項。

#### Scenario: 業務設定發票開立方式
- **WHEN** 業務在需求單中選擇發票開立方式
- **THEN** 系統記錄選定的發票類型，帶入後續訂單

---

### Requirement: 印件難易度欄位

需求單中每一筆印件 SHALL 具備 `difficulty_level` 欄位，值域為 1 至 10 之整數，由業務於需求單建立或編輯時填寫。此欄位為**必填**，未填寫時需求單不可送出至下一階段。

`difficulty_level` 作為後續訂單建立時的自動分配依據，並於轉訂單時繼承至訂單印件。

#### Scenario: 業務填寫印件難易度

- **WHEN** 業務於需求單編輯頁建立或修改印件
- **THEN** 系統 SHALL 顯示 `difficulty_level` 輸入欄位（範圍 1-10）
- **AND** 欄位旁 SHALL 標示為必填

#### Scenario: 未填難易度無法送出需求單

- **GIVEN** 需求單中存在至少一筆印件 `difficulty_level` 為空
- **WHEN** 業務嘗試送出需求單至評估 / 報價階段
- **THEN** 系統 SHALL 拒絕並明確指出哪筆印件未填

#### Scenario: 難易度範圍驗證

- **WHEN** 業務於印件難易度欄位輸入 0、11 或非整數
- **THEN** 系統 SHALL 拒絕輸入並顯示範圍提示

### Requirement: 需求單印件稿件備註

需求單印件（QuoteRequestItem 對應後續 PrintItem）SHALL 支援業務於建立 / 編輯階段填寫 `client_note` 欄位，作為給審稿人員的稿件說明。

**欄位定義對齊** [prepress-review spec § 稿件備註欄位](../prepress-review/spec.md)：
- `client_note`：text（最長 500 字，非必填）
- 層級：印件 1:1，跟著印件走
- 方向：業務 → 審稿
- 需求單成交轉訂單時 SHALL 將 `client_note` 帶入對應 PrintItem
- **帶入後脫鉤**：訂單 PrintItem.client_note 與需求單 QuoteRequestItem.client_note 各自獨立編輯，不回寫同步（對齊 business-processes spec L72 expected_production_lines 帶入後可繼續編輯的設計模式）

#### Scenario: 業務於需求單印件填寫稿件備註

- **WHEN** 業務在需求單下新增或編輯印件項目
- **THEN** 系統 SHALL 提供 `client_note` textarea 欄位（非必填，最長 500 字）
- **AND** 超過 500 字系統 SHALL 拒絕儲存並顯示字數超出提示
- **AND** 留空允許儲存，欄位存為 NULL

#### Scenario: 需求單成交轉訂單時帶入稿件備註

- **WHEN** 需求單成交並建立訂單
- **THEN** 系統 SHALL 將各印件項目的 `client_note` 帶入對應 PrintItem
- **AND** 審稿人員於工作台接收此印件時 SHALL 可見 `client_note` 內容

#### Scenario: 成交後需求單與訂單 client_note 脫鉤

- **GIVEN** 需求單已成交並建立訂單；各印件 `client_note` 已帶入 PrintItem
- **WHEN** 業務事後於需求單修改原 client_note
- **THEN** 系統 SHALL 僅更新 QuoteRequestItem.client_note，訂單 PrintItem.client_note **不**受影響（各自獨立）
- **AND** 若業務需修正訂單 PrintItem 的 client_note，SHALL 於訂單 / 印件編輯介面執行（觸發 prepress-review spec § 稿件備註覆寫稽核 的 ActivityLog 記錄）

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

### Requirement: 需求單詳情頁 Tabs 化版型

需求單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → （條件性 inline banners）→ ErpDetailTabs（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 需求單案名（標題）
- 需求單號 Badge（success 色系）
- 主動作群（依角色 / 狀態條件顯示）：
  - 業務：複製 / 編輯 / 流失 / 送印務評估 / 成交 / 重新報價 / 建立訂單
  - 業務主管：核可進入議價 / 一鍵確認（條件未變）
  - PM 或業務：評估完成
  - Supervisor：重新指定業務主管 / 重新指定印務主管

`ErpPageHeader` 與 `ErpDetailTabs` 之間 SHALL 保留條件性 inline banner 區（緊貼 Header 之下、Tabs 之上）：
- 業務側：需求確認中狀態下未指定業務主管或印務主管時的提示 banner
- 業務側：已評估成本 + 等待業務主管核可中的等待 banner
- 業務主管側：上次核可條件對照 banner
- 動作錯誤訊息 banner

需求單詳情頁 SHALL 包含 5 個 Tab（含條件隱藏 Tab），順序：`資訊（首位，defaultValue）→ 印件報價（{count}）→ 報價紀錄（{count}，業務 / 業務主管 才顯示）→ 權限管理（{count}）→ 活動紀錄`。

「資訊」Tab 為 [refactor-detail-pages-to-subheader-tab-layout](../../changes/archive/) 新增 Tab，SHALL 承載原 Tabs 之上的「基本資訊卡」：StatusStepper（狀態步驟條）+ 主資訊欄位（業務 / 業務主管 / 印務主管 / 客戶 / 等等）+ 收款備註 + 備註 + 流失原因 / 流失說明（status='流失' 時顯示）+ 報價金額橫排（報價輪次 / 小計 / 稅額 / 含稅總額）。

#### Scenario: 業務進入需求單詳情頁預設停留資訊 Tab

- **WHEN** 業務或業務主管進入需求單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 顯示基本資訊卡（含 StatusStepper + 主資訊欄位 + 報價金額橫排）

#### Scenario: 需求單詳情頁 Tab 順序符合業務流先後

- **WHEN** 業務瀏覽需求單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件報價 → 報價紀錄 → 權限管理 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）
- **AND** 「報價紀錄」Tab SHALL 在使用者非業務或業務主管時隱藏（沿用既有 `hidden: !(isSales || isSalesManager)` 邏輯）

#### Scenario: 需求單詳情頁資訊區重組

- **WHEN** 業務進入需求單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「基本資訊」卡
- **AND** 基本資訊卡 SHALL 在「資訊」Tab 內呈現

#### Scenario: 條件性 inline banner 位置

- **WHEN** 需求單 `status === '需求確認中'` 且使用者為業務、且未指定業務主管或印務主管
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示提示 banner
- **AND** banner SHALL NOT 出現在「資訊」Tab 內或其他 Tab 中

- **WHEN** 需求單 `status === '已評估成本'` 且 `approvalRequired === true` 且使用者為業務
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示等待核可 banner（含等待天數）

- **WHEN** 需求單 `status === '已評估成本'` 且使用者為指定業務主管 且 `lastApprovedPaymentTermsNote` 不為 null
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示「上次核可條件對照」banner

---

## Data Model

來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### QuoteRequest

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 系統自動生成 |
| 需求單編號 | quote_no | 字串 | Y | Y | 格式：Q-YYYYMMDD-XX |
| 案名 | title | 字串 | Y | | 案名 |
| 狀態 | status | 單選 | Y | | 需求確認中/待評估成本/已評估成本/議價中/成交/流失 |
| 客戶 | customer_id | FK | Y | | FK->客戶 |
| 負責業務 | sales_id | FK | Y | | FK->使用者 |
| 印件類型 | print_type | 多選 | | | 27 種印件類型 |
| 詢問來源 | inquiry_source | 單選 | Y | | Line/Facebook/Instagram/客戶介紹/業務拜訪/官網諮詢信/社群媒體/數位廣告 |
| 接單公司 | account_company | 單選 | Y | | SSP感官/BRO柏樂/KAD川人/EC奕果 |
| 發票開立方式 | invoice_type | 單選 | | | 電子發票/隨貨附發票/月結開立/紙本發票另計 |
| 客戶期望交期 | expected_delivery_date | 日期 | | | 客戶期望交期 |
| 報價截止日 | quote_deadline | 日期 | | | 報價截止日 |
| 評估印務主管 | estimated_by_manager_id | FK | Y | | FK->使用者（印務主管） |
| 關聯訂單 | linked_order_id | FK | | | FK->訂單，成交後系統寫入 |
| 流失原因 | lost_reason | 單選 | | | 流失時必填 |
| 流失補充說明 | lost_note | 文字 | | | 流失補充說明 |
| 備註 | notes | 文字 | | | |
| Slack 討論串連結 | slack_thread_url | 字串 | | | Webhook 成功後自動回填 |
| 未稅金額 | amount_excl_tax | 整數 | | Y | 系統自動計算 |
| 稅額 | tax_amount | 整數 | | Y | 系統自動計算 |
| 含稅總額 | total_incl_tax | 整數 | | Y | 系統自動計算 |
| 建立者 | created_by | FK | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |
| 建立時間 | created_at | 日期時間 | Y | Y | |

### QuoteRequestItem

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 需求單 | quote_request_id | FK | Y | Y | FK->需求單 |
| 項目編號 | item_no | 字串 | Y | Y | 格式：{quote_no}-{seq} |
| 排序 | seq | 整數 | Y | | 排序用 |
| 印件名稱 | name | 字串 | Y | | 印件名稱 |
| 規格備註 | spec_note | 文字 | Y | | 規格備註 |
| 數量 | quantity | 小數 | Y | | 數量 |
| 單位 | unit | 單選 | | | 張/本/冊/份/個/卷/盒/套/批 |
| 成本總額 | cost_estimate | 整數 | | | 成本總額 |
| 報價總額（未稅） | price_per_unit | 整數 | | | 報價總額（未稅） |
| 毛利率 | profit_margin | 小數 | | Y | 系統自動計算毛利率 |
| 預計產線 | expected_production_lines | M:N | | | 多選；FK -> ProductionLine（透過 QuoteRequestItemExpectedLine） |
| 出貨日期 | delivery_date | 日期 | | | 出貨日期 |
| 出貨方式 | delivery_method | 字串 | | | 出貨方式 |
| 包裝說明 | packaging_note | 文字 | | | 包裝說明 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### QuoteRequestItemExpectedLine（需求單印件預計產線 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 印件項目 | item_id | FK | Y | Y | FK -> QuoteRequestItem |
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine |

### QuoteRequestItemAttachment

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 印件項目 | item_id | FK | Y | Y | FK->印件項目 |
| 檔案名稱 | filename | 字串 | Y | | |
| 檔案類型 | file_type | 單選 | Y | | image/pdf |
| 檔案路徑 | file_url | 字串 | Y | | |
| 檔案大小（KB） | file_size_kb | 整數 | Y | Y | |
| 上傳者 | uploaded_by | FK | Y | Y | |
| 上傳時間 | uploaded_at | 日期時間 | Y | Y | |

### QuoteRequestPriceLog

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 需求單 | quote_request_id | FK | Y | Y | |
| 印件成本/報價快照 | items_snapshot | JSON | Y | Y | 各印件成本/報價快照 |
| 評估者 | evaluated_by | FK | Y | Y | 評估者（印務主管） |
| 評估時間 | evaluated_at | 日期時間 | Y | Y | |
| 評估備註 | notes | 文字 | | | 評估備註 |

### QuoteRequestActivityLog

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 需求單 | quote_request_id | FK | Y | Y | |
| 操作者 | actor_id | FK | Y | Y | 系統事件填 system |
| 事件描述 | description | 文字 | Y | Y | 事件描述 |
| 建立時間 | created_at | 日期時間 | Y | Y | |

### QuoteRequestViewPermission

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | |
| 需求單 | quote_request_id | FK | Y | Y | |
| 被授權人 | granted_to_user_id | FK | Y | Y | 被授權人 |
| 授予者 | granted_by_user_id | FK | Y | Y | 授予者 |
| 授權時間 | granted_at | 日期時間 | Y | Y | |
| 撤銷時間 | revoked_at | 日期時間 | | Y | NULL=權限生效 |
| 權限等級 | permission | 單選 | Y | | 檢視者/編輯者 |
| 所屬部門 | departments | 文字 | | Y | 被授權人所屬部門 |

---

## Phase 2 預留功能

以下功能不在 Phase 1 範疇，但已確認未來規劃方向：
- 需求單可指定印務主管，並於需求單填寫印件成本評估
- 使用 EC 商品作為印件 Template
- 詢價資料分析 Dashboard
