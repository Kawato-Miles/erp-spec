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

系統 SHALL 提供排程中心作為印務的主要排程工作介面，取代原有在各工單詳情頁逐筆排程的方式。排程中心 SHALL 顯示跨工單的所有待排程生產任務，以設備佇列為核心組織方式。

原有工單詳情頁的排程功能調整為排程預覽（唯讀），顯示該工單各生產任務在排程中心的排程狀態。

#### Scenario: 印務查看待排程任務

- **WHEN** 印務開啟排程中心
- **THEN** 系統 SHALL 在待排區顯示所有待排程的生產任務，包含工單資訊、工序、印件名稱、交貨日期
- **AND** 系統 SHALL 在設備佇列區顯示各設備的已排程任務

#### Scenario: US-WO-013 查看派工板（待派工的生產任務清單）

- **WHEN** 印務主管進入排程中心
- **THEN** 系統 SHALL 在待排區列出所有待派工的生產任務，按交貨日期排序，每筆任務 MUST 顯示：任務編號、所屬工單、交貨日期、預計工作量、所屬工廠類型
- **AND** 系統 SHALL 在設備佇列區顯示已排入設備的任務清單與自動推算的日期

### Requirement: 設備選擇與工廠指定

系統 SHALL 在排程中心以設備佇列方式完成設備選擇。印務將任務拖入對應設備佇列即完成設備指定，系統自動設定 equipment_id。工廠依工序自動決定（唯讀）。

#### Scenario: 印務為生產任務選擇設備

- **WHEN** 印務在排程中心將生產任務拖入「海德堡四色機」佇列
- **THEN** 系統 SHALL 自動設定該任務的 equipment_id 為該設備 ID
- **AND** planned_equipment SHALL 記錄該設備名稱（向下相容）

#### Scenario: 工序不需要設備

- **WHEN** 某工序不需要指定設備
- **THEN** 系統允許跳過設備選擇，該任務 SHALL 在待排區標示「免排設備」
- **AND** 印務可直接設定開工日期與工期，不需排入設備佇列

#### Scenario: US-WO-014 為生產任務選擇設備

- **WHEN** 印務主管在排程中心查看待排任務
- **THEN** 若工序需要設備，印務 SHALL 將任務拖入對應設備佇列完成設備指定
- **AND** 若工序不需要設備，系統 MUST 在待排區標示「免排設備」，印務可直接設定日期

### Requirement: 開工日期設定與完工推算

系統 SHALL 在排程中心透過佇列式自動推算完成開工日期與完工日設定。印務將任務排入設備佇列後，系統依佇列順序自動推算 scheduled_date 與 planned_end_date，印務不需手動逐筆填寫。

印務仍可手動覆蓋 scheduled_date（產生佇列空隙），系統 SHALL 即時重算後續任務日期。

自有工廠的 planned_end_date 推算規則維持不變：scheduled_date + estimated_duration_days（跳過週日）。外包廠的 planned_end_date 維持印務手動填寫。

#### Scenario: 印務設定開工日期（佇列自動推算）

- **WHEN** 印務將生產任務排入海德堡佇列第 3 位，前 2 位任務的預計完工日為 4/3
- **THEN** 系統 SHALL 自動推算該任務 scheduled_date 為 4/4
- **AND** 系統 SHALL 依 estimated_duration_days 推算 planned_end_date

#### Scenario: US-WO-015 手動設定開工日期與完工推算

- **WHEN** 印務主管在排程中心手動覆蓋某任務的開工日期
- **THEN** 系統 SHALL 保留手動設定的日期
- **AND** 系統 SHALL 即時重算後續佇列任務的日期
- **AND** 印務主管 MUST 確認推算完工日期是否在交貨日期之前

### Requirement: 設備/工廠負載視圖

系統 SHALL 在排程中心以三週滾動時間軸提供設備負載視覺化。時間軸以設備為縱軸、日期為橫軸，甘特圖呈現各設備佇列的排程分布與負載狀況。

#### Scenario: 印務查看設備負載

- **WHEN** 印務在排程中心查看時間軸視圖
- **THEN** 系統 SHALL 以甘特圖顯示各設備已排定的任務時段
- **AND** 每台設備 SHALL 標示負載摘要（已排天數 / 可用天數）

#### Scenario: US-WO-017 查看設備/工廠負載視圖

- **WHEN** 印務主管在排程中心查看時間軸
- **THEN** 系統 SHALL 以日期軸搭配設備軸展示時間軸與任務分布
- **AND** 系統 MUST 清晰標示目前負荷狀況，輔助識別過載時段

### Requirement: 任務交付
系統 SHALL 支援印務確認派工排程完成後透過系統交付任務（任務狀態：待交付 -> 已交付）。前置條件：所有生產任務均已設定設備（若工序需要）與開工日期。

#### Scenario: 印務交付任務給生管
- **WHEN** 印務確認派工排程完成，所有生產任務已設定設備與開工日期
- **THEN** 系統將任務狀態從「待交付」轉為「已交付」，生管收到通知

#### Scenario: 前置條件未滿足
- **WHEN** 印務嘗試交付但有生產任務未設定開工日期
- **THEN** 系統阻擋交付並提示未完成排程的任務清單

### Requirement: 生管接收與分派

生管查看已交付任務清單，透過任務分派介面決定實際通知工廠 / 師傅開工的時機。生管 SHALL 可在任務分派介面上依工序分組查看所有待處理生產任務，並批次選取同工序任務進行派工。派工操作將生產任務狀態從「待處理」推進至「製作中」。所有生產任務 MUST 分派完畢後，生管可在系統中查看各任務進度狀態。

