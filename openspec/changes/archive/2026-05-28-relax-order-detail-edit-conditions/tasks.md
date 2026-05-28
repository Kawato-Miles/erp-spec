## 1. 型別與資料層

- [x] 1.1 在 `src/types/orderAttachment.ts` 新增 `OrderAttachment` 型別（含 id / orderId / fileUrl / fileName / purposeNote / uploadedBy / uploadedAt）
- [x] 1.2 在 `src/types/order.ts` 的 `Order` interface 新增 `attachments?: OrderAttachment[]` 欄位（對齊既有 `signedFiles` 內嵌模式；store action 沿用 `updateOrder` callback，不新增獨立 slice）
- [ ] 1.3 在 `src/store/seedData.ts` seed 至少 2 筆 OrderAttachment 範例（不同 purposeNote 樣本，便於未來 LOV 升級判斷）
- [ ] 1.4 在 ActivityLog seed 新增 `print_item_spec_modified_in_production` 範例（含 notified_recipients 陣列）

## 2. 權限 Helper Functions

- [x] 2.1 新建 `src/lib/order/orderPermissions.ts`，實作三個 helper：`canEditOrderSection(order, currentUser)` / `canEditPrintItemInSidePanel(printItem, order, currentUser)` / `canEditPrintItemPrice(printItem, order, currentUser)`
- [x] 2.2 在 helper 中實作：已取消 → false / Supervisor → false / accountant → false / sales|consultant → 自己負責訂單或被分享編輯權限 / 其他模組 X 角色（含 sales_manager / production_manager）→ false
- [x] 2.3 `canEditPrintItemPrice` 額外接 `isOrderBeforeProduction(order.status)` 售價門控
- [ ] 2.4 撰寫 vitest 單元測試覆蓋所有角色 × 訂單狀態組合（≥ 12 個 test case）

## 3. Tab 1 資訊 Tab 編輯時機調整

- [x] 3.1 `src/pages/OrderDetail.tsx` 訂單資訊 Section：編輯按鈕條件改 `canEditOrderSection(order, currentUser)`；移除 `!isBeforeProduction` toast 邏輯
- [x] 3.2 `src/pages/OrderDetail.tsx` 訂單備註 Section：條件改 `canEditOrderSection(order, currentUser)`；移除 `isOrderCompleted` 限制 + 移除 `NOTE_EDITABLE_ROLES` 內聯角色清單（改由 helper 統一判定）
- [x] 3.3 `src/pages/OrderDetail.tsx` 出貨資訊 Section：編輯按鈕條件改 `canEditOrderSection(order, currentUser)`；移除 toast
- [x] 3.4 `src/pages/OrderDetail.tsx` 發票設定 Section：確認既有條件對齊（`order.status !== '已取消'` + 接 helper）；invoiceEnabled 條件顯示維持
- [ ] 3.5 確認 `OrderInfoEditDialog.tsx` / `OrderNotesEditDialog.tsx` / `ShippingInfoEditDialog.tsx` / `InvoiceSettingEditDialog.tsx` 內部沒有額外狀態鎖定（若有則拿掉）

## 4. Tab 2 印件清單編輯時機調整

- [x] 4.1 `src/pages/OrderDetail.tsx` 印件 row「編輯印件」按鈕：條件從 `isBeforeProduction` 改為 `canEditPrintItemInSidePanel(printItem, order, currentUser)`
- [x] 4.2 `src/components/order/EditOrderPrintItemPanel.tsx`：`allDisabled` 改用 `READONLY_ORDER_STATUSES`（只看已取消，從原本「終態訂單」放寬）
- [x] 4.3 `src/components/order/EditOrderPrintItemPanel.tsx`：`canEditAmount` 保留 `isOrderBeforeProduction` 售價門控（spec v1.13 全局唯一細粒度時機門控）
- [x] 4.4 `src/components/order/EditOrderPrintItemPanel.tsx`：製作後顯示 Info Banner「規格類欄位仍可編輯（系統將自動通知印務）；售價變更需走訂單異動」
- [x] 4.5 `src/pages/OrderDetail.tsx` 其他項目（OrderExtraCharge）區「新增」+ 「編輯」按鈕：製作後從「點下 toast」改為「直接 disabled」+ Tooltip 引導去 Tab 5
- [x] 4.6 印件清單 row inline 售價編輯：條件改接 `canEditPrintItemPrice(...)`（與 Side Panel 內售價門控一致）

