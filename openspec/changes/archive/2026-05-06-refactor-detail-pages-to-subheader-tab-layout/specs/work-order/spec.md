## ADDED Requirements

### Requirement: 工單詳情頁 Tabs 化版型

工單詳情頁 SHALL 採用 Tabs 化版型，結構：`ErpPageHeader → （條件性退回原因 InfoBanner）→ Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 工單編號（標題）
- 工單類型 Badge（沿用既有 `WorkOrderTypeBadge`）
- 工單狀態 Badge（沿用既有 `WorkOrderStatusBadge`）
- 「已退回，需重新送審」inline 提示（條件顯示：`status === '重新確認製程'`）
- 主動作群（依工單狀態條件顯示既有「送審 / 重新送審 / 審核通過 / 退回 / 收回工單 / 發起異動 / 填打樣結果 / 取消工單」等動作；異動中時以 inline 訊息「異動中 — 等待生管確認並安排」取代主動作）

工單詳情頁 SHALL 移除既有 Tabs 之上的 4 張資訊卡：
- 前 3 張（工單資訊 / 生產資訊 / 印件檔案）SHALL 移入新增「資訊」Tab，依 DESIGN.md §0.1 工單頁順序「工單資訊 → 生產資訊 → 印件檔案」單欄垂直排列，保留 `ErpDetailCard` 邊框
- 第 4 張「退回原因提示」SHALL 改為 `ErpPageHeader` 下方獨立 InfoBanner（條件顯示），非「資訊」Tab 內的常駐卡

「退回原因 InfoBanner」SHALL 在工單狀態為「重新確認製程」且有退回原因時顯示，採紅底警告型視覺（`rounded-xl border border-red-200 bg-red-50`，對齊 [memory/shared/ui-business-rules.md](memory/shared/ui-business-rules.md) Info Banner 規範）。

#### Scenario: 印務進入工單詳情頁看到 ErpPageHeader

- **WHEN** 印務點擊工單編號連結進入工單詳情頁
- **THEN** 系統 SHALL 顯示 `ErpPageHeader`（sticky）
- **AND** Header SHALL 包含工單編號、`WorkOrderTypeBadge`、`WorkOrderStatusBadge`、依狀態條件顯示的主動作群

#### Scenario: 工單退回時顯示退回原因 InfoBanner

- **WHEN** 工單狀態為「重新確認製程」且 `rejectReason` 不為空
- **THEN** 系統 SHALL 在 `ErpPageHeader` 下方獨立 InfoBanner 呈現退回原因
- **AND** InfoBanner SHALL 採紅底警告型視覺
- **AND** InfoBanner SHALL NOT 出現在「資訊」Tab 內或其他 Tab 中

#### Scenario: 工單狀態非重新確認製程時 InfoBanner 隱藏

- **WHEN** 工單狀態非「重新確認製程」
- **THEN** `ErpPageHeader` 下方 SHALL NOT 顯示退回原因 InfoBanner
- **AND** Tabs 容器 SHALL 緊貼 `ErpPageHeader` 之下

#### Scenario: 工單詳情頁資訊區重組到資訊 Tab

- **WHEN** 印務進入工單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「工單資訊」「生產資訊」「印件檔案」三張卡
- **AND** 三張卡 SHALL 在「資訊」Tab 內依「工單資訊 → 生產資訊 → 印件檔案」順序單欄垂直排列
- **AND** 三張卡 SHALL 保留 `ErpDetailCard` 邊框（三分類獨立）

## MODIFIED Requirements

### Requirement: 詳情頁 Tab 使用共用元件

工單詳情頁的 Tab 切換（切換內容區：資訊 / 生產任務 / QC 記錄 / 異動紀錄 / 活動紀錄）SHALL 使用 `ErpDetailTabs` 共用元件，與需求單詳情頁 Tab 同一元件來源。

工單詳情頁 SHALL 包含 5 個 Tab，順序：`資訊（首位，defaultValue）→ 生產任務 → QC 記錄 → 異動紀錄 → 活動紀錄`。「資訊」Tab 為本 change 新增 Tab，承載原 Tabs 之上資訊區的工單資訊卡 / 生產資訊卡 / 印件檔案卡（依 DESIGN.md §0.1「印件三分類獨立 ErpDetailCard」規範單欄垂直排列）。

共用元件外觀規範由 DESIGN.md §1.4 Organism 清單與 §1.4.4 決策樹定義；本 requirement 確保工單詳情頁不再手寫 Tabs + TabsList + TabsTrigger 的 class 組合。

#### Scenario: 工單詳情頁 Tab 使用 ErpDetailTabs

- **WHEN** 使用者進入工單詳情頁
- **THEN** 頁面 Tab 區域 SHALL 由 `ErpDetailTabs` 元件渲染，DOM 結構包含外層卡片容器、底線式 TabsList、共用 body padding（與需求單詳情頁 Tab 一致）
- **AND** 頁面程式碼中 SHALL NOT 手寫 `<Tabs>` + `<TabsList>` + `<TabsTrigger>` 的 class 組合（由 `ErpDetailTabs` 元件統一提供）

#### Scenario: 工單詳情頁預設停留資訊 Tab

- **WHEN** 印務首次進入工單詳情頁
- **THEN** 系統 SHALL 將「資訊」Tab 設為 defaultValue，頁面載入時直接顯示資訊 Tab 內容
- **AND** 「資訊」Tab 內 SHALL 依序排列工單資訊卡 → 生產資訊卡 → 印件檔案卡，三卡保留 `ErpDetailCard` 邊框

#### Scenario: 工單詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽工單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 生產任務 → QC 記錄 → 異動紀錄 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）
