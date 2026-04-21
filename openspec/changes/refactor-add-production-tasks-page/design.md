## Context

新增生產任務頁（`sens-erp-prototype/src/pages/AddProductionTasks.tsx`，約 990 行）於 change `add-production-task-side-panel` 完成 side panel 新增流程後，頁面主體仍是 change 初期建立的版本：

- **頂部**：`ErpPageHeader`（標準）+ badges 內放印件名稱綠 badge + 預估成本小字
- **左側**：手寫兩個 `<div className="bg-white border border-[#e3e4e5] rounded-xl">` 容器 —「工單資訊」key-value 列表、「三分類 Tab」shadcn Tabs + `<table>` 表格
- **右側**：sticky `AddTaskCalcPanel`（拼版試算）
- **表格內欄位**：原生 `<input className={INP}>` / `<select className={SEL}>`，自定義 class `h-7 rounded border-input text-xs`

本 change 僅處理 **P1 範疇**：成本區塊與容器。表格 cell 內的原生 input / select（需新 atom compact 變體）、Tab 的三色 badge（需色盤 tokenize）屬 **P2 範疇**，另開 change。

User Story：[US-WO-010 批次新增生產任務](https://www.notion.so/3313886511fa811a8493cff779df01d8)，`work-order` spec 已於上次 change 更新 UI 規範，本 change 再補充頁面層級規範。

限制：
- Prototype 技術棧 React + TS + Tailwind + shadcn/ui，桌機瀏覽器專用
- 不本地 build，所有 UI 驗證透過 Lovable
- DESIGN.md §1.4 已定義 `Erp*` 分層；§3.3 編輯頁必達檢查清單含「分段容器」「寬鬆間距」「明確 CTA」

## Goals / Non-Goals

**Goals:**
- 成本資訊提升至頁面頂部主視覺層級，使用者可一眼看到材料 / 工序 / 裝訂 / 總計四個數字
- 頁面容器全面改用 DESIGN.md §1.4 Organism 層共用元件（`ErpDetailCard` / `ErpInfoTable`）
- 表格套 `.erp-table` class，視覺與全站列表頁一致
- 寫死 hex → design token，消除 panel 以外殘留的 hex

**Non-Goals:**
- 表格 cell 內原生 input / select 改 `Erp*` atom 變體（P2 範疇，需先新建 `ErpInput compact`）
- Tab 三色 badge（amber/blue/green）與印件名稱 badge 的 tokenize（P2 範疇）
- 業務邏輯、資料模型、`handleSave` 分組邏輯、色數計算 util
- 新增 panel（`AddProductionTaskPanel`）內部結構（已於上次 change 完成）

## Decisions

### D1 — 成本摘要放頁面頂部 `ErpSummaryGrid`，5 欄分項呈現

**決定**：頁面頂部 `ErpPageHeader` 下方緊接 `ErpSummaryGrid` **5 欄**：`設備費 | 材料小計 | 工序小計 | 裝訂小計 | 色數加價`。

**依 Miles 反饋確認**：總計不另列欄位；使用者關注各項成本構成（設備費獨立、色數加價獨立），避免總計掩蓋細項。

**附帶動作**：`ErpSummaryGrid` atom 擴充支援 `cols: 2 | 3 | 4 | 5 | 6`（原本只到 4）。此擴充為 atom 層 API 小幅擴展，不影響既有 2/3/4 欄用法。

**理由**：
- 成本是使用者填任何一筆任務時都關心的主要資訊，放頂部符合視覺掃描順序（Header → 摘要 → 內容）
- `ErpSummaryGrid` 是詳情頁成熟 pattern（訂單詳情 / 工單詳情 / 印件詳情都用），使用者已習慣此位置讀數字
- 右側 sticky 已有 `AddTaskCalcPanel`，再放成本會擠壓，視線也會分散

**替代方案**：
- 右側 sticky 成本卡片（類似 Figma 7662:45265 的「售價預覽」結構）：否決原因 = 右側已有拼版試算，視覺擁擠
- Header badges 內加大成本字 + 加顏色：否決原因 = Header 是「頁面識別」主體，塞多資訊會稀釋 CTA 按鈕優先級

### D2 — 右側成本明細本次不做，逐筆明細由 table 既有「預估成本」欄承擔

**決定**（Miles 反饋）：本次不新增右側成本明細卡片。每筆生產任務的成本明細由 table 最右側既有「預估成本」欄（顯示 `NT$ rowCost` + `@unitPrice/unit（粗估）`）承擔。

**理由**：
- 既有欄位已呈現逐筆貢獻，不必另列卡片
- 右側 sticky 維持 `AddTaskCalcPanel`（拼版試算）不動，不擠壓垂直空間
- 頂部 5 欄摘要 + 表格內逐筆成本欄，使用者即可掌握整體與逐筆雙層資訊

### D3 — 工單資訊容器改 `ErpDetailCard` + `ErpInfoTable`

**決定**：
- 外層容器（現手寫 `bg-white border border-[#e3e4e5] rounded-xl p-5`）→ `ErpDetailCard title="工單資訊" icon={Info}`
- Key-value 列表（現手寫 `grid grid-cols-[120px_1fr]`）→ `ErpInfoTable` 資料：`[{ label: '工單編號', value: ... }, ...]`

**理由**：
- 與工單詳情頁 / 訂單詳情頁視覺完全一致，使用者心智模型不切換
- `ErpDetailCard` 自帶 Info icon header，符合 DESIGN.md §3.2「分段容器」要求

**替代方案**：
- 維持手寫：否決原因 = 違反 DESIGN.md §1.4「優先 Erp*」與 §3.3「分段容器必用」

### D4 — 三分類 Tab 容器改 `ErpDetailCard`，內部 shadcn Tabs 不動

**決定**：
- 外層手寫 `<div className="bg-white border rounded-xl">` → `ErpDetailCard`（無 title / 無 Info icon，或 title="生產任務" 含三個分類）
- shadcn Tabs + CategorySection 結構不動（Tab 三色 badge 留 P2 處理）

**理由**：
- `ErpDetailCard` 支援 `headerClassName` 或無 header 模式（需確認 ErpDetailCard API）
- 若 ErpDetailCard 不支援無 title，退而求其次使用 `Card`（shadcn）或保留手寫 `<div>` 但改為 `bg-card border-border`

**待確認**：`ErpDetailCard` 是否支援「Tab bar 當 header」的組合模式；若不支援，本次維持手寫容器但 class 改 tokenize（不降級為 hex），未來新增 `ErpTabsCard` 變體。

### D5 — 表格套 `.erp-table` class

**決定**：三個 `MaterialSection / ProcessSection / BindingSection` 內的 `<table>` 加 `className="erp-table"`（DESIGN.md §1.5 專用 class）。

**理由**：
- `.erp-table` 已定義表格主結構（border / hover / header 樣式），與全站列表頁一致
- 不用 `ErpTableCard`（那是「工具列 + 表格 + 分頁」整包容器，不適合本頁「容器內嵌表格」的結構）

**風險**：
- 當前表格有 `tableLayout: 'fixed'` / `colgroup` / `sticky header` 等自訂行為，套 `.erp-table` 可能與既有樣式衝突 → 驗收時檢查欄寬 / 捲動 / sticky header 是否正常

### D6 — Hex → design token 範圍

**決定**：本 change 處理頁面外殼 / 容器 / key-value label / 分隔線等**非 category 色**的 hex：
- `#e3e4e5` → `border-border`
- `#232324` → `text-foreground`
- `#636466` → `text-muted-foreground`
- `#f7f7f7` → `bg-muted`
- `bg-white` → `bg-card`（容器）或 `bg-background`（頁面層）

**不動**（P2 範疇）：
- 印件名稱 badge 的 `bg-[#f1fde8] text-[#3c9d13]`（成功色，需決定用 shadcn emerald 還是新 token）
- Tab 三色 badge（amber/blue/green，需決定是否新增 category token）

### D7 — 成本計算邏輯擴充為 5 項獨立小計

**決定**：現有 `AddProductionTasks.tsx` 的 `costSummary` useMemo 擴充為回傳 `{ material, process, binding, setupFee, colorCost }` 5 欄物件，供 `ErpSummaryGrid` 使用。

**實作細節**：
- `material` / `process` / `binding` = 對應 rows 的 `unitPrice × qty` 加總
- `setupFee` = **所有** row（含三分類）的設備開機費加總 = `allRows.reduce((sum, r) => sum + calculateSetupFee(mockEquipmentList.find(e => e.name === r.equipment)), 0)`
  - 理論上只有工序 row 會選設備（材料已拿掉設備欄、裝訂視情況），但計算採 row 實際 `equipment` 欄為準
- `colorCost` = 所有工序 row（`bomType === 'process'`）的色數加價加總 = `processRows.reduce((sum, r) => sum + calculateColorCost(eq, colorSpec, ptTargetQty), 0)`
  - 與 `handleSave` 組 ProductionTask 時的 `estimatedColorCost` 算法一致（保險：複用 `calculateColorCost` util）

**理由**：
- 5 欄呈現各項獨立，符合 Miles「使用者關注各項構成」的需求
- `calculateSetupFee` / `calculateColorCost` 既有 util，直接複用（材料與裝訂若無設備則 setupFee=0；材料與裝訂 bomType 非 process 則 colorCost=0）

### D8 — ~~延後考慮：成本是否含開機費 / 色數加價~~（已決定）

**決定**：5 欄摘要**分項獨立呈現**設備費（開機費）與色數加價，不再合併進分類小計，避免「材料 vs 工序」不對等比較。

**語意確認**：
- 「材料小計」= 材料 rows 的 unitPrice × qty，不含設備費
- 「工序小計」= 工序 rows 的 unitPrice × qty，不含設備費與色數加價
- 「裝訂小計」= 裝訂 rows 的 unitPrice × qty
- 「設備費」= 所有 rows 的 setupFee 加總（獨立欄）
- 「色數加價」= 工序 rows 的 colorCost 加總（獨立欄）

## Risks / Trade-offs

- **`ErpDetailCard` 對 Tab 容器的適配性不明** → 實作時先試直接套，若發現 header 與 Tab bar 衝突，退回手寫 `<div>` 但改用 token（不降級為 hex）；必要時新建 `ErpTabsCard` 變體留 P2 處理
- **`.erp-table` class 可能與既有 table 自訂行為衝突** → 驗收時逐一檢查欄寬 / 捲動 / sticky header；若衝突，保留現有 inline style，只改 `<th>` / `<td>` 的 hover / border class
- **右側成本明細實作複雜度** → 若本輪範圍過大，D2 排 P2；P1 只做 D1（頂部摘要）讓使用者先看到改善
- **開機費 / 色數加價是否納入總計** → 本 change 預設不納入，若 Miles 要求納入需增加計算複雜度（D8）
- **trade-off**：放棄「把整個表格改 ErpTableCard + cell input 全換 Erp atom」一次做完，換來的是 P1 視覺快速見效 + P2 atom 層可獨立迭代，代價是短期表格內 input 視覺與 panel 不完全一致

## Migration Plan

- 本變更僅影響 Prototype 前端，無資料遷移、無 schema 變動、無 API 改動
- 部署流程：push 至 `sens-erp-prototype` main → Lovable 自動同步 → 瀏覽器驗證
- 回滾策略：git revert commit；由於 `DraftRow` 與 `handleSave` 不動，既有資料與 store 行為零影響

## Open Questions

- ~~Q1~~：已決議 — 5 欄分項：`設備費 / 材料 / 工序 / 裝訂 / 色數加價`，不另列總計
- ~~Q2~~：已決議 — 右側成本明細本次不做，逐筆明細由 table 既有「預估成本」欄承擔
- **Q3（D4 相關）**：`ErpDetailCard` 是否支援「Tab bar 當 header」的組合？實作時先試，若發現不支援，接受當前手寫容器但改用 token（暫緩整合為 Organism 元件，由 P2 或後續 change 新建 `ErpTabsCard`）
