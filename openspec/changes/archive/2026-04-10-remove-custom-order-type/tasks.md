## 1. 元件移除

- [x] 1.1 刪除 `pages/CreateOrder.tsx`（客製單建立頁面）
- [x] 1.2 `pages/OrderList.tsx`：移除「建立訂單」按鈕；`App.tsx`：移除 CreateOrder import 與 `/orders/new` 路由
- [x] 1.3 移除客製單建立專屬元件（顧客資訊、發票設定、物流設定、金額試算區塊，若已實作為獨立元件）-- 經確認為 OrderDetail 內條件渲染的 inline 區塊，非獨立元件，保留作為日後 EC 同步資料顯示用

## 2. 訂單列表調整

- [x] 2.1 `pages/OrderList.tsx`：保留「客製單」篩選選項與 badge 樣式（不移除）
- [x] 2.2 確認移除「建立訂單」按鈕後頁面佈局正常

## 3. Mock 資料調整

- [x] 3.1 `data/mockOrders.ts`：保留客製單 mock 資料，活動紀錄「建立客製單」改為「訂單同步（EC 客製單）」

## 4. Demo 資料同步

- [x] 4.1 `openspec/references/demo-data.md`：客製單範例調整為 EC 同步來源描述

## 5. 驗證

- [x] 5.1 驗證：全域搜尋 Prototype 中 CreateOrder 確認無殘留引用
- [x] 5.2 驗證：訂單列表不再顯示「建立訂單」按鈕
- [x] 5.3 驗證：OrderType 型別仍包含「客製單」（保留作為分類）
- [x] 5.4 驗證：訂單類型篩選器仍包含「客製單」選項
