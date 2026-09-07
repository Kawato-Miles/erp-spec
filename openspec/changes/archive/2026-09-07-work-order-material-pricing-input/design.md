# 設計：工單材料與裝訂計價輸入（Prototype 層）

## Context

商業層設計正本：[work-order-material-selection-design.md](../../../work-order-material-selection-design.md)（已過 plan-audit 三輪、Miles 拍板、wiki 11 卡已落）。本檔只補 Prototype 實作層的技術決策。

現狀（erp repo `apps/erp/src/app/(prototype)/work-orders/`）：材料選擇為三層級聯（`MATERIAL_GROUPS` → `MATERIALS` → `MATERIAL_SPECS`），止於材料規格；六種計價子類在 mock 已有 `pricing_method` 標示，但 `estimate-cost.js` 的材料費一律 `unit_price × sheetQty`；裝訂費無台數／頁數輸入。

## Goals / Non-Goals

### Goals

- mock 主檔補計價子表三型：重量計價尺寸表列（`weight_entries`）、面積價格矩陣（`area_tiers × quantity_axis_tiers × price_cells`）、數量級距表（`quantity_price_tiers`）
- 任務表單依計價方式條件展開四欄：母版規格列、計價面積、台數、頁數；納入既有必填驗證
- `estimate-cost.js` 材料費分六式（M1／M2／M3／M4 單獨面積／M4 總面積／M5）、裝訂費分三式（B1／B2／B3，含每本最低與總價最低）；查無區間回 0
- 移除 EC 相關訂單與工單假資料（裁決 11）

### Non-Goals

- 拼版代算、選優建議（PT-042 另案）
- 線上單自動建工單的計價輸入承接（PT-050 另案）
- 物料庫存掛層調整（進銷存另案）
- 後端與 EC 側任何改動（Prototype 驗證層）

## Decisions

- **mock 欄位 snake_case、值貼近真實**（既有紀律）：`weight_entries` 帶 `size_name / width / height / dimension_unit / weight_gsm / weight_price / pages_per_unit`，對映後端 MaterialSpecWeightEntry。
- **任務儲存形狀擴充而非新實體**：`bom_ref` 增 `weight_entry_id`；任務層增 `pricing_area / binding_sheets / binding_pages`。凍結沿用既有 `est_cost` 存檔即凍機制，追因看任務欄位（與計價快照卡一致）。
- **驗證沿用既有必填框架**：四欄依條件加入必填清單，不另設送審檢查（拍板 7）。

## Risks / Trade-offs

- mock 價格矩陣資料量大 → 每型建 2-3 個代表性材料即可，不求全量。
- 面積單位混用（平方公分／平方公尺）→ 單位由矩陣帶出唯讀，計算前統一換算。

## Migration Plan

Prototype 直接修改（生產階段校正期間 erp repo 疊 commit 慣例）；無資料遷移。回滾＝git revert。

## Open Questions

無（PT-050 屬範圍外另案，不決定本次行為）。