#### Scenario: 生管透過任務分派介面接收任務
- **WHEN** 印務交付任務後，生產任務狀態為「待處理」
- **THEN** 生管在任務分派介面上可看到該任務，歸入對應工序分組

#### Scenario: 生管批次派工同工序任務
- **WHEN** 生管在任務分派介面勾選同工序的多筆待處理任務並確認派工
- **THEN** 所有被選取的任務狀態從「待處理」轉為「製作中」

#### Scenario: 生管查看各任務進度
- **WHEN** 生管已完成當日派工
- **THEN** 任務分派介面顯示各任務當前狀態（待處理 / 製作中 / 已完成），統計摘要即時反映

### Requirement: 師傅查看工作包

師傅在「我的任務」頁面 SHALL 以工作包為單位查看分派的生產任務，呈現方式與生產任務列表一致（ErpExpandableRow 兩層展開）。

#### Scenario: 師傅查看工作包任務

- **WHEN** 師傅進入「我的任務」頁面
- **THEN** 以工作包為父列，展開後顯示包內生產任務，可逐筆或批次報工

### Requirement: 生產任務狀態機

生產任務（Production Task）SHALL 依以下狀態流轉，依工廠類型有不同路徑：

自有工廠路徑：
- 待處理 → 製作中 → 已完成
- 「製作中」由首次報工觸發

加工廠路徑：
- 待處理 → 製作中 → 已完成
- 與自有工廠相同路徑

外包廠路徑：
- 待處理 → 製作中 → 運送中 → 已完成

中國廠商路徑：
- 待處理 → 製作中 → 已送集運商 → 運送中 → 已完成

終態：已完成、已作廢、報廢。

生管指派師傅（assigned_operator）為欄位更新，不觸發狀態變更。生產任務維持「待處理」直到首次報工。

**Priority**: P0

**Rationale**: 生產任務狀態機依工廠類型區分路徑，外包與中國廠商需額外的物流中間狀態追蹤運送進度。

#### Scenario: 自有工廠生產任務首次報工進入製作中

- **WHEN** 生管或師傅為「待處理」狀態的自有工廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」

#### Scenario: 自有工廠生產任務完成

- **WHEN** 自有工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 直接從「製作中」變為「已完成」

#### Scenario: 外包工廠生產任務含運送

- **WHEN** 外包工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 中國工廠生產任務含集運

- **WHEN** 中國工廠的生產任務製作完畢
- **THEN** 狀態 SHALL 先變為「已送集運商」
- **AND** 集運商出貨後 SHALL 變為「運送中」
- **AND** 貨物到達後 SHALL 變為「已完成」

#### Scenario: 供應商首次報工觸發製作中

- **WHEN** 供應商為「待處理」狀態的外包廠生產任務提交首次報工
- **THEN** 狀態 SHALL 從「待處理」變為「製作中」
- **AND** 向上狀態傳遞 SHALL 正常觸發

#### Scenario: 供應商標記製作完畢觸發運送中

- **WHEN** 供應商將「製作中」狀態的外包廠生產任務標記為製作完畢
- **THEN** 狀態 SHALL 從「製作中」變為「運送中」

#### Scenario: 中國廠商標記出貨觸發已送集運商

- **WHEN** 中國廠商將「製作中」狀態的生產任務標記出貨
- **THEN** 狀態 SHALL 從「製作中」變為「已送集運商」

#### Scenario: 待處理狀態的生產任務作廢

- **WHEN** 「待處理」狀態的生產任務因異動需作廢
- **THEN** 狀態 SHALL 變為「已作廢」（無成本，因尚未實際生產）

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

生管代替師傅記錄 completed_quantity（報工數量）。Phase 1 不要求師傅直接操作系統。生管 SHALL 可在任務分派介面上對「製作中」狀態的生產任務進行報工，填寫報工數量、工時、缺陷數量與備註。

#### Scenario: 生管在任務分派介面上報工
- **WHEN** 生管在任務分派介面點擊某「製作中」任務的「報工」按鈕
- **THEN** 系統顯示報工對話框，生管填寫報工數量後確認，系統累加至 pt_produced_qty

#### Scenario: 報工紀錄追溯
- **WHEN** 生管完成報工
- **THEN** 系統記錄報工人員、報工時間、報工數量、工時、缺陷數量、備註

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

系統 SHALL 在排程中心以「階段」（stage_order）管理工序相依性。同工單內同階段的任務可平行執行，跨階段任務須依序執行。

排入設備佇列時，系統 SHALL 檢查前置階段任務的排程狀態，以提示方式呈現（不阻擋排入操作）。日期推算時 SHALL 自動考慮相依性約束。

#### Scenario: 生管管理工序順序

- **WHEN** 印務在排程中心查看某工單的多工序任務
- **THEN** 系統 SHALL 依 stage_order 標示各任務的階段歸屬
- **AND** 排入設備佇列時，系統 SHALL 提示前置階段任務的排程狀態
- **AND** 日期推算 SHALL 自動確保後置階段的開工日不早於前置階段的完工日

### Requirement: 重新排程

系統 SHALL 支援印務在排程中心隨時調整已排程任務的設備或佇列位置。調整後系統 SHALL 自動重算所有受影響任務的日期。重新排程不受生產任務狀態機限制。

#### Scenario: 印務調整已交付任務的排程

