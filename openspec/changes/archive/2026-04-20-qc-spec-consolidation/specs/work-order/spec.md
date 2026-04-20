## MODIFIED Requirements

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
