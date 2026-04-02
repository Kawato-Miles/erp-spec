## Purpose

生產任務模組 -- 印刷生產的最小追蹤單位，向上驅動工單完成度計算（齊套性邏輯 Kitting Logic）。
涵蓋派工排程、設備選擇、報工追蹤、狀態管理、異動管理全流程。
取代現有紙本工單 + Slack + 口頭報工組合。

**問題**：
- 派工缺乏決策依據（設備負載/拼版成本不可見），每日 20-30 次全靠經驗
- 報工依賴口頭告知，延遲高且容易遺漏，工單完成度計算失準
- 外包廠進度無追蹤，工序相依性靠人工協調

**目標**：
- 主要：建立生產任務的系統化派工排程與執行追蹤，取代紙本+口頭組合
- 次要：提供設備/拼版負載視圖輔助最低成本派工；報工紀錄準確率 >= 99.5%

- 來源 BRD：[生產任務 BRD](https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94)（v0.2）
- Prototype：尚未建置
- 相依模組：工單管理、QC 單、訂單管理

---

## Requirements

### Requirement: 派工板
系統 SHALL 提供派工板，顯示製程審核完成後所有待設定排程的生產任務清單，支援依優先度/交貨日期排序。

#### Scenario: 印務查看待排程任務
- **WHEN** 印務開啟派工板
- **THEN** 系統顯示所有待排程的生產任務，包含工單資訊、工序、印件名稱、交貨日期

#### Scenario: US-WO-013 查看派工板（待派工的生產任務清單）
- **WHEN** 印務主管進入派工板
- **THEN** 系統 SHALL 列出所有待派工的生產任務，按優先度或交貨日期排序，每筆任務 MUST 顯示：任務編號、所屬工單、交貨日期、預計工作量、所屬工廠類型

### Requirement: 設備選擇與工廠指定
系統 SHALL 依工序決定工廠（唯讀），印務選擇執行設備（若工序需要）。

#### Scenario: 印務為生產任務選擇設備
- **WHEN** 印務在派工板為生產任務設定執行設備
- **THEN** 系統顯示該工序對應工廠（唯讀），印務可從該工廠的設備清單選擇

#### Scenario: 工序不需要設備
- **WHEN** 某工序不需要指定設備
- **THEN** 系統允許跳過設備選擇，僅記錄工廠

#### Scenario: US-WO-014 為生產任務選擇設備
- **WHEN** 印務主管選擇待派工任務並檢查工序是否需要設備
- **THEN** 若工序需要設備，系統 SHALL 顯示該工廠可用設備列表供選擇並確認保存；若工序不需要設備，系統 MUST 隱藏設備欄位

### Requirement: 開工日期設定與完工推算
系統 SHALL 支援印務手動設定開工日期（pt_scheduled_date），系統依 estimated_duration_days 自動推算 planned_end_date。派工時間單位為天。

#### Scenario: 印務設定開工日期
- **WHEN** 印務設定生產任務的開工日期為 2026-04-01，預估工期 3 天
- **THEN** 系統自動推算完工日期為 2026-04-04（planned_end_date = scheduled_date + estimated_duration_days）

#### Scenario: US-WO-015 手動設定開工日期與完工推算
- **WHEN** 印務主管選擇待派工任務並輸入開工日期
- **THEN** 系統 SHALL 根據工序耗時即時推算完工日期並顯示；印務主管 MUST 確認推算完工日期是否在交貨日期之前，確認後保存派工

### Requirement: 設備/工廠負載視圖
系統 SHALL 提供設備/工廠負載視圖，顯示同設備/工廠已排程任務，輔助印務避免超載排程與拼版成本優化。

#### Scenario: 印務查看設備負載
- **WHEN** 印務在派工時查看某設備的排程
- **THEN** 系統顯示該設備已排定的任務時段，標示負載狀況

#### Scenario: US-WO-017 查看設備/工廠負載視圖
- **WHEN** 印務主管進入派工板並點擊「負載視圖」，選擇維度（設備或工廠）
- **THEN** 系統 SHALL 以日期軸搭配設備/工廠軸展示時間軸與任務分布；系統 MUST 清晰標示目前負荷與預警閾值，輔助識別過載時段

### Requirement: 任務交付
系統 SHALL 支援印務確認派工排程完成後透過系統交付任務（任務狀態：待交付 -> 已交付）。前置條件：所有生產任務均已設定設備（若工序需要）與開工日期。

