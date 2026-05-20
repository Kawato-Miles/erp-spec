## MODIFIED Requirements

### Requirement: 四層計算精確流程

系統 MUST 依照以下四層流程計算印件完成數，每層結果向上傳遞：

- 層級 1 生產任務層：`pt_qc_passed = sum(ProductionTaskWorkRecord.passed_quantity where production_task_id = pt.id AND status = '已完成' AND type IN ('qc', 'inspection'))`，加總該生產任務所有 QC / 品檢 WorkRecord 通過數量（依 reclassify-qc change QCRecord 廢止後修正：QC 結果由 ProductionTaskWorkRecord 承載，type=qc 為印件層、type=inspection 為工序層）
- 層級 2 任務層：篩選 affects_product = TRUE 的生產任務 -> 計算 pt_completion_ratio = floor(pt_qc_passed / pt.quantity_per_work_order) -> task_completion = min(所有 completion_ratio)，取最小值（齊套性邏輯）
- 層級 3 工單層：wo_completion = min(該工單下所有任務的 task_completion)
- 層級 4 印件層：wo_completion_ratio = floor(wo_completion / wo.quantity_per_print_item) -> pi_completion = min(所有工單的 wo_completion_ratio) -> 若 pi_completion >= 目標生產數量，則印件狀態推進為「製作完成」

#### Scenario: 簡單 1:1:1 路徑計算

- **WHEN** 印件含 1 工單（quantity_per_print_item = 1），工單含 1 任務，任務含 1 生產任務（quantity_per_work_order = 1、affects_product = TRUE），該生產任務 QC 通過數為 1000
- **THEN** 層級 1 pt_qc_passed = 1000，層級 2 task_completion = floor(1000/1) = 1000，層級 3 wo_completion = 1000，層級 4 pi_completion = floor(1000/1) = 1000

#### Scenario: 複合任務（多生產任務各自倍數）

- **WHEN** 一任務含生產任務 A（quantity_per_work_order = 2、affects_product = TRUE、QC 通過 2100）與生產任務 B（quantity_per_work_order = 1、affects_product = TRUE、QC 通過 900）
- **THEN** 層級 2 計算：A 的 completion_ratio = floor(2100/2) = 1050，B 的 completion_ratio = floor(900/1) = 900，task_completion = min(1050, 900) = 900

#### Scenario: 多工單一印件

- **WHEN** 印件含工單 A（quantity_per_print_item = 1000、wo_completion = 2100）與工單 B（quantity_per_print_item = 300、wo_completion = 700）
- **THEN** 層級 4 計算：A 的 wo_completion_ratio = floor(2100/1000) = 2，B 的 wo_completion_ratio = floor(700/300) = 2，pi_completion = min(2, 2) = 2
