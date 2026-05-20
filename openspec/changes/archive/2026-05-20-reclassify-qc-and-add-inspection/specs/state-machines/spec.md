## MODIFIED Requirements

### Requirement: 跨實體狀態向上傳遞鏈

當下層實體狀態變更時，系統 SHALL 依以下傳遞鏈自動推進上層實體狀態：

`type = production` 的生產任務（製作中）→ 任務 → 工單 → 印件 → 訂單

生管指派師傅（更新 assigned_operator）MUST NOT 觸發向上傳遞。僅 `type = production` 的生產任務進入「製作中」時 SHALL 觸發向上傳遞。

供應商觸發的狀態變更 SHALL 與 ERP 內部觸發的狀態變更適用相同的向上傳遞規則。

**QC PT 與 inspection PT 的狀態變更不走此鏈**（依 erp-consultant Round 1 P1 修正補強）：

- `type = qc`、`scope = print_item` 的 PT：狀態變更直接影響其所屬印件層的 `pi_warehouse_qty` 計算（依本 spec § 完成度計算公式）；MUST NOT 觸發「PT → 任務」傳遞
- `type = inspection`、`scope = work_order_task` 的 PT：狀態變更影響對應 production PT 的 `pt_effective_qty`（依 `requires_inspection` 旗標）；MUST NOT 觸發「PT → 任務」傳遞（inspection PT 不歸屬於任何「任務」實體）

#### Scenario: production 生產任務開始製作時觸發狀態向上傳遞

- **WHEN** 某 `type = production` 的生產任務狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 檢查其所屬任務下所有 production 生產任務狀態，若為該任務首個進入「製作中」的生產任務，則將任務狀態推進為「製作中」
- **THEN** 系統 SHALL 依相同邏輯逐層向上傳遞至工單、印件、訂單

#### Scenario: 部分生產任務完成不影響上層狀態回退

- **WHEN** 某任務下有 3 個 `type = production` 生產任務，其中 1 個已完成、2 個製作中
- **THEN** 任務狀態 SHALL 維持「製作中」，不得因部分完成而回退或跳進

#### Scenario: 指派師傅不觸發向上傳遞

- **WHEN** 生管為某生產任務指派師傅（更新 assigned_operator 欄位）
- **THEN** 系統 MUST NOT 向上傳遞狀態變更至任務、工單層

#### Scenario: 首次報工觸發向上傳遞

- **WHEN** 某 `type = production` 生產任務首次報工使狀態從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依正常邏輯向上傳遞至任務、工單、印件、訂單

#### Scenario: 供應商報工觸發向上傳遞

- **WHEN** 供應商首次報工使 `type = production` 生產任務從「待處理」變為「製作中」
- **THEN** 系統 SHALL 依傳遞鏈自動推進：任務 → 工單 → 印件 → 訂單

#### Scenario: QC PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = qc`、`scope = print_item` 的 QC PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發其所屬印件的 `pi_warehouse_qty` 重算（依本 spec § 完成度計算公式）

#### Scenario: inspection PT 狀態變更不走向上傳遞鏈（P1-4 補）

- **WHEN** `type = inspection` 的 PT 狀態變更（如達標、cancelled）
- **THEN** 系統 MUST NOT 觸發「PT → 任務 → 工單」傳遞鏈
- **AND** 系統 SHALL 觸發對應 production PT 的 `pt_effective_qty` 重算

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

#### Scenario: 分批出貨情境下 QC PT 累計與 pi_warehouse_qty 計算（P1-6，C1 過渡期）

- **WHEN** 印件分批出貨：第一批計劃 300 件、第二批計劃 200 件，total `pi_planned_qty = 500`
- **AND** QC PT.target = 500，第一筆 WorkRecord passed = 300（QC 完成第一批驗收，但 PT 未達標）
- **THEN** C1 過渡期 `pi_warehouse_qty` SHALL 依「工單完成度 × qppi」計算（非 QC PT.passed 直接 sum）
- **AND** 出貨單建立時 SHALL 檢查 `pi_warehouse_qty >= 出貨數量`，允許第一批 300 出貨（即使 QC PT 仍 pending）
- **AND** QC PT 仍維持 1 個累計 target，第二筆 WorkRecord passed = 200 後達標
- **AND** C4 `move-warehousing-to-print-item-layer` 後 `pi_warehouse_qty` 改為 `sum(QC PT.passed where status = 已完成)`，分批驗收的累計直接成為入庫量
