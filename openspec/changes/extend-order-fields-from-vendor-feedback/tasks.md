## 1. 前置：OQ 與三視角審查

- [ ] 1.1 透過 oq-manage skill 將「線上單 case_name 自動生成規則」新增至 Notion Follow-up DB（assign-to = Miles、模組 = 訂單管理、優先度 = 中）
- [ ] 1.2 觸發三視角審查（senior-pm + ceo-reviewer + erp-consultant），對齊 proposal / design / specs；記錄審查結論至 design.md 補章節或 OQ
- [ ] 1.3 確認與進行中 change `add-after-sales-ticket` 對 OrderAdjustment 的擴充無衝突；若有衝突補 cross-reference
- [ ] 1.4 確認與進行中 change `extend-invoice-issuance-flexibility` 對 Invoice 的擴充無衝突；若有衝突補 cross-reference

## 2. Spec 主檔更新（archive 時自動合併，本階段先確認 delta 完整）

- [ ] 2.1 確認 `specs/order-management/spec.md` delta 涵蓋所有新增 / 修改 Requirement，與本 change 範圍一致
- [ ] 2.2 確認 `specs/state-machines/spec.md` delta 訂單上層狀態機 transition 正確
- [ ] 2.3 補 Data Model 至 order-management spec § Data Model 的新增欄位（Order 新增 contact_id、6 個 _without_tax 欄位、tax_amount、customer_note、internal_note、production_note）— 透過 sync 時合併
- [ ] 2.4 補 Data Model 至 order-management spec § Data Model 的新增子實體：Invoice 完整定義（含 ezpay_invoice_url）、SalesAllowanceFile、PaymentFile、OrderSignedFile
- [ ] 2.5 確認 OrderAdjustment.amount / OrderExtraCharge.amount / SalesAllowance.allowance_amount 補雙欄欄位（_without_tax）

## 3. Prototype TypeScript Type 與 Mock Data

- [ ] 3.1 `sens-erp-prototype/src/types/` 對應 Order type 補新欄位（contact_id、6 個 _without_tax 金額、tax_amount、customer_note / internal_note / production_note）
- [ ] 3.2 Prototype PrintItem type 補 unit 可編輯與 difficulty_level 可覆寫的 metadata（不需新欄位，updated_by / updated_at 已有 ActivityLog）
- [ ] 3.3 Prototype PaymentPlan type scheduled_date 標記為必填
- [ ] 3.4 Prototype Invoice type 首次完整定義（含 ezpay_invoice_url derived）
- [ ] 3.5 Prototype 新建 SalesAllowanceFile / PaymentFile / OrderSignedFile type
- [ ] 3.6 Mock data 既有 Order 補 6 個 _without_tax 欄位（= round(_with_tax / 1.05)）與 tax_amount
- [ ] 3.7 Mock data 既有 Order.notes 拆三欄（內容預設全進 internal_note，業務於 UAT 階段手動移轉）
- [ ] 3.8 Mock data 新增至少 2 筆 OrderSignedFile（綁定既有「已回簽」狀態的線下單）
- [ ] 3.9 Mock data 新增至少 1 筆 SalesAllowanceFile（綁定既有 SalesAllowance）
- [ ] 3.10 Mock data 新增至少 1 筆 PaymentFile（綁定既有 Payment）
- [ ] 3.11 Mock data 既有 PaymentPlan 補 scheduled_date（不可空）

## 4. Prototype UI — 訂單詳情頁

- [ ] 4.1 金額區雙欄顯示：線下單未稅為主顯（粗體大字）、含稅為輔；線上單反向；tax_amount 獨立一行
- [ ] 4.2 備註區依 order_source 條件顯示對應欄位（線上：customer_note 唯讀 + internal_note；線下：internal_note + production_note）
- [ ] 4.3 聯絡人區顯示 contact_id 對應的姓名 / 電話 / Email；線下單可切換、線上單唯讀
- [ ] 4.4 改派負責業務按鈕：未進入製作狀態時可用；製作後僅 Supervisor 可見
- [ ] 4.5 印件編輯按鈕條件切換：回簽前顯示「編輯」；回簽後改為「申請異動」並 link 至 OrderAdjustment 草稿建立
- [ ] 4.6 已取消訂單所有印件欄位唯讀
- [ ] 4.7 回簽檔案上傳區（OrderSignedFile）UI：列表 + 上傳 + 刪除 + 下載；上傳後自動推進訂單狀態

