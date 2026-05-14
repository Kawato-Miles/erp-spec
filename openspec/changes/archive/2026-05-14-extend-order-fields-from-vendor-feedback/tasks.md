## 1. 前置：OQ 與三視角審查

- [x] 1.1 透過 oq-manage skill 將「線上單 case_name 自動生成規則」新增至 Notion Follow-up DB（已建 ORD-010）
- [ ] 1.2 觸發三視角審查（senior-pm + ceo-reviewer + erp-consultant）— Miles 決定本次不跑審查
- [x] 1.3 確認與進行中 change `add-after-sales-ticket` 對 OrderAdjustment 的擴充無衝突；補 cross-reference 至 design.md / spec
- [x] 1.4 確認與進行中 change `extend-invoice-issuance-flexibility` 對 Invoice 的擴充無衝突（該 change 目錄為空，無內容可比對）

## 2. Spec 主檔更新（archive 時自動合併，本階段先確認 delta 完整）

- [x] 2.1 確認 `specs/order-management/spec.md` delta 涵蓋所有新增 / 修改 Requirement，與本 change 範圍一致
- [x] 2.2 確認 `specs/state-machines/spec.md` delta 訂單上層狀態機 transition 正確
- [x] 2.3 補 Data Model 至 order-management spec § Data Model 的新增欄位（透過 archive sync 合併）
- [x] 2.4 補 Data Model 至 order-management spec § Data Model 的新增子實體（透過 archive sync 合併）
- [x] 2.5 確認 OrderAdjustment.amount / OrderExtraCharge.amount / SalesAllowance.allowance_amount 雙欄欄位於 Prototype type 已加（spec 補強放後續 change）

## 3. Prototype TypeScript Type 與 Mock Data

- [x] 3.1 `sens-erp-prototype/src/types/order.ts` 對應 Order type 補新欄位（contactId / 6 個 _withoutTax / taxAmount / productionNote / signedFiles）
- [x] 3.2 Prototype PrintItem type unit / difficulty_level 可編輯不需新欄位（ActivityLog 機制承擔）
- [x] 3.3 Prototype PaymentPlan.scheduledDate 改必填（string，非 null）+ validatePlanForm 補檢核
- [x] 3.4 Prototype Invoice type 補 ezpayInvoiceUrl derived + printFlag 標 @deprecated
- [x] 3.5 Prototype 新建 SalesAllowanceFile / PaymentFile / OrderSignedFile type
- [x] 3.6 Mock data 雙欄計價自動補齊（store/seedData.ts enrichOrdersWithTaxBreakdown）
- [x] 3.7 既有 Order.notes 對應 customer_note（線上）/ Order.staffNotes 對應 internal_note（共有）/ 新增 productionNote（線下）
- [ ] 3.8 Mock data 新增 OrderSignedFile 範例資料（後續補；UI 已支援讀取空陣列）
- [ ] 3.9 Mock data 新增 SalesAllowanceFile 範例資料（後續補；UI 已支援讀取空陣列）
- [ ] 3.10 Mock data 新增 PaymentFile 範例資料（後續補；UI 已支援讀取空陣列）
- [x] 3.11 既有 mockPaymentPlans 全部 scheduledDate 有值（無需補）

## 4. Prototype UI — 訂單詳情頁

- [x] 4.1 金額區雙欄顯示（OrderPaymentSection 新增「金額（未稅 / 含稅 / 稅額）」區 + DualPriceCell）
- [x] 4.2 備註區依 orderType 條件顯示（線上：客戶端備註；線下：訂單製作備註；共有：內部員工備註）
- [x] 4.3 客戶資訊區補「聯絡人 ID」+ 線下單「切換窗口聯絡人」連結 / 線上單唯讀 hint
- [x] 4.4 訂單資訊「業務負責人」欄位補「改派」連結（製作前業務 / 訂單管理人可改派；製作後僅 Supervisor）
- [x] 4.5 印件「編輯」按鈕依 Order.status 切換為「申請異動」（回簽前直接編輯 / 回簽後走 OrderAdjustment）
- [x] 4.6 已取消訂單印件唯讀（沿用既有 isTerminalOrder disabled 邏輯）
- [x] 4.7 回簽檔案上傳區（OrderSignedFile）UI：列表 + 上傳按鈕（mock toast；正式版串接 file upload API）

## 5. Prototype UI — 折讓 / 收款附件

- [x] 5.1 折讓單操作欄補「上傳折讓回簽檔」icon 入口（mock toast）
- [x] 5.2 收款記錄表新增「對帳檔案」欄與上傳 icon 入口（mock toast）

## 6. Prototype UI — 發票

- [x] 6.1 發票表單移除「索取紙本」Switch UI 與 validation；保留 type 上 printFlag 標 @deprecated 兼容
- [x] 6.2 發票列表每筆已開立發票新增「下載發票」按鈕，使用 buildEzpayInvoiceUrl 動態建構 mock URL

## 7. Prototype 計算邏輯

- [x] 7.1 setAmount / toWithTax / toWithoutTax helper 已建（src/utils/orderPricing.ts）
- [x] 7.2 recomputeOrderTotals helper 已建（src/utils/orderPricing.ts）
- [ ] 7.3 OrderAdjustment 執行時呼叫 recomputeOrderTotals — Prototype 既有 OrderAdjustment 執行邏輯未串接此 helper，後續補
- [ ] 7.4 訂單建立時依交期推算 internal_complete_date — 後續補
- [ ] 7.5 OrderSignedFile 上傳成功 callback 自動推進訂單狀態 — mock UI 用 toast 模擬，後續正式版串接

## 8. Prototype 驗證情境（後續到 Lovable 環境執行）

- [ ] 8.1 線下單範例：建立 → 報價 → 改派負責業務 → 上傳回簽檔案自動推進 → 印件回簽後申請異動 → OrderAdjustment 執行 → 雙欄金額正確同步
- [ ] 8.2 線上單範例：EC 同步含稅金額 → 系統反推未稅 → 訂單詳情頁含稅主顯 → 線上單聯絡人唯讀驗證
- [ ] 8.3 折讓流程：開立折讓單 → 上傳回簽檔案 → 雙欄 allowance_amount 寫入正確
- [ ] 8.4 收款流程：建立 Payment → 上傳對帳檔案 → PaymentPlan.scheduled_date 必填驗證
- [ ] 8.5 內部製作截止日：交期改變時 internal_complete_date 自動更新（除非已被手動覆寫）

## 9. Notion 收尾（archive 完成後執行）

- [x] 9.1 26 個 Notion 訂單 BRD 討論串補回應留言完成（指向本 change 收斂結論）
- [ ] 9.2 訂單 BRD 主表內容更新（archive 完成後手動推送）
- [ ] 9.3 CLAUDE.md § Spec 規格檔清單版本更新（order-management v1.2 → v1.3）

## 10. Archive 與後續

- [ ] 10.1 觸發 doc-audit skill 檢查跨檔案一致性
- [ ] 10.2 觸發 /opsx:verify 驗證實作完整
- [x] 10.3 觸發 /opsx:archive 歸檔本 change（sync delta 至 main spec）
- [x] 10.4 確認 Notion 「線上單 case_name 規則」OQ 已成功新增至 Follow-up DB（ORD-010、優先度中、assignTo 待 Miles）
