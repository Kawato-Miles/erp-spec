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
系統 SHALL 支援業務手動建立需求單，記錄客戶基本資料、印件項目、報價條件，並可於議價中以前的階段編輯。需求單建立時 MUST 由業務選擇帳務公司（billing_company_id；接單公司即帳務公司，同一概念），決定報價單與後續帳款歸屬（見 § 帳務公司選擇與鎖定）。

#### Scenario: 業務建立新需求單
- **WHEN** 業務點擊「建立需求單」
- **THEN** 系統 SHALL 開啟需求單編輯介面，業務可填入客戶資料、印件項目、規格、報價條件、帳務公司
- **AND** 業務 MUST 選擇帳務公司（感官或柏樂）方可送出（依 § 帳務公司選擇與鎖定）

#### Scenario: 業務編輯既有需求單
- **WHEN** 業務在需求單詳情頁點擊「編輯」
- **THEN** 系統 SHALL 允許修改需求單內容（限「已評估成本」之前的狀態），含帳務公司
- **AND** 業務若變更帳務公司，活動紀錄 MUST 留痕

#### Scenario: US-QR-001 建立需求單並送印務評估
- **WHEN** 業務建立需求單，填入客戶、印件規格、帳務公司、評估印務主管後送出評估
- **THEN** 系統 SHALL 將需求單狀態推進為「待評估成本」並通知指定評估印務主管
- **AND** 系統 MUST 在 Slack 發送通知，包含案名、客戶、業務、評估印務主管、帳務公司、Slack 討論串連結

#### Scenario: US-QR-009 複製既有需求單
- **WHEN** 業務複製既有需求單
- **THEN** 系統 SHALL 建立新需求單，自動帶入原需求單的客戶、印件規格、帳務公司（直接帶入原值）
- **AND** 業務於「需求確認中」狀態可重選帳務公司
- **AND** 新需求單 MUST 為「需求確認中」狀態，業務可進一步編輯

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

需求單（Quote Request）SHALL 依以下狀態流轉：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交；任一非終態狀態皆可標記流失。其中：

- 「需求確認中 → 待評估成本」 SHALL 由業務於指定印務主管後執行「送印務評估」觸發
- 「待評估成本 → 已評估成本」 SHALL 由印務主管完成成本評估後執行「評估完成」觸發
- 「已評估成本 → 議價中」 SHALL 由業務直接執行（無業務主管 gate）
- 「議價中 → 成交」 SHALL 由業務依議價結果執行
- 「任一非終態狀態（需求確認中 / 待評估成本 / 已評估成本 / 議價中）→ 流失」 SHALL 由業務執行，MUST 選擇流失原因（客戶於任何階段取消或不回覆時皆可收尾，避免未成交需求單永久懸置）
- 「議價中 → 待評估成本」（重新評估）SHALL 由業務發起 US-QR-006 路徑；「已評估成本」階段如需修正成本數字，由印務主管直接修改成本欄位，MUST NOT 退回狀態

業務主管不介入需求單流程任何狀態轉換。業務主管的審核 gate 位於訂單階段（訂單建立後 → 報價待回簽前），詳見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單。

通知機制：需求單進入「待評估成本」時，系統 SHALL 透過 Slack Webhook 通知指定印務主管。

#### Scenario: 需求單從需求確認進入待評估成本

- **WHEN** 業務完成需求確認，提交需求單
- **THEN** 需求單狀態 SHALL 變為「待評估成本」
- **AND** 印務主管 SHALL 收到 Slack Webhook 評估通知

#### Scenario: 待評估成本進入已評估成本

- **WHEN** 印務主管執行「評估完成」
- **THEN** 需求單狀態 SHALL 變為「已評估成本」
- **AND** 系統 MUST 寫入 ActivityLog 記錄印務主管評估動作

#### Scenario: 完整成交流程

- **WHEN** 需求單經過需求確認、成本評估、議價、成交
- **THEN** 狀態依序轉換至「成交」，各轉換由業務或印務主管觸發

#### Scenario: 業務直接從已評估成本進入議價

- **GIVEN** 需求單狀態為「已評估成本」
- **WHEN** 業務於需求單詳情頁點擊「進入議價」
- **THEN** 系統 SHALL 直接推進至「議價中」狀態
- **AND** 系統 MUST NOT 要求業務主管核可
- **AND** 系統 MUST 寫入 ActivityLog（操作者 = 業務、事件描述 = 「進入議價」）

#### Scenario: 需求單流失

