## MODIFIED Requirements

### Requirement: 批次新增生產任務

系統 SHALL 支援生管透過 side panel 逐筆新增生產任務，新增完成後回填至工單內的生產任務表格；選擇製程後內容下拉自動篩選可用選項，同廠商之生產任務於「儲存」時自動分組為同一任務（Task），Task 名稱 SHALL 為廠商名稱。

**UI 流程規範**：
- 新增入口 SHALL 為 side panel（非表格 inline 新增）；使用者點擊工單內「新增生產任務」進入新增頁，該頁分三個分類 Tab（材料 / 工序 / 裝訂），各 Tab 內的「新增一筆」按鈕 SHALL 開啟對應分類的 side panel
- Side panel 外殼 SHALL 使用 `ErpSidePanel size="xl"`（720px 寬），header actions 放「取消 / 確認新增」雙按鈕
- Panel 內欄位 SHALL 分區塊呈現，依序：
  1. **BOM 選擇**（材料三層 / 工序兩層 / 裝訂單層；最末層下拉 SHALL 以副文字顯示 pricing method，搜尋同時 match label 與 meta）
  2. **廠商**（唯讀，選 BOM 後自動帶入；`ErpInput readOnly bg-muted`）
  3. **計價選擇** 區塊（含「計價方式」唯讀欄位 + 依 BOM pricingMethod 動態渲染 1~2 個 pricing_selection 下拉）
  4. **製作細節**（`ErpTextarea`）
  5. **數量**（「影響成品數量」toggle 於最前、label 左 / Switch 右；數量 + 單位兩欄 grid；工序 / 裝訂 SHALL 含「設備」欄位，材料 SHALL NOT 含設備欄位）
  6. **色數與特殊色**（僅工序分類顯示）：正 / 背面色數 input SHALL NOT 顯示；改為點擊「Pantone / 金銀白螢光 / 最低色數」按鈕累加 `specialColors` 陣列（允許重複），chip 顯示累計次數並可點 X 減一次
- Panel 欄位元件 SHALL 使用 Erp* atom/molecule 共用元件：
  - Label + field 包裝：`ErpEditFormCard.Field` / `.Row` / `.FullRow`
  - Input / Textarea / Select：`ErpInput` / `ErpTextarea` / `ErpSelect`
  - 搜尋下拉：`SearchableSelect size="panel"`
- Panel 必填欄位 SHALL 為「BOM 最末層選擇」與「數量 > 0」；未填時 SHALL 高亮提示但不禁用送出按鈕
- Panel 送出後 SHALL append 至對應分類的生產任務表格並關閉 panel；取消 SHALL 丟棄當前 draft，下次開啟時 panel 欄位 SHALL 重置為空
- 生產任務表格初始狀態無 draft 時 SHALL 顯示空狀態提示「尚無資料，點擊右上『新增一筆』開始填寫」
- Panel 新增後的既有表格列 SHALL 保留 inline 編輯能力（使用者可直接修改 cell），編輯路徑不變
- 材料分類表格 SHALL NOT 包含「設備」欄位（設備不參與材料計價）；工序 / 裝訂表格保留設備欄

**單位 LOV**（`PRODUCTION_TASK_UNITS`）：`張 / 令 / 本 / 件 / 個 / 份 / 組 / 套 / 冊 / 盒 / 批 / 卷 / 面 / 塊 / 片 / 時 / 趟`；選 BOM 後系統 SHALL 自動帶入主檔單位，使用者可改選其他單位。

**分組規範**（UI 形式調整不改變分組行為）：
- 使用者點擊最終「儲存」時，系統 SHALL 依 `factory` 欄位將所有 draft rows 分組
- 同廠商之生產任務 SHALL 合併為同一 `Task`，`Task.name` SHALL 為廠商名稱

#### Scenario: US-WO-010 透過 side panel 批次新增生產任務

- **WHEN** 生管於工單的新增生產任務頁，在「材料」Tab 點擊「新增一筆」
- **THEN** 系統 SHALL 開啟材料分類的 side panel，panel 內容 SHALL 依序呈現 BOM 三層選擇（群組 / 材料 / 規格）、廠商（唯讀）、計價選擇（含計價方式）、製作細節、數量（含影響成品 toggle + 單位 LOV，材料無設備）
- **AND** 選擇製程 / BOM 後，系統 SHALL 自動篩選下層下拉選項並帶入廠商與單位
- **AND** 填寫完必填欄位後點擊「確認新增」，系統 SHALL 於「材料」Tab 表格末尾 append 新列並關閉 panel
- **AND** 重複對「工序」「裝訂」Tab 各新增數筆後點擊頁面上方「儲存」
- **AND** 系統 SHALL 依 factory 欄位將所有生產任務分組為多個 Task；同廠商之生產任務 SHALL 合併於同一 Task，Task 名稱 SHALL 為廠商名稱

#### Scenario: Panel 取消丟棄 draft

- **WHEN** 生管開啟新增 panel 填寫部分欄位後點擊「取消」
- **THEN** Panel SHALL 關閉且當前 draft SHALL NOT append 至表格
- **AND** 再次開啟同分類 panel 時，欄位 SHALL 為空（與 `emptyRow()` 一致）

#### Scenario: 表格空狀態

- **WHEN** 生管進入新增生產任務頁，三分類皆未新增任何 draft
- **THEN** 三個分類 Tab 的表格 SHALL 顯示空狀態提示「尚無資料，點擊右上『新增一筆』開始填寫」
- **AND** 任一分類新增一筆後，該分類空狀態提示 SHALL 消失

#### Scenario: 工序分類色數點擊累加

- **WHEN** 生管於工序 panel 選好設備（支援色數），在「色數與特殊色」區塊點擊「金銀白螢光」按鈕兩次
- **THEN** 系統 SHALL 將 `specialColors` 陣列 push 兩個 `metallic`，chip SHALL 顯示「金銀白螢光 × 2」
- **AND** 色數加價計算 SHALL 對每次點擊累加一次倍率（`calculateColorCost` 對陣列逐一加價）
- **WHEN** 使用者點擊 chip 右側 X
- **THEN** 系統 SHALL 從陣列移除一次該色（lastIndexOf + splice），chip 數字遞減

#### Scenario: 材料分類無設備欄

- **WHEN** 生管開啟材料分類 panel 或檢視材料分類表格
- **THEN** panel 數量區塊 SHALL NOT 顯示「設備」欄位；材料表格 SHALL NOT 包含「設備」欄
- **AND** 工序 / 裝訂分類仍 SHALL 顯示設備欄位
