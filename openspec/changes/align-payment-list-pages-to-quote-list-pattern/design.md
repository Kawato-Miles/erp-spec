## 性質與定位

**本 change 定位為 `technical-debt-cleanup`**（三視角審查共識）：
- 純 UI / 設計規範一致性修補
- 不引入新業務功能、不解決客戶可見痛點
- 投入依據：design system 規範被無聲漂移的長期維護成本
- **不佔用「業務功能 roadmap」名額**

CEO 視角審查提出更深層的 OQ-0（「業務每天在這三頁要做的最重要決策是什麼？」）— 此問題獨立於本 change 之外處理，本 change 不假設答案。若 OQ-0 後續結論是「款項管理應改為 actionable 追款工具（如 Versapay / ARDEM 模式）」，本次對齊的 UI 範式可能需重新評估。本 change 仍可作為 UI 系統一致性的階段性成果。

## Context

### 現況

款項管理三模組（應收款項 / 待開發票 / 帳務異常）列表頁的搜尋 UI 採用「KPI Card + ErpStatusTabs + 搜尋 Card + 操作列」四區塊結構，與 `QuoteListPage` 的「單一搜尋 Card + 操作列」單容器結構顯著不一致。三檔案的結構高度相似（`StatItem` 元件定義同款、搜尋 Card 樣式同款），明顯是複製衍生。

### 已存在的規範與權威

| 項目 | 位置 | 內容 |
|------|------|------|
| 列表頁總則 | [DESIGN.md § 1 第 42 行](../../../../sens-erp-prototype/DESIGN.md) | 「列表頁一律對齊 `QuoteListPage`」 |
| 列表頁範式 A | [DESIGN.md § 6.1](../../../../sens-erp-prototype/DESIGN.md) | 篩選 ≤ 3 項：用 `ErpToolbar` 單列工具列 |
| 列表頁範式 B | [DESIGN.md § 6.1](../../../../sens-erp-prototype/DESIGN.md) | 篩選 ≥ 4 項：篩選面板（手寫 Card + grid） + `ErpToolbar variant="bare"` |
| 共用元件 | [DESIGN.md § 1.4 / § 6.1](../../../../sens-erp-prototype/DESIGN.md) | `ErpToolbar` / `ErpStatusTabs` / `ErpTableCard` / `ErpPagination` / `ErpEmptyState` |
| Canonical reference | `src/components/quote/QuoteListPage.tsx` | 需求單列表為列表頁基準範本 |

### 已知同款違規範圍（grep 結果，2026-05-19）

`ErpStatusTabs` 在 prototype 中的使用點：
- **本 change 修正範圍**：`Receivables.tsx` / `PendingInvoices.tsx` / `BillingAnomalies.tsx` / `ConsultationRequestList.tsx`（四個列表頁狀態主篩）
- **非違規（合理使用）**：`components/layout/ErpStatusTabs.tsx`（元件本身）、`components/layout/ErpDetailTabs.tsx`（姊妹元件，註解中說明語意邊界）

本 change 涵蓋所有已知列表頁狀態主篩違規，無遺漏 follow-up。

### 限制條件

- **Prototype 平台**：僅桌機瀏覽器
- **技術棧**：React + TypeScript + Tailwind + shadcn/ui
- **單一 Repo**：`sens-erp-prototype` 因 Lovable 雲端 build 限制只在 `main` 分支工作
- **業務邏輯保留**：四個列表頁計算函式（`calcPaymentsNetAmount` / `getMaxOverdueDays` / 異常偵測規則 A-D / 諮詢單流程邏輯）不在本次變更範圍

## Goals / Non-Goals

**Goals:**

