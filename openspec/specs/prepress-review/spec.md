# prepress-review Specification

## Purpose
TBD - created by archiving change add-prepress-review. Update Purpose after archive.
## Requirements
### Requirement: 審稿人員能力欄位

審稿人員（User 角色為「審稿」）SHALL 具備 `max_difficulty_level` 欄位，值域為 1 至 10 之整數。此欄位由審稿主管維護，代表該審稿人員可負責的最高印件難易度。

#### Scenario: 能力值必填

- **WHEN** 審稿主管新增一位審稿人員
- **THEN** 系統 SHALL 要求輸入 `max_difficulty_level`，未填寫不可儲存

#### Scenario: 能力值範圍驗證

- **WHEN** 審稿主管嘗試將 `max_difficulty_level` 設為 0、11 或負值
- **THEN** 系統 SHALL 拒絕並顯示範圍提示（1-10 整數）

#### Scenario: 能力值調整記錄

- **WHEN** 審稿主管修改某審稿人員的 `max_difficulty_level`
- **THEN** 系統 SHALL 記錄變更時間、操作者、舊值、新值
- **AND** 變更僅影響**未來**的自動分配，進行中的審稿不受影響

---

### Requirement: 印件自動分配機制

系統 SHALL 在以下時機自動將印件分配給審稿人員：
- B2C 訂單付款成功後
- B2B 訂單建立並付款成功後（沿用既有 order-management 付款後流程）

自動分配演算法 SHALL 依下列順序挑選被指派者：

1. 從所有 `max_difficulty_level ≥ 印件 difficulty_level` 的審稿人員構成候選集
2. 於候選集中選取 `max_difficulty_level` 最小者（能力最接近印件難易度）
3. 若步驟 2 有多人並列，選取「進行中審稿數」最少者。**「進行中審稿數」定義**：審稿維度狀態為「等待審稿」或「已補件」，且被分配給該審稿人員的印件數（不計合格 / 不合格與未分配者）
4. 若步驟 3 仍有多人並列，選取 `user_id` 字典序最小者

**降級路徑（PI-004 定案）**：若步驟 1 候選集為空（無任何審稿人員 `max_difficulty_level ≥ 印件 difficulty_level`），系統 SHALL 破例派給當前 `max_difficulty_level` 最高者；若最高者為多人並列，再用步驟 3 的負載最少 + 步驟 4 的 tie-break。破例派工 SHALL 記錄 ActivityLog「破例派工」事件，供審稿主管監看（成為人力補充或能力調整的業務訊號）。

分配完成後，系統 SHALL 將該印件加入被指派審稿人員的待審列表，並記錄分配事件至印件 ActivityLog。

#### Scenario: B2C 付款後自動分配

- **WHEN** B2C 訂單付款成功且印件未走免審稿路徑
- **THEN** 系統 SHALL 立即執行自動分配演算法
- **AND** 將印件指派給符合規則的審稿人員

#### Scenario: B2B 訂單付款後自動分配

- **WHEN** B2B 訂單建立並付款成功且印件未走免審稿路徑
- **THEN** 系統 SHALL 執行自動分配演算法

#### Scenario: 能力最接近原則

- **GIVEN** 印件 `difficulty_level = 5`
- **AND** 審稿人員 A `max_difficulty_level = 5`、B `max_difficulty_level = 7`、C `max_difficulty_level = 10`
- **WHEN** 系統執行自動分配
- **THEN** 系統 SHALL 指派給 A（能力值最接近 5）

#### Scenario: 負載最少為次要規則

- **GIVEN** 印件 `difficulty_level = 5`
- **AND** 審稿人員 A 與 B 皆 `max_difficulty_level = 5`
- **AND** A 進行中審稿數為 3，B 為 1
- **WHEN** 系統執行自動分配
- **THEN** 系統 SHALL 指派給 B（負載較少）

#### Scenario: 免審稿印件不進入分配

