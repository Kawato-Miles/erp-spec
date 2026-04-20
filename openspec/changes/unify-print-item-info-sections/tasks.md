## 1. ViewModel 型別定義

- [x] 1.1 新增 `src/types/printItemViewModel.ts`
  - 定義 `PrintItemSpecViewModel`（B 卡欄位）：printItemNo、type、productName、paperMaterial、processContent、specNotes、packagingNotes、orderSource、printItemStatus、reviewDimensionStatus、relatedWorkOrdersLoaded?
  - 定義 `PrintItemArtworkViewModel`（C 卡欄位）：difficultyLevel、currentRoundNo、skipReview、reviewFiles、showStepper?
  - 匯出對應 TypeScript interface
- [x] 1.2 在同檔定義 adapter helper：`toPrintItemSpecViewModel(printItem: OrderPrintItem, relatedWOs: WorkOrder[]): PrintItemSpecViewModel`，內含派生狀態呼叫（含 canceled/voided 過濾）

## 2. 共用元件建立

- [x] 2.1 新增 `src/components/shared/PrintItemSpecCard.tsx`（B 區塊）
  - Props：`vm: PrintItemSpecViewModel`
  - Wrapper：`<ErpDetailCard title="印件資訊">`
  - 頂端：`<PrintItemStatusBadge>` + `<ReviewDimensionStatusBadge>` 兩顆並排
  - Badge 旁加 Tooltip：若有打樣 + 大貨混合，顯示派生基礎說明（`vm.statusDerivationNote` 或由 props 傳入）
  - `vm.relatedWorkOrdersLoaded === false` 時 Badge 顯示 loading skeleton
  - 下方：`<ErpInfoTable cols={2}>` 含 printItemNo、type、productName、paperMaterial、processContent、specNotes、packagingNotes、orderSource
  - 處理空值：欄位為空顯示「—」
- [x] 2.2 新增 `src/components/shared/PrintItemArtworkCard.tsx`（C 區塊）
  - Props：`vm: PrintItemArtworkViewModel`、`reviewerNames: string[]`
  - Wrapper：`<ErpDetailCard title="稿件資料">`
  - `vm.showStepper === true` 時頂端顯示 `<ReviewDimensionStatusStepper>`
  - `<ErpInfoTable cols={2}>` 含 difficultyLevel（DifficultyLevelBadge）、currentRoundNo、skipReview
  - `<ErpSummaryGrid cols={3}>` 呼叫 `buildArtworkSummaryItems`，無檔案時隱藏此區
- [x] 2.3 型別檢查：`cd /Users/b-f-03-029/sens-erp-prototype && npx tsc --noEmit`

## 3. 印件詳情頁改造（PrintItemDetail.tsx）

- [x] 3.1 拆解既有「基本資訊」巨卡為四張獨立 `ErpDetailCard`，順序 A → B → C → D
- [x] 3.2 A 卡 title 改為 **「所屬訂單」**：只保留訂單編號（可點擊連結）、案名、客戶
- [x] 3.3 B 卡：以 `<PrintItemSpecCard>` 替換，通過 adapter 傳入 `PrintItemSpecViewModel`；補齊紙張/材質、製程內容、規格備註、包裝備註、訂單來源欄位
- [x] 3.4 C 卡：以 `<PrintItemArtworkCard>` 替換（不傳 showStepper）
- [x] 3.5 D 卡 title 為 **「印製資料」**：獨立 `ErpDetailCard`，含訂購數量、交貨日期、預計產線 `InfoTable` + `ErpSummaryGrid`（label 加「累計」前綴：累計預計總數 / 累計完成數 / 累計入庫數 / 工單完成）
- [x] 3.6 移除頁面頂端的 `<PrintItemStatusStepper>`（狀態已移入 B 卡 Badge）
- [x] 3.7 型別檢查：`npx tsc --noEmit`

## 4. 審稿詳情頁改造（prepress/ReviewerDetail.tsx）

- [x] 4.1 拆解既有「審稿進度」+「基本資訊」為三張獨立卡，順序 A → B → C
- [x] 4.2 A 卡 title 改為 **「審稿任務」**：訂單編號、案名、客戶、審稿人員、當前輪次
- [x] 4.3 B 卡：以 `<PrintItemSpecCard>` 替換（透過 adapter）
- [x] 4.4 C 卡：以 `<PrintItemArtworkCard>` 替換，傳入 `vm.showStepper = true`（保留 Stepper 於 C 卡頂端）
- [x] 4.5 刪除頁面中的「審稿進度」獨立卡（Stepper 已移入 C 卡）
- [x] 4.6 **不顯示 D 卡**（審稿模組無需印製資訊）
- [x] 4.7 型別檢查：`npx tsc --noEmit`

## 5. 工單詳情頁改造（WorkOrderDetail.tsx）

