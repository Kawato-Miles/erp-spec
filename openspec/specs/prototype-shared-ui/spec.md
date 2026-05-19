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

### Requirement: 列表頁標準佈局

Prototype 中所有列表頁 SHALL 採用統一的搜尋區結構，以降低跨模組學習成本並達成可稽核的一致性。基準範本為 `src/components/quote/QuoteListPage.tsx`（canonical reference）。

**核心結構**：
- 列表頁主體 SHALL 由「搜尋 Card → 操作列 → 表格 Card → 分頁」四個區塊組成
- 搜尋 Card 內部 SHALL 依「搜尋框 → 篩選器 grid → `StatusCard` 統計 grid」順序排列
- 列表頁 MUST NOT 使用「KPI Card / 篩選 Tab / 搜尋 Card」分多個獨立區塊的結構

**容器規範**：
- 搜尋 Card 與表格 Card 圓角 SHALL 使用 `rounded-lg`
- 搜尋 Card 標題（如「搜尋需求單」、「搜尋待收訂單」）SHALL 使用 `text-sm font-medium`
- 搜尋 Card 內部使用 `p-5 space-y-4`

**搜尋框規範**：
- 搜尋框 SHALL 左側內嵌 `Search` icon（`lucide-react` 的 `Search` 元件，使用 `absolute left-3 top-1/2 -translate-y-1/2`）
- `Input` 元件 SHALL 加 `pl-9` 給 icon 留空間
- placeholder 文字 SHALL 描述可搜尋的欄位（例：「請輸入訂單編號、案名或客戶名稱」）

**狀態主篩規範**：
- 列表頁的「狀態主篩」MUST 使用 `<select>` 元件，**MUST NOT 使用 `ErpStatusTabs`**
- 狀態 select 數量視業務需要，可以是 1 欄（不強行補滿 grid-4）
- 多個 select 共存時 SHALL 使用 `grid grid-cols-N gap-4` 排列（N = 篩選器數量，上限 4）

**「列表頁狀態主篩」vs「上層 view 切換」操作性判定**：

為避免後續開發者語感歧義，採以下明確判定規則決定該用 `<select>` 還是 `ErpStatusTabs`：

| 判定條件 | 是否為「列表頁狀態主篩」 | 應使用 |
|---------|--------------------|--------|
| Tab 切換的是 entity 主狀態欄位（如 `status` enum 值），且切換後底部表格資料的範圍變更為該狀態的子集 | 是 | `<select>` |
| Tab 切換的是視角 / 角色 / view 模式（如「我的訂單」/「全部訂單」/「待我處理」），切換後可能改變整個資料來源 | 否 | `ErpStatusTabs` 仍可 |
| Tab 切換的是同一資料的不同呈現（如收件匣的「未讀」/「已讀」/「已封存」） | 否 | `ErpStatusTabs` 仍可 |
| Tab 在詳情頁（如印件詳情頁的「資訊 / 進度 / 審稿 / 異動 / 附件」） | 否（詳情頁非列表頁） | `ErpDetailTabs` |

**正例**：印件詳情頁的 Tab（資訊 / 進度 / 審稿 / 異動 / 附件）使用 `ErpDetailTabs` — 不屬列表頁。

**反例**：本 change 之前的 `Receivables.tsx` 用 `ErpStatusTabs` 切換「全部 / 未到期 / 1-29 / 30-59 / 60-89 / ≥90 天」— 這切換的是 `bucket` 主狀態，屬「列表頁狀態主篩」，**違規** — 應改為 `<select>`。

**KPI 統計卡規範**：
- 列表頁 KPI 統計卡 SHALL 使用 `StatusCard` 元件（位於 `src/components/shared/StatusCard.tsx`），**MUST NOT 使用自定義的 `StatItem` 純文字樣式**
- `StatusCard` SHALL 包含 icon + label + count + 色彩標識（icon 背景色 + icon 顏色）
- KPI 卡片數量視業務必要性，1-4 卡皆可（不強制 grid-4）
- KPI 數值來源 SHALL 為當前篩選結果（`rows`），非全域 `allRows`
- 篩選狀態非預設（search 非空或 select 非預設值）時，StatusCard SHALL 傳 `filtered={true}` 顯示「（當前篩選）」標記