- **WHEN** 印件 `review_status` 為「合格」（因走免審稿快速路徑）
- **THEN** 系統 SHALL 跳過自動分配
- **AND** 印件不出現在任何審稿人員的待審列表

#### Scenario: 能力不足破例派工

- **GIVEN** 印件 `difficulty_level = 10`
- **AND** 系統中所有審稿人員的 `max_difficulty_level` 均 < 10（例如最高為 8）
- **WHEN** 系統執行自動分配
- **THEN** 系統 SHALL 破例派給 `max_difficulty_level = 8` 的審稿人員（若多人則用負載最少 / user_id 字典序挑選）
- **AND** 印件 ActivityLog SHALL 新增一筆「破例派工」事件，標註「被指派者能力 8 < 印件難易度 10」
- **AND** 審稿主管工作台 SHALL 於 KPI 儀表板呈現「破例派工頻率」指標

---

### Requirement: 審稿主管覆寫分配

審稿主管 SHALL 可將任一進行中的印件從原審稿人員轉指派給其他審稿人員，以處理例外情況（原審稿人員離職、請假、或分配錯誤）。

覆寫時，目標審稿人員的 `max_difficulty_level` MUST ≥ 印件 `difficulty_level`，否則系統 SHALL 拒絕並提示能力不足。覆寫後，印件 SHALL 從原審稿人員的待審列表移除，加入新指派者的待審列表，並記錄覆寫事件至 ActivityLog（含 from_user、to_user、reason）。

#### Scenario: 覆寫至合格能力的審稿人員

- **GIVEN** 印件 `difficulty_level = 5`，原指派給審稿人員 A
- **AND** 審稿人員 B 的 `max_difficulty_level = 8`
- **WHEN** 審稿主管將印件從 A 覆寫指派給 B 並填寫 reason
- **THEN** 系統 SHALL 完成轉指派
- **AND** 記錄 ActivityLog：時間、主管、from=A、to=B、覆寫 reason

#### Scenario: 覆寫至能力不足者被拒

- **GIVEN** 印件 `difficulty_level = 8`
- **AND** 審稿人員 C 的 `max_difficulty_level = 5`
- **WHEN** 審稿主管嘗試將印件覆寫指派給 C
- **THEN** 系統 SHALL 拒絕並顯示「能力不足」提示

#### Scenario: 覆寫未填 reason 被拒

- **WHEN** 審稿主管執行覆寫但未填寫 reason
- **THEN** 系統 SHALL 拒絕並提示 reason 為必填
- **AND** 對齊「不合格未填備註被拒」的設計模式

---

### Requirement: ReviewRound 資料模型

印件（PrintItem）與印件檔案（PrintItemFile）之間 SHALL 引入 `ReviewRound` 實體，承載「業務送審 → 審稿人員審查」的完整迴圈。每一輪 Round 聚合當輪業務送審的檔案與備註、審稿人員的審查結果與審稿後檔案。

**ReviewRound 欄位（雙向聚合）**：

業務端（送審 / 補件）：
- `id`
- `print_item_id`：FK PrintItem
- `round_no`：該印件內遞增序號，從 1 開始
- `submitted_at`：本輪業務送審時間
- `submitted_by`：本輪送審者；B2B 為業務 user id / B2C 為會員 user id / 免審稿時為 `'系統'`
- `submitted_note`：text（非必填，500 字上限）。首次送審通常留空；補件時用來告訴審稿人員「這次改了什麼」

審稿端（審查結果）：
- `reviewer_id`：FK User；免審稿路徑或尚未分派時為 NULL
- `source`：enum（`審稿` / `免審稿`）
- `reviewed_at`：審稿完成時間；NULL 表示業務已送審、審稿人員尚未完成
- `result`：enum（`合格` / `不合格`）；NULL 表示本輪待審
- `reject_reason_category`：enum LOV（`result = '不合格'` 時必填）。PI-009 定案 10 項：出血不足 / 解析度過低 / 色彩模式錯誤 / 缺少必要元素 / 版面超出安全區 / 尺寸不符 / 特殊工藝圖層異常 / 字型未外框 / 技術性退件 / 其他
- `review_note`：text（1000 字上限，非必填）。**合格 / 不合格每輪皆可填**（對齊 refine-prepress-review-scope）；送出後原審稿人員 SHALL 可修改，每次修改 MUST 寫入 ActivityLog「審稿備註修改」事件