1. 四個列表頁（三款項 + 諮詢單）搜尋 UI 結構、視覺、共用元件使用方式與 `QuoteListPage` 對齊
2. 移除 `ErpStatusTabs` 作為狀態主篩的用法，改為搜尋 Card 內的 `<select>` 篩選器
3. 把 `StatItem`（純文字 KPI）升級為 `StatusCard`（icon + 色彩），統計數值依當前篩選結果動態重算，**並在篩選非空時顯示「(當前篩選)」標記**
4. 把 canonical reference `QuoteListPage` 的 KPI 數值也同步改為依篩選 filtered 動態（避免規範自相矛盾）
5. 擴充 `StatusCard.count` 型別為 `number | string`，以支援金額類 KPI
6. 補強 DESIGN.md § 6.1 範式說明 + 操作性判定（「列表頁狀態主篩 vs 上層 view 切換」）
7. 在 `prototype-shared-ui` spec 新增「列表頁標準佈局」Requirement，作為後續列表頁的稽核依據

**Non-Goals:**

- 不重構四個列表頁業務邏輯（金額計算、逾期判定、異常偵測、諮詢單流程）
- 不改動 `ErpTableCard` 結構與 `erp-table` class
- 不引入新元件（`ErpListPageLayout` 等抽象）— 沿用既有 `StatusCard` / `Input` / `<select>` / `Button`
- 不修改其他模組列表頁（order / work-order / production-task / shipment 等）— grep 已確認這些列表頁未使用 `ErpStatusTabs` 作狀態主篩
- 不引入自動化 lint / pre-commit hook（列為 OQ-2 長期方案，Miles 確認不升級為短期）
- 不重新評估其他 Tab 用法（如詳情頁 Tab 切換、收件匣 view 切換）— 本次只禁用 `ErpStatusTabs` 作「列表頁狀態主篩」這一個 anti-pattern
- **不回答 OQ-0**（業務每天在三頁要做的最重要決策是什麼）— 該問題獨立處理

## Decisions

### 決策 1：對齊方向採用方向 Y（保留 KPI 卡 + select 取代 Tab），非方向 X（完全狀態分類）

**問題**：三模組的 ErpStatusTabs 切的是「狀態 bucket」（逾期分桶 / 發票到期狀態 / 異常類型），而 `QuoteListPage` 的 `StatusCard` 是「訂單狀態分類計數」。要對齊到哪一邊？

**選項**：

| 方向 | StatusCard 內容 | 狀態篩選 | 取捨 |
|------|---------------|----------|------|
| **X：完全狀態分類** | 把 bucket 做成 StatusCard | select | 與 QuoteListPage 完全同型；但**犧牲金額類 KPI**（業務每天追款的核心數字） |
| **Y：保留 KPI + select 取代 Tab**（採用） | 保留現有 4 個 KPI 維度 | select | 容器結構對齊；保留金額 KPI；StatusCard 與 QuoteListPage 語意略有不同（KPI 維度 vs 狀態分類） |

**決策**：採用方向 Y。

**理由**：
1. **款項管理本質是 KPI 追蹤**，不是狀態流轉。`QuoteListPage` 用狀態分類是因需求單天然按狀態流轉，但款項管理的業務核心是「金額合計、逾期未收、即將到期」這類量化指標。直接抄狀態分類會失去業務每天要回報的關鍵數字。
2. **DESIGN.md § 42 行的「狀態統計卡」是 QuoteListPage 場景下的命名**，本質上是「視覺化的計數卡」。KPI 卡仍屬於同一類元件（`StatusCard`）。
3. **方向 X 在 Receivables 場景下視覺彆扭**：5 個逾期 bucket（未到期 + 1-29 + 30-59 + 60-89 + ≥90）不對齊 grid-4 慣例。
4. **Miles 已明確要求** StatusCard 依篩選結果動態調整 — 方向 Y 正好讓 KPI 維度的數值能反映當前篩選範圍（從 `allRows` 改為 `rows`）。

### 決策 2：狀態 select 單欄、不強行補滿 grid-4

**問題**：`QuoteListPage` 用 grid-cols-4 排 4 個 select（狀態 / 帳務公司 / 接單業務 / 日期範圍）。三模組是否要硬補 4 個 select？

**決策**：三模組各自只加 1 個狀態 select，**不強行補滿 grid-4**。

