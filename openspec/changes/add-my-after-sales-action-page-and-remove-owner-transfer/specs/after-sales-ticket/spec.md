## ADDED Requirements

### Requirement: 我的售後服務作業頁

系統 SHALL 提供「我的售後服務」作業頁（路由 `/my-after-sales`），業務 / 諮詢登入後 SHALL 可從業務平台 sidebar 進入。該頁列出當前使用者開立且 `status ≠ 已結案` 的 AfterSalesTicket，加強「漏單沒處理」的信號，提供 next action 提示協助業務 / 諮詢快速判斷下一步操作。

頁面 layout 沿用既有頁面共用元件（`AppLayout` + 標題 + breadcrumb），內容區與需求單列表頁相同的「卡片區塊 + 統計卡 + 列表」結構慣例（不採用 Tab 結構，因「我的售後服務」為跨 entity 列表頁性質）。

頁面結構 SHALL 包含三個區段：

1. **頂端待辦摘要區**：三張數字卡（逾期 / 待填決議 / 待結案），點擊任一卡 SHALL 跳轉至對應分組
2. **篩選器**：case_category（含「全部」選項）/ responsibility（含「全部」選項）/ 受理區間 / 訂單編號搜尋
3. **依 next action 分組的 ticket 列表**

sidebar 入口 SHALL 持續顯示當前使用者未結案 ticket 數字徽章（任何頁面都可見），徽章為 0 時 SHALL NOT 顯示徽章但保留入口。此徽章作為跨頁面的 quick glance 提醒，替代既有的 `MyAfterSalesBucket` 首頁 widget。

next action 分組 SHALL 採用下列定義（互斥；逾期優先於其他三組）：

| 分組 | 條件 |
|------|------|
| 逾期 | `opened_at` 距今 `> DEFAULT_RED_LIGHT_DAYS (7 天)` 且 `status ≠ 已結案` |
| 待填決議 | `status = 受理中` 且 `resolution = NULL` 且非逾期 |
| 待建關聯動作 | `status = 處理中` 且 `resolution ∈ {退款, 補印, 退款+補印}` 且該 resolution 對應下游動作（OrderAdjustment / 補印 PrintItem）尚未建立 且非逾期 |
| 待結案 | `status = 處理中` 且（對應下游動作已執行 或 `resolution = 不處理`）且非逾期 |

各分組內 ticket SHALL 按 `opened_at` 升序（最久未處理優先）。

#### Scenario: 業務進入「我的售後服務」頁

- **GIVEN** 業務 Alice 名下有未結案 ticket 5 張（逾期 1 張 / 待填決議 2 張 / 待結案 2 張）
- **WHEN** Alice 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 導航至 `/my-after-sales`
- **AND** 頁面 SHALL 顯示頂端待辦摘要：逾期 1 / 待填決議 2 / 待結案 2
- **AND** ticket 列表 SHALL 依逾期 / 待填決議 / 待結案三分組呈現，組內按 `opened_at` 升序

#### Scenario: 諮詢進入「我的售後服務」頁

- **GIVEN** 諮詢 Bob 名下有未結案 ticket 3 張
- **WHEN** Bob 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 顯示與業務角色相同的頁面結構
- **AND** 列表僅 SHALL 含 `opened_by = Bob AND status ≠ 已結案` 的 ticket

#### Scenario: 點擊待辦摘要卡跳分組

- **WHEN** 使用者點擊頂端「逾期 N 張」摘要卡
- **THEN** 頁面 SHALL 自動捲動至「逾期」分組位置
- **AND** 該分組 SHALL 視覺強調（高亮 / 焦點 frame）

#### Scenario: 點 ticket 卡片跳訂單詳情頁售後 Tab

