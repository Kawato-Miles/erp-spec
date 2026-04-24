## ADDED Requirements

### Requirement: 審稿環節經營指標

審稿主管 Dashboard SHALL 於頁首 L1 今日營運卡片下方呈現 2 格 highlight card，提供主管「審稿速度 vs 品質」兩個經營視角的量化入口。

**指標 1：審稿環節平均滯留天數**

- 定義：區間內完成審稿全部合格的訂單，其「訂單建立到審稿全部合格」的平均耗時
- 計算：`target = orders where prepressApprovedAt BETWEEN [startMs, endMs)`；`value = avg(Order.prepressApprovedAt - Order.createdAt)`，單位為天（可保留 1 位小數）
- 呈現：大數字 + 單位「天」+ 時間區間標籤（如「本月」）

**指標 2：退件 > 3 輪訂單數**

- 定義：當前存在印件反覆退件 3 輪以上、且仍未合格的訂單數
- 計算：`target = orders where 存在任一印件 rounds.length > 3 AND 該印件當前 reviewDimensionStatus != '合格'`；`value = count(target)`
- 呈現：大數字 + 單位「筆」；此指標**不受時間區間影響**（反映當前仍在處理中的問題訂單）
- 閾值「3 輪」為暫定，主管試用後可調整（2 / 3 / 4）

#### Scenario: 主管查看本月平均滯留天數

- **GIVEN** 2026 年 10 月有 3 筆訂單完成審稿全部合格
- **AND** 三筆訂單的 `prepressApprovedAt - createdAt` 分別為 2 天、3 天、4 天
- **WHEN** 主管切換時間區間為「本月」
- **THEN** 「審稿環節平均滯留天數」card SHALL 顯示「3.0 天」
- **AND** card 副標顯示「本月」

#### Scenario: 退件 >3 輪訂單數反映當前狀態

- **GIVEN** 訂單 O-100 印件 P1 當前為 Round 4 等待審稿
- **AND** 訂單 O-101 印件 P2 經 Round 5 最終合格
- **WHEN** 主管查看「退件 >3 輪訂單」card
- **THEN** card 數字 SHALL = 1（僅 O-100 計入；O-101 雖歷經 5 輪但已合格，不計入）

#### Scenario: 退件 >3 輪不受時間區間影響

- **GIVEN** 「退件 >3 輪訂單」當前為 7 筆
- **WHEN** 主管切換時間區間（不限 / 今日 / 本週 / 本月）
- **THEN** 「退件 >3 輪訂單」數字 MUST NOT 因時間區間切換而變動（永遠反映當前值）
- **AND** 「審稿環節平均滯留天數」SHALL 隨時間區間重算

### Requirement: 客戶審稿成果表

審稿主管 Dashboard SHALL 提供「客戶審稿成果表」Tab，讓主管能按客戶維度辨識稿件品質問題，作為向業務反映「需介入客戶溝通」的證據。

**表格欄位**（依序）：

1. 客戶
2. 訂單合格數（該客戶於區間內 `Order.prepressApprovedAt` 落區間的訂單數）
3. 退件印件數（該客戶所有訂單內，區間內 `result = '不合格'` Round 所屬印件去重）
4. 補件後退件次數（該客戶所有訂單內，區間內 `roundNo >= 2 且 result = '不合格'` Round 總數）
5. 反覆退件訂單數（該客戶當前有任一印件 `rounds.length > 3` 且非合格的訂單數；不受時間區間影響）
6. （可選）退件率

**時間範圍切換**：不限 / 今日 / 本週 / 本月 / 自訂（預設**本月**）。

**排序**：預設依「反覆退件訂單數」降冪 → 次依「補件後退件次數」降冪。此排序為**運營優先級**語意（優先處理的客戶），非「客戶排行」。

#### Scenario: 主管查看本月客戶品質排序

- **GIVEN** 客戶 A 當前有 2 筆反覆退件訂單、客戶 B 當前有 0 筆反覆退件訂單但補件後退件次數 15
- **WHEN** 主管切換時間區間為「本月」
- **THEN** 客戶 A SHALL 排在客戶 B 之前（反覆退件訂單數降冪優先）

#### Scenario: 主管辨識需業務介入的客戶

- **GIVEN** 客戶 A 「反覆退件訂單數」= 3
- **WHEN** 主管檢視客戶審稿成果表
- **THEN** 客戶 A 的 row SHALL 明顯呈現 3 筆反覆退件訂單
- **AND** 主管 SHALL 能將此客戶清單帶至業務會議請業務介入客戶溝通