**Round 狀態派生**（不建獨立狀態機欄位）：
```
Round 狀態 = 
  result === null    → '待審'
  result === '合格'  → '合格'
  result === '不合格' → '不合格'
```

**型別約束**：
- `result !== null` 必須 `reviewed_at !== null`
- `result === '不合格'` 必須 `reviewer_id !== null` 且 `reject_reason_category !== null`
- `source === '免審稿'` 必須 `reviewer_id === null` 且 `result === '合格'` 且 `reviewed_at === submitted_at`

**PrintItem 層指針（不變）**：
- `current_round_id`：FK ReviewRound。指向當前合格輪次；尚未合格時為 NULL；Unique constraint 保證至多一個。

**PrintItemFile.round_id 改為必填**：
- 所有 PrintItemFile MUST 綁定某個 Round，移除 `round_id = null` 浮動狀態
- `file_role = '印件檔'`：業務 / 會員上傳，綁 Round.submitted_files
- `file_role = '審稿後檔案'` / `'縮圖'`：審稿人員合格時上傳，綁 Round.reviewed_files

#### Scenario: 業務首次上傳稿件建立 Round 1

- **WHEN** 業務 / 會員對某印件首次上傳稿件檔
- **THEN** 系統 SHALL 建立 `round_no = 1, submitted_at = now, submitted_by = 上傳者, source = 審稿, result = null, reviewed_at = null` 的 ReviewRound
- **AND** 上傳的檔案 `file_role = '印件檔'` SHALL 綁定此 Round 的 `submitted_files`
- **AND** 印件 `reviewDimensionStatus` SHALL 從「稿件未上傳」轉為「等待審稿」

#### Scenario: 審稿人員完成審核（合格）

- **GIVEN** 印件存在 `result = null` 的當前 Round（待審）
- **WHEN** 審稿人員送審合格，上傳審稿後檔案 + 縮圖
- **THEN** 系統 SHALL 更新當前 Round：`reviewed_at = now, reviewer_id = 審稿人員, result = '合格', review_note = 填寫內容（可空）`
- **AND** 上傳的檔案 `file_role ∈ {'審稿後檔案', '縮圖'}` SHALL 綁定此 Round 的 `reviewed_files`
- **AND** 系統 SHALL 將 `PrintItem.current_round_id` 指向此 Round
- **AND** 印件 `reviewDimensionStatus` SHALL 轉為「合格」

#### Scenario: 審稿人員完成審核（不合格）

- **GIVEN** 印件存在 `result = null` 的當前 Round（待審）
- **WHEN** 審稿人員送審不合格，選 `reject_reason_category` + 填 `review_note`
- **THEN** 系統 SHALL 更新當前 Round：`reviewed_at = now, reviewer_id = 審稿人員, result = '不合格', reject_reason_category = LOV 值, review_note = 填寫內容`
- **AND** 印件 `reviewDimensionStatus` SHALL 轉為「不合格」

#### Scenario: 業務補件建立新 Round（補件 MUST 有新檔）

- **GIVEN** 印件存在 `result = '不合格'` 的最新 Round
- **WHEN** 業務 / 會員完成補件（上傳新印件檔 ≥ 1 份，可選填 submitted_note）
- **THEN** 系統 SHALL 建立 `round_no = N + 1, submitted_at = now, submitted_by = 補件者, source = 審稿, result = null, submitted_note = 填寫內容（可空）` 的新 ReviewRound
- **AND** 新上傳的檔案 `file_role = '印件檔'` SHALL 綁定此新 Round 的 `submitted_files`
- **AND** 印件 `reviewDimensionStatus` SHALL 從「不合格」轉為「已補件」

