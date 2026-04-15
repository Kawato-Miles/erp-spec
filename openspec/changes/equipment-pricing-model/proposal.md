## Why

現行 equipment-color-cost change 的顏色模型（5 個獨立欄位 + 印務可覆寫倍率）與實際業務規則不符：

1. **倍率是設備規格、非議價項目**：Pantone / 金銀白螢光 / 最低色數倍率是設備主檔硬性規則，印務不該在生產任務勾選或覆寫。Figma 設計明確註記「使用者不可手填等效單色數，系統依規則換算」。
2. **單一單價不符合階梯定價**：印刷業設備計價為「色數區間階梯定價」——印量越大單價越低（如 1~2 千車 CMYK 300 元/色、6~∞ 千車 150 元/色），現行僅存「單黑單價 / CMYK 單價」無法表達。
3. **缺少色數骨幹（印刷業術語）**：現行用 5 個布林/倍率 flag 組合，印務需手動勾選並理解倍率邏輯；業界慣用「色數標記（4/0、4+1/4）」——正面色數/背面色數 + 特殊色標示，是 job ticket 標準。

Figma 設計（[ERP 中台設計 - 設備計價方式](https://www.figma.com/design/ir3n64dyNMuAXG5Iy5R8el/ERP-%E4%B8%AD%E5%8F%B0%E8%A8%AD%E8%A8%88?node-id=2107-35572)）已明確揭示正確模型：區間階梯定價 + 硬性倍率 + 開機費 + 計價單位（令/千車）。

## What Changes

- **BREAKING**：推翻 equipment-color-cost 對 ProductionTask 的顏色欄位設計（5 個獨立欄位全廢），改為「色數 + 特殊色 chip + 唯讀倍率」模型
- Equipment 主檔資料模型升級：
  - 新增 `equipmentType`（平板印刷 / 數位印刷 / 大圖輸出）
  - 新增 `pricingUnit`（令 / 千車，1 千車 = 1000 張）
  - 新增 `setupFee`（開機費）
  - 新增 `pricingTiers: Array<{ minQty, maxQty, monoPricePerColor, cmykPricePerColor }>`（色數區間階梯定價）
  - 既有 `pantoneMultiplier / metallicMultiplier / metallicMinMultiplier` 保留並**明確標示為硬性**（ProductionTask 不可覆寫）
  - 移除既存 `monoBlackUnitPrice / cmykUnitPrice`（被 pricingTiers 取代）
- ProductionTask 顏色欄位改造：
  - 移除：`colorMonoBlack / colorCmyk / colorPantoneMultiplier / colorMetallicMultiplier / colorMetallicMinMultiplier`（全廢）
  - 新增：`frontColorCount: number`（正面色數）、`backColorCount: number`（背面色數）
  - 新增：`specialColors: Array<'pantone' | 'metallic' | 'metallic_min'>`（特殊色複選）
  - 保留：`estimatedEquipmentCost`（公式重寫，邏輯與欄位名不變）
- 成本公式重寫：依設備 `pricingTiers` 找區間 → 正/背面基本印工 + 特殊色倍率計算 + 開機費
- UI 改造：
  - AddProductionTasks 顏色子行改為「正面色數 + 背面色數 + 特殊色 chip 複選 + 唯讀倍率顯示 + 即時成本」
  - 倍率欄位全部 readonly
  - 既有「設備 supportsColors gate」行為保留
- Prototype 只動 type + mock data，**不做設備主檔 CRUD UI**（Figma 畫的 Drawer 留給後續 change）
- equipment-color-cost **不 archive、不合併至 main specs**；本 change archive 時，在 main specs 上直接覆寫顏色相關 Requirement

## Capabilities

### New Capabilities

- `equipment`: 設備主檔資料模型與計價規則——設備類型分類、計價單位（令/千車）、開機費、色數區間階梯定價、硬性倍率（Pantone / 金銀白螢光 / 最低色數）

### Modified Capabilities

- `production-task`: 顏色欄位結構重寫（色數標記 + 特殊色陣列），移除 5 個既有顏色欄位；設備預計成本計算公式重寫

## Impact

- **Spec 衝突**：equipment-color-cost 的 production-task delta 與本 change 互斥；equipment-color-cost 不 archive，由本 change 直接覆寫 main specs
- **Prototype 改動**：
  - `src/types/equipment.ts`：Equipment 資料結構改動
  - `src/types/workOrder.ts`：ProductionTask 顏色欄位改動
  - `src/data/mockSchedulingCenter.ts`：mockEquipmentList 全面升級（加階梯定價資料）
  - `src/utils/equipmentCost.ts`：成本計算函式重寫
  - `src/pages/AddProductionTasks.tsx`：顏色子行 UI 重構
  - `src/pages/WorkOrderDetail.tsx`：設備預計成本彙總 Section 資料來源對齊
- **Data 遷移**：Prototype 為空白資料、mock 全改；production 無資料影響（尚未上線）
- **依賴**：數量換算（1 令 = 500 張 / 1 千車 = 1000 張）維持既有設計
- **暫不處理**（留後續）：設備主檔 CRUD UI、特規尺寸加價、材料耗損、咬口、可印厚度等細節計算
