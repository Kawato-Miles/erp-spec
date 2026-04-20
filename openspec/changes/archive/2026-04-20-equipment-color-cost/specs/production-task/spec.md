## ADDED Requirements

### Requirement: 設備預計成本計算

系統 SHALL 根據生產任務的顏色選項、設備單價、及數量自動計算設備預計成本（estimated_equipment_cost）。任何影響因子（顏色選項、設備、目標數量）變動時，系統 SHALL 即時重算。

計算公式：

```
令數 = pt_target_qty / 500

base_mono = color_mono_black ? 設備.mono_black_unit_price x 令數 : 0
base_cmyk = color_cmyk ? 設備.cmyk_unit_price x 令數 : 0
base_price_per_ream = (color_mono_black ? 設備.mono_black_unit_price : 0)
                    + (color_cmyk ? 設備.cmyk_unit_price : 0)

pantone_extra = color_pantone_multiplier != null
              ? base_price_per_ream x 令數 x color_pantone_multiplier : 0
metallic_extra = color_metallic_multiplier != null
              ? base_price_per_ream x 令數 x color_metallic_multiplier : 0
metallic_min_extra = color_metallic_min_multiplier != null
              ? base_price_per_ream x 令數 x color_metallic_min_multiplier : 0

estimated_equipment_cost = base_mono + base_cmyk
                         + pantone_extra + metallic_extra + metallic_min_extra
```

#### Scenario: 只選單黑

- **WHEN** 印務為生產任務勾選「單黑」，設備單黑單價 250/令，目標數量 5,000 張
- **THEN** 令數 = 5000/500 = 10，estimated_equipment_cost = 250 x 10 = 2,500

#### Scenario: 只選 CMYK

- **WHEN** 印務為生產任務勾選「CMYK」，設備 CMYK 單價 800/令，目標數量 5,000 張
- **THEN** 令數 = 10，estimated_equipment_cost = 800 x 10 = 8,000

#### Scenario: CMYK 加 Pantone 倍率

- **WHEN** 印務勾選「CMYK」並設定「Pantone 倍率 = 2」，設備 CMYK 單價 800/令，目標數量 5,000 張
- **THEN** 令數 = 10，base_cmyk = 800 x 10 = 8,000，pantone_extra = 800 x 10 x 2 = 16,000
- **AND** estimated_equipment_cost = 8,000 + 16,000 = 24,000

#### Scenario: 多重疊加（單黑加 CMYK 加金銀白螢光）

- **WHEN** 印務勾選「單黑」+「CMYK」+「金/銀/白/螢光倍率 = 1.5」，設備單黑 250/令、CMYK 800/令，目標數量 5,000 張
- **THEN** 令數 = 10，base_mono = 2,500，base_cmyk = 8,000，base_price_per_ream = 1,050
- **AND** metallic_extra = 1,050 x 10 x 1.5 = 15,750
- **AND** estimated_equipment_cost = 2,500 + 8,000 + 15,750 = 26,250

#### Scenario: 未選任何顏色

- **WHEN** 生產任務未勾選任何顏色選項
- **THEN** estimated_equipment_cost = 0

#### Scenario: 設備未指定

- **WHEN** 生產任務尚未設定設備（planned_equipment 為 null）
- **THEN** estimated_equipment_cost MUST NOT 計算，UI 顯示為「待排程」

#### Scenario: 顏色選項變更觸發重算

- **WHEN** 印務修改已設定顏色選項的生產任務（如新增 Pantone 倍率）
- **THEN** 系統 SHALL 即時重算 estimated_equipment_cost 並更新顯示

### Requirement: 顏色倍率自動帶入

系統 SHALL 在印務選擇設備後，自動從設備主檔帶入金/銀/白/螢光倍率（color_metallic_multiplier）和單金/銀/白/螢光色最低色數倍率（color_metallic_min_multiplier）的預設值。印務可覆寫帶入的預設值。

#### Scenario: 選擇設備後自動帶入倍率

- **WHEN** 印務為生產任務選擇設備，該設備主檔的金/銀/白/螢光預設倍率為 1.5、最低色數預設倍率為 2
- **THEN** 系統 SHALL 自動帶入 color_metallic_multiplier = 1.5、color_metallic_min_multiplier = 2
- **AND** 印務可手動修改帶入的倍率值

