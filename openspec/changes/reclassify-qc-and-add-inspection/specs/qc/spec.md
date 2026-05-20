## REMOVED Requirements

### Requirement: QC 單實體定位

**Reason**: QCRecord 獨立實體廢止；QC 業務語意重新定義為「印件出貨前入庫檢查」（每個 PrintItem 強制 1 個），對應 ProductionTask（`type = qc`、`scope = print_item`）。

**Migration**: 詳見 [production-task spec § QC PT 自動建立（每印件強制 1 個）](../production-task/spec.md)。既有 `QCRecord.production_task_id` 引用語意不再適用（QC PT 不對應單一 production PT，而是涵蓋整個印件下所有 affects_product production PT）。

### Requirement: QC 單狀態機

**Reason**: QC 狀態 = ProductionTask 狀態，不再保留獨立狀態機。

**Migration**: 適用 ProductionTask 狀態機，詳見 [state-machines spec](../../state-machines/spec.md)。C1 暫沿用既有 ProductionTask 狀態節點，狀態節點本身調整（例如移除「製作中」）由 C2 `simplify-production-task-completion` 處理。

### Requirement: QC 單建立流程

**Reason**: QC PT 由系統在工單規劃完成後自動建立（每印件 1 個），不再由印務手動建立。

**Migration**: 詳見 [production-task spec § QC PT 自動建立](../production-task/spec.md)。

### Requirement: QC 可申請上限

**Reason**: QC 重新定義為印件層、每印件強制 1 個，原「同一 production PT 多個 QC 紀錄」的「可申請上限」概念不再適用。分批驗收改透過多筆 ProductionTaskWorkRecord 累計實現。

**Migration**: 詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)。每筆 WorkRecord 的 `reported_quantity` 上限由 QC 人員自主判斷（看儀表板的上游通過數量與已驗數量），不走系統強制機制。

### Requirement: QC 結果記錄

**Reason**: 結果欄位（`passed_quantity` / `failed_quantity`）遷至 ProductionTaskWorkRecord。

**Migration**: 詳見 [production-task spec § ProductionTaskWorkRecord 結果欄位](../production-task/spec.md)。

### Requirement: QC 通過數與入庫數量的分層定義

**Reason**: 分層定義拆解至不同 spec：
- `pt_qc_passed` 公式遷至 production-task spec
- `wo_warehouse_qty` / `pi_warehouse_qty` 公式由 C4 `move-warehousing-to-print-item-layer` 重新定義（入庫公式改為基於印件層 QC PT 通過數量）

**Migration**:
- `pt_qc_passed` 公式：[production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)
- `wo_warehouse_qty` / `pi_warehouse_qty`：C1 過渡期沿用既有 [state-machines § 完成度計算（齊套性邏輯 Kitting Logic）](../../state-machines/spec.md)；C4 後變更為印件層 QC 通過數量

### Requirement: QC 完成觸發 pt_qc_passed 更新

**Reason**: 觸發機制遷至 ProductionTask 框架。

**Migration**: 詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)。

### Requirement: 異動期間 QC 行為

**Reason**: 業務邏輯遷至 ProductionTask 框架統一定義；C3 `add-production-task-rework` 處理任務異動細節時會一併重新驗證。

**Migration**:
- C1 過渡期：既有 production-task spec § 任務異動管理 與 § 異動期間生產任務行為 涵蓋 ProductionTask（含 type = `qc` / `inspection`）的異動行為
- C3 後：補生產 / Rework 副流程取代部分既有異動處理

### Requirement: QC 與出貨的關聯

**Reason**: 出貨關聯規則由 business-processes spec § 入庫與出貨數量規則 定義；C4 後入庫公式變更為印件層 QC 通過數量。

**Migration**: 詳見 [business-processes spec](../../business-processes/spec.md)（C4 後內容更新）；分批出貨節點相關 OQ-SHP-005 留 C4 釐清。

## MODIFIED Requirements

### Requirement: QC 角色權限邊界

QC 角色（兼任品檢執行）SHALL 執行 ProductionTask 中 type = `qc`（印件入庫檢查）或 `inspection`（工序中間品檢）的任務。完整的 QC 角色權限定義（工單模組 R/W 範圍、可編輯欄位）詳見 [user-roles § QC 角色編輯限制](../../user-roles/spec.md)，本 spec 不重複定義。

QC 角色於 QC PT 與 inspection PT 生命週期中的可執行動作：

- MUST NOT 建立 QC PT（由系統自動建立，每個 PrintItem 1 個）
- MUST NOT 建立 inspection PT（由印務在工單規劃時對特定 production PT 加入）
- 開始執行 QC / inspection 任務（接派工 → 狀態轉「製作中」）
- 提交 ProductionTaskWorkRecord（填寫 `reported_quantity` + `passed_quantity`，系統自動計算 `failed_quantity`）
- 多次提交 WorkRecord 累計（支援分批驗收）

#### Scenario: QC 人員接手 QC PT 並分批驗收

- **WHEN** QC 人員登入系統並查看被指派的 QC PT（type = `qc`、scope = `print_item`、target = 500）
- **THEN** 系統 SHALL 允許 QC 人員開始驗收
- **AND** QC 人員 SHALL 可依儀表板上的「上游通過數量」分批提交 WorkRecord（如：第 1 筆 reported=100/passed=100、第 2 筆 reported=400/passed=400）
- **AND** QC 人員 MUST NOT 修改 PT 的 `pt_target_qty` 或 `assigned_operator`

#### Scenario: QC 人員接手 inspection PT

- **WHEN** QC 人員登入並查看被指派的 inspection PT（type = `inspection`、scope = `work_order_task`）
- **THEN** 系統 SHALL 允許 QC 人員開始驗收
- **AND** QC 人員 SHALL 提交 WorkRecord（reported_quantity + passed_quantity）
- **AND** QC 人員 MUST NOT 修改 PT 的 `pt_target_qty` 或 `assigned_operator`