- **GIVEN** 需求單處於任一非終態狀態（需求確認中 / 待評估成本 / 已評估成本 / 議價中）
- **WHEN** 業務判斷客戶不成交（拒絕報價、中途取消、不再回覆）
- **THEN** 業務可將需求單標記為「流失」，MUST 選擇流失原因（LOV 選單）

#### Scenario: US-QR-002 業務管理需求單進度

- **WHEN** 需求單成本評估完成進入「已評估成本」狀態
- **THEN** 業務 SHALL 於 `payment_terms_note` 欄位填寫與客戶確認的收款說明（選填）
- **AND** 業務 SHALL 看到「進入議價」按鈕可直接推進
- **AND** 需求單進入「議價中」後，業務 SHALL 視客戶回應執行「成交」或「流失」標記終態
- **AND** 每次狀態變更 MUST 自動記錄至 ActivityLog
- **AND** 管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價

- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估
- **AND** 歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄
- **AND** 重新進入「已評估成本」後業務 SHALL 可直接再進入「議價中」（無需經業務主管核可）

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

### Requirement: 評估印務主管欄位 lifecycle

`estimated_by_manager_id`（FK -> 使用者，必填）SHALL 遵循以下 lifecycle 規則：建立時填寫，進入「待評估成本」後鎖定，僅 Supervisor 可解鎖重新指定。

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

QuoteRequest 資料模型 SHALL 保有 `payment_terms_note` 欄位（text，最長 500 字，選填），供業務記錄與客戶討論的收款條件，作為後續報價單內容基礎。

業務 SHALL 於需求單任何狀態（草稿、需求確認中、待評估成本、已評估成本、議價中）皆可編輯此欄位；進入「成交」或「流失」終態後 SHALL 鎖定為唯讀。

成交轉訂單時，系統 MUST 將 `payment_terms_note` 內容帶入新訂單的同名欄位（見 [order-management spec](../order-management/spec.md) § 訂單業務主管審核欄位）。業務主管於訂單詳情頁審核時查看此欄位內容，作為審核決策依據之一。需求單階段不再有「業務主管查看收款備註」流程。

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

#### Scenario: 成交轉訂單時 payment_terms_note 帶入訂單

- **GIVEN** 需求單狀態為「成交」、`payment_terms_note` 內容為 "月結 60 天、訂金 30%"
- **WHEN** 業務於需求單點擊「建立訂單」
- **THEN** 系統 SHALL 建立新訂單
- **AND** 新訂單的 `payment_terms_note` 欄位 MUST = "月結 60 天、訂金 30%"
- **AND** 新訂單後續由業務主管審核時，業務主管 SHALL 於訂單詳情頁查看此欄位

---

### Requirement: 需求單詳情頁 Tabs 化版型

需求單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → （條件性 inline banners）→ ErpDetailTabs（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 需求單案名（標題）
- 需求單號 Badge（success 色系）
- 主動作群（依角色 / 狀態條件顯示）：
  - 業務：複製 / 編輯 / 流失 / 送印務評估 / 進入議價 / 成交 / 重新報價 / 建立訂單
  - PM 或業務：評估完成
  - Supervisor：重新指定印務主管

業務主管於需求單詳情頁 MUST NOT 顯示任何業務主管專屬動作（核可進入議價、核准成交、上次核可條件對照等動作均移除）。業務主管於需求單為只讀檢視。

`ErpPageHeader` 與 `ErpDetailTabs` 之間 SHALL 保留條件性 inline banner 區（緊貼 Header 之下、Tabs 之上）：
- 業務側：需求確認中狀態下未指定印務主管時的提示 banner
- 動作錯誤訊息 banner（Supervisor 重新指定印務主管錯誤等）

需求單詳情頁 SHALL 包含 5 個 Tab（含條件隱藏 Tab），順序：`資訊（首位，defaultValue）→ 印件報價（{count}）→ 報價紀錄（{count}，業務 / 業務主管 才顯示）→ 權限管理（{count}）→ 活動紀錄`。

「資訊」Tab 承載原 Tabs 之上的「基本資訊卡」：StatusStepper（5 步狀態步驟條）+ 主資訊欄位（業務 / 印務主管 / 客戶 / 等等）+ 收款備註 + 備註 + 流失原因 / 流失說明（status='流失' 時顯示）+ 報價金額橫排（報價輪次 / 小計 / 稅額 / 含稅總額）。

#### Scenario: 業務進入需求單詳情頁預設停留資訊 Tab

- **WHEN** 業務或業務主管進入需求單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 顯示基本資訊卡（含 StatusStepper 5 步 + 主資訊欄位 + 報價金額橫排）