- **WHEN** 印務在排程中心將已排入設備的任務移到另一台設備或調整佇列順序
- **THEN** 系統 SHALL 更新 equipment_id 與 queue_position
- **AND** 系統 SHALL 自動重算所有受影響任務的 scheduled_date 與 planned_end_date
- **AND** 不影響生產任務狀態轉換

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

### Requirement: 印件詳情頁報工入口

系統 SHALL 於印件詳情頁的「工單與生產任務」區塊提供生產任務報工入口（單筆與批次），作為工單詳情頁、派工板、任務平台、供應商平台之外的新增觸發點。

報工入口的權限守門 SHALL 依以下規則執行：
- 僅當生產任務所屬 WorkOrder.assigned_to 等於當前登入印務 / 印務主管時，報工按鈕與勾選框 SHALL 可用
- 其餘狀況：報工按鈕與勾選框 MUST 為禁用狀態，並顯示禁用原因提示
- 守門規則 MUST 在 UI 層與 API 層雙重檢查，防止繞過 UI 直接呼叫 API

報工提交後的所有副作用（ProductionTaskWorkRecord 建立、pt_produced_qty 累加、首次報工觸發狀態從待處理轉為製作中、狀態向上傳遞）SHALL 與工單詳情頁批次報工完全一致，本入口僅變更觸發位置。

#### Scenario: 印務在印件詳情頁批次報工自己負責工單下的生產任務

- **WHEN** 印務甲在印件 B 詳情頁勾選工單 #3（自己負責）下的 PT-6、PT-9 兩筆生產任務，點擊「批次報工」並提交
- **THEN** 系統 SHALL 為 PT-6 與 PT-9 各建立一筆 ProductionTaskWorkRecord
- **AND** 兩筆生產任務的 pt_produced_qty SHALL 累加對應的報工數量
- **AND** 若任一筆為「待處理」且首次報工，狀態 SHALL 自動轉為「製作中」並向上傳遞

#### Scenario: 非工單負責人嘗試報工被阻擋

- **WHEN** 印務甲在印件 B 詳情頁，工單 #4（印務乙負責）下的 PT-7 報工按鈕為禁用狀態
- **THEN** 印務甲 MUST NOT 能透過 UI 對 PT-7 提交報工
- **AND** 即使印務甲繞過 UI 直接呼叫報工 API，系統 SHALL 在 API 層拒絕並回傳權限錯誤

#### Scenario: 印務主管的報工權限與印務一致

- **WHEN** 印務主管開啟印件詳情頁
- **THEN** 報工守門規則 SHALL 與印務角色完全一致：僅 WorkOrder.assigned_to 等於該主管的工單下生產任務可報工
- **AND** 印務主管 MUST NOT 因主管身份取得跨工單代報工權限

### Requirement: 報工來源管道紀錄

ProductionTaskWorkRecord SHALL 新增 `source_channel` 欄位，記錄該筆報工的提交來源管道，用於資料溯源、稽核、未來各管道採用率分析。

`source_channel` SHALL 為 enum 型別，取值範圍：
- `craftsman_platform`：師傅自助報工（任務平台）
- `supplier_platform`：供應商自助報工（供應商平台）
- `dispatch_board`：生管代報（日程面板批次報工 / 單筆報工）
- `work_order_detail`：印務於工單詳情頁報工
- `print_item_detail`：印務於印件詳情頁報工（本 change 新增）

`source_channel` MUST 由系統依提交來源自動填入，使用者 MUST NOT 可手動指定或修改。

API 層守門被觸發時（例如非工單負責人繞過 UI 呼叫報工 API），系統 SHALL 寫入稽核日誌，記錄：嘗試報工的使用者、目標 PT、來源 channel、被拒原因、時間戳。被拒紀錄 MUST NOT 寫入 ProductionTaskWorkRecord。

#### Scenario: 印件詳情頁報工自動填入 source_channel

- **WHEN** 印務在印件詳情頁提交報工
- **THEN** 系統 SHALL 建立 ProductionTaskWorkRecord，`source_channel` = `print_item_detail`
- **AND** 使用者介面 MUST NOT 顯示 source_channel 欄位供修改

#### Scenario: 既有報工管道 source_channel 對應

- **WHEN** 師傅在任務平台提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `craftsman_platform`

- **WHEN** 供應商在供應商平台提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `supplier_platform`

- **WHEN** 生管在日程面板提交報工（單筆或批次）
- **THEN** ProductionTaskWorkRecord.source_channel = `dispatch_board`

- **WHEN** 印務在工單詳情頁提交報工
- **THEN** ProductionTaskWorkRecord.source_channel = `work_order_detail`

#### Scenario: 守門被觸發寫入稽核日誌

- **WHEN** 印務甲繞過 UI 對非自己負責工單下的 PT 呼叫報工 API
- **THEN** 系統 SHALL 在 API 層拒絕該請求
- **AND** 系統 SHALL 寫入稽核日誌：使用者 ID、目標 PT ID、來源 channel、被拒原因、時間戳
- **AND** 系統 MUST NOT 為該次嘗試建立 ProductionTaskWorkRecord

### Requirement: 排程兩階段分離

系統 SHALL 將生產任務管理分為兩個獨立階段：建立階段（Phase 1）與排程階段（Phase 2）。

建立階段：印務在工單詳情頁建立生產任務，設定工序、數量、工廠等基本資料。此階段 MUST NOT 要求填寫開工日期與工期。

排程階段：印務在排程中心將任務排入設備佇列，系統自動推算日期。此階段完成設備指定與日期推算。