**強制元件**：
- 列表頁 SHALL 使用 `ErpTableCard` 包裝表格
- 列表頁 SHALL 使用 `erp-table` class 作為表格主結構
- 表格空狀態 SHALL 使用 `ErpEmptyState`
- 分頁 SHALL 使用 `ErpPagination`（如有）

**分頁重置**：
- 搜尋 / 篩選變更時 SHALL 呼叫 `setPage(1)` 重置分頁

#### Scenario: 列表頁採用單一搜尋 Card 結構

- **WHEN** 開發者撰寫新的列表頁
- **THEN** 列表頁主體採用「搜尋 Card（含搜尋框 + 篩選器 + KPI）→ 操作列 → 表格 → 分頁」結構
- **AND** 不出現「KPI 獨立 Card + 篩選 Tab + 搜尋 Card」三區塊分離的佈局

#### Scenario: 列表頁狀態主篩使用 select 而非 ErpStatusTabs

- **WHEN** 列表頁需要按 entity 主狀態欄位（如 `status` enum）篩選資料
- **THEN** 開發者使用 `<select>` 元件實作狀態篩選，置於搜尋 Card 內篩選器 grid 中
- **AND** 不使用 `ErpStatusTabs` 作為列表頁狀態主篩
- **AND** `ErpStatusTabs` 仍可用於 view / 視角切換等場景（依操作性判定）

#### Scenario: 列表頁 KPI 卡使用 StatusCard 元件

- **WHEN** 列表頁需要呈現 KPI 統計
- **THEN** 開發者使用 `StatusCard` 元件，傳入 icon / label / count / iconBg / iconColor 屬性
- **AND** 不使用自定義的純文字 StatItem 樣式
- **AND** StatusCard 統計 grid 置於搜尋 Card 內部下方（篩選器之下）

#### Scenario: 列表頁 KPI 數值依篩選結果動態調整

- **WHEN** 使用者在列表頁變更搜尋關鍵字或 select 篩選條件
- **THEN** StatusCard 顯示的數值對應「當前篩選結果」（`rows`）
- **AND** 不顯示全域未篩選的 `allRows` 數值

#### Scenario: 列表頁篩選非空時 StatusCard 顯示「當前篩選」標記

- **WHEN** 使用者在列表頁的搜尋框輸入文字或變更 select 篩選至非預設值
- **THEN** StatusCard 元件接收 `filtered={true}` prop
- **AND** Card 上顯示「（當前篩選）」muted text 或「已篩選」小 badge
- **WHEN** 使用者清空搜尋與篩選回到預設值
- **THEN** StatusCard 元件接收 `filtered={false}` prop
- **AND** 「（當前篩選）」標記消失，StatusCard 顯示為全域 KPI 視覺

#### Scenario: 列表頁搜尋框左側內嵌 Search icon

- **WHEN** 列表頁包含搜尋框
- **THEN** 搜尋框左側內嵌 `Search` icon（`lucide-react`），Input 加 `pl-9`
- **AND** 不出現「無 icon 的純文字輸入框」

#### Scenario: 列表頁篩選 / 搜尋變更時重置分頁

- **WHEN** 使用者變更搜尋關鍵字、select 篩選器或任一篩選條件
- **THEN** 列表頁的當前分頁狀態 SHALL 呼叫 `setPage(1)` 重置為第 1 頁
- **AND** 表格顯示為「篩選後第 1 頁」內容，而非保留原分頁編號

#### Scenario: 列表頁稽核清單可逐項對照

- **WHEN** 開發者或審查者檢查列表頁實作
- **THEN** 可逐項對照 DESIGN.md § 6.1「列表頁稽核清單」（單一搜尋 Card / select 而非 Tab / StatusCard 而非 StatItem / 使用共用元件等）
- **AND** 不符合任一項時 PR 應退回修正

### Requirement: StatusCard 元件支援字串型 count 與篩選中標記

`StatusCard` 元件（`src/components/shared/StatusCard.tsx`）SHALL 擴充以下能力，以支援列表頁標準佈局的金額類 KPI 與篩選中標記。

**型別擴充**：
- `count` 屬性型別 SHALL 為 `number | string`，以支援 formatted string（如「NT$ 1,234,567」）
- 既有 `number` 入參 SHALL 自動相容（向下相容，無需修改既有使用點）