**理由**：
- 應收款項的「逾期 bucket」是業務追款唯一需要篩的維度；待開發票的「發票狀態」與帳務異常的「異常類型」同樣是單一篩選軸。
- 硬補 select 會出現意義不明的「客戶 select」「業務 select」等 — 業務不需要在這幾頁按客戶 / 業務切，因為這幾頁就是「我（業務）自己的待辦」。
- DESIGN.md § 6.1 範式 A/B 的「3 項以上 vs 4 項以上」是上限分界，沒有強制下限。
- 視覺上 grid-cols-1（或不用 grid，直接 stacked）是合理的，Card 內也可以只有「搜尋框 + select 一欄」的 stacked 佈局。

### 決策 3：StatusCard 數值從 `allRows` 改為 `rows`（依篩選動態）

**問題**：`QuoteListPage` 現況的 `statusCounts` 來自全域 scoped quotes（不受 statusFilter 影響）；三模組現況的 KPI 也來自 `allRows`（不受篩選影響）。本次該怎麼設計？

**決策**：三模組 StatusCard 數值來源改為 `rows`（篩選後）。

**理由**：
- Miles 明確要求「Card 要依照篩選結果調整內容」。
- 這也讓 KPI 卡從「靜態頁面標題」變成「動態當前範圍指標」，業務在搜尋客戶名稱後馬上看到該客戶的金額合計，符合追款場景。
- `QuoteListPage` 現況是 static，本次**不在本 change 範圍動 QuoteListPage**，但 DESIGN.md § 6.1 補強說明時會註明「StatusCard 數值建議依當前篩選結果動態調整」（描述性指引，非強制）。

### 決策 4：保留 AppLayout / breadcrumb，不引入 ErpPageHeader

**問題**：DESIGN.md § 6.1 模板示意「ErpPageHeader」，但三模組現況用 `AppLayout title + breadcrumb` 即可，沒用 `ErpPageHeader`。`QuoteListPage` 也沒用 `ErpPageHeader`。

**決策**：本次不引入 `ErpPageHeader`，沿用 `AppLayout title + breadcrumb`。

**理由**：對齊 `QuoteListPage` 的實際做法（canonical reference 優先於模板），且 `AppLayout title` 已扮演 page title 角色。`ErpPageHeader` 的強制化作為 OQ-3 留待後續評估。

### 決策 5：本次不抽 `ErpListPageLayout` 共用元件

**問題**：四個列表頁（QuoteListPage + 三模組）都自己手寫搜尋 Card。是否該抽出 `ErpListPageLayout` 元件強制統一？

**決策**：本次不抽，改以「DESIGN.md 範式模板 + spec Requirement 稽核」達成一致性。

**理由**：
- DESIGN.md § 6.1 第 483 行明確說「暫不抽 `FilterCard` 元件，保留 layout 彈性」— 抽元件會強制統一過頭，犧牲特殊場景的彈性。
- 範式模板 + spec Requirement 已足以達成稽核目的。
- 抽元件是更大的 refactor，列為 OQ-4 待後續評估。

### 決策 6：StatusCard.count 型別擴充為 `number | string`（blocker 修正）

**問題**：[StatusCard.tsx](../../../../sens-erp-prototype/src/components/shared/StatusCard.tsx) 現況 `count: number`，但本 change 要求顯示金額類 KPI（如「NT$ 1,234,567」），是 formatted string。不修元件無法實作。

**決策**：擴充介面為 `count: number | string`，內部使用 `String(count)` 隱轉。

