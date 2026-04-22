## ADDED Requirements

### Requirement: Category 色與 Success 色使用 design token

所有涉及 category 分類視覺（材料 / 工序 / 裝訂）與 success 成功色（印件名稱 badge）的頁面與元件，SHALL 使用 design token 取得顏色值，SHALL NOT 寫死 Tailwind 色盤（`amber-500` / `blue-500` / `green-500` 等）或 hex（`#f1fde8` / `#defacd` / `#3c9d13` 等）。

**Category token 規範**：
- `bg-category-{material|process|binding}-bg`（badge / section 底色）
- `border-category-{material|process|binding}-border`（badge / section 邊框）
- `text-category-{material|process|binding}-text`（badge / section 文字色）
- `border-category-{material|process|binding}-active`（Tab active 底線色）

**Success token 規範**：
- `bg-success-bg`（badge 底色）
- `border-success-border`（badge 邊框）
- `text-success`（文字色）
- `text-success-foreground`（success 為底色時的前景色）

#### Scenario: 三分類 Tab 使用 category token

- **WHEN** 使用者進入新增生產任務頁或工單詳情頁生產任務展開
- **THEN** 三分類 Tab（材料 / 工序 / 裝訂）active 狀態的底線 color SHALL 由 `border-category-{name}-active` token 提供
- **AND** 頁面程式碼 SHALL NOT 出現 `data-[state=active]:border-amber-500` / `-blue-500` / `-green-500` 寫法

#### Scenario: 印件名稱 badge 使用 success token

- **WHEN** 頁面顯示印件名稱 badge（綠底 + 綠框 + 綠字）
- **THEN** badge SHALL 使用 `bg-success-bg border-success-border text-success` class
- **AND** 頁面程式碼 SHALL NOT 出現 `bg-[#f1fde8] border-[#defacd] text-[#3c9d13]` 寫死 hex