#### Scenario: 建立生產任務時不需填寫排程資訊

- **WHEN** 印務在工單詳情頁新增生產任務
- **THEN** 系統 SHALL 要求填寫：工序、數量、工廠類型等基本資料
- **AND** 系統 MUST NOT 要求填寫 scheduled_date 與 estimated_duration_days
- **AND** 新建的任務 SHALL 自動出現在排程中心的待排區

#### Scenario: 排程中心完成排程資訊

- **WHEN** 印務在排程中心將生產任務排入設備佇列
- **THEN** 系統 SHALL 自動推算 scheduled_date 與 planned_end_date
- **AND** 系統 SHALL 自動帶入 estimated_duration_days 預設值（若未填寫）

### Requirement: ProductionTask type 與 scope 分類

ProductionTask SHALL 透過 `type` 與 `scope` 兩個列舉欄位區分業務行為層級。

- `type` 列舉值：`production`（製作工序）、`qc`（出貨前印件入庫檢查）、`inspection`（工序中間品檢，選擇性）
- `scope` 列舉值：`work_order_task`（工序層）、`print_item`（印件層）

對應規則：

| type | scope | 強制性 |
|------|-------|--------|
| `production` | `work_order_task` | 印務規劃時建立 |
| `qc` | `print_item` | 系統自動建立（每印件強制 1 個）|
| `inspection` | `work_order_task` | 印務規劃時對特定 production PT 加入（選擇性）|

建立 ProductionTask 時，系統 MUST 依 type 自動帶入對應 scope，使用者 MUST NOT 手動覆寫。既有 C1 前無 type 欄位的 ProductionTask MUST 由系統補帶為 `type = production`、`scope = work_order_task`。

#### Scenario: 建立 production 任務帶入預設 scope

- **WHEN** 印務在工單規劃時建立 production 任務
- **THEN** 系統 SHALL 將 type 設為 `production`、scope 設為 `work_order_task`

#### Scenario: 系統自動建立 QC 任務帶入預設 scope

- **WHEN** 工單規劃完成後系統為每個 PrintItem 自動建立 QC 任務
- **THEN** 系統 SHALL 將 type 設為 `qc`、scope 設為 `print_item`

#### Scenario: 印務加入品檢任務帶入預設 scope

- **WHEN** 印務在工單規劃時對某 production PT 加入品檢任務
- **THEN** 系統 SHALL 將品檢任務的 type 設為 `inspection`、scope 設為 `work_order_task`
- **AND** 系統 SHALL 將對應 production PT 的 `requires_inspection` 設為 TRUE

#### Scenario: type 與 scope 對應驗證

- **WHEN** 任何來源嘗試建立 type 與 scope 不符對應規則的 ProductionTask
- **THEN** 系統 SHALL 阻擋建立並提示「type 與 scope 對應不合法」

---

### Requirement: ProductionTask 規劃期屬性

ProductionTask SHALL 於工單規劃時由印務設定下列屬性：

| 欄位 | 適用 type | 說明 |
|------|----------|------|
| `requires_inspection` | production | 是否需要對應品檢 PT（影響齊套公式分子使用 inspection 通過數或 produced_qty）|
| `require_transfer` | production | 是否需要轉交（影響系統在報工後是否自動建 TransferTicket）|
| `previous_production_task_ids` | 全部 | 前置 PT 清單（AND 邏輯，所有前置完成才能由生管派工）|

預設策略：印務在規劃時為每個 PT 設定排序（1, 2, 3...），系統依排序自動帶線性相依（`PT-N.previous = [PT-(N-1)]`）；印務僅在並行匯流情境手動修改。

#### Scenario: 印務設定 production PT 屬性

- **WHEN** 印務在工單規劃時建立 production PT 並設定 `requires_inspection = TRUE`、`require_transfer = TRUE`、排序 = 3
- **THEN** 系統 SHALL 寫入該 PT 的 `requires_inspection`、`require_transfer`、排序資訊
- **AND** 系統 SHALL 依排序自動帶 `previous_production_task_ids = [PT-2 的 QC / inspection 完成事件]`

#### Scenario: 印務手動調整並行相依性

- **WHEN** 印務在工單規劃時將某裝訂 PT 的 `previous_production_task_ids` 設為 `[封面 PT 的 QC 完成, 內頁 PT 的 QC 完成]`
- **THEN** 系統 SHALL 寫入該手動設定，覆寫排序自動推導的線性相依

---

### Requirement: QC PT 自動建立（每印件強制 1 個）

工單規劃完成後，系統 MUST 為每個 PrintItem 自動建立 1 個 QC ProductionTask。

建立規則：

- `type = qc`、`scope = print_item`
- `pt_target_qty = 印件預計總數量（pi_planned_qty）`
- `previous_production_task_ids` 預設為「該印件下所有 `affects_product = TRUE` production PT 的『驗收事件』，其中驗收事件 = inspection PT 達標（若該 production PT `requires_inspection = TRUE`）或 production PT 自身達標（若 `requires_inspection = FALSE`）」（依 erp-consultant Round 1 P1 修正釐清）
- `assigned_operator` 預設為 NULL，由印務派工指派 QC 人員
- 印件詳情頁可顯示該 QC PT 進度

QC PT 為印件入庫前最終驗證，每個印件強制 1 個（不可拆分為多個 QC PT；分批驗收透過多筆 ProductionTaskWorkRecord 累計實現）。

#### Scenario: PrintItem 對應 QC PT 自動建立

