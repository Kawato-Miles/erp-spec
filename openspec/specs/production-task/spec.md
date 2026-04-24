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
系統 SHALL 依工序決定工廠（唯讀），印務選擇執行設備（若工序需要）。建立生產任務時，系統 SHALL 依所屬工單的 region 篩選可用的 factory_type：台灣工單僅可選自有工廠/加工廠/外包廠，中國工單僅可選中國廠商。

#### Scenario: 印務為生產任務選擇設備
- **WHEN** 印務在派工板為生產任務設定執行設備
- **THEN** 系統顯示該工序對應工廠（唯讀），印務可從該工廠的設備清單選擇

#### Scenario: 工序不需要設備
- **WHEN** 某工序不需要指定設備
- **THEN** 系統允許跳過設備選擇，僅記錄工廠

#### Scenario: US-WO-014 為生產任務選擇設備
- **WHEN** 印務主管選擇待派工任務並檢查工序是否需要設備
- **THEN** 若工序需要設備，系統 SHALL 顯示該工廠可用設備列表供選擇並確認保存；若工序不需要設備，系統 MUST 隱藏設備欄位

#### Scenario: 台灣工單的工廠篩選

- **WHEN** 印務為台灣工單（region = 台灣）新增生產任務並選擇工序
- **THEN** 系統 SHALL 僅顯示 factory_type 為自有工廠、加工廠、外包廠的工廠選項
- **AND** 中國廠商 MUST NOT 出現在可選清單中

#### Scenario: 中國工單的工廠篩選

- **WHEN** 印務為中國工單（region = 中國）新增生產任務並選擇工序
- **THEN** 系統 SHALL 僅顯示 factory_type 為中國廠商的工廠選項
- **AND** 自有工廠、加工廠、外包廠 MUST NOT 出現在可選清單中

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

系統 SHALL 讓生管查看已交付任務清單，並透過日程面板的「建立工作包」操作完成派工。原有的批次派工操作由建立工作包取代。

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

系統 SHALL 提供生管專用的日程執行面板，僅顯示自有工廠的生產任務。面板以日期為主軸，分為四個功能區，並提供產線篩選器：

1. **待分派區**：已交付且預計開工日期為當天或更早（或被標記為提前分派）的生產任務，依工序 × 生產任務內容分組。逾期超過 3 天的任務 SHALL 以紅色標籤標記。排序規則：交貨日期 > 開工日期 > 建立時間
2. **進行中區**：已指派師傅的生產任務，依師傅分組。區分兩種視覺狀態：「已指派未開工」（assigned_operator 有值但狀態仍為待處理，灰色）與「製作中」（狀態為製作中，藍色）
3. **即將到來區**：預計開工日期在明天及之後的已交付生產任務
4. **異動確認區**：需要生管確認的異動項目，區分工單層異動與任務層異動

面板 SHALL 提供產線篩選器，生管可選擇特定產線僅顯示該產線的任務。篩選器 SHALL 記住生管上次選擇的產線偏好（使用者端持久化），下次開啟時自動套用。

每筆生產任務 SHALL 顯示生產任務細節（依工序 category 顯示對應的關鍵欄位，如：紙材、印刷色數、加工方式等），讓生管知道該任務實際要做什麼。

#### Scenario: 生管查看今日待分派任務

- **WHEN** 生管開啟日程執行面板
- **THEN** 系統 SHALL 自動套用上次選擇的產線篩選（若有）
- **AND** 系統 SHALL 在待分派區顯示所有已交付且（預計開工日期 <= 今天 或 is_early_dispatched = true）的自有工廠生產任務
- **AND** 生產任務 SHALL 依工序 × 生產任務內容分組呈現，排序依交貨日期優先
- **AND** 每筆生產任務 MUST 顯示：任務編號、所屬工單、印件名稱、目標數量、生產任務細節（紙材/印刷色數/加工方式等）
- **AND** 逾期超過 3 天的任務 MUST 以紅色標籤標記

#### Scenario: 生管依產線篩選任務

- **WHEN** 生管在日程面板使用產線篩選器選擇「產線 A」
- **THEN** 系統 SHALL 在所有功能區（待分派、進行中、即將到來、異動確認）僅顯示 production_line_id 為「產線 A」的任務
- **AND** 系統 SHALL 記住此選擇，下次開啟自動套用
- **AND** 生管 SHALL 可清除篩選以查看所有產線的任務

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

### Requirement: 產線管理

系統 SHALL 支援產線（ProductionLine）作為生管分工單位。每筆生產任務 MUST 有所屬產線（production_line_id 為必填），由 BOM 行項目帶入，帶入後唯讀不可修改。生管日程面板 SHALL 提供產線篩選，並記住生管上次選擇的產線偏好。

#### Scenario: BOM 展開時自動帶入產線

