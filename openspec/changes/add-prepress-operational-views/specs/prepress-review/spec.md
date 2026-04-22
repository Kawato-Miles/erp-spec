## MODIFIED Requirements

### Requirement: 審稿主管工作台

審稿主管 SHALL 擁有專屬工作台，至少涵蓋下列功能模組：

1. **今日營運卡片（L1）**：永久顯示於工作台頂部，4 格即時數字：
   - 待派工：difficultyLevel 未填或 assignedReviewerId 為 null 的印件數
   - 今日新進稿：ReviewRound 首次 submittedAt（Round 1）在今日的印件數
   - 今日合格：ReviewRound.reviewedAt 在今日且 result='合格' 的 Round 數
   - 今日不合格：ReviewRound.reviewedAt 在今日且 result='不合格' 的 Round 數
2. **審稿人員對比表（整合原負擔儀表板 + 派案等級編輯 + 個人對比）**：
   - 欄位：審稿員姓名 / 派案等級 / 進行中件數 / 時間區間內件數 / 退件率 / 平均處理時間
   - 時間範圍切換：今日 / 本週 / 本月（預設今日）
   - 排序：退件率降冪（異常自然排至頂部）
   - **不標示 ⚠️ 異常徽章**（Baseline 未知，純展示由主管肉眼判斷）
3. **能力維護**：檢視 / 新增 / 修改 / 停用審稿人員的 `max_difficulty_level`
4. **覆寫分配**：可對任一進行中印件執行轉指派操作
5. **整體 KPI 概覽**：保留既有 7 項指標（自動分配命中率 / 首審通過率 / 付款到合格平均 / 補件 loop 平均輪數 / 不合格率 / 技術退件比率 / 破例派工頻率）+ 退件原因 Top N

**處理時間公式（α）**：`avg(reviewedAt - submittedAt)` 以 reviewerId 分組計算。
- 含排隊時間（業務送審 → 審稿員審完），會受審稿員負擔影響；標示為「參考指標」
- 未來若需精準抓偷懶，補 β 公式（審稿員本人專注時間）為進階指標

**退件率公式**：該審稿員 `result='不合格'` Round 數 / `reviewedAt !== undefined` Round 總數（排除待審 Round）。

#### Scenario: 主管進工作台看 L1 今日卡片

- **WHEN** 審稿主管進入工作台
- **THEN** 頁面頂部 SHALL 顯示 L1 今日營運 4 格卡片（待派工 / 今日新進 / 今日合格 / 今日不合格），永久可見（不需切 Tab）

#### Scenario: 主管依時間範圍查看個人對比

- **WHEN** 審稿主管於人員對比表切換時間範圍（今日 / 本週 / 本月）
- **THEN** 表格 SHALL 即時重算每位審稿員的件數、退件率、平均處理時間
- **AND** 依退件率降冪排序
- **AND** 表格 MUST NOT 顯示 ⚠️ 異常徽章（純展示）

#### Scenario: 審稿主管覆寫分配（維持）

- **WHEN** 審稿主管對進行中印件執行轉指派
- **THEN** 系統 SHALL 依既有 `overridePrintItemAssignment` 規則處理

### Requirement: 審稿人員工作台

審稿人員 SHALL 擁有專屬工作台，至少涵蓋下列頁面：

1. **列表頁（ReviewerInbox）**：呈現「我被分配的待審印件」，區分「首審」與「補件重審」兩類
2. **詳情頁**：呈現印件需求規格、原稿檢視、歷史輪次、上傳元件、送審操作

列表頁 SHALL 支援基本排序。詳情頁 SHALL 呈現完整歷史 ReviewRound 清單，每一輪含當時的檔案、結果、備註與時間。

**跨部門對帳場景**（refactor-review-round-model 後新增）：
- 當審稿員需要向印務自證「這些我都送審過」時，SHALL 透過「審稿總覽」（`InProgressItems` 頁面）的 reviewerId + 時間區間 + status=合格 篩選，列出具體印件清單
- 不另建 ReviewerInbox 的「完成紀錄」Tab（降低 UI 重複）

#### Scenario: 審稿人員列表分類（維持）

