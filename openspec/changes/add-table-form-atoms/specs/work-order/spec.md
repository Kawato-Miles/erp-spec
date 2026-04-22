## MODIFIED Requirements

### Requirement: 批次新增生產任務

（既有規範維持不變；此 delta 僅補充「表格 cell 場景」的 atom / CSS 規範。）

**表格 cell atom 規範**（add-table-form-atoms，2026-04-22）：
- 三分類生產任務表格（`MaterialSection / ProcessSection / BindingSection`）的 `<table>` SHALL 套用 `.erp-form-table` CSS class（header 灰底 / border / hover 與 `.erp-table` 視覺一致，但 padding 為密集 `6px 8px`，適合 cell 內嵌 input 的表單列場景）
- 表格 cell 內的輸入元件 SHALL 使用 Erp* atom 的 compact 變體：
  - `<input type="text">` / `<input type="number">` / `<input type="date">` → `<ErpInput size="compact">`
  - `<select>` → `<ErpSelect size="compact">`
  - 搜尋下拉已使用 `<SearchableSelect size="compact">`（既有）
- 頁面層 SHALL NOT 定義自製 INP / SEL class 常數（例如 `const INP = 'h-7 w-full rounded...'`）
- `ErpInput` / `ErpSelect` 的 `size` prop：`'default'`（panel / form 場景，h-8 / text-sm）、`'compact'`（表格 cell 場景，h-7 / text-xs）

#### Scenario: 表格 cell 視覺與全站一致

- **WHEN** 生管進入新增生產任務頁
- **THEN** 三分類表格 SHALL 有統一的 header 灰底 / border / hover 樣式（由 `.erp-form-table` 提供），與全站其他 `.erp-table` 列表頁視覺一致
- **AND** 每個 cell 的 input / select SHALL 使用 `ErpInput size="compact"` / `ErpSelect size="compact"`，高度 28px、字 12px、圓角 8px
- **AND** 頁面內容不得出現 inline 寫死的 `h-7 border-input text-xs` input class（由 atom 統一提供）
