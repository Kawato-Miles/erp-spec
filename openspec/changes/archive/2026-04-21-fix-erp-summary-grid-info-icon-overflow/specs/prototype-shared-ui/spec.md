## ADDED Requirements

### Requirement: ErpSummaryGrid hint 欄位 Info icon 可見性

`ErpSummaryGrid` 元件 label 區帶 `hint` 的欄位，Info icon SHALL 在任意 label 長度與任意 `cols`（2 / 3 / 4）設定下均完整可見，不得被固定寬、`whitespace-nowrap` 或外層 `overflow-hidden` 擠出或裁切。

#### Scenario: 長中文 label 下 Info icon 可見

- **WHEN** 欄位 label 為 10 字中文（例：「補件 loop 平均輪數」），`cols=4`，使用處未指定 `labelWidth`
- **THEN** Info icon MUST 顯示於 label 文字右側且完整可見，不得被 cell 邊界或根層 container 裁切

#### Scenario: 同 grid 內不同長度 label 的分界線對齊

- **WHEN** 同一 `ErpSummaryGrid` 的 items 含不同長度 label（例：短如「完成比」、長如「補件 loop 平均輪數」），使用處未指定 `labelWidth`
- **THEN** 元件 MUST 以「所有 items 中最寬 label（含 Info icon 區與 padding）」為基準，將統一寬度套用至每一 cell 的 label 區，確保同列各 cell 灰底 / 白底分界線對齊

#### Scenario: 短 label 下仍保留視覺對齊

- **WHEN** 所有 items 的 label 皆為 2-4 字中文（例：全部皆「完成比」級別短 label），`cols=4`，使用處未指定 `labelWidth`
- **THEN** label 區 MUST 具備最小寬度（至少 104px）以維持同列各欄位左邊緣視覺對齊

#### Scenario: 使用處仍可固定 labelWidth 以維持舊行為

- **WHEN** 使用處顯式傳入 `labelWidth={<number>}`（如 `labelWidth={104}`）
- **THEN** label 區 MUST 強制使用該固定寬度；元件對外 API 語意（`labelWidth`、`items`、`cols`、`hint`）MUST 保持相容

### Requirement: ErpSummaryGrid hint Tooltip 可完整顯示

當使用者 hover `ErpSummaryGrid` 欄位的 Info icon，Tooltip popover SHALL 完整顯示其 hint 文字內容，不得被 cell 邊界、grid 根層 `overflow-hidden` 或其他祖先元素裁切。

#### Scenario: Tooltip 超出 cell 邊界仍完整顯示

- **WHEN** 使用者 hover 某欄位 Info icon，該欄位 hint 文字寬度大於該 cell 寬度
- **THEN** Tooltip popover MUST 完整顯示所有 hint 文字（透過 Portal 機制 render 至 body 層，繞過祖先 `overflow` 裁切）

#### Scenario: rounded 裁切不影響 Tooltip

- **WHEN** `ErpSummaryGrid` 根層保留 `rounded-lg` 邊角裁切需求
- **THEN** Tooltip 顯示 MUST 不受 rounded 裁切邊界影響；cell 內容（label / value）MAY 保留原有裁切視覺

#### Scenario: 視窗寬度變化下 Tooltip 位置自動調整

- **WHEN** 瀏覽器視窗寬度變化導致 Tooltip 預設顯示位置超出可視範圍
- **THEN** Tooltip MUST 自動翻轉方向（例如由 top 翻轉為 bottom）以維持可視

### Requirement: ErpSummaryGrid 既有使用點視覺無回歸

本 capability 新增的 Info icon 可見性與 Tooltip 顯示要求，MUST 在既有所有使用點維持視覺一致性，不得引入明顯跑版或寬度跳動。

#### Scenario: 審稿主管 KPI 面板 7 項指標

- **WHEN** 開啟審稿主管工作台（`SupervisorDashboard` 的 KPI 概覽 Tab）
- **THEN** 7 項 KPI 欄位 MUST 各自顯示可見的 Info icon；hover 任一 icon MUST 顯示對應 hint 文字的完整 Tooltip

#### Scenario: 工單詳情整體進度摘要

- **WHEN** 開啟工單詳情（`WorkOrderDetail`）的整體進度摘要區塊
- **THEN** 欄位版面 MUST 與修改前視覺一致（左邊緣對齊、cell 寬度無明顯跳動）；若該處有 `hint` 欄位，Info icon 與 Tooltip MUST 符合上述可見性 / 完整性要求

#### Scenario: 其他詳情頁使用點

- **WHEN** 開啟任何使用 `ErpSummaryGrid` 的詳情頁（印件詳情、訂單詳情等）
- **THEN** 該頁 MUST 不出現寬度異常、欄位未對齊、hint 不可見或 Tooltip 被切等回歸症狀
