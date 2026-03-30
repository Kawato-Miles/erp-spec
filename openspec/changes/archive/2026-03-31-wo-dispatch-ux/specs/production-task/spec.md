## ADDED Requirements

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

## Data Model 變更

### ProductionTask 欄位異動

| 異動 | 欄位 | 英文名稱 | 型別 | 必填 | 說明 |
|------|------|----------|------|------|------|
| 重新命名 | 計畫設備 | planned_equipment | 字串 | | 原 equipment，印務排程時設定 |
| 新增 | 實際設備 | actual_equipment | 字串 | | 生管分派時可覆蓋，預設 = planned_equipment |
| 新增 | 指派師傅 | assigned_operator | FK | | 生管指派的師傅（FK → 使用者），僅生管可編輯 |
| 新增 | 提前分派 | is_early_dispatched | 布林值 | Y | 預設 false，生管提前拉入時設為 true |
| 新增 | 實際開工日 | actual_start_date | 日期 | | 生管分派時自動填入當天日期 |

## MODIFIED Requirements

### Requirement: 生管接收與分派

系統 SHALL 支援生管在日程執行面板查看已交付任務清單，依工序 × 生產任務內容分組，決定合批分派給師傅的時機。

生管接收已交付任務後 SHALL 可執行以下操作：
- 勾選多筆同工序的生產任務合批指派給師傅
- 變更印務排程時設定的設備（建議值→實際值）
- 將即將到來的任務提前拉入當天分派

#### Scenario: 生管接收任務

- **WHEN** 生管在日程面板查看待分派區
- **THEN** 系統 SHALL 顯示所有已交付的自有工廠生產任務，依工序 × 生產任務內容分組
- **AND** 生管 SHALL 可勾選多筆任務合批指派給師傅

#### Scenario: 生管確認分派

- **WHEN** 生管勾選生產任務並指派師傅後確認
- **THEN** 系統 SHALL 記錄 assigned_operator、actual_start_date
- **AND** 被分派的生產任務移入進行中區，以灰色（已指派未開工）呈現
- **AND** 生產任務狀態維持「待處理」不變

#### Scenario: US-PT-002 分派生產任務

- **WHEN** 生管進入日程面板的待分派區，評估各工序產能後將生產任務分派給對應師傅
- **THEN** 系統 SHALL 記錄 assigned_operator，師傅收到通知或由生管以工作單通知
- **AND** 所有生產任務 MUST 分派完畢後，生管可在進行中區查看各任務進度狀態

### Requirement: 生產任務狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 生產任務定義的規則進行狀態轉換。自有工廠路徑：待處理 → 製作中 → 已完成。生管指派師傅為欄位更新（assigned_operator），不觸發狀態變更。

#### Scenario: 自有工廠路徑

- **WHEN** 生產任務由自有工廠執行
- **THEN** 狀態路徑 SHALL 為：待處理 → 製作中 → 已完成
- **AND** 「製作中」由首次報工觸發

#### Scenario: 外包廠路徑

- **WHEN** 生產任務由外包廠執行
- **THEN** 狀態路徑維持不變：待處理 → 製作中 → 運送中 → 已完成

#### Scenario: 生產任務作廢（未進入生產）

- **WHEN** 生管在生產任務尚未進入「製作中」時取消
- **THEN** 狀態轉為「已作廢」（無成本）
