## Why

訂單詳情頁發票 Tab 已統一 UX 行為但未優化：發票列表用手寫展開，展開區塞滿六類資訊（藍新對帳鍵 / 品項明細 / 對應收款 / 折讓清單 / 作廢資訊 / 備註）造成資訊過載；折讓單藏在發票展開區子表內難以聚焦。另開立發票 Dialog 因沿用 `max-w-lg`（512px）使五欄商品明細擠迫，且先前以 `InvoiceLineItemCard`（僅商品名稱 + 金額、數量寫死 1 / 單位寫死「式」）呈現，未落實 v1.11 [align-invoice-line-items-to-ezpay-spec](../archive/2026-05-26-align-invoice-line-items-to-ezpay-spec/) 已定義的「發票品項符合 ezPay 與電子發票法規硬約束」五欄要求。

本 change 為**事後封存**已完成的發票 Tab 呈現優化（prototype 已實作並 commit/push：`7dfe8d6` + `fc99368`），對齊 v1.15 訂單列表印件子層的雙層展開範式、DESIGN.md §1.5 SidePanel 共用元件規範、以及 Figma node `9041:297881` 開立 Dialog 框架。

背景：款項與發票業務邏輯見 [付款發票邏輯](../../../memory/erp/ERP_Vault/04-business-logic/付款發票邏輯.md)；發票品項外部硬約束見 [發票法規硬約束-ezPay-MIG](../../../memory/erp/ERP_Vault/04-business-logic/發票法規硬約束-ezPay-MIG.md)。

## What Changes

純 UI 呈現調整，**無業務規則 / 實體 / 狀態機 / 角色變動**：

- **發票列表改雙層展開**（`ErpExpandableRow`）：父層精簡為 8 欄（toggle / 發票號碼 / 類別 / 金額（含稅）/ 買受人 / 狀態 / 折讓衍生 / 操作），「對帳編號」與「開立人 / 時間」移入 Side Panel；子層展開 = 該發票折讓單清單（精簡 5 欄：折讓號 / 金額 / 原因 / 狀態 / 操作，退款關聯改「已關聯 / 未關聯」小標記、剩餘可折讓金額移至子層區塊標題）；無折讓顯示空狀態；發票級操作（檢視 / 開立折讓 / 作廢 / 下載）集中父層操作欄，子層不放發票級操作。
- **新增發票詳情 Side Panel**（`InvoiceDetailSidePanel`，size=2xl 800px，唯讀）：操作欄「檢視」觸發，依 DESIGN.md §1.5 共用元件組裝（SidePanelBody / SidePanelSection / SidePanelInfoTable / SidePanelTable），四區塊（發票資訊含藍新對帳鍵 / 買受人資訊 / 品項明細五欄唯讀 / 對應收款 derived 自 PaymentAllocation）；與子層折讓單分工（Side Panel = 發票本身詳情、子層 = 折讓單清單，不重複）。
- **開立發票 Dialog 對齊 Figma `9041:297881`**：寬度 512px → 720px、header / footer 固定、body（max-h 800）可滾動、區塊間以分隔線區分；商品明細改用五欄 `InvoiceItemTable`（商品名稱 / 數量 / 單位 / 單價 / 小計自動算）落實既有「發票品項符合 ezPay」spec。
- **移除 dead code**：`InvoiceLineItemCard`（兩欄簡化卡）、`KeyValue`（對帳鍵改 SidePanelInfoTable 承載）。

## Capabilities

### New Capabilities

（無 — `InvoiceDetailSidePanel` 為 order-management 模組內的呈現 Requirement，沿用既有 SidePanel 共用元件，不另立 capability）

### Modified Capabilities

- `order-management`：ADDED「發票 Tab 雙層展開（發票列表 + 折讓單子層）」+ ADDED「發票詳情 Side Panel（InvoiceDetailSidePanel）」+ ADDED「發票開立 Dialog 版型（Figma 9041:297881 對齊）」（既有「發票開立（藍新 Mockup）」「發票品項符合 ezPay」Requirement 行為不變，本次以 ADDED 版型 Requirement 記錄 720px 框架與五欄 UI 落實，不 MODIFIED 既有 Requirement）

## Impact

- **Prototype（已實作 commit `7dfe8d6` + `fc99368`）**：`src/components/order/OrderInvoiceSection.tsx`（雙層 table + Side Panel 接線 + 開立 Dialog 720px 框架 + 五欄 + 移除 dead code）、新增 `src/components/order/InvoiceDetailSidePanel.tsx`、新增 `e2e/refine-invoice-tab.spec.ts`（3 案例）
- **Spec**：order-management（發票 Tab 呈現）
- **沿用既有零改動**：`InvoiceItemTable`、SidePanel 共用元件組、`ErpExpandableRow`、發票 / 折讓 / PaymentAllocation 型別與 helper
- **OQ**：[ORD-018 混合型 SidePanel 規範時機](../../../memory/erp/ERP_Vault/08-open-questions/ORD-018-混合型SidePanel規範時機.md) **不觸發**（`InvoiceDetailSidePanel` 為純詳情預覽型唯讀，非混合型）
- **驗證**：tsc 通過；e2e `refine-invoice-tab` 3 案例 + 完整套件 101 passed
- 設計已與 Miles 確認（三拍板：折讓子層精簡 5 欄 / 無折讓可展開+空狀態且子層不放發票級操作 / 父層移兩欄入 Side Panel；第二輪：開立 Dialog 五欄保留 + 720px），純 UI 呈現輕量處理（跳過序列協作四階段與 verify 前三視角審查）
