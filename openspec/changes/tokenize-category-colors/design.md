## Context

P2 累積待辦的最後一項（色盤 tokenize）。現況：

**寫死 Tailwind 色盤（category 三色）**：
- `AddProductionTasks.tsx` `CATEGORY_STYLES`（line 40-43）: `amber-50 / blue-50 / green-50` + `-100` border + `-700` text
- `AddProductionTasks.tsx` Tab triggers（line 306/309/312）: `data-[state=active]:border-amber-500` / `-blue-500` / `-green-500`
- `WorkOrderDetail.tsx` 巢狀 Tab（line 1064/1067/1070）: 同上三色 active border

**寫死 hex（印件名稱 badge）**：
- 4 個檔案都用 `bg-[#f1fde8] border-[#defacd] text-[#3c9d13]`

既有 token：
- `index.css:50` 有 `--color-neutral-*` 原色、`--color-success: #3c9d13` 但未全面暴露（缺 bg / border slots）
- `tailwind.config.ts` 有 `border / input / ring / foreground / primary / secondary / muted / accent / destructive / popover / card`，**無 success / category**

限制：
- 桌機瀏覽器專用
- 不本地 build，所有 UI 驗證透過 Lovable
- Prototype 技術棧 React + TS + Tailwind + shadcn/ui

## Goals / Non-Goals

**Goals:**
- 建立 category 三色 + success 色 design token，讓 Tailwind class 直接可用（`bg-category-material-bg` 等）
- 遷移 4 個檔案的印件名稱 badge + 2 個檔案的 category Tab 三色
- 視覺 pixel-level 一致（HSL 值對應原 Tailwind amber/blue/green/emerald）
- DESIGN.md §1.2 / §4.1 同步更新

**Non-Goals:**
- 其他語意色（warning amber / info blue / error red）tokenize — 不屬 category 或 success 語意，另開 change 處理
- 業務狀態 badge（交付 blue / QC 通過 green / 警告 amber）tokenize — 屬狀態色系，與 category 分類色不同，另開
- 色數子行 blue chip tokenize — 屬 accent 色，不是 category
- 其他頁面用 `bg-emerald-50`（Tailwind scale）但非印件名稱 badge 的使用點 — 不強制遷移
- Token 值調整（調整 HSL 值或新增色階）— 本 change 只「鏡像」現有 Tailwind 色

## Decisions

### D1 — Token 命名：`category.<name>.<slot>` 巢狀結構

**決定**：Tailwind config `colors.category` 用 3 層巢狀：

```ts
category: {
  material: {
    bg: 'hsl(var(--category-material-bg))',
    border: 'hsl(var(--category-material-border))',
    text: 'hsl(var(--category-material-text))',
    active: 'hsl(var(--category-material-active))',
  },
  process: { /* 同上 */ },
  binding: { /* 同上 */ },
},
```

**Class 形式**：`bg-category-material-bg` / `border-category-material-active` / `text-category-process-text`

**替代方案**：
- **扁平 `--category-material-bg-50`**：否決原因 = 50/100/700 對應的「語意用途」不固定（bg=50、border=100、text=700），讓 slot 名反映用途更直覺
- **單 token 配 opacity**：否決原因 = CSS opacity 配色會讓 border 跟 bg 分不開層次
- **不動 Tab active color，只 tokenize bg/border/text**：否決原因 = Tab active border 是最明顯的 category 視覺標記，若不 tokenize 等於漏掉核心

### D2 — Success token 擴充為 4 個 slots

**決定**：`index.css` 既有 `--color-success: #3c9d13` 只是 hex，改為 HSL 並擴充為 4 個 slots：

```css
--success: 92 77% 34%;            /* #3c9d13，文字色 / border 底線 */
--success-foreground: 0 0% 100%;  /* 白字，用於 success 為底色時 */
--success-bg: 89 85% 95%;         /* #f1fde8，badge 底色 */
--success-border: 92 73% 84%;     /* #defacd，badge 邊框 */
```

**Tailwind config**：
```ts
success: {
  DEFAULT: 'hsl(var(--success))',
  foreground: 'hsl(var(--success-foreground))',
  bg: 'hsl(var(--success-bg))',
  border: 'hsl(var(--success-border))',
},
```

**Class 形式**：`bg-success-bg` / `border-success-border` / `text-success`

**保留既有 `--color-success`**：`index.css` 內既有 `color: #3c9d13` 用 `--color-success` 的地方暫不動（等有需要再統一清）；新 `--success` 是獨立 HSL token 給 Tailwind class 用。

### D3 — HSL 值對應 Tailwind 原色（視覺 pixel-level 一致）

**決定**：Token HSL 值**精確對應** Tailwind 原色，確保遷移後視覺無變化。

**對應表**：

