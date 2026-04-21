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
- `review_note`：text（備註補充；不合格時建議填寫，非必填）

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

---

### Requirement: 審稿人員審稿作業

審稿人員在其工作台中 SHALL 可執行下列動作：
- 檢視待審印件列表（我被分配的印件）
- 進入印件詳情頁檢視原稿（由補件方提供的 `file_role=印件檔`）、印件需求規格、歷史輪次
- 下載原稿進行加工（系統外處理）
- 上傳**審稿後檔案**與**縮圖**（單次送審合格時至少各一份）
- 標記送審結果為「合格」或「不合格」
- 不合格時 SHALL 填寫原因備註

**關鍵約束（2026-04-21 data-consistency-audit 明確化）**：審稿人員**不可替換** `file_role=印件檔` 的原始檔（該 role 由補件方 B2C 會員 / B2B 業務透過補件流程寫入）。審稿人員合格時上傳的是 `file_role=審稿後檔案`，作為加工版本，與原印件檔並存。

送審動作 SHALL 觸發 ReviewRound 建立與印件狀態轉移。

#### Scenario: 送審合格

- **WHEN** 審稿人員上傳**審稿後檔案**與**縮圖**，選擇「合格」並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 合格）
- **AND** 上傳的檔案綁定此 round_id（`file_role=審稿後檔案` + `file_role=縮圖`）
- **AND** 系統 SHALL 將 PrintItem.current_round_id 指向此 Round
- **AND** 印件審稿維度狀態 SHALL 轉為「合格」（合格為終態，若後續需變更內容，SHALL 透過「棄用原印件 + 建立新印件」處理，參考 business-scenarios spec）
- **AND** 觸發下游自動建工單流程（B2C 自動帶生產任務 / B2B 建空工單草稿，詳見 business-processes spec § 審稿階段流程）

#### Scenario: 送審不合格

- **WHEN** 審稿人員選擇「不合格」、自 reject_reason_category LOV 選單選取原因、選填 review_note 補充備註，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 不合格，reject_reason_category = 選取值，review_note = 補充文字）
- **AND** 此輪不要求上傳審稿後檔案或縮圖（不合格時檔案非必要）
- **AND** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方（B2C：客戶；B2B：業務；通知管道見 XM-006），通知內容包含 reject_reason_category 分類與 review_note 補充

#### Scenario: 不合格未選 reject_reason_category 被拒

- **WHEN** 審稿人員選擇「不合格」但未自 LOV 選單選取 reject_reason_category
- **THEN** 系統 SHALL 拒絕送審並提示「退件原因分類」為必選

#### Scenario: 退件原因結構化供分析

- **WHEN** 審稿主管或管理層檢視 KPI 儀表板
- **THEN** 系統 SHALL 依 reject_reason_category 彙總退件原因 Top N
- **AND** 支援按原因分類計算各自的補件回流率（供圖編器 Preflight ROI 計算，詳見 XM-007）
