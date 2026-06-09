## ADDED Requirements

### Requirement: 印件詳情頁中台版資訊架構

中台印件詳情頁（路徑 `/print-items/:id`，供中台管理層角色使用：Supervisor、訂單管理人、審稿主管、印務主管、業務主管、EC 商品管理；對齊 wiki [03-roles/](../../../../memory/Sens_wiki/wiki/erp/03-roles/) 中台角色清單）SHALL 採用「Sub-header 跨 Tab 永久區 + Tabs 內容區」雙層結構，確保使用者跨 Tab 切換時仍可見核心錨點與戰情數字。本 Requirement 對齊 [sens-erp-prototype/DESIGN.md §0.1 跨 Tab 上下文錨點原則](../../../../sens-erp-prototype/DESIGN.md)。

**Sub-header 持久區結構**：
位於 `ErpPageHeader` 與 Tabs 之間，sticky 行為（捲動時保持可見），承載兩段資訊：

1. **生產進度 strip**（C 類戰情關鍵數字）：累計預計總數、累計完成數、累計入庫數、工單完成度（已完成 / 總數）四項數字並列；MUST NOT 出現於任何 Tab 內
2. **訂單錨點 context strip**（B 類上下文關聯）：訂單編號（連結至訂單詳情頁）、客戶名稱、交貨日期三項資訊；MUST NOT 出現於任何 Tab 內

**Tabs 內容**：完整 7 Tab（資訊 / 審稿紀錄 / 工單 / QC 紀錄 / 轉交單 / 出貨單 / 活動紀錄）。資訊 Tab 內三張卡（印件資訊 / 印件檔案 / 生產資訊）保留 [§ 印件詳情頁工單與生產任務區塊](spec.md) 與 DESIGN.md §0.1「印件三分類區塊」結構，但「生產資訊」卡 SHALL NOT 重複 Sub-header 已顯示的累計數字，改為明細導向內容（per-WO 工單清單彙整、排程資訊、預期完工日等更細的資訊）。

**可報工計數位置**：「可報工 N 筆」標示 MUST 僅於「工單」Tab active 時顯示，MUST NOT 跨 Tab 永久浮在 TabsList 右側。

#### Scenario: 中台使用者跨 Tab 切換仍可見生產進度與訂單錨點

- **WHEN** 中台管理層角色（Supervisor / 訂單管理人 / 審稿主管 / 印務主管 / 業務主管 / EC 商品管理）在中台印件詳情頁從「資訊」Tab 切換到「工單」Tab
- **THEN** Sub-header 的生產進度 strip（累計預計 / 完成 / 入庫 / 工單完成度 4 項數字）SHALL 持續可見
- **AND** Sub-header 的訂單錨點 context strip（訂單編號 / 客戶 / 交期）SHALL 持續可見
- **AND** 使用者 MUST NOT 需要切回「資訊」Tab 才能對照訂單編號或累計進度

#### Scenario: 資訊 Tab 內生產資訊卡不重複 Sub-header 數字

- **WHEN** 使用者開啟中台印件詳情頁的「資訊」Tab
- **THEN** 「生產資訊」卡 SHALL NOT 顯示累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成度（這些已在 Sub-header 永久區）
- **AND** 「生產資訊」卡 SHALL 顯示明細導向內容（per-WO 工單清單彙整、排程資訊、預期完工日等更細的資訊）

#### Scenario: 可報工計數僅工單 Tab active 時顯示

- **WHEN** 印務在中台印件詳情頁的「審稿紀錄」或其他非「工單」Tab
- **THEN** 系統 MUST NOT 顯示「可報工 N 筆」計數
- **AND** 切回「工單」Tab 時 SHALL 重新顯示計數

#### Scenario: 訂單編號連結至訂單詳情頁

- **WHEN** 使用者在 Sub-header 訂單錨點 strip 點擊訂單編號
- **THEN** 系統 SHALL 導航至對應訂單詳情頁（`/orders/:id`）
- **AND** 印件詳情頁的瀏覽歷史 SHALL 可透過瀏覽器返回回到原印件詳情頁
