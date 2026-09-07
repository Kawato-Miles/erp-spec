# 設計：備料規格層（Prototype 層）

## Context

商業層設計正本：[work-order-prep-spec-selection-design.md](../../../work-order-prep-spec-selection-design.md)。

現狀（erp repo `apps/erp/src/app/(prototype)/work-orders/`）：BOM 面板材料區按重量展成「規格 × 供應商原料列」（`optionLabel: '母版規格'`、`bom_ref.weight_entry_id`），主檔 mock 無備料層；材料費＝供應商原料單張價 × 任務目標數量。

## Goals / Non-Goals

### Goals

- mock 主檔補 `MATERIAL_PREP_ENTRIES`（備料名稱、尺寸、開料數、所屬 weight_entry），每個按重量規格至少一筆開料數 1 的同尺寸備料
- 面板材料區一備料一列：備料、備料尺寸、開料數、供應商原料、牌價照主檔原字、放損率；`bom_ref` 增 `prep_entry_id`
- `estimate-cost.js` 重量類材料費先 ceil(目標數量 ÷ 開料數) 再乘單張價；工序費與設備費不動
- 任務名稱公式改材料名＋規格名＋備料名稱
- 名片錨例改用開料數 8 備料，數量 615／628／634；規格名去尺寸

### Non-Goals

- 拼版代算（PT-042）、線上單承接（PT-050）、後端與 EC 側改動、庫存扣帳

## Decisions

- **備料以 spec_id 索引、獨立於 MATERIAL_SPECS**：與 weight entries 同一放法，計價細節集中一處看得完
- **`bom_ref` 同時留 `prep_entry_id` 與 `weight_entry_id`**：後者由備料推得，保留是為了既有成本函式與檢查不必改取數路徑；一致性由 mock-consistency 檢查把關
- **缺 `prep_entry_id` 材料費為 0**：沿「輸入缺漏分項顯示 0、不推估」既有慣例
- **只動 (prototype)/ 目錄**：共用元件缺口以根因＋修法交前端，不自行補

## Risks / Trade-offs

- 規格名去尺寸後同材料下可能撞名 → 保留原名並列清單，由 Miles 決定
- 「備料」一詞同時是動作（拉料備料）與名詞（備料規格）→ spec 與註解區分用法
