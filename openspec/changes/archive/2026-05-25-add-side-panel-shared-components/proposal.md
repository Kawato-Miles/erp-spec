## Why

Miles 視覺對比 [PrintItemDetailSidePanel](../../../sens-erp-prototype/src/components/order/PrintItemDetailSidePanel.tsx) 與 Figma node-id `8977:269607` 後發現 7 處差異（寬度 720 vs 800 / section 間缺水平分隔線 / title 間距偏小 / 檔案 chip 排列規則不對 / 縮圖大小與 gap 不對等）；同時要求**把 SidePanel 內容抽成全局共用元件**，讓未來其他 SidePanel（訂單 / 工單 / 諮詢單 / 審稿單詳情）能快速組合出對齊 Figma 規範的 layout，並寫入 [DESIGN.md](../../../sens-erp-prototype/DESIGN.md) 作為後續驗收標準，避免 SidePanel 自寫樣式分歧。

業務上下文：訂單詳情頁印件 Tab 第一層已能看到主資訊，Side Panel 的職責為「印件補充歷史」載體（工單 + 審稿紀錄）；本變更承接 [add-review-rounds-to-print-item-side-panel](../archive/2026-05-25-add-review-rounds-to-print-item-side-panel/) 已歸檔的內容增量，聚焦**視覺對齊 + 為未來新增詳情預覽型 SidePanel 建立組裝基礎**。

業務 user journey：業務於訂單詳情頁印件 Tab 點「檢視」後，SidePanel 提供印件資訊 + 印件檔案 + 相關工單 + 審稿紀錄四區塊摘要；業務常見任務為比對審稿輪次差異 / 確認相關工單狀態，800px 寬度 + 縮圖 48x48 + 多檔垂直疊放可降低多檔場景的視覺溢出。

## Background

- 設計來源：Figma node-id `8977:269607`（從 metadata 解析確認 SidePanel 800px / Section 間有 1px hr / 縮圖 48x48 / 檔案 chip 垂直疊放）
- 變動性質分級：**結構性變更**（依 [[memory/erp/ERP_Vault/11-review-knowledge/_shared/lightweight-review-mode]]）— 新增跨模組元件組（5 個元件，至少 8 個 SidePanel 消費點將套用）、改動共用元件 `ErpSidePanel` API（size variant 擴）、新增 DESIGN.md §1.5 規範章節
- 觸發三視角完整輪次：specs / design 完成後 senior-pm + ceo-reviewer + erp-consultant 平行審查
- 既有 8 個 SidePanel 消費點中，本變更**服務 1 個既有詳情預覽型消費點**（PrintItemDetailSidePanel）；其餘 7 個全為**編輯型 SidePanel**（EditOrderPrintItem / EditPrintItem / EditQuote / PermissionManagement / CreateQuote / AddProductionTask / WorkOrderDetail SidePanel），**豁免**新規範、繼續用 `ErpEditFormCard` form layout
- 本變更**ROI 來源**：(a) 1 個既有消費點視覺對齊 Figma；(b) 為未來新增詳情預覽型 SidePanel 建立組裝基礎（DESIGN.md §1.5 規範作為後續驗收標準）
- **Rule of Three trade-off**（三視角審查 CEO insight）：本變更實際 consumer = 1，從元件抽象 ROI 角度屬於 premature abstraction；Miles plan 階段明確選擇「先建元件 + 規範化」路線，承諾若第 2-3 個真實 consumer 出現時元件 API 不符實際需求，將重構而非保留——詳見 design § D6
- **混合型 SidePanel**（資訊預覽 + 內嵌 form）規範時機列為 [[ORD-018-混合型SidePanel規範時機]] OQ，本變更不規範、等實際需求出現時再決

## What Changes

- **ADDED**：`prototype-shared-ui` capability § 「SidePanel 共用元件組（Figma 8977:269607 對齊）」Requirement
  - 5 個元件：`SidePanelBody` / `SidePanelSection` / `SidePanelInfoTable`（re-export）/ `SidePanelFileList` / `SidePanelThumbnailList`
  - 放置位置：`src/components/side-panel/`
  - 編輯型 SidePanel 豁免規則
  - ≥ 13 項驗收清單（寬度 / 標題字級 / section 間距與 hr / cell padding / 檔案 chip 排列 / 縮圖大小 / Info icon 時機 等）

- **MODIFIED**：`prototype-shared-ui` capability § ErpSidePanel Requirement（若既有）
  - 新增 `size='2xl'` variant = `sm:max-w-[800px]`、不動既有 sm/md/lg/xl/full

- **MODIFIED**：`order-management` capability § 「印件詳情 Side Panel（PrintItemDetailSidePanel）」Requirement
  - size `xl` → `2xl`
  - Body 改用 SidePanel 共用元件組合（從 inline ErpInfoTable 改為 SidePanelBody + SidePanelSection 包裝）
  - 印件檔案 cell 改用 SidePanelFileList / SidePanelThumbnailList（取代既有 FileChips inline helper）

## Capabilities

### New Capabilities

無

### Modified Capabilities

- `prototype-shared-ui`：新增 SidePanel 共用元件組 Requirement + ErpSidePanel size=2xl
- `order-management`：印件詳情 Side Panel 改用新元件組（size + body 結構）

## Impact

- **Affected Specs**：
  - `openspec/specs/prototype-shared-ui/spec.md`（ADDED Requirement「SidePanel 共用元件組」+ MODIFIED ErpSidePanel size variant）
  - `openspec/specs/order-management/spec.md`（MODIFIED 「印件詳情 Side Panel」size + Body 描述）
- **Affected Code**（Prototype repo `sens-erp-prototype`）：
  - 新建：`src/components/side-panel/` 資料夾 + 5 個元件檔 + `index.ts` barrel
  - 修改：`src/components/layout/ErpSidePanel.tsx`（line 12 type union + line 14-20 SIZE_CLASS 加 '2xl' 一行）
  - 改寫：`src/components/order/PrintItemDetailSidePanel.tsx`（size、移除 inline FileChips helper、4 section 用新元件包裝）
- **Affected Docs**：
  - `sens-erp-prototype/DESIGN.md` §0.1 line 52 修訂（既有「Side Panel 內容結構：沿用 PrintItemSpecCard / PrintItemArtworkCard 共用元件」與本變更禁用矛盾、改為「採用 §1.5 SidePanel 元件組」）
  - `sens-erp-prototype/DESIGN.md` 新增 §1.5 SidePanel 元件規範章節（line 229 之前插入；原 §1.5 重編為 §1.6）
- **不影響**：
  - 既有 ErpSidePanel sm/md/lg/xl/full size（向後相容）
  - 既有 ErpInfoTable / ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard / ErpSummaryGrid 元件 API
  - 既有 `.erp-table` CSS class
  - 其餘 7 個 SidePanel 消費點本變更不動（漸進遷移）
- **e2e Tests**：
  - `sens-erp-prototype/e2e/refine-order-detail-tabs.spec.ts` 擴 dialog width 800 / hr count / 檔案 chip layout 斷言
- **Notion 發布**：累積至下次手動推送訂單管理 BRD 更新時一併同步至 [訂單管理發布版本](https://www.notion.so/32c3886511fa806bad41d755349b0567)
