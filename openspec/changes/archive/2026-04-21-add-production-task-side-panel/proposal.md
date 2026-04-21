## Why

目前 Prototype 的「新增生產任務」頁（`AddProductionTasks.tsx`）把新增入口設計成「在 table 上 append 空 row 後 inline 填寫」。三分類（材料 / 工序 / 裝訂）每列 14–16 欄，工序還有色數子行，cell 內的 `<select>` / `<input>` 過於緊湊，必填欄位不顯眼，使用者填寫時視線要在密集表格中來回跳。此設計讓 User Story [US-WO-010「批次新增生產任務」](https://www.notion.so/3313886511fa811a8493cff779df01d8) 定義的「表格對話框逐列新增」流程在實際操作時 UX 被表格佈局綁架。

本 change 將「新增」入口改為 side panel（`ErpSidePanel size="xl"`），分 section 垂直引導填寫；送出後才 append 到 table；既有 table inline 編輯保留不動。這是純 UI 層形式調整，不影響 US-WO-010 定義的成功條件（即時計算、廠商自動帶入、儲存後同廠商自動合併）。

## What Changes

- 新增：`AddProductionTaskPanel.tsx`（side panel 主元件，依 `category` 條件渲染三分類表單）
- 新增：`useColorCostDerived.ts`（hook，封裝色數 derive 邏輯供 panel 與現有 table `ContentRow` 共用，避免雙份維護色數 / 特殊色 / 設備倍率 / 2–3 色警告規則）
- 修改：`AddProductionTasks.tsx`
  - 三個 `useState<DraftRow[]>([emptyRow()])` → `useState<DraftRow[]>([])`，初始無預設 draft
  - Tab 內「新增一筆」按鈕從「append 空 row」改為「開 panel」
  - 新增頂層 `panelState`（`{ open, category }`）與 `handleAppend(row)` 分派 handler
  - 三個 `Section` 組件加空狀態 UI（`rows.length === 0` 顯示「點擊新增一筆開始填寫」）
  - `canDelete` 移除「保留最後一筆」限制，允許刪至 0
  - `ContentRow` 的色數計算 derive 改用 `useColorCostDerived` hook，JSX 不動
- 不改：
  - `DraftRow` 型別（panel 與 table 共用）
  - `handleSave` 分組邏輯（同廠商合併 Task 群組）
  - BOM / 計價 / 色數計算 utility（`bomMasterMock.ts`、`equipmentCost.ts`）
  - `ErpSidePanel` 本身（前一個 change 已完成）
  - table 既有 inline 編輯行為、欄位佈局、欄寬
- 範圍外：
  - 「編輯」路徑改為 panel（本次保留 inline，觀察 UX 後再決）
  - DraftRow 資料模型 / 分組邏輯 / 計算規則 / 狀態機 / 流程 / 角色

## Capabilities

### New Capabilities

無新 capability。

### Modified Capabilities

- `work-order`：修改「批次新增生產任務」requirement（[work-order/spec.md:287](../../specs/work-order/spec.md)）。原敘述「透過表格介面批次新增多筆生產任務」的 UI 形式，調整為「透過 side panel 逐筆新增並累積於表格，儲存時系統依廠商分組」。核心成功條件（製程篩選內容、廠商自動帶入、同廠商合併為 Task、即時計算預估成本）完全保留；僅「批次建立的 UI 形式」從「表格直接 inline 填寫」改為「side panel 填寫後回填表格」。

## Impact

- **受影響 Prototype 檔案**：
  - `src/pages/AddProductionTasks.tsx`（主要修改）
  - `src/components/workorder/AddProductionTaskPanel.tsx`（新增）
  - `src/components/workorder/useColorCostDerived.ts`（新增）
- **不受影響**：
  - ERP 資料模型（`DraftRow` / `Task` / `ProductionTask`）、狀態機、商業流程
  - 其他模組（需求單、訂單、QC、出貨、採購、倉儲）
  - BOM 主檔（材料 / 工序 / 裝訂）
  - OpenSpec specs（`work-order/spec.md`、`production-task/spec.md`、`state-machines/spec.md` 等）
- **使用者體驗**：
  - 正向：新增流程視線集中、必填欄位清晰、色數與特殊色有獨立 section、預估成本即時摘要
  - 需觀察：新增完成後 table 仍可 inline 編輯，UX 混合模式是否造成認知斷裂；若高頻需回改 table，下一輪可能將編輯路徑也遷入 panel
- **相關 User Story**：[US-WO-010 批次新增生產任務](https://www.notion.so/3313886511fa811a8493cff779df01d8)（成功條件不變，流程說明「開啟表格對話框 → 逐列選擇」實際 UI 形式由本 change 調整為「panel 單筆填寫 → append 到 table」，最終儲存分組邏輯相同）