**理由**：
- 業界 KPI tile 元件普遍接受 formatted string（[SAP Fiori](https://experience.sap.com/fiori-design-web/list-report-floorplan-sap-fiori-element/) / NetSuite）
- 修改範圍小（元件 1 處型別 + 內部一處轉換），對既有 4 個使用點無破壞性
- 替代方案（造新 `KpiCard` 元件）增加元件分裂、違反 Non-Goals「不引入新元件」

**Task 順序**：Task 0（在 Task 1 之前）執行 StatusCard 元件擴充。

### 決策 7：ConsultationRequestList 同款違規納入本次 scope

**問題**：grep 確認 `ConsultationRequestList.tsx` 是同款違規（ErpStatusTabs 作狀態主篩 + rounded-xl + font-bold + 無 Search icon）。

**決策**：納入本 change scope（Task 5.5）。

**理由**：
- 規範一上線該檔即成已知違規，留 follow-up 等於默許「規範補上但違規存在」的破窗
- 後續開發者參考該檔可能再次複製違規
- 改動範圍與其他三模組相同（樣板複製），邊際成本低

### 決策 8：QuoteListPage canonical reference 同步動態 KPI

**問題**：spec Requirement 寫 KPI 動態為 SHOULD，但 canonical reference `QuoteListPage` 是 static `statusCounts`，造成「canonical reference 自身不符 SHOULD」矛盾。

**決策**：本 change 順手修改 `QuoteListPage` 的 `statusCounts` 從 `quotes`（全域 scoped）改為 `filtered`（依當前篩選），約 5 行修正。

**理由**：
- 避免 canonical reference 自相矛盾、規範一上線即破窗
- 修改範圍極小（不涉及 UI 結構）
- 統一四個列表頁的 KPI 行為（含 `QuoteListPage` 自己）

### 決策 9：StatusCard 篩選中標記避免金額誤判

**問題**：業務看 Receivables 篩「客戶 A」後看到「待收金額 NT$ 500,000」，可能誤判為全公司應收（這個數字平時被當作月度回報基準）。

**決策**：StatusCard 元件擴充 `filtered` prop（boolean），為 true 時在 label 後加 muted text「（當前篩選）」或在 Card 右上加小 badge「已篩選」（兩個方案任一，依視覺權衡決定）。

**理由**：
- [SAP Fiori](https://experience.sap.com/fiori-design-web/list-report-floorplan-sap-fiori-element/) 對篩選後 KPI 的處理是 footer "in current filter"，本決策對齊業界做法
- 避免「上方數字 vs 下方表格不一致」的認知負擔（[Aufait UX](https://www.aufaitux.com/blog/dashboard-filter-design-guide/)）
- 元件擴充成本低，反向相容（`filtered` 預設 false）

**列表頁實作**：篩選狀態（search / select）為非預設值時，StatusCard 傳 `filtered={true}`。

### 決策 10：實作順序 — 元件擴充 → 規範 → 列表頁實作

**問題**：先改實作再補 DESIGN.md，還是先補規範？StatusCard 元件擴充與列表頁實作誰先誰後？

**決策**：依以下順序執行 —
1. **Task 0：StatusCard 元件擴充**（blocker，必須先解，否則列表頁無法用 string 型 KPI）
2. **Task 1：補強 DESIGN.md § 6.1**
3. **Task 2：補強 spec**
4. **Task 3-5：依新樣板改四個列表頁 + QuoteListPage 同步**

**理由**：
- **規範先於實作**符合 ERP 工作原則 § 5「文件即規格」
- **元件先於規範**因為 StatusCard 是規範會引用的元件，元件型別不擴充規範寫不下「count: number | string」
- 補完 DESIGN.md 後改 Receivables.tsx 作為新樣板，其他列表頁依新樣板複製衍生（這次的複製是按規範複製，不是違規複製）
- 若先改實作再補規範，會出現規範被實作「事後合理化」的問題

## Risks / Trade-offs

| 風險 | 影響 | 緩解 |
|------|------|------|
| ~~R1：StatusCard 動態數值與 QuoteListPage 行為不一致~~ | （已關閉）決策 8 移除：本 change 同步把 QuoteListPage 改為動態 KPI，四個列表頁行為統一 | — |
| **R2: 帳務異常 KPI 卡片設計**（grid-4 vs grid-2） | 影響 BillingAnomalies 視覺層 | 三視角審查共識傾向 grid-2（CEO + ERP 顧問引用 SAP Fiori / NetSuite「列表頁不是 dashboard」原則）；列為 OQ-1，Miles 在 Task 5 實作前最終確認；DESIGN.md § 6.1 註明「KPI 卡數量視業務必要性，1-4 卡皆可」 |
| **R3: ErpStatusTabs 被禁用於列表頁狀態主篩可能誤傷其他用法** | ErpStatusTabs 在其他位置（如詳情頁、收件匣 view）可能仍有合理用法 | spec Requirement 補「操作性判定」（含正反例）區分「狀態主篩」（禁用 Tab）與「view 切換」（Tab 仍可）；grep 確認本 change 涵蓋所有違規檔案，無誤殺 |
| **R4: 業務使用者習慣現有 Tab，改成 select 後 UX 退化** | 業務原本一個 click 切換狀態，改 select 後變兩步（click + select option） | 三視角審查建議的「select 旁加 quick filter chips」緩解方案 Miles 不採納；風險以「本 change 上線後若 Miles / 業務體感不佳，可在本 change 範圍內或下個 hotfix change 調整」承擔 |
| **R5: 四個 .tsx 修改可能造成 Playwright 既有測試 regression** | 既有測試可能斷在 ErpStatusTabs selector | 改完每個檔案後跑 `npm run dev` 自驗，並更新對應的 Playwright spec selector |
| ~~R6：補強 DESIGN.md 可能與其他列表頁現況衝突~~ | （已關閉）grep 確認：除四個納入 scope 的列表頁外，其他列表頁未使用 ErpStatusTabs 作狀態主篩 | — |
| **R7: StatusCard 元件型別擴充對既有使用點影響**（決策 6）| 既有 4 個 StatusCard 使用點傳 `number`，型別擴充為 `number \| string` 須確認反向相容 | TypeScript 型別擴充為 union，既有 `number` 入參自動相容；Task 0 完成後跑 `tsc` 確認無破壞 |
| **R8: StatusCard 篩選中標記在四模組外的影響**（決策 9）| 新增 `filtered` prop，可能影響 StatusCard 在審稿主管 KPI 面板等既有使用點 | `filtered` 預設 false，反向相容；Task 0 同步檢查既有使用點視覺無變化 |

## Migration Plan

1. **Task 0（前置 / blocker）：擴充 StatusCard 元件**（`count: number | string` + `filtered` prop）→ 既有使用點視覺無回歸驗證
2. **Task 1：補強 DESIGN.md § 6.1**（規範先行）
3. **Task 2：補強 `prototype-shared-ui` spec**（規範先行）
4. **Task 3：重構 Receivables.tsx**（新樣板，含視覺 / select / 動態 KPI / 篩選中標記）→ Playwright 驗證
5. **Task 4：依新樣板重構 PendingInvoices.tsx** → Playwright 驗證
6. **Task 5：依新樣板重構 BillingAnomalies.tsx**（含 OQ-1 確認）→ Playwright 驗證
7. **Task 5.5：依新樣板重構 ConsultationRequestList.tsx**（同款違規一併修，決策 7）→ Playwright 驗證
8. **Task 5.6：QuoteListPage canonical reference 動態 KPI 同步**（決策 8，約 5 行修正）→ 視覺與 KPI 行為驗證
9. **Task 6：三視角審查 round 2**（針對實作後再執行，確認規格期建議落實）
10. **Task 7：doc-audit 跨檔案一致性檢查 + Vault OQ-0 開卡**

**Rollback**：本次純 UI refactor + 元件型別擴充（反向相容），回滾即 `git revert`。業務邏輯與 mock 資料未動，無資料相容性風險。

## Open Questions

### OQ-0：款項管理頁面業務日常的最重要決策（CEO 三視角審查提出）

→ 已升級為 Vault 長期 OQ：[XM-001-款項管理頁面業務最重要決策](../../../memory/erp/ERP_Vault/08-open-questions/XM-001-款項管理頁面業務最重要決策.md)

**摘要**：業務每天在三頁要做的最重要決策是什麼？本 change 建立在「KPI 追蹤頁」假設上，但業界 AR 平台（Versapay / ARDEM）已轉向「actionable 追款列表」。Miles 決議本 change 繼續推進（technical-debt-cleanup 定位），OQ-0 獨立於本 change 處理，預期 2026-08-31 前完成訪談 + 決議。詳細討論 / 候選方案 / 待解答清單見 Vault 卡。

### OQ-1：帳務異常 KPI 卡片設計（grid-4 vs grid-2）

**問題**：帳務異常頁現況只有 1 個 AlertTriangle 警告卡。對齊新範式要 grid-4 補 3 個 KPI，還是允許破例 grid-2？

**候選方案**：
- **方案 A（grid-4 補滿）**：補成「訂單帳不平 / 異常項目 / 最常見異常類型 / 平均異常金額」
- **方案 B（grid-2 保留）**：StatusCard 排 grid-2「訂單帳不平 / 異常項目」，DESIGN.md 註明「KPI 卡 1-4 皆可」
- **方案 C（grid-2 + 上方 banner）**：採方案 B + 表格上方加 message strip（「本月最常見異常：退印未折讓（12 件）」）呈現原方案 A 想看的「最常見異常」資訊

**三視角審查共識**：
- **CEO**：方案 A 是強行湊數；「平均異常金額」對追款人員零價值；採方案 B
- **ERP 顧問**：BillingAnomalies 本質是「處理清單頁」（會計逐單處理），不是 dashboard；SAP Fiori / NetSuite 對處理清單頁配「list portlet + 1-2 alert tile」而非 dashboard tiles；採方案 C（grid-2 + banner）
- **Senior PM**：grid-2 起步；若 Miles 想看「最多異常類型」可加 message strip

**決策方法**：Task 5 開始前，Miles 回顧「帳務異常頁業務最常問的兩個問題」。若答案落在「多少筆 / 多少金額」兩維度內 → 方案 B 或 C；若會主動問「最多是哪類異常」→ 方案 C。**建議優先採方案 B 起步**，message strip 視 Task 5 實作時體感再決定是否加入。

### OQ-2：是否導入自動化稽核（grep-based pre-commit hook）

**問題**：DESIGN.md + spec Requirement 是「描述性規範」，依賴開發者自律 + PR review。是否該加 grep-based pre-commit hook 自動禁止 ErpStatusTabs 在列表頁的使用？

**狀態**：列為長期 follow-up，不在本 change 範圍內實作。建議在三模組重構完成、UI refactor 穩定後（≥ 1 個月）再評估是否引入。

### OQ-3：是否強制使用 ErpPageHeader

**問題**：DESIGN.md § 6.1 模板示意 `ErpPageHeader`，但 QuoteListPage + 三模組都沒用。要全面強制嗎？

**狀態**：本次採「對齊 QuoteListPage 實際做法」，不引入 `ErpPageHeader`。OQ 留待後續評估（含「`AppLayout title` 與 `ErpPageHeader` 是否合併」這個更大議題）。

### OQ-4：是否抽 ErpListPageLayout 共用元件

**問題**：四個列表頁手寫搜尋 Card，是否抽元件？

**狀態**：DESIGN.md § 6.1 第 483 行明確說「暫不抽 FilterCard」。本次跟隨此原則，OQ 留待後續評估。

## 列表頁稽核清單（給後續開發者）

新增 / 修改列表頁時，逐項對照：

- [ ] 使用單一搜尋 Card（不分多區塊）
- [ ] 搜尋 Card 內容順序：搜尋框 → 篩選器（grid 1-4 欄）→ StatusCard 統計 grid
- [ ] 搜尋框左內嵌 `Search` icon
- [ ] Card 圓角 `rounded-lg`、標題 `font-medium`
- [ ] 狀態主篩使用 `<select>`，**不使用 `ErpStatusTabs`**
- [ ] KPI 用 `StatusCard`（icon + 色彩），**不用 `StatItem`**
- [ ] StatusCard 數值來源建議為 `rows`（篩選後），非 `allRows`
- [ ] 操作列在搜尋 Card 之下、表格之上，使用 `flex items-center justify-end gap-2`
- [ ] 表格使用 `ErpTableCard` + `erp-table` class
- [ ] 空狀態使用 `ErpEmptyState`
- [ ] 分頁使用 `ErpPagination`（如有）
- [ ] 篩選 / 搜尋變更時 `setPage(1)` 重置分頁
