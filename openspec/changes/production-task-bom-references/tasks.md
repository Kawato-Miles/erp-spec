## 1. Spec 撰寫

- [x] 1.1 production-task delta：新增 Requirement「BOM 多形引用」
- [x] 1.2 production-task delta：新增 Requirement「pricing_selection 混合帶入」
- [x] 1.3 production-task delta：新增 Requirement「BOM 單價回查與成本計算」
- [x] 1.4 production-task delta：Data Model 新增 7 欄位至 ProductionTask、刪除簡化版 Process 表
- [x] 1.5 production-task delta：MODIFIED Requirement「生產任務分類排序」— `category` 改為從 `bom_type` 衍生
- [x] 1.6 work-order delta：新增 Requirement「BOM 行項目與依 BOM 展開」
- [x] 1.7 work-order delta：Data Model 新增 BOMLineItem 資料表
- [x] 1.8 work-order delta：MODIFIED Requirement「工單建立 - 依 BOM 展開生產任務」

## 2. 驗證

- [x] 2.1 `openspec validate production-task-bom-references --strict` 通過
- [x] 2.2 `openspec list --json` 可見此 change
- [x] 2.3 pricing_selection 形狀與三個 master spec 的定義逐一對照一致
- [x] 2.4 確認三個互斥 FK 的約束已於 spec 明確說明
- [x] 2.5 確認 work-order BOMLineItem 與 production-task 的 BOM 引用欄位命名一致

## 3. Prototype 實作

- [x] 3.1 新增 `src/data/bomMasterMock.ts`（三個 master 的完整 mock + `resolveCatalogItem` helper）
- [x] 3.2 修訂 `src/types/workOrder.ts` 的 ProductionTask interface：新增 `bomType` / `materialSpecId` / `processId` / `bindingId` / `pricingSelection` / `pricingSelectionDefault` / `pricingSelectionOverridden`；既有 `process?` / `processCategory?` 標註 `@deprecated`
- [x] 3.3 重構 `src/data/processContentCatalog.ts`：內部改從 bomMasterMock 聚合，保留既有 public API
- [x] 3.4 補齊 `src/data/mockWorkOrders.ts`：為既有 ProductionTask mock 補上 BOM 欄位
- [x] 3.5 TypeScript 編譯通過（`npm run build` 或 `tsc --noEmit`）
- [x] 3.6 確認既有 UI 元件（ProductionTaskDrawer、SchedulePlanner 等）不需修改仍能執行

## 4. Commit

- [x] 4.1 Commit spec change（包含 proposal / design / tasks / 2 個 delta）
- [x] 4.2 Commit prototype changes（bomMasterMock + types + processContentCatalog 重構 + mockWorkOrders 補齊）