- **WHEN** 系統依 BOM 建立生產任務
- **THEN** 系統 SHALL 從 BOM 行項目的 production_line_id 自動帶入至生產任務的 production_line_id
- **AND** production_line_id MUST 為必填，不允許為空
- **AND** 帶入後 production_line_id SHALL 為唯讀，印務和生管均不可修改

#### Scenario: 外包廠任務自動歸入外包廠產線

- **WHEN** BOM 行項目的 factory_type 為「外包廠」
- **THEN** 系統 SHALL 自動將 production_line_id 設為「外包廠」產線

#### Scenario: 中國廠商任務自動歸入中國廠商產線

- **WHEN** BOM 行項目的 factory_type 為「中國廠商」
- **THEN** 系統 SHALL 自動將 production_line_id 設為「中國廠商」產線

#### Scenario: 生管篩選產線任務

- **WHEN** 生管在日程執行面板選擇產線篩選器，選擇「產線 A」
- **THEN** 系統 SHALL 僅顯示 production_line_id 對應「產線 A」的生產任務
- **AND** 其他產線的任務 SHALL 被隱藏

#### Scenario: 篩選器記住上次選擇

- **WHEN** 生管選擇產線「產線 A」後關閉日程面板
- **AND** 生管再次開啟日程面板
- **THEN** 系統 SHALL 自動套用上次選擇的「產線 A」篩選條件
- **AND** 生管 SHALL 可隨時切換或清除篩選

#### Scenario: 印務不可手動指定產線

- **WHEN** 印務在工單詳情頁查看生產任務
- **THEN** production_line_id SHALL 顯示為唯讀欄位（由 BOM 帶入）
- **AND** 系統 SHALL 不提供產線下拉選單供手動修改

### Requirement: 生產任務分類排序

系統 SHALL 支援生產任務依 BOM 分類（衍生自 `bom_type`）分組顯示，並支援分類內拖曳排序。排序順序記錄在 sort_order 欄位。分類與 `bom_type` 對應：`material` → 材料；`process` → 工序；`binding` → 裝訂。`processCategory` 欄位保留為唯讀衍生欄位，由 `bom_type` 推導，不可直接寫入。

#### Scenario: 印務查看分類排序的生產任務

- **WHEN** 印務在工單詳情頁查看生產任務清單
- **THEN** 系統 SHALL 依 `bom_type` 衍生的分類分為三組：材料、工序、裝訂
- **AND** 各組內的生產任務 SHALL 依 sort_order 升冪排列
- **AND** 三組的顯示順序固定為：材料 → 工序 → 裝訂

#### Scenario: 印務拖曳排序生產任務

- **WHEN** 印務在工單詳情頁拖曳某生產任務至同分類內的新位置
- **THEN** 系統 SHALL 更新該分類內所有受影響生產任務的 sort_order
- **AND** 拖曳 MUST 限制在同一 `bom_type` 對應的分類內，不可跨分類

#### Scenario: 新增生產任務時自動設定 sort_order

- **WHEN** 印務新增一筆生產任務，設定 bom_type = process
- **THEN** 系統 SHALL 將新任務的 sort_order 設為「工序」分類內現有最大值 + 1
- **AND** 新任務 SHALL 出現在「工序」分類的最後一筆

#### Scenario: processCategory 為唯讀衍生欄位

- **WHEN** 任何操作試圖直接寫入 `processCategory`
- **THEN** 系統 MUST 阻擋該寫入
- **AND** `processCategory` 值 SHALL 由 `bom_type` 依上述對應自動推導

### Requirement: 生產任務詳情顯示稿件

系統 SHALL 在生產任務詳情頁顯示所屬印件的稿件檔案列表與成品縮圖。稿件資料引用自 PrintItem，不在生產任務層獨立維護。

#### Scenario: 生管查看生產任務的稿件

- **WHEN** 生管在生產任務詳情頁查看稿件區塊
- **THEN** 系統 SHALL 顯示該生產任務所屬印件的稿件檔案列表
- **AND** 系統 SHALL 顯示印件的成品縮圖（thumbnail_url）
- **AND** 最終版稿件（is_final = true）SHALL 以醒目標記顯示

### Requirement: 設備預計成本計算

系統 SHALL 將設備預計成本（`estimated_equipment_cost`）計為設備的開機費（`setup_fee`）。色數相關的加價（單黑、CMYK、Pantone 倍率、金/銀/白/螢光倍率、最低色數倍率）已拆出為 `estimated_color_cost`（詳見 Requirement「色數加價計算」），歸屬工序本身，不再併入 `estimated_equipment_cost`。任何影響因子（`setup_fee`、設備）變動時，系統 SHALL 即時重算。

計算公式：

```
estimated_equipment_cost = 設備.setup_fee ?? 0
```

#### Scenario: 設備有開機費

- **WHEN** 印務為生產任務選擇設備，該設備 `setup_fee = 3000`
- **THEN** `estimated_equipment_cost` SHALL = 3000

#### Scenario: 設備無開機費

