## ADDED Requirements

### Requirement: 稿件備註欄位

印件（PrintItem）SHALL 具備 `client_note` 欄位，作為會員（B2C）/ 業務（B2B）提供印件時寫給審稿人員的稿件說明。

**欄位定義**：
- `client_note`：text（最長 500 字，非必填）
- **層級**：印件（PrintItem）1:1，**跟著印件走、不跟 ReviewRound 輪次**
- **方向**：會員 / 業務 → 審稿
- **生命週期**：於印件首次建立時由會員 / 業務填寫；**補件階段不再填寫新備註**（Miles 現場確認此情境無痛點）

**來源點**（透過 capability 邊界擴充）：
- B2B：需求單印件建立時（`quote-request` capability 擴充，見 [quote-request delta](../quote-request/spec.md)）
- B2C：EC 會員上傳印件時（`order-management` capability 擴充，見 [order-management delta](../order-management/spec.md)，EC → ERP 回寫）

#### Scenario: 稿件備註長度上限

- **WHEN** 會員或業務於印件建立階段輸入 `client_note` 超過 500 字
- **THEN** 系統 SHALL 拒絕送出並顯示字數超出提示

#### Scenario: 非必填允許留空

- **WHEN** 會員或業務於印件建立階段未填寫 `client_note`
- **THEN** 系統 SHALL 允許送出印件，`client_note` 存為 NULL

#### Scenario: 審稿工作台曝光稿件備註

- **WHEN** 審稿人員進入印件詳情頁檢視
- **THEN** 系統 SHALL 於詳情頁顯眼處呈現 `client_note` 內容（若存在）
- **AND** 若 `client_note` 為 NULL 或空字串，SHALL 顯示「無稿件備註」佔位文字

#### Scenario: 審稿工作台列表顯示稿件備註摘要

- **WHEN** 審稿人員進入工作台列表頁
- **THEN** 每筆待審印件列 SHALL 呈現 `client_note` 前 50 字摘要
- **AND** 滑鼠滑過 SHALL 顯示完整 `client_note` tooltip

#### Scenario: 免審稿印件的稿件備註仍可見

- **WHEN** 印件走免審稿快速路徑，`client_note` 於建立時已填寫
- **THEN** 訂單詳情 / 印件詳情頁 SHALL 顯示 `client_note`
- **AND** 因印件不進入審稿工作台，審稿人員視角不適用

---

### Requirement: 審稿備註修改稽核

`ReviewRound.review_note` submit 後 SHALL 允許原審稿人員回頭修改（供糾正打錯字 / 補充內容）。每次修改 MUST 寫入印件 ActivityLog「審稿備註修改」事件，並於補件方已進入補件頁的情境觸發即時通知。

**ActivityLog 事件欄位**：
- `event_type`：審稿備註修改
- `actor`：操作者（審稿人員 user_id）
- `round_no`：被修改的輪次
- `from`：原 `review_note` 全文
- `to`：新 `review_note` 全文
- `timestamp`：修改時間

**修改權限**：僅限該輪次的原審稿人員（`reviewer_id`）；主管 / 其他審稿人員 SHALL 不可直接修改他人輪次的 review_note（若需介入，走既有「主管覆寫分配」流程接手後，由新審稿人員建立新 Round）。

