## Why

工單的成本計算需加入顏色概念（單色/四色/特殊色），不同顏色選項影響設備成本。目前生產任務（ProductionTask）沒有顏色相關欄位，工單層也沒有設備成本彙總，印務無法在規劃階段預估設備成本。同時，ProductionTaskWorkRecord 下的 A/B/C 群組（紙材/印刷/加工）是早期設計殘留，與現行 BOM 體系（Process.category: 材料/工序/裝訂）不一致，應一併清除避免後續設計混亂。

## What Changes

- 生產任務新增 5 個顏色選項欄位（單黑、CMYK、Pantone 倍率、金/銀/白/螢光倍率、單金/銀/白/螢光色最低色數倍率），可複選疊加
- 生產任務新增 estimated_equipment_cost 欄位，系統依顏色選項 + 設備單價 + 數量自動計算
- 新增顏色倍率自動帶入機制：選擇設備後，金/銀/白/螢光、最低色數倍率從設備主檔自動帶入，印務可覆寫
- 工單詳情頁新增「設備預計成本」Section，彙總該工單下所有生產任務的設備預計成本
- **BREAKING**：移除 ProductionTaskWorkRecord 的 A/B/C 群組欄位定義（material_type_a、paper_size_a、print_colors_a、cost_a 等 17 個欄位）

## Capabilities

### New Capabilities

（無新增獨立 capability）

### Modified Capabilities

- `production-task`: 新增顏色選項欄位、設備預計成本計算邏輯、顏色倍率自動帶入機制；移除 A/B/C 群組欄位
- `work-order`: 新增設備預計成本彙總 Section

## Impact

- 生產任務 Data Model 新增 6 欄位、移除 17 個 A/B/C 群組欄位
- 工單詳情頁 UI 新增成本彙總 Section
- 依賴設備主檔的單黑/CMYK 單價、金/銀/白/螢光倍率、最低色數倍率欄位（已有獨立模組）
- 數量換算依賴：pt_target_qty（張）/ 500 = 令數