#### Scenario: 補件僅改備註不上傳新檔 SHALL 被拒絕

- **GIVEN** 印件存在 `result = '不合格'` 的最新 Round
- **WHEN** 業務 / 會員於補件 Dialog 僅填 `submitted_note` 未上傳任何新印件檔
- **THEN** 系統 MUST 拒絕補件動作
- **AND** UI SHALL 提示「補件必須提供至少一份新印件檔」
- **AND** 印件狀態與 Round 結構 MUST NOT 變化

#### Scenario: 免審稿路徑建立 Round 1

- **WHEN** 印件走免審稿快速路徑（`skipReview = true`）
- **THEN** 系統 SHALL 於印件建立時自動產生 `round_no = 1, source = 免審稿, submitted_by = '系統', reviewer_id = null, result = '合格', submitted_at = reviewed_at = 印件建立時間` 的 ReviewRound
- **AND** 客戶提供的原檔 `file_role = '印件檔'` SHALL 綁定此 Round 的 `submitted_files`
- **AND** `reviewed_files` SHALL 為 NULL（免審稿無審稿人員加工後的檔案）
- **AND** 印件 `reviewDimensionStatus` SHALL 直達「合格」
- **AND** 印件 SHALL 不出現在任何審稿人員的待審列表

#### Scenario: 下游工單取終稿時依 source 判斷

- **WHEN** 工單建立時取印件的「終稿」檔案
- **THEN** 系統 SHALL 依 Round.source 判斷：
  - `source === '審稿'` → 取 `current_round.reviewed_files`（審稿後檔案 + 縮圖）
  - `source === '免審稿'` → 取 `current_round.submitted_files`（客戶原檔即終稿）
- **AND** 工單製作不得因免審稿 `reviewed_files = null` 而取不到終稿

#### Scenario: 補件後重審

- **GIVEN** 印件存在 Round N（不合格）與 Round N+1（待審，業務補件完成後產生）
- **WHEN** 原審稿人員再次送出審核
- **THEN** 系統 SHALL 更新 Round N+1 的審稿端欄位（`reviewed_at`, `reviewer_id`, `result`, 等）
- **AND** 不建立新 Round
- **AND** 印件 `reviewDimensionStatus` 依新 `result` 轉為「合格」或「不合格」

#### Scenario: 技術性退件以 reject_reason_category 區分並排除不合格率 KPI

- **GIVEN** 審稿人員發現檔案損毀 / 字型缺失等技術問題
- **WHEN** 審稿人員送審不合格，`reject_reason_category = '技術性退件'`
- **THEN** 當輪 Round `result = '不合格'`
- **AND** 此 Round SHALL 於 KPI「不合格率」分母排除，另計入「技術退件比率」

### Requirement: 審稿人員審稿作業

審稿人員在其工作台中 SHALL 可執行下列動作：
- 檢視待審印件列表（我被分配的印件，當前 Round `result = null`）
- 進入印件詳情頁檢視原稿（綁 Round 的 `file_role = '印件檔'`）、印件需求規格、歷史輪次
- 下載原稿進行加工（系統外處理）
- 上傳**審稿後檔案**與**縮圖**（合格時至少各一份）
- 標記送審結果為「合格」或「不合格」
- 不合格時 SHALL 選擇 `reject_reason_category` LOV 值；可選填 `review_note`
- 合格時可選填 `review_note`

**關鍵約束**：審稿人員**不可替換** `file_role = '印件檔'` 的原始檔（該 role 由補件方寫入）。審稿人員合格時上傳的是 `file_role = '審稿後檔案'`，作為加工版本，與原印件檔並存。

**送審動作語意**：審稿人員完成審核 SHALL **更新當前 Round 的審稿端欄位**（而非建立新 Round）。新 Round 僅於業務補件時產生。

#### Scenario: 審稿人員打開送審 Dialog 時看到上一輪送審備註

- **WHEN** 審稿人員對補件後印件打開「完成審核」Dialog
- **THEN** Dialog 頂部 SHALL 顯示當前 Round 的 `submitted_note`（業務補件時填寫的內容）
- **AND** 若 `submitted_note` 為空，SHALL 顯示「無補件備註」佔位文字