- **WHEN** 設備的 `setup_fee` 為 null
- **THEN** `estimated_equipment_cost` SHALL = 0

#### Scenario: 設備未指定

- **WHEN** 生產任務尚未設定設備（`planned_equipment` 為 null）
- **THEN** `estimated_equipment_cost` MUST NOT 計算，UI 顯示為「待排程」

#### Scenario: 色數不再影響設備預計成本

- **WHEN** 印務修改色數選項（front/back/特殊色）
- **THEN** `estimated_equipment_cost` MUST NOT 受影響
- **AND** 色數變動僅影響 `estimated_color_cost`

### Requirement: 顏色倍率自動帶入

系統 SHALL 在印務選擇設備後，自動從設備主檔帶入金/銀/白/螢光倍率（color_metallic_multiplier）和單金/銀/白/螢光色最低色數倍率（color_metallic_min_multiplier）的預設值。印務可覆寫帶入的預設值。

#### Scenario: 選擇設備後自動帶入倍率

- **WHEN** 印務為生產任務選擇設備，該設備主檔的金/銀/白/螢光預設倍率為 1.5、最低色數預設倍率為 2
- **THEN** 系統 SHALL 自動帶入 color_metallic_multiplier = 1.5、color_metallic_min_multiplier = 2
- **AND** 印務可手動修改帶入的倍率值

#### Scenario: 變更設備後重新帶入倍率

- **WHEN** 印務變更生產任務的設備（從設備 A 改為設備 B）
- **THEN** 系統 SHALL 以設備 B 的預設倍率覆蓋現有值
- **AND** 系統 SHALL 提示「設備已變更，倍率已更新為新設備預設值」

---

### Requirement: BOM 多形引用

系統 SHALL 支援生產任務多形引用三個 BOM master（material-master / process-master / binding-master）。每筆生產任務以 `bom_type` 欄位決定引用的 master 類型，並以三個互斥 FK 欄位（`material_spec_id` / `process_id` / `binding_id`）指向對應的 master 記錄；其中恰好一個 FK 有值，其餘 MUST 為 null。

#### Scenario: 生產任務引用材料規格

- **WHEN** 印務為生產任務選擇材料類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = material`，`material_spec_id` 指向 material-master 的 MaterialSpec
- **AND** `process_id` 與 `binding_id` MUST 為 null

#### Scenario: 生產任務引用工序

- **WHEN** 印務為生產任務選擇工序類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = process`，`process_id` 指向 process-master 的 Process
- **AND** `material_spec_id` 與 `binding_id` MUST 為 null

#### Scenario: 生產任務引用裝訂

- **WHEN** 印務為生產任務選擇裝訂類型的 BOM 項目
- **THEN** 系統 SHALL 設定 `bom_type = binding`，`binding_id` 指向 binding-master 的 Binding
- **AND** `material_spec_id` 與 `process_id` MUST 為 null

#### Scenario: 互斥 FK 約束違反時阻擋

- **WHEN** 任何操作試圖設定多於一個 BOM FK 欄位，或在 `bom_type` 有值時對應 FK 為 null
- **THEN** 系統 MUST 阻擋該操作並回報資料一致性錯誤

### Requirement: pricing_selection 混合帶入

系統 SHALL 於生產任務 Data Model 提供 `pricing_selection`、`pricing_selection_default`、`pricing_selection_overridden` 三個欄位。pricing_selection 的 JSON 形狀依 `bom_type` 與對應 master 的 pricing 類型決定。目前階段由使用者手動輸入；排程模組上線後由系統依印件內容（尺寸、印量、拼版結果、裝訂所需台數 / 頁數 / 本數）自動計算 `pricing_selection_default`，使用者仍可覆寫。

#### Scenario: 現階段使用者手動輸入 pricing_selection

- **WHEN** 印務於新增 / 編輯生產任務時選擇 BOM
- **THEN** 使用者 SHALL 手動輸入 pricing_selection
- **AND** `pricing_selection_default` SHALL 為 null
- **AND** `pricing_selection_overridden` SHALL 預設為 true

#### Scenario: 排程模組上線後自動帶入

- **WHEN** 排程模組上線，系統依印件內容為生產任務自動計算計價鍵
- **THEN** 系統 SHALL 寫入 `pricing_selection_default` 與 `pricing_selection`（初始兩者相等）
- **AND** `pricing_selection_overridden` SHALL 預設為 false

#### Scenario: 使用者覆寫排程預設值

- **WHEN** 排程帶入後使用者手動修改 `pricing_selection`
- **THEN** 系統 SHALL 保留 `pricing_selection_default` 原值，更新 `pricing_selection` 為新值
- **AND** `pricing_selection_overridden` SHALL 設為 true

#### Scenario: pricing_selection 形狀依 bom_type 決定

