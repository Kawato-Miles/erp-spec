## ADDED Requirements

### Requirement: 發票品項符合 ezPay 與電子發票法規硬約束

Invoice.items 陣列 SHALL 對齊 ezPay 電子發票 API（[EZP_INVI_1.2.2](../../../../memory/erp/ERP_Vault/raw/_attachments/EZP_INVI_1.2.2.pdf)）對品項的五欄結構要求 + 平台檢核硬性條件。法規源頭：財政部電子發票整合服務平台 MIG（Message Implementation Guideline）。詳細規格與印刷業實務衝突點參見 raw 卡 [2026-05-26-miles-upload-ezpay-invoice-api-spec](../../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

每個 InvoiceItem MUST 包含五欄：

| 欄位 | 對應藍新 | 型別 | 必填 | 約束 |
|------|---------|------|------|------|
| `name` | ItemName | 字串 (≤ 30) | Y | 商品名稱 |
| `count` | ItemCount | 整數 (Int(5)) | Y | 純整數 ≤ 99999 |
| `unit` | ItemUnit | 列舉 | Y | 必須來自 `prototype-shared-ui` 的共用單位 LOV（≤ 2 中文字 / ≤ 6 英數字符合 ezPay Varchar(2)）|
| `unitPrice` | ItemPrice | 整數 (Int(10)) | Y | 純整數；B2B 為未稅金額 / B2C 為含稅金額 |
| `itemAmount` | ItemAmt | 整數 (Int(10)) | Y | 系統計算 = `count × unitPrice`，業務不可手動覆寫 |

平台檢核硬性條件（不可違反）：

- `itemAmount = count × unitPrice`（每筆品項皆須成立）
- `Invoice.totalAmount = Invoice.salesAmount + Invoice.taxAmount`（既有規則，與本 change 無關但仍須符合）

#### Scenario: 業務開立發票時五欄全部必填

- **GIVEN** 業務於訂單詳情頁點擊「開立發票」打開 Dialog
- **WHEN** 業務新增一筆品項但未填寫 `count` / `unit` / `unitPrice` 任一欄
- **THEN** 系統 SHALL 顯示該欄位錯誤提示
- **AND** 系統 MUST NOT 允許送出表單

#### Scenario: itemAmount 由系統計算且業務不可手動覆寫

- **GIVEN** 業務輸入 `count = 5`、`unitPrice = 1500`
- **WHEN** 系統渲染品項列
- **THEN** `itemAmount` 欄位 SHALL 自動顯示 `7500`
- **AND** `itemAmount` 欄位輸入框 SHALL 為 disabled 狀態，業務無法手動修改
- **AND** 業務修改 `count` 或 `unitPrice` 時 `itemAmount` SHALL 即時重新計算

#### Scenario: count 純整數且 ≤ 99999

- **GIVEN** 業務於品項列輸入 `count`
- **WHEN** 業務嘗試輸入小數（如 `5.5`）或負數
- **THEN** 系統 SHALL 拒絕輸入並顯示「數量必須為正整數」
- **WHEN** 業務嘗試輸入超過 99999 的值
- **THEN** 系統 SHALL 顯示「數量上限 99999；超量請拆分多筆品項或改用更大單位」

#### Scenario: unitPrice 純整數，前端 lint 擋小數

- **GIVEN** 業務於品項列輸入 `unitPrice`
- **WHEN** 業務嘗試輸入小數（如 `0.5`）
- **THEN** 系統 SHALL 拒絕輸入並顯示「單價必須為正整數；如為小數計價（如每張 0.5 元）建議改用較大單位（如『每千張 500 元』）」
- **AND** 業務修改後系統 SHALL 即時重算 `itemAmount`

#### Scenario: unit 來自共用 LOV，dropdown 強制選擇

- **GIVEN** 業務於品項列要選擇 `unit`
- **WHEN** 業務點擊單位欄位
- **THEN** 系統 SHALL 顯示 dropdown，選項來自 [`prototype-shared-ui` § 共用單位 LOV](../prototype-shared-ui/spec.md)
- **AND** 業務 SHALL NOT 自由輸入文字（防止填入超出 ezPay Varchar(2) 限制的值）

#### Scenario: unitPrice label 依 Category 切換稅基提示

- **GIVEN** 業務於 Dialog 選擇 `category = B2B`
- **WHEN** 系統渲染品項列 `unitPrice` 輸入框
- **THEN** label SHALL 顯示「單價（未稅）」
- **WHEN** 業務切換 `category = B2C`
- **THEN** label SHALL 即時切換為「單價（含稅）」
- **AND** 已輸入的 `unitPrice` 值 SHALL NOT 自動換算（業務需手動確認金額重新填入）

### Requirement: PlannedInvoice 品項鏈式預填

業務 / 諮詢建立 PlannedInvoice 時 SHALL 可從訂單印件清單預填 `items[]`，使用者可編輯預填內容；後續訂單印件異動 SHALL NOT 即時連動至已建立的 PlannedInvoice。實際開立 Invoice 時，若由 PlannedInvoice 「一鍵開立」觸發 SHALL 將 PlannedInvoice.items 預填至 Invoice.items，使用者可編輯。

#### Scenario: 建立 PlannedInvoice 時從訂單印件預填 items

- **GIVEN** 訂單包含 3 筆印件（PrintItem A 數量 1000 張、B 數量 5000 張、C 數量 500 本）
- **WHEN** 業務點擊「新增預計發票」打開 Dialog
- **THEN** 系統 SHALL 預填 3 筆 InvoiceItem 候選（name = 印件名稱、count = 印件數量、unit = 印件單位、unitPrice = 印件未稅單價、itemAmount 自動計算）
- **AND** 業務 SHALL 可勾選 / 取消勾選候選項，或編輯任一欄位
- **AND** 業務 SHALL 可手動新增不對應印件的品項（如「製版費」「運費」）

#### Scenario: 印件異動不連動到已建立的 PlannedInvoice

- **GIVEN** PlannedInvoice P-001 已從印件 A 預填（count = 1000）
- **WHEN** 業務將印件 A 的數量改為 2000
- **THEN** 系統 SHALL NOT 修改 P-001.items 中的 count 值
- **AND** P-001.items 維持原預填內容
- **AND** UI 在 PlannedInvoice 編輯介面 SHALL 顯示 hint「品項複製自訂單印件，後續異動需手動同步」

#### Scenario: Invoice 一鍵開立沿用 PlannedInvoice items

- **GIVEN** PlannedInvoice P-001 已規劃 items 含 3 筆品項
- **WHEN** 業務點擊「一鍵開立」按鈕
- **THEN** 系統 SHALL 開啟開立發票 Dialog，items 區塊預填 P-001.items 全部 3 筆內容
- **AND** 業務 SHALL 可編輯任一品項欄位或新增 / 移除品項
- **AND** 開立完成後 Invoice.items 為業務最終確認的內容（非 P-001.items 原值）

#### Scenario: 不從預計發票開立時手動建立品項

- **GIVEN** 業務點擊「手動開立（不關聯預計）」按鈕
- **WHEN** 系統渲染品項區塊
- **THEN** 系統 SHALL 顯示空品項列 + 「新增品項」按鈕
- **AND** 系統 SHALL NOT 顯示「從訂單印件帶入」按鈕（訂單印件帶入僅支援透過 PlannedInvoice 路徑，避免兩條入口造成業務流程混淆）
- **AND** 業務 SHALL 手動逐筆輸入品項；如需印件預填應先建立 PlannedInvoice 再透過「一鍵開立」

## MODIFIED Requirements

### Requirement: 發票開立（藍新 Mockup）

業務 / 諮詢 SHALL 可於訂單詳情頁開立電子發票。系統送藍新（Mockup）時帶入 BillingCompany.ezpay_merchant_id 對應的 MerchantID_，自訂編號（MerchantOrderNo）格式為 `{order_no}-INV-{流水}`，限英數 + 底線、20 字元內。藍新 Mockup 回傳 InvoiceTransNo（17 碼時間戳）、InvoiceNumber（兩碼大寫英文 + 8 碼數字遞增）、RandomNum（4 碼隨機）、CreateTime。發票時序與 PaymentPlan / Payment 解耦：可先開後收、後收先開、合併（多筆 Payment 對一張 Invoice）、拆分（一筆 Payment 對多張 Invoice）。

**品項欄位送藍新對應**（本次新增）：每張 Invoice.items 陣列轉換為藍新 PostData 五欄序列（`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`），多項以 `|` 分隔。送出前 SHALL 通過「發票品項符合 ezPay 與電子發票法規硬約束」Requirement 全部 Scenario 驗證。

#### Scenario: 業務開立 B2B 發票

- **WHEN** 業務於訂單詳情頁點擊「開立發票」，選擇 B2B、填入買方統編、品項列輸入 name + count + unit + unitPrice（unitPrice 為未稅金額）
- **THEN** 系統 SHALL 建立 Invoice 紀錄，category = B2B、buyer_ubn = 統編
- **AND** 系統 MUST 產生 ezpay_merchant_order_no = `{order_no}-INV-01`
- **AND** Mockup 回傳 SHALL 寫入 invoice_number（如 AB10000001）、ezpay_invoice_trans_no、random_num
- **AND** Invoice.status SHALL = 開立
- **AND** Invoice.items 每筆 itemAmount SHALL = count × unitPrice

#### Scenario: 業務拆分一筆收款開兩張發票

- **GIVEN** 訂單有一筆 Payment 100,000
- **WHEN** 業務開立兩張 Invoice 各 50,000，於 PaymentInvoice junction 各關聯該 Payment 50,000
- **THEN** 系統 SHALL 允許並驗證 ∑(PaymentInvoice.amount where payment_id = X) ≤ Payment.amount
- **AND** 兩張 Invoice 各自的 items 陣列 SHALL 獨立填寫（業務自行分配品項至兩張發票）

#### Scenario: 業務合併多筆收款開一張發票

- **GIVEN** 訂單有 Payment #1 = 30,000、Payment #2 = 70,000
- **WHEN** 業務開立 Invoice = 100,000，於 PaymentInvoice junction 各關聯一筆
- **THEN** 系統 SHALL 允許並寫入兩筆 PaymentInvoice 紀錄
- **AND** Invoice.items 為業務手動輸入或從 PlannedInvoice / 訂單印件帶入的單一品項清單

#### Scenario: 業務先開發票後收款

- **WHEN** 業務於 Payment 為空時開立 Invoice
- **THEN** 系統 SHALL 允許，PaymentInvoice 暫無記錄
- **AND** 後續 Payment 建立時，業務 SHALL 可手動關聯到該 Invoice

#### Scenario: 業務開立 B2C 發票時單價為含稅金額

- **GIVEN** 業務於 Dialog 選擇 category = B2C
- **WHEN** 業務於品項列輸入 unitPrice = 1050（含 5% 稅）
- **THEN** 系統 SHALL 將該 unitPrice 視為含稅金額寫入 Invoice.items
- **AND** 系統 SHALL 自動換算 Invoice.salesAmount（未稅）= total / 1.05、taxAmount = total - salesAmount

## ADDED Data Model

### InvoiceItem（發票品項子結構，對應 Invoice.items[]）

> Invoice 實體 `items` 欄位陣列元素的明文展開結構。對應藍新 EZP_INVI 1.2.2 § 4-(一)-3 PostData ItemName / ItemCount / ItemUnit / ItemPrice / ItemAmt 五欄。

| 欄位 | 英文名稱 | 對應藍新 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|---------|------|------|------|------|
| 商品名稱 | name | ItemName | 字串 (≤ 30) | Y | | 例：彩色名片 |
| 商品數量 | count | ItemCount | 整數 | Y | | 純整數，0 < count ≤ 99999 |
| 商品單位 | unit | ItemUnit | 列舉 | Y | | 來自 [prototype-shared-ui § 共用單位 LOV](../prototype-shared-ui/spec.md) |
| 商品單價 | unitPrice | ItemPrice | 整數 | Y | | B2B 為未稅 / B2C 為含稅；純整數 |
| 商品小計 | itemAmount | ItemAmt | 整數 | Y | Y | 系統計算 = count × unitPrice |

**送藍新對應**：Invoice.items 陣列 N 筆品項轉成藍新 PostData 五欄字串時，以 `|` 為分隔符（例：`ItemName="商品一|商品二"` / `ItemCount="1|2"`）。

### PlannedInvoice（預計發票）

> 對應 Prototype `src/types/plannedInvoice.ts`，spec 過去未定義，本 change 補齊 + 加 `items[]` 欄位。
> 業務款項管理需求來源：業務需知道「哪些訂單還沒開發票」「預計幾號要開」；一張訂單通常有多筆預計發票（訂金 / 中期 / 尾款 / 加印），每筆獨立紀錄。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 識別碼 | id | UUID | Y | Y | 主鍵 |
| 所屬訂單 | order_id | FK | Y | Y | FK → 訂單 |
| 預計開立日 | expected_date | 日期 | Y | | 業務規劃時填寫 |
| 描述 | description | 字串 | Y | | 例：訂金發票 / 尾款發票 / 加印發票 |
| 品項明細 | items | InvoiceItem[] | Y | | 預計品項清單，建立時從訂單印件預填，可編輯；結構同 [InvoiceItem](#invoiceitem發票品項子結構對應-invoiceitems) |
| 預計金額（含稅）| scheduled_amount | 整數 | Y | Y（derived）| = sum(items.itemAmount)（B2C 含稅模式直接加總；B2B 模式為未稅小計加總 + 稅，計算規則對齊 Invoice 邏輯）|
| 狀態 | status | 單選 | Y | | 預計開立 / 已開立 / 已取消 |
| 已開立發票連結 | linked_invoice_id | FK | | | FK → Invoice；status = 已開立時必填 |
| 取消原因 | cancel_reason | 字串 | | | status = 已取消時填入 |
| 建立人 | created_by | 字串 | Y | Y | |
| 建立時間 | created_at | 日期時間 | Y | Y | |
| 更新時間 | updated_at | 日期時間 | Y | Y | |

**狀態轉換**：

```
預計開立 ─[業務開立發票]─▶ 已開立（linked_invoice_id 寫入）
預計開立 ─[業務取消]──────▶ 已取消（cancel_reason 必填）
已開立 → 不可回退（發票本身可作廢，但 PlannedInvoice 不變）
```

## MODIFIED Data Model

### Invoice（統一發票）— `items` 欄位描述更新

> 整個 Invoice 表格其他欄位不變，僅 `items` 欄位的「型別」與「說明」更新。

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 商品明細 | items | InvoiceItem[] | Y | | 結構同 [InvoiceItem](#invoiceitem發票品項子結構對應-invoiceitems)；可從 PlannedInvoice.items 或訂單印件預填，業務可編輯 |

**變更前**：

| 欄位 | 英文名稱 | 型別 | 必填 | 唯讀 | 說明 |
|------|---------|------|------|------|------|
| 商品明細 | items | JSON | Y | | 自訂單印件帶入可編輯 |
