## Purpose

工單管理模組 -- 印刷生產執行的中樞，承接訂單審稿通過後到成品入庫的生產進度追蹤。
涵蓋工單建立、分配、製程審核、生產追蹤、異動管理、QC、完成度計算全流程。
取代現有 Ragic + 紙本工單 + Slack 組合。

**問題**：
- Ragic + EC 雙系統資料結構不同，工單異動寫在紙本未回寫系統
- 完成度依賴人工計算（齊套性邏輯），準確度約 95%，無即時性
- 異動無結構化紀錄，生管缺乏集中視角（每日 20-30 次操作）

**目標**：
- 主要：系統化工單生命週期管理（草稿→分配→製程審核→生產追蹤→QC→完成），取代 Ragic + Slack + 紙本
- 次要：齊套性邏輯自動計算準確率 >= 99.5%；工單異動結構化記錄

- 來源 BRD：[工單 BRD](https://www.notion.so/32c3886511fa80f98a43def401d1edce)（v0.4）
- Prototype：`sens-erp-prototype/src/components/workorder/`
- 相依模組：訂單管理、印件、生產任務、QC 單、出貨單

---
## Requirements
### Requirement: 工單草稿建立

系統 SHALL 支援兩種工單草稿建立方式：(1) 線上單由審稿通過後系統依 BOM 自動建立，帶入生產任務；(2) 線下單由印務主管手動建立。工單號格式：W-[YYYYMMDD]-[NN]。

BOM 展開建立生產任務時，系統 SHALL 依印件的 `BOMLineItem` 清單逐筆展開為 ProductionTask。每筆生產任務 SHALL 從對應 BOMLineItem 帶入下列欄位：`bom_type`、三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）、`production_line_id`、`factory_type`。外包廠的 BOMLineItem SHALL 自動帶入「外包廠」產線，中國廠商的 BOMLineItem SHALL 自動帶入「中國廠商」產線。

#### Scenario: 線上單審稿通過自動建立工單

- **WHEN** 線上單印件審稿通過
- **THEN** 系統自動建立工單草稿，依印件的 BOMLineItem 清單展開生產任務
- **AND** 每筆生產任務的 `bom_type` 與三個互斥 FK SHALL 從 BOMLineItem 複製
- **AND** 每筆生產任務的 `production_line_id` SHALL 從 BOMLineItem 自動帶入
- **AND** factory_type 為「外包廠」的 BOMLineItem，生產任務 production_line_id SHALL 自動設為「外包廠」產線
- **AND** factory_type 為「中國廠商」的 BOMLineItem，生產任務 production_line_id SHALL 自動設為「中國廠商」產線

#### Scenario: 線下單印務主管手動建立

- **WHEN** 印務主管為線下全客製品建立工單
- **THEN** 系統建立工單草稿，印務主管逐一新增生產任務
- **AND** 若印件已有 BOMLineItem，依 BOMLineItem 自動展開時，bom_type / FK / production_line_id SHALL 從 BOMLineItem 帶入
- **AND** 手動建立生產任務時，印務 SHALL 選擇 BOM 項目（材料 / 工序 / 裝訂）；系統 SHALL 依選擇設定 bom_type 與對應 FK

#### Scenario: US-WO-003 建立工單草稿並選擇類型

- **WHEN** 線上單審稿通過由系統自動建立工單草稿，或印務主管為線下單手動建立工單草稿並選擇工單類型（打樣/大貨）
- **THEN** 系統 SHALL 建立工單草稿，工單狀態為「草稿」，可供印務主管分配給印務填寫

### Requirement: 工單分配
系統 SHALL 支援印務主管將工單分配給印務，依負載評估決定分配對象。訂單管理人協助追蹤進度。

#### Scenario: 印務主管分配工單
- **WHEN** 印務主管在工單列表選擇工單並指定印務
- **THEN** 系統記錄分配結果，被分配的印務可查看該工單

#### Scenario: US-WO-004 工單分配給印務
- **WHEN** 印務主管在工單列表篩選「草稿」狀態工單，檢視各印務目前負載後指派工單
- **THEN** 系統 SHALL 記錄分配結果；所有草稿工單均 MUST 完成分派，各印務可接手填寫被指派的工單

### Requirement: 工單內容填寫
系統 SHALL 支援印務填寫工單內容，包含製程、材料、生產任務規格。

#### Scenario: 印務填寫工單製程與生產任務
- **WHEN** 印務開啟草稿狀態工單進行填寫
- **THEN** 印務可設定製程、材料規格，並建立/編輯生產任務（手動或依 BOM 自動）

#### Scenario: US-WO-001 建立工單內容並送審
- **WHEN** 印務進入工單草稿，填寫工單目標生產數量、製程說明、材料規格，建立生產任務並標記「影響成品」，點擊「送審」
- **THEN** 工單 SHALL 進入「製程確認中」狀態；工單 MUST 包含至少 1 個標記為「影響成品」的生產任務；所有生產任務之 quantity_per_work_order MUST 大於 0

### Requirement: 製程審核流程
系統 SHALL 支援印務送審 -> 印務主管審核（通過/退回）的製程審核流程。退回 MUST 填寫退回原因。

#### Scenario: 印務送審成功
- **WHEN** 印務填寫完成後送審（前置條件：至少 1 個「影響成品」的生產任務；所有生產任務 quantity_per_work_order > 0；工單目標生產數量已填寫）
- **THEN** 工單狀態轉為「製程確認中」，印務主管收到待審核通知

#### Scenario: 印務主管退回工單
- **WHEN** 印務主管審核後退回
- **THEN** 工單狀態轉為「重新確認製程」，退回原因記錄於系統，印務收到退回通知

#### Scenario: 印務主管審核通過
- **WHEN** 印務主管審核通過
- **THEN** 工單狀態轉為「製程審核完成」

#### Scenario: US-WO-007 執行製程審核（印務主管）
- **WHEN** 印務主管開啟「製程確認中」狀態之工單進行審核
- **THEN** 路徑 A（通過）：印務主管審核通過，工單 SHALL 進入「製程審核完成」狀態；路徑 B（退回）：印務主管退回，系統 MUST 要求填寫退回原因，工單 SHALL 進入「重新確認製程」狀態，退回原因記錄於系統

### Requirement: 工單收回機制

系統 SHALL 支援印務在特定條件下主動收回工單至草稿狀態，重新填寫並重新送審。適用時機：製程確認中（印務主管尚未開始審核）或製程審核完成（尚未有任何任務被交付）。

任務獨立交付模式下，收回前置條件為：該工單下所有任務均處於「待交付」狀態（無任何任務已被交付）。若任何任務已被交付，印務 MUST 改用「異動」流程修正。

#### Scenario: 印務在製程確認中收回

- **WHEN** 印務主動收回「製程確認中」狀態的工單，且印務主管尚未開始審核
- **THEN** 工單狀態回到「草稿」，印務可重新編輯

#### Scenario: 印務在製程審核完成後收回（所有任務未交付）

- **WHEN** 印務收回「製程審核完成」狀態的工單，且所有任務均為「待交付」
- **THEN** 工單狀態回到「草稿」，待交付任務依清理規則處理

#### Scenario: 部分任務已交付時阻擋收回

- **WHEN** 印務嘗試收回工單，但該工單下已有任務被交付（status != 待交付）
- **THEN** 系統 MUST 阻擋收回操作
- **AND** 系統 SHALL 提示「部分任務已交付，請使用異動流程修正」

#### Scenario: US-WO-006 工單收回（未交付前修正）

- **WHEN** 印務點擊「收回」並填寫收回原因，系統驗證前置條件（製程確認中：印務主管尚未開始審核；製程審核完成：所有任務均為「待交付」）
- **THEN** 若前置條件符合，工單 SHALL 返回「草稿」狀態，收回原因記錄於系統；若前置條件不符，系統 MUST 阻擋收回操作並顯示原因

### Requirement: 打樣工單與大貨工單區分
系統 SHALL 以 type 欄位區分打樣工單與大貨工單。打樣工單完成度獨立計算，不計入大貨印件完成度。

#### Scenario: 印務建立打樣工單
- **WHEN** 印務為打樣印件建立工單並設定 type = 打樣
- **THEN** 系統獨立追蹤打樣工單進度，不計入大貨完成度計算

#### Scenario: US-WO-002 打樣工單與大貨工單完成度獨立計算
- **WHEN** 打樣工單 type 設定為「打樣」，大貨工單 type 設定為「大貨」
- **THEN** 系統 SHALL 獨立計算兩種工單的完成度；印件完成度計算 MUST 不包含打樣工單的 QC 入庫數量

### Requirement: 派工排程
系統 SHALL 支援製程審核完成後的派工排程管理。印務為各生產任務指定執行工廠（由工序決定，唯讀）、選擇執行設備（若該工序需要）、決定開工日期，系統自動推算完工日期。派工與狀態機無關，任何狀態都可進行派工調整。

#### Scenario: 印務在派工板查看待排程任務
- **WHEN** 印務開啟派工板
- **THEN** 系統顯示所有待排程的生產任務清單，支援依優先度/交貨日期排序

#### Scenario: 印務為生產任務設定排程
- **WHEN** 印務為生產任務選擇設備、設定開工日期
- **THEN** 系統自動推算 planned_end_date = scheduled_date + estimated_duration_days

#### Scenario: 設備/工廠負載視圖
- **WHEN** 印務查看特定設備或工廠的排程
- **THEN** 系統顯示該設備/工廠已排程任務，避免超載排程

#### Scenario: 已交付後重新排程
- **WHEN** 印務在工單已交付或製作中狀態調整排程
- **THEN** 系統允許修改設備或日期，不影響工單狀態轉換

### Requirement: 工單異動流程

系統 SHALL 支援印務在工單已交付或製作中狀態發起異動。印務發起異動時 MUST 選擇「是否需重新審核製程」並填寫異動原因。異動期間工單完成度計算持續運作，不暫停。

兩條路徑（詳見狀態機 spec § 工單異動流程）：
- 不需重新審核：受影響的任務進入「異動」→ 工單 bubble-up 為「異動」→ 生管在日程面板確認
- 需重新審核：工單回到「重新確認製程」→ 審核通過後交付新任務（標記「異動」）→ 工單 bubble-up 為「異動」→ 生管確認

兩條路徑最終匯入同一收尾：生管確認收到（任務→已確認異動內容）→ 生管完成安排（任務→製作中）→ 所有任務離開異動相關狀態 → 工單 bubble-up 回到正常。

印務發起異動的 UX 流程：點擊「異動」→ 進入生產任務編輯介面 → 調整生產任務（新增/作廢/報廢/修改） → 設定「是否需重新審核製程」 → 填寫異動原因 → 送出。

生產任務變化類型判斷規則：
- 新增：此次異動中新建的生產任務
- 作廢：生產任務狀態從「待處理」→「已作廢」（無成本）
- 報廢：生產任務狀態從「製作中」→「報廢」（費用以報工數計算）
- 修改：欄位有變更（數量/影響成品/製程/內容等），記錄修改前的值
- 不變：屬於該任務但此次未被變更（保留供對照上下文）

異動期間印務可執行的操作：
- 新增生產任務
- 作廢待處理的生產任務（狀態 → 已作廢，無成本）
- 報廢製作中的生產任務（狀態 → 報廢，費用以報工數計算）
- 修改生產任務的 quantity_per_work_order
- 修改生產任務的 affects_product 標記
- 修改製程說明、材料規格（若選擇需重新審核）

#### Scenario: 印務發起工單異動（不需重新審核）

- **WHEN** 印務在「製作中」或「工單已交付」狀態點擊「異動」，調整生產任務，選擇「不需重新審核」，填寫異動原因後送出
- **THEN** 工單 SHALL 進入「異動」狀態
- **AND** 系統 SHALL 通知生管待確認
- **AND** 系統 MUST 建立 WorkOrderModification 紀錄

#### Scenario: 印務發起工單異動（需重新審核）

- **WHEN** 印務在「製作中」或「工單已交付」狀態點擊「異動」，調整生產任務與製程內容，選擇「需重新審核」，填寫異動原因後送出
- **THEN** 工單 SHALL 直接回到「重新確認製程」，MUST NOT 進入「異動」狀態
- **AND** 系統 MUST NOT 通知生管確認
- **AND** 系統 MUST 建立 WorkOrderModification 紀錄（狀態為已確認）

#### Scenario: US-WO-005 工單異動（製作中/工單已交付）

- **WHEN** 印務在「製作中」或「工單已交付」狀態發起異動
- **THEN** 路徑 A（不需重新審核）：受影響任務進入「異動」→ 工單 bubble-up 為「異動」→ 生管在日程面板確認收到 → 生管完成安排 → 任務回「製作中」→ 工單 bubble-up 回到正常
- **AND** 路徑 B（需重新審核）：工單回到「重新確認製程」→ 印務修改 → 印務主管審核 → 交付新任務（標記「異動」）→ 工單 bubble-up 為「異動」→ 生管確認收到 → 生管完成安排 → 任務回「製作中」→ 工單 bubble-up 回到正常
- **AND** 系統 MUST 保留完整異動紀錄（含每筆生產任務的變化類型快照）

#### Scenario: US-WO-008 確認工單異動（生管，任務層兩步驟）

- **WHEN** 生管在日程面板異動確認區查看異動內容
- **THEN** 步驟 1：點擊「確認收到」→ 該任務從「異動」變為「已確認異動內容」
- **AND** 步驟 2：分配完成後點擊「已安排完畢」→ 該任務回到「製作中」
- **AND** 所有任務離開異動相關狀態後，工單自動 bubble-up 回到正常狀態
- **AND** 系統 MUST 記錄確認操作者與時間

#### Scenario: 異動期間已在執行的任務繼續

- **WHEN** 工單處於「異動」狀態，且有生產任務正在「製作中」
- **THEN** 該生產任務 SHALL 繼續執行，師傅與供應商 SHALL 可繼續報工
- **AND** 完成度計算 SHALL 持續運作

#### Scenario: 異動中新增的生產任務何時可開工

- **WHEN** 印務在異動中新增生產任務，送出後生管確認
- **THEN** 新增的生產任務 SHALL 建立為「待處理」狀態
- **AND** 生管指派師傅後，師傅報工即可觸發「製作中」

### Requirement: 工單異動紀錄

系統 SHALL 為每次工單異動建立 WorkOrderModification 紀錄，記錄異動的完整資訊。

每筆紀錄 MUST 包含：異動類型（不需重新審核 / 需重新審核）、異動原因、異動內容說明、生產任務變化快照（ptSnapshots）、發起人與時間、發起時的工單狀態。生管確認後 MUST 補記確認人與確認時間。

#### Scenario: 建立異動紀錄

- **WHEN** 印務送出異動
- **THEN** 系統 SHALL 建立一筆 WorkOrderModification 紀錄
- **AND** 紀錄 MUST 包含 modification_type、reason、content、pt_snapshots、initiated_by、initiated_at、source_status
- **AND** pt_snapshots MUST 記錄每筆受影響生產任務的 changeType（新增/修改/作廢/報廢/不變）與修改前的值

#### Scenario: 生管確認後更新紀錄

- **WHEN** 生管確認異動
- **THEN** 系統 SHALL 更新該筆 WorkOrderModification 紀錄的 confirmed_by 與 confirmed_at

#### Scenario: 查看工單異動歷史

- **WHEN** 使用者在工單詳情頁查看異動歷史
- **THEN** 系統 SHALL 列出該工單所有 WorkOrderModification 紀錄，依時間倒序排列
- **AND** 每筆紀錄 SHALL 顯示異動類型、原因、內容摘要、發起人、確認人、時間

### Requirement: 工單完成度自動計算
系統 SHALL 採齊套性邏輯（Kitting Logic）自動計算工單完成度，公式：floor(min over 所有「影響成品」生產任務 of (QC 通過數 / 每份工單需生產數量))。計算在每次 QC 單完成時自動觸發。

#### Scenario: 單一生產任務 QC 完成
- **WHEN** QC 人員完成某生產任務的 QC 單
- **THEN** 系統重新計算工單完成度，採齊套性邏輯取最小值

#### Scenario: 多筆 QC 同時完成
- **WHEN** 多筆 QC 單同時完成
- **THEN** 計算結果一致（QC 數量為加總邏輯，不存在計算衝突）

#### Scenario: 異動期間完成度計算
- **WHEN** 工單處於異動狀態，新增了生產任務
- **THEN** 新增任務報工數初始為 0，自然反映在計算結果中，完成度計算持續運作

#### Scenario: US-WO-011 查看工單生產進度數量
- **WHEN** 使用者開啟工單內頁
- **THEN** 系統 SHALL 於頁面頂部顯示三項獨立數字：目標數量、生產數量（報工累計）、入庫數量（齊套性邏輯結果），並計算完成度百分比；使用者 SHALL 可對比三項數字辨識齊套瓶頸所在

### Requirement: 印件進度面板
系統 SHALL 以印件角度呈現生產進度：預計數量/完成數量/入庫數量。多工單場景依齊套性邏輯計算，UI 顯示缺口避免誤讀。

#### Scenario: 業務查看印件生產進度
- **WHEN** 業務在訂單頁查看印件進度面板
- **THEN** 系統顯示各印件的預計數量、已完成數量、已入庫數量，多工單場景標示缺口

#### Scenario: US-WO-012 在訂單印件清單查看生產數量
- **WHEN** 使用者在訂單印件表格查看生產數量
- **THEN** 系統 SHALL 顯示四欄：購買數量、製作數量、入庫數量、出貨數量；當出貨數量超過入庫數量時，該列 MUST 以紅色警示標示

### Requirement: 工單取消連動
系統 SHALL 在訂單取消後自動觸發工單取消。任何工單狀態均可被取消。

#### Scenario: 訂單取消觸發工單取消
- **WHEN** 訂單被取消
- **THEN** 系統自動將所屬工單全數轉為「已取消」終態

### Requirement: 工單狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 工單定義的規則進行狀態轉換。完整狀態：草稿 → 製程確認中 → 製程審核完成 → 工單已交付 → 製作中 → 已完成/已取消。可逆狀態：重新確認製程、異動。

「異動」為工單正式狀態，可從「工單已交付」或「製作中」進入，生管確認後依異動類型返回。

#### Scenario: 工單正常完成

- **WHEN** 累計 QC 入庫 >= 工單目標生產數量
- **THEN** 系統自動將工單狀態轉為「已完成」

### Requirement: 批次新增生產任務

系統 SHALL 支援生管透過 side panel 逐筆新增生產任務，新增完成後回填至工單內的生產任務表格；選擇製程後內容下拉自動篩選可用選項，同廠商之生產任務於「儲存」時自動分組為同一任務（Task），Task 名稱 SHALL 為廠商名稱。

**UI 流程規範**：
- 新增入口 SHALL 為 side panel（非表格 inline 新增）；使用者點擊工單內「新增生產任務」進入新增頁，該頁分三個分類 Tab（材料 / 工序 / 裝訂），各 Tab 內的「新增一筆」按鈕 SHALL 開啟對應分類的 side panel
- Side panel 外殼 SHALL 使用 `ErpSidePanel size="xl"`（720px 寬），header actions 放「取消 / 確認新增」雙按鈕
- Panel 內欄位 SHALL 分區塊呈現，依序：
  1. **BOM 選擇**（材料三層 / 工序兩層 / 裝訂單層；最末層下拉 SHALL 以副文字顯示 pricing method，搜尋同時 match label 與 meta）
  2. **廠商**（唯讀，選 BOM 後自動帶入；`ErpInput readOnly bg-muted`）
  3. **計價選擇** 區塊（含「計價方式」唯讀欄位 + 依 BOM pricingMethod 動態渲染 1~2 個 pricing_selection 下拉）
  4. **製作細節**（`ErpTextarea`）
  5. **數量**（「影響成品數量」toggle 於最前、label 左 / Switch 右；數量 + 單位兩欄 grid；工序 / 裝訂 SHALL 含「設備」欄位，材料 SHALL NOT 含設備欄位）
  6. **色數與特殊色**（僅工序分類顯示）：正 / 背面色數 input SHALL NOT 顯示；改為點擊「Pantone / 金銀白螢光 / 最低色數」按鈕累加 `specialColors` 陣列（允許重複），chip 顯示累計次數並可點 X 減一次
- Panel 欄位元件 SHALL 使用 Erp* atom/molecule 共用元件：
  - Label + field 包裝：`ErpEditFormCard.Field` / `.Row` / `.FullRow`
  - Input / Textarea / Select：`ErpInput` / `ErpTextarea` / `ErpSelect`
  - 搜尋下拉：`SearchableSelect size="panel"`
- Panel 必填欄位 SHALL 為「BOM 最末層選擇」與「數量 > 0」；未填時 SHALL 高亮提示但不禁用送出按鈕
- Panel 送出後 SHALL append 至對應分類的生產任務表格並關閉 panel；取消 SHALL 丟棄當前 draft，下次開啟時 panel 欄位 SHALL 重置為空
- 生產任務表格初始狀態無 draft 時 SHALL 顯示空狀態提示「尚無資料，點擊右上『新增一筆』開始填寫」
- Panel 新增後的既有表格列 SHALL 保留 inline 編輯能力（使用者可直接修改 cell），編輯路徑不變
- 材料分類表格 SHALL NOT 包含「設備」欄位（設備不參與材料計價）；工序 / 裝訂表格保留設備欄

**頁面層級 UI 規範**（refactor-add-production-tasks-page，2026-04-22）：
- 頁面骨架 SHALL 為 `AppLayout` → `ErpPageHeader` → `ErpSummaryGrid`（成本摘要）→ 雙欄區（左：工單資訊 + 分類 Tab / 右：拼版試算 sticky）
- `ErpPageHeader` badges SHALL 只保留印件名稱識別 badge，SHALL NOT 重複顯示成本數字（成本交由下方 `ErpSummaryGrid` 呈現）
- `ErpSummaryGrid` SHALL 緊接 `ErpPageHeader` 下方，**6 欄**依序：`設備費` / `材料小計` / `工序小計` / `裝訂小計` / `色數加價` / `總成本`
  - 每欄 value SHALL 為 `NT$ {localeNumber}`，無資料時顯示 `—`
  - 「材料小計 / 工序小計 / 裝訂小計」= 對應分類 rows 的 `unitPrice × qty` 加總
  - 「設備費」= 所有 rows 的 `setupFee` 加總（複用 `calculateSetupFee`）
  - 「色數加價」= 工序 rows 的 `colorCost` 加總（複用 `calculateColorCost`）
  - 「總成本」= 5 項加總，value SHALL 以 `text-base font-semibold tabular-nums` 加強視覺
- 工單資訊區塊 SHALL 使用 `ErpDetailCard` + `ErpInfoTable`（cols=2）；三分類 Tab 外層 SHALL 使用 `ErpDetailCard noPadding`
- 頁面非 category 色 SHALL 使用 design token（`border-border` / `text-foreground` / `bg-card` 等），SHALL NOT 寫死 hex

**表格 cell atom 規範**（add-table-form-atoms，2026-04-22）：
- 三分類生產任務表格（`MaterialSection / ProcessSection / BindingSection`）的 `<table>` SHALL 套用 `.erp-form-table` CSS class（header 灰底 / border / hover 與 `.erp-table` 視覺一致，但 padding 為密集 `6px 8px`，適合 cell 內嵌 input 的表單列場景）
- 表格 cell 內的輸入元件 SHALL 使用 Erp* atom 的 compact 變體：
  - `<input type="text">` / `<input type="number">` / `<input type="date">` → `<ErpInput size="compact">`
  - `<select>` → `<ErpSelect size="compact">`
  - 搜尋下拉仍使用 `<SearchableSelect size="compact">`（既有）
- 頁面層 SHALL NOT 定義自製 INP / SEL class 常數（例如 `const INP = 'h-7 w-full rounded...'`）
- `ErpInput` / `ErpSelect` 的 `size` prop：`'default'`（panel / form 場景，h-8 / text-sm）、`'compact'`（表格 cell 場景，h-7 / text-xs）

**單位 LOV**（`PRODUCTION_TASK_UNITS`）：`張 / 令 / 本 / 件 / 個 / 份 / 組 / 套 / 冊 / 盒 / 批 / 卷 / 面 / 塊 / 片 / 時 / 趟`；選 BOM 後系統 SHALL 自動帶入主檔單位，使用者可改選其他單位。

**分組規範**（UI 形式調整不改變分組行為）：
- 使用者點擊最終「儲存」時，系統 SHALL 依 `factory` 欄位將所有 draft rows 分組
- 同廠商之生產任務 SHALL 合併為同一 `Task`，`Task.name` SHALL 為廠商名稱

#### Scenario: US-WO-010 透過 side panel 批次新增生產任務

- **WHEN** 生管於工單的新增生產任務頁，在「材料」Tab 點擊「新增一筆」
- **THEN** 系統 SHALL 開啟材料分類的 side panel，panel 內容 SHALL 依序呈現 BOM 三層選擇（群組 / 材料 / 規格）、廠商（唯讀）、計價選擇（含計價方式）、製作細節、數量（含影響成品 toggle + 單位 LOV，材料無設備）
- **AND** 選擇製程 / BOM 後，系統 SHALL 自動篩選下層下拉選項並帶入廠商與單位
- **AND** 填寫完必填欄位後點擊「確認新增」，系統 SHALL 於「材料」Tab 表格末尾 append 新列並關閉 panel
- **AND** 重複對「工序」「裝訂」Tab 各新增數筆後點擊頁面上方「儲存」
- **AND** 系統 SHALL 依 factory 欄位將所有生產任務分組為多個 Task；同廠商之生產任務 SHALL 合併於同一 Task，Task 名稱 SHALL 為廠商名稱

#### Scenario: Panel 取消丟棄 draft

- **WHEN** 生管開啟新增 panel 填寫部分欄位後點擊「取消」
- **THEN** Panel SHALL 關閉且當前 draft SHALL NOT append 至表格
- **AND** 再次開啟同分類 panel 時，欄位 SHALL 為空（與 `emptyRow()` 一致）

#### Scenario: 表格空狀態

- **WHEN** 生管進入新增生產任務頁，三分類皆未新增任何 draft
- **THEN** 三個分類 Tab 的表格 SHALL 顯示空狀態提示「尚無資料，點擊右上『新增一筆』開始填寫」
- **AND** 任一分類新增一筆後，該分類空狀態提示 SHALL 消失

#### Scenario: 工序分類色數點擊累加

- **WHEN** 生管於工序 panel 選好設備（支援色數），在「色數與特殊色」區塊點擊「金銀白螢光」按鈕兩次
- **THEN** 系統 SHALL 將 `specialColors` 陣列 push 兩個 `metallic`，chip SHALL 顯示「金銀白螢光 × 2」
- **AND** 色數加價計算 SHALL 對每次點擊累加一次倍率（`calculateColorCost` 對陣列逐一加價）
- **WHEN** 使用者點擊 chip 右側 X
- **THEN** 系統 SHALL 從陣列移除一次該色（lastIndexOf + splice），chip 數字遞減

#### Scenario: 材料分類無設備欄

- **WHEN** 生管開啟材料分類 panel 或檢視材料分類表格
- **THEN** panel 數量區塊 SHALL NOT 顯示「設備」欄位；材料表格 SHALL NOT 包含「設備」欄
- **AND** 工序 / 裝訂分類仍 SHALL 顯示設備欄位

#### Scenario: 頁面頂部成本摘要（6 欄分項 + 總成本）

- **WHEN** 生管於新增生產任務頁尚未輸入任何 draft
- **THEN** 頁面頂部 `ErpSummaryGrid` 6 欄 SHALL 全顯示 `—`
- **WHEN** 生管於材料 Tab 新增 2 筆 draft，合計 `unitPrice × qty = NT$ 1,500`
- **THEN** 「材料小計」SHALL 顯示 `NT$ 1,500`；「總成本」SHALL 同步顯示 `NT$ 1,500`；其他 4 欄 SHALL 維持 `—`
- **WHEN** 生管再於工序 Tab 新增 1 筆 `unitPrice × qty = NT$ 800`、選設備（setupFee=NT$ 200）、色數加價 NT$ 50
- **THEN** 「工序小計」SHALL 顯示 `NT$ 800`、「設備費」SHALL 顯示 `NT$ 200`、「色數加價」SHALL 顯示 `NT$ 50`；「總成本」SHALL 顯示 `NT$ 2,550`（5 項加總）

#### Scenario: 容器與表格視覺一致性

- **WHEN** 生管進入新增生產任務頁
- **THEN** 工單資訊區塊 SHALL 以 `ErpDetailCard` + `ErpInfoTable` 樣式呈現（與工單詳情頁 / 訂單詳情頁的 Info 卡片視覺一致）
- **AND** 三分類 Tab 外層 SHALL 使用 `ErpDetailCard noPadding`
- **AND** 頁面外殼 / 容器 / label 的顏色 SHALL 由 design token 提供，不得出現字面 hex（除 P2 範圍內的 Tab / badge 色系）

#### Scenario: 表格 cell 視覺與全站一致

- **WHEN** 生管進入新增生產任務頁，檢視三分類表格
- **THEN** 表格 SHALL 有統一的 header 灰底 / border / hover 樣式（由 `.erp-form-table` 提供），與全站其他 `.erp-table` 列表頁視覺一致
- **AND** 每個 cell 的 input / select SHALL 使用 `ErpInput size="compact"` / `ErpSelect size="compact"`（高度 28px、字 12px、圓角 8px）
- **AND** 頁面內容不得出現 inline 寫死的 `h-7 border-input text-xs` input class（由 atom 統一提供）

### Requirement: QC 單建立

系統 SHALL 支援印務在工單詳情頁建立 QC 單，選擇影響成品的生產任務、填寫批次目標 QC 數量、指定 QC 人員。目標數量不得超出可申請上限。

QC 單為獨立實體（`QCRecord`），實體定位與 Data Model 詳見 [qc capability](../qc/spec.md)。工單詳情頁僅為 UI 觸發入口；QC 單實際關聯於生產任務（`production_task_id`），透過 `ProductionTask → WorkOrder` 關聯彙總至工單層。

可申請上限公式詳見 [qc capability § QC 可申請上限](../qc/spec.md)。

#### Scenario: US-WO-009 建立 QC 單
- **WHEN** 印務在工單詳情頁建立 QC 單，選擇標記為「影響成品」的生產任務，填寫批次目標 QC 數量並指定 QC 人員
- **THEN** QC 單 SHALL 建立完成並進入「待執行」狀態；批次目標 QC 數量 MUST 不超出該生產任務之可申請上限

### Requirement: QC 執行與結果記錄

系統 SHALL 支援 QC 人員執行 QC 檢驗並記錄結果，QC 完成後自動觸發工單完成度重算。

QC 單狀態機、執行流程、結果欄位（`passed_quantity` / `failed_quantity`）的權威定義詳見 [qc capability § QC 單狀態機](../qc/spec.md) 與 [qc capability § QC 結果記錄](../qc/spec.md)。本工單模組僅描述工單詳情頁的 QC 觸發與顯示路徑。

#### Scenario: US-QC-001 執行 QC 並記錄結果
- **WHEN** QC 人員進入 QC 單確認目標數量，QC 單進入「執行中」狀態，填入通過數量與不通過數量後按「提交 QC」
- **THEN** 系統 SHALL 生成 QC 紀錄，QC 單進入「已完成」狀態；系統 SHALL 自動更新工單累計入庫數量；工單完成度 MUST 正確反映最新 QC 結果

### Requirement: 印務主管印件總覽（防掉單）

系統 SHALL 提供印務主管專用的印件總覽，以印件為起點追蹤工單建立與生產狀態，確保審稿通過的印件不遺漏建立工單。

印件總覽 SHALL 使用狀態機的印製維度狀態作為篩選 Tab 與狀態顯示：等待中 / 工單已交付 / 部分工單製作中 / 製作中 / 製作完成 / 出貨中 / 已送達。不得使用非狀態機的自訂狀態標籤。

每個印件項目 SHALL 顯示：印件名稱、案名（來自所屬訂單 case_name）、客戶名稱、訂單編號、交貨日期、印製狀態、完成度、工單數量。案名、客戶、訂單編號 SHALL 為獨立欄位，不合併顯示。

當印件有多張工單時（如拆給不同印務），展開列 SHALL 列出各工單的狀態與負責印務，並顯示進度摘要（如「3/5 工單已審核完成」）。

印務主管 SHALL 可在印件總覽上執行「分配印件」操作：一次完成工單草稿建立（可多份，各自設定工單類型與 region）與印務指派。尚未建立工單的印件（等待中且工單數為 0）優先顯示。

#### Scenario: 印務主管查看待分配印件

- **WHEN** 印務主管開啟印件總覽，篩選「等待中」
- **THEN** 系統 SHALL 顯示所有印製狀態為「等待中」的印件
- **AND** 尚未建立工單的印件 SHALL 置頂顯示

#### Scenario: 印務主管分配印件

- **WHEN** 印務主管點擊某印件的「分配印件」按鈕
- **THEN** 系統 SHALL 顯示分配表單（可新增多張工單，每張設定工單類型、region 與指派印務）
- **AND** 提交後，系統建立工單草稿並記錄指派

#### Scenario: 印件跨多張工單分組顯示

- **WHEN** 某印件有多個組件，對應多張工單分別指派給不同印務
- **THEN** 展開列 SHALL 列出各工單的狀態與負責印務
- **AND** SHALL 顯示進度摘要（如「4/5 工單已審核完成」）

### Requirement: 印務主管審核待辦

印務主管 SHALL 能在印件總覽中辨識哪些工單等待其審核。印件展開後的工單列表中，狀態為「製程確認中」的工單即為待審核工單。

系統 SHALL 在印件總覽的統計區或篩選功能中，提供待審核工單數量的快速識別，讓印務主管不需逐一展開即可掌握審核待辦數量。

#### Scenario: 印務主管辨識待審核工單

- **WHEN** 印務主管在印件總覽展開某印件的工單列表
- **THEN** 狀態為「製程確認中」的工單 SHALL 以明顯視覺標記（如狀態 badge）顯示
- **AND** 印務主管點擊該工單 SHALL 可導航至工單詳情頁進行審核

#### Scenario: 印務主管查看待審核數量

- **WHEN** 印務主管開啟印件總覽
- **THEN** 系統 SHALL 在頁面統計區顯示「待審核工單」數量
- **AND** 印務主管 SHALL 可快速篩選出含有待審核工單的印件

### Requirement: 工單詳情頁任務分組呈現

系統 SHALL 在工單詳情頁以「任務（Task）」為分組單位呈現生產任務清單。任務依廠商自動分組（由生產任務的工序設定決定），印務不需手動歸入。

工單詳情頁 SHALL 包含以下區塊：
- 基本資訊（印件數量、工單類型、交期）
- 任務清單（依廠商分組，每組可展開/收合）
- 每個任務顯示：廠商名稱、工廠類別（自有/加工/外包/中國廠商）、任務狀態、交付狀態、所含生產任務列表

印務 SHALL 可在任務分組內新增、編輯、刪除生產任務。新增生產任務時，系統 SHALL 依工序設定自動歸入對應廠商的任務分組。

#### Scenario: 印務查看工單的任務分組

- **WHEN** 印務開啟工單詳情頁
- **THEN** 系統 SHALL 以任務（Task）為分組顯示生產任務，每組標示廠商名稱與工廠類別
- **AND** 每組 SHALL 可展開查看該任務下的所有生產任務

#### Scenario: 新增生產任務自動歸入任務分組

- **WHEN** 印務在工單詳情頁新增一筆生產任務，選擇的工序對應廠商為「蒝大雅」
- **THEN** 系統 SHALL 自動將該生產任務歸入「蒝大雅」任務分組
- **AND** 若該廠商尚無任務分組，系統 SHALL 自動建立新的任務分組

### Requirement: 派工板雙模式

系統 SHALL 提供印務專用的派工板，支援跨工單的全局排程與進度追蹤。派工板 SHALL 區分兩種模式：

**自有工廠模式**：設備 × 日期的排程工具。印務 SHALL 可為生產任務選擇設備並設定開工日期，系統自動推算完工日期。SHALL 提供設備負載視圖輔助排程決策。

**外包廠模式**：進度追蹤面板。印務 SHALL 可記錄各外包廠任務的預計完工日期，並追蹤實際進度。

派工板 SHALL 全局共享（非個人私有），印務可透過篩選器查看「我負責的」或全域工單。

派工板 SHALL 提供交期預警功能：當任一生產任務的預計完工日期晚於所屬印件的交貨日期時，系統 SHALL 以紅色標記該任務。工序相依性的完整視覺化（連線圖）列為 Phase 2。

生管覆蓋設備時，派工板 SHALL 在對應生產任務旁顯示「設備已由生管覆蓋」標記，含原設備與新設備資訊。

#### Scenario: 印務在派工板為自有工廠任務排程

- **WHEN** 印務在派工板查看自有工廠的待排程生產任務
- **THEN** 系統 SHALL 以設備 × 日期的時間軸呈現，印務可為生產任務設定設備與開工日期
- **AND** 系統 SHALL 即時顯示設備負載狀況

#### Scenario: 印務在派工板追蹤外包廠進度

- **WHEN** 印務在派工板查看外包廠任務
- **THEN** 系統 SHALL 顯示各廠商任務的預計完工日期與實際進度
- **AND** 印務 SHALL 可更新外包廠的預計完工日期

#### Scenario: 派工板交期預警

- **WHEN** 某生產任務的預計完工日期晚於所屬印件的交貨日期
- **THEN** 系統 SHALL 以紅色標記該生產任務
- **AND** SHALL 顯示超期天數

#### Scenario: 派工板顯示生管設備覆蓋標記

- **WHEN** 生管已覆蓋某生產任務的設備（actual_equipment != planned_equipment）
- **THEN** 派工板 SHALL 在該任務旁顯示「設備已覆蓋：大台→小台」標記
- **AND** 印務 SHALL 可查看覆蓋詳情但 MUST NOT 修改 actual_equipment

#### Scenario: 印務篩選派工板視角

- **WHEN** 印務在派工板使用篩選器選擇「我負責的」
- **THEN** 系統 SHALL 僅顯示該印務負責的工單下的生產任務
- **AND** 印務 SHALL 可切換至全域視角查看所有工單的排程

### Requirement: 任務獨立交付操作

系統 SHALL 支援印務在派工板或工單詳情頁對各任務（Task）執行獨立交付。交付操作不再以工單為整體單位，而是以任務為單位。

自有工廠任務交付後 SHALL 通知生管接收；外包廠任務交付後 SHALL 通知對應廠商。

交付前置條件：該任務下所有生產任務均已設定開工日期（自有工廠需設定設備，外包廠需設定預計完工日期）。

#### Scenario: 印務交付單一任務

- **WHEN** 印務在派工板選擇某任務點擊「交付」，該任務下所有生產任務均已設定排程
- **THEN** 該任務狀態 SHALL 從「待交付」轉為「已交付」
- **AND** 若為自有工廠任務，系統 SHALL 通知生管接收
- **AND** 若為外包廠任務，系統 SHALL 通知對應廠商

#### Scenario: 同一工單的任務部分交付

- **WHEN** 某工單有 5 個任務，印務已交付其中 3 個，另 2 個仍在排程中
- **THEN** 系統 SHALL 允許部分交付，已交付任務進入下游流程，未交付任務不受影響

#### Scenario: 首個任務交付觸發工單狀態推進

- **WHEN** 某工單的首個任務被交付（工單之前狀態為「製程審核完成」）
- **THEN** 工單狀態 SHALL 推進為「工單已交付」
- **AND** 後續任務交付時工單狀態 MUST NOT 重複推進

### Requirement: 任務交付與接收
系統 SHALL 支援印務完成工單後交付任務，由生管確認接收，系統記錄接收時間與操作者。

#### Scenario: US-TA-001 接收任務（確認工單任務交付）
- **WHEN** 印務完成工單後執行「交付任務」，系統通知生管，生管確認接收
- **THEN** 系統 SHALL 記錄生管已確認接收；系統 MUST 記錄接收時間與操作者資訊

### Requirement: 工單區域設定

系統 SHALL 在建立工單時要求設定 region（台灣/中國），作為該工單下生產任務可用工廠類別的篩選依據。region 設定後不可變更。

#### Scenario: 印務主管建立台灣工單

- **WHEN** 印務主管建立工單並設定 region 為「台灣」
- **THEN** 系統 SHALL 記錄工單 region 為台灣
- **AND** 該工單下新增生產任務時，factory_type 僅可選擇：自有工廠、加工廠、外包廠

#### Scenario: 印務主管建立中國工單

- **WHEN** 印務主管建立工單並設定 region 為「中國」
- **THEN** 系統 SHALL 記錄工單 region 為中國
- **AND** 該工單下新增生產任務時，factory_type 僅可選擇：中國廠商

#### Scenario: 同一印件拆分台灣與中國工單

- **WHEN** 印務主管為同一印件建立多張工單，其中 2 張 region 為台灣、1 張 region 為中國
- **THEN** 系統 SHALL 允許同一印件下存在不同 region 的工單
- **AND** 齊套性計算 SHALL 不區分 region，仍以所有工單的 min() 計算

#### Scenario: region 設定後不可變更

- **WHEN** 工單 region 已設定，印務嘗試修改 region
- **THEN** 系統 MUST 阻擋修改，region 為唯讀欄位

### Requirement: 印務印件篩選

系統 SHALL 在印件總覽提供「只顯示我參與的印件」篩選功能，讓印務快速查看自己負責的工單所屬印件。

#### Scenario: 印務篩選參與的印件

- **WHEN** 印務在印件總覽開啟「只顯示我參與的印件」篩選
- **THEN** 系統 SHALL 僅顯示印件下有任何 WorkOrder.assigned_to 等於當前印務的印件
- **AND** 印件展開後 SHALL 顯示該印件下所有工單（含其他印務負責的工單）的狀態與進度

#### Scenario: 印務查看跨印務協作的印件

- **WHEN** 印件 A 下有工單 1（印務甲負責）和工單 2（印務乙負責），印務甲使用篩選
- **THEN** 印務甲 SHALL 可看到印件 A
- **AND** 印件 A 展開後 SHALL 顯示工單 1 和工單 2 的狀態
- **AND** 印務甲 SHALL 可查看工單 2 的進度但 MUST NOT 編輯工單 2 的內容

### Requirement: 設備預計成本彙總

系統 SHALL 在工單詳情頁顯示「設備預計成本」Section，彙總該工單下所有生產任務的設備預計成本。成本資料來源為各生產任務的 estimated_equipment_cost（定義於[生產任務 spec](../production-task/spec.md) § 設備預計成本計算），不在工單層額外儲存。

Section 內容 SHALL 包含：
- 表格：每筆生產任務的工序名稱、設備名稱、顏色選項摘要、預計成本
- 僅列出 estimated_equipment_cost > 0 的生產任務
- 底部顯示合計金額
- 設備未指定的生產任務顯示「待排程」，不計入合計

#### Scenario: 印務查看工單設備成本彙總

- **WHEN** 印務在工單詳情頁查看「設備預計成本」Section
- **THEN** 系統 SHALL 列出每筆有成本的生產任務：工序名稱、設備名稱、顏色選項摘要、預計成本
- **AND** 底部 SHALL 顯示所有生產任務的預計成本合計

#### Scenario: 部分生產任務尚未排程

- **WHEN** 工單下有 3 筆生產任務，其中 1 筆尚未指定設備
- **THEN** 已指定設備的 2 筆 SHALL 顯示預計成本
- **AND** 未指定設備的 1 筆 SHALL 顯示「待排程」
- **AND** 合計金額僅包含已計算的 2 筆

#### Scenario: 所有生產任務皆無顏色選項

- **WHEN** 工單下所有生產任務均未勾選任何顏色選項
- **THEN** 「設備預計成本」Section SHALL 顯示「尚無成本資料」

---

### Requirement: BOM 行項目管理

系統 SHALL 支援工單下的印件（PrintItem）以 `BOMLineItem` 資料表記錄 BOM 行項目。每筆 BOMLineItem 對應一項 BOM 類型（材料 / 工序 / 裝訂），透過 `bom_type` + 三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）指向 BOM 底層 master（material-master / process-master / binding-master）的對應記錄。

#### Scenario: BOMLineItem 多形引用三個 master

- **WHEN** 印件定義其所需的材料 / 工序 / 裝訂
- **THEN** 系統 SHALL 為每項 BOM 建立一筆 BOMLineItem
- **AND** 依 BOM 類型設定 `bom_type`，指向對應 master 的 FK；其餘兩個 FK MUST 為 null

#### Scenario: BOMLineItem 記錄預計用量與產線

- **WHEN** 印件填入 BOM 行項目
- **THEN** 每筆 BOMLineItem SHALL 記錄：`quantity_per_work_order`（每份工單的預計用量）、`factory_type`（工廠類別）、`production_line_id`（產線 FK）
- **AND** 產線 SHALL 依 factory_type 自動帶入：外包廠 -> 外包廠產線；中國廠商 -> 中國廠商產線；自有 / 加工廠 -> 對應的自有產線

### Requirement: 詳情頁 Tab 使用共用元件

工單詳情頁的 Tab 切換（切換內容區：生產任務 / QC 記錄 / 異動紀錄 / 活動紀錄）SHALL 使用 `ErpDetailTabs` 共用元件，與需求單詳情頁 Tab 同一元件來源。

共用元件外觀規範由 DESIGN.md §1.4 Organism 清單與 §1.4.4 決策樹定義；本 requirement 確保工單詳情頁不再手寫 Tabs + TabsList + TabsTrigger 的 class 組合。

#### Scenario: 工單詳情頁 Tab 使用 ErpDetailTabs

- **WHEN** 使用者進入工單詳情頁
- **THEN** 頁面 Tab 區域 SHALL 由 `ErpDetailTabs` 元件渲染，DOM 結構包含外層卡片容器、底線式 TabsList、共用 body padding（與需求單詳情頁 Tab 一致）
- **AND** 頁面程式碼中 SHALL NOT 手寫 `<Tabs>` + `<TabsList>` + `<TabsTrigger>` 的 class 組合（由 `ErpDetailTabs` 元件統一提供）

### Requirement: 依 BOM 展開生產任務時帶入 BOM 引用欄位

系統 SHALL 於工單依 BOM 展開生產任務時，為每筆 BOMLineItem 產生一筆 ProductionTask，並將下列欄位從 BOMLineItem 複製或衍生至 ProductionTask：`bom_type`、三個互斥 FK（`material_spec_id` / `process_id` / `binding_id`）、`production_line_id`、`factory_type`。

展開後，系統 SHALL 為每筆 ProductionTask 依印件內容（尺寸、印量、拼版結果、裝訂所需台數 / 頁數 / 本數）計算 `pricing_selection_default`，並初始化 `pricing_selection = pricing_selection_default`、`pricing_selection_overridden = false`。

現階段（排程模組上線前）`pricing_selection_default` 為 null，`pricing_selection` 由印務手動輸入、`pricing_selection_overridden = true`（詳見 production-task spec § pricing_selection 混合帶入）。

#### Scenario: 工單自動展開帶入 BOM 引用

- **WHEN** 系統依印件的 BOMLineItem 清單展開建立生產任務
- **THEN** 每筆生產任務 SHALL 複製對應 BOMLineItem 的 `bom_type` 與三個互斥 FK
- **AND** `production_line_id` 與 `factory_type` SHALL 從 BOMLineItem 帶入
- **AND** 展開後 BOMLineItem 與 ProductionTask 之間 SHALL 維持可追溯的關聯（FK 或 source_bom_line_item_id）

#### Scenario: 排程模組上線時自動計算 pricing_selection_default

- **WHEN** 排程模組上線並開立生產任務
- **THEN** 系統 SHALL 依印件內容計算 pricing_selection_default 並寫入生產任務
- **AND** pricing_selection 初始值 SHALL 等於 pricing_selection_default
- **AND** pricing_selection_overridden SHALL 預設為 false

#### Scenario: 現階段展開後使用者手動輸入 pricing_selection

- **WHEN** 排程模組尚未上線，工單展開生產任務後
- **THEN** pricing_selection_default SHALL 為 null
- **AND** pricing_selection SHALL 等待印務手動輸入，pricing_selection_overridden SHALL 預設為 true

## Data Model

來源：本 spec § Data Model 為正本；Notion [資料欄位 DB](https://www.notion.so/32c3886511fa803e9f30edbb020d10ce) 為發布版本

### WorkOrder

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工單編號 | wo_no | 字串 | Y | Y | 系統自動產生，格式 W-[YYYYMMDD]-[NN] |
| 印件 | print_item_id | FK | Y | Y | FK -> 印件 |
| 工單類型 | type | 單選 | Y | | 打樣 / 大貨 |
| 區域 | region | 單選 | Y | Y | 台灣 / 中國（建立時設定，不可變更） |
| 工單狀態 | status | 單選 | Y | | 依狀態機定義 |
| 負責人 | assigned_to | FK | Y | | 負責排程人員 |
| 每份印件生產數量 | quantity_per_print_item | 小數 | Y | | 每份印件需生產數量 |
| 目標數量 | wo_target_qty | 整數 | Y | | 工單目標生產數量 |
| 生產數量 | wo_produced_qty | 整數 | | Y | 報工累計 |
| 入庫數量 | wo_warehouse_qty | 整數 | | Y | QC 通過，齊套性邏輯計算結果 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

### WorkOrderModification

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工單 | work_order_id | FK | Y | Y | FK → WorkOrder |
| 異動類型 | modification_type | 單選 | Y | Y | 不需重新審核 / 需重新審核 |
| 異動原因 | reason | 文字 | Y | | 印務填寫的異動原因 |
| 異動內容說明 | content | 文字 | Y | | 印務填寫的異動內容說明 |
| 生產任務變化快照 | pt_snapshots | JSON | Y | Y | ModificationPTSnapshot[]：每筆生產任務的 changeType（新增/修改/作廢/報廢/不變）、欄位快照、修改前值 |
| 發起人 | initiated_by | FK | Y | Y | FK → 使用者（印務） |
| 發起時間 | initiated_at | 日期時間 | Y | Y | |
| 確認人 | confirmed_by | FK | | Y | FK → 使用者（生管） |
| 確認時間 | confirmed_at | 日期時間 | | Y | |
| 發起時工單狀態 | source_status | 單選 | Y | Y | 工單已交付 / 製作中 |
| 建立時間 | created_at | 日期時間 | Y | Y | |

### QCRecord

QCRecord 欄位定義詳見 [qc capability § ADDED Data Model § QCRecord](../qc/spec.md)。本模組不重複定義欄位；工單相關 UI 顯示（QC 單列表、批次目標 vs 累計通過數）透過 `ProductionTask → WorkOrder` 關聯彙總取得。

（原 QCDetail 空殼實體已於 qc-spec-consolidation change 移除，不保留於 qc spec。未來若需逐件判定、缺陷代碼分類、抽樣規則等進階功能，另開 change 於 qc capability 新增。）

---

## Phase 2 預留功能

- 生管排程視覺化看板
- 師傅報工端介面
- 生產效率 Dashboard
- 外包廠/中廠完整狀態追蹤介面
- 工單負載視覺化
- 急單插入排程
