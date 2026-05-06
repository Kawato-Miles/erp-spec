## ADDED Requirements

### Requirement: 訂單詳情頁 Tabs 化版型

訂單詳情頁 SHALL 採用 Tabs 化版型（依 DESIGN.md §6.3.1），結構：`ErpPageHeader → Tabs container（首位「資訊」Tab，defaultValue）`。

`ErpPageHeader` SHALL 包含：
- 返回按鈕
- 訂單編號（標題）
- 訂單狀態 Badge（沿用既有 `OrderStatusBadge`）
- 主動作群（依訂單狀態條件顯示：B2C 前台 Demo / 確認回簽 / 變更路徑導引 Tooltip / 取消訂單）

訂單詳情頁 SHALL 包含 6 個 Tab，順序：`資訊（首位，defaultValue）→ 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄`。

「資訊」Tab 為本 change 新增 Tab，SHALL 承載原 Tabs 之上資訊區的 5 張資訊卡：訂單資訊 / 金額及付款狀態 / 發票設定（條件顯示）/ 物流設定（條件顯示）/ 客戶資訊。5 張卡 SHALL 在「資訊」Tab 內依此順序單欄垂直排列（移除既有 `grid grid-cols-[1fr_380px]` 兩欄佈局），各自保留 rounded card 邊框（`rounded-xl border border-[#e3e4e5] bg-white`）。

「發票設定」卡 SHALL 在 `order.invoiceEnabled === true` 時顯示，否則隱藏。「物流設定」卡 SHALL 在 `order.shippingMethod` 不為空時顯示，否則隱藏。

#### Scenario: 業務進入訂單詳情頁預設停留資訊 Tab

- **WHEN** 業務從訂單列表點擊訂單編號進入訂單詳情頁
- **THEN** 頁面載入完成時 SHALL 預設停留於「資訊」Tab（首位）
- **AND** 「資訊」Tab 內 SHALL 依序顯示訂單資訊 → 金額及付款狀態 → 發票設定（條件）→ 物流設定（條件）→ 客戶資訊 5 張卡
- **AND** 5 張卡 SHALL 為單欄垂直排列（不採兩欄 grid 佈局）

#### Scenario: 訂單詳情頁 Tab 順序符合業務流先後

- **WHEN** 使用者瀏覽訂單詳情頁的 Tab 列
- **THEN** Tab 順序 SHALL 為：資訊 → 印件清單 → 付款記錄 → 補收款 → 出貨單 → 活動紀錄
- **AND** 「活動紀錄」SHALL 為末位（依 DESIGN.md §0.1 業務流先後 + 活動紀錄末位原則）

#### Scenario: 訂單詳情頁資訊區重組

- **WHEN** 業務進入訂單詳情頁
- **THEN** Tabs 之上 SHALL NOT 出現「訂單資訊」「金額及付款狀態」「發票設定」「物流設定」「客戶資訊」5 張卡
- **AND** 5 張卡 SHALL 在「資訊」Tab 內呈現

#### Scenario: 訂單發票 / 物流卡條件顯示

- **WHEN** 訂單 `order.invoiceEnabled === false`
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「發票設定」卡

- **WHEN** 訂單 `order.shippingMethod` 為空
- **THEN** 「資訊」Tab 內 SHALL NOT 顯示「物流設定」卡

#### Scenario: 訂單 ErpPageHeader 主動作維持

- **WHEN** 業務查看訂單詳情頁
- **THEN** `ErpPageHeader` 右側 SHALL 顯示「B2C 前台 Demo」按鈕（恆顯示）
- **AND** 訂單狀態為「報價待回簽」時 SHALL 顯示「確認回簽」按鈕
- **AND** 訂單狀態非「已取消」、非「訂單完成」時 SHALL 顯示「變更路徑導引」Tooltip + 「取消訂單」按鈕
- **AND** 主動作 SHALL NOT 移至 Tab 內或下放至其他位置
