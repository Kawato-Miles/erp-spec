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

### Requirement: PrintItemTypeLabel 共用元件

Prototype SHALL 提供 `PrintItemTypeLabel` 共用元件用於統一呈現 `PrintItem.type` 三值（打樣印件 / 大貨印件 / 補印印件），於所有印件列表頁 / 印件詳情頁 / 訂單詳情頁印件區 / ticket 詳情頁的補印清單區一致使用，避免散落於各模組各自實作徽章造成設計系統脫節。

**元件規範**：

- **輸入**：`type: '打樣印件' | '大貨印件' | '補印印件'`、`relatedAfterSalesTicketId?: string`、`relatedAfterSalesTicketNo?: string`
- **三值呈現**：
  - `打樣印件`：藍色系標籤，文字「打樣」
  - `大貨印件`：灰色 / 中性色系標籤，文字「大貨」
  - `補印印件`：橙色 / 強調色系標籤，文字「補印」
- **互動行為**：
  - `打樣` / `大貨`：純展示，無 hover / click
  - `補印`：hover 顯示 tooltip「補印（{relatedAfterSalesTicketNo}）」；click 跳轉 ticket 詳情頁
- **無障礙**：元件 MUST 設置 `aria-label` 描述印件類型，補印額外標示「來自售後服務單 {relatedAfterSalesTicketNo}」

**禁用方式（避免設計系統脫節）**：

- MUST NOT 為「補印」設計專屬徽章元件（如 `SupplementaryPrintBadge`），所有印件類型走統一元件
- MUST NOT 在補印旁加額外 emoji / 圖示作為「特殊識別」（與 [global UI 規範禁止 emoji](../../../memory/shared/ui-business-rules.md) 一致）

#### Scenario: 列表頁顯示三種類型

- **GIVEN** 業務平台印件總覽列表有 3 筆印件：打樣 / 大貨 / 補印各一
- **WHEN** 列表渲染
- **THEN** 每筆印件 SHALL 在「印件類型」欄位顯示 `PrintItemTypeLabel`
- **AND** 三筆標籤顏色 SHALL 不同（藍 / 灰 / 橙）
- **AND** 三筆標籤文字 SHALL 分別為「打樣」「大貨」「補印」

#### Scenario: 補印標籤 hover 顯示來源 ticket

- **GIVEN** 列表中有一筆補印印件 `relatedAfterSalesTicketNo = AS-202605-0042`
- **WHEN** 業務 hover 該筆「補印」標籤
- **THEN** 系統 SHALL 顯示 tooltip「補印（AS-202605-0042）」

#### Scenario: 補印標籤 click 跳轉 ticket

- **GIVEN** 列表中有一筆補印印件 `relatedAfterSalesTicketId = ticket-uuid-001`
- **WHEN** 業務 click 該筆「補印」標籤
- **THEN** 系統 SHALL 導航至 `/after-sales-tickets/ticket-uuid-001` 對應的 ticket 詳情頁

#### Scenario: 打樣 / 大貨標籤不可互動

- **GIVEN** 列表中有一筆大貨印件
- **WHEN** 業務 hover 或 click「大貨」標籤
- **THEN** 系統 SHALL NOT 顯示任何 tooltip 或導航

---

### Requirement: 列表頁印件類型欄位通用設計

所有印件列表頁 / 含印件清單的列表頁 SHALL 統一新增「印件類型」欄位，欄位內以 `PrintItemTypeLabel` 元件顯示三值。同時 SHALL 在篩選器（filter）中提供「印件類型」三選項（打樣 / 大貨 / 補印），業務可單選或多選。

**適用列表頁清單**（印件級列表頁與印件出現位置；訂單級列表頁不適用）：

