## Context

前次 change（custom-order-creation）新增「客製單」類型與 CreateOrderPanel 手動建單功能。決策變更：客製單日後統一由 EC 建立後同步至 ERP，ERP 不再提供手動建單入口。order_type 維持三選一（線下 / 線上EC / 客製單），因 EC 端仍需區分一般訂單與客製單。

現有 Prototype 狀態：
- `types/order.ts`：`OrderType = '線下單' | '線上單EC' | '客製單'` -- 保留不變
- `data/mockOrders.ts`：含客製單 mock 資料 -- 保留但調整來源描述
- `pages/OrderList.tsx`：訂單類型篩選器含「客製單」選項 -- 保留；「新增訂單」按鈕 -- 移除
- `components/order/CreateOrderPanel.tsx`：客製單建立面板 -- 整個元件移除

## Goals / Non-Goals

**Goals:**
- 完整移除 ERP 端客製單建立功能（手動建單入口、建立面板、建立專屬欄位區塊）
- 保留客製單作為 order_type 分類（EC 同步進入後可辨識）
- 狀態機客製路徑統一由 EC 同步觸發，移除 Phase 1 手動推進描述

**Non-Goals:**
- 不設計 EC 同步機制（屬 Phase 2 範疇）
- 不調整 order_type 選項（仍為三選一）
- 不調整訂單詳情頁對客製單的顯示（僅移除建立相關功能）

## Decisions

### D1: 移除 CreateOrderPanel 元件

直接刪除 `components/order/CreateOrderPanel.tsx` 及其所有引用。訂單列表頁移除「新增訂單」按鈕。

**理由**：此元件唯一用途為在 ERP 手動建立客製單，功能移除後無保留價值。

### D2: OrderType 型別保留三選一

`OrderType = '線下單' | '線上單EC' | '客製單'` 不變動。客製單仍為有效的訂單類型，日後由 EC 同步帶入。

### D3: 訂單列表保留客製單篩選

訂單類型篩選器保留「客製單」選項（日後 EC 同步後會有客製單資料需篩選）。僅移除「新增訂單」按鈕。

### D4: 移除客製單建立專屬元件

訂單詳情頁中的顧客資訊、發票設定、物流設定、金額試算區塊為客製單建立專屬功能，一併移除。這些資訊日後由 EC 同步帶入，屆時再設計 ERP 端的顯示方式。

### D5: mock 資料調整

保留客製單 mock 資料（模擬日後 EC 同步進入的客製單），但移除手動建立相關的模擬邏輯。

## Risks / Trade-offs

**[風險] Phase 2 前 ERP 無法處理客製單** → 預期行為，客製單在 Phase 2 EC 同步上線前不會出現在 ERP 中。

**[風險] Prototype 其他元件可能引用 CreateOrderPanel** → 全域搜尋確認無殘留引用。