| Token | Tailwind 原色 | HSL |
|-------|-------------|-----|
| `--category-material-bg` | amber-50 | `48 100% 96%` |
| `--category-material-border` | amber-200 | `48 97% 77%` |
| `--category-material-text` | amber-700 | `26 90% 37%` |
| `--category-material-active` | amber-500 | `38 92% 50%` |
| `--category-process-bg` | blue-50 | `214 100% 97%` |
| `--category-process-border` | blue-200 | `213 97% 87%` |
| `--category-process-text` | blue-700 | `224 76% 48%` |
| `--category-process-active` | blue-500 | `217 91% 60%` |
| `--category-binding-bg` | green-50 | `138 76% 97%` |
| `--category-binding-border` | green-200 | `141 79% 85%` |
| `--category-binding-text` | green-700 | `142 72% 29%` |
| `--category-binding-active` | green-500 | `142 71% 45%` |

**注意**：原 `CATEGORY_STYLES` 用的是 `border-amber-100`（略淺），但大多頁面 badge 用 border `-200`，為一致性本 change 統一用 `-200` 級。若 Miles 覺得太深再調。

**印件名稱 badge**：原寫死 `#f1fde8 / #defacd / #3c9d13` 實際是 emerald 系（不完全匹配 Tailwind 默認 emerald-50 / emerald-200 / emerald-700）→ token HSL 保留原值（不改為 emerald 預設）。

### D4 — Tab active border 用 `data-[state=active]:border-category-<name>-active`

**決定**：遷移三分類 Tab 的 active border class：
```tsx
// Before
<TabsTrigger className="data-[state=active]:border-amber-500 ...">

// After
<TabsTrigger className="data-[state=active]:border-category-material-active ...">
```

**理由**：
- Tailwind JIT 支援 arbitrary variant（`data-[state=active]:`）配 token color
- 保持相同視覺（color 值不變，只是取用路徑從 Tailwind 色盤 → CSS token）

**驗證**：實作後 DevTools 檢查 border color 仍為 `rgb(245 158 11)` 等（amber-500），若不符表 token 值寫錯。

### D5 — 套用範圍：4 個檔案 + 2 個 Tab 組

**決定**：本 change 實際遷移 5 個檔案（依 grep 結果）：

| 檔案 | 遷移點 |
|------|------|
| `AddProductionTasks.tsx` | `CATEGORY_STYLES` 常數 + 3 個 Tab trigger + 印件名稱 badge |
| `WorkOrderDetail.tsx` | 巢狀 Tab 3 個 trigger（line 1064-1070） |
| `QuoteDetailPage.tsx` | 印件名稱 badge（grep 找到） |
| `AddTaskCalcPanel.tsx` | 印件名稱 badge（grep 找到） |
| `index.css` | 可能有 `#3c9d13` 相關樣式（若涉及印件名稱 badge 的 CSS 定義） |

**不動**：
- 其他含 emerald 的頁面（`OrderDetail`, `EditPrintItemPanel` 等）若用的是 `bg-emerald-50`（Tailwind scale）而非 `#f1fde8`（hex），不屬本 change 範疇，另議

## Risks / Trade-offs

- **HSL 值計算誤差**：token HSL 若未精確對應 Tailwind 原色，遷移後視覺 1-2 度色差 → 實作時用 DevTools color picker 驗證，或直接引用 Tailwind 官方 HSL（https://tailwindcss.com/docs/customizing-colors）
- **Tailwind arbitrary variant + 自訂 token 相容性**：`data-[state=active]:border-category-material-active` 需 JIT 掃描到 class → tailwind.config.ts 的 `content` 路徑必須涵蓋所有使用檔案（預設已包含 src/**/*.tsx）
- **巢狀 token 的 class 拆分**：`category.material.bg` 在 Tailwind config 中的巢狀 `colors` 會生成 `category-material-bg` class（Tailwind 拉平巢狀結構）— 已是標準行為，無風險
- **原 `border-amber-100` vs 新 `border-category-material-border`（對應 -200）視覺略深**：若 Miles 覺得深了，調 `--category-*-border` HSL 為 `-100` 值

## Migration Plan

- 本變更僅影響 Prototype 前端，無資料遷移、無 schema 變動
- 部署流程：push 至 `sens-erp-prototype` main → Lovable 自動同步 → 瀏覽器驗證
- 回滾策略：git revert commit；token 是純加法，原 Tailwind class 仍可用

## Open Questions

- **Q1**：`CATEGORY_STYLES` 的 border 原用 `-100`（淺），新 token 對應 `-200`（稍深）— 是否接受略深的視覺？若要一致，新 token 用 `-100` 值。本 change 預設用 `-200`（與其他 badge 對齊），實作驗收時若視覺差異明顯可切換
- **Q2**：index.css 既有的 `--color-success: #3c9d13` 與本次新增的 `--success` HSL 格式並存，日後是否要統一？留為後續 cleanup，不納入本 change