| 列表頁 | spec 引用 | 備註 |
|--------|---------|------|
| 訂單詳情頁印件區（表格內）| [order-management spec](../order-management/spec.md) | 同一訂單下印件總表，不需 filter |
| 業務平台印件總覽 | [sales-platform spec](../sales-platform/spec.md) | 沿用中台版「印務主管印件總覽（防掉單）」內容 + filter 預設值差異 |
| 印務主管印件總覽（防掉單） | [work-order spec](../work-order/spec.md) | 中台版印件總覽，業務平台 / 印務平台沿用 |
| 工單列表 | [work-order spec](../work-order/spec.md) | 每個工單對應一個印件，反查 PrintItem.type |
| 派工看板工序卡片內任務明細 | [task-dispatch-board spec](../task-dispatch-board/spec.md) | 任務對應印件，反查 type |
| ticket 詳情頁補印印件清單區 | [after-sales-ticket spec](../after-sales-ticket/spec.md) | 清單區直接顯示補印 PrintItem |

**訂單列表（OrderList）不適用**：訂單下可能有多筆印件（含不同 type），訂單級列表頁無單一「印件類型」可顯示。若需在訂單列表標示「訂單含補印」， 另開 follow-up change 設計「訂單級補印標示」（聚合欄位設計）。

**欄位呈現規範**：

- 欄位寬度：足以完整顯示「補印（AS-202605-0042）」標籤，最小寬度 96px
- 欄位位置：建議緊鄰「印件名稱」或「印件編號」欄位之後（讓使用者第一眼看到「這是什麼類型的印件」）
- 排序：印件類型欄位 SHALL 支援排序（依字母順序 / 內部排序權重「補印 > 打樣 > 大貨」皆可，由各列表頁自行決定）
- filter UI：採用 chip-style multi-select 篩選器，預設三選項全選

**訂單詳情頁印件區特殊規則**：

- 該區為同訂單下印件的總表，補印與大貨混合排列，**不獨立分組**
- 補印靠「印件類型」欄位識別，**不額外加分隔線 / 區塊標題**
- 不需要 filter（同訂單印件數量有限，加 filter 反而干擾），但欄位 MUST 顯示

#### Scenario: 業務於業務平台印件總覽用印件類型 filter 篩選

- **GIVEN** 業務平台印件總覽列表有 100 筆印件（80 大貨、15 打樣、5 補印）
- **WHEN** 業務於 filter 取消勾選「大貨」「打樣」只保留「補印」
- **THEN** 列表 SHALL 僅顯示 5 筆補印印件
- **AND** filter 狀態 SHALL 顯示「印件類型：補印（1/3 已選）」

#### Scenario: 派工看板工序卡片顯示印件類型欄位

- **GIVEN** 派工看板某工序卡片內有 10 筆任務，對應 7 筆大貨印件、3 筆補印印件
- **WHEN** 印務主管展開該工序卡片的任務明細表
- **THEN** 任務明細表 SHALL 在「印件類型」欄位顯示三筆「補印」標籤
- **AND** 印務主管 SHALL 可 hover「補印」標籤看到來源 ticket 編號

#### Scenario: 訂單詳情頁印件區補印與大貨混合排列

- **GIVEN** 訂單 SO-001 有 4 筆印件（2 大貨 + 2 補印，補印來自 AS-001）
- **WHEN** 業務於訂單詳情頁印件區檢視
- **THEN** 4 筆印件 SHALL 在同一張表格內呈現（按建立時間或印件編號排序）
- **AND** 「印件類型」欄位 SHALL 三值並列（2 個「大貨」+ 2 個「補印」）
- **AND** 系統 SHALL NOT 加任何分組標題 / 分隔線區隔補印與大貨

### Requirement: NoteTemplatePopover 共用元件

`NoteTemplatePopover` SHALL 為可重用 molecule，提供「點按鈕 → 跳出 Popover → 多選 seed 模板 → 組合文字 → 通知父元件 append 至 textarea」的工作流。元件位於 `sens-erp-prototype/src/components/shared/NoteTemplatePopover.tsx`，可掛在任意 textarea 欄位旁使用。

元件 SHALL 提供以下 API：

