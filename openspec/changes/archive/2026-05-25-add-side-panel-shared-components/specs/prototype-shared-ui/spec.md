## ADDED Requirements

### Requirement: SidePanel 共用元件組（Figma 8977:269607 對齊）

跨模組 SidePanel SHALL 透過 `@/components/side-panel/*` 共用元件組裝、視覺對齊 Figma node-id `8977:269607`。SidePanel 內 SHALL NOT 使用詳情頁專用卡片（ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard），SHALL NOT 自寫 padding / hr / section 標題樣式。

**元件清單**（位於 `src/components/side-panel/`）：

| 元件 | 用途 |
|------|------|
| `SidePanelBody` | SidePanel body 容器，自動處理 padding（px-6 py-5）與 section 間距（16+1+16 + `#e3e4e5` hr） |
| `SidePanelSection` | 單一 section（h3 title 16px font-semibold + 12px gap + children），可選 hint Tooltip / action 按鈕 |
| `SidePanelInfoTable` | `ErpInfoTable` 的 re-export（label 120w / cell px-4 py-2 / rounded-lg / border #e3e4e5）|
| `SidePanelFileList` | 檔案 chip list（attach_file icon + 檔名 link），固定垂直疊放（`flex-col gap-1`）、單一職責；縮圖場景請用 `SidePanelThumbnailList` |
| `SidePanelThumbnailList` | 縮圖 list，固定 48x48 / gap 4px / horizontal |

**使用情境**：

| 場景 | 容器 | 內容組裝 |
|------|------|---------|
| 詳情預覽型 SidePanel（列表頁「檢視」觸發、唯讀資訊呈現） | `ErpSidePanel size="2xl"` + `SidePanelBody` | `SidePanelSection` + `SidePanelInfoTable` / `SidePanelFileList` / `<table className="erp-table">` |
| 編輯型 SidePanel（新增 / 編輯 form、有 Save/Cancel） | `ErpSidePanel size=lg|xl` + form 內容 | `ErpEditFormCard.Field` / `ErpFormField`（**豁免** SidePanel 共用元件）|

**驗收清單**（≥ 13 項）：
1. SidePanel 寬度：`size="2xl"` 對應 `sm:max-w-[800px]`
2. Header 高 64px、底部 1px `border-border` border-b
3. Body padding：水平 24px / 垂直 20px（`px-6 py-5`）
4. Section title：`<h3>` `text-base font-semibold`（16px / line-height 24px）
5. Section title 與內容間距：12px（`mb-3`）
6. Section 之間：16px + 1px hr `#e3e4e5` + 16px（最後一個 section 無底部 hr）
7. SidePanelInfoTable label 欄寬：120px（除非 item 層覆寫）
8. SidePanelInfoTable cell padding：水平 16px / 垂直 8px（`px-4 py-2`）
9. SidePanelInfoTable border：`#e3e4e5` outer / `#f2f2f2` inner / `rounded-lg`
10. SidePanelFileList：垂直疊放（`flex-col gap-1`、4px 間距） / attach_file icon 20x20 + 14px 藍色檔名 link
11. SidePanelThumbnailList：48x48px / gap 4px (`flex-row gap-1`) / horizontal / `border #e3e4e5` / `rounded`
12. 欄位備註：透過 `SidePanelInfoItem.hint` 顯示 Info icon + Tooltip，禁止 inline 寫在 value
13. 顏色 token：背景 `bg-white` / 邊框 `border-[#e3e4e5]` / 內框 `border-[#f2f2f2]` / 連結 `text-primary`

**禁用事項**（≥ 6 項 anti-pattern）：
- 禁止：SidePanel 內使用 `ErpDetailCard` / `PrintItemSpecCard` / `PrintItemArtworkCard`（詳情頁專用、外框會造成雙重 card 視覺）
- 禁止：自寫 `<div className="p-5 space-y-6">` 取代 `SidePanelBody`
- 禁止：自寫 `<section><h3 className="text-base font-semibold mb-2">...</h3></section>` 取代 `SidePanelSection`
- 禁止：section 間自寫 `<hr>` 或 `<div className="border-t my-4">`（`SidePanelBody` 自動處理）
- 禁止：重寫表格樣式——列表型內容用 `<table className="erp-table">`、key-value 用 `SidePanelInfoTable`
- 禁止：檔案區 inline 寫 `<a><FileText/><span/></a>` chip——應用 `SidePanelFileList` / `SidePanelThumbnailList`