- **WHEN** 系統儲存或讀取 pricing_selection
- **THEN** JSON 形狀 MUST 遵循下列對應：

  | bom_type | 引用 master | pricing_selection 形狀 |
  |----------|-----------|----------------------|
  | material | MaterialSpec | 依 Material.pricing_type：按重量 `{ size_name }`；按面積 `{ area_range_id, qty_range_id }`；按數量 `{ qty_tier_id }` |
  | process | Process | 依 Process.pricing_method：巢狀 `{ x_range_id, y_range_id }`；單一 `{ tier_id }` |
  | binding | Binding | 統一 `{ x_axis_id, y_axis_id }` |

### Requirement: BOM 單價回查與成本計算

系統 SHALL 依生產任務的 `bom_type` + FK + `pricing_selection` 回查對應 master 的 pricing rule 表，取得單價後套用相關調整邏輯（最低金額等）計算材料 / 工序 / 裝訂成本。

#### Scenario: 材料成本計算

- **WHEN** 生產任務 bom_type = material
- **THEN** 系統 SHALL 依 MaterialSpec 的 pricing_type 與 pricing_selection 查 material-master 定義的對應 pricing rule（PricingRuleWeightBased / AreaBased / QtyBased）
- **AND** 成本 = 單價 × 實際用量（用量換算規則於 material-master spec 定義）

#### Scenario: 工序成本計算

- **WHEN** 生產任務 bom_type = process
- **THEN** 系統 SHALL 依 Process 的 pricing_method 與 pricing_selection 查 process-master 定義的 ProcessPricingMatrix 或 ProcessPricingTier
- **AND** 成本 = 單價 × 實際用量（依 tier_type 或 Matrix 語意）

#### Scenario: 裝訂成本計算

- **WHEN** 生產任務 bom_type = binding
- **THEN** 系統 SHALL 依 pricing_selection 查 binding-master 定義的 BindingPricingMatrix 取得單價
- **AND** 系統 SHALL 依 binding-master § 最低金額套用邏輯計算：`unit_price_actual = max(price, min_amount_per_unit)`；`total_actual = max(unit_price_actual × qty, min_total_amount)`

#### Scenario: pricing_selection 或 FK 缺失時無法計算

- **WHEN** 生產任務 pricing_selection 為 null 或對應 FK 未設定
- **THEN** 系統 MUST NOT 計算該筆成本；UI SHALL 顯示「待設定計價」提示

### Requirement: 色數加價計算

系統 SHALL 計算色數加價（`estimated_color_cost`）作為生產任務的變動成本，歸屬工序本身，僅對 `bom_type = process` 的生產任務有效。色數加價依生產任務的顏色選項（`front_color_count` / `back_color_count` / `special_colors`）、所綁定設備的 `pricing_tiers` 與特殊色倍率、及目標印量自動計算。任一影響因子變動時，系統 SHALL 即時重算。

計算公式：

```
units = pt_target_qty / (500 or 1000)     # 依設備 pricing_unit: 令 / 千車
tier  = findPricingTier(units, 設備.pricing_tiers)
basic_cost  = front_color_count × (單色單價) × units
            + back_color_count × (單色單價) × units
              （色數 = 1 套 mono_price_per_color；色數 ≥ 2 套 cmyk_price_per_color）
special_cost = Σ tier.cmyk_price_per_color × multiplier × units
              （逐一計算每個特殊色類型：Pantone / 金銀白螢光 / 最低色數）
estimated_color_cost = basic_cost + special_cost
```

#### Scenario: 工序類生產任務計色數加價（CMYK 四色）

- **WHEN** `bom_type = process`，`front_color_count = 4`、`back_color_count = 0`，設備 `cmyk_price_per_color = 800/令`，`pt_target_qty = 5000 張`
- **THEN** `units = 10`，`basic_cost = 4 × 800 × 10 = 32,000`
- **AND** `estimated_color_cost` SHALL = 32,000

#### Scenario: 工序類生產任務計色數加價（CMYK + Pantone）

- **WHEN** `bom_type = process`，`front_color_count = 4`，`special_colors = ['pantone']`，設備 `cmyk_price_per_color = 800`、`pantone_multiplier = 2`，`pt_target_qty = 5000`
- **THEN** `units = 10`，`basic_cost = 32,000`，`special_cost = 800 × 2 × 10 = 16,000`
- **AND** `estimated_color_cost` SHALL = 48,000

#### Scenario: 材料類生產任務不計色數加價

- **WHEN** `bom_type = material`
- **THEN** `estimated_color_cost` MUST 為 null（UI 不顯示色數輸入）

#### Scenario: 裝訂類生產任務不計色數加價

- **WHEN** `bom_type = binding`
- **THEN** `estimated_color_cost` MUST 為 null（UI 不顯示色數輸入）

#### Scenario: 設備不支援色數加價

- **WHEN** 生產任務設備 `supports_colors = false`
- **THEN** `estimated_color_cost` SHALL = 0
- **AND** UI 色數輸入欄位 SHALL 為 disabled，顯示說明「此設備（設備名）僅計開機費，不計色數加價」

#### Scenario: 未指定設備

