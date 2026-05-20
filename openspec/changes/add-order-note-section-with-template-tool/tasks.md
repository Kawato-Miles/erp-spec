## 1. 資料層與型別

- [x] 1.1 Order type 新增 3 個欄位（`orderNote` / `deliveryNote` / `paymentNote`，皆為 `string` optional），位置 `src/types/order.ts` 或 store 內 Order interface
- [x] 1.2 useErpStore 新增 update action（同時更新一個 / 多個欄位的 partial update），預設值為空字串
- [x] 1.3 既有 demo 訂單 mock data 中為 1-2 筆訂單預填新欄位範例值（讓 UI 驗證時看到有資料的狀態）
- [x] 1.4 撰寫 TypeScript 介面 `NoteTemplate` 與 `OrderNoteFieldKey`，置於 `src/components/shared/NoteTemplatePopover.tsx` 與 `src/data/orderNoteTemplates.ts` 共用

## 2. seed 模板資料

- [x] 2.1 建立 `src/data/orderNoteTemplates.ts`，按 `OrderNoteFieldKey` keyed export `ORDER_NOTE_TEMPLATES`
- [x] 2.2 從附件 `/Users/b-f-03-029/Downloads/quote_note_html.html` 搬 10 條到 `order_note`（保留原 id on1-on10、label、text）
- [x] 2.3 搬 12 條到 `delivery_note`（保留原 id dn1-dn12、label、text）
- [x] 2.4 搬 5 條到 `payment_note`（保留原 id pn1-pn5）+ 將 dn10「規格調整酌收費用」搬到 payment_note（共 6 條）
- [x] 2.5 確認 28 條 seed 文字內容（特別是 `★` 前綴、`[日期]` `[金額]` 變數佔位符）原樣保留

## 3. NoteTemplatePopover 共用元件

- [x] 3.1 建立 `src/components/shared/NoteTemplatePopover.tsx`，定義 `NoteTemplatePopoverProps` API
- [x] 3.2 實作觸發按鈕：`Button variant="ghost" size="sm"` + FileText icon + buttonLabel（預設「插入常用備註」）
- [x] 3.3 實作 PopoverContent：寬 420px、max-height 480px、overflow-y-auto
- [x] 3.4 實作 Header：說明文字 + 「全部清除」連結（有勾選時顯示）
- [x] 3.5 實作 Checkbox List：每列 Checkbox + label + hover 預覽（前 60 字、line-clamp-2）
- [x] 3.6 實作 Footer：「取消」+ 「插入 N 條」（N=0 時 disabled）
- [x] 3.7 實作勾選狀態管理（內部 React useState，open 時 reset）
- [x] 3.8 實作 onInsert callback：傳回 `\n` 串接的字串（父元件負責 append）
- [x] 3.9 實作 Toast 通知（呼叫 sonner `toast.success("已插入 N 條模板")`）
- [x] 3.10 實作鍵盤可達性（Tab / Enter / ESC / 上下方向鍵 / Space）
- [x] 3.11 實作 disabled prop 同步（與父元件 textarea disabled 一致）
- [x] 3.12 export NoteTemplate / NoteTemplatePopoverProps 型別供父元件 import

## 4. 訂單詳情頁整合

- [x] 4.1 修改 `src/pages/OrderDetail.tsx`：在資訊 Tab 既有「訂單資訊卡」下方、既有「訂單備註三類分欄」上方，新增「客戶溝通備註」section
- [x] 4.2 Section 標題「客戶溝通備註」+ 副標題「訂單階段對客戶說明的標準化條款（後續匯出至報價單／訂單確認單）」
- [x] 4.3 三個 textarea（訂單備註 / 交貨備註 / 付款備註）使用既有 ErpTextarea 元件、字數上限 500
- [x] 4.4 每個 textarea label 列右側掛 NoteTemplatePopover（傳入對應的 templates、currentValue、onInsert handler）
- [x] 4.5 onInsert handler 實作 append 邏輯：`newValue = currentValue ? currentValue + '\n' + combinedText : combinedText`，並透過 store update action 寫回
- [x] 4.6 編輯權限與時機 disabled 條件：使用者非授權角色 / 訂單已完成 → textarea + button 皆 disabled
- [x] 4.7 既有 payment_terms_note 顯示位置不變，但 label 加註「（來自需求單）」
- [x] 4.8 既有「訂單備註三類分欄」section 位置不變，但 section 標題改為「內部備註」、副標題「員工內部紀錄，客戶不可見」

## 5. 編輯 dialog（**deviation：改採新建 OrderNotesEditDialog**，原計畫沿用 OrderInfoEditDialog）

> apply 階段 implementation feedback：既有 OrderInfoEditDialog 受 `isBeforeProduction` lock 規則約束，與本 change 編輯時機（訂單完成前）衝突。改為**新建獨立 `OrderNotesEditDialog`**，理由與 alternatives 詳見 [ORD-014](../../../memory/erp/ERP_Vault/08-open-questions/ORD-014-訂單備註與訂單資訊編輯dialog分開.md) + design.md 決策 8。

