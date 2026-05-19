## Context

### 既有狀態

`add-my-after-sales-action-page-and-remove-owner-transfer` change（2026-05-19 歸檔 v0.2）建立的 [MyAfterSales.tsx](../../../../sens-erp-prototype/src/pages/MyAfterSales.tsx) 採以下結構：

```
AppLayout
├─ 待辦摘要 Card（3 張 StatusCard：逾期 / 待填決議 / 待結案）→ 點擊 scrollToGroup
├─ 搜尋與篩選 Card（獨立）
└─ 依 next action 分組的 ticket 列表
   ├─ 逾期 group: 多張 MyAfterSalesActionCard
   ├─ 待填決議 group: ...
   ├─ 待建關聯動作 group: ...
   └─ 待結案 group: ...
```

`MyAfterSalesActionCard.tsx` 為 `<button><div className="rounded-xl border">` 結構，跟標準 `<tr><td>` 列表頁差距甚大。

### 違反規範

[Prototype DESIGN.md § 6.1 列表頁規範第 42 條](../../../../sens-erp-prototype/DESIGN.md)：
- 「列表頁採『搜尋 + 多維度篩選 + 狀態統計卡 + **單一資料表** + 分頁』模式，**不得按狀態拆多張表**」
- 「列表頁狀態主篩 MUST 用 `<select>`，**MUST NOT** 用卡片或 Tab 分組呈現資料」
- 「強制要求 ErpTableCard、ErpPagination、StatusCard 元件，禁止自定義卡片式分組」

### 既有 canonical reference

| 範式 | 路徑 |
|---|---|
| 範式 B（搜尋 + 篩選 + StatusCard 同 Card + ErpTableCard + ErpPagination）| [QuoteListPage.tsx](../../../../sens-erp-prototype/src/components/quote/QuoteListPage.tsx) |
| 對照：訂單列表 | [OrderList.tsx](../../../../sens-erp-prototype/src/pages/OrderList.tsx) |
| 對照：諮詢單列表 | [ConsultationRequestList.tsx](../../../../sens-erp-prototype/src/pages/ConsultationRequestList.tsx) |

三者共同點：
- 搜尋框 + 4 欄篩選 grid + StatusCard grid 包在同一個 `<div rounded-lg p-5>` Card
- 操作列 `flex justify-end` 含「刷新」「新增」
- `<ErpTableCard>` 包 `<table className="erp-table table-fixed">`
- 表格 column 順序：編號 / 主鍵 / 主資料 / 狀態 / 客戶 / 負責人 / 操作
- `<ErpPagination page totalPages onPageChange />` 收尾

### 跑偏 Root Cause

原 explore 階段 Miles 說「layout 可以用需求單詳情頁的形式即可」，被誤套用：
- 「容器版型」（AppLayout + 標題 + breadcrumb + spacing）可參考其他頁
- 「資料呈現範式」必須依頁面類型（list 用 table、detail 可用 Card）

詳情參見 [Vault 11-review-knowledge/_shared/review-loading-checklist.md § 三 2026-05-19 案例](../../../memory/erp/ERP_Vault/11-review-knowledge/_shared/review-loading-checklist.md)。

## Goals / Non-Goals

**Goals**：

- MyAfterSales 對齊 QuoteListPage 範式 B，所有 list 頁版型一致
- next action 信號保留為 table 欄位（不丟失原本的「業務優先級提示」UX 價值）
- 摘要卡 toggle filter 提供快速切入（替代原本的 scroll 行為）
- 透過 misjudgement-record 防止後續重蹈覆轍

**Non-Goals**：

- 不改 DESIGN.md § 6.1 規範（本 change 是「修正既有頁對齊現有規範」，規範本身已足夠）
- 不改 after-sales-ticket 實體欄位 / 狀態機 / 角色 visibility
- 不改 AppSidebar 入口或數字徽章邏輯
- 不引入新 capability（純資料呈現改寫）

## Decisions

### D1：採用 QuoteListPage 範式 B（搜尋 + 篩選 + StatusCard 同一 Card）

**選擇**：MyAfterSales 內部 layout 直接複製 QuoteListPage 結構，僅替換資料來源（quotes → 我的未結案 tickets）+ 摘要卡定義（待確認需求 → 逾期 / 待填決議 / 待結案）。

**Rationale**：
- QuoteListPage 是 DESIGN.md § 6.1 範式 B 的 canonical reference（line 443-495）
- 統一版型有助於業務 / 諮詢使用者在不同列表頁切換時無學習成本
- 不會錯過範式 B 的細節（過濾邏輯、狀態卡與篩選聯動、ErpTableCard / ErpPagination 用法）

**Alternatives considered**：
- 自訂版型 → 違反 § 6.1 規範，與本次修正目的衝突
- 套用 OrderList 範式 → 沒有 StatusCard，本頁需要摘要卡顯示信號，不適合

### D2：next action 為獨立 table 欄位（10 欄結構）

**選擇**：table 結構 10 欄：`# | caseNo | 訂單編號 | 客戶 / 案名 | 受理時間 | 售後類型 | 責任歸屬 | 決議 | next action | status | 操作`

**Rationale**：
- next action（逾期 / 待填決議 / 待建關聯動作 / 待結案）為業務優先級提示，必須在 table 每行可見
- 欄位獨立讓使用者可依 next action sort / filter（透過 select 篩選器）
- 不嵌入 status badge 內：保持 status badge 為 ticket 自身狀態，next action 為「衍生」概念，語意分離
- 欄位寬度沿用既有列表頁慣例

**Alternatives considered**：
- next action 嵌入 status badge（「處理中（待結案）」）→ 兩個概念混淆、文字過長
- 不顯示 next action 欄位、只靠摘要卡 → 失去每行的「下一步做什麼」提示