#### Scenario: 印務交付任務給生管
- **WHEN** 印務確認派工排程完成，所有生產任務已設定設備與開工日期
- **THEN** 系統將任務狀態從「待交付」轉為「已交付」，生管收到通知

#### Scenario: 前置條件未滿足
- **WHEN** 印務嘗試交付但有生產任務未設定開工日期
- **THEN** 系統阻擋交付並提示未完成排程的任務清單

### Requirement: 生管接收與分派

生管查看已交付任務清單，透過日程面板的「建立工作包」操作完成派工。原有的批次派工操作由建立工作包取代。

生管 SHALL 在日程面板上依分組查看所有待處理生產任務，勾選任務後建立工作包（含指派師傅、備註、確樣需求）。建立工作包後，任務狀態維持「待處理」不變。

所有已派工的生產任務 MUST 歸屬於某工作包（work_package_id NOT NULL）。不存在「有 assigned_operator 但無 work_package_id」的生產任務。

已派工的生產任務在生產任務列表中以工作包為單位呈現（ErpExpandableRow 兩層展開），不再以單筆平鋪顯示。

#### Scenario: 生管透過工作包完成派工

- **WHEN** 生管在日程面板勾選 3 筆待處理任務並建立工作包
- **THEN** 3 筆任務歸入工作包，assigned_operator 設為選定師傅，狀態維持「待處理」

#### Scenario: 生管查看各任務進度

- **WHEN** 生管進入生產任務列表
- **THEN** 以工作包為父列（Key、師傅、備註、確樣需求、任務數、進度），展開後顯示包內生產任務明細

#### Scenario: 派工後欄位一致性

- **WHEN** 生管透過建立工作包完成派工
- **THEN** 該生產任務的 work_package_id、assigned_operator MUST 同時有值

#### Scenario: 移出工作包後欄位清除

- **WHEN** 生產任務從工作包移出
- **THEN** work_package_id、assigned_operator、actual_start_date MUST 全部清除為 null

### Requirement: 師傅查看工作包

師傅在「我的任務」頁面 SHALL 以工作包為單位查看分派的生產任務，呈現方式與生產任務列表一致（ErpExpandableRow 兩層展開）。

#### Scenario: 師傅查看工作包任務

- **WHEN** 師傅進入「我的任務」頁面
- **THEN** 以工作包為父列，展開後顯示包內生產任務，可逐筆或批次報工

### Requirement: 生產任務狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 生產任務定義的規則進行狀態轉換。自有工廠路徑：待處理 → 製作中 → 已完成。生管指派師傅為欄位更新（assigned_operator），不觸發狀態變更。

#### Scenario: 自有工廠路徑

- **WHEN** 生產任務由自有工廠執行
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 已完成
- **AND** 「製作中」由首次報工觸發

#### Scenario: 外包廠路徑

- **WHEN** 生產任務由外包廠執行
- **THEN** 狀態路徑維持不變：待處理 → 製作中 → 運送中 → 已完成

#### Scenario: 中國廠商路徑
- **WHEN** 生產任務由中國廠商執行
- **THEN** 狀態路徑：待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 生產任務狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 生產任務作廢（未進入生產）

- **WHEN** 生管在生產任務尚未進入「製作中」時取消
- **THEN** 狀態轉為「已作廢」（無成本）

#### Scenario: 生產任務報廢（已進入生產）
- **WHEN** 已進入「製作中」的生產任務被取消
- **THEN** 狀態轉為「報廢」，費用以報工數計算

### Requirement: 師傅自助報工

系統 SHALL 支援師傅透過任務平台直接回報完成數量，取代生管代為報工的流程。

#### Scenario: 師傅首次報工觸發製作中

- **WHEN** 師傅在任務平台為「待處理」狀態（已指派師傅）的生產任務提交首次報工
- **THEN** 系統 SHALL 記錄報工數量至 ProductionTaskWorkRecord
- **AND** 生產任務狀態 SHALL 從「待處理」變為「製作中」
- **AND** reported_by SHALL 記錄為該師傅

#### Scenario: 師傅後續報工累加數量

- **WHEN** 師傅為「製作中」狀態的生產任務提交報工
- **THEN** 系統 SHALL 累加報工數量至 pt_produced_qty
- **AND** 報工數量加總 MUST NOT 超過 pt_target_qty

#### Scenario: 師傅僅可查看自身任務

