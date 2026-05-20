# qc Specification

## Purpose
TBD - created by archiving change qc-spec-consolidation. Update Purpose after archive.
## Requirements
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

