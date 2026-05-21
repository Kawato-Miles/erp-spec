## 1. 資訊 Tab — 移除業務負責人旁「分享 / 轉單」按鈕

- [x] 1.1 編輯 `src/pages/OrderDetail.tsx` 行 394-416：將 `業務負責人` row 的 value 從 `<span>{salesPerson}<Button>分享 / 轉單</Button></span>` 改為純文字 `order.salesPerson || '-'`
- [x] 1.2 移除行 399-402 的 inline 註解（refine-order-edit-gate-and-consultation change 註解、不寫 PR 描述類註解）
- [x] 1.3 dev server 驗證：訂單詳情頁「資訊」Tab 業務負責人 row 只顯示業務名稱、無多餘按鈕
- [x] 1.4 dev server 驗證：分享 Tab 仍可正常開啟並管理權限（US-ORD-004 機制不受影響）

## 2. 印件清單 Tab — 表格結構重整（移除兩層展開、改 Side Panel 模式）

- [x] 2.1 編輯 `src/pages/OrderDetail.tsx` 行 644-918：移除 `expandedPrintItemIds` state 與 `toggleExpand` 邏輯
- [x] 2.2 移除 `ErpExpandableRow` 包裝（行 692-913）與 `subContent`（行 697-747 工單嵌套表格）
- [x] 2.3 移除 `<th className="w-[40px]"></th>` 展開圖示欄
- [x] 2.4 新增 `selectedPrintItemForView` state（type: `OrderPrintItem | null`）
- [x] 2.5 表格從 20 欄調整為 14 欄、順序：縮圖 / 印件名稱 / 規格備註 / 類型 / 印件狀態 / 審稿狀態 / 打樣結果 / 購買數量 / 售價 / 生產數量 / 入庫數量 / 出貨數量 / 交期 / 操作
- [x] 2.6 從表格移除 5 欄（預計產線 / 難易度 / 出貨方式 / 稿件 / 工單數）
- [x] 2.7 縮圖欄渲染邏輯（原行 843-865）搬到首欄，尺寸從 `w-10 h-10` 放大至 `style={{ width: 120, height: 120 }}` 方形
- [x] 2.8 縮圖無圖佔位框尺寸同步調整至 120 × 120（icon 從 `h-4 w-4` 放大至 `h-6 w-6`）
- [x] 2.9 表格 cell 內容靠頂端對齊（`align-top`），與大縮圖視覺對齊
- [x] 2.10 操作欄保留「補件」（不合格時）+「編輯印件」（製作前）+ 新增「檢視」按鈕（永遠顯示，點擊 setSelectedPrintItemForView 開 Side Panel）
- [x] 2.11 dev server 驗證：印件清單 14 欄、縮圖在首欄 120px 方形、無展開圖示欄、無兩層展開

## 3. 印件清單 Tab — 移除「申請異動」按鈕

- [x] 3.1 刪除 `src/pages/OrderDetail.tsx` 行 894-909 整段（製作後顯示「申請異動」toast 入口）
- [x] 3.2 確認下方 Info Banner（行 919-927）保留作為頁面層級提示（不刪除）
- [x] 3.3 dev server 驗證：製作後印件操作欄僅顯示「檢視」按鈕、不再有「申請異動」按鈕
- [x] 3.4 grep `src/` 確認「申請異動」字串已無孤兒引用

## 4. 印件詳情 Side Panel — 新增 PrintItemDetailSidePanel 元件