- **WHEN** 審稿人員進入收件匣（ReviewerInbox）
- **THEN** 系統 SHALL 將待審印件分為「首審」與「補件重審」兩類
- **AND** 兩類分別計數呈現於頁首

#### Scenario: 詳情頁呈現歷史輪次（維持）

- **WHEN** 審稿人員進入印件詳情頁
- **THEN** 系統 SHALL 呈現該印件所有 ReviewRound 的歷史（最新在上）
- **AND** 每一輪可展開檢視當時的檔案與備註

#### Scenario: 審稿人員跨部門對帳

- **WHEN** 審稿員被印務追問「你這週審了幾筆合格」
- **THEN** 審稿員 SHALL 進入審稿總覽（InProgressItems）
- **AND** 篩選 `reviewerId = 自己`、時間區間 = 本週、status = 合格
- **AND** 列表 SHALL 顯示具體印件編號清單，供筆數對帳
- **AND** Summary bar 同步顯示該篩選下的 `合格 N` 數字

## ADDED Requirements

### Requirement: 審稿總覽時間區間篩選與 Summary Bar

審稿總覽列表（`InProgressItems`）SHALL 提供時間區間篩選與 summary bar，作為主管看總量 + 審稿員對帳的共用工具。

**時間區間篩選**：
- 選項：今日 / 本週 / 本月 / 自訂（日期範圍選擇器）
- 預設：**今日**
- 篩選邏輯：該印件的 ReviewRound **任一** `reviewedAt` 落在指定區間內（若印件無任何 Round 有 reviewedAt，則本次篩選不包含）
- 與既有 status / reviewer / difficulty 篩選可疊加

**狀態篩選擴充**：
- 原支援：等待審稿 / 不合格 / 已補件
- 擴充：+ 合格（支援查詢已合格印件作對帳用途）
- 擴充：+ 稿件未上傳（選填，預設隱藏此狀態的印件）

**Summary Bar**：列表頂部顯示當前篩選結果的聚合數字：
- `待處理 N`：當前 reviewDimensionStatus ∈ {等待審稿, 不合格, 已補件} 的印件數
- `合格 N`：該印件於時間區間內有任一輪 result='合格' 的印件數
- `不合格 N`：該印件於時間區間內有任一輪 result='不合格' 的印件數
- 三數字隨篩選即時重算

**列表粒度**：維持**印件粒度**（一印件一列），每列可點擊進入印件詳情查歷史輪次。不採 Round 粒度避免同印件多輪重複顯示。

#### Scenario: 主管每日看 Summary Bar

- **WHEN** 審稿主管進入審稿總覽
- **THEN** 時間區間預設「今日」
- **AND** Summary Bar 顯示今日的 `待處理 N｜合格 N｜不合格 N`
- **AND** 列表顯示符合「今日 + 其他篩選」的印件

#### Scenario: 切換時間範圍 Summary Bar 即時重算

- **WHEN** 使用者切換時間範圍至「本週」
- **THEN** 列表 SHALL 重新篩選為「本週 ReviewRound.reviewedAt 區間內的印件」
- **AND** Summary Bar 的三個數字 SHALL 同步重算

#### Scenario: 同印件在區間內多次出現（合格 + 不合格重疊）

- **WHEN** 某印件在時間區間內先有 Round N 不合格、後有 Round N+1 合格
- **THEN** 該印件同時計入 `合格 N` 與 `不合格 N`（反映此區間內歷經兩種事件）
- **AND** 印件粒度列表中此印件只顯示一列（以當前 reviewDimensionStatus 為列顯示依據）

#### Scenario: 審稿員用 Summary Bar + Filter 對帳

- **WHEN** 審稿員設定 reviewerId=自己、時間區間=本週、status=合格
- **THEN** Summary Bar 的 `合格 N` SHALL 反映該審稿員本週合格的印件數
- **AND** 列表 SHALL 列出具體印件清單，提供對帳明細

### Requirement: 審稿主管工作台 L1 今日卡片

審稿主管工作台頁面頂部 SHALL 顯示 L1 今日營運卡片（4 格 summary），永久可見不受 Tabs 切換影響。

