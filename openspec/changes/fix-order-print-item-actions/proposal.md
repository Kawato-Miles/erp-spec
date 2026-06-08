## Why

此 change 解決訂單詳情頁印件清單的兩個原始痛點：
1. **刪除按鈕沒反應**：`OrderDetail.tsx:580-582` 的 Trash 按鈕未掛 onClick，使用者點擊看似無反應（實為事件冒泡至 `ErpExpandableRow` 的 onToggle）
2. **不知道如何編輯印件**：訂單頁缺少編輯入口，業務想改印件的「製作細節、規格備註、交期」等非金額欄位時無路徑

經與 Miles 釐清業務規則後，兩個痛點的正解並非「修復刪除 + 同時支援編輯」，而是：

- **刪除按鈕應直接移除**：印件在訂單已確認（回簽）後的任何生命週期變更，業務路徑皆不經「印件層刪除」：
  - 金額 / 數量變更（訂單未完成）→ 於印件編輯 Panel 直接調整購買數量 / 報價單價，應收即時重算（依 route-C § 訂單階段印件規格編輯時機，終態前可直接改、不走 OA）
  - 金額變更（訂單已完成 / 已取消）→ 走「訂單異動單（OrderAdjustment）補收 / 退款」流程
  - 規格 / 非金額屬性變更 → 走印件編輯 Panel
  - 合格後改內容 → 走「棄用 + 新建」流程（後續 change `add-print-item-deprecate` 承接）
  - 業務誤建 / 建單錯誤 → 走「取消訂單 + 重新走需求單」
  - 客戶要求全然取消訂單 → 走「取消訂單」流程

  由於**沒有任何合法情境**需要印件層直接刪除，保留 Trash 按鈕（無論是實作刪除、disabled、或改為導引）都只會誤導業務與累積互動債。最乾淨的解法是**完全移除**。

- **編輯按鈕應新增**：印件的規格與金額欄位（購買數量、報價單價等）之可編輯性依 route-C § 訂單階段印件規格編輯時機（終態前可直接改、終態後唯讀走 OA）；本 change 新增的 Pencil 編輯按鈕額外補充**非金額屬性欄位**（印件名稱、預計產線、出貨方式、包裝說明等）的編輯能力，與 route-C 共用同一 `EditOrderPrintItemPanel` 入口。
- **印件為 source of truth、訂單為唯一編輯入口**：印件資料貫穿訂單、工單、生產任務、出貨單，為確保變更源頭單一，系統 SHALL 僅在訂單詳情頁提供印件編輯入口，下游單據（工單、出貨單等）只讀印件；印件內容異動時，下游單據 SHALL 自動同步最新值。
- **金額變更路徑依訂單是否完成兩分**：訂單未完成 → 印件編輯 Panel 直接改（應收即時重算）；訂單完成 / 取消後 → 走訂單異動單（OrderAdjustment 補收 / 退款）。此前提對齊 route-C，取代本 change 原始版本「金額一律走 OA」的設計（route-C § 訂單階段印件規格編輯時機已明文廢止「完成前金額走 OA」）。

## What Changes

- **移除訂單印件列操作欄的「刪除（Trash）」按鈕**：無條件、所有訂單狀態下皆移除
  - 同步刪除 `OrderDetail.tsx` 相關程式碼與 `useErpStore` 內任何尚未實作的 `deletePrintItem` stub（若有）
- **新增訂單印件列操作欄的「編輯（Pencil）」按鈕**：非終態訂單下可見
  - 點擊開啟 `EditOrderPrintItemPanel`（沿用 `quote/EditPrintItemPanel.tsx` 的 Side Panel 樣式）
  - 依訂單狀態判定是否可編輯：
    - 可編輯：報價待回簽、已確認（含審稿中 / 合格 / 生產中 / 出貨中等非終態）
    - 不可編輯：已取消、訂單完成（終態）
- **新增訂單印件非金額屬性編輯白名單**：印件名稱、員工備註、免審稿 flag、印件檔案備註（clientNote）、預計產線、出貨方式、預計交貨日期、包裝說明
  - 規格與金額欄位（規格備註、難易度、購買數量、單位、報價單價）的可編輯性依 route-C § 訂單階段印件規格編輯時機（終態前可改），本 change 不重述、共用同一 `EditOrderPrintItemPanel` 入口
