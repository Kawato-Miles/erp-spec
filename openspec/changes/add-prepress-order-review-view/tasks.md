## 1. 資料聚合層（read model，零新增欄位）

- [x] 1.1 在 `utils/prepressReview.ts` 新增母集合計算函式 `selectOrdersWithPendingReview`：輸出「底下至少一件印件審稿維度 ∈ {等待審稿, 已補件, 不合格}」的訂單；排除已取消訂單、已棄用印件；含 reviewer 範圍過濾（含明確區分 `isPrintItemPendingOrderReview` 與 inbox 語意）
- [x] 1.2 新增「訂單審稿停留天數」`computeOrderReviewDwellDays`（牆鐘時長口徑）：最早首輪 `submittedAt` → 全部審畢最晚 `reviewedAt`（未全審畢計至今日）；單元測試驗算多印件情境
- [x] 1.3 新增「距交期 / 逾期」`computeOrderDeadline` / `computeOrderDaysToDeadline` / `isOrderOverdueInReview`（訂單交期=最早印件 deliveryDate，距交期 < 緩衝暫定 2 天）；附單元測試
- [x] 1.4 新增「訂單退件率」`computeOrderRejectionRate`（不合格輪次 / 已判定輪次）供與停留天數配對顯示

## 2. 審稿訂單脈絡查詢視圖頁面

- [x] 2.1 新增頁面元件 `pages/prepress/OrderReviewView.tsx`，於 `App.tsx` 加路由 `/prepress/by-order`、`AppSidebar.tsx` 於「我的待審」(審稿人員)與「審稿管理」(中台)各加「依訂單檢視」入口
- [x] 2.2 訂單母列呈現：訂單編號(可點) / 客戶 / 交期 / 距交期天數 / 停留天數(與退件率配對)；母列無「待審 N / 共 M」彙總標籤（preview snapshot 驗證）
- [x] 2.3 訂單可展開列出該訂單全部印件（ErpExpandableRow，含已合格以 ReviewDimensionStatusBadge 標示）
- [x] 2.4 依登入角色切資料範圍：審稿人員(reviewer)僅見有自己負責印件的訂單、審稿主管(reviewer_supervisor)見全部；列表一致（preview 驗證 rs1 看全部 / rv2 看自己同印件「我」vs「其他審稿」）
- [x] 2.5 列表篩選功能（搜尋訂單編號/客戶 + 審稿關卡逾期篩選）
- [x] 2.6 自己負責印件「去審」跳轉 `/prepress/inbox/:id`（preview 驗證 rv2 顯示去審按鈕）；非自己負責唯讀無動作（rs1 顯示唯讀）；此頁不就地審

## 3. 訂單詳情限訂單層級版（審稿平台）

- [x] 3.1 新增 `pages/prepress/OrderReviewDetail.tsx` + 路由 `/prepress/order/:id`；訂單母列點訂單編號開啟，三頁籤「資訊（訂單編號/客戶/案名/交期）/ 印件清單 / 活動紀錄」（preview 驗證三頁籤 + 資訊 + 印件清單內容）
- [x] 3.2 審稿角色版訂單詳情為獨立閹割頁，本身僅三頁籤、無金額/發票/對帳/訂單異動/帳務/工單/QC/出貨（建新頁達成閹割，preview 驗證無其他頁籤、無編輯按鈕）

## 4. 角色權限調整

- [x] 4.1 審稿角色經 `/prepress`（審稿平台 prefix）即可進入限定唯讀訂單詳情（資訊/印件清單/活動紀錄），不開放訂單模組完整功能、無編輯動作（preview 驗證 rv2 可進 /prepress/order/:id 唯讀；spec 層 user-roles MODIFIED 已定義 R 限定唯讀）

## 5. 指標呈現

- [ ] 5.1 訂單母列「停留天數」MUST 與「退件率」配對顯示（不可單列停留天數）；逾期訂單以視覺標示（如標紅）並可彙總計數
- [ ] 5.2 驗證指標全部由既有時間戳 / 交期聚合，無新增資料欄位

## 6. 端對端驗證（Playwright）

- [x] 6.1 e2e `e2e/prepress-order-review-view.spec.ts`：審稿人員見有自己印件的訂單、展開印件、自己負責顯示「去審」（通過）
- [x] 6.2 e2e：審稿主管見全部待審訂單、印件對主管唯讀（全頁無「去審」按鈕）（通過）
- [x] 6.3 e2e：點訂單編號進限訂單層級詳情（三頁籤 + 斷言無金額/付款/發票/對帳/異動/工單/QC/出貨頁籤）（通過）
- [x] 6.4 三個 test 皆嚴格斷言 console error / pageerror = []（通過，3 passed 3.3s）