**通知補件方**：若修改發生在印件狀態為「不合格」或「已補件」且補件方已進入該印件的補件頁時，系統 SHALL 觸發 Toast 通知「第 N 輪審稿備註已更新」。跨系統真實通知管道（Email / Slack / APP push）待 [XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 處理；本 change Prototype 階段以 shadcn Toast demo 實作。

**合格終態的影響範圍**：印件為合格終態時，review_note 修改只影響「印件層最新一筆」顯示與下游印務可見的最新內容；**已建立工單的檔案鎖定不受影響**（詳見 business-processes § 稿件管理規則）。

#### Scenario: 原審稿人員修改 review_note 寫入 ActivityLog

- **GIVEN** 第 1 輪 ReviewRound 已 submit，review_note 為 A，reviewer_id 為審稿人員 X
- **WHEN** 審稿人員 X 將第 1 輪 review_note 修改為 A'
- **THEN** 系統 SHALL 更新 ReviewRound.review_note 為 A'
- **AND** 印件 ActivityLog SHALL 新增事件：event_type=審稿備註修改、actor=X、round_no=1、from=A、to=A'、timestamp

#### Scenario: 非原審稿人員嘗試修改被拒

- **GIVEN** 第 1 輪 ReviewRound 的 reviewer_id 為 X
- **WHEN** 其他審稿人員 Y 嘗試修改該輪 review_note
- **THEN** 系統 SHALL 拒絕修改並提示「僅該輪原審稿人員可修改；如需介入請透過主管覆寫分配流程」

#### Scenario: 補件方在線時的即時通知

- **GIVEN** 印件審稿維度狀態為「不合格」，會員或業務正停留在補件頁
- **WHEN** 審稿人員修改該印件最近一輪的 review_note
- **THEN** 系統 SHALL 於補件頁觸發 Toast 通知「第 N 輪審稿備註已更新」
- **AND** 補件頁「歷史輪次審稿備註清單」SHALL 刷新顯示最新版本

---

### Requirement: 稿件備註覆寫稽核

若需於印件首建後修改既存 `client_note`（例如業務 / 主管修正既有敘述），系統 MUST 將變更記錄至印件 ActivityLog。

**事件欄位**：
- `event_type`：稿件備註修改
- `actor`：操作者（user_id）
- `from`：原 `client_note` 全文
- `to`：新 `client_note` 全文
- `timestamp`：變更時間

**合規理由**：ISO 9001 要求「客戶指示變更可追溯」；審稿人員可能已依原 `client_note` 開始審稿，修改須留痕供糾紛時還原。

#### Scenario: 修改稿件備註寫入 ActivityLog

- **WHEN** 業務或主管於印件詳情 / 需求單印件編輯介面修改既存 `client_note`
- **THEN** 系統 SHALL 儲存新值至 `PrintItem.client_note`
- **AND** 系統 SHALL 新增印件 ActivityLog 事件：`event_type=稿件備註修改`、`actor`、`from`（舊值）、`to`（新值）、`timestamp`

#### Scenario: 首次建立不寫入 ActivityLog

- **WHEN** 會員或業務於印件首次建立時填寫 `client_note`
- **THEN** 系統 SHALL 儲存至 `PrintItem.client_note`
- **AND** 印件 ActivityLog SHALL 記錄「稿件上傳」事件（含 client_note 欄位值），**不**額外記錄「稿件備註修改」

---

### Requirement: 印件層最新一筆審稿備註顯示

印件詳情頁 SHALL 於印件摘要區顯示**最新一筆審稿備註**（由 `PrintItem.current_round_id → ReviewRound.review_note` 推導），供印務、訂單管理、業務等後續角色快速掌握審稿結論，無需展開完整歷史輪次。

**實作路徑**：Prototype 採 **UI 層計算**（讀 `current_round_id → ReviewRound.review_note`），不新增 `PrintItem.last_review_note` 衍生欄位（避免引入雙寫同步點，違反 add-prepress-review D4 原則）。正式系統若因性能需要，可於後端加快取欄位或物化視圖。

#### Scenario: 印件詳情頁顯示最新審稿備註

- **WHEN** 任一角色（印務 / 業務 / 審稿主管 / 訂單管理）檢視印件詳情頁
- **THEN** 系統 SHALL 於摘要區顯示印件最新合格輪次的 `review_note`
- **AND** 若 `current_round_id` 為 NULL（尚未合格），SHALL 顯示「尚無合格輪次」佔位

#### Scenario: 印件尚未合格時顯示最新一筆（含不合格輪次）

- **WHEN** 印件仍處於不合格 / 已補件 / 等待審稿狀態（尚無 current_round_id）
- **AND** 該印件已存在至少一筆 ReviewRound（含不合格輪）
- **THEN** 系統 SHALL 顯示最新一筆 ReviewRound 的 `review_note`（按 round_no 最大）
- **AND** 標示該輪次結果（合格 / 不合格），避免誤解為合格結論

#### Scenario: 免審稿印件無審稿備註

- **WHEN** 印件走免審稿路徑（source=免審稿 / reviewer_id=NULL）
- **AND** 該 Round 的 `review_note` 為 NULL
- **THEN** 印件詳情頁「最新一筆審稿備註」區塊 SHALL 顯示「免審稿路徑，無審稿備註」佔位

---

## MODIFIED Requirements

### Requirement: ReviewRound 資料模型

印件（PrintItem）與印件檔案（PrintItemFile）之間 SHALL 引入 `ReviewRound` 實體。每次審稿人員送出審核、或印件走免審稿路徑時，系統 MUST 產生一筆 ReviewRound 紀錄，聚合當輪的檔案（印件檔 / 審稿後檔案 / 縮圖）、審稿結果與備註。

**ReviewRound 欄位**：
- `id`
- `print_item_id`：FK PrintItem
- `round_no`：該印件內遞增序號，從 1 開始
- `reviewer_id`：FK User（審稿人員）；免審稿路徑為 NULL
- `source`：enum（審稿 / 免審稿）
- `submitted_at`：送審時間（免審稿路徑為印件建立時間）
- `result`：enum（合格 / 不合格）
- `reject_reason_category`：enum LOV（不合格時必填）。**PI-009 定案 10 項**：出血不足 / 解析度過低 / 色彩模式錯誤（RGB 未轉 CMYK）/ 缺少必要元素（圖 / 文字 / 字型）/ 版面超出安全區 / 尺寸不符 / 特殊工藝圖層異常（燙金 / 白墨 / 模切）/ 字型未外框 / 技術性退件（檔案損毀 / 無法開啟等；KPI 不合格率分母排除） / 其他（需 review_note 補充）。**對齊 quote-request spec § 需求單流失歸因的 LOV 設計模式**，以結構化方式記錄便於統計分析與圖編器 Preflight 規則對映
- `review_note`：text（最長 **1000 字**，非必填）。**本 change 語意擴充**：原敘述為「不合格時建議填寫」，現擴充為**合格 / 不合格每輪皆可填**（審稿與補件方多次來回，每輪皆有機會給補件方 / 後續角色留備註）。每輪的 `review_note` **各自保留**（跟輪次走，不覆寫）；印件層透過 `current_round_id → review_note` 顯示最新一筆作為摘要（見新增 Requirement「印件層最新一筆審稿備註顯示」）。**可修改 + 稽核**：該輪 Round submit 後 `review_note` **允許審稿人員回頭修改**（供糾正打錯字 / 補充內容）；每次修改 MUST 寫入印件 ActivityLog「審稿備註修改」事件（actor / round_no / from / to / timestamp）；修改若發生於補件方已進入補件頁之後，系統 SHALL 觸發 Toast 通知補件方（跨系統真實通知管道待 [XM-006](https://www.notion.so/3473886511fa817f98e1f4e8a2f84473) 處理）

**PrintItem 層新增**：
- `current_round_id`：FK ReviewRound。指向當前合格輪次，作為印件摘要（縮圖、審稿後檔案）的單一指針。**Unique constraint**：每 PrintItem 至多一個 current_round_id；尚未合格時為 NULL。

**PrintItemFile 擴充（2026-04-21 data-consistency-audit 調整為三值）**：
- `round_id`：FK ReviewRound
- `file_role`：enum（**印件檔 / 審稿後檔案 / 縮圖**）。語意分工：
  - **印件檔**：客戶（B2C 會員）/ 業務（B2B）/ 補件流程提供的原始印件檔。審稿人員**不可**替換此檔案。
  - **審稿後檔案**：審稿人員於完成審核合格時上傳的加工後版本（對應原印件規格的審稿版本），作為下游工單製作的基準檔。與印件檔並存而非取代，保留審稿過程稽核軌跡。
  - **縮圖**：視覺摘要（兼參考圖）。審稿人員合格時必須上傳。
  - 每輪合格 Round SHALL 至少含 1 份 `file_role=審稿後檔案` 與 1 份 `file_role=縮圖`（由審稿人員上傳）；`file_role=印件檔` 由補件方上傳，`round_id=null` 暫存待綁定。
- `review_status`：保留但 SHALL 標為衍生值（= 所屬 Round.result 的投影）
- `is_final`：於 add-prepress-review change **移除**。改由 `PrintItem.current_round_id → Round → File` 取代。

#### Scenario: 首輪送審建立 ReviewRound

- **WHEN** 審稿人員首次對某印件送出審核
- **THEN** 系統 SHALL 建立 `round_no = 1, source = 審稿` 的 ReviewRound
- **AND** 將當輪上傳的**審稿後檔案**、縮圖綁定此 round_id
- **AND** 同輪已存在 `round_id=null` 的印件檔（由客戶 / 業務上傳）SHALL 保留（稽核軌跡）

#### Scenario: 補件後重審遞增 round_no

- **GIVEN** 印件已存在 `round_no = 1` 結果為「不合格」的 ReviewRound
- **AND** 客戶 / 業務已完成補件（上傳 `file_role=印件檔` 新檔案，round_id=null）
- **WHEN** 原審稿人員再次送出審核
- **THEN** 系統 SHALL 建立 `round_no = 2` 的 ReviewRound
- **AND** 上傳的**審稿後檔案**、縮圖綁定此新 round_id

#### Scenario: 合格輪次設為 PrintItem current_round_id

- **WHEN** 某 ReviewRound 的 `result` 被標為「合格」
- **THEN** 系統 SHALL 將該 Round 的 id 寫入所屬 PrintItem 的 `current_round_id`
- **AND** DB 層 unique constraint SHALL 保證同印件至多一個合格指針（避免並發 race）

#### Scenario: 印件摘要呈現合格輪檔案

- **WHEN** 任一角色檢視印件摘要（訂單詳情、工單建立頁等）
- **THEN** 系統 SHALL 透過 `PrintItem.current_round_id → ReviewRound → PrintItemFile` 呈現檔案：
  - 審稿後檔案 `file_role=審稿後檔案`（下游製作基準）
  - 縮圖 `file_role=縮圖`（視覺摘要）
  - 印件檔 `file_role=印件檔`（原始客戶提供，稽核用）
- **AND** current_round_id 為 NULL（尚未合格）時，SHALL 顯示「待審稿」狀態而非舊輪檔案
- **AND** 歷史輪次檔案 SHALL 於印件詳情頁的歷史區可查閱（三欄分開顯示印件檔 / 審稿後檔案 / 縮圖）

#### Scenario: 免審稿印件建立 source=免審稿 Round

- **WHEN** 印件走免審稿快速路徑（依 order-management L126-128）
- **THEN** 系統 SHALL 建立 `round_no = 1, source = 免審稿, reviewer_id = NULL, result = 合格` 的 ReviewRound
- **AND** 將 PrintItem.current_round_id 指向該 Round
- **AND** 印件 SHALL 不出現在任何審稿人員的待審列表

#### Scenario: 技術性退件以 reject_reason_category 區分並排除不合格率 KPI

- **GIVEN** 審稿人員開啟原稿發現檔案損毀 / 字型缺失等技術問題
- **WHEN** 審稿人員送審不合格，reject_reason_category 選取「技術性退件」，review_note 補充「原稿檔案損毀，請業務重傳」
- **THEN** 系統 SHALL 建立結果為「不合格」的 ReviewRound
- **AND** 此 Round SHALL 於 KPI 儀表板的「不合格率」計算時排除（依 reject_reason_category 判定）
- **AND** 此 Round SHALL 計入「技術退件比率」單獨指標

#### Scenario: 合格時填寫 review_note 留言給後續角色

- **WHEN** 審稿人員送審合格時填寫 `review_note`（例：「特殊色已依客戶指示調整為專色」）
- **THEN** 系統 SHALL 將 `review_note` 儲存至該輪 ReviewRound
- **AND** 印件詳情頁「印件層最新一筆審稿備註」SHALL 顯示此合格輪的 review_note
- **AND** 不觸發不合格流程，印件進入合格終態

#### Scenario: 歷次 review_note 各自保留不覆寫

- **GIVEN** 印件歷經第 1 輪不合格（review_note A）、第 2 輪不合格（review_note B）、第 3 輪合格（review_note C）
- **WHEN** 任一角色檢視印件詳情頁歷史輪次區
- **THEN** 系統 SHALL 於各輪分別顯示其 review_note（A / B / C 獨立保存）
- **AND** 印件層最新一筆 SHALL 顯示 C（current_round_id → round_no=3）

#### Scenario: review_note submit 後允許修改並記錄稽核

- **GIVEN** 第 1 輪 ReviewRound 已 submit，review_note 為 A
- **WHEN** 審稿人員回頭將第 1 輪的 review_note 修改為 A'
- **THEN** 系統 SHALL 更新 ReviewRound.review_note 為 A'
- **AND** 系統 SHALL 於印件 ActivityLog 新增一筆「審稿備註修改」事件（actor=該審稿人員、round_no=1、from=A、to=A'、timestamp）
- **AND** 若該印件當下有補件方（會員 / 業務）正在補件頁停留，系統 SHALL 觸發 Toast 通知「第 N 輪審稿備註已更新」（跨系統真實通知管道待 XM-006 處理）

#### Scenario: 合格終態的 review_note 修改不影響已建工單的檔案鎖定

- **GIVEN** 印件第 3 輪合格，current_round_id 指向該輪，工單已依此輪建立並鎖定檔案
- **WHEN** 審稿人員將第 3 輪的 review_note 修改
- **THEN** 系統 SHALL 允許修改並寫入 ActivityLog
- **AND** 印件層「最新一筆審稿備註」SHALL 顯示修改後版本（下游印務看到最新）
- **AND** 已建立工單的**檔案**鎖定不受影響（只鎖檔案不鎖備註，詳見 business-processes § 稿件管理規則）

---

### Requirement: 審稿人員審稿作業

審稿人員在其工作台中 SHALL 可執行下列動作：
- 檢視待審印件列表（我被分配的印件）
- 進入印件詳情頁檢視原稿（由補件方提供的 `file_role=印件檔`）、**稿件備註** `PrintItem.client_note`、印件需求規格、歷史輪次
- 下載原稿進行加工（系統外處理）
- 上傳**審稿後檔案**與**縮圖**（單次送審合格時至少各一份）
- 標記送審結果為「合格」或「不合格」
- **合格 / 不合格皆可填寫 `review_note`**（不合格時仍須從 LOV 選 `reject_reason_category`，review_note 為補充說明；合格時 `review_note` 為留言給後續角色的備註）
- **送出後 `review_note` 允許修改**（供糾正打錯字 / 補充內容），每次修改觸發印件 ActivityLog「審稿備註修改」事件

**關鍵約束（2026-04-21 data-consistency-audit 明確化）**：審稿人員**不可替換** `file_role=印件檔` 的原始檔（該 role 由補件方 B2C 會員 / B2B 業務透過補件流程寫入）。審稿人員合格時上傳的是 `file_role=審稿後檔案`，作為加工版本，與原印件檔並存。

送審動作 SHALL 觸發 ReviewRound 建立與印件狀態轉移。

#### Scenario: 送審合格

- **WHEN** 審稿人員上傳**審稿後檔案**與**縮圖**，選擇「合格」、**可選擇性填寫 `review_note`**，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 合格，review_note 依使用者輸入儲存）
- **AND** 上傳的檔案綁定此 round_id（`file_role=審稿後檔案` + `file_role=縮圖`）
- **AND** 系統 SHALL 將 PrintItem.current_round_id 指向此 Round
- **AND** 印件審稿維度狀態 SHALL 轉為「合格」（合格為終態，若後續需變更內容，SHALL 透過「棄用原印件 + 建立新印件」處理，參考 business-scenarios spec）
- **AND** 觸發下游自動建工單流程（B2C 自動帶生產任務 / B2B 建空工單草稿，詳見 business-processes spec § 審稿階段流程）
- **AND** 該 Round 的 review_note 於 submit 後 SHALL 允許審稿人員回頭修改；每次修改觸發 ActivityLog「審稿備註修改」事件

#### Scenario: 送審不合格

- **WHEN** 審稿人員選擇「不合格」、自 reject_reason_category LOV 選單選取原因、選填 review_note 補充備註，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 不合格，reject_reason_category = 選取值，review_note = 補充文字）
- **AND** 此輪不要求上傳審稿後檔案或縮圖（不合格時檔案非必要）
- **AND** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方（B2C：客戶；B2B：業務；通知管道見 XM-006），通知內容包含 reject_reason_category 分類與 review_note 補充
- **AND** 該 Round 的 review_note 於 submit 後 SHALL 允許審稿人員回頭修改；每次修改觸發 ActivityLog「審稿備註修改」事件

#### Scenario: 不合格未選 reject_reason_category 被拒

- **WHEN** 審稿人員選擇「不合格」但未自 LOV 選單選取 reject_reason_category
- **THEN** 系統 SHALL 拒絕送審並提示「退件原因分類」為必選

#### Scenario: 詳情頁顯示稿件備註

- **WHEN** 審稿人員進入印件詳情頁
- **THEN** 系統 SHALL 於詳情頁顯眼處呈現 `PrintItem.client_note`
- **AND** 若 client_note 為空 SHALL 顯示「無稿件備註」佔位

---

### Requirement: B2C 會員補件

當印件進入「不合格」狀態且來源為 B2C 訂單時，會員 SHALL 可於電商前台的訂單詳情頁重新上傳印件檔案。電商系統 SHALL 呼叫 ERP 介面回寫新檔案並觸發狀態轉移。

補件頁 SHALL 顯示**歷史輪次 `review_note` 清單**（含最新一輪審稿人員退件原因與備註），讓會員參照修正。**會員於補件階段不再填寫新的 `client_note`**（Miles 現場確認無此痛點）。

#### Scenario: 會員補件成功

- **GIVEN** B2C 印件審稿維度狀態為「不合格」
- **WHEN** 會員於電商前台重新上傳檔案
- **THEN** 電商系統 SHALL 呼叫 ERP 補件介面
- **AND** ERP SHALL 新增一筆補件檔案（file_role = 印件檔，round_id 暫為 NULL，於審稿人員下次送審時與新 Round 一起綁定）
- **AND** 印件狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

#### Scenario: 會員補件頁顯示歷史審稿備註清單

- **WHEN** 會員於電商前台進入不合格印件的補件頁
- **THEN** 系統 SHALL 顯示**歷史輪次 `review_note` 清單**（最新在上），含每輪 round_no、result、reject_reason_category、review_note 與時間
- **AND** 會員可參照最新一輪審稿意見修正稿件後再上傳

#### Scenario: 會員補件頁不再顯示 client_note 編輯欄位

- **WHEN** 會員於電商前台進入不合格印件的補件頁
- **THEN** 系統 SHALL **不**提供 `client_note` 編輯入口（已於印件首建時填寫，補件階段不再更新）

---

### Requirement: B2B 業務補件

當印件進入「不合格」狀態且來源為 B2B 訂單時，業務 SHALL 可於該訂單的詳情頁找到該筆不合格印件並執行補件操作。業務 SHALL 僅能檢視到訂單層級，不可檢視工單與生產任務。

補件頁 SHALL 顯示**歷史輪次 `review_note` 清單**（含最新一輪審稿人員退件原因與備註），讓業務參照修正或轉達客戶。**業務於補件階段不再填寫新的 `client_note`**（Miles 現場確認無此痛點；若業務需修正既存 client_note 敘述，走「稿件備註覆寫稽核」Requirement 的 ActivityLog 路徑）。

#### Scenario: 業務於訂單詳情頁補件

- **GIVEN** B2B 印件審稿維度狀態為「不合格」
- **WHEN** 業務於訂單詳情頁點選該印件的「補件」入口並上傳檔案
- **THEN** 系統 SHALL 新增一筆補件檔案（file_role = 印件檔，round_id 暫為 NULL，於審稿人員下次送審時與新 Round 一起綁定）
- **AND** 印件狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

#### Scenario: B2B 補件頁顯示歷史審稿備註清單

- **WHEN** 業務於訂單詳情頁進入不合格印件的補件操作介面
- **THEN** 系統 SHALL 顯示**歷史輪次 `review_note` 清單**（最新在上），含每輪 round_no、result、reject_reason_category、review_note 與時間
- **AND** 業務可參照清單修正或轉達客戶後再上傳補件

#### Scenario: B2B 補件頁不再顯示 client_note 編輯欄位

- **WHEN** 業務於訂單詳情頁進入不合格印件的補件操作介面
- **THEN** 系統 SHALL **不**於補件操作介面提供 `client_note` 編輯入口
- **AND** 若業務需修正既存 `client_note` 敘述，SHALL 至印件編輯介面執行（觸發 ActivityLog 稽核，見 Requirement「稿件備註覆寫稽核」）

---

### Requirement: 審稿人員工作台

審稿人員 SHALL 擁有專屬工作台，至少涵蓋下列頁面（UI 細節見 PI-006）：

1. **列表頁**：呈現「我被分配的待審印件」，區分「首審」與「補件重審」兩類；每筆印件列 SHALL 呈現 `client_note` 前 50 字摘要
2. **詳情頁**：呈現**稿件備註**（`PrintItem.client_note`）、印件需求規格、原稿檢視、歷史輪次（含每輪 `review_note`）、上傳元件、送審操作

列表頁 SHALL 支援基本排序（預設規則見 PI-006）。詳情頁 SHALL 呈現完整歷史 ReviewRound 清單，每一輪含當時的檔案、結果、備註與時間。

#### Scenario: 審稿人員列表分類

- **WHEN** 審稿人員進入工作台列表頁
- **THEN** 系統 SHALL 將待審印件分為兩個分類：「首審」與「補件重審」
- **AND** 兩類分別計數呈現於頁首

#### Scenario: 列表頁顯示稿件備註摘要

- **WHEN** 審稿人員進入工作台列表頁
- **THEN** 每筆待審印件列 SHALL 呈現 `client_note` 前 50 字摘要（若存在）
- **AND** 滑鼠滑過摘要 SHALL 顯示完整 `client_note` tooltip

#### Scenario: 詳情頁呈現歷史輪次與稿件備註

- **WHEN** 審稿人員進入印件詳情頁
- **THEN** 系統 SHALL 於詳情頁顯眼處呈現 `PrintItem.client_note`
- **AND** 系統 SHALL 呈現該印件所有 ReviewRound 的歷史（最新在上）
- **AND** 每一輪可展開檢視當時的檔案、結果、`review_note` 與時間
