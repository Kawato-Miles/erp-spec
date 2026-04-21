## Context

`ErpSummaryGrid` 是 Prototype 共用的「欄位摘要水平格線」元件，用於詳情頁呈現多欄位 key-value 摘要（例如工單詳情的目標 / 生產 / 入庫數量、印件詳情的進度、審稿主管面板的 KPI 指標）。元件支援 `hint` 欄位，於 label 右側顯示 Info icon + hover 顯示 Tooltip，用於說明 ERP 場景中定義複雜或同名異義的欄位（例：審稿 KPI 中「不合格率」分母排除技術退件）。

**當前實作根因**（[ErpSummaryGrid.tsx](../../../sens-erp-prototype/src/components/layout/ErpSummaryGrid.tsx)）：

1. 根層 container：`border border-border rounded-lg overflow-hidden grid grid-cols-{n}`
2. 每 cell 分兩區：
   - label 區：`shrink-0 bg-muted/40 border-r px-4 py-2 flex items-center gap-1` + `style={{ width: labelWidth }}`（預設 104px）
   - label 文字：`text-sm whitespace-nowrap`
   - Info icon：條件渲染於 label 文字右側
   - value 區：`flex-1 px-4 py-2`

**症狀**：

- 審稿主管 KPI 面板 7 項指標中，最長 label「補件 loop 平均輪數」（10 字，約 130-140px）> labelWidth（104px）
- `shrink-0` + `whitespace-nowrap` → label 區不縮、文字不換 → Info icon 被推出可見區
- 根層 `overflow-hidden` → 被擠出的 icon 直接不可見
- 即使 icon 偶然落在可見區內，Radix Tooltip popover 上下文也受 `overflow-hidden` 影響（Tooltip 預設用 Portal，但若 content 寬度超過 grid cell 仍可能被 parent 裁切邊界遮住）

**使用點調查**（Grep `ErpSummaryGrid` 於 `sens-erp-prototype/src`）：此元件廣泛用於詳情頁；任何帶長中文 label + `hint` 的使用場景都會觸發此 bug，不僅限於審稿面板。

## Goals / Non-Goals

**Goals：**

- 修正 `ErpSummaryGrid` 跑版：Info icon 在任意 label 長度下都可見；Tooltip hover 後可完整顯示不被切
- 修正範圍限定於共用元件，不動用處代碼（SupervisorDashboard 等不需改 `labelWidth`）
- 保持對外 API 相容（`items` / `cols` / `hint` / `labelWidth` / `className` 欄位含義不變）
- 既有所有使用點視覺無回歸（特別是已知使用處：KPI 面板、WorkOrderDetail 整體進度、印件詳情進度等）

**Non-Goals：**

