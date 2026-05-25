## MODIFIED Requirements

### Requirement: 印件詳情 Side Panel（PrintItemDetailSidePanel）

訂單詳情頁印件清單表格的「檢視」按鈕點擊 SHALL 開啟右側 Side Panel（PrintItemDetailSidePanel），承載印件單筆深入檢視內容。

**容器規格**：
- 採用 ErpSidePanel 元件
- size = `xl`（720px，apply 階段對齊 Figma 從 lg 升為 xl，承載 7 欄審稿紀錄表格無溢出）
- direction = `right`

**Header**：
- 印件名稱
- PrintItemTypeLabel（沿用 add-after-sales-ticket / refine-after-sales-refund 既有共用元件）
- 印件狀態 Badge
- 「開啟完整詳情頁」link（點擊 navigate 至 `/print-items/<id>` 印件完整詳情頁）

**Body**（四區塊垂直排列、各 section 採「H3 標題 + 內容」結構、無 ErpDetailCard 外框；apply 階段重做對齊 Figma node-id `8977:269607`）：

1. **印件資訊區塊**：採兩個 `ErpInfoTable` 直接 inline 寫，**不**透過 PrintItemSpecCard。
   - 上半 `<ErpInfoTable items>` 3 行單欄：訂單編號（link 至 /orders/<id>）/ 案名 / 客戶
   - 下半 `<ErpInfoTable cols={2} items>` 多列 grid：印件編號（link 至 /print-items/<id>）/ 印件類型 / 審稿狀態 / 難易度 / 印製狀態 / 免審稿快速路徑 / 訂單來源 / 出貨方式 / 預計產線 等 2 列 grid + 規格備註 / 檔案備註 / 包裝備註 span=2 跨欄
   - 視覺：ErpInfoTable 既有「左灰右白 + 細邊框 + rounded-lg」樣式對齊 Figma

2. **印件檔案區塊**：採 `ErpInfoTable` 直接 inline 寫 3 行（原始檔案 / 審稿後檔案 / 稿件縮圖），**不**透過 PrintItemArtworkCard / ErpSummaryGrid。
   - 每 row 左欄為類別標籤（含 Info hint tooltip），右欄為 `FileChips` 元件，內部以 `flex items-center gap-X flex-wrap` 水平排列多個檔案 link（kind=file）或縮圖（kind=thumb）
   - 視覺：對齊 Figma 「3 行 table 結構、cell 內水平排列檔案項」

3. **相關工單清單**：6 欄 `.erp-table`（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日），承接本次從主表移除的「工單數」摘要 + 原 ErpExpandableRow 子表內容。工單編號 SHALL 為可點擊連結，點擊 navigate 至 `/work-orders/<id>`。

4. **審稿紀錄區塊**：7 欄表格（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註），承載該印件全部 ReviewRound 歷史摘要。資料來源為 `OrderPrintItem.reviewRounds: ReviewRound[]`（內嵌結構、無需新增 store selector）。
   - **排序**：依 `roundNo` 由新到舊（最新一輪在最上）
   - **送審方式欄**：直接顯示 ReviewRound.source 值（`審稿` / `免審稿` / `售後補印`）
   - **審稿人員欄文案規則**：
     - `source = 審稿` + `reviewerId` 有值 → 顯示審稿人員姓名（透過 reviewerNames lookup）
     - `source = 審稿` + `reviewerId` 為 null → 顯示「待分派」
     - `source = 免審稿` → 顯示「系統免審」
     - `source = 售後補印` → 顯示「系統沿用」
   - **結果欄樣式**：採文字加色，**不**使用 Badge 元件
     - `合格` → 預設色
     - `不合格` → destructive 紅 `#dc2626`
     - `待審`（`result = null`，補件後新建 Round 尚未審完）→ 橘色 `#C97A00`
   - **退件分類欄**：合格 / 待審輪次 SHALL 顯示「—」；不合格輪次 SHALL 顯示 `rejectReasonCategory` enum 值
   - **備註欄**（`reviewNote`）：採 `line-clamp-2` 截斷顯示 + 原生 `title` attribute hover tooltip 顯示完整內容（最長 1000 字）
   - **空狀態**：`reviewRounds.length === 0` SHALL 顯示「此印件尚未送審」（與第 3 區塊「尚無工單」視覺一致）

**Footer**：關閉按鈕