- **WHEN** 師傅登入任務平台
- **THEN** 系統 SHALL 僅顯示 assigned_operator 為該師傅的生產任務
- **AND** 系統 MUST NOT 顯示其他師傅的任務

### Requirement: 供應商自助報工

系統 SHALL 支援外包廠商與中國廠商透過供應商平台直接回報生產進度。

#### Scenario: 供應商回報完成數量

- **WHEN** 供應商在供應商平台為「製作中」狀態的生產任務提交報工
- **THEN** 系統 SHALL 記錄報工數量至 ProductionTaskWorkRecord
- **AND** reported_by SHALL 記錄為該供應商操作員

#### Scenario: 供應商標記製作完成

- **WHEN** 供應商在供應商平台將生產任務標記為「製作完畢」
- **THEN** 外包廠路徑：生產任務狀態 SHALL 從「製作中」變為「運送中」
- **AND** 中國廠商路徑：生產任務狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 供應商僅可查看分派給該廠商的任務

- **WHEN** 供應商登入供應商平台
- **THEN** 系統 SHALL 僅顯示 assigned_factory 為該供應商的生產任務
- **AND** 系統 MUST NOT 顯示其他供應商的任務

### Requirement: 供應商報價

系統 SHALL 支援供應商針對被分派的生產任務提交報價。

#### Scenario: 供應商提交報價

- **WHEN** 供應商查看被分派的生產任務後填寫單價報價
- **THEN** 系統 SHALL 記錄 unit_price_quoted、quoted_at、quoted_by
- **AND** 生管 SHALL 收到報價通知

#### Scenario: 供應商修改報價

- **WHEN** 供應商在報價尚未被確認前修改報價
- **THEN** 系統 SHALL 更新 unit_price_quoted 與 quoted_at
- **AND** 生管 SHALL 收到報價更新通知

#### Scenario: 報價已確認後不可修改

- **WHEN** 生管已確認某筆報價
- **THEN** 供應商 MUST NOT 修改該筆報價
- **AND** 若需調整，須由生管退回後重新報價

### Requirement: 生管確認報價

系統 SHALL 支援生管審核供應商提交的報價。

#### Scenario: 生管確認報價

- **WHEN** 生管在日程面板或任務詳情查看供應商報價後確認
- **THEN** 系統 SHALL 記錄 price_confirmed_by 與 price_confirmed_at
- **AND** 報價狀態 SHALL 變為「已確認」

#### Scenario: 生管退回報價

- **WHEN** 生管認為報價不合理，退回並填寫退回原因
- **THEN** 系統 SHALL 將報價狀態改為「已退回」
- **AND** 供應商 SHALL 收到退回通知與退回原因
- **AND** 供應商可重新提交報價

### Requirement: 師傅任務平台今日視圖

系統 SHALL 為師傅提供以日為單位的任務清單，顯示今日需執行的生產任務。

#### Scenario: 師傅查看今日任務

- **WHEN** 師傅登入任務平台
- **THEN** 系統 SHALL 顯示以下任務：assigned_operator 為該師傅且（actual_start_date 為今日或狀態為「製作中」）的生產任務
- **AND** 每筆任務 MUST 顯示：工序名稱、工單編號、目標數量、已完成數量、狀態

#### Scenario: 師傅查看明日預覽

- **WHEN** 師傅切換至「明日」標籤
- **THEN** 系統 SHALL 顯示 actual_start_date 為明日的生產任務（唯讀，不可報工）

### Requirement: 生管代替報工
系統 SHALL 支援生管代替師傅記錄 completed_quantity（報工數量）。生管代報與師傅自助報工並存，兩者皆可觸發狀態轉換。

#### Scenario: 生管記錄報工數量
- **WHEN** 師傅口頭告知完成數量，生管在系統記錄
- **THEN** 系統更新 completed_quantity，觸發上層工單完成度重算

#### Scenario: 師傅已自行報工後生管不重複記錄
- **WHEN** 師傅已透過任務平台回報完成數量
- **THEN** 生管在日程面板可查看該筆報工紀錄（唯讀）
- **AND** 生管仍可為同一任務新增報工紀錄（如師傅漏報的部分）

### Requirement: 狀態向上傳遞
系統 SHALL 在生產任務狀態變更時自動向上傳遞：生產任務 -> 任務 -> 工單 -> 印件 -> 訂單。

#### Scenario: 生產任務進入製作中
- **WHEN** 任一生產任務進入「製作中」
- **THEN** 對應任務、工單、印件、訂單狀態自動向上傳遞為「製作中」/「生產中」