- [x] 4.1 新增 `src/components/order/PrintItemDetailSidePanel.tsx`，container 為 `ErpSidePanel` size=lg direction=right
- [x] 4.2 Header 區塊：印件名稱 + PrintItemTypeLabel + 印件狀態 Badge + 「開啟完整詳情頁」link（navigate 至 `/print-items/${pi.id}`）
- [x] 4.3 Body 區塊 1：印件資訊（沿用 `PrintItemSpecCard` 共用元件、吃 ViewModel interface）
- [x] 4.4 Body 區塊 2：印件檔案（沿用 `PrintItemArtworkCard` 共用元件）
- [x] 4.5 Body 區塊 3：相關工單清單表格 6 欄（工單編號 / 工單類型 / 狀態 / 印務 / 建立日期 / 預計完成日），搬 OrderDetail.tsx:699-743 既有 sub table 內容
- [x] 4.6 工單編號 cell：text-primary 樣式 + 點擊 navigate 至 `/work-orders/${wo.id}`
- [x] 4.7 Footer：關閉按鈕（呼叫 setSelectedPrintItemForView(null)）
- [x] 4.8 在 `OrderDetail.tsx` import PrintItemDetailSidePanel 並掛在 印件清單 Tab 對應位置
- [x] 4.9 dev server 驗證：點操作欄「檢視」按鈕 → Side Panel 開啟 → 三區塊正確渲染 → 關閉正常
- [x] 4.10 dev server 驗證：Side Panel 內預計產線 / 難易度 / 出貨方式 / 稿件檔案 / 工單清單皆可見

## 5. 金額及付款 Tab — 金額組成區塊重設計（模式 A1）

- [x] 5.1 編輯 `src/components/order/OrderPaymentSection.tsx` 行 491-576：金額組成區塊從 `ErpInfoTable + DualPriceCell` 改為 `ErpTableCard` + `.erp-table` 結構
- [x] 5.2 分項區四欄：分項名稱（左）/ 數量摘要（中）/ 小計（未稅）（右 + font-mono）/ 小計（含稅）（右 + font-mono + text-muted-foreground 弱化）
- [x] 5.3 分項 rows：商品 / 運費 / 急件費 / 諮詢費 / 其他費用 / 折抵（負）/ 紅利（負）/ 訂單異動（可正可負）
- [x] 5.4 商品 row 數量摘要顯示「N 個印件」；其他 row 顯示來源摘要（如「OrderExtraCharge × N」）
- [x] 5.5 空值分項 row 採 `text-muted-foreground` 弱化
- [x] 5.6 折抵 / 紅利 / 負值異動 row：金額前綴 `−` + `text-destructive`
- [x] 5.7 待審核異動 row：金額欄改顯「待核可」chip + tooltip 說明「另有待審核異動，核可執行後將計入」
- [x] 5.8 底部 summary stack（取代原行 555-570）：小計（未稅）→ 營業稅 5% → Separator → = 應收總額（含稅）
- [x] 5.9 應收總額視覺：`text-2xl font-bold text-foreground`（取代 `text-emerald-600`）
- [x] 5.10 行 549-552 「付款狀態」row 從分項區移出至 summary stack 結尾
- [x] 5.11 移除 `primary` 切換邏輯（行 487：原依 order_source 動態 swap 主從）
- [x] 5.12 行 494-496 描述文字更新為「訂單金額來源拆解；分項區雙欄並列（未稅 / 含稅），底部彙總含應收總額。」
- [x] 5.13 dev server 驗證：金額組成分項區四欄並列、summary stack 三層、應收總額用無品牌色強調

## 6. DualPriceCell 重命名為 AmountCell

- [x] 6.1 編輯 `src/components/order/OrderPaymentSection.tsx` 行 1181-1217：DualPriceCell 改名為 AmountCell
- [x] 6.2 移除 `primary/secondary` 切換邏輯（雙欄分離後不需）
- [x] 6.3 AmountCell 保留 `negative` / `muted` / `emphasize` 三個 variant prop，承載「單一金額 + 視覺修飾」職責
- [x] 6.4 grep 全 repo 替換 `DualPriceCell` → `AmountCell`，確認所有引用點更新
- [x] 6.5 dev server 驗證：金額組成分項區所有金額 cell 正確渲染（正值 / 負值 / muted / emphasize）

## 7. DESIGN.md 規範補充

