## Why

新增生產任務頁（`AddProductionTasks.tsx`）的三分類表格（材料 / 工序 / 裝訂）內部，每 row 的 cell 是**可編輯的 input / select**（不是純文字顯示），屬於「表單列」場景。目前這類 cell 的欄位樣式是**頁面層 inline 定義**：

```tsx
const INP = 'h-7 w-full rounded border border-input bg-background px-1.5 text-xs';
const SEL = 'h-7 w-full rounded border border-input bg-background px-1.5 text-xs';
```

問題：
1. **Atom 樣式散落**：同樣是 input / select 在 panel / 編輯頁時用 `ErpInput`（h-8 / rounded-sm / text-sm），在表格 cell 時 inline 手寫 h-7 text-xs，每個新表格頁都要再定義一次
2. **表格樣式未統一**：全站列表頁用 `.erp-table` class（header 灰底 + border + hover 等），但表單列場景（cell 內嵌 input）因 `.erp-table` 的 `td padding 16px + min-height 52px` 太寬鬆，無法直接套用，改而手寫 `<table>` 樣式
3. **上個 change（refactor-add-production-tasks-page）刻意跳過 `.erp-table` 套用，留下 P2 待辦**

## What Changes

**新增 3 個 atom / CSS class**：

- **`ErpInput compact` 變體**：`ErpInput` 新增 `size?: 'default' | 'compact'` prop；`compact` 版 = `h-7 px-1.5 text-xs`，對齊既有 INP 樣式，適合表格 cell 密集場景
- **`ErpSelect compact` 變體**：`ErpSelect` 同上加 `size` prop；`compact` 版 = `h-7 px-1.5 pr-6 text-xs` + 縮小 ChevronDown icon
- **`.erp-form-table` CSS class**：`src/index.css` 新增，與 `.erp-table` 共用 header 灰底 / border / hover 規格，但 `td` 與 `th` padding 縮為密集（`padding: 6px 8px`，對齊原 INP 的 `h-7 px-1.5` 風格），`td` 無 `min-height`

**套用至 AddProductionTasks 三分類表格**：
- `MaterialSection / ProcessSection / BindingSection` 的 `<table>` 加 `className="erp-form-table"`，同步移除 inline `<thead><th className="...">` 的 class（改由 CSS 定義）
- `ContentRow` 的 9 個共用尾段 cells + 三個 BOM leading cells 內的原生 `<input className={INP}>` / `<select className={SEL}>` 改為 `<ErpInput size="compact">` / `<ErpSelect size="compact">`
- 移除頁面層 `const INP` / `const SEL` 常數
- SearchableSelect 的 compact 變體已於上個 change 完成（`size="compact"` default），本次不動

**不動**：
- 色數子行的 `<input type="number">` 手動 class（若屬必要再列 P2）
- Tab 三色 badge 與印件名稱綠 badge（另開 `tokenize-category-colors` change）
- `ErpDetailTabs` atom 抽出（另開 `extract-erp-detail-tabs` change）

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

- `work-order`：補充「批次新增生產任務」requirement 的 UI 規範 — 表格 cell 場景 SHALL 使用 `ErpInput size="compact"` / `ErpSelect size="compact"`；表格外層 SHALL 套 `.erp-form-table` class（取代上個 change 跳過的 `.erp-table`）

## Impact

- **新增 / 修改 atom**：
  - `src/components/shared/ErpFormField.tsx`（`ErpInput` / `ErpSelect` 加 `size` prop）
  - `src/index.css`（新增 `.erp-form-table` class）
  - `sens-erp-prototype/DESIGN.md` §1.4 更新（Atom 層文件化 compact 變體 + `.erp-form-table`）
- **套用頁面**：
  - `src/pages/AddProductionTasks.tsx`（三分類表格 + ContentRow 內原生 input/select → Erp* compact）
- **不受影響**：
  - 業務邏輯、資料模型、狀態機、商業流程
  - 其他模組（需求單、訂單、QC、出貨、採購、倉儲）
  - 新增生產任務 panel（`AddProductionTaskPanel` 內欄位已用 `ErpInput` default size）
  - 其他既有表格頁（列表頁仍用 `.erp-table`，本次不觸）
- **使用者體驗**：
  - 正向：表格 cell 視覺（邊框 / hover / header 灰底）與全站列表頁對齊；新的表單表格頁可直接用 `.erp-form-table` + Erp* compact 無需手寫 class
  - 風險：`.erp-form-table` 的 padding 需對齊原 INP 的 `h-7 px-1.5` 視覺，首次套用需驗證無意外縮放