### Requirement: 生產進度追蹤與工單完成度
系統 SHALL 支援印務在工單詳情頁查看各生產任務的製作進度與報工數量，工單完成度由系統自動計算。

#### Scenario: US-PT-001 追蹤與管理生產任務
- **WHEN** 印務在工單詳情頁查看各生產任務的製作進度與報工數量
- **THEN** 系統 SHALL 顯示各任務的累計 QC 入庫數量與缺口；工單完成度 MUST 由系統自動計算，印務能即時透過系統看到各生產任務進度

### Requirement: 任務異動管理
系統 SHALL 支援 QC 不通過或製程調整時，印務發起異動。生管確認異動內容後補建新生產任務。

#### Scenario: QC 不通過補建生產任務
- **WHEN** QC 不通過，印務發起任務異動
- **THEN** 任務狀態轉為「異動」，生管確認後補建新生產任務，任務返回「製作中」

#### Scenario: US-PT-001 QC 不通過補建生產任務流程
- **WHEN** QC 不通過需補建生產，印務在原任務下新增生產任務
- **THEN** 系統 SHALL 將該任務從「製作中」轉為「異動」；生管確認異動內容後，系統 MUST 將任務返回「製作中」

### Requirement: 異動期間生產任務行為

系統 SHALL 定義工單異動期間各狀態生產任務的處理規則。異動 MUST NOT 阻擋已在執行中的生產任務。

#### Scenario: 製作中的生產任務不受異動影響

- **WHEN** 工單進入「異動」狀態，且某生產任務狀態為「製作中」
- **THEN** 該生產任務 SHALL 繼續執行
- **AND** 師傅與供應商 SHALL 可繼續報工
- **AND** 報工數據 SHALL 持續納入完成度計算

#### Scenario: 待處理的生產任務維持可分派

- **WHEN** 工單進入「異動」狀態，且某生產任務狀態為「待處理」
- **THEN** 該生產任務 SHALL 維持「待處理」狀態
- **AND** 生管 SHALL 可繼續分派該任務給師傅

#### Scenario: 異動中新增生產任務

- **WHEN** 印務在異動編輯介面新增生產任務並送出
- **THEN** 新增的生產任務 SHALL 建立為「待處理」狀態
- **AND** 生管確認後即可指派師傅
- **AND** 師傅首次報工後觸發「製作中」

#### Scenario: 異動中作廢待處理的生產任務

- **WHEN** 印務在異動中將「待處理」狀態的生產任務標記為作廢
- **THEN** 生產任務狀態 SHALL 變為「已作廢」
- **AND** 該任務 MUST NOT 計入成本（因尚未實際生產）

#### Scenario: 異動中報廢製作中的生產任務

- **WHEN** 印務在異動中將「製作中」狀態的生產任務標記為報廢
- **THEN** 生產任務狀態 SHALL 變為「報廢」
- **AND** 費用 SHALL 以報工數量計算

### Requirement: 供應商平台異動呈現

系統 SHALL 在供應商平台正確呈現因異動而狀態變更的生產任務。供應商 MUST NOT 看到工單層的異動狀態，僅看到生產任務自身的狀態變化。

#### Scenario: 已分派的待處理任務被作廢

- **WHEN** 已分派給外包廠的「待處理」生產任務因異動被作廢
- **THEN** 供應商平台 SHALL 將該任務從待處理清單移除
- **AND** 系統 SHALL 向供應商發送通知「任務 XX 已取消」

#### Scenario: 已開工的任務被報廢

- **WHEN** 已分派給外包廠且狀態為「製作中」的生產任務因異動被報廢
- **THEN** 供應商平台 SHALL 將該任務移至「已結束」分類
- **AND** 任務 SHALL 標記「報廢」，供應商可查看但 MUST NOT 操作

#### Scenario: 異動中新增任務分派到外包廠

- **WHEN** 異動中新增的生產任務被分派到外包廠
- **THEN** 供應商平台 SHALL 以正常分派流程呈現，任務出現在「待處理」清單
- **AND** 呈現方式 SHALL 與一般分派無差異

### Requirement: 任務層 Bottom-up 作廢
系統 SHALL 在任務內所有生產任務均達終態且至少一筆已作廢時，自動標記任務為已作廢。

#### Scenario: 所有生產任務達終態觸發任務作廢
- **WHEN** 任務內所有生產任務均為終態（已完成/已作廢/報廢），且至少一筆已作廢
- **THEN** 系統自動將任務狀態標記為「已作廢」