- **WHEN** 工單規劃完成（所有 production / inspection PT 建立完畢）
- **THEN** 系統 SHALL 為每個 PrintItem 建立 1 個 QC ProductionTask
- **AND** QC PT 的 `pt_target_qty` SHALL 等於 PrintItem 預計總數量
- **AND** QC PT 的 `previous_production_task_ids` SHALL 包含所有該印件下 `affects_product = TRUE` production PT 的「驗收事件」，依各 PT 的 `requires_inspection` 旗標決定為 inspection PT 達標（TRUE）或 production PT 自身達標（FALSE）

#### Scenario: 印務指派 QC 執行者

- **WHEN** 印務在派工板或印件詳情頁指派 QC 人員為 QC PT 的 `assigned_operator`
- **THEN** 系統 SHALL 寫入 `assigned_operator`
- **AND** QC PT SHALL 出現在被指派 QC 人員的派工板待辦清單

#### Scenario: 印件數量異動時 QC PT 同步行為（P2-1）

- **WHEN** 印件 `pi_planned_qty` 在工單規劃完成後被異動（如業務改數量、需求量增加）
- **AND** 對應 QC PT 尚未派工
- **THEN** 系統 SHALL 自動同步 QC PT 的 `pt_target_qty = 新的 pi_planned_qty`

- **WHEN** 印件數量異動發生時對應 QC PT 已派工
- **THEN** QC PT 進入「異動凍結期」，依既有 production-task § 異動期間生產任務行為處理；印件異動完成後系統 SHALL 重算 `pt_target_qty`

#### Scenario: 印件取消時 QC PT 同步行為（P2-1）

- **WHEN** 印件被取消（status = 取消）
- **THEN** 對應 QC PT SHALL 同步進入「取消」狀態
- **AND** 該 QC PT 既有的 WorkRecord MUST NOT 被刪除（保留稽核紀錄）
- **AND** 既有的 pending NCR（若有）SHALL 自動標記 status = `cancelled`；已 resolved 的 NCR 保留紀錄不變

---

### Requirement: 品檢 PT 印務手動加入（工序層選擇性）

印務 SHALL 在工單規劃時，對特定 `affects_product = TRUE` 的 production PT 加入對應品檢 PT。

**限制**（依 erp-consultant Round 1 P2 修正 + OQ-C1-1 已解）：inspection PT MUST 僅可加在 `affects_product = TRUE` 的 production PT 上；系統 MUST 阻擋對 `affects_product = FALSE` 的 PT 加 inspection。

建立規則：

- 印務在工單規劃介面選擇「加入品檢」
- 系統建立 ProductionTask（`type = inspection`、`scope = work_order_task`）
- `pt_target_qty` 由印務設定（通常 = 對應 production PT 的 target_qty）
- `previous_production_task_ids` 設為「對應 production PT 報工完成 + 轉交完成（若 require_transfer）」
- 對應 production PT 的 `requires_inspection` 自動設為 TRUE

品檢 PT 適用於：新製程良率追蹤、外包回廠半成品驗收、特殊規格品中間驗證等情境。

#### Scenario: 印務加入品檢 PT

- **WHEN** 印務在工單規劃時對某 production PT 點選「加入品檢」並填寫 `pt_target_qty`
- **THEN** 系統 SHALL 建立 inspection ProductionTask、設定相依性、將對應 production PT 的 `requires_inspection` 設為 TRUE

#### Scenario: 印務移除品檢 PT

- **WHEN** 印務在工單規劃時移除某品檢 PT（尚未派工前）
- **THEN** 系統 SHALL 刪除該 inspection PT、將對應 production PT 的 `requires_inspection` 還原為 FALSE

#### Scenario: US-PT-002 印務在工單規劃時加入品檢任務

- **WHEN** 印務在工單規劃時，對某 `affects_product = TRUE` 的 production PT 點選「加入品檢」，理由為新製程良率追蹤、外包回廠半成品驗收、或特殊規格中間驗證
- **THEN** 系統 SHALL 建立 inspection PT（type = inspection、scope = work_order_task、pt_target_qty 由印務填寫）
- **AND** 系統 SHALL 將對應 production PT 的 `requires_inspection` 設為 TRUE
- **AND** 該 inspection PT SHALL 顯示在統一派工板，與 production / QC 任務同清單處理（取代當前依賴口頭交辦與紙本紀錄的工序中間檢驗流程）

---

### Requirement: ProductionTaskWorkRecord 結果欄位

`ProductionTaskWorkRecord` SHALL 新增以下欄位（僅 type = `qc` / `inspection` 的 PT 之 WorkRecord 有值）：

| 欄位 | 來源 | 說明 |
|------|------|------|
| `passed_quantity` | QC / 品檢人員填寫 | 此次驗收通過數量 |
| `failed_quantity` | 系統計算 | = `reported_quantity - passed_quantity` |

規則：
- QC / 品檢人員提交時只填 `reported_quantity`（本次驗了多少）與 `passed_quantity`（通過多少）
- 系統自動計算 `failed_quantity` 並寫入（便於資料分析、報表撈取）
- `passed_quantity <= reported_quantity` 必須成立
- type = `production` 的 PT 之 WorkRecord 之 `passed_quantity` / `failed_quantity` 為 NULL

#### Scenario: QC 人員提交 QC 結果

- **WHEN** QC 人員在 QC PT 提交一筆 WorkRecord：`reported_quantity = 100`、`passed_quantity = 80`
- **THEN** 系統 SHALL 寫入 WorkRecord（`reported_quantity = 100`、`passed_quantity = 80`、`failed_quantity = 20`）