**篩選中標記 prop**：
- 新增 `filtered?: boolean` prop，預設 `false`
- `filtered=true` 時，Card 上 SHALL 顯示「（當前篩選）」muted text 或「已篩選」小 badge
- 視覺方案任一即可，依視覺權衡決定（建議：label 後 muted text，避免 Card 右上 badge 與 icon 視覺衝突）

**既有使用點影響**：
- 元件擴充 SHALL 反向相容，所有既有使用點（QuoteListPage / 審稿主管 KPI 面板 / 工單詳情整體進度摘要 / 其他詳情頁使用點）無視覺變化
- 視覺無回歸驗證 SHALL 在 Task 0 完成後執行

#### Scenario: StatusCard count 接受 number 型別

- **WHEN** 開發者傳入 `count={5}`（number 型）
- **THEN** Card 顯示「5」
- **AND** 與既有 `number` 入參使用方式完全一致

#### Scenario: StatusCard count 接受 string 型別

- **WHEN** 開發者傳入 `count="NT$ 1,234,567"`（string 型）
- **THEN** Card 顯示「NT$ 1,234,567」原樣字串
- **AND** 不執行 toLocaleString() 或數字格式化

#### Scenario: StatusCard 篩選中顯示標記

- **WHEN** 開發者傳入 `filtered={true}`
- **THEN** Card 上顯示「（當前篩選）」muted text 或「已篩選」badge
- **AND** 視覺上可清楚識別當前數值為篩選後結果，非全域 KPI

#### Scenario: StatusCard 既有使用點視覺無回歸

- **WHEN** 元件擴充完成後檢查既有 4 個使用點（QuoteListPage / ErpSummaryGrid 審稿主管 / 工單詳情 / 其他詳情頁）
- **THEN** 元件 render 結果與擴充前完全一致
- **AND** 沒有任一既有使用點需要修改 props 才能維持原本行為

### Requirement: 款項管理列表頁對齊基準範本

款項管理三模組（應收款項 / 待開發票 / 帳務異常）列表頁 SHALL 依「列表頁標準佈局」Requirement 實作，與 `QuoteListPage` 對齊。

**應收款項（Receivables）**：
- 搜尋 Card 內 SHALL 包含搜尋框（按訂單編號 / 案名 / 客戶搜尋）+ 1 個逾期狀態 select（全部 / 未到期 / 1-29 / 30-59 / 60-89 / ≥90 天）+ 4 個 `StatusCard`（待收訂單 / 待收金額 / 逾期未收 / 逾 30 天）
- StatusCard 數值 SHALL 反映當前篩選結果（`rows`）
- 篩選非預設時 StatusCard 傳 `filtered={true}`

**待開發票（PendingInvoices）**：
- 搜尋 Card 內 SHALL 包含搜尋框 + 1 個發票狀態 select（全部 / 尚有時間 / 即將到期 / 今天 / 逾期）+ 4 個 `StatusCard`（待開總筆數 / 待開金額 / 逾期未開 / 即將到期）
- 「業務尚未規劃」的提示文字 SHALL 保留（內容置於搜尋 Card 內或操作列附近，依視覺權衡決定具體位置）

**帳務異常（BillingAnomalies）**：
- 搜尋 Card 內 SHALL 包含搜尋框 + 1 個異常類型 select（全部 / 退印未折讓 / 加印未開發票 / 退款未實際退款 / 超收）+ `StatusCard` grid
- KPI 卡片數量視 OQ-1 決議（候選：grid-4「訂單帳不平 / 異常項目 / 最常見異常類型 / 平均異常金額」或 grid-2「訂單帳不平 / 異常項目」或 grid-2 + 上方 message strip）
- 三視角審查共識建議 grid-2 起步

#### Scenario: Receivables 列表頁搜尋區符合標準佈局

- **WHEN** 使用者進入 `/finance/receivables` 列表頁
- **THEN** 看到單一搜尋 Card，內含搜尋框（左 Search icon）+ 1 欄逾期狀態 select + 4 個 StatusCard
- **AND** 不出現獨立 KPI Card 與 ErpStatusTabs

