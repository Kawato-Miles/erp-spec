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
系統 SHALL 支援業務手動建立需求單，記錄客戶基本資料、印件項目、報價條件，並可於議價中以前的階段編輯。需求單建立時 MUST 同時指定接單公司（account_company）與帳務公司（billing_company_id）。

#### Scenario: 業務建立新需求單
- **WHEN** 業務點擊「建立需求單」
- **THEN** 系統 SHALL 開啟需求單編輯介面，業務可填入客戶資料、印件項目、規格、報價條件、接單公司與帳務公司
- **AND** 系統 MUST 驗證帳務公司必填（依 § 帳務公司指定）

#### Scenario: 業務編輯既有需求單
- **WHEN** 業務在需求單詳情頁點擊「編輯」
- **THEN** 系統 SHALL 允許修改需求單內容（限「已評估成本」之前的狀態），含接單公司與帳務公司

#### Scenario: US-QR-001 建立需求單並送印務評估
- **WHEN** 業務建立需求單，填入客戶、印件規格、接單公司、帳務公司、評估印務主管後送出評估
- **THEN** 系統 SHALL 將需求單狀態推進為「待評估成本」並通知指定評估印務主管
- **AND** 系統 MUST 在 Slack 發送通知，包含案名、客戶、業務、評估印務主管、接單公司、帳務公司、Slack 討論串連結

#### Scenario: US-QR-009 複製既有需求單
- **WHEN** 業務複製既有需求單
- **THEN** 系統 SHALL 建立新需求單，自動帶入原需求單的客戶、印件規格、接單公司與帳務公司
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

需求單 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 需求單狀態機 的規則進行狀態轉換。完整流程為：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交 / 流失。其中：

- 「需求確認中 → 待評估成本」 SHALL 由業務於指定印務主管後執行「送印務評估」觸發
- 「待評估成本 → 已評估成本」 SHALL 由印務主管完成成本評估後執行「評估完成」觸發
- 「已評估成本 → 議價中」 SHALL 由業務直接執行（無業務主管 gate）
- 「議價中 → 成交 / 流失」 SHALL 由業務依議價結果執行
- 「議價中 → 待評估成本」（重新評估）SHALL 由業務發起 US-QR-006 路徑

業務主管不介入需求單流程任何狀態轉換。業務主管的審核 gate 位於訂單階段（訂單建立後 → 報價待回簽前），詳見 [order-management spec](../order-management/spec.md) § 業務主管核准訂單。

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

- **WHEN** 業務判斷客戶不成交
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

### Requirement: 帳務公司指定

需求單 SHALL 於建立時要求業務指定帳務公司（billing_company_id），對應公司開立發票的法人主體（藍新 MerchantID_ 的設定來源）。帳務公司與既有「接單公司（account_company）」為**獨立欄位**：接單公司代表業務 / 品牌歸屬（如 SSP 感官 / BRO 柏樂 / KAD 川人 / EC 奕果），帳務公司代表發票主體。需求單成交轉訂單時，billing_company_id MUST 隨需求單帶入訂單。

#### Scenario: 業務建立需求單時必填帳務公司

- **WHEN** 業務建立新需求單
- **THEN** 系統 SHALL 顯示帳務公司下拉選單（從 BillingCompany 中 is_active = true 的清單）
- **AND** 系統 MUST 預設帶入 is_default = true 的帳務公司
- **AND** 業務未指定帳務公司時，系統 SHALL 拒絕送出需求單並提示

#### Scenario: 帳務公司於議價階段前可變更

- **WHEN** 需求單狀態為「需求確認中」「待評估成本」「已評估成本」
- **THEN** 業務 SHALL 可於需求單編輯頁變更帳務公司
- **AND** 變更時系統 MUST 在活動紀錄留痕

#### Scenario: 議價中或成交後不可變更帳務公司

- **GIVEN** 需求單狀態為「議價中」「成交」「流失」
- **WHEN** 業務嘗試變更帳務公司
- **THEN** 系統 SHALL 拒絕變更並提示「議價階段後不可變更帳務公司，需先回退至已評估成本」
- **AND** 系統 SHALL 提供 Supervisor 解鎖機制（與既有評估印務主管 / 審核業務主管 lifecycle 一致）

#### Scenario: 成交轉訂單時 billing_company_id 帶入

- **WHEN** 業務於成交需求單點擊「建立訂單」
- **THEN** 系統 SHALL 將 quote_request.billing_company_id 寫入新建立 Order.billing_company_id
- **AND** 訂單建立後 billing_company_id 不可在訂單側變更（與需求單一致）

### Requirement: 接單公司與帳務公司對應提示

系統 SHALL 在業務選擇接單公司（account_company）時，於 UI 顯示「該接單公司常用的帳務公司」提示（軟性引導，不強制）。實際對應關係由業務維護，由系統觀察記錄但不寫死映射。

#### Scenario: 業務選接單公司後系統提示常用帳務公司