### Requirement: B2C 會員補件

當印件進入「不合格」狀態且來源為 B2C 訂單時，會員 SHALL 可於電商前台的訂單詳情頁重新上傳印件檔案。電商系統 SHALL 呼叫 ERP 介面回寫新檔案並觸發狀態轉移。

#### Scenario: 會員補件成功

- **GIVEN** B2C 印件審稿維度狀態為「不合格」
- **WHEN** 會員於電商前台重新上傳檔案
- **THEN** 電商系統 SHALL 呼叫 ERP 補件介面
- **AND** ERP SHALL 新增一筆補件檔案（file_role = 印件檔，round_id 暫為 NULL，於審稿人員下次送審時與新 Round 一起綁定）
- **AND** 印件狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

---

### Requirement: B2B 業務補件

當印件進入「不合格」狀態且來源為 B2B 訂單時，業務 SHALL 可於該訂單的詳情頁找到該筆不合格印件並執行補件操作。業務 SHALL 僅能檢視到訂單層級，不可檢視工單與生產任務。

#### Scenario: 業務於訂單詳情頁補件

- **GIVEN** B2B 印件審稿維度狀態為「不合格」
- **WHEN** 業務於訂單詳情頁點選該印件的「補件」入口並上傳檔案
- **THEN** 系統 SHALL 新增一筆補件檔案（file_role = 印件檔，round_id 暫為 NULL，於審稿人員下次送審時與新 Round 一起綁定）
- **AND** 印件狀態 SHALL 轉為「已補件」
- **AND** 原審稿人員的待審列表 SHALL 重新出現此印件

---

### Requirement: 補件回原審稿人員

印件自「不合格」轉為「已補件」時，系統 SHALL 將此印件重新加入**原審稿人員**的待審列表，不重新執行自動分配。

#### Scenario: 補件退回原審稿人員

- **GIVEN** 印件第 1 輪由審稿人員 A 審為不合格
- **AND** 客戶 / 業務完成補件
- **WHEN** 印件轉為「已補件」狀態
- **THEN** 系統 SHALL 將此印件加入 A 的待審列表
- **AND** 系統 SHALL **不**重新執行自動分配演算法

#### Scenario: 原審稿人員離線時改由主管覆寫

- **GIVEN** 原審稿人員 A 當前可用狀態為「不在崗」
- **WHEN** 印件進入「已補件」狀態
- **THEN** 系統 SHALL 於審稿主管的覆寫待辦清單中標示此印件
- **AND** 主管 SHALL 執行覆寫分配操作才能讓印件進入新審稿人員的待審列表

---

### Requirement: 印件 ActivityLog

印件 SHALL 維護 ActivityLog（`PrintItemActivityEvent` 陣列），記錄 Round 迴圈**以外**的事件。Round 迴圈內的行為（送審、補件、審稿決策）由 Round 結構本身承載，不重複寫入 ActivityLog。

**保留的事件型別**：
- `自動分配`：系統依能力 / 負載自動分派審稿人員
- `破例派工`：能力不足時破例派給能力最高者
- `主管覆寫`：審稿主管轉指派印件
- `送出審核`：審稿人員完成審核的時戳事件（跨 Round 追蹤）
- `狀態轉移`：印件 `reviewDimensionStatus` 變化事件
- `審稿備註修改`：原審稿人員修改既存 `review_note`（ISO 9001 稽核）
- `稿件備註修改`：業務 / 主管修改既存 `client_note`（ISO 9001 稽核）

**移除的事件型別**（由 Round 結構承載）：
- `稿件上傳`：由 `Round.submitted_at + submitted_files + submitted_by` 承載
- `補件完成`：由新 Round 的 `submitted_at + submitted_files + submitted_note` 承載