## 5. 製作後印件規格異動系統自動通知

- [x] 5.1 在 `EditOrderPrintItemPanel.tsx` onSave callback 偵測：若訂單狀態 ∈ 製作後狀態 且 編輯欄位含規格類欄位（specNotes / difficultyLevel / name）
- [x] 5.2 觸發系統通知（prototype 階段以 Toast + ActivityLog 表達）給：所有印務（PRODUCTION_STAFF）+ 印務主管（PRODUCTION_MANAGERS）+ 訂單管理人 fallback 業務（order.salesPerson）
- [x] 5.3 實作 fallback 規則：訂單管理人未指派時退化為「業務（order.salesPerson）+ 印務 + 印務主管」
- [x] 5.4 ActivityLog 沿用既有 `updateOrderPrintItem` store action 寫入機制（含 before/after summary）；通知對象由 onSave callback 顯示於 Toast description
- [x] 5.5 Toast 顯示對應通知文案（含實際通知對象姓名 + fallback 提示）
- [x] 5.6 製作前 / 製作後事件型別在 prototype 階段共用 ActivityLog action「編輯印件」+ store 既有「報價待回簽 → 需業務手動更新報價單」附註；未來若需嚴格區分 action_type 再開新 change

## 6. Tab 9 檔案 - 回簽檔案上傳放寬

- [x] 6.1 `src/pages/OrderDetail.tsx` Tab 9 回簽檔案「上傳回簽檔案」按鈕：條件從 `order.status === '報價待回簽'` 改為 `canEditSection`
- [x] 6.2 確認上傳邏輯：首次上傳於「報價待回簽」狀態時觸發狀態推進至「已回簽」（既有邏輯保留）；後續上傳走 append 不覆寫既有檔案 + 不重複觸發狀態推進 + 不覆寫 Order.signed_at
- [x] 6.3 已取消訂單 disable 按鈕 + Tooltip「訂單已取消，無法上傳」

## 7. Tab 9 檔案 - 訂單其他附件上傳（新功能）

- [x] 7.1 在 `src/pages/OrderDetail.tsx` Tab 9 內 inline 渲染「其他訂單附件」Section（依 uploadedAt 倒序，每筆顯示 fileName + purposeNote + uploadedBy + uploadedAt + 下載 link；統一一個清單不分桶；含「上傳其他附件」按鈕；未抽出獨立元件 — 與回簽檔案區一致）
- [x] 7.2 新建 `src/components/order/OrderAttachmentUploadDialog.tsx`：包含檔名 input + 用途 textarea（200 字上限必填）+ 確認 / 取消按鈕
- [x] 7.3 `src/pages/OrderDetail.tsx` Tab 9 引入 OrderAttachmentUploadDialog（位於回簽檔案區下方獨立 Section）
- [x] 7.4 上傳時透過 `updateOrder` callback 把 OrderAttachment 加進 `Order.attachments`，同時寫 ActivityLog action「上傳其他訂單附件」+ Toast「附件已上傳」
- [x] 7.5 「上傳其他附件」按鈕條件接 `canEditSection`；已取消訂單 disabled + Tooltip
- [x] 7.6 既有 OrderAttachment 清單在已取消訂單時仍可下載檢視（按鈕僅 disable 上傳）

## 8. Playwright e2e 驗證