- **新增印件變更下游同步規則**：印件白名單欄位異動後，系統 SHALL 同步更新所有引用該印件的下游單據（工單、生產任務、出貨單）顯示值；下游單據 MUST NOT 保留印件欄位的獨立快照
- **新增訂單頂部「變更路徑導引」info icon**：於訂單詳情頁頂部「取消訂單」按鈕旁新增 info icon，hover 顯示對齊 route-C 兩階段的變更決策樹：「印件加項 / 減項（訂單未完成）→ 印件編輯 Panel 直接改數量 / 單價，應收即時重算｜金額變更（訂單已完成 / 取消）→ 建立訂單異動單（補收 / 退款）｜規格 / 非金額屬性 → 印件編輯 Panel｜全然取消訂單 → 點取消訂單」
- **驗證並修復「檢視（Eye）」按鈕**：
  - 在 Lovable 環境確認按鈕正確導向 `/print-items/:id`
  - 決定 Eye 按鈕與「印件名稱 link」功能重疊的處理：本 change 採用「**保留印件名稱 link、移除 Eye 按鈕**」以簡化互動（CEO 審查建議採納）
- **新增訂單印件列互動規格**：明列每個觸發點的用途、優先級、鎖定條件，為未來擴充（棄用流程、其他動作）保留清晰擴充點
- **新增 ActivityLog 記錄「印件編輯」事件**：每次成功編輯 SHALL 寫入 ActivityLog，記錄編輯者、編輯時間、修改欄位清單、修改前後值摘要

## Capabilities

### New Capabilities

（無新 capability）

### Modified Capabilities

- `order-management`：
  - 新增「訂單印件非金額屬性編輯」Requirement（非金額欄位白名單，編輯時機引用 route-C § 訂單階段印件規格編輯時機，不複寫金額 / 規格規則）
  - 新增「訂單印件列互動規格」Requirement（無 Trash、有 Pencil、無 Eye 的新互動清單）
  - 新增「訂單印件檢視入口驗證與簡化」Requirement（Eye 按鈕移除、印件名稱 link 為唯一檢視入口）

## Impact

- **Prototype 實作**：`sens-erp-prototype` repo
  - `src/pages/OrderDetail.tsx`：
    - 印件列操作欄移除 Trash 按鈕
    - 移除 Eye 按鈕
    - 新增 Pencil 按鈕 + 開啟 `EditOrderPrintItemPanel`
  - 新增 `src/components/order/EditOrderPrintItemPanel.tsx`：
    - 參考 `quote/EditPrintItemPanel.tsx` 結構與欄位
    - 金額 / 規格欄位的可編輯性依 route-C § 訂單階段印件規格編輯時機呈現（終態前可改、終態後唯讀）；本 change 補非金額屬性欄位
    - 依訂單 / 印件生命週期動態鎖定部分欄位
  - `src/store/useErpStore.ts`：新增 `updateOrderPrintItem(printItemId, changes, actor)` action，處理欄位更新 + ActivityLog 寫入
  - 移除相關未使用程式碼（原 Trash 按鈕 import、Eye 按鈕 import）
- **OpenSpec 規格**：`specs/order-management/spec.md` 擴充 Requirements
- **依賴關係**：
  - 本 change 的金額編輯規則對齊 route-C（refactor-order-receivable-refund-model，2026-06-02 已歸檔）§ 訂單階段印件規格編輯時機：終態前金額可直接改、終態後走 OrderAdjustment。訂單異動單機制由已歸檔的 refactor-order-adjustment-and-cleanup（2026-05-12）定義、內容已在 main spec
  - 本 change 交付後，原本規劃的 Change 2 `add-order-print-item-edit` 已內含於本 change，不再獨立開 change
  - 合格後改內容的「棄用 + 新建」流程獨立為後續 change `add-print-item-deprecate`（原 Change 3 改列為 Change 2）
- **不影響**：
  - 訂單異動單（OrderAdjustment）流程本身（由 refactor-order-adjustment-and-cleanup change 定義，非本 change 責任）
  - 訂單取消流程（已於 order-management spec 定義）
  - 報價單修改連動（業務路徑，不需系統自動化）
- **相關 OQ**：
  - **新 OQ 1**：訂單印件編輯時「預計交貨日期」若改至更早日期是否觸發急件費提示？（非本 change 範疇，列入追蹤）
  - **新 OQ 2**：訂單印件編輯時「出貨方式」變更是否影響運費重算？（非本 change 範疇）
  - **新 OQ 3**：生產中印件的「預計產線」變更是否允許（跨產線切換涉及工單轉移）？先採保守鎖定
  - **既存相關 OQ 狀態更新**：
    - [ORD-001 訂單取消連鎖流程](https://www.notion.so/32c3886511fa81629e1cfe27878e31dd)：金額減少路徑歷經兩次修訂，現行依 route-C —— 訂單未完成 → 印件編輯 Panel 直接調降（應收即時重算）；訂單完成 / 取消後 → 訂單異動單退款 / 補收。ORD-001 應結案註記此現行決議
    - [PI-002 打樣 NG 重建印件](https://www.notion.so/32d3886511fa8123a592c78223483225)（已決議；本 change 不涉及）