- **WHEN** 生產任務尚未設定設備
- **THEN** `estimated_color_cost` MUST NOT 計算
- **AND** UI 色數輸入 SHALL 為 disabled，顯示「請先選擇設備」

#### Scenario: 切換設備時保留色數 state

- **WHEN** 印務在支援色數的設備 A 填入色數值後，切換至不支援色數的設備 B
- **THEN** 系統 SHALL 保留色數 state（`front_color_count` / `back_color_count` / `special_colors` 不清空）
- **AND** UI 色數欄位顯示為 disabled 灰階
- **AND** 印務再切回支援色數的設備 C 時，原色數值 SHALL 自動恢復可編輯

#### Scenario: 色數選項變更觸發重算

- **WHEN** 印務在 `bom_type = process` 的生產任務修改色數選項（如新增 Pantone）
- **THEN** 系統 SHALL 即時重算 `estimated_color_cost` 並更新顯示
- **AND** `estimated_equipment_cost` MUST NOT 受影響

### Requirement: BOM 分類以 Tab 呈現

系統 SHALL 在工單詳情頁（WorkOrderDetail）與新增生產任務頁（AddProductionTasks）中，將材料 / 工序 / 裝訂三類以 Tab 切換呈現，預設停在「材料」Tab。Tab 標籤 SHALL 顯示該類別當前筆數。

#### Scenario: 工單詳情頁 BOM Tab 切換

- **WHEN** 印務打開工單詳情頁，該工單底下生產任務分佈為 3 筆材料、2 筆工序、1 筆裝訂
- **THEN** 系統 SHALL 顯示三個 Tab：「材料 (3)」「工序 (2)」「裝訂 (1)」，預設停在「材料」
- **AND** 系統 SHALL 在每個 Tab 內僅渲染對應分類的生產任務表格（其他分類隱藏）

#### Scenario: 新增生產任務頁 Tab 切換

- **WHEN** 印務進入新增生產任務頁，三個分類草稿行（rows）各自獨立維護
- **THEN** 系統 SHALL 顯示三個 Tab：「材料 (N)」「工序 (N)」「裝訂 (N)」，N 為各分類當前草稿筆數，預設停在「材料」
- **AND** 切換 Tab 不會影響其他分類已填的草稿內容
- **AND** 每個 Tab 右上角 SHALL 提供「新增一筆」按鈕，新增的 row 僅加入當前 Tab 的草稿陣列

#### Scenario: 分類為空時顯示 empty state

- **WHEN** 印務在工單詳情頁切換到某分類 Tab（例如裝訂），而該工單無裝訂生產任務
- **THEN** 系統 SHALL 顯示「尚無裝訂項目」的 empty state 文字
- **AND** Tab 標籤的筆數徽章 SHALL 顯示 (0)

### Requirement: TransferTicket 實體定位

轉交單（TransferTicket）SHALL 為獨立實體，透過 `printItemId` FK 關聯**印件**層，承載跨站運送資訊與確認憑證。

**關聯範圍限制**：
- 一張 TransferTicket MUST 綁定單一 printItemId，**不可跨印件**
- 同一 TransferTicket 的 lines[] 可含**跨工單但同印件**的生產任務
  （例：印件 A 的工單 1 印刷 + 工單 2 外包模切合併為一張單）

一印件 SHALL 可擁有多張 TransferTicket 以支援分批轉交（對應分批出貨）。

#### Scenario: 建立時寫入印件 FK

- **WHEN** 印務於印件詳情頁「轉交單」Tab 點擊「新增轉交單」並填寫
- **THEN** 系統 MUST 寫入 `printItemId` 為該印件 ID
- **AND** MUST NOT 持有 `workOrderId` 欄位（工單關聯透過 lines[].productionTaskId → workOrder 間接取得）

#### Scenario: 同印件跨工單合併單

- **WHEN** 印務為印件 X 建單，選取工單 A 的印刷任務 100 + 工單 B 的模切任務 100
- **THEN** 系統 SHALL 建立一張 TransferTicket 包含兩條 lines
- **AND** 兩條 lines 的 productionTaskId 對應的印件 FK MUST 均為 X

#### Scenario: 禁止跨印件

- **WHEN** 印務嘗試在一張 TransferTicket 的 lines 內混入不同印件的生產任務
- **THEN** 系統 MUST 阻擋並提示「同一轉交單內所有生產任務必須屬於同一印件」

#### Scenario: 一印件多張轉交單

- **WHEN** 印件 X 第一批先送 100 建 Ticket A、剩下 200 隔日再送建 Ticket B
- **THEN** 系統 SHALL 允許 A 與 B 各自獨立狀態、獨立確認送達

---

### Requirement: TransferTicket 狀態機

TransferTicket SHALL 依以下狀態流轉：

- 主路徑：運送中 → 已送達
- 作廢路徑：運送中 → 已作廢