```ts
interface NoteTemplate {
  id: string;
  label: string;
  text: string;
}

interface NoteTemplatePopoverProps {
  templates: NoteTemplate[];
  currentValue: string;
  onInsert: (combinedText: string) => void;
  buttonLabel?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
}
```

- `templates`：該欄位適用的全部模板清單
- `currentValue`：textarea 現值（用於父元件 append 行為，元件本身不直接修改）
- `onInsert`：使用者點「插入」時的 callback，元件傳回**勾選模板 text 用 `\n` 串接的字串**；父元件負責 `newValue = currentValue ? currentValue + '\n' + combinedText : combinedText`
- `buttonLabel`：觸發按鈕文字，預設「插入常用備註」
- `align`：Popover 對齊方向，預設 `'end'`（貼欄位右側展開）
- `disabled`：與 textarea 同步 disabled，預設 `false`

元件結構 SHALL 包含：
- **觸發按鈕**：`Button variant="ghost" size="sm"` + FileText icon + `buttonLabel`
- **PopoverContent**：寬 420px、max-height 480px overflow-y-auto
  - **Header**：說明文字「勾選後按『插入』追加至備註尾端」+ 「全部清除」連結（僅在有勾選時顯示）
  - **Checkbox List**：每列含 Checkbox + label 文字 + hover 時顯示前 60 字預覽（`line-clamp-2`）
  - **Footer**：「取消」按鈕 + 「插入 N 條」主按鈕（N=0 時 disabled）

#### Scenario: 點觸發按鈕開啟 Popover

- **GIVEN** NoteTemplatePopover 掛在某 textarea label 列右側
- **AND** disabled = false
- **WHEN** 使用者點「插入常用備註」按鈕
- **THEN** Popover SHALL 從按鈕下方彈出（align='end' 預設貼右側）
- **AND** Popover SHALL 顯示 templates prop 傳入的所有模板項目（Checkbox + label）
- **AND** 所有 Checkbox SHALL 預設未勾選

#### Scenario: 勾選多個模板後插入

- **GIVEN** Popover 已開啟、顯示 10 條模板
- **WHEN** 使用者勾選 3 條模板
- **THEN** Footer 主按鈕 SHALL 顯示「插入 3 條」、enabled 狀態
- **WHEN** 使用者點「插入 3 條」按鈕
- **THEN** 元件 SHALL 呼叫 `onInsert(text1 + '\n' + text2 + '\n' + text3)`
- **AND** Popover SHALL 關閉
- **AND** Toast 通知 SHALL 顯示「已插入 3 條模板」（2-3 秒）

#### Scenario: 父元件負責 append 行為

- **GIVEN** currentValue = "業務已先確認交期"（非空字串）
- **WHEN** 元件呼叫 onInsert("★ 預估工作天 15-18 天")
- **THEN** 父元件 SHALL 將 textarea 值更新為 `"業務已先確認交期\n★ 預估工作天 15-18 天"`
- **AND** 元件本身 MUST NOT 直接修改 textarea state

#### Scenario: currentValue 為空時不前置換行

- **GIVEN** currentValue = ""
- **WHEN** 元件呼叫 onInsert("★ 全額付款 3-5 工作天")
- **THEN** 父元件 SHALL 將 textarea 值更新為 `"★ 全額付款 3-5 工作天"`（無前置 `\n`）

#### Scenario: 0 條勾選時插入按鈕 disabled

- **GIVEN** Popover 開啟、無任何勾選
- **THEN** Footer 主按鈕 SHALL 顯示「插入 0 條」、disabled 狀態
- **AND** 使用者點擊 MUST NOT 觸發 onInsert

#### Scenario: Popover 關閉後不保留勾選狀態

- **GIVEN** Popover 開啟、使用者勾選 2 條後點「取消」或按 ESC
- **THEN** Popover SHALL 關閉
- **AND** 下次開啟時所有 Checkbox SHALL 重新預設為未勾選

#### Scenario: disabled prop 為 true 時按鈕禁用

- **GIVEN** disabled = true
- **THEN** 觸發按鈕 SHALL 顯示為 disabled 狀態
- **AND** 使用者點擊 MUST NOT 開啟 Popover

