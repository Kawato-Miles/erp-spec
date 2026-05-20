## Why

### 現場痛點（使用者視角）

當前 ERP 將 QC 視為獨立 capability（`QCRecord` 實體），與 `ProductionTask` 並列為兩個派工模型。這個結構造成三類使用者的具體痛點：

- **印務 PM**（負責工單規劃與跨層協調）：「品檢與 QC 在我們腦中本來就不同事，系統卻當同一回事 — QC 是每張印件出貨前一定要做、品檢是看狀況加。我只能在 Slack 跟同事說『這批要加品檢』，沒辦法在系統設定 inspection 任務」
- **QC 人員**（負責入庫前驗收）：「派工單上面寫 QC 任務，但有時候是檢驗成品（印件層）、有時候是檢驗某個工序產出（工序層），規格不同我要自己判斷。系統沒區分 type，我看不出來」
- **業務**（負責處理客訴與退款）：「印件不良時我跟客戶談降價接受，印務在 Slack 說 use_as_is，我跑去訂單異動模組退款，兩件事系統沒串起來；下次同個客戶又談時，我找不到上次紀錄」

> [量化資料補充] 上述場景描述為訪談性質質性歸納。具體量化指標（每週跨層追問次數、因 QC 模型分散導致延遲出貨的訂單數、品檢漏做事故案例）由 Miles 在 Phase 2 驗收期收集後補入。

### 系統面的結構問題

1. **QC 與品檢的業務動作差異未在系統中明確區分**：印刷業現場「QC」是印件出貨前的入庫檢查（每印件強制 1 個），「品檢」是特定工序的中間檢驗（如新製程良率追蹤、外包回廠半成品驗收，選擇性）；目前系統只有 QC 單一概念，無法區分兩種驗收的觸發時機、強制性與作用層級
2. **派工流程斷裂**：QC 派工不在統一派工板上，工序執行者與 QC / 品檢執行者的待辦清單分散，跨層協調靠 Slack
3. **品檢業務動作未建模**：工序中間檢驗目前依賴口頭交辦與紙本紀錄，事後若發生品質事故無法追溯
4. **NCR 處置流程在系統外決定**：QC 失敗時 rework / use_as_is / scrap 三種處置現靠業務 / 印務 / 生管在 Slack 群組討論，沒留紀錄；業務反映「不知道某張訂單為何降價接受」、印務反映「不知道哪些印件已決定報廢」

### 對 Phase 2 北極星指標的因果鏈

**Phase 2 北極星指標**：訂單流程完整完成率 ≥ 60%（第 1 個月）/ ≥ 80%（第 3 個月）。

本 change（C1）對此 KPI **無直接貢獻**（純 spec / design 重構，不解鎖任何使用者可走完的流程節點），但**是後續 C2 / C3 / C4 的必要前置基礎**：

- **C2 報工即完成**：必須先有 type 列舉值區分 production / qc / inspection，才能設計「報工後系統自動標記完成」邏輯
- **C3 補生產 Rework**：必須先有 NCR 實體與 Disposition 列舉，才能設計 rework 觸發機制與業務退款串接
- **C4 入庫上移到印件層**：必須先有 QC = 印件層的定義，才能設計 `pi_warehouse_qty = sum(QC PT.passed)` 公式

C1 是 C2 → C3 / C4 鏈條的第 1 環，**若 C1 不做，整個鏈條無法啟動**。Phase 2 北極星指標需透過 C2 + C4 才開始實質拉動。

**價值定位**：C1 的價值是「解鎖後續 change 的能力」而非「自身直接拉指標」。CEO 視角已確認可接受此前置投資定位，前提是 **C2 緊接其後啟動**（拖延 1-2 個月以上會讓 C1 變沉沒成本）。

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
