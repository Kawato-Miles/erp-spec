## ADDED Requirements

### Requirement: 業務主管全公司售後管理頁

系統 SHALL 提供「業務主管全公司售後管理頁」（路由 `/sales-manager/after-sales`），業務主管登入後 SHALL 可從中台 sidebar 進入。該頁列出**全公司**所有 AfterSalesTicket（**不過濾**負責業務主管管轄範圍 `Order.approved_by_sales_manager_id = self`），作為業務主管在 Slack 與業務跟催售後事件處理的決策入口，並與業務平台「我的售後服務作業頁」呈對稱結構。

本 Requirement 與業務平台「我的售後服務作業頁」Requirement 對稱，但服務不同目的：
- 業務 / 諮詢的「我的售後服務」：個人作業視角（行動驅動），範圍 `opened_by = self`
- 業務主管的「售後服務」：全公司監督視角（跟催驅動），範圍**無 owner filter**

頁面 layout SHALL 嚴格對齊 [Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：「搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁」模式，禁止按狀態拆多張表或用卡片分組呈現資料。範式參考：[QuoteListPage](../../../../sens-erp-prototype/src/components/quote/QuoteListPage.tsx)（canonical reference）+ [MyAfterSales](../../../../sens-erp-prototype/src/pages/MyAfterSales.tsx)（對稱結構參考）。

**頁面結構 SHALL 包含三個區段**：

1. **搜尋與篩選 Card**（單一 Card 內含三組元素）：
   - 搜尋框：訂單編號 / 案名 / 客戶名稱 / 售後單號（部分匹配、不分大小寫）
   - 篩選 grid（兩行 4 欄）：第一行 next action select / status select / case_category select / responsibility select；第二行 業務 / 諮詢負責人 select / 受理區間 date range / 預留 / 預留
   - StatusCard grid（3 張數字卡）：逾期 / 待填決議 / 待結案，數字依篩選後結果顯示（`filtered={true}` 標記）

2. **操作列**：`flex justify-end`，含「重設篩選」按鈕（依篩選 active 狀態 disabled）

3. **單一資料表**：`<ErpTableCard scrollX>` 包 `<table className="erp-table">`，依下列 12 欄順序：

   | # | 欄位 | 寬度 | 資料來源 | 說明 |
   |---|------|------|----------|------|
   | 1 | # | 56px | 行號 | 依分頁顯示 |
   | 2 | 售後單號 | 140px | `caseNo` | AS-YYYYMMDD-XX，font-mono |
   | 3 | 訂單編號 | 130px | `Order.orderNo` | ORD-...，font-mono |
   | 4 | 客戶 / 案名 | auto | `Order.clientName` / `Order.caseName` | 兩行顯示，案名 line-clamp-1 |
   | 5 | 業務 / 諮詢負責人 | 110px | `openedBy`（含 hover tooltip 顯示角色）| 新欄（與業務版差異點）|
   | 6 | 受理時間 | 110px | `openedAt` | 相對時間（如「5 天前」）|
   | 7 | 最後活動時間 | 110px | `updatedAt` | 相對時間，新欄（與業務版差異點）|
   | 8 | 售後類型 | 100px | `caseCategory` | 文字 |
   | 9 | 責任歸屬 | 90px | `responsibility` | 文字 |
   | 10 | 決議 | 90px | `resolution` | 文字（NULL 顯示「—」）|
   | 11 | next action | 110px | `calcAfterSalesActionGroup(...)` | Badge（逾期紅 / 待填決議黃 / 待建關聯動作藍 / 待結案淺藍）|
   | 12 | 狀態 | 100px | `status` | StatusBadge（受理中黃 / 處理中藍 / 逾期紅疊加）|

4. **整行可點擊**：點擊 ticket 任一 cell（含表格內部）SHALL 導航至 `/orders/:orderId?tab=afterSales&ticket=:ticketId`。本頁 MUST NOT 提供獨立「操作」欄按鈕（與「我的售後服務」差異點，理由為 12 欄擁擠 + 整行點擊已涵蓋唯一動作）。

5. **分頁**：`<ErpPagination>`，PAGE_SIZE = 10（與 MyAfterSales / ConsultationRequestList 一致）。

**範圍過濾規則**（系統自動套用，使用者不可解除）：
- 預設 status filter ∈ {受理中, 處理中}（排除已結案）
- 使用者 SHALL 可透過 status select 篩選為「全部」或「已結案」查歷史
- **無 owner filter**：列出全公司所有 ticket，使用者可透過「業務 / 諮詢負責人」filter 自行收斂

next action 分組定義沿用 [after-sales-ticket spec § Requirement: 我的售後服務作業頁](../../../specs/after-sales-ticket/spec.md) 的四組（逾期 / 待填決議 / 待建關聯動作 / 待結案），互斥；逾期優先於其他三組。

**預設排序**：`opened_at` 升序（最久未處理優先），與「我的售後服務」一致。

**動作可見性**：
- 業務主管 SHALL 為純檢視角色，本頁 MUST NOT 顯示「建立 ticket」「修改 resolution」「結案」「建立關聯 OA / PrintItem」「批次轉派」「批次結案」等動作按鈕
- 主管若需介入特定 ticket SHALL 透過 Slack 與業務 / 諮詢線下協調
- 跳轉至訂單詳情頁售後 Tab 後，仍 SHALL 為唯讀視角（訂單詳情頁的售後 Tab 自身權限控制負責隱藏編輯按鈕）

**sidebar 入口**：
- 中台 sidebar「訂單管理_業務主管」group 第 4 個 sub item（前三個為訂單列表 / 訂單審核 / 訂單異動審核）
- **無數字徽章**：業務主管無 `opened_by = self` 概念，徽章難定義有意義的計算範圍；業界 ERP supervisor view 通常用「進入後摘要卡」取代 sidebar 徽章

**「最後活動時間」欄資料來源**：
- 本 change 沿用既有 `AfterSalesTicket.updatedAt`（涵蓋所有 transitions + appendComplaintLog + slack_thread_url 變更等業務事件）
- 未來若主管反映語意混淆（如下游 OA / Payment 建立未反映在 updatedAt），可升級為 `last_activity_at` derived field 聚合 ticket / 關聯 OA / PrintItem 補印 / Payment 等下游事件的最新 timestamp
- 相關 OQ：[AFT-9](../../../../memory/erp/ERP_Vault/08-open-questions/) 持續觀察

**舊路由 redirect 處理**：
- 既有 `/sales-manager/after-sales-tickets` 路由（add-my-after-sales-action-page-and-remove-owner-transfer change 2026-05-19 歸檔 REMOVED）SHALL 由系統 redirect 至本 change 新路由 `/sales-manager/after-sales` + Toast 提示「已升級為全公司售後管理頁」
- 此處理避免主管書籤 / 殘留 Slack 連結引用舊路由失效

#### Scenario: 業務主管進入「售後服務」頁

- **GIVEN** 業務主管 A 登入中台、全公司有未結案 ticket 12 張（含逾期 2 張、待填決議 4 張、待結案 6 張）、其中 7 張為非 A 管轄部門
- **WHEN** A 從 sidebar「訂單管理」group 點擊「售後服務」
- **THEN** 系統 SHALL 導航至 `/sales-manager/after-sales`
- **AND** 頁面 SHALL 顯示 12 張未結案 ticket（**不過濾**負責業務主管，含 A 管轄與非 A 管轄）
- **AND** 摘要卡 SHALL 顯示：逾期 2 / 待填決議 4 / 待結案 6
- **AND** 表格 SHALL 依 `opened_at` 升序排序，預設第 1 頁顯示 10 張
- **AND** 第 5 欄「業務 / 諮詢負責人」SHALL 顯示各 ticket 的 `opened_by` 人名（hover 顯示角色業務 / 諮詢）

#### Scenario: 業務主管查看非管轄業務的售後 ticket

- **GIVEN** 業務主管 A 進入全公司售後管理頁、列表中含一張 ticket AS-20260520-03 屬於業務主管 B 管轄部門（`Order.approved_by_sales_manager_id = B`）
- **WHEN** A 點擊該 ticket 任一 cell
- **THEN** 系統 SHALL 允許跳轉至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260520-03`（唯讀）
- **AND** 訂單詳情頁售後 Tab MUST NOT 顯示「建立 ticket」「修改 resolution」「結案」「建立關聯 OA」等動作按鈕
- **AND** A MUST NOT 對該 ticket 執行任何系統內編輯動作
- **AND** A 若需介入處理 SHALL 透過 Slack 與業務主管 B 或 ticket `opened_by` 業務 / 諮詢線下協調

#### Scenario: 業務主管點擊「逾期」摘要卡套用 next action filter

- **GIVEN** 業務主管進入「售後服務」頁，無 filter 套用，table 顯示 12 張未結案 ticket
- **WHEN** 主管點擊頂端「逾期 2」摘要卡
- **THEN** table SHALL 套用 `nextAction = '逾期'` filter
- **AND** table SHALL 僅顯示 2 張逾期 ticket
- **AND** 「逾期」摘要卡 SHALL 視覺強調（border 或背景加深）標示為 active
- **AND** 其他 StatusCard 數字 SHALL 依篩選後結果重新計算（待填決議 0 / 待結案 0）

#### Scenario: 再點同一摘要卡取消 filter（toggle）

- **GIVEN** 「逾期」摘要卡為 active，table 已套用 `nextAction = '逾期'` filter
- **WHEN** 主管再點「逾期」摘要卡
- **THEN** filter SHALL 取消
- **AND** table SHALL 恢復顯示全部 12 張 ticket
- **AND** 「逾期」摘要卡 SHALL 取消 active 視覺強調
- **AND** StatusCard 數字恢復為未篩選狀態（逾期 2 / 待填決議 4 / 待結案 6）

#### Scenario: 業務主管用「業務 / 諮詢負責人」filter 收斂為單一負責人

- **GIVEN** 業務主管進入「售後服務」頁、全公司未結案 ticket 含業務 Alice 5 張、諮詢 Bob 3 張、業務 Charlie 4 張
- **WHEN** 主管於「業務 / 諮詢負責人」filter 選擇「Alice」
- **THEN** table SHALL 僅顯示 `opened_by = Alice` 的 5 張 ticket
- **AND** 摘要卡 SHALL 依 Alice 的 ticket 範圍重新計算數字

#### Scenario: 業務主管篩選 status = 已結案 查歷史

- **GIVEN** 業務主管進入「售後服務」頁、預設 status filter ∈ {受理中, 處理中}
- **WHEN** 主管於 status filter 切換為「已結案」
- **THEN** table SHALL 顯示全公司 status = 已結案 的 ticket（不限時間範圍）
- **AND** 摘要卡 SHALL 依已結案 ticket 重新計算（「逾期」「待填決議」「待結案」對已結案 ticket 多為 0）
- **AND** 主管 SHALL 可進一步用「受理區間」date range 收斂為特定月份 / 季度

#### Scenario: 業務主管整行點擊跳轉訂單詳情頁

- **GIVEN** table 中有一行 ticket AS-20260512-01，所屬訂單 ORD-2026-005
- **WHEN** 業務主管點擊該行任一 cell（除「業務 / 諮詢負責人」hover tooltip 外）
- **THEN** 系統 SHALL 導航至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260512-01`
- **AND** 訂單詳情頁 SHALL 自動切到「售後服務」Tab 並展開該 ticket
- **AND** 業務主管於詳情頁仍 SHALL 為唯讀視角

#### Scenario: 「最後活動時間」欄顯示相對時間

- **GIVEN** ticket AS-20260520-01 受理時間 = 5 天前、3 天前業務修改了 resolution、`updatedAt` 為 3 天前
- **WHEN** 業務主管查看 table 第 7 欄「最後活動時間」
- **THEN** 該欄 SHALL 顯示「3 天前」
- **AND** 同行第 6 欄「受理時間」SHALL 顯示「5 天前」
- **AND** 兩欄差異 SHALL 讓主管識別此 ticket 仍有近期活動（非停滯）

#### Scenario: 業務 / 諮詢 / 會計 / 其他中台角色 visit `/sales-manager/after-sales` 被拒絕

- **WHEN** 業務 / 諮詢 / 會計 / Supervisor 訂單管理人 / 印務主管 / 審稿主管 / EC商品管理 等非業務主管角色透過 URL 直接訪問 `/sales-manager/after-sales`
- **THEN** 系統 MUST 拒絕並重定向至該角色首頁
- **AND** 中台 sidebar MUST NOT 對這些角色顯示「售後服務」入口
- **AND** 業務 / 諮詢仍 SHALL 從業務平台「我的售後服務」入口檢視自己的 ticket
- **AND** 會計仍 SHALL 從訂單詳情頁售後 Tab 唯讀查閱單張 ticket

#### Scenario: 舊路由 `/sales-manager/after-sales-tickets` redirect 至新路由

- **GIVEN** 業務主管書籤或 Slack 內舊連結指向 `/sales-manager/after-sales-tickets`
- **WHEN** 主管點擊舊連結
- **THEN** 系統 SHALL 自動 redirect 至 `/sales-manager/after-sales`
- **AND** SHALL 顯示 Toast「已升級為全公司售後管理頁」（時長 5 秒）
- **AND** 主管 SHALL 直接看到新頁完整內容（無需重新點擊）

#### Scenario: 列表為空狀態

- **GIVEN** 全公司無未結案 ticket（資料庫初始化 / 全部結案 / 篩選過嚴）
- **WHEN** 業務主管進入「售後服務」頁
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」row
- **AND** 摘要卡 SHALL 顯示 0
- **AND** 若 filter active SHALL 提示「重設篩選」；若 filter 未 active 且全公司確實無 ticket SHALL 顯示說明「全公司目前無未結案售後 ticket，可切換 status filter 查歷史已結案紀錄」

#### Scenario: 分頁顯示與切換

- **GIVEN** 全公司未結案 ticket 25 張
- **WHEN** 業務主管進入「售後服務」頁
- **THEN** table SHALL 顯示第 1 頁 10 張
- **AND** `<ErpPagination>` SHALL 顯示「1 / 3 頁」
- **WHEN** 主管點擊下一頁
- **THEN** table SHALL 切換至第 2 頁 10 張

#### Scenario: 業務主管 sidebar 不顯示數字徽章

- **GIVEN** 業務主管 A 登入中台、全公司有 12 張未結案 ticket
- **WHEN** A 查看中台 sidebar「訂單管理_業務主管」group
- **THEN** 「售後服務」sub item MUST NOT 顯示數字徽章
- **AND** 主管 SHALL 點擊進入頁面後從 StatusCard 摘要卡掌握全公司未結案數
- **AND** 此設計與業務 / 諮詢「我的售後服務」sidebar 顯示數字徽章的對稱差異 SHALL 明示於本 Requirement