#### Scenario: 鍵盤可達性

- **GIVEN** 使用者用 Tab 鍵聚焦到觸發按鈕
- **WHEN** 使用者按 Enter
- **THEN** Popover SHALL 開啟、焦點移至第一個 Checkbox
- **WHEN** 使用者按上下方向鍵或 Tab 鍵
- **THEN** 焦點 SHALL 在 Checkbox 列表中移動
- **WHEN** 使用者按 Space
- **THEN** 當前焦點 Checkbox SHALL 切換勾選狀態
- **WHEN** 使用者按 ESC
- **THEN** Popover SHALL 關閉、焦點返回觸發按鈕

#### Scenario: Hover 顯示模板預覽

- **GIVEN** Popover 開啟、列表顯示模板項目
- **WHEN** 使用者 hover 某 Checkbox 列的 label
- **THEN** label 下方 SHALL 顯示該模板 text 的前 60 字預覽（`line-clamp-2`、`text-muted-foreground`）

### Requirement: Form Field Label 右側 Trailing Action Button 規範

ERP Prototype 的 form field（textarea / input）label 列右側 SHALL 可放置「操作按鈕」（如「插入常用備註」「智能填寫」等），補充既有 Info icon + Tooltip 規範。所有 trailing action button SHALL 遵守以下視覺與行為合約：

- **樣式**：使用 `Button variant="ghost" size="sm"`，保持輕量、不搶 textarea 視覺焦點
- **位置**：放在 label 列最右側；若同時有字數計數，按鈕在計數左邊（次序：label → 按鈕 → 計數）
- **對齊**：與 label 文字 baseline 對齊；多個輔助按鈕排列使用 `gap-2` 間距
- **disabled 同步**：按鈕 disabled 條件 MUST 與對應 textarea / input 的 disabled 條件同步
- **icon 規範**：可帶 lucide-react icon（`h-3.5 w-3.5 mr-1`），icon 應與按鈕語意對應（如「插入模板」用 FileText、「智能填寫」用 Sparkles）
- **與 Info icon 共存**：若 label 同時需要 Info icon（hint）與 trailing action button，Info icon 緊鄰 label 文字右側、trailing button 放在最右側

#### Scenario: textarea label 列同時含 Info icon 與 trailing action button

- **GIVEN** textarea 的 label 為「付款備註」、含 hint「訂單階段補充的付款條件」、字數上限 500
- **WHEN** 元件渲染
- **THEN** label 列 SHALL 依序排列：「付款備註」 + Info icon（hint Tooltip）+ flex spacer + 「插入常用備註」按鈕 + 「N / 500」字數計數

#### Scenario: textarea disabled 時 trailing action button 同步 disabled

- **GIVEN** textarea disabled = true
- **THEN** trailing action button SHALL 顯示為 disabled 狀態
- **AND** 使用者點擊 MUST NOT 觸發任何動作

#### Scenario: 多個輔助按鈕的排列

- **GIVEN** textarea label 列同時含「插入常用備註」與「智能填寫」兩個 trailing action button
- **THEN** 兩按鈕 SHALL 使用 `gap-2` 間距排列、左對齊於 flex spacer 右側

---

### Requirement: SidePanel 共用元件組（Figma 8977:269607 對齊）

跨模組詳情預覽型 SidePanel SHALL 透過 `@/components/side-panel/*` 共用元件組裝、視覺對齊 Figma node-id `8977:269607`。SidePanel 內 SHALL NOT 使用詳情頁專用卡片（ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard），SHALL NOT 自寫 padding / hr / section 標題樣式。**編輯型 SidePanel**（form 為主）豁免本規範、繼續用 ErpEditFormCard 系列 form layout。

**元件清單**（位於 `src/components/side-panel/`）：