#### Scenario: 品檢人員提交品檢結果

- **WHEN** QC 人員（兼品檢）在 inspection PT 提交 WorkRecord：`reported_quantity = 500`、`passed_quantity = 480`
- **THEN** 系統 SHALL 寫入 WorkRecord（`failed_quantity = 20`）

#### Scenario: production PT 之 WorkRecord 不寫入 QC 欄位

- **WHEN** production PT 報工建立 WorkRecord
- **THEN** 該 WorkRecord 的 `passed_quantity` / `failed_quantity` SHALL 為 NULL

#### Scenario: passed_quantity 超過 reported_quantity 阻擋

- **WHEN** QC 人員嘗試提交 `reported_quantity = 100`、`passed_quantity = 120`
- **THEN** 系統 SHALL 阻擋提交並提示「通過數量不得超過本次驗收數量」

---

### Requirement: QC / 品檢 PT 完成判定與累計

QC / 品檢 PT SHALL 透過多筆 ProductionTaskWorkRecord 累計報工。

衍生公式：

```
pt_qc_passed = sum(WorkRecord.passed_quantity
                   where production_task_id = pt.id
                     AND status = '已完成')
```

完成判定（系統自動）：當 `pt_qc_passed >= pt_target_qty`，PT 標記為達標；達標後仍可加新 WorkRecord（補生產情境，sum 超過 target 為合法）。

`pt_qc_passed` 的更新 MUST 觸發下游 PT 相依性檢查與工單完成度重算（依 [work-order spec § 完成度計算（齊套性邏輯 Kitting Logic）](../work-order/spec.md)）。

#### Scenario: QC PT 分批驗收累計

- **WHEN** QC PT 的 `pt_target_qty = 500`、QC 人員依序提交 2 筆 WorkRecord：第 1 筆 reported=100/passed=100、第 2 筆 reported=400/passed=400
- **THEN** `pt_qc_passed = 100 + 400 = 500`，PT 標記達標

#### Scenario: 補生產加 WorkRecord 超過 target 合法

- **WHEN** QC PT.target = 500，第 1 筆 WorkRecord passed = 480、第 2 筆補生產加 WorkRecord passed = 20
- **THEN** `pt_qc_passed = 480 + 20 = 500`，達標；系統不報錯

#### Scenario: 已作廢 WorkRecord 不計入累計

- **WHEN** QC PT 有一筆 WorkRecord 狀態為「已作廢」
- **THEN** 該 WorkRecord 的 passed_quantity MUST NOT 計入 `pt_qc_passed`

#### Scenario: US-PT-003 QC 人員分批驗收同一印件

- **WHEN** QC 人員看到某 QC PT 的上游 production PT 已累積完成 200 件、自己尚未驗收
- **AND** QC 人員提交第一筆 WorkRecord（reported = 200、passed = 200）
- **AND** 上游後續再完成 300 件，QC 人員提交第二筆 WorkRecord（reported = 300、passed = 300）
- **THEN** 系統 SHALL 計算 `pt_qc_passed = 500`，QC PT 達標
- **AND** QC 人員 MUST NOT 被系統要求等上游 PT 全部完工才能開始驗收（分批驗收節奏由 QC 自主決定）
- **AND** 上游與 QC 的協調 SHALL 透過儀表板顯示「上游已通過 vs 自己已驗」+ 印務 / 生管口頭協調，不走系統強制機制

---

### Requirement: PT 相依性檢查（生管派工前置）

生管派工某 PT 前，系統 MUST 檢查 `previous_production_task_ids` 中所有前置事件是否已完成（AND 邏輯）。

前置事件類型：
- 某 PT 的 QC / inspection 完成（PT 達標即視為完成，不看通過數量）
- 某 PT 的轉交完成（TransferTicket 狀態 = 已送達，不看數量）

「不看數量」原則：差額由 NCR Disposition 處理，不阻擋下游派工。

#### Scenario: 前置完成才能派工

- **WHEN** 生管嘗試派工 PT-B，PT-B.previous = [PT-A.qc_completed]
- **AND** PT-A 對應的 QC / inspection PT 已達標
- **THEN** 系統 SHALL 允許派工 PT-B

#### Scenario: 前置未完成阻擋派工

- **WHEN** 生管嘗試派工 PT-B，PT-A 對應的 QC PT 尚未達標
- **THEN** 系統 SHALL 阻擋派工並提示「前置條件未滿足：PT-A 的 QC 尚未完成」

#### Scenario: 多前置 AND 邏輯

- **WHEN** 裝訂 PT.previous = [封面 PT.qc_completed, 內頁 PT.qc_completed]
- **AND** 封面 PT 的 QC 已達標、內頁 PT 的 QC 尚未達標
- **THEN** 系統 SHALL 阻擋派工裝訂 PT

#### Scenario: QC 通過數不足不阻擋下游派工

- **WHEN** PT-A 的 QC PT 達標，但 passed_quantity = 480（target = 500，failed = 20）
- **THEN** PT-B 仍可由生管派工（差額由 NCR Disposition 處理，不阻擋）

---

### Requirement: NCR（不合格紀錄）實體

當 QC / inspection PT 的 WorkRecord 提交時 `failed_quantity > 0`，系統 MUST 自動建立 NCR 紀錄。

NCR Data Model：

