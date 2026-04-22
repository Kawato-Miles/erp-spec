## 1. 新增 CSS variables（index.css）

- [x] 1.1 `src/index.css` `:root` 區塊新增 success token（4 slots）
  - `--success: 92 77% 34%` (#3c9d13)
  - `--success-foreground: 0 0% 100%`
  - `--success-bg: 89 85% 95%` (#f1fde8)
  - `--success-border: 92 73% 84%` (#defacd)
- [x] 1.2 `:root` 新增 category 三色 token（每色 4 slots，共 12 個 variables）
  - material（amber 系）：bg / border / text / active
  - process（blue 系）：同上
  - binding（green 系）：同上
  - HSL 值對應 Tailwind 原色的 50 / 200 / 700 / 500（見 design.md D3 對應表）
- [x] 1.3 保留既有 `--color-success: #3c9d13`（另用途，後續 cleanup 再議）

## 2. Tailwind config 暴露 token class

- [x] 2.1 `tailwind.config.ts` `theme.extend.colors` 新增 `success` object（DEFAULT / foreground / bg / border 4 slots，hsl(var(--success*))）
- [x] 2.2 `theme.extend.colors` 新增 `category` 3 個巢狀 object（material / process / binding，每個含 bg / border / text / active）
- [x] 2.3 `npx tsc --noEmit` 通過；開 DevTools 驗證新 class（`bg-success-bg` 等）可編譯為對應 CSS

## 3. 遷移 AddProductionTasks.tsx

- [x] 3.1 `CATEGORY_STYLES` 常數從寫死 `amber-50 border-amber-100 text-amber-700` 等改為 token class：
  - 材料：`{ bg: 'bg-category-material-bg', border: 'border-category-material-border', text: 'text-category-material-text', label: '材料' }`
  - 工序 / 裝訂同理
- [x] 3.2 Tab triggers 3 處：
  - 材料：`data-[state=active]:border-amber-500` → `data-[state=active]:border-category-material-active`
  - 工序 / 裝訂同理
- [x] 3.3 印件名稱 badge（line 235）：`bg-[#f1fde8] border border-[#defacd] text-[#3c9d13]` → `bg-success-bg border border-success-border text-success`
- [x] 3.4 `npx tsc --noEmit` 通過

## 4. 遷移 WorkOrderDetail.tsx

- [x] 4.1 巢狀 Tab triggers（line 1064 / 1067 / 1070）：
  - materials / processes / bindings 三個 `data-[state=active]:border-amber-500/-blue-500/-green-500` → `border-category-{name}-active`
- [x] 4.2 檢查本檔案是否有印件名稱 badge（`#f1fde8` / `#defacd` / `#3c9d13`）→ grep 若有則遷移
- [x] 4.3 `npx tsc --noEmit` 通過

## 5. 遷移其他檔案的印件名稱 badge

- [x] 5.1 `src/components/quote/QuoteDetailPage.tsx`：印件名稱 badge 遷移至 success token
- [x] 5.2 `src/components/workorder/AddTaskCalcPanel.tsx`：印件名稱 badge 遷移至 success token
- [x] 5.3 `src/index.css` 內若有用 `#3c9d13` / `#f1fde8` / `#defacd` 的 CSS（非 `--color-success` 定義本身）遷移至 CSS var
- [x] 5.4 其他頁面若 grep 到 `#f1fde8` 殘留：遷移或記錄為後續 cleanup
- [x] 5.5 `npx tsc --noEmit` 通過

## 6. DESIGN.md 更新

- [x] 6.1 §1.2 色彩 token 清單新增：
  - Success 組（bg / border / text / foreground）
  - Category 三色組（material / process / binding 各 bg / border / text / active）
- [x] 6.2 §4.1 禁止事項補註：「category 分類色（material / process / binding）SHALL 使用 `bg-category-{name}-{slot}` token，SHALL NOT 直接寫 `bg-amber-50` 等 Tailwind 色盤 class」

## 7. 驗收（Lovable 瀏覽器）

- [x] 7.1 AddProductionTasks 三個 Tab 的 active 底線色：材料 = amber、工序 = blue、裝訂 = green（視覺與遷移前一致）
- [x] 7.2 AddProductionTasks 印件名稱 badge 仍是淺綠底 + 綠字
- [x] 7.3 WorkOrderDetail 巢狀 Tab（生產任務展開內三色 Tab）active 底線色一致
- [x] 7.4 QuoteDetailPage 印件名稱 badge 視覺一致
- [x] 7.5 AddTaskCalcPanel 印件名稱 badge 視覺一致
- [x] 7.6 DevTools 抽查：各處 color 實際 RGB 值對應 Tailwind 原色（例如 `rgb(245 158 11)` = amber-500）
- [x] 7.7 DevTools 檢查：無殘留寫死 hex（`#f1fde8` / `#defacd` / `#3c9d13`）或 Tailwind category 色盤（`amber-50/100/200/500/700` 等）於本次遷移檔案

## 8. Commit + Push + Archive

- [x] 8.1 提交 Prototype 變更至 `sens-erp-prototype` main，push 觸發 Lovable 同步
- [x] 8.2 完成 7.x 驗收後，於 Sens repo 歸檔 change（`/opsx:archive tokenize-category-colors`）