| 元件 | 用途 |
|------|------|
| `SidePanelBody` | SidePanel body 容器，自動處理 padding（px-6 py-5）與 section 間距（16+1+16 + `#e3e4e5` hr） |
| `SidePanelSection` | 單一 section（h3 title 16px font-semibold + 12px gap + children），可選 hint Tooltip / action 按鈕 |
| `SidePanelInfoTable` | `ErpInfoTable` 的 re-export（label 120w / cell px-4 py-2 / rounded-lg / border #e3e4e5）|
| `SidePanelFileList` | 檔案 chip list（attach_file icon + 檔名 link），固定垂直疊放（`flex-col gap-1`）、單一職責；縮圖場景請用 `SidePanelThumbnailList` |
| `SidePanelThumbnailList` | 縮圖 list，固定 48x48 / gap 4px / horizontal |

**使用情境**：

| 場景 | 容器 | 內容組裝 |
|------|------|---------|
| 詳情預覽型 SidePanel（列表頁「檢視」觸發、唯讀資訊呈現） | `ErpSidePanel size="2xl"` + `SidePanelBody` | `SidePanelSection` + `SidePanelInfoTable` / `SidePanelFileList` / `<table className="erp-table">` |
| 編輯型 SidePanel（新增 / 編輯 form、有 Save/Cancel） | `ErpSidePanel size=lg|xl` + form 內容 | `ErpEditFormCard.Field` / `ErpFormField`（**豁免** SidePanel 共用元件）|

**驗收清單**（≥ 13 項）：
1. SidePanel 寬度：`size="2xl"` 對應 `sm:max-w-[800px]`
2. Header 高 64px、底部 1px `border-border` border-b
3. Body padding：水平 24px / 垂直 20px（`px-6 py-5`）
4. Section title：`<h3>` `text-base font-semibold`（16px / line-height 24px）
5. Section title 與內容間距：12px（`mb-3`）
6. Section 之間：16px + 1px hr `#e3e4e5` + 16px（最後一個 section 無底部 hr）
7. SidePanelInfoTable label 欄寬：120px（除非 item 層覆寫）
8. SidePanelInfoTable cell padding：水平 16px / 垂直 8px（`px-4 py-2`）
9. SidePanelInfoTable border：`#e3e4e5` outer / `#f2f2f2` inner / `rounded-lg`
10. SidePanelFileList：垂直疊放（`flex-col gap-1`、4px 間距） / attach_file icon 20x20 + 14px 藍色檔名 link
11. SidePanelThumbnailList：48x48px / gap 4px (`flex-row gap-1`) / horizontal / `border #e3e4e5` / `rounded`
12. 欄位備註：透過 `SidePanelInfoItem.hint` 顯示 Info icon + Tooltip，禁止 inline 寫在 value
13. 顏色 token：背景 `bg-white` / 邊框 `border-[#e3e4e5]` / 內框 `border-[#f2f2f2]` / 連結 `text-primary`

**禁用事項**（≥ 6 項 anti-pattern）：
- 禁止：SidePanel 內使用 `ErpDetailCard` / `PrintItemSpecCard` / `PrintItemArtworkCard`（詳情頁專用、外框會造成雙重 card 視覺）
- 禁止：自寫 `<div className="p-5 space-y-6">` 取代 `SidePanelBody`
- 禁止：自寫 `<section><h3 className="text-base font-semibold mb-2">...</h3></section>` 取代 `SidePanelSection`
- 禁止：section 間自寫 `<hr>` 或 `<div className="border-t my-4">`（`SidePanelBody` 自動處理）
- 禁止：重寫表格樣式——列表型內容用 `<table className="erp-table">`、key-value 用 `SidePanelInfoTable`
- 禁止：檔案區 inline 寫 `<a><FileText/><span/></a>` chip——應用 `SidePanelFileList` / `SidePanelThumbnailList`

