<!-- 事後封存：實作已於 prototype commit 7dfe8d6（第一輪：雙層展開 + Side Panel + 五欄）+ fc99368（Dialog 720px 框架）完成，故全部標記為已完成。 -->

## 1. 發票列表雙層展開

- [x] 1.1 `OrderInvoiceSection` 發票列表手寫展開改用 `ErpExpandableRow`（colSpan=8）
- [x] 1.2 父層精簡 8 欄（移除「對帳編號」「開立人 / 時間」）+ colgroup 由 10 欄調整為 8 欄
- [x] 1.3 子層 subContent = 折讓單清單 5 欄（折讓號 / 金額 / 原因 / 狀態 / 操作）+ 退款關聯小標記 + 剩餘可折讓金額移至子層區塊標題
- [x] 1.4 無折讓空狀態（「尚無折讓紀錄」；作廢且無折讓「此發票已作廢，無折讓紀錄」）
- [x] 1.5 發票級操作集中父層操作欄（檢視 / 下載 / 開立折讓 / 作廢）+ 操作欄 `stopPropagation` 避免誤觸展開

## 2. 發票詳情 Side Panel

- [x] 2.1 新增 `InvoiceDetailSidePanel.tsx`（size=2xl 800px 唯讀，依 DESIGN.md §1.5 SidePanel 共用元件組裝）
- [x] 2.2 四區塊（發票資訊含對帳鍵 / 買受人資訊 / 品項明細五欄唯讀 / 對應收款 derived 自 PaymentAllocation）
- [x] 2.3 `OrderInvoiceSection` 接線（`viewingInvoice` state + 操作欄「檢視」觸發 + 對應收款推導於父層算好傳入）

## 3. 開立 Dialog 版型 + 五欄

- [x] 3.1 開立 Dialog 商品明細由 `InvoiceLineItemCard`（兩欄）改用五欄 `InvoiceItemTable`（落實 ezPay 五欄 spec）
- [x] 3.2 Dialog 寬度 512 → 720px + header / footer 固定（shrink-0 + border）+ body 可滾動（max-h 800、flex-1 overflow-y-auto）
- [x] 3.3 基本資訊 / 商品明細 / 備註 區塊間加分隔線 + 移除 `FormRow` 與商品明細區內層 `px-2` 統一由 body `px-6` 控制對齊

## 4. dead code 移除

- [x] 4.1 移除 `InvoiceLineItemCard`（含 props interface）
- [x] 4.2 移除 `KeyValue`（對帳鍵改 `SidePanelInfoTable` 承載）+ 清除 unused icon import（`ChevronRight` / `ChevronDown` / `Trash2`）

## 5. 驗證

- [x] 5.1 `tsc --noEmit` 通過（無型別錯誤 / 無 unused import）
- [x] 5.2 新增 e2e `refine-invoice-tab.spec.ts`（開立五欄 / 雙層展開折讓 + 退款標記 / 檢視 Side Panel 四區塊 三案例）
- [x] 5.3 完整 e2e 101 passed + 發票相關 5 案例全過（refine-invoice-tab 3 + manual-invoice / issue-invoice 2）
- [x] 5.4 截圖佐證（Dialog 720px 五欄不擠 / 雙層展開折讓單 / 發票詳情 Side Panel）
