## 1. 型別與常數擴充

- [x] 1.1 `types/order.ts`：OrderType 新增「客製單」（`'線下單' | '線上單EC' | '客製單'`）
- [x] 1.2 `types/order.ts`：OrderStatus 對齊 state-machines spec（新增「報價待回簽」「已回簽」「等待付款」「已付款」「稿件未上傳」「等待審稿」「製作等待中」「工單已交付」「製作中」「製作完成」「出貨中」「訂單完成」「已取消」）
- [x] 1.3 `components/order/OrderStatusBadge.tsx`：新增所有狀態的樣式對應

## 2. 建立訂單面板元件

- [x] 2.1 新建 `components/order/CreateOrderPanel.tsx`：右側 Sheet 面板（560px 寬），參考 CreateQuotePanel.tsx 的 UI 模式
- [x] 2.2 表單區塊 — 訂單資訊：客戶名稱（必填）、接單業務（必填）、帳務公司（選填）、是否急件（勾選）
- [x] 2.3 表單區塊 — 交期與付款：客戶交期、預計出貨日（日期輸入）、付款方式（下拉）、付款備註
- [x] 2.4 表單區塊 — 印件清單：動態新增多筆印件，每筆含名稱（必填）、類型（必填）、數量（必填）、單位（選填）、免審稿（勾選）、規格備註（選填）
- [x] 2.5 表單區塊 — 備註：多行文字輸入
- [x] 2.6 表單驗證：必填欄位驗證（客戶名稱、接單業務、至少一筆印件含名稱/類型/數量），錯誤提示

## 3. 串接與資料

- [x] 3.1 `pages/OrderList.tsx`：將「建立訂單」按鈕連接 CreateOrderPanel（控制 open/close 狀態）
- [x] 3.2 建立 OrderContext（或擴充現有 mock 機制）：支援 addOrder 函式，新增訂單至 mockOrders
- [x] 3.3 `data/mockOrders.ts`：新增 1-2 筆客製單 mock 資料（order_type = 客製單，status = 等待付款）
- [x] 3.4 `pages/OrderList.tsx`：訂單類型篩選器新增「客製單」選項；OrderType badge 新增客製單樣式

## 4. 訂單列表與狀態篩選更新

- [x] 4.1 `pages/OrderList.tsx`：ALL_STATUSES 陣列更新為對齊 spec 的完整狀態清單
- [x] 4.2 確認現有 mock 資料的 status 值與新 OrderStatus 型別一致（必要時更新）

## 5. 驗證

- [x] 5.1 驗證：在 OrderList 點擊「建立訂單」→ 右側面板開啟 → 填寫必填欄位 → 確認建立 → 新訂單出現在列表，狀態為「等待付款」，類型為「客製單」
- [x] 5.2 驗證：建立時未填必填欄位 → 顯示錯誤提示，阻擋送出
- [x] 5.3 驗證：建立客製單時勾選免審稿的印件 → 確認 review_status 顯示為「合格」
- [x] 5.4 驗證：訂單列表的狀態篩選器與類型 badge 正確顯示客製單與新狀態