### Requirement: 退件指標區隔

系統 SHALL 於 Dashboard 審稿人員對比表提供兩組並列的退件指標，區隔「所有退件」與「補件後退件」，支援主管觀察「稿問題」與「人問題」。

**四組指標**（依 `ReviewRound.reviewerId` 分組）：

1. **退件印件數**（含首審）：區間內 `result = '不合格'` Round 所屬印件，去重
2. **退件次數**（含首審）：區間內 `result = '不合格'` Round 總數
3. **補件後退件印件數**：區間內 `roundNo >= 2 且 result = '不合格'` Round 所屬印件，去重
4. **補件後退件次數**：區間內 `roundNo >= 2 且 result = '不合格'` Round 總數

**歸屬依據**：依該 Round 的 `reviewerId`（與訂單主要貢獻者獨立）。

**行動判定限制聲明**：在「改稿原因代碼」結構化之前，本指標**僅作觀察用**；主管看到異常僅作為對話觸發點，**系統 MUST NOT 自動推論「惡意退稿」或「稿問題」的因果**。

#### Scenario: 稿件反覆被退（稿問題辨識）

- **GIVEN** 印件 P1 經 Round 1 退件（小陳）→ 補件 → Round 2 退件（小陳）→ 補件 → Round 3 退件（小陳）
- **WHEN** 主管查詢時間區間涵蓋這三輪
- **THEN** 小陳的「退件印件數」+= 1、「退件次數」+= 3
- **AND** 小陳的「補件後退件印件數」+= 1、「補件後退件次數」+= 2（僅 Round 2、3）

#### Scenario: 審稿人員補件後高退件次數（觀察而非判定）

- **GIVEN** 審稿員小陳於 9 月處理 10 件印件，每件在 Round 2 被退、Round 3 合格
- **WHEN** 主管查詢 9 月區間
- **THEN** 小陳的「補件後退件次數」SHALL = 10
- **AND** 小陳的「補件後退件印件數」SHALL = 10
- **AND** 系統 MUST NOT 自動標示此為異常或惡意退稿
- **AND** UI SHALL 於補件後退件欄位 header 附 tooltip 說明「僅作觀察用，行動判定需人工介入並參考改稿原因」

#### Scenario: 同印件跨審稿人員歸屬

- **GIVEN** 印件 P1 Round 1 小陳退件、Round 2 小王退件、Round 3 小張合格
- **WHEN** 主管查詢時間區間涵蓋三輪
- **THEN** Round 1 歸屬小陳（「退件次數」+1，屬首審退件，MUST NOT 計入補件後退件）
- **AND** Round 2 歸屬小王（「退件次數」+1、「補件後退件次數」+1、「補件後退件印件數」+1）
- **AND** 若該訂單僅 P1 一印件，訂單合格後的 `primaryContributorId` 歸屬小張（合格 Round 的 reviewer）

## MODIFIED Requirements

### Requirement: 審稿主管工作台

審稿主管 SHALL 擁有專屬工作台，至少涵蓋下列功能模組：

1. **今日營運卡片（L1）**：永久顯示於工作台頂部，4 格即時數字：
   - 待派工：difficultyLevel 未填或 assignedReviewerId 為 null 的印件數
   - 今日新進稿：ReviewRound 首次 submittedAt（Round 1）在今日的印件數
   - 今日合格：ReviewRound.reviewedAt 在今日且 result='合格' 的 Round 數
   - 今日不合格：ReviewRound.reviewedAt 在今日且 result='不合格' 的 Round 數
2. **審稿環節經營指標**（L1 下方 2 格 highlight card，詳見 Requirement § 審稿環節經營指標）：
   - 審稿環節平均滯留天數
   - 退件 > 3 輪訂單數
3. **審稿人員對比表**（擴充欄位支援訂單級成果與補件後退件區隔）：
   - 欄位：姓名 / 派案等級 / 進行中件數 / 訂單合格數 / 退件印件數 / 退件次數 / 補件後退件印件數 / 補件後退件次數 / 退件率 / 平均處理時間
   - 時間範圍切換：不限 / 今日 / 本週 / 本月 / 自訂（預設**本月**）
   - 排序：**預設依姓名字母序**（無排名壓力）；主管可點欄位 header 自訂排序
   - **MUST NOT 提供審稿王 / 訂單合格數排行榜 / 冠軍 highlight** 等排名性質元件
   - **不標示 ⚠️ 異常徽章**（Baseline 未知，由主管肉眼判斷；補件後退件次數並列於印件數旁，異常自然浮現）
   - 離職 / 停用審稿人員於當期無 Round 時 MUST NOT 顯示 row；有歷史統計需求時 UI SHALL 於姓名旁標「（已離職）」
