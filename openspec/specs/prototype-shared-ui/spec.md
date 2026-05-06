# Prototype Shared UI

## Purpose

規範 Prototype 共用 UI 元件的呈現合約（presentation contract），確保共用元件在所有使用點維持一致的視覺與互動行為，不涉及業務邏輯。

此 capability 為後續共用元件規格化的起點；新的共用元件呈現規範（例如欄位摘要格線、資訊提示、對話框、空狀態等）可於此 capability 持續累積。

適用範圍：位於 `sens-erp-prototype/src/components/layout/` 與 `sens-erp-prototype/src/components/shared/` 的共用展示元件。不涵蓋 shadcn/ui 原生元件（那些遵循 shadcn/ui 官方合約）。

## Requirements

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

### Requirement: 印件詳情頁 Tabs 化版型

印件詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → （條件性 InfoBanner）→ Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 印件名稱（標題）
- 印件狀態 Badge（badges slot 內，使用 `PrintItemStatusBadge` + `derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))`，對齊 [openspec/specs/state-machines/spec.md](../state-machines/spec.md) 印件狀態機）
- 主動作群（依使用情境條件顯示：批次報工 / 清除選取 / 分配印件）

印件詳情頁 SHALL 包含 7 個 Tab，順序：`資訊（首位，defaultValue）→ 審稿紀錄 → 工單與生產任務 → QC 紀錄 → 轉交單 → 出貨單 → 活動紀錄`。

「資訊」Tab 為 [refactor-detail-pages-to-subheader-tab-layout](../../changes/archive/) 新增 Tab，SHALL 承載原 Tabs 之上資訊區的三張資訊卡：印件資訊卡 / 印件檔案卡 / 生產資訊卡。三張卡 SHALL 依 DESIGN.md §0.1「印件三分類獨立 ErpDetailCard」規範，依「印件資訊 → 印件檔案 → 生產資訊」順序單欄垂直排列，保留 `ErpDetailCard` 邊框。

附註：本 requirement 暫掛 `prototype-shared-ui` capability，OQ-2 標明印件詳情頁 spec capability 歸屬待後續決定（候選：維持本 capability / 新建 `print-item` / 併入 `prepress-review`）。

#### Scenario: 印件詳情頁進入後預設停留資訊 Tab

- **WHEN** 業務或印務進入印件詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 依序顯示印件資訊卡 → 印件檔案卡 → 生產資訊卡，三卡保留 `ErpDetailCard` 邊框

#### Scenario: 印件詳情頁狀態 Badge 顯示

- **WHEN** 使用者進入印件詳情頁
- **THEN** `ErpPageHeader` badges slot SHALL 顯示 `PrintItemStatusBadge`
- **AND** Badge 顯示文字與顏色 SHALL 對齊 [openspec/specs/state-machines/spec.md](../state-machines/spec.md) 印件狀態機定義
- **AND** Badge 狀態值 SHALL 由 `derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))` 推導

#### Scenario: 印件詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽印件詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 審稿紀錄 → 工單與生產任務 → QC 紀錄 → 轉交單 → 出貨單 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）

#### Scenario: 印件詳情頁資訊區重組

- **WHEN** 業務或印務進入印件詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「印件資訊」「印件檔案」「生產資訊」三張卡
- **AND** 三張卡 SHALL 在「資訊」Tab 內依規範順序單欄垂直排列