## 5. Prototype UI — 折讓 / 收款附件

- [ ] 5.1 折讓單詳情頁新增「回簽檔案」區（SalesAllowanceFile）：列表 + 上傳 + 刪除 + 下載
- [ ] 5.2 收款記錄詳情頁新增「對帳檔案」區（PaymentFile）：列表 + 上傳 + 刪除 + 下載

## 6. Prototype UI — 發票

- [ ] 6.1 移除發票表單上的「索取紙本」欄位（若 Prototype 既有）
- [ ] 6.2 訂單詳情頁發票區新增「下載發票」按鈕，點擊開啟 ezpay_invoice_url（mock 為固定 URL）

## 7. Prototype 計算邏輯

- [ ] 7.1 撰寫 `setAmount(field, value, mode)` helper：依 order_source 接收未稅 / 含稅輸入，自動寫入雙欄
- [ ] 7.2 撰寫 `recomputeOrderTotals()` helper：依各分項 _with_tax / _without_tax 加總更新 Order.total_with_tax / Order.total_without_tax / tax_amount
- [ ] 7.3 OrderAdjustment 執行時呼叫 recomputeOrderTotals()
- [ ] 7.4 訂單建立時依交期推算 internal_complete_date（= delivery_date − 1 day）；業務手動覆寫時記錄 ActivityLog
- [ ] 7.5 OrderSignedFile 上傳成功 callback 觸發訂單狀態推進邏輯（依正常 / 免審稿快速路徑）

## 8. Prototype 驗證情境

- [ ] 8.1 線下單範例：建立 → 報價 → 改派負責業務 → 上傳回簽檔案自動推進 → 印件回簽後申請異動 → OrderAdjustment 執行 → 雙欄金額正確同步
- [ ] 8.2 線上單範例：EC 同步含稅金額 → 系統反推未稅 → 訂單詳情頁含稅主顯 → 線上單聯絡人唯讀驗證
- [ ] 8.3 折讓流程：開立折讓單 → 上傳回簽檔案 → 雙欄 allowance_amount 寫入正確
- [ ] 8.4 收款流程：建立 Payment → 上傳對帳檔案 → PaymentPlan.scheduled_date 必填驗證
- [ ] 8.5 內部製作截止日：交期改變時 internal_complete_date 自動更新（除非已被手動覆寫）

## 9. Notion 收尾（archive 完成後執行）

- [ ] 9.1 將 26 個 Notion 訂單 BRD 討論串中本 change 涵蓋的項目補回應留言並標 resolved（含 ezpay 連結、聯絡人結論、PaymentPlan 必填、折讓 / 收款附件、雙欄計價、回簽自動推進、出貨單一對一、訂單類型範圍等）
- [ ] 9.2 訂單 BRD 主表內容更新（archive 完成後手動推送）：Section 1 補三類備註欄位、Section 3 雙欄金額、Section 4 PaymentPlan 必填、Section 5 移除 print_flag + 補 ezpay 連結 + 折讓回簽檔、Section 6 unit / difficulty_level 編輯說明
- [ ] 9.3 CLAUDE.md § Spec 規格檔清單版本更新（order-management v1.2 → v1.3，狀態：草稿 + 本 change 歸檔備註）

## 10. Archive 與後續

- [ ] 10.1 觸發 doc-audit skill 檢查跨檔案一致性
- [ ] 10.2 觸發 /opsx:verify 驗證實作完整
- [ ] 10.3 觸發 /opsx:archive 歸檔本 change（sync delta 至 main spec）
- [ ] 10.4 確認 Notion 「線上單 case_name 規則」OQ 已成功新增至 Follow-up DB（owner、優先度設定）
