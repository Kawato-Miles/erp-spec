## ADDED Requirements

### Requirement: 印件詳情頁 Tabs 化版型

印件詳情頁 SHALL 採用 Tabs 化版型，結構：`ErpPageHeader → （條件性 InfoBanner）→ Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 印件名稱（標題）
- 印件狀態 Badge（badges slot 內，使用 `PrintItemStatusBadge` + `derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))`，對齊 [openspec/specs/state-machines/spec.md](openspec/specs/state-machines/spec.md) 印件狀態機）
- 主動作群（依使用情境條件顯示：批次報工 / 清除選取 / 分配印件）

印件詳情頁 SHALL 包含 7 個 Tab，順序：`資訊（首位，defaultValue）→ 審稿紀錄 → 工單與生產任務 → QC 紀錄 → 轉交單 → 出貨單 → 活動紀錄`。

「資訊」Tab 為本 change 新增 Tab，SHALL 承載原 Tabs 之上資訊區的三張資訊卡：印件資訊卡 / 印件檔案卡 / 生產資訊卡。三張卡 SHALL 依 DESIGN.md §0.1「印件三分類獨立 ErpDetailCard」規範，依「印件資訊 → 印件檔案 → 生產資訊」順序單欄垂直排列，保留 `ErpDetailCard` 邊框。

附註：本 requirement 暫掛 `prototype-shared-ui` capability，[design.md](openspec/changes/refactor-detail-pages-to-subheader-tab-layout/design.md) OQ-2 標明印件詳情頁 spec capability 歸屬待後續決定（候選：維持本 capability / 新建 `print-item` / 併入 `prepress-review`）。

#### Scenario: 印件詳情頁進入後預設停留資訊 Tab

- **WHEN** 業務或印務進入印件詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 依序顯示印件資訊卡 → 印件檔案卡 → 生產資訊卡，三卡保留 `ErpDetailCard` 邊框

#### Scenario: 印件詳情頁狀態 Badge 顯示

- **WHEN** 使用者進入印件詳情頁
- **THEN** `ErpPageHeader` badges slot SHALL 顯示 `PrintItemStatusBadge`
- **AND** Badge 顯示文字與顏色 SHALL 對齊 [openspec/specs/state-machines/spec.md](openspec/specs/state-machines/spec.md) 印件狀態機定義
- **AND** Badge 狀態值 SHALL 由 `derivePrintItemStatusFromWOs(relatedWOs.map(w => w.status))` 推導

#### Scenario: 印件詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽印件詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 審稿紀錄 → 工單與生產任務 → QC 紀錄 → 轉交單 → 出貨單 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）

#### Scenario: 印件詳情頁資訊區重組

- **WHEN** 業務或印務進入印件詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「印件資訊」「印件檔案」「生產資訊」三張卡
- **AND** 三張卡 SHALL 在「資訊」Tab 內依規範順序單欄垂直排列