- **GIVEN** 列表中有一張 ticket `AS-20260512-01`，所屬訂單 `ORD-2026-005`
- **WHEN** 使用者點擊該 ticket 卡片
- **THEN** 系統 SHALL 導航至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260512-01`
- **AND** 訂單詳情頁 SHALL 自動切到「售後服務」Tab 並展開該 ticket

#### Scenario: 卡片明示 next action 提示

- **GIVEN** 列表中 ticket `status = 受理中、resolution = NULL`
- **WHEN** 該 ticket 顯示於「待填決議」分組
- **THEN** 卡片 SHALL 顯示「Next action: 送出決議」CTA
- **AND** 點擊該 CTA SHALL 跳訂單詳情頁售後 Tab 並聚焦該 ticket 的決議區塊

#### Scenario: 篩選器組合運作

- **GIVEN** 使用者名下 ticket 含「印件瑕疵」「規格不符」「物流問題」三類
- **WHEN** 使用者於 case_category 篩選器選擇「印件瑕疵」
- **THEN** 列表 SHALL 僅顯示 `case_category = 印件瑕疵` 的 ticket
- **AND** 頂端待辦摘要數字 SHALL 依篩選後結果重新計算

#### Scenario: 訂單編號搜尋

- **WHEN** 使用者於訂單編號搜尋欄輸入 `ORD-2026-005`
- **THEN** 列表 SHALL 僅顯示 `order_id` 部分匹配的 ticket
- **AND** 搜尋 SHALL 不分大小寫

#### Scenario: 列表為空狀態

- **GIVEN** 業務 Alice 無未結案 ticket
- **WHEN** Alice 進入「我的售後服務」
- **THEN** 頁面 SHALL 顯示空狀態文案「目前無待處理售後服務單」
- **AND** 頂端待辦摘要數字 SHALL 全部顯示 0
- **AND** SHALL 顯示說明文：「售後 ticket 需先在訂單已完成後從訂單詳情頁的『售後服務』Tab 建立」

#### Scenario: sidebar 入口顯示未結案數字徽章

- **GIVEN** 業務 Alice 名下有未結案 ticket 5 張（含 1 張逾期）
- **WHEN** Alice 登入後查看 sidebar
- **THEN** 「我的售後服務」入口 SHALL 顯示數字徽章「5」
- **AND** 徽章 SHALL 於任何頁面都可見（不限於首頁）
- **AND** Alice 結案 1 張後徽章 SHALL 即時更新為「4」

#### Scenario: sidebar 入口徽章為 0 時不顯示

- **GIVEN** 諮詢 Bob 名下無任何未結案 ticket
- **WHEN** Bob 登入後查看 sidebar
- **THEN** 「我的售後服務」入口 SHALL 保留顯示（不隱藏入口）
- **AND** 數字徽章 SHALL NOT 顯示

### Requirement: 業務 / 諮詢角色售後 ticket 權限範圍

本 spec 中所有 Requirement / Scenario 提及「業務」執行的售後 ticket 動作（建立 ticket、送出決議、修改 `case_category` / `responsibility` / `resolution`、append `additional_complaint_log`、貼 Slack URL、結案等）SHALL 等價適用於「諮詢」角色。

依 [user-roles spec § Requirement: 諮詢角色額外職責](../user-roles/spec.md) 既有原則，諮詢角色 SHALL 具備與業務角色相同的模組權限。本 Requirement 在 after-sales-ticket spec 內顯式化此原則，避免讀者誤以為諮詢角色不在範圍。

#### Scenario: 諮詢於已完成訂單建立 AfterSalesTicket

- **GIVEN** Order.status = 已完成、訂單尚無關聯 AfterSalesTicket、當前使用者為諮詢角色
- **WHEN** 諮詢點擊訂單詳情頁的「建立售後服務單」
- **THEN** 系統 SHALL 開啟 AfterSalesTicket 建單表單（與業務操作流程相同）
- **AND** `opened_by` 寫入當前諮詢使用者
- **AND** 新 ticket 出現於該諮詢的「我的未結案售後」widget 與「我的售後服務」作業頁

#### Scenario: 諮詢可送出決議與結案他人開立的 ticket

- **GIVEN** AfterSalesTicket 由業務 Alice 開立、status = 受理中、resolution = NULL
- **WHEN** 諮詢 Bob 於業務 Alice 休假期間打開該 ticket 並填入 resolution = 退款 點「送出決議」
- **THEN** 系統 SHALL 允許（諮詢具備與業務相同的權限）
- **AND** ActivityLog 記錄事件描述 = 「決議送出」、操作人 = Bob

#### Scenario: 諮詢可 append additional_complaint_log

- **GIVEN** AfterSalesTicket.status = 處理中、`opened_by` = 業務 Alice
- **WHEN** 諮詢 Bob 於客戶來電後 append 補述
- **THEN** 系統 SHALL 允許
- **AND** ActivityLog 記錄補述者為 Bob

## MODIFIED Requirements

### Requirement: AfterSalesTicket 實體與欄位

系統 SHALL 提供 AfterSalesTicket 實體，作為訂單已完成後客訴 / 不良 / 規格不符 / 物流問題 / 工法限制 / 交期延誤等售後事件的承載容器。一張 AfterSalesTicket 屬於單一 Order，記錄業務 / 諮詢與業務主管討論後的決議結果、責任歸屬、售後類型分類，並關聯下游動作（OrderAdjustment / PrintItem / SalesAllowance）。

**核心欄位：**

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `id` | PK | Y | 主鍵 |
| `order_id` | FK -> Order | Y | 所屬訂單；強制 `Order.status = 已完成` |
| `case_no` | string | Y | 售後服務單編號（系統產生，格式：AS-YYYYMMDD-XX）|
| `opened_at` | timestamp | Y | 建立時間 |
| `opened_by` | FK -> 使用者 | Y | 建立者（業務 / 諮詢）|
| `customer_complaint` | text | Y | 客訴內容 / 售後事件描述 |
| `case_category` | enum | Y | 售後類型分類（印件瑕疵 / 色差爭議 / 規格不符 / 物流問題 / 工法限制 / 交期延誤 / 其他）|
| `responsibility` | enum | Y | 責任歸屬（公司認賠 / 客戶承擔 / 共同分擔）|
| `resolution` | enum | N | 決議處理方式（不處理 / 退款 / 補印 / 退款+補印），決議前為 NULL |
| `slack_thread_url` | URL | N | 業務 / 諮詢與主管討論的 Slack thread URL，手動貼入 |
| `additional_complaint_log` | array<{logged_at, note}> | N | 客戶後續補述紀錄（escape hatch），預設空陣列 |
| `customer_feedback_note` | text | N | 結案後客戶回饋備註（不主動詢問）|
| `status` | enum | Y | 受理中 / 處理中 / 已結案（狀態機，見「AfterSalesTicket 狀態機」Requirement）|
| `closure_status` | enum | Y | 未結案 / 已結案（derived from status）|
| `closed_at` | timestamp | N | 結案時間，結案後寫入 |
| `closed_by` | FK -> 使用者 | N | 結案者 |
| `legacy_migrated` | boolean | N | 標記是否為從歷史 OrderAdjustment(phase=after_completion) 遷移而來 |

**關聯欄位（反向關聯）：**

| 關聯 | 說明 |
|------|------|
| `linked_adjustments` | 0..N 個 OrderAdjustment（透過 OrderAdjustment.linked_after_sales_ticket_id）|
| `linked_print_items` | 0..N 個 PrintItem（補印用，透過 PrintItem.related_after_sales_ticket_id）|

**異動說明（本 change）**：

- 移除 `owner_transfer_log` 欄位（隨「業務離職 / 請假時 ticket 負責人轉派」Requirement 一同 REMOVED）
- `opened_by` 說明文字從「建立者（業務）」擴為「建立者（業務 / 諮詢）」，與 [諮詢角色卡](../../../../memory/erp/ERP_Vault/03-roles/諮詢.md) 一致

#### Scenario: 業務 / 諮詢於已完成訂單建立 AfterSalesTicket

- **GIVEN** Order.status = 已完成、completion_date = 2026-03-15、訂單尚無關聯 AfterSalesTicket
- **WHEN** 業務或諮詢於 2026-05-06 點擊訂單詳情頁的「建立售後服務單」
- **THEN** 系統 SHALL 開啟 AfterSalesTicket 建單表單
- **AND** 必填 `customer_complaint`、`case_category`、`responsibility`
- **AND** 可選填 `slack_thread_url`
- **AND** 系統 SHALL 寫入 `case_no`（AS-20260506-XX）、`opened_at`、`opened_by` = 當前使用者
- **AND** 新 AfterSalesTicket.status SHALL = 受理中
- **AND** resolution SHALL = NULL（決議前）

#### Scenario: AfterSalesTicket 建單時 Order 必須已完成

- **GIVEN** Order.status ≠ 已完成（例：生產中、出貨中）
- **WHEN** 業務 / 諮詢嘗試點擊「建立售後服務單」
- **THEN** 系統 MUST 拒絕並提示「訂單尚未完成，請使用『建立訂單異動單』處理生產期間的異動」
- **AND** 系統 MUST NOT 建立 AfterSalesTicket

## REMOVED Requirements

### Requirement: 業務看板「我的未結案售後」分桶

**Reason**: Prototype `Index.tsx`（首頁，標題「需求單管理」、麵包屑「首頁 → 需求單管理」、內容為 `QuoteListPage`）並非業務 / 諮詢的工作看板而是「需求單管理」頁。售後 ticket 屬於訂單已完成後的事件，業務情境上不該嵌入於需求單列表頁。經 Miles 確認此處屬資訊架構錯位。本 change 的新模組（「我的售後服務」作業頁 `/my-after-sales`）+ sidebar 入口數字徽章已替代「漏單提醒」功能，整個分桶 Requirement 移除。

**Migration**:
- spec：本 Requirement 整段移除
- Prototype：`src/components/order/MyAfterSalesBucket.tsx` 整個元件刪除；`src/pages/Index.tsx` 移除 `MyAfterSalesBucket` import 與 `<MyAfterSalesBucket />` 嵌入；首頁回歸純需求單列表頁
- 替代機制：業務 / 諮詢透過 sidebar 「我的售後服務」入口（顯示未結案 ticket 數字徽章）獲得 quick glance 提醒，點擊進入新模組作業頁
- 未來若需要獨立「業務工作台」頁面，再開新 change，不在本 change 範圍

### Requirement: 業務離職 / 請假時 ticket 負責人轉派

**Reason**: 經 Miles 確認，業務主管不會介入售後 ticket 轉派情境，本功能屬冗餘。業務離職 / 長假的實務替代方案標為 [OQ AFT-1](../../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md) 留待後續釐清。

**Migration**:
- spec：本 Requirement 整段移除
- schema：`AfterSalesTicket.owner_transfer_log` 欄位同步移除
- Prototype：`src/pages/sales-manager/ManageAfterSalesTicketOwnership.tsx` 整頁刪除；`useErpStore.transferAfterSalesTickets` action 移除；`OwnerTransferLog` type / interface 移除；mock data 中 `ownerTransferLog` 欄位移除
- sidebar：`/sales-manager/after-sales-tickets` 入口移除
- 業務離職實務替代方案：[OQ AFT-1](../../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md) 暫無系統功能，靠人工流程處理