**範疇說明**：本變更（add-side-panel-shared-components 2026-05-25 歸檔）服務 1 個既有詳情預覽型消費點（PrintItemDetailSidePanel）；既有 7 個 SidePanel 消費點全為編輯型、明示豁免新規範。未來新增**詳情預覽型** SidePanel SHALL 直接套用新規範；**混合型** SidePanel 規範時機列為 [ORD-018](../../../memory/erp/ERP_Vault/08-open-questions/ORD-018-混合型SidePanel規範時機.md) OQ，本變更不規範。元件 API 處於 prototype 階段，若第 2-3 個真實 consumer 出現時不符實際需求，將重構 API（不視為 breaking change）。

#### Scenario: SidePanelBody 4 section 自動加 hr 分隔線

- **GIVEN** 開發者在 SidePanel 內放 4 個 `SidePanelSection`
- **WHEN** SidePanel 渲染
- **THEN** 第 1 / 2 / 3 section 後 SHALL 出現 1px `#e3e4e5` 水平分隔線
- **AND** 第 4 section（最後）SHALL NOT 有底部分隔線
- **AND** section 與 hr 之間 SHALL 各有 16px 垂直間距

#### Scenario: SidePanelSection title 與內容間距

- **WHEN** 渲染 `<SidePanelSection title="印件資訊"><SidePanelInfoTable items={...} /></SidePanelSection>`
- **THEN** title `<h3>` SHALL 為 `text-base font-semibold`（16px / line-height 24px）
- **AND** title 與下方內容間距 SHALL 為 12px（`mb-3`）

#### Scenario: SidePanelFileList 固定垂直疊放

- **GIVEN** 給定 2 個檔案
- **WHEN** 渲染 `<SidePanelFileList files={...} />`
- **THEN** wrapper SHALL 含 `flex-col` class（垂直疊放）
- **AND** 檔案間距 SHALL 為 4px (`gap-1`)
- **AND** 每個 chip SHALL 含 attach_file icon (20x20) + 檔名 link（14px、藍色）

#### Scenario: SidePanelThumbnailList 縮圖規格

- **WHEN** 渲染 `<SidePanelThumbnailList thumbs={3 個縮圖} />`
- **THEN** 每個縮圖 SHALL 為 48x48px (`w-12 h-12`)
- **AND** 縮圖間距 SHALL 為 4px (`gap-1`)
- **AND** 縮圖容器 SHALL 含 `border-[#e3e4e5]` border + `rounded` 圓角

#### Scenario: SidePanelInfoTable 對外契約

- **WHEN** 從 `@/components/side-panel` import `SidePanelInfoTable`
- **THEN** 該 export SHALL 提供與 `ErpInfoTable` **相同的 props API**（cols / items / labelWidth）
- **AND** SHALL 維持**相同的視覺合約**：label 120w / cell padding `px-4 py-2` / `#e3e4e5` outer border / `#f2f2f2` inner border / `rounded-lg`
- **AND** MAY 透過 re-export 或 thin wrapper 實作（implementer 決定，spec 不限定）

#### Scenario: 編輯型 SidePanel 豁免共用元件

- **GIVEN** 編輯型 SidePanel（如 EditQuotePanel / CreateQuotePanel）內部為 form 結構（有 Save / Cancel 按鈕）
- **WHEN** 該 SidePanel 開發
- **THEN** SHALL 豁免 SidePanelBody / SidePanelSection 共用元件規範
- **AND** SHALL 繼續使用 ErpEditFormCard / ErpFormField 既有 form layout

---

### Requirement: ErpSidePanel size variant 擴充

`ErpSidePanel` 元件 size variant SHALL 新增 `'2xl'` = `sm:max-w-[800px]`，對應 Figma 詳情預覽型 SidePanel 寬度規格；既有 `'sm' | 'md' | 'lg' | 'xl' | 'full'` 完全不動、向後相容。

#### Scenario: size='2xl' 渲染寬度為 800px

- **GIVEN** `<ErpSidePanel size="2xl">` 在桌機 viewport（≥ 800px 寬度）
- **WHEN** SidePanel 開啟
- **THEN** dialog wrapper SHALL 含 `sm:max-w-[800px]` class
- **AND** 實際 dialog 寬度 SHALL 為 800px

