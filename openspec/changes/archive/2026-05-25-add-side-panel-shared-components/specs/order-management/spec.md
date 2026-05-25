## MODIFIED Requirements

### Requirement: 印件詳情 Side Panel（PrintItemDetailSidePanel）

訂單詳情頁印件清單表格的「檢視」按鈕點擊 SHALL 開啟右側 Side Panel（PrintItemDetailSidePanel），承載印件單筆深入檢視內容。

**容器規格**：
- 採用 ErpSidePanel 元件
- size = `2xl`（800px，對齊 Figma node-id 8977:269607 詳情預覽型 SidePanel 規格）
- direction = `right`

**Header**：
- 印件名稱
- PrintItemTypeLabel（沿用 add-after-sales-ticket / refine-after-sales-refund 既有共用元件）
- 印件狀態 Badge
- 「開啟完整詳情頁」link（點擊 navigate 至 `/print-items/<id>` 印件完整詳情頁）

**Body**（四區塊垂直排列、用 SidePanel 共用元件組裝；apply 階段對齊 Figma node-id `8977:269607`）：

整體採 `<SidePanelBody>` 包裝（自動處理 padding px-6 py-5 + section 間距 16+1+16 + `#e3e4e5` 水平分隔線、最後 section 無底部 hr）。

1. **印件資訊區塊**：`<SidePanelSection title="印件資訊">` 包 2 個 `<SidePanelInfoTable>`：
   - 上半 cols=1：訂單編號（link 至 /orders/<id>）/ 案名 / 客戶
   - 下半 cols=2：印件編號（link 至 /print-items/<id>）/ 印件類型 / 審稿狀態 / 難易度 / 印製狀態 / 免審稿快速路徑 / 訂單來源 / 出貨方式 / 預計產線 + 規格備註 / 檔案備註 / 包裝備註 span=2 跨欄

2. **印件檔案區塊**：`<SidePanelSection title="印件檔案">` 包 1 個 `<SidePanelInfoTable>` 3 行：
   - 原始檔案 → `<SidePanelFileList files={sourceFiles} kind="file" />`（垂直疊放）
   - 審稿後檔案 → `<SidePanelFileList files={processedFiles} kind="file" />`（垂直疊放，對齊 Figma 多檔案疊放）
   - 稿件縮圖 → `<SidePanelThumbnailList thumbs={thumbFiles} />`（48x48 / gap 4px / horizontal）
   - 每行 label 含 Info hint icon（透過 `SidePanelInfoItem.hint` prop）

3. **相關工單清單**：`<SidePanelSection title="相關工單">` 內放 6 欄 `<table className="erp-table">`（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日）。工單編號 SHALL 為可點擊連結，點擊 navigate 至 `/work-orders/<id>`。

4. **審稿紀錄區塊**：`<SidePanelSection title="審稿紀錄">` 內放 7 欄 `<table className="erp-table">`（輪次 / 送審時間 / 審稿人員 / 送審方式 / 結果 / 退件分類 / 備註），承載該印件全部 ReviewRound 歷史摘要。資料來源為 `OrderPrintItem.reviewRounds: ReviewRound[]`（內嵌結構、無需新增 store selector）。
   - 排序、文案規則、結果欄樣式、退件分類、備註截斷、空狀態 — 沿用 add-review-rounds-to-print-item-side-panel 既有規範

**Footer**：關閉按鈕

#### Scenario: 業務點檢視按鈕開啟 Side Panel

- **WHEN** 業務於印件清單操作欄點擊「檢視」按鈕
- **THEN** 右側 SHALL 開啟 PrintItemDetailSidePanel
- **AND** dialog 寬度 SHALL 為 800px（ErpSidePanel size="2xl"）
- **AND** Header SHALL 顯示印件名稱 + 類型 Label + 狀態 Badge + 開啟完整詳情頁 link
- **AND** Body SHALL 依序顯示印件資訊 / 印件檔案 / 相關工單 / 審稿紀錄四區塊

#### Scenario: SidePanel 內 section 間有水平分隔線

- **GIVEN** PrintItemDetailSidePanel 開啟
- **WHEN** 業務查看 SidePanel body
- **THEN** 4 section 中前 3 個 section 後 SHALL 各有 1px `#e3e4e5` 水平分隔線
- **AND** 最後一個 section（審稿紀錄）SHALL NOT 有底部分隔線
- **AND** section 與 hr 之間 SHALL 各有 16px 垂直間距

#### Scenario: SidePanel 印件檔案多檔垂直疊放

- **GIVEN** 印件審稿後檔案有 2 個 file（`reviewFiles.fileRole='審稿後檔案'`）
- **WHEN** 業務查看 SidePanel 印件檔案區塊「審稿後檔案」row
- **THEN** 2 個 file chips SHALL 垂直疊放（wrapper class 含 `flex-col`）
- **AND** chips 間距 SHALL 為 4px

#### Scenario: SidePanel 稿件縮圖水平排列 48x48

- **GIVEN** 印件稿件縮圖有 3 個 thumb（`reviewFiles.fileRole='縮圖'`）
- **WHEN** 業務查看 SidePanel 印件檔案區塊「稿件縮圖」row
- **THEN** 3 個縮圖 SHALL 水平排列（wrapper class 含 `flex-row`）
- **AND** 每個縮圖尺寸 SHALL 為 48x48 (`w-12 h-12`)
- **AND** 縮圖間距 SHALL 為 4px
