## 1. ErpInput / ErpSelect compact 變體（atom）

- [x] 1.1 `src/components/shared/ErpFormField.tsx`：`ErpInput` 新增 `size?: 'default' | 'compact'` prop，default = `'default'`
  - `'default'` 維持現狀：`h-8 rounded-sm border bg-background px-[11px] py-1 text-sm text-foreground placeholder:text-muted-foreground`
  - `'compact'`：`h-7 rounded-sm border bg-background px-1.5 py-0.5 text-xs text-foreground placeholder:text-muted-foreground`
  - suffix 模式若需 compact 一併處理（可暫緩到實際用到再加）
- [x] 1.2 `ErpTextarea` 保持不變（表格 cell 不放 textarea，暫不新增 compact 變體）
- [x] 1.3 `ErpSelect` 新增 `size?: 'default' | 'compact'` prop
  - `'default'` 維持現狀：`h-8 rounded-sm border bg-background pl-[11px] pr-8 py-1 text-sm` + ChevronDown `h-4 w-4` @ `right-[8px]`
  - `'compact'`：`h-7 rounded-sm border bg-background pl-1.5 pr-6 py-0.5 text-xs` + ChevronDown `h-3 w-3` @ `right-[6px]`
- [x] 1.4 `npx tsc --noEmit` 通過
- [x] 1.5 既有使用處（AddProductionTaskPanel 等）皆無傳 `size` prop，仍走 default，行為不變

## 2. `.erp-form-table` CSS class

- [x] 2.1 `src/index.css` 新增 `.erp-form-table` class 於 `@layer components` 內（緊接 `.erp-table` 之後）
  - `.erp-form-table`：`width: 100%; border-collapse: separate; border-spacing: 0; color: var(--foreground-hsl); font-family: 'Noto Sans TC', sans-serif; font-size: 12px; line-height: 20px; letter-spacing: -0.1px;`
  - `.erp-form-table th`：`padding: 6px 8px; border-bottom: 1px solid var(--border-hsl); border-right: 1px solid var(--border-hsl); font-weight: 500; font-size: 12px; text-align: left; color: var(--muted-foreground-hsl); background: var(--muted-hsl); white-space: nowrap;`（注意：實際 index.css 的 tokens 可能是 hex 寫法，複製 `.erp-table` 的 hex 引用風格一致）
  - `.erp-form-table th:last-child { border-right: none; }`
  - `.erp-form-table td`：`padding: 6px 8px; border-bottom: 1px solid #f2f2f2; border-right: 1px solid #f2f2f2; vertical-align: middle;`
  - `.erp-form-table td:last-child { border-right: none; }`
  - `.erp-form-table thead tr { background: #f7f7f7; }`
  - `.erp-form-table tbody tr:last-child td { border-bottom: none; }`
  - `.erp-form-table tbody tr { transition: background-color 0.15s; }`
  - `.erp-form-table tbody tr:hover { background: #fafafa; }`
- [x] 2.2 驗證 `.erp-form-table` 與既有 `.erp-table` 並存不衝突
- [x] 2.3 `npx tsc --noEmit` 通過（CSS 不需要 tsc，但跑一遍確保 app 沒壞）

## 3. 套用至 AddProductionTasks

- [x] 3.1 移除 `src/pages/AddProductionTasks.tsx` 頁面層 `const INP = '...'` / `const SEL = '...'` 常數
- [x] 3.2 import `ErpInput` / `ErpSelect` from `@/components/shared/ErpFormField`（若尚未 import）
- [x] 3.3 `MaterialSection / ProcessSection / BindingSection` 三個 `<table>` 加 `className="erp-form-table"`（保留既有 inline `style={{ tableLayout: 'fixed', width: '100%', minWidth: N, borderCollapse: 'collapse' }}`；注意 borderCollapse 是 CSS 的 `separate` vs inline `collapse` 衝突 → inline 移除 borderCollapse）
- [x] 3.4 移除三個 `<thead>` 內 `<th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50 whitespace-nowrap">` 的完整 class，只保留 `<th>{h}</th>`（class 由 CSS 提供）
- [x] 3.5 `ContentRow` 的 9 個尾段 cells 內的 `<input>` / `<select>` 改為 `ErpInput size="compact"` / `ErpSelect size="compact"`
  - 數量 `<input type="number">` → `<ErpInput size="compact" type="number" min={1} ...>`
  - 單位 `<input>` → `<ErpInput size="compact" ...>`
  - 設備 `<select>` → `<ErpSelect size="compact" ...>`
  - 影響成品 `<input type="checkbox">` → 保留原生（shadcn Checkbox 要遷可另開）
  - 開工日 `<input type="date">` → `<ErpInput size="compact" type="date" ...>`
  - 工期 `<input type="number">` → `<ErpInput size="compact" type="number" ...>`
  - 完工日 `<input type="date">` → `<ErpInput size="compact" type="date" ...>`
- [x] 3.6 `MaterialRow / ProcessRow / BindingRow` 的製作細節 `<input>` → `<ErpInput size="compact" ...>`
- [x] 3.7 `PricingSelectionCell` 的兩個 `<select>` → `<ErpSelect size="compact" ...>`
- [x] 3.8 色數子行（`showColorControls` 區塊）內的 `<input type="number">`（正 / 背面色數）→ `<ErpInput size="compact" type="number" ...>`
  - 注意現有色數 input 有自製 className（`h-6 w-12 rounded border ...`），改為 ErpInput compact 後可能高度不一（h-6 vs h-7）→ 決定：優先 atom 統一（h-7），若視覺擠再調
- [x] 3.9 `npx tsc --noEmit` 通過

## 4. DESIGN.md §1.4 更新

- [x] 4.1 `sens-erp-prototype/DESIGN.md` §1.4.1 Atom 層：`ErpInput` / `ErpSelect` 說明加註「支援 `size: 'default' | 'compact'` 變體，compact 適用表格 cell」
- [x] 4.2 §1.5 專用 CSS class：新增 `.erp-form-table` 條目（「表單列場景表格，header 灰底 / border / hover 與 `.erp-table` 一致，padding 密集 `6px 8px`」）
- [x] 4.3 §1.4.4 使用情境決策樹：補「列表頁表格 cell」的完整規格（改為：容器 `ErpTableCard` + 表格 class `.erp-form-table` + atom `ErpInput compact` / `ErpSelect compact`）

## 5. 驗收（Lovable 瀏覽器）

- [ ] 5.1 三分類表格 header 灰底 / border 樣式一致
- [ ] 5.2 表格 hover 有淺灰底色（與列表頁同）
- [ ] 5.3 每個 cell 內 input/select 高度 28px、字 12px，視覺密集且邊框齊整
- [ ] 5.4 sticky header（`sticky top-0 z-10` 保留 inline）滾動時正常吸頂
- [ ] 5.5 color count input（色數子行）視覺正常，不過擠
- [ ] 5.6 既有 panel（新增生產任務 side panel）內 input 視覺維持 h-8 / text-sm，不受影響
- [ ] 5.7 DevTools 檢查頁面無殘留 `h-7 border-input text-xs` inline class 模仿 compact 樣式

## 6. Commit + Push

- [x] 6.1 提交 Prototype 變更至 `sens-erp-prototype` main，push 觸發 Lovable 同步
- [ ] 6.2 完成 5.x 驗收後於 Sens repo 歸檔 change（`/opsx:archive add-table-form-atoms`）