4. **客戶審稿成果表**（新 Tab，詳見 Requirement § 客戶審稿成果表）
5. **能力維護**：檢視 / 新增 / 修改 / 停用審稿人員的 `max_difficulty_level`
6. **覆寫分配**：可對任一進行中印件執行轉指派操作
7. **整體 KPI 概覽**：保留既有 7 項指標（自動分配命中率 / 首審通過率 / 付款到合格平均 / 補件 loop 平均輪數 / 不合格率 / 技術退件比率 / 破例派工頻率）+ 退件原因 Top N

**處理時間公式（α）**：`avg(reviewedAt - submittedAt)` 以 reviewerId 分組計算，標示為「參考指標」（含排隊時間）。

**退件率公式**：該審稿員 `result='不合格'` Round 數 / `reviewedAt !== undefined` Round 總數（排除待審 Round）。**`skipReview` 印件產生的 Round（source='免審稿'）MUST NOT 計入分母分子**。

#### Scenario: 主管進工作台看 L1 今日卡片

- **WHEN** 審稿主管進入工作台
- **THEN** 頁面頂部 SHALL 顯示 L1 今日營運 4 格卡片，永久可見（不需切 Tab）

#### Scenario: 主管看到審稿環節經營指標

- **WHEN** 審稿主管進入工作台
- **THEN** L1 下方 SHALL 顯示 2 格 highlight card：審稿環節平均滯留天數、退件 > 3 輪訂單數
- **AND** 平均滯留天數 SHALL 隨時間區間重算；退件 > 3 輪訂單數 MUST NOT 隨時間區間變動

#### Scenario: 主管依時間範圍查看對比表

- **WHEN** 審稿主管於對比表切換時間範圍（不限 / 今日 / 本週 / 本月 / 自訂）
- **THEN** 表格 SHALL 即時重算每位審稿員的訂單合格數、退件印件數 / 次數、補件後退件印件數 / 次數、退件率、處理時間
- **AND** 預設排序依姓名字母序
- **AND** 表格 MUST NOT 顯示 ⚠️ 異常徽章
- **AND** 表格 MUST NOT 顯示任何「冠軍」「最佳」等排名性質標示

#### Scenario: 主管識別補件後退件異常（觀察而非判定）

- **WHEN** 主管切換「本月」檢視對比表
- **THEN** 表格 SHALL 並列呈現「退件印件數 | 退件次數」與「補件後退件印件數 | 補件後退件次數」
- **AND** 主管 SHALL 能透過兩組數字對比觀察異常候選者
- **AND** 系統 MUST NOT 自動標示「惡意退稿」或啟動任何自動化動作
- **AND** 主管判定需人工介入並參考改稿原因（待獨立 change 結構化）

#### Scenario: 離職審稿人員處理

- **GIVEN** 審稿員小陳已設為停用（離職）
- **WHEN** 主管查詢「本月」對比表
- **THEN** 若小陳本月無任何 Round，表格 MUST NOT 顯示小陳 row
- **AND** 若主管切「不限」發現歷史統計有小陳記錄，其姓名旁 SHALL 標「（已離職）」
- **AND** 小陳作為 `primaryContributorId` 的訂單統計 MUST NOT 因停用而消失

#### Scenario: 審稿主管覆寫分配（維持）

- **WHEN** 審稿主管對進行中印件執行轉指派
- **THEN** 系統 SHALL 依既有 `overridePrintItemAssignment` 規則處理

### Requirement: 審稿人員對比表

審稿主管工作台 SHALL 提供審稿人員對比表，整合原「負擔儀表板」與新增的訂單級成果、退件區隔等指標。

**表格欄位**（依序呈現）：