- [x] 5.1 從 store 取得該工單關聯的 PrintItem：`orders.flatMap(o => o.printItems).find(pi => pi.id === wo.printItemId)`
- [x] 5.2 從 store 取得該印件所有**有效**關聯工單：`workOrders.filter(w => w.printItemId === wo.printItemId && w.status !== '已取消' && w.status !== '已作廢')`
- [x] 5.3 透過 adapter 建立 `PrintItemSpecViewModel`（含派生狀態、打樣/大貨 tooltip 文字、relatedWorkOrdersLoaded）
- [x] 5.4 拆解原有「基本資訊」巨卡為四張獨立卡，順序為 **A → D → B → C**（印務進度優先）
- [x] 5.5 A 卡 title 改為 **「工單資訊」**：保留既有 STATUS_STEPS 步驟條 + 工單編號、工單類型、關聯訂單、關聯印件（點擊跳印件詳情）、負責印務、印務主管、建立日期。MUST NOT 顯示交貨日期與生產/入庫數量（已歸 D 卡）
- [x] 5.6 D 卡 title 為 **「印製資料」**：保留既有目標/生產/入庫/完成度 `ErpSummaryGrid` + 排程摘要（預估完成日、工單交期預警），label **不加「累計」前綴**（本工單語境）
- [x] 5.7 B 卡：**新增** `<PrintItemSpecCard>`，B/C 卡 MUST NOT 預設收合
- [x] 5.8 C 卡：**新增** `<PrintItemArtworkCard>`
- [x] 5.9 若查無對應 PrintItem，B 卡與 C 卡顯示 `ErpEmptyState`「查無對應印件」
- [x] 5.10 型別檢查：`npx tsc --noEmit`

## 6. 視覺驗證（Lovable 預覽）

- [x] 6.1 Commit 變更並 push 至 Lovable
- [ ] 6.2 印件詳情頁：四張卡依序為 所屬訂單 / 印件資訊 / 稿件資料 / 印製資料；B 卡 Badge 並排正確；D 卡欄位 label 含「累計」前綴
- [ ] 6.3 工單詳情頁：四張卡依序為 工單資訊 / 印製資料 / 印件資訊 / 稿件資料；D 卡置於 A 之後；B 卡顯示完整印件規格；C 卡顯示稿件檔案；印件狀態 Badge 與印件總覽一致
- [ ] 6.4 審稿詳情頁：三張卡依序為 審稿任務 / 印件資訊 / 稿件資料；C 卡頂端 Stepper 正確顯示；無 D 卡
- [ ] 6.5 三頁 B / C 卡內容完全一致（欄位順序、Badge 位置、Tooltip、label 文字）
- [ ] 6.6 A 卡的關聯訂單、關聯印件點擊後正確跳轉
- [ ] 6.7 邊界：印件無工單時 D 卡數字為 0；無稿件時 C 卡 ErpSummaryGrid 正確隱藏；工單查無 PrintItem 時 B/C 顯示 EmptyState
- [ ] 6.8 邊界：印件關聯含作廢工單時，派生狀態排除該作廢工單（Lovable 手動修改 mock 資料驗證）
- [ ] 6.9 邊界：印件含打樣 + 大貨混合時，B 卡 Badge tooltip 顯示正確派生基礎描述

## 7. 訂單詳情頁欄位比對（不改訂單頁，僅比對驗證）

- [x] 7.1 對照 `OrderDetail.tsx` 印件 Tab 的欄位清單與 B 卡 `PrintItemSpecCard` 的 8 欄位
- [x] 7.2 若訂單頁有 B 卡缺的欄位（命名不一致、內容差異），記錄為 OQ-D 輸入並回報
- [x] 7.3 若訂單頁欄位 MUST 為 B 卡超集，將缺項補入 B 卡並同步回三頁

## 8. 文件同步

- [x] 8.1 DESIGN.md §0.1 新增一條「詳情頁印件資訊四分類」原則，說明 A/B/C/D 歸屬、A 卡依單據命名、工單頁 A→D→B→C 例外、印件頁 D 卡「累計」前綴
- [ ] 8.2 DESIGN.md §6.3 詳情頁模板範例補充「多張 `ErpDetailCard` 依序排列」的範例
- [x] 8.3 確認 `memory/erp/glossary.md` 無需新增術語（本次皆沿用既有名詞）

## 9. OQ 同步（Notion Follow-up DB）

- [ ] 9.1 OQ-A：工單頁 B 卡是否補「一鍵跳印件詳情」ExternalLink
- [ ] 9.2 OQ-B：印件頁 D 卡未來是否加進度條視覺化
- [ ] 9.3 OQ-C：prepress-review capability 建立時回頭補審稿詳情頁 spec delta
- [ ] 9.4 OQ-D：訂單詳情頁印件 Tab 欄位比對結果
- [ ] 9.5 OQ-E：UAT 追蹤「管理層 Slack 詢問印件進度頻次」，評估成功指標達成

## 10. Change 收尾

- [ ] 10.1 執行 `/opsx:verify` 驗證 specs / design / tasks / 實作一致性
- [ ] 10.2 執行 `/opsx:archive` 將 delta specs 合併回 main specs 並歸檔
- [ ] 10.3 執行 `doc-audit` skill 檢查跨檔案一致性
- [ ] 10.4 更新 `CLAUDE.md` § Spec 規格檔清單（order-management / work-order 版本號升版）