「已送達」與「已作廢」為終態，MUST NOT 可回退。撤回機制（已送達 → 運送中）於主流程跑通後再設計。「已作廢」的 TransferTicket 其 lines 的 quantity MUST NOT 計入其他單的可申請上限，但紀錄保留供稽核。

#### Scenario: 建立時直接進入運送中

- **WHEN** 印務建立 TransferTicket 並填妥必填欄位（目的地、至少一條 line）
- **THEN** TransferTicket 狀態 SHALL 為「運送中」

#### Scenario: 印務確認送達

- **WHEN** 印務於「運送中」Ticket 點擊「確認送達」
- **THEN** 狀態 SHALL 變為「已送達」
- **AND** 系統 MUST 寫入 `actualDate = 當日`、`confirmedBy = 當前登入印務`

#### Scenario: 印務作廢

- **WHEN** 印務於「運送中」Ticket 點擊「作廢」，二次確認並填原因
- **THEN** 狀態 SHALL 變為「已作廢」
- **AND** 系統 MUST 寫入 `cancelledAt`、`cancelledBy`、`cancelledReason`
- **AND** 該 Ticket 所有 lines 的 quantity MUST NOT 計入其他單的可申請上限

#### Scenario: 已送達無撤回路徑（MVP）

- **WHEN** 印務查看「已送達」Ticket
- **THEN** UI MUST NOT 顯示「撤回」操作按鈕
- **AND** 若印務需修正，須透過「作廢原單 + 開新單」流程表達（後續主流程通後將補撤回）

---

### Requirement: TransferTicket 建立流程

印務 SHALL 於印件詳情頁的「轉交單」Tab 建立 TransferTicket。建立前置與必填：

- 印件下至少一個生產任務有報工紀錄（`pt_produced_qty > 0`）
- 對象類型（內部產線 / 外部廠商）必填
  - 內部產線：目的產線 FK 必填
  - 外部廠商：目的廠商 FK 必填
- `lines[]` 至少含一條合法 line
  - 每條 line 的 productionTaskId MUST 屬於該印件
  - 每條 line.quantity > 0 且為整數
  - 每條 line.quantity 不超過該生產任務的可申請上限
- 同張單內同一生產任務 MUST NOT 重複出現於 lines

#### Scenario: 建立含多條 lines

- **WHEN** 印務為印件 X 建單，對象類型=內部產線、目的產線=手工產線B區，lines 含印刷 100 + 模切 100
- **THEN** 系統 SHALL 建立 TransferTicket 寫入兩條 lines
- **AND** Ticket 狀態 = 運送中

#### Scenario: 貨運行必填

- **WHEN** 印務建單選擇 deliveryMethod = 貨運行但未填 carrierName
- **THEN** 系統 SHALL 阻擋並提示貨運行名稱必填

#### Scenario: 無可轉交量禁止建單

- **WHEN** 印件下所有生產任務 `pt_produced_qty = 0`
- **THEN** 「新增轉交單」按鈕 SHALL 禁用，並提示「需先完成報工」

#### Scenario: 重複 productionTaskId 阻擋

- **WHEN** 印務嘗試建單 lines 含兩條相同 productionTaskId
- **THEN** 系統 SHALL 阻擋並提示「同一生產任務不可重複」

---

### Requirement: Line-level 可申請上限

系統 MUST 對建單 / 編輯的每條 line 獨立驗證可申請上限，不可讓某生產任務被超額抽取。

**公式（每條 line）**：

```
line.quantity <= pt.ptProducedQty
              − sum(同印件其他非作廢 Ticket 中該 productionTaskId 的 line.quantity)
```

「已作廢」狀態 Ticket 的 lines 不計入占用（符合 QC 可申請上限模式）。

#### Scenario: 首次建單上限 = 報工量

- **WHEN** 印件 X 的印刷任務 ptProducedQty = 1000、尚無 Ticket
- **THEN** 該 line 可申請上限 = 1000

#### Scenario: 其他非作廢 Ticket 占用扣除

- **WHEN** 印件 X 已有 Ticket A（運送中，印刷 line = 600），印務建 Ticket B
- **THEN** Ticket B 的印刷 line 可申請上限 = 1000 − 600 = 400

#### Scenario: 作廢 Ticket 恢復上限

- **WHEN** Ticket A 被作廢後，印務建 Ticket C
- **THEN** C 的印刷 line 可申請上限 = 1000（A 作廢不計）

#### Scenario: 編輯模式排除自身

- **WHEN** 印務編輯 Ticket B（既有印刷 line = 400），想改為 500
- **THEN** 驗證時 MUST 排除 Ticket B 自身既有占用
- **AND** 上限 = 1000 − 600（其他）= 400；若 A 也作廢則 = 1000

#### Scenario: 超量阻擋

- **WHEN** 印務嘗試建 line.quantity 超過上限
- **THEN** 系統 SHALL 阻擋並顯示具體上限值

---

### Requirement: Slack 通知連結欄位