| 欄位 | 型別 | 必填 | 說明 |
|------|------|------|------|
| `id` | UUID | Y | 主鍵 |
| `source_work_record_id` | FK | Y | 觸發此 NCR 的 ProductionTaskWorkRecord |
| `defect_quantity` | 整數 | Y | 不合格數量（= source WorkRecord 的 failed_quantity）|
| `disposition` | 列舉 | N | `rework` / `use_as_is` / `scrap`（pending 狀態時為 NULL）|
| `disposition_at` | 日期時間 | N | 印務做決策時間 |
| `disposition_by` | FK | N | FK → 使用者（印務）|
| `defect_category` | 列舉 | Y | 不合格分類 LOV：`material` / `process` / `equipment` / `supplier` / `human`（依 erp-consultant Round 1 P1 修正；用於年度品質報表分類統計）|
| `notes` | 文字 | N | 印務備註（補充 defect_category 之外的具體描述）|
| `status` | 列舉 | Y | `pending` / `resolved` / `cancelled`（cancelled 為依 erp-consultant Round 1 P1 修正新增：source WorkRecord 作廢時系統自動標記）|
| `created_at` / `updated_at` | 日期時間 | Y | 系統自動 |

#### Scenario: failed_quantity > 0 自動建 NCR

- **WHEN** QC 人員提交一筆 WorkRecord：reported=100、passed=80（failed = 20）
- **THEN** 系統 SHALL 自動建立 NCR，`source_work_record_id` 指向此 WorkRecord、`defect_quantity = 20`、`status = pending`、`defect_category = NULL`（待印務 Disposition 時填寫）
- **AND** 系統 SHALL 通知印務檢視 NCR

#### Scenario: 印務 Disposition 時必填 defect_category（P1-2）

- **WHEN** 印務對某 pending NCR 提交 Disposition 決策
- **THEN** 系統 SHALL 強制要求印務同時填寫 `defect_category`（material / process / equipment / supplier / human 五選一）
- **AND** 若印務未填 defect_category，系統 SHALL 阻擋提交並提示「不合格分類為必填欄位」

#### Scenario: failed_quantity = 0 不建 NCR

- **WHEN** QC 人員提交一筆 WorkRecord：reported=100、passed=100（failed = 0）
- **THEN** 系統 MUST NOT 建立 NCR

---

### Requirement: NCR Disposition 機制

NCR 建立後 status = `pending`，印務 SHALL 對 NCR 做 Disposition 決策（三選一）：

- `rework`：補做缺口（具體流程詳見 C3 `add-production-task-rework`）
- `use_as_is`：議價接受，印件數量鎖定，業務發起訂單異動退款（具體流程詳見 C3 / C4）
- `scrap`：報廢，標記放棄

印務做 Disposition 後，NCR 狀態變為 `resolved`，系統記錄 `disposition_at` / `disposition_by`。

NCR 處理為**並行流程**，MUST NOT 阻擋主流程：下游 PT 仍可派工執行；缺口由後續 Disposition 決定如何補。

#### Scenario: 印務選 Rework

- **WHEN** 印務在 NCR 上選擇 `disposition = rework` 並提交
- **THEN** 系統 SHALL 將 NCR.disposition 設為 `rework`、status 設為 `resolved`、記錄 disposition_at / disposition_by
- **AND** 後續補生產的具體流程依 C3 範圍實現（C1 範圍僅定義 disposition 列舉）

#### Scenario: 印務選 Use-As-Is

- **WHEN** 印務在 NCR 上選擇 `disposition = use_as_is`
- **THEN** 系統 SHALL 標記 NCR.disposition 為 `use_as_is`、status 為 `resolved`
- **AND** 系統 SHALL 通知業務發起訂單異動退款（具體串接流程詳見 C3 / C4）

#### Scenario: 印務選 Scrap

- **WHEN** 印務在 NCR 上選擇 `disposition = scrap`
- **THEN** 系統 SHALL 標記 NCR.disposition 為 `scrap`、status 為 `resolved`
- **AND** 缺口視為損失，不觸發補生產或退款

#### Scenario: NCR 不阻擋下游派工

- **WHEN** QC PT 的 WorkRecord 觸發 NCR（pending 狀態）
- **THEN** 下游相依 PT 的派工 MUST NOT 被阻擋（依「不看數量」原則）

#### Scenario: source WorkRecord 作廢時 NCR 處理（P1-5）

- **WHEN** 某 ProductionTaskWorkRecord 被作廢（QC 人員誤填、印務發現後請求作廢等）
- **AND** 該 WorkRecord 曾觸發 NCR
- **THEN** 若 NCR status = `pending`，系統 SHALL 自動將 NCR.status 設為 `cancelled`，記錄 cancellation 時間與原因（「source WorkRecord 作廢」）
- **AND** 若 NCR status = `resolved`，系統 MUST NOT 改變 NCR 狀態（保留稽核紀錄，已執行的 Disposition 動作如 use_as_is 退款不回滾）
- **AND** 若 NCR status = `resolved`，系統 SHALL 通知印務「NCR 來源 WorkRecord 已作廢但 Disposition 已執行，請評估是否需手動處置」

#### Scenario: US-PT-004 印務處理 NCR Disposition（含 Use-As-Is 退款邊界）

