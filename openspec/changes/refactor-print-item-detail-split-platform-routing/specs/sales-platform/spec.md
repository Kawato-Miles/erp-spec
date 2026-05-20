## ADDED Requirements

### Requirement: 業務平台印件詳情頁

業務平台 SHALL 提供印件詳情頁，路徑 `/sales/print-items/:id`，給業務（sales）、諮詢（consultant）角色使用。本頁為中台印件詳情頁（`/print-items/:id`）的業務平台精簡版，沿用 `sales-platform` capability 既有差異描述模式（過濾規則 / 動作可見性 / 預設 Tab）。

**內容基準**：業務平台印件詳情頁的印件資訊呈現、審稿紀錄 Tab、活動紀錄 Tab 內容 SHALL 完全沿用中台版（見 [order-management spec § 印件詳情頁工單與生產任務區塊](../order-management/spec.md)、[order-management spec § 印件詳情頁中台版資訊架構](../order-management/spec.md) 與 [prepress-review spec](../prepress-review/spec.md)）。

**業務平台版差異**：

1. **過濾規則**（系統自動套用，業務 / 諮詢不可解除）：本頁 SHALL 僅顯示 `Order.sales_id = current_user.id` 或 `Order.consultant_id = current_user.id` 所對應訂單下的印件；其他訂單的印件 MUST NOT 可訪問
2. **動作可見性**（業務 / 諮詢純檢視）：
   - SHALL NOT 顯示「分配印件」按鈕（屬印務主管動作）
   - SHALL NOT 顯示「報工」相關操作（屬印務動作）
   - SHALL NOT 顯示「QC 建立 / 工單異動 / 生產任務建立 / 編輯」相關入口
3. **Tabs 範圍**：SHALL 僅顯示 3 個 Tab（資訊 / 審稿紀錄 / 活動紀錄）；MUST NOT 顯示中台版的工單 / QC 紀錄 / 轉交單 / 出貨單 4 個 Tab
4. **Sub-header 簡化版**：訂單錨點 context strip（訂單編號 / 客戶 / 交期）SHALL 沿用中台版規範（見 [order-management spec § 印件詳情頁中台版資訊架構](../order-management/spec.md)）；生產進度 strip MUST NOT 顯示（業務 / 諮詢不涉及戰情層資訊）

**routing 拆解與條件分支移除**：本 capability 引入後，`PrintItemDetail.tsx` 內基於 `currentUser.role === 'sales' || 'consultant'` 的 `isSalesView` 條件分支邏輯 SHALL 移除。實作策略：兩個獨立 page 元件，或共用元件 + 兩個 route entry 由 props 控制 Tab 列表與 Sub-header 顯示與否（具體實作策略於 design.md 決定）。

**業務 / 諮詢身分的 redirect 規則**：業務 / 諮詢使用者點擊或直接訪問 `/print-items/:id`（中台版路徑）時，系統 SHALL 自動 redirect 至 `/sales/print-items/:id`（業務平台版），避免暴露中台 7 Tab 介面。

#### Scenario: 業務於業務平台檢視自己負責印件詳情

- **GIVEN** 業務 Alice 為訂單 ORD-001 的 `Order.sales_id`，印件 P-001 屬於 ORD-001
- **WHEN** Alice 從業務平台印件總覽（`/sales/print-items`）點擊印件 P-001
- **THEN** 系統 SHALL 導航至 `/sales/print-items/P-001`
- **AND** 頁面 SHALL 顯示 3 個 Tab（資訊 / 審稿紀錄 / 活動紀錄）
- **AND** Sub-header SHALL 顯示訂單錨點 strip（ORD-001 / 客戶名 / 交期）
- **AND** Sub-header MUST NOT 顯示生產進度 strip

#### Scenario: 諮詢於業務平台檢視自己負責印件詳情

- **GIVEN** 諮詢 Bob 為訂單 ORD-002 的 `Order.consultant_id`，印件 P-002 屬於 ORD-002
- **WHEN** Bob 從業務平台印件總覽點擊印件 P-002
- **THEN** 系統 SHALL 導航至 `/sales/print-items/P-002`
- **AND** 頁面 SHALL 與業務角色一致呈現 3 Tab + 訂單錨點 strip

#### Scenario: 業務嘗試訪問非自己負責印件被擋

- **WHEN** 業務 Alice 嘗試直接輸入 URL `/sales/print-items/P-099`，但訂單 ORD-099 對應的 `Order.sales_id ≠ Alice.id` 且 `Order.consultant_id ≠ Alice.id`
- **THEN** 系統 SHALL 拒絕存取，顯示「找不到此印件或無權查看」訊息
- **AND** MUST NOT 顯示印件內容

#### Scenario: 業務嘗試操作印務主管動作被擋

- **WHEN** 業務 Alice 於業務平台印件詳情頁任一 Tab
- **THEN** 系統 MUST NOT 顯示「分配印件」按鈕
- **AND** MUST NOT 顯示「報工」相關操作（包括單筆報工、批次報工、勾選框）
- **AND** MUST NOT 顯示「QC 建立 / 工單異動 / 生產任務建立 / 編輯」相關入口

#### Scenario: 業務直接訪問中台 URL 被 redirect

- **WHEN** 業務 Alice 點擊既有書籤或 Slack 連結指向 `/print-items/P-001`（中台版路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'sales'` 後自動 redirect 至 `/sales/print-items/P-001`
- **AND** Alice MUST NOT 看到中台版 7 Tab 介面
- **AND** 瀏覽器 URL bar SHALL 顯示 `/sales/print-items/P-001`（reflect redirected path）

#### Scenario: 諮詢直接訪問中台 URL 被 redirect

- **WHEN** 諮詢 Bob 嘗試訪問 `/print-items/P-002`（中台版路徑）
- **THEN** 系統 SHALL 偵測 `currentUser.role === 'consultant'` 後自動 redirect 至 `/sales/print-items/P-002`
- **AND** Bob MUST NOT 看到中台版 7 Tab 介面