TransferTicket SHALL 提供 `slackMessageUrl` 欄位（URL 字串，選填），對齊需求單 `QuoteRequest.slackLink` 模式。

正式上線後由 Webhook 自動發 Slack 通知 → 印務取得訊息 URL 後回填；Prototype 階段本欄位為純編輯欄（**不實作 Webhook 機制**），供印務手動紀錄參考用。

**編輯位置**：
- 建單 Dialog：表單含選填「Slack 通知連結」欄位
- 詳情 Dialog：顯示連結（可點擊開新視窗）+「編輯 / 填寫」按鈕切換 inline 編輯
- 主列表 Table：「Slack」欄顯示 ExternalLink icon（有值才顯示），點擊開新視窗

**終態限制**：已作廢的 Ticket MUST NOT 提供「編輯 / 填寫」按鈕（保護歷史紀錄）。

#### Scenario: 建單時選填 Slack 連結

- **WHEN** 印務於新增 Dialog 填妥其他欄位 + 選填 Slack URL 並儲存
- **THEN** 系統 SHALL 將 URL 寫入 TransferTicket.slackMessageUrl
- **AND** URL 留空時 MUST 寫入 undefined

#### Scenario: 詳情彈窗編輯 Slack 連結

- **WHEN** 印務於詳情 Dialog 點「編輯」（或「填寫」）→ 在 inline input 輸入 URL → 點 Check 按鈕
- **THEN** 系統 MUST 呼叫 `updateTransferTicketSlackUrl` 更新 store
- **AND** 顯示 Toast「Slack 連結已更新」
- **AND** Ticket.updatedAt 重寫

#### Scenario: 主列表 Slack 欄跳外連

- **WHEN** 主列表某列 Ticket 有 slackMessageUrl
- **THEN** Slack 欄 SHALL 顯示 ExternalLink icon
- **AND** 點擊 icon MUST 開新視窗至該 URL 且 `e.stopPropagation()` 防止觸發列點擊（避免同時開詳情彈窗）

#### Scenario: 已作廢禁止編輯

- **WHEN** Ticket 狀態為已作廢
- **THEN** 詳情 Dialog MUST NOT 顯示「編輯 / 填寫」按鈕
- **AND** 若已有 URL 仍可點擊跳轉（唯讀）

---

### Requirement: 印件詳情頁「轉交單」Tab

印件詳情頁 SHALL 於 Tabs 內新增「轉交單」Tab，位置介於「QC 紀錄」與「出貨單」之間（遵循 DESIGN.md §0 Tab 順序依業務流先後）。

Tab 標題 MUST 顯示該印件的 TransferTicket 數量計數：`轉交單（N）`。

Tab 內容 MUST 包含：
- 摘要文字（運送中 / 已送達 / 已作廢 各數量）
- 「新增轉交單」按鈕（無可申請量時 disable）
- Ticket 卡片列表（依 createdAt 遞減排序）

每張 Ticket 卡片 MUST 顯示：
- 編號（ticketNo）+ 狀態 Badge + 總數
- 目的地（targetType + destination name）
- 運送方式 + 貨運行名稱（若有）
- 廠內執行者（若有）
- 預計 / 實際轉交日
- lines 明細列表（每條 line：生產任務名稱 + 數量）
- 備註 / 作廢原因（若有）
- 操作按鈕（依狀態：確認送達 / 作廢 / 重新複製 Slack 摘要）

#### Scenario: Tab 位置

- **WHEN** 使用者開啟印件詳情頁
- **THEN** Tabs 順序 SHALL 為：審稿紀錄 → 工單 → QC 紀錄 → **轉交單** → 出貨單 → 活動紀錄

#### Scenario: Tab 無轉交單時空狀態

- **WHEN** 印件尚無 TransferTicket
- **THEN** Tab 內容 SHALL 顯示空狀態訊息，「新增轉交單」按鈕視報工狀態啟用 / 禁用

---

### Requirement: TransferTicket Data Model