#### Scenario: 需求單詳情頁 Tab 順序符合業務流先後

- **WHEN** 業務瀏覽需求單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件報價 → 報價紀錄 → 權限管理 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）
- **AND** 「報價紀錄」Tab SHALL 在使用者非業務或業務主管時隱藏（沿用既有 `hidden: !(isSales || isSalesManager)` 邏輯）

#### Scenario: 條件性 inline banner 位置

- **WHEN** 需求單 `status === '需求確認中'` 且使用者為業務、且未指定印務主管
- **THEN** `ErpPageHeader` 下方、`ErpDetailTabs` 上方 SHALL 顯示「尚未指定評估印務主管」提示 banner
- **AND** banner SHALL NOT 出現在「資訊」Tab 內或其他 Tab 中

#### Scenario: 業務主管於需求單詳情頁無動作按鈕

- **WHEN** 業務主管開啟任一需求單詳情頁
- **THEN** `ErpPageHeader` 動作群 MUST NOT 顯示「核可進入議價」、「核准成交」、「一鍵確認（條件未變）」任一按鈕
- **AND** 內容區 MUST NOT 顯示「上次核可條件對照」banner
- **AND** 業務主管的審核動作改於訂單詳情頁執行（見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單）

### Requirement: 帳務公司選擇與鎖定

系統 SHALL 由業務於需求單建立時選擇帳務公司（billing_company_id：bc-ssp 感官股份有限公司 / bc-bro 柏樂創意有限公司），決定這張單的報價單與後續帳款歸屬（接單公司即帳務公司，同一概念，統一使用「帳務公司」一詞，不存在推導機制）。「已評估成本」之前的狀態業務可變更帳務公司，變更 MUST 留活動紀錄。

#### Scenario: 業務建單時選擇帳務公司

- **WHEN** 業務於需求單編輯頁選擇帳務公司為感官股份有限公司
- **THEN** 系統 SHALL 將 `billing_company_id` 寫入 `bc-ssp`
- **AND** UI MUST 顯示「帳務公司：感官股份有限公司」

#### Scenario: 業務變更帳務公司留痕

- **GIVEN** 需求單帳務公司 = 感官股份有限公司、狀態在「已評估成本」之前
- **WHEN** 業務於編輯頁將帳務公司改為柏樂創意有限公司
- **THEN** 系統 MUST 將 `billing_company_id` 寫入 `bc-bro`
- **AND** 活動紀錄 MUST 留痕「帳務公司由 感官股份有限公司 改為 柏樂創意有限公司」

#### Scenario: 成交轉訂單時 billing_company_id 帶入

- **WHEN** 業務於成交需求單點擊「建立訂單」
- **THEN** 系統 SHALL 將 quote_request.billing_company_id 寫入新建立 Order.billing_company_id
- **AND** 訂單建立後 billing_company_id 不可在訂單側變更（手動或自動）

### Requirement: 從諮詢單轉建需求單

系統 SHALL 支援由 ConsultationRequest（[consultation-request spec](../consultation-request/spec.md)）轉建需求單。轉建時系統 MUST 自動帶入 ConsultationRequest 的客戶資料欄位至新需求單，並於需求單記錄 `linked_consultation_request_id` 反向關聯。

ConsultationRequest 蒐集的印件相關欄位（`consultation_topic`、`estimated_quantity_band`、`consultant_note`）SHALL 帶入需求單作為印件規格的初始參考。其中 `consultation_topic`（客戶 surveycake 原話）+ `consultant_note`（諮詢人員與客戶溝通記錄）SHALL 以**雙區塊格式**合併寫入 `requirement_note`，雙區塊定義詳見 [consultation-request spec § 諮詢單轉需求單欄位帶入](../consultation-request/spec.md)。業務於需求單細化時可調整 `requirement_note` 內容。

