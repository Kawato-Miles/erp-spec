## Why

Prototype 有兩組**寫死 Tailwind 色盤**的視覺 pattern 分散在多個檔案，違反 DESIGN.md §4.1「優先 design token」原則：

1. **材料 / 工序 / 裝訂三色**（Tab 標籤、Section badge、展開表格切換）
   - `AddProductionTasks.tsx` 的 `CATEGORY_STYLES`（amber / blue / green 三組 bg/border/text）
   - `AddProductionTasks.tsx` 的 Tab triggers（`data-[state=active]:border-amber-500` 等）
   - `WorkOrderDetail.tsx` 巢狀 Tab（生產任務展開內的材料 / 工序 / 裝訂切換，line 1064-1070）
2. **印件名稱成功色 badge**（`bg-[#f1fde8] border-[#defacd] text-[#3c9d13]`）散在 4 個檔案
   - `AddProductionTasks.tsx`、`QuoteDetailPage.tsx`、`AddTaskCalcPanel.tsx`、`index.css` 定義

兩者都是「業務語意色」（category 分類 / 成功狀態），應抽為 design token 讓未來新增頁面直接用，且視覺調整一次改到位。

`index.css` 已有 `--color-success: #3c9d13` 定義但**未覆蓋所有 slots**（缺 bg / border），也未在 Tailwind config 暴露為 class（所以目前還是寫死 hex）。本 change 補齊。

## What Changes

**新增 design token**：

- **Success 色**（emerald 系，取代印件名稱 badge 的寫死 hex）：
  - `--success: 92 77% 34%`（`#3c9d13`，foreground / text）
  - `--success-foreground: 0 0% 100%`（白字，若用 success 為底色時搭配）
  - `--success-bg: 89 85% 95%`（`#f1fde8`，badge 底色）
  - `--success-border: 92 73% 84%`（`#defacd`，badge 邊框）
  - `tailwind.config.ts` 暴露 `success` / `success-foreground` / `success-bg` / `success-border` 為 color class
- **Category 三色**（material / process / binding 各四個 slots：bg / border / text / active）：
  - `--category-material-{bg,border,text,active}`（amber 系）
  - `--category-process-{bg,border,text,active}`（blue 系）
  - `--category-binding-{bg,border,text,active}`（green 系）
  - HSL 值對應 Tailwind amber / blue / green 的 50 / 200 / 700 / 500（維持現狀視覺）
  - `tailwind.config.ts` 暴露 `category.material.bg` / `.border` / `.text` / `.active` 等巢狀 class

**套用點**：

- `AddProductionTasks.tsx`：
  - `CATEGORY_STYLES` 常數從寫死 `amber-50/blue-50/green-50` 改為 `bg-category-material-bg` 等 token class
  - 三個 Tab triggers 的 `data-[state=active]:border-amber-500` → `data-[state=active]:border-category-material-active`（等）
  - 印件名稱 badge 從 `bg-[#f1fde8] border-[#defacd] text-[#3c9d13]` 改為 `bg-success-bg border-success-border text-success`
- `WorkOrderDetail.tsx` 巢狀 Tab（line 1064-1070）三色 active border 同上遷移
- `QuoteDetailPage.tsx` / `AddTaskCalcPanel.tsx` / 其他用 `#f1fde8` 的印件名稱 badge 統一遷移
- DESIGN.md §1.2 色彩 token 清單新增 success / category 三色

**不動**：
- 語意色（warning amber / info blue / error red / muted / destructive 等）— 本 change 只處理 category 色（分類語意）與 success 色
- 色數子行的 blue chip（primary 色，屬 accent 系不是 category）
- WorkOrderDetail 的狀態 badge（交付 blue / QC 通過 green / 警告 amber 等）— 業務狀態語意色，屬另一類 token 化範疇，本 change 不動

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

無 spec-level 行為變更（純 design token + UI 遷移）。

## Impact

- **新增 / 修改**：
  - `sens-erp-prototype/src/index.css`（新增 success / category token CSS variables）
  - `sens-erp-prototype/tailwind.config.ts`（extend colors 暴露新 class）
  - `sens-erp-prototype/DESIGN.md` §1.2 色彩清單 / §4.1 禁止事項補註
- **遷移頁面**：
  - `sens-erp-prototype/src/pages/AddProductionTasks.tsx`（CATEGORY_STYLES + Tab triggers + 印件名稱 badge）
  - `sens-erp-prototype/src/pages/WorkOrderDetail.tsx` 巢狀 Tab + 印件名稱 badge（若有）
  - `sens-erp-prototype/src/components/quote/QuoteDetailPage.tsx` 印件名稱 badge
  - `sens-erp-prototype/src/components/workorder/AddTaskCalcPanel.tsx` 印件名稱 badge
- **不受影響**：
  - 業務邏輯、資料模型、狀態機、商業流程
  - OpenSpec specs（純 UI token，無 requirement 變更）
  - 其他 Tailwind 色盤使用（warning / info / error 等語意色）
- **使用者體驗**：
  - 視覺無可見變化（HSL 值對應 Tailwind 原色，pixel-level 一致）
- **長期效益**：
  - 未來新增頁面直接用 token class（`bg-category-material-bg`），不用再查 Tailwind 色盤
  - 設計系統色盤可單點調整（改 CSS variable 即全站同步）