### Requirement: 生管日程執行面板

系統 SHALL 提供生管專用的日程執行面板，僅顯示自有工廠的生產任務。面板以日期為主軸，分為四個功能區：

1. **待分派區**：已交付且預計開工日期為當天或更早（或被標記為提前分派）的生產任務，依工序 × 生產任務內容分組。逾期超過 3 天的任務 SHALL 以紅色標籤標記。排序規則：交貨日期 > 開工日期 > 建立時間
2. **進行中區**：已指派師傅的生產任務，依師傅分組。區分兩種視覺狀態：「已指派未開工」（assigned_operator 有值但狀態仍為待處理，灰色）與「製作中」（狀態為製作中，藍色）
3. **即將到來區**：預計開工日期在明天及之後的已交付生產任務
4. **異動確認區**：需要生管確認的異動項目，區分工單層異動與任務層異動

每筆生產任務 SHALL 顯示生產任務細節（工序相關的 A/B/C 群組關鍵欄位：紙材、印刷色數、加工方式等），讓生管知道該任務實際要做什麼。

#### Scenario: 生管查看今日待分派任務

- **WHEN** 生管開啟日程執行面板
- **THEN** 系統 SHALL 在待分派區顯示所有已交付且（預計開工日期 <= 今天 或 is_early_dispatched = true）的自有工廠生產任務
- **AND** 生產任務 SHALL 依工序 × 生產任務內容分組呈現，排序依交貨日期優先
- **AND** 每筆生產任務 MUST 顯示：任務編號、所屬工單、印件名稱、目標數量、生產任務細節（紙材/印刷色數/加工方式等）
- **AND** 逾期超過 3 天的任務 MUST 以紅色標籤標記

#### Scenario: 生管查看即將到來的任務

- **WHEN** 生管在日程面板查看即將到來區
- **THEN** 系統 SHALL 顯示預計開工日期在明天及之後且 is_early_dispatched = false 的已交付生產任務
- **AND** 生管 SHALL 可將即將到來的任務提前拉入待分派區

#### Scenario: 生管查看工單層異動

- **WHEN** 有工單處於「異動」狀態且需要生管確認
- **THEN** 系統 SHALL 在異動確認區以「工單異動」標籤顯示，包含異動原因與變更內容
- **AND** 生管 SHALL 可執行確認操作，確認後工單返回「製作中」
- **AND** 工單異動期間，未受影響的生產任務 SHALL 繼續執行，工單不停擺

#### Scenario: 生管查看任務層異動

- **WHEN** 有任務處於「異動」狀態且需要生管確認
- **THEN** 系統 SHALL 在異動確認區以「任務異動」標籤顯示，包含新增/作廢的生產任務清單
- **AND** 生管確認後任務 SHALL 進入「已確認異動內容」中間態，再回到正常流程

#### Scenario: 異動影響已指派但未開工的任務

- **WHEN** 異動涉及已指派師傅但尚未開工的生產任務（assigned_operator 有值，狀態為待處理）
- **THEN** 系統 SHALL 自動將受影響的生產任務回收至待分派區
- **AND** 系統 SHALL 清除其 assigned_operator 並通知生管重新分派

#### Scenario: 異動影響製作中的任務

- **WHEN** 異動涉及狀態為「製作中」的生產任務
- **THEN** 系統 SHALL 在異動確認區標示「進行中受影響」警示
- **AND** 生管 MUST 手動決定暫停或繼續，系統 SHALL 記錄生管的處理決定
- **AND** 未受影響的生產任務 SHALL 繼續執行，不因異動而停擺

### Requirement: 合批分派操作

系統 SHALL 支援生管在待分派區勾選多筆同工序的生產任務，合批指派給同一師傅。

合批分派為 UX 操作行為（勾選 → 指派），不需在資料層建立持久的批次記錄。

分派完成後，系統 SHALL 記錄指派的師傅（assigned_operator）與實際開工日期（actual_start_date）。生產任務狀態維持「待處理」不變，直到首次報工。

分派前置條件：生產任務所屬任務（Task）的 status MUST 為「已交付」或「製作中」，且 assigned_operator MUST 為空。

#### Scenario: 生管合批指派生產任務給師傅