#### Scenario: 業務點檢視按鈕開啟 Side Panel

- **WHEN** 業務於印件清單操作欄點擊「檢視」按鈕
- **THEN** 右側 SHALL 開啟 PrintItemDetailSidePanel
- **AND** Header SHALL 顯示印件名稱 + 類型 Label + 狀態 Badge + 開啟完整詳情頁 link
- **AND** Body SHALL 依序顯示印件資訊區塊（PrintItemSpecCard）+ 印件檔案區塊（PrintItemArtworkCard）+ 相關工單清單表格 + 審稿紀錄表格

#### Scenario: Side Panel 內預計產線 / 難易度 / 出貨方式呈現

- **GIVEN** 印件設有預計產線、難易度、出貨方式
- **WHEN** 業務查看 Side Panel 印件資訊區塊
- **THEN** PrintItemSpecCard SHALL 涵蓋預計產線 / 難易度 / 出貨方式三個欄位（由共用元件統一渲染）

#### Scenario: Side Panel 相關工單清單

- **GIVEN** 印件下有 1 個（或多個）相關工單
- **WHEN** 業務查看 Side Panel 相關工單清單區塊
- **THEN** 表格 SHALL 顯示 6 欄（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日）
- **AND** 工單編號 SHALL 為可點擊連結（點擊 navigate 至 `/work-orders/<id>`）
- **AND** 印件無相關工單時 SHALL 顯示「尚無工單」空狀態提示

#### Scenario: Side Panel 審稿紀錄顯示多輪混合結果

- **GIVEN** 印件已有 2 輪審稿（第 1 輪不合格、第 2 輪合格）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 2 列、第 2 輪在最上（最新一輪在最上）
- **AND** 第 2 輪結果欄 SHALL 顯示「合格」（預設色）、退件分類欄 SHALL 顯示「—」
- **AND** 第 1 輪結果欄 SHALL 顯示「不合格」（destructive 紅）、退件分類欄 SHALL 顯示對應 rejectReasonCategory enum 值

#### Scenario: Side Panel 審稿紀錄顯示免審稿輪次

- **GIVEN** 印件於業務階段勾選免審稿、系統自動產生 source=`免審稿` 的 ReviewRound（reviewerId 為 null、result = 合格）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 1 列
- **AND** 審稿人員欄 SHALL 顯示「系統免審」
- **AND** 送審方式欄 SHALL 顯示「免審稿」
- **AND** 結果欄 SHALL 顯示「合格」（預設色）
- **AND** 退件分類欄 SHALL 顯示「—」

#### Scenario: Side Panel 審稿紀錄顯示售後補印自動通過輪次

- **GIVEN** 印件為補印印件（type = `補印印件`），系統建立 ticket 內補印 PrintItem 時自動產生 source=`售後補印` 的 ReviewRound（reviewerId 為 null、result = 合格、sourcePrintItemId 指向來源印件）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格 SHALL 顯示 1 列
- **AND** 審稿人員欄 SHALL 顯示「系統沿用」
- **AND** 送審方式欄 SHALL 顯示「售後補印」
- **AND** 結果欄 SHALL 顯示「合格」（預設色）

#### Scenario: Side Panel 審稿紀錄空狀態

- **GIVEN** 印件尚未送審（reviewRounds 為空陣列）
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊
- **THEN** 表格區域 SHALL 顯示「此印件尚未送審」空狀態提示
- **AND** 視覺樣式 SHALL 與第 3 區塊「尚無工單」空狀態一致（灰字置中）

#### Scenario: Side Panel 審稿紀錄備註截斷與完整顯示

- **GIVEN** 某輪審稿備註（reviewNote）內容長度 > 50 字
- **WHEN** 業務查看 Side Panel 審稿紀錄區塊的備註欄
- **THEN** 備註欄 SHALL 以 `line-clamp-2` 截斷顯示
- **AND** 滑鼠 hover 該儲存格 SHALL 顯示完整 reviewNote 內容（透過原生 title attribute tooltip，無需引入 shadcn Tooltip 元件）

#### Scenario: 從 Side Panel 跳轉至印件完整詳情頁

- **WHEN** 業務點擊 Side Panel Header 內「開啟完整詳情頁」link
- **THEN** 系統 SHALL navigate 至 `/print-items/<id>` 印件完整詳情頁