**Event 欄位**（按型別選填）：
- `id / timestamp / type / actor`（所有事件共用）
- `assigned_to / rule_hit`（自動分配）
- `from_user / to_user / reason`（主管覆寫）
- `round_no / round_result / reject_reason_category / review_note`（送出審核）
- `from_status / to_status`（狀態轉移）
- `from_text / to_text`（備註修改事件）

#### Scenario: 業務首次上傳不再產生「稿件上傳」事件

- **WHEN** 業務 / 會員首次上傳印件檔
- **THEN** 系統 MUST NOT 建立 `type = '稿件上傳'` 的 ActivityLog 事件
- **AND** 系統 SHALL 建立 Round 1（依 ReviewRound 資料模型 Requirement § 業務首次上傳稿件建立 Round 1）

#### Scenario: 業務補件不再產生「補件完成」事件

- **WHEN** 業務 / 會員完成補件
- **THEN** 系統 MUST NOT 建立 `type = '補件完成'` 的 ActivityLog 事件
- **AND** 系統 SHALL 建立新 Round N+1（依 ReviewRound 資料模型 Requirement § 業務補件建立新 Round）

#### Scenario: 自動分配事件保留

- **WHEN** 訂單回簽 / 付款後系統為印件自動分派審稿人員
- **THEN** 系統 SHALL 建立 `type = '自動分配', actor = '系統', assigned_to = 審稿人員 id, rule_hit = 命中規則` 的 ActivityLog 事件

#### Scenario: 審稿備註修改事件保留（ISO 9001 稽核）

- **WHEN** 原審稿人員修改既存 Round 的 `review_note`
- **THEN** 系統 SHALL 建立 `type = '審稿備註修改', actor = 審稿人員, round_no, from_text = 舊值, to_text = 新值` 的 ActivityLog 事件

### Requirement: 審稿主管工作台

審稿主管 SHALL 擁有專屬工作台，至少涵蓋下列功能模組（UI 細節見 PI-007）：

1. **審稿人員能力維護**：檢視 / 新增 / 修改 / 停用審稿人員的 `max_difficulty_level`
2. **負擔儀表板**：呈現每位審稿人員的進行中審稿數、完成數、待審數
3. **覆寫分配**：可對任一進行中印件執行轉指派操作
4. **KPI 追蹤**：審稿平均時長、不合格率、工作量分布

#### Scenario: 主管檢視負擔儀表板

- **WHEN** 審稿主管進入工作台
- **THEN** 系統 SHALL 顯示所有審稿人員當前進行中審稿數
- **AND** 儀表板 SHALL 支援依能力值、負擔數排序

---

### Requirement: 審稿人員工作台

審稿人員 SHALL 擁有專屬工作台，至少涵蓋下列頁面（UI 細節見 PI-006）：

1. **列表頁**：呈現「我被分配的待審印件」，區分「首審」與「補件重審」兩類
2. **詳情頁**：呈現印件需求規格、原稿檢視、歷史輪次、上傳元件、送審操作

列表頁 SHALL 支援基本排序（預設規則見 PI-006）。詳情頁 SHALL 呈現完整歷史 ReviewRound 清單，每一輪含當時的檔案、結果、備註與時間。

#### Scenario: 審稿人員列表分類

- **WHEN** 審稿人員進入工作台列表頁
- **THEN** 系統 SHALL 將待審印件分為兩個分類：「首審」與「補件重審」
- **AND** 兩類分別計數呈現於頁首

#### Scenario: 詳情頁呈現歷史輪次

- **WHEN** 審稿人員進入印件詳情頁
- **THEN** 系統 SHALL 呈現該印件所有 ReviewRound 的歷史（最新在上）
- **AND** 每一輪可展開檢視當時的檔案與備註

### Requirement: PrintItemFile 綁定規則

所有 `PrintItemFile` MUST 綁定某個 `ReviewRound`（`round_id` 必填，不得為 NULL）。

**綁定時機**：
- 業務首次上傳 / 補件 → 先建 Round（或取當前 待審 Round）→ 新檔案綁 Round 的 `submitted_files`
- 審稿人員合格 → 上傳的審稿後檔案 + 縮圖 → 綁當前 Round 的 `reviewed_files`

