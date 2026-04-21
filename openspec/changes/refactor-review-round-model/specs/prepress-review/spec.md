## MODIFIED Requirements

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

#### Scenario: 業務補件建立新 Round

- **GIVEN** 印件存在 `result = '不合格'` 的最新 Round
- **WHEN** 業務 / 會員完成補件（上傳新印件檔，可選填 submitted_note）
- **THEN** 系統 SHALL 建立 `round_no = N + 1, submitted_at = now, submitted_by = 補件者, source = 審稿, result = null, submitted_note = 填寫內容（可空）` 的新 ReviewRound
- **AND** 新上傳的檔案 `file_role = '印件檔'` SHALL 綁定此新 Round 的 `submitted_files`
- **AND** 印件 `reviewDimensionStatus` SHALL 從「不合格」轉為「已補件」

#### Scenario: 免審稿路徑建立 Round 1

- **WHEN** 印件走免審稿快速路徑（`skipReview = true`）
- **THEN** 系統 SHALL 於印件建立時自動產生 `round_no = 1, source = 免審稿, submitted_by = '系統', reviewer_id = null, result = '合格', submitted_at = reviewed_at = 印件建立時間` 的 ReviewRound
- **AND** 客戶提供的原檔 `file_role = '印件檔'` SHALL 同時綁定此 Round 的 `submitted_files` 與 `reviewed_files`（免審稿不需要審稿人員複製一份）
- **AND** 印件 `reviewDimensionStatus` SHALL 直達「合格」
- **AND** 印件 SHALL 不出現在任何審稿人員的待審列表

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

## ADDED Requirements

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