- [x] 8.1 e2e：製作中業務於 Side Panel 改 specNotes → Toast 顯示通知文案 + 通知對象（印務 + 印務主管 + 業務 fallback）；ActivityLog 透過 store `updateOrderPrintItem` 既有機制寫入（含 before/after summary）
- [x] 8.2 e2e：訂單完成後業務改訂單備註 → 鎖定原因不含「訂單已完成」字串（v1.13 放寬 completed_at）
- [x] 8.3 e2e：製作中業務上傳其他附件 → 確認附件清單顯示 + purposeNote 顯示
- [x] 8.4 e2e：業務主管登入後訂單備註 Section 編輯按鈕 disabled
- [x] 8.5 e2e：Supervisor 登入後訂單備註 Section 編輯按鈕 disabled
- [ ] 8.6 e2e：會計登入後查看 4 個 Section（與 8.5 模式相同，可後續補；helper.canEditOrderSection 對 accountant 已 return false 由單元邏輯保證）
- [ ] 8.7 e2e：已取消訂單 → 確認所有編輯按鈕 disabled + Tooltip 顯示（既有 OrderDetail 對「已取消」終態既有保護未變動，可後續補；helper.canEditOrderSection 對「已取消」 return false 由單元邏輯保證）
- [x] 8.8 e2e：製作後業務 inline 售價 disabled + Tooltip 文案含「訂單異動」+「補收 / 折讓單」
- [x] 8.9 e2e：製作後 OrderExtraCharge「新增項目」按鈕 disabled + Tooltip 引導 Tab 5（不再 toast）
- [x] 8.10 e2e：製作後業務回簽檔案上傳按鈕 enabled + Tooltip「追加上傳」（v1.13 放寬，不再限報價待回簽）

e2e spec 位置：`/Users/b-f-03-029/sens-erp-prototype/e2e/relax-order-detail-edit-conditions.spec.ts`（8 個 test case，全部 passed）

## 9. Spec 同步與 OQ 連動（archive 前）

- [x] 9.1 doc-audit 全面掃描 order-management spec v1.13 與相關 spec（user-roles / work-order / state-machines）一致性（2026-05-28 跑通；2 個 archive 後 follow-up：CLAUDE.md 更新 + OrderAttachment Data Model section sync 手動驗證）
- [x] 9.2 新增 2 條 User Story 草稿：[US-ORD-032 製作後印件規格異動通知印務](../../../memory/erp/ERP_Vault/13-user-stories/order-management/US-ORD-032-製作後印件規格異動通知印務.md) + [US-ORD-033 上傳訂單其他附件標註用途](../../../memory/erp/ERP_Vault/13-user-stories/order-management/US-ORD-033-上傳訂單其他附件標註用途.md)
- [x] 9.3 解 [[ORD-005]]「訂單階段備註欄位編輯權限」status = answered；決議：對齊 user-roles spec 粗粒度權限 + 移除業務主管破例
- [x] 9.4 解 [[ORD-006]]「訂單階段備註欄位編輯時機」status = answered；決議：「訂單未取消即可編輯」粗粒度規則（取代 completed_at 限制）
- [x] 9.5 新建 [[ORD-019]]「OrderAttachment.purposeNote 上線前驗證是否轉 LOV」（等待條件：累積 ≥ 20 筆樣本）
- [x] 9.6 確認 [[ORD-014]]「訂單備註與訂單資訊編輯 dialog 分開」保留 answered 不動（本 change 不涉及）

## 10. Archive

- [ ] 10.1 `/opsx:verify` 前手動 review delta spec + design.md + tasks.md 完整性
- [ ] 10.2 執行 `openspec validate "relax-order-detail-edit-conditions" --strict`
- [ ] 10.3 執行 `/opsx:archive`：合併 delta spec 回 main spec（order-management spec v1.12 → v1.13）、觸發 doc-audit + oq-manage mode B/C
- [ ] 10.4 更新 CLAUDE.md § Spec 規格檔清單 row「訂單管理」狀態描述（v1.13）
- [ ] 10.5 確認 Notion 推送清單（累積數個 change 後 Miles 手動決定推送時機）