#### Scenario: 諮詢結束建立需求單

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已認領 `consultant_id`、諮詢人員選擇「轉需求單（做大貨）」、Payment 綁 ConsultationRequest
- **WHEN** 系統觸發轉需求單動作
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料（customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension）MUST 自 ConsultationRequest 直接帶入
- **AND** `linked_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** `requirement_note` MUST 寫入 `consultation_topic` + `consultant_note` 的雙區塊格式（雙區塊定義詳見 [consultation-request spec](../consultation-request/spec.md)；`consultant_note` 為空時 SHALL 省略諮詢人員筆記區塊）
- **AND** ConsultationRequest 的 `linked_quote_request_id` MUST 寫入新建需求單 ID
- **AND** Payment 維持綁 ConsultationRequest（系統 MUST NOT 在此時建立任何 Order，等需求單結局明確才轉移）

#### Scenario: 由諮詢轉的需求單於詳情頁顯示來源連結

- **GIVEN** 需求單 `linked_consultation_request_id` 非空
- **WHEN** 使用者開啟需求單詳情頁
- **THEN** UI SHALL 顯示「來自諮詢單 [諮詢單編號]」可點擊連結
- **AND** UI SHALL 顯示諮詢費已預收金額「諮詢費 X 元（轉訂單時併入主訂單應收）」資訊

---

### Requirement: 諮詢來源需求單流失觸發建諮詢訂單

當需求單 `linked_consultation_request_id` 非空、需求單流失（議價中或更早任何狀態觸發）時，系統 SHALL 自動觸發建諮詢訂單收尾流程，將原 ConsultationRequest 的 Payment 轉移至新建諮詢訂單。

實作細節見 [consultation-request spec](../consultation-request/spec.md) § 需求單流失觸發建諮詢訂單收尾、[order-management spec](../order-management/spec.md) § 訂單建立 § 需求單流失觸發建諮詢訂單。

設計理由：諮詢結束選做大貨後若需求單流失，客人付的諮詢費依然存在 ConsultationRequest 上需要收尾；複用「不做大貨」的諮詢訂單路徑可避免新增訂單類型或新流程，讓系統一致地將「最終沒進大貨」的所有情境都收斂到諮詢訂單。

#### Scenario: 議價中流失觸發建諮詢訂單與 Payment 轉移

- **GIVEN** 需求單 `linked_consultation_request_id = CR-XXX` 非空，狀態為「議價中」、Payment 綁 CR-XXX
- **WHEN** 業務點擊「流失」、選擇流失原因
- **THEN** 需求單狀態 SHALL 推進至「流失」終態
- **AND** 系統 SHALL 建立諮詢訂單（order_type = 諮詢）+ OrderExtraCharge(consultation_fee, 諮詢費)
- **AND** Payment 從 CR-XXX 轉移至諮詢訂單
- **AND** 諮詢訂單 SHALL 推進至完成路徑
- **AND** ConsultationRequest CR-XXX 狀態 SHALL 維持「已轉需求單」不變（流失收尾不回寫諮詢單狀態）

#### Scenario: 早期狀態流失（待評估成本前）觸發建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，狀態為「需求確認中」或「待評估成本」
- **WHEN** 業務點擊「流失」
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 狀態維持不變）

#### Scenario: 一般需求單（非諮詢來源）流失不影響諮詢流程

- **GIVEN** 需求單 `linked_consultation_request_id` 為 null（非諮詢來源）
- **WHEN** 業務點擊「流失」
- **THEN** 需求單依既有流失流程處理
- **AND** 系統 MUST NOT 建立任何諮詢訂單

---

### Requirement: 諮詢來源需求備註欄位

QuoteRequest 資料模型 SHALL 新增 `requirement_note` 欄位（text，選填），記錄需求單的需求描述。當需求單由 ConsultationRequest 轉入時（`linked_consultation_request_id` 非空），系統 MUST 將 ConsultationRequest 的 `consultation_topic` + `consultant_note` 以**雙區塊格式**帶入此欄位（雙區塊定義詳見 [consultation-request spec § 諮詢單轉需求單欄位帶入](../consultation-request/spec.md)）。

業務 SHALL 於需求單任何狀態皆可編輯此欄位，作為需求紀錄文字；下游 spec / Prototype MUST NOT 依賴雙區塊格式做 parsing（純文字傳輸，業務可自由編輯）。

#### Scenario: 諮詢轉需求單時帶入雙區塊 requirement_note

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份雙面銅版紙傳單，A4 大小"、`consultant_note` = "客戶確認用 250g 紙、要燙金 LOGO"
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST 以雙區塊格式帶入：
  ```
  [客戶原話]
  希望製作 500 份雙面銅版紙傳單，A4 大小

  [諮詢人員筆記]
  客戶確認用 250g 紙、要燙金 LOGO
  ```
- **AND** 業務開啟需求單詳情頁 SHALL 看到此備註內容

#### Scenario: consultant_note 為空時雙區塊省略諮詢人員筆記

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份 A4 海報"、`consultant_note` = NULL
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST 僅含客戶原話區塊：
  ```
  [客戶原話]
  希望製作 500 份 A4 海報
  ```
- **AND** 系統 MUST NOT 帶入空的「[諮詢人員筆記]」區塊

#### Scenario: 一般需求單 requirement_note 預設為空

- **GIVEN** 業務手動建立需求單（非諮詢來源）
- **WHEN** 系統建立 QuoteRequest
- **THEN** `requirement_note` SHALL 預設為空字串
- **AND** 業務於詳情頁 SHALL 可手動填寫此欄位

#### Scenario: 業務於需求單 requirement_note 自由編輯雙區塊內容

- **GIVEN** 需求單已自諮詢單帶入 `requirement_note` 雙區塊預設值
- **WHEN** 業務於需求單詳情頁編輯 `requirement_note`，修改格式或新增內容
- **THEN** 系統 SHALL 允許自由編輯
- **AND** 編輯不影響上游 ConsultationRequest 的 `consultation_topic` / `consultant_note`（兩者解耦，僅在 mapping 時刻合併）

### Requirement: 需求單印件單位來自共用 LOV

需求單編輯頁的印件項目「單位」欄位 SHALL 為 dropdown 元件，選項來自 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md)。業務 SHALL NOT 自由輸入文字。

#### Scenario: 需求單印件 dropdown 顯示完整 11 項

- **GIVEN** 業務於需求單編輯頁新增 / 編輯印件項目
- **WHEN** 業務點擊「單位」欄位
- **THEN** dropdown SHALL 顯示 11 個選項，順序為「張、本、冊、份、個、卷、盒、套、批、式、組」
- **AND** 業務選擇後 SHALL 寫入 QuoteRequestItem.unit

#### Scenario: 既有需求單資料 unit 值在新 LOV 內可正常顯示

- **GIVEN** 既有需求單印件已存有 `unit` 為 LOV 內值（如「張」/「本」）
- **WHEN** 業務開啟編輯頁
- **THEN** 系統 SHALL 在 dropdown 中正確選中該值
- **AND** 系統 MUST NOT 顯示「未知單位」錯誤

### Requirement: 需求單負責業務改派

業務主管 SHALL 可於需求單詳情頁改派負責業務（`sales_id`）。改派為改 owner 的管理動作，與「分享」（[§ Requirement: 檢視權限管理](../quote-request/spec.md)，不改 owner、業務可做）為兩種獨立機制。改派的通用規則（理由分類五值必填、五要素留痕、候選人以 Role 模組權限篩選、全公司範圍、改派不改狀態）沿用 wiki [業務主管](../../../../memory/Sens_wiki/wiki/erp/03-roles/業務主管.md) § 改派負責業務。

**允許改派狀態**：需求單非終態（需求確認中 / 待評估成本 / 已評估成本 / 議價中）SHALL 可改派；成交（已轉訂單，負責業務應改訂單而非需求單）/ 流失（無後續）為終態，禁改派。

#### Scenario: 業務主管改派進行中需求單負責業務

- **GIVEN** 需求單 `status ∈ {需求確認中, 待評估成本, 已評估成本, 議價中}`
- **WHEN** 業務主管點「改派負責人」、選新負責人（候選 = 具需求單權限的使用者）、必選理由分類、確認
- **THEN** 系統 SHALL 更新 `sales_id` 為新負責人
- **AND** SHALL 寫入活動紀錄五要素（原 / 新負責人、改派時間、理由分類與補述、操作主管）
- **AND** MUST NOT 改變需求單狀態

#### Scenario: 成交 / 流失需求單禁止改派

- **GIVEN** 需求單 `status ∈ {成交, 流失}`
- **WHEN** 業務主管開啟該需求單詳情頁
- **THEN** 「改派負責人」入口 SHALL disabled
- **AND** 成交需求單 SHALL 顯示提示（已成交，請於對應訂單改派負責業務）

#### Scenario: 改派與分享為獨立機制

- **WHEN** 業務主管於需求單詳情頁
- **THEN** 「改派負責人」（改 owner，限業務主管）與「分享 / 檢視權限管理」（不改 owner，業務可做）SHALL 為分開的入口
- **AND** 分享 SHALL NOT 改變需求單負責業務

## Data Model

- 需求單與印件項目欄位正本：[wiki 需求單實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/需求單.md) § 欄位（業務可見）
- Prototype 型別定義：`sens-erp-prototype/src/types/quote.ts`

以下為技術層支援實體欄位：

### QuoteRequestItemExpectedLine（需求單印件預計產線 junction）

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 印件項目 | item_id | FK | Y | Y | FK -> QuoteRequestItem |
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine |

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
