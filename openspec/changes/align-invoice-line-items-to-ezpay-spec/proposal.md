## Why

ezPay 電子發票 API（[EZP_INVI_1.2.2](../../../memory/erp/ERP_Vault/raw/_attachments/EZP_INVI_1.2.2.pdf)）對發票品項要求五欄全必填（`ItemName` / `ItemCount` / `ItemUnit` / `ItemPrice` / `ItemAmt`），且平台檢核硬性條件「`ItemAmt = ItemCount × ItemPrice`」與「發票金額 = 銷售額 + 稅額」。此為**雙重硬約束**：往上對接的是財政部電子發票整合服務平台 MIG 規範（中華民國法規），ezPay 只是商用代理層。詳細規格與印刷業實務衝突點已歸檔於 raw 卡 [2026-05-26-miles-upload-ezpay-invoice-api-spec](../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)。

目前 Prototype 雖然資料模型已有五欄（`src/types/invoice.ts`），但開立發票 Dialog UI 僅讓使用者輸入「名稱」與「金額」兩欄，缺 `count` / `unit` / `unitPrice` 三欄輸入，預設值會違反 ezPay 檢核「`count × unitPrice = itemAmount`」。同時 OpenSpec `order-management/spec.md` 的 `Invoice.items` 僅標註為 JSON，未明文展開欄位結構，PlannedInvoice 也只有單 `description + scheduledAmount`，缺 `items[]`，阻斷「訂單印件 → PlannedInvoice → Invoice」的鏈式品項帶入。

本 change 補齊 spec 五欄結構 + 跨模組共用單位 LOV + PlannedInvoice 結構升級，讓 Prototype 與 spec 同步對齊法規 / 第三方 API 硬約束。

## What Changes

- **ADDED**：發票品項符合 ezPay 與電子發票法規硬約束（5 欄：name / count / unit / unitPrice / itemAmount；count Int(5)、unitPrice Int(10)、itemAmount = count × unitPrice）
- **ADDED**：跨模組共用單位 LOV（張 / 本 / 冊 / 份 / 個 / 卷 / 盒 / 套 / 批 / 式 / 組，11 項），歸於 `prototype-shared-ui` capability
- **ADDED**：PlannedInvoice 加 `items[]` 結構，`scheduledAmount` 派生為 `sum(items.itemAmount)`
- **ADDED**：訂單印件 → PlannedInvoice 品項預填（建立時帶入，無即時連動）；PlannedInvoice → Invoice 品項預填（沿用既有「一鍵開立」機制擴充）
- **MODIFIED**：開立發票 Dialog UI 行為 — 移除「直接填 itemAmount」，改為「填 count + unit + unitPrice → 系統算 itemAmount」，`unitPrice` label 依 Category 切換（B2B 未稅 / B2C 含稅）
- **MODIFIED**：需求單品項單位欄位改引用共用 LOV（既有 inline 9 項 → 引用 `prototype-shared-ui`）

不在範疇內（Out of Scope）：
- ezPay 真實 API 串接（Prototype 仍 mock）
- 折讓單與作廢發票品項對齊（另開 change）
- 發票作廢時效規則（奇數月 14 日前）

## Capabilities

### New Capabilities
（無新 capability）

### Modified Capabilities
- `order-management`：新增「發票品項硬約束」Requirement + PlannedInvoice 結構升級 + 開立 Dialog 行為調整
- `prototype-shared-ui`：新增「共用單位 LOV」Requirement
- `quote-request`：需求單品項單位欄位改引用共用 LOV

## Impact

- **規格**：order-management spec、prototype-shared-ui spec、quote-request spec 同步異動
- **Prototype 程式**：
  - 新增 `src/types/unitOption.ts`（或併入 `src/types/shared.ts`）共用單位 enum
  - 改 `src/components/order/OrderInvoiceSection.tsx` 開立發票 Dialog 品項表單（補三欄 + itemAmount 計算 disabled）
  - 改 PlannedInvoice 建立 / 編輯 Dialog（支援 items[] + 訂單印件帶入）
  - 改 `src/types/invoice.ts`（unit 型別 `string` → `UnitOption`）
  - 改 `src/types/plannedInvoice.ts`（加 items[]、scheduledAmount 派生）
  - 需求單品項單位欄位改引用共用 enum
- **資料相容**：Prototype 既有 mock invoice 資料需 backfill 三欄（count=1, unit='式', unitPrice=itemAmount 作為遷移預設，再由業務調整）
- **法規對接**：本 change 是 ezPay 真實串接的前置必要條件，但本 change 不串接
- **Raw 參考**：[ezPay API 規格 v1.2.2 raw 卡](../../../memory/erp/ERP_Vault/raw/2026-05-26-miles-upload-ezpay-invoice-api-spec.md)（含本地 PDF 連結）