**fileRole 三值**：
- `'印件檔'`：由補件方（業務 / 會員）上傳，綁 `submitted_files`；審稿人員不可替換
- `'審稿後檔案'`：審稿人員合格時上傳，綁 `reviewed_files`；作為下游工單製作基準
- `'縮圖'`：審稿人員合格時上傳，綁 `reviewed_files`；視覺摘要

#### Scenario: 業務補件上傳檔案綁新 Round

- **GIVEN** 印件存在不合格的 Round N
- **WHEN** 業務 / 會員於補件 Dialog 上傳 3 份新印件檔
- **THEN** 系統 SHALL 建立 Round N+1（待審）
- **AND** 3 份新檔案的 `round_id = Round N+1 的 id`、`file_role = '印件檔'`
- **AND** 檔案同時綁定 Round N+1 的 `submitted_files`

#### Scenario: 審稿人員合格上傳檔案綁當前 Round

- **GIVEN** 印件存在待審的當前 Round
- **WHEN** 審稿人員送審合格，上傳 1 份審稿後檔案 + 1 份縮圖
- **THEN** 新檔案的 `round_id = 當前 Round 的 id`、`file_role ∈ {'審稿後檔案', '縮圖'}`
- **AND** 檔案同時綁定當前 Round 的 `reviewed_files`

#### Scenario: 禁止建立 round_id = NULL 的 PrintItemFile

- **WHEN** 任何 action 嘗試建立 `round_id = NULL` 的 PrintItemFile
- **THEN** 系統 MUST 拒絕並提示「檔案必須綁定 Round」

### Requirement: 印件審稿狀態與 Round 同步

印件層 `reviewDimensionStatus` 5 狀態（稿件未上傳 / 等待審稿 / 不合格 / 已補件 / 合格）SHALL 由 action 在 Round 變動時同步更新（denormalized 快取）。

**同步規則**：

| Round 變動 | `reviewDimensionStatus` 變化 |
|-----------|----------------------------|
| 建 Round 1 待審（首次上傳稿件）| 稿件未上傳 → 等待審稿 |
| 當前 Round.result = '合格' | 等待審稿 / 已補件 → 合格 |
| 當前 Round.result = '不合格' | 等待審稿 / 已補件 → 不合格 |
| 建 Round N+1 待審（補件完成）| 不合格 → 已補件 |
| 建 Round 1（source=免審稿, result=合格）| 稿件未上傳 → 合格 |

**一致性要求**：所有改變 Round 的 action 必須同時更新 `reviewDimensionStatus`，確保 UI 層讀取時與 Round 最新狀態對齊。

#### Scenario: 印件狀態欄位與 Round 結構對齊（一致性驗證）

- **WHEN** 任一情境結束後查詢印件 `reviewDimensionStatus`
- **THEN** 其值 SHALL 對應於「基於當前 Round[] 派生的預期狀態」

### Requirement: Round submittedNote UI 展示

業務送審 / 補件備註（`Round.submitted_note`）SHALL 於以下三個 UI 位置可見：

1. **補件 Dialog**（`ResupplyDialog`）：業務填寫 `submitted_note` 的入口
2. **送審 Dialog**（`SubmitReviewDialog`）頂部：審稿人員對補件後印件打開 Dialog 時，看到上一輪（= 當前待審 Round）的 `submitted_note`
3. **審稿歷史 Timeline**（`ReviewRoundTimeline`）：每輪顯示 `submitted_note`（業務送）+ `review_note`（審稿回），兩欄明確分開

#### Scenario: ReviewRoundTimeline 顯示送審備註

- **WHEN** 任一角色檢視印件詳情頁的審稿歷史
- **THEN** 每輪 Round SHALL 顯示以下欄位：輪次、送審時間、送審者、送審備註（submitted_note）、審稿時間、審稿人員、結果、退件原因（若不合格）、審稿備註（review_note）、檔案連結