- [x] 5.1 新建 `src/components/order/OrderNotesEditDialog.tsx`：含 3 個 textarea + NoteTemplatePopover（取代「修改 OrderInfoEditDialog」）
- [x] 5.2 三個 textarea label 旁掛 NoteTemplatePopover（與詳情頁 read-only 區共用 ORDER_NOTE_TEMPLATES seed）
- [x] 5.3 整合 form state：local useState + useEffect 同步 order props；儲存時 onConfirm 回傳 Partial<Order> → 父元件 updateOrder
- [x] 5.4 取消 / 儲存按鈕邏輯沿用既有 dialog 模式（DialogFooter + outline / primary 兩按鈕）

## 6. DESIGN.md 補規範

- [x] 6.1 修改 `/Users/b-f-03-029/sens-erp-prototype/DESIGN.md`，在 §0.1 附近新增「Form Field Label 右側 Trailing Action Button 規範」段落
- [x] 6.2 規範內容包含：樣式（ghost / size sm）、位置（label 列右側）、與 Info icon / 字數計數共存規則、disabled 同步、icon 規範

## 7. e2e 測試

- [x] 7.1 撰寫 Playwright spec `tests/e2e/order-note-template.spec.ts`：開啟訂單詳情頁 → 切資訊 Tab → 確認「客戶溝通備註」section 存在
- [x] 7.2 加 test case：點訂單備註旁「插入常用備註」按鈕 → 驗證 Popover 開啟、顯示 10 條 orderNote 模板
- [x] 7.3 加 test case：勾選 3 條 → 確認 footer 顯示「插入 3 條」、點插入 → 驗證 textarea 含三條文字（`\n` 分隔）+ Toast 出現
- [x] 7.4 加 test case：邊界 — 欄位已有內容 → 插入 append 不覆蓋；勾選後反勾 → 「插入 0 條」disabled；ESC 關閉 popover
- [x] 7.5 加 test case：權限 — 訂單已完成 → textarea + button 皆 disabled
- [x] 7.6 跑 `npm run test:e2e` 確認無 regression（特別注意對既有訂單詳情頁 e2e 測試的影響）

## 8. impeccable 第一輪：clarify

- [x] 8.1 觸發 impeccable clarify skill，focus 在文案校準
- [x] 8.2 校準欄位名稱：「訂單備註 / 交貨備註 / 付款備註」vs「業務備註 / 出貨備註 / 收款備註」
- [x] 8.3 校準 section 標題「客戶溝通備註」+ 副標題（vs「對客戶說明」「客戶條款補充」）
- [x] 8.4 校準觸發按鈕「插入常用備註」（vs「快速備註」「插入模板」）
- [x] 8.5 校準 Popover header / footer 文案、Toast 訊息、Placeholder
- [x] 8.6 依 clarify 建議修正文案，重跑 e2e 確認 selector 仍可運作

## 9. impeccable 第二輪：polish

- [x] 9.1 觸發 impeccable polish skill，focus 在互動與視覺細節
- [x] 9.2 校準 Popover 開關 motion（150-250ms ease-out / ease-in）
- [x] 9.3 校準 Checkbox hover / focus state、selected count badge 視覺重量
- [x] 9.4 校準「插入 N 條」按鈕 disabled 視覺（透明度、cursor）
- [x] 9.5 校準 Popover 列表 scroll 邊界（fade mask、scrollbar 樣式）
- [x] 9.6 校準長 label truncate vs wrap 策略（line-clamp-2）
- [x] 9.7 校準新「客戶溝通備註」section 與既有訂單資訊卡的視覺分隔（border / spacing / typography）
- [x] 9.8 校準三個 textarea 之間的間距
- [x] 9.9 依 polish 建議修正細節

## 10. 文件同步與驗證

- [ ] 10.1 跑 `openspec validate add-order-note-section-with-template-tool` 確認 delta specs 格式正確
- [ ] 10.2 跑 `doc-audit` skill 確認跨檔案一致性
- [ ] 10.3 確認 ERP_Vault 訂單實體卡（`memory/erp/ERP_Vault/05-entities/訂單.md`）已記錄三個新欄位
- [ ] 10.4 確認 OQ 卡（ORD-005~013 + XM-006）frontmatter 的 `last-reviewed` 已更新
- [ ] 10.5 更新 CLAUDE.md 規格檔清單（order-management spec 版本號 + status）
- [ ] 10.6 commit 與 push（依 CLAUDE.md 版本控管規範）

## 11. verify 與 archive 準備

- [ ] 11.1 跑 `/opsx:verify` 驗證實作對齊 design.md + delta specs
- [ ] 11.2 驗證所有 P0 OQ（ORD-005/006/007/013）design 階段定案內容是否如實實作
- [ ] 11.3 驗證 e2e 測試全部通過、無 regression
- [ ] 11.4 整理 archive 摘要：本 change 完成的 Requirement 列表、影響範圍、未來路徑（P1 + Phase 2 OQ）
- [ ] 11.5 跑 `/opsx:archive` 將 delta specs 合併回 main specs、change 歸檔
- [ ] 11.6 archive 後 doc-audit 跨檔案一致性檢查
