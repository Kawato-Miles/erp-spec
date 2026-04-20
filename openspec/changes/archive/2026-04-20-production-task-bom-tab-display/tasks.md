## 1. Spec 補漏

- [x] 1.1 於 `production-task` delta spec 新增 Requirement「BOM 分類以 Tab 呈現」
- [x] 1.2 延伸 3 個 Scenarios（工單詳情頁 Tab 切換 / 新增生產任務頁 Tab 切換 / 分類空 empty state）

## 2. Prototype 實作（歷史狀態）

- [x] 2.1 WorkOrderDetail BOM Section 改 shadcn Tabs（材料 / 工序 / 裝訂）— 已於 `equipment-color-cost` 實作完成
- [x] 2.2 AddProductionTasks 三分類區塊改 shadcn Tabs，CategorySection 新增 embedded prop — 已於 `equipment-color-cost` 實作完成
- [x] 2.3 Tab 右上角「新增一筆」僅加入當前分類草稿陣列 — 已於 `equipment-color-cost` 實作完成
- [x] 2.4 分類 Tab 空狀態 empty state 顯示 — 已於 `equipment-color-cost` 實作完成

## 3. 封存與一致性

- [x] 3.1 驗證 delta spec 格式正確（`openspec validate production-task-bom-tab-display` 已通過）
- [x] 3.2 archive → delta 合併回 `openspec/specs/production-task/spec.md`
