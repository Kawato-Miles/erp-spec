## Why

此 change 解決訂單詳情頁印件清單的兩個原始痛點：
1. **刪除按鈕沒反應**：`OrderDetail.tsx:580-582` 的 Trash 按鈕未掛 onClick，使用者點擊看似無反應（實為事件冒泡至 `ErpExpandableRow` 的 onToggle）
2. **不知道如何編輯印件**：訂單頁缺少編輯入口，業務想改印件的「製作細節、規格備註、交期」等非金額欄位時無路徑

經與 Miles 釐清業務規則後，兩個痛點的正解並非「修復刪除 + 同時支援編輯」，而是：

- **刪除按鈕應直接移除**：印件在訂單已確認（回簽）後的任何生命週期變更，業務路徑皆不經「印件層刪除」：
  - 金額減少（抽掉印件）→ 走「取消訂單 + 重新走需求單報價」流程（[ORD-001 已決議](https://www.notion.so/32c3886511fa81629e1cfe27878e31dd)）
  - 金額增加（追加印件）→ 走「補收款訂單新增印件項目」流程
  - 規格變更（不影響金額）→ 走本 change 新增的「編輯印件」流程
  - 合格後改內容 → 走「棄用 + 新建」流程（Change 2 `add-print-item-deprecate` 將承接）
  - 業務誤建 / 建單錯誤 → 走「取消訂單 + 重新走需求單」（由 Miles 明定的處理路徑）
  
  由於**沒有任何合法情境**需要印件層直接刪除，保留 Trash 按鈕（無論是實作刪除、disabled、或改為導引）都只會誤導業務與累積互動債。最乾淨的解法是**完全移除**。

- **編輯按鈕應新增**：依 Miles 明定規則「非金額類可編輯，金額類不可編輯」，新增 Pencil 編輯按鈕開啟編輯 Panel，白名單限制編輯範圍於非金額欄位。
- **印件為 source of truth、訂單為唯一編輯入口**：印件資料貫穿訂單、工單、生產任務、出貨單，為確保變更源頭單一，系統 SHALL 僅在訂單詳情頁提供印件編輯入口，下游單據（工單、出貨單等）只讀印件；印件內容異動時，下游單據 SHALL 自動同步最新值。
- **金額變更統一走補收款**：補收款訂單支援正負項，金額增加建立正值補收款、金額減少建立負值補收款（退款）；僅「客戶要求全然取消訂單」或「業務誤建整筆訂單」才走取消訂單流程。

## What Changes

- **移除訂單印件列操作欄的「刪除（Trash）」按鈕**：無條件、所有訂單狀態下皆移除
  - 同步刪除 `OrderDetail.tsx` 相關程式碼與 `useErpStore` 內任何尚未實作的 `deletePrintItem` stub（若有）
- **新增訂單印件列操作欄的「編輯（Pencil）」按鈕**：非終態訂單下可見
  - 點擊開啟 `EditOrderPrintItemPanel`（沿用 `quote/EditPrintItemPanel.tsx` 的 Side Panel 樣式）
  - 依訂單狀態判定是否可編輯：
    - 可編輯：報價待回簽、已確認（含審稿中 / 合格 / 生產中 / 出貨中等非終態）
    - 不可編輯：已取消、訂單完成（終態）
- **新增訂單印件編輯欄位白名單**：
  - **可編輯**（非金額類）：印件名稱、難易度、免審稿 flag、規格備註、印件檔案備註（clientNote）、預計產線、出貨方式、預計交貨日期、包裝說明、員工備註
  - **唯讀（金額類）**：購買數量、單位、成本總額（costEstimate）、報價總額（pricePerUnit）
  - Panel 中金額類欄位 SHALL 以 disabled 呈現，並於該區塊下方顯示引導文字：「金額變更請走：建立補收款訂單（支援正負項處理增減）」
- **新增印件變更下游同步規則**：印件白名單欄位異動後，系統 SHALL 同步更新所有引用該印件的下游單據（工單、生產任務、出貨單）顯示值；下游單據 MUST NOT 保留印件欄位的獨立快照
- **新增訂單頂部「變更路徑導引」info icon**：於訂單詳情頁頂部「取消訂單」按鈕旁新增 info icon，hover 時顯示業務變更決策樹：「印件加項 → 建立補收款（正值）｜印件減項 → 建立補收款（負值 / 退款）｜規格改動（不影響金額）→ 點印件列編輯按鈕｜全然取消訂單 → 點取消訂單」
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
  - 新增「訂單印件編輯」Requirement（編輯範疇、欄位白名單、生命週期限制、ActivityLog 記錄）
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
    - 金額類欄位 disabled + 說明文字
    - 依訂單 / 印件生命週期動態鎖定部分欄位
  - `src/store/useErpStore.ts`：新增 `updateOrderPrintItem(printItemId, changes, actor)` action，處理欄位更新 + ActivityLog 寫入
  - 移除相關未使用程式碼（原 Trash 按鈕 import、Eye 按鈕 import）
- **OpenSpec 規格**：`specs/order-management/spec.md` 擴充 Requirements
- **依賴關係**：
  - 本 change 交付後，原本規劃的 Change 2 `add-order-print-item-edit` 已內含於本 change，不再獨立開 change
  - 合格後改內容的「棄用 + 新建」流程獨立為後續 change `add-print-item-deprecate`（原 Change 3 改列為 Change 2）
- **不影響**：
  - 金額連動 / 補收款流程（已有路徑，非本 change 責任）
  - 訂單取消流程（已於 order-management spec 定義）
  - 報價單修改連動（業務路徑，不需系統自動化）
- **相關 OQ**：
  - **新 OQ 1**：訂單印件編輯時「預計交貨日期」若改至更早日期是否觸發急件費提示？（非本 change 範疇，列入追蹤）
  - **新 OQ 2**：訂單印件編輯時「出貨方式」變更是否影響運費重算？（非本 change 範疇）
  - **新 OQ 3**：生產中印件的「預計產線」變更是否允許（跨產線切換涉及工單轉移）？先採保守鎖定
  - **既存相關 OQ**：
    - [ORD-001 訂單取消連鎖流程](https://www.notion.so/32c3886511fa81629e1cfe27878e31dd)（已決議；本 change 沿用其精神）
    - [PI-002 打樣 NG 重建印件](https://www.notion.so/32d3886511fa8123a592c78223483225)（已決議；本 change 不涉及）
