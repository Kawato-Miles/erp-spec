## ADDED Requirements

### Requirement: 產線管理

系統 SHALL 支援產線（ProductionLine）作為生管分工單位。每筆生產任務可指定所屬產線，生管日程面板 SHALL 提供產線篩選。

#### Scenario: 生管篩選產線任務

- **WHEN** 生管在日程執行面板選擇產線篩選器，選擇「產線 A」
- **THEN** 系統 SHALL 僅顯示 production_line_id 對應「產線 A」的生產任務
- **AND** 其他產線的任務 SHALL 被隱藏

#### Scenario: 印務為生產任務指定產線

- **WHEN** 印務在工單詳情頁新增或編輯生產任務
- **THEN** 系統 SHALL 提供產線下拉選單供選擇（選填）
- **AND** 產線選單 SHALL 顯示所有可用產線，不受工序限制

### Requirement: 生產任務分類排序

系統 SHALL 支援生產任務依工序 category（材料/工序/裝訂）分組顯示，並支援分類內拖曳排序。排序順序記錄在 sort_order 欄位。

#### Scenario: 印務查看分類排序的生產任務

- **WHEN** 印務在工單詳情頁查看生產任務清單
- **THEN** 系統 SHALL 將生產任務依工序 category 分為三組：材料、工序、裝訂
- **AND** 各組內的生產任務 SHALL 依 sort_order 升冪排列
- **AND** 三組的顯示順序固定為：材料 → 工序 → 裝訂

#### Scenario: 印務拖曳排序生產任務

- **WHEN** 印務在工單詳情頁拖曳某生產任務至同分類內的新位置
- **THEN** 系統 SHALL 更新該分類內所有受影響生產任務的 sort_order
- **AND** 拖曳 MUST 限制在同一 category 內，不可跨分類

#### Scenario: 新增生產任務時自動設定 sort_order

- **WHEN** 印務新增一筆生產任務，該工序的 category 為「工序」
- **THEN** 系統 SHALL 將新任務的 sort_order 設為該 category 內現有最大值 + 1
- **AND** 新任務 SHALL 出現在「工序」分類的最後一筆

### Requirement: 生產任務詳情顯示稿件

系統 SHALL 在生產任務詳情頁顯示所屬印件的稿件檔案列表與成品縮圖。稿件資料引用自 PrintItem，不在生產任務層獨立維護。

#### Scenario: 生管查看生產任務的稿件

- **WHEN** 生管在生產任務詳情頁查看稿件區塊
- **THEN** 系統 SHALL 顯示該生產任務所屬印件的稿件檔案列表
- **AND** 系統 SHALL 顯示印件的成品縮圖（thumbnail_url）
- **AND** 最終版稿件（is_final = true）SHALL 以醒目標記顯示

## MODIFIED Requirements

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

### Requirement: 生管日程執行面板

系統 SHALL 提供生管專用的日程執行面板，僅顯示自有工廠的生產任務。面板以日期為主軸，分為四個功能區，並提供產線篩選器：

1. **待分派區**：已交付且預計開工日期為當天或更早（或被標記為提前分派）的生產任務，依工序 × 生產任務內容分組。逾期超過 3 天的任務 SHALL 以紅色標籤標記。排序規則：交貨日期 > 開工日期 > 建立時間
2. **進行中區**：已指派師傅的生產任務，依師傅分組。區分兩種視覺狀態：「已指派未開工」（assigned_operator 有值但狀態仍為待處理，灰色）與「製作中」（狀態為製作中，藍色）
3. **即將到來區**：預計開工日期在明天及之後的已交付生產任務
4. **異動確認區**：需要生管確認的異動項目，區分工單層異動與任務層異動

面板 SHALL 提供產線篩選器，生管可選擇特定產線僅顯示該產線的任務。

每筆生產任務 SHALL 顯示生產任務細節（工序相關的 A/B/C 群組關鍵欄位：紙材、印刷色數、加工方式等），讓生管知道該任務實際要做什麼。

#### Scenario: 生管查看今日待分派任務

- **WHEN** 生管開啟日程執行面板
- **THEN** 系統 SHALL 在待分派區顯示所有已交付且（預計開工日期 <= 今天 或 is_early_dispatched = true）的自有工廠生產任務
- **AND** 生產任務 SHALL 依工序 × 生產任務內容分組呈現，排序依交貨日期優先
- **AND** 每筆生產任務 MUST 顯示：任務編號、所屬工單、印件名稱、目標數量、生產任務細節（紙材/印刷色數/加工方式等）
- **AND** 逾期超過 3 天的任務 MUST 以紅色標籤標記

#### Scenario: 生管依產線篩選任務

- **WHEN** 生管在日程面板使用產線篩選器選擇「產線 A」
- **THEN** 系統 SHALL 在所有功能區（待分派、進行中、即將到來、異動確認）僅顯示 production_line_id 為「產線 A」的任務
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

## MODIFIED Data Model

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
| 指派師傅 | assigned_operator | FK | | | 生管指派的師傅（FK -> 使用者），僅生管可編輯 |
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
| 報價退回原因 | quote_reject_reason | 文字 | | | |
| 產線 | production_line_id | FK | | | FK -> ProductionLine（選填） |
| 排序序號 | sort_order | 整數 | Y | | 分類內的排序序號 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

## ADDED Data Model

### ProductionLine

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 產線名稱 | name | 字串 | Y | | |
| 排序 | sort_order | 整數 | Y | | 下拉選單顯示順序 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**種子資料：**

| name | sort_order |
|------|------------|
| 裝訂線 | 1 |
| 壓克力線 | 2 |
| 廠務 | 3 |
| 杯墊線 | 4 |
| 馬克杯線 | 5 |
| 手工線 | 6 |
| 數位線 | 7 |
| 全客製化品相 | 8 |
| 台灣外包 | 9 |
| 中國外包 | 10 |

### Process

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| ID | id | UUID | Y | Y | 主鍵 |
| 工序名稱 | name | 字串 | Y | | |
| 分類 | category | 單選 | Y | | 材料 / 工序 / 裝訂 |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |
