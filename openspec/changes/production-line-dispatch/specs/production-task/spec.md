## MODIFIED Requirements

### Requirement: 產線支援

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

### Requirement: 生管日程執行面板

系統 SHALL 提供生管專用的日程執行面板，僅顯示自有工廠的生產任務。面板以日期為主軸，分為四個功能區，並提供產線篩選器：

1. **待分派區**：已交付且預計開工日期為當天或更早（或被標記為提前分派）的生產任務，依工序 x 生產任務內容分組。逾期超過 3 天的任務 SHALL 以紅色標籤標記。排序規則：交貨日期 > 開工日期 > 建立時間
2. **進行中區**：已指派師傅的生產任務，依師傅分組。區分兩種視覺狀態：「已指派未開工」（assigned_operator 有值但狀態仍為待處理，灰色）與「製作中」（狀態為製作中，藍色）
3. **即將到來區**：預計開工日期在明天及之後的已交付生產任務
4. **異動確認區**：需要生管確認的異動項目，區分工單層異動與任務層異動

面板 SHALL 提供產線篩選器，生管可選擇特定產線僅顯示該產線的任務。篩選器 SHALL 記住生管上次選擇的產線偏好（使用者端持久化），下次開啟時自動套用。

每筆生產任務 SHALL 顯示生產任務細節（工序相關的 A/B/C 群組關鍵欄位：紙材、印刷色數、加工方式等），讓生管知道該任務實際要做什麼。

#### Scenario: 生管查看今日待分派任務

- **WHEN** 生管開啟日程執行面板
- **THEN** 系統 SHALL 自動套用上次選擇的產線篩選（若有）
- **AND** 系統 SHALL 在待分派區顯示所有已交付且（預計開工日期 <= 今天 或 is_early_dispatched = true）的自有工廠生產任務
- **AND** 生產任務 SHALL 依工序 x 生產任務內容分組呈現，排序依交貨日期優先
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
