## 1. 資料模型與 Mock Data

- [x] 1.1 建立 `types/equipment.ts` 的新型別：`EquipmentType`、`PricingUnit`、`PricingTier`、`SpecialColorType`、Equipment interface 擴充欄位
- [x] 1.2 移除 Equipment 既有 `monoBlackUnitPrice / cmykUnitPrice`（由 pricingTiers 取代）
- [x] 1.3 修改 `types/workOrder.ts` 的 ProductionTask：移除 5 個舊顏色欄位，新增 `frontColorCount / backColorCount / specialColors`
- [x] 1.4 更新 `mockEquipmentList`（`mockSchedulingCenter.ts`）：至少 5 台涵蓋以下情境：
  - 2 台平板印刷（令計價、千車計價各一）含完整 pricingTiers 與三組倍率
  - 1 台數位印刷（千車計價）
  - 1 台膠裝機（supports_colors = false，僅有 setupFee）
  - 1 台模切機（supports_colors = false）
- [x] 1.5 Mock data 的 pricingTiers 依 Figma 範例設值（1~2/2~4/4~6/6~∞ 千車 × 單黑/CMYK 兩種單價；採半開區間，原 Figma 3~4 千車的洞已補上）

## 2. 成本計算邏輯

- [x] 2.1 重寫 `utils/equipmentCost.ts`：
  - 新 interface：`PricingContext`（含 pricingUnit、pricingTiers、setupFee、三組倍率、supportsColors）
  - 新函式 `findPricingTier(units, tiers)`：依印量找對應 tier；**採半開區間 [minQty, maxQty)**；偵測不連續區間並回報 invalid
  - 新函式 `calculateEquipmentCost(colors, equipment, targetQty)`：完整實作 Step 1-5 公式；**雙面印刷取總印量套 tier（正反共用）**
  - 邊界處理：tier 未定義 / 不連續、supportsColors = false、cmykPricePerColor 為 null 但有特殊色、targetQty = 0 或 null
- [x] 2.2 在 equipmentCost.ts 內新增 `colorNotation(pt): string`、`specialColorSummary()`、`equipmentSupportsSpecialColor()`
- [x] 2.3 廢除舊 5 欄位相關 utility：`getColorOptions`（已重寫為 `getColorSpec`）、舊 `colorSummary` 已移除

## 3. UI 改造

- [x] 3.1 `AddProductionTasks.tsx` 顏色子行完全重寫：
  - 正面色數 / 背面色數 number input（0-8，step=1）
  - 特殊色 chip 複選（含 Pantone / 金銀白螢光 / 最低色數三項，依設備能力動態過濾）
  - 設備帶入的三組倍率唯讀顯示（灰底、不可編輯）
  - 即時計算的 estimated_equipment_cost 顯示
  - 整體子行仍保留「依設備 supportsColors gate」條件渲染
  - **2~3 色印刷警語**：色數 ∈ [2, 3] 時顯示「2~3 色印刷實際成本可能較低，本計算採用 CMYK 單價可能高估 25~50%，請人工調整報價」
- [x] 3.2 設備變更時的清除邏輯：
  - 新設備 supports_colors = false → 重置 frontColorCount / backColorCount / specialColors
  - 新設備某倍率為 null → 移除 specialColors 陣列中對應類型
  - 顯示對應 toast 提示
- [x] 3.3 `WorkOrderDetail.tsx` 設備預計成本彙總 Section 更新：
  - 「顏色選項」欄位拆為「色數標記」（colorNotation）+「特殊色」（specialColorSummary）兩欄
  - 成本計算 callsite 改用新 `calculateEquipmentCost(colors, eq, ptTargetQty)` 函式
  - ptTargetQty 改為 `pt.quantityPerWorkOrder * wo.targetQty`（先前 callsite 用了 quantityPerWorkOrder 為 targetQty 是錯誤）

## 4. 驗證

- [x] 4.1 驗算公式：Scenario「單面 CMYK（4/0）」實算 = 3,000（500 開機費 + 4×250×2.5）
- [x] 4.2 驗算公式：Scenario「雙面 CMYK（4/4）」實算 = 5,500
- [x] 4.3 驗算公式：Scenario「4+1/4 含 Pantone」實算 = 6,750
- [x] 4.4 驗算公式：Scenario「單黑 1/0」實算 = 1,000
- [x] 4.5 grep 確認無其他檔案引用舊 5 個顏色欄位與舊 util（`getColorOptions` / 舊 `colorSummary`）— 皆無殘留
- [x] 4.6 確認 Equipment main spec 新建（新 capability）、production-task delta 正確標記 MODIFIED / REMOVED / ADDED
- [x] 4.7 `openspec validate equipment-pricing-model` 通過（valid）

## 5. End-to-End 手動驗證（Lovable）

- [ ] 5.1 建立生產任務選「海德堡 XL106」→ 顏色子行顯示、倍率唯讀
- [ ] 5.2 填 frontColorCount = 4、backColorCount = 0、specialColors = [] → 成本正確（3,000）
- [ ] 5.3 切換到 frontColorCount = 4、backColorCount = 4 → 成本變 5,500
- [ ] 5.4 勾選 Pantone chip → 成本變 6,750，倍率顯示為 2
- [ ] 5.5 印量從 2,500 張改為 6,000 張 → 區間切到 tier4，單價變 150、重算成本
- [ ] 5.6 設備切「膠裝機」→ 顏色子行消失、色數欄位清除、toast 提示、成本只剩開機費
- [ ] 5.7 設備切「某僅支援 Pantone 的設備」→ specialColors 的 metallic 被移除、toast 提示
- [ ] 5.8 WorkOrderDetail 的設備預計成本 Section：顏色欄位顯示 `4+1/4` 格式、成本正確

## 6. 收尾

- [ ] 6.1 equipment-color-cost 的 proposal.md 加 footer 註記「已被 equipment-pricing-model change 取代（superseded）」；Miles 手動或與本 change 一起 archive
- [ ] 6.2 CLAUDE.md § Spec 規格檔清單 新增 `equipment` 模組一列（指向 main spec 路徑）
- [ ] 6.3 `openspec validate` 檢查清理
- [ ] 6.4 將 design.md Open Questions 三題（特殊色基礎價 / 開機費時機 / 印量=0 邊界）透過 oq-manage skill 建立為 Notion OQ
- [ ] 6.5 三視角審查（erp-consultant、ceo-reviewer、senior-pm）於 archive 前再跑一次

## 7. 成功指標驗證

- [ ] 7.1 功能正確性：§4 六個驗算公式 Scenario 全部通過
- [ ] 7.2 UX 成效對照：印務在 Lovable 建立 PT 顏色的操作步驟數 ≤ 3 步（選設備 → 填色數 → 勾特殊色；對照 equipment-color-cost 的 5 flag 勾選 + 倍率手填）
- [ ] 7.3 設計對齊：覆蓋 Figma pricingTiers 表格的 100% 欄位（區間 / 單黑 / 彩色單價）
