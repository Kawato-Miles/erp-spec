## Why

當前 QC 為獨立 capability（`QCRecord` 實體），與 `ProductionTask` 並列為兩個派工模型。實務上：

1. **QC 與品檢的業務動作差異未在系統中明確區分**：印刷業現場「QC」是印件出貨前的入庫檢查（每印件強制 1 個），「品檢」是特定工序的中間檢驗（如新製程良率追蹤、外包回廠半成品驗收，選擇性）；目前系統只有 QC 單一概念，無法區分兩種驗收的觸發時機、強制性與作用層級。
2. **派工流程斷裂**：QC 派工不在統一派工板上，工序執行者與 QC / 品檢執行者的待辦清單分散。
3. **品檢業務動作未建模**：工序中間檢驗目前依賴口頭交辦與紙本紀錄。

對齊 Phase 2 訂單流程完整完成率 >= 60% KPI：本變更為後續 C2（報工即完成）/ C3（補生產 Rework）/ C4（入庫上移到印件層）的基礎前置條件。

## What Changes

- **新增 `ProductionTask.type` 欄位**：列舉值 `production` / `qc` / `inspection`，統一派工模型
- **新增 `ProductionTask.scope` 欄位**：列舉值 `work_order_task` / `print_item`，依 type 自動帶入
- **QC 重新定義為印件入庫檢查（印件層）**：`type = qc`、`scope = print_item`，每個印件強制建立 1 個 QC PT
- **新增「品檢」type（工序中間檢驗，選擇性）**：`type = inspection`、`scope = work_order_task`，印務在規劃時對特定 production PT 加入
- **沿用既有 ProductionTaskWorkRecord 多筆累計機制**：放棄早期「PT 一次性報工」假設，PT 派工一次、多筆 WorkRecord 累計（既有設計，不新增 Lot / `assigned_qty` 等欄位）
- **QC / 品檢結果欄位整合**：`passed_quantity`（QC 人員填）/ `failed_quantity`（系統計算）併入 ProductionTaskWorkRecord
- **新增 PT 屬性**：`requires_inspection`（是否需要對應品檢 PT）、`require_transfer`（是否需轉交）、`previous_production_task_ids`（前置 PT 清單）
- **新增 NCR 實體**：QC / 品檢失敗時系統自動建 NCR，印務 Disposition 三選一（rework / use_as_is / scrap）；具體 Rework 流程留 C3
- **QC 單獨立狀態機移除**：QC 狀態 = ProductionTask 狀態
- **BREAKING**：`QCRecord` 獨立實體廢止；既有引用 QCRecord 的 spec 段落需改寫

## Capabilities

### New Capabilities

無新建 capability（NCR 為 production-task spec 內新增實體）。

### Modified Capabilities

- `production-task`：新增 `type` / `scope` / `requires_inspection` / `require_transfer` / `previous_production_task_ids` 欄位；新增 QC PT 自動建立規則、品檢 PT 規劃規則、NCR 實體與 Disposition 機制；ProductionTaskWorkRecord 新增 `passed_quantity` / `failed_quantity`
- `qc`：大幅收斂；既有 Requirement 多數移除或併入 production-task；保留 QC 角色執行行為的薄層說明（依新定義 QC = 印件入庫檢查重寫）
- `state-machines`：移除 QC 單獨立狀態機段落；QC 與品檢狀態流轉指向 ProductionTask 狀態機；齊套規則 § 完成度計算 引用更新
- `user-roles`：QC 角色（兼任品檢執行）權責更新（執行 ProductionTask type = `qc` / `inspection`）

## Impact

- **受影響 OpenSpec specs**：`production-task`、`qc`、`state-machines`、`user-roles`
- **受影響 Notion 發布版本**：[生產任務 v0.2](https://www.notion.so/32c3886511fa806ab1d5c2b815bf9c94)、QC（草稿未發布）、[使用者角色](https://www.notion.so/32c3886511fa8144b38adc9266395d15)、[狀態機](https://www.notion.so/32c3886511fa81539eb9d3c97630caa0)
- **Prototype 不在 C1 範圍**（依 Miles 指示）：mock data 與 UI 重構留待後續 change 整批處理
- **業務情境**：QC 涉及的 [Notion 業務情境 DB](https://www.notion.so/2b93886511fa817fbb7ff9d2b37b9e05) 場景需在 C1 歸檔後重新驗證
- **後續 change 依賴關係**：
  - C2 `simplify-production-task-completion`：依賴 C1 的 type 列舉值
  - C3 `add-production-task-rework`：依賴 C1 + C2，C1 NCR 實體在此 change 完整實現 Rework 流程
  - C4 `move-warehousing-to-print-item-layer`：依賴 C1（QC = 印件層是入庫公式變更的前置）
- **既有資料遷移**：QCRecord 既有資料 migration 範圍另議（OQ-C1-5）
- **跨檔案一致性**：歸檔後執行 `doc-audit` 檢查 production-task / qc / state-machines / user-roles / business-scenarios / order-management 的引用一致性

## Design Iteration Note

本 change 經多輪設計討論，過程中曾考慮但最終放棄的方向（避免後續混淆）：
- Lot / ProductionLot 實體（業界 MES 標準，但既有 ProductionTaskWorkRecord 已足夠）
- 葉節點公式（與既有「所有 affects_product PT 取 min」結果相同，不需要新概念）
- 子 PT 鏈累計回原 PT（補生產情境會超量、分批提前情境會破壞齊套）
- 拆 PT 機制（破壞葉節點 / 多葉節點公式）
- `assigned_qty` 欄位（人為協調已足夠，必要時未來再加）
- PT 一次性報工限制（既有 WorkRecord 多筆設計已支援分批）
- `requires_qc` 欄位（QC 改為印件層強制 1 個後不需要）

詳見 [design.md § Risks / Trade-offs](design.md) 與每個 Decision 的迭代記錄。
