## Why

目前 production-task spec 的「設備預計成本計算」把 setupFee（設備的固定成本）與色數加價（依印量 / 色數 / 特殊色計算的變動成本）合併在 `estimated_equipment_cost` 單一欄位。

問題：
- **會計語意混亂**：固定成本與變動成本混在同一欄位，報價單 roll-up、成本核算時無法分項，無法回答「這筆工序的色數費是多少」「這台設備的固定成本是多少」
- **心智模型錯置**：印刷業實務上色數費本質跟「印刷工序」綁定（每多印一色＝多換一次版、多上一次印），而不是設備的靜態屬性；計費公式也依工序層的 pricing_tiers 計算
- **UI 限縮需求**：色數加價僅對工序類（bom_type = process）有意義；材料（bom_type = material）與裝訂（bom_type = binding）即使綁設備也不該出現色數輸入

## What Changes

- **MODIFIED Requirement**「設備預計成本計算」：`estimated_equipment_cost` 語意縮為**只含 setupFee**；原本合併的色數加價移至新欄位
- **ADDED Requirement**「色數加價計算」：新增 `estimated_color_cost` 作為工序的變動成本，僅對 bom_type = process 有效；計算公式承接原本「設備預計成本計算」裡的色數相關公式
- **Data Model 新增**：`ProductionTask.estimated_color_cost`
- **UI 行為**：色數輸入只在工序類生產任務顯示；未選設備或選到 supports_colors = false 的設備時，欄位 disabled 並顯示說明字串；切換設備時 **保留** 色數 state（不清空，便於比較不同機台）

## Capabilities

### New Capabilities

（無新增獨立 capability）

### Modified Capabilities

- `production-task`：拆分設備預計成本與色數加價、新增 `estimated_color_cost` 欄位、限縮色數 UI 至工序類生產任務

## Impact

- production-task Data Model 新增 1 欄位（`estimated_color_cost`）、修訂 `estimated_equipment_cost` 語意
- 計算邏輯從單一函數拆為兩個獨立函數（`calculateSetupFee` / `calculateColorCost`）
- 舊 `calculateEquipmentCost` 保留為向後相容的彙總函數（= setupFee + colorCost）
- Prototype `AddProductionTasks.tsx` 色數子行限縮工序 tab（材料 / 裝訂 tab 不再渲染）
- Prototype handleSave 分別寫入 `estimatedEquipmentCost`（setupFee）與 `estimatedColorCost`（colorCost）
- WorkOrderDetail 的「設備預計成本」panel 現有呼叫點透過彙總函數仍可運作，值會變成只含 setupFee（與新語意一致）
