## Context

P2 累積待辦的第一項。上個 change（`refactor-add-production-tasks-page`）跳過 Task 4 `.erp-table` 套用，原因是 `.erp-table` 的 `td { padding: 16px; min-height: 52px }` 是列表頁純文字單元格規格，套進 `AddProductionTasks` 的表單列（cell 內嵌 input）會讓 row 高度從 28px 翻倍至 60px。

現況：
- **ErpInput / ErpTextarea / ErpSelect**（`src/components/shared/ErpFormField.tsx`）：統一 panel / form 場景，`h-8 rounded-sm text-sm`
- **`.erp-table`**（`src/index.css`）：統一列表頁表格，`td padding: 16px`，適合純文字 cell
- **`.erp-form-table`**：**不存在**，每個表單列頁都要自己 inline 寫 table class + INP / SEL 常數
- **`SearchableSelect`** 已有 `size: 'compact' | 'panel'` 兩個變體

這個 gap 必須補齊，才能讓**未來任何「表格 cell 內嵌 input」的場景（例如派工看板的批次設定、BOM 編輯、庫存盤點）** 都能直接用 Erp* atom，不用每頁手寫。

限制：
- 不改既有 `ErpInput default`（h-8）行為，避免影響現有 panel
- 不改 `.erp-table` 既有行為
- 桌機瀏覽器專用

## Goals / Non-Goals

**Goals:**
- 建立表格 cell 場景專用的 compact atom 變體與 CSS class，作為全站未來表單列頁面的共用基礎
- 消除 `AddProductionTasks` 的頁面層 INP / SEL 常數
- DESIGN.md §1.4 完整收錄新 atom / CSS class，未來 agent 讀規範可直接挑 compact 變體

**Non-Goals:**
- Tab 三色 badge / 印件名稱綠 badge 色盤 tokenize（另開 change）
- `ErpDetailTabs` atom 抽出（另開 change）
- 其他既有表格頁（WorkOrderList / OrderList 等列表頁）遷移（它們本就該用 `.erp-table`，與本 change 無關）
- `ErpTextarea compact` 變體（表格 cell 通常不放 textarea，不預先建立）

## Decisions

### D1 — Atom 變體用 `size` prop，不新建 `ErpCompactInput` 獨立元件

**決定**：`ErpInput` / `ErpSelect` 新增 `size?: 'default' | 'compact'` prop，`default` 保持現狀（h-8 / text-sm），`compact` = h-7 / px-1.5 / text-xs。

**理由**：
- atom 語意「同一個元件兩種尺寸」比「兩個獨立元件」更符合直覺（參考 shadcn Button 的 size variant）
- 型別 API 一致，遷移時只需加 `size="compact"` prop
- `SearchableSelect` 已用相同 pattern（`size: 'compact' | 'panel'`），兩者收斂一致

**替代方案**：
- 新建 `ErpCompactInput` 獨立元件：否決原因 = 分散 API、兩個元件同步維護成本高
- 用 CSS class 直接壓（`<ErpInput className="h-7 text-xs">`）：否決原因 = hard-coded 壓 class 違反「atom 層統一樣式」原則，每次都要記

### D2 — `.erp-form-table` 與 `.erp-table` 並存，不共用 CSS

**決定**：`src/index.css` 新增獨立 `.erp-form-table` class，不 extend `.erp-table`。兩者 header / border / hover 規格**視覺一致**，但 `td / th` padding 不同。

**規格對照**：

| 項目 | `.erp-table`（既有）| `.erp-form-table`（新）|
|------|-------------------|---------------------|
| `th` padding | 16px | 6px 8px |
| `th` font-size | 14px | 12px |
| `th` bg | `#f7f7f7` | `#f7f7f7` |
| `td` padding | 16px | 6px 8px |
| `td` min-height | 52px | 無 |
| `tr:hover` bg | `#fafafa` | `#fafafa` |
| border | `#f2f2f2` | `#f2f2f2` |
| border-collapse | separate | separate |

**理由**：
- 兩者目標使用者場景完全不同（純文字列表 vs 表單列），共用 CSS 反而增加 override 複雜度
- 視覺一致性（header / hover / border）透過 CSS 複製 3-4 行達成，成本低
- 既有 `.erp-table` 不動，風險隔離

