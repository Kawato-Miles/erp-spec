## MODIFIED Requirements

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

### Requirement: 工單狀態機

系統 SHALL 依照[狀態機 spec](../state-machines/spec.md) § 工單定義的規則進行狀態轉換。完整狀態：草稿 → 製程確認中 → 製程審核完成 → 工單已交付 → 製作中 → 已完成/已取消。可逆狀態：重新確認製程、異動。

「異動」為工單正式狀態，可從「工單已交付」或「製作中」進入，生管確認後依異動類型返回。

#### Scenario: 工單正常完成

- **WHEN** 累計 QC 入庫 >= 工單目標生產數量
- **THEN** 系統自動將工單狀態轉為「已完成」

## ADDED Requirements

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

## Data Model Changes

### WorkOrderModification（新增資料表）

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