#### Scenario: 既有 size variant 不受影響

- **GIVEN** 既有 SidePanel 消費點使用 `size="lg"` / `size="xl"` 等
- **WHEN** 升級至本變更後
- **THEN** 既有 size variant 對應寬度 SHALL 保持不變（sm=480 / md=560 / lg=600 / xl=720 / full=90vw）
- **AND** 既有 7 個 SidePanel 消費點 SHALL NOT 受影響

### Requirement: 共用單位 LOV

Prototype SHALL 提供一份跨模組共用的「單位」LOV（List Of Values，下拉選項枚舉），供所有需要記錄「品項單位」的場景引用（包含但不限於需求單品項、訂單印件、預計發票品項、發票品項）。LOV 內容 SHALL 符合 ezPay 電子發票 API `ItemUnit` 限制（中文 ≤ 2 字 / 英數 ≤ 6 字），以支援未來真實串接時的合規性。

**LOV 內容（11 項，順序為事實正本）**：

```
張、本、冊、份、個、卷、盒、套、批、式、組
```

各選項說明：

| 單位 | 說明 |
|------|------|
| 張 | 散頁類（名片、DM、海報、傳單）|
| 本 | 裝訂類（書本、手冊）|
| 冊 | 多本合輯（套冊、年鑑）|
| 份 | 套件類（簡章、提案書）|
| 個 | 立體 / 非紙類（紙箱、紙袋、貼紙）|
| 卷 | 連續類（捲筒貼紙、貼紙卷）|
| 盒 | 包裝整盒（名片整盒 = 100 張）|
| 套 | 多件組合銷售（套裝禮盒）|
| 批 | 業務內部批號計算（如 1 批 = 1 印張）|
| 式 | 雜支 / 無法以件計價（製版費、運費、設計費）|
| 組 | 多件組合且不分拆銷售（組合包裝、配套）|

實作建議（Prototype）：以 TypeScript `as const` 陣列或 enum 匯出 `UnitOption` 型別，置於 `src/types/shared.ts` 或 `src/types/unitOption.ts`；同時提供 `UnitSelect` 共用元件（基於 shadcn/ui `Select`）供各 Dialog 引用。

#### Scenario: 共用 LOV 在發票開立 Dialog 出現完整 11 項

- **GIVEN** 業務於訂單詳情頁點擊「開立發票」
- **WHEN** 業務點擊品項列的「單位」欄位
- **THEN** dropdown SHALL 顯示 11 個選項，順序為「張、本、冊、份、個、卷、盒、套、批、式、組」
- **AND** 業務 SHALL NOT 自由輸入文字（防止填入超出 ezPay Varchar(2) 限制的值）

#### Scenario: 共用 LOV 在需求單品項出現完整 11 項

- **GIVEN** 業務於需求單編輯頁新增 / 編輯印件
- **WHEN** 業務點擊「單位」欄位
- **THEN** dropdown SHALL 顯示同一份 11 項 LOV
- **AND** 既有需求單資料若 `unit` 為 LOV 內值 SHALL 正常回填顯示

#### Scenario: 共用 LOV 字符長度全部符合 ezPay 限制

- **GIVEN** 共用單位 LOV 已定義
- **WHEN** 系統檢核每個選項的中文字數
- **THEN** 11 個選項全部 SHALL 為 1 中文字（≤ ezPay `ItemUnit` Varchar(2) 中文 2 字上限）
- **AND** 未來擴充 LOV 選項時 SHALL 強制檢核新增項 ≤ 2 中文字 / ≤ 6 英數字

#### Scenario: 共用 LOV 變更時所有引用處同步

- **GIVEN** 未來 LOV 新增一項（如「打」）
- **WHEN** 開發者於 `src/types/shared.ts` 加入該項
- **THEN** 需求單品項 / 訂單印件 / 預計發票 / 發票品項所有 `UnitSelect` 引用處 SHALL 自動可見新選項
- **AND** 既有資料的 `unit` 欄位 SHALL NOT 受影響