1. 審稿員姓名（離職者標註「（已離職）」）
2. 派案等級（`max_difficulty_level`，可點擊編輯）
3. 進行中件數（`assignedReviewerId` = 該員 且 `reviewDimensionStatus ∈ {等待審稿, 不合格, 已補件}` 的印件數，不受時間區間影響）
4. 訂單合格數（該員作為 `primaryContributorId` 於區間內 `prepressApprovedAt` 落區間的訂單數）
5. 退件印件數（該員於時間區間內 `result = '不合格'` Round 所屬印件，去重）
6. 退件次數（該員於時間區間內 `result = '不合格'` Round 總數）
7. 補件後退件印件數（該員於時間區間內 `roundNo >= 2 且 result = '不合格'` Round 所屬印件，去重）
8. 補件後退件次數（該員於時間區間內 `roundNo >= 2 且 result = '不合格'` Round 總數）
9. 退件率（`退件次數 / 時間區間內總 Round 數`，排除 `source='免審稿'` Round）
10. 平均處理時間（α 公式）

**時間範圍切換**：不限 / 今日 / 本週 / 本月 / 自訂（預設**本月**）。

**排序**：

- 預設依姓名字母序（中文姓名用 Unicode codepoint 排序）
- 主管可點欄位 header 自訂排序；header 應有視覺指示（箭頭 icon）顯示當前排序欄位與方向
- **MUST NOT 預設依訂單合格數降冪或退件率降冪** ——避免「排名」語意誘發內耗

**欄位密度管理**：若預設 10 欄視覺過擠，退件率與平均處理時間 MAY 移至 tooltip 或展開面板；訂單合格數、退件印件數 / 次數、補件後退件印件數 / 次數等核心觀察指標 SHALL 永久可見於主列。

**處理時間 α 限制聲明**：UI SHALL 於欄位 header 附 tooltip，說明此指標含排隊時間，僅作參考不作異常判定依據。

**補件後退件限制聲明**：UI SHALL 於「補件後退件」欄位 header 附 tooltip，說明此指標僅作觀察用；行動判定（如約談、調整派案等級）需主管人工介入並參考改稿原因。

#### Scenario: 主管切換時間範圍重算

- **WHEN** 主管於對比表切換「本週」
- **THEN** 每位審稿員的訂單合格數、退件印件數 / 次數、補件後退件印件數 / 次數、退件率、處理時間 SHALL 依本週 Round / Order 重新計算
- **AND** 排序維持使用者當前選擇（若無手動排序，維持依姓名）

#### Scenario: 對比表預設依姓名排序

- **WHEN** 對比表載入
- **THEN** 審稿員 SHALL 依姓名字母序排序
- **AND** 表格 MUST NOT 依訂單合格數或退件率自動降冪排序
- **AND** 表格 MUST NOT 顯示「冠軍」「本月最佳」等排名標示

#### Scenario: 主管點擊欄位 header 切換排序

- **WHEN** 主管點擊「補件後退件次數」欄位 header
- **THEN** 表格 SHALL 依該欄降冪排序
- **AND** header 上 SHALL 顯示箭頭 icon 指示當前排序方向
- **AND** 再次點擊 SHALL 切換為升冪；第三次點擊 SHALL 回到預設（姓名字母序）

#### Scenario: 並列呈現退件指標

- **WHEN** 主管檢視對比表任一審稿員列
- **THEN** 「退件印件數」與「退件次數」 SHALL 相鄰呈現（可視為一組）
- **AND** 「補件後退件印件數」與「補件後退件次數」 SHALL 相鄰呈現（另一組）
- **AND** 主管 SHALL 能透過兩組數字對比觀察「稿反覆退」vs「人退件多」的跡象
- **AND** 觀察結果為對話起點，MUST NOT 作為系統自動判定依據

### Requirement: 審稿總覽時間區間篩選與 Summary Bar

審稿總覽列表（`InProgressItems` 主管視角 / `ReviewerInbox` 審稿人員視角）SHALL 提供時間區間篩選與 Summary Bar，兩頁共用此規範，UX 保持一致。

**時間區間語意（統一定義）**：

- 時間區間 = **審稿完成時間**（`ReviewRound.reviewedAt`）
- 對「已完成」印件（合格）：至少一輪 `reviewedAt` 落在區間內才納入
- 對「待審類」印件（等待審稿 / 已補件 / 不合格）：尚未完成、無 `reviewedAt`，時間區間對它們**不適用**，始終顯示於列表（手上工作量不因時間篩選消失）

**時間區間篩選**：

- 選項：**不限** / 今日 / 本週 / 本月 / 自訂（日期範圍選擇器）
- 預設：**不限**——避免打開列表被今日完成件過濾成空清單
- 與既有 status / reviewer / difficulty 篩選可疊加

**狀態篩選**：

