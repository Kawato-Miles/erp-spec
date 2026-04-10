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
系統 SHALL 支援業務/諮詢角色建立需求單，包含客戶資訊（從廠客管理選取）、印件項目、交期等基本資料。需求單建立後為「草稿」狀態。

#### Scenario: 業務建立新需求單
- **WHEN** 業務角色從需求單列表點擊建立
- **THEN** 系統建立草稿狀態需求單，業務可填寫客戶、印件規格、數量、交期等欄位

#### Scenario: 業務編輯既有需求單
- **WHEN** 業務角色開啟草稿或需求確認中狀態的需求單
- **THEN** 系統允許編輯印件規格、數量、備註等欄位

#### Scenario: US-QR-001 建立需求單並送印務評估
- **WHEN** 客戶詢問報價，業務在系統內建立需求單
- **THEN** 業務 SHALL 填寫印件項目與規格備註，指定評估印務主管，並執行「送印務評估」；需求單 MUST 建立成功，指定印務主管 MUST 收到評估通知

#### Scenario: US-QR-009 複製既有需求單
- **WHEN** 業務在需求單列表找到過往需求單並執行「複製」
- **THEN** 系統 SHALL 建立新需求單，MUST 帶入原需求單的客戶資訊、印件項目規格等關鍵欄位

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
需求單 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 需求單定義的規則進行狀態轉換。完整流程為：需求確認中 → 待評估成本 → 已評估成本 → 議價中 → 成交/流失。

#### Scenario: 完整成交流程
- **WHEN** 需求單經過需求確認、成本評估、議價流程
- **THEN** 狀態依序轉換至「成交」，各轉換由對應角色觸發

#### Scenario: 需求單流失
- **WHEN** 業務判斷客戶不成交
- **THEN** 業務可將需求單標記為「流失」，MUST 選擇流失原因（LOV 選單）

#### Scenario: US-QR-002 管理需求單進度
- **WHEN** 需求單成本評估完成，業務在「已評估成本」狀態確認報價後進入議價
- **THEN** 業務 SHALL 視客戶回應執行「成交」或「流失」標記終態；每次狀態變更 MUST 自動記錄至活動紀錄；管理層 SHALL 可在列表頁依狀態篩選追蹤進度

#### Scenario: US-QR-006 申請重新評估報價
- **WHEN** 需求單處於議價中狀態，業務點擊「重新評估報價」
- **THEN** 需求單 SHALL 回到「待評估成本」狀態，由印務主管重新評估；歷史報價紀錄 MUST 保留，新評估後系統 MUST 自動建立新的報價記錄

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
- **WHEN** 需求單狀態發生關鍵轉換（如進入評估中、報價完成等）
- **THEN** 系統透過 Slack Webhook 通知對應角色

#### Scenario: US-QR-005 待評估成本通知
- **WHEN** 業務執行「送印務評估」
- **THEN** 系統 MUST 自動透過 Slack Webhook 發送通知給指定印務主管；Slack 訊息 permalink SHALL 自動回寫至需求單的 slack_thread_url 欄位；通知發送失敗時業務 SHALL 可手動補填 slack_thread_url

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
