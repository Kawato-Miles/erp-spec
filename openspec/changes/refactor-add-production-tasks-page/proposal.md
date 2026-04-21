## Why

新增生產任務頁（`AddProductionTasks.tsx`）是工單建立時「批次輸入材料 / 工序 / 裝訂」的主要介面，使用者同時在此頁觀察「目前累計成本」來判斷訂單利潤合理性。但目前頁面有兩個問題：

1. **成本資訊不醒目**：整個頁面的成本數字只在 `ErpPageHeader` 的 badges 區裡以一行小灰字呈現（「預估成本 NT$ X」），且只有總計、無分類小計，使用者必須邊填邊心算，認知負荷高
2. **樣式與全站共用元件脫鉤**：頁面手寫 `<div className="bg-white border border-[#e3e4e5] rounded-xl">` 做容器、手寫 `<table>` 做表格、用 `INP` / `SEL` 自定義原生 input/select class，沒套用 DESIGN.md §1.4 指定的 `Erp*` 通用元件（`ErpDetailCard` / `ErpInfoTable` / `ErpTableCard` / `.erp-table`）與設計 token，造成視覺與行為不統一

本 change 為 P1 範疇（視覺層重構，快速見效）；P2（`ErpInput` / `ErpSelect` 新增 compact 變體、Tab 與 badge 的色盤全面 tokenize）另開 change。

## What Changes

**A. 成本區塊重新設計（解決問題 1）**
- 頁面頂部 `ErpPageHeader` 下方新增 `ErpSummaryGrid` 4 欄摘要：`材料小計 | 工序小計 | 裝訂小計 | 總計`（即時計算，0 筆資料時顯示 `—`）
- `ErpPageHeader` badges 區移除原有「預估成本 NT$ X」小字（避免資訊重複）
- 右側 sticky 欄位保留 `AddTaskCalcPanel`（拼版試算），下方新增「成本明細」卡片：逐筆列出目前已輸入的 row 與對應成本貢獻（名稱、單價 × 數量、小計），點擊可鎖定對應 row（後續階段可考慮）

**B. 容器與表格 tokenize（解決問題 2）**
- 工單資訊卡片（手寫 `<div>`）→ `ErpDetailCard` + `ErpInfoTable`
- 三分類 Tab 外層容器（手寫 `<div>`）→ `ErpDetailCard`
- 三個 Section 內的 `<table>` → 套 `.erp-table` class（與全站列表頁表格一致）
- 各處寫死的 hex（`#e3e4e5` / `#232324` / `#636466` 等）→ 對應 design token

**不動（本 change 範圍外）**
- 資料模型（`DraftRow` / `Task` / `ProductionTask`）、`handleSave` 分組邏輯、色數計算 util
- 新增 panel（`AddProductionTaskPanel`）內部結構（已於上次 change 完成）
- 表格 cell 內的原生 `<input>` / `<select>`（P2 `ErpInput compact` / `ErpSelect compact` 另開 change 後再遷移）
- Tab 三色 badge 與印件名稱 badge 的色盤（P2 tokenize）

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

- `work-order`：修改「批次新增生產任務」requirement 的 UI 規範區塊，補充：
  - 新增生產任務頁 SHALL 於頁面頂部呈現 `ErpSummaryGrid` 成本摘要（4 欄：材料 / 工序 / 裝訂 / 總計）
  - 頁面容器 SHALL 使用 `ErpDetailCard`，表格 SHALL 套 `.erp-table` class
  - `ErpPageHeader` SHALL NOT 重複顯示成本（交由頁面頂部摘要）

## Impact

- **受影響 Prototype 檔案**：
  - `src/pages/AddProductionTasks.tsx`（主要修改：ErpPageHeader badges 精簡、加 ErpSummaryGrid 摘要、兩個手寫容器改 ErpDetailCard、三個 Section 的 table 套 .erp-table）
  - `src/components/workorder/AddTaskCalcPanel.tsx`（可能擴充為「拼版試算 + 成本明細」組合）
- **不受影響**：
  - ERP 資料模型、狀態機、商業流程
  - 其他模組（需求單、訂單、QC、出貨、採購、倉儲）
  - BOM 主檔、新增生產任務 panel（`AddProductionTaskPanel`）
  - OpenSpec 其他 specs（僅 `work-order/spec.md` 的批次新增生產任務 requirement UI 區塊補充）
- **使用者體驗**：
  - 正向：成本資訊一眼可見（4 欄摘要 + 右側明細），視覺與全站其他頁面（列表頁 / 詳情頁）一致
  - 需觀察：右側 sticky 「拼版試算」與「成本明細」並存時，垂直空間是否足夠（可能需要縮摺或 Tab 切換）
- **相關 User Story**：[US-WO-010 批次新增生產任務](https://www.notion.so/3313886511fa811a8493cff779df01d8)（流程不變，僅 UI 視覺調整）