- **WHEN** 生管在待分派區勾選同工序的 3 筆印刷生產任務，選擇指派給師傅A
- **THEN** 系統 SHALL 將 3 筆生產任務的 assigned_operator 設定為師傅A
- **AND** 系統 SHALL 記錄 actual_start_date 為當天日期
- **AND** 3 筆生產任務 SHALL 移入「進行中區」的師傅A 分組下，顯示為「已指派未開工」灰色視覺狀態

#### Scenario: 生管跨工單合批

- **WHEN** 待分派區有來自不同工單但同工序的生產任務
- **THEN** 系統 SHALL 允許跨工單勾選並合批指派給同一師傅

#### Scenario: 因 QC 不通過補建的生產任務在待分派區標記

- **WHEN** 因 QC 不通過而補建的生產任務出現在待分派區
- **THEN** 系統 SHALL 以「補單」標籤標記該生產任務，與一般新建任務視覺區分

### Requirement: 師傅指派歸屬

生產任務的師傅指派 SHALL 由生管決定，非印務。系統 SHALL 在 ProductionTask 新增 assigned_operator 欄位，僅生管角色可編輯。

印務在派工板排程時 MUST NOT 設定師傅指派，僅設定設備與開工日期。

#### Scenario: 印務排程時無法指定師傅

- **WHEN** 印務在派工板為生產任務設定排程
- **THEN** 系統 SHALL 提供設備與開工日期欄位供編輯
- **AND** MUST NOT 顯示師傅指派欄位

#### Scenario: 生管分派時指定師傅

- **WHEN** 生管在日程面板分派生產任務
- **THEN** 系統 SHALL 提供師傅選擇下拉，可選擇該工序對應的師傅清單
- **AND** 選擇後 SHALL 記錄於 assigned_operator 欄位

### Requirement: 設備覆蓋機制

系統 SHALL 支援生管覆蓋印務在排程時設定的設備。印務排程時設定的設備為「建議值」（planned_equipment），生管分派時可變更為「實際值」（actual_equipment）。

設備覆蓋後，系統 SHALL 提示生管確認完工日期是否需要調整（不同設備可能有不同工期）。設備覆蓋操作 SHALL 在派工板上以「設備已覆蓋」標記通知原排程印務。

#### Scenario: 生管變更設備

- **WHEN** 生管在分派生產任務時，發現原排程設備（大台）已滿載，決定改用「小台」
- **THEN** 系統 SHALL 允許生管變更設備為「小台」
- **AND** 系統 SHALL 記錄 actual_equipment = 小台（原 planned_equipment = 大台 保留）
- **AND** 系統 SHALL 提示「設備已變更，預估工期可能不同，是否調整完工日期？」

#### Scenario: 未覆蓋時實際設備等於計畫設備

- **WHEN** 生管分派生產任務時未變更設備
- **THEN** actual_equipment SHALL 預設等於 planned_equipment

#### Scenario: 設備覆蓋通知印務

- **WHEN** 生管覆蓋了某生產任務的設備
- **THEN** 派工板 SHALL 在該生產任務旁顯示「設備已由生管覆蓋：大台→小台」標記
- **AND** 原排程印務 SHALL 可在派工板看到此標記

### Requirement: 批次報工操作

系統 SHALL 支援生管在進行中區勾選同一師傅的多筆生產任務，批次填寫報工數量。

批次報工 SHALL 為每筆被勾選的生產任務各建立一筆 ProductionTaskWorkRecord。

#### Scenario: 生管為師傅批次報工

- **WHEN** 生管在進行中區勾選師傅A 的 3 筆生產任務，點擊「批次報工」
- **THEN** 系統 SHALL 顯示報工表單，每筆生產任務各有獨立的報工數量輸入欄位
- **AND** 提交後 SHALL 為每筆生產任務各建立一筆 ProductionTaskWorkRecord
- **AND** 各生產任務的 pt_produced_qty SHALL 累加對應的報工數量

#### Scenario: 生管單筆報工

- **WHEN** 生管在進行中區點擊某生產任務的「+報工」按鈕
- **THEN** 系統 SHALL 顯示單筆報工表單，包含報工數量、報工工時（選填）、缺陷數量（選填）、備註（選填）

#### Scenario: 首次報工觸發狀態從待處理轉為製作中

- **WHEN** 生管為「待處理」且已指派師傅的生產任務提交首次報工
- **THEN** 該生產任務狀態 SHALL 自動從「待處理」轉為「製作中」
- **AND** 進行中區的視覺狀態 SHALL 從灰色（已指派未開工）變為藍色（製作中）

