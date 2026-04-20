## Why

`equipment-color-cost` 封存時（2026-04-20），`openspec/specs/production-task/spec.md` 僅吸收該 change 的核心 delta（顏色選項 / 預計成本 / supports_colors gate），但當時延伸在 `focused-poincare` 分支的「BOM 分類以 Tab 呈現」Requirement（commit `9fd9d53`）並未隨封存合併回主線。造成 Prototype 實作（WorkOrderDetail 與 AddProductionTasks 的 shadcn Tabs）已完成但 main spec 缺少對應規格紀錄。

此 change 為**補漏用途**：把遺漏的 Requirement 補進 `production-task` main spec，恢復 Prototype 與 Spec 一致性。

## What Changes

- 在 `production-task` capability 的 ADDED Requirements 新增「BOM 分類以 Tab 呈現」，含 3 個 Scenarios：
  - 工單詳情頁 BOM Tab 切換
  - 新增生產任務頁 Tab 切換（含獨立草稿陣列行為）
  - 分類為空時的 empty state

## Capabilities

### Modified Capabilities

- `production-task`: 新增 BOM 分類 Tab 呈現的規格描述（既有 Prototype 實作行為的規格化）

## Impact

- **無 BREAKING 變更**：純粹補上已實作行為的 Spec 紀錄
- **影響檔案**：`openspec/specs/production-task/spec.md` 新增 1 個 Requirement 與 3 個 Scenarios
- **Prototype 實作**：已完成（在 `equipment-color-cost` 範疇內），本 change 不涉及任何代碼變更
- **歷史淵源**：`focused-poincare` 分支 commit `9fd9d53`（2026-04-15）
