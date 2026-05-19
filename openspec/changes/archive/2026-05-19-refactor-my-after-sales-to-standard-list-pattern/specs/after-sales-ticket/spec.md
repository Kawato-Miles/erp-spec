## MODIFIED Requirements

### Requirement: 我的售後服務作業頁

系統 SHALL 提供「我的售後服務」作業頁（路由 `/my-after-sales`），業務 / 諮詢登入後 SHALL 可從業務平台 sidebar 進入。該頁列出當前使用者開立且 `status ≠ 已結案` 的 AfterSalesTicket，加強「漏單沒處理」的信號，提供 next action 提示協助業務 / 諮詢快速判斷下一步操作。

頁面 layout SHALL 對齊 [Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：「搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁」模式，禁止按狀態拆多張表或用卡片分組呈現資料。範式參考：[QuoteListPage](../../../../sens-erp-prototype/src/components/quote/QuoteListPage.tsx)（canonical reference）。

**頁面結構 SHALL 包含三個區段**：

1. **搜尋與篩選 Card**（單一 Card 內含三組元素，與既有列表頁慣例一致）：
   - 搜尋框：訂單編號 / 案名 / 客戶名稱（部分匹配、不分大小寫）
   - 篩選 grid（4 欄）：next action select / case_category select / responsibility select / 受理區間 date range
   - StatusCard grid（3 張數字卡）：逾期 / 待填決議 / 待結案，數字依篩選後結果顯示（filtered={true} 標記）

2. **操作列**：`flex justify-end`，含「刷新」「重設篩選」等動作

3. **單一資料表**：`<ErpTableCard>` 包 `<table className="erp-table">`，依下列欄位順序：

   | 欄位 | 寬度 | 說明 |
   |---|---|---|
   | # | 56px | 行號（依分頁）|
   | caseNo | 140px | AS-YYYYMMDD-XX |
   | 訂單編號 | 130px | ORD-... |
   | 客戶 / 案名 | auto | clientName · caseName |
   | 受理時間 | 110px | 相對時間（5 天前）|
   | 售後類型 | 100px | case_category |
   | 責任歸屬 | 90px | responsibility |
   | 決議 | 90px | resolution（NULL 時顯示 `—`）|
   | next action | 110px | 逾期 / 待填決議 / 待建關聯動作 / 待結案 |
   | status | 100px | status badge（受理中黃 / 處理中藍 / 逾期紅）|
   | 操作 | 60px | `[→]` 跳訂單詳情頁售後 Tab |

4. **分頁**：`<ErpPagination>`，PAGE_SIZE = 10（與 ConsultationRequestList 一致）

next action 分組 SHALL 採用下列定義（互斥；逾期優先於其他三組），以「獨立 table 欄位」形式呈現每行 ticket 的 next action 值：

| 分組 | 條件 |
|------|------|
| 逾期 | `opened_at` 距今 `> DEFAULT_RED_LIGHT_DAYS (7 天)` 且 `status ≠ 已結案` |
| 待填決議 | `status = 受理中` 且 `resolution = NULL` 且非逾期 |
| 待建關聯動作 | `status = 處理中` 且 `resolution ∈ {退款, 補印, 退款+補印}` 且該 resolution 對應下游動作（OrderAdjustment / 補印 PrintItem）尚未建立 且非逾期 |
| 待結案 | `status = 處理中` 且（對應下游動作已執行 或 `resolution = 不處理`）且非逾期 |

預設排序：`opened_at` 升序（最久未處理優先）。

sidebar 入口 SHALL 持續顯示當前使用者未結案 ticket 數字徽章（任何頁面都可見），徽章為 0 時 SHALL NOT 顯示徽章但保留入口。

#### Scenario: 業務進入「我的售後服務」頁

- **GIVEN** 業務 Alice 名下有未結案 ticket 5 張（逾期 1 張 / 待填決議 2 張 / 待結案 2 張）
- **WHEN** Alice 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 導航至 `/my-after-sales`
- **AND** 頁面 SHALL 顯示頂端待辦摘要：逾期 1 / 待填決議 2 / 待結案 2
- **AND** table SHALL 列出 5 張 ticket，依 opened_at 升序排序
- **AND** 每行 SHALL 顯示對應的 next action 欄位值

#### Scenario: 諮詢進入「我的售後服務」頁

- **GIVEN** 諮詢 Bob 名下有未結案 ticket 3 張
- **WHEN** Bob 從 sidebar 點擊「我的售後服務」
- **THEN** 系統 SHALL 顯示與業務角色相同的頁面結構（同 table、同摘要卡、同篩選器）
- **AND** table 僅 SHALL 含 `opened_by = Bob AND status ≠ 已結案` 的 ticket

#### Scenario: 點擊摘要卡套用 next action filter

- **GIVEN** 業務 Alice 進入「我的售後服務」頁，無 filter 套用、table 顯示全部 5 張未結案 ticket
- **WHEN** Alice 點擊頂端「逾期 1」摘要卡
- **THEN** table 套用 `nextAction = '逾期'` filter
- **AND** table 僅 SHALL 顯示「逾期」分組的 1 張 ticket
- **AND** 「逾期」摘要卡視覺強調（border 或背景加深）標示為 active
- **AND** 其他 StatusCard 數字 SHALL 依篩選後結果重新計算（待填決議 0 / 待結案 0）

#### Scenario: 再點同一摘要卡取消 filter（toggle）

- **GIVEN** 「逾期」摘要卡為 active，table 已套用 `nextAction = '逾期'` filter
- **WHEN** Alice 再點「逾期」摘要卡
- **THEN** filter SHALL 取消
- **AND** table SHALL 恢復顯示全部 5 張 ticket
- **AND** 「逾期」摘要卡 SHALL 取消 active 視覺強調
- **AND** StatusCard 數字恢復為未篩選狀態

#### Scenario: 點 ticket 行跳訂單詳情頁售後 Tab

- **GIVEN** table 中有一行 ticket `AS-20260512-01`，所屬訂單 `ORD-2026-005`
- **WHEN** 使用者點擊該行或操作欄的 `[→]` 按鈕
- **THEN** 系統 SHALL 導航至 `/orders/ORD-2026-005?tab=afterSales&ticket=AS-20260512-01`
- **AND** 訂單詳情頁 SHALL 自動切到「售後服務」Tab 並展開該 ticket

#### Scenario: 篩選器組合運作

- **GIVEN** 使用者名下 ticket 含「印件瑕疵」「規格不符」「物流問題」三類
- **WHEN** 使用者於 case_category 篩選器選擇「印件瑕疵」
- **THEN** table SHALL 僅顯示 `case_category = 印件瑕疵` 的 ticket
- **AND** 頂端 StatusCard 數字 SHALL 依篩選後結果重新計算

#### Scenario: next action 與 case_category 篩選同時套用

- **GIVEN** 使用者點「逾期」摘要卡套用 `nextAction = '逾期'` filter
- **WHEN** 使用者再於 case_category 篩選器選擇「印件瑕疵」
- **THEN** table SHALL 同時套用兩個 filter（`nextAction = '逾期' AND case_category = '印件瑕疵'`）
- **AND** filter 為 AND 邏輯（取交集）

#### Scenario: 訂單編號搜尋

- **WHEN** 使用者於搜尋欄輸入 `ORD-2026-005`
- **THEN** table SHALL 僅顯示 `order_id`、`order.orderNo`、`order.caseName` 或 `order.clientName` 部分匹配的 ticket
- **AND** 搜尋 SHALL 不分大小寫

#### Scenario: 分頁顯示與切換

- **GIVEN** 使用者名下有 25 張未結案 ticket（含 1 張逾期）
- **WHEN** 使用者進入「我的售後服務」頁
- **THEN** table SHALL 顯示第 1 頁 10 張 ticket
- **AND** `<ErpPagination>` SHALL 顯示「1 / 3 頁」
- **WHEN** 使用者點擊下一頁
- **THEN** table SHALL 切換至第 2 頁 10 張 ticket

#### Scenario: 列表為空狀態

- **GIVEN** 業務 Alice 無未結案 ticket
- **WHEN** Alice 進入「我的售後服務」
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」row
- **AND** 頂端待辦摘要數字 SHALL 全部顯示 0
- **AND** SHALL 顯示說明文：「售後 ticket 需先在訂單已完成後從訂單詳情頁的『售後服務』Tab 建立」

#### Scenario: 篩選後無結果

- **GIVEN** 業務 Alice 名下有 3 張 ticket，全部為「印件瑕疵」
- **WHEN** Alice 套用 case_category = 「物流問題」filter
- **THEN** table SHALL 顯示「目前沒有符合條件的售後服務單」
- **AND** 提示 SHALL 引導使用者重設篩選

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
