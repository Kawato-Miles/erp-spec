## 1. Spec 撰寫

- [x] 1.1 production-task delta：MODIFIED Requirement「設備預計成本計算」— 語意縮為只含 setupFee
- [x] 1.2 production-task delta：ADDED Requirement「色數加價計算」— 新增 estimated_color_cost 欄位與公式
- [x] 1.3 production-task delta：Data Model 新增 `estimated_color_cost` 欄位、修訂 `estimated_equipment_cost` 語意說明

## 2. 驗證

- [x] 2.1 `openspec validate production-task-color-cost-split --strict` 通過
- [x] 2.2 `openspec list --json` 可見此 change
- [x] 2.3 確認 delta 的 MODIFIED Requirement 與 main spec 原本的「設備預計成本計算」header 一致

## 3. Prototype 實作（已完成於 sens-erp-prototype repo）

- [x] 3.1 `src/utils/equipmentCost.ts`：拆 `calculateEquipmentCost` → `calculateSetupFee(eq)` + `calculateColorCost(eq, colors, qty)`；保留 `calculateEquipmentCost` 為彙總函數
- [x] 3.2 `src/types/workOrder.ts`：ProductionTask 新增 `estimatedColorCost`，`estimatedEquipmentCost` 註解語意縮為「開機費」
- [x] 3.3 `src/pages/AddProductionTasks.tsx`：`ContentRow` 新增 `showColorControls` prop；僅 `ProcessRow` 傳 true；材料 / 裝訂不再顯示色數子行
- [x] 3.4 `AddProductionTasks.tsx`：未選設備 / `supports_colors = false` 時 UI disabled + 說明字串；切換設備保留色數 state（移除清空邏輯與 toast）
- [x] 3.5 `AddProductionTasks.tsx`：色數子行金額分列顯示「開機費 NT$ X | 色數加價 NT$ Y」
- [x] 3.6 `AddProductionTasks.tsx`：handleSave 分別寫入 `estimatedEquipmentCost`（setupFee）與 `estimatedColorCost`（colorCost，僅 bomType = process）
- [x] 3.7 TypeScript 編譯通過（`npx tsc --noEmit`）

## 4. Commit

- [x] 4.1 Prototype changes 已於 sens-erp-prototype commit `0e43d96`（feat: 色數加價歸屬工序、設備只算開機費）
- [x] 4.2 Spec change（proposal / design / tasks / delta） commit 於本 change
