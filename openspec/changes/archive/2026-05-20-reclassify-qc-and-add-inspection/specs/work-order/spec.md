## MODIFIED Requirements

### Requirement: QC 單建立

系統 SHALL 支援印務在工單詳情頁派工 QC PT，選擇影響成品的生產任務、指派 QC 人員。

依 reclassify-qc change，**QC 已不再為獨立實體**（`QCRecord` 廢止）：QC 重新定義為 `ProductionTask`（`type = qc`、`scope = print_item`），每個印件強制 1 個由系統於工單規劃完成時自動建立。工單詳情頁的「QC 任務列表」UI 顯示 SHALL 透過該工單下所有印件對應的 QC ProductionTask 彙總（依 `ProductionTask.work_order_id` + `type = qc` 篩選），不再經過 `QCRecord` 中介。

印務於工單詳情頁的動作從「建立 QC 單」改為「派工 QC PT」：選擇影響成品的生產任務、指派 QC 人員（`assigned_operator`）；QC PT 的 `pt_target_qty` 預設為印件預計總數量（`pi_planned_qty`），不可由印務手動設定（依 reclassify-qc 設計）。詳見 [production-task spec § QC PT 自動建立](../production-task/spec.md) 與 [production-task spec § 印務指派 QC 執行者](../production-task/spec.md)。

#### Scenario: US-WO-009 派工 QC PT

- **WHEN** 印務在工單詳情頁選擇某印件的 QC PT、指派 QC 人員為 `assigned_operator`
- **THEN** QC PT 從「待派工」轉「已派工」狀態
- **AND** 該 QC PT 的 `pt_target_qty` SHALL 等於對應印件的 `pi_planned_qty`（自動帶入）
- **AND** QC PT SHALL 出現在被指派 QC 人員的派工板待辦清單

### Requirement: QC 執行與結果記錄

系統 SHALL 支援 QC 人員執行 QC 檢驗並記錄結果，QC 完成後自動觸發工單完成度重算。

依 reclassify-qc change，QC 執行邏輯統一進 ProductionTask 框架：

- **QC PT 狀態機** = ProductionTask 狀態機（QC 不再有獨立狀態機）
- **QC 結果欄位**（`passed_quantity` / `failed_quantity`）寫入 `ProductionTaskWorkRecord`（`type = qc`）
- **QC PT 達標**（`pt_qc_passed >= pt_target_qty`）時系統 SHALL 自動觸發工單完成度重算（依齊套規則）
- **失敗時自動建 NCR**：`failed_quantity > 0` 時系統自動建立 NCR、status = pending、通知印務做 Disposition（rework / use_as_is / scrap）

詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md) 與 [production-task spec § NCR 實體](../production-task/spec.md)。

#### Scenario: US-QC-001 執行 QC 並記錄結果

- **WHEN** QC 人員進入 QC PT、確認目標數量、填入通過數量與不通過數量後提交 WorkRecord
- **THEN** 系統 SHALL 建立 ProductionTaskWorkRecord（`type = qc`、`passed_quantity`、`failed_quantity`）
- **AND** 若 `pt_qc_passed >= pt_target_qty`，QC PT 標記達標
- **AND** 若 `failed_quantity > 0`，系統 SHALL 自動建立 NCR、status = pending
- **AND** 系統 SHALL 自動觸發工單完成度重算；工單完成度 MUST 正確反映最新 QC 結果
