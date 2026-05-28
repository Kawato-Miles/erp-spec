## Why

訂單詳情頁多個 Section 編輯時機過嚴：v1.7（[refine-order-detail-tabs](../archive/) 2026-05-21 歸檔）設計「製作前 / 製作後」雙閘門控，要求業務在製作後改任何資訊都得走「訂單異動 / 工單異動」流程，但實際業務情境是業務常需事後補上說明、補簽收檔案、調整客戶資訊。Miles Phase 1 探索識別到三問題：(1) 業務無法在訂單側直接調整印件規格、(2) 業務主管職責邊界與 spec line 2557 矛盾（user-roles spec 業務主管訂單模組 X 卻被列為「可編輯訂單備註」）、(3) 既有附件機制只支援「OrderSignedFile 回簽檔案」單一用途，沒有「其他訂單附件」機制。

本次解法：將 v1.7「製作前 / 製作後」時機門控降為僅「印件售價」一處保留；其餘 5 個 Section（訂單資訊 / 訂單備註 / 出貨資訊 / 發票設定 / 印件 Side Panel / 回簽檔案）統一為「訂單未取消即可編輯」粗粒度規則；印件規格異動仍可直接改但推系統自動通知（in-app + ActivityLog）給工單負責印務 + 印務主管 + 訂單管理人，承擔印務感知責任；新增 OrderAttachment 實體承載「其他訂單附件」上傳（free-text 用途）。**保留 v1.7「金額 / 規格分開動線」核心理念**（議題 5 拍板分兩步處理：規格 → Side Panel；金額 → Tab 5 OA）。

**權責邊界明確化**（Miles 拍板）：業務負責訂單中的資訊（含 PrintItem），印務負責工單中的資訊（含 ProductionTask / 製程 / 材料規格），兩者修改的內容互不重疊。印務發現製程問題時通知業務由業務在 Side Panel 改 PrintItem；印務的工單異動流程不再回寫 PrintItem.spec_note（廢止 spec line 2018 既有動線）。

本 change 連帶解 [[ORD-005]] 訂單階段備註欄位編輯權限 + [[ORD-006]] 訂單階段備註欄位編輯時機 兩個既存 OQ，並修正 spec line 2557 業務主管編輯訂單備註與 user-roles spec 矛盾的歷史問題。

## What Changes

### MODIFIED Requirement（5 條）

- **訂單階段印件規格編輯時機**（spec line 2002）：階段一 / 階段二界線改寫為「未取消 vs 已取消」；廢止「印務從工單異動處理印件規格」動線；新增「業務 Side Panel 直接編輯 + 系統推通知」動線
- **訂單詳情頁印件清單表格結構**（spec line 538）：操作欄「編輯印件」按鈕條件從 `isBeforeProduction` 改為 `order.status !== '已取消'`；售價欄維持「製作前可編輯」門控
- **訂單階段訂單備註編輯權限與時機**（spec line 2555）：編輯時機從 `completed_at IS NULL` 改為 `order.status !== '已取消'`；**移除「業務主管可編輯」row**（對齊 user-roles spec 粗粒度權限）；補「Supervisor 唯讀 / 會計唯讀」明示
- **OrderSignedFile 訂單回簽附件**（spec line 2330）：補 Scenario「製作後 / 訂單完成後皆可追加上傳，僅已取消訂單禁止」
- **訂單其他費用明細（OrderExtraCharge）**（spec line 1639）：補 Scenario「製作後 OrderExtraCharge 編輯按鈕 disabled，金額異動須走 Tab 5 OA」（明文化既有 UX，移除 toast 引導）

### ADDED Requirement（3 條）

- **訂單詳情頁編輯型 Section 統一編輯時機與角色**：總則型 Requirement，列出 4 個 Section（訂單資訊 / 訂單備註 / 出貨資訊 / 發票設定）編輯時機統一為 `order.status !== '已取消'`；角色清單對齊 user-roles spec 粗粒度模組權限（業務 / 諮詢 / 訂單管理人 R/W、Supervisor 唯讀、會計細粒度唯讀、業務主管無權）
- **訂單其他附件上傳**：新增 OrderAttachment 實體（5 欄位含 purpose_note free-text）；任何狀態（不含已取消）可上傳；統一一個附件清單不分桶；與 AfterSalesTicket 附件並存不訂邊界
- **製作後印件規格異動系統自動通知**：業務於 Side Panel 編輯 `spec_note` / `pi_ordered_qty` / `unit` / `difficulty_level` 時系統推 in-app 通知 + ActivityLog `print_item_spec_modified_in_production`；通知對象 = 工單負責印務 + 印務主管 + 訂單管理人；訂單管理人為空時 fallback = 業務 + 工單負責印務 + 印務主管