### Requirement: 提前分派

系統 SHALL 支援生管將即將到來區的生產任務提前拉入待分派區。提前分派 SHALL 將 is_early_dispatched 標記為 true，保留原 scheduled_date 不修改。

#### Scenario: 生管提前分派明日任務

- **WHEN** 生管在即將到來區點擊某筆預計明天開工的生產任務的「提前分派」
- **THEN** 系統 SHALL 將該生產任務的 is_early_dispatched 設為 true
- **AND** 該生產任務 SHALL 移入待分派區，可被勾選並指派給師傅
- **AND** 原排程日期（scheduled_date）MUST NOT 被修改

#### Scenario: 重新整理頁面後提前分派的任務仍在待分派區

- **WHEN** 生管提前分派某任務後重新整理頁面
- **THEN** 該任務 SHALL 仍顯示在待分派區（因 is_early_dispatched = true）
- **AND** MUST NOT 回到即將到來區

### Requirement: 工序相依性管理
系統 SHALL 支援手動 + UI 排序方式管理工序相依性。生管手動決定後置任務啟動時機。

#### Scenario: 生管管理工序順序
- **WHEN** 生管查看多工序場景的生產任務
- **THEN** 系統提供相依標記介面，生管可手動排序並決定後置任務啟動時機

### Requirement: 重新排程
系統 SHALL 支援已交付後的重新排程，印務可在任何時間調整設備或日期，不受狀態機限制。

#### Scenario: 印務調整已交付任務的排程
- **WHEN** 印務調整已交付或製作中生產任務的設備或開工日期
- **THEN** 系統更新排程資訊，不影響生產任務狀態轉換

### Requirement: 自動派工建議（Phase 2）
系統 SHALL 提供自動派工功能，依據交貨日期與工序耗時計算最早開工日期並產生建議，供印務主管審核。

#### Scenario: US-WO-016 使用自動派工建議
- **WHEN** 印務主管點擊「自動派工」
- **THEN** 系統 SHALL 計算最早開工日期並明確顯示建議的開工日期；印務主管 MUST 可選擇接受或拒絕該建議

### Requirement: 拼版試算工具

系統 SHALL 在新增生產任務抽屜右側提供可收合的拼版試算面板，作為印務安排印刷工序時的輔助計算工具。試算結果不自動寫入生產任務欄位，由印務自行參考填入。

輸入欄位：母版尺寸（下拉選單，含常見規格與「自訂」選項；選擇常見規格時自動帶入 W×H，選擇「自訂」時開放輸入母版寬度與高度）、成品寬度（mm）、成品高度（mm）、出血（mm）、咬口（mm）。

計算結果：拼法（N 模，列×行）、需要印張數、紙張利用率（%）。計算邏輯考慮出血、咬口，並比較橫拼與直拼取最大模數。

#### Scenario: 印務使用拼版試算（常見規格）

- **WHEN** 印務在新增生產任務抽屜中點擊「拼版試算」展開右側面板
- **AND** 選擇母版尺寸「菊全」（自動帶入 636×939mm）、成品尺寸 210×297mm、出血 3mm、咬口 10mm
- **THEN** 系統即時計算並顯示：拼法 8 模（2×4，旋轉）、需要印張 375 張（以 3000 份為例）、紙張利用率 88%
- **AND** 印務可依據結果手動填入印刷生產任務的數量欄位（375 張）

#### Scenario: 印務使用自訂紙張尺寸

- **WHEN** 印務在母版尺寸下拉選擇「自訂」
- **THEN** 系統 SHALL 顯示母版寬度與高度輸入框（mm）
- **AND** 印務輸入自訂尺寸後，系統即時計算拼版結果
- **AND** 從「自訂」切回常見規格時，隱藏自訂輸入框並恢復預設尺寸

---

## Data Model

