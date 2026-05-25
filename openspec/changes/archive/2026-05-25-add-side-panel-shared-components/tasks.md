## 1. 建立 SidePanel 共用元件組（src/components/side-panel/）

- [x] 1.1 建資料夾 `src/components/side-panel/` + `index.ts` barrel 匯出
- [x] 1.2 建 `SidePanelBody.tsx`：body 容器 + 自動 section hr（React.Children.toArray + index < count-1 控制；padding px-6 py-5；hr `border-t border-[#e3e4e5] my-4`）
- [x] 1.3 建 `SidePanelSection.tsx`：title row（flex justify-between）+ h3 text-base font-semibold + mb-3 + 可選 hint Tooltip / action 按鈕
- [x] 1.4 建 `SidePanelInfoTable.ts`：re-export `ErpInfoTable` as `SidePanelInfoTable` + `ErpInfoItem` as `SidePanelInfoItem`
- [x] 1.5 建 `SidePanelFileList.tsx`：files prop + emptyText；固定 `flex flex-col gap-1` 垂直疊放；單一職責、不支援 horizontal layout 或縮圖渲染（縮圖場景用 SidePanelThumbnailList）
- [x] 1.6 建 `SidePanelThumbnailList.tsx`：thumbs prop + size (預設 48) + emptyText；`flex flex-row items-center gap-1`；每個 thumb `w-12 h-12 rounded border border-[#e3e4e5]`
- [x] 1.7 `npx tsc --noEmit` 通過

## 2. ErpSidePanel size=2xl 擴充（1 行新增）

- [x] 2.1 修改 `src/components/layout/ErpSidePanel.tsx:12` 將 `ErpSidePanelSize` type 加 `'2xl'`
- [x] 2.2 修改 line 14-20 `SIZE_CLASS` 加 `'2xl': 'sm:max-w-[800px]'`（xl 之後 full 之前）
- [x] 2.3 確認既有 sm/md/lg/xl/full 完全不動、向後相容

## 3. 改寫 PrintItemDetailSidePanel 用新元件組

- [x] 3.1 修改 `src/components/order/PrintItemDetailSidePanel.tsx` size `xl` → `2xl`
- [x] 3.2 移除內部 FileChips helper（line 348-402）+ 移除 FileText / Download lucide icon import
- [x] 3.3 移除 `<div className="p-5 space-y-6">` wrapper，改用 `<SidePanelBody>`
- [x] 3.4 4 個 section 各包 `<SidePanelSection title="...">`，移除既有 `<section><h3 className="text-base font-semibold mb-2">...</h3>...</section>` 模式
- [x] 3.5 印件檔案 section 內 `ErpInfoTable` 改為 `SidePanelInfoTable`，cell value 改用 `<SidePanelFileList files={sourceFiles} kind="file" />` / `<SidePanelFileList files={processedFiles} kind="file" />` / `<SidePanelThumbnailList thumbs={thumbs} />`
- [x] 3.6 印件資訊 section 內 `ErpInfoTable` 改 import 名稱為 `SidePanelInfoTable`（透過 re-export 一致 API）
- [x] 3.7 更新檔案頂部 jsdoc 註解
- [x] 3.8 `npx tsc --noEmit` 通過

## 4. DESIGN.md §1.5 SidePanel 元件規範章節

