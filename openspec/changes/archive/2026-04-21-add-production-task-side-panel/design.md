## Context

Prototype 的「新增生產任務」頁（`src/pages/AddProductionTasks.tsx`，974 行）當前以三個 Tab（材料 / 工序 / 裝訂）承載三分類的生產任務建立流程。每個 Tab 是一個 table，「新增一筆」按鈕 append 一個空 `DraftRow` 到 table state，使用者在 cell 內直接 inline 填寫；三分類欄位清單：

- 材料：群組 → 材料 → 規格 + 廠商 / 計價方式 / 製作細節 / 計價選擇 + 共用後段（數量 / 單位 / 設備 / 影響成品 / 開工日 / 工期 / 完工日 / 預估成本 / 刪除）= 16 欄
- 工序：群組 → 工序 + 共用後段 + 色數子行（正/背面色數、特殊色、開機費、色數加價、設備倍率摘要、2–3 色警告）= 15 欄 + 子行
- 裝訂：裝訂 + 共用後段 = 14 欄

儲存時 `handleSave`（line 102–207）依 `factory` 欄位分組，同廠商合併為同一 `Task`，`Task.name = factory`。

User Story：[US-WO-010 批次新增生產任務](https://www.notion.so/3313886511fa811a8493cff779df01d8)，`work-order` spec 對應 requirement「批次新增生產任務」([spec.md:287](../../specs/work-order/spec.md))。

限制：
- Prototype 技術棧 React + TS + Tailwind + shadcn/ui，桌機瀏覽器專用
- `ErpSidePanel` 已於前一 PR 完成（支援 size sm/md/lg/xl/full、footer slot、actions slot）
- 不本地 build，所有 UI 驗證透過 Lovable
- 核心計算 utility 已穩定：`bomMasterMock.ts` 的 BOM 解析 / pricing_selection、`equipmentCost.ts` 的開機費 / 色數加價

## Goals / Non-Goals

**Goals:**
- 把「新增」入口改為 side panel（`ErpSidePanel size="xl"` / 720px），分 section 垂直引導填寫
- 三分類各自獨立 panel（同元件依 `category` prop 條件渲染）
- 送出後 append 到 table，`handleSave` 分組邏輯完全沿用
- 抽出 `useColorCostDerived` hook，讓 panel 與 table `ContentRow` 共用色數計算規則，避免雙份維護
- 空狀態友善：初次進頁三 Tab 皆無 draft，顯示「點擊新增一筆開始填寫」；新增一筆後提示消失

**Non-Goals:**
- 「編輯」路徑仍保留 inline 編輯（table row 可直接改 cell），不改為 panel
- 不動 `DraftRow` 資料模型
- 不動 `handleSave` 的 factory 分組邏輯
- 不動 BOM / 計價 / 色數計算 utility
- 不觸及狀態機、商業流程、角色權責

## Decisions

### D1 — 只改「新增」入口，不改「編輯」路徑

**決定**：A1 範疇。panel 負責新增；既有 table inline 編輯保留不動。

**理由**：
- 範圍控制，降低回歸風險
- 新增是痛點最明顯處（使用者填空白列 14+ 欄）；編輯既有列時使用者已有上下文、一次只改少數 cell，inline 仍 OK
- 保留 table inline 可讓 panel 送出後的 row 仍能微調（如後悔 qty、補填設備），不強制重回 panel

**替代方案**：新增與編輯都走 panel（table 改為唯讀摘要）。否決原因：改動範圍大、且「重開 panel 才能改一個欄位」對熟手反是摩擦。

**風險**：混合模式可能造成「送出 panel 後又回 table 改 cell」的認知斷裂 → 列入驗收觀察，若高頻需回改則下一輪再議。

### D2 — 三分類各自獨立 panel，而非合併分類下拉

**決定**：B1。每個 Tab 的「新增一筆」按鈕在當前 Tab 打開對應 `category` 的 panel；同一個 `AddProductionTaskPanel` 元件依 `category` prop 條件渲染 BOM section。

**理由**：
- 三分類 BOM 階層差異大（材料三層 / 工序兩層 / 裝訂一層），合併時動態切換欄位反而增加認知負擔
- Tab 已分類了資料視覺，panel 行為對齊 Tab 更直覺
- 單一元件共用 footer、共用後段（數量 / 排程）、共用色數 section 條件，不會碎片化

**替代方案**：合併為單一 panel，第一欄選「分類」後切換下方欄位。否決原因：入口從 Tab 分流後又要在 panel 裡再選分類，流程冗餘。

### D3 — Panel 採 `size="xl"`（720px），不用 `full` / 不用 stepper

**決定**：`xl`，body `space-y-6` 分 6 section，必要處 `grid-cols-2`。

**理由**：
- 欄位數（~15）在 720px 寬度 + section 分組下可一屏略捲看完
- `full`（90vw）對「填一筆」情境過寬，反而散亂；`full` 適合批次表格（如工單異動抽屜）
- stepper 分步對單筆新增是 overkill，且使用者常需跨 section 比對（如數量與設備連動色數），stepper 切斷視線
- `lg`（600px）對「BOM 三層 + grid-cols-2 製作細節 / 排程」略緊

**替代方案**：`lg` 單欄、`full` 分欄、`xl` + stepper。皆否決，理由如上。

### D4 — 抽出 `useColorCostDerived` hook（僅 derive，不抽 UI）

**決定**：新建 `src/components/workorder/useColorCostDerived.ts`，封裝色數 derive 邏輯：`selectedEquipment` / `supportsColors` / `front` / `back` / `setupFee` / `colorCost` / `supportedSpecialColors` / `showTwoColorWarning` / `colorDisabled` / `colorDisabledReason` / `ptTargetQty`。panel 與 `ContentRow`（line 757）都引用此 hook；JSX 各自寫（table 版用 `<tr><td colSpan>`，panel 版用 `<div>`），因兩處 layout 差異大，共用 JSX 會硬湊。

**理由**：
- 色數規則複雜（開機費 + 色數加價 + 特殊色 + 設備倍率 + 2–3 色警告），雙份維護易漂移
- hook 只有 derive logic，無 JSX，介面小、風險低
- 同時是輕量 refactor，`ContentRow` 視覺與行為不變

**替代方案**：
- 完全不抽，panel 複製 ~30 行 derive + ~80 行 JSX：雙份維護成本高
- 抽共用 UI 元件 `ProcessColorControls`：兩處 layout 差異（table 子行 vs panel section）會讓元件充滿 `layout` branch，或強制 layout 統一；否決

### D5 — DraftRow state 由 panel 自管（local state），每次 open 重置

**決定**：`AddProductionTaskPanel` 內部 `useState<DraftRow>(emptyRow())`，`useEffect` 監聽 `open` 轉為 true 時重置；送出時呼叫 `onSubmit(row)` 交給 parent append。

**理由**：
- 符合「取消即丟棄」的使用者預期
- parent (AddProductionTasks) 不需為 panel 額外管一份 draft state，降低同步複雜度
- 連續新增兩筆時第二次 panel 自動清空

**替代方案**：parent controlled state。否決原因：parent 需管 `panelState` + `currentDraft` + three rows state，心智負擔大。

### D6 — 驗證策略：最小必填 + 失敗不擋提交但高亮

**決定**：必填欄位 = `catalogId`（BOM 最末層選擇）、`qty > 0`。其他（factory 若無 BOM 推導值、設備、排程、色數）可留空由 `handleSave` filter。驗證失敗時走 `showValidation` pattern（參 `EditPrintItemPanel.tsx:47`）：按鈕仍可按，但高亮未填欄位並顯示 inline error。

**理由**：
- `handleSave` 本就以 `r.catalogId && r.qty` 為 valid 條件（line 104）；panel 驗證對齊此規則
- 過嚴的「按鈕 disabled 直到全綠」在半結構化資料流程常惹怒熟手
- `showValidation` 保留表單內容（符合 ui-business-rules §6）

### D7 — 空狀態 UI：table 內一列置中提示

**決定**：當 `rows.length === 0`，`MaterialSection / ProcessSection / BindingSection` 的 `<tbody>` 渲染單一置中列「尚無資料，點擊右上『新增一筆』開始填寫」；header 仍顯示。

**理由**：
- 比「隱藏整個 table」更直覺（使用者看得到未來將有哪些欄位）
- 比「placeholder row」更不具迷惑性（不會誤以為已有一筆可填）

## Risks / Trade-offs

- **混合編輯模式的認知斷裂**：panel 新增後，使用者若要調整會回到 table inline 編輯 → 模式切換可能造成「咦，我剛在哪填的？」 → 驗收時觀察使用者實際 flow，若高頻回改則下一輪再議是否把編輯也遷入 panel
- **色數 hook 抽出後的回歸風險**：`ContentRow` 的色數 derive 重構為呼叫 hook，視覺行為理論上不變，但 useMemo / useEffect timing 可能微調 → 驗收清單含「既有 inline 編輯 regression test」（改舊列的色數 / 設備，確認 setupFee / colorCost 即時更新）
- **panel 內 `SearchableSelect` 的 dropdown 層級**：panel 已 portal 到 body，`SearchableSelect` 若也 portal，z-index 需確認不被 panel overlay 蓋住 → 實作時開 devtools 驗證
- **Tab 內按鈕點擊時機**：若三 Tab 共用同一個 `<AddProductionTaskPanel>` 實例（由頂層渲染，依 `panelState.category` 切換），切 Tab 時 panel 不應意外保留前一 tab 的 draft → 透過 `useEffect(open → reset)` 保證（D5）
- **數量欄位預設值**：原 `emptyRow()` qty='1'（line 71），panel 沿用；使用者可改為任意值但不可 0 / 負數 / 空
- **trade-off**：放棄「編輯也走 panel」換來的是實作範疇小、可快速驗證，代價是短期 UX 不一致；接受此 trade-off，列為下一輪觀察項

## Migration Plan

- 本變更僅影響 Prototype 前端，無資料遷移、無 schema 變動、無 API 改動
- 部署流程：push 至 `sens-erp-prototype` main → Lovable 自動同步 → 瀏覽器驗證
- 回滾策略：git revert commit；由於 `DraftRow` 與 `handleSave` 不動，既有資料（已儲存的 `WorkOrder.tasks`）與 store 行為零影響

## Open Questions

- **Q1（列入驗收觀察）**：混合編輯模式（panel 新增 + inline 編輯）是否造成使用者回改高頻？若是，下一輪是否將編輯路徑也遷入 panel？
- **Q2（實作時決定）**：panel 底部「預估成本摘要」是否只顯示本筆？還是也顯示「目前 table 累計預估成本」？建議只顯示本筆（parent header 已有累計），避免資訊重複