- **WHEN** 業務於需求單編輯頁選擇 account_company（如 SSP 感官）
- **THEN** 系統 SHALL 在 billing_company 欄位下方提示「該接單公司近 30 天最常用：[BillingCompany 名稱]」
- **AND** 系統 SHALL NOT 自動覆寫業務當下選的帳務公司

### Requirement: 從諮詢單轉建需求單

系統 SHALL 支援由 ConsultationRequest（[consultation-request spec](../consultation-request/spec.md)）轉建需求單。轉建時系統 MUST 自動帶入 ConsultationRequest 的客戶資料欄位至新需求單，並於需求單記錄 `linked_consultation_request_id` 反向關聯。

ConsultationRequest 蒐集的印件相關欄位（`consultation_topic`、`estimated_quantity_band`）SHALL 帶入需求單作為印件規格的初始參考（`consultation_topic` 寫入 `requirement_note`，業務於需求單細化時可調整）。

#### Scenario: 諮詢結束建立需求單

- **GIVEN** ConsultationRequest 狀態為「待諮詢」、已指派 consultant_id、諮詢人員選擇「轉需求單（做大貨）」、Payment 綁 ConsultationRequest
- **WHEN** 系統觸發轉需求單動作
- **THEN** 系統 SHALL 建立新 QuoteRequest（status = 需求確認中）
- **AND** 客戶資料（customer_type / company_tax_id / company_name / contact_name / mobile / email / company_phone / extension）MUST 自 ConsultationRequest 直接帶入
- **AND** `linked_consultation_request_id` MUST 寫入 ConsultationRequest ID
- **AND** `requirement_note` MUST 寫入 ConsultationRequest 的 `consultation_topic`
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
- **AND** ConsultationRequest CR-XXX 狀態 SHALL 從「已轉需求單」更新為「完成諮詢」

#### Scenario: 早期狀態流失（待評估成本前）觸發建諮詢訂單

- **GIVEN** 需求單 `linked_consultation_request_id` 非空，狀態為「需求確認中」或「待評估成本」
- **WHEN** 業務點擊「流失」
- **THEN** 系統行為 SHALL 與「議價中流失」情境相同（建諮詢訂單 + Payment 轉移 + ConsultationRequest 結局更新）

#### Scenario: 一般需求單（非諮詢來源）流失不影響諮詢流程

- **GIVEN** 需求單 `linked_consultation_request_id` 為 null（非諮詢來源）
- **WHEN** 業務點擊「流失」
- **THEN** 需求單依既有流失流程處理
- **AND** 系統 MUST NOT 建立任何諮詢訂單

---

### Requirement: 諮詢來源需求備註欄位

QuoteRequest 資料模型 SHALL 新增 `requirement_note` 欄位（text，選填），記錄需求單的需求描述。當需求單由 ConsultationRequest 轉入時（`linked_consultation_request_id` 非空），系統 MUST 將 ConsultationRequest 的 `consultation_topic` 帶入此欄位。

業務 SHALL 於需求單任何狀態皆可編輯此欄位，作為需求紀錄文字。

#### Scenario: 諮詢轉需求單時帶入 consultation_topic

- **GIVEN** ConsultationRequest 的 `consultation_topic` = "希望製作 500 份雙面銅版紙傳單，A4 大小"
- **WHEN** 系統觸發諮詢轉需求單動作
- **THEN** 新建需求單的 `requirement_note` MUST = "希望製作 500 份雙面銅版紙傳單，A4 大小"
- **AND** 業務開啟需求單詳情頁 SHALL 看到此備註內容

#### Scenario: 一般需求單 requirement_note 預設為空

- **GIVEN** 業務手動建立需求單（非諮詢來源）
- **WHEN** 系統建立 QuoteRequest
- **THEN** `requirement_note` SHALL 預設為空字串
- **AND** 業務於詳情頁 SHALL 可手動填寫此欄位

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
| 帳務公司 | billing_company_id | FK | Y | | FK -> BillingCompany；對應發票主體（藍新 MerchantID_）；建立時必填，成交轉訂單時帶入訂單 |
| 來源諮詢單 | linked_consultation_request_id | FK | | | FK -> ConsultationRequest；非空表示由諮詢單轉入，詳情頁顯示「來自諮詢單」連結；流失時觸發建諮詢訂單收尾 |
| 需求備註 | requirement_note | 文字 | | | 諮詢轉需求單時自 ConsultationRequest.consultation_topic 帶入；業務於需求單細化時可編輯 |
| 發票開立方式 | invoice_type | 單選 | | | 電子發票/隨貨附發票/月結開立/紙本發票另計 |
| 客戶期望交期 | expected_delivery_date | 日期 | | | 客戶期望交期 |
| 報價截止日 | quote_deadline | 日期 | | | 報價截止日 |
| 評估印務主管 | estimated_by_manager_id | FK | Y | | FK->使用者（印務主管），進入「待評估成本」後鎖定 |
| 收款條件備註 | payment_terms_note | 文字 | | | 業務跟客戶討論的收款條件紀錄；最長 500 字；終態（成交 / 流失）後鎖定；成交轉訂單時帶入訂單同名欄位供業務主管審核 |
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