- 支援：等待審稿 / 不合格 / 已補件 / 合格
- 稿件未上傳：不出現於此列表（無 Round 的印件直接排除）

**Summary Bar 分兩組**：

1. **手上工作量**（單格，不受時間影響）：
   - `待處理 N`：當前 `reviewDimensionStatus ∈ {等待審稿, 不合格, 已補件}` 的印件數
2. **完成統計 · {區間}**（兩格，依時間區間重算）：
   - `合格 N`：該印件於時間區間內有任一輪 `result = '合格'` 的印件數
   - `不合格 N`：該印件於時間區間內有任一輪 `result = '不合格'` 的印件數

**分組設計理由**：「手上還欠多少」與「區間做了多少」是兩個不同視角——硬塞在同一排會誤導為同一時間視角的三個數字比較。

**列表粒度**：維持**印件粒度**（一印件一列），每列可點擊進入印件詳情查歷史輪次。

**兩頁差異**：

- `InProgressItems`（主管）：不自動過濾 `reviewerId`；支援批次變更審稿人員
- `ReviewerInbox`（審稿人員）：自動過濾 `reviewerId = currentUser.id`；不支援批次動作

#### Scenario: 審稿人員打開 Inbox 看到手上所有待審

- **WHEN** 審稿人員進入我的待審
- **THEN** 時間區間 SHALL 預設為「不限」
- **AND** 列表 SHALL 顯示所有分派給該員、`reviewDimensionStatus ∈ {等待審稿, 不合格, 已補件}` 的印件（含上月積壓）
- **AND** Summary Bar「手上工作量」SHALL 顯示 `待處理 N`（反映積壓總量，不受時間篩選影響）
- **AND** 「完成統計 · 全部」SHALL 顯示該員累計合格 / 不合格印件數

#### Scenario: 主管打開待審印件看全公司積壓

- **WHEN** 審稿主管進入待審印件頁
- **THEN** 時間區間 SHALL 預設為「不限」
- **AND** Summary Bar「手上工作量 · 待處理 N」SHALL 反映全公司當前積壓
- **AND** 「完成統計 · 全部」SHALL 顯示系統歷史累計合格 / 不合格

#### Scenario: 切換時間區間 Summary Bar 即時重算

- **WHEN** 使用者切換時間區間（不限 / 今日 / 本週 / 本月 / 自訂）
- **THEN** 「完成統計」區塊的兩個數字 SHALL 同步重算
- **AND** 「手上工作量」的 `待處理 N` MUST NOT 變動（此格不受時間影響）

#### Scenario: 同印件在區間內多次出現

- **WHEN** 某印件在時間區間內先有 Round N 不合格、後有 Round N+1 合格
- **THEN** 該印件同時計入「完成統計」的 `合格 N` 與 `不合格 N`
- **AND** 印件粒度列表中此印件只顯示一列（以當前 `reviewDimensionStatus` 為列顯示依據）

### Requirement: 對帳場景的資料可得性

審稿員與主管需要對帳「特定時間區間內完成的審稿清單」時，系統 SHALL 透過既有資料結構（ReviewRound + PrintItem + Order）提供足夠資訊，無需額外建新資料欄位。

**資料來源**：

- `ReviewRound.reviewerId` / `reviewedAt` / `result` / `printItemId`
- `Order.prepressApprovedAt` / `primaryContributorId`（訂單級統計）

**UI 展示責任**：

- 審稿員視角：透過 `ReviewerInbox` 的時間區間 + status 篩選組合
- 主管視角：透過 `InProgressItems` 或 SupervisorDashboard 的時間區間 + reviewer / customer 篩選組合
- 不新建獨立「完成紀錄」頁面

#### Scenario: 審稿員列出本月合格清單

- **WHEN** 審稿員在我的待審設定時間區間=本月、status=合格
- **THEN** 列表 SHALL 列出本月該審稿員至少有一輪 `result='合格'` 的印件
- **AND** 每列顯示印件編號 / 訂單編號 / 客戶名稱 / 合格時間
- **AND** 「完成統計 · 本月」顯示 `合格 N` 對應筆數

#### Scenario: 主管列出某審稿員某月訂單合格數

- **WHEN** 主管在 SupervisorDashboard 對比表設定時間區間=2026 年 4 月
- **THEN** 該員「訂單合格數」欄 SHALL 反映該區間 `Order.prepressApprovedAt` 落區間且 `primaryContributorId = 該員` 的訂單數