**替代方案**：
- `.erp-table.compact` 複合 class：否決原因 = override pattern 讀起來不清楚
- 新增 `.erp-form-table` 並 `@apply` `.erp-table` 再 override：否決原因 = Tailwind `@apply` 對自訂 component class 支援度不穩，且會耦合

### D3 — `compact` 變體的 ChevronDown icon 尺寸

**決定**：`ErpSelect compact` 的 ChevronDown icon 從 default 的 `h-4 w-4` 縮為 `h-3 w-3`，`pr-8` 縮為 `pr-6`，`right-[8px]` 保留。

**理由**：
- compact 高度 h-7（28px），default 的 h-4 icon（16px）佔 57%，視覺擠
- h-3（12px）icon + pr-6（24px）空間留白合理

### D4 — 套用策略：一次性全改 AddProductionTasks

**決定**：本 change 一次把 `AddProductionTasks.tsx` 的所有 `<input className={INP}>` / `<select className={SEL}>` 改為 `<ErpInput size="compact">` / `<ErpSelect size="compact">`，同時移除頁面層 INP / SEL 常數。

**套用範圍**：
- `ContentRow` 的 9 個共用尾段 cells（數量 / 單位 / 設備 / 影響成品 / 開工日 / 工期 / 完工日 / 預估成本 / x）
- `MaterialRow / ProcessRow / BindingRow` 內的**製作細節** input（text input）
- `PricingSelectionCell` 的兩個 select
- 色數子行內的 `<input type="number">` 與設備 select — 看是否值得也改

**不改**：
- 色數子行的 chip 按鈕（已是 button，非 input）
- 色數 badge 顯示（純文字）

### D5 — `.erp-form-table` 套用範圍

**決定**：`MaterialSection / ProcessSection / BindingSection` 三個 `<table>` 加 `className="erp-form-table"`，移除原 inline 的 `<th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50 whitespace-nowrap">` class（由 CSS 定義）。

**風險驗證**：
- 原 th padding 是 `px-2 py-2`（8px 8px），新 CSS 是 `6px 8px` → 垂直縮 2px，視覺差極小
- 原 td padding 是 `px-2 py-1.5`（8px 6px），與新 CSS `6px 8px` 差 2px x 方向 → 可接受
- 原 sticky header（`sticky top-0 z-10`）保留 inline 或移至 CSS — 保留 inline，CSS 層不碰 sticky

## Risks / Trade-offs

- **CSS specificity 衝突**：`.erp-form-table td` 若遇到 inline `<td className="px-2">`，可能 inline 優先（Tailwind class specificity 相同，JIT 順序決定）→ 建議一律**移除 td 層的 padding class**，只保留非 padding 的 class（如 text-center、text-right）；若有殘留，實作時檢視 DevTools 確認
- **ErpInput compact 對 number input 的 type 相容性**：number input 可能在某些瀏覽器有預設 spinner，h-7 會太擠 → 驗收時檢查 qty 欄位的 +/- 按鈕是否正常
- **Sticky header 視覺**：新 CSS 未定義 sticky，保留 inline；未來若要統一，擴充 `.erp-form-table thead.sticky` variant
- **回歸風險**：改動頁面層數十個 input/select，可能漏改 placeholder / disabled 狀態 → 驗收時逐 cell 類型檢查

## Migration Plan

- 本變更僅影響 Prototype 前端，無資料遷移、無 schema 變動
- 部署流程：push 至 `sens-erp-prototype` main → Lovable 自動同步 → 瀏覽器驗證
- 回滾策略：git revert commit；atom 與 CSS 是純加法，不影響既有頁面

## Open Questions

- **Q1**：色數子行（`<tr>` 內的 `<input type="number">` 與手動樣式的 pill button）是否一併改為 compact atom？本 change 預設**不改**（chip button 不屬 input 範疇；color count input 若改要統一，加子 task），若需要再延伸
- **Q2**：未來其他表單列頁（派工看板 / BOM 編輯 / 庫存盤點等）遷移到 `.erp-form-table` 是否各自開 change，或以後有類似需求時順手改？建議**各自開 change**，避免一次大範圍 regression
