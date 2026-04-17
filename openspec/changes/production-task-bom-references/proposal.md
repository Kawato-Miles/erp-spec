## Why

前三個 commit 建立了 `material-master` / `process-master` / `binding-master` 三個 BOM 底層 spec，但這些 master 目前「孤立存在」：
- `production-task` spec 的 `ProductionTask.process_id` 指向一張**簡化版內部 Process 表**（僅 id / name / category），與新的 process-master Process（含 group_id / vendor_id / pricing_method）不符
- 新 process-master 只涵蓋「工序」，不含「材料」與「裝訂」兩個 category；但 production-task 仍以 category 分組排序，必須改為**多形引用三個 master**
- 缺 `pricing_selection` 欄位，無法回查 BOM 單價做成本計算
- `work-order` spec 多處提到「依 BOM 展開建立生產任務」但無具體欄位定義
- Prototype 的 `ProductionTask` 用 `process?: string` 純字串、目錄為 hardcoded `processContentCatalog.ts`，與新 master 脫鉤

## What Changes

- 生產任務 Data Model 新增 BOM 多形引用欄位（`bom_type` + `material_spec_id` / `process_id` / `binding_id` 互斥 FK）
- 生產任務 Data Model 新增 pricing_selection 相關欄位（`pricing_selection` / `pricing_selection_default` / `pricing_selection_overridden`）
- **BREAKING**：刪除 production-task spec 中的簡化版 Process 資料表（由 process-master 取代）
- `processCategory` 從 enum 欄位改為從 `bom_type` 衍生
- 新增 Requirement：BOM 多形引用、pricing_selection 混合帶入、成本計算回查邏輯
- work-order spec 新增 `BOMLineItem` 資料表與 Requirement：工單印件的 BOM 行項目如何對應三個 master、依 BOM 展開時如何帶入 `bom_type` / FK / `pricing_selection_default`
- Prototype 同步：修訂 `types/workOrder.ts` 的 ProductionTask interface、新增 `data/bomMasterMock.ts`、重構 `data/processContentCatalog.ts`（向後相容）、補齊 `data/mockWorkOrders.ts`

## Capabilities

### New Capabilities

（無新增獨立 capability）

### Modified Capabilities

- `production-task`：新增 BOM 多形引用欄位、pricing_selection 欄位、BOM 引用相關 Requirements；刪除內部 Process 表
- `work-order`：新增 BOMLineItem 資料表、細化 BOM 展開為生產任務的欄位帶入規則

## Impact

- 生產任務 Data Model 新增 7 欄位、刪除內部 Process 表
- 工單 Data Model 新增 BOMLineItem 資料表
- Prototype types/workOrder.ts 新增 6 欄位至 ProductionTask interface
- Prototype 新增 bomMasterMock.ts（3 個 master 的完整 mock 資料集）
- Prototype processContentCatalog.ts 內部實作改寫（public API 向後相容）
- Prototype mockWorkOrders.ts 既有 ProductionTask 需補 BOM 欄位
- UI 元件**不動**，另起 session 處理