來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### Task

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工單 | work_order_id | FK | Y | Y | FK -> 工單 |
| 工序 | process_id | FK | Y | | FK -> 工序 |
| 工廠類別 | factory_type | 單選 | Y | | 自有工廠 / 加工廠 / 外包廠 |
| 指派工廠 | assigned_factory | 字串 | Y | | 指派的執行工廠 |
| 任務狀態 | status | 單選 | Y | | 依狀態機定義 |
| 目標數量 | task_target_qty | 整數 | Y | | |
| 預計執行日 | scheduled_date | 日期 | Y | | |
| 合批群組 ID | batch_group_id | 字串 | | | 合批群組 ID（待 XM-003） |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### ProductionTask

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 任務 | task_id | FK | Y | Y | FK -> 任務 |
| 工序 | process_id | FK | Y | Y | FK -> 工序 |
| 工廠類別 | factory_type | 單選 | Y | | 自有工廠 / 加工廠 / 外包廠 |
| 生產任務狀態 | status | 單選 | Y | | 依狀態機定義 |
| 目標數量 | pt_target_qty | 整數 | Y | | |
| 每份工單需生產數量 | quantity_per_work_order | 小數 | Y | | 每份工單需生產數量（> 0） |
| 是否影響成品 | affects_product | 布林值 | Y | | 預設 TRUE |
| 計畫設備 | planned_equipment | 字串 | | | 印務排程時設定（原 equipment） |
| 實際設備 | actual_equipment | 字串 | | | 生管分派時可覆蓋，預設 = planned_equipment |
| 所屬工作包 | work_package_id | FK | | | FK -> WorkPackage；派工後必填，未派工時為 null |
| 指派師傅 | assigned_operator | FK | | | 生管指派的師傅（FK → 使用者），僅生管可編輯 |
| 提前分派 | is_early_dispatched | 布林值 | Y | | 預設 false，生管提前拉入時設為 true |
| 預計執行日 | scheduled_date | 日期 | Y | | |
| 實際開工日 | actual_start_date | 日期 | | | 生管分派時自動填入當天日期 |
| 生產數量 | pt_produced_qty | 整數 | Y | Y | 報工累計 |
| 供應商報價單價 | unit_price_quoted | 小數 | | | 供應商提交的單價 |
| 報價時間 | quoted_at | 日期時間 | | | 供應商提交報價的時間 |
| 報價人 | quoted_by | FK | | | FK -> 使用者（供應商操作員） |
| 報價狀態 | quote_status | 單選 | | | 待報價 / 已報價 / 已確認 / 已退回 |
| 報價確認人 | price_confirmed_by | FK | | | FK -> 使用者（生管） |
| 報價確認時間 | price_confirmed_at | 日期時間 | | | |
| 退回原因 | quote_reject_reason | 文字 | | | 生管退回時填寫 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### ProductionTaskWorkRecord

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 生產任務 | production_task_id | FK | Y | | FK -> 生產任務 |
| 工序 | process_id | FK | Y | Y | FK -> 工序 |
| 報工人員 | reported_by | FK | Y | Y | 報工人員 |
| 報工數量 | reported_quantity | 整數 | Y | | |
| 報工時間 | reported_at | 日期時間 | Y | Y | |
| 報工工時 | reported_minutes | 整數 | | | 報工工時（分鐘） |
| 缺陷數量 | defect_count | 整數 | | | |
| 報工備註 | notes | 文字 | | | |

**A 群組（選填）-- 紙材相關**

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 紙材 | material_type_a | 字串 | | | |
| 紙大 | paper_size_a | 字串 | | | |
| 印刷色數 | print_colors_a | 字串 | | | |
| 印刷數量 | print_quantity_a | 整數 | | | |
| 損耗數量 | waste_quantity_a | 整數 | | | |
| 成本 | cost_a | 小數 | | | |

**B 群組（選填）-- 印刷相關**

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 印刷尺寸 | print_size_b | 字串 | | | |
| 印刷台數 | print_units_b | 整數 | | | |
| 印刷數量 | print_quantity_b | 整數 | | | |
| 損耗數量 | waste_quantity_b | 整數 | | | |
| 成本 | cost_b | 小數 | | | |

**C 群組（選填）-- 加工相關**

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 刀模編號 | die_cut_no_c | 字串 | | | |
| 刀模新舊 | die_cut_status_c | 字串 | | | |
| 加工數量 | process_quantity_c | 整數 | | | |
| 加工模數 | module_count_c | 整數 | | | |
| 成本 | cost_c | 小數 | | | |

---

## 任務（Task）層狀態機摘要

任務為生產任務的分組層，依工廠類別自動分組。狀態：待交付 -> 已交付 -> 製作中 -> 已完成/已作廢。可逆狀態：異動、已確認異動內容。

---

## Phase 2 預留功能

- 自動排程演算（依交貨日期反推最早開工日期）-- 見 Requirement: 自動派工建議（Phase 2）
- 生產效率 Dashboard
- 急單插入排程
- 外包廠/中廠完整狀態追蹤介面