系統 SHALL 實作 TransferTicket 實體的資料模型如下：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 編號 | ticketNo | 字串 | Y | | 格式 TT-YYYYMMDD-NNN |
| 印件 | printItemId | FK | Y | Y | FK → PrintItem；單一關聯不跨印件 |
| 印件名稱 | printItemName | 字串 | Y | Y | 快照（顯示用） |
| 狀態 | status | 單選 | Y | | 運送中 / 已送達 / 已作廢 |
| 對象類型 | targetType | 單選 | Y | | 內部產線 / 外部廠商 |
| 目的產線 | destinationLineId | FK | 條件必填 | | targetType = 內部產線時必填 |
| 目的廠商 | destinationVendorId | FK | 條件必填 | | targetType = 外部廠商時必填 |
| 運送方式 | deliveryMethod | 單選 | | | 廠內自送 / 貨運行 / 供應商自取 / 其他 |
| 貨運行名稱 | carrierName | 字串 | 條件必填 | | deliveryMethod = 貨運行時必填 |
| 廠內執行者 | handlerName | 字串 | | | 廠務姓名純文字 |
| Lines | lines | 陣列 | Y | | 至少一條 TransferTicketLine |
| 備註 | notes | 文字 | | | |
| 預計轉交日 | expectedDate | 日期 | | | |
| 實際轉交日 | actualDate | 日期 | 系統自動 | Y | 確認送達時寫入 |
| 確認操作人 | confirmedBy | FK | 系統自動 | Y | FK → User |
| 簽收照片 | signaturePhotos | 檔案陣列 | | | Prototype 階段 placeholder |
| Slack 通知連結 | slackMessageUrl | URL 字串 | | | 對齊需求單 Slack 連結；Webhook 發出訊息後回填供查找 |
| 作廢時間 | cancelledAt | 日期時間 | | | |
| 作廢操作人 | cancelledBy | FK | | | |
| 作廢原因 | cancelledReason | 文字 | | | |
| 建立時間 | createdAt | 日期時間 | Y | Y | |
| 更新時間 | updatedAt | 日期時間 | Y | Y | |

#### Scenario: 建立時寫入必填欄位

- **WHEN** 系統建立新 TransferTicket
- **THEN** id / ticketNo / printItemId / status / targetType / lines / createdAt / updatedAt MUST 全部寫入
- **AND** 內部產線：destinationLineId MUST 寫入；外部廠商：destinationVendorId MUST 寫入

#### Scenario: 確認送達時系統自動欄位寫入

- **WHEN** 印務點擊「確認送達」
- **THEN** actualDate MUST 寫入當日、confirmedBy MUST 寫入當前登入印務 ID

---

### Requirement: TransferTicketLine Data Model

系統 SHALL 實作 TransferTicketLine 子結構，儲存於 TransferTicket.lines 陣列，每條 line 代表從某個生產任務抽取的部分數量。

| 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|---------|------|------|------|
| 生產任務 | productionTaskId | FK | Y | FK → ProductionTask；必須屬於 Ticket 的 printItemId |
| 生產任務名稱 | productionTaskName | 字串 | Y | 快照（顯示用），通常為 taskNo + process |
| 數量 | quantity | 整數 | Y | > 0，不超過 line-level 上限 |

#### Scenario: 寫入 line 時驗證印件歸屬

- **WHEN** 系統建立或更新 Ticket，lines 含一條 productionTaskId
- **THEN** 系統 MUST 驗證該 PT 所屬工單的 printItemId 等於 Ticket.printItemId
- **AND** 不一致時 MUST 拒絕寫入

#### Scenario: 同單重複 PT 阻擋

- **WHEN** 系統檢驗 lines 陣列
- **THEN** 相同 productionTaskId MUST NOT 出現兩次以上

## Data Model

來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### Task

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工單 | work_order_id | FK | Y | Y | FK -> 工單 |
| 工序 | process_id | FK | Y | | FK -> 工序 |
| 工廠類別 | factory_type | 單選 | Y | | 自有工廠 / 加工廠 / 外包廠 / 中國廠商 |
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
| 工廠類別 | factory_type | 單選 | Y | | 自有工廠 / 加工廠 / 外包廠 / 中國廠商 |
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
| 產線 | production_line_id | FK | Y | Y | FK -> ProductionLine（BOM 帶入，唯讀） |
| 排序序號 | sort_order | 整數 | Y | | 分類內的排序序號 |
| 單黑 | color_mono_black | 布林值 | | | 預設 false |
| CMYK | color_cmyk | 布林值 | | | 預設 false |
| Pantone 倍率 | color_pantone_multiplier | 小數 | | | null = 未選；有值 = 倍率（印務手動輸入） |
| 金/銀/白/螢光倍率 | color_metallic_multiplier | 小數 | | | null = 未選；有值 = 倍率（設備主檔預設，可覆寫） |
| 單金/銀/白/螢光色最低色數倍率 | color_metallic_min_multiplier | 小數 | | | null = 未選；有值 = 倍率（設備主檔預設，可覆寫） |
| 設備預計成本 | estimated_equipment_cost | 小數 | | Y | 系統依顏色選項 + 設備單價 + 數量自動計算，唯讀 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### ProductionLine

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 產線名稱 | name | 字串 | Y | | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### Process

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工序名稱 | name | 字串 | Y | | |
| 分類 | category | 單選 | Y | | 材料 / 工序 / 裝訂 |
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

---

## 任務（Task）層狀態機摘要

任務為生產任務的分組層，依工廠類別自動分組。狀態：待交付 -> 已交付 -> 製作中 -> 已完成/已作廢。可逆狀態：異動、已確認異動內容。

---

## Phase 2 預留功能

- 自動排程演算（依交貨日期反推最早開工日期）-- 見 Requirement: 自動派工建議（Phase 2）
- 生產效率 Dashboard
- 急單插入排程
- 外包廠/中廠完整狀態追蹤介面