- [x] 4.0 **修訂 DESIGN.md §0.1 line 52 對齊本變更**（erp-consultant 三視角審查必修 1）：既有「Side Panel 內容結構：…沿用既有共用元件（如 PrintItemSpecCard / PrintItemArtworkCard）+ 工單清單 / 任務清單表格」最後一段改為「Side Panel 內容結構：採用 §1.5 SidePanel 元件組（SidePanelBody / Section / InfoTable / FileList / ThumbnailList），SHALL NOT 沿用詳情頁專用卡（ErpDetailCard / PrintItemSpecCard / PrintItemArtworkCard），改由 SidePanelInfoTable cols=2 承載印件屬性、SidePanelFileList 承載檔案、SidePanelThumbnailList 承載縮圖」
- [x] 4.1 在 `sens-erp-prototype/DESIGN.md` line 229「### 1.5 專用 CSS class」之前插入新 §1.5 SidePanel 元件規範
- [x] 4.2 原 §1.5「專用 CSS class」重編為 §1.6（更新章節編號）
- [x] 4.3 §1.5.1 元件清單（5 個元件 + 用途表）
- [x] 4.4 §1.5.2 使用情境（詳情預覽型 vs 編輯型；明示豁免條件）
- [x] 4.5 §1.5.3 驗收清單（≥ 13 項：寬度 / 標題字級 / section 間距 / hr / cell padding / label 寬 / 檔案 chip 排列 / 縮圖規格 / Info icon 時機 / 顏色 token / ...）
- [x] 4.6 §1.5.4 禁用事項（≥ 6 項 anti-pattern）
- [x] 4.7 §1.5.5 範例（2 個 code snippet：完整 SidePanel + 單獨 Section；註明「漸進遷移」）
- [x] 4.8 確認 DESIGN.md §1.4 通用元件清單表格 line 196-207 新增 5 個 SidePanel* 元件 row（在 §1.4.3 Organism 表內或新增 §1.4.4 SidePanel-specific Organism 子節）

## 5. e2e 測試擴充

- [x] 5.1 修改 `sens-erp-prototype/e2e/refine-order-detail-tabs.spec.ts`「點檢視按鈕開啟 PrintItemDetailSidePanel + 四區塊」test：擴 dialog width = 800 斷言
- [x] 5.2 新增 test「section 間有 3 條水平分隔線」：dialog 內 `<hr>` count = 3、border-top color = `rgb(227, 228, 229)` (#e3e4e5)
- [x] 5.3 新增 test「印件檔案多檔垂直疊放 / 縮圖水平排列」：審稿後檔案 wrapper 含 `flex-col` / 稿件縮圖 wrapper 含 `flex-row` + 縮圖 width=48 height=48
- [x] 5.4 跑 `npx playwright test e2e/refine-order-detail-tabs.spec.ts` 確認全部 tests 通過 + console.error / pageerror = 零

## 6. Figma 視覺對齊驗證

- [x] 6.1 preview_start `vite-dev` 在 localhost:8080；resize viewport 至 1440x900
- [x] 6.2 開 `/orders/ORD-20260419-04?tab=printItems` → 點檢視印件詳情按鈕 → SidePanel 開啟、四區塊正確渲染
- [x] 6.3 preview_eval DOM 量測對齊 Figma：
  - dialog width = 800
  - section title 字級 16px / line-height 24px
  - section 間距 16+1+16、hr `#e3e4e5`
  - 縮圖 48x48 / gap 4px
  - 檔案 chip kind=file 垂直、kind=thumb 水平

## 7. 主動收尾

- [x] 7.1 觸發 `doc-audit` skill（OpenSpec 層稽核 + 平台容器 spec 一致性）
- [x] 7.2 確認本次無 Vault 卡異動（不觸發 vault-audit）
- [x] 7.3 確認本次無新 OQ、無解答既有 OQ（不觸發 oq-manage）
- [x] 7.4 archive 時更新 CLAUDE.md § Spec 規格檔清單：訂單管理 v1.8 → v1.9、prototype-shared-ui 新增 SidePanel 元件規範條目

## 8. 三視角審查（結構性變更觸發）

- [x] 8.1 specs / design 完成後觸發三視角平行審查（senior-pm + ceo-reviewer + erp-consultant）依 multi-agent-discussion-protocol
- [x] 8.2 重點審查：元件 API 抽象層次（不過度設計也不過度簡化）、編輯型豁免規則清楚程度、漸進遷移策略
- [x] 8.3 三視角彙整修訂建議；若建議影響 Requirement / 元件 API 則回頭修 specs / design