#### Scenario: 變更設備後重新帶入倍率

- **WHEN** 印務變更生產任務的設備（從設備 A 改為設備 B）
- **THEN** 系統 SHALL 以設備 B 的預設倍率覆蓋現有值
- **AND** 系統 SHALL 提示「設備已變更，倍率已更新為新設備預設值」

## MODIFIED Requirements

### Requirement: 日程執行面板

面板分為四大區塊：

1. **待分派區**：已交付且預計開工日期為當天或更早（或被標記為提前分派）的生產任務，依工序 x 生產任務內容分組。逾期超過 3 天的任務 SHALL 以紅色標籤標記。排序規則：交貨日期 > 開工日期 > 建立時間
2. **進行中區**：已分派給師傅且正在製作的任務
3. **已完成區**：當天已完成報工的任務
4. **異動確認區**：需要生管確認的異動項目，區分工單層異動與任務層異動

面板 SHALL 提供產線篩選器，生管可選擇特定產線僅顯示該產線的任務。篩選器 SHALL 記住生管上次選擇的產線偏好（使用者端持久化），下次開啟時自動套用。

每筆生產任務 SHALL 顯示生產任務細節（依工序 category 顯示對應的關鍵欄位，如：紙材、印刷色數、加工方式等），讓生管知道該任務實際要做什麼。

#### Scenario: 生管查看今日待分派任務

- **WHEN** 生管開啟日程執行面板
- **THEN** 系統 SHALL 自動套用上次選擇的產線篩選（若有）
- **AND** 系統 SHALL 在待分派區顯示所有已交付且（預計開工日期 <= 今天 或 is_early_dispatched = true）的自有工廠生產任務
- **AND** 生產任務 SHALL 依工序 x 生產任務內容分組呈現，排序依交貨日期優先
- **AND** 每筆生產任務 MUST 顯示：任務編號、所屬工單、印件名稱、目標數量、生產任務細節（紙材/印刷色數/加工方式等）
- **AND** 逾期超過 3 天的任務 MUST 以紅色標籤標記

## REMOVED Requirements

### Requirement: ProductionTaskWorkRecord A/B/C 群組欄位

**Reason**: A/B/C 群組（紙材相關/印刷相關/加工相關）為早期設計殘留，與現行 BOM 體系（Process.category: 材料/工序/裝訂）不一致。移除後，報工層細節欄位留待後續設計報工功能時以 Process.category 為分類基礎重新規劃。

**Migration**: 移除以下 17 個欄位：material_type_a、paper_size_a、print_colors_a、print_quantity_a、waste_quantity_a、cost_a、print_size_b、print_units_b、print_quantity_b、waste_quantity_b、cost_b、die_cut_no_c、die_cut_status_c、process_quantity_c、module_count_c、cost_c。

## Data Model Changes

### ProductionTask -- 新增欄位

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|----------|------|------|------|------|
| 單黑 | color_mono_black | 布林值 | | | 預設 false |
| CMYK | color_cmyk | 布林值 | | | 預設 false |
| Pantone 倍率 | color_pantone_multiplier | 小數 | | | null = 未選；有值 = 倍率（印務手動輸入） |
| 金/銀/白/螢光倍率 | color_metallic_multiplier | 小數 | | | null = 未選；有值 = 倍率（設備主檔預設，可覆寫） |
| 單金/銀/白/螢光色最低色數倍率 | color_metallic_min_multiplier | 小數 | | | null = 未選；有值 = 倍率（設備主檔預設，可覆寫） |
| 設備預計成本 | estimated_equipment_cost | 小數 | | Y | 系統依顏色選項 + 設備單價 + 數量自動計算，唯讀 |

### ProductionTaskWorkRecord -- 移除欄位

移除 A 群組（紙材相關）：material_type_a、paper_size_a、print_colors_a、print_quantity_a、waste_quantity_a、cost_a

移除 B 群組（印刷相關）：print_size_b、print_units_b、print_quantity_b、waste_quantity_b、cost_b

移除 C 群組（加工相關）：die_cut_no_c、die_cut_status_c、process_quantity_c、module_count_c、cost_c