### D3：摘要卡 toggle filter（再點同卡取消）

**選擇**：頂端 StatusCard 包在 `<button onClick>`，點擊套用對應的 next action filter（例：點「逾期」→ table 套用 `nextAction = '逾期'`）；當前 active 卡視覺強調 border / 背景。再點同一卡 = 取消 filter。

**Rationale**：
- 點摘要卡是業務 / 諮詢進入頁面後最快速的「我要看 X」操作
- toggle 行為符合 dashboard 慣例（例：金融 app 的快速切換）
- StatusCard 數字應依**篩選後**結果顯示，傳 `filtered={true}` 標記（沿用 align-payment-list-pages-to-quote-list-pattern 引入的 prop）

**Alternatives considered**：
- 摘要卡為純信號（不可點）→ 失去快速切入價值
- 點摘要卡只是 sort 而非 filter → 規範混亂、與業務直覺衝突

### D4：移除 MyAfterSalesActionCard 元件

**選擇**：刪除 `src/components/order/MyAfterSalesActionCard.tsx` 整檔；table 列直接 inline `<tr>` 結構。

**Rationale**：
- 卡片元件僅用於原本的分組列表，table 化後不再需要
- inline `<tr>` 與其他列表頁一致（QuoteListPage 也是 inline）
- karpathy-guidelines「surgical changes」+「remove orphans your changes made unused」

**Alternatives considered**：
- 保留元件作為 `<tr>` 子元件 → 過度抽象、其他列表頁也沒這樣做
- 改造為 row 結構但保留檔 → 等於 inline，沒必要保留檔

### D5：保留 next action helpers + unit test

**選擇**：`types/afterSalesTicket.ts` 中 `calcMyAfterSalesActionGroup` / `groupMyAfterSalesByAction` / `calcMyAfterSalesSummary` / `MyAfterSalesActionGroup` / `MyAfterSalesSummary` / `MY_AFTER_SALES_ACTION_GROUPS` 全部保留。19 個 unit test 沿用。

**Rationale**：
- 計算邏輯沒變：每行 ticket 仍需要算出 next action 值（顯示於欄位）
- 摘要數字仍需 `calcMyAfterSalesSummary`
- filter select 仍需 `MY_AFTER_SALES_ACTION_GROUPS` 列舉
- unit test 19 個全部仍有效（不需修改）

### D6：分頁採 PAGE_SIZE = 10

**選擇**：使用 `<ErpPagination>`，PAGE_SIZE = 10，與 ConsultationRequestList 一致。

**Rationale**：
- QuoteListPage 用 PAGE_SIZE = 6，但需求單列表筆數較多；售後 ticket 個人未結案數通常 < 20，PAGE_SIZE = 10 較合理
- 同類「個人作業面板」性質的 ConsultationRequestList 也用 10
- 避免分頁切太細造成「明明可一頁看完還要翻頁」的體驗

**Alternatives considered**：
- 不分頁 → 違反 § 6.1 規範第 506「一律 ErpPagination」
- PAGE_SIZE = 6（QuoteListPage 標準）→ 大多數個人 ticket 數會被切成多頁

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 使用者習慣原本的分組視覺信號，改 table 後失去「逾期紅、待填決議黃」的明顯區分 | next action 欄位 + status badge 仍保留色彩編碼（逾期紅 / 受理中黃 / 處理中藍），加上摘要卡 toggle filter 提供快速切入。視覺信號保留在欄位層 |
| MyAfterSalesActionCard 刪除後，未來若有「需要卡片風格的個人作業面板」需求需要重新建 | 視為短期不會發生；若真有需求，新建元件設計時 MUST 對照 DESIGN.md § 6.1 確認是否仍應 table 化 |
| e2e spec assertion 需大改 | 既有 spec 結構簡單，重寫成本可控；新增 filter toggle / 分頁 spec 對應新功能 |
| 點摘要卡 toggle filter 行為若與原本 scroll 預期不符，使用者可能誤觸 | dev 階段以 dogfood 驗證為主；若真有問題後續再 patch 標籤文案說明 |

## Migration Plan

1. **Prototype 階段（依 tasks.md 執行）**：
   - 改寫 `src/pages/MyAfterSales.tsx`（QuoteListPage 範式）
   - 刪除 `src/components/order/MyAfterSalesActionCard.tsx`
   - 更新 `e2e/my-after-sales.spec.ts`（assertion + filter toggle + 分頁 spec）
2. **Spec 階段**：
   - 應用本 change delta（MODIFIED「我的售後服務作業頁」Requirement）
3. **驗證階段**：
   - `openspec validate refactor-my-after-sales-to-standard-list-pattern --strict`
   - `npx tsc --noEmit` Exit 0
   - `npx vitest run src/test/after-sales/` 19/19 仍通過
   - `npx playwright test my-after-sales.spec.ts navigation.spec.ts` 全綠
   - dogfood：切換業務 / 諮詢角色目視對比 QuoteListPage / OrderList 版型
4. **Rollback 策略**：
   - 本 change 屬「資料呈現範式」修正，純前端改寫
   - 若 dogfood 發現問題可單獨 revert MyAfterSales.tsx + 還原 MyAfterSalesActionCard.tsx，其他 spec 變動不需 revert

## Open Questions

無新增 OQ。沿用前 change 既有 [OQ AFT-1 業務離職轉派](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-1-業務離職轉派.md) 與 [OQ AFT-2 逾期分級](../../../memory/erp/ERP_Vault/08-open-questions/after-sales-ticket-AFT-2-逾期分級.md)。