#### Scenario: PendingInvoices 列表頁搜尋區符合標準佈局

- **WHEN** 使用者進入 `/finance/pending-invoices` 列表頁
- **THEN** 看到單一搜尋 Card，內含搜尋框（左 Search icon）+ 1 欄發票狀態 select + 4 個 StatusCard
- **AND** 業務尚未規劃的提示文字仍可見

#### Scenario: BillingAnomalies 列表頁搜尋區符合標準佈局

- **WHEN** 使用者進入 `/finance/billing-anomalies` 列表頁
- **THEN** 看到單一搜尋 Card，內含搜尋框（左 Search icon）+ 1 欄異常類型 select + StatusCard grid（卡片數量依 OQ-1 決議）
- **AND** 不出現獨立 AlertTriangle 警告 Card 與 ErpStatusTabs

#### Scenario: 三模組 StatusCard 數值依篩選結果動態重算

- **WHEN** 使用者在三模組任一列表頁輸入搜尋關鍵字或變更 select 篩選
- **THEN** StatusCard 顯示的數值（筆數 / 金額合計）為當前篩選結果（`rows`）的彙總
- **AND** StatusCard 傳 `filtered={true}` 顯示「（當前篩選）」標記
- **WHEN** 使用者清空搜尋與篩選
- **THEN** 數值回到全域（`allRows`）彙總且標記消失

### Requirement: 諮詢單列表頁對齊基準範本

`ConsultationRequestList.tsx`（諮詢單列表頁）SHALL 依「列表頁標準佈局」Requirement 實作，與 `QuoteListPage` 對齊。納入本 change 範圍以避免規範一上線即破窗（同款違規）。

- 搜尋 Card 內 SHALL 包含搜尋框 + 1 個諮詢狀態 select（具體 option 依諮詢單既有狀態 enum）+ `StatusCard` 統計 grid（依業務必要性 1-4 卡）
- 視覺對齊：`rounded-lg` / `font-medium` / 搜尋框內嵌 `Search` icon
- 業務邏輯（諮詢單流程、surveycake webhook 等）不在本變更範圍

#### Scenario: ConsultationRequestList 列表頁搜尋區符合標準佈局

- **WHEN** 使用者進入諮詢單列表頁
- **THEN** 看到單一搜尋 Card，內含搜尋框（左 Search icon）+ 1 欄狀態 select + StatusCard grid
- **AND** 不出現原本的 ErpStatusTabs 狀態切換
- **AND** Card 圓角為 `rounded-lg`、標題為 `font-medium`

### Requirement: QuoteListPage canonical reference 自身對齊新規範

`QuoteListPage.tsx`（需求單列表，列表頁的 canonical reference）SHALL 同步本次 change 新增的「KPI 動態化 + 篩選中標記」規範，避免 canonical reference 自身不符合 SHOULD 而造成規範自相矛盾。

- `statusCounts` 計算來源 SHALL 從 `quotes`（全域 scoped）改為 `filtered`（依當前篩選結果）
- 篩選非預設（statusFilter / companyFilter / salesFilter / dateFrom / dateTo / search 任一非預設值）時，StatusCard SHALL 傳 `filtered={true}` 顯示「（當前篩選）」標記
- 容器結構、搜尋框 icon、篩選器布局、Card 圓角等視覺已對齊新規範，無需額外調整

#### Scenario: QuoteListPage statusCounts 依篩選動態重算

- **WHEN** 使用者在需求單列表頁變更任一篩選器（狀態 / 帳務公司 / 接單業務 / 日期範圍 / 搜尋關鍵字）
- **THEN** 4 個 StatusCard（待確認需求 / 待評估成本 / 待報價 / 議價中）的計數值 SHALL 反映當前篩選結果的彙總
- **AND** 不顯示全域未篩選的 `quotes` 彙總

#### Scenario: QuoteListPage 篩選非空時 StatusCard 顯示「當前篩選」標記

- **WHEN** 使用者在需求單列表頁設定任一篩選器至非預設值
- **THEN** 4 個 StatusCard 傳 `filtered={true}`
- **AND** Card 上顯示「（當前篩選）」標記
- **WHEN** 使用者清空所有篩選器
- **THEN** StatusCard 回到全域 KPI 視覺（無標記）
