## ADDED Requirements

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

印件（PrintItem）與印件檔案（PrintItemFile）之間 SHALL 引入 `ReviewRound` 實體。每次審稿人員送出審核、或印件走免審稿路徑時，系統 MUST 產生一筆 ReviewRound 紀錄，聚合當輪的檔案（印件檔 / 縮圖）、審稿結果與備註。

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
- `current_round_id`：FK ReviewRound。指向當前合格輪次，作為印件摘要（縮圖、印件檔）的單一指針。**Unique constraint**：每 PrintItem 至多一個 current_round_id；尚未合格時為 NULL。

**PrintItemFile 擴充**：
- `round_id`：FK ReviewRound
- `file_role`：enum（**印件檔 / 縮圖**）。審稿人員負責將客戶提供的內容（圖片、多組成品、刀模線等）於加工階段合併為**單一印件檔**；縮圖為該印件的代表縮圖（視覺摘要）。每輪 Round SHALL 至少含 1 份 `file_role=印件檔` 與 1 份 `file_role=縮圖`。
- `review_status`：保留但 SHALL 標為衍生值（= 所屬 Round.result 的投影）
- `is_final`：於本 change **移除**。改由 `PrintItem.current_round_id → Round → File` 取代。

#### Scenario: 首輪送審建立 ReviewRound

- **WHEN** 審稿人員首次對某印件送出審核
- **THEN** 系統 SHALL 建立 `round_no = 1, source = 審稿` 的 ReviewRound
- **AND** 將當輪上傳的印件檔、縮圖綁定此 round_id

#### Scenario: 補件後重審遞增 round_no

- **GIVEN** 印件已存在 `round_no = 1` 結果為「不合格」的 ReviewRound
- **AND** 客戶 / 業務已完成補件
- **WHEN** 原審稿人員再次送出審核
- **THEN** 系統 SHALL 建立 `round_no = 2` 的 ReviewRound

#### Scenario: 合格輪次設為 PrintItem current_round_id

- **WHEN** 某 ReviewRound 的 `result` 被標為「合格」
- **THEN** 系統 SHALL 將該 Round 的 id 寫入所屬 PrintItem 的 `current_round_id`
- **AND** DB 層 unique constraint SHALL 保證同印件至多一個合格指針（避免並發 race）

#### Scenario: 印件摘要呈現合格輪檔案

- **WHEN** 任一角色檢視印件摘要（訂單詳情、工單建立頁等）
- **THEN** 系統 SHALL 透過 `PrintItem.current_round_id → ReviewRound → PrintItemFile (file_role ∈ {印件檔, 縮圖})` 呈現檔案
- **AND** current_round_id 為 NULL（尚未合格）時，SHALL 顯示「待審稿」狀態而非舊輪檔案
- **AND** 歷史輪次檔案 SHALL 於印件詳情頁的歷史區可查閱

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
- 進入印件詳情頁檢視原稿、印件需求規格、歷史輪次
- 下載原稿進行加工（系統外處理）
- 上傳印件檔與縮圖（單次送審至少包含一個印件檔與一個縮圖）
- 標記送審結果為「合格」或「不合格」
- 不合格時 SHALL 填寫原因備註

送審動作 SHALL 觸發 ReviewRound 建立與印件狀態轉移。

#### Scenario: 送審合格

- **WHEN** 審稿人員上傳印件檔與縮圖，選擇「合格」並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 合格）
- **AND** 系統 SHALL 將 PrintItem.current_round_id 指向此 Round
- **AND** 印件審稿維度狀態 SHALL 轉為「合格」（合格為終態，若後續需變更內容，SHALL 透過「棄用原印件 + 建立新印件」處理，參考 business-scenarios spec）
- **AND** 觸發下游自動建工單流程（B2C 自動帶生產任務 / B2B 建空工單草稿，詳見 business-processes spec § 審稿階段流程）

#### Scenario: 送審不合格

- **WHEN** 審稿人員選擇「不合格」、自 reject_reason_category LOV 選單選取原因、選填 review_note 補充備註，並送審
- **THEN** 系統 SHALL 建立新 ReviewRound（result = 不合格，reject_reason_category = 選取值，review_note = 補充文字）
- **AND** 印件審稿維度狀態 SHALL 轉為「不合格」
- **AND** 系統 SHALL 通知補件方（B2C：客戶；B2B：業務；通知管道見 XM-006），通知內容包含 reject_reason_category 分類與 review_note 補充

#### Scenario: 不合格未選 reject_reason_category 被拒

- **WHEN** 審稿人員選擇「不合格」但未自 LOV 選單選取 reject_reason_category
- **THEN** 系統 SHALL 拒絕送審並提示「退件原因分類」為必選

#### Scenario: 退件原因結構化供分析

- **WHEN** 審稿主管或管理層檢視 KPI 儀表板
- **THEN** 系統 SHALL 依 reject_reason_category 彙總退件原因 Top N
- **AND** 支援按原因分類計算各自的補件回流率（供圖編器 Preflight ROI 計算，詳見 XM-007）

---

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

印件 SHALL 維護 ActivityLog，記錄所有與審稿相關的事件。ActivityLog 格式對齊既有需求單 ActivityLog 樣式。事件類型至少包含：

| 事件 | 欄位 |
|------|------|
| 稿件上傳 | timestamp, actor, file_ids |
| 自動分配 | timestamp, assigned_to, rule_hit（能力最接近 / 負載最少 / tie-break） |
| 主管覆寫 | timestamp, actor（主管）, from_user, to_user, reason |
| 送出審核 | timestamp, actor（審稿人員）, round_no, result, note |
| 補件完成 | timestamp, actor（客戶 / 業務）, round_no, file_ids |
| 狀態轉移 | timestamp, from_status, to_status |

#### Scenario: 自動分配寫入 ActivityLog

- **WHEN** 系統執行自動分配並指派印件給審稿人員 A
- **THEN** 印件 ActivityLog SHALL 新增一筆「自動分配」事件
- **AND** 記錄 assigned_to = A、命中規則（例如「能力最接近」）

#### Scenario: 印件詳情頁時間軸呈現

- **WHEN** 任一角色檢視印件詳情頁
- **THEN** 系統 SHALL 於右側區域以時間軸呈現該印件所有 ActivityLog 事件
- **AND** 時間軸 SHALL 依時間由新到舊排列

---

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