- [x] 7.1 編輯 `sens-erp-prototype/DESIGN.md` § 0.1：新增「實體狀態欄優先於屬性欄」條目
- [x] 7.2 編輯 DESIGN.md § 0.1：新增「縮圖 / 圖像欄置於資料列首欄」條目
- [x] 7.3 編輯 DESIGN.md § 6：新增「子表規模 > 6 欄或 > 5 row 時不採用 ErpExpandableRow，改開 Side Panel」條目
- [x] 7.4 編輯 DESIGN.md § 1.4.4 使用情境決策樹：補一行「列表 row 詳細資訊預覽（不離頁）」→ ErpSidePanel
- [x] 7.5 編輯 DESIGN.md § 6：新增「金額明細採模式 A1：分項 ErpTable 四欄 + 底部 summary stack」條目
- [x] 7.6 巡讀五條新增規範，確認用詞對齊 § 0.1 既有條目風格

## 8. e2e 與品質驗證

- [x] 8.1 npm run dev 啟動 localhost:8080，瀏覽 `/orders/<任一訂單>` 全 Tab 巡覽
- [x] 8.2 撰寫或更新 Playwright e2e：訂單詳情頁載入 smoke test
- [x] 8.3 Playwright e2e：印件清單 Side Panel 開啟流程（點檢視 → Side Panel 顯示三區塊 → 關閉 → 主表保持）
- [x] 8.4 Playwright e2e：金額組成分項區四欄渲染 + summary stack 三層
- [x] 8.5 嚴格 console / pageerror 0 錯誤
- [x] 8.6 跨製作前 / 製作後訂單驗證印件操作欄按鈕條件顯示
- [x] 8.7 跨線下單 / 線上單驗證金額組成顯示一致（不再依 order_source 動態切換主從）

## 9. 三視角審查

- [ ] 9.1 觸發 senior-pm agent 審查：使用者反饋是否被準確解讀、無範疇外擴
- [ ] 9.2 觸發 ceo-reviewer agent 審查：是否影響上線時程 / KPI；模式 A1 是否對齊業界 ERP 主流
- [ ] 9.3 觸發 erp-consultant agent 審查：印件 Side Panel + 金額組成是否與既有狀態機 / Data Model 一致
- [ ] 9.4 三視角審查回饋的議題追蹤至 OQ 或本 change tasks，全部解決後進入 verify 階段

## 10. OQ 開檔（透過 oq-manage skill）

- [ ] 10.1 開 OQ：120px 縮圖在 5+ 印件大訂單下的實際體感是否可接受、是否需降為 80px 折衷
- [ ] 10.2 開 OQ：印件清單操作欄「檢視」按鈕的 icon 選擇（Eye / FileSearch / ExternalLink），Pass 1 暫用 Eye
- [ ] 10.3 開 OQ：Side Panel 開啟時若使用者同時想編輯印件（製作前場景）UX 邊界
- [ ] 10.4 開 OQ：金額組成混合稅率情境（印刷業免稅品如書籍）UI 呈現策略
- [ ] 10.5 開 OQ：DualPriceCell → AmountCell 重命名範圍確認（本 change 內或另開 change）

## 11. 歸檔準備

- [ ] 11.1 執行 `openspec validate refine-order-detail-tabs` 確認 spec 結構合法
- [ ] 11.2 執行 doc-audit skill 檢查跨 OpenSpec spec 一致性
- [ ] 11.3 確認 CLAUDE.md § Spec 規格檔清單需要更新（order-management 版本由 v0.5 推進至 v0.6）
- [ ] 11.4 commit prototype 異動（依 CLAUDE.md commit 規範）
- [ ] 11.5 commit OpenSpec change 異動
- [ ] 11.6 執行 `/opsx:verify refine-order-detail-tabs` 進入驗證階段
- [ ] 11.7 全綠後執行 `/opsx:archive refine-order-detail-tabs` 歸檔
- [ ] 11.8 歸檔後手動同步 order-management spec 至 Notion 發布版本（https://www.notion.so/32c3886511fa806bad41d755349b0567）v0.6