- **不改變 hint 呈現模式**：仍為 icon + Tooltip，不轉為副標／常駐顯示（此為 senior-pm 建議的 PM 層決策，列為 [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 待主管確認）
- **不重構 KPI 指標**：L1 / L2 分層、可攔截退件量化均在 PI-010 追蹤
- **不動退件原因 Top N 圖表**：同上 PI-010
- **不新增 `ErpSummaryGrid` 功能**：不加副標模式、不加 disclosure、不加分類色階

## Decisions

### D1：label 區寬度策略 — 改為「統一計算最寬 label」

**選項**：
- A. 預設 `labelWidth='auto'`，每 cell label 區 `width: auto` + `min-width: 104px`（各 cell 獨立撐開）
- B. 預設「掃描本 grid 所有 `items[].label` 估算最寬值 + Info icon 區 + padding，套用統一寬度給所有 cell」
- C. 保留固定 104px，使用處覆寫（治標、不解全站問題）

**決策**：採 **B**。

**理由（含 A 的放棄過程）**：
- 初期採 A（commit 9c8a696）發現 Lovable 驗證時 Miles 回報「KPI 欄位寬度不一」：因為各 cell 按自身 label 撐開，同列分界線不齊，視覺很亂
- 改採 B：計算本 grid 所有 items 中最長 label 的估算文字寬度（全形 CJK 14px、半形 ASCII 7px），加上 Info icon 區（若任一 item 有 hint 則 +18px）+ padding（32px），取最大與 104 的較大者，所有 label 區套用此統一寬度
- B 同時滿足：Info icon 不擠出（寬度夠）、同列分界線對齊（所有 label 等寬）、短 label 仍對齊（最小 104）
- C 治標不治本，不符合「確保後續用到此 Info 區塊時都正常」的指示
- 不採 ref-based post-layout 測量（DOM measure）：對純 layout 需求過度工程，且 SSR / initial render flash 風險高

**相容性**：原 `labelWidth?: number` API 保留，可傳數字強制固定寬；預設改為 `'auto'` 走統一計算策略。

**估算精度權衡**：
- 中英文字寬靠 charCode < 128 判斷，精度夠用於中文 ERP 場景
- 混用字串會稍微高估（過寬 10-30px 視情況），trade-off 偏向「略寬 > 跑版」
- 不涵蓋粗體、特殊字型等情境（目前元件使用點無此需求）

### D2：`whitespace-nowrap` 保留位置

**決策**：label 文字 `whitespace-nowrap` **保留**；讓 label 區 `width: auto` 吸收撐開需求。

**理由**：
- 短 label 不需換行，`whitespace-nowrap` 維持視覺一致
- D1 已解除「固定寬 + nowrap」的衝突，nowrap 本身不再是問題

**例外**：若未來有超長 label（>20 字），可評估 `max-width` + 換行策略；本 change 不涉及。

### D3：`overflow-hidden` 與 Tooltip Portal

**根因**：根層 `overflow-hidden` 原意是讓 `rounded-lg` 邊角乾淨裁切（避免 cell border 突出），但同時影響內部 Tooltip 的 popover 邊界計算。

**選項**：
- A. 根層 `overflow-hidden` 改為 `overflow-visible`；cell 自行 `rounded-lg` + 調整 border
- B. 保留 `overflow-hidden`，改用 Radix Tooltip 的 Portal（`<TooltipPortal>`）讓 popover render 到 body 層，繞過 overflow 裁切
- C. 混合：根層 `overflow-hidden` 保留，Tooltip 全面改用 Portal

**決策**：採 **B**（最小改動 + 高兼容）。

**理由**：
- B 不動 layout 結構，rounded 邊角視覺完全保持；僅在 Tooltip 內部加 Portal
- A 會觸發 border-radius 重算，cell border 需大量調整以維持視覺
- shadcn/ui 的 Tooltip 本就支援 Portal pattern；Radix Tooltip `Content` 已內建 Portal 行為（[shadcn/ui tooltip](https://ui.shadcn.com/docs/components/tooltip) 預設 Portal 化），需驗證是否已啟用
- 實作時需檢查專案的 `tooltip.tsx` 是否已套 Portal；若未套則於 `ErpSummaryGrid` 使用處明確用 `TooltipPortal`

**驗證方式**：
- 推 Lovable 後 hover 任一 Info icon 確認 Tooltip 完整顯示不被切
- 切換視窗寬度測試 Tooltip 位置自動翻轉

### D4：`shrink-0` 保留

**決策**：label 區保留 `shrink-0`。

**理由**：
- `shrink-0` 的作用是「value 區搶佔不到 label 區寬度」，在 D1 的 auto-width 下仍需保留（避免 value 內容過長擠壓 label）
- 與 D1 不衝突：label 以內容為準撐開；確定寬度後 flex container 不再收縮

### D5：驗證覆蓋面

**決策**：本 change 不逐一枚舉使用點，但 apply 階段須推 Lovable 後逐一檢視下列已知使用處：

1. `SupervisorDashboard.tsx` KpiGrid（cols=4，7 項 hint）
2. `WorkOrderDetail.tsx` 整體進度摘要
3. `PrintItemDetail.tsx`（若有）整體進度摘要
4. 其他 `ErpSummaryGrid` 使用點（透過 Grep 找出）

**驗收標準**：所有 cols 變體（2 / 3 / 4）、所有 label 長度（短 2 字 ~ 長 10 字）下，版面無回歸。

## Risks / Trade-offs

- **[風險] label 寬度不一致導致欄位未對齊** → **緩解**：`min-width: 104px` 確保短 label 仍有基本寬度；若使用處需強制對齊，可傳入固定 `labelWidth` 覆寫預設
- **[風險] Tooltip Portal 未正確啟用導致仍被切** → **緩解**：apply 階段第一步檢視專案 `tooltip.tsx` Portal 設定，若未啟用明確加 `TooltipPortal` 包裹
- **[風險] WorkOrderDetail 等舊使用點因寬度改為 auto 而版面跳動** → **緩解**：Lovable 視覺驗證覆蓋所有已知使用處；若發現特定頁面需固定寬，改用處覆寫 `labelWidth={104}`（API 仍相容）
- **[Trade-off] 不採副標方案 = hint 仍藏在 Tooltip 裡** → **暫時接受**：依 Miles 指示純修跑版、不改呈現模式；副標方案等 [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 主管回應後再評估

## Migration Plan

**部署**：
- 純前端共用元件修正，Prototype 無部署流程（merge 即生效於 Lovable）
- 無 backend / schema 變動

**rollback**：
- 單一 commit 復原即可
- 若影響某特定使用處，可在該處覆寫 `labelWidth` 數字保留舊行為

**使用者溝通**：無需通知（Prototype 內部）

## Open Questions

- 本 change 內無未解技術問題；呈現模式（tooltip vs 副標）的產品決策於 [PI-010](https://www.notion.so/3483886511fa819b96e1cb3b34108790) 另案處理
