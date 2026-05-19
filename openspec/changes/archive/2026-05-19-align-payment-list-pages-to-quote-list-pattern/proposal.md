> **本 change 性質：technical-debt-cleanup**
> 純 UI / 設計規範一致性修補，**不引入新業務功能、不解決客戶可見痛點**。投入 PM + 工程時間的依據是 design system / spec 規範被無聲漂移的長期維護成本，不應佔用「業務功能 roadmap」名額。三視角審查（CEO + PM + ERP 顧問）已確認此定位。

## Why

款項管理三模組（應收款項 / 待開發票 / 帳務異常）列表頁的搜尋 UI 佈局與基準範本 `QuoteListPage`（需求單列表）顯著不一致，違反 [DESIGN.md](../../../../sens-erp-prototype/DESIGN.md) § 1（第 42 行）明定的「列表頁一律為『搜尋 + 多維度篩選 + 狀態統計卡 + 單一資料表 + 分頁』模式（對齊 `QuoteListPage`）」規則。同時 `ConsultationRequestList`（諮詢單列表）為同款違規檔案，本次一併納入。

具體不一致：

- 款項三模組現況是「KPI Card + ErpStatusTabs + 搜尋 Card + 操作列」四個獨立區塊（rounded-xl / font-bold / 搜尋框無 icon / KPI 用 `StatItem` 樣式）
- `QuoteListPage` 是「單一搜尋 Card（含搜尋框 + 篩選器 grid + `StatusCard` 統計）+ 操作列」單容器模式（rounded-lg / font-medium / 搜尋框內嵌 `Search` icon / KPI 用 `StatusCard` 樣式）

這個分歧造成兩個傷害：
1. **業務使用者跨模組學習成本上升**：每進一個列表頁都要重新習慣不同的搜尋區結構與篩選交互（量化資料尚缺，列為防禦指標 — 見 design.md 風險 R4）。
2. **規範被新增模組複製偏離**：三個檔案結構高度一致（StatItem 元件定義同款），明顯是複製衍生；`ConsultationRequestList` 是同款違規的第四個檔案，若不修正，後續新列表頁將繼續複製這個錯誤範本。

根因不僅是「實作未對齊」，更深層的是：
- DESIGN.md § 6.1 範式 A/B 模板**未涵蓋「需要 KPI 區塊」的列表頁**，導致原設計者偏離 QuoteListPage 時並無模板可循（這不是失職，是範本表達力不足）。
- `ErpToolbar` / `ErpPageHeader` / `StatusCard` 等共用元件**未列為強制使用條款**。
- **缺乏可稽核的明確標準**（描述性規範 + PR review 自律不足以擋下複製違規）。

## What Changes

- **MODIFIED 款項管理三模組列表頁搜尋 UI**：`Receivables.tsx` / `PendingInvoices.tsx` / `BillingAnomalies.tsx` 由「四區塊」結構改為「單一搜尋 Card + 操作列」結構，與 `QuoteListPage` 對齊
- **MODIFIED 諮詢單列表頁搜尋 UI**：`ConsultationRequestList.tsx` 同款違規一併修正，避免規範一上線即破窗（三視角審查發現）
- **MODIFIED 狀態篩選機制**：四個列表頁（三款項 + 諮詢單）移除 `ErpStatusTabs`，改用搜尋 Card 內的 `<select>` 篩選器（單欄，不強行補滿 grid-4）
- **MODIFIED KPI 統計卡**：三模組 `StatItem`（純文字）升級為 `StatusCard`（icon + 色彩），放置於搜尋 Card 內部下方，且**數值依當前篩選結果動態重算**（由 `allRows` 改為 `rows`）
- **MODIFIED QuoteListPage canonical reference 自身 KPI 動態化**：`QuoteListPage.tsx` 的 `statusCounts` 由全域 scoped quotes 改為依當前 filtered 動態，讓 canonical reference 真正符合新規範（三視角審查發現「canonical reference 自身不符 SHOULD」矛盾）
- **MODIFIED StatusCard 元件型別**：`StatusCard.count` 由 `number` 擴充為 `number | string`，以支援金額類 KPI（如「NT$ 1,234,567」）。本 change 的 blocker
- **ADDED StatusCard 篩選中標記**：當篩選非空時，StatusCard 顯示「(當前篩選)」標記或 badge，避免業務誤判為全公司應收（三視角審查發現）
- **MODIFIED 視覺細節**：Card 圓角 `rounded-xl` → `rounded-lg`、搜尋區標題 `font-bold` → `font-medium`、搜尋框左內嵌 `Search` icon
- **MODIFIED DESIGN.md § 6.1**：補強範式 A/B 模板說明 — 範式 B 明定 `StatusCard` 位置（搜尋 Card 內部下方）、新增「禁用 `ErpStatusTabs` 作為列表頁狀態主篩」、明定 `QuoteListPage` 為 canonical reference、補「狀態主篩 vs 上層 view 切換」操作性判定（含正反例）
- **ADDED 列表頁稽核清單**：在 DESIGN.md § 6.1 新增可逐項對照的列表頁稽核 checklist（單一搜尋 Card / select 而非 Tab / `StatusCard` 而非 `StatItem` / 使用共用元件）

## Capabilities

### New Capabilities

無。本次變更不引入新 capability，僅補強既有 `prototype-shared-ui` capability 的 Requirements。

### Modified Capabilities

- `prototype-shared-ui`: 新增「列表頁標準佈局」Requirement，定義列表頁搜尋區結構、篩選器類型、KPI 卡呈現、共用元件強制使用條款

## Impact

**Prototype 程式碼**（`/Users/b-f-03-029/sens-erp-prototype/`）：
- `src/components/shared/StatusCard.tsx`（**Task 0 / blocker**：count 型別擴充 `number | string` + 篩選標記支援）
- `src/pages/finance/Receivables.tsx`（重構搜尋區、移除 ErpStatusTabs、改用 StatusCard）
- `src/pages/finance/PendingInvoices.tsx`（同上）
- `src/pages/finance/BillingAnomalies.tsx`（同上，含 OQ-1 待確認）
- `src/pages/ConsultationRequestList.tsx`（同款違規一併修正）
- `src/components/quote/QuoteListPage.tsx`（canonical reference KPI 動態化，5 行修正）
- `DESIGN.md` § 6.1（補強範式說明 + 稽核清單 + 操作性判定）

**OpenSpec specs**：
- `openspec/specs/prototype-shared-ui/spec.md`（新增 Requirement「列表頁標準佈局」「款項管理列表頁對齊基準範本」）

**測試 / 驗證**：
- 三模組 Playwright smoke 測試需驗證搜尋 / select 篩選 / StatusCard 動態重算
- 三視角審查（senior-pm + ceo-reviewer + erp-consultant）於 specs / design 完成後執行

**不影響範圍**：
- 三模組業務邏輯（calcPaymentsNetAmount / getMaxOverdueDays / 異常偵測規則）保留不變
- mock 資料結構不變（僅可能補 select option list）
- 表格本身（ErpTableCard）結構不變
- 其他模組列表頁（quote / order / work-order 等）不變動