**範疇說明**：本 change 服務 1 個既有詳情預覽型消費點（PrintItemDetailSidePanel）；其餘 7 個 SidePanel 消費點（EditOrderPrintItemPanel / EditPrintItemPanel / EditQuotePanel / CreateQuotePanel / AddProductionTaskPanel / PermissionManagement / WorkOrderDetail SidePanel）全為編輯型、明示豁免新規範。未來新增**詳情預覽型** SidePanel SHALL 直接套用新規範；**混合型** SidePanel 規範時機列為 [[ORD-018-混合型SidePanel規範時機]] OQ，本變更不規範。元件 API 處於 prototype 階段，若第 2-3 個真實 consumer 出現時不符實際需求，將重構 API（不視為 breaking change）。

#### Scenario: SidePanelBody 4 section 自動加 hr 分隔線

- **GIVEN** 開發者在 SidePanel 內放 4 個 `SidePanelSection`
- **WHEN** SidePanel 渲染
- **THEN** 第 1 / 2 / 3 section 後 SHALL 出現 1px `#e3e4e5` 水平分隔線
- **AND** 第 4 section（最後）SHALL NOT 有底部分隔線
- **AND** section 與 hr 之間 SHALL 各有 16px 垂直間距

#### Scenario: SidePanelSection title 與內容間距

- **WHEN** 渲染 `<SidePanelSection title="印件資訊"><SidePanelInfoTable items={...} /></SidePanelSection>`
- **THEN** title `<h3>` SHALL 為 `text-base font-semibold`（16px / line-height 24px）
- **AND** title 與下方內容間距 SHALL 為 12px（`mb-3`）

#### Scenario: SidePanelFileList 固定垂直疊放

- **GIVEN** 給定 2 個檔案
- **WHEN** 渲染 `<SidePanelFileList files={...} />`
- **THEN** wrapper SHALL 含 `flex-col` class（垂直疊放）
- **AND** 檔案間距 SHALL 為 4px (`gap-1`)
- **AND** 每個 chip SHALL 含 attach_file icon (20x20) + 檔名 link（14px、藍色）

#### Scenario: SidePanelThumbnailList 縮圖規格

- **WHEN** 渲染 `<SidePanelThumbnailList thumbs={3 個縮圖} />`
- **THEN** 每個縮圖 SHALL 為 48x48px (`w-12 h-12`)
- **AND** 縮圖間距 SHALL 為 4px (`gap-1`)
- **AND** 縮圖容器 SHALL 含 `border-[#e3e4e5]` border + `rounded` 圓角

#### Scenario: SidePanelInfoTable 對外契約

- **WHEN** 從 `@/components/side-panel` import `SidePanelInfoTable`
- **THEN** 該 export SHALL 提供與 `ErpInfoTable` **相同的 props API**（cols / items / labelWidth）
- **AND** SHALL 維持**相同的視覺合約**：label 120w / cell padding `px-4 py-2` / `#e3e4e5` outer border / `#f2f2f2` inner border / `rounded-lg`
- **AND** MAY 透過 re-export 或 thin wrapper 實作（implementer 決定，spec 不限定）

#### Scenario: 編輯型 SidePanel 豁免共用元件

- **GIVEN** 編輯型 SidePanel（如 EditQuotePanel / CreateQuotePanel）內部為 form 結構（有 Save / Cancel 按鈕）
- **WHEN** 該 SidePanel 開發
- **THEN** SHALL 豁免 SidePanelBody / SidePanelSection 共用元件規範
- **AND** SHALL 繼續使用 ErpEditFormCard / ErpFormField 既有 form layout

### Requirement: ErpSidePanel size variant 擴充

`ErpSidePanel` 元件 size variant SHALL 新增 `'2xl'` = `sm:max-w-[800px]`，對應 Figma 詳情預覽型 SidePanel 寬度規格；既有 `'sm' | 'md' | 'lg' | 'xl' | 'full'` 完全不動、向後相容。

#### Scenario: size='2xl' 渲染寬度為 800px

- **GIVEN** `<ErpSidePanel size="2xl">` 在桌機 viewport（≥ 800px 寬度）
- **WHEN** SidePanel 開啟
- **THEN** dialog wrapper SHALL 含 `sm:max-w-[800px]` class
- **AND** 實際 dialog 寬度 SHALL 為 800px

#### Scenario: 既有 size variant 不受影響

- **GIVEN** 既有 SidePanel 消費點使用 `size="lg"` / `size="xl"` 等
- **WHEN** 升級至本變更後
- **THEN** 既有 size variant 對應寬度 SHALL 保持不變（sm=480 / md=560 / lg=600 / xl=720 / full=90vw）
- **AND** 既有 7 個 SidePanel 消費點 SHALL NOT 受影響