### 砍掉的範疇

- **規格異動審核流程節點**：不引入印務確認閘（議題 1 拍板方案 C 直接通知）
- **樂觀鎖 / version 欄位**：prototype 階段不引入（並行衝突反向情境留待累積 ≥ 3 次案例後評估）
- **Side Panel 編輯與工單異動並行衝突防呆**：Miles 最終決策 — 印務不可編輯 PrintItem（職責邊界明確化）所以根本沒有並行衝突風險
- **附件用途 LOV**：保留 free-text；新 OQ ORD-019 上線前驗證是否轉 LOV
- **事後補登 ActivityLog 標籤**：Miles 議題 3 拍板不加；activity log 內容定義另開 change
- **訂單附件 vs 售後 ticket 附件邊界規範**：Miles 反向挑戰 3 拍板不訂明、來源並存
- **規格 + 售價合併動線**：Miles 議題 5 拍板分兩步操作

## Capabilities

### New Capabilities

無（OrderAttachment 屬 order-management capability 內 Data Model 新增）

### Modified Capabilities

- `order-management`：5 MODIFIED + 3 ADDED Requirement；spec v1.12 → v1.13

## Impact

### Spec 影響

- `openspec/specs/order-management/spec.md`：v1.12 → v1.13，含 5 MODIFIED + 3 ADDED Requirement + 新增 OrderAttachment Data Model
- `openspec/specs/user-roles/spec.md`：不修訂（既有「Supervisor 唯讀模式」+「會計細粒度唯讀」已涵蓋；業務主管移除訂單備註編輯權後對齊既有 spec line 94「業務主管訂單模組 X」）
- `openspec/specs/work-order/spec.md`：不修訂（既有工單異動流程僅改工單 / 生產任務 / 製程 / 材料規格，本來就不寫 PrintItem；Miles 拍板「印務不寫 PrintItem」對齊既有 spec）

### Prototype 影響

- `src/pages/OrderDetail.tsx`：5 處編輯按鈕條件調整 + 1 處新增其他附件區
- `src/components/order/EditOrderPrintItemPanel.tsx`：`allDisabled` 邏輯從「終態訂單」改為「只看已取消」；`canEditAmount` 維持 `isBeforeProduction` 門控
- `src/components/order/OrderInfoEditDialog.tsx` / `OrderNotesEditDialog.tsx` / `ShippingInfoEditDialog.tsx` / `InvoiceSettingEditDialog.tsx`：確認內部沒有額外狀態鎖定
- `src/types/orderAttachment.ts`：新增（OrderAttachment 型別）
- `src/store/useErpStore.ts`：新增 orderAttachments slice + selector + actions
- `src/components/order/OrderAttachmentSection.tsx`：新增（Tab 9 其他附件區元件）
- `src/components/order/OrderAttachmentUploadDialog.tsx`：新增（上傳 dialog + 用途 free-text）
- `src/lib/order/orderPermissions.ts`：新增（`canEditOrderSection` / `canEditPrintItemInSidePanel` / `canEditPrintItemPrice` 三個 helper）

### Vault OQ 影響

- **[[ORD-005]]**：archive 時觸發 oq-manage mode C 解答（決議：對齊 user-roles spec 粗粒度權限）
- **[[ORD-006]]**：archive 時觸發 oq-manage mode C 解答（決議：「訂單未取消即可編輯」粗粒度規則）
- **[[ORD-014]]**：保留現況不動（本 change 不涉及）
- **新 OQ ORD-019**：附件用途 free-text 上線前驗證是否轉 LOV；archive 時觸發 oq-manage mode B 開立

### 連動 User Story 新增（2 條）

由 archive 前觸發 erp-user-story skill mode A 新增：

- US-ORD-NNN「業務於製作後修改印件規格觸發系統自動通知」
- US-ORD-NNN「業務上傳訂單其他附件並標註用途」

## Open Questions

- **新 OQ ORD-019**：附件用途 free-text 上線前驗證是否轉 LOV — 累積 ≥ 20 筆 OrderAttachment.purpose_note 樣本後由 Miles 判定
