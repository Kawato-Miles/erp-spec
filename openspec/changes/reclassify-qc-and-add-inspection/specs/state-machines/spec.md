## MODIFIED Requirements

### Requirement: 完成度計算（齊套性邏輯 Kitting Logic）

工單完成度 SHALL 以下列公式計算：

`floor(min over affects_product production PT (pt_effective_qty / qpwo))`

其中 `pt_effective_qty` 定義（依 production PT 的 `requires_inspection` 屬性而定）：

- 若 `requires_inspection = TRUE`：`pt_effective_qty` = 對應 inspection PT（type = `inspection`）的 `pt_qc_passed`（= 所有已完成 inspection WorkRecord 的 passed_quantity 加總）
- 若 `requires_inspection = FALSE`：`pt_effective_qty` = `pt_produced_qty`（production PT 自身報工累計）

`pt_effective_qty` 與 `pt_qc_passed` 的正式欄位定義詳見 [production-task spec § QC / 品檢 PT 完成判定與累計](../production-task/spec.md)。

此計算 MUST 基於累加邏輯，不需序列化。

**入庫公式**：C1 過渡期沿用既有「`pi_warehouse_qty = 工單完成度 × qppi`」（聚合至印件層）；C4 `move-warehousing-to-print-item-layer` 後，`pi_warehouse_qty` 改為「印件對應的 QC PT（type = `qc`、scope = `print_item`）通過數量加總」，本 Requirement 公式將進一步調整。

#### Scenario: 工單完成度計算範例（皆 requires_inspection = TRUE）

- **WHEN** 某工單有 2 個影響成品的 production PT：A（requires_inspection = TRUE）與 B（requires_inspection = TRUE）
- **AND** A 的 inspection PT.pt_qc_passed = 120、A.qpwo = 50
- **AND** B 的 inspection PT.pt_qc_passed = 90、B.qpwo = 50
- **THEN** 工單完成度 SHALL 為 floor(min(120/50, 90/50)) = floor(min(2.4, 1.8)) = floor(1.8) = 1

#### Scenario: 工單完成度計算範例（混合 requires_inspection）

- **WHEN** 某工單有 production PT：A（requires_inspection = TRUE，inspection PT.pt_qc_passed = 1000）與 B（requires_inspection = FALSE，pt_produced_qty = 1000）、皆 qpwo = 1
- **THEN** 工單完成度 SHALL 為 floor(min(1000/1, 1000/1)) = 1000

#### Scenario: 異動期間完成度計算持續運作

- **WHEN** 工單處於異動流程中
- **THEN** 完成度計算 SHALL 持續運作，不因異動狀態而暫停

#### Scenario: 打樣工單完成度獨立計算

- **WHEN** 工單為打樣工單
- **THEN** 其完成度 SHALL 獨立計算，不納入正式工單的完成度統計