- **WHEN** QC PT 報工後系統自動建立 pending NCR（defect_quantity > 0）
- **AND** 印務檢視 NCR、選擇 disposition（rework / use_as_is / scrap）並提交
- **THEN** 系統 SHALL 更新 NCR.disposition、status = resolved、記錄 disposition_at / disposition_by
- **AND** 若 disposition = `use_as_is`，系統 SHALL 發送通知給該訂單的業務負責人（含 NCR id、defect_quantity、source WorkRecord 連結），業務 SHALL 至訂單異動模組手動建立 OrderAdjustment 處理退款
- **AND** 系統於 C1 範圍 MUST NOT 自動產生 OrderAdjustment 或自動計算退款金額（具體自動串接留 C3 / C4）
- **AND** 若 disposition = `scrap`，缺口視為損失，系統 MUST NOT 觸發補生產或退款流程
- **AND** 若 disposition = `rework`，C1 範圍僅標記 disposition 列舉值；補生產的具體建單流程依 C3 `add-production-task-rework` 完整實現

---

### Requirement: 派工板顯示多 type 任務

派工板 SHALL 統一顯示所有 type 的 ProductionTask（production / qc / inspection）。

派工板 MUST 提供 type 篩選器，列出 `production` / `qc` / `inspection` 三類；預設顯示全部。

派工板的詳細顯示邏輯與排序規則詳見 [task-dispatch-board spec](../../specs/task-dispatch-board/spec.md)，本 Requirement 僅定義 C1 後派工板必須涵蓋三種 type。

#### Scenario: 派工板顯示三種 type 任務

- **WHEN** 印務 / 生管開啟派工板
- **THEN** 系統 SHALL 顯示所有待派工的 ProductionTask，涵蓋 `production` / `qc` / `inspection` 三種 type
- **AND** 派工板 MUST 提供 type 篩選器供切換顯示

#### Scenario: 派工板 type 篩選

- **WHEN** 印務在派工板選擇 type = `qc` 篩選
- **THEN** 系統 SHALL 僅顯示 type = `qc` 的 ProductionTask

---

### Requirement: ActivityLog 稽核鉤子（P2-4）

下列 4 類關鍵動作 MUST 寫入 `ProductionTask.ActivityLog`（依 erp-consultant Round 1 P2 修正補強，對齊「5 設計模式 § 5 稽核鉤子」）：

- PT `type` / `scope` 不可手動覆寫的阻擋事件（記錄嘗試覆寫者、被拒絕的目標值）
- QC PT 自動建立事件（記錄觸發者「工單規劃完成」、自動建立的 PT id 清單）
- 印務加入 inspection PT 事件（記錄印務 id、加在哪個 production PT、pt_target_qty）
- 印務移除 inspection PT 事件（記錄印務 id、被移除的 inspection PT、移除前狀態）

每筆 ActivityLog 紀錄 MUST 包含：`actor`（誰執行）、`action_type`（動作分類）、`details`（影響欄位的舊值 / 新值 diff）、`timestamp`。

#### Scenario: PT type 手動覆寫阻擋寫入 ActivityLog

- **WHEN** 任何來源嘗試手動覆寫 ProductionTask.type（API 或內部呼叫）
- **THEN** 系統 SHALL 阻擋並寫入 ActivityLog：`actor` = 嘗試者 id、`action_type` = `block_pt_type_override`、`details` = { 被拒絕的目標 type, 原 type }、`timestamp`

#### Scenario: QC PT 自動建立寫入 ActivityLog

- **WHEN** 工單規劃完成觸發 QC PT 自動建立
- **THEN** 系統 SHALL 寫入 ActivityLog：`actor` = "system"、`action_type` = "auto_create_qc_pt"、`details` = { 建立的 QC PT id 清單 }、`timestamp`

#### Scenario: 印務加入或移除 inspection PT 寫入 ActivityLog

- **WHEN** 印務在工單規劃時加入或移除 inspection PT
- **THEN** 系統 SHALL 寫入 ActivityLog：`actor` = 印務 id、`action_type` = `add_inspection_pt` 或 `remove_inspection_pt`、`details` 含 inspection PT 詳情、`timestamp`

### Requirement: 供應商報價審核流程

系統 SHALL 提供供應商報價的提交與審核流程：

流程：供應商報價 → 生管審核 → 確認 / 退回

**Priority**: P1

**Rationale**: 外包生產任務需確認供應商報價合理後才能結算成本，審核流程確保成本控管。

#### Scenario: 報價流程正常路徑

- **WHEN** 生管將生產任務分派給外包廠
- **THEN** 該生產任務的 quote_status SHALL 為「待報價」
- **AND** 供應商在供應商平台查看後提交報價，quote_status 變為「已報價」
- **AND** 生管在日程面板審核後確認，quote_status 變為「已確認」

#### Scenario: 報價流程退回路徑

- **WHEN** 生管審核報價後認為不合理
- **THEN** 生管退回並填寫退回原因，quote_status SHALL 變為「已退回」
- **AND** 供應商收到退回通知後重新報價，quote_status 變為「已報價」

#### Scenario: 報價與生產可並行

- **WHEN** 供應商尚未報價但生產任務已可開工
- **THEN** 系統 SHALL 允許供應商先開始生產（報工）再補報價
- **AND** 報價流程與生產狀態機 MUST 獨立運作，互不阻擋

---

## Data Model

- 任務欄位正本：[wiki 任務實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/任務.md) § 欄位（業務可見）
- 生產任務欄位正本：[wiki 生產任務實體卡](../../../memory/Sens_wiki/wiki/erp/05-entities/生產任務.md) § 欄位（業務可見）
- Prototype 型別定義：`sens-erp-prototype/src/types/workOrder.ts`
- Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

以下為尚未有 wiki 實體卡的支援實體欄位（產線／工序／報工紀錄）：

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