**4 格指標**：
1. **待派工**：difficultyLevel 未填或 assignedReviewerId 為 null 的印件數（全系統，非今日）
2. **今日新進稿**：Round 1（印件首輪）submittedAt 在今日的印件數
3. **今日合格**：ReviewRound.reviewedAt 在今日且 result='合格' 的 Round 數
4. **今日不合格**：ReviewRound.reviewedAt 在今日且 result='不合格' 的 Round 數

**「今日」定義**：使用者當前時區的 00:00:00 ~ 23:59:59。

#### Scenario: 主管早上進工作台看 L1 卡片

- **WHEN** 審稿主管於早上 08:30 進入工作台
- **THEN** 頁面頂部 SHALL 顯示 L1 4 格卡片，數字反映當前（包含凌晨新進稿件）

#### Scenario: L1 卡片不受 Tab 切換影響

- **WHEN** 審稿主管切換工作台 Tab（審稿人員對比表 / KPI 概覽）
- **THEN** L1 卡片 SHALL 永久可見於頁面頂部

### Requirement: 審稿人員對比表

審稿主管工作台 SHALL 提供審稿人員對比表，合併原「負擔儀表板」與新增的個人對比指標。

**表格欄位**：
- 審稿員姓名
- 派案等級（`max_difficulty_level`，可點擊編輯）
- 進行中件數（assignedReviewerId = 該員 且 reviewDimensionStatus ∈ {等待審稿, 不合格, 已補件} 的印件數）
- 時間區間內件數（該審稿員於時間區間內審過（`reviewedAt` 在區間內）的 Round 數）
- 退件率（該審稿員於時間區間內 `result='不合格'` Round 數 / 時間區間內總 Round 數）
- 平均處理時間（該審稿員於時間區間內 Round 的 `avg(reviewedAt - submittedAt)` 以 α 公式）

**時間範圍切換**：今日 / 本週 / 本月（預設今日）。

**排序**：退件率降冪為主排序；次排序為時間區間內件數降冪（避免低件數樣本被捧高）。

**不標示 ⚠️ 異常徽章**（Baseline 未知）。

**處理時間 α 限制聲明**：UI SHALL 於欄位 header 附 tooltip，說明此指標含排隊時間，僅作參考不作異常判定依據。

#### Scenario: 主管切換時間範圍

- **WHEN** 主管於對比表切換「本週」
- **THEN** 每位審稿員的件數 / 退件率 / 處理時間 SHALL 依本週 Round 重新計算
- **AND** 排序依新退件率重排

#### Scenario: 對比表依退件率排序

- **WHEN** 對比表載入
- **THEN** 審稿員 SHALL 依退件率降冪排序
- **AND** 退件率相同時，依時間區間內件數降冪（件數高者在前）

#### Scenario: 低樣本數不標異常

- **WHEN** 某審稿員於時間區間內只有 1 筆 Round 且 result='不合格'（退件率 100%）
- **THEN** 表格 SHALL 顯示該審稿員退件率 100%，排序到頂部
- **AND** 表格 MUST NOT 自動標示 ⚠️（由主管判斷是樣本太少還是真異常）

### Requirement: 對帳場景場景的資料可得性

審稿員需要向印務對帳「特定時間區間內完成的審稿清單」時，系統 SHALL 透過既有資料結構（ReviewRound + PrintItem）提供足夠資訊，無需額外建新資料欄位。

**資料來源**：
- `ReviewRound.reviewerId` — 確認是該審稿員審的
- `ReviewRound.reviewedAt` — 用於時間區間判定
- `ReviewRound.result` — 確認是合格還是不合格
- `ReviewRound.printItemId` → 關聯印件以取印件編號 / 訂單編號 / 客戶名稱

**UI 展示責任**：由 `InProgressItems` 頁面的時間區間 + status + reviewerId 篩選組合提供查詢能力；不新建獨立「完成紀錄」頁面。

#### Scenario: 審稿員列出本月合格清單

- **WHEN** 審稿員在審稿總覽設定 reviewerId=自己、時間區間=本月、status=合格
- **THEN** 列表 SHALL 列出本月該審稿員至少有一輪 result='合格' 的印件
- **AND** 每列顯示印件編號 / 訂單編號 / 客戶名稱 / 合格時間
- **AND** Summary Bar 顯示 `合格 N` 對應筆數
