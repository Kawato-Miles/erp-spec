# Phase 3 資料欄位 DB delta worklist（2026-06-03）

正本 = OpenSpec `order-management/spec.md` § Data Model（Phase 0.5 補齊後）。
對外面 = Notion 資料欄位 DB（`32c3886511fa803e9f30edbb020d10ce`，data source `collection://32c38865-11fa-806e-a150-000b003e9f71`）。

## A. 資料表 enum 差集（正本訂單域實體 vs Notion enum）

Notion 現有訂單域 enum：`Order`、`OrderItem`、`PrintItem`、`PrintItemFile`、`OrderPaymentRecord`（舊）。

| 正本實體 | Notion enum 狀態 | 動作 | 欄位數 |
|---------|-----------------|------|-------|
| Payment（收款紀錄）| 無（僅舊 OrderPaymentRecord）| ADD enum + create 欄位 | 18 |
| PaymentAllocation（收款核銷分配）| 無 | ADD enum + create 欄位 | 8 |
| BillingInstallment（請款期次）| 無 | ADD enum + create 欄位 | 22 |
| OrderAdjustment（訂單異動）| 無 | ADD enum + create 欄位 | 16 |
| OrderAdjustmentItem（訂單異動明細項）| 無 | ADD enum + create 欄位 | 7 |
| OrderExtraCharge（訂單其他費用）| 無 | ADD enum + create 欄位 | 7 |
| BillingActivityEvent（訂單結構化活動事件）| 無 | ADD enum + create 欄位 | 5 |
| SalesAllowance（折讓單）| 無 | ADD enum + create 欄位 | 15 |
| OrderPaymentRecord（舊平面付款）| 有（無欄位列）| 標廢止 or 刪除（待 Miles）| — |

新增欄位列合計 ≈ 98。

### 範圍邊界外（正本有、本計畫帳務範圍外，待 Miles 決定是否納入）
Invoice、InvoiceItem、OrderAttachment、OrderSignedFile、SalesAllowanceFile、PaymentFile、PrintItemExpectedLine — 屬 5/26 發票族 + vendor-feedback 附件族，非「5/22 帳務重構」核心。

## B. Order 實體欄位 delta

### B1. 過時處理（計畫明列）
| 欄位 | 現況 | 動作 |
|------|------|------|
| payment_status | 備註「待 ORD-002」過時 OQ 註記 | 清註記 + 補 derived 說明（依未取消已完成 Payment 累計推導）|
| payment_method | 無過時標示 | 標 route-C 遺留（新模型不寫入，事實見 Payment）|
| paid_at | 無過時標示 | 同上 |
| payment_detail | 無過時標示 | 同上 |

### B2. Order 缺漏欄位（廣域 gap，源自 5/07 billing-company / 雙欄稅 / vendor-feedback；計畫未明列，待 Miles 決定本次補 or 另案）
billing_company_id、approved_by_sales_manager_id、approval_required、case_name、linked_consultation_request_id、payment_terms_note、lastApprovedPaymentTermsNote、submitted_for_review_at、quote_sent_at、source_order_id、subtotal_without_tax、other_fee_without_tax、shipping_fee_without_tax、consult_fee_without_tax、discount_without_tax、total_without_tax、tax_amount、tax_rate、internal_note、production_note、contact_id（≈ 21 欄）

## C. 唯一鍵
以 `(資料表 + 英文名稱)` 配對；存在 update、不存在 create。回填不適用（資料欄位 DB 無 Vault 正本卡，正本在 OpenSpec）。

## 推送進度（執行時勾選）
- [x] enum ADD（8 帳務實體，2026-06-03；既有 21 選項全保留）
- [x] 新實體欄位 create（8 實體 **106 列**，非 worklist 原估 98；senior-pm 指正後以正本逐列為準）
- [x] Order 過時處理（B1）：payment_status 清「待 ORD-002」補 derived 說明；payment_method / paid_at / payment_detail 標 route-C 遺留
- [N/A] Order 缺漏欄位（B2）：Miles 拍板另案
- [ ] OrderPaymentRecord 處置：**MCP 無 page 刪除工具，8 列待 Miles UI 手動刪除後再 drop enum 選項**。8 列 URL：
  - payment_method https://app.notion.com/p/32c3886511fa8113bdc7fb04cfbc6602
  - order_id https://app.notion.com/p/32c3886511fa81189521d744c97f96d5
  - amount https://app.notion.com/p/32c3886511fa81509bbaf83aa5d143d5
  - notes https://app.notion.com/p/32c3886511fa8168aa6ffa7031f68c51
  - record_type https://app.notion.com/p/32c3886511fa81c098a6cfefb3cb352e
  - recorded_by https://app.notion.com/p/32c3886511fa81cc8fa4ff9076ec53fa
  - id https://app.notion.com/p/32c3886511fa81d7953bd7670972340b
  - payment_date https://app.notion.com/p/32c3886511fa81d58addccc8386e1d10
- [x] 驗證：106 列 create 回應均含正確「資料表」值；payment_status 備註已更新（待 ORD-002 清除）；senior-pm 4 維度（維度 4 一票否決通過）

## senior-pm 評審修正採納（2026-06-03）
1. 欄位數以正本逐列為準（worklist 每實體少算 1，實際 106）— 已採納
2. audit_log（物件[]）/ attachments（字串[]）/ payload（物件）→ 型別 JSON + 說明保留正本型別字樣 — 已採納
3. 說明欄 wiki link [[...]] 轉純文字 — 已採納（推送說明無 [[]]）
4. Order B1 措辭引正本 line 4073 — 已採納
